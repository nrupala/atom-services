# Data visualization design — `data-visualization-design`

**Display name:** Data visualization design · **Slug:** `data-visualization-design` · **Deliverable type:** DELIVERABLE · **Atom version:** 0.1.0 · **Status:** live — release candidate (one-week RC soak to 2026-11-22)

**Quick start:** [USER-GUIDE.md](USER-GUIDE.md) · **Verification evidence:** [TEST-REPORT.md](TEST-REPORT.md)

## Tutorial

A first call, walked through end to end. This tutorial narrates the recorded full-pass trial run for this atom; the exact request and response are reproduced verbatim under [Worked examples](#worked-examples), example 1.

1. **Get a key.** Sign up and issue a gateway key scoped to `data-visualization-design` (the full flow is in the first how-to guide below). Every call sends it as `Authorization: Bearer <key>`.
2. **Assemble the manifest.** Build one JSON object declaring the evidence the atom checks. In the recorded run the entity is `Q3_Sales_Report`. Fill every group the Input reference lists — an absent field is not a neutral omission: it is recorded as missing evidence and caps the verdict at `INSUFFICIENT_EVIDENCE`.
3. **Send it.** `POST https://atoms.pipavia.com/v1/data-visualization-design` with the manifest as the body (or call the MCP tool `data_visualization_design` with the same object as its arguments).
4. **Read the verdict first.** The recorded response returns HTTP 200 with verdict `DATA_VISUALIZATION_DESIGN_SOUND` — the strongest verdict this atom gives. Its `summary` reads: "38 pass, 0 fail, 0 missing of 38 checks across seven sections."
5. **Read the sections, then the checks.** All 7 sections report `pass` (`question_and_chart_choice`, `honesty_and_axes`, `perception_and_chart_junk`, `color`, `annotation_and_labels`, `accessibility`, `dashboards_and_reproducibility`), and all 38 entries in `checks` report `status: pass`, each carrying the `evidence` string that states the requirement it checked.
6. **Read the computed fields.** The record declares one complete chart row whose chart type is the type the skill maps its question type to, with 5 categories — inside the skill's stated limit of 7 — so the mapping, axis and category computations all pass. The response's `computed_status` is `within_stated_limits_on_declared_evidence`, and its `stamp` field carries a plain-text rendering of the same verdict for logs and tickets.
7. **Keep the response.** It is the deliverable: one bounded judgment artifact for that one manifest. Same manifest in → same response out (the verification battery confirmed byte-identical repeat REST responses and MCP/REST parity for the full-pass manifest).

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "data-visualization-design"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call:

```bash
curl -X POST https://atoms.pipavia.com/v1/data-visualization-design \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -d @manifest.json
```

A well-formed manifest returns HTTP 200 and a verdict body (see Reference — Output format). Authentication and shape failures return the error shapes listed under Reference — Errors, never a verdict.

### Call via MCP

POST to `https://atoms.pipavia.com/mcp/data-visualization-design` with the same `Authorization: Bearer <key>` header and call the tool named `data_visualization_design`. The `tools/call` arguments are the manifest object itself — the same JSON you would send as the REST body. The MCP result's structured content is the same report core as the REST response (parity was verified in the recorded battery: the full-pass manifest's MCP `structuredContent` was deep-equal to the REST artifact).

### Read a failing verdict and fix the manifest

A failing verdict is still HTTP 200 — it is a result, not a transport error. Work it in this order:

1. **Read `verdict`.** `DATA_VISUALIZATION_DESIGN_NOT_SOUND` means at least one check failed. `INSUFFICIENT_EVIDENCE` means nothing failed but evidence is missing. The passing verdict here is `DATA_VISUALIZATION_DESIGN_SOUND`.
2. **Read `sections`.** A section reports `fail` if any of its checks failed, `insufficient_evidence` if none failed but at least one is missing, and `pass` only when all of its checks pass. Start with the failing sections.
3. **Read `checks`.** Filter to `status: fail` for breaches and `status: missing` for gaps. Each entry names its `section`, its `check`, and an `evidence` string stating the requirement. `fail` means the field was present but false, invalid, or arithmetically inconsistent; `missing` means the field (or a value a computation needs) was absent.
4. **Fix the underlying facts, then resubmit.** In the recorded violations run the failing checks were exactly: `comparison_charts_sorted`, `bar_charts_y_axis_starts_at_zero`, `no_dual_axes_in_declared_charts`, `truncated_axes_flagged_loudly`, `no_3d_in_declared_charts`, `red_green_not_used_alone_in_declared_charts`, `category_counts_within_stated_limit` (31 pass, 7 fail, 0 missing of 38 checks across seven sections.) In the recorded violations run (`Bad_Chart`) the single declared chart row was unsorted for a comparison, started its bar axis away from zero, used a dual axis, truncated an axis without flagging it loudly, used 3D, used red/green alone, and carried 10 categories against the stated limit of 7. Fixing the verdict means fixing the design record's facts on each of those points — sort the comparison, start bar axes at zero, drop the dual axis and the 3D, flag any truncation loudly, stop encoding by red/green alone, and bring the category count to at most 7 — then resubmit.
5. **Do not confuse a verdict with a 422.** A failing verdict means the manifest was well-typed and was judged. A 422 means the manifest was not well-typed and was never judged — see the next guide.

### Handle a 422 invalid_input

