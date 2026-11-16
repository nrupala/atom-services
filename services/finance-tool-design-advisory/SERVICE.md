# Finance tool design advisory — `finance-tool-design-advisory`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Designs finance tools and ideas that make people smarter about money without crossing into advice — quant rigor with a privacy-first ethos.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Money & markets who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **PAE feature design work**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the finance-tool-design manifest

The caller submits one JSON manifest: a declared finance-tool
design record for one tool. Every field below is read by the named
section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid =
the check fails (`FINANCE_TOOL_DESIGN_NOT_SOUND`). All fields are
booleans unless noted.

| Field | Read by |
|---|---|
| `tool` (string; carried into the verdict output, not itself checked) | — |
| `compliance.tool_calculates_user_decides` (boolean) | compliance_and_advice_boundary |
| `compliance.recommendation_language_present` (boolean; must be `false` to pass — skill compliance line) | compliance_and_advice_boundary |
| `compliance.disclaimers_carried` (boolean) | compliance_and_advice_boundary |
| `compliance.finra_2214_and_csa_framing_addressed` (boolean) | compliance_and_advice_boundary |
| `compliance.advice_like_language_redesigned_to_scenarios` (boolean) | compliance_and_advice_boundary |
| `margin.margin_features_present` (boolean; gates the margin-disclosure check below) | compliance_and_advice_boundary |
| `margin.margin_disclosure_carried` (boolean; required when margin features are declared present; otherwise the check passes as not applicable) | compliance_and_advice_boundary |
| `quant.risk_and_return_presented_together` (boolean) | quant_fundamentals |
| `quant.diversification_and_correlation_addressed` (boolean) | quant_fundamentals |
| `quant.mpt_limits_disclosed` (boolean) | quant_fundamentals |
| `quant.factor_thinking_addressed` (boolean) | quant_fundamentals |
| `quant.regime_awareness_addressed` (boolean) | quant_fundamentals |
| `quant.tax_and_fee_aware_returns` (boolean) | quant_fundamentals |
| `features` (list of feature-row objects, each with the entry fields below; computed, see below) | compliance_and_advice_boundary, reproducibility_privacy_and_open_finance, anti_patterns |
| `features[].name` (string; names the row in the computed outputs) | compliance_and_advice_boundary, reproducibility_privacy_and_open_finance, anti_patterns |
| `features[].shows_scenarios_and_tradeoffs` (boolean) | compliance_and_advice_boundary |
| `features[].implies_advice_present` (boolean; must be `false` per row to pass the computed advice check) | compliance_and_advice_boundary |
| `features[].figures_traceable` (boolean) | reproducibility_privacy_and_open_finance |
| `features[].is_backtest` (boolean; gates the overfit/survivorship check below) | anti_patterns |
| `features[].overfit_and_survivorship_addressed` (boolean; required when the row is a backtest; otherwise the check passes as not applicable to that row) | anti_patterns |
| `open_building_blocks.open_data_sources_used` (boolean) | reproducibility_privacy_and_open_finance |
| `open_building_blocks.open_source_analytics_used` (boolean) | reproducibility_privacy_and_open_finance |
| `open_building_blocks.every_number_reproducible_and_auditable` (boolean) | reproducibility_privacy_and_open_finance |
| `privacy.zero_knowledge_design` (boolean) | reproducibility_privacy_and_open_finance |
| `privacy.user_held_keys` (boolean) | reproducibility_privacy_and_open_finance |
| `privacy.data_selling_present` (boolean; must be `false` to pass — skill privacy line) | reproducibility_privacy_and_open_finance |
| `business_model.monetization_via_certification_membership_or_developer_licenses` (boolean) | business_model_and_behavioral_design |
| `business_model.core_features_gated_present` (boolean; must be `false` to pass — skill FOSS model) | business_model_and_behavioral_design |
| `behavioral.biases_accounted_for` (boolean) | business_model_and_behavioral_design |
| `behavioral.decision_history_used_as_insight` (boolean) | business_model_and_behavioral_design |
| `anti_patterns.guaranteed_or_return_promising_language_present` (boolean; must be `false` to pass — skill anti-pattern) | anti_patterns |
| `anti_patterns.black_box_risk_numbers_present` (boolean; must be `false` to pass — skill anti-pattern) | anti_patterns |
| `anti_patterns.fees_taxes_slippage_ignored_present` (boolean; must be `false` to pass — skill anti-pattern) | anti_patterns |
| `anti_patterns.overfit_backtests_present` (boolean; must be `false` to pass — skill anti-pattern) | anti_patterns |
| `anti_patterns.survivorship_bias_present` (boolean; must be `false` to pass — skill anti-pattern) | anti_patterns |

Several checks are computed from the declared rows, using only
the skill's own stated rules plus the consistency of the declared
record itself — no outside threshold is imported:

- **Features declared:** the declared `features` list passes
  only when it is present and non-empty; an absent list is
  missing evidence, an empty list fails.
- **Scenarios per feature:** every declared feature row must
  declare `shows_scenarios_and_tradeoffs: true` (the skill:
  "Surface analytics, scenarios, and trade-offs"). A row with
  the field absent is missing evidence.
- **No feature implies advice:** no declared feature row may
  declare `implies_advice_present: true` (the skill: never a
  recommendation to buy/sell/hold; implying advice is an
  anti-pattern to refuse). A row with the field absent is
  missing evidence.
