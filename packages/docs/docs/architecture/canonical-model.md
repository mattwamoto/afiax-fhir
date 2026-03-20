---
sidebar_position: 2
---

# Canonical FHIR Model

The canonical model is the shared data contract for Afiax FHIR.

Use it to decide what belongs in:

- core Afiax FHIR resources
- country packs
- tenant-specific overlays
- adjacent enterprise systems

The core rule is simple: if a field, identifier, or workflow only exists because of one regulator, payer, or country
program, it should not define the core model.

## What the canonical model is for

The canonical model gives Afiax Enterprise one stable clinical and reimbursement ledger even when:

- country packs differ
- deployment models differ
- ERP, payment, and partner systems differ
- UI products differ

This is the mechanism that lets Afiax FHIR remain the source of truth while the platform grows around it.

## Design rules

The canonical model follows these rules:

- keep the clinical source of truth country-neutral
- use shared FHIR resources as the editable system of record
- bind national requirements as overlays, not core mutations
- let apps, bots, and external integrations share the same underlying resource model
- keep core, country, tenant, and enterprise concerns separate
- keep exchange payloads as derived artifacts, not primary records

## Layering model

This repo uses four layers around the canonical model.

### Core

Core owns:

- shared clinical and operational semantics
- generic internal operations
- shared identifier categories
- workflow evidence model

### Country

Country packs own:

- national identifiers
- terminology bindings
- payer and regulator rules
- exchange mappings
- connector auth and normalization

### Tenant

Tenant overlays own:

- customer-specific constraints
- rollout toggles
- deployment-specific defaults
- secret ownership mode

### Enterprise

Adjacent enterprise systems own:

- payments execution
- ERP execution
- partner integration execution

They consume canonical state and write back normalized outcomes. They do not redefine the canonical model.

## Current implementation state

Implemented in this repo now:

- canonical resource workflows for `Organization`, `Practitioner`, `Coverage`, and `Claim`
- country-pack overlays through Kenya
- pack-specific identifiers and extension snapshots layered on shared resources
- workflow evidence through `Task`, `AuditEvent`, `CoverageEligibilityRequest`, `CoverageEligibilityResponse`, and `ClaimResponse`
- claim and reimbursement workflows on top of the shared model

That means the canonical model is already wider than basic identity and encounter workflows. It already includes real
reimbursement surfaces because the Kenya pack now uses them.

## Current core resource domains

The shared model should center on these domains.

### Identity and care context

- `Patient`
- `Practitioner`
- `PractitionerRole`
- `Organization`
- `Location`
- `Encounter`
- `Consent`
- `Communication`

### Workflow and traceability

- `Task`
- `AuditEvent`
- `Provenance`

### Financial and reimbursement context

- `Coverage`
- `CoverageEligibilityRequest`
- `CoverageEligibilityResponse`
- `Claim`
- `ClaimResponse`
- `ChargeItem`
- `Account`
- `Invoice`
- `PaymentReconciliation`

### Clinical and document exchange context

- `DocumentReference`
- `Composition`

This does not mean every deployment must use all of them at once. It means these resources already fit the canonical
model and do not need to be treated as country-only concepts.

## Identifier architecture

The canonical model stores identifier meaning at the category level. Country packs bind those categories to concrete
country identifiers.

| Category | Core meaning | Country binding example | Resources |
| --- | --- | --- | --- |
| `internal-record-id` | local platform or tenant identifier | MRN | most master resources |
| `national-client-id` | national patient authority identifier | national client registry ID | `Patient` |
| `facility-authority-id` | national facility authority identifier | MFL code | `Organization`, `Location` |
| `practitioner-authority-id` | national professional authority identifier | health worker registration number | `Practitioner` |
| `payer-member-id` | payer or beneficiary identifier | national or scheme member ID | `Coverage` |

Implementation rule:

- code against the category, not the country label
- map the category to a concrete identifier in the country pack
- do not create new core fields just to expose regulator names

## Country-pack write-back model

Country packs should not mutate the canonical model by adding country-specific top-level fields.

