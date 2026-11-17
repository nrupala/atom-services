# Full stack app build pack — documentation

**Full stack app build pack** · slug `full-stack-app-build-pack` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

Discrepancy note: SERVICE.md and contract.yaml still carry the status `built-locally` ("no endpoint is live"), but the recorded verification battery was executed against the live gateway (v1.1.0) and this document follows the recorded responses: the atom is documented as live — release candidate, as in the header above. One further wording difference: SERVICE.md introduces the conditional checks as "three check groups", then enumerates two gates — the zero-knowledge gate (covering two checks) and the direct-to-production gate (covering one check). The recording shows three conditional *checks* across those two gates, and this document describes them that way.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `project` "test-project"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "full-stack-app-build-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the full-stack build manifest.** You declare a record of a build already done — the atom audits the record, it does not do the building (see Explanation). The recorded full-pass manifest declares the project `test-project`: the problem and data flow understood, the user-visible outcome defined, the source of truth identified, the contract and the data shape defined first, and one end-to-end path shipped before widening; one slice, `slice-1`, declared end-to-end complete. It declares the frontend on vanilla TypeScript + Web Components with progressive enhancement, a small dependency tree, mobile-first responsive layout, a configured viewport, touch targets of at least 44px (a caller attestation — the atom measures no layout), semantic HTML, keyboard navigation, ARIA only where needed, sufficient contrast, typed boundaries with no `any`, and rendering guarded against undefined fields, with no framework bloat (`framework_bloat_present: false`). It declares versioned API contracts, input validated at the boundary, stateless handlers, idempotency for retried writes, a defined error taxonomy with structured error responses, no bare 500 responses (`bare_500_responses_present: false`), and a health endpoint; the schema as source of truth, forward-only backward-compatible migrations, parametrized queries only, and no string-concatenated SQL (`string_concatenated_sql_present: false`). It declares AuthN/AuthZ separated, least privilege enforced, secrets via environment / secret store and rotate-able, no secrets in the repo (`secrets_in_repo_present: false`), and the OWASP Top 10 reviewed, with no zero-knowledge posture required (`zero_knowledge_required: false`, so the two zero-knowledge checks pass as not applicable — the manifest omits those two fields entirely). It declares unit, integration and end-to-end tests targeting the contract, no deferred tests (`tests_deferred_present: false`), observability, graceful degradation and stranger-readable code; and no Docker (`docker_used_present: false`), a direct or platform-native deploy, staging deployed first, no direct-to-production deploy (`direct_to_production_used: false`, so the named-bridge check passes as not applicable — the manifest omits that field entirely), the GitHub repo in sync with what is deployed, and no big-bang release or premature optimization (`big_bang_release_present: false`, `premature_optimization_present: false`).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/full-stack-app-build-pack` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `FULL_STACK_BUILD_SOUND`: "57 pass, 0 fail, 0 missing of 57 checks across six sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `slices_count` is 1, `slices_not_end_to_end` is `[]`, and `slice_end_to_end_coverage` is `"1.000000"`.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `FULL_STACK_BUILD_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "full-stack-app-build-pack"}`.
3. Call: `POST https://atoms.pipavia.com/v1/full-stack-app-build-pack` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/full-stack-app-build-pack` with the `Authorization: Bearer <key>` header — the whole MCP surface on this gateway is key-gated, including `initialize` and `tools/list`.
2. Call `tools/call` with tool name `full_stack_app_build_pack`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `FULL_STACK_BUILD_NOT_SOUND` means at least one check has status `fail`: a field is present but false/invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 8 checks fail: `no_framework_bloat`, `no_bare_500_responses`, `no_string_concatenated_sql`, `no_secrets_in_repo`, `no_tests_deferred`, `no_docker_used`, `no_big_bang_release`, `no_premature_optimization`, and the summary reads "49 pass, 8 fail, 0 missing of 57 checks across six sections." The eight failures are exactly the eight must-be-false anti-pattern fields planted `true` in that manifest (`frontend.framework_bloat_present`, `backend.bare_500_responses_present`, `data.string_concatenated_sql_present`, `security.secrets_in_repo_present`, `testing.tests_deferred_present`, `deploy.docker_used_present`, `deploy.big_bang_release_present`, `deploy.premature_optimization_present`); the sections `frontend`, `backend_and_data`, `security`, `testing_and_quality` and `deploy_and_delivery` report `fail`, while `approach_and_contracts` still reports `pass`.

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — for the computed slice checks, the computed outputs name the offending rows (rows whose `end_to_end_complete` is present but not `true` are named in `slices_not_end_to_end`). In the recorded violations run the slices are unchanged from full-pass, so `slices_count` stays 1, `slices_not_end_to_end` stays `[]` and `slice_end_to_end_coverage` stays `"1.000000"` — no row is named, because no slice row offends; the fix list is the eight failing anti-pattern checks themselves, corrected by declaring each planted field `false` again. Note that `computed_status` also stays `within_stated_limits_on_declared_evidence` in the violations run: it derives only from the two slice checks (`slices_declared` and `every_slice_end_to_end`), which still pass while the planted anti-pattern checks fail — a failing verdict with a within-limits `computed_status` is the recorded, correct behaviour, not a contradiction (see Verdict vocabulary). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where a number, list, object or boolean is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "slices",
  "detail": "slices must be a list"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/full-stack-app-build-pack` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/full-stack-app-build-pack` — tool name `full_stack_app_build_pack`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `full_stack_app_build_pack` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `FULL_STACK_BUILD_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below exactly as SERVICE.md groups them — by the section that reads them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `project` | string | Carried into the verdict output, not itself checked |

#### Read by: approach_and_contracts

| Field | Type | Notes |
|---|---|---|
| `approach` | object | The approach section object — a present non-object value is rejected before evaluation |
| `approach.problem_and_data_flow_understood` | boolean | — |
| `approach.user_visible_outcome_defined` | boolean | — |
| `approach.source_of_truth_identified` | boolean | — |
| `approach.contract_defined_first` | boolean | — |
| `approach.data_shape_defined_first` | boolean | — |
| `approach.vertical_slice_before_widening` | boolean | — |
| `slices` | list | list of slice-row objects, each with the entry fields below; computed, see below |
| `slices[]` | object | One declared slice row — a present non-object entry is rejected before evaluation |
| `slices[].name` | string | Names the row in the computed outputs |
| `slices[].end_to_end_complete` | boolean | — |

