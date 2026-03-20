---
sidebar_position: 2
---

# Country Pack SDK

This page defines the contract for adding a new country pack to this repo.

Treat it as an engineering guide. It is meant for developers who are adding a new pack to this fork, not for a
marketing or architecture overview.

## What the core already provides

The Medplum fork already provides these generic extension points:

- `Project.setting.countryPack` to select the active pack
- additional pack-specific config in `Project.setting`
- tenant-managed credentials in `Project.secret`
- Afiax-managed credentials in `Project.systemSecret`
- generic internal operations that dispatch to the active pack
- bot runtime context that includes project settings and pack metadata
- admin UI surfaces for settings, secrets, and pack setup

The goal of the SDK is to add country behavior without forking core behavior per country.

## Use this page correctly

When implementing a new pack, follow this sequence:

1. identify the generic workflow you are trying to support
2. prove it belongs behind a generic operation name
3. add namespaced settings and secret names
4. implement the country handler behind the generic contract
5. add resource-level or admin UI only after the server contract exists
6. add docs and tests before treating the pack as real

## Minimum pack contract

A new pack should define:

- a catalog entry so the pack appears in project creation and admin settings
- namespaced project settings
- namespaced secret names
- at least one internal operation or bot-driven workflow
- fixtures for request and response payloads
- developer docs and setup notes
- at least one troubleshooting path for operators and developers

## Directory contract

Each pack should follow this structure:

```text
country-packs/
  <pack-id>/
    profiles/
    valuesets/
    codesystems/
    operations/
    bots/
    connectors/
    mappings/
    compliance/
    fixtures/
```

Responsibilities:

| Path | Responsibility |
| --- | --- |
| `profiles/` | country-specific FHIR bindings and profile notes |
| `valuesets/`, `codesystems/` | country terminology |
| `operations/` | operation contracts and payload examples |
| `bots/` | pack-specific orchestration logic |
| `connectors/` | registry, payer, and exchange integration code |
| `mappings/` | canonical-to-country payload transforms |
| `compliance/` | runbooks, audit notes, approval artifacts |
| `fixtures/` | request, response, and UAT samples |

Do not add folders just because the structure allows them. A folder should stay empty until the pack actually has
artifacts for that layer.

## Runtime contract

### Pack selection

The active pack is selected with:

```text
Project.setting.countryPack=<pack-id>
```

Example:

```text
Project.setting.countryPack=<pack-id>
Project.setting.<packPrefix>Environment=uat
Project.setting.<packPrefix>CredentialMode=tenant-managed
```

### Settings contract

Use `Project.setting` for non-secret configuration only:

- environment selection
- credential ownership mode
- enabled workflows
- authority IDs
- non-secret routing or feature flags

Pack-specific settings should be namespaced by pack, for example:

```text
<packPrefix>Environment
<packPrefix>CredentialMode
```

### Secrets contract

Use `Project.secret` for tenant-managed credentials and `Project.systemSecret` for Afiax-managed credentials.

Secret names should also be namespaced by pack:

```text
<packPrefix>ConsumerKey
<packPrefix>Username
<packPrefix>Password
```

Do not put credentials in `Project.setting`.

## Operation contract

Country behavior should sit behind generic operation names.

Good examples:

- `Organization/$verify-facility-authority`
- `Practitioner/$verify-practitioner-authority`
- `Coverage/$check-coverage`
- `Patient/$resolve-patient-identity`

Rules:

- the public operation name should describe the platform semantic, not the country system
- the server resolves the active pack and dispatches to the country handler
- the response should be normalized across countries
- regulator-specific payloads stay inside the connector layer

Recommended normalized response fields:

- `status`
- `correlationId`
- `message`
- `nextState`

Regulator-facing operations should also persist workflow evidence, typically through:

- `Task`
- `AuditEvent`
- `Provenance` when needed

For long-running workflows, also define how status refresh or callback ingestion works. Do not stop at the first
transport call if the regulator workflow is asynchronous.

## Connector contract

Each connector should do the same sequence of work:

1. Validate the canonical input.
2. Resolve credentials and environment.
3. Build the regulator-facing request.
4. Call the remote service.
5. Normalize the remote response.
6. Map remote errors into shared platform semantics.
7. Persist workflow evidence.

Recommended logical interface:

```text
validateInput(context)
buildRequest(context)
callRemote(request)
normalizeResponse(response)
persistOutcome(context, normalizedResponse)
mapError(error)
```

## Bot contract

Bots are optional for a pack, but when used they should follow the same rules as the rest of the platform:

- single responsibility
- idempotent behavior
- retry-safe execution
- no direct country assumptions outside the active pack context

Bots should read project context rather than hard-code country selection.

Use bots for asynchronous orchestration boundaries, not for every synchronous lookup:

- good bot candidates:
  - post-submit claim handoff
  - claim-status polling
  - payer callback processing
  - downstream billing or payment handoff
- poor bot candidates:
  - immediate facility lookup
  - immediate practitioner lookup
  - immediate eligibility checks that need instant user feedback

## Normalized status model

Use shared status vocabularies instead of country-specific strings:

| Workflow type | Allowed statuses |
| --- | --- |
| identity resolution | `exact`, `probable`, `none`, `conflict`, `error` |
| authority verification | `verified`, `unverified`, `inactive`, `error` |
| eligibility | `eligible`, `ineligible`, `pending`, `error` |
| exchange submission | `draft`, `validated`, `submitted`, `acknowledged`, `rejected`, `error` |
| claim submission | `draft`, `validated`, `submitted`, `accepted`, `rejected`, `error` |

## Config ownership

Use this split consistently:

| Scope | Owns |
| --- | --- |
| pack catalog | pack id, label, availability, rollout status |
| `Project.setting` | non-secret project config |
| `Project.secret` | tenant-managed credentials |
| `Project.systemSecret` | Afiax-managed credentials |
| environment config | cluster or environment defaults such as UAT and production endpoints |

## How to add a new pack

1. Add the pack to the country-pack catalog in core.
2. Define pack-specific setting names and secret names.
3. Create `country-packs/<pack-id>/` with the standard directory structure.
4. Add at least one generic operation and one country-specific handler.
5. Add admin support only for the settings and secret surfaces that are actually needed.
6. Add resource-level UX only after the operation contract is stable.
7. Add fixtures and tests.
8. Add developer docs so another engineer can reproduce the setup without reading the implementation first.

## What to document for every pack

Every real pack should document:

- required settings
- required tenant-managed secrets
- required Afiax-managed secrets if supported
- setup order
- exact resource prerequisites for each workflow
- which FHIR resources are updated
- which workflow evidence resources are created
- which raw payloads or snapshots are persisted for debugging
- the smallest test commands that validate the pack

## Quality gates

Do not treat a pack as production-ready until all of these are true:

- no direct national API calls from UI applications
- no country-specific identifier names in core canonical resources
- all connectors return normalized outputs
- all external calls are retry-safe
- operation fixtures exist
- audit and reconciliation are implemented
- secrets are stored in the correct secret surface

## Reference implementation

Kenya is the first live pack in this repo. Use it as the reference for the extension pattern, but keep the SDK itself
generic. Concrete Kenya settings and connector names belong in the Kenya docs.

## Related docs

- [Country packs](./index)
- [Kenya reference pack](./kenya)
- [Canonical FHIR model](../architecture/canonical-model)
