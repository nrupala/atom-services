# Test report — framework-adoption-adr

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 38371decd3a447a1b2c82ff4ac4e8e42
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/framework-adoption-adr/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (project `Alpha`, framework `React`): ADR logged with alternatives and exit cost stated, one candidate `React` with all five fit criteria assessed and `selected` true, house-stack conformity true with `is_mid_project_change` false, versions pinned with no unpinned `latest` and `major_upgrade_planned` false, runtime explicitness all true with no deprecated APIs on the hot path, `plugins_present` false with plugins treated as dependencies, deprecations tracked/scheduled with no zombie code paths | HTTP 200, verdict `FRAMEWORK_ADOPTION_SOUND`, `candidates_count` `1`, `selected_count` `1`, `selected_candidate` `"React"`, `fit_assessment_coverage` `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `FRAMEWORK_ADOPTION_SOUND`, 30 pass / 0 fail / 0 missing, all five sections `pass`, exactly those computed values (both row-name lists `[]`; `plugins_count`, `plugins_without_review_or_pin` and `plugin_compliance_coverage` null, as no `plugins.items` list is declared) | PASS |
| 2 | violations — full manifest with the same key paths as full-pass, carrying exactly two planted violations: two candidates (`Vue` and `Angular`, both fully fit-assessed) both declaring `selected` true, and `versions.unpinned_latest_in_production_present` true | HTTP 200, verdict `FRAMEWORK_ADOPTION_NOT_SOUND`, the 2 named checks fail | HTTP 200, `FRAMEWORK_ADOPTION_NOT_SOUND`, 28 pass / 2 fail / 0 missing; failing checks exactly `exactly_one_candidate_selected`, `no_unpinned_latest_in_production`; `candidates_count` `2`, `selected_count` `2`, `selected_candidate` null, `fit_assessment_coverage` `"1.000000"`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `adr_and_fit` and `pinning_and_upgrades` `fail`, the other three `pass` | PASS |
| 3 | sparse — only `project` (`Gamma`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 30 missing, all five sections `insufficient_evidence`, `candidates_count` null, `candidates_without_name` null, `candidates_without_fit_assessment` null, `fit_assessment_coverage` null, `selected_count` null, `selected_candidate` null, `plugins_count` null, `plugins_without_review_or_pin` null, `plugin_compliance_coverage` null, `computed_status` null | PASS |
| 4 | malformed — `adr: "not-an-object"` (string where an object is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"adr","detail":"adr must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `framework_adoption_adr`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 30 checks and a text stamp):

```json
{"service": "framework-adoption-adr", "atom_version": "0.1.0", "project": "Alpha", "framework": "React", "verdict": "FRAMEWORK_ADOPTION_SOUND", "sections": {"adr_and_fit": "pass", "house_stack_and_core": "pass", "pinning_and_upgrades": "pass", "explicitness_and_runtime": "pass", "plugins_and_deprecations": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "candidates_count": 1, "candidates_without_name": [], "candidates_without_fit_assessment": [], "fit_assessment_coverage": "1.000000", "selected_count": 1, "selected_candidate": "React", "plugins_count": null, "plugins_without_review_or_pin": null, "plugin_compliance_coverage": null, "summary": "30 pass, 0 fail, 0 missing of 30 checks across five sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"adr","detail":"adr must be an object"}
```

## Findings

No findings.

## Tester errors

4 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 4 rejections in total — by rule: R1 check-register ×2, R2 structured-spot-checks ×2, R3 violations-full-manifest ×0, R4 malformed-exactly-one ×0. The corrected, executed battery passed the validator (`ok: true`) before execution. One further correction (item 4) was caught by the coordinating tester's own genuine-validity check against the Python oracle, not by the validator.

1. (R1) Violations designed `failing_checks` listed the prose label `Exactly one candidate selected` and the input field path `unpinned_latest_in_production_present` instead of exact check names — 2 validator rejections. Corrected before execution to the 2 exact check names the planted values fail: `exactly_one_candidate_selected`, `no_unpinned_latest_in_production`.
2. (R2) Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`candidates_count` `1`, `candidates_without_name` `[]`, `candidates_without_fit_assessment` `[]`, `fit_assessment_coverage` `"1.000000"`, `selected_count` `1`, `selected_candidate` `"React"`, `plugins_count` null, `plugins_without_review_or_pin` null, `plugin_compliance_coverage` null, `computed_status` `within_stated_limits_on_declared_evidence`).
3. (R2) Violations `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`candidates_count` `2`, `candidates_without_name` `[]`, `candidates_without_fit_assessment` `[]`, `fit_assessment_coverage` `"1.000000"`, `selected_count` `2`, `selected_candidate` null, `plugins_count` null, `plugins_without_review_or_pin` null, `plugin_compliance_coverage` null, `computed_status` `outside_stated_limits_on_declared_evidence`).
4. (Genuine-validity, SERVICE.md) Both the full-pass and violations manifests omitted `plugins.plugins_treated_as_dependencies`, so the oracle evaluated the raw full-pass design as 29 pass / 0 fail / 1 missing (`INSUFFICIENT_EVIDENCE`, not the designed `FRAMEWORK_ADOPTION_SOUND`) and the violations design with the same missing check. Corrected before execution: added `plugins_treated_as_dependencies: true` to both manifests (no other value changed); the oracle then evaluated the corrected full-pass as 30 pass / 0 fail / 0 missing and the corrected violations as exactly the 2 planted fails with 0 missing.

The sparse case was verified genuinely sparse (only `project` — no correction needed), the malformed case needed no correction (exactly one type violation of a documented typed field — `adr` as a string where an object is required), and the violations input needed no R3 correction (it already carried every key path present in the full-pass manifest).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the five primary computed checks, the declared counts, the row-name lists, the coverage ratios under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/framework-adoption-adr/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `candidates_count` | 1 | 1 | ✓ |
| full-pass `selected_count` / `selected_candidate` | 1 / `"React"` | 1 / `"React"` | ✓ |
| full-pass `fit_assessment_coverage` (1 ÷ 1) | `"1.000000"` | `"1.000000"` | ✓ |
| full-pass `candidates_without_name` / `candidates_without_fit_assessment` | [] / [] | [] / [] | ✓ |
| full-pass `plugins_count` / `plugin_compliance_coverage` (no items list declared) | null / null | null / null | ✓ |
| full-pass `computed_status` (all five computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `candidates_count` / `selected_count` / `selected_candidate` | 2 / 2 / null | 2 / 2 / null | ✓ |
| violations `fit_assessment_coverage` (2 ÷ 2) | `"1.000000"` | `"1.000000"` | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 2 planted checks | same 2 | ✓ |
| verdicts | FRAMEWORK_ADOPTION_SOUND / FRAMEWORK_ADOPTION_NOT_SOUND (2 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 2-check failure set on the violations case. The coordinating tester's own mechanical re-verification of the raw evidence matches on every point (per-case HTTP status, verdicts, failing-check set, sparse outcome, malformed 422 field, determinism and parity); where the Gemini judge's computed-check list covered only five quantities, the full spot-check set was verified mechanically from the evidence and by DeepSeek, so no contradiction arises — the evidence stands as recorded.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `adr`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
