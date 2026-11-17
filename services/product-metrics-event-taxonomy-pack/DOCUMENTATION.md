# Product metrics event taxonomy pack — documentation

**Product metrics event taxonomy pack** · slug `product-metrics-event-taxonomy-pack` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment 9595ea665b634289aad158b7fff277ac).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/product-metrics-event-taxonomy-pack/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment 9595ea665b634289aad158b7fff277ac). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `product` "test-product"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "product-metrics-event-taxonomy-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the product metrics event taxonomy manifest.** You declare a record of a product's metrics and event taxonomy, made at the design stage before the feature ships — the atom audits the declared record, it does not collect analytics or inspect an event stream (see Explanation). The recorded full-pass manifest declares the product `test-product`: the measurement decision named, tracking only for a named decision, and the KPI tree from north star to inputs declared; one metric, `m1` with definition `definition of m1` and KPI-tree role `north_star`; a naming convention adopted for event names, the event spec written and reviewed before feature code, analytics reviewed in the pull request, and the spec validated in staging; one event, `user_login` (feature `auth`, spec version `1.0`); one property, `timestamp` on `user_login` (type `string`, requirement `required`, `contains_pii` `false`); capture-time validation and a dashboard dupe-and-drop audit planned, taxonomy definitions documented, and two definitions of one metric treated as bugs; pseudonymous IDs only in events, consent gating applied where required, and aggregation before export applied where possible; every chart carrying question, definition, owner and target, trends over snapshots, thoughtful segmentation, and dead metrics and dashboards retired; hypothesis and primary metric, guardrails and sample-size rationale recorded before launch, a single change per experiment, assignment and blinding checks planned, and results written down including no effect; qualitative support themes placed beside quantitative results, with both kinds of feedback feeding the backlog; and all four red-line flags `false` (no PII in analytics events, no unregistered experiments, no metrics without definitions, no dark-pattern measurement).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/product-metrics-event-taxonomy-pack` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `PRODUCT_METRICS_EVENT_TAXONOMY_PACK_READY`: "48 pass, 0 fail, 0 missing of 48 checks across six sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `metrics_count`, `events_count` and `properties_count` are each 1, `definition_coverage` and `event_property_coverage` are each `"1.000000"`, and all six row-name lists are empty (`[]`).

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `PRODUCT_METRICS_EVENT_TAXONOMY_PACK_NOT_READY` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "product-metrics-event-taxonomy-pack"}`.
3. Call: `POST https://atoms.pipavia.com/v1/product-metrics-event-taxonomy-pack` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/product-metrics-event-taxonomy-pack` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `product_metrics_event_taxonomy_pack`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `PRODUCT_METRICS_EVENT_TAXONOMY_PACK_NOT_READY` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 4 checks fail: `every_metric_names_definition`, `every_metric_kpi_tree_role_is_north_star_or_input`, `every_event_name_follows_object_action_snake_case`, `no_property_row_declares_pii`, and the summary reads "44 pass, 4 fail, 0 missing of 48 checks across six sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (in the recorded violations run, `metrics_without_definition` names `m1` — that row declares `definition: ""`, failing `every_metric_names_definition`, and `definition_coverage` is `"0.000000"`; the same row declares `kpi_tree_role: "invalid_role"`, failing `every_metric_kpi_tree_role_is_north_star_or_input`; `events[0].name` is `invalidName`, failing `every_event_name_follows_object_action_snake_case` — with `properties[0].event_name` updated to `invalidName` to match, so no extra orphan or coverage failure is introduced and `event_property_coverage` stays `"1.000000"`; and `properties[0].contains_pii` is declared `true`, failing `no_property_row_declares_pii`; sections `decision_and_kpi_tree`, `event_taxonomy_and_spec` and `privacy_by_construction` report `fail`, the other three `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a number where a string is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "product",
  "detail": "product must be a string"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/product-metrics-event-taxonomy-pack` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/product-metrics-event-taxonomy-pack` — tool name `product_metrics_event_taxonomy_pack`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `product_metrics_event_taxonomy_pack` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `product` and the `metrics[]` / `events[]` / `properties[]` string fields are noted as strings and `metrics`, `events` and `properties` as lists there. Where SERVICE.md states no type — the section container objects (`decision`, `taxonomy`, `data_quality`, `privacy`, `dashboards`, `experiments`, `feedback`, `red_lines`) and a `metrics[]` / `events[]` / `properties[]` row object — the type below is grounded in the recorded evidence inputs (and, for the top-level containers and the three lists, in the MCP `inputSchema` recorded in evidence.json, which types the containers `object` and `metrics` / `events` / `properties` as `array`); that grounding is said so in the Notes column. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `PRODUCT_METRICS_EVENT_TAXONOMY_PACK_NOT_READY`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, exactly as SERVICE.md groups them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `product` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: decision_and_kpi_tree

