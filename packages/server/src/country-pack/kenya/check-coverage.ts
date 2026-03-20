// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import {
  getKenyaCoverageEligibilityLookupIdentifier,
  normalizeErrorString,
} from '@medplum/core';
import type { Project } from '@medplum/fhirtypes';
import { getKenyaAfyaLinkCredentials, searchAfyaLinkEligibility } from './afyalink';
import type { CheckCoverageResult, CountryPackCheckCoverageInput } from '../types';

function normalizeOptionalString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return String(value);
}

function normalizeEligibilityBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return undefined;
    }
    if (['1', 'true', 'yes', 'eligible', 'active'].includes(normalized)) {
      return true;
    }
    if (['0', 'false', 'no', 'ineligible', 'inactive'].includes(normalized)) {
      return false;
    }
  }

  return undefined;
}

export async function checkKenyaCoverage(input: CountryPackCheckCoverageInput): Promise<CheckCoverageResult> {
  const lookupIdentifier = getKenyaCoverageEligibilityLookupIdentifier(input.coverage);
  if (!lookupIdentifier?.identifier.value) {
    return {
      status: 'ineligible',
      correlationId: input.correlationId,
      countryPack: 'kenya',
      message: 'Coverage is missing the Kenya eligibility lookup identifier required for DHA eligibility checks.',
      nextState: 'capture-eligibility-lookup-identifier',
    };
  }

  try {
    const project = await input.ctx.systemRepo.readResource<Project>('Project', input.ctx.project.id);
    const credentials = getKenyaAfyaLinkCredentials(project);
    const response = await searchAfyaLinkEligibility(
      credentials,
      lookupIdentifier.identificationType,
      lookupIdentifier.identifier.value
    );
    const message = response.message;
    const eligible = normalizeEligibilityBoolean(message?.eligible);
    const fullName = normalizeOptionalString(message?.full_name);
    const reason = normalizeOptionalString(message?.reason);
    const possibleSolution = normalizeOptionalString(message?.possible_solution ?? message?.message);
    const coverageEndDate = normalizeOptionalString(message?.coverageEndDate);
    const transitionStatus = normalizeOptionalString(message?.transition_status ?? message?.status);
    const requestId = message?.id === undefined || message?.id === null ? undefined : String(message.id);
    const requestIdType = normalizeOptionalString(message?.request_id_type) ?? lookupIdentifier.identificationType;
    const requestIdNumber =
      normalizeOptionalString(message?.request_id_number) ?? lookupIdentifier.identifier.value;

    if (eligible === true) {
      return {
        status: 'eligible',
        correlationId: input.correlationId,
        countryPack: 'kenya',
        identificationType: lookupIdentifier.identificationType,
        identificationNumber: lookupIdentifier.identifier.value,
        eligible: true,
        fullName,
        reason,
        possibleSolution,
        coverageEndDate,
        transitionStatus,
        requestId,
        requestIdType,
        requestIdNumber,
        rawResponse: JSON.stringify(response, null, 2),
        message: fullName
          ? `${fullName} is eligible for coverage checks in DHA.`
          : 'Coverage is eligible according to DHA.',
        nextState: 'ready-for-claim-and-billing',
      };
    }

    return {
      status: 'ineligible',
      correlationId: input.correlationId,
      countryPack: 'kenya',
      identificationType: lookupIdentifier.identificationType,
      identificationNumber: lookupIdentifier.identifier.value,
      eligible: false,
      fullName,
      reason,
      possibleSolution,
      coverageEndDate,
      transitionStatus,
      requestId,
      requestIdType,
      requestIdNumber,
      rawResponse: JSON.stringify(response, null, 2),
      message:
        possibleSolution ??
        reason ??
        'Coverage is not currently eligible according to DHA.',
      nextState: 'resolve-eligibility-before-billing',
    };
  } catch (err) {
    return {
      status: 'error',
      correlationId: input.correlationId,
      countryPack: 'kenya',
      identificationType: lookupIdentifier.identificationType,
      identificationNumber: lookupIdentifier.identifier.value,
      message: `DHA eligibility check failed: ${normalizeErrorString(err)}`,
      nextState: 'retry-or-review-afyalink-credentials',
    };
  }
}
