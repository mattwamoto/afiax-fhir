---
sidebar_position: 2
---

# Country Pack SDK

The country-pack SDK defines the reusable contracts, packaging rules, and lifecycle expectations for adding a new
market to Afiax.

## Required modules

Every country pack should provide these modules:

| Module | Required | Responsibility |
| --- | --- | --- |
| `profiles/` | yes | country-specific FHIR profiles and bindings |
| `valuesets/` and `codesystems/` | yes | local terminology |
| `operations/` | yes | concrete implementation of national workflows |
| `bots/` | yes | workflow automation and event orchestration |
| `connectors/` | yes | outbound APIs to registries, claims, exchanges, and other authorities |
| `mappings/` | yes | canonical-to-country transformation logic |
| `compliance/` | yes | regulatory notes, runbooks, and evidence artifacts |
| `fixtures/` | recommended | sample payloads and test datasets |

## Reference package layout

```text
country-packs/
  kenya/
    profiles/
    valuesets/
    codesystems/
    operations/
    bots/
    connectors/
      auth/
      registries/
      eligibility/
      claims/
      exchange/
    mappings/
    compliance/
    fixtures/
```

## Interface contracts

### Connector contract

Each connector should implement:

- `validateInput(context)`
- `buildRequest(context)`
- `callRemote(request)`
- `normalizeResponse(response)`
- `persistOutcome(context, normalizedResponse)`
- `mapError(error)`

For regulator-facing connectors, `persistOutcome(...)` should write the workflow result back into Medplum using the
platform ledger model, typically through `Task`, `AuditEvent`, and where useful `Provenance`.

### Operation contract

- Operations are exposed as Medplum custom FHIR operations.
- The operation name should align to a generic platform semantic, even when the implementation is country-specific.
- Every operation should return normalized status, correlation ID, message, and next actionable state.
- Sensitive connector credentials should come from project secrets or environment config, not ordinary project settings.

### Bot contract

- Bots orchestrate workflows from resource events and operation calls.
- Bots should remain single-responsibility.
- Bots should be idempotent and safe to retry.

## Normalized status model

| Type | Allowed statuses |
| --- | --- |
| identity resolution | `exact`, `probable`, `none`, `conflict`, `error` |
| authority verification | `verified`, `unverified`, `inactive`, `error` |
| eligibility | `eligible`, `ineligible`, `pending`, `error` |
| exchange submission | `draft`, `validated`, `submitted`, `acknowledged`, `rejected`, `error` |
| claim submission | `draft`, `validated`, `submitted`, `accepted`, `rejected`, `error` |

## Configuration model

| Scope | Examples |
| --- | --- |
| country-pack static config | country code, default terminology, supported operations |
| tenant-country config | authority IDs, enabled workflows, endpoint URLs, canonical identifier bindings |
| project secret config | registry credentials, API usernames/passwords, consumer keys, tokens |
| environment config | dev, UAT, and prod endpoints, credentials, feature flags |

## Quality gates

No country pack should reach production until it satisfies these rules:

- no direct national API calls from UI applications
- no country-specific identifier names in the core package
- all connectors have normalized outputs and retry-safe semantics
- all operations have request and response fixtures
- audit and reconciliation paths are implemented before go-live
- country-specific credentials are stored in secrets, not plain settings

## First reference implementation

Kenya is the first reference pack, but the SDK is intended for a wider Afiax platform strategy that extends into
additional African markets.

## Related docs

- [Country packs](./index)
- [Kenya reference pack](./kenya)
- [Canonical FHIR model](../architecture/canonical-model)
