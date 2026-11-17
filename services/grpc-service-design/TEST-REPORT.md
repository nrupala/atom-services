# Test report — grpc-service-design

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 38371decd3a447a1b2c82ff4ac4e8e42
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/grpc-service-design/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (project `test-service`): all contract/api-shape/server/security/observability/testing/interop declarations true, the two must-be-false contract flags false, proto fields `id` (1) and `name` (2) in message `User`, method `GetUser` unary with deadline set, reflection disabled, no cross-host traffic, no public surfaces, no REST consumers, no browser clients | HTTP 200, verdict `GRPC_SERVICE_SOUND`, `methods_count` `1`, `proto_fields_count` `2`, `deadline_coverage` `"1.000000"`, `streaming_boundedness_coverage` `null`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `GRPC_SERVICE_SOUND`, 39 pass / 0 fail / 0 missing, all five sections `pass`, exactly those computed values (all four row-name lists `[]`) | PASS |
| 2 | violations — full manifest identical to full-pass except `hand_generated_stubs_present` true, `field_number_reuse_present` true, proto field `name` renumbered to 1 (duplicate with `id` in message `User`), and method `GetUser` changed to `streaming_mode` `server` with `deadline_set` false and `stream_bounded` false | HTTP 200, verdict `GRPC_SERVICE_NOT_SOUND`, the 5 named checks fail | HTTP 200, `GRPC_SERVICE_NOT_SOUND`, 34 pass / 5 fail / 0 missing; failing checks exactly `no_hand_generated_stubs`, `no_field_number_reuse`, `no_duplicate_field_number_within_message`, `every_method_has_deadline`, `every_streaming_method_bounded`; `methods_without_deadline` `["GetUser"]`, `unbounded_streaming_methods` `["GetUser"]`, `fields_sharing_a_duplicate_number` `["id", "name"]`, `deadline_coverage` `"0.000000"`, `streaming_boundedness_coverage` `"0.000000"`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `contract_and_compatibility` and `api_shape_and_deadlines` `fail`, the other three `pass` | PASS |
| 3 | sparse — only `project` (`incomplete-service`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 39 missing, all five sections `insufficient_evidence`, `methods_count` null, `proto_fields_count` null, all four row-name lists null, `deadline_coverage` null, `streaming_boundedness_coverage` null, `computed_status` null | PASS |
| 4 | malformed — `contract: "not-an-object"` (string where an object is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"contract","detail":"contract must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `grpc_service_design`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 39 checks and a text stamp):

```json
{"service": "grpc-service-design", "atom_version": "0.1.0", "project": "test-service", "verdict": "GRPC_SERVICE_SOUND", "sections": {"contract_and_compatibility": "pass", "api_shape_and_deadlines": "pass", "server_hygiene": "pass", "security_and_transport": "pass", "observability_testing_and_interop": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "methods_count": 1, "proto_fields_count": 2, "methods_without_streaming_mode": [], "methods_without_deadline": [], "unbounded_streaming_methods": [], "fields_sharing_a_duplicate_number": [], "deadline_coverage": "1.000000", "streaming_boundedness_coverage": null, "summary": "39 pass, 0 fail, 0 missing of 39 checks across five sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"contract","detail":"contract must be an object"}
```

## Findings

No findings.

## Tester errors

4 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 5 rejections in total — by rule: R1 check-register ×2, R2 structured-spot-checks ×2, R3 violations-full-manifest ×1, R4 malformed-exactly-one ×0. The corrected, executed battery passed the validator (`ok: true`) before execution.

1. (R1) Violations designed `failing_checks` listed the section names `contract_and_compatibility` and `api_shape_and_deadlines` instead of exact check names — 2 validator rejections. Corrected before execution to the 5 exact check names the planted values fail: `no_hand_generated_stubs`, `no_field_number_reuse`, `no_duplicate_field_number_within_message`, `every_method_has_deadline`, `every_streaming_method_bounded`.
2. (R2) Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`methods_count` `1`, `proto_fields_count` `2`, `methods_without_streaming_mode` `[]`, `methods_without_deadline` `[]`, `unbounded_streaming_methods` `[]`, `fields_sharing_a_duplicate_number` `[]`, `deadline_coverage` `"1.000000"`, `streaming_boundedness_coverage` `null`, `computed_status` `within_stated_limits_on_declared_evidence`).
3. (R2) Violations `expect` carried no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`methods_count` `1`, `proto_fields_count` `2`, `methods_without_streaming_mode` `[]`, `methods_without_deadline` `["GetUser"]`, `unbounded_streaming_methods` `["GetUser"]`, `fields_sharing_a_duplicate_number` `["id", "name"]`, `deadline_coverage` `"0.000000"`, `streaming_boundedness_coverage` `"0.000000"`, `computed_status` `outside_stated_limits_on_declared_evidence`).
4. (R3) Violations input was sparse instead of a full manifest — it carried only `project`, a partial `contract`, `proto_fields` and `methods`, and omitted the full-pass manifest's `api_shape`, `server`, `security`, `observability`, `testing` and `interop` key paths (and most `contract` keys). Corrected before execution: rebuilt it as a full copy of the full-pass manifest carrying exactly the 5 planted violations (`hand_generated_stubs_present` true, `field_number_reuse_present` true, proto field `name` renumbered to 1 duplicating `id` in message `User`, and method `GetUser` as `server` streaming with `deadline_set` false and `stream_bounded` false) and nothing else changed.

The full-pass input was verified genuinely valid per SERVICE.md before execution (every required field present, correct types and nesting, gated checks passing as not applicable on the declared-false gates — reflection, cross-host traffic, public surfaces, REST consumers and browser clients — no correction needed), the sparse case was verified genuinely sparse (only `project` — no correction needed), and the malformed case needed no correction (exactly one type violation of a documented typed field — `contract` as a string where an object is required).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the six primary computed checks, the declared counts, the row-name lists, the coverage ratios under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/grpc-service-design/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `methods_count` | 1 | 1 | ✓ |
| full-pass `proto_fields_count` | 2 | 2 | ✓ |
| full-pass `deadline_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `streaming_boundedness_coverage` (no streaming methods) | null | null | ✓ |
| full-pass `methods_without_deadline` / `unbounded_streaming_methods` / `fields_sharing_a_duplicate_number` | [] / [] / [] | [] / [] / [] | ✓ |
| full-pass `computed_status` (all six computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `methods_without_deadline` (`GetUser`, deadline false) | ["GetUser"] | ["GetUser"] | ✓ |
| violations `unbounded_streaming_methods` (`GetUser`, server streaming, bounded false) | ["GetUser"] | ["GetUser"] | ✓ |
| violations `fields_sharing_a_duplicate_number` (number 1 shared in `User`) | ["id", "name"] | ["id", "name"] | ✓ |
| violations `deadline_coverage` (0 ÷ 1) | "0.000000" | "0.000000" | ✓ |
| violations `streaming_boundedness_coverage` (0 ÷ 1) | "0.000000" | "0.000000" | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 5 planted checks | same 5 | ✓ |
| verdicts | GRPC_SERVICE_SOUND / GRPC_SERVICE_NOT_SOUND (5 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 5-check failure set on the violations case. The coordinating tester's own mechanical re-verification of the raw evidence matches on every point (per-case HTTP status, verdicts, failing-check set, sparse outcome, malformed 422 field, determinism and parity); where the Gemini judge's computed-check list covered only four quantities, the full spot-check set was verified mechanically from the evidence and by DeepSeek, so no contradiction arises — the evidence stands as recorded.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `contract`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
