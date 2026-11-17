# Mcp server design and review — documentation

**Mcp server design and review** · slug `mcp-server-design-and-review` · deliverable type REVIEW · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment a15298eb9b7f40bf80d306cea4a33f80).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **built-locally** — “no endpoint is live”, and contract.yaml still says status: **scaffolded**. Both are stale. TEST-REPORT.md and the recorded evidence in `verification/work/mcp-server-design-and-review/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment a15298eb9b7f40bf80d306cea4a33f80). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `server` "test-server"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "mcp-server-design-and-review"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the MCP server design manifest.** You declare a record of one MCP server's design — the atom audits the declared record, it does not connect to the server or run its tools (see Explanation). The recorded full-pass manifest declares the server `test-server`: all tool-design declarations in passing polarity (verb_noun tool names, typed JSON schemas, descriptions that state when to use each tool, errors that teach the fix, one job per tool, and no god-tools present); the budget declarations (the smallest set covers the job, related operations grouped); one tool row, `get_user`, with `operation` `read`, `has_typed_schema: true`, `single_job: true` and `has_negative_test: true`; transport that matches the deployment, stateless handlers where possible and boundary validation applied; remote transports authenticated, remote TLS present and least-privilege tokens per server; destructive actions gated by approval or scope and read and write separated; tool results treated as untrusted, fetched text never treated as instructions, response sizes capped and outputs sanitized before echoing; capabilities negotiated, changes additive, deprecations announced loudly and protocol versions pinned; a handshake smoke test in CI, per-tool happy and error cases covered, malformed-input tests present and schema-valid tool definitions; calls logged with tool, duration and outcome, error-rate spike alerts present and no secrets or sensitive payloads logged; and all three red-line flags `false` (no shell passthrough without sandboxing, no secrets echoed back, no unbounded resource reads).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/mcp-server-design-and-review` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `MCP_SERVER_SOUND`: "41 pass, 0 fail, 0 missing of 41 checks across five sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `tools_count` is 1, `typed_schema_coverage`, `single_job_coverage`, `valid_operation_coverage` and `negative_test_coverage` are each `"1.000000"`, `destructive_gate_coverage` is `null` (there are no destructive rows), and all six row-name lists are empty (`[]`).

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `MCP_SERVER_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "mcp-server-design-and-review"}`.
3. Call: `POST https://atoms.pipavia.com/v1/mcp-server-design-and-review` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/mcp-server-design-and-review` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `mcp_server_design_and_review`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `MCP_SERVER_NOT_SOUND` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 5 checks fail: `every_tool_has_negative_test`, `every_tool_has_typed_schema`, `every_tool_operation_valid`, `no_god_tools`, `no_tool_name_duplicated`, and the summary reads "36 pass, 5 fail, 0 missing of 41 checks across five sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (in the recorded violations run, `tools_without_typed_schema` names `get_user` — that row declares `has_typed_schema: false` — `typed_schema_coverage` is `"0.500000"`, `tools_with_invalid_operation` names `get_user` — that row declares `operation` `execute` — `valid_operation_coverage` is `"0.500000"`, `duplicate_tool_names` names `get_user`, `tools_without_negative_test` names `get_user`, `negative_test_coverage` is `"0.500000"`, `single_job_coverage` is `"1.000000"`, `tools_count` is 2, and `tool_design.god_tools_present` is declared `true`, failing `no_god_tools`; sections `tool_design_and_budget` and `versioning_contract_tests_and_observability` report `fail`, the other three `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where an object is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "tool_design",
  "detail": "tool_design must be an object"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/mcp-server-design-and-review` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/mcp-server-design-and-review` — tool name `mcp_server_design_and_review`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `mcp_server_design_and_review` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `server` and the `tools[]` string fields are noted as strings and `tools` as a list there. Where SERVICE.md states no type — the section container objects (`tool_design`, `budget`, `transport`, `auth`, `safety`, `injection`, `versioning`, `tests`, `observability`, `red_lines`) and a `tools[]` row object — the type below is grounded in the recorded evidence inputs (and, for the top-level containers, in the MCP `inputSchema` recorded in evidence.json, which types them `object` and `tools` as `array`); that grounding is said so in the Notes column. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `MCP_SERVER_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, exactly as SERVICE.md groups them. The `tools` list and its rows are read by more than one section; each row field is listed once, under the section named for it in SERVICE.md, with its other readers noted.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `server` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: tool_design_and_budget

| Field | Type | Notes |
|---|---|---|
| `tool_design` | object | The tool-design section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `tool_design.names_are_verb_noun` | boolean | — |
| `tool_design.typed_json_schemas` | boolean | — |
| `tool_design.descriptions_state_when_to_use` | boolean | — |
| `tool_design.errors_teach_fix` | boolean | — |
| `tool_design.one_job_per_tool` | boolean | — |
| `tool_design.god_tools_present` | boolean | must be `false` to pass |
| `budget` | object | The budget section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `budget.smallest_set_covers_job` | boolean | — |
| `budget.related_operations_grouped` | boolean | — |
| `tools` | list | list of tool-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md). Also read by safety_rails_and_injection_awareness and versioning_contract_tests_and_observability |
| `tools[]` | object | One declared tool row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `tools[].name` | string | Names the row in the computed outputs; duplicate names are computed, see below (type stated in SERVICE.md) |
| `tools[].operation` | string | Must be one of `read`, `write`, `destructive` — the skill's read-vs-write separation set (type and set stated in SERVICE.md). Also read by safety_rails_and_injection_awareness |
| `tools[].has_typed_schema` | boolean | — |
| `tools[].single_job` | boolean | — |

#### Read by: transports_and_auth

| Field | Type | Notes |
|---|---|---|
| `transport` | object | The transport section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `transport.transport_matches_deployment` | boolean | — |
| `transport.handlers_stateless_where_possible` | boolean | — |
| `transport.boundary_validation_applied` | boolean | — |
| `auth` | object | The auth section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `auth.remote_transports_authenticated` | boolean | — |
| `auth.remote_tls_present` | boolean | — |
| `auth.least_privilege_tokens_per_server` | boolean | — |

#### Read by: safety_rails_and_injection_awareness

| Field | Type | Notes |
|---|---|---|
| `safety` | object | The safety section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `safety.destructive_actions_gated_by_approval_or_scope` | boolean | — |
| `safety.read_and_write_separated` | boolean | — |
| `injection` | object | The injection section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `injection.tool_results_treated_as_untrusted` | boolean | — |
| `injection.fetched_text_never_treated_as_instructions` | boolean | — |
| `injection.response_sizes_capped` | boolean | — |
| `injection.outputs_sanitized_before_echoing` | boolean | — |
| `tools[].approval_or_scope_gate_present` | boolean | Required `true` on every `destructive` row, see below; not read for other rows |

#### Read by: versioning_contract_tests_and_observability

| Field | Type | Notes |
|---|---|---|
| `versioning` | object | The versioning section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `versioning.capabilities_negotiated` | boolean | — |
| `versioning.changes_additive` | boolean | — |
| `versioning.deprecations_announced_loudly` | boolean | — |
| `versioning.protocol_versions_pinned` | boolean | — |
| `tests` | object | The tests section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `tests.handshake_smoke_in_ci` | boolean | — |
| `tests.per_tool_happy_and_error_cases_covered` | boolean | — |
| `tests.malformed_input_tests_present` | boolean | — |
| `tests.schema_valid_tool_definitions` | boolean | — |
| `observability` | object | The observability section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `observability.calls_logged_with_tool_duration_outcome` | boolean | — |
| `observability.error_rate_spike_alerts_present` | boolean | — |
| `observability.secrets_or_sensitive_payloads_logged_present` | boolean | must be `false` to pass |
| `tools[].has_negative_test` | boolean | — |

#### Read by: red_lines

| Field | Type | Notes |
|---|---|---|
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.shell_passthrough_without_sandboxing_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.secrets_echoed_back_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.unbounded_resource_reads_present` | boolean | must be `false` to pass — skill red line |

