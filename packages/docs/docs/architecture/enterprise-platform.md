---
sidebar_position: 2
---

# Enterprise Platform

This page describes the broader platform shape around Afiax FHIR.

It is intentionally wider than this repo, but it should still be read from an implementation point of view:

- what belongs in this repo
- what belongs in adjacent services
- what is already implemented here
- what should be built next without collapsing the platform into one codebase

## Core interpretation

Afiax Enterprise is not a single application.

It is a layered platform built around:

- Afiax FHIR as the clinical core
- country packs as national adaptation layers
- digital products and operator workflows around that core
- enterprise systems such as Afiax Billing and Afiax Pay
- partner and gateway services outside the clinical core

This repo is the Afiax FHIR layer plus the pack-aware contracts and UI needed to operate it.

## Platform capability map

The broader Afiax platform breaks down into six capability areas.

### 1. Clinical core

This is Afiax FHIR.

It includes:

- FHIR resources
- access control
- auditability
- bots
- subscriptions
- generic internal operations
- workflow evidence

### 2. Country interoperability

This is the country-pack layer.

It includes:

- registry checks
- payer connectivity
- terminology bindings
- eligibility workflows
- exchange publishing
- country-specific adapters and mappings

### 3. Digital products

These are the user-facing products that sit on the shared data model.

They include:

- provider tools
- patient experiences
- telemedicine and care coordination surfaces
- admin workflows
- partner-facing operational experiences

### 4. Enterprise systems

These are the adjacent execution systems around the clinical core.

They include:

- Afiax Pay
- Afiax Billing
- CRM
- HR
- training and CPD
- pharmacy inventory and operational enterprise tooling

### 5. Analytics and decision support

These are the reporting, dashboard, and intelligence layers built on normalized data.

They include:

- operational reporting
- reconciliation dashboards
- analytics pipelines
- AI and decision-support services

### 6. Developer and partner platform

These are the extension and integration surfaces around Afiax Enterprise.

They include:

- extension contracts
- integration services
- partner APIs
- reusable country-pack patterns
- gateway and execution services

## High-level platform layers

| Layer | Scope | Primary ownership |
| --- | --- | --- |
| Experience layer | provider app, patient app, admin console, partner APIs | digital products and experience teams |
| Clinical platform layer | Afiax FHIR server, FHIR resources, access policies, bots, subscriptions, custom operations | this repo |
| Shared domain services | identity orchestration, scheduling, notifications, workflow support | adjacent platform services |
| Country packs | registries, payer adapters, terminology, exchange connectors, compliance artifacts | this repo plus pack-adjacent services |
| Enterprise systems | Afiax Pay, Afiax Billing, CRM, HR, training, pharmacy inventory | external enterprise systems |
| Integration services | gateways, Medplum Agent, adapters, Knative executors, ERP connectors, partner connectors | external integration services |
| Data layer | PostgreSQL, object storage, audit logs, backups, reconciliation data | platform infrastructure |

## What this repo should cover

This repo should focus on:

- canonical resources and shared semantics
- country-pack contracts and dispatch
- pack-aware admin UX
- generic operations and workflow evidence
- Afiax FHIR-side connector boundaries
- documentation that defines how adjacent systems integrate with the core

This repo should not become the home for every adjacent service.

Keep these outside this repo:

- mobile gateways
- Knative connector services
- Afiax Billing and other enterprise systems
- heavy analytics pipelines
- standalone AI services
- country-specific transport services that only proxy remote APIs
- partner-specific embedded-insurance implementations

## Current implementation state

Implemented in this repo now:

- Afiax FHIR branding and product framing
- country-pack selection during project creation and project administration
- Kenya HIE and SHA configuration, credential ownership, and onboarding
- Kenya facility, practitioner, coverage, and claim workflows
- generic operation dispatch into Kenya handlers
- workflow evidence through `Task`, `AuditEvent`, `CoverageEligibilityRequest`, `CoverageEligibilityResponse`, and `ClaimResponse`
- optional workflow-bot handoff after Kenya claim submit and claim status refresh

