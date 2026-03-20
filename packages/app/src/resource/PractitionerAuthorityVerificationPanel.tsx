// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Alert, Button, Group, NativeSelect, Stack, Text, TextInput, Title } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import {
  applyKenyaPractitionerRegistryToPractitioner,
  clearKenyaPractitionerRegistrySnapshot,
  clearKenyaPractitionerVerificationSnapshot,
  getKenyaPractitionerLookupIdentifier,
  getKenyaPractitionerRegistrySnapshot,
  getKenyaPractitionerVerificationSnapshot,
  getProjectSettingString,
  normalizeErrorString,
  setKenyaPractitionerLookupIdentifier,
  type KenyaPractitionerIdentificationType,
} from '@medplum/core';
import type { Parameters, ParametersParameter, Practitioner, Reference, Task } from '@medplum/fhirtypes';
import { DescriptionList, DescriptionListEntry, MedplumLink, useMedplum } from '@medplum/react';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';

interface PractitionerVerificationResult {
  readonly status?: string;
  readonly correlationId?: string;
  readonly message?: string;
  readonly nextState?: string;
  readonly verifiedAt?: string;
  readonly registrationNumber?: string;
  readonly practitionerAuthorityIdentifier?: string;
  readonly practitionerActiveStatus?: string;
  readonly identificationType?: string;
  readonly identificationNumber?: string;
  readonly task?: Reference<Task>;
}

interface KenyaPractitionerLookupMessage {
  readonly registration_number?: string | number | null;
  readonly found?: number | null;
  readonly is_active?: string | boolean | null;
}

interface KenyaPractitionerLookupResponse {
  readonly ok?: boolean;
  readonly baseUrl?: string;
  readonly identificationType?: string;
  readonly identificationNumber?: string;
  readonly result?: {
    readonly message?: KenyaPractitionerLookupMessage;
  } & KenyaPractitionerLookupMessage;
}

interface KenyaPractitionerLookupDebug {
  readonly baseUrl?: string;
  readonly identificationType?: string;
  readonly identificationNumber?: string;
  readonly response: KenyaPractitionerLookupResponse;
}

export interface PractitionerAuthorityVerificationPanelProps {
  readonly practitioner: Practitioner;
}

function getParameter(parameters: Parameters | undefined, name: string): ParametersParameter | undefined {
  return parameters?.parameter?.find((param) => param.name === name);
}

function getVerificationResult(parameters: Parameters | undefined): PractitionerVerificationResult {
  return {
    status: getParameter(parameters, 'status')?.valueCode,
    correlationId: getParameter(parameters, 'correlationId')?.valueString,
    message: getParameter(parameters, 'message')?.valueString,
    nextState: getParameter(parameters, 'nextState')?.valueString,
    registrationNumber: getParameter(parameters, 'registrationNumber')?.valueString,
    practitionerAuthorityIdentifier: getParameter(parameters, 'practitionerAuthorityIdentifier')?.valueString,
    practitionerActiveStatus: getParameter(parameters, 'practitionerActiveStatus')?.valueString,
    identificationType: getParameter(parameters, 'identificationType')?.valueString,
    identificationNumber: getParameter(parameters, 'identificationNumber')?.valueString,
    task: getParameter(parameters, 'task')?.valueReference as Reference<Task> | undefined,
  };
}

function getLookupMessage(response: KenyaPractitionerLookupResponse | undefined): KenyaPractitionerLookupMessage | undefined {
  const result = response?.result;
  if (!result) {
    return undefined;
  }

  if (result.message) {
    return result.message;
  }

  if ('registration_number' in result || 'found' in result || 'is_active' in result) {
    return result;
  }

  return undefined;
}

function getBooleanDisplay(value: boolean | undefined): string {
  if (value === true) {
    return 'Active';
  }
  if (value === false) {
    return 'Inactive';
  }
  return 'Not returned';
}

