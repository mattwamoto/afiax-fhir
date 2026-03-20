// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { Claim, Coverage, Organization, Practitioner } from '@medplum/fhirtypes';
import {
  applyKenyaFacilityRegistryToOrganization,
  applyKenyaPractitionerRegistryToPractitioner,
  buildKenyaFacilityVerificationExtension,
  buildKenyaCoverageEligibilityExtension,
  buildKenyaNationalClaimStatusExtension,
  buildKenyaNationalClaimSubmissionExtension,
  buildKenyaPractitionerVerificationExtension,
  clearKenyaFacilityRegistrySnapshot,
  clearKenyaFacilityVerificationSnapshot,
  clearKenyaCoverageEligibilitySnapshot,
  clearKenyaNationalClaimStatusSnapshot,
  clearKenyaNationalClaimSubmissionSnapshot,
  clearKenyaPractitionerRegistrySnapshot,
  clearKenyaPractitionerVerificationSnapshot,
  getKenyaCoverageEligibilityLookupIdentifier,
  getKenyaCoverageEligibilitySnapshot,
  getKenyaNationalClaimStatusSnapshot,
  getKenyaFacilityVerificationSnapshot,
  getKenyaFacilityAuthorityIdentifier,
  getKenyaFacilityRegistrySnapshot,
  getKenyaNationalClaimSubmissionSnapshot,
  getKenyaPractitionerAuthorityIdentifier,
  getKenyaPractitionerLookupIdentifier,
  getKenyaPractitionerRegistrySnapshot,
  getKenyaPractitionerVerificationSnapshot,
  KenyaFacilityVerificationExtension,
  KenyaFacilityAuthorityIdentifierSystem,
  KenyaFacilityRegistrationIdentifierSystem,
  KenyaCoverageNationalIdIdentifierSystem,
  KenyaPractitionerAuthorityIdentifierSystem,
  KenyaPractitionerNationalIdIdentifierSystem,
  KenyaPractitionerVerificationExtension,
  setKenyaCoverageEligibilityLookupIdentifier,
  setKenyaFacilityAuthorityIdentifier,
  setKenyaPractitionerAuthorityIdentifier,
  setKenyaPractitionerLookupIdentifier,
} from './kenya';

