# Bias controlled quant study pack — documentation

**Bias controlled quant study pack** · slug `bias-controlled-quant-study-pack` · deliverable type: DELIVERABLE · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. The worked examples at the end are real recorded trial runs, reproduced verbatim from the external verification evidence.

## Tutorial

A first call, walked through end to end. This tutorial narrates the recorded full-pass trial run (Worked example 1 below reproduces it verbatim); every value named here is the value that run actually returned.

**The job.** You have a quant study pack — one market study worked through a bias-controlled quant-research method, and you want one deterministic verdict on whether it is complete and internally coherent on its own declared evidence.

**Step 1 — get a key.** Sign up and issue a gateway key for this atom (the exact calls are in *How-to guides → Get a key and call via REST*). Keep the key; you send it as `Authorization: Bearer <key>` on every call.

**Step 2 — assemble the manifest.** Build one JSON object covering every section: `hypothesis_preregistration`, `data_hygiene`, `distribution_reality`, `stationarity_and_stability`, `multiple_testing`, `costs`, `reproducibility`. In the recorded run the identity field `study` was `"Market Alpha Study 2024"`. Fill each evidence field honestly from your own records: `true` where the practice was followed, `false` where a must-be-false field applies (see the Input reference — those fields must be `false` to pass), and the declared lists and numbers the computed checks re-derive. Leave a field out only if you genuinely have no evidence for it — an absent field is not a failure, it is `missing`, and it will hold the verdict at `INSUFFICIENT_EVIDENCE`.

**Step 3 — send it.** `POST https://atoms.pipavia.com/v1/bias-controlled-quant-study-pack` with the manifest as the body and your key in the `Authorization` header.

**Step 4 — read the verdict.** The recorded run returned HTTP 200 with verdict `STUDY_PACK_COMPLETE`: every section `pass`, and the summary "34 pass, 0 fail, 0 missing of 34 checks across seven sections." The computed fields came back `computed_status` = `"within_stated_limits_on_declared_evidence"`, `stability_period_count` = `2`, `signals_tested` = `100`, `signals_reported` = `5`, `signals_reported_minus_tested` = `-95`, `costs_not_included` = `[]` — the declared lists and numbers agree with the limits the method itself states, on the declared evidence.

**Step 5 — act on it.** A `STUDY_PACK_COMPLETE` verdict means the manifest is complete on the evidence you declared — it does not certify that the underlying work is good (see *Explanation → What it does not do*). If instead you get the failing verdict or `INSUFFICIENT_EVIDENCE`, the `checks` array names exactly which checks failed or are missing; *How-to guides → Read a failing verdict and fix the manifest* walks through that repair loop using the recorded violations run.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "bias-controlled-quant-study-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.
4. Call the atom: `POST https://atoms.pipavia.com/v1/bias-controlled-quant-study-pack` — body = the manifest object (see the Input reference).

```bash
curl -s -X POST https://atoms.pipavia.com/v1/bias-controlled-quant-study-pack \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -d @manifest.json
```

The response is the verdict object described in *Reference → Output format*. The same manifest always returns the same verdict (determinism was byte-identical on the recorded repeat call — see TEST-REPORT.md).

### Call via MCP

- Endpoint: `POST https://atoms.pipavia.com/mcp/bias-controlled-quant-study-pack`
- Tool name: `bias_controlled_quant_study_pack`
- Call `tools/call` with the tool name above and the manifest object as the arguments — the same object you would send as the REST body, with the same `Authorization: Bearer <key>` header.
- The MCP result's structured content is the same verdict object as the REST response (parity was verified structured-equal on the recorded full-pass run — see TEST-REPORT.md). Prefer whichever face your client already speaks; do not expect different verdicts from the two faces.

### Read a failing verdict and fix the manifest

The recorded violations run (Worked example 2) returned verdict `STUDY_PACK_NOT_COMPLETE` with the summary "0 pass, 10 fail, 24 missing of 34 checks across seven sections." Repair any failing verdict the same way:

1. **Read `sections` first.** A section is `fail` when any of its checks fails, `insufficient_evidence` when none fails but at least one is `missing`, and `pass` only when all its checks pass. That tells you where to look.
2. **Read the `checks` array.** Each entry is `{section, check, status, evidence}`. Work the `fail` entries first — the `evidence` text states the rule that was breached. In the recorded violations run the failing checks were: `results_not_seen_before_registration`, `no_survivorship_gap`, `no_restatement_peeking`, `gaussian_not_assumed`, `stability_periods_cover_multiple_periods`, `no_claim_without_regime_context`, `reported_signals_within_tested_count`, `no_phacked_screen_presented_as_strategy`, `result_not_from_single_lucky_sample`, `all_stated_costs_included`.
3. **Distinguish `fail` from `missing`.** `fail` = the field was present but false, invalid, or arithmetically/set-wise incoherent — fix the underlying practice or correct the declaration. `missing` = the field was absent — supply the evidence; do not guess a value to make the check pass, because the atom audits declarations, and a declaration you cannot stand behind is worse than a missing one.
4. **Check the computed fields.** On a failing verdict the computed outputs (see *Reference → Output format*) show the re-derived values and the differences, so you can see by how much a declared total, count, or list disagrees before you resubmit.
5. **Fix the manifest and resubmit the whole object.** The atom is stateless per call: there is no partial update, no case to reopen, and no memory of the previous submission. Resubmit the corrected full manifest and read the new verdict.

### Handle a 422 invalid_input

