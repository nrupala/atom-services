# Framework adoption adr — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are taking on a framework for a project and you have a record of that adoption decision. This atom reads one declared framework-adoption ADR manifest and returns one deterministic verdict across five sections: **FRAMEWORK_ADOPTION_SOUND**, **FRAMEWORK_ADOPTION_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared record's completeness and consistency only — it writes no ADR, chooses no framework, inspects no codebase for framework imports, reads no lockfile, and does not verify that a declared control actually works. An adoption is sound *on your declared evidence*: it never judges whether the selected framework is the right choice commercially, whether a declared fit assessment was well made, whether the real core is truly framework-free, or whether a declared exit cost is realistic. Computed checks: the declared `candidates` list must be present and non-empty; every candidate row must name a non-empty `name`; every candidate row must declare all five fit criteria assessed (team familiarity, maintenance health, ecosystem, performance, exit cost); exactly one candidate row may declare `selected` true; and, when plugins are declared present, the declared `plugins.items` list must be present and non-empty with every row declaring `reviewed` and `pinned` true. Three check groups are conditional: the migration-plan checks are required only when `house_stack.is_mid_project_change` is declared `true`; the major-upgrade written-plan and full-suite checks are required only when `versions.major_upgrade_planned` is declared `true`; and the plugin-row and unused-plugins checks are required only when `plugins.plugins_present` is declared `true` — otherwise they pass as not applicable. No numeric threshold is imposed — no exit-cost amount or ceiling, no fit score or weighting, no maintenance-health metric, no candidate-count range (this atom states no 2–3-alternatives rule; completeness and exactly-one-selected are the only bars on the candidate rows), no upgrade cadence or batch size, and no deprecation-migration window. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "framework-adoption-adr"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/framework-adoption-adr` — tool name `framework_adoption_adr`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/framework-adoption-adr` — body = the manifest object; same `Authorization` header.

## Input — the framework-adoption-adr manifest

