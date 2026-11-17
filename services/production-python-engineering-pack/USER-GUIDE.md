# Production python engineering pack — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have a Python project — a service, script, automation, data tool or API hardened for production — and a record of its production-engineering discipline. This atom reads one declared manifest and returns one deterministic verdict across six sections (environment_and_dependencies, typing_and_style, errors_resources_and_async, testing_discipline, packaging_and_reproducibility, red_lines): **PRODUCTION_PYTHON_ENGINEERING_PACK_READY**, **PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It runs 39 checks. It audits the declared production Python engineering record's completeness and consistency only — it writes no Python itself, runs no interpreter, linter, type checker or test suite, inspects no repository, virtualenv, lockfile or notebook, and does not verify that a declared practice was ever carried out. A project is ready *on your declared evidence*: it never judges whether the annotations are accurate, whether the pinned versions are safe or current, whether the tests are meaningful, or whether the code is good. The computed checks: the declared `dependencies` list must be present (an empty list passes — it declares no third-party dependencies, consistent with the skill's stdlib-first posture); every declared dependency row must declare `version_pinned` true; and no declared dependency `name` may appear on more than one row. The skill states no numeric threshold at all, and none is imposed — no test-coverage percentage (error paths tested and pytest green are checked, never a coverage figure), no unit-test duration or suite runtime limit for "fast", no type-annotation percentage, no number of dependencies a project may declare and no dependency age, licence or vulnerability bar, no specific Python, mypy, pyright, ruff, black or pytest version, no network-call timeout value in seconds, no lockfile format or hash standard beyond a lock being present, no build-reproducibility standard beyond builds being reproducible as declared, no formatter line length or other style metric, and no count of entry points, modules or functions. Quantities are computed and reported; the only bar on the computed rows is completeness over your own declared rows. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "production-python-engineering-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/production-python-engineering-pack` — tool name `production_python_engineering_pack`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/production-python-engineering-pack` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `project` | Project name (string; carried into the output, not checked) |
| `environment.virtualenv_per_project_used` | environment evidence: one virtualenv is used per project |
| `environment.dependencies_declared_in_pyproject` | environment evidence: dependencies are declared in pyproject.toml |
| `environment.dependency_lockfile_present` | environment evidence: a dependency lockfile is present |
| `environment.no_installs_into_system_python` | environment evidence: nothing is installed into system Python |
| `dependencies` (list of dependency-row objects) | computed: must be present; an empty list declares no third-party dependencies; reported as `dependencies_count` |
| `dependencies[].name` (string) | names the row in the computed outputs; computed: no name may appear on more than one row |
| `dependencies[].version_pinned` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `dependencies_without_pin` |
| `typing.public_functions_annotated` | typing evidence: public functions are annotated |
| `typing.type_checker_run_in_loop` | typing evidence: a type checker (mypy/pyright) runs in the development loop |
| `typing.typed_models_at_boundaries_for_validation` | typing evidence: typed models (dataclasses/Pydantic) validate at the boundaries |
| `style.ruff_linter_configured` | style evidence: ruff is configured as the linter |
| `style.formatter_ruff_format_or_black_configured` | style evidence: a formatter — ruff format or black — is configured |
| `style.no_mutable_default_arguments` | style evidence: no mutable default arguments are used |
| `style.f_strings_used_for_formatting` | style evidence: f-strings are used for string formatting |
| `style.pathlib_used_over_string_paths` | style evidence: pathlib is used over string paths |
| `errors.specific_exceptions_caught` | errors evidence: specific exceptions are caught |
| `errors.errors_fail_loudly_with_context` | errors evidence: errors fail loudly with context |
| `errors.logging_used_not_print_in_libraries` | errors evidence: logging is used, not print, in libraries |
| `resources.context_managers_used_for_files_sockets_locks` | resources evidence: context managers are used for files, sockets and locks |
| `resources.orphaned_handles_avoided` | resources evidence: orphaned handles are avoided |
| `async_practices.no_blocking_calls_in_event_loops` | async evidence: no blocking calls run in event loops |
| `async_practices.timeouts_on_every_network_call` | async evidence: every network call carries a timeout |
| `async_practices.structured_concurrency_used_where_possible` | async evidence: structured concurrency is used where possible |
| `testing.pytest_suite_present` | testing evidence: a pytest suite is present |
| `testing.pytest_fixtures_used` | testing evidence: pytest fixtures are used |
| `testing.pytest_parametrize_used` | testing evidence: pytest parametrize is used |
| `testing.error_paths_tested_under_pytest` | testing evidence: error paths are tested under pytest |
| `testing.time_and_randomness_frozen_in_tests` | testing evidence: time and randomness are frozen in tests |
| `testing.unit_tests_fast_declared` | testing evidence: unit tests are declared fast |
| `testing.pytest_green_including_error_paths` | testing evidence: pytest is green, including error paths |
| `packaging.pyproject_metadata_present` | packaging evidence: pyproject metadata is present |
| `packaging.console_entry_points_declared` | packaging evidence: console entry points are declared |
| `packaging.reproducible_builds_declared` | packaging evidence: reproducible builds are declared |
| `packaging.production_dependencies_pinned` | packaging evidence: production dependencies are pinned |
| `packaging.ruff_and_type_checker_clean_on_diff` | packaging evidence: ruff and the type checker are clean on the diff |
| `packaging.virtualenv_reproducible_declared` | packaging evidence: the virtualenv is declared reproducible |
| `red_lines.secrets_in_code_or_notebooks_present` | must be `false` to pass (red line: no secrets in code or notebooks) |
| `red_lines.unpinned_pip_install_in_production_paths_present` | must be `false` to pass (red line: no unpinned pip install in production paths) |
| `red_lines.bare_except_present` | must be `false` to pass (red line: no bare except clauses) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/production-python-engineering-pack`:

```json
{
  "project": "test-project",
  "environment": {
    "virtualenv_per_project_used": true,
    "dependencies_declared_in_pyproject": true,
    "dependency_lockfile_present": true,
    "no_installs_into_system_python": true
  },
  "dependencies": [
    {
      "name": "requests",
      "version_pinned": true
    }
  ],
  "typing": {
    "public_functions_annotated": true,
    "type_checker_run_in_loop": true,
    "typed_models_at_boundaries_for_validation": true
  },
  "style": {
    "ruff_linter_configured": true,
    "formatter_ruff_format_or_black_configured": true,
    "no_mutable_default_arguments": true,
    "f_strings_used_for_formatting": true,
    "pathlib_used_over_string_paths": true
  },
  "errors": {
    "specific_exceptions_caught": true,
    "errors_fail_loudly_with_context": true,
    "logging_used_not_print_in_libraries": true
  },
  "resources": {
    "context_managers_used_for_files_sockets_locks": true,
    "orphaned_handles_avoided": true
  },
  "async_practices": {
    "no_blocking_calls_in_event_loops": true,
    "timeouts_on_every_network_call": true,
    "structured_concurrency_used_where_possible": true
  },
  "testing": {
    "pytest_suite_present": true,
    "pytest_fixtures_used": true,
    "pytest_parametrize_used": true,
    "error_paths_tested_under_pytest": true,
    "time_and_randomness_frozen_in_tests": true,
    "unit_tests_fast_declared": true,
    "pytest_green_including_error_paths": true
  },
  "packaging": {
    "pyproject_metadata_present": true,
    "console_entry_points_declared": true,
    "reproducible_builds_declared": true,
    "production_dependencies_pinned": true,
    "ruff_and_type_checker_clean_on_diff": true,
    "virtualenv_reproducible_declared": true
  },
  "red_lines": {
    "secrets_in_code_or_notebooks_present": false,
    "unpinned_pip_install_in_production_paths_present": false,
    "bare_except_present": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 39 checks and a text stamp of the verdict):

```json
{
  "service": "production-python-engineering-pack",
  "atom_version": "0.1.0",
  "project": "test-project",
  "verdict": "PRODUCTION_PYTHON_ENGINEERING_PACK_READY",
  "sections": {
    "environment_and_dependencies": "pass",
    "typing_and_style": "pass",
    "errors_resources_and_async": "pass",
    "testing_discipline": "pass",
    "packaging_and_reproducibility": "pass",
    "red_lines": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "dependencies_count": 1,
  "dependencies_without_pin": [],
  "pin_coverage": "1.000000",
  "duplicate_dependency_names": [],
  "summary": "39 pass, 0 fail, 0 missing of 39 checks across six sections."
}
```

## Verdicts

- **PRODUCTION_PYTHON_ENGINEERING_PACK_READY** — every check passes; the declared production Python engineering record is complete and consistent with the skill's checklist and red lines.
- **PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `dependencies_count` (the declared list length as an integer, or null when the list is not declared), the row-name list `dependencies_without_pin` (dependencies whose pin field is present but not true; a dependency with the field absent is missing evidence and does not appear; null when the list is not declared), `duplicate_dependency_names` (dependency names declared on more than one row, in the order their second occurrence appears; null when the list is not declared), the coverage value `pin_coverage` (dependencies declaring a pinned version ÷ declared dependencies, as a string with exactly six decimal places; null when the denominator list is absent or empty), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the three primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
