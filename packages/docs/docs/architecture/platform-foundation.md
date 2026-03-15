---
sidebar_position: 6
---

# Platform Foundation

Afiax FHIR is the product documented in this repo.

It is built on top of Medplum open-source software and extended for the Afiax Connected Healthcare program under
Oortcloud Computing.

## Naming model

Use these names consistently:

- `Afiax FHIR`
  - the FHIR-native clinical core in this repo
- `Afiax Enterprise`
  - the broader commercial platform offering that connects Afiax FHIR to adjacent services
- `Medplum`
  - the upstream open-source foundation

## Rebrand rule

Product-facing docs and UI copy should present this repo as Afiax FHIR.

Technical and upstream references should remain Medplum where needed, including:

- package namespaces such as `@medplum/*`
- FHIR profile and canonical URLs already defined by the upstream platform
- open-source attribution, license, and notice material
- references to inherited upstream examples or behavior

## Why this matters

This keeps the documentation honest in both directions:

- users see a real Afiax product instead of a raw fork
- developers still understand where the upstream foundation begins and where Afiax extensions start

## Current repo responsibility

This repo documents and implements:

- Afiax FHIR core behavior
- pack-aware administration and workflow surfaces
- country-pack contracts
- Medplum-aligned extensions needed for Afiax Enterprise

Adjacent services such as gateways, Knative executors, ERP integrations, and mobile applications remain part of the
broader Afiax Enterprise architecture, but not part of the core documented scope of this repo.
