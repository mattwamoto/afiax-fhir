---
sidebar_position: 1
---

# Afiax Provider

Afiax Provider is the provider-facing application pattern for clinical users and operations teams. In this section,
you can learn about the core workflows a provider workspace should support on top of Afiax FHIR.

![Afiax Provider screenshot](/img/provider/medplum-provider-app-cover-image.webp)

Afiax Provider is built on Afiax FHIR and follows the same provider-workspace pattern as the upstream Medplum Provider
reference application. Depending on your organization’s needs, you can use it as a system of record, as a starting
point for a custom provider workspace, or as an implementation reference for a broader electronic health record
deployment.

## Registering & Signing In

To use Afiax Provider, you'll need access to an Afiax FHIR project.

1. Register a new account and create a new Project in the Afiax Admin App at [app.afiax.africa](https://app.afiax.africa)
2. Sign in to your organization’s provider workspace deployment with the same credentials
3. After signing in, review the local get-started flow to import sample data and more

Occasionally, you may need to use the Afiax Admin App for administrative and other tasks which we note explicitly in
this documentation.

## Using Afiax Provider

The following sections outline the primary functionality of the Afiax Provider workspace.

#### [Adding Practitioners & Data](./provider/getting-started)

- [Adding Practitioners (via Afiax Admin App)](./provider/getting-started#adding-practitioners)
- [Importing Data (via Afiax Admin App)](./provider/getting-started#importing-data)

#### [Patient Profile](./provider/patient-profile)

- [Registering Patients](./provider/patient-profile#registering-patients)
- [Editing Patient Demographics](./provider/patient-profile#editing-patient-demographics)
- [Updating the Patient Summary Sidebar](./provider/patient-profile#updating-the-patient-summary-sidebar)

#### [Schedule](./provider/schedule#scheduling-a-visit)

- [Scheduling a Visit](./provider/schedule#scheduling-a-visit)
- [Setting Provider Availability](./provider/schedule#setting-provider-availability)

#### [Visits](./provider/visits)

- [Understanding Visits](./provider/visits#understanding-visits)
- [Documenting Visits](./provider/visits#documenting-visits)
- [Setting Up Care Templates (via Afiax Admin App)](./provider/visits#setting-up-care-templates-via-afiax-admin-app)

#### Documentation Coming Soon:

- Tasks
- Messages
- Labs
- Medications