### Checks

All 41 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies).

#### Section: tool_design_and_budget

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `names_are_verb_noun` | tool design: tool names are clear verb_noun names | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `typed_json_schemas` | tool design: tools carry typed JSON schemas | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `descriptions_state_when_to_use` | tool design: concise descriptions say when to use each tool | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `errors_teach_fix` | tool design: errors teach the fix | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `one_job_per_tool` | tool design: one job per tool | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_god_tools` | tool design: no god-tools are present | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `smallest_set_covers_job` | respect the budget: the tool set is the smallest set that covers the job — each tool costs context and confusion | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `related_operations_grouped` | respect the budget: related operations are grouped | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tools_declared` | the declared record names its tools — the tools list is present and non-empty | Computed over the declared record. Pass: the `tools` list is present and non-empty. Fail: the list is present but empty. Missing: the list is absent. |
| `every_tool_has_typed_schema` | tool design: every declared tool row carries a typed schema | Computed over the declared record. Pass: every declared tool row declares `has_typed_schema: true`. Fail: a row declares `has_typed_schema` present but not `true` (offending rows are named in `tools_without_typed_schema`). Missing: the list is absent, or a row has `has_typed_schema` absent (such a row is missing evidence and does not appear in `tools_without_typed_schema`). |
| `every_tool_single_job` | tool design: every declared tool row does a single job — no god-tools | Computed over the declared record. Pass: every declared tool row declares `single_job: true`. Fail: a row declares `single_job` present but not `true` (offending rows are named in `tools_not_single_job`). Missing: the list is absent, or a row has `single_job` absent (such a row is missing evidence and does not appear in `tools_not_single_job`). |
| `every_tool_operation_valid` | tool design: every declared tool row declares an operation from the skill's separation set — read / write / destructive | Computed over the declared record. Pass: every declared tool row declares `operation` from the skill's set — `read`, `write`, `destructive`. Fail: a row declares `operation` present but not in that set (offending rows are named in `tools_with_invalid_operation`). Missing: the list is absent, or a row has `operation` absent (such a row is missing evidence and does not appear in `tools_with_invalid_operation`). |
| `no_tool_name_duplicated` | tool design: no declared tool name appears on more than one tool row | Computed over the declared record. Pass: no declared tool `name` string appears on more than one tool row. Fail: a name is declared on more than one row (duplicated names are named in `duplicate_tool_names`, in the order their second occurrence appears). Missing: the list is absent, or a row has `name` absent. |

