# Kenya Country Pack

This directory is the repo-level implementation surface for the Kenya country pack.

Use it for two things:

1. understand what Kenya-specific behavior exists in this fork today
2. add Kenya logic without leaking DHA, SHA, or AfyaLink assumptions into core Medplum behavior

This pack is the first real reference implementation of the Afiax country-pack model. It is not a generic architecture
folder. It is the Kenya boundary.

## What belongs here

Kenya-specific concerns that belong in this pack:

- DHA HIE authentication assumptions
- AfyaLink facility lookup and facility verification
- AfyaLink practitioner lookup and practitioner verification
- DHA eligibility lookup inputs and response mapping
- SHA claim bundle preparation
- SHA claim submission and status refresh
- Kenya-specific workflow bot handoff after submit or status refresh
- Kenya fixtures, mappings, and compliance notes

What does **not** belong here:

- generic FHIR modeling rules that apply to all countries
- ERPNext or Afiax Billing implementation code
- Afiax Pay implementation code
- non-Kenya pack settings
- direct browser-side integration logic

## Current implementation status

Implemented in this repo now:

- project-level `countryPack=kenya`
- Kenya setup wizard in `/admin/country-pack`
- tenant-managed Kenya HIE credentials in `/admin/secrets`
- Afiax-managed Kenya HIE credentials in `/admin/super`
- tenant-managed Kenya SHA credentials in `/admin/secrets`
- Afiax-managed Kenya SHA credentials in `/admin/super`
- `Organization` Kenya facility code capture, DHA lookup, and audited verification
- `Practitioner` Kenya identity capture, DHA lookup, and audited verification
- `Coverage` Kenya eligibility lookup and eligibility evidence persistence
- `Claim` Kenya SHA bundle preparation and submit
- `Claim` Kenya SHA status refresh and local `ClaimResponse` upsert
- optional post-submit Kenya workflow bot
- optional post-status-refresh Kenya workflow bot

Not implemented yet:

- DHA callback ingestion for asynchronous SHA updates
- Kenya claim queue views
- Kenya reconciliation dashboards
- Kenya production runbooks and cutover automation
- Kenya client-registry workflow
- Kenya SHR publishing

## Directory layout

```text
country-packs/kenya/
  README.md
  bots/
  codesystems/
  compliance/
  connectors/
  fixtures/
  mappings/
  operations/
  profiles/
  valuesets/
```

Current practical use of these folders:

- `operations/`: developer-facing notes for generic operations implemented by the Kenya pack
- `fixtures/`: request and response samples used when shaping or testing Kenya integrations
- `bots/`: Kenya-specific orchestration notes and future bot-specific assets
- `connectors/`: reserved for Kenya connector documentation and artifacts
- `compliance/`: reserved for regulator-specific operational notes

## Runtime entry points

Kenya behavior is reached through generic Medplum operations and resource panels, not through Kenya-only routes in the
main app.

Current generic operations with Kenya handlers:

- `Organization/$verify-facility-authority`
- `Practitioner/$verify-practitioner-authority`
- `Coverage/$check-coverage`
- `Claim/$submit-national-claim`
- `Claim/$check-national-claim-status`

Current admin routes that support the Kenya UX:

- `POST /admin/projects/:projectId/kenya/afyalink/test`
- `POST /admin/projects/:projectId/kenya/afyalink/facility-lookup`
- `POST /admin/projects/:projectId/kenya/afyalink/practitioner-lookup`

These routes exist to support onboarding and resource-level Kenya UI. They are not the canonical clinical workflow
surface. The canonical clinical workflow surface remains the FHIR operations above.

## Kenya setup sequence

### 1. Activate the pack

Set the project to Kenya from project creation or from `/admin/settings`.

Required non-secret settings:

```text
countryPack=kenya
kenyaHieEnvironment=uat|production
kenyaHieCredentialMode=tenant-managed|afiax-managed
kenyaShaClaimsEnvironment=uat|production
kenyaShaClaimsCredentialMode=tenant-managed|afiax-managed
kenyaHieAgentId=<agent-id>              # optional until client-registry work starts
kenyaClaimSubmitWorkflowBotId=Bot/<id>  # optional
kenyaClaimStatusWorkflowBotId=Bot/<id>  # optional
```

### 2. Configure credentials

For tenant-managed mode, use `/admin/secrets`.

Kenya HIE secrets:

```text
kenyaAfyaLinkConsumerKey
kenyaAfyaLinkUsername
kenyaAfyaLinkPassword
```

Kenya SHA secrets:

```text
kenyaShaClaimsAccessKey
kenyaShaClaimsSecretKey
kenyaShaClaimsCallbackUrl
```

For Afiax-managed mode, use `/admin/super`. The same names are stored in `Project.systemSecret`.

### 3. Verify connectivity

Use the HIE `Test Connection` action first. Do this before attempting facility, practitioner, or eligibility
workflows.

### 4. Create the first Kenya facility

Use `/admin/country-pack`:

1. enter the primary Kenya facility code / MFL code
2. run DHA lookup
3. inspect the raw response if lookup fails
4. create a new `Organization` or apply the registry result to an existing one

This is the preferred onboarding path for the first Kenya facility because it hides the underlying identifier model
from normal users while still persisting the correct canonical `Organization.identifier` values.