describe('Kenya facility verification helpers', () => {
  test('builds and reads facility verification snapshot extensions', () => {
    const organization: Organization = {
      resourceType: 'Organization',
      extension: [
        buildKenyaFacilityVerificationExtension(
          {
            status: 'verified',
            correlationId: 'corr-123',
            message: 'Verified successfully',
            nextState: 'ready-for-registry-check',
            facilityApprovalStatus: 'approved',
            facilityOperationalStatus: 'Operational',
            currentLicenseExpiryDate: '2026-12-31',
            facilityAuthorityIdentifier: '24749',
            facilityAuthoritySystem: 'https://afiax.africa/kenya/identifier/mfl-code',
          },
          '2026-03-20T13:45:00.000Z',
          { reference: 'Task/task-123' }
        ),
      ],
    };

    expect(organization.extension?.[0]?.url).toBe(KenyaFacilityVerificationExtension.baseUrl);
    expect(getKenyaFacilityVerificationSnapshot(organization)).toEqual({
      status: 'verified',
      correlationId: 'corr-123',
      message: 'Verified successfully',
      nextState: 'ready-for-registry-check',
      verifiedAt: '2026-03-20T13:45:00.000Z',
      task: { reference: 'Task/task-123' },
      facilityApprovalStatus: 'approved',
      facilityOperationalStatus: 'Operational',
      currentLicenseExpiryDate: '2026-12-31',
      facilityAuthorityIdentifier: '24749',
      facilityAuthoritySystem: 'https://afiax.africa/kenya/identifier/mfl-code',
    });
  });

  test('gets and sets Kenya facility authority identifier', () => {
    const original: Organization = {
      resourceType: 'Organization',
      identifier: [{ system: 'https://example.com/local-id', value: 'abc' }],
    };

    const updated = setKenyaFacilityAuthorityIdentifier(original, '24749');
    expect(getKenyaFacilityAuthorityIdentifier(updated)).toEqual(
      expect.objectContaining({
        system: KenyaFacilityAuthorityIdentifierSystem,
        value: '24749',
      })
    );
  });

  test('clears Kenya facility verification snapshot', () => {
    const organization: Organization = {
      resourceType: 'Organization',
      extension: [
        {
          url: KenyaFacilityVerificationExtension.baseUrl,
          extension: [{ url: KenyaFacilityVerificationExtension.status, valueCode: 'verified' }],
        },
        { url: 'https://example.com/other', valueString: 'keep-me' },
      ],
    };

    expect(clearKenyaFacilityVerificationSnapshot(organization).extension).toEqual([
      { url: 'https://example.com/other', valueString: 'keep-me' },
    ]);
  });

  test('clears Kenya facility registry snapshot', () => {
    const organization: Organization = {
      resourceType: 'Organization',
      extension: [
        {
          url: 'https://afiax.africa/fhir/StructureDefinition/kenya-facility-registry',
          extension: [{ url: 'facilityCode', valueString: '15409' }],
        },
        { url: 'https://example.com/other', valueString: 'keep-me' },
      ],
    };

    expect(clearKenyaFacilityRegistrySnapshot(organization).extension).toEqual([
      { url: 'https://example.com/other', valueString: 'keep-me' },
    ]);
  });

  test('applies Kenya facility registry data to organization', () => {
    const organization: Organization = {
      resourceType: 'Organization',
      name: 'Local Name',
    };

    const updated = applyKenyaFacilityRegistryToOrganization(
      organization,
      {
        facilityCode: '15409',
        found: 1,
        facilityName: 'Registry Facility',
        registrationNumber: 'REG-001',
        regulator: 'KMPDC',
        approvalStatus: 'yes',
        facilityLevel: 'Level 4',
        facilityCategory: 'Hospital',
        facilityOwner: 'faith-based',
        facilityType: 'Hospital',
        county: 'Nairobi',
        subCounty: 'Westlands',
        ward: 'Parklands',
        operationalStatus: 'active',
        currentLicenseExpiryDate: '2026-12-31',
      },
      '2026-03-20T14:00:00.000Z'
    );

    expect(updated.name).toBe('Registry Facility');
    expect(getKenyaFacilityAuthorityIdentifier(updated)).toEqual(
      expect.objectContaining({
        system: KenyaFacilityAuthorityIdentifierSystem,
        value: '15409',
      })
    );
    expect(updated.identifier).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          system: KenyaFacilityRegistrationIdentifierSystem,
          value: 'REG-001',
        }),
      ])
    );
    expect(getKenyaFacilityRegistrySnapshot(updated)).toEqual({
      facilityCode: '15409',
      found: true,
      facilityName: 'Registry Facility',
      registrationNumber: 'REG-001',
      regulator: 'KMPDC',
      approvalStatus: 'yes',
      facilityLevel: 'Level 4',
      facilityCategory: 'Hospital',
      facilityOwner: 'faith-based',
      facilityType: 'Hospital',
      county: 'Nairobi',
      subCounty: 'Westlands',
      ward: 'Parklands',
      operationalStatus: 'active',
      currentLicenseExpiryDate: '2026-12-31',
      lookedUpAt: '2026-03-20T14:00:00.000Z',
    });
  });

  test('builds and reads practitioner verification snapshot extensions', () => {
    const practitioner: Practitioner = {
      resourceType: 'Practitioner',
      extension: [
        buildKenyaPractitionerVerificationExtension(
          {
            status: 'verified',
            correlationId: 'corr-prac-123',
            message: 'Practitioner verified successfully',
            nextState: 'ready-for-care-delivery',
            practitionerAuthorityIdentifier: '40675898',
            practitionerAuthoritySystem: KenyaPractitionerAuthorityIdentifierSystem,
            registrationNumber: '40675898',
            identificationType: 'ID',
            identificationNumber: '12345678',
            practitionerActiveStatus: 'yes',
          },
          '2026-03-20T15:00:00.000Z',
          { reference: 'Task/task-prac-123' }
        ),
      ],
    };

    expect(practitioner.extension?.[0]?.url).toBe(KenyaPractitionerVerificationExtension.baseUrl);
    expect(getKenyaPractitionerVerificationSnapshot(practitioner)).toEqual({
      status: 'verified',
      correlationId: 'corr-prac-123',
      message: 'Practitioner verified successfully',
      nextState: 'ready-for-care-delivery',
      verifiedAt: '2026-03-20T15:00:00.000Z',
      task: { reference: 'Task/task-prac-123' },
      practitionerAuthorityIdentifier: '40675898',
      practitionerAuthoritySystem: KenyaPractitionerAuthorityIdentifierSystem,
      registrationNumber: '40675898',
      identificationType: 'ID',
      identificationNumber: '12345678',
      practitionerActiveStatus: 'yes',
    });
  });

  test('gets and sets Kenya practitioner identifiers', () => {
    const original: Practitioner = {
      resourceType: 'Practitioner',
      identifier: [{ system: 'https://example.com/local-id', value: 'abc' }],
    };

    const withLookupId = setKenyaPractitionerLookupIdentifier(original, 'ID', '12345678');
    expect(getKenyaPractitionerLookupIdentifier(withLookupId)).toEqual(
      expect.objectContaining({
        identificationType: 'ID',
        identifier: expect.objectContaining({
          system: KenyaPractitionerNationalIdIdentifierSystem,
          value: '12345678',
        }),
      })
    );

    const withAuthorityId = setKenyaPractitionerAuthorityIdentifier(withLookupId, '40675898');
    expect(getKenyaPractitionerAuthorityIdentifier(withAuthorityId)).toEqual(
      expect.objectContaining({
        system: KenyaPractitionerAuthorityIdentifierSystem,
        value: '40675898',
      })
    );
  });

  test('clears Kenya practitioner verification snapshot', () => {
    const practitioner: Practitioner = {
      resourceType: 'Practitioner',
      extension: [
        {
          url: KenyaPractitionerVerificationExtension.baseUrl,
          extension: [{ url: KenyaPractitionerVerificationExtension.status, valueCode: 'verified' }],
        },
        { url: 'https://example.com/other', valueString: 'keep-me' },
      ],
    };

    expect(clearKenyaPractitionerVerificationSnapshot(practitioner).extension).toEqual([
      { url: 'https://example.com/other', valueString: 'keep-me' },
    ]);
  });

  test('clears Kenya practitioner registry snapshot', () => {
    const practitioner: Practitioner = {
      resourceType: 'Practitioner',
      extension: [
        {
          url: 'https://afiax.africa/fhir/StructureDefinition/kenya-practitioner-registry',
          extension: [{ url: 'identificationNumber', valueString: '12345678' }],
        },
        { url: 'https://example.com/other', valueString: 'keep-me' },
      ],
    };

    expect(clearKenyaPractitionerRegistrySnapshot(practitioner).extension).toEqual([
      { url: 'https://example.com/other', valueString: 'keep-me' },
    ]);
  });

  test('applies Kenya practitioner registry data to practitioner', () => {
    const practitioner: Practitioner = {
      resourceType: 'Practitioner',
    };

    const updated = applyKenyaPractitionerRegistryToPractitioner(
      practitioner,
      {
        identificationType: 'ID',
        identificationNumber: '12345678',
        registrationNumber: '40675898',
        found: 1,
        isActive: 'yes',
      },
      '2026-03-20T16:00:00.000Z'
    );

    expect(getKenyaPractitionerLookupIdentifier(updated)).toEqual(
      expect.objectContaining({
        identificationType: 'ID',
        identifier: expect.objectContaining({
          system: KenyaPractitionerNationalIdIdentifierSystem,
          value: '12345678',
        }),
      })
    );
    expect(getKenyaPractitionerAuthorityIdentifier(updated)).toEqual(
      expect.objectContaining({
        system: KenyaPractitionerAuthorityIdentifierSystem,
        value: '40675898',
      })
    );
    expect(getKenyaPractitionerRegistrySnapshot(updated)).toEqual({
      identificationType: 'ID',
      identificationNumber: '12345678',
      registrationNumber: '40675898',
      found: true,
      isActive: true,
      lookedUpAt: '2026-03-20T16:00:00.000Z',
    });
  });

  test('builds and reads Kenya coverage eligibility snapshot extensions', () => {
    const coverage: Coverage = {
      resourceType: 'Coverage',
      status: 'active',
      beneficiary: { reference: 'Patient/123' },
      payor: [{ reference: 'Organization/sha' }],
      extension: [
        buildKenyaCoverageEligibilityExtension(
          {
            status: 'eligible',
            correlationId: 'corr-cov-123',
            message: 'Coverage is active',
            nextState: 'ready-for-sha-pathway',
            identificationType: 'National ID',
            identificationNumber: '12345678',
            eligible: true,
            fullName: 'Afiax Test Patient',
            reason: 'Active member',
            possibleSolution: 'Proceed to benefits check',
            coverageEndDate: '2026-12-31',
            transitionStatus: 'active',
            requestId: 'dha-req-123',
            requestIdNumber: '12345678',
            requestIdType: 'National ID',
          },
          '2026-03-20T17:00:00.000Z',
          {
            task: { reference: 'Task/task-cov-123' },
            eligibilityRequest: { reference: 'CoverageEligibilityRequest/req-123' },
            eligibilityResponse: { reference: 'CoverageEligibilityResponse/res-123' },
          }
        ),
      ],
    };

    expect(getKenyaCoverageEligibilitySnapshot(coverage)).toEqual({
      status: 'eligible',
      correlationId: 'corr-cov-123',
      message: 'Coverage is active',
      nextState: 'ready-for-sha-pathway',
      checkedAt: '2026-03-20T17:00:00.000Z',
      task: { reference: 'Task/task-cov-123' },
      eligibilityRequest: { reference: 'CoverageEligibilityRequest/req-123' },
      eligibilityResponse: { reference: 'CoverageEligibilityResponse/res-123' },
      identificationType: 'National ID',
      identificationNumber: '12345678',
      eligible: true,
      fullName: 'Afiax Test Patient',
      reason: 'Active member',
      possibleSolution: 'Proceed to benefits check',
      coverageEndDate: '2026-12-31',
      transitionStatus: 'active',
      requestId: 'dha-req-123',
      requestIdNumber: '12345678',
      requestIdType: 'National ID',
    });
  });

  test('gets and sets Kenya coverage eligibility lookup identifier', () => {
    const original: Coverage = {
      resourceType: 'Coverage',
      status: 'active',
      beneficiary: { reference: 'Patient/123' },
      payor: [{ reference: 'Organization/sha' }],
    };

    const updated = setKenyaCoverageEligibilityLookupIdentifier(original, 'National ID', '12345678');
    expect(getKenyaCoverageEligibilityLookupIdentifier(updated)).toEqual(
      expect.objectContaining({
        identificationType: 'National ID',
        identifier: expect.objectContaining({
          system: KenyaCoverageNationalIdIdentifierSystem,
          value: '12345678',
        }),
      })
    );
  });

  test('clears Kenya coverage eligibility snapshot', () => {
    const coverage: Coverage = {
      resourceType: 'Coverage',
      status: 'active',
      beneficiary: { reference: 'Patient/123' },
      payor: [{ reference: 'Organization/sha' }],
      extension: [
        {
          url: 'https://afiax.africa/fhir/StructureDefinition/kenya-coverage-eligibility',
          extension: [{ url: 'status', valueCode: 'eligible' }],
        },
        { url: 'https://example.com/other', valueString: 'keep-me' },
      ],
    };

    expect(clearKenyaCoverageEligibilitySnapshot(coverage).extension).toEqual([
      { url: 'https://example.com/other', valueString: 'keep-me' },
    ]);
  });

  test('builds and reads Kenya national claim submission snapshot extensions', () => {
    const claim: Claim = {
      resourceType: 'Claim',
      status: 'active',
      type: { text: 'Institutional' },
      use: 'claim',
      patient: { reference: 'Patient/123' },
      created: '2026-03-20',
      provider: { reference: 'Organization/456' },
      priority: { text: 'normal' },
      insurance: [{ sequence: 1, focal: true, coverage: { reference: 'Coverage/123' } }],
      extension: [
        buildKenyaNationalClaimSubmissionExtension(
          {
            status: 'prepared',
            correlationId: 'corr-claim-123',
            message: 'Kenya SHA claim bundle prepared',
            nextState: 'ready-for-sha-connector',
            shaClaimsEnvironment: 'uat',
            submissionEndpoint: 'https://qa-mis.apeiro-digital.com/v1/shr-med/bundle',
            statusTrackingEndpoint: 'https://qa-mis.apeiro-digital.com/v1/shr-med/claim-status?claim_id=bundle-123',
            responseStatusCode: 202,
            bundleId: 'bundle-123',
            bundleEntryCount: 5,
            workflowBot: 'Bot/bot-claim-123',
            workflowBotStatus: 'triggered',
            workflowBotMessage: 'Configured Kenya claim workflow bot executed successfully.',
          },
          '2026-03-20T18:00:00.000Z',
          { reference: 'Task/task-claim-123' }
        ),
      ],
    };

    expect(getKenyaNationalClaimSubmissionSnapshot(claim)).toEqual({
      status: 'prepared',
      correlationId: 'corr-claim-123',
      message: 'Kenya SHA claim bundle prepared',
      nextState: 'ready-for-sha-connector',
      submittedAt: '2026-03-20T18:00:00.000Z',
      task: { reference: 'Task/task-claim-123' },
      shaClaimsEnvironment: 'uat',
      submissionEndpoint: 'https://qa-mis.apeiro-digital.com/v1/shr-med/bundle',
      statusTrackingEndpoint: 'https://qa-mis.apeiro-digital.com/v1/shr-med/claim-status?claim_id=bundle-123',
      responseStatusCode: 202,
      bundleId: 'bundle-123',
      bundleEntryCount: 5,
      workflowBot: 'Bot/bot-claim-123',
      workflowBotStatus: 'triggered',
      workflowBotMessage: 'Configured Kenya claim workflow bot executed successfully.',
    });
  });

  test('builds and reads Kenya national claim status snapshot extensions', () => {
    const claim: Claim = {
      resourceType: 'Claim',
      status: 'active',
      type: { text: 'Institutional' },
      use: 'claim',
      patient: { reference: 'Patient/123' },
      created: '2026-03-20',
      provider: { reference: 'Organization/456' },
      priority: { text: 'normal' },
      insurance: [{ sequence: 1, focal: true, coverage: { reference: 'Coverage/123' } }],
      extension: [
        buildKenyaNationalClaimStatusExtension(
          {
            status: 'adjudicated',
            correlationId: 'corr-claim-status-123',
            message: 'Claim approved for payment',
            nextState: 'ready-for-financial-reconciliation',
            shaClaimsEnvironment: 'uat',
            statusEndpoint: 'https://qa-mis.apeiro-digital.com/v1/shr-med/claim-status?claim_id=bundle-123',
            responseStatusCode: 200,
            claimId: 'bundle-123',
            claimState: 'Payment Approved',
            workflowBot: 'Bot/bot-claim-status-123',
            workflowBotStatus: 'triggered',
            workflowBotMessage: 'Configured Kenya claim workflow bot executed successfully.',
          },
          '2026-03-20T19:00:00.000Z',
          {
            task: { reference: 'Task/task-claim-status-123' },
            claimResponse: { reference: 'ClaimResponse/claim-response-123' },
          }
        ),
      ],
    };

    expect(getKenyaNationalClaimStatusSnapshot(claim)).toEqual({
      status: 'adjudicated',
      correlationId: 'corr-claim-status-123',
      message: 'Claim approved for payment',
      nextState: 'ready-for-financial-reconciliation',
      checkedAt: '2026-03-20T19:00:00.000Z',
      task: { reference: 'Task/task-claim-status-123' },
      claimResponse: { reference: 'ClaimResponse/claim-response-123' },
      shaClaimsEnvironment: 'uat',
      statusEndpoint: 'https://qa-mis.apeiro-digital.com/v1/shr-med/claim-status?claim_id=bundle-123',
      responseStatusCode: 200,
      claimId: 'bundle-123',
      claimState: 'Payment Approved',
      workflowBot: 'Bot/bot-claim-status-123',
      workflowBotStatus: 'triggered',
      workflowBotMessage: 'Configured Kenya claim workflow bot executed successfully.',
    });
  });

  test('clears Kenya national claim submission snapshot', () => {
    const claim: Claim = {
      resourceType: 'Claim',
      status: 'active',
      type: { text: 'Institutional' },
      use: 'claim',
      patient: { reference: 'Patient/123' },
      created: '2026-03-20',
      provider: { reference: 'Organization/456' },
      priority: { text: 'normal' },
      insurance: [{ sequence: 1, focal: true, coverage: { reference: 'Coverage/123' } }],
      extension: [
        {
          url: 'https://afiax.africa/fhir/StructureDefinition/kenya-national-claim-submission',
          extension: [{ url: 'status', valueCode: 'prepared' }],
        },
        { url: 'https://example.com/other', valueString: 'keep-me' },
      ],
    };

    expect(clearKenyaNationalClaimSubmissionSnapshot(claim).extension).toEqual([
      { url: 'https://example.com/other', valueString: 'keep-me' },
    ]);
  });

  test('clears Kenya national claim status snapshot', () => {
    const claim: Claim = {
      resourceType: 'Claim',
      status: 'active',
      type: { text: 'Institutional' },
      use: 'claim',
      patient: { reference: 'Patient/123' },
      created: '2026-03-20',
      provider: { reference: 'Organization/456' },
      priority: { text: 'normal' },
      insurance: [{ sequence: 1, focal: true, coverage: { reference: 'Coverage/123' } }],
      extension: [
        {
          url: 'https://afiax.africa/fhir/StructureDefinition/kenya-national-claim-status',
          extension: [{ url: 'status', valueCode: 'queued' }],
        },
        { url: 'https://example.com/other', valueString: 'keep-me' },
      ],
    };

    expect(clearKenyaNationalClaimStatusSnapshot(claim).extension).toEqual([
      { url: 'https://example.com/other', valueString: 'keep-me' },
    ]);
  });
});
