# Backend engineering advice — `backend-engineering-advice`

**Backend engineering advice** · slug `backend-engineering-advice` · deliverable type DELIVERABLE · atom version 0.1.0 · status live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md)

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run (Worked example 1 below reproduces it verbatim); every value named here is from that recording.

1. **Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a key for this atom: `POST /v1/keys` with `{"atom": "backend-engineering-advice"}`. Send the key as `Authorization: Bearer <key>` on every call.
2. **Assemble the manifest.** The manifest is one JSON object: a declared record for one system. In the recorded run the system is `production-service-alpha` — a declared production-practice pack for one backend service — contract-first, boundary validation, idempotency (one mutating operation, keys declared), a five-category error taxonomy, jobs and queues, data safety (migrations declared reversible), and observability. Build yours field by field from the Input reference below; leave a field out only if you want it reported as missing evidence.
3. **Call the atom.** `POST https://atoms.pipavia.com/v1/backend-engineering-advice` with the manifest as the body and the `Authorization` header set (see How-to guides for the MCP form of the same call).
4. **Read the verdict.** The recorded run returned HTTP 200 with verdict `PRODUCTION_READY`: 32 pass, 0 fail, 0 missing of 32 checks across seven sections. Every section status is `pass` and every check status is `pass`.
5. **Use the detail.** The `checks` array names each of the 32 checks with its section and the evidence it read; `summary` counts pass / fail / missing; `stamp` is the same verdict as a plain-text stamp you can paste into a record. If any check had failed or been missing, the verdict, the section statuses and the check statuses would name exactly which — that is the subject of the third how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "backend-engineering-advice"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.
4. Call: `POST https://atoms.pipavia.com/v1/backend-engineering-advice` — body = the manifest object (see Input reference). The response is the verdict object (see Output format).

### Call via MCP

Connect your MCP client to `POST https://atoms.pipavia.com/mcp/backend-engineering-advice` with the same `Authorization: Bearer <key>` header, and call the tool `backend_engineering_advice`. The `tools/call` arguments are the manifest object itself — the same JSON you would send as the REST body. The MCP result's structured content is the same verdict object the REST face returns (external verification confirmed MCP/REST parity on the full-pass case; see TEST-REPORT.md).

### Read a failing verdict and fix the manifest

A verdict other than `PRODUCTION_READY` is not an error — it is the deliverable doing its job. Read it in this order:

1. **Verdict.** `NOT_PRODUCTION_READY` — At least one check fails; the failing checks name the breached section and the evidence against it. `INSUFFICIENT_EVIDENCE` means nothing failed but evidence is missing.
2. **Sections.** The `sections` object gives one status per section: `pass`, `fail`, or `insufficient_evidence`. Start with the sections that are not `pass`.
3. **Checks.** In the `checks` array, find entries with status `fail` (a field was present but did not meet the requirement — for a must-be-`false` field, it was declared `true`; for a computed check, the declared values did not satisfy the computed rule) and entries with status `missing` (the supporting field was absent from the manifest). Each check's `evidence` string states what the check requires.
4. **Fix the manifest, not the verdict.** For a `fail`, correct the declared value in the underlying record, then redeclare it truthfully. For a `missing`, supply the absent field. Then resubmit the whole manifest — the atom is stateless and deterministic, so the same manifest always returns the same verdict.
Worked example 2 below is a real failing run of this atom: verdict `NOT_PRODUCTION_READY`, 21 pass, 5 fail, 6 missing of 32 checks across seven sections. The failing checks are: `clients_not_trusted`, `taxonomy_covers_all_stated_categories`, `no_silent_catch_all`, `no_secrets_in_logs`, `no_pii_in_logs`.

### Handle a 422 invalid_input

