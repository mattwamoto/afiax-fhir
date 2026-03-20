// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { WithId } from '@medplum/core';
import {
  allOk,
  badRequest,
  buildKenyaNationalClaimSubmissionExtension,
  createReference,
  OperationOutcomeError,
} from '@medplum/core';
import type { FhirRequest, FhirResponse } from '@medplum/fhir-router';
import type { AuditEvent, Claim, OperationDefinition, Reference, Task } from '@medplum/fhirtypes';
import { randomUUID } from 'node:crypto';
import { getAuthenticatedContext } from '../../context';
import { getProjectCountryPack } from '../../country-pack/registry';
import type { SubmitNationalClaimResult } from '../../country-pack/types';
import {
  AuditEventOutcome,
  createAuditEvent,
  OperationInteraction,
  RestfulOperationType,
} from '../../util/auditevent';
import { buildOutputParameters, parseInputParameters } from './utils/parameters';

export const submitNationalClaimOperation: OperationDefinition = {
  resourceType: 'OperationDefinition',
  id: 'claim-submit-national-claim',
  name: 'SubmitNationalClaim',
  title: 'Submit National Claim',
  status: 'active',
  kind: 'operation',
  code: 'submit-national-claim',
  resource: ['Claim'],
  system: false,
  type: true,
  instance: true,
  affectsState: true,
  parameter: [
    { use: 'in', name: 'claim', type: 'Reference', min: 0, max: '1' },
    { use: 'out', name: 'status', type: 'code', min: 1, max: '1' },
    { use: 'out', name: 'correlationId', type: 'string', min: 1, max: '1' },
    { use: 'out', name: 'message', type: 'string', min: 1, max: '1' },
    { use: 'out', name: 'nextState', type: 'string', min: 1, max: '1' },
    { use: 'out', name: 'countryPack', type: 'string', min: 1, max: '1' },
    { use: 'out', name: 'shaClaimsEnvironment', type: 'string', min: 0, max: '1' },
    { use: 'out', name: 'submissionEndpoint', type: 'string', min: 0, max: '1' },
    { use: 'out', name: 'statusTrackingEndpoint', type: 'string', min: 0, max: '1' },
    { use: 'out', name: 'responseStatusCode', type: 'integer', min: 0, max: '1' },
    { use: 'out', name: 'bundleId', type: 'string', min: 0, max: '1' },
    { use: 'out', name: 'bundleEntryCount', type: 'integer', min: 0, max: '1' },
    { use: 'out', name: 'rawBundle', type: 'string', min: 0, max: '1' },
    { use: 'out', name: 'rawResponse', type: 'string', min: 0, max: '1' },
    { use: 'out', name: 'task', type: 'Reference', min: 0, max: '1' },
  ],
};

interface SubmitNationalClaimParameters {
  readonly claim?: Reference<Claim>;
}

export async function submitNationalClaimHandler(req: FhirRequest): Promise<FhirResponse> {
  const ctx = getAuthenticatedContext();
  const countryPack = getProjectCountryPack(ctx.project);
  if (!countryPack) {
    throw new OperationOutcomeError(badRequest('Project does not have a country pack configured.'));
  }

  if (!countryPack.submitNationalClaim) {
    throw new OperationOutcomeError(badRequest(`Country pack "${countryPack.id}" does not implement submit-national-claim.`));
  }

  const claim = await getClaimForSubmission(req);
  const correlationId = randomUUID();
  const task = await createClaimTask(claim, correlationId);
  const result = await countryPack.submitNationalClaim({
    ctx,
    claim,
    correlationId,
  });
  const updatedTask = await completeClaimTask(task, result);
  const updatedClaim = await persistClaimResult(claim, updatedTask, result);
  await createClaimAuditEvent(updatedTask, updatedClaim, result);

  return [allOk, buildOutputParameters(submitNationalClaimOperation, { ...result, task: createReference(updatedTask) })];
}

