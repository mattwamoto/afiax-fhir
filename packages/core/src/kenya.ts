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
export const KenyaFacilityRegistrationIdentifierSystem =
  'https://afiax.africa/kenya/identifier/facility-registration-number';

export const KenyaFacilityRegistryExtension = {
  baseUrl: 'https://afiax.africa/fhir/StructureDefinition/kenya-facility-registry',
  facilityCode: 'facilityCode',
  found: 'found',
  facilityName: 'facilityName',
  registrationNumber: 'registrationNumber',
  regulator: 'regulator',
  approvalStatus: 'approvalStatus',
  facilityLevel: 'facilityLevel',
  facilityCategory: 'facilityCategory',
  facilityOwner: 'facilityOwner',
  facilityType: 'facilityType',
  county: 'county',
  subCounty: 'subCounty',
  ward: 'ward',
  operationalStatus: 'operationalStatus',
  currentLicenseExpiryDate: 'currentLicenseExpiryDate',
  lookedUpAt: 'lookedUpAt',
} as const;

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

export interface KenyaFacilityRegistrySnapshot {
  readonly facilityCode?: string;
  readonly found?: boolean;
  readonly facilityName?: string;
  readonly registrationNumber?: string;
  readonly regulator?: string;
  readonly approvalStatus?: string;
  readonly facilityLevel?: string;
  readonly facilityCategory?: string;
  readonly facilityOwner?: string;
  readonly facilityType?: string;
  readonly county?: string;
  readonly subCounty?: string;
  readonly ward?: string;
  readonly operationalStatus?: string;
  readonly currentLicenseExpiryDate?: string;
  readonly lookedUpAt?: string;
}

