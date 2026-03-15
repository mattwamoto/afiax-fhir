---
sidebar_position: 1
---

# Country Packs

A country pack is the unit of country-specific behavior in Afiax FHIR.

Use a country pack when a workflow depends on national registries, payer rules, terminology bindings, or compliance
requirements that should not leak into the shared core.

## Design goal

Country packs exist to keep the platform layered:

- core Afiax FHIR behavior generic
- the canonical FHIR model country-neutral
- country integrations behind explicit internal operations
- tenant customization separate from country behavior

## What belongs in a pack

A country pack owns:

- national profile bindings
- terminology and value sets
- registry, exchange, and payer connectors
- mappings from canonical resources to national payloads
- localized bots and operations
- country-specific secret names and config conventions
- runbooks and compliance notes

## What does not belong in a pack

- direct UI calls to national APIs
- hard-coded country field names in the canonical core
- tenant-specific shortcuts that should live in tenant overlays
- generic infrastructure behavior that should stay reusable across all packs

## Core contract

The current runtime contract in this repo is:

- `Project.setting.countryPack` selects the pack
- country-specific non-secret config stays in `Project.setting`
- country-specific credentials stay in `Project.secret` or `Project.systemSecret`
- Afiax FHIR dispatches generic operations to the active pack
- bots and connector code read project context rather than hard-coded country branches

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

## Activation in the app

Projects can now select a country pack in two places:

- during project creation
- later in `/admin/settings`

The dropdown currently includes East Africa and COMESA entries. `Kenya` is active. The remaining entries are
placeholders only.

After a pack is selected:

- `/admin/country-pack` becomes the setup checklist
- `/admin/settings` holds non-secret country config
- `/admin/secrets` holds tenant-managed credentials
- `/admin/super` holds Afiax-managed credentials

## Lifecycle

1. Bind national requirements to the canonical model.
2. Define settings and secret names.
3. Implement connectors, bots, and internal operations.
4. Validate against UAT with fixtures.
5. Add audit, reconciliation, and operational evidence.

## Current reference pack

Kenya is the first real pack in this repo. It is the reference implementation for the pattern, not the definition of
the whole platform.

## Related docs

- [Country pack SDK](./sdk)
- [Kenya reference pack](./kenya)
