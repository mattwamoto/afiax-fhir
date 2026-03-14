// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { getProjectSettingString, normalizeErrorString } from '@medplum/core';
import type { Identifier, Project } from '@medplum/fhirtypes';
import { getKenyaAfyaLinkCredentials, searchAfyaLinkFacility } from './afyalink';
import type { CountryPackVerifyFacilityAuthorityInput, VerifyFacilityAuthorityResult } from '../types';

export const KENYA_FACILITY_AUTHORITY_IDENTIFIER_SYSTEM = 'https://afiax.africa/kenya/identifier/mfl-code';

function isFacilityAuthorityIdentifier(identifier: Identifier, preferredSystem: string): boolean {
  if (identifier.system === preferredSystem) {
    return true;
  }

  if (identifier.system?.toLowerCase().includes('mfl')) {
    return true;
  }

  const typeText = identifier.type?.text?.toLowerCase();
  if (typeText?.includes('facility authority')) {
    return true;
  }

  const codings = identifier.type?.coding ?? [];
  return codings.some(
    (coding) =>
      coding.code === 'facility-authority-id' || coding.display?.toLowerCase().includes('facility authority')
  );
}

function getFacilityAuthoritySystem(input: CountryPackVerifyFacilityAuthorityInput): string {
  return (
    getProjectSettingString(input.ctx.project, 'facilityAuthorityIdentifierSystem') ??
    KENYA_FACILITY_AUTHORITY_IDENTIFIER_SYSTEM
  );
}

function getFacilityAuthorityIdentifier(input: CountryPackVerifyFacilityAuthorityInput): Identifier | undefined {
  const preferredSystem = getFacilityAuthoritySystem(input);
  return input.organization.identifier?.find((identifier) => isFacilityAuthorityIdentifier(identifier, preferredSystem));
}

export async function verifyKenyaFacilityAuthority(
  input: CountryPackVerifyFacilityAuthorityInput
): Promise<VerifyFacilityAuthorityResult> {
  const preferredSystem = getFacilityAuthoritySystem(input);
  const authorityIdentifier = getFacilityAuthorityIdentifier(input);
  const facilityName = input.organization.name ?? input.organization.alias?.[0] ?? input.organization.id;

  if (!authorityIdentifier?.value) {
    return {
      status: 'unverified',
      correlationId: input.correlationId,
      countryPack: 'kenya',
      facilityName,
      facilityAuthoritySystem: preferredSystem,
      message: `Facility ${facilityName} is missing the Kenya facility authority identifier required for verification.`,
      nextState: 'capture-facility-authority-id',
    };
  }

  try {
    const project = await input.ctx.systemRepo.readResource<Project>('Project', input.ctx.project.id);
    const credentials = getKenyaAfyaLinkCredentials(project);
    const response = await searchAfyaLinkFacility(credentials, authorityIdentifier.value);
    const message = response.message;

    if (!message || message.found !== 1) {
      return {
        status: 'unverified',
        correlationId: input.correlationId,
        countryPack: 'kenya',
        registryFound: false,
        facilityName,
        facilityAuthorityIdentifier: authorityIdentifier.value,
        facilityAuthoritySystem: authorityIdentifier.system ?? preferredSystem,
        message: `Facility ${facilityName} was not found in the AfyaLink facility registry for facility code ${authorityIdentifier.value}.`,
        nextState: 'review-facility-authority-id',
      };
    }

    const approvalStatus = normalizeOptionalString(message.approved);
    const operationalStatus = normalizeOptionalString(message.operational_status);
    const looksInactive =
      !!operationalStatus &&
      ['inactive', 'closed', 'suspended', 'not operational', 'non operational', 'non-operational'].some((value) =>
        operationalStatus.toLowerCase().includes(value)
      );
    const looksUnapproved =
      !!approvalStatus && ['false', '0', 'no', 'not approved', 'unapproved', 'rejected'].includes(approvalStatus.toLowerCase());

    if (input.organization.active === false || looksInactive) {
      return {
        status: 'inactive',
        correlationId: input.correlationId,
        countryPack: 'kenya',
        registryFound: true,
        facilityName,
        facilityAuthorityIdentifier: authorityIdentifier.value,
        facilityAuthoritySystem: authorityIdentifier.system ?? preferredSystem,
        facilityApprovalStatus: approvalStatus,
        facilityOperationalStatus: operationalStatus,
        currentLicenseExpiryDate: message.current_license_expiry_date ?? undefined,
        message: `Facility ${facilityName} was found in AfyaLink but is currently inactive or non-operational.`,
        nextState: 'reactivate-or-correct-facility',
      };
    }

    if (looksUnapproved) {
      return {
        status: 'unverified',
        correlationId: input.correlationId,
        countryPack: 'kenya',
        registryFound: true,
        facilityName,
        facilityAuthorityIdentifier: authorityIdentifier.value,
        facilityAuthoritySystem: authorityIdentifier.system ?? preferredSystem,
        facilityApprovalStatus: approvalStatus,
        facilityOperationalStatus: operationalStatus,
        currentLicenseExpiryDate: message.current_license_expiry_date ?? undefined,
        message: `Facility ${facilityName} was found in AfyaLink but is not approved for use.`,
        nextState: 'review-facility-approval-status',
      };
    }

    return {
      status: 'verified',
      correlationId: input.correlationId,
      countryPack: 'kenya',
      registryFound: true,
      facilityName,
      facilityAuthorityIdentifier: authorityIdentifier.value,
      facilityAuthoritySystem: authorityIdentifier.system ?? preferredSystem,
      facilityApprovalStatus: approvalStatus,
      facilityOperationalStatus: operationalStatus,
      currentLicenseExpiryDate: message.current_license_expiry_date ?? undefined,
      message: `Facility ${facilityName} was found in AfyaLink using facility code ${authorityIdentifier.value}.`,
      nextState: 'ready-for-registry-check',
    };
  } catch (err) {
    return {
      status: 'error',
      correlationId: input.correlationId,
      countryPack: 'kenya',
      facilityName,
      facilityAuthorityIdentifier: authorityIdentifier.value,
      facilityAuthoritySystem: authorityIdentifier.system ?? preferredSystem,
      message: `AfyaLink facility verification failed: ${normalizeErrorString(err)}`,
      nextState: 'retry-or-review-afyalink-credentials',
    };
  }
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return String(value);
}
