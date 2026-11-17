# Test report — local-voice-stack-engineering-pack

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment fe07be725c5a4817ad7b7e341310a97b
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/local-voice-stack-engineering-pack/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (stack `production-voice-stack-v1`): all pipeline/engine-selection/cloning/audio/latency/accessibility/testing declarations in passing polarity, one engine `engine_a` with license cleared and golden-sentence evaluation declared, declared as a voice-cloning engine with consent recorded, assistant interactive use present with barge-in handling present | HTTP 200, verdict `LOCAL_VOICE_STACK_SOUND`, `engines_count` `1`, `license_coverage` `"1.000000"`, `golden_evaluation_coverage` `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `LOCAL_VOICE_STACK_SOUND`, 30 pass / 0 fail / 0 missing, all five sections `pass`, exactly those computed values (all row-name lists `[]`) | PASS |
| 2 | violations — full manifest identical in structure to full-pass except engine `bad_engine` with `license_cleared_for_commercial_use` false, `evaluated_on_own_golden_sentences` false and `cloning_consent_recorded` false, `cloning.impersonation_present` true, `cloning.covert_recording_present` true, and `latency.interruption_barge_in_handling` false with assistant interactive use present | HTTP 200, verdict `LOCAL_VOICE_STACK_NOT_SOUND`, the 6 named checks fail | HTTP 200, `LOCAL_VOICE_STACK_NOT_SOUND`, 24 pass / 6 fail / 0 missing; failing checks exactly `every_engine_license_cleared_for_commercial_use`, `every_engine_evaluated_on_own_golden_sentences`, `no_impersonation`, `no_covert_recording`, `every_cloning_engine_has_consent_recorded`, `interruption_barge_in_when_assistant_use`; `engines_without_license_clearance` `["bad_engine"]`, `engines_without_golden_sentence_evaluation` `["bad_engine"]`, `cloning_engines_without_consent_recorded` `["bad_engine"]`, `license_coverage` `"0.000000"`, `golden_evaluation_coverage` `"0.000000"`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `pipeline_and_engine_selection`, `cloning_consent_and_ethics` and `audio_engineering_and_latency` `fail`, the other two `pass` | PASS |
| 3 | sparse — only `stack` (`incomplete-stack`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 30 missing, all five sections `insufficient_evidence`, `engines_count` null, `engines_without_license_clearance` null, `license_coverage` null, `engines_without_golden_sentence_evaluation` null, `golden_evaluation_coverage` null, `cloning_engines_without_consent_recorded` null, `computed_status` null | PASS |
| 4 | malformed — `pipeline: "not-an-object"` (string where an object is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"pipeline","detail":"pipeline must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `local_voice_stack_engineering_pack`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 30 checks and a text stamp):

```json
{"service": "local-voice-stack-engineering-pack", "atom_version": "0.1.0", "stack": "production-voice-stack-v1", "verdict": "LOCAL_VOICE_STACK_SOUND", "sections": {"pipeline_and_engine_selection": "pass", "cloning_consent_and_ethics": "pass", "audio_engineering_and_latency": "pass", "accessibility": "pass", "testing_and_quality_gates": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "engines_count": 1, "engines_without_license_clearance": [], "license_coverage": "1.000000", "engines_without_golden_sentence_evaluation": [], "golden_evaluation_coverage": "1.000000", "cloning_engines_without_consent_recorded": [], "summary": "30 pass, 0 fail, 0 missing of 30 checks across five sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"pipeline","detail":"pipeline must be an object"}
```

## Findings

No findings.

## Tester errors

9 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 9 rejections in total — by rule: R1 check-register ×6, R2 structured-spot-checks ×2, R3 violations-full-manifest ×0, R4 malformed-exactly-one ×1. The corrected, executed battery passed the validator (`ok: true`) before execution.

1. (R1) Violations designed `failing_checks` named the input field path `license_cleared_for_commercial_use` instead of an exact check name — 1 validator rejection. Corrected before execution to the exact check name the planted value fails: `every_engine_license_cleared_for_commercial_use`.
2. (R1) Violations designed `failing_checks` named the input field path `evaluated_on_own_golden_sentences` instead of an exact check name — 1 validator rejection. Corrected before execution to `every_engine_evaluated_on_own_golden_sentences`.
3. (R1) Violations designed `failing_checks` named the input field path `cloning_consent_recorded` instead of an exact check name — 1 validator rejection. Corrected before execution to `every_cloning_engine_has_consent_recorded`.
4. (R1) Violations designed `failing_checks` named the input field path `impersonation_present` instead of an exact check name — 1 validator rejection. Corrected before execution to `no_impersonation`.
5. (R1) Violations designed `failing_checks` named the input field path `covert_recording_present` instead of an exact check name — 1 validator rejection. Corrected before execution to `no_covert_recording`.
6. (R1) Violations designed `failing_checks` named the input field path `interruption_barge_in_handling` instead of an exact check name — 1 validator rejection. Corrected before execution to `interruption_barge_in_when_assistant_use`.
7. (R2) Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`engines_count` `1`, `engines_without_license_clearance` `[]`, `license_coverage` `"1.000000"`, `engines_without_golden_sentence_evaluation` `[]`, `golden_evaluation_coverage` `"1.000000"`, `cloning_engines_without_consent_recorded` `[]`, `computed_status` `within_stated_limits_on_declared_evidence`), each value computed by hand from the input per SERVICE.md.
8. (R2) Violations `expect` carried no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`engines_count` `1`, `engines_without_license_clearance` `["bad_engine"]`, `license_coverage` `"0.000000"`, `engines_without_golden_sentence_evaluation` `["bad_engine"]`, `golden_evaluation_coverage` `"0.000000"`, `cloning_engines_without_consent_recorded` `["bad_engine"]`, `computed_status` `outside_stated_limits_on_declared_evidence`).
9. (R4) Malformed input carried 2 type violations (`stack` as the number `12345` where a string is required, and `pipeline` as a string where an object is required), so the expected 422 field was ambiguous — 1 validator rejection. Corrected before execution: reduced it to exactly one type violation — `stack` made a valid string (`"malformed-stack"`) and `pipeline: "not-an-object"` kept as the single violating field.

The full-pass input was verified genuinely valid per SERVICE.md before execution (the Python oracle returns all 30 checks pass on it — no correction needed), the violations input needed no R3 correction (it already carried every key path of the full-pass manifest, values changed only; the oracle confirms it fails exactly the 6 planted checks), and the sparse case was verified genuinely sparse (only `stack` — no correction needed).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the four primary computed checks, the declared counts, the row-name lists, the coverage ratios under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/local-voice-stack-engineering-pack/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `engines_count` | 1 | 1 | ✓ |
| full-pass `license_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `golden_evaluation_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `engines_without_license_clearance` / `engines_without_golden_sentence_evaluation` / `cloning_engines_without_consent_recorded` | [] / [] / [] | [] / [] / [] | ✓ |
| full-pass `computed_status` (all four computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `engines_without_license_clearance` / `engines_without_golden_sentence_evaluation` / `cloning_engines_without_consent_recorded` (`bad_engine` rows present but not true) | ["bad_engine"] / ["bad_engine"] / ["bad_engine"] | ["bad_engine"] / ["bad_engine"] / ["bad_engine"] | ✓ |
| violations `license_coverage` / `golden_evaluation_coverage` (0 ÷ 1 each) | "0.000000" / "0.000000" | "0.000000" / "0.000000" | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 6 planted checks | same 6 | ✓ |
| verdicts | LOCAL_VOICE_STACK_SOUND / LOCAL_VOICE_STACK_NOT_SOUND (6 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 6-check failure set on the violations case. The coordinating tester's own mechanical re-verification of the raw evidence matches on every point (per-case HTTP status, verdicts, failing-check set, sparse outcome, malformed 422 field, determinism and parity); where the Gemini judge's computed-check list covered only three quantities, the full spot-check set was verified mechanically from the evidence and by DeepSeek, so no contradiction arises — the evidence stands as recorded.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `pipeline`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