Not implemented in this repo now:

- Afiax Billing ERP execution
- Afiax Pay execution
- Lami partner transport
- callback and reconciliation worker services
- mobile gateway implementation
- analytics and AI services

The enterprise docs should always make that split explicit so the repo scope stays honest.

## Platform sequencing rule

Build the enterprise platform in this order:

1. lock the core model and integration boundaries
2. prove the country-pack contract with the first active pack
3. stabilize verification, eligibility, submit, status, audit, and reconciliation evidence
4. add adjacent integration services where the core needs them
5. expand into provider, patient, analytics, and partner-facing products
6. add more country packs without changing core semantics

This sequence is already visible in the Kenya-first implementation.

## Delivery model assumptions

The platform is designed to support more than one runtime model:

- `Shared SaaS`
- `Dedicated SaaS`
- `Managed PaaS`
- `Sovereign deployment`

These deployment models matter, but they should not drive early product complexity inside the repo.

Implementation rule:

- deployment shape changes where services run
- deployment shape should not redefine the canonical model or pack contract

## Enterprise boundary rules

### What should stay in Afiax FHIR

Keep these in the core:

- canonical clinical and reimbursement state
- pack-aware workflow contracts
- normalized evidence and reconciliation visibility
- final care-linked and reimbursement-linked write-back

### What should move into adjacent services

Move these out:

- ERP execution
- payment execution
- long-running integration workers
- partner-specific transport
- gateway-only logic that does not own canonical state

### What country packs should own

Country packs should own:

- country-specific identifiers
- regulator and payer mappings
- country-specific connector behavior
- pack-specific workflow normalization

## Practical interpretation

For current implementation work, the important points are:

- Kenya is the first active pack, but the platform is not Kenya-shaped
- Afiax FHIR remains the clinical core
- external services can exist around it without being merged into this repo
- the broader platform should grow by adding layers around the core, not by stuffing every concern into Afiax FHIR
- Afiax Billing can own finance, pharmacy inventory, CRM, HR, and training without taking over the clinical record
- Afiax Pay can own payments without taking over reimbursement truth

## Decision checklist

When a new enterprise feature is proposed, ask:

1. does it change canonical clinical or reimbursement state
2. is it country-specific regulator or payer behavior
3. is it payment execution
4. is it ERP or enterprise operations execution
5. is it only an integration, callback, or orchestration wrapper

Interpretation:

- if 1 is yes, it belongs here
- if 2 is yes, it belongs in a country pack
- if 3 is yes, it belongs with Afiax Pay
- if 4 is yes, it belongs with Afiax Billing or another enterprise service
- if 5 is yes, it belongs in an external gateway or integration service

## What not to do

- do not treat the first active pack as the shape of the whole platform
- do not collapse gateway or connector logic into Afiax FHIR core
- do not let analytics or AI requirements distort the canonical model early
- do not add broad enterprise modules before verification, eligibility, submit, and status workflows are stable
- do not let external systems quietly become the only visible ledger of reimbursement or settlement state

## Related docs

- [Architecture overview](./index)
- [Platform foundation](./platform-foundation)
- [Afiax financial architecture](./financial-architecture)
- [Afiax FHIR and Afiax Pay boundary](./afiax-pay-boundary)
- [Lami embedded insurance boundary](./lami-embedded-insurance-boundary)
- [Afiax FHIR integration boundaries](./integration-boundaries)
- [Afiax FHIR and Afiax Billing boundary](./afiax-billing-boundary)
- [Afiax FHIR and Afiax Billing contract](./afiax-billing-contract)
- [Afiax FHIR and Afiax Billing object mapping](./afiax-billing-object-mapping)
- [Afiax FHIR and Afiax Billing status model](./afiax-billing-status-model)
- [Afiax FHIR and Afiax Billing payload spec](./afiax-billing-payload-spec)
- [Canonical FHIR model](./canonical-model)
- [Country packs](../country-packs)
- [Afiax website](https://www.afiax.africa)
