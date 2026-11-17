# Test report — meaning-first-translation-with-tone-note

**Tester:** external-verification@aimlds.org — Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-16
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment a15298eb9b7f40bf80d306cea4a33f80
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/meaning-first-translation-with-tone-note/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (document `Travel itinerary translation`): all context/tone/handling/sensitive declarations in passing polarity, all five red-line flags false, one segment row `seg1` with translation, meaning preserved, idiom/ambiguity handling complete and exact-carryover checked, one carryover item `date1` of kind `date` matching the original exactly | HTTP 200, verdict `MEANING_FIRST_TRANSLATION_SOUND`, `segments_count` `1`, `carryover_items_count` `1`, all six coverage ratios `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `MEANING_FIRST_TRANSLATION_SOUND`, 37 pass / 0 fail / 0 missing, all five sections `pass`, exactly those computed values (all row-name lists `[]`) | PASS |
| 2 | violations — full manifest identical to full-pass except the five planted violations: `segments[0].has_translation` false, `segments[0].meaning_preserved` false, `carryover_items[0].kind` `"currency"`, `carryover_items[0].matches_original_exactly` false, `red_lines.illegible_text_guessed_present` true | HTTP 200, verdict `MEANING_FIRST_TRANSLATION_NOT_SOUND`, exactly the 5 named checks fail | HTTP 200, `MEANING_FIRST_TRANSLATION_NOT_SOUND`, 32 pass / 5 fail / 0 missing; failing checks exactly `every_segment_has_translation`, `every_segment_meaning_preserved`, `every_carryover_kind_valid`, `every_carryover_item_matches_exactly`, `no_illegible_text_guessed`; `segments_without_translation` `["seg1"]`, `translation_coverage` `"0.000000"`, `segments_without_meaning_preserved` `["seg1"]`, `meaning_preserved_coverage` `"0.000000"`, `idiom_ambiguity_handling_coverage` `"1.000000"`, `exact_carryover_check_coverage` `"1.000000"`, `carryover_items_not_matching` `["date1"]`, `exact_match_coverage` `"0.000000"`, `carryover_items_with_invalid_kind` `["date1"]`, `valid_kind_coverage` `"0.000000"`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `context_and_meaning_first_method`, `exact_carryover_and_segment_coverage` and `sensitive_documents_and_red_lines` `fail`, the other two `pass` | PASS |
| 3 | sparse — only `document` (`letter-42`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 37 missing, all five sections `insufficient_evidence`, `segments_count` null, `segments_without_translation` null, `translation_coverage` null, `segments_without_meaning_preserved` null, `meaning_preserved_coverage` null, `segments_without_idiom_ambiguity_handling` null, `idiom_ambiguity_handling_coverage` null, `segments_without_exact_carryover_check` null, `exact_carryover_check_coverage` null, `carryover_items_count` null, `carryover_items_not_matching` null, `exact_match_coverage` null, `carryover_items_with_invalid_kind` null, `valid_kind_coverage` null, `computed_status` null | PASS |
| 4 | malformed — `segments: "this_should_be_a_list"` (string where a list is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"segments","detail":"segments must be a list"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `meaning_first_translation_with_tone_note`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 37 checks and a text stamp):

```json
{"service": "meaning-first-translation-with-tone-note", "atom_version": "0.1.0", "document": "Travel itinerary translation", "verdict": "MEANING_FIRST_TRANSLATION_SOUND", "sections": {"context_and_meaning_first_method": "pass", "register_tone_and_send_readiness": "pass", "idiom_ambiguity_and_uncertainty": "pass", "exact_carryover_and_segment_coverage": "pass", "sensitive_documents_and_red_lines": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "segments_count": 1, "segments_without_translation": [], "translation_coverage": "1.000000", "segments_without_meaning_preserved": [], "meaning_preserved_coverage": "1.000000", "segments_without_idiom_ambiguity_handling": [], "idiom_ambiguity_handling_coverage": "1.000000", "segments_without_exact_carryover_check": [], "exact_carryover_check_coverage": "1.000000", "carryover_items_count": 1, "carryover_items_not_matching": [], "exact_match_coverage": "1.000000", "carryover_items_with_invalid_kind": [], "valid_kind_coverage": "1.000000", "summary": "37 pass, 0 fail, 0 missing of 37 checks across five sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"segments","detail":"segments must be a list"}
```

## Findings

No findings. The Gemini judge returned verdict PASS with 0 findings and 0 tester errors at the judgment stage.

## Tester errors

6 raw validator rejections plus one genuine-validity tester error, all caught pre-execution at design time and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 6 rejections in total — by rule: R1 check-register ×3, R2 structured-spot-checks ×2, R3 violations-full-manifest ×1. The corrected, executed battery passed the validator (`ok: true`) before execution. Zero executed-case tester errors.

1. (R1 ×3) Violations designed `failing_checks` named `segments_without_translation`, `carryover_items_with_invalid_kind` and `sensitive_documents_and_red_lines`, none of which is in the atom's 37-check register — 3 validator rejections. Corrected before execution to the exact check names the planted values fail.
2. (R2 ×2) Full-pass and violations `expect` carried no structured `computed_spot_checks` (quantities stated only in prose notes do not count) — 2 validator rejections. Corrected before execution: added the structured spot-check blocks, each value computed from the input per SERVICE.md and confirmed against the Python oracle.
3. (R3 ×1) Violations input was not a full manifest — it was missing most key paths of the full-pass manifest, so it read as missing evidence rather than failure — 1 validator rejection. Corrected before execution: rebuilt it as the full manifest plus the planted violations (on `segments[0]` and `carryover_items[0]` — one of each, as designed) and nothing else changed.
4. (Genuine-validity, sensitive polarity) The full-pass design declared `sensitive.sensitive_category_identified=false` and `sensitive.certified_translation_flag_raised_when_sensitive=false` — failing polarity, since both checks require `true` to pass, so the purported full-pass case could not have passed. Corrected during the design-time correction to their documented passing polarity (`true` for both).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the eight primary computed checks, the declared counts, the row-name lists, the coverage ratios under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/meaning-first-translation-with-tone-note/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `segments_count` / `carryover_items_count` | 1 / 1 | 1 / 1 | ✓ |
| full-pass `translation_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `meaning_preserved_coverage` / `idiom_ambiguity_handling_coverage` / `exact_carryover_check_coverage` (1 ÷ 1 each) | "1.000000" / "1.000000" / "1.000000" | "1.000000" / "1.000000" / "1.000000" | ✓ |
| full-pass `exact_match_coverage` / `valid_kind_coverage` (1 ÷ 1 each) | "1.000000" / "1.000000" | "1.000000" / "1.000000" | ✓ |
| full-pass all row-name lists | [] | [] | ✓ |
| full-pass `computed_status` (all eight computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `segments_without_translation` / `segments_without_meaning_preserved` (`seg1` false) | ["seg1"] / ["seg1"] | ["seg1"] / ["seg1"] | ✓ |
| violations `translation_coverage` / `meaning_preserved_coverage` (0 ÷ 1 each) | "0.000000" / "0.000000" | "0.000000" / "0.000000" | ✓ |
| violations `carryover_items_not_matching` / `carryover_items_with_invalid_kind` (`date1`) | ["date1"] / ["date1"] | ["date1"] / ["date1"] | ✓ |
| violations `exact_match_coverage` / `valid_kind_coverage` (0 ÷ 1 each) | "0.000000" / "0.000000" | "0.000000" / "0.000000" | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 5 planted checks | same 5 | ✓ |
| verdicts | MEANING_FIRST_TRANSLATION_SOUND / MEANING_FIRST_TRANSLATION_NOT_SOUND (5 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 5-check failure set on the violations case.

## Documentation link

Designed absence — recorded, never scored. Checked 2026-11-16 with curl using a browser user-agent (the sandbox Python-urllib default UA is banned by our Cloudflare zones, error 1010): `GET https://atoms.pipavia.com/docs/meaning-first-translation-with-tone-note` returned **404**. `GET https://atoms.pipavia.com/api.json` returned 107 atoms in total; this atom's entry carries **no `documentation` key**, and 93 entries carry `documentation`. This absence is by design — Batch 16's WS1 documentation pass follows this wave — and is not scored against the atom.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `segments`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
