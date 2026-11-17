# Test report — production-python-engineering-pack-expert

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-16
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 9595ea665b634289aad158b7fff277ac
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/production-python-engineering-pack-expert/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (project `expert-system-core`): all expert typing/idiom, packaging, async, performance, surface and testing declarations true, one hot path `matrix_multiply` profiled before optimizing with route `numpy_vectorization`, all five red-line flags false | HTTP 200, verdict `PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_READY`, `hot_paths_count` `1`, `profiled_first_coverage` `"1.000000"`, `skill_route_coverage` `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_READY`, 48 pass / 0 fail / 0 missing, all seven sections `pass`, exactly those computed values (all row-name lists `[]`) | PASS |
| 2 | violations — full manifest identical to full-pass except `red_lines.untyped_sprawling_script_present` true, `red_lines.bare_except_present` true, `hot_paths[0].profiled_before_optimizing_expert` false and `hot_paths[0].acceleration_route_expert` `invalid_route` | HTTP 200, verdict `PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_NOT_READY`, the 4 named checks fail | HTTP 200, `PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_NOT_READY`, 44 pass / 4 fail / 0 missing; failing checks exactly `expert_every_hot_path_profiled_before_optimizing`, `expert_every_hot_path_uses_skill_named_acceleration_route`, `expert_no_bare_except_clauses`, `expert_no_untyped_sprawling_scripts`; `hot_paths_count` `1`, `hot_paths_not_profiled_first` `["matrix_multiply"]`, `hot_paths_with_non_skill_route` `["matrix_multiply"]`, `duplicate_hot_path_names` `[]`, `profiled_first_coverage` `"0.000000"`, `skill_route_coverage` `"0.000000"`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `expert_performance_and_profiling` and `red_lines` `fail`, the other five `pass` | PASS |
| 3 | sparse — only `project` (`minimal-record`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 48 missing, all seven sections `insufficient_evidence`, `hot_paths_count` null, `hot_paths_not_profiled_first` null, `hot_paths_with_non_skill_route` null, `profiled_first_coverage` null, `skill_route_coverage` null, `duplicate_hot_path_names` null, `computed_status` null | PASS |
| 4 | malformed — `expert_typing: "should_be_an_object"` (string where an object is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"expert_typing","detail":"expert_typing must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `production_python_engineering_pack_expert`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 48 checks and a text stamp):

```json
{"service": "production-python-engineering-pack-expert","atom_version": "0.1.0","project": "expert-system-core","verdict": "PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_READY","sections": {"expert_typing_and_idiomatic_style": "pass","expert_packaging_and_module_boundaries": "pass","expert_async_concurrency": "pass","expert_performance_and_profiling": "pass","expert_api_and_cli_surfaces": "pass","expert_testing_and_tooling": "pass","red_lines": "pass"},"computed_status": "within_stated_limits_on_declared_evidence","hot_paths_count": 1,"hot_paths_not_profiled_first": [],"hot_paths_with_non_skill_route": [],"profiled_first_coverage": "1.000000","skill_route_coverage": "1.000000","duplicate_hot_path_names": [],"summary": "48 pass, 0 fail, 0 missing of 48 checks across seven sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok": false,"error": "invalid_input","field": "expert_typing","detail": "expert_typing must be an object"}
```

## Findings

No findings.

## Tester errors

5 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 5 rejections in total — by rule: R1 check-register ×2, R2 structured-spot-checks ×2, R3 violations-full-manifest ×1, R4 malformed-exactly-one ×0. The corrected, executed battery passed the validator (`ok: true`) before execution.

1. (R1) Violations designed `failing_checks` named the section name `red_lines` instead of an exact check name — validator rejection: "failing_checks names 'red_lines', which is not in the atom's check register (48 checks)". Corrected before execution as part of rebuilding the violations case (see item 2).
2. (R1) Violations designed `failing_checks` named the section name `expert_performance_and_profiling` instead of an exact check name — validator rejection: "failing_checks names 'expert_performance_and_profiling', which is not in the atom's check register (48 checks)". Corrected before execution: the violations case was rebuilt as a full copy of the full-pass manifest carrying exactly the planted changes — `red_lines.untyped_sprawling_script_present` = true, `red_lines.bare_except_present` = true, `hot_paths[0].profiled_before_optimizing_expert` = false, `hot_paths[0].acceleration_route_expert` = `"invalid_route"` — with `failing_checks` set to exactly the 4 exact check names those changes fail, confirmed by running the Python oracle on both inputs: `expert_every_hot_path_profiled_before_optimizing`, `expert_every_hot_path_uses_skill_named_acceleration_route`, `expert_no_bare_except_clauses`, `expert_no_untyped_sprawling_scripts`.
3. (R2) Full-pass `expect` carried no structured `computed_spot_checks` (the computed quantities appeared only in prose notes). Corrected before execution: structured spot checks were injected in structured form, computed per SERVICE.md and confirmed against the Python oracle (`computed_status` `within_stated_limits_on_declared_evidence`, `hot_paths_count` `1`, `hot_paths_not_profiled_first` `[]`, `hot_paths_with_non_skill_route` `[]`, `duplicate_hot_path_names` `[]`, `profiled_first_coverage` `"1.000000"`, `skill_route_coverage` `"1.000000"`).
4. (R2) Violations `expect` carried no structured `computed_spot_checks`. Corrected before execution: structured spot checks were injected in structured form, computed per SERVICE.md and confirmed against the Python oracle (`computed_status` `outside_stated_limits_on_declared_evidence`, `hot_paths_count` `1`, `hot_paths_not_profiled_first` `["matrix_multiply"]`, `hot_paths_with_non_skill_route` `["matrix_multiply"]`, `duplicate_hot_path_names` `[]`, `profiled_first_coverage` `"0.000000"`, `skill_route_coverage` `"0.000000"`).
5. (R3) Violations input was missing key paths present in the full-pass manifest — validator rejection: "violations input is missing key paths present in the full-pass manifest (a sparse violations input reads as missing evidence, not as failure): expert_async, expert_async.async_http_via_httpx_or_aiohttp_expert, expert_async.asyncio_used_for_async_paths_expert, expert_async.blocking_work_offloaded_to_thread_or_process_pool_expert, expert_async.no_blocking_calls_in_async_paths_expert, expert_async.taskgroup_structured_concurrency_used_expert, expert_idioms, expert_idioms.comprehensions_preferred_over_manual_loops_expert, expert_idioms.context_managers_used_for_resources_expert, expert_idioms.enumerate_and_zip_used_over_manual_indexing_expert, expert_idioms.f_strings_used_for_formatting_expert, expert_idioms.pathlib_preferred_over_os_path_expert, expert_idioms.structured_data_modelled_with_dataclasses_or_pydantic_expert, expert_packaging, expert_packaging.clear_module_boundaries_declared_expert, expert_packaging.main_guard_on_entry_modules_expert, expert_packaging.no_circular_imports_declared_expert, expert_packaging.pyproject_toml_declares_project_expert, expert_packaging.reproducible_environment_without_containers_expert, expert_packaging.requirements_pinned_expert, expert_packaging.src_layout_used_expert, expert_packaging.venv_pip_pythonpath_environment_declared_expert, expert_performance, expert_performance.cold_code_left_un_micro_optimized_expert, expert_performance.numpy_vectorization_applied_where_data_parallel_expert, expert_performance.profiler_tooling_cprofile_or_py_spy_declared_expert, expert_performance.profiling_before_optimizing_declared_expert, expert_surfaces, expert_surfaces.api_health_endpoint_provided_expert, expert_surfaces.cli_built_with_argparse_or_typer_expert, expert_surfaces.cli_pipe_friendly_output_declared_expert, expert_surfaces.cli_sane_exit_codes_declared_expert, expert_surfaces.fastapi_used_for_typed_services_expert, expert_surfaces.pydantic_contracts_on_api_boundaries_expert, expert_testing, expert_testing.coverage_measured_on_critical_path_expert, expert_testing.failures_loud_in_development_expert, expert_testing.hypothesis_property_tests_on_core_logic_expert, expert_testing.mypy_run_as_tooling_gate_expert, expert_testing.pre_commit_hooks_configured_expert, expert_testing.pytest_fixtures_and_parametrize_used_expert, expert_testing.ruff_lint_and_format_applied_expert, expert_typing, expert_typing.strict_type_checker_mode_where_feasible_expert, expert_typing.type_hints_cover_all_functions_expert, expert_typing.types_used_as_executable_documentation_expert". Corrected before execution by the same rebuild: the violations input is a deep copy of the full-pass manifest, so every key path is present and planted mutations change values only.

The full-pass input was verified genuinely valid against the Python oracle before execution (the oracle returns all 48 checks pass on it — no correction needed), and the sparse case was set to an identity-only manifest (`{project}` only, as designed). The malformed case as designed carried exactly one type violation (`expert_typing` as a string where an object is required) and needed no R4 correction.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the four primary computed hot-path checks, the declared count, the row-name lists, the duplicate-name list, the coverage ratios under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/production-python-engineering-pack-expert/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `hot_paths_count` | 1 | 1 | ✓ |
| full-pass `profiled_first_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `skill_route_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `hot_paths_not_profiled_first` / `hot_paths_with_non_skill_route` / `duplicate_hot_path_names` | [] / [] / [] | [] / [] / [] | ✓ |
| full-pass `computed_status` (all four computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `hot_paths_count` | 1 | 1 | ✓ |
| violations `hot_paths_not_profiled_first` (`matrix_multiply` profiled field false) | ["matrix_multiply"] | ["matrix_multiply"] | ✓ |
| violations `hot_paths_with_non_skill_route` (route `invalid_route`) | ["matrix_multiply"] | ["matrix_multiply"] | ✓ |
| violations `duplicate_hot_path_names` | [] | [] | ✓ |
| violations `profiled_first_coverage` (0 ÷ 1) | "0.000000" | "0.000000" | ✓ |
| violations `skill_route_coverage` (0 ÷ 1) | "0.000000" | "0.000000" | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 4 planted checks | same 4 | ✓ |
| verdicts | PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_READY / PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_NOT_READY (4 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 4-check failure set on the violations case.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `expert_typing`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
