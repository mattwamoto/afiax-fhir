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
- claims-facing insurance context for partner products
- embedded insurance activation inside care and payment journeys

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

## What Lami provides to Afiax Enterprise

Lami provides the partner integration layer for embedded-insurance workflows.

That includes:

- insurance product and quote connectivity
- policy activation and status connectivity
- partner-facing embedded-insurance lifecycle orchestration
- insurance event results that feed payment and finance workflows

## What stays outside the Lami boundary

Lami does not become:

- the clinical record
- the national reimbursement system
- the enterprise finance ledger
- the wallet and payment ledger

Those remain in Afiax FHIR, the country pack, Afiax Billing, and Afiax Pay.

## Integration placement

The Lami integration fits best as a partner integration service outside this repo.

This repo documents:

- canonical data requirements
- event contracts
- normalized status expectations
- where partner insurance outcomes write back into Afiax FHIR

The partner-specific transport, authentication, and product configuration remain in the integration layer around
Afiax Enterprise.

## Kenya interpretation

In Kenya, Lami sits alongside the Kenya pack rather than inside it.

That means:

- the Kenya pack handles SHA reimbursement workflows
- Lami handles embedded-insurance partner workflows
- Afiax Pay handles payment and premium movements
- Afiax Billing handles finance-side accounting and reconciliation

This preserves the difference between national health-financing integration and partner-distributed insurance.

## Operational result

This boundary offers:

- embedded insurance without polluting the canonical clinical model
- clear separation between partner insurance and national reimbursement
- reusable partner integration across countries

## Related docs

- [Afiax financial architecture](./financial-architecture)
- [Afiax FHIR and Afiax Pay boundary](./afiax-pay-boundary)
- [Kenya billing and settlement](../country-packs/kenya-billing-and-settlement)
