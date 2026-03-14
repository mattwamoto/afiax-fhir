# Revenue Cycle and Payer Operations

Afiax treats billing as part of a broader payer and reimbursement capability set. Coverage, eligibility, claims,
reconciliation, and payment workflows should all map back to the same canonical clinical and operational record.

## Role in the platform

Revenue cycle workflows should:

- derive from canonical resources such as `Coverage`, `Encounter`, `ChargeItem`, `Claim`, and `ClaimResponse`
- stay auditable from source record to submission outcome
- support both public and private payer models
- localize payer and claims logic through country packs where required

## Core capabilities

- **coverage representation:** maintain payer, beneficiary, member identifier, status, and effective periods
- **eligibility checks:** normalize external payer responses behind internal coverage operations
- **claim generation:** derive claim payloads from canonical clinical and financial state
- **reconciliation:** preserve submission state, acknowledgements, rejections, and correlation IDs
- **tenant controls:** enable different payers, billing rules, and rollout flags per organization and environment

## Country-pack context

The core revenue-cycle model should remain country-neutral. Country packs are responsible for:

- local payer identifiers
- market-specific claim packaging
- authority-specific submission endpoints
- reimbursement status normalization
- regulator or payer compliance notes

Kenya is the first reference pack for this pattern, but payer logic should remain portable to future markets.

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
- [Country packs](/docs/country-packs)
- [Kenya reference pack](/docs/country-packs/kenya)
