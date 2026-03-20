# ValueSets

This directory is for Kenya-specific FHIR `ValueSet` artifacts used by the Kenya pack.

The current Kenya implementation already uses a small number of controlled choices in code and UI, but those choices
have not yet been formalized as standalone `ValueSet` resources in this folder.

## Current status

There are no Kenya `ValueSet` artifacts in this directory yet.

The current controlled-choice behavior is implemented in code:

- practitioner identification type choices
- coverage eligibility identification type choices
- Kenya HIE and SHA environment choices
- Kenya credential mode choices
- normalized workflow state families returned by Kenya handlers

These are real constraints, but they are not all FHIR value sets. Some are operational settings, while others are
resource-level code choices that may later deserve formal terminology artifacts.

## Current candidate value-set surfaces

The most obvious Kenya value-set candidates in the current pack are:

- practitioner identification type:
  - `ID`
  - `PASSPORT`
- coverage eligibility identification type:
  - `National ID`
  - `Alien ID`
  - `Mandate Number`
  - `Temporary ID`
  - `SHA Number`
  - `Refugee ID`

These are currently expressed through helpers and UI controls rather than through standalone FHIR terminology files.

## What belongs here

Use this folder for:

- formal `ValueSet` resources referenced by Kenya profiles
- Kenya-specific expansions used to constrain identifiers or coded workflow fields
- documentation of which profile elements bind to which Kenya terminology sets

## What does not belong here

Do not put these things in this folder:

- identifier system URIs
- extension definitions
- free-text runbooks
- ERPNext or billing status taxonomies unless they are explicitly turned into FHIR terminology assets

## Recommended first value sets

When this folder begins to fill out, the most useful first artifacts are:

1. Kenya practitioner identification type value set
2. Kenya coverage eligibility identification type value set
3. Kenya normalized claim-state value set if the claim workflow codes stabilize enough to formalize

## Relationship to other folders

Use this folder together with:

- `codesystems/` for the underlying Kenya code systems
- `profiles/` for the profile bindings that consume the value sets

Do not create a `ValueSet` here without deciding which code system it draws from and where that value set is actually
used.
