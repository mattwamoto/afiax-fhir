# Afiax Billing and Revenue Operations

Afiax Billing is the ERPNext-based billing and finance surface inside Afiax Enterprise.

Afiax FHIR still treats billing as part of a broader payer and reimbursement capability set. Coverage, eligibility,
claims, reconciliation, and payment workflows should all map back to the same canonical clinical and operational
record.

## Role in the platform

Revenue cycle workflows should:

- derive from canonical resources such as `Coverage`, `Encounter`, `ChargeItem`, `Claim`, and `ClaimResponse`
- stay auditable from source record to submission outcome
- support both public and private payer models
- localize payer and claims logic through country packs where required
- separate clinical reimbursement state from ERP receivable and ledger workflows

## Afiax Enterprise workflow

The intended workflow is:

1. care is documented in Afiax FHIR
2. payer context, coverage, and billable events are captured in canonical FHIR resources
3. country packs run eligibility checks and national claim submission where required
4. Afiax Billing receives receivable, invoicing, payment, and finance workflows
5. payment and settlement outcomes that matter to care are written back into Afiax FHIR as normalized workflow state

## Core capabilities

- **coverage representation:** maintain payer, beneficiary, member identifier, status, and effective periods
- **eligibility checks:** normalize external payer responses behind internal coverage operations
- **claim generation:** derive claim payloads from canonical clinical and financial state
- **reconciliation:** preserve submission state, acknowledgements, rejections, and correlation IDs
- **tenant controls:** enable different payers, billing rules, and rollout flags per organization and environment

## Afiax Billing boundary

Afiax FHIR and Afiax Billing should not own the same billing state.

Afiax FHIR should own:

- billable clinical events
- payer and coverage context
- country-pack eligibility and claim submission
- claim status that needs to remain part of the care and reimbursement record

Afiax Billing should own:

- invoices and receivables
- payment posting
- debtor balances
- financial reconciliation
- finance reporting

Afiax Billing can also share its ERPNext runtime with adjacent enterprise functions such as pharmacy inventory, CRM,
HR, and training, but those concerns should still stay outside the Afiax FHIR clinical core.

Recommended pattern:

1. derive billable state in Afiax FHIR
2. submit national claims from Afiax FHIR when a country pack requires it
3. send approved or billable outcomes to Afiax Billing through an integration service
4. write payment or settlement outcomes that matter to care back into Afiax FHIR as normalized workflow state

## Country-pack context

The core revenue-cycle model should remain country-neutral. Country packs are responsible for:

- local payer identifiers
- market-specific claim packaging
- authority-specific submission endpoints
- reimbursement status normalization
- regulator or payer compliance notes

Kenya is the first reference pack for this pattern, but payer logic should remain portable to future markets.

## Developer note

In this repo, treat Afiax Billing as an external enterprise system.

- document the contracts here
- keep Afiax FHIR authoritative for clinical and claim state
- keep Afiax Billing implementation code and ERPNext customization outside this Medplum fork

## Related resources

- `Coverage`
- `CoverageEligibilityRequest`
- `CoverageEligibilityResponse`
- `Claim`
- `ClaimResponse`
- `Invoice`
- `PaymentReconciliation`
- `Organization`

## Related docs

- [Billing docs](/docs/billing)
- [Canonical FHIR model](/docs/architecture/canonical-model)
- [Afiax FHIR and Afiax Billing boundary](/docs/architecture/erpnext-boundary)
- [Country packs](/docs/country-packs)
- [Kenya reference pack](/docs/country-packs/kenya)
