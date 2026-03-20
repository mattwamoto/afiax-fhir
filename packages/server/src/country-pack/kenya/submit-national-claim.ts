// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { WithId } from '@medplum/core';
import {
  badRequest,
  createReference,
  getKenyaShaClaimsEnvironment,
  normalizeErrorString,
  OperationOutcomeError,
} from '@medplum/core';
import type {
  Bundle,
  BundleEntry,
  Claim,
  Coverage,
  Location,
  Organization,
  Patient,
  Practitioner,
  PractitionerRole,
  Reference,
  Resource,
} from '@medplum/fhirtypes';
import { randomUUID } from 'node:crypto';
import type { CountryPackSubmitNationalClaimInput, SubmitNationalClaimResult } from '../types';
import {
  getKenyaShaClaimsBaseUrl,
  getKenyaShaClaimsCredentials,
  hasKenyaShaClaimsCredentials,
  normalizeKenyaShaClaimsError,
  submitKenyaShaClaimBundle,
} from './sha';

function buildResourceFullUrl(baseUrl: string, resource: WithId<Resource>): string {
  return `${baseUrl}/fhir/${resource.resourceType}/${resource.id}`;
}

function rewriteReference<T extends Reference | undefined>(
  reference: T,
  referenceMap: ReadonlyMap<string, string>
): T {
  if (!reference?.reference) {
    return reference;
  }

  const fullUrl = referenceMap.get(reference.reference);
  if (!fullUrl) {
    return reference;
  }

  return {
    ...reference,
    reference: fullUrl,
  } as T;
}

function ensureClaimReadiness(claim: WithId<Claim>): void {
  if (!claim.item?.length) {
    throw new OperationOutcomeError(badRequest('Claim must include at least one item before Kenya SHA submission.'));
  }

  if (!claim.total?.value) {
    throw new OperationOutcomeError(badRequest('Claim total is required before Kenya SHA submission.'));
  }

  if (!claim.insurance?.length || !claim.insurance.some((entry) => !!entry.coverage?.reference)) {
    throw new OperationOutcomeError(
      badRequest('Claim must include at least one insurance entry with a Coverage reference before Kenya SHA submission.')
    );
  }
}

async function readRequiredClaimPatient(
  input: CountryPackSubmitNationalClaimInput
): Promise<WithId<Patient>> {
  return input.ctx.repo.readReference<Patient>(input.claim.patient);
}

async function readClaimCoverages(
  input: CountryPackSubmitNationalClaimInput
): Promise<WithId<Coverage>[]> {
  const coverages: WithId<Coverage>[] = [];
  for (const insurance of input.claim.insurance) {
    if (!insurance.coverage?.reference) {
      continue;
    }
    coverages.push(await input.ctx.repo.readReference<Coverage>(insurance.coverage));
  }

  if (!coverages.length) {
    throw new OperationOutcomeError(
      badRequest('Claim must include at least one readable Coverage before Kenya SHA submission.')
    );
  }

  return coverages;
}

async function readClaimOrganizations(
  input: CountryPackSubmitNationalClaimInput,
  coverages: readonly WithId<Coverage>[]
): Promise<WithId<Organization>[]> {
  const organizationMap = new Map<string, WithId<Organization>>();

  async function addOrganization(reference: Reference<Organization> | undefined): Promise<void> {
    if (!reference?.reference) {
      return;
    }
    if (organizationMap.has(reference.reference)) {
      return;
    }
    const organization = await input.ctx.repo.readReference<Organization>(reference);
    organizationMap.set(reference.reference, organization);
  }

  if (!input.claim.provider.reference?.startsWith('Organization/')) {
    throw new OperationOutcomeError(
      badRequest('Kenya SHA claim preparation currently requires Claim.provider to reference an Organization.')
    );
  }

  await addOrganization(input.claim.provider as Reference<Organization>);
  await addOrganization(input.claim.insurer);

  for (const coverage of coverages) {
    for (const payor of coverage.payor ?? []) {
      if (payor.reference?.startsWith('Organization/')) {
        await addOrganization(payor as Reference<Organization>);
      }
    }
  }

  return [...organizationMap.values()];
}

