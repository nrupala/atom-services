# Behavioral finance debiasing — `behavioral-finance-debiasing`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Spots the predictable biases — fear, greed, anchoring, loss aversion — that quietly steer money decisions, and helps you debias before you act.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Money & markets who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **PAE decision debiasing work**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the debiasing manifest

The caller submits one JSON manifest: a declared debiasing pack
for one money decision. Every field below is read by the named
section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid =
the check fails (`NOT_DEBIASED`). All fields are booleans unless
noted.

| Field | Read by |
|---|---|
| `decision` (string; carried into the verdict output, not itself checked) | — |
| `context.is_big_trade` (gates the cooling-off check below) | journal_checklists_and_cooling_off |
| `bias_screening.loss_aversion_screened` | bias_screening |
| `bias_screening.disposition_effect_screened` | bias_screening |
| `bias_screening.mental_accounting_screened` | bias_screening |
| `bias_screening.anchoring_to_purchase_price_screened` | bias_screening |
| `bias_screening.recency_availability_screened` | bias_screening |
| `bias_screening.herding_fomo_screened` | bias_screening |
| `bias_screening.overconfidence_illusion_of_control_screened` | bias_screening |
| `bias_screening.confirmation_screened` | bias_screening |
| `bias_screening.sunk_cost_screened` | bias_screening |
| `bias_screening.home_bias_screened` | bias_screening |
| `bias_screening.narrative_bias_screened` | bias_screening |
| `bias_patterns.found` (list of `{bias, technique_named, surfaced_to_user}`; computed, see below) | bias_screening |
| `prospect_theory.reference_point_identified` | prospect_theory_reframing |
| `prospect_theory.framed_vs_reference_not_absolute_wealth` | prospect_theory_reframing |
| `prospect_theory.loss_asymmetry_acknowledged` | prospect_theory_reframing |
| `prospect_theory.risk_attitude_by_domain_checked` | prospect_theory_reframing |
| `prospect_theory.probability_weighting_checked` | prospect_theory_reframing |
| `precommitment.investment_policy_statement_present` | precommitment_rules |
| `precommitment.written_sell_criteria_present` | precommitment_rules |
| `precommitment.rules_decided_before_emotion_arrives` | precommitment_rules |
| `precommitment.rebalancing_target_allocation_percent` (number; computed, see below) | precommitment_rules |
| `precommitment.rebalancing_current_allocation_percent` (number; computed, see below) | precommitment_rules |
| `precommitment.rebalancing_band_percent` (number; computed, see below) | precommitment_rules |
| `journal_and_checklists.decision_journal_reasoning_recorded` | journal_checklists_and_cooling_off |
| `journal_and_checklists.decisions_reviewed_separately_from_outcomes` | journal_checklists_and_cooling_off |
| `journal_and_checklists.base_rates_used` | journal_checklists_and_cooling_off |
| `journal_and_checklists.checklists_used` | journal_checklists_and_cooling_off |
| `journal_and_checklists.cooling_off_period_taken` (required when the trade is big; otherwise the check passes as not applicable) | journal_checklists_and_cooling_off |
| `whole_portfolio.reframed_in_whole_portfolio_absolute_terms` | whole_portfolio_reframing |
| `whole_portfolio.single_position_pnl_framing_used` (must be `false` to pass) | whole_portfolio_reframing |
| `whole_portfolio.position_value` (number; computed report only, see below) | whole_portfolio_reframing |
| `whole_portfolio.whole_portfolio_value` (number; computed report only, see below) | whole_portfolio_reframing |
| `guardrails.bias_patterns_surfaced_to_user` | guardrails_and_anti_patterns |
| `guardrails.tool_calculates_user_decides` | guardrails_and_anti_patterns |
| `guardrails.not_advice_line_respected` | guardrails_and_anti_patterns |
| `guardrails.biases_used_to_manipulate` (must be `false` to pass — skill anti-pattern) | guardrails_and_anti_patterns |
| `guardrails.trade_nudge_present` (must be `false` to pass) | guardrails_and_anti_patterns |
| `guardrails.markets_assumed_perfectly_efficient_or_irrational` (must be `false` to pass — skill anti-pattern) | guardrails_and_anti_patterns |
| `guardrails.single_bias_treated_as_whole_story` (must be `false` to pass — skill anti-pattern) | guardrails_and_anti_patterns |

