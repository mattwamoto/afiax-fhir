---
sidebar_position: 1
---

# Country Packs

A country pack is the unit of country-specific behavior in Afiax FHIR.

Use a country pack when a workflow depends on national registries, payer rules, terminology bindings, or compliance
requirements that should not leak into the shared core.

This page is the public developer-facing overview. It explains how country packs fit into the product, how they are
activated, and how an engineer should read the rest of the pack documentation.

## Design goal

Country packs exist to preserve the layering of the platform:

- Afiax FHIR core behavior stays generic
- the canonical FHIR model stays pan-African and country-neutral
- regulator and payer integrations sit behind explicit internal operations
- tenant-specific behavior stays separate from country behavior

This is the main reason the Kenya work in this repo is implemented as a pack and not as direct Medplum core branching.

## What belongs in a country pack

A pack owns:

- country-specific identifier bindings
- terminology and value sets
- registry, payer, and exchange connectors
- mappings from canonical resources into country payloads
- pack-specific bots and async handoff rules
- compliance notes, operator runbooks, and fixtures

A pack does not own:

- direct browser calls to national APIs
- generic infrastructure behavior that should stay reusable across all countries
- tenant shortcuts that should live in tenant overlays
- business logic for adjacent enterprise systems such as Afiax Billing or Afiax Pay

## Runtime contract

The current runtime contract in this repo is:

- `Project.setting.countryPack` selects the active pack
- country-specific non-secret configuration stays in `Project.setting`
- country-specific credentials stay in `Project.secret` or `Project.systemSecret`
- Afiax FHIR dispatches generic FHIR operations to the active pack
- resource-level panels appear only when the current project activates the pack
- bots use project context instead of hard-coded country logic

Generic examples:

```text
Project.setting.countryPack=<pack-id>
Project.setting.<packPrefix>Environment=uat
Project.setting.<packPrefix>CredentialMode=tenant-managed
```

```text
Project.secret.<packPrefix>ConsumerKey
Project.secret.<packPrefix>Username
Project.secret.<packPrefix>Password
```

## Current product flow

For an active pack, the product flow is:

1. select the pack during project creation or later in `/admin/settings`
2. configure non-secret pack settings in `/admin/settings`
3. configure tenant-managed credentials in `/admin/secrets`, or Afiax-managed credentials in `/admin/super`
4. use `/admin/country-pack` as the guided onboarding page
5. move to resource-level workflows on `Organization`, `Practitioner`, `Coverage`, and `Claim`
6. inspect persisted workflow evidence on the resource, plus `Task`, `AuditEvent`, and related artifacts

That pattern is now implemented by the Kenya pack and is the reference model for future countries.

## Documentation layers

Read the pack docs in this order:

1. this page for the pack model
2. [Country Pack SDK](./sdk) for the implementation contract
3. the pack page for the active country, such as [Kenya reference pack](./kenya)
4. country-specific workflow pages such as [Kenya billing and settlement](./kenya-billing-and-settlement)

If you are implementing or extending a pack in code, also read the repo-level guides under:

```text
country-packs/<pack-id>/
```

Those repo-level guides go deeper into connectors, bots, fixtures, mappings, profiles, valuesets, codesystems, and
compliance expectations.

## Pack lifecycle

When adding a new country pack, use this lifecycle:

1. bind the country requirement to an existing generic workflow if possible
2. define pack-specific settings and secret names
3. implement the connector and handler behind a generic operation
4. add the smallest useful onboarding and resource-level UX
5. persist workflow evidence
6. add fixtures, tests, and developer docs
7. only then treat the pack as real

Do not begin with country-specific UI or speculative profile files. Start from the workflow contract.

## Activation in the app

Projects can now select a country pack in two places:

- during project creation
- later in `/admin/settings`

The current dropdown includes East Africa and COMESA entries. `Kenya` is active. The remaining entries are placeholders
only and should be treated as catalog scaffolding, not implemented packs.

After a pack is selected:

- `/admin/settings` owns non-secret pack configuration
- `/admin/secrets` owns tenant-managed credentials
- `/admin/super` owns Afiax-managed credentials
- `/admin/country-pack` owns setup and guided onboarding

## Engineering rules

Every real pack in this repo should follow these rules:

- the public operation name describes the platform semantic, not the regulator name
- the handler resolves the active pack and dispatches accordingly
- remote response differences are normalized before they reach the UI
- workflow evidence is persisted on the resource and through evidence resources
- country-specific runtime behavior is documented in both public docs and repo-level guides

## Current reference pack

Kenya is the first real pack in this repo.

It is the reference implementation for:

- pack selection
- settings and secret ownership
- admin onboarding
- resource-level country workflows
- connector normalization
- bot handoff after asynchronous payer workflows

It is not the definition of the whole platform. Shared docs remain pan-African in scope.

## Related docs

- [Country pack SDK](./sdk)
- [Kenya reference pack](./kenya)
- [Kenya billing and settlement](./kenya-billing-and-settlement)
