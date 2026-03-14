# Multi-Tenancy and Access Controls

Afiax uses multi-tenant architecture to support multiple organizations, programs, and country-localized workflows on
the same platform foundation while keeping data access governed and auditable.

## How tenancy works

Afiax separates concerns across several boundaries:

- **platform core:** shared software capabilities and canonical data semantics
- **project or tenant boundary:** organization or environment isolation
- **intra-tenant access policy:** fine-grained segmentation by facility, geography, program, team, or patient context
- **country-pack boundary:** national workflows and identifiers that should not leak into other markets

## Why this matters

This architecture allows Afiax to support:

- shared SaaS delivery with strong logical isolation
- dedicated runtime or sovereign deployment patterns
- multiple organizations on one platform foundation
- controlled partner and referral access
- customer-specific workflow overlays without changing the core

## Common segmentation patterns

- by facility or hospital
- by county or region
- by service line or program
- by payer or partner network
- by patient compartment and care-team rules

## Governance principles

- least-privilege access by default
- explicit boundaries between country, tenant, and user responsibilities
- audit and provenance for high-value actions
- traceable automation through Bots and internal operations

## Related docs

- [Projects](/docs/access/projects)
- [Multi-tenant access policy](/docs/access/multi-tenant-access-policy)
- [Country packs](/docs/country-packs)
- [Self hosting](/docs/self-hosting)
