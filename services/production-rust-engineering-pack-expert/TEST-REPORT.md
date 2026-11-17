# Test report — production-rust-engineering-pack-expert

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-16
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment b71b0351b5994d9da5dc7bebffcd3189
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/production-rust-engineering-pack-expert/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (project `secure-core`): all six lifetime-design flags true, all seven type-design flags true, all four async-depth flags true, all six performance flags true, both unsafe/FFI flags true, one FFI binding `lib_c_core` (safe wrapper, `// SAFETY:` comment and miri testing all true), all three crypto flags true, all four expert red-line flags false | HTTP 200, verdict `PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_READY`, `ffi_bindings_count` `1`, `ffi_bindings_without_safe_wrapper` `[]`, `ffi_bindings_without_safety_comment` `[]`, `ffi_bindings_without_miri` `[]`, `safe_wrapper_coverage` `"1.000000"`, `safety_comment_coverage` `"1.000000"`, `miri_coverage` `"1.000000"`, `duplicate_ffi_binding_names` `[]`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_READY`, 37 pass / 0 fail / 0 missing, all seven sections `pass`, exactly those computed values | PASS |
| 2 | violations — full manifest identical to full-pass except `ffi_bindings[0].safe_wrapper_present` `false` and `expert_red_lines.reflexive_clone_rc_dodge_present` `true` | HTTP 200, verdict `PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_NOT_READY`, the 2 named checks fail | HTTP 200, `PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_NOT_READY`, 35 pass / 2 fail / 0 missing; failing checks exactly `every_ffi_binding_exposes_safe_wrapper`, `expert_no_reflexive_clone_rc_dodge`; `ffi_bindings_count` `1`, `ffi_bindings_without_safe_wrapper` `["lib_c_core"]`, `ffi_bindings_without_safety_comment` `[]`, `ffi_bindings_without_miri` `[]`, `safe_wrapper_coverage` `"0.000000"`, `safety_comment_coverage` `"1.000000"`, `miri_coverage` `"1.000000"`, `duplicate_ffi_binding_names` `[]`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `unsafe_ffi_and_wasm_depth` and `expert_red_lines` `fail`, other five sections `pass` | PASS |
| 3 | sparse — only `project` (`minimal-record`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 37 missing, all seven sections `insufficient_evidence`, `computed_status` null, `ffi_bindings_count` null, `ffi_bindings_without_safe_wrapper` null, `ffi_bindings_without_safety_comment` null, `ffi_bindings_without_miri` null, `safe_wrapper_coverage` null, `safety_comment_coverage` null, `miri_coverage` null, `duplicate_ffi_binding_names` null | PASS |
| 4 | malformed — full-pass manifest with `project` `12345` (number where a string is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"project","detail":"project must be a string"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `production_rust_engineering_pack_expert`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array and text stamp trimmed — the full response carries all 37 checks and a text stamp of the verdict):

```json
{"service": "production-rust-engineering-pack-expert", "atom_version": "0.1.0", "project": "secure-core", "verdict": "PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_READY", "sections": {"lifetime_architecture_depth": "pass", "type_system_and_api_design": "pass", "async_runtime_depth": "pass", "performance_measurement_and_allocation": "pass", "unsafe_ffi_and_wasm_depth": "pass", "cryptography_and_secret_handling": "pass", "expert_red_lines": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "ffi_bindings_count": 1, "ffi_bindings_without_safe_wrapper": [], "ffi_bindings_without_safety_comment": [], "ffi_bindings_without_miri": [], "safe_wrapper_coverage": "1.000000", "safety_comment_coverage": "1.000000", "miri_coverage": "1.000000", "duplicate_ffi_binding_names": [], "summary": "37 pass, 0 fail, 0 missing of 37 checks across seven sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"project","detail":"project must be a string"}
```

## Findings

No findings.

## Tester errors

6 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 5 rejections in total — by rule: R1 check-register ×2, R2 structured-spot-checks ×2, R3 violations-full-manifest ×0, R4 malformed-exactly-one ×1 — plus 1 genuine-validity correction (the sparse case) that the validator does not check. The corrected, executed battery passed the validator (`ok: true`) before execution.

1. (R1) Violations designed `failing_checks` named `safe_wrapper_per_ffi_binding`, which is not an exact check name — validator rejection: "failing_checks names 'safe_wrapper_per_ffi_binding', which is not in the atom's check register (37 checks)". Corrected before execution: the violations case was rebuilt as a deep copy of the final full-pass manifest with `ffi_bindings[0].safe_wrapper_present` = `false` planted, and `failing_checks` set to the exact oracle check name that change fails: `every_ffi_binding_exposes_safe_wrapper` (confirmed by running the Python oracle on the rebuilt input).
2. (R1) Violations designed `failing_checks` also named the input field path `expert_red_lines.reflexive_clone_rc_dodge_present` instead of an exact check name — validator rejection: "failing_checks names 'expert_red_lines.reflexive_clone_rc_dodge_present', which is not in the atom's check register (37 checks)". Corrected before execution by the same rebuild, with `expert_red_lines.reflexive_clone_rc_dodge_present` = `true` planted and `failing_checks` set to the exact oracle check name `expert_no_reflexive_clone_rc_dodge`. The oracle on the rebuilt input returns exactly those 2 checks failing (35 pass / 2 fail / 0 missing), verdict `PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_NOT_READY`.
3. (R2) Full-pass `expect` carried no structured `computed_spot_checks` (the computed quantities appeared only in prose notes) — validator rejection: "expect.computed_spot_checks is absent, empty or not structured (a non-empty object of quantity -> expected value, or a list of {quantity, expected} objects, is required); quantities stated only in prose notes do not count". Corrected before execution: structured spot checks were injected as an object mapping quantity -> expected value, taken from the Python oracle output on the exact final full-pass input (all 9 top-level computed fields: `computed_status` `within_stated_limits_on_declared_evidence`, `ffi_bindings_count` `1`, `ffi_bindings_without_safe_wrapper` `[]`, `ffi_bindings_without_safety_comment` `[]`, `ffi_bindings_without_miri` `[]`, `safe_wrapper_coverage` `"1.000000"`, `safety_comment_coverage` `"1.000000"`, `miri_coverage` `"1.000000"`, `duplicate_ffi_binding_names` `[]`).
4. (R2) Violations `expect` carried no structured `computed_spot_checks` — same validator rejection as (3). Corrected before execution: structured spot checks were injected from the Python oracle output on the exact rebuilt violations input (all 9 top-level computed fields: `computed_status` `outside_stated_limits_on_declared_evidence`, `ffi_bindings_count` `1`, `ffi_bindings_without_safe_wrapper` `["lib_c_core"]`, `ffi_bindings_without_safety_comment` `[]`, `ffi_bindings_without_miri` `[]`, `safe_wrapper_coverage` `"0.000000"`, `safety_comment_coverage` `"1.000000"`, `miri_coverage` `"1.000000"`, `duplicate_ffi_binding_names` `[]`).
5. (R4) Malformed input as designed carried 2 type violations (`project` as a number and `lifetime_design` as a string) — validator rejection: "malformed input carries 2 type violations (project must be a string, lifetime_design must be a object); exactly one is required so the 422 field is unambiguous". Corrected before execution: the malformed input was rebuilt as a deep copy of the final full-pass manifest with exactly one typed field mutated — `project` replaced by the number `12345` where a string is required — verified with `validate_cases.type_violations(input, mod.MANIFEST_SPEC, "")` to carry exactly one violation, `[('project', 'string')]`, so the 422 field is unambiguously `project`.
6. (validity) The sparse case as designed was not identity-only: it carried `lifetime_design.lifetimes_modelled_deliberately_at_api_boundaries` = `true` alongside `project`, so the oracle returned 1 pass / 0 fail / 36 missing instead of the identity-only 0 pass / 0 fail / 37 missing. Corrected before execution: the sparse input was reduced to the identity field alone, `{"project": "minimal-record"}`, and the oracle was confirmed to return `INSUFFICIENT_EVIDENCE` with 0 failing checks (0 pass / 0 fail / 37 missing).

The full-pass input was verified genuinely valid against the Python oracle before execution (the oracle returns all 37 checks pass on it — no correction needed).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the five FFI-binding computed checks, `ffi_bindings_count`, the three "without" name lists, `duplicate_ffi_binding_names`, the three coverage ratios under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, the derived `computed_status`, and all 32 boolean-field checks) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/production-rust-engineering-pack-expert/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `ffi_bindings_declared` / `every_ffi_binding_exposes_safe_wrapper` / `every_ffi_binding_carries_safety_comment` / `every_ffi_binding_tested_under_miri` / `no_ffi_binding_name_duplicated` | pass / pass / pass / pass / pass | pass / pass / pass / pass / pass | ✓ |
| full-pass `ffi_bindings_count` | 1 | 1 | ✓ |
| full-pass `ffi_bindings_without_safe_wrapper` / `ffi_bindings_without_safety_comment` / `ffi_bindings_without_miri` / `duplicate_ffi_binding_names` | [] / [] / [] / [] | [] / [] / [] / [] | ✓ |
| full-pass `safe_wrapper_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `safety_comment_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `miri_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `computed_status` (all five computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| full-pass verdict / summary | PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_READY / 37 pass, 0 fail, 0 missing | same | ✓ |
| violations `every_ffi_binding_exposes_safe_wrapper` (row `lib_c_core` declares the wrapper false) | fail | fail | ✓ |
| violations `ffi_bindings_without_safe_wrapper` | ["lib_c_core"] | ["lib_c_core"] | ✓ |
| violations `safe_wrapper_coverage` (0 ÷ 1) | "0.000000" | "0.000000" | ✓ |
| violations `safety_comment_coverage` / `miri_coverage` | "1.000000" / "1.000000" | "1.000000" / "1.000000" | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly `every_ffi_binding_exposes_safe_wrapper`, `expert_no_reflexive_clone_rc_dodge` | same 2 | ✓ |
| violations verdict / summary | PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_NOT_READY / 35 pass, 2 fail, 0 missing | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 2-check failure set on the violations case.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `project`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
