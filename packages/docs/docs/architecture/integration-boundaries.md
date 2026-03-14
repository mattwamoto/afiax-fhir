---
sidebar_position: 3
---

# Medplum Integration Boundaries

Afiax is using Medplum as the clinical core, not as the owner of every system concern in the broader platform. This
document defines what should live in Medplum and what should remain in external systems.

## What Medplum should own

Within the Afiax platform, Medplum should own:

- canonical clinical and operational FHIR resources
- country-neutral profiles and validation rules
- internal workflow operations and subscriptions
- Bot-based orchestration that acts on clinical records
- access control, tenant isolation, audit, and provenance
- normalized representations of exchange outcomes and reconciliation state
- country-pack mappings, terminology bindings, and connector contracts where they relate directly to clinical exchange

In short: if something is part of the regulated clinical source of truth or must be traceable back to a clinical
workflow, it belongs in Medplum or in Medplum-adjacent country-pack artifacts.

## What external systems should own

External systems may still be authoritative for their own domains. Examples include:

- finance, accounting, CRM, HR, and general operations platforms
- commerce and storefront systems
- mobile application local caches and presentation-layer state
- device firmware and local hardware control
- external AI inference or orchestration services
- national registries, payer endpoints, and regulator-owned exchange services
- logistics, courier, and third-party partner tools

Medplum should integrate with these systems, but should not absorb their full domain models unless those models are
needed as part of the clinical record.

## Recommended interaction pattern

The preferred pattern is:

1. Store the canonical clinical record in Medplum.
2. Trigger internal operations or Bots from Medplum events.
3. Call external systems through connector layers or integration services.
4. Normalize the outcome back into Medplum using shared platform semantics.
5. Preserve correlation, audit, provenance, and reconciliation state.

This keeps Medplum as the source of truth for what happened clinically while allowing external systems to remain
systems of record for their own operational domains.

## What not to do

- Do not call national APIs directly from UI applications.
- Do not hard-code country-specific identifiers into the shared Medplum core.
- Do not move final clinical state into ERP, commerce, or mobile-local models.
- Do not let external exchange payloads become the primary documentation model.
- Do not bake Kenya-specific rules into generic UI or platform components.

## Kenya-specific note

Kenya remains the first reference implementation, but the same boundary rules apply there:

- DHA, SHA, HWR, MFL, and related integrations should be packaged behind Kenya-specific mappings, operations, and
  connectors.
- The Medplum core should remain reusable for future country packs.

## Related docs

- [Architecture overview](./index)
- [Enterprise platform](./enterprise-platform)
- [Canonical FHIR model](./canonical-model)
- [Country packs](../country-packs)
