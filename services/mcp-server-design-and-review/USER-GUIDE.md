# MCP server design and review — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are building or consuming an MCP server — tool design, transports, auth, injection-safe tooling, contract tests — and you have a record of your server's design. This atom reads one declared manifest and returns one deterministic verdict across five sections: **MCP_SERVER_SOUND**, **MCP_SERVER_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared record's completeness and consistency only — it connects to no server, runs no handshake, calls no tool, reads no live traffic or logs, and does not verify that a declared control actually works. A record is sound *on your declared evidence*: it never judges whether a tool's schema is well designed in detail, whether a description is genuinely clear, whether a sandbox actually contains a shell tool, or whether a gate genuinely stops a destructive call. Computed checks: the declared `tools` list must be present and non-empty; every tool row must carry a typed schema, do a single job, declare an operation from the skill's own set (`read`, `write`, `destructive`), carry a negative test, and no tool name may be duplicated; every destructive tool row must carry an approval/scope gate. No numeric threshold is imposed — no tool-count cap, no response-size byte or token cap, no error-rate bar, no test-coverage percentage, no timeout or latency bound, no deprecation notice period, no mandated protocol version, and no log-retention period. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "mcp-server-design-and-review"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/mcp-server-design-and-review` — tool name `mcp_server_design_and_review`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/mcp-server-design-and-review` — body = the manifest object; same `Authorization` header.

## Input — the MCP server design manifest

