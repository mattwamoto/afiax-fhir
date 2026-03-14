---
sidebar_position: 1
---

# Afiax Architecture

Afiax Connected Healthcare is being built as a **pan-African digital health platform** on top of a Medplum-derived
clinical core.

The platform starts in Kenya, but Kenya is treated as the first country-pack implementation rather than the boundary
of the platform itself.

## Platform shape

Afiax is intentionally structured into four layers:

1. **Pan-African core**  
   A country-neutral canonical FHIR model, shared domain services, access policies, subscriptions, Bots, and internal
   operations.
2. **Digital service layer**  
   Provider workflows, patient-facing experiences, analytics, telemedicine, partner APIs, and administrative tooling.
3. **Country packs**  
   Modular overlays for national registries, payer rails, terminology, compliance, and interoperability workflows.
4. **Tenant overlays**  
   Customer-specific configuration, credentials, facility identifiers, workflow toggles, and deployment choices.

## Design principles

- Keep the core model country-neutral.
- Express national requirements in country packs, not core resource mutations.
- Use canonical Medplum FHIR resources as the source of truth.
- Generate exchange payloads as derived views from canonical data.
- Prevent UI applications from calling national APIs directly.
- Preserve traceability through `AuditEvent`, `Provenance`, normalized statuses, and correlation IDs.

## Broader Afiax platform intent

The Afiax platform is meant to support:

- cloud-based clinical record management
- interoperability across public and private health ecosystems
- telemedicine and remote-care workflows
- analytics and AI-driven decision support
- developer and partner extensibility through platform APIs and contracts
- multiple delivery models, from shared SaaS to managed sovereign deployments

## Delivery models

The architecture is designed to support several operating models:

- **Shared SaaS** for organizations that can share infrastructure with project-level isolation
- **Dedicated SaaS** for customers requiring isolated runtime boundaries
- **Managed PaaS** for customers that want Afiax to operate the platform inside their cloud footprint
- **Sovereign deployments** where identifiable clinical workflows and storage remain in-country

## Kenya in context

Kenya remains important, but it sits under the country-pack model:

- Kenya is the **first reference pack**
- its registries, payer rails, and exchange rules belong in the Kenya pack
- the core architecture should remain reusable for future East African and broader African markets
- expansion should be achieved by adding packs and overlays, not by rewriting the core

## Next documents

- [Enterprise platform](./enterprise-platform)
- [Medplum integration boundaries](./integration-boundaries)
- [Canonical FHIR model](./canonical-model)
- [Country packs](../country-packs)
