---
sidebar_position: 2
---

# Enterprise Platform

Afiax Connected Healthcare is not only an interoperability project. It is a broader digital health platform intended
to support healthcare providers, health programs, payers, and partners across Africa.

## Platform capability areas

Afiax is being shaped around five major capability areas:

1. **Clinical core**  
   Medplum-derived FHIR services, access policies, subscriptions, custom operations, and auditable workflow automation.
2. **Interoperability and exchange**  
   National registries, payer connections, exchange publishing, HL7/FHIR integration, and country-pack adapters.
3. **Digital care services**  
   Provider applications, patient experiences, telemedicine, and remote-care workflows built on the same data layer.
4. **Analytics and AI**  
   Reporting, dashboards, predictive services, and decision support using normalized clinical and operational data.
5. **Developer and partner platform**  
   APIs, Bots, mapping services, and packaging contracts that allow Afiax teams and partners to extend the platform.

## High-level architecture

| Layer | Scope |
| --- | --- |
| Experience layer | provider app, patient app, admin console, partner APIs |
| Clinical platform layer | Medplum server, FHIR resources, access policies, Bots, subscriptions, custom FHIR operations |
| Shared domain services | identity orchestration, scheduling, notifications, billing core, document management |
| Country packs | national registries, eligibility, payer adapters, terminology, exchange connectors, compliance artifacts |
| Integration layer | Medplum Agent, HL7/ASTM/DICOM adapters, external payer and public-health connectors |
| Data layer | PostgreSQL, object storage, audit logs, backups, reconciliation data |

## Delivery models

The platform is intended to support multiple commercial and operational models:

- **Shared SaaS** for customers that can use shared infrastructure with tenant isolation
- **Dedicated SaaS** for customers that require isolated runtime boundaries
- **Managed PaaS** for customers running Afiax inside their own cloud or sovereign environment
- **Infrastructure-oriented services** for data storage, compute, and security controls aligned with regulated health workloads

This aligns with the broader Afiax business model of combining SaaS, PaaS, and infrastructure-oriented service
patterns depending on customer maturity and market needs.

## Why this matters for the docs

The documentation should communicate that:

- the core platform is pan-African in ambition
- Kenya is a localization path, not the entire product strategy
- country packs exist to protect the broader platform from national lock-in
- analytics, telemedicine, partner APIs, and digital-service layers sit alongside interoperability, not beneath it

## Current implementation sequence

Afiax should still build the platform in stages:

1. Lock the core architecture and canonical FHIR model.
2. Prove the country-pack SDK with Kenya.
3. Stabilize exchange, eligibility, and auditability.
4. Expand digital services such as telemedicine, analytics, and partner-facing capabilities on the same platform.
5. Add additional country packs without rewriting the core.

## Related docs

- [Architecture overview](./index)
- [Canonical FHIR model](./canonical-model)
- [Country packs](../country-packs)
- [Afiax website](https://www.afiax.africa)