#### Read by: frontend

| Field | Type | Notes |
|---|---|---|
| `frontend` | object | The frontend section object — a present non-object value is rejected before evaluation |
| `frontend.vanilla_ts_web_components_used` | boolean | — |
| `frontend.progressive_enhancement_applied` | boolean | — |
| `frontend.dependency_tree_kept_small` | boolean | — |
| `frontend.mobile_first_responsive` | boolean | — |
| `frontend.viewport_configured` | boolean | — |
| `frontend.touch_targets_at_least_44px` | boolean | caller attestation of the skill's stated ≥44px requirement; the atom measures no layout |
| `frontend.semantic_html_used` | boolean | — |
| `frontend.keyboard_navigation_supported` | boolean | — |
| `frontend.aria_only_where_needed` | boolean | — |
| `frontend.sufficient_contrast` | boolean | — |
| `frontend.boundaries_typed_no_any` | boolean | — |
| `frontend.undefined_fields_guarded_when_rendering` | boolean | — |
| `frontend.framework_bloat_present` | boolean | must be `false` to pass — skill anti-pattern |

#### Read by: backend_and_data

| Field | Type | Notes |
|---|---|---|
| `backend` | object | The backend section object — a present non-object value is rejected before evaluation |
| `backend.api_contracts_versioned` | boolean | — |
| `backend.input_validated_at_boundary` | boolean | — |
| `backend.handlers_stateless` | boolean | — |
| `backend.idempotency_for_retried_writes` | boolean | — |
| `backend.error_taxonomy_defined` | boolean | — |
| `backend.structured_error_responses` | boolean | — |
| `backend.bare_500_responses_present` | boolean | must be `false` to pass — skill rule |
| `backend.health_endpoint_present` | boolean | — |
| `data` | object | The data section object — a present non-object value is rejected before evaluation |
| `data.schema_is_source_of_truth` | boolean | — |
| `data.migrations_forward_only` | boolean | — |
| `data.migrations_backward_compatible` | boolean | — |
| `data.parametrized_queries_only` | boolean | — |
| `data.string_concatenated_sql_present` | boolean | must be `false` to pass — skill rule |

#### Read by: security

| Field | Type | Notes |
|---|---|---|
| `security` | object | The security section object — a present non-object value is rejected before evaluation |
| `security.authn_authz_separated` | boolean | — |
| `security.least_privilege_enforced` | boolean | — |
| `security.secrets_via_env_or_secret_store` | boolean | — |
| `security.secrets_rotatable` | boolean | — |
| `security.secrets_in_repo_present` | boolean | must be `false` to pass — skill anti-pattern |
| `security.owasp_top10_reviewed` | boolean | — |
| `security.zero_knowledge_required` | boolean (gate) | gates the two zero-knowledge checks below |
| `security.client_side_encryption_applied` | boolean | required when `zero_knowledge_required` is `true`; otherwise the check passes as not applicable |
| `security.user_held_keys` | boolean | required when `zero_knowledge_required` is `true`; otherwise not applicable |

#### Read by: testing_and_quality

| Field | Type | Notes |
|---|---|---|
| `testing` | object | The testing section object — a present non-object value is rejected before evaluation |
| `testing.unit_tests_for_logic` | boolean | — |
| `testing.integration_tests_for_boundaries` | boolean | — |
| `testing.e2e_critical_path_tested` | boolean | — |
| `testing.tests_target_contract_not_implementation` | boolean | — |
| `testing.tests_deferred_present` | boolean | must be `false` to pass — skill anti-pattern |
| `testing.observability_in_place` | boolean | — |
| `testing.graceful_degradation` | boolean | — |
| `testing.stranger_readable_code` | boolean | — |

#### Read by: deploy_and_delivery

| Field | Type | Notes |
|---|---|---|
| `deploy` | object | The deploy section object — a present non-object value is rejected before evaluation |
| `deploy.docker_used_present` | boolean | must be `false` to pass — skill rule: no Docker |
| `deploy.uses_direct_or_platform_native_deploy` | boolean | — |
| `deploy.staging_deployed_first` | boolean | — |
| `deploy.direct_to_production_used` | boolean (gate) | gates the named-bridge check below |
| `deploy.direct_to_prod_named_bridge_with_end_date` | boolean | required when `direct_to_production_used` is `true`; otherwise the check passes as not applicable |
| `deploy.github_repo_in_sync_with_deployed` | boolean | — |
| `deploy.big_bang_release_present` | boolean | must be `false` to pass — skill anti-pattern |
| `deploy.premature_optimization_present` | boolean | must be `false` to pass — skill anti-pattern |

### Checks

All 57 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only: a conditional (gated) check whose gate is not triggered reports `pass` with evidence stating the gate was not declared — that is the not-applicable outcome. Section and verdict aggregation are defined under Verdict vocabulary.

