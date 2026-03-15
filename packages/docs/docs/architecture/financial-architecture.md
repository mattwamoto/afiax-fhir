---
sidebar_position: 4
---

# Afiax Financial Architecture

This page defines the financial architecture around Afiax FHIR inside Afiax Enterprise.

It captures the three financial rails that operate around the clinical core:

1. national reimbursement through country packs
2. country-neutral payments through Afiax Pay
3. enterprise finance and operations through Afiax Billing

## Core rule

Afiax FHIR remains the canonical source of truth for clinical facts, payer context, and reimbursement evidence.

Financial execution is distributed across adjacent enterprise systems without replacing the canonical clinical record.

## Financial rails

### 1. National reimbursement rail

This rail is country-pack specific.

It covers:

- eligibility verification
- benefit validation
- claim packaging
- claim submission
- remittance interpretation
- reimbursement reconciliation

In Kenya, this rail is implemented through the Kenya pack for SHA workflows.

### 2. Payments rail

This rail is country-neutral and runs through Afiax Pay.

Afiax Pay is the Mifos-derived payment and wallet platform inside Afiax Enterprise.

It covers:

- patient wallets
- service payments
- co-payments
- premium contributions
- refund processing
- subsidy management
- regulated payment orchestration

### 3. Enterprise finance rail

This rail runs through Afiax Billing.

Afiax Billing is the ERPNext-derived enterprise finance and operations surface inside Afiax Enterprise.

It covers:

- invoices and receivables
- ledger and finance reporting
- collections and reconciliation
- procurement and inventory
- payroll and workforce administration
- pharmacy inventory and commercial operations

## Embedded insurance rail

Embedded insurance sits on top of the payments rail and connects into reimbursement and finance workflows.

In Afiax Enterprise, this rail uses:

- Afiax FHIR for clinical and coverage context
- Afiax Pay for insurance product and premium orchestration
- Afiax Billing for finance-side accounting and settlement
- partner integrations such as LAMI for embedded insurance distribution and product connectivity

This keeps embedded insurance country-neutral while allowing country packs to contribute local payer and regulatory
behavior where needed.

## Ownership split

Afiax FHIR owns:

- patient, encounter, and facility context
- coverage and payer-linked clinical context
- billable clinical events
- claim and claim response evidence
- audit and provenance

Afiax Pay owns:

- wallets
- co-pay collections
- premium contributions
- refunds and subsidy flows
- payment transaction orchestration
- embedded insurance product and policy workflow integration

Afiax Billing owns:

- invoices
- receivables
- postings to enterprise finance
- reconciliation views
- inventory, procurement, and payroll workflows

Country packs own:

- national reimbursement rules
- payer and authority integrations
- remittance normalization
- regulator-specific claim and settlement interpretation

## Kenya interpretation

For Kenya, the rails work together like this:

1. Afiax FHIR records care, charge context, and SHA-linked reimbursement state.
2. The Kenya pack executes SHA eligibility, claim submission, and remittance interpretation.
3. Afiax Pay supports patient co-pay, wallet, subsidy, and embedded insurance payment flows.
4. Afiax Billing handles invoice, receivable, pharmacy commercial workflow, and finance reconciliation.
5. Outcomes that affect care or reimbursement write back into Afiax FHIR as normalized workflow state.

## Why this split matters

This separation prevents three common problems:

- forcing country-specific reimbursement rules into the shared billing model
- forcing patient payment and wallet logic into the ERP layer
- turning enterprise finance systems into a second clinical record

## Operational result

This financial architecture offers:

- country-neutral clinical truth in Afiax FHIR
- country-specific reimbursement through country packs
- country-neutral co-pay and embedded insurance through Afiax Pay
- enterprise finance execution through Afiax Billing

## Related docs

- [Enterprise platform](./enterprise-platform)
- [Afiax FHIR and Afiax Pay boundary](./afiax-pay-boundary)
- [Lami embedded insurance boundary](./lami-embedded-insurance-boundary)
- [Afiax FHIR and Afiax Billing boundary](./afiax-billing-boundary)
- [Afiax FHIR and Afiax Billing contract](./afiax-billing-contract)
- [Kenya billing and settlement](../country-packs/kenya-billing-and-settlement)
