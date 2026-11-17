# Test report — knowledge-graph-design

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment fe07be725c5a4817ad7b7e341310a97b
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/knowledge-graph-design/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (graph `customer-360-graph`): all schema/provenance/history/storage/query/portability/privacy declarations in passing polarity, `core_type_count` `15`, dedicated graph DB used with justification carried, one assertion `row_1` with source/date/confidence declared and origin classified, silent edits / full graph dumps / third-party personal data without lawful basis / unprovenanced assertions presented as fact all false | HTTP 200, verdict `KNOWLEDGE_GRAPH_DESIGN_SOUND`, `declared_core_type_count` `15`, `assertions_count` `1`, `provenance_coverage` `"1.000000"`, `origin_classification_coverage` `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `KNOWLEDGE_GRAPH_DESIGN_SOUND`, 31 pass / 0 fail / 0 missing, all six sections `pass`, exactly those computed values (both row-name lists `[]`) | PASS |
| 2 | violations — full manifest identical to full-pass except `schema.core_type_count` `5`, assertion `row_1` with `source_declared` false, `history.silent_edits_present` true, and `query.full_graph_dumps_present` true | HTTP 200, verdict `KNOWLEDGE_GRAPH_DESIGN_NOT_SOUND`, the 4 named checks fail | HTTP 200, `KNOWLEDGE_GRAPH_DESIGN_NOT_SOUND`, 27 pass / 4 fail / 0 missing; failing checks exactly `core_type_count_within_stated_start_range`, `every_assertion_carries_full_provenance`, `no_silent_edits`, `no_full_graph_dumps`; `assertions_without_full_provenance` `["row_1"]`, `provenance_coverage` `"0.000000"`, `origin_classification_coverage` `"1.000000"`, `declared_core_type_count` `5`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `schema_and_modeling`, `provenance`, `immutable_history`, `storage_and_query_retrieval` `fail`, the other two `pass` | PASS |
| 3 | sparse — only `graph` (`incomplete-graph`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 31 missing, all six sections `insufficient_evidence`, `assertions_count` null, `assertions_without_full_provenance` null, `provenance_coverage` null, `assertions_without_origin_classification` null, `origin_classification_coverage` null, `declared_core_type_count` null, `computed_status` null | PASS |
| 4 | malformed — `schema.core_type_count: "not-a-number"` (string where a number is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"schema.core_type_count","detail":"schema.core_type_count must be a number"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `knowledge_graph_design`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 31 checks and a text stamp):

```json
{"service": "knowledge-graph-design", "atom_version": "0.1.0", "graph": "customer-360-graph", "verdict": "KNOWLEDGE_GRAPH_DESIGN_SOUND", "sections": {"schema_and_modeling": "pass", "provenance": "pass", "immutable_history": "pass", "storage_and_query_retrieval": "pass", "portability_and_ownership": "pass", "privacy_and_red_lines": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "assertions_count": 1, "assertions_without_full_provenance": [], "provenance_coverage": "1.000000", "assertions_without_origin_classification": [], "origin_classification_coverage": "1.000000", "declared_core_type_count": 15, "summary": "31 pass, 0 fail, 0 missing of 31 checks across six sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"schema.core_type_count","detail":"schema.core_type_count must be a number"}
```

## Findings

No findings.

## Tester errors

5 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 7 rejections in total — by rule: R1 check-register ×4, R2 structured-spot-checks ×2, R3 violations-full-manifest ×1, R4 malformed-exactly-one ×0. One further error (item 5) was caught by the oracle pre-flight, not by the validator. The corrected, executed battery passed the validator (`ok: true`) before execution.

1. (R1) Violations designed `failing_checks` listed the 4 section names `schema_and_modeling`, `provenance`, `immutable_history`, `storage_and_query_retrieval` instead of exact check names — 4 validator rejections. Corrected before execution to the 4 exact check names the planted values fail: `core_type_count_within_stated_start_range`, `every_assertion_carries_full_provenance`, `no_silent_edits`, `no_full_graph_dumps`.
2. (R2) Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`declared_core_type_count` `15`, `assertions_count` `1`, `assertions_without_full_provenance` `[]`, `provenance_coverage` `"1.000000"`, `assertions_without_origin_classification` `[]`, `origin_classification_coverage` `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence`), each value computed by hand from the input per SERVICE.md.
3. (R2) Violations `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`declared_core_type_count` `5`, `assertions_count` `1`, `assertions_without_full_provenance` `["row_1"]`, `provenance_coverage` `"0.000000"`, `assertions_without_origin_classification` `[]`, `origin_classification_coverage` `"1.000000"`, `computed_status` `outside_stated_limits_on_declared_evidence`).
4. (R3) Violations input was not a full manifest — it omitted the full-pass manifest's `storage.graph_db_justified_by_query_complexity_or_scale` key path (and differed structurally elsewhere: a different graph name, a different assertion name `row_bad`, and `dedicated_graph_db_used` declared false). Corrected before execution: rebuilt it as a full copy of the full-pass manifest carrying exactly the 4 planted violations (`schema.core_type_count` `5`, assertion `row_1` with `source_declared` false, `history.silent_edits_present` true, and `query.full_graph_dumps_present` true) and nothing else changed.
5. (Oracle pre-flight; no validator rule) The raw full-pass (and, in its original form, violations) input placed the five query fields — `canonical_query_patterns_defined`, `full_text_and_vector_indexes_paired`, `agent_queries_bounded`, `counts_first_expand_on_request`, `full_graph_dumps_present` — under `storage` instead of in a top-level `query` object, per SERVICE.md and the oracle's MANIFEST_SPEC. The Python oracle on the raw full-pass returned `INSUFFICIENT_EVIDENCE` (26 pass / 0 fail / 5 missing) instead of the designed sound verdict. Corrected before execution: moved those five fields into a top-level `query` object in the full-pass manifest (the violations rebuild in item 4 inherits the corrected structure); the corrected full-pass oracle result is all 31 checks pass.

The sparse case was verified genuinely sparse (only `graph` — no correction needed), and the malformed case needed no correction (exactly one type violation of a documented typed field — `schema.core_type_count` as a string where a number is required).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the four primary computed checks, the declared counts, the row-name lists, the coverage ratios under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/knowledge-graph-design/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `declared_core_type_count` (15 in 10–20) | 15 | 15 | ✓ |
| full-pass `assertions_count` | 1 | 1 | ✓ |
| full-pass `provenance_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `origin_classification_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `assertions_without_full_provenance` / `assertions_without_origin_classification` | [] / [] | [] / [] | ✓ |
| full-pass `computed_status` (all four computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `declared_core_type_count` (5 < 10) | 5 | 5 | ✓ |
| violations `assertions_without_full_provenance` (`row_1` source not declared) | ["row_1"] | ["row_1"] | ✓ |
| violations `provenance_coverage` (0 ÷ 1) / `origin_classification_coverage` (1 ÷ 1) | "0.000000" / "1.000000" | "0.000000" / "1.000000" | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 4 planted checks | same 4 | ✓ |
| verdicts | KNOWLEDGE_GRAPH_DESIGN_SOUND / KNOWLEDGE_GRAPH_DESIGN_NOT_SOUND (4 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 4-check failure set on the violations case. The coordinating tester's own mechanical re-verification of the raw evidence matches on every point (per-case HTTP status, verdicts, failing-check set, sparse outcome, malformed 422 field, determinism and parity); where the Gemini judge's computed-check list covered only four quantities, the full spot-check set was verified mechanically from the evidence and by DeepSeek, so no contradiction arises — the evidence stands as recorded.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `schema.core_type_count`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
