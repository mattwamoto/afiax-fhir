// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { WithId } from '@medplum/core';
import type {
  Claim,
  Coverage,
  CoverageEligibilityRequest,
  CoverageEligibilityResponse,
  Organization,
  Practitioner,
  Project,
  Reference,
  ResourceType,
  Task,
} from '@medplum/fhirtypes';
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
  verifyPractitionerAuthority?: (
    input: CountryPackVerifyPractitionerAuthorityInput
  ) => Promise<VerifyPractitionerAuthorityResult>;
  checkCoverage?: (input: CountryPackCheckCoverageInput) => Promise<CheckCoverageResult>;
  submitNationalClaim?: (input: CountryPackSubmitNationalClaimInput) => Promise<SubmitNationalClaimResult>;
}

export interface CountryPackVerifyFacilityAuthorityInput {
  readonly ctx: AuthenticatedRequestContext;
  readonly organization: WithId<Organization>;
  readonly correlationId: string;
}

export interface CountryPackVerifyPractitionerAuthorityInput {
  readonly ctx: AuthenticatedRequestContext;
  readonly practitioner: WithId<Practitioner>;
  readonly correlationId: string;
}

export interface CountryPackCheckCoverageInput {
  readonly ctx: AuthenticatedRequestContext;
  readonly coverage: WithId<Coverage>;
  readonly correlationId: string;
}

export interface CountryPackSubmitNationalClaimInput {
  readonly ctx: AuthenticatedRequestContext;
  readonly claim: WithId<Claim>;
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

export interface VerifyPractitionerAuthorityResult {
  readonly status: FacilityAuthorityVerificationStatus;
  readonly correlationId: string;
  readonly message: string;
  readonly nextState: string;
  readonly countryPack: string;
  readonly registryFound?: boolean;
  readonly registrationNumber?: string;
  readonly practitionerAuthorityIdentifier?: string;
  readonly practitionerAuthoritySystem?: string;
  readonly identificationType?: string;
  readonly identificationNumber?: string;
  readonly practitionerActiveStatus?: string;
  readonly task?: Reference<Task>;
}

export type CoverageCheckStatus = 'eligible' | 'ineligible' | 'error';

export interface CheckCoverageResult {
  readonly status: CoverageCheckStatus;
  readonly correlationId: string;
  readonly message: string;
  readonly nextState: string;
  readonly countryPack: string;
  readonly identificationType?: string;
  readonly identificationNumber?: string;
  readonly eligible?: boolean;
  readonly fullName?: string;
  readonly reason?: string;
  readonly possibleSolution?: string;
  readonly coverageEndDate?: string;
  readonly transitionStatus?: string;
  readonly requestId?: string;
  readonly requestIdNumber?: string;
  readonly requestIdType?: string;
  readonly rawResponse?: string;
  readonly coverageEligibilityRequest?: Reference<CoverageEligibilityRequest>;
  readonly coverageEligibilityResponse?: Reference<CoverageEligibilityResponse>;
  readonly task?: Reference<Task>;
}

export type NationalClaimSubmissionStatus = 'prepared' | 'submitted' | 'error';

export interface SubmitNationalClaimResult {
  readonly status: NationalClaimSubmissionStatus;
  readonly correlationId: string;
  readonly message: string;
  readonly nextState: string;
  readonly countryPack: string;
  readonly shaClaimsEnvironment?: string;
  readonly submissionEndpoint?: string;
  readonly statusTrackingEndpoint?: string;
  readonly responseStatusCode?: number;
  readonly bundleId?: string;
  readonly bundleEntryCount?: number;
  readonly rawBundle?: string;
  readonly rawResponse?: string;
  readonly task?: Reference<Task>;
}

export type CountryPackProjectSource = Pick<Project, 'setting'> | undefined;
