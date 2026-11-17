# Structured decision making — `structured-decision-making`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Decide deliberately — reversible vs irreversible, options, criteria, expected value, pre-mortems, decision logs. Its method is this atom's record structure: frame → options → criteria → evaluate → commit → review; speed where reversible, care where not.

A caller submits one declared structured decision record and receives one deliverable back: a deterministic verdict on that record's structure and its declared arithmetic. One unit of sale = one delivered result. **The atom makes no decision, recommends no option as the answer, ranks no option for the caller, and predicts nothing** — it audits the record the caller declares and recomputes the arithmetic the record itself declares.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Thinking & decisions who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Technical and project decisions**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the structured decision manifest

The caller submits one JSON manifest: a declared structured
decision record for one decision, made from the decision as
actually recorded. Every field below is read by the named
section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid =
the check fails (`DECISION_RECORD_NOT_SOUND`). All fields are
booleans unless noted.

| Field | Read by |
|---|---|
| `decision` (string; carried into the verdict output, not itself checked) | — |
| `framing.decision_restated_crisp` (boolean) | structured_framing |
| `framing.decide_by_date_stated` (boolean) | structured_framing |
| `framing.constraints_named` (boolean) | structured_framing |
| `framing.out_of_scope_named` (boolean) | structured_framing |
| `framing.classification` (string; computed — must be `reversible` or `irreversible`, see below) | structured_framing |
| `framing.stakes_assessed` (boolean) | structured_framing |
| `framing.effort_budget_matched_to_stakes_and_reversibility` (boolean) | structured_framing |
| `framing.slowed_deliberation_declared` (boolean; required when the classification is declared `irreversible`, see below) | structured_framing |
| `options` (list of option-row objects, each with the entry fields below; computed, see below) | structured_options, structured_matrix_scoring, structured_commit_log_and_review |
| `options[].name` (string; names the row in the computed outputs) | structured_options |
| `options[].kind` (string; computed — one of `action`, `status_quo`, `smaller_reversible_step`) | structured_options |
| `options[].scores` (list of score-row objects, each with the entry fields below; computed, see below) | structured_matrix_scoring |
| `options[].scores[].criterion` (string; must name a declared criterion) | structured_matrix_scoring |
| `options[].scores[].score` (number; computed — must lie inside the declared scale, see below) | structured_matrix_scoring |
| `options[].declared_weighted_total` (number; computed — must recompute from the declared scores × declared weights, see below) | structured_matrix_scoring |
| `criteria` (list of criterion-row objects, each with the entry fields below; computed, see below) | structured_criteria, structured_matrix_scoring |
| `criteria[].name` (string; names the row in the computed outputs) | structured_criteria |
| `criteria[].weight` (number; computed — must be non-negative, and the weights must sum positive, see below) | structured_criteria |
| `criteria[].defined_before_scoring` (boolean) | structured_criteria |
| `evaluation.method` (string; computed — one of `decision_matrix`, `expected_value`, `decision_tree`, `scenario_thinking`) | structured_evaluation_and_uncertainty |
| `evaluation.score_scale_min` (number; computed — the caller's declared scale bound) | structured_matrix_scoring |
| `evaluation.score_scale_max` (number; computed — the caller's declared scale bound) | structured_matrix_scoring |
| `evaluation.probabilities_estimable` (boolean; gates the two fitting-tool checks below) | structured_evaluation_and_uncertainty |
| `evaluation.expected_value_used` (boolean; required when probabilities are declared estimable; otherwise the check passes as not applicable) | structured_evaluation_and_uncertainty |
| `evaluation.scenario_thinking_used` (boolean; required when probabilities are declared not estimable; otherwise the check passes as not applicable) | structured_evaluation_and_uncertainty |
| `evaluation.uncertainty_flagged` (boolean) | structured_evaluation_and_uncertainty |
| `evaluation.base_rates_considered` (boolean) | structured_evaluation_and_uncertainty |
| `premortem.decision_is_material` (boolean; gates the three pre-mortem checks below) | structured_pre_mortem |
| `premortem.conducted` (boolean; required when the decision is declared material; otherwise the check passes as not applicable) | structured_pre_mortem |
| `premortem.failure_reasons_named` (boolean; required when the decision is declared material; otherwise the check passes as not applicable) | structured_pre_mortem |
| `premortem.top_reasons_fixed_or_hedged` (boolean; required when the decision is declared material; otherwise the check passes as not applicable) | structured_pre_mortem |
| `log.choice_recorded` (boolean) | structured_commit_log_and_review |
| `log.chosen_option` (string; computed — must name a declared option row, see below) | structured_commit_log_and_review |
| `log.rationale_recorded` (boolean) | structured_commit_log_and_review |
| `log.assumptions_recorded` (boolean) | structured_commit_log_and_review |
| `log.communicated_with_why` (boolean) | structured_commit_log_and_review |
| `review.review_date_set` (boolean) | structured_commit_log_and_review |
| `review.outcomes_vs_expectations_review_planned` (boolean) | structured_commit_log_and_review |
| `review.luck_separated_from_process_declared` (boolean) | structured_commit_log_and_review |
| `red_lines.decision_without_options_present` (boolean; must be `false` to pass — skill red line) | structured_red_lines |
| `red_lines.criteria_invented_after_scores_present` (boolean; must be `false` to pass — skill red line) | structured_red_lines |
| `red_lines.irreversible_decision_rushed_present` (boolean; must be `false` to pass — skill red line) | structured_red_lines |
| `red_lines.irreversible_decision_made_in_mood_present` (boolean; must be `false` to pass — skill red line) | structured_red_lines |

Fourteen checks are computed from the declared rows and
values, using only the skill's own stated rules plus the
consistency of the declared record itself — no outside
threshold is imported:

- **Classification recognised:** the declared
  `framing.classification` is `reversible` or `irreversible`.
  An absent classification is missing evidence; any other
  value fails.
- **Slowed deliberation when irreversible:** the skill binds
  care to irreversibility ("slow down, deliberate").
  `framing.slowed_deliberation_declared` is therefore required
  only when the classification is declared `irreversible`;
  for a reversible decision the check passes as not
  applicable, and an absent classification is missing evidence.
- **At least three options:** the skill states "at least
  three" options — binary choices are usually false binaries.
  The declared `options` list passes only when it names at
  least three rows; an absent list is missing evidence, a
  shorter list fails.
- **Option names unique:** no declared option `name` may
  appear on more than one row. A row with `name` absent is
  missing evidence for this check; duplicates are named in
  `duplicate_option_names`.
- **Criteria list declared:** the declared `criteria` list
  passes when it is present and names at least one criterion.
  An absent list is missing evidence; an empty list fails.
- **Criterion names unique:** as for options, with duplicates
  named in `duplicate_criterion_names`.
- **Weights sum positive:** every declared criterion declares
  a non-negative `weight`, and the declared weights must sum
  to a positive total — a matrix whose weights sum to zero
  scores nothing (internal consistency of the declared rows,
  not an imported bar; the skill states no weight-sum target
  such as 1.0 or 100, so none is checked). The sum is reported
  as `criteria_weights_sum`.
- **Every option scores every declared criterion:** each
  option's score rows cover all declared criterion names. An
  option short of full coverage is named in
  `options_without_complete_scores`, and
  `score_coverage_ratio` reports complete options ÷ declared
  options.
- **No undeclared criterion scored:** no score row names a
  criterion the record does not declare.
- **No criterion scored twice:** no option scores the same
  criterion on more than one score row.
- **Score scale bounds coherent:** the record's own declared
  `score_scale_min` does not exceed its `score_scale_max`.
  Either bound absent is missing evidence.
- **Every score within the declared scale:** every declared
  `score` lies between the record's declared scale bounds,
  inclusive. The scale is the caller's own declaration — the
  skill states no scale, so none is imposed.
- **Every declared weighted total recomputes:** every
  option's `declared_weighted_total` must recompute as
  Σ (declared criterion weight × declared score) over the
  declared criteria, compared on the fixed 6dp serialization
  below. An option complete enough to verify whose declared
  total differs is named in
  `options_with_weighted_total_mismatch`;
  `recomputed_weighted_totals` reports the recomputed total
  per option (null for an option whose scores or the weights
  are incomplete), and `weighted_total_match_ratio` reports
  recomputing options ÷ declared options.
- **Logged chosen option matches a declared option:** the
  declared `log.chosen_option` string must equal the `name`
  of a declared option row. An absent chosen option, or an
  absent options list, is missing evidence; a choice naming
  no declared option fails. **This check never compares the
  chosen option against the recomputed totals** — which
  option to commit to is the caller's decision, and the
  highest total is not this atom's answer (see Honest
  scoping).

Three check groups are conditional, following the skill's own
scoping — computed from the declared gate fields:

- **Fitting evaluation tool:** expected value / decision-tree
  evaluation is required only when
  `evaluation.probabilities_estimable` is declared `true`;
  scenario thinking is required only when it is declared
  `false` ("expected value / decision trees when probabilities
  are estimable; scenario thinking when they're not"). An
  absent gate field is missing evidence for both checks.
- **Pre-mortem for material decisions:** the quality gate
  binds the pre-mortem to material decisions, so `conducted`,
  `failure_reasons_named` and `top_reasons_fixed_or_hedged`
  are required only when `premortem.decision_is_material` is
  declared `true`; otherwise those checks pass as not
  applicable. An absent gate field is missing evidence.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the fourteen computed checks above cannot be completed),
`options_count` and `criteria_count` (the declared list
lengths, or null when the list is not declared — counts are
reported as integers, exactly), `duplicate_option_names` and
`duplicate_criterion_names` (names declared on more than one
row, in the order their second occurrence appears; null when
the underlying list is not declared), and `chosen_option`
(the declared logged choice string, or null when it is not
declared). **Fixed serialization rule:** computed quantities
are reported as strings with exactly six decimal places,
produced in both implementations by the same rule — round
half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, then
format with exactly six decimals; weighted-total comparisons
are made on the same 6dp serializations of the recomputed and
declared values. A ratio is null when its denominator list is
absent or empty, or when the criteria/weights it needs are
incomplete. That fixed serialization is what makes the Python
and TypeScript outputs byte-identical.

The skill states no numeric threshold beyond "at least three"
options — so no numeric threshold check is invented beyond the
skill's own count and the internal consistency of the declared
rows. Quantities are computed and reported; the only bars on
the computed rows are exact recomputation, the caller's own
declared scale, and completeness over the caller's own
declared rows, exactly as stated above. Declined thresholds,
named: a criterion weight-sum target (1.0, 100, or any other —
weights are checked non-negative and positive in total, never
against a target sum); a score scale of the atom's own (no
0–5, 0–10 or 1–100 scale is imposed — only the record's
declared bounds bind its scores); a minimum winning margin or
a rule that the chosen option must hold the highest (or any
rank of) recomputed total — **declined by design: picking the
winner from the totals would be a recommendation, and this
atom recommends nothing**; a stakes level or numeric
stakes × reversibility effort formula (stakes and the effort
match are caller declarations); a probability, expected-value
or scenario-quality bar (the fitting tool's use is declared
and gated on the caller's estimability declaration; no
expected value is computed, because the record declares no
probabilities); a base-rate value or reference-class bar
(base rates are declared considered; sourcing and recomputing
a base rate is the `base-rate-card` atom's ground); a
pre-mortem risk count or severity bar; a review interval in
days (a review date is declared set, its distance is the
caller's); any judgment that the declared criteria, weights or
scores are the right ones for this decision (only that they
are declared, ordered before scoring, complete and internally
consistent is checked).

The verdict is one of `DECISION_RECORD_SOUND` (all 46 checks
pass), `DECISION_RECORD_NOT_SOUND` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is
missing), across eight sections: structured_framing,
structured_options, structured_criteria,
structured_matrix_scoring, structured_evaluation_and_uncertainty,
structured_pre_mortem, structured_commit_log_and_review,
structured_red_lines.

## Distinct ground

The nearest siblings are `decision-process-design`,
`decision-trap-sweep`, `base-rate-card` and
`assumption-audit`. `decision-process-design` audits how a
decision process is engineered — who decides vs who informs,
pre-commitment and change-my-mind thresholds, a loss function
with costs in both directions, rigor sizing, evidence
discipline and process-vs-outcome review — over boolean and
loss-cost declarations, with no option or criterion rows and
no score matrix. `decision-trap-sweep` is bound to the same
skill as this atom and sweeps a declared record for its traps
— framing attestations, an option-name list of at least three,
criteria-set-before-scoring attestations, expected-value and
pre-mortem gating, rush/mood gating and log attestations — all
as scalar boolean declarations, with no per-option rows, no
criterion weights, no scores and no arithmetic of any kind.
`base-rate-card` audits one judgment card (claim, evidence
hierarchy, steelman, fallacy spot-check, calibration) and
recomputes a declared base rate from reference-class counts —
a probability for one claim, not a decision record.
`assumption-audit` audits a decision-process evidence manifest
of assumption attestations (framing, preset criteria, loss,
rigor, data discipline, review booleans), with no rows and no
arithmetic. This atom shares **zero checks** with any of them
(verified mechanically by enumerating `evaluate({})` check
names from every atom oracle in `services/*/src/*.py` and
comparing, plus a grep sweep over the oracles that do not
enumerate — zero overlap): every check here is a question
about the single decision RECORD's row structure and declared
arithmetic — named option rows of recognised kinds including
a status-quo row and a smaller-reversible-step row, named
criterion rows with declared non-negative weights summing
positive and declared defined before scoring, a score matrix
complete over exactly the declared criteria with every score
inside the record's own declared scale, declared weighted
totals that recompute exactly from declared scores × declared
weights, a logged choice that must name a declared option row
(and is never graded against the totals), and the framing,
classification-gated deliberation, fitting-tool gating,
materiality-gated pre-mortem, commit/review and red-line
declarations the skill wraps around that matrix. The boundary
is: the structure and declared arithmetic of one decision
record here; process engineering, trap attestations, a single
claim's base rate, and assumption attestations there.

## Honest scoping

This atom audits a **declared** decision record — it makes no
decision, generates no options or criteria, assigns no weights
or scores, runs no expected-value, decision-tree or scenario
analysis, performs no pre-mortem, and does not verify that any
declared step (criteria defined before scoring, a pre-mortem
conducted, deliberation slowed, a decision communicated) ever
actually happened. A record is sound *on the caller's declared
evidence*: a record that declares its criteria defined before
scoring, its pre-mortem conducted and every weighted total
recomputing passes those checks even if the real decision did
none of it. It is a completeness and consistency audit of the
decision record the skill requires, **not a decision service,
a recommendation engine, or a decision-quality
certification**: it never judges whether the decision is the
right one, whether the named options are the genuinely real
ones, whether the criteria and weights are the right ones,
whether the scores are fair, or whether the logged choice is
wise — only that the record contains what the skill's method,
quality gates and red lines demand, and that its declared
rows and totals are internally consistent.

Named exclusions and non-reducible parts (carried as caller
declarations only, never judged): **decide-for-me and
recommendation-shaped steps are EXCLUDED by name** — the
skill's evaluation step performed *for* the caller (generating
options, setting criteria or weights, scoring options,
computing an expected value or a decision tree, running
scenario analysis, picking or recommending the winning
option, and conducting the pre-mortem for the caller) is not
performed by this atom in any form; the atom only audits a
record in which the caller declares those steps done, and its
recomputed totals are reported per option with no ranking,
no winner and no advice attached. Also excluded: no
probability or expected-value computation (the record
declares no probabilities, and none are invented); no
verification that criteria were *actually* defined before
scoring (timing is attested in the record, never
timestamp-verified); no judgment of framing quality, stakes
level, or whether the effort truly matched them; no live
verification of any declared fact; no review of the decision's
actual outcome (the review is checked as a declared plan with
a date, never performed).

