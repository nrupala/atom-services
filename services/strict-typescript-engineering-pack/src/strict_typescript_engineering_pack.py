#!/usr/bin/env python3
"""Strict TypeScript engineering pack — deterministic core.

Built from the bound skill `typescript-engineering`: "Write
production TypeScript — strict mode, no any, typed boundaries
with schemas, small honest modules." ("Types are executable
documentation: make illegal states unrepresentable, validate
at the edges, and trust the compiler inside.")

This atom is a DELIVERABLE audit of a declared strict
TypeScript engineering record: it audits the record a caller
declares against the discipline the skill defines — strict
mode always (``"strict": true`` plus
``noUncheckedIndexedAccess``, ``tsc --noEmit`` in the loop and
clean under strict), no ``any`` (``unknown`` narrowed, casts
avoided or justified, no non-null ``!`` chains), typed
boundaries validated with a schema (parse, don't trust) with
every declared boundary row schema-validated and
schema-tested, states modelled as discriminated unions with
exhaustive ``switch`` and a ``never`` check, small module
files with deep imports over cycle-hiding barrel files and
explicit public surfaces with every declared module row
any-free and carrying an explicit public surface, async
discipline (all promises awaited or handled under a lint rule,
no floating promises, ``AbortController`` for cancellable
work), vitest unit tests for logic, integration tests at the
module edges and types tested by compilation, and a build
using tsc for types with esbuild/vite for bundling, source
maps on, dependencies pinned and lint clean — plus the
skill's red lines refused (no ``ts-ignore`` /
``ts-expect-error`` without a tracked reason, no runtime
shapes assumed that were not validated, and the skill's
anti-patterns: ``any`` in ``src/`` and floating promises).
It does not compile TypeScript, lint or review live code,
inspect a repository, run tsc, vitest or a bundler, or verify
that declared practice was ever carried out — it checks that
the strict TypeScript engineering record the skill requires
is present and internally complete and consistent on the
declared evidence.

Distinct ground: the nearest siblings are the production
Python packs (base and expert — virtualenv/pyproject/pytest
practice), the production Rust packs (base and expert —
ownership, lifetimes, unsafe/FFI practice),
`javascript-review-and-build` (plain JavaScript: ESM, DOM
safety, bundling without a type system), `c-engineering-review`
and `cpp-engineering-review` (C/C++ memory and value-semantics
practice). This atom shares ZERO check names with any of them
(verified mechanically over every oracle's evaluate({})
register): every check here is a TypeScript-specific question
— tsconfig strictness and strict-flag coverage, ``any`` /
``unknown`` / cast / non-null-assertion discipline, schema-
validated TypeScript boundaries, discriminated unions with a
``never`` exhaustiveness check, and TypeScript module rows.
The boundary is: a strict TypeScript codebase's declared
record here; Python, Rust, plain JavaScript, C and C++
practice in their own atoms.

The caller submits an engineering manifest (a dict, or JSON
on the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus
the consistency of the declared rows themselves — no outside
threshold is imported:

- boundaries: the declared `boundaries` list must be present
  (an empty list is a valid declaration — the codebase
  declares no external boundaries; the skill requires no
  boundary), and every declared boundary row must declare
  schema validation and schema testing (the skill: "validate
  external input ... with a schema — parse, don't trust" and
  the quality gate "boundary schemas exist and are tested");
- modules: the declared `modules` list must be present (an
  empty list is a valid declaration — no module rows are
  declared), and every declared module row must declare it is
  any-free and carries an explicit public surface (the skill:
  "No `any` in `src/`" and "explicit public surfaces");
- row-name ownership: no declared boundary or module name may
  be owned by more than one row (one record per row —
  internal consistency of the declared rows);
- strict-flag coverage: the two skill-named strict flags
  (`strict` and `noUncheckedIndexedAccess`) are counted when
  both are declared; the ratio is reported, with no bar
  beyond the two boolean checks themselves.

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons
use the unrounded values. That fixed serialization is what
makes the Python and TypeScript outputs byte-identical.
Counts are reported as integers (exact).

The skill states no numeric threshold at all — no file-size
limit for "small" files, no cast count, no coverage
percentage, no bundle budget — so no numeric threshold check
is invented; quantities are computed and reported, with
completeness (every declared boundary/module row) as the
only bar, exactly as stated above.

Verdict:
- any fail             -> STRICT_TYPESCRIPT_ENGINEERING_PACK_NOT_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> STRICT_TYPESCRIPT_ENGINEERING_PACK_READY

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism
is the product.
"""
import json
import math
import sys

