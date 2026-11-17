# Process waste review coaching — `process-waste-review-coaching`

**Deliverable type:** REVIEW. This atom sells the review it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Improve the system, not just the instance — make work visible, remove waste, and respect the people doing the work (operational excellence: Lean, Six Sigma DMAIC, Theory of Constraints).

A caller submits the inputs the bound skill works on and receives one review back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result. Despite the atom's name, what is delivered is a **record audit** — a completeness and consistency review of a declared process-waste review record — never coaching of a person (see the U-13 screen and Honest scoping below).

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in How Milo works who need this review on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Release process improvement coaching**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the process waste review manifest

The caller submits one JSON manifest: a declared process
review record for one process, made at review time. Every
field below is read by the named section's checks. A field
**absent** = evidence missing (`INSUFFICIENT_EVIDENCE`); a
field present but false / invalid = the check fails
(`PROCESS_WASTE_REVIEW_NOT_READY`). All fields are booleans
unless noted.

| Field | Read by |
|---|---|
| `process` (string; carried into the verdict output, not itself checked) | — |
| `define.problem_stated` (boolean) | define_and_visibility |
| `define.goal_measurable_stated` (boolean) | define_and_visibility |
| `define.scope_stated` (boolean) | define_and_visibility |
| `define.customer_need_stated` (boolean) | define_and_visibility |
| `define.whole_system_scope_declared` (boolean) | define_and_visibility |
| `mapping.whole_flow_mapped` (boolean) | define_and_visibility |
| `mapping.work_made_visible` (boolean) | define_and_visibility |
| `mapping.process_defined_before_automation` (boolean) | define_and_visibility |
| `steps` (list of step-row objects, each with the entry fields below; computed, see below) | steps_and_waste_observation |
| `steps[].name` (string; names the row in the computed outputs) | steps_and_waste_observation |
| `steps[].duration_minutes` (number; the step's declared duration) | steps_and_waste_observation |
| `steps[].wait_before_minutes` (number; the declared wait before the step) | steps_and_waste_observation |
| `wastes` (list of waste-row objects, each with the entry fields below; computed, see below) | steps_and_waste_observation |
| `wastes[].category` (string; must be one of the eight DOWNTIME categories, see below) | steps_and_waste_observation |
| `wastes[].step_name` (string; must name a declared step) | steps_and_waste_observation |
| `measure.baseline_established_with_data` (boolean) | measurement_and_metrics |
| `measure.baseline_from_data_not_anecdote` (boolean) | measurement_and_metrics |
| `metrics.leading_indicators_declared` (boolean) | measurement_and_metrics |
| `metrics.lagging_indicators_declared` (boolean) | measurement_and_metrics |
| `metrics.kpis_limited_to_meaningful_declared` (boolean) | measurement_and_metrics |
| `metrics.metrics_made_visible` (boolean) | measurement_and_metrics |
| `analyze.root_cause_analysis_performed` (boolean) | analysis_and_constraint |
| `analyze.pareto_vital_few_identified` (boolean) | analysis_and_constraint |
| `constraint.bottleneck_identified` (boolean) | analysis_and_constraint |
| `constraint.non_bottleneck_effort_subordinated` (boolean) | analysis_and_constraint |
| `constraint.bottleneck_step_name` (string; must equal the computed bottleneck, see below) | analysis_and_constraint |
| `improve.improvement_piloted_before_scaling` (boolean) | improvement_and_control |
| `improve.pdca_cycle_declared` (boolean) | improvement_and_control |
| `improve.verified_against_baseline_before_scaling` (boolean) | improvement_and_control |
| `improve.small_continuous_improvement_declared` (boolean) | improvement_and_control |
| `improve.flow_and_pull_pursued_over_push` (boolean) | improvement_and_control |
| `control.win_standardized` (boolean) | improvement_and_control |
| `control.monitoring_in_place` (boolean) | improvement_and_control |
| `control.regression_made_visible` (boolean) | improvement_and_control |
| `red_lines.automating_broken_process_present` (boolean; must be `false` to pass — skill anti-pattern) | red_lines |
| `red_lines.vanity_metrics_present` (boolean; must be `false` to pass — skill anti-pattern) | red_lines |
| `red_lines.hero_culture_reliance_present` (boolean; must be `false` to pass — skill anti-pattern) | red_lines |
| `red_lines.optimizing_non_constraint_present` (boolean; must be `false` to pass — skill anti-pattern) | red_lines |
| `red_lines.tradition_without_data_present` (boolean; must be `false` to pass — skill anti-pattern) | red_lines |
| `red_lines.local_optimization_hurting_whole_present` (boolean; must be `false` to pass — skill anti-pattern) | red_lines |

Several checks are computed from the declared rows, using only
the skill's own stated rules plus the arithmetic and
consistency of the declared record itself — no outside
threshold is imported:

- **Steps declared:** the declared `steps` list passes when
  it is present. An absent list is missing evidence. An empty
  list passes: it declares that no steps are recorded.
- **Every step named:** every declared step row must name a
  non-empty `name` string. A row with the field absent is
  missing evidence; a row naming an empty name fails. On an
  empty list the check passes vacuously.
- **Every step's times declared and non-negative:** every
  declared step row must declare both `duration_minutes` and
  `wait_before_minutes`, and neither may be negative (a
  negative duration or wait is not a measurement). A row with
  either field absent is missing evidence. The waits are what
  expose the delays in the flow, per the skill's value-stream
  thinking.
- **No step name duplicated:** no declared step `name` may
  appear on more than one step row. A row with `name` absent
  is missing evidence for this check.
- **Wastes declared:** the declared `wastes` list passes when
  it is present. An absent list is missing evidence. An empty
  list passes: it declares that no waste is observed.
- **Every waste category is a DOWNTIME waste:** every declared
  waste row's `category` must be exactly one of the skill's
  eight wastes — `defects`, `overproduction`, `waiting`,
  `non_utilized_talent`, `transportation`, `inventory`,
  `motion`, `excess_processing`. Any other string fails; a row
  with the field absent is missing evidence.
- **Every waste names a declared step:** every declared waste
  row's `step_name` must name a step declared in the `steps`
  list. A waste tied to an undeclared step fails; a row with
  the field absent, or the `steps` list itself absent, is
  missing evidence.
- **Declared bottleneck matches the longest step:** the
  declared `constraint.bottleneck_step_name` must equal the
  computed bottleneck — the **first** declared step with the
  greatest `duration_minutes` (ties resolve to the first such
  step). The skill's Theory of Constraints: throughput is set
  by the bottleneck, so the step the record names as the
  bottleneck must be the step its own declared durations make
  the longest. The check is missing evidence when the step
  list is absent or empty, when any step lacks a name or a
  duration, or when the bottleneck name itself is absent.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any
of the eight primary computed checks above cannot be
completed), `steps_count` and `wastes_count` (the declared
list lengths, or null when a list is not declared — counts are
reported as integers, exactly), `total_duration_minutes` and
`total_wait_minutes` (the exact sums of the declared step
numbers; each is null when its list is absent or any row omits
that number, and 0 for an empty list), the ratio `wait_share`
(total wait ÷ (total wait + total duration)), the list
`distinct_waste_categories` (the valid DOWNTIME categories
actually observed, in order of first appearance; null when
the wastes list is absent), `duplicate_step_names` (step
names declared on more than one row, in the order their
second occurrence appears), `unmatched_waste_step_names`
(waste rows' step names that name no declared step, per row
in declared order; null when either list is absent), the
coverage ratio `waste_step_coverage` (waste rows naming a
declared step ÷ declared waste rows), and
`bottleneck_step_computed` (the computed bottleneck step name,
or null when it cannot be computed from the declared rows).
**Fixed serialization rule:** computed ratios are reported as
strings with exactly six decimal places, produced in both
implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly
six decimals; comparisons use the unrounded values. A ratio
is null when its denominator list is absent or empty (for
`wait_share`, when either total is unavailable or the two
totals sum to zero). That fixed serialization is what makes
the Python and TypeScript outputs byte-identical.

