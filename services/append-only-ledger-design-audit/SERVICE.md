# Append only ledger design audit — `append-only-ledger-design-audit`

**Deliverable type:** CHECK. This atom sells the check it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Build append-only ledgers and audit trails — double-entry where money moves, immutability, reconciliation.

A caller submits the inputs the bound skill works on and receives one check back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Money & markets who need this check on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Vault product ledger design work**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier A · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.

## Named doubt (from the register)

Invariant tests make it checkable

## Input manifest — field table

The caller submits one JSON object. Every check reads declared fields
below: present + valid → pass, present + invalid → fail, absent →
missing. Verdicts: `SOUND` (all pass), `UNSOUND` (any fail),
`INSUFFICIENT_EVIDENCE` (no fail, any missing). Output mirrors the
template atom: `service`, `atom_version`, `ledger_name`, `version`,
`verdict`, `sections`, `checks`, `summary`, plus `stamp()`.

| Field | Type | Read by check(s) |
|---|---|---|
| `ledger_name` | string | echoed subject field (no check) |
| `version` | string | echoed subject field (no check) |
| `append_only.events_immutable` | bool (`true`) | `events_immutable` |
| `append_only.update_on_posted_entries` | bool (`false`) | `no_update_on_posted_entries` |
| `append_only.delete_on_posted_entries` | bool (`false`) | `no_delete_on_posted_entries` |
| `append_only.no_mutation_paths_verified` | bool (`true`) | `no_mutation_code_paths_verified` |
| `append_only.correction_model` | string: `reversing_entry` \| `adjusting_entry` \| `reversing_or_adjusting_entry` | `corrections_are_new_reversing_or_adjusting_entries` |
| `append_only.corrections_reference_original` | bool (`true`) | `corrections_reference_originals` |
| `append_only.retention_and_legal_holds` | bool (`true`) | `retention_policy_and_legal_holds` |
| `money.moves_money` | bool | gates `double_entry_when_money_moves` (if truthy, `money.double_entry` is checked; otherwise not applicable) |
| `money.double_entry` | bool (`true` when money moves) | `double_entry_when_money_moves` |
| `money.transaction_sum_zero` | bool (`true`) | `per_transaction_sum_zero` |
| `money.amount_representation` | string: `integer_minor_units` \| `exact_decimal` | `no_float_money` |
| `money.currency_explicit_per_entry` | bool (`true`) | `currency_explicit_per_entry` |
| `money.fx_rates_recorded_at_event_time` | bool (`true`) | `fx_rates_recorded_at_event_time` |
| `structure.accounts_entries_transactions` | bool (`true`) | `accounts_entries_transactions_hierarchy` |
| `structure.transactions_atomic` | bool (`true`) | `transactions_are_atomic_groups` |
| `structure.stable_ids` | bool (`true`) | `stable_ids` |
| `structure.event_fields` | list containing `timestamp`, `actor`, `source` | `every_event_carries_timestamp_actor_source` |
| `derived_state.balances_are_projections` | bool (`true`) | `balances_are_derived_projections` |
| `derived_state.projections_recomputable` | bool (`true`) | `projections_recomputable` |
| `derived_state.checkpoint_hashes` | bool (`true`) | `checkpoint_hashes_for_tamper_evidence` |
| `reconciliation.cadence` | non-empty string | `reconciliation_cadence_defined` |
| `reconciliation.discrepancy_workflow_recorded` | bool (`true`) | `discrepancy_workflow_with_resolution_records` |
| `reconciliation.unreconciled_period_closed_silently` | bool (`false`) | `no_unreconciled_period_closed_silently` |
| `reporting.audit_queries_who_what_when_why` | bool (`true`) | `audit_queries_answer_who_what_when_why` |
| `reporting.tax_ready_exports` | bool (`true`) | `tax_ready_exports` |
| `security.encryption_at_rest` | bool (`true`) | `encryption_at_rest` |
| `security.scoped_access` | bool (`true`) | `scoped_access` |
| `recovery.restore_drill_done` | bool (`true`) | `restore_drill_done` |
| `recovery.restore_replay_verified` | bool (`true`) | `restore_replays_log_and_verifies_invariants` |
| `tests.balance_invariant_tests` | bool (`true`) | `balance_invariant_tests_in_suite` |

Sections (29 checks): `append_only` (7), `money_discipline` (5),
`structure_and_derivation` (7), `reconciliation_and_reporting` (5),
`security_and_recovery` (5).
