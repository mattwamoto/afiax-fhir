---
sidebar_position: 1
---

# Afiax Architecture

This section is the entry point for the Afiax platform architecture docs.

Read it from the perspective of implementation:

- what Afiax FHIR is responsible for
- what country packs are responsible for
- what should stay in adjacent services
- how the active country pack fits into the wider platform

The current first active pack is Kenya, but the architecture is not Kenya-shaped.

## Architecture summary

Afiax is structured into four layers:

1. `Core platform`
   Afiax FHIR canonical resources, access control, workflow evidence, bots, and generic operations.
2. `Digital product layer`
   Provider tools, patient experiences, admin workflows, analytics, and partner-facing products.
3. `Country packs`
   National registries, payer rails, terminology, mappings, connector logic, and compliance artifacts.
4. `Tenant overlays`
   Customer-specific settings, credentials, rollout choices, and deployment-specific defaults.

## Working rules

These rules drive the implementation:

- keep the core model country-neutral
- use canonical FHIR resources as the editable source of truth
- express national requirements through country packs
- keep exchange payloads as derived artifacts, not primary records
- prevent browser and mobile UI from calling national APIs directly
- preserve workflow evidence through `Task`, `AuditEvent`, `Provenance`, and normalized statuses

## Current implementation direction

The current repo is focused on the clinical core and the first country-pack path.

That means:

- Afiax FHIR remains the system of record for clinical and operational workflows
- country-specific logic stays behind country packs
- settings and secrets are pack-aware in the admin UI
- adjacent services such as gateways and Knative executors stay outside this repo

## Why the layering matters

The layering is what prevents the platform from drifting into a single-country fork.

Examples:

- a facility authority code is a country binding for `facility-authority-id`
- regulator credentials are country config, not core model fields
- `Organization/$verify-facility-authority` is a generic operation name
- the active pack supplies the regulator-specific implementation

## Delivery models

The wider platform can support several operating models:

- `Shared SaaS`
- `Dedicated SaaS`
- `Managed PaaS`
- `Sovereign deployment`

Those are deployment choices around the platform. They should not distort the core model or early repo structure.

## Country-pack rollout

The first active pack matters because it proves the country-pack contract.

It should validate:

- pack selection in project setup
- pack-specific settings and secrets
- generic operation dispatch into a country handler
- normalized workflow evidence for external calls

Today that first active pack is Kenya. Success means the next country can be added by implementing another pack, not by
rewriting core behavior.

## Read these next

Use the rest of the architecture docs by question:

- if you need the broader platform shape:
  [Enterprise platform](./enterprise-platform)
- if you need the split between reimbursement, payments, and enterprise finance:
  [Afiax financial architecture](./financial-architecture)
- if you need to know what stays in or out of Afiax FHIR:
  [Afiax FHIR integration boundaries](./integration-boundaries)
- if you need the Afiax Billing, pharmacy, and workforce boundary:
  [Afiax FHIR and Afiax Billing boundary](./afiax-billing-boundary)
- if you need the concrete billing, payment, and pharmacy event contract:
  [Afiax FHIR and Afiax Billing contract](./afiax-billing-contract)
- if you need the Afiax FHIR resource-to-Afiax Billing document mapping:
  [Afiax FHIR and Afiax Billing object mapping](./afiax-billing-object-mapping)
- if you need the normalized billing, payment, claim, and pharmacy states:
  [Afiax FHIR and Afiax Billing status model](./afiax-billing-status-model)
- if you need the concrete JSON envelopes and event bodies:
  [Afiax FHIR and Afiax Billing payload spec](./afiax-billing-payload-spec)
- if you need the shared data contract:
  [Canonical FHIR model](./canonical-model)
- if you need the country-pack model:
  [Country packs](../country-packs)
