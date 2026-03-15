# The Admin Page

The [Admin Page](https://app.afiax.africa/admin/project) of the Afiax Admin App allows admin users to view and edit details of their project that normal users do not have access to.

At the top of the page, there is an array of tabs as shown below. In this guide, we will briefly go over the content of each tab as well as any functionality they provide.

![App Admin Page](./admin-page.png)

## Details

The Details tab displays all of the populated elements of the current [`Project`](/docs/api/fhir/medplum/project) resource. For more details on the [`Project`](/docs/api/fhir/medplum/project) resource, see the [User Management Guide](/docs/user-management).

## Users

The Users tab displays all of the [`Practitioner`](/docs/api/fhir/resources/practitioner) resources that are also a [`User`](/docs/api/fhir/medplum/user) in your project. It also allows you to invite new users. For more details on the [`User`](/docs/api/fhir/medplum/user) resource, see the [User Management Guide](/docs/user-management).

## Patients

The Patients tab displays all of the [`Patient`](/docs/api/fhir/resources/patient) resources that are also a [`User`](/docs/api/fhir/medplum/user) in your project. It also allows you to invite new patients. For more details on the [`User`](/docs/api/fhir/medplum/user) and [`Patient`](/docs/api/fhir/resources/patient) resources see the [User Management Guide](/docs/user-management).

## Clients

The Clients tab displays all of the [`ClientApplication`](/docs/api/fhir/medplum/clientapplication) resources that are associated with your project. It also allows you to create new [`ClientApplication`](/docs/api/fhir/medplum/clientapplication). For more details, see the [Authentication Method docs](/docs/auth/token-exchange#set-up-your-clientapplication).

## Bots

The Bots tab displays all of the [`Bots`](/docs/api/fhir/medplum/bot) that are a part of your project and allows you to create new ones. For more details on [`Bots`](/docs/api/fhir/medplum/bot), see the [Bot Basics docs](/docs/bots/bot-basics).

## Settings

The Settings tab displays non-secret project configuration. Afiax projects now expose a curated `Country Pack`
selector here, so an existing project can be switched between `Core / No Country Pack`, `Kenya`, or the current East
Africa and COMESA placeholder entries without manually adding raw settings first.

The advanced settings editor remains available below the selector for additional non-secret project settings such as
feature flags or integration defaults.

## Country Pack

The Country Pack tab acts as the project setup checklist for country-specific workflows. It summarizes the selected
pack, readiness state, DHA environment, credential ownership mode, and the next steps to finish setup.

For Kenya projects, this page points users back to `Settings` and `Secrets` and makes it clear whether DHA credentials
are tenant-managed or Afiax-managed.

## Secrets

The Secrets tab displays all of your project secrets as well as allowing you to create new ones. Secrets are used to store sensitive information and as access controls. For example, API keys, [`Bot`](/docs/api/fhir/medplum/bot) secrets, and reCAPTCHA secrets would all appear here. For more details see the [Project Secrets docs](/docs/access/projects#project-secrets).

For Afiax country-pack workflows, this is also where project admins should store regulator-facing integration
credentials. For the current Kenya AfyaLink facility verification path, the tenant-managed project secret names are:

- `kenyaAfyaLinkConsumerKey`
- `kenyaAfyaLinkUsername`
- `kenyaAfyaLinkPassword`

When `Project.setting.countryPack=kenya`, the Secrets tab surfaces a dedicated Kenya AfyaLink credentials form and a
`Test Connection` action that validates the current DHA connection against AfyaLink before saving.

The Kenya setup now separates non-secret and secret configuration:

- `Settings` stores the Kenya DHA environment (`UAT` or `Production`) and the credential mode (`Tenant-managed` or
  `Afiax-managed`)
- `Secrets` stores only the tenant-managed DHA credentials when that mode is selected
- the DHA endpoint itself is derived from the selected environment and platform configuration, so tenant admins do not
  type it during normal setup
- when a project uses `Afiax-managed` credentials, the platform-managed values are maintained by super admins in the
  Super Admin page and stored in `Project.systemSecret`

## Sites

The Sites tab allows you to view and edit any custom domains that your project is configured for.
