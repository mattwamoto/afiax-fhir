---
sidebar_position: 3
---

# Eligibility and Benefit Checks

Eligibility and benefit checks are part of the Afiax Enterprise reimbursement workflow.

Afiax FHIR manages the canonical request and response state. Country packs execute the payer-specific or
authority-specific integrations. Afiax Billing consumes the resulting reimbursement context for invoicing and
collections.

## Capability overview

Eligibility and benefit checks provide:

- active coverage validation
- plan and benefit confirmation
- authorization requirement discovery
- service-level reimbursement context
- normalized status for downstream billing and claims workflows

## Canonical resources

Afiax FHIR uses:

- [`CoverageEligibilityRequest`](/docs/api/fhir/resources/coverageeligibilityrequest)
- [`CoverageEligibilityResponse`](/docs/api/fhir/resources/coverageeligibilityresponse)
- [`Coverage`](/docs/api/fhir/resources/coverage)
- [`Patient`](/docs/api/fhir/resources/patient)
- [`Encounter`](/docs/api/fhir/resources/encounter)
- [`Organization`](/docs/api/fhir/resources/organization)
- [`Practitioner`](/docs/api/fhir/resources/practitioner)

## Request model

Eligibility requests in Afiax FHIR capture:

- the patient
- the coverage being checked
- the provider or facility context
- the service or reimbursement category being checked
- the supporting clinical context for the reimbursement decision

Country packs map that canonical request into the local payer or authority format without changing the core resource
model.

## Request flow

The request flow is:

1. Afiax FHIR records the payer and clinical context.
2. A billing or country-pack workflow creates a `CoverageEligibilityRequest`.
3. The active country pack or payer integration executes the external eligibility check.
4. The result is normalized and stored as a `CoverageEligibilityResponse`.
5. Afiax Billing receives the resulting reimbursement context for invoice and collection workflows.

## Receiving a Response

Eligibility responses in Afiax FHIR capture:

- whether the request was processed successfully
- whether the coverage is active for the requested period
- what benefits or reimbursement rules apply
- whether authorization is required
- what exclusions, limits, or supporting requirements apply

The response remains part of the canonical reimbursement record and is available to claims workflows, collections, and
reconciliation.

## Coordination of Benefits

Afiax FHIR supports multiple coverages and focal coverage selection through the standard FHIR request and response
pattern.

This allows the platform to model:

- primary and secondary reimbursement
- public and private coverage combinations
- employer, sponsor, and scheme overlays

## Integration with Afiax Billing

Afiax Billing receives:

- active or inactive coverage status
- benefit and authorization context
- reimbursement flags needed for invoice and collection workflows

Afiax Billing does not replace the eligibility record stored in Afiax FHIR.

## Related docs

- [Billing overview](/docs/billing)
- [Payer and coverage context](/docs/billing/patient-insurance)
- [Canonical FHIR model](/docs/architecture/canonical-model)
