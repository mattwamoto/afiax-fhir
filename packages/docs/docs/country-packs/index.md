---
sidebar_position: 1
---

# Country Packs

A country pack is Afiax's packaging model for national interoperability, payer, terminology, and compliance
requirements.

## Why country packs exist

Country packs let Afiax localize the platform without rewriting the core. They are the mechanism that keeps:

- the canonical FHIR model country-neutral
- the broader Afiax platform reusable across markets
- regulator and payer integrations isolated behind internal contracts
- tenant and customer customizations from leaking into platform fundamentals

## What belongs in a country pack

Each country pack is responsible for:

- national FHIR profiles and bindings
- country terminology and value sets
- connectors to registries, exchanges, and payer services
- mappings from canonical resources into national payloads
- Bots and operations for localized workflows
- compliance notes, runbooks, and evidence artifacts
- secrets and credential conventions for national integrations

## What does not belong in a country pack

- changes to Medplum core behavior that should remain generic
- direct UI-to-national API calls
- hard-coded national identifier names inside the shared canonical model
- tenant-specific shortcuts that should instead live in tenant overlays

## Lifecycle

Every country pack should move through the same lifecycle:

1. Design the national scope and regulatory touchpoints.
2. Bind the country requirements to the canonical model.
3. Implement connectors, mappings, operations, and Bots.
4. Validate against sandbox or UAT endpoints with fixtures.
5. Operationalize with audit, reconciliation, monitoring, and compliance evidence.

In practice, this means a pack should define both:

- non-sensitive project settings such as `countryPack=kenya`
- secret names for regulator-facing credentials such as registry usernames, passwords, and consumer keys

## Kenya in context

Kenya is the first reference implementation of the country-pack model. It is important because it proves the SDK and
localization pattern, not because it defines the whole Afiax platform.

## Next documents

- [Country pack SDK](./sdk)
- [Kenya reference pack](./kenya)
