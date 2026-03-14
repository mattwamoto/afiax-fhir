# Interoperability and Country Exchange

Afiax uses interoperability as a delivery capability for health systems, partners, payers, and national programs. The
goal is not only to move data, but to keep exchange auditable, reusable, and isolated behind stable platform
contracts.

## Core exchange patterns

Afiax is designed to support:

- HL7 connectivity for legacy clinical systems
- FHIR and REST APIs for modern health platforms and payer services
- SFTP and batch exchange for programmatic or government workflows
- document and attachment exchange for referrals, claims, and record sharing
- event-driven integration through Bots, subscriptions, and custom operations

## Afiax Agent

The [Afiax Agent](/solutions/agent) provides a secure bridge for local-network protocols such as HL7 and DICOM. It is
useful where diagnostics systems, facility networks, or partner infrastructure cannot connect directly to the cloud.

## Country-pack exchange model

Afiax keeps exchange responsibilities split across layers:

- **core platform:** canonical FHIR model, internal operations, audit, provenance, access control
- **country packs:** national registries, eligibility, exchange endpoints, claims connectors, local terminology
- **tenant overlays:** organization-specific endpoints, secrets, rollout flags, and workflow decisions

This structure is what allows Kenya to be the first implementation without becoming the definition of the whole
platform.

## Example solution scenarios

- patient, facility, and practitioner verification against authority registries
- eligibility and coverage checks with public or private payers
- shared health record or national exchange publishing
- partner and referral network integrations
- diagnostics, labs, and imaging feed ingestion
- reporting and operational feeds into analytics or partner systems

## Related docs

- [Interoperability engine](/products/integration)
- [Afiax Agent](/solutions/agent)
- [Country packs](/docs/country-packs)
- [Bots](/products/bots)