#### Section: approach_and_contracts

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `problem_and_data_flow_understood` | approach: the problem and the data flow are understood before writing code | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `user_visible_outcome_defined` | approach: the user-visible outcome is defined | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `source_of_truth_identified` | approach: the source of truth is identified | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `contract_defined_first` | contract-first: the API/interface is defined first; both ends code to the contract | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `data_shape_defined_first` | contract-first: the data shape is defined first | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vertical_slice_before_widening` | thin vertical slice: one end-to-end path is shipped before widening | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `slices_declared` | thin vertical slice: the declared record names its slices — the slices list is present and non-empty | Computed over the declared record. Pass: the `slices` list is present and non-empty. Fail: the list is present but empty. Missing: the list is absent. |
| `every_slice_end_to_end` | thin vertical slice: every declared slice row declares itself end-to-end complete — UI to API to store and back | Computed over the declared record. Pass: every declared slice row declares `end_to_end_complete: true`. Fail: a declared row has `end_to_end_complete` present but not `true` (such rows are named in `slices_not_end_to_end`). Missing: the list is absent, or a declared row has `end_to_end_complete` absent (such a row is missing evidence and does not appear in `slices_not_end_to_end`). |

#### Section: frontend

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `vanilla_ts_web_components_used` | frontend: vanilla TypeScript + Web Components are used — no framework bloat | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `progressive_enhancement_applied` | frontend: progressive enhancement is applied | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `dependency_tree_kept_small` | frontend: the dependency tree is kept small | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `mobile_first_responsive` | frontend: the layout is mobile-first / responsive by default | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `viewport_configured` | frontend: a proper viewport is configured | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `touch_targets_at_least_44px` | frontend: touch targets are at least 44px — a standing devinfo.dev requirement, declared as a caller attestation | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `semantic_html_used` | accessibility: semantic HTML is used | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `keyboard_navigation_supported` | accessibility: keyboard navigation is supported | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `aria_only_where_needed` | accessibility: ARIA is used only where needed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sufficient_contrast` | accessibility: contrast is sufficient | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `boundaries_typed_no_any` | frontend: the boundaries are typed — unknown is narrowed at the edge; any is never used through | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `undefined_fields_guarded_when_rendering` | frontend: rendering from KV/JSON guards against undefined fields | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_framework_bloat` | anti-pattern: no framework-of-the-week for a static page — no framework bloat is present | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

#### Section: backend_and_data

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `api_contracts_versioned` | backend: API contracts are clear and versioned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `input_validated_at_boundary` | backend: every input is validated at the boundary; the client is never trusted | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `handlers_stateless` | backend: handlers are stateless | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `idempotency_for_retried_writes` | backend: writes that can be retried carry explicit idempotency | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `error_taxonomy_defined` | backend: a real error taxonomy is defined — client vs server vs upstream | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `structured_error_responses` | backend: error responses are structured | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_bare_500_responses` | backend: no bare 500 responses are present | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `health_endpoint_present` | backend: a health endpoint (/api/health) is present on every service | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `schema_is_source_of_truth` | data layer: the schema is the source of truth | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `migrations_forward_only` | data layer: migrations are forward-only | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `migrations_backward_compatible` | data layer: migrations are backward-compatible (expand/contract) | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `parametrized_queries_only` | data layer: parametrized queries only | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_string_concatenated_sql` | data layer: SQL is never built by string concatenation | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

#### Section: security

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `authn_authz_separated` | security: AuthN and authZ are separate concerns | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `least_privilege_enforced` | security: least privilege is enforced | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `secrets_via_env_or_secret_store` | security: secrets come via environment / secret store | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `secrets_rotatable` | security: secrets are rotate-able | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_secrets_in_repo` | security / anti-pattern: no secrets in the repo — no secrets in code | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `owasp_top10_reviewed` | security: the OWASP Top 10 is reviewed — injection, broken access control, SSRF, XSS, CSRF | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `client_side_encryption_applied` | zero-knowledge posture not required by the product | Conditional on `security.zero_knowledge_required`. Pass: the gate is declared `true` and the requirement is declared met — or the gate is declared `false`, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run, where the evidence reads "zero-knowledge posture not required by the product"; the recorded full-pass manifest omits this field entirely and the check still passes, because the gate is not triggered). Fail: the gate is declared `true` and the requirement is declared `false`. Missing: the gate is declared `true` and the required field is absent. |
| `user_held_keys` | zero-knowledge posture not required by the product | Conditional on `security.zero_knowledge_required`. Pass: the gate is declared `true` and the requirement is declared met — or the gate is declared `false`, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run, where the evidence reads "zero-knowledge posture not required by the product"; the recorded full-pass manifest omits this field entirely and the check still passes, because the gate is not triggered). Fail: the gate is declared `true` and the requirement is declared `false`. Missing: the gate is declared `true` and the required field is absent. |

