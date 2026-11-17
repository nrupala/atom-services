# Test report — production-python-engineering-pack

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-16
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 9595ea665b634289aad158b7fff277ac
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/production-python-engineering-pack/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (project `test-project`): all environment, typing, style, errors, resources, async, testing and packaging declarations true, one dependency `requests` with `version_pinned` true, all three red-line flags false | HTTP 200, verdict `PRODUCTION_PYTHON_ENGINEERING_PACK_READY`, `dependencies_count` `1`, `dependencies_without_pin` `[]`, `pin_coverage` `"1.000000"`, `duplicate_dependency_names` `[]`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `PRODUCTION_PYTHON_ENGINEERING_PACK_READY`, 39 pass / 0 fail / 0 missing, all six sections `pass`, exactly those computed values | PASS |
| 2 | violations — full manifest identical to full-pass except `dependencies[0].version_pinned` false, a second dependency row duplicating the name `requests` (with `version_pinned` true), and `red_lines.secrets_in_code_or_notebooks_present` true | HTTP 200, verdict `PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY`, the 3 named checks fail | HTTP 200, `PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY`, 36 pass / 3 fail / 0 missing; failing checks exactly `every_dependency_version_pinned`, `no_dependency_name_duplicated`, `no_secrets_in_code_or_notebooks`; `dependencies_count` `2`, `dependencies_without_pin` `["requests"]`, `pin_coverage` `"0.500000"`, `duplicate_dependency_names` `["requests"]`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `environment_and_dependencies` and `red_lines` `fail`, the other four sections `pass` | PASS |
| 3 | sparse — only `project` (`minimal-project`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 39 missing, all six sections `insufficient_evidence`, `dependencies_count` null, `dependencies_without_pin` null, `pin_coverage` null, `duplicate_dependency_names` null, `computed_status` null | PASS |
| 4 | malformed — `environment: "not-an-object"` (string where an object is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"environment","detail":"environment must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `production_python_engineering_pack`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 39 checks and a text stamp):

```json
{"service": "production-python-engineering-pack", "atom_version": "0.1.0", "project": "test-project", "verdict": "PRODUCTION_PYTHON_ENGINEERING_PACK_READY", "sections": {"environment_and_dependencies": "pass", "typing_and_style": "pass", "errors_resources_and_async": "pass", "testing_discipline": "pass", "packaging_and_reproducibility": "pass", "red_lines": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "dependencies_count": 1, "dependencies_without_pin": [], "pin_coverage": "1.000000", "duplicate_dependency_names": [], "summary": "39 pass, 0 fail, 0 missing of 39 checks across six sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"environment","detail":"environment must be an object"}
```

## Findings

No findings.

## Tester errors

6 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 5 rejections in total — by rule: R1 check-register ×2, R2 structured-spot-checks ×2, R4 malformed-exactly-one ×1 (R3 violations-full-manifest ×0). One further correction (item 6, the sparse case) was required by the tester doctrine in the task pipeline and was not a validator rejection. The corrected, executed battery passed the validator (`ok: true`) before execution.

1. (R1) Violations designed `failing_checks` named the input field path `red_lines.secrets_in_code_or_notebooks_present` instead of an exact check name — validator rejection: "failing_checks names 'red_lines.secrets_in_code_or_notebooks_present', which is not in the atom's check register (39 checks)". Corrected before execution as part of rebuilding the violations case (see item 2).
2. (R1) Violations designed `failing_checks` named `dependencies_pinned` instead of an exact check name — validator rejection: "failing_checks names 'dependencies_pinned', which is not in the atom's check register (39 checks)". Corrected before execution: the violations case was rebuilt as a deep copy of the full-pass manifest carrying exactly the planted changes — `dependencies[0].version_pinned` = false, a second dependency row duplicating the name `requests` added, `red_lines.secrets_in_code_or_notebooks_present` = true — with `failing_checks` set to exactly the 3 exact check names those changes fail: `every_dependency_version_pinned`, `no_dependency_name_duplicated`, `no_secrets_in_code_or_notebooks` (the third name, `no_dependency_name_duplicated`, was already correct in the raw design).
3. (R2) Full-pass `expect` carried no structured `computed_spot_checks` (the computed quantities appeared only in prose notes) — validator rejection: "expect.computed_spot_checks is absent, empty or not structured (a non-empty object of quantity -> expected value, or a list of {quantity, expected} objects, is required); quantities stated only in prose notes do not count". Corrected before execution: structured spot checks were injected in structured form, computed per SERVICE.md and confirmed against the Python oracle (`computed_status` `within_stated_limits_on_declared_evidence`, `dependencies_count` `1`, `dependencies_without_pin` `[]`, `pin_coverage` `"1.000000"`, `duplicate_dependency_names` `[]`).
4. (R2) Violations `expect` carried no structured `computed_spot_checks` — validator rejection: "expect.computed_spot_checks is absent, empty or not structured (a non-empty object of quantity -> expected value, or a list of {quantity, expected} objects, is required); quantities stated only in prose notes do not count". Corrected before execution: structured spot checks were injected in structured form, computed per SERVICE.md and confirmed against the Python oracle (`computed_status` `outside_stated_limits_on_declared_evidence`, `dependencies_count` `2`, `dependencies_without_pin` `["requests"]`, `pin_coverage` `"0.500000"`, `duplicate_dependency_names` `["requests"]`).
5. (R4) Malformed input carried 2 type violations — validator rejection: "malformed input carries 2 type violations (project must be a string, environment must be a object); exactly one is required so the 422 field is unambiguous". Corrected before execution: the extra violation (`project` as `12345`) was removed by setting `project` to a valid string (`Malformed Project`), keeping exactly one documented type violation (`environment` as a string where an object is required).
6. (sparse identity-only) Sparse case carried `project` plus `environment.virtualenv_per_project_used` = true, not an identity-only manifest as required (just the atom's identity/name field, `project`, per SERVICE.md); no validator rejection applied to this case. Corrected before execution: the sparse input was replaced with an identity-only manifest (`{project}` only).

The full-pass input was verified genuinely valid against the Python oracle before execution (the oracle returns all 39 checks pass on it — no correction needed).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the three primary computed checks — `dependencies_declared`, `every_dependency_version_pinned`, `no_dependency_name_duplicated` — the declared count, the row-name lists, the pin-coverage ratio under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/production-python-engineering-pack/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `dependencies_count` | 1 | 1 | ✓ |
| full-pass `dependencies_without_pin` | [] | [] | ✓ |
| full-pass `pin_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `duplicate_dependency_names` | [] | [] | ✓ |
| full-pass `computed_status` (all three computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `dependencies_count` | 2 | 2 | ✓ |
| violations `dependencies_without_pin` | ["requests"] | ["requests"] | ✓ |
| violations `pin_coverage` (1 ÷ 2) | "0.500000" | "0.500000" | ✓ |
| violations `duplicate_dependency_names` | ["requests"] | ["requests"] | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 3 planted checks | same 3 | ✓ |
| verdicts | PRODUCTION_PYTHON_ENGINEERING_PACK_READY / PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY (3 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 3-check failure set on the violations case.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `environment`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
