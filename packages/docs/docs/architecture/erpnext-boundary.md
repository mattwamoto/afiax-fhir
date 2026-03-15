---
sidebar_position: 4
---

# Afiax FHIR and ERPNext Boundary

This page defines how Afiax FHIR should integrate with ERPNext.

Use it when you need to decide whether a billing, pharmacy, CRM, HR, or training feature belongs in this repo or in
an external enterprise system.

## Core rule

Afiax FHIR remains the clinical source of truth.

ERPNext remains the enterprise system of record for finance, business operations, workforce administration, and
learning administration.

The two systems should integrate through APIs and events. They should not share a database or silently overwrite each
other's domain state.

## Why the split matters

The architecture already separates:

- canonical clinical records
- country-pack payer and regulator workflows
- financial and administrative systems

That separation keeps billing and pharmacy operational workflows connected to care without turning the clinical core
into an ERP.

## Ownership model

### Afiax FHIR owns

- patient, practitioner, organization, location, and care identity
- clinical documentation and care workflow state
- `Coverage`, eligibility state, and payer-linked clinical context
- `ChargeItem`, `Account`, `Claim`, `ClaimResponse`, `Invoice`, and related workflow evidence when they are part of
  the care and reimbursement record
- country-pack operations such as eligibility, national claim submission, and regulator-facing exchange
- `Task`, `AuditEvent`, and `Provenance` for traceability

### ERPNext owns

- customer accounts, receivables, general ledger, and invoicing operations
- payment collection, payment posting, write-offs, refunds, and finance reporting
- CRM records such as leads, opportunities, contracts, and account pipeline
- HR administration such as employee master data, payroll, leave, and workforce administration
- training and CPD administration such as course catalog, enrollment, completion, and operational training records
- pharmacy inventory, procurement, pricing, supplier, POS, and stock control workflows

## Pharmacy split

Pharmacy is not one domain. It crosses both systems.

### Afiax FHIR pharmacy scope

- `Medication`
- `MedicationRequest`
- `MedicationDispense` when dispensing needs to be part of the patient record
- prescription intent, prescribing clinician, patient linkage, and encounter linkage
- allergy, contraindication, and medication history context

### ERPNext pharmacy scope

- stock and warehouse balances
- purchasing and supplier workflows
- batch and expiry operations
- pricing, cash sales, and collections
- inventory reconciliation and non-clinical store operations

Implementation rule:

- clinical medication state stays in Afiax FHIR
- inventory and commercial pharmacy state stays in ERPNext

## Billing split

### Afiax FHIR billing scope

- capture billable care events
- derive claims from canonical clinical and coverage records
- submit country-specific claims through country packs
- persist claim status, rejection reason, and reconciliation evidence back into the clinical workflow ledger

### ERPNext billing scope

- convert approved or billable events into ERP receivable workflows
- manage invoices, debtor balances, cash collection, and finance reconciliation
- produce accounting outputs and operational finance reports

Implementation rule:

- Afiax FHIR should not become the general ledger
- ERPNext should not become the editable clinical record

## Kenya-specific rule

Kenya SHA claim submission should stay in the Kenya country pack.

That means:

- Afiax FHIR builds and submits the national claim bundle
- Afiax FHIR stores `Claim` and `ClaimResponse` as the canonical reimbursement record
- ERPNext receives downstream financial outcomes such as receivable, remittance, collection, and write-off status

Do not move Kenya claim packaging into ERPNext.

## Integration pattern

Recommended flow:

1. Care is documented in Afiax FHIR.
2. Afiax FHIR creates or updates financial workflow resources such as `ChargeItem`, `Account`, `Coverage`, `Claim`,
   or `Invoice`.
3. An integration service maps the relevant state into ERPNext APIs.
4. ERPNext performs invoice, payment, CRM, HR, training, or inventory workflows in its own domain.
5. Results that matter to care or reimbursement are written back to Afiax FHIR as normalized status and workflow
   evidence.

## Recommended deployment shape

ERPNext should remain outside this repo.

Recommended shape:

- this repo
  - Afiax FHIR core behavior
  - country packs
  - billing and pharmacy integration contracts
- external integration services
  - ERPNext adapters
  - event handlers
  - reconciliation workers
  - Knative-backed integration endpoints if needed

## Resource to object mapping

| Concern | Afiax FHIR source | ERPNext target |
| --- | --- | --- |
| Patient-linked payer context | `Coverage`, `Organization`, `Patient` | customer and payer account references |
| Billable clinical event | `Encounter`, `ChargeItem`, `Account` | sales invoice draft or billing entry |
| National reimbursement | `Claim`, `ClaimResponse` | receivable and remittance bookkeeping |
| Medication order | `MedicationRequest` | inventory fulfillment request or sales workflow |
| Medication dispense in record | `MedicationDispense` | stock movement and sales posting |
| Workforce care identity | `Practitioner`, `PractitionerRole`, `Organization` | employee and assignment references |
| Learning signals from practice | `Task`, `QuestionnaireResponse`, audit patterns | CPD or training completion workflows |

## What not to do

- do not put ERPNext implementation code in this repo
- do not let ERPNext edit the canonical patient or encounter record
- do not send browser or mobile apps directly to ERPNext for clinical source-of-truth updates
- do not move country-pack claim logic into ERPNext custom scripts
- do not use shared database tables between Afiax FHIR and ERPNext
- do not let pharmacy inventory status silently overwrite clinical dispense history

## Build order

1. Define the Afiax FHIR to ERPNext billing contract.
2. Define the pharmacy clinical-versus-inventory split.
3. Implement outbound billing and pharmacy events from Afiax FHIR.
4. Implement inbound payment and reconciliation updates from ERPNext.
5. Add CRM, HR, and training sync after billing is stable.

## Related docs

- [Architecture overview](./index)
- [Enterprise platform](./enterprise-platform)
- [Integration boundaries](./integration-boundaries)
- [Canonical FHIR model](./canonical-model)
- [Revenue cycle and payer operations](/products/billing)
