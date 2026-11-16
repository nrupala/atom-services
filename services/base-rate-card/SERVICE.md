# Base-rate card — `base-rate-card`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Think clearly under pressure — evidence hierarchy, base rates, steelmanning, fallacy checks, calibration.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Thinking & decisions who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Decision support on product calls**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the base-rate-card manifest

The caller submits one JSON manifest: one judgment card — a single
claim worked through the bound skill's method, with the base-rate
step at its centre. Every field below is read by the named
section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid =
the check fails (`CARD_NOT_COMPLETE`). All fields are booleans
unless noted.

| Field | Read by |
|---|---|
| `claim` (string; carried into the verdict output, not itself checked) | — |
| `evidence.claim_restated_precisely` | claim_and_evidence |
| `evidence.supporting_evidence_sought` | claim_and_evidence |
| `evidence.refuting_evidence_sought` | claim_and_evidence |
| `evidence.hierarchy_applied` | claim_and_evidence |
| `evidence.conflicts_noted_with_reasons` | claim_and_evidence |
| `base_rate.reference_class_defined` | base_rates |
| `base_rate.considered_first` | base_rates |
| `base_rate.reference_class_size` (number; computed, see below) | base_rates |
| `base_rate.reference_class_successes` (number; computed, see below) | base_rates |
| `base_rate.stated` (number; computed, see below) | base_rates |
| `steelman.strongest_counterargument_built` | steelman |
| `steelman.counterargument_engaged` | steelman |
| `steelman.opposing_view_strawmanned` (must be `false` to pass — skill red line) | steelman |
| `fallacies.spot_check_performed` | fallacy_spot_check |
| `fallacies.checked` (list of strings; computed, see below) | fallacy_spot_check |
| `calibration.confidence_stated` | calibration |
| `calibration.confidence_value` (number; computed, see below) | calibration |
| `calibration.outcomes_reviewed` | calibration |
| `calibration.hit_rate_tracked_by_confidence_band` | calibration |
| `judgment.second_order_effects_considered` | second_order_and_judgment |
| `judgment.written` | second_order_and_judgment |
| `judgment.includes_confidence` | second_order_and_judgment |
| `judgment.includes_key_uncertainties` | second_order_and_judgment |
| `judgment.conclusion_from_vibes_or_authority_alone` (must be `false` to pass — skill red line) | second_order_and_judgment |
| `judgment.certainty_outruns_evidence` (must be `false` to pass — skill red line) | second_order_and_judgment |

Three checks are computed from the declared values, using only
what the skill itself states plus the arithmetic of the declared
numbers — no outside threshold is imported:

- **Base-rate consistency:** the skill's method step 3 is "Base
  rates first: what usually happens in cases like this?" When the
  card declares a reference-class size, a success count, and a
  stated base rate, the stated rate passes only when it equals the
  rate the counts imply (successes / size), the counts are
  coherent (size positive, successes between zero and size
  inclusive), and the stated rate is a probability (between zero
  and one inclusive). If any of the three numbers is absent, the
  check is missing evidence. The output reports `reference_rate`
  (the implied rate, null when it cannot be computed) and
  `base_rate_difference` (stated minus implied, null likewise).
- **Fallacy coverage:** the skill's method step 5 names the
  spot-check list — ad hominem, straw man, false dilemma, appeal
  to authority/antiquity, survivorship stories, motivated
  reasoning, cherry-picked windows. The declared
  `fallacies.checked` list therefore passes only when it contains
  all seven stated entries (`ad_hominem`, `straw_man`,
  `false_dilemma`, `appeal_to_authority_or_antiquity`,
  `survivorship`, `motivated_reasoning`,
  `cherry_picked_windows`); unknown entries do not count toward
  coverage. A missing list is missing evidence; an empty list is
  present and fails. The output reports the omitted stated entries
  as `fallacies_not_checked` (null when no list is declared).
  Entries are validated as strings only, never enum-checked —
  coverage is a verdict check, not a type error.
- **Confidence bounds:** the skill's method step 6 states
  confidence as a probability ("80% sure"). A declared
  `calibration.confidence_value` therefore passes only between
  zero and one inclusive; an absent value is missing evidence.

**Fixed serialization rule:** computed rates are reported as
strings with exactly six decimal places, produced in both
implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six
decimals; comparisons use the unrounded values except the
consistency check, which compares the fixed-6dp difference to
zero. That fixed serialization is what makes the Python and
TypeScript outputs byte-identical.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the three computed checks cannot be completed).

The verdict is one of `CARD_COMPLETE` (all 23 checks pass),
`CARD_NOT_COMPLETE` (any check fails), or `INSUFFICIENT_EVIDENCE`
(nothing fails but evidence is missing), across six sections:
claim_and_evidence, base_rates, steelman, fallacy_spot_check,
calibration, second_order_and_judgment.

## Honest scoping

This atom audits a **declared** judgment card — it does not source
reference-class data, restate the claim, build the steelman, or
verify that a declared value is true. The register's named doubt
for this atom — reference-class data sourcing per domain — stays
the caller's: the card declares its own reference class, counts,
and stated rate, and this core checks only their internal
consistency and the completeness of the skill's method on the
declared evidence. A card is complete *on the caller's declared
evidence* even if its conclusion is wrong. It is a completeness
and consistency audit, **not a judgment review**: it never decides
whether the claim is true, whether the reference class is the
right one, whether the steelman is actually strong, or whether
the stated confidence is warranted — only that the card contains
what the skill's method, quality gates, and red lines demand, and
that its declared base-rate arithmetic agrees with itself.

Named exclusions: no sourcing or verification of any reference
class or base rate (per-domain sourcing is unresolved in the
register and is not invented here); no grading of evidence quality
beyond the declared hierarchy step (the skill names the hierarchy
tiers but states no scoring, so none is imposed); no fallacy
vocabulary beyond the seven entries the skill itself names; no
calibration score (the skill requires tracking hit rate by
confidence band but states no formula or pass mark, so only the
tracking declaration and the probability bounds of the stated
confidence are checked); no live verification of any declared
fact.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.
