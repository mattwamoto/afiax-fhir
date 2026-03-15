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

Current country-pack fields:

- `Country Pack`
- `DHA Environment`
- `Credential Mode`

The advanced editor remains available for additional `Project.setting` values.

## Country Pack

This is the setup checklist page for country-specific workflows.

For Kenya, it shows:

- selected pack
- DHA environment
- credential mode
- tenant-secret completeness
- next actions

## Secrets

Use `Secrets` for project-scoped credentials and other sensitive values. See [Project Secrets docs](/docs/access/projects#project-secrets).

For Kenya in `Tenant-managed` mode, this page exposes curated DHA inputs:

- `kenyaAfyaLinkConsumerKey`
- `kenyaAfyaLinkUsername`
- `kenyaAfyaLinkPassword`

The page also provides `Test Connection`, which validates the current DHA auth settings before save.

Config split:

- `Settings` owns non-secret country-pack config
- `Secrets` owns tenant-managed credentials
- `Super Admin` owns Afiax-managed Kenya credentials in `Project.systemSecret`

## Sites

Manages custom domains for the project.
