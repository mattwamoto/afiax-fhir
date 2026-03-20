---
sidebar_position: 1
---

# Afiax Architecture

This section is the entry point for the Afiax platform architecture docs.

Read it from the perspective of implementation:

- what Afiax FHIR is responsible for
- what country packs are responsible for
- what should stay in adjacent services
- how the current Kenya implementation fits into the wider platform

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

## How to use this section

Use the architecture docs in this order:

1. read this page to understand the top-level layers
2. read [Platform foundation](./platform-foundation) to understand the Afiax FHIR versus Medplum naming and scope model
3. read [Enterprise platform](./enterprise-platform) for the wider system shape
4. read [Canonical FHIR model](./canonical-model) for the shared data contract
5. read [Integration boundaries](./integration-boundaries) before adding any adjacent service or connector logic
6. read the billing, payments, and partner boundary pages when a workflow crosses into enterprise execution
7. read [Country packs](../country-packs) when you are working on national adaptation

## Working rules

These rules drive the implementation:

- keep the core model country-neutral
- use canonical FHIR resources as the editable source of truth
- express national requirements through country packs
- keep exchange payloads as derived artifacts, not primary records
- prevent browser and mobile UI from calling national APIs directly
- preserve workflow evidence through `Task`, `AuditEvent`, `Provenance`, normalized snapshots, and normalized statuses

## Current implementation direction

The current repo is focused on the clinical core and the first country-pack path.

That means:

- Afiax FHIR remains the system of record for clinical and reimbursement workflows
- country-specific logic stays behind country packs
- settings and secrets are pack-aware in the admin UI
- Kenya currently exercises the first complete path for facility, practitioner, coverage, and claim workflows
- adjacent services such as gateways, Knative executors, Afiax Billing, and Afiax Pay stay outside this repo

## Current repo reality

Implemented in this repo now:

- Afiax FHIR product framing and branding
- pack-aware project creation and project administration
- Kenya onboarding in `/admin/country-pack`
- Kenya HIE and SHA credential ownership flows
- Kenya facility, practitioner, coverage, claim submit, and claim-status workflows
- workflow evidence through `Task`, `AuditEvent`, `CoverageEligibilityRequest`, `CoverageEligibilityResponse`, and `ClaimResponse`
- optional workflow-bot handoff after asynchronous Kenya claim workflows

Not implemented in this repo now:

- Afiax Billing ERP execution
- Afiax Pay execution logic
- Lami partner transport
- mobile gateway implementation
- long-running reconciliation workers
- analytics and AI services

This section keeps repeating that split because it is the main architectural guardrail for the fork.

## Why the layering matters

The layering is what prevents the platform from drifting into a single-country fork or a mixed ERP/clinical monolith.

Examples:

- a facility authority code is a country binding for `facility-authority-id`
- regulator credentials are country config, not core model fields
- `Organization/$verify-facility-authority` is a generic operation name
- the active pack supplies the regulator-specific implementation
- ERP or payment execution remains outside the clinical core even when the result writes back into it

## Delivery models

The wider platform can support several operating models:

- `Shared SaaS`
- `Dedicated SaaS`
- `Managed PaaS`
- `Sovereign deployment`

Those are deployment choices around the platform. They should not distort the canonical model, pack contract, or repo
boundaries.

## Country-pack rollout

The first active pack matters because it proves the country-pack contract.

It should validate:

- pack selection in project setup
- pack-specific settings and secrets
- guided onboarding for the active pack
- generic operation dispatch into a country handler
- normalized workflow evidence for external calls

Today that first active pack is Kenya. Success means the next country can be added by implementing another pack, not by
rewriting core behavior.

## Decision guide

When you are deciding where a new feature belongs, ask:

1. does it change canonical clinical or reimbursement state
2. is it country-specific regulator or payer behavior
3. is it payment execution
4. is it ERP or enterprise operations execution
5. is it only an integration or orchestration wrapper

Interpretation:

- if 1 is yes, it belongs in Afiax FHIR
- if 2 is yes, it belongs in a country pack
- if 3 is yes, it belongs with Afiax Pay
- if 4 is yes, it belongs with Afiax Billing or another enterprise system
- if 5 is yes, it belongs in an external gateway, integration worker, or bot-backed service

## Read these next

Use the rest of the architecture docs by question:

- if you need the Afiax FHIR versus Medplum scope and naming model:
  [Platform foundation](./platform-foundation)
- if you need the broader platform shape:
  [Enterprise platform](./enterprise-platform)
- if you need the shared data contract:
  [Canonical FHIR model](./canonical-model)
- if you need the split between reimbursement, payments, and enterprise finance:
  [Afiax financial architecture](./financial-architecture)
- if you need to know what stays in or out of Afiax FHIR:
  [Afiax FHIR integration boundaries](./integration-boundaries)
- if you need the Afiax Pay payment and wallet boundary:
  [Afiax FHIR and Afiax Pay boundary](./afiax-pay-boundary)
- if you need the embedded-insurance partner boundary:
  [Lami embedded insurance boundary](./lami-embedded-insurance-boundary)
- if you need the Afiax Billing, pharmacy, and workforce boundary:
  [Afiax FHIR and Afiax Billing boundary](./afiax-billing-boundary)
- if you need the concrete billing and pharmacy event contract:
  [Afiax FHIR and Afiax Billing contract](./afiax-billing-contract)
- if you need the Afiax FHIR resource-to-Afiax Billing mapping:
  [Afiax FHIR and Afiax Billing object mapping](./afiax-billing-object-mapping)
- if you need the normalized billing, payment, claim, and pharmacy states:
  [Afiax FHIR and Afiax Billing status model](./afiax-billing-status-model)
- if you need the JSON envelopes and event bodies:
  [Afiax FHIR and Afiax Billing payload spec](./afiax-billing-payload-spec)
- if you need the country-pack model:
  [Country packs](../country-packs)