export interface KenyaFacilityRegistryInput {
  readonly facilityCode?: string | null;
  readonly found?: number | boolean | null;
  readonly facilityName?: string | null;
  readonly registrationNumber?: string | null;
  readonly regulator?: string | null;
  readonly approvalStatus?: string | boolean | null;
  readonly facilityLevel?: string | null;
  readonly facilityCategory?: string | null;
  readonly facilityOwner?: string | null;
  readonly facilityType?: string | null;
  readonly county?: string | null;
  readonly subCounty?: string | null;
  readonly ward?: string | null;
  readonly operationalStatus?: string | null;
  readonly currentLicenseExpiryDate?: string | null;
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

export function clearKenyaFacilityRegistrySnapshot(organization: Organization): Organization {
  if (!organization.extension?.length) {
    return organization;
  }

  return {
    ...organization,
    extension: organization.extension.filter((ext) => ext.url !== KenyaFacilityRegistryExtension.baseUrl),
  };
}

export function buildKenyaFacilityRegistryExtension(
  input: KenyaFacilityRegistryInput,
  lookedUpAt: string
): Extension {
  const extension: Extension = {
    url: KenyaFacilityRegistryExtension.baseUrl,
    extension: [{ url: KenyaFacilityRegistryExtension.lookedUpAt, valueDateTime: lookedUpAt }],
  };

  pushString(extension, KenyaFacilityRegistryExtension.facilityCode, input.facilityCode);
  if (input.found !== undefined && input.found !== null) {
    extension.extension?.push({
      url: KenyaFacilityRegistryExtension.found,
      valueBoolean: input.found === true || input.found === 1,
    });
  }
  pushString(extension, KenyaFacilityRegistryExtension.facilityName, input.facilityName);
  pushString(extension, KenyaFacilityRegistryExtension.registrationNumber, input.registrationNumber);
  pushString(extension, KenyaFacilityRegistryExtension.regulator, input.regulator);
  pushString(extension, KenyaFacilityRegistryExtension.approvalStatus, normalizeOptionalString(input.approvalStatus));
  pushString(extension, KenyaFacilityRegistryExtension.facilityLevel, input.facilityLevel);
  pushString(extension, KenyaFacilityRegistryExtension.facilityCategory, input.facilityCategory);
  pushString(extension, KenyaFacilityRegistryExtension.facilityOwner, input.facilityOwner);
  pushString(extension, KenyaFacilityRegistryExtension.facilityType, input.facilityType);
  pushString(extension, KenyaFacilityRegistryExtension.county, input.county);
  pushString(extension, KenyaFacilityRegistryExtension.subCounty, input.subCounty);
  pushString(extension, KenyaFacilityRegistryExtension.ward, input.ward);
  pushString(extension, KenyaFacilityRegistryExtension.operationalStatus, input.operationalStatus);
  pushString(
    extension,
    KenyaFacilityRegistryExtension.currentLicenseExpiryDate,
    input.currentLicenseExpiryDate
  );

  return extension;
}

export function getKenyaFacilityRegistrySnapshot(
  organization: Pick<Organization, 'extension'> | undefined
): KenyaFacilityRegistrySnapshot | undefined {
  if (!organization?.extension?.length) {
    return undefined;
  }

  const base = KenyaFacilityRegistryExtension.baseUrl;
  const facilityCode = getExtensionValue(organization, base, KenyaFacilityRegistryExtension.facilityCode);
  const lookedUpAt = getExtensionValue(organization, base, KenyaFacilityRegistryExtension.lookedUpAt);
  if (typeof facilityCode !== 'string' && typeof lookedUpAt !== 'string') {
    return undefined;
  }

  const found = getExtensionValue(organization, base, KenyaFacilityRegistryExtension.found);
  return {
    facilityCode: typeof facilityCode === 'string' ? facilityCode : undefined,
    found: typeof found === 'boolean' ? found : undefined,
    facilityName: getKenyaRegistryStringValue(organization, KenyaFacilityRegistryExtension.facilityName),
    registrationNumber: getKenyaRegistryStringValue(organization, KenyaFacilityRegistryExtension.registrationNumber),
    regulator: getKenyaRegistryStringValue(organization, KenyaFacilityRegistryExtension.regulator),
    approvalStatus: getKenyaRegistryStringValue(organization, KenyaFacilityRegistryExtension.approvalStatus),
    facilityLevel: getKenyaRegistryStringValue(organization, KenyaFacilityRegistryExtension.facilityLevel),
    facilityCategory: getKenyaRegistryStringValue(organization, KenyaFacilityRegistryExtension.facilityCategory),
    facilityOwner: getKenyaRegistryStringValue(organization, KenyaFacilityRegistryExtension.facilityOwner),
    facilityType: getKenyaRegistryStringValue(organization, KenyaFacilityRegistryExtension.facilityType),
    county: getKenyaRegistryStringValue(organization, KenyaFacilityRegistryExtension.county),
    subCounty: getKenyaRegistryStringValue(organization, KenyaFacilityRegistryExtension.subCounty),
    ward: getKenyaRegistryStringValue(organization, KenyaFacilityRegistryExtension.ward),
    operationalStatus: getKenyaRegistryStringValue(organization, KenyaFacilityRegistryExtension.operationalStatus),
    currentLicenseExpiryDate: getKenyaRegistryStringValue(
      organization,
      KenyaFacilityRegistryExtension.currentLicenseExpiryDate
    ),
    lookedUpAt: typeof lookedUpAt === 'string' ? lookedUpAt : undefined,
  };
}

export function applyKenyaFacilityRegistryToOrganization(
  organization: Organization,
  input: KenyaFacilityRegistryInput,
  lookedUpAt: string
): Organization {
  const facilityCode = input.facilityCode?.trim();
  const registryExtension = buildKenyaFacilityRegistryExtension(input, lookedUpAt);
  const nextExtensions =
    organization.extension?.filter(
      (ext) =>
        ext.url !== KenyaFacilityRegistryExtension.baseUrl && ext.url !== KenyaFacilityVerificationExtension.baseUrl
    ) ?? [];

  let updated: Organization = {
    ...organization,
    extension: [...nextExtensions, registryExtension],
  };

  if (facilityCode) {
    updated = setKenyaFacilityAuthorityIdentifier(updated, facilityCode);
  }

  const facilityName = input.facilityName?.trim();
  if (facilityName) {
    updated.name = facilityName;
  }

  const registrationNumber = input.registrationNumber?.trim();
  if (registrationNumber) {
    const identifiers = [...(updated.identifier ?? [])];
    const registrationIdentifier: Identifier = {
      system: KenyaFacilityRegistrationIdentifierSystem,
      value: registrationNumber,
      type: {
        text: 'Facility registration number',
      },
    };
    const existingIndex = identifiers.findIndex(
      (identifier) => identifier.system === KenyaFacilityRegistrationIdentifierSystem
    );
    if (existingIndex >= 0) {
      identifiers[existingIndex] = { ...identifiers[existingIndex], ...registrationIdentifier };
    } else {
      identifiers.push(registrationIdentifier);
    }
    updated.identifier = identifiers;
  }

  return updated;
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

function pushString(extension: Extension, url: string, value: string | null | undefined): void {
  const normalized = value?.trim();
  if (normalized) {
    extension.extension?.push({ url, valueString: normalized });
  }
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return String(value);
}

function getKenyaRegistryStringValue(
  organization: Pick<Organization, 'extension'>,
  childUrl: string
): string | undefined {
  const value = getExtensionValue(organization, KenyaFacilityRegistryExtension.baseUrl, childUrl);
  return typeof value === 'string' && value ? value : undefined;
}
