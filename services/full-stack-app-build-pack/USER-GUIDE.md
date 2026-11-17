# Full stack app build pack — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You build a web app the way someone who will maintain it for years would — clear contracts, small correct slices, boring reliability over clever tricks — and you have a record of how that build was done. This atom reads one declared manifest and returns one deterministic verdict across six sections: **FULL_STACK_BUILD_SOUND**, **FULL_STACK_BUILD_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared record's completeness and consistency only — it builds no app, runs no code, inspects no repository, renders no page, and does not verify that a declared control actually works. A build is sound *on your declared evidence*: it never judges whether the chosen contract is the right contract commercially, whether a declared slice really exercises the store, whether authorization is correctly scoped, or whether the real code is actually readable. Computed checks: the declared `slices` list must be present and non-empty, and every declared slice row must declare `end_to_end_complete: true`. Two check groups are conditional: client-side encryption and user-held keys are required only when `security.zero_knowledge_required` is declared `true`, otherwise they pass as not applicable; and the named-bridge declaration is required only when `deploy.direct_to_production_used` is declared `true`, otherwise it passes as not applicable. The skill's one numeric requirement — touch targets of at least 44px — is carried as a caller attestation (`touch_targets_at_least_44px`), not a measurement: the atom reads no layout. No other numeric threshold is imposed — no test-coverage percentage, no contrast ratio, no dependency-tree size or dependency count, no latency or performance budget, no health-check interval, no secret-rotation period, and no coverage percentage below completeness. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "full-stack-app-build-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/full-stack-app-build-pack` — tool name `full_stack_app_build_pack`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/full-stack-app-build-pack` — body = the manifest object; same `Authorization` header.

## Input — the full-stack-app-build-pack manifest

