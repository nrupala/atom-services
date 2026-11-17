# Test report — localization-readiness-review

**Tester:** external-verification@aimlds.org — Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-16
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment a15298eb9b7f40bf80d306cea4a33f80
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/localization-readiness-review/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (product `TestApp`): all externalization/formats/grammar/layout/RTL/workflow/testing declarations in passing polarity, both red-line flags false, one locale row `French` (`fr-FR`, direction `ltr`, format tests passed, screenshots reviewed) | HTTP 200, verdict `LOCALIZATION_READINESS_SOUND`, `locales_count` `1`, `format_test_coverage` `"1.000000"`, `valid_direction_coverage` `"1.000000"`, `screenshot_coverage` `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `LOCALIZATION_READINESS_SOUND`, 37 pass / 0 fail / 0 missing, all five sections `pass`, exactly those computed values (all row-name lists `[]`) | PASS |
| 2 | violations — full manifest identical to full-pass except `externalization.hardcoded_ui_strings_present` true, and locale `French` with `direction` `"sideways"` and `format_tests_passed` false | HTTP 200, verdict `LOCALIZATION_READINESS_NOT_SOUND`, the 3 named checks fail | HTTP 200, `LOCALIZATION_READINESS_NOT_SOUND`, 34 pass / 3 fail / 0 missing; failing checks exactly `every_locale_direction_valid`, `every_locale_has_format_tests_passed`, `no_hardcoded_ui_strings`; `locales_without_format_tests` `["French"]`, `format_test_coverage` `"0.000000"`, `locales_with_invalid_direction` `["French"]`, `valid_direction_coverage` `"0.000000"`, `duplicate_locale_codes` `[]`, `locales_without_screenshots` `[]`, `screenshot_coverage` `"1.000000"`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `externalized_strings_and_translation_units` and `locale_testing_and_red_lines` `fail`, the other three `pass` | PASS |
| 3 | sparse — only `product` (`sketchy-app`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 37 missing, all five sections `insufficient_evidence`, `locales_count` null, `locales_without_format_tests` null, `format_test_coverage` null, `locales_with_invalid_direction` null, `valid_direction_coverage` null, `duplicate_locale_codes` null, `locales_without_screenshots` null, `screenshot_coverage` null, `computed_status` null | PASS |
| 4 | malformed — `externalization: "should_be_an_object"` (string where an object is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"externalization","detail":"externalization must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `localization_readiness_review`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 37 checks and a text stamp):

```json
{"service": "localization-readiness-review", "atom_version": "0.1.0", "product": "TestApp", "verdict": "LOCALIZATION_READINESS_SOUND", "sections": {"externalized_strings_and_translation_units": "pass", "locale_formats_plurals_and_grammar": "pass", "flexible_layout_and_rtl_readiness": "pass", "content_workflow_and_glossary": "pass", "locale_testing_and_red_lines": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "locales_count": 1, "locales_without_format_tests": [], "format_test_coverage": "1.000000", "locales_with_invalid_direction": [], "valid_direction_coverage": "1.000000", "duplicate_locale_codes": [], "locales_without_screenshots": [], "screenshot_coverage": "1.000000", "summary": "37 pass, 0 fail, 0 missing of 37 checks across five sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"externalization","detail":"externalization must be an object"}
```

## Findings

No findings.

## Tester errors

7 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 7 rejections in total — by rule: R1 check-register ×4, R2 structured-spot-checks ×2, R3 violations-full-manifest ×1. The corrected, executed battery passed the validator (`ok: true`) before execution. Zero executed-case tester errors.

1. (R1) Violations designed `failing_checks` named `externalization.hardcoded_ui_strings_present` — a field path, not a register check name — validator rejection: "failing_checks names 'externalization.hardcoded_ui_strings_present', which is not in the atom's check register (37 checks)".
2. (R1) Violations designed `failing_checks` named `locales[].direction` — a field path, not a register check name — validator rejection: "failing_checks names 'locales[].direction', which is not in the atom's check register (37 checks)".
3. (R1) Violations designed `failing_checks` named `locales[].format_tests_passed` — a field path, not a register check name — validator rejection: "failing_checks names 'locales[].format_tests_passed', which is not in the atom's check register (37 checks)".
4. (R1) Violations designed `failing_checks` named `red_lines.string_concatenation_for_grammar_present` — a field path, not a register check name — validator rejection: "failing_checks names 'red_lines.string_concatenation_for_grammar_present', which is not in the atom's check register (37 checks)". Corrected before execution (design-time correction): `failing_checks` was set to exactly the 3 exact check names the planted values fail: `every_locale_direction_valid`, `every_locale_has_format_tests_passed`, `no_hardcoded_ui_strings`.
5. (R2) Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution by structured injection from the oracle: added the structured spot-check block (`computed_status` `within_stated_limits_on_declared_evidence`, `locales_count` `1`, `locales_without_format_tests` `[]`, `format_test_coverage` `"1.000000"`, `locales_with_invalid_direction` `[]`, `valid_direction_coverage` `"1.000000"`, `duplicate_locale_codes` `[]`, `locales_without_screenshots` `[]`, `screenshot_coverage` `"1.000000"`), each value computed per SERVICE.md and confirmed against the Python oracle.
6. (R2) Violations `expect` carried no structured `computed_spot_checks`. Corrected before execution by structured injection from the oracle: added the structured spot-check block (`computed_status` `outside_stated_limits_on_declared_evidence`, `locales_count` `1`, `locales_without_format_tests` `["French"]`, `format_test_coverage` `"0.000000"`, `locales_with_invalid_direction` `["French"]`, `valid_direction_coverage` `"0.000000"`, `duplicate_locale_codes` `[]`, `locales_without_screenshots` `[]`, `screenshot_coverage` `"1.000000"`).
7. (R3) Violations input was not a full manifest — it was sparse instead of a full manifest, missing most key paths of the full-pass manifest, so it read as missing evidence rather than failure. Corrected before execution: rebuilt it as the full manifest plus the planted violations on `locales[0]`, the single designed locale — `externalization.hardcoded_ui_strings_present` = true, `locales[0].direction` = `"sideways"`, `locales[0].format_tests_passed` = false — and nothing else changed.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the five primary computed checks, the declared counts, the row-name lists, the coverage ratios under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/localization-readiness-review/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `locales_count` | 1 | 1 | ✓ |
| full-pass `format_test_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `valid_direction_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `screenshot_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `locales_without_format_tests` / `locales_with_invalid_direction` / `duplicate_locale_codes` / `locales_without_screenshots` | [] / [] / [] / [] | [] / [] / [] / [] | ✓ |
| full-pass `computed_status` (all five computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `locales_without_format_tests` (`French` format_tests_passed false) | ["French"] | ["French"] | ✓ |
| violations `format_test_coverage` (0 ÷ 1) | "0.000000" | "0.000000" | ✓ |
| violations `locales_with_invalid_direction` (`French` direction `sideways`) | ["French"] | ["French"] | ✓ |
| violations `valid_direction_coverage` (0 ÷ 1) | "0.000000" | "0.000000" | ✓ |
| violations `screenshot_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 3 planted checks | same 3 | ✓ |
| verdicts | LOCALIZATION_READINESS_SOUND / LOCALIZATION_READINESS_NOT_SOUND (3 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 3-check failure set on the violations case.

## Documentation link

Designed absence — recorded, never scored. Checked 2026-11-16 with curl using a browser user-agent (the sandbox Python-urllib default UA is banned by our Cloudflare zones, error 1010): `GET https://atoms.pipavia.com/docs/localization-readiness-review` returned **404**. `GET https://atoms.pipavia.com/api.json` returned 107 atoms in total; this atom's entry carries **no `documentation` key**, and 93 entries carry `documentation`. This absence is by design — Batch 16's WS1 documentation pass follows this wave — and is not scored against the atom.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `externalization`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
