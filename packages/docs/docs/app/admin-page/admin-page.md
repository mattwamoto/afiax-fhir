# The Admin Page

The [Admin Page](https://app.afiax.africa/admin/project) is where project-level configuration lives.

For developers and project admins, this is the main place to:

- inspect the current `Project`
- manage project users, bots, and clients
- set non-secret country-pack configuration
- store project secrets
- confirm country-pack readiness

![App Admin Page](./admin-page.png)

## Details

Shows the current [`Project`](/docs/api/fhir/medplum/project) values, including the selected country pack.

## Users

Shows project users and invite flows. See the [User Management Guide](/docs/user-management) for the underlying
resource model.

## Clients

Shows project [`ClientApplication`](/docs/api/fhir/medplum/clientapplication) resources and creation flows.

## Bots

Shows project [`Bot`](/docs/api/fhir/medplum/bot) resources and creation flows.

## Settings

Use `Settings` for non-secret project configuration.

Current country-pack-related fields are generic:

- `Country Pack`
- environment selection when a pack needs more than one endpoint family
- agent or routing identifiers when a pack requires them
- credential ownership mode when a pack supports tenant-managed or platform-managed access

The advanced editor remains available for additional `Project.setting` values.

## Country Pack

This is the setup checklist page for country-specific workflows.

It shows:

- selected pack
- pack-specific non-secret config state
- credential ownership state
- secret completeness when relevant
- next actions for setup

For active packs, it can also expose guided onboarding flows. The current Kenya implementation includes a setup wizard
that:

- accepts the primary Kenya facility code / MFL code
- looks up the facility against DHA AfyaLink
- shows the raw DHA lookup payload for troubleshooting
- creates or updates the first `Organization` from registry data when DHA returns a match

Pack-specific behavior belongs in the relevant country-pack docs.

## Secrets

Use `Secrets` for project-scoped credentials and other sensitive values. See [Project Secrets docs](/docs/access/projects#project-secrets).

When a country pack supports curated credential forms, this page can expose pack-specific secret fields and connection
validation actions.

Config split:

- `Settings` owns non-secret country-pack config
- `Secrets` owns tenant-managed credentials for the pack's active connector family
- `Super Admin` owns Afiax-managed credentials in `Project.systemSecret`

For concrete Kenya settings, secrets, and connection behavior, see the [Kenya reference pack](/docs/country-packs/kenya).

## Sites

Manages custom domains for the project.
