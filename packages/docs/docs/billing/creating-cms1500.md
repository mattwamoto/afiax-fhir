---
sidebar_position: 4
---

# Afiax Billing Settlement Exports

Afiax Billing settlement exports package the reimbursement state from Afiax FHIR into the finance and settlement flows
used by Afiax Enterprise.

This export path is driven by canonical FHIR resources, country-pack reimbursement workflows, and the Afiax Billing
integration layer.

## Export inputs

- [`Patient`](/docs/api/fhir/resources/patient)
- [`Coverage`](/docs/api/fhir/resources/coverage)
- [`Encounter`](/docs/api/fhir/resources/encounter)
- [`ChargeItem`](/docs/api/fhir/resources/chargeitem)
- [`Claim`](/docs/api/fhir/resources/claim)
- [`ClaimResponse`](/docs/api/fhir/resources/claimresponse)
- [`Invoice`](/docs/api/fhir/resources/invoice)

## Export flow

Settlement exports in Afiax Enterprise follow this flow:

1. Afiax FHIR records the billable care event and reimbursement context.
2. Country packs execute any claim submission or reimbursement exchange that belongs to the market workflow.
3. The billing integration layer maps the resulting canonical state into Afiax Billing settlement artifacts.
4. Afiax Billing performs finance-side processing, posting, and reconciliation.
5. Settlement outcomes flow back into Afiax FHIR as normalized status and linked workflow evidence.

## Export outputs

Afiax Billing exports and derived artifacts include:

- invoice-ready settlement records
- receivable updates
- payment and remittance status updates
- finance reconciliation events

## Capability note

The export format is determined by the Afiax Billing integration contract and the active country-pack reimbursement
workflow, not by a fixed single-country claims form.

## Related docs

- [Billing overview](/docs/billing)
- [Afiax Billing and Revenue Operations](/products/billing)
- [Afiax FHIR and Afiax Billing boundary](/docs/architecture/erpnext-boundary)
