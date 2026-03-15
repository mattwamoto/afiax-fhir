---
sidebar_position: 5
---

# Afiax FHIR and Afiax Billing Contract

This page defines the live integration contract between Afiax FHIR and Afiax Billing.

Use it to implement billing adapters, reconciliation workers, and ERP-facing event handlers without turning Afiax
Billing into a second clinical record.

## Contract model

The integration exposes four contract surfaces:

1. outbound billing events from Afiax FHIR to Afiax Billing
2. inbound financial events from Afiax Billing to Afiax FHIR
3. pharmacy operational events between prescription and stock workflows
4. shared identifiers and reconciliation metadata

The contract remains event-driven and API-backed.

Afiax FHIR publishes canonical clinical and reimbursement state.

Afiax Billing publishes financial and operational state.

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

## Required identifiers

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

## Canonical write-back behavior

Afiax FHIR records the financial outcomes that affect clinical or reimbursement workflows.

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

## Payload shape

The contract uses a shared envelope and event-specific body.

```json
{
  "eventId": "evt_01JX...",
  "eventType": "billing.invoice.ready",
  "occurredAt": "2026-03-16T08:30:00Z",
  "sourceSystem": "afiax-fhir",
  "targetSystem": "afiax-billing",
  "projectId": "123",
  "countryPack": "kenya",
  "correlationId": "corr_01JX...",
  "idempotencyKey": "billing.invoice.ready:123:Account/456",
  "subject": {
    "resourceType": "Account",
    "id": "456"
  },
  "body": {}
}
```

## Reconciliation view

The contract exposes a clear reconciliation loop:

1. Afiax FHIR emits the billable or reimbursement event.
2. Afiax Billing processes the financial workflow.
3. Afiax Billing emits the financial outcome.
4. Afiax FHIR records the normalized settlement result in the clinical workflow ledger.

This loop keeps clinical truth, country-pack workflows, and finance operations synchronized without overlapping
ownership.

## Related docs

- [Afiax FHIR and Afiax Billing boundary](./afiax-billing-boundary)
- [Afiax FHIR and Afiax Billing object mapping](./afiax-billing-object-mapping)
- [Canonical FHIR model](./canonical-model)
- [Integration boundaries](./integration-boundaries)
- [Billing](/docs/billing)
