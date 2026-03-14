# Afiax Agent

The Afiax Agent is the secure bridge between local healthcare networks and the broader Afiax platform. It is useful
when diagnostics devices, legacy systems, or closed facility networks need to participate in interoperable workflows
without exposing those environments directly to the internet.

## What it does

The Agent runs inside a local network and helps connect local protocols to cloud-hosted workflow logic and FHIR-native
services.

**Supported protocols**

- HL7v2
- DICOM
- ASTM support roadmap

## Why it matters

The Agent helps Afiax support:

- diagnostics and imaging integrations
- facility systems that only expose local-network interfaces
- secure message and file movement from regulated environments
- hybrid and sovereign deployment models where some workloads remain on local infrastructure

## Operational model

- local protocol handling happens close to the source system
- workflow logic and normalization can run through Afiax Bots and platform services
- audit and monitoring stay aligned with the rest of the Afiax platform
- customer IT and security teams retain control over local installation and approval workflows

## Security posture

The Agent is designed for regulated healthcare environments:

- encrypted transport
- controlled remote operations
- compatibility with audit and monitoring workflows
- support for hybrid and sovereign deployment patterns

## Related docs

- [Agent technical docs](/docs/agent)
- [Interoperability and country exchange](/solutions/interoperability)
- [Bots](/products/bots)
