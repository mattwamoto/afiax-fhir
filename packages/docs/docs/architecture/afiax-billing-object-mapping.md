---
sidebar_position: 6
---

# Afiax FHIR and Afiax Billing Object Mapping

This page defines how Afiax FHIR resources map to Afiax Billing document families and what writes back into the
canonical workflow ledger.

Use it when implementing Afiax Billing adapters, ERP synchronization, finance write-back, and reconciliation
dashboards.

## Mapping model

Afiax FHIR remains the canonical source of:

- clinical state
- payer context
- reimbursement evidence
- care-linked billing meaning

Afiax Billing receives operational finance and enterprise documents derived from that state.

The mapping layer converts canonical FHIR resources into Afiax Billing documents without turning the ERP layer into a
second editable care record.

## Current implementation state

Implemented in this repo today:

- the canonical FHIR resource side of the mapping
- Kenya eligibility and claim workflows that produce reimbursement evidence
- the documentation contract for how Afiax Billing should receive and write back state

Not implemented in this repo today:

- ERPNext document builders
- ERPNext field-level transforms
- inbound finance write-back consumers

This page therefore documents the mapping target for external integration services.

## Mapping sequence

Use this sequence when implementing an adapter:

1. identify the canonical FHIR resource or workflow event
2. identify the Afiax Billing document family that should receive it
3. decide which fields are authoritative in Afiax FHIR
4. decide which fields are authoritative in Afiax Billing
5. define the normalized write-back that returns to Afiax FHIR

If a field has no care or reimbursement meaning after ERP execution, it should usually stay in Afiax Billing and not
be written back.

## Billing master data mapping

These mappings establish the long-lived billing context around a patient, payer, provider, and facility.

| Afiax FHIR source | Afiax Billing target | Integration outcome |
| --- | --- | --- |
| `Patient` | customer record | establishes the patient-linked billing account |
| `Organization` | company, payer, or facility account reference | establishes facility and payer context |
| `Coverage` | payer plan, coverage reference, or member account link | binds policy and beneficiary context to the receivable workflow |
| `Practitioner`, `PractitionerRole` | servicing provider reference | preserves provider attribution on billable activity |
| `Location` | branch, site, or service location reference | anchors billing to facility and operational reporting scope |

### Mapping rule

These resources do not become ERP-owned clinical truth.

Use them to establish:

- cross-system references
- reporting scope
- payer linkage
- provider attribution

Do not let Afiax Billing become the editable source of `Patient`, `Encounter`, or `Coverage` semantics.

## Billable event mapping

These mappings establish the operational billing workflow from clinical events.

| Afiax FHIR source | Afiax Billing target | Integration outcome |
| --- | --- | --- |
| `Encounter` | billing case or service episode reference | creates the operational billing grouping |
| `ChargeItem` | invoice line candidate or billable service entry | provides charge-level detail for finance workflows |
| `Account` | receivable context or invoice draft container | groups billable items under a single financial workflow |
| `Invoice` | invoice draft or posted invoice document | exposes a finance-ready billing artifact |

### Mapping rule

Use these resources as the Afiax FHIR side of the billing boundary:

- `Encounter` groups clinical activity
- `ChargeItem` captures line-level billable meaning
- `Account` groups those billable items
- `Invoice` represents a finance-ready artifact

Afiax Billing then converts that state into ERP execution.

## Reimbursement mapping

These mappings carry payer workflow state from Afiax FHIR into Afiax Billing.

| Afiax FHIR source | Afiax Billing target | Integration outcome |
| --- | --- | --- |
| `Claim` | reimbursement case reference | opens the payer-facing receivable path |
| `ClaimResponse` | reimbursement status update | updates expected settlement and denial handling |
| `CoverageEligibilityResponse` | benefit verification reference | confirms benefit context for downstream billing operations |
| `Task`, `AuditEvent` | integration and audit linkage | preserves traceability for claim and billing transitions |

### Kenya interpretation

In Kenya, this is especially important:

- the Kenya pack submits SHA claims from Afiax FHIR
- `Claim` and `ClaimResponse` remain authoritative in Afiax FHIR
- Afiax Billing receives the downstream finance meaning after submission and adjudication

Do not reverse that ownership.

## Payment mapping

These mappings define what returns from Afiax Billing into Afiax FHIR.

| Afiax Billing source | Afiax FHIR write-back | Canonical outcome |
| --- | --- | --- |
| invoice issued | billing status on `Invoice` or linked `Account` | marks invoice lifecycle progression |
| payment posted | `PaymentReconciliation` or linked financial workflow record | records settlement against claim or invoice context |
| partial payment | `PaymentReconciliation` plus workflow status update | preserves partial settlement state |
| adjustment, refund, or write-off | workflow evidence on `Task`, `AuditEvent`, and related financial resources | records normalized adjustment outcome |

### Write-back rule

Write back the normalized outcome, not the ERP internals.

Afiax FHIR should receive:

- invoice reference
- billing status
- payment status
- claim-financial status
- adjustment or denial outcome
- correlation metadata

Afiax FHIR should not receive:

- arbitrary ERP document internals
- finance-only workflow state with no care or reimbursement relevance

## Pharmacy mapping

Pharmacy is intentionally split across systems.

| Afiax FHIR source | Afiax Billing target | Integration outcome |
| --- | --- | --- |
| `MedicationRequest` | fulfillment request or dispensing work item | opens pharmacy operational workflow |
| `MedicationDispense` requirement | dispense completion callback path | reserves clinical write-back destination |
| inventory and dispensing result from Afiax Billing | `MedicationDispense` or fulfillment status update | returns the clinically relevant outcome to Afiax FHIR |

### Pharmacy rule

Afiax Billing owns:

- stock
- procurement
- pricing
- POS
- supplier and warehouse workflows

Afiax FHIR owns:

- prescribing intent
- patient linkage
- clinically relevant dispense state
- medication history

## Document families in Afiax Billing

Afiax Billing uses ERP-backed document families that align with the following integration roles:

- customer and account records for patient and payer billing relationships
- invoice documents for receivable generation
- payment documents for collection and posting
- reconciliation views for settlement tracking
- inventory and dispensing documents for pharmacy operational workflows

The exact ERP customization remains outside this repo. The integration contract in this repo stays centered on
canonical resource meaning and normalized outcomes.

## Shared keys

Every mapped document or write-back payload should carry these shared keys:

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

## Recommended adapter build order

1. map billing master data references
2. map billable event resources
3. map claim and adjudication workflow state
4. map payment and settlement write-back
5. map pharmacy operational write-back

That order matches the real runtime dependency chain.

## What not to do

- do not map ERP document structures directly into the canonical clinical model
- do not make Afiax Billing the editing surface for `Patient`, `Encounter`, or `Coverage`
- do not let pharmacy inventory records overwrite clinical medication history
- do not build write-back around raw ERP statuses without the normalized status model

## Related docs

- [Afiax FHIR and Afiax Billing boundary](./afiax-billing-boundary)
- [Afiax FHIR and Afiax Billing contract](./afiax-billing-contract)
- [Afiax FHIR and Afiax Billing status model](./afiax-billing-status-model)
- [Afiax FHIR and Afiax Billing payload spec](./afiax-billing-payload-spec)
- [Billing](/docs/billing)
