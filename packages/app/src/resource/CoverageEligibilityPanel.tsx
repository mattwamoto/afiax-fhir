// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Alert, Button, Group, NativeSelect, Stack, Text, TextInput, Title } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import {
  clearKenyaCoverageEligibilitySnapshot,
  getKenyaCoverageEligibilityLookupIdentifier,
  getKenyaCoverageEligibilitySnapshot,
  getProjectSettingString,
  normalizeErrorString,
  setKenyaCoverageEligibilityLookupIdentifier,
  type KenyaCoverageEligibilityIdentificationType,
} from '@medplum/core';
import type {
  Coverage,
  CoverageEligibilityRequest,
  CoverageEligibilityResponse,
  Parameters,
  ParametersParameter,
  Reference,
  Task,
} from '@medplum/fhirtypes';
import { DescriptionList, DescriptionListEntry, MedplumLink, useMedplum } from '@medplum/react';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';

interface CoverageCheckResult {
  readonly status?: string;
  readonly correlationId?: string;
  readonly message?: string;
  readonly nextState?: string;
  readonly checkedAt?: string;
  readonly identificationType?: string;
  readonly identificationNumber?: string;
  readonly eligible?: boolean;
  readonly fullName?: string;
  readonly reason?: string;
  readonly possibleSolution?: string;
  readonly coverageEndDate?: string;
  readonly transitionStatus?: string;
  readonly requestId?: string;
  readonly requestIdNumber?: string;
  readonly requestIdType?: string;
  readonly rawResponse?: string;
  readonly eligibilityRequest?: Reference<CoverageEligibilityRequest>;
  readonly eligibilityResponse?: Reference<CoverageEligibilityResponse>;
  readonly task?: Reference<Task>;
}

export interface CoverageEligibilityPanelProps {
  readonly coverage: Coverage;
}

function getParameter(parameters: Parameters | undefined, name: string): ParametersParameter | undefined {
  return parameters?.parameter?.find((param) => param.name === name);
}

function getCheckCoverageResult(parameters: Parameters | undefined): CoverageCheckResult {
  return {
    status: getParameter(parameters, 'status')?.valueCode,
    correlationId: getParameter(parameters, 'correlationId')?.valueString,
    message: getParameter(parameters, 'message')?.valueString,
    nextState: getParameter(parameters, 'nextState')?.valueString,
    identificationType: getParameter(parameters, 'identificationType')?.valueString,
    identificationNumber: getParameter(parameters, 'identificationNumber')?.valueString,
    eligible: getParameter(parameters, 'eligible')?.valueBoolean,
    fullName: getParameter(parameters, 'fullName')?.valueString,
    reason: getParameter(parameters, 'reason')?.valueString,
    possibleSolution: getParameter(parameters, 'possibleSolution')?.valueString,
    coverageEndDate: getParameter(parameters, 'coverageEndDate')?.valueString,
    transitionStatus: getParameter(parameters, 'transitionStatus')?.valueString,
    requestId: getParameter(parameters, 'requestId')?.valueString,
    requestIdNumber: getParameter(parameters, 'requestIdNumber')?.valueString,
    requestIdType: getParameter(parameters, 'requestIdType')?.valueString,
    rawResponse: getParameter(parameters, 'rawResponse')?.valueString,
    eligibilityRequest: getParameter(parameters, 'coverageEligibilityRequest')?.valueReference as
      | Reference<CoverageEligibilityRequest>
      | undefined,
    eligibilityResponse: getParameter(parameters, 'coverageEligibilityResponse')?.valueReference as
      | Reference<CoverageEligibilityResponse>
      | undefined,
    task: getParameter(parameters, 'task')?.valueReference as Reference<Task> | undefined,
  };
}

function getEligibilityDisplay(value: boolean | undefined): string {
  if (value === true) {
    return 'Eligible';
  }
  if (value === false) {
    return 'Ineligible';
  }
  return 'Not returned';
}

