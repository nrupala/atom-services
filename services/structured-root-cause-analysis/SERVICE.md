# Structured root cause analysis — `structured-root-cause-analysis`

**Deliverable type:** REPORT. This atom sells the report it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): reason rigorously — classify the inference, structure it with MECE decomposition and a hypothesis tree, hunt the root cause by 5-whys or fishbone toward the *controllable* cause, tier the evidence, quantify, falsify the conclusion, and land it with confidence, basis and revision conditions. Its root-cause line is this atom's method: distinguish trigger vs root; verify by reverting/testing the cause — plausible candidates don't count until tested.

A caller submits the inputs the bound skill works on and receives one report back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Thinking & decisions who need this report on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Incident root-cause investigations**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the root-cause analysis manifest

The caller submits one JSON manifest: a declared root-cause
analysis record for one problem, made from the analysis as
actually written. Every field below is read by the named
section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid =
the check fails (`ROOT_CAUSE_ANALYSIS_NOT_SOUND`). All fields
are booleans unless noted.

| Field | Read by |
|---|---|
| `analysis_title` (string; carried into the verdict output, not itself checked) | — |
| `problem.problem_statement_stated` (boolean) | problem_framing_and_inference |
| `problem.inference_type_classified` (boolean) | problem_framing_and_inference |
| `problem.scope_boundary_stated` (boolean) | problem_framing_and_inference |
| `problem.trigger_distinguished_from_root_cause` (boolean) | problem_framing_and_inference |
| `problem.controllable_cause_targeted` (boolean) | problem_framing_and_inference |
| `decomposition.mece_decomposition_declared` (boolean) | decomposition_and_timeline |
| `decomposition.hypothesis_tree_declared` (boolean) | decomposition_and_timeline |
| `decomposition.branches_ranked_by_likelihood_and_test_cost` (boolean) | decomposition_and_timeline |
| `timeline_events` (list of event-row objects, each with the entry fields below; computed, see below) | decomposition_and_timeline |
| `timeline_events[].event_id` (string; must be unique per row) | decomposition_and_timeline |
| `timeline_events[].sequence_number` (number; computed — must strictly increase in row order, see below) | decomposition_and_timeline |
| `factors` (list of factor-row objects, each with the entry fields below; computed, see below) | causal_chain_and_fishbone, evidence_and_quantification |
| `factors[].factor_id` (string; must be unique per row) | causal_chain_and_fishbone |
| `factors[].category` (non-empty string; the factor's declared fishbone category) | causal_chain_and_fishbone |
| `factors[].evidence_tier` (string; computed — must be one of `measurement`, `log`, `report`, `opinion`, see below) | evidence_and_quantification |
| `causal_chain` (list of link-row objects, each with the entry fields below; computed, see below) | causal_chain_and_fishbone |
| `causal_chain[].link_id` (string; must be unique per row) | causal_chain_and_fishbone |
| `causal_chain[].depth` (number; computed — depths must run consecutively from one in row order, see below) | causal_chain_and_fishbone |
| `causal_chain[].factor_id` (string; computed — must reference a declared factor, see below) | causal_chain_and_fishbone |
| `evidence.evidence_tiers_applied` (boolean) | evidence_and_quantification |
| `evidence.base_rates_considered_first` (boolean) | evidence_and_quantification |
| `evidence.evidence_update_stated` (boolean) | evidence_and_quantification |
| `evidence.magnitudes_and_ranges_quantified` (boolean) | evidence_and_quantification |
| `evidence.units_and_assumptions_stated` (boolean) | evidence_and_quantification |
| `verification.root_cause_verified_by_revert_or_test` (boolean) | verification_falsification_and_conclusion |
| `verification.counterfactual_test_recorded` (boolean) | verification_falsification_and_conclusion |
| `verification.strongest_counterargument_stated` (boolean) | verification_falsification_and_conclusion |
| `verification.contradicting_data_named` (boolean) | verification_falsification_and_conclusion |
| `verification.revision_conditions_stated` (boolean) | verification_falsification_and_conclusion |
| `conclusion.conclusion_confidence_and_basis_stated` (boolean) | verification_falsification_and_conclusion |
| `corrective_actions` (list of action-row objects, each with the entry fields below; computed, see below) | verification_falsification_and_conclusion |
| `corrective_actions[].action_id` (string; must be unique per row) | verification_falsification_and_conclusion |
| `corrective_actions[].factor_id` (string; computed — must reference a declared factor, see below) | verification_falsification_and_conclusion |
| `red_lines.unverified_single_source_conclusion_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.post_hoc_storytelling_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.plausible_presented_as_proven_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.cause_asserted_without_declared_evidence_present` (boolean; must be `false` to pass — record-level form of the evidence red line) | red_lines |
| `red_lines.person_blame_as_root_cause_present` (boolean; must be `false` to pass — the hunt targets the controllable cause, not a person) | red_lines |

Fourteen checks are computed from the declared rows, using
only the skill's own stated method plus the consistency of the
declared record itself — no outside threshold is imported:

- **Timeline events list declared:** the declared
  `timeline_events` list passes when it is present and names at
  least one event. An absent list is missing evidence; an empty
  list fails — it declares no timeline at all.
- **Timeline event ids unique:** no declared `event_id` may
  appear on more than one row. A row with `event_id` absent is
  missing evidence for this check.
- **Timeline sequence strictly increasing:** every declared
  event's `sequence_number` must be greater than the previous
  row's — the record's own timeline never runs backwards. A row
  missing its sequence number is missing evidence; equal or
  decreasing numbers fail.
- **Factor rows list declared:** the declared `factors` list
  passes when it is present and names at least one factor. An
  absent list is missing evidence; an empty list fails — it
  declares no fishbone at all.
- **Factor ids unique:** no declared `factor_id` may appear on
  more than one row. A row with `factor_id` absent is missing
  evidence for this check.
- **Every factor category declared:** every declared factor
  declares a non-empty `category` (its fishbone category, in
  the caller's own words — the skill names the fishbone method,
  not a category vocabulary, so none is imposed). A row with
  `category` absent is missing evidence; a row declaring an
  empty category fails, and is named in
  `factors_without_category`.
- **Causal chain list declared:** the declared `causal_chain`
  list passes when it is present and names at least one link.
  An absent list is missing evidence; an empty list fails — it
  declares no chain at all.
- **Causal chain link ids unique:** no declared `link_id` may
  appear on more than one row. A row with `link_id` absent is
  missing evidence for this check.
- **Causal chain depths consecutive from one:** the declared
  links' `depth` values must run 1, 2, 3, … in row order — the
  5-whys chain the record declares has no skipped or repeated
  depth. A row missing its depth is missing evidence; any other
  sequence fails.
- **Every causal chain link factor referenced:** every declared
  link's `factor_id` must equal the `factor_id` of a factor
  declared in the factor rows. A link with `factor_id` absent,
  or a record with the factors list absent, is missing evidence
  for this check; a link naming no declared factor fails, and
  is named in `causal_chain_links_with_unreferenced_factor`.
- **Every factor evidence tier recognised:** every declared
  factor's `evidence_tier` must be one of the skill's four
  tiers — `measurement`, `log`, `report`, `opinion` ("tier
  evidence (measurements > logs > reports > opinions)"). A row
  with `evidence_tier` absent is missing evidence, and is named
  in `factors_missing_evidence_tier`; any other value fails,
  and is named in `factors_with_unrecognised_evidence_tier`.
- **Corrective action rows list declared:** the declared
  `corrective_actions` list passes when it is present and names
  at least one action. An absent list is missing evidence; an
  empty list fails — it declares no corrective action at all.
- **Corrective action ids unique:** no declared `action_id` may
  appear on more than one row. A row with `action_id` absent is
  missing evidence for this check.
- **Every corrective action factor referenced:** every declared
  action's `factor_id` must equal the `factor_id` of a factor
  declared in the factor rows — an action aimed at no declared
  factor is not linked to the record's own root cause. A row
  with `factor_id` absent, or a record with the factors list
  absent, is missing evidence for this check; an action naming
  no declared factor fails, and is named in
  `corrective_actions_with_unreferenced_factor`.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the fourteen computed checks above cannot be completed),
`timeline_events_count`, `factor_rows_count`,
`causal_chain_links_count` and `corrective_action_rows_count`
(the declared list lengths, or null when a list is not declared
— counts are reported as integers, exactly), the duplicate-id
lists `duplicate_timeline_event_ids`, `duplicate_factor_ids`,
`duplicate_causal_chain_link_ids` and
`duplicate_corrective_action_ids` (ids declared on more than
one row, in the order their second occurrence appears),
`fishbone_categories_declared_count` (the number of distinct
non-empty categories declared across the factor rows, or null
when the factors list is not declared), and the ratios
`factor_category_coverage_ratio` (factors declaring a category
÷ declared factors), `factor_evidence_tier_ratio` (factors
whose evidence tier is recognised ÷ declared factors),
`causal_chain_reference_ratio` (chain links referencing a
declared factor ÷ declared links; null when either list is
absent or the chain is empty) and
`corrective_action_reference_ratio` (actions referencing a
declared factor ÷ declared actions; null when either list is
absent or the actions list is empty). **Fixed serialization
rule:** computed ratios are reported as strings with exactly
six decimal places, produced in both implementations by the
same rule — round half up to 6dp, `floor(v * 1000000 + 0.5) /
1000000`, then format with exactly six decimals. A ratio is
null when its denominator list is absent or empty. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical.

The skill states no numeric threshold at all — its demands are
a verified (not merely plausible) root cause, tiered evidence,
quantified magnitudes and a falsified conclusion, not bars the
atom can set. Quantities are computed and reported; the only
bars on the computed rows are exact consistency and
completeness over the caller's own declared rows, exactly as
stated above. Declined thresholds, named: a minimum number of
whys / chain depth beyond a chain that runs consecutively from
one (the skill names the 5-whys method; it does not rule that
every sound analysis has exactly five links, so no depth count
is imposed); a minimum number of fishbone categories, factors,
timeline events or corrective actions beyond at least one row
in each declared list; a fishbone category vocabulary (the
skill names the fishbone method, not its categories — the
caller's own category words are checked for presence, never
against an invented list); an evidence-tier floor (opinion is
the skill's lowest tier — a factor tiered as opinion is tiered
and declared, and passes; barring it would invent a bar the
skill does not state); a likelihood score, test-cost score or
ranking-quality bar for hypothesis-tree branches (only that
the ranking is declared is checked); a confidence level or
percentage bar for the landed conclusion; a magnitude, range
or Fermi-closeness bar for the quantified figures (only that
magnitudes, units and assumptions are declared is checked); a
counterfactual-test strength or pass/fail bar (only that a
counterfactual test is recorded is checked); any judgment that
the declared root cause is the *true* cause of anything (only
that the record contains what the skill demands, and that its
declared rows are internally consistent, is checked).

The verdict is one of `ROOT_CAUSE_ANALYSIS_SOUND` (all 38
checks pass), `ROOT_CAUSE_ANALYSIS_NOT_SOUND` (any check
fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but evidence
is missing), across six sections:
problem_framing_and_inference, decomposition_and_timeline,
causal_chain_and_fishbone, evidence_and_quantification,
verification_falsification_and_conclusion, red_lines.

## Distinct ground

The nearest siblings are `argument-analysis-review` (a declared
argument-analysis record — premises and conclusion identified,
validity distinguished from soundness, a steelman, evidence
weighing, fallacy and bias screens, razors and a counter-case),
`assumption-audit` (a declared decision record — framing,
preset criteria, loss function, rigor sizing, data discipline
and review of the decision's assumptions), `decision-trap-sweep`
(a declared decision record — options, criteria set before
evaluation, expected value, pre-mortem, rush/mood traps and a
decision log) and `condition-monitoring-triage` (declared asset
readings classified against declared alert bands, with triage
dispositions for motors, drives and transformers). This atom
shares **zero checks** with any of them (verified mechanically
by enumerating `evaluate({})` check names from every atom
oracle in `services/*/src/*.py` and comparing — zero overlap):
every check here is an RCA-record question — a problem
statement with its inference type classified, its scope
bounded, its trigger distinguished from its root and its hunt
aimed at the controllable cause; a MECE decomposition and a
hypothesis tree ranked by likelihood × cost to test; a declared
timeline whose sequence numbers strictly increase; declared
fishbone factor rows in declared categories with recognised
evidence tiers; a declared causal chain whose depths run
consecutively from one and whose every link references a
declared factor; base rates considered first with the evidence
update stated; magnitudes and ranges quantified with units and
assumptions; the root cause verified by reverting/testing with
a counterfactual test recorded; the strongest counterargument,
the contradicting data and the revision conditions written
down; corrective actions that reference declared factors; and
the RCA red lines (unverified single-source conclusions,
post-hoc storytelling, plausible presented as proven, cause
asserted without declared evidence, person blame as root
cause). The boundary is: the internal consistency of a declared
root-cause analysis record here; an argument's anatomy and
screens, a decision's assumptions and traps, and asset readings
against alert bands, there.

## Honest scoping

This atom reviews a **declared** root-cause analysis record —
it investigates nothing itself, interviews no one, inspects no
incident, system, log, site or document, runs no test, and does
not verify that any declared step (a decomposition, a timeline,
a verification-by-revert, a counterfactual test) was ever
actually carried out. An analysis is sound *on the caller's
declared evidence*: a record that declares its cause verified,
its evidence tiered and every row consistent passes those
checks even if the real analysis did none of it. It is a
completeness and consistency audit of the RCA record the skill
requires, **not an incident investigation, a causal
determination, or a guarantee that the declared root cause is
the real cause of anything**: it never decides what caused an
event, whether a declared factor truly contributed, whether a
declared corrective action will work, or whether anyone is at
fault — only that the record contains what the skill's method
and red lines demand, and that its declared rows are internally
consistent.

Named exclusions and non-reducible parts (carried as caller
declarations only, never performed or judged): **investigate-
for-me steps are excluded by name** — the atom conducts no
investigation, gathers no evidence, interviews no witnesses,
inspects no equipment or logs, and reconstructs no timeline
from the world; the timeline, factors and chain it checks are
the caller's declared rows, taken as declared. **Blame-
assignment steps are excluded by name** — the atom assigns no
blame, names no culprit, and makes no fault or liability
finding about any person or organisation; a record that itself
records person blame as its root cause fails the red-line
check, and that is the atom's whole position on blame.
Causal truth is excluded — whether a declared cause actually
caused the declared effect is the caller's work, checked only
for declared presence and internal consistency. Interview,
site-visit and evidence-gathering work is excluded. No numeric
thresholds at all (the skill states none — see the declined
list above); no live verification of any declared fact; no
judgment of analysis *quality* beyond the record's declared
structure — whether the analysis is right is the caller's
work.

## U-13 regulatory screen

Screen classification: **(b) — screen-NO with flag-with-controls
(census class).** This atom is incident-adjacent by keyword —
its bound skill names root-cause hunts for "incidents,
anomalies", its self-use workflow is incident root-cause
investigations, and an RCA record could be about an industrial
incident involving equipment or safety — so the screen was
applied under the strictest, engineering-class reading, and the
atom is flagged for the owner's per-unit ruling queue under
U-13 on that adjacency. What prevents a regulated-practice
reading, as named controls: (1) the atom audits a
caller-**declared** RCA record for structure and internal
consistency only — timeline order, row identity, fishbone
category and evidence-tier completeness, causal-chain depth
and factor references, corrective-action references, and
declared method/falsification attestations; every output is a
pass / fail / missing verdict on the record or a ratio
recomputed from the caller's own declared rows; (2) it makes
**no engineering determination** — it never states what caused
an incident, whether equipment, a process or a person was at
fault, whether anything is safe or compliant, or what anyone
should do; it issues no incident report, no failure analysis
and no safety finding of its own; (3) it performs **no incident
investigation** — no evidence gathering, interviews, site
inspection, log or equipment examination (named exclusions
above); the skill's live root-cause hunt is excluded from
production — this atom performs none of it, it only audits a
declared record of an analysis the caller says they did;
(4) it sets **no threshold** — no severity, risk, likelihood or
confidence bar against which an incident or a cause could be
graded (see the declined list); (5) **blame assignment is
excluded by name and is itself a red line** — a record that
records person blame as its root cause fails, so the artifact
cannot be used to launder a blame finding into a verdict.
Residual risk, stated plainly: a caller could paste the verdict
into their own incident file — that is their decision, made on
their record; the artifact determines nothing about the
incident. This is the declared-record-audit class (the same
class as the quant-math-derivation-sanity-check and
pricing-unit-economics-pack precedents: advice- or
determination-shaped skill steps excluded as controls); it is
not the genuinely-open personal-financial-snapshot class,
because no personal position is handled and no determination
of any kind is produced. Flagging never blocks authoring; no
deploy happens on this atom without the owner's explicit
per-unit ruling after the screen.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally — NOT deployed** —
deterministic core, Python oracle and TypeScript port built
and parity-proven locally; no endpoint is live. Release
happens one by one, by the owner's GO, per the approved queue.