async function readClaimPractitioners(
  input: CountryPackSubmitNationalClaimInput
): Promise<WithId<Practitioner>[]> {
  const practitionerMap = new Map<string, WithId<Practitioner>>();

  async function addPractitioner(reference: Reference<Practitioner> | undefined): Promise<void> {
    if (!reference?.reference) {
      return;
    }
    if (practitionerMap.has(reference.reference)) {
      return;
    }
    const practitioner = await input.ctx.repo.readReference<Practitioner>(reference);
    practitionerMap.set(reference.reference, practitioner);
  }

  async function addFromRole(reference: Reference<PractitionerRole> | undefined): Promise<void> {
    if (!reference?.reference) {
      return;
    }
    const role = await input.ctx.repo.readReference<PractitionerRole>(reference);
    if (role.practitioner?.reference?.startsWith('Practitioner/')) {
      await addPractitioner(role.practitioner as Reference<Practitioner>);
    }
  }

  if (input.claim.provider.reference?.startsWith('Practitioner/')) {
    await addPractitioner(input.claim.provider as Reference<Practitioner>);
  } else if (input.claim.provider.reference?.startsWith('PractitionerRole/')) {
    await addFromRole(input.claim.provider as Reference<PractitionerRole>);
  }

  for (const member of input.claim.careTeam ?? []) {
    if (member.provider?.reference?.startsWith('Practitioner/')) {
      await addPractitioner(member.provider as Reference<Practitioner>);
    } else if (member.provider?.reference?.startsWith('PractitionerRole/')) {
      await addFromRole(member.provider as Reference<PractitionerRole>);
    }
  }

  if (!practitionerMap.size) {
    throw new OperationOutcomeError(
      badRequest('Kenya SHA claim preparation requires at least one Practitioner from Claim.provider or Claim.careTeam.')
    );
  }

  return [...practitionerMap.values()];
}

async function readClaimLocation(
  input: CountryPackSubmitNationalClaimInput
): Promise<WithId<Location> | undefined> {
  if (!input.claim.facility?.reference?.startsWith('Location/')) {
    return undefined;
  }
  return input.ctx.repo.readReference<Location>(input.claim.facility);
}

