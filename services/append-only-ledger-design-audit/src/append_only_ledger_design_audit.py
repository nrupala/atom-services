#!/usr/bin/env python3
"""Append-only ledger design audit — deterministic core.

Built from the bound skill `ledger-engineering` (v1): "Facts are
append-only. Balances are derived. If money moves, both sides are
recorded. If it can be edited, it isn't a ledger — it's a liability."

The caller submits a ledger-design evidence manifest (a dict, or JSON
on the CLI) declaring the design's invariants, write/append rules,
correction model, integrity mechanisms, and concurrency/recovery
posture — here, its reconciliation, security and recovery posture.
Every check reads one manifest field:

- field present and true/valid  -> pass
- field present and false/invalid -> fail
- field absent                   -> missing (evidence not provided)

Verdict:
- any fail            -> UNSOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass            -> SOUND

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import sys

SECTIONS = (
    "append_only",
    "money_discipline",
    "structure_and_derivation",
    "reconciliation_and_reporting",
    "security_and_recovery",
)

CORRECTION_MODELS = (
    "reversing_entry",
    "adjusting_entry",
    "reversing_or_adjusting_entry",
)

AMOUNT_REPRESENTATIONS = ("integer_minor_units", "exact_decimal")

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "ledger_name": "string",
    "version": "string",
    "append_only": {
        "events_immutable": "boolean",
        "update_on_posted_entries": "boolean",
        "delete_on_posted_entries": "boolean",
        "no_mutation_paths_verified": "boolean",
        "correction_model": "string",
        "corrections_reference_original": "boolean",
        "retention_and_legal_holds": "boolean",
    },
    "money": {
        "moves_money": "boolean",
        "double_entry": "boolean",
        "transaction_sum_zero": "boolean",
        "amount_representation": "string",
        "currency_explicit_per_entry": "boolean",
        "fx_rates_recorded_at_event_time": "boolean",
    },
    "structure": {
        "accounts_entries_transactions": "boolean",
        "transactions_atomic": "boolean",
        "stable_ids": "boolean",
        "event_fields": ["string"],
    },
    "derived_state": {
        "balances_are_projections": "boolean",
        "projections_recomputable": "boolean",
        "checkpoint_hashes": "boolean",
    },
    "reconciliation": {
        "cadence": "string",
        "discrepancy_workflow_recorded": "boolean",
        "unreconciled_period_closed_silently": "boolean",
    },
    "reporting": {
        "audit_queries_who_what_when_why": "boolean",
        "tax_ready_exports": "boolean",
    },
    "security": {
        "encryption_at_rest": "boolean",
        "scoped_access": "boolean",
    },
    "recovery": {
        "restore_drill_done": "boolean",
        "restore_replay_verified": "boolean",
    },
    "tests": {"balance_invariant_tests": "boolean"},
}


def _validate_value(value, spec, path):
    if spec == "string":
        if not isinstance(value, str):
            raise ValueError(f"{path} must be a string")
    elif spec == "boolean":
        if not isinstance(value, bool):
            raise ValueError(f"{path} must be a boolean")
    elif spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{path} must be a number")
    elif isinstance(spec, list):
        if not isinstance(value, list):
            raise ValueError(f"{path} must be a list")
        for i, item in enumerate(value):
            _validate_value(item, spec[0], f"{path}[{i}]")
    elif isinstance(spec, dict):
        if not isinstance(value, dict):
            raise ValueError(f"{path} must be an object")
        _validate_fields(value, spec, path)


def _validate_fields(obj, spec, prefix):
    for field, fspec in spec.items():
        if field not in obj:
            continue
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(obj[field], fspec, path)


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


def evaluate(manifest):
    """Return the audit dict for a ledger-design evidence manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: append_only (immutable facts, skill method 1) ----
    immutable, has_imm = _get(manifest, "append_only", "events_immutable")
    _check(results, "append_only", "events_immutable", immutable, has_imm,
           immutable is True,
           "events are immutable (skill method 1: append-only by design)")

    update, has_update = _get(manifest, "append_only",
                              "update_on_posted_entries")
    _check(results, "append_only", "no_update_on_posted_entries",
           update, has_update, update is False,
           "skill red line: never edit history — no UPDATE on posted facts")

    delete, has_delete = _get(manifest, "append_only",
                              "delete_on_posted_entries")
    _check(results, "append_only", "no_delete_on_posted_entries",
           delete, has_delete, delete is False,
           "no DELETE on posted facts (skill method 1)")

    verified, has_verified = _get(manifest, "append_only",
                                  "no_mutation_paths_verified")
    _check(results, "append_only", "no_mutation_code_paths_verified",
           verified, has_verified, verified is True,
           "quality gate: no mutation code paths on posted entries (verified)")

    correction_model, has_cm = _get(manifest, "append_only",
                                    "correction_model")
    _check(results, "append_only",
           "corrections_are_new_reversing_or_adjusting_entries",
           correction_model, has_cm,
           correction_model in CORRECTION_MODELS,
           f"correction_model={correction_model!r} "
           "(skill: corrections are new reversing/adjusting entries)")

    refs, has_refs = _get(manifest, "append_only",
                          "corrections_reference_original")
    _check(results, "append_only", "corrections_reference_originals",
           refs, has_refs, refs is True,
           "corrections reference the originals they reverse/adjust")

    retention, has_ret = _get(manifest, "append_only",
                              "retention_and_legal_holds")
    _check(results, "append_only", "retention_policy_and_legal_holds",
           retention, has_ret, retention is True,
           "retention per policy; legal holds respected")

    # ---- Section 2: money_discipline (skill method 2) ----
    moves, has_moves = _get(manifest, "money", "moves_money")
    double, has_double = _get(manifest, "money", "double_entry")
    if has_moves and moves:
        _check(results, "money_discipline",
               "double_entry_when_money_moves",
               double, has_double, double is True,
               "double-entry for anything monetary (skill method 2)")
    else:
        _check(results, "money_discipline",
               "double_entry_when_money_moves",
               moves, has_moves, True,
               "no monetary movement declared")

    sum_zero, has_sz = _get(manifest, "money", "transaction_sum_zero")
    _check(results, "money_discipline", "per_transaction_sum_zero",
           sum_zero, has_sz, sum_zero is True,
           "double-entry invariant: sum = zero per transaction")

    representation, has_repr = _get(manifest, "money",
                                    "amount_representation")
    _check(results, "money_discipline", "no_float_money",
           representation, has_repr,
           representation in AMOUNT_REPRESENTATIONS,
           f"amount_representation={representation!r} "
           "(skill red line: no float money — integer minor units or "
           "exact decimals)")

    currency, has_currency = _get(manifest, "money",
                                  "currency_explicit_per_entry")
    _check(results, "money_discipline", "currency_explicit_per_entry",
           currency, has_currency, currency is True,
           "currency explicit per entry")

    fx, has_fx = _get(manifest, "money", "fx_rates_recorded_at_event_time")
    _check(results, "money_discipline",
           "fx_rates_recorded_at_event_time",
           fx, has_fx, fx is True,
           "FX rates recorded at event time")

    # ---- Section 3: structure_and_derivation (skill methods 3-4) ----
    hierarchy, has_hier = _get(manifest, "structure",
                               "accounts_entries_transactions")
    _check(results, "structure_and_derivation",
           "accounts_entries_transactions_hierarchy",
           hierarchy, has_hier, hierarchy is True,
           "structure: accounts -> entries -> transactions")

    atomic, has_atomic = _get(manifest, "structure", "transactions_atomic")
    _check(results, "structure_and_derivation",
           "transactions_are_atomic_groups",
           atomic, has_atomic, atomic is True,
           "transactions are atomic groups of entries")

    stable_ids, has_ids = _get(manifest, "structure", "stable_ids")
    _check(results, "structure_and_derivation", "stable_ids",
           stable_ids, has_ids, stable_ids is True,
           "stable IDs for accounts, entries and transactions")

    event_fields, has_fields = _get(manifest, "structure", "event_fields")
    _check(results, "structure_and_derivation",
           "every_event_carries_timestamp_actor_source",
           event_fields, has_fields,
           isinstance(event_fields, list)
           and all(f in event_fields for f in ("timestamp", "actor",
                                               "source")),
           f"event_fields={event_fields!r} "
           "(skill: every event carries timestamp, actor, source)")

    projections, has_proj = _get(manifest, "derived_state",
                                 "balances_are_projections")
    _check(results, "structure_and_derivation",
           "balances_are_derived_projections",
           projections, has_proj, projections is True,
           "balances and reports are projections — never authoritative "
           "over the log")

    recomputable, has_recomp = _get(manifest, "derived_state",
                                    "projections_recomputable")
    _check(results, "structure_and_derivation",
           "projections_recomputable",
           recomputable, has_recomp, recomputable is True,
           "projections are recomputable and checkpointed")

    checkpoint, has_cp = _get(manifest, "derived_state",
                              "checkpoint_hashes")
    _check(results, "structure_and_derivation",
           "checkpoint_hashes_for_tamper_evidence",
           checkpoint, has_cp, checkpoint is True,
           "periodic checkpoint hashes for tamper evidence")

    # ---- Section 4: reconciliation_and_reporting (methods 5-6) ----
    cadence, has_cadence = _get(manifest, "reconciliation", "cadence")
    _check(results, "reconciliation_and_reporting",
           "reconciliation_cadence_defined",
           cadence, has_cadence,
           isinstance(cadence, str) and len(cadence.strip()) > 0,
           f"cadence={cadence!r} (ledger vs bank/processor/external "
           "statements on a cadence)")

    workflow, has_wf = _get(manifest, "reconciliation",
                            "discrepancy_workflow_recorded")
    _check(results, "reconciliation_and_reporting",
           "discrepancy_workflow_with_resolution_records",
           workflow, has_wf, workflow is True,
           "discrepancies get a workflow: found -> investigated -> "
           "resolved with record")

    silent, has_silent = _get(manifest, "reconciliation",
                              "unreconciled_period_closed_silently")
    _check(results, "reconciliation_and_reporting",
           "no_unreconciled_period_closed_silently",
           silent, has_silent, silent is False,
           "skill red line: never close an unreconciled period silently")

    audit_q, has_aq = _get(manifest, "reporting",
                           "audit_queries_who_what_when_why")
    _check(results, "reconciliation_and_reporting",
           "audit_queries_answer_who_what_when_why",
           audit_q, has_aq, audit_q is True,
           "audit queries answer who changed what, when, why; period "
           "summaries produced")

    tax, has_tax = _get(manifest, "reporting", "tax_ready_exports")
    _check(results, "reconciliation_and_reporting", "tax_ready_exports",
           tax, has_tax, tax is True,
           "tax-ready exports for the accountant")

    # ---- Section 5: security_and_recovery (method 7 + quality gates) ----
    encryption, has_enc = _get(manifest, "security", "encryption_at_rest")
    _check(results, "security_and_recovery", "encryption_at_rest",
           encryption, has_enc, encryption is True,
           "encryption at rest")

    scoped, has_scoped = _get(manifest, "security", "scoped_access")
    _check(results, "security_and_recovery", "scoped_access",
           scoped, has_scoped, scoped is True, "scoped access")

    drill, has_drill = _get(manifest, "recovery", "restore_drill_done")
    _check(results, "security_and_recovery", "restore_drill_done",
           drill, has_drill, drill is True,
           "quality gate: restore drill done; backups restore-tested")

    replay, has_replay = _get(manifest, "recovery",
                              "restore_replay_verified")
    _check(results, "security_and_recovery",
           "restore_replays_log_and_verifies_invariants",
           replay, has_replay, replay is True,
           "restore = replay the log and verify invariants")

    invariant_tests, has_it = _get(manifest, "tests",
                                   "balance_invariant_tests")
    _check(results, "security_and_recovery",
           "balance_invariant_tests_in_suite",
           invariant_tests, has_it, invariant_tests is True,
           "quality gate: balance invariant tests in the suite (sums, "
           "double-entry)")

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
        verdict = "UNSOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "SOUND"

    return {
        "service": "append-only-ledger-design-audit",
        "atom_version": "0.1.0",
        "ledger_name": manifest.get("ledger_name"),
        "version": manifest.get("version"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across five sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "APPEND-ONLY LEDGER DESIGN AUDIT",
        f"ledger_name: {verdict.get('ledger_name')}  "
        f"version: {verdict.get('version')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<32} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: append_only_ledger_design_audit.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
