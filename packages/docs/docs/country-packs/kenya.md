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
- generic `Organization/$verify-facility-authority`
- generic `Practitioner/$verify-practitioner-authority`
- Kenya-specific AfyaLink auth and facility search
- Kenya-specific AfyaLink practitioner search
- verification `Task` and `AuditEvent` creation

## Current operation bindings

Kenya logic currently sits behind country-neutral operations such as:

- `$resolve-patient-identity`
- `$verify-facility-authority`
- `$verify-practitioner-authority`
- `$check-coverage`
- `$publish-national-record`
- `$submit-national-claim`

`$verify-facility-authority` and `$verify-practitioner-authority` have implemented Kenya connector paths today.

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

## Guardrails

- no direct DHA calls from browser or mobile UI
- no Kenya-specific field names in the shared canonical model
- no production rollout without audit and reconciliation
- no coupling Kenya pack logic to Afiax FHIR core routing or UI components

## Recommended next steps

1. Implement `Coverage/$check-coverage`.
2. Add reconciliation and retry surfaces around external calls.
3. Add a Kenya setup flow for practitioner onboarding after facility bootstrap.
4. Add facility and practitioner verification queue views for operational follow-up.

## Related docs

- [Country packs](./index)
- [Country pack SDK](./sdk)
- [Kenya billing and settlement](./kenya-billing-and-settlement)
- [Canonical FHIR model](../architecture/canonical-model)
