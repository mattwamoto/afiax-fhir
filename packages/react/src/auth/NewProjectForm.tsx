// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Anchor, Flex, NativeSelect, Stack, Text, TextInput, Title } from '@mantine/core';
import type { LoginAuthenticationResponse } from '@medplum/core';
import { formatCountryPackLabel, getCountryPackCatalog, normalizeOperationOutcome } from '@medplum/core';
import type { OperationOutcome } from '@medplum/fhirtypes';
import { useMedplum } from '@medplum/react-hooks';
import type { JSX } from 'react';
import { useState } from 'react';
import { Form } from '../Form/Form';
import { SubmitButton } from '../Form/SubmitButton';
import { Logo } from '../Logo/Logo';
import { OperationOutcomeAlert } from '../OperationOutcomeAlert/OperationOutcomeAlert';
import { getErrorsForInput, getIssuesForExpression } from '../utils/outcomes';

export interface NewProjectFormProps {
  readonly login: string;
  readonly handleAuthResponse: (response: LoginAuthenticationResponse) => void;
}

export function NewProjectForm(props: NewProjectFormProps): JSX.Element {
  const medplum = useMedplum();
  const [outcome, setOutcome] = useState<OperationOutcome | undefined>();
  const issues = getIssuesForExpression(outcome, undefined);
  const countryPackOptions = [
    { value: '', label: 'Core / No Country Pack' },
    ...getCountryPackCatalog().map((entry) => ({
      value: entry.id,
      label: formatCountryPackLabel(entry),
    })),
  ];

  return (
    <Form
      onSubmit={async (formData: Record<string, string>) => {
        try {
          props.handleAuthResponse(
            await medplum.startNewProject({
              login: props.login,
              projectName: formData.projectName,
              countryPack: formData.countryPack || undefined,
            })
          );
        } catch (err) {
          setOutcome(normalizeOperationOutcome(err));
        }
      }}
    >
      <Flex direction="column" align="center" justify="center">
        <Logo size={32} />
        <Title order={3} py="lg">
          Create a new project
        </Title>
      </Flex>
      <OperationOutcomeAlert issues={issues} mb="lg" />
      <Stack gap="sm">
        <TextInput
          name="projectName"
          label="Project Name"
          placeholder="My Project"
          required={true}
          autoFocus={true}
          error={getErrorsForInput(outcome, 'projectName')}
        />
        <NativeSelect
          name="countryPack"
          label="Country Pack"
          description="Kenya is live now. Other East Africa and COMESA entries are placeholders for upcoming country packs."
          data={countryPackOptions}
          defaultValue=""
        />
      </Stack>
      <Stack gap="xs" mt="md">
        <SubmitButton fullWidth>Create Project</SubmitButton>
        <Text c="dimmed" size="xs" pt="lg" ta="center">
          By clicking "Create Project" you agree to the Afiax Connected Healthcare{' '}
          <Anchor href="https://www.afiax.africa/privacy">Privacy&nbsp;Policy</Anchor>
          {' and '}
          <Anchor href="https://www.afiax.africa/terms">Terms&nbsp;of&nbsp;Service</Anchor>.
        </Text>
      </Stack>
    </Form>
  );
}