#### Section: transports_and_auth

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `transport_matches_deployment` | transports: the transport matches the deployment — stdio for local single-user, HTTP for remote | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `handlers_stateless_where_possible` | transports: handlers are stateless where possible | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `boundary_validation_applied` | transports: everything is validated at the boundary | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `remote_transports_authenticated` | transports: remote transports are authenticated | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `remote_tls_present` | transports: remote HTTP runs with TLS | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `least_privilege_tokens_per_server` | auth: least-privilege tokens are held per server | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: safety_rails_and_injection_awareness

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `destructive_actions_gated_by_approval_or_scope` | safety rails: destructive actions — delete, send, pay, deploy — are gated by human approval or explicit scopes | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `read_and_write_separated` | safety rails: read and write tools are separated | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tool_results_treated_as_untrusted` | injection-aware: tool results are treated as untrusted content | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `fetched_text_never_treated_as_instructions` | injection-aware: fetched text is never treated as instructions | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `response_sizes_capped` | injection-aware: response sizes are capped | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `outputs_sanitized_before_echoing` | injection-aware: outputs are sanitized before echoing anywhere | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `every_destructive_tool_gated` | safety rails: every declared destructive tool row carries an approval or scope gate — a record with no destructive rows passes vacuously | Computed over the declared record. Pass: every declared tool row whose `operation` is `destructive` declares `approval_or_scope_gate_present: true`; a record with no destructive rows passes vacuously. Fail: a destructive row declares `approval_or_scope_gate_present` present but not `true` (offending rows are named in `destructive_tools_without_gate`). Missing: the list is absent, or a destructive row has `approval_or_scope_gate_present` absent (such a row is missing evidence and does not appear in `destructive_tools_without_gate`). |

#### Section: versioning_contract_tests_and_observability

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `capabilities_negotiated` | versioning: capabilities are negotiated | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `changes_additive` | versioning: changes are additive | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `deprecations_announced_loudly` | versioning: deprecations are announced loudly | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `protocol_versions_pinned` | versioning: the protocol versions clients speak are pinned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `handshake_smoke_in_ci` | contract tests: handshake — initialize / list / call — smoke runs in CI | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `per_tool_happy_and_error_cases_covered` | contract tests: per-tool happy and error cases are covered | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `malformed_input_tests_present` | contract tests: malformed-input tests are present | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `schema_valid_tool_definitions` | quality gate: tool definitions are schema-valid | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `every_tool_has_negative_test` | quality gate: every declared tool row carries a negative test | Computed over the declared record. Pass: every declared tool row declares `has_negative_test: true`. Fail: a row declares `has_negative_test` present but not `true` (offending rows are named in `tools_without_negative_test`). Missing: the list is absent, or a row has `has_negative_test` absent (such a row is missing evidence and does not appear in `tools_without_negative_test`). |
| `calls_logged_with_tool_duration_outcome` | observability: calls are logged with tool, duration and outcome | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `error_rate_spike_alerts_present` | observability: alerts fire on error-rate spikes | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_secrets_or_sensitive_payloads_logged` | observability: no secrets or full payloads of sensitive data are logged | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

