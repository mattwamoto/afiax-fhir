// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { Bot, Claim, Project } from '@medplum/fhirtypes';
import { executeBot } from '../../bots/execute';
import { getBotProjectMembership } from '../../bots/utils';
import { triggerKenyaClaimWorkflowBot } from './workflow-bot';

jest.mock('../../bots/execute');
jest.mock('../../bots/utils');

describe('triggerKenyaClaimWorkflowBot', () => {
  beforeEach(() => {
    (executeBot as unknown as jest.Mock).mockReset();
    (getBotProjectMembership as unknown as jest.Mock).mockReset();
  });

  test('executes configured Kenya claim workflow bot after successful claim submit', async () => {
    const claim: Claim = {
      resourceType: 'Claim',
      id: 'claim-123',
      status: 'active',
      type: { text: 'Institutional' },
      use: 'claim',
      patient: { reference: 'Patient/123' },
      created: '2026-03-21',
      provider: { reference: 'Organization/123' },
      priority: { text: 'normal' },
      insurance: [{ sequence: 1, focal: true, coverage: { reference: 'Coverage/123' } }],
    };

    const bot: Bot = {
      resourceType: 'Bot',
      id: 'kenya-claim-bot',
      meta: {
        project: 'project-123',
      },
      name: 'Kenya Claim Bot',
    };

    (getBotProjectMembership as unknown as jest.Mock).mockResolvedValue({
      resourceType: 'ProjectMembership',
      id: 'membership-123',
      project: { reference: 'Project/project-123' },
      profile: { reference: 'Bot/kenya-claim-bot' },
    });
    (executeBot as unknown as jest.Mock).mockResolvedValue({ success: true, logResult: 'ok' });

    const result = await triggerKenyaClaimWorkflowBot(
      {
        project: {
          resourceType: 'Project',
          id: 'project-123',
          setting: [{ name: 'kenyaClaimWorkflowBotId', valueString: 'Bot/kenya-claim-bot' }],
        } as Project,
        systemRepo: {
          readResource: jest.fn(async () => bot),
        },
        profile: { reference: 'Practitioner/123' },
        traceId: 'trace-123',
      } as any,
      claim,
      {
        status: 'submitted',
        correlationId: 'corr-123',
        message: 'submitted',
        nextState: 'awaiting-sha-status',
        countryPack: 'kenya',
        shaClaimsEnvironment: 'uat',
        submissionEndpoint: 'https://qa-mis.apeiro-digital.com/v1/shr-med/bundle',
        bundleId: 'bundle-123',
      }
    );

    expect(result).toEqual({
      workflowBot: 'Bot/kenya-claim-bot',
      workflowBotStatus: 'triggered',
      workflowBotMessage: 'Configured Kenya claim workflow bot executed successfully.',
    });
    expect(executeBot).toHaveBeenCalledWith(
      expect.objectContaining({
        bot,
        input: expect.objectContaining({
          eventType: 'kenya.claim.submitted',
          claim: { reference: 'Claim/claim-123' },
        }),
      })
    );
  });
});
