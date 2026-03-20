---
sidebar_position: 6
---

# Platform Foundation

Afiax FHIR is the product documented in this repo.

It is built on top of Medplum open-source software and extended for the Afiax Connected Healthcare program under
Oortcloud Computing.

This page exists to keep the naming, attribution, and engineering scope honest while still documenting the repo as a
real Afiax product rather than a generic fork.

## Naming model

Use these names consistently:

- `Afiax FHIR`
  - the FHIR-native clinical core in this repo
- `Afiax Enterprise`
  - the broader commercial platform offering that connects Afiax FHIR to adjacent services
- `Afiax Connected Healthcare`
  - the broader program and market-facing initiative under Oortcloud Computing
- `Medplum`
  - the upstream open-source foundation

## What this means in practice

When documenting or implementing behavior in this repo:

- use `Afiax FHIR` for the product behavior in this repo
- use `Afiax Enterprise` when discussing the surrounding commercial platform
- use `Medplum` only where the upstream foundation, technical namespace, or legal attribution matters

This is the rule that lets the docs read like a product without hiding the upstream base.

## Rebrand rule

Product-facing docs and UI copy should present this repo as Afiax FHIR.

Technical and upstream references should remain Medplum where needed, including:

- package namespaces such as `@medplum/*`
- FHIR profile and canonical URLs already defined by the upstream platform
- open-source attribution, license, and notice material
- references to inherited upstream examples or behavior

Do not do a blind global rename of `Medplum` to `Afiax`. That breaks both technical accuracy and upstream alignment.

## Current engineering scope of this repo

This repo currently documents and implements:

- Afiax FHIR core behavior
- pack-aware administration and workflow surfaces
- country-pack contracts
- Medplum-aligned extensions needed for Afiax Enterprise
- documentation contracts for Afiax Billing, Afiax Pay, and partner integrations

This repo does not currently implement:

- Afiax Billing ERP execution
- Afiax Pay execution logic
- Lami partner transport
- mobile gateway implementation
- analytics or AI services

Adjacent services such as gateways, Knative executors, ERP integrations, and mobile applications remain part of the
broader Afiax Enterprise architecture, but not part of the core documented scope of this repo.

## Upstream alignment rule

Afiax FHIR is a Medplum-based product, not a rewrite of Medplum.

That means this repo should preserve:

- upstream package compatibility where practical
- Medplum-aligned extension points
- open-source attribution
- a clean conceptual split between upstream foundation and Afiax-specific adaptation

It should avoid:

- renaming technical namespaces without a migration strategy
- hiding the upstream base in legal or technical docs
- changing core behavior only for branding reasons

## Why this matters

This keeps the project honest in both directions:

- users and partners see a real Afiax product rather than a raw fork
- developers still understand where the upstream foundation begins and where Afiax-specific extensions start
- maintainers can keep the repo aligned with Medplum concepts instead of drifting into an incompatible platform

## Practical documentation rule

When writing docs in this repo:

- product pages should sound like Afiax FHIR
- architecture pages should explain how Afiax FHIR fits into Afiax Enterprise
- country-specific behavior should live in country-pack docs
- upstream-specific behavior or attribution should still name Medplum when that is the technically correct reference

## Related docs

- [Architecture overview](./index)
- [Enterprise platform](./enterprise-platform)
- [Canonical FHIR model](./canonical-model)
- [Country packs](../country-packs)