A type violation is not a verdict — the call is rejected before any check runs. The recorded malformed run (Worked example 3) returned HTTP 422 with this body:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "hypothesis.hypothesis_written",
  "detail": "hypothesis.hypothesis_written must be a boolean"
}
```

- `field` names the exact manifest field whose type was wrong (`hypothesis.hypothesis_written` in the recorded run); `detail` states the type it must be (`"hypothesis.hypothesis_written must be a boolean"`).
- Fix that field's type in the manifest (consult the type column of the Input reference), then resubmit. If you sent several wrongly-typed fields, expect to repeat this once per call — the recorded shape reports one `field` per response.
- Do not retry the identical body: a 422 is deterministic for the same input and will not clear on its own. It is also not a rate-limit or auth problem — check the `error` value first: `invalid_input` means the manifest, not the key.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/bias-controlled-quant-study-pack` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/bias-controlled-quant-study-pack` — tool name `bias_controlled_quant_study_pack`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Gateway: https://atoms.pipavia.com, gateway version 1.1.0 at the time of the recorded runs. Key scope: this atom only — a key's scope for one atom never verifies for another (contract.yaml key namespace `bias_controlled_quant_study_pack`).

### Input reference

One JSON manifest. Types are taken from SERVICE.md's field table (its preamble states: all fields are booleans unless noted); the evidence `inputSchema` corroborates the top-level object/string/array types. Notes — including must-be-false gates and computed/conditional behaviour — are preserved from SERVICE.md. Fields are grouped as SERVICE.md groups them (by the section that reads them).

#### Carried / top-level (not itself checked)

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `study` | string | string; carried into the verdict output, not itself checked |

#### Read by section `hypothesis_preregistration`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `hypothesis.hypothesis_written` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `hypothesis.prediction_stated` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `hypothesis.falsification_test_defined` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `hypothesis.results_looked_at_before_registration` | boolean | must be `false` to pass — method step 1: registration comes BEFORE looking at results |

#### Read by section `data_hygiene`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `data.provenance_documented` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `data.snapshot_version_documented` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `data.adjusted_prices` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `data.delisted_names_retained` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `data.survivorship_gap_present` | boolean | must be `false` to pass — quality gate: no survivorship gap |
| `data.point_in_time_fundamentals` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `data.restatement_peeking` | boolean | must be `false` to pass — method step 2: no restatement peeking |
| `data.timezone_timestamp_discipline` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |

#### Read by section `distribution_reality`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `distribution.fat_tails_considered` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `distribution.volatility_clustering_considered` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `distribution.gaussian_assumed` | boolean | must be `false` to pass — method step 3: don't assume Gaussian |
| `distribution.crisis_correlations_considered` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |

#### Read by section `stationarity_and_stability`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `stationarity.stability_tested` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `stationarity.stability_periods` | list of strings | list of strings; computed, see below |
| `stationarity.regime_context_provided` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `stationarity.mechanism_stated` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `stationarity.claim_made_without_regime_context` | boolean | must be `false` to pass — skill red line |

#### Read by section `multiple_testing`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `multiple_testing.controlled` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `multiple_testing.deflated_significance_applied` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `multiple_testing.holdout_used` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `multiple_testing.signals_tested` | number | number; computed, see below |
| `multiple_testing.signals_reported` | number | number; computed, see below |
| `multiple_testing.p_hacked_screen_presented_as_strategy` | boolean | must be `false` to pass — skill red line |
| `multiple_testing.result_from_single_sample` | boolean | must be `false` to pass — skill red line |

#### Read by section `costs`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `costs.costs_included` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `costs.included` | list of strings | list of strings; computed, see below |
| `costs.results_net_of_costs` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |

#### Read by section `reproducibility`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `reproducibility.seeded_runs` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `reproducibility.snapshot_pinned` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `reproducibility.code_versioned` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `reproducibility.rerunnable_by_others` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |

Container objects (the section objects and any list-of-objects entries above) are objects/arrays as typed; a container sent as the wrong JSON type is a 422 `invalid_input`, not a failing check (see Errors).

### Checks

Every check the atom runs — 34 checks, grouped by section. Ground truth: the `checks` array of the recorded full-pass REST response (Worked example 1), cross-checked against SERVICE.md; the counts agree (34/34). The `evidence` text quoted for each check is the recorded response's own statement of what the check requires.

**Per-check status semantics (all checks):** `pass` — the recorded evidence satisfies the stated requirement; `fail` — the field was present but false/invalid, or a computed condition (arithmetic, set coverage, vocabulary) was not met; `missing` — the field(s) the check reads were absent, so there is no evidence to judge. No `not_applicable` per-check status is returned by this atom in any recorded case.

#### Section `hypothesis_preregistration` — 4 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `hypothesis_written_before_analysis` | method step 1: the hypothesis is written before analysis (pre-registration) |
| `prediction_stated_before_analysis` | method step 1: the prediction the hypothesis makes is stated before looking at results |
| `falsification_test_defined_before_analysis` | quality gate: the falsification test is written before analysis — what result would kill the hypothesis |
| `results_not_seen_before_registration` | method step 1: results are not looked at before the hypothesis, prediction and falsification test are written |

#### Section `data_hygiene` — 8 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `data_provenance_documented` | quality gate: data provenance is documented — where every series came from |
| `snapshot_version_documented` | method step 2: the data snapshot version is documented alongside the provenance |
| `prices_adjusted_for_splits_and_dividends` | method step 2: adjusted prices (splits/dividends) are done correctly |
| `delisted_names_retained` | method step 2: delisted names are retained in the dataset (survivorship) |
| `no_survivorship_gap` | quality gate: there is no survivorship gap — the dataset is not silently limited to names that survived |
| `point_in_time_fundamentals_used` | method step 2: fundamentals are point-in-time — the values as known on the date, not as later restated |
| `no_restatement_peeking` | method step 2: no restatement peeking — later restated fundamentals are not read back into earlier dates |
| `timezone_and_timestamp_discipline` | method step 2: timezone and timestamp discipline is applied across the dataset |

#### Section `distribution_reality` — 4 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `fat_tails_accounted_for` | method step 3: fat tails are accounted for — extreme moves are more common than a normal distribution implies |
| `volatility_clustering_accounted_for` | method step 3: volatility clustering is accounted for — turbulent and quiet periods bunch together |
| `gaussian_not_assumed` | method step 3: a Gaussian distribution is not assumed — returns are non-normal |
| `crisis_correlation_rise_accounted_for` | method step 3: the rise of correlations in crises is accounted for — diversification fails exactly when needed |

#### Section `stationarity_and_stability` — 5 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `stability_tested_across_periods` | method step 4: stability is tested across periods — regimes end and relationships decay |
| `stability_periods_cover_multiple_periods` | method step 4: the declared stability periods cover at least two distinct periods — stability 'across periods' cannot be shown inside a single period, and a repeated period is still one period |
| `regime_context_provided` | red line: performance claims carry their regime context — which regimes the study period covers |
| `mechanism_theory_stated` | method step 4: the study rests on a theory with a mechanism, preferred over a curve fit without one |
| `no_claim_without_regime_context` | red line: no 'works since 2021' claims without regime context |

#### Section `multiple_testing` — 6 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `multiple_testing_controlled` | quality gate: multiple testing is controlled — a screen that tests thousands of things expects lucky winners by chance alone |
| `deflated_significance_awareness_applied` | method step 5: deflated significance awareness is applied — significance is read against how many things were tested |
| `holdout_discipline_applied` | method step 5: holdout discipline is applied — part of the evidence is kept back and not used to select the result |
| `reported_signals_within_tested_count` | method step 5: the signals reported as results never exceed the signals actually tested, and both declared counts are whole numbers — pure accounting coherence between the two counts the pack itself declares |
| `no_phacked_screen_presented_as_strategy` | red line: no p-hacked screens presented as strategy |
| `result_not_from_single_lucky_sample` | red line: no result from one lucky sample |

#### Section `costs` — 3 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `costs_included_from_day_one` | quality gate: costs are included from day one — a paper edge that dies after costs is not an edge |
| `all_stated_costs_included` | method step 6: the included costs cover every cost the skill names — spreads, fees, slippage, borrow, taxes |
| `results_reported_net_of_costs` | method step 6: results are reported net of costs — the edge shown is the edge after spreads, fees, slippage, borrow and taxes |

#### Section `reproducibility` — 4 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `seeded_runs` | method step 7: runs are seeded — the same inputs rerun to the same outputs |
| `data_snapshot_pinned` | quality gate: the data snapshot is pinned — results are reproducible from the snapshot |
| `notebooks_and_scripts_versioned` | method step 7: notebooks and scripts are versioned — the exact code that produced the result is on record |
| `results_rerunnable_by_someone_else` | method step 7: results are rerunnable by someone else from the seeded runs, the pinned snapshot and the versioned code |

#### Computed checks in detail

- **Cost coverage (`all_stated_costs_included`):** `costs.included` passes only when it contains all five stated entries — `spreads`, `fees`, `slippage`, `borrow`, `taxes`. Unknown entries do not count. A missing list is missing evidence; an empty list is present and fails. The output reports omitted entries as `costs_not_included` (null when no list is declared). Entries are validated as strings only, never enum-checked.
- **Stability across periods (`stability_periods_cover_multiple_periods`):** `stationarity.stability_periods` passes only when it names at least two **distinct** periods. No period length, count above two, or period identity is imposed. A missing list is missing evidence; an empty or single-distinct-period list fails. The distinct count is reported as `stability_period_count` (null when no list is declared).
- **Reported-within-tested coherence (`reported_signals_within_tested_count`):** when both `multiple_testing.signals_tested` and `multiple_testing.signals_reported` are declared, the check passes only when both are whole numbers, zero or more, and reported does not exceed tested. If either is absent, the check is missing evidence. No significance level, deflation formula, or maximum number of tests is imposed. The output reports `signals_tested`, `signals_reported` and `signals_reported_minus_tested` (each null when it cannot be computed).

The output also reports `computed_status` over the three computed checks: `within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the three computed checks cannot be completed (SERVICE.md).

