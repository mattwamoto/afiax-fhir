// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Alert, Button, Group, Stack, Text, Title } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import {
  getKenyaNationalClaimSubmissionSnapshot,
  getKenyaNationalClaimStatusSnapshot,
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
  readonly statusTrackingEndpoint?: string;
  readonly responseStatusCode?: number;
  readonly bundleId?: string;
  readonly bundleEntryCount?: number;
  readonly rawBundle?: string;
  readonly rawResponse?: string;
  readonly workflowBot?: string;
  readonly workflowBotStatus?: string;
  readonly workflowBotMessage?: string;
  readonly task?: Reference<Task>;
}

interface ClaimStatusResult {
  readonly status?: string;
  readonly correlationId?: string;
  readonly message?: string;
  readonly nextState?: string;
  readonly checkedAt?: string;
  readonly shaClaimsEnvironment?: string;
  readonly statusEndpoint?: string;
  readonly responseStatusCode?: number;
  readonly claimId?: string;
  readonly claimState?: string;
  readonly rawResponse?: string;
  readonly claimResponse?: Reference;
  readonly workflowBot?: string;
  readonly workflowBotStatus?: string;
  readonly workflowBotMessage?: string;
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
    statusTrackingEndpoint: getParameter(parameters, 'statusTrackingEndpoint')?.valueString,
    responseStatusCode: getParameter(parameters, 'responseStatusCode')?.valueInteger,
    bundleId: getParameter(parameters, 'bundleId')?.valueString,
    bundleEntryCount: getParameter(parameters, 'bundleEntryCount')?.valueInteger,
    rawBundle: getParameter(parameters, 'rawBundle')?.valueString,
    rawResponse: getParameter(parameters, 'rawResponse')?.valueString,
    workflowBot: getParameter(parameters, 'workflowBot')?.valueString,
    workflowBotStatus: getParameter(parameters, 'workflowBotStatus')?.valueCode,
    workflowBotMessage: getParameter(parameters, 'workflowBotMessage')?.valueString,
    task: getParameter(parameters, 'task')?.valueReference as Reference<Task> | undefined,
  };
}

function getClaimStatusResult(parameters: Parameters | undefined): ClaimStatusResult {
  return {
    status: getParameter(parameters, 'status')?.valueCode,
    correlationId: getParameter(parameters, 'correlationId')?.valueString,
    message: getParameter(parameters, 'message')?.valueString,
    nextState: getParameter(parameters, 'nextState')?.valueString,
    shaClaimsEnvironment: getParameter(parameters, 'shaClaimsEnvironment')?.valueString,
    statusEndpoint: getParameter(parameters, 'statusEndpoint')?.valueString,
    responseStatusCode: getParameter(parameters, 'responseStatusCode')?.valueInteger,
    claimId: getParameter(parameters, 'claimId')?.valueString,
    claimState: getParameter(parameters, 'claimState')?.valueString,
    rawResponse: getParameter(parameters, 'rawResponse')?.valueString,
    claimResponse: getParameter(parameters, 'claimResponse')?.valueReference as Reference | undefined,
    workflowBot: getParameter(parameters, 'workflowBot')?.valueString,
    workflowBotStatus: getParameter(parameters, 'workflowBotStatus')?.valueCode,
    workflowBotMessage: getParameter(parameters, 'workflowBotMessage')?.valueString,
    task: getParameter(parameters, 'task')?.valueReference as Reference<Task> | undefined,
  };
}

