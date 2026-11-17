#!/usr/bin/env python3
"""Product metrics event taxonomy pack — deterministic core.

Built from the bound skill `product-analytics`: "Measure what
matters — event taxonomy, privacy-aware analytics, decided
dashboards, honest A/B tests." ("Measurement exists to make
decisions. Define events before shipping, keep them
privacy-safe, and let dashboards carry owners and targets — or
don't build them.")

This atom is a DELIVERABLE audit of a declared product-metrics
and event-taxonomy record: it audits the record a caller
declares against the pack the skill defines — a named decision
and a KPI tree (north star -> inputs) first, a versioned event
taxonomy in `object_action` snake_case with declared event
properties, data quality, privacy by construction, dashboards
with owners, honest experiments, feedback joined to data, and
the skill's red lines refused. It does not collect analytics
itself, inspect an event stream, a codebase, or a dashboard,
run an experiment, or verify that a declared taxonomy was
ever implemented — it checks that the taxonomy record the
skill requires is present and internally complete and
consistent on the declared evidence.

Distinct ground: the nearest siblings are
`agent-evaluation-scorecard` (a declared agent-evaluation
record — task suites, pinned runs, judging, regression gates),
`data-analysis-deliverable` (a declared one-page analysis
deliverable — question framing, stated figures checked against
declared values, inference discipline) and
`forecast-confidence-scoreboard` (a declared forecast ledger
and scoreboard — probabilities, outcomes, Brier calibration).
This atom shares zero checks with any of them: every check
here is a product-metrics / event-taxonomy question — the
decision the data changes, the KPI tree from north star to
inputs, every metric carrying one documented definition and a
KPI-tree role, event names in `object_action` snake_case,
versioned per-feature event specs reviewed and validated
before code ships, declared event properties typed and marked
required or optional with no orphan properties and no event
left without declared properties, capture-time validation and
dupe/drop dashboard audits, pseudonymous IDs only with consent
gating and aggregation before export, no property row declaring
PII, charts carrying question + definition + owner + target,
experiments with hypothesis, primary metric, guardrails and
sample-size rationale recorded before launch, and qualitative
support themes beside the quantitative results. The boundary
is: a product's metrics-and-events taxonomy record here; an
agent's evaluation scorecard, a one-off analysis deliverable,
and a forecast calibration scoreboard there.

The caller submits a taxonomy manifest (a dict, or JSON on
the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus
the consistency of the declared rows themselves — no outside
threshold is imported:

- metrics: the declared `metrics` list must be present (an
  empty list is a valid declaration — the pack declares no
  metrics; the skill requires no particular metric), every
  declared metric row must carry a non-empty `definition`
  (the red line: "no metrics without definitions"), no metric
  `name` may be duplicated, and every row must name a
  `kpi_tree_role` that is one of the two roles the skill's
  KPI tree states — `north_star` or `input`;
- events: the declared `events` list must be present (an
  empty list likewise declares no events), every declared
  event `name` must follow the skill's stated naming
  convention — `object_action`, snake_case, at least one
  underscore joining object and action — no event `name` may
  be duplicated, and every row must name the non-empty
  `feature` it belongs to and a non-empty `spec_version`
  (the skill's versioned event spec per feature);
- properties: the declared `properties` list must be present
  (an empty list likewise declares no properties), every
  declared property row must name its `event_name`, no
  (event, property) pair may be duplicated, every row must
  declare a non-empty `data_type` and a `requirement` that is
  one of the two marks the skill states — `required` or
  `optional` — no property row may be an orphan (its
  `event_name` must name a declared event), and every
  declared event must have at least one declared property
  (the event spec's properties are part of the spec);
- privacy over rows: no declared property row may declare
  `contains_pii` true (the red line: "No PII in analytics").

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons
use the unrounded values. That fixed serialization is what
makes the Python and TypeScript outputs byte-identical.
Counts are reported as integers (exact).

The skill states no numeric threshold at all — no minimum
number of metrics, events or properties, no sample size, no
significance level, no coverage percentage, no retention
period — so no numeric threshold check is invented; those
quantities are caller attestations at most, and quantities
here are computed and reported, with completeness over the
caller's own declared rows (every declared row, exactly as
stated above) as the only bar.

Verdict:
- any fail             -> PRODUCT_METRICS_EVENT_TAXONOMY_PACK_NOT_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> PRODUCT_METRICS_EVENT_TAXONOMY_PACK_READY

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism
is the product.
"""
import json
import math
import re
import sys

