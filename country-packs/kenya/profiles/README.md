# Profiles

This directory is for formal Kenya-specific FHIR profile artifacts.

Today, the Kenya pack already enforces a meaningful amount of Kenya behavior through canonical identifiers, resource
extensions, operation handlers, and resource-page UX. What is still missing here is the explicit profile layer that
turns those conventions into standalone conformance artifacts.

## Current status

There are no standalone Kenya profile definitions in this directory yet.

The current Kenya profile semantics live primarily in code:

- `packages/core/src/kenya.ts`
- Kenya resource panels in `packages/app/src/resource/`
- Kenya handlers in `packages/server/src/country-pack/kenya/`

That means the Kenya pack already has de facto profile rules even though the formal StructureDefinition files have not
been authored here yet.

## Current profile-like behavior already implemented

### Organization

Current Kenya-specific behavior:

- Kenya facility code / MFL code stored in `Organization.identifier`
- facility registration number stored in `Organization.identifier`
- Kenya facility registry snapshot stored in `Organization.extension`
- Kenya facility verification snapshot stored in `Organization.extension`

### Practitioner

Current Kenya-specific behavior:

- national ID or passport stored in `Practitioner.identifier`
- health worker registration number stored in `Practitioner.identifier`
- Kenya practitioner registry snapshot stored in `Practitioner.extension`
- Kenya practitioner verification snapshot stored in `Practitioner.extension`

### Coverage

Current Kenya-specific behavior:

- Kenya eligibility lookup identifiers stored in `Coverage.identifier`
- Kenya eligibility snapshot stored in `Coverage.extension`

### Claim

Current Kenya-specific behavior:

- Kenya national claim submission snapshot stored in `Claim.extension`
- Kenya national claim status snapshot stored in `Claim.extension`

## Current extension surfaces

The current Kenya extension contracts are defined in `packages/core/src/kenya.ts`.

Current extension base URLs:

```text
https://afiax.africa/fhir/StructureDefinition/kenya-facility-verification
https://afiax.africa/fhir/StructureDefinition/kenya-facility-registry
https://afiax.africa/fhir/StructureDefinition/kenya-practitioner-verification
https://afiax.africa/fhir/StructureDefinition/kenya-practitioner-registry
https://afiax.africa/fhir/StructureDefinition/kenya-coverage-eligibility
https://afiax.africa/fhir/StructureDefinition/kenya-national-claim-submission
https://afiax.africa/fhir/StructureDefinition/kenya-national-claim-status
```

These are the first profile artifacts engineers should formalize in this folder when the Kenya pack moves from code
convention to explicit conformance material.

## What belongs here

Put these kinds of artifacts in this folder:

- StructureDefinition files for Kenya resource extensions
- StructureDefinition files for constrained Kenya resource usage
- profile-level bindings to Kenya value sets
- implementation notes about cardinality, must-support, and invariants

## What does not belong here

Do not put these things here:

- raw DHA payload examples
- bot event contracts
- runtime code snippets
- ERPNext or Afiax Billing models

## Suggested first profile artifacts

If you want to formalize the current implementation, start with:

1. facility registry extension profile
2. facility verification extension profile
3. practitioner registry extension profile
4. practitioner verification extension profile
5. coverage eligibility extension profile
6. claim submission and claim-status extension profiles

After that, add constrained usage notes for:

- `Organization`
- `Practitioner`
- `Coverage`
- `Claim`

## Engineering rule

Do not add a formal profile file here unless the runtime behavior already exists or is being implemented in the same
change. This folder should document actual Kenya pack behavior, not speculative conformance design.
