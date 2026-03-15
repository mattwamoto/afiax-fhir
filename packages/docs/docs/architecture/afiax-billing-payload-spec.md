---
sidebar_position: 8
---

# Afiax FHIR and Afiax Billing Payload Spec

This page defines the canonical payload envelope and example event bodies used between Afiax FHIR and Afiax Billing.

Use it to implement event publishers, integration workers, callback handlers, and reconciliation pipelines.

## Envelope

Every billing and pharmacy event uses the same top-level envelope.

```json
{
  "eventId": "evt_01JXYZ7KABCD1234EF567890GH",
  "eventType": "billing.invoice.ready",
  "occurredAt": "2026-03-16T09:15:00Z",
  "sourceSystem": "afiax-fhir",
  "targetSystem": "afiax-billing",
  "projectId": "Project/123",
  "countryPack": "kenya",
  "correlationId": "corr_01JXYZ7KABCD1234EF567890GH",
  "idempotencyKey": "billing.invoice.ready:Project/123:Account/456",
  "externalReference": "enc-2026-000452",
  "subject": {
    "resourceType": "Account",
    "id": "456"
  },
  "body": {}
}
```

## Envelope fields

| Field | Meaning |
| --- | --- |
| `eventId` | immutable identifier for the event instance |
| `eventType` | normalized integration event name |
| `occurredAt` | timestamp for the business event |
| `sourceSystem` | event producer, such as `afiax-fhir` or `afiax-billing` |
| `targetSystem` | intended consumer |
| `projectId` | tenant boundary |
| `countryPack` | country-aware routing and reconciliation context |
| `correlationId` | cross-system trace identifier |
| `idempotencyKey` | replay-safe deduplication key |
| `externalReference` | business-facing cross-system reference |
| `subject` | primary resource or document anchor |
| `body` | event-specific payload |

## Event: `billing.invoice.ready`

This event carries invoice-ready financial state from Afiax FHIR into Afiax Billing.

```json
{
  "eventId": "evt_01JXYZINVOICE00000000000001",
  "eventType": "billing.invoice.ready",
  "occurredAt": "2026-03-16T09:15:00Z",
  "sourceSystem": "afiax-fhir",
  "targetSystem": "afiax-billing",
  "projectId": "Project/123",
  "countryPack": "kenya",
  "correlationId": "corr_01JXYZINVOICE0000000000001",
  "idempotencyKey": "billing.invoice.ready:Project/123:Account/456",
  "externalReference": "acct-456",
  "subject": {
    "resourceType": "Account",
    "id": "456"
  },
  "body": {
    "patientId": "Patient/789",
    "organizationId": "Organization/321",
    "encounterId": "Encounter/654",
    "accountId": "Account/456",
    "invoiceId": "Invoice/111",
    "coverageIds": [
      "Coverage/222"
    ],
    "lineItems": [
      {
        "chargeItemId": "ChargeItem/9001",
        "code": "CONSULT-OPD",
        "description": "Outpatient consultation",
        "quantity": 1,
        "unitPrice": {
          "currency": "KES",
          "value": 2500
        },
        "totalPrice": {
          "currency": "KES",
          "value": 2500
        }
      }
    ],
    "billingStatus": "ready",
    "claimFinancialStatus": "submitted"
  }
}
```

## Event: `billing.claim.adjudicated`

This event carries reimbursement outcome state from Afiax FHIR into Afiax Billing.

```json
{
  "eventId": "evt_01JXYZCLAIM000000000000001",
  "eventType": "billing.claim.adjudicated",
  "occurredAt": "2026-03-16T09:35:00Z",
  "sourceSystem": "afiax-fhir",
  "targetSystem": "afiax-billing",
  "projectId": "Project/123",
  "countryPack": "kenya",
  "correlationId": "corr_01JXYZCLAIM00000000000001",
  "idempotencyKey": "billing.claim.adjudicated:Project/123:Claim/333",
  "externalReference": "claim-333",
  "subject": {
    "resourceType": "Claim",
    "id": "333"
  },
  "body": {
    "patientId": "Patient/789",
    "organizationId": "Organization/321",
    "claimId": "Claim/333",
    "claimResponseId": "ClaimResponse/334",
    "coverageId": "Coverage/222",
    "claimFinancialStatus": "approved",
    "denialAdjustmentStatus": "none",
    "approvedAmount": {
      "currency": "KES",
      "value": 2500
    },
    "deniedAmount": {
      "currency": "KES",
      "value": 0
    },
    "payerReference": "sha-ref-778899"
  }
}
```

