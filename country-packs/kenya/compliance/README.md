# Compliance

This directory is for Kenya-specific operational and audit implementation notes.

The current Kenya pack already creates a meaningful amount of workflow evidence in product code. What is still missing
is the operator-facing runbook layer that explains how engineers and support staff should review, debug, and reconcile
that evidence in production. This README explains what already exists, what evidence each workflow creates, and what
still needs to be documented before Kenya production hardening is complete.

## What belongs in this folder

Keep this directory operational and implementation-focused.

Put these kinds of documents here:

- Kenya production readiness checklists
- DHA and SHA credential rotation procedures
- outage and degraded-mode runbooks
- operator review steps for failed Kenya workflows
- callback verification and replay procedures
- Kenya-specific audit evidence expectations
- reconciliation runbooks for claim submission and settlement follow-up

Do not put these things here:

- generic legal policy text
- generic security marketing copy
- non-Kenya architecture prose
- UI tutorials that belong in the product docs

## Evidence already written by the product

The current Kenya implementation already persists structured evidence for each workflow. That means the compliance
story in this repo starts with what the product writes now, not with a future document set.

### Facility verification

Evidence currently created:

- Kenya facility registry snapshot on `Organization.extension`
- Kenya facility verification snapshot on `Organization.extension`
- `Task`
- `AuditEvent`

Primary operator review surface:

- `Organization` page

### Practitioner verification

Evidence currently created:

- Kenya practitioner registry snapshot on `Practitioner.extension`
- Kenya practitioner verification snapshot on `Practitioner.extension`
- `Task`
- `AuditEvent`

Primary operator review surface:

- `Practitioner` page

### Coverage eligibility

Evidence currently created:

- Kenya eligibility snapshot on `Coverage.extension`
- `CoverageEligibilityRequest`
- `CoverageEligibilityResponse`
- `Task`
- `AuditEvent`

Primary operator review surface:

- `Coverage` page

### Claim submission

Evidence currently created:

- Kenya claim submission snapshot on `Claim.extension`
- prepared SHA bundle preview
- `Task`
- `AuditEvent`

Primary operator review surface:

- `Claim` page

### Claim status refresh

Evidence currently created:

- Kenya claim status snapshot on `Claim.extension`
- local `ClaimResponse`
- `Task`
- `AuditEvent`
- optional workflow-bot status metadata

Primary operator review surface:

- `Claim` page

## Current compliance model

The Kenya pack currently relies on a layered evidence model:

1. resource snapshot
2. workflow task
3. audit record
4. raw remote payload shown in the UI

That order matters. Engineers should start with the resource snapshot because it represents the normalized product
state. Only then should they drop into the raw DHA or SHA payload to understand transport or mapping problems.

## Recommended investigation order

When a Kenya workflow needs operator review, use this order:

1. confirm the project is on the Kenya pack
2. inspect the Kenya snapshot on the resource
3. inspect the linked `Task`
4. inspect the `AuditEvent`
5. inspect the raw remote payload surfaced in the UI
6. inspect connector normalization logic only after the upstream payload is confirmed

This is the expected review flow for facility, practitioner, eligibility, submit, and claim-status problems.

## Workflow evidence matrix

### Facility verification

Use this when a facility lookup or verification fails:

1. open the `Organization`
2. inspect the Kenya facility code / MFL code
3. inspect the Kenya registry snapshot
4. inspect the Kenya verification snapshot
5. inspect the verification `Task`
6. inspect the `AuditEvent`
7. inspect the raw DHA response shown by the UI

### Practitioner verification

Use this when practitioner authority verification fails:

1. open the `Practitioner`
2. inspect the saved Kenya identifier
3. inspect the Kenya registry snapshot
4. inspect the Kenya verification snapshot
5. inspect the verification `Task`
6. inspect the `AuditEvent`
7. inspect the raw DHA response shown by the UI

### Coverage eligibility

Use this when eligibility appears inconsistent:

1. open the `Coverage`
2. inspect the saved lookup identifier
3. inspect the Kenya eligibility snapshot
4. inspect the `CoverageEligibilityRequest`
5. inspect the `CoverageEligibilityResponse`
6. inspect the `Task`
7. inspect the `AuditEvent`
8. inspect the raw DHA response shown by the UI

### Claim submission and claim status

Use this when a Kenya claim fails or stalls:

1. open the `Claim`
2. inspect the Kenya submit and status snapshots
3. inspect the prepared bundle and raw SHA response
4. inspect the submit `Task`
5. inspect the status-refresh `Task`
6. inspect the submit and refresh `AuditEvent`
7. inspect the local `ClaimResponse`
8. inspect the workflow-bot status if enterprise handoff was expected

## Release and hardening expectations

Before treating the Kenya pack as production-ready, this folder should contain at least:

- DHA outage runbook
- SHA outage runbook
- credential rotation runbook
- callback verification procedure
- replay procedure for failed claim follow-up
- Kenya claim reconciliation runbook
- production cutover checklist

Without those runbooks, the product may still function, but the operational compliance story is incomplete.

## Engineering guardrails

Keep these rules in mind when adding Kenya workflows:

- every regulated workflow must leave behind reviewable evidence
- evidence should be tied together by correlation id wherever possible
- raw remote payload alone is not enough; normalized product state must also be persisted
- compliance notes should describe how to operate the workflow, not how to market it
