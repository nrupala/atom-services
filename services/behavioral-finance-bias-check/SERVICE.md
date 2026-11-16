# Behavioral finance bias check — `behavioral-finance-bias-check`

**Deliverable type:** CHECK. This atom sells the check it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Keep your brain out of the way — bias checks, pre-commitment, cooling-off, and decision journals.

A caller submits the inputs the bound skill works on and receives one check back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Money & markets who need this check on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Investment decision journal reviews**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the bias-check manifest

The caller submits one JSON manifest: a declared bias-check pack for
one investment decision. Every field below is read by the named
section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the
check fails (`BIAS_CHECK_FAILED`). All fields are booleans unless
noted.

| Field | Read by |
|---|---|
| `decision` (string; carried into the verdict output, not itself checked) | — |
| `decision_context.is_entry` (gates the thesis and cooling-off checks below) | precommitment_and_thesis, cooling_off |
| `decision_context.is_major_move` (gates the advisor-set check below) | watch_and_challenge |
| `bias_playbook.loss_aversion_precommitted_exits_set` | bias_playbook |
| `bias_playbook.loss_aversion_reunderwritten_instead_of_waiting_to_get_even` | bias_playbook |
| `bias_playbook.anchoring_own_valuation_written_before_market_price_targets` | bias_playbook |
| `bias_playbook.recency_base_rates_and_long_windows_used` | bias_playbook |
| `bias_playbook.overconfidence_sizing_cap_percent` (number; computed, see below) | bias_playbook |
| `bias_playbook.overconfidence_position_size_percent` (number; computed, see below) | bias_playbook |
| `bias_playbook.confirmation_disconfirming_evidence_present` | bias_playbook |
| `bias_playbook.sunk_cost_would_buy_today_test_applied` | bias_playbook |
| `bias_playbook.biases_considered` (list of `{bias, counter_applied}`; computed, see below) | bias_playbook |
| `precommitment.written_rules_present` | precommitment_and_thesis |
| `precommitment.stop_levels_set` | precommitment_and_thesis |
| `precommitment.thesis_written` (required when the decision is an entry; otherwise the check passes as not applicable) | precommitment_and_thesis |
| `cooling_off.hours_elapsed` (number; computed, see below) | cooling_off |
| `cooling_off.periods_honored_for_impulsive_ideas` | cooling_off |
| `journal.decision_recorded` | decision_journal |
| `journal.expected_outcome_recorded` | decision_journal |
| `journal.actual_outcome_and_lessons_recorded` | decision_journal |
| `journal.current_with_outcomes_and_lessons` | decision_journal |
| `journal.reviewed_monthly` | decision_journal |
| `journal.hit_rate_tracked_honestly` | decision_journal |
| `watch_and_challenge.continuous_price_watching` (must be `false` to pass) | watch_and_challenge |
| `watch_and_challenge.scheduled_reviews_used` | watch_and_challenge |
| `watch_and_challenge.notifications_off` | watch_and_challenge |
| `watch_and_challenge.devils_advocate_round_assigned` | watch_and_challenge |
| `watch_and_challenge.slept_on_material_changes` | watch_and_challenge |
| `watch_and_challenge.major_move_discussed_with_advisor_set_documented` (required when the decision is a major move; otherwise the check passes as not applicable) | watch_and_challenge |
| `temptation_and_red_lines.one_click_trading_paths_removed` | temptation_and_red_lines |
| `temptation_and_red_lines.decision_driven_by_headlines` (must be `false` to pass — skill red line) | temptation_and_red_lines |
| `temptation_and_red_lines.decision_driven_by_streaks` (must be `false` to pass — skill red line) | temptation_and_red_lines |
| `temptation_and_red_lines.decision_driven_by_moods` (must be `false` to pass — skill red line) | temptation_and_red_lines |
| `temptation_and_red_lines.journal_skipped_for_this_decision` (must be `false` to pass — skill red line) | temptation_and_red_lines |

Three checks are computed from declared values, using only what
the skill itself states or the caller declares as the limit — no
outside threshold is imported:

- **Cooling-off (48h):** the skill's FOMO/chasing counter states
  "48h cooling-off". For a declared entry decision
  (`decision_context.is_entry: true`), the declared
  `cooling_off.hours_elapsed` therefore passes only at or above
  48; equality passes, because the skill states a period, not a
  margin above it. For a non-entry decision the check passes as
  not applicable; a missing gating field makes it missing
  evidence. An absent hours value on an entry decision is
  missing evidence, not a failure.
- **Sizing cap:** the skill's overconfidence counter states
  "sizing caps" but names no number, so the cap is the caller's
  declared `overconfidence_sizing_cap_percent`: the declared
  `overconfidence_position_size_percent` passes at or below it
  and fails above it. If either number is absent, the check is
  missing evidence.
- **Counters per considered bias:** the skill's method is a
  "bias playbook with counters" — a present, non-empty
  `biases_considered` list passes only when every entry declares
  `counter_applied: true`; an empty list is present and fails; a
  missing list is missing evidence. The `bias` string is a
  caller-declared label: it is type-validated as a string only,
  never checked against a bias vocabulary, because the skill
  names example biases but states no closed list a caller must
  use.

The output also reports the computed `computed_status`
(`within_limits_on_declared_evidence` /
`outside_limits_on_declared_evidence` / null when either primary
computed check — sizing cap, cooling-off — cannot be
completed), `biases_considered_count` (the declared list length,
or null), `position_size_over_cap_percent` — the declared
position size minus the declared cap (null when either number
is undeclared) — and, for an entry decision,
`cooling_off_hours_below_48` — the stated 48 hours minus the
declared hours elapsed (null otherwise). **Fixed serialization
rule:** both derived numbers are reported as strings with
exactly four decimal places, produced in both implementations
by the same rule — round half up to 4dp,
`floor(v * 10000 + 0.5) / 10000`, then format with exactly four
decimals; comparisons use the unrounded values. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical.

The verdict is one of `BIAS_CHECK_CLEAR` (all 30 checks pass),
`BIAS_CHECK_FAILED` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across six sections: bias_playbook, precommitment_and_thesis,
cooling_off, decision_journal, watch_and_challenge,
temptation_and_red_lines.

## Honest scoping

This atom audits a **declared** bias-check pack — it does not
run the investor through a live bias interview, read their
journal or brokerage account, give investment advice, or verify
that a declared value is true. A decision is clear *on the
caller's declared evidence*: a manifest that declares
pre-committed exits, a written thesis, and 72 elapsed cooling-off
hours passes those checks even if none of it happened. It is a
completeness check of the record the skill requires, **not a
behavioural diagnosis**: it never judges whether the decision
itself is wise, whether a bias is actually present in the
investor, or whether the stated counters were applied well —
only that the record contains what the skill's playbook, method,
quality gates, and red lines demand.

Named exclusions: no check of any prose (thesis quality,
valuation quality, journal honesty are judgment, and the skill
states no vocabulary for grading them, so none is invented); no
bias vocabulary is imposed on `biases_considered[].bias` (the
skill names seven playbook biases as examples with counters —
each of those counters is checked as its own declared field —
but states no closed list for a caller's own considered set);
no cooling-off duration other than the skill's stated 48h is
checked, and it is checked only for entry decisions, the scope
the skill's FOMO counter and quality gate state; no sizing
number is imposed — the cap is caller-declared, because the
skill requires caps but states no figure; no live verification
of any declared fact.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.

## Named doubt (from the register)

Personal finance framing
