---
sidebar_position: 3
---

# Kenya Reference Pack

Kenya is the first active country pack in this repo.

This page is the public developer-facing implementation guide for the current Kenya pack. It explains what exists
today, how to configure it, how each workflow behaves, what evidence is written, and which parts of the codebase own
the behavior.

## Purpose

The Kenya pack exists to prove that Afiax FHIR can support country-specific integrations without turning the core into
a Kenya-only fork.

Kenya is the reference implementation for:

- pack selection
- project-level settings and secret ownership
- guided onboarding in `/admin/country-pack`
- resource-level country workflows
- DHA HIE connector normalization
- SHA submit and status workflows
- optional post-submit and post-status bot handoff

## Scope

Current Kenya pack scope in this repo:

- DHA HIE / AfyaLink authentication
- facility lookup and audited facility verification
- practitioner lookup and audited practitioner verification
- coverage eligibility lookup
- Kenya SHA claim bundle preparation
- Kenya SHA claim submission
- Kenya SHA claim status refresh
- optional workflow-bot handoff after claim submission or claim status refresh

Not implemented yet:

- SHA callback ingestion
- Kenya client-registry workflow
- Kenya SHR publishing
- queue views and reconciliation dashboards
- production runbooks and cutover automation

## Boundary

Kenya logic in this repo starts at the pack boundary and ends at the clinical workflow boundary.

Kenya code in this repo does:

- resolve Kenya environments and credential modes
- call DHA HIE and SHA endpoints
- normalize remote responses
- update canonical FHIR resources with Kenya-specific identifiers and snapshots
- create evidence resources
- optionally trigger bot handoff after asynchronous claim workflows

Kenya code in this repo does not do:

- direct browser calls to DHA or SHA
- ERPNext or Afiax Billing document creation
- Afiax Pay financial execution
- generic core model changes that should apply to every country

## Runtime contract

These settings activate Kenya behavior:

```text
Project.setting.countryPack=kenya
Project.setting.kenyaHieEnvironment=uat | production
Project.setting.kenyaHieCredentialMode=tenant-managed | afiax-managed
Project.setting.kenyaHieAgentId=<agent-id>
Project.setting.kenyaShaClaimsEnvironment=uat | production
Project.setting.kenyaShaClaimsCredentialMode=tenant-managed | afiax-managed
Project.setting.kenyaClaimSubmitWorkflowBotId=Bot/<id> | <id>
Project.setting.kenyaClaimStatusWorkflowBotId=Bot/<id> | <id>
```

Tenant-managed Kenya credentials currently use:

```text
Project.secret.kenyaAfyaLinkConsumerKey
Project.secret.kenyaAfyaLinkUsername
Project.secret.kenyaAfyaLinkPassword
Project.secret.kenyaShaClaimsAccessKey
Project.secret.kenyaShaClaimsSecretKey
Project.secret.kenyaShaClaimsCallbackUrl
```

Afiax-managed Kenya credentials use the same names in `Project.systemSecret`.

The DHA endpoint is derived from environment and platform configuration. Normal tenant setup does not require a typed
base URL.

The HIE environment and the SHA claims environment are separate because the Kenya implementation uses two endpoint
families:

- HIE for auth, facility lookup, practitioner lookup, and eligibility
- SHA for claim submission and claim-status refresh

## Current identifier and extension surfaces

The Kenya pack currently uses these main identifier systems:

```text
https://afiax.africa/kenya/identifier/mfl-code
https://afiax.africa/kenya/identifier/facility-registration-number
https://afiax.africa/kenya/identifier/health-worker-registration-number
https://afiax.africa/kenya/identifier/national-id
https://afiax.africa/kenya/identifier/passport-number
https://afiax.africa/kenya/identifier/coverage-national-id
https://afiax.africa/kenya/identifier/coverage-alien-id
https://afiax.africa/kenya/identifier/coverage-mandate-number
https://afiax.africa/kenya/identifier/coverage-temporary-id
https://afiax.africa/kenya/identifier/sha-number
https://afiax.africa/kenya/identifier/coverage-refugee-id
```