| Field | Meaning |
|---|---|
| `project` | project name (string; carried into the output, not checked) |
| `approach.problem_and_data_flow_understood` | approach evidence: the problem and the data flow are understood before writing code |
| `approach.user_visible_outcome_defined` | approach evidence: the user-visible outcome is defined |
| `approach.source_of_truth_identified` | approach evidence: the source of truth is identified |
| `approach.contract_defined_first` | approach evidence: the API/interface contract is defined first; both ends code to the contract |
| `approach.data_shape_defined_first` | approach evidence: the data shape is defined first |
| `approach.vertical_slice_before_widening` | approach evidence: one end-to-end path is shipped before widening |
| `slices` (list of slice-row objects) | computed: must be present and non-empty; reported as `slices_count` |
| `slices[].name` (string) | names the row in the computed outputs |
| `slices[].end_to_end_complete` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `slices_not_end_to_end` (a row with the field absent is missing evidence and does not appear) |
| `frontend.vanilla_ts_web_components_used` | frontend evidence: vanilla TypeScript + Web Components are used |
| `frontend.progressive_enhancement_applied` | frontend evidence: progressive enhancement is applied |
| `frontend.dependency_tree_kept_small` | frontend evidence: the dependency tree is kept small |
| `frontend.mobile_first_responsive` | frontend evidence: the layout is mobile-first / responsive |
| `frontend.viewport_configured` | frontend evidence: a proper viewport is configured |
| `frontend.touch_targets_at_least_44px` | frontend evidence: touch targets are at least 44px (caller attestation of the skill's stated ≥44px requirement; the atom measures no layout) |
| `frontend.semantic_html_used` | frontend evidence: semantic HTML is used |
| `frontend.keyboard_navigation_supported` | frontend evidence: keyboard navigation is supported |
| `frontend.aria_only_where_needed` | frontend evidence: ARIA is used only where needed |
| `frontend.sufficient_contrast` | frontend evidence: contrast is sufficient |
| `frontend.boundaries_typed_no_any` | frontend evidence: the boundaries are typed — `any` is never used through |
| `frontend.undefined_fields_guarded_when_rendering` | frontend evidence: rendering guards against undefined fields |
| `frontend.framework_bloat_present` | must be `false` to pass (anti-pattern: no framework bloat) |
| `backend.api_contracts_versioned` | backend evidence: API contracts are clear and versioned |
| `backend.input_validated_at_boundary` | backend evidence: every input is validated at the boundary |
| `backend.handlers_stateless` | backend evidence: handlers are stateless |
| `backend.idempotency_for_retried_writes` | backend evidence: writes that can be retried carry explicit idempotency |
| `backend.error_taxonomy_defined` | backend evidence: a real error taxonomy is defined |
| `backend.structured_error_responses` | backend evidence: error responses are structured |
| `backend.bare_500_responses_present` | must be `false` to pass (rule: no bare 500 responses) |
| `backend.health_endpoint_present` | backend evidence: a health endpoint is present on every service |
| `data.schema_is_source_of_truth` | data evidence: the schema is the source of truth |
| `data.migrations_forward_only` | data evidence: migrations are forward-only |
| `data.migrations_backward_compatible` | data evidence: migrations are backward-compatible |
| `data.parametrized_queries_only` | data evidence: parametrized queries only |
| `data.string_concatenated_sql_present` | must be `false` to pass (rule: SQL is never built by string concatenation) |
| `security.authn_authz_separated` | security evidence: AuthN and authZ are separate concerns |
| `security.least_privilege_enforced` | security evidence: least privilege is enforced |
| `security.secrets_via_env_or_secret_store` | security evidence: secrets come via environment / secret store |
| `security.secrets_rotatable` | security evidence: secrets are rotate-able |
| `security.secrets_in_repo_present` | must be `false` to pass (anti-pattern: no secrets in the repo) |
| `security.owasp_top10_reviewed` | security evidence: the OWASP Top 10 is reviewed |
| `security.zero_knowledge_required` | gate: declares whether the product calls for a zero-knowledge posture |
| `security.client_side_encryption_applied` | required `true` only when `security.zero_knowledge_required` is `true`; otherwise passes as not applicable |
| `security.user_held_keys` | required `true` only when `security.zero_knowledge_required` is `true`; otherwise passes as not applicable |
| `testing.unit_tests_for_logic` | testing evidence: logic is unit-tested |
| `testing.integration_tests_for_boundaries` | testing evidence: boundaries are integration-tested |
| `testing.e2e_critical_path_tested` | testing evidence: the critical path is tested end-to-end |
| `testing.tests_target_contract_not_implementation` | testing evidence: tests target the contract, not the implementation |
| `testing.tests_deferred_present` | must be `false` to pass (anti-pattern: tests are not deferred) |
| `testing.observability_in_place` | testing evidence: the build is observable |
| `testing.graceful_degradation` | testing evidence: the build degrades gracefully |
| `testing.stranger_readable_code` | testing evidence: a stranger could read the code |
| `deploy.docker_used_present` | must be `false` to pass (rule: no Docker) |
| `deploy.uses_direct_or_platform_native_deploy` | deploy evidence: the deploy method is direct or platform-native |
| `deploy.staging_deployed_first` | deploy evidence: staging is deployed first |
| `deploy.direct_to_production_used` | gate: declares whether direct-to-production deploy is used |
| `deploy.direct_to_prod_named_bridge_with_end_date` | required `true` only when `deploy.direct_to_production_used` is `true`; otherwise passes as not applicable |
| `deploy.github_repo_in_sync_with_deployed` | deploy evidence: the GitHub repo is kept in sync with what is actually deployed |
| `deploy.big_bang_release_present` | must be `false` to pass (anti-pattern: no big-bang releases) |
| `deploy.premature_optimization_present` | must be `false` to pass (anti-pattern: no optimizing before measuring) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward FULL_STACK_BUILD_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/full-stack-app-build-pack`:

```json
{
  "project": "test-project",
  "approach": {
    "problem_and_data_flow_understood": true,
    "user_visible_outcome_defined": true,
    "source_of_truth_identified": true,
    "contract_defined_first": true,
    "data_shape_defined_first": true,
    "vertical_slice_before_widening": true
  },
  "slices": [
    {
      "name": "slice-1",
      "end_to_end_complete": true
    }
  ],
  "frontend": {
    "vanilla_ts_web_components_used": true,
    "progressive_enhancement_applied": true,
    "dependency_tree_kept_small": true,
    "mobile_first_responsive": true,
    "viewport_configured": true,
    "touch_targets_at_least_44px": true,
    "semantic_html_used": true,
    "keyboard_navigation_supported": true,
    "aria_only_where_needed": true,
    "sufficient_contrast": true,
    "boundaries_typed_no_any": true,
    "undefined_fields_guarded_when_rendering": true,
    "framework_bloat_present": false
  },
  "backend": {
    "api_contracts_versioned": true,
    "input_validated_at_boundary": true,
    "handlers_stateless": true,
    "idempotency_for_retried_writes": true,
    "error_taxonomy_defined": true,
    "structured_error_responses": true,
    "bare_500_responses_present": false,
    "health_endpoint_present": true
  },
  "data": {
    "schema_is_source_of_truth": true,
    "migrations_forward_only": true,
    "migrations_backward_compatible": true,
    "parametrized_queries_only": true,
    "string_concatenated_sql_present": false
  },
  "security": {
    "authn_authz_separated": true,
    "least_privilege_enforced": true,
    "secrets_via_env_or_secret_store": true,
    "secrets_rotatable": true,
    "secrets_in_repo_present": false,
    "owasp_top10_reviewed": true,
    "zero_knowledge_required": false
  },
  "testing": {
    "unit_tests_for_logic": true,
    "integration_tests_for_boundaries": true,
    "e2e_critical_path_tested": true,
    "tests_target_contract_not_implementation": true,
    "tests_deferred_present": false,
    "observability_in_place": true,
    "graceful_degradation": true,
    "stranger_readable_code": true
  },
  "deploy": {
    "docker_used_present": false,
    "uses_direct_or_platform_native_deploy": true,
    "staging_deployed_first": true,
    "direct_to_production_used": false,
    "github_repo_in_sync_with_deployed": true,
    "big_bang_release_present": false,
    "premature_optimization_present": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 57 checks and a text stamp of the verdict):

```json
{
  "service": "full-stack-app-build-pack",
  "atom_version": "0.1.0",
  "project": "test-project",
  "verdict": "FULL_STACK_BUILD_SOUND",
  "sections": {
    "approach_and_contracts": "pass",
    "frontend": "pass",
    "backend_and_data": "pass",
    "security": "pass",
    "testing_and_quality": "pass",
    "deploy_and_delivery": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "slices_count": 1,
  "slices_not_end_to_end": [],
  "slice_end_to_end_coverage": "1.000000",
  "summary": "57 pass, 0 fail, 0 missing of 57 checks across six sections."
}
```

## Verdicts

- **FULL_STACK_BUILD_SOUND** — every check passes; the declared full-stack build record is complete and consistent with the skill's checklist and anti-patterns.
- **FULL_STACK_BUILD_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `slices_count` (the declared list length as an integer, or null when the list is not declared), the row-name list `slices_not_end_to_end` (slice rows whose `end_to_end_complete` field is present but not `true`; a slice row with the field absent is missing evidence and does not appear; null when the `slices` list is not declared), the coverage value `slice_end_to_end_coverage` (end-to-end slices ÷ declared slices, as a string with exactly six decimal places; null when the declared list is absent or empty), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when either of the two primary computed checks — `slices_declared` and `every_slice_end_to_end` — cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
