# Life Sciences and Research Operations

Afiax can support research and life-sciences workflows where structured data capture, participant engagement,
protocol execution, and interoperable exports are important. In this pattern, Medplum remains the clinical and
research-record core while surrounding systems handle specialized operational or commercial concerns.

## Common use cases

- participant onboarding and consent
- protocol and schedule-of-assessments management
- clinical and operational data capture
- diagnostics, specimen, and device-linked workflows
- participant-facing portals and remote assessments
- export into reporting, analysis, or study-delivery systems

## Why this fits the Afiax architecture

Research workflows benefit from the same properties that Afiax needs elsewhere:

- reusable canonical data structures
- strong audit and provenance
- structured questionnaires and assessments
- Bot-driven workflow orchestration
- integration with external EHRs, labs, devices, and reporting systems

## Core modeling patterns

The most common building blocks are:

- `ResearchStudy`
- `Questionnaire` and `QuestionnaireResponse`
- `Consent`
- `PlanDefinition`
- `ActivityDefinition`
- `ObservationDefinition`
- `Observation`
- `DiagnosticReport`
- `RequestGroup`

These resources allow Afiax to represent protocol logic, collected data, participant workflow, and downstream export
without abandoning the Medplum-centered source-of-truth model.

## Integration model

Life-sciences workflows often still need other systems. Typical external integrations include:

- EHR and LIS history import
- ePRO or digital-assessment tools
- diagnostics and specimen systems
- analytics and reporting platforms
- document signing and operational systems

Those systems should integrate with Medplum through the interoperability layer and Bots rather than replacing the
normalized record in Medplum.

## Related docs

- [Questionnaires and structured data capture](/products/questionnaires)
- [Care plans and program workflows](/products/careplans)
- [Interoperability engine](/products/integration)
- [Bots](/products/bots)
- [Canonical FHIR model](/docs/architecture/canonical-model)
