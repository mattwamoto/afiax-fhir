// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import {
  getKenyaPractitionerLookupIdentifier,
  KenyaPractitionerAuthorityIdentifierSystem,
  normalizeErrorString,
} from '@medplum/core';
import type { Project } from '@medplum/fhirtypes';
import { getKenyaAfyaLinkCredentials, searchAfyaLinkPractitioner } from './afyalink';
import type { CountryPackVerifyPractitionerAuthorityInput, VerifyPractitionerAuthorityResult } from '../types';

function normalizeOptionalString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return String(value);
}

function isInactivePractitioner(activeStatus: string | undefined): boolean {
  if (!activeStatus) {
    return false;
  }

  return ['false', '0', 'no', 'inactive', 'not active'].includes(activeStatus.trim().toLowerCase());
}

export async function verifyKenyaPractitionerAuthority(
  input: CountryPackVerifyPractitionerAuthorityInput
): Promise<VerifyPractitionerAuthorityResult> {
  const lookupIdentifier = getKenyaPractitionerLookupIdentifier(input.practitioner);
  const practitionerName =
    input.practitioner.name?.[0]?.text ??
    [input.practitioner.name?.[0]?.given?.join(' '), input.practitioner.name?.[0]?.family].filter(Boolean).join(' ') ??
    input.practitioner.id;

  if (!lookupIdentifier?.identifier.value) {
    return {
      status: 'unverified',
      correlationId: input.correlationId,
      countryPack: 'kenya',
      message: `Practitioner ${practitionerName} is missing the Kenya identity document required for registry verification.`,
      nextState: 'capture-practitioner-identity-document',
    };
  }

  try {
    const project = await input.ctx.systemRepo.readResource<Project>('Project', input.ctx.project.id);
    const credentials = getKenyaAfyaLinkCredentials(project);
    const response = await searchAfyaLinkPractitioner(
      credentials,
      lookupIdentifier.identificationType,
      lookupIdentifier.identifier.value
    );
    const message = response.message;
    const activeStatus = normalizeOptionalString(message?.is_active);
    const registrationNumber = normalizeOptionalString(message?.registration_number);

    if (!message || message.found !== 1) {
      return {
        status: 'unverified',
        correlationId: input.correlationId,
        countryPack: 'kenya',
        registryFound: false,
        identificationType: lookupIdentifier.identificationType,
        identificationNumber: lookupIdentifier.identifier.value,
        message: `Practitioner ${practitionerName} was not found in the Kenya Health Worker Registry using ${lookupIdentifier.identificationType}.`,
        nextState: 'review-practitioner-identity-document',
      };
    }

    if (isInactivePractitioner(activeStatus)) {
      return {
        status: 'inactive',
        correlationId: input.correlationId,
        countryPack: 'kenya',
        registryFound: true,
        registrationNumber,
        practitionerAuthorityIdentifier: registrationNumber,
        practitionerAuthoritySystem: KenyaPractitionerAuthorityIdentifierSystem,
        identificationType: lookupIdentifier.identificationType,
        identificationNumber: lookupIdentifier.identifier.value,
        practitionerActiveStatus: activeStatus,
        message: `Practitioner ${practitionerName} was found in the Kenya Health Worker Registry but is not active.`,
        nextState: 'review-practitioner-registration-status',
      };
    }

    return {
      status: 'verified',
      correlationId: input.correlationId,
      countryPack: 'kenya',
      registryFound: true,
      registrationNumber,
      practitionerAuthorityIdentifier: registrationNumber,
      practitionerAuthoritySystem: KenyaPractitionerAuthorityIdentifierSystem,
      identificationType: lookupIdentifier.identificationType,
      identificationNumber: lookupIdentifier.identifier.value,
      practitionerActiveStatus: activeStatus,
      message: `Practitioner ${practitionerName} was found in the Kenya Health Worker Registry using ${lookupIdentifier.identificationType}.`,
      nextState: 'ready-for-care-delivery',
    };
  } catch (err) {
    return {
      status: 'error',
      correlationId: input.correlationId,
      countryPack: 'kenya',
      identificationType: lookupIdentifier.identificationType,
      identificationNumber: lookupIdentifier.identifier.value,
      message: `AfyaLink practitioner verification failed: ${normalizeErrorString(err)}`,
      nextState: 'retry-or-review-afyalink-credentials',
    };
  }
}