## Event: `billing.payment.posted`

This event carries finance settlement state from Afiax Billing back into Afiax FHIR.

```json
{
  "eventId": "evt_01JXYZPAYMENT0000000000001",
  "eventType": "billing.payment.posted",
  "occurredAt": "2026-03-16T10:05:00Z",
  "sourceSystem": "afiax-billing",
  "targetSystem": "afiax-fhir",
  "projectId": "Project/123",
  "countryPack": "kenya",
  "correlationId": "corr_01JXYZINVOICE0000000000001",
  "idempotencyKey": "billing.payment.posted:Project/123:PAY-00452",
  "externalReference": "PAY-00452",
  "subject": {
    "resourceType": "PaymentReconciliation",
    "id": "payrec-452"
  },
  "body": {
    "patientId": "Patient/789",
    "organizationId": "Organization/321",
    "accountId": "Account/456",
    "invoiceId": "Invoice/111",
    "claimId": "Claim/333",
    "paymentId": "PAY-00452",
    "invoiceStatus": "part-paid",
    "paymentStatus": "posted",
    "claimFinancialStatus": "remitted",
    "amountPosted": {
      "currency": "KES",
      "value": 1500
    },
    "balanceRemaining": {
      "currency": "KES",
      "value": 1000
    },
    "postedAt": "2026-03-16T10:03:00Z"
  }
}
```

## Event: `pharmacy.dispense.completed`

This event carries a clinically relevant pharmacy completion result from Afiax Billing back into Afiax FHIR.

```json
{
  "eventId": "evt_01JXYZDISPENSE000000000001",
  "eventType": "pharmacy.dispense.completed",
  "occurredAt": "2026-03-16T10:25:00Z",
  "sourceSystem": "afiax-billing",
  "targetSystem": "afiax-fhir",
  "projectId": "Project/123",
  "countryPack": "kenya",
  "correlationId": "corr_01JXYZPHARM0000000000001",
  "idempotencyKey": "pharmacy.dispense.completed:Project/123:MedicationRequest/777",
  "externalReference": "disp-2048",
  "subject": {
    "resourceType": "MedicationRequest",
    "id": "777"
  },
  "body": {
    "patientId": "Patient/789",
    "organizationId": "Organization/321",
    "encounterId": "Encounter/654",
    "medicationRequestId": "MedicationRequest/777",
    "medicationDispenseId": "MedicationDispense/778",
    "fulfillmentStatus": "dispensed",
    "quantityDispensed": {
      "value": 30,
      "unit": "tablet"
    },
    "dispensedAt": "2026-03-16T10:22:00Z",
    "dispensingLocationId": "Location/410"
  }
}
```

## Event families

The payload spec currently covers the primary event families:

- invoice-ready handoff
- claim adjudication handoff
- payment posting write-back
- dispense completion write-back

The shared envelope also supports:

- `billing.coverage.context.updated`
- `billing.invoice.issued`
- `billing.payment.partial`
- `billing.settlement.completed`
- `billing.adjustment.applied`
- `pharmacy.order.created`
- `pharmacy.dispense.cancelled`
- `pharmacy.stock.exception`

## Validation model

Payload validation follows the contract and status model already defined in this section:

- required identifiers stay consistent across outbound and inbound events
- event bodies carry only the fields needed for the receiving system
- normalized status values use the Afiax Billing status model
- raw ERP or payer codes travel as references, not as the primary workflow state

## Related docs

- [Afiax FHIR and Afiax Billing contract](./afiax-billing-contract)
- [Afiax FHIR and Afiax Billing object mapping](./afiax-billing-object-mapping)
- [Afiax FHIR and Afiax Billing status model](./afiax-billing-status-model)
- [Billing](/docs/billing)
