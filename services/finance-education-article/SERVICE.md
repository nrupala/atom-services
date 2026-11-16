# Finance education article — `finance-education-article`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Finance education content, no signals (thinkwithfinance).

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Money & markets who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Think With Finance article production**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Distinct ground (vs the live sibling)

The live sibling `finance-content-compliance-check` audits the **compliance posture** of finance content — advice-vs-licensing boundary, risk framing, calculators and tools, commercial honesty, corrections and privacy. This atom audits the **article-production record** under its own bound skill (`finance-content`): whether the declared record shows an article built the way that skill prescribes — its structure in the skill's order, its mechanics shown in a worked example whose arithmetic re-derives, no buy/sell signals and no trade execution, the article's own disclosures (assumptions, data dates, limits), and the education-only review declarations. The check sets do not duplicate: no sibling check (personalized-recommendation, disclaimer, figure sourcing/re-derivation, risk framing, calculator, commercial, correction or privacy check) appears here, and no check here appears there. This atom writes no article; it audits the declared article-production record only, and it never reads the article's prose.

## Inputs — the finance-education article-production manifest

The caller submits one JSON manifest. Every field below is read by the
named section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the
check fails (`NOT_ARTICLE_READY`). All fields are booleans unless noted.

| Field | Read by |
|---|---|
| `article` (string; the article title, carried into the verdict output, not itself checked) | — |
| `topic` (non-empty string; the concept the article explains) | article_structure |
| `structure.concept_explained` | article_structure |
| `structure.framework_taught_not_answer` | article_structure |
| `structure.what_to_watch_close_present` | article_structure |
| `structure.section_order` (list of strings; computed check — must equal exactly `["concept", "worked_example", "what_to_watch"]`, the skill's structure in order) | article_structure |
| `worked_example.present` | worked_example |
| `worked_example.steps` (list of worked-example steps; absent / not a list / empty = both computed checks missing) | worked_example |
| `worked_example.steps[].operation` (string; one of `add`, `subtract`, `multiply`, `divide` — any other value makes the step incomplete, not failed) | worked_example |
| `worked_example.steps[].operands` (list of numbers; at least one operand, at least two for `subtract`/`divide`; a zero divisor after the first operand makes the step incomplete) | worked_example |
| `worked_example.steps[].declared_result` (number; compared with the re-derived result at 6-decimal formatting) | worked_example |
| `signals.buy_sell_signals_present` (must be `false` to pass) | no_signals |
| `signals.implied_trade_present` (must be `false` to pass) | no_signals |
| `signals.trade_execution_present` (must be `false` to pass) | no_signals |
| `disclosure.uses_data_or_assumptions` (gates all four disclosure checks below) | disclosures |
| `disclosure.assumptions_stated` (required when the article uses data or assumptions; otherwise the check passes as not applicable) | disclosures |
| `disclosure.data_dates_stated` (required when the article uses data or assumptions; otherwise the check passes as not applicable) | disclosures |
| `disclosure.limits_stated` (required when the article uses data or assumptions; otherwise the check passes as not applicable) | disclosures |
| `disclosure.data_as_of` (non-empty string; the article's data as-of date; required when the article uses data or assumptions, otherwise the check passes as not applicable) | disclosures |
| `review.education_only_review_passed` | review |
| `review.think_with_finance_voice_confirmed` | review |
| `review.plain_language_review_passed` | review |
| `review.no_hype_confirmed` | review |

Two checks are computed, not declared: the declared section order is
compared with the skill's structure (concept, worked example,
what-to-watch), and every complete worked-example step is re-derived
from its declared operands and operation and compared with its
declared result at 6-decimal formatting. The verdict dict also
reports `steps_evaluated` and `steps_incomplete` counts. No threshold
is invented by the atom — it checks the caller's declared evidence
only.

The verdict is one of `ARTICLE_READY` (all 19 checks pass),
`NOT_ARTICLE_READY` (any check fails), or `INSUFFICIENT_EVIDENCE`
(nothing fails but evidence is missing), across five sections:
article_structure, worked_example, no_signals, disclosures, review.

## Declined thresholds (named, not invented)

The skill states none of the following, so the atom sets none of them:

- **No article length threshold** — no minimum or maximum word count, in the skill or here.
- **No readability / reading-level score** — "explained simply" is a reviewer declaration, never a computed score.
- **No freshness window for data dates** — the skill requires data dates to be stated; it sets no maximum age, so an old-but-stated date passes and only an unstated or empty date fails.
- **No minimum source count and no per-figure sourcing rule** — the skill for this atom states no sourcing count; per-figure sourcing is the sibling compliance atom's ground and is deliberately not duplicated here.
- **No arithmetic tolerance beyond 6-decimal formatting** — steps re-derive exactly at the fleet's 6-decimal formatting; no looser percentage or absolute tolerance is grounded in the skill.
- **No partial credit for section order** — the skill gives one structure in one order; a different declared order fails, with no near-miss band.

## Non-reducible parts (stated plainly)

Writing quality, clarity, pedagogy, Think With Finance voice fidelity,
whether the framework is genuinely taught rather than an answer given,
and whether prose in fact implies a trade are judgment-shaped and
cannot be decided from declared fields. They enter this atom only as
caller/reviewer declarations (`review.*`, `structure.framework_taught_not_answer`,
`signals.*`) — the atom records and verdicts those declarations, it
never judges the prose itself and never claims to have read the article.

## Status

Tier B · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.

## Named doubt (from the register)

Commodity content writing