#### Section: red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `no_shell_passthrough_without_sandboxing` | red line: no shell passthrough tools without sandboxing are present | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_secrets_echoed_back` | red line: no secrets are echoed back | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_unbounded_resource_reads` | red line: no unbounded resource reads are present | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"mcp-server-design-and-review"`), `atom_version` (`"0.1.0"`), and `server` (the manifest's declared server value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `tools_count` (the declared list length as an integer, or null when the list is not declared); the row-name lists `tools_without_typed_schema` (tools whose `has_typed_schema` field is present but not true; a tool with the field absent is missing evidence and does not appear), `tools_not_single_job` (tools whose `single_job` field is present but not true), `tools_with_invalid_operation` (tools whose `operation` is present but not in the skill's set), `duplicate_tool_names` (tool names declared on more than one row, in the order their second occurrence appears), `destructive_tools_without_gate` (destructive tools whose gate field is present but not true) and `tools_without_negative_test` (tools whose `has_negative_test` field is present but not true) — all six lists are null when the `tools` list is not declared, as recorded in the sparse case; and the ratios `typed_schema_coverage` (tools with a typed schema ÷ declared tools), `single_job_coverage`, `valid_operation_coverage`, `destructive_gate_coverage` (gated destructive tools ÷ declared destructive tools; null when there are no destructive rows, or the tools list is absent or empty) and `negative_test_coverage` — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty. Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "41 pass, 0 fail, 0 missing of 41 checks across five sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared server value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `MCP_SERVER_SOUND` — all 41 checks pass: the declared MCP server design record is complete and consistent with the bound skill's checklist and red lines.
- `MCP_SERVER_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one of the seven primary computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence; `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `tools_count`, `tools_without_typed_schema`, `typed_schema_coverage`, `tools_not_single_job`, `single_job_coverage`, `tools_with_invalid_operation`, `valid_operation_coverage`, `duplicate_tool_names`, `destructive_tools_without_gate`, `destructive_gate_coverage`, `tools_without_negative_test`, `negative_test_coverage` and `computed_status` — each defined in Output format above, with the values and null rules recorded there.

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"tool_design","detail":"tool_design must be an object"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type REVIEW — this atom sells the review it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Build and consume MCP well — tool design, transports, auth, injection-safe tooling, contract tests (the bound capability, from the skill). You submit one declared record — the MCP server design manifest — and the atom audits that record for completeness and internal consistency against the bound skill's checklist, quality gates and red lines, returning one deterministic verdict across 5 sections (`tool_design_and_budget`, `transports_and_auth`, `safety_rails_and_injection_awareness`, `versioning_contract_tests_and_observability`, `red_lines`). The atom sells that review — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Two kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — the declared `tools` list must be present and non-empty, every tool row must declare `has_typed_schema: true`, must declare `single_job: true`, must declare an `operation` from the skill's own separation set (`read`, `write`, `destructive`), and must declare `has_negative_test: true`, no declared tool `name` string may appear on more than one tool row, and every destructive tool row must declare `approval_or_scope_gate_present: true` — using only the declared record, with no outside threshold imported. Aggregation is strict: any `fail` anywhere produces `MCP_SERVER_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `MCP_SERVER_SOUND`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented: a maximum tool count (the skill says "aim for the smallest set that covers the job" and asks "why does it have 40 tools?" as a review question — it states no cap number); a response-size byte or token cap (the skill says "cap response sizes" but states no size); an error-rate spike percentage or alert threshold; a test-coverage percentage; a handshake or call timeout or latency bound; a deprecation notice period in days (the skill says "deprecate loudly", no period); a mandated protocol version number (the skill says pin the versions your clients speak, it names none); a log-retention period. Quantities are computed and reported; the only bar on the computed rows is completeness over the caller's own declared rows.

**What it does NOT do.** The atom audits a **declared** MCP server record: a verdict of `MCP_SERVER_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a manifest that declares remote transports authenticated, destructive tools gated and no shell passthrough passes those checks even if the real server does none of it. It is a completeness and consistency audit of the record the skill requires, **not an MCP implementation service, a penetration test, or a protocol-compliance certification**. Specifically: it connects to no server, runs no handshake, calls no tool, reads no live traffic or logs, and does not verify that a declared control actually works. It never judges whether a tool's schema is well designed in detail, whether a description is genuinely clear, whether a sandbox actually contains a shell tool, or whether a gate genuinely stops a destructive call — only that the record contains what the skill's sections and red lines demand, and that its declared rows are internally consistent. Named exclusions: no numeric thresholds beyond the skill's own stated rules (see the declined list above); no live verification of any declared fact; no inspection of actual tool names, descriptions or schema bodies — verb_noun naming, when-to-use descriptions and schema validity are caller-declared flags, the atom reads no tool definitions; the quality of a sandbox, a sanitizer or an approval flow in substance is a caller declaration — only its declared presence is checked.

