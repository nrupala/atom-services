# Codebase visualization — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have a codebase-visualization artifact — diagrams-as-code entries, a dependency view with module counts, call & flow views, an architecture map with declared C4 levels, metrics and history views with a declared top hotspot, and an honesty record. This atom reads one declared manifest and returns one deterministic verdict across six sections: **CODEBASE_VISUALIZATION_READY**, **CODEBASE_VISUALIZATION_NOT_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared artifact's completeness and internal consistency only — it does not render a diagram, read any actual code, or judge whether a diagram is clear or accurate. Computed checks: every declared diagram entry must be complete (non-empty `name`, `format`, `scope`, `generation_source`, `generated_at`) and every declared format must be one of the stated diagrams-as-code tools — `mermaid`, `graphviz`, `plantuml` (no minimum diagram count is imposed); the declared modules included in the dependency graph must equal the declared total modules, with a positive total (no partial-coverage percentage is accepted); the declared architecture levels must cover all three stated C4-lite levels — `context`, `containers`, `components` (extra entries do not hurt); and the declared hotspot score must equal change-frequency × complexity (no score cutoff is imposed). Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "codebase-visualization"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/codebase-visualization` — tool name `codebase_visualization`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/codebase-visualization` — body = the manifest object; same `Authorization` header.

## Input — the codebase-visualization manifest

| Field | Meaning |
|---|---|
| `entity` | entity name (string; carried into the output, not checked) |
| `diagrams_as_code.key_diagrams_exist_as_code_in_repo` / `regenerable` / `versioned_and_diffable` / `regenerated_on_change` | diagrams-as-code evidence |
| `diagrams_as_code.diagrams` (list of diagram entries) | computed: every entry needs non-empty `name`, `format`, `scope`, `generation_source` and `generated_at` strings (a label, never parsed as a date); every `format` must be one of `mermaid`, `graphviz`, `plantuml`; reported as `diagrams_evaluated` (count of complete entries). Absent / not a list / empty = both computed diagram checks missing; an incomplete entry makes both missing |
| `dependency.graph_present` / `cycles_highlighted` / `layering_violations_highlighted` / `known_issues_list_maintained` | dependency-view evidence |
| `dependency.modules_total` (number), `dependency.modules_included` (number) | computed: included must equal total (total must be positive); reported as `computed_dependency_coverage` and `dependency_coverage_difference` (6 decimal places) |
| `call_and_flow.call_graph_for_hot_paths_present` / `sequence_diagrams_for_critical_journeys_present` / `data_flow_for_pipelines_present` | call & flow view evidence |
| `architecture.map_present` | architecture map evidence |
| `architecture.levels_declared` (list of strings) | computed: must contain all three stated C4 levels — `context`, `containers`, `components`; omitted stated entries reported as `c4_levels_not_declared` (null when no list is declared). An empty list is present and fails |
| `architecture.one_page_per_level` / `owners_annotated` / `boundaries_annotated` / `adrs_live_beside_maps` | architecture map evidence |
| `metrics.complexity_heatmap_present` / `coverage_overlay_present` / `hotspot_view_considered` | metrics view evidence |
| `metrics.hotspot_change_frequency` (number), `metrics.hotspot_complexity` (number), `metrics.declared_hotspot_score` (number) | computed: declared score must equal change frequency × complexity; reported as `computed_hotspot_score` and `hotspot_score_difference` (6 decimal places) |
| `history.churn_timeline_present` / `ownership_map_present` / `incident_overlays_present` | history view evidence |
| `honesty.each_diagram_labeled_scope_and_generation_source` / `diagrams_labeled_generated_at_tool_scope` / `generatable_diagrams_generated` | honesty and currency evidence |
| `honesty.stale_diagrams_shipped_as_truth` | must be `false` to pass |
| `honesty.unlabeled_hand_drawn_maps_guiding_decisions` | must be `false` to pass |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward CODEBASE_VISUALIZATION_NOT_READY).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/codebase-visualization`:

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

Response — HTTP 200 (trimmed; the full response carries all 32 checks and a text stamp of the verdict):

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
  "computed_status": "within_stated_limits_on_declared_evidence",
  "diagrams_evaluated": 1,
  "computed_dependency_coverage": "1.000000",
  "dependency_coverage_difference": "0.000000",
  "computed_hotspot_score": "10.000000",
  "hotspot_score_difference": "0.000000",
  "c4_levels_not_declared": [],
  "summary": "32 pass, 0 fail, 0 missing of 32 checks across six sections."
}
```

## Verdicts

- **CODEBASE_VISUALIZATION_READY** — every check passes; the visualization artifact is complete and internally consistent on the declared evidence.
- **CODEBASE_VISUALIZATION_NOT_READY** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `diagrams_evaluated` (count of complete diagram entries), `computed_dependency_coverage` and `dependency_coverage_difference`, `computed_hotspot_score` and `hotspot_score_difference` (computed amounts as strings with exactly six decimals, or null when they cannot be computed), `c4_levels_not_declared` (omitted stated C4 levels, or null when no list is declared) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
