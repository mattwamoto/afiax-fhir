// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Button, Divider, NativeSelect, Stack, Text, TextInput, Title } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import type { InternalSchemaElement } from '@medplum/core';
import {
  deepClone,
  formatCountryPackLabel,
  getCountryPackCatalog,
  getCountryPackCatalogEntry,
  getElementDefinition,
  getKenyaHieAgentId,
  getKenyaHieCredentialMode,
  getKenyaHieEnvironment,
  getKenyaShaClaimsCredentialMode,
  getKenyaShaClaimsEnvironment,
  getProjectSettingString,
  KenyaProjectSettingNames,
} from '@medplum/core';
import type { ProjectSetting } from '@medplum/fhirtypes';
import { ResourcePropertyInput, useMedplum } from '@medplum/react';
import type { FormEvent, JSX } from 'react';
import { useEffect, useState } from 'react';
import { getProjectId } from '../utils';

function setNamedProjectSettingValue(settings: ProjectSetting[], name: string, value: string): ProjectSetting[] {
  const nextSettings = deepClone(settings);
  const index = nextSettings.findIndex((entry) => entry.name === name);
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    if (index >= 0) {
      nextSettings.splice(index, 1);
    }
    return nextSettings;
  }

  const setting: ProjectSetting = {
    name,
    valueString: value,
  };

  if (index >= 0) {
    nextSettings[index] = setting;
  } else {
    nextSettings.push(setting);
  }

  return nextSettings;
}

function handleSettingsChange(
  nextSettings: ProjectSetting[] | undefined,
  setSettings: (settings: ProjectSetting[] | undefined) => void,
  setSelectedCountryPack: (value: string) => void,
  setSelectedKenyaHieEnvironment: (value: 'uat' | 'production') => void,
  setSelectedKenyaShaClaimsEnvironment: (value: 'uat' | 'production') => void,
  setSelectedKenyaHieCredentialMode: (value: 'tenant-managed' | 'afiax-managed') => void,
  setSelectedKenyaShaClaimsCredentialMode: (value: 'tenant-managed' | 'afiax-managed') => void,
  setKenyaHieAgentId: (value: string) => void
): void {
  setSettings(nextSettings);
  setSelectedCountryPack(getProjectSettingString(nextSettings, 'countryPack') ?? '');
  setSelectedKenyaHieEnvironment(getKenyaHieEnvironment(nextSettings));
  setSelectedKenyaShaClaimsEnvironment(getKenyaShaClaimsEnvironment(nextSettings));
  setSelectedKenyaHieCredentialMode(getKenyaHieCredentialMode(nextSettings));
  setSelectedKenyaShaClaimsCredentialMode(getKenyaShaClaimsCredentialMode(nextSettings));
  setKenyaHieAgentId(getKenyaHieAgentId(nextSettings) ?? '');
}

