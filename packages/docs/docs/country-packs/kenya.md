---
sidebar_position: 3
---

# Kenya Reference Pack

Kenya is the first active country pack in this repo.

This page documents the current implementation contract, not the long-term product vision.

## Purpose

The Kenya pack exists to prove that Afiax FHIR can support country-specific integrations without turning the core into
a Kenya-only fork.

## Scope

Current and planned Kenya scope:

- DHA client registry
- DHA AfyaLink facility registry and MFL verification
- health worker registry verification
- coverage and eligibility services
- shared health record outpatient publishing
- SHA claim submission
- Kenya settlement sync with Afiax Billing

## Canonical bindings

The pack binds shared identifier categories to Kenya semantics:

- `national-client-id` to DHA client registry identity
- `facility-authority-id` to MFL code
- `practitioner-authority-id` to health worker registry identity
- `payer-member-id` to SHA or scheme member identity

## Current runtime contract

These settings activate Kenya behavior:

```text
Project.setting.countryPack=kenya
Project.setting.kenyaHieEnvironment=uat | production
Project.setting.kenyaHieCredentialMode=tenant-managed | afiax-managed
Project.setting.kenyaHieAgentId=<agent-id>
Project.setting.kenyaShaClaimsEnvironment=uat | production
```

Tenant-managed Kenya credentials currently use:

```text
Project.secret.kenyaAfyaLinkConsumerKey
Project.secret.kenyaAfyaLinkUsername
Project.secret.kenyaAfyaLinkPassword
```

Afiax-managed Kenya credentials use the same names in `Project.systemSecret`.

The DHA endpoint is derived from environment and platform configuration. Normal tenant setup does not require a typed
base URL.

The Kenya HIE environment covers auth, facility registry, practitioner registry, eligibility, and client-registry
operations.

The Kenya SHA claims environment is separate because DHA publishes different endpoint families for claim submission
surfaces.

## Current implementation in this repo

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
- `Claim`-level Kenya SHA claim bundle preparation UI
- generic `Organization/$verify-facility-authority`
- generic `Practitioner/$verify-practitioner-authority`
- generic `Coverage/$check-coverage`
- generic `Claim/$submit-national-claim`
- Kenya-specific AfyaLink auth and facility search
- Kenya-specific AfyaLink practitioner search
- Kenya-specific AfyaLink eligibility lookup
- verification `Task` and `AuditEvent` creation
- eligibility `Task`, `CoverageEligibilityRequest`, `CoverageEligibilityResponse`, and `AuditEvent` creation
- claim submission preparation `Task`, persisted claim snapshot, and `AuditEvent` creation

## Current operation bindings

Kenya logic currently sits behind country-neutral operations such as:

- `$resolve-patient-identity`
- `$verify-facility-authority`
- `$verify-practitioner-authority`
- `$check-coverage`
- `$publish-national-record`
- `$submit-national-claim`

`$verify-facility-authority`, `$verify-practitioner-authority`, `$check-coverage`, and `$submit-national-claim` have implemented Kenya
connector paths today.

## Facility verification flow

Current path for `Organization/$verify-facility-authority`:

1. Resolve the active project.
2. Read `countryPack`, Kenya HIE environment, and HIE credential mode from `Project.setting`.
3. Load credentials from `Project.secret` or `Project.systemSecret`.
4. Authenticate against AfyaLink.
5. Call facility search with `facility_code`.
6. Normalize the result into shared verification status.
7. Write a verification `Task` and `AuditEvent`.

The expected identifier is the MFL code bound to `facility-authority-id`.

## Practitioner verification flow

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

## Coverage eligibility flow

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

## National claim submission flow

Current path for `Claim/$submit-national-claim`:

1. Resolve the active project.
2. Read the Kenya SHA claims environment from `Project.setting`.
3. Validate the current `Claim` and its linked `Patient`, `Coverage`, `Organization`, and `Practitioner` resources.
4. Build a Kenya SHA-style FHIR `Bundle` using the SHA environment URL prefix.
5. Persist the submission preparation snapshot on the `Claim`.
6. Create a `Task` and `AuditEvent`.

The current implementation prepares the national claim bundle inside Afiax FHIR. It does not yet perform the final
remote SHA transport call.

## Admin UI flow

For a Kenya project:

- `/admin/settings`
  - selects `Kenya`
  - sets Kenya HIE environment
  - sets Kenya SHA claims environment
  - sets HIE credential mode
  - sets Kenya HIE agent ID
- `/admin/country-pack`
  - shows setup status and next steps
  - accepts the primary Kenya facility code / MFL code
  - runs DHA facility lookup
  - shows the raw DHA response for onboarding troubleshooting
  - creates or updates the first `Organization` from registry data
- `/admin/secrets`
  - stores tenant-managed HIE credentials
  - supports `Test HIE Connection`
- `/admin/super`
  - stores Afiax-managed HIE credentials in `Project.systemSecret`
- `/Organization/{id}`
  - captures the Kenya facility code directly on the resource
  - runs DHA lookup
  - shows the verification summary and raw DHA lookup payload
  - runs the audited `Verify Facility` action
- `/Practitioner/{id}`
  - captures the practitioner identification type and number directly on the resource
  - runs DHA practitioner lookup
  - persists the returned registry snapshot on the resource
  - shows the verification summary and raw DHA lookup payload
  - runs the audited `Verify Practitioner` action
- `/Coverage/{id}`
  - captures the Kenya eligibility identification type and number directly on the resource
  - runs DHA eligibility lookup
  - persists the eligibility snapshot on the resource
  - shows the eligibility summary and raw DHA eligibility payload
  - runs the audited `Check Coverage` action
- `/Claim/{id}`
  - prepares the Kenya SHA claim bundle from the current Medplum claim graph
  - shows the submission environment, bundle summary, and raw bundle payload
  - records the workflow snapshot and task on the resource

## Guardrails

- no direct DHA calls from browser or mobile UI
- no Kenya-specific field names in the shared canonical model
- no production rollout without audit and reconciliation
- no coupling Kenya pack logic to Afiax FHIR core routing or UI components

## Recommended next steps

1. Add reconciliation and retry surfaces around external calls.
2. Add a Kenya setup flow for practitioner onboarding after facility bootstrap.
3. Add facility, practitioner, and coverage queue views for operational follow-up.
4. Add live SHA transport and response mapping on top of the current claim bundle preparation flow.

## Related docs

- [Country packs](./index)
- [Country pack SDK](./sdk)
- [Kenya billing and settlement](./kenya-billing-and-settlement)
- [Canonical FHIR model](../architecture/canonical-model)
