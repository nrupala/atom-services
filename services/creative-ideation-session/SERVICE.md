# Creative ideation session — `creative-ideation-session`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Creativity as a practice, not a lightning strike — showing up prepared, drawing from the well, and developing raw ideas into usable ones.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Mind & personal growth who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Content and product ideation**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the creative-ideation-session manifest

The caller submits one JSON manifest: one ideation-session record —
a single session worked through the bound skill's practice. Every
field below is read by the named section's checks. A field
**absent** = evidence missing (`INSUFFICIENT_EVIDENCE`); a field
present but false / invalid = the check fails
(`SESSION_NOT_COMPLETE`). All fields are booleans unless noted.

| Field | Read by |
|---|---|
| `session_title` (string; carried into the verdict output, not itself checked) | — |
| `brief.written` | brief_and_preparation |
| `brief.goal_or_question_stated` | brief_and_preparation |
| `brief.constraints_declared` | brief_and_preparation |
| `preparation.scheduled_in_advance` | brief_and_preparation |
| `preparation.prepared_with_inputs_ready` | brief_and_preparation |
| `capture.capture_system_used` | capture_and_generation |
| `capture.all_ideas_captured` | capture_and_generation |
| `capture.no_judging_at_capture` | capture_and_generation |
| `generation.editing_separated_from_generating` | capture_and_generation |
| `generation.small_reps_or_low_start_bar_used` | capture_and_generation |
| `divergence.diverged_before_converging` | divergence_and_methods |
| `divergence.methods_used` (list of strings; computed, see below; also carried into the verdict output, with its count) | divergence_and_methods |
| `divergence.constraints_used_as_prompt` | divergence_and_methods |
| `idea_pool.target_idea_count` (number; computed, see below) | idea_pool_and_volume |
| `idea_pool.total_ideas_captured` (number; computed, see below) | idea_pool_and_volume |
| `idea_pool.dedup_performed` | idea_pool_and_volume |
| `idea_pool.duplicates_removed` (number; computed, see below) | idea_pool_and_volume |
| `idea_pool.unique_ideas_after_dedup` (number; computed, see below) | idea_pool_and_volume |
| `idea_pool.ideas_clustered_or_grouped` | idea_pool_and_volume |
| `selection.criteria_written_before_scoring` | selection_and_convergence |
| `selection.criteria_applied_to_all_unique_ideas` | selection_and_convergence |
| `selection.scoring_only_after_divergence_complete` | selection_and_convergence |
| `shortlist.shortlist_count` (number; computed, see below) | selection_and_convergence |
| `shortlist.rationale_written` | shortlist_and_ship |
| `shortlist.rationale_references_criteria` | shortlist_and_ship |
| `outcome.shared_for_feedback` | shortlist_and_ship |

Four checks are computed from the declared values, using only
what the skill itself states plus the arithmetic / set logic of
the declared values — no outside threshold is imported:

- **Volume against the declared target:** the skill says "Volume
  precedes quality — generate many ideas, then select" but states
  **no number** for how many ideas is "many", so none is imposed.
  When the record declares a target idea count and a captured
  count, the check passes only when the target is positive, the
  captured count is not negative, and the captured count meets or
  exceeds the caller-declared target. If either number is absent,
  the check is missing evidence. The output reports
  `target_idea_count`, `total_ideas_captured` (the declared
  numbers, null when absent) and `volume_gap_ideas` (captured
  minus target, null when it cannot be computed).
- **Dedup arithmetic:** the record declares a captured total,
  duplicates removed, and unique ideas after dedup. The check
  passes only when all three are present, none is negative, the
  duplicates removed do not exceed the captured total, and the
  declared unique count equals captured minus duplicates. The
  output reports `duplicates_removed`, `unique_ideas_after_dedup`
  and `dedup_discrepancy_ideas` (declared unique minus the
  dedup-implied unique, null when it cannot be computed).
- **Shortlist within the unique pool:** the record declares a
  shortlist count and a unique-after-dedup count. The check
  passes only when the shortlist holds at least one idea and does
  not exceed the declared unique pool. The skill states no
  shortlist size or pool ratio, so none is imposed. The output
  reports `shortlist_count` (null when absent).
- **Divergence-method vocabulary:** the skill's diverge step
  names the techniques exactly — "brainstorm, SCAMPER, analogies,
  combine distant domains, ask 'what if'". A declared
  `methods_used` list therefore passes only when it is non-empty
  and every entry is one of those five stated entries
  (`brainstorm`, `scamper`, `analogies`,
  `combining_distant_domains`, `what_if`); any other entry is
  present and fails, and an absent list is missing evidence. The
  list is validated as a list of strings only, never
  membership-checked as a type — membership is a verdict check,
  not a type error. The skill requires no particular method, so
  no method is mandatory beyond using at least one stated one.
  The output reports `methods_used` and `methods_used_count`
  (null when absent).

**Fixed serialization rule:** the computed differences are
reported as strings with exactly six decimal places, produced in
both implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six
decimals. That fixed serialization is what makes the Python and
TypeScript outputs byte-identical.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the four computed checks cannot be completed).

The verdict is one of `SESSION_COMPLETE` (all 24 checks pass),
`SESSION_NOT_COMPLETE` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across six sections: brief_and_preparation,
capture_and_generation, divergence_and_methods,
idea_pool_and_volume, selection_and_convergence,
shortlist_and_ship.

## Honest scoping

This atom audits a **declared** ideation-session record — it does
not run the session, generate ideas, facilitate anything, or
verify that a declared value is true. It is a completeness and
consistency audit, **not an idea review**: it never generates an
idea, never decides whether any idea is good, original, or worth
pursuing, whether the brief or constraints were the right ones,
whether the methods were used well, whether the selection
criteria are the right criteria, or whether the shortlist picks
the best ideas — only that the record contains what the skill's
practice demands, and that its declared volume, dedup, and
shortlist arithmetic and its method vocabulary agree with the
skill's stated options. A session is complete *on the caller's
declared evidence* even if the underlying session was poorly run
and its ideas are weak.

Named exclusions — thresholds the skill does not state, so none
is invented: no minimum idea count (the skill's "many" states no
number — only the caller-declared target against the declared
captured count is checked); no minimum number of divergence
methods and no mandatory method beyond using at least one stated
one; no session duration or creative-block length (the skill
says protect a regular block, states no length); no shortlist
size cap or shortlist-to-pool ratio (only at least one and not
more than the unique pool); no number of selection criteria, no
scoring scale, pass mark, or score threshold; no dedup or
duplication percentage; no deadline for sharing the output. Also
excluded: any grading of idea quality or originality, any
judgment of whether a method was applied skilfully, and any live
verification of a declared fact. The skill's remaining material
— fuelling ongoing work for the owner, the reading/idea-capture
gap it pairs with, and building in public as a personal practice
— is owner context, not a session-record property, and does not
reduce to deterministic checks; it is not checked. The register's
named doubt for this atom — "Thinking-style; pack only" — is not
resolved here: this atom is built standalone from the bound skill
as scaffolded.

## Pricing

Pricing unit: **tokens**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally** — deterministic core, Python
oracle and TypeScript port built and parity-proven locally; no
endpoint is live. Release happens one by one, by the owner's GO,
per the approved queue.
