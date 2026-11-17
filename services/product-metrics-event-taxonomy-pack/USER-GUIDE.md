# Product metrics event taxonomy pack — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are designing a product's metrics and event taxonomy before the feature ships — the decision the data will change, the KPI tree, the event names and their properties, the dashboards and the experiments — and you have a declared record of that design. This atom reads one declared manifest and returns one deterministic verdict across six sections (decision_and_kpi_tree, event_taxonomy_and_spec, data_quality, privacy_by_construction, dashboards_experiments_and_feedback, red_lines): **PRODUCT_METRICS_EVENT_TAXONOMY_PACK_READY**, **PRODUCT_METRICS_EVENT_TAXONOMY_PACK_NOT_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It runs 48 checks. It audits the declared taxonomy record's completeness and consistency only — it collects no analytics itself, inspects no event stream, codebase, pull request, staging environment or dashboard, runs no experiment, and does not verify that a declared taxonomy was ever implemented. A pack is ready *on your declared evidence*: it never judges whether the named decision is the right decision, whether a metric's definition is correct or useful, whether the north star is well chosen, whether a property's declared type matches the values actually sent, or whether an experiment was well designed. The computed checks: the declared `metrics`, `events` and `properties` lists must each be present (an empty list is a valid declaration that the pack declares none of that row kind); every metric row must carry a non-empty `definition` and a `kpi_tree_role` of `north_star` or `input`, with no metric name duplicated; every event `name` must follow the `object_action` snake_case convention (`^[a-z][a-z0-9]*(_[a-z0-9]+)+$`), with no event name duplicated and every row naming a non-empty `feature` and `spec_version`; every property row must name a non-empty `event_name`, a non-empty `data_type` and a `requirement` of `required` or `optional`, with no (`event_name`, `name`) pair duplicated, no orphan property rows, every declared event covered by at least one property row, and no property row declaring `contains_pii` true. The skill states no numeric threshold at all — no minimum number of metrics, events or properties in the pack; no minimum definition, property or event coverage percentage; no north-star count beyond the declared KPI-tree roles themselves; no property-type vocabulary beyond a type being declared; no sample size, power, significance level or minimum detectable effect for experiments (only that the sample-size rationale is recorded before launch is checked); no metric target value or dashboard refresh cadence; no data-retention period, export-aggregation granularity, or consent standard beyond consent gating being applied where required as declared; no staging-validation pass rate or event drop/dupe rate; no number of segments, charts or dashboards; and no deadline by which dead metrics must be retired. Quantities are computed and reported; the only bar on the computed rows is completeness over your own declared rows. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "product-metrics-event-taxonomy-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/product-metrics-event-taxonomy-pack` — tool name `product_metrics_event_taxonomy_pack`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/product-metrics-event-taxonomy-pack` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `product` | product name (string; carried into the output, not checked) |
| `decision.measurement_decision_named` | decision evidence: the decision this data will change is named |
| `decision.tracking_only_for_a_named_decision` | decision evidence: tracking is limited to what a named decision needs |
| `decision.kpi_tree_from_north_star_to_inputs_declared` | decision evidence: the KPI tree from north star to inputs is declared |
| `metrics` (list of metric-row objects) | computed: must be present (an empty list declares no metrics); reported as `metrics_count` |
| `metrics[].name` (string) | names the row in the computed outputs; computed: no name may appear on more than one row |
| `metrics[].definition` (string) | computed: must be present and non-empty per row; rows with the field present but empty are reported in `metrics_without_definition` |
| `metrics[].kpi_tree_role` (string) | computed: must be present per row and be `north_star` or `input` |
| `taxonomy.naming_convention_adopted_for_event_names` | taxonomy evidence: a naming convention for event names is adopted |
| `taxonomy.event_spec_written_before_feature_code` | taxonomy evidence: the event spec is written before feature code |
| `taxonomy.event_spec_reviewed_before_code` | taxonomy evidence: the event spec is reviewed before code |
| `taxonomy.analytics_reviewed_in_pull_request` | taxonomy evidence: analytics is reviewed in the pull request |
| `taxonomy.event_spec_validated_in_staging` | taxonomy evidence: the event spec is validated in staging |
| `events` (list of event-row objects) | computed: must be present (an empty list declares no events); reported as `events_count` |
| `events[].name` (string) | computed: must follow the `object_action` snake_case convention per row; no name may appear on more than one row |
| `events[].feature` (string) | computed: must be present and non-empty per row |
| `events[].spec_version` (string) | computed: must be present and non-empty per row |
| `properties` (list of property-row objects) | computed: must be present (an empty list declares no properties); reported as `properties_count` |
| `properties[].event_name` (string) | computed: must be present and non-empty per row, and must name a declared event (no orphan rows) |
| `properties[].name` (string) | names the row in the computed outputs; computed: the (`event_name`, `name`) pair must not be duplicated |
| `properties[].data_type` (string) | computed: must be present and non-empty per row |
| `properties[].requirement` (string) | computed: must be present per row and be `required` or `optional` |
| `properties[].contains_pii` | computed: must be present per row and `false` to pass |
| `data_quality.capture_time_validation_planned` | data-quality evidence: validation at capture is planned |
| `data_quality.dashboard_dupe_and_drop_audit_planned` | data-quality evidence: dashboards are audited for dupes and drops |
| `data_quality.taxonomy_definitions_documented` | data-quality evidence: the taxonomy's definitions are documented |
| `data_quality.two_definitions_of_one_metric_treated_as_bugs` | data-quality evidence: a metric with two definitions is treated as two bugs |
| `privacy.pseudonymous_ids_only_in_events` | privacy evidence: events carry pseudonymous IDs only |
| `privacy.consent_gating_applied_where_required` | privacy evidence: consent gating is applied where required |
| `privacy.aggregation_before_export_applied_where_possible` | privacy evidence: data is aggregated before export where possible |
| `dashboards.every_chart_carries_question_definition_owner_target` | dashboard evidence: every chart carries a question, definition, owner and target |
| `dashboards.trends_shown_over_snapshots` | dashboard evidence: trends are shown over snapshots |
| `dashboards.dashboard_segmentation_done_thoughtfully` | dashboard evidence: segmentation is done thoughtfully |
| `dashboards.dead_metrics_and_dashboards_retired` | dashboard evidence: dead metrics and dashboards are retired |
| `experiments.hypothesis_and_primary_metric_recorded_before_launch` | experiment evidence: hypothesis and primary metric are recorded before launch |
| `experiments.guardrails_and_sample_size_rationale_recorded_before_launch` | experiment evidence: guardrails and sample-size rationale are recorded before launch |
| `experiments.single_change_per_experiment` | experiment evidence: one change per experiment |
| `experiments.assignment_and_blinding_checks_planned` | experiment evidence: assignment and blinding checks are planned |
| `experiments.experiment_results_written_down_including_no_effect` | experiment evidence: results are written down, including no effect |
| `feedback.qualitative_support_themes_placed_beside_quantitative_results` | feedback evidence: qualitative support themes are placed beside quantitative results |
| `feedback.qualitative_and_quantitative_feedback_both_feed_backlog` | feedback evidence: qualitative and quantitative feedback both feed the backlog |
| `red_lines.pii_in_analytics_events_present` | must be `false` to pass (red line: no PII in analytics events) |
| `red_lines.unregistered_experiments_present` | must be `false` to pass (red line: no unregistered experiments) |
| `red_lines.metrics_without_definitions_present` | must be `false` to pass (red line: no metrics without definitions) |
| `red_lines.dark_pattern_measurement_present` | must be `false` to pass (red line: no dark-pattern measurement) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward PRODUCT_METRICS_EVENT_TAXONOMY_PACK_NOT_READY). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/product-metrics-event-taxonomy-pack`:

```json
{
  "product": "test-product",
  "decision": {
    "measurement_decision_named": true,
    "tracking_only_for_a_named_decision": true,
    "kpi_tree_from_north_star_to_inputs_declared": true
  },
  "metrics": [
    {
      "name": "m1",
      "definition": "definition of m1",
      "kpi_tree_role": "north_star"
    }
  ],
  "taxonomy": {
    "naming_convention_adopted_for_event_names": true,
    "event_spec_written_before_feature_code": true,
    "event_spec_reviewed_before_code": true,
    "analytics_reviewed_in_pull_request": true,
    "event_spec_validated_in_staging": true
  },
  "events": [
    {
      "name": "user_login",
      "feature": "auth",
      "spec_version": "1.0"
    }
  ],
  "properties": [
    {
      "event_name": "user_login",
      "name": "timestamp",
      "data_type": "string",
      "requirement": "required",
      "contains_pii": false
    }
  ],
  "data_quality": {
    "capture_time_validation_planned": true,
    "dashboard_dupe_and_drop_audit_planned": true,
    "taxonomy_definitions_documented": true,
    "two_definitions_of_one_metric_treated_as_bugs": true
  },
  "privacy": {
    "pseudonymous_ids_only_in_events": true,
    "consent_gating_applied_where_required": true,
    "aggregation_before_export_applied_where_possible": true
  },
  "dashboards": {
    "every_chart_carries_question_definition_owner_target": true,
    "trends_shown_over_snapshots": true,
    "dashboard_segmentation_done_thoughtfully": true,
    "dead_metrics_and_dashboards_retired": true
  },
  "experiments": {
    "hypothesis_and_primary_metric_recorded_before_launch": true,
    "guardrails_and_sample_size_rationale_recorded_before_launch": true,
    "single_change_per_experiment": true,
    "assignment_and_blinding_checks_planned": true,
    "experiment_results_written_down_including_no_effect": true
  },
  "feedback": {
    "qualitative_support_themes_placed_beside_quantitative_results": true,
    "qualitative_and_quantitative_feedback_both_feed_backlog": true
  },
  "red_lines": {
    "pii_in_analytics_events_present": false,
    "unregistered_experiments_present": false,
    "metrics_without_definitions_present": false,
    "dark_pattern_measurement_present": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 48 checks and a text stamp of the verdict):

```json
{
  "service": "product-metrics-event-taxonomy-pack",
  "atom_version": "0.1.0",
  "product": "test-product",
  "verdict": "PRODUCT_METRICS_EVENT_TAXONOMY_PACK_READY",
  "sections": {
    "decision_and_kpi_tree": "pass",
    "event_taxonomy_and_spec": "pass",
    "data_quality": "pass",
    "privacy_by_construction": "pass",
    "dashboards_experiments_and_feedback": "pass",
    "red_lines": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "metrics_count": 1,
  "events_count": 1,
  "properties_count": 1,
  "metrics_without_definition": [],
  "duplicate_metric_names": [],
  "duplicate_event_names": [],
  "duplicate_property_keys": [],
  "orphan_property_rows": [],
  "events_without_properties": [],
  "definition_coverage": "1.000000",
  "event_property_coverage": "1.000000",
  "summary": "48 pass, 0 fail, 0 missing of 48 checks across six sections."
}
```

## Verdicts

- **PRODUCT_METRICS_EVENT_TAXONOMY_PACK_READY** — every check passes; the declared taxonomy record is complete and consistent with the skill's checklist and red lines.
- **PRODUCT_METRICS_EVENT_TAXONOMY_PACK_NOT_READY** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `metrics_count`, `events_count` and `properties_count` (the declared list lengths as integers, or null when a list is not declared), the row-name lists `metrics_without_definition` (metrics whose definition field is present but empty; a metric with the field absent is missing evidence and does not appear), `duplicate_metric_names`, `duplicate_event_names` and `duplicate_property_keys` (duplicated names / `event_name.name` pairs, in the order their second occurrence appears), `orphan_property_rows` and `events_without_properties`, the coverage values `definition_coverage` (metrics naming a definition ÷ declared metrics) and `event_property_coverage` (events with at least one declared property ÷ declared events) as strings with exactly six decimal places (a ratio is null when its denominator list is absent or empty and, for `event_property_coverage`, when the properties list is absent), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the eighteen primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