A type violation returns HTTP 422 with a body naming the offending field — it never returns a verdict. The recorded malformed run for this atom sent a value of the wrong type and received:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "charts",
  "detail": "charts must be a list"
}
```

To handle it: read `field` (`charts`) and `detail` ("charts must be a list"), correct the value's type in your manifest at exactly that path, and resubmit the whole manifest. Do not drop the field to silence the error — an absent field is missing evidence and caps the verdict at `INSUFFICIENT_EVIDENCE`. One 422 reports one field; if several fields are mistyped, fix and resubmit iteratively.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/data-visualization-design` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/data-visualization-design` — tool name `data_visualization_design`; `tools/call` arguments = the manifest object.
- **Key issuance:** `POST /v1/signup` (email; sign-in link emailed), then `POST /v1/keys` with `{"atom": "data-visualization-design"}` after opening the link. A key for one atom never verifies for another: scope is per atom.

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table (which states: all fields are booleans unless noted) and corroborated by `contract.yaml` and the recorded MCP `inputSchema`. Fields are grouped below exactly as SERVICE.md groups them (by the section that reads them). An absent field = missing evidence; a present-but-false/invalid field = a failed check, except where a note says otherwise.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `entity` | string | (string; carried into the verdict output, not itself checked) |

#### Read by: question_and_chart_choice

| Field | Type | Notes |
|---|---|---|
| `brief.audience` | string | (string; must be non-empty to pass — the declared audience) |
| `brief.question` | string | (string; must be non-empty to pass — the declared question the charts answer) |
| `charts[].name` | string | (string; must be non-empty for the entry to be complete) |
| `charts[].question_type` | string | (string; must be non-empty for the entry to be complete, and one of the stated question types to pass the mapping check — see below) |
| `charts[].chart_type` | string | (string; must be non-empty for the entry to be complete, and the type the skill maps the question type to, to pass the mapping check — see below) |
| `charts[].bars_sorted` | boolean | (boolean; must be present for the entry to be complete; computed, see below) |

#### Read by: question_and_chart_choice, honesty_and_axes, perception_and_chart_junk, color, annotation_and_labels

| Field | Type | Notes |
|---|---|---|
| `charts` | array | (list of chart entries; absent / not a list / empty = all ten computed chart checks missing) |

#### Read by: annotation_and_labels

| Field | Type | Notes |
|---|---|---|
| `charts[].x_axis_label` | string | (string; must be non-empty for the entry to be complete) |
| `charts[].y_axis_label` | string | (string; must be non-empty for the entry to be complete) |
| `charts[].y_axis_unit` | string | (string; must be non-empty for the entry to be complete) |
| `annotation.title_states_finding_not_topic` | boolean | — |
| `annotation.events_and_thresholds_marked` | boolean | — |
| `annotation.outliers_called_out_directly` | boolean | — |
| `annotation.key_values_annotated` | boolean | — |

#### Read by: honesty_and_axes

| Field | Type | Notes |
|---|---|---|
| `charts[].y_axis_start` | number | (number; computed, see below) |
| `charts[].dual_axis` | boolean | (boolean; must be present for the entry to be complete; computed, see below) |
| `charts[].axis_truncated` | boolean | (boolean; must be present for the entry to be complete; computed, see below) |
| `charts[].truncated_flagged_loudly` | boolean | (boolean; must be present for the entry to be complete; computed, see below) |
| `honesty.consistent_scales_when_comparing_panels` | boolean | — |
| `honesty.data_source_labeled` | boolean | — |
| `honesty.data_date_labeled` | boolean | — |
| `honesty.misleading_axes_or_scales_present` | boolean | (must be `false` to pass — skill red line) |

#### Read by: color

| Field | Type | Notes |
|---|---|---|
| `charts[].categories_count` | number | (number; computed, see below) |
| `charts[].red_green_only` | boolean | (boolean; must be present for the entry to be complete; computed, see below) |
| `color.palette_colorblind_safe` | boolean | — |
| `color.sequential_palette_for_magnitude` | boolean | — |
| `color.diverging_palette_around_real_midpoint` | boolean | — |

#### Read by: perception_and_chart_junk

| Field | Type | Notes |
|---|---|---|
| `charts[].uses_3d` | boolean | (boolean; must be present for the entry to be complete; computed, see below) |
| `perception.primary_encoding_uses_position_or_length` | boolean | — |
| `perception.most_important_element_top_left_or_largest` | boolean | — |
| `perception.gridlines_faint` | boolean | — |
| `perception.chart_junk_minimized` | boolean | — |
| `perception.chart_junk_used_as_branding` | boolean | (must be `false` to pass — skill red line) |

#### Read by: accessibility

| Field | Type | Notes |
|---|---|---|
| `accessibility.legible_sizes` | boolean | — |
| `accessibility.alt_text_or_table_fallback_present` | boolean | — |
| `accessibility.values_readable_without_hover` | boolean | — |
| `accessibility.contrast_sufficient_for_print_and_screen` | boolean | — |

#### Read by: dashboards_and_reproducibility

| Field | Type | Notes |
|---|---|---|
| `dashboard.one_screen_one_story` | boolean | — |
| `dashboard.metric_definitions_and_owners_declared` | boolean | — |
| `dashboard.refresh_cadence_visible` | boolean | — |
| `dashboard.stale_panels_retired` | boolean | — |
| `reproducibility.tool_version_and_data_snapshot_recorded` | boolean | — |
| `reproducibility.data_reproducible` | boolean | — |

Total typed input fields documented: 44 (each SERVICE.md field-table row; nested row-entry fields are listed individually where SERVICE.md lists them).

### Checks

All 38 checks, named exactly as in the recorded full-pass REST response's `checks` array (cross-checked against SERVICE.md; the counts agree). For each check, the Requirement column is the recorded `evidence` string, which states what must hold to pass.

**Per-check status semantics (all checks):** `pass` = the requirement held on the declared evidence; `fail` = the field was present but false/invalid, or a computed comparison did not hold; `missing` = the field, list, or a value a computation needs was absent, so the check could not be evaluated. There is no separate not-applicable status in the recorded responses: where a check is conditional and its gate is not declared, it is recorded as `pass` with evidence stating that no such case was declared (see the notes on the individual conditional checks, where this atom has them).

#### Section: question_and_chart_choice

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `audience_declared` | the design record declares its audience as a non-empty string | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `question_declared` | the design record declares the question it answers as a non-empty string | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `chart_entries_complete` | every chart entry carries a name, question type, chart type, axis labels and unit, axis start, category count, and sorting / dual-axis / truncation / 3D / red-green declarations | Computed. Pass requires every declared chart entry to be complete (non-empty name/question/chart/label/unit strings, numeric axis start and category count, and all six row booleans present). A missing or empty `charts` list is `missing` for all ten computed chart checks; an incomplete entry makes all ten `missing`. |
| `chart_types_match_declared_questions` | method step 1: every declared chart type is the chart the skill maps its declared question type to — comparison to bar, trend to line, distribution to histogram/box_plot, relationship to scatter, composition to stacked_bar, part-to-whole over time to small_multiples | Computed. Pass requires every complete entry's `chart_type` to be the type the skill maps its `question_type` to (comparison to `bar`, trend to `line`, distribution to `histogram`/`box_plot`, relationship to `scatter`, composition to `stacked_bar`, part-to-whole over time to `small_multiples`). Membership is a verdict check, not a type error. |
| `comparison_charts_sorted` | method step 1: every declared comparison chart declares sorted bars (no comparison chart is declared, so this passes vacuously) | Computed. Pass requires every declared comparison chart to declare sorted bars. With no comparison chart declared it passes vacuously. |
#### Section: honesty_and_axes

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `bar_charts_y_axis_starts_at_zero` | method step 2 / quality gate: every declared bar or stacked-bar chart's declared y-axis start is zero (no bar chart is declared, so this passes vacuously) | Computed. Pass requires every declared bar/stacked-bar chart's `y_axis_start` to be zero. With no bar chart declared it passes vacuously. Non-bar rows are governed by the truncation-flagging check instead. |
| `no_dual_axes_in_declared_charts` | method step 2: no declared chart row declares a dual axis implying causation | Computed. Pass requires every complete row to declare `dual_axis` false. |
| `truncated_axes_flagged_loudly` | method step 2: every declared chart row that declares a truncated axis also declares it flagged loudly | Computed. Pass requires every complete row declaring `axis_truncated` true also to declare `truncated_flagged_loudly` true. |
| `consistent_scales_when_comparing_panels` | method step 2: consistent scales are declared when comparing panels | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `data_source_labeled` | method step 2: the data source is labeled on the chart | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `data_date_labeled` | method step 2: the data date is labeled on the chart | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `misleading_axes_or_scales_not_present` | red line: no misleading axes or scales are present | Pass requires `honesty.misleading_axes_or_scales_present` to be declared `false` (skill red line). Declared `true` fails; absent is `missing`. |
#### Section: perception_and_chart_junk

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `primary_encoding_uses_position_or_length` | method step 3: the primary encoding uses position or length, which beat angle, area and colour | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `most_important_element_top_left_or_largest` | method step 3: the most important thing is top-left or largest | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `gridlines_faint` | method step 3: gridlines are faint (chart-junk minimized) | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `no_3d_in_declared_charts` | method step 3: no declared chart row declares 3D | Computed. Pass requires every complete row to declare `uses_3d` false. |
| `chart_junk_minimized` | method step 3: chart-junk is minimized | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `chart_junk_not_used_as_branding` | red line: chart-junk is not used as branding | Pass requires `perception.chart_junk_used_as_branding` to be declared `false` (skill red line). Declared `true` fails; absent is `missing`. |
#### Section: color

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `palette_colorblind_safe` | method step 4 / quality gate: the palette is declared colorblind-safe | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `sequential_palette_for_magnitude` | method step 4: a sequential palette is used for magnitude | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `diverging_palette_around_real_midpoint` | method step 4: any diverging palette is around a real midpoint | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `red_green_not_used_alone_in_declared_charts` | method step 4 / quality gate: no declared chart row declares a red/green-only encoding | Computed. Pass requires every complete row to declare `red_green_only` false. |
| `category_counts_within_stated_limit` | method step 4: the largest declared category count across chart rows is at most the 7 categories the skill states | Computed. Pass requires the largest declared `categories_count` across complete rows to be at most 7 — the one numeric limit the skill states. |
#### Section: annotation_and_labels

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `title_states_finding_not_topic` | method step 5 / quality gate: the title states the finding, not the topic | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `events_and_thresholds_marked` | method step 5: events and thresholds are marked | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `outliers_called_out_directly` | method step 5: outliers are called out directly | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `key_values_annotated` | quality gate: key values are annotated | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `axis_labels_and_units_complete` | every complete chart entry carries a non-empty x-axis label, y-axis label, and y-axis unit | Computed. Pass requires every complete entry to carry a non-empty x-axis label, y-axis label and y-axis unit; it passes exactly when the entries are complete and is `missing` when they cannot be evaluated. |
#### Section: accessibility

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `legible_sizes` | method step 6: text sizes are legible | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `alt_text_or_table_fallback_present` | method step 6 / quality gate: an alt text or table fallback (accessible alternative) exists | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `values_readable_without_hover` | method step 6: values are readable without hover | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `contrast_sufficient_for_print_and_screen` | method step 6: contrast is sufficient for print and screen | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
#### Section: dashboards_and_reproducibility

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `dashboard_one_screen_one_story` | method step 7: a dashboard screen tells one story | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `metric_definitions_and_owners_declared` | method step 7: metric definitions and owners are declared | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `refresh_cadence_visible` | method step 7: the refresh cadence is visible | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `stale_panels_retired` | method step 7: stale panels are retired | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `tool_version_and_data_snapshot_recorded` | method step 8 / quality gate: the tool version and a data snapshot are recorded with the chart | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `chart_data_reproducible` | red line: the charted data is reproducible — data that cannot be reproduced is never charted | Pass requires `reproducibility.data_reproducible` to be declared `true` (skill red line: data that cannot be reproduced is never charted). Declared `false` fails; absent is `missing`. |

### Output format

HTTP 200 returns one JSON object. Fields observed in the recorded full-pass response, in recorded order:

| Field | Type (as recorded) | Meaning |
|---|---|---|
| `service` | string | Atom slug. |
| `atom_version` | string | Atom version that produced the verdict. |
| `entity` | string | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `verdict` | string | The verdict (see Verdict vocabulary). |
| `sections` | object | Per-section statuses keyed by section name. |
| `checks` | array | Array of `{section, check, status, evidence}` objects — one per check. |
| `computed_status` | string | `within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when a computed check cannot be completed. |
| `charts_evaluated` | number | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `computed_max_categories` | string | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `max_categories_difference_from_limit` | string | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `charts_not_matching_question` | array | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `summary` | string | One-line pass/fail/missing count summary. |
| `stamp` | string | Plain-text rendering of the verdict, sections and summary. |

