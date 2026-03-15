// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { List, Stack, Text, Title } from '@mantine/core';
import {
  formatCountryPackLabel,
  getCountryPackCatalogEntry,
  getKenyaAfyaLinkCredentialMode,
  getKenyaAfyaLinkEnvironment,
  getProjectSettingString,
} from '@medplum/core';
import { DescriptionList, DescriptionListEntry, MedplumLink, useMedplum } from '@medplum/react';
import type { JSX } from 'react';
import { getProjectId } from '../utils';

const kenyaAfyaLinkSecretNames = [
  'kenyaAfyaLinkConsumerKey',
  'kenyaAfyaLinkUsername',
  'kenyaAfyaLinkPassword',
];

export function CountryPackPage(): JSX.Element {
  const medplum = useMedplum();
  const projectId = getProjectId(medplum);
  const result = medplum.get(`admin/projects/${projectId}`).read();
  const project = result.project;
  const countryPack = getProjectSettingString(project, 'countryPack');
  const countryPackEntry = getCountryPackCatalogEntry(countryPack);

  if (!countryPackEntry) {
    return (
      <Stack gap="md">
        <Title>Country Pack</Title>
        <Text>
          No country pack is selected for this project yet. Core Medplum features remain available, but country-specific
          verification, registry, and payer flows are not enabled.
        </Text>
        <DescriptionList>
          <DescriptionListEntry term="Current Pack">Core / No Country Pack</DescriptionListEntry>
          <DescriptionListEntry term="Country Workflows">Not enabled</DescriptionListEntry>
        </DescriptionList>
        <List spacing="xs">
          <List.Item>
            Open <MedplumLink to="/admin/settings">Settings</MedplumLink> and choose a country pack.
          </List.Item>
          <List.Item>Save the project settings to activate the pack profile.</List.Item>
          <List.Item>Complete any country-specific secrets after the pack is active.</List.Item>
        </List>
      </Stack>
    );
  }

  if (countryPackEntry.availability === 'placeholder') {
    return (
      <Stack gap="md">
        <Title>Country Pack</Title>
        <Text>
          {countryPackEntry.title} is reserved as a placeholder. The project can carry the profile now, but country
          connectors and operational workflows are not live yet.
        </Text>
        <DescriptionList>
          <DescriptionListEntry term="Current Pack">{formatCountryPackLabel(countryPackEntry)}</DescriptionListEntry>
          <DescriptionListEntry term="Availability">Placeholder</DescriptionListEntry>
          <DescriptionListEntry term="Country Workflows">Not yet available</DescriptionListEntry>
        </DescriptionList>
        <List spacing="xs">
          <List.Item>
            Keep the profile if you want to reserve the project for that rollout.
          </List.Item>
          <List.Item>
            Use <MedplumLink to="/admin/settings">Settings</MedplumLink> to switch back to Core or to Kenya.
          </List.Item>
        </List>
      </Stack>
    );
  }

  if (countryPackEntry.id === 'kenya') {
    const kenyaEnvironment = getKenyaAfyaLinkEnvironment(project);
    const kenyaCredentialMode = getKenyaAfyaLinkCredentialMode(project);
    const configuredSecretCount = kenyaAfyaLinkSecretNames.filter((name) => getProjectSettingString(project.secret, name)).length;
    const missingSecretCount = kenyaAfyaLinkSecretNames.length - configuredSecretCount;

    return (
      <Stack gap="md">
        <Title>Country Pack</Title>
        <Text>
          Kenya is active for this project. Use this page as the setup checklist for DHA access, credential ownership,
          and the first facility-verification workflows.
        </Text>
        <DescriptionList>
          <DescriptionListEntry term="Current Pack">{countryPackEntry.title}</DescriptionListEntry>
          <DescriptionListEntry term="Availability">Active</DescriptionListEntry>
          <DescriptionListEntry term="DHA Environment">
            {kenyaEnvironment === 'production' ? 'Production' : 'UAT'}
          </DescriptionListEntry>
          <DescriptionListEntry term="Credential Mode">
            {kenyaCredentialMode === 'afiax-managed' ? 'Afiax-managed' : 'Tenant-managed'}
          </DescriptionListEntry>
          <DescriptionListEntry term="Credential Status">
            {kenyaCredentialMode === 'afiax-managed'
              ? 'Managed by Afiax platform operations'
              : `${configuredSecretCount} of ${kenyaAfyaLinkSecretNames.length} required DHA credentials configured`}
          </DescriptionListEntry>
        </DescriptionList>
        <List spacing="xs">
          <List.Item>
            Confirm the Kenya DHA environment and credential mode in <MedplumLink to="/admin/settings">Settings</MedplumLink>.
          </List.Item>
          <List.Item>
            {kenyaCredentialMode === 'afiax-managed'
              ? 'Coordinate with Afiax platform ops for managed DHA credentials and connection testing.'
              : 'Complete the DHA consumer key, username, and password in '}
            {kenyaCredentialMode === 'tenant-managed' && <MedplumLink to="/admin/secrets">Secrets</MedplumLink>}
            {kenyaCredentialMode === 'tenant-managed' && '.'}
          </List.Item>
          <List.Item>Use an Organization with an MFL code when you are ready to run facility verification.</List.Item>
        </List>
        {kenyaCredentialMode === 'tenant-managed' && missingSecretCount > 0 && (
          <Text c="dimmed" size="sm">
            {missingSecretCount} Kenya DHA credential{missingSecretCount === 1 ? '' : 's'} still missing from project
            secrets.
          </Text>
        )}
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <Title>Country Pack</Title>
      <Text>{countryPackEntry.title} is active for this project.</Text>
      <DescriptionList>
        <DescriptionListEntry term="Current Pack">{formatCountryPackLabel(countryPackEntry)}</DescriptionListEntry>
        <DescriptionListEntry term="Availability">Active</DescriptionListEntry>
      </DescriptionList>
    </Stack>
  );
}
