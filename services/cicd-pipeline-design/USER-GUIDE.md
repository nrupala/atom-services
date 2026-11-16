# CI/CD pipeline design — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have a CI/CD pipeline artifact — its declared stage list with per-stage minutes and a declared total, its determinism and pinning record, its caching and secrets record, its minutes budget record, its provenance record, and its deploy and gate record. This atom reads one declared manifest and returns one deterministic verdict across six sections: **CICD_PIPELINE_READY**, **CICD_PIPELINE_NOT_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared artifact's completeness and internal consistency only — it does not design a pipeline, write workflow files, run the pipeline, or verify that a declared value is true. Computed checks: every stage entry must carry a non-empty name and numeric minutes; the declared stage names must equal the skill's stated sequence exactly — lint → typecheck → test → build → package_sign (the manifest spelling of "package/sign") → publish, cheapest first; the declared total minutes must equal the sum of the per-stage minutes; the declared monthly minutes must equal estimated minutes per run × runs per month; and the re-derived monthly minutes must not exceed the monthly minutes budget you yourself declare (no budget is imposed — the skill states no number, so only your own declared budget is compared). Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "cicd-pipeline-design"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/cicd-pipeline-design` — tool name `cicd_pipeline_design`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/cicd-pipeline-design` — body = the manifest object; same `Authorization` header.

## Input — the cicd-pipeline-design manifest

