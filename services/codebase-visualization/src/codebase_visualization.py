#!/usr/bin/env python3
"""Codebase visualization — deterministic core.

Built from the bound skill `code-visualization` (v1): "See the
codebase — diagrams-as-code, dependency and call graphs,
architecture maps, history views."

This atom does NOT render a diagram, draw a graph, or read any
actual code, and it exercises no judgment of its own. The caller
submits a codebase-visualization manifest: one DECLARED
visualization artifact record — its declared diagram entries
(name, stated diagrams-as-code format, scope, generation source
and generated-at label), its dependency view and module counts,
its call & flow views, its architecture map and declared C4
levels, its metrics and history views with a declared top
hotspot, and its honesty record. The atom validates that
artifact deterministically:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
arithmetic of the declared numbers — no outside threshold is
imported:

- diagram entries and formats (method step 1: "Diagrams-as-code
  over drag-drop: Mermaid/Graphviz/PlantUML in the repo"): every
  declared diagram entry must be complete, and every declared
  format must be one of the three formats the skill names;
- dependency coverage (method step 2: module/package import
  graphs): the declared modules included in the graph must
  equal the declared total modules, and the coverage ratio
  included / total is reported. No partial-coverage percentage
  is imposed as a pass mark — only exact equality of the two
  declared counts;
- C4 levels (method step 4: "C4-lite — context -> containers ->
  components"): the declared levels must cover all three levels
  the skill names;
- hotspot score (method step 5: change-frequency x complexity
  "hotspots"): the declared hotspot score must equal the
  declared change frequency multiplied by the declared
  complexity. The skill states no score cutoff, so none is
  imposed — only the arithmetic is re-derived.

Computed amounts and ratios are serialized as strings with
exactly six decimal places, produced in both implementations by
the same fixed rule — round half up to 6dp,
floor(v * 1000000 + 0.5) / 1000000, then format with exactly six
decimals; computed comparisons compare the fixed-6dp difference
to zero. That fixed serialization is what makes the Python and
TypeScript outputs byte-identical. The C4 levels the skill names
but the artifact does not declare are reported as
`c4_levels_not_declared` (null when no list is declared). The
computed outcome over the five computed checks is reported as
`computed_status`.

Verdict:
- any fail             -> CODEBASE_VISUALIZATION_NOT_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> CODEBASE_VISUALIZATION_READY

This is a completeness and consistency audit over declared
evidence, not a visualization review: an artifact that declares
every step passes even if its diagrams are poor, and nothing
here verifies that a declared diagram exists, that a declared
value is true, or that the underlying codebase matches the map.

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "diagrams_as_code",
    "dependency_views",
    "call_and_flow_views",
    "architecture_maps",
    "metrics_and_history_views",
    "honesty_and_currency",
)

STATED_DIAGRAM_FORMATS = [
    "mermaid",
    "graphviz",
    "plantuml",
]

STATED_C4_LEVELS = [
    "context",
    "containers",
    "components",
]

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
# Vocabulary strings (the diagram formats and the C4 level list
# entries) are validated as strings only, never enum-checked:
# coverage / format membership is a verdict check, not a type
# error.
MANIFEST_SPEC = {
    "entity": "string",
    "diagrams_as_code": {
        "key_diagrams_exist_as_code_in_repo": "boolean",
        "regenerable": "boolean",
        "versioned_and_diffable": "boolean",
        "regenerated_on_change": "boolean",
        "diagrams": [{
            "name": "string",
            "format": "string",
            "scope": "string",
            "generation_source": "string",
            "generated_at": "string",
        }],
    },
    "dependency": {
        "graph_present": "boolean",
        "cycles_highlighted": "boolean",
        "layering_violations_highlighted": "boolean",
        "known_issues_list_maintained": "boolean",
        "modules_total": "number",
        "modules_included": "number",
    },
    "call_and_flow": {
        "call_graph_for_hot_paths_present": "boolean",
        "sequence_diagrams_for_critical_journeys_present": "boolean",
        "data_flow_for_pipelines_present": "boolean",
    },
    "architecture": {
        "map_present": "boolean",
        "levels_declared": ["string"],
        "one_page_per_level": "boolean",
        "owners_annotated": "boolean",
        "boundaries_annotated": "boolean",
        "adrs_live_beside_maps": "boolean",
    },
    "metrics": {
        "complexity_heatmap_present": "boolean",
        "coverage_overlay_present": "boolean",
        "hotspot_view_considered": "boolean",
        "hotspot_change_frequency": "number",
        "hotspot_complexity": "number",
        "declared_hotspot_score": "number",
    },
    "history": {
        "churn_timeline_present": "boolean",
        "ownership_map_present": "boolean",
        "incident_overlays_present": "boolean",
    },
    "honesty": {
        "each_diagram_labeled_scope_and_generation_source": "boolean",
        "diagrams_labeled_generated_at_tool_scope": "boolean",
        "generatable_diagrams_generated": "boolean",
        "stale_diagrams_shipped_as_truth": "boolean",
        "unlabeled_hand_drawn_maps_guiding_decisions": "boolean",
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


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _is_nonempty_str(value):
    return isinstance(value, str) and len(value) > 0


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _diagram_checks(results, manifest):
    """Computed diagram-entry checks. Returns diagrams_evaluated."""
    diagrams, has_diagrams = _get(manifest, "diagrams_as_code", "diagrams")
    if not has_diagrams or not isinstance(diagrams, list) or not diagrams:
        for name in (
            "diagram_entries_complete",
            "diagram_formats_use_stated_diagrams_as_code_tools",
        ):
            _check(results, "diagrams_as_code", name,
                   diagrams, False, False,
                   "no diagram entries declared")
        return 0
    incomplete = False
    evaluated = 0
    formats_ok = True
    for entry in diagrams:
        if not isinstance(entry, dict):
            incomplete = True
            continue
        name_v, has_name = _get(entry, "name")
        format_v, has_format = _get(entry, "format")
        scope_v, has_scope = _get(entry, "scope")
        source_v, has_source = _get(entry, "generation_source")
        gen_at_v, has_gen_at = _get(entry, "generated_at")
        if not (has_name and has_format and has_scope and has_source
                and has_gen_at and _is_nonempty_str(name_v)
                and _is_nonempty_str(format_v)
                and _is_nonempty_str(scope_v)
                and _is_nonempty_str(source_v)
                and _is_nonempty_str(gen_at_v)):
            incomplete = True
            continue
        evaluated += 1
        if format_v not in STATED_DIAGRAM_FORMATS:
            formats_ok = False
    if incomplete:
        _check(results, "diagrams_as_code",
               "diagram_entries_complete",
               diagrams, False, False,
               "a diagram entry is missing its name, format, "
               "scope, generation source, or generated-at label")
    else:
        _check(results, "diagrams_as_code",
               "diagram_entries_complete",
               diagrams, True, True,
               "every diagram entry carries a name, format, "
               "scope, generation source, and generated-at label")
    if incomplete:
        _check(results, "diagrams_as_code",
               "diagram_formats_use_stated_diagrams_as_code_tools",
               diagrams, False, False,
               "a diagram entry is incomplete, so its format "
               "cannot be evaluated")
    else:
        _check(results, "diagrams_as_code",
               "diagram_formats_use_stated_diagrams_as_code_tools",
               diagrams, True, formats_ok,
               "method step 1: every declared diagram format is "
               "one of the diagrams-as-code tools the skill "
               "names — mermaid, graphviz, plantuml")
    return evaluated


def evaluate(manifest):
    """Return the verdict dict for a codebase-visualization manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: diagrams_as_code (skill method step 1:
    #      "Diagrams-as-code over drag-drop: Mermaid/Graphviz/
    #      PlantUML in the repo — versioned, diff-able,
    #      regenerated on change"; quality gate: "Key diagrams
    #      exist as code in-repo (regenerable)") ----
    _bool_check(results, "diagrams_as_code",
                "key_diagrams_exist_as_code_in_repo",
                manifest,
                ("diagrams_as_code",
                 "key_diagrams_exist_as_code_in_repo"),
                "quality gate: key diagrams exist as code in-repo")
    _bool_check(results, "diagrams_as_code", "diagrams_regenerable",
                manifest, ("diagrams_as_code", "regenerable"),
                "quality gate: the diagrams-as-code in-repo are "
                "regenerable")
    _bool_check(results, "diagrams_as_code",
                "diagrams_versioned_and_diffable",
                manifest,
                ("diagrams_as_code", "versioned_and_diffable"),
                "method step 1: diagrams-as-code are versioned "
                "and diff-able")
    _bool_check(results, "diagrams_as_code",
                "diagrams_regenerated_on_change",
                manifest,
                ("diagrams_as_code", "regenerated_on_change"),
                "method step 1: diagrams are regenerated on change")
    diagrams_evaluated = _diagram_checks(results, manifest)

    # ---- Section 2: dependency_views (skill method step 2:
    #      "Dependency views: module/package import graphs;
    #      highlight cycles and layering violations; keep a
    #      'known bad' list"; quality gate: "Cycles/layering
    #      violations visible; known-issues list maintained") ----
    _bool_check(results, "dependency_views", "dependency_graph_present",
                manifest, ("dependency", "graph_present"),
                "method step 2: a module/package dependency "
                "(import) graph is present")
    _bool_check(results, "dependency_views", "cycles_highlighted",
                manifest, ("dependency", "cycles_highlighted"),
                "quality gate: cycles are highlighted / visible "
                "in the dependency view")
    _bool_check(results, "dependency_views",
                "layering_violations_highlighted",
                manifest,
                ("dependency", "layering_violations_highlighted"),
                "quality gate: layering violations are "
                "highlighted / visible in the dependency view")
    _bool_check(results, "dependency_views",
                "known_issues_list_maintained",
                manifest,
                ("dependency", "known_issues_list_maintained"),
                "quality gate: a known-issues ('known bad') list "
                "is maintained")
    total, has_total = _get(manifest, "dependency", "modules_total")
    included, has_included = _get(manifest, "dependency",
                                  "modules_included")
    dep_all_numbers = (
        has_total and has_included
        and _is_number(total) and _is_number(included)
    )
    computed_coverage = (
        included / total
        if dep_all_numbers and total > 0
        else None
    )
    coverage_difference = (
        included - total
        if dep_all_numbers
        else None
    )
    dep_consistent = (
        dep_all_numbers and total > 0
        and _fmt6(included - total) == "0.000000"
    )
    _check(results, "dependency_views",
           "dependency_graph_covers_all_declared_modules",
           included, dep_all_numbers, dep_consistent,
           "method step 2: the declared modules included in "
           "the dependency graph equal the declared total "
           "modules (the graph covers the whole declared "
           "module set; no partial-coverage percentage is "
           "imposed)")

    # ---- Section 3: call_and_flow_views (skill method step 3:
    #      "Call & flow views: call graphs for hot paths;
    #      sequence diagrams for critical journeys; data-flow
    #      for pipelines") ----
    _bool_check(results, "call_and_flow_views",
                "call_graph_for_hot_paths_present",
                manifest,
                ("call_and_flow", "call_graph_for_hot_paths_present"),
                "method step 3: call graphs for hot paths are "
                "present")
    _bool_check(results, "call_and_flow_views",
                "sequence_diagrams_for_critical_journeys_present",
                manifest,
                ("call_and_flow",
                 "sequence_diagrams_for_critical_journeys_present"),
                "method step 3: sequence diagrams for critical "
                "journeys are present")
    _bool_check(results, "call_and_flow_views",
                "data_flow_views_for_pipelines_present",
                manifest,
                ("call_and_flow", "data_flow_for_pipelines_present"),
                "method step 3: data-flow views for pipelines "
                "are present")

    # ---- Section 4: architecture_maps (skill method step 4:
    #      "Architecture maps: C4-lite — context -> containers ->
    #      components; one page per level; annotate owners and
    #      boundaries (ADRs live beside them)") ----
    _bool_check(results, "architecture_maps", "architecture_map_present",
                manifest, ("architecture", "map_present"),
                "method step 4: an architecture map is present")
    levels, has_levels = _get(manifest, "architecture", "levels_declared")
    levels_is_list = has_levels and isinstance(levels, list)
    not_declared = (
        [level for level in STATED_C4_LEVELS if level not in levels]
        if levels_is_list else None
    )
    _check(results, "architecture_maps",
           "c4_levels_cover_stated_levels",
           levels, levels_is_list,
           levels_is_list and len(not_declared) == 0,
           "method step 4: the declared architecture levels "
           "cover every C4-lite level the skill names — "
           "context, containers, components")
    _bool_check(results, "architecture_maps", "one_page_per_level",
                manifest, ("architecture", "one_page_per_level"),
                "method step 4: the architecture map keeps one "
                "page per level")
    _bool_check(results, "architecture_maps", "owners_annotated",
                manifest, ("architecture", "owners_annotated"),
                "method step 4: owners are annotated on the "
                "architecture map")
    _bool_check(results, "architecture_maps", "boundaries_annotated",
                manifest, ("architecture", "boundaries_annotated"),
                "method step 4: boundaries are annotated on the "
                "architecture map")
    _bool_check(results, "architecture_maps", "adrs_live_beside_maps",
                manifest, ("architecture", "adrs_live_beside_maps"),
                "method step 4: ADRs live beside the architecture "
                "maps")

    # ---- Section 5: metrics_and_history_views (skill method
    #      step 5: "Metrics visualization: complexity heatmaps;
    #      change-frequency x complexity 'hotspots'; coverage
    #      overlays"; quality gate: "Hotspot view (churn x
    #      complexity) considered for refactor targets"; method
    #      step 6: "History views: churn timelines, ownership
    #      maps, incident overlays") ----
    _bool_check(results, "metrics_and_history_views",
                "complexity_heatmap_present",
                manifest, ("metrics", "complexity_heatmap_present"),
                "method step 5: a complexity heatmap is present")
    _bool_check(results, "metrics_and_history_views",
                "coverage_overlay_present",
                manifest, ("metrics", "coverage_overlay_present"),
                "method step 5: a coverage overlay is present")
    _bool_check(results, "metrics_and_history_views",
                "hotspot_view_considered",
                manifest, ("metrics", "hotspot_view_considered"),
                "quality gate: a hotspot view (churn x "
                "complexity) is considered for refactor targets")
    change_freq, has_cf = _get(manifest, "metrics",
                               "hotspot_change_frequency")
    complexity, has_cx = _get(manifest, "metrics", "hotspot_complexity")
    declared_score, has_score = _get(manifest, "metrics",
                                     "declared_hotspot_score")
    hotspot_all_numbers = (
        has_cf and has_cx and has_score
        and _is_number(change_freq) and _is_number(complexity)
        and _is_number(declared_score)
    )
    computed_hotspot = (
        change_freq * complexity
        if has_cf and has_cx and _is_number(change_freq)
        and _is_number(complexity)
        else None
    )
    hotspot_difference = (
        declared_score - computed_hotspot
        if computed_hotspot is not None and has_score
        and _is_number(declared_score)
        else None
    )
    hotspot_consistent = (
        hotspot_all_numbers
        and _fmt6(declared_score - change_freq * complexity)
        == "0.000000"
    )
    _check(results, "metrics_and_history_views",
           "hotspot_score_matches_change_frequency_times_complexity",
           declared_score, hotspot_all_numbers, hotspot_consistent,
           "method step 5: the declared hotspot score equals "
           "the declared change frequency multiplied by the "
           "declared complexity (change-frequency x complexity; "
           "no score cutoff is judged here)")
    _bool_check(results, "metrics_and_history_views",
                "churn_timeline_present",
                manifest, ("history", "churn_timeline_present"),
                "method step 6: a churn timeline history view "
                "is present")
    _bool_check(results, "metrics_and_history_views",
                "ownership_map_present",
                manifest, ("history", "ownership_map_present"),
                "method step 6: an ownership map history view "
                "is present")
    _bool_check(results, "metrics_and_history_views",
                "incident_overlays_present",
                manifest, ("history", "incident_overlays_present"),
                "method step 6: incident overlays on history "
                "views are present")

    # ---- Section 6: honesty_and_currency (skill method step 7:
    #      "Keep it honest: label generated-at + tool + scope;
    #      generate what can be generated; delete stale diagrams
    #      rather than let them lie"; quality gate: "Each diagram
    #      labeled with scope + generation source"; red lines:
    #      "No stale diagrams shipped as truth; no unlabeled
    #      hand-drawn maps guiding decisions") ----
    _bool_check(results, "honesty_and_currency",
                "each_diagram_labeled_with_scope_and_generation_source",
                manifest,
                ("honesty",
                 "each_diagram_labeled_scope_and_generation_source"),
                "quality gate: each diagram is labeled with "
                "scope and generation source")
    _bool_check(results, "honesty_and_currency",
                "diagrams_labeled_generated_at_tool_and_scope",
                manifest,
                ("honesty", "diagrams_labeled_generated_at_tool_scope"),
                "method step 7: diagrams are labeled with "
                "generated-at, tool, and scope")
    _bool_check(results, "honesty_and_currency",
                "generatable_diagrams_generated",
                manifest,
                ("honesty", "generatable_diagrams_generated"),
                "method step 7: what can be generated is "
                "generated")
    _false_check(results, "honesty_and_currency",
                 "stale_diagrams_not_shipped_as_truth",
                 manifest,
                 ("honesty", "stale_diagrams_shipped_as_truth"),
                 "red line: no stale diagrams are shipped as "
                 "truth — stale diagrams are deleted or "
                 "regenerated rather than let lie")
    _false_check(results, "honesty_and_currency",
                 "unlabeled_hand_drawn_maps_not_guiding_decisions",
                 manifest,
                 ("honesty",
                  "unlabeled_hand_drawn_maps_guiding_decisions"),
                 "red line: no unlabeled hand-drawn maps guide "
                 "decisions — regenerate or remove")

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
        verdict = "CODEBASE_VISUALIZATION_NOT_READY"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "CODEBASE_VISUALIZATION_READY"

    computed_statuses = [
        r["status"] for r in results
        if r["check"] in (
            "diagram_entries_complete",
            "diagram_formats_use_stated_diagrams_as_code_tools",
            "dependency_graph_covers_all_declared_modules",
            "c4_levels_cover_stated_levels",
            "hotspot_score_matches_change_frequency_times_complexity")
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "codebase-visualization",
        "atom_version": "0.1.0",
        "entity": manifest.get("entity"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "diagrams_evaluated": diagrams_evaluated,
        "computed_dependency_coverage": _fmt6(computed_coverage),
        "dependency_coverage_difference": _fmt6(coverage_difference),
        "computed_hotspot_score": _fmt6(computed_hotspot),
        "hotspot_score_difference": _fmt6(hotspot_difference),
        "c4_levels_not_declared": not_declared,
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
        "CODEBASE VISUALIZATION",
        f"entity: {verdict.get('entity')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<28} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: codebase_visualization.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "CODEBASE_VISUALIZATION_READY" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
