// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { Organization, Project } from '@medplum/fhirtypes';
import fetch from 'node-fetch';
import { verifyKenyaFacilityAuthority } from './verify-facility-authority';

jest.mock('node-fetch');

describe('verifyKenyaFacilityAuthority', () => {
  function buildInput(organization: Organization, project?: Project): Parameters<typeof verifyKenyaFacilityAuthority>[0] {
    return {
      correlationId: 'corr-1',
      organization: {
        ...organization,
        id: organization.id ?? 'org-1',
      },
      ctx: {
        project:
          project ??
          ({
            resourceType: 'Project',
            id: 'project-1',
            setting: [{ name: 'countryPack', valueString: 'kenya' }],
          } as Project),
        systemRepo: {
          readResource: jest.fn(async () =>
            ({
              resourceType: 'Project',
              id: 'project-1',
              setting: [{ name: 'countryPack', valueString: 'kenya' }],
              secret: [
                { name: 'kenyaAfyaLinkBaseUrl', valueString: 'https://afyalink.example.com' },
                { name: 'kenyaAfyaLinkConsumerKey', valueString: 'consumer-key' },
                { name: 'kenyaAfyaLinkUsername', valueString: 'username' },
                { name: 'kenyaAfyaLinkPassword', valueString: 'password' },
              ],
            }) as Project
          ),
        },
      } as any,
    };
  }

  beforeEach(() => {
    (fetch as unknown as jest.Mock).mockClear();
  });

  test('returns verified when facility authority identifier is present', async () => {
    (fetch as unknown as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn(async () => ({ token: 'jwt-token' })),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn(async () => ({
          message: { facility_code: '12345', found: 1, approved: true, operational_status: 'Operational' },
        })),
      });

    await expect(
      verifyKenyaFacilityAuthority(
        buildInput({
          resourceType: 'Organization',
          name: 'Afiax Clinic',
          active: true,
          identifier: [{ system: 'https://afiax.africa/kenya/identifier/mfl-code', value: '12345' }],
        })
      )
    ).resolves.toMatchObject({
      status: 'verified',
      facilityAuthorityIdentifier: '12345',
      registryFound: true,
      nextState: 'ready-for-registry-check',
    });
  });

  test('returns unverified when facility authority identifier is missing', async () => {
    await expect(
      verifyKenyaFacilityAuthority(
        buildInput({
          resourceType: 'Organization',
          name: 'Afiax Clinic',
          active: true,
        })
      )
    ).resolves.toMatchObject({
      status: 'unverified',
      nextState: 'capture-facility-authority-id',
    });
  });

  test('returns inactive when the organization is inactive', async () => {
    (fetch as unknown as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn(async () => ({ token: 'jwt-token' })),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn(async () => ({
          message: { facility_code: '12345', found: 1, approved: true, operational_status: 'Operational' },
        })),
      });

    await expect(
      verifyKenyaFacilityAuthority(
        buildInput({
          resourceType: 'Organization',
          name: 'Afiax Clinic',
          active: false,
          identifier: [{ system: 'https://afiax.africa/kenya/identifier/mfl-code', value: '12345' }],
        })
      )
    ).resolves.toMatchObject({
      status: 'inactive',
      nextState: 'reactivate-or-correct-facility',
    });
  });

  test('returns unverified when AfyaLink facility is not found', async () => {
    (fetch as unknown as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn(async () => ({ token: 'jwt-token' })),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: jest.fn(async () => 'not found'),
      });

    await expect(
      verifyKenyaFacilityAuthority(
        buildInput({
          resourceType: 'Organization',
          name: 'Afiax Clinic',
          active: true,
          identifier: [{ system: 'https://afiax.africa/kenya/identifier/mfl-code', value: '12345' }],
        })
      )
    ).resolves.toMatchObject({
      status: 'unverified',
      registryFound: false,
      nextState: 'review-facility-authority-id',
    });
  });
});
