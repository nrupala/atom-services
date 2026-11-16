# Agent interoperability design — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are designing how agents interoperate. This atom reads a declared interoperability design manifest — protocol selection per integration, bridge architecture, gateway/remote access, handoff contracts, identity/credentials, versioning/discovery, audit/provenance, and handshake testing/red lines — and returns one deterministic verdict across eight sections: **DESIGN_SOUND**, **DESIGN_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It also reports the computed `protocol_status` and `integration_count`. Same manifest in → same verdict out. It evaluates declared evidence only; it does not connect to any agent or run a handshake.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "agent-interoperability-design"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/agent-interoperability-design`
  — tool name `agent_interoperability_design`; `tools/call` arguments = the
  manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/agent-interoperability-design`
  — body = the manifest object; same `Authorization` header.

## Input

| Field | Read by |
|---|---|
| `design` (string; carried into the verdict output, not itself checked) | — |
| `integrations` (list of objects, see below) | protocol_selection |
| `integrations[].counterparty_type` (string; one of `tools_for_models`, `editor_agent_session`, `agent_to_agent`, `human_or_script` — computed, see below) | protocol_selection |
| `integrations[].protocol` (string; one of `mcp`, `acp_stdio`, `acp_rest`, `a2a`, `rest_cli_web` — computed, see below) | protocol_selection |
| `integrations[].rationale_documented` | protocol_selection |
| `architecture.single_core` | bridge_architecture |
| `architecture.protocol_adapters` | bridge_architecture |
| `architecture.business_logic_per_protocol` (must be `false` to pass — "never implement business logic per protocol") | bridge_architecture |
| `gateway.remote_or_untrusted_agents_present` (gates the five gateway checks below) | gateway_and_remote_access |
| `gateway.single_authenticated_broker` (required when remote/untrusted agents are present; otherwise the check passes as not applicable) | gateway_and_remote_access |
| `gateway.broker_authenticated` (required when remote/untrusted agents are present; otherwise not applicable) | gateway_and_remote_access |
| `gateway.broker_audited` (required when remote/untrusted agents are present; otherwise not applicable) | gateway_and_remote_access |
| `gateway.broker_rate_limited` (required when remote/untrusted agents are present; otherwise not applicable) | gateway_and_remote_access |
| `gateway.direct_doors_to_remote_agents` (must be `false` to pass when remote/untrusted agents are present; otherwise not applicable) | gateway_and_remote_access |
| `handoff.contracts_used_for_non_trivial_coordination` | handoff_contracts |
| `handoff.contract_states_goal` | handoff_contracts |
| `handoff.contract_states_constraints` | handoff_contracts |
| `handoff.contract_states_acceptance_criteria` | handoff_contracts |
| `handoff.contract_states_report_back_location` | handoff_contracts |
| `identity.each_agent_own_credential` | identity_and_credentials |
| `identity.credentials_least_privilege` | identity_and_credentials |
| `identity.credentials_short_lived` | identity_and_credentials |
| `identity.credentials_revocable` | identity_and_credentials |
| `identity.shared_forever_keys_present` (must be `false` to pass — no shared "service-to-service forever" keys) | identity_and_credentials |
| `discovery.capabilities_published` | versioning_and_discovery |
| `discovery.version_published` | versioning_and_discovery |
| `discovery.negotiation_supported` | versioning_and_discovery |
| `discovery.graceful_degradation_declared` | versioning_and_discovery |
| `audit.message_log_kept` | audit_and_provenance |
| `audit.log_records_who_asked` | audit_and_provenance |
| `audit.log_records_what_ran` | audit_and_provenance |
| `audit.log_records_what_changed` | audit_and_provenance |
| `testing.handshake_tests_exist` | handshake_testing_and_red_lines |
| `testing.handshake_tests_pass` | handshake_testing_and_red_lines |
| `testing.handshake_tests_both_directions` | handshake_testing_and_red_lines |
| `testing.handshake_tests_per_protocol` | handshake_testing_and_red_lines |
| `red_lines.unsandboxed_third_party_agents_present` (must be `false` to pass — skill red line) | handshake_testing_and_red_lines |
| `red_lines.secrets_or_private_data_in_messages_by_default` (must be `false` to pass — skill red line) | handshake_testing_and_red_lines |

A field **absent** = evidence missing (counts toward
INSUFFICIENT_EVIDENCE). A field present but false/invalid = a check
fails (counts toward the not-sound verdict).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/agent-interoperability-design`:

```json
{
  "design": "Standard A2A bridge",
  "integrations": [
    {
      "counterparty_type": "agent_to_agent",
      "protocol": "acp_rest",
      "rationale_documented": true
    }
  ],
  "architecture": {
    "single_core": true,
    "protocol_adapters": true,
    "business_logic_per_protocol": false
  },
  "gateway": {
    "remote_or_untrusted_agents_present": false
  },
  "handoff": {
    "contracts_used_for_non_trivial_coordination": true,
    "contract_states_goal": true,
    "contract_states_constraints": true,
    "contract_states_acceptance_criteria": true,
    "contract_states_report_back_location": true
  },
  "identity": {
    "each_agent_own_credential": true,
    "credentials_least_privilege": true,
    "credentials_short_lived": true,
    "credentials_revocable": true,
    "shared_forever_keys_present": false
  },
  "discovery": {
    "capabilities_published": true,
    "version_published": true,
    "negotiation_supported": true,
    "graceful_degradation_declared": true
  },
  "audit": {
    "message_log_kept": true,
    "log_records_who_asked": true,
    "log_records_what_ran": true,
    "log_records_what_changed": true
  },
  "testing": {
    "handshake_tests_exist": true,
    "handshake_tests_pass": true,
    "handshake_tests_both_directions": true,
    "handshake_tests_per_protocol": true
  },
  "red_lines": {
    "unsandboxed_third_party_agents_present": false,
    "secrets_or_private_data_in_messages_by_default": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all checks
and a text stamp of the verdict):

```json
{
  "service": "agent-interoperability-design",
  "atom_version": "0.1.0",
  "design": "Standard A2A bridge",
  "verdict": "DESIGN_SOUND",
  "sections": {
    "protocol_selection": "pass",
    "bridge_architecture": "pass",
    "gateway_and_remote_access": "pass",
    "handoff_contracts": "pass",
    "identity_and_credentials": "pass",
    "versioning_and_discovery": "pass",
    "audit_and_provenance": "pass",
    "handshake_testing_and_red_lines": "pass"
  },
  "protocol_status": "sound_on_declared_evidence",
  "integration_count": 1,
  "summary": "36 pass, 0 fail, 0 missing of 36 checks across eight sections."
}
```

## Verdicts

- **DESIGN_SOUND** — all 36 checks pass.
- **DESIGN_NOT_SOUND** — at least one check fails; the failing sections name the breached discipline.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
