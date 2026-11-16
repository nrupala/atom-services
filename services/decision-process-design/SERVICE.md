# Decision process design — `decision-process-design`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Engineers the decision itself — what is actually being decided, what would change the answer, and how you will know if it worked (Cassie Kozyrkov's discipline).

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Thinking & decisions who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Product decision framing work**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the decision-process manifest

The caller submits one JSON manifest: a declared decision-process
record for one decision. Every field below is read by the named
section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the
check fails (`DECISION_PROCESS_NOT_SOUND`). All fields are booleans
unless noted — every non-boolean field carries an explicit type
note in its row.

| Field | Read by |
|---|---|
| `decision` (string; carried into the verdict output, not itself checked) | — |
| `framing` (object; the framing section object — a present non-object value is rejected before evaluation) | framing_and_roles |
| `framing.decision_named` | framing_and_roles |
| `framing.decision_maker_identified` | framing_and_roles |
| `framing.objective_stated` | framing_and_roles |
| `framing.decision_maker_defines_what_matters` | framing_and_roles |
| `framing.analyst_informs_not_decides` | framing_and_roles |
| `framing.analysis_makes_the_call_present` (must be `false` to pass — skill anti-pattern) | framing_and_roles |
| `options` (list of option-row objects, each `{name, viable}` — see the three entry fields below; computed, see below) | framing_and_roles |
| `options[]` (object; one declared option row — a present non-object entry is rejected before evaluation) | framing_and_roles |
| `options[].name` (string; names the row in the computed `options_without_*` outputs) | framing_and_roles |
| `options[].viable` | framing_and_roles |
| `criteria` (list of criterion-row objects, each `{name, set_before_data, threshold_declared}` — see the four entry fields below; computed, see below) | precommitment_before_data |
| `criteria[]` (object; one declared criterion row — a present non-object entry is rejected before evaluation) | precommitment_before_data |
| `criteria[].name` (string; names the row in the computed `criteria_without_*` outputs) | precommitment_before_data |
| `criteria[].set_before_data` | precommitment_before_data |
| `criteria[].threshold_declared` | precommitment_before_data |
| `precommitment` (object; the pre-commitment section object — a present non-object value is rejected before evaluation) | precommitment_before_data |
| `precommitment.default_action` (string; must name a declared option for the row to pass the computed matching check — an absent field is missing evidence) | precommitment_before_data |
| `precommitment.change_my_mind_threshold_stated` | precommitment_before_data |
| `precommitment.criteria_and_thresholds_set_before_data_seen` | precommitment_before_data |
| `precommitment.data_seen_before_criteria_set_present` (must be `false` to pass — skill anti-pattern) | precommitment_before_data |
| `loss` (object; the loss-function section object — a present non-object value is rejected before evaluation) | loss_stakes_and_rigor |
| `loss.loss_function_framed` | loss_stakes_and_rigor |
| `loss.cost_of_being_wrong_in_each_direction_stated` | loss_stakes_and_rigor |
| `loss.cost_of_false_action` (number; must be present and non-negative, with its pair, for the computed loss-cost check to pass — an absent field is missing evidence) | loss_stakes_and_rigor |
| `loss.cost_of_false_inaction` (number; must be present and non-negative, with its pair, for the computed loss-cost check to pass — an absent field is missing evidence) | loss_stakes_and_rigor |
| `loss.asymmetric_costs_declared` (gates the threshold-adjustment check below) | loss_stakes_and_rigor |
| `loss.threshold_adjusted_for_asymmetric_costs` (required when asymmetric costs are declared; otherwise the check passes as not applicable) | loss_stakes_and_rigor |
| `rigor` (object; the rigor section object — a present non-object value is rejected before evaluation) | loss_stakes_and_rigor |
| `rigor.stakes_assessed` | loss_stakes_and_rigor |
| `rigor.reversibility_assessed` | loss_stakes_and_rigor |
| `rigor.effort_matched_to_stakes_and_reversibility` | loss_stakes_and_rigor |
| `rigor.data_gathering_worth_assessed` | loss_stakes_and_rigor |
| `rigor.irreversible_declared` (gates the slowed-down check below) | loss_stakes_and_rigor |
| `rigor.slowed_down_and_more_evidence_for_irreversible` (required when an irreversible decision is declared; otherwise the check passes as not applicable) | loss_stakes_and_rigor |
| `rigor.reversible_declared` (gates the default-to-action check below) | loss_stakes_and_rigor |
| `rigor.default_to_action_for_reversible` (required when a reversible decision is declared; otherwise the check passes as not applicable) | loss_stakes_and_rigor |
| `evidence` (object; the evidence section object — a present non-object value is rejected before evaluation) | evidence_discipline_and_review |
| `evidence.exploratory_and_confirmatory_distinguished` | evidence_discipline_and_review |
| `evidence.confirmatory_analysis_used` (gates the pre-registration check below) | evidence_discipline_and_review |
| `evidence.hypothesis_preregistered` (required when confirmatory analysis is declared in use; otherwise the check passes as not applicable) | evidence_discipline_and_review |
| `evidence.conclusion_drawn_from_inspiring_data_present` (must be `false` to pass — skill anti-pattern) | evidence_discipline_and_review |
| `evidence.evidence_has_power_to_change_decision` | evidence_discipline_and_review |
| `evidence.data_is_decoration_present` (must be `false` to pass — skill anti-pattern) | evidence_discipline_and_review |
| `evidence.acted_per_preset_criteria_after_gathering` | evidence_discipline_and_review |
| `review` (object; the review section object — a present non-object value is rejected before evaluation) | evidence_discipline_and_review |
| `review.decision_quality_reviewed_separately_from_outcome` | evidence_discipline_and_review |
| `review.decision_judged_by_process_and_information_at_time` | evidence_discipline_and_review |
| `review.outcome_used_alone_to_judge_present` (must be `false` to pass — skill anti-pattern) | evidence_discipline_and_review |

