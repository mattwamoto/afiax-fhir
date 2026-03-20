---
sidebar_position: 2
---

# Country Pack SDK

This page defines the engineering contract for adding or extending a country pack in this repo.

Treat it as an implementation guide. It is written for developers who need to add a new pack without turning Afiax
FHIR into a country-specific fork.

## What the core already provides

The fork already provides these generic extension points:

- `Project.setting.countryPack` to select the active pack
- pack-specific non-secret configuration in `Project.setting`
- tenant-managed credentials in `Project.secret`
- Afiax-managed credentials in `Project.systemSecret`
- generic FHIR operations that dispatch to the active pack
- bot runtime context that includes project settings and pack metadata
- admin UI surfaces for settings, secrets, super-admin credentials, and pack onboarding
- resource-level panels that can appear only when a project is on the active pack

The goal of the SDK is to add country behavior without duplicating core behavior per country.

## Correct implementation order

When implementing a new pack, use this sequence:

1. identify the generic workflow you are trying to support
2. prove it belongs behind a generic FHIR operation name
3. define namespaced settings and secret names
4. implement the connector and handler behind the generic contract
5. persist workflow evidence on the resource and through supporting resources
6. add onboarding or resource-level UX after the server contract is stable
7. add fixtures, tests, and developer docs before calling the pack complete

This order matters. If a pack starts from UI or from speculative terminology artifacts, it will drift away from the
actual runtime contract.

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
    README.md
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
| `README.md` | repo-level implementation guide for the pack |
| `profiles/` | country-specific FHIR bindings and profile notes |
| `valuesets/`, `codesystems/` | terminology artifacts and notes |
| `operations/` | operation contracts and workflow notes |
| `bots/` | pack-specific async orchestration guidance |
| `connectors/` | registry, payer, and exchange integration boundaries |
| `mappings/` | canonical-to-country payload transforms |
| `compliance/` | runbooks, audit notes, and operator expectations |
| `fixtures/` | request, response, and UAT samples |

Do not fill every folder immediately. A folder should only hold artifacts that reflect real implemented behavior.

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
- routing or agent identifiers
- optional bot ids

Pack-specific settings should be namespaced by pack, for example:

```text
<packPrefix>Environment
<packPrefix>CredentialMode
<packPrefix>AgentId
<packPrefix>SubmitWorkflowBotId
<packPrefix>StatusWorkflowBotId
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

### UI contract

Use the admin UI surfaces this way:

- project creation: select the pack
- `/admin/settings`: non-secret pack config
- `/admin/secrets`: tenant-managed credentials
- `/admin/super`: Afiax-managed credentials
- `/admin/country-pack`: guided onboarding
- resource pages: operational workflow actions

Do not hide key pack setup behind raw key-value editing if a curated workflow exists.

## Operation contract

Country behavior should sit behind generic operation names.

Good examples:

- `Organization/$verify-facility-authority`
- `Practitioner/$verify-practitioner-authority`
- `Coverage/$check-coverage`
- `Patient/$resolve-patient-identity`
- `Claim/$submit-national-claim`

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

For long-running workflows, the SDK must also define how status refresh, callback handling, or polling works. Do not
stop at the first transport call if the regulator workflow is asynchronous.

## Connector contract

Every pack connector should follow the same sequence:

1. validate canonical input
2. resolve environment and credentials
3. build the remote request
4. execute the remote request
5. normalize remote response differences
6. return enough metadata for persistence and debugging

Recommended logical interface:

```text
validateInput(context)
buildRequest(context)
callRemote(request)
normalizeResponse(response)
persistOutcome(context, normalizedResponse)
mapError(error)
```

Keep the transport and normalization logic inside the connector. Keep workflow persistence outside it.

## Bot contract

Bots are optional for a pack, but when used they should follow the same rules as the rest of the platform:

- single responsibility
- idempotent behavior
- retry-safe execution
- no direct country assumptions outside the active pack context
- no secret material in event payloads

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

## Evidence contract

Every real country workflow should leave behind reviewable evidence.

Typical evidence resources are:

- `Task`
- `AuditEvent`
- `ClaimResponse`
- `CoverageEligibilityRequest`
- `CoverageEligibilityResponse`

The pack should also persist a normalized workflow snapshot on the primary resource when appropriate.

## Documentation contract

Every real pack should document:

- required settings
- required tenant-managed secrets
- required Afiax-managed secrets if supported
- setup order
- exact resource prerequisites for each workflow
- which resource fields or extensions are updated
- which evidence resources are created
- which raw payloads or snapshots are persisted for debugging
- the smallest test commands that validate the pack

Public docs and repo-level docs should both exist:

- public docs explain how to use and extend the pack
- repo-level docs explain the implementation surface in the repository

## Testing contract

The minimum test surface for a real pack is:

- core helper tests
- connector and handler tests
- resource-page or admin UI tests
- package-level typechecks

Prefer the smallest package-level tests over broad repo-wide runs.

## Review checklist for a pack PR

Before merging a country-pack change, check:

1. the workflow is behind a generic operation or well-defined pack boundary
2. settings and secret names are properly namespaced
3. UI changes only expose the curated surfaces needed by the workflow
4. workflow evidence is persisted
5. docs were updated in both the public docs and the repo-level pack docs
6. targeted tests and typechecks passed

## Related docs

- [Country packs](./index)
- [Kenya reference pack](./kenya)
