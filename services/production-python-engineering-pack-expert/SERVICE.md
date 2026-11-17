# Production Python engineering pack expert — `production-python-engineering-pack-expert`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Write Python that a stranger can read, type-check, and trust — modern, typed, readable Python, at the expert level: strict typing, profiling before optimizing, structured concurrency, and the expert anti-patterns refused.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Product services and automation builds**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the expert Python engineering record manifest

The caller submits one JSON manifest: a declared expert-level
Python engineering record for one project, as the bound
`python-expert` skill defines it. Every field below is read by
the named section's checks. A field **absent** = evidence
missing (`INSUFFICIENT_EVIDENCE`); a field present but false /
invalid = the check fails
(`PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_NOT_READY`). All
fields are booleans unless noted.

| Field | Read by |
|---|---|
| `project` (string; carried into the verdict output, not itself checked) | — |
| `expert_typing.type_hints_cover_all_functions_expert` (boolean) | expert_typing_and_idiomatic_style |
| `expert_typing.strict_type_checker_mode_where_feasible_expert` (boolean) | expert_typing_and_idiomatic_style |
| `expert_typing.types_used_as_executable_documentation_expert` (boolean) | expert_typing_and_idiomatic_style |
| `expert_idioms.structured_data_modelled_with_dataclasses_or_pydantic_expert` (boolean) | expert_typing_and_idiomatic_style |
| `expert_idioms.pathlib_preferred_over_os_path_expert` (boolean) | expert_typing_and_idiomatic_style |
| `expert_idioms.f_strings_used_for_formatting_expert` (boolean) | expert_typing_and_idiomatic_style |
| `expert_idioms.context_managers_used_for_resources_expert` (boolean) | expert_typing_and_idiomatic_style |
| `expert_idioms.enumerate_and_zip_used_over_manual_indexing_expert` (boolean) | expert_typing_and_idiomatic_style |
| `expert_idioms.comprehensions_preferred_over_manual_loops_expert` (boolean) | expert_typing_and_idiomatic_style |
| `expert_packaging.venv_pip_pythonpath_environment_declared_expert` (boolean) | expert_packaging_and_module_boundaries |
| `expert_packaging.pyproject_toml_declares_project_expert` (boolean) | expert_packaging_and_module_boundaries |
| `expert_packaging.requirements_pinned_expert` (boolean) | expert_packaging_and_module_boundaries |
| `expert_packaging.reproducible_environment_without_containers_expert` (boolean) | expert_packaging_and_module_boundaries |
| `expert_packaging.src_layout_used_expert` (boolean) | expert_packaging_and_module_boundaries |
| `expert_packaging.clear_module_boundaries_declared_expert` (boolean) | expert_packaging_and_module_boundaries |
| `expert_packaging.no_circular_imports_declared_expert` (boolean) | expert_packaging_and_module_boundaries |
| `expert_packaging.main_guard_on_entry_modules_expert` (boolean) | expert_packaging_and_module_boundaries |
| `expert_async.asyncio_used_for_async_paths_expert` (boolean) | expert_async_concurrency |
| `expert_async.taskgroup_structured_concurrency_used_expert` (boolean) | expert_async_concurrency |
| `expert_async.no_blocking_calls_in_async_paths_expert` (boolean) | expert_async_concurrency |
| `expert_async.blocking_work_offloaded_to_thread_or_process_pool_expert` (boolean) | expert_async_concurrency |
| `expert_async.async_http_via_httpx_or_aiohttp_expert` (boolean) | expert_async_concurrency |
| `expert_performance.profiling_before_optimizing_declared_expert` (boolean) | expert_performance_and_profiling |
| `expert_performance.profiler_tooling_cprofile_or_py_spy_declared_expert` (boolean) | expert_performance_and_profiling |
| `expert_performance.numpy_vectorization_applied_where_data_parallel_expert` (boolean) | expert_performance_and_profiling |
| `expert_performance.cold_code_left_un_micro_optimized_expert` (boolean) | expert_performance_and_profiling |
| `hot_paths` (list of hot-path-row objects, each with the entry fields below; computed, see below) | expert_performance_and_profiling |
| `hot_paths[].name` (string; names the row in the computed outputs) | expert_performance_and_profiling |
| `hot_paths[].profiled_before_optimizing_expert` (boolean; must be `true` per row — profile before optimizing) | expert_performance_and_profiling |
| `hot_paths[].acceleration_route_expert` (string; must be one of the skill-named routes `rust_pyo3`, `c_extension`, `numpy_vectorization` per row) | expert_performance_and_profiling |
| `expert_surfaces.fastapi_used_for_typed_services_expert` (boolean) | expert_api_and_cli_surfaces |
| `expert_surfaces.pydantic_contracts_on_api_boundaries_expert` (boolean) | expert_api_and_cli_surfaces |
| `expert_surfaces.api_health_endpoint_provided_expert` (boolean) | expert_api_and_cli_surfaces |
| `expert_surfaces.cli_built_with_argparse_or_typer_expert` (boolean) | expert_api_and_cli_surfaces |
| `expert_surfaces.cli_sane_exit_codes_declared_expert` (boolean) | expert_api_and_cli_surfaces |
| `expert_surfaces.cli_pipe_friendly_output_declared_expert` (boolean) | expert_api_and_cli_surfaces |
| `expert_testing.pytest_fixtures_and_parametrize_used_expert` (boolean) | expert_testing_and_tooling |
| `expert_testing.hypothesis_property_tests_on_core_logic_expert` (boolean) | expert_testing_and_tooling |
| `expert_testing.coverage_measured_on_critical_path_expert` (boolean) | expert_testing_and_tooling |
| `expert_testing.ruff_lint_and_format_applied_expert` (boolean) | expert_testing_and_tooling |
| `expert_testing.mypy_run_as_tooling_gate_expert` (boolean) | expert_testing_and_tooling |
| `expert_testing.pre_commit_hooks_configured_expert` (boolean) | expert_testing_and_tooling |
| `expert_testing.failures_loud_in_development_expert` (boolean) | expert_testing_and_tooling |
| `red_lines.untyped_sprawling_script_present` (boolean; must be `false` to pass — skill anti-pattern) | red_lines |
| `red_lines.mutable_default_arguments_present` (boolean; must be `false` to pass — skill anti-pattern) | red_lines |
| `red_lines.bare_except_present` (boolean; must be `false` to pass — skill anti-pattern) | red_lines |
| `red_lines.hidden_global_state_present` (boolean; must be `false` to pass — skill anti-pattern) | red_lines |
| `red_lines.docker_used_to_paper_over_venv_problem_present` (boolean; must be `false` to pass — skill anti-pattern) | red_lines |

