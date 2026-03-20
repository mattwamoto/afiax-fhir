---
sidebar_position: 4
---

# Afiax Financial Architecture

This page defines the financial architecture around Afiax FHIR inside Afiax Enterprise.

Use it as the engineering guide for deciding where a financial workflow belongs, which system owns which state, and
how write-back should work when payment or reimbursement outcomes affect the canonical clinical ledger.

## Core rule

Afiax FHIR remains the canonical source of truth for:

- clinical facts
- payer context
- reimbursement evidence
- normalized workflow state that affects care or reimbursement

Financial execution is distributed across adjacent enterprise systems without replacing the canonical clinical record.

That means:

- Afiax FHIR owns the ledger of care-linked financial meaning
- country packs own national reimbursement execution
- Afiax Pay owns payment and wallet execution
- Afiax Billing owns ERP and enterprise finance execution

## Financial rails

The architecture uses three active financial rails plus one partner rail.

### 1. National reimbursement rail

This rail is country-pack specific.

It covers:

- eligibility verification
- benefit validation
- claim packaging
- claim submission
- payer-side status refresh
- remittance interpretation
- reimbursement reconciliation evidence

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

### 4. Embedded insurance partner rail

Embedded insurance sits on top of the payment and finance rails and connects into reimbursement workflows when needed.

In Afiax Enterprise, this rail uses:

- Afiax FHIR for clinical and coverage context
- Afiax Pay for payment and premium orchestration
- Afiax Billing for accounting and finance-side settlement
- partner integrations such as Lami for embedded-insurance distribution and product connectivity

This keeps embedded insurance country-neutral while allowing country packs to contribute local payer and regulatory
behavior where needed.

## Ownership matrix

### Afiax FHIR owns

- patient, practitioner, encounter, and facility context
- coverage and payer-linked clinical context
- billable clinical events
- claim and claim-response evidence
- eligibility evidence
- normalized financial outcomes that affect care or reimbursement
- audit and provenance linked to payment-relevant workflows

### Country packs own

- national reimbursement rules
- payer and authority integrations
- regulator-specific claim and settlement interpretation
- normalization of national response semantics into platform workflow state
- country-specific identifiers, extensions, settings, and secret conventions

### Afiax Pay owns

- wallets
- co-pay collections
- premium contributions
- refunds and subsidy flows
- payment transaction orchestration
- embedded-insurance payment handling

### Afiax Billing owns

- invoices
- receivables
- postings to enterprise finance
- reconciliation views
- inventory, procurement, and payroll workflows
- pharmacy inventory and commercial operations

### Lami or similar partner integrations own

- insurance product distribution
- quote and purchase journeys
- policy lifecycle connectivity
- partner-facing embedded-insurance product workflows

## Current implementation state in this repo

Implemented in this repo today:

- Kenya eligibility checks in the Kenya pack
- Kenya SHA claim submission in the Kenya pack
- Kenya SHA claim status refresh in the Kenya pack
- optional Kenya workflow-bot handoff after claim submission
- optional Kenya workflow-bot handoff after claim status refresh
- normalized reimbursement evidence written back into Afiax FHIR

Documented here but not implemented directly in this repo:

- Afiax Billing ERP execution
- Afiax Pay payment execution
- Lami partner transport and product integration
- callback consumers and enterprise reconciliation workers outside Afiax FHIR

That split is intentional. This repo owns the clinical and reimbursement ledger plus the contract boundaries, not the
ERP or payment implementation code.

## Reference runtime sequence

This is the intended runtime sequence for a care event that becomes financially relevant.

1. care is documented in Afiax FHIR
2. billable state is created from canonical clinical context
3. the active country pack performs national reimbursement workflow if needed
4. the country pack writes normalized reimbursement evidence back into Afiax FHIR
5. Afiax Pay executes any patient-liability or wallet flow that belongs on the payments rail
6. Afiax Billing executes invoice, receivable, and finance workflows
7. finance and payment outcomes write back into Afiax FHIR when they affect care or reimbursement visibility

This sequence preserves one clinical ledger while still allowing each enterprise system to remain authoritative for its
own domain.

## Kenya interpretation

For Kenya, the rails work together like this:

1. Afiax FHIR records care, charge context, and SHA-linked reimbursement state
2. the Kenya pack executes DHA eligibility, SHA claim submission, and SHA claim status refresh
3. the Kenya pack writes claim and reimbursement evidence onto `Coverage`, `Claim`, `ClaimResponse`, `Task`, and `AuditEvent`
4. optional Kenya bots hand off the outcome to downstream enterprise systems
5. Afiax Pay handles patient co-pay, wallet, subsidy, and embedded-insurance payment flows
6. Afiax Billing handles invoice, receivable, pharmacy commercial workflow, and finance reconciliation
7. outcomes that affect care or reimbursement write back into Afiax FHIR as normalized workflow state

## Write-back rule

Write back into Afiax FHIR when the outcome affects:

- patient-visible financial status
- reimbursement state
- care delivery readiness
- pharmacy dispense state that belongs in the patient record
- auditability of a regulated workflow

Do not write back full ERP document internals, wallet ledger internals, or partner-product state unless that state is
necessary for the canonical care or reimbursement record.

## Decision guide

When adding a financial feature, ask these questions in order:

1. does it affect the canonical clinical or reimbursement ledger
2. is it a country-pack reimbursement rule
3. is it a country-neutral payment or wallet function
4. is it enterprise finance or ERP execution
5. does the clinical core only need the normalized outcome rather than the full operational process

Interpretation:

- if the answer to 1 is yes, it belongs in Afiax FHIR
- if the answer to 2 is yes, it belongs in a country pack
- if the answer to 3 is yes, it belongs in Afiax Pay
- if the answer to 4 is yes, it belongs in Afiax Billing
- if only 5 is true, keep the execution outside Afiax FHIR and write back the normalized result

## Why this split matters

This separation prevents four common failures:

- forcing country-specific reimbursement rules into the shared billing model
- forcing wallet and co-pay logic into the ERP layer
- turning enterprise finance systems into a second clinical record
- letting payment or partner systems quietly become the only visible settlement truth

## Related docs

- [Enterprise platform](./enterprise-platform)
- [Afiax FHIR and Afiax Pay boundary](./afiax-pay-boundary)
- [Lami embedded insurance boundary](./lami-embedded-insurance-boundary)
- [Afiax FHIR and Afiax Billing boundary](./afiax-billing-boundary)
- [Afiax FHIR and Afiax Billing contract](./afiax-billing-contract)
- [Afiax FHIR and Afiax Billing object mapping](./afiax-billing-object-mapping)
- [Afiax FHIR and Afiax Billing status model](./afiax-billing-status-model)
- [Afiax FHIR and Afiax Billing payload spec](./afiax-billing-payload-spec)
- [Kenya billing and settlement](../country-packs/kenya-billing-and-settlement)