| Field | Type | Notes |
|---|---|---|
| `decision` | object | The decision section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `decision.measurement_decision_named` | boolean | — |
| `decision.tracking_only_for_a_named_decision` | boolean | — |
| `decision.kpi_tree_from_north_star_to_inputs_declared` | boolean | — |
| `metrics` | list | list of metric-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`) |
| `metrics[]` | object | One declared metric row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `metrics[].name` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `metrics[].definition` | string | The metric's one definition; must be present and non-empty per row (type stated in SERVICE.md) |
| `metrics[].kpi_tree_role` | string | Must be present per row and be `north_star` or `input` (type stated in SERVICE.md) |

#### Read by: event_taxonomy_and_spec

| Field | Type | Notes |
|---|---|---|
| `taxonomy` | object | The taxonomy section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `taxonomy.naming_convention_adopted_for_event_names` | boolean | — |
| `taxonomy.event_spec_written_before_feature_code` | boolean | — |
| `taxonomy.event_spec_reviewed_before_code` | boolean | — |
| `taxonomy.analytics_reviewed_in_pull_request` | boolean | — |
| `taxonomy.event_spec_validated_in_staging` | boolean | — |
| `events` | list | list of event-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`) |
| `events[]` | object | One declared event row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `events[].name` | string | Must follow the `object_action` snake_case convention per row (type stated in SERVICE.md) |
| `events[].feature` | string | The feature the event's spec belongs to; must be present and non-empty per row (type stated in SERVICE.md) |
| `events[].spec_version` | string | The event spec's version; must be present and non-empty per row (type stated in SERVICE.md) |
| `properties` | list | list of property-row objects, each with the entry fields below; computed, see below — read by event_taxonomy_and_spec and, for `properties[].contains_pii`, by privacy_by_construction (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`) |
| `properties[]` | object | One declared property row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `properties[].event_name` | string | The declared event the property belongs to; must be present and non-empty per row, and must name a declared event (type stated in SERVICE.md) |
| `properties[].name` | string | Names the row in the computed outputs; the (`event_name`, `name`) pair must not be duplicated (type stated in SERVICE.md) |
| `properties[].data_type` | string | The property's declared type; must be present and non-empty per row (type stated in SERVICE.md) |
| `properties[].requirement` | string | Must be present per row and be `required` or `optional` (type stated in SERVICE.md) |
| `properties[].contains_pii` | boolean | Must be present per row and `false` to pass; read by privacy_by_construction (type stated in SERVICE.md) |

#### Read by: data_quality

| Field | Type | Notes |
|---|---|---|
| `data_quality` | object | The data-quality section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `data_quality.capture_time_validation_planned` | boolean | — |
| `data_quality.dashboard_dupe_and_drop_audit_planned` | boolean | — |
| `data_quality.taxonomy_definitions_documented` | boolean | — |
| `data_quality.two_definitions_of_one_metric_treated_as_bugs` | boolean | — |

#### Read by: privacy_by_construction

| Field | Type | Notes |
|---|---|---|
| `privacy` | object | The privacy section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `privacy.pseudonymous_ids_only_in_events` | boolean | — |
| `privacy.consent_gating_applied_where_required` | boolean | — |
| `privacy.aggregation_before_export_applied_where_possible` | boolean | — |

The `no_property_row_declares_pii` check in this section also reads `properties[].contains_pii`, documented under event_taxonomy_and_spec above (SERVICE.md groups the `properties` list under both sections).

#### Read by: dashboards_experiments_and_feedback

| Field | Type | Notes |
|---|---|---|
| `dashboards` | object | The dashboards section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `dashboards.every_chart_carries_question_definition_owner_target` | boolean | — |
| `dashboards.trends_shown_over_snapshots` | boolean | — |
| `dashboards.dashboard_segmentation_done_thoughtfully` | boolean | — |
| `dashboards.dead_metrics_and_dashboards_retired` | boolean | — |
| `experiments` | object | The experiments section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `experiments.hypothesis_and_primary_metric_recorded_before_launch` | boolean | — |
| `experiments.guardrails_and_sample_size_rationale_recorded_before_launch` | boolean | — |
| `experiments.single_change_per_experiment` | boolean | — |
| `experiments.assignment_and_blinding_checks_planned` | boolean | — |
| `experiments.experiment_results_written_down_including_no_effect` | boolean | — |
| `feedback` | object | The feedback section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `feedback.qualitative_support_themes_placed_beside_quantitative_results` | boolean | — |
| `feedback.qualitative_and_quantitative_feedback_both_feed_backlog` | boolean | — |

#### Read by: red_lines

| Field | Type | Notes |
|---|---|---|
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.pii_in_analytics_events_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.unregistered_experiments_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.metrics_without_definitions_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.dark_pattern_measurement_present` | boolean | must be `false` to pass — skill red line |

### Checks

All 48 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies).

#### Section: decision_and_kpi_tree

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `measurement_decision_named` | question first: the decision this data will change is named — if no decision changes, the tracking is not built | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tracking_only_for_a_named_decision` | question first: tracking is limited to what a named decision needs, not curiosity | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `kpi_tree_from_north_star_to_inputs_declared` | question first: the metrics tie to a KPI tree — north star to inputs — as declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `taxonomy_metrics_declared` | the declared record names its metrics — the metrics list is present; an empty list declares that the pack declares no metrics | Computed over the declared record. Pass: the `metrics` list is present — an empty list passes, because it declares that the pack declares no metrics. Missing: the list is absent. (SERVICE.md states no fail case for this check: presence passes, absence is missing.) |
| `every_metric_names_definition` | metrics: every declared metric row carries a definition — no metrics without definitions | Computed over the declared record. Pass: every declared metric row declares `definition` as a present, non-empty string — on an empty list the check passes vacuously. Fail: a row declares `definition` present but empty (offending rows are named in `metrics_without_definition`). Missing: the list is absent, or a row has `definition` absent (such a row is missing evidence and does not appear in `metrics_without_definition`). |
| `no_taxonomy_metric_name_duplicated` | metrics: no declared metric name is owned by more than one metric row — one metric, one record | Computed over the declared record. Pass: no declared `name` string appears on more than one metric row. Fail: a `name` string is declared on more than one row (offending names are named in `duplicate_metric_names`, in the order their second occurrence appears). Missing: the list is absent, or a row has `name` absent. |
| `every_metric_names_kpi_tree_role` | metrics: every declared metric row names its role in the KPI tree | Computed over the declared record. Pass: every declared metric row names a non-empty `kpi_tree_role` — on an empty list the check passes vacuously. Fail: a row declares `kpi_tree_role` present but empty. Missing: the list is absent, or a row has `kpi_tree_role` absent (missing evidence for both role checks). |
| `every_metric_kpi_tree_role_is_north_star_or_input` | metrics: every declared KPI-tree role is one of the two roles the skill's KPI tree states — north_star or input | Computed over the declared record. Pass: every declared metric row's `kpi_tree_role` is `north_star` or `input` — on an empty list the check passes vacuously. Fail: a row names any other role. Missing: the list is absent, or a row has `kpi_tree_role` absent. |

#### Section: event_taxonomy_and_spec

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `naming_convention_adopted_for_event_names` | event taxonomy: a naming convention for event names is adopted — object_action, snake_case | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `event_spec_written_before_feature_code` | event taxonomy: the event spec exists before the feature ships — written before feature code | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `event_spec_reviewed_before_code` | event taxonomy: the versioned event spec is reviewed before code | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `analytics_reviewed_in_pull_request` | event taxonomy: analytics is reviewed in the pull request | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `event_spec_validated_in_staging` | quality gate: the event spec is validated in staging | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `events_declared` | the declared record names its events — the events list is present; an empty list declares that the pack declares no events | Computed over the declared record. Pass: the `events` list is present — an empty list passes, because it declares that the pack declares no events. Missing: the list is absent. (SERVICE.md states no fail case for this check: presence passes, absence is missing.) |
| `every_event_name_follows_object_action_snake_case` | events: every declared event name follows the skill's naming convention — object_action in snake_case, object and action joined by an underscore | Computed over the declared record. Pass: every declared event `name` matches `^[a-z][a-z0-9]*(_[a-z0-9]+)+$` — on an empty list the check passes vacuously. Fail: a `name` is in any other shape. Missing: the list is absent, or a row has `name` absent. |
| `no_event_name_duplicated` | events: no declared event name is owned by more than one event row | Computed over the declared record. Pass: no declared `name` string appears on more than one event row. Fail: a `name` string is declared on more than one row (offending names are named in `duplicate_event_names`, in the order their second occurrence appears). Missing: the list is absent, or a row has `name` absent. |
| `every_event_names_its_feature` | events: every declared event row names the feature its spec belongs to — a versioned event spec per feature | Computed over the declared record. Pass: every declared event row declares `feature` as a present, non-empty string — on an empty list the check passes vacuously. Fail: a row declares `feature` present but empty. Missing: the list is absent, or a row has `feature` absent. |
| `every_event_names_spec_version` | events: every declared event row names its spec version — the event spec is versioned | Computed over the declared record. Pass: every declared event row declares `spec_version` as a present, non-empty string — on an empty list the check passes vacuously. Fail: a row declares `spec_version` present but empty. Missing: the list is absent, or a row has `spec_version` absent. |
| `properties_declared` | the declared record names its event properties — the properties list is present; an empty list declares that the pack declares no properties | Computed over the declared record. Pass: the `properties` list is present — an empty list passes, because it declares that the pack declares no properties. Missing: the list is absent. (SERVICE.md states no fail case for this check: presence passes, absence is missing.) |
| `every_property_names_its_event` | properties: every declared property row names the event it belongs to | Computed over the declared record. Pass: every declared property row declares `event_name` as a present, non-empty string — on an empty list the check passes vacuously. Fail: a row declares `event_name` present but empty. Missing: the list is absent, or a row has `event_name` absent. |
| `no_property_duplicated_for_same_event` | properties: no declared property is declared twice for the same event | Computed over the declared record. Pass: no declared (`event_name`, `name`) pair appears on more than one property row — the same property name on different events is not a duplication. Fail: a pair is declared on more than one row (offending pairs are named in `duplicate_property_keys` as `event_name.name`, in the order their second occurrence appears). Missing: the list is absent, or a row has `event_name` or `name` absent. |
| `every_property_declares_a_data_type` | properties: every declared property row declares its type — the event spec states properties and types | Computed over the declared record. Pass: every declared property row declares `data_type` as a present, non-empty string — no type vocabulary is imposed beyond a declared type; on an empty list the check passes vacuously. Fail: a row declares `data_type` present but empty. Missing: the list is absent, or a row has `data_type` absent. |
| `every_property_marks_required_or_optional` | properties: every declared property row is marked one of the two marks the skill states — required or optional | Computed over the declared record. Pass: every declared property row's `requirement` is `required` or `optional` — on an empty list the check passes vacuously. Fail: a row names any other requirement mark. Missing: the list is absent, or a row has `requirement` absent. |
| `no_orphan_property_rows` | properties: no declared property row names an event that is not itself declared — no orphan properties | Computed over the declared record. Pass: every declared property row's `event_name` names an event itself declared in the `events` list. Fail: a property row names an undeclared event (offending property names are named in `orphan_property_rows`). Missing: either list is absent, or any property row lacks `event_name` or any event row lacks `name`. |
| `every_event_has_declared_properties` | properties: every declared event has at least one declared property — the properties are part of each event's spec | Computed over the declared record. Pass: every declared event `name` appears as the `event_name` of at least one declared property row — on two empty lists the check passes vacuously. Fail: a declared event has no declared property row (offending events are named in `events_without_properties`). Missing: either list is absent, or any event row lacks `name` or any property row lacks `event_name`. |

#### Section: data_quality

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `capture_time_validation_planned` | data quality: validation at capture is planned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `dashboard_dupe_and_drop_audit_planned` | data quality: dashboards are audited for dupes and drops | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `taxonomy_definitions_documented` | data quality: the taxonomy's definitions are documented | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `two_definitions_of_one_metric_treated_as_bugs` | data quality: a metric with two definitions is treated as two bugs | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: privacy_by_construction

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `pseudonymous_ids_only_in_events` | privacy: events carry IDs only, pseudonymous — no PII in events | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `consent_gating_applied_where_required` | privacy: consent gating is applied where required | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `aggregation_before_export_applied_where_possible` | privacy: data is aggregated before export where possible | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_property_row_declares_pii` | privacy: no declared property row declares that it contains PII — no PII in analytics events | Computed over the declared record. Pass: every declared property row declares `contains_pii` present and `false` — on an empty list the check passes vacuously. Fail: a row declares `contains_pii` `true`. Missing: the `properties` list is absent, or a row has `contains_pii` absent. |

