---
sidebar_position: 3
---

# Kenya Reference Pack

Kenya is the first active country pack in this repo.

This page is the developer-facing implementation guide for the current Kenya pack.

Read it as:

- what is implemented
- how to configure it
- how to run each Kenya workflow end to end
- where Kenya logic starts and where core Medplum behavior stops

## Purpose

The Kenya pack exists to prove that Afiax FHIR can support country-specific integrations without turning the core into
a Kenya-only fork.

## Scope

Current Kenya pack scope in this repo:

- DHA client registry
- DHA AfyaLink facility registry and MFL verification
- health worker registry verification
- coverage and eligibility services
- shared health record outpatient publishing
- SHA claim submission
- Kenya settlement sync handoff toward Afiax Billing

## Canonical bindings

The pack binds shared identifier categories to Kenya semantics:

- `national-client-id` to DHA client registry identity
- `facility-authority-id` to MFL code
- `practitioner-authority-id` to health worker registry identity
- `payer-member-id` to SHA or scheme member identity

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

The Kenya HIE environment covers auth, facility registry, practitioner registry, eligibility, and client-registry
operations.

The Kenya SHA claims environment is separate because DHA publishes different endpoint families for claim submission,
status lookup, and related payer workflows.

## What is implemented today

Implemented now:

- country-pack selection during project creation
- country-pack selection in `/admin/settings`
- Kenya setup wizard in `/admin/country-pack`
- tenant-managed HIE credentials in `/admin/secrets`
- Afiax-managed HIE credentials in `/admin/super`
- DHA facility lookup and first-organization bootstrap from `/admin/country-pack`
- `Organization`-level facility code capture, lookup, and verification UI
- `Practitioner`-level identity capture, lookup, and verification UI
- `Coverage`-level eligibility lookup capture and DHA eligibility UI
- `Claim`-level Kenya SHA claim submission UI
- `Claim`-level Kenya SHA claim status check UI
- optional Kenya claim submit workflow bot hook
- optional Kenya claim status workflow bot hook
- generic `Organization/$verify-facility-authority`
- generic `Practitioner/$verify-practitioner-authority`
- generic `Coverage/$check-coverage`
- generic `Claim/$submit-national-claim`
- generic `Claim/$check-national-claim-status`
- Kenya-specific AfyaLink auth and facility search
- Kenya-specific AfyaLink practitioner search
- Kenya-specific AfyaLink eligibility lookup
- verification `Task` and `AuditEvent` creation
- eligibility `Task`, `CoverageEligibilityRequest`, `CoverageEligibilityResponse`, and `AuditEvent` creation
- claim submission `Task`, persisted claim snapshot, and `AuditEvent` creation
- claim status `Task`, persisted claim status snapshot, local `ClaimResponse`, and `AuditEvent` creation

Not implemented yet:

- SHA callback ingestion
- Kenya client-registry workflow
- Kenya SHR publishing
- Kenya queue views and reconciliation dashboards

## Operation bindings

Kenya logic currently sits behind country-neutral operations such as:

- `$resolve-patient-identity`
- `$verify-facility-authority`
- `$verify-practitioner-authority`
- `$check-coverage`
- `$publish-national-record`
- `$submit-national-claim`

`$verify-facility-authority`, `$verify-practitioner-authority`, `$check-coverage`, `$submit-national-claim`, and
`$check-national-claim-status` have implemented Kenya connector paths today.

## Setup sequence

If you are setting up Kenya from scratch, use this order:

1. Set `Country Pack = Kenya` in project creation or `/admin/settings`.
2. Select Kenya HIE environment and Kenya SHA claims environment.
3. Choose credential mode for HIE and SHA separately.
4. Enter HIE credentials in `/admin/secrets` if the project is tenant-managed.
5. Enter SHA credentials in `/admin/secrets` if the project is tenant-managed.
6. Use `Test HIE Connection` before attempting any Kenya HIE workflow.
7. Use `/admin/country-pack` to create or update the first facility from the Kenya facility code.
8. Move to resource-level workflows for `Organization`, `Practitioner`, `Coverage`, and `Claim`.

### Admin pages and exact purpose

Use these pages in this order:

- `/admin/settings`
  - enable Kenya
  - set Kenya HIE environment
  - set Kenya SHA claims environment
  - set HIE credential mode
  - set SHA credential mode
  - set Kenya HIE agent ID
  - optionally set Kenya claim submit bot and Kenya claim status bot
- `/admin/secrets`
  - enter tenant-managed Kenya HIE credentials
  - enter tenant-managed Kenya SHA credentials
  - run `Test HIE Connection`
