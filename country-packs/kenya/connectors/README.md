# Connectors

This directory is the repo-level integration boundary for Kenya-specific remote systems.

In this fork, connector code is the narrow layer that turns canonical Afiax FHIR input into Kenya remote calls and
turns Kenya remote responses back into normalized workflow data. It is not UI code, and it is not the place to create
FHIR evidence resources such as `Task` or `AuditEvent`.

## Read this first

Start here before editing any Kenya connector:

- `packages/server/src/country-pack/kenya/afyalink.ts`
- `packages/server/src/country-pack/kenya/sha.ts`
- `packages/server/src/country-pack/kenya/verify-facility-authority.ts`
- `packages/server/src/country-pack/kenya/verify-practitioner-authority.ts`
- `packages/server/src/country-pack/kenya/check-coverage.ts`
- `packages/server/src/country-pack/kenya/submit-national-claim.ts`
- `packages/server/src/country-pack/kenya/check-national-claim-status.ts`

Then read the matching operation notes:

- `country-packs/kenya/operations/verify-facility-authority.md`
- `country-packs/kenya/operations/verify-practitioner-authority.md`
- `country-packs/kenya/operations/check-coverage.md`
- `country-packs/kenya/operations/submit-national-claim.md`
- `country-packs/kenya/operations/check-national-claim-status.md`

## What connector code owns

Connector code in this repo owns exactly these responsibilities:

1. resolve the correct Kenya environment from `Project.setting`
2. resolve the correct secret surface from `Project.secret` or `Project.systemSecret`
3. authenticate to the remote system
4. build the outbound request
5. execute the request
6. normalize the inbound response shape
7. return enough metadata for the pack handler to persist workflow evidence

Connector code does not own:

- browser-side forms
- resource-page button behavior
- `Task` creation
- `AuditEvent` creation
- extension writes onto `Organization`, `Practitioner`, `Coverage`, or `Claim`
- ERPNext, Afiax Billing, or Afiax Pay payload generation

Those responsibilities belong in the pack handlers, resource panels, or downstream bots.

## Current connector surfaces

### DHA HIE / AfyaLink

Main file:

- `packages/server/src/country-pack/kenya/afyalink.ts`

Current responsibilities:

- resolve Kenya HIE environment
- resolve tenant-managed or Afiax-managed HIE credentials
- authenticate via `GET /v1/hie-auth?key=...`
- accept DHA auth responses returned either as raw JWT text or JSON
- facility search by facility code
- practitioner search by identification type and number
- eligibility search
- normalize DHA payload differences such as string vs numeric `found` fields

Current workflows that depend on it:

- Kenya setup wizard facility lookup
- facility verification
- practitioner lookup
- practitioner verification
- coverage eligibility checks

### Kenya SHA

Main file:

- `packages/server/src/country-pack/kenya/sha.ts`

Current responsibilities:

- resolve Kenya SHA environment
- resolve tenant-managed or Afiax-managed SHA credentials
- generate short-lived JWTs for SHA calls
- submit national claim bundles
- refresh national claim status
- parse either bundle-style `ClaimResponse` payloads or root-level claim-state payloads
- return submission and status endpoint metadata for operator debugging

Current workflows that depend on it:

- claim submission
- claim-status refresh

## Current config split

### HIE connector config

Non-secret settings:

```text
kenyaHieEnvironment
kenyaHieCredentialMode
kenyaHieAgentId
```

Tenant-managed secrets:

```text
kenyaAfyaLinkConsumerKey
kenyaAfyaLinkUsername
kenyaAfyaLinkPassword
```

Optional override:

```text
kenyaAfyaLinkBaseUrl
```

Operational notes:

- `kenyaHieEnvironment` controls `uat` vs `production`
- `kenyaHieCredentialMode` controls whether credentials are read from `Project.secret` or `Project.systemSecret`
- `kenyaHieAgentId` exists for future Kenya HIE surfaces that require an explicit agent identifier
- `kenyaAfyaLinkBaseUrl` is an override only; prefer the environment-derived base URL unless DHA documentation changes

### SHA connector config

Non-secret settings:

```text
kenyaShaClaimsEnvironment
kenyaShaClaimsCredentialMode
```

Tenant-managed secrets:

```text
kenyaShaClaimsAccessKey
kenyaShaClaimsSecretKey
kenyaShaClaimsCallbackUrl
```

Optional override:

```text
kenyaShaClaimsBaseUrl
```

Operational notes:

- `kenyaShaClaimsEnvironment` controls `uat` vs `production`
- `kenyaShaClaimsCredentialMode` controls whether SHA credentials are tenant-managed or Afiax-managed
- `kenyaShaClaimsCallbackUrl` is captured now even though callback intake is not implemented yet
- `kenyaShaClaimsBaseUrl` is an override only; the built-in defaults follow the current Kenya SHA environment mapping