#### Section: dashboards_experiments_and_feedback

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `every_chart_carries_question_definition_owner_target` | dashboards: each chart carries a question, a definition, an owner and a target — or it is not built | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `trends_shown_over_snapshots` | dashboards: trends are shown over snapshots | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `dashboard_segmentation_done_thoughtfully` | dashboards: segmentation is done thoughtfully | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `dead_metrics_and_dashboards_retired` | dashboards: dead metrics are retired — no vanity walls | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `hypothesis_and_primary_metric_recorded_before_launch` | experiments: the hypothesis and the primary metric are recorded before launch | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `guardrails_and_sample_size_rationale_recorded_before_launch` | experiments: guardrails and the sample-size rationale are recorded before launch | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `single_change_per_experiment` | experiments: one change per test | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `assignment_and_blinding_checks_planned` | experiments: assignment and blinding checks are planned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `experiment_results_written_down_including_no_effect` | experiments: results are written down — including no effect, which is a result, not a failure | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `qualitative_support_themes_placed_beside_quantitative_results` | feedback joins data: qualitative themes from support are placed beside the quantitative results | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `qualitative_and_quantitative_feedback_both_feed_backlog` | feedback joins data: qualitative and quantitative feedback both feed the backlog | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `no_pii_in_analytics_events` | red line: no PII in analytics events is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_unregistered_experiments` | red line: no unregistered experiments are present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_metrics_without_definitions` | red line: no metrics without definitions are present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_dark_pattern_measurement` | red line: no dark-pattern measurement is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"product-metrics-event-taxonomy-pack"`), `atom_version` (`"0.1.0"`), and `product` (the manifest's declared product value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `metrics_count`, `events_count` and `properties_count` (the declared list lengths as integers, or null when a list is not declared); the row-name lists `metrics_without_definition` (metrics whose definition field is present but empty; a metric with the field absent is missing evidence and does not appear), `duplicate_metric_names`, `duplicate_event_names` and `duplicate_property_keys` (duplicated names / `event_name.name` pairs, in the order their second occurrence appears), `orphan_property_rows` (property names whose declared event is not itself declared) and `events_without_properties` (declared events with no declared property row) — all six lists are null when the lists they are computed from are not declared, as recorded in the sparse case; and the ratios `definition_coverage` (metrics naming a definition ÷ declared metrics) and `event_property_coverage` (events with at least one declared property ÷ declared events) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty (and, for `event_property_coverage`, when the properties list is absent). Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "48 pass, 0 fail, 0 missing of 48 checks across six sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared product value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `PRODUCT_METRICS_EVENT_TAXONOMY_PACK_READY` — all 48 checks pass: the declared taxonomy record is complete and consistent with the bound skill's checklist and red lines.
- `PRODUCT_METRICS_EVENT_TAXONOMY_PACK_NOT_READY` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one of the eighteen primary computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence; `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `metrics_count`, `events_count`, `properties_count`, `metrics_without_definition`, `duplicate_metric_names`, `duplicate_event_names`, `duplicate_property_keys`, `orphan_property_rows`, `events_without_properties`, `definition_coverage`, `event_property_coverage` and `computed_status` — each defined in Output format above, with the values and null rules recorded there.

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"product","detail":"product must be a string"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type DELIVERABLE — this atom sells the deliverable it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Measure what matters — event taxonomy, privacy-aware analytics, decided dashboards, honest A/B tests (the bound capability, from the skill). You submit one declared record — the product metrics event taxonomy manifest, made at the design stage before the feature ships — and the atom audits that record for completeness and internal consistency against the bound skill's checklist, quality gates and red lines, returning one deterministic verdict across 6 sections (`decision_and_kpi_tree`, `event_taxonomy_and_spec`, `data_quality`, `privacy_by_construction`, `dashboards_experiments_and_feedback`, `red_lines`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Two kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — the declared `metrics`, `events` and `properties` lists must each be present (an empty list passes: it declares that the pack declares none of that row kind, and the skill requires no particular row), every metric row must carry a non-empty `definition` and a `kpi_tree_role` of `north_star` or `input` with no metric name duplicated, every event `name` must follow the `object_action` snake_case shape with no event name duplicated and every row naming a non-empty `feature` and `spec_version`, and every property row must name a non-empty `event_name`, a non-empty `data_type` and a `requirement` of `required` or `optional`, with no (`event_name`, `name`) pair duplicated, no orphan property rows, every declared event covered by at least one property row, and no property row declaring `contains_pii` `true` — using only the declared record, with no outside threshold imported. Aggregation is strict: any `fail` anywhere produces `PRODUCT_METRICS_EVENT_TAXONOMY_PACK_NOT_READY`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `PRODUCT_METRICS_EVENT_TAXONOMY_PACK_READY`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** The skill states no numeric threshold at all — its demands are qualitative declarations the record makes, the two stated role words (`north_star`, `input`), the two stated requirement marks (`required`, `optional`) and the stated `object_action` snake_case naming shape, not bars the atom can set. Declined, named: a minimum number of metrics, events or properties in the pack; a minimum definition, property or event coverage percentage; a north-star count beyond the declared KPI-tree roles themselves; a property-type vocabulary beyond a type being declared (no list of permitted types is imposed); a sample size, power, significance level or minimum detectable effect for experiments (only that the sample-size rationale is recorded before launch is checked); a metric target value or dashboard refresh cadence; a data-retention period, an export-aggregation granularity, or a consent standard beyond consent gating being applied where required as declared; a staging-validation pass rate or an event drop/dupe rate; a number of segments, charts or dashboards; a deadline by which dead metrics must be retired. Quantities are computed and reported; the only bar on the computed rows is completeness over the caller's own declared rows.

**What it does NOT do.** The atom audits a **declared** product-metrics and event-taxonomy record: a verdict of `PRODUCT_METRICS_EVENT_TAXONOMY_PACK_READY` means the record is complete and consistent *on the caller's declared evidence* — a record that declares a reviewed, staging-validated spec, consent gating, and no PII in its property rows passes those checks even if the real product did none of it. It is a completeness and consistency audit of the taxonomy record the skill requires, **not an analytics implementation, a data-quality audit of a live pipeline, a privacy or consent legal review, or a prediction that the metrics will move**. Specifically: it collects no analytics itself, inspects no event stream, codebase, pull request, staging environment or dashboard, runs no experiment, and does not verify that a declared taxonomy was ever implemented. It never judges whether the named decision is the right decision, whether a metric's definition is correct or useful, whether the north star is well chosen, whether a property's declared type matches the values actually sent, or whether an experiment was well designed — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared metric, event and property rows are internally consistent. Named exclusions: no numeric thresholds at all (see the declined list above); no live verification of any declared fact; no judgment of taxonomy *quality* — whether the KPI tree, event set or dashboard set are the right ones for the real product is the caller's declaration, checked only for declared presence and consistency; the skill's qualitative judgments (segmentation done "thoughtfully", a sample-size rationale being *adequate*, a definition being *the* right one) are checked only as the declarations the skill states; privacy and consent substance (whether pseudonymous IDs are truly non-identifying, whether consent gating is legally sufficient in a jurisdiction) is a caller declaration — only its declared presence and the declared per-row PII flags are checked, and the output is not legal advice.

**Buyer and use context.** Teams and agents working in Money & markets who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Feature success measurement for products (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulators: N/A — this atom audits a declared product-analytics taxonomy record; its verdict is a completeness and consistency judgment on the caller's declared evidence, not compliance evidence, and SERVICE.md states explicitly (U-13 regulatory screen) that its output could not read as regulated professional advice, that it offers no engineering, financial, medical, psychological or legal advice, and that its privacy/consent checks judge declared presence only, never legal sufficiency. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `product_metrics_event_taxonomy_pack` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/product_metrics_event_taxonomy_pack.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_product_metrics_event_taxonomy_pack.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/product-metrics-event-taxonomy-pack` (REST) and `POST /mcp/product-metrics-event-taxonomy-pack` (MCP, tool `product_metrics_event_taxonomy_pack`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment 9595ea665b634289aad158b7fff277ac). Key scope: `product_metrics_event_taxonomy_pack`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale:** SERVICE.md says Tier B · status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment 9595ea665b634289aad158b7fff277ac — the deployment id is stated in TEST-REPORT.md; evidence.json itself records the gateway base, version and health, not the deployment id) shows the atom live. This document follows the evidenced live state: live.
2. **Check names differ from input field names:** the recorded check names are not the input field names for the red-line checks and the computed checks. Recorded check names used verbatim in the Checks section include `no_pii_in_analytics_events` (input `red_lines.pii_in_analytics_events_present`), `no_unregistered_experiments` (input `red_lines.unregistered_experiments_present`), `no_metrics_without_definitions` (input `red_lines.metrics_without_definitions_present`) and `no_dark_pattern_measurement` (input `red_lines.dark_pattern_measurement_present`), plus the computed checks `taxonomy_metrics_declared`, `every_metric_names_definition`, `no_taxonomy_metric_name_duplicated`, `every_metric_names_kpi_tree_role` and `every_metric_kpi_tree_role_is_north_star_or_input`, which read the `metrics` rows rather than any single input field; `events_declared`, `every_event_name_follows_object_action_snake_case`, `no_event_name_duplicated`, `every_event_names_its_feature` and `every_event_names_spec_version`, which read the `events` rows; `properties_declared`, `every_property_names_its_event`, `no_property_duplicated_for_same_event`, `every_property_declares_a_data_type`, `every_property_marks_required_or_optional`, `no_orphan_property_rows` and `every_event_has_declared_properties`, which read the `properties` rows (and, for the last two, the `events` rows as well); and `no_property_row_declares_pii` (input `properties[].contains_pii`), which is recorded in the `privacy_by_construction` section, not `event_taxonomy_and_spec`. The remaining recorded check names match the leaf name of the input field they read (for example `measurement_decision_named` reads `decision.measurement_decision_named`).
3. **Types unstated in SERVICE.md:** SERVICE.md states no type for the section container objects (`decision`, `taxonomy`, `data_quality`, `privacy`, `dashboards`, `experiments`, `feedback`, `red_lines`) or for a `metrics[]` / `events[]` / `properties[]` row object. The types in the Input reference for those fields are grounded in the recorded evidence inputs and, for the top-level containers and the three lists, in the recorded MCP `inputSchema`, and are said so there.
4. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field (TEST-REPORT.md also presents its raw outputs as excerpts). The recorded REST response carries all 48 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
5. **Section grouping vs input objects:** the recorded sections merge separate input objects — `decision` and `metrics` inputs are read by the single recorded section `decision_and_kpi_tree`; `taxonomy`, `events` and `properties` inputs are read by the single recorded section `event_taxonomy_and_spec` (with the one property-row check `no_property_row_declares_pii`, reading `properties[].contains_pii`, recorded instead in `privacy_by_construction`, alongside the `privacy` inputs); and `dashboards`, `experiments` and `feedback` inputs are read by the single recorded section `dashboards_experiments_and_feedback`. This document groups the Input reference and the Checks by the recorded section names. SERVICE.md's own computed-check prose likewise merges checks: its “KPI-tree role per metric” bullet covers two recorded checks (`every_metric_names_kpi_tree_role` and `every_metric_kpi_tree_role_is_north_star_or_input`), its “Feature and spec version per event” bullet covers two (`every_event_names_its_feature` and `every_event_names_spec_version`), and its “Type and requirement per property” bullet covers two (`every_property_declares_a_data_type` and `every_property_marks_required_or_optional`).
6. **Null lists on undeclared lists:** SERVICE.md's output paragraph states the null rules for `computed_status`, the three counts and the coverage ratios, but does not state a null rule for the six row-name lists. The recorded sparse response returns all six lists as `null` when the lists they are computed from are not declared (`metrics_without_definition`, `duplicate_metric_names`, `duplicate_event_names`, `duplicate_property_keys`, `orphan_property_rows`, `events_without_properties`); this document follows the recording.
7. **Case-design prose divergences — corrections.json:** the executed `cases.json` inputs and expects match the recorded executions in evidence.json exactly (verified case by case), but `corrections.json` (and TEST-REPORT.md's Tester errors section) records 8 pre-execution design divergences, corrected at design time before execution and not scored against the atom: (R1 ×4) the violations case's designed `failing_checks` named the prose labels `Definition per metric`, `KPI-tree role per metric`, `Event names follow object_action snake_case` and `No property row declares PII` instead of exact check names in the 48-check register; (R2 ×2) the full-pass and violations `expect` objects carried no structured `computed_spot_checks` — the computed quantities appeared only in prose notes; (R3 ×1) the violations input was originally a sparse partial manifest missing every key path outside `metrics` / `events` / `properties`, which would have read as missing evidence, not failure; (R4 ×1) the malformed input originally carried 2 type violations (`product` must be a string and `metrics` must be a list) instead of exactly one, which would have made the 422 `field` ambiguous. The corrected, executed battery — a violations input rebuilt as a deep copy of the full-pass manifest with exactly the planted mutations, structured spot checks injected, and a malformed input of exactly `{"product": 12345}` — is what the recorded responses show, and this document follows the recordings.

## Worked examples

Provenance: recorded 2026-11-16T09:45:49.033164+00:00 against gateway v1.1.0, external verification lane, source `verification/work/product-metrics-event-taxonomy-pack/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T09:45:49.033164+00:00 · gateway v1.1.0 · source `verification/work/product-metrics-event-taxonomy-pack/evidence.json`.

Input:

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

Response (HTTP 200):

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
  "checks": [
    {
      "section": "decision_and_kpi_tree",
      "check": "measurement_decision_named",
      "status": "pass",
      "evidence": "question first: the decision this data will change is named — if no decision changes, the tracking is not built"
    },
    {
      "section": "decision_and_kpi_tree",
      "check": "tracking_only_for_a_named_decision",
      "status": "pass",
      "evidence": "question first: tracking is limited to what a named decision needs, not curiosity"
    },
    {
      "section": "decision_and_kpi_tree",
      "check": "kpi_tree_from_north_star_to_inputs_declared",
      "status": "pass",
      "evidence": "question first: the metrics tie to a KPI tree — north star to inputs — as declared"
    },
    {
      "section": "decision_and_kpi_tree",
      "check": "taxonomy_metrics_declared",
      "status": "pass",
      "evidence": "the declared record names its metrics — the metrics list is present; an empty list declares that the pack declares no metrics"
    },
    {
      "section": "decision_and_kpi_tree",
      "check": "every_metric_names_definition",
      "status": "pass",
      "evidence": "metrics: every declared metric row carries a definition — no metrics without definitions"
    },
    {
      "section": "decision_and_kpi_tree",
      "check": "no_taxonomy_metric_name_duplicated",
      "status": "pass",
      "evidence": "metrics: no declared metric name is owned by more than one metric row — one metric, one record"
    },
    {
      "section": "decision_and_kpi_tree",
      "check": "every_metric_names_kpi_tree_role",
      "status": "pass",
      "evidence": "metrics: every declared metric row names its role in the KPI tree"
    },
    {
      "section": "decision_and_kpi_tree",
      "check": "every_metric_kpi_tree_role_is_north_star_or_input",
      "status": "pass",
      "evidence": "metrics: every declared KPI-tree role is one of the two roles the skill's KPI tree states — north_star or input"
    },
    {
      "section": "event_taxonomy_and_spec",
      "check": "naming_convention_adopted_for_event_names",
      "status": "pass",
      "evidence": "event taxonomy: a naming convention for event names is adopted — object_action, snake_case"
    },
    {
      "section": "event_taxonomy_and_spec",
      "check": "event_spec_written_before_feature_code",
      "status": "pass",
      "evidence": "event taxonomy: the event spec exists before the feature ships — written before feature code"
    },
    {
      "section": "event_taxonomy_and_spec",
      "check": "event_spec_reviewed_before_code",
      "status": "pass",
      "evidence": "event taxonomy: the versioned event spec is reviewed before code"
    },
    {
      "section": "event_taxonomy_and_spec",
      "check": "analytics_reviewed_in_pull_request",
      "status": "pass",
      "evidence": "event taxonomy: analytics is reviewed in the pull request"
    },
    {
      "section": "event_taxonomy_and_spec",
      "check": "event_spec_validated_in_staging",
      "status": "pass",
      "evidence": "quality gate: the event spec is validated in staging"
    },
    {
      "section": "event_taxonomy_and_spec",
      "check": "events_declared",
      "status": "pass",
      "evidence": "the declared record names its events — the events list is present; an empty list declares that the pack declares no events"
    },
    {
      "section": "event_taxonomy_and_spec",
      "check": "every_event_name_follows_object_action_snake_case",
      "status": "pass",
      "evidence": "events: every declared event name follows the skill's naming convention — object_action in snake_case, object and action joined by an underscore"
    },
    {
      "section": "event_taxonomy_and_spec",
      "check": "no_event_name_duplicated",
      "status": "pass",
      "evidence": "events: no declared event name is owned by more than one event row"
    },
    {
      "section": "event_taxonomy_and_spec",
      "check": "every_event_names_its_feature",
      "status": "pass",
      "evidence": "events: every declared event row names the feature its spec belongs to — a versioned event spec per feature"
    },
    {
      "section": "event_taxonomy_and_spec",
      "check": "every_event_names_spec_version",
      "status": "pass",
      "evidence": "events: every declared event row names its spec version — the event spec is versioned"
    },
    {
      "section": "event_taxonomy_and_spec",
      "check": "properties_declared",
      "status": "pass",
      "evidence": "the declared record names its event properties — the properties list is present; an empty list declares that the pack declares no properties"
    },
    {
      "section": "event_taxonomy_and_spec",
      "check": "every_property_names_its_event",
      "status": "pass",
      "evidence": "properties: every declared property row names the event it belongs to"
    },
    {
      "section": "event_taxonomy_and_spec",
      "check": "no_property_duplicated_for_same_event",
      "status": "pass",
      "evidence": "properties: no declared property is declared twice for the same event"
    },
    {
      "section": "event_taxonomy_and_spec",
      "check": "every_property_declares_a_data_type",
      "status": "pass",
      "evidence": "properties: every declared property row declares its type — the event spec states properties and types"
    },
    {
      "section": "event_taxonomy_and_spec",
      "check": "every_property_marks_required_or_optional",
      "status": "pass",
      "evidence": "properties: every declared property row is marked one of the two marks the skill states — required or optional"
    },
    {
      "section": "event_taxonomy_and_spec",
      "check": "no_orphan_property_rows",
      "status": "pass",
      "evidence": "properties: no declared property row names an event that is not itself declared — no orphan properties"
    },
    {
      "section": "event_taxonomy_and_spec",
      "check": "every_event_has_declared_properties",
      "status": "pass",
      "evidence": "properties: every declared event has at least one declared property — the properties are part of each event's spec"
    },
    {
      "section": "data_quality",
      "check": "capture_time_validation_planned",
      "status": "pass",
      "evidence": "data quality: validation at capture is planned"
    },
    {
      "section": "data_quality",
      "check": "dashboard_dupe_and_drop_audit_planned",
      "status": "pass",
      "evidence": "data quality: dashboards are audited for dupes and drops"
    },
    {
      "section": "data_quality",
      "check": "taxonomy_definitions_documented",
      "status": "pass",
      "evidence": "data quality: the taxonomy's definitions are documented"
    },
    {
      "section": "data_quality",
      "check": "two_definitions_of_one_metric_treated_as_bugs",
      "status": "pass",
      "evidence": "data quality: a metric with two definitions is treated as two bugs"
    },
    {
      "section": "privacy_by_construction",
      "check": "pseudonymous_ids_only_in_events",
      "status": "pass",
      "evidence": "privacy: events carry IDs only, pseudonymous — no PII in events"
    },
    {
      "section": "privacy_by_construction",
      "check": "consent_gating_applied_where_required",
      "status": "pass",
      "evidence": "privacy: consent gating is applied where required"
    },
    {
      "section": "privacy_by_construction",
      "check": "aggregation_before_export_applied_where_possible",
      "status": "pass",
      "evidence": "privacy: data is aggregated before export where possible"
    },
    {
      "section": "privacy_by_construction",
      "check": "no_property_row_declares_pii",
      "status": "pass",
      "evidence": "privacy: no declared property row declares that it contains PII — no PII in analytics events"
    },
    {
      "section": "dashboards_experiments_and_feedback",
      "check": "every_chart_carries_question_definition_owner_target",
      "status": "pass",
      "evidence": "dashboards: each chart carries a question, a definition, an owner and a target — or it is not built"
    },
    {
      "section": "dashboards_experiments_and_feedback",
      "check": "trends_shown_over_snapshots",
      "status": "pass",
      "evidence": "dashboards: trends are shown over snapshots"
    },
    {
      "section": "dashboards_experiments_and_feedback",
      "check": "dashboard_segmentation_done_thoughtfully",
      "status": "pass",
      "evidence": "dashboards: segmentation is done thoughtfully"
    },
    {
      "section": "dashboards_experiments_and_feedback",
      "check": "dead_metrics_and_dashboards_retired",
      "status": "pass",
      "evidence": "dashboards: dead metrics are retired — no vanity walls"
    },
    {
      "section": "dashboards_experiments_and_feedback",
      "check": "hypothesis_and_primary_metric_recorded_before_launch",
      "status": "pass",
      "evidence": "experiments: the hypothesis and the primary metric are recorded before launch"
    },
    {
      "section": "dashboards_experiments_and_feedback",
      "check": "guardrails_and_sample_size_rationale_recorded_before_launch",
      "status": "pass",
      "evidence": "experiments: guardrails and the sample-size rationale are recorded before launch"
    },
    {
      "section": "dashboards_experiments_and_feedback",
      "check": "single_change_per_experiment",
      "status": "pass",
      "evidence": "experiments: one change per test"
    },
    {
      "section": "dashboards_experiments_and_feedback",
      "check": "assignment_and_blinding_checks_planned",
      "status": "pass",
      "evidence": "experiments: assignment and blinding checks are planned"
    },
    {
      "section": "dashboards_experiments_and_feedback",
      "check": "experiment_results_written_down_including_no_effect",
      "status": "pass",
      "evidence": "experiments: results are written down — including no effect, which is a result, not a failure"
    },
    {
      "section": "dashboards_experiments_and_feedback",
      "check": "qualitative_support_themes_placed_beside_quantitative_results",
      "status": "pass",
      "evidence": "feedback joins data: qualitative themes from support are placed beside the quantitative results"
    },
    {
      "section": "dashboards_experiments_and_feedback",
      "check": "qualitative_and_quantitative_feedback_both_feed_backlog",
      "status": "pass",
      "evidence": "feedback joins data: qualitative and quantitative feedback both feed the backlog"
    },
    {
      "section": "red_lines",
      "check": "no_pii_in_analytics_events",
      "status": "pass",
      "evidence": "red line: no PII in analytics events is present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_unregistered_experiments",
      "status": "pass",
      "evidence": "red line: no unregistered experiments are present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_metrics_without_definitions",
      "status": "pass",
      "evidence": "red line: no metrics without definitions are present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_dark_pattern_measurement",
      "status": "pass",
      "evidence": "red line: no dark-pattern measurement is present in the record"
    }
  ],
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
  "summary": "48 pass, 0 fail, 0 missing of 48 checks across six sections.",
  "stamp": "PRODUCT METRICS EVENT TAXONOMY PACK\nproduct: test-product\nVERDICT: PRODUCT_METRICS_EVENT_TAXONOMY_PACK_READY\n  decision_and_kpi_tree                        pass\n  event_taxonomy_and_spec                      pass\n  data_quality                                 pass\n  privacy_by_construction                      pass\n  dashboards_experiments_and_feedback          pass\n  red_lines                                    pass\n48 pass, 0 fail, 0 missing of 48 checks across six sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T09:45:49.033164+00:00 · gateway v1.1.0 · source `verification/work/product-metrics-event-taxonomy-pack/evidence.json`.

Input:

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
      "definition": "",
      "kpi_tree_role": "invalid_role"
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
      "name": "invalidName",
      "feature": "auth",
      "spec_version": "1.0"
    }
  ],
  "properties": [
    {
      "event_name": "invalidName",
      "name": "timestamp",
      "data_type": "string",
      "requirement": "required",
      "contains_pii": true
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

Response (HTTP 200):

```json
{
  "service": "product-metrics-event-taxonomy-pack",
  "atom_version": "0.1.0",
  "product": "test-product",
  "verdict": "PRODUCT_METRICS_EVENT_TAXONOMY_PACK_NOT_READY",
  "sections": {
    "decision_and_kpi_tree": "fail",
    "event_taxonomy_and_spec": "fail",
    "data_quality": "pass",
    "privacy_by_construction": "fail",
    "dashboards_experiments_and_feedback": "pass",
    "red_lines": "pass"
  },
  "checks": [
    {
      "section": "decision_and_kpi_tree",
      "check": "measurement_decision_named",
      "status": "pass",
      "evidence": "question first: the decision this data will change is named — if no decision changes, the tracking is not built"
    },
    {
      "section": "decision_and_kpi_tree",
      "check": "tracking_only_for_a_named_decision",
      "status": "pass",
      "evidence": "question first: tracking is limited to what a named decision needs, not curiosity"
    },
    {
      "section": "decision_and_kpi_tree",
      "check": "kpi_tree_from_north_star_to_inputs_declared",
      "status": "pass",
      "evidence": "question first: the metrics tie to a KPI tree — north star to inputs — as declared"
    },
    {
      "section": "decision_and_kpi_tree",
      "check": "taxonomy_metrics_declared",
      "status": "pass",
      "evidence": "the declared record names its metrics — the metrics list is present; an empty list declares that the pack declares no metrics"
    },
    {
      "section": "decision_and_kpi_tree",
      "check": "every_metric_names_definition",
      "status": "fail",
      "evidence": "metrics: every declared metric row carries a definition — no metrics without definitions"
    },
    {
      "section": "decision_and_kpi_tree",
      "check": "no_taxonomy_metric_name_duplicated",
      "status": "pass",
      "evidence": "metrics: no declared metric name is owned by more than one metric row — one metric, one record"
    },
    {
      "section": "decision_and_kpi_tree",
      "check": "every_metric_names_kpi_tree_role",
      "status": "pass",
      "evidence": "metrics: every declared metric row names its role in the KPI tree"
    },
    {
      "section": "decision_and_kpi_tree",
      "check": "every_metric_kpi_tree_role_is_north_star_or_input",
      "status": "fail",
      "evidence": "metrics: every declared KPI-tree role is one of the two roles the skill's KPI tree states — north_star or input"
    },
    {
      "section": "event_taxonomy_and_spec",
      "check": "naming_convention_adopted_for_event_names",
      "status": "pass",
      "evidence": "event taxonomy: a naming convention for event names is adopted — object_action, snake_case"
    },
    {
      "section": "event_taxonomy_and_spec",
      "check": "event_spec_written_before_feature_code",
      "status": "pass",
      "evidence": "event taxonomy: the event spec exists before the feature ships — written before feature code"
    },
    {
      "section": "event_taxonomy_and_spec",
      "check": "event_spec_reviewed_before_code",
      "status": "pass",
      "evidence": "event taxonomy: the versioned event spec is reviewed before code"
    },
    {
      "section": "event_taxonomy_and_spec",
      "check": "analytics_reviewed_in_pull_request",
      "status": "pass",
      "evidence": "event taxonomy: analytics is reviewed in the pull request"
    },
    {
      "section": "event_taxonomy_and_spec",
      "check": "event_spec_validated_in_staging",
      "status": "pass",
      "evidence": "quality gate: the event spec is validated in staging"
    },
    {
      "section": "event_taxonomy_and_spec",
      "check": "events_declared",
      "status": "pass",
      "evidence": "the declared record names its events — the events list is present; an empty list declares that the pack declares no events"
    },
    {
      "section": "event_taxonomy_and_spec",
      "check": "every_event_name_follows_object_action_snake_case",
      "status": "fail",
      "evidence": "events: every declared event name follows the skill's naming convention — object_action in snake_case, object and action joined by an underscore"
    },
    {
      "section": "event_taxonomy_and_spec",
      "check": "no_event_name_duplicated",
      "status": "pass",
      "evidence": "events: no declared event name is owned by more than one event row"
    },
    {
      "section": "event_taxonomy_and_spec",
      "check": "every_event_names_its_feature",
      "status": "pass",
      "evidence": "events: every declared event row names the feature its spec belongs to — a versioned event spec per feature"
    },
    {
      "section": "event_taxonomy_and_spec",
      "check": "every_event_names_spec_version",
      "status": "pass",
      "evidence": "events: every declared event row names its spec version — the event spec is versioned"
    },
    {
      "section": "event_taxonomy_and_spec",
      "check": "properties_declared",
      "status": "pass",
      "evidence": "the declared record names its event properties — the properties list is present; an empty list declares that the pack declares no properties"
    },
    {
      "section": "event_taxonomy_and_spec",
      "check": "every_property_names_its_event",
      "status": "pass",
      "evidence": "properties: every declared property row names the event it belongs to"
    },
    {
      "section": "event_taxonomy_and_spec",
      "check": "no_property_duplicated_for_same_event",
      "status": "pass",
      "evidence": "properties: no declared property is declared twice for the same event"
    },
    {
      "section": "event_taxonomy_and_spec",
      "check": "every_property_declares_a_data_type",
      "status": "pass",
      "evidence": "properties: every declared property row declares its type — the event spec states properties and types"
    },
    {
      "section": "event_taxonomy_and_spec",
      "check": "every_property_marks_required_or_optional",
      "status": "pass",
      "evidence": "properties: every declared property row is marked one of the two marks the skill states — required or optional"
    },
    {
      "section": "event_taxonomy_and_spec",
      "check": "no_orphan_property_rows",
      "status": "pass",
      "evidence": "properties: no declared property row names an event that is not itself declared — no orphan properties"
    },
    {
      "section": "event_taxonomy_and_spec",
      "check": "every_event_has_declared_properties",
      "status": "pass",
      "evidence": "properties: every declared event has at least one declared property — the properties are part of each event's spec"
    },
    {
      "section": "data_quality",
      "check": "capture_time_validation_planned",
      "status": "pass",
      "evidence": "data quality: validation at capture is planned"
    },
    {
      "section": "data_quality",
      "check": "dashboard_dupe_and_drop_audit_planned",
      "status": "pass",
      "evidence": "data quality: dashboards are audited for dupes and drops"
    },
    {
      "section": "data_quality",
      "check": "taxonomy_definitions_documented",
      "status": "pass",
      "evidence": "data quality: the taxonomy's definitions are documented"
    },
    {
      "section": "data_quality",
      "check": "two_definitions_of_one_metric_treated_as_bugs",
      "status": "pass",
      "evidence": "data quality: a metric with two definitions is treated as two bugs"
    },
    {
      "section": "privacy_by_construction",
      "check": "pseudonymous_ids_only_in_events",
      "status": "pass",
      "evidence": "privacy: events carry IDs only, pseudonymous — no PII in events"
    },
    {
      "section": "privacy_by_construction",
      "check": "consent_gating_applied_where_required",
      "status": "pass",
      "evidence": "privacy: consent gating is applied where required"
    },
    {
      "section": "privacy_by_construction",
      "check": "aggregation_before_export_applied_where_possible",
      "status": "pass",
      "evidence": "privacy: data is aggregated before export where possible"
    },
    {
      "section": "privacy_by_construction",
      "check": "no_property_row_declares_pii",
      "status": "fail",
      "evidence": "privacy: no declared property row declares that it contains PII — no PII in analytics events"
    },
    {
      "section": "dashboards_experiments_and_feedback",
      "check": "every_chart_carries_question_definition_owner_target",
      "status": "pass",
      "evidence": "dashboards: each chart carries a question, a definition, an owner and a target — or it is not built"
    },
    {
      "section": "dashboards_experiments_and_feedback",
      "check": "trends_shown_over_snapshots",
      "status": "pass",
      "evidence": "dashboards: trends are shown over snapshots"
    },
    {
      "section": "dashboards_experiments_and_feedback",
      "check": "dashboard_segmentation_done_thoughtfully",
      "status": "pass",
      "evidence": "dashboards: segmentation is done thoughtfully"
    },
    {
      "section": "dashboards_experiments_and_feedback",
      "check": "dead_metrics_and_dashboards_retired",
      "status": "pass",
      "evidence": "dashboards: dead metrics are retired — no vanity walls"
    },
    {
      "section": "dashboards_experiments_and_feedback",
      "check": "hypothesis_and_primary_metric_recorded_before_launch",
      "status": "pass",
      "evidence": "experiments: the hypothesis and the primary metric are recorded before launch"
    },
    {
      "section": "dashboards_experiments_and_feedback",
      "check": "guardrails_and_sample_size_rationale_recorded_before_launch",
      "status": "pass",
      "evidence": "experiments: guardrails and the sample-size rationale are recorded before launch"
    },
    {
      "section": "dashboards_experiments_and_feedback",
      "check": "single_change_per_experiment",
      "status": "pass",
      "evidence": "experiments: one change per test"
    },
    {
      "section": "dashboards_experiments_and_feedback",
      "check": "assignment_and_blinding_checks_planned",
      "status": "pass",
      "evidence": "experiments: assignment and blinding checks are planned"
    },
    {
      "section": "dashboards_experiments_and_feedback",
      "check": "experiment_results_written_down_including_no_effect",
      "status": "pass",
      "evidence": "experiments: results are written down — including no effect, which is a result, not a failure"
    },
    {
      "section": "dashboards_experiments_and_feedback",
      "check": "qualitative_support_themes_placed_beside_quantitative_results",
      "status": "pass",
      "evidence": "feedback joins data: qualitative themes from support are placed beside the quantitative results"
    },
    {
      "section": "dashboards_experiments_and_feedback",
      "check": "qualitative_and_quantitative_feedback_both_feed_backlog",
      "status": "pass",
      "evidence": "feedback joins data: qualitative and quantitative feedback both feed the backlog"
    },
    {
      "section": "red_lines",
      "check": "no_pii_in_analytics_events",
      "status": "pass",
      "evidence": "red line: no PII in analytics events is present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_unregistered_experiments",
      "status": "pass",
      "evidence": "red line: no unregistered experiments are present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_metrics_without_definitions",
      "status": "pass",
      "evidence": "red line: no metrics without definitions are present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_dark_pattern_measurement",
      "status": "pass",
      "evidence": "red line: no dark-pattern measurement is present in the record"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "metrics_count": 1,
  "events_count": 1,
  "properties_count": 1,
  "metrics_without_definition": [
    "m1"
  ],
  "duplicate_metric_names": [],
  "duplicate_event_names": [],
  "duplicate_property_keys": [],
  "orphan_property_rows": [],
  "events_without_properties": [],
  "definition_coverage": "0.000000",
  "event_property_coverage": "1.000000",
  "summary": "44 pass, 4 fail, 0 missing of 48 checks across six sections.",
  "stamp": "PRODUCT METRICS EVENT TAXONOMY PACK\nproduct: test-product\nVERDICT: PRODUCT_METRICS_EVENT_TAXONOMY_PACK_NOT_READY\n  decision_and_kpi_tree                        fail\n  event_taxonomy_and_spec                      fail\n  data_quality                                 pass\n  privacy_by_construction                      fail\n  dashboards_experiments_and_feedback          pass\n  red_lines                                    pass\n44 pass, 4 fail, 0 missing of 48 checks across six sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T09:45:49.033164+00:00 · gateway v1.1.0 · source `verification/work/product-metrics-event-taxonomy-pack/evidence.json`.

Input:

```json
{
  "product": 12345
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "product",
  "detail": "product must be a string"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — this atom audits a declared product-analytics taxonomy record; its verdict is a completeness and consistency judgment on declared evidence, not compliance evidence, not an analytics implementation, a data-quality audit of a live pipeline, a privacy or consent legal review or a prediction that the metrics will move, its privacy/consent checks judge declared presence only, never legal sufficiency, and it verifies no live fact. |
| Checks named | 48 documented / 48 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (the three counts, the six row-name lists and the two coverage ratios) |
| Input reference typed | Yes — 56 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and the recorded MCP `inputSchema` and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/product-metrics-event-taxonomy-pack/evidence.json` |
