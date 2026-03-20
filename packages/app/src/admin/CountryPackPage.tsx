// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Alert, Button, Divider, Group, List, NativeSelect, Stack, Text, TextInput, Title } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import {
  applyKenyaFacilityRegistryToOrganization,
  formatCountryPackLabel,
  getCountryPackCatalogEntry,
  getKenyaHieAgentId,
  getKenyaHieCredentialMode,
  getKenyaHieEnvironment,
  getKenyaFacilityRegistrySnapshot,
  getKenyaShaClaimsCredentialMode,
  getKenyaShaClaimsEnvironment,
  getProjectSettingString,
  KenyaShaClaimsSecretNames,
  normalizeErrorString,
} from '@medplum/core';
import type { Organization } from '@medplum/fhirtypes';
import { DescriptionList, DescriptionListEntry, MedplumLink, useMedplum } from '@medplum/react';
import type { JSX } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { getProjectId } from '../utils';

const kenyaAfyaLinkSecretNames = [
  'kenyaAfyaLinkConsumerKey',
  'kenyaAfyaLinkUsername',
  'kenyaAfyaLinkPassword',
];

const kenyaShaClaimsSecretNames = [
  KenyaShaClaimsSecretNames.accessKey,
  KenyaShaClaimsSecretNames.secretKey,
  KenyaShaClaimsSecretNames.callbackUrl,
];

const createNewFacilityOption = '__create-new__';

interface KenyaFacilityLookupMessage {
  readonly id?: string | null;
  readonly facility_name?: string | null;
  readonly registration_number?: string | null;
  readonly regulator?: string | null;
  readonly facility_code?: string | null;
  readonly found?: number | null;
  readonly approved?: string | boolean | null;
  readonly facility_level?: string | null;
  readonly facility_category?: string | null;
  readonly facility_owner?: string | null;
  readonly facility_type?: string | null;
  readonly county?: string | null;
  readonly sub_county?: string | null;
  readonly ward?: string | null;
  readonly operational_status?: string | null;
  readonly current_license_expiry_date?: string | null;
}

interface KenyaFacilityLookupResponse {
  readonly ok?: boolean;
  readonly baseUrl?: string;
  readonly facilityCode?: string;
  readonly result?: {
    readonly message?: KenyaFacilityLookupMessage;
  } & KenyaFacilityLookupMessage;
}

function getLookupMessage(response: KenyaFacilityLookupResponse | undefined): KenyaFacilityLookupMessage | undefined {
  const result = response?.result;
  if (!result) {
    return undefined;
  }

  if (result.message) {
    return result.message;
  }

  if ('facility_code' in result || 'found' in result || 'facility_name' in result) {
    return result;
  }

  return undefined;
}