#### Section: testing_and_quality

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `unit_tests_for_logic` | testing: logic is unit-tested | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `integration_tests_for_boundaries` | testing: boundaries are integration-tested | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `e2e_critical_path_tested` | testing: the critical path is tested end-to-end | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tests_target_contract_not_implementation` | testing: tests target the contract, not the implementation | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_tests_deferred` | anti-pattern: tests are not deferred — no "we'll add tests later" | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `observability_in_place` | definition of done: the build is observable | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `graceful_degradation` | definition of done: the build degrades gracefully | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `stranger_readable_code` | definition of done: a stranger could read the code | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: deploy_and_delivery

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `no_docker_used` | deploy: no Docker is used | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `uses_direct_or_platform_native_deploy` | deploy: the deploy method is direct Python (venv/pip/PYTHONPATH), systemd, or platform-native | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `staging_deployed_first` | deploy: staging comes first | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `direct_to_prod_named_bridge_with_end_date` | no direct-to-production deploy declared | Conditional on `deploy.direct_to_production_used`. Pass: the gate is declared `true` and the requirement is declared met — or the gate is declared `false`, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run, where the evidence reads "no direct-to-production deploy declared"; the recorded full-pass manifest omits this field entirely and the check still passes, because the gate is not triggered). Fail: the gate is declared `true` and the requirement is declared `false`. Missing: the gate is declared `true` and the required field is absent. |
| `github_repo_in_sync_with_deployed` | deploy: the GitHub repo is kept in sync with what's actually deployed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_big_bang_release` | anti-pattern: no big-bang features with no vertical slice | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_premature_optimization` | anti-pattern: no optimizing before measuring | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"full-stack-app-build-pack"`), `atom_version` (`"0.1.0"`), and `project` (the manifest's declared project value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `slices_count` (the declared list length as an integer, or null when the list is not declared); the row-name list `slices_not_end_to_end` (slice rows whose `end_to_end_complete` field is present but not `true`; a slice row with the field absent is missing evidence and does not appear; null when the `slices` list is not declared); and the ratio `slice_end_to_end_coverage` (end-to-end slices ÷ declared slices) — a string with exactly six decimal places; a ratio is null when its denominator list is absent or empty. Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "57 pass, 0 fail, 0 missing of 57 checks across six sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared project value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `FULL_STACK_BUILD_SOUND` — all 57 checks pass: the declared full-stack build record is complete and consistent with the bound skill's checklist and anti-patterns.
- `FULL_STACK_BUILD_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — both primary computed checks pass; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one primary computed check cannot be completed because the rows or fields it reads are absent. Exactly two checks drive it — `slices_declared` and `every_slice_end_to_end`, both in `approach_and_contracts`. No other check moves it: the recorded violations run fails eight anti-pattern checks and returns `FULL_STACK_BUILD_NOT_SOUND` while `computed_status` correctly stays `within_stated_limits_on_declared_evidence`, because the two slice checks still pass.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes (including gated checks passing as not applicable); `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence (for gated checks: met, or the gate was not triggered — not applicable); `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

### Errors

Error bodies are the gateway's recorded shapes (`rails/gateway/src/callpath.ts`); a failed call is not metered.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | No key, or the key does not verify. On the MCP face the body is `{"error": "missing or invalid gateway API key"}`. |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the full_stack_app_build_pack scope; issue it for this atom first"}` | The key is valid but does not hold this atom's scope. Issue the key for this atom (see How-to) and retry. On the MCP face the body is `{"error": "this key does not hold the full_stack_app_build_pack scope"}`. |
| 422 | `{"ok":false,"error":"invalid_input","field":"slices","detail":"slices must be a list"}` (this atom's recorded malformed run; the shape is `{"ok": false, "error": "invalid_input", "field": "<field>", "detail": "<field> must be a <type>"}`) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. Via MCP `tools/call`, the same failure surfaces as a JSON-RPC error with code `-32602` carrying the detail message. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for full-stack-app-build-pack exceeded"}` (or the `10000/day` variant) | Per-key rate limit exceeded for this atom; the call is not metered. Via MCP `tools/call` it surfaces as a JSON-RPC error with code `-32029`. |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Builds web apps like someone who will maintain them for years — clear contracts, small correct slices, boring reliability over clever tricks (the bound capability, from the `senior-fullstack-engineer` skill). You submit one declared record — the full-stack build manifest — and the atom audits that record for completeness and internal consistency against the bound skill's sections and anti-patterns, returning one deterministic verdict across 6 sections (`approach_and_contracts`, `frontend`, `backend_and_data`, `security`, `testing_and_quality`, `deploy_and_delivery`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — the declared `slices` list must be present and non-empty, and every declared slice row must declare `end_to_end_complete: true` — using only the declared record, with no outside threshold imported. *Conditional checks* bind only when their declared gate field says the situation applies — client-side encryption and user-held keys are required only when `security.zero_knowledge_required` is declared `true`, and the named-bridge declaration is required only when `deploy.direct_to_production_used` is declared `true`; when a gate is not triggered the check passes as not applicable, and its evidence text says so. Aggregation is strict: any `fail` anywhere produces `FULL_STACK_BUILD_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `FULL_STACK_BUILD_SOUND`. The central semantic is the absent/false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented beyond the skill's own stated ≥44px touch-target requirement, which is carried as a caller attestation (`touch_targets_at_least_44px`), not a measurement — the atom reads no layout. Declined thresholds, named in SERVICE.md: a measured touch-target pixel value (the skill states ≥44px but the atom takes the caller's attestation rather than measuring a rendered page); a test-coverage percentage (the skill requires unit / integration / e2e tests but states no coverage number); a contrast ratio (the skill says "sufficient contrast" but states no ratio — caller attestation only); a dependency-tree size or dependency count limit (the skill says "keep the dependency tree small" but states no number); a latency or performance budget (the skill forbids optimizing before measuring but states no budget); a health-check interval; a secret-rotation period (the skill says secrets must be rotate-able, not how often); and a coverage percentage below completeness for the computed slice rows. Quantities are computed and reported; the only bar on the computed rows is completeness over the caller's own declared rows.

**What it does NOT do.** The atom audits a **declared** full-stack build record: a verdict of `FULL_STACK_BUILD_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a manifest that declares contract-first design, an end-to-end first slice, parametrized queries only, and staging-first deploys passes those checks even if the real build does none of it. It is a completeness and consistency audit of the record the skill requires, **not a full-stack engineering service or a live build certification**. Specifically: it builds no app, runs no code, inspects no repository, renders no page, and does not verify that a declared control actually works. It never judges whether the chosen contract is the right contract commercially, whether a declared slice really exercises the store, whether Access-style authorization is correctly scoped, or whether the real code is actually readable — only that the record contains what the skill's sections and anti-patterns demand, and that its declared rows are internally consistent. Named exclusions: no numeric thresholds beyond the skill's own stated ≥44px attestation (see the declined list above); no live verification of any declared fact; no code or repository inspection (secrets in the repo, string-concatenated SQL, and bare-500 responses are caller declarations, the atom reads no repo and no code); no framework vocabulary enforcement (the skill's stack preference — vanilla TypeScript + Web Components — is a caller declaration, the atom does not fail a declared backend or frontend name against a vocabulary); the skill's cross-reference to `phased-delivery` (plan before build, staging-first, no Docker) is carried as the caller's own attestations in this record, not re-audited against that skill; the skill's cross-reference to `database-sme` for data-layer depth is likewise a caller attestation here, not re-audited.

**Buyer and use context.** Teams and agents working in Engineering & code who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Building product web apps end-to-end (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulator view: N/A — this atom audits a declared full-stack build record in an unregulated engineering domain; its verdict is a completeness and consistency judgment on the declared evidence, not compliance or audit evidence in a regulated domain and not a live build certification (SERVICE.md states this explicitly). No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `full_stack_app_build_pack` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/full_stack_app_build_pack.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_full_stack_app_build_pack.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/full-stack-app-build-pack` (REST) and `POST /mcp/full-stack-app-build-pack` (MCP, tool `full_stack_app_build_pack`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification. Key scope: `full_stack_app_build_pack`. Rate limits: 60/minute, 10,000/day per key per atom (429 `rate_limit`, not metered). Error monitoring: watch 401 `unauthorized` (key problems), 403 `scope_required` (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live — release candidate, one-week RC soak to 2026-11-22; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Worked examples

Provenance: recorded 2026-11-16T05:39:38.066134+00:00 against gateway v1.1.0, external verification lane, source `verification/work/full-stack-app-build-pack/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Input:

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

Response (HTTP 200):

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
  "checks": [
    {
      "section": "approach_and_contracts",
      "check": "problem_and_data_flow_understood",
      "status": "pass",
      "evidence": "approach: the problem and the data flow are understood before writing code"
    },
    {
      "section": "approach_and_contracts",
      "check": "user_visible_outcome_defined",
      "status": "pass",
      "evidence": "approach: the user-visible outcome is defined"
    },
    {
      "section": "approach_and_contracts",
      "check": "source_of_truth_identified",
      "status": "pass",
      "evidence": "approach: the source of truth is identified"
    },
    {
      "section": "approach_and_contracts",
      "check": "contract_defined_first",
      "status": "pass",
      "evidence": "contract-first: the API/interface is defined first; both ends code to the contract"
    },
    {
      "section": "approach_and_contracts",
      "check": "data_shape_defined_first",
      "status": "pass",
      "evidence": "contract-first: the data shape is defined first"
    },
    {
      "section": "approach_and_contracts",
      "check": "vertical_slice_before_widening",
      "status": "pass",
      "evidence": "thin vertical slice: one end-to-end path is shipped before widening"
    },
    {
      "section": "approach_and_contracts",
      "check": "slices_declared",
      "status": "pass",
      "evidence": "thin vertical slice: the declared record names its slices — the slices list is present and non-empty"
    },
    {
      "section": "approach_and_contracts",
      "check": "every_slice_end_to_end",
      "status": "pass",
      "evidence": "thin vertical slice: every declared slice row declares itself end-to-end complete — UI to API to store and back"
    },
    {
      "section": "frontend",
      "check": "vanilla_ts_web_components_used",
      "status": "pass",
      "evidence": "frontend: vanilla TypeScript + Web Components are used — no framework bloat"
    },
    {
      "section": "frontend",
      "check": "progressive_enhancement_applied",
      "status": "pass",
      "evidence": "frontend: progressive enhancement is applied"
    },
    {
      "section": "frontend",
      "check": "dependency_tree_kept_small",
      "status": "pass",
      "evidence": "frontend: the dependency tree is kept small"
    },
    {
      "section": "frontend",
      "check": "mobile_first_responsive",
      "status": "pass",
      "evidence": "frontend: the layout is mobile-first / responsive by default"
    },
    {
      "section": "frontend",
      "check": "viewport_configured",
      "status": "pass",
      "evidence": "frontend: a proper viewport is configured"
    },
    {
      "section": "frontend",
      "check": "touch_targets_at_least_44px",
      "status": "pass",
      "evidence": "frontend: touch targets are at least 44px — a standing devinfo.dev requirement, declared as a caller attestation"
    },
    {
      "section": "frontend",
      "check": "semantic_html_used",
      "status": "pass",
      "evidence": "accessibility: semantic HTML is used"
    },
    {
      "section": "frontend",
      "check": "keyboard_navigation_supported",
      "status": "pass",
      "evidence": "accessibility: keyboard navigation is supported"
    },
    {
      "section": "frontend",
      "check": "aria_only_where_needed",
      "status": "pass",
      "evidence": "accessibility: ARIA is used only where needed"
    },
    {
      "section": "frontend",
      "check": "sufficient_contrast",
      "status": "pass",
      "evidence": "accessibility: contrast is sufficient"
    },
    {
      "section": "frontend",
      "check": "boundaries_typed_no_any",
      "status": "pass",
      "evidence": "frontend: the boundaries are typed — unknown is narrowed at the edge; any is never used through"
    },
    {
      "section": "frontend",
      "check": "undefined_fields_guarded_when_rendering",
      "status": "pass",
      "evidence": "frontend: rendering from KV/JSON guards against undefined fields"
    },
    {
      "section": "frontend",
      "check": "no_framework_bloat",
      "status": "pass",
      "evidence": "anti-pattern: no framework-of-the-week for a static page — no framework bloat is present"
    },
    {
      "section": "backend_and_data",
      "check": "api_contracts_versioned",
      "status": "pass",
      "evidence": "backend: API contracts are clear and versioned"
    },
    {
      "section": "backend_and_data",
      "check": "input_validated_at_boundary",
      "status": "pass",
      "evidence": "backend: every input is validated at the boundary; the client is never trusted"
    },
    {
      "section": "backend_and_data",
      "check": "handlers_stateless",
      "status": "pass",
      "evidence": "backend: handlers are stateless"
    },
    {
      "section": "backend_and_data",
      "check": "idempotency_for_retried_writes",
      "status": "pass",
      "evidence": "backend: writes that can be retried carry explicit idempotency"
    },
    {
      "section": "backend_and_data",
      "check": "error_taxonomy_defined",
      "status": "pass",
      "evidence": "backend: a real error taxonomy is defined — client vs server vs upstream"
    },
    {
      "section": "backend_and_data",
      "check": "structured_error_responses",
      "status": "pass",
      "evidence": "backend: error responses are structured"
    },
    {
      "section": "backend_and_data",
      "check": "no_bare_500_responses",
      "status": "pass",
      "evidence": "backend: no bare 500 responses are present"
    },
    {
      "section": "backend_and_data",
      "check": "health_endpoint_present",
      "status": "pass",
      "evidence": "backend: a health endpoint (/api/health) is present on every service"
    },
    {
      "section": "backend_and_data",
      "check": "schema_is_source_of_truth",
      "status": "pass",
      "evidence": "data layer: the schema is the source of truth"
    },
    {
      "section": "backend_and_data",
      "check": "migrations_forward_only",
      "status": "pass",
      "evidence": "data layer: migrations are forward-only"
    },
    {
      "section": "backend_and_data",
      "check": "migrations_backward_compatible",
      "status": "pass",
      "evidence": "data layer: migrations are backward-compatible (expand/contract)"
    },
    {
      "section": "backend_and_data",
      "check": "parametrized_queries_only",
      "status": "pass",
      "evidence": "data layer: parametrized queries only"
    },
    {
      "section": "backend_and_data",
      "check": "no_string_concatenated_sql",
      "status": "pass",
      "evidence": "data layer: SQL is never built by string concatenation"
    },
    {
      "section": "security",
      "check": "authn_authz_separated",
      "status": "pass",
      "evidence": "security: AuthN and authZ are separate concerns"
    },
    {
      "section": "security",
      "check": "least_privilege_enforced",
      "status": "pass",
      "evidence": "security: least privilege is enforced"
    },
    {
      "section": "security",
      "check": "secrets_via_env_or_secret_store",
      "status": "pass",
      "evidence": "security: secrets come via environment / secret store"
    },
    {
      "section": "security",
      "check": "secrets_rotatable",
      "status": "pass",
      "evidence": "security: secrets are rotate-able"
    },
    {
      "section": "security",
      "check": "no_secrets_in_repo",
      "status": "pass",
      "evidence": "security / anti-pattern: no secrets in the repo — no secrets in code"
    },
    {
      "section": "security",
      "check": "owasp_top10_reviewed",
      "status": "pass",
      "evidence": "security: the OWASP Top 10 is reviewed — injection, broken access control, SSRF, XSS, CSRF"
    },
    {
      "section": "security",
      "check": "client_side_encryption_applied",
      "status": "pass",
      "evidence": "zero-knowledge posture not required by the product"
    },
    {
      "section": "security",
      "check": "user_held_keys",
      "status": "pass",
      "evidence": "zero-knowledge posture not required by the product"
    },
    {
      "section": "testing_and_quality",
      "check": "unit_tests_for_logic",
      "status": "pass",
      "evidence": "testing: logic is unit-tested"
    },
    {
      "section": "testing_and_quality",
      "check": "integration_tests_for_boundaries",
      "status": "pass",
      "evidence": "testing: boundaries are integration-tested"
    },
    {
      "section": "testing_and_quality",
      "check": "e2e_critical_path_tested",
      "status": "pass",
      "evidence": "testing: the critical path is tested end-to-end"
    },
    {
      "section": "testing_and_quality",
      "check": "tests_target_contract_not_implementation",
      "status": "pass",
      "evidence": "testing: tests target the contract, not the implementation"
    },
    {
      "section": "testing_and_quality",
      "check": "no_tests_deferred",
      "status": "pass",
      "evidence": "anti-pattern: tests are not deferred — no \"we'll add tests later\""
    },
    {
      "section": "testing_and_quality",
      "check": "observability_in_place",
      "status": "pass",
      "evidence": "definition of done: the build is observable"
    },
    {
      "section": "testing_and_quality",
      "check": "graceful_degradation",
      "status": "pass",
      "evidence": "definition of done: the build degrades gracefully"
    },
    {
      "section": "testing_and_quality",
      "check": "stranger_readable_code",
      "status": "pass",
      "evidence": "definition of done: a stranger could read the code"
    },
    {
      "section": "deploy_and_delivery",
      "check": "no_docker_used",
      "status": "pass",
      "evidence": "deploy: no Docker is used"
    },
    {
      "section": "deploy_and_delivery",
      "check": "uses_direct_or_platform_native_deploy",
      "status": "pass",
      "evidence": "deploy: the deploy method is direct Python (venv/pip/PYTHONPATH), systemd, or platform-native"
    },
    {
      "section": "deploy_and_delivery",
      "check": "staging_deployed_first",
      "status": "pass",
      "evidence": "deploy: staging comes first"
    },
    {
      "section": "deploy_and_delivery",
      "check": "direct_to_prod_named_bridge_with_end_date",
      "status": "pass",
      "evidence": "no direct-to-production deploy declared"
    },
    {
      "section": "deploy_and_delivery",
      "check": "github_repo_in_sync_with_deployed",
      "status": "pass",
      "evidence": "deploy: the GitHub repo is kept in sync with what's actually deployed"
    },
    {
      "section": "deploy_and_delivery",
      "check": "no_big_bang_release",
      "status": "pass",
      "evidence": "anti-pattern: no big-bang features with no vertical slice"
    },
    {
      "section": "deploy_and_delivery",
      "check": "no_premature_optimization",
      "status": "pass",
      "evidence": "anti-pattern: no optimizing before measuring"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "slices_count": 1,
  "slices_not_end_to_end": [],
  "slice_end_to_end_coverage": "1.000000",
  "summary": "57 pass, 0 fail, 0 missing of 57 checks across six sections.",
  "stamp": "FULL STACK APP BUILD PACK\nproject: test-project\nVERDICT: FULL_STACK_BUILD_SOUND\n  approach_and_contracts               pass\n  frontend                             pass\n  backend_and_data                     pass\n  security                             pass\n  testing_and_quality                  pass\n  deploy_and_delivery                  pass\n57 pass, 0 fail, 0 missing of 57 checks across six sections."
}
```

### Example 2 — Violations (case `violations`)

Input:

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
    "framework_bloat_present": true
  },
  "backend": {
    "api_contracts_versioned": true,
    "input_validated_at_boundary": true,
    "handlers_stateless": true,
    "idempotency_for_retried_writes": true,
    "error_taxonomy_defined": true,
    "structured_error_responses": true,
    "bare_500_responses_present": true,
    "health_endpoint_present": true
  },
  "data": {
    "schema_is_source_of_truth": true,
    "migrations_forward_only": true,
    "migrations_backward_compatible": true,
    "parametrized_queries_only": true,
    "string_concatenated_sql_present": true
  },
  "security": {
    "authn_authz_separated": true,
    "least_privilege_enforced": true,
    "secrets_via_env_or_secret_store": true,
    "secrets_rotatable": true,
    "secrets_in_repo_present": true,
    "owasp_top10_reviewed": true,
    "zero_knowledge_required": false
  },
  "testing": {
    "unit_tests_for_logic": true,
    "integration_tests_for_boundaries": true,
    "e2e_critical_path_tested": true,
    "tests_target_contract_not_implementation": true,
    "tests_deferred_present": true,
    "observability_in_place": true,
    "graceful_degradation": true,
    "stranger_readable_code": true
  },
  "deploy": {
    "docker_used_present": true,
    "uses_direct_or_platform_native_deploy": true,
    "staging_deployed_first": true,
    "direct_to_production_used": false,
    "github_repo_in_sync_with_deployed": true,
    "big_bang_release_present": true,
    "premature_optimization_present": true
  }
}
```

Response (HTTP 200):

```json
{
  "service": "full-stack-app-build-pack",
  "atom_version": "0.1.0",
  "project": "test-project",
  "verdict": "FULL_STACK_BUILD_NOT_SOUND",
  "sections": {
    "approach_and_contracts": "pass",
    "frontend": "fail",
    "backend_and_data": "fail",
    "security": "fail",
    "testing_and_quality": "fail",
    "deploy_and_delivery": "fail"
  },
  "checks": [
    {
      "section": "approach_and_contracts",
      "check": "problem_and_data_flow_understood",
      "status": "pass",
      "evidence": "approach: the problem and the data flow are understood before writing code"
    },
    {
      "section": "approach_and_contracts",
      "check": "user_visible_outcome_defined",
      "status": "pass",
      "evidence": "approach: the user-visible outcome is defined"
    },
    {
      "section": "approach_and_contracts",
      "check": "source_of_truth_identified",
      "status": "pass",
      "evidence": "approach: the source of truth is identified"
    },
    {
      "section": "approach_and_contracts",
      "check": "contract_defined_first",
      "status": "pass",
      "evidence": "contract-first: the API/interface is defined first; both ends code to the contract"
    },
    {
      "section": "approach_and_contracts",
      "check": "data_shape_defined_first",
      "status": "pass",
      "evidence": "contract-first: the data shape is defined first"
    },
    {
      "section": "approach_and_contracts",
      "check": "vertical_slice_before_widening",
      "status": "pass",
      "evidence": "thin vertical slice: one end-to-end path is shipped before widening"
    },
    {
      "section": "approach_and_contracts",
      "check": "slices_declared",
      "status": "pass",
      "evidence": "thin vertical slice: the declared record names its slices — the slices list is present and non-empty"
    },
    {
      "section": "approach_and_contracts",
      "check": "every_slice_end_to_end",
      "status": "pass",
      "evidence": "thin vertical slice: every declared slice row declares itself end-to-end complete — UI to API to store and back"
    },
    {
      "section": "frontend",
      "check": "vanilla_ts_web_components_used",
      "status": "pass",
      "evidence": "frontend: vanilla TypeScript + Web Components are used — no framework bloat"
    },
    {
      "section": "frontend",
      "check": "progressive_enhancement_applied",
      "status": "pass",
      "evidence": "frontend: progressive enhancement is applied"
    },
    {
      "section": "frontend",
      "check": "dependency_tree_kept_small",
      "status": "pass",
      "evidence": "frontend: the dependency tree is kept small"
    },
    {
      "section": "frontend",
      "check": "mobile_first_responsive",
      "status": "pass",
      "evidence": "frontend: the layout is mobile-first / responsive by default"
    },
    {
      "section": "frontend",
      "check": "viewport_configured",
      "status": "pass",
      "evidence": "frontend: a proper viewport is configured"
    },
    {
      "section": "frontend",
      "check": "touch_targets_at_least_44px",
      "status": "pass",
      "evidence": "frontend: touch targets are at least 44px — a standing devinfo.dev requirement, declared as a caller attestation"
    },
    {
      "section": "frontend",
      "check": "semantic_html_used",
      "status": "pass",
      "evidence": "accessibility: semantic HTML is used"
    },
    {
      "section": "frontend",
      "check": "keyboard_navigation_supported",
      "status": "pass",
      "evidence": "accessibility: keyboard navigation is supported"
    },
    {
      "section": "frontend",
      "check": "aria_only_where_needed",
      "status": "pass",
      "evidence": "accessibility: ARIA is used only where needed"
    },
    {
      "section": "frontend",
      "check": "sufficient_contrast",
      "status": "pass",
      "evidence": "accessibility: contrast is sufficient"
    },
    {
      "section": "frontend",
      "check": "boundaries_typed_no_any",
      "status": "pass",
      "evidence": "frontend: the boundaries are typed — unknown is narrowed at the edge; any is never used through"
    },
    {
      "section": "frontend",
      "check": "undefined_fields_guarded_when_rendering",
      "status": "pass",
      "evidence": "frontend: rendering from KV/JSON guards against undefined fields"
    },
    {
      "section": "frontend",
      "check": "no_framework_bloat",
      "status": "fail",
      "evidence": "anti-pattern: no framework-of-the-week for a static page — no framework bloat is present"
    },
    {
      "section": "backend_and_data",
      "check": "api_contracts_versioned",
      "status": "pass",
      "evidence": "backend: API contracts are clear and versioned"
    },
    {
      "section": "backend_and_data",
      "check": "input_validated_at_boundary",
      "status": "pass",
      "evidence": "backend: every input is validated at the boundary; the client is never trusted"
    },
    {
      "section": "backend_and_data",
      "check": "handlers_stateless",
      "status": "pass",
      "evidence": "backend: handlers are stateless"
    },
    {
      "section": "backend_and_data",
      "check": "idempotency_for_retried_writes",
      "status": "pass",
      "evidence": "backend: writes that can be retried carry explicit idempotency"
    },
    {
      "section": "backend_and_data",
      "check": "error_taxonomy_defined",
      "status": "pass",
      "evidence": "backend: a real error taxonomy is defined — client vs server vs upstream"
    },
    {
      "section": "backend_and_data",
      "check": "structured_error_responses",
      "status": "pass",
      "evidence": "backend: error responses are structured"
    },
    {
      "section": "backend_and_data",
      "check": "no_bare_500_responses",
      "status": "fail",
      "evidence": "backend: no bare 500 responses are present"
    },
    {
      "section": "backend_and_data",
      "check": "health_endpoint_present",
      "status": "pass",
      "evidence": "backend: a health endpoint (/api/health) is present on every service"
    },
    {
      "section": "backend_and_data",
      "check": "schema_is_source_of_truth",
      "status": "pass",
      "evidence": "data layer: the schema is the source of truth"
    },
    {
      "section": "backend_and_data",
      "check": "migrations_forward_only",
      "status": "pass",
      "evidence": "data layer: migrations are forward-only"
    },
    {
      "section": "backend_and_data",
      "check": "migrations_backward_compatible",
      "status": "pass",
      "evidence": "data layer: migrations are backward-compatible (expand/contract)"
    },
    {
      "section": "backend_and_data",
      "check": "parametrized_queries_only",
      "status": "pass",
      "evidence": "data layer: parametrized queries only"
    },
    {
      "section": "backend_and_data",
      "check": "no_string_concatenated_sql",
      "status": "fail",
      "evidence": "data layer: SQL is never built by string concatenation"
    },
    {
      "section": "security",
      "check": "authn_authz_separated",
      "status": "pass",
      "evidence": "security: AuthN and authZ are separate concerns"
    },
    {
      "section": "security",
      "check": "least_privilege_enforced",
      "status": "pass",
      "evidence": "security: least privilege is enforced"
    },
    {
      "section": "security",
      "check": "secrets_via_env_or_secret_store",
      "status": "pass",
      "evidence": "security: secrets come via environment / secret store"
    },
    {
      "section": "security",
      "check": "secrets_rotatable",
      "status": "pass",
      "evidence": "security: secrets are rotate-able"
    },
    {
      "section": "security",
      "check": "no_secrets_in_repo",
      "status": "fail",
      "evidence": "security / anti-pattern: no secrets in the repo — no secrets in code"
    },
    {
      "section": "security",
      "check": "owasp_top10_reviewed",
      "status": "pass",
      "evidence": "security: the OWASP Top 10 is reviewed — injection, broken access control, SSRF, XSS, CSRF"
    },
    {
      "section": "security",
      "check": "client_side_encryption_applied",
      "status": "pass",
      "evidence": "zero-knowledge posture not required by the product"
    },
    {
      "section": "security",
      "check": "user_held_keys",
      "status": "pass",
      "evidence": "zero-knowledge posture not required by the product"
    },
    {
      "section": "testing_and_quality",
      "check": "unit_tests_for_logic",
      "status": "pass",
      "evidence": "testing: logic is unit-tested"
    },
    {
      "section": "testing_and_quality",
      "check": "integration_tests_for_boundaries",
      "status": "pass",
      "evidence": "testing: boundaries are integration-tested"
    },
    {
      "section": "testing_and_quality",
      "check": "e2e_critical_path_tested",
      "status": "pass",
      "evidence": "testing: the critical path is tested end-to-end"
    },
    {
      "section": "testing_and_quality",
      "check": "tests_target_contract_not_implementation",
      "status": "pass",
      "evidence": "testing: tests target the contract, not the implementation"
    },
    {
      "section": "testing_and_quality",
      "check": "no_tests_deferred",
      "status": "fail",
      "evidence": "anti-pattern: tests are not deferred — no \"we'll add tests later\""
    },
    {
      "section": "testing_and_quality",
      "check": "observability_in_place",
      "status": "pass",
      "evidence": "definition of done: the build is observable"
    },
    {
      "section": "testing_and_quality",
      "check": "graceful_degradation",
      "status": "pass",
      "evidence": "definition of done: the build degrades gracefully"
    },
    {
      "section": "testing_and_quality",
      "check": "stranger_readable_code",
      "status": "pass",
      "evidence": "definition of done: a stranger could read the code"
    },
    {
      "section": "deploy_and_delivery",
      "check": "no_docker_used",
      "status": "fail",
      "evidence": "deploy: no Docker is used"
    },
    {
      "section": "deploy_and_delivery",
      "check": "uses_direct_or_platform_native_deploy",
      "status": "pass",
      "evidence": "deploy: the deploy method is direct Python (venv/pip/PYTHONPATH), systemd, or platform-native"
    },
    {
      "section": "deploy_and_delivery",
      "check": "staging_deployed_first",
      "status": "pass",
      "evidence": "deploy: staging comes first"
    },
    {
      "section": "deploy_and_delivery",
      "check": "direct_to_prod_named_bridge_with_end_date",
      "status": "pass",
      "evidence": "no direct-to-production deploy declared"
    },
    {
      "section": "deploy_and_delivery",
      "check": "github_repo_in_sync_with_deployed",
      "status": "pass",
      "evidence": "deploy: the GitHub repo is kept in sync with what's actually deployed"
    },
    {
      "section": "deploy_and_delivery",
      "check": "no_big_bang_release",
      "status": "fail",
      "evidence": "anti-pattern: no big-bang features with no vertical slice"
    },
    {
      "section": "deploy_and_delivery",
      "check": "no_premature_optimization",
      "status": "fail",
      "evidence": "anti-pattern: no optimizing before measuring"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "slices_count": 1,
  "slices_not_end_to_end": [],
  "slice_end_to_end_coverage": "1.000000",
  "summary": "49 pass, 8 fail, 0 missing of 57 checks across six sections.",
  "stamp": "FULL STACK APP BUILD PACK\nproject: test-project\nVERDICT: FULL_STACK_BUILD_NOT_SOUND\n  approach_and_contracts               pass\n  frontend                             fail\n  backend_and_data                     fail\n  security                             fail\n  testing_and_quality                  fail\n  deploy_and_delivery                  fail\n49 pass, 8 fail, 0 missing of 57 checks across six sections."
}
```

### Example 3 — Malformed (case `malformed`)

Input:

```json
{
  "slices": "not-a-list"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "slices",
  "detail": "slices must be a list"
}
```


## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — N/A — this atom audits a declared full-stack build record in an unregulated engineering domain; its verdict is a completeness and consistency judgment, not compliance or audit evidence and not a live build certification. |
| Checks named | 57 documented / 57 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses (not-applicable expressed as a gated `pass`) |
| Input reference typed | Yes — 69 fields, each with its type from SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/full-stack-app-build-pack/evidence.json` |
