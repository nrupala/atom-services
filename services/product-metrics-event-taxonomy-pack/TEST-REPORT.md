# Test report — product-metrics-event-taxonomy-pack

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-16
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 9595ea665b634289aad158b7fff277ac
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/product-metrics-event-taxonomy-pack/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (product `test-product`): all decision, taxonomy, data-quality, privacy, dashboard, experiment and feedback declarations true, one metric `m1` (definition `definition of m1`, role `north_star`), one event `user_login` (feature `auth`, spec_version `1.0`), one property `user_login.timestamp` (type `string`, requirement `required`, `contains_pii` false), all four red-line flags false | HTTP 200, verdict `PRODUCT_METRICS_EVENT_TAXONOMY_PACK_READY`, `metrics_count` `1`, `events_count` `1`, `properties_count` `1`, `definition_coverage` `"1.000000"`, `event_property_coverage` `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `PRODUCT_METRICS_EVENT_TAXONOMY_PACK_READY`, 48 pass / 0 fail / 0 missing, all six sections `pass`, exactly those computed values (all row-name lists `[]`) | PASS |
| 2 | violations — full manifest identical to full-pass except `metrics[0].definition` `""`, `metrics[0].kpi_tree_role` `invalid_role`, `events[0].name` `invalidName` (with `properties[0].event_name` updated to `invalidName` to match), and `properties[0].contains_pii` true | HTTP 200, verdict `PRODUCT_METRICS_EVENT_TAXONOMY_PACK_NOT_READY`, the 4 named checks fail | HTTP 200, `PRODUCT_METRICS_EVENT_TAXONOMY_PACK_NOT_READY`, 44 pass / 4 fail / 0 missing; failing checks exactly `every_event_name_follows_object_action_snake_case`, `every_metric_kpi_tree_role_is_north_star_or_input`, `every_metric_names_definition`, `no_property_row_declares_pii`; `metrics_count` `1`, `events_count` `1`, `properties_count` `1`, `metrics_without_definition` `["m1"]`, `duplicate_metric_names` `[]`, `duplicate_event_names` `[]`, `duplicate_property_keys` `[]`, `orphan_property_rows` `[]`, `events_without_properties` `[]`, `definition_coverage` `"0.000000"`, `event_property_coverage` `"1.000000"`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `decision_and_kpi_tree`, `event_taxonomy_and_spec` and `privacy_by_construction` `fail`, `data_quality`, `dashboards_experiments_and_feedback` and `red_lines` `pass` | PASS |
| 3 | sparse — only `product` (`minimal-product`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 48 missing, all six sections `insufficient_evidence`, `metrics_count` null, `events_count` null, `properties_count` null, `metrics_without_definition` null, `duplicate_metric_names` null, `duplicate_event_names` null, `duplicate_property_keys` null, `orphan_property_rows` null, `events_without_properties` null, `definition_coverage` null, `event_property_coverage` null, `computed_status` null | PASS |
| 4 | malformed — `product: 12345` (number where a string is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"product","detail":"product must be a string"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `product_metrics_event_taxonomy_pack`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 48 checks and a text stamp):

```json
{"service": "product-metrics-event-taxonomy-pack", "atom_version": "0.1.0", "product": "test-product", "verdict": "PRODUCT_METRICS_EVENT_TAXONOMY_PACK_READY", "sections": {"decision_and_kpi_tree": "pass", "event_taxonomy_and_spec": "pass", "data_quality": "pass", "privacy_by_construction": "pass", "dashboards_experiments_and_feedback": "pass", "red_lines": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "metrics_count": 1, "events_count": 1, "properties_count": 1, "metrics_without_definition": [], "duplicate_metric_names": [], "duplicate_event_names": [], "duplicate_property_keys": [], "orphan_property_rows": [], "events_without_properties": [], "definition_coverage": "1.000000", "event_property_coverage": "1.000000", "summary": "48 pass, 0 fail, 0 missing of 48 checks across six sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"product","detail":"product must be a string"}
```

## Findings

No findings.

## Tester errors

8 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 8 rejections in total — by rule: R1 check-register ×4, R2 structured-spot-checks ×2, R3 violations-full-manifest ×1, R4 malformed-exactly-one ×1. The corrected, executed battery passed the validator (`ok: true`) before execution.

1. (R1) Violations designed `failing_checks` named the prose label `Definition per metric` instead of an exact check name — validator rejection: "failing_checks names 'Definition per metric', which is not in the atom's check register (48 checks)". Corrected before execution as part of rebuilding the violations case (see item 4).
2. (R1) Violations designed `failing_checks` named the prose label `KPI-tree role per metric` instead of an exact check name — validator rejection: "failing_checks names 'KPI-tree role per metric', which is not in the atom's check register (48 checks)". Corrected before execution as part of rebuilding the violations case (see item 4).
3. (R1) Violations designed `failing_checks` named the prose label `Event names follow object_action snake_case` instead of an exact check name — validator rejection: "failing_checks names 'Event names follow object_action snake_case', which is not in the atom's check register (48 checks)". Corrected before execution as part of rebuilding the violations case (see item 4).
4. (R1) Violations designed `failing_checks` named the prose label `No property row declares PII` instead of an exact check name — validator rejection: "failing_checks names 'No property row declares PII', which is not in the atom's check register (48 checks)". Corrected before execution: the violations case was rebuilt as a full copy of the full-pass manifest carrying exactly the planted changes — `metrics[0].definition` = `""`, `metrics[0].kpi_tree_role` = `"invalid_role"`, `events[0].name` = `"invalidName"` with `properties[0].event_name` = `"invalidName"` to match (so no extra orphan/coverage failures are introduced), `properties[0].contains_pii` = true — with `failing_checks` set to exactly the 4 exact check names those changes fail, confirmed by running the Python oracle on both inputs: `every_metric_names_definition`, `every_metric_kpi_tree_role_is_north_star_or_input`, `every_event_name_follows_object_action_snake_case`, `no_property_row_declares_pii`.
5. (R2) Full-pass `expect` carried no structured `computed_spot_checks` (the computed quantities appeared only in prose notes). Corrected before execution: structured spot checks were injected in structured form, computed per SERVICE.md and confirmed against the Python oracle (`computed_status` `within_stated_limits_on_declared_evidence`, `metrics_count` `1`, `events_count` `1`, `properties_count` `1`, `metrics_without_definition` `[]`, `duplicate_metric_names` `[]`, `duplicate_event_names` `[]`, `duplicate_property_keys` `[]`, `orphan_property_rows` `[]`, `events_without_properties` `[]`, `definition_coverage` `"1.000000"`, `event_property_coverage` `"1.000000"`).
6. (R2) Violations `expect` carried no structured `computed_spot_checks`. Corrected before execution: structured spot checks were injected in structured form, computed per SERVICE.md and confirmed against the Python oracle (`computed_status` `outside_stated_limits_on_declared_evidence`, `metrics_count` `1`, `events_count` `1`, `properties_count` `1`, `metrics_without_definition` `["m1"]`, `duplicate_metric_names` `[]`, `duplicate_event_names` `[]`, `duplicate_property_keys` `[]`, `orphan_property_rows` `[]`, `events_without_properties` `[]`, `definition_coverage` `"0.000000"`, `event_property_coverage` `"1.000000"`).
7. (R3) Violations input was a sparse partial manifest missing every key path outside `metrics`/`events`/`properties` — validator rejection: "violations input is missing key paths present in the full-pass manifest (a sparse violations input reads as missing evidence, not as failure): dashboards, dashboards.dashboard_segmentation_done_thoughtfully, dashboards.dead_metrics_and_dashboards_retired, dashboards.every_chart_carries_question_definition_owner_target, dashboards.trends_shown_over_snapshots, data_quality, data_quality.capture_time_validation_planned, data_quality.dashboard_dupe_and_drop_audit_planned, data_quality.taxonomy_definitions_documented, data_quality.two_definitions_of_one_metric_treated_as_bugs, decision, decision.kpi_tree_from_north_star_to_inputs_declared, decision.measurement_decision_named, decision.tracking_only_for_a_named_decision, experiments, experiments.assignment_and_blinding_checks_planned, experiments.experiment_results_written_down_including_no_effect, experiments.guardrails_and_sample_size_rationale_recorded_before_launch, experiments.hypothesis_and_primary_metric_recorded_before_launch, experiments.single_change_per_experiment, feedback, feedback.qualitative_and_quantitative_feedback_both_feed_backlog, feedback.qualitative_support_themes_placed_beside_quantitative_results, privacy, privacy.aggregation_before_export_applied_where_possible, privacy.consent_gating_applied_where_required, privacy.pseudonymous_ids_only_in_events, product, red_lines, red_lines.dark_pattern_measurement_present, red_lines.metrics_without_definitions_present, red_lines.pii_in_analytics_events_present, red_lines.unregistered_experiments_present, taxonomy, taxonomy.analytics_reviewed_in_pull_request, taxonomy.event_spec_reviewed_before_code, taxonomy.event_spec_validated_in_staging, taxonomy.event_spec_written_before_feature_code, taxonomy.naming_convention_adopted_for_event_names". Corrected before execution by the same rebuild: the violations input is a deep copy of the full-pass manifest, so every key path is present and planted mutations change values only.
8. (R4) Malformed input carried 2 type violations — validator rejection: "malformed input carries 2 type violations (product must be a string, metrics must be a list); exactly one is required so the 422 field is unambiguous". Corrected before execution: the extra violation (`metrics` as a string) was removed, keeping exactly one documented type violation (`product` as a number where a string is required), so the malformed input is exactly `{"product": 12345}`.

The full-pass input was verified genuinely valid against the Python oracle before execution (the oracle returns all 48 checks pass on it — no correction needed), and the sparse case was already an identity-only manifest (`{product}` only, as designed).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the eighteen primary computed checks, the declared counts, the row-name lists, the coverage ratios under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/product-metrics-event-taxonomy-pack/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `metrics_count` / `events_count` / `properties_count` | 1 / 1 / 1 | 1 / 1 / 1 | ✓ |
| full-pass `metrics_without_definition` / `duplicate_metric_names` / `duplicate_event_names` / `duplicate_property_keys` / `orphan_property_rows` / `events_without_properties` | [] / [] / [] / [] / [] / [] | [] / [] / [] / [] / [] / [] | ✓ |
| full-pass `definition_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `event_property_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `computed_status` (all eighteen computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `metrics_count` / `events_count` / `properties_count` | 1 / 1 / 1 | 1 / 1 / 1 | ✓ |
| violations `metrics_without_definition` (empty definition) | ["m1"] | ["m1"] | ✓ |
| violations `duplicate_metric_names` / `duplicate_event_names` / `duplicate_property_keys` / `orphan_property_rows` / `events_without_properties` | [] / [] / [] / [] / [] | [] / [] / [] / [] / [] | ✓ |
| violations `definition_coverage` (0 ÷ 1) | "0.000000" | "0.000000" | ✓ |
| violations `event_property_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 4 planted checks | same 4 | ✓ |
| verdicts | PRODUCT_METRICS_EVENT_TAXONOMY_PACK_READY / PRODUCT_METRICS_EVENT_TAXONOMY_PACK_NOT_READY (4 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 4-check failure set on the violations case.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `product`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
