# Finance tool design advisory — documentation

**Finance tool design advisory** · slug `finance-tool-design-advisory` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `tool` "AlphaOptimizer"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "finance-tool-design-advisory"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the finance-tool-design manifest.** You declare a record of a finance tool already designed — the atom audits the record, it does not design the tool (see Explanation). The recorded full-pass manifest declares the tool `AlphaOptimizer`: the tool calculates and the user decides, no recommendation language present (`recommendation_language_present: false`), disclaimers carried, FINRA Rule 2214 and CSA framing addressed, and advice-like language redesigned into scenarios; margin features present with the margin disclosure carried (`margin_features_present: true`, `margin_disclosure_carried: true`); risk and return presented together, diversification and correlation addressed, MPT limits disclosed, factor thinking and regime awareness addressed, and tax- and fee-aware returns; one feature, `BacktestEngine`, showing scenarios and trade-offs, not implying advice (`implies_advice_present: false`), with traceable figures, declared a backtest with overfit and survivorship addressed; open data sources and open-source analytics used with every number reproducible and auditable; a zero-knowledge design with user-held keys and no data selling (`data_selling_present: false`); monetization via certification, membership or developer licenses with core features not gated (`core_features_gated_present: false`); biases accounted for and decision history used as insight; and all five anti-pattern flags `false` (no guaranteed or return-promising language, no black-box risk numbers, fees/taxes/slippage not ignored, no overfit backtests, no survivorship bias).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/finance-tool-design-advisory` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `FINANCE_TOOL_DESIGN_SOUND`: "32 pass, 0 fail, 0 missing of 32 checks across five sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `features_count` is 1, and both coverage ratios are `"1.000000"`.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `FINANCE_TOOL_DESIGN_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "finance-tool-design-advisory"}`.
3. Call: `POST https://atoms.pipavia.com/v1/finance-tool-design-advisory` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/finance-tool-design-advisory` with the `Authorization: Bearer <key>` header — the whole MCP surface on this gateway is key-gated, including `initialize` and `tools/list`.
2. Call `tools/call` with tool name `finance_tool_design_advisory`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `FINANCE_TOOL_DESIGN_NOT_SOUND` means at least one check has status `fail`: a field is present but false/invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 2 checks fail: `no_recommendation_language`, `no_feature_implies_advice`, and the summary reads "30 pass, 2 fail, 0 missing of 32 checks across five sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (in the recorded violations run, `features_implying_advice` names the row `BacktestEngine`: the feature row declaring `implies_advice_present: true`; the other failure is the attestation field `compliance.recommendation_language_present` declared `true`, which must be `false`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where a number, list, object or boolean is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "compliance",
  "detail": "compliance must be an object"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/finance-tool-design-advisory` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/finance-tool-design-advisory` — tool name `finance_tool_design_advisory`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `finance_tool_design_advisory` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `FINANCE_TOOL_DESIGN_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below exactly as SERVICE.md groups them — by the section that reads them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `tool` | string | Carried into the verdict output, not itself checked |

#### Read by: compliance_and_advice_boundary

| Field | Type | Notes |
|---|---|---|
| `compliance` | object | The compliance section object — a present non-object value is rejected before evaluation (see the recorded 422) |
| `compliance.tool_calculates_user_decides` | boolean | — |
| `compliance.recommendation_language_present` | boolean | must be `false` to pass — skill compliance line |
| `compliance.disclaimers_carried` | boolean | — |
| `compliance.finra_2214_and_csa_framing_addressed` | boolean | — |
| `compliance.advice_like_language_redesigned_to_scenarios` | boolean | — |
| `margin` | object | The margin section object — a present non-object value is rejected before evaluation |
| `margin.margin_features_present` | boolean (gate) | gates the margin-disclosure check below |
| `margin.margin_disclosure_carried` | boolean | required when margin features are declared present; otherwise the check passes as not applicable |
| `features` | list | list of feature-row objects, each with the entry fields below; computed, see below; also read by reproducibility_privacy_and_open_finance and anti_patterns |
| `features[]` | object | One declared feature row — a present non-object entry is rejected before evaluation |
| `features[].name` | string | Names the row in the computed outputs |
| `features[].shows_scenarios_and_tradeoffs` | boolean | — |
| `features[].implies_advice_present` | boolean | must be `false` per row to pass the computed advice check |

#### Read by: quant_fundamentals

| Field | Type | Notes |
|---|---|---|
| `quant` | object | The quant section object — a present non-object value is rejected before evaluation |
| `quant.risk_and_return_presented_together` | boolean | — |
| `quant.diversification_and_correlation_addressed` | boolean | — |
| `quant.mpt_limits_disclosed` | boolean | — |
| `quant.factor_thinking_addressed` | boolean | — |
| `quant.regime_awareness_addressed` | boolean | — |
| `quant.tax_and_fee_aware_returns` | boolean | — |

#### Read by: reproducibility_privacy_and_open_finance

| Field | Type | Notes |
|---|---|---|
| `open_building_blocks` | object | The open-building-blocks section object — a present non-object value is rejected before evaluation |
| `open_building_blocks.open_data_sources_used` | boolean | — |
| `open_building_blocks.open_source_analytics_used` | boolean | — |
| `open_building_blocks.every_number_reproducible_and_auditable` | boolean | — |
| `privacy` | object | The privacy section object — a present non-object value is rejected before evaluation |
| `privacy.zero_knowledge_design` | boolean | — |
| `privacy.user_held_keys` | boolean | — |
| `privacy.data_selling_present` | boolean | must be `false` to pass — skill privacy line |
| `features[].figures_traceable` | boolean | — |

#### Read by: business_model_and_behavioral_design

| Field | Type | Notes |
|---|---|---|
| `business_model` | object | The business-model section object — a present non-object value is rejected before evaluation |
| `business_model.monetization_via_certification_membership_or_developer_licenses` | boolean | — |
| `business_model.core_features_gated_present` | boolean | must be `false` to pass — skill FOSS model |
| `behavioral` | object | The behavioral section object — a present non-object value is rejected before evaluation |
| `behavioral.biases_accounted_for` | boolean | — |
| `behavioral.decision_history_used_as_insight` | boolean | — |

#### Read by: anti_patterns

| Field | Type | Notes |
|---|---|---|
| `anti_patterns` | object | The anti-patterns section object — a present non-object value is rejected before evaluation |
| `anti_patterns.guaranteed_or_return_promising_language_present` | boolean | must be `false` to pass — skill anti-pattern |
| `anti_patterns.black_box_risk_numbers_present` | boolean | must be `false` to pass — skill anti-pattern |
| `anti_patterns.fees_taxes_slippage_ignored_present` | boolean | must be `false` to pass — skill anti-pattern |
| `anti_patterns.overfit_backtests_present` | boolean | must be `false` to pass — skill anti-pattern |
| `anti_patterns.survivorship_bias_present` | boolean | must be `false` to pass — skill anti-pattern |
| `features[].is_backtest` | boolean (gate) | gates the overfit/survivorship check below |
| `features[].overfit_and_survivorship_addressed` | boolean | required when the row is a backtest; otherwise the check passes as not applicable to that row |

### Checks

All 32 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only: a conditional (gated) check whose gate is not triggered reports `pass` as not applicable, except where the recorded battery shows otherwise (see the discrepancy note after the tables). Section and verdict aggregation are defined under Verdict vocabulary.

#### Section: compliance_and_advice_boundary

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `tool_calculates_user_decides` | compliance line: the tool calculates, the user decides — analytics, scenarios and trade-offs are surfaced, never a decision for the user | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_recommendation_language` | compliance line: no recommendation to buy, sell or hold is present in the declared design | Pass: the field `compliance.recommendation_language_present` is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `disclaimers_carried` | compliance line: clear disclaimers are carried | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `finra_2214_and_csa_framing_addressed` | compliance line: FINRA Rule 2214 (margin disclosure) and CSA framing are addressed — the design stays out of registered-adviser territory | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `advice_like_language_redesigned_to_scenarios` | compliance line: anything that starts to sound like "you should…" is redesigned into "here's what the numbers show, and what would have to be true" | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `margin_disclosure_when_margin_features` | compliance line: margin disclosure is carried when margin features are declared present | Conditional on `margin.margin_features_present`. Pass: the gate is declared `true` and `margin.margin_disclosure_carried` is declared `true` — or the gate is declared `false`, in which case the check passes as not applicable (SERVICE.md). Fail: the gate is declared `true` and the disclosure field is present but not `true`. Missing: the gate field is absent — the recorded sparse run reports this check `missing` with evidence "no margin features declared" — or the gate is declared `true` and the disclosure field is absent. See the discrepancy note below. |
| `every_feature_shows_scenarios_and_tradeoffs` | compliance line: every declared feature row shows scenarios and trade-offs | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `no_feature_implies_advice` | anti-pattern: no declared feature row implies advice | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |

#### Section: quant_fundamentals

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `risk_and_return_presented_together` | quant fundamentals: risk and return are presented together | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `diversification_and_correlation_addressed` | quant fundamentals: diversification and correlation / anti-correlation are addressed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `mpt_limits_disclosed` | quant fundamentals: MPT and its real-world limits are disclosed — fat tails, unstable correlations | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `factor_thinking_addressed` | quant fundamentals: factor thinking is addressed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `regime_awareness_addressed` | quant fundamentals: regime awareness is addressed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tax_and_fee_aware_returns` | quant fundamentals: returns are tax- and fee-aware — gross is not net | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: reproducibility_privacy_and_open_finance

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `open_data_sources_used` | open finance building blocks: open data — rates, FX, fundamentals — is used | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `open_source_analytics_used` | open finance building blocks: reproducible open-source analytics are used | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `every_number_reproducible_and_auditable` | open finance building blocks: every number shown is reproducible and auditable — a figure the user can't trace is a liability | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_knowledge_design` | data integrity & privacy: the design is zero-knowledge | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `user_held_keys` | data integrity & privacy: keys are user-held | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_data_selling` | data integrity & privacy: no data selling — trust and security are the moat | Pass: the field `privacy.data_selling_present` is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `features_declared` | the declared record names its features — the features list is present and non-empty | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_feature_figures_traceable` | open finance building blocks: every declared feature row declares its figures traceable | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |

#### Section: business_model_and_behavioral_design

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `monetization_via_ecosystem_not_gating` | FOSS business model: monetization is via certification, membership and developer licenses — the ecosystem and credentialing | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_core_features_gated` | FOSS business model: the core is kept open — features are not gated | Pass: the field `business_model.core_features_gated_present` is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `biases_accounted_for` | behavioral finance: biases — loss aversion, recency, overconfidence — are accounted for | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `decision_history_used_as_insight` | behavioral finance: decision archaeology and conviction-weighting turn the user's own history into insight | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: anti_patterns

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `no_guaranteed_or_return_promising_language` | anti-pattern: no "guaranteed" or return-promising language is present | Pass: the field `anti_patterns.guaranteed_or_return_promising_language_present` is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_black_box_risk_numbers` | anti-pattern: no black-box risk numbers are present | Pass: the field `anti_patterns.black_box_risk_numbers_present` is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_fees_taxes_slippage_ignored` | anti-pattern: fees, taxes and slippage are not ignored | Pass: the field `anti_patterns.fees_taxes_slippage_ignored_present` is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_overfit_backtests` | anti-pattern: no overfit backtests are present | Pass: the field `anti_patterns.overfit_backtests_present` is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_survivorship_bias` | anti-pattern: no survivorship bias is present | Pass: the field `anti_patterns.survivorship_bias_present` is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `every_backtest_feature_addresses_overfit_and_survivorship` | anti-pattern: every feature row declared as a backtest declares overfit and survivorship bias addressed | Computed over the declared record, conditional per row on `features[].is_backtest`. Pass: every backtest row declares `overfit_and_survivorship_addressed` `true` — or there are no backtest rows, in which case the check passes as not applicable. Fail: a backtest row declares the field present but not `true` (offending rows are named in `backtest_features_without_overfit_survivorship_address`). Missing: the list is absent, a row has `is_backtest` absent, or a backtest row has the target field absent (such a row is missing evidence and does not appear in `backtest_features_without_overfit_survivorship_address`). |
**Discrepancy note (recorded behaviour governs).** SERVICE.md describes the margin-disclosure check as passing as not applicable "when no margin features are declared". The recorded sparse run (only `tool` declared; see TEST-REPORT.md) shows the gate field itself absent and the check `margin_disclosure_when_margin_features` reporting `missing` — with evidence text "no margin features declared" — not `pass`. This document follows the recording: gate field absent = `missing`; the not-applicable `pass` applies when the gate is declared `false`.

### Output format

HTTP 200 returns one JSON object:

- `service` (`"finance-tool-design-advisory"`), `atom_version` (`"0.1.0"`), and `tool` (the manifest's declared tool value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `features_count` (the declared list length as an integer, or null when the list is not declared); the row-name lists `features_without_scenarios_and_tradeoffs`, `features_implying_advice`, `features_without_traceable_figures` and `backtest_features_without_overfit_survivorship_address` (null when the `features` list is not declared; a feature with the relevant field absent is missing evidence and does not appear in `features_without_scenarios_and_tradeoffs`, `features_without_traceable_figures` or `backtest_features_without_overfit_survivorship_address`); and the ratios `scenario_coverage` (features showing scenarios and trade-offs ÷ declared features) and `traceability_coverage` (features with traceable figures ÷ declared features) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty. Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "32 pass, 0 fail, 0 missing of 32 checks across five sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared tool value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `FINANCE_TOOL_DESIGN_SOUND` — all 32 checks pass: the declared finance-tool design record is complete and consistent with the bound skill's checklist and lines.
- `FINANCE_TOOL_DESIGN_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one primary computed check cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes (including gated checks passing as not applicable); `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence (for gated checks: met, or the gate was not triggered — not applicable); `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

### Errors

