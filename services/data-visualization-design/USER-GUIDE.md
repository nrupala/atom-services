# Data visualization design — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have a visualization design record — the audience and question your charts answer, the chart rows you declared, and your honesty, perception, colour, annotation, accessibility, dashboard and reproducibility declarations. This atom reads one declared manifest and returns one deterministic verdict across seven sections: **DATA_VISUALIZATION_DESIGN_SOUND**, **DATA_VISUALIZATION_DESIGN_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared record's completeness and internal consistency only — it does not render a chart, read your data, or judge whether a chart is clear or beautiful. Computed checks: every chart entry must be complete; each chart's type must be the type the method maps its question type to (comparison → bar, trend → line, distribution → histogram / box_plot, relationship → scatter, composition → stacked_bar, part-to-whole over time → small_multiples) and comparison charts must declare sorted bars; bar and stacked-bar axes must start at zero; no chart may declare a dual axis, 3D, or a red/green-only encoding; a truncated axis must be flagged loudly; and the largest declared category count must be at most 7 — the one numeric limit stated. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "data-visualization-design"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/data-visualization-design` — tool name `data_visualization_design`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/data-visualization-design` — body = the manifest object; same `Authorization` header.

## Input — the data-visualization-design manifest

| Field | Meaning |
|---|---|
| `entity` | entity name (string; carried into the output, not checked) |
| `brief.audience` (string) | declared audience; must be non-empty to pass |
| `brief.question` (string) | declared question the charts answer; must be non-empty to pass |
| `charts` (list of chart entries) | computed: absent / not a list / empty = all ten computed chart checks missing. Each entry needs non-empty `name`, `question_type`, `chart_type`, `x_axis_label`, `y_axis_label` and `y_axis_unit` strings, numeric `y_axis_start` and `categories_count`, and present `bars_sorted`, `dual_axis`, `axis_truncated`, `truncated_flagged_loudly`, `uses_3d` and `red_green_only` booleans; an incomplete entry makes all ten computed checks missing. Reported as `charts_evaluated`, `charts_not_matching_question`, `computed_max_categories` and `max_categories_difference_from_limit` (6 decimal places) |
| `charts[].question_type` / `charts[].chart_type` | computed: `chart_type` must be the type mapped to `question_type` (comparison → `bar`, trend → `line`, distribution → `histogram` / `box_plot`, relationship → `scatter`, composition → `stacked_bar`, part-to-whole over time → `small_multiples`); mismatched rows are named in `charts_not_matching_question` |
| `charts[].bars_sorted` | computed: every comparison row must declare sorted bars (`true`) |
| `charts[].y_axis_start` (number) | computed: every bar / stacked-bar row must start at exactly zero |
| `charts[].dual_axis` | computed: must be `false` on every row |
| `charts[].axis_truncated` / `charts[].truncated_flagged_loudly` | computed: every row with a truncated axis must also declare it flagged loudly |
| `charts[].uses_3d` | computed: must be `false` on every row |
| `charts[].red_green_only` | computed: must be `false` on every row (never red/green alone) |
| `charts[].categories_count` (number) | computed: the largest count across rows must be at most 7 |
| `honesty.consistent_scales_when_comparing_panels` / `data_source_labeled` / `data_date_labeled` | honesty and axis evidence |
| `honesty.misleading_axes_or_scales_present` | must be `false` to pass |
| `perception.primary_encoding_uses_position_or_length` / `most_important_element_top_left_or_largest` / `gridlines_faint` / `chart_junk_minimized` | perception and chart-junk evidence |
| `perception.chart_junk_used_as_branding` | must be `false` to pass |
| `color.palette_colorblind_safe` / `sequential_palette_for_magnitude` / `diverging_palette_around_real_midpoint` | colour evidence |
| `annotation.title_states_finding_not_topic` / `events_and_thresholds_marked` / `outliers_called_out_directly` / `key_values_annotated` | annotation evidence (axis labels and units are covered by the computed chart-entry check) |
| `accessibility.legible_sizes` / `alt_text_or_table_fallback_present` / `values_readable_without_hover` / `contrast_sufficient_for_print_and_screen` | accessibility evidence |
| `dashboard.one_screen_one_story` / `metric_definitions_and_owners_declared` / `refresh_cadence_visible` / `stale_panels_retired` | dashboard evidence |
| `reproducibility.tool_version_and_data_snapshot_recorded` / `data_reproducible` | reproducibility evidence; irreproducible data must never be charted |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward DATA_VISUALIZATION_DESIGN_NOT_SOUND).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/data-visualization-design`:

```json
{
  "entity": "Q3_Sales_Report",
  "brief": {
    "audience": "Executive Board",
    "question": "How did regional sales perform in Q3?"
  },
  "charts": [
    {
      "name": "Regional Sales",
      "question_type": "comparison",
      "chart_type": "bar",
      "x_axis_label": "Region",
      "y_axis_label": "Revenue",
      "y_axis_unit": "USD",
      "y_axis_start": 0.0,
      "categories_count": 5,
      "bars_sorted": true,
      "dual_axis": false,
      "axis_truncated": false,
      "truncated_flagged_loudly": false,
      "uses_3d": false,
      "red_green_only": false
    }
  ],
  "honesty": {
    "consistent_scales_when_comparing_panels": true,
    "data_source_labeled": true,
    "data_date_labeled": true,
    "misleading_axes_or_scales_present": false
  },
  "perception": {
    "primary_encoding_uses_position_or_length": true,
    "most_important_element_top_left_or_largest": true,
    "gridlines_faint": true,
    "chart_junk_minimized": true,
    "chart_junk_used_as_branding": false
  },
  "color": {
    "palette_colorblind_safe": true,
    "sequential_palette_for_magnitude": true,
    "diverging_palette_around_real_midpoint": true
  },
  "annotation": {
    "title_states_finding_not_topic": true,
    "events_and_thresholds_marked": true,
    "outliers_called_out_directly": true,
    "key_values_annotated": true
  },
  "accessibility": {
    "legible_sizes": true,
    "alt_text_or_table_fallback_present": true,
    "values_readable_without_hover": true,
    "contrast_sufficient_for_print_and_screen": true
  },
  "dashboard": {
    "one_screen_one_story": true,
    "metric_definitions_and_owners_declared": true,
    "refresh_cadence_visible": true,
    "stale_panels_retired": true
  },
  "reproducibility": {
    "tool_version_and_data_snapshot_recorded": true,
    "data_reproducible": true
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 38 checks and a text stamp of the verdict):

```json
{
  "service": "data-visualization-design",
  "atom_version": "0.1.0",
  "entity": "Q3_Sales_Report",
  "verdict": "DATA_VISUALIZATION_DESIGN_SOUND",
  "sections": {
    "question_and_chart_choice": "pass",
    "honesty_and_axes": "pass",
    "perception_and_chart_junk": "pass",
    "color": "pass",
    "annotation_and_labels": "pass",
    "accessibility": "pass",
    "dashboards_and_reproducibility": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "charts_evaluated": 1,
  "computed_max_categories": "5.000000",
  "max_categories_difference_from_limit": "-2.000000",
  "charts_not_matching_question": [],
  "summary": "38 pass, 0 fail, 0 missing of 38 checks across seven sections."
}
```

## Verdicts

- **DATA_VISUALIZATION_DESIGN_SOUND** — every check passes; the design record is complete and internally consistent on the declared evidence.
- **DATA_VISUALIZATION_DESIGN_NOT_SOUND** — at least one check fails; the failing checks name the breached rule and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `charts_evaluated` (count of complete chart entries), `computed_max_categories` and `max_categories_difference_from_limit` (largest declared category count, and that count minus the stated limit of 7, as strings with exactly six decimals, or null when they cannot be computed), `charts_not_matching_question` (names of rows whose chart type does not match their declared question, or null when the rows cannot be evaluated) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
