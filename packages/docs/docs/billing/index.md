---
sidebar_position: 1
---

# Billing

Afiax Billing is the enterprise billing capability inside Afiax Enterprise.

It runs on an ERPNext-based operational surface and connects directly to Afiax FHIR, which remains the canonical
clinical and reimbursement source of truth.

## Billing workflow

The billing workflow in Afiax Enterprise follows a single pattern:

1. Afiax FHIR records the care event.
2. Afiax FHIR stores payer context in resources such as `Coverage`, `ChargeItem`, `Account`, `Claim`, and
   `ClaimResponse`.
3. Country packs execute eligibility checks, national reimbursement workflows, and regulator-specific claim submission.
4. Afiax Billing receives invoice, receivable, payment, reconciliation, and finance workflows through integration
   services.
5. Settlement outcomes, claim outcomes, and payment statuses that affect care or reimbursement are synchronized back
   into Afiax FHIR.

## Platform capabilities

This billing integration offers:

- canonical payer and coverage context in Afiax FHIR
- country-pack eligibility and reimbursement flows
- invoice and receivable management in Afiax Billing
- payment posting and reconciliation in Afiax Billing
- normalized payment and claim outcome sync back into Afiax FHIR
- pharmacy, CRM, HR, and training adjacency through the same enterprise billing and operations surface

## System ownership

Afiax FHIR owns:

- billable clinical events
- payer and coverage context
- reimbursement workflow state
- country-pack claim submission
- audit and provenance for billing-related clinical workflows

Afiax Billing owns:

- invoices and receivables
- collections and payment posting
- finance reconciliation and reporting
- enterprise operations around the billing flow

## Billing resources

The primary Afiax FHIR resources in this flow are:

- [`Coverage`](/docs/api/fhir/resources/coverage)
- [`ChargeItem`](/docs/api/fhir/resources/chargeitem)
- [`Account`](/docs/api/fhir/resources/account)
- [`Claim`](/docs/api/fhir/resources/claim)
- [`ClaimResponse`](/docs/api/fhir/resources/claimresponse)
- [`Invoice`](/docs/api/fhir/resources/invoice)
- [`PaymentReconciliation`](/docs/api/fhir/resources/paymentreconciliation)

## In this section

- [Payer and coverage context](/docs/billing/patient-insurance)
- [Eligibility and benefit checks](/docs/billing/insurance-eligibility-checks)
- [Afiax Billing settlement exports](/docs/billing/creating-cms1500)
- [Afiax Billing statements and reconciliation](/docs/billing/creating-superbills)

## Related docs

- [Afiax Billing and Revenue Operations](/products/billing)
- [Afiax FHIR and Afiax Billing boundary](/docs/architecture/afiax-billing-boundary)
- [Afiax FHIR and Afiax Billing contract](/docs/architecture/afiax-billing-contract)
- [Afiax FHIR and Afiax Billing object mapping](/docs/architecture/afiax-billing-object-mapping)
- [Afiax FHIR and Afiax Billing status model](/docs/architecture/afiax-billing-status-model)
- [Afiax FHIR and Afiax Billing payload spec](/docs/architecture/afiax-billing-payload-spec)
- [Kenya billing and settlement](/docs/country-packs/kenya-billing-and-settlement)
- [Canonical FHIR model](/docs/architecture/canonical-model)
