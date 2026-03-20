// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { WithId } from '@medplum/core';
import {
  allOk,
  badRequest,
  buildKenyaPractitionerVerificationExtension,
  createReference,
  OperationOutcomeError,
} from '@medplum/core';
import type { FhirRequest, FhirResponse } from '@medplum/fhir-router';
import type { AuditEvent, OperationDefinition, Practitioner, Reference, Task } from '@medplum/fhirtypes';
import { randomUUID } from 'node:crypto';
import { getAuthenticatedContext } from '../../context';
import { getProjectCountryPack } from '../../country-pack/registry';
import type { VerifyPractitionerAuthorityResult } from '../../country-pack/types';
import {
  AuditEventOutcome,
  createAuditEvent,
  OperationInteraction,
  RestfulOperationType,
} from '../../util/auditevent';
import { buildOutputParameters, parseInputParameters } from './utils/parameters';

export const verifyPractitionerAuthorityOperation: OperationDefinition = {
  resourceType: 'OperationDefinition',
  id: 'practitioner-verify-practitioner-authority',
  name: 'VerifyPractitionerAuthority',
  title: 'Verify Practitioner Authority',
  status: 'active',
  kind: 'operation',
  code: 'verify-practitioner-authority',
  resource: ['Practitioner'],
  system: false,
  type: true,
  instance: true,
  affectsState: true,
  parameter: [
    { use: 'in', name: 'practitioner', type: 'Reference', min: 0, max: '1' },
    { use: 'out', name: 'status', type: 'code', min: 1, max: '1' },
    { use: 'out', name: 'correlationId', type: 'string', min: 1, max: '1' },
    { use: 'out', name: 'message', type: 'string', min: 1, max: '1' },
    { use: 'out', name: 'nextState', type: 'string', min: 1, max: '1' },
    { use: 'out', name: 'countryPack', type: 'string', min: 1, max: '1' },
    { use: 'out', name: 'registryFound', type: 'boolean', min: 0, max: '1' },
    { use: 'out', name: 'registrationNumber', type: 'string', min: 0, max: '1' },
    { use: 'out', name: 'practitionerAuthorityIdentifier', type: 'string', min: 0, max: '1' },
    { use: 'out', name: 'practitionerAuthoritySystem', type: 'string', min: 0, max: '1' },
    { use: 'out', name: 'identificationType', type: 'string', min: 0, max: '1' },
    { use: 'out', name: 'identificationNumber', type: 'string', min: 0, max: '1' },
    { use: 'out', name: 'practitionerActiveStatus', type: 'string', min: 0, max: '1' },
    { use: 'out', name: 'task', type: 'Reference', min: 0, max: '1' },
  ],
};

interface VerifyPractitionerAuthorityParameters {
  readonly practitioner?: Reference<Practitioner>;
}

export async function verifyPractitionerAuthorityHandler(req: FhirRequest): Promise<FhirResponse> {
  const ctx = getAuthenticatedContext();
  const countryPack = getProjectCountryPack(ctx.project);
  if (!countryPack) {
    throw new OperationOutcomeError(badRequest('Project does not have a country pack configured.'));
  }

  if (!countryPack.verifyPractitionerAuthority) {
    throw new OperationOutcomeError(
      badRequest(`Country pack "${countryPack.id}" does not implement verify-practitioner-authority.`)
    );
  }

  const practitioner = await getPractitionerForVerification(req);
  const correlationId = randomUUID();
  const task = await createVerificationTask(practitioner, correlationId);
  const result = await countryPack.verifyPractitionerAuthority({
    ctx,
    practitioner,
    correlationId,
  });
  const updatedTask = await completeVerificationTask(task, result);
  const updatedPractitioner = await persistVerificationResult(practitioner, updatedTask, result);
  await createVerificationAuditEvent(updatedTask, updatedPractitioner, result);

  return [allOk, buildOutputParameters(verifyPractitionerAuthorityOperation, { ...result, task: createReference(updatedTask) })];
}

async function getPractitionerForVerification(req: FhirRequest): Promise<WithId<Practitioner>> {
  const ctx = getAuthenticatedContext();
  const { id } = req.params;
  if (id) {
    return ctx.repo.readResource<Practitioner>('Practitioner', id);
  }

  const params = parseInputParameters<VerifyPractitionerAuthorityParameters>(verifyPractitionerAuthorityOperation, req);
  if (params.practitioner?.reference) {
    return ctx.repo.readReference<Practitioner>(params.practitioner);
  }

  throw new OperationOutcomeError(
    badRequest('Must call this operation on a Practitioner instance or include a practitioner reference.')
  );
}

async function createVerificationTask(practitioner: WithId<Practitioner>, correlationId: string): Promise<WithId<Task>> {
  const ctx = getAuthenticatedContext();
  const practitionerName =
    practitioner.name?.[0]?.text ??
    [practitioner.name?.[0]?.given?.join(' '), practitioner.name?.[0]?.family].filter(Boolean).join(' ') ??
    practitioner.id;
  return ctx.systemRepo.createResource<Task>({
    resourceType: 'Task',
    meta: {
      project: ctx.project.id,
    },
    intent: 'order',
    status: 'requested',
    authoredOn: new Date().toISOString(),
    requester: ctx.profile as Task['requester'],
    focus: createReference(practitioner),
    description: `Verify practitioner authority for ${practitionerName}`,
    code: {
      text: 'verify-practitioner-authority',
    },
    businessStatus: {
      text: 'requested',
    },
    identifier: [{ system: 'https://afiax.africa/identifier/correlation-id', value: correlationId }],
  });
}

async function completeVerificationTask(
  task: WithId<Task>,
  result: VerifyPractitionerAuthorityResult
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
  practitioner: WithId<Practitioner>,
  result: VerifyPractitionerAuthorityResult
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

  auditEvent.entity = [
    ...(auditEvent.entity ?? []),
    {
      what: createReference(practitioner),
    },
  ];

  await ctx.systemRepo.createResource<AuditEvent>(auditEvent);
}

async function persistVerificationResult(
  practitioner: WithId<Practitioner>,
  task: WithId<Task>,
  result: VerifyPractitionerAuthorityResult
): Promise<WithId<Practitioner>> {
  const ctx = getAuthenticatedContext();
  const verifiedAt = new Date().toISOString();
  const extension = buildKenyaPractitionerVerificationExtension(result, verifiedAt, createReference(task));
  const otherExtensions = practitioner.extension?.filter((ext) => ext.url !== extension.url) ?? [];

  return ctx.systemRepo.updateResource<Practitioner>({
    ...practitioner,
    extension: [...otherExtensions, extension],
  });
}