## Resource-level workflow sequence

### Facility

Page: `/Organization/{id}`

Minimum user path:

1. enter `Kenya Facility Code / MFL Code`
2. click `Save MFL Code`
3. click `Lookup Facility`
4. review the registry-derived values on the resource
5. click `Verify Facility`

What the system persists:

- Kenya facility authority identifier on `Organization.identifier`
- Kenya facility registry snapshot on `Organization.extension`
- Kenya facility verification snapshot on `Organization.extension`
- verification `Task`
- verification `AuditEvent`

### Practitioner

Page: `/Practitioner/{id}`

Minimum user path:

1. choose Kenya identification type
2. enter the identification number
3. save the lookup identity
4. run DHA practitioner lookup
5. click `Verify Practitioner`

What the system persists:

- Kenya practitioner lookup identifier on `Practitioner.identifier`
- Kenya authority registration number on `Practitioner.identifier`
- Kenya practitioner registry snapshot on `Practitioner.extension`
- Kenya practitioner verification snapshot on `Practitioner.extension`
- verification `Task`
- verification `AuditEvent`

### Coverage

Page: `/Coverage/{id}`

Minimum user path:

1. choose the eligibility lookup identifier type
2. enter the identifier number
3. save the identifier
4. run `Check Coverage`

What the system persists:

- Kenya eligibility lookup identifier on `Coverage.identifier`
- eligibility snapshot on `Coverage.extension`
- `CoverageEligibilityRequest`
- `CoverageEligibilityResponse`
- `Task`
- `AuditEvent`

### Claim

Page: `/Claim/{id}`

Minimum user path:

1. prepare a valid `Claim` graph with linked `Patient`, `Coverage`, `Organization`, and `Practitioner`
2. click `Submit Kenya SHA Claim`
3. if credentials are present, observe live SHA submit metadata
4. click `Check Kenya SHA Claim Status`
5. inspect the updated payer state and local `ClaimResponse`

What the system persists:

- Kenya claim submission snapshot on `Claim.extension`
- Kenya claim status snapshot on `Claim.extension`
- submit `Task`
- status-refresh `Task`
- submit `AuditEvent`
- status-refresh `AuditEvent`
- local `ClaimResponse` representing the latest payer-side state

## Files engineers should read first

If you are extending the Kenya pack, start here:

- `packages/server/src/country-pack/kenya/index.ts`
- `packages/server/src/country-pack/kenya/afyalink.ts`
- `packages/server/src/country-pack/kenya/sha.ts`
- `packages/server/src/country-pack/kenya/verify-facility-authority.ts`
- `packages/server/src/country-pack/kenya/verify-practitioner-authority.ts`
- `packages/server/src/country-pack/kenya/check-coverage.ts`
- `packages/server/src/country-pack/kenya/submit-national-claim.ts`
- `packages/server/src/country-pack/kenya/check-national-claim-status.ts`
- `packages/server/src/country-pack/kenya/workflow-bot.ts`
- `packages/core/src/kenya.ts`

If you are extending the Kenya UI, start here:

- `packages/app/src/admin/CountryPackPage.tsx`
- `packages/app/src/admin/SettingsPage.tsx`
- `packages/app/src/admin/SecretsPage.tsx`
- `packages/app/src/admin/SuperAdminKenyaCredentialsForm.tsx`
- `packages/app/src/resource/OrganizationFacilityVerificationPanel.tsx`
- `packages/app/src/resource/PractitionerAuthorityVerificationPanel.tsx`
- `packages/app/src/resource/CoverageEligibilityPanel.tsx`
- `packages/app/src/resource/ClaimNationalSubmissionPanel.tsx`

## Operation notes in this folder

Use these repo-level documents when you need the Kenya implementation contract for one workflow:

- `operations/verify-facility-authority.md`
- `operations/verify-practitioner-authority.md`
- `operations/check-coverage.md`
- `operations/submit-national-claim.md`
- `operations/check-national-claim-status.md`

## Test commands

Target the smallest package-level tests instead of broad repo runs:

```bash
cd packages/core && npx jest src/kenya.test.ts --runInBand
cd packages/server && npx jest src/country-pack/kenya/submit-national-claim.test.ts src/country-pack/kenya/check-national-claim-status.test.ts --runInBand
cd packages/app && npx jest src/resource/ResourcePage.test.tsx src/admin/CountryPackPage.test.tsx --runInBand
```

Typecheck the touched packages:

```bash
cd packages/core && npx tsc --noEmit
cd packages/server && npx tsc --noEmit
cd packages/app && npx tsc --noEmit
```

## Debugging guidance

When a Kenya flow fails, check these in order:

1. `Project.setting.countryPack` is actually `kenya`
2. HIE and SHA environments are correct for the workflow you are testing
3. credential mode matches where secrets were stored
4. the expected resource identifier is present on the resource
5. the raw DHA or SHA payload shown in the UI matches what the handler expected
6. the created `Task` and `AuditEvent` show the expected correlation ID and message

If the raw Kenya HIE or SHA response says the record is missing, treat that as an external dataset issue first, not
as a UI issue.

## Related docs

- `packages/docs/docs/country-packs/kenya.md`
- `country-packs/kenya/operations/README.md`
- `country-packs/kenya/operations/verify-facility-authority.md`