One check is computed against a caller-declared limit, two
checks are computed over the declared patterns list, and one
value is computed and reported only — no outside threshold is
imported:

- **Rebalancing band:** the skill's pre-commit technique names
  "rebalancing bands" but states no figures, so target, current
  allocation, and band are all caller-declared: the declared
  current allocation's distance from the declared target passes
  at or below the declared band and fails above it; equality
  passes, because the band is a limit. If any of the three
  numbers is absent, the check is missing evidence.
- **Found patterns:** every entry in the declared
  `bias_patterns.found` list must declare
  `technique_named: true` and `surfaced_to_user: true` — the
  skill's techniques are applied per bias, and its PAE rule is
  to surface the user's own patterns back to them. An empty
  list passes both checks (no found pattern lacks a technique
  or was withheld); a missing list is missing evidence. The
  `bias` string is a caller-declared label: type-validated as a
  string only, never checked against a bias vocabulary.
- **Position share (report only):** the whole-portfolio reframe
  is reported as `position_share_percent_of_portfolio` =
  100 × `position_value` / `whole_portfolio_value` (null when
  either value is undeclared or the declared whole portfolio
  value is zero). No pass/fail threshold is attached: the skill
  requires the reframe but states no limit on a position's
  share, so none is invented.

The output also reports the computed `computed_status`
(`within_declared_band_on_declared_evidence` /
`outside_declared_band_on_declared_evidence` / null when the
rebalancing check cannot be completed),
`bias_patterns_found_count` (the declared list length, or
null), and `allocation_drift_over_band_percent` — |current −
target| − band (null when any of the three numbers is
undeclared). **Fixed serialization rule:** both derived numbers
are reported as strings with exactly four decimal places,
produced in both implementations by the same rule — round half
up to 4dp, `floor(v * 10000 + 0.5) / 10000`, then format with
exactly four decimals; comparisons use the unrounded values.
That fixed serialization is what makes the Python and
TypeScript outputs byte-identical.

The verdict is one of `DEBIASED` (all 36 checks pass),
`NOT_DEBIASED` (any check fails), or `INSUFFICIENT_EVIDENCE`
(nothing fails but evidence is missing), across six sections:
bias_screening, prospect_theory_reframing, precommitment_rules,
journal_checklists_and_cooling_off, whole_portfolio_reframing,
guardrails_and_anti_patterns.

## Honest scoping

This atom audits a **declared** debiasing pack — it does not
interview the investor, detect biases in live behaviour, give
financial advice, nudge any trade, or verify that a declared
value is true. A decision is debiased *on the caller's declared
evidence*: a manifest that declares a full bias screen, an
investment policy statement, and a cooling-off period passes
those checks even if none of it happened. It is a completeness
audit of the record the skill requires, **not a behavioural
diagnosis and not advice**: it never judges whether the
decision itself is wise, whether a screened bias is actually
present, or whether a named technique was applied well — only
that the record contains what the skill's bias catalogue,
prospect-theory points, debiasing techniques, and anti-patterns
demand. The personal material in the bound skill (notes about
the owner's own positions and his product) is context for the
skill's author, not a check: nothing in it is read by this atom,
and no check is derived from it.

Named exclusions: no check of any prose (journal reasoning
quality, reframe quality are judgment, and the skill states no
vocabulary for grading them, so none is invented); no bias
vocabulary is imposed on `bias_patterns.found[].bias` (the
eleven catalogue biases are each checked as their own declared
screening field, because the skill lists them as the key money
biases to spot; a caller's found-pattern labels stay their
own); no cooling-off duration is checked — the skill requires
cooling-off periods before big trades but, unlike its sibling
skill, states no number of hours, so only that a period was
taken is checked, and only for big trades; no prospect-theory
magnitude is computed — "losses loom roughly twice as large"
is checked as an acknowledged framing point, not turned into a
loss-weight formula the skill never states as a calculation;
no rebalancing figure is imposed — target and band are
caller-declared, because the skill requires bands but states
no values; no live verification of any declared fact.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally** — deterministic core, Python
oracle and TypeScript port built and parity-proven locally; no
endpoint is live. Release happens one by one, by the owner's GO,
per the approved queue.

## Named doubt (from the register)

Overlaps behavioral-finance
