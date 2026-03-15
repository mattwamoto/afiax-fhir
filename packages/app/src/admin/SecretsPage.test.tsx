// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { MockClient } from '@medplum/mock';
import { MedplumProvider } from '@medplum/react';
import { MemoryRouter } from 'react-router';
import { AppRoutes } from '../AppRoutes';
import { act, fireEvent, render, screen, userEvent } from '../test-utils/render';

const KenyaAfyaLinkSecretNames = {
  baseUrl: 'kenyaAfyaLinkBaseUrl',
  consumerKey: 'kenyaAfyaLinkConsumerKey',
  username: 'kenyaAfyaLinkUsername',
  password: 'kenyaAfyaLinkPassword',
} as const;

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

describe('SecretsPage', () => {
  beforeEach(() => {
    medplum = new MockClient();
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
    await setup('/admin/secrets');
    expect(await screen.findByText('Project Secrets')).toBeInTheDocument();
  });

  test('Renders Kenya AfyaLink credentials for Kenya projects', async () => {
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
    });
    await medplum.get('admin/projects/123', { cache: 'reload' });

    await setup('/admin/secrets');

    expect(await screen.findByText('Kenya DHA Access')).toBeInTheDocument();
    expect(screen.getByLabelText('AfyaLink Consumer Key')).toBeInTheDocument();
    expect(screen.getByLabelText('AfyaLink Username')).toBeInTheDocument();
    expect(screen.getByLabelText('AfyaLink Password')).toBeInTheDocument();
    expect(screen.queryByLabelText('AfyaLink Base URL')).toBeNull();
  });

  test('Add and submit', async () => {
    await setup('/admin/secrets');
    expect(await screen.findByTitle('Add Secret')).toBeInTheDocument();

    // Click the "Add" button
    await act(async () => {
      fireEvent.click(screen.getByTitle('Add Secret'));
    });

    // Enter the secret name
    await act(async () => {
      fireEvent.change(screen.getByTestId('name'), { target: { value: 'foo' } });
    });

    // Enter the secret value
    await act(async () => {
      fireEvent.change(screen.getByTestId('value[x]'), { target: { value: 'bar' } });
    });

    // Click the "Save" button
    await act(async () => {
      fireEvent.click(screen.getByText('Save'));
    });

    // Wait for the toast
    expect(await screen.findByText('Saved')).toBeInTheDocument();
  });

  test('Submits Kenya AfyaLink secrets from curated inputs', async () => {
    const postSpy = jest.spyOn(medplum, 'post');

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
    });
    await medplum.get('admin/projects/123', { cache: 'reload' });

    await setup('/admin/secrets');

    await act(async () => {
      fireEvent.change(screen.getByLabelText('AfyaLink Consumer Key'), {
        target: { value: 'consumer-key-123' },
      });
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText('AfyaLink Username'), {
        target: { value: 'portal-user' },
      });
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText('AfyaLink Password'), {
        target: { value: 'portal-password' },
      });
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Save'));
    });

    expect(postSpy).toHaveBeenCalledWith(
      'admin/projects/123/secrets',
      expect.arrayContaining([
        expect.objectContaining({
          name: KenyaAfyaLinkSecretNames.consumerKey,
          valueString: 'consumer-key-123',
        }),
        expect.objectContaining({
          name: KenyaAfyaLinkSecretNames.username,
          valueString: 'portal-user',
        }),
        expect.objectContaining({
          name: KenyaAfyaLinkSecretNames.password,
          valueString: 'portal-password',
        }),
      ])
    );
    expect((await screen.findAllByText('Saved')).length).toBeGreaterThan(0);
  });

  test('Tests Kenya AfyaLink credentials without saving first', async () => {
    const postSpy = jest.spyOn(medplum, 'post');

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
    });
    await medplum.get('admin/projects/123', { cache: 'reload' });

    await setup('/admin/secrets');

    await act(async () => {
      fireEvent.change(screen.getByLabelText('AfyaLink Consumer Key'), {
        target: { value: 'consumer-key-123' },
      });
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText('AfyaLink Username'), {
        target: { value: 'portal-user' },
      });
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText('AfyaLink Password'), {
        target: { value: 'portal-password' },
      });
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Test Connection'));
    });

    expect(postSpy).toHaveBeenCalledWith(
      'admin/projects/123/kenya/afyalink/test',
      expect.arrayContaining([
        expect.objectContaining({
          name: KenyaAfyaLinkSecretNames.consumerKey,
          valueString: 'consumer-key-123',
        }),
        expect.objectContaining({
          name: KenyaAfyaLinkSecretNames.username,
          valueString: 'portal-user',
        }),
        expect.objectContaining({
          name: KenyaAfyaLinkSecretNames.password,
          valueString: 'portal-password',
        }),
      ])
    );
  });

  test('Kenya curated fields keep typed input', async () => {
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
    });
    await medplum.get('admin/projects/123', { cache: 'reload' });

    await setup('/admin/secrets');

    await userEvent.type(screen.getByLabelText('AfyaLink Username'), 'portal-user');
    expect(screen.getByLabelText('AfyaLink Username')).toHaveValue('portal-user');

    await userEvent.type(screen.getByLabelText('AfyaLink Consumer Key'), 'consumer-key-123');
    expect(screen.getByLabelText('AfyaLink Consumer Key')).toHaveValue('consumer-key-123');
  });

  test('Afiax-managed mode hides tenant credentials', async () => {
    await medplum.get('admin/projects/123');
    await medplum.repo.updateResource({
      resourceType: 'Project',
      id: '123',
      name: 'Project 123',
      setting: [
        { name: 'countryPack', valueString: 'kenya' },
        { name: 'kenyaAfyaLinkEnvironment', valueString: 'uat' },
        { name: 'kenyaAfyaLinkCredentialMode', valueString: 'afiax-managed' },
      ],
    });
    await medplum.get('admin/projects/123', { cache: 'reload' });

    await setup('/admin/secrets');

    expect(await screen.findByText('Kenya DHA Access')).toBeInTheDocument();
    expect(screen.queryByLabelText('AfyaLink Consumer Key')).toBeNull();
    expect(screen.queryByLabelText('AfyaLink Username')).toBeNull();
    expect(screen.queryByLabelText('AfyaLink Password')).toBeNull();
    expect(screen.getByText(/Afiax-managed DHA credentials/i)).toBeInTheDocument();
  });
});
