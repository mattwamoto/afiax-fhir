---
sidebar_position: 2
---

# Canonical FHIR Model

The canonical data model is the contract that keeps Afiax reusable across countries, delivery models, and product
surfaces.

## Design intent

- Keep the clinical source of truth country-neutral.
- Model national requirements as overlays, not core mutations.
- Let provider apps, patient apps, analytics services, and interoperability workflows share the same underlying data contract.
- Preserve clean separation between core, country, and tenant concerns.

## Profile layering

Afiax uses a three-layer profile strategy:

- **Core**: shared pan-African semantics and workflows
- **Country**: national identifiers, terminology, regulatory bindings, and exchange rules
- **Tenant**: customer-specific constraints and rollout toggles

The core model must not contain Kenya-specific field names such as DHA, SHA, MFL, or HWR, and it should avoid any
other country authority names for the same reason.

## Canonical resource domains

The initial Afiax platform should center on these shared domains:

- `Patient`
- `Practitioner`
- `PractitionerRole`
- `Organization`
- `Location`
- `Coverage`
- `Encounter`
- `Task`
- `Communication`
- `Consent`
- `AuditEvent`
- `Provenance`
- `DocumentReference` or `Composition`

Additional domains such as `Claim`, `ClaimResponse`, `Invoice`, and advanced program workflows can be layered in once
the interoperability and clinical coordination spine is stable.

## Identifier architecture

The core model should preserve category-level meaning rather than country-specific names. Country packs can then bind
those categories to local identifiers:

| Category | Core meaning | Kenya binding example | Resources |
| --- | --- | --- | --- |
| `internal-record-id` | local platform or tenant identifier | MRN | most master resources |
| `national-client-id` | national patient authority identifier | DHA client registry ID | `Patient` |
| `facility-authority-id` | national facility authority identifier | MFL code | `Organization`, `Location` |
| `practitioner-authority-id` | national professional authority identifier | HWR ID | `Practitioner` |
| `payer-member-id` | payer or beneficiary identifier | SHA member ID | `Coverage` |

## Operation model

Applications should call generic internal operations. Country packs provide the country-specific implementations behind
those contracts.

| Generic operation | Purpose | Kenya implementation |
| --- | --- | --- |
| `$resolve-patient-identity` | resolve or verify patient identity | `Patient/$resolve-cr` |
| `$verify-facility-authority` | verify a facility identifier | `Organization/$verify-facility-authority` |
| `$verify-practitioner-authority` | verify clinician credentials | `Practitioner/$verify-hwr` |
| `$check-coverage` | perform eligibility or coverage verification | `Coverage/$check-eligibility` |
| `$publish-national-record` | submit a national clinical exchange payload | `Encounter/$publish-shr` |
| `$submit-national-claim` | submit a country-specific claim bundle | `Claim/$submit-sha` |

Kenya is shown here only as the current reference implementation. Future country packs should plug into the same
generic operation model.

The current Kenya facility verification path uses the canonical `facility-authority-id` binding, resolves the MFL code
from the `Organization`, authenticates against DHA AfyaLink, and writes the verification outcome back into Medplum
using normalized status plus workflow records.

## Guardrails

- Keep Medplum resources as the editable source of truth.
- Generate national bundles from canonical resources using mappings and Bots.
- Store country-specific reconciliation state as extensions or workflow resources.
- Use workflow resources such as `Task`, `AuditEvent`, and `Provenance` to trace external verification and exchange steps.
- Avoid tenant shortcuts that weaken the core model.
- Require every country pack to map from the canonical model instead of redefining it.
- Keep country-pack contracts documented and versioned so the platform can add markets without changing core semantics.
