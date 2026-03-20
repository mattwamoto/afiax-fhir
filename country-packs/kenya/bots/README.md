# Bots

This directory documents Kenya-specific asynchronous orchestration for the country pack.

Bots are deliberately not the default tool for every Kenya workflow. In this repo, bots exist to continue work after
the synchronous clinical interaction has already completed. Immediate DHA registry feedback stays inline. Longer-running
handoff, polling, and settlement continuation move into bots.

## Read this first

Start with the current implementation:

- `packages/server/src/country-pack/kenya/workflow-bot.ts`
- `packages/server/src/country-pack/kenya/submit-national-claim.ts`
- `packages/server/src/country-pack/kenya/check-national-claim-status.ts`
- `packages/core/src/project.ts`

These files define the only bot hooks currently implemented by the Kenya pack.

## When Kenya bots are used

Bots are the right mechanism when:

- the Kenya workflow continues after the initial request/response cycle
- the user should not stay blocked on the current page
- downstream systems such as Afiax Billing or Afiax Pay need non-blocking handoff
- retries are expected
- claim status needs ongoing follow-up after the first submit

Bots are not the right mechanism when:

- the UI needs immediate DHA feedback
- the remote call is short and the user is waiting on the page
- the operation is the canonical source of workflow success

That is why bots are not used for:

- immediate facility lookup
- immediate practitioner lookup
- immediate coverage eligibility checks

## Current bot hooks

### Claim submit workflow bot

Project setting:

```text
kenyaClaimSubmitWorkflowBotId
```

Trigger point:

- after a successful Kenya SHA claim submission

Event type:

```text
kenya.claim.submitted
```

Current event payload includes:

- `claim`
- `submission.status`
- `submission.correlationId`
- `submission.message`
- `submission.nextState`
- `submission.shaClaimsEnvironment`
- `submission.submissionEndpoint`
- `submission.statusTrackingEndpoint`
- `submission.responseStatusCode`
- `submission.bundleId`
- `submission.bundleEntryCount`
- `submission.task`

### Claim status workflow bot

Project setting:

```text
kenyaClaimStatusWorkflowBotId
```

Legacy fallback:

```text
kenyaClaimWorkflowBotId
```

Trigger point:

- after a successful Kenya SHA claim-status refresh

Event type:

```text
kenya.claim.status-updated
```

Current event payload includes:

- `claim`
- `claimStatus.status`
- `claimStatus.correlationId`
- `claimStatus.message`
- `claimStatus.nextState`
- `claimStatus.shaClaimsEnvironment`
- `claimStatus.statusEndpoint`
- `claimStatus.responseStatusCode`
- `claimStatus.claimId`
- `claimStatus.claimState`
- `claimStatus.claimResponse`
- `claimStatus.task`

## Current execution model

### Submit flow

1. user submits the Kenya SHA claim from the `Claim` page
2. the Kenya submit handler completes the synchronous transport step
3. the submit handler persists the claim snapshot, `Task`, and `AuditEvent`
4. if `kenyaClaimSubmitWorkflowBotId` is configured, the handler triggers the configured bot
5. the bot result is attached back to the submit result as workflow metadata

### Claim-status flow

1. user refreshes Kenya SHA claim status from the `Claim` page
2. the Kenya status handler calls SHA and updates the local claim state
3. the handler upserts the local `ClaimResponse`
4. the handler persists the status snapshot, `Task`, and `AuditEvent`
5. if `kenyaClaimStatusWorkflowBotId` is configured, the handler triggers the configured bot

## Failure model

Bots are non-blocking in the current design.

That means:

- a successful claim submit remains successful even if the bot fails
- a successful claim-status refresh remains successful even if the bot fails
- bot failure is returned as supplementary workflow evidence
- the bot result is not the clinical definition of submit or status success

This is intentional. The clinical workflow is owned by Afiax FHIR. The bot continues downstream enterprise work after
the clinical step is complete.

## Configuration rules

Use project settings only. Do not hard-code Kenya bot ids in code.

Current settings:

```text
kenyaClaimSubmitWorkflowBotId
kenyaClaimStatusWorkflowBotId
kenyaClaimWorkflowBotId   # legacy fallback only
```

Recommended usage:

- configure separate bots for submit and status if the downstream work differs
- keep the legacy shared setting only for backward compatibility
- use explicit `Bot/<id>` references in the UI when possible

## What Kenya bots should do

Good Kenya bot responsibilities in this architecture:

- hand off claim submission state to Afiax Billing
- hand off adjudication or denial state to Afiax Billing
- start Afiax Pay co-pay, subsidy, or settlement continuation
- perform later polling orchestration if SHA status refresh becomes automated
- normalize future callback payloads into enterprise-side events

## What Kenya bots should not do

Do not use bots in this repo for:

- replacing canonical FHIR operations
- synchronous validation of facility, practitioner, or coverage lookups
- embedding ERPNext document creation rules directly into Medplum core
- embedding Afiax Pay financial logic directly into Medplum core
- carrying secret material in event payloads

Those responsibilities belong in adjacent services or downstream runtimes.

## Adding a new Kenya bot handoff

Use this sequence:

1. identify the synchronous workflow boundary that should remain inside Afiax FHIR
2. define the event type and payload needed after that boundary
3. add a project-level bot id setting
4. implement the trigger in `packages/server/src/country-pack/kenya/workflow-bot.ts`
5. add a focused unit test for success and failure behavior
6. document the event contract here and in the matching workflow docs

Do not start by wiring a bot into the UI. First define where the synchronous workflow ends and what the async handoff
needs to know.

## Operational debugging order

When a Kenya bot handoff does not behave as expected, check these in order:

1. the relevant bot id setting is configured on the project
2. the configured bot belongs to the correct project context
3. the synchronous Kenya workflow actually succeeded
4. the event payload includes the expected claim reference and metadata
5. the bot execution result in the claim panel matches the server-side expectation

If the synchronous Kenya workflow failed, fix that first. The bot layer is downstream of the clinical workflow.

## Future work

Expected next bot-oriented improvements:

- explicit event contract docs for Afiax Billing handoff
- explicit event contract docs for Afiax Pay handoff
- callback intake boundary for future SHA callbacks
- polling bot runbook for claim-status refresh
- retry and replay guidance per bot event type