- `/admin/super`
  - use only when the project is in Afiax-managed mode
  - manage `Project.systemSecret` for Kenya HIE and Kenya SHA
- `/admin/country-pack`
  - run the Kenya onboarding wizard
  - enter primary facility code / MFL code
  - view raw DHA lookup payload
  - create or update the first `Organization`

## Facility workflow

Current path for `Organization/$verify-facility-authority`:

1. Resolve the active project.
2. Read `countryPack`, Kenya HIE environment, and HIE credential mode from `Project.setting`.
3. Load credentials from `Project.secret` or `Project.systemSecret`.
4. Authenticate against AfyaLink.
5. Call facility search with `facility_code`.
6. Normalize the result into shared verification status.
7. Write a verification `Task` and `AuditEvent`.

The expected identifier is the MFL code bound to `facility-authority-id`.

### User flow on the `Organization` page

Page: `/Organization/{id}`

Expected resource preparation:

- the `Organization` must already exist
- the project must have `countryPack=kenya`

Normal workflow:

1. Enter `Kenya Facility Code / MFL Code`.
2. Click `Save MFL Code`.
3. Click `Lookup Facility`.
4. Review the Kenya registry snapshot shown on the page.
5. Click `Verify Facility`.

What the UI persists:

- Kenya facility identifier in `Organization.identifier`
- Kenya facility registry snapshot in `Organization.extension`
- Kenya verification snapshot in `Organization.extension`

What the server creates:

- `Task`
- `AuditEvent`

If lookup succeeds but verification fails, treat those as two separate concerns:

- lookup proves the registry record was fetched
- verification proves the auditable workflow completed and normalized correctly

## Practitioner workflow

Current path for `Practitioner/$verify-practitioner-authority`:

1. Resolve the active project.
2. Read `countryPack`, Kenya HIE environment, and HIE credential mode from `Project.setting`.
3. Load credentials from `Project.secret` or `Project.systemSecret`.
4. Authenticate against AfyaLink.
5. Call practitioner search with `identification_type` and `identification_number`.
6. Persist the registry snapshot on the `Practitioner`.
7. Normalize the result into shared verification status.
8. Write a verification `Task` and `AuditEvent`.

The current Kenya UX captures the lookup identity as a national ID or passport number and stores the returned
registration number as the practitioner authority identifier.

### User flow on the `Practitioner` page

Page: `/Practitioner/{id}`

Normal workflow:

1. Choose `ID` or `PASSPORT`.
2. Enter the identification number.
3. Save the lookup identity.
4. Run DHA practitioner lookup.
5. Run `Verify Practitioner`.

What the UI persists:

- lookup identifier in `Practitioner.identifier`
- Kenya registration number in `Practitioner.identifier`
- Kenya practitioner registry snapshot in `Practitioner.extension`
- Kenya practitioner verification snapshot in `Practitioner.extension`

## Coverage workflow

Current path for `Coverage/$check-coverage`:

1. Resolve the active project.
2. Read `countryPack`, Kenya HIE environment, HIE credential mode, and agent ID from `Project.setting`.
3. Load credentials from `Project.secret` or `Project.systemSecret`.
4. Authenticate against AfyaLink.
5. Call the DHA eligibility endpoint with `identification_type` and `identification_number`.
6. Persist the eligibility snapshot on the `Coverage`.
7. Create a `CoverageEligibilityRequest`, `CoverageEligibilityResponse`, `Task`, and `AuditEvent`.

The current Kenya UX captures the eligibility lookup identity directly on the `Coverage`. Supported identifier types
are:

- `National ID`
- `Alien ID`
- `Mandate Number`
- `Temporary ID`
- `SHA Number`
- `Refugee ID`

### User flow on the `Coverage` page

Page: `/Coverage/{id}`

Normal workflow:

1. Choose the Kenya eligibility lookup identifier type.
2. Enter the identifier number.
3. Save the lookup identity.
4. Run `Check Coverage`.

What the UI persists:

- lookup identifier in `Coverage.identifier`
- Kenya eligibility snapshot in `Coverage.extension`

What the server creates:

- `CoverageEligibilityRequest`
- `CoverageEligibilityResponse`
- `Task`
- `AuditEvent`

## Claim submission workflow

Current path for `Claim/$submit-national-claim`:

