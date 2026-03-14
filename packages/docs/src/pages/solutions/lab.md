# Lab, Diagnostics, and Laboratory Networks

Afiax uses Medplum as the clinical core for laboratory and diagnostics workflows while integrating analyzers,
middleware, logistics services, partner portals, and external EHRs around that core.

## Common solution patterns

- primary lab workflow platform for diagnostics operations
- interoperability hub for multi-lab or multi-partner networks
- structured results API for downstream consumers
- patient-facing records and test-status experiences
- provider-facing order and result review portals

## What Medplum owns in this pattern

Within the Afiax architecture, Medplum should own:

- canonical patient, order, specimen, and diagnostic result records
- workflow resources such as tasks, communications, and documents
- audit, provenance, and operational traceability
- internal workflow operations and Bot-driven orchestration

External systems can still own analyzer control, middleware logic, courier workflows, billing, or local facility
systems, but Medplum remains the clinical source of truth for the normalized record.

## Core capabilities

- **diagnostic catalog modeling:** represent panels and assays with FHIR-native definitions and terminology
- **machine and middleware integration:** connect HL7 and related protocols through the Afiax integration layer
- **results delivery:** publish structured `DiagnosticReport` data and derived PDFs or attachments
- **partner access:** expose results and operational status through provider portals or APIs
- **patient access:** surface records and follow-up workflows in patient-facing applications where appropriate

## External systems commonly involved

- analyzers and laboratory instruments
- middleware and interface engines
- legacy LIS deployments
- logistics and sample movement systems
- referring provider networks
- EHRs, payer systems, and country-specific reporting endpoints

## Related docs

- [Interoperability and country exchange](/solutions/interoperability)
- [Interoperability engine](/products/integration)
- [Afiax Agent](/solutions/agent)
- [Bots](/products/bots)
- [Diagnostic catalog](/docs/careplans/diagnostic-catalog)
- [Reference ranges](/docs/careplans/reference-ranges)
