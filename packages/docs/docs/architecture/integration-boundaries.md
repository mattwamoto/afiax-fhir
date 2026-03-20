---
sidebar_position: 3
---

# Afiax FHIR Integration Boundaries

This page defines what Afiax FHIR should own and what should stay outside this repo.

Use it as the decision guide whenever you are adding a feature, bot, connector, callback handler, finance workflow, or
integration service.

## Core rule

Afiax FHIR is the clinical core and workflow ledger.

If something is part of the editable clinical source of truth or must be auditable as part of a clinical or
reimbursement workflow, it belongs in Afiax FHIR.

If something is transport, commerce, ERP, payments execution, partner integration, mobile presentation state, or a
country-specific operational implementation detail, it probably belongs outside Afiax FHIR.

## What Afiax FHIR should own

Afiax FHIR should own:

- canonical clinical and operational FHIR resources
- shared resource semantics and country-neutral validation
- generic internal operations such as verification, eligibility, claim submission entry points, and publishing entry points
- access control, tenant isolation, audit, and provenance
- normalized workflow state written through `Task`, `AuditEvent`, `ClaimResponse`, and related resources
- country-pack dispatch and country-specific configuration selection
- bot execution context and bot invocation contracts
- the final normalized record of external outcomes when those outcomes affect clinical or reimbursement workflows

In practice:

- Afiax FHIR stores the canonical record
- Afiax FHIR decides which country pack is active
- Afiax FHIR invokes a generic operation or bot handoff
- Afiax FHIR records the normalized outcome

## What should stay outside Afiax FHIR

Keep these outside this repo unless there is a very strong reason not to:

- ERP, accounting, CRM, HR, training, and general business operations
- wallet and payment execution
- pharmacy inventory and store operations
- commerce and storefront logic
- mobile-app presentation state and offline caches
- AI inference services
- national system gateways and transport wrappers that do not own canonical state
- queue workers or execution services that only exist to call external systems
- partner-specific insurance or logistics integrations

Afiax FHIR should integrate with these systems, not absorb them.

## Current repo reality

Implemented in this repo today:

- country-pack selection
- Kenya HIE and SHA configuration and secret ownership
- Kenya setup wizard
- resource-level Kenya workflows for `Organization`, `Practitioner`, `Coverage`, and `Claim`
- Kenya DHA and SHA connector flows
- Kenya workflow evidence and bot handoff

Not implemented in this repo:

- Afiax Billing ERP execution
- Afiax Pay execution logic
- Lami transport and product logic
- standalone mobile gateway implementation
- long-running enterprise reconciliation workers

The docs in this section define those boundaries so the repo does not quietly turn into a mixed platform monolith.

## Country-pack boundary

Country-specific logic belongs in a pack or a pack-adjacent integration service, not in generic core code.

That includes:

- national identifier bindings
- regulator-specific request and response mappings
- payer-specific claim formats
- terminology bindings
- connector auth flows
- environment-specific country configuration

What stays generic:

- operation names
- core resources
- workflow evidence model
- admin surfaces for settings and secrets
- bot runtime contract

## Financial boundary

Afiax FHIR owns the care-linked and reimbursement-linked ledger.

Adjacent financial systems own execution:

- Afiax Billing owns enterprise finance and ERP execution
- Afiax Pay owns payment and wallet execution
- Lami or similar partners own embedded-insurance transport and product integration

Afiax FHIR should still record the normalized outcome when those systems affect:

- claim progression
- patient liability
- payment status visible to care operations
- dispense or settlement outcomes that change the patient or reimbursement record

## Runtime pattern

Recommended request flow:

1. store or update the canonical resource in Afiax FHIR
2. trigger a generic internal operation or use a resource-level workflow action
3. resolve the active country pack and project config
4. call the external connector or pack transport helper
5. normalize the external result
6. write the normalized outcome back to Afiax FHIR
7. persist workflow evidence
8. hand off asynchronously to bots or adjacent services when needed

This keeps Afiax FHIR as the source of truth for clinical and reimbursement state while allowing external systems to
remain systems of record for their own domains.

## Bot boundary

Bots in this repo are for asynchronous continuation after the synchronous workflow boundary.

Good uses:

- post-submit claim handoff
- claim-status follow-up
- downstream finance or payment handoff
- callback normalization after external updates arrive

Poor uses:

- replacing the initial synchronous facility lookup
- replacing the initial practitioner lookup
- replacing immediate eligibility feedback the user expects on the page

Rule:

- synchronous workflow stays in the handler
- asynchronous continuation can move into a bot

## Knative and gateway boundary

For this platform, Knative-style services and mobile gateways fit outside Afiax FHIR.

Good uses:

- bot execution backends
- country connector services
- mobile/API gateway services
- callback handlers for payer or regulator exchanges
- transformation services that translate between canonical payloads and external payloads

These services should:

- accept Afiax FHIR-defined payload contracts
- avoid becoming the long-term clinical source of truth
- write outcomes back into Afiax FHIR through normalized operations, bot events, or resource updates

Afiax FHIR itself should not be rewritten as a Knative app just because surrounding services are.

## Boundary decision checklist

Ask these questions in order:

1. does the feature change the canonical clinical or reimbursement record
2. is the feature a country-specific regulator or payer workflow
3. is the feature enterprise finance or payment execution
4. is the feature only a transport or orchestration layer around an external system
5. does Afiax FHIR only need the normalized result rather than full execution ownership

Interpretation:

- if 1 is yes, keep it in Afiax FHIR
- if 2 is yes, keep it in a country pack
- if 3 is yes, keep it outside this repo
- if 4 is yes, use a gateway, service, or bot boundary
- if only 5 is yes, persist the normalized outcome and keep the heavy execution outside

## What not to do

- do not call national APIs directly from browser or mobile UI
- do not hard-code country-specific identifiers into the core model
- do not move final clinical state into ERP, commerce, or mobile-local models
- do not bundle Afiax Billing implementation code into this Medplum fork
- do not bundle Afiax Pay execution code into this Medplum fork
- do not let exchange payloads become the primary documentation model
- do not bake country-specific rules into generic UI or platform components
- do not let a gateway silently become a second source of truth

## Concrete examples

### Correct

- `Organization/$verify-facility-authority` is generic
- the Kenya pack resolves the DHA lookup and verification behavior
- the result is normalized and written back into `Organization`, `Task`, and `AuditEvent`

### Also correct

- Kenya claim submission happens in the Kenya pack
- optional post-submit and post-status bots hand the result off downstream
- Afiax Billing later receives the finance-side workflow through a separate contract

### Incorrect

- calling DHA directly from a React screen without the pack handler
- creating ERPNext documents from Medplum core routes
- letting the mobile gateway become the only source of reimbursement state

## Related docs

- [Architecture overview](./index)
- [Enterprise platform](./enterprise-platform)
- [Canonical FHIR model](./canonical-model)
- [Afiax financial architecture](./financial-architecture)
- [Afiax FHIR and Afiax Billing boundary](./afiax-billing-boundary)
- [Afiax FHIR and Afiax Billing contract](./afiax-billing-contract)
- [Afiax FHIR and Afiax Billing object mapping](./afiax-billing-object-mapping)
- [Afiax FHIR and Afiax Billing status model](./afiax-billing-status-model)
- [Afiax FHIR and Afiax Billing payload spec](./afiax-billing-payload-spec)
- [Afiax FHIR and Afiax Pay boundary](./afiax-pay-boundary)
- [Lami embedded insurance boundary](./lami-embedded-insurance-boundary)
- [Country packs](../country-packs)
