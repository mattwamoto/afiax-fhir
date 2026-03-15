---
sidebar_position: 5
---

# Afiax Billing Statements and Reconciliation

Afiax Billing statements and reconciliation artifacts give finance and operations teams a stable view of what has been
charged, collected, settled, or left outstanding.

These records are derived from the canonical billing state in Afiax FHIR and the operational finance state in Afiax
Billing.

## Statement and reconciliation capabilities

Afiax Enterprise supports:

- patient-facing billing statements
- receivable review and outstanding balance tracking
- payment allocation and settlement review
- claim-to-cash reconciliation
- cash-pay and self-pay operational follow-up

## Workflow

1. Afiax FHIR records the care, claim, and reimbursement state.
2. Afiax Billing records invoice, collection, and settlement activity.
3. Integration services correlate the clinical and finance records using stable identifiers and workflow references.
4. Reconciliation status is written back into Afiax FHIR where it affects the reimbursement and care workflow.

## Source records

The statement and reconciliation workflow uses:

- [`Account`](/docs/api/fhir/resources/account)
- [`ChargeItem`](/docs/api/fhir/resources/chargeitem)
- [`Claim`](/docs/api/fhir/resources/claim)
- [`ClaimResponse`](/docs/api/fhir/resources/claimresponse)
- [`Invoice`](/docs/api/fhir/resources/invoice)
- [`PaymentReconciliation`](/docs/api/fhir/resources/paymentreconciliation)

## Related docs

- [Billing overview](/docs/billing)
- [Afiax Billing settlement exports](/docs/billing/creating-cms1500)
- [Afiax Billing and Revenue Operations](/products/billing)
