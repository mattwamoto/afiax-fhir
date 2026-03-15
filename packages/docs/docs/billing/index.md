---
sidebar_position: 1
---

# Billing

This section explains how Afiax FHIR supports billing workflows and how those workflows connect to Afiax Billing.

Afiax Billing is the ERPNext-based billing and finance surface inside Afiax Enterprise. Afiax FHIR remains the
clinical source of truth.

The core workflow is:

1. clinical care and billable events are recorded in Afiax FHIR
2. payer context is represented in resources such as `Coverage`, `ChargeItem`, `Claim`, and `ClaimResponse`
3. country packs handle eligibility, claims, and regulator-specific reimbursement flows
4. Afiax Billing receives invoice, receivable, collection, and finance workflows through integration services
5. payment and settlement results that matter to care are synchronized back into Afiax FHIR

For billing insurance, the [`Coverage`](/docs/api/fhir/resources/coverage) resource is critical for representing a
patient's payer context. Refer to our [Patient Insurance](/docs/billing/patient-insurance) guide for more information
on properly storing coverage information.

## What this section covers

This section mixes two kinds of material:

- Afiax FHIR billing primitives and workflow patterns
- inherited reference guides for specific billing formats and markets

Use the FHIR resources and workflow guidance as the default implementation path. Treat market-specific exports such as
CMS 1500 and superbills as reference material, not the default Afiax Enterprise billing model.

## Coding

For resources to be billed appropriately, they often need to be tagged with CPT codes, LOINC, SNOMED, or other
terminologies. To accomplish this, resources are often tagged with a
[Codeable Concept](/docs/fhir-basics#standardizing-data-codeable-concepts). Coding will be determined by the service
provided.

Through automation and integration, more complex scenarios such as determining authorization, checking whether
insurance is active, or synchronizing to Afiax Billing can be automated via Bots and integration services.

## Workflow boundary

Afiax FHIR should own:

- billable clinical events
- payer and coverage context
- claim and reimbursement workflow state
- country-pack claim submission where required

Afiax Billing should own:

- invoices and receivables
- payment posting and collection
- finance reconciliation and reporting
- adjacent ERP workflows such as pharmacy inventory, CRM, HR, and training when deployed in the same ERPNext runtime

## Reference integrations

The upstream [medplum-demo-bots](https://github.com/medplum/medplum-demo-bots) repository still contains useful
reference billing integrations. Use them as implementation examples, not as the definition of the Afiax Billing
workflow.

- [Stripe](https://github.com/medplum/medplum/tree/main/examples/medplum-demo-bots/src/stripe-bots) shows one
  pattern for keeping invoices and payments synchronized between a FHIR workflow and an external payment system.
- [Candid Health](https://github.com/medplum/medplum/tree/main/examples/medplum-demo-bots/src/candid-health) shows
  how to prepare an `Encounter` resource and associated metadata for submission.

## Related docs

- [Afiax Billing and Revenue Operations](/products/billing)
- [Afiax FHIR and Afiax Billing boundary](/docs/architecture/erpnext-boundary)
- [Canonical FHIR model](/docs/architecture/canonical-model)
