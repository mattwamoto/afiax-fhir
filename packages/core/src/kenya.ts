// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { getExtensionValue } from './utils';
import type { Extension, Identifier, Organization, Reference, Task } from '@medplum/fhirtypes';

export interface KenyaFacilityVerificationResultInput {
  readonly status: string;
  readonly correlationId: string;
  readonly message: string;
  readonly nextState: string;
  readonly facilityApprovalStatus?: string;
  readonly facilityOperationalStatus?: string;
  readonly currentLicenseExpiryDate?: string;
  readonly facilityAuthorityIdentifier?: string;
  readonly facilityAuthoritySystem?: string;
}

export const KenyaFacilityVerificationExtension = {
  baseUrl: 'https://afiax.africa/fhir/StructureDefinition/kenya-facility-verification',
  status: 'status',
  correlationId: 'correlationId',
  message: 'message',
  nextState: 'nextState',
  verifiedAt: 'verifiedAt',
  task: 'task',
  facilityApprovalStatus: 'facilityApprovalStatus',
  facilityOperationalStatus: 'facilityOperationalStatus',
  currentLicenseExpiryDate: 'currentLicenseExpiryDate',
  facilityAuthorityIdentifier: 'facilityAuthorityIdentifier',
  facilityAuthoritySystem: 'facilityAuthoritySystem',
} as const;

export const KenyaFacilityAuthorityIdentifierSystem = 'https://afiax.africa/kenya/identifier/mfl-code';

export interface KenyaFacilityVerificationSnapshot {
  readonly status?: string;
  readonly correlationId?: string;
  readonly message?: string;
  readonly nextState?: string;
  readonly verifiedAt?: string;
  readonly task?: Reference<Task>;
  readonly facilityApprovalStatus?: string;
  readonly facilityOperationalStatus?: string;
  readonly currentLicenseExpiryDate?: string;
  readonly facilityAuthorityIdentifier?: string;
  readonly facilityAuthoritySystem?: string;
}

export function buildKenyaFacilityVerificationExtension(
  result: KenyaFacilityVerificationResultInput,
  verifiedAt: string,
  task?: Reference<Task>
): Extension {
  const extension: Extension = {
    url: KenyaFacilityVerificationExtension.baseUrl,
    extension: [
      { url: KenyaFacilityVerificationExtension.status, valueCode: result.status },
      { url: KenyaFacilityVerificationExtension.correlationId, valueString: result.correlationId },
      { url: KenyaFacilityVerificationExtension.message, valueString: result.message },
      { url: KenyaFacilityVerificationExtension.nextState, valueString: result.nextState },
      { url: KenyaFacilityVerificationExtension.verifiedAt, valueDateTime: verifiedAt },
    ],
  };

  if (task) {
    extension.extension?.push({ url: KenyaFacilityVerificationExtension.task, valueReference: task });
  }
  if (result.facilityApprovalStatus) {
    extension.extension?.push({
      url: KenyaFacilityVerificationExtension.facilityApprovalStatus,
      valueString: result.facilityApprovalStatus,
    });
  }
  if (result.facilityOperationalStatus) {
    extension.extension?.push({
      url: KenyaFacilityVerificationExtension.facilityOperationalStatus,
      valueString: result.facilityOperationalStatus,
    });
  }
  if (result.currentLicenseExpiryDate) {
    extension.extension?.push({
      url: KenyaFacilityVerificationExtension.currentLicenseExpiryDate,
      valueDate: result.currentLicenseExpiryDate,
    });
  }
  if (result.facilityAuthorityIdentifier) {
    extension.extension?.push({
      url: KenyaFacilityVerificationExtension.facilityAuthorityIdentifier,
      valueString: result.facilityAuthorityIdentifier,
    });
  }
  if (result.facilityAuthoritySystem) {
    extension.extension?.push({
      url: KenyaFacilityVerificationExtension.facilityAuthoritySystem,
      valueUri: result.facilityAuthoritySystem,
    });
  }

  return extension;
}

