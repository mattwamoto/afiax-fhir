# Verify Facility Authority

Operation: `Organization/$verify-facility-authority`

This is the Kenya implementation note for the generic facility-authority verification operation.

Use this document when you need to understand exactly how the current Kenya facility verification path behaves.

## Purpose

- verify an `Organization` against the Kenya pack
- keep the operation name country-neutral
- keep DHA and AfyaLink details inside the Kenya pack

## Kenya binding

- authority: Master Facility List
- identifier category: `facility-authority-id`
- expected identifier value: MFL code

## Preconditions

Before this operation can succeed:

1. the active project must have `countryPack=kenya`
2. the project must have a working Kenya HIE configuration
3. the `Organization` must already exist
4. the `Organization` must carry a Kenya facility code / MFL code

## Exact input shape

The operation runs against a saved `Organization`.

The minimum useful facility identifier is:

```json
{
  "identifier": [
    {
      "system": "https://afiax.africa/kenya/identifier/mfl-code",
      "value": "24749"
    }
  ]
}
```

## Current implementation flow

1. Read the active `Organization`.
2. Resolve the project country pack.
3. Read Kenya HIE environment and HIE credential mode from `Project.setting`.
4. Resolve credentials from `Project.secret` or `Project.systemSecret`.
5. Obtain a DHA JWT through `GET /v1/hie-auth?key=...`.
6. Call `GET /v1/facility-search?facility_code=...`.
7. Normalize the DHA payload into the shared verification status contract.
8. Persist the Kenya verification snapshot on the `Organization`.
9. Create a verification `Task`.
10. Create an `AuditEvent`.

## What gets updated

On success or failure, the workflow updates:

- `Organization.extension`
  - Kenya verification snapshot
- `Task`
  - verification task for this run
- `AuditEvent`
  - audit trail for the operation

If the lookup path has already been run from the UI, the `Organization` may also already contain:

- Kenya facility registry snapshot in `Organization.extension`

## Required project settings

- `kenyaHieEnvironment`
- `kenyaHieCredentialMode`

## Required tenant-managed secret names

- `kenyaAfyaLinkConsumerKey`
- `kenyaAfyaLinkUsername`
- `kenyaAfyaLinkPassword`

## Response contract

- normalized status
- correlation ID
- human-readable message
- next state
- facility approval status when DHA returns it
- facility operational status when DHA returns it
- task reference

## Expected normalized statuses

The Kenya handler currently returns:

- `verified`
- `unverified`
- `inactive`
- `error`

These are shared platform statuses, not raw DHA status strings.

## Recommended UI path

The preferred user path is not raw operation invocation.

Use:

1. `/Organization/{id}`
2. set `Kenya Facility Code / MFL Code`
3. click `Lookup Facility`
4. click `Verify Facility`

That path ensures the resource carries both:

- registry enrichment state
- verification workflow state

## Notes

- the Kenya HIE endpoint is derived from environment and platform config
- SHA claims use a separate endpoint family and environment selection
- `kenyaAfyaLinkBaseUrl` is only an override path
- tenant UI should not call AfyaLink directly

## Troubleshooting

If verification fails:

1. confirm the project is on `Kenya`
2. confirm HIE credentials are valid
3. confirm the MFL code is actually present on the `Organization`
4. compare the raw DHA lookup payload shown in the UI with the normalized verification result
5. inspect the created `Task` and `AuditEvent`
