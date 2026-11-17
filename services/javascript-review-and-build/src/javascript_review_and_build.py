#!/usr/bin/env python3
"""Javascript review and build — deterministic core.

Built from the bound skill `javascript-engineering`: "Modern
JavaScript done right — ESM, no implicit globals, async
discipline, XSS-safe DOM, bundle awareness."

This atom is an AUDIT of a declared JavaScript review/build
record: it validates the record a caller declares against the
skill's sections — modules and strictness, async discipline,
DOM safety, environment and bundle, and tests and red lines.
It does not run, parse, lint or review actual code; it checks
that the record the skill requires is present and internally
complete and consistent on the declared evidence.

The caller submits a JavaScript manifest (a dict, or JSON on
the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus
the consistency of the declared rows themselves — no outside
threshold is imported:

- files: the declared `files` list must be non-empty, and
  every declared file row must be an ES module ("ESM
  (import/export) everywhere"), must not use `var` ("never
  var"), must not carry an unhandled promise ("every promise
  handled or explicitly .catch'ed"), and must not inject user
  input via innerHTML ("never inject user input via
  innerHTML").

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the unrounded values. That fixed serialization is what makes
the Python and TypeScript outputs byte-identical. Counts are
reported as integers (exact).

The skill states no numeric threshold — no bundle-size limit,
no dependency-size or dependency-count limit, no test-coverage
percentage, no timeout duration, no file or module count — so
no numeric threshold check is invented; those quantities are
caller attestations at most, and quantities here are computed
and reported, with completeness (every declared file) as the
only bar, exactly as stated above.

Verdict:
- any fail             -> JAVASCRIPT_REVIEW_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> JAVASCRIPT_REVIEW_SOUND

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism
is the product.
"""
import json
import math
import sys

SECTIONS = (
    "modules_and_strictness",
    "async_discipline",
    "dom_safety",
    "environment_and_bundle",
    "tests_and_red_lines",
)

