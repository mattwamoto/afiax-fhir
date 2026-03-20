---
sidebar_position: 6
---

# Lami Embedded Insurance Boundary

This page defines how Lami fits into Afiax Enterprise as an embedded-insurance partner integration.

Lami sits on the embedded-insurance rail around Afiax FHIR, Afiax Pay, and Afiax Billing. It does not replace the
clinical core, the payments rail, or the country-pack reimbursement layer.

## Partner role

Lami provides the partner-facing embedded-insurance capability in the Afiax Enterprise model.

In this role, the integration covers:

- insurance product distribution
- quote and purchase journeys
- policy lifecycle connectivity
- partner-facing embedded-insurance activation inside care and payment journeys
- insurance event results that later influence payment or finance workflows

## Current implementation state

Implemented in this repo today:

- the boundary documentation
- the clinical and reimbursement context that an embedded-insurance flow would need
- the payment and finance split that determines where Lami can attach

Not implemented in this repo:

- partner transport and authentication
- product catalog integration
- quote and purchase flows
- policy lifecycle synchronization

This is deliberate. Lami is an adjacent integration service concern, not Medplum core code.

## Core rule

Afiax FHIR remains the clinical and coverage-context source of truth.

Afiax Pay remains the payments and wallet rail.

Afiax Billing remains the ERP and enterprise finance surface.

Lami remains the embedded-insurance partner integration.

## What Afiax FHIR provides to the Lami rail

Afiax FHIR provides:

- verified patient and organization context
- encounter-linked service context where needed
- coverage and payer-linked identifiers
- billable-event context that drives insurance-related offers or settlement
- canonical workflow evidence when insurance outcomes affect care or reimbursement

## What Afiax Pay provides to the Lami rail

Afiax Pay provides:

- premium collection
- co-pay and wallet movement
- subsidy and refund handling
- payment authorization and settlement support

## What Afiax Billing provides to the Lami rail

Afiax Billing provides:

- finance-side accounting
- receivable and settlement views
- downstream reconciliation when partner insurance outcomes affect enterprise finance

## What Lami provides to Afiax Enterprise

Lami provides the partner integration layer for embedded-insurance workflows.

That includes:

- insurance product and quote connectivity
- policy activation and status connectivity
- partner-facing embedded-insurance lifecycle orchestration
- insurance event results that feed payment and finance workflows

## Runtime sequence

The intended sequence is:

1. Afiax FHIR provides the canonical care, patient, and coverage context
2. Lami provides partner-product and policy workflow
3. Afiax Pay executes payment or premium movement where needed
4. Afiax Billing records finance-side settlement when required
5. normalized outcomes that affect care or reimbursement write back into Afiax FHIR

This keeps partner-product execution outside the clinical core while preserving end-to-end visibility.

## What stays outside the Lami boundary

Lami does not become:

- the clinical record
- the national reimbursement system
- the enterprise finance ledger
- the wallet and payment ledger

Those remain in Afiax FHIR, the country pack, Afiax Billing, and Afiax Pay.

## Kenya interpretation

In Kenya, Lami sits alongside the Kenya pack rather than inside it.

That means:

- the Kenya pack handles SHA reimbursement workflows
- Lami handles embedded-insurance partner workflows
- Afiax Pay handles payment and premium movements
- Afiax Billing handles finance-side accounting and reconciliation

This preserves the difference between national health-financing integration and partner-distributed insurance.

## Integration placement

The Lami integration fits best as a partner integration service outside this repo.

This repo should own only:

- canonical data requirements
- event contracts
- normalized status expectations
- rules for where partner insurance outcomes write back into Afiax FHIR

The partner-specific transport, authentication, product configuration, and marketplace logic remain outside this repo.

## Operational result

This boundary offers:

- embedded insurance without polluting the canonical clinical model
- clear separation between partner insurance and national reimbursement
- reusable partner integration across countries

## Related docs

- [Afiax financial architecture](./financial-architecture)
- [Afiax FHIR and Afiax Pay boundary](./afiax-pay-boundary)
- [Kenya billing and settlement](../country-packs/kenya-billing-and-settlement)