SECTIONS = (
    "strict_tsconfig_and_compiler_gate",
    "typing_discipline_no_any",
    "typed_boundaries_and_schema_validation",
    "state_modelling_with_discriminated_unions",
    "module_structure_and_declared_modules",
    "async_and_cancellation_discipline",
    "tests_build_and_tooling",
    "typescript_red_lines",
)

MANIFEST_SPEC = {
    "project": "string",
    "tsconfig": {
        "strict_true_enabled": "boolean",
        "no_unchecked_indexed_access_enabled": "boolean",
        "tsc_no_emit_in_development_loop": "boolean",
        "tsc_no_emit_clean_under_strict": "boolean",
    },
    "typing": {
        "unknown_used_and_narrowed_instead_of_any": "boolean",
        "no_any_in_src": "boolean",
        "casts_avoided_or_remaining_justified": "boolean",
        "non_null_assertion_chains_absent": "boolean",
    },
    "boundary_validation": {
        "external_input_validated_with_schema": "boolean",
        "parse_not_trust_at_edges": "boolean",
    },
    "boundaries": [{
        "name": "string",
        "schema_validated": "boolean",
        "schema_tested": "boolean",
    }],
    "state_modelling": {
        "discriminated_unions_for_status_machines": "boolean",
        "exhaustive_switch_with_never_check": "boolean",
        "illegal_states_unrepresentable_by_design": "boolean",
    },
    "module_structure": {
        "small_files_kept": "boolean",
        "deep_imports_preferred_over_barrel_files": "boolean",
        "explicit_public_surfaces": "boolean",
    },
    "modules": [{
        "name": "string",
        "any_free": "boolean",
        "explicit_public_surface": "boolean",
    }],
    "async_practices": {
        "all_promises_awaited_or_handled": "boolean",
        "no_floating_promises": "boolean",
        "promise_handling_lint_rule_enabled": "boolean",
        "abort_controller_for_cancellable_work": "boolean",
    },
    "testing": {
        "unit_tests_for_logic_with_vitest": "boolean",
        "integration_tests_at_module_edges": "boolean",
        "types_tested_by_compilation": "boolean",
    },
    "build_tooling": {
        "tsc_for_types_and_bundler_for_bundling": "boolean",
        "source_maps_enabled": "boolean",
        "dependencies_pinned": "boolean",
        "lint_clean": "boolean",
    },
    "red_lines": {
        "ts_ignore_or_ts_expect_error_without_tracked_reason_present": "boolean",
        "unvalidated_runtime_shapes_assumed_present": "boolean",
        "any_in_src_present": "boolean",
        "floating_promises_present": "boolean",
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


def _duplicates(rows):
    seen = []
    dups = []
    for c in rows:
        if isinstance(c, dict) and isinstance(c.get("name"), str):
            nm = c["name"]
            if nm in seen and nm not in dups:
                dups.append(nm)
            seen.append(nm)
    return dups


def _without(rows, field):
    return [_row_name(c) for c in rows
            if isinstance(c, dict) and field in c
            and c.get(field) is not True]


def _coverage(rows, field, count):
    if count is None or count == 0:
        return None
    return sum(1 for c in rows if isinstance(c, dict)
               and c.get(field) is True) / count


def evaluate(manifest):
    """Return the verdict dict for a strict TypeScript manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    boundaries, has_boundaries = _get(manifest, "boundaries")
    boundaries_is_list = has_boundaries and isinstance(boundaries, list)
    boundaries_count = len(boundaries) if boundaries_is_list else None
    brows = boundaries if boundaries_is_list else []

    modules, has_modules = _get(manifest, "modules")
    modules_is_list = has_modules and isinstance(modules, list)
    modules_count = len(modules) if modules_is_list else None
    mrows = modules if modules_is_list else []

    boundaries_without_schema = (
        _without(brows, "schema_validated") if boundaries_is_list else None)
    boundaries_without_schema_tests = (
        _without(brows, "schema_tested") if boundaries_is_list else None)
    duplicate_boundary_names = (
        _duplicates(brows) if boundaries_is_list else None)
    modules_not_any_free = (
        _without(mrows, "any_free") if modules_is_list else None)
    modules_without_explicit_surface = (
        _without(mrows, "explicit_public_surface")
        if modules_is_list else None)
    duplicate_module_names = (
        _duplicates(mrows) if modules_is_list else None)

    schema_validation_coverage = _coverage(
        brows, "schema_validated", boundaries_count) \
        if boundaries_is_list else None
    schema_test_coverage = _coverage(
        brows, "schema_tested", boundaries_count) \
        if boundaries_is_list else None
    any_free_coverage = _coverage(
        mrows, "any_free", modules_count) if modules_is_list else None
    explicit_surface_coverage = _coverage(
        mrows, "explicit_public_surface", modules_count) \
        if modules_is_list else None

    strict_val, strict_present = _get(
        manifest, "tsconfig", "strict_true_enabled")
    nui_val, nui_present = _get(
        manifest, "tsconfig", "no_unchecked_indexed_access_enabled")
    strict_flag_coverage = None
    if strict_present and nui_present:
        strict_flag_coverage = (
            (1 if strict_val is True else 0)
            + (1 if nui_val is True else 0)) / 2

    # ---- Section 1: strict_tsconfig_and_compiler_gate ----
    _bool_check(results, "strict_tsconfig_and_compiler_gate",
                "ts_strict_true_enabled", manifest,
                ("tsconfig", "strict_true_enabled"),
                "strict tsconfig: strict mode is always on - "
                "the tsconfig declares strict true")
    _bool_check(results, "strict_tsconfig_and_compiler_gate",
                "ts_no_unchecked_indexed_access_enabled", manifest,
                ("tsconfig", "no_unchecked_indexed_access_enabled"),
                "strict tsconfig: noUncheckedIndexedAccess is "
                "enabled alongside strict")
    _bool_check(results, "strict_tsconfig_and_compiler_gate",
                "ts_tsc_no_emit_in_loop", manifest,
                ("tsconfig", "tsc_no_emit_in_development_loop"),
                "strict tsconfig: tsc --noEmit runs in the "
                "development loop")
    _bool_check(results, "strict_tsconfig_and_compiler_gate",
                "ts_tsc_no_emit_clean_under_strict", manifest,
                ("tsconfig", "tsc_no_emit_clean_under_strict"),
                "quality gate: tsc --noEmit is clean under strict")

    # ---- Section 2: typing_discipline_no_any ----
    _bool_check(results, "typing_discipline_no_any",
                "ts_unknown_narrowed_instead_of_any", manifest,
                ("typing", "unknown_used_and_narrowed_instead_of_any"),
                "typing discipline: unknown is used and narrowed "
                "instead of any")
    _bool_check(results, "typing_discipline_no_any",
                "ts_src_declared_any_free", manifest,
                ("typing", "no_any_in_src"),
                "typing discipline: no any appears in src")
    _bool_check(results, "typing_discipline_no_any",
                "ts_casts_avoided_or_justified", manifest,
                ("typing", "casts_avoided_or_remaining_justified"),
                "typing discipline: as casts are avoided, and "
                "any that remain are justified")
    _bool_check(results, "typing_discipline_no_any",
                "ts_non_null_assertion_chains_absent", manifest,
                ("typing", "non_null_assertion_chains_absent"),
                "typing discipline: no non-null assertion chains "
                "are used")

    # ---- Section 3: typed_boundaries_and_schema_validation ----
    _bool_check(results, "typed_boundaries_and_schema_validation",
                "ts_external_input_schema_validated", manifest,
                ("boundary_validation",
                 "external_input_validated_with_schema"),
                "typed boundaries: external input - API, storage, "
                "env - is validated with a schema such as zod "
                "or valibot")
    _bool_check(results, "typed_boundaries_and_schema_validation",
                "ts_boundaries_parse_not_trust", manifest,
                ("boundary_validation", "parse_not_trust_at_edges"),
                "typed boundaries: boundaries parse rather than "
                "trust - validate at the edges and trust the "
                "compiler inside")
    _check(results, "typed_boundaries_and_schema_validation",
           "ts_boundaries_declared", boundaries, boundaries_is_list,
           boundaries_is_list,
           "the declared record names its boundaries - the "
           "boundaries list is present; an empty list declares "
           "that the codebase has no external boundaries")
    schema_present = (
        boundaries_is_list
        and all(isinstance(c, dict) and "schema_validated" in c
                for c in brows))
    _check(results, "typed_boundaries_and_schema_validation",
           "every_ts_boundary_schema_validated", boundaries,
           schema_present,
           boundaries_is_list
           and all(isinstance(c, dict)
                   and c.get("schema_validated") is True
                   for c in brows),
           "boundaries: every declared boundary row declares "
           "schema validation")
    schema_test_present = (
        boundaries_is_list
        and all(isinstance(c, dict) and "schema_tested" in c
                for c in brows))
    _check(results, "typed_boundaries_and_schema_validation",
           "every_ts_boundary_schema_tested", boundaries,
           schema_test_present,
           boundaries_is_list
           and all(isinstance(c, dict)
                   and c.get("schema_tested") is True
                   for c in brows),
           "boundaries: every declared boundary row declares "
           "its schema is tested")
    bname_present = (
        boundaries_is_list
        and all(isinstance(c, dict) and "name" in c for c in brows))
    _check(results, "typed_boundaries_and_schema_validation",
           "no_ts_boundary_name_duplicated", boundaries,
           bname_present,
           boundaries_is_list
           and duplicate_boundary_names is not None
           and len(duplicate_boundary_names) == 0,
           "boundaries: no declared boundary name is owned by "
           "more than one row")

    # ---- Section 4: state_modelling_with_discriminated_unions ----
    _bool_check(results, "state_modelling_with_discriminated_unions",
                "ts_status_machines_as_discriminated_unions", manifest,
                ("state_modelling",
                 "discriminated_unions_for_status_machines"),
                "state modelling: status machines are modelled "
                "as discriminated unions")
    _bool_check(results, "state_modelling_with_discriminated_unions",
                "ts_exhaustive_switch_never_check", manifest,
                ("state_modelling",
                 "exhaustive_switch_with_never_check"),
                "state modelling: switches are exhaustive with a "
                "never check")
    _bool_check(results, "state_modelling_with_discriminated_unions",
                "ts_illegal_states_unrepresentable", manifest,
                ("state_modelling",
                 "illegal_states_unrepresentable_by_design"),
                "state modelling: illegal states are made "
                "unrepresentable by the type design")

    # ---- Section 5: module_structure_and_declared_modules ----
    _bool_check(results, "module_structure_and_declared_modules",
                "ts_small_module_files_kept", manifest,
                ("module_structure", "small_files_kept"),
                "modules: module files are kept small")
    _bool_check(results, "module_structure_and_declared_modules",
                "ts_deep_imports_over_cycle_hiding_barrels", manifest,
                ("module_structure",
                 "deep_imports_preferred_over_barrel_files"),
                "modules: deep imports are preferred over barrel "
                "files that hide cycles")
    _bool_check(results, "module_structure_and_declared_modules",
                "ts_explicit_public_surfaces_declared", manifest,
                ("module_structure", "explicit_public_surfaces"),
                "modules: public surfaces are explicit")
    _check(results, "module_structure_and_declared_modules",
           "ts_modules_declared", modules, modules_is_list,
           modules_is_list,
           "the declared record names its modules - the modules "
           "list is present; an empty list declares no module "
           "rows")
    any_free_present = (
        modules_is_list
        and all(isinstance(c, dict) and "any_free" in c
                for c in mrows))
    _check(results, "module_structure_and_declared_modules",
           "every_ts_module_any_free", modules, any_free_present,
           modules_is_list
           and all(isinstance(c, dict)
                   and c.get("any_free") is True for c in mrows),
           "modules: every declared module row declares it is "
           "any-free")
    surface_present = (
        modules_is_list
        and all(isinstance(c, dict) and "explicit_public_surface" in c
                for c in mrows))
    _check(results, "module_structure_and_declared_modules",
           "every_ts_module_explicit_public_surface", modules,
           surface_present,
           modules_is_list
           and all(isinstance(c, dict)
                   and c.get("explicit_public_surface") is True
                   for c in mrows),
           "modules: every declared module row declares an "
           "explicit public surface")
    mname_present = (
        modules_is_list
        and all(isinstance(c, dict) and "name" in c for c in mrows))
    _check(results, "module_structure_and_declared_modules",
           "no_ts_module_name_duplicated", modules, mname_present,
           modules_is_list
           and duplicate_module_names is not None
           and len(duplicate_module_names) == 0,
           "modules: no declared module name is owned by more "
           "than one row")

    # ---- Section 6: async_and_cancellation_discipline ----
    _bool_check(results, "async_and_cancellation_discipline",
                "ts_all_promises_awaited_or_handled", manifest,
                ("async_practices", "all_promises_awaited_or_handled"),
                "async: all promises are awaited or handled")
    _bool_check(results, "async_and_cancellation_discipline",
                "ts_no_floating_promises_declared", manifest,
                ("async_practices", "no_floating_promises"),
                "async: no floating promises are present")
    _bool_check(results, "async_and_cancellation_discipline",
                "ts_promise_handling_lint_rule_enabled", manifest,
                ("async_practices",
                 "promise_handling_lint_rule_enabled"),
                "async: a lint rule enforces that promises are "
                "awaited or handled")
    _bool_check(results, "async_and_cancellation_discipline",
                "ts_abort_controller_for_cancellable_work", manifest,
                ("async_practices",
                 "abort_controller_for_cancellable_work"),
                "async: AbortController is used for cancellable "
                "work")

    # ---- Section 7: tests_build_and_tooling ----
    _bool_check(results, "tests_build_and_tooling",
                "ts_logic_unit_tested_with_vitest", manifest,
                ("testing", "unit_tests_for_logic_with_vitest"),
                "tests: unit tests for logic run under vitest")
    _bool_check(results, "tests_build_and_tooling",
                "ts_module_edge_integration_tested", manifest,
                ("testing", "integration_tests_at_module_edges"),
                "tests: integration tests run at the module edges")
    _bool_check(results, "tests_build_and_tooling",
                "ts_types_tested_by_compilation", manifest,
                ("testing", "types_tested_by_compilation"),
                "tests: types are tested by compilation")
    _bool_check(results, "tests_build_and_tooling",
                "ts_tsc_for_types_bundler_for_bundling", manifest,
                ("build_tooling",
                 "tsc_for_types_and_bundler_for_bundling"),
                "build: tsc is used for types and esbuild or "
                "vite for bundling")
    _bool_check(results, "tests_build_and_tooling",
                "ts_source_maps_enabled", manifest,
                ("build_tooling", "source_maps_enabled"),
                "build: source maps are on")
    _bool_check(results, "tests_build_and_tooling",
                "ts_dependencies_pinned_for_build", manifest,
                ("build_tooling", "dependencies_pinned"),
                "build: dependencies are pinned")
    _bool_check(results, "tests_build_and_tooling",
                "ts_lint_clean_declared", manifest,
                ("build_tooling", "lint_clean"),
                "quality gate: lint is clean")

    # ---- Section 8: typescript_red_lines ----
    _false_check(results, "typescript_red_lines",
                 "ts_no_untracked_ts_ignore_or_expect_error", manifest,
                 ("red_lines",
                  "ts_ignore_or_ts_expect_error_without_tracked_reason_present"),
                 "red line: no ts-ignore or ts-expect-error "
                 "without a tracked reason is present in the record")
    _false_check(results, "typescript_red_lines",
                 "ts_no_unvalidated_runtime_shape_assumption", manifest,
                 ("red_lines", "unvalidated_runtime_shapes_assumed_present"),
                 "red line: no runtime shapes assumed that were "
                 "not validated are present in the record")
    _false_check(results, "typescript_red_lines",
                 "ts_red_line_any_absent_from_src", manifest,
                 ("red_lines", "any_in_src_present"),
                 "red line: no any in src is present in the record")
    _false_check(results, "typescript_red_lines",
                 "ts_red_line_floating_promises_absent", manifest,
                 ("red_lines", "floating_promises_present"),
                 "red line: no floating promises are present in "
                 "the record")

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
        verdict = "STRICT_TYPESCRIPT_ENGINEERING_PACK_NOT_READY"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "STRICT_TYPESCRIPT_ENGINEERING_PACK_READY"

    computed_names = (
        "ts_boundaries_declared",
        "every_ts_boundary_schema_validated",
        "every_ts_boundary_schema_tested",
        "no_ts_boundary_name_duplicated",
        "ts_modules_declared",
        "every_ts_module_any_free",
        "every_ts_module_explicit_public_surface",
        "no_ts_module_name_duplicated",
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
        "service": "strict-typescript-engineering-pack",
        "atom_version": "0.1.0",
        "project": manifest.get("project"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "boundaries_count": boundaries_count,
        "modules_count": modules_count,
        "boundaries_without_schema_validation": boundaries_without_schema,
        "boundaries_without_schema_tests": boundaries_without_schema_tests,
        "modules_not_any_free": modules_not_any_free,
        "modules_without_explicit_public_surface":
            modules_without_explicit_surface,
        "strict_flag_coverage": _fmt6(strict_flag_coverage),
        "schema_validation_coverage": _fmt6(schema_validation_coverage),
        "schema_test_coverage": _fmt6(schema_test_coverage),
        "any_free_coverage": _fmt6(any_free_coverage),
        "explicit_public_surface_coverage": _fmt6(explicit_surface_coverage),
        "duplicate_boundary_names": duplicate_boundary_names,
        "duplicate_module_names": duplicate_module_names,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across eight sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "STRICT TYPESCRIPT ENGINEERING PACK",
        f"project: {verdict.get('project')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: strict_typescript_engineering_pack.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == \
        "STRICT_TYPESCRIPT_ENGINEERING_PACK_READY" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
