# Lean4 formal proof — `lean4-formal-proof`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Formal verification with Lean 4 — propositions as types, structured proofs, statements you can trust.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **SAIC formal verification proof work**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Inputs — the Lean 4 proof evidence manifest

This atom does not prove theorems — proving is generative work. It
audits a *declared* Lean 4 proof artifact: the caller submits one
JSON manifest declaring the proof's setup, statements, definitions,
proof integrity, per-theorem declarations, build attestation and
model alignment. Every field below is read by the named section's
checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the
check fails (`NOT_VERIFIED`). All fields are booleans unless noted.

| Field | Read by |
|---|---|
| `project` (string; carried into the verdict output, not itself checked) | — |
| `setup.toolchain_pinned` | project_setup |
| `setup.versions_pinned` | project_setup |
| `setup.ci_runs_lake_build` | project_setup |
| `setup.lake_build_green` | project_setup |
| `statements.stated_before_proving` | statement_integrity |
| `statements.meaning_checked_before_proving` | statement_integrity |
| `statements.reviewed_independently_of_tactics` | statement_integrity |
| `statements.weakened_silently` (must be `false` to pass) | statement_integrity |
| `statements.unproven_claims_presented_as_verified` (must be `false` to pass) | statement_integrity |
| `definitions.total` | definitions_and_model |
| `definitions.executable` | definitions_and_model |
| `definitions.specs_separate_from_implementation` | definitions_and_model |
| `proof.structured_and_readable` | proof_integrity |
| `proof.cheating_items_tracked_as_tickets` | proof_integrity |
| `proof.cheating_smuggled_into_deliverable` (must be `false` to pass) | proof_integrity |
| `theorems` (list of theorem declarations; absent / not a list / empty = all five computed checks missing) | theorem_declarations |
| `theorems[].name` (non-empty string) | theorem_declarations |
| `theorems[].sorry_count` (integer ≥ 0; must be `0` in every delivered theorem) | theorem_declarations |
| `theorems[].axioms` (list of strings; every entry must be a standard kernel axiom: `propext`, `Classical.choice`, `Quot.sound`) | theorem_declarations |
| `theorems[].native_decide_used` (must be `false` in every delivered theorem) | theorem_declarations |
| `theorems[].kernel_checked` (must be `true` in every delivered theorem) | theorem_declarations |
| `attestation.build_log_retained` | build_attestation |
| `attestation.axiom_audit_performed` | build_attestation |
| `attestation.reproduction_recipe_present` | build_attestation |
| `alignment.mapping_documented` | model_alignment |
| `alignment.changes_ported_through_model` | model_alignment |
| `alignment.model_and_implementation_in_sync` | model_alignment |

Five checks are computed, not declared: the `theorems` list is
checked for well-formedness, zero `sorry` in every theorem, no
axioms beyond the standard kernel axioms, no `native_decide`
shortcuts, and kernel-check status on every theorem. The verdict
dict also reports `theorems_evaluated` and `theorems_with_sorry`
counts.

The verdict is one of `VERIFIED` (all 26 checks pass),
`NOT_VERIFIED` (any check fails — one failure breaks the claim), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across seven sections: project_setup, statement_integrity,
definitions_and_model, proof_integrity, theorem_declarations,
build_attestation, model_alignment.

## Status

Tier A · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.

## Named doubt (from the register)

Checkable: lake build, zero sorry