A type error is rejected before any check runs — you get HTTP 422, never a verdict. The recorded malformed run for this atom (Worked example 3) returned:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "contract",
  "detail": "contract must be an object"
}
```

`field` names the offending field (`contract`) and `detail` states the expected type ("contract must be an object"). Fix that field's type in the manifest — consult the Input reference for each field's type — and resubmit. Do not drop the field to silence the 422 unless you intend it to be reported as missing evidence instead.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/backend-engineering-advice` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/backend-engineering-advice` — tool name `backend_engineering_advice`; `tools/call` arguments = the manifest object.
- **Keys:** sign up via `POST /v1/signup`, then `POST /v1/keys` with `{"atom": "backend-engineering-advice"}`. Key scope: this atom only — a key's scope for one atom never verifies for another (per `contract.yaml`, keys are per user, per atom; the key itself is regenerated on demand after authentication and never stored).

### Input reference

The manifest is one JSON object with 37 fields. All fields are booleans unless a different type is stated in the Type column. A field **absent** = evidence missing (counts toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails. Fields are grouped below exactly as SERVICE.md groups them (by the section that reads them).

#### Top level

| Field | Type | Notes |
|---|---|---|
| `system` | string | string; carried into the verdict output, not itself checked |

#### `contract_first`

| Field | Type | Notes |
|---|---|---|
| `contract.defined_before_code` | boolean | — |
| `contract.inputs_defined` | boolean | — |
| `contract.outputs_defined` | boolean | — |
| `contract.errors_defined` | boolean | — |
| `contract.versioned` | boolean | — |
| `contract.kept_in_repo` | boolean | — |

#### `boundary_validation`

| Field | Type | Notes |
|---|---|---|
| `validation.at_boundaries` | boolean | — |
| `validation.rejects_bad_input_early_with_specific_errors` | boolean | — |
| `validation.clients_trusted` | boolean | must be `false` to pass |

#### `idempotency`

| Field | Type | Notes |
|---|---|---|
| `idempotency.mutating_operation_count` | number | number; gates the keys check below |
| `idempotency.keys_on_mutating_operations` | boolean | required when the count is positive; otherwise the check passes as not applicable |
| `idempotency.double_sends_possible` | boolean | must be `false` to pass |
| `idempotency.double_charges_possible` | boolean | must be `false` to pass |
| `idempotency.behavior_verified` | boolean | — |

#### `error_taxonomy`

| Field | Type | Notes |
|---|---|---|
| `errors.taxonomy_structured` | boolean | — |
| `errors.taxonomy_consistent` | boolean | — |
| `errors.categories_covered` | array of string | list of strings; computed, see below |
| `errors.validation_and_error_paths_tested` | boolean | — |
| `errors.silent_catch_all_present` | boolean | must be `false` to pass — skill red line |

#### `jobs_and_queues`

| Field | Type | Notes |
|---|---|---|
| `jobs.has_async_jobs` | boolean | gates the four job checks below |
| `jobs.retries_with_backoff_and_jitter` | boolean | required when async jobs exist; otherwise the check passes as not applicable |
| `jobs.dead_letter_path_present` | boolean | required when async jobs exist; otherwise not applicable |
| `jobs.work_can_be_lost` | boolean | must be `false` to pass when async jobs exist; otherwise not applicable |
| `jobs.status_observable` | boolean | required when async jobs exist; otherwise not applicable |

#### `data_safety`

| Field | Type | Notes |
|---|---|---|
| `data.has_migrations` | boolean | gates the two migration checks below |
| `data.migrations_reversible` | boolean | one of the pair the migration check below reads |
| `data.migrations_backed_up` | boolean | one of the pair the migration check below reads |
| `data.migrations_reviewed_before_live_data` | boolean | required when migrations exist — skill red line; otherwise not applicable |
| `data.constraints_enforced_in_database` | boolean | — |
| `data.plaintext_secrets_at_rest` | boolean | must be `false` to pass |
| `data.direct_to_prod_changes` | boolean | must be `false` to pass — skill red line |

#### `observability`

| Field | Type | Notes |
|---|---|---|
| `observability.structured_logs_with_ids_and_timings` | boolean | — |
| `observability.metrics_at_edges` | boolean | — |
| `observability.trace_ids_propagated` | boolean | — |
| `observability.secrets_in_logs` | boolean | must be `false` to pass — quality gate |
| `observability.pii_in_logs` | boolean | must be `false` to pass — quality gate |

### Checks

The recorded full-pass response carries 32 checks across 7 sections (`contract_first`, `boundary_validation`, `idempotency`, `error_taxonomy`, `jobs_and_queues`, `data_safety`, `observability`). Every check is listed below with the requirement stated in its recorded `evidence` string. General semantics: a check's status is `pass` when its requirement is met on the declared values, `fail` when the supporting field is present but the requirement is not met, and `missing` when the supporting field is absent. A section's status is `pass` when all its checks pass, `fail` when any check fails, and `insufficient_evidence` when no check fails but at least one is missing.

Conditional (not-applicable) checks: `idempotency_keys_on_mutating_operations` (gated by a positive mutating-operation count), the four jobs-and-queues checks (gated by `jobs.has_async_jobs`), and `migrations_reversible_or_backed_up` plus `migrations_reviewed_before_live_data` (gated by `data.has_migrations`). When a gate is off the recorded status is `pass` (not applicable); when a gate is on, an absent required field is `missing` and a present-but-failing declaration is `fail`.

| Section | Check | What passing requires (recorded evidence) | Pass / fail / missing semantics |
|---|---|---|---|
| `contract_first` | `contract_defined_before_code` | contract first: endpoints/queues are defined before code | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `contract_first` | `contract_inputs_defined` | contract first: the contract defines inputs | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `contract_first` | `contract_outputs_defined` | contract first: the contract defines outputs | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `contract_first` | `contract_errors_defined` | contract first: the contract defines errors | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `contract_first` | `contract_versioned` | quality gate: the contract is documented and versioned | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `contract_first` | `contracts_kept_in_repo` | contract first: contracts are kept in the repo | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `boundary_validation` | `validation_at_boundaries` | validate at boundaries: every boundary validates its input | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `boundary_validation` | `bad_input_rejected_early_with_specific_errors` | validate at boundaries: bad input is rejected early with specific errors | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `boundary_validation` | `clients_not_trusted` | validate at boundaries: clients are never trusted (including the caller's own frontend) | `false` → `pass`; `true` → `fail`; absent → `missing` |
| `idempotency` | `idempotency_keys_on_mutating_operations` | idempotency: mutating operations carry idempotency keys, so retries are safe | Computed/conditional: positive mutating-operation count requires keys (`true` → `pass`, `false` → `fail`, absent → `missing`); count zero → `pass` (not applicable); count absent → `missing` |
| `idempotency` | `no_double_sends` | idempotency: retries cannot double-send | `false` → `pass`; `true` → `fail`; absent → `missing` |
| `idempotency` | `no_double_charges` | idempotency: retries cannot double-charge | `false` → `pass`; `true` → `fail`; absent → `missing` |
| `idempotency` | `retry_idempotency_behavior_verified` | quality gate: retry/idempotency behavior is verified | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `error_taxonomy` | `error_taxonomy_structured` | error taxonomy: errors are structured | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `error_taxonomy` | `error_taxonomy_consistent` | error taxonomy: errors are consistent across the service | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `error_taxonomy` | `taxonomy_covers_all_stated_categories` | error taxonomy: the taxonomy covers every category the skill names — validation, not-found, conflict, retryable, fatal | Computed: declared list contains all five stated categories → `pass`; present but incomplete (including empty) → `fail`; absent → `missing` |
| `error_taxonomy` | `validation_and_error_paths_tested` | quality gate: validation and error paths are tested (not just the happy path) | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `error_taxonomy` | `no_silent_catch_all` | red line: no silent catch-all — failing loudly beats corrupting quietly | `false` → `pass`; `true` → `fail`; absent → `missing` |
| `jobs_and_queues` | `job_retries_with_backoff_and_jitter` | jobs and queues: job retries use backoff with jitter | Conditional: required when async jobs exist (`true` → `pass`, `false` → `fail`, absent → `missing`); no async jobs → `pass` (not applicable) |
| `jobs_and_queues` | `dead_letter_path_present` | jobs and queues: a dead-letter path exists for failed jobs | Conditional: required when async jobs exist (`true` → `pass`, `false` → `fail`, absent → `missing`); no async jobs → `pass` (not applicable) |
| `jobs_and_queues` | `no_lost_work` | jobs and queues: no work is lost | Conditional: when async jobs exist, `work_can_be_lost: false` → `pass`, `true` → `fail`, absent → `missing`; no async jobs → `pass` (not applicable) |
| `jobs_and_queues` | `job_status_observable` | jobs and queues: job status is observable | Conditional: required when async jobs exist (`true` → `pass`, `false` → `fail`, absent → `missing`); no async jobs → `pass` (not applicable) |
| `data_safety` | `migrations_reversible_or_backed_up` | data: migrations are reversible or backed-up | Computed/conditional: when migrations exist, at least one of reversible / backed-up `true` → `pass`, both `false` → `fail`, neither declared → `missing`; no migrations → `pass` (not applicable) |
| `data_safety` | `migrations_reviewed_before_live_data` | red line: migrations are reviewed before they run on live data | Conditional: required when migrations exist (`true` → `pass`, `false` → `fail`, absent → `missing`); no migrations → `pass` (not applicable) |
| `data_safety` | `constraints_enforced_in_database` | data: constraints are enforced in the database, not just the app | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `data_safety` | `no_plaintext_secrets_at_rest` | data: no plaintext secrets at rest | `false` → `pass`; `true` → `fail`; absent → `missing` |
| `data_safety` | `no_direct_to_prod_changes` | red line: no direct-to-prod changes | `false` → `pass`; `true` → `fail`; absent → `missing` |
| `observability` | `structured_logs_with_ids_and_timings` | observability: structured logs carry ids and timings | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `observability` | `metrics_at_edges` | observability: metrics are emitted at the edges | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `observability` | `trace_ids_propagated` | observability: trace ids are propagated | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `observability` | `no_secrets_in_logs` | quality gate: no secrets in logs | `false` → `pass`; `true` → `fail`; absent → `missing` |
| `observability` | `no_pii_in_logs` | quality gate: no PII in logs | `false` → `pass`; `true` → `fail`; absent → `missing` |

### Output format

A successful call (HTTP 200) returns one JSON object:

| Field | Meaning |
|---|---|
| `service` | Always `"backend-engineering-advice"` |
| `atom_version` | Atom version that produced the verdict (`"0.1.0"`) |
| `system` | The declared system, carried through from the manifest (not itself checked) |
| `verdict` | One of the verdict values below |
| `sections` | Object mapping each section name to its section status (`pass` / `fail` / `insufficient_evidence`) |
| `checks` | Array of 32 objects, each `{section, check, status, evidence}` — `status` is `pass` / `fail` / `missing`; `evidence` states what the check requires |
| `computed_status` | `within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when either primary computed check (taxonomy coverage, reversible-or-backed-up) cannot be completed |
| `taxonomy_categories_missing` | Stated taxonomy categories omitted from the declared list; null when no list is declared |
| `mutating_operation_count` | The declared mutating-operation count; null when undeclared |
| `summary` | Plain-language count, e.g. the recorded full-pass summary: "32 pass, 0 fail, 0 missing of 32 checks across seven sections." |
| `stamp` | The same verdict rendered as a plain-text stamp for pasting into a record |

