---
sidebar_position: 3
---

# Afiax FHIR Integration Boundaries

This page defines what Afiax FHIR should own and what should stay outside this repo.

Use it as a decision guide when adding a feature, bot, connector, or service.

## Core rule

Afiax FHIR is the clinical core and workflow ledger.

If something is part of the editable clinical source of truth or must be auditable as part of a clinical workflow, it
belongs in Afiax FHIR.

If something is a transport, commerce, ERP, mobile, or country-integration implementation detail, it probably belongs
outside Afiax FHIR.

## What Afiax FHIR should own

Afiax FHIR should own:

- canonical clinical and operational FHIR resources
- country-neutral validation and shared resource semantics
- generic internal operations such as verification, eligibility, and publishing entry points
- access control, tenant isolation, audit, and provenance
- normalized workflow state written through `Task`, `AuditEvent`, and related resources
- country-pack dispatch and country-specific config selection
- bot execution context and bot invocation contracts
- the final normalized record of external outcomes when those outcomes affect clinical workflows

In practice:

- Afiax FHIR stores the record
- Afiax FHIR decides which pack is active
- Afiax FHIR invokes a generic operation or bot
- Afiax FHIR records the normalized outcome

## What should stay outside Afiax FHIR

Keep these outside this repo unless there is a very strong reason not to:

- ERP, accounting, CRM, HR, training, and general business operations
- pharmacy inventory and store operations
- commerce and storefront logic
- mobile-app presentation state and offline caches
- device firmware and hardware control
- AI inference services
- national system transport adapters and gateway processes
- queue workers or execution services that only exist to call external systems
- partner-specific logistics and operational tools

Afiax FHIR should integrate with these systems, not absorb them.

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

## Runtime pattern

Recommended request flow:

1. Store or update the canonical resource in Afiax FHIR.
2. Trigger a generic internal operation or bot.
3. Resolve the active country pack and project config.
4. Call an external connector or integration service.
5. Normalize the external result.
6. Write the normalized outcome back to Afiax FHIR.
7. Persist audit and workflow evidence.

This keeps Afiax FHIR as the source of truth for clinical state while allowing external systems to remain systems of
record for their own domains.

## Afiax Billing boundary

Afiax Billing is a good fit for:

- invoicing and receivables
- payment posting and reconciliation
- CRM
- HR and payroll
- training and CPD administration
- pharmacy inventory and purchasing

Afiax FHIR should still own:

- clinical events that create billable state
- claim generation and country-pack claim submission
- patient-linked medication and dispense history where it is part of care
- normalized audit and reconciliation outcomes

Use the dedicated boundary doc for that split:

- [Afiax FHIR and Afiax Billing boundary](./erpnext-boundary)

## Where Knative and gateways fit

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
- write outcomes back into Afiax FHIR through normalized operations or resource updates

Afiax FHIR itself should not be rewritten as a Knative app just because surrounding services are.

## What not to do

- do not call national APIs directly from browser or mobile UI
- do not hard-code country-specific identifiers into the core model
- do not move final clinical state into ERP, commerce, or mobile-local models
- do not bundle Afiax Billing implementation code into this Medplum fork
- do not let exchange payloads become the primary documentation model
- do not bake country-specific rules into generic UI or platform components
- do not let a gateway silently become a second source of truth

## Country-pack example

Current application of these rules:

- `Organization/$verify-facility-authority` is the generic operation
- the active country pack resolves local authority and connector logic
- tenant or Afiax-managed credentials are configured through Afiax FHIR admin surfaces
- transport details stay behind the connector layer
- the verification outcome is written back into Afiax FHIR as normalized workflow state

## Related docs

- [Architecture overview](./index)
- [Enterprise platform](./enterprise-platform)
- [Canonical FHIR model](./canonical-model)
- [Afiax FHIR and Afiax Billing boundary](./erpnext-boundary)
- [Country packs](../country-packs)
