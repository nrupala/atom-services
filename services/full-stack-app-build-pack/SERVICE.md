# Full stack app build pack — `full-stack-app-build-pack`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Builds web apps like someone who will maintain them for years — clear contracts, small correct slices, boring reliability over clever tricks.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Building product web apps end-to-end**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the full-stack build manifest

The caller submits one JSON manifest: a declared full-stack build
record for one project. Every field below is read by the named
section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid =
the check fails (`FULL_STACK_BUILD_NOT_SOUND`).

| Field | Type | Read by |
|---|---|---|
| `project` | string (carried into the verdict output, not itself checked) | — |
| `approach.problem_and_data_flow_understood` | boolean | approach_and_contracts |
| `approach.user_visible_outcome_defined` | boolean | approach_and_contracts |
| `approach.source_of_truth_identified` | boolean | approach_and_contracts |
| `approach.contract_defined_first` | boolean | approach_and_contracts |
| `approach.data_shape_defined_first` | boolean | approach_and_contracts |
| `approach.vertical_slice_before_widening` | boolean | approach_and_contracts |
| `slices` | list of slice-row objects, each with the entry fields below (computed, see below) | approach_and_contracts |
| `slices[].name` | string (names the row in the computed outputs) | approach_and_contracts |
| `slices[].end_to_end_complete` | boolean | approach_and_contracts |
| `frontend.vanilla_ts_web_components_used` | boolean | frontend |
| `frontend.progressive_enhancement_applied` | boolean | frontend |
| `frontend.dependency_tree_kept_small` | boolean | frontend |
| `frontend.mobile_first_responsive` | boolean | frontend |
| `frontend.viewport_configured` | boolean | frontend |
| `frontend.touch_targets_at_least_44px` | boolean (caller attestation of the skill's stated ≥44px requirement; the atom measures no layout) | frontend |
| `frontend.semantic_html_used` | boolean | frontend |
| `frontend.keyboard_navigation_supported` | boolean | frontend |
| `frontend.aria_only_where_needed` | boolean | frontend |
| `frontend.sufficient_contrast` | boolean | frontend |
| `frontend.boundaries_typed_no_any` | boolean | frontend |
| `frontend.undefined_fields_guarded_when_rendering` | boolean | frontend |
| `frontend.framework_bloat_present` | boolean (must be `false` to pass — skill anti-pattern) | frontend |
| `backend.api_contracts_versioned` | boolean | backend_and_data |
| `backend.input_validated_at_boundary` | boolean | backend_and_data |
| `backend.handlers_stateless` | boolean | backend_and_data |
| `backend.idempotency_for_retried_writes` | boolean | backend_and_data |
| `backend.error_taxonomy_defined` | boolean | backend_and_data |
| `backend.structured_error_responses` | boolean | backend_and_data |
| `backend.bare_500_responses_present` | boolean (must be `false` to pass — skill rule) | backend_and_data |
| `backend.health_endpoint_present` | boolean | backend_and_data |
| `data.schema_is_source_of_truth` | boolean | backend_and_data |
| `data.migrations_forward_only` | boolean | backend_and_data |
| `data.migrations_backward_compatible` | boolean | backend_and_data |
| `data.parametrized_queries_only` | boolean | backend_and_data |
| `data.string_concatenated_sql_present` | boolean (must be `false` to pass — skill rule) | backend_and_data |
| `security.authn_authz_separated` | boolean | security |
| `security.least_privilege_enforced` | boolean | security |
| `security.secrets_via_env_or_secret_store` | boolean | security |
| `security.secrets_rotatable` | boolean | security |
| `security.secrets_in_repo_present` | boolean (must be `false` to pass — skill anti-pattern) | security |
| `security.owasp_top10_reviewed` | boolean | security |
| `security.zero_knowledge_required` | boolean (gates the two zero-knowledge checks below) | security |
| `security.client_side_encryption_applied` | boolean (required when `zero_knowledge_required` is `true`; otherwise the check passes as not applicable) | security |
| `security.user_held_keys` | boolean (required when `zero_knowledge_required` is `true`; otherwise not applicable) | security |
| `testing.unit_tests_for_logic` | boolean | testing_and_quality |
| `testing.integration_tests_for_boundaries` | boolean | testing_and_quality |
| `testing.e2e_critical_path_tested` | boolean | testing_and_quality |
| `testing.tests_target_contract_not_implementation` | boolean | testing_and_quality |
| `testing.tests_deferred_present` | boolean (must be `false` to pass — skill anti-pattern) | testing_and_quality |
| `testing.observability_in_place` | boolean | testing_and_quality |
| `testing.graceful_degradation` | boolean | testing_and_quality |
| `testing.stranger_readable_code` | boolean | testing_and_quality |
| `deploy.docker_used_present` | boolean (must be `false` to pass — skill rule: no Docker) | deploy_and_delivery |
| `deploy.uses_direct_or_platform_native_deploy` | boolean | deploy_and_delivery |
| `deploy.staging_deployed_first` | boolean | deploy_and_delivery |
| `deploy.direct_to_production_used` | boolean (gates the named-bridge check below) | deploy_and_delivery |
| `deploy.direct_to_prod_named_bridge_with_end_date` | boolean (required when `direct_to_production_used` is `true`; otherwise the check passes as not applicable) | deploy_and_delivery |
| `deploy.github_repo_in_sync_with_deployed` | boolean | deploy_and_delivery |
| `deploy.big_bang_release_present` | boolean (must be `false` to pass — skill anti-pattern) | deploy_and_delivery |
| `deploy.premature_optimization_present` | boolean (must be `false` to pass — skill anti-pattern) | deploy_and_delivery |

Several checks are computed from the declared rows, using only
the skill's own stated rules plus the consistency of the declared
record itself — no outside threshold is imported:

- **Slices declared:** the declared `slices` list passes only
  when it is present and non-empty; an absent list is missing
  evidence, an empty list fails.
- **Every slice end-to-end:** every declared slice row must
  declare `end_to_end_complete: true` (the skill: "Ship one
  end-to-end path (UI → API → store → back) before widening").
  A row with the field absent is missing evidence.

Three check groups are conditional, following the skill's own
scoping — computed from the declared gate field:

- **Zero-knowledge posture:** the skill binds client-side
  encryption and user-held keys to products that call for it
  ("where the product calls for it"). `client_side_encryption_applied`
  and `user_held_keys` are therefore required only when
  `security.zero_knowledge_required` is declared `true`; when it
  is not required, both checks pass as not applicable.
- **Direct-to-production bridge:** the skill permits
  direct-to-production only as a named bridge with an end date.
  `direct_to_prod_named_bridge_with_end_date` is therefore
  required only when `deploy.direct_to_production_used` is
  declared `true`; when no direct-to-production deploy is
  declared, the check passes as not applicable.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when either
of the two primary computed checks above cannot be completed),
`slices_count` (the declared list length, or null when the list
is not declared — counts are reported as integers, exactly), the
row-name list `slices_not_end_to_end` (slice rows whose
`end_to_end_complete` field is present but not true; a slice row
with the field absent is missing evidence and does not appear;
null when the list is not declared), and the coverage ratio
`slice_end_to_end_coverage` (end-to-end slices ÷ declared
slices).
**Fixed serialization rule:** computed ratios are reported as
strings with exactly six decimal places, produced in both
implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six
decimals; comparisons use the unrounded values. A ratio is null
when its denominator list is absent or empty. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical.

The skill states one numeric requirement — touch targets of
≥44px (a standing devinfo.dev requirement) — and it is carried
as a caller attestation (`touch_targets_at_least_44px`), not a
measurement: the atom reads no layout. The skill states no other
numeric pass/fail threshold, so no other numeric threshold check
is invented. Declined thresholds, named: a measured touch-target
pixel value (the skill states ≥44px but the atom takes the
caller's attestation rather than measuring a rendered page); a
test-coverage percentage (the skill requires unit / integration
/ e2e tests but states no coverage number); a contrast ratio
(the skill says "sufficient contrast" but states no ratio —
caller attestation only); a dependency-tree size or dependency
count limit (the skill says "keep the dependency tree small" but
states no number); a latency or performance budget (the skill
forbids optimizing before measuring but states no budget); a
health-check interval; a secret-rotation period (the skill says
secrets must be rotate-able, not how often); a coverage
percentage below completeness for the computed slice rows.

The verdict is one of `FULL_STACK_BUILD_SOUND` (all 57 checks
pass), `FULL_STACK_BUILD_NOT_SOUND` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across six sections: approach_and_contracts, frontend,
backend_and_data, security, testing_and_quality,
deploy_and_delivery.

## Honest scoping

This atom audits a **declared** full-stack build record — it
builds no app, runs no code, inspects no repository, renders no
page, and does not verify that a declared control actually
works. A build is sound *on the caller's declared evidence*: a
manifest that declares contract-first design, an end-to-end
first slice, parametrized queries only, and staging-first
deploys passes those checks even if the real build does none of
it. It is a completeness and consistency audit of the record the
skill requires, **not a full-stack engineering service or a live
build certification**: it never judges whether the chosen
contract is the right contract commercially, whether a declared
slice really exercises the store, whether Access-style
authorization is correctly scoped, or whether the real code is
actually readable — only that the record contains what the
skill's sections and anti-patterns demand, and that its declared
rows are internally consistent.

Named exclusions: no numeric thresholds beyond the skill's own
stated ≥44px attestation (see the declined list above); no live
verification of any declared fact; no code or repository
inspection (secrets in the repo, string-concatenated SQL, and
bare-500 responses are caller declarations, the atom reads no
repo and no code); no framework vocabulary enforcement (the
skill's stack preference — vanilla TypeScript + Web Components —
is a caller declaration, the atom does not fail a declared
backend or frontend name against a vocabulary); the skill's
cross-reference to `phased-delivery` (plan before build,
staging-first, no Docker) is carried as the caller's own
attestations in this record, not re-audited against that skill;
the skill's cross-reference to `database-sme` for data-layer
depth is likewise a caller attestation here, not re-audited.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally** — deterministic core, Python
oracle and TypeScript port built and parity-proven locally; no
endpoint is live. Release happens one by one, by the owner's GO,
per the approved queue.

## Named doubt (from the register)

Generic engineering persona