Computed numeric fields follow the fixed serialization rule stated in SERVICE.md (fixed-decimal strings where SERVICE.md specifies them), shared by both implementations so repeat calls are byte-identical.

### Verdict vocabulary

- **`DATA_VISUALIZATION_DESIGN_SOUND`** — Every check passes (38 pass, 0 fail, 0 missing of 38 checks across seven sections.) The declared evidence is complete and consistent with the bound skill's method, quality gates and red lines.
- **`DATA_VISUALIZATION_DESIGN_NOT_SOUND`** — At least one check fails. The failing checks name the breached requirement and the evidence against it.
- **`INSUFFICIENT_EVIDENCE`** — Nothing failed, but at least one check is `missing`. The missing checks say exactly what to supply.

- **Section statuses:** `pass` (all checks in the section pass) · `fail` (at least one check in the section fails) · `insufficient_evidence` (no check fails but at least one is missing).
- **Per-check statuses:** `pass` · `fail` · `missing` (see Checks). No other per-check status occurs in the recorded responses; conditional checks that do not apply are recorded as `pass`, as documented above.
- **`computed_status` values:** `within_stated_limits_on_declared_evidence` (every computed check that could be completed held) · `outside_stated_limits_on_declared_evidence` (at least one computed check failed) · `null` (at least one computed check could not be completed).