### Verdict vocabulary

**Verdicts** (the `verdict` field — every value this atom can return):

- `PRODUCTION_READY` — Every check passes; the service is production-ready on the declared evidence.
- `NOT_PRODUCTION_READY` — At least one check fails; the failing checks name the breached section and the evidence against it.
- `INSUFFICIENT_EVIDENCE` — Nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

**Section statuses** (values in the `sections` object): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (the `status` field of each `checks` entry): `pass` — the requirement is met on the declared values (for a conditional check whose gate is off, `pass` is recorded with not-applicable semantics — see Checks); `fail` — the supporting field is present but the requirement is not met; `missing` — the supporting field is absent, so there is no evidence to judge.

**Computed status** (the `computed_status` field, where present): see Output format — it summarises the computed checks as within / outside the stated limits on the declared evidence, or null when a primary computed check cannot be completed.

### Errors

Only the error shapes evidenced in the gateway documentation (USER-GUIDE.md) and the recorded trial runs are documented here; no other payload shapes are claimed.

- **401 — unauthenticated:** missing or invalid key. (Status and meaning per USER-GUIDE.md; no recorded body in the evidence for this atom.)
- **403 — scope:** the key lacks this atom's scope. (Status and meaning per USER-GUIDE.md; no recorded body in the evidence for this atom.)
- **422 — `invalid_input`:** a manifest field has the wrong type. Recorded body shape: `{"ok": false, "error": "invalid_input", "field": "<field>", "detail": "<detail>"}` — this atom's recorded instance is `contract` / "contract must be an object" (Worked example 3, verbatim). No verdict is returned.
- **429 — rate limit:** the per-key rate limit (below) is exceeded. (Status and meaning per USER-GUIDE.md; no recorded body in the evidence for this atom.)

