# Test report — local-first-sync-design

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment fe07be725c5a4817ad7b7e341310a97b
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/local-first-sync-design/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (app `Vault`): all local-truth/data-model/sync-protocol/encryption/conflicts/state-UI/testing declarations in passing polarity, one entity `notes` (user prose, per-field merge semantics and stable ID declared, no silent last-write-wins), personal data not synced, no sync badge claimed | HTTP 200, verdict `LOCAL_FIRST_SYNC_SOUND`, `entities_count` `1`, `merge_semantics_coverage` `"1.000000"`, `stable_id_coverage` `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `LOCAL_FIRST_SYNC_SOUND`, 47 pass / 0 fail / 0 missing, all five sections `pass`, exactly those computed values (all row-name lists `[]`) | PASS |
| 2 | violations — full manifest identical to full-pass except `conflicts.silent_last_write_wins_on_user_prose_present` true and entity `notes` with `silent_last_write_wins_present` true | HTTP 200, verdict `LOCAL_FIRST_SYNC_NOT_SOUND`, the 2 named checks fail | HTTP 200, `LOCAL_FIRST_SYNC_NOT_SOUND`, 45 pass / 2 fail / 0 missing; failing checks exactly `no_silent_last_write_wins_on_user_prose`, `no_prose_entity_uses_silent_last_write_wins`; `prose_entities_with_silent_last_write_wins` `["notes"]`, `merge_semantics_coverage` `"1.000000"`, `stable_id_coverage` `"1.000000"`, `computed_status` `outside_stated_limits_on_declared_evidence`; section `conflicts_and_state_ui` `fail`, the other four `pass` | PASS |
| 3 | sparse — only `app` (`MinimalApp`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 47 missing, all five sections `insufficient_evidence`, `entities_count` null, `entities_without_merge_semantics` null, `merge_semantics_coverage` null, `entities_without_stable_id` null, `stable_id_coverage` null, `prose_entities_with_silent_last_write_wins` null, `computed_status` null | PASS |
| 4 | malformed — `local_truth.device_store_authoritative: "NOT_A_BOOLEAN"` (string where a boolean is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"local_truth.device_store_authoritative","detail":"local_truth.device_store_authoritative must be a boolean"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `local_first_sync_design`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 47 checks and a text stamp):

```json
{"service": "local-first-sync-design", "atom_version": "0.1.0", "app": "Vault", "verdict": "LOCAL_FIRST_SYNC_SOUND", "sections": {"local_truth_and_data_model": "pass", "sync_protocol": "pass", "encryption_and_keys": "pass", "conflicts_and_state_ui": "pass", "testing_and_quality_gates": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "entities_count": 1, "entities_without_merge_semantics": [], "merge_semantics_coverage": "1.000000", "entities_without_stable_id": [], "stable_id_coverage": "1.000000", "prose_entities_with_silent_last_write_wins": [], "summary": "47 pass, 0 fail, 0 missing of 47 checks across five sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"local_truth.device_store_authoritative","detail":"local_truth.device_store_authoritative must be a boolean"}
```

## Findings

No findings.

## Tester errors

4 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 5 rejections in total — by rule: R1 check-register ×2, R2 structured-spot-checks ×2, R3 violations-full-manifest ×1, R4 malformed-exactly-one ×0. The corrected, executed battery passed the validator (`ok: true`) before execution.

1. (R1) Violations designed `failing_checks` listed `prose_entities_with_silent_last_write_wins` (a computed output name, not a check) and `conflicts_and_state_ui` (a section name) instead of exact check names — 2 validator rejections. Corrected before execution to the 2 exact check names the planted values fail: `no_silent_last_write_wins_on_user_prose`, `no_prose_entity_uses_silent_last_write_wins`.
2. (R2) Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`entities_count` `1`, `entities_without_merge_semantics` `[]`, `merge_semantics_coverage` `"1.000000"`, `entities_without_stable_id` `[]`, `stable_id_coverage` `"1.000000"`, `prose_entities_with_silent_last_write_wins` `[]`, `computed_status` `within_stated_limits_on_declared_evidence`), each value computed by hand from the input per SERVICE.md.
3. (R2) Violations `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`entities_count` `1`, `entities_without_merge_semantics` `[]`, `merge_semantics_coverage` `"1.000000"`, `entities_without_stable_id` `[]`, `stable_id_coverage` `"1.000000"`, `prose_entities_with_silent_last_write_wins` `["notes"]`, `computed_status` `outside_stated_limits_on_declared_evidence`).
4. (R3) Violations input was not a full manifest — it was a sparse fragment containing only a differently-named entity (`prose_doc`) and one conflicts field, omitting most key paths of the full-pass manifest. Corrected before execution: rebuilt it as a full copy of the full-pass manifest carrying exactly the 2 planted violations (`conflicts.silent_last_write_wins_on_user_prose_present` true, and entity `notes` with `silent_last_write_wins_present` true) and nothing else changed.

The full-pass input was verified genuinely valid per SERVICE.md before execution (the Python oracle returns all 47 checks pass on it — no correction needed), the sparse case was verified genuinely sparse (only `app` — no correction needed), and the malformed case needed no correction (exactly one type violation of a documented typed field — `local_truth.device_store_authoritative` as a string where a boolean is required).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the four primary computed checks, the declared counts, the row-name lists, the coverage ratios under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/local-first-sync-design/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `entities_count` | 1 | 1 | ✓ |
| full-pass `merge_semantics_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `stable_id_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `entities_without_merge_semantics` / `entities_without_stable_id` / `prose_entities_with_silent_last_write_wins` | [] / [] / [] | [] / [] / [] | ✓ |
| full-pass `computed_status` (all four computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `prose_entities_with_silent_last_write_wins` (`notes` is prose with silent LWW) | ["notes"] | ["notes"] | ✓ |
| violations `merge_semantics_coverage` / `stable_id_coverage` (1 ÷ 1 each) | "1.000000" / "1.000000" | "1.000000" / "1.000000" | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 2 planted checks | same 2 | ✓ |
| verdicts | LOCAL_FIRST_SYNC_SOUND / LOCAL_FIRST_SYNC_NOT_SOUND (2 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 2-check failure set on the violations case. The coordinating tester's own mechanical re-verification of the raw evidence matches on every point (per-case HTTP status, verdicts, failing-check set, sparse outcome, malformed 422 field, determinism and parity); where the Gemini judge's computed-check list covered only three quantities, the full spot-check set was verified mechanically from the evidence and by DeepSeek, so no contradiction arises — the evidence stands as recorded.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `local_truth.device_store_authoritative`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