export function getKenyaFacilityVerificationSnapshot(
  organization: Pick<Organization, 'extension'> | undefined
): KenyaFacilityVerificationSnapshot | undefined {
  if (!organization?.extension?.length) {
    return undefined;
  }

  const base = KenyaFacilityVerificationExtension.baseUrl;
  const status = getExtensionValue(organization, base, KenyaFacilityVerificationExtension.status);
  if (typeof status !== 'string' || !status) {
    return undefined;
  }

  const taskValue = getExtensionValue(organization, base, KenyaFacilityVerificationExtension.task);
  return {
    status,
    correlationId: getStringExtensionValue(organization, KenyaFacilityVerificationExtension.correlationId),
    message: getStringExtensionValue(organization, KenyaFacilityVerificationExtension.message),
    nextState: getStringExtensionValue(organization, KenyaFacilityVerificationExtension.nextState),
    verifiedAt: getStringExtensionValue(organization, KenyaFacilityVerificationExtension.verifiedAt),
    task: isReference(taskValue) ? (taskValue as Reference<Task>) : undefined,
    facilityApprovalStatus: getStringExtensionValue(organization, KenyaFacilityVerificationExtension.facilityApprovalStatus),
    facilityOperationalStatus: getStringExtensionValue(
      organization,
      KenyaFacilityVerificationExtension.facilityOperationalStatus
    ),
    currentLicenseExpiryDate: getStringExtensionValue(
      organization,
      KenyaFacilityVerificationExtension.currentLicenseExpiryDate
    ),
    facilityAuthorityIdentifier: getStringExtensionValue(
      organization,
      KenyaFacilityVerificationExtension.facilityAuthorityIdentifier
    ),
    facilityAuthoritySystem: getStringExtensionValue(organization, KenyaFacilityVerificationExtension.facilityAuthoritySystem),
  };

  function getStringExtensionValue(resource: Pick<Organization, 'extension'>, childUrl: string): string | undefined {
    const value = getExtensionValue(resource, base, childUrl);
    return typeof value === 'string' && value ? value : undefined;
  }
}

function isReference(value: unknown): value is Reference {
  return !!value && typeof value === 'object' && 'reference' in (value as Record<string, unknown>);
}

export function getKenyaFacilityAuthorityIdentifier(
  organization: Pick<Organization, 'identifier'> | undefined,
  preferredSystem = KenyaFacilityAuthorityIdentifierSystem
): Identifier | undefined {
  return organization?.identifier?.find((identifier) => isKenyaFacilityAuthorityIdentifier(identifier, preferredSystem));
}

export function setKenyaFacilityAuthorityIdentifier(
  organization: Organization,
  value: string,
  preferredSystem = KenyaFacilityAuthorityIdentifierSystem
): Organization {
  const trimmed = value.trim();
  const nextIdentifier: Identifier = {
    system: preferredSystem,
    value: trimmed,
    type: {
      text: 'Facility authority identifier',
      coding: [{ code: 'facility-authority-id', display: 'Facility authority identifier' }],
    },
  };

  const identifiers = [...(organization.identifier ?? [])];
  const existingIndex = identifiers.findIndex((identifier) => isKenyaFacilityAuthorityIdentifier(identifier, preferredSystem));
  if (existingIndex >= 0) {
    identifiers[existingIndex] = {
      ...identifiers[existingIndex],
      ...nextIdentifier,
    };
  } else {
    identifiers.push(nextIdentifier);
  }

  return {
    ...organization,
    identifier: identifiers,
  };
}

export function clearKenyaFacilityVerificationSnapshot(organization: Organization): Organization {
  if (!organization.extension?.length) {
    return organization;
  }

  return {
    ...organization,
    extension: organization.extension.filter((ext) => ext.url !== KenyaFacilityVerificationExtension.baseUrl),
  };
}

function isKenyaFacilityAuthorityIdentifier(identifier: Identifier | undefined, preferredSystem: string): boolean {
  if (!identifier) {
    return false;
  }

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

  return (identifier.type?.coding ?? []).some(
    (coding) =>
      coding.code === 'facility-authority-id' || coding.display?.toLowerCase().includes('facility authority')
  );
}
