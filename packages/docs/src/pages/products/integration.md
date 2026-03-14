# Interoperability and Integration Engine

Afiax uses interoperability as a platform capability, not as a side feature. The integration layer connects the
canonical clinical core to registries, payers, legacy systems, partner platforms, and national exchange services.

## Role in Afiax

The interoperability engine is responsible for:

- receiving and normalizing inbound clinical and operational data
- orchestrating outbound exchange to partner and national systems
- transforming canonical FHIR data into country-specific payloads
- preserving audit, provenance, correlation IDs, and reconciliation state
- keeping national logic inside country packs instead of leaking it into the UI or core model

## Common connection patterns

Afiax is designed to support multiple interface types:

| Interface type | Typical uses |
| --- | --- |
| FHIR and REST | EHRs, payer services, partner platforms, registries |
| HL7v2 | labs, legacy hospital systems, diagnostics workflows |
| SFTP and file exchange | government programs, batch submissions, reconciliation feeds |
| Documents and structured payloads | claims, referrals, reports, attachments, exchange bundles |
| Webhooks and event APIs | notifications, payments, analytics, messaging, partner workflows |

## Country-pack localization

The interoperability engine stays generic at the platform level. Country-specific behavior belongs in country packs:

- registries and authority verification
- eligibility and payer checks
- shared health record or national exchange publishing
- claims submission and reconciliation
- local terminology and payload mappings

Kenya is the first reference implementation of this model, but it should remain one pack in a larger platform.

## How integrations are built

Afiax combines several runtime patterns:

- **Bots** for event-driven orchestration and external API calls
- **custom FHIR operations** for stable internal workflow contracts
- **country-pack connectors** for localized remote systems
- **Afiax Agent-based bridging** for on-prem and legacy protocols
- **canonical mappings** to convert between internal resources and external exchange formats

## Example Afiax exchange scenarios

- verify a patient identifier against a national registry
- confirm facility or practitioner authority status
- check coverage or payer eligibility
- publish an encounter-driven national record
- submit a claim bundle through a country-specific payer connector
- ingest referrals, lab results, or partner events into the shared clinical record

## Related docs

- [Country packs](/docs/country-packs)
- [Kenya reference pack](/docs/country-packs/kenya)
- [Bots](/products/bots)
- [Afiax Agent](/solutions/agent)
- [FHIR datastore](/docs/fhir-datastore)