| Field | Meaning |
|---|---|
| `server` | server name (string; carried into the output, not checked) |
| `tool_design.names_are_verb_noun` | tool design: tool names are clear verb_noun names |
| `tool_design.typed_json_schemas` | tool design: tools carry typed JSON schemas |
| `tool_design.descriptions_state_when_to_use` | tool design: concise descriptions say when to use each tool |
| `tool_design.errors_teach_fix` | tool design: errors teach the fix |
| `tool_design.one_job_per_tool` | tool design: one job per tool |
| `tool_design.god_tools_present` | must be `false` to pass (tool design: no god-tools) |
| `budget.smallest_set_covers_job` | budget: the tool set is the smallest set that covers the job |
| `budget.related_operations_grouped` | budget: related operations are grouped |
| `tools` (list of tool-row objects) | computed: must be present and non-empty; reported as `tools_count` |
| `tools[].name` (string) | names the row in the computed outputs; computed: no name may appear on more than one row (reported in `duplicate_tool_names`) |
| `tools[].operation` (string) | computed: must be one of `read`, `write`, `destructive`; rows declaring any other value are reported in `tools_with_invalid_operation` |
| `tools[].has_typed_schema` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `tools_without_typed_schema` |
| `tools[].single_job` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `tools_not_single_job` |
| `tools[].has_negative_test` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `tools_without_negative_test` |
| `tools[].approval_or_scope_gate_present` | computed: required `true` on every `destructive` row; destructive rows with the field present but not `true` are reported in `destructive_tools_without_gate` (not read for other rows) |
| `transport.transport_matches_deployment` | transport evidence: the transport matches the deployment |
| `transport.handlers_stateless_where_possible` | transport evidence: handlers are stateless where possible |
| `transport.boundary_validation_applied` | transport evidence: boundary validation is applied |
| `auth.remote_transports_authenticated` | auth evidence: remote transports are authenticated |
| `auth.remote_tls_present` | auth evidence: TLS is present on remote transports |
| `auth.least_privilege_tokens_per_server` | auth evidence: tokens are least-privilege per server |
| `safety.destructive_actions_gated_by_approval_or_scope` | safety evidence: destructive actions are gated by approval or scope |
| `safety.read_and_write_separated` | safety evidence: read and write are separated |
| `injection.tool_results_treated_as_untrusted` | injection evidence: tool results are treated as untrusted |
| `injection.fetched_text_never_treated_as_instructions` | injection evidence: fetched text is never treated as instructions |
| `injection.response_sizes_capped` | injection evidence: response sizes are capped |
| `injection.outputs_sanitized_before_echoing` | injection evidence: outputs are sanitized before echoing |
| `versioning.capabilities_negotiated` | versioning evidence: capabilities are negotiated |
| `versioning.changes_additive` | versioning evidence: changes are additive |
| `versioning.deprecations_announced_loudly` | versioning evidence: deprecations are announced loudly |
| `versioning.protocol_versions_pinned` | versioning evidence: protocol versions are pinned |
| `tests.handshake_smoke_in_ci` | test evidence: a handshake smoke test runs in CI |
| `tests.per_tool_happy_and_error_cases_covered` | test evidence: per-tool happy and error cases are covered |
| `tests.malformed_input_tests_present` | test evidence: malformed-input tests are present |
| `tests.schema_valid_tool_definitions` | test evidence: tool definitions are schema-valid |
| `observability.calls_logged_with_tool_duration_outcome` | observability evidence: calls are logged with tool, duration and outcome |
| `observability.error_rate_spike_alerts_present` | observability evidence: error-rate spike alerts are present |
| `observability.secrets_or_sensitive_payloads_logged_present` | must be `false` to pass (observability line: no secrets or sensitive payloads logged) |
| `red_lines.shell_passthrough_without_sandboxing_present` | must be `false` to pass (red line: no shell passthrough without sandboxing) |
| `red_lines.secrets_echoed_back_present` | must be `false` to pass (red line: no secrets echoed back) |
| `red_lines.unbounded_resource_reads_present` | must be `false` to pass (red line: no unbounded resource reads) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward MCP_SERVER_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/mcp-server-design-and-review`:

```json
{
  "server": "test-server",
  "tool_design": {
    "names_are_verb_noun": true,
    "typed_json_schemas": true,
    "descriptions_state_when_to_use": true,
    "errors_teach_fix": true,
    "one_job_per_tool": true,
    "god_tools_present": false
  },
  "budget": {
    "smallest_set_covers_job": true,
    "related_operations_grouped": true
  },
  "tools": [
    {
      "name": "get_user",
      "operation": "read",
      "has_typed_schema": true,
      "single_job": true,
      "has_negative_test": true
    }
  ],
  "transport": {
    "transport_matches_deployment": true,
    "handlers_stateless_where_possible": true,
    "boundary_validation_applied": true
  },
  "auth": {
    "remote_transports_authenticated": true,
    "remote_tls_present": true,
    "least_privilege_tokens_per_server": true
  },
  "safety": {
    "destructive_actions_gated_by_approval_or_scope": true,
    "read_and_write_separated": true
  },
  "injection": {
    "tool_results_treated_as_untrusted": true,
    "fetched_text_never_treated_as_instructions": true,
    "response_sizes_capped": true,
    "outputs_sanitized_before_echoing": true
  },
  "versioning": {
    "capabilities_negotiated": true,
    "changes_additive": true,
    "deprecations_announced_loudly": true,
    "protocol_versions_pinned": true
  },
  "tests": {
    "handshake_smoke_in_ci": true,
    "per_tool_happy_and_error_cases_covered": true,
    "malformed_input_tests_present": true,
    "schema_valid_tool_definitions": true
  },
  "observability": {
    "calls_logged_with_tool_duration_outcome": true,
    "error_rate_spike_alerts_present": true,
    "secrets_or_sensitive_payloads_logged_present": false
  },
  "red_lines": {
    "shell_passthrough_without_sandboxing_present": false,
    "secrets_echoed_back_present": false,
    "unbounded_resource_reads_present": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 41 checks and a text stamp of the verdict):

```json
{
  "service": "mcp-server-design-and-review",
  "atom_version": "0.1.0",
  "server": "test-server",
  "verdict": "MCP_SERVER_SOUND",
  "sections": {
    "tool_design_and_budget": "pass",
    "transports_and_auth": "pass",
    "safety_rails_and_injection_awareness": "pass",
    "versioning_contract_tests_and_observability": "pass",
    "red_lines": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "tools_count": 1,
  "tools_without_typed_schema": [],
  "typed_schema_coverage": "1.000000",
  "tools_not_single_job": [],
  "single_job_coverage": "1.000000",
  "tools_with_invalid_operation": [],
  "valid_operation_coverage": "1.000000",
  "duplicate_tool_names": [],
  "destructive_tools_without_gate": [],
  "destructive_gate_coverage": null,
  "tools_without_negative_test": [],
  "negative_test_coverage": "1.000000",
  "summary": "41 pass, 0 fail, 0 missing of 41 checks across five sections."
}
```

## Verdicts

- **MCP_SERVER_SOUND** — every check passes; the declared MCP server design record is complete and consistent with the skill's checklist and red lines.
- **MCP_SERVER_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `tools_count` (the declared list length as an integer, or null when the list is not declared), the row-name lists `tools_without_typed_schema`, `tools_not_single_job`, `tools_with_invalid_operation`, `duplicate_tool_names`, `destructive_tools_without_gate` and `tools_without_negative_test` (null when the `tools` list is not declared; a tool with the relevant field absent is missing evidence and does not appear in the lists), the coverage values `typed_schema_coverage`, `single_job_coverage`, `valid_operation_coverage`, `destructive_gate_coverage` and `negative_test_coverage` (ratios as strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty — `destructive_gate_coverage` is also null when there are no destructive rows), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the seven primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
