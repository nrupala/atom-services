#!/usr/bin/env python3
"""Data visualization design — deterministic core.

Built from the bound skill `data-visualization` (v1): "Say it
with charts — right chart for the job, honest axes, accessible
color, annotation that explains."

This atom does NOT render a chart, draw a graph, read any actual
data, or exercise any aesthetic judgment of its own. The caller
submits a data-visualization-design manifest: one DECLARED
visualization design record — its audience and question, its
declared chart rows (question type, chart type, encodings as
axis labels / units, axis start, dual-axis / truncation /
sorting / 3D / red-green declarations and category counts), its
honesty record, its perception, colour, annotation,
accessibility, dashboard and reproducibility declarations. The
atom validates that record deterministically:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
arithmetic of the declared numbers — no outside threshold is
imported:

- chart type for the question (method step 1): comparison ->
  sorted bars; trend -> line (time on x); distribution ->
  histogram/box; relationship -> scatter; composition ->
  stacked bars; part-to-whole over time -> small multiples,
  not pie-animations. Every complete chart row's declared
  chart type must be the type the skill maps its declared
  question type to, and comparison rows must declare sorted
  bars;
- zero baseline for bars (method step 2 / quality gate):
  every declared bar / stacked-bar row's declared y-axis
  start must be zero;
- no dual axes (method step 2): no declared chart row may
  declare a dual axis;
- truncated axes flagged loudly (method step 2): every row
  that declares a truncated axis must also declare it flagged
  loudly;
- colour categories (method step 4: "<=7 categories"): the
  largest declared category count across complete chart rows
  must be at most 7 — the one numeric limit the skill states;
- perception / colour row rules (method steps 3-4): no
  declared row may use 3D or a red/green-only encoding.

Computed amounts are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp,
floor(v * 1000000 + 0.5) / 1000000, then format with exactly six
decimals; the bar-zero comparison compares the fixed-6dp
difference to zero. That fixed serialization is what makes the
Python and TypeScript outputs byte-identical. The names of
chart rows whose chart type does not match their declared
question are reported as `charts_not_matching_question` (null
when the rows cannot be evaluated). The computed outcome over
the ten computed checks is reported as `computed_status`.

Verdict:
- any fail             -> DATA_VISUALIZATION_DESIGN_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> DATA_VISUALIZATION_DESIGN_SOUND

This is a completeness and consistency audit over declared
evidence, not a visualization review: a design that declares
every step passes even if its charts are ugly, and nothing here
verifies that a declared chart exists, that a declared value
is true, or that the underlying data matches the chart.

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "question_and_chart_choice",
    "honesty_and_axes",
    "perception_and_chart_junk",
    "color",
    "annotation_and_labels",
    "accessibility",
    "dashboards_and_reproducibility",
)

# Method step 1 mapping: declared question type -> the chart
# types the skill names for it. "box" is the skill's "box"
# (box plot) for distribution, alongside histogram.
STATED_CHART_TYPES_FOR_QUESTION = {
    "comparison": ["bar"],
    "trend": ["line"],
    "distribution": ["histogram", "box_plot"],
    "relationship": ["scatter"],
    "composition": ["stacked_bar"],
    "part_to_whole_over_time": ["small_multiples"],
}

BAR_CHART_TYPES = ["bar", "stacked_bar"]

# Method step 4: "<=7 categories" — the one numeric limit the
# skill states.
CATEGORY_LIMIT = 7

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
# Vocabulary strings (question types and chart types in chart
# rows) are validated as strings only, never enum-checked:
# question/chart membership is a verdict check, not a type error.
MANIFEST_SPEC = {
    "entity": "string",
    "brief": {
        "audience": "string",
        "question": "string",
    },
    "charts": [{
        "name": "string",
        "question_type": "string",
        "chart_type": "string",
        "x_axis_label": "string",
        "y_axis_label": "string",
        "y_axis_unit": "string",
        "y_axis_start": "number",
        "categories_count": "number",
        "bars_sorted": "boolean",
        "dual_axis": "boolean",
        "axis_truncated": "boolean",
        "truncated_flagged_loudly": "boolean",
        "uses_3d": "boolean",
        "red_green_only": "boolean",
    }],
    "honesty": {
        "consistent_scales_when_comparing_panels": "boolean",
        "data_source_labeled": "boolean",
        "data_date_labeled": "boolean",
        "misleading_axes_or_scales_present": "boolean",
    },
    "perception": {
        "primary_encoding_uses_position_or_length": "boolean",
        "most_important_element_top_left_or_largest": "boolean",
        "gridlines_faint": "boolean",
        "chart_junk_minimized": "boolean",
        "chart_junk_used_as_branding": "boolean",
    },
    "color": {
        "palette_colorblind_safe": "boolean",
        "sequential_palette_for_magnitude": "boolean",
        "diverging_palette_around_real_midpoint": "boolean",
    },
    "annotation": {
        "title_states_finding_not_topic": "boolean",
        "events_and_thresholds_marked": "boolean",
        "outliers_called_out_directly": "boolean",
        "key_values_annotated": "boolean",
    },
    "accessibility": {
        "legible_sizes": "boolean",
        "alt_text_or_table_fallback_present": "boolean",
        "values_readable_without_hover": "boolean",
        "contrast_sufficient_for_print_and_screen": "boolean",
    },
    "dashboard": {
        "one_screen_one_story": "boolean",
        "metric_definitions_and_owners_declared": "boolean",
        "refresh_cadence_visible": "boolean",
        "stale_panels_retired": "boolean",
    },
    "reproducibility": {
        "tool_version_and_data_snapshot_recorded": "boolean",
        "data_reproducible": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise ValueError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise ValueError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise ValueError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise ValueError(f"{path} must be an object")
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


def _string_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present,
           isinstance(value, str) and len(value) > 0, evidence)


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _is_bool(value):
    return isinstance(value, bool)


def _is_nonempty_str(value):
    return isinstance(value, str) and len(value) > 0


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _entry_complete(entry):
    if not isinstance(entry, dict):
        return False
    for field in ("name", "question_type", "chart_type",
                  "x_axis_label", "y_axis_label", "y_axis_unit"):
        value, present = _get(entry, field)
        if not present or not _is_nonempty_str(value):
            return False
    for field in ("y_axis_start", "categories_count"):
        value, present = _get(entry, field)
        if not present or not _is_number(value):
            return False
    for field in ("bars_sorted", "dual_axis", "axis_truncated",
                  "truncated_flagged_loudly", "uses_3d",
                  "red_green_only"):
        value, present = _get(entry, field)
        if not present or not _is_bool(value):
            return False
    return True


def _chart_outcomes(manifest):
    """Computed chart-row outcomes.

    Returns (outcomes, charts_evaluated, computed_max_categories,
    category_difference, charts_not_matching_question) where
    outcomes maps each computed check name to (present, ok,
    evidence). The caller emits each outcome at its natural
    section position, exactly as the TypeScript port does.
    """
    names = (
        "chart_entries_complete",
        "chart_types_match_declared_questions",
        "comparison_charts_sorted",
        "bar_charts_y_axis_starts_at_zero",
        "no_dual_axes_in_declared_charts",
        "truncated_axes_flagged_loudly",
        "no_3d_in_declared_charts",
        "red_green_not_used_alone_in_declared_charts",
        "category_counts_within_stated_limit",
        "axis_labels_and_units_complete",
    )
    charts, has_charts = _get(manifest, "charts")
    if not has_charts or not isinstance(charts, list) or not charts:
        outcomes = {name: (False, False, "no chart entries declared")
                    for name in names}
        return outcomes, 0, None, None, None
    complete = []
    incomplete = False
    for entry in charts:
        if _entry_complete(entry):
            complete.append(entry)
        else:
            incomplete = True
    evaluated = len(complete)
    if incomplete:
        outcomes = {name: (False, False,
                           "a chart entry is incomplete, so the "
                           "declared chart rows cannot be evaluated")
                    for name in names}
        return outcomes, evaluated, None, None, None

    mismatched = []
    for entry in complete:
        stated = STATED_CHART_TYPES_FOR_QUESTION.get(
            entry["question_type"])
        if stated is None or entry["chart_type"] not in stated:
            mismatched.append(entry["name"])
    comparison_rows = [e for e in complete
                       if e["question_type"] == "comparison"]
    bar_rows = [e for e in complete
                if e["chart_type"] in BAR_CHART_TYPES]
    max_categories = max(e["categories_count"] for e in complete)
    category_difference = max_categories - CATEGORY_LIMIT
    outcomes = {
        "chart_entries_complete": (
            True, True,
            "every chart entry carries a name, question type, chart "
            "type, axis labels and unit, axis start, category count, "
            "and sorting / dual-axis / truncation / 3D / red-green "
            "declarations"),
        "chart_types_match_declared_questions": (
            True, len(mismatched) == 0,
            "method step 1: every declared chart type is the chart "
            "the skill maps its declared question type to \u2014 "
            "comparison to bar, trend to line, distribution to "
            "histogram/box_plot, relationship to scatter, "
            "composition to stacked_bar, part-to-whole over time "
            "to small_multiples"),
        "comparison_charts_sorted": (
            True,
            all(e["bars_sorted"] is True for e in comparison_rows),
            "method step 1: every declared comparison chart "
            "declares sorted bars"
            + (" (no comparison chart is declared, so this "
               "passes vacuously)" if not comparison_rows else "")),
        "bar_charts_y_axis_starts_at_zero": (
            True,
            all(_fmt6(e["y_axis_start"] - 0) == "0.000000"
                for e in bar_rows),
            "method step 2 / quality gate: every declared bar or "
            "stacked-bar chart's declared y-axis start is zero"
            + (" (no bar chart is declared, so this passes "
               "vacuously)" if not bar_rows else "")),
        "no_dual_axes_in_declared_charts": (
            True,
            all(e["dual_axis"] is False for e in complete),
            "method step 2: no declared chart row declares a dual "
            "axis implying causation"),
        "truncated_axes_flagged_loudly": (
            True,
            all((e["truncated_flagged_loudly"] is True)
                if e["axis_truncated"] is True else True
                for e in complete),
            "method step 2: every declared chart row that declares "
            "a truncated axis also declares it flagged loudly"),
        "no_3d_in_declared_charts": (
            True,
            all(e["uses_3d"] is False for e in complete),
            "method step 3: no declared chart row declares 3D"),
        "red_green_not_used_alone_in_declared_charts": (
            True,
            all(e["red_green_only"] is False for e in complete),
            "method step 4 / quality gate: no declared chart row "
            "declares a red/green-only encoding"),
        "category_counts_within_stated_limit": (
            True, max_categories <= CATEGORY_LIMIT,
            "method step 4: the largest declared category count "
            "across chart rows is at most the 7 categories the "
            "skill states"),
        "axis_labels_and_units_complete": (
            True, True,
            "every complete chart entry carries a non-empty x-axis "
            "label, y-axis label, and y-axis unit"),
    }
    return (outcomes, evaluated, max_categories, category_difference,
            mismatched)


def _emit(results, section, name, outcomes, charts_value):
    present, ok, evidence = outcomes[name]
    _check(results, section, name, charts_value, present, ok, evidence)


def evaluate(manifest):
    """Return the verdict dict for a data-visualization-design manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []
    charts_value, _has_charts = _get(manifest, "charts")
    (outcomes, charts_evaluated, computed_max_categories,
     category_difference, charts_not_matching) = _chart_outcomes(manifest)

    # ---- Section 1: question_and_chart_choice (skill method
    #      step 1: "Question -> chart: comparison -> sorted bars;
    #      trend -> line (time on x); distribution ->
    #      histogram/box; relationship -> scatter; composition ->
    #      stacked bars (sparingly); part-to-whole over time ->
    #      small multiples, not pie-animations"; introduction:
    #      a chart is an argument for a reader) ----
    _string_check(results, "question_and_chart_choice",
                  "audience_declared",
                  manifest, ("brief", "audience"),
                  "the design record declares its audience as a "
                  "non-empty string")
    _string_check(results, "question_and_chart_choice",
                  "question_declared",
                  manifest, ("brief", "question"),
                  "the design record declares the question it "
                  "answers as a non-empty string")
    _emit(results, "question_and_chart_choice",
          "chart_entries_complete", outcomes, charts_value)
    _emit(results, "question_and_chart_choice",
          "chart_types_match_declared_questions", outcomes, charts_value)
    _emit(results, "question_and_chart_choice",
          "comparison_charts_sorted", outcomes, charts_value)

    # ---- Section 2: honesty_and_axes (skill method step 2:
    #      "Honesty rules: y-axis at zero for bars; no dual axes
    #      implying causation; consistent scales when comparing
    #      panels; label data source + date; if an axis is
    #      truncated — flag it loudly"; red line: "No misleading
    #      axes/scales") ----
    _emit(results, "honesty_and_axes",
          "bar_charts_y_axis_starts_at_zero", outcomes, charts_value)
    _emit(results, "honesty_and_axes",
          "no_dual_axes_in_declared_charts", outcomes, charts_value)
    _emit(results, "honesty_and_axes",
          "truncated_axes_flagged_loudly", outcomes, charts_value)
    _bool_check(results, "honesty_and_axes",
                "consistent_scales_when_comparing_panels",
                manifest,
                ("honesty", "consistent_scales_when_comparing_panels"),
                "method step 2: consistent scales are declared "
                "when comparing panels")
    _bool_check(results, "honesty_and_axes", "data_source_labeled",
                manifest, ("honesty", "data_source_labeled"),
                "method step 2: the data source is labeled on "
                "the chart")
    _bool_check(results, "honesty_and_axes", "data_date_labeled",
                manifest, ("honesty", "data_date_labeled"),
                "method step 2: the data date is labeled on the "
                "chart")
    _false_check(results, "honesty_and_axes",
                 "misleading_axes_or_scales_not_present",
                 manifest,
                 ("honesty", "misleading_axes_or_scales_present"),
                 "red line: no misleading axes or scales are "
                 "present")

    # ---- Section 3: perception_and_chart_junk (skill method
    #      step 3: "Perception first: position/length beat
    #      angle/area/color; most important thing top-left (or
    #      largest); chart-junk minimized (faint gridlines, no
    #      3D)"; red line: "No chart-junk as branding") ----
    _bool_check(results, "perception_and_chart_junk",
                "primary_encoding_uses_position_or_length",
                manifest,
                ("perception",
                 "primary_encoding_uses_position_or_length"),
                "method step 3: the primary encoding uses "
                "position or length, which beat angle, area "
                "and colour")
    _bool_check(results, "perception_and_chart_junk",
                "most_important_element_top_left_or_largest",
                manifest,
                ("perception",
                 "most_important_element_top_left_or_largest"),
                "method step 3: the most important thing is "
                "top-left or largest")
    _bool_check(results, "perception_and_chart_junk",
                "gridlines_faint",
                manifest, ("perception", "gridlines_faint"),
                "method step 3: gridlines are faint (chart-junk "
                "minimized)")
    _emit(results, "perception_and_chart_junk",
          "no_3d_in_declared_charts", outcomes, charts_value)
    _bool_check(results, "perception_and_chart_junk",
                "chart_junk_minimized",
                manifest, ("perception", "chart_junk_minimized"),
                "method step 3: chart-junk is minimized")
    _false_check(results, "perception_and_chart_junk",
                 "chart_junk_not_used_as_branding",
                 manifest,
                 ("perception", "chart_junk_used_as_branding"),
                 "red line: chart-junk is not used as branding")

    # ---- Section 4: color (skill method step 4: "Color with
    #      purpose: colorblind-safe categorical palettes;
    #      sequential for magnitude; diverging around a real
    #      midpoint; never red/green alone; <=7 categories";
    #      quality gate: "Colorblind-safe palette; no
    #      red/green-only encoding") ----
    _bool_check(results, "color", "palette_colorblind_safe",
                manifest, ("color", "palette_colorblind_safe"),
                "method step 4 / quality gate: the palette is "
                "declared colorblind-safe")
    _bool_check(results, "color",
                "sequential_palette_for_magnitude",
                manifest,
                ("color", "sequential_palette_for_magnitude"),
                "method step 4: a sequential palette is used "
                "for magnitude")
    _bool_check(results, "color",
                "diverging_palette_around_real_midpoint",
                manifest,
                ("color", "diverging_palette_around_real_midpoint"),
                "method step 4: any diverging palette is around "
                "a real midpoint")

    _emit(results, "color",
          "red_green_not_used_alone_in_declared_charts", outcomes,
          charts_value)
    _emit(results, "color", "category_counts_within_stated_limit",
          outcomes, charts_value)

    # ---- Section 5: annotation_and_labels (skill method step
    #      5: "Annotation that explains: title = the finding,
    #      not the topic; mark events/thresholds; call out
    #      outliers directly"; quality gate: "Title states the
    #      finding; key values annotated") ----
    _bool_check(results, "annotation_and_labels",
                "title_states_finding_not_topic",
                manifest,
                ("annotation", "title_states_finding_not_topic"),
                "method step 5 / quality gate: the title states "
                "the finding, not the topic")
    _bool_check(results, "annotation_and_labels",
                "events_and_thresholds_marked",
                manifest,
                ("annotation", "events_and_thresholds_marked"),
                "method step 5: events and thresholds are marked")
    _bool_check(results, "annotation_and_labels",
                "outliers_called_out_directly",
                manifest,
                ("annotation", "outliers_called_out_directly"),
                "method step 5: outliers are called out directly")
    _bool_check(results, "annotation_and_labels",
                "key_values_annotated",
                manifest, ("annotation", "key_values_annotated"),
                "quality gate: key values are annotated")

    _emit(results, "annotation_and_labels",
          "axis_labels_and_units_complete", outcomes, charts_value)

    # ---- Section 6: accessibility (skill method step 6:
    #      "Accessibility + text: legible sizes; alt text or
    #      table fallback; values readable without hover;
    #      contrast for print and screen"; quality gate:
    #      "accessible alternative exists") ----
    _bool_check(results, "accessibility", "legible_sizes",
                manifest, ("accessibility", "legible_sizes"),
                "method step 6: text sizes are legible")
    _bool_check(results, "accessibility",
                "alt_text_or_table_fallback_present",
                manifest,
                ("accessibility", "alt_text_or_table_fallback_present"),
                "method step 6 / quality gate: an alt text or "
                "table fallback (accessible alternative) exists")
    _bool_check(results, "accessibility",
                "values_readable_without_hover",
                manifest,
                ("accessibility", "values_readable_without_hover"),
                "method step 6: values are readable without hover")
    _bool_check(results, "accessibility",
                "contrast_sufficient_for_print_and_screen",
                manifest,
                ("accessibility",
                 "contrast_sufficient_for_print_and_screen"),
                "method step 6: contrast is sufficient for print "
                "and screen")

    # ---- Section 7: dashboards_and_reproducibility (skill
    #      method step 7: "Dashboards: one screen = one story;
    #      metric definitions + owners; refresh cadence visible;
    #      retire stale panels"; method step 8: "Tooling:
    #      version + data snapshot with every exported chart, so
    #      it's reproducible"; quality gate: "Source + date +
    #      snapshot recorded"; red line: "Never chart data you
    #      can't reproduce") ----
    _bool_check(results, "dashboards_and_reproducibility",
                "dashboard_one_screen_one_story",
                manifest, ("dashboard", "one_screen_one_story"),
                "method step 7: a dashboard screen tells one "
                "story")
    _bool_check(results, "dashboards_and_reproducibility",
                "metric_definitions_and_owners_declared",
                manifest,
                ("dashboard", "metric_definitions_and_owners_declared"),
                "method step 7: metric definitions and owners "
                "are declared")
    _bool_check(results, "dashboards_and_reproducibility",
                "refresh_cadence_visible",
                manifest, ("dashboard", "refresh_cadence_visible"),
                "method step 7: the refresh cadence is visible")
    _bool_check(results, "dashboards_and_reproducibility",
                "stale_panels_retired",
                manifest, ("dashboard", "stale_panels_retired"),
                "method step 7: stale panels are retired")
    _bool_check(results, "dashboards_and_reproducibility",
                "tool_version_and_data_snapshot_recorded",
                manifest,
                ("reproducibility",
                 "tool_version_and_data_snapshot_recorded"),
                "method step 8 / quality gate: the tool version "
                "and a data snapshot are recorded with the chart")
    _bool_check(results, "dashboards_and_reproducibility",
                "chart_data_reproducible",
                manifest, ("reproducibility", "data_reproducible"),
                "red line: the charted data is reproducible — "
                "data that cannot be reproduced is never charted")

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
        verdict = "DATA_VISUALIZATION_DESIGN_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "DATA_VISUALIZATION_DESIGN_SOUND"

    computed_names_set = (
        "chart_entries_complete",
        "chart_types_match_declared_questions",
        "comparison_charts_sorted",
        "bar_charts_y_axis_starts_at_zero",
        "no_dual_axes_in_declared_charts",
        "truncated_axes_flagged_loudly",
        "no_3d_in_declared_charts",
        "red_green_not_used_alone_in_declared_charts",
        "category_counts_within_stated_limit",
        "axis_labels_and_units_complete",
    )
    computed_statuses = [
        r["status"] for r in results if r["check"] in computed_names_set
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "data-visualization-design",
        "atom_version": "0.1.0",
        "entity": manifest.get("entity"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "charts_evaluated": charts_evaluated,
        "computed_max_categories": _fmt6(computed_max_categories),
        "max_categories_difference_from_limit": _fmt6(
            category_difference),
        "charts_not_matching_question": charts_not_matching,
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
        "DATA VISUALIZATION DESIGN",
        f"entity: {verdict.get('entity')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<36} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: data_visualization_design.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "DATA_VISUALIZATION_DESIGN_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
