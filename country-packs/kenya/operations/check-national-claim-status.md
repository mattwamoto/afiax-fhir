# Check National Claim Status

Operation: `Claim/$check-national-claim-status`

This document describes the current Kenya implementation of SHA claim-status refresh.

## Purpose

- refresh the latest Kenya SHA payer-side state for an existing submitted claim
- normalize the SHA status into shared workflow states
- persist that state on the `Claim`
- upsert a local `ClaimResponse` that represents the latest payer-side evidence
- optionally trigger a Kenya status workflow bot

## Preconditions

Before this operation can succeed:

1. the active project must have `countryPack=kenya`
2. the `Claim` must already exist
3. the `Claim` must already contain a Kenya submission snapshot with a bundle ID
4. Kenya SHA credentials must be available for the selected credential mode

## Lookup key

The current Kenya status handler uses the Kenya submission snapshot on the `Claim` and reads:

- `bundleId`

That bundle ID becomes the SHA `claim_id` used in the status endpoint call.

If the claim has no Kenya submission snapshot, the status check returns `error` and does not attempt the remote call.

## Current implementation flow

1. Read the active `Claim`.
2. Resolve the project and confirm the Kenya pack is active.
3. Read the latest Kenya submission snapshot from `Claim.extension`.
4. Extract the Kenya SHA bundle ID from that snapshot.
5. Read Kenya SHA credentials from `Project.secret` or `Project.systemSecret`.
6. Sign a DHA-style JWT.
7. Call the SHA claim-status endpoint with `claim_id=<bundleId>`.
8. Normalize the returned claim state into:
   - `queued`
   - `in-review`
   - `adjudicated`
   - `rejected`
   - `error`
9. Create or update a local `ClaimResponse` identified by the Kenya SHA claim ID.
10. If a Kenya claim status workflow bot is configured, trigger it after the successful refresh.
11. Persist the Kenya claim status snapshot on the `Claim`.
12. Create a status `Task`.
13. Create an `AuditEvent`.

## What gets updated

The flow updates or creates:

- `Claim.extension`
  - Kenya claim status snapshot
- `ClaimResponse`
  - local payer-side status record
- `Task`
  - status refresh task
- `AuditEvent`
  - status refresh audit trail

## Required project settings

- `kenyaShaClaimsEnvironment`
- `kenyaShaClaimsCredentialMode`
- optional `kenyaClaimStatusWorkflowBotId`

Legacy compatibility:

- if `kenyaClaimStatusWorkflowBotId` is not set, the status flow can still fall back to the older shared
  `kenyaClaimWorkflowBotId`

## Required tenant-managed secret names

- `kenyaShaClaimsAccessKey`
- `kenyaShaClaimsSecretKey`
- `kenyaShaClaimsCallbackUrl`

## Response contract

Returned fields currently include:

- normalized status
- correlation ID
- message
- next state
- Kenya SHA claims environment
- status endpoint
- response status code
- claim ID
- claim state
- raw response
- `ClaimResponse` reference
- workflow bot status
- task reference

## Recommended UI path

Preferred user path:

1. open `/Claim/{id}`
2. confirm the claim was already submitted and has a Kenya submission snapshot
3. click `Check Kenya SHA Claim Status`
4. inspect:
   - current claim state
   - normalized status
   - local `ClaimResponse`
   - raw SHA payload
   - workflow bot state

This path is preferable to raw operation invocation because it exposes the persisted claim snapshot and the local
`ClaimResponse` reference immediately.

## Troubleshooting

If the operation fails:

1. confirm the claim has a Kenya submission snapshot with a bundle ID
2. confirm SHA credentials are present for the selected credential mode
3. inspect the raw SHA status payload shown in the UI
4. inspect the created or updated `ClaimResponse`
5. inspect the created `Task` and `AuditEvent`

If the normalized status looks wrong, compare the raw SHA `claim_state` with the normalization rules in
`packages/server/src/country-pack/kenya/check-national-claim-status.ts` before changing the UI.
