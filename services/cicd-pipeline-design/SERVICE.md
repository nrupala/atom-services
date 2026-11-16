# CI/CD pipeline design — `cicd-pipeline-design`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Build CI/CD that earns its keep — fail-fast stages, caching, gated releases, artifact provenance, minutes budget aware.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Repo pipeline setup work**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the cicd-pipeline-design manifest

This atom does not design a CI/CD pipeline and exercises no
DevOps judgment. The caller submits one JSON manifest declaring
a pipeline artifact — its declared stage list with per-stage
minutes and a declared total, its determinism and pinning
record, its caching and secrets record, its minutes budget
record, its provenance record, and its deploy and gate record —
and the atom validates that artifact deterministically. Every
field below is read by the named section's checks. A field
**absent** = evidence missing (`INSUFFICIENT_EVIDENCE`); a field
present but false / invalid = the check fails
(`CICD_PIPELINE_NOT_READY`). All fields are booleans unless
noted.

| Field | Read by |
|---|---|
| `entity` (string; carried into the verdict output, not itself checked) | — |
| `pipeline.stages` (list of stage entries; absent / not a list / empty = all three computed stage checks missing) | stages_and_fail_fast |
| `pipeline.stages[].name` (string; must be non-empty for the entry to be complete; the entry names are the stage-sequence vocabulary — see the computed checks) | stages_and_fail_fast |
| `pipeline.stages[].minutes` (number; declared per-stage minutes, summed by the computed total check) | stages_and_fail_fast |
| `pipeline.declared_total_minutes` (number; computed, see below) | stages_and_fail_fast |
| `pipeline.fails_fast` | stages_and_fail_fast |
| `pipeline.reports_first_real_cause` | stages_and_fail_fast |
| `pipeline.is_primary_green_gate` | stages_and_fail_fast |
| `determinism.lockfile_enforced_installs` | determinism_and_pinning |
| `determinism.tool_versions_pinned` | determinism_and_pinning |
| `determinism.byte_exact_checkouts_where_hashes_matter` | determinism_and_pinning |
| `determinism.same_commit_same_artifact_verified` | determinism_and_pinning |
| `determinism.third_party_actions_pinned` | determinism_and_pinning |
| `determinism.unpinned_third_party_actions_present` (must be `false` to pass — skill red line) | determinism_and_pinning |
| `caching.dependency_cache_keyed_on_lockfile` | caching_and_secrets |
| `caching.build_cache_keyed_on_lockfile` | caching_and_secrets |
| `caching.secrets_cached` (must be `false` to pass — skill method step 3) | caching_and_secrets |
| `caching.test_fixtures_cached` (must be `false` to pass — skill method step 3) | caching_and_secrets |
| `secrets.from_secret_store_only` | caching_and_secrets |
| `secrets.masked_in_logs` | caching_and_secrets |
| `secrets.in_artifacts` (must be `false` to pass — skill method step 4) | caching_and_secrets |
| `secrets.error_output_scrubbed` | caching_and_secrets |
| `secrets.appeared_in_logs_or_artifacts` (must be `false` to pass — skill quality gate) | caching_and_secrets |
| `budget.estimated_minutes_per_run` (number; computed, see below) | budget_awareness |
| `budget.runs_per_month` (number; computed, see below) | budget_awareness |
| `budget.declared_monthly_minutes` (number; computed, see below) | budget_awareness |
| `budget.monthly_minutes_budget` (number; the caller's own declared budget, computed, see below) | budget_awareness |
| `budget.workflows_minimal_where_constrained` | budget_awareness |
| `budget.heavy_builds_on_owned_hardware` | budget_awareness |
| `budget.duplicates_primary_gate` (must be `false` to pass — skill method step 5) | budget_awareness |
| `provenance.checksums_published` | provenance_and_signing |
| `provenance.releases_signed` | provenance_and_signing |
| `provenance.build_outputs_retained` | provenance_and_signing |
| `provenance.manifest_hashes_retained` | provenance_and_signing |
| `provenance.release_artifacts_carry_hash_and_signature` | provenance_and_signing |
| `deploys.hitl_approval_required` | deploys_and_gates |
| `deploys.rollback_path_present` | deploys_and_gates |
| `deploys.direct_to_prod_from_laptop` (must be `false` to pass — skill method step 7) | deploys_and_gates |
| `gates.disabled_to_unblock_merge` (must be `false` to pass — skill red line) | deploys_and_gates |
| `gates.overrides_logged_with_reason` | deploys_and_gates |

Five checks are computed from the declared values, using only
what the skill itself states plus the arithmetic of the declared
numbers — no outside threshold is imported:

- **Stage entries:** every declared `pipeline.stages` entry
  must carry a non-empty `name` string and numeric `minutes`.
  A missing or empty list is missing evidence; an incomplete
  entry makes the entries check missing, and makes the sequence
  check missing when the entry carries no usable name, or the
  total check missing when it carries no usable minutes. The
  output reports `stages_evaluated` (the count of complete
  stage entries).
- **Stage sequence:** the skill's method step 1 states the
  stages — "lint → typecheck → test → build → package/sign →
  publish. Cheapest first; fail fast". The declared stage names
  (with `package_sign` as the manifest spelling of
  "package/sign") therefore pass only when they equal that
  stated sequence exactly, in that order; extra, missing,
  renamed or reordered stages fail. Entries are validated as
  strings only, never enum-checked — sequence coverage is a
  verdict check, not a type error. The output reports the
  stated stages absent from the declared names as
  `stated_stages_not_declared` (null when no stage list is
  declared, or when a stage entry carries no usable name).
- **Stage minutes total:** the declared
  `pipeline.declared_total_minutes` passes only when it equals
  the sum of the declared per-stage `minutes`. The output
  reports `computed_total_minutes` and
  `total_minutes_difference` (declared minus computed, null
  when either cannot be computed).
- **Monthly minutes:** the declared
  `budget.declared_monthly_minutes` passes only when it equals
  `budget.estimated_minutes_per_run` × `budget.runs_per_month`.
  The output reports `computed_monthly_minutes` and
  `monthly_minutes_difference` (declared minus computed, null
  when either cannot be computed).
- **Monthly minutes vs the caller's own budget:** the
  re-derived monthly minutes pass only when they do not exceed
  `budget.monthly_minutes_budget` — the budget the caller
  itself declares. The skill says pipelines must be "minutes
  budget aware" but states no budget number, so **no budget is
  imposed** — only the caller's own declared budget is
  compared. The output reports `budget_headroom_minutes`
  (declared budget minus re-derived monthly minutes, null when
  either cannot be computed).

**Fixed serialization rule:** computed amounts are reported as
strings with exactly six decimal places, produced in both
implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six
decimals; computed comparisons compare the fixed-6dp difference
to zero. That fixed serialization is what makes the Python and
TypeScript outputs byte-identical.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the five computed checks cannot be completed).

