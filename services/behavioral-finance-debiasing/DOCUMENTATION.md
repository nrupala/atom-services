# Behavioral finance debiasing — `behavioral-finance-debiasing`

**Behavioral finance debiasing** · slug `behavioral-finance-debiasing` · deliverable type DELIVERABLE · atom version 0.1.0 · status live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md)

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run (Worked example 1 below reproduces it verbatim); every value named here is from that recording.

1. **Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a key for this atom: `POST /v1/keys` with `{"atom": "behavioral-finance-debiasing"}`. Send the key as `Authorization: Bearer <key>` on every call.
2. **Assemble the manifest.** The manifest is one JSON object: a declared record for one decision. In the recorded run the decision is `Sell 50 shares of AAPL` — a declared debiasing pack for one money decision (a big trade) — screening against the eleven key money biases with one found pattern (loss aversion) carrying a named technique surfaced to the user, prospect-theory reframing, pre-commitment rules (current allocation 51.0% against a 50.0% target inside a declared 2.0% rebalancing band), journal / checklists / cooling-off, whole-portfolio reframing (position $1,000 of a $10,000 portfolio, a 10.0000% share), and the guardrails all respected. Build yours field by field from the Input reference below; leave a field out only if you want it reported as missing evidence.
3. **Call the atom.** `POST https://atoms.pipavia.com/v1/behavioral-finance-debiasing` with the manifest as the body and the `Authorization` header set (see How-to guides for the MCP form of the same call).
4. **Read the verdict.** The recorded run returned HTTP 200 with verdict `DEBIASED`: 36 pass, 0 fail, 0 missing of 36 checks across six sections. Every section status is `pass` and every check status is `pass`.
5. **Use the detail.** The `checks` array names each of the 36 checks with its section and the evidence it read; `summary` counts pass / fail / missing; `stamp` is the same verdict as a plain-text stamp you can paste into a record. If any check had failed or been missing, the verdict, the section statuses and the check statuses would name exactly which — that is the subject of the third how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "behavioral-finance-debiasing"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.
4. Call: `POST https://atoms.pipavia.com/v1/behavioral-finance-debiasing` — body = the manifest object (see Input reference). The response is the verdict object (see Output format).

### Call via MCP

Connect your MCP client to `POST https://atoms.pipavia.com/mcp/behavioral-finance-debiasing` with the same `Authorization: Bearer <key>` header, and call the tool `behavioral_finance_debiasing`. The `tools/call` arguments are the manifest object itself — the same JSON you would send as the REST body. The MCP result's structured content is the same verdict object the REST face returns (external verification confirmed MCP/REST parity on the full-pass case; see TEST-REPORT.md).

### Read a failing verdict and fix the manifest

A verdict other than `DEBIASED` is not an error — it is the deliverable doing its job. Read it in this order:

1. **Verdict.** `NOT_DEBIASED` — At least one check fails; the failing checks name the breached section and the evidence against it. `INSUFFICIENT_EVIDENCE` means nothing failed but evidence is missing.
2. **Sections.** The `sections` object gives one status per section: `pass`, `fail`, or `insufficient_evidence`. Start with the sections that are not `pass`.
3. **Checks.** In the `checks` array, find entries with status `fail` (a field was present but did not meet the requirement — for a must-be-`false` field, it was declared `true`; for a computed check, the declared values did not satisfy the computed rule) and entries with status `missing` (the supporting field was absent from the manifest). Each check's `evidence` string states what the check requires.
4. **Fix the manifest, not the verdict.** For a `fail`, correct the declared value in the underlying record, then redeclare it truthfully. For a `missing`, supply the absent field. Then resubmit the whole manifest — the atom is stateless and deterministic, so the same manifest always returns the same verdict.
Worked example 2 below is a real failing run of this atom: verdict `NOT_DEBIASED`, 1 pass, 3 fail, 32 missing of 36 checks across six sections. The failing checks are: `allocation_within_rebalancing_band`, `not_framed_as_single_position_pnl`, `biases_not_used_to_manipulate`.

### Handle a 422 invalid_input

