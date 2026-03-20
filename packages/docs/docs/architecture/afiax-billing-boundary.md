---
sidebar_position: 4
---

# Afiax FHIR and Afiax Billing Boundary

This page defines how Afiax FHIR integrates with Afiax Billing.

Use it when you need to decide whether a billing, pharmacy, CRM, HR, training, or receivables feature belongs in this
repo or in the ERP layer around Afiax Enterprise.

For the broader split between country reimbursement, Afiax Pay, and Afiax Billing, use the financial architecture
page.

## Core rule

Afiax FHIR remains the clinical and reimbursement source of truth.

Afiax Billing is the ERPNext-based enterprise billing and operations surface under Afiax Enterprise.

It remains the system of record for:

- finance execution
- enterprise receivables
- commercial pharmacy operations
- CRM
- HR and payroll
- training administration

The two systems integrate through APIs and events. They do not share a database or silently overwrite each other's
domain state.

## Current implementation state

Implemented in this repo today:

- Kenya eligibility workflow
- Kenya SHA claim submission
- Kenya SHA claim status refresh
- optional claim submit bot handoff
- optional claim status bot handoff
- public and repo-level billing integration contracts

Not implemented in this repo:

- ERPNext document creation
- ERPNext inventory workflows
- ERPNext invoicing and payment posting
- CRM, HR, and training synchronization code

This page is therefore both a boundary definition and an anti-drift guardrail.

## Ownership model

### Afiax FHIR owns

- patient, practitioner, organization, location, and care identity
- clinical documentation and care workflow state
- `Coverage`, eligibility state, and payer-linked clinical context
- `ChargeItem`, `Account`, `Claim`, `ClaimResponse`, `Invoice`, and related workflow evidence when they are part of
  the care and reimbursement record
- country-pack operations such as eligibility, national claim submission, and regulator-facing exchange
- `Task`, `AuditEvent`, and `Provenance` for traceability

### Afiax Billing owns

- customer accounts, receivables, general ledger, and invoicing operations
- payment collection, payment posting, write-offs, refunds, and finance reporting
- CRM records such as leads, opportunities, contracts, and account pipeline
- HR administration such as employee master data, payroll, leave, and workforce administration
- training and CPD administration such as course catalog, enrollment, completion, and operational training records
- pharmacy inventory, procurement, pricing, supplier, POS, and stock control workflows

## Pharmacy split

Pharmacy crosses both systems and has to be split intentionally.

### Afiax FHIR pharmacy scope

- `Medication`
- `MedicationRequest`
- `MedicationDispense` when dispensing must be part of the patient record
- prescription intent, prescribing clinician, patient linkage, and encounter linkage
- allergy, contraindication, and medication history context

### Afiax Billing pharmacy scope

- stock and warehouse balances
- purchasing and supplier workflows
- batch and expiry operations
- pricing, cash sales, and collections
- inventory reconciliation and non-clinical store operations

Implementation rule:

- clinical medication state stays in Afiax FHIR
- inventory and commercial pharmacy state stays in Afiax Billing

## Billing split

### Afiax FHIR billing scope

- capture billable care events
- derive claims from canonical clinical and coverage records
- submit country-specific claims through country packs
- persist claim status, rejection reason, and reconciliation evidence back into the clinical workflow ledger

### Afiax Billing billing scope

- convert approved or billable events into ERP receivable workflows
- manage invoices, debtor balances, cash collection, and finance reconciliation
- produce accounting outputs and operational finance reports

Implementation rule:

- Afiax FHIR does not become the general ledger
- Afiax Billing does not become the editable clinical record

## Runtime sequence

The intended runtime sequence is:

1. care is documented in Afiax FHIR
2. Afiax FHIR creates or updates `ChargeItem`, `Account`, `Coverage`, `Claim`, or `Invoice` context
3. the country pack performs any required reimbursement workflow
4. Afiax FHIR records normalized reimbursement evidence
5. a bot or integration worker hands the outcome to Afiax Billing
6. Afiax Billing executes invoice, payment, reconciliation, or pharmacy operational workflows
7. outcomes that affect care or reimbursement write back to Afiax FHIR

This keeps the clinical and reimbursement ledger in Afiax FHIR while allowing ERP execution to remain external.

## Kenya-specific rule

Kenya SHA claim submission remains in the Kenya country pack.

That means:

- Afiax FHIR builds and submits the national claim bundle
- Afiax FHIR stores `Claim` and `ClaimResponse` as the canonical reimbursement record
- Afiax Billing receives downstream financial outcomes such as receivable, remittance, collection, and write-off status

Do not move Kenya claim packaging into Afiax Billing.

## What writes back into Afiax FHIR

Afiax Billing should write back only the outcomes that matter to care or reimbursement visibility.

That includes:

- invoice reference and billing status
- payment or settlement status
- claim-linked financial outcome
- pharmacy dispense result when it belongs in the patient record
- correlation and reconciliation metadata

Afiax Billing should not write back:

- editable patient demographics as source truth
- encounter facts as source truth
- raw ERP document internals unless needed for correlation
- general-ledger internals

## Recommended deployment shape

Afiax Billing remains outside this repo.

Recommended shape:

- this repo
  - Afiax FHIR core behavior
  - country packs
  - billing and pharmacy integration contracts
- external integration services
  - Afiax Billing adapters
  - event handlers
  - reconciliation workers
  - Knative-backed integration endpoints if needed

## Resource to object mapping summary

| Concern | Afiax FHIR source | Afiax Billing target |
| --- | --- | --- |
| Patient-linked payer context | `Coverage`, `Organization`, `Patient` | customer and payer account references |
| Billable clinical event | `Encounter`, `ChargeItem`, `Account` | sales invoice draft or billing entry |
| National reimbursement | `Claim`, `ClaimResponse` | receivable and remittance bookkeeping |
| Medication order | `MedicationRequest` | inventory fulfillment request or sales workflow |
| Medication dispense in record | `MedicationDispense` | stock movement and sales posting |
| Workforce care identity | `Practitioner`, `PractitionerRole`, `Organization` | employee and assignment references |
| Learning signals from practice | `Task`, `QuestionnaireResponse`, audit patterns | CPD or training completion workflows |

Use the dedicated mapping page when implementing field-level adapters.

## What not to do

- do not put Afiax Billing implementation code in this repo
- do not let Afiax Billing edit the canonical patient or encounter record
- do not send browser or mobile apps directly to Afiax Billing for clinical source-of-truth updates
- do not move country-pack claim logic into Afiax Billing custom scripts
- do not use shared database tables between Afiax FHIR and Afiax Billing
- do not let pharmacy inventory status silently overwrite clinical dispense history

## Build order

1. define the Afiax FHIR to Afiax Billing contract
2. define the pharmacy clinical-versus-inventory split
3. implement outbound billing and pharmacy events from Afiax FHIR
4. implement inbound payment and reconciliation updates from Afiax Billing
5. add CRM, HR, and training sync after billing is stable

## Related docs

- [Architecture overview](./index)
- [Afiax financial architecture](./financial-architecture)
- [Enterprise platform](./enterprise-platform)
- [Integration boundaries](./integration-boundaries)
- [Afiax FHIR and Afiax Billing contract](./afiax-billing-contract)
- [Afiax FHIR and Afiax Billing object mapping](./afiax-billing-object-mapping)
- [Afiax FHIR and Afiax Billing status model](./afiax-billing-status-model)
- [Afiax FHIR and Afiax Billing payload spec](./afiax-billing-payload-spec)
- [Canonical FHIR model](./canonical-model)
- [Revenue cycle and payer operations](/products/billing)
