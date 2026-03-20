// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { Project } from '@medplum/fhirtypes';
import fetch from 'node-fetch';
import {
  getAfyaLinkToken,
  getKenyaAfyaLinkCredentials,
  KenyaAfyaLinkSecretNames,
  searchAfyaLinkFacility,
} from './afyalink';

jest.mock('node-fetch');

describe('Kenya AfyaLink connector', () => {
  const project: Project = {
    resourceType: 'Project',
    id: 'project-1',
    secret: [
      { name: KenyaAfyaLinkSecretNames.consumerKey, valueString: 'consumer-key' },
      { name: KenyaAfyaLinkSecretNames.username, valueString: 'username' },
      { name: KenyaAfyaLinkSecretNames.password, valueString: 'password' },
    ],
  };

  beforeEach(() => {
    (fetch as unknown as jest.Mock).mockClear();
  });

  test('loads tenant-managed credentials with default UAT base URL', () => {
    expect(getKenyaAfyaLinkCredentials(project)).toEqual({
      baseUrl: 'https://uat.dha.go.ke',
      consumerKey: 'consumer-key',
      username: 'username',
      password: 'password',
    });
  });

  test('loads Afiax-managed credentials from system secrets only', () => {
    expect(
      getKenyaAfyaLinkCredentials({
        ...project,
        setting: [{ name: 'kenyaHieCredentialMode', valueString: 'afiax-managed' }],
        systemSecret: [
          { name: KenyaAfyaLinkSecretNames.consumerKey, valueString: 'platform-consumer-key' },
          { name: KenyaAfyaLinkSecretNames.username, valueString: 'platform-username' },
          { name: KenyaAfyaLinkSecretNames.password, valueString: 'platform-password' },
        ],
      })
    ).toEqual({
      baseUrl: 'https://uat.dha.go.ke',
      consumerKey: 'platform-consumer-key',
      username: 'platform-username',
      password: 'platform-password',
    });
  });

  test('gets token with basic auth', async () => {
    (fetch as unknown as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: jest.fn(async () => JSON.stringify({ token: 'jwt-token' })),
    });

    const credentials = getKenyaAfyaLinkCredentials(project);
    await expect(getAfyaLinkToken(credentials)).resolves.toBe('jwt-token');

    expect(fetch).toHaveBeenCalledWith(
      'https://uat.dha.go.ke/v1/hie-auth?key=consumer-key',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: `Basic ${Buffer.from('username:password').toString('base64')}`,
        }),
      })
    );
  });

  test('gets raw JWT token when DHA returns plain text', async () => {
    (fetch as unknown as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: jest.fn(async () => 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.payload.signature'),
    });

    const credentials = getKenyaAfyaLinkCredentials(project);
    await expect(getAfyaLinkToken(credentials)).resolves.toBe(
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.payload.signature'
    );
  });

  test('searches facility registry with bearer token', async () => {
    (fetch as unknown as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        text: jest.fn(async () => JSON.stringify({ token: 'jwt-token' })),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn(async () => ({
          message: {
            facility_code: '24749',
            found: 1,
            approved: true,
            operational_status: 'Operational',
          },
        })),
      });

    const credentials = getKenyaAfyaLinkCredentials(project);
    await expect(searchAfyaLinkFacility(credentials, '24749')).resolves.toMatchObject({
      message: {
        facility_code: '24749',
        found: 1,
      },
    });

    expect(fetch).toHaveBeenLastCalledWith(
      'https://uat.dha.go.ke/v1/facility-search?facility_code=24749',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer jwt-token',
        }),
      })
    );
  });

  test('normalizes facility search when DHA returns facility fields at the root', async () => {
    (fetch as unknown as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        text: jest.fn(async () => JSON.stringify({ token: 'jwt-token' })),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn(async () => ({
          facility_code: '15409',
          found: 1,
          facility_name: 'Mbagathi County Hospital',
          facility_level: 'Level 4',
          county: 'Nairobi',
        })),
      });

    const credentials = getKenyaAfyaLinkCredentials(project);
    await expect(searchAfyaLinkFacility(credentials, '15409')).resolves.toEqual({
      message: {
        id: null,
        facility_name: 'Mbagathi County Hospital',
        registration_number: null,
        regulator: null,
        facility_code: '15409',
        found: 1,
        approved: null,
        facility_level: 'Level 4',
        facility_category: null,
        facility_owner: null,
        facility_type: null,
        county: 'Nairobi',
        sub_county: null,
        ward: null,
        operational_status: null,
        current_license_expiry_date: null,
      },
    });
  });

  test('normalizes string found values from DHA facility search', async () => {
    (fetch as unknown as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        text: jest.fn(async () => JSON.stringify({ token: 'jwt-token' })),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn(async () => ({
          message: {
            facility_code: '15409',
            found: '1',
            facility_name: 'Mbagathi County Hospital',
          },
        })),
      });

    const credentials = getKenyaAfyaLinkCredentials(project);
    await expect(searchAfyaLinkFacility(credentials, '15409')).resolves.toEqual({
      message: {
        id: null,
        facility_name: 'Mbagathi County Hospital',
        registration_number: null,
        regulator: null,
        facility_code: '15409',
        found: 1,
        approved: null,
        facility_level: null,
        facility_category: null,
        facility_owner: null,
        facility_type: null,
        county: null,
        sub_county: null,
        ward: null,
        operational_status: null,
        current_license_expiry_date: null,
      },
    });
  });
});
