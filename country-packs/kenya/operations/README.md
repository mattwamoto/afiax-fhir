# Operations

This directory documents Kenya implementations of generic Afiax platform operations.

Use these notes as engineering guides, not marketing summaries.

For each operation, document:

- the generic operation name
- the Kenya-specific identifier binding
- project settings and secret prerequisites
- exact resource prerequisites
- what the handler updates on the resource
- which workflow evidence resources are created
- how to debug failures

Current implemented Kenya operations in code:

- `Organization/$verify-facility-authority`
- `Practitioner/$verify-practitioner-authority`
- `Coverage/$check-coverage`
- `Claim/$submit-national-claim`
- `Claim/$check-national-claim-status`

If a new Kenya operation is added in code, add its implementation note here in the same cycle.
