# Afiax Bots and Workflow Automation

Bots are the main automation primitive inside the Afiax platform. They run workflow logic close to the clinical core
and are used to connect internal events to external systems in an auditable, retry-safe way.

## What Bots do

Afiax Bots are commonly used to:

- react to resource changes via subscriptions
- call external APIs and normalize responses
- generate derived documents or exchange bundles
- orchestrate notifications, scheduling, and care coordination
- implement country-pack workflows such as verification, eligibility, exchange submission, and reconciliation

## Design principles

Bots should be:

- single-responsibility
- idempotent
- safe to retry
- traceable through `AuditEvent` and related workflow records
- separated from UI concerns and direct user-session logic

## Common invocation patterns

- **via subscription** when a FHIR resource changes
- **via custom FHIR operation** when an internal platform workflow is triggered
- **via questionnaire workflow** when form completion should create downstream actions
- **via API** when an external system or partner needs to invoke an auditable workflow

## Typical Afiax use cases

- registry verification and authority checks
- eligibility and coverage lookups
- referral routing and notification
- record publishing and exchange submission
- claim packaging and payer submission
- reconciliation and exception handling
- document generation and file movement

## Related docs

- [Bots technical docs](/docs/bots)
- [Custom FHIR operations](/docs/bots/custom-fhir-operations)
- [Interoperability engine](/products/integration)
- [Country pack SDK](/docs/country-packs/sdk)

## System diagram

![Medplum system overview](/img/medplum-overview.svg)
