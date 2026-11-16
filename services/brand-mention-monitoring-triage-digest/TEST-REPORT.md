# Test report — brand-mention-monitoring-triage-digest

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment fa3faa42fac649da873fcc00cfa20f82
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/brand-mention-monitoring-triage-digest/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — all inventory/coverage/triage/response/alert/evidence/digest flags true, dimensions `[severity, reach, authenticity]`, routes `[ignore, monitor, reply, escalate, legal]`, counts 10 / 5 / 5, all five conduct flags false | HTTP 200, verdict `TRIAGE_DIGEST_READY`, `triage_dimensions_missing` `[]`, `triage_routes_missing` `[]`, `actions_without_archived_evidence` `0`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `TRIAGE_DIGEST_READY`, 37 pass / 0 fail / 0 missing, exactly those computed values, `computed_status` `within_stated_limits_on_declared_evidence` | PASS |
| 2 | violations — dimensions only `[severity, reach]`, routes only `[ignore]`, counts 10 / 5 / 2, `astroturfing_fake_reviews_or_manufactured_engagement` true | HTTP 200, verdict `TRIAGE_DIGEST_NOT_READY`, the 4 named checks fail | HTTP 200, `TRIAGE_DIGEST_NOT_READY`, 0 pass / 4 fail / 33 missing; failing checks exactly `all_stated_triage_dimensions_used`, `all_stated_triage_routes_defined`, `evidence_archived_for_every_action`, `no_astroturfing_or_fake_engagement`; `triage_dimensions_missing` `["authenticity"]`, `triage_routes_missing` `["monitor", "reply", "escalate", "legal"]`, `actions_without_archived_evidence` `3`, `computed_status` `outside_stated_limits_on_declared_evidence` | PASS |
| 3 | sparse — only `brand` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 37 missing, computed fields null | PASS |
| 4 | malformed — `inventory: "not-an-object"` (string where an object is required), `counts.total_mentions: "ten"` | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"inventory","detail":"inventory must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `brand_mention_monitoring_triage_digest`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 37 checks and a text stamp):

```json
{"service": "brand-mention-monitoring-triage-digest", "atom_version": "0.1.0", "brand": "Nrupal", "verdict": "TRIAGE_DIGEST_READY", "sections": {"inventory_and_coverage": "pass", "triage_rubric": "pass", "response_policy": "pass", "alert_hygiene_and_evidence": "pass", "digest_reporting": "pass", "red_lines": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "triage_dimensions_missing": [], "triage_routes_missing": [], "actions_without_archived_evidence": 0, "summary": "37 pass, 0 fail, 0 missing of 37 checks across six sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"inventory","detail":"inventory must be an object"}
```

## Findings

No findings.

## Tester errors

2 tester errors, corrected at design time before execution and not scored against the atom:

1. Violations designed `failing_checks` listed section names (`triage_rubric`, `alert_hygiene_and_evidence`, `red_lines`) instead of exact check names. Corrected before execution to the 4 exact check names above, with no change to any input value or expected verdict.
2. Full-pass `expect` carried no structured `computed_spot_checks` list — Gemini embedded the spot check only in `notes` (`actions_without_archived_evidence=0`). Added the structured list before execution: `triage_dimensions_missing = []`, `triage_routes_missing = []`, `actions_without_archived_evidence = 0 (5 - 5)`, `computed_status = within_stated_limits_on_declared_evidence`.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (triage-dimension and triage-route set coverage, evidence-for-every-action arithmetic and coherence, and `computed_status`) and verified the artifact's numbers and verdicts. Raw output: `verification/work/brand-mention-monitoring-triage-digest/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `triage_dimensions_missing` ({severity, reach, authenticity} − declared) | [] | [] | ✓ |
| full-pass `triage_routes_missing` ({ignore, monitor, reply, escalate, legal} − declared) | [] | [] | ✓ |
| full-pass `actions_without_archived_evidence` (5 − 5) | 0 | 0 | ✓ |
| violations `triage_dimensions_missing` | ["authenticity"] | ["authenticity"] | ✓ |
| violations `triage_routes_missing` | ["monitor", "reply", "escalate", "legal"] | same 4 | ✓ |
| violations `actions_without_archived_evidence` (5 − 2) | 3 | 3 | ✓ |
| verdicts | TRIAGE_DIGEST_READY / TRIAGE_DIGEST_NOT_READY (4 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 4-check failure set on the violations case.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `inventory`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
