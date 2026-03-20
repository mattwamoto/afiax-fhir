// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Button, Group, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { KenyaShaClaimsSecretNames, normalizeErrorString, resolveId } from '@medplum/core';
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

interface KenyaShaSecretsResponse {
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
  const [shaEnvironment, setShaEnvironment] = useState<'uat' | 'production' | undefined>();
  const [shaCredentialMode, setShaCredentialMode] = useState<'tenant-managed' | 'afiax-managed' | undefined>();
  const [shaBaseUrlOverride, setShaBaseUrlOverride] = useState('');
  const [shaAccessKey, setShaAccessKey] = useState('');
  const [shaSecretKey, setShaSecretKey] = useState('');
  const [shaCallbackUrl, setShaCallbackUrl] = useState('');
  const [savingSha, setSavingSha] = useState(false);

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
      const shaResult = (await medplum.get(
        `admin/super/projects/${projectId.trim()}/kenya/sha/systemsecrets`
      )) as KenyaShaSecretsResponse;
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
      setShaEnvironment(shaResult.kenya.environment);
      setShaCredentialMode(shaResult.kenya.credentialMode);
      setShaBaseUrlOverride(getSecretValue(shaResult.project.systemSecret, KenyaShaClaimsSecretNames.baseUrl));
      setShaAccessKey(getSecretValue(shaResult.project.systemSecret, KenyaShaClaimsSecretNames.accessKey));
      setShaSecretKey(getSecretValue(shaResult.project.systemSecret, KenyaShaClaimsSecretNames.secretKey));
      setShaCallbackUrl(getSecretValue(shaResult.project.systemSecret, KenyaShaClaimsSecretNames.callbackUrl));
      showNotification({ color: 'green', message: 'Loaded Kenya managed HIE credentials' });
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

  function buildShaSecretPayload(): ProjectSetting[] {
    return [
      { name: KenyaShaClaimsSecretNames.baseUrl, valueString: shaBaseUrlOverride },
      { name: KenyaShaClaimsSecretNames.accessKey, valueString: shaAccessKey },
      { name: KenyaShaClaimsSecretNames.secretKey, valueString: shaSecretKey },
      { name: KenyaShaClaimsSecretNames.callbackUrl, valueString: shaCallbackUrl },
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
      showNotification({ color: 'green', message: 'Saved Afiax-managed Kenya HIE credentials' });
    } catch (err) {
      showNotification({ color: 'red', message: normalizeErrorString(err), autoClose: false });
    } finally {
      setSaving(false);
    }
  }

