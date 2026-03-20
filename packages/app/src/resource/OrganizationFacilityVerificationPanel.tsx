// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Alert, Button, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import {
  applyKenyaFacilityRegistryToOrganization,
  clearKenyaFacilityRegistrySnapshot,
  clearKenyaFacilityVerificationSnapshot,
  getKenyaFacilityAuthorityIdentifier,
  getKenyaFacilityRegistrySnapshot,
  getKenyaFacilityVerificationSnapshot,
  getProjectSettingString,
  normalizeErrorString,
  setKenyaFacilityAuthorityIdentifier,
} from '@medplum/core';
import type { Organization, Parameters, ParametersParameter, Reference, Task } from '@medplum/fhirtypes';
import { DescriptionList, DescriptionListEntry, MedplumLink, useMedplum } from '@medplum/react';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';

interface FacilityVerificationResult {
  readonly status?: string;
  readonly correlationId?: string;
  readonly message?: string;
  readonly nextState?: string;
  readonly verifiedAt?: string;
  readonly facilityApprovalStatus?: string;
  readonly facilityOperationalStatus?: string;
  readonly currentLicenseExpiryDate?: string;
  readonly facilityAuthorityIdentifier?: string;
  readonly task?: Reference<Task>;
}

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

interface KenyaFacilityLookupDebug {
  readonly baseUrl?: string;
  readonly facilityCode?: string;
  readonly response: KenyaFacilityLookupResponse;
}

export interface OrganizationFacilityVerificationPanelProps {
  readonly organization: Organization;
}

function getParameter(parameters: Parameters | undefined, name: string): ParametersParameter | undefined {
  return parameters?.parameter?.find((param) => param.name === name);
}