## U-13 regulatory screen

Screen classification: **(b) — screen-NO with flag-with-controls
(census class).** This atom is decision/finance-adjacent by
keyword — the bound skill names financial choices among the
decisions its method fits, its criteria examples include cost
and risk, and a decision record could be about a financial,
health or legal choice — so the screen was applied strictly,
and the atom is flagged for the owner's per-unit ruling queue
under U-13 on that adjacency. What prevents an advice reading,
as named controls: (1) the atom audits a caller-**declared**
decision record for structure and internal consistency only —
framing/classification declarations, option and criterion row
completeness, score-matrix completeness, and exact
recomputation of the caller's own declared weighted totals;
every output is a pass / fail / missing verdict on the record,
a count, a ratio, or a total recomputed from the caller's own
declared scores and weights; (2) it gives **no advice, no
recommendation and no domain guidance of any kind** — it never
says which option to choose, never ranks options, never checks
the logged choice against the recomputed totals, and takes no
position on any financial, health, legal or other domain
question the record may be about; the skill's performative
steps (deciding, evaluating *for* the caller, recommending)
are excluded from production and named as exclusions above —
this atom performs none of them, it only audits a declared
record of them; (3) it sets **no threshold** — no return,
risk, score, margin or quality bar against which a caller's
decision could be graded as good or bad (see the declined
list; the only scale that binds scores is the record's own
declared scale); (4) the record's subject is whatever decision
the caller declares — the atom reads no domain content beyond
row names the caller supplies, and no output is addressed to
a domain decision. Residual risk, stated plainly: a caller
could paste the verdict, or the recomputed totals, into their
own decision work — that is their decision, made on their
record; the artifact itself recommends nothing and decides
nothing. This is the same class as the
quant-math-derivation-sanity-check precedent (declared-record
audit, advice-shaped skill steps excluded as controls); it is
not the genuinely-open personal-financial-snapshot class,
because no personal financial position is handled and no
advice-shaped step of the skill is performed. Flagging never
blocks authoring; no deploy happens on this atom without the
owner's explicit per-unit ruling after the screen.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally — NOT deployed** —
deterministic core, Python oracle and TypeScript port built
and parity-proven locally; no endpoint is live. Release
happens one by one, by the owner's GO, per the approved queue.