### Rate limits and pricing

- **Rate limits (from `contract.yaml`):** 60 requests per key per minute; 10,000 requests per key per day. The contract notes this is the SPEC default capacity guard for open public usage, tuned per atom at build-out from measured production cost.
- **Pricing:** Free during trial — rate pending. `contract.yaml` sets pricing unit `deliverable` with `rate: null` (`rate_status: pending`); SERVICE.md states no price is set and prices are set only from measured production cost per unit.

## Explanation

What this atom does, in depth: you submit a declared record — the manifest — and the atom audits that record, deterministically, against the method, quality gates and red lines of its bound skill. It runs 32 checks grouped into 7 sections (contract_first, boundary_validation, idempotency, error_taxonomy, jobs_and_queues, data_safety, observability), computes the computed checks described below from the declared values alone, and returns a single verdict with per-section and per-check evidence. Same manifest in → same verdict out: external verification confirmed byte-identical repeat REST responses and MCP/REST parity (see TEST-REPORT.md). One unit of sale is one delivered verdict — the atom sells the deliverable it produces, never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic; there is no model judgment in the loop. Each check reads declared field(s): an **absent** field is missing evidence (check status `missing`), while a field **present but false / invalid** is a failure (check status `fail`) — that distinction is the atom's central semantics, and it drives the verdict: any `fail` produces the failing verdict; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only when every check passes does the atom return its pass verdict. Section statuses aggregate the same way (`pass` / `fail` / `insufficient_evidence`).

**Computed checks.** Three checks are computed from the declared values, using only what the bound skill itself states. **Error-taxonomy coverage:** `errors.categories_covered` passes only when it contains all five stated categories (`validation`, `not_found`, `conflict`, `retryable`, `fatal`); extra entries do not hurt; a missing list is missing evidence, an empty list is present and fails; omitted categories are reported as `taxonomy_categories_missing` (null when no list is declared); entries are validated as strings only, never enum-checked. **Idempotency keys:** `idempotency.mutating_operation_count` gates the keys check — a count of zero passes as not applicable, a positive count requires `keys_on_mutating_operations: true` (an undeclared keys field is then missing evidence), and an absent count is missing evidence; the count is reported as `mutating_operation_count` (null when undeclared). **Migrations reversible or backed-up:** when `data.has_migrations` is `true`, the check passes when at least one of `migrations_reversible` / `migrations_backed_up` declares `true`, fails when both declare `false`, and is missing evidence when neither is declared; when no migrations are declared, it passes as not applicable. The output also reports `computed_status` (null when either primary computed check — taxonomy coverage, reversible-or-backed-up — cannot be completed). The four job checks and the reviewed-before-live-data migration check are likewise conditional on their gate fields (`jobs.has_async_jobs`, `data.has_migrations`) and pass as not applicable when the gate is off.

**What it does NOT do.** This atom audits a **declared** production-practice pack — it does
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

