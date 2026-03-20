---
sidebar_position: 5
---

# Afiax FHIR and Afiax Billing Contract

This page defines the live integration contract between Afiax FHIR and Afiax Billing.

Use it to implement billing adapters, reconciliation workers, bot-driven handoff, and ERP-facing event handlers
without turning Afiax Billing into a second clinical record.

## Contract model

The integration exposes four contract surfaces:

1. outbound billing events from Afiax FHIR to Afiax Billing
2. inbound financial events from Afiax Billing to Afiax FHIR
3. pharmacy operational events between prescription and stock workflows
4. shared identifiers and reconciliation metadata

The contract remains event-driven and API-backed.

Afiax FHIR publishes canonical clinical and reimbursement state.

Afiax Billing publishes financial and operational state.

## Contract status in this repo

Today, this repo provides:

- the documentation contract
- Kenya claim submit and claim-status bot handoff points
- the clinical and reimbursement ledger where normalized financial outcomes will be recorded

This repo does not yet provide:

- direct ERPNext document creation
- inbound Afiax Billing event consumers
- finance reconciliation workers

That means these contract docs are the implementation target for external integration services, not proof that the ERP
integration is already running in this repo.

## Producer and consumer rule

### Afiax FHIR as producer

Afiax FHIR is the producer when the event starts from:

- clinical billable state
- coverage context
- claim submission
- claim adjudication
- invoice-ready clinical workflow state

### Afiax Billing as producer

Afiax Billing is the producer when the event starts from:

- invoice posting
- payment posting
- partial settlement
- write-off or adjustment
- pharmacy operational completion

### Afiax FHIR as consumer

Afiax FHIR consumes only the normalized outcome needed for:

- claim-financial visibility
- patient-liability visibility
- pharmacy dispense write-back
- audit and reconciliation linkage

## Outbound events from Afiax FHIR

These events originate from Afiax FHIR and drive finance, receivables, and ERP workflows.

| Event | Trigger in Afiax FHIR | Primary resources | Afiax Billing result |
| --- | --- | --- | --- |
| `billing.billable-event.created` | billable care activity is recorded | `Encounter`, `ChargeItem`, `Account` | creates or updates a billing work item |
| `billing.coverage.context.updated` | payer or coverage context changes | `Coverage`, `Organization`, `Patient` | updates payer/account linkage |
| `billing.claim.submitted` | a country-pack claim leaves Afiax FHIR | `Claim`, `Task`, `AuditEvent` | creates reimbursement-linked receivable context |
| `billing.claim.adjudicated` | claim outcome enters canonical workflow state | `ClaimResponse`, `Task` | updates expected settlement path |
| `billing.invoice.ready` | invoice-ready encounter or account closes to billing | `Account`, `Invoice`, `ChargeItem` | creates draft invoice or receivable workflow |

## Inbound events from Afiax Billing

These events originate from Afiax Billing and update the Afiax FHIR reimbursement ledger.

| Event | Trigger in Afiax Billing | Afiax FHIR write-back |
| --- | --- | --- |
| `billing.invoice.issued` | invoice is posted | updates billing status and links invoice reference |
| `billing.payment.posted` | payment is collected and posted | updates patient- or payer-facing settlement state |
| `billing.payment.partial` | partial payment is posted | records partial settlement outcome |
| `billing.settlement.completed` | receivable is fully settled | marks reimbursement workflow as financially complete |
| `billing.adjustment.applied` | write-off, refund, or adjustment posts | records normalized financial adjustment outcome |

## Pharmacy contract

The pharmacy contract preserves the split between clinical medication state and operational inventory state.

### Outbound pharmacy events from Afiax FHIR

| Event | Trigger in Afiax FHIR | Primary resources | Afiax Billing result |
| --- | --- | --- | --- |
| `pharmacy.order.created` | prescription enters fulfillment workflow | `MedicationRequest`, `Encounter`, `Patient` | creates fulfillment or dispensing work item |
| `pharmacy.dispense.record-required` | dispense must return to the clinical record | `MedicationRequest`, `Task` | reserves write-back path for dispense result |