export function CountryPackPage(): JSX.Element {
  const medplum = useMedplum();
  const projectId = getProjectId(medplum);
  const result = medplum.get(`admin/projects/${projectId}`).read();
  const project = result.project;
  const countryPack = getProjectSettingString(project, 'countryPack');
  const countryPackEntry = getCountryPackCatalogEntry(countryPack);
  const [facilityCode, setFacilityCode] = useState('');
  const [lookupResponse, setLookupResponse] = useState<KenyaFacilityLookupResponse | undefined>();
  const [lookupError, setLookupError] = useState<string | undefined>();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(createNewFacilityOption);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [savingFacility, setSavingFacility] = useState(false);
  const lookupMessage = getLookupMessage(lookupResponse);
  const organizationOptions = useMemo(
    () => [
      { value: createNewFacilityOption, label: 'Create new organization' },
      ...organizations.map((organization) => ({
        value: organization.id as string,
        label: organization.name ? `${organization.name} (${organization.id})` : (organization.id as string),
      })),
    ],
    [organizations]
  );
  const registryPreview = lookupMessage
    ? getKenyaFacilityRegistrySnapshot(
        applyKenyaFacilityRegistryToOrganization(
          { resourceType: 'Organization', active: true },
          {
            facilityCode: lookupMessage.facility_code ?? facilityCode,
            found: lookupMessage.found,
            facilityName: lookupMessage.facility_name,
            registrationNumber: lookupMessage.registration_number,
            regulator: lookupMessage.regulator,
            approvalStatus: lookupMessage.approved,
            facilityLevel: lookupMessage.facility_level,
            facilityCategory: lookupMessage.facility_category,
            facilityOwner: lookupMessage.facility_owner,
            facilityType: lookupMessage.facility_type,
            county: lookupMessage.county,
            subCounty: lookupMessage.sub_county,
            ward: lookupMessage.ward,
            operationalStatus: lookupMessage.operational_status,
            currentLicenseExpiryDate: lookupMessage.current_license_expiry_date,
          },
          new Date().toISOString()
        )
      )
    : undefined;

  useEffect(() => {
    if (countryPackEntry?.id !== 'kenya') {
      setOrganizations([]);
      setSelectedOrganizationId(createNewFacilityOption);
      setLoadingOrganizations(false);
      return;
    }

    setLoadingOrganizations(true);
    medplum
      .searchResources('Organization', { _count: 20, _sort: '-_lastUpdated' })
      .then((resources) => {
        setOrganizations(resources);
        setSelectedOrganizationId((current) =>
          current !== createNewFacilityOption && resources.some((organization) => organization.id === current)
            ? current
            : createNewFacilityOption
        );
      })
      .catch((err) => {
        showNotification({ color: 'red', message: normalizeErrorString(err), autoClose: false });
      })
      .finally(() => setLoadingOrganizations(false));
  }, [countryPackEntry?.id, medplum]);

  async function handleLookupFacility(): Promise<void> {
    const trimmedCode = facilityCode.trim();
    if (!trimmedCode) {
      setLookupError('Enter the Kenya facility code before lookup.');
      return;
    }

    setLookingUp(true);
    setLookupError(undefined);
    try {
      const response = (await medplum.post(`admin/projects/${projectId}/kenya/afyalink/facility-lookup`, {
        facilityCode: trimmedCode,
      })) as KenyaFacilityLookupResponse;
      setLookupResponse(response);
      const message = getLookupMessage(response);
      if (message?.found === 1) {
        showNotification({ color: 'green', message: 'Facility details loaded from Kenya HIE' });
      } else {
        showNotification({
          color: 'yellow',
          message: `No Kenya HIE facility match found for facility code ${trimmedCode}`,
        });
      }
    } catch (err) {
      const message = normalizeErrorString(err);
      setLookupError(message);
      showNotification({ color: 'red', message, autoClose: false });
    } finally {
      setLookingUp(false);
    }
  }

  async function handleCreateOrApplyFacility(): Promise<void> {
    const trimmedCode = facilityCode.trim();
    if (!trimmedCode) {
      setLookupError('Enter the Kenya facility code before saving the facility.');
      return;
    }

    const message = getLookupMessage(lookupResponse);
    if (!message) {
      setLookupError('Run Kenya HIE lookup first so the setup wizard can use the registry response.');
      return;
    }

    setSavingFacility(true);
    setLookupError(undefined);
    try {
      const lookedUpAt = new Date().toISOString();
      const input = {
        facilityCode: message.facility_code ?? trimmedCode,
        found: message.found,
        facilityName: message.facility_name,
        registrationNumber: message.registration_number,
        regulator: message.regulator,
        approvalStatus: message.approved,
        facilityLevel: message.facility_level,
        facilityCategory: message.facility_category,
        facilityOwner: message.facility_owner,
        facilityType: message.facility_type,
        county: message.county,
        subCounty: message.sub_county,
        ward: message.ward,
        operationalStatus: message.operational_status,
        currentLicenseExpiryDate: message.current_license_expiry_date,
      };

      let savedOrganization: Organization;
      if (selectedOrganizationId === createNewFacilityOption) {
        savedOrganization = await medplum.createResource(
          applyKenyaFacilityRegistryToOrganization(
            {
              resourceType: 'Organization',
              active: true,
            },
            input,
            lookedUpAt
          )
        );
        showNotification({ color: 'green', message: 'Primary Kenya facility created' });
      } else {
        const existingOrganization = organizations.find((organization) => organization.id === selectedOrganizationId);
        if (!existingOrganization) {
          throw new Error('Selected organization no longer exists. Reload the page and try again.');
        }
        savedOrganization = await medplum.updateResource(
          applyKenyaFacilityRegistryToOrganization(existingOrganization, input, lookedUpAt)
        );
        showNotification({ color: 'green', message: 'Kenya facility data applied to organization' });
      }

      const nextOrganizations = await medplum.searchResources('Organization', { _count: 20, _sort: '-_lastUpdated' });
      setOrganizations(nextOrganizations);
      setSelectedOrganizationId(savedOrganization.id as string);
    } catch (err) {
      const message = normalizeErrorString(err);
      setLookupError(message);
      showNotification({ color: 'red', message, autoClose: false });
    } finally {
      setSavingFacility(false);
    }
  }

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
    const kenyaHieEnvironment = getKenyaHieEnvironment(project);
    const kenyaShaClaimsEnvironment = getKenyaShaClaimsEnvironment(project);
    const kenyaHieCredentialMode = getKenyaHieCredentialMode(project);
    const kenyaShaClaimsCredentialMode = getKenyaShaClaimsCredentialMode(project);
    const kenyaHieAgentId = getKenyaHieAgentId(project);
    const configuredHieSecretCount = kenyaAfyaLinkSecretNames.filter((name) => getProjectSettingString(project.secret, name)).length;
    const missingHieSecretCount = kenyaAfyaLinkSecretNames.length - configuredHieSecretCount;
    const configuredShaSecretCount = kenyaShaClaimsSecretNames.filter((name) => getProjectSettingString(project.secret, name)).length;
    const missingShaSecretCount = kenyaShaClaimsSecretNames.length - configuredShaSecretCount;
    const canLookupFacility =
      kenyaHieCredentialMode === 'afiax-managed' || configuredHieSecretCount === kenyaAfyaLinkSecretNames.length;

    return (
      <Stack gap="md">
        <Title>Country Pack</Title>
        <Text>
          Kenya is active for this project. Use this page as the setup checklist for HIE access, SHA claims
          environment, credential ownership, and the first verification workflows.
        </Text>
        <DescriptionList>
          <DescriptionListEntry term="Current Pack">{countryPackEntry.title}</DescriptionListEntry>
          <DescriptionListEntry term="Availability">Active</DescriptionListEntry>
          <DescriptionListEntry term="Kenya HIE Environment">
            {kenyaHieEnvironment === 'production' ? 'Production' : 'UAT'}
          </DescriptionListEntry>
          <DescriptionListEntry term="Kenya SHA Claims Environment">
            {kenyaShaClaimsEnvironment === 'production' ? 'Production' : 'UAT'}
          </DescriptionListEntry>
          <DescriptionListEntry term="HIE Credential Mode">
            {kenyaHieCredentialMode === 'afiax-managed' ? 'Afiax-managed' : 'Tenant-managed'}
          </DescriptionListEntry>
          <DescriptionListEntry term="SHA Credential Mode">
            {kenyaShaClaimsCredentialMode === 'afiax-managed' ? 'Afiax-managed' : 'Tenant-managed'}
          </DescriptionListEntry>
          <DescriptionListEntry term="Kenya HIE Agent ID">{kenyaHieAgentId ?? 'Not configured'}</DescriptionListEntry>
          <DescriptionListEntry term="HIE Credential Status">
            {kenyaHieCredentialMode === 'afiax-managed'
              ? 'Managed by Afiax platform operations'
              : `${configuredHieSecretCount} of ${kenyaAfyaLinkSecretNames.length} required HIE credentials configured`}
          </DescriptionListEntry>
          <DescriptionListEntry term="SHA Credential Status">
            {kenyaShaClaimsCredentialMode === 'afiax-managed'
              ? 'Managed by Afiax platform operations'
              : `${configuredShaSecretCount} of ${kenyaShaClaimsSecretNames.length} required SHA credentials configured`}
          </DescriptionListEntry>
        </DescriptionList>
        <List spacing="xs">
          <List.Item>
            Confirm the Kenya HIE environment, SHA claims environment, and credential mode in{' '}
            <MedplumLink to="/admin/settings">Settings</MedplumLink>.
          </List.Item>
          <List.Item>
            {kenyaHieCredentialMode === 'afiax-managed'
              ? 'Coordinate with Afiax platform ops for managed HIE credentials and connection testing.'
              : 'Complete the HIE consumer key, username, and password in '}
            {kenyaHieCredentialMode === 'tenant-managed' && <MedplumLink to="/admin/secrets">Secrets</MedplumLink>}
            {kenyaHieCredentialMode === 'tenant-managed' && '.'}
          </List.Item>
          <List.Item>
            {kenyaShaClaimsCredentialMode === 'afiax-managed'
              ? 'Coordinate with Afiax platform ops for managed SHA claim credentials.'
              : 'Complete the SHA access key, secret key, and callback URL in '}
            {kenyaShaClaimsCredentialMode === 'tenant-managed' && <MedplumLink to="/admin/secrets">Secrets</MedplumLink>}
            {kenyaShaClaimsCredentialMode === 'tenant-managed' && '.'}
          </List.Item>
          <List.Item>
            Add the Kenya HIE agent ID in Settings before you implement client-registry and related HIE operations.
          </List.Item>
          <List.Item>Use an Organization with an MFL code when you are ready to run facility verification.</List.Item>
        </List>
        {kenyaHieCredentialMode === 'tenant-managed' && missingHieSecretCount > 0 && (
          <Text c="dimmed" size="sm">
            {missingHieSecretCount} Kenya HIE credential{missingHieSecretCount === 1 ? '' : 's'} still missing from project
            secrets.
          </Text>
        )}
        {kenyaShaClaimsCredentialMode === 'tenant-managed' && missingShaSecretCount > 0 && (
          <Text c="dimmed" size="sm">
            {missingShaSecretCount} Kenya SHA credential{missingShaSecretCount === 1 ? '' : 's'} still missing from project
            secrets.
          </Text>
        )}
        <Divider />
        <Stack gap="sm">
          <Title order={3}>Kenya Setup Wizard</Title>
          <Text size="sm" c="dimmed">
            Enter the primary Kenya facility code here, load the DHA registry record, and create or update the first
            organization for this project.
          </Text>
          <Group align="flex-end" grow>
            <TextInput
              label="Kenya Facility Code / MFL Code"
              description="DHA facility lookup uses the facility code parameter."
              value={facilityCode}
              onChange={(event) => setFacilityCode(event.currentTarget.value)}
              placeholder="24749"
            />
            <Button onClick={() => handleLookupFacility().catch(console.error)} loading={lookingUp} disabled={!canLookupFacility}>
              Lookup Facility
            </Button>
          </Group>
          {!canLookupFacility && (
            <Alert color="yellow">
              Complete the Kenya HIE credentials first. Facility lookup is disabled until the project can authenticate
              to DHA.
            </Alert>
          )}
          {lookupError && <Alert color="red">{lookupError}</Alert>}
          {lookupResponse && (
            <>
              <DescriptionList>
                <DescriptionListEntry term="Lookup Base URL">{lookupResponse.baseUrl ?? 'Not returned'}</DescriptionListEntry>
                <DescriptionListEntry term="Lookup Facility Code">
                  {(lookupResponse.facilityCode ?? facilityCode) || 'Not returned'}
                </DescriptionListEntry>
                <DescriptionListEntry term="Registry Match">{lookupMessage?.found === 1 ? 'Found' : 'Not found'}</DescriptionListEntry>
              </DescriptionList>
              {lookupMessage?.found === 1 && registryPreview && (
                <>
                  <DescriptionList>
                    <DescriptionListEntry term="Facility Name">{registryPreview.facilityName ?? 'Not returned'}</DescriptionListEntry>
                    <DescriptionListEntry term="Registration Number">
                      {registryPreview.registrationNumber ?? 'Not returned'}
                    </DescriptionListEntry>
                    <DescriptionListEntry term="Facility Level">{registryPreview.facilityLevel ?? 'Not returned'}</DescriptionListEntry>
                    <DescriptionListEntry term="County">{registryPreview.county ?? 'Not returned'}</DescriptionListEntry>
                    <DescriptionListEntry term="Operational Status">
                      {registryPreview.operationalStatus ?? 'Not returned'}
                    </DescriptionListEntry>
                  </DescriptionList>
                  <Group align="flex-end" grow>
                    <NativeSelect
                      label="Apply Registry Data To"
                      data={organizationOptions}
                      value={selectedOrganizationId}
                      onChange={(event) => setSelectedOrganizationId(event.currentTarget.value)}
                      disabled={loadingOrganizations}
                    />
                    <Button onClick={() => handleCreateOrApplyFacility().catch(console.error)} loading={savingFacility}>
                      {selectedOrganizationId === createNewFacilityOption ? 'Create Primary Facility' : 'Apply To Organization'}
                    </Button>
                  </Group>
                  {organizations.length > 0 && (
                    <Text size="sm" c="dimmed">
                      Existing organizations: {organizations.length}. Select one to update it with DHA registry data, or keep
                      "Create new organization" to create the first Kenya facility record from the lookup.
                    </Text>
                  )}
                </>
              )}
              {lookupMessage?.found !== 1 && (
                <Alert color="yellow">
                  DHA UAT did not return a facility match for this code. You can still create the organization manually from the
                  regular Organization flow, but the setup wizard will not auto-populate it without a registry match.
                </Alert>
              )}
              <Stack gap={4}>
                <Title order={5}>Raw Kenya HIE Response</Title>
                <Text size="sm" c="dimmed">
                  Temporary debug output for DHA lookup troubleshooting during Kenya onboarding.
                </Text>
                <Text
                  component="pre"
                  size="xs"
                  style={{
                    margin: 0,
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--mantine-color-gray-0)',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {JSON.stringify(lookupResponse, null, 2)}
                </Text>
              </Stack>
            </>
          )}
        </Stack>
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
