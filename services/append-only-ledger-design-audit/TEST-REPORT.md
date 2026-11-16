# Test report — append-only-ledger-design-audit

**Tester:** Gemini (`gemini-3.1-flash-lite`) via the house `custom.gemini`
connector — independent external tester (Academy Tester Doctrine: the
tester is never the builder). Gemini designed the cases from
`contract.yaml` + `SERVICE.md` and judged the recorded outputs; all HTTP
calls were executed by the verification harness against the live gateway
and recorded raw.
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal,
external metering, scopes = all live atoms.
**Evidence:** `verification/work/append-only-ledger-design-audit/evidence.json`
(cases: `cases.json`; judgment: `judgment.json`).

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete valid evidence manifest | HTTP 200, verdict `SOUND` | HTTP 200, `SOUND`, "29 pass, 0 fail, 0 missing of 29 checks across five sections." stamp present and well-formed | PASS |
| 2 | violations — deliberate contract violations | HTTP 200, verdict `UNSOUND` | HTTP 200, `UNSOUND`, failing checks: `events_immutable`, `no_update_on_posted_entries`, `every_event_carries_timestamp_actor_source` (22 pass, 3 fail, 4 missing) | PASS |
| 3 | sparse — minimal manifest | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 29 missing | PASS |
| 4 | malformed — `append_only` as a string instead of an object | HTTP 422 clean input error, never a verdict | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` (0 pass, 0 fail, 29 missing) — type-violating values were evaluated as evidence | **FAIL — finding F1** |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical verdict core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `append_only_ledger_design_audit`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200):

```json
{"service":"append-only-ledger-design-audit","atom_version":"0.1.0","ledger_name":"Production Ledger","version":"1.0.0","verdict":"SOUND","sections":{"append_only":"pass","money_discipline":"pass","structure_and_derivation":"pass","reconciliation_and_reporting":"pass","security_and_recovery":"pass"},"checks":[{"section":"append_only","check":"events_immutable","status":"pass","evidence":"events are immutable (skill method 1: append-only by design)"},{"section":"append_only","check":"no_update_on_posted_entries","status":"pass","evidence":"skill red line: never edit history — no UPDATE on posted facts"},{"section":"append_only","check":"no_delete_on_posted_entries","status":"pass","evidence":"no DELETE on posted facts (skill method 1)"},{"section":"append_only","check":"no_mutation_code_paths_verified","status":"pass","evidence":"quality gate: no mutation code paths on posted entries (verified)"},{"section":"append_only","check":"corrections_are_new_reversing_or_adjusting_entries","status":"pass","evidence":"correction_model='reversing_entry' (skill: corrections are new reversing/adjusting entries)"},{"section":"append_only","check":"corrections_reference_originals","status":"pass","evidence":"corrections reference the originals they reverse/adjust"},{"section":"append_only","check":"retention_policy_and_legal_holds","status":"pass","evidence":"retention per policy; legal holds respected"},{"section":"money_discipline","check":"double_entry_when_money_moves","status":"pass","evidence":"double-entry for anything monetary (skill method 2)"},{"section":"money_discipline","check":"per_transaction_sum_zero","status":"pass","evidence":"double-entry invariant: sum = zero per transaction"},{"section":"money_discipline","check":"no_float_money","status":"pass","evidence":"amount_representation='integer_minor_units' (skill red line: no float money — integer minor units or exact decimals)"},{"section":"money_discipline","check":"currency_explicit_per_entry","status":"pass","evidence":"currency explicit per entry"},{"section":"money_discipline","check":"fx_rates_recorded_at_event_time","status":"pass","evidence":"FX rates recorded at event time"},{"section":"structure_and_derivation","check":"accounts_entries_transactions_hierarchy","status":"pass","evidence":"structure: accounts -> entries -> transactions"},{"section":"structure_and_derivation","check":"transactions_are_atomic_groups","status":"pass","evidence":"transactions are atomic groups of entries"},{"section":"structure_and_derivation","check":"stable_ids","status":"pass","evidence":"stable IDs for accounts, entries and transactions"},{"section":"structure_and_derivation","check":"every_event_carries_timestamp_actor_source","status":"pass","evidence":"event_fields=['timestamp', 'actor', 'source'] (skill: every event carries timestamp, actor, source)"},{"section":"structure_and_derivation","check":"balances_are_derived_projections","status":"pass","evidence":"balances and reports are projections — never authoritative over the log"},{"section":"structure_and_derivation","check":"projections_recomputable","status":"pass","evidence":"projections are recomputable and checkpointed"},{"section":"structure_and_derivation","check":"checkpoint_hashes_for_tamper_evidence","status":"pass","evidence":"periodic checkpoint hashes for tamper evidence"},{"section":"reconciliation_and_reporting","check":"reconciliation_cadence_defined","status":"pass","evidence":"cadence='daily' (ledger vs bank/processor/external statements on a cadence)"},{"section":"reconciliation_and_reporting","check":"discrepancy_workflow_with_resolution_records","status":"pass","evidence":"discrepancies get a workflow: found -> investigated -> resolved with record"},{"section":"reconciliation_and_reporting","check":"no_unreconciled_period_closed_silently","status":"pass","evidence":"skill red line: never close an unreconciled period silently"},{"section":"reconciliation_and_reporting","check":"audit_queries_answer_who_what_when_why","status":"pass","evidence":"audit queries answer who changed what, when, why; period summaries produced"},{"section":"reconciliation_and_reporting","check":"tax_ready_exports","status":"pass","evidence":"tax-ready exports for the accountant"},{"section":"security_and_recovery","check":"encryption_at_rest","status":"pass","evidence":"encryption at rest"},{"section":"security_and_recovery","check":"scoped_access","status":"pass","evidence":"scoped access"},{"section":"security_and_recovery","check":"restore_drill_done","status":"pass","evidence":"quality gate: restore drill done; backups restore-tested"},{"section":"security_and_recovery","check":"restore_replays_log_and_verifies_invariants","status":"pass","evidence":"restore = replay the log and verify invariants"},{"section":"security_and_recovery","check":"balance_invariant_tests_in_suite","status":"pass","evidence":"quality gate: balance invariant tests in the suite (sums, double-entry)"}],"summary":"29 pass, 0 fail, 0 missing of 29 checks across five sections.","stamp":"APPEND-ONLY LEDGER DESIGN AUDIT\nledger_name: Production Ledger  version: 1.0.0\nVERDICT: SOUND\n  append_only                      pass\n  money_discipline                 pass\n  structure_and_derivation         pass\n  reconciliation_and_reporting     pass\n  security_and_recovery            pass\n29 pass, 0 fail, 0 missing of 29 checks across five sections."}
```

Malformed response (REST, HTTP 200 — the finding; key fields, full
response in the evidence file):

```json
{
 "service": "append-only-ledger-design-audit",
 "atom_version": "0.1.0",
 "version": "1.0.0",
 "ledger_name": "Malformed Ledger",
 "verdict": "INSUFFICIENT_EVIDENCE",
 "sections": {
  "append_only": "insufficient_evidence",
  "money_discipline": "insufficient_evidence",
  "structure_and_derivation": "insufficient_evidence",
  "reconciliation_and_reporting": "insufficient_evidence",
  "security_and_recovery": "insufficient_evidence"
 },
 "summary": "0 pass, 0 fail, 29 missing of 29 checks across five sections."
}
```

Malformed input submitted:

```json
{"ledger_name": "Malformed Ledger", "version": "1.0.0", "append_only": "should_be_an_object"}
```

## Findings

**F1 — Type-violating input returns a verdict instead of a clean input
error.** Case 4: `append_only` as a string instead of an object. Expected (test doctrine for
this program + the gateway's `invalid_input` mechanism in
`callpath.ts`): HTTP 422 `{ok:false, error:"invalid_input", field:...}`.
Actual: HTTP 200 with a `INSUFFICIENT_EVIDENCE` verdict computed over the
garbage values (0 pass, 0 fail, 29 missing of 29 checks across five sections.; failing checks: none). The atom's
handler does not validate manifest field types before evaluation.
Contract clause: SERVICE.md: Input manifest — field table. Disposition: **fix spec filed** —
`verification/fix-specs/append-only-ledger-design-audit.md`, entry `append-only-ledger-design-audit F1`.
Retest on redeploy.

No tester errors in this atom's run.

## Final verdict

**FAIL** — core verdict logic is exact on all three verdict cases,
determinism and MCP/REST parity hold, the stamp is well-formed; the
single defect is F1 (malformed-input handling).

## Retest — 2026-11-15 (fix-stream deploy 7f9cae9fdd60417eb72062905a066554)

Gateway: https://atoms.pipavia.com, gateway version 1.1.0 (health HTTP 200), deployment `7f9cae9fdd60417eb72062905a066554`. Full recorded Wave 1 battery re-run unchanged via `verification/harness.py`; judgment via `verification/gemini_judge.py` (Gemini verdict: PASS); mechanical verification from the new `evidence.json` governs where the two conflict.

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass | HTTP 200, verdict=SOUND | HTTP 200, verdict=SOUND | PASS |
| 2 | violations | HTTP 200, verdict=UNSOUND | HTTP 200, verdict=UNSOUND | PASS |
| 3 | sparse | HTTP 200, verdict=INSUFFICIENT_EVIDENCE | HTTP 200, verdict=INSUFFICIENT_EVIDENCE | PASS |
| 4 | malformed | HTTP 422, error=invalid_input | HTTP 422, error=invalid_input, field=append_only | PASS |
| 5 | determinism | byte-identical repeat (full-pass) | byte_identical=True | PASS |
| 6 | parity | MCP structuredContent deep-equal to REST (full-pass) | structured_equal=True | PASS |

F1 disposition: F1 closed — malformed now returns 422 invalid_input (field: append_only). The Wave 1 defect (HTTP 200 verdict computed over wrong-typed fields) no longer reproduces; all other recorded cases return their expected HTTP status and verdict, and the full-pass case is deterministic (byte-identical) with MCP/REST parity (structuredContent deep-equal).

Tester errors this wave: none. Gemini's judgment (PASS, no findings, no tester errors) agrees with the mechanical evidence.

**Retest verdict: PASS**

