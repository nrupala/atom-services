# Test report — audience-contract-design

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment babe764a73734f93a8016267e77af193
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/audience-contract-design/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — all four class paths defined, single canonical truth, progressive formality + all four failure modes, `dangerous_actions_present` `true` with the full four-element lattice satisfied, all must-be-false red lines `false` | HTTP 200, verdict `AUDIENCE_CONTRACT_COMPLETE`, `classes_with_path_count` 4, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `AUDIENCE_CONTRACT_COMPLETE`, 26 pass / 0 fail / 0 missing, exactly those computed values | PASS |
| 2 | violations — `single_class_only_shipment` `true`, `truth_forked_per_class` `true`, `dangerous_path_skips_lattice` `true` (with `dangerous_actions_present` `false`, so the four lattice elements pass as not applicable) | HTTP 200, verdict `AUDIENCE_CONTRACT_INCOMPLETE`, the 3 named checks fail | HTTP 200, `AUDIENCE_CONTRACT_INCOMPLETE`, 23 pass / 3 fail / 0 missing; failing checks exactly `not_single_class_only_shipment`, `truth_not_forked_per_class`, `dangerous_path_does_not_skip_lattice`; `classes_with_path_count` 4 | PASS |
| 3 | sparse — only `artifact` + `classes.human_path_defined` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 1 pass / 0 fail / 25 missing, `classes_with_path_count` 1, `computed_status` null | PASS |
| 4 | malformed — `classes: "invalid_string_instead_of_object"` (string where an object is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"classes","detail":"classes must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `audience_contract_design`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 26 checks and a text stamp):

```json
{"service": "audience-contract-design", "atom_version": "0.1.0", "artifact": "test-artifact-001", "verdict": "AUDIENCE_CONTRACT_COMPLETE", "sections": {"classes_and_paths": "pass", "single_truth": "pass", "progressive_formality_and_failure": "pass", "authority_lattice": "pass", "verification_by_class": "pass", "identity_by_class": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "classes_with_path_count": 4, "summary": "26 pass, 0 fail, 0 missing of 26 checks across six sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"classes","detail":"classes must be an object"}
```

## Findings

No findings.

## Tester errors

No tester errors in this atom's run. The designed cases were sanity-checked against `contract.yaml` + `SERVICE.md` before execution (nesting under `classes` / `single_truth` / `progressive_formality` / `failure` / `authority` / `verification` / `identity`, must-be-false red lines present, lattice gate handled per the conditional rule) and needed no correction. The violations case's expected failing-check labels as designed named the three affected sections; they were read against the exact check names above at judging, with no change to any input value or expected verdict.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the `classes_with_path_count` count over the four path fields, the conditional authority lattice — required only when `authority.dangerous_actions_present` is `true`, otherwise not applicable — and `computed_status`) and verified the artifact's numbers and verdicts. Raw output: `verification/work/audience-contract-design/deepseek-raw.txt`.

**DeepSeek verdict: PASS** — every recomputed quantity matches the artifact; no mismatches. **AGREEMENT: full**

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `classes_with_path_count` (4 paths true) | 4 | 4 | ✓ |
| violations `classes_with_path_count` (4 paths true) | 4 | 4 | ✓ |
| full-pass lattice (dangerous `true`, all 4 elements true) | satisfied, 5/5 pass | satisfied | ✓ |
| violations lattice (dangerous `false` → 4 elements N/A pass; skips-lattice `true` fails) | 4 pass / 1 fail | 4 pass / 1 fail | ✓ |
| `computed_status` full-pass / violations | within stated limits (path checks complete) | same | ✓ |
| verdicts | COMPLETE / INCOMPLETE (3 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 3-check red-line failure set on the violations case and the conditional-lattice handling.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` naming `classes`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
