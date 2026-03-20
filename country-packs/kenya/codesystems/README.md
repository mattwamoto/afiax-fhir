# CodeSystems

This directory is for Kenya-specific FHIR `CodeSystem` artifacts used by the Kenya pack.

The current Kenya implementation already relies on several stable identifier-system URIs and extension URLs. Those are
the first signs of a Kenya terminology and conformance layer, but they have not yet been authored here as formal
terminology artifacts.

## Current status

There are no standalone Kenya `CodeSystem` resources in this directory yet.

The current canonical Kenya identifiers and extension namespaces are defined in:

- `packages/core/src/kenya.ts`

## Current Kenya identifier systems in code

The Kenya pack currently uses these identifier system URIs:

```text
https://afiax.africa/kenya/identifier/mfl-code
https://afiax.africa/kenya/identifier/facility-registration-number
https://afiax.africa/kenya/identifier/health-worker-registration-number
https://afiax.africa/kenya/identifier/national-id
https://afiax.africa/kenya/identifier/passport-number
https://afiax.africa/kenya/identifier/coverage-national-id
https://afiax.africa/kenya/identifier/coverage-alien-id
https://afiax.africa/kenya/identifier/coverage-mandate-number
https://afiax.africa/kenya/identifier/coverage-temporary-id
https://afiax.africa/kenya/identifier/sha-number
https://afiax.africa/kenya/identifier/coverage-refugee-id
```

These are not all necessarily `CodeSystem` resources yet, but they are the active canonical URIs the Kenya pack uses
today.

## Current extension namespaces in code

The pack also uses these Kenya extension base URLs:

```text
https://afiax.africa/fhir/StructureDefinition/kenya-facility-verification
https://afiax.africa/fhir/StructureDefinition/kenya-facility-registry
https://afiax.africa/fhir/StructureDefinition/kenya-practitioner-verification
https://afiax.africa/fhir/StructureDefinition/kenya-practitioner-registry
https://afiax.africa/fhir/StructureDefinition/kenya-coverage-eligibility
https://afiax.africa/fhir/StructureDefinition/kenya-national-claim-submission
https://afiax.africa/fhir/StructureDefinition/kenya-national-claim-status
```

These are profile surfaces rather than code systems, but engineers working on Kenya terminology usually need to review
both sets together.

## What belongs here

Put these artifacts here when they exist:

- formal `CodeSystem` resources for Kenya-specific coded concepts
- terminology notes for code ownership and versioning
- supporting code lists referenced by Kenya `ValueSet` files

## What does not belong here

Do not put these things in this folder:

- identifier examples
- connector payloads
- UI option lists that are not formal terminology artifacts
- extension definitions themselves

## Recommended first code systems

If the Kenya pack starts formalizing terminology, these are the most likely first candidates:

1. practitioner identification type code system
2. coverage eligibility identification type code system
3. Kenya workflow-state code systems if the normalized state families stabilize enough to version formally

## Engineering rule

If a coded concept is only used in one local helper and is still changing quickly, keep it in code for now. Move it
into this folder once it becomes a stable contract shared by profiles, value sets, or downstream consumers.
