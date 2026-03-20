# Submit National Claim

Operation: `Claim/$submit-national-claim`

This document describes the current Kenya implementation of the generic national-claim submission operation.

## Purpose

- build a Kenya SHA-compatible FHIR `Bundle` from a canonical Medplum `Claim` graph
- submit the bundle to Kenya SHA when claim credentials are configured
- persist submission evidence on the `Claim`
- optionally hand off the successful submit to a Kenya workflow bot

## Preconditions

Before this operation can succeed:

1. the active project must have `countryPack=kenya`
2. the `Claim` must already exist
3. the `Claim` must contain at least one item
4. the `Claim` must include a `total`
5. the `Claim` must include at least one insurance entry with a readable `Coverage`
6. the `Claim` graph must resolve the required linked resources

## Required claim graph

The Kenya builder currently expects:

- `Claim`
- linked `Patient`
- linked `Coverage`
- linked `Organization` through `Claim.provider`
- linked payer `Organization` where present
- at least one `Practitioner` reachable from `Claim.provider` or `Claim.careTeam`
- optional `Location` through `Claim.facility`

If these references do not resolve, the builder fails before any SHA transport call is attempted.

## Current implementation flow

1. Read the active `Claim`.
2. Resolve the project and confirm the Kenya pack is active.
3. Read the Kenya SHA environment from `Project.setting`.
4. Validate the current `Claim` for Kenya SHA readiness.
5. Read all required linked resources.
6. Build a Kenya SHA bundle and rewrite internal references to SHA-style full URLs.
7. If SHA credentials are missing:
   - return `prepared`
   - persist the bundle snapshot only
8. If SHA credentials are present:
   - sign a DHA-style JWT
   - submit the bundle to the SHA bundle endpoint
   - return `submitted`
9. If a Kenya claim submit workflow bot is configured, trigger it after a successful submit.
10. Persist the Kenya claim submission snapshot on the `Claim`.
11. Create a submit `Task`.
12. Create an `AuditEvent`.

## What gets updated

The flow updates or creates:

- `Claim.extension`
  - Kenya claim submission snapshot
- `Task`
  - submit task
- `AuditEvent`
  - submit audit trail

If submission succeeds, the snapshot contains the bundle ID and SHA status-tracking endpoint used later by
`$check-national-claim-status`.

## Required project settings

- `kenyaShaClaimsEnvironment`
- `kenyaShaClaimsCredentialMode`
- optional `kenyaClaimSubmitWorkflowBotId`

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
- submission endpoint
- status-tracking endpoint
- response status code when submission occurred
- bundle ID
- bundle entry count
- raw bundle
- raw response when submission occurred
- workflow bot status
- task reference

## Expected normalized statuses

The Kenya handler currently returns:

- `prepared`
- `submitted`
- `error`

`prepared` means the bundle was built but no live SHA transport occurred.

## Recommended UI path

Preferred user path:

1. open `/Claim/{id}`
2. click `Submit Kenya SHA Claim`
3. inspect submission endpoint, status-tracking endpoint, and raw bundle
4. confirm the bundle ID is persisted on the claim

Use the UI path first when debugging because it shows both the transport result and the persisted workflow snapshot.

## Troubleshooting

If the operation fails:

1. confirm the project is on `Kenya`
2. confirm SHA environment and credential mode are correct
3. confirm SHA secrets are present when live submission is expected
4. confirm the claim graph resolves all required linked resources
5. inspect the raw bundle and raw SHA response shown in the UI
6. inspect the created `Task` and `AuditEvent`

If the operation returns `prepared` instead of `submitted`, that is usually a configuration issue, not a bundling bug.