**Buyer and use context.** First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves. Self-use (passed): see SERVICE.md — the house itself calls this atom in its own workflow, as an internal caller at zero price metered to the internal cost ledger. The recorded trial runs below are the external-verification battery for the release candidate now in its one-week RC soak.

## Role views

### For integrators

You need the verdict inside another system or agent loop. Use the REST endpoint `POST https://atoms.pipavia.com/v1/backend-engineering-advice` (or the MCP tool `backend_engineering_advice`) with a per-atom scoped key, treat HTTP 200 verdicts — including failing verdicts — as successful deliveries, and branch on `verdict`, `sections` and the per-check `status` values rather than on HTTP status. Reserve error handling for 401 / 403 / 422 / 429 (see Errors). The call is stateless and deterministic: cache or replay a manifest freely; an identical manifest returns an identical verdict. Respect the per-key limits (60/min, 10,000/day) and note pricing is free during trial with the rate pending.

### For developers

Manifest authoring: declare every field in the Input reference truthfully — omitting a field is a positive statement that the evidence does not exist (`missing`), not a neutral default, and declaring `false` where the record is actually silent converts a fixable `INSUFFICIENT_EVIDENCE` into a failing verdict. Mind the must-be-`false` fields, the computed checks (their rules are stated in full under Explanation), and the conditional gates where this atom has them. Determinism: the verdict core is a deterministic function of the manifest alone. Implementation pointers: core in `src/backend_engineering_advice.py`, tests in `tests/test_backend_engineering_advice.py` (see TEST-REPORT.md for the external battery: full-pass, violations, sparse, malformed, determinism, and MCP/REST parity).

### For ops

Endpoints: REST `POST https://atoms.pipavia.com/v1/backend-engineering-advice` and MCP `POST https://atoms.pipavia.com/mcp/backend-engineering-advice` on gateway v1.1.0 at https://atoms.pipavia.com. Keys are per user, per atom; a 403 spike means callers are presenting keys without this atom's scope, a 401 spike means missing/invalid keys, 422s mean malformed manifests naming the field in the body, and 429s mean the per-key limit (60/min, 10,000/day) is being hit — monitor those four codes separately from verdict mix, since failing verdicts are HTTP 200 by design. Status: live — release candidate (one-week RC soak to 2026-11-22); atom version 0.1.0. Pricing is free during trial (rate pending), so trial traffic is metered, not billed, per `contract.yaml`.

## Worked examples

