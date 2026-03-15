# Afiax Billing and Revenue Operations

Afiax Billing is the ERPNext-based billing and finance surface inside Afiax Enterprise.

Afiax FHIR provides the canonical payer, claim, and reimbursement state that powers this workflow. Afiax Billing
operates the enterprise finance, collection, and reconciliation side of the same flow.

Afiax Enterprise also uses Afiax Pay as the country-neutral payments layer for co-pay, wallet, subsidy, and embedded
insurance payment flows.

## Role in the platform

Revenue cycle in Afiax Enterprise offers:

- canonical payer and claim state in Afiax FHIR
- country-pack eligibility and reimbursement workflows
- co-pay and patient payment enablement through Afiax Pay
- enterprise invoice and receivable management in Afiax Billing
- payment posting and finance reconciliation in Afiax Billing
- synchronized reimbursement outcomes back into Afiax FHIR

## Afiax Enterprise workflow

The workflow follows this path:

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

Afiax FHIR owns:

- billable clinical events
- payer and coverage context
- country-pack eligibility and claim submission
- claim status that needs to remain part of the care and reimbursement record

Afiax Billing owns:

- invoices and receivables
- payment posting
- debtor balances
- financial reconciliation
- finance reporting

Afiax Pay owns:

- patient wallet and co-pay flows
- premium contribution and refund flows
- embedded insurance payment orchestration
- regulated payment transaction handling

Afiax Billing can also share its ERPNext runtime with adjacent enterprise functions such as pharmacy inventory, CRM,
HR, and training. Those concerns remain outside the Afiax FHIR clinical core.

The integration pattern is:

1. derive billable state in Afiax FHIR
2. submit national claims from Afiax FHIR when a country pack requires it
3. send approved or billable outcomes to Afiax Billing through an integration service
4. write payment or settlement outcomes that matter to care back into Afiax FHIR as normalized workflow state

## Country-pack context

The core revenue-cycle model remains country-neutral. Country packs provide:

- local payer identifiers
- market-specific claim packaging
- authority-specific submission endpoints
- reimbursement status normalization
- regulator or payer compliance notes

Kenya is the first reference pack for this pattern, and payer logic remains portable to future markets.

## Capability boundary

In this repo, Afiax Billing appears as an external enterprise system. The repo documents the contracts and integration
surfaces while Afiax Billing implementation code and ERPNext customization remain outside this Medplum fork.

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
- [Afiax financial architecture](/docs/architecture/financial-architecture)
- [Afiax FHIR and Afiax Pay boundary](/docs/architecture/afiax-pay-boundary)
- [Lami embedded insurance boundary](/docs/architecture/lami-embedded-insurance-boundary)
- [Canonical FHIR model](/docs/architecture/canonical-model)
- [Afiax FHIR and Afiax Billing boundary](/docs/architecture/afiax-billing-boundary)
- [Afiax FHIR and Afiax Billing contract](/docs/architecture/afiax-billing-contract)
- [Afiax FHIR and Afiax Billing object mapping](/docs/architecture/afiax-billing-object-mapping)
- [Afiax FHIR and Afiax Billing status model](/docs/architecture/afiax-billing-status-model)
- [Afiax FHIR and Afiax Billing payload spec](/docs/architecture/afiax-billing-payload-spec)
- [Country packs](/docs/country-packs)
- [Kenya reference pack](/docs/country-packs/kenya)
