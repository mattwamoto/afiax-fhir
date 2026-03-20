// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { Practitioner, Project } from '@medplum/fhirtypes';
import * as afyaLink from './afyalink';
import { verifyKenyaPractitionerAuthority } from './verify-practitioner-authority';

describe('verifyKenyaPractitionerAuthority', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  function createContext(project: Project): any {
    return {
      repo: {},
      systemRepo: {
        readResource: jest.fn(async () => project),
      },
      project,
      projectMembers: [],
    };
  }

  test('returns unverified when practitioner lookup identifier is missing', async () => {
    const project: Project = {
      resourceType: 'Project',
      id: 'project-prac-1',
      name: 'Project Practitioner 1',
      setting: [{ name: 'countryPack', valueString: 'kenya' }],
    };

    const result = await verifyKenyaPractitionerAuthority({
      ctx: createContext(project),
      practitioner: {
        resourceType: 'Practitioner',
        id: 'practitioner-1',
      },
      correlationId: 'corr-prac-1',
    });

    expect(result).toMatchObject({
      status: 'unverified',
      correlationId: 'corr-prac-1',
      nextState: 'capture-practitioner-identity-document',
    });
  });

  test('verifies practitioner when DHA returns an active registration', async () => {
    const project: Project = {
      resourceType: 'Project',
      id: 'project-prac-2',
      name: 'Project Practitioner 2',
      setting: [{ name: 'countryPack', valueString: 'kenya' }],
      secret: [
        { name: 'kenyaAfyaLinkConsumerKey', valueString: 'consumer-key' },
        { name: 'kenyaAfyaLinkUsername', valueString: 'username' },
        { name: 'kenyaAfyaLinkPassword', valueString: 'password' },
      ],
    };

    jest.spyOn(afyaLink, 'searchAfyaLinkPractitioner').mockResolvedValueOnce({
      message: {
        registration_number: '40675898',
        found: 1,
        is_active: 'yes',
      },
    });

    const result = await verifyKenyaPractitionerAuthority({
      ctx: createContext(project),
      practitioner: {
        resourceType: 'Practitioner',
        id: 'practitioner-2',
        identifier: [
          {
            system: 'https://afiax.africa/kenya/identifier/national-id',
            value: '12345678',
            type: { text: 'National ID number' },
          },
        ],
      } satisfies Practitioner,
      correlationId: 'corr-prac-2',
    });

    expect(result).toMatchObject({
      status: 'verified',
      correlationId: 'corr-prac-2',
      registrationNumber: '40675898',
      practitionerAuthorityIdentifier: '40675898',
      identificationType: 'ID',
      identificationNumber: '12345678',
      practitionerActiveStatus: 'yes',
      nextState: 'ready-for-care-delivery',
    });
  });

  test('marks practitioner inactive when DHA returns inactive status', async () => {
    const project: Project = {
      resourceType: 'Project',
      id: 'project-prac-3',
      name: 'Project Practitioner 3',
      setting: [{ name: 'countryPack', valueString: 'kenya' }],
      secret: [
        { name: 'kenyaAfyaLinkConsumerKey', valueString: 'consumer-key' },
        { name: 'kenyaAfyaLinkUsername', valueString: 'username' },
        { name: 'kenyaAfyaLinkPassword', valueString: 'password' },
      ],
    };

    jest.spyOn(afyaLink, 'searchAfyaLinkPractitioner').mockResolvedValueOnce({
      message: {
        registration_number: '40675898',
        found: 1,
        is_active: 'no',
      },
    });

    const result = await verifyKenyaPractitionerAuthority({
      ctx: createContext(project),
      practitioner: {
        resourceType: 'Practitioner',
        id: 'practitioner-3',
        identifier: [
          {
            system: 'https://afiax.africa/kenya/identifier/passport-number',
            value: 'A1234567',
            type: { text: 'Passport number' },
          },
        ],
      } satisfies Practitioner,
      correlationId: 'corr-prac-3',
    });

    expect(result).toMatchObject({
      status: 'inactive',
      correlationId: 'corr-prac-3',
      identificationType: 'PASSPORT',
      identificationNumber: 'A1234567',
      practitionerActiveStatus: 'no',
      nextState: 'review-practitioner-registration-status',
    });
  });
});
