# Backend engineering advice — `backend-engineering-advice`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Implement backend with production standards — API contracts, validation, idempotency, jobs, errors, safe migrations.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Product API and service builds**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the backend-engineering manifest

The caller submits one JSON manifest: a declared production-practice
pack for one backend service. Every field below is read by the named
section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the
check fails (`NOT_PRODUCTION_READY`). All fields are booleans unless
noted.

| Field | Read by |
|---|---|
| `system` (string; carried into the verdict output, not itself checked) | — |
| `contract.defined_before_code` | contract_first |
| `contract.inputs_defined` | contract_first |
| `contract.outputs_defined` | contract_first |
| `contract.errors_defined` | contract_first |
| `contract.versioned` | contract_first |
| `contract.kept_in_repo` | contract_first |
| `validation.at_boundaries` | boundary_validation |
| `validation.rejects_bad_input_early_with_specific_errors` | boundary_validation |
| `validation.clients_trusted` (must be `false` to pass) | boundary_validation |
| `idempotency.mutating_operation_count` (number; gates the keys check below) | idempotency |
| `idempotency.keys_on_mutating_operations` (required when the count is positive; otherwise the check passes as not applicable) | idempotency |
| `idempotency.double_sends_possible` (must be `false` to pass) | idempotency |
| `idempotency.double_charges_possible` (must be `false` to pass) | idempotency |
| `idempotency.behavior_verified` | idempotency |
| `errors.taxonomy_structured` | error_taxonomy |
| `errors.taxonomy_consistent` | error_taxonomy |
| `errors.categories_covered` (list of strings; computed, see below) | error_taxonomy |
| `errors.validation_and_error_paths_tested` | error_taxonomy |
| `errors.silent_catch_all_present` (must be `false` to pass — skill red line) | error_taxonomy |
| `jobs.has_async_jobs` (gates the four job checks below) | jobs_and_queues |
| `jobs.retries_with_backoff_and_jitter` (required when async jobs exist; otherwise the check passes as not applicable) | jobs_and_queues |
| `jobs.dead_letter_path_present` (required when async jobs exist; otherwise not applicable) | jobs_and_queues |
| `jobs.work_can_be_lost` (must be `false` to pass when async jobs exist; otherwise not applicable) | jobs_and_queues |
| `jobs.status_observable` (required when async jobs exist; otherwise not applicable) | jobs_and_queues |
| `data.has_migrations` (gates the two migration checks below) | data_safety |
| `data.migrations_reversible` (one of the pair the migration check below reads) | data_safety |
| `data.migrations_backed_up` (one of the pair the migration check below reads) | data_safety |
| `data.migrations_reviewed_before_live_data` (required when migrations exist — skill red line; otherwise not applicable) | data_safety |
| `data.constraints_enforced_in_database` | data_safety |
| `data.plaintext_secrets_at_rest` (must be `false` to pass) | data_safety |
| `data.direct_to_prod_changes` (must be `false` to pass — skill red line) | data_safety |
| `observability.structured_logs_with_ids_and_timings` | observability |
| `observability.metrics_at_edges` | observability |
| `observability.trace_ids_propagated` | observability |
| `observability.secrets_in_logs` (must be `false` to pass — quality gate) | observability |
| `observability.pii_in_logs` (must be `false` to pass — quality gate) | observability |

Three checks are computed from the declared values, using only what
the skill itself states — no outside threshold is imported:

- **Error-taxonomy coverage:** the skill's method step 4 names the
  taxonomy — "validation vs not-found vs conflict vs retryable vs
  fatal". The declared `errors.categories_covered` list therefore
  passes only when it contains all five stated categories
  (`validation`, `not_found`, `conflict`, `retryable`, `fatal`);
  extra entries do not hurt. A missing list is missing evidence,
  not a failure; an empty list is present and fails. The output
  reports the omitted stated categories as
  `taxonomy_categories_missing` (null when no list is declared).
  Entries are validated as strings only, never enum-checked —
  coverage is a verdict check, not a type error.
- **Idempotency keys:** the skill's method step 3 requires
  "idempotency keys on mutating operations". The declared
  `idempotency.mutating_operation_count` therefore gates the keys
  check: a count of zero passes as not applicable, a positive count
  requires `keys_on_mutating_operations: true` (an undeclared keys
  field is then missing evidence). An absent count is missing
  evidence. The count is also reported in the output as
  `mutating_operation_count` (null when undeclared).
- **Migrations reversible or backed-up:** the skill's method step 6
  states the disjunction itself — "migrations reversible or
  backed-up". When `data.has_migrations` is true, the check passes
  when at least one of `migrations_reversible` /
  `migrations_backed_up` declares true, fails when both declare
  false, and is missing evidence when neither is declared. When no
  migrations are declared, the check (and the reviewed-before-live
  check) passes as not applicable.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when either
primary computed check — taxonomy coverage, reversible-or-backed-up
— cannot be completed).

The verdict is one of `PRODUCTION_READY` (all 32 checks pass),
`NOT_PRODUCTION_READY` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across seven sections: contract_first, boundary_validation,
idempotency, error_taxonomy, jobs_and_queues, data_safety,
observability.

## Honest scoping

This atom audits a **declared** production-practice pack — it does
not write the backend, read the repository, run the service, or
verify that a declared value is true. A pack is production-ready
*on the caller's declared evidence*: a manifest that declares
versioned contracts, idempotency keys, and reversible migrations
passes those checks even if the underlying implementation does not
exist. It is a completeness audit of the practices the skill
requires, **not a code review and not implementation advice for a
specific endpoint**: it never judges whether the API design is
good, whether the chosen stack is right, or whether a declared
practice is actually implemented well — only that the pack
contains what the skill's method, quality gates, and red lines
demand.

Named exclusions: no check of contract prose or API ergonomics
(the skill states no vocabulary for grading them, so none is
invented); no retry-count, backoff-duration, or timeout threshold
(the skill requires backoff with jitter but states no numbers, so
none is imposed); no live verification of any declared fact; the
skill's cross-references (`secure-build-pattern`,
`observability-ops`, `testing-strategy`, `architecture-decisions`,
`dependency-governance`) are other skills' atoms, not checks here —
only the practices this skill itself states are checked, and the
secrets-at-rest / log-hygiene checks read this skill's own method
step 6 and quality gate, nothing more.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally** — deterministic core, Python
oracle and TypeScript port built and parity-proven locally; no
endpoint is live. Release happens one by one, by the owner's GO,
per the approved queue.
