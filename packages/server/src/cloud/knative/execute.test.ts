// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { WithId } from '@medplum/core';
import type { Bot, ProjectMembership } from '@medplum/fhirtypes';
import { randomUUID } from 'node:crypto';
import fetch from 'node-fetch';
import { loadTestConfig } from '../../config/loader';
import type { MedplumServerConfig } from '../../config/types';
import { executeKnativeBot } from './execute';

jest.mock('node-fetch');

describe('Execute Knative bots', () => {
  let config: MedplumServerConfig;

  beforeAll(async () => {
    config = await loadTestConfig();
    config.knative = {
      invocationUrl: 'https://bot-{{id}}.knative.example.com',
      authHeader: 'x-afiax-runtime-key',
      authToken: 'test-secret',
      timeoutMilliseconds: 15000,
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
      name: 'Knative Bot',
      runtimeVersion: 'knative',
    };

    (fetch as unknown as jest.Mock).mockImplementationOnce(() => ({
      status: 200,
      ok: true,
      text: jest.fn(async () =>
        JSON.stringify({ success: true, logResult: 'knative ok', returnValue: { result: 'test result' } })
      ),
    }));

    await expect(
      executeKnativeBot({
        bot,
        runAs: {} as WithId<ProjectMembership>,
        accessToken: 'access-token',
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
      logResult: 'knative ok',
      returnValue: { result: 'test result' },
    });

    expect(fetch).toHaveBeenCalledWith(
      `https://bot-${bot.id}.knative.example.com`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'x-afiax-runtime-key': 'test-secret',
        }),
      })
    );
  });

  test('Failure', async () => {
    const bot: WithId<Bot> = {
      resourceType: 'Bot',
      id: randomUUID(),
      name: 'Knative Bot',
      runtimeVersion: 'knative',
    };

    (fetch as unknown as jest.Mock).mockImplementationOnce(() => ({
      status: 503,
      ok: false,
      text: jest.fn(async () => 'service unavailable'),
    }));

    await expect(
      executeKnativeBot({
        bot,
        runAs: {} as WithId<ProjectMembership>,
        accessToken: 'access-token',
        project: {
          reference: { reference: 'Project/123' },
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
  });
});
