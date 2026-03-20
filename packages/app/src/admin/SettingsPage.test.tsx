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
    expect(screen.getByLabelText('Country Pack', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Kenya')).toBeInTheDocument();
    expect(screen.getByText('Uganda (Placeholder)')).toBeInTheDocument();
  });

  test('Select country pack and submit', async () => {
    const postSpy = jest.spyOn(medplum, 'post');
    await setup('/admin/settings');

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Country Pack', { exact: false }), { target: { value: 'kenya' } });
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Kenya HIE Environment', { exact: false }), {
        target: { value: 'uat' },
      });
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText('HIE Credential Mode', { exact: false }), {
        target: { value: 'afiax-managed' },
      });
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Kenya SHA Claims Environment', { exact: false }), {
        target: { value: 'production' },
      });
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText('SHA Claims Credential Mode', { exact: false }), {
        target: { value: 'tenant-managed' },
      });
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Kenya HIE Agent ID', { exact: false }), {
        target: { value: 'agent-001' },
      });
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Kenya Claim Workflow Bot ID', { exact: false }), {
        target: { value: 'Bot/kenya-claim-bot' },
      });
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Save'));
    });

    expect(await screen.findByText('Saved')).toBeInTheDocument();
    expect(postSpy).toHaveBeenCalledWith(
      'admin/projects/123/settings',
      expect.arrayContaining([
        expect.objectContaining({ name: 'countryPack', valueString: 'kenya' }),
        expect.objectContaining({ name: 'kenyaHieEnvironment', valueString: 'uat' }),
        expect.objectContaining({ name: 'kenyaHieCredentialMode', valueString: 'afiax-managed' }),
        expect.objectContaining({ name: 'kenyaShaClaimsEnvironment', valueString: 'production' }),
        expect.objectContaining({ name: 'kenyaShaClaimsCredentialMode', valueString: 'tenant-managed' }),
        expect.objectContaining({ name: 'kenyaHieAgentId', valueString: 'agent-001' }),
        expect.objectContaining({ name: 'kenyaClaimWorkflowBotId', valueString: 'Bot/kenya-claim-bot' }),
      ])
    );
    postSpy.mockRestore();
  });

  test('Raw editor still works', async () => {
    await setup('/admin/settings');
    expect(await screen.findByTitle('Add Setting')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTitle('Add Setting'));
    });

    await act(async () => {
      fireEvent.change(screen.getByTestId('name'), { target: { value: 'integrationMode' } });
    });

    await act(async () => {
      fireEvent.change(screen.getByTestId('value[x]'), { target: { value: 'uat' } });
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Save'));
    });

    expect((await screen.findAllByText('Saved')).length).toBeGreaterThan(0);
  });
});
