// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { BotExecutionContext, BotExecutionResult } from '../../bots/types';
import { executeHttpBot } from '../external/execute';
import { getKnativeAuthHeaders, getKnativeConfig, getKnativeFunctionUrl } from './utils';

/**
 * Executes a Bot with Knative.
 */
export function executeKnativeBot(request: BotExecutionContext): Promise<BotExecutionResult> {
  const config = getKnativeConfig();
  return executeHttpBot(getKnativeFunctionUrl(request.bot.id), request, {
    headers: getKnativeAuthHeaders(),
    timeoutMilliseconds: config.timeoutMilliseconds,
  });
}