### Output format

HTTP 200 with one JSON verdict object (a 422 rejection is the only non-verdict response shape — see Errors). Top-level fields, in the order returned in the recorded responses:

| Field | Meaning |
|---|---|
| `service` | Always `"bias-controlled-quant-study-pack"`. |
| `atom_version` | Atom version that produced the verdict (`"0.1.0"` in the recorded runs). |
| `study` | The manifest's identity field, carried through (null when the manifest did not declare it, as in the recorded violations run for some atoms). |
| `verdict` | One of the verdict values below. |
| `sections` | Object mapping each section name to its section status (`pass` / `fail` / `insufficient_evidence`). |
| `checks` | Array of `{section, check, status, evidence}` — one entry per check, in section order. |
| `computed_status` | `within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null — see the computed-checks note above. |
| `stability_period_count` | Computed output field (see *Checks → Computed checks in detail*); in the recorded full-pass run: `2`. Null when it cannot be computed from the declared values, unless SERVICE.md states a different null rule for it. |
| `signals_tested` | Computed output field (see *Checks → Computed checks in detail*); in the recorded full-pass run: `100`. Null when it cannot be computed from the declared values, unless SERVICE.md states a different null rule for it. |
| `signals_reported` | Computed output field (see *Checks → Computed checks in detail*); in the recorded full-pass run: `5`. Null when it cannot be computed from the declared values, unless SERVICE.md states a different null rule for it. |
| `signals_reported_minus_tested` | Computed output field (see *Checks → Computed checks in detail*); in the recorded full-pass run: `-95`. Null when it cannot be computed from the declared values, unless SERVICE.md states a different null rule for it. |
| `costs_not_included` | Computed output field (see *Checks → Computed checks in detail*); in the recorded full-pass run: `[]`. Null when it cannot be computed from the declared values, unless SERVICE.md states a different null rule for it. |
| `summary` | One-line count, e.g. "34 pass, 0 fail, 0 missing of 34 checks across seven sections." |
| `stamp` | Plain-text rendering of the same verdict (display name, identity, verdict, per-section statuses, summary) for human-readable records. |

### Verdict vocabulary

| Value | Kind | Meaning |
|---|---|---|
| `STUDY_PACK_COMPLETE` | verdict | Every check passes (34/34); the manifest is complete and coherent on the declared evidence. |
| `STUDY_PACK_NOT_COMPLETE` | verdict | At least one check fails. Failing checks are named in the `checks` array with their evidence text. |
| `INSUFFICIENT_EVIDENCE` | verdict | Nothing fails, but at least one check is `missing` — evidence was not declared. The missing checks name exactly what to supply. |
| `within_stated_limits_on_declared_evidence` | `computed_status` | All computed checks that could be completed are within the limits the method itself states. |
| `outside_stated_limits_on_declared_evidence` | `computed_status` | At least one computed check is outside those stated limits. |
| `null` | `computed_status` | At least one computed check could not be completed from the declared values. |
| `pass` | section status | Every check in the section passes. |
| `fail` | section status | At least one check in the section fails. |
| `insufficient_evidence` | section status | No check in the section fails, but at least one is missing. |
| `pass` | per-check status | The requirement stated in the check's evidence text is satisfied. |
| `fail` | per-check status | The field was present but false/invalid, or a computed condition was not met. |
| `missing` | per-check status | The field(s) the check reads were absent — missing evidence, not a failure. |

No other verdict, section-status, or per-check-status values are returned; in particular there is no per-check `not_applicable` status in any recorded case.

### Errors

Only the shapes evidenced in USER-GUIDE.md / the recorded evidence are documented here; no payload shape is invented for statuses whose body was not recorded.

| HTTP | Error | Shape / meaning |
|---|---|---|
| 401 | unauthenticated | Missing or invalid key (USER-GUIDE.md). No body shape is recorded in the evidence; send a valid `Authorization: Bearer <key>` header. |
| 403 | scope | The key lacks this atom's scope (USER-GUIDE.md). Issue the key for this atom (`POST /v1/keys` with this atom's slug); a scope granted for another atom does not transfer. No body shape is recorded in the evidence. |
| 422 | `invalid_input` | Recorded body (verbatim from the malformed case): `{"ok": false, "error": "invalid_input", "field": "hypothesis.hypothesis_written", "detail": "hypothesis.hypothesis_written must be a boolean"}` — `ok: false`, `error`, `field` (the exact manifest field) and `detail` (the type it must be). Never a verdict. |
| 429 | rate limit | Rate limit exceeded: 60/min, 10,000/day per key (contract.yaml / USER-GUIDE.md). No body shape is recorded in the evidence; back off and retry after the window. |

### Rate limits and pricing status

- Rate limits (contract.yaml): **60 requests per minute per key** and **10,000 requests per day per key**. Contract note: the per-key rate limit is the capacity guard for open public usage; tuned per atom at build-out from measured production cost.
- Pricing (contract.yaml): pricing unit = deliverable; `pricing.rate` is **null** (`rate_status: pending`). **Free during trial — rate pending.** Prices are set only from measured production cost per unit (SERVICE.md).

## Explanation

### What this atom does, in depth

This atom audits one declared quant study pack against a bias-controlled research method: the hypothesis must have been preregistered before results were seen, the data hygiene must close the classic bias holes (survivorship, restatement peeking, point-in-time fundamentals), the distribution work must not assume Gaussian returns, stability must be shown across distinct periods, multiple testing must be controlled, costs must be covered from day one, and the work must be reproducible. It is a completeness and coherence audit of the pack's own declarations — the deterministic core checks that the pack contains what the method, its quality gates and its red lines demand, and that its declared counts and lists agree with themselves.

### How the verdict is decided

The core is deterministic: same manifest in → same verdict out, byte-identically (verified on the recorded repeat call). Each check reads declared field(s) and lands in exactly one of three states:

- **Absent field = missing evidence.** The check is `missing`; its section is `insufficient_evidence` unless another check in it fails; and if nothing anywhere fails, the verdict is `INSUFFICIENT_EVIDENCE`. Missing is not a failure and is never silently treated as `false`.
- **Present but false / invalid = fail.** The check is `fail`, its section is `fail`, and the verdict is the failing verdict — one failing check is enough, however complete the rest of the manifest is. Must-be-false (red-line) fields work the same way in mirror image: present and `true` = fail.
- **Computed checks** re-derive what can be re-derived from the declared values themselves — arithmetic, set coverage, and stated vocabulary only, importing no outside threshold (see *Checks → Computed checks in detail*). A computed check whose inputs are absent is `missing`, not failed; one whose inputs are present but disagree is `fail`.

Section statuses roll up mechanically (`fail` if any check fails, else `insufficient_evidence` if any is missing, else `pass`), and the verdict rolls up the same way across all 34 checks: `STUDY_PACK_COMPLETE` only when every check passes.

### What it does not do

- It does **not** fetch market data, run the study, replicate its results, or verify that a declared value is true.
- No significance testing, p-value computation, or deflated-Sharpe calculation — the method requires deflated-significance *awareness* and multiple-testing control as declared practices but states no formula, level, or pass mark, so none is computed or imposed.
- No minimum sample size, observation count, or period length (the method states none); no judgment of whether a declared stability period is a meaningful regime split — only distinctness and the across-periods minimum.
- No live-trading, capacity, or execution review. A pack can be complete on the declared evidence even if its hypothesis is wrong and its result would not survive live trading — this is **not a research review**: it never decides whether the hypothesis is sound, the data actually was clean, the mechanism is real, or the reported edge will persist.

The atom sells its deliverable — the bounded judgment artifact (the verdict object) — never the underlying knowledge or method itself.

### Buyer and use context

First buyer hypothesis (SERVICE.md, from register data; not yet market-tested): teams and agents working in Money & markets who need this deliverable on demand. Named self-use: **Research Analyst signal research** — Wright is an internal caller (zero price, metered to the internal cost ledger).

## Role views

### For integrators (Users)

- Start with [USER-GUIDE.md](USER-GUIDE.md) for the quick start, then the Tutorial and How-to guides above. One call = one manifest in, one verdict object out; there is no session, upload, or follow-up state to manage.
- Integrate on the REST face (`POST /v1/bias-controlled-quant-study-pack`) or the MCP face (tool `bias_controlled_quant_study_pack`) — they return the same verdict object and were parity-verified. Branch on `verdict` first, then on per-check `status` for repair guidance; treat HTTP 422 as a client bug (fix the type named in `field`), 401/403 as key problems, and 429 as back-off.
- Cache by manifest content if you cache at all: the verdict is a pure function of the manifest, so an identical manifest never needs a second paid call.

### For developers

- Manifest authoring: type every field exactly as the Input reference states — booleans as JSON booleans (not `"true"`), numbers as JSON numbers, lists as arrays of strings. A wrong type is a 422 at the gateway, not a failing check; a wrong *value* is a failing check. Vocabulary and coverage fields are validated as strings only and judged as verdict checks, so a misspelled vocabulary entry fails its check rather than erroring.
- Determinism: the core is a deterministic Python oracle with a TypeScript port, parity-proven (TEST-REPORT.md); the recorded REST repeat was byte-identical and MCP structured content was deep-equal to REST. Any fixed serialization rule for computed outputs is stated in *Checks → Computed checks in detail* where SERVICE.md states one.
- Source and tests: implementation in `src/bias_controlled_quant_study_pack.py`, tests in `tests/test_bias_controlled_quant_study_pack.py` (same directory as this document). Fixes land in the bound skill first, then the atom re-deploys and must pass regression before its version bumps (contract.yaml binding rule R1).

### For ops

- Endpoints: REST `POST https://atoms.pipavia.com/v1/bias-controlled-quant-study-pack` and MCP `POST https://atoms.pipavia.com/mcp/bias-controlled-quant-study-pack` on gateway https://atoms.pipavia.com (v1.1.0 at recorded-run time). Status: live — release candidate, one-week RC soak to 2026-11-22; treat verdict-shape changes during the soak as RC incidents, not silent deploys.
- Keys and scope: per-user, per-atom issuance (`POST /v1/keys`); a key's scope for this atom is namespace `bias_controlled_quant_study_pack` and never verifies for another atom. Watch 403s for mis-issued keys and 401s for missing/invalid headers.
- Limits and monitoring: 60/min and 10,000/day per key; alert on 429 volume (client retry storms), on 422 rate (a client shipping wrongly-typed manifests), and on any drift between REST and MCP verdicts for identical manifests (parity is a verified property — drift is a defect). Pricing is not yet metered for revenue: rate pending, free during trial.

