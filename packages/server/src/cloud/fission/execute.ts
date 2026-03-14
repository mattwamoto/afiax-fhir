// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { BotExecutionContext, BotExecutionResult } from '../../bots/types';
import { executeHttpBot } from '../external/execute';
import { getFissionFunctionUrl } from './utils';

/**
 * Executes a Bot with Fission.
 * @param request - The bot request.
 * @returns The bot execution result.
 */
export async function executeFissionBot(request: BotExecutionContext): Promise<BotExecutionResult> {
  return executeHttpBot(getFissionFunctionUrl(request.bot.id), request);
}
