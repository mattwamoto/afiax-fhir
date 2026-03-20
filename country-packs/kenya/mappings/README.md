# Mappings

This directory is for explicit Kenya mapping contracts between canonical Afiax FHIR resources and Kenya-specific remote
payloads or normalized workflow state.

At the moment, most Kenya mapping logic still lives in code. This README explains where that logic exists today and how
engineers should move it into explicit mapping artifacts as the pack matures.

## Current status

There are no standalone mapping specification files in this directory yet.

The active Kenya mappings currently live in code:

- `packages/core/src/kenya.ts`
- `packages/server/src/country-pack/kenya/afyalink.ts`
- `packages/server/src/country-pack/kenya/sha.ts`
- `packages/server/src/country-pack/kenya/verify-facility-authority.ts`
- `packages/server/src/country-pack/kenya/verify-practitioner-authority.ts`
- `packages/server/src/country-pack/kenya/check-coverage.ts`
- `packages/server/src/country-pack/kenya/submit-national-claim.ts`
- `packages/server/src/country-pack/kenya/check-national-claim-status.ts`

That means the Kenya pack already has mappings, but they are encoded as helper functions and handler logic rather than
as first-class specification documents in this folder.

## Mapping surfaces already implemented

### Facility mapping

Current mapping responsibilities:

- map DHA facility lookup payloads into Kenya facility registry snapshot fields
- map facility verification results into Kenya verification snapshot fields
- map registry identifiers into canonical `Organization.identifier`
- auto-populate `Organization.name` from the registry result when appropriate

### Practitioner mapping

Current mapping responsibilities:

- map DHA practitioner lookup payloads into Kenya practitioner registry snapshot fields
- map practitioner verification results into Kenya verification snapshot fields
- map lookup identifiers and authority registration numbers into canonical `Practitioner.identifier`

### Coverage mapping

Current mapping responsibilities:

- map coverage lookup identifiers into canonical `Coverage.identifier`
- map DHA eligibility payloads into Kenya eligibility snapshot fields
- map eligibility results into `CoverageEligibilityRequest` and `CoverageEligibilityResponse`

### Claim mapping

Current mapping responsibilities:

- map canonical `Claim` graphs into Kenya SHA claim bundles
- map SHA submit responses into Kenya claim submission snapshot fields
- map SHA status responses into Kenya claim-status snapshot fields
- map payer-side status into a local `ClaimResponse`

## What belongs here

As the Kenya pack grows, this folder should contain explicit artifacts for:

- canonical-to-DHA field mappings
- canonical-to-SHA bundle mapping notes
- normalized-response mapping tables
- write-back mapping from remote response fields into resource extensions
- identifier mapping tables for Kenya-specific identifiers

These can be written as Markdown, YAML, or JSON depending on whether they are human-only documentation or meant to be
consumed by tooling later.

## What does not belong here

Do not put these things in this folder:

- UI walkthroughs
- connector transport code
- bot execution logic
- ERPNext or Afiax Billing document mappings
- Afiax Pay financial mappings

Those belong elsewhere. This folder is only for Kenya pack mappings inside the Afiax FHIR boundary.

## How to add a mapping artifact

Use this sequence:

1. identify the canonical input resource or bundle
2. identify the Kenya-specific target payload or normalized output
3. document field-by-field mapping rules
4. document which fields are required, optional, derived, or defaulted
5. link the mapping file from the matching operation README
6. keep the code aligned with the documented mapping

## Recommended first artifacts

The most useful mapping docs to add next are:

- facility registry response to `Organization` mapping
- practitioner registry response to `Practitioner` mapping
- eligibility response to `CoverageEligibilityResponse` mapping
- `Claim` graph to SHA bundle mapping
- SHA status payload to local `ClaimResponse` mapping

## Guardrail

If a mapping changes clinical semantics, it must be reviewed as a country-pack contract change, not treated as a small
UI tweak.