### Errors

Only the shapes evidenced in the repo/gateway docs are listed; no other error payload is documented, and none should be assumed.

- **401 — unauthenticated:** missing or invalid key (USER-GUIDE.md error line). No error body shape is evidenced in the repo for 401; do not assume one. Fix: send a valid key as `Authorization: Bearer <key>`.
- **403 — scope:** the key lacks this atom's scope (USER-GUIDE.md error line). No error body shape is evidenced in the repo for 403; do not assume one. Fix: issue this atom's scope on your key via `POST /v1/keys`.
- **422 — `invalid_input`:** a field has the wrong type. Recorded body shape (verbatim from the recorded malformed run):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "charts",
  "detail": "charts must be a list"
}
```

  Here `field` is `charts` and `detail` is "charts must be a list". A 422 never carries a verdict.
- **429 — rate limit:** the per-key rate limit was exceeded (60/min, 10,000/day per key; USER-GUIDE.md and `contract.yaml`). No error body shape is evidenced in the repo for 429; do not assume one. Fix: slow down and retry within the limits.

### Rate limits + pricing status

- **Rate limits (from `contract.yaml`):** 60 requests per key per minute; 10,000 requests per key per day. Status note in the contract: SPEC default — the per-key rate limit is the capacity guard for open public usage; tuned per atom at build-out from measured production cost.
- **Pricing:** unit = deliverable; `pricing.rate` is null (rate_status: pending). **Free during trial — rate pending.** No price is set; per SERVICE.md, prices are set only from measured production cost per unit.

## Explanation

This atom is a deterministic completeness-and-consistency audit of a **declared** data-visualization design record — it renders no chart, reads no dataset, inspects no image, and exercises no aesthetic judgment. Its 38 checks across seven sections cover question and chart choice, honesty and axes, perception and chart junk, color, annotation and labels, accessibility, and dashboards and reproducibility. Ten checks are computed from the declared chart rows: entry completeness; chart type matching the skill's stated question-to-chart mapping; comparison charts sorted; bar/stacked-bar axes starting at exactly zero; no dual axes; truncated axes flagged loudly; no 3D; no red/green alone; the largest category count against the one numeric limit the skill states (at most 7 categories); and axis labels/units completeness. Where a computed rule has no row to bite on — for example the bar-zero rule when no bar chart is declared — the check passes vacuously, and the recorded evidence string says so.

The verdict is decided mechanically. Each check ends `pass`, `fail`, or `missing`. Any `fail` makes the verdict `DATA_VISUALIZATION_DESIGN_NOT_SOUND`. Otherwise any `missing` makes it `INSUFFICIENT_EVIDENCE`. Only when all 38 checks pass is the verdict `DATA_VISUALIZATION_DESIGN_SOUND`. Computed amounts are serialized as strings with exactly six decimal places by a fixed round-half-up rule shared by both implementations; the bar-zero comparison compares the fixed-6dp difference to zero, with no 'close enough' epsilon invented.

A sound verdict means the declared record is complete and internally consistent — it does **not** mean the real charts are clear, honest in rendering, or persuasive. The atom verifies no declared chart, axis, palette or annotation against a real artifact. Whether a palette is in fact colorblind-safe when rendered, whether a title in fact states a finding, whether an encoding in fact reads as position/length-dominant, and whether a dashboard in fact tells one story are carried only as caller declarations, never decided here. Thresholds the skill does not state are declined, not invented: no minimum chart count, no font-size/contrast-ratio/gridline-opacity number (in particular no WCAG ratio is imposed), no refresh interval, no label length, and no dashboard panel count.

**Buyer / use context.** Buyers are teams and agents producing report charts and dashboards who want every design record held to the same honesty-and-accessibility declaration bar, per use. The house's own report chart production is an internal caller. What is sold is the deliverable — the design verdict with per-check evidence and computed chart figures — never the underlying visualization knowledge itself.

## Role views

### For integrators (Users)

Integrate against the two endpoints above with one scoped key per atom. Treat HTTP 200 as a judged result (read `verdict`, then `sections`, then `checks`), HTTP 422 as a client-side type bug (read `field`/`detail`, fix, resubmit), and 401/403/429 as auth/scope/rate problems respectively. Cache nothing about a verdict across manifests: the verdict is a pure function of the manifest you sent, so re-send after any manifest change. The worked examples below are real recorded request/response pairs — use example 1 as your golden-path fixture and example 3 as your 422-handling fixture.

### For developers

Manifest authoring: declare facts, do not target the verdict — computed checks re-derive totals, coverage and vocabulary membership from the declared values themselves, so inconsistent declarations fail on their own arithmetic. Determinism: the core is deterministic (Python oracle and TypeScript port, parity-proven locally per SERVICE.md); the same manifest returns a byte-identical REST response, and MCP structured content equals the REST report core. Implementation pointers: `src/` holds the atom's core, `tests/` its test suite, `SERVICE.md` is the normative field/check specification, and `contract.yaml` the machine-readable contract (key namespace/prefix, rate limits, pricing status). Fixes land in the bound skill first and the atom re-deploys from the refined skill (contract binding rule R1).

### For ops

Endpoints: REST `POST /v1/data-visualization-design` and MCP `POST /mcp/data-visualization-design` on `https://atoms.pipavia.com` (gateway v1.1.0 in the recorded battery). Key scope is per atom — a 403 spike means clients are calling with keys that lack this atom's scope, not an outage. Rate limits: 60/min and 10,000/day per key; watch 429s per key before raising limits. Error monitoring: alert on 5xx (none are part of this atom's documented behavior) and on 422 rate by `field` (a rising 422 rate on one field usually means a client manifest generator changed shape). Status: live — release candidate, one-week RC soak to 2026-11-22; pricing is still pending (free during trial), so metering is for the cost ledger, not billing.

