// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import {
  ContentType,
  createReference,
  getKenyaClaimStatusWorkflowBotId,
  getKenyaClaimSubmitWorkflowBotId,
  normalizeErrorString,
} from '@medplum/core';
import type { Bot, Claim } from '@medplum/fhirtypes';
import { executeBot } from '../../bots/execute';
import { getBotProjectMembership } from '../../bots/utils';
import type { AuthenticatedRequestContext } from '../../context';
import type { CheckNationalClaimStatusResult, SubmitNationalClaimResult } from '../types';

export interface KenyaClaimWorkflowBotResult {
  readonly workflowBot?: string;
  readonly workflowBotStatus?: 'triggered' | 'failed';
  readonly workflowBotMessage?: string;
}

function normalizeBotId(value: string): string {
  return value.startsWith('Bot/') ? value.slice('Bot/'.length) : value;
}

async function triggerKenyaClaimWorkflowEvent(
  ctx: AuthenticatedRequestContext,
  claim: Claim,
  configuredBot: string | undefined,
  eventType: string,
  payload: Record<string, unknown>
): Promise<KenyaClaimWorkflowBotResult> {
  if (!configuredBot) {
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
        eventType,
        claim: createReference(claim),
        ...payload,
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

export async function triggerKenyaClaimWorkflowBot(
  ctx: AuthenticatedRequestContext,
  claim: Claim,
  result: SubmitNationalClaimResult
): Promise<KenyaClaimWorkflowBotResult> {
  if (result.status !== 'submitted') {
    return {};
  }

  return triggerKenyaClaimWorkflowEvent(ctx, claim, getKenyaClaimSubmitWorkflowBotId(ctx.project), 'kenya.claim.submitted', {
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
  });
}

export async function triggerKenyaClaimStatusWorkflowBot(
  ctx: AuthenticatedRequestContext,
  claim: Claim,
  result: CheckNationalClaimStatusResult
): Promise<KenyaClaimWorkflowBotResult> {
  if (result.status === 'error') {
    return {};
  }

  return triggerKenyaClaimWorkflowEvent(
    ctx,
    claim,
    getKenyaClaimStatusWorkflowBotId(ctx.project),
    'kenya.claim.status-updated',
    {
      claimStatus: {
        status: result.status,
        correlationId: result.correlationId,
        message: result.message,
        nextState: result.nextState,
        shaClaimsEnvironment: result.shaClaimsEnvironment,
        statusEndpoint: result.statusEndpoint,
        responseStatusCode: result.responseStatusCode,
        claimId: result.claimId,
        claimState: result.claimState,
        claimResponse: result.claimResponse,
        task: result.task,
      },
    }
  );
}
