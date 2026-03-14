// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { WithId } from '@medplum/core';
import type { Bot, ProjectMembership } from '@medplum/fhirtypes';
import fetch from 'node-fetch';
import { randomUUID } from 'node:crypto';
import { loadTestConfig } from '../../config/loader';
import type { MedplumServerConfig } from '../../config/types';
import { executeFissionBot } from './execute';

jest.mock('node-fetch');

describe('Execute Fission bots', () => {
  let config: MedplumServerConfig;
  const accessToken = 'access-token';

  beforeAll(async () => {
    config = await loadTestConfig();
    config.fission = {
      namespace: 'default',
      fieldManager: 'medplum-fission-example',
      environmentName: 'nodejs',
      routerHost: 'localhost',
      routerPort: 31314,
    };
  });

  beforeEach(() => {
    (fetch as unknown as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Success', async () => {
    const bot: WithId<Bot> = {
      resourceType: 'Bot',
      id: randomUUID(),
      name: 'Test Bot',
      runtimeVersion: 'fission',
    };

    (fetch as unknown as jest.Mock).mockImplementationOnce(() => ({
      status: 200,
      ok: true,
      text: jest.fn(async () =>
        JSON.stringify({ success: true, logResult: '', returnValue: { result: 'test result' } })
      ),
    }));

    await expect(
      executeFissionBot({
        bot,
        runAs: {} as WithId<ProjectMembership>,
        accessToken,
        project: {
          reference: { reference: 'Project/123' },
          countryPack: 'kenya',
          settings: {},
        },
        input: 'test input',
        contentType: 'text/plain',
        secrets: {},
        traceId: randomUUID(),
        headers: {},
      })
    ).resolves.toMatchObject({
      success: true,
      returnValue: { result: 'test result' },
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`bot-${bot.id}`),
      expect.objectContaining({ method: 'POST' })
    );
  });

  test('Error', async () => {
    const bot: WithId<Bot> = {
      resourceType: 'Bot',
      id: randomUUID(),
      name: 'Test Bot',
      runtimeVersion: 'fission',
    };

    (fetch as unknown as jest.Mock).mockImplementationOnce(() => ({
      status: 400,
      ok: false,
      text: jest.fn(async () =>
        JSON.stringify({ success: false, logResult: 'unhandled error', returnValue: { result: 'unhandled error' } })
      ),
    }));

    await expect(
      executeFissionBot({
        bot,
        runAs: {} as WithId<ProjectMembership>,
        accessToken,
        project: {
          reference: { reference: 'Project/123' },
          countryPack: 'kenya',
          settings: {},
        },
        input: 'test input',
        contentType: 'text/plain',
        secrets: {},
        traceId: randomUUID(),
        headers: {},
      })
    ).resolves.toMatchObject({
      success: false,
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`bot-${bot.id}`),
      expect.objectContaining({ method: 'POST' })
    );
  });
});