A type error is rejected before any check runs — you get HTTP 422, never a verdict. The recorded malformed run for this atom (Worked example 3) returned:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "context",
  "detail": "context must be an object"
}
```

`field` names the offending field (`context`) and `detail` states the expected type ("context must be an object"). Fix that field's type in the manifest — consult the Input reference for each field's type — and resubmit. Do not drop the field to silence the 422 unless you intend it to be reported as missing evidence instead.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/behavioral-finance-debiasing` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/behavioral-finance-debiasing` — tool name `behavioral_finance_debiasing`; `tools/call` arguments = the manifest object.
- **Keys:** sign up via `POST /v1/signup`, then `POST /v1/keys` with `{"atom": "behavioral-finance-debiasing"}`. Key scope: this atom only — a key's scope for one atom never verifies for another (per `contract.yaml`, keys are per user, per atom; the key itself is regenerated on demand after authentication and never stored).

### Input reference

The manifest is one JSON object with 41 fields. All fields are booleans unless a different type is stated in the Type column. A field **absent** = evidence missing (counts toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails. Fields are grouped below exactly as SERVICE.md groups them (by the section that reads them).

#### Top level

| Field | Type | Notes |
|---|---|---|
| `decision` | string | string; carried into the verdict output, not itself checked |

#### `journal_checklists_and_cooling_off`

| Field | Type | Notes |
|---|---|---|
| `context.is_big_trade` | boolean | gates the cooling-off check below |
| `journal_and_checklists.decision_journal_reasoning_recorded` | boolean | — |
| `journal_and_checklists.decisions_reviewed_separately_from_outcomes` | boolean | — |
| `journal_and_checklists.base_rates_used` | boolean | — |
| `journal_and_checklists.checklists_used` | boolean | — |
| `journal_and_checklists.cooling_off_period_taken` | boolean | required when the trade is big; otherwise the check passes as not applicable |

#### `bias_screening`

| Field | Type | Notes |
|---|---|---|
| `bias_screening.loss_aversion_screened` | boolean | — |
| `bias_screening.disposition_effect_screened` | boolean | — |
| `bias_screening.mental_accounting_screened` | boolean | — |
| `bias_screening.anchoring_to_purchase_price_screened` | boolean | — |
| `bias_screening.recency_availability_screened` | boolean | — |
| `bias_screening.herding_fomo_screened` | boolean | — |
| `bias_screening.overconfidence_illusion_of_control_screened` | boolean | — |
| `bias_screening.confirmation_screened` | boolean | — |
| `bias_screening.sunk_cost_screened` | boolean | — |
| `bias_screening.home_bias_screened` | boolean | — |
| `bias_screening.narrative_bias_screened` | boolean | — |
| `bias_patterns.found` | array of objects `{bias, technique_named, surfaced_to_user}` | list of `{bias, technique_named, surfaced_to_user}`; computed, see below |

#### `prospect_theory_reframing`

| Field | Type | Notes |
|---|---|---|
| `prospect_theory.reference_point_identified` | boolean | — |
| `prospect_theory.framed_vs_reference_not_absolute_wealth` | boolean | — |
| `prospect_theory.loss_asymmetry_acknowledged` | boolean | — |
| `prospect_theory.risk_attitude_by_domain_checked` | boolean | — |
| `prospect_theory.probability_weighting_checked` | boolean | — |

#### `precommitment_rules`

| Field | Type | Notes |
|---|---|---|
| `precommitment.investment_policy_statement_present` | boolean | — |
| `precommitment.written_sell_criteria_present` | boolean | — |
| `precommitment.rules_decided_before_emotion_arrives` | boolean | — |
| `precommitment.rebalancing_target_allocation_percent` | number | number; computed, see below |
| `precommitment.rebalancing_current_allocation_percent` | number | number; computed, see below |
| `precommitment.rebalancing_band_percent` | number | number; computed, see below |

#### `whole_portfolio_reframing`

| Field | Type | Notes |
|---|---|---|
| `whole_portfolio.reframed_in_whole_portfolio_absolute_terms` | boolean | — |
| `whole_portfolio.single_position_pnl_framing_used` | boolean | must be `false` to pass |
| `whole_portfolio.position_value` | number | number; computed report only, see below |
| `whole_portfolio.whole_portfolio_value` | number | number; computed report only, see below |

#### `guardrails_and_anti_patterns`

| Field | Type | Notes |
|---|---|---|
| `guardrails.bias_patterns_surfaced_to_user` | boolean | — |
| `guardrails.tool_calculates_user_decides` | boolean | — |
| `guardrails.not_advice_line_respected` | boolean | — |
| `guardrails.biases_used_to_manipulate` | boolean | must be `false` to pass — skill anti-pattern |
| `guardrails.trade_nudge_present` | boolean | must be `false` to pass |
| `guardrails.markets_assumed_perfectly_efficient_or_irrational` | boolean | must be `false` to pass — skill anti-pattern |
| `guardrails.single_bias_treated_as_whole_story` | boolean | must be `false` to pass — skill anti-pattern |

### Checks

The recorded full-pass response carries 36 checks across 6 sections (`bias_screening`, `prospect_theory_reframing`, `precommitment_rules`, `journal_checklists_and_cooling_off`, `whole_portfolio_reframing`, `guardrails_and_anti_patterns`). Every check is listed below with the requirement stated in its recorded `evidence` string. General semantics: a check's status is `pass` when its requirement is met on the declared values, `fail` when the supporting field is present but the requirement is not met, and `missing` when the supporting field is absent. A section's status is `pass` when all its checks pass, `fail` when any check fails, and `insufficient_evidence` when no check fails but at least one is missing.

Conditional (not-applicable) check: `cooling_off_period_taken_before_big_trade`, gated by `context.is_big_trade`. When the gate is off the recorded status is `pass` (not applicable); when the gate is on, `true` → `pass`, `false` → `fail`, absent → `missing`.

| Section | Check | What passing requires (recorded evidence) | Pass / fail / missing semantics |
|---|---|---|---|
| `bias_screening` | `loss_aversion_screened` | key money biases: the decision is screened for loss aversion | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `bias_screening` | `disposition_effect_screened` | key money biases: the decision is screened for disposition effect (sell winners too early, ride losers too long) | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `bias_screening` | `mental_accounting_screened` | key money biases: the decision is screened for mental accounting | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `bias_screening` | `anchoring_to_purchase_price_screened` | key money biases: the decision is screened for anchoring to purchase price | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `bias_screening` | `recency_availability_screened` | key money biases: the decision is screened for recency/availability | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `bias_screening` | `herding_fomo_screened` | key money biases: the decision is screened for herding & FOMO | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `bias_screening` | `overconfidence_illusion_of_control_screened` | key money biases: the decision is screened for overconfidence and illusion of control | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `bias_screening` | `confirmation_screened` | key money biases: the decision is screened for confirmation | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `bias_screening` | `sunk_cost_screened` | key money biases: the decision is screened for sunk cost | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `bias_screening` | `home_bias_screened` | key money biases: the decision is screened for home bias | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `bias_screening` | `narrative_bias_screened` | key money biases: the decision is screened for narrative bias | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `bias_screening` | `all_found_patterns_have_technique_named` | debiasing techniques: every bias pattern found carries a named debiasing technique (an empty found list passes — no found pattern lacks a technique) | Computed: every found pattern declares `technique_named: true` → `pass` (an empty list passes); any pattern without → `fail`; list absent → `missing` |
| `bias_screening` | `all_found_patterns_surfaced_to_user` | surface the user's own bias patterns back to them so they can self-correct (an empty found list passes — no found pattern was withheld) | Computed: every found pattern declares `surfaced_to_user: true` → `pass` (an empty list passes); any pattern without → `fail`; list absent → `missing` |
| `prospect_theory_reframing` | `reference_point_identified` | prospect theory: decisions are reference-dependent — the reference point is identified | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `prospect_theory_reframing` | `framed_vs_reference_not_absolute_wealth` | prospect theory: the decision is framed as gain/loss vs the reference point, not absolute wealth | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `prospect_theory_reframing` | `loss_asymmetry_acknowledged` | prospect theory: losses loom roughly twice as large as equivalent gains — the asymmetry is acknowledged in the framing | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `prospect_theory_reframing` | `risk_attitude_by_domain_checked` | prospect theory: risk-averse in the domain of gains, risk-seeking in the domain of losses — the decision's domain attitude is checked | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `prospect_theory_reframing` | `probability_weighting_checked` | prospect theory: rare probabilities are overweighted and near-certain ones underweighted — the weighting is checked | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `precommitment_rules` | `investment_policy_statement_present` | pre-commit rules: an investment policy statement is present | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `precommitment_rules` | `written_sell_criteria_present` | pre-commit rules: written sell criteria are present | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `precommitment_rules` | `rules_decided_before_emotion_arrives` | pre-commit rules: decide before emotion arrives — the rules were decided before the emotion of this decision | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `precommitment_rules` | `allocation_within_rebalancing_band` | pre-commit rules: rebalancing bands — the declared current allocation's distance from the declared target allocation is at or below the declared band percent | Computed: |current − target| at or below the caller-declared band → `pass`; above → `fail`; any of the three numbers absent → `missing` |
| `journal_checklists_and_cooling_off` | `decision_journal_reasoning_recorded` | decision journal / decision archaeology: record the reasoning | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `journal_checklists_and_cooling_off` | `decisions_reviewed_separately_from_outcomes` | decision archaeology: review decisions separately from outcomes | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `journal_checklists_and_cooling_off` | `base_rates_used` | debiasing techniques: base rates are used | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `journal_checklists_and_cooling_off` | `checklists_used` | debiasing techniques: checklists are used | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `journal_checklists_and_cooling_off` | `cooling_off_period_taken_before_big_trade` | debiasing techniques: cooling-off periods before big trades | Conditional: required when the trade is big (`true` → `pass`, `false` → `fail`, absent → `missing`); not a big trade → `pass` (not applicable) |
| `whole_portfolio_reframing` | `reframed_in_whole_portfolio_absolute_terms` | debiasing techniques: reframe in whole-portfolio absolute terms | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `whole_portfolio_reframing` | `not_framed_as_single_position_pnl` | debiasing techniques: the reframe is not left as single-position P&L | `false` → `pass`; `true` → `fail`; absent → `missing` |
| `guardrails_and_anti_patterns` | `bias_patterns_surfaced_to_user` | surface the user's own bias patterns back to them so they can self-correct | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `guardrails_and_anti_patterns` | `tool_calculates_user_decides` | tool calculates, user decides | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `guardrails_and_anti_patterns` | `not_advice_line_respected` | stay on the FINRA/CSA 'not advice' line | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `guardrails_and_anti_patterns` | `biases_not_used_to_manipulate` | anti-pattern to refuse: using biases to manipulate | `false` → `pass`; `true` → `fail`; absent → `missing` |
| `guardrails_and_anti_patterns` | `no_trade_nudge` | never nudge them into a trade | `false` → `pass`; `true` → `fail`; absent → `missing` |
| `guardrails_and_anti_patterns` | `markets_not_assumed_perfectly_efficient_or_irrational` | anti-pattern to refuse: assuming markets are perfectly efficient or perfectly irrational | `false` → `pass`; `true` → `fail`; absent → `missing` |
| `guardrails_and_anti_patterns` | `single_bias_not_treated_as_whole_story` | anti-pattern to refuse: treating one bias as the whole story | `false` → `pass`; `true` → `fail`; absent → `missing` |

### Output format

A successful call (HTTP 200) returns one JSON object:

| Field | Meaning |
|---|---|
| `service` | Always `"behavioral-finance-debiasing"` |
| `atom_version` | Atom version that produced the verdict (`"0.1.0"`) |
| `decision` | The declared decision, carried through from the manifest (not itself checked) |
| `verdict` | One of the verdict values below |
| `sections` | Object mapping each section name to its section status (`pass` / `fail` / `insufficient_evidence`) |
| `checks` | Array of 36 objects, each `{section, check, status, evidence}` — `status` is `pass` / `fail` / `missing`; `evidence` states what the check requires |
| `computed_status` | `within_declared_band_on_declared_evidence` / `outside_declared_band_on_declared_evidence` / null when the rebalancing check cannot be completed |
| `bias_patterns_found_count` | The declared `bias_patterns.found` list length, or null |
| `allocation_drift_over_band_percent` | |current − target| − band, string with exactly four decimals; null when any of the three numbers is undeclared |
| `position_share_percent_of_portfolio` | 100 × position value / whole portfolio value, string with exactly four decimals; null when either value is undeclared or the whole-portfolio value is zero. Report only — no threshold is attached |
| `summary` | Plain-language count, e.g. the recorded full-pass summary: "36 pass, 0 fail, 0 missing of 36 checks across six sections." |
| `stamp` | The same verdict rendered as a plain-text stamp for pasting into a record |

### Verdict vocabulary

**Verdicts** (the `verdict` field — every value this atom can return):

- `DEBIASED` — Every check passes; the decision is debiased on the declared evidence.
- `NOT_DEBIASED` — At least one check fails; the failing checks name the breached section and the evidence against it.
- `INSUFFICIENT_EVIDENCE` — Nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

**Section statuses** (values in the `sections` object): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (the `status` field of each `checks` entry): `pass` — the requirement is met on the declared values (for a conditional check whose gate is off, `pass` is recorded with not-applicable semantics — see Checks); `fail` — the supporting field is present but the requirement is not met; `missing` — the supporting field is absent, so there is no evidence to judge.

**Computed status** (the `computed_status` field, where present): see Output format — it summarises the computed checks as within / outside the stated limits on the declared evidence, or null when a primary computed check cannot be completed.

### Errors

Only the error shapes evidenced in the gateway documentation (USER-GUIDE.md) and the recorded trial runs are documented here; no other payload shapes are claimed.

- **401 — unauthenticated:** missing or invalid key. (Status and meaning per USER-GUIDE.md; no recorded body in the evidence for this atom.)
- **403 — scope:** the key lacks this atom's scope. (Status and meaning per USER-GUIDE.md; no recorded body in the evidence for this atom.)
- **422 — `invalid_input`:** a manifest field has the wrong type. Recorded body shape: `{"ok": false, "error": "invalid_input", "field": "<field>", "detail": "<detail>"}` — this atom's recorded instance is `context` / "context must be an object" (Worked example 3, verbatim). No verdict is returned.
- **429 — rate limit:** the per-key rate limit (below) is exceeded. (Status and meaning per USER-GUIDE.md; no recorded body in the evidence for this atom.)

### Rate limits and pricing

- **Rate limits (from `contract.yaml`):** 60 requests per key per minute; 10,000 requests per key per day. The contract notes this is the SPEC default capacity guard for open public usage, tuned per atom at build-out from measured production cost.
- **Pricing:** Free during trial — rate pending. `contract.yaml` sets pricing unit `deliverable` with `rate: null` (`rate_status: pending`); SERVICE.md states no price is set and prices are set only from measured production cost per unit.

## Explanation

What this atom does, in depth: you submit a declared record — the manifest — and the atom audits that record, deterministically, against the method, quality gates and red lines of its bound skill. It runs 36 checks grouped into 6 sections (bias_screening, prospect_theory_reframing, precommitment_rules, journal_checklists_and_cooling_off, whole_portfolio_reframing, guardrails_and_anti_patterns), computes the computed checks described below from the declared values alone, and returns a single verdict with per-section and per-check evidence. Same manifest in → same verdict out: external verification confirmed byte-identical repeat REST responses and MCP/REST parity (see TEST-REPORT.md). One unit of sale is one delivered verdict — the atom sells the deliverable it produces, never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic; there is no model judgment in the loop. Each check reads declared field(s): an **absent** field is missing evidence (check status `missing`), while a field **present but false / invalid** is a failure (check status `fail`) — that distinction is the atom's central semantics, and it drives the verdict: any `fail` produces the failing verdict; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only when every check passes does the atom return its pass verdict. Section statuses aggregate the same way (`pass` / `fail` / `insufficient_evidence`).

**Computed checks.** One check is computed against a caller-declared limit, two checks are computed over the declared patterns list, and one value is computed and reported only. **Rebalancing band:** target, current allocation, and band are all caller-declared (the skill states no figures) — the current allocation's distance from the target passes at or below the declared band and fails above it (equality passes); if any of the three numbers is absent, the check is missing evidence. **Found patterns:** every entry in `bias_patterns.found` must declare `technique_named: true` and `surfaced_to_user: true`; an empty list passes both checks; a missing list is missing evidence; the `bias` string is a caller-declared label, type-validated as a string only and never checked against a bias vocabulary. **Position share (report only):** `position_share_percent_of_portfolio` = 100 × `position_value` / `whole_portfolio_value` (null when either value is undeclared or the whole-portfolio value is zero); no pass/fail threshold is attached. The output also reports `computed_status` (null when the rebalancing check cannot be completed), `bias_patterns_found_count` (the declared list length, or null), and `allocation_drift_over_band_percent` (|current − target| − band; null when any of the three numbers is undeclared). Both derived numbers are reported as strings with exactly four decimal places (round half up to 4dp, `floor(v * 10000 + 0.5) / 10000`, then format with exactly four decimals; comparisons use the unrounded values) — that fixed serialization is what makes the Python and TypeScript outputs byte-identical. The cooling-off check is conditional on `context.is_big_trade` and passes as not applicable when the trade is not big; no cooling-off duration is checked, because this skill states no number of hours.

**What it does NOT do.** This atom audits a **declared** debiasing pack — it does not
interview the investor, detect biases in live behaviour, give
financial advice, nudge any trade, or verify that a declared
value is true. A decision is debiased *on the caller's declared
evidence*: a manifest that declares a full bias screen, an
investment policy statement, and a cooling-off period passes
those checks even if none of it happened. It is a completeness
audit of the record the skill requires, **not a behavioural
diagnosis and not advice**: it never judges whether the
decision itself is wise, whether a screened bias is actually
present, or whether a named technique was applied well — only
that the record contains what the skill's bias catalogue,
prospect-theory points, debiasing techniques, and anti-patterns
demand. The personal material in the bound skill (notes about
the owner's own positions and his product) is context for the
skill's author, not a check: nothing in it is read by this atom,
and no check is derived from it.

Named exclusions: no check of any prose (journal reasoning
quality, reframe quality are judgment, and the skill states no
vocabulary for grading them, so none is invented); no bias
vocabulary is imposed on `bias_patterns.found[].bias` (the
eleven catalogue biases are each checked as their own declared
screening field, because the skill lists them as the key money
biases to spot; a caller's found-pattern labels stay their
own); no cooling-off duration is checked — the skill requires
cooling-off periods before big trades but, unlike its sibling
skill, states no number of hours, so only that a period was
taken is checked, and only for big trades; no prospect-theory
magnitude is computed — "losses loom roughly twice as large"
is checked as an acknowledged framing point, not turned into a
loss-weight formula the skill never states as a calculation;
no rebalancing figure is imposed — target and band are
caller-declared, because the skill requires bands but states
no values; no live verification of any declared fact.

**Buyer and use context.** First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Money & markets who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves. Self-use (passed): see SERVICE.md — the house itself calls this atom in its own workflow, as an internal caller at zero price metered to the internal cost ledger. The recorded trial runs below are the external-verification battery for the release candidate now in its one-week RC soak.

## Role views

### For integrators

You need the verdict inside another system or agent loop. Use the REST endpoint `POST https://atoms.pipavia.com/v1/behavioral-finance-debiasing` (or the MCP tool `behavioral_finance_debiasing`) with a per-atom scoped key, treat HTTP 200 verdicts — including failing verdicts — as successful deliveries, and branch on `verdict`, `sections` and the per-check `status` values rather than on HTTP status. Reserve error handling for 401 / 403 / 422 / 429 (see Errors). The call is stateless and deterministic: cache or replay a manifest freely; an identical manifest returns an identical verdict. Respect the per-key limits (60/min, 10,000/day) and note pricing is free during trial with the rate pending.

