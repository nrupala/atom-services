# Difficult conversation coaching — `difficult-conversation-coaching`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): When emotions drive the outcome, manages those first — firm on substance, warm on tone, using Goleman's four domains.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Mind & personal growth who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Vendor escalation communication coaching**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the conversation-preparation manifest

The caller submits one JSON manifest: a declared
conversation-preparation record for one difficult conversation.
Every field below is read by the named section's checks. A field
**absent** = evidence missing (`INSUFFICIENT_EVIDENCE`); a field
present but false / invalid = the check fails
(`CONVERSATION_PREPARATION_INCOMPLETE`). All fields are booleans
unless noted.

| Field | Read by |
|---|---|
| `conversation_title` (string; carried into the verdict output, not itself checked) | — |
| `preparation_domains` (list of strings; computed, see below — every entry is a string by type; membership in the skill's stated four-domain vocabulary is a verdict check, not a type error) | preparation_and_self_regulation |
| `self_awareness.emotion_named` | preparation_and_self_regulation |
| `self_awareness.pause_before_reacting_planned` | preparation_and_self_regulation |
| `self_management.firm_not_hot_stance_declared` | preparation_and_self_regulation |
| `self_management.regulation_approach_declared` | preparation_and_self_regulation |
| `self_management.venting_in_writing_present` (must be `false` to pass — skill anti-pattern) | preparation_and_self_regulation |
| `self_management.emotion_suppressed_instead_of_regulated_present` (must be `false` to pass — skill anti-pattern) | preparation_and_self_regulation |
| `rehearsal.rehearsal_completed` | preparation_and_self_regulation |
| `empathy.counterpart_emotion_considered` | empathy_and_social_awareness |
| `empathy.emotion_separated_from_position` | empathy_and_social_awareness |
| `empathy.acknowledgement_before_redirect_planned` | empathy_and_social_awareness |
| `empathy.strongest_reasonable_version_identified` | empathy_and_social_awareness |
| `framing.facts_led_with` | framing_and_assertiveness |
| `framing.specifics_prepared` | framing_and_assertiveness |
| `framing.ask_stated_clearly` | framing_and_assertiveness |
| `framing.boundary_stated_clearly` | framing_and_assertiveness |
| `framing.firm_on_substance_warm_on_tone_declared` | framing_and_assertiveness |
| `framing.hostility_mirroring_present` (must be `false` to pass — skill anti-pattern) | framing_and_assertiveness |
| `structure.own_part_owned` | structure_feedback_and_next_step |
| `structure.other_view_invited` | structure_feedback_and_next_step |
| `structure.concrete_next_step_proposed` | structure_feedback_and_next_step |
| `feedback.feedback_to_be_given` (boolean gate; gates the three feedback-points checks below) | structure_feedback_and_next_step |
| `feedback_points` (list of feedback-point objects, each `{name, situation_stated, behavior_described, impact_stated, targets_identity}` — see the five entry fields below; computed, see below) | structure_feedback_and_next_step |
| `feedback_points[].name` (string; names the row in the computed `feedback_points_without_complete_sbi` / `feedback_points_targeting_identity` outputs) | structure_feedback_and_next_step |
| `feedback_points[].situation_stated` | structure_feedback_and_next_step |
| `feedback_points[].behavior_described` | structure_feedback_and_next_step |
| `feedback_points[].impact_stated` | structure_feedback_and_next_step |
| `feedback_points[].targets_identity` (must be `false` on every row to pass — skill rule: critique the behavior, never the identity) | structure_feedback_and_next_step |
| `safeguards.do_not_respond_list_checked` | safeguards_repair_and_close |
| `safeguards.target_on_do_not_respond_list` (must be `false` to pass — skill guardrail) | safeguards_repair_and_close |
| `safeguards.register_appropriate_to_relationship_declared` | safeguards_repair_and_close |
| `repair.thread_has_soured` (boolean gate; gates the repair-move check below) | safeguards_repair_and_close |
| `repair.repair_move_planned` (required when a soured thread is declared; otherwise the check passes as not applicable) | safeguards_repair_and_close |
| `repair.relationship_and_outcome_protected_over_point_scoring_declared` | safeguards_repair_and_close |
| `repair.winning_argument_losing_relationship_present` (must be `false` to pass — skill anti-pattern) | safeguards_repair_and_close |

Five checks are computed from the declared record, using only
the skill's own stated structure plus the consistency of the
declared rows themselves — no outside threshold is imported:

- **Preparation domains declared:** the declared
  `preparation_domains` list passes only when it is present and
  non-empty; an absent list is missing evidence, an empty list
  fails.
- **All four domains, in the stated order:** the skill names
  Goleman's four domains exactly — self-awareness →
  self-management → social awareness (empathy) → relationship
  management — and states "They build in that order." The check
  therefore passes only when the declared list is exactly those
  four entries (`self_awareness`, `self_management`,
  `social_awareness`, `relationship_management`) in that order;
  a missing domain, an unknown entry, a duplicate, or any other
  order fails. An absent list is missing evidence.
- **Feedback points declared (gated):** required only when
  `feedback.feedback_to_be_given` is declared `true`; the
  declared `feedback_points` list must then be present and
  non-empty. When no feedback is declared to be given, the check
  passes as not applicable.
- **SBI complete per feedback point (gated):** the skill binds
  feedback to SBI — Situation, Behavior, Impact. When feedback
  is declared to be given, every declared feedback-point row
  must declare `situation_stated`, `behavior_described` and
  `impact_stated` all `true`. A row with any of the three fields
  absent is missing evidence; a row with any of them `false`
  fails.
- **No feedback point targets identity (gated):** the skill's
  feedback rule is "Critique the behavior, never the identity."
  When feedback is declared to be given, every declared row must
  declare `targets_identity: false`. A row with the field absent
  is missing evidence; a row declaring it `true` fails.

One further check is conditional, following the skill's own
scoping — computed from the declared gate field:

- **Repair move:** the skill binds its repair rule to a soured
  thread ("When a thread sours, name it and make the
  high-functioning move"). `repair_move_planned` is therefore
  required only when `repair.thread_has_soured` is declared
  `true`; when no soured thread is declared, the check passes as
  not applicable.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the five primary computed checks above cannot be completed),
`preparation_domains_count` and `feedback_points_count` (the
declared list lengths, or null when the list is not declared —
counts are reported as integers, exactly),
`preparation_domains_missing` (the canonical domains not
declared, in canonical order; null when the list is not
declared), the row-name lists
`feedback_points_without_complete_sbi` and
`feedback_points_targeting_identity` (null when the
`feedback_points` list is not declared), and the two coverage
ratios `preparation_domain_coverage` (distinct stated domains
declared ÷ the four stated domains) and `sbi_coverage`
(feedback points with complete SBI ÷ declared feedback points).
**Fixed serialization rule:** computed ratios are reported as
strings with exactly four decimal places, produced in both
implementations by the same rule — round half up to 4dp,
`floor(v * 10000 + 0.5) / 10000`, then format with exactly four
decimals; comparisons use the unrounded values. A ratio is null
when its list is absent — and, for `sbi_coverage`, also when the
declared list is empty; `preparation_domain_coverage` over an
empty declared list is `"0.0000"`, because its denominator is
the skill's fixed four domains, not the declared list. That
fixed serialization is what makes the Python and TypeScript
outputs byte-identical.

The skill states no numeric threshold — no pause duration, no
rehearsal count or duration, no number of facts or specifics, no
next-step deadline, and no empathy, tone or wording score — so
no numeric threshold check is invented. Quantities are computed
and reported; the only bars on the computed rows are the
skill's own stated vocabulary and order (the four domains) and
completeness over the caller's own declared rows (every
declared feedback point), exactly as stated above. Declined
thresholds, named: a minimum pause length before reacting; a
minimum rehearsal count or rehearsal duration; a minimum number
of facts, specifics or feedback points beyond at least one when
feedback is declared; a deadline or timeframe for the concrete
next step; a numeric empathy, warmth, tone or wording-quality
score of any kind; a domain-practice duration for any of the
four domains.