Several checks are computed from the declared rows, using only
the skill's own stated rules plus the consistency of the
declared record itself — no outside threshold is imported:

- **Hot paths declared:** the declared `hot_paths` list passes
  when it is present. An absent list is missing evidence. An
  empty list passes: it declares that the record has no hot
  paths, and the skill requires no hot path.
- **Profiled before optimizing per hot path:** every declared
  hot-path row must declare `profiled_before_optimizing_expert`
  true (the skill: "Profile (cProfile, py-spy) before
  optimizing"). A row with the field absent is missing
  evidence; a row declaring false fails. On an empty list the
  check passes vacuously.
- **Skill-named acceleration route per hot path:** every
  declared hot-path row must name an `acceleration_route_expert`
  that is exactly one of the routes the skill itself names —
  `rust_pyo3` or `c_extension` (the skill: push hot loops to
  Rust (pyo3) or C) or `numpy_vectorization` (the skill:
  vectorize with numpy). A row with the field absent is
  missing evidence; any other value, including an empty
  string, fails. On an empty list the check passes vacuously.
- **No hot-path name duplicated:** no declared hot-path `name`
  may appear on more than one hot-path row. A row with `name`
  absent is missing evidence for this check.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the four primary computed checks above cannot be completed),
`hot_paths_count` (the declared list length, or null when the
list is not declared — counts are reported as integers,
exactly), the row-name lists `hot_paths_not_profiled_first`
(hot paths whose profiling field is present but not true; a
hot path with the field absent is missing evidence and does
not appear) and `hot_paths_with_non_skill_route` (hot paths
whose route field is present but is not one of the three
skill-named routes), `duplicate_hot_path_names` (hot-path
names declared on more than one row, in the order their second
occurrence appears), and the coverage ratios
`profiled_first_coverage` (hot paths profiled first ÷ declared
hot paths) and `skill_route_coverage` (hot paths naming a
skill route ÷ declared hot paths).
**Fixed serialization rule:** computed ratios are reported as
strings with exactly six decimal places, produced in both
implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six
decimals; comparisons use the unrounded values. A ratio is null
when its denominator list is absent or empty. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical.

The skill states **no numeric threshold at all** — its demands
are qualitative declarations the record makes, not bars the
atom can set. Quantities are computed and reported; the only
bar on the computed rows is completeness over the caller's own
declared rows, exactly as stated above. Declined thresholds,
named: a type-hint coverage percentage or a count of untyped
functions; a strictness level beyond the skill's "strict where
feasible" declaration; a profiling duration, sample count, or
required speedup factor before a hot path counts as optimized;
a numpy/Rust/C performance gain percentage; a coverage
percentage for the critical path (the skill says coverage is
measured there, never a number); a number of hypothesis
examples or property tests; a number of pre-commit hooks or
ruff/mypy findings tolerated; a response-time or throughput
figure for the FastAPI surface or its `/api/health` endpoint;
specific exit-code values beyond CLIs declaring sane exit
codes; a Python, mypy/pyright, ruff, or dependency version
number (only that requirements are pinned is checked); a
module count, file size, or circular-import count beyond the
declaration that boundaries are clear and no circular imports
exist.

