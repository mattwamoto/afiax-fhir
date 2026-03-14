// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { WithId } from '@medplum/core';
import type { Organization, Project, Reference, ResourceType, Task } from '@medplum/fhirtypes';
import type { AuthenticatedRequestContext } from '../context';

export type CountryPackOperationCode =
  | 'resolve-patient-identity'
  | 'verify-facility-authority'
  | 'verify-practitioner-authority'
  | 'check-coverage'
  | 'publish-national-record'
  | 'submit-national-claim';

export interface CountryPackIdentifierBinding {
  readonly category: string;
  readonly resourceTypes: ResourceType[];
  readonly description: string;
  readonly kenyaExample?: string;
}

export interface CountryPackDefinition {
  readonly id: string;
  readonly title: string;
  readonly countryCode: string;
  readonly requiredProjectSettings: readonly string[];
  readonly requiredProjectSecrets?: readonly string[];
  readonly supportedOperations: readonly CountryPackOperationCode[];
  readonly identifierBindings: readonly CountryPackIdentifierBinding[];
  verifyFacilityAuthority?: (input: CountryPackVerifyFacilityAuthorityInput) => Promise<VerifyFacilityAuthorityResult>;
}

export interface CountryPackVerifyFacilityAuthorityInput {
  readonly ctx: AuthenticatedRequestContext;
  readonly organization: WithId<Organization>;
  readonly correlationId: string;
}

export type FacilityAuthorityVerificationStatus = 'verified' | 'unverified' | 'inactive' | 'error';

export interface VerifyFacilityAuthorityResult {
  readonly status: FacilityAuthorityVerificationStatus;
  readonly correlationId: string;
  readonly message: string;
  readonly nextState: string;
  readonly countryPack: string;
  readonly registryFound?: boolean;
  readonly facilityApprovalStatus?: string;
  readonly facilityOperationalStatus?: string;
  readonly currentLicenseExpiryDate?: string;
  readonly facilityName?: string;
  readonly facilityAuthorityIdentifier?: string;
  readonly facilityAuthoritySystem?: string;
  readonly task?: Reference<Task>;
}

export type CountryPackProjectSource = Pick<Project, 'setting'> | undefined;
