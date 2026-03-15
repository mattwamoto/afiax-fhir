---
sidebar_position: 4
---

# Kenya Billing and Settlement

This page defines how the Kenya pack connects SHA reimbursement workflows in Afiax FHIR to Afiax Billing under Afiax
Enterprise.

It keeps Kenya-specific payer and settlement behavior inside the Kenya pack while the shared billing docs remain
pan-African and country-neutral.

## Kenya billing model

In Kenya, Afiax FHIR remains the canonical record for:

- patient, encounter, and facility context
- coverage and member identity
- clinical billable events
- SHA claim packaging and submission
- claim response and reimbursement workflow evidence

Afiax Billing receives the downstream financial workflow:

- invoice and receivable handling
- collection and payment posting
- remittance processing
- finance reconciliation
- pharmacy inventory and commercial settlement

Afiax Pay handles country-neutral patient financial interactions around the same care flow:

- co-pay collection
- patient wallet activity
- subsidy and refund flows
- embedded insurance payment orchestration

## Kenya-specific rule

Kenya SHA claim submission stays in the Kenya pack.

That means:

- Afiax FHIR creates and submits the canonical claim through the Kenya pack
- Afiax FHIR stores the authoritative `Claim` and `ClaimResponse`
- Afiax Billing receives the financial outcome after claim submission and adjudication

Afiax Billing does not package or submit SHA claims directly.

## Kenya billing workflow

The Kenya revenue-cycle path follows this sequence:

1. Care and billable activity are captured in Afiax FHIR.
2. Kenya eligibility and member checks run through Kenya pack operations.
3. The Kenya pack assembles and submits the SHA claim from canonical FHIR state.
4. Claim acknowledgements and adjudication results are recorded in Afiax FHIR.
5. Afiax Pay handles co-pay, wallet, subsidy, and embedded insurance payment flows where applicable.
6. Afiax Billing receives invoice-ready, remittance, and settlement events through the integration contract.
7. Payment, remittance, and adjustment outcomes write back into Afiax FHIR as normalized workflow state.

## Canonical resources in the Kenya flow

The main Afiax FHIR resources in the Kenya billing path are:

- `Coverage`
- `CoverageEligibilityRequest`
- `CoverageEligibilityResponse`
- `ChargeItem`
- `Account`
- `Claim`
- `ClaimResponse`
- `Invoice`
- `PaymentReconciliation`
- `Task`
- `AuditEvent`

## Kenya identifier bindings

The Kenya pack binds the billing and payer flow to Kenya-specific identifiers:

- `payer-member-id` for SHA or scheme member identity
- `facility-authority-id` for MFL code
- `national-client-id` where Kenya registry identity is part of the reimbursement path

These bindings remain in the pack. The shared billing model stays generic.

## Afiax Billing interaction

Afiax Billing receives the Kenya financial workflow through the same shared contract used across the platform.

The Kenya pack contributes the country-specific meaning for:

- coverage verification context
- claim submission path
- adjudication and remittance interpretation
- reimbursement-specific correlation references

Afiax Billing contributes:

- invoice lifecycle execution
- payment posting
- adjustment and write-off handling
- finance reconciliation views

Afiax Pay contributes:

- co-pay and patient payment orchestration
- patient wallet balances and movements
- premium contribution and refund workflows
- embedded insurance payment handling

## Kenya settlement write-back

The Kenya billing path writes the following outcomes back into Afiax FHIR:

- invoice status
- payment status
- claim-financial status
- denial or adjustment status
- linked correlation and reconciliation references

This write-back keeps the care and reimbursement ledger complete inside Afiax FHIR.

## Embedded insurance in Kenya

Embedded insurance in the Kenya delivery model remains country-neutral at the platform level and attaches to Kenya
care and reimbursement workflows through the pack.

In this model:

- Afiax FHIR provides clinical and coverage context
- Afiax Pay orchestrates payment, premium, and wallet flows
- LAMI partner connectivity provides embedded insurance product and distribution integration
- Afiax Billing records finance-side settlement and reconciliation

This keeps partner-specific insurance integration outside the canonical clinical core while preserving end-to-end
workflow visibility.

## Pharmacy in the Kenya billing flow

Pharmacy in Kenya follows the same enterprise split:

- prescribing intent, medication history, and clinically relevant dispense state remain in Afiax FHIR
- stock, procurement, pricing, POS, and inventory control remain in Afiax Billing

When pharmacy fulfillment affects the patient record, the result writes back into Afiax FHIR through the shared
pharmacy event contract.

## Operational result

The Kenya billing integration offers:

- SHA-specific reimbursement flow in the Kenya pack
- shared enterprise finance execution in Afiax Billing
- normalized settlement state in Afiax FHIR
- country-specific reimbursement behavior without leaking Kenya rules into the shared billing docs

## Related docs

- [Kenya reference pack](./kenya)
- [Country packs](./index)
- [Billing](/docs/billing)
- [Afiax financial architecture](../architecture/financial-architecture)
- [Afiax FHIR and Afiax Billing boundary](../architecture/afiax-billing-boundary)
- [Afiax FHIR and Afiax Billing contract](../architecture/afiax-billing-contract)
- [Afiax FHIR and Afiax Billing status model](../architecture/afiax-billing-status-model)
