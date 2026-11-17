# Test report — mcp-server-design-and-review

**Tester:** external-verification@aimlds.org — Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-16
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment a15298eb9b7f40bf80d306cea4a33f80
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/mcp-server-design-and-review/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (server `test-server`): all tool-design/budget, transport/auth, safety/injection, versioning/tests/observability declarations in passing polarity, all red-line flags false, one tool row `get_user` with operation `read`, typed schema, single job and negative test | HTTP 200, verdict `MCP_SERVER_SOUND`, `tools_count` `1`, `typed_schema_coverage` `"1.000000"`, `single_job_coverage` `"1.000000"`, `valid_operation_coverage` `"1.000000"`, `destructive_gate_coverage` `null`, `negative_test_coverage` `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `MCP_SERVER_SOUND`, 41 pass / 0 fail / 0 missing, all five sections `pass`, exactly those computed values (all row-name lists `[]`) | PASS |
| 2 | violations — full manifest identical to full-pass except the planted violations: `tool_design.god_tools_present` true, tool row 0 operation `execute` and `has_typed_schema` false, plus an appended duplicate row named `get_user` (valid operation/schema) with `has_negative_test` false | HTTP 200, verdict `MCP_SERVER_NOT_SOUND`, the 5 named checks fail | HTTP 200, `MCP_SERVER_NOT_SOUND`, 36 pass / 5 fail / 0 missing; failing checks exactly `every_tool_has_negative_test`, `every_tool_has_typed_schema`, `every_tool_operation_valid`, `no_god_tools`, `no_tool_name_duplicated`; `tools_count` `2`, `tools_without_typed_schema` `["get_user"]`, `typed_schema_coverage` `"0.500000"`, `tools_with_invalid_operation` `["get_user"]`, `valid_operation_coverage` `"0.500000"`, `duplicate_tool_names` `["get_user"]`, `tools_without_negative_test` `["get_user"]`, `negative_test_coverage` `"0.500000"`, `single_job_coverage` `"1.000000"`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `tool_design_and_budget` and `versioning_contract_tests_and_observability` `fail`, the other three `pass` | PASS |
| 3 | sparse — only `server` (`sketchy-server`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 41 missing, all five sections `insufficient_evidence`, `tools_count` null, `tools_without_typed_schema` null, `typed_schema_coverage` null, `tools_not_single_job` null, `single_job_coverage` null, `tools_with_invalid_operation` null, `valid_operation_coverage` null, `duplicate_tool_names` null, `destructive_tools_without_gate` null, `destructive_gate_coverage` null, `tools_without_negative_test` null, `negative_test_coverage` null, `computed_status` null | PASS |
| 4 | malformed — `tool_design` supplied as a string where an object is required | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"tool_design","detail":"tool_design must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `mcp_server_design_and_review`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 41 checks and a text stamp):

```json
{"service": "mcp-server-design-and-review", "atom_version": "0.1.0", "server": "test-server", "verdict": "MCP_SERVER_SOUND", "sections": {"tool_design_and_budget": "pass", "transports_and_auth": "pass", "safety_rails_and_injection_awareness": "pass", "versioning_contract_tests_and_observability": "pass", "red_lines": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "tools_count": 1, "tools_without_typed_schema": [], "typed_schema_coverage": "1.000000", "tools_not_single_job": [], "single_job_coverage": "1.000000", "tools_with_invalid_operation": [], "valid_operation_coverage": "1.000000", "duplicate_tool_names": [], "destructive_tools_without_gate": [], "destructive_gate_coverage": null, "tools_without_negative_test": [], "negative_test_coverage": "1.000000", "summary": "41 pass, 0 fail, 0 missing of 41 checks across five sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"tool_design","detail":"tool_design must be an object"}
```

## Findings

No findings. Gemini judge verdict: **PASS**, findings: [], tester_errors: [] (judgment: verification/work/mcp-server-design-and-review/judgment.json). The judge's computed checks all matched: full-pass `tools_count` 1 and `typed_schema_coverage` `"1.000000"`; violations `tools_count` 2 and `typed_schema_coverage` `"0.500000"`.

## Tester errors

5 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 5 rejections in total — by rule: R1 ×2, R2 ×2, R3 ×1. The corrected, executed battery passed the validator (`ok: true`, register size 41) before execution. Zero executed-case tester errors.

1. (R1 ×2) The raw design's `failing_checks` named section names instead of the register's exact check names — 2 validator rejections. Corrected before execution to the exact register check names the planted values fail.
2. (R2 ×2) The raw design's spot checks were prose-only, with no structured `computed_spot_checks`. Corrected before execution by structured injection from the oracle: the full-pass block (`tools_count` `1`, `typed_schema_coverage` `"1.000000"`, `single_job_coverage` `"1.000000"`, `valid_operation_coverage` `"1.000000"`, `destructive_gate_coverage` `null`, `negative_test_coverage` `"1.000000"`, all row-name lists `[]`, `computed_status` `within_stated_limits_on_declared_evidence`) and the violations block (`tools_count` `2`, `tools_without_typed_schema` `["get_user"]`, `typed_schema_coverage` `"0.500000"`, `tools_with_invalid_operation` `["get_user"]`, `valid_operation_coverage` `"0.500000"`, `duplicate_tool_names` `["get_user"]`, `tools_without_negative_test` `["get_user"]`, `negative_test_coverage` `"0.500000"`, `single_job_coverage` `"1.000000"`, `computed_status` `outside_stated_limits_on_declared_evidence`).
3. (R3 ×1) The raw violations input was sparse instead of a full manifest, so it read as missing evidence rather than failure. Corrected before execution: rebuilt as the full manifest plus the planted violations — `tool_design.god_tools_present` set true, `tools[0].operation` set to `"execute"`, `tools[0].has_typed_schema` set false. Because Gemini designed only ONE tool, the correction also appended a copy of the designed tool (valid operation/schema) carrying the same name `get_user` and `has_negative_test` false — producing the duplicate-name and negative-test failures. The resulting failing set is exactly the 5 checks named in the Cases table.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the seven primary computed checks, the declared counts, the row-name lists, the coverage ratios under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/mcp-server-design-and-review/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `tools_count` | 1 | 1 | ✓ |
| full-pass `typed_schema_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `single_job_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `valid_operation_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `destructive_gate_coverage` (no destructive rows) | null | null | ✓ |
| full-pass `negative_test_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass row-name lists | [] / [] / [] / [] / [] / [] | [] / [] / [] / [] / [] / [] | ✓ |
| full-pass `computed_status` (all seven computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `tools_count` | 2 | 2 | ✓ |
| violations `typed_schema_coverage` (1 ÷ 2) | "0.500000" | "0.500000" | ✓ |
| violations `valid_operation_coverage` (1 ÷ 2) | "0.500000" | "0.500000" | ✓ |
| violations `negative_test_coverage` (1 ÷ 2) | "0.500000" | "0.500000" | ✓ |
| violations `single_job_coverage` (2 ÷ 2) | "1.000000" | "1.000000" | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 5 planted checks | same 5 | ✓ |
| verdicts | MCP_SERVER_SOUND / MCP_SERVER_NOT_SOUND (5 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 5-check failure set on the violations case. The coordinating tester's own mechanical re-verification of the raw evidence matches on every point (per-case HTTP status, verdicts, failing-check set, sparse outcome, malformed 422 field, determinism and parity).

## Documentation link (designed absence — recorded, never scored)

Checked 2026-11-16 with curl using a browser user-agent (the sandbox Python-urllib default UA is banned by our Cloudflare zones, error 1010): `GET https://atoms.pipavia.com/docs/mcp-server-design-and-review` returned **404**, and `GET https://atoms.pipavia.com/api.json` listed **107** atoms in total, of which **93** entries carry a `documentation` key; this atom's entry carries **no** `documentation` key. This absence is by design — Batch 16's WS1 documentation pass follows this wave — and is never scored against the atom.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `tool_design`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
