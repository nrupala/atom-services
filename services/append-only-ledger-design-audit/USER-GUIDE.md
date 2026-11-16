# Append-only ledger design audit — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are designing a ledger or audit trail. This atom reads a short evidence manifest describing the design — append-only immutability, double-entry money discipline, structure and derivation, reconciliation and reporting, security and recovery — and returns one deterministic verdict across five sections with per-check evidence: **SOUND**, **UNSOUND**, or
**INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing —
the verdict names exactly which). Same manifest in → same verdict out;
it is built to be used as a gate. A field **absent** = evidence missing
(counts toward INSUFFICIENT_EVIDENCE). A field present but
false/invalid = the check fails (counts toward UNSOUND).

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "append-only-ledger-design-audit"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/append-only-ledger-design-audit`
  — tool name `append_only_ledger_design_audit`; `tools/call` arguments = the
  manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/append-only-ledger-design-audit`
  — body = the manifest object; same `Authorization` header.

## Input — the evidence manifest

| Field | Meaning |
|---|---|
| `ledger_name`, `version` | ledger name / version; echoed in the audit, not a check |
| `append_only.events_immutable`, `.update_on_posted_entries`, `.delete_on_posted_entries`, `.no_mutation_paths_verified`, `.correction_model`, `.corrections_reference_original`, `.retention_and_legal_holds` | append-only discipline; updates/deletes on posted entries must be `false`; correction model is `reversing_entry`, `adjusting_entry`, or `reversing_or_adjusting_entry` |
| `money.moves_money`, `.double_entry`, `.transaction_sum_zero`, `.amount_representation`, `.currency_explicit_per_entry`, `.fx_rates_recorded_at_event_time` | money discipline; amount representation is `integer_minor_units` or `exact_decimal` — never floats |
| `structure.accounts_entries_transactions`, `.transactions_atomic`, `.stable_ids`, `.event_fields` | structure; every event must carry `timestamp`, `actor`, `source` |
| `derived_state.balances_are_projections`, `.projections_recomputable`, `.checkpoint_hashes` | derived state and tamper evidence |
| `reconciliation.cadence`, `.discrepancy_workflow_recorded`, `.unreconciled_period_closed_silently` | reconciliation; silently closing an unreconciled period must be `false` |
| `reporting.audit_queries_who_what_when_why`, `.tax_ready_exports` | reporting |
| `security.encryption_at_rest`, `.scoped_access`, `recovery.restore_drill_done`, `recovery.restore_replay_verified`, `tests.balance_invariant_tests` | security, recovery, invariant tests |

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/append-only-ledger-design-audit`:

```json
{
 "ledger_name": "Production Ledger",
 "version": "1.0.0",
 "append_only": {
  "events_immutable": true,
  "update_on_posted_entries": false,
  "delete_on_posted_entries": false,
  "no_mutation_paths_verified": true,
  "correction_model": "reversing_entry",
  "corrections_reference_original": true,
  "retention_and_legal_holds": true
 },
 "money": {
  "moves_money": true,
  "double_entry": true,
  "transaction_sum_zero": true,
  "amount_representation": "integer_minor_units",
  "currency_explicit_per_entry": true,
  "fx_rates_recorded_at_event_time": true
 },
 "structure": {
  "accounts_entries_transactions": true,
  "transactions_atomic": true,
  "stable_ids": true,
  "event_fields": [
   "timestamp",
   "actor",
   "source"
  ]
 },
 "derived_state": {
  "balances_are_projections": true,
  "projections_recomputable": true,
  "checkpoint_hashes": true
 },
 "reconciliation": {
  "cadence": "daily",
  "discrepancy_workflow_recorded": true,
  "unreconciled_period_closed_silently": false
 },
 "reporting": {
  "audit_queries_who_what_when_why": true,
  "tax_ready_exports": true
 },
 "security": {
  "encryption_at_rest": true,
  "scoped_access": true
 },
 "recovery": {
  "restore_drill_done": true,
  "restore_replay_verified": true
 },
 "tests": {
  "balance_invariant_tests": true
 }
}
```

Response — HTTP 200 (trimmed; the full response carries all 29 checks
and a text stamp of the verdict):

```json
{
 "service": "append-only-ledger-design-audit",
 "atom_version": "0.1.0",
 "version": "1.0.0",
 "ledger_name": "Production Ledger",
 "verdict": "SOUND",
 "sections": {
  "append_only": "pass",
  "money_discipline": "pass",
  "structure_and_derivation": "pass",
  "reconciliation_and_reporting": "pass",
  "security_and_recovery": "pass"
 },
 "summary": "29 pass, 0 fail, 0 missing of 29 checks across five sections."
}
```

## Verdicts

- **SOUND** — every check passes; the design clears all five sections.
- **UNSOUND** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope ·
`422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