The verdict is one of
`PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_READY` (all 48
checks pass),
`PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_NOT_READY` (any
check fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but
evidence is missing), across seven sections:
expert_typing_and_idiomatic_style,
expert_packaging_and_module_boundaries,
expert_async_concurrency, expert_performance_and_profiling,
expert_api_and_cli_surfaces, expert_testing_and_tooling,
red_lines.

## Distinct ground

The nearest sibling is the base
`production-python-engineering-pack`, built in parallel from
the `python-engineering` skill — the production basics: one
virtualenv per project with dependencies pinned in
`pyproject.toml` (+ lock), annotating public functions,
mypy/pyright in the loop, dataclasses/Pydantic at boundaries,
ruff + black style, specific exceptions and honest error
handling, logging over print, context managers, timeouts on
network calls, pytest discipline (error paths, frozen
time/randomness, fast unit tests), `pyproject` metadata and
console entry points, and its red lines (no secrets in code,
no unpinned pip installs). This atom is built **only** from
the `python-expert` skill's distinct advanced material, and
every manifest field and check name is named for that material
so the two packs cannot collide: type hints on **all**
functions (not only public ones) with **strict** mypy/pyright
where feasible and types as executable documentation;
enumerate/zip and comprehensions over manual loops; packaging
Nrupal's way — venv + pip + **PYTHONPATH**, pinned
**requirements**, reproducible **without containers**, **src/
layout**, clear module boundaries, **no circular imports**,
`__main__` guards; **TaskGroup** structured concurrency with
blocking work pushed to a **thread/process pool** and
**httpx/aiohttp** async IO; **profiling before optimizing**
with **cProfile/py-spy**, **numpy vectorization**, hot loops
pushed to **Rust (pyo3) or C**, cold code never
micro-optimized; **FastAPI** with an **`/api/health`**
endpoint, **argparse/typer** CLIs with sane exit codes and
pipe-friendly output; **hypothesis** property-based tests on
core logic, coverage on the critical path, **pre-commit**;
and the expert anti-patterns the base skill does not carry —
untyped sprawling scripts, hidden global state, and Docker
reached for to paper over a venv problem. Zero shared check
names across the pair was verified mechanically at authoring
time by comparing every check name here against the base
pack's Python source as it stood in parallel (no
intersection), and the coordinator re-verifies mechanically
at integration.

Also compared: `c-engineering-review` and
`cpp-engineering-review` (handlers in the gateway). This atom
shares **zero checks** with either (verified mechanically by
comparing every check name here against every check name in
both atoms' sources — 30 C checks and 34 C++ checks, no
intersection): those review C/C++ code — memory ownership and
allocation discipline, undefined behaviour, banned functions,
sanitizers, RAII, smart pointers, move semantics, templates —
while this atom audits a declared expert-Python record —
strict typing, TaskGroup concurrency, profiling-first hot
paths, and Python tooling. The boundary is: an expert-level
Python project's declared record here; C/C++ diff review and
the base production-Python pack there.

## Honest scoping

This atom reviews a **declared** expert Python engineering
record — it runs no code, type checker, profiler, linter, or
test suite, inspects no repository, and does not verify that
a declared practice was ever carried out. A record is ready
*on the caller's declared evidence*: a record that declares
strict typing, profiled-first hot paths, and no bare excepts
passes those checks even if the real project did none of it.
It is a completeness and consistency audit of the record the
skill requires, **not a code review, a profiling service, a
performance guarantee, or a judgment that the code is good**:
it never judges whether a named hot path is really hot,
whether the declared profiler output justified the route
chosen, whether the strict typing is genuinely feasible
further, or whether the design is sound — only that the
record contains what the skill's method and refused
anti-patterns demand, and that its declared hot-path rows are
internally consistent.

Named exclusions and non-reducible parts (carried as caller
declarations only, never judged): no numeric thresholds at
all (see the declined list above); no live verification of
any declared fact; no judgment of code *quality* — whether
the typing, concurrency design, or optimizations are adequate
for the real project is the caller's declaration, checked
only for declared presence and consistency; the skill's named
tools (mypy/pyright, ruff, cProfile, py-spy, hypothesis,
FastAPI, httpx/aiohttp, argparse/typer) are checked only as
the declarations the skill states — this atom runs none of
them and takes no position on their current versions or
configuration.

## U-13 regulatory screen

No: this atom's output could not read as regulated
professional advice — it audits a declared software-engineering
record for completeness and consistency against a Python
craft skill; it offers no engineering-practice (APEGA),
securities/financial, medical, psychological, or legal advice.
It is a software-engineering title of the kind that stayed
live at the U-13 census pending the owner's review; that
status is flagged factually here, and the atom does not
self-park on the keyword alone.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally — NOT deployed** —
deterministic core, Python oracle and TypeScript port built
and parity-proven locally; no endpoint is live. Release
happens one by one, by the owner's GO, per the approved queue.