function getVerificationResult(parameters: Parameters | undefined): FacilityVerificationResult {
  return {
    status: getParameter(parameters, 'status')?.valueCode,
    correlationId: getParameter(parameters, 'correlationId')?.valueString,
    message: getParameter(parameters, 'message')?.valueString,
    nextState: getParameter(parameters, 'nextState')?.valueString,
    facilityApprovalStatus: getParameter(parameters, 'facilityApprovalStatus')?.valueString,
    facilityOperationalStatus: getParameter(parameters, 'facilityOperationalStatus')?.valueString,
    currentLicenseExpiryDate: getParameter(parameters, 'currentLicenseExpiryDate')?.valueString,
    facilityAuthorityIdentifier: getParameter(parameters, 'facilityAuthorityIdentifier')?.valueString,
    task: getParameter(parameters, 'task')?.valueReference as Reference<Task> | undefined,
  };
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

export function OrganizationFacilityVerificationPanel(
  props: OrganizationFacilityVerificationPanelProps
): JSX.Element | null {
  const medplum = useMedplum();
  const project = medplum.getProject();
  const countryPack = getProjectSettingString(project, 'countryPack');
  const currentFacilityIdentifier = getKenyaFacilityAuthorityIdentifier(props.organization);
  const syncKey = JSON.stringify({
    id: props.organization.id,
    identifier: props.organization.identifier,
    extension: props.organization.extension,
  });
  const [mflCode, setMflCode] = useState(currentFacilityIdentifier?.value ?? '');
  const [savedMflCode, setSavedMflCode] = useState(currentFacilityIdentifier?.value ?? '');
  const [loadedKey, setLoadedKey] = useState(syncKey);
  const [saving, setSaving] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<FacilityVerificationResult>();
  const facilityRegistrySnapshot = getKenyaFacilityRegistrySnapshot(props.organization);
  const persistedResult = getKenyaFacilityVerificationSnapshot(props.organization);
  const [registrySnapshotOverride, setRegistrySnapshotOverride] = useState(facilityRegistrySnapshot);
  const [lookupDebug, setLookupDebug] = useState<KenyaFacilityLookupDebug | undefined>();
  const [snapshotOverride, setSnapshotOverride] = useState<FacilityVerificationResult | null>();
  const currentRegistrySnapshot =
    registrySnapshotOverride === undefined ? facilityRegistrySnapshot : registrySnapshotOverride ?? undefined;
  const currentResult = result ?? (snapshotOverride === undefined ? persistedResult : snapshotOverride ?? undefined);

  if (!props.organization.id || countryPack !== 'kenya') {
    return null;
  }

  useEffect(() => {
    if (loadedKey !== syncKey) {
      setMflCode(currentFacilityIdentifier?.value ?? '');
      setSavedMflCode(currentFacilityIdentifier?.value ?? '');
      setLoadedKey(syncKey);
      setRegistrySnapshotOverride(undefined);
      setLookupDebug(undefined);
      setSnapshotOverride(undefined);
    }
  }, [currentFacilityIdentifier?.value, loadedKey, syncKey]);

  async function handleSaveMflCode(): Promise<void> {
    const trimmedCode = mflCode.trim();
    if (!trimmedCode) {
      setError('Kenya MFL code is required before verification.');
      return;
    }

    setSaving(true);
    setError(undefined);
    try {
      const updatedOrganization = clearKenyaFacilityRegistrySnapshot(
        clearKenyaFacilityVerificationSnapshot(setKenyaFacilityAuthorityIdentifier(props.organization, trimmedCode))
      );
      const savedOrganization = await medplum.updateResource(updatedOrganization);
      setMflCode(trimmedCode);
      setSavedMflCode(trimmedCode);
      setRegistrySnapshotOverride(getKenyaFacilityRegistrySnapshot(savedOrganization));
      setLookupDebug(undefined);
      setResult(undefined);
      setSnapshotOverride(null);
      showNotification({ color: 'green', message: 'Kenya MFL code saved' });
    } catch (err) {
      const message = normalizeErrorString(err);
      setError(message);
      showNotification({ color: 'red', message, autoClose: false });
    } finally {
      setSaving(false);
    }
  }

  async function handleLookupFacility(): Promise<void> {
    const trimmedCode = mflCode.trim();
    if (!trimmedCode) {
      setError('Kenya MFL code is required before facility lookup.');
      return;
    }

    setLookingUp(true);
    setError(undefined);
    try {
      const lookupResult = (await medplum.post(`admin/projects/${project?.id}/kenya/afyalink/facility-lookup`, {
        facilityCode: trimmedCode,
      })) as KenyaFacilityLookupResponse;
      const message = getLookupMessage(lookupResult);
      const lookedUpAt = new Date().toISOString();
      setLookupDebug({
        baseUrl: lookupResult.baseUrl,
        facilityCode: lookupResult.facilityCode ?? trimmedCode,
        response: lookupResult,
      });

      const updatedOrganization = applyKenyaFacilityRegistryToOrganization(
        clearKenyaFacilityVerificationSnapshot(props.organization),
        {
          facilityCode: message?.facility_code ?? trimmedCode,
          found: message?.found,
          facilityName: message?.facility_name,
          registrationNumber: message?.registration_number,
          regulator: message?.regulator,
          approvalStatus: message?.approved,
          facilityLevel: message?.facility_level,
          facilityCategory: message?.facility_category,
          facilityOwner: message?.facility_owner,
          facilityType: message?.facility_type,
          county: message?.county,
          subCounty: message?.sub_county,
          ward: message?.ward,
          operationalStatus: message?.operational_status,
          currentLicenseExpiryDate: message?.current_license_expiry_date,
        },
        lookedUpAt
      );

      const savedOrganization = await medplum.updateResource(updatedOrganization);
      setSavedMflCode(trimmedCode);
      setRegistrySnapshotOverride(getKenyaFacilityRegistrySnapshot(savedOrganization));
      setResult(undefined);
      setSnapshotOverride(null);

      if (message?.found === 1) {
        showNotification({ color: 'green', message: 'Facility details populated from Kenya HIE' });
      } else {
        showNotification({ color: 'yellow', message: `No Kenya HIE facility match found for ${trimmedCode}` });
      }
    } catch (err) {
      const message = normalizeErrorString(err);
      setError(message);
      showNotification({ color: 'red', message, autoClose: false });
    } finally {
      setLookingUp(false);
    }
  }

  async function handleVerifyFacility(): Promise<void> {
    setVerifying(true);
    setError(undefined);
    try {
      const parameters = (await medplum.post(
        medplum.fhirUrl('Organization', props.organization.id as string, '$verify-facility-authority')
      )) as Parameters;
      const verificationResult = getVerificationResult(parameters);
      setResult(verificationResult);
      setSnapshotOverride(verificationResult);
      showNotification({ color: 'green', message: 'Facility verification completed' });
    } catch (err) {
      const message = normalizeErrorString(err);
      setError(message);
      showNotification({ color: 'red', message, autoClose: false });
    } finally {
      setVerifying(false);
    }
  }

  return (
    <Stack gap="sm" mb="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={3}>Kenya Facility Verification</Title>
          <Text size="sm" c="dimmed">
            Runs the Kenya HIE facility-registry verification flow for this organization using its MFL code.
          </Text>
        </div>
        <Group>
          <Button
            variant="light"
            onClick={() => handleLookupFacility().catch(console.error)}
            loading={lookingUp}
            disabled={!mflCode.trim() || saving || verifying}
          >
            Lookup Facility
          </Button>
          <Button
            onClick={() => handleVerifyFacility().catch(console.error)}
            loading={verifying}
            disabled={!savedMflCode.trim() || saving || lookingUp || mflCode.trim() !== savedMflCode.trim()}
          >
            Verify Facility
          </Button>
        </Group>
      </Group>
      <Group align="flex-end" grow>
        <TextInput
          label="Kenya MFL Code"
          description="Stored in Organization.identifier using the Kenya facility authority identifier system."
          placeholder="24749"
          value={mflCode}
          onChange={(event) => setMflCode(event.currentTarget.value)}
        />
        <Button
          variant="light"
          onClick={() => handleSaveMflCode().catch(console.error)}
          loading={saving}
          disabled={!mflCode.trim() || mflCode.trim() === savedMflCode.trim()}
        >
          Save MFL Code
        </Button>
      </Group>
      {!mflCode.trim() && (
        <Alert color="yellow">Add the Kenya MFL code first. Verification stays disabled until the code is saved.</Alert>
      )}
      {mflCode.trim() && mflCode.trim() !== savedMflCode.trim() && (
        <Alert color="blue">Save the MFL code first. Verification always uses the saved Organization identifier.</Alert>
      )}
      {error && <Alert color="red">{error}</Alert>}
      {currentRegistrySnapshot && (
        <DescriptionList>
          <DescriptionListEntry term="Registry Match">
            {currentRegistrySnapshot.found === true ? 'Found' : 'No match returned'}
          </DescriptionListEntry>
          <DescriptionListEntry term="Facility Name">{currentRegistrySnapshot.facilityName ?? 'Not returned'}</DescriptionListEntry>
          <DescriptionListEntry term="Registration Number">
            {currentRegistrySnapshot.registrationNumber ?? 'Not returned'}
          </DescriptionListEntry>
          <DescriptionListEntry term="Regulator">{currentRegistrySnapshot.regulator ?? 'Not returned'}</DescriptionListEntry>
          <DescriptionListEntry term="Facility Level">
            {currentRegistrySnapshot.facilityLevel ?? 'Not returned'}
          </DescriptionListEntry>
          <DescriptionListEntry term="Facility Category">
            {currentRegistrySnapshot.facilityCategory ?? 'Not returned'}
          </DescriptionListEntry>
          <DescriptionListEntry term="Facility Owner">
            {currentRegistrySnapshot.facilityOwner ?? 'Not returned'}
          </DescriptionListEntry>
          <DescriptionListEntry term="Facility Type">
            {currentRegistrySnapshot.facilityType ?? 'Not returned'}
          </DescriptionListEntry>
          <DescriptionListEntry term="County">{currentRegistrySnapshot.county ?? 'Not returned'}</DescriptionListEntry>
          <DescriptionListEntry term="Sub County">
            {currentRegistrySnapshot.subCounty ?? 'Not returned'}
          </DescriptionListEntry>
          <DescriptionListEntry term="Ward">{currentRegistrySnapshot.ward ?? 'Not returned'}</DescriptionListEntry>
          <DescriptionListEntry term="Registry Approval">
            {currentRegistrySnapshot.approvalStatus ?? 'Not returned'}
          </DescriptionListEntry>
          <DescriptionListEntry term="Registry Operational Status">
            {currentRegistrySnapshot.operationalStatus ?? 'Not returned'}
          </DescriptionListEntry>
          <DescriptionListEntry term="Registry License Expiry">
            {currentRegistrySnapshot.currentLicenseExpiryDate ?? 'Not returned'}
          </DescriptionListEntry>
          <DescriptionListEntry term="Last Lookup">
            {currentRegistrySnapshot.lookedUpAt ?? 'Not returned'}
          </DescriptionListEntry>
        </DescriptionList>
      )}
      {currentResult?.status && (
        <DescriptionList>
          <DescriptionListEntry term="Status">{currentResult.status}</DescriptionListEntry>
          <DescriptionListEntry term="Message">{currentResult.message ?? 'No message returned'}</DescriptionListEntry>
          <DescriptionListEntry term="Next State">{currentResult.nextState ?? 'Not provided'}</DescriptionListEntry>
          <DescriptionListEntry term="Correlation ID">{currentResult.correlationId ?? 'Not provided'}</DescriptionListEntry>
          <DescriptionListEntry term="Facility Identifier">
            {currentResult.facilityAuthorityIdentifier ?? 'Not returned'}
          </DescriptionListEntry>
          <DescriptionListEntry term="Approval Status">
            {currentResult.facilityApprovalStatus ?? 'Not returned'}
          </DescriptionListEntry>
          <DescriptionListEntry term="Operational Status">
            {currentResult.facilityOperationalStatus ?? 'Not returned'}
          </DescriptionListEntry>
          <DescriptionListEntry term="License Expiry">
            {currentResult.currentLicenseExpiryDate ?? 'Not returned'}
          </DescriptionListEntry>
          <DescriptionListEntry term="Verified At">
            {currentResult.verifiedAt ?? 'Not returned'}
          </DescriptionListEntry>
          <DescriptionListEntry term="Task">
            {currentResult.task?.reference ? (
              <MedplumLink to={`/${currentResult.task.reference}`}>{currentResult.task.reference}</MedplumLink>
            ) : (
              'Not returned'
            )}
          </DescriptionListEntry>
        </DescriptionList>
      )}
      {lookupDebug && (
        <Stack gap={4}>
          <Title order={5}>Raw Kenya HIE Response</Title>
          <Text size="sm" c="dimmed">
            Temporary debug output for DHA UAT lookup troubleshooting.
          </Text>
          <DescriptionList>
            <DescriptionListEntry term="Lookup Base URL">{lookupDebug.baseUrl ?? 'Not returned'}</DescriptionListEntry>
            <DescriptionListEntry term="Lookup Facility Code">
              {lookupDebug.facilityCode ?? 'Not returned'}
            </DescriptionListEntry>
          </DescriptionList>
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
            {JSON.stringify(lookupDebug.response, null, 2)}
          </Text>
        </Stack>
      )}
    </Stack>
  );
}
