// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import {
  createReference,
  getKenyaNationalClaimSubmissionSnapshot,
  normalizeErrorString,
  Operator,
} from '@medplum/core';
import type { ClaimResponse, Identifier, Project } from '@medplum/fhirtypes';
import { checkKenyaShaClaimStatus, getKenyaShaClaimsCredentials } from './sha';
import { triggerKenyaClaimStatusWorkflowBot } from './workflow-bot';
import type { CheckNationalClaimStatusResult, CountryPackCheckNationalClaimStatusInput } from '../types';

const KenyaShaClaimResponseIdentifierSystem = 'https://afiax.africa/kenya/identifier/sha-claim-id';

function normalizeClaimStatus(claimState: string | undefined, outcome: ClaimResponse['outcome'] | undefined): {
  readonly status: CheckNationalClaimStatusResult['status'];
  readonly nextState: string;
} {
  const normalized = claimState?.trim().toLowerCase() ?? '';

  if (
    normalized.includes('reject') ||
    normalized.includes('declin') ||
    normalized.includes('denied') ||
    outcome === 'error'
  ) {
    return { status: 'rejected', nextState: 'review-denial-or-adjustment' };
  }

  if (
    normalized.includes('review') ||
    normalized.includes('surveillance') ||
    normalized.includes('appeal') ||
    outcome === 'partial'
  ) {
    return { status: 'in-review', nextState: 'awaiting-sha-review' };
  }

  if (
    normalized.includes('approved') ||
    normalized.includes('payment') ||
    normalized.includes('complete') ||
    outcome === 'complete'
  ) {
    return { status: 'adjudicated', nextState: 'ready-for-financial-reconciliation' };
  }

  return { status: 'queued', nextState: 'awaiting-sha-adjudication' };
}

function mergeIdentifier(identifier: Identifier[] | undefined, claimId: string): Identifier[] {
  const next = [...(identifier ?? []).filter((entry) => !(entry.system === KenyaShaClaimResponseIdentifierSystem))];
  next.push({ system: KenyaShaClaimResponseIdentifierSystem, value: claimId });
  return next;
}

function getClaimStatusLookupId(input: CountryPackCheckNationalClaimStatusInput): string | undefined {
  const submission = getKenyaNationalClaimSubmissionSnapshot(input.claim);
  return submission?.bundleId ?? input.claim.id;
}

async function upsertKenyaClaimResponse(
  input: CountryPackCheckNationalClaimStatusInput,
  claimId: string,
  remoteClaimResponse: ClaimResponse | undefined,
  status: CheckNationalClaimStatusResult['status'],
  message: string
): Promise<ClaimResponse | undefined> {
  const insurer = remoteClaimResponse?.insurer ?? input.claim.insurer;
  if (!insurer) {
    throw new Error('Kenya SHA claim status response is missing an insurer reference.');
  }

  const existing = await input.ctx.systemRepo.searchOne<ClaimResponse>({
    resourceType: 'ClaimResponse',
    filters: [
      { code: '_project', operator: Operator.EQUALS, value: input.ctx.project.id },
      { code: 'identifier', operator: Operator.EXACT, value: `${KenyaShaClaimResponseIdentifierSystem}|${claimId}` },
    ],
  });

  const outcome: ClaimResponse['outcome'] =
    status === 'adjudicated' ? 'complete' : status === 'rejected' ? 'error' : 'queued';

  const next: ClaimResponse = {
    ...(remoteClaimResponse ?? {}),
    ...(existing ? { id: existing.id } : undefined),
    resourceType: 'ClaimResponse',
    meta: {
      ...(remoteClaimResponse?.meta ?? existing?.meta ?? {}),
      project: input.ctx.project.id,
    },
    identifier: mergeIdentifier(remoteClaimResponse?.identifier ?? existing?.identifier, claimId),
    status: remoteClaimResponse?.status ?? existing?.status ?? 'active',
    type: remoteClaimResponse?.type ?? input.claim.type,
    use: remoteClaimResponse?.use ?? input.claim.use,
    patient: remoteClaimResponse?.patient ?? input.claim.patient,
    created: remoteClaimResponse?.created ?? existing?.created ?? new Date().toISOString(),
    request: createReference(input.claim),
    outcome: remoteClaimResponse?.outcome ?? existing?.outcome ?? outcome,
    disposition: remoteClaimResponse?.disposition ?? message,
    insurer,
    preAuthRef: remoteClaimResponse?.preAuthRef ?? claimId,
  };

  if (existing?.id) {
    return input.ctx.systemRepo.updateResource<ClaimResponse>(next);
  }

  delete (next as { id?: string }).id;
  return input.ctx.systemRepo.createResource<ClaimResponse>(next);
}

export async function checkKenyaNationalClaimStatus(
  input: CountryPackCheckNationalClaimStatusInput
): Promise<CheckNationalClaimStatusResult> {
  const claimId = getClaimStatusLookupId(input);
  if (!claimId) {
    return {
      status: 'error',
      correlationId: input.correlationId,
      message: 'Claim is missing the Kenya SHA submission snapshot required for status checks.',
      nextState: 'submit-claim-before-status-check',
      countryPack: 'kenya',
    };
  }

  try {
    const project = await input.ctx.systemRepo.readResource<Project>('Project', input.ctx.project.id);
    const credentials = getKenyaShaClaimsCredentials(project);
    const response = await checkKenyaShaClaimStatus(credentials, claimId);
    const claimState = response.claimState ?? response.claimResponse?.outcome ?? 'queued';
    const normalized = normalizeClaimStatus(response.claimState, response.claimResponse?.outcome);
    const message =
      response.message ??
      (normalized.status === 'adjudicated'
        ? 'Kenya SHA claim status is complete.'
        : normalized.status === 'rejected'
          ? 'Kenya SHA claim status indicates rejection or declined payment.'
          : 'Kenya SHA claim is still queued or under review.');

    const claimResponse = await upsertKenyaClaimResponse(input, claimId, response.claimResponse, normalized.status, message);
    const workflowBotResult = await triggerKenyaClaimStatusWorkflowBot(input.ctx, input.claim, {
      status: normalized.status,
      correlationId: input.correlationId,
      message,
      nextState: normalized.nextState,
      countryPack: 'kenya',
      shaClaimsEnvironment: project.setting?.find((entry) => entry.name === 'kenyaShaClaimsEnvironment')?.valueString,
      statusEndpoint: response.statusEndpoint,
      responseStatusCode: response.responseStatusCode,
      claimId,
      claimState: claimState ? String(claimState) : undefined,
      claimResponse: claimResponse ? createReference(claimResponse) : undefined,
      rawResponse: response.rawResponse,
    });

    return {
      status: normalized.status,
      correlationId: input.correlationId,
      message,
      nextState: normalized.nextState,
      countryPack: 'kenya',
      shaClaimsEnvironment: project.setting?.find((entry) => entry.name === 'kenyaShaClaimsEnvironment')?.valueString,
      statusEndpoint: response.statusEndpoint,
      responseStatusCode: response.responseStatusCode,
      claimId,
      claimState: claimState ? String(claimState) : undefined,
      rawResponse: response.rawResponse,
      claimResponse: claimResponse ? createReference(claimResponse) : undefined,
      ...workflowBotResult,
    };
  } catch (err) {
    return {
      status: 'error',
      correlationId: input.correlationId,
      message: `Kenya SHA claim status check failed: ${normalizeErrorString(err)}`,
      nextState: 'retry-or-review-sha-credentials',
      countryPack: 'kenya',
      claimId,
    };
  }
}
