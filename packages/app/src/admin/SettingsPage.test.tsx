// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { MockClient } from '@medplum/mock';
import { MedplumProvider } from '@medplum/react';
import { MemoryRouter } from 'react-router';
import { AppRoutes } from '../AppRoutes';
import { act, fireEvent, render, screen } from '../test-utils/render';

const medplum = new MockClient();

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
    await Promise.resolve();
  });
}

describe('SettingsPage', () => {
  beforeAll(() => {
    medplum.setActiveLoginOverride({
      accessToken: '123',
      refreshToken: '456',
      profile: {
        reference: 'Practitioner/123',
      },
      project: {
        reference: 'Project/123',
      },
    });
  });

  test('Renders', async () => {
    await setup('/admin/settings');
    expect(await screen.findByText('Project Settings')).toBeInTheDocument();
  });

  test('Add and submit', async () => {
    await setup('/admin/settings');
    expect(await screen.findByTitle('Add Setting')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTitle('Add Setting'));
    });

    await act(async () => {
      fireEvent.change(screen.getByTestId('name'), { target: { value: 'countryPack' } });
    });

    await act(async () => {
      fireEvent.change(screen.getByTestId('value[x]'), { target: { value: 'kenya' } });
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Save'));
    });

    expect(await screen.findByText('Saved')).toBeInTheDocument();
  });
});