The verdict is one of `CONVERSATION_PREPARATION_COMPLETE` (all
31 checks pass), `CONVERSATION_PREPARATION_INCOMPLETE` (any
check fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but
evidence is missing), across five sections:
preparation_and_self_regulation, empathy_and_social_awareness,
framing_and_assertiveness, structure_feedback_and_next_step,
safeguards_repair_and_close.

## Honest scoping

This atom audits a **declared** conversation-preparation record
— it does not coach, does not generate dialogue or wording, does
not rehearse anyone, does not sit in on or verify any
conversation, and does not verify that a declared preparation
step actually happened or was done well. A preparation is
complete *on the caller's declared evidence*: a manifest that
declares the emotion named, the strongest reasonable version
identified, and SBI-complete feedback passes those checks even
if the real preparation did none of it. It is a completeness
and consistency audit of the record the skill requires, **not a
coaching service or a conversation-quality certification**.

Everything judgment-shaped is caller declaration only and is
stated plainly here as **NOT judged**: whether the declared
empathy is genuine or well-aimed; whether the wording, tone or
warmth of anything the caller will say is actually right;
whether the timing of the conversation is right; whether the
named emotion is the true emotion; whether the identified
"strongest reasonable version" is actually the strongest or the
reasonable one; whether the facts led with are accurate or
complete; whether the ask, the boundary or the next step is the
right one; and whether the conversation will go well. The atom
checks only that each of those preparation acts is *declared*,
in the structure the skill states.

Named exclusions: no numeric thresholds (see the declined list
above); no check of any actual conversation, message or
transcript — only the declared preparation record; no
do-not-respond list is held or consulted by the atom — the
record declares only that the caller's own list was checked and
whether the counterpart is on it; the skill's named-person
register rules (strictly professional with one named contact;
warm, sometimes Hindi-register voice with friends and family)
are not reduced to per-person checks — the record declares only
that the register appropriate to the relationship was chosen,
and the atom names no person and holds no register rule of its
own; the skill's escalation-colour material (the Oracle / Flexiti
/ The Brick escalations working because they are persistent and
precise) is the owner's worked example, not a preparation-record
property, and reduces only to the firm-not-hot declaration
already checked; no live verification of any declared fact. The
register's named doubt for this atom — "Generic coaching
advice" — is answered by the scoping above, not resolved away:
this atom sells no advice at all, only the audit of a declared
preparation record against the skill's stated structure.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.