| Field | Meaning |
|---|---|
| `entity` | entity name (string; carried into the output, not checked) |
| `pipeline.stages` (list of stage entries) | computed: each entry needs a non-empty `name` (string) and numeric `minutes`; the declared names must equal the stated sequence lint → typecheck → test → build → package_sign → publish exactly, in that order; reported as `stages_evaluated` and `stated_stages_not_declared` |
| `pipeline.declared_total_minutes` (number) | computed: must equal the sum of the per-stage `minutes`; reported as `computed_total_minutes` and `total_minutes_difference` (6 decimal places) |
| `pipeline.fails_fast` / `reports_first_real_cause` / `is_primary_green_gate` | fail-fast and primary-gate evidence |
| `determinism.lockfile_enforced_installs` / `tool_versions_pinned` / `byte_exact_checkouts_where_hashes_matter` / `same_commit_same_artifact_verified` / `third_party_actions_pinned` | determinism and pinning evidence |
| `determinism.unpinned_third_party_actions_present` | must be `false` to pass |
| `caching.dependency_cache_keyed_on_lockfile` / `build_cache_keyed_on_lockfile` | cache keying evidence |
| `caching.secrets_cached` / `test_fixtures_cached` | must be `false` to pass |
| `secrets.from_secret_store_only` / `masked_in_logs` / `error_output_scrubbed` | secret-handling evidence |
| `secrets.in_artifacts` / `appeared_in_logs_or_artifacts` | must be `false` to pass |
| `budget.estimated_minutes_per_run` (number), `budget.runs_per_month` (number), `budget.declared_monthly_minutes` (number) | computed: declared monthly minutes must equal estimated minutes per run × runs per month; reported as `computed_monthly_minutes` and `monthly_minutes_difference` (6 decimal places) |
| `budget.monthly_minutes_budget` (number) | computed: the re-derived monthly minutes must not exceed this budget you declare; reported as `budget_headroom_minutes` (6 decimal places) |
| `budget.workflows_minimal_where_constrained` / `heavy_builds_on_owned_hardware` | budget-awareness evidence |
| `budget.duplicates_primary_gate` | must be `false` to pass |
| `provenance.checksums_published` / `releases_signed` / `build_outputs_retained` / `manifest_hashes_retained` / `release_artifacts_carry_hash_and_signature` | provenance and signing evidence |
| `deploys.hitl_approval_required` / `rollback_path_present` | deploy evidence |
| `deploys.direct_to_prod_from_laptop` | must be `false` to pass |
| `gates.disabled_to_unblock_merge` | must be `false` to pass |
| `gates.overrides_logged_with_reason` | gate-override evidence |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward CICD_PIPELINE_NOT_READY).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/cicd-pipeline-design`:

```json
{
  "entity": "service-alpha",
  "pipeline": {
    "stages": [
      {
        "name": "lint",
        "minutes": 1.0
      },
      {
        "name": "typecheck",
        "minutes": 2.0
      },
      {
        "name": "test",
        "minutes": 5.0
      },
      {
        "name": "build",
        "minutes": 3.0
      },
      {
        "name": "package_sign",
        "minutes": 1.0
      },
      {
        "name": "publish",
        "minutes": 1.0
      }
    ],
    "declared_total_minutes": 13.0,
    "fails_fast": true,
    "reports_first_real_cause": true,
    "is_primary_green_gate": true
  },
  "determinism": {
    "lockfile_enforced_installs": true,
    "tool_versions_pinned": true,
    "byte_exact_checkouts_where_hashes_matter": true,
    "same_commit_same_artifact_verified": true,
    "third_party_actions_pinned": true,
    "unpinned_third_party_actions_present": false
  },
  "caching": {
    "dependency_cache_keyed_on_lockfile": true,
    "build_cache_keyed_on_lockfile": true,
    "secrets_cached": false,
    "test_fixtures_cached": false
  },
  "secrets": {
    "from_secret_store_only": true,
    "masked_in_logs": true,
    "in_artifacts": false,
    "error_output_scrubbed": true,
    "appeared_in_logs_or_artifacts": false
  },
  "budget": {
    "estimated_minutes_per_run": 13.0,
    "runs_per_month": 100,
    "declared_monthly_minutes": 1300.0,
    "monthly_minutes_budget": 2000.0,
    "workflows_minimal_where_constrained": true,
    "heavy_builds_on_owned_hardware": true,
    "duplicates_primary_gate": false
  },
  "provenance": {
    "checksums_published": true,
    "releases_signed": true,
    "build_outputs_retained": true,
    "manifest_hashes_retained": true,
    "release_artifacts_carry_hash_and_signature": true
  },
  "deploys": {
    "hitl_approval_required": true,
    "rollback_path_present": true,
    "direct_to_prod_from_laptop": false
  },
  "gates": {
    "disabled_to_unblock_merge": false,
    "overrides_logged_with_reason": true
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 36 checks and a text stamp of the verdict):

```json
{
  "service": "cicd-pipeline-design",
  "atom_version": "0.1.0",
  "entity": "service-alpha",
  "verdict": "CICD_PIPELINE_READY",
  "sections": {
    "stages_and_fail_fast": "pass",
    "determinism_and_pinning": "pass",
    "caching_and_secrets": "pass",
    "budget_awareness": "pass",
    "provenance_and_signing": "pass",
    "deploys_and_gates": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "stages_evaluated": 6,
  "computed_total_minutes": "13.000000",
  "total_minutes_difference": "0.000000",
  "stated_stages_not_declared": [],
  "computed_monthly_minutes": "1300.000000",
  "monthly_minutes_difference": "0.000000",
  "budget_headroom_minutes": "700.000000",
  "summary": "36 pass, 0 fail, 0 missing of 36 checks across six sections."
}
```

## Verdicts

- **CICD_PIPELINE_READY** — every check passes; the pipeline artifact is complete and internally consistent on the declared evidence.
- **CICD_PIPELINE_NOT_READY** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `stages_evaluated` (count of complete stage entries), `computed_total_minutes` and `total_minutes_difference`, `stated_stages_not_declared` (stated stages absent from the declared names, or null when no stage list is declared or an entry carries no usable name), `computed_monthly_minutes` and `monthly_minutes_difference`, `budget_headroom_minutes` (computed amounts as strings with exactly six decimals, or null when they cannot be computed) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
