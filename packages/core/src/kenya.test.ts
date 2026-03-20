// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { Organization } from '@medplum/fhirtypes';
import {
  buildKenyaFacilityVerificationExtension,
  clearKenyaFacilityVerificationSnapshot,
  getKenyaFacilityVerificationSnapshot,
  getKenyaFacilityAuthorityIdentifier,
  KenyaFacilityVerificationExtension,
  KenyaFacilityAuthorityIdentifierSystem,
  setKenyaFacilityAuthorityIdentifier,
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
});
