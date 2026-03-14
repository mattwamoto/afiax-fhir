# Afiax Connected Healthcare

Afiax Connected Healthcare is a Kenya-first, pan-African digital health platform built on a Medplum-derived FHIR
core.

The fork is being organized around three layers:

- **Pan-African core**: a country-neutral canonical FHIR model for shared workflows
- **Country packs**: modular overlays for registries, payer rails, terminology, compliance, and national exchange
- **Tenant overlays**: customer-specific configuration, secrets, and workflow toggles without mutating the shared core

## Current Direction

The first reference deployment is **Kenya**. The immediate build focus is:

- patient, facility, and practitioner verification
- coverage and eligibility
- encounter-driven national record publishing
- auditable workflow orchestration
- Kenya-specific connectors packaged as a reusable country pack

The core design goal is to prove Kenya deeply without turning the platform into a Kenya-only fork.

## Architecture References

- `/docs/architecture`
- `/docs/architecture/canonical-model`
- `/docs/architecture/kenya-country-pack`

## Compatibility Note

Internal `@medplum/*` package names and most low-level module boundaries are intentionally preserved for now. Public
branding and architecture are being updated first; invasive internal package renames can follow later if needed.

## Codebase

The repo remains a TypeScript monorepo with the same major subsystems:

```sh
medplum/
├── packages
│   ├── agent           # On-premise and edge connectivity
│   ├── app             # Afiax web application
│   ├── bot-layer       # Bot runtime support
│   ├── cdk             # Infrastructure as code
│   ├── cli             # Command line interface
│   ├── core            # Core shared library
│   ├── definitions     # FHIR and platform definitions
│   ├── docs            # Documentation site
│   ├── examples        # Example applications and bots
│   ├── fhir-router     # FHIR URL router
│   ├── fhirtypes       # FHIR TypeScript definitions
│   ├── generator       # Code generation utilities
│   ├── graphiql        # GraphQL tooling
│   ├── hl7             # HL7 client and server support
│   ├── mock            # Mock data for tests
│   ├── react           # Shared React component library
│   ├── react-hooks     # Shared React hooks
│   └── server          # Backend API server
└── scripts             # Helper scripts
```

## License

[Apache 2.0](LICENSE.txt)
