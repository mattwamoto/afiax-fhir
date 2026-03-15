// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { MockClient } from '@medplum/mock';
import { MedplumProvider } from '@medplum/react';
import { MemoryRouter } from 'react-router';
import { AppRoutes } from '../AppRoutes';
import { act, render, screen } from '../test-utils/render';

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
        { name: 'kenyaAfyaLinkEnvironment', valueString: 'uat' },
        { name: 'kenyaAfyaLinkCredentialMode', valueString: 'tenant-managed' },
      ],
      secret: [{ name: 'kenyaAfyaLinkConsumerKey', valueString: 'consumer-key-123' }],
    });
    await medplum.get('admin/projects/123', { cache: 'reload' });

    await setup('/admin/country-pack');

    expect(await screen.findByText(/Kenya is active for this project/)).toBeInTheDocument();
    expect(screen.getByText('Tenant-managed')).toBeInTheDocument();
    expect(screen.getByText('1 of 3 required DHA credentials configured')).toBeInTheDocument();
    expect(screen.getByText(/2 Kenya DHA credentials still missing/)).toBeInTheDocument();
  });
});