### Inbound pharmacy events from Afiax Billing

| Event | Trigger in Afiax Billing | Afiax FHIR write-back |
| --- | --- | --- |
| `pharmacy.dispense.completed` | dispense is completed | creates or updates `MedicationDispense` |
| `pharmacy.dispense.cancelled` | dispense is cancelled or voided | updates fulfillment status |
| `pharmacy.stock.exception` | stock issue blocks dispensing | records operational blocker on the workflow task |

## Shared identifiers

Every contract payload carries stable identifiers that allow both systems to reconcile state without shared tables.

| Identifier | Source system | Purpose |
| --- | --- | --- |
| `projectId` | Afiax FHIR | tenant boundary |
| `countryPack` | Afiax FHIR | pack-aware routing and settlement logic |
| `correlationId` | event producer | trace across retries and write-backs |
| `patientId` | Afiax FHIR | patient-linked financial context |
| `organizationId` | Afiax FHIR | facility or billing entity context |
| `encounterId` | Afiax FHIR | billable care grouping |
| `claimId` | Afiax FHIR | reimbursement correlation |
| `invoiceId` | origin system | invoice correlation |
| `paymentId` | Afiax Billing | payment correlation |
| `externalReference` | origin system | cross-system lookup key |

## Delivery guarantees

The contract supports idempotent processing and replay-safe reconciliation.

Each event includes:

- `eventId`
- `eventType`
- `occurredAt`
- `correlationId`
- `idempotencyKey`
- `projectId`
- `countryPack`
- `sourceSystem`
- `targetSystem`

These fields let integration workers retry without duplicating invoices, payments, or dispense write-backs.

## Handoff sequence

Use this sequence when implementing the integration:

1. Afiax FHIR records the clinical or reimbursement state
2. Afiax FHIR emits the normalized outbound event
3. Afiax Billing processes the ERP-side workflow
4. Afiax Billing emits the normalized financial outcome
5. Afiax FHIR records the normalized write-back in the clinical workflow ledger

In Kenya, the current bot handoff points sit after:

- successful claim submission
- successful claim status refresh

Those are the correct first async boundaries for downstream finance continuation.

## Canonical write-back behavior

Afiax FHIR records only the financial outcomes that affect clinical or reimbursement workflows.

That includes:

- normalized billing status
- normalized payment status
- claim outcome state
- dispense completion state when it belongs in the patient record
- linked `Task`, `AuditEvent`, and `Provenance`

Afiax Billing retains ownership of:

- finance ledger state
- ERP document numbering
- collections workflow internals
- inventory bookkeeping

## Payload and mapping rule

Use the contract this way:

- the event name captures the workflow boundary
- the payload body carries only the data the receiver needs
- normalized status values use the shared status model
- raw ERP or payer codes travel as references, not as the primary application state

For the full field-level examples, use:

- [Afiax FHIR and Afiax Billing payload spec](./afiax-billing-payload-spec)
- [Afiax FHIR and Afiax Billing object mapping](./afiax-billing-object-mapping)
- [Afiax FHIR and Afiax Billing status model](./afiax-billing-status-model)

## What not to do

- do not send raw ERP document internals as the primary workflow state
- do not make Afiax Billing responsible for clinical truth
- do not make Afiax FHIR responsible for full ERP execution
- do not let a payment or billing event bypass Afiax FHIR when care or reimbursement visibility depends on it

## Related docs

- [Afiax FHIR and Afiax Billing boundary](./afiax-billing-boundary)
- [Afiax FHIR and Afiax Billing object mapping](./afiax-billing-object-mapping)
- [Afiax FHIR and Afiax Billing status model](./afiax-billing-status-model)
- [Afiax FHIR and Afiax Billing payload spec](./afiax-billing-payload-spec)
- [Canonical FHIR model](./canonical-model)
- [Integration boundaries](./integration-boundaries)
- [Billing](/docs/billing)
