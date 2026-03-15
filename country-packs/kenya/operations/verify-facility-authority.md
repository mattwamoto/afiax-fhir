# Verify Facility Authority

Operation: `Organization/$verify-facility-authority`

Purpose:
- verify a facility against the Kenya pack
- keep the operation name country-neutral
- hide AfyaLink-specific details behind the pack implementation

Kenya binding:
- authority: Master Facility List
- identifier category: `facility-authority-id`
- expected identifier value: MFL code

Current implementation:
- reads the canonical `Organization`
- resolves the active project country pack
- reads Kenya DHA environment and credential mode from `Project.setting`
- reads tenant-managed credentials from `Project.secret` when required
- obtains a DHA JWT via `GET /v1/hie-auth?key=...`
- calls `GET /v1/facility-search?facility_code=...`
- returns normalized status, correlation ID, message, and next state
- creates a verification `Task` and an `AuditEvent`

Required project settings:
- `kenyaAfyaLinkEnvironment`
- `kenyaAfyaLinkCredentialMode`

Required tenant-managed secret names:
- `kenyaAfyaLinkConsumerKey`
- `kenyaAfyaLinkUsername`
- `kenyaAfyaLinkPassword`

Response contract:
- normalized status
- correlation ID
- human-readable message
- next state

Notes:
- the DHA endpoint is derived from environment and platform config
- `kenyaAfyaLinkBaseUrl` is only an override path
- tenant UI should not call AfyaLink directly
