---
sidebar_position: 2
---

# Enterprise Platform

This page describes the broader platform shape around the Medplum core.

It is intentionally wider than the Medplum repo, but it should still be read from an implementation point of view:

- what belongs in this repo
- what belongs in adjacent services
- what should be built first
- what can wait until the core and first active country-pack path are stable

## Platform capability map

The broader Afiax platform breaks down into five capability areas:

1. `Clinical core`
   Medplum-based FHIR services, access control, auditability, bots, subscriptions, and internal operations.
2. `Country interoperability`
   Registry checks, payer connectivity, terminology, eligibility, exchange publishing, and country-pack adapters.
3. `Digital products`
   Provider tools, patient experiences, telemedicine, and admin workflows built on the shared data model.
4. `Analytics and decision support`
   Reporting, dashboards, AI services, and operational insight on normalized data.
5. `Developer and partner platform`
   Extension contracts, integration services, partner APIs, and reusable country-pack patterns.

## High-level architecture

| Layer | Scope |
| --- | --- |
| Experience layer | provider app, patient app, admin console, partner APIs |
| Clinical platform layer | Medplum server, FHIR resources, access policies, bots, subscriptions, custom operations |
| Shared domain services | identity orchestration, scheduling, notifications, document handling, workflow support |
| Country packs | registries, payer adapters, terminology, exchange connectors, compliance artifacts |
| Integration services | gateways, Medplum Agent, HL7/FHIR adapters, Knative executors, partner connectors |
| Data layer | PostgreSQL, object storage, audit logs, backups, reconciliation data |

## What this repo should cover

This Medplum fork should focus on:

- canonical resources and shared semantics
- country-pack contracts and dispatch
- pack-aware admin UX
- generic operations and workflow evidence
- Medplum-side connector boundaries
- docs that define how adjacent systems integrate with the core

This repo should not become the home for every adjacent service.

Keep these outside the Medplum repo:

- mobile gateways
- Knative connector services
- ERP or commerce systems
- heavy analytics pipelines
- standalone AI services
- country-specific transport services that only proxy remote APIs

## Delivery model assumptions

The platform is designed to support more than one runtime model:

- `Shared SaaS`
  - shared infrastructure with project isolation
- `Dedicated SaaS`
  - isolated runtime boundaries for specific customers
- `Managed PaaS`
  - Afiax-operated deployments in customer-owned or sovereign environments
- `Sovereign deployment`
  - in-country storage and execution for regulated workloads

Those deployment models matter, but they should not drive early product complexity inside the repo.

## Recommended build sequence

Build the enterprise platform in this order:

1. lock the core model and integration boundaries
2. prove the country-pack contract with the first active pack
3. stabilize verification, eligibility, audit, and reconciliation
4. add adjacent integration services where the core needs them
5. expand into provider, patient, analytics, and partner-facing products
6. add more country packs without changing core semantics

## Practical interpretation

For current implementation work, the important point is:

- the current first active pack is Kenya
- Medplum remains the clinical core
- external services can exist around it
- the broader platform should grow by adding layers around the core, not by stuffing every concern into the Medplum repo

## What not to do

- do not treat the first active pack as the shape of the whole platform
- do not collapse gateway or connector logic into Medplum core
- do not let analytics or AI requirements distort the canonical model early
- do not add broad enterprise modules before verification and exchange workflows are stable

## Related docs

- [Architecture overview](./index)
- [Medplum integration boundaries](./integration-boundaries)
- [Canonical FHIR model](./canonical-model)
- [Country packs](../country-packs)
- [Afiax website](https://www.afiax.africa)
