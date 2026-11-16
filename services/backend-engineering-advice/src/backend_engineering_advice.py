#!/usr/bin/env python3
"""Backend engineering advice — deterministic core.

Built from the bound skill `backend-engineering` (v1): "Implement
backend with production standards — API contracts, validation,
idempotency, jobs, errors, safe migrations." This atom is an AUDIT
of a declared backend pack: it validates the production practices
a caller declares against the skill's seven method steps, its four
quality gates, and its two red lines. It does not write the
backend, review the code, or judge whether the design itself is
wise — it checks that the practices the skill requires are present
on the declared evidence.

The caller submits a backend manifest (a dict, or JSON on the
CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states — no
outside threshold is imported:

- the error taxonomy must cover every category the skill names
  (method step 4: "validation vs not-found vs conflict vs
  retryable vs fatal") — the declared categories list passes only
  when it contains all five stated categories;
- idempotency keys are required exactly when mutating operations
  exist (method step 3: "idempotency keys on mutating
  operations") — the declared mutating-operation count gates the
  keys check: a count of zero passes as not applicable, a positive
  count requires the keys field to declare true;
- job practices are gated on async jobs existing, and migration
  practices on migrations existing; the migration check itself is
  the skill's own disjunction (method step 6: "migrations
  reversible or backed-up").

The computed outcome over the two primary computed checks
(taxonomy coverage, reversible-or-backed-up) is reported as
`computed_status`. The taxonomy categories the skill names but
the declaration omits are reported as
`taxonomy_categories_missing` (null when no list is declared),
and the declared mutating-operation count as
`mutating_operation_count` (null when undeclared).

Verdict:
- any fail             -> NOT_PRODUCTION_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> PRODUCTION_READY

This is a completeness audit over declared evidence, not a code
review: a pack that declares every practice passes even if the
underlying implementation is poor, and nothing here verifies that
a declared value is true.

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import sys

SECTIONS = (
    "contract_first",
    "boundary_validation",
    "idempotency",
    "error_taxonomy",
    "jobs_and_queues",
    "data_safety",
    "observability",
)

STATED_ERROR_CATEGORIES = [
    "validation",
    "not_found",
    "conflict",
    "retryable",
    "fatal",
]

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "system": "string",
    "contract": {
        "defined_before_code": "boolean",
        "inputs_defined": "boolean",
        "outputs_defined": "boolean",
        "errors_defined": "boolean",
        "versioned": "boolean",
        "kept_in_repo": "boolean",
    },
    "validation": {
        "at_boundaries": "boolean",
        "rejects_bad_input_early_with_specific_errors": "boolean",
        "clients_trusted": "boolean",
    },
    "idempotency": {
        "mutating_operation_count": "number",
        "keys_on_mutating_operations": "boolean",
        "double_sends_possible": "boolean",
        "double_charges_possible": "boolean",
        "behavior_verified": "boolean",
    },
    "errors": {
        "taxonomy_structured": "boolean",
        "taxonomy_consistent": "boolean",
        "categories_covered": ["string"],
        "validation_and_error_paths_tested": "boolean",
        "silent_catch_all_present": "boolean",
    },
    "jobs": {
        "has_async_jobs": "boolean",
        "retries_with_backoff_and_jitter": "boolean",
        "dead_letter_path_present": "boolean",
        "work_can_be_lost": "boolean",
        "status_observable": "boolean",
    },
    "data": {
        "has_migrations": "boolean",
        "migrations_reversible": "boolean",
        "migrations_backed_up": "boolean",
        "migrations_reviewed_before_live_data": "boolean",
        "constraints_enforced_in_database": "boolean",
        "plaintext_secrets_at_rest": "boolean",
        "direct_to_prod_changes": "boolean",
    },
    "observability": {
        "structured_logs_with_ids_and_timings": "boolean",
        "metrics_at_edges": "boolean",
        "trace_ids_propagated": "boolean",
        "secrets_in_logs": "boolean",
        "pii_in_logs": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise ValueError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise ValueError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise ValueError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise ValueError(f"{path} must be an object")
        _validate_fields(value, spec, path)
        return
    raise AssertionError(f"unknown manifest spec at {path}")


def _validate_fields(obj, spec, prefix):
    for field, field_spec in spec.items():
        if field not in obj:
            continue
        value = obj[field]
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(value, field_spec, path)


def _validate_manifest(manifest):
    _validate_fields(manifest, MANIFEST_SPEC, "")


def _get(manifest, *path):
    cur = manifest
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return None, False
        cur = cur[key]
    return cur, True


def _check(results, section, name, value, present, ok, evidence):
    if not present:
        status = "missing"
    else:
        status = "pass" if ok else "fail"
    results.append(
        {"section": section, "check": name, "status": status,
         "evidence": evidence}
    )


def _bool_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is True, evidence)


def _false_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is False,
           evidence)


def _gated_bool_check(results, section, name, manifest, gate_path,
                      path, evidence, na_evidence):
    gate, has_gate = _get(manifest, *gate_path)
    value, present = _get(manifest, *path)
    if not has_gate:
        _check(results, section, name, gate, False, False, evidence)
    elif gate is False:
        _check(results, section, name, gate, True, True, na_evidence)
    else:
        _check(results, section, name, value, present, value is True,
               evidence)


def _gated_false_check(results, section, name, manifest, gate_path,
                       path, evidence, na_evidence):
    gate, has_gate = _get(manifest, *gate_path)
    value, present = _get(manifest, *path)
    if not has_gate:
        _check(results, section, name, gate, False, False, evidence)
    elif gate is False:
        _check(results, section, name, gate, True, True, na_evidence)
    else:
        _check(results, section, name, value, present, value is False,
               evidence)


def evaluate(manifest):
    """Return the verdict dict for a backend-engineering manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: contract_first (skill method step 1:
    #      "Contract first: define endpoints/queues — input,
    #      output, errors, versioning — before code; keep
    #      contracts in the repo"; quality gate: "Contract
    #      documented and versioned") ----
    _bool_check(results, "contract_first", "contract_defined_before_code",
                manifest, ("contract", "defined_before_code"),
                "contract first: endpoints/queues are defined before "
                "code")
    _bool_check(results, "contract_first", "contract_inputs_defined",
                manifest, ("contract", "inputs_defined"),
                "contract first: the contract defines inputs")
    _bool_check(results, "contract_first", "contract_outputs_defined",
                manifest, ("contract", "outputs_defined"),
                "contract first: the contract defines outputs")
    _bool_check(results, "contract_first", "contract_errors_defined",
                manifest, ("contract", "errors_defined"),
                "contract first: the contract defines errors")
    _bool_check(results, "contract_first", "contract_versioned",
                manifest, ("contract", "versioned"),
                "quality gate: the contract is documented and "
                "versioned")
    _bool_check(results, "contract_first", "contracts_kept_in_repo",
                manifest, ("contract", "kept_in_repo"),
                "contract first: contracts are kept in the repo")

    # ---- Section 2: boundary_validation (skill method step 2:
    #      "Validate at boundaries: reject bad input early with
    #      specific errors; never trust clients (including your
    #      own frontend)") ----
    _bool_check(results, "boundary_validation", "validation_at_boundaries",
                manifest, ("validation", "at_boundaries"),
                "validate at boundaries: every boundary validates "
                "its input")
    _bool_check(results, "boundary_validation",
                "bad_input_rejected_early_with_specific_errors",
                manifest,
                ("validation",
                 "rejects_bad_input_early_with_specific_errors"),
                "validate at boundaries: bad input is rejected early "
                "with specific errors")
    _false_check(results, "boundary_validation", "clients_not_trusted",
                 manifest, ("validation", "clients_trusted"),
                 "validate at boundaries: clients are never trusted "
                 "(including the caller's own frontend)")

    # ---- Section 3: idempotency (skill method step 3:
    #      "Idempotency: make retries safe (idempotency keys on
    #      mutating operations; no double-sends, no
    #      double-charges)"; quality gate: "Retry/idempotency
    #      behavior verified") ----
    count, has_count = _get(
        manifest, "idempotency", "mutating_operation_count")
    keys, has_keys = _get(
        manifest, "idempotency", "keys_on_mutating_operations")
    if not has_count:
        _check(results, "idempotency",
               "idempotency_keys_on_mutating_operations",
               count, False, False,
               "idempotency: mutating operations carry idempotency "
               "keys, so retries are safe")
    elif count <= 0:
        _check(results, "idempotency",
               "idempotency_keys_on_mutating_operations",
               count, True, True,
               "no mutating operations declared")
    else:
        _check(results, "idempotency",
               "idempotency_keys_on_mutating_operations",
               keys, has_keys, keys is True,
               "idempotency: mutating operations carry idempotency "
               "keys, so retries are safe")
    _false_check(results, "idempotency", "no_double_sends",
                 manifest, ("idempotency", "double_sends_possible"),
                 "idempotency: retries cannot double-send")
    _false_check(results, "idempotency", "no_double_charges",
                 manifest, ("idempotency", "double_charges_possible"),
                 "idempotency: retries cannot double-charge")
    _bool_check(results, "idempotency",
                "retry_idempotency_behavior_verified",
                manifest, ("idempotency", "behavior_verified"),
                "quality gate: retry/idempotency behavior is "
                "verified")

    # ---- Section 4: error_taxonomy (skill method step 4: "Error
    #      taxonomy: validation vs not-found vs conflict vs
    #      retryable vs fatal — structured, consistent, tested";
    #      quality gate: "Validation + error paths tested (not
    #      just the happy path)"; red line: "No silent catch-all —
    #      failing loudly beats corrupting quietly") ----
    _bool_check(results, "error_taxonomy", "error_taxonomy_structured",
                manifest, ("errors", "taxonomy_structured"),
                "error taxonomy: errors are structured")
    _bool_check(results, "error_taxonomy", "error_taxonomy_consistent",
                manifest, ("errors", "taxonomy_consistent"),
                "error taxonomy: errors are consistent across the "
                "service")
    covered, has_covered = _get(manifest, "errors", "categories_covered")
    covered_is_list = has_covered and isinstance(covered, list)
    missing_categories = (
        [c for c in STATED_ERROR_CATEGORIES if c not in covered]
        if covered_is_list else None
    )
    _check(results, "error_taxonomy",
           "taxonomy_covers_all_stated_categories", covered,
           covered_is_list,
           covered_is_list and len(missing_categories) == 0,
           "error taxonomy: the taxonomy covers every category the "
           "skill names — validation, not-found, conflict, "
           "retryable, fatal")
    _bool_check(results, "error_taxonomy",
                "validation_and_error_paths_tested",
                manifest, ("errors", "validation_and_error_paths_tested"),
                "quality gate: validation and error paths are tested "
                "(not just the happy path)")
    _false_check(results, "error_taxonomy", "no_silent_catch_all",
                 manifest, ("errors", "silent_catch_all_present"),
                 "red line: no silent catch-all — failing loudly "
                 "beats corrupting quietly")

    # ---- Section 5: jobs_and_queues (skill method step 5: "Jobs
    #      & queues: retries with backoff + jitter, dead-letter
    #      path, no lost work, observable status"; every check is
    #      gated on async jobs existing) ----
    _gated_bool_check(
        results, "jobs_and_queues", "job_retries_with_backoff_and_jitter",
        manifest, ("jobs", "has_async_jobs"),
        ("jobs", "retries_with_backoff_and_jitter"),
        "jobs and queues: job retries use backoff with jitter",
        "no async jobs declared")
    _gated_bool_check(
        results, "jobs_and_queues", "dead_letter_path_present",
        manifest, ("jobs", "has_async_jobs"),
        ("jobs", "dead_letter_path_present"),
        "jobs and queues: a dead-letter path exists for failed "
        "jobs",
        "no async jobs declared")
    _gated_false_check(
        results, "jobs_and_queues", "no_lost_work",
        manifest, ("jobs", "has_async_jobs"),
        ("jobs", "work_can_be_lost"),
        "jobs and queues: no work is lost",
        "no async jobs declared")
    _gated_bool_check(
        results, "jobs_and_queues", "job_status_observable",
        manifest, ("jobs", "has_async_jobs"),
        ("jobs", "status_observable"),
        "jobs and queues: job status is observable",
        "no async jobs declared")

    # ---- Section 6: data_safety (skill method step 6: "Data:
    #      migrations reversible or backed-up; enforce constraints
    #      in the database, not just the app; no plaintext secrets
    #      at rest"; red lines: "No unreviewed migrations on live
    #      data; no direct-to-prod changes") ----
    gate, has_gate = _get(manifest, "data", "has_migrations")
    rev, has_rev = _get(manifest, "data", "migrations_reversible")
    backed, has_backed = _get(manifest, "data", "migrations_backed_up")
    if not has_gate:
        _check(results, "data_safety",
               "migrations_reversible_or_backed_up",
               gate, False, False,
               "data: migrations are reversible or backed-up")
    elif gate is False:
        _check(results, "data_safety",
               "migrations_reversible_or_backed_up",
               gate, True, True,
               "no migrations declared")
    elif not has_rev and not has_backed:
        _check(results, "data_safety",
               "migrations_reversible_or_backed_up",
               rev, False, False,
               "data: migrations are reversible or backed-up")
    else:
        _check(results, "data_safety",
               "migrations_reversible_or_backed_up",
               rev if has_rev else backed, True,
               rev is True or backed is True,
               "data: migrations are reversible or backed-up")
    _gated_bool_check(
        results, "data_safety", "migrations_reviewed_before_live_data",
        manifest, ("data", "has_migrations"),
        ("data", "migrations_reviewed_before_live_data"),
        "red line: migrations are reviewed before they run on "
        "live data",
        "no migrations declared")
    _bool_check(results, "data_safety",
                "constraints_enforced_in_database",
                manifest, ("data", "constraints_enforced_in_database"),
                "data: constraints are enforced in the database, "
                "not just the app")
    _false_check(results, "data_safety", "no_plaintext_secrets_at_rest",
                 manifest, ("data", "plaintext_secrets_at_rest"),
                 "data: no plaintext secrets at rest")
    _false_check(results, "data_safety", "no_direct_to_prod_changes",
                 manifest, ("data", "direct_to_prod_changes"),
                 "red line: no direct-to-prod changes")

    # ---- Section 7: observability (skill method step 7:
    #      "Observability hooks: structured logs (ids, timings),
    #      metrics at edges, trace ids propagated"; quality gate:
    #      "No secrets or PII in logs") ----
    _bool_check(results, "observability",
                "structured_logs_with_ids_and_timings",
                manifest,
                ("observability", "structured_logs_with_ids_and_timings"),
                "observability: structured logs carry ids and "
                "timings")
    _bool_check(results, "observability", "metrics_at_edges",
                manifest, ("observability", "metrics_at_edges"),
                "observability: metrics are emitted at the edges")
    _bool_check(results, "observability", "trace_ids_propagated",
                manifest, ("observability", "trace_ids_propagated"),
                "observability: trace ids are propagated")
    _false_check(results, "observability", "no_secrets_in_logs",
                 manifest, ("observability", "secrets_in_logs"),
                 "quality gate: no secrets in logs")
    _false_check(results, "observability", "no_pii_in_logs",
                 manifest, ("observability", "pii_in_logs"),
                 "quality gate: no PII in logs")

    sections = {}
    for section in SECTIONS:
        sec_results = [r for r in results if r["section"] == section]
        if any(r["status"] == "fail" for r in sec_results):
            sections[section] = "fail"
        elif any(r["status"] == "missing" for r in sec_results):
            sections[section] = "insufficient_evidence"
        else:
            sections[section] = "pass"

    if any(v == "fail" for v in sections.values()):
        verdict = "NOT_PRODUCTION_READY"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "PRODUCTION_READY"

    computed_statuses = [
        r["status"] for r in results
        if r["check"] in ("taxonomy_covers_all_stated_categories",
                          "migrations_reversible_or_backed_up")
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "backend-engineering-advice",
        "atom_version": "0.1.0",
        "system": manifest.get("system"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "taxonomy_categories_missing": missing_categories,
        "mutating_operation_count": count if has_count else None,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across seven sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "BACKEND ENGINEERING ADVICE",
        f"system: {verdict.get('system')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<24} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: backend_engineering_advice.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "PRODUCTION_READY" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