**Buyer and use context.** Teams and agents working in How Milo works who need this review on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Conduit MCP server builds (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulators: N/A — this atom audits a declared MCP server design record; its verdict is a completeness and consistency judgment on the caller's declared evidence, not compliance evidence, and SERVICE.md states explicitly that it is not an MCP implementation service, a penetration test, or a protocol-compliance certification, and that it connects to no server and verifies no live fact. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `mcp_server_design_and_review` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/mcp_server_design_and_review.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_mcp_server_design_and_review.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/mcp-server-design-and-review` (REST) and `POST /mcp/mcp-server-design-and-review` (MCP, tool `mcp_server_design_and_review`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment a15298eb9b7f40bf80d306cea4a33f80). Key scope: `mcp_server_design_and_review`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale and conflicting:** SERVICE.md says Tier B · status: **built-locally**, “no endpoint is live”, and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment a15298eb9b7f40bf80d306cea4a33f80) shows the atom live. This document follows the evidenced live state: live.
2. **Check names differ from input field names:** the recorded check names are not the input field names for the anti-pattern / red-line checks and the computed checks. Recorded check names used verbatim in the Checks section include `no_god_tools` (input `tool_design.god_tools_present`), `no_secrets_or_sensitive_payloads_logged` (input `observability.secrets_or_sensitive_payloads_logged_present`), `no_shell_passthrough_without_sandboxing` (input `red_lines.shell_passthrough_without_sandboxing_present`), `no_secrets_echoed_back` (input `red_lines.secrets_echoed_back_present`) and `no_unbounded_resource_reads` (input `red_lines.unbounded_resource_reads_present`), plus the computed checks `tools_declared`, `every_tool_has_typed_schema`, `every_tool_single_job`, `every_tool_operation_valid`, `no_tool_name_duplicated`, `every_destructive_tool_gated` and `every_tool_has_negative_test`, which read the `tools` rows rather than any single input field.
3. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field. The recorded REST response carries all 41 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
4. **Testing date presentation:** USER-GUIDE.md describes its worked example as “from external testing 2026-11-16” and TEST-REPORT.md is dated 2026-11-16, while evidence.json records `tested_at_utc` as `2026-11-16T07:36:32.449714+00:00`. The day agrees; the provenance lines in this document use the recorded UTC timestamp and gateway version from evidence.json.
5. **Section grouping vs input objects:** the recorded sections merge separate input objects — `tool_design`, `budget` and the `tools` rows are read by the single recorded section `tool_design_and_budget`, `transport` and `auth` inputs are read by the single recorded section `transports_and_auth`, `safety` and `injection` inputs (and the destructive-gate row field) are read by the single recorded section `safety_rails_and_injection_awareness`, and `versioning`, `tests` and `observability` inputs (and the negative-test row field) are read by the single recorded section `versioning_contract_tests_and_observability`. This document groups the Input reference and the Checks by the recorded section names.
6. **Null lists on an undeclared `tools` list:** SERVICE.md's output paragraph states the null rules for `computed_status`, `tools_count` and the coverage ratios, but does not state a null rule for the six row-name lists. The recorded sparse response returns all six lists as `null` when `tools` is not declared (as USER-GUIDE.md also states); this document follows the recording.
7. **Violations-case note in cases.json / evidence.json:** the `expect.notes` for the violations case in both files say “destructive tool missing approval_or_scope_gate_present (violates rule)”, but the recorded violations input declares no destructive row (its operations are `execute` and `read`), the recorded response does not fail `every_destructive_tool_gated` (it passes, and `destructive_gate_coverage` is `null`), and the recorded failing set is exactly the 5 checks named in TEST-REPORT.md. This document follows the recorded input and response, not that note.

## Worked examples

Provenance: recorded 2026-11-16T07:36:32.449714+00:00 against gateway v1.1.0, external verification lane, source `verification/work/mcp-server-design-and-review/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T07:36:32.449714+00:00 · gateway v1.1.0 · source `verification/work/mcp-server-design-and-review/evidence.json`.

Input:

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

Response (HTTP 200):

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
  "checks": [
    {
      "section": "tool_design_and_budget",
      "check": "names_are_verb_noun",
      "status": "pass",
      "evidence": "tool design: tool names are clear verb_noun names"
    },
    {
      "section": "tool_design_and_budget",
      "check": "typed_json_schemas",
      "status": "pass",
      "evidence": "tool design: tools carry typed JSON schemas"
    },
    {
      "section": "tool_design_and_budget",
      "check": "descriptions_state_when_to_use",
      "status": "pass",
      "evidence": "tool design: concise descriptions say when to use each tool"
    },
    {
      "section": "tool_design_and_budget",
      "check": "errors_teach_fix",
      "status": "pass",
      "evidence": "tool design: errors teach the fix"
    },
    {
      "section": "tool_design_and_budget",
      "check": "one_job_per_tool",
      "status": "pass",
      "evidence": "tool design: one job per tool"
    },
    {
      "section": "tool_design_and_budget",
      "check": "no_god_tools",
      "status": "pass",
      "evidence": "tool design: no god-tools are present"
    },
    {
      "section": "tool_design_and_budget",
      "check": "smallest_set_covers_job",
      "status": "pass",
      "evidence": "respect the budget: the tool set is the smallest set that covers the job — each tool costs context and confusion"
    },
    {
      "section": "tool_design_and_budget",
      "check": "related_operations_grouped",
      "status": "pass",
      "evidence": "respect the budget: related operations are grouped"
    },
    {
      "section": "tool_design_and_budget",
      "check": "tools_declared",
      "status": "pass",
      "evidence": "the declared record names its tools — the tools list is present and non-empty"
    },
    {
      "section": "tool_design_and_budget",
      "check": "every_tool_has_typed_schema",
      "status": "pass",
      "evidence": "tool design: every declared tool row carries a typed schema"
    },
    {
      "section": "tool_design_and_budget",
      "check": "every_tool_single_job",
      "status": "pass",
      "evidence": "tool design: every declared tool row does a single job — no god-tools"
    },
    {
      "section": "tool_design_and_budget",
      "check": "every_tool_operation_valid",
      "status": "pass",
      "evidence": "tool design: every declared tool row declares an operation from the skill's separation set — read / write / destructive"
    },
    {
      "section": "tool_design_and_budget",
      "check": "no_tool_name_duplicated",
      "status": "pass",
      "evidence": "tool design: no declared tool name appears on more than one tool row"
    },
    {
      "section": "transports_and_auth",
      "check": "transport_matches_deployment",
      "status": "pass",
      "evidence": "transports: the transport matches the deployment — stdio for local single-user, HTTP for remote"
    },
    {
      "section": "transports_and_auth",
      "check": "handlers_stateless_where_possible",
      "status": "pass",
      "evidence": "transports: handlers are stateless where possible"
    },
    {
      "section": "transports_and_auth",
      "check": "boundary_validation_applied",
      "status": "pass",
      "evidence": "transports: everything is validated at the boundary"
    },
    {
      "section": "transports_and_auth",
      "check": "remote_transports_authenticated",
      "status": "pass",
      "evidence": "transports: remote transports are authenticated"
    },
    {
      "section": "transports_and_auth",
      "check": "remote_tls_present",
      "status": "pass",
      "evidence": "transports: remote HTTP runs with TLS"
    },
    {
      "section": "transports_and_auth",
      "check": "least_privilege_tokens_per_server",
      "status": "pass",
      "evidence": "auth: least-privilege tokens are held per server"
    },
    {
      "section": "safety_rails_and_injection_awareness",
      "check": "destructive_actions_gated_by_approval_or_scope",
      "status": "pass",
      "evidence": "safety rails: destructive actions — delete, send, pay, deploy — are gated by human approval or explicit scopes"
    },
    {
      "section": "safety_rails_and_injection_awareness",
      "check": "read_and_write_separated",
      "status": "pass",
      "evidence": "safety rails: read and write tools are separated"
    },
    {
      "section": "safety_rails_and_injection_awareness",
      "check": "tool_results_treated_as_untrusted",
      "status": "pass",
      "evidence": "injection-aware: tool results are treated as untrusted content"
    },
    {
      "section": "safety_rails_and_injection_awareness",
      "check": "fetched_text_never_treated_as_instructions",
      "status": "pass",
      "evidence": "injection-aware: fetched text is never treated as instructions"
    },
    {
      "section": "safety_rails_and_injection_awareness",
      "check": "response_sizes_capped",
      "status": "pass",
      "evidence": "injection-aware: response sizes are capped"
    },
    {
      "section": "safety_rails_and_injection_awareness",
      "check": "outputs_sanitized_before_echoing",
      "status": "pass",
      "evidence": "injection-aware: outputs are sanitized before echoing anywhere"
    },
    {
      "section": "safety_rails_and_injection_awareness",
      "check": "every_destructive_tool_gated",
      "status": "pass",
      "evidence": "safety rails: every declared destructive tool row carries an approval or scope gate — a record with no destructive rows passes vacuously"
    },
    {
      "section": "versioning_contract_tests_and_observability",
      "check": "capabilities_negotiated",
      "status": "pass",
      "evidence": "versioning: capabilities are negotiated"
    },
    {
      "section": "versioning_contract_tests_and_observability",
      "check": "changes_additive",
      "status": "pass",
      "evidence": "versioning: changes are additive"
    },
    {
      "section": "versioning_contract_tests_and_observability",
      "check": "deprecations_announced_loudly",
      "status": "pass",
      "evidence": "versioning: deprecations are announced loudly"
    },
    {
      "section": "versioning_contract_tests_and_observability",
      "check": "protocol_versions_pinned",
      "status": "pass",
      "evidence": "versioning: the protocol versions clients speak are pinned"
    },
    {
      "section": "versioning_contract_tests_and_observability",
      "check": "handshake_smoke_in_ci",
      "status": "pass",
      "evidence": "contract tests: handshake — initialize / list / call — smoke runs in CI"
    },
    {
      "section": "versioning_contract_tests_and_observability",
      "check": "per_tool_happy_and_error_cases_covered",
      "status": "pass",
      "evidence": "contract tests: per-tool happy and error cases are covered"
    },
    {
      "section": "versioning_contract_tests_and_observability",
      "check": "malformed_input_tests_present",
      "status": "pass",
      "evidence": "contract tests: malformed-input tests are present"
    },
    {
      "section": "versioning_contract_tests_and_observability",
      "check": "schema_valid_tool_definitions",
      "status": "pass",
      "evidence": "quality gate: tool definitions are schema-valid"
    },
    {
      "section": "versioning_contract_tests_and_observability",
      "check": "every_tool_has_negative_test",
      "status": "pass",
      "evidence": "quality gate: every declared tool row carries a negative test"
    },
    {
      "section": "versioning_contract_tests_and_observability",
      "check": "calls_logged_with_tool_duration_outcome",
      "status": "pass",
      "evidence": "observability: calls are logged with tool, duration and outcome"
    },
    {
      "section": "versioning_contract_tests_and_observability",
      "check": "error_rate_spike_alerts_present",
      "status": "pass",
      "evidence": "observability: alerts fire on error-rate spikes"
    },
    {
      "section": "versioning_contract_tests_and_observability",
      "check": "no_secrets_or_sensitive_payloads_logged",
      "status": "pass",
      "evidence": "observability: no secrets or full payloads of sensitive data are logged"
    },
    {
      "section": "red_lines",
      "check": "no_shell_passthrough_without_sandboxing",
      "status": "pass",
      "evidence": "red line: no shell passthrough tools without sandboxing are present"
    },
    {
      "section": "red_lines",
      "check": "no_secrets_echoed_back",
      "status": "pass",
      "evidence": "red line: no secrets are echoed back"
    },
    {
      "section": "red_lines",
      "check": "no_unbounded_resource_reads",
      "status": "pass",
      "evidence": "red line: no unbounded resource reads are present"
    }
  ],
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
  "summary": "41 pass, 0 fail, 0 missing of 41 checks across five sections.",
  "stamp": "MCP SERVER DESIGN AND REVIEW\nserver: test-server\nVERDICT: MCP_SERVER_SOUND\n  tool_design_and_budget               pass\n  transports_and_auth                  pass\n  safety_rails_and_injection_awareness pass\n  versioning_contract_tests_and_observability pass\n  red_lines                            pass\n41 pass, 0 fail, 0 missing of 41 checks across five sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T07:36:32.449714+00:00 · gateway v1.1.0 · source `verification/work/mcp-server-design-and-review/evidence.json`.

Input:

```json
{
  "server": "test-server",
  "tool_design": {
    "names_are_verb_noun": true,
    "typed_json_schemas": true,
    "descriptions_state_when_to_use": true,
    "errors_teach_fix": true,
    "one_job_per_tool": true,
    "god_tools_present": true
  },
  "budget": {
    "smallest_set_covers_job": true,
    "related_operations_grouped": true
  },
  "tools": [
    {
      "name": "get_user",
      "operation": "execute",
      "has_typed_schema": false,
      "single_job": true,
      "has_negative_test": true
    },
    {
      "name": "get_user",
      "operation": "read",
      "has_typed_schema": true,
      "single_job": true,
      "has_negative_test": false
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

Response (HTTP 200):

```json
{
  "service": "mcp-server-design-and-review",
  "atom_version": "0.1.0",
  "server": "test-server",
  "verdict": "MCP_SERVER_NOT_SOUND",
  "sections": {
    "tool_design_and_budget": "fail",
    "transports_and_auth": "pass",
    "safety_rails_and_injection_awareness": "pass",
    "versioning_contract_tests_and_observability": "fail",
    "red_lines": "pass"
  },
  "checks": [
    {
      "section": "tool_design_and_budget",
      "check": "names_are_verb_noun",
      "status": "pass",
      "evidence": "tool design: tool names are clear verb_noun names"
    },
    {
      "section": "tool_design_and_budget",
      "check": "typed_json_schemas",
      "status": "pass",
      "evidence": "tool design: tools carry typed JSON schemas"
    },
    {
      "section": "tool_design_and_budget",
      "check": "descriptions_state_when_to_use",
      "status": "pass",
      "evidence": "tool design: concise descriptions say when to use each tool"
    },
    {
      "section": "tool_design_and_budget",
      "check": "errors_teach_fix",
      "status": "pass",
      "evidence": "tool design: errors teach the fix"
    },
    {
      "section": "tool_design_and_budget",
      "check": "one_job_per_tool",
      "status": "pass",
      "evidence": "tool design: one job per tool"
    },
    {
      "section": "tool_design_and_budget",
      "check": "no_god_tools",
      "status": "fail",
      "evidence": "tool design: no god-tools are present"
    },
    {
      "section": "tool_design_and_budget",
      "check": "smallest_set_covers_job",
      "status": "pass",
      "evidence": "respect the budget: the tool set is the smallest set that covers the job — each tool costs context and confusion"
    },
    {
      "section": "tool_design_and_budget",
      "check": "related_operations_grouped",
      "status": "pass",
      "evidence": "respect the budget: related operations are grouped"
    },
    {
      "section": "tool_design_and_budget",
      "check": "tools_declared",
      "status": "pass",
      "evidence": "the declared record names its tools — the tools list is present and non-empty"
    },
    {
      "section": "tool_design_and_budget",
      "check": "every_tool_has_typed_schema",
      "status": "fail",
      "evidence": "tool design: every declared tool row carries a typed schema"
    },
    {
      "section": "tool_design_and_budget",
      "check": "every_tool_single_job",
      "status": "pass",
      "evidence": "tool design: every declared tool row does a single job — no god-tools"
    },
    {
      "section": "tool_design_and_budget",
      "check": "every_tool_operation_valid",
      "status": "fail",
      "evidence": "tool design: every declared tool row declares an operation from the skill's separation set — read / write / destructive"
    },
    {
      "section": "tool_design_and_budget",
      "check": "no_tool_name_duplicated",
      "status": "fail",
      "evidence": "tool design: no declared tool name appears on more than one tool row"
    },
    {
      "section": "transports_and_auth",
      "check": "transport_matches_deployment",
      "status": "pass",
      "evidence": "transports: the transport matches the deployment — stdio for local single-user, HTTP for remote"
    },
    {
      "section": "transports_and_auth",
      "check": "handlers_stateless_where_possible",
      "status": "pass",
      "evidence": "transports: handlers are stateless where possible"
    },
    {
      "section": "transports_and_auth",
      "check": "boundary_validation_applied",
      "status": "pass",
      "evidence": "transports: everything is validated at the boundary"
    },
    {
      "section": "transports_and_auth",
      "check": "remote_transports_authenticated",
      "status": "pass",
      "evidence": "transports: remote transports are authenticated"
    },
    {
      "section": "transports_and_auth",
      "check": "remote_tls_present",
      "status": "pass",
      "evidence": "transports: remote HTTP runs with TLS"
    },
    {
      "section": "transports_and_auth",
      "check": "least_privilege_tokens_per_server",
      "status": "pass",
      "evidence": "auth: least-privilege tokens are held per server"
    },
    {
      "section": "safety_rails_and_injection_awareness",
      "check": "destructive_actions_gated_by_approval_or_scope",
      "status": "pass",
      "evidence": "safety rails: destructive actions — delete, send, pay, deploy — are gated by human approval or explicit scopes"
    },
    {
      "section": "safety_rails_and_injection_awareness",
      "check": "read_and_write_separated",
      "status": "pass",
      "evidence": "safety rails: read and write tools are separated"
    },
    {
      "section": "safety_rails_and_injection_awareness",
      "check": "tool_results_treated_as_untrusted",
      "status": "pass",
      "evidence": "injection-aware: tool results are treated as untrusted content"
    },
    {
      "section": "safety_rails_and_injection_awareness",
      "check": "fetched_text_never_treated_as_instructions",
      "status": "pass",
      "evidence": "injection-aware: fetched text is never treated as instructions"
    },
    {
      "section": "safety_rails_and_injection_awareness",
      "check": "response_sizes_capped",
      "status": "pass",
      "evidence": "injection-aware: response sizes are capped"
    },
    {
      "section": "safety_rails_and_injection_awareness",
      "check": "outputs_sanitized_before_echoing",
      "status": "pass",
      "evidence": "injection-aware: outputs are sanitized before echoing anywhere"
    },
    {
      "section": "safety_rails_and_injection_awareness",
      "check": "every_destructive_tool_gated",
      "status": "pass",
      "evidence": "safety rails: every declared destructive tool row carries an approval or scope gate — a record with no destructive rows passes vacuously"
    },
    {
      "section": "versioning_contract_tests_and_observability",
      "check": "capabilities_negotiated",
      "status": "pass",
      "evidence": "versioning: capabilities are negotiated"
    },
    {
      "section": "versioning_contract_tests_and_observability",
      "check": "changes_additive",
      "status": "pass",
      "evidence": "versioning: changes are additive"
    },
    {
      "section": "versioning_contract_tests_and_observability",
      "check": "deprecations_announced_loudly",
      "status": "pass",
      "evidence": "versioning: deprecations are announced loudly"
    },
    {
      "section": "versioning_contract_tests_and_observability",
      "check": "protocol_versions_pinned",
      "status": "pass",
      "evidence": "versioning: the protocol versions clients speak are pinned"
    },
    {
      "section": "versioning_contract_tests_and_observability",
      "check": "handshake_smoke_in_ci",
      "status": "pass",
      "evidence": "contract tests: handshake — initialize / list / call — smoke runs in CI"
    },
    {
      "section": "versioning_contract_tests_and_observability",
      "check": "per_tool_happy_and_error_cases_covered",
      "status": "pass",
      "evidence": "contract tests: per-tool happy and error cases are covered"
    },
    {
      "section": "versioning_contract_tests_and_observability",
      "check": "malformed_input_tests_present",
      "status": "pass",
      "evidence": "contract tests: malformed-input tests are present"
    },
    {
      "section": "versioning_contract_tests_and_observability",
      "check": "schema_valid_tool_definitions",
      "status": "pass",
      "evidence": "quality gate: tool definitions are schema-valid"
    },
    {
      "section": "versioning_contract_tests_and_observability",
      "check": "every_tool_has_negative_test",
      "status": "fail",
      "evidence": "quality gate: every declared tool row carries a negative test"
    },
    {
      "section": "versioning_contract_tests_and_observability",
      "check": "calls_logged_with_tool_duration_outcome",
      "status": "pass",
      "evidence": "observability: calls are logged with tool, duration and outcome"
    },
    {
      "section": "versioning_contract_tests_and_observability",
      "check": "error_rate_spike_alerts_present",
      "status": "pass",
      "evidence": "observability: alerts fire on error-rate spikes"
    },
    {
      "section": "versioning_contract_tests_and_observability",
      "check": "no_secrets_or_sensitive_payloads_logged",
      "status": "pass",
      "evidence": "observability: no secrets or full payloads of sensitive data are logged"
    },
    {
      "section": "red_lines",
      "check": "no_shell_passthrough_without_sandboxing",
      "status": "pass",
      "evidence": "red line: no shell passthrough tools without sandboxing are present"
    },
    {
      "section": "red_lines",
      "check": "no_secrets_echoed_back",
      "status": "pass",
      "evidence": "red line: no secrets are echoed back"
    },
    {
      "section": "red_lines",
      "check": "no_unbounded_resource_reads",
      "status": "pass",
      "evidence": "red line: no unbounded resource reads are present"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "tools_count": 2,
  "tools_without_typed_schema": [
    "get_user"
  ],
  "typed_schema_coverage": "0.500000",
  "tools_not_single_job": [],
  "single_job_coverage": "1.000000",
  "tools_with_invalid_operation": [
    "get_user"
  ],
  "valid_operation_coverage": "0.500000",
  "duplicate_tool_names": [
    "get_user"
  ],
  "destructive_tools_without_gate": [],
  "destructive_gate_coverage": null,
  "tools_without_negative_test": [
    "get_user"
  ],
  "negative_test_coverage": "0.500000",
  "summary": "36 pass, 5 fail, 0 missing of 41 checks across five sections.",
  "stamp": "MCP SERVER DESIGN AND REVIEW\nserver: test-server\nVERDICT: MCP_SERVER_NOT_SOUND\n  tool_design_and_budget               fail\n  transports_and_auth                  pass\n  safety_rails_and_injection_awareness pass\n  versioning_contract_tests_and_observability fail\n  red_lines                            pass\n36 pass, 5 fail, 0 missing of 41 checks across five sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T07:36:32.449714+00:00 · gateway v1.1.0 · source `verification/work/mcp-server-design-and-review/evidence.json`.

Input:

```json
{
  "server": "malformed-server",
  "tool_design": "not-an-object"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "tool_design",
  "detail": "tool_design must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — this atom audits a declared MCP server design record; its verdict is a completeness and consistency judgment on declared evidence, not compliance evidence, not an MCP implementation service, a penetration test or a protocol-compliance certification, and it verifies no live fact. |
| Checks named | 41 documented / 41 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (`tools_count`, the six row-name lists and the five coverage ratios) |
| Input reference typed | Yes — 53 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/mcp-server-design-and-review/evidence.json` |
