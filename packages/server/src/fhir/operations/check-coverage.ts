// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { WithId } from '@medplum/core';
import {
  allOk,
  badRequest,
  buildKenyaCoverageEligibilityExtension,
  createReference,
  OperationOutcomeError,
} from '@medplum/core';
import type { FhirRequest, FhirResponse } from '@medplum/fhir-router';
import type {
  AuditEvent,
  Coverage,
  CoverageEligibilityRequest,
  CoverageEligibilityResponse,
  OperationDefinition,
  Patient,
  Practitioner,
  Organization,
  Reference,
  Task,
} from '@medplum/fhirtypes';
import { randomUUID } from 'node:crypto';
import { getAuthenticatedContext } from '../../context';
import { getProjectCountryPack } from '../../country-pack/registry';
import type { CheckCoverageResult } from '../../country-pack/types';
import {
  AuditEventOutcome,
  createAuditEvent,
  OperationInteraction,
  RestfulOperationType,
} from '../../util/auditevent';
import { buildOutputParameters, parseInputParameters } from './utils/parameters';

export const checkCoverageOperation: OperationDefinition = {
  resourceType: 'OperationDefinition',
  id: 'coverage-check-coverage',
  name: 'CheckCoverage',
  title: 'Check Coverage',
  status: 'active',
  kind: 'operation',
  code: 'check-coverage',
  resource: ['Coverage'],
  system: false,
  type: true,
  instance: true,
  affectsState: true,
  parameter: [
    { use: 'in', name: 'coverage', type: 'Reference', min: 0, max: '1' },
    { use: 'out', name: 'status', type: 'code', min: 1, max: '1' },
    { use: 'out', name: 'correlationId', type: 'string', min: 1, max: '1' },
    { use: 'out', name: 'message', type: 'string', min: 1, max: '1' },
    { use: 'out', name: 'nextState', type: 'string', min: 1, max: '1' },
    { use: 'out', name: 'countryPack', type: 'string', min: 1, max: '1' },
    { use: 'out', name: 'identificationType', type: 'string', min: 0, max: '1' },
    { use: 'out', name: 'identificationNumber', type: 'string', min: 0, max: '1' },
    { use: 'out', name: 'eligible', type: 'boolean', min: 0, max: '1' },
    { use: 'out', name: 'fullName', type: 'string', min: 0, max: '1' },
    { use: 'out', name: 'reason', type: 'string', min: 0, max: '1' },
    { use: 'out', name: 'possibleSolution', type: 'string', min: 0, max: '1' },
    { use: 'out', name: 'coverageEndDate', type: 'string', min: 0, max: '1' },
    { use: 'out', name: 'transitionStatus', type: 'string', min: 0, max: '1' },
    { use: 'out', name: 'requestId', type: 'string', min: 0, max: '1' },
    { use: 'out', name: 'requestIdNumber', type: 'string', min: 0, max: '1' },
    { use: 'out', name: 'requestIdType', type: 'string', min: 0, max: '1' },
    { use: 'out', name: 'rawResponse', type: 'string', min: 0, max: '1' },
    { use: 'out', name: 'coverageEligibilityRequest', type: 'Reference', min: 0, max: '1' },
    { use: 'out', name: 'coverageEligibilityResponse', type: 'Reference', min: 0, max: '1' },
    { use: 'out', name: 'task', type: 'Reference', min: 0, max: '1' },
  ],
};

interface CheckCoverageParameters {
  readonly coverage?: Reference<Coverage>;
}

function getCoverageInsurer(coverage: WithId<Coverage>): Reference<Organization> {
  const payor = coverage.payor?.find((ref) => ref.reference?.startsWith('Organization/'));
  if (!payor) {
    throw new OperationOutcomeError(badRequest('Coverage must include an Organization payor before eligibility checks.'));
  }
  return payor as Reference<Organization>;
}

export async function checkCoverageHandler(req: FhirRequest): Promise<FhirResponse> {
  const ctx = getAuthenticatedContext();
  const countryPack = getProjectCountryPack(ctx.project);
  if (!countryPack) {
    throw new OperationOutcomeError(badRequest('Project does not have a country pack configured.'));
  }

  if (!countryPack.checkCoverage) {
    throw new OperationOutcomeError(badRequest(`Country pack "${countryPack.id}" does not implement check-coverage.`));
  }

  const coverage = await getCoverageForCheck(req);
  const correlationId = randomUUID();
  const task = await createCoverageTask(coverage, correlationId);
  const result = await countryPack.checkCoverage({
    ctx,
    coverage,
    correlationId,
  });
  const eligibilityRequest = await createCoverageEligibilityRequestResource(coverage, result);
  const eligibilityResponse = await createCoverageEligibilityResponseResource(coverage, eligibilityRequest, result);
  const updatedTask = await completeCoverageTask(task, result);
  const updatedCoverage = await persistCoverageResult(coverage, updatedTask, eligibilityRequest, eligibilityResponse, result);
  await createCoverageAuditEvent(updatedTask, updatedCoverage, result);

  return [
    allOk,
    buildOutputParameters(checkCoverageOperation, {
      ...result,
      coverageEligibilityRequest: createReference(eligibilityRequest),
      coverageEligibilityResponse: createReference(eligibilityResponse),
      task: createReference(updatedTask),
    }),
  ];
}