The skill states **no numeric threshold at all** — its demands
are qualitative declarations the record makes, plus the
classification and consistency rules above, not bars the atom
can set. Quantities are computed and reported; the only bars
on the computed rows are completeness, non-negativity,
category validity, step-name consistency, and the bottleneck
identity, exactly as stated above. Declined thresholds,
named: a maximum wait share or wait time for a step or a
process; a maximum or minimum number of steps, wastes, or
waste categories a review must record; a cycle-time,
lead-time, or throughput target; a number of KPIs that counts
as "a few", or any KPI value target; a Pareto percentage
(such as an 80/20 split) the vital few must account for; a
number of Whys a root-cause analysis must ask; a bottleneck
utilization or capacity figure; a pilot size, duration, or
success percentage; an improvement percentage a pilot must
achieve against baseline before scaling; a monitoring
frequency or a regression threshold; a 5S audit score (5S is
named in the skill's Lean survey but states no record field
or score the review can check — it is not reduced to a check).

The verdict is one of `PROCESS_WASTE_REVIEW_READY` (all 40
checks pass), `PROCESS_WASTE_REVIEW_NOT_READY` (any check
fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but evidence
is missing), across six sections: define_and_visibility,
steps_and_waste_observation, measurement_and_metrics,
analysis_and_constraint, improvement_and_control, red_lines.