  async function saveShaProjectSecrets(): Promise<void> {
    if (!projectId.trim()) {
      showNotification({ color: 'red', message: 'Project ID is required' });
      return;
    }

    setSavingSha(true);
    try {
      const result = (await medplum.post(
        `admin/super/projects/${projectId.trim()}/kenya/sha/systemsecrets`,
        buildShaSecretPayload()
      )) as KenyaShaSecretsResponse;
      setSelectedProject(
        result.project.id ? { reference: `Project/${result.project.id}`, display: result.project.name } : undefined
      );
      setProjectName(result.project.name);
      setShaEnvironment(result.kenya.environment);
      setShaCredentialMode(result.kenya.credentialMode);
      showNotification({ color: 'green', message: 'Saved Afiax-managed Kenya SHA credentials' });
    } catch (err) {
      showNotification({ color: 'red', message: normalizeErrorString(err), autoClose: false });
    } finally {
      setSavingSha(false);
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
        message: result.message ?? 'Afiax-managed Kenya HIE authentication succeeded',
      });
    } catch (err) {
      showNotification({ color: 'red', message: normalizeErrorString(err), autoClose: false });
    } finally {
      setTesting(false);
    }
  }

  return (
    <Stack>
      <Title order={2}>Afiax-Managed Kenya HIE Credentials</Title>
      <Text>
        Use this super-admin form to manage Kenya HIE credentials in <code>Project.systemSecret</code>. This is the
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
          Test HIE Connection
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
          This project is currently set to Tenant-managed mode. Saving Afiax-managed HIE credentials here will stage
          them, but the project will not use them until its Kenya settings are switched to Afiax-managed.
        </Text>
      )}
      <TextInput
        label="HIE Base URL Override"
        description="Optional. Leave blank to use the platform-derived Kenya HIE endpoint for the selected environment."
        placeholder="https://production.dha.example"
        value={baseUrlOverride}
        onChange={(event) => setBaseUrlOverride(event.currentTarget.value)}
        data-testid="afiax-managed-base-url"
      />
      <TextInput
        label="Kenya HIE Consumer Key"
        value={consumerKey}
        onChange={(event) => setConsumerKey(event.currentTarget.value)}
        data-testid="afiax-managed-consumer-key"
      />
      <TextInput
        label="Kenya HIE Username"
        value={username}
        onChange={(event) => setUsername(event.currentTarget.value)}
        data-testid="afiax-managed-username"
      />
      <PasswordInput
        label="Kenya HIE Password"
        value={password}
        onChange={(event) => setPassword(event.currentTarget.value)}
        data-testid="afiax-managed-password"
      />
      <Text size="sm" c="dimmed">
        Saving updates only the Kenya HIE credentials in <code>Project.systemSecret</code>. Other system secrets for
        the project are preserved.
      </Text>
      <Title order={2}>Afiax-Managed Kenya SHA Claim Credentials</Title>
      <Text>
        Use this section to manage Kenya SHA claim transport credentials in <code>Project.systemSecret</code>. This is
        separate from the Kenya HIE credentials used for registries and eligibility.
      </Text>
      {projectName && (
        <Text size="sm">
          SHA environment:
          {' '}
          <strong>{shaEnvironment === 'production' ? 'Production' : 'UAT'}</strong>
          {' | '}
          SHA credential mode:
          {' '}
          <strong>{shaCredentialMode === 'afiax-managed' ? 'Afiax-managed' : 'Tenant-managed'}</strong>
        </Text>
      )}
      {shaCredentialMode === 'tenant-managed' && (
        <Text size="sm" c="dimmed">
          This project is currently set to Tenant-managed SHA mode. Saving Afiax-managed SHA credentials here will
          stage them, but the project will not use them until its Kenya settings are switched to Afiax-managed.
        </Text>
      )}
      <TextInput
        label="SHA Base URL Override"
        description="Optional. Leave blank to use the platform-derived Kenya SHA claims endpoint for the selected environment."
        placeholder="https://mis.apeiro-digital.com"
        value={shaBaseUrlOverride}
        onChange={(event) => setShaBaseUrlOverride(event.currentTarget.value)}
        data-testid="afiax-managed-sha-base-url"
      />
      <TextInput
        label="Kenya SHA Access Key"
        value={shaAccessKey}
        onChange={(event) => setShaAccessKey(event.currentTarget.value)}
        data-testid="afiax-managed-sha-access-key"
      />
      <PasswordInput
        label="Kenya SHA Secret Key"
        value={shaSecretKey}
        onChange={(event) => setShaSecretKey(event.currentTarget.value)}
        data-testid="afiax-managed-sha-secret-key"
      />
      <TextInput
        label="Kenya SHA Callback URL"
        value={shaCallbackUrl}
        onChange={(event) => setShaCallbackUrl(event.currentTarget.value)}
        data-testid="afiax-managed-sha-callback-url"
      />
      <Group>
        <Button onClick={() => saveShaProjectSecrets().catch(console.log)} loading={savingSha}>
          Save Managed SHA Credentials
        </Button>
      </Group>
      <Text size="sm" c="dimmed">
        Saving updates only the Kenya SHA credentials in <code>Project.systemSecret</code>. Other system secrets for
        the project are preserved.
      </Text>
    </Stack>
  );
}
