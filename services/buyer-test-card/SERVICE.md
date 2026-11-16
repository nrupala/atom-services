# Buyer-test card — `buyer-test-card`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Validate ideas with proof-of-concept work — hypothesis, success/kill criteria, timebox, evidence, decision.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Thinking & decisions who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Buyer test gates every offer**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the buyer-test-card manifest

The caller submits one JSON manifest: one buyer-test / POC record — a
single idea worked through the bound skill's method. Every field
below is read by the named section's checks. A field **absent** =
evidence missing (`INSUFFICIENT_EVIDENCE`); a field present but
false / invalid = the check fails (`CARD_NOT_COMPLETE`). All fields
are booleans unless noted.

| Field | Read by |
|---|---|
| `idea` (string; carried into the verdict output, not itself checked) | — |
| `decision` (string; computed, see below; also carried into the verdict output) | decision_and_findings |
| `disposition` (string; computed, see below; also carried into the verdict output) | disposition_and_production_boundary |
| `hypothesis.written` | hypothesis |
| `hypothesis.single` | hypothesis |
| `hypothesis.states_capability_under_constraints` | hypothesis |
| `criteria.success_written_before_start` | criteria_upfront |
| `criteria.kill_written_before_start` | criteria_upfront |
| `criteria.agreed_by_decision_owner_before_build` | criteria_upfront |
| `timebox.hard_limit_set` | timebox_and_scope |
| `timebox.limit_days` (number; computed, see below) | timebox_and_scope |
| `timebox.elapsed_days` (number; computed, see below) | timebox_and_scope |
| `timebox.scope_limited_to_critical_path` | timebox_and_scope |
| `timebox.scope_creep_refused_politely` | timebox_and_scope |
| `evidence.from_measurements_tests_or_demo` | evidence |
| `evidence.numbers_over_impressions` | evidence |
| `evidence.stubs_and_mocks_recorded` | evidence |
| `production_boundary.slid_into_production` (must be `false` to pass — skill red line) | disposition_and_production_boundary |
| `production_boundary.claimed_as_production_evidence` (must be `false` to pass — skill red line) | disposition_and_production_boundary |
| `findings.memo_written` | decision_and_findings |
| `findings.rationale_references_criteria` | decision_and_findings |
| `findings.decision_logged` | decision_and_findings |
| `findings.not_tested_list_clear` | decision_and_findings |
| `findings.adopting_routed_through_full_team_process` | decision_and_findings |

Three checks are computed from the declared values, using only
what the skill itself states plus the arithmetic / set logic of
the declared values — no outside threshold is imported:

- **Timebox enforcement:** the skill's method step 3 is "Timebox:
  hard limit (days, not weeks)" and its red lines bar unbounded
  POCs. When the record declares a timebox limit in days and an
  elapsed time in days, the timebox passes only when the limit is
  positive, the elapsed time is not negative, and the elapsed time
  does not exceed the declared limit. The skill states **no
  numeric cap** on how many days a timebox may be, so none is
  imposed — a 60-day declared limit honoured by the elapsed time
  passes this check on its own terms. If either number is absent,
  the check is missing evidence. The output reports
  `timebox_limit_days` and `timebox_elapsed_days` (the declared
  numbers, null when absent) and `timebox_overrun_days` (elapsed
  minus limit, null when it cannot be computed).
- **Decision vocabulary:** the skill's method step 6 names the
  decision exactly — "adopt / adapt / abandon". A declared
  `decision` therefore passes only when it is one of those three
  stated entries (`adopt`, `adapt`, `abandon`); any other string
  is present and fails, and an absent decision is missing
  evidence. The value is validated as a string only, never
  enum-checked as a type — membership is a verdict check, not a
  type error.
- **Disposition vocabulary:** the skill's method step 4 states
  the disposition exactly — "Disposable by default: POC code is
  throwaway unless explicitly slated for hardening — say which
  it is". A declared `disposition` therefore passes only when it
  is one of the two stated entries (`disposable`,
  `slated_for_hardening`); any other string is present and fails,
  and an absent disposition is missing evidence. The value is
  validated as a string only, never enum-checked as a type —
  membership is a verdict check, not a type error.

**Fixed serialization rule:** the computed overrun is reported as
a string with exactly six decimal places, produced in both
implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six
decimals. That fixed serialization is what makes the Python and
TypeScript outputs byte-identical.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the three computed checks cannot be completed).

The verdict is one of `CARD_COMPLETE` (all 22 checks pass),
`CARD_NOT_COMPLETE` (any check fails), or `INSUFFICIENT_EVIDENCE`
(nothing fails but evidence is missing), across six sections:
hypothesis, criteria_upfront, timebox_and_scope,
disposition_and_production_boundary, evidence,
decision_and_findings.

## Honest scoping

This atom audits a **declared** buyer-test / POC record — it does
not run the POC, build anything, collect measurements, or verify
that a declared value is true. It is a completeness and
consistency audit, **not an idea review**: it never decides
whether the hypothesis is true, whether the idea is worth
pursuing, whether the success/kill criteria are the right ones,
whether the evidence actually supports the decision, or whether
the stated decision is wise — only that the record contains what
the skill's method, quality gates, and red lines demand, and
that its declared timebox arithmetic and its decision /
disposition vocabulary agree with the skill's stated options. A
card is complete *on the caller's declared evidence* even if the
underlying POC was poorly run.

Named exclusions: no POC execution or code of any kind; no
numeric cap on the timebox (the skill's "days, not weeks" states
no number, so none is invented — only the declared limit against
the declared elapsed time is checked); no grading of evidence
quality beyond the declared "numbers over impressions" step; no
decision vocabulary beyond the three options the skill itself
names, and no disposition vocabulary beyond the two states it
names; no live verification of any declared fact. The register's
named doubt for this atom — "Small alone; closest cross-inventory
pair (cf. poc-validation) — merge decision is the owner's at
build time" — is not resolved here: this atom is built standalone
from the bound skill as scaffolded, and any merge stays the
owner's decision.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally** — deterministic core, Python
oracle and TypeScript port built and parity-proven locally; no
endpoint is live. Release happens one by one, by the owner's GO,
per the approved queue.
