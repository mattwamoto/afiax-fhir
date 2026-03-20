// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { ContentType, createReference, getProjectSettingString, normalizeErrorString } from '@medplum/core';
import type { Bot, Claim } from '@medplum/fhirtypes';
import { executeBot } from '../../bots/execute';
import { getBotProjectMembership } from '../../bots/utils';
import type { AuthenticatedRequestContext } from '../../context';
import type { SubmitNationalClaimResult } from '../types';

export interface KenyaClaimWorkflowBotResult {
  readonly workflowBot?: string;
  readonly workflowBotStatus?: 'triggered' | 'failed';
  readonly workflowBotMessage?: string;
}

function normalizeBotId(value: string): string {
  return value.startsWith('Bot/') ? value.slice('Bot/'.length) : value;
}

export async function triggerKenyaClaimWorkflowBot(
  ctx: AuthenticatedRequestContext,
  claim: Claim,
  result: SubmitNationalClaimResult
): Promise<KenyaClaimWorkflowBotResult> {
  const configuredBot = getProjectSettingString(ctx.project, 'kenyaClaimWorkflowBotId');
  if (!configuredBot || result.status !== 'submitted') {
    return {};
  }

  const botId = normalizeBotId(configuredBot);

  try {
    const bot = await ctx.systemRepo.readResource<Bot>('Bot', botId);
    const botResult = await executeBot({
      bot,
      runAs: await getBotProjectMembership(ctx, bot),
      requester: ctx.profile,
      input: {
        eventType: 'kenya.claim.submitted',
        claim: createReference(claim),
        submission: {
          status: result.status,
          correlationId: result.correlationId,
          message: result.message,
          nextState: result.nextState,
          shaClaimsEnvironment: result.shaClaimsEnvironment,
          submissionEndpoint: result.submissionEndpoint,
          statusTrackingEndpoint: result.statusTrackingEndpoint,
          responseStatusCode: result.responseStatusCode,
          bundleId: result.bundleId,
          bundleEntryCount: result.bundleEntryCount,
          task: result.task,
        },
      },
      contentType: ContentType.JSON,
      traceId: ctx.traceId,
      requestTime: new Date().toISOString(),
    });

    if (!botResult.success) {
      return {
        workflowBot: `Bot/${bot.id}`,
        workflowBotStatus: 'failed',
        workflowBotMessage: botResult.logResult || 'Configured Kenya claim workflow bot returned failure.',
      };
    }

    return {
      workflowBot: `Bot/${bot.id}`,
      workflowBotStatus: 'triggered',
      workflowBotMessage: 'Configured Kenya claim workflow bot executed successfully.',
    };
  } catch (err) {
    return {
      workflowBot: configuredBot.startsWith('Bot/') ? configuredBot : `Bot/${configuredBot}`,
      workflowBotStatus: 'failed',
      workflowBotMessage: `Kenya claim workflow bot failed: ${normalizeErrorString(err)}`,
    };
  }
}