1. Resolve the active project.
2. Read the Kenya SHA claims environment from `Project.setting`.
3. Validate the current `Claim` and its linked `Patient`, `Coverage`, `Organization`, and `Practitioner` resources.
4. Build a Kenya SHA-style FHIR `Bundle` using the SHA environment URL prefix.
5. If Kenya SHA credentials are configured, sign a DHA-style JWT using the SHA access key and secret key.
6. Submit the bundle to the SHA bundle endpoint.
7. If `Project.setting.kenyaClaimSubmitWorkflowBotId` is configured, execute that bot after a successful submit.
8. Persist the submission snapshot on the `Claim`.
9. Create a `Task` and `AuditEvent`.

If Kenya SHA credentials are not configured, the same operation still returns a prepared bundle and leaves the claim in
`ready-for-sha-transport`. When credentials are configured, the claim moves to `awaiting-sha-status` and the UI shows
the live SHA response and status-tracking endpoint. When the optional claim submit workflow bot is configured, the UI
also shows whether the downstream bot handoff was triggered successfully.

### User flow on the `Claim` page for submission

Page: `/Claim/{id}`

Required resource graph before submit:

- `Claim`
- linked `Patient`
- linked `Coverage`
- linked `Organization`
- linked `Practitioner` when present in the claim graph

Normal workflow:

1. Open the `Claim`.
2. Click `Submit Kenya SHA Claim`.
3. Inspect the returned submission environment, endpoint, response status, and raw bundle.
4. Confirm that the persisted claim snapshot contains the bundle ID.

What the UI persists:

- Kenya claim submission snapshot in `Claim.extension`

What the server creates:

- `Task`
- `AuditEvent`

## Claim status workflow

Current path for `Claim/$check-national-claim-status`:

1. Resolve the active project.
2. Read the Kenya SHA claims environment from `Project.setting`.
3. Load the last submitted Kenya bundle ID from the persisted claim snapshot.
4. Sign a DHA-style JWT using the SHA access key and secret key.
5. Call the SHA claim-status endpoint.
6. Normalize the returned claim state into shared workflow state such as `queued`, `in-review`, `adjudicated`, or `rejected`.
7. Upsert a local `ClaimResponse` for the latest payer-side status evidence.
8. If `Project.setting.kenyaClaimStatusWorkflowBotId` is configured, execute that bot after a successful status refresh. If that setting is not present, older projects can still fall back to the legacy shared Kenya claim bot setting.
9. Persist the status snapshot on the `Claim`.
10. Create a `Task` and `AuditEvent`.

The `Claim` page exposes this as an explicit `Check Kenya SHA Claim Status` action. The panel shows the current
claim state, local `ClaimResponse` reference, raw SHA status response, and workflow bot handoff state.

### User flow on the `Claim` page for status refresh

Normal workflow:

1. Ensure the `Claim` already has a Kenya submission snapshot with a bundle ID.
2. Click `Check Kenya SHA Claim Status`.
3. Inspect the normalized state:
   - `queued`
   - `in-review`
   - `adjudicated`
   - `rejected`
4. Inspect the local `ClaimResponse` created or updated by the refresh.
5. Inspect workflow bot status if a Kenya claim status bot is configured.

What the UI persists:

- Kenya claim status snapshot in `Claim.extension`

What the server creates or updates:

- `ClaimResponse`
- `Task`
- `AuditEvent`

## Debugging and operational checks

When a Kenya flow fails, check these in order:

1. the project is actually on `countryPack=kenya`
2. HIE and SHA environments are correct for the action you are running
3. credentials are stored in the correct secret surface for the selected credential mode
4. the resource has the expected Kenya identifier before the operation is called
5. the raw DHA or SHA payload shown in the UI contains the expected fields
6. the created `Task` and `AuditEvent` use the same correlation ID returned by the operation

Use the raw payloads shown in the UI as the first debugging artifact. Do not start by guessing at the parser if DHA or
SHA is explicitly returning a negative result.

## Engineering guardrails

- no direct DHA calls from browser or mobile UI
- no Kenya-specific field names in the shared canonical model
- no direct ERPNext or Afiax Billing logic in the Kenya pack implementation
- no country-specific logic in generic core routes unless that logic is pack-dispatched
- no production rollout without audit and reconciliation

## Recommended next steps

1. Add SHA callback support for asynchronous payer updates when DHA makes that path available.
2. Add reconciliation and retry surfaces around external calls.
3. Add dedicated queue views for failed or pending Kenya operations.
4. Add facility, practitioner, coverage, and claim work queues for operational follow-up.

## Related docs

- [Country packs](./index)
- [Country pack SDK](./sdk)
- [Kenya billing and settlement](./kenya-billing-and-settlement)
- [Canonical FHIR model](../architecture/canonical-model)