export async function buildKenyaNationalClaimBundle(
  input: CountryPackSubmitNationalClaimInput
): Promise<{
  readonly bundle: Bundle;
  readonly bundleId: string;
  readonly bundleEntryCount: number;
  readonly shaClaimsEnvironment: 'uat' | 'production';
  readonly submissionEndpoint: string;
  readonly statusTrackingEndpoint: string;
}> {
  ensureClaimReadiness(input.claim);

  const patient = await readRequiredClaimPatient(input);
  const coverages = await readClaimCoverages(input);
  const organizations = await readClaimOrganizations(input, coverages);
  const practitioners = await readClaimPractitioners(input);
  const location = await readClaimLocation(input);

  const shaClaimsEnvironment = getKenyaShaClaimsEnvironment(input.ctx.project);
  const claimsBaseUrl = getKenyaShaClaimsBaseUrl(input.ctx.project);
  const bundleId = randomUUID();
  const submissionEndpoint = `${claimsBaseUrl}/v1/shr-med/bundle`;
  const statusTrackingEndpoint = `${claimsBaseUrl}/v1/shr-med/claim-status?claim_id=${encodeURIComponent(bundleId)}`;

  const bundleResources: WithId<Resource>[] = [
    ...organizations,
    ...coverages,
    patient,
    ...practitioners,
    ...(location ? [location] : []),
  ];
  const referenceMap = new Map<string, string>();
  for (const resource of bundleResources) {
    referenceMap.set(createReference(resource).reference as string, buildResourceFullUrl(claimsBaseUrl, resource));
  }

  const claimFullUrl = `${claimsBaseUrl}/fhir/Claim/${bundleId}`;
  const transformedClaim: Claim = {
    ...input.claim,
    id: bundleId,
    identifier: [
      ...(input.claim.identifier ?? []),
      { system: `${claimsBaseUrl}/fhir/Claim`, value: bundleId },
    ],
    patient: rewriteReference(input.claim.patient, referenceMap),
    provider: rewriteReference(input.claim.provider, referenceMap),
    insurer: rewriteReference(input.claim.insurer, referenceMap),
    facility: rewriteReference(input.claim.facility, referenceMap),
    careTeam: input.claim.careTeam?.map((member) => ({
      ...member,
      provider: rewriteReference(member.provider, referenceMap),
    })),
    insurance: input.claim.insurance.map((insurance) => ({
      ...insurance,
      coverage: rewriteReference(insurance.coverage, referenceMap),
    })),
  };

  const bundleEntries: BundleEntry[] = [
    ...organizations.map((organization) => ({ fullUrl: buildResourceFullUrl(claimsBaseUrl, organization), resource: organization })),
    ...coverages.map((coverage) => ({
      fullUrl: buildResourceFullUrl(claimsBaseUrl, coverage),
      resource: {
        ...coverage,
        beneficiary: rewriteReference(coverage.beneficiary, referenceMap),
        payor: coverage.payor?.map((payor) => rewriteReference(payor, referenceMap)),
      },
    })),
    {
      fullUrl: buildResourceFullUrl(claimsBaseUrl, patient),
      resource: patient,
    },
    ...practitioners.map((practitioner) => ({
      fullUrl: buildResourceFullUrl(claimsBaseUrl, practitioner),
      resource: practitioner,
    })),
    ...(location
      ? [
          {
            fullUrl: buildResourceFullUrl(claimsBaseUrl, location),
            resource: location,
          } satisfies BundleEntry,
        ]
      : []),
    {
      fullUrl: claimFullUrl,
      resource: transformedClaim,
    },
  ];

  return {
    bundle: {
      resourceType: 'Bundle',
      id: bundleId,
      type: 'message',
      timestamp: new Date().toISOString(),
      entry: bundleEntries,
    },
    bundleId,
    bundleEntryCount: bundleEntries.length,
    shaClaimsEnvironment,
    submissionEndpoint,
    statusTrackingEndpoint,
  };
}

export async function submitKenyaNationalClaim(
  input: CountryPackSubmitNationalClaimInput
): Promise<SubmitNationalClaimResult> {
  const { bundle, bundleId, bundleEntryCount, shaClaimsEnvironment, submissionEndpoint, statusTrackingEndpoint } =
    await buildKenyaNationalClaimBundle(input);

  if (!hasKenyaShaClaimsCredentials(input.ctx.project)) {
    return {
      status: 'prepared',
      correlationId: input.correlationId,
      message: 'Kenya SHA claim bundle prepared from the current Medplum claim resources.',
      nextState: 'ready-for-sha-transport',
      countryPack: 'kenya',
      shaClaimsEnvironment,
      submissionEndpoint,
      statusTrackingEndpoint,
      bundleId,
      bundleEntryCount,
      rawBundle: JSON.stringify(bundle, null, 2),
    };
  }

  try {
    const credentials = getKenyaShaClaimsCredentials(input.ctx.project);
    const submission = await submitKenyaShaClaimBundle(credentials, bundle, bundleId);

    return {
      status: 'submitted',
      correlationId: input.correlationId,
      message: 'Kenya SHA claim bundle submitted successfully.',
      nextState: 'awaiting-sha-status',
      countryPack: 'kenya',
      shaClaimsEnvironment,
      submissionEndpoint: submission.submissionEndpoint,
      statusTrackingEndpoint: submission.statusTrackingEndpoint,
      responseStatusCode: submission.responseStatusCode,
      bundleId,
      bundleEntryCount,
      rawBundle: JSON.stringify(bundle, null, 2),
      rawResponse: submission.rawResponse,
    };
  } catch (err) {
    return {
      status: 'error',
      correlationId: input.correlationId,
      message: normalizeKenyaShaClaimsError(err),
      nextState: 'retry-or-review-sha-credentials',
      countryPack: 'kenya',
      shaClaimsEnvironment,
      submissionEndpoint,
      statusTrackingEndpoint,
      bundleId,
      bundleEntryCount,
      rawBundle: JSON.stringify(bundle, null, 2),
      rawResponse: normalizeErrorString(err),
    };
  }
}
