# Verify Practitioner Authority

Operation: `Practitioner/$verify-practitioner-authority`

This document describes the current Kenya implementation of practitioner authority verification.

## Purpose

- verify that a `Practitioner` exists in the Kenya health worker registry path exposed through DHA AfyaLink
- keep the public operation name country-neutral
- normalize Kenya-specific registry output into shared platform states

## Kenya binding

- authority: Kenya health worker registry
- identifier category: `practitioner-authority-id`
- lookup identity: national ID or passport number
- returned authority identifier: Kenya registration number

## Preconditions

Before this operation can succeed:

1. the active project must have `countryPack=kenya`
2. the project must have a working Kenya HIE configuration
3. the `Practitioner` must already exist
4. the `Practitioner` must carry a supported Kenya lookup identifier

## Supported lookup identifiers

Current Kenya lookup types in this repo:

- `ID`
- `PASSPORT`

Canonical storage:

- national ID: `https://afiax.africa/kenya/identifier/national-id`
- passport: `https://afiax.africa/kenya/identifier/passport-number`
- practitioner authority registration number: `https://afiax.africa/kenya/identifier/health-worker-registration-number`

## Exact input shape

The operation runs against a saved `Practitioner`.

Minimum national-ID example:

```json
{
  "identifier": [
    {
      "system": "https://afiax.africa/kenya/identifier/national-id",
      "value": "12345678"
    }
  ]
}
```

Minimum passport example:

```json
{
  "identifier": [
    {
      "system": "https://afiax.africa/kenya/identifier/passport-number",
      "value": "A1234567"
    }
  ]
}
```

## Current implementation flow

1. Read the active `Practitioner`.
2. Resolve the current project and confirm the Kenya pack is active.
3. Read Kenya HIE environment and credential mode from `Project.setting`.
4. Resolve HIE credentials from `Project.secret` or `Project.systemSecret`.
5. Determine the practitioner lookup identity from `Practitioner.identifier`.
6. Authenticate against DHA HIE through AfyaLink.
7. Call the practitioner search endpoint with `identification_type` and `identification_number`.
8. Normalize the returned result into:
   - `verified`
   - `inactive`
   - `unverified`
   - `error`
9. Persist the Kenya practitioner verification snapshot on the `Practitioner`.
10. Create a verification `Task`.
11. Create an `AuditEvent`.

## What gets updated

The flow updates or creates:

- `Practitioner.identifier`
  - the lookup identifier if it was captured from the UI first
  - the registration number returned by DHA
- `Practitioner.extension`
  - Kenya practitioner registry snapshot
  - Kenya practitioner verification snapshot
- `Task`
- `AuditEvent`

## Required project settings

- `kenyaHieEnvironment`
- `kenyaHieCredentialMode`

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
- registration number
- practitioner authority identifier
- practitioner authority system
- identification type
- identification number
- practitioner active status
- task reference

## Expected normalized statuses

The Kenya handler currently returns:

- `verified`
- `inactive`
- `unverified`
- `error`

These are shared statuses. The raw DHA `is_active` or registry strings are treated as source evidence, not as the
platform workflow vocabulary.

## Recommended UI path

Preferred user path:

1. open `/Practitioner/{id}`
2. choose `ID` or `PASSPORT`
3. enter the identifier number
4. save the lookup identity
5. run practitioner lookup
6. run `Verify Practitioner`

This path ensures the canonical `Practitioner.identifier` values and the Kenya snapshots stay in sync.

## Troubleshooting

If the operation fails:

1. confirm the project is on `Kenya`
2. confirm HIE credentials are valid and HIE connection testing already works
3. confirm the `Practitioner` has a supported lookup identifier
4. inspect the raw DHA practitioner payload shown in the UI
5. inspect the created `Task` and `AuditEvent`

Treat lookup and verification as separate steps:

- lookup proves the registry request succeeded
- verification proves the normalized workflow and evidence were written
