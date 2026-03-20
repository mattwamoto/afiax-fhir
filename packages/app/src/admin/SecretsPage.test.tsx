// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { KenyaShaClaimsSecretNames } from '@medplum/core';
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
        { name: 'kenyaHieEnvironment', valueString: 'uat' },
        { name: 'kenyaHieCredentialMode', valueString: 'tenant-managed' },
        { name: 'kenyaShaClaimsEnvironment', valueString: 'production' },
      ],
    });
    await medplum.get('admin/projects/123', { cache: 'reload' });

    await setup('/admin/secrets');

    expect(await screen.findByText('Kenya DHA HIE Access')).toBeInTheDocument();
    expect(screen.getByLabelText('Kenya HIE Consumer Key')).toBeInTheDocument();
    expect(screen.getByLabelText('Kenya HIE Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Kenya HIE Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Kenya SHA Access Key')).toBeInTheDocument();
    expect(screen.getByLabelText('Kenya SHA Secret Key')).toBeInTheDocument();
    expect(screen.getByLabelText('Kenya SHA Callback URL')).toBeInTheDocument();
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
        { name: 'kenyaHieEnvironment', valueString: 'uat' },
        { name: 'kenyaHieCredentialMode', valueString: 'tenant-managed' },
      ],
    });
    await medplum.get('admin/projects/123', { cache: 'reload' });

    await setup('/admin/secrets');

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Kenya HIE Consumer Key'), {
        target: { value: 'consumer-key-123' },
      });
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Kenya HIE Username'), {
        target: { value: 'portal-user' },
      });
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Kenya HIE Password'), {
        target: { value: 'portal-password' },
      });
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Kenya SHA Access Key'), {
        target: { value: 'sha-access-key-123' },
      });
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Kenya SHA Secret Key'), {
        target: { value: 'sha-secret-key-123' },
      });
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Kenya SHA Callback URL'), {
        target: { value: 'https://gateway.afiax.africa/kenya/sha/callback' },
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
        expect.objectContaining({
          name: KenyaShaClaimsSecretNames.accessKey,
          valueString: 'sha-access-key-123',
        }),
        expect.objectContaining({
          name: KenyaShaClaimsSecretNames.secretKey,
          valueString: 'sha-secret-key-123',
        }),
        expect.objectContaining({
          name: KenyaShaClaimsSecretNames.callbackUrl,
          valueString: 'https://gateway.afiax.africa/kenya/sha/callback',
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
        { name: 'kenyaHieEnvironment', valueString: 'uat' },
        { name: 'kenyaHieCredentialMode', valueString: 'tenant-managed' },
      ],
    });
    await medplum.get('admin/projects/123', { cache: 'reload' });

    await setup('/admin/secrets');

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Kenya HIE Consumer Key'), {
        target: { value: 'consumer-key-123' },
      });
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Kenya HIE Username'), {
        target: { value: 'portal-user' },
      });
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Kenya HIE Password'), {
        target: { value: 'portal-password' },
      });
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Test HIE Connection'));
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
        { name: 'kenyaHieEnvironment', valueString: 'uat' },
        { name: 'kenyaHieCredentialMode', valueString: 'tenant-managed' },
      ],
    });
    await medplum.get('admin/projects/123', { cache: 'reload' });

    await setup('/admin/secrets');

    await userEvent.type(screen.getByLabelText('Kenya HIE Username'), 'portal-user');
    expect(screen.getByLabelText('Kenya HIE Username')).toHaveValue('portal-user');

    await userEvent.type(screen.getByLabelText('Kenya HIE Consumer Key'), 'consumer-key-123');
    expect(screen.getByLabelText('Kenya HIE Consumer Key')).toHaveValue('consumer-key-123');
  });

  test('Afiax-managed mode hides tenant credentials', async () => {
    await medplum.get('admin/projects/123');
    await medplum.repo.updateResource({
      resourceType: 'Project',
      id: '123',
      name: 'Project 123',
      setting: [
        { name: 'countryPack', valueString: 'kenya' },
        { name: 'kenyaHieEnvironment', valueString: 'uat' },
        { name: 'kenyaHieCredentialMode', valueString: 'afiax-managed' },
        { name: 'kenyaShaClaimsCredentialMode', valueString: 'afiax-managed' },
      ],
    });
    await medplum.get('admin/projects/123', { cache: 'reload' });

    await setup('/admin/secrets');

    expect(await screen.findByText('Kenya DHA HIE Access')).toBeInTheDocument();
    expect(screen.queryByLabelText('Kenya HIE Consumer Key')).toBeNull();
    expect(screen.queryByLabelText('Kenya HIE Username')).toBeNull();
    expect(screen.queryByLabelText('Kenya HIE Password')).toBeNull();
    expect(screen.queryByLabelText('Kenya SHA Access Key')).toBeNull();
    expect(screen.queryByLabelText('Kenya SHA Secret Key')).toBeNull();
    expect(screen.queryByLabelText('Kenya SHA Callback URL')).toBeNull();
    expect(screen.getByText(/Afiax-managed HIE credentials/i)).toBeInTheDocument();
    expect(screen.getByText(/Afiax-managed SHA claim credentials/i)).toBeInTheDocument();
  });
});
