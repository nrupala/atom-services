# Decision-trap sweep — `decision-trap-sweep`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Decide deliberately — reversible vs irreversible, options, criteria, expected value, pre-mortems, decision logs.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Thinking & decisions who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Sweeping proposals before approval**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Inputs — the declared decision record

The caller submits one JSON manifest: a declared decision record. Every
field below is read by the named section's checks. A field **absent** =
evidence missing (`INSUFFICIENT_EVIDENCE`); a field present but false /
invalid = the trap is present (`TRAPS_PRESENT`). All fields are
booleans unless noted.

| Field | Read by |
|---|---|
| `decision` (string; carried into the verdict output, not itself checked) | — |
| `framing.decision_stated` | framing_and_classification |
| `framing.decide_by_named` | framing_and_classification |
| `framing.constraints_named` | framing_and_classification |
| `framing.out_of_scope_named` | framing_and_classification |
| `framing.classification` (string: `reversible` or `irreversible`; any other value fails, and it gates the rush/mood checks below) | framing_and_classification |
| `framing.stakes_assessed` | framing_and_classification |
| `options.list` (array of option names; at least 3 required — binary choices are usually false binaries) | options |
| `options.includes_status_quo` | options |
| `options.includes_smaller_reversible_step` | options |
| `criteria.criteria_listed` | criteria_before_evaluation |
| `criteria.defined_before_scoring` | criteria_before_evaluation |
| `criteria.weights_assigned_before_scoring` | criteria_before_evaluation |
| `evaluation.method_named` | evaluation_and_uncertainty |
| `evaluation.uncertainty_flagged` | evaluation_and_uncertainty |
| `evaluation.probabilities_estimable` (gates the expected-value check below) | evaluation_and_uncertainty |
| `evaluation.expected_value_used` (required when probabilities are declared estimable; otherwise the check passes as not applicable) | evaluation_and_uncertainty |
| `premortem.decision_is_material` (gates the two pre-mortem checks below) | pre_mortem |
| `premortem.conducted` (required when the decision is declared material; otherwise the check passes as not applicable) | pre_mortem |
| `premortem.top_risks_hedged` (required when the decision is declared material; otherwise the check passes as not applicable) | pre_mortem |
| `rush.made_in_rush` (must be `false` when the decision is classified irreversible; passes as not applicable for a reversible decision) | rush_and_mood_trap |
| `rush.made_in_a_mood` (must be `false` when the decision is classified irreversible; passes as not applicable for a reversible decision) | rush_and_mood_trap |
| `log.choice_recorded` | decision_log_and_review |
| `log.rationale_recorded` | decision_log_and_review |
| `log.assumptions_recorded` | decision_log_and_review |
| `log.review_date_set` | decision_log_and_review |
| `log.communicated_with_why` | decision_log_and_review |

The verdict is one of `TRAP_CLEAR` (all 24 checks pass),
`TRAPS_PRESENT` (any check fails — the named trap is present in the
record), or `INSUFFICIENT_EVIDENCE` (nothing fails but evidence is
missing), across seven sections: framing_and_classification, options,
criteria_before_evaluation, evaluation_and_uncertainty, pre_mortem,
rush_and_mood_trap, decision_log_and_review.

## Status

Tier A · status: **scaffolded** — service unit generated from the register; no endpoint is live. Release happens one by one, by the owner's GO, per the approved queue.

## Named doubt (from the register)

Commoditized advice risk; the signed-record form is the differentiator
