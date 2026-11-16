# Test report — algorithm-design-implementation

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 7f9cae9fdd60417eb72062905a066554
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/algorithm-design-implementation/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — top-k problem, mapping `top_k_or_priority` → `heap`, pattern `greedy` with safety proven, `max_input_size` 1000, `time_complexity` `O(n log k)` | HTTP 200, verdict `DESIGN_SOUND`, all 31 checks pass, `design_status` `sound_on_declared_evidence`, `scale_status` `no_fatal_scale_combination_declared` | HTTP 200, `DESIGN_SOUND`, 31 pass / 0 fail / 0 missing, exactly those computed statuses | PASS |
| 2 | violations — mapping `lookup` → `bst_or_btree`, `structure_forces_quadratic` true, pattern `invalid_pattern`, `O(n^2)` at 10,000,000, `optimized_before_measuring` true | HTTP 200, verdict `DESIGN_UNSOUND`, the 5 named checks fail | HTTP 200, `DESIGN_UNSOUND`, 26 pass / 5 fail / 0 missing; failing checks exactly `quadratic_at_fatal_scale_absent`, `structure_matches_skill_mapping`, `structure_does_not_force_quadratic`, `pattern_in_skill_toolbox`, `not_optimized_before_measuring`; `design_status` `not_sound_on_declared_evidence`, `scale_status` `fatal_scale_combination_declared` | PASS |
| 3 | sparse — only `problem` + `decomposition.inputs_stated` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 1 pass / 0 fail / 30 missing | PASS |
| 4 | malformed — `decomposition: "not_an_object"` (string where an object is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"decomposition","detail":"decomposition must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `algorithm_design_implementation`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 31 checks and a text stamp):

```json
{"service": "algorithm-design-implementation", "atom_version": "0.1.0", "problem": "Find top K elements", "verdict": "DESIGN_SOUND", "sections": {"decomposition": "pass", "complexity_reasoning": "pass", "data_structure_choice": "pass", "pattern_application": "pass", "correctness_and_edges": "pass", "verification_and_optimization": "pass"}, "design_status": "sound_on_declared_evidence", "scale_status": "no_fatal_scale_combination_declared", "summary": "31 pass, 0 fail, 0 missing of 31 checks across six sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"decomposition","detail":"decomposition must be an object"}
```

## Findings

No findings.

## Tester errors

One tester error in this atom's run, corrected at design time before execution and not scored against the atom: Gemini's designed full-pass case set `verification.method` to `"formal_proof"`, which is not one of the skill's three verification methods (`invariant_proof` / `property_based_testing` / `formal_or_cryptographic_certificate` per SERVICE.md's membership rule) and would have failed the `verification_method_declared_when_critical` check. The case was minimally corrected to `"invariant_proof"` before the harness ran. The violations case's expected failing-check names were likewise normalised to the exact check names above; the designed values and expected verdict were unchanged.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input`; determinism byte-identical true; MCP/REST parity true). The computed mapping, toolbox and fatal-scale checks behave exactly as SERVICE.md states, including the fatal combination at exactly 10,000,000 with `O(n^2)`.
