# Fixtures

This directory holds Kenya pack fixture material used to shape workflows, validate normalization behavior, and give
engineers a stable reference when adding or changing pack logic.

Fixtures in this pack are not meant to replace automated tests. They are the human-readable payload and resource
examples that explain what a workflow expects and what a normalized result should look like.

## Current contents

Today this directory contains the first facility-verification fixtures:

- `verify-facility-authority.request.json`
- `verify-facility-authority.response.json`

These files document the early Kenya facility verification contract:

- the request fixture shows the minimal operation input shape
- the response fixture shows the normalized result shape returned by the Kenya handler

## How fixtures are used in this repo

Use fixtures in this pack for:

- documenting the expected operation input
- documenting the normalized operation result
- comparing UI behavior against a stable expected payload
- reviewing mapping changes before they become code
- creating realistic test resources or integration notes

Do not use fixtures in place of:

- package-level unit tests
- end-to-end assertions
- runtime secrets
- generated production payload archives

## Fixture naming rules

Use this naming pattern:

```text
<workflow-name>.<kind>.json
```

Current examples:

```text
verify-facility-authority.request.json
verify-facility-authority.response.json
```

Recommended future examples:

```text
verify-practitioner-authority.request.json
verify-practitioner-authority.response.json
check-coverage.request.json
check-coverage.response.json
submit-national-claim.bundle.json
check-national-claim-status.response.json
```

## What a good Kenya fixture should show

A fixture in this directory should show one of these clearly:

- the minimal canonical FHIR input required by the workflow
- the remote Kenya payload after normalization
- the final Kenya operation result returned to the caller

Keep it focused. One fixture should explain one stage of one workflow.

## Relationship to code

The current Kenya fixtures correspond to behavior implemented in:

- `packages/server/src/country-pack/kenya/verify-facility-authority.ts`
- `packages/server/src/fhir/operations/verify-facility-authority.ts`
- `packages/core/src/kenya.ts`

As more Kenya workflows mature, add matching fixture files for:

- practitioner verification
- coverage eligibility
- claim bundle preparation
- claim-status normalization

## Adding a new fixture

Use this sequence:

1. identify which workflow stage needs a stable example
2. base the fixture on the canonical resource or normalized result actually used by code
3. remove secrets and environment-specific values
4. use realistic identifiers, correlation ids, and references
5. update the matching operation README so engineers know the fixture exists

## Guardrails

Do not put these in fixtures:

- real tenant credentials
- real personal data
- raw production payload dumps with sensitive content
- UI-only state

Keep fixtures implementation-focused and safe to commit.
