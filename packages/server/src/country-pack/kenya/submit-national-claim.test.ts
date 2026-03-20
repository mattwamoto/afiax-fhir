// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import fetch from 'node-fetch';
import type { Claim, Coverage, Organization, Patient, Practitioner, Project } from '@medplum/fhirtypes';
import { buildKenyaNationalClaimBundle, submitKenyaNationalClaim } from './submit-national-claim';

jest.mock('node-fetch');

describe('submitKenyaNationalClaim', () => {
  beforeEach(() => {
    (fetch as unknown as jest.Mock).mockReset();
  });

  test('builds a Kenya SHA claim bundle from Medplum claim resources', async () => {
    const patient: Patient = {
      resourceType: 'Patient',
      id: 'patient-123',
      name: [{ text: 'Afiax Test Patient' }],
    };
    const providerOrganization: Organization = {
      resourceType: 'Organization',
      id: 'org-123',
      name: 'Afiax Test Facility',
    };
    const insurerOrganization: Organization = {
      resourceType: 'Organization',
      id: 'sha-123',
      name: 'SHA',
    };
    const coverage: Coverage = {
      resourceType: 'Coverage',
      id: 'coverage-123',
      status: 'active',
      beneficiary: { reference: 'Patient/patient-123' },
      payor: [{ reference: 'Organization/sha-123' }],
    };
    const practitioner: Practitioner = {
      resourceType: 'Practitioner',
      id: 'practitioner-123',
      name: [{ text: 'Dr Afiax' }],
    };
    const claim: Claim = {
      resourceType: 'Claim',
      id: 'claim-123',
      status: 'active',
      type: { text: 'Institutional' },
      use: 'claim',
      patient: { reference: 'Patient/patient-123' },
      created: '2026-03-20',
      provider: { reference: 'Organization/org-123' },
      priority: { text: 'normal' },
      insurance: [{ sequence: 1, focal: true, coverage: { reference: 'Coverage/coverage-123' } }],
      careTeam: [{ sequence: 1, provider: { reference: 'Practitioner/practitioner-123' } }],
      item: [{ sequence: 1, productOrService: { text: 'Consultation' } }],
      total: { value: 1000, currency: 'KES' },
    };

    const resources = new Map<string, object>([
      ['Patient/patient-123', patient],
      ['Organization/org-123', providerOrganization],
      ['Organization/sha-123', insurerOrganization],
      ['Coverage/coverage-123', coverage],
      ['Practitioner/practitioner-123', practitioner],
    ]);

    const repo = {
      readReference: jest.fn(async (reference: { reference?: string }) => {
        const resource = reference.reference ? resources.get(reference.reference) : undefined;
        if (!resource) {
          throw new Error(`Missing reference ${reference.reference}`);
        }
        return resource;
      }),
    };

    const { bundle, bundleEntryCount, shaClaimsEnvironment, submissionEndpoint } = await buildKenyaNationalClaimBundle({
      ctx: {
        repo,
        project: {
          resourceType: 'Project',
          id: 'project-123',
          setting: [
            { name: 'countryPack', valueString: 'kenya' },
            { name: 'kenyaShaClaimsEnvironment', valueString: 'uat' },
          ],
        } as Project,
      } as any,
      claim: claim as Claim & { id: string },
      correlationId: 'corr-claim-123',
    });

    expect(shaClaimsEnvironment).toBe('uat');
    expect(submissionEndpoint).toBe('https://qa-mis.apeiro-digital.com/v1/shr-med/bundle');
    expect(bundle.type).toBe('message');
    expect(bundleEntryCount).toBe(6);
    expect(bundle.entry?.some((entry) => entry.resource?.resourceType === 'Claim')).toBe(true);
    expect(bundle.entry?.some((entry) => entry.resource?.resourceType === 'Coverage')).toBe(true);

    const claimEntry = bundle.entry?.find((entry) => entry.resource?.resourceType === 'Claim');
    const bundledClaim = claimEntry?.resource as Claim;
    expect(bundledClaim.patient.reference).toBe('https://qa-mis.apeiro-digital.com/fhir/Patient/patient-123');
    expect(bundledClaim.provider.reference).toBe('https://qa-mis.apeiro-digital.com/fhir/Organization/org-123');
    expect(bundledClaim.insurance[0].coverage.reference).toBe(
      'https://qa-mis.apeiro-digital.com/fhir/Coverage/coverage-123'
    );
    expect(bundledClaim.careTeam?.[0]?.provider?.reference).toBe(
      'https://qa-mis.apeiro-digital.com/fhir/Practitioner/practitioner-123'
    );
  });

  test('submits the Kenya SHA claim bundle when SHA credentials are configured', async () => {
    const patient: Patient = {
      resourceType: 'Patient',
      id: 'patient-123',
    };
    const providerOrganization: Organization = {
      resourceType: 'Organization',
      id: 'org-123',
      name: 'Afiax Test Facility',
    };
    const insurerOrganization: Organization = {
      resourceType: 'Organization',
      id: 'sha-123',
      name: 'SHA',
    };
    const coverage: Coverage = {
      resourceType: 'Coverage',
      id: 'coverage-123',
      status: 'active',
      beneficiary: { reference: 'Patient/patient-123' },
      payor: [{ reference: 'Organization/sha-123' }],
    };
    const practitioner: Practitioner = {
      resourceType: 'Practitioner',
      id: 'practitioner-123',
    };
    const claim: Claim = {
      resourceType: 'Claim',
      id: 'claim-123',
      status: 'active',
      type: { text: 'Institutional' },
      use: 'claim',
      patient: { reference: 'Patient/patient-123' },
      created: '2026-03-20',
      provider: { reference: 'Organization/org-123' },
      priority: { text: 'normal' },
      insurance: [{ sequence: 1, focal: true, coverage: { reference: 'Coverage/coverage-123' } }],
      careTeam: [{ sequence: 1, provider: { reference: 'Practitioner/practitioner-123' } }],
      item: [{ sequence: 1, productOrService: { text: 'Consultation' } }],
      total: { value: 1000, currency: 'KES' },
    };

    const resources = new Map<string, object>([
      ['Patient/patient-123', patient],
      ['Organization/org-123', providerOrganization],
      ['Organization/sha-123', insurerOrganization],
      ['Coverage/coverage-123', coverage],
      ['Practitioner/practitioner-123', practitioner],
    ]);

    const repo = {
      readReference: jest.fn(async (reference: { reference?: string }) => {
        const resource = reference.reference ? resources.get(reference.reference) : undefined;
        if (!resource) {
          throw new Error(`Missing reference ${reference.reference}`);
        }
        return resource;
      }),
    };

    (fetch as unknown as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 202,
        text: jest.fn(async () => JSON.stringify({ status: 'accepted', bundleId: 'remote-123' })),
      });

    const result = await submitKenyaNationalClaim({
      ctx: {
        repo,
        project: {
          resourceType: 'Project',
          id: 'project-123',
          setting: [
            { name: 'countryPack', valueString: 'kenya' },
            { name: 'kenyaShaClaimsEnvironment', valueString: 'uat' },
          ],
          secret: [
            { name: 'kenyaShaClaimsAccessKey', valueString: 'sha-access-key' },
            { name: 'kenyaShaClaimsSecretKey', valueString: 'sha-secret-key' },
          ],
        } as Project,
      } as any,
      claim: claim as Claim & { id: string },
      correlationId: 'corr-claim-123',
    });

    expect(result.status).toBe('submitted');
    expect(result.submissionEndpoint).toBe('https://qa-mis.apeiro-digital.com/v1/shr-med/bundle');
    expect(result.statusTrackingEndpoint).toContain('/v1/shr-med/claim-status?claim_id=');
    expect(result.responseStatusCode).toBe(202);
    expect(result.rawResponse).toContain('"status":"accepted"');
    expect(fetch).toHaveBeenCalledWith(
      'https://qa-mis.apeiro-digital.com/v1/shr-med/bundle',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: expect.stringMatching(/^Bearer /),
          'Content-Type': 'application/fhir+json',
        }),
      })
    );
  });
});