## Worked examples

Provenance: recorded 2026-11-16T01:18:09.384325+00:00 against gateway v1.1.0, external verification lane, source `verification/work/bias-controlled-quant-study-pack/evidence.json`. The three examples below are that evidence's recorded cases: each shows the case's `input` and the REST execution's `response_text`, reproduced verbatim as JSON values (pretty-printed with indent 2 for readability; verified mechanically after writing — see the checklist).

### Example 1 — full-pass

Recorded expectation: HTTP 200, outcome `STUDY_PACK_COMPLETE`. Recorded REST status: 200.

Input:

```json
{
  "study": "Market Alpha Study 2024",
  "hypothesis": {
    "hypothesis_written": true,
    "prediction_stated": true,
    "falsification_test_defined": true,
    "results_looked_at_before_registration": false
  },
  "data": {
    "provenance_documented": true,
    "snapshot_version_documented": true,
    "adjusted_prices": true,
    "delisted_names_retained": true,
    "survivorship_gap_present": false,
    "point_in_time_fundamentals": true,
    "restatement_peeking": false,
    "timezone_timestamp_discipline": true
  },
  "distribution": {
    "fat_tails_considered": true,
    "volatility_clustering_considered": true,
    "gaussian_assumed": false,
    "crisis_correlations_considered": true
  },
  "stationarity": {
    "stability_tested": true,
    "stability_periods": [
      "2010-2015",
      "2016-2020"
    ],
    "regime_context_provided": true,
    "mechanism_stated": true,
    "claim_made_without_regime_context": false
  },
  "multiple_testing": {
    "controlled": true,
    "deflated_significance_applied": true,
    "holdout_used": true,
    "signals_tested": 100,
    "signals_reported": 5,
    "p_hacked_screen_presented_as_strategy": false,
    "result_from_single_sample": false
  },
  "costs": {
    "costs_included": true,
    "included": [
      "spreads",
      "fees",
      "slippage",
      "borrow",
      "taxes"
    ],
    "results_net_of_costs": true
  },
  "reproducibility": {
    "seeded_runs": true,
    "snapshot_pinned": true,
    "code_versioned": true,
    "rerunnable_by_others": true
  }
}
```