They should:

- use shared resources such as `Organization`, `Practitioner`, `Coverage`, and `Claim`
- use canonical identifiers
- store country-specific workflow snapshots as extensions
- create supporting evidence resources

This is the current Kenya pattern:

- Kenya facility code stored in `Organization.identifier`
- Kenya facility registry and verification state stored in `Organization.extension`
- Kenya practitioner lookup and verification state stored in `Practitioner.extension`
- Kenya eligibility state stored in `Coverage.extension`
- Kenya claim submission and claim-status state stored in `Claim.extension`

That is the correct shape: canonical resource first, country extension second.

## Operation model

Applications and bots should call generic internal operations. Country packs provide the country-specific behavior
behind those contracts.

| Generic operation | Purpose | Country implementation |
| --- | --- | --- |
| `$resolve-patient-identity` | resolve or verify patient identity | country pack handler |
| `$verify-facility-authority` | verify a facility identifier | country pack handler |
| `$verify-practitioner-authority` | verify clinician credentials | country pack handler |
| `$check-coverage` | perform eligibility or coverage verification | country pack handler |
| `$publish-national-record` | submit a national clinical exchange payload | country pack handler |
| `$submit-national-claim` | submit a country-specific claim bundle | country pack handler |
| `$check-national-claim-status` | refresh country claim status | country pack handler |

The public contract stays generic even when the backend implementation is country-specific.

## Workflow evidence model

External calls should not only return data. They should also leave a trace in the canonical workflow model.

Use:

- `Task` for workflow state
- `AuditEvent` for integration audit trail
- `Provenance` when source or derivation tracking matters
- `CoverageEligibilityRequest` and `CoverageEligibilityResponse` for eligibility evidence
- `ClaimResponse` for payer-side claim outcome evidence

This is the recommended pattern for regulator lookups, eligibility checks, exchange submissions, and claim workflows.

## What belongs outside the canonical model

Keep these out of the canonical model:

- country-specific endpoint URLs
- regulator-specific payload shapes
- country program names as field names
- ERPNext invoice, payroll, CRM, training, and inventory object shapes
- Afiax Pay wallet ledger internals
- partner-product and quote objects
- tenant shortcuts that collapse core and country layers
- UI-specific convenience structures that duplicate the source of truth

## Relationship to enterprise systems

The canonical model does not try to absorb ERP, payment, or partner systems.

Instead:

- Afiax Billing derives finance execution from canonical resources
- Afiax Pay derives payment execution from canonical resources plus country-pack context
- partner systems such as Lami derive embedded-insurance workflows from canonical context

Those systems write back normalized outcomes when needed. They do not redefine `Patient`, `Encounter`, `Coverage`, or
`Claim`.

## Decision checklist

When adding a new field, identifier, or workflow, ask:

1. would this still exist if the current active country pack were removed
2. would another country likely need the same concept under a different binding
3. can this be represented as a shared resource plus a country-specific identifier or extension
4. is this actually an ERP, payment, or partner-integration concern rather than a canonical data concern

Interpretation:

- if 1 is no, it probably does not belong in core
- if 2 is yes, it is a strong candidate for the canonical model
- if 3 is yes, prefer the canonical resource plus country-pack overlay
- if 4 is yes, keep it outside the canonical model and write back only the normalized outcome

## Guardrails

- keep Afiax FHIR resources as the editable source of truth
- generate national bundles from canonical resources using mappings, handlers, and bots
- derive ERP and finance views from canonical resources rather than editing clinical truth in ERP
- store country-specific reconciliation state as extensions or workflow resources
- require every country pack to map from the canonical model instead of redefining it
- keep country-pack contracts documented and versioned so the platform can add markets without changing core semantics

## Related docs

- [Architecture overview](./index)
- [Platform foundation](./platform-foundation)
- [Enterprise platform](./enterprise-platform)
- [Afiax financial architecture](./financial-architecture)
- [Integration boundaries](./integration-boundaries)
- [Country packs](../country-packs)