The verdict is one of `CICD_PIPELINE_READY` (all 36 checks
pass), `CICD_PIPELINE_NOT_READY` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across six sections: stages_and_fail_fast,
determinism_and_pinning, caching_and_secrets, budget_awareness,
provenance_and_signing, deploys_and_gates.

## Honest scoping

This atom audits a **declared** pipeline artifact — it does not
design the pipeline, write workflow files, run the pipeline,
verify that a declared value is true, or judge whether the
gates catch real problems. An artifact is ready *on the
caller's declared evidence* even if its underlying pipeline is
slow, flaky or fragile. It is a completeness and consistency
audit, **not a pipeline review**: it never decides whether the
stage set is right for the caller's stack beyond the skill's
own stated sequence, whether the declared minutes are accurate
(only that the declared totals are arithmetically consistent),
or whether a cache is effective (only that it is keyed as the
skill states and holds nothing the skill forbids).

**Thresholds declined — named explicitly.** The skill states
no number for any of the following, so this atom imposes none
and any future threshold must come from a skill refinement
first (binding rule R1):

- no maximum pipeline duration, per-stage duration limit, or
  monthly minutes budget (only the caller-declared
  `monthly_minutes_budget` is compared, and only the declared
  totals' arithmetic is re-derived);
- no minimum cache hit rate or cache size (the skill requires
  lockfile keying and forbids caching secrets and test
  fixtures; effectiveness is not scored);
- no mandated checksum algorithm, signature scheme, or signing
  tool (the skill requires checksums and signed releases; it
  names the `secure-build-pattern` but states no algorithm);
- no stage count beyond the skill's own stated sequence, and
  no required ordering beyond that sequence;
- no rollback time limit, approval count beyond HITL approval
  being required, or build-output retention period (the skill
  requires a rollback path, HITL approval and kept outputs; it
  states no times, counts or periods);
- no flakiness rate, retry count, or failure-rate threshold
  (the skill requires fail-fast behaviour and first-cause
  reporting; it states no rates).

Named exclusions: no production of pipeline configs or gate
reports; no verification of any declared stage, cache, secret
handling or signature against a live repository or CI system;
no judgment of test quality (what runs inside the `test` stage
is the `testing-strategy` skill's surface, not this one's); no
live verification of any declared fact.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.
