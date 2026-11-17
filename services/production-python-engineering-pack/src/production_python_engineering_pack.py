#!/usr/bin/env python3
"""Production Python engineering pack — deterministic core.

Built from the bound skill `python-engineering`: "Write
production Python — typing, packaging, pytest discipline,
stdlib-first, honest error handling." ("Python is the team's
rapid tool — keep it clean enough to trust in production: typed
at the edges, tested at the core, packaged properly.")

This atom is a DELIVERABLE audit of a declared production
Python engineering record: it audits the record a caller
declares against the discipline the skill defines — one
virtualenv per project with dependencies pinned in
pyproject.toml plus a lock and never installed into system
Python, public functions annotated with a type checker in the
loop and typed models at the boundaries, ruff plus a formatter
with no mutable default arguments, f-strings and pathlib,
specific exceptions with loud contextual failure and logging
never print in libraries, context managers with no orphaned
handles, async discipline with timeouts on every network call,
pytest with fixtures, parametrize, error paths and frozen
time/randomness, pyproject packaging with console entry points
and reproducible builds, and the skill's red lines refused (no
secrets in code or notebooks, no unpinned pip install in
production paths, no bare excepts). It does not write or run
Python code itself, inspect a repository, install anything, or
verify that a declared practice was ever carried out — it
checks that the engineering record the skill requires is
present and internally complete and consistent on the declared
evidence.

Distinct ground: the nearest siblings are
`backend-engineering-advice` (a backend service record —
contract-first APIs, boundary validation, idempotency, error
taxonomy, jobs/queues, observability), `data-ml-pipeline-
engineering` (a data/ML pipeline record — ingestion contracts,
lineage, splits, drift, serving) and `javascript-review-and-
build` (a JavaScript record — ESM/strictness, promises, DOM
safety, bundling). This atom shares zero checks with any of
them: every check here is a production-Python question — the
per-project virtualenv, pyproject pinning plus lockfile, typed
models at Python boundaries, mutable default arguments,
f-strings, pathlib, bare excepts, logging over print in
libraries, context managers for files/sockets/locks, pytest
fixtures/parametrize with frozen time/randomness, console
entry points, and the Python red lines. The boundary is: a
Python project's production-engineering record here; backend
service architecture, data/ML pipelines and JavaScript there.

The caller submits an engineering manifest (a dict, or JSON on
the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- dependencies: the declared `dependencies` list must be
  present (an empty list is a valid declaration — the project
  declares no third-party dependencies, consistent with the
  skill's stdlib-first posture; the skill requires no
  dependency), and every declared dependency row must declare
  its version pinned (`version_pinned` true — the skill:
  "dependencies pinned in pyproject.toml (+ lock)", "pin for
  prod", and the red line "no unpinned pip install in
  production paths");
- dependency-name ownership: no declared dependency name may
  be owned by more than one dependency row (one record per
  dependency — internal consistency of the declared rows).

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the unrounded values. That fixed serialization is what makes
the Python and TypeScript outputs byte-identical. Counts are
reported as integers (exact).

The skill states no numeric threshold at all — no coverage
percentage, no test-duration limit, no dependency count, no
type-annotation percentage — so no numeric threshold check is
invented; its demands are qualitative declarations the record
makes, quantities here are computed and reported, with
completeness (every declared dependency row pinned) as the
only bar, exactly as stated above.

Verdict:
- any fail             -> PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> PRODUCTION_PYTHON_ENGINEERING_PACK_READY

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "environment_and_dependencies",
    "typing_and_style",
    "errors_resources_and_async",
    "testing_discipline",
    "packaging_and_reproducibility",
    "red_lines",
)

MANIFEST_SPEC = {
    "project": "string",
    "environment": {
        "virtualenv_per_project_used": "boolean",
        "dependencies_declared_in_pyproject": "boolean",
        "dependency_lockfile_present": "boolean",
        "no_installs_into_system_python": "boolean",
    },
    "dependencies": [{
        "name": "string",
        "version_pinned": "boolean",
    }],
    "typing": {
        "public_functions_annotated": "boolean",
        "type_checker_run_in_loop": "boolean",
        "typed_models_at_boundaries_for_validation": "boolean",
    },
    "style": {
        "ruff_linter_configured": "boolean",
        "formatter_ruff_format_or_black_configured": "boolean",
        "no_mutable_default_arguments": "boolean",
        "f_strings_used_for_formatting": "boolean",
        "pathlib_used_over_string_paths": "boolean",
    },
    "errors": {
        "specific_exceptions_caught": "boolean",
        "errors_fail_loudly_with_context": "boolean",
        "logging_used_not_print_in_libraries": "boolean",
    },
    "resources": {
        "context_managers_used_for_files_sockets_locks": "boolean",
        "orphaned_handles_avoided": "boolean",
    },
    "async_practices": {
        "no_blocking_calls_in_event_loops": "boolean",
        "timeouts_on_every_network_call": "boolean",
        "structured_concurrency_used_where_possible": "boolean",
    },
    "testing": {
        "pytest_suite_present": "boolean",
        "pytest_fixtures_used": "boolean",
        "pytest_parametrize_used": "boolean",
        "error_paths_tested_under_pytest": "boolean",
        "time_and_randomness_frozen_in_tests": "boolean",
        "unit_tests_fast_declared": "boolean",
        "pytest_green_including_error_paths": "boolean",
    },
    "packaging": {
        "pyproject_metadata_present": "boolean",
        "console_entry_points_declared": "boolean",
        "reproducible_builds_declared": "boolean",
        "production_dependencies_pinned": "boolean",
        "ruff_and_type_checker_clean_on_diff": "boolean",
        "virtualenv_reproducible_declared": "boolean",
    },
    "red_lines": {
        "secrets_in_code_or_notebooks_present": "boolean",
        "unpinned_pip_install_in_production_paths_present": "boolean",
        "bare_except_present": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise TypeError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise TypeError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise TypeError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise TypeError(f"{path} must be an object")
        _validate_fields(value, spec, path)
        return
    raise AssertionError(f"unknown manifest spec at {path}")


def _validate_fields(obj, spec, prefix):
    for field, field_spec in spec.items():
        if field not in obj:
            continue
        value = obj[field]
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(value, field_spec, path)


def _validate_manifest(manifest):
    _validate_fields(manifest, MANIFEST_SPEC, "")


def _get(manifest, *path):
    cur = manifest
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return None, False
        cur = cur[key]
    return cur, True


def _check(results, section, name, value, present, ok, evidence):
    if not present:
        status = "missing"
    else:
        status = "pass" if ok else "fail"
    results.append(
        {"section": section, "check": name, "status": status,
         "evidence": evidence}
    )


def _bool_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is True, evidence)


def _false_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is False,
           evidence)


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _row_name(entry):
    if isinstance(entry, dict) and isinstance(entry.get("name"), str):
        return entry["name"]
    return "unnamed"


def evaluate(manifest):
    """Return the verdict dict for a production Python engineering manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    dependencies, has_dependencies = _get(manifest, "dependencies")
    dependencies_is_list = has_dependencies and isinstance(dependencies, list)
    dependencies_count = len(dependencies) if dependencies_is_list else None
    rows = dependencies if dependencies_is_list else []

    dependencies_without_pin = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "version_pinned" in c
         and c.get("version_pinned") is not True]
        if dependencies_is_list else None
    )
    duplicate_dependency_names = None
    if dependencies_is_list:
        seen = []
        duplicate_dependency_names = []
        for c in rows:
            if isinstance(c, dict) and isinstance(c.get("name"), str):
                nm = c["name"]
                if nm in seen and nm not in duplicate_dependency_names:
                    duplicate_dependency_names.append(nm)
                seen.append(nm)
    pin_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("version_pinned") is True)
        / dependencies_count
        if dependencies_is_list and dependencies_count > 0 else None
    )

    # ---- Section 1: environment_and_dependencies (skill Method
    #      1 "Environment" — one virtualenv per project,
    #      dependencies pinned in pyproject.toml (+ lock), never
    #      install into system Python; plus the computed
    #      dependency rows) ----
    _bool_check(results, "environment_and_dependencies",
                "virtualenv_per_project_used", manifest,
                ("environment", "virtualenv_per_project_used"),
                "environment: one virtualenv is used per project")
    _bool_check(results, "environment_and_dependencies",
                "dependencies_declared_in_pyproject", manifest,
                ("environment", "dependencies_declared_in_pyproject"),
                "environment: dependencies are declared in "
                "pyproject.toml")
    _bool_check(results, "environment_and_dependencies",
                "dependency_lockfile_present", manifest,
                ("environment", "dependency_lockfile_present"),
                "environment: dependencies are pinned in "
                "pyproject.toml plus a lock — a lockfile is present")
    _bool_check(results, "environment_and_dependencies",
                "no_installs_into_system_python", manifest,
                ("environment", "no_installs_into_system_python"),
                "environment: nothing is installed into system "
                "Python")
    _check(results, "environment_and_dependencies",
           "dependencies_declared", dependencies, dependencies_is_list,
           dependencies_is_list,
           "the declared record names its dependencies — the "
           "dependencies list is present; an empty list declares "
           "that the project has no third-party dependencies")
    pin_present = (
        dependencies_is_list
        and all(isinstance(c, dict) and "version_pinned" in c
                for c in rows)
    )
    _check(results, "environment_and_dependencies",
           "every_dependency_version_pinned", dependencies,
           pin_present,
           dependencies_is_list
           and all(isinstance(c, dict)
                   and c.get("version_pinned") is True
                   for c in rows),
           "dependencies: every declared dependency row declares "
           "its version pinned — dependencies are pinned and no "
           "unpinned install reaches production paths")
    dep_name_present = (
        dependencies_is_list
        and all(isinstance(c, dict) and "name" in c for c in rows)
    )
    _check(results, "environment_and_dependencies",
           "no_dependency_name_duplicated", dependencies,
           dep_name_present,
           dependencies_is_list
           and duplicate_dependency_names is not None
           and len(duplicate_dependency_names) == 0,
           "dependencies: no declared dependency name is owned "
           "by more than one dependency row")

    # ---- Section 2: typing_and_style (skill Method 2 "Typing"
    #      — annotate public functions, mypy/pyright in the loop,
    #      dataclasses/Pydantic at boundaries for validation;
    #      Method 3 "Style" — ruff + black (or ruff format), no
    #      mutable default arguments, f-strings, pathlib over
    #      string paths) ----
    _bool_check(results, "typing_and_style",
                "public_functions_annotated", manifest,
                ("typing", "public_functions_annotated"),
                "typing: public functions are annotated")
    _bool_check(results, "typing_and_style",
                "type_checker_run_in_loop", manifest,
                ("typing", "type_checker_run_in_loop"),
                "typing: mypy or pyright runs in the development "
                "loop")
    _bool_check(results, "typing_and_style",
                "typed_models_at_boundaries_for_validation", manifest,
                ("typing", "typed_models_at_boundaries_for_validation"),
                "typing: dataclasses or Pydantic models validate "
                "at the boundaries")
    _bool_check(results, "typing_and_style",
                "ruff_linter_configured", manifest,
                ("style", "ruff_linter_configured"),
                "style: ruff is configured as the linter")
    _bool_check(results, "typing_and_style",
                "formatter_ruff_format_or_black_configured", manifest,
                ("style", "formatter_ruff_format_or_black_configured"),
                "style: a formatter — ruff format or black — is "
                "configured")
    _bool_check(results, "typing_and_style",
                "no_mutable_default_arguments", manifest,
                ("style", "no_mutable_default_arguments"),
                "style: no mutable default arguments are used")
    _bool_check(results, "typing_and_style",
                "f_strings_used_for_formatting", manifest,
                ("style", "f_strings_used_for_formatting"),
                "style: f-strings are used for string formatting")
    _bool_check(results, "typing_and_style",
                "pathlib_used_over_string_paths", manifest,
                ("style", "pathlib_used_over_string_paths"),
                "style: pathlib is used over string paths")

    # ---- Section 3: errors_resources_and_async (skill Method 4
    #      "Errors" — specific exceptions, fail loudly with
    #      context, logging never print in libraries; Method 5
    #      "Resources" — context managers for files/sockets/
    #      locks, no orphaned handles; Method 6 "Async
    #      discipline" — no blocking calls in event loops,
    #      timeouts on every network call, structured
    #      concurrency where possible) ----
    _bool_check(results, "errors_resources_and_async",
                "specific_exceptions_caught", manifest,
                ("errors", "specific_exceptions_caught"),
                "errors: specific exceptions are caught, not "
                "blanket handlers")
    _bool_check(results, "errors_resources_and_async",
                "errors_fail_loudly_with_context", manifest,
                ("errors", "errors_fail_loudly_with_context"),
                "errors: failures are loud and carry context")
    _bool_check(results, "errors_resources_and_async",
                "logging_used_not_print_in_libraries", manifest,
                ("errors", "logging_used_not_print_in_libraries"),
                "errors: libraries log with the logging module — "
                "never print in libraries")
    _bool_check(results, "errors_resources_and_async",
                "context_managers_used_for_files_sockets_locks",
                manifest,
                ("resources",
                 "context_managers_used_for_files_sockets_locks"),
                "resources: context managers are used for files, "
                "sockets and locks")
    _bool_check(results, "errors_resources_and_async",
                "orphaned_handles_avoided", manifest,
                ("resources", "orphaned_handles_avoided"),
                "resources: no orphaned handles are left behind")
    _bool_check(results, "errors_resources_and_async",
                "no_blocking_calls_in_event_loops", manifest,
                ("async_practices", "no_blocking_calls_in_event_loops"),
                "async discipline: no blocking calls run in event "
                "loops")
    _bool_check(results, "errors_resources_and_async",
                "timeouts_on_every_network_call", manifest,
                ("async_practices", "timeouts_on_every_network_call"),
                "async discipline: every network call carries a "
                "timeout")
    _bool_check(results, "errors_resources_and_async",
                "structured_concurrency_used_where_possible", manifest,
                ("async_practices",
                 "structured_concurrency_used_where_possible"),
                "async discipline: structured concurrency is used "
                "where possible")

    # ---- Section 4: testing_discipline (skill Method 7 "Tests"
    #      — pytest plus fixtures plus parametrize, error paths
    #      tested, time/randomness frozen, unit tests fast; and
    #      the quality gate's pytest green including error-path
    #      tests) ----
    _bool_check(results, "testing_discipline",
                "pytest_suite_present", manifest,
                ("testing", "pytest_suite_present"),
                "tests: the test suite runs under pytest")
    _bool_check(results, "testing_discipline",
                "pytest_fixtures_used", manifest,
                ("testing", "pytest_fixtures_used"),
                "tests: pytest fixtures are used")
    _bool_check(results, "testing_discipline",
                "pytest_parametrize_used", manifest,
                ("testing", "pytest_parametrize_used"),
                "tests: pytest parametrize is used for case tables")
    _bool_check(results, "testing_discipline",
                "error_paths_tested_under_pytest", manifest,
                ("testing", "error_paths_tested_under_pytest"),
                "tests: error paths are tested, not only happy "
                "paths")
    _bool_check(results, "testing_discipline",
                "time_and_randomness_frozen_in_tests", manifest,
                ("testing", "time_and_randomness_frozen_in_tests"),
                "tests: time and randomness are frozen where the "
                "tests depend on them")
    _bool_check(results, "testing_discipline",
                "unit_tests_fast_declared", manifest,
                ("testing", "unit_tests_fast_declared"),
                "tests: unit tests are kept fast, as declared")
    _bool_check(results, "testing_discipline",
                "pytest_green_including_error_paths", manifest,
                ("testing", "pytest_green_including_error_paths"),
                "tests: pytest is green, including the error-path "
                "tests")

    # ---- Section 5: packaging_and_reproducibility (skill Method
    #      8 "Packaging" — pyproject metadata, console entry
    #      points, reproducible builds, pin for prod; and the
    #      quality gates — ruff plus type-checker clean on the
    #      diff, dependencies locked, virtualenv reproducible)
    #      ----
    _bool_check(results, "packaging_and_reproducibility",
                "pyproject_metadata_present", manifest,
                ("packaging", "pyproject_metadata_present"),
                "packaging: pyproject carries the package metadata")
    _bool_check(results, "packaging_and_reproducibility",
                "console_entry_points_declared", manifest,
                ("packaging", "console_entry_points_declared"),
                "packaging: console entry points are declared")
    _bool_check(results, "packaging_and_reproducibility",
                "reproducible_builds_declared", manifest,
                ("packaging", "reproducible_builds_declared"),
                "packaging: builds are reproducible, as declared")
    _bool_check(results, "packaging_and_reproducibility",
                "production_dependencies_pinned", manifest,
                ("packaging", "production_dependencies_pinned"),
                "packaging: dependencies are pinned for production")
    _bool_check(results, "packaging_and_reproducibility",
                "ruff_and_type_checker_clean_on_diff", manifest,
                ("packaging", "ruff_and_type_checker_clean_on_diff"),
                "quality gate: ruff and the type checker are clean "
                "on the diff")
    _bool_check(results, "packaging_and_reproducibility",
                "virtualenv_reproducible_declared", manifest,
                ("packaging", "virtualenv_reproducible_declared"),
                "quality gate: the virtualenv is reproducible, as "
                "declared")

    # ---- Section 6: red_lines (skill "Red lines" — no secrets
    #      in code or notebooks, use env/keystore; no unpinned
    #      pip install in production paths; plus Method 4 and
    #      the quality gates' no bare excepts) ----
    _false_check(results, "red_lines",
                 "no_secrets_in_code_or_notebooks", manifest,
                 ("red_lines", "secrets_in_code_or_notebooks_present"),
                 "red line: no secrets in code or notebooks are "
                 "present — secrets live in env or a keystore")
    _false_check(results, "red_lines",
                 "no_unpinned_pip_install_in_production_paths", manifest,
                 ("red_lines",
                  "unpinned_pip_install_in_production_paths_present"),
                 "red line: no unpinned pip install is present in "
                 "production paths")
    _false_check(results, "red_lines",
                 "no_bare_except_clauses", manifest,
                 ("red_lines", "bare_except_present"),
                 "red line: no bare except clauses are present")

    sections = {}
    for section in SECTIONS:
        sec_results = [r for r in results if r["section"] == section]
        if any(r["status"] == "fail" for r in sec_results):
            sections[section] = "fail"
        elif any(r["status"] == "missing" for r in sec_results):
            sections[section] = "insufficient_evidence"
        else:
            sections[section] = "pass"

    if any(v == "fail" for v in sections.values()):
        verdict = "PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "PRODUCTION_PYTHON_ENGINEERING_PACK_READY"

    computed_names = (
        "dependencies_declared",
        "every_dependency_version_pinned",
        "no_dependency_name_duplicated",
    )
    computed_statuses = [
        r["status"] for r in results if r["check"] in computed_names
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "production-python-engineering-pack",
        "atom_version": "0.1.0",
        "project": manifest.get("project"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "dependencies_count": dependencies_count,
        "dependencies_without_pin": dependencies_without_pin,
        "pin_coverage": _fmt6(pin_coverage),
        "duplicate_dependency_names": duplicate_dependency_names,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across six sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "PRODUCTION PYTHON ENGINEERING PACK",
        f"project: {verdict.get('project')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: production_python_engineering_pack.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "PRODUCTION_PYTHON_ENGINEERING_PACK_READY" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
