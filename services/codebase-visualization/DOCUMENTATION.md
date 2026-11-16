# Codebase visualization — `codebase-visualization`

**Display name:** Codebase visualization · **Slug:** `codebase-visualization` · **Deliverable type:** DELIVERABLE · **Atom version:** 0.1.0 · **Status:** live — release candidate (one-week RC soak to 2026-11-22)

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run; the verbatim request and response live under [Worked examples](#worked-examples), example 1.

1. **Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a key for this atom: `POST /v1/keys` with `{"atom": "codebase-visualization"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
2. **Assemble the manifest.** Fill every group in the [Input reference](#input-reference) — one JSON object declaring the artifact this atom audits. Declare values truthfully: the atom judges declared evidence only (see Explanation). The recorded run's manifest (example 1 below) declares `entity` = "service-alpha" and supplies every section's fields.
3. **Call REST.** `POST https://atoms.pipavia.com/v1/codebase-visualization` with header `Authorization: Bearer <key>` and the manifest as the JSON body.
4. **Read the verdict.** The recorded run returned HTTP 200 with verdict `CODEBASE_VISUALIZATION_READY` — 32 pass, 0 fail, 0 missing of 32 checks across six sections. Recorded computed values: `diagrams_evaluated` = `1`; `computed_dependency_coverage` = `"1.000000"`; `dependency_coverage_difference` = `"0.000000"`; `computed_hotspot_score` = `"10.000000"`; `hotspot_score_difference` = `"0.000000"`; `c4_levels_not_declared` = `[]`; `computed_status` = `"within_stated_limits_on_declared_evidence"`.
   Why it passes, in the tester's recorded words: All 32 checks pass: 1 complete diagram entry (mermaid), dependency 10/10, C4 levels context/containers/components, hotspot 5.0 x 2.0 = 10.0 declared 10.0.
5. **Act on it.** A passing verdict needs no action. For any other verdict, work through the `fail` and `missing` checks in the response (see *Read a failing verdict and fix the manifest* below) and resubmit — the atom is deterministic, so the same manifest always returns the same verdict.

## How-to guides

### Get a key and call via REST

1. `POST https://atoms.pipavia.com/v1/signup` with your email; open the emailed sign-in link to mint your session.
2. `POST /v1/keys` with `{"atom": "codebase-visualization"}` to grant this atom's scope on your gateway key.
3. Call `POST https://atoms.pipavia.com/v1/codebase-visualization` with `Authorization: Bearer <key>` and the manifest JSON as the body. HTTP 200 returns the verdict object (see Output format); errors are covered below and in Reference.

### Call via MCP

Connect your MCP client to `POST https://atoms.pipavia.com/mcp/codebase-visualization` with the same `Authorization: Bearer <key>` header and call the tool `codebase_visualization` with the manifest object as its arguments. The MCP `structuredContent` is deep-equal to the REST verdict object — the recorded battery verified REST/MCP parity on the full-pass case (see TEST-REPORT.md).

### Read a failing verdict and fix the manifest

1. Look at `verdict`: `CODEBASE_VISUALIZATION_NOT_READY` means at least one check failed; `INSUFFICIENT_EVIDENCE` means nothing failed but evidence is missing (the recorded sparse run — a manifest carrying only `entity` — returned exactly that: 0 pass, 0 fail, 32 missing of 32 checks across six sections). A section reports `fail` if any of its checks fail, else `insufficient_evidence` if any is `missing`, else `pass`.
2. Work the `checks` array: each entry names its `section`, the `check`, its `status` (`pass` / `fail` / `missing`) and an `evidence` line stating the requirement. Fix every `fail` by changing the underlying practice/design and declaring the true new value; fix every `missing` by supplying the field.
3. In the recorded violations run (Worked examples, example 2), the verdict was `CODEBASE_VISUALIZATION_NOT_READY` — 29 pass, 3 fail, 0 missing of 32 checks across six sections. The failing checks were exactly: `diagram_formats_use_stated_diagrams_as_code_tools`, `dependency_graph_covers_all_declared_modules`, `hotspot_score_matches_change_frequency_times_complexity`. Recorded case notes: Full manifest with exactly 3 planted violations: diagram format jpeg (not a stated diagrams-as-code tool), dependency modules_included 5 vs modules_total 10, declared hotspot score 99.0 vs 2.0 x 2.0 = 4.0.
4. Resubmit the corrected manifest. Determinism is verified in the recorded battery (the full-pass manifest submitted twice returned byte-identical responses), so a changed verdict reflects your changed manifest, not noise.

### Handle a 422 invalid_input

A type or shape error is rejected before evaluation with HTTP 422 and body `{"ok": false, "error": "invalid_input", "field": ..., "detail": ...}`. The recorded malformed case for this atom returned field `dependency.modules_total` with detail "dependency.modules_total must be a number" (verbatim in Worked examples, example 3). Fix the named field to the type given in the Input reference, then resubmit. Note the distinction: a *wrong-typed* value is a 422; a well-typed but false/invalid value is evaluated and fails its check; an *absent* field is not an error — it is scored `missing`.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/codebase-visualization` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/codebase-visualization` — tool name `codebase_visualization`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Gateway base: `https://atoms.pipavia.com` (recorded gateway version 1.1.0).

### Input reference

One JSON manifest per call. Every field below is read by the named section's checks, grouped as SERVICE.md groups them (by the section that reads the field). Types are from SERVICE.md's field table — all fields are booleans unless noted in the table — corroborated by contract.yaml and the recorded evidence input schema (`inputSchema` in the MCP tool definition). An **absent** field = evidence missing; a field **present but false / invalid** = the check fails. Gates and conditionals are preserved in the Notes column.

| Field | Type | Read by (section) | Notes |
|---|---|---|---|
| `entity` | string | — | string; carried into the verdict output, not itself checked |
| `diagrams_as_code.key_diagrams_exist_as_code_in_repo` | boolean | diagrams_as_code |  |
| `diagrams_as_code.regenerable` | boolean | diagrams_as_code |  |
| `diagrams_as_code.versioned_and_diffable` | boolean | diagrams_as_code |  |
| `diagrams_as_code.regenerated_on_change` | boolean | diagrams_as_code |  |
| `diagrams_as_code.diagrams` | list of diagram entries | diagrams_as_code | list of diagram entries; absent / not a list / empty = both computed diagram checks missing |
| `diagrams_as_code.diagrams[].name` | string | diagrams_as_code | string; must be non-empty for the entry to be complete |
| `diagrams_as_code.diagrams[].format` | string | diagrams_as_code | string; must be non-empty for the entry to be complete, and one of the stated formats to pass the format check — see below |
| `diagrams_as_code.diagrams[].scope` | string | diagrams_as_code | string; must be non-empty for the entry to be complete |
| `diagrams_as_code.diagrams[].generation_source` | string | diagrams_as_code | string; must be non-empty for the entry to be complete |
| `diagrams_as_code.diagrams[].generated_at` | string | diagrams_as_code | string; must be non-empty for the entry to be complete — a label, not a parsed date; no freshness age is computed from it |
| `dependency.graph_present` | boolean | dependency_views |  |
| `dependency.cycles_highlighted` | boolean | dependency_views |  |
| `dependency.layering_violations_highlighted` | boolean | dependency_views |  |
| `dependency.known_issues_list_maintained` | boolean | dependency_views |  |
| `dependency.modules_total` | number | dependency_views | number; computed, see below |
| `dependency.modules_included` | number | dependency_views | number; computed, see below |
| `call_and_flow.call_graph_for_hot_paths_present` | boolean | call_and_flow_views |  |
| `call_and_flow.sequence_diagrams_for_critical_journeys_present` | boolean | call_and_flow_views |  |
| `call_and_flow.data_flow_for_pipelines_present` | boolean | call_and_flow_views |  |
| `architecture.map_present` | boolean | architecture_maps |  |
| `architecture.levels_declared` | list of strings | architecture_maps | list of strings; computed, see below |
| `architecture.one_page_per_level` | boolean | architecture_maps |  |
| `architecture.owners_annotated` | boolean | architecture_maps |  |
| `architecture.boundaries_annotated` | boolean | architecture_maps |  |
| `architecture.adrs_live_beside_maps` | boolean | architecture_maps |  |
| `metrics.complexity_heatmap_present` | boolean | metrics_and_history_views |  |
| `metrics.coverage_overlay_present` | boolean | metrics_and_history_views |  |
| `metrics.hotspot_view_considered` | boolean | metrics_and_history_views |  |
| `metrics.hotspot_change_frequency` | number | metrics_and_history_views | number; computed, see below |
| `metrics.hotspot_complexity` | number | metrics_and_history_views | number; computed, see below |
| `metrics.declared_hotspot_score` | number | metrics_and_history_views | number; computed, see below |
| `history.churn_timeline_present` | boolean | metrics_and_history_views |  |
| `history.ownership_map_present` | boolean | metrics_and_history_views |  |
| `history.incident_overlays_present` | boolean | metrics_and_history_views |  |
| `honesty.each_diagram_labeled_scope_and_generation_source` | boolean | honesty_and_currency |  |
| `honesty.diagrams_labeled_generated_at_tool_scope` | boolean | honesty_and_currency |  |
| `honesty.generatable_diagrams_generated` | boolean | honesty_and_currency |  |
| `honesty.stale_diagrams_shipped_as_truth` | boolean | honesty_and_currency | must be `false` to pass — skill red line |
| `honesty.unlabeled_hand_drawn_maps_guiding_decisions` | boolean | honesty_and_currency | must be `false` to pass — skill red line |

### Checks

All 32 checks, exactly as named in the recorded full-pass REST response, grouped by section. **Shape note, stated plainly:** this atom's recorded responses **do** carry a `checks` array (32 checks, like the other atoms in this cohort) — it is not a checks-less computed atom. Its computed outputs are the additional top-level response fields listed under Output format (`computed_status`, coverage / hotspot re-derivations and differences), which the checks below consume.

Per-check statuses: `pass` — the requirement is met on the declared evidence; `fail` — the field is present but false/invalid, or a computed condition is breached; `missing` — the field is absent, so there is no evidence to judge. Across all recorded cases for this atom the only per-check status values observed are `pass`, `fail` and `missing`; there is no separate not-applicable status value in the output — where a check is gated by another declared field (see the gated checks' evidence lines), the gate's declared value decides whether the requirement is held, as the evidence line states.

#### Section: `diagrams_as_code` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `key_diagrams_exist_as_code_in_repo` | quality gate: key diagrams exist as code in-repo |
| `diagrams_regenerable` | quality gate: the diagrams-as-code in-repo are regenerable |
| `diagrams_versioned_and_diffable` | method step 1: diagrams-as-code are versioned and diff-able |
| `diagrams_regenerated_on_change` | method step 1: diagrams are regenerated on change |
| `diagram_entries_complete` | every diagram entry carries a name, format, scope, generation source, and generated-at label |
| `diagram_formats_use_stated_diagrams_as_code_tools` | method step 1: every declared diagram format is one of the diagrams-as-code tools the skill names — mermaid, graphviz, plantuml |

#### Section: `dependency_views` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `dependency_graph_present` | method step 2: a module/package dependency (import) graph is present |
| `cycles_highlighted` | quality gate: cycles are highlighted / visible in the dependency view |
| `layering_violations_highlighted` | quality gate: layering violations are highlighted / visible in the dependency view |
| `known_issues_list_maintained` | quality gate: a known-issues ('known bad') list is maintained |
| `dependency_graph_covers_all_declared_modules` | method step 2: the declared modules included in the dependency graph equal the declared total modules (the graph covers the whole declared module set; no partial-coverage percentage is imposed) |

#### Section: `call_and_flow_views` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `call_graph_for_hot_paths_present` | method step 3: call graphs for hot paths are present |
| `sequence_diagrams_for_critical_journeys_present` | method step 3: sequence diagrams for critical journeys are present |
| `data_flow_views_for_pipelines_present` | method step 3: data-flow views for pipelines are present |

#### Section: `architecture_maps` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `architecture_map_present` | method step 4: an architecture map is present |
| `c4_levels_cover_stated_levels` | method step 4: the declared architecture levels cover every C4-lite level the skill names — context, containers, components |
| `one_page_per_level` | method step 4: the architecture map keeps one page per level |
| `owners_annotated` | method step 4: owners are annotated on the architecture map |
| `boundaries_annotated` | method step 4: boundaries are annotated on the architecture map |
| `adrs_live_beside_maps` | method step 4: ADRs live beside the architecture maps |

#### Section: `metrics_and_history_views` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `complexity_heatmap_present` | method step 5: a complexity heatmap is present |
| `coverage_overlay_present` | method step 5: a coverage overlay is present |
| `hotspot_view_considered` | quality gate: a hotspot view (churn x complexity) is considered for refactor targets |
| `hotspot_score_matches_change_frequency_times_complexity` | method step 5: the declared hotspot score equals the declared change frequency multiplied by the declared complexity (change-frequency x complexity; no score cutoff is judged here) |
| `churn_timeline_present` | method step 6: a churn timeline history view is present |
| `ownership_map_present` | method step 6: an ownership map history view is present |
| `incident_overlays_present` | method step 6: incident overlays on history views are present |

#### Section: `honesty_and_currency` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `each_diagram_labeled_with_scope_and_generation_source` | quality gate: each diagram is labeled with scope and generation source |
| `diagrams_labeled_generated_at_tool_and_scope` | method step 7: diagrams are labeled with generated-at, tool, and scope |
| `generatable_diagrams_generated` | method step 7: what can be generated is generated |
| `stale_diagrams_not_shipped_as_truth` | red line: no stale diagrams are shipped as truth — stale diagrams are deleted or regenerated rather than let lie |
| `unlabeled_hand_drawn_maps_not_guiding_decisions` | red line: no unlabeled hand-drawn maps guide decisions — regenerate or remove |

### Output format

HTTP 200 returns one JSON object (REST body; the same object is the MCP `structuredContent`):

- `service` — The atom slug (`codebase-visualization`).
- `atom_version` — Atom version that produced the verdict (`0.1.0` in the recorded runs).
- `entity` — The caller's `entity` value, carried through from the manifest (not itself checked).
- `verdict` — The overall verdict — see Verdict vocabulary.
- `sections` — Per-section statuses keyed by section name — see Verdict vocabulary.
- `checks` — All 32 per-check results: `section`, `check`, `status`, `evidence`.
- `computed_status` — Computed/reported field; recorded full-pass value: `"within_stated_limits_on_declared_evidence"`.
- `diagrams_evaluated` — Computed/reported field; recorded full-pass value: `1`.
- `computed_dependency_coverage` — Computed/reported field; recorded full-pass value: `"1.000000"`.
- `dependency_coverage_difference` — Computed/reported field; recorded full-pass value: `"0.000000"`.
- `computed_hotspot_score` — Computed/reported field; recorded full-pass value: `"10.000000"`.
- `hotspot_score_difference` — Computed/reported field; recorded full-pass value: `"0.000000"`.
- `c4_levels_not_declared` — Computed/reported field; recorded full-pass value: `[]`.
- `summary` — One-line counts, e.g. the recorded full-pass summary quoted in the Tutorial.
- `stamp` — A plain-text rendering of the verdict (title, entity, verdict, per-section statuses, summary) for logs and tickets.

From USER-GUIDE.md's verdict notes: The response also reports `diagrams_evaluated` (count of complete diagram entries), `computed_dependency_coverage` and `dependency_coverage_difference`, `computed_hotspot_score` and `hotspot_score_difference` (computed amounts as strings with exactly six decimals, or null when they cannot be computed), `c4_levels_not_declared` (omitted stated C4 levels, or null when no list is declared) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null).

### Verdict vocabulary

**Overall verdicts** — every value this atom can return:

- `CODEBASE_VISUALIZATION_READY` — every check passes; the visualization artifact is complete and internally consistent on the declared evidence.
- `CODEBASE_VISUALIZATION_NOT_READY` — at least one check fails; the failing checks name the breached section and the evidence against it.
- `INSUFFICIENT_EVIDENCE` — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

**Section statuses** (values of each entry in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check fails but at least one is `missing`.

**Per-check statuses** (values of each check's `status`): `pass`, `fail`, `missing` — as defined under Checks.

**Computed fields:**

- `computed_status` — `within_stated_limits_on_declared_evidence` when every computed check that can be completed is within its stated limits; `outside_stated_limits_on_declared_evidence` when a computed check is breached; `null` when a computed check cannot be completed (recorded sparse-run value: `null`).
- `diagrams_evaluated` — reported as in the recorded responses (full-pass value `1`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `computed_dependency_coverage` — reported as in the recorded responses (full-pass value `"1.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `dependency_coverage_difference` — reported as in the recorded responses (full-pass value `"0.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `computed_hotspot_score` — reported as in the recorded responses (full-pass value `"10.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `hotspot_score_difference` — reported as in the recorded responses (full-pass value `"0.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `c4_levels_not_declared` — reported as in the recorded responses (full-pass value `[]`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.

### Errors

Only the shapes evidenced in the repo / gateway docs are listed; no other payloads are promised.

- **401** — missing or invalid key (gateway DESIGN.md: unknown/revoked key = 401). No verdict is produced.
- **403** — the key lacks this atom's scope (gateway DESIGN.md: missing scope at an atom = 403). Issue the atom's scope on your key (`POST /v1/keys` with this atom's slug) and retry.
- **422** — invalid input: `{"ok": false, "error": "invalid_input", "field": "dependency.modules_total", "detail": "dependency.modules_total must be a number"}` is this atom's recorded malformed-case shape (verbatim in Worked examples, example 3); `field` names the offending field and `detail` states the expected type.
- **429** — rate limit exceeded (see Rate limits; gateway DESIGN.md: over limit → 429 naming the limit, and the call is not metered). Back off and retry; do not parallel-retry.

### Rate limits + pricing status

- **Rate limits:** 60 requests/minute and 10,000 requests/day per key (contract.yaml `rate_limit`; SPEC default — the per-key rate limit is the capacity guard for open public usage).
- **Pricing:** Free during trial — rate pending. contract.yaml `pricing.rate` is `null` (`rate_status: pending`); pricing unit is the deliverable, and prices are set only from measured production cost per unit.

## Explanation

You have a codebase-visualization artifact — diagrams-as-code entries, a dependency view with module counts, call & flow views, an architecture map with declared C4 levels, metrics and history views with a declared top hotspot, and an honesty record. This atom reads one declared manifest and returns one deterministic verdict across six sections: **CODEBASE_VISUALIZATION_READY**, **CODEBASE_VISUALIZATION_NOT_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared artifact's completeness and internal consistency only — it does not render a diagram, read any actual code, or judge whether a diagram is clear or accurate. Computed checks: every declared diagram entry must be complete (non-empty `name`, `format`, `scope`, `generation_source`, `generated_at`) and every declared format must be one of the stated diagrams-as-code tools — `mermaid`, `graphviz`, `plantuml` (no minimum diagram count is imposed); the declared modules included in the dependency graph must equal the declared total modules, with a positive total (no partial-coverage percentage is accepted); the declared architecture levels must cover all three stated C4-lite levels — `context`, `containers`, `components` (extra entries do not hurt); and the declared hotspot score must equal change-frequency × complexity (no score cutoff is imposed). Same manifest in → same verdict out.

**Computed checks.** Five checks are computed from the declared values, using only what the skill itself states plus the arithmetic of the declared numbers — no outside threshold is imported:

- **Diagram entries:** the entries check passes only when every declared diagram entry carries a non-empty `name`, `format`, `scope`, `generation_source` and `generated_at` string. A missing or empty list is missing evidence; an incomplete entry makes both computed diagram checks missing (the entry cannot be evaluated). The output reports `diagrams_evaluated` (the count of complete entries).
- **Diagram formats:** the skill's method step 1 names the diagrams-as-code tools — "Mermaid/Graphviz/PlantUML in the repo". The format check therefore passes only when every complete entry's declared `format` is one of `mermaid`, `graphviz`, `plantuml`. Entries are validated as strings only, never enum-checked at type level — format membership is a verdict check, not a type error.
- **Dependency coverage:** the declared `dependency.modules_included` passes only when it equals the declared `dependency.modules_total` (with a positive total — a zero total fails, as no graph over zero modules can be evaluated). The output reports `computed_dependency_coverage` (`modules_included` / `modules_total`, null when it cannot be computed) and `dependency_coverage_difference` (included minus total, null likewise). **No partial-coverage percentage is imposed** as a pass mark — only exact equality of the two declared counts.
- **C4 levels:** the skill's method step 4 states the C4-lite levels — context → containers → components. The declared `architecture.levels_declared` list therefore passes only when it contains all three stated entries (`context`, `containers`, `components`); extra entries do not hurt, unknown entries do not count toward coverage. A missing list is missing evidence; an empty list is present and fails. The output reports the omitted stated entries as `c4_levels_not_declared` (null when no list is declared). Entries are validated as strings only, never enum-checked — coverage is a verdict check, not a type error.
- **Hotspot score:** the skill's method step 5 defines hotspots as change-frequency × complexity. The declared `metrics.declared_hotspot_score` therefore passes only when it equals `metrics.hotspot_change_frequency` × `metrics.hotspot_complexity`. The output reports `computed_hotspot_score` and `hotspot_score_difference` (declared minus computed, null when either cannot be computed).

**Fixed serialization rule:** computed amounts and ratios are reported as strings with exactly six decimal places, produced in both implementations by the same rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six decimals; computed comparisons compare the fixed-6dp difference to zero. That fixed serialization is what makes the Python and TypeScript outputs byte-identical.

**How the verdict is decided.** The core is deterministic: same manifest in → same verdict out, byte-identical on repeat calls and identical across the REST and MCP faces (both verified in the recorded battery). Every check reads declared fields only. The three-way distinction is the heart of the semantics: an **absent** field is *missing evidence* (check `missing`; the verdict can be at most `INSUFFICIENT_EVIDENCE`), while a field **present but false / invalid** is a *failure* (check `fail`; the verdict is `CODEBASE_VISUALIZATION_NOT_READY`) — and a wrong-*typed* value is neither: it is rejected up front as a 422. Any single `fail` decides the verdict in effect — failures outrank missing evidence — and only a manifest with no fails and no missing checks earns `CODEBASE_VISUALIZATION_READY`. The verdict is one of `CODEBASE_VISUALIZATION_READY` (all 32 checks pass), `CODEBASE_VISUALIZATION_NOT_READY` (any check fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing), across six sections: diagrams_as_code, dependency_views, call_and_flow_views, architecture_maps, metrics_and_history_views, honesty_and_currency.

**What it does NOT do.**

*Honest scoping (from SERVICE.md):*

This atom audits a **declared** visualization artifact record — it does not render graphics, generate a diagram, parse or read actual code, build a dependency/call graph from a repository, verify that a declared diagram exists in any repo, or verify that a declared value is true. It exercises no judgment of its own: the artifact declares its own views, coverage, encodings and labels, and this core checks only their internal consistency and the completeness of the skill's method on the declared evidence. An artifact is ready *on the caller's declared evidence* even if its diagrams are poor or its codebase is tangled. It is a completeness and consistency audit, **not a visualization review**: it never decides whether a diagram is clear, whether an architecture map is accurate, whether a hotspot deserves refactoring, or whether the declared coverage matches the real codebase.

Named exclusions: no rendering or generation of any diagram; no reading, indexing or parsing of any source code or repository; no verification of any declared diagram, module count, cycle, or label against a real codebase; no clarity, accuracy or usefulness judgment of any view.

*Thresholds declined (from SERVICE.md):*

The skill states no number for these, so none is imposed — naming them here instead of inventing one:

- **No minimum diagram count** — the skill requires key diagrams as code in-repo, but states no number of diagrams; only entry completeness and stated formats are checked.
- **No partial dependency-coverage percentage** — no percentage (e.g. 80% or 90% of modules) is accepted as passing; only exact equality of the declared included and total counts.
- **No hotspot score cutoff** — the skill states the product formula (change-frequency × complexity) but no score above which a module counts as a hotspot; only the arithmetic is re-derived, and no refactor-target judgment is made.
- **No complexity or churn threshold** — no complexity value or change-frequency value is treated as high or low.
- **No diagram freshness age** — the skill requires a generated-at label and forbids stale diagrams shipped as truth, but states no maximum age in days; staleness is the caller's declaration (`stale_diagrams_shipped_as_truth`), and `generated_at` is checked as a non-empty label, never parsed or aged.
- **No allowable cycle or layering-violation count** — the skill requires cycles and violations to be visible, but states no permitted number; only their declared visibility is checked.
- **No coverage-overlay percentage, heatmap scale, or history window** — the skill names these views but states no coverage percentage, colour scale, or time window for them.

**Buyer / use context.** First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves. The house's own workflow that calls it: **Codebase onboarding diagrams**. One unit of sale = one delivered result. The atom sells its deliverable — the bounded judgment artifact — never the underlying knowledge itself.

## Role views

### For integrators (Users)

You need: the endpoints and tool name above, one key with this atom's scope, and a manifest that declares your evidence truthfully. Read `verdict` first, then `sections` to localize a problem, then the individual `fail`/`missing` checks to fix it. Budget for the 60/min, 10,000/day per-key limits; price is free during trial (rate pending). Status is release candidate — pin to the recorded behaviour in TEST-REPORT.md and expect the RC soak to 2026-11-22.

### For developers

Manifest authoring: follow the Input reference exactly — field names, nesting and types are the contract; a wrong type is a 422, an omitted field is `missing`, a false value is a `fail`. Determinism: the evaluation core is a pure function of the manifest (Python oracle `src/codebase_visualization.py` — `evaluate(manifest) -> verdict dict`; tests: `tests/test_codebase_visualization.py` — 47 tests; see TEST-REPORT.md for the recorded external battery). Fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps (contract.yaml binding rule R1).

### For ops

Endpoints: REST `POST /v1/codebase-visualization` and MCP `POST /mcp/codebase-visualization` on `https://atoms.pipavia.com` (gateway v1.1.0 in the recorded battery). Key scope: per-atom scope on the gateway key; 401 = missing/invalid key, 403 = scope missing — separate those two in alerting. Error monitoring: 422s indicate caller-side manifest type errors (field + detail are in the body); 429s indicate the 60/min or 10,000/day per-key limit. RC status: live — release candidate, one-week RC soak to 2026-11-22; atom version 0.1.0.

## Worked examples

Provenance: recorded 2026-11-16T02:00:27.455816+00:00 against gateway v1.1.0, external verification lane, source `verification/work/codebase-visualization/evidence.json`. Each example is the case's recorded `input` followed by the REST execution's recorded `response_text`, reproduced verbatim as JSON values (pretty-printed with indent 2 for readability; verified mechanically against the evidence after writing).

### Example 1 — Full-pass (recorded case `full-pass`, HTTP 200)

Input:

```json
{
  "entity": "service-alpha",
  "diagrams_as_code": {
    "key_diagrams_exist_as_code_in_repo": true,
    "regenerable": true,
    "versioned_and_diffable": true,
    "regenerated_on_change": true,
    "diagrams": [
      {
        "name": "arch-map",
        "format": "mermaid",
        "scope": "global",
        "generation_source": "cli",
        "generated_at": "2023-10-01"
      }
    ]
  },
  "dependency": {
    "graph_present": true,
    "cycles_highlighted": true,
    "layering_violations_highlighted": true,
    "known_issues_list_maintained": true,
    "modules_total": 10,
    "modules_included": 10
  },
  "call_and_flow": {
    "call_graph_for_hot_paths_present": true,
    "sequence_diagrams_for_critical_journeys_present": true,
    "data_flow_for_pipelines_present": true
  },
  "architecture": {
    "map_present": true,
    "levels_declared": [
      "context",
      "containers",
      "components"
    ],
    "one_page_per_level": true,
    "owners_annotated": true,
    "boundaries_annotated": true,
    "adrs_live_beside_maps": true
  },
  "metrics": {
    "complexity_heatmap_present": true,
    "coverage_overlay_present": true,
    "hotspot_view_considered": true,
    "hotspot_change_frequency": 5.0,
    "hotspot_complexity": 2.0,
    "declared_hotspot_score": 10.0
  },
  "history": {
    "churn_timeline_present": true,
    "ownership_map_present": true,
    "incident_overlays_present": true
  },
  "honesty": {
    "each_diagram_labeled_scope_and_generation_source": true,
    "diagrams_labeled_generated_at_tool_scope": true,
    "generatable_diagrams_generated": true,
    "stale_diagrams_shipped_as_truth": false,
    "unlabeled_hand_drawn_maps_guiding_decisions": false
  }
}
```

Response (`response_text`):

```json
{
  "service": "codebase-visualization",
  "atom_version": "0.1.0",
  "entity": "service-alpha",
  "verdict": "CODEBASE_VISUALIZATION_READY",
  "sections": {
    "diagrams_as_code": "pass",
    "dependency_views": "pass",
    "call_and_flow_views": "pass",
    "architecture_maps": "pass",
    "metrics_and_history_views": "pass",
    "honesty_and_currency": "pass"
  },
  "checks": [
    {
      "section": "diagrams_as_code",
      "check": "key_diagrams_exist_as_code_in_repo",
      "status": "pass",
      "evidence": "quality gate: key diagrams exist as code in-repo"
    },
    {
      "section": "diagrams_as_code",
      "check": "diagrams_regenerable",
      "status": "pass",
      "evidence": "quality gate: the diagrams-as-code in-repo are regenerable"
    },
    {
      "section": "diagrams_as_code",
      "check": "diagrams_versioned_and_diffable",
      "status": "pass",
      "evidence": "method step 1: diagrams-as-code are versioned and diff-able"
    },
    {
      "section": "diagrams_as_code",
      "check": "diagrams_regenerated_on_change",
      "status": "pass",
      "evidence": "method step 1: diagrams are regenerated on change"
    },
    {
      "section": "diagrams_as_code",
      "check": "diagram_entries_complete",
      "status": "pass",
      "evidence": "every diagram entry carries a name, format, scope, generation source, and generated-at label"
    },
    {
      "section": "diagrams_as_code",
      "check": "diagram_formats_use_stated_diagrams_as_code_tools",
      "status": "pass",
      "evidence": "method step 1: every declared diagram format is one of the diagrams-as-code tools the skill names — mermaid, graphviz, plantuml"
    },
    {
      "section": "dependency_views",
      "check": "dependency_graph_present",
      "status": "pass",
      "evidence": "method step 2: a module/package dependency (import) graph is present"
    },
    {
      "section": "dependency_views",
      "check": "cycles_highlighted",
      "status": "pass",
      "evidence": "quality gate: cycles are highlighted / visible in the dependency view"
    },
    {
      "section": "dependency_views",
      "check": "layering_violations_highlighted",
      "status": "pass",
      "evidence": "quality gate: layering violations are highlighted / visible in the dependency view"
    },
    {
      "section": "dependency_views",
      "check": "known_issues_list_maintained",
      "status": "pass",
      "evidence": "quality gate: a known-issues ('known bad') list is maintained"
    },
    {
      "section": "dependency_views",
      "check": "dependency_graph_covers_all_declared_modules",
      "status": "pass",
      "evidence": "method step 2: the declared modules included in the dependency graph equal the declared total modules (the graph covers the whole declared module set; no partial-coverage percentage is imposed)"
    },
    {
      "section": "call_and_flow_views",
      "check": "call_graph_for_hot_paths_present",
      "status": "pass",
      "evidence": "method step 3: call graphs for hot paths are present"
    },
    {
      "section": "call_and_flow_views",
      "check": "sequence_diagrams_for_critical_journeys_present",
      "status": "pass",
      "evidence": "method step 3: sequence diagrams for critical journeys are present"
    },
    {
      "section": "call_and_flow_views",
      "check": "data_flow_views_for_pipelines_present",
      "status": "pass",
      "evidence": "method step 3: data-flow views for pipelines are present"
    },
    {
      "section": "architecture_maps",
      "check": "architecture_map_present",
      "status": "pass",
      "evidence": "method step 4: an architecture map is present"
    },
    {
      "section": "architecture_maps",
      "check": "c4_levels_cover_stated_levels",
      "status": "pass",
      "evidence": "method step 4: the declared architecture levels cover every C4-lite level the skill names — context, containers, components"
    },
    {
      "section": "architecture_maps",
      "check": "one_page_per_level",
      "status": "pass",
      "evidence": "method step 4: the architecture map keeps one page per level"
    },
    {
      "section": "architecture_maps",
      "check": "owners_annotated",
      "status": "pass",
      "evidence": "method step 4: owners are annotated on the architecture map"
    },
    {
      "section": "architecture_maps",
      "check": "boundaries_annotated",
      "status": "pass",
      "evidence": "method step 4: boundaries are annotated on the architecture map"
    },
    {
      "section": "architecture_maps",
      "check": "adrs_live_beside_maps",
      "status": "pass",
      "evidence": "method step 4: ADRs live beside the architecture maps"
    },
    {
      "section": "metrics_and_history_views",
      "check": "complexity_heatmap_present",
      "status": "pass",
      "evidence": "method step 5: a complexity heatmap is present"
    },
    {
      "section": "metrics_and_history_views",
      "check": "coverage_overlay_present",
      "status": "pass",
      "evidence": "method step 5: a coverage overlay is present"
    },
    {
      "section": "metrics_and_history_views",
      "check": "hotspot_view_considered",
      "status": "pass",
      "evidence": "quality gate: a hotspot view (churn x complexity) is considered for refactor targets"
    },
    {
      "section": "metrics_and_history_views",
      "check": "hotspot_score_matches_change_frequency_times_complexity",
      "status": "pass",
      "evidence": "method step 5: the declared hotspot score equals the declared change frequency multiplied by the declared complexity (change-frequency x complexity; no score cutoff is judged here)"
    },
    {
      "section": "metrics_and_history_views",
      "check": "churn_timeline_present",
      "status": "pass",
      "evidence": "method step 6: a churn timeline history view is present"
    },
    {
      "section": "metrics_and_history_views",
      "check": "ownership_map_present",
      "status": "pass",
      "evidence": "method step 6: an ownership map history view is present"
    },
    {
      "section": "metrics_and_history_views",
      "check": "incident_overlays_present",
      "status": "pass",
      "evidence": "method step 6: incident overlays on history views are present"
    },
    {
      "section": "honesty_and_currency",
      "check": "each_diagram_labeled_with_scope_and_generation_source",
      "status": "pass",
      "evidence": "quality gate: each diagram is labeled with scope and generation source"
    },
    {
      "section": "honesty_and_currency",
      "check": "diagrams_labeled_generated_at_tool_and_scope",
      "status": "pass",
      "evidence": "method step 7: diagrams are labeled with generated-at, tool, and scope"
    },
    {
      "section": "honesty_and_currency",
      "check": "generatable_diagrams_generated",
      "status": "pass",
      "evidence": "method step 7: what can be generated is generated"
    },
    {
      "section": "honesty_and_currency",
      "check": "stale_diagrams_not_shipped_as_truth",
      "status": "pass",
      "evidence": "red line: no stale diagrams are shipped as truth — stale diagrams are deleted or regenerated rather than let lie"
    },
    {
      "section": "honesty_and_currency",
      "check": "unlabeled_hand_drawn_maps_not_guiding_decisions",
      "status": "pass",
      "evidence": "red line: no unlabeled hand-drawn maps guide decisions — regenerate or remove"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "diagrams_evaluated": 1,
  "computed_dependency_coverage": "1.000000",
  "dependency_coverage_difference": "0.000000",
  "computed_hotspot_score": "10.000000",
  "hotspot_score_difference": "0.000000",
  "c4_levels_not_declared": [],
  "summary": "32 pass, 0 fail, 0 missing of 32 checks across six sections.",
  "stamp": "CODEBASE VISUALIZATION\nentity: service-alpha\nVERDICT: CODEBASE_VISUALIZATION_READY\n  diagrams_as_code             pass\n  dependency_views             pass\n  call_and_flow_views          pass\n  architecture_maps            pass\n  metrics_and_history_views    pass\n  honesty_and_currency         pass\n32 pass, 0 fail, 0 missing of 32 checks across six sections."
}
```

### Example 2 — Violations (recorded case `violations`, HTTP 200)

Input:

```json
{
  "entity": "service-beta",
  "diagrams_as_code": {
    "key_diagrams_exist_as_code_in_repo": true,
    "regenerable": true,
    "versioned_and_diffable": true,
    "regenerated_on_change": true,
    "diagrams": [
      {
        "name": "bad-format",
        "format": "jpeg",
        "scope": "none",
        "generation_source": "paint",
        "generated_at": "now"
      }
    ]
  },
  "dependency": {
    "graph_present": true,
    "cycles_highlighted": true,
    "layering_violations_highlighted": true,
    "known_issues_list_maintained": true,
    "modules_total": 10,
    "modules_included": 5
  },
  "call_and_flow": {
    "call_graph_for_hot_paths_present": true,
    "sequence_diagrams_for_critical_journeys_present": true,
    "data_flow_for_pipelines_present": true
  },
  "architecture": {
    "map_present": true,
    "levels_declared": [
      "context",
      "containers",
      "components"
    ],
    "one_page_per_level": true,
    "owners_annotated": true,
    "boundaries_annotated": true,
    "adrs_live_beside_maps": true
  },
  "metrics": {
    "complexity_heatmap_present": true,
    "coverage_overlay_present": true,
    "hotspot_view_considered": true,
    "hotspot_change_frequency": 2.0,
    "hotspot_complexity": 2.0,
    "declared_hotspot_score": 99.0
  },
  "history": {
    "churn_timeline_present": true,
    "ownership_map_present": true,
    "incident_overlays_present": true
  },
  "honesty": {
    "each_diagram_labeled_scope_and_generation_source": true,
    "diagrams_labeled_generated_at_tool_scope": true,
    "generatable_diagrams_generated": true,
    "stale_diagrams_shipped_as_truth": false,
    "unlabeled_hand_drawn_maps_guiding_decisions": false
  }
}
```

Response (`response_text`):

```json
{
  "service": "codebase-visualization",
  "atom_version": "0.1.0",
  "entity": "service-beta",
  "verdict": "CODEBASE_VISUALIZATION_NOT_READY",
  "sections": {
    "diagrams_as_code": "fail",
    "dependency_views": "fail",
    "call_and_flow_views": "pass",
    "architecture_maps": "pass",
    "metrics_and_history_views": "fail",
    "honesty_and_currency": "pass"
  },
  "checks": [
    {
      "section": "diagrams_as_code",
      "check": "key_diagrams_exist_as_code_in_repo",
      "status": "pass",
      "evidence": "quality gate: key diagrams exist as code in-repo"
    },
    {
      "section": "diagrams_as_code",
      "check": "diagrams_regenerable",
      "status": "pass",
      "evidence": "quality gate: the diagrams-as-code in-repo are regenerable"
    },
    {
      "section": "diagrams_as_code",
      "check": "diagrams_versioned_and_diffable",
      "status": "pass",
      "evidence": "method step 1: diagrams-as-code are versioned and diff-able"
    },
    {
      "section": "diagrams_as_code",
      "check": "diagrams_regenerated_on_change",
      "status": "pass",
      "evidence": "method step 1: diagrams are regenerated on change"
    },
    {
      "section": "diagrams_as_code",
      "check": "diagram_entries_complete",
      "status": "pass",
      "evidence": "every diagram entry carries a name, format, scope, generation source, and generated-at label"
    },
    {
      "section": "diagrams_as_code",
      "check": "diagram_formats_use_stated_diagrams_as_code_tools",
      "status": "fail",
      "evidence": "method step 1: every declared diagram format is one of the diagrams-as-code tools the skill names — mermaid, graphviz, plantuml"
    },
    {
      "section": "dependency_views",
      "check": "dependency_graph_present",
      "status": "pass",
      "evidence": "method step 2: a module/package dependency (import) graph is present"
    },
    {
      "section": "dependency_views",
      "check": "cycles_highlighted",
      "status": "pass",
      "evidence": "quality gate: cycles are highlighted / visible in the dependency view"
    },
    {
      "section": "dependency_views",
      "check": "layering_violations_highlighted",
      "status": "pass",
      "evidence": "quality gate: layering violations are highlighted / visible in the dependency view"
    },
    {
      "section": "dependency_views",
      "check": "known_issues_list_maintained",
      "status": "pass",
      "evidence": "quality gate: a known-issues ('known bad') list is maintained"
    },
    {
      "section": "dependency_views",
      "check": "dependency_graph_covers_all_declared_modules",
      "status": "fail",
      "evidence": "method step 2: the declared modules included in the dependency graph equal the declared total modules (the graph covers the whole declared module set; no partial-coverage percentage is imposed)"
    },
    {
      "section": "call_and_flow_views",
      "check": "call_graph_for_hot_paths_present",
      "status": "pass",
      "evidence": "method step 3: call graphs for hot paths are present"
    },
    {
      "section": "call_and_flow_views",
      "check": "sequence_diagrams_for_critical_journeys_present",
      "status": "pass",
      "evidence": "method step 3: sequence diagrams for critical journeys are present"
    },
    {
      "section": "call_and_flow_views",
      "check": "data_flow_views_for_pipelines_present",
      "status": "pass",
      "evidence": "method step 3: data-flow views for pipelines are present"
    },
    {
      "section": "architecture_maps",
      "check": "architecture_map_present",
      "status": "pass",
      "evidence": "method step 4: an architecture map is present"
    },
    {
      "section": "architecture_maps",
      "check": "c4_levels_cover_stated_levels",
      "status": "pass",
      "evidence": "method step 4: the declared architecture levels cover every C4-lite level the skill names — context, containers, components"
    },
    {
      "section": "architecture_maps",
      "check": "one_page_per_level",
      "status": "pass",
      "evidence": "method step 4: the architecture map keeps one page per level"
    },
    {
      "section": "architecture_maps",
      "check": "owners_annotated",
      "status": "pass",
      "evidence": "method step 4: owners are annotated on the architecture map"
    },
    {
      "section": "architecture_maps",
      "check": "boundaries_annotated",
      "status": "pass",
      "evidence": "method step 4: boundaries are annotated on the architecture map"
    },
    {
      "section": "architecture_maps",
      "check": "adrs_live_beside_maps",
      "status": "pass",
      "evidence": "method step 4: ADRs live beside the architecture maps"
    },
    {
      "section": "metrics_and_history_views",
      "check": "complexity_heatmap_present",
      "status": "pass",
      "evidence": "method step 5: a complexity heatmap is present"
    },
    {
      "section": "metrics_and_history_views",
      "check": "coverage_overlay_present",
      "status": "pass",
      "evidence": "method step 5: a coverage overlay is present"
    },
    {
      "section": "metrics_and_history_views",
      "check": "hotspot_view_considered",
      "status": "pass",
      "evidence": "quality gate: a hotspot view (churn x complexity) is considered for refactor targets"
    },
    {
      "section": "metrics_and_history_views",
      "check": "hotspot_score_matches_change_frequency_times_complexity",
      "status": "fail",
      "evidence": "method step 5: the declared hotspot score equals the declared change frequency multiplied by the declared complexity (change-frequency x complexity; no score cutoff is judged here)"
    },
    {
      "section": "metrics_and_history_views",
      "check": "churn_timeline_present",
      "status": "pass",
      "evidence": "method step 6: a churn timeline history view is present"
    },
    {
      "section": "metrics_and_history_views",
      "check": "ownership_map_present",
      "status": "pass",
      "evidence": "method step 6: an ownership map history view is present"
    },
    {
      "section": "metrics_and_history_views",
      "check": "incident_overlays_present",
      "status": "pass",
      "evidence": "method step 6: incident overlays on history views are present"
    },
    {
      "section": "honesty_and_currency",
      "check": "each_diagram_labeled_with_scope_and_generation_source",
      "status": "pass",
      "evidence": "quality gate: each diagram is labeled with scope and generation source"
    },
    {
      "section": "honesty_and_currency",
      "check": "diagrams_labeled_generated_at_tool_and_scope",
      "status": "pass",
      "evidence": "method step 7: diagrams are labeled with generated-at, tool, and scope"
    },
    {
      "section": "honesty_and_currency",
      "check": "generatable_diagrams_generated",
      "status": "pass",
      "evidence": "method step 7: what can be generated is generated"
    },
    {
      "section": "honesty_and_currency",
      "check": "stale_diagrams_not_shipped_as_truth",
      "status": "pass",
      "evidence": "red line: no stale diagrams are shipped as truth — stale diagrams are deleted or regenerated rather than let lie"
    },
    {
      "section": "honesty_and_currency",
      "check": "unlabeled_hand_drawn_maps_not_guiding_decisions",
      "status": "pass",
      "evidence": "red line: no unlabeled hand-drawn maps guide decisions — regenerate or remove"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "diagrams_evaluated": 1,
  "computed_dependency_coverage": "0.500000",
  "dependency_coverage_difference": "-5.000000",
  "computed_hotspot_score": "4.000000",
  "hotspot_score_difference": "95.000000",
  "c4_levels_not_declared": [],
  "summary": "29 pass, 3 fail, 0 missing of 32 checks across six sections.",
  "stamp": "CODEBASE VISUALIZATION\nentity: service-beta\nVERDICT: CODEBASE_VISUALIZATION_NOT_READY\n  diagrams_as_code             fail\n  dependency_views             fail\n  call_and_flow_views          pass\n  architecture_maps            pass\n  metrics_and_history_views    fail\n  honesty_and_currency         pass\n29 pass, 3 fail, 0 missing of 32 checks across six sections."
}
```

### Example 3 — Malformed (recorded case `malformed`, HTTP 422)

Input:

```json
{
  "dependency": {
    "modules_total": "ten"
  }
}
```

Response (`response_text`):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "dependency.modules_total",
  "detail": "dependency.modules_total must be a number"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present (tutorial / how-to / reference / explanation) | Yes — all four sections above |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — see checklist note below |
| Checks named: documented vs recorded | 32 / 32 |
| Verdict vocabulary complete | Yes — all overall verdicts, section statuses, per-check statuses, and computed-field values listed |
| Input reference typed | Yes — 40 fields, each with a type |
| Worked examples verbatim-verified | Yes — full-pass / violations / malformed compared as JSON values against `evidence.json` after writing |

Regulators view decision: **N/A** — this atom audits a declared codebase-visualization artifact record; its verdict is an engineering documentation-readiness judgment, not compliance or audit evidence, and codebase visualization is not a regulated domain (finance, security, licensing, privacy).