Nine checks are computed from the declared rows and values, using
only the consistency of the declared record itself — no outside
threshold is imported:

- **Options declared:** the declared `options` list passes only
  when it is present and non-empty; an absent list is missing
  evidence, an empty list fails.
- **Name per option:** every declared option row must name the
  option (a non-empty `name` string). A row with the field absent
  is missing evidence; a row naming an empty string fails.
- **Viability per option:** every declared option row must
  declare `viable: true`. A row with the field absent is missing
  evidence.
- **Criteria declared:** the declared `criteria` list passes only
  when it is present and non-empty; an absent list is missing
  evidence, an empty list fails.
- **Name per criterion:** every declared criterion row must name
  the criterion (a non-empty `name` string), on the same
  absent-is-missing / empty-fails rule as options.
- **Set-before-data per criterion:** every declared criterion row
  must declare `set_before_data: true`. A row with the field
  absent is missing evidence.
- **Threshold per criterion:** every declared criterion row must
  declare `threshold_declared: true`. A row with the field absent
  is missing evidence.
- **Default action matches a declared option:** the declared
  `precommitment.default_action` string must equal the `name` of
  a declared option row. An absent default action, or an absent
  options list, is missing evidence; a default naming no declared
  option fails.
- **Loss costs in both directions:** both declared loss numbers,
  `cost_of_false_action` and `cost_of_false_inaction`, must be
  present and non-negative. Either field absent is missing
  evidence; a negative cost fails.

Four check groups are conditional, following the skill's own
scoping — computed from the declared gate fields:

- **Threshold adjustment for asymmetry:** the skill binds its
  threshold rule to asymmetric costs ("Asymmetric costs move the
  threshold"). `threshold_adjusted_for_asymmetric_costs` is
  therefore required only when `loss.asymmetric_costs_declared`
  is declared `true`; when no asymmetry is declared, the check
  passes as not applicable. The gate is the caller's declaration,
  not the computed ratio — no ratio value is made a trigger.
- **Slowed down when irreversible:** the skill binds slowing
  down to irreversible/expensive (one-way-door) decisions.
  `slowed_down_and_more_evidence_for_irreversible` is therefore
  required only when `rigor.irreversible_declared` is declared
  `true`; otherwise the check passes as not applicable.
- **Default to action when reversible:** the skill binds
  deciding fast and defaulting to action to reversible
  (two-way-door) decisions. `default_to_action_for_reversible`
  is therefore required only when `rigor.reversible_declared` is
  declared `true`; otherwise the check passes as not applicable.
- **Pre-registered hypothesis:** the skill binds pre-registration
  to confirmatory analysis ("Confirmatory analysis tests a
  *pre-registered* hypothesis"). `hypothesis_preregistered` is
  therefore required only when
  `evidence.confirmatory_analysis_used` is declared `true`;
  otherwise the check passes as not applicable.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the nine primary computed checks above cannot be completed),
`options_count` and `criteria_count` (the declared list lengths,
or null when the list is not declared — counts are reported as
integers, exactly), the row-name lists `options_without_name`,
`options_not_declared_viable`, `criteria_without_name`,
`criteria_not_set_before_data` and `criteria_without_threshold`
(null when the underlying list is not declared), `default_action`
(the declared default action string, or null when it is not
declared), and the four coverage / ratio values
`option_name_coverage` (options naming an option ÷ declared
options), `criterion_set_before_data_coverage` (criteria
declared set before the data ÷ declared criteria),
`criterion_threshold_coverage` (criteria declaring a threshold ÷
declared criteria) and `loss_cost_ratio`
(`cost_of_false_action` ÷ `cost_of_false_inaction`).
**Fixed serialization rule:** computed ratios are reported as
strings with exactly four decimal places, produced in both
implementations by the same rule — round half up to 4dp,
`floor(v * 10000 + 0.5) / 10000`, then format with exactly four
decimals; comparisons use the unrounded values. A coverage ratio
is null when its denominator list is absent or empty.
`loss_cost_ratio` is null when either cost is absent or when
`cost_of_false_inaction` is zero. That fixed serialization is
what makes the Python and TypeScript outputs byte-identical.

The skill states no numeric threshold — no minimum option or
criterion count, no loss-cost amount or ratio, no stakes level,
no criterion or change-my-mind threshold value, and no amount of
data, analysis, effort or time — so no numeric threshold check
is invented. Quantities are computed and reported; the only bar
on the computed rows is completeness over the caller's own
declared rows (every declared option, every declared criterion),
exactly as stated above. Declined thresholds, named: a minimum
option count of two or more (the skill says "the real options"
but states no number, so only present-and-non-empty is checked);
a minimum or maximum criterion count; a loss-cost amount cap; a
`loss_cost_ratio` trigger or band (the ratio is reported, never
judged, and the threshold-adjustment gate is the caller's
asymmetry declaration); a numeric stakes level separating high
from low stakes; a numeric amount of data or analysis worth
gathering; a time limit for deciding "fast" on reversible
decisions or for "slowing down" on irreversible ones; any value
for a criterion threshold or for the change-my-mind threshold
(their existence and pre-commitment are checked, their values
are the decision-maker's); a reversibility vocabulary (the
skill names two-way-door and one-way-door in prose, and the
record declares reversibility through the two gate booleans
above, so no string vocabulary is imposed).

The verdict is one of `DECISION_PROCESS_SOUND` (all 36 checks
pass), `DECISION_PROCESS_NOT_SOUND` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across four sections: framing_and_roles,
precommitment_before_data, loss_stakes_and_rigor,
evidence_discipline_and_review.

## Honest scoping

This atom audits a **declared** decision-process record — it
makes no decision, frames no decision for the caller, gathers
or analyses no data, sets no criteria or thresholds, and does
not verify that a declared pre-commitment actually happened
when declared. A process is sound *on the caller's declared
evidence*: a manifest that declares criteria set before the
data, a pre-registered hypothesis, and a review separate from
the outcome passes those checks even if none of it happened in
that order. It is a completeness and consistency audit of the
record the skill requires, **not a decision-making service or
a decision-quality certification**: it never judges whether
the decision is the right one, whether the named options are
the genuinely real ones, whether the objective is the right
objective, or whether the declared thresholds are well-chosen
— only that the record contains what the skill's checklist and
tenets demand, and that its declared rows are internally
consistent. In the skill's own tie-in terms, the tool
calculates; the user decides.

Named non-reducible parts — caller declarations only, stated
plainly: whether criteria and thresholds were *actually* set
before the data was seen (timing is attested in the record,
never timestamp-verified); the content and quality of the
decision framing, the objective and the loss function (only
that they are declared framed/stated, never what they say);
whether a declared option is genuinely viable and a declared
criterion genuinely the right one; what any threshold value
should be, and what evidence would genuinely flip the default;
whether the decision-maker and the analyst actually kept their
roles in practice; whether an analysis was genuinely
exploratory or confirmatory and what its pre-registration
contained; and the quality of the post-decision review. None of
these is reduced to a check — each enters the record only as
the caller's declaration behind the boolean fields above.

Named exclusions: no numeric thresholds (see the declined list
above); no check that a declared threshold is a good threshold;
no timestamp or ordering verification of pre-commitment; no
loss-cost currency or unit is imposed (the two costs are the
caller's own numbers in the caller's own unit, and only their
ratio is computed); no data, evidence or analysis is read —
only that evidence with the power to change the decision is
declared to exist; no live verification of any declared fact.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.