The Kenya pack currently persists workflow snapshots using these extension base URLs:

```text
https://afiax.africa/fhir/StructureDefinition/kenya-facility-verification
https://afiax.africa/fhir/StructureDefinition/kenya-facility-registry
https://afiax.africa/fhir/StructureDefinition/kenya-practitioner-verification
https://afiax.africa/fhir/StructureDefinition/kenya-practitioner-registry
https://afiax.africa/fhir/StructureDefinition/kenya-coverage-eligibility
https://afiax.africa/fhir/StructureDefinition/kenya-national-claim-submission
https://afiax.africa/fhir/StructureDefinition/kenya-national-claim-status
```

These are the current de facto Kenya conformance surfaces in code.

## Entry points

Kenya behavior is reached through generic Medplum operations and curated resource panels, not through Kenya-only core
routes.

Current generic operations with Kenya handlers:

- `Organization/$verify-facility-authority`
- `Practitioner/$verify-practitioner-authority`
- `Coverage/$check-coverage`
- `Claim/$submit-national-claim`
- `Claim/$check-national-claim-status`

Current admin helper routes used by the onboarding and resource-level Kenya UI:

- `POST /admin/projects/:projectId/kenya/afyalink/test`
- `POST /admin/projects/:projectId/kenya/afyalink/facility-lookup`
- `POST /admin/projects/:projectId/kenya/afyalink/practitioner-lookup`

These admin routes support onboarding and lookup UX. The canonical clinical workflow surface remains the FHIR
operations above.

## Setup sequence

If you are setting up Kenya from scratch, use this order.

### 1. Activate the pack

Set `Country Pack = Kenya` in project creation or in `/admin/settings`.

### 2. Configure non-secret settings

In `/admin/settings`, configure:

1. Kenya HIE environment
2. Kenya HIE credential mode
3. Kenya SHA claims environment
4. Kenya SHA claims credential mode
5. Kenya HIE agent ID if that workflow is in scope
6. optional Kenya claim submit workflow bot id
7. optional Kenya claim status workflow bot id

### 3. Configure credentials

If the project is tenant-managed, use `/admin/secrets`.

Enter HIE credentials first:

- consumer key
- username
- password

Then enter SHA claim credentials:

- access key
- secret key
- callback URL

If the project is Afiax-managed, use `/admin/super` instead.

### 4. Verify connectivity

Run `Test HIE Connection` before attempting any HIE-backed workflow.

Do this before:

- facility lookup
- practitioner lookup
- eligibility checks

### 5. Bootstrap the first facility

Use `/admin/country-pack`:

1. enter the primary Kenya facility code / MFL code
2. run DHA lookup
3. inspect the raw response if the lookup is unexpected
4. create the first `Organization` or apply the registry result to an existing one

This is the preferred onboarding path because it hides the underlying identifier model from normal users while still
persisting the correct canonical `Organization.identifier` values.

### 6. Move to resource-level workflows

Once onboarding is complete, continue on the resource pages:

- `Organization`
- `Practitioner`
- `Coverage`
- `Claim`

## Admin pages and exact purpose

Use these pages in this order:

### `/admin/settings`

Use this page for non-secret Kenya configuration.

It owns:

- country-pack selection
- HIE environment and credential mode
- SHA claims environment and credential mode
- Kenya HIE agent id
- optional claim submit bot id
- optional claim status bot id

### `/admin/secrets`

Use this page for tenant-managed Kenya credentials.

It owns:

- Kenya HIE credentials
- Kenya SHA credentials
- HIE connection testing

### `/admin/super`

Use this page only when the project runs in Afiax-managed mode.

It owns:

- Kenya HIE `Project.systemSecret`
- Kenya SHA `Project.systemSecret`

### `/admin/country-pack`

Use this page for Kenya onboarding.

It owns:

- primary facility code / MFL code capture
- raw DHA lookup display for the first facility
- first `Organization` creation or update from the registry result

This page is for setup, not for the long-term operational workflow.

## Workflow matrix

