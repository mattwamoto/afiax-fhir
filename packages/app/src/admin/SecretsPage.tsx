// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Button, Divider, Group, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import type { InternalSchemaElement } from '@medplum/core';
import {
  deepClone,
  getElementDefinition,
  getKenyaAfyaLinkCredentialMode,
  getKenyaAfyaLinkEnvironment,
  getProjectSettingString,
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
    label: 'AfyaLink Consumer Key',
    description: 'Consumer key issued from the DHA developer portal.',
  },
  {
    name: KenyaAfyaLinkSecretNames.username,
    label: 'AfyaLink Username',
    description: 'DHA developer portal username used for Basic authentication.',
  },
  {
    name: KenyaAfyaLinkSecretNames.password,
    label: 'AfyaLink Password',
    description: 'DHA developer portal password used for Basic authentication.',
    sensitive: true,
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
  const kenyaEnvironment = getKenyaAfyaLinkEnvironment(projectDetails.project);
  const kenyaCredentialMode = getKenyaAfyaLinkCredentialMode(projectDetails.project);
  const isTenantManagedKenyaProject = isKenyaProject && kenyaCredentialMode === 'tenant-managed';
  const missingKenyaSecretCount = isTenantManagedKenyaProject
    ? kenyaAfyaLinkFields.filter((field) => !getNamedSecretValue(secrets, field.name).trim()).length
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
            <Title order={3}>Kenya DHA Access</Title>
            <Text size="sm" c="dimmed">
              DHA access for this project is controlled by the Kenya settings. The endpoint is derived from the selected
              environment, so tenant admins do not need to type it here.
            </Text>
            <Text size="sm" mt="xs">
              Environment:
              {' '}
              <strong>{kenyaEnvironment === 'production' ? 'Production' : 'UAT'}</strong>
              {' | '}
              Credential mode:
              {' '}
              <strong>{kenyaCredentialMode === 'afiax-managed' ? 'Afiax-managed' : 'Tenant-managed'}</strong>
            </Text>
            <Text size="sm" mt="xs">
              {isTenantManagedKenyaProject
                ? missingKenyaSecretCount === 0
                  ? 'All required tenant-managed Kenya DHA credentials are configured.'
                  : `${missingKenyaSecretCount} required Kenya DHA credential${missingKenyaSecretCount === 1 ? '' : 's'} still missing.`
                : 'This project relies on Afiax-managed DHA credentials. Tenant admins do not enter DHA credentials here; platform ops manages them in Super Admin.'}
            </Text>
          </div>
          {isTenantManagedKenyaProject &&
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
              {isTenantManagedKenyaProject
                ? 'Test the current tenant-managed Kenya DHA credentials before saving them to the project.'
                : 'Test the current Afiax-managed Kenya DHA connection using platform-managed credentials.'}
            </Text>
            <Button
              type="button"
              variant="light"
              onClick={() => testKenyaAfyaLinkConnection().catch(console.log)}
              loading={testingAfyaLink}
              disabled={isTenantManagedKenyaProject && missingKenyaSecretCount > 0}
            >
              Test Connection
            </Button>
          </Group>
          <Divider />
        </Stack>
      )}
      <Title order={3}>{isKenyaProject ? 'Advanced Project Secrets' : 'Secret Editor'}</Title>
      <Text size="sm" c="dimmed" mb="md">
        {isKenyaProject
          ? 'Use the advanced editor for additional project secrets beyond the curated Kenya AfyaLink credential set.'
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
