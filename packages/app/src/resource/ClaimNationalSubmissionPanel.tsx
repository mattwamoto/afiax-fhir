// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Alert, Button, Group, Stack, Text, Title } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import {
  getKenyaNationalClaimSubmissionSnapshot,
  getKenyaShaClaimsEnvironment,
  getProjectSettingString,
  normalizeErrorString,
} from '@medplum/core';
import type { Claim, Parameters, ParametersParameter, Reference, Task } from '@medplum/fhirtypes';
import { DescriptionList, DescriptionListEntry, MedplumLink, useMedplum } from '@medplum/react';
import type { JSX } from 'react';
import { useState } from 'react';

interface ClaimSubmissionResult {
  readonly status?: string;
  readonly correlationId?: string;
  readonly message?: string;
  readonly nextState?: string;
  readonly shaClaimsEnvironment?: string;
  readonly submissionEndpoint?: string;
  readonly bundleId?: string;
  readonly bundleEntryCount?: number;
  readonly rawBundle?: string;
  readonly task?: Reference<Task>;
}

export interface ClaimNationalSubmissionPanelProps {
  readonly claim: Claim;
}

function getParameter(parameters: Parameters | undefined, name: string): ParametersParameter | undefined {
  return parameters?.parameter?.find((param) => param.name === name);
}

function getClaimSubmissionResult(parameters: Parameters | undefined): ClaimSubmissionResult {
  return {
    status: getParameter(parameters, 'status')?.valueCode,
    correlationId: getParameter(parameters, 'correlationId')?.valueString,
    message: getParameter(parameters, 'message')?.valueString,
    nextState: getParameter(parameters, 'nextState')?.valueString,
    shaClaimsEnvironment: getParameter(parameters, 'shaClaimsEnvironment')?.valueString,
    submissionEndpoint: getParameter(parameters, 'submissionEndpoint')?.valueString,
    bundleId: getParameter(parameters, 'bundleId')?.valueString,
    bundleEntryCount: getParameter(parameters, 'bundleEntryCount')?.valueInteger,
    rawBundle: getParameter(parameters, 'rawBundle')?.valueString,
    task: getParameter(parameters, 'task')?.valueReference as Reference<Task> | undefined,
  };
}

export function ClaimNationalSubmissionPanel(props: ClaimNationalSubmissionPanelProps): JSX.Element | null {
  const medplum = useMedplum();
  const project = medplum.getProject();
  const countryPack = getProjectSettingString(project, 'countryPack');
  const kenyaShaClaimsEnvironment = getKenyaShaClaimsEnvironment(project);
  const persistedResult = getKenyaNationalClaimSubmissionSnapshot(props.claim);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<ClaimSubmissionResult>();
  const currentResult = result ?? persistedResult;

  if (!props.claim.id || countryPack !== 'kenya') {
    return null;
  }

  async function handlePrepareClaim(): Promise<void> {
    setSubmitting(true);
    setError(undefined);
    try {
      const parameters = (await medplum.post(
        medplum.fhirUrl('Claim', props.claim.id as string, '$submit-national-claim')
      )) as Parameters;
      const claimResult = getClaimSubmissionResult(parameters);
      setResult(claimResult);
      showNotification({ color: 'green', message: 'Kenya SHA claim bundle prepared' });
    } catch (err) {
      const message = normalizeErrorString(err);
      setError(message);
      showNotification({ color: 'red', message, autoClose: false });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Stack gap="sm" mb="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={3}>Kenya National Claim Submission</Title>
          <Text size="sm" c="dimmed">
            Builds the Kenya SHA claim bundle from this Claim and its linked Medplum resources.
          </Text>
        </div>
        <Button onClick={() => handlePrepareClaim().catch(console.error)} loading={submitting}>
          Prepare Kenya SHA Claim
        </Button>
      </Group>
      <Alert color="blue">
        SHA claims use the <strong>{kenyaShaClaimsEnvironment === 'production' ? 'production' : 'UAT'}</strong> claims
        environment. This panel prepares the DHA-style claim bundle and records workflow evidence on the Claim.
      </Alert>
      {error && <Alert color="red">{error}</Alert>}
      {currentResult?.status && (
        <>
          <DescriptionList>
            <DescriptionListEntry term="Status">{currentResult.status}</DescriptionListEntry>
            <DescriptionListEntry term="Message">{currentResult.message ?? 'No message returned'}</DescriptionListEntry>
            <DescriptionListEntry term="Next State">{currentResult.nextState ?? 'Not provided'}</DescriptionListEntry>
            <DescriptionListEntry term="Correlation ID">
              {currentResult.correlationId ?? 'Not provided'}
            </DescriptionListEntry>
            <DescriptionListEntry term="SHA Claims Environment">
              {currentResult.shaClaimsEnvironment ?? kenyaShaClaimsEnvironment}
            </DescriptionListEntry>
            <DescriptionListEntry term="Submission Endpoint">
              {currentResult.submissionEndpoint ?? 'Not provided'}
            </DescriptionListEntry>
            <DescriptionListEntry term="Bundle ID">{currentResult.bundleId ?? 'Not provided'}</DescriptionListEntry>
            <DescriptionListEntry term="Bundle Entry Count">
              {currentResult.bundleEntryCount ?? 'Not provided'}
            </DescriptionListEntry>
            <DescriptionListEntry term="Task">
              {currentResult.task ? (
                <MedplumLink to={currentResult.task.reference as string}>
                  {currentResult.task.reference as string}
                </MedplumLink>
              ) : (
                'Not created'
              )}
            </DescriptionListEntry>
          </DescriptionList>
          {result?.rawBundle && (
            <Alert color="gray" title="Raw Kenya SHA Claim Bundle">
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{result.rawBundle}</pre>
            </Alert>
          )}
        </>
      )}
    </Stack>
  );
}