### Facility workflow

Operation:

- `Organization/$verify-facility-authority`

Page:

- `/Organization/{id}`

Required resource state:

- the `Organization` already exists
- the project is on `countryPack=kenya`

Normal user flow:

1. enter `Kenya Facility Code / MFL Code`
2. click `Save MFL Code`
3. click `Lookup Facility`
4. review the Kenya registry snapshot
5. click `Verify Facility`

What the UI persists:

- Kenya facility code in `Organization.identifier`
- Kenya facility registry snapshot in `Organization.extension`
- Kenya facility verification snapshot in `Organization.extension`

What the server creates:

- `Task`
- `AuditEvent`

Connector path:

1. resolve HIE environment and credential mode
2. load credentials from `Project.secret` or `Project.systemSecret`
3. authenticate against HIE
4. call DHA facility search using `facility_code`
5. normalize the response
6. persist workflow evidence

### Practitioner workflow

Operation:

- `Practitioner/$verify-practitioner-authority`

Page:

- `/Practitioner/{id}`

Normal user flow:

1. choose `ID` or `PASSPORT`
2. enter the identification number
3. save the lookup identity
4. run DHA practitioner lookup
5. click `Verify Practitioner`

What the UI persists:

- lookup identifier in `Practitioner.identifier`
- Kenya registration number in `Practitioner.identifier`
- Kenya practitioner registry snapshot in `Practitioner.extension`
- Kenya practitioner verification snapshot in `Practitioner.extension`

What the server creates:

- `Task`
- `AuditEvent`

Connector path:

1. resolve HIE environment and credentials
2. authenticate against HIE
3. call practitioner search with `identification_type` and `identification_number`
4. normalize the response
5. persist the registry snapshot and verification evidence

### Coverage workflow

Operation:

- `Coverage/$check-coverage`

Page:

- `/Coverage/{id}`

Supported identifier types:

- `National ID`
- `Alien ID`
- `Mandate Number`
- `Temporary ID`
- `SHA Number`
- `Refugee ID`

Normal user flow:

1. choose the Kenya eligibility lookup identifier type
2. enter the identifier number
3. save the lookup identity
4. click `Check Coverage`

What the UI persists:

- lookup identifier in `Coverage.identifier`
- Kenya eligibility snapshot in `Coverage.extension`

What the server creates:

- `CoverageEligibilityRequest`
- `CoverageEligibilityResponse`
- `Task`
- `AuditEvent`

Connector path:

1. resolve HIE environment, credential mode, and agent id
2. load credentials
3. authenticate against HIE
4. call the DHA eligibility endpoint
5. normalize the response
6. persist eligibility artifacts

### Claim submission workflow

Operation:

- `Claim/$submit-national-claim`

Page:

- `/Claim/{id}`

Required resource graph before submit:

- `Claim`
- linked `Patient`
- linked `Coverage`
- linked `Organization`
- linked `Practitioner` when present in the claim graph

Normal user flow:

1. open the `Claim`
2. click `Submit Kenya SHA Claim`
3. inspect the returned submission environment, endpoint, response status, and raw bundle
4. confirm that the persisted claim snapshot contains the bundle id

What the UI persists:

- Kenya claim submission snapshot in `Claim.extension`

What the server creates:

- `Task`
- `AuditEvent`

What the handler does:

1. resolve SHA claims environment and credential mode
2. validate the `Claim` graph
3. build a Kenya SHA-style FHIR `Bundle`
4. if SHA credentials are configured, sign the JWT and submit the bundle
5. if the submit bot is configured, trigger it after successful submit
6. persist the submission snapshot and evidence

If SHA credentials are not configured, the operation still prepares the bundle and leaves the claim in a pre-transport
state.

### Claim status workflow

Operation:

- `Claim/$check-national-claim-status`

Page:

- `/Claim/{id}`

Normal user flow:

1. ensure the `Claim` already has a Kenya submission snapshot with a bundle id
2. click `Check Kenya SHA Claim Status`
3. inspect the normalized claim state
4. inspect the local `ClaimResponse`
5. inspect workflow bot status if a claim status bot is configured