SECTIONS = (
    "decision_and_kpi_tree",
    "event_taxonomy_and_spec",
    "data_quality",
    "privacy_by_construction",
    "dashboards_experiments_and_feedback",
    "red_lines",
)

EVENT_NAME_PATTERN = re.compile(r"[a-z][a-z0-9]*(?:_[a-z0-9]+)+")
KPI_TREE_ROLES = ("north_star", "input")
PROPERTY_REQUIREMENTS = ("required", "optional")

MANIFEST_SPEC = {
    "product": "string",
    "decision": {
        "measurement_decision_named": "boolean",
        "tracking_only_for_a_named_decision": "boolean",
        "kpi_tree_from_north_star_to_inputs_declared": "boolean",
    },
    "metrics": [{
        "name": "string",
        "definition": "string",
        "kpi_tree_role": "string",
    }],
    "taxonomy": {
        "naming_convention_adopted_for_event_names": "boolean",
        "event_spec_written_before_feature_code": "boolean",
        "event_spec_reviewed_before_code": "boolean",
        "analytics_reviewed_in_pull_request": "boolean",
        "event_spec_validated_in_staging": "boolean",
    },
    "events": [{
        "name": "string",
        "feature": "string",
        "spec_version": "string",
    }],
    "properties": [{
        "event_name": "string",
        "name": "string",
        "data_type": "string",
        "requirement": "string",
        "contains_pii": "boolean",
    }],
    "data_quality": {
        "capture_time_validation_planned": "boolean",
        "dashboard_dupe_and_drop_audit_planned": "boolean",
        "taxonomy_definitions_documented": "boolean",
        "two_definitions_of_one_metric_treated_as_bugs": "boolean",
    },
    "privacy": {
        "pseudonymous_ids_only_in_events": "boolean",
        "consent_gating_applied_where_required": "boolean",
        "aggregation_before_export_applied_where_possible": "boolean",
    },
    "dashboards": {
        "every_chart_carries_question_definition_owner_target": "boolean",
        "trends_shown_over_snapshots": "boolean",
        "dashboard_segmentation_done_thoughtfully": "boolean",
        "dead_metrics_and_dashboards_retired": "boolean",
    },
    "experiments": {
        "hypothesis_and_primary_metric_recorded_before_launch": "boolean",
        "guardrails_and_sample_size_rationale_recorded_before_launch":
            "boolean",
        "single_change_per_experiment": "boolean",
        "assignment_and_blinding_checks_planned": "boolean",
        "experiment_results_written_down_including_no_effect": "boolean",
    },
    "feedback": {
        "qualitative_support_themes_placed_beside_quantitative_results":
            "boolean",
        "qualitative_and_quantitative_feedback_both_feed_backlog":
            "boolean",
    },
    "red_lines": {
        "pii_in_analytics_events_present": "boolean",
        "unregistered_experiments_present": "boolean",
        "metrics_without_definitions_present": "boolean",
        "dark_pattern_measurement_present": "boolean",
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


def _non_empty_str(value):
    return isinstance(value, str) and value != ""


def _duplicates(values):
    seen = []
    dups = []
    for value in values:
        if value in seen and value not in dups:
            dups.append(value)
        seen.append(value)
    return dups


def evaluate(manifest):
    """Return the verdict dict for a product metrics event taxonomy manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    metrics, has_metrics = _get(manifest, "metrics")
    metrics_is_list = has_metrics and isinstance(metrics, list)
    metrics_count = len(metrics) if metrics_is_list else None
    m_rows = metrics if metrics_is_list else []

    events, has_events = _get(manifest, "events")
    events_is_list = has_events and isinstance(events, list)
    events_count = len(events) if events_is_list else None
    e_rows = events if events_is_list else []

    properties, has_properties = _get(manifest, "properties")
    properties_is_list = has_properties and isinstance(properties, list)
    properties_count = len(properties) if properties_is_list else None
    p_rows = properties if properties_is_list else []

    metrics_without_definition = (
        [_row_name(c) for c in m_rows
         if isinstance(c, dict)
         and "definition" in c
         and not _non_empty_str(c.get("definition"))]
        if metrics_is_list else None
    )
    duplicate_metric_names = (
        _duplicates([c["name"] for c in m_rows
                     if isinstance(c, dict)
                     and isinstance(c.get("name"), str)])
        if metrics_is_list else None
    )
    duplicate_event_names = (
        _duplicates([c["name"] for c in e_rows
                     if isinstance(c, dict)
                     and isinstance(c.get("name"), str)])
        if events_is_list else None
    )
    duplicate_property_keys = (
        _duplicates([f"{c['event_name']}.{c['name']}" for c in p_rows
                     if isinstance(c, dict)
                     and isinstance(c.get("event_name"), str)
                     and isinstance(c.get("name"), str)])
        if properties_is_list else None
    )
    event_names = (
        [c["name"] for c in e_rows
         if isinstance(c, dict) and isinstance(c.get("name"), str)]
        if events_is_list else []
    )
    property_event_names = (
        [c["event_name"] for c in p_rows
         if isinstance(c, dict)
         and isinstance(c.get("event_name"), str)]
        if properties_is_list else []
    )
    orphan_property_rows = (
        [_row_name(c) for c in p_rows
         if isinstance(c, dict)
         and _non_empty_str(c.get("event_name"))
         and c.get("event_name") not in event_names]
        if properties_is_list and events_is_list else None
    )
    events_without_properties = (
        [c["name"] for c in e_rows
         if isinstance(c, dict)
         and isinstance(c.get("name"), str)
         and c.get("name") not in property_event_names]
        if events_is_list and properties_is_list else None
    )
    definition_coverage = (
        sum(1 for c in m_rows
            if isinstance(c, dict)
            and _non_empty_str(c.get("definition")))
        / metrics_count
        if metrics_is_list and metrics_count > 0 else None
    )
    event_property_coverage = (
        sum(1 for c in e_rows
            if isinstance(c, dict)
            and isinstance(c.get("name"), str)
            and c.get("name") in property_event_names)
        / events_count
        if events_is_list and properties_is_list and events_count > 0
        else None
    )

    # ---- Section 1: decision_and_kpi_tree (skill Method 1
    #      "Question first" — what decision will this data
    #      change; metrics tie to a KPI tree, north star ->
    #      inputs; plus the computed metric rows, including
    #      the red line that no metric stands without a
    #      definition) ----
    _bool_check(results, "decision_and_kpi_tree",
                "measurement_decision_named", manifest,
                ("decision", "measurement_decision_named"),
                "question first: the decision this data will "
                "change is named — if no decision changes, the "
                "tracking is not built")
    _bool_check(results, "decision_and_kpi_tree",
                "tracking_only_for_a_named_decision", manifest,
                ("decision", "tracking_only_for_a_named_decision"),
                "question first: tracking is limited to what a "
                "named decision needs, not curiosity")
    _bool_check(results, "decision_and_kpi_tree",
                "kpi_tree_from_north_star_to_inputs_declared",
                manifest,
                ("decision",
                 "kpi_tree_from_north_star_to_inputs_declared"),
                "question first: the metrics tie to a KPI tree "
                "— north star to inputs — as declared")
    _check(results, "decision_and_kpi_tree",
           "taxonomy_metrics_declared", metrics, metrics_is_list,
           metrics_is_list,
           "the declared record names its metrics — the "
           "metrics list is present; an empty list declares "
           "that the pack declares no metrics")
    metric_definition_present = (
        metrics_is_list
        and all(isinstance(c, dict) and "definition" in c
                for c in m_rows)
    )
    _check(results, "decision_and_kpi_tree",
           "every_metric_names_definition", metrics,
           metric_definition_present,
           metrics_is_list
           and all(isinstance(c, dict)
                   and _non_empty_str(c.get("definition"))
                   for c in m_rows),
           "metrics: every declared metric row carries a "
           "definition — no metrics without definitions")
    metric_name_present = (
        metrics_is_list
        and all(isinstance(c, dict) and "name" in c for c in m_rows)
    )
    _check(results, "decision_and_kpi_tree",
           "no_taxonomy_metric_name_duplicated", metrics,
           metric_name_present,
           metrics_is_list
           and duplicate_metric_names is not None
           and len(duplicate_metric_names) == 0,
           "metrics: no declared metric name is owned by more "
           "than one metric row — one metric, one record")
    metric_role_present = (
        metrics_is_list
        and all(isinstance(c, dict) and "kpi_tree_role" in c
                for c in m_rows)
    )
    _check(results, "decision_and_kpi_tree",
           "every_metric_names_kpi_tree_role", metrics,
           metric_role_present,
           metrics_is_list
           and all(isinstance(c, dict)
                   and _non_empty_str(c.get("kpi_tree_role"))
                   for c in m_rows),
           "metrics: every declared metric row names its role "
           "in the KPI tree")
    _check(results, "decision_and_kpi_tree",
           "every_metric_kpi_tree_role_is_north_star_or_input",
           metrics, metric_role_present,
           metrics_is_list
           and all(isinstance(c, dict)
                   and c.get("kpi_tree_role") in KPI_TREE_ROLES
                   for c in m_rows),
           "metrics: every declared KPI-tree role is one of "
           "the two roles the skill's KPI tree states — "
           "north_star or input")

    # ---- Section 2: event_taxonomy_and_spec (skill Method 2
    #      "Event taxonomy" — naming convention object_action,
    #      snake_case; a versioned event spec per feature,
    #      properties, types, required/optional, reviewed
    #      BEFORE code; analytics reviewed in the PR; and the
    #      quality gate's spec validated in staging — plus
    #      the computed event and property rows) ----
    _bool_check(results, "event_taxonomy_and_spec",
                "naming_convention_adopted_for_event_names",
                manifest,
                ("taxonomy",
                 "naming_convention_adopted_for_event_names"),
                "event taxonomy: a naming convention for event "
                "names is adopted — object_action, snake_case")
    _bool_check(results, "event_taxonomy_and_spec",
                "event_spec_written_before_feature_code", manifest,
                ("taxonomy", "event_spec_written_before_feature_code"),
                "event taxonomy: the event spec exists before "
                "the feature ships — written before feature code")
    _bool_check(results, "event_taxonomy_and_spec",
                "event_spec_reviewed_before_code", manifest,
                ("taxonomy", "event_spec_reviewed_before_code"),
                "event taxonomy: the versioned event spec is "
                "reviewed before code")
    _bool_check(results, "event_taxonomy_and_spec",
                "analytics_reviewed_in_pull_request", manifest,
                ("taxonomy", "analytics_reviewed_in_pull_request"),
                "event taxonomy: analytics is reviewed in the "
                "pull request")
    _bool_check(results, "event_taxonomy_and_spec",
                "event_spec_validated_in_staging", manifest,
                ("taxonomy", "event_spec_validated_in_staging"),
                "quality gate: the event spec is validated in "
                "staging")
    _check(results, "event_taxonomy_and_spec",
           "events_declared", events, events_is_list,
           events_is_list,
           "the declared record names its events — the events "
           "list is present; an empty list declares that the "
           "pack declares no events")
    event_name_present = (
        events_is_list
        and all(isinstance(c, dict) and "name" in c for c in e_rows)
    )
    _check(results, "event_taxonomy_and_spec",
           "every_event_name_follows_object_action_snake_case",
           events, event_name_present,
           events_is_list
           and all(isinstance(c, dict)
                   and isinstance(c.get("name"), str)
                   and EVENT_NAME_PATTERN.fullmatch(c.get("name"))
                   is not None
                   for c in e_rows),
           "events: every declared event name follows the "
           "skill's naming convention — object_action in "
           "snake_case, object and action joined by an "
           "underscore")
    _check(results, "event_taxonomy_and_spec",
           "no_event_name_duplicated", events,
           event_name_present,
           events_is_list
           and duplicate_event_names is not None
           and len(duplicate_event_names) == 0,
           "events: no declared event name is owned by more "
           "than one event row")
    event_feature_present = (
        events_is_list
        and all(isinstance(c, dict) and "feature" in c
                for c in e_rows)
    )
    _check(results, "event_taxonomy_and_spec",
           "every_event_names_its_feature", events,
           event_feature_present,
           events_is_list
           and all(isinstance(c, dict)
                   and _non_empty_str(c.get("feature"))
                   for c in e_rows),
           "events: every declared event row names the "
           "feature its spec belongs to — a versioned event "
           "spec per feature")
    event_version_present = (
        events_is_list
        and all(isinstance(c, dict) and "spec_version" in c
                for c in e_rows)
    )
    _check(results, "event_taxonomy_and_spec",
           "every_event_names_spec_version", events,
           event_version_present,
           events_is_list
           and all(isinstance(c, dict)
                   and _non_empty_str(c.get("spec_version"))
                   for c in e_rows),
           "events: every declared event row names its spec "
           "version — the event spec is versioned")
    _check(results, "event_taxonomy_and_spec",
           "properties_declared", properties, properties_is_list,
           properties_is_list,
           "the declared record names its event properties — "
           "the properties list is present; an empty list "
           "declares that the pack declares no properties")
    property_event_present = (
        properties_is_list
        and all(isinstance(c, dict) and "event_name" in c
                for c in p_rows)
    )
    _check(results, "event_taxonomy_and_spec",
           "every_property_names_its_event", properties,
           property_event_present,
           properties_is_list
           and all(isinstance(c, dict)
                   and _non_empty_str(c.get("event_name"))
                   for c in p_rows),
           "properties: every declared property row names "
           "the event it belongs to")
    property_pair_present = (
        properties_is_list
        and all(isinstance(c, dict) and "event_name" in c
                and "name" in c for c in p_rows)
    )
    _check(results, "event_taxonomy_and_spec",
           "no_property_duplicated_for_same_event", properties,
           property_pair_present,
           properties_is_list
           and duplicate_property_keys is not None
           and len(duplicate_property_keys) == 0,
           "properties: no declared property is declared "
           "twice for the same event")
    property_type_present = (
        properties_is_list
        and all(isinstance(c, dict) and "data_type" in c
                for c in p_rows)
    )
    _check(results, "event_taxonomy_and_spec",
           "every_property_declares_a_data_type", properties,
           property_type_present,
           properties_is_list
           and all(isinstance(c, dict)
                   and _non_empty_str(c.get("data_type"))
                   for c in p_rows),
           "properties: every declared property row declares "
           "its type — the event spec states properties and "
           "types")
    property_requirement_present = (
        properties_is_list
        and all(isinstance(c, dict) and "requirement" in c
                for c in p_rows)
    )
    _check(results, "event_taxonomy_and_spec",
           "every_property_marks_required_or_optional",
           properties, property_requirement_present,
           properties_is_list
           and all(isinstance(c, dict)
                   and c.get("requirement") in PROPERTY_REQUIREMENTS
                   for c in p_rows),
           "properties: every declared property row is "
           "marked one of the two marks the skill states — "
           "required or optional")
    orphan_present = (
        properties_is_list and events_is_list
        and all(isinstance(c, dict) and "event_name" in c
                for c in p_rows)
        and all(isinstance(c, dict) and "name" in c
                for c in e_rows)
    )
    _check(results, "event_taxonomy_and_spec",
           "no_orphan_property_rows", properties,
           orphan_present,
           properties_is_list and events_is_list
           and orphan_property_rows is not None
           and len(orphan_property_rows) == 0,
           "properties: no declared property row names an "
           "event that is not itself declared — no orphan "
           "properties")
    coverage_present = (
        events_is_list and properties_is_list
        and all(isinstance(c, dict) and "name" in c
                for c in e_rows)
        and all(isinstance(c, dict) and "event_name" in c
                for c in p_rows)
    )
    _check(results, "event_taxonomy_and_spec",
           "every_event_has_declared_properties", events,
           coverage_present,
           events_is_list and properties_is_list
           and events_without_properties is not None
           and len(events_without_properties) == 0,
           "properties: every declared event has at least "
           "one declared property — the properties are part "
           "of each event's spec")

    # ---- Section 3: data_quality (skill Method 3 "Data
    #      quality" — validation at capture, test events in
    #      staging, dashboards audited for dupes/drops,
    #      definitions documented; a metric with two
    #      definitions is two bugs) ----
    _bool_check(results, "data_quality",
                "capture_time_validation_planned", manifest,
                ("data_quality", "capture_time_validation_planned"),
                "data quality: validation at capture is planned")
    _bool_check(results, "data_quality",
                "dashboard_dupe_and_drop_audit_planned", manifest,
                ("data_quality",
                 "dashboard_dupe_and_drop_audit_planned"),
                "data quality: dashboards are audited for "
                "dupes and drops")
    _bool_check(results, "data_quality",
                "taxonomy_definitions_documented", manifest,
                ("data_quality", "taxonomy_definitions_documented"),
                "data quality: the taxonomy's definitions are "
                "documented")
    _bool_check(results, "data_quality",
                "two_definitions_of_one_metric_treated_as_bugs",
                manifest,
                ("data_quality",
                 "two_definitions_of_one_metric_treated_as_bugs"),
                "data quality: a metric with two definitions "
                "is treated as two bugs")

    # ---- Section 4: privacy_by_construction (skill Method 4
    #      "Privacy-aware by construction" — no PII in events,
    #      IDs only and pseudonymous, consent gating where
    #      required, aggregate before export where possible;
    #      plus the computed property-row PII check) ----
    _bool_check(results, "privacy_by_construction",
                "pseudonymous_ids_only_in_events", manifest,
                ("privacy", "pseudonymous_ids_only_in_events"),
                "privacy: events carry IDs only, pseudonymous "
                "— no PII in events")
    _bool_check(results, "privacy_by_construction",
                "consent_gating_applied_where_required", manifest,
                ("privacy", "consent_gating_applied_where_required"),
                "privacy: consent gating is applied where "
                "required")
    _bool_check(results, "privacy_by_construction",
                "aggregation_before_export_applied_where_possible",
                manifest,
                ("privacy",
                 "aggregation_before_export_applied_where_possible"),
                "privacy: data is aggregated before export "
                "where possible")
    property_pii_present = (
        properties_is_list
        and all(isinstance(c, dict) and "contains_pii" in c
                for c in p_rows)
    )
    _check(results, "privacy_by_construction",
           "no_property_row_declares_pii", properties,
           property_pii_present,
           properties_is_list
           and all(isinstance(c, dict)
                   and c.get("contains_pii") is False
                   for c in p_rows),
           "privacy: no declared property row declares that "
           "it contains PII — no PII in analytics events")

    # ---- Section 5: dashboards_experiments_and_feedback
    #      (skill Method 5 "Dashboards with owners" — each
    #      chart is question + definition + owner + target,
    #      trends over snapshots, thoughtful segmentation,
    #      dead metrics retired; Method 6 "Experiments" —
    #      hypothesis, primary metric, guardrails and
    #      sample-size rationale before launch, one change
    #      per test, assignment/blinding checks, results
    #      written down including no effect; Method 7
    #      "Feedback joins data" — qualitative themes beside
    #      quantitative, both feeding the backlog) ----
    _bool_check(results, "dashboards_experiments_and_feedback",
                "every_chart_carries_question_definition_owner_target",
                manifest,
                ("dashboards",
                 "every_chart_carries_question_definition_owner_target"),
                "dashboards: each chart carries a question, a "
                "definition, an owner and a target — or it is "
                "not built")
    _bool_check(results, "dashboards_experiments_and_feedback",
                "trends_shown_over_snapshots", manifest,
                ("dashboards", "trends_shown_over_snapshots"),
                "dashboards: trends are shown over snapshots")
    _bool_check(results, "dashboards_experiments_and_feedback",
                "dashboard_segmentation_done_thoughtfully",
                manifest,
                ("dashboards",
                 "dashboard_segmentation_done_thoughtfully"),
                "dashboards: segmentation is done thoughtfully")
    _bool_check(results, "dashboards_experiments_and_feedback",
                "dead_metrics_and_dashboards_retired", manifest,
                ("dashboards", "dead_metrics_and_dashboards_retired"),
                "dashboards: dead metrics are retired — no "
                "vanity walls")
    _bool_check(results, "dashboards_experiments_and_feedback",
                "hypothesis_and_primary_metric_recorded_before_launch",
                manifest,
                ("experiments",
                 "hypothesis_and_primary_metric_recorded_before_launch"),
                "experiments: the hypothesis and the primary "
                "metric are recorded before launch")
    _bool_check(results, "dashboards_experiments_and_feedback",
                "guardrails_and_sample_size_rationale_recorded_before_launch",
                manifest,
                ("experiments",
                 "guardrails_and_sample_size_rationale_recorded_before_launch"),
                "experiments: guardrails and the sample-size "
                "rationale are recorded before launch")
    _bool_check(results, "dashboards_experiments_and_feedback",
                "single_change_per_experiment", manifest,
                ("experiments", "single_change_per_experiment"),
                "experiments: one change per test")
    _bool_check(results, "dashboards_experiments_and_feedback",
                "assignment_and_blinding_checks_planned", manifest,
                ("experiments",
                 "assignment_and_blinding_checks_planned"),
                "experiments: assignment and blinding checks "
                "are planned")
    _bool_check(results, "dashboards_experiments_and_feedback",
                "experiment_results_written_down_including_no_effect",
                manifest,
                ("experiments",
                 "experiment_results_written_down_including_no_effect"),
                "experiments: results are written down — "
                "including no effect, which is a result, not "
                "a failure")
    _bool_check(results, "dashboards_experiments_and_feedback",
                "qualitative_support_themes_placed_beside_quantitative_results",
                manifest,
                ("feedback",
                 "qualitative_support_themes_placed_beside_quantitative_results"),
                "feedback joins data: qualitative themes from "
                "support are placed beside the quantitative "
                "results")
    _bool_check(results, "dashboards_experiments_and_feedback",
                "qualitative_and_quantitative_feedback_both_feed_backlog",
                manifest,
                ("feedback",
                 "qualitative_and_quantitative_feedback_both_feed_backlog"),
                "feedback joins data: qualitative and "
                "quantitative feedback both feed the backlog")

    # ---- Section 6: red_lines (skill "Red lines" — no PII in
    #      analytics, no unregistered experiments, no metrics
    #      without definitions, never dark-pattern
    #      measurement) ----
    _false_check(results, "red_lines",
                 "no_pii_in_analytics_events", manifest,
                 ("red_lines", "pii_in_analytics_events_present"),
                 "red line: no PII in analytics events is "
                 "present in the record")
    _false_check(results, "red_lines",
                 "no_unregistered_experiments", manifest,
                 ("red_lines", "unregistered_experiments_present"),
                 "red line: no unregistered experiments are "
                 "present in the record")
    _false_check(results, "red_lines",
                 "no_metrics_without_definitions", manifest,
                 ("red_lines", "metrics_without_definitions_present"),
                 "red line: no metrics without definitions are "
                 "present in the record")
    _false_check(results, "red_lines",
                 "no_dark_pattern_measurement", manifest,
                 ("red_lines", "dark_pattern_measurement_present"),
                 "red line: no dark-pattern measurement is "
                 "present in the record")

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
        verdict = "PRODUCT_METRICS_EVENT_TAXONOMY_PACK_NOT_READY"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "PRODUCT_METRICS_EVENT_TAXONOMY_PACK_READY"

    computed_names = (
        "taxonomy_metrics_declared",
        "every_metric_names_definition",
        "no_taxonomy_metric_name_duplicated",
        "every_metric_names_kpi_tree_role",
        "every_metric_kpi_tree_role_is_north_star_or_input",
        "events_declared",
        "every_event_name_follows_object_action_snake_case",
        "no_event_name_duplicated",
        "every_event_names_its_feature",
        "every_event_names_spec_version",
        "properties_declared",
        "every_property_names_its_event",
        "no_property_duplicated_for_same_event",
        "every_property_declares_a_data_type",
        "every_property_marks_required_or_optional",
        "no_orphan_property_rows",
        "every_event_has_declared_properties",
        "no_property_row_declares_pii",
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
        "service": "product-metrics-event-taxonomy-pack",
        "atom_version": "0.1.0",
        "product": manifest.get("product"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "metrics_count": metrics_count,
        "events_count": events_count,
        "properties_count": properties_count,
        "metrics_without_definition": metrics_without_definition,
        "duplicate_metric_names": duplicate_metric_names,
        "duplicate_event_names": duplicate_event_names,
        "duplicate_property_keys": duplicate_property_keys,
        "orphan_property_rows": orphan_property_rows,
        "events_without_properties": events_without_properties,
        "definition_coverage": _fmt6(definition_coverage),
        "event_property_coverage": _fmt6(event_property_coverage),
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
        "PRODUCT METRICS EVENT TAXONOMY PACK",
        f"product: {verdict.get('product')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: product_metrics_event_taxonomy_pack.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == \
        "PRODUCT_METRICS_EVENT_TAXONOMY_PACK_READY" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
