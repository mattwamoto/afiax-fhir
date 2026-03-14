// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { concatUrls, createReference, Hl7Message, normalizeErrorString } from '@medplum/core';
import fetch from 'node-fetch';
import type { BotExecutionContext, BotExecutionResult } from '../../bots/types';
import { getConfig } from '../../config/loader';

export interface ExternalBotPayload extends Record<string, unknown> {
  readonly bot: ReturnType<typeof createReference>;
  readonly baseUrl: string;
  readonly requester: BotExecutionContext['requester'];
  readonly accessToken: string;
  readonly project: BotExecutionContext['project'];
  readonly input: unknown;
  readonly contentType: string;
  readonly secrets: BotExecutionContext['secrets'];
  readonly traceId: string | undefined;
  readonly headers: BotExecutionContext['headers'];
}

export interface ExternalBotRequestOptions {
  readonly headers?: Record<string, string>;
  readonly timeoutMilliseconds?: number;
}

/**
 * Builds the shared execution payload used by external bot runtimes.
 */
export function buildBotExecutionPayload(request: BotExecutionContext): ExternalBotPayload {
  const { bot, accessToken, project, requester, secrets, input, contentType, traceId, headers } = request;
  return {
    bot: createReference(bot),
    baseUrl: getConfig().baseUrl,
    requester,
    accessToken,
    project,
    input: input instanceof Hl7Message ? input.toString() : input,
    contentType,
    secrets,
    traceId,
    headers,
  };
}

/**
 * Resolves an external runtime URL. If the template includes "{{id}}", then
 * the bot ID is substituted directly. Otherwise, a default path segment is appended.
 */
export function resolveBotRuntimeUrl(templateOrBaseUrl: string, botId: string, defaultPathPrefix = 'bot-'): string {
  if (templateOrBaseUrl.includes('{{id}}')) {
    return templateOrBaseUrl.replaceAll('{{id}}', botId);
  }
  return concatUrls(templateOrBaseUrl, `${defaultPathPrefix}${botId}`);
}

/**
 * Executes a bot against an HTTP-based external runtime.
 */
export async function executeHttpBot(
  url: string,
  request: BotExecutionContext,
  options?: ExternalBotRequestOptions
): Promise<BotExecutionResult> {
  const controller = options?.timeoutMilliseconds ? new AbortController() : undefined;
  const timeout =
    controller && options?.timeoutMilliseconds
      ? setTimeout(() => controller.abort(), options.timeoutMilliseconds)
      : undefined;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify(buildBotExecutionPayload(request)),
      signal: controller?.signal,
    });

    const responseBody = await response.text();
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}, Message: ${responseBody}`);
    }

    const parsedResponse = responseBody ? JSON.parse(responseBody) : undefined;
    return {
      success: true,
      logResult: parsedResponse?.logResult ?? '',
      returnValue: parsedResponse?.returnValue,
    };
  } catch (err) {
    return {
      success: false,
      logResult: normalizeErrorString(err),
    };
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}