## Request patterns currently implemented

### HIE auth

- method: `GET`
- path: `/v1/hie-auth?key=...`
- auth mode: Basic auth with username/password
- normalization behavior:
  - accepts raw JWT response bodies
  - accepts JSON token payloads

### Facility lookup

- method: `GET`
- path: `/v1/facility-search?facility_code=...`
- auth mode: Bearer token from HIE auth
- canonical input:
  - Kenya facility code / MFL code from `Organization.identifier`
- normalization behavior:
  - tolerates DHA payloads where `found` is numeric, string, or boolean
  - infers a facility match when DHA returns facility metadata without a strict `found=1`

### Practitioner lookup

- method: `GET`
- path: `/v1/practitioner-search?identification_type=...&identification_number=...`
- auth mode: Bearer token from HIE auth
- canonical input:
  - identification type and identifier number from `Practitioner.identifier`

### Eligibility

- method: `GET`
- endpoint family: DHA eligibility path
- auth mode: Bearer token from HIE auth
- canonical input:
  - identifier type
  - identifier number
  - values derived from `Coverage`

### SHA claim submit

- method: `POST`
- path: `/v1/shr-med/bundle`
- auth mode: JWT signed with SHA access key and secret key
- payload: FHIR `Bundle`
- canonical input:
  - bundle prepared by the Kenya claim handler from a valid `Claim` graph

### SHA claim status

- method: `GET`
- path: `/v1/shr-med/claim-status?claim_id=...`
- auth mode: JWT signed with SHA access key and secret key
- canonical input:
  - claim id or bundle id persisted during the Kenya claim submit flow

## Execution path by workflow

### Facility lookup and verification

1. resource panel saves the Kenya facility code on `Organization.identifier`
2. the handler reads the canonical facility code from the resource
3. `afyalink.ts` resolves HIE environment and credentials
4. `afyalink.ts` authenticates and calls the DHA facility-search endpoint
5. `afyalink.ts` normalizes the raw DHA payload
6. the Kenya handler decides whether the result is usable, persists the registry snapshot, and writes workflow evidence

### Practitioner lookup and verification

1. resource panel saves the Kenya identifier on `Practitioner.identifier`
2. the handler derives identification type and number from the resource
3. `afyalink.ts` authenticates and calls DHA practitioner search
4. the handler maps the normalized lookup result into practitioner registry and verification state

### Coverage eligibility

1. resource panel saves the eligibility lookup identifier on `Coverage.identifier`
2. the handler derives request input from `Coverage`
3. `afyalink.ts` authenticates and calls the DHA eligibility surface
4. the handler persists the Kenya eligibility snapshot and creates the FHIR evidence resources

### Claim submit and claim status

1. the Kenya claim handler prepares the bundle from the `Claim` graph
2. `sha.ts` resolves SHA credentials and generates the JWT
3. `sha.ts` submits or refreshes the claim status
4. the handler persists the Kenya claim snapshot, task, audit evidence, and local `ClaimResponse` where applicable

## What connector helpers should return

Connector helpers in this pack should return:

- normalized workflow-relevant fields
- raw response text where possible
- parsed response when it is safe and useful
- endpoint metadata useful for debugging
- remote identifiers needed for retries, refresh, or reconciliation

Connector helpers should not return:

- screen-specific presentation strings
- direct UI state
- secrets or secret fragments
- ERPNext or Afiax Billing payloads

## Adding a new Kenya connector

Use this sequence instead of starting from the UI:

1. add or extend the transport/auth helper in `packages/server/src/country-pack/kenya/`
2. add a focused unit test for response normalization
3. add or update the pack handler that consumes the connector
4. add or update the FHIR operation contract
5. add or update the resource panel or admin surface
6. document the connector behavior in this directory and the matching operation note

If you need a new Kenya remote system, keep the same pattern:

- connector file for transport and normalization
- handler file for workflow semantics
- UI only after the backend contract is stable

## Debugging order

When a connector path fails, check these in order:

1. the project is actually on `countryPack=kenya`
2. the correct environment was selected for the flow you are testing
3. the correct credential mode is selected
4. the secrets exist in the expected secret surface
5. the resource carries the expected canonical identifier
6. the raw remote payload is what the connector claims it is
7. the normalization layer handled the response shape you actually received

Do not start by editing the UI if the raw Kenya connector response is already wrong.

## Boundary rule

If a change only affects how Kenya talks to DHA or SHA, it belongs in connector or handler code.

If a change affects invoice creation, payment posting, Afiax Pay, or ERPNext document mapping, it does not belong in
this directory or in this repo.
