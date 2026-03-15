// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Button, Group, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { normalizeErrorString, resolveId } from '@medplum/core';
import type { Project, ProjectSetting, Reference } from '@medplum/fhirtypes';
import { ReferenceInput, useMedplum } from '@medplum/react';
import type { JSX } from 'react';
import { useState } from 'react';

const KenyaAfyaLinkSecretNames = {
  baseUrl: 'kenyaAfyaLinkBaseUrl',
  consumerKey: 'kenyaAfyaLinkConsumerKey',
  username: 'kenyaAfyaLinkUsername',
  password: 'kenyaAfyaLinkPassword',
} as const;

interface KenyaAfyaLinkSecretsResponse {
  readonly project: {
    readonly id?: string;
    readonly name?: string;
    readonly systemSecret?: ProjectSetting[];
  };
  readonly kenya: {
    readonly environment: 'uat' | 'production';
    readonly credentialMode: 'tenant-managed' | 'afiax-managed';
  };
}

function getSecretValue(secrets: ProjectSetting[] | undefined, name: string): string {
  return secrets?.find((entry) => entry.name === name)?.valueString ?? '';
}

export function SuperAdminKenyaCredentialsForm(): JSX.Element {
  const medplum = useMedplum();
  const [projectId, setProjectId] = useState('');
  const [selectedProject, setSelectedProject] = useState<Reference<Project> | undefined>();
  const [projectName, setProjectName] = useState<string | undefined>();
  const [environment, setEnvironment] = useState<'uat' | 'production' | undefined>();
  const [credentialMode, setCredentialMode] = useState<'tenant-managed' | 'afiax-managed' | undefined>();
  const [baseUrlOverride, setBaseUrlOverride] = useState('');
  const [consumerKey, setConsumerKey] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  async function loadProjectSecrets(): Promise<void> {
    if (!projectId.trim()) {
      showNotification({ color: 'red', message: 'Project ID is required' });
      return;
    }

    setLoading(true);
    try {
      const result = (await medplum.get(
        `admin/super/projects/${projectId.trim()}/kenya/afyalink/systemsecrets`
      )) as KenyaAfyaLinkSecretsResponse;
      setSelectedProject(
        result.project.id ? { reference: `Project/${result.project.id}`, display: result.project.name } : undefined
      );
      setProjectName(result.project.name);
      setEnvironment(result.kenya.environment);
      setCredentialMode(result.kenya.credentialMode);
      setBaseUrlOverride(getSecretValue(result.project.systemSecret, KenyaAfyaLinkSecretNames.baseUrl));
      setConsumerKey(getSecretValue(result.project.systemSecret, KenyaAfyaLinkSecretNames.consumerKey));
      setUsername(getSecretValue(result.project.systemSecret, KenyaAfyaLinkSecretNames.username));
      setPassword(getSecretValue(result.project.systemSecret, KenyaAfyaLinkSecretNames.password));
      showNotification({ color: 'green', message: 'Loaded Kenya managed credentials' });
    } catch (err) {
      showNotification({ color: 'red', message: normalizeErrorString(err), autoClose: false });
    } finally {
      setLoading(false);
    }
  }

  function buildSecretPayload(): ProjectSetting[] {
    return [
      { name: KenyaAfyaLinkSecretNames.baseUrl, valueString: baseUrlOverride },
      { name: KenyaAfyaLinkSecretNames.consumerKey, valueString: consumerKey },
      { name: KenyaAfyaLinkSecretNames.username, valueString: username },
      { name: KenyaAfyaLinkSecretNames.password, valueString: password },
    ];
  }

  async function saveProjectSecrets(): Promise<void> {
    if (!projectId.trim()) {
      showNotification({ color: 'red', message: 'Project ID is required' });
      return;
    }

    setSaving(true);
    try {
      const result = (await medplum.post(
        `admin/super/projects/${projectId.trim()}/kenya/afyalink/systemsecrets`,
        buildSecretPayload()
      )) as KenyaAfyaLinkSecretsResponse;
      setSelectedProject(
        result.project.id ? { reference: `Project/${result.project.id}`, display: result.project.name } : undefined
      );
      setProjectName(result.project.name);
      setEnvironment(result.kenya.environment);
      setCredentialMode(result.kenya.credentialMode);
      showNotification({ color: 'green', message: 'Saved Afiax-managed Kenya credentials' });
    } catch (err) {
      showNotification({ color: 'red', message: normalizeErrorString(err), autoClose: false });
    } finally {
      setSaving(false);
    }
  }

  async function testProjectSecrets(): Promise<void> {
    if (!projectId.trim()) {
      showNotification({ color: 'red', message: 'Project ID is required' });
      return;
    }

    setTesting(true);
    try {
      const result = (await medplum.post(
        `admin/super/projects/${projectId.trim()}/kenya/afyalink/test`,
        buildSecretPayload()
      )) as { message?: string };
      showNotification({
        color: 'green',
        message: result.message ?? 'Afiax-managed Kenya AfyaLink authentication succeeded',
      });
    } catch (err) {
      showNotification({ color: 'red', message: normalizeErrorString(err), autoClose: false });
    } finally {
      setTesting(false);
    }
  }

  return (
    <Stack>
      <Title order={2}>Afiax-Managed Kenya DHA Credentials</Title>
      <Text>
        Use this super-admin form to manage Kenya DHA credentials in <code>Project.systemSecret</code>. This is the
        platform-ops path for projects configured to use Afiax-managed credentials.
      </Text>
      <ReferenceInput<Project>
        key={selectedProject?.reference ?? 'kenya-managed-project-search'}
        name="projectSearch"
        placeholder="Search Kenya project"
        targetTypes={['Project']}
        defaultValue={selectedProject}
        onChange={(value) => {
          setSelectedProject(value);
          const id = resolveId(value);
          if (id) {
            setProjectId(id);
          }
        }}
      />
      <TextInput
        label="Project ID"
        placeholder="Kenya project ID"
        value={projectId}
        onChange={(event) => setProjectId(event.currentTarget.value)}
        data-testid="afiax-managed-project-id"
      />
      <Group>
        <Button variant="light" onClick={() => loadProjectSecrets().catch(console.log)} loading={loading}>
          Load Project
        </Button>
        <Button variant="light" onClick={() => testProjectSecrets().catch(console.log)} loading={testing}>
          Test Connection
        </Button>
        <Button onClick={() => saveProjectSecrets().catch(console.log)} loading={saving}>
          Save Managed Credentials
        </Button>
      </Group>
      {projectName && (
        <Text size="sm">
          Loaded project:
          {' '}
          <strong>{projectName}</strong>
          {' | '}
          Environment:
          {' '}
          <strong>{environment === 'production' ? 'Production' : 'UAT'}</strong>
          {' | '}
          Credential mode:
          {' '}
          <strong>{credentialMode === 'afiax-managed' ? 'Afiax-managed' : 'Tenant-managed'}</strong>
        </Text>
      )}
      {credentialMode === 'tenant-managed' && (
        <Text size="sm" c="dimmed">
          This project is currently set to Tenant-managed mode. Saving Afiax-managed credentials here will stage them,
          but the project will not use them until its Kenya settings are switched to Afiax-managed.
        </Text>
      )}
      <TextInput
        label="Base URL Override"
        description="Optional. Leave blank to use the platform-derived DHA endpoint for the selected environment."
        placeholder="https://production.dha.example"
        value={baseUrlOverride}
        onChange={(event) => setBaseUrlOverride(event.currentTarget.value)}
        data-testid="afiax-managed-base-url"
      />
      <TextInput
        label="AfyaLink Consumer Key"
        value={consumerKey}
        onChange={(event) => setConsumerKey(event.currentTarget.value)}
        data-testid="afiax-managed-consumer-key"
      />
      <TextInput
        label="AfyaLink Username"
        value={username}
        onChange={(event) => setUsername(event.currentTarget.value)}
        data-testid="afiax-managed-username"
      />
      <PasswordInput
        label="AfyaLink Password"
        value={password}
        onChange={(event) => setPassword(event.currentTarget.value)}
        data-testid="afiax-managed-password"
      />
      <Text size="sm" c="dimmed">
        Saving updates only the Kenya DHA credentials in <code>Project.systemSecret</code>. Other system secrets for the
        project are preserved.
      </Text>
    </Stack>
  );
}