### For developers

Manifest authoring: declare every field in the Input reference truthfully — omitting a field is a positive statement that the evidence does not exist (`missing`), not a neutral default, and declaring `false` where the record is actually silent converts a fixable `INSUFFICIENT_EVIDENCE` into a failing verdict. Mind the must-be-`false` fields, the computed checks (their rules are stated in full under Explanation), and the conditional gates where this atom has them. Determinism: the verdict core is a deterministic function of the manifest alone. Implementation pointers: core in `src/behavioral_finance_debiasing.py`, tests in `tests/test_behavioral_finance_debiasing.py` (see TEST-REPORT.md for the external battery: full-pass, violations, sparse, malformed, determinism, and MCP/REST parity).

### For ops

Endpoints: REST `POST https://atoms.pipavia.com/v1/behavioral-finance-debiasing` and MCP `POST https://atoms.pipavia.com/mcp/behavioral-finance-debiasing` on gateway v1.1.0 at https://atoms.pipavia.com. Keys are per user, per atom; a 403 spike means callers are presenting keys without this atom's scope, a 401 spike means missing/invalid keys, 422s mean malformed manifests naming the field in the body, and 429s mean the per-key limit (60/min, 10,000/day) is being hit — monitor those four codes separately from verdict mix, since failing verdicts are HTTP 200 by design. Status: live — release candidate (one-week RC soak to 2026-11-22); atom version 0.1.0. Pricing is free during trial (rate pending), so trial traffic is metered, not billed, per `contract.yaml`.

