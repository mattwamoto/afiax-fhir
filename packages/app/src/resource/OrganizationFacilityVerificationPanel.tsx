// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Alert, Button, Group, Stack, Text, Title } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { getProjectSettingString, normalizeErrorString } from '@medplum/core';
import type { Organization, Parameters, ParametersParameter, Reference, Task } from '@medplum/fhirtypes';
import { DescriptionList, DescriptionListEntry, MedplumLink, useMedplum } from '@medplum/react';
import type { JSX } from 'react';
import { useState } from 'react';

interface FacilityVerificationResult {
  readonly status?: string;
  readonly correlationId?: string;
  readonly message?: string;
  readonly nextState?: string;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<FacilityVerificationResult>();

  if (!props.organization.id || countryPack !== 'kenya') {
    return null;
  }

  async function handleVerifyFacility(): Promise<void> {
    setLoading(true);
    setError(undefined);
    try {
      const parameters = (await medplum.post(
        medplum.fhirUrl('Organization', props.organization.id as string, '$verify-facility-authority')
      )) as Parameters;
      setResult(getVerificationResult(parameters));
      showNotification({ color: 'green', message: 'Facility verification completed' });
    } catch (err) {
      const message = normalizeErrorString(err);
      setError(message);
      showNotification({ color: 'red', message, autoClose: false });
    } finally {
      setLoading(false);
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
        <Button onClick={() => handleVerifyFacility().catch(console.error)} loading={loading}>
          Verify Facility
        </Button>
      </Group>
      {error && <Alert color="red">{error}</Alert>}
      {result?.status && (
        <DescriptionList>
          <DescriptionListEntry term="Status">{result.status}</DescriptionListEntry>
          <DescriptionListEntry term="Message">{result.message ?? 'No message returned'}</DescriptionListEntry>
          <DescriptionListEntry term="Next State">{result.nextState ?? 'Not provided'}</DescriptionListEntry>
          <DescriptionListEntry term="Correlation ID">{result.correlationId ?? 'Not provided'}</DescriptionListEntry>
          <DescriptionListEntry term="Facility Identifier">
            {result.facilityAuthorityIdentifier ?? 'Not returned'}
          </DescriptionListEntry>
          <DescriptionListEntry term="Approval Status">
            {result.facilityApprovalStatus ?? 'Not returned'}
          </DescriptionListEntry>
          <DescriptionListEntry term="Operational Status">
            {result.facilityOperationalStatus ?? 'Not returned'}
          </DescriptionListEntry>
          <DescriptionListEntry term="License Expiry">
            {result.currentLicenseExpiryDate ?? 'Not returned'}
          </DescriptionListEntry>
          <DescriptionListEntry term="Task">
            {result.task?.reference ? <MedplumLink to={`/${result.task.reference}`}>{result.task.reference}</MedplumLink> : 'Not returned'}
          </DescriptionListEntry>
        </DescriptionList>
      )}
    </Stack>
  );
}
