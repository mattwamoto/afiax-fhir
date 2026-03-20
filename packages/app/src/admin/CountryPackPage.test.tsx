// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { MockClient } from '@medplum/mock';
import { MedplumProvider } from '@medplum/react';
import { MemoryRouter } from 'react-router';
import { AppRoutes } from '../AppRoutes';
import { act, fireEvent, render, screen, waitFor } from '../test-utils/render';

let medplum = new MockClient();

async function setup(url: string): Promise<void> {
  await act(async () => {
    render(
      <MedplumProvider medplum={medplum}>
        <MemoryRouter initialEntries={[url]} initialIndex={0}>
          <MantineProvider>
            <Notifications />
            <AppRoutes />
          </MantineProvider>
        </MemoryRouter>
      </MedplumProvider>
    );
  });
}

describe('CountryPackPage', () => {
  beforeEach(() => {
    medplum = new MockClient();
    medplum.setActiveLoginOverride({
      accessToken: '123',
      refreshToken: '456',
      profile: { reference: 'Practitioner/123' },
      project: { reference: 'Project/123' },
    });
  });

  test('Shows core guidance when no country pack is selected', async () => {
    await setup('/admin/country-pack');

    expect(await screen.findByRole('heading', { name: 'Country Pack' })).toBeInTheDocument();
    expect(screen.getByText(/No country pack is selected/)).toBeInTheDocument();
    expect(screen.getByText('Core / No Country Pack')).toBeInTheDocument();
  });

  test('Shows Kenya checklist for Kenya projects', async () => {
    await medplum.get('admin/projects/123');
    await medplum.repo.updateResource({
      resourceType: 'Project',
      id: '123',
      name: 'Project 123',
      setting: [
        { name: 'countryPack', valueString: 'kenya' },
        { name: 'kenyaHieEnvironment', valueString: 'uat' },
        { name: 'kenyaHieCredentialMode', valueString: 'tenant-managed' },
        { name: 'kenyaShaClaimsEnvironment', valueString: 'production' },
        { name: 'kenyaShaClaimsCredentialMode', valueString: 'tenant-managed' },
        { name: 'kenyaClaimSubmitWorkflowBotId', valueString: 'Bot/kenya-claim-submit-bot' },
      ],
      secret: [
        { name: 'kenyaAfyaLinkConsumerKey', valueString: 'consumer-key-123' },
        { name: 'kenyaShaClaimsAccessKey', valueString: 'sha-access-key-123' },
      ],
    });
    await medplum.get('admin/projects/123', { cache: 'reload' });

    await setup('/admin/country-pack');

    expect(await screen.findByText(/Kenya is active for this project/)).toBeInTheDocument();
    expect(screen.getAllByText('Tenant-managed')).toHaveLength(2);
    expect(screen.getByText('Production')).toBeInTheDocument();
    expect(screen.getAllByText('Bot/kenya-claim-submit-bot').length).toBeGreaterThan(0);
    expect(screen.getByText('1 of 3 required HIE credentials configured')).toBeInTheDocument();
    expect(screen.getByText(/2 Kenya HIE credentials still missing/)).toBeInTheDocument();
    expect(screen.getByText('1 of 3 required SHA credentials configured')).toBeInTheDocument();
    expect(screen.getByText(/2 Kenya SHA credentials still missing/)).toBeInTheDocument();
  });

  test('Runs Kenya setup wizard and creates primary facility from lookup', async () => {
    await medplum.get('admin/projects/123');
    await medplum.repo.updateResource({
      resourceType: 'Project',
      id: '123',
      name: 'Project 123',
      setting: [
        { name: 'countryPack', valueString: 'kenya' },
        { name: 'kenyaHieEnvironment', valueString: 'uat' },
        { name: 'kenyaHieCredentialMode', valueString: 'tenant-managed' },
        { name: 'kenyaShaClaimsEnvironment', valueString: 'uat' },
      ],
      secret: [
        { name: 'kenyaAfyaLinkConsumerKey', valueString: 'consumer-key-123' },
        { name: 'kenyaAfyaLinkUsername', valueString: 'user-123' },
        { name: 'kenyaAfyaLinkPassword', valueString: 'password-123' },
      ],
    });
    await medplum.get('admin/projects/123', { cache: 'reload' });

    const postSpy = jest.spyOn(medplum, 'post').mockResolvedValue({
      ok: true,
      baseUrl: 'https://uat.dha.go.ke',
      facilityCode: '24749',
      result: {
        message: {
          facility_code: '24749',
          found: 1,
          facility_name: 'Afiax Test Hospital',
          registration_number: 'REG-24749',
          facility_level: 'Level 4',
          county: 'Nairobi',
          operational_status: 'Operational',
        },
      },
    });
    const createResourceSpy = jest.spyOn(medplum, 'createResource');

    await setup('/admin/country-pack');

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Kenya Facility Code / MFL Code'), { target: { value: '24749' } });
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Lookup Facility'));
    });

    expect(postSpy).toHaveBeenCalledWith('admin/projects/123/kenya/afyalink/facility-lookup', {
      facilityCode: '24749',
    });
    expect(await screen.findByText('Raw Kenya HIE Response')).toBeInTheDocument();
    expect(await screen.findByText('Create Primary Facility')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText('Create Primary Facility'));
    });

    await waitFor(() =>
      expect(createResourceSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          resourceType: 'Organization',
          active: true,
          name: 'Afiax Test Hospital',
          identifier: expect.arrayContaining([
            expect.objectContaining({
              system: 'https://afiax.africa/kenya/identifier/mfl-code',
              value: '24749',
            }),
            expect.objectContaining({
              system: 'https://afiax.africa/kenya/identifier/facility-registration-number',
              value: 'REG-24749',
            }),
          ]),
        })
      )
    );
  });
});