## Worked examples

Provenance: recorded 2026-11-16T00:44:11.512359+00:00 against gateway v1.1.0, external verification lane, source `verification/work/behavioral-finance-debiasing/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases. Each example shows the case's recorded `input` and the REST execution's recorded `response_text`, pretty-printed with two-space indent; the JSON values are verbatim.

### Example 1 — full-pass

Request — `POST /v1/behavioral-finance-debiasing`:

```json
{
  "decision": "Sell 50 shares of AAPL",
  "context": {
    "is_big_trade": true
  },
  "bias_screening": {
    "loss_aversion_screened": true,
    "disposition_effect_screened": true,
    "mental_accounting_screened": true,
    "anchoring_to_purchase_price_screened": true,
    "recency_availability_screened": true,
    "herding_fomo_screened": true,
    "overconfidence_illusion_of_control_screened": true,
    "confirmation_screened": true,
    "sunk_cost_screened": true,
    "home_bias_screened": true,
    "narrative_bias_screened": true
  },
  "bias_patterns": {
    "found": [
      {
        "bias": "loss_aversion",
        "technique_named": true,
        "surfaced_to_user": true
      }
    ]
  },
  "prospect_theory": {
    "reference_point_identified": true,
    "framed_vs_reference_not_absolute_wealth": true,
    "loss_asymmetry_acknowledged": true,
    "risk_attitude_by_domain_checked": true,
    "probability_weighting_checked": true
  },
  "precommitment": {
    "investment_policy_statement_present": true,
    "written_sell_criteria_present": true,
    "rules_decided_before_emotion_arrives": true,
    "rebalancing_target_allocation_percent": 50.0,
    "rebalancing_current_allocation_percent": 51.0,
    "rebalancing_band_percent": 2.0
  },
  "journal_and_checklists": {
    "decision_journal_reasoning_recorded": true,
    "decisions_reviewed_separately_from_outcomes": true,
    "base_rates_used": true,
    "checklists_used": true,
    "cooling_off_period_taken": true
  },
  "whole_portfolio": {
    "reframed_in_whole_portfolio_absolute_terms": true,
    "single_position_pnl_framing_used": false,
    "position_value": 1000.0,
    "whole_portfolio_value": 10000.0
  },
  "guardrails": {
    "bias_patterns_surfaced_to_user": true,
    "tool_calculates_user_decides": true,
    "not_advice_line_respected": true,
    "biases_used_to_manipulate": false,
    "trade_nudge_present": false,
    "markets_assumed_perfectly_efficient_or_irrational": false,
    "single_bias_treated_as_whole_story": false
  }
}
```

Response — HTTP 200:

```json
{
  "service": "behavioral-finance-debiasing",
  "atom_version": "0.1.0",
  "decision": "Sell 50 shares of AAPL",
  "verdict": "DEBIASED",
  "sections": {
    "bias_screening": "pass",
    "prospect_theory_reframing": "pass",
    "precommitment_rules": "pass",
    "journal_checklists_and_cooling_off": "pass",
    "whole_portfolio_reframing": "pass",
    "guardrails_and_anti_patterns": "pass"
  },
  "checks": [
    {
      "section": "bias_screening",
      "check": "loss_aversion_screened",
      "status": "pass",
      "evidence": "key money biases: the decision is screened for loss aversion"
    },
    {
      "section": "bias_screening",
      "check": "disposition_effect_screened",
      "status": "pass",
      "evidence": "key money biases: the decision is screened for disposition effect (sell winners too early, ride losers too long)"
    },
    {
      "section": "bias_screening",
      "check": "mental_accounting_screened",
      "status": "pass",
      "evidence": "key money biases: the decision is screened for mental accounting"
    },
    {
      "section": "bias_screening",
      "check": "anchoring_to_purchase_price_screened",
      "status": "pass",
      "evidence": "key money biases: the decision is screened for anchoring to purchase price"
    },
    {
      "section": "bias_screening",
      "check": "recency_availability_screened",
      "status": "pass",
      "evidence": "key money biases: the decision is screened for recency/availability"
    },
    {
      "section": "bias_screening",
      "check": "herding_fomo_screened",
      "status": "pass",
      "evidence": "key money biases: the decision is screened for herding & FOMO"
    },
    {
      "section": "bias_screening",
      "check": "overconfidence_illusion_of_control_screened",
      "status": "pass",
      "evidence": "key money biases: the decision is screened for overconfidence and illusion of control"
    },
    {
      "section": "bias_screening",
      "check": "confirmation_screened",
      "status": "pass",
      "evidence": "key money biases: the decision is screened for confirmation"
    },
    {
      "section": "bias_screening",
      "check": "sunk_cost_screened",
      "status": "pass",
      "evidence": "key money biases: the decision is screened for sunk cost"
    },
    {
      "section": "bias_screening",
      "check": "home_bias_screened",
      "status": "pass",
      "evidence": "key money biases: the decision is screened for home bias"
    },
    {
      "section": "bias_screening",
      "check": "narrative_bias_screened",
      "status": "pass",
      "evidence": "key money biases: the decision is screened for narrative bias"
    },
    {
      "section": "bias_screening",
      "check": "all_found_patterns_have_technique_named",
      "status": "pass",
      "evidence": "debiasing techniques: every bias pattern found carries a named debiasing technique (an empty found list passes \u2014 no found pattern lacks a technique)"
    },
    {
      "section": "bias_screening",
      "check": "all_found_patterns_surfaced_to_user",
      "status": "pass",
      "evidence": "surface the user's own bias patterns back to them so they can self-correct (an empty found list passes \u2014 no found pattern was withheld)"
    },
    {
      "section": "prospect_theory_reframing",
      "check": "reference_point_identified",
      "status": "pass",
      "evidence": "prospect theory: decisions are reference-dependent \u2014 the reference point is identified"
    },
    {
      "section": "prospect_theory_reframing",
      "check": "framed_vs_reference_not_absolute_wealth",
      "status": "pass",
      "evidence": "prospect theory: the decision is framed as gain/loss vs the reference point, not absolute wealth"
    },
    {
      "section": "prospect_theory_reframing",
      "check": "loss_asymmetry_acknowledged",
      "status": "pass",
      "evidence": "prospect theory: losses loom roughly twice as large as equivalent gains \u2014 the asymmetry is acknowledged in the framing"
    },
    {
      "section": "prospect_theory_reframing",
      "check": "risk_attitude_by_domain_checked",
      "status": "pass",
      "evidence": "prospect theory: risk-averse in the domain of gains, risk-seeking in the domain of losses \u2014 the decision's domain attitude is checked"
    },
    {
      "section": "prospect_theory_reframing",
      "check": "probability_weighting_checked",
      "status": "pass",
      "evidence": "prospect theory: rare probabilities are overweighted and near-certain ones underweighted \u2014 the weighting is checked"
    },
    {
      "section": "precommitment_rules",
      "check": "investment_policy_statement_present",
      "status": "pass",
      "evidence": "pre-commit rules: an investment policy statement is present"
    },
    {
      "section": "precommitment_rules",
      "check": "written_sell_criteria_present",
      "status": "pass",
      "evidence": "pre-commit rules: written sell criteria are present"
    },
    {
      "section": "precommitment_rules",
      "check": "rules_decided_before_emotion_arrives",
      "status": "pass",
      "evidence": "pre-commit rules: decide before emotion arrives \u2014 the rules were decided before the emotion of this decision"
    },
    {
      "section": "precommitment_rules",
      "check": "allocation_within_rebalancing_band",
      "status": "pass",
      "evidence": "pre-commit rules: rebalancing bands \u2014 the declared current allocation's distance from the declared target allocation is at or below the declared band percent"
    },
    {
      "section": "journal_checklists_and_cooling_off",
      "check": "decision_journal_reasoning_recorded",
      "status": "pass",
      "evidence": "decision journal / decision archaeology: record the reasoning"
    },
    {
      "section": "journal_checklists_and_cooling_off",
      "check": "decisions_reviewed_separately_from_outcomes",
      "status": "pass",
      "evidence": "decision archaeology: review decisions separately from outcomes"
    },
    {
      "section": "journal_checklists_and_cooling_off",
      "check": "base_rates_used",
      "status": "pass",
      "evidence": "debiasing techniques: base rates are used"
    },
    {
      "section": "journal_checklists_and_cooling_off",
      "check": "checklists_used",
      "status": "pass",
      "evidence": "debiasing techniques: checklists are used"
    },
    {
      "section": "journal_checklists_and_cooling_off",
      "check": "cooling_off_period_taken_before_big_trade",
      "status": "pass",
      "evidence": "debiasing techniques: cooling-off periods before big trades"
    },
    {
      "section": "whole_portfolio_reframing",
      "check": "reframed_in_whole_portfolio_absolute_terms",
      "status": "pass",
      "evidence": "debiasing techniques: reframe in whole-portfolio absolute terms"
    },
    {
      "section": "whole_portfolio_reframing",
      "check": "not_framed_as_single_position_pnl",
      "status": "pass",
      "evidence": "debiasing techniques: the reframe is not left as single-position P&L"
    },
    {
      "section": "guardrails_and_anti_patterns",
      "check": "bias_patterns_surfaced_to_user",
      "status": "pass",
      "evidence": "surface the user's own bias patterns back to them so they can self-correct"
    },
    {
      "section": "guardrails_and_anti_patterns",
      "check": "tool_calculates_user_decides",
      "status": "pass",
      "evidence": "tool calculates, user decides"
    },
    {
      "section": "guardrails_and_anti_patterns",
      "check": "not_advice_line_respected",
      "status": "pass",
      "evidence": "stay on the FINRA/CSA 'not advice' line"
    },
    {
      "section": "guardrails_and_anti_patterns",
      "check": "biases_not_used_to_manipulate",
      "status": "pass",
      "evidence": "anti-pattern to refuse: using biases to manipulate"
    },
    {
      "section": "guardrails_and_anti_patterns",
      "check": "no_trade_nudge",
      "status": "pass",
      "evidence": "never nudge them into a trade"
    },
    {
      "section": "guardrails_and_anti_patterns",
      "check": "markets_not_assumed_perfectly_efficient_or_irrational",
      "status": "pass",
      "evidence": "anti-pattern to refuse: assuming markets are perfectly efficient or perfectly irrational"
    },
    {
      "section": "guardrails_and_anti_patterns",
      "check": "single_bias_not_treated_as_whole_story",
      "status": "pass",
      "evidence": "anti-pattern to refuse: treating one bias as the whole story"
    }
  ],
  "computed_status": "within_declared_band_on_declared_evidence",
  "bias_patterns_found_count": 1,
  "allocation_drift_over_band_percent": "-1.0000",
  "position_share_percent_of_portfolio": "10.0000",
  "summary": "36 pass, 0 fail, 0 missing of 36 checks across six sections.",
  "stamp": "BEHAVIORAL FINANCE DEBIASING\ndecision: Sell 50 shares of AAPL\nVERDICT: DEBIASED\n  bias_screening                   pass\n  prospect_theory_reframing        pass\n  precommitment_rules              pass\n  journal_checklists_and_cooling_off pass\n  whole_portfolio_reframing        pass\n  guardrails_and_anti_patterns     pass\n36 pass, 0 fail, 0 missing of 36 checks across six sections."
}
```

### Example 2 — violations

Request — `POST /v1/behavioral-finance-debiasing`:

```json
{
  "decision": "Panic sell",
  "context": {
    "is_big_trade": true
  },
  "bias_screening": {
    "loss_aversion_screened": true
  },
  "precommitment": {
    "rebalancing_target_allocation_percent": 50.0,
    "rebalancing_current_allocation_percent": 60.0,
    "rebalancing_band_percent": 5.0
  },
  "whole_portfolio": {
    "single_position_pnl_framing_used": true
  },
  "guardrails": {
    "biases_used_to_manipulate": true
  }
}
```

Response — HTTP 200:

```json
{
  "service": "behavioral-finance-debiasing",
  "atom_version": "0.1.0",
  "decision": "Panic sell",
  "verdict": "NOT_DEBIASED",
  "sections": {
    "bias_screening": "insufficient_evidence",
    "prospect_theory_reframing": "insufficient_evidence",
    "precommitment_rules": "fail",
    "journal_checklists_and_cooling_off": "insufficient_evidence",
    "whole_portfolio_reframing": "fail",
    "guardrails_and_anti_patterns": "fail"
  },
  "checks": [
    {
      "section": "bias_screening",
      "check": "loss_aversion_screened",
      "status": "pass",
      "evidence": "key money biases: the decision is screened for loss aversion"
    },
    {
      "section": "bias_screening",
      "check": "disposition_effect_screened",
      "status": "missing",
      "evidence": "key money biases: the decision is screened for disposition effect (sell winners too early, ride losers too long)"
    },
    {
      "section": "bias_screening",
      "check": "mental_accounting_screened",
      "status": "missing",
      "evidence": "key money biases: the decision is screened for mental accounting"
    },
    {
      "section": "bias_screening",
      "check": "anchoring_to_purchase_price_screened",
      "status": "missing",
      "evidence": "key money biases: the decision is screened for anchoring to purchase price"
    },
    {
      "section": "bias_screening",
      "check": "recency_availability_screened",
      "status": "missing",
      "evidence": "key money biases: the decision is screened for recency/availability"
    },
    {
      "section": "bias_screening",
      "check": "herding_fomo_screened",
      "status": "missing",
      "evidence": "key money biases: the decision is screened for herding & FOMO"
    },
    {
      "section": "bias_screening",
      "check": "overconfidence_illusion_of_control_screened",
      "status": "missing",
      "evidence": "key money biases: the decision is screened for overconfidence and illusion of control"
    },
    {
      "section": "bias_screening",
      "check": "confirmation_screened",
      "status": "missing",
      "evidence": "key money biases: the decision is screened for confirmation"
    },
    {
      "section": "bias_screening",
      "check": "sunk_cost_screened",
      "status": "missing",
      "evidence": "key money biases: the decision is screened for sunk cost"
    },
    {
      "section": "bias_screening",
      "check": "home_bias_screened",
      "status": "missing",
      "evidence": "key money biases: the decision is screened for home bias"
    },
    {
      "section": "bias_screening",
      "check": "narrative_bias_screened",
      "status": "missing",
      "evidence": "key money biases: the decision is screened for narrative bias"
    },
    {
      "section": "bias_screening",
      "check": "all_found_patterns_have_technique_named",
      "status": "missing",
      "evidence": "debiasing techniques: every bias pattern found carries a named debiasing technique (an empty found list passes \u2014 no found pattern lacks a technique)"
    },
    {
      "section": "bias_screening",
      "check": "all_found_patterns_surfaced_to_user",
      "status": "missing",
      "evidence": "surface the user's own bias patterns back to them so they can self-correct (an empty found list passes \u2014 no found pattern was withheld)"
    },
    {
      "section": "prospect_theory_reframing",
      "check": "reference_point_identified",
      "status": "missing",
      "evidence": "prospect theory: decisions are reference-dependent \u2014 the reference point is identified"
    },
    {
      "section": "prospect_theory_reframing",
      "check": "framed_vs_reference_not_absolute_wealth",
      "status": "missing",
      "evidence": "prospect theory: the decision is framed as gain/loss vs the reference point, not absolute wealth"
    },
    {
      "section": "prospect_theory_reframing",
      "check": "loss_asymmetry_acknowledged",
      "status": "missing",
      "evidence": "prospect theory: losses loom roughly twice as large as equivalent gains \u2014 the asymmetry is acknowledged in the framing"
    },
    {
      "section": "prospect_theory_reframing",
      "check": "risk_attitude_by_domain_checked",
      "status": "missing",
      "evidence": "prospect theory: risk-averse in the domain of gains, risk-seeking in the domain of losses \u2014 the decision's domain attitude is checked"
    },
    {
      "section": "prospect_theory_reframing",
      "check": "probability_weighting_checked",
      "status": "missing",
      "evidence": "prospect theory: rare probabilities are overweighted and near-certain ones underweighted \u2014 the weighting is checked"
    },
    {
      "section": "precommitment_rules",
      "check": "investment_policy_statement_present",
      "status": "missing",
      "evidence": "pre-commit rules: an investment policy statement is present"
    },
    {
      "section": "precommitment_rules",
      "check": "written_sell_criteria_present",
      "status": "missing",
      "evidence": "pre-commit rules: written sell criteria are present"
    },
    {
      "section": "precommitment_rules",
      "check": "rules_decided_before_emotion_arrives",
      "status": "missing",
      "evidence": "pre-commit rules: decide before emotion arrives \u2014 the rules were decided before the emotion of this decision"
    },
    {
      "section": "precommitment_rules",
      "check": "allocation_within_rebalancing_band",
      "status": "fail",
      "evidence": "pre-commit rules: rebalancing bands \u2014 the declared current allocation's distance from the declared target allocation is at or below the declared band percent"
    },
    {
      "section": "journal_checklists_and_cooling_off",
      "check": "decision_journal_reasoning_recorded",
      "status": "missing",
      "evidence": "decision journal / decision archaeology: record the reasoning"
    },
    {
      "section": "journal_checklists_and_cooling_off",
      "check": "decisions_reviewed_separately_from_outcomes",
      "status": "missing",
      "evidence": "decision archaeology: review decisions separately from outcomes"
    },
    {
      "section": "journal_checklists_and_cooling_off",
      "check": "base_rates_used",
      "status": "missing",
      "evidence": "debiasing techniques: base rates are used"
    },
    {
      "section": "journal_checklists_and_cooling_off",
      "check": "checklists_used",
      "status": "missing",
      "evidence": "debiasing techniques: checklists are used"
    },
    {
      "section": "journal_checklists_and_cooling_off",
      "check": "cooling_off_period_taken_before_big_trade",
      "status": "missing",
      "evidence": "debiasing techniques: cooling-off periods before big trades"
    },
    {
      "section": "whole_portfolio_reframing",
      "check": "reframed_in_whole_portfolio_absolute_terms",
      "status": "missing",
      "evidence": "debiasing techniques: reframe in whole-portfolio absolute terms"
    },
    {
      "section": "whole_portfolio_reframing",
      "check": "not_framed_as_single_position_pnl",
      "status": "fail",
      "evidence": "debiasing techniques: the reframe is not left as single-position P&L"
    },
    {
      "section": "guardrails_and_anti_patterns",
      "check": "bias_patterns_surfaced_to_user",
      "status": "missing",
      "evidence": "surface the user's own bias patterns back to them so they can self-correct"
    },
    {
      "section": "guardrails_and_anti_patterns",
      "check": "tool_calculates_user_decides",
      "status": "missing",
      "evidence": "tool calculates, user decides"
    },
    {
      "section": "guardrails_and_anti_patterns",
      "check": "not_advice_line_respected",
      "status": "missing",
      "evidence": "stay on the FINRA/CSA 'not advice' line"
    },
    {
      "section": "guardrails_and_anti_patterns",
      "check": "biases_not_used_to_manipulate",
      "status": "fail",
      "evidence": "anti-pattern to refuse: using biases to manipulate"
    },
    {
      "section": "guardrails_and_anti_patterns",
      "check": "no_trade_nudge",
      "status": "missing",
      "evidence": "never nudge them into a trade"
    },
    {
      "section": "guardrails_and_anti_patterns",
      "check": "markets_not_assumed_perfectly_efficient_or_irrational",
      "status": "missing",
      "evidence": "anti-pattern to refuse: assuming markets are perfectly efficient or perfectly irrational"
    },
    {
      "section": "guardrails_and_anti_patterns",
      "check": "single_bias_not_treated_as_whole_story",
      "status": "missing",
      "evidence": "anti-pattern to refuse: treating one bias as the whole story"
    }
  ],
  "computed_status": "outside_declared_band_on_declared_evidence",
  "bias_patterns_found_count": null,
  "allocation_drift_over_band_percent": "5.0000",
  "position_share_percent_of_portfolio": null,
  "summary": "1 pass, 3 fail, 32 missing of 36 checks across six sections.",
  "stamp": "BEHAVIORAL FINANCE DEBIASING\ndecision: Panic sell\nVERDICT: NOT_DEBIASED\n  bias_screening                   insufficient_evidence\n  prospect_theory_reframing        insufficient_evidence\n  precommitment_rules              fail\n  journal_checklists_and_cooling_off insufficient_evidence\n  whole_portfolio_reframing        fail\n  guardrails_and_anti_patterns     fail\n1 pass, 3 fail, 32 missing of 36 checks across six sections."
}
```

### Example 3 — malformed

Request — `POST /v1/behavioral-finance-debiasing`:

```json
{
  "decision": "Malformed test",
  "context": "not_an_object"
}
```

Response — HTTP 422:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "context",
  "detail": "context must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present (tutorial / how-to / reference / explanation) | Yes — Tutorial, How-to guides, Reference and Explanation sections above; output is CommonMark markdown |
| Role views present (integrators / developers / ops / regulators) | Integrators Yes; developers Yes; ops Yes; regulators N/A — N/A — finance-domain but not compliance-facing: SERVICE.md scopes the verdict as an advisory method check (a completeness audit of a declared debiasing pack, explicitly not financial advice, not a behavioural diagnosis, and never a trade nudge — one guardrail check is itself that the not-advice line was respected); the verdict is not compliance or audit evidence for any regulated activity. |
| Checks named (documented / recorded) | 36 / 36 — every check in the recorded full-pass response is listed under Reference → Checks |
| Verdict vocabulary complete | Yes — 3 verdict values, plus section statuses and per-check statuses |
| Input reference typed | Yes — 41 fields, each with its type, grouped as in SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass / violations / malformed inputs and REST responses compared as JSON values against `verification/work/behavioral-finance-debiasing/evidence.json` after writing |

