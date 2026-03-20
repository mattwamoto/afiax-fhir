# Check Coverage

Operation: `Coverage/$check-coverage`

This document describes the current Kenya implementation of the generic coverage-check operation.

## Purpose

- check Kenya eligibility through DHA AfyaLink using a `Coverage` resource as the canonical input
- normalize Kenya eligibility responses into shared platform states
- persist FHIR-side eligibility evidence without turning AfyaLink responses into the source of truth

## Kenya binding

- identifier category: `payer-member-id`
- authority: DHA eligibility surface
- workflow result: eligibility evidence used before claims and billing

## Preconditions

Before this operation can succeed:

1. the active project must have `countryPack=kenya`
2. the project must have working Kenya HIE credentials
3. the `Coverage` must already exist
4. the `Coverage` must carry one supported Kenya eligibility lookup identifier

## Supported lookup identifiers

Current Kenya eligibility identifier types in this repo:

- `National ID`
- `Alien ID`
- `Mandate Number`
- `Temporary ID`
- `SHA Number`
- `Refugee ID`

These are stored on `Coverage.identifier` using Kenya-specific systems defined in `packages/core/src/kenya.ts`.

## Exact input shape

The operation runs against a saved `Coverage`.

Minimum example:

```json
{
  "resourceType": "Coverage",
  "status": "active",
  "beneficiary": {
    "reference": "Patient/patient-123"
  },
  "payor": [
    {
      "reference": "Organization/sha"
    }
  ],
  "identifier": [
    {
      "system": "https://afiax.africa/kenya/identifier/coverage-national-id",
      "value": "12345678"
    }
  ]
}
```

## Current implementation flow

1. Read the active `Coverage`.
2. Resolve the project and confirm the Kenya pack is active.
3. Read Kenya HIE environment, credential mode, and agent context from `Project.setting`.
4. Resolve HIE credentials from `Project.secret` or `Project.systemSecret`.
5. Resolve the eligibility lookup identifier from `Coverage.identifier`.
6. Authenticate against DHA HIE through AfyaLink.
7. Call the DHA eligibility endpoint with `identification_type` and `identification_number`.
8. Normalize the DHA response into:
   - `eligible`
   - `ineligible`
   - `error`
9. Persist the Kenya eligibility snapshot on `Coverage.extension`.
10. Create `CoverageEligibilityRequest`.
11. Create `CoverageEligibilityResponse`.
12. Create `Task`.
13. Create `AuditEvent`.

## What gets updated

The flow updates or creates:

- `Coverage.identifier`
  - lookup identifier if it was captured through the UI first
- `Coverage.extension`
  - Kenya eligibility snapshot
- `CoverageEligibilityRequest`
- `CoverageEligibilityResponse`
- `Task`
- `AuditEvent`

## Required project settings

- `kenyaHieEnvironment`
- `kenyaHieCredentialMode`
- `kenyaHieAgentId` when the downstream Kenya flow requires it

## Required tenant-managed secret names

- `kenyaAfyaLinkConsumerKey`
- `kenyaAfyaLinkUsername`
- `kenyaAfyaLinkPassword`

## Response contract

Returned fields currently include:

- normalized status
- correlation ID
- message
- next state
- identification type
- identification number
- eligible boolean
- full name
- reason
- possible solution
- coverage end date
- transition status
- request ID
- request ID number
- request ID type
- raw response
- `CoverageEligibilityRequest` reference
- `CoverageEligibilityResponse` reference
- task reference

## Recommended UI path

Preferred user path:

1. open `/Coverage/{id}`
2. choose the Kenya eligibility identifier type
3. enter the identifier number
4. save the lookup identity
5. click `Check Coverage`

This path keeps the `Coverage` as the source resource while also storing the raw DHA-side evidence that operators need
for follow-up.

## Troubleshooting

If the operation fails:

1. confirm the project is on `Kenya`
2. confirm HIE credentials are valid
3. confirm the `Coverage` carries one of the supported Kenya eligibility identifiers
4. inspect the raw DHA payload shown on the `Coverage` page
5. inspect the created `CoverageEligibilityRequest`, `CoverageEligibilityResponse`, `Task`, and `AuditEvent`
