---
sidebar_position: 4
---

# Kenya Billing and Settlement

This page defines how the Kenya pack connects SHA reimbursement workflows in Afiax FHIR to Afiax Billing under Afiax
Enterprise.

It keeps Kenya-specific payer and settlement behavior inside the Kenya pack while the shared billing docs remain
pan-African and country-neutral.

## System ownership in the Kenya revenue cycle

### Afiax FHIR

Afiax FHIR remains the canonical record for:

- patient, practitioner, encounter, and facility context
- coverage and member identity
- billable clinical events
- Kenya eligibility and reimbursement evidence
- SHA claim packaging and submission
- payer status and local `ClaimResponse` state

### Afiax Billing

Afiax Billing owns the downstream enterprise finance workflow:

- invoice and receivable handling
- collection and payment posting
- remittance processing
- finance reconciliation
- pharmacy inventory and commercial settlement

### Afiax Pay

Afiax Pay owns the country-neutral patient financial layer:

- co-pay collection
- patient wallet activity
- subsidy and refund flows
- premium and embedded-insurance payment orchestration

## Kenya-specific rule

Kenya SHA claim submission stays in the Kenya pack.

That means:

- Afiax FHIR creates and submits the canonical claim through the Kenya pack
- Afiax FHIR stores the authoritative `Claim` and `ClaimResponse`
- Afiax Billing receives the downstream financial workflow after claim submission and adjudication

Afiax Billing does not package or submit SHA claims directly.

## Kenya billing workflow

The current Kenya revenue-cycle path follows this sequence:

1. care and billable activity are captured in Afiax FHIR
2. Kenya eligibility checks run through the Kenya pack
3. the Kenya pack assembles and submits the SHA claim from canonical FHIR state
4. claim acknowledgements and adjudication results are recorded in Afiax FHIR
5. Afiax Pay handles co-pay, wallet, subsidy, and embedded-insurance payment flows where applicable
6. Afiax Billing receives invoice-ready, remittance, and settlement events through the integration contract
7. payment, remittance, and adjustment outcomes write back into Afiax FHIR as normalized workflow state

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

These bindings stay in the Kenya pack. The shared billing model stays generic.

## Claim-to-finance sequence

This is the current engineering sequence:

### 1. Eligibility

The `Coverage` page captures the Kenya lookup identity and runs the DHA eligibility workflow.

Result:

- eligibility snapshot on `Coverage`
- `CoverageEligibilityRequest`
- `CoverageEligibilityResponse`
- `Task`
- `AuditEvent`

### 2. Claim submission

The `Claim` page prepares the SHA bundle and submits it when SHA credentials are configured.

Result:

- Kenya claim submission snapshot on `Claim`
- submit `Task`
- submit `AuditEvent`
- optional post-submit bot handoff

### 3. Claim status refresh

The `Claim` page refreshes SHA claim status and normalizes the payer-side result.

Result:

- Kenya claim status snapshot on `Claim`
- local `ClaimResponse`
- status-refresh `Task`
- status-refresh `AuditEvent`
- optional post-status bot handoff

### 4. Enterprise handoff

Only after the claim workflow is normalized inside Afiax FHIR should the downstream enterprise handoff happen.

That downstream handoff is where Afiax Billing and Afiax Pay begin to operate.

## Where bots fit

Bots are the async boundary for Kenya reimbursement continuation.

Current Kenya bot surfaces:

- submit workflow bot after successful claim submission
- status workflow bot after successful claim status refresh

These bot hooks are the correct place to trigger:

- Afiax Billing handoff
- Afiax Pay co-pay or settlement continuation
- later callback or polling continuation

This repo does not embed ERPNext or Afiax Pay implementation logic directly in the Kenya pack.

## Afiax Billing interaction

Afiax Billing receives the Kenya financial workflow through the shared platform integration contract.

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

## Afiax Pay interaction

Afiax Pay contributes:

- co-pay and patient payment orchestration
- patient wallet balances and movements
- premium contribution and refund workflows
- embedded insurance payment handling

In Kenya, this means the payment rail can continue alongside or after SHA reimbursement without moving clinical or
payer-source truth out of Afiax FHIR.

## Settlement write-back

The Kenya billing path writes the following classes of outcomes back into Afiax FHIR:

- invoice status
- payment status
- claim-financial status
- denial or adjustment status
- linked correlation and reconciliation references

This preserves the care and reimbursement ledger in Afiax FHIR even when the financial execution happens elsewhere.

## Pharmacy in the Kenya billing flow

Pharmacy in Kenya follows the same enterprise split:

- prescribing intent, medication history, and clinically relevant dispense state remain in Afiax FHIR
- stock, procurement, pricing, POS, and inventory control remain in Afiax Billing

When pharmacy fulfillment affects the patient record, the result writes back into Afiax FHIR through the shared
pharmacy event contract.

## Operational debugging order

When a Kenya billing path looks wrong, use this order:

1. inspect the `Coverage` eligibility evidence
2. inspect the `Claim` submit snapshot
3. inspect the `Claim` status snapshot
4. inspect the local `ClaimResponse`
5. inspect the workflow-bot status if enterprise handoff was expected
6. only then inspect the downstream Afiax Billing or Afiax Pay handoff

Do not start from the enterprise side if the Kenya claim workflow in Afiax FHIR is already incomplete.

## Engineering guardrails

- SHA claim packaging and submission stay in the Kenya pack
- Afiax Billing does not become a second clinical source of truth
- Afiax Pay does not own clinical reimbursement state
- ERPNext document logic does not belong in this repo
- Kenya-specific reimbursement rules do not leak into the shared billing docs

## Related docs

- [Kenya reference pack](./kenya)
- [Country packs](./index)
- [Billing](/docs/billing)
- [Afiax financial architecture](../architecture/financial-architecture)
- [Afiax FHIR and Afiax Billing boundary](../architecture/afiax-billing-boundary)
- [Afiax FHIR and Afiax Billing contract](../architecture/afiax-billing-contract)
- [Afiax FHIR and Afiax Billing status model](../architecture/afiax-billing-status-model)
