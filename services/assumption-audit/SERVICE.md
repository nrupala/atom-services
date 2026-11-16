# Assumption audit — `assumption-audit`

**Deliverable type:** CHECK. This atom sells the check it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

A caller submits the inputs the bound skill works on and receives one check back, in the contract's output shape (see `contract.yaml`). One unit of sale = tokens.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Thinking & decisions who need this check on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Reviewing every plan and proposal**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Pricing

Pricing unit: **tokens**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Inputs — the decision-process evidence manifest

The caller submits one JSON manifest. Every field below is read by the
named section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the
check fails (`UNSOUND`). All fields are booleans unless noted.

| Field | Read by |
|---|---|
| `decision` (string; carried into the verdict output, not itself checked) | — |
| `framing.decision_named` | framing |
| `framing.options_listed` | framing |
| `framing.decision_maker_identified` | framing |
| `framing.objective_defined` | framing |
| `preset.criteria_set_before_data` | preset_criteria |
| `preset.default_action_set` | preset_criteria |
| `preset.change_threshold_set_before_data` | preset_criteria |
| `loss.framed_each_direction` | loss_function |
| `loss.threshold_reflects_asymmetry` | loss_function |
| `rigor.stakes_assessed` | rigor_sizing |
| `rigor.reversibility_assessed` | rigor_sizing |
| `rigor.effort_matched` | rigor_sizing |
| `data.exploratory_confirmatory_separated` | data_discipline |
| `data.conclusion_not_from_inspiring_data` | data_discipline |
| `data.evidence_could_change_decision` | data_discipline |
| `data.roles_clear` | data_discipline |
| `review.conducted` | review |
| `review.separates_decision_from_outcome` | review |

The verdict is one of `SOUND` (all 18 checks pass), `UNSOUND` (any
check fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but evidence
is missing), across six sections: framing, preset_criteria,
loss_function, rigor_sizing, data_discipline, review.

## Status

Tier A · status: **scaffolded** — service unit generated from the register; no endpoint is live. Release happens one by one, by the owner's GO, per the approved queue.

## Named doubt (from the register)

Buyers may resist paying for doubt; pair with base-rate-card