export function PractitionerAuthorityVerificationPanel(
  props: PractitionerAuthorityVerificationPanelProps
): JSX.Element | null {
  const medplum = useMedplum();
  const project = medplum.getProject();
  const countryPack = getProjectSettingString(project, 'countryPack');
  const currentLookupIdentifier = getKenyaPractitionerLookupIdentifier(props.practitioner);
  const syncKey = JSON.stringify({
    id: props.practitioner.id,
    identifier: props.practitioner.identifier,
    extension: props.practitioner.extension,
  });
  const [identificationType, setIdentificationType] = useState<KenyaPractitionerIdentificationType>(
    currentLookupIdentifier?.identificationType ?? 'ID'
  );
  const [identificationNumber, setIdentificationNumber] = useState(currentLookupIdentifier?.identifier.value ?? '');
  const [savedIdentificationType, setSavedIdentificationType] = useState<KenyaPractitionerIdentificationType>(
    currentLookupIdentifier?.identificationType ?? 'ID'
  );
  const [savedIdentificationNumber, setSavedIdentificationNumber] = useState(currentLookupIdentifier?.identifier.value ?? '');
  const [loadedKey, setLoadedKey] = useState(syncKey);
  const [saving, setSaving] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<PractitionerVerificationResult>();
  const practitionerRegistrySnapshot = getKenyaPractitionerRegistrySnapshot(props.practitioner);
  const persistedResult = getKenyaPractitionerVerificationSnapshot(props.practitioner);
  const [registrySnapshotOverride, setRegistrySnapshotOverride] = useState(practitionerRegistrySnapshot);
  const [lookupDebug, setLookupDebug] = useState<KenyaPractitionerLookupDebug | undefined>();
  const [snapshotOverride, setSnapshotOverride] = useState<PractitionerVerificationResult | null>();
  const currentRegistrySnapshot =
    registrySnapshotOverride === undefined ? practitionerRegistrySnapshot : registrySnapshotOverride ?? undefined;
  const currentResult = result ?? (snapshotOverride === undefined ? persistedResult : snapshotOverride ?? undefined);

  if (!props.practitioner.id || countryPack !== 'kenya') {
    return null;
  }

  useEffect(() => {
    if (loadedKey !== syncKey) {
      setIdentificationType(currentLookupIdentifier?.identificationType ?? 'ID');
      setIdentificationNumber(currentLookupIdentifier?.identifier.value ?? '');
      setSavedIdentificationType(currentLookupIdentifier?.identificationType ?? 'ID');
      setSavedIdentificationNumber(currentLookupIdentifier?.identifier.value ?? '');
      setLoadedKey(syncKey);
      setRegistrySnapshotOverride(undefined);
      setLookupDebug(undefined);
      setSnapshotOverride(undefined);
    }
  }, [currentLookupIdentifier?.identificationType, currentLookupIdentifier?.identifier.value, loadedKey, syncKey]);

  async function handleSaveIdentifier(): Promise<void> {
    const trimmedNumber = identificationNumber.trim();
    if (!trimmedNumber) {
      setError('Practitioner identification number is required before verification.');
      return;
    }

    setSaving(true);
    setError(undefined);
    try {
      const updatedPractitioner = clearKenyaPractitionerRegistrySnapshot(
        clearKenyaPractitionerVerificationSnapshot(
          setKenyaPractitionerLookupIdentifier(props.practitioner, identificationType, trimmedNumber)
        )
      );
      const savedPractitioner = await medplum.updateResource(updatedPractitioner);
      setIdentificationNumber(trimmedNumber);
      setSavedIdentificationType(identificationType);
      setSavedIdentificationNumber(trimmedNumber);
      setRegistrySnapshotOverride(getKenyaPractitionerRegistrySnapshot(savedPractitioner));
      setLookupDebug(undefined);
      setResult(undefined);
      setSnapshotOverride(null);
      showNotification({ color: 'green', message: 'Practitioner identification saved' });
    } catch (err) {
      const message = normalizeErrorString(err);
      setError(message);
      showNotification({ color: 'red', message, autoClose: false });
    } finally {
      setSaving(false);
    }
  }

  async function handleLookupPractitioner(): Promise<void> {
    const trimmedNumber = identificationNumber.trim();
    if (!trimmedNumber) {
      setError('Practitioner identification number is required before lookup.');
      return;
    }

    setLookingUp(true);
    setError(undefined);
    try {
      const lookupResult = (await medplum.post(`admin/projects/${project?.id}/kenya/afyalink/practitioner-lookup`, {
        identificationType,
        identificationNumber: trimmedNumber,
      })) as KenyaPractitionerLookupResponse;
      const message = getLookupMessage(lookupResult);
      const lookedUpAt = new Date().toISOString();
      setLookupDebug({
        baseUrl: lookupResult.baseUrl,
        identificationType: lookupResult.identificationType ?? identificationType,
        identificationNumber: lookupResult.identificationNumber ?? trimmedNumber,
        response: lookupResult,
      });

      const updatedPractitioner = applyKenyaPractitionerRegistryToPractitioner(
        clearKenyaPractitionerVerificationSnapshot(props.practitioner),
        {
          identificationType: lookupResult.identificationType ?? identificationType,
          identificationNumber: lookupResult.identificationNumber ?? trimmedNumber,
          registrationNumber:
            message?.registration_number === undefined || message?.registration_number === null
              ? undefined
              : String(message.registration_number),
          found: message?.found,
          isActive: message?.is_active,
        },
        lookedUpAt
      );

      const savedPractitioner = await medplum.updateResource(updatedPractitioner);
      setSavedIdentificationType(identificationType);
      setSavedIdentificationNumber(trimmedNumber);
      setRegistrySnapshotOverride(getKenyaPractitionerRegistrySnapshot(savedPractitioner));
      setResult(undefined);
      setSnapshotOverride(null);

      if (message?.found === 1) {
        showNotification({ color: 'green', message: 'Practitioner details loaded from Kenya HIE' });
      } else {
        showNotification({
          color: 'yellow',
          message: `No Kenya HIE practitioner match found for ${identificationType} ${trimmedNumber}`,
        });
      }
    } catch (err) {
      const message = normalizeErrorString(err);
      setError(message);
      showNotification({ color: 'red', message, autoClose: false });
    } finally {
      setLookingUp(false);
    }
  }

  async function handleVerifyPractitioner(): Promise<void> {
    setVerifying(true);
    setError(undefined);
    try {
      const parameters = (await medplum.post(
        medplum.fhirUrl('Practitioner', props.practitioner.id as string, '$verify-practitioner-authority')
      )) as Parameters;
      const verificationResult = getVerificationResult(parameters);
      setResult(verificationResult);
      setSnapshotOverride(verificationResult);
      showNotification({ color: 'green', message: 'Practitioner verification completed' });
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
          <Title order={3}>Kenya Practitioner Verification</Title>
          <Text size="sm" c="dimmed">
            Runs the Kenya Health Worker Registry verification flow for this practitioner using DHA identification lookup.
          </Text>
        </div>
        <Group>
          <Button
            variant="light"
            onClick={() => handleLookupPractitioner().catch(console.error)}
            loading={lookingUp}
            disabled={!identificationNumber.trim() || saving || verifying}
          >
            Lookup Practitioner
          </Button>
          <Button
            onClick={() => handleVerifyPractitioner().catch(console.error)}
            loading={verifying}
            disabled={
              !savedIdentificationNumber.trim() ||
              saving ||
              lookingUp ||
              identificationNumber.trim() !== savedIdentificationNumber.trim() ||
              identificationType !== savedIdentificationType
            }
          >
            Verify Practitioner
          </Button>
        </Group>
      </Group>
      <Group align="flex-end" grow>
        <NativeSelect
          label="Identification Type"
          data={[
            { value: 'ID', label: 'National ID' },
            { value: 'PASSPORT', label: 'Passport' },
          ]}
          value={identificationType}
          onChange={(event) => setIdentificationType(event.currentTarget.value as KenyaPractitionerIdentificationType)}
        />
        <TextInput
          label="Identification Number"
          description="DHA practitioner lookup uses identification_type and identification_number."
          placeholder={identificationType === 'PASSPORT' ? 'A1234567' : '12345678'}
          value={identificationNumber}
          onChange={(event) => setIdentificationNumber(event.currentTarget.value)}
        />
        <Button
          variant="light"
          onClick={() => handleSaveIdentifier().catch(console.error)}
          loading={saving}
          disabled={
            !identificationNumber.trim() ||
            (identificationNumber.trim() === savedIdentificationNumber.trim() && identificationType === savedIdentificationType)
          }
        >
          Save Identification
        </Button>
      </Group>
      {!identificationNumber.trim() && (
        <Alert color="yellow">Add the practitioner identity document first. Verification stays disabled until it is saved.</Alert>
      )}
      {identificationNumber.trim() &&
        (identificationNumber.trim() !== savedIdentificationNumber.trim() || identificationType !== savedIdentificationType) && (
          <Alert color="blue">Save the practitioner identity document first. Verification always uses the saved Practitioner identifier.</Alert>
        )}
      {error && <Alert color="red">{error}</Alert>}
      {currentRegistrySnapshot && (
        <DescriptionList>
          <DescriptionListEntry term="Identification Type">
            {currentRegistrySnapshot.identificationType ?? 'Not returned'}
          </DescriptionListEntry>
          <DescriptionListEntry term="Identification Number">
            {currentRegistrySnapshot.identificationNumber ?? 'Not returned'}
          </DescriptionListEntry>
          <DescriptionListEntry term="Registry Match">
            {currentRegistrySnapshot.found === true ? 'Found' : 'No match returned'}
          </DescriptionListEntry>
          <DescriptionListEntry term="Registration Number">
            {currentRegistrySnapshot.registrationNumber ?? 'Not returned'}
          </DescriptionListEntry>
          <DescriptionListEntry term="Registry Active Status">
            {getBooleanDisplay(currentRegistrySnapshot.isActive)}
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
          <DescriptionListEntry term="Identification Type">
            {currentResult.identificationType ?? 'Not returned'}
          </DescriptionListEntry>
          <DescriptionListEntry term="Identification Number">
            {currentResult.identificationNumber ?? 'Not returned'}
          </DescriptionListEntry>
          <DescriptionListEntry term="Registration Number">
            {currentResult.registrationNumber ?? 'Not returned'}
          </DescriptionListEntry>
          <DescriptionListEntry term="Authority Identifier">
            {currentResult.practitionerAuthorityIdentifier ?? 'Not returned'}
          </DescriptionListEntry>
          <DescriptionListEntry term="Registry Active Status">
            {currentResult.practitionerActiveStatus ?? 'Not returned'}
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
            Temporary debug output for DHA UAT practitioner lookup troubleshooting.
          </Text>
          <DescriptionList>
            <DescriptionListEntry term="Lookup Base URL">{lookupDebug.baseUrl ?? 'Not returned'}</DescriptionListEntry>
            <DescriptionListEntry term="Identification Type">
              {lookupDebug.identificationType ?? 'Not returned'}
            </DescriptionListEntry>
            <DescriptionListEntry term="Identification Number">
              {lookupDebug.identificationNumber ?? 'Not returned'}
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
