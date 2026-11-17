# PRD with testable acceptance criteria — `prd-with-testable-acceptance-criteria`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Turn a fuzzy idea into an approved PRD — user stories, acceptance criteria, scope boundaries, and priorities.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Specifying products before build phases**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the PRD manifest

The caller submits one JSON manifest: a declared product
requirements document (PRD) record for one product or feature,
made at the specification stage — before build. Every field
below is read by the named section's checks. A field
**absent** = evidence missing (`INSUFFICIENT_EVIDENCE`); a
field present but false / invalid = the check fails
(`PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY`). All
fields are booleans unless noted.

| Field | Read by |
|---|---|
| `product` (string; carried into the verdict output, not itself checked) | — |
| `problem.statement_declared` (boolean) | problem_and_outcome |
| `problem.who_has_it_declared` (boolean) | problem_and_outcome |
| `problem.why_now_declared` (boolean) | problem_and_outcome |
| `problem.statement_sentence_count` (number; computed, see below) | problem_and_outcome |
| `problem.problem_first_before_solution_declared` (boolean) | problem_and_outcome |
| `outcome.observable_change_defined` (boolean) | problem_and_outcome |
| `outcome.outcome_is_behavior_or_metric_not_feature_only` (boolean) | problem_and_outcome |
| `stories` (list of story-row objects, each with the entry fields below; computed, see below) | stories_and_acceptance_criteria |
| `stories[].id` (string; names the row in the computed outputs) | stories_and_acceptance_criteria |
| `stories[].role` (string; the `<role>` of the story form; must be present and non-empty per row) | stories_and_acceptance_criteria |
| `stories[].capability` (string; the `<capability>` of the story form; must be present and non-empty per row) | stories_and_acceptance_criteria |
| `stories[].benefit` (string; the `<benefit>` of the story form; must be present and non-empty per row) | stories_and_acceptance_criteria |
| `stories[].priority` (string; must be present per row and one of `P0`, `P1`, `P2`) | stories_and_acceptance_criteria |
| `acceptance_criteria` (list of criterion-row objects, each with the entry fields below; computed, see below) | stories_and_acceptance_criteria |
| `acceptance_criteria[].id` (string; names the row in the computed outputs) | stories_and_acceptance_criteria |
| `acceptance_criteria[].story_id` (string; the declared story the criterion accepts; must name a declared story) | stories_and_acceptance_criteria |
| `acceptance_criteria[].testable_declared` (boolean; must be `true` per row) | stories_and_acceptance_criteria |
| `acceptance_criteria[].binary_declared` (boolean; must be `true` per row) | stories_and_acceptance_criteria |
| `out_of_scope_items` (list of strings; computed, see below) | scope_fences |
| `scope.explicit_out_of_scope_list_declared` (boolean) | scope_fences |
| `scope.explicit_scope_boundaries_declared` (boolean) | scope_fences |
| `scope.deferrals_placed_in_later_list` (boolean) | scope_fences |
| `scope.deferrals_not_silently_inside_scope` (boolean) | scope_fences |
| `priorities.priority_scheme_p0_p1_p2_applied` (boolean) | priorities_and_decisions |
| `priorities.priority_tiers_applied_in_shipping_order` (boolean) | priorities_and_decisions |
| `priorities.p0_items_shippable_alone_declared` (boolean) | priorities_and_decisions |
| `priorities.priority_conflicts_resolved_with_decision_owner` (boolean) | priorities_and_decisions |
| `decisions.decision_owner_named` (boolean) | priorities_and_decisions |
| `decisions.key_decisions_logged_in_prd` (boolean) | priorities_and_decisions |
| `open_questions` (list of open-question-row objects, each with the entry fields below; computed, see below) | open_questions_and_approval |
| `open_questions[].id` (string; names the row) | open_questions_and_approval |
| `open_questions[].architecture_changing` (boolean; whether the question changes architecture) | open_questions_and_approval |
| `open_questions[].blocks_build` (boolean; must equal `architecture_changing` per row) | open_questions_and_approval |
| `open_question_tracking.tracked_explicitly` (boolean) | open_questions_and_approval |
| `open_question_tracking.architecture_changing_questions_block_build` (boolean) | open_questions_and_approval |
| `open_question_tracking.non_architecture_questions_do_not_block_build` (boolean) | open_questions_and_approval |
| `approval.approved_spec_declared` (boolean) | open_questions_and_approval |
| `red_lines.build_started_before_approved_spec_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.unlabeled_spike_treated_as_approved_spec_present` (boolean; must be `false` to pass — skill red line exception shape) | red_lines |
| `red_lines.scope_widened_mid_phase_without_prd_update_and_reapproval_present` (boolean; must be `false` to pass — skill red line) | red_lines |

Several checks are computed from the declared rows and
fields, using only the skill's own stated rules plus the
consistency of the declared record itself — no outside
threshold is imported:

