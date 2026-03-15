// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { MockClient } from '@medplum/mock';
import { MedplumProvider } from '@medplum/react-hooks';
import type { JSX } from 'react';
import { act, fireEvent, render, screen, waitFor } from '../test-utils/render';
import { NewProjectForm } from './NewProjectForm';

describe('NewProjectForm', () => {
  function setup(ui: JSX.Element): void {
    render(ui, ({ children }) => <MedplumProvider medplum={new MockClient()}>{children}</MedplumProvider>);
  }

  test('renders country pack choices', async () => {
    setup(<NewProjectForm login="test-login" handleAuthResponse={jest.fn()} />);

    expect(screen.getByLabelText('Project Name', { exact: false })).toBeInTheDocument();
    expect(screen.getByLabelText('Country Pack', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Kenya')).toBeInTheDocument();
    expect(screen.getByText('Uganda (Placeholder)')).toBeInTheDocument();
  });

  test('submits selected country pack', async () => {
    const medplum = new MockClient();
    medplum.startNewProject = jest.fn(async () => ({ login: 'test-login', code: 'test-code' }));
    const handleAuthResponse = jest.fn();

    render(<NewProjectForm login="test-login" handleAuthResponse={handleAuthResponse} />, ({ children }) => (
      <MedplumProvider medplum={medplum}>{children}</MedplumProvider>
    ));

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Project Name', { exact: false }), { target: { value: 'Afiax Kenya' } });
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Country Pack', { exact: false }), { target: { value: 'kenya' } });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Create Project' }));
    });

    await waitFor(() =>
      expect(medplum.startNewProject).toHaveBeenCalledWith({
        login: 'test-login',
        projectName: 'Afiax Kenya',
        countryPack: 'kenya',
      })
    );
    expect(handleAuthResponse).toHaveBeenCalledWith({ login: 'test-login', code: 'test-code' });
  });
});