export function ClaimNationalSubmissionPanel(props: ClaimNationalSubmissionPanelProps): JSX.Element | null {
  const medplum = useMedplum();
  const project = medplum.getProject();
  const countryPack = getProjectSettingString(project, 'countryPack');
  const kenyaShaClaimsEnvironment = getKenyaShaClaimsEnvironment(project);
  const persistedSubmissionResult = getKenyaNationalClaimSubmissionSnapshot(props.claim);
  const persistedStatusResult = getKenyaNationalClaimStatusSnapshot(props.claim);
  const [submitting, setSubmitting] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [error, setError] = useState<string>();
  const [submissionResult, setSubmissionResult] = useState<ClaimSubmissionResult>();
  const [statusResult, setStatusResult] = useState<ClaimStatusResult>();
  const currentSubmissionResult = submissionResult ?? persistedSubmissionResult;
  const currentStatusResult = statusResult ?? persistedStatusResult;
  const canCheckStatus = !!currentSubmissionResult?.bundleId;

  if (!props.claim.id || countryPack !== 'kenya') {
    return null;
  }

  async function handleSubmitClaim(): Promise<void> {
    setSubmitting(true);
    setError(undefined);
    try {
      const parameters = (await medplum.post(
        medplum.fhirUrl('Claim', props.claim.id as string, '$submit-national-claim')
      )) as Parameters;
      const claimResult = getClaimSubmissionResult(parameters);
      setSubmissionResult(claimResult);
      showNotification({
        color: claimResult.status === 'submitted' ? 'green' : claimResult.status === 'error' ? 'red' : 'green',
        message:
          claimResult.status === 'submitted'
            ? 'Kenya SHA claim submitted'
            : claimResult.status === 'error'
              ? (claimResult.message ?? 'Kenya SHA claim submission failed')
              : 'Kenya SHA claim bundle prepared',
        autoClose: claimResult.status === 'error' ? false : undefined,
      });
    } catch (err) {
      const message = normalizeErrorString(err);
      setError(message);
      showNotification({ color: 'red', message, autoClose: false });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCheckClaimStatus(): Promise<void> {
    setCheckingStatus(true);
    setError(undefined);
    try {
      const parameters = (await medplum.post(
        medplum.fhirUrl('Claim', props.claim.id as string, '$check-national-claim-status')
      )) as Parameters;
      const claimStatusResult = getClaimStatusResult(parameters);
      setStatusResult(claimStatusResult);
      showNotification({
        color:
          claimStatusResult.status === 'adjudicated'
            ? 'green'
            : claimStatusResult.status === 'rejected'
              ? 'yellow'
              : claimStatusResult.status === 'error'
                ? 'red'
                : 'blue',
        message:
          claimStatusResult.message ??
          (claimStatusResult.status === 'adjudicated'
            ? 'Kenya SHA claim adjudicated'
            : claimStatusResult.status === 'rejected'
              ? 'Kenya SHA claim rejected'
              : 'Kenya SHA claim status updated'),
        autoClose: claimStatusResult.status === 'error' ? false : undefined,
      });
    } catch (err) {
      const message = normalizeErrorString(err);
      setError(message);
      showNotification({ color: 'red', message, autoClose: false });
    } finally {
      setCheckingStatus(false);
    }
  }

  return (
    <Stack gap="sm" mb="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={3}>Kenya National Claim Submission</Title>
          <Text size="sm" c="dimmed">
            Builds the Kenya SHA claim bundle from this Claim and submits it when Kenya SHA credentials are configured.
          </Text>
        </div>
        <Group>
          <Button variant="default" onClick={() => handleCheckClaimStatus().catch(console.error)} loading={checkingStatus} disabled={!canCheckStatus}>
            Check Kenya SHA Claim Status
          </Button>
          <Button onClick={() => handleSubmitClaim().catch(console.error)} loading={submitting}>
            Submit Kenya SHA Claim
          </Button>
        </Group>
      </Group>
      <Alert color="blue">
        SHA claims use the <strong>{kenyaShaClaimsEnvironment === 'production' ? 'production' : 'UAT'}</strong> claims
        environment. This panel builds the DHA-style claim bundle, submits it when SHA credentials are configured, and
        records workflow evidence on the Claim.
      </Alert>
      {!canCheckStatus && (
        <Alert color="yellow">
          Submit or prepare the Kenya SHA claim bundle first. Status checks become available after a bundle ID is
          recorded on the Claim.
        </Alert>
      )}
      {error && <Alert color="red">{error}</Alert>}
      {currentSubmissionResult?.status && (
        <>
          <Title order={4}>Submission</Title>
          <DescriptionList>
            <DescriptionListEntry term="Status">{currentSubmissionResult.status}</DescriptionListEntry>
            <DescriptionListEntry term="Message">
              {currentSubmissionResult.message ?? 'No message returned'}
            </DescriptionListEntry>
            <DescriptionListEntry term="Next State">
              {currentSubmissionResult.nextState ?? 'Not provided'}
            </DescriptionListEntry>
            <DescriptionListEntry term="Correlation ID">
              {currentSubmissionResult.correlationId ?? 'Not provided'}
            </DescriptionListEntry>
            <DescriptionListEntry term="SHA Claims Environment">
              {currentSubmissionResult.shaClaimsEnvironment ?? kenyaShaClaimsEnvironment}
            </DescriptionListEntry>
            <DescriptionListEntry term="Submission Endpoint">
              {currentSubmissionResult.submissionEndpoint ?? 'Not provided'}
            </DescriptionListEntry>
            <DescriptionListEntry term="Status Tracking Endpoint">
              {currentSubmissionResult.statusTrackingEndpoint ?? 'Not provided'}
            </DescriptionListEntry>
            <DescriptionListEntry term="Response Status Code">
              {currentSubmissionResult.responseStatusCode ?? 'Not provided'}
            </DescriptionListEntry>
            <DescriptionListEntry term="Bundle ID">
              {currentSubmissionResult.bundleId ?? 'Not provided'}
            </DescriptionListEntry>
            <DescriptionListEntry term="Bundle Entry Count">
              {currentSubmissionResult.bundleEntryCount ?? 'Not provided'}
            </DescriptionListEntry>
            <DescriptionListEntry term="Workflow Bot">
              {currentSubmissionResult.workflowBot ?? 'Not configured'}
            </DescriptionListEntry>
            <DescriptionListEntry term="Workflow Bot Status">
              {currentSubmissionResult.workflowBotStatus ?? 'Not triggered'}
            </DescriptionListEntry>
            <DescriptionListEntry term="Workflow Bot Message">
              {currentSubmissionResult.workflowBotMessage ?? 'Not provided'}
            </DescriptionListEntry>
            <DescriptionListEntry term="Task">
              {currentSubmissionResult.task ? (
                <MedplumLink to={currentSubmissionResult.task.reference as string}>
                  {currentSubmissionResult.task.reference as string}
                </MedplumLink>
              ) : (
                'Not created'
              )}
            </DescriptionListEntry>
          </DescriptionList>
          {submissionResult?.rawResponse && (
            <Alert color="gray" title="Raw Kenya SHA Response">
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{submissionResult.rawResponse}</pre>
            </Alert>
          )}
          {submissionResult?.rawBundle && (
            <Alert color="gray" title="Raw Kenya SHA Claim Bundle">
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{submissionResult.rawBundle}</pre>
            </Alert>
          )}
        </>
      )}
      {currentStatusResult?.status && (
        <>
          <Title order={4}>Current Claim Status</Title>
          <DescriptionList>
            <DescriptionListEntry term="Status">{currentStatusResult.status}</DescriptionListEntry>
            <DescriptionListEntry term="Message">{currentStatusResult.message ?? 'No message returned'}</DescriptionListEntry>
            <DescriptionListEntry term="Next State">{currentStatusResult.nextState ?? 'Not provided'}</DescriptionListEntry>
            <DescriptionListEntry term="Checked At">{currentStatusResult.checkedAt ?? 'Not provided'}</DescriptionListEntry>
            <DescriptionListEntry term="Correlation ID">
              {currentStatusResult.correlationId ?? 'Not provided'}
            </DescriptionListEntry>
            <DescriptionListEntry term="SHA Claims Environment">
              {currentStatusResult.shaClaimsEnvironment ?? kenyaShaClaimsEnvironment}
            </DescriptionListEntry>
            <DescriptionListEntry term="Status Endpoint">
              {currentStatusResult.statusEndpoint ?? 'Not provided'}
            </DescriptionListEntry>
            <DescriptionListEntry term="Response Status Code">
              {currentStatusResult.responseStatusCode ?? 'Not provided'}
            </DescriptionListEntry>
            <DescriptionListEntry term="Claim ID">{currentStatusResult.claimId ?? 'Not provided'}</DescriptionListEntry>
            <DescriptionListEntry term="Claim State">
              {currentStatusResult.claimState ?? 'Not provided'}
            </DescriptionListEntry>
            <DescriptionListEntry term="Claim Response">
              {currentStatusResult.claimResponse?.reference ? (
                <MedplumLink to={currentStatusResult.claimResponse.reference}>
                  {currentStatusResult.claimResponse.reference}
                </MedplumLink>
              ) : (
                'Not created'
              )}
            </DescriptionListEntry>
            <DescriptionListEntry term="Workflow Bot">
              {currentStatusResult.workflowBot ?? 'Not configured'}
            </DescriptionListEntry>
            <DescriptionListEntry term="Workflow Bot Status">
              {currentStatusResult.workflowBotStatus ?? 'Not triggered'}
            </DescriptionListEntry>
            <DescriptionListEntry term="Workflow Bot Message">
              {currentStatusResult.workflowBotMessage ?? 'Not provided'}
            </DescriptionListEntry>
            <DescriptionListEntry term="Task">
              {currentStatusResult.task?.reference ? (
                <MedplumLink to={currentStatusResult.task.reference}>{currentStatusResult.task.reference}</MedplumLink>
              ) : (
                'Not created'
              )}
            </DescriptionListEntry>
          </DescriptionList>
          {statusResult?.rawResponse && (
            <Alert color="gray" title="Raw Kenya SHA Claim Status Response">
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{statusResult.rawResponse}</pre>
            </Alert>
          )}
        </>
      )}
    </Stack>
  );
}
