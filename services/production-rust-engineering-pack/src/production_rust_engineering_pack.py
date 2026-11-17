#!/usr/bin/env python3
"""Production Rust engineering pack — deterministic core.

Built from the bound skill `rust-engineering`: "Write production
Rust — ownership done right, no unwrap in prod paths, clippy-
clean, tested error paths." ("Rust's compiler is a teammate: let
it carry correctness. Use ownership as a design tool, and treat
every `unwrap` as a promise you must keep.")

This atom is a DELIVERABLE audit of a declared production Rust
engineering record: it audits the record a caller declares
against the practice the skill defines — ownership used as a
design tool, errors carried as types, unsafe forbidden by
default and isolated/documented/tested where it exists, async
with no blocking work, bounded channels and timeouts, tests
that cover the error paths, a clippy/fmt gate, minimal feature
flags, and a reviewed, MSRV-pinned supply chain — plus the
skill's red lines refused. It does not compile code, run cargo,
clippy, rustfmt or cargo-audit, inspect a repository, or verify
that declared practice was ever carried out — it checks that
the engineering record the skill requires is present and
internally complete and consistent on the declared evidence.

Distinct ground: the nearest siblings are `c-engineering-review`
(a declared C record — manual memory discipline, banned
functions, sanitizers over C code), `cpp-engineering-review`
(a declared C++ record — RAII, smart pointers, value semantics
over C++ code) and `production-python-engineering-pack` (a
declared Python record — typing, packaging and interpreter
tooling over Python code). This atom shares zero checks with
any of them: every check here is a Rust question — borrow
before cloning with lifetimes kept local and owned data at
boundaries, thiserror for libraries and anyhow for binaries
with `?` propagation and zero unwrap/expect in production
paths, unsafe forbidden by default with every declared unsafe
block's invariant documented and tested, structured tokio
tasks with bounded channels and timeouts everywhere, doc tests
and criterion benches, clippy with `-D warnings` and
`cargo fmt --check`, minimal feature flags with no default
bloat, cargo audit with a pinned MSRV, and the Rust red lines
(no blocking work inside async, no unbounded channels, no
spawn-loops without backpressure). The boundary is: a Rust
codebase's declared production practice here; C memory
discipline, C++ RAII/value semantics and Python practice there.

The caller submits an engineering manifest (a dict, or JSON on
the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- unsafe blocks: the declared `unsafe_blocks` list must be
  present (an empty list is a valid declaration — the codebase
  contains no unsafe blocks, exactly what "forbid by default"
  aims at; the skill requires no unsafe block), and every
  declared unsafe-block row must declare its invariant
  documented and tests covering it (the skill: "Every `unsafe`
  block documented + tested");
- unsafe-block location ownership: no declared unsafe-block
  location may be owned by more than one row (one record per
  block — internal consistency of the declared rows).

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the unrounded values. That fixed serialization is what makes
the Python and TypeScript outputs byte-identical. Counts are
reported as integers (exact).

The skill states no numeric threshold at all — no clone count,
no unsafe-block count, no channel capacity, no timeout value,
no coverage percentage, no crate count, no MSRV version — so
no numeric threshold check is invented; those quantities are
caller attestations at most, and quantities here are computed
and reported, with completeness (every declared unsafe-block
row) as the only bar, exactly as stated above.

Verdict:
- any fail             -> PRODUCTION_RUST_ENGINEERING_PACK_NOT_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> PRODUCTION_RUST_ENGINEERING_PACK_READY

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "ownership_and_lifetimes",
    "error_handling",
    "unsafe_discipline",
    "async_discipline",
    "testing_and_benchmarks",
    "tooling_workspace_and_supply_chain",
    "red_lines",
)

MANIFEST_SPEC = {
    "project": "string",
    "ownership": {
        "borrow_before_cloning_practised": "boolean",
        "lifetimes_kept_local": "boolean",
        "owned_data_at_boundaries_borrows_within": "boolean",
        "clones_justified_where_present": "boolean",
    },
    "errors": {
        "error_enums_used_for_fallible_apis": "boolean",
        "thiserror_used_for_library_errors": "boolean",
        "anyhow_used_for_binary_errors": "boolean",
        "question_mark_propagation_used": "boolean",
        "no_unwrap_or_expect_in_production_paths": "boolean",
        "unwrap_expect_exceptions_limited_to_tests_and_startup_with_messages": "boolean",
    },
    "unsafe_policy": {
        "unsafe_forbidden_by_default_declared": "boolean",
        "unsafe_isolated_in_dedicated_modules": "boolean",
    },
    "unsafe_blocks": [{
        "location": "string",
        "invariant_documented": "boolean",
        "tests_covering_block": "boolean",
    }],
    "async_runtime": {
        "structured_tasks_with_tokio_used": "boolean",
        "blocking_calls_absent_from_async_code": "boolean",
        "bounded_channels_used": "boolean",
        "timeouts_applied_everywhere": "boolean",
    },
    "testing": {
        "unit_tests_beside_code_present": "boolean",
        "integration_tests_in_tests_directory_present": "boolean",
        "doc_tests_for_examples_present": "boolean",
        "error_paths_tested": "boolean",
        "criterion_benchmarks_present": "boolean",
        "tests_green_including_failure_paths": "boolean",
    },
    "tooling": {
        "clippy_clean_with_deny_warnings": "boolean",
        "cargo_fmt_check_clean": "boolean",
        "lints_fixed_not_silenced_without_reason": "boolean",
    },
    "workspace": {
        "crates_split_only_at_real_boundaries": "boolean",
        "feature_flags_kept_minimal_no_default_bloat": "boolean",
    },
    "supply_chain": {
        "cargo_audit_run": "boolean",
        "msrv_pinned": "boolean",
        "new_crates_reviewed_before_adoption": "boolean",
    },
    "red_lines": {
        "blocking_work_inside_async_present": "boolean",
        "unbounded_channels_present": "boolean",
        "spawn_loops_without_backpressure_present": "boolean",
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
    if isinstance(entry, dict) and isinstance(entry.get("location"), str):
        return entry["location"]
    return "unnamed"


def evaluate(manifest):
    """Return the verdict dict for a production Rust engineering manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    blocks, has_blocks = _get(manifest, "unsafe_blocks")
    blocks_is_list = has_blocks and isinstance(blocks, list)
    blocks_count = len(blocks) if blocks_is_list else None
    rows = blocks if blocks_is_list else []

    blocks_without_invariant = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "invariant_documented" in c
         and c.get("invariant_documented") is not True]
        if blocks_is_list else None
    )
    blocks_without_tests = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "tests_covering_block" in c
         and c.get("tests_covering_block") is not True]
        if blocks_is_list else None
    )
    duplicate_block_locations = None
    if blocks_is_list:
        seen = []
        duplicate_block_locations = []
        for c in rows:
            if isinstance(c, dict) and isinstance(c.get("location"), str):
                nm = c["location"]
                if nm in seen and nm not in duplicate_block_locations:
                    duplicate_block_locations.append(nm)
                seen.append(nm)
    documented_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("invariant_documented") is True)
        / blocks_count
        if blocks_is_list and blocks_count > 0 else None
    )
    tested_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("tests_covering_block") is True)
        / blocks_count
        if blocks_is_list and blocks_count > 0 else None
    )

    # ---- Section 1: ownership_and_lifetimes (skill Method 1
    #      "Design with ownership" — borrow before cloning, keep
    #      lifetimes local, owned data at boundaries and borrows
    #      within) ----
    _bool_check(results, "ownership_and_lifetimes",
                "borrow_before_cloning_practised", manifest,
                ("ownership", "borrow_before_cloning_practised"),
                "ownership: borrow before cloning is practised")
    _bool_check(results, "ownership_and_lifetimes",
                "lifetimes_kept_local", manifest,
                ("ownership", "lifetimes_kept_local"),
                "ownership: lifetimes are kept local")
    _bool_check(results, "ownership_and_lifetimes",
                "owned_data_at_boundaries_borrows_within", manifest,
                ("ownership", "owned_data_at_boundaries_borrows_within"),
                "ownership: owned data at boundaries, borrows within")
    _bool_check(results, "ownership_and_lifetimes",
                "clones_justified_where_present", manifest,
                ("ownership", "clones_justified_where_present"),
                "ownership: every clone present is justified — "
                "borrowing was considered first")

    # ---- Section 2: error_handling (skill Method 2 "Errors are
    #      types" — enums, thiserror for libraries, anyhow for
    #      binaries, `?` propagation, no unwrap/expect on
    #      fallible paths; plus the quality gate's zero
    #      unwrap/expect in production paths) ----
    _bool_check(results, "error_handling",
                "error_enums_used_for_fallible_apis", manifest,
                ("errors", "error_enums_used_for_fallible_apis"),
                "errors: errors are types — enums carry the "
                "fallible cases")
    _bool_check(results, "error_handling",
                "thiserror_used_for_library_errors", manifest,
                ("errors", "thiserror_used_for_library_errors"),
                "errors: thiserror is used for library errors")
    _bool_check(results, "error_handling",
                "anyhow_used_for_binary_errors", manifest,
                ("errors", "anyhow_used_for_binary_errors"),
                "errors: anyhow is used for binary errors")
    _bool_check(results, "error_handling",
                "question_mark_propagation_used", manifest,
                ("errors", "question_mark_propagation_used"),
                "errors: `?` is used for propagation")
    _bool_check(results, "error_handling",
                "no_unwrap_or_expect_in_production_paths", manifest,
                ("errors", "no_unwrap_or_expect_in_production_paths"),
                "errors: zero unwrap/expect in production paths — "
                "no unwrap/expect on fallible paths")
    _bool_check(results, "error_handling",
                "unwrap_expect_exceptions_limited_to_tests_and_startup_with_messages",
                manifest,
                ("errors",
                 "unwrap_expect_exceptions_limited_to_tests_and_startup_with_messages"),
                "errors: any unwrap/expect exceptions are confined "
                "to tests and startup-time invariants, with messages")

    # ---- Section 3: unsafe_discipline (skill Method 4 "Unsafe
    #      policy" — forbid by default; where needed, isolate in
    #      a module, document the invariant, and add tests; plus
    #      the quality gate's every unsafe block documented +
    #      tested, as the computed row checks) ----
    _bool_check(results, "unsafe_discipline",
                "unsafe_forbidden_by_default_declared", manifest,
                ("unsafe_policy", "unsafe_forbidden_by_default_declared"),
                "unsafe policy: unsafe is forbidden by default")
    _bool_check(results, "unsafe_discipline",
                "unsafe_isolated_in_dedicated_modules", manifest,
                ("unsafe_policy", "unsafe_isolated_in_dedicated_modules"),
                "unsafe policy: where unsafe is needed, it is "
                "isolated in a dedicated module")
    _check(results, "unsafe_discipline",
           "unsafe_blocks_declared", blocks, blocks_is_list,
           blocks_is_list,
           "the declared record names its unsafe blocks — the "
           "unsafe_blocks list is present; an empty list declares "
           "that the codebase contains no unsafe blocks")
    invariant_present = (
        blocks_is_list
        and all(isinstance(c, dict) and "invariant_documented" in c
                for c in rows)
    )
    _check(results, "unsafe_discipline",
           "every_unsafe_block_documents_its_invariant", blocks,
           invariant_present,
           blocks_is_list
           and all(isinstance(c, dict)
                   and c.get("invariant_documented") is True
                   for c in rows),
           "unsafe blocks: every declared unsafe block documents "
           "its invariant — unsafe is a contract")
    tests_present = (
        blocks_is_list
        and all(isinstance(c, dict) and "tests_covering_block" in c
                for c in rows)
    )
    _check(results, "unsafe_discipline",
           "every_unsafe_block_has_covering_tests", blocks,
           tests_present,
           blocks_is_list
           and all(isinstance(c, dict)
                   and c.get("tests_covering_block") is True
                   for c in rows),
           "unsafe blocks: every declared unsafe block has tests "
           "covering it")
    location_present = (
        blocks_is_list
        and all(isinstance(c, dict) and "location" in c for c in rows)
    )
    _check(results, "unsafe_discipline",
           "no_unsafe_block_location_duplicated", blocks,
           location_present,
           blocks_is_list
           and duplicate_block_locations is not None
           and len(duplicate_block_locations) == 0,
           "unsafe blocks: no declared unsafe-block location is "
           "owned by more than one row")

    # ---- Section 4: async_discipline (skill Method 6 "Async" —
    #      structured tasks with tokio, no blocking calls inside
    #      async, bounded channels, timeouts everywhere) ----
    _bool_check(results, "async_discipline",
                "structured_tasks_with_tokio_used", manifest,
                ("async_runtime", "structured_tasks_with_tokio_used"),
                "async: structured tasks with tokio are used")
    _bool_check(results, "async_discipline",
                "blocking_calls_absent_from_async_code", manifest,
                ("async_runtime", "blocking_calls_absent_from_async_code"),
                "async: no blocking calls inside async code")
    _bool_check(results, "async_discipline",
                "bounded_channels_used", manifest,
                ("async_runtime", "bounded_channels_used"),
                "async: bounded channels are used")
    _bool_check(results, "async_discipline",
                "timeouts_applied_everywhere", manifest,
                ("async_runtime", "timeouts_applied_everywhere"),
                "async: timeouts are applied everywhere")

    # ---- Section 5: testing_and_benchmarks (skill Method 7
    #      "Testing" — unit tests beside code, integration tests
    #      in tests/, doc tests for examples, the error paths
    #      tested, criterion for benches; plus the quality
    #      gate's tests green including failure/error paths) ----
    _bool_check(results, "testing_and_benchmarks",
                "unit_tests_beside_code_present", manifest,
                ("testing", "unit_tests_beside_code_present"),
                "testing: unit tests sit beside the code")
    _bool_check(results, "testing_and_benchmarks",
                "integration_tests_in_tests_directory_present", manifest,
                ("testing", "integration_tests_in_tests_directory_present"),
                "testing: integration tests live in tests/")
    _bool_check(results, "testing_and_benchmarks",
                "doc_tests_for_examples_present", manifest,
                ("testing", "doc_tests_for_examples_present"),
                "testing: doc tests cover the examples")
    _bool_check(results, "testing_and_benchmarks",
                "error_paths_tested", manifest,
                ("testing", "error_paths_tested"),
                "testing: the error paths are tested")
    _bool_check(results, "testing_and_benchmarks",
                "criterion_benchmarks_present", manifest,
                ("testing", "criterion_benchmarks_present"),
                "testing: criterion is used for benchmarks")
    _bool_check(results, "testing_and_benchmarks",
                "tests_green_including_failure_paths", manifest,
                ("testing", "tests_green_including_failure_paths"),
                "testing: tests are green, including the failure "
                "and error paths")

    # ---- Section 6: tooling_workspace_and_supply_chain (skill
    #      Method 3 "Clippy gate", Method 5 "Workspaces" and
    #      Method 8 "Supply chain"; plus the quality gates'
    #      clippy clean with -D warnings and fmt clean) ----
    _bool_check(results, "tooling_workspace_and_supply_chain",
                "clippy_clean_with_deny_warnings", manifest,
                ("tooling", "clippy_clean_with_deny_warnings"),
                "clippy gate: cargo clippy is clean with "
                "-D warnings")
    _bool_check(results, "tooling_workspace_and_supply_chain",
                "cargo_fmt_check_clean", manifest,
                ("tooling", "cargo_fmt_check_clean"),
                "clippy gate: cargo fmt --check is clean")
    _bool_check(results, "tooling_workspace_and_supply_chain",
                "lints_fixed_not_silenced_without_reason", manifest,
                ("tooling", "lints_fixed_not_silenced_without_reason"),
                "clippy gate: lints are fixed, not silenced "
                "without reason")
    _bool_check(results, "tooling_workspace_and_supply_chain",
                "crates_split_only_at_real_boundaries", manifest,
                ("workspace", "crates_split_only_at_real_boundaries"),
                "workspaces: crates are split only when "
                "boundaries are real")
    _bool_check(results, "tooling_workspace_and_supply_chain",
                "feature_flags_kept_minimal_no_default_bloat", manifest,
                ("workspace", "feature_flags_kept_minimal_no_default_bloat"),
                "workspaces: feature flags are kept minimal — "
                "no default bloat")
    _bool_check(results, "tooling_workspace_and_supply_chain",
                "cargo_audit_run", manifest,
                ("supply_chain", "cargo_audit_run"),
                "supply chain: cargo audit is run")
    _bool_check(results, "tooling_workspace_and_supply_chain",
                "msrv_pinned", manifest,
                ("supply_chain", "msrv_pinned"),
                "supply chain: the MSRV is pinned")
    _bool_check(results, "tooling_workspace_and_supply_chain",
                "new_crates_reviewed_before_adoption", manifest,
                ("supply_chain", "new_crates_reviewed_before_adoption"),
                "supply chain: new crates are reviewed before "
                "adoption")

    # ---- Section 7: red_lines (skill "Red lines" — no blocking
    #      work inside async runtimes, no unbounded channels or
    #      spawn-loops without backpressure) ----
    _false_check(results, "red_lines",
                 "no_blocking_work_inside_async", manifest,
                 ("red_lines", "blocking_work_inside_async_present"),
                 "red line: no blocking work inside the async "
                 "runtime is present in the record")
    _false_check(results, "red_lines",
                 "no_unbounded_channels", manifest,
                 ("red_lines", "unbounded_channels_present"),
                 "red line: no unbounded channels are present "
                 "in the record")
    _false_check(results, "red_lines",
                 "no_spawn_loops_without_backpressure", manifest,
                 ("red_lines", "spawn_loops_without_backpressure_present"),
                 "red line: no spawn-loops without backpressure "
                 "are present in the record")

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
        verdict = "PRODUCTION_RUST_ENGINEERING_PACK_NOT_READY"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "PRODUCTION_RUST_ENGINEERING_PACK_READY"

    computed_names = (
        "unsafe_blocks_declared",
        "every_unsafe_block_documents_its_invariant",
        "every_unsafe_block_has_covering_tests",
        "no_unsafe_block_location_duplicated",
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
        "service": "production-rust-engineering-pack",
        "atom_version": "0.1.0",
        "project": manifest.get("project"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "unsafe_blocks_count": blocks_count,
        "unsafe_blocks_without_invariant": blocks_without_invariant,
        "unsafe_blocks_without_tests": blocks_without_tests,
        "documented_coverage": _fmt6(documented_coverage),
        "tested_coverage": _fmt6(tested_coverage),
        "duplicate_unsafe_block_locations": duplicate_block_locations,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across seven sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "PRODUCTION RUST ENGINEERING PACK",
        f"project: {verdict.get('project')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: production_rust_engineering_pack.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "PRODUCTION_RUST_ENGINEERING_PACK_READY" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
