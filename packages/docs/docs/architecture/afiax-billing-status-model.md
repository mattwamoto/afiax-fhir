---
sidebar_position: 7
---

# Afiax FHIR and Afiax Billing Status Model

This page defines the normalized status model used across Afiax FHIR and Afiax Billing.

Use it to keep invoice workflows, payment workflows, reimbursement workflows, and pharmacy fulfillment workflows
consistent across integration services and write-back logic.

## Purpose

Afiax FHIR records canonical workflow evidence.

Afiax Billing executes finance and operational workflows.

The status model gives both systems a shared vocabulary for:

- invoice lifecycle
- payment lifecycle
- claim-financial lifecycle
- denial and adjustment handling
- pharmacy fulfillment lifecycle

## Status design rules

The status model follows five rules:

1. each status family has a narrow meaning
2. each write-back records the latest normalized state plus correlation metadata
3. external ERP or payer statuses remain available as raw references, but normalized status drives product logic
4. status transitions are replay-safe and idempotent
5. status updates that affect care or reimbursement write back into Afiax FHIR

## Invoice status family

Invoice status tracks the commercial lifecycle of a billable financial artifact.

| Normalized status | Meaning |
| --- | --- |
| `draft` | billing context exists and line-item assembly is in progress |
| `ready` | invoice-ready state exists in Afiax FHIR and can move into Afiax Billing |
| `issued` | invoice is posted in Afiax Billing |
| `part-paid` | partial settlement is recorded against the invoice |
| `paid` | invoice is fully settled |
| `adjusted` | invoice has a financial adjustment that changes expected settlement |
| `cancelled` | invoice is voided and no longer active |
| `written-off` | receivable is closed through write-off logic |

## Payment status family

Payment status tracks money movement and settlement progress.

| Normalized status | Meaning |
| --- | --- |
| `pending` | payment workflow is open and waiting for posting or confirmation |
| `posted` | payment is posted in Afiax Billing |
| `allocated` | payment is allocated to invoice or claim context |
| `partial` | payment covers only part of the balance |
| `settled` | payment completes the active settlement path |
| `refunded` | payment or part of payment is returned |
| `failed` | payment attempt fails or is reversed before settlement |

## Claim-financial status family

Claim-financial status tracks the reimbursement path from submission to cash outcome.

| Normalized status | Meaning |
| --- | --- |
| `pending-submission` | claim is assembled in Afiax FHIR and not yet sent |
| `submitted` | claim leaves Afiax FHIR through the country-pack path |
| `received` | downstream payer or authority acknowledges receipt |
| `adjudicating` | claim is under financial review |
| `approved` | claim is approved for payment |
| `partially-approved` | claim is approved in part |
| `denied` | claim is financially denied |
| `remitted` | remittance or payer financial outcome is received |
| `settled` | claim-linked financial outcome is fully reconciled |
| `exception` | claim requires manual reconciliation or intervention |

## Denial and adjustment status family

Denial and adjustment status records the financial resolution path when a claim or invoice diverges from the expected
settlement path.

| Normalized status | Meaning |
| --- | --- |
| `none` | no active denial or adjustment is open |
| `denied` | a denial exists and requires resolution |
| `adjusted` | a financial adjustment changes the active receivable |
| `appealed` | denial resolution continues through appeal workflow |
| `refunded` | a refund modifies the financial outcome |
| `written-off` | the balance is closed through write-off logic |
| `resolved` | denial or adjustment path is complete |

## Pharmacy fulfillment status family

Pharmacy fulfillment status tracks the operational outcome of medication fulfillment across Afiax FHIR and Afiax
Billing.

| Normalized status | Meaning |
| --- | --- |
| `pending` | prescription is ready for fulfillment processing |
| `reserved` | stock is reserved against the order |
| `in-progress` | fulfillment workflow is active |
| `partially-dispensed` | only part of the requested medication is dispensed |
| `dispensed` | dispense is completed and ready for clinical write-back |
| `cancelled` | fulfillment is stopped or voided |
| `blocked-stock` | fulfillment is blocked by inventory state |
| `blocked-authorization` | fulfillment is blocked by payer or approval state |

## Write-back placement in Afiax FHIR

Afiax FHIR records normalized status in the workflow ledger and on the relevant financial or medication context.

Common write-back surfaces include:

- `Invoice`
- `PaymentReconciliation`
- `Claim`
- `ClaimResponse`
- `Task`
- `AuditEvent`
- `MedicationDispense`

The normalized status remains the application-facing state.

Raw ERP or payer codes remain linked as external references for audit and reconciliation.

## Transition model

The integration supports predictable transitions across the status families.

### Invoice transitions

`draft -> ready -> issued -> part-paid -> paid`

Additional terminal or side transitions:

- `issued -> adjusted`
- `issued -> cancelled`
- `issued -> written-off`

### Payment transitions

`pending -> posted -> allocated -> settled`

Additional branches:

- `posted -> partial`
- `posted -> refunded`
- `pending -> failed`

### Claim-financial transitions

`pending-submission -> submitted -> received -> adjudicating -> approved -> remitted -> settled`

Additional branches:

- `adjudicating -> partially-approved`
- `adjudicating -> denied`
- any active state -> `exception`

### Pharmacy fulfillment transitions

`pending -> reserved -> in-progress -> dispensed`

Additional branches:

- `in-progress -> partially-dispensed`
- `pending -> blocked-stock`
- `pending -> blocked-authorization`
- any active state -> `cancelled`

## Integration outcome mapping

The normalized status model lets the platform record external results without leaking raw ERP or payer semantics into
the canonical model.

| External outcome type | Normalized write-back |
| --- | --- |
| invoice posted | `issued` |
| partial collection | `part-paid` and `partial` |
| full collection | `paid` and `settled` |
| claim denial | `denied` |
| claim remittance received | `remitted` |
| claim reconciled to cash | `settled` |
| stock shortfall on dispense | `blocked-stock` |
| dispense completed | `dispensed` |

## Operational result

This status model offers:

- shared workflow language across Afiax FHIR and Afiax Billing
- predictable reconciliation behavior
- stable UI state for billing, payment, and pharmacy workflows
- traceable write-back into the Afiax FHIR ledger

## Related docs

- [Afiax FHIR and Afiax Billing boundary](./afiax-billing-boundary)
- [Afiax FHIR and Afiax Billing contract](./afiax-billing-contract)
- [Afiax FHIR and Afiax Billing object mapping](./afiax-billing-object-mapping)
- [Billing](/docs/billing)
