// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { Coverage, Project } from '@medplum/fhirtypes';
import * as afyaLink from './afyalink';
import { checkKenyaCoverage } from './check-coverage';

describe('checkKenyaCoverage', () => {
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

  test('returns ineligible when coverage lookup identifier is missing', async () => {
    const project: Project = {
      resourceType: 'Project',
      id: 'project-cov-1',
      setting: [{ name: 'countryPack', valueString: 'kenya' }],
    };

    const result = await checkKenyaCoverage({
      ctx: createContext(project),
      coverage: {
        resourceType: 'Coverage',
        id: 'coverage-1',
        status: 'active',
        beneficiary: { reference: 'Patient/1' },
        payor: [{ reference: 'Organization/sha' }],
      },
      correlationId: 'corr-cov-1',
    });

    expect(result).toMatchObject({
      status: 'ineligible',
      correlationId: 'corr-cov-1',
      nextState: 'capture-eligibility-lookup-identifier',
    });
  });

  test('returns eligible when DHA reports active coverage', async () => {
    const project: Project = {
      resourceType: 'Project',
      id: 'project-cov-2',
      setting: [{ name: 'countryPack', valueString: 'kenya' }],
      secret: [
        { name: 'kenyaAfyaLinkConsumerKey', valueString: 'consumer-key' },
        { name: 'kenyaAfyaLinkUsername', valueString: 'username' },
        { name: 'kenyaAfyaLinkPassword', valueString: 'password' },
      ],
    };

    jest.spyOn(afyaLink, 'searchAfyaLinkEligibility').mockResolvedValueOnce({
      message: {
        id: 2158174,
        eligible: 'yes',
        full_name: 'Afiax Test Patient',
        reason: 'Active member',
        possible_solution: 'Proceed to service delivery',
        coverageEndDate: '2026-12-31',
        transition_status: 'active',
        request_id_type: 'National ID',
        request_id_number: '12345678',
      },
    });

    const result = await checkKenyaCoverage({
      ctx: createContext(project),
      coverage: {
        resourceType: 'Coverage',
        id: 'coverage-2',
        status: 'active',
        beneficiary: { reference: 'Patient/2' },
        payor: [{ reference: 'Organization/sha' }],
        identifier: [
          {
            system: 'https://afiax.africa/kenya/identifier/coverage-national-id',
            value: '12345678',
            type: { text: 'National ID' },
          },
        ],
      } satisfies Coverage,
      correlationId: 'corr-cov-2',
    });

    expect(result).toMatchObject({
      status: 'eligible',
      correlationId: 'corr-cov-2',
      eligible: true,
      identificationType: 'National ID',
      identificationNumber: '12345678',
      fullName: 'Afiax Test Patient',
      coverageEndDate: '2026-12-31',
      nextState: 'ready-for-claim-and-billing',
    });
  });

  test('returns ineligible when DHA reports no coverage', async () => {
    const project: Project = {
      resourceType: 'Project',
      id: 'project-cov-3',
      setting: [{ name: 'countryPack', valueString: 'kenya' }],
      secret: [
        { name: 'kenyaAfyaLinkConsumerKey', valueString: 'consumer-key' },
        { name: 'kenyaAfyaLinkUsername', valueString: 'username' },
        { name: 'kenyaAfyaLinkPassword', valueString: 'password' },
      ],
    };

    jest.spyOn(afyaLink, 'searchAfyaLinkEligibility').mockResolvedValueOnce({
      message: {
        eligible: 'no',
        reason: 'Member not active',
        possible_solution: 'Collect cash payment or resolve membership',
        request_id_type: 'SHA Number',
        request_id_number: 'SHA-12345',
      },
    });

    const result = await checkKenyaCoverage({
      ctx: createContext(project),
      coverage: {
        resourceType: 'Coverage',
        id: 'coverage-3',
        status: 'active',
        beneficiary: { reference: 'Patient/3' },
        payor: [{ reference: 'Organization/sha' }],
        identifier: [
          {
            system: 'https://afiax.africa/kenya/identifier/sha-number',
            value: 'SHA-12345',
            type: { text: 'SHA Number' },
          },
        ],
      } satisfies Coverage,
      correlationId: 'corr-cov-3',
    });

    expect(result).toMatchObject({
      status: 'ineligible',
      correlationId: 'corr-cov-3',
      eligible: false,
      identificationType: 'SHA Number',
      identificationNumber: 'SHA-12345',
      nextState: 'resolve-eligibility-before-billing',
    });
  });
});
