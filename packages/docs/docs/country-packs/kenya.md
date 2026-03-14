---
sidebar_position: 3
---

# Kenya Reference Pack

The Kenya pack is the first reference implementation of the Afiax country-pack SDK.

## Role in the platform

Kenya is important because it validates the country-pack model. It should not redefine the broader Afiax platform or
push Kenya-specific names into the shared core.

## Initial scope

The first Kenya pack should cover:

- DHA client registry
- DHA AfyaLink facility registry and MFL verification
- health worker registry verification
- coverage and eligibility services
- shared health record outpatient publishing
- SHA claim submission

## Kenya-specific bindings

The Kenya pack binds canonical identifier categories to local meaning:

- `national-client-id` to DHA client registry identity
- `facility-authority-id` to MFL code
- `practitioner-authority-id` to health worker registry identity
- `payer-member-id` to SHA or scheme member identity

## Required runtime behavior

### Connectors

Kenya connectors should:

- validate and normalize all external interactions
- acquire DHA credentials and tokens through AfyaLink connector flows
- preserve correlation IDs
- store reconciliation state
- map remote failures into shared platform error semantics

### Operations

Kenya-specific implementations should sit behind country-neutral internal operations such as:

- `$resolve-patient-identity`
- `$verify-facility-authority`
- `$verify-practitioner-authority`
- `$check-coverage`
- `$publish-national-record`
- `$submit-national-claim`

### Bots

Bots should remain separate for:

- verification
- eligibility
- exchange submission
- claims submission
- reconciliation
- audit evidence

## Current Medplum alignment

The current Kenya reference path in this repo uses:

- `Organization/$verify-facility-authority` as the generic internal operation
- `Project.setting.countryPack=kenya` to select the Kenya implementation
- `Project.secret` to hold Kenya AfyaLink credentials
- DHA AfyaLink authentication followed by facility search using `facility_code`
- normalized output plus a verification `Task` and `AuditEvent`

The current project secret names are:

- `kenyaAfyaLinkBaseUrl`
- `kenyaAfyaLinkConsumerKey`
- `kenyaAfyaLinkUsername`
- `kenyaAfyaLinkPassword`

The canonical identifier expected by the current facility verification flow is the MFL code bound to
`facility-authority-id`.

## Recommended build order

1. Scaffold the Kenya pack structure.
2. Bind canonical profiles to DHA, MFL, HWR, and SHA semantics.
3. Implement registry verification connectors and operations.
4. Implement eligibility workflows.
5. Implement encounter-driven SHR publishing.
6. Add claims after the clinical exchange spine is stable.

## Guardrails

- no direct Kenyan national API calls from UI applications
- no Kenya-specific field names inside the canonical core
- no production go-live without audit and reconciliation
- no using Kenya payloads as the user-facing documentation model

## Related docs

- [Country packs](./index)
- [Country pack SDK](./sdk)
- [Canonical FHIR model](../architecture/canonical-model)
