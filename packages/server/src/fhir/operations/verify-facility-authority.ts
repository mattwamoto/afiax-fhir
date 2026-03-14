// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { WithId } from '@medplum/core';
import { allOk, badRequest, createReference, OperationOutcomeError } from '@medplum/core';
import type { FhirRequest, FhirResponse } from '@medplum/fhir-router';
import type { AuditEvent, OperationDefinition, Organization, Reference, Task } from '@medplum/fhirtypes';
import { randomUUID } from 'node:crypto';
import { getAuthenticatedContext } from '../../context';
import { getProjectCountryPack } from '../../country-pack/registry';
import type { VerifyFacilityAuthorityResult } from '../../country-pack/types';
import {
  AuditEventOutcome,
  createAuditEvent,
  OperationInteraction,
  RestfulOperationType,
} from '../../util/auditevent';
import { buildOutputParameters, parseInputParameters } from './utils/parameters';

export const verifyFacilityAuthorityOperation: OperationDefinition = {
  resourceType: 'OperationDefinition',
  id: 'organization-verify-facility-authority',
  name: 'VerifyFacilityAuthority',
  title: 'Verify Facility Authority',
  status: 'active',
  kind: 'operation',
  code: 'verify-facility-authority',
  resource: ['Organization'],
  system: false,
  type: true,
  instance: true,
  affectsState: false,
  parameter: [
    { use: 'in', name: 'organization', type: 'Reference', min: 0, max: '1' },
    { use: 'out', name: 'status', type: 'code', min: 1, max: '1' },
    { use: 'out', name: 'correlationId', type: 'string', min: 1, max: '1' },
    { use: 'out', name: 'message', type: 'string', min: 1, max: '1' },
    { use: 'out', name: 'nextState', type: 'string', min: 1, max: '1' },
    { use: 'out', name: 'countryPack', type: 'string', min: 1, max: '1' },
    { use: 'out', name: 'registryFound', type: 'boolean', min: 0, max: '1' },
    { use: 'out', name: 'facilityApprovalStatus', type: 'string', min: 0, max: '1' },
    { use: 'out', name: 'facilityOperationalStatus', type: 'string', min: 0, max: '1' },
    { use: 'out', name: 'currentLicenseExpiryDate', type: 'string', min: 0, max: '1' },
    { use: 'out', name: 'facilityName', type: 'string', min: 0, max: '1' },
    { use: 'out', name: 'facilityAuthorityIdentifier', type: 'string', min: 0, max: '1' },
    { use: 'out', name: 'facilityAuthoritySystem', type: 'string', min: 0, max: '1' },
    { use: 'out', name: 'task', type: 'Reference', min: 0, max: '1' },
  ],
};

interface VerifyFacilityAuthorityParameters {
  readonly organization?: Reference<Organization>;
}

export async function verifyFacilityAuthorityHandler(req: FhirRequest): Promise<FhirResponse> {
  const ctx = getAuthenticatedContext();
  const countryPack = getProjectCountryPack(ctx.project);
  if (!countryPack) {
    throw new OperationOutcomeError(badRequest('Project does not have a country pack configured.'));
  }

  if (!countryPack.verifyFacilityAuthority) {
    throw new OperationOutcomeError(
      badRequest(`Country pack "${countryPack.id}" does not implement verify-facility-authority.`)
    );
  }

  const organization = await getOrganizationForVerification(req);
  const correlationId = randomUUID();
  const task = await createVerificationTask(organization, correlationId);
  const result = await countryPack.verifyFacilityAuthority({
    ctx,
    organization,
    correlationId,
  });
  const updatedTask = await completeVerificationTask(task, result);
  await createVerificationAuditEvent(updatedTask, organization, result);

  return [allOk, buildOutputParameters(verifyFacilityAuthorityOperation, { ...result, task: createReference(updatedTask) })];
}

async function getOrganizationForVerification(req: FhirRequest): Promise<WithId<Organization>> {
  const ctx = getAuthenticatedContext();
  const { id } = req.params;
  if (id) {
    return ctx.repo.readResource<Organization>('Organization', id);
  }

  const params = parseInputParameters<VerifyFacilityAuthorityParameters>(verifyFacilityAuthorityOperation, req);
  if (params.organization?.reference) {
    return ctx.repo.readReference<Organization>(params.organization);
  }

  throw new OperationOutcomeError(
    badRequest('Must call this operation on an Organization instance or include an organization reference.')
  );
}

async function createVerificationTask(organization: WithId<Organization>, correlationId: string): Promise<WithId<Task>> {
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
    focus: createReference(organization),
    description: `Verify facility authority for ${organization.name ?? organization.id}`,
    code: {
      text: 'verify-facility-authority',
    },
    businessStatus: {
      text: 'requested',
    },
    identifier: [{ system: 'https://afiax.africa/identifier/correlation-id', value: correlationId }],
  });
}

async function completeVerificationTask(
  task: WithId<Task>,
  result: VerifyFacilityAuthorityResult
): Promise<WithId<Task>> {
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

async function createVerificationAuditEvent(
  task: WithId<Task>,
  organization: WithId<Organization>,
  result: VerifyFacilityAuthorityResult
): Promise<void> {
  const ctx = getAuthenticatedContext();
  const outcome =
    result.status === 'verified'
      ? AuditEventOutcome.Success
      : result.status === 'error'
        ? AuditEventOutcome.MajorFailure
        : AuditEventOutcome.MinorFailure;

  const auditEvent = createAuditEvent(RestfulOperationType, OperationInteraction, ctx.project.id, ctx.profile, undefined, outcome, {
    description: result.message,
    resource: createReference(task),
  });

  // Include the organization alongside the Task so verification traces can be reconciled from either side.
  auditEvent.entity = [
    ...(auditEvent.entity ?? []),
    {
      what: createReference(organization),
    },
  ];

  await ctx.systemRepo.createResource<AuditEvent>(auditEvent);
}