| Field | Meaning |
|---|---|
| `project` | project name (string; carried into the output, not checked) |
| `framework` | framework being adopted (string; carried into the output, not checked) |
| `adr.logged` | ADR evidence: the new framework has a logged ADR |
| `adr.alternatives_stated` | ADR evidence: the adoption ADR states the alternatives considered |
| `adr.exit_cost_stated` | ADR evidence: the adoption ADR states the exit cost of taking on this framework |
| `candidates` (list of candidate-row objects) | computed: must be present and non-empty; reported as `candidates_count` |
| `candidates[].name` (string) | computed: every row must name a non-empty string; rows that do not are reported in `candidates_without_name` (a row with the field absent is missing evidence) |
| `candidates[].team_familiarity_assessed` | fit criterion: team familiarity was assessed for this candidate |
| `candidates[].maintenance_health_assessed` | fit criterion: maintenance health was assessed for this candidate |
| `candidates[].ecosystem_assessed` | fit criterion: ecosystem was assessed for this candidate |
| `candidates[].performance_assessed` | fit criterion: performance was assessed for this candidate |
| `candidates[].exit_cost_assessed` | fit criterion: exit cost was assessed for this candidate |
| `candidates[].selected` | computed gate: exactly one row in the list may be `true` for the selection check to pass (a row with the field absent is missing evidence) |
| `house_stack.one_framework_per_layer` | house-stack evidence: one framework per layer |
| `house_stack.core_logic_imports_no_framework_code` | house-stack evidence: core logic imports no framework code (framework-free core) |
| `house_stack.framework_at_edges_ports_adapters` | house-stack evidence: the framework sits at the edges (ports & adapters) |
| `house_stack.is_mid_project_change` | gate: declares whether the adoption is a mid-project change |
| `house_stack.migration_plan_documented` | required `true` only when `house_stack.is_mid_project_change` is `true`; otherwise passes as not applicable |
| `house_stack.migration_plan_approved` | required `true` only when `house_stack.is_mid_project_change` is `true` (red line); otherwise passes as not applicable |
| `versions.exact_versions_pinned` | pinning evidence: versions are pinned exactly |
| `versions.unpinned_latest_in_production_present` | must be `false` to pass (red line: no unpinned "latest" in production) |
| `versions.changelogs_read` | pinning evidence: changelogs are read before upgrades |
| `versions.updates_batched` | pinning evidence: updates are batched |
| `versions.major_upgrade_planned` | gate: declares whether a major upgrade is planned |
| `versions.major_upgrade_written_plan` | required `true` only when `versions.major_upgrade_planned` is `true`; otherwise passes as not applicable |
| `versions.major_upgrade_full_suite_run` | required `true` only when `versions.major_upgrade_planned` is `true`; otherwise passes as not applicable |
| `runtime.explicit_configuration_preferred` | runtime evidence: explicit configuration is preferred |
| `runtime.runtime_behaviour_understood` | runtime evidence: what the framework does at runtime is understood |
| `runtime.lifecycle_understood` | runtime evidence: the framework lifecycle is understood |
| `runtime.dependency_injection_understood` | runtime evidence: the framework's dependency injection is understood |
| `runtime.caching_behaviour_understood` | runtime evidence: the framework's caching behaviour is understood |
| `runtime.deprecated_apis_on_hot_path_present` | must be `false` to pass (quality gate: no deprecated APIs on the hot path) |
| `plugins.plugins_present` | gate: declares whether plugins are present |
| `plugins.plugins_treated_as_dependencies` | plugin evidence: plugins are treated as dependencies |
| `plugins.unused_plugins_removed` | required `true` only when `plugins.plugins_present` is `true`; otherwise passes as not applicable |
| `plugins.items` (list of plugin-row objects) | computed when plugins are declared present: must be present and non-empty; reported as `plugins_count` |
| `plugins.items[].name` (string) | names the row in the computed outputs |
| `plugins.items[].reviewed` | computed: every plugin row must declare `true` when plugins are present (a row with the field absent is missing evidence) |
| `plugins.items[].pinned` | computed: every plugin row must declare `true` when plugins are present (a row with the field absent is missing evidence) |
| `deprecations.warnings_tracked` | deprecation evidence: deprecation warnings are tracked |
| `deprecations.migrations_scheduled` | deprecation evidence: deprecation migrations happen on schedule |
| `deprecations.zombie_code_paths_present` | must be `false` to pass (no zombie code paths) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward FRAMEWORK_ADOPTION_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/framework-adoption-adr`:

```json
{
  "project": "Alpha",
  "framework": "React",
  "adr": {
    "logged": true,
    "alternatives_stated": true,
    "exit_cost_stated": true
  },
  "candidates": [
    {
      "name": "React",
      "team_familiarity_assessed": true,
      "maintenance_health_assessed": true,
      "ecosystem_assessed": true,
      "performance_assessed": true,
      "exit_cost_assessed": true,
      "selected": true
    }
  ],
  "house_stack": {
    "one_framework_per_layer": true,
    "core_logic_imports_no_framework_code": true,
    "framework_at_edges_ports_adapters": true,
    "is_mid_project_change": false
  },
  "versions": {
    "exact_versions_pinned": true,
    "unpinned_latest_in_production_present": false,
    "changelogs_read": true,
    "updates_batched": true,
    "major_upgrade_planned": false
  },
  "runtime": {
    "explicit_configuration_preferred": true,
    "runtime_behaviour_understood": true,
    "lifecycle_understood": true,
    "dependency_injection_understood": true,
    "caching_behaviour_understood": true,
    "deprecated_apis_on_hot_path_present": false
  },
  "plugins": {
    "plugins_present": false,
    "plugins_treated_as_dependencies": true
  },
  "deprecations": {
    "warnings_tracked": true,
    "migrations_scheduled": true,
    "zombie_code_paths_present": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 30 checks and a text stamp of the verdict):

```json
{
  "service": "framework-adoption-adr",
  "atom_version": "0.1.0",
  "project": "Alpha",
  "framework": "React",
  "verdict": "FRAMEWORK_ADOPTION_SOUND",
  "sections": {
    "adr_and_fit": "pass",
    "house_stack_and_core": "pass",
    "pinning_and_upgrades": "pass",
    "explicitness_and_runtime": "pass",
    "plugins_and_deprecations": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "candidates_count": 1,
  "candidates_without_name": [],
  "candidates_without_fit_assessment": [],
  "fit_assessment_coverage": "1.000000",
  "selected_count": 1,
  "selected_candidate": "React",
  "plugins_count": null,
  "plugins_without_review_or_pin": null,
  "plugin_compliance_coverage": null,
  "summary": "30 pass, 0 fail, 0 missing of 30 checks across five sections."
}
```

## Verdicts

- **FRAMEWORK_ADOPTION_SOUND** — every check passes; the declared framework-adoption record is complete and consistent with the skill's checklist and red lines.
- **FRAMEWORK_ADOPTION_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `candidates_count` and `plugins_count` (the declared list lengths as integers, or null when a list is not declared), `selected_count` (declared selected candidate rows, or null when the `candidates` list is not declared), `selected_candidate` (the sole selected candidate's name, or null when there is not exactly one selected row with a non-empty name), the row-name lists `candidates_without_name`, `candidates_without_fit_assessment` (rows with at least one fit field present but not all five assessed; a row with no fit field present is missing evidence and does not appear) and `plugins_without_review_or_pin` (plugin rows with `reviewed` or `pinned` present but not both true; a row with both absent is missing evidence and does not appear) — each null when its list is not declared — the coverage values `fit_assessment_coverage` and `plugin_compliance_coverage` (ratios as strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the five primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