- **Problem statement within five sentences:** the skill
  states the problem in "five sentences or fewer", so the
  declared `problem.statement_sentence_count` passes when it
  is between 1 and 5 inclusive. An absent count is missing
  evidence. The atom never parses or counts prose itself —
  the count is the caller's declaration, checked against the
  skill's own stated limit.
- **Stories declared:** the declared `stories` list passes
  when it is present and non-empty. An absent list is missing
  evidence; an empty list fails — the skill's artifact is
  stories with acceptance criteria, so a PRD declaring no
  stories declares nothing testable.
- **Story form per story:** every declared story row must
  state a non-empty `role`, `capability` and `benefit`
  string (the skill's story form: `As a <role>, I want
  <capability>, so that <benefit>`). A row with a field
  absent is missing evidence; a row naming an empty field
  fails.
- **Story id unique and non-empty:** every declared story
  row must carry a non-empty `id`, and no story `id` may
  appear on more than one story row. A row with `id` absent
  is missing evidence for this check.
- **Story priority is P0, P1 or P2:** every declared story
  row's `priority` must be one of the skill's stated labels
  — `P0` (must ship), `P1` (should) or `P2` (could). A row
  with `priority` absent is missing evidence; any other
  value fails.
- **Acceptance criteria declared:** the declared
  `acceptance_criteria` list passes when it is present and
  non-empty, on the same reasoning as the stories list.
- **Every story has acceptance criteria:** every declared
  story must be named as the `story_id` of at least one
  declared criterion row (the skill's quality gate). A story
  or criterion row with the tracing field absent is missing
  evidence; a story no criterion traces to fails.
- **Every criterion traces to a declared story:** every
  declared criterion row's `story_id` must name a declared
  story. A row with `story_id` absent is missing evidence; a
  row naming an undeclared story fails.
- **Criterion id unique and non-empty:** every declared
  criterion row must carry a non-empty `id`, and no
  criterion `id` may appear on more than one criterion row.
- **Every criterion declared testable:** every declared
  criterion row must declare `testable_declared` true (the
  skill: "testable and binary per story ... If it can't be
  tested, it's not a criterion"). A row with the field
  absent is missing evidence; a row declaring it false
  fails.
- **Every criterion declared binary:** every declared
  criterion row must declare `binary_declared` true — the
  criterion passes or it fails, with no middle state.
- **Out-of-scope items declared:** the declared
  `out_of_scope_items` list passes when it is present and
  non-empty (the skill's quality gate: the out-of-scope list
  exists). An absent list is missing evidence.
- **No "misc" bucket in the out-of-scope items:** no
  declared entry may be the "misc" bucket the quality gate
  bars — an entry whose trimmed, lower-cased text is exactly
  `misc`. An entry such as `miscellaneous` is not the bucket
  and does not fail this check.
- **Open questions declared:** the declared `open_questions`
  list passes when it is present. An absent list is missing
  evidence. An empty list passes: it declares that the PRD
  tracks no open questions.
- **Block flag matches architecture impact:** on every
  declared open-question row, `blocks_build` must equal
  `architecture_changing` (the skill: open questions "block
  build only on questions that change architecture"). A row
  with either field absent is missing evidence; a row whose
  flags disagree fails. On an empty list the check passes
  vacuously — there is no question blocking wrongly.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any
of the fifteen primary computed checks above cannot be
completed), `problem_statement_sentence_count` (the declared
count, or null when it is not declared),
`stories_count`, `acceptance_criteria_count` and
`out_of_scope_items_count` / `open_questions_count` (the
declared list lengths, or null when a list is not declared —
counts are reported as integers, exactly), `p0_story_count`
(declared stories whose priority is exactly `P0`),
`architecture_changing_open_questions_count` and
`blocking_open_questions_count` (declared question rows
whose respective flag is true), the row-name lists
`stories_without_criteria` (declared stories no criterion
traces to; a story with `id` absent is missing evidence and
does not appear), `criteria_without_declared_story`
(criteria whose `story_id` is present but names no declared
story), `duplicate_story_ids` and `duplicate_criterion_ids`
(ids declared on more than one row, in the order their
second occurrence appears), `misc_bucket_items` (the
declared out-of-scope entries that are the "misc" bucket,
spelled as declared), and the coverage ratios
`story_criteria_coverage` (stories traced to by at least one
criterion ÷ declared stories), `testable_criteria_coverage`
(criteria declared testable ÷ declared criteria) and
`binary_criteria_coverage` (criteria declared binary ÷
declared criteria). **Fixed serialization rule:** computed
ratios are reported as strings with exactly six decimal
places, produced in both implementations by the same rule —
round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`,
then format with exactly six decimals; comparisons use the
unrounded values. A ratio is null when its denominator list
is absent or empty (and, for `story_criteria_coverage`, when
either tracing list is absent). That fixed serialization is
what makes the Python and TypeScript outputs byte-identical.

The skill states exactly one numeric limit — the problem
statement at five sentences or fewer — and it is checked
only against the caller's declared sentence count, never as
prose the atom parses. No other numeric threshold is
stated — its demands are qualitative declarations the record
makes, not bars the atom can set. Quantities are computed
and reported; the only bar on the computed rows is
completeness over the caller's own declared rows, exactly as
stated above. Declined thresholds, named: a problem
statement length in words or characters, or a sentence
limit other than the skill's stated five; a minimum or
maximum number of stories, or of acceptance criteria per
story beyond the quality gate's every-story-has-criteria
completeness; a required priority mix (for example a minimum
number or share of P0 stories — P0 rows are counted and
reported, never quota'd); a story-point, effort or duration
estimate per story or for the PRD; a maximum number of open
questions, or a deadline by which they must close; a
testability or binary score beyond each criterion's own
declared flags; a required wording template for a criterion
beyond testable-and-binary (given/when/then is stated by the
skill as "fine" — permitted, never required — so its syntax
is not parsed or mandated); an approval quorum, approver
seniority, or approval expiry; a spike duration beyond a
spike being timeboxed and labeled as declared.

The verdict is one of
`PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_READY` (all 38 checks
pass), `PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY`
(any check fails), or `INSUFFICIENT_EVIDENCE` (nothing fails
but evidence is missing), across six sections:
problem_and_outcome, stories_and_acceptance_criteria,
scope_fences, priorities_and_decisions,
open_questions_and_approval, red_lines.

## Distinct ground

The nearest siblings are `designed-test-case-pack` (a
designed TEST-CASE record for requirements — equivalence
partitioning, boundary values just below/at/above, negative
and invalid-input cases, cases ranked by damage and
likelihood and traced to requirements), `delivery-plan-preparation`
(a delivery PLAN record — phases, milestones and
dependencies, per-phase owners, exit criteria and skill
sizes, estimates, a risk register and an append-only
decision log for executing work) and `buyer-test-card` (a
bounded BUYER/POC test card — a single hypothesis, success
and kill criteria written before a timeboxed trial starts, a
hard timebox limit, and a disposition routed through a full
team process). This atom shares **zero checks** with any of
them (verified by comparing every check name here against
every check name in the three siblings' sources): every
check here is a PRD question — the problem stated in five
sentences or fewer with who has it and why now, an outcome
expressed as a behavior or metric rather than a feature,
every story stating role/capability/benefit with a P0/P1/P2
priority, every story carrying testable and binary
acceptance criteria and every criterion traced back to a
declared story, an out-of-scope list with no "misc" bucket,
deferrals placed in a later list and never silently inside
the scope, P0 stories shippable alone, priority conflicts
resolved with the decision owner, open questions whose
build-blocking flag matches whether they change
architecture, an approved spec before build, and the PRD
red lines (no build before the approved spec, no unlabeled
spike standing in for it, no scope widened mid-phase without
a PRD update and re-approval). The boundary is: the
requirements specification for a product here; the test
cases designed from requirements, the plan for delivering
work, and a timeboxed buyer trial there.

## Honest scoping

This atom reviews a **declared** PRD record — it writes no
PRD itself, interviews no user, runs no test against any
criterion, inspects no product, repository, or approval
system, and does not verify that a declared PRD was ever
approved, built from, or shipped. A PRD is ready *on the
caller's declared evidence*: a record that declares testable
and binary criteria, an approved spec, and no build started
early passes those checks even if the real specification did
none of it. It is a completeness and consistency audit of
the PRD record the skill requires, **not a product-management
service, a test-execution service, an approval authority, or
a prediction that the product will succeed**: it never
judges whether the stated problem is the real problem,
whether a criterion declared testable can actually be tested
in practice, whether the stories are the right stories, or
whether the priorities are wise — only that the record
contains what the skill's method, quality gates and red
lines demand, and that its declared story, criterion and
open-question rows are internally consistent.

Named exclusions and non-reducible parts (carried as caller
declarations only, never judged): no numeric thresholds
beyond the skill's own stated five-sentence limit, itself
checked only against a declared count (see the declined list
above); no parsing of prose — story and criterion text is
never read for meaning, the story form is checked only as
the declared role/capability/benefit fields being present
and non-empty; no live verification of any declared fact; no
judgment of PRD *quality* — whether the problem framing, the
outcome, or the scope fences are adequate for the real
product is the caller's declaration, checked only for
declared presence and consistency; approval substance
(whether the approval was given by someone entitled to give
it, or is still current) is a caller declaration — only its
declared presence is checked.

## U-13 regulatory screen

No: this atom's output could not read as regulated
professional advice — it audits a declared product
requirements record for completeness and consistency; it
offers no engineering, financial, medical, psychological, or
legal advice, and it takes no position on the product the
PRD specifies.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally — NOT deployed** —
deterministic core, Python oracle and TypeScript port built
and parity-proven locally; no endpoint is live. Release
happens one by one, by the owner's GO, per the approved queue.
