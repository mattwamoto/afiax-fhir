// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Button, Divider, Group, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import type { InternalSchemaElement } from '@medplum/core';
import {
  deepClone,
  getElementDefinition,
  getKenyaHieCredentialMode,
  getKenyaHieEnvironment,
  getKenyaShaClaimsCredentialMode,
  getKenyaShaClaimsEnvironment,
  getProjectSettingString,
  KenyaShaClaimsSecretNames,
  normalizeErrorString,
} from '@medplum/core';
import type { ProjectSetting } from '@medplum/fhirtypes';
import { ResourcePropertyInput, useMedplum } from '@medplum/react';
import type { FormEvent, JSX } from 'react';
import { useEffect, useState } from 'react';
import { getProjectId } from '../utils';

const KenyaAfyaLinkSecretNames = {
  baseUrl: 'kenyaAfyaLinkBaseUrl',
  consumerKey: 'kenyaAfyaLinkConsumerKey',
  username: 'kenyaAfyaLinkUsername',
  password: 'kenyaAfyaLinkPassword',
} as const;

interface NamedSecretField {
  readonly name: string;
  readonly label: string;
  readonly description: string;
  readonly placeholder?: string;
  readonly sensitive?: boolean;
}

const kenyaAfyaLinkFields: NamedSecretField[] = [
  {
    name: KenyaAfyaLinkSecretNames.consumerKey,
    label: 'Kenya HIE Consumer Key',
    description: 'Consumer key issued from the DHA developer portal for HIE registry and related APIs.',
  },
  {
    name: KenyaAfyaLinkSecretNames.username,
    label: 'Kenya HIE Username',
    description: 'DHA developer portal username used for HIE Basic authentication.',
  },
  {
    name: KenyaAfyaLinkSecretNames.password,
    label: 'Kenya HIE Password',
    description: 'DHA developer portal password used for HIE Basic authentication.',
    sensitive: true,
  },
];

const kenyaShaClaimsFields: NamedSecretField[] = [
  {
    name: KenyaShaClaimsSecretNames.accessKey,
    label: 'Kenya SHA Access Key',
    description: 'Access key issued for Kenya SHA claim submission APIs.',
  },
  {
    name: KenyaShaClaimsSecretNames.secretKey,
    label: 'Kenya SHA Secret Key',
    description: 'Secret key paired with the SHA claims access key.',
    sensitive: true,
  },
  {
    name: KenyaShaClaimsSecretNames.callbackUrl,
    label: 'Kenya SHA Callback URL',
    description: 'Callback URL registered for SHA claim status and adjudication responses.',
    placeholder: 'https://gateway.afiax.africa/kenya/sha/callback',
  },
];

function getNamedSecretValue(secrets: ProjectSetting[], name: string): string {
  return getProjectSettingString(secrets, name) ?? '';
}

function setNamedSecretValue(secrets: ProjectSetting[], name: string, value: string): ProjectSetting[] {
  const nextSecrets = deepClone(secrets);
  const index = nextSecrets.findIndex((entry) => entry.name === name);
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    if (index >= 0) {
      nextSecrets.splice(index, 1);
    }
    return nextSecrets;
  }

  const secret: ProjectSetting = {
    name,
    valueString: value,
  };

  if (index >= 0) {
    nextSecrets[index] = secret;
  } else {
    nextSecrets.push(secret);
  }

  return nextSecrets;
}

