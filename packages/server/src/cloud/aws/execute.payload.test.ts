// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0

import type { WithId } from '@medplum/core';
import { ContentType, Hl7Message } from '@medplum/core';
import type { Bot, ProjectMembership } from '@medplum/fhirtypes';
import { randomUUID } from 'crypto';
import { loadTestConfig } from '../../config/loader';
import { buildLambdaPayload } from './execute';

describe('buildLambdaPayload', () => {
  beforeAll(async () => {
    await loadTestConfig();
  });

  test('includes project context and country pack metadata', () => {
    const bot: WithId<Bot> = {
      resourceType: 'Bot',
      id: randomUUID(),
      name: 'Test Bot',
      runtimeVersion: 'awslambda',
    };

    const payload = buildLambdaPayload({
      bot,
      runAs: {} as WithId<ProjectMembership>,
      accessToken: 'test-token',
      project: {
        reference: { reference: 'Project/123' },
        name: 'Kenya Project',
        countryPack: 'kenya',
        settings: {
          countryPack: { name: 'countryPack', valueString: 'kenya' },
          countryCode: { name: 'countryCode', valueString: 'KE' },
        },
      },
      input: 'test input',
      contentType: ContentType.TEXT,
      secrets: {},
      traceId: randomUUID(),
      headers: { 'x-test': '1' },
    });

    expect(payload).toMatchObject({
      bot: { reference: `Bot/${bot.id}` },
      accessToken: 'test-token',
      project: {
        reference: { reference: 'Project/123' },
        name: 'Kenya Project',
        countryPack: 'kenya',
        settings: {
          countryPack: { name: 'countryPack', valueString: 'kenya' },
          countryCode: { name: 'countryCode', valueString: 'KE' },
        },
      },
      input: 'test input',
      contentType: ContentType.TEXT,
      headers: { 'x-test': '1' },
    });
  });

  test('serializes HL7 messages to strings', () => {
    const bot: WithId<Bot> = {
      resourceType: 'Bot',
      id: randomUUID(),
      name: 'HL7 Bot',
      runtimeVersion: 'awslambda',
    };
    const message = Hl7Message.parse('MSH|^~\\&|SEND|FAC|RECV|DEST|20260314120000||ADT^A01|MSG0001|P|2.5|');

    const payload = buildLambdaPayload({
      bot,
      runAs: {} as WithId<ProjectMembership>,
      accessToken: 'test-token',
      project: {
        reference: { reference: 'Project/123' },
        settings: {},
      },
      input: message,
      contentType: ContentType.HL7_V2,
      secrets: {},
    });

    expect(payload.input).toBe(message.toString());
  });
});
