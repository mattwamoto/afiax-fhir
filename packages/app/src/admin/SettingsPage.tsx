// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Button, Divider, NativeSelect, Stack, Text, Title } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import type { InternalSchemaElement } from '@medplum/core';
import {
  deepClone,
  formatCountryPackLabel,
  getCountryPackCatalog,
  getCountryPackCatalogEntry,
  getElementDefinition,
  getKenyaAfyaLinkCredentialMode,
  getKenyaAfyaLinkEnvironment,
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
  setSelectedKenyaEnvironment: (value: 'uat' | 'production') => void,
  setSelectedKenyaCredentialMode: (value: 'tenant-managed' | 'afiax-managed') => void
): void {
  setSettings(nextSettings);
  setSelectedCountryPack(getProjectSettingString(nextSettings, 'countryPack') ?? '');
  setSelectedKenyaEnvironment(getKenyaAfyaLinkEnvironment(nextSettings));
  setSelectedKenyaCredentialMode(getKenyaAfyaLinkCredentialMode(nextSettings));
}

export function SettingsPage(): JSX.Element {
  const medplum = useMedplum();
  const projectId = getProjectId(medplum);
  const projectDetails = medplum.get(`admin/projects/${projectId}`).read();
  const loadedSettingsKey = JSON.stringify(projectDetails.project.setting || []);
  const [schemaLoaded, setSchemaLoaded] = useState<boolean>(false);
  const [settings, setSettings] = useState<ProjectSetting[] | undefined>();
  const [selectedCountryPack, setSelectedCountryPack] = useState('');
  const [selectedKenyaEnvironment, setSelectedKenyaEnvironment] = useState<'uat' | 'production'>('uat');
  const [selectedKenyaCredentialMode, setSelectedKenyaCredentialMode] = useState<'tenant-managed' | 'afiax-managed'>(
    'tenant-managed'
  );

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
    setSelectedKenyaEnvironment(getKenyaAfyaLinkEnvironment(nextSettings));
    setSelectedKenyaCredentialMode(getKenyaAfyaLinkCredentialMode(nextSettings));
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
          KenyaProjectSettingNames.afyaLinkEnvironment,
          selectedCountryPack === 'kenya' ? selectedKenyaEnvironment : ''
        );
        settingsToSave = setNamedProjectSettingValue(
          settingsToSave,
          KenyaProjectSettingNames.afyaLinkCredentialMode,
          selectedCountryPack === 'kenya' ? selectedKenyaCredentialMode : ''
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
            <Title order={3}>Kenya DHA Access</Title>
            <Text size="sm" c="dimmed">
              DHA environment and credential ownership are non-secret Kenya settings. The endpoint is derived from the
              selected environment and platform configuration; project users do not need to type it.
            </Text>
            <NativeSelect
              label="DHA Environment"
              description="Use UAT while validating AfyaLink and switch to Production only after DHA approval."
              value={selectedKenyaEnvironment}
              data={[
                { value: 'uat', label: 'UAT' },
                { value: 'production', label: 'Production' },
              ]}
              onChange={(event) => setSelectedKenyaEnvironment(event.currentTarget.value as 'uat' | 'production')}
            />
            <NativeSelect
              label="Credential Mode"
              description="Tenant-managed uses project secrets. Afiax-managed uses platform-level secrets outside the project UI."
              value={selectedKenyaCredentialMode}
              data={[
                { value: 'tenant-managed', label: 'Tenant-managed' },
                { value: 'afiax-managed', label: 'Afiax-managed' },
              ]}
              onChange={(event) =>
                setSelectedKenyaCredentialMode(event.currentTarget.value as 'tenant-managed' | 'afiax-managed')
              }
            />
            {selectedKenyaCredentialMode === 'afiax-managed' && (
              <Text size="sm">
                Afiax-managed mode hides DHA credentials from tenant admins. The Secrets tab will show connection status
                only and rely on platform-managed secrets.
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
            setSelectedKenyaEnvironment,
            setSelectedKenyaCredentialMode
          )
        }
        outcome={undefined}
      />
      <Button type="submit">Save</Button>
    </form>
  );
}
