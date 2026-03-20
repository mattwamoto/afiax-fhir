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

For Kenya, that currently means separate non-secret settings for:

- HIE environment and HIE credential mode
- SHA claims environment and SHA claims credential mode
- Kenya HIE agent ID
- optional Kenya claim submit workflow bot ID for downstream orchestration after submit
- optional Kenya claim status workflow bot ID for downstream orchestration after status refresh

The advanced editor remains available for additional `Project.setting` values.

Recommended Kenya setup sequence in `Settings`:

1. set `Country Pack = Kenya`
2. set Kenya HIE environment
3. set Kenya SHA claims environment
4. set HIE credential mode
5. set SHA claims credential mode
6. set Kenya HIE agent ID if that workflow is in scope
7. optionally set Kenya claim submit bot ID
8. optionally set Kenya claim status bot ID
9. save before moving to `Secrets` or `Country Pack`

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

Kenya also exposes resource-level onboarding panels after project setup:

- `Organization` pages capture the Kenya facility code, run DHA facility lookup, and run audited facility verification
- `Practitioner` pages capture the Kenya identity document, run DHA practitioner lookup, and run audited practitioner verification
- `Coverage` pages capture the DHA eligibility lookup identity, run DHA eligibility checks, and record the resulting eligibility workflow artifacts
- `Claim` pages build the Kenya SHA claim bundle, submit it when SHA credentials are configured, check the latest Kenya SHA claim status, optionally trigger downstream submit and status workflow bots, show the raw SHA response, and record the resulting workflow artifacts

Recommended Kenya setup sequence in `Country Pack`:

1. confirm the project is already on `Kenya`
2. enter the primary facility code / MFL code
3. run DHA facility lookup
4. inspect the raw DHA payload if the lookup result is unexpected
5. create the first `Organization` or apply the registry data to an existing one
6. move to the `Organization` page for audited verification

The purpose of this page is onboarding. It is not the final operational workflow surface for Kenya.

Pack-specific behavior belongs in the relevant country-pack docs.

## Secrets

Use `Secrets` for project-scoped credentials and other sensitive values. See [Project Secrets docs](/docs/access/projects#project-secrets).

When a country pack supports curated credential forms, this page can expose pack-specific secret fields and connection
validation actions.

Config split:

- `Settings` owns non-secret country-pack config
- `Secrets` owns tenant-managed credentials for the pack's connector families
- `Super Admin` owns Afiax-managed credentials in `Project.systemSecret`

The current Kenya implementation exposes:

- tenant-managed HIE credentials
- tenant-managed SHA claim credentials
- HIE connection testing
- platform-managed HIE and SHA credential management in Super Admin

Recommended Kenya setup sequence in `Secrets`:

1. confirm whether the project is tenant-managed or Afiax-managed
2. if tenant-managed, enter HIE credentials first
3. run `Test HIE Connection`
4. enter SHA claim credentials
5. save
6. move to the resource pages only after HIE auth succeeds

If the project is Afiax-managed, this page is expected to show status and not accept the platform-managed credentials.

For concrete Kenya settings, secrets, and connection behavior, see the [Kenya reference pack](/docs/country-packs/kenya).

## Sites

Manages custom domains for the project.
