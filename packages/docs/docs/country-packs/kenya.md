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
Project.setting.kenyaAfyaLinkEnvironment=uat | production
Project.setting.kenyaAfyaLinkCredentialMode=tenant-managed | afiax-managed
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

## Current implementation in this repo

Implemented now:

- country-pack selection during project creation
- country-pack selection in `/admin/settings`
- project setup checklist in `/admin/country-pack`
- tenant-managed DHA credentials in `/admin/secrets`
- Afiax-managed DHA credentials in `/admin/super`
- generic `Organization/$verify-facility-authority`
- Kenya-specific AfyaLink auth and facility search
- verification `Task` and `AuditEvent` creation

## Current operation bindings

Kenya logic currently sits behind country-neutral operations such as:

- `$resolve-patient-identity`
- `$verify-facility-authority`
- `$verify-practitioner-authority`
- `$check-coverage`
- `$publish-national-record`
- `$submit-national-claim`

Only `$verify-facility-authority` has an implemented Kenya connector path today.

## Facility verification flow

Current path for `Organization/$verify-facility-authority`:

1. Resolve the active project.
2. Read `countryPack`, DHA environment, and credential mode from `Project.setting`.
3. Load credentials from `Project.secret` or `Project.systemSecret`.
4. Authenticate against AfyaLink.
5. Call facility search with `facility_code`.
6. Normalize the result into shared verification status.
7. Write a verification `Task` and `AuditEvent`.

The expected identifier is the MFL code bound to `facility-authority-id`.

## Admin UI flow

For a Kenya project:

- `/admin/settings`
  - selects `Kenya`
  - sets DHA environment
  - sets credential mode
- `/admin/country-pack`
  - shows setup status and next steps
- `/admin/secrets`
  - stores tenant-managed DHA credentials
  - supports `Test Connection`
- `/admin/super`
  - stores Afiax-managed DHA credentials in `Project.systemSecret`

## Guardrails

- no direct DHA calls from browser or mobile UI
- no Kenya-specific field names in the shared canonical model
- no production rollout without audit and reconciliation
- no coupling Kenya pack logic to Afiax FHIR core routing or UI components

## Recommended next steps

1. Implement `Practitioner/$verify-practitioner-authority`.
2. Implement `Coverage/$check-coverage`.
3. Add a UI action to run facility verification from `Organization`.
4. Add reconciliation and retry surfaces around external calls.

## Related docs

- [Country packs](./index)
- [Country pack SDK](./sdk)
- [Kenya billing and settlement](./kenya-billing-and-settlement)
- [Canonical FHIR model](../architecture/canonical-model)