What the UI persists:

- Kenya claim status snapshot in `Claim.extension`

What the server creates or updates:

- `ClaimResponse`
- `Task`
- `AuditEvent`

What the handler does:

1. resolve SHA environment and credentials
2. load the last submitted bundle id from the claim snapshot
3. call the SHA claim-status endpoint
4. normalize the payer-side result into shared workflow state
5. upsert a local `ClaimResponse`
6. if the status bot is configured, trigger it after a successful refresh
7. persist the status snapshot and evidence

## Evidence model

The Kenya pack currently relies on a layered evidence model:

1. normalized Kenya snapshot on the primary resource
2. workflow `Task`
3. `AuditEvent`
4. raw DHA or SHA payload surfaced by the UI

Coverage and claim workflows also create additional evidence:

- `CoverageEligibilityRequest`
- `CoverageEligibilityResponse`
- `ClaimResponse`

## Bot usage

Bots are used at the asynchronous edge, not for immediate registry lookups.

Current Kenya bot hooks:

- `kenyaClaimSubmitWorkflowBotId`
- `kenyaClaimStatusWorkflowBotId`

Use bots for:

- post-submit handoff
- post-status handoff
- later polling or callback continuation

Do not use bots for:

- immediate facility lookup
- immediate practitioner lookup
- immediate eligibility checks that need user feedback on the page

## Debugging order

When a Kenya flow fails, check these in order:

1. the project is actually on `countryPack=kenya`
2. the correct HIE or SHA environment is selected
3. credentials are stored in the correct secret surface for the selected credential mode
4. the resource has the expected Kenya identifier before the operation runs
5. the raw DHA or SHA payload shown in the UI contains the expected fields
6. the created `Task` and `AuditEvent` use the same correlation id returned by the operation
7. only then inspect connector normalization logic

Use the raw payloads shown in the UI as the first transport debugging artifact. Do not start by guessing at the parser
if DHA or SHA is explicitly returning a negative result.

## File map for engineers

If you are extending the Kenya pack, start here:

- `packages/server/src/country-pack/kenya/index.ts`
- `packages/server/src/country-pack/kenya/afyalink.ts`
- `packages/server/src/country-pack/kenya/sha.ts`
- `packages/server/src/country-pack/kenya/verify-facility-authority.ts`
- `packages/server/src/country-pack/kenya/verify-practitioner-authority.ts`
- `packages/server/src/country-pack/kenya/check-coverage.ts`
- `packages/server/src/country-pack/kenya/submit-national-claim.ts`
- `packages/server/src/country-pack/kenya/check-national-claim-status.ts`
- `packages/server/src/country-pack/kenya/workflow-bot.ts`
- `packages/core/src/kenya.ts`

If you are extending the Kenya UI, start here:

- `packages/app/src/admin/CountryPackPage.tsx`
- `packages/app/src/admin/SettingsPage.tsx`
- `packages/app/src/admin/SecretsPage.tsx`
- `packages/app/src/admin/SuperAdminKenyaCredentialsForm.tsx`
- `packages/app/src/resource/OrganizationFacilityVerificationPanel.tsx`
- `packages/app/src/resource/PractitionerAuthorityVerificationPanel.tsx`
- `packages/app/src/resource/CoverageEligibilityPanel.tsx`
- `packages/app/src/resource/ClaimNationalSubmissionPanel.tsx`

## Engineering guardrails

- do not call DHA or SHA directly from the browser or mobile UI
- do not add Kenya-specific field names to the shared canonical model
- do not add ERPNext or Afiax Billing implementation logic to the Kenya pack
- do not add Afiax Pay execution logic to the Kenya pack
- do not put credentials in `Project.setting`
- do not treat a successful transport call as enough; persist workflow evidence

## Related docs

- [Country packs](./index)
- [Country pack SDK](./sdk)
- [Kenya billing and settlement](./kenya-billing-and-settlement)
- [Canonical FHIR model](../architecture/canonical-model)
