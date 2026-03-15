---
sidebar_position: 6
---

# Afiax FHIR and Afiax Billing Object Mapping

This page defines how Afiax FHIR resources map to Afiax Billing documents and what writes back into the canonical
workflow ledger.

Use it when implementing Afiax Billing adapters, ERP synchronization, and reconciliation dashboards.

## Mapping model

Afiax FHIR remains the canonical source of clinical, payer, and reimbursement state.

Afiax Billing receives operational finance and enterprise documents from that state.

The mapping layer converts canonical FHIR resources into Afiax Billing documents without turning the ERP layer into a
second editable care record.

## Billing master data mapping

| Afiax FHIR source | Afiax Billing target | Integration outcome |
| --- | --- | --- |
| `Patient` | customer record | establishes the patient-linked billing account |
| `Organization` | company, payer, or facility account reference | establishes facility and payer context |
| `Coverage` | payer plan, coverage reference, or member account link | binds policy and beneficiary context to the receivable workflow |
| `Practitioner`, `PractitionerRole` | servicing provider reference | preserves provider attribution on billable activity |
| `Location` | branch, site, or service location reference | anchors billing to facility and operational reporting scope |

## Billable event mapping

| Afiax FHIR source | Afiax Billing target | Integration outcome |
| --- | --- | --- |
| `Encounter` | billing case or service episode reference | creates the operational billing grouping |
| `ChargeItem` | invoice line candidate or billable service entry | provides charge-level detail for finance workflows |
| `Account` | receivable context or invoice draft container | groups billable items under a single financial workflow |
| `Invoice` | invoice draft or posted invoice document | exposes a finance-ready billing artifact |

## Reimbursement mapping

| Afiax FHIR source | Afiax Billing target | Integration outcome |
| --- | --- | --- |
| `Claim` | reimbursement case reference | opens the payer-facing receivable path |
| `ClaimResponse` | reimbursement status update | updates expected settlement and denial handling |
| `CoverageEligibilityResponse` | benefit verification reference | confirms benefit context for downstream billing operations |
| `Task`, `AuditEvent` | integration and audit linkage | preserves traceability for claim and billing transitions |

## Payment mapping

| Afiax Billing source | Afiax FHIR write-back | Canonical outcome |
| --- | --- | --- |
| invoice issued | billing status on `Invoice` or linked `Account` | marks invoice lifecycle progression |
| payment posted | `PaymentReconciliation` or linked financial workflow record | records settlement against claim or invoice context |
| partial payment | `PaymentReconciliation` plus workflow status update | preserves partial settlement state |
| adjustment, refund, or write-off | workflow evidence on `Task`, `AuditEvent`, and related financial resources | records normalized adjustment outcome |

## Pharmacy mapping

| Afiax FHIR source | Afiax Billing target | Integration outcome |
| --- | --- | --- |
| `MedicationRequest` | fulfillment request or dispensing work item | opens pharmacy operational workflow |
| `MedicationDispense` requirement | dispense completion callback path | reserves clinical write-back destination |
| inventory and dispensing result from Afiax Billing | `MedicationDispense` or fulfillment status update | returns the clinically relevant outcome to Afiax FHIR |

Pharmacy inventory, procurement, pricing, and stock control stay in Afiax Billing.

Medication history, prescribing intent, and patient-linked dispense history stay in Afiax FHIR.

## Document families in Afiax Billing

Afiax Billing uses ERP-backed document families that align with the following integration roles:

- customer and account records for patient and payer billing relationships
- invoice documents for receivable generation
- payment documents for collection and posting
- reconciliation views for settlement tracking
- inventory and dispensing documents for pharmacy operational workflows

The exact ERP customization remains outside this repo. The integration contract in this repo stays centered on
canonical resource meaning and normalized outcomes.

## Write-back rules

Afiax Billing writes back only the outcomes that affect care, reimbursement, or canonical workflow visibility.

That write-back includes:

- invoice reference and billing status
- payment or settlement status
- claim-linked financial outcome
- pharmacy dispense result when it belongs in the patient record
- correlation and reconciliation metadata

Afiax Billing does not write back editable patient demographics, encounter facts, or clinical documentation as its
source of truth.

## Required keys

Every mapped document carries these shared keys:

- `projectId`
- `countryPack`
- `correlationId`
- `patientId`
- `organizationId`
- `encounterId` when the financial document is encounter-linked
- `claimId` when the financial document is reimbursement-linked
- `invoiceId` and `paymentId` when available
- `externalReference`

These keys preserve traceability across Afiax FHIR, Afiax Billing, reconciliation workers, and reporting layers.

## Operational result

This mapping model offers:

- clinical truth in Afiax FHIR
- enterprise finance execution in Afiax Billing
- pharmacy operational execution in Afiax Billing with clinical write-back to Afiax FHIR
- claim and settlement visibility across both systems without shared tables

## Related docs

- [Afiax FHIR and Afiax Billing boundary](./afiax-billing-boundary)
- [Afiax FHIR and Afiax Billing contract](./afiax-billing-contract)
- [Billing](/docs/billing)