export function CoverageEligibilityPanel(props: CoverageEligibilityPanelProps): JSX.Element | null {
  const medplum = useMedplum();
  const project = medplum.getProject();
  const countryPack = getProjectSettingString(project, 'countryPack');
  const currentLookupIdentifier = getKenyaCoverageEligibilityLookupIdentifier(props.coverage);
  const syncKey = JSON.stringify({
    id: props.coverage.id,
    identifier: props.coverage.identifier,
    subscriberId: props.coverage.subscriberId,
    extension: props.coverage.extension,
  });
  const [identificationType, setIdentificationType] = useState<KenyaCoverageEligibilityIdentificationType>(
    currentLookupIdentifier?.identificationType ?? 'National ID'
  );
  const [identificationNumber, setIdentificationNumber] = useState(currentLookupIdentifier?.identifier.value ?? '');
  const [savedIdentificationType, setSavedIdentificationType] = useState<KenyaCoverageEligibilityIdentificationType>(
    currentLookupIdentifier?.identificationType ?? 'National ID'
  );
  const [savedIdentificationNumber, setSavedIdentificationNumber] = useState(currentLookupIdentifier?.identifier.value ?? '');
  const [loadedKey, setLoadedKey] = useState(syncKey);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<CoverageCheckResult>();
  const persistedResult = getKenyaCoverageEligibilitySnapshot(props.coverage);
  const [snapshotOverride, setSnapshotOverride] = useState<CoverageCheckResult | null>();
  const currentResult = result ?? (snapshotOverride === undefined ? persistedResult : snapshotOverride ?? undefined);

  if (!props.coverage.id || countryPack !== 'kenya') {
    return null;
  }

  useEffect(() => {
    if (loadedKey !== syncKey) {
      setIdentificationType(currentLookupIdentifier?.identificationType ?? 'National ID');
      setIdentificationNumber(currentLookupIdentifier?.identifier.value ?? '');
      setSavedIdentificationType(currentLookupIdentifier?.identificationType ?? 'National ID');
      setSavedIdentificationNumber(currentLookupIdentifier?.identifier.value ?? '');
      setLoadedKey(syncKey);
      setSnapshotOverride(undefined);
    }
  }, [currentLookupIdentifier?.identificationType, currentLookupIdentifier?.identifier.value, loadedKey, syncKey]);

  async function handleSaveIdentifier(): Promise<void> {
    const trimmedNumber = identificationNumber.trim();
    if (!trimmedNumber) {
      setError('Eligibility lookup number is required before coverage checks.');
      return;
    }

    setSaving(true);
    setError(undefined);
    try {
      const updatedCoverage = clearKenyaCoverageEligibilitySnapshot(
        setKenyaCoverageEligibilityLookupIdentifier(props.coverage, identificationType, trimmedNumber)
      );
      const savedCoverage = await medplum.updateResource(updatedCoverage);
      setIdentificationNumber(trimmedNumber);
      setSavedIdentificationType(identificationType);
      setSavedIdentificationNumber(trimmedNumber);
      setResult(undefined);
      setSnapshotOverride(getKenyaCoverageEligibilitySnapshot(savedCoverage) ?? null);
      showNotification({ color: 'green', message: 'Coverage eligibility lookup saved' });
    } catch (err) {
      const message = normalizeErrorString(err);
      setError(message);
      showNotification({ color: 'red', message, autoClose: false });
    } finally {
      setSaving(false);
    }
  }

  async function handleCheckCoverage(): Promise<void> {
    setChecking(true);
    setError(undefined);
    try {
      const parameters = (await medplum.post(
        medplum.fhirUrl('Coverage', props.coverage.id as string, '$check-coverage')
      )) as Parameters;
      const coverageResult = getCheckCoverageResult(parameters);
      setResult(coverageResult);
      setSnapshotOverride(coverageResult);
      showNotification({ color: 'green', message: 'Coverage eligibility check completed' });
    } catch (err) {
      const message = normalizeErrorString(err);
      setError(message);
      showNotification({ color: 'red', message, autoClose: false });
    } finally {
      setChecking(false);
    }
  }

  return (
    <Stack gap="sm" mb="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={3}>Kenya Coverage Eligibility</Title>
          <Text size="sm" c="dimmed">
            Runs the DHA eligibility flow for this coverage and records the result on the resource.
          </Text>
        </div>
        <Button
          onClick={() => handleCheckCoverage().catch(console.error)}
          loading={checking}
          disabled={
            !savedIdentificationNumber.trim() ||
            saving ||
            checking ||
            identificationNumber.trim() !== savedIdentificationNumber.trim() ||
            identificationType !== savedIdentificationType
          }
        >
          Check Coverage
        </Button>
      </Group>
      <Group align="flex-end" grow>
        <NativeSelect
          label="Eligibility Identification Type"
          data={[
            'National ID',
            'Alien ID',
            'Mandate Number',
            'Temporary ID',
            'SHA Number',
            'Refugee ID',
          ]}
          value={identificationType}
          onChange={(event) => setIdentificationType(event.currentTarget.value as KenyaCoverageEligibilityIdentificationType)}
        />
        <TextInput
          label="Eligibility Identification Number"
          description="DHA eligibility uses identification_type and identification_number."
          placeholder="12345678"
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
          Save Eligibility Lookup
        </Button>
      </Group>
      {!identificationNumber.trim() && (
        <Alert color="yellow">Add the DHA eligibility lookup identifier first. Coverage checks stay disabled until it is saved.</Alert>
      )}
      {identificationNumber.trim() &&
        (identificationNumber.trim() !== savedIdentificationNumber.trim() || identificationType !== savedIdentificationType) && (
          <Alert color="blue">Save the eligibility lookup first. Coverage checks always use the saved Coverage identifier.</Alert>
        )}
      {error && <Alert color="red">{error}</Alert>}
      {currentResult?.status && (
        <>
          <DescriptionList>
            <DescriptionListEntry term="Status">{currentResult.status}</DescriptionListEntry>
            <DescriptionListEntry term="Eligibility">{getEligibilityDisplay(currentResult.eligible)}</DescriptionListEntry>
            <DescriptionListEntry term="Message">{currentResult.message ?? 'No message returned'}</DescriptionListEntry>
            <DescriptionListEntry term="Next State">{currentResult.nextState ?? 'Not provided'}</DescriptionListEntry>
            <DescriptionListEntry term="Correlation ID">{currentResult.correlationId ?? 'Not provided'}</DescriptionListEntry>
            <DescriptionListEntry term="Identification Type">
              {currentResult.identificationType ?? 'Not returned'}
            </DescriptionListEntry>
            <DescriptionListEntry term="Identification Number">
              {currentResult.identificationNumber ?? 'Not returned'}
            </DescriptionListEntry>
            <DescriptionListEntry term="Full Name">{currentResult.fullName ?? 'Not returned'}</DescriptionListEntry>
            <DescriptionListEntry term="Reason">{currentResult.reason ?? 'Not returned'}</DescriptionListEntry>
            <DescriptionListEntry term="Possible Solution">
              {currentResult.possibleSolution ?? 'Not returned'}
            </DescriptionListEntry>
            <DescriptionListEntry term="Coverage End Date">
              {currentResult.coverageEndDate ?? 'Not returned'}
            </DescriptionListEntry>
            <DescriptionListEntry term="Transition Status">
              {currentResult.transitionStatus ?? 'Not returned'}
            </DescriptionListEntry>
            <DescriptionListEntry term="DHA Request ID">{currentResult.requestId ?? 'Not returned'}</DescriptionListEntry>
            <DescriptionListEntry term="Request ID Type">
              {currentResult.requestIdType ?? 'Not returned'}
            </DescriptionListEntry>
            <DescriptionListEntry term="Request ID Number">
              {currentResult.requestIdNumber ?? 'Not returned'}
            </DescriptionListEntry>
            <DescriptionListEntry term="Checked At">
              {currentResult.checkedAt ?? 'Not returned'}
            </DescriptionListEntry>
            <DescriptionListEntry term="Eligibility Request">
              {currentResult.eligibilityRequest?.reference ? (
                <MedplumLink to={`/${currentResult.eligibilityRequest.reference}`}>
                  {currentResult.eligibilityRequest.reference}
                </MedplumLink>
              ) : (
                'Not returned'
              )}
            </DescriptionListEntry>
            <DescriptionListEntry term="Eligibility Response">
              {currentResult.eligibilityResponse?.reference ? (
                <MedplumLink to={`/${currentResult.eligibilityResponse.reference}`}>
                  {currentResult.eligibilityResponse.reference}
                </MedplumLink>
              ) : (
                'Not returned'
              )}
            </DescriptionListEntry>
            <DescriptionListEntry term="Task">
              {currentResult.task?.reference ? (
                <MedplumLink to={`/${currentResult.task.reference}`}>{currentResult.task.reference}</MedplumLink>
              ) : (
                'Not returned'
              )}
            </DescriptionListEntry>
          </DescriptionList>
          {result?.rawResponse && (
            <Stack gap={4}>
              <Title order={5}>Raw Kenya HIE Response</Title>
              <Text size="sm" c="dimmed">
                Temporary debug output for DHA eligibility troubleshooting.
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
                {result.rawResponse}
              </Text>
            </Stack>
          )}
        </>
      )}
    </Stack>
  );
}
