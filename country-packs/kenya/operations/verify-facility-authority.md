# Verify Facility Authority

Generic operation: `Organization/$verify-facility-authority`

Kenya binding:
- authority: Master Facility List
- identifier category: `facility-authority-id`
- expected canonical identifier binding: MFL code

Current Medplum behavior:
- reads the canonical `Organization`
- resolves the active project country pack
- reads Kenya DHA environment and credential mode from `Project.setting`
- reads tenant-managed credentials from `Project.secret` when required
- obtains a DHA JWT via `GET /v1/hie-auth?key=...`
- calls `GET /v1/facility-search?facility_code=...`
- returns normalized status, correlation ID, message, and next state
- creates a verification `Task` and an `AuditEvent`

Expected project settings:
- `kenyaAfyaLinkEnvironment`
- `kenyaAfyaLinkCredentialMode`

Expected tenant-managed project secret names:
- `kenyaAfyaLinkConsumerKey`
- `kenyaAfyaLinkUsername`
- `kenyaAfyaLinkPassword`

The DHA endpoint is derived from the selected environment and platform configuration. `kenyaAfyaLinkBaseUrl` remains
available only as an advanced override path.
