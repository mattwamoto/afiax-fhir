---
sidebar_position: 5
---

# Afiax FHIR and Afiax Pay Boundary

This page defines how Afiax FHIR integrates with Afiax Pay inside Afiax Enterprise.

Afiax Pay is the Mifos-derived payments and wallet platform in the enterprise architecture.

Use this page when deciding whether a payment, wallet, co-pay, subsidy, premium, or refund capability belongs in
Afiax FHIR, Afiax Pay, or the active country pack.

## Core rule

Afiax FHIR remains the canonical record for:

- care
- payer context
- reimbursement evidence
- clinically relevant financial status

Afiax Pay executes regulated payment flows and wallet movements without becoming the editable clinical record.

## Current implementation state

Implemented in this repo today:

- the Kenya reimbursement workflows that determine when a patient-liability or settlement step may continue
- documentation contracts for Afiax Pay interaction
- bot handoff points suitable for downstream payment continuation

Not implemented in this repo:

- Afiax Pay wallet execution
- payment-ledger movement
- premium collection flows
- subsidy and refund orchestration

That means this page is the boundary definition for future integration services, not proof that Afiax Pay execution
already runs in this repo.

## Ownership split

### Afiax FHIR owns

- patient, encounter, and facility context
- coverage and payer-linked clinical context
- billable clinical events
- claim and claim-response evidence
- country-pack reimbursement workflows
- normalized financial outcomes that affect care or reimbursement
- audit and provenance linked to payment-relevant workflows

### Afiax Pay owns

- patient wallets
- co-pay collections
- premium contributions
- subsidy allocation and usage
- refund processing
- regulated payment transaction handling
- payment-ledger movement and settlement orchestration

## Payment interactions in the platform

Afiax Pay operates as the country-neutral payment rail in Afiax Enterprise.

It supports:

- direct patient service payments
- partial patient liability against payer-covered services
- premium contribution flows for insurance products
- refund and reversal handling
- payment-linked identity and compliance controls

## Country-pack interaction

Country packs do not replace Afiax Pay.

Instead, they contribute the local reimbursement and regulatory logic that affects the payment path.

Examples:

- eligibility and benefit rules
- claim submission and adjudication
- remittance interpretation
- payer-specific settlement references

This keeps the payment rail reusable across countries while letting each pack shape the reimbursement side correctly.

## Kenya interpretation

In Kenya:

- the Kenya pack handles SHA eligibility, claim submission, and reimbursement interpretation
- Afiax Pay handles co-pay, wallet, subsidy, and payment flows around that care journey
- Afiax Billing handles invoice, receivable, and finance reconciliation

## Runtime sequence

The intended sequence is:

1. Afiax FHIR records the care and reimbursement context
2. the country pack runs payer-specific workflow where required
3. Afiax FHIR records the normalized payer outcome
4. a downstream handoff triggers Afiax Pay when patient liability, wallet, premium, or refund flow is required
5. Afiax Pay executes payment logic
6. normalized payment outcomes write back into Afiax FHIR when they affect care or reimbursement visibility

## What Afiax Pay does not own

Afiax Pay does not own:

- editable encounter or clinical documentation
- claim packaging for national reimbursement
- payer-specific regulatory exchange logic
- enterprise ERP accounting and inventory operations

Those concerns remain in Afiax FHIR, the country pack, or Afiax Billing.

## Write-back rule

Write payment outcomes back into Afiax FHIR when they affect:

- patient-liability visibility
- reimbursement readiness
- care continuation
- auditability of the reimbursement workflow

Do not write back the full wallet ledger as the primary application state unless a normalized summary is sufficient for
care and reimbursement visibility.

## Good handoff points

Good Afiax Pay handoff points in the current architecture:

- after eligibility confirms patient liability context
- after claim adjudication reveals remaining patient balance
- after reimbursement or settlement updates require co-pay or refund continuation

Poor handoff points:

- before canonical clinical or reimbursement state exists
- directly from a browser form without Afiax FHIR workflow evidence

## Operational result

This boundary offers:

- reusable country-neutral payment capabilities
- clean separation between payments and reimbursement rules
- wallet and co-pay support without distorting the canonical clinical model

## Related docs

- [Afiax financial architecture](./financial-architecture)
- [Afiax FHIR and Afiax Billing boundary](./afiax-billing-boundary)
- [Lami embedded insurance boundary](./lami-embedded-insurance-boundary)
- [Kenya billing and settlement](../country-packs/kenya-billing-and-settlement)