export function SecretsPage(): JSX.Element {
  const medplum = useMedplum();
  const projectId = getProjectId(medplum);
  const projectDetails = medplum.get(`admin/projects/${projectId}`).read();
  const loadedSecretsKey = JSON.stringify(projectDetails.project.secret || []);
  const [schemaLoaded, setSchemaLoaded] = useState<boolean>(false);
  const [secrets, setSecrets] = useState<ProjectSetting[] | undefined>();
  const [testingAfyaLink, setTestingAfyaLink] = useState(false);

  useEffect(() => {
    medplum
      .requestSchema('Project')
      .then(() => setSchemaLoaded(true))
      .catch(console.log);
  }, [medplum]);

  useEffect(() => {
    setSecrets(deepClone(projectDetails.project.secret || []));
  }, [loadedSecretsKey]);

  if (!schemaLoaded || !secrets) {
    return <div>Loading...</div>;
  }

  const countryPack = getProjectSettingString(projectDetails.project, 'countryPack');
  const isKenyaProject = countryPack === 'kenya';
  const kenyaHieEnvironment = getKenyaHieEnvironment(projectDetails.project);
  const kenyaShaClaimsEnvironment = getKenyaShaClaimsEnvironment(projectDetails.project);
  const kenyaHieCredentialMode = getKenyaHieCredentialMode(projectDetails.project);
  const kenyaShaClaimsCredentialMode = getKenyaShaClaimsCredentialMode(projectDetails.project);
  const isTenantManagedKenyaHieProject = isKenyaProject && kenyaHieCredentialMode === 'tenant-managed';
  const isTenantManagedKenyaShaProject = isKenyaProject && kenyaShaClaimsCredentialMode === 'tenant-managed';
  const missingKenyaHieSecretCount = isTenantManagedKenyaHieProject
    ? kenyaAfyaLinkFields.filter((field) => !getNamedSecretValue(secrets, field.name).trim()).length
    : 0;
  const missingKenyaShaSecretCount = isTenantManagedKenyaShaProject
    ? kenyaShaClaimsFields.filter((field) => !getNamedSecretValue(secrets, field.name).trim()).length
    : 0;
  const secretsEditorKey = JSON.stringify(secrets.map((secret) => [secret.name, secret.valueString ?? '']));

  async function testKenyaAfyaLinkConnection(): Promise<void> {
    setTestingAfyaLink(true);
    try {
      const result = await medplum.post(`admin/projects/${projectId}/kenya/afyalink/test`, secrets);
      showNotification({
        color: 'green',
        message:
          typeof result === 'object' && result && 'message' in result
            ? String(result.message)
            : 'AfyaLink authentication succeeded',
      });
    } catch (err) {
      showNotification({ color: 'red', message: normalizeErrorString(err) });
    } finally {
      setTestingAfyaLink(false);
    }
  }

  return (
    <form
      noValidate
      autoComplete="off"
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        medplum
          .post(`admin/projects/${projectId}/secrets`, secrets)
          .then(() => medplum.get(`admin/projects/${projectId}`, { cache: 'reload' }))
          .then(() => showNotification({ color: 'green', message: 'Saved' }))
          .catch(console.log);
      }}
    >
      <Title>Project Secrets</Title>
      <Text mb="md">
        Use project secrets to store sensitive information such as API keys or other access credentials.
      </Text>
      {isKenyaProject && (
        <Stack gap="md" mb="xl">
          <div>
            <Title order={3}>Kenya DHA HIE Access</Title>
            <Text size="sm" c="dimmed">
              These credentials are used for DHA HIE auth plus facility, practitioner, eligibility, and client-registry
              APIs. Kenya SHA claim operations use a separate endpoint family selected in Settings.
            </Text>
            <Text size="sm" mt="xs">
              HIE environment:
              {' '}
              <strong>{kenyaHieEnvironment === 'production' ? 'Production' : 'UAT'}</strong>
              {' | '}
              SHA claims environment:
              {' '}
              <strong>{kenyaShaClaimsEnvironment === 'production' ? 'Production' : 'UAT'}</strong>
              {' | '}
              HIE credential mode:
              {' '}
              <strong>{kenyaHieCredentialMode === 'afiax-managed' ? 'Afiax-managed' : 'Tenant-managed'}</strong>
              {' | '}
              SHA credential mode:
              {' '}
              <strong>{kenyaShaClaimsCredentialMode === 'afiax-managed' ? 'Afiax-managed' : 'Tenant-managed'}</strong>
            </Text>
            <Text size="sm" mt="xs">
              {isTenantManagedKenyaHieProject
                ? missingKenyaHieSecretCount === 0
                  ? 'All required tenant-managed Kenya HIE credentials are configured.'
                  : `${missingKenyaHieSecretCount} required Kenya HIE credential${missingKenyaHieSecretCount === 1 ? '' : 's'} still missing.`
                : 'This project relies on Afiax-managed HIE credentials. Tenant admins do not enter HIE credentials here; platform ops manages them in Super Admin.'}
            </Text>
          </div>
          {isTenantManagedKenyaHieProject &&
            kenyaAfyaLinkFields.map((field) =>
              field.sensitive ? (
                <PasswordInput
                  key={field.name}
                  label={field.label}
                  description={field.description}
                  placeholder={field.placeholder}
                  value={getNamedSecretValue(secrets, field.name)}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setSecrets((currentSecrets) => setNamedSecretValue(currentSecrets ?? [], field.name, value));
                  }}
                  data-testid={field.name}
                />
              ) : (
                <TextInput
                  key={field.name}
                  label={field.label}
                  description={field.description}
                  placeholder={field.placeholder}
                  value={getNamedSecretValue(secrets, field.name)}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setSecrets((currentSecrets) => setNamedSecretValue(currentSecrets ?? [], field.name, value));
                  }}
                  data-testid={field.name}
                />
              )
            )}
          <Group justify="space-between" align="flex-end">
            <Text size="sm" c="dimmed">
              {isTenantManagedKenyaHieProject
                ? 'Test the current tenant-managed Kenya HIE credentials before saving them to the project.'
                : 'Test the current Afiax-managed Kenya HIE connection using platform-managed credentials.'}
            </Text>
            <Button
              type="button"
              variant="light"
              onClick={() => testKenyaAfyaLinkConnection().catch(console.log)}
              loading={testingAfyaLink}
              disabled={isTenantManagedKenyaHieProject && missingKenyaHieSecretCount > 0}
            >
              Test HIE Connection
            </Button>
          </Group>
          <Divider />
          <div>
            <Title order={3}>Kenya SHA Claim Transport</Title>
            <Text size="sm" c="dimmed">
              These credentials are reserved for Kenya SHA claim submission and callback handling. They are separate
              from the Kenya HIE credentials used for registries and eligibility.
            </Text>
            <Text size="sm" mt="xs">
              {isTenantManagedKenyaShaProject
                ? missingKenyaShaSecretCount === 0
                  ? 'All required tenant-managed Kenya SHA claim credentials are configured.'
                  : `${missingKenyaShaSecretCount} required Kenya SHA credential${missingKenyaShaSecretCount === 1 ? '' : 's'} still missing.`
                : 'This project relies on Afiax-managed SHA claim credentials. Tenant admins do not enter them here; platform ops manages them in Super Admin.'}
            </Text>
          </div>
          {isTenantManagedKenyaShaProject &&
            kenyaShaClaimsFields.map((field) =>
              field.sensitive ? (
                <PasswordInput
                  key={field.name}
                  label={field.label}
                  description={field.description}
                  placeholder={field.placeholder}
                  value={getNamedSecretValue(secrets, field.name)}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setSecrets((currentSecrets) => setNamedSecretValue(currentSecrets ?? [], field.name, value));
                  }}
                  data-testid={field.name}
                />
              ) : (
                <TextInput
                  key={field.name}
                  label={field.label}
                  description={field.description}
                  placeholder={field.placeholder}
                  value={getNamedSecretValue(secrets, field.name)}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setSecrets((currentSecrets) => setNamedSecretValue(currentSecrets ?? [], field.name, value));
                  }}
                  data-testid={field.name}
                />
              )
            )}
          <Text size="sm" c="dimmed">
            SHA claim transport credentials are stored here for tenant-managed projects. Live SHA submission will use
            these credentials once the Kenya SHA connector is enabled.
          </Text>
          <Divider />
        </Stack>
      )}
      <Title order={3}>{isKenyaProject ? 'Advanced Project Secrets' : 'Secret Editor'}</Title>
      <Text size="sm" c="dimmed" mb="md">
        {isKenyaProject
          ? 'Use the advanced editor for additional project secrets beyond the curated Kenya HIE credential set.'
          : 'Use the editor below to manage project-level secret values.'}
      </Text>
      <ResourcePropertyInput
        key={secretsEditorKey}
        property={getElementDefinition('Project', 'secret') as InternalSchemaElement}
        name="secret"
        path="Project.secret"
        defaultValue={secrets}
        onChange={setSecrets}
        outcome={undefined}
      />
      <Button type="submit">Save</Button>
    </form>
  );
}