## Distinct ground

The nearest siblings are `decision-process-design` (a
decision record — the decision named and framed, criteria and
thresholds precommitted before data is seen, loss functions
and the cost of being wrong in each direction),
`delivery-plan-preparation` (a delivery plan record —
phases, milestones, dependencies, a risk register, status
blocks and approval before build) and `decision-trap-sweep`
(a single decision swept for traps — at least three options,
criteria before scoring, expected value, a pre-mortem). This
atom shares **zero checks** with any of them (verified by
comparing every check name here against every other atom's
source): every check here is a process-waste review question
— a measurable process goal and the customer's actual need,
the whole flow mapped with work made visible and the process
defined before automation, declared step durations and waits
exposing the delays, waste rows classified into the eight
DOWNTIME categories and tied to declared steps, a baseline
from data not anecdote, leading indicators paired with
lagging ones and a KPI set limited to the meaningful, 5 Whys
/ fishbone root cause and the Pareto vital few, the
bottleneck identified as the longest declared step with all
other effort subordinated to it, a piloted PDCA improvement
verified against baseline before scaling as small continuous
kaizen pursuing flow and pull over push, the win standardized
and monitored with regression made visible, and the
operational-excellence anti-patterns refused. The boundary
is: one process's waste review here; decision design,
delivery planning and decision-trap sweeping there.

## Honest scoping

This atom reviews a **declared** process review record — it
observes no process itself, times no step, interviews no one,
inspects no workplace, dashboard, or value-stream map, and
does not verify that a declared review was ever carried out.
A review is ready *on the caller's declared evidence*: a
record that declares a data baseline, a mapped flow, and no
anti-patterns passes those checks even if the real review did
none of it. It is a completeness and consistency audit of the
review record the skill requires, **not a consulting
engagement, a Lean/Six Sigma certification, an operational
audit of a real process, or a prediction that removing the
declared waste will improve the process**: it never judges
whether the named bottleneck is really the system's
constraint in the world, whether the declared root cause is
the true cause, whether a waste classification is the best
one, or whether the improvement will work — only that the
record contains what the skill's method demands, and that
its declared step and waste rows are internally consistent
and arithmetically sound.

Named exclusions and non-reducible parts (carried as caller
declarations only, never judged): no numeric thresholds at
all (see the declined list above); no live verification of
any declared fact; no judgment of review *quality* — whether
the mapping, analysis, or improvement is adequate for the
real process is the caller's declaration, checked only for
declared presence and consistency; **the skill's
person-directed coaching steps are excluded entirely** — its
"How to coach Nrupal specifically" material (reinforcing one
named person's habits, telling that person to do less
properly, closing that person's open loops, naming trade-offs
to that person) is interpersonal coaching of an individual,
not a process record, and no check in this atom reads,
scores, or outputs anything about a person; likewise the
skill's respect-for-people principle is honoured by the
record's shape (the review is of a process, never of a
person's performance) and is not itself a check, because it
states no record field that could be declared or falsified.

## U-13 regulatory screen

Screen result: **No — with the coaching exclusion applied and
named.** This atom's output could not read as regulated
professional advice, and in particular it is not
psychology-adjacent coaching: the census precedent disabled
`difficult-conversation-coaching` because its subject was an
interpersonal conversation with a person. This atom's subject
is the opposite — an operations process record. Its output is
a record audit (completeness, classification, and consistency
of a declared process-waste review: step rows, DOWNTIME waste
rows, a baseline declaration, a bottleneck identity); it
coaches no person, assesses no person's behaviour, mental
state, relationships, or performance, and offers no
interpersonal, psychological, engineering, financial, medical,
or legal advice. The bound skill's one person-directed
section ("How to coach Nrupal specifically") is excluded by
design as a named red line in Honest scoping above — no check
derives from it. The remaining skill content is operations
method (Lean wastes, DMAIC, Theory of Constraints) applied to
a declared record, which is not a regulated professional
service.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally — NOT deployed** —
deterministic core, Python oracle and TypeScript port built
and parity-proven locally; no endpoint is live. Release
happens one by one, by the owner's GO, per the approved queue.