Response (REST `response_text`):

```json
{
  "service": "bias-controlled-quant-study-pack",
  "atom_version": "0.1.0",
  "study": "Market Alpha Study 2024",
  "verdict": "STUDY_PACK_COMPLETE",
  "sections": {
    "hypothesis_preregistration": "pass",
    "data_hygiene": "pass",
    "distribution_reality": "pass",
    "stationarity_and_stability": "pass",
    "multiple_testing": "pass",
    "costs": "pass",
    "reproducibility": "pass"
  },
  "checks": [
    {
      "section": "hypothesis_preregistration",
      "check": "hypothesis_written_before_analysis",
      "status": "pass",
      "evidence": "method step 1: the hypothesis is written before analysis (pre-registration)"
    },
    {
      "section": "hypothesis_preregistration",
      "check": "prediction_stated_before_analysis",
      "status": "pass",
      "evidence": "method step 1: the prediction the hypothesis makes is stated before looking at results"
    },
    {
      "section": "hypothesis_preregistration",
      "check": "falsification_test_defined_before_analysis",
      "status": "pass",
      "evidence": "quality gate: the falsification test is written before analysis \u2014 what result would kill the hypothesis"
    },
    {
      "section": "hypothesis_preregistration",
      "check": "results_not_seen_before_registration",
      "status": "pass",
      "evidence": "method step 1: results are not looked at before the hypothesis, prediction and falsification test are written"
    },
    {
      "section": "data_hygiene",
      "check": "data_provenance_documented",
      "status": "pass",
      "evidence": "quality gate: data provenance is documented \u2014 where every series came from"
    },
    {
      "section": "data_hygiene",
      "check": "snapshot_version_documented",
      "status": "pass",
      "evidence": "method step 2: the data snapshot version is documented alongside the provenance"
    },
    {
      "section": "data_hygiene",
      "check": "prices_adjusted_for_splits_and_dividends",
      "status": "pass",
      "evidence": "method step 2: adjusted prices (splits/dividends) are done correctly"
    },
    {
      "section": "data_hygiene",
      "check": "delisted_names_retained",
      "status": "pass",
      "evidence": "method step 2: delisted names are retained in the dataset (survivorship)"
    },
    {
      "section": "data_hygiene",
      "check": "no_survivorship_gap",
      "status": "pass",
      "evidence": "quality gate: there is no survivorship gap \u2014 the dataset is not silently limited to names that survived"
    },
    {
      "section": "data_hygiene",
      "check": "point_in_time_fundamentals_used",
      "status": "pass",
      "evidence": "method step 2: fundamentals are point-in-time \u2014 the values as known on the date, not as later restated"
    },
    {
      "section": "data_hygiene",
      "check": "no_restatement_peeking",
      "status": "pass",
      "evidence": "method step 2: no restatement peeking \u2014 later restated fundamentals are not read back into earlier dates"
    },
    {
      "section": "data_hygiene",
      "check": "timezone_and_timestamp_discipline",
      "status": "pass",
      "evidence": "method step 2: timezone and timestamp discipline is applied across the dataset"
    },
    {
      "section": "distribution_reality",
      "check": "fat_tails_accounted_for",
      "status": "pass",
      "evidence": "method step 3: fat tails are accounted for \u2014 extreme moves are more common than a normal distribution implies"
    },
    {
      "section": "distribution_reality",
      "check": "volatility_clustering_accounted_for",
      "status": "pass",
      "evidence": "method step 3: volatility clustering is accounted for \u2014 turbulent and quiet periods bunch together"
    },
    {
      "section": "distribution_reality",
      "check": "gaussian_not_assumed",
      "status": "pass",
      "evidence": "method step 3: a Gaussian distribution is not assumed \u2014 returns are non-normal"
    },
    {
      "section": "distribution_reality",
      "check": "crisis_correlation_rise_accounted_for",
      "status": "pass",
      "evidence": "method step 3: the rise of correlations in crises is accounted for \u2014 diversification fails exactly when needed"
    },
    {
      "section": "stationarity_and_stability",
      "check": "stability_tested_across_periods",
      "status": "pass",
      "evidence": "method step 4: stability is tested across periods \u2014 regimes end and relationships decay"
    },
    {
      "section": "stationarity_and_stability",
      "check": "stability_periods_cover_multiple_periods",
      "status": "pass",
      "evidence": "method step 4: the declared stability periods cover at least two distinct periods \u2014 stability 'across periods' cannot be shown inside a single period, and a repeated period is still one period"
    },
    {
      "section": "stationarity_and_stability",
      "check": "regime_context_provided",
      "status": "pass",
      "evidence": "red line: performance claims carry their regime context \u2014 which regimes the study period covers"
    },
    {
      "section": "stationarity_and_stability",
      "check": "mechanism_theory_stated",
      "status": "pass",
      "evidence": "method step 4: the study rests on a theory with a mechanism, preferred over a curve fit without one"
    },
    {
      "section": "stationarity_and_stability",
      "check": "no_claim_without_regime_context",
      "status": "pass",
      "evidence": "red line: no 'works since 2021' claims without regime context"
    },
    {
      "section": "multiple_testing",
      "check": "multiple_testing_controlled",
      "status": "pass",
      "evidence": "quality gate: multiple testing is controlled \u2014 a screen that tests thousands of things expects lucky winners by chance alone"
    },
    {
      "section": "multiple_testing",
      "check": "deflated_significance_awareness_applied",
      "status": "pass",
      "evidence": "method step 5: deflated significance awareness is applied \u2014 significance is read against how many things were tested"
    },
    {
      "section": "multiple_testing",
      "check": "holdout_discipline_applied",
      "status": "pass",
      "evidence": "method step 5: holdout discipline is applied \u2014 part of the evidence is kept back and not used to select the result"
    },
    {
      "section": "multiple_testing",
      "check": "reported_signals_within_tested_count",
      "status": "pass",
      "evidence": "method step 5: the signals reported as results never exceed the signals actually tested, and both declared counts are whole numbers \u2014 pure accounting coherence between the two counts the pack itself declares"
    },
    {
      "section": "multiple_testing",
      "check": "no_phacked_screen_presented_as_strategy",
      "status": "pass",
      "evidence": "red line: no p-hacked screens presented as strategy"
    },
    {
      "section": "multiple_testing",
      "check": "result_not_from_single_lucky_sample",
      "status": "pass",
      "evidence": "red line: no result from one lucky sample"
    },
    {
      "section": "costs",
      "check": "costs_included_from_day_one",
      "status": "pass",
      "evidence": "quality gate: costs are included from day one \u2014 a paper edge that dies after costs is not an edge"
    },
    {
      "section": "costs",
      "check": "all_stated_costs_included",
      "status": "pass",
      "evidence": "method step 6: the included costs cover every cost the skill names \u2014 spreads, fees, slippage, borrow, taxes"
    },
    {
      "section": "costs",
      "check": "results_reported_net_of_costs",
      "status": "pass",
      "evidence": "method step 6: results are reported net of costs \u2014 the edge shown is the edge after spreads, fees, slippage, borrow and taxes"
    },
    {
      "section": "reproducibility",
      "check": "seeded_runs",
      "status": "pass",
      "evidence": "method step 7: runs are seeded \u2014 the same inputs rerun to the same outputs"
    },
    {
      "section": "reproducibility",
      "check": "data_snapshot_pinned",
      "status": "pass",
      "evidence": "quality gate: the data snapshot is pinned \u2014 results are reproducible from the snapshot"
    },
    {
      "section": "reproducibility",
      "check": "notebooks_and_scripts_versioned",
      "status": "pass",
      "evidence": "method step 7: notebooks and scripts are versioned \u2014 the exact code that produced the result is on record"
    },
    {
      "section": "reproducibility",
      "check": "results_rerunnable_by_someone_else",
      "status": "pass",
      "evidence": "method step 7: results are rerunnable by someone else from the seeded runs, the pinned snapshot and the versioned code"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "stability_period_count": 2,
  "signals_tested": 100,
  "signals_reported": 5,
  "signals_reported_minus_tested": -95,
  "costs_not_included": [],
  "summary": "34 pass, 0 fail, 0 missing of 34 checks across seven sections.",
  "stamp": "BIAS-CONTROLLED QUANT STUDY PACK\nstudy: Market Alpha Study 2024\nVERDICT: STUDY_PACK_COMPLETE\n  hypothesis_preregistration   pass\n  data_hygiene                 pass\n  distribution_reality         pass\n  stationarity_and_stability   pass\n  multiple_testing             pass\n  costs                        pass\n  reproducibility              pass\n34 pass, 0 fail, 0 missing of 34 checks across seven sections."
}
```