async function getCoverageForCheck(req: FhirRequest): Promise<WithId<Coverage>> {
  const ctx = getAuthenticatedContext();
  const { id } = req.params;
  if (id) {
    return ctx.repo.readResource<Coverage>('Coverage', id);
  }

  const params = parseInputParameters<CheckCoverageParameters>(checkCoverageOperation, req);
  if (params.coverage?.reference) {
    return ctx.repo.readReference<Coverage>(params.coverage);
  }

  throw new OperationOutcomeError(badRequest('Must call this operation on a Coverage instance or include a coverage reference.'));
}

async function createCoverageTask(coverage: WithId<Coverage>, correlationId: string): Promise<WithId<Task>> {
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
    focus: createReference(coverage),
    description: `Check coverage eligibility for ${coverage.id}`,
    code: {
      text: 'check-coverage',
    },
    businessStatus: {
      text: 'requested',
    },
    identifier: [{ system: 'https://afiax.africa/identifier/correlation-id', value: correlationId }],
  });
}

async function createCoverageEligibilityRequestResource(
  coverage: WithId<Coverage>,
  result: CheckCoverageResult
): Promise<WithId<CoverageEligibilityRequest>> {
  const ctx = getAuthenticatedContext();
  const insurer = getCoverageInsurer(coverage);
  return ctx.systemRepo.createResource<CoverageEligibilityRequest>({
    resourceType: 'CoverageEligibilityRequest',
    meta: {
      project: ctx.project.id,
    },
    status: 'active',
    purpose: ['validation'],
    patient: coverage.beneficiary as Reference<Patient>,
    created: new Date().toISOString(),
    enterer: ctx.profile as CoverageEligibilityRequest['enterer'],
    provider: ctx.profile as Reference<Practitioner>,
    insurer,
    insurance: [
      {
        focal: true,
        coverage: createReference(coverage),
      },
    ],
    identifier: result.correlationId
      ? [{ system: 'https://afiax.africa/identifier/correlation-id', value: result.correlationId }]
      : undefined,
  });
}

async function createCoverageEligibilityResponseResource(
  coverage: WithId<Coverage>,
  eligibilityRequest: WithId<CoverageEligibilityRequest>,
  result: CheckCoverageResult
): Promise<WithId<CoverageEligibilityResponse>> {
  const ctx = getAuthenticatedContext();
  const insurer = getCoverageInsurer(coverage);
  return ctx.systemRepo.createResource<CoverageEligibilityResponse>({
    resourceType: 'CoverageEligibilityResponse',
    meta: {
      project: ctx.project.id,
    },
    status: 'active',
    purpose: ['validation'],
    patient: coverage.beneficiary as Reference<Patient>,
    created: new Date().toISOString(),
    request: createReference(eligibilityRequest),
    outcome: result.status === 'error' ? 'error' : 'complete',
    disposition: result.message,
    insurer,
    requestor: ctx.profile as CoverageEligibilityResponse['requestor'],
    insurance: [
      {
        coverage: createReference(coverage),
        inforce: result.eligible,
        benefitPeriod: result.coverageEndDate ? { end: result.coverageEndDate } : undefined,
      },
    ],
    preAuthRef: result.requestId,
  });
}

async function completeCoverageTask(task: WithId<Task>, result: CheckCoverageResult): Promise<WithId<Task>> {
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
      {
        type: { text: 'correlationId' },
        valueString: result.correlationId,
      },
      {
        type: { text: 'status' },
        valueString: result.status,
      },
      {
        type: { text: 'message' },
        valueString: result.message,
      },
      {
        type: { text: 'nextState' },
        valueString: result.nextState,
      },
    ],
  });
}

async function persistCoverageResult(
  coverage: WithId<Coverage>,
  task: WithId<Task>,
  eligibilityRequest: WithId<CoverageEligibilityRequest>,
  eligibilityResponse: WithId<CoverageEligibilityResponse>,
  result: CheckCoverageResult
): Promise<WithId<Coverage>> {
  const ctx = getAuthenticatedContext();
  const checkedAt = new Date().toISOString();
  const extension = buildKenyaCoverageEligibilityExtension(result, checkedAt, {
    task: createReference(task),
    eligibilityRequest: createReference(eligibilityRequest),
    eligibilityResponse: createReference(eligibilityResponse),
  });
  const otherExtensions = coverage.extension?.filter((ext) => ext.url !== extension.url) ?? [];

  return ctx.systemRepo.updateResource<Coverage>({
    ...coverage,
    extension: [...otherExtensions, extension],
  });
}

async function createCoverageAuditEvent(
  task: WithId<Task>,
  coverage: WithId<Coverage>,
  result: CheckCoverageResult
): Promise<void> {
  const ctx = getAuthenticatedContext();
  const outcome =
    result.status === 'eligible'
      ? AuditEventOutcome.Success
      : result.status === 'error'
        ? AuditEventOutcome.MajorFailure
        : AuditEventOutcome.MinorFailure;

  const auditEvent = createAuditEvent(RestfulOperationType, OperationInteraction, ctx.project.id, ctx.profile, undefined, outcome, {
    description: result.message,
    resource: createReference(task),
  });

  auditEvent.entity = [
    ...(auditEvent.entity ?? []),
    {
      what: createReference(coverage),
    },
  ];

  await ctx.systemRepo.createResource<AuditEvent>(auditEvent);
}