Error bodies are the gateway's recorded shapes (`rails/gateway/src/callpath.ts`); a failed call is not metered.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | No key, or the key does not verify. On the MCP face the body is `{"error": "missing or invalid gateway API key"}`. |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the finance_tool_design_advisory scope; issue it for this atom first"}` | The key is valid but does not hold this atom's scope. Issue the key for this atom (see How-to) and retry. On the MCP face the body is `{"error": "this key does not hold the finance_tool_design_advisory scope"}`. |
| 422 | `{"ok":false,"error":"invalid_input","field":"compliance","detail":"compliance must be an object"}` (this atom's recorded malformed run; the shape is `{"ok": false, "error": "invalid_input", "field": "<field>", "detail": "<field> must be a <type>"}`) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. Via MCP `tools/call`, the same failure surfaces as a JSON-RPC error with code `-32602` carrying the detail message. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for finance-tool-design-advisory exceeded"}` (or the `10000/day` variant) | Per-key rate limit exceeded for this atom; the call is not metered. Via MCP `tools/call` it surfaces as a JSON-RPC error with code `-32029`. |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Designs finance tools and ideas that make people smarter about money without crossing into advice — quant rigor with a privacy-first ethos (the bound capability, from the `financial-innovation-expert` skill). You submit one declared record — the finance-tool-design manifest — and the atom audits that record for completeness and internal consistency against the bound skill's checklist, compliance and privacy lines and anti-patterns, returning one deterministic verdict across 5 sections (`compliance_and_advice_boundary`, `quant_fundamentals`, `reproducibility_privacy_and_open_finance`, `business_model_and_behavioral_design`, `anti_patterns`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for compliance-line / privacy-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — the declared `features` list must be present and non-empty, every row must show scenarios and trade-offs, no row may imply advice, every row must declare its figures traceable, and every row declared as a backtest must declare overfit and survivorship addressed — using only the declared record, with no outside threshold imported. *Conditional checks* bind only when their declared gate field says the situation applies — the margin-disclosure check is required only when `margin.margin_features_present` is declared `true`, and the backtest-discipline rule binds per row only when `features[].is_backtest` is declared `true`; when a gate is declared but not triggered the check passes as not applicable (a gate field that is itself absent is `missing` — see the discrepancy note under Checks). Aggregation is strict: any `fail` anywhere produces `FINANCE_TOOL_DESIGN_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `FINANCE_TOOL_DESIGN_SOUND`. The central semantic is the absent/false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented: a VaR or CVaR confidence level or time horizon (the skill names VaR / CVaR as risk measures but states no level or horizon — caller attestation only); a volatility, max-drawdown, Sharpe or Sortino cutoff; a position-sizing percentage or rebalancing band or frequency (the skill names "position sizing and rebalancing discipline" but states no number); a correlation or anti-correlation threshold for discovery; a fee, tax or slippage allowance in basis points or percent; a backtest length, sample size or significance bar; a number of PAE "beyond Aladdin" themes or first-principles capabilities a design must include (the skill lists themes as a menu, not a quota); a coverage percentage below completeness; and a mandatory risk-measure set (the skill lists volatility, VaR / CVaR, max drawdown and Sharpe / Sortino as the risk-measure vocabulary, but does not state that every tool must show every measure — which measures a tool shows is a caller declaration, never judged here). Quantities are computed and reported; the only bar on the computed rows is completeness over the caller's own declared rows.

**What it does NOT do.** The atom audits a **declared** finance-tool design record: a verdict of `FINANCE_TOOL_DESIGN_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a manifest that declares tool-calculates / user-decides, disclaimers carried, and every figure traceable passes those checks even if the real tool does none of it. It is a completeness and consistency audit of the record the skill requires, **not a finance design service, investment advice, or a regulatory certification**. Specifically: it designs no tool, runs no calculation, reads no market data, probes no live product, and does not verify that a declared control actually works. It never judges whether the quant formulas are correct, whether a risk measure is the right one for a feature, whether language in a real interface actually implies advice, whether a backtest is really overfit, or whether the business model is viable — only that the record contains what the skill's sections and anti-patterns demand, and that its declared rows are internally consistent. Named exclusions: no numeric thresholds beyond the skill's own stated rules (see the declined list above); no live verification of any declared fact; no text inspection — recommendation, guaranteed-return and advice-like language are caller-declared present/absent flags, the atom reads no copy; quant correctness (formula choice, estimation, MPT application, factor or regime identification) is a caller declaration — the atom checks only that the concepts are declared addressed and their limits disclosed; PAE theme selection (which "beyond Aladdin" themes or first-principles capabilities a design pursues, and whether they are genuinely novel or institutionally hard to build) is a caller declaration, not re-audited here; behavioral effectiveness (whether a bias counter actually changes behaviour) is a caller declaration; privacy engineering (whether the zero-knowledge and user-held-key design actually achieves those properties) is a caller declaration — only its declared presence is checked; legal sufficiency of disclaimers or of the FINRA 2214 / CSA framing for any jurisdiction is not judged — only that the record declares them addressed.

**Buyer and use context.** Teams and agents working in Money & markets who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: PAE feature design work (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulator view: N/A — this atom audits a declared finance-tool design record; its verdict is a design and method completeness and consistency judgment on the declared evidence, not compliance or audit evidence and not a regulatory certification (SERVICE.md states this explicitly: "not a finance design service, investment advice, or a regulatory certification"). Although the record touches a regulated domain (advice boundaries, FINRA Rule 2214 / CSA framing), those items are caller declarations the atom does not verify, so the verdict does not function as compliance evidence. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `finance_tool_design_advisory` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/finance_tool_design_advisory.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_finance_tool_design_advisory.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/finance-tool-design-advisory` (REST) and `POST /mcp/finance-tool-design-advisory` (MCP, tool `finance_tool_design_advisory`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification. Key scope: `finance_tool_design_advisory`. Rate limits: 60/minute, 10,000/day per key per atom (429 `rate_limit`, not metered). Error monitoring: watch 401 `unauthorized` (key problems), 403 `scope_required` (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live — release candidate, one-week RC soak to 2026-11-22; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Worked examples

Provenance: recorded 2026-11-16T05:38:54.450751+00:00 against gateway v1.1.0, external verification lane, source `verification/work/finance-tool-design-advisory/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Input:

```json
{
  "tool": "AlphaOptimizer",
  "compliance": {
    "tool_calculates_user_decides": true,
    "recommendation_language_present": false,
    "disclaimers_carried": true,
    "finra_2214_and_csa_framing_addressed": true,
    "advice_like_language_redesigned_to_scenarios": true
  },
  "margin": {
    "margin_features_present": true,
    "margin_disclosure_carried": true
  },
  "quant": {
    "risk_and_return_presented_together": true,
    "diversification_and_correlation_addressed": true,
    "mpt_limits_disclosed": true,
    "factor_thinking_addressed": true,
    "regime_awareness_addressed": true,
    "tax_and_fee_aware_returns": true
  },
  "features": [
    {
      "name": "BacktestEngine",
      "shows_scenarios_and_tradeoffs": true,
      "implies_advice_present": false,
      "figures_traceable": true,
      "is_backtest": true,
      "overfit_and_survivorship_addressed": true
    }
  ],
  "open_building_blocks": {
    "open_data_sources_used": true,
    "open_source_analytics_used": true,
    "every_number_reproducible_and_auditable": true
  },
  "privacy": {
    "zero_knowledge_design": true,
    "user_held_keys": true,
    "data_selling_present": false
  },
  "business_model": {
    "monetization_via_certification_membership_or_developer_licenses": true,
    "core_features_gated_present": false
  },
  "behavioral": {
    "biases_accounted_for": true,
    "decision_history_used_as_insight": true
  },
  "anti_patterns": {
    "guaranteed_or_return_promising_language_present": false,
    "black_box_risk_numbers_present": false,
    "fees_taxes_slippage_ignored_present": false,
    "overfit_backtests_present": false,
    "survivorship_bias_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "finance-tool-design-advisory",
  "atom_version": "0.1.0",
  "tool": "AlphaOptimizer",
  "verdict": "FINANCE_TOOL_DESIGN_SOUND",
  "sections": {
    "compliance_and_advice_boundary": "pass",
    "quant_fundamentals": "pass",
    "reproducibility_privacy_and_open_finance": "pass",
    "business_model_and_behavioral_design": "pass",
    "anti_patterns": "pass"
  },
  "checks": [
    {
      "section": "compliance_and_advice_boundary",
      "check": "tool_calculates_user_decides",
      "status": "pass",
      "evidence": "compliance line: the tool calculates, the user decides — analytics, scenarios and trade-offs are surfaced, never a decision for the user"
    },
    {
      "section": "compliance_and_advice_boundary",
      "check": "no_recommendation_language",
      "status": "pass",
      "evidence": "compliance line: no recommendation to buy, sell or hold is present in the declared design"
    },
    {
      "section": "compliance_and_advice_boundary",
      "check": "disclaimers_carried",
      "status": "pass",
      "evidence": "compliance line: clear disclaimers are carried"
    },
    {
      "section": "compliance_and_advice_boundary",
      "check": "finra_2214_and_csa_framing_addressed",
      "status": "pass",
      "evidence": "compliance line: FINRA Rule 2214 (margin disclosure) and CSA framing are addressed — the design stays out of registered-adviser territory"
    },
    {
      "section": "compliance_and_advice_boundary",
      "check": "advice_like_language_redesigned_to_scenarios",
      "status": "pass",
      "evidence": "compliance line: anything that starts to sound like \"you should…\" is redesigned into \"here's what the numbers show, and what would have to be true\""
    },
    {
      "section": "compliance_and_advice_boundary",
      "check": "margin_disclosure_when_margin_features",
      "status": "pass",
      "evidence": "compliance line: margin disclosure is carried when margin features are declared present"
    },
    {
      "section": "compliance_and_advice_boundary",
      "check": "every_feature_shows_scenarios_and_tradeoffs",
      "status": "pass",
      "evidence": "compliance line: every declared feature row shows scenarios and trade-offs"
    },
    {
      "section": "compliance_and_advice_boundary",
      "check": "no_feature_implies_advice",
      "status": "pass",
      "evidence": "anti-pattern: no declared feature row implies advice"
    },
    {
      "section": "quant_fundamentals",
      "check": "risk_and_return_presented_together",
      "status": "pass",
      "evidence": "quant fundamentals: risk and return are presented together"
    },
    {
      "section": "quant_fundamentals",
      "check": "diversification_and_correlation_addressed",
      "status": "pass",
      "evidence": "quant fundamentals: diversification and correlation / anti-correlation are addressed"
    },
    {
      "section": "quant_fundamentals",
      "check": "mpt_limits_disclosed",
      "status": "pass",
      "evidence": "quant fundamentals: MPT and its real-world limits are disclosed — fat tails, unstable correlations"
    },
    {
      "section": "quant_fundamentals",
      "check": "factor_thinking_addressed",
      "status": "pass",
      "evidence": "quant fundamentals: factor thinking is addressed"
    },
    {
      "section": "quant_fundamentals",
      "check": "regime_awareness_addressed",
      "status": "pass",
      "evidence": "quant fundamentals: regime awareness is addressed"
    },
    {
      "section": "quant_fundamentals",
      "check": "tax_and_fee_aware_returns",
      "status": "pass",
      "evidence": "quant fundamentals: returns are tax- and fee-aware — gross is not net"
    },
    {
      "section": "reproducibility_privacy_and_open_finance",
      "check": "open_data_sources_used",
      "status": "pass",
      "evidence": "open finance building blocks: open data — rates, FX, fundamentals — is used"
    },
    {
      "section": "reproducibility_privacy_and_open_finance",
      "check": "open_source_analytics_used",
      "status": "pass",
      "evidence": "open finance building blocks: reproducible open-source analytics are used"
    },
    {
      "section": "reproducibility_privacy_and_open_finance",
      "check": "every_number_reproducible_and_auditable",
      "status": "pass",
      "evidence": "open finance building blocks: every number shown is reproducible and auditable — a figure the user can't trace is a liability"
    },
    {
      "section": "reproducibility_privacy_and_open_finance",
      "check": "zero_knowledge_design",
      "status": "pass",
      "evidence": "data integrity & privacy: the design is zero-knowledge"
    },
    {
      "section": "reproducibility_privacy_and_open_finance",
      "check": "user_held_keys",
      "status": "pass",
      "evidence": "data integrity & privacy: keys are user-held"
    },
    {
      "section": "reproducibility_privacy_and_open_finance",
      "check": "no_data_selling",
      "status": "pass",
      "evidence": "data integrity & privacy: no data selling — trust and security are the moat"
    },
    {
      "section": "reproducibility_privacy_and_open_finance",
      "check": "features_declared",
      "status": "pass",
      "evidence": "the declared record names its features — the features list is present and non-empty"
    },
    {
      "section": "reproducibility_privacy_and_open_finance",
      "check": "every_feature_figures_traceable",
      "status": "pass",
      "evidence": "open finance building blocks: every declared feature row declares its figures traceable"
    },
    {
      "section": "business_model_and_behavioral_design",
      "check": "monetization_via_ecosystem_not_gating",
      "status": "pass",
      "evidence": "FOSS business model: monetization is via certification, membership and developer licenses — the ecosystem and credentialing"
    },
    {
      "section": "business_model_and_behavioral_design",
      "check": "no_core_features_gated",
      "status": "pass",
      "evidence": "FOSS business model: the core is kept open — features are not gated"
    },
    {
      "section": "business_model_and_behavioral_design",
      "check": "biases_accounted_for",
      "status": "pass",
      "evidence": "behavioral finance: biases — loss aversion, recency, overconfidence — are accounted for"
    },
    {
      "section": "business_model_and_behavioral_design",
      "check": "decision_history_used_as_insight",
      "status": "pass",
      "evidence": "behavioral finance: decision archaeology and conviction-weighting turn the user's own history into insight"
    },
    {
      "section": "anti_patterns",
      "check": "no_guaranteed_or_return_promising_language",
      "status": "pass",
      "evidence": "anti-pattern: no \"guaranteed\" or return-promising language is present"
    },
    {
      "section": "anti_patterns",
      "check": "no_black_box_risk_numbers",
      "status": "pass",
      "evidence": "anti-pattern: no black-box risk numbers are present"
    },
    {
      "section": "anti_patterns",
      "check": "no_fees_taxes_slippage_ignored",
      "status": "pass",
      "evidence": "anti-pattern: fees, taxes and slippage are not ignored"
    },
    {
      "section": "anti_patterns",
      "check": "no_overfit_backtests",
      "status": "pass",
      "evidence": "anti-pattern: no overfit backtests are present"
    },
    {
      "section": "anti_patterns",
      "check": "no_survivorship_bias",
      "status": "pass",
      "evidence": "anti-pattern: no survivorship bias is present"
    },
    {
      "section": "anti_patterns",
      "check": "every_backtest_feature_addresses_overfit_and_survivorship",
      "status": "pass",
      "evidence": "anti-pattern: every feature row declared as a backtest declares overfit and survivorship bias addressed"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "features_count": 1,
  "features_without_scenarios_and_tradeoffs": [],
  "scenario_coverage": "1.000000",
  "features_implying_advice": [],
  "features_without_traceable_figures": [],
  "traceability_coverage": "1.000000",
  "backtest_features_without_overfit_survivorship_address": [],
  "summary": "32 pass, 0 fail, 0 missing of 32 checks across five sections.",
  "stamp": "FINANCE TOOL DESIGN ADVISORY\ntool: AlphaOptimizer\nVERDICT: FINANCE_TOOL_DESIGN_SOUND\n  compliance_and_advice_boundary       pass\n  quant_fundamentals                   pass\n  reproducibility_privacy_and_open_finance pass\n  business_model_and_behavioral_design pass\n  anti_patterns                        pass\n32 pass, 0 fail, 0 missing of 32 checks across five sections."
}
```

### Example 2 — Violations (case `violations`)

Input:

```json
{
  "tool": "AlphaOptimizer",
  "compliance": {
    "tool_calculates_user_decides": true,
    "recommendation_language_present": true,
    "disclaimers_carried": true,
    "finra_2214_and_csa_framing_addressed": true,
    "advice_like_language_redesigned_to_scenarios": true
  },
  "margin": {
    "margin_features_present": true,
    "margin_disclosure_carried": true
  },
  "quant": {
    "risk_and_return_presented_together": true,
    "diversification_and_correlation_addressed": true,
    "mpt_limits_disclosed": true,
    "factor_thinking_addressed": true,
    "regime_awareness_addressed": true,
    "tax_and_fee_aware_returns": true
  },
  "features": [
    {
      "name": "BacktestEngine",
      "shows_scenarios_and_tradeoffs": true,
      "implies_advice_present": true,
      "figures_traceable": true,
      "is_backtest": true,
      "overfit_and_survivorship_addressed": true
    }
  ],
  "open_building_blocks": {
    "open_data_sources_used": true,
    "open_source_analytics_used": true,
    "every_number_reproducible_and_auditable": true
  },
  "privacy": {
    "zero_knowledge_design": true,
    "user_held_keys": true,
    "data_selling_present": false
  },
  "business_model": {
    "monetization_via_certification_membership_or_developer_licenses": true,
    "core_features_gated_present": false
  },
  "behavioral": {
    "biases_accounted_for": true,
    "decision_history_used_as_insight": true
  },
  "anti_patterns": {
    "guaranteed_or_return_promising_language_present": false,
    "black_box_risk_numbers_present": false,
    "fees_taxes_slippage_ignored_present": false,
    "overfit_backtests_present": false,
    "survivorship_bias_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "finance-tool-design-advisory",
  "atom_version": "0.1.0",
  "tool": "AlphaOptimizer",
  "verdict": "FINANCE_TOOL_DESIGN_NOT_SOUND",
  "sections": {
    "compliance_and_advice_boundary": "fail",
    "quant_fundamentals": "pass",
    "reproducibility_privacy_and_open_finance": "pass",
    "business_model_and_behavioral_design": "pass",
    "anti_patterns": "pass"
  },
  "checks": [
    {
      "section": "compliance_and_advice_boundary",
      "check": "tool_calculates_user_decides",
      "status": "pass",
      "evidence": "compliance line: the tool calculates, the user decides — analytics, scenarios and trade-offs are surfaced, never a decision for the user"
    },
    {
      "section": "compliance_and_advice_boundary",
      "check": "no_recommendation_language",
      "status": "fail",
      "evidence": "compliance line: no recommendation to buy, sell or hold is present in the declared design"
    },
    {
      "section": "compliance_and_advice_boundary",
      "check": "disclaimers_carried",
      "status": "pass",
      "evidence": "compliance line: clear disclaimers are carried"
    },
    {
      "section": "compliance_and_advice_boundary",
      "check": "finra_2214_and_csa_framing_addressed",
      "status": "pass",
      "evidence": "compliance line: FINRA Rule 2214 (margin disclosure) and CSA framing are addressed — the design stays out of registered-adviser territory"
    },
    {
      "section": "compliance_and_advice_boundary",
      "check": "advice_like_language_redesigned_to_scenarios",
      "status": "pass",
      "evidence": "compliance line: anything that starts to sound like \"you should…\" is redesigned into \"here's what the numbers show, and what would have to be true\""
    },
    {
      "section": "compliance_and_advice_boundary",
      "check": "margin_disclosure_when_margin_features",
      "status": "pass",
      "evidence": "compliance line: margin disclosure is carried when margin features are declared present"
    },
    {
      "section": "compliance_and_advice_boundary",
      "check": "every_feature_shows_scenarios_and_tradeoffs",
      "status": "pass",
      "evidence": "compliance line: every declared feature row shows scenarios and trade-offs"
    },
    {
      "section": "compliance_and_advice_boundary",
      "check": "no_feature_implies_advice",
      "status": "fail",
      "evidence": "anti-pattern: no declared feature row implies advice"
    },
    {
      "section": "quant_fundamentals",
      "check": "risk_and_return_presented_together",
      "status": "pass",
      "evidence": "quant fundamentals: risk and return are presented together"
    },
    {
      "section": "quant_fundamentals",
      "check": "diversification_and_correlation_addressed",
      "status": "pass",
      "evidence": "quant fundamentals: diversification and correlation / anti-correlation are addressed"
    },
    {
      "section": "quant_fundamentals",
      "check": "mpt_limits_disclosed",
      "status": "pass",
      "evidence": "quant fundamentals: MPT and its real-world limits are disclosed — fat tails, unstable correlations"
    },
    {
      "section": "quant_fundamentals",
      "check": "factor_thinking_addressed",
      "status": "pass",
      "evidence": "quant fundamentals: factor thinking is addressed"
    },
    {
      "section": "quant_fundamentals",
      "check": "regime_awareness_addressed",
      "status": "pass",
      "evidence": "quant fundamentals: regime awareness is addressed"
    },
    {
      "section": "quant_fundamentals",
      "check": "tax_and_fee_aware_returns",
      "status": "pass",
      "evidence": "quant fundamentals: returns are tax- and fee-aware — gross is not net"
    },
    {
      "section": "reproducibility_privacy_and_open_finance",
      "check": "open_data_sources_used",
      "status": "pass",
      "evidence": "open finance building blocks: open data — rates, FX, fundamentals — is used"
    },
    {
      "section": "reproducibility_privacy_and_open_finance",
      "check": "open_source_analytics_used",
      "status": "pass",
      "evidence": "open finance building blocks: reproducible open-source analytics are used"
    },
    {
      "section": "reproducibility_privacy_and_open_finance",
      "check": "every_number_reproducible_and_auditable",
      "status": "pass",
      "evidence": "open finance building blocks: every number shown is reproducible and auditable — a figure the user can't trace is a liability"
    },
    {
      "section": "reproducibility_privacy_and_open_finance",
      "check": "zero_knowledge_design",
      "status": "pass",
      "evidence": "data integrity & privacy: the design is zero-knowledge"
    },
    {
      "section": "reproducibility_privacy_and_open_finance",
      "check": "user_held_keys",
      "status": "pass",
      "evidence": "data integrity & privacy: keys are user-held"
    },
    {
      "section": "reproducibility_privacy_and_open_finance",
      "check": "no_data_selling",
      "status": "pass",
      "evidence": "data integrity & privacy: no data selling — trust and security are the moat"
    },
    {
      "section": "reproducibility_privacy_and_open_finance",
      "check": "features_declared",
      "status": "pass",
      "evidence": "the declared record names its features — the features list is present and non-empty"
    },
    {
      "section": "reproducibility_privacy_and_open_finance",
      "check": "every_feature_figures_traceable",
      "status": "pass",
      "evidence": "open finance building blocks: every declared feature row declares its figures traceable"
    },
    {
      "section": "business_model_and_behavioral_design",
      "check": "monetization_via_ecosystem_not_gating",
      "status": "pass",
      "evidence": "FOSS business model: monetization is via certification, membership and developer licenses — the ecosystem and credentialing"
    },
    {
      "section": "business_model_and_behavioral_design",
      "check": "no_core_features_gated",
      "status": "pass",
      "evidence": "FOSS business model: the core is kept open — features are not gated"
    },
    {
      "section": "business_model_and_behavioral_design",
      "check": "biases_accounted_for",
      "status": "pass",
      "evidence": "behavioral finance: biases — loss aversion, recency, overconfidence — are accounted for"
    },
    {
      "section": "business_model_and_behavioral_design",
      "check": "decision_history_used_as_insight",
      "status": "pass",
      "evidence": "behavioral finance: decision archaeology and conviction-weighting turn the user's own history into insight"
    },
    {
      "section": "anti_patterns",
      "check": "no_guaranteed_or_return_promising_language",
      "status": "pass",
      "evidence": "anti-pattern: no \"guaranteed\" or return-promising language is present"
    },
    {
      "section": "anti_patterns",
      "check": "no_black_box_risk_numbers",
      "status": "pass",
      "evidence": "anti-pattern: no black-box risk numbers are present"
    },
    {
      "section": "anti_patterns",
      "check": "no_fees_taxes_slippage_ignored",
      "status": "pass",
      "evidence": "anti-pattern: fees, taxes and slippage are not ignored"
    },
    {
      "section": "anti_patterns",
      "check": "no_overfit_backtests",
      "status": "pass",
      "evidence": "anti-pattern: no overfit backtests are present"
    },
    {
      "section": "anti_patterns",
      "check": "no_survivorship_bias",
      "status": "pass",
      "evidence": "anti-pattern: no survivorship bias is present"
    },
    {
      "section": "anti_patterns",
      "check": "every_backtest_feature_addresses_overfit_and_survivorship",
      "status": "pass",
      "evidence": "anti-pattern: every feature row declared as a backtest declares overfit and survivorship bias addressed"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "features_count": 1,
  "features_without_scenarios_and_tradeoffs": [],
  "scenario_coverage": "1.000000",
  "features_implying_advice": [
    "BacktestEngine"
  ],
  "features_without_traceable_figures": [],
  "traceability_coverage": "1.000000",
  "backtest_features_without_overfit_survivorship_address": [],
  "summary": "30 pass, 2 fail, 0 missing of 32 checks across five sections.",
  "stamp": "FINANCE TOOL DESIGN ADVISORY\ntool: AlphaOptimizer\nVERDICT: FINANCE_TOOL_DESIGN_NOT_SOUND\n  compliance_and_advice_boundary       fail\n  quant_fundamentals                   pass\n  reproducibility_privacy_and_open_finance pass\n  business_model_and_behavioral_design pass\n  anti_patterns                        pass\n30 pass, 2 fail, 0 missing of 32 checks across five sections."
}
```

### Example 3 — Malformed (case `malformed`)

Input:

```json
{
  "tool": "MalformedTool",
  "compliance": "should_be_an_object"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "compliance",
  "detail": "compliance must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — this atom audits a declared finance-tool design record; its verdict is a design/method completeness judgment, not compliance or audit evidence and not a regulatory certification, so no regulator role view is provided. |
| Checks named | 32 documented / 32 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses (not-applicable expressed as a gated `pass`, except an absent gate field, which is `missing` — see the discrepancy note under Checks) |
| Input reference typed | Yes — 46 fields, each with its type from SERVICE.md (36 SERVICE.md field-table fields plus the section-object and feature-row object rows) |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/finance-tool-design-advisory/evidence.json` |