### Example 2 — violations

Recorded expectation: HTTP 200, outcome `STUDY_PACK_NOT_COMPLETE`. Recorded REST status: 200.

Input:

```json
{
  "hypothesis": {
    "results_looked_at_before_registration": true
  },
  "data": {
    "survivorship_gap_present": true,
    "restatement_peeking": true
  },
  "distribution": {
    "gaussian_assumed": true
  },
  "stationarity": {
    "stability_periods": [
      "2020-2021",
      "2020-2021"
    ],
    "claim_made_without_regime_context": true
  },
  "multiple_testing": {
    "signals_tested": 5,
    "signals_reported": 10,
    "p_hacked_screen_presented_as_strategy": true,
    "result_from_single_sample": true
  },
  "costs": {
    "included": [
      "spreads"
    ]
  }
}
```

Response (REST `response_text`):

```json
{
  "service": "bias-controlled-quant-study-pack",
  "atom_version": "0.1.0",
  "study": null,
  "verdict": "STUDY_PACK_NOT_COMPLETE",
  "sections": {
    "hypothesis_preregistration": "fail",
    "data_hygiene": "fail",
    "distribution_reality": "fail",
    "stationarity_and_stability": "fail",
    "multiple_testing": "fail",
    "costs": "fail",
    "reproducibility": "insufficient_evidence"
  },
  "checks": [
    {
      "section": "hypothesis_preregistration",
      "check": "hypothesis_written_before_analysis",
      "status": "missing",
      "evidence": "method step 1: the hypothesis is written before analysis (pre-registration)"
    },
    {
      "section": "hypothesis_preregistration",
      "check": "prediction_stated_before_analysis",
      "status": "missing",
      "evidence": "method step 1: the prediction the hypothesis makes is stated before looking at results"
    },
    {
      "section": "hypothesis_preregistration",
      "check": "falsification_test_defined_before_analysis",
      "status": "missing",
      "evidence": "quality gate: the falsification test is written before analysis \u2014 what result would kill the hypothesis"
    },
    {
      "section": "hypothesis_preregistration",
      "check": "results_not_seen_before_registration",
      "status": "fail",
      "evidence": "method step 1: results are not looked at before the hypothesis, prediction and falsification test are written"
    },
    {
      "section": "data_hygiene",
      "check": "data_provenance_documented",
      "status": "missing",
      "evidence": "quality gate: data provenance is documented \u2014 where every series came from"
    },
    {
      "section": "data_hygiene",
      "check": "snapshot_version_documented",
      "status": "missing",
      "evidence": "method step 2: the data snapshot version is documented alongside the provenance"
    },
    {
      "section": "data_hygiene",
      "check": "prices_adjusted_for_splits_and_dividends",
      "status": "missing",
      "evidence": "method step 2: adjusted prices (splits/dividends) are done correctly"
    },
    {
      "section": "data_hygiene",
      "check": "delisted_names_retained",
      "status": "missing",
      "evidence": "method step 2: delisted names are retained in the dataset (survivorship)"
    },
    {
      "section": "data_hygiene",
      "check": "no_survivorship_gap",
      "status": "fail",
      "evidence": "quality gate: there is no survivorship gap \u2014 the dataset is not silently limited to names that survived"
    },
    {
      "section": "data_hygiene",
      "check": "point_in_time_fundamentals_used",
      "status": "missing",
      "evidence": "method step 2: fundamentals are point-in-time \u2014 the values as known on the date, not as later restated"
    },
    {
      "section": "data_hygiene",
      "check": "no_restatement_peeking",
      "status": "fail",
      "evidence": "method step 2: no restatement peeking \u2014 later restated fundamentals are not read back into earlier dates"
    },
    {
      "section": "data_hygiene",
      "check": "timezone_and_timestamp_discipline",
      "status": "missing",
      "evidence": "method step 2: timezone and timestamp discipline is applied across the dataset"
    },
    {
      "section": "distribution_reality",
      "check": "fat_tails_accounted_for",
      "status": "missing",
      "evidence": "method step 3: fat tails are accounted for \u2014 extreme moves are more common than a normal distribution implies"
    },
    {
      "section": "distribution_reality",
      "check": "volatility_clustering_accounted_for",
      "status": "missing",
      "evidence": "method step 3: volatility clustering is accounted for \u2014 turbulent and quiet periods bunch together"
    },
    {
      "section": "distribution_reality",
      "check": "gaussian_not_assumed",
      "status": "fail",
      "evidence": "method step 3: a Gaussian distribution is not assumed \u2014 returns are non-normal"
    },
    {
      "section": "distribution_reality",
      "check": "crisis_correlation_rise_accounted_for",
      "status": "missing",
      "evidence": "method step 3: the rise of correlations in crises is accounted for \u2014 diversification fails exactly when needed"
    },
    {
      "section": "stationarity_and_stability",
      "check": "stability_tested_across_periods",
      "status": "missing",
      "evidence": "method step 4: stability is tested across periods \u2014 regimes end and relationships decay"
    },
    {
      "section": "stationarity_and_stability",
      "check": "stability_periods_cover_multiple_periods",
      "status": "fail",
      "evidence": "method step 4: the declared stability periods cover at least two distinct periods \u2014 stability 'across periods' cannot be shown inside a single period, and a repeated period is still one period"
    },
    {
      "section": "stationarity_and_stability",
      "check": "regime_context_provided",
      "status": "missing",
      "evidence": "red line: performance claims carry their regime context \u2014 which regimes the study period covers"
    },
    {
      "section": "stationarity_and_stability",
      "check": "mechanism_theory_stated",
      "status": "missing",
      "evidence": "method step 4: the study rests on a theory with a mechanism, preferred over a curve fit without one"
    },
    {
      "section": "stationarity_and_stability",
      "check": "no_claim_without_regime_context",
      "status": "fail",
      "evidence": "red line: no 'works since 2021' claims without regime context"
    },
    {
      "section": "multiple_testing",
      "check": "multiple_testing_controlled",
      "status": "missing",
      "evidence": "quality gate: multiple testing is controlled \u2014 a screen that tests thousands of things expects lucky winners by chance alone"
    },
    {
      "section": "multiple_testing",
      "check": "deflated_significance_awareness_applied",
      "status": "missing",
      "evidence": "method step 5: deflated significance awareness is applied \u2014 significance is read against how many things were tested"
    },
    {
      "section": "multiple_testing",
      "check": "holdout_discipline_applied",
      "status": "missing",
      "evidence": "method step 5: holdout discipline is applied \u2014 part of the evidence is kept back and not used to select the result"
    },
    {
      "section": "multiple_testing",
      "check": "reported_signals_within_tested_count",
      "status": "fail",
      "evidence": "method step 5: the signals reported as results never exceed the signals actually tested, and both declared counts are whole numbers \u2014 pure accounting coherence between the two counts the pack itself declares"
    },
    {
      "section": "multiple_testing",
      "check": "no_phacked_screen_presented_as_strategy",
      "status": "fail",
      "evidence": "red line: no p-hacked screens presented as strategy"
    },
    {
      "section": "multiple_testing",
      "check": "result_not_from_single_lucky_sample",
      "status": "fail",
      "evidence": "red line: no result from one lucky sample"
    },
    {
      "section": "costs",
      "check": "costs_included_from_day_one",
      "status": "missing",
      "evidence": "quality gate: costs are included from day one \u2014 a paper edge that dies after costs is not an edge"
    },
    {
      "section": "costs",
      "check": "all_stated_costs_included",
      "status": "fail",
      "evidence": "method step 6: the included costs cover every cost the skill names \u2014 spreads, fees, slippage, borrow, taxes"
    },
    {
      "section": "costs",
      "check": "results_reported_net_of_costs",
      "status": "missing",
      "evidence": "method step 6: results are reported net of costs \u2014 the edge shown is the edge after spreads, fees, slippage, borrow and taxes"
    },
    {
      "section": "reproducibility",
      "check": "seeded_runs",
      "status": "missing",
      "evidence": "method step 7: runs are seeded \u2014 the same inputs rerun to the same outputs"
    },
    {
      "section": "reproducibility",
      "check": "data_snapshot_pinned",
      "status": "missing",
      "evidence": "quality gate: the data snapshot is pinned \u2014 results are reproducible from the snapshot"
    },
    {
      "section": "reproducibility",
      "check": "notebooks_and_scripts_versioned",
      "status": "missing",
      "evidence": "method step 7: notebooks and scripts are versioned \u2014 the exact code that produced the result is on record"
    },
    {
      "section": "reproducibility",
      "check": "results_rerunnable_by_someone_else",
      "status": "missing",
      "evidence": "method step 7: results are rerunnable by someone else from the seeded runs, the pinned snapshot and the versioned code"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "stability_period_count": 1,
  "signals_tested": 5,
  "signals_reported": 10,
  "signals_reported_minus_tested": 5,
  "costs_not_included": [
    "fees",
    "slippage",
    "borrow",
    "taxes"
  ],
  "summary": "0 pass, 10 fail, 24 missing of 34 checks across seven sections.",
  "stamp": "BIAS-CONTROLLED QUANT STUDY PACK\nstudy: None\nVERDICT: STUDY_PACK_NOT_COMPLETE\n  hypothesis_preregistration   fail\n  data_hygiene                 fail\n  distribution_reality         fail\n  stationarity_and_stability   fail\n  multiple_testing             fail\n  costs                        fail\n  reproducibility              insufficient_evidence\n0 pass, 10 fail, 24 missing of 34 checks across seven sections."
}
```

