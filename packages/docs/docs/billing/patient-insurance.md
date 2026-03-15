---
sidebar_position: 2
tags:
  - billing
  - insurance
  - coverage
keywords:
  - payer coverage
  - benefit context
  - fhir
---

# Payer and Coverage Context

The [`Coverage`](/docs/api/fhir/resources/coverage) resource carries the payer context that Afiax FHIR uses for
eligibility, claims, and reimbursement workflows.

Afiax Billing consumes this context through integration services. Afiax FHIR remains authoritative for the payer and
coverage state that is part of the care and reimbursement record.

## Coverage capabilities

Coverage in Afiax FHIR supports:

- payer and beneficiary identity
- member and policy identifiers
- coverage status and effective period
- payor references
- ordered coverage stacks for primary and secondary reimbursement
- cost-sharing and patient-responsibility context when it is part of the reimbursement model

## Core elements

The most important Coverage fields in the Afiax Enterprise workflow are:

- `Coverage.status`
- `Coverage.beneficiary`
- `Coverage.subscriber`
- `Coverage.relationship`
- `Coverage.payor`
- `Coverage.identifier`
- `Coverage.class`
- `Coverage.order`
- `Coverage.period`
- `Coverage.costToBeneficiary`

## Identifier model

Afiax FHIR stores payer-linked identifiers in the canonical model and binds them through country packs where required.

Common patterns include:

- scheme member identifiers
- employer or group identifiers
- program or benefit package identifiers
- self-pay or cash-pay coverage markers

Country packs bind these identifiers to local payer and regulator semantics without changing the core resource model.

## Coverage stack

Afiax FHIR supports multiple coverages for the same patient.

This allows the platform to represent:

- primary and secondary coverage
- mixed public and private reimbursement
- sponsor or employer-funded programs
- self-pay alongside insured care

The ordering of coverages remains part of the canonical reimbursement context and is available to both claim logic and
Afiax Billing.

## Self-pay

Self-pay is represented as coverage context, not as a special-case workflow outside the model.

This keeps:

- patient billing logic consistent
- cash-pay and insured workflows comparable
- future transitions between self-pay and insured models traceable

## Coverage documents

When external documents such as insurance or membership cards are needed, Afiax FHIR stores them through
[`DocumentReference`](/docs/api/fhir/resources/documentreference) and links them to the relevant reimbursement
context.

## Integration with Afiax Billing

Afiax Billing receives:

- payer identity context
- member identifiers
- coverage ordering
- patient-responsibility context

Afiax Billing does not replace the canonical coverage record in Afiax FHIR.

## Related docs

- [Billing overview](/docs/billing)
- [Eligibility and benefit checks](/docs/billing/insurance-eligibility-checks)
- [Canonical FHIR model](/docs/architecture/canonical-model)
