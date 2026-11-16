# ACP protocol integration review — user guide

## What it does

You are integrating an agent protocol. This atom reads a declared ACP integration manifest — which ACP flavour, adapter architecture, protocol surface, lifecycle, streaming, security, honesty/tests and upgrade path — and returns one deterministic verdict across seven sections (disambiguation_and_scope, adapter_architecture, protocol_surface, lifecycle_correctness, streaming_discipline, security, honesty_tests_and_upgrade_path): **INTEGRATION_SOUND**, **INTEGRATION_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It also reports the computed `flavor_status` (`acp_client` / `acp_comm` / `unrecognized` / null). Same manifest in → same verdict out. It reviews declared evidence only; it does not connect to or run the integration.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "acp-protocol-integration-review"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/acp-protocol-integration-review`
  — tool name `acp_protocol_integration_review`; `tools/call` arguments = the
  manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/acp-protocol-integration-review`
  — body = the manifest object; same `Authorization` header.

## Input

| Field | Read by |
|---|---|
| `implementation` (string; carried into the verdict output, not itself checked) | — |
| `protocol.flavor` (string; must be `"ACP-client"` or `"ACP-comm"` to pass — computed, see below) | disambiguation_and_scope |
| `protocol.disambiguated_naming` | disambiguation_and_scope |
| `protocol.spec_version_documented` | disambiguation_and_scope |
| `protocol.supported_subset_documented` | disambiguation_and_scope |
| `adapter.thin` | adapter_architecture |
| `adapter.single_core_protocol_at_edge` | adapter_architecture |
| `adapter.business_logic_in_wire_layer` (must be `false` to pass) | adapter_architecture |
| `surface.client_flow_complete` (required only when the flavour is `ACP-client`; otherwise the check passes as not applicable) | protocol_surface |
| `surface.client_permissions_handled` (required only when the flavour is `ACP-client`; otherwise not applicable) | protocol_surface |
| `surface.comm_endpoints_complete` (required only when the flavour is `ACP-comm`; otherwise not applicable) | protocol_surface |
| `surface.comm_message_parts_typed` (required only when the flavour is `ACP-comm`; otherwise not applicable) | protocol_surface |
| `lifecycle.unknown_sessions_or_runs_handled` | lifecycle_correctness |
| `lifecycle.cancels_handled` | lifecycle_correctness |
| `lifecycle.errors_handled` | lifecycle_correctness |
| `lifecycle.reconnects_handled` | lifecycle_correctness |
| `lifecycle.state_leaks_across_sessions` (must be `false` to pass) | lifecycle_correctness |
| `streaming.updates_ordered` | streaming_discipline |
| `streaming.chunk_sizes_bounded` | streaming_discipline |
| `streaming.backpressure_addressed` | streaming_discipline |
| `streaming.terminal_states_clear` | streaming_discipline |
| `security.remote_endpoints_present` (gates the authentication check below) | security |
| `security.remote_endpoints_authenticated` (required when remote endpoints are present — skill red line; otherwise the check passes as not applicable) | security |
| `security.inputs_validated` | security |
| `security.output_sizes_capped` | security |
| `security.tool_execution_sandboxed` | security |
| `honesty.unimplemented_modes_noted` | honesty_tests_and_upgrade_path |
| `honesty.unsupported_features_faked` (must be `false` to pass — skill red line) | honesty_tests_and_upgrade_path |
| `tests.scripted_client_handshake_covered` | honesty_tests_and_upgrade_path |
| `tests.lifecycle_happy_error_cancel_covered` | honesty_tests_and_upgrade_path |
| `tests.contract_tests_in_ci_per_protocol` | honesty_tests_and_upgrade_path |
| `upgrade.sdk_upgrade_path_documented` | honesty_tests_and_upgrade_path |
| `upgrade.adapter_tests_kept_for_sdk_swap` | honesty_tests_and_upgrade_path |

A field **absent** = evidence missing (counts toward
INSUFFICIENT_EVIDENCE). A field present but false/invalid = a check
fails (counts toward the not-sound verdict).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/acp-protocol-integration-review`:

```json
{
  "implementation": "v1.0.0-stable",
  "protocol": {
    "flavor": "ACP-client",
    "disambiguated_naming": true,
    "spec_version_documented": true,
    "supported_subset_documented": true
  },
  "adapter": {
    "thin": true,
    "single_core_protocol_at_edge": true,
    "business_logic_in_wire_layer": false
  },
  "surface": {
    "client_flow_complete": true,
    "client_permissions_handled": true
  },
  "lifecycle": {
    "unknown_sessions_or_runs_handled": true,
    "cancels_handled": true,
    "errors_handled": true,
    "reconnects_handled": true,
    "state_leaks_across_sessions": false
  },
  "streaming": {
    "updates_ordered": true,
    "chunk_sizes_bounded": true,
    "backpressure_addressed": true,
    "terminal_states_clear": true
  },
  "security": {
    "remote_endpoints_present": true,
    "remote_endpoints_authenticated": true,
    "inputs_validated": true,
    "output_sizes_capped": true,
    "tool_execution_sandboxed": true
  },
  "honesty": {
    "unimplemented_modes_noted": true,
    "unsupported_features_faked": false
  },
  "upgrade": {
    "sdk_upgrade_path_documented": true,
    "adapter_tests_kept_for_sdk_swap": true
  },
  "tests": {
    "scripted_client_handshake_covered": true,
    "lifecycle_happy_error_cancel_covered": true,
    "contract_tests_in_ci_per_protocol": true
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all checks
and a text stamp of the verdict):

```json
{
  "service": "acp-protocol-integration-review",
  "atom_version": "0.1.0",
  "implementation": "v1.0.0-stable",
  "verdict": "INTEGRATION_SOUND",
  "sections": {
    "disambiguation_and_scope": "pass",
    "adapter_architecture": "pass",
    "protocol_surface": "pass",
    "lifecycle_correctness": "pass",
    "streaming_discipline": "pass",
    "security": "pass",
    "honesty_tests_and_upgrade_path": "pass"
  },
  "flavor_status": "acp_client",
  "summary": "31 pass, 0 fail, 0 missing of 31 checks across seven sections."
}
```

## Verdicts

- **INTEGRATION_SOUND** — all 31 checks pass.
- **INTEGRATION_NOT_SOUND** — at least one check fails; the failing sections name the breached discipline.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