async function getClaimForSubmission(req: FhirRequest): Promise<WithId<Claim>> {
  const ctx = getAuthenticatedContext();
  const { id } = req.params;
  if (id) {
    return ctx.repo.readResource<Claim>('Claim', id);
  }

  const params = parseInputParameters<SubmitNationalClaimParameters>(submitNationalClaimOperation, req);
  if (params.claim?.reference) {
    return ctx.repo.readReference<Claim>(params.claim);
  }

  throw new OperationOutcomeError(badRequest('Must call this operation on a Claim instance or include a claim reference.'));
}

async function createClaimTask(claim: WithId<Claim>, correlationId: string): Promise<WithId<Task>> {
  const ctx = getAuthenticatedContext();
  return ctx.systemRepo.createResource<Task>({
    resourceType: 'Task',
    meta: {
      project: ctx.project.id,
    },
    intent: 'order',
    status: 'requested',
    authoredOn: new Date().toISOString(),
    requester: ctx.profile as Task['requester'],
    focus: createReference(claim),
    description: `Prepare or submit national claim bundle for ${claim.id}`,
    code: {
      text: 'submit-national-claim',
    },
    businessStatus: {
      text: 'requested',
    },
    identifier: [{ system: 'https://afiax.africa/identifier/correlation-id', value: correlationId }],
  });
}

async function completeClaimTask(task: WithId<Task>, result: SubmitNationalClaimResult): Promise<WithId<Task>> {
  const ctx = getAuthenticatedContext();
  const end = new Date().toISOString();
  return ctx.systemRepo.updateResource<Task>({
    ...task,
    status: result.status === 'error' ? 'failed' : 'completed',
    businessStatus: {
      text: result.status,
    },
    lastModified: end,
    executionPeriod: {
      start: task.authoredOn,
      end,
    },
    output: [
      { type: { text: 'correlationId' }, valueString: result.correlationId },
      { type: { text: 'status' }, valueString: result.status },
      { type: { text: 'message' }, valueString: result.message },
      { type: { text: 'nextState' }, valueString: result.nextState },
      ...(result.bundleId ? [{ type: { text: 'bundleId' }, valueString: result.bundleId }] : []),
      ...(result.submissionEndpoint
        ? [{ type: { text: 'submissionEndpoint' }, valueString: result.submissionEndpoint }]
        : []),
      ...(result.statusTrackingEndpoint
        ? [{ type: { text: 'statusTrackingEndpoint' }, valueString: result.statusTrackingEndpoint }]
        : []),
      ...(result.responseStatusCode !== undefined
        ? [{ type: { text: 'responseStatusCode' }, valueInteger: result.responseStatusCode }]
        : []),
    ],
  });
}

async function persistClaimResult(
  claim: WithId<Claim>,
  task: WithId<Task>,
  result: SubmitNationalClaimResult
): Promise<WithId<Claim>> {
  const ctx = getAuthenticatedContext();
  const submittedAt = new Date().toISOString();
  const extension = buildKenyaNationalClaimSubmissionExtension(result, submittedAt, createReference(task));
  const otherExtensions = claim.extension?.filter((ext) => ext.url !== extension.url) ?? [];

  return ctx.systemRepo.updateResource<Claim>({
    ...claim,
    extension: [...otherExtensions, extension],
  });
}

async function createClaimAuditEvent(
  task: WithId<Task>,
  claim: WithId<Claim>,
  result: SubmitNationalClaimResult
): Promise<void> {
  const ctx = getAuthenticatedContext();
  const outcome =
    result.status === 'error'
      ? AuditEventOutcome.MajorFailure
      : AuditEventOutcome.Success;

  const auditEvent = createAuditEvent(RestfulOperationType, OperationInteraction, ctx.project.id, ctx.profile, undefined, outcome, {
    description: result.message,
    resource: createReference(task),
  });

  auditEvent.entity = [
    ...(auditEvent.entity ?? []),
    {
      what: createReference(claim),
    },
  ];

  await ctx.systemRepo.createResource<AuditEvent>(auditEvent);
}
