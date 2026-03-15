---
sidebar_position: 2
---

# Country Pack SDK

This page defines the contract for adding a new country pack to this repo.

Treat it as an implementation guide, not as a high-level architecture note.

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

## Minimum pack contract

A new pack should define:

- a catalog entry so the pack appears in project creation and admin settings
- namespaced project settings
- namespaced secret names
- at least one internal operation or bot-driven workflow
- fixtures for request and response payloads
- developer docs and setup notes

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

## Runtime contract

### Pack selection

The active pack is selected with:

```text
Project.setting.countryPack=<pack-id>
```

Example:

```text
Project.setting.countryPack=kenya
Project.setting.kenyaAfyaLinkEnvironment=uat
Project.setting.kenyaAfyaLinkCredentialMode=tenant-managed
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
kenyaAfyaLinkEnvironment
kenyaAfyaLinkCredentialMode
```

### Secrets contract

Use `Project.secret` for tenant-managed credentials and `Project.systemSecret` for Afiax-managed credentials.

Secret names should also be namespaced by pack:

```text
kenyaAfyaLinkConsumerKey
kenyaAfyaLinkUsername
kenyaAfyaLinkPassword
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
5. Add fixtures and tests.
6. Add admin docs so project admins know how to configure it.

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

Kenya is the first live pack in this repo. Use it as the reference when adding the next country, but keep the SDK
generic.

## Related docs

- [Country packs](./index)
- [Kenya reference pack](./kenya)
- [Canonical FHIR model](../architecture/canonical-model)
