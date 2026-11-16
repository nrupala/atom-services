#!/usr/bin/env python3
"""Frontend implementation — deterministic core.

Built from the bound skill `frontend-engineering`: "Build the
human surface: components, states, responsiveness, and speed.
Follow the project's stack and styles; no new framework without
an ADR."

This atom is an AUDIT of a declared frontend implementation
record: it validates the record a caller declares against the
skill's method sections — structure, states always, data layer,
responsive, accessibility, performance, errors are UI — plus its
artifacts, quality gates and red lines. It does not write or run
frontend code, render a page, measure a real bundle or paint, or
verify that a declared control actually works — it checks that
the record the skill requires is present and internally complete
and consistent on the declared evidence. Non-reducible parts of
the skill (visual quality, taste, whether a component is "small
enough" in the abstract) are caller declarations only, never
judged.

The caller submits a frontend manifest (a dict, or JSON on the
CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- data views: the declared `data_views` list must be non-empty,
  and every declared data-view row must declare all four states
  implemented (the skill: "implement loading, empty, error, and
  success for every data view"; quality gate: "Every data view
  has loading / empty / error / success implemented").

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the unrounded values. That fixed serialization is what makes the
Python and TypeScript outputs byte-identical. Counts are reported
as integers (exact).

The skill states no numeric threshold — no WCAG contrast ratio
or conformance level, no bundle-size budget in kilobytes, no
first-paint or layout-shift number, no retry count or backoff
delay — so no numeric threshold check is invented; the
performance budget and the accessibility standard are caller
attestations, and quantities are computed and reported, with
completeness (every declared data view) as the only bar, exactly
as stated above.

Verdict:
- any fail             -> FRONTEND_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> FRONTEND_SOUND

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "structure_and_components",
    "states_and_data_layer",
    "responsive_and_accessibility",
    "performance_and_errors",
    "verification_and_red_lines",
)

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (TypeError naming the
# field path), never evidence: F1 remedy, external verification
# Wave 1. Absent fields are not validated — absence is missing
# evidence, decided by the checks below.
MANIFEST_SPEC = {
    "project": "string",
    "structure": {
        "semantic_html_first": "boolean",
        "small_single_responsibility_components": "boolean",
        "data_down_events_up": "boolean",
        "god_components_present": "boolean",
        "follows_project_stack_and_styles": "boolean",
        "uses_design_tokens": "boolean",
    },
    "framework": {
        "new_framework_introduced": "boolean",
        "adr_recorded": "boolean",
    },
    "data_views": [{
        "name": "string",
        "loading_implemented": "boolean",
        "empty_implemented": "boolean",
        "error_implemented": "boolean",
        "success_implemented": "boolean",
    }],
    "interactions": {
        "buttons_disabled_while_submitting": "boolean",
        "dead_controls_present": "boolean",
        "silent_failures_present": "boolean",
    },
    "data_layer": {
        "single_small_client_per_app": "boolean",
        "retries_with_backoff_for_transient_errors": "boolean",
        "whole_screen_blocked_by_single_widget_present": "boolean",
    },
    "verification": {
        "state_matrix_documented": "boolean",
        "smoke_tests_for_key_flows": "boolean",
        "keyboard_only_primary_journey_passed": "boolean",
    },
    "responsive": {
        "fluid_grids_used": "boolean",
        "wrap_safe_text": "boolean",
        "stable_dimensions": "boolean",
        "widths_verified_360_to_desktop": "boolean",
        "overflow_present": "boolean",
        "overlap_present": "boolean",
        "has_fixed_bars": "boolean",
        "nothing_hidden_behind_fixed_bars": "boolean",
    },
    "accessibility": {
        "labels_on_all_fields": "boolean",
        "logical_focus_order": "boolean",
        "aria_live_for_async_results": "boolean",
        "fully_keyboard_operable": "boolean",
    },
    "performance": {
        "budget_defined_before_build": "boolean",
        "lazy_load_below_fold": "boolean",
        "layout_shift_avoided": "boolean",
        "static_assets_cached": "boolean",
        "budget_checked_bundle_and_first_paint": "boolean",
        "budget_checked_on_slow_throttle": "boolean",
    },
    "errors": {
        "human_readable_messages_in_ui": "boolean",
        "details_sent_to_logs_not_ui": "boolean",
        "console_spam_present": "boolean",
    },
    "security": {
        "secrets_in_frontend_code_present": "boolean",
    },
}

STATE_FIELDS = (
    "loading_implemented",
    "empty_implemented",
    "error_implemented",
    "success_implemented",
)


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


def _view_complete(entry):
    return (
        isinstance(entry, dict)
        and all(entry.get(f) is True for f in STATE_FIELDS)
    )


def evaluate(manifest):
    """Return the verdict dict for a frontend manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    data_views, has_views = _get(manifest, "data_views")
    views_is_list = has_views and isinstance(data_views, list)
    views_count = len(data_views) if views_is_list else None
    rows = data_views if views_is_list else []

    complete_rows = [c for c in rows if _view_complete(c)]
    state_coverage = (
        len(complete_rows) / views_count
        if views_is_list and views_count > 0 else None
    )
    views_without_complete_states = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and all(f in c for f in STATE_FIELDS)
         and not _view_complete(c)]
        if views_is_list else None
    )

    # ---- Section 1: structure_and_components (skill: structure
    #      — semantic HTML first; small components with single
    #      responsibilities; data down, events up; no god
    #      components. Follow the project's stack and styles; no
    #      new framework without an ADR. Artifacts — components +
    #      styles (token usage)) ----
    _bool_check(results, "structure_and_components",
                "semantic_html_first", manifest,
                ("structure", "semantic_html_first"),
                "structure: semantic HTML comes first")
    _bool_check(results, "structure_and_components",
                "small_single_responsibility_components", manifest,
                ("structure", "small_single_responsibility_components"),
                "structure: components are small with single "
                "responsibilities")
    _bool_check(results, "structure_and_components",
                "data_down_events_up", manifest,
                ("structure", "data_down_events_up"),
                "structure: data flows down, events flow up")
    _false_check(results, "structure_and_components",
                 "no_god_components", manifest,
                 ("structure", "god_components_present"),
                 "structure: no god components")
    _bool_check(results, "structure_and_components",
                "follows_project_stack_and_styles", manifest,
                ("structure", "follows_project_stack_and_styles"),
                "structure: the implementation follows the project's "
                "stack and styles")
    _bool_check(results, "structure_and_components",
                "uses_design_tokens", manifest,
                ("structure", "uses_design_tokens"),
                "artifacts: components and styles use design tokens")
    _gated_bool_check(
        results, "structure_and_components",
        "new_framework_has_adr", manifest,
        ("framework", "new_framework_introduced"),
        ("framework", "adr_recorded"),
        "structure: the new framework is covered by an ADR",
        "no new framework introduced")

    # ---- Section 2: states_and_data_layer (skill: states always
    #      — implement loading, empty, error, and success for every
    #      data view; disable buttons while submitting; no dead
    #      controls. Data layer — fetch through one small client
    #      per app; retries with backoff for transient errors;
    #      never block the whole screen for one widget. Artifacts
    #      — implemented state matrix. Quality gate — every data
    #      view has loading / empty / error / success implemented.
    #      Red line — no "nothing happened" failures) ----
    _check(results, "states_and_data_layer",
           "data_views_declared", data_views, views_is_list,
           views_is_list and views_count > 0,
           "states always: the declared record names its data "
           "views — the data_views list is present and non-empty")
    states_present = (
        views_is_list
        and all(isinstance(c, dict)
                and all(f in c for f in STATE_FIELDS) for c in rows)
    )
    _check(results, "states_and_data_layer",
           "every_data_view_has_all_four_states", data_views,
           states_present,
           views_is_list and views_count > 0
           and len(complete_rows) == views_count,
           "quality gate: every declared data view declares "
           "loading, empty, error and success implemented")
    _bool_check(results, "states_and_data_layer",
                "state_matrix_documented", manifest,
                ("verification", "state_matrix_documented"),
                "artifacts: the implemented state matrix is "
                "documented")
    _bool_check(results, "states_and_data_layer",
                "buttons_disabled_while_submitting", manifest,
                ("interactions", "buttons_disabled_while_submitting"),
                "states always: buttons are disabled while "
                "submitting")
    _false_check(results, "states_and_data_layer",
                 "no_dead_controls", manifest,
                 ("interactions", "dead_controls_present"),
                 "states always: no dead controls")
    _false_check(results, "states_and_data_layer",
                 "no_silent_failures", manifest,
                 ("interactions", "silent_failures_present"),
                 "red line: no \"nothing happened\" failures")
    _bool_check(results, "states_and_data_layer",
                "single_small_client_per_app", manifest,
                ("data_layer", "single_small_client_per_app"),
                "data layer: fetching goes through one small client "
                "per app")
    _bool_check(results, "states_and_data_layer",
                "retries_with_backoff_for_transient_errors", manifest,
                ("data_layer", "retries_with_backoff_for_transient_errors"),
                "data layer: transient errors are retried with "
                "backoff")
    _false_check(results, "states_and_data_layer",
                 "no_whole_screen_blocked_by_single_widget", manifest,
                 ("data_layer",
                  "whole_screen_blocked_by_single_widget_present"),
                 "data layer: the whole screen is never blocked for "
                 "one widget")

    # ---- Section 3: responsive_and_accessibility (skill:
    #      responsive — fluid grids, wrap-safe text, stable
    #      dimensions; test 360px to desktop; no overflow, no
    #      overlap, nothing hidden behind fixed bars.
    #      Accessibility — labels on all fields, logical focus
    #      order, aria-live for async results, fully keyboard
    #      operable) ----
    _bool_check(results, "responsive_and_accessibility",
                "fluid_grids_used", manifest,
                ("responsive", "fluid_grids_used"),
                "responsive: fluid grids are used")
    _bool_check(results, "responsive_and_accessibility",
                "wrap_safe_text", manifest,
                ("responsive", "wrap_safe_text"),
                "responsive: text is wrap-safe")
    _bool_check(results, "responsive_and_accessibility",
                "stable_dimensions", manifest,
                ("responsive", "stable_dimensions"),
                "responsive: dimensions are stable")
    _bool_check(results, "responsive_and_accessibility",
                "widths_verified_360_to_desktop", manifest,
                ("responsive", "widths_verified_360_to_desktop"),
                "responsive / quality gate: widths are verified "
                "from 360px to desktop")
    _false_check(results, "responsive_and_accessibility",
                 "no_overflow", manifest,
                 ("responsive", "overflow_present"),
                 "responsive: no overflow at the verified widths")
    _false_check(results, "responsive_and_accessibility",
                 "no_overlap", manifest,
                 ("responsive", "overlap_present"),
                 "responsive: no overlap at the verified widths")
    _gated_bool_check(
        results, "responsive_and_accessibility",
        "nothing_hidden_behind_fixed_bars", manifest,
        ("responsive", "has_fixed_bars"),
        ("responsive", "nothing_hidden_behind_fixed_bars"),
        "responsive: nothing is hidden behind fixed bars",
        "no fixed bars declared")
    _bool_check(results, "responsive_and_accessibility",
                "labels_on_all_fields", manifest,
                ("accessibility", "labels_on_all_fields"),
                "accessibility: all fields have labels")
    _bool_check(results, "responsive_and_accessibility",
                "logical_focus_order", manifest,
                ("accessibility", "logical_focus_order"),
                "accessibility: focus order is logical")
    _bool_check(results, "responsive_and_accessibility",
                "aria_live_for_async_results", manifest,
                ("accessibility", "aria_live_for_async_results"),
                "accessibility: async results use aria-live")
    _bool_check(results, "responsive_and_accessibility",
                "fully_keyboard_operable", manifest,
                ("accessibility", "fully_keyboard_operable"),
                "accessibility: the interface is fully keyboard "
                "operable")

    # ---- Section 4: performance_and_errors (skill: performance
    #      — budget first (bundle size, first paint); lazy-load
    #      below the fold; avoid layout shift; cache static
    #      assets. Quality gate — performance budget checked
    #      (bundle + first paint on slow throttle). Errors are UI
    #      — human-readable messages in the interface; details go
    #      to logs/telemetry, not into the user's face) ----
    _bool_check(results, "performance_and_errors",
                "budget_defined_before_build", manifest,
                ("performance", "budget_defined_before_build"),
                "performance: the budget is defined first — bundle "
                "size and first paint")
    _bool_check(results, "performance_and_errors",
                "lazy_load_below_fold", manifest,
                ("performance", "lazy_load_below_fold"),
                "performance: below-the-fold content is lazy-loaded")
    _bool_check(results, "performance_and_errors",
                "layout_shift_avoided", manifest,
                ("performance", "layout_shift_avoided"),
                "performance: layout shift is avoided")
    _bool_check(results, "performance_and_errors",
                "static_assets_cached", manifest,
                ("performance", "static_assets_cached"),
                "performance: static assets are cached")
    _bool_check(results, "performance_and_errors",
                "budget_checked_bundle_and_first_paint", manifest,
                ("performance", "budget_checked_bundle_and_first_paint"),
                "quality gate: the performance budget is checked — "
                "bundle and first paint")
    _bool_check(results, "performance_and_errors",
                "budget_checked_on_slow_throttle", manifest,
                ("performance", "budget_checked_on_slow_throttle"),
                "quality gate: the budget check runs on a slow "
                "throttle")
    _bool_check(results, "performance_and_errors",
                "human_readable_error_messages_in_ui", manifest,
                ("errors", "human_readable_messages_in_ui"),
                "errors are UI: messages in the interface are "
                "human-readable")
    _bool_check(results, "performance_and_errors",
                "error_details_to_logs_not_ui", manifest,
                ("errors", "details_sent_to_logs_not_ui"),
                "errors are UI: details go to logs/telemetry, not "
                "into the user's face")

    # ---- Section 5: verification_and_red_lines (skill: artifacts
    #      — smoke/tests for key flows. Quality gate — keyboard-
    #      only pass of the primary journey. Red lines — no
    #      console spam; no secrets or keys in frontend code,
    #      ever) ----
    _bool_check(results, "verification_and_red_lines",
                "smoke_tests_for_key_flows", manifest,
                ("verification", "smoke_tests_for_key_flows"),
                "artifacts: smoke/tests cover the key flows")
    _bool_check(results, "verification_and_red_lines",
                "keyboard_only_primary_journey_passed", manifest,
                ("verification", "keyboard_only_primary_journey_passed"),
                "quality gate: a keyboard-only pass of the primary "
                "journey is completed")
    _false_check(results, "verification_and_red_lines",
                 "no_console_spam", manifest,
                 ("errors", "console_spam_present"),
                 "red line: no console spam")
    _false_check(results, "verification_and_red_lines",
                 "no_secrets_in_frontend_code", manifest,
                 ("security", "secrets_in_frontend_code_present"),
                 "red line: no secrets or keys in frontend code — "
                 "ever")

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
        verdict = "FRONTEND_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "FRONTEND_SOUND"

    computed_names = (
        "data_views_declared",
        "every_data_view_has_all_four_states",
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
        "service": "frontend-implementation",
        "atom_version": "0.1.0",
        "project": manifest.get("project"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "data_views_count": views_count,
        "data_views_without_complete_states":
            views_without_complete_states,
        "state_coverage": _fmt6(state_coverage),
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
        "FRONTEND IMPLEMENTATION",
        f"project: {verdict.get('project')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<36} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: frontend_implementation.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "FRONTEND_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