## Worked examples

Provenance: recorded 2026-11-16T02:44:03.758233+00:00 against gateway v1.1.0, external verification lane, source `verification/work/data-visualization-design/evidence.json`. Inputs and REST responses below are reproduced verbatim (pretty-printed with indent 2 only) and were verified mechanically against that evidence file after writing: each fenced block parses to a JSON value identical to the recorded value.

### Example 1 — Full-pass

Recorded expectation: HTTP 200, verdict `DATA_VISUALIZATION_DESIGN_SOUND`.

Input (recorded `input`):

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

REST response (recorded `response_text`):

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
  "checks": [
    {
      "section": "question_and_chart_choice",
      "check": "audience_declared",
      "status": "pass",
      "evidence": "the design record declares its audience as a non-empty string"
    },
    {
      "section": "question_and_chart_choice",
      "check": "question_declared",
      "status": "pass",
      "evidence": "the design record declares the question it answers as a non-empty string"
    },
    {
      "section": "question_and_chart_choice",
      "check": "chart_entries_complete",
      "status": "pass",
      "evidence": "every chart entry carries a name, question type, chart type, axis labels and unit, axis start, category count, and sorting / dual-axis / truncation / 3D / red-green declarations"
    },
    {
      "section": "question_and_chart_choice",
      "check": "chart_types_match_declared_questions",
      "status": "pass",
      "evidence": "method step 1: every declared chart type is the chart the skill maps its declared question type to — comparison to bar, trend to line, distribution to histogram/box_plot, relationship to scatter, composition to stacked_bar, part-to-whole over time to small_multiples"
    },
    {
      "section": "question_and_chart_choice",
      "check": "comparison_charts_sorted",
      "status": "pass",
      "evidence": "method step 1: every declared comparison chart declares sorted bars (no comparison chart is declared, so this passes vacuously)"
    },
    {
      "section": "honesty_and_axes",
      "check": "bar_charts_y_axis_starts_at_zero",
      "status": "pass",
      "evidence": "method step 2 / quality gate: every declared bar or stacked-bar chart's declared y-axis start is zero (no bar chart is declared, so this passes vacuously)"
    },
    {
      "section": "honesty_and_axes",
      "check": "no_dual_axes_in_declared_charts",
      "status": "pass",
      "evidence": "method step 2: no declared chart row declares a dual axis implying causation"
    },
    {
      "section": "honesty_and_axes",
      "check": "truncated_axes_flagged_loudly",
      "status": "pass",
      "evidence": "method step 2: every declared chart row that declares a truncated axis also declares it flagged loudly"
    },
    {
      "section": "honesty_and_axes",
      "check": "consistent_scales_when_comparing_panels",
      "status": "pass",
      "evidence": "method step 2: consistent scales are declared when comparing panels"
    },
    {
      "section": "honesty_and_axes",
      "check": "data_source_labeled",
      "status": "pass",
      "evidence": "method step 2: the data source is labeled on the chart"
    },
    {
      "section": "honesty_and_axes",
      "check": "data_date_labeled",
      "status": "pass",
      "evidence": "method step 2: the data date is labeled on the chart"
    },
    {
      "section": "honesty_and_axes",
      "check": "misleading_axes_or_scales_not_present",
      "status": "pass",
      "evidence": "red line: no misleading axes or scales are present"
    },
    {
      "section": "perception_and_chart_junk",
      "check": "primary_encoding_uses_position_or_length",
      "status": "pass",
      "evidence": "method step 3: the primary encoding uses position or length, which beat angle, area and colour"
    },
    {
      "section": "perception_and_chart_junk",
      "check": "most_important_element_top_left_or_largest",
      "status": "pass",
      "evidence": "method step 3: the most important thing is top-left or largest"
    },
    {
      "section": "perception_and_chart_junk",
      "check": "gridlines_faint",
      "status": "pass",
      "evidence": "method step 3: gridlines are faint (chart-junk minimized)"
    },
    {
      "section": "perception_and_chart_junk",
      "check": "no_3d_in_declared_charts",
      "status": "pass",
      "evidence": "method step 3: no declared chart row declares 3D"
    },
    {
      "section": "perception_and_chart_junk",
      "check": "chart_junk_minimized",
      "status": "pass",
      "evidence": "method step 3: chart-junk is minimized"
    },
    {
      "section": "perception_and_chart_junk",
      "check": "chart_junk_not_used_as_branding",
      "status": "pass",
      "evidence": "red line: chart-junk is not used as branding"
    },
    {
      "section": "color",
      "check": "palette_colorblind_safe",
      "status": "pass",
      "evidence": "method step 4 / quality gate: the palette is declared colorblind-safe"
    },
    {
      "section": "color",
      "check": "sequential_palette_for_magnitude",
      "status": "pass",
      "evidence": "method step 4: a sequential palette is used for magnitude"
    },
    {
      "section": "color",
      "check": "diverging_palette_around_real_midpoint",
      "status": "pass",
      "evidence": "method step 4: any diverging palette is around a real midpoint"
    },
    {
      "section": "color",
      "check": "red_green_not_used_alone_in_declared_charts",
      "status": "pass",
      "evidence": "method step 4 / quality gate: no declared chart row declares a red/green-only encoding"
    },
    {
      "section": "color",
      "check": "category_counts_within_stated_limit",
      "status": "pass",
      "evidence": "method step 4: the largest declared category count across chart rows is at most the 7 categories the skill states"
    },
    {
      "section": "annotation_and_labels",
      "check": "title_states_finding_not_topic",
      "status": "pass",
      "evidence": "method step 5 / quality gate: the title states the finding, not the topic"
    },
    {
      "section": "annotation_and_labels",
      "check": "events_and_thresholds_marked",
      "status": "pass",
      "evidence": "method step 5: events and thresholds are marked"
    },
    {
      "section": "annotation_and_labels",
      "check": "outliers_called_out_directly",
      "status": "pass",
      "evidence": "method step 5: outliers are called out directly"
    },
    {
      "section": "annotation_and_labels",
      "check": "key_values_annotated",
      "status": "pass",
      "evidence": "quality gate: key values are annotated"
    },
    {
      "section": "annotation_and_labels",
      "check": "axis_labels_and_units_complete",
      "status": "pass",
      "evidence": "every complete chart entry carries a non-empty x-axis label, y-axis label, and y-axis unit"
    },
    {
      "section": "accessibility",
      "check": "legible_sizes",
      "status": "pass",
      "evidence": "method step 6: text sizes are legible"
    },
    {
      "section": "accessibility",
      "check": "alt_text_or_table_fallback_present",
      "status": "pass",
      "evidence": "method step 6 / quality gate: an alt text or table fallback (accessible alternative) exists"
    },
    {
      "section": "accessibility",
      "check": "values_readable_without_hover",
      "status": "pass",
      "evidence": "method step 6: values are readable without hover"
    },
    {
      "section": "accessibility",
      "check": "contrast_sufficient_for_print_and_screen",
      "status": "pass",
      "evidence": "method step 6: contrast is sufficient for print and screen"
    },
    {
      "section": "dashboards_and_reproducibility",
      "check": "dashboard_one_screen_one_story",
      "status": "pass",
      "evidence": "method step 7: a dashboard screen tells one story"
    },
    {
      "section": "dashboards_and_reproducibility",
      "check": "metric_definitions_and_owners_declared",
      "status": "pass",
      "evidence": "method step 7: metric definitions and owners are declared"
    },
    {
      "section": "dashboards_and_reproducibility",
      "check": "refresh_cadence_visible",
      "status": "pass",
      "evidence": "method step 7: the refresh cadence is visible"
    },
    {
      "section": "dashboards_and_reproducibility",
      "check": "stale_panels_retired",
      "status": "pass",
      "evidence": "method step 7: stale panels are retired"
    },
    {
      "section": "dashboards_and_reproducibility",
      "check": "tool_version_and_data_snapshot_recorded",
      "status": "pass",
      "evidence": "method step 8 / quality gate: the tool version and a data snapshot are recorded with the chart"
    },
    {
      "section": "dashboards_and_reproducibility",
      "check": "chart_data_reproducible",
      "status": "pass",
      "evidence": "red line: the charted data is reproducible — data that cannot be reproduced is never charted"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "charts_evaluated": 1,
  "computed_max_categories": "5.000000",
  "max_categories_difference_from_limit": "-2.000000",
  "charts_not_matching_question": [],
  "summary": "38 pass, 0 fail, 0 missing of 38 checks across seven sections.",
  "stamp": "DATA VISUALIZATION DESIGN\nentity: Q3_Sales_Report\nVERDICT: DATA_VISUALIZATION_DESIGN_SOUND\n  question_and_chart_choice            pass\n  honesty_and_axes                     pass\n  perception_and_chart_junk            pass\n  color                                pass\n  annotation_and_labels                pass\n  accessibility                        pass\n  dashboards_and_reproducibility       pass\n38 pass, 0 fail, 0 missing of 38 checks across seven sections."
}
```

### Example 2 — Violations

Recorded expectation: HTTP 200, verdict `DATA_VISUALIZATION_DESIGN_NOT_SOUND`.

Input (recorded `input`):

```json
{
  "entity": "Bad_Chart",
  "brief": {
    "audience": "A",
    "question": "Q"
  },
  "charts": [
    {
      "name": "Bad Bar",
      "question_type": "comparison",
      "chart_type": "bar",
      "x_axis_label": "X",
      "y_axis_label": "Y",
      "y_axis_unit": "U",
      "y_axis_start": 10.0,
      "categories_count": 10,
      "bars_sorted": false,
      "dual_axis": true,
      "axis_truncated": true,
      "truncated_flagged_loudly": false,
      "uses_3d": true,
      "red_green_only": true
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

REST response (recorded `response_text`):

```json
{
  "service": "data-visualization-design",
  "atom_version": "0.1.0",
  "entity": "Bad_Chart",
  "verdict": "DATA_VISUALIZATION_DESIGN_NOT_SOUND",
  "sections": {
    "question_and_chart_choice": "fail",
    "honesty_and_axes": "fail",
    "perception_and_chart_junk": "fail",
    "color": "fail",
    "annotation_and_labels": "pass",
    "accessibility": "pass",
    "dashboards_and_reproducibility": "pass"
  },
  "checks": [
    {
      "section": "question_and_chart_choice",
      "check": "audience_declared",
      "status": "pass",
      "evidence": "the design record declares its audience as a non-empty string"
    },
    {
      "section": "question_and_chart_choice",
      "check": "question_declared",
      "status": "pass",
      "evidence": "the design record declares the question it answers as a non-empty string"
    },
    {
      "section": "question_and_chart_choice",
      "check": "chart_entries_complete",
      "status": "pass",
      "evidence": "every chart entry carries a name, question type, chart type, axis labels and unit, axis start, category count, and sorting / dual-axis / truncation / 3D / red-green declarations"
    },
    {
      "section": "question_and_chart_choice",
      "check": "chart_types_match_declared_questions",
      "status": "pass",
      "evidence": "method step 1: every declared chart type is the chart the skill maps its declared question type to — comparison to bar, trend to line, distribution to histogram/box_plot, relationship to scatter, composition to stacked_bar, part-to-whole over time to small_multiples"
    },
    {
      "section": "question_and_chart_choice",
      "check": "comparison_charts_sorted",
      "status": "fail",
      "evidence": "method step 1: every declared comparison chart declares sorted bars (no comparison chart is declared, so this passes vacuously)"
    },
    {
      "section": "honesty_and_axes",
      "check": "bar_charts_y_axis_starts_at_zero",
      "status": "fail",
      "evidence": "method step 2 / quality gate: every declared bar or stacked-bar chart's declared y-axis start is zero (no bar chart is declared, so this passes vacuously)"
    },
    {
      "section": "honesty_and_axes",
      "check": "no_dual_axes_in_declared_charts",
      "status": "fail",
      "evidence": "method step 2: no declared chart row declares a dual axis implying causation"
    },
    {
      "section": "honesty_and_axes",
      "check": "truncated_axes_flagged_loudly",
      "status": "fail",
      "evidence": "method step 2: every declared chart row that declares a truncated axis also declares it flagged loudly"
    },
    {
      "section": "honesty_and_axes",
      "check": "consistent_scales_when_comparing_panels",
      "status": "pass",
      "evidence": "method step 2: consistent scales are declared when comparing panels"
    },
    {
      "section": "honesty_and_axes",
      "check": "data_source_labeled",
      "status": "pass",
      "evidence": "method step 2: the data source is labeled on the chart"
    },
    {
      "section": "honesty_and_axes",
      "check": "data_date_labeled",
      "status": "pass",
      "evidence": "method step 2: the data date is labeled on the chart"
    },
    {
      "section": "honesty_and_axes",
      "check": "misleading_axes_or_scales_not_present",
      "status": "pass",
      "evidence": "red line: no misleading axes or scales are present"
    },
    {
      "section": "perception_and_chart_junk",
      "check": "primary_encoding_uses_position_or_length",
      "status": "pass",
      "evidence": "method step 3: the primary encoding uses position or length, which beat angle, area and colour"
    },
    {
      "section": "perception_and_chart_junk",
      "check": "most_important_element_top_left_or_largest",
      "status": "pass",
      "evidence": "method step 3: the most important thing is top-left or largest"
    },
    {
      "section": "perception_and_chart_junk",
      "check": "gridlines_faint",
      "status": "pass",
      "evidence": "method step 3: gridlines are faint (chart-junk minimized)"
    },
    {
      "section": "perception_and_chart_junk",
      "check": "no_3d_in_declared_charts",
      "status": "fail",
      "evidence": "method step 3: no declared chart row declares 3D"
    },
    {
      "section": "perception_and_chart_junk",
      "check": "chart_junk_minimized",
      "status": "pass",
      "evidence": "method step 3: chart-junk is minimized"
    },
    {
      "section": "perception_and_chart_junk",
      "check": "chart_junk_not_used_as_branding",
      "status": "pass",
      "evidence": "red line: chart-junk is not used as branding"
    },
    {
      "section": "color",
      "check": "palette_colorblind_safe",
      "status": "pass",
      "evidence": "method step 4 / quality gate: the palette is declared colorblind-safe"
    },
    {
      "section": "color",
      "check": "sequential_palette_for_magnitude",
      "status": "pass",
      "evidence": "method step 4: a sequential palette is used for magnitude"
    },
    {
      "section": "color",
      "check": "diverging_palette_around_real_midpoint",
      "status": "pass",
      "evidence": "method step 4: any diverging palette is around a real midpoint"
    },
    {
      "section": "color",
      "check": "red_green_not_used_alone_in_declared_charts",
      "status": "fail",
      "evidence": "method step 4 / quality gate: no declared chart row declares a red/green-only encoding"
    },
    {
      "section": "color",
      "check": "category_counts_within_stated_limit",
      "status": "fail",
      "evidence": "method step 4: the largest declared category count across chart rows is at most the 7 categories the skill states"
    },
    {
      "section": "annotation_and_labels",
      "check": "title_states_finding_not_topic",
      "status": "pass",
      "evidence": "method step 5 / quality gate: the title states the finding, not the topic"
    },
    {
      "section": "annotation_and_labels",
      "check": "events_and_thresholds_marked",
      "status": "pass",
      "evidence": "method step 5: events and thresholds are marked"
    },
    {
      "section": "annotation_and_labels",
      "check": "outliers_called_out_directly",
      "status": "pass",
      "evidence": "method step 5: outliers are called out directly"
    },
    {
      "section": "annotation_and_labels",
      "check": "key_values_annotated",
      "status": "pass",
      "evidence": "quality gate: key values are annotated"
    },
    {
      "section": "annotation_and_labels",
      "check": "axis_labels_and_units_complete",
      "status": "pass",
      "evidence": "every complete chart entry carries a non-empty x-axis label, y-axis label, and y-axis unit"
    },
    {
      "section": "accessibility",
      "check": "legible_sizes",
      "status": "pass",
      "evidence": "method step 6: text sizes are legible"
    },
    {
      "section": "accessibility",
      "check": "alt_text_or_table_fallback_present",
      "status": "pass",
      "evidence": "method step 6 / quality gate: an alt text or table fallback (accessible alternative) exists"
    },
    {
      "section": "accessibility",
      "check": "values_readable_without_hover",
      "status": "pass",
      "evidence": "method step 6: values are readable without hover"
    },
    {
      "section": "accessibility",
      "check": "contrast_sufficient_for_print_and_screen",
      "status": "pass",
      "evidence": "method step 6: contrast is sufficient for print and screen"
    },
    {
      "section": "dashboards_and_reproducibility",
      "check": "dashboard_one_screen_one_story",
      "status": "pass",
      "evidence": "method step 7: a dashboard screen tells one story"
    },
    {
      "section": "dashboards_and_reproducibility",
      "check": "metric_definitions_and_owners_declared",
      "status": "pass",
      "evidence": "method step 7: metric definitions and owners are declared"
    },
    {
      "section": "dashboards_and_reproducibility",
      "check": "refresh_cadence_visible",
      "status": "pass",
      "evidence": "method step 7: the refresh cadence is visible"
    },
    {
      "section": "dashboards_and_reproducibility",
      "check": "stale_panels_retired",
      "status": "pass",
      "evidence": "method step 7: stale panels are retired"
    },
    {
      "section": "dashboards_and_reproducibility",
      "check": "tool_version_and_data_snapshot_recorded",
      "status": "pass",
      "evidence": "method step 8 / quality gate: the tool version and a data snapshot are recorded with the chart"
    },
    {
      "section": "dashboards_and_reproducibility",
      "check": "chart_data_reproducible",
      "status": "pass",
      "evidence": "red line: the charted data is reproducible — data that cannot be reproduced is never charted"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "charts_evaluated": 1,
  "computed_max_categories": "10.000000",
  "max_categories_difference_from_limit": "3.000000",
  "charts_not_matching_question": [],
  "summary": "31 pass, 7 fail, 0 missing of 38 checks across seven sections.",
  "stamp": "DATA VISUALIZATION DESIGN\nentity: Bad_Chart\nVERDICT: DATA_VISUALIZATION_DESIGN_NOT_SOUND\n  question_and_chart_choice            fail\n  honesty_and_axes                     fail\n  perception_and_chart_junk            fail\n  color                                fail\n  annotation_and_labels                pass\n  accessibility                        pass\n  dashboards_and_reproducibility       pass\n31 pass, 7 fail, 0 missing of 38 checks across seven sections."
}
```

### Example 3 — Malformed

Recorded expectation: HTTP 422, error `invalid_input` — never a verdict.

Input (recorded `input`):

```json
{
  "entity": "Malformed",
  "charts": "not_a_list"
}
```

REST response (recorded `response_text`):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "charts",
  "detail": "charts must be a list"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation all present |
| Output format | CommonMark markdown |
| Role views present | Integrators (Users): Yes · Developers: Yes · Ops: Yes · Regulators: N/A — although the record carries accessibility declarations, the verdict is a design-record consistency audit and imposes no accessibility standard (SERVICE.md expressly declines to impose a WCAG ratio); it is not compliance or audit evidence. |
| Checks named: documented / recorded | 38 / 38 |
| Verdict vocabulary complete | Yes — all 3 verdict values (DATA_VISUALIZATION_DESIGN_NOT_SOUND, DATA_VISUALIZATION_DESIGN_SOUND, INSUFFICIENT_EVIDENCE), section statuses, per-check statuses and `computed_status` values listed |
| Input reference typed | Yes — 44 fields, each with a type, grouped as SERVICE.md groups them |
| Worked examples verbatim-verified | Yes — full-pass / violations / malformed inputs and REST responses parsed and compared as JSON values against `verification/work/data-visualization-design/evidence.json` after writing |
