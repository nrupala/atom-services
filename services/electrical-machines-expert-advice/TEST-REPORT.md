# Test report — electrical-machines-expert-advice

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 5cf70cb60526415d89b4db5e5cd02744
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/electrical-machines-expert-advice/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete expert-advice record (advice `test-001`): induction machine, full-load current 100 A, starting current 600 A, all engagement declarations true, VFD / protection / hazardous area / calculations / document review all declared out of scope (gates false), final settings deferred to study true, settings published as fact false | HTTP 200, verdict `SOUND`, starting-current multiple `6.000000` recorded, summary `44 pass, 0 fail, 0 missing of 44 checks across seven sections.` | HTTP 200, `SOUND`, 44 pass / 0 fail / 0 missing, all seven sections `pass`, `induction_starting_current_multiple_recorded` evidence records `6.000000 x FLA declared`, exactly the expected summary | PASS |
| 2 | violations — full manifest with protection in scope, `protection.ansi_device_numbers` `["999"]` (not in the skill's ANSI list) and `protection.settings_published_as_fact` true | HTTP 200, verdict `NOT_SOUND`, the 2 named checks fail | HTTP 200, `NOT_SOUND`, 42 pass / 2 fail / 0 missing; failing checks exactly `ansi_device_numbers_valid`, `settings_not_published_as_fact`; section `protection` `fail`, all other sections `pass`; starting-current multiple still `6.000000` | PASS |
| 3 | sparse — only `advice_id` (`test-003`) and `engagement.question_or_problem_stated` true | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 36 pass / 0 fail / 8 missing, sections `engagement`, `machine_analysis`, `protection` and `standards_and_hazloc` `insufficient_evidence`, `drives`, `calculations` and `documents_and_disclosure` `pass` (their gated checks pass as not applicable) | PASS |
| 4 | malformed — `engagement: "invalid_string_instead_of_object"` (string where an object is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"engagement","detail":"engagement must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `electrical_machines_expert_advice`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 44 checks and a text stamp):

```json
{"service": "electrical-machines-expert-advice", "atom_version": "0.1.0", "advice_id": "test-001", "verdict": "SOUND", "sections": {"engagement": "pass", "machine_analysis": "pass", "drives": "pass", "protection": "pass", "standards_and_hazloc": "pass", "calculations": "pass", "documents_and_disclosure": "pass"}, "checks": [{"section": "engagement", "check": "question_or_problem_stated", "status": "pass", "evidence": "the question or problem the advice answers is stated"}, {"section": "engagement", "check": "operating_context_stated", "status": "pass", "evidence": "the operating context the advice applies to is stated"}], "summary": "44 pass, 0 fail, 0 missing of 44 checks across seven sections.", "stamp": "ELECTRICAL-MACHINES EXPERT ADVICE\nadvice_id: test-001\nVERDICT: SOUND\n  engagement               pass\n  machine_analysis         pass\n  drives                   pass\n  protection               pass\n  standards_and_hazloc     pass\n  calculations             pass\n  documents_and_disclosure pass\n44 pass, 0 fail, 0 missing of 44 checks across seven sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"engagement","detail":"engagement must be an object"}
```

## Findings

No findings.

## Tester errors

3 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 4 rejections in total — by rule: R1 check-register ×2, R2 structured-spot-checks ×2, R3 violations-full-manifest ×0, R4 malformed-exactly-one ×0. The corrected, executed battery passed the validator (`ok: true`) before execution.

1. (R2) Full-pass `expect` carried the computed quantity only in prose notes ("Computed starting current multiple: 6.000000"), with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`verdict` `SOUND`, `induction_starting_current_multiple` `"6.000000"`, `summary` `"44 pass, 0 fail, 0 missing of 44 checks across seven sections."`).
2. (R1) Violations `expect.failing_checks` listed input field paths (`protection.ansi_device_numbers`, `protection.settings_published_as_fact`) instead of exact check names — 2 validator rejections. Corrected before execution to the 2 exact check names the planted values fail: `ansi_device_numbers_valid`, `settings_not_published_as_fact`.
3. (R2) Violations `expect` carried no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`verdict` `NOT_SOUND`, `induction_starting_current_multiple` `"6.000000"`, `summary` `"42 pass, 2 fail, 0 missing of 44 checks across seven sections."`).

The full-pass input was verified genuinely valid per SERVICE.md before execution (every required field present with correct types; the induction-family fields true; all gates — VFD, protection, hazardous area, calculations, document review, going public — declared false so their gated checks pass as not applicable; the two standing protection rules satisfied — no correction needed), the violations input needed no structural correction (it already carried every full-pass key path plus the gated protection fields that apply once protection is in scope, with values changed only to plant the two violations), the sparse case genuinely carries only `advice_id` and one engagement field, and the malformed case already carried exactly one type violation of a documented typed field (`engagement` as a string instead of an object), so neither needed correction.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the starting-current multiple `starting_current_a ÷ full_load_current_a` recorded to six decimals and never graded, ANSI device-number validity against the skill's own list `50, 51, 87, 27, 59, 81, 49, 46, 32, 25, 86`, the standing protection rules, the family / VFD / hazloc / calculations / documents gate logic, the section statuses, the summary pass/fail/missing counts of 44, and the derived verdicts) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/electrical-machines-expert-advice/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass starting-current multiple (600.0 ÷ 100.0, six decimals) | `6.000000` | `6.000000` (in `induction_starting_current_multiple_recorded` evidence) | ✓ |
| full-pass ANSI check (protection not in scope) | pass (not applicable) | pass | ✓ |
| full-pass verdict / counts | SOUND / 44 pass, 0 fail, 0 missing | SOUND / same | ✓ |
| violations starting-current multiple (600.0 ÷ 100.0) | `6.000000` | `6.000000` | ✓ |
| violations ANSI validity (`"999"` not in the skill's list) | fail | `ansi_device_numbers_valid` fail | ✓ |
| violations settings rule (`settings_published_as_fact` true, must be false) | fail | `settings_not_published_as_fact` fail | ✓ |
| violations failing-check set | exactly the 2 planted checks | same 2 | ✓ |
| violations verdict / counts | NOT_SOUND / 42 pass, 2 fail, 0 missing | NOT_SOUND / same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 2-check failure set on the violations case. The coordinating tester's own mechanical re-verification of the raw evidence matches on every point (per-case HTTP status, verdicts, failing-check set, sparse outcome, malformed 422 field, determinism and parity); the Gemini judge's computed-check list covered the starting-current multiple, and the full spot-check set (verdicts and summaries on both cases) was verified mechanically from the evidence and by DeepSeek, so no contradiction arises — the evidence stands as recorded.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `engagement`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).

---

## Addendum — Wave 8 close (2026-11-15): disabled by owner ruling after this battery

This battery was captured complete on 2026-11-16T04:27Z, before any
disable, and the PASS above rests on that complete pre-disable
evidence (mechanically re-verified at Wave 8 recovery: statuses,
verdicts, failing sets, spot checks, determinism bytes, MCP↔REST
parity, 422 field). After the battery, the atom was **disabled by
owner ruling** (2026-11-15 21:42 MST, regulatory gate — corporate
process line U-13: engineering-advice surface held pending the
owner's per-unit regulatory ruling; kill switch `atom_enabled=0`,
503 on both faces, executed by the Conduit lane's takedown worker).
The wave accounting therefore records this atom as
**DISABLED-BY-OWNER-RULING**, not as a wave PASS; this report stands
as the record of its last complete external battery. It returns
only on the owner's explicit per-atom ruling.