- **Figures traceable per feature:** every declared feature row
  must declare `figures_traceable: true` (the skill:
  "Reproducibility and auditability of every number shown").
- **Backtest discipline per backtest feature:** every row with
  `is_backtest: true` must declare
  `overfit_and_survivorship_addressed: true` (the skill's
  anti-patterns: overfit backtests, survivorship bias). A row
  with `is_backtest` absent, or a backtest row with the target
  field absent, is missing evidence; designs with no backtest
  rows pass as not applicable.

One check group is conditional, following the skill's own
scoping — computed from the declared gate field:

- **Margin disclosure:** FINRA Rule 2214 is the skill's margin
  disclosure frame. `margin_disclosure_carried` is therefore
  required only when `margin.margin_features_present` is
  declared `true`; when no margin features are declared, the
  check passes as not applicable.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the five primary computed checks above cannot be completed),
`features_count` (the declared list length, or null when the
list is not declared — counts are reported as integers, exactly),
the row-name lists `features_without_scenarios_and_tradeoffs`
(features whose field is present but not true; a feature with
the field absent is missing evidence and does not appear),
`features_implying_advice` (features declaring
`implies_advice_present: true`), `features_without_traceable_figures`
(features whose field is present but not true) and
`backtest_features_without_overfit_survivorship_address`
(backtest features whose field is present but not true), and
the two coverage ratios `scenario_coverage` (features showing
scenarios and trade-offs ÷ declared features) and
`traceability_coverage` (features with traceable figures ÷
declared features).
**Fixed serialization rule:** computed ratios are reported as
strings with exactly six decimal places, produced in both
implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six
decimals; comparisons use the unrounded values. A ratio is null
when its denominator list is absent or empty. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical.

The skill states no numeric pass/fail threshold — no risk-measure
cutoff, no position-size percentage, no coverage percentage: its
risk measures and quant concepts are design content the record
attests to addressing, not bars the atom can set. Quantities are
computed and reported; the only bar on the computed rows is
completeness over the caller's own declared rows, exactly as
stated above. Declined thresholds, named: a VaR or CVaR
confidence level or time horizon (the skill names VaR / CVaR as
risk measures but states no level or horizon — caller
attestation only); a volatility, max-drawdown, Sharpe or Sortino
cutoff; a position-sizing percentage or rebalancing band or
frequency (the skill names "position sizing and rebalancing
discipline" but states no number); a correlation or
anti-correlation threshold for discovery; a fee, tax or slippage
allowance in basis points or percent; a backtest length, sample
size or significance bar; a number of PAE "beyond Aladdin" themes
or first-principles capabilities a design must include (the
skill lists themes as a menu, not a quota); a coverage
percentage below completeness; a mandatory risk-measure set
(the skill lists volatility, VaR / CVaR, max drawdown and
Sharpe / Sortino as the risk-measure vocabulary, but does not
state that every tool must show every measure — which measures
a tool shows is a caller declaration, never judged here).

The verdict is one of `FINANCE_TOOL_DESIGN_SOUND` (all 32 checks
pass), `FINANCE_TOOL_DESIGN_NOT_SOUND` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across five sections: compliance_and_advice_boundary,
quant_fundamentals, reproducibility_privacy_and_open_finance,
business_model_and_behavioral_design, anti_patterns.

## Honest scoping

This atom audits a **declared** finance-tool design record — it
designs no tool, runs no calculation, reads no market data,
probes no live product, and does not verify that a declared
control actually works. A design is sound *on the caller's
declared evidence*: a manifest that declares tool-calculates /
user-decides, disclaimers carried, and every figure traceable
passes those checks even if the real tool does none of it. It is
a completeness and consistency audit of the record the skill
requires, **not a finance design service, investment advice, or
a regulatory certification**: it never judges whether the quant
formulas are correct, whether a risk measure is the right one
for a feature, whether language in a real interface actually
implies advice, whether a backtest is really overfit, or whether
the business model is viable — only that the record contains
what the skill's sections and anti-patterns demand, and that its
declared rows are internally consistent.

Named exclusions and non-reducible parts (carried as caller
declarations only, never judged): no numeric thresholds beyond
the skill's own stated rules (see the declined list above); no
live verification of any declared fact; no text inspection —
recommendation, guaranteed-return and advice-like language are
caller-declared present/absent flags, the atom reads no copy;
quant correctness (formula choice, estimation, MPT application,
factor or regime identification) is a caller declaration — the
atom checks only that the concepts are declared addressed and
their limits disclosed; PAE theme selection (which "beyond
Aladdin" themes or first-principles capabilities a design
pursues, and whether they are genuinely novel or institutionally
hard to build) is a caller declaration, not re-audited here;
behavioral effectiveness (whether a bias counter actually
changes behaviour) is a caller declaration; privacy engineering
(whether the zero-knowledge and user-held-key design actually
achieves those properties) is a caller declaration — only its
declared presence is checked; legal sufficiency of disclaimers
or of the FINRA 2214 / CSA framing for any jurisdiction is not
judged — only that the record declares them addressed.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally** — deterministic core, Python
oracle and TypeScript port built and parity-proven locally; no
endpoint is live. Release happens one by one, by the owner's GO,
per the approved queue.

## Named doubt (from the register)

PAE-tied; generic design advice
