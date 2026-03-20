// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { WithId } from '@medplum/core';
import {
  allOk,
  badRequest,
  buildKenyaNationalClaimStatusExtension,
  createReference,
  OperationOutcomeError,
} from '@medplum/core';
import type { FhirRequest, FhirResponse } from '@medplum/fhir-router';
import type {
  AuditEvent,
  Claim,
  ClaimResponse,
  OperationDefinition,
  Reference,
  Task,
} from '@medplum/fhirtypes';
import { randomUUID } from 'node:crypto';
import { getAuthenticatedContext } from '../../context';
import { getProjectCountryPack } from '../../country-pack/registry';
import type { CheckNationalClaimStatusResult } from '../../country-pack/types';
import {
  AuditEventOutcome,
  createAuditEvent,
  OperationInteraction,
  RestfulOperationType,
} from '../../util/auditevent';
import { buildOutputParameters, parseInputParameters } from './utils/parameters';

export const checkNationalClaimStatusOperation: OperationDefinition = {
  resourceType: 'OperationDefinition',
  id: 'claim-check-national-claim-status',
  name: 'CheckNationalClaimStatus',
  title: 'Check National Claim Status',
  status: 'active',
  kind: 'operation',
  code: 'check-national-claim-status',
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
    { use: 'out', name: 'statusEndpoint', type: 'string', min: 0, max: '1' },
    { use: 'out', name: 'responseStatusCode', type: 'integer', min: 0, max: '1' },
    { use: 'out', name: 'claimId', type: 'string', min: 0, max: '1' },
    { use: 'out', name: 'claimState', type: 'string', min: 0, max: '1' },
    { use: 'out', name: 'rawResponse', type: 'string', min: 0, max: '1' },
    { use: 'out', name: 'claimResponse', type: 'Reference', min: 0, max: '1' },
    { use: 'out', name: 'workflowBot', type: 'string', min: 0, max: '1' },
    { use: 'out', name: 'workflowBotStatus', type: 'code', min: 0, max: '1' },
    { use: 'out', name: 'workflowBotMessage', type: 'string', min: 0, max: '1' },
    { use: 'out', name: 'task', type: 'Reference', min: 0, max: '1' },
  ],
};

interface CheckNationalClaimStatusParameters {
  readonly claim?: Reference<Claim>;
}

export async function checkNationalClaimStatusHandler(req: FhirRequest): Promise<FhirResponse> {
  const ctx = getAuthenticatedContext();
  const countryPack = getProjectCountryPack(ctx.project);
  if (!countryPack) {
    throw new OperationOutcomeError(badRequest('Project does not have a country pack configured.'));
  }

  if (!countryPack.checkNationalClaimStatus) {
    throw new OperationOutcomeError(
      badRequest(`Country pack "${countryPack.id}" does not implement check-national-claim-status.`)
    );
  }

  const claim = await getClaimForStatusCheck(req);
  const correlationId = randomUUID();
  const task = await createClaimStatusTask(claim, correlationId);
  const result = await countryPack.checkNationalClaimStatus({
    ctx,
    claim,
    correlationId,
  });
  const updatedTask = await completeClaimStatusTask(task, result);
  const updatedClaim = await persistClaimStatusResult(claim, updatedTask, result);
  await createClaimStatusAuditEvent(updatedTask, updatedClaim, result);

  return [allOk, buildOutputParameters(checkNationalClaimStatusOperation, { ...result, task: createReference(updatedTask) })];
}

async function getClaimForStatusCheck(req: FhirRequest): Promise<WithId<Claim>> {
  const ctx = getAuthenticatedContext();
  const { id } = req.params;
  if (id) {
    return ctx.repo.readResource<Claim>('Claim', id);
  }

  const params = parseInputParameters<CheckNationalClaimStatusParameters>(checkNationalClaimStatusOperation, req);
  if (params.claim?.reference) {
    return ctx.repo.readReference<Claim>(params.claim);
  }

  throw new OperationOutcomeError(badRequest('Must call this operation on a Claim instance or include a claim reference.'));
}

async function createClaimStatusTask(claim: WithId<Claim>, correlationId: string): Promise<WithId<Task>> {
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
    description: `Check national claim status for ${claim.id}`,
    code: {
      text: 'check-national-claim-status',
    },
    businessStatus: {
      text: 'requested',
    },
    identifier: [{ system: 'https://afiax.africa/identifier/correlation-id', value: correlationId }],
  });
}

async function completeClaimStatusTask(task: WithId<Task>, result: CheckNationalClaimStatusResult): Promise<WithId<Task>> {
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
      ...(result.statusEndpoint ? [{ type: { text: 'statusEndpoint' }, valueString: result.statusEndpoint }] : []),
      ...(result.responseStatusCode !== undefined
        ? [{ type: { text: 'responseStatusCode' }, valueInteger: result.responseStatusCode }]
        : []),
      ...(result.claimId ? [{ type: { text: 'claimId' }, valueString: result.claimId }] : []),
      ...(result.claimState ? [{ type: { text: 'claimState' }, valueString: result.claimState }] : []),
      ...(result.claimResponse ? [{ type: { text: 'claimResponse' }, valueReference: result.claimResponse }] : []),
      ...(result.workflowBot ? [{ type: { text: 'workflowBot' }, valueString: result.workflowBot }] : []),
      ...(result.workflowBotStatus
        ? [{ type: { text: 'workflowBotStatus' }, valueString: result.workflowBotStatus }]
        : []),
      ...(result.workflowBotMessage
        ? [{ type: { text: 'workflowBotMessage' }, valueString: result.workflowBotMessage }]
        : []),
    ],
  });
}

async function persistClaimStatusResult(
  claim: WithId<Claim>,
  task: WithId<Task>,
  result: CheckNationalClaimStatusResult
): Promise<WithId<Claim>> {
  const ctx = getAuthenticatedContext();
  const checkedAt = new Date().toISOString();
  const extension = buildKenyaNationalClaimStatusExtension(result, checkedAt, {
    task: createReference(task),
    claimResponse: result.claimResponse,
  });
  const otherExtensions = claim.extension?.filter((ext) => ext.url !== extension.url) ?? [];

  return ctx.systemRepo.updateResource<Claim>({
    ...claim,
    extension: [...otherExtensions, extension],
  });
}

async function createClaimStatusAuditEvent(
  task: WithId<Task>,
  claim: WithId<Claim>,
  result: CheckNationalClaimStatusResult
): Promise<void> {
  const ctx = getAuthenticatedContext();
  const outcome =
    result.status === 'adjudicated'
      ? AuditEventOutcome.Success
      : result.status === 'error'
        ? AuditEventOutcome.MajorFailure
        : result.status === 'rejected'
          ? AuditEventOutcome.MinorFailure
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
    ...(result.claimResponse ? [{ what: result.claimResponse as Reference<ClaimResponse> }] : []),
  ];

  await ctx.systemRepo.createResource<AuditEvent>(auditEvent);
}