MANIFEST_SPEC = {
    "subject": "string",
    "modules": {
        "esm_used_everywhere": "boolean",
        "implicit_globals_present": "boolean",
        "var_used_present": "boolean",
        "const_by_default_let_when_reassigned": "boolean",
        "strict_mode_in_effect": "boolean",
        "jsdoc_types_for_reused_code": "boolean",
    },
    "async": {
        "async_await_with_real_error_handling": "boolean",
        "every_promise_handled_or_explicitly_caught": "boolean",
        "network_calls_present": "boolean",
        "network_timeouts_via_abort_controller": "boolean",
    },
    "dom": {
        "nodes_built_with_text_content_and_create_element": "boolean",
        "user_input_via_inner_html_present": "boolean",
        "html_truly_needed_present": "boolean",
        "sanitization_applied_when_html_truly_needed": "boolean",
    },
    "environment": {
        "no_dom_apis_in_node_code": "boolean",
        "shared_code_present": "boolean",
        "feature_detection_when_shared_code": "boolean",
    },
    "bundle": {
        "bundle_contents_known": "boolean",
        "huge_dependencies_for_small_jobs_present": "boolean",
        "optional_code_split": "boolean",
    },
    "files": [{
        "name": "string",
        "esm_module": "boolean",
        "var_present": "boolean",
        "unhandled_promise_present": "boolean",
        "inner_html_with_user_input_present": "boolean",
    }],
    "tests": {
        "pure_logic_unit_tested": "boolean",
        "ui_present": "boolean",
        "manual_smoke_for_ui": "boolean",
        "logic_extracted_from_event_handlers_and_tested": "boolean",
    },
    "red_lines": {
        "eval_or_function_on_untrusted_input_present": "boolean",
        "secrets_in_client_side_code_present": "boolean",
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


def _gated_bool_check(results, section, name, manifest, gate_path,
                      target_path, evidence, na_evidence):
    gate, has_gate = _get(manifest, *gate_path)
    target, has_target = _get(manifest, *target_path)
    if has_gate and gate:
        _check(results, section, name, target, has_target,
               target is True, evidence)
    else:
        _check(results, section, name, gate, has_gate, True,
               na_evidence)


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
    """Return the verdict dict for a JavaScript review manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    files, has_files = _get(manifest, "files")
    files_is_list = has_files and isinstance(files, list)
    files_count = len(files) if files_is_list else None
    rows = files if files_is_list else []

    files_without_esm = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "esm_module" in c
         and c.get("esm_module") is not True]
        if files_is_list else None
    )
    files_using_var = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and c.get("var_present") is True]
        if files_is_list else None
    )
    files_with_unhandled_promises = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and c.get("unhandled_promise_present") is True]
        if files_is_list else None
    )
    files_injecting_user_input = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and c.get("inner_html_with_user_input_present") is True]
        if files_is_list else None
    )
    esm_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("esm_module") is True)
        / files_count
        if files_is_list and files_count > 0 else None
    )

    # ---- Section 1: modules_and_strictness (skill method 1-2:
    #      ESM everywhere, no implicit globals, const by default,
    #      let when reassigned, never var; use strict, JSDoc types
    #      for anything reused without TS. Quality gate: no
    #      implicit globals, no var) ----
    _bool_check(results, "modules_and_strictness",
                "esm_used_everywhere", manifest,
                ("modules", "esm_used_everywhere"),
                "modules: ESM (import/export) is used everywhere")
    _false_check(results, "modules_and_strictness",
                 "no_implicit_globals", manifest,
                 ("modules", "implicit_globals_present"),
                 "quality gate: no implicit globals are present")
    _false_check(results, "modules_and_strictness",
                 "no_var_used", manifest,
                 ("modules", "var_used_present"),
                 "modules: never var — const by default, let when "
                 "reassigned")
    _bool_check(results, "modules_and_strictness",
                "const_by_default_let_when_reassigned", manifest,
                ("modules", "const_by_default_let_when_reassigned"),
                "modules: const by default, let when reassigned")
    _bool_check(results, "modules_and_strictness",
                "strict_mode_in_effect", manifest,
                ("modules", "strict_mode_in_effect"),
                "strictness: use strict is in effect — implicit "
                "in modules")
    _bool_check(results, "modules_and_strictness",
                "jsdoc_types_for_reused_code", manifest,
                ("modules", "jsdoc_types_for_reused_code"),
                "strictness: JSDoc types are carried for anything "
                "reused without TypeScript")
    _check(results, "modules_and_strictness",
           "files_declared", files, files_is_list,
           files_is_list and files_count > 0,
           "the declared record names its files — the files "
           "list is present and non-empty")
    esm_present = (
        files_is_list
        and all(isinstance(c, dict) and "esm_module" in c for c in rows)
    )
    _check(results, "modules_and_strictness",
           "every_file_is_esm", files, esm_present,
           files_is_list and files_count > 0
           and all(isinstance(c, dict)
                   and c.get("esm_module") is True
                   for c in rows),
           "modules: every declared file row is an ES module")
    var_present_all = (
        files_is_list
        and all(isinstance(c, dict) and "var_present" in c for c in rows)
    )
    _check(results, "modules_and_strictness",
           "no_file_uses_var", files, var_present_all,
           files_is_list and len(files_using_var) == 0,
           "quality gate: no declared file row uses var")

    # ---- Section 2: async_discipline (skill method 3:
    #      async/await with real error handling; every promise
    #      handled or explicitly .catch'ed; timeouts via
    #      AbortController. Quality gate: all promises handled,
    #      network calls have timeouts) ----
    _bool_check(results, "async_discipline",
                "async_await_with_real_error_handling", manifest,
                ("async", "async_await_with_real_error_handling"),
                "async discipline: async/await is used with real "
                "error handling")
    _bool_check(results, "async_discipline",
                "every_promise_handled_or_explicitly_caught", manifest,
                ("async", "every_promise_handled_or_explicitly_caught"),
                "async discipline: every promise is handled or "
                "explicitly .catch'ed")
    _gated_bool_check(
        results, "async_discipline",
        "network_timeouts_via_abort_controller_when_network_calls",
        manifest,
        ("async", "network_calls_present"),
        ("async", "network_timeouts_via_abort_controller"),
        "async discipline: network calls have timeouts via "
        "AbortController when network calls are declared present",
        "no network calls declared")
    unhandled_present = (
        files_is_list
        and all(isinstance(c, dict)
                and "unhandled_promise_present" in c for c in rows)
    )
    _check(results, "async_discipline",
           "no_file_has_unhandled_promise", files, unhandled_present,
           files_is_list and len(files_with_unhandled_promises) == 0,
           "quality gate: no declared file row carries an "
           "unhandled promise")

    # ---- Section 3: dom_safety (skill method 4: build nodes
    #      with textContent/createElement; never inject user
    #      input via innerHTML; sanitize when HTML is truly
    #      needed. Quality gate: no XSS-prone injection) ----
    _bool_check(results, "dom_safety",
                "nodes_built_with_text_content_and_create_element",
                manifest,
                ("dom", "nodes_built_with_text_content_and_create_element"),
                "DOM safety: nodes are built with textContent / "
                "createElement")
    _false_check(results, "dom_safety",
                 "no_user_input_via_inner_html", manifest,
                 ("dom", "user_input_via_inner_html_present"),
                 "DOM safety: user input is never injected via "
                 "innerHTML")
    _gated_bool_check(
        results, "dom_safety",
        "sanitization_when_html_truly_needed", manifest,
        ("dom", "html_truly_needed_present"),
        ("dom", "sanitization_applied_when_html_truly_needed"),
        "DOM safety: sanitization is applied when HTML is "
        "truly needed",
        "no HTML rendering truly needed declared")
    injection_present = (
        files_is_list
        and all(isinstance(c, dict)
                and "inner_html_with_user_input_present" in c
                for c in rows)
    )
    _check(results, "dom_safety",
           "no_file_injects_user_input_via_inner_html", files,
           injection_present,
           files_is_list and len(files_injecting_user_input) == 0,
           "quality gate: no declared file row injects user "
           "input via innerHTML")

    # ---- Section 4: environment_and_bundle (skill method 5-6:
    #      no DOM APIs in Node code, feature-detect when shared;
    #      know what ships, no huge deps for small jobs,
    #      code-split anything optional) ----
    _bool_check(results, "environment_and_bundle",
                "no_dom_apis_in_node_code", manifest,
                ("environment", "no_dom_apis_in_node_code"),
                "environment split: no DOM APIs are used in "
                "Node code")
    _gated_bool_check(
        results, "environment_and_bundle",
        "feature_detection_when_shared_code", manifest,
        ("environment", "shared_code_present"),
        ("environment", "feature_detection_when_shared_code"),
        "environment split: feature detection is used when "
        "code is shared between environments",
        "no shared code declared")
    _bool_check(results, "environment_and_bundle",
                "bundle_contents_known", manifest,
                ("bundle", "bundle_contents_known"),
                "bundle awareness: what ships is known")
    _false_check(results, "environment_and_bundle",
                 "no_huge_dependencies_for_small_jobs", manifest,
                 ("bundle", "huge_dependencies_for_small_jobs_present"),
                 "bundle awareness: no huge dependencies are "
                 "carried for small jobs")
    _bool_check(results, "environment_and_bundle",
                "optional_code_split", manifest,
                ("bundle", "optional_code_split"),
                "bundle awareness: anything optional is "
                "code-split")

    # ---- Section 5: tests_and_red_lines (skill method 7:
    #      unit-test pure logic, manual smoke for UI, keep logic
    #      out of event handlers so it is testable. Quality
    #      gate: logic extracted from handlers and tested.
    #      Red lines: never eval/Function on untrusted input;
    #      no secrets in client-side code) ----
    _bool_check(results, "tests_and_red_lines",
                "pure_logic_unit_tested", manifest,
                ("tests", "pure_logic_unit_tested"),
                "tests: pure logic is unit-tested (vitest / "
                "node:test)")
    _gated_bool_check(
        results, "tests_and_red_lines",
        "manual_smoke_for_ui_when_ui_present", manifest,
        ("tests", "ui_present"),
        ("tests", "manual_smoke_for_ui"),
        "tests: a manual smoke test is done for the UI when "
        "a UI is declared present",
        "no UI declared")
    _bool_check(results, "tests_and_red_lines",
                "logic_extracted_from_event_handlers_and_tested",
                manifest,
                ("tests",
                 "logic_extracted_from_event_handlers_and_tested"),
                "quality gate: logic is extracted from event "
                "handlers so it is testable, and tested")
    _false_check(results, "tests_and_red_lines",
                 "no_eval_or_function_on_untrusted_input", manifest,
                 ("red_lines",
                  "eval_or_function_on_untrusted_input_present"),
                 "red line: never eval / Function on untrusted "
                 "input")
    _false_check(results, "tests_and_red_lines",
                 "no_secrets_in_client_side_code", manifest,
                 ("red_lines", "secrets_in_client_side_code_present"),
                 "red line: no secrets in client-side code — "
                 "assume it is public")

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
        verdict = "JAVASCRIPT_REVIEW_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "JAVASCRIPT_REVIEW_SOUND"

    computed_names = (
        "files_declared",
        "every_file_is_esm",
        "no_file_uses_var",
        "no_file_has_unhandled_promise",
        "no_file_injects_user_input_via_inner_html",
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
        "service": "javascript-review-and-build",
        "atom_version": "0.1.0",
        "subject": manifest.get("subject"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "files_count": files_count,
        "files_without_esm": files_without_esm,
        "esm_coverage": _fmt6(esm_coverage),
        "files_using_var": files_using_var,
        "files_with_unhandled_promises": files_with_unhandled_promises,
        "files_injecting_user_input_via_inner_html":
            files_injecting_user_input,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across five sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "JAVASCRIPT REVIEW AND BUILD",
        f"subject: {verdict.get('subject')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<36} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: javascript_review_and_build.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "JAVASCRIPT_REVIEW_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
