// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { buildKenyaNationalClaimSubmissionExtension } from '@medplum/core';
import type { Claim, ClaimResponse, Project } from '@medplum/fhirtypes';
import * as sha from './sha';
import * as workflowBot from './workflow-bot';
import { checkKenyaNationalClaimStatus } from './check-national-claim-status';

describe('checkKenyaNationalClaimStatus', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('checks Kenya SHA claim status and upserts a local ClaimResponse', async () => {
    const project: Project = {
      resourceType: 'Project',
      id: 'project-claim-1',
      setting: [
        { name: 'countryPack', valueString: 'kenya' },
        { name: 'kenyaShaClaimsEnvironment', valueString: 'uat' },
      ],
      secret: [
        { name: 'kenyaShaClaimsAccessKey', valueString: 'sha-access-key' },
        { name: 'kenyaShaClaimsSecretKey', valueString: 'sha-secret-key' },
      ],
    };

    const claim: Claim = {
      resourceType: 'Claim',
      id: 'claim-123',
      status: 'active',
      type: { text: 'Institutional' },
      use: 'claim',
      patient: { reference: 'Patient/patient-123' },
      created: '2026-03-21',
      provider: { reference: 'Organization/org-123' },
      priority: { text: 'normal' },
      insurance: [{ sequence: 1, focal: true, coverage: { reference: 'Coverage/coverage-123' } }],
      extension: [
        buildKenyaNationalClaimSubmissionExtension(
          {
            status: 'submitted',
            correlationId: 'corr-submit-123',
            message: 'submitted',
            nextState: 'awaiting-sha-status',
            shaClaimsEnvironment: 'uat',
            bundleId: 'bundle-123',
          },
          '2026-03-21T10:00:00.000Z'
        ),
      ],
    };

    const remoteClaimResponse: ClaimResponse = {
      resourceType: 'ClaimResponse',
      status: 'active',
      type: { text: 'Institutional' },
      use: 'claim',
      patient: { reference: 'Patient/patient-123' },
      created: '2026-03-21',
      outcome: 'complete',
      disposition: 'Claim approved for payment',
      insurer: { reference: 'Organization/sha-123' },
    };

    jest.spyOn(sha, 'checkKenyaShaClaimStatus').mockResolvedValueOnce({
      statusEndpoint: 'https://qa-mis.apeiro-digital.com/v1/shr-med/claim-status?claim_id=bundle-123',
      responseStatusCode: 200,
      rawResponse: '{"claim_state":"Payment Approved"}',
      claimResponse: remoteClaimResponse,
      claimState: 'Payment Approved',
      message: 'Claim approved for payment',
    });

    jest.spyOn(workflowBot, 'triggerKenyaClaimStatusWorkflowBot').mockResolvedValueOnce({
      workflowBot: 'Bot/kenya-claim-bot',
      workflowBotStatus: 'triggered',
      workflowBotMessage: 'Configured Kenya claim workflow bot executed successfully.',
    });

    const createResource = jest.fn(async (resource: ClaimResponse) => ({
      ...resource,
      id: 'claim-response-123',
    }));

    const result = await checkKenyaNationalClaimStatus({
      ctx: {
        project,
        systemRepo: {
          readResource: jest.fn(async () => project),
          searchOne: jest.fn(async () => undefined),
          createResource,
          updateResource: jest.fn(),
        },
      } as any,
      claim: claim as Claim & { id: string },
      correlationId: 'corr-claim-status-123',
    });

    expect(result).toMatchObject({
      status: 'adjudicated',
      correlationId: 'corr-claim-status-123',
      nextState: 'ready-for-financial-reconciliation',
      claimId: 'bundle-123',
      claimState: 'Payment Approved',
      workflowBot: 'Bot/kenya-claim-bot',
      workflowBotStatus: 'triggered',
    });
    expect(result.claimResponse).toEqual({ reference: 'ClaimResponse/claim-response-123' });
    expect(createResource).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceType: 'ClaimResponse',
        request: { reference: 'Claim/claim-123' },
        preAuthRef: 'bundle-123',
      })
    );
  });
});