export function SettingsPage(): JSX.Element {
  const medplum = useMedplum();
  const projectId = getProjectId(medplum);
  const projectDetails = medplum.get(`admin/projects/${projectId}`).read();
  const loadedSettingsKey = JSON.stringify(projectDetails.project.setting || []);
  const [schemaLoaded, setSchemaLoaded] = useState<boolean>(false);
  const [settings, setSettings] = useState<ProjectSetting[] | undefined>();
  const [selectedCountryPack, setSelectedCountryPack] = useState('');
  const [selectedKenyaHieEnvironment, setSelectedKenyaHieEnvironment] = useState<'uat' | 'production'>('uat');
  const [selectedKenyaShaClaimsEnvironment, setSelectedKenyaShaClaimsEnvironment] = useState<'uat' | 'production'>(
    'uat'
  );
  const [selectedKenyaHieCredentialMode, setSelectedKenyaHieCredentialMode] = useState<
    'tenant-managed' | 'afiax-managed'
  >(
    'tenant-managed'
  );
  const [selectedKenyaShaClaimsCredentialMode, setSelectedKenyaShaClaimsCredentialMode] = useState<
    'tenant-managed' | 'afiax-managed'
  >(
    'tenant-managed'
  );
  const [kenyaHieAgentId, setKenyaHieAgentId] = useState('');

  useEffect(() => {
    medplum
      .requestSchema('Project')
      .then(() => setSchemaLoaded(true))
      .catch(console.log);
  }, [medplum]);

  useEffect(() => {
    const nextSettings = deepClone(projectDetails.project.setting || []);
    setSettings(nextSettings);
    setSelectedCountryPack(getProjectSettingString(nextSettings, 'countryPack') ?? '');
    setSelectedKenyaHieEnvironment(getKenyaHieEnvironment(nextSettings));
    setSelectedKenyaShaClaimsEnvironment(getKenyaShaClaimsEnvironment(nextSettings));
    setSelectedKenyaHieCredentialMode(getKenyaHieCredentialMode(nextSettings));
    setSelectedKenyaShaClaimsCredentialMode(getKenyaShaClaimsCredentialMode(nextSettings));
    setKenyaHieAgentId(getKenyaHieAgentId(nextSettings) ?? '');
  }, [loadedSettingsKey]);

  if (!schemaLoaded || settings === undefined) {
    return <div>Loading...</div>;
  }

  const selectedCountryPackEntry = getCountryPackCatalogEntry(selectedCountryPack);
  const settingsEditorKey = JSON.stringify(settings.map((setting) => [setting.name, setting.valueString ?? '']));
  const countryPackOptions = [
    { value: '', label: 'Core / No Country Pack' },
    ...getCountryPackCatalog().map((entry) => ({
      value: entry.id,
      label: formatCountryPackLabel(entry),
    })),
  ];

  return (
    <form
      noValidate
      autoComplete="off"
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        let settingsToSave = setNamedProjectSettingValue(settings, 'countryPack', selectedCountryPack);
        settingsToSave = setNamedProjectSettingValue(
          settingsToSave,
          KenyaProjectSettingNames.hieEnvironment,
          selectedCountryPack === 'kenya' ? selectedKenyaHieEnvironment : ''
        );
        settingsToSave = setNamedProjectSettingValue(
          settingsToSave,
          KenyaProjectSettingNames.hieCredentialMode,
          selectedCountryPack === 'kenya' ? selectedKenyaHieCredentialMode : ''
        );
        settingsToSave = setNamedProjectSettingValue(
          settingsToSave,
          KenyaProjectSettingNames.hieAgentId,
          selectedCountryPack === 'kenya' ? kenyaHieAgentId : ''
        );
        settingsToSave = setNamedProjectSettingValue(
          settingsToSave,
          KenyaProjectSettingNames.shaClaimsEnvironment,
          selectedCountryPack === 'kenya' ? selectedKenyaShaClaimsEnvironment : ''
        );
        settingsToSave = setNamedProjectSettingValue(
          settingsToSave,
          KenyaProjectSettingNames.shaClaimsCredentialMode,
          selectedCountryPack === 'kenya' ? selectedKenyaShaClaimsCredentialMode : ''
        );
        settingsToSave = setNamedProjectSettingValue(
          settingsToSave,
          KenyaProjectSettingNames.afyaLinkEnvironment,
          ''
        );
        settingsToSave = setNamedProjectSettingValue(
          settingsToSave,
          KenyaProjectSettingNames.afyaLinkCredentialMode,
          ''
        );
        medplum
          .post(`admin/projects/${projectId}/settings`, settingsToSave)
          .then(() => medplum.get(`admin/projects/${projectId}`, { cache: 'reload' }))
          .then(() => showNotification({ color: 'green', message: 'Saved' }))
          .catch(console.log);
      }}
    >
      <Title>Project Settings</Title>
      <Text mb="md">
        Use project settings for non-secret operational configuration such as country pack selection, feature flags, or
        integration defaults. Keep credentials and API keys in Project Secrets.
      </Text>
      <Stack gap="md" mb="xl">
        <div>
          <Title order={3}>Country Pack</Title>
          <Text size="sm" c="dimmed">
            Select the country pack this project should use. Kenya is active now. The remaining East Africa and COMESA
            entries are placeholders for upcoming rollouts.
          </Text>
        </div>
        <NativeSelect
          label="Country Pack"
          description="This sets Project.setting.countryPack for the current project."
          value={selectedCountryPack}
          data={countryPackOptions}
          onChange={(event) => setSelectedCountryPack(event.currentTarget.value)}
        />
        {selectedCountryPackEntry?.availability === 'active' && (
          <Text size="sm">
            {selectedCountryPackEntry.title} is active. After saving, complete any required connector secrets in the
            Secrets tab.
          </Text>
        )}
        {selectedCountryPackEntry?.availability === 'placeholder' && (
          <Text size="sm" c="dimmed">
            {selectedCountryPackEntry.title} is listed as a placeholder only. Selecting it reserves the project profile,
            but country-specific operations and connectors are not live yet.
          </Text>
        )}
        {selectedCountryPack === 'kenya' && (
          <>
            <Title order={3}>Kenya DHA and SHA Access</Title>
            <Text size="sm" c="dimmed">
              Kenya registry and HIE services use the HIE environment below. Kenya SHA claim operations use the
              separate SHA claims environment. Project admins only set the environments and HIE agent ID here.
            </Text>
            <NativeSelect
              label="Kenya HIE Environment"
              description="Used for DHA auth, facility registry, practitioner registry, eligibility, and client registry calls."
              value={selectedKenyaHieEnvironment}
              data={[
                { value: 'uat', label: 'UAT' },
                { value: 'production', label: 'Production' },
              ]}
              onChange={(event) => setSelectedKenyaHieEnvironment(event.currentTarget.value as 'uat' | 'production')}
            />
            <NativeSelect
              label="HIE Credential Mode"
              description="Tenant-managed uses project secrets. Afiax-managed uses platform-level secrets outside the project UI."
              value={selectedKenyaHieCredentialMode}
              data={[
                { value: 'tenant-managed', label: 'Tenant-managed' },
                { value: 'afiax-managed', label: 'Afiax-managed' },
              ]}
              onChange={(event) =>
                setSelectedKenyaHieCredentialMode(event.currentTarget.value as 'tenant-managed' | 'afiax-managed')
              }
            />
            <NativeSelect
              label="Kenya SHA Claims Environment"
              description="Used by Kenya claim-submission operations. Specific SHA hosts may vary by operation family, but the environment remains project-scoped."
              value={selectedKenyaShaClaimsEnvironment}
              data={[
                { value: 'uat', label: 'UAT' },
                { value: 'production', label: 'Production' },
              ]}
              onChange={(event) =>
                setSelectedKenyaShaClaimsEnvironment(event.currentTarget.value as 'uat' | 'production')
              }
            />
            <NativeSelect
              label="SHA Claims Credential Mode"
              description="Tenant-managed uses project secrets. Afiax-managed uses platform-level secrets outside the project UI."
              value={selectedKenyaShaClaimsCredentialMode}
              data={[
                { value: 'tenant-managed', label: 'Tenant-managed' },
                { value: 'afiax-managed', label: 'Afiax-managed' },
              ]}
              onChange={(event) =>
                setSelectedKenyaShaClaimsCredentialMode(event.currentTarget.value as 'tenant-managed' | 'afiax-managed')
              }
            />
            <TextInput
              label="Kenya HIE Agent ID"
              description="Agent identifier used by DHA client-registry and related HIE operations. This is operational config, not a secret."
              value={kenyaHieAgentId}
              onChange={(event) => setKenyaHieAgentId(event.currentTarget.value)}
              placeholder="Enter DHA HIE agent ID"
            />
            {selectedKenyaHieCredentialMode === 'afiax-managed' && (
              <Text size="sm">
                Afiax-managed mode hides HIE credentials from tenant admins. The Secrets tab will show connection
                status only and rely on platform-managed secrets.
              </Text>
            )}
            {selectedKenyaShaClaimsCredentialMode === 'afiax-managed' && (
              <Text size="sm">
                Afiax-managed SHA mode hides claim transport credentials from tenant admins. The Secrets tab will show
                status only and rely on platform-managed SHA claim credentials.
              </Text>
            )}
          </>
        )}
        <Divider />
      </Stack>
      <Title order={3}>Advanced Settings Editor</Title>
      <Text size="sm" c="dimmed" mb="md">
        Use the editor below for additional project settings beyond the curated country-pack selector.
      </Text>
      <ResourcePropertyInput
        key={settingsEditorKey}
        property={getElementDefinition('Project', 'setting') as InternalSchemaElement}
        name="setting"
        path="Project.setting"
        defaultValue={settings}
        onChange={(nextSettings) =>
          handleSettingsChange(
            nextSettings,
            setSettings,
            setSelectedCountryPack,
            setSelectedKenyaHieEnvironment,
            setSelectedKenyaShaClaimsEnvironment,
            setSelectedKenyaHieCredentialMode,
            setSelectedKenyaShaClaimsCredentialMode,
            setKenyaHieAgentId
          )
        }
        outcome={undefined}
      />
      <Button type="submit">Save</Button>
    </form>
  );
}
