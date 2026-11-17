# Test report — quant-math-derivation-sanity-check

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-16
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment b71b0351b5994d9da5dc7bebffcd3189
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/quant-math-derivation-sanity-check/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (derivation `Simple Velocity Calculation`): goal quantity stated, givens defined before use and shown step by step all true, final result value `50.0` / unit `m/s^2*s`, one step `s1` (`multiply`, operand_a `10.0`, operand_b `5.0`, declared result `50.0`, units `m/s^2` / `s` / `m/s^2*s`), all three dimensions flags true, all six assumptions flags true, all four method flags true, all five red-line flags false | HTTP 200, verdict `DERIVATION_SOUND`, `derivation_steps_count` `1`, `duplicate_derivation_step_ids` `[]`, `derivation_steps_with_arithmetic_mismatch` `[]`, `derivation_steps_with_unit_mismatch` `[]`, `derivation_steps_missing_units` `[]`, `arithmetic_match_ratio` `"1.000000"`, `unit_match_ratio` `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `DERIVATION_SOUND`, 30 pass / 0 fail / 0 missing, all six sections `pass`, exactly those computed values (all row-name lists `[]`) | PASS |
| 2 | violations — full manifest identical to full-pass except `steps[0].declared_result` `999.0` (recomputed `10.0` × `5.0` = `50.0`, and the declared final result value `50.0` no longer equals the last step's declared result) | HTTP 200, verdict `DERIVATION_NOT_SOUND`, the 2 named checks fail | HTTP 200, `DERIVATION_NOT_SOUND`, 28 pass / 2 fail / 0 missing; failing checks exactly `derivation_final_result_value_matches_last_step` and `every_derivation_step_arithmetic_recomputes`; `derivation_steps_count` `1`, `duplicate_derivation_step_ids` `[]`, `derivation_steps_with_arithmetic_mismatch` `["s1"]`, `derivation_steps_with_unit_mismatch` `[]`, `derivation_steps_missing_units` `[]`, `arithmetic_match_ratio` `"0.000000"`, `unit_match_ratio` `"1.000000"`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `derivation_structure` and `step_arithmetic` `fail`, other four sections `pass` | PASS |
| 3 | sparse — only `derivation_title` (`Incomplete Record`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 30 missing, all six sections `insufficient_evidence`, `derivation_steps_count` null, `duplicate_derivation_step_ids` null, `derivation_steps_with_arithmetic_mismatch` null, `derivation_steps_with_unit_mismatch` null, `derivation_steps_missing_units` null, `arithmetic_match_ratio` null, `unit_match_ratio` null, `computed_status` null | PASS |
| 4 | malformed — `steps: "this should be a list"` (string where a list is required), in an otherwise complete copy of the full-pass manifest | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"steps","detail":"steps must be a list"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `quant_math_derivation_sanity_check`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 30 checks and a text stamp):

```json
{"service":"quant-math-derivation-sanity-check","atom_version":"0.1.0","derivation_title":"Simple Velocity Calculation","verdict":"DERIVATION_SOUND","sections":{"derivation_structure":"pass","step_arithmetic":"pass","dimensions_and_units":"pass","assumptions_and_failure_modes":"pass","method_choice_and_verification":"pass","red_lines":"pass"},"computed_status":"within_stated_limits_on_declared_evidence","derivation_steps_count":1,"duplicate_derivation_step_ids":[],"derivation_steps_with_arithmetic_mismatch":[],"derivation_steps_with_unit_mismatch":[],"derivation_steps_missing_units":[],"arithmetic_match_ratio":"1.000000","unit_match_ratio":"1.000000","summary":"30 pass, 0 fail, 0 missing of 30 checks across six sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"steps","detail":"steps must be a list"}
```

## Findings

No findings.

## Tester errors

5 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 4 rejections in total — by rule: R1 check-register ×2, R2 structured-spot-checks ×2, R3 violations-full-manifest ×0, R4 malformed-exactly-one ×0 — and 1 further correction was a genuine-validity fix against the Python oracle. The corrected, executed battery passed the validator (`ok: true`) before execution.

1. (R1) Violations designed `failing_checks` named the prose label `Step arithmetic recomputes` instead of an exact check name — validator rejection: "failing_checks names 'Step arithmetic recomputes', which is not in the atom's check register (30 checks)". Corrected before execution: the violations case was rebuilt as a deep copy of the final full-pass manifest carrying exactly the planted change — `steps[0].declared_result` = `999.0` — with `failing_checks` set to exactly the oracle's failing set on the mutated input, in oracle order, which includes the exact check name `every_derivation_step_arithmetic_recomputes`.
2. (R1) Violations designed `failing_checks` also named the prose label `Final result value matches the last step` — validator rejection: "failing_checks names 'Final result value matches the last step', which is not in the atom's check register (30 checks)". Corrected by the same rebuild: the oracle's failing set on the mutated input also includes the exact check name `derivation_final_result_value_matches_last_step` (declared final result value `50.0` vs the last step's declared result `999.0`), and `expect.failing_checks` was set to exactly that 2-check oracle failing set.
3. (R2) Full-pass `expect` carried no structured `computed_spot_checks` (the computed quantities appeared only in prose notes). Corrected before execution: structured spot checks were injected in structured form, taken from the Python oracle output on the exact final full-pass input (`computed_status` `within_stated_limits_on_declared_evidence`, `derivation_steps_count` `1`, `duplicate_derivation_step_ids` `[]`, `derivation_steps_with_arithmetic_mismatch` `[]`, `derivation_steps_with_unit_mismatch` `[]`, `derivation_steps_missing_units` `[]`, `arithmetic_match_ratio` `"1.000000"`, `unit_match_ratio` `"1.000000"`).
4. (R2) Violations `expect` carried no structured `computed_spot_checks`. Corrected before execution: structured spot checks were injected in structured form, taken from the Python oracle output on the exact mutated violations input (`computed_status` `outside_stated_limits_on_declared_evidence`, `derivation_steps_count` `1`, `duplicate_derivation_step_ids` `[]`, `derivation_steps_with_arithmetic_mismatch` `["s1"]`, `derivation_steps_with_unit_mismatch` `[]`, `derivation_steps_missing_units` `[]`, `arithmetic_match_ratio` `"0.000000"`, `unit_match_ratio` `"1.000000"`).
5. (validity) The raw full-pass input was not genuinely valid: the Python oracle returned `DERIVATION_NOT_SOUND` on it (29 pass / 1 fail / 0 missing; failing check `every_derivation_step_result_unit_follows_unit_algebra`, `derivation_steps_with_unit_mismatch` `["s1"]`, `unit_match_ratio` `"0.000000"`) — the step declared a `multiply` of operand units `m/s^2` and `s` with declared result unit `m/s`, but SERVICE.md's unit algebra for `multiply` produces the literal unit `<a_unit>*<b_unit>` = `m/s^2*s` (only the dimensionless unit `1` drops out; no physical simplification is defined). Repaired minimally per SERVICE.md: `steps[0].declared_result_unit` changed to `m/s^2*s` and `derivation.final_result_unit` changed to `m/s^2*s` (so the final-result-unit check still passes), no other full-pass value changed. Confirmed by re-running the oracle on the repaired input: `DERIVATION_SOUND`, all 30 checks pass, `unit_match_ratio` `"1.000000"`, `derivation_steps_with_unit_mismatch` `[]`.

The sparse case was verified against the oracle as an identity-only manifest (`derivation_title` only: `INSUFFICIENT_EVIDENCE`, 0 failing checks). The malformed case in the executed battery is a deep copy of the final full-pass manifest with exactly one documented type violation (`steps` as a string where a list is required), verified with `validate_cases.type_violations` to carry exactly one violation.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the step arithmetic `10.0 × 5.0`, the unit algebra for the `multiply` step, the final-result value and unit matches against the last step, both match ratios, the step count and mismatch lists, and the derived `computed_status`, under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/quant-math-derivation-sanity-check/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass step `s1` arithmetic (10.0 × 5.0) | 50.000000 = declared 50.000000, recomputes | pass, no mismatch | ✓ |
| full-pass step `s1` unit algebra (`multiply`: `m/s^2` * `s`) | `m/s^2*s` | `m/s^2*s` | ✓ |
| full-pass final result value / unit vs last step | 50.000000 / `m/s^2*s`, both match | both pass | ✓ |
| full-pass `derivation_steps_count` | 1 | 1 | ✓ |
| full-pass `duplicate_derivation_step_ids` / `derivation_steps_with_arithmetic_mismatch` / `derivation_steps_with_unit_mismatch` / `derivation_steps_missing_units` | [] / [] / [] / [] | [] / [] / [] / [] | ✓ |
| full-pass `arithmetic_match_ratio` (1 ÷ 1) / `unit_match_ratio` (1 ÷ 1) | "1.000000" / "1.000000" | "1.000000" / "1.000000" | ✓ |
| full-pass `computed_status` (all nine computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations step `s1` arithmetic (declared 999.0 vs 10.0 × 5.0) | 999.000000 ≠ 50.000000, mismatch `["s1"]` | fail, `["s1"]` | ✓ |
| violations final result value vs last step (50.0 vs 999.0) | 50.000000 ≠ 999.000000, fails | fail | ✓ |
| violations step `s1` unit algebra (unchanged) | `m/s^2*s` = declared | pass | ✓ |
| violations `arithmetic_match_ratio` (0 ÷ 1) / `unit_match_ratio` (1 ÷ 1) | "0.000000" / "1.000000" | "0.000000" / "1.000000" | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly `every_derivation_step_arithmetic_recomputes` and `derivation_final_result_value_matches_last_step` | same 2 | ✓ |
| verdicts | DERIVATION_SOUND / DERIVATION_NOT_SOUND (2 fail) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 2-check failure set on the violations case.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `steps`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
