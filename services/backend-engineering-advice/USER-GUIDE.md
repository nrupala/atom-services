# Backend engineering advice — user guide
Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are preparing a backend service for production. This atom reads a declared production-practice pack for one backend service — contract-first, boundary validation, idempotency, error taxonomy, jobs and queues, data safety, and observability — and returns one deterministic verdict across seven sections: **PRODUCTION_READY**, **NOT_PRODUCTION_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). Computed checks: the error taxonomy must cover all five stated categories (`validation`, `not_found`, `conflict`, `retryable`, `fatal`); idempotency keys are required when mutating operations exist; and migrations, when present, must be reversible or backed up. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "backend-engineering-advice"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/backend-engineering-advice` — tool name `backend_engineering_advice`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/backend-engineering-advice` — body = the manifest object; same `Authorization` header.

## Input — the backend-engineering manifest

| Field | Meaning |
|---|---|
| `system` | system name (string; carried into the output, not checked) |
| `contract.defined_before_code` / `inputs_defined` / `outputs_defined` / `errors_defined` / `versioned` / `kept_in_repo` | contract-first evidence |
| `validation.at_boundaries` / `rejects_bad_input_early_with_specific_errors` | boundary validation evidence |
| `validation.clients_trusted` | must be `false` to pass |
| `idempotency.mutating_operation_count` (number) | computed: gates the keys check; reported as `mutating_operation_count` |
| `idempotency.keys_on_mutating_operations` | required when the count is positive; passes as not applicable at zero |
| `idempotency.double_sends_possible` / `double_charges_possible` | both must be `false` to pass |
| `idempotency.behavior_verified` | idempotency evidence |
| `errors.taxonomy_structured` / `taxonomy_consistent` / `validation_and_error_paths_tested` | error taxonomy evidence |
| `errors.categories_covered` (list of strings) | computed: must contain all five stated categories; omitted ones are reported as `taxonomy_categories_missing` |
| `errors.silent_catch_all_present` | must be `false` to pass |
| `jobs.has_async_jobs` | gates the four job checks below |
| `jobs.retries_with_backoff_and_jitter` / `dead_letter_path_present` / `status_observable` | required when async jobs exist |
| `jobs.work_can_be_lost` | must be `false` to pass when async jobs exist |
| `data.has_migrations` | gates the migration checks |
| `data.migrations_reversible` / `migrations_backed_up` | computed: at least one must be `true` when migrations exist |
| `data.migrations_reviewed_before_live_data` | required when migrations exist |
| `data.constraints_enforced_in_database` | data safety evidence |
| `data.plaintext_secrets_at_rest` / `direct_to_prod_changes` | both must be `false` to pass |
| `observability.structured_logs_with_ids_and_timings` / `metrics_at_edges` / `trace_ids_propagated` | observability evidence |
| `observability.secrets_in_logs` / `pii_in_logs` | both must be `false` to pass |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward NOT_PRODUCTION_READY).

## Worked example (real request + real response, from external testing 2026-11-15)

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

Response — HTTP 200 (trimmed; the full response carries all 32 checks and a text stamp of the verdict):

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
  "computed_status": "within_stated_limits_on_declared_evidence",
  "taxonomy_categories_missing": [],
  "mutating_operation_count": 1,
  "summary": "32 pass, 0 fail, 0 missing of 32 checks across seven sections."
}
```

## Verdicts

- **PRODUCTION_READY** — every check passes; the service is production-ready on the declared evidence.
- **NOT_PRODUCTION_READY** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `taxonomy_categories_missing` (omitted stated categories, or null when no list is declared), `mutating_operation_count` (or null when undeclared) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