Provenance: recorded 2026-11-16T00:43:21.623705+00:00 against gateway v1.1.0, external verification lane, source `verification/work/backend-engineering-advice/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases. Each example shows the case's recorded `input` and the REST execution's recorded `response_text`, pretty-printed with two-space indent; the JSON values are verbatim.

### Example 1 — full-pass

Request — `POST /v1/backend-engineering-advice`:

```json
{
  "system": "production-service-alpha",
  "contract": {
    "defined_before_code": true,
    "inputs_defined": true,
    "outputs_defined": true,
    "errors_defined": true,
    "versioned": true,
    "kept_in_repo": true
  },
  "validation": {
    "at_boundaries": true,
    "rejects_bad_input_early_with_specific_errors": true,
    "clients_trusted": false
  },
  "idempotency": {
    "mutating_operation_count": 1,
    "keys_on_mutating_operations": true,
    "double_sends_possible": false,
    "double_charges_possible": false,
    "behavior_verified": true
  },
  "errors": {
    "taxonomy_structured": true,
    "taxonomy_consistent": true,
    "categories_covered": [
      "validation",
      "not_found",
      "conflict",
      "retryable",
      "fatal"
    ],
    "validation_and_error_paths_tested": true,
    "silent_catch_all_present": false
  },
  "jobs": {
    "has_async_jobs": true,
    "retries_with_backoff_and_jitter": true,
    "dead_letter_path_present": true,
    "work_can_be_lost": false,
    "status_observable": true
  },
  "data": {
    "has_migrations": true,
    "migrations_reversible": true,
    "migrations_backed_up": false,
    "migrations_reviewed_before_live_data": true,
    "constraints_enforced_in_database": true,
    "plaintext_secrets_at_rest": false,
    "direct_to_prod_changes": false
  },
  "observability": {
    "structured_logs_with_ids_and_timings": true,
    "metrics_at_edges": true,
    "trace_ids_propagated": true,
    "secrets_in_logs": false,
    "pii_in_logs": false
  }
}
```

Response — HTTP 200:

```json
{
  "service": "backend-engineering-advice",
  "atom_version": "0.1.0",
  "system": "production-service-alpha",
  "verdict": "PRODUCTION_READY",
  "sections": {
    "contract_first": "pass",
    "boundary_validation": "pass",
    "idempotency": "pass",
    "error_taxonomy": "pass",
    "jobs_and_queues": "pass",
    "data_safety": "pass",
    "observability": "pass"
  },
  "checks": [
    {
      "section": "contract_first",
      "check": "contract_defined_before_code",
      "status": "pass",
      "evidence": "contract first: endpoints/queues are defined before code"
    },
    {
      "section": "contract_first",
      "check": "contract_inputs_defined",
      "status": "pass",
      "evidence": "contract first: the contract defines inputs"
    },
    {
      "section": "contract_first",
      "check": "contract_outputs_defined",
      "status": "pass",
      "evidence": "contract first: the contract defines outputs"
    },
    {
      "section": "contract_first",
      "check": "contract_errors_defined",
      "status": "pass",
      "evidence": "contract first: the contract defines errors"
    },
    {
      "section": "contract_first",
      "check": "contract_versioned",
      "status": "pass",
      "evidence": "quality gate: the contract is documented and versioned"
    },
    {
      "section": "contract_first",
      "check": "contracts_kept_in_repo",
      "status": "pass",
      "evidence": "contract first: contracts are kept in the repo"
    },
    {
      "section": "boundary_validation",
      "check": "validation_at_boundaries",
      "status": "pass",
      "evidence": "validate at boundaries: every boundary validates its input"
    },
    {
      "section": "boundary_validation",
      "check": "bad_input_rejected_early_with_specific_errors",
      "status": "pass",
      "evidence": "validate at boundaries: bad input is rejected early with specific errors"
    },
    {
      "section": "boundary_validation",
      "check": "clients_not_trusted",
      "status": "pass",
      "evidence": "validate at boundaries: clients are never trusted (including the caller's own frontend)"
    },
    {
      "section": "idempotency",
      "check": "idempotency_keys_on_mutating_operations",
      "status": "pass",
      "evidence": "idempotency: mutating operations carry idempotency keys, so retries are safe"
    },
    {
      "section": "idempotency",
      "check": "no_double_sends",
      "status": "pass",
      "evidence": "idempotency: retries cannot double-send"
    },
    {
      "section": "idempotency",
      "check": "no_double_charges",
      "status": "pass",
      "evidence": "idempotency: retries cannot double-charge"
    },
    {
      "section": "idempotency",
      "check": "retry_idempotency_behavior_verified",
      "status": "pass",
      "evidence": "quality gate: retry/idempotency behavior is verified"
    },
    {
      "section": "error_taxonomy",
      "check": "error_taxonomy_structured",
      "status": "pass",
      "evidence": "error taxonomy: errors are structured"
    },
    {
      "section": "error_taxonomy",
      "check": "error_taxonomy_consistent",
      "status": "pass",
      "evidence": "error taxonomy: errors are consistent across the service"
    },
    {
      "section": "error_taxonomy",
      "check": "taxonomy_covers_all_stated_categories",
      "status": "pass",
      "evidence": "error taxonomy: the taxonomy covers every category the skill names \u2014 validation, not-found, conflict, retryable, fatal"
    },
    {
      "section": "error_taxonomy",
      "check": "validation_and_error_paths_tested",
      "status": "pass",
      "evidence": "quality gate: validation and error paths are tested (not just the happy path)"
    },
    {
      "section": "error_taxonomy",
      "check": "no_silent_catch_all",
      "status": "pass",
      "evidence": "red line: no silent catch-all \u2014 failing loudly beats corrupting quietly"
    },
    {
      "section": "jobs_and_queues",
      "check": "job_retries_with_backoff_and_jitter",
      "status": "pass",
      "evidence": "jobs and queues: job retries use backoff with jitter"
    },
    {
      "section": "jobs_and_queues",
      "check": "dead_letter_path_present",
      "status": "pass",
      "evidence": "jobs and queues: a dead-letter path exists for failed jobs"
    },
    {
      "section": "jobs_and_queues",
      "check": "no_lost_work",
      "status": "pass",
      "evidence": "jobs and queues: no work is lost"
    },
    {
      "section": "jobs_and_queues",
      "check": "job_status_observable",
      "status": "pass",
      "evidence": "jobs and queues: job status is observable"
    },
    {
      "section": "data_safety",
      "check": "migrations_reversible_or_backed_up",
      "status": "pass",
      "evidence": "data: migrations are reversible or backed-up"
    },
    {
      "section": "data_safety",
      "check": "migrations_reviewed_before_live_data",
      "status": "pass",
      "evidence": "red line: migrations are reviewed before they run on live data"
    },
    {
      "section": "data_safety",
      "check": "constraints_enforced_in_database",
      "status": "pass",
      "evidence": "data: constraints are enforced in the database, not just the app"
    },
    {
      "section": "data_safety",
      "check": "no_plaintext_secrets_at_rest",
      "status": "pass",
      "evidence": "data: no plaintext secrets at rest"
    },
    {
      "section": "data_safety",
      "check": "no_direct_to_prod_changes",
      "status": "pass",
      "evidence": "red line: no direct-to-prod changes"
    },
    {
      "section": "observability",
      "check": "structured_logs_with_ids_and_timings",
      "status": "pass",
      "evidence": "observability: structured logs carry ids and timings"
    },
    {
      "section": "observability",
      "check": "metrics_at_edges",
      "status": "pass",
      "evidence": "observability: metrics are emitted at the edges"
    },
    {
      "section": "observability",
      "check": "trace_ids_propagated",
      "status": "pass",
      "evidence": "observability: trace ids are propagated"
    },
    {
      "section": "observability",
      "check": "no_secrets_in_logs",
      "status": "pass",
      "evidence": "quality gate: no secrets in logs"
    },
    {
      "section": "observability",
      "check": "no_pii_in_logs",
      "status": "pass",
      "evidence": "quality gate: no PII in logs"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "taxonomy_categories_missing": [],
  "mutating_operation_count": 1,
  "summary": "32 pass, 0 fail, 0 missing of 32 checks across seven sections.",
  "stamp": "BACKEND ENGINEERING ADVICE\nsystem: production-service-alpha\nVERDICT: PRODUCTION_READY\n  contract_first           pass\n  boundary_validation      pass\n  idempotency              pass\n  error_taxonomy           pass\n  jobs_and_queues          pass\n  data_safety              pass\n  observability            pass\n32 pass, 0 fail, 0 missing of 32 checks across seven sections."
}
```

### Example 2 — violations

Request — `POST /v1/backend-engineering-advice`:

```json
{
  "system": "broken-service",
  "contract": {
    "defined_before_code": true,
    "inputs_defined": true,
    "outputs_defined": true,
    "errors_defined": true,
    "versioned": true,
    "kept_in_repo": true
  },
  "validation": {
    "at_boundaries": true,
    "rejects_bad_input_early_with_specific_errors": true,
    "clients_trusted": true
  },
  "idempotency": {
    "mutating_operation_count": 0
  },
  "errors": {
    "taxonomy_structured": true,
    "taxonomy_consistent": true,
    "categories_covered": [
      "validation"
    ],
    "validation_and_error_paths_tested": true,
    "silent_catch_all_present": true
  },
  "jobs": {
    "has_async_jobs": false
  },
  "data": {
    "has_migrations": false
  },
  "observability": {
    "structured_logs_with_ids_and_timings": true,
    "metrics_at_edges": true,
    "trace_ids_propagated": true,
    "secrets_in_logs": true,
    "pii_in_logs": true
  }
}
```

Response — HTTP 200:

```json
{
  "service": "backend-engineering-advice",
  "atom_version": "0.1.0",
  "system": "broken-service",
  "verdict": "NOT_PRODUCTION_READY",
  "sections": {
    "contract_first": "pass",
    "boundary_validation": "fail",
    "idempotency": "insufficient_evidence",
    "error_taxonomy": "fail",
    "jobs_and_queues": "pass",
    "data_safety": "insufficient_evidence",
    "observability": "fail"
  },
  "checks": [
    {
      "section": "contract_first",
      "check": "contract_defined_before_code",
      "status": "pass",
      "evidence": "contract first: endpoints/queues are defined before code"
    },
    {
      "section": "contract_first",
      "check": "contract_inputs_defined",
      "status": "pass",
      "evidence": "contract first: the contract defines inputs"
    },
    {
      "section": "contract_first",
      "check": "contract_outputs_defined",
      "status": "pass",
      "evidence": "contract first: the contract defines outputs"
    },
    {
      "section": "contract_first",
      "check": "contract_errors_defined",
      "status": "pass",
      "evidence": "contract first: the contract defines errors"
    },
    {
      "section": "contract_first",
      "check": "contract_versioned",
      "status": "pass",
      "evidence": "quality gate: the contract is documented and versioned"
    },
    {
      "section": "contract_first",
      "check": "contracts_kept_in_repo",
      "status": "pass",
      "evidence": "contract first: contracts are kept in the repo"
    },
    {
      "section": "boundary_validation",
      "check": "validation_at_boundaries",
      "status": "pass",
      "evidence": "validate at boundaries: every boundary validates its input"
    },
    {
      "section": "boundary_validation",
      "check": "bad_input_rejected_early_with_specific_errors",
      "status": "pass",
      "evidence": "validate at boundaries: bad input is rejected early with specific errors"
    },
    {
      "section": "boundary_validation",
      "check": "clients_not_trusted",
      "status": "fail",
      "evidence": "validate at boundaries: clients are never trusted (including the caller's own frontend)"
    },
    {
      "section": "idempotency",
      "check": "idempotency_keys_on_mutating_operations",
      "status": "pass",
      "evidence": "no mutating operations declared"
    },
    {
      "section": "idempotency",
      "check": "no_double_sends",
      "status": "missing",
      "evidence": "idempotency: retries cannot double-send"
    },
    {
      "section": "idempotency",
      "check": "no_double_charges",
      "status": "missing",
      "evidence": "idempotency: retries cannot double-charge"
    },
    {
      "section": "idempotency",
      "check": "retry_idempotency_behavior_verified",
      "status": "missing",
      "evidence": "quality gate: retry/idempotency behavior is verified"
    },
    {
      "section": "error_taxonomy",
      "check": "error_taxonomy_structured",
      "status": "pass",
      "evidence": "error taxonomy: errors are structured"
    },
    {
      "section": "error_taxonomy",
      "check": "error_taxonomy_consistent",
      "status": "pass",
      "evidence": "error taxonomy: errors are consistent across the service"
    },
    {
      "section": "error_taxonomy",
      "check": "taxonomy_covers_all_stated_categories",
      "status": "fail",
      "evidence": "error taxonomy: the taxonomy covers every category the skill names \u2014 validation, not-found, conflict, retryable, fatal"
    },
    {
      "section": "error_taxonomy",
      "check": "validation_and_error_paths_tested",
      "status": "pass",
      "evidence": "quality gate: validation and error paths are tested (not just the happy path)"
    },
    {
      "section": "error_taxonomy",
      "check": "no_silent_catch_all",
      "status": "fail",
      "evidence": "red line: no silent catch-all \u2014 failing loudly beats corrupting quietly"
    },
    {
      "section": "jobs_and_queues",
      "check": "job_retries_with_backoff_and_jitter",
      "status": "pass",
      "evidence": "no async jobs declared"
    },
    {
      "section": "jobs_and_queues",
      "check": "dead_letter_path_present",
      "status": "pass",
      "evidence": "no async jobs declared"
    },
    {
      "section": "jobs_and_queues",
      "check": "no_lost_work",
      "status": "pass",
      "evidence": "no async jobs declared"
    },
    {
      "section": "jobs_and_queues",
      "check": "job_status_observable",
      "status": "pass",
      "evidence": "no async jobs declared"
    },
    {
      "section": "data_safety",
      "check": "migrations_reversible_or_backed_up",
      "status": "pass",
      "evidence": "no migrations declared"
    },
    {
      "section": "data_safety",
      "check": "migrations_reviewed_before_live_data",
      "status": "pass",
      "evidence": "no migrations declared"
    },
    {
      "section": "data_safety",
      "check": "constraints_enforced_in_database",
      "status": "missing",
      "evidence": "data: constraints are enforced in the database, not just the app"
    },
    {
      "section": "data_safety",
      "check": "no_plaintext_secrets_at_rest",
      "status": "missing",
      "evidence": "data: no plaintext secrets at rest"
    },
    {
      "section": "data_safety",
      "check": "no_direct_to_prod_changes",
      "status": "missing",
      "evidence": "red line: no direct-to-prod changes"
    },
    {
      "section": "observability",
      "check": "structured_logs_with_ids_and_timings",
      "status": "pass",
      "evidence": "observability: structured logs carry ids and timings"
    },
    {
      "section": "observability",
      "check": "metrics_at_edges",
      "status": "pass",
      "evidence": "observability: metrics are emitted at the edges"
    },
    {
      "section": "observability",
      "check": "trace_ids_propagated",
      "status": "pass",
      "evidence": "observability: trace ids are propagated"
    },
    {
      "section": "observability",
      "check": "no_secrets_in_logs",
      "status": "fail",
      "evidence": "quality gate: no secrets in logs"
    },
    {
      "section": "observability",
      "check": "no_pii_in_logs",
      "status": "fail",
      "evidence": "quality gate: no PII in logs"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "taxonomy_categories_missing": [
    "not_found",
    "conflict",
    "retryable",
    "fatal"
  ],
  "mutating_operation_count": 0,
  "summary": "21 pass, 5 fail, 6 missing of 32 checks across seven sections.",
  "stamp": "BACKEND ENGINEERING ADVICE\nsystem: broken-service\nVERDICT: NOT_PRODUCTION_READY\n  contract_first           pass\n  boundary_validation      fail\n  idempotency              insufficient_evidence\n  error_taxonomy           fail\n  jobs_and_queues          pass\n  data_safety              insufficient_evidence\n  observability            fail\n21 pass, 5 fail, 6 missing of 32 checks across seven sections."
}
```

### Example 3 — malformed

Request — `POST /v1/backend-engineering-advice`:

```json
{
  "system": "malformed-service",
  "contract": "not-an-object"
}
```

Response — HTTP 422:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "contract",
  "detail": "contract must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present (tutorial / how-to / reference / explanation) | Yes — Tutorial, How-to guides, Reference and Explanation sections above; output is CommonMark markdown |
| Role views present (integrators / developers / ops / regulators) | Integrators Yes; developers Yes; ops Yes; regulators N/A — Not compliance-facing: the verdict is a production-readiness completeness audit of a declared practice pack; it is not compliance or audit evidence and backend engineering practice is not itself a regulated domain for this atom. |
| Checks named (documented / recorded) | 32 / 32 — every check in the recorded full-pass response is listed under Reference → Checks |
| Verdict vocabulary complete | Yes — 3 verdict values, plus section statuses and per-check statuses |
| Input reference typed | Yes — 37 fields, each with its type, grouped as in SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass / violations / malformed inputs and REST responses compared as JSON values against `verification/work/backend-engineering-advice/evidence.json` after writing |

