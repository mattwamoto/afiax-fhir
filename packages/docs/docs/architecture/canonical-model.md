---
sidebar_position: 2
---

# Canonical FHIR Model

The canonical model is the shared data contract for this Medplum-based platform.

Use it to decide what belongs in:

- core Medplum resources
- country packs
- tenant-specific overlays

The rule is simple: if a field or workflow only exists because of one regulator, payer, or country program, it should
not define the core model.

## Design rules

- keep the clinical source of truth country-neutral
- use shared FHIR resources as the editable system of record
- bind national requirements as overlays, not core mutations
- let apps, bots, and external integrations share the same underlying resource model
- keep core, country, and tenant concerns separate

## Layering model

This repo uses three layers:

- `Core`
  - shared clinical and operational semantics
  - generic internal operations
  - shared identifier categories
- `Country`
  - national identifiers
  - terminology bindings
  - payer and regulator rules
  - exchange mappings
- `Tenant`
  - customer-specific constraints
  - rollout toggles
  - deployment-specific defaults

Example:

- `Patient.identifier` exists in core
- `national-client-id` is a core identifier category
- the meaning of that identifier for DHA is Kenya-pack logic
- which Kenya workflows a customer enables is tenant config

The core model should not contain names like `DHA`, `SHA`, `MFL`, or `HWR` as first-class field names.

## Core resource set

The current shared model should center on these resources:

- `Patient`
- `Practitioner`
- `PractitionerRole`
- `Organization`
- `Location`
- `Coverage`
- `Encounter`
- `Task`
- `Communication`
- `Consent`
- `AuditEvent`
- `Provenance`
- `DocumentReference` or `Composition`

These cover the first operational spine:

- identity
- providers and facilities
- eligibility
- encounters
- communication
- auditability

Additional domains such as `Claim`, `ClaimResponse`, and `Invoice` should be layered in only after the verification
and interoperability path is stable.

## Identifier architecture

The core model stores identifier meaning at the category level. Country packs bind those categories to real national
codes.

| Category | Core meaning | Kenya binding example | Resources |
| --- | --- | --- | --- |
| `internal-record-id` | local platform or tenant identifier | MRN | most master resources |
| `national-client-id` | national patient authority identifier | DHA client registry ID | `Patient` |
| `facility-authority-id` | national facility authority identifier | MFL code | `Organization`, `Location` |
| `practitioner-authority-id` | national professional authority identifier | HWR ID | `Practitioner` |
| `payer-member-id` | payer or beneficiary identifier | SHA member ID | `Coverage` |

Implementation rule:

- code against the category, not the country label
- map the category to a local code in the country pack
- do not create new core fields just to expose regulator names

## Operation model

Applications and bots should call generic internal operations. Country packs provide the country-specific behavior
behind those contracts.

| Generic operation | Purpose | Kenya implementation |
| --- | --- | --- |
| `$resolve-patient-identity` | resolve or verify patient identity | `Patient/$resolve-cr` |
| `$verify-facility-authority` | verify a facility identifier | `Organization/$verify-facility-authority` |
| `$verify-practitioner-authority` | verify clinician credentials | `Practitioner/$verify-hwr` |
| `$check-coverage` | perform eligibility or coverage verification | `Coverage/$check-eligibility` |
| `$publish-national-record` | submit a national clinical exchange payload | `Encounter/$publish-shr` |
| `$submit-national-claim` | submit a country-specific claim bundle | `Claim/$submit-sha` |

The public contract stays generic even when the backend implementation is country-specific.

Current implemented example:

- `Organization/$verify-facility-authority`
- resolve `facility-authority-id` from `Organization.identifier`
- Kenya pack maps that to the MFL code
- connector authenticates with AfyaLink
- result is normalized and written back through workflow records

## Workflow evidence model

External calls should not only return data. They should also leave a trace in the canonical workflow model.

Use:

- `Task` for workflow state
- `AuditEvent` for integration audit trail
- `Provenance` when source or derivation tracking matters

This is the recommended pattern for regulator lookups, eligibility checks, exchange submissions, and claim workflows.

## What belongs outside the core

Keep these out of the canonical model:

- country-specific endpoint URLs
- regulator-specific payload shapes
- country program names as field names
- tenant shortcuts that collapse core and country layers
- UI-specific convenience structures that duplicate the source of truth

## Guardrails

- Keep Medplum resources as the editable source of truth.
- Generate national bundles from canonical resources using mappings and Bots.
- Store country-specific reconciliation state as extensions or workflow resources.
- Use `Task`, `AuditEvent`, and `Provenance` to trace external verification and exchange steps.
- Avoid tenant shortcuts that weaken the core model.
- Require every country pack to map from the canonical model instead of redefining it.
- Keep country-pack contracts documented and versioned so the platform can add markets without changing core semantics.

## Practical test

When adding a new field or workflow, ask:

1. Would this still exist if Kenya were removed?
2. Would another country likely need the same concept under a different name?
3. Can this be represented as a shared resource plus a country binding?

If the answer to `1` is no, it probably does not belong in core.