### Example 3 — malformed

Recorded expectation: HTTP 422, no verdict (rejected as invalid input). Recorded REST status: 422.

Input:

```json
{
  "hypothesis": {
    "hypothesis_written": "YES"
  },
  "multiple_testing": {
    "signals_tested": "many"
  }
}
```

Response (REST `response_text`):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "hypothesis.hypothesis_written",
  "detail": "hypothesis.hypothesis_written must be a boolean"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes; Developers Yes; Ops Yes; Regulators: N/A — the verdict is a method-completeness audit of a declared study pack, not compliance or audit evidence, and SERVICE.md states it is not a research review; the finance-research domain here is not a regulated certification. |
| Checks named: documented / recorded | 34 / 34 (from the recorded full-pass REST `checks` array, cross-checked against SERVICE.md) |
| Verdict vocabulary complete | Yes — all 3 verdicts (`STUDY_PACK_COMPLETE`, `STUDY_PACK_NOT_COMPLETE`, `INSUFFICIENT_EVIDENCE`), `computed_status` values including null, section statuses and per-check statuses |
| Input reference typed | Yes — 36 fields, each with a type from SERVICE.md's field table, grouped as SERVICE.md groups them, gates/conditionals preserved in Notes |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed from this file and compared as JSON values against `verification/work/bias-controlled-quant-study-pack/evidence.json` after writing; all matched |
| Errors documented from evidence only | Yes — 422 shape verbatim from the recorded malformed case; 401/403/429 documented at the status/meaning level evidenced in USER-GUIDE.md and contract.yaml, with no invented payload |

