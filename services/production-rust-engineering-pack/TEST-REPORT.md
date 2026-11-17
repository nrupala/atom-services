# Test report — production-rust-engineering-pack

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-16
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 9595ea665b634289aad158b7fff277ac
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/production-rust-engineering-pack/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (project `test-project`): all ownership, error, unsafe-policy, async, testing, tooling, workspace and supply-chain declarations true, one unsafe block `src/lib.rs:42` with invariant documented and covering tests true, all three red-line flags false | HTTP 200, verdict `PRODUCTION_RUST_ENGINEERING_PACK_READY`, `unsafe_blocks_count` `1`, `documented_coverage` `"1.000000"`, `tested_coverage` `"1.000000"`, `unsafe_blocks_without_invariant` `[]`, `unsafe_blocks_without_tests` `[]`, `duplicate_unsafe_block_locations` `[]`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `PRODUCTION_RUST_ENGINEERING_PACK_READY`, 37 pass / 0 fail / 0 missing, all seven sections `pass`, exactly those computed values | PASS |
| 2 | violations — full manifest identical to full-pass except `ownership.borrow_before_cloning_practised` false, `unsafe_blocks[0].invariant_documented` false, and `red_lines.blocking_work_inside_async_present` true | HTTP 200, verdict `PRODUCTION_RUST_ENGINEERING_PACK_NOT_READY`, the 3 named checks fail | HTTP 200, `PRODUCTION_RUST_ENGINEERING_PACK_NOT_READY`, 34 pass / 3 fail / 0 missing; failing checks exactly `borrow_before_cloning_practised`, `every_unsafe_block_documents_its_invariant`, `no_blocking_work_inside_async`; `unsafe_blocks_count` `1`, `unsafe_blocks_without_invariant` `["src/lib.rs:42"]`, `unsafe_blocks_without_tests` `[]`, `documented_coverage` `"0.000000"`, `tested_coverage` `"1.000000"`, `duplicate_unsafe_block_locations` `[]`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `ownership_and_lifetimes`, `unsafe_discipline` and `red_lines` `fail`, the other four `pass` | PASS |
| 3 | sparse — only `project` (`sparse-project`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 37 missing, all seven sections `insufficient_evidence`, `unsafe_blocks_count` null, `unsafe_blocks_without_invariant` null, `unsafe_blocks_without_tests` null, `documented_coverage` null, `tested_coverage` null, `duplicate_unsafe_block_locations` null, `computed_status` null | PASS |
| 4 | malformed — `ownership.borrow_before_cloning_practised: "not-a-boolean"` (string where a boolean is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"ownership.borrow_before_cloning_practised","detail":"ownership.borrow_before_cloning_practised must be a boolean"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `production_rust_engineering_pack`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 37 checks and a text stamp):

```json
{"service": "production-rust-engineering-pack", "atom_version": "0.1.0", "project": "test-project", "verdict": "PRODUCTION_RUST_ENGINEERING_PACK_READY", "sections": {"ownership_and_lifetimes": "pass", "error_handling": "pass", "unsafe_discipline": "pass", "async_discipline": "pass", "testing_and_benchmarks": "pass", "tooling_workspace_and_supply_chain": "pass", "red_lines": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "unsafe_blocks_count": 1, "unsafe_blocks_without_invariant": [], "unsafe_blocks_without_tests": [], "documented_coverage": "1.000000", "tested_coverage": "1.000000", "duplicate_unsafe_block_locations": [], "summary": "37 pass, 0 fail, 0 missing of 37 checks across seven sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"ownership.borrow_before_cloning_practised","detail":"ownership.borrow_before_cloning_practised must be a boolean"}
```

## Findings

No findings.

## Tester errors

9 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 6 rejections in total — by rule: R1 check-register ×3, R2 structured-spot-checks ×2, R3 violations-full-manifest ×1, R4 malformed-exactly-one ×0. A further 3 tester errors were found by the pre-flight Python-oracle run and the sparse-case rule. The corrected, executed battery passed the validator (`ok: true`) before execution.

1. (R1) Violations designed `failing_checks` named the section name `ownership_and_lifetimes` instead of an exact check name — validator rejection: "failing_checks names 'ownership_and_lifetimes', which is not in the atom's check register (37 checks)". Corrected before execution as part of rebuilding the violations case (see below).
2. (R1) Violations designed `failing_checks` named the section name `unsafe_discipline` instead of an exact check name — validator rejection: "failing_checks names 'unsafe_discipline', which is not in the atom's check register (37 checks)". Corrected before execution as part of rebuilding the violations case (see below).
3. (R1) Violations designed `failing_checks` named the section name `red_lines` instead of an exact check name — validator rejection: "failing_checks names 'red_lines', which is not in the atom's check register (37 checks)". Corrected before execution: the violations case was rebuilt as a full copy of the corrected full-pass manifest carrying exactly the planted changes — `ownership.borrow_before_cloning_practised` = false, `unsafe_blocks[0].invariant_documented` = false, `red_lines.blocking_work_inside_async_present` = true — with `failing_checks` set to exactly the 3 exact check names those changes fail: `borrow_before_cloning_practised`, `every_unsafe_block_documents_its_invariant`, `no_blocking_work_inside_async`.
4. (R2) Full-pass `expect` carried no structured `computed_spot_checks` (the computed quantities appeared only in prose notes). Corrected before execution: structured spot checks were injected in structured form, computed per SERVICE.md and confirmed against the Python oracle (`computed_status` `within_stated_limits_on_declared_evidence`, `unsafe_blocks_count` `1`, `unsafe_blocks_without_invariant` `[]`, `unsafe_blocks_without_tests` `[]`, `documented_coverage` `"1.000000"`, `tested_coverage` `"1.000000"`, `duplicate_unsafe_block_locations` `[]`).
5. (R2) Violations `expect` carried no structured `computed_spot_checks`. Corrected before execution: structured spot checks were injected in structured form, computed per SERVICE.md and confirmed against the Python oracle (`computed_status` `outside_stated_limits_on_declared_evidence`, `unsafe_blocks_count` `1`, `unsafe_blocks_without_invariant` `["src/lib.rs:42"]`, `unsafe_blocks_without_tests` `[]`, `documented_coverage` `"0.000000"`, `tested_coverage` `"1.000000"`, `duplicate_unsafe_block_locations` `[]`).
6. (R3) Violations input was missing key paths present in Gemini's full-pass manifest — validator rejection: "violations input is missing key paths present in the full-pass manifest (a sparse violations input reads as missing evidence, not as failure): async_runtime, async_runtime.blocking_calls_absent_from_async_code, async_runtime.bounded_channels_used, async_runtime.structured_tasks_with_tokio_used, async_runtime.timeouts_applied_everywhere, errors, errors.anyhow_used_for_binary_errors, errors.error_enums_used_for_fallible_apis, errors.no_unwrap_or_expect_in_production_paths, errors.question_mark_propagation_used, errors.thiserror_used_for_library_errors, errors.unwrap_expect_exceptions_limited_to_tests_and_startup_with_messages, supply_chain, supply_chain.cargo_audit_run, supply_chain.msrv_pinned, supply_chain.new_crates_reviewed_before_adoption, testing, testing.criterion_benchmarks_present, testing.doc_tests_for_examples_present, testing.error_paths_tested, testing.integration_tests_in_tests_directory_present, testing.tests_green_including_failure_paths, testing.unit_tests_beside_code_present, tooling, tooling.cargo_fmt_check_clean, tooling.clippy_clean_with_deny_warnings, tooling.crates_split_only_at_real_boundaries, tooling.feature_flags_kept_minimal_no_default_bloat, tooling.lints_fixed_not_silenced_without_reason". Corrected before execution by the same rebuild: the violations input is a deep copy of the corrected full-pass manifest, so every key path is present and planted mutations change values only.
7. (full-pass oracle) Gemini's full-pass input nested `unsafe_blocks` under `unsafe_policy` instead of the documented top-level `unsafe_blocks` list — the Python oracle on Gemini's input returned `INSUFFICIENT_EVIDENCE` (31 pass / 0 fail / 6 missing in total), with `unsafe_blocks_declared`, `every_unsafe_block_documents_its_invariant`, `every_unsafe_block_has_covering_tests` and `no_unsafe_block_location_duplicated` missing. Corrected before execution: `unsafe_blocks` was moved to the top level of the full-pass manifest (and of the violations deep copy); the oracle then returns all 37 checks pass on the full-pass input.
8. (full-pass oracle) Gemini's full-pass input placed `crates_split_only_at_real_boundaries` and `feature_flags_kept_minimal_no_default_bloat` under `tooling` instead of the documented `workspace` object — the oracle returned those two checks missing. Corrected before execution: both fields were moved to a top-level `workspace` object in the full-pass manifest (and the violations deep copy).
9. (sparse) Gemini's sparse input carried an extra `ownership.borrow_before_cloning_practised: true` field, so it was not the identity-only manifest required — the oracle returned 1 pass / 36 missing instead of 0 pass / 37 missing. Corrected before execution: the sparse input was reduced to `{"project": "sparse-project"}` only.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the four primary computed checks, the declared count, the row-name lists, the coverage ratios under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/production-rust-engineering-pack/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `unsafe_blocks_count` | 1 | 1 | ✓ |
| full-pass `documented_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `tested_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `unsafe_blocks_without_invariant` / `unsafe_blocks_without_tests` / `duplicate_unsafe_block_locations` | [] / [] / [] | [] / [] / [] | ✓ |
| full-pass `computed_status` (all four computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `unsafe_blocks_count` | 1 | 1 | ✓ |
| violations `unsafe_blocks_without_invariant` (invariant false) | ["src/lib.rs:42"] | ["src/lib.rs:42"] | ✓ |
| violations `unsafe_blocks_without_tests` / `duplicate_unsafe_block_locations` | [] / [] | [] / [] | ✓ |
| violations `documented_coverage` (0 ÷ 1) | "0.000000" | "0.000000" | ✓ |
| violations `tested_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 3 planted checks | same 3 | ✓ |
| verdicts | PRODUCTION_RUST_ENGINEERING_PACK_READY / PRODUCTION_RUST_ENGINEERING_PACK_NOT_READY (3 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 3-check failure set on the violations case.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `ownership.borrow_before_cloning_practised`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
