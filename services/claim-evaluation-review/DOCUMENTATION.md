# Claim evaluation review — `claim-evaluation-review`

**Display name:** Claim evaluation review · **Slug:** `claim-evaluation-review` · **Deliverable type:** REVIEW · **Atom version:** 0.1.0 · **Status:** live — release candidate (one-week RC soak to 2026-11-22)

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run; the verbatim request and response live under [Worked examples](#worked-examples), example 1.

1. **Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a key for this atom: `POST /v1/keys` with `{"atom": "claim-evaluation-review"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
2. **Assemble the manifest.** Fill every group in the [Input reference](#input-reference) — one JSON object declaring the artifact this atom audits. Declare values truthfully: the atom judges declared evidence only (see Explanation). The recorded run's manifest (example 1 below) declares `entity` = "Test Entity" and supplies every section's fields.
3. **Call REST.** `POST https://atoms.pipavia.com/v1/claim-evaluation-review` with header `Authorization: Bearer <key>` and the manifest as the JSON body.
4. **Read the verdict.** The recorded run returned HTTP 200 with verdict `CLAIM_EVALUATION_COMPLETE` — 26 pass, 0 fail, 0 missing of 26 checks across six sections. Recorded computed values: `claims_evaluated` = `1`; `base_rate_percent` = `"50.000000"`; `confidence_percent` = `"80.000000"`; `computed_hit_rate_percent` = `"80.000000"`; `hit_rate_difference` = `"0.000000"`; `fallacies_not_checked` = `[]`; `computed_status` = `"within_stated_limits_on_declared_evidence"`.
   Why it passes, in the tester's recorded words: All 26 checks pass.
5. **Act on it.** A passing verdict needs no action. For any other verdict, work through the `fail` and `missing` checks in the response (see *Read a failing verdict and fix the manifest* below) and resubmit — the atom is deterministic, so the same manifest always returns the same verdict.

## How-to guides

### Get a key and call via REST

1. `POST https://atoms.pipavia.com/v1/signup` with your email; open the emailed sign-in link to mint your session.
2. `POST /v1/keys` with `{"atom": "claim-evaluation-review"}` to grant this atom's scope on your gateway key.
3. Call `POST https://atoms.pipavia.com/v1/claim-evaluation-review` with `Authorization: Bearer <key>` and the manifest JSON as the body. HTTP 200 returns the verdict object (see Output format); errors are covered below and in Reference.

### Call via MCP

Connect your MCP client to `POST https://atoms.pipavia.com/mcp/claim-evaluation-review` with the same `Authorization: Bearer <key>` header and call the tool `claim_evaluation_review` with the manifest object as its arguments. The MCP `structuredContent` is deep-equal to the REST verdict object — the recorded battery verified REST/MCP parity on the full-pass case (see TEST-REPORT.md).

### Read a failing verdict and fix the manifest

1. Look at `verdict`: `CLAIM_EVALUATION_NOT_COMPLETE` means at least one check failed; `INSUFFICIENT_EVIDENCE` means nothing failed but evidence is missing (the recorded sparse run — a manifest carrying only `entity` — returned exactly that: 0 pass, 0 fail, 26 missing of 26 checks across six sections). A section reports `fail` if any of its checks fail, else `insufficient_evidence` if any is `missing`, else `pass`.
2. Work the `checks` array: each entry names its `section`, the `check`, its `status` (`pass` / `fail` / `missing`) and an `evidence` line stating the requirement. Fix every `fail` by changing the underlying practice/design and declaring the true new value; fix every `missing` by supplying the field.
3. In the recorded violations run (Worked examples, example 2), the verdict was `CLAIM_EVALUATION_NOT_COMPLETE` — 19 pass, 7 fail, 0 missing of 26 checks across six sections. The failing checks were exactly: `all_claims_restated_precisely`, `no_conclusions_from_vibes_or_authority_alone`, `base_rate_percent_within_percent_range`, `no_straw_manning_in_own_favor`, `fallacy_screen_covers_stated_fallacies`, `declared_hit_rate_matches_correct_divided_by_total`, `certainty_does_not_outrun_evidence`. Recorded case notes: Full manifest with exactly 7 planted violations: claims[0].restated_precisely=false; hierarchy.conclusions_from_vibes_or_authority_alone=true (red line); base_rates.base_rate_percent=150 (outside 0-100); steelman.straw_manning_in_own_favor=true (red line); fallacy_screen.fallacies_checked only [ad_hominem] (7 stated fallacies omitted); calibration declared hit rate 99 vs computed 5/10*100=50 (difference 49.000000); calibration.certainty_outruns_evidence=true (red line).
4. Resubmit the corrected manifest. Determinism is verified in the recorded battery (the full-pass manifest submitted twice returned byte-identical responses), so a changed verdict reflects your changed manifest, not noise.

### Handle a 422 invalid_input

A type or shape error is rejected before evaluation with HTTP 422 and body `{"ok": false, "error": "invalid_input", "field": ..., "detail": ...}`. The recorded malformed case for this atom returned field `claims` with detail "claims must be a list" (verbatim in Worked examples, example 3). Fix the named field to the type given in the Input reference, then resubmit. Note the distinction: a *wrong-typed* value is a 422; a well-typed but false/invalid value is evaluated and fails its check; an *absent* field is not an error — it is scored `missing`.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/claim-evaluation-review` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/claim-evaluation-review` — tool name `claim_evaluation_review`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Gateway base: `https://atoms.pipavia.com` (recorded gateway version 1.1.0).

### Input reference

One JSON manifest per call. Every field below is read by the named section's checks, grouped as SERVICE.md groups them (by the section that reads the field). Types are from SERVICE.md's field table — all fields are booleans unless noted in the table — corroborated by contract.yaml and the recorded evidence input schema (`inputSchema` in the MCP tool definition). An **absent** field = evidence missing; a field **present but false / invalid** = the check fails. Gates and conditionals are preserved in the Notes column.

| Field | Type | Read by (section) | Notes |
|---|---|---|---|
| `entity` | string | — | string; carried into the verdict output, not itself checked |
| `claims` | list of claim entries | claim_set_and_evidence | list of claim entries; absent / not a list / empty = all four computed claim-set checks missing |
| `claims[].label` | string | claim_set_and_evidence | string; must be non-empty for the entry to be complete |
| `claims[].restated_precisely` | boolean | claim_set_and_evidence |  |
| `claims[].supporting_evidence_sought` | boolean | claim_set_and_evidence |  |
| `claims[].refuting_evidence_sought` | boolean | claim_set_and_evidence |  |
| `claims[].evidence_presence_assessed` | boolean | claim_set_and_evidence |  |
| `hierarchy.evidence_ranked_by_hierarchy` | boolean | evidence_hierarchy_and_conflicts |  |
| `hierarchy.conflicts_noted` | boolean | evidence_hierarchy_and_conflicts |  |
| `hierarchy.conflict_reasons_and_incentives_examined` | boolean | evidence_hierarchy_and_conflicts |  |
| `hierarchy.conclusions_from_vibes_or_authority_alone` | boolean | evidence_hierarchy_and_conflicts | must be `false` to pass — skill red line |
| `base_rates.considered_first` | boolean | base_rates_and_reference_class |  |
| `base_rates.reference_class_identified` | boolean | base_rates_and_reference_class |  |
| `base_rates.used_where_applicable` | boolean | base_rates_and_reference_class |  |
| `base_rates.base_rate_percent` | number | base_rates_and_reference_class | number; computed, see below |
| `steelman.strongest_counterargument_constructed` | boolean | steelman_and_fallacy_screen |  |
| `steelman.strongest_counterargument_engaged` | boolean | steelman_and_fallacy_screen |  |
| `steelman.straw_manning_in_own_favor` | boolean | steelman_and_fallacy_screen | must be `false` to pass — skill red line |
| `fallacy_screen.fallacies_checked` | list of strings | steelman_and_fallacy_screen | list of strings; computed, see below |
| `calibration.confidence_stated` | boolean | calibration |  |
| `calibration.confidence_percent` | number | calibration | number; computed, see below |
| `calibration.outcomes_reviewed` | boolean | calibration |  |
| `calibration.hit_rate_tracked_by_confidence_band` | boolean | calibration |  |
| `calibration.outcomes_correct` | number | calibration | number; computed, see below |
| `calibration.outcomes_total` | number | calibration | number; computed, see below |
| `calibration.declared_hit_rate_percent` | number | calibration | number; computed, see below |
| `calibration.certainty_outruns_evidence` | boolean | calibration | must be `false` to pass — skill red line |
| `second_order.second_order_thinking_applied` | boolean | second_order_and_judgment |  |
| `judgment.judgment_written` | boolean | second_order_and_judgment |  |
| `judgment.judgment_includes_key_uncertainties` | boolean | second_order_and_judgment |  |
| `judgment.judgment_checkable_later` | boolean | second_order_and_judgment |  |

### Checks

All 26 checks, exactly as named in the recorded full-pass REST response, grouped by section. The *Requires* text is the recorded per-check `evidence` line — what the check requires to pass, on declared evidence.

Per-check statuses: `pass` — the requirement is met on the declared evidence; `fail` — the field is present but false/invalid, or a computed condition is breached; `missing` — the field is absent, so there is no evidence to judge. Across all recorded cases for this atom the only per-check status values observed are `pass`, `fail` and `missing`; there is no separate not-applicable status value in the output — where a check is gated by another declared field (see the gated checks' evidence lines), the gate's declared value decides whether the requirement is held, as the evidence line states.

#### Section: `claim_set_and_evidence` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `claim_entries_complete` | every claim entry carries a label, a restatement flag, supporting- and refuting-evidence-sought flags, and an evidence-presence-assessed flag |
| `all_claims_restated_precisely` | quality gate: every claim in the set is restated precisely |
| `all_claims_supporting_and_refuting_evidence_sought` | quality gate: supporting AND refuting evidence is sought for every claim in the set |
| `all_claims_evidence_presence_assessed` | method step 1: for every claim, whether evidence is actually present is assessed |

#### Section: `evidence_hierarchy_and_conflicts` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `evidence_ranked_by_hierarchy` | method step 2: evidence is ranked by the stated hierarchy — measurements/data over documents/logs over expert synthesis over hearsay |
| `conflicts_noted` | method step 2: conflicts between evidence are noted |
| `conflict_reasons_and_incentives_examined` | method step 2: why conflicts exist is examined — incentives included |
| `no_conclusions_from_vibes_or_authority_alone` | red line: no conclusions from vibes or authority alone |

#### Section: `base_rates_and_reference_class` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `base_rates_considered_first` | method step 3: base rates are considered first, before compelling stories |
| `reference_class_identified` | method step 3: a reference class is identified — what usually happens in cases like this |
| `base_rates_used_where_applicable` | quality gate: base rates / reference class are used where applicable |
| `base_rate_percent_within_percent_range` | method step 3: the declared base rate is a percent — it lies between 0 and 100 inclusive; no base-rate level itself is judged here |

#### Section: `steelman_and_fallacy_screen` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `strongest_counterargument_constructed` | method step 4: the strongest version of the opposing view is constructed — a steelman |
| `strongest_counterargument_engaged` | quality gate: the strongest counterargument is engaged, not a strawman |
| `no_straw_manning_in_own_favor` | red line: no straw-manning in your own favor |
| `fallacy_screen_covers_stated_fallacies` | method step 5: the fallacy spot-check covers every fallacy the skill names — ad hominem, straw man, false dilemma, appeal to authority, appeal to antiquity, survivorship stories, motivated reasoning, cherry-picked windows |

#### Section: `calibration` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `confidence_stated` | quality gate: confidence is stated |
| `confidence_percent_within_percent_range` | method step 6: the stated confidence is a percent — it lies between 0 and 100 inclusive; the skill's 80% example is an illustration of stating confidence, not a required level, and no level is judged here |
| `outcomes_reviewed` | quality gate: outcomes are reviewed for calibration |
| `hit_rate_tracked_by_confidence_band` | method step 6: hit rate is tracked by confidence band |
| `declared_hit_rate_matches_correct_divided_by_total` | method step 6: the declared hit-rate percent equals the declared outcomes correct divided by the declared outcomes total, times 100 (track hit rate) |
| `certainty_does_not_outrun_evidence` | red line: certainty does not outrun evidence |

#### Section: `second_order_and_judgment` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `second_order_thinking_applied` | method step 7: second-order thinking is applied — and then what? Effects on incentives, timing, competition, future options |
| `judgment_written` | method step 8: the judgment is written — conclusion plus confidence plus key uncertainties |
| `judgment_includes_key_uncertainties` | method step 8: the written judgment includes the key uncertainties |
| `judgment_checkable_later` | method step 8: the written judgment is short and checkable later |

### Output format

HTTP 200 returns one JSON object (REST body; the same object is the MCP `structuredContent`):

- `service` — The atom slug (`claim-evaluation-review`).
- `atom_version` — Atom version that produced the verdict (`0.1.0` in the recorded runs).
- `entity` — The caller's `entity` value, carried through from the manifest (not itself checked).
- `verdict` — The overall verdict — see Verdict vocabulary.
- `sections` — Per-section statuses keyed by section name — see Verdict vocabulary.
- `checks` — All 26 per-check results: `section`, `check`, `status`, `evidence`.
- `computed_status` — Computed/reported field; recorded full-pass value: `"within_stated_limits_on_declared_evidence"`.
- `claims_evaluated` — Computed/reported field; recorded full-pass value: `1`.
- `base_rate_percent` — Computed/reported field; recorded full-pass value: `"50.000000"`.
- `confidence_percent` — Computed/reported field; recorded full-pass value: `"80.000000"`.
- `computed_hit_rate_percent` — Computed/reported field; recorded full-pass value: `"80.000000"`.
- `hit_rate_difference` — Computed/reported field; recorded full-pass value: `"0.000000"`.
- `fallacies_not_checked` — Computed/reported field; recorded full-pass value: `[]`.
- `summary` — One-line counts, e.g. the recorded full-pass summary quoted in the Tutorial.
- `stamp` — A plain-text rendering of the verdict (title, entity, verdict, per-section statuses, summary) for logs and tickets.

From USER-GUIDE.md's verdict notes: The response also reports `claims_evaluated` (count of complete claim entries), `base_rate_percent` and `confidence_percent`, `computed_hit_rate_percent` and `hit_rate_difference` (computed amounts as strings with exactly six decimals, or null when they cannot be computed), `fallacies_not_checked` (stated fallacies not declared checked, or null when no list is declared) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null).

### Verdict vocabulary

**Overall verdicts** — every value this atom can return:

- `CLAIM_EVALUATION_COMPLETE` — every check passes; the claim-evaluation artifact is complete and internally consistent on the declared evidence.
- `CLAIM_EVALUATION_NOT_COMPLETE` — at least one check fails; the failing checks name the breached section and the evidence against it.
- `INSUFFICIENT_EVIDENCE` — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

**Section statuses** (values of each entry in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check fails but at least one is `missing`.

**Per-check statuses** (values of each check's `status`): `pass`, `fail`, `missing` — as defined under Checks.

**Computed fields:**

- `computed_status` — `within_stated_limits_on_declared_evidence` when every computed check that can be completed is within its stated limits; `outside_stated_limits_on_declared_evidence` when a computed check is breached; `null` when a computed check cannot be completed (recorded sparse-run value: `null`).
- `claims_evaluated` — reported as in the recorded responses (full-pass value `1`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `base_rate_percent` — reported as in the recorded responses (full-pass value `"50.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `confidence_percent` — reported as in the recorded responses (full-pass value `"80.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `computed_hit_rate_percent` — reported as in the recorded responses (full-pass value `"80.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `hit_rate_difference` — reported as in the recorded responses (full-pass value `"0.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `fallacies_not_checked` — reported as in the recorded responses (full-pass value `[]`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.

### Errors

Only the shapes evidenced in the repo / gateway docs are listed; no other payloads are promised.

- **401** — missing or invalid key (gateway DESIGN.md: unknown/revoked key = 401). No verdict is produced.
- **403** — the key lacks this atom's scope (gateway DESIGN.md: missing scope at an atom = 403). Issue the atom's scope on your key (`POST /v1/keys` with this atom's slug) and retry.
- **422** — invalid input: `{"ok": false, "error": "invalid_input", "field": "claims", "detail": "claims must be a list"}` is this atom's recorded malformed-case shape (verbatim in Worked examples, example 3); `field` names the offending field and `detail` states the expected type.
- **429** — rate limit exceeded (see Rate limits; gateway DESIGN.md: over limit → 429 naming the limit, and the call is not metered). Back off and retry; do not parallel-retry.

### Rate limits + pricing status

- **Rate limits:** 60 requests/minute and 10,000 requests/day per key (contract.yaml `rate_limit`; SPEC default — the per-key rate limit is the capacity guard for open public usage).
- **Pricing:** Free during trial — rate pending. contract.yaml `pricing.rate` is `null` (`rate_status: pending`); pricing unit is the deliverable, and prices are set only from measured production cost per unit.

## Explanation

You have a claim-evaluation artifact — a declared claim set with its evidence-hierarchy and conflict record, base-rate / reference-class record, steelman and fallacy spot-check record, calibration record, and second-order and written-judgment record. This atom reads one declared manifest and returns one deterministic verdict across six sections: **CLAIM_EVALUATION_COMPLETE**, **CLAIM_EVALUATION_NOT_COMPLETE**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared artifact's completeness and internal consistency only — it does not read the underlying claims or evidence, and it never decides whether any claim is true, well-supported, or worth acting on. Computed checks: every claim entry must be complete (non-empty `label` plus all four entry booleans) and every complete entry must declare restatement, supporting AND refuting evidence sought, and evidence presence assessed; the declared base rate and the stated confidence must each lie inside 0–100 (the definition of a percent — no level is imposed; the skill's "80% sure" is an example, not a threshold); the fallacy screen must cover all eight stated fallacies — `ad_hominem`, `straw_man`, `false_dilemma`, `appeal_to_authority`, `appeal_to_antiquity`, `survivorship_stories`, `motivated_reasoning`, `cherry_picked_windows`; and the declared calibration hit rate must equal outcomes correct ÷ outcomes total × 100, with a positive total (no hit-rate level or minimum outcome count is imposed). Same manifest in → same verdict out.

**Computed checks.** Eight checks are computed from the declared values, using only what the skill itself states plus the arithmetic of the declared numbers — no outside threshold is imported:

- **Claim entries:** every declared claim entry passes the entries check only when it carries a non-empty `label` string and all four entry booleans. A missing or empty `claims` list is missing evidence; an incomplete entry makes all four claim-set checks missing (the set cannot be evaluated whole). The output reports `claims_evaluated` (the count of complete claim entries).
- **All claims restated precisely:** passes only when every complete claim entry declares `restated_precisely` true (quality gate: "Claims restated precisely").
- **Supporting AND refuting evidence sought:** passes only when every complete claim entry declares both `supporting_evidence_sought` and `refuting_evidence_sought` true (quality gate: "supporting AND refuting evidence sought").
- **Evidence presence assessed:** passes only when every complete claim entry declares `evidence_presence_assessed` true (method step 1: "Is any actually present?"). Whether evidence is in fact present for a claim is not judged — only that its presence was assessed, per claim.
- **Base-rate percent range:** method step 3 states a base rate for a reference class. The declared `base_rates.base_rate_percent` is a percent, so it passes only inside 0–100 inclusive — the definition of a percent, not a judged level. No base-rate value is imposed (see thresholds declined). The output reports it as `base_rate_percent` (null when no number is declared).
- **Fallacy coverage:** method step 5 names the spot-check — ad hominem, straw man, false dilemma, appeal to authority/antiquity, survivorship stories, motivated reasoning, cherry-picked windows. The slash in the skill's "authority/antiquity" separates two named appeals, so the stated set is eight tokens: `ad_hominem`, `straw_man`, `false_dilemma`, `appeal_to_authority`, `appeal_to_antiquity`, `survivorship_stories`, `motivated_reasoning`, `cherry_picked_windows`. The declared `fallacy_screen.fallacies_checked` list passes only when it contains all eight; unknown entries do not count toward coverage. A missing list is missing evidence; an empty list is present and fails. The output reports the omitted stated entries as `fallacies_not_checked` (null when no list is declared). Entries are validated as strings only, never enum-checked — coverage is a verdict check, not a type error.
- **Confidence percent range:** method step 6 states confidence as a percent ("80% sure"). The declared `calibration.confidence_percent` therefore passes only inside 0–100 inclusive — again the definition of a percent. The skill's 80% is an example of stating confidence, **not** a required level, so no confidence level is imposed. The output reports it as `confidence_percent` (null likewise).
- **Calibration hit rate:** method step 6 states "track hit rate". The declared `calibration.declared_hit_rate_percent` therefore passes only when it equals `calibration.outcomes_correct` / `calibration.outcomes_total` × 100, with a positive total (a zero total fails — no hit rate exists). No hit-rate level, band width, or minimum outcome count is imposed — only the arithmetic is re-derived. The output reports `computed_hit_rate_percent` and `hit_rate_difference` (declared minus computed, null when either cannot be computed).

That is eight computed checks counting claim entries; the `computed_status` outcome is taken over the other seven.

**Fixed serialization rule:** computed amounts and ratios are reported as strings with exactly six decimal places, produced in both implementations by the same rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six decimals; computed comparisons compare the fixed-6dp difference to zero. That fixed serialization is what makes the Python and TypeScript outputs byte-identical.

**How the verdict is decided.** The core is deterministic: same manifest in → same verdict out, byte-identical on repeat calls and identical across the REST and MCP faces (both verified in the recorded battery). Every check reads declared fields only. The three-way distinction is the heart of the semantics: an **absent** field is *missing evidence* (check `missing`; the verdict can be at most `INSUFFICIENT_EVIDENCE`), while a field **present but false / invalid** is a *failure* (check `fail`; the verdict is `CLAIM_EVALUATION_NOT_COMPLETE`) — and a wrong-*typed* value is neither: it is rejected up front as a 422. Any single `fail` decides the verdict in effect — failures outrank missing evidence — and only a manifest with no fails and no missing checks earns `CLAIM_EVALUATION_COMPLETE`. The verdict is one of `CLAIM_EVALUATION_COMPLETE` (all 26 checks pass), `CLAIM_EVALUATION_NOT_COMPLETE` (any check fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing), across six sections: claim_set_and_evidence, evidence_hierarchy_and_conflicts, base_rates_and_reference_class, steelman_and_fallacy_screen, calibration, second_order_and_judgment.

**What it does NOT do.**

*Honest scoping (from SERVICE.md):*

This atom audits a **declared** claim-evaluation artifact — it does not read the underlying claims, pitches, articles or evidence, verify that a declared value is true, or decide whether any claim is true, well-supported, or worth acting on. The register's named doubt for this atom — overlaps critical-reasoning — is answered by this framing: this atom is the claim-set review from the critical-thinking method (claim → evidence over a set, hierarchy, base rates, steelman, fallacy spot-check, calibration, second-order effects, written judgment), not an argument-anatomy audit and not a base-rate card. An artifact is complete *on the caller's declared evidence* even if its underlying claims are false. It is a completeness and consistency audit, **not a claim verdict**: it never decides whether the evidence actually supports a claim, whether the steelman was well built, whether the reference class was the right one, or whether the stated confidence was warranted.

**Thresholds declined (named explicitly):** no minimum number of claims in the set (the skill states none — a single-claim set can pass); no base-rate level imposed and no judgment that a base rate is high or low (the skill states no number); no confidence level required (the skill's "80% sure" is an example, not a threshold) and no overconfidence threshold or gap between confidence and hit rate imposed (the skill says "most find they're overconfident" but states no gap number); no hit-rate level, confidence-band width, or minimum number of tracked outcomes imposed (only that a total be positive so the declared hit rate can be re-derived); no minimum evidence tier required (the skill states the hierarchy order — measurements/ data > documents/logs > expert synthesis > hearsay — but mandates no tier as a pass mark, so only that ranking was applied is checked); no fallacy-severity or count tolerance (coverage is the skill's exact stated set); no judgment length (the skill says "short" but states no word count); no second-order horizon (the skill names the effect kinds, not a timeframe).

Named exclusions: no evaluation of any claim from raw source material; no verification of any declared evidence, base rate, confidence, or outcome count; no truth, support, steelman-quality, reference-class-choice, or confidence-warrantedness judgment; no live verification of any declared fact.

**Buyer / use context.** First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Thinking & decisions who need this review on demand and would rather buy it per use than build or staff the capability themselves. The house's own workflow that calls it: **Pitch and claim evaluations**. One unit of sale = one delivered result. The atom sells its deliverable — the bounded judgment artifact — never the underlying knowledge itself.

## Role views

### For integrators (Users)

You need: the endpoints and tool name above, one key with this atom's scope, and a manifest that declares your evidence truthfully. Read `verdict` first, then `sections` to localize a problem, then the individual `fail`/`missing` checks to fix it. Budget for the 60/min, 10,000/day per-key limits; price is free during trial (rate pending). Status is release candidate — pin to the recorded behaviour in TEST-REPORT.md and expect the RC soak to 2026-11-22.

### For developers

Manifest authoring: follow the Input reference exactly — field names, nesting and types are the contract; a wrong type is a 422, an omitted field is `missing`, a false value is a `fail`. Determinism: the evaluation core is a pure function of the manifest (Python oracle `src/claim_evaluation_review.py` — `evaluate(manifest) -> verdict dict`; tests: `tests/test_claim_evaluation_review.py` — 52 tests; see TEST-REPORT.md for the recorded external battery). Fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps (contract.yaml binding rule R1).

### For ops

Endpoints: REST `POST /v1/claim-evaluation-review` and MCP `POST /mcp/claim-evaluation-review` on `https://atoms.pipavia.com` (gateway v1.1.0 in the recorded battery). Key scope: per-atom scope on the gateway key; 401 = missing/invalid key, 403 = scope missing — separate those two in alerting. Error monitoring: 422s indicate caller-side manifest type errors (field + detail are in the body); 429s indicate the 60/min or 10,000/day per-key limit. RC status: live — release candidate, one-week RC soak to 2026-11-22; atom version 0.1.0.

## Worked examples

Provenance: recorded 2026-11-16T02:00:53.386692+00:00 against gateway v1.1.0, external verification lane, source `verification/work/claim-evaluation-review/evidence.json`. Each example is the case's recorded `input` followed by the REST execution's recorded `response_text`, reproduced verbatim as JSON values (pretty-printed with indent 2 for readability; verified mechanically against the evidence after writing).

### Example 1 — Full-pass (recorded case `full-pass`, HTTP 200)

Input:

```json
{
  "entity": "Test Entity",
  "claims": [
    {
      "label": "Claim A",
      "restated_precisely": true,
      "supporting_evidence_sought": true,
      "refuting_evidence_sought": true,
      "evidence_presence_assessed": true
    }
  ],
  "hierarchy": {
    "evidence_ranked_by_hierarchy": true,
    "conflicts_noted": true,
    "conflict_reasons_and_incentives_examined": true,
    "conclusions_from_vibes_or_authority_alone": false
  },
  "base_rates": {
    "considered_first": true,
    "reference_class_identified": true,
    "used_where_applicable": true,
    "base_rate_percent": 50.0
  },
  "steelman": {
    "strongest_counterargument_constructed": true,
    "strongest_counterargument_engaged": true,
    "straw_manning_in_own_favor": false
  },
  "fallacy_screen": {
    "fallacies_checked": [
      "ad_hominem",
      "straw_man",
      "false_dilemma",
      "appeal_to_authority",
      "appeal_to_antiquity",
      "survivorship_stories",
      "motivated_reasoning",
      "cherry_picked_windows"
    ]
  },
  "calibration": {
    "confidence_stated": true,
    "confidence_percent": 80.0,
    "outcomes_reviewed": true,
    "hit_rate_tracked_by_confidence_band": true,
    "outcomes_correct": 8,
    "outcomes_total": 10,
    "declared_hit_rate_percent": 80.0,
    "certainty_outruns_evidence": false
  },
  "second_order": {
    "second_order_thinking_applied": true
  },
  "judgment": {
    "judgment_written": true,
    "judgment_includes_key_uncertainties": true,
    "judgment_checkable_later": true
  }
}
```

Response (`response_text`):

```json
{
  "service": "claim-evaluation-review",
  "atom_version": "0.1.0",
  "entity": "Test Entity",
  "verdict": "CLAIM_EVALUATION_COMPLETE",
  "sections": {
    "claim_set_and_evidence": "pass",
    "evidence_hierarchy_and_conflicts": "pass",
    "base_rates_and_reference_class": "pass",
    "steelman_and_fallacy_screen": "pass",
    "calibration": "pass",
    "second_order_and_judgment": "pass"
  },
  "checks": [
    {
      "section": "claim_set_and_evidence",
      "check": "claim_entries_complete",
      "status": "pass",
      "evidence": "every claim entry carries a label, a restatement flag, supporting- and refuting-evidence-sought flags, and an evidence-presence-assessed flag"
    },
    {
      "section": "claim_set_and_evidence",
      "check": "all_claims_restated_precisely",
      "status": "pass",
      "evidence": "quality gate: every claim in the set is restated precisely"
    },
    {
      "section": "claim_set_and_evidence",
      "check": "all_claims_supporting_and_refuting_evidence_sought",
      "status": "pass",
      "evidence": "quality gate: supporting AND refuting evidence is sought for every claim in the set"
    },
    {
      "section": "claim_set_and_evidence",
      "check": "all_claims_evidence_presence_assessed",
      "status": "pass",
      "evidence": "method step 1: for every claim, whether evidence is actually present is assessed"
    },
    {
      "section": "evidence_hierarchy_and_conflicts",
      "check": "evidence_ranked_by_hierarchy",
      "status": "pass",
      "evidence": "method step 2: evidence is ranked by the stated hierarchy — measurements/data over documents/logs over expert synthesis over hearsay"
    },
    {
      "section": "evidence_hierarchy_and_conflicts",
      "check": "conflicts_noted",
      "status": "pass",
      "evidence": "method step 2: conflicts between evidence are noted"
    },
    {
      "section": "evidence_hierarchy_and_conflicts",
      "check": "conflict_reasons_and_incentives_examined",
      "status": "pass",
      "evidence": "method step 2: why conflicts exist is examined — incentives included"
    },
    {
      "section": "evidence_hierarchy_and_conflicts",
      "check": "no_conclusions_from_vibes_or_authority_alone",
      "status": "pass",
      "evidence": "red line: no conclusions from vibes or authority alone"
    },
    {
      "section": "base_rates_and_reference_class",
      "check": "base_rates_considered_first",
      "status": "pass",
      "evidence": "method step 3: base rates are considered first, before compelling stories"
    },
    {
      "section": "base_rates_and_reference_class",
      "check": "reference_class_identified",
      "status": "pass",
      "evidence": "method step 3: a reference class is identified — what usually happens in cases like this"
    },
    {
      "section": "base_rates_and_reference_class",
      "check": "base_rates_used_where_applicable",
      "status": "pass",
      "evidence": "quality gate: base rates / reference class are used where applicable"
    },
    {
      "section": "base_rates_and_reference_class",
      "check": "base_rate_percent_within_percent_range",
      "status": "pass",
      "evidence": "method step 3: the declared base rate is a percent — it lies between 0 and 100 inclusive; no base-rate level itself is judged here"
    },
    {
      "section": "steelman_and_fallacy_screen",
      "check": "strongest_counterargument_constructed",
      "status": "pass",
      "evidence": "method step 4: the strongest version of the opposing view is constructed — a steelman"
    },
    {
      "section": "steelman_and_fallacy_screen",
      "check": "strongest_counterargument_engaged",
      "status": "pass",
      "evidence": "quality gate: the strongest counterargument is engaged, not a strawman"
    },
    {
      "section": "steelman_and_fallacy_screen",
      "check": "no_straw_manning_in_own_favor",
      "status": "pass",
      "evidence": "red line: no straw-manning in your own favor"
    },
    {
      "section": "steelman_and_fallacy_screen",
      "check": "fallacy_screen_covers_stated_fallacies",
      "status": "pass",
      "evidence": "method step 5: the fallacy spot-check covers every fallacy the skill names — ad hominem, straw man, false dilemma, appeal to authority, appeal to antiquity, survivorship stories, motivated reasoning, cherry-picked windows"
    },
    {
      "section": "calibration",
      "check": "confidence_stated",
      "status": "pass",
      "evidence": "quality gate: confidence is stated"
    },
    {
      "section": "calibration",
      "check": "confidence_percent_within_percent_range",
      "status": "pass",
      "evidence": "method step 6: the stated confidence is a percent — it lies between 0 and 100 inclusive; the skill's 80% example is an illustration of stating confidence, not a required level, and no level is judged here"
    },
    {
      "section": "calibration",
      "check": "outcomes_reviewed",
      "status": "pass",
      "evidence": "quality gate: outcomes are reviewed for calibration"
    },
    {
      "section": "calibration",
      "check": "hit_rate_tracked_by_confidence_band",
      "status": "pass",
      "evidence": "method step 6: hit rate is tracked by confidence band"
    },
    {
      "section": "calibration",
      "check": "declared_hit_rate_matches_correct_divided_by_total",
      "status": "pass",
      "evidence": "method step 6: the declared hit-rate percent equals the declared outcomes correct divided by the declared outcomes total, times 100 (track hit rate)"
    },
    {
      "section": "calibration",
      "check": "certainty_does_not_outrun_evidence",
      "status": "pass",
      "evidence": "red line: certainty does not outrun evidence"
    },
    {
      "section": "second_order_and_judgment",
      "check": "second_order_thinking_applied",
      "status": "pass",
      "evidence": "method step 7: second-order thinking is applied — and then what? Effects on incentives, timing, competition, future options"
    },
    {
      "section": "second_order_and_judgment",
      "check": "judgment_written",
      "status": "pass",
      "evidence": "method step 8: the judgment is written — conclusion plus confidence plus key uncertainties"
    },
    {
      "section": "second_order_and_judgment",
      "check": "judgment_includes_key_uncertainties",
      "status": "pass",
      "evidence": "method step 8: the written judgment includes the key uncertainties"
    },
    {
      "section": "second_order_and_judgment",
      "check": "judgment_checkable_later",
      "status": "pass",
      "evidence": "method step 8: the written judgment is short and checkable later"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "claims_evaluated": 1,
  "base_rate_percent": "50.000000",
  "confidence_percent": "80.000000",
  "computed_hit_rate_percent": "80.000000",
  "hit_rate_difference": "0.000000",
  "fallacies_not_checked": [],
  "summary": "26 pass, 0 fail, 0 missing of 26 checks across six sections.",
  "stamp": "CLAIM EVALUATION REVIEW\nentity: Test Entity\nVERDICT: CLAIM_EVALUATION_COMPLETE\n  claim_set_and_evidence               pass\n  evidence_hierarchy_and_conflicts     pass\n  base_rates_and_reference_class       pass\n  steelman_and_fallacy_screen          pass\n  calibration                          pass\n  second_order_and_judgment            pass\n26 pass, 0 fail, 0 missing of 26 checks across six sections."
}
```

### Example 2 — Violations (recorded case `violations`, HTTP 200)

Input:

```json
{
  "entity": "Test Entity",
  "claims": [
    {
      "label": "Claim A",
      "restated_precisely": false,
      "supporting_evidence_sought": true,
      "refuting_evidence_sought": true,
      "evidence_presence_assessed": true
    }
  ],
  "hierarchy": {
    "evidence_ranked_by_hierarchy": true,
    "conflicts_noted": true,
    "conflict_reasons_and_incentives_examined": true,
    "conclusions_from_vibes_or_authority_alone": true
  },
  "base_rates": {
    "considered_first": true,
    "reference_class_identified": true,
    "used_where_applicable": true,
    "base_rate_percent": 150.0
  },
  "steelman": {
    "strongest_counterargument_constructed": true,
    "strongest_counterargument_engaged": true,
    "straw_manning_in_own_favor": true
  },
  "fallacy_screen": {
    "fallacies_checked": [
      "ad_hominem"
    ]
  },
  "calibration": {
    "confidence_stated": true,
    "confidence_percent": 80.0,
    "outcomes_reviewed": true,
    "hit_rate_tracked_by_confidence_band": true,
    "outcomes_correct": 5,
    "outcomes_total": 10,
    "declared_hit_rate_percent": 99.0,
    "certainty_outruns_evidence": true
  },
  "second_order": {
    "second_order_thinking_applied": true
  },
  "judgment": {
    "judgment_written": true,
    "judgment_includes_key_uncertainties": true,
    "judgment_checkable_later": true
  }
}
```

Response (`response_text`):

```json
{
  "service": "claim-evaluation-review",
  "atom_version": "0.1.0",
  "entity": "Test Entity",
  "verdict": "CLAIM_EVALUATION_NOT_COMPLETE",
  "sections": {
    "claim_set_and_evidence": "fail",
    "evidence_hierarchy_and_conflicts": "fail",
    "base_rates_and_reference_class": "fail",
    "steelman_and_fallacy_screen": "fail",
    "calibration": "fail",
    "second_order_and_judgment": "pass"
  },
  "checks": [
    {
      "section": "claim_set_and_evidence",
      "check": "claim_entries_complete",
      "status": "pass",
      "evidence": "every claim entry carries a label, a restatement flag, supporting- and refuting-evidence-sought flags, and an evidence-presence-assessed flag"
    },
    {
      "section": "claim_set_and_evidence",
      "check": "all_claims_restated_precisely",
      "status": "fail",
      "evidence": "quality gate: every claim in the set is restated precisely"
    },
    {
      "section": "claim_set_and_evidence",
      "check": "all_claims_supporting_and_refuting_evidence_sought",
      "status": "pass",
      "evidence": "quality gate: supporting AND refuting evidence is sought for every claim in the set"
    },
    {
      "section": "claim_set_and_evidence",
      "check": "all_claims_evidence_presence_assessed",
      "status": "pass",
      "evidence": "method step 1: for every claim, whether evidence is actually present is assessed"
    },
    {
      "section": "evidence_hierarchy_and_conflicts",
      "check": "evidence_ranked_by_hierarchy",
      "status": "pass",
      "evidence": "method step 2: evidence is ranked by the stated hierarchy — measurements/data over documents/logs over expert synthesis over hearsay"
    },
    {
      "section": "evidence_hierarchy_and_conflicts",
      "check": "conflicts_noted",
      "status": "pass",
      "evidence": "method step 2: conflicts between evidence are noted"
    },
    {
      "section": "evidence_hierarchy_and_conflicts",
      "check": "conflict_reasons_and_incentives_examined",
      "status": "pass",
      "evidence": "method step 2: why conflicts exist is examined — incentives included"
    },
    {
      "section": "evidence_hierarchy_and_conflicts",
      "check": "no_conclusions_from_vibes_or_authority_alone",
      "status": "fail",
      "evidence": "red line: no conclusions from vibes or authority alone"
    },
    {
      "section": "base_rates_and_reference_class",
      "check": "base_rates_considered_first",
      "status": "pass",
      "evidence": "method step 3: base rates are considered first, before compelling stories"
    },
    {
      "section": "base_rates_and_reference_class",
      "check": "reference_class_identified",
      "status": "pass",
      "evidence": "method step 3: a reference class is identified — what usually happens in cases like this"
    },
    {
      "section": "base_rates_and_reference_class",
      "check": "base_rates_used_where_applicable",
      "status": "pass",
      "evidence": "quality gate: base rates / reference class are used where applicable"
    },
    {
      "section": "base_rates_and_reference_class",
      "check": "base_rate_percent_within_percent_range",
      "status": "fail",
      "evidence": "method step 3: the declared base rate is a percent — it lies between 0 and 100 inclusive; no base-rate level itself is judged here"
    },
    {
      "section": "steelman_and_fallacy_screen",
      "check": "strongest_counterargument_constructed",
      "status": "pass",
      "evidence": "method step 4: the strongest version of the opposing view is constructed — a steelman"
    },
    {
      "section": "steelman_and_fallacy_screen",
      "check": "strongest_counterargument_engaged",
      "status": "pass",
      "evidence": "quality gate: the strongest counterargument is engaged, not a strawman"
    },
    {
      "section": "steelman_and_fallacy_screen",
      "check": "no_straw_manning_in_own_favor",
      "status": "fail",
      "evidence": "red line: no straw-manning in your own favor"
    },
    {
      "section": "steelman_and_fallacy_screen",
      "check": "fallacy_screen_covers_stated_fallacies",
      "status": "fail",
      "evidence": "method step 5: the fallacy spot-check covers every fallacy the skill names — ad hominem, straw man, false dilemma, appeal to authority, appeal to antiquity, survivorship stories, motivated reasoning, cherry-picked windows"
    },
    {
      "section": "calibration",
      "check": "confidence_stated",
      "status": "pass",
      "evidence": "quality gate: confidence is stated"
    },
    {
      "section": "calibration",
      "check": "confidence_percent_within_percent_range",
      "status": "pass",
      "evidence": "method step 6: the stated confidence is a percent — it lies between 0 and 100 inclusive; the skill's 80% example is an illustration of stating confidence, not a required level, and no level is judged here"
    },
    {
      "section": "calibration",
      "check": "outcomes_reviewed",
      "status": "pass",
      "evidence": "quality gate: outcomes are reviewed for calibration"
    },
    {
      "section": "calibration",
      "check": "hit_rate_tracked_by_confidence_band",
      "status": "pass",
      "evidence": "method step 6: hit rate is tracked by confidence band"
    },
    {
      "section": "calibration",
      "check": "declared_hit_rate_matches_correct_divided_by_total",
      "status": "fail",
      "evidence": "method step 6: the declared hit-rate percent equals the declared outcomes correct divided by the declared outcomes total, times 100 (track hit rate)"
    },
    {
      "section": "calibration",
      "check": "certainty_does_not_outrun_evidence",
      "status": "fail",
      "evidence": "red line: certainty does not outrun evidence"
    },
    {
      "section": "second_order_and_judgment",
      "check": "second_order_thinking_applied",
      "status": "pass",
      "evidence": "method step 7: second-order thinking is applied — and then what? Effects on incentives, timing, competition, future options"
    },
    {
      "section": "second_order_and_judgment",
      "check": "judgment_written",
      "status": "pass",
      "evidence": "method step 8: the judgment is written — conclusion plus confidence plus key uncertainties"
    },
    {
      "section": "second_order_and_judgment",
      "check": "judgment_includes_key_uncertainties",
      "status": "pass",
      "evidence": "method step 8: the written judgment includes the key uncertainties"
    },
    {
      "section": "second_order_and_judgment",
      "check": "judgment_checkable_later",
      "status": "pass",
      "evidence": "method step 8: the written judgment is short and checkable later"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "claims_evaluated": 1,
  "base_rate_percent": "150.000000",
  "confidence_percent": "80.000000",
  "computed_hit_rate_percent": "50.000000",
  "hit_rate_difference": "49.000000",
  "fallacies_not_checked": [
    "straw_man",
    "false_dilemma",
    "appeal_to_authority",
    "appeal_to_antiquity",
    "survivorship_stories",
    "motivated_reasoning",
    "cherry_picked_windows"
  ],
  "summary": "19 pass, 7 fail, 0 missing of 26 checks across six sections.",
  "stamp": "CLAIM EVALUATION REVIEW\nentity: Test Entity\nVERDICT: CLAIM_EVALUATION_NOT_COMPLETE\n  claim_set_and_evidence               fail\n  evidence_hierarchy_and_conflicts     fail\n  base_rates_and_reference_class       fail\n  steelman_and_fallacy_screen          fail\n  calibration                          fail\n  second_order_and_judgment            pass\n19 pass, 7 fail, 0 missing of 26 checks across six sections."
}
```

### Example 3 — Malformed (recorded case `malformed`, HTTP 422)

Input:

```json
{
  "claims": "not-a-list"
}
```

Response (`response_text`):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "claims",
  "detail": "claims must be a list"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present (tutorial / how-to / reference / explanation) | Yes — all four sections above |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — see checklist note below |
| Checks named: documented vs recorded | 26 / 26 |
| Verdict vocabulary complete | Yes — all overall verdicts, section statuses, per-check statuses, and computed-field values listed |
| Input reference typed | Yes — 31 fields, each with a type |
| Worked examples verbatim-verified | Yes — full-pass / violations / malformed compared as JSON values against `evidence.json` after writing |

Regulators view decision: **N/A** — this atom reviews whether a claim evaluation was carried out with the bound skill's rigour (evidence hierarchy, base rates, fallacy screen, calibration). Judging claims in this sense is an epistemic-quality review of a declared evaluation record — the verdict is not itself regulatory compliance or audit evidence, and claim evaluation as such is not a regulated domain (finance, security, licensing, privacy).
