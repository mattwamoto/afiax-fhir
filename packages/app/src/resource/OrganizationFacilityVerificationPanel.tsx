// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Alert, Button, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import {
  clearKenyaFacilityVerificationSnapshot,
  getKenyaFacilityAuthorityIdentifier,
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
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<FacilityVerificationResult>();
  const [snapshotOverride, setSnapshotOverride] = useState<FacilityVerificationResult | null>();
  const persistedResult = getKenyaFacilityVerificationSnapshot(props.organization);
  const currentResult = result ?? (snapshotOverride === undefined ? persistedResult : snapshotOverride ?? undefined);

  if (!props.organization.id || countryPack !== 'kenya') {
    return null;
  }

  useEffect(() => {
    if (loadedKey !== syncKey) {
      setMflCode(currentFacilityIdentifier?.value ?? '');
      setSavedMflCode(currentFacilityIdentifier?.value ?? '');
      setLoadedKey(syncKey);
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
      const updatedOrganization = clearKenyaFacilityVerificationSnapshot(
        setKenyaFacilityAuthorityIdentifier(props.organization, trimmedCode)
      );
      await medplum.updateResource(updatedOrganization);
      setMflCode(trimmedCode);
      setSavedMflCode(trimmedCode);
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
        <Button
          onClick={() => handleVerifyFacility().catch(console.error)}
          loading={verifying}
          disabled={!savedMflCode.trim() || saving || mflCode.trim() !== savedMflCode.trim()}
        >
          Verify Facility
        </Button>
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
    </Stack>
  );
}
