# Applied ML validation — `applied-ml-validation`

**Display name:** Applied ML validation · **Slug:** `applied-ml-validation` · **Deliverable type:** VALIDATION · **Atom version:** 0.1.0 · **Status:** live — release candidate (one-week RC soak to 2026-11-22)

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run; the verbatim request and response live under [Worked examples](#worked-examples), example 1.

1. **Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a key for this atom: `POST /v1/keys` with `{"atom": "applied-ml-validation"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
2. **Assemble the applied-ML validation manifest.** Fill every group in the [Input reference](#input-reference): the identifier field `model` plus one object per section. Declare values truthfully — the atom judges declared evidence (see Explanation). The recorded run's manifest is example 1 below.
3. **Call REST.** `POST https://atoms.pipavia.com/v1/applied-ml-validation` with header `Authorization: Bearer <key>` and the manifest as the JSON body.
4. **Read the verdict.** The recorded run returned HTTP 200 with verdict `VALIDATED` — 35 pass, 0 fail, 0 missing of 35 checks across six sections. The declared model score strictly beats the declared baseline score in the declared metric direction, so the computed baseline check passes and `baseline_improvement` reports `"0.1000"` with `baseline_status` `beaten_on_declared_evidence`. The declared split matches the declared data shape, and the evaluated rungs are exactly the ladder prefix up to the selected rung (`selected_rung_index` 1).
5. **Act on it.** A passing verdict needs no action. For any other verdict, work through the `fail` and `missing` checks in the response (see *Read a failing verdict and fix the manifest* below) and resubmit — the atom is deterministic, so the same manifest always returns the same verdict.

## How-to guides

### Get a key and call via REST

1. `POST https://atoms.pipavia.com/v1/signup` with your email; open the emailed sign-in link to mint your session.
2. `POST /v1/keys` with `{"atom": "applied-ml-validation"}` to grant this atom's scope on your gateway key.
3. Call `POST https://atoms.pipavia.com/v1/applied-ml-validation` with `Authorization: Bearer <key>` and the manifest JSON as the body. HTTP 200 returns the verdict object (see Output format); errors are covered below and in Reference.

### Call via MCP

Connect your MCP client to `POST https://atoms.pipavia.com/mcp/applied-ml-validation` with the same `Authorization: Bearer <key>` header and call the tool `applied_ml_validation` with the manifest object as its arguments. The MCP `structuredContent` is deep-equal to the REST verdict object — the recorded battery verified REST/MCP parity on the full-pass case (see TEST-REPORT.md).

### Read a failing verdict and fix the manifest

1. Look at `verdict`: `NOT_VALIDATED` means at least one check failed; `INSUFFICIENT_EVIDENCE` means nothing failed but evidence is missing. A section reports `fail` if any of its checks fail, else `insufficient_evidence` if any is `missing`, else `pass`.
2. Work the `checks` array: each entry names its `section`, the `check`, its `status` (`pass` / `fail` / `missing`) and an `evidence` line stating the requirement. Fix every `fail` by changing the underlying practice/design and declaring the true new value; fix every `missing` by supplying the field.
3. In the recorded violations run (Worked examples), seven checks fail: `baseline_meaningfully_beaten_or_project_stopped`, `no_training_without_rights_or_consent`, `splits_by_time_and_group_where_applicable`, `ladder_climbed_in_order`, `no_accuracy_only_reporting_where_it_matters`, `no_cherry_picked_examples` and `no_claims_beyond_measured_capability`. Fix = beat the baseline on the declared metric (or honestly declare the project stopped), train only with rights/consent, split by time/group where the data requires it, climb the ladder in order without skipping rungs, report beyond accuracy where the problem is imbalanced or high-stakes, drop cherry-picked examples, and keep claims within measured capability — then resubmit.
4. Resubmit the corrected manifest. Determinism is verified in the recorded battery (the full-pass manifest submitted twice returned byte-identical responses), so a changed verdict reflects your changed manifest, not noise.

### Handle a 422 invalid_input

A type or shape error is rejected before evaluation with HTTP 422 and body `{"ok": false, "error": "invalid_input", "field": ..., "detail": ...}`. The recorded malformed case for this atom returned field `model` with detail "model must be a string" (verbatim in Worked examples, example 3). Fix the named field to the type given in the Input reference, then resubmit. Note the distinction: a *wrong-typed* value is a 422; a well-typed but false/invalid value is evaluated and fails its check; an *absent* field is not an error — it is scored `missing`.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/applied-ml-validation` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/applied-ml-validation` — tool name `applied_ml_validation`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Gateway base: `https://atoms.pipavia.com` (recorded gateway version 1.1.0).

### Input reference

One JSON manifest per call. Every field below is read by the named section's checks. Types are from SERVICE.md's field table (all fields are booleans unless noted), corroborated by contract.yaml and the recorded evidence input schema. An **absent** field = evidence missing; a field **present but false / invalid** = the check fails. Gates and conditionals are preserved in the Notes column.

| Field | Type | Read by (section) | Notes |
|---|---|---|---|
| `model` | string | — | string; carried into the verdict output, not itself checked |
| `framing.decision_named` | boolean | framing_and_baseline |  |
| `framing.error_costs_stated` | boolean | framing_and_baseline |  |
| `framing.alternatives_considered` | boolean | framing_and_baseline |  |
| `baseline.defined` | boolean | framing_and_baseline |  |
| `baseline.baseline_score` | number | framing_and_baseline (computed, see below) | number |
| `baseline.project_stopped_because_baseline_not_beaten` | boolean | framing_and_baseline | gates the computed baseline check — the skill's "or the project rightly stopped" alternative |
| `data.provenance_documented` | boolean | data_audit_and_leakage |  |
| `data.licensing_and_consent_confirmed` | boolean | data_audit_and_leakage |  |
| `data.label_quality_checked` | boolean | data_audit_and_leakage |  |
| `data.edge_cases_covered` | boolean | data_audit_and_leakage |  |
| `data.leakage_audited` | boolean | data_audit_and_leakage |  |
| `data.training_without_rights_or_consent` | boolean | data_audit_and_leakage | must be `false` to pass — skill red line |
| `validation.temporal_data` + `validation.grouped_data` + `validation.split_type` | boolean | data_audit_and_leakage (computed, see below) | `"random"` / `"time"` / `"group"` / `"time_and_group"` |
| `ladder.baseline_rung_evaluated` | boolean | model_ladder |  |
| `ladder.data_and_splits_held_fixed` | boolean | model_ladder |  |
| `ladder.complexity_justified_by_evaluation` | boolean | model_ladder |  |
| `ladder.selected_model_rung` | boolean | model_ladder (computed, see below) | `"majority_heuristic"` / `"linear"` / `"boosted_trees"` / `"deep"` |
| `evaluation.decision_aligned_metrics_used` | boolean | evaluation_and_honesty |  |
| `evaluation.slice_performance_reported` | boolean | evaluation_and_honesty |  |
| `evaluation.calibration_reported` | boolean | evaluation_and_honesty |  |
| `evaluation.uncertainty_via_resampling_reported` | boolean | evaluation_and_honesty |  |
| `evaluation.conclusion_change_condition_stated` | boolean | evaluation_and_honesty |  |
| `evaluation.imbalanced_or_high_stakes` | boolean | evaluation_and_honesty | gates the accuracy-only check below |
| `evaluation.accuracy_only_reporting` | boolean | evaluation_and_honesty | must be `false` when the problem is imbalanced or high-stakes — skill red line; otherwise the check passes as not applicable |
| `robustness.distribution_shift_evaluated` | boolean | robustness_and_limits |  |
| `robustness.adversarial_inputs_evaluated` | boolean | robustness_and_limits |  |
| `robustness.known_failure_modes_documented` | boolean | robustness_and_limits |  |
| `robustness.data_limitations_documented` | boolean | robustness_and_limits |  |
| `robustness.cherry_picked_examples_presented` | boolean | robustness_and_limits | must be `false` to pass |
| `robustness.claims_exceed_measured_capability` | boolean | robustness_and_limits | must be `false` to pass — skill red line |
| `deployment.data_code_model_versioned_together` | boolean | deployment_monitoring_and_card |  |
| `deployment.drift_monitoring_planned` | boolean | deployment_monitoring_and_card |  |
| `deployment.live_performance_monitoring_planned` | boolean | deployment_monitoring_and_card |  |
| `deployment.feedback_loops_monitored` | boolean | deployment_monitoring_and_card |  |
| `deployment.rollback_path_defined` | boolean | deployment_monitoring_and_card |  |
| `deployment.regular_revalidation_planned` | boolean | deployment_monitoring_and_card |  |
| `documentation.model_card_written_and_versioned` | boolean | deployment_monitoring_and_card |  |

### Checks

All 35 checks, exactly as named in the recorded full-pass REST response, grouped by section/bar. The *Requires* text is the recorded per-check `evidence` line — what the check requires to pass, on declared evidence.

Per-check statuses: `pass` — the requirement is met on the declared evidence (a gated check whose gate is closed also reports `pass`, as not applicable); `fail` — the field is present but false/invalid, or a computed condition is breached; `missing` — the field is absent, so there is no evidence to judge. There is no separate not-applicable status value in the output.

#### Section: `framing_and_baseline` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `decision_named` | frame: what decision does the model inform? The decision is named |
| `error_costs_stated` | frame: what is the cost of each error type? The error costs are stated |
| `simpler_alternatives_considered` | frame: would rules, a simple regression, or asking a human do better? The simpler alternatives are considered — baseline first, always |
| `baseline_defined` | quality gate: baseline defined — baseline first, always |
| `baseline_meaningfully_beaten_or_project_stopped` | quality gate: baseline defined and meaningfully beaten (or the project rightly stopped) — the model strictly beats the declared baseline score in the declared metric direction; the skill states no margin above the baseline, so equality does not pass |
#### Section: `data_audit_and_leakage` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `data_provenance_documented` | data audit: provenance is documented |
| `licensing_and_consent_confirmed` | data audit: licensing and consent are confirmed |
| `label_quality_checked` | data audit: label quality is checked |
| `edge_case_coverage_checked` | data audit: coverage of edge cases is checked |
| `leakage_audited` | data audit: leakage checked (temporal, group, target proxies) |
| `no_training_without_rights_or_consent` | red line: no training on data without rights/consent; PII per the privacy rules |
| `splits_by_time_and_group_where_applicable` | splits by time and group where applicable — not just random rows: temporal data requires a time split, grouped data requires a group split |
#### Section: `model_ladder` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `baseline_rung_evaluated` | model ladder: the majority/heuristic rung is evaluated first — earn complexity |
| `data_and_splits_held_fixed_while_climbing` | model ladder: climb holding data and splits fixed |
| `complexity_justified_by_evaluation` | model ladder: climb only when evaluation justifies it |
| `ladder_climbed_in_order` | model ladder: majority/heuristic -> linear -> boosted trees -> deep — the rungs evaluated are exactly the ladder prefix up to the selected rung, in order, with no rung skipped, repeated, or evaluated out of order |
#### Section: `evaluation_and_honesty` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `decision_aligned_metrics_used` | evaluate on decision-aligned metrics: costs of FP / FN, not a generic score |
| `slice_performance_reported` | quality gate: slice performance reported, not aggregate accuracy alone |
| `calibration_reported` | quality gate: calibration reported, not aggregate accuracy alone |
| `uncertainty_via_resampling_reported` | evaluate: uncertainty via resampling is reported |
| `conclusion_change_condition_stated` | evaluate: what would be needed to change the conclusion is reported |
| `no_accuracy_only_reporting_where_it_matters` | problem not declared imbalanced or high-stakes |
#### Section: `robustness_and_limits` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `distribution_shift_evaluated` | robustness & honesty: distribution shift is evaluated |
| `adversarial_inputs_evaluated` | robustness & honesty: adversarial inputs are evaluated |
| `known_failure_modes_documented` | robustness & honesty: known failure modes are documented — no hiding failure modes |
| `data_limitations_documented` | robustness & honesty: documented data limitations |
| `no_cherry_picked_examples` | robustness & honesty: no cherry-picked examples |
| `no_claims_beyond_measured_capability` | red line: no 'AI' claims beyond measured capability |
#### Section: `deployment_monitoring_and_card` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `data_code_model_versioned_together` | deploy & monitor: version data+code+model together |
| `drift_monitoring_planned` | quality gate: monitoring planned before deployment — drift is monitored |
| `live_performance_monitoring_planned` | deploy & monitor: live performance is monitored |
| `feedback_loops_monitored` | deploy & monitor: feedback loops are monitored |
| `rollback_path_defined` | quality gate: monitoring + rollback planned before deployment — a rollback path is defined |
| `regular_revalidation_planned` | deploy & monitor: regular re-validation is planned |
| `model_card_written_and_versioned` | quality gate: model card written and versioned — intended use, limits, metrics per slice, training data summary; keep it current |

### Output format

HTTP 200 returns one JSON object (REST body; the same object is the MCP `structuredContent`):

- `service` — The atom slug.
- `atom_version` — Atom version that produced the verdict (`0.1.0` in the recorded runs).
- `model` — The caller's identifier value, carried through from the manifest (not itself checked).
- `verdict` — The overall verdict — see Verdict vocabulary.
- `sections` — Per-section statuses keyed by section name — see Verdict vocabulary.
- `checks` — All 35 per-check results: `section`, `check`, `status`, `evidence`.
- `baseline_improvement` — The signed improvement in the declared metric direction, as a string with exactly four decimal places (round half up to 4dp: `floor(v * 10000 + 0.5) / 10000`, then formatted to four decimals; comparisons use unrounded values).
- `baseline_status` — `beaten_on_declared_evidence` / `not_beaten_on_declared_evidence` / `project_rightly_stopped`; `null` when the baseline check cannot be completed.
- `selected_rung_index` — The selected rung's zero-based ladder index (integer); `null` when the selected rung is not a ladder vocabulary value.
- `summary` — One-line counts, e.g. the recorded full-pass summary quoted in the Tutorial.
- `stamp` — A plain-text rendering of the verdict (title, identifier, verdict, per-section statuses, summary) for logs and tickets.

### Verdict vocabulary

**Overall verdicts** — every value this atom can return:

- `VALIDATED` — All 35 checks pass.
- `NOT_VALIDATED` — At least one check fails.
- `INSUFFICIENT_EVIDENCE` — Nothing fails, but at least one check is `missing` — evidence was not declared.

**Section statuses** (values of each entry in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check fails but at least one is `missing`.

**Per-check statuses** (values of each check's `status`): `pass`, `fail`, `missing` — as defined under Checks. Gated/not-applicable checks report `pass` when their gate is closed; there is no distinct not-applicable value.

**Computed fields:**

- `baseline_status` — `beaten_on_declared_evidence` / `not_beaten_on_declared_evidence` / `project_rightly_stopped`; `null` when the baseline check cannot be completed.
- `baseline_improvement` — The signed improvement in the declared metric direction, as a string with exactly four decimal places (round half up to 4dp: `floor(v * 10000 + 0.5) / 10000`, then formatted to four decimals; comparisons use unrounded values).
- `selected_rung_index` — The selected rung's zero-based ladder index (integer); `null` when the selected rung is not a ladder vocabulary value.

### Errors

Only the shapes evidenced in the repo / gateway docs are listed; no other payloads are promised.

- **401** — missing or invalid key. No verdict is produced.
- **403** — the key lacks this atom's scope. Issue the atom's scope on your key (`POST /v1/keys` with this atom's slug) and retry.
- **422** — invalid input: `{"ok": false, "error": "invalid_input", "field": "model", "detail": "model must be a string"}` is this atom's recorded malformed-case shape (verbatim in Worked examples, example 3); `field` names the offending field and `detail` states the expected type.
- **429** — rate limit exceeded (see Rate limits). Back off and retry; do not parallel-retry.

### Rate limits + pricing status

- **Rate limits:** 60 requests/minute and 10,000 requests/day per key (contract.yaml `rate_limit`; SPEC default — the per-key limit is the capacity guard for open public usage).
- **Pricing:** Free during trial — rate pending. contract.yaml `pricing.rate` is `null` (`rate_status: pending`); prices are set only from measured production cost per unit.

## Explanation

The atom validates a declared evidence pack for one ML project across six sections. Three checks are computed, using only what the skill itself states. **Baseline beaten, or project rightly stopped:** `baseline.model_score` must strictly beat `baseline.baseline_score` in the declared `metric_direction` — the skill states no margin, so any strictly positive improvement passes and equality fails; when `project_stopped_because_baseline_not_beaten` is declared `true`, the gate passes as the skill's stated alternative and the scores are not required. **Splits match the data:** temporal data requires a `"time"` or `"time_and_group"` split, grouped data a `"group"` or `"time_and_group"` split; data that is neither passes with any declared split vocabulary value; an unknown split type or a non-boolean data flag fails. **Ladder climbed in order:** `ladder.rungs_evaluated` must be exactly the ladder prefix (majority/heuristic → linear → boosted trees → deep) up to and including `selected_model_rung`, in order — no rung skipped, repeated, or out of order. The accuracy-only check is gated by `evaluation.imbalanced_or_high_stakes`. The fixed four-decimal serialization of `baseline_improvement` is what makes the Python and TypeScript outputs byte-identical.

**How the verdict is decided.** The core is deterministic: same manifest in → same verdict out, byte-identical on repeat calls and identical across the REST and MCP faces (both verified in the recorded battery). Every check reads declared fields only. The three-way distinction is the heart of the semantics: an **absent** field is *missing evidence* (check `missing`; the verdict can be at most `INSUFFICIENT_EVIDENCE`), while a field **present but false / invalid** is a *failure* (check `fail`; the verdict is the not-passing verdict). Any single `fail` decides the verdict immediately in effect — failures outrank missing evidence — and only a manifest with no fails and no missing checks earns the passing verdict. Where a check is gated, a closed gate makes it pass as not applicable rather than missing: the gate field itself carries the evidence that the check does not apply.

**What it does NOT do.** It validates **declared** evidence only — it does not train, run, inspect, or benchmark a model, does not read the training data, recompute any metric, or verify that a declared value is true. Named exclusions: no check of *how much* the baseline was beaten by (strict improvement is the only stated test); no numeric calibration, slice, or drift thresholds (calibration and slice performance are checked as *reported*, not recomputed — callers who need the numbers audited want the close cousin `prediction-model-leakage-calibration-audit`); no judgment of whether the framing, error costs, or model choice were *good* — only that they are declared; no live verification of any declared fact.

**Buyer / use context.** Teams and agents in engineering & code doing model evaluation for products, who need a bounded validation verdict on an ML project's declared evidence. One unit of sale = one delivered validation. The atom sells its deliverable — the bounded judgment artifact — never the underlying knowledge itself.

## Role views

### For integrators (Users)

You need: the endpoints and tool name above, one key with this atom's scope, and a manifest that declares your evidence truthfully. Read `verdict` first, then `sections` to localize a problem, then the individual `fail`/`missing` checks to fix it. Budget for the 60/min, 10,000/day per-key limits; price is free during trial (rate pending). Status is release candidate — pin to the recorded behaviour in TEST-REPORT.md and expect the RC soak to 2026-11-22.

### For developers

Manifest authoring: follow the Input reference exactly — field names, nesting and types are the contract; a wrong type is a 422, an omitted field is `missing`, a false value is a `fail`. Determinism: the evaluation core is a pure function of the manifest (Python oracle `src/applied_ml_validation.py` — `evaluate(manifest) -> verdict dict`; tests: tests/test_applied_ml_validation.py — 46 tests, all passing 2026-11-15). Fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps (contract.yaml binding rule R1).

### For ops

Endpoints: REST `POST /v1/applied-ml-validation` and MCP `POST /mcp/applied-ml-validation` on `https://atoms.pipavia.com` (gateway v1.1.0 in the recorded battery). Key scope: per-atom scope on the gateway key; 401 = missing/invalid key, 403 = scope missing — separate those two in alerting. Error monitoring: 422s indicate caller-side manifest type errors (field + detail are in the body); 429s indicate the 60/min or 10,000/day per-key limit. RC status: live — release candidate, one-week RC soak to 2026-11-22; atom version 0.1.0.

## Worked examples

Provenance: recorded 2026-11-15T23:57:53.660257+00:00 against gateway v1.1.0, external verification lane, source `verification/work/applied-ml-validation/evidence.json`. Each example is the case's recorded `input` followed by the REST execution's recorded `response_text`, reproduced verbatim as JSON values (pretty-printed with indent 2 for readability; verified mechanically against the evidence after writing).

### Example 1 — Full-pass (recorded case `full-pass`, HTTP 200)

Input:

```json
{
  "model": "test-model-v1",
  "framing": {
    "decision_named": true,
    "error_costs_stated": true,
    "alternatives_considered": true
  },
  "baseline": {
    "defined": true,
    "baseline_score": 0.5,
    "model_score": 0.6,
    "metric_direction": "higher_is_better",
    "project_stopped_because_baseline_not_beaten": false
  },
  "data": {
    "provenance_documented": true,
    "licensing_and_consent_confirmed": true,
    "label_quality_checked": true,
    "edge_cases_covered": true,
    "leakage_audited": true,
    "training_without_rights_or_consent": false
  },
  "validation": {
    "temporal_data": true,
    "grouped_data": true,
    "split_type": "time_and_group"
  },
  "ladder": {
    "baseline_rung_evaluated": true,
    "data_and_splits_held_fixed": true,
    "complexity_justified_by_evaluation": true,
    "selected_model_rung": "linear",
    "rungs_evaluated": [
      "majority_heuristic",
      "linear"
    ]
  },
  "evaluation": {
    "decision_aligned_metrics_used": true,
    "slice_performance_reported": true,
    "calibration_reported": true,
    "uncertainty_via_resampling_reported": true,
    "conclusion_change_condition_stated": true,
    "imbalanced_or_high_stakes": false,
    "accuracy_only_reporting": false
  },
  "robustness": {
    "distribution_shift_evaluated": true,
    "adversarial_inputs_evaluated": true,
    "known_failure_modes_documented": true,
    "data_limitations_documented": true,
    "cherry_picked_examples_presented": false,
    "claims_exceed_measured_capability": false
  },
  "deployment": {
    "data_code_model_versioned_together": true,
    "drift_monitoring_planned": true,
    "live_performance_monitoring_planned": true,
    "feedback_loops_monitored": true,
    "rollback_path_defined": true,
    "regular_revalidation_planned": true
  },
  "documentation": {
    "model_card_written_and_versioned": true
  }
}
```

Response (`response_text`):

```json
{
  "service": "applied-ml-validation",
  "atom_version": "0.1.0",
  "model": "test-model-v1",
  "verdict": "VALIDATED",
  "sections": {
    "framing_and_baseline": "pass",
    "data_audit_and_leakage": "pass",
    "model_ladder": "pass",
    "evaluation_and_honesty": "pass",
    "robustness_and_limits": "pass",
    "deployment_monitoring_and_card": "pass"
  },
  "checks": [
    {
      "section": "framing_and_baseline",
      "check": "decision_named",
      "status": "pass",
      "evidence": "frame: what decision does the model inform? The decision is named"
    },
    {
      "section": "framing_and_baseline",
      "check": "error_costs_stated",
      "status": "pass",
      "evidence": "frame: what is the cost of each error type? The error costs are stated"
    },
    {
      "section": "framing_and_baseline",
      "check": "simpler_alternatives_considered",
      "status": "pass",
      "evidence": "frame: would rules, a simple regression, or asking a human do better? The simpler alternatives are considered \u2014 baseline first, always"
    },
    {
      "section": "framing_and_baseline",
      "check": "baseline_defined",
      "status": "pass",
      "evidence": "quality gate: baseline defined \u2014 baseline first, always"
    },
    {
      "section": "framing_and_baseline",
      "check": "baseline_meaningfully_beaten_or_project_stopped",
      "status": "pass",
      "evidence": "quality gate: baseline defined and meaningfully beaten (or the project rightly stopped) \u2014 the model strictly beats the declared baseline score in the declared metric direction; the skill states no margin above the baseline, so equality does not pass"
    },
    {
      "section": "data_audit_and_leakage",
      "check": "data_provenance_documented",
      "status": "pass",
      "evidence": "data audit: provenance is documented"
    },
    {
      "section": "data_audit_and_leakage",
      "check": "licensing_and_consent_confirmed",
      "status": "pass",
      "evidence": "data audit: licensing and consent are confirmed"
    },
    {
      "section": "data_audit_and_leakage",
      "check": "label_quality_checked",
      "status": "pass",
      "evidence": "data audit: label quality is checked"
    },
    {
      "section": "data_audit_and_leakage",
      "check": "edge_case_coverage_checked",
      "status": "pass",
      "evidence": "data audit: coverage of edge cases is checked"
    },
    {
      "section": "data_audit_and_leakage",
      "check": "leakage_audited",
      "status": "pass",
      "evidence": "data audit: leakage checked (temporal, group, target proxies)"
    },
    {
      "section": "data_audit_and_leakage",
      "check": "no_training_without_rights_or_consent",
      "status": "pass",
      "evidence": "red line: no training on data without rights/consent; PII per the privacy rules"
    },
    {
      "section": "data_audit_and_leakage",
      "check": "splits_by_time_and_group_where_applicable",
      "status": "pass",
      "evidence": "splits by time and group where applicable \u2014 not just random rows: temporal data requires a time split, grouped data requires a group split"
    },
    {
      "section": "model_ladder",
      "check": "baseline_rung_evaluated",
      "status": "pass",
      "evidence": "model ladder: the majority/heuristic rung is evaluated first \u2014 earn complexity"
    },
    {
      "section": "model_ladder",
      "check": "data_and_splits_held_fixed_while_climbing",
      "status": "pass",
      "evidence": "model ladder: climb holding data and splits fixed"
    },
    {
      "section": "model_ladder",
      "check": "complexity_justified_by_evaluation",
      "status": "pass",
      "evidence": "model ladder: climb only when evaluation justifies it"
    },
    {
      "section": "model_ladder",
      "check": "ladder_climbed_in_order",
      "status": "pass",
      "evidence": "model ladder: majority/heuristic -> linear -> boosted trees -> deep \u2014 the rungs evaluated are exactly the ladder prefix up to the selected rung, in order, with no rung skipped, repeated, or evaluated out of order"
    },
    {
      "section": "evaluation_and_honesty",
      "check": "decision_aligned_metrics_used",
      "status": "pass",
      "evidence": "evaluate on decision-aligned metrics: costs of FP / FN, not a generic score"
    },
    {
      "section": "evaluation_and_honesty",
      "check": "slice_performance_reported",
      "status": "pass",
      "evidence": "quality gate: slice performance reported, not aggregate accuracy alone"
    },
    {
      "section": "evaluation_and_honesty",
      "check": "calibration_reported",
      "status": "pass",
      "evidence": "quality gate: calibration reported, not aggregate accuracy alone"
    },
    {
      "section": "evaluation_and_honesty",
      "check": "uncertainty_via_resampling_reported",
      "status": "pass",
      "evidence": "evaluate: uncertainty via resampling is reported"
    },
    {
      "section": "evaluation_and_honesty",
      "check": "conclusion_change_condition_stated",
      "status": "pass",
      "evidence": "evaluate: what would be needed to change the conclusion is reported"
    },
    {
      "section": "evaluation_and_honesty",
      "check": "no_accuracy_only_reporting_where_it_matters",
      "status": "pass",
      "evidence": "problem not declared imbalanced or high-stakes"
    },
    {
      "section": "robustness_and_limits",
      "check": "distribution_shift_evaluated",
      "status": "pass",
      "evidence": "robustness & honesty: distribution shift is evaluated"
    },
    {
      "section": "robustness_and_limits",
      "check": "adversarial_inputs_evaluated",
      "status": "pass",
      "evidence": "robustness & honesty: adversarial inputs are evaluated"
    },
    {
      "section": "robustness_and_limits",
      "check": "known_failure_modes_documented",
      "status": "pass",
      "evidence": "robustness & honesty: known failure modes are documented \u2014 no hiding failure modes"
    },
    {
      "section": "robustness_and_limits",
      "check": "data_limitations_documented",
      "status": "pass",
      "evidence": "robustness & honesty: documented data limitations"
    },
    {
      "section": "robustness_and_limits",
      "check": "no_cherry_picked_examples",
      "status": "pass",
      "evidence": "robustness & honesty: no cherry-picked examples"
    },
    {
      "section": "robustness_and_limits",
      "check": "no_claims_beyond_measured_capability",
      "status": "pass",
      "evidence": "red line: no 'AI' claims beyond measured capability"
    },
    {
      "section": "deployment_monitoring_and_card",
      "check": "data_code_model_versioned_together",
      "status": "pass",
      "evidence": "deploy & monitor: version data+code+model together"
    },
    {
      "section": "deployment_monitoring_and_card",
      "check": "drift_monitoring_planned",
      "status": "pass",
      "evidence": "quality gate: monitoring planned before deployment \u2014 drift is monitored"
    },
    {
      "section": "deployment_monitoring_and_card",
      "check": "live_performance_monitoring_planned",
      "status": "pass",
      "evidence": "deploy & monitor: live performance is monitored"
    },
    {
      "section": "deployment_monitoring_and_card",
      "check": "feedback_loops_monitored",
      "status": "pass",
      "evidence": "deploy & monitor: feedback loops are monitored"
    },
    {
      "section": "deployment_monitoring_and_card",
      "check": "rollback_path_defined",
      "status": "pass",
      "evidence": "quality gate: monitoring + rollback planned before deployment \u2014 a rollback path is defined"
    },
    {
      "section": "deployment_monitoring_and_card",
      "check": "regular_revalidation_planned",
      "status": "pass",
      "evidence": "deploy & monitor: regular re-validation is planned"
    },
    {
      "section": "deployment_monitoring_and_card",
      "check": "model_card_written_and_versioned",
      "status": "pass",
      "evidence": "quality gate: model card written and versioned \u2014 intended use, limits, metrics per slice, training data summary; keep it current"
    }
  ],
  "baseline_improvement": "0.1000",
  "baseline_status": "beaten_on_declared_evidence",
  "selected_rung_index": 1,
  "summary": "35 pass, 0 fail, 0 missing of 35 checks across six sections.",
  "stamp": "APPLIED ML VALIDATION\nmodel: test-model-v1\nVERDICT: VALIDATED\n  framing_and_baseline             pass\n  data_audit_and_leakage           pass\n  model_ladder                     pass\n  evaluation_and_honesty           pass\n  robustness_and_limits            pass\n  deployment_monitoring_and_card   pass\n35 pass, 0 fail, 0 missing of 35 checks across six sections."
}
```

### Example 2 — Violations (recorded case `violations`, HTTP 200)

Input:

```json
{
  "model": "fail-model",
  "framing": {
    "decision_named": true,
    "error_costs_stated": true,
    "alternatives_considered": true
  },
  "baseline": {
    "defined": true,
    "baseline_score": 0.8,
    "model_score": 0.7,
    "metric_direction": "higher_is_better",
    "project_stopped_because_baseline_not_beaten": false
  },
  "data": {
    "provenance_documented": true,
    "licensing_and_consent_confirmed": true,
    "label_quality_checked": true,
    "edge_cases_covered": true,
    "leakage_audited": true,
    "training_without_rights_or_consent": true
  },
  "validation": {
    "temporal_data": true,
    "grouped_data": false,
    "split_type": "random"
  },
  "ladder": {
    "baseline_rung_evaluated": true,
    "data_and_splits_held_fixed": true,
    "complexity_justified_by_evaluation": true,
    "selected_model_rung": "deep",
    "rungs_evaluated": [
      "deep"
    ]
  },
  "evaluation": {
    "decision_aligned_metrics_used": true,
    "slice_performance_reported": true,
    "calibration_reported": true,
    "uncertainty_via_resampling_reported": true,
    "conclusion_change_condition_stated": true,
    "imbalanced_or_high_stakes": true,
    "accuracy_only_reporting": true
  },
  "robustness": {
    "distribution_shift_evaluated": true,
    "adversarial_inputs_evaluated": true,
    "known_failure_modes_documented": true,
    "data_limitations_documented": true,
    "cherry_picked_examples_presented": true,
    "claims_exceed_measured_capability": true
  },
  "deployment": {
    "data_code_model_versioned_together": true,
    "drift_monitoring_planned": true,
    "live_performance_monitoring_planned": true,
    "feedback_loops_monitored": true,
    "rollback_path_defined": true,
    "regular_revalidation_planned": true
  },
  "documentation": {
    "model_card_written_and_versioned": true
  }
}
```

Response (`response_text`):

```json
{
  "service": "applied-ml-validation",
  "atom_version": "0.1.0",
  "model": "fail-model",
  "verdict": "NOT_VALIDATED",
  "sections": {
    "framing_and_baseline": "fail",
    "data_audit_and_leakage": "fail",
    "model_ladder": "fail",
    "evaluation_and_honesty": "fail",
    "robustness_and_limits": "fail",
    "deployment_monitoring_and_card": "pass"
  },
  "checks": [
    {
      "section": "framing_and_baseline",
      "check": "decision_named",
      "status": "pass",
      "evidence": "frame: what decision does the model inform? The decision is named"
    },
    {
      "section": "framing_and_baseline",
      "check": "error_costs_stated",
      "status": "pass",
      "evidence": "frame: what is the cost of each error type? The error costs are stated"
    },
    {
      "section": "framing_and_baseline",
      "check": "simpler_alternatives_considered",
      "status": "pass",
      "evidence": "frame: would rules, a simple regression, or asking a human do better? The simpler alternatives are considered \u2014 baseline first, always"
    },
    {
      "section": "framing_and_baseline",
      "check": "baseline_defined",
      "status": "pass",
      "evidence": "quality gate: baseline defined \u2014 baseline first, always"
    },
    {
      "section": "framing_and_baseline",
      "check": "baseline_meaningfully_beaten_or_project_stopped",
      "status": "fail",
      "evidence": "quality gate: baseline defined and meaningfully beaten (or the project rightly stopped) \u2014 the model strictly beats the declared baseline score in the declared metric direction; the skill states no margin above the baseline, so equality does not pass"
    },
    {
      "section": "data_audit_and_leakage",
      "check": "data_provenance_documented",
      "status": "pass",
      "evidence": "data audit: provenance is documented"
    },
    {
      "section": "data_audit_and_leakage",
      "check": "licensing_and_consent_confirmed",
      "status": "pass",
      "evidence": "data audit: licensing and consent are confirmed"
    },
    {
      "section": "data_audit_and_leakage",
      "check": "label_quality_checked",
      "status": "pass",
      "evidence": "data audit: label quality is checked"
    },
    {
      "section": "data_audit_and_leakage",
      "check": "edge_case_coverage_checked",
      "status": "pass",
      "evidence": "data audit: coverage of edge cases is checked"
    },
    {
      "section": "data_audit_and_leakage",
      "check": "leakage_audited",
      "status": "pass",
      "evidence": "data audit: leakage checked (temporal, group, target proxies)"
    },
    {
      "section": "data_audit_and_leakage",
      "check": "no_training_without_rights_or_consent",
      "status": "fail",
      "evidence": "red line: no training on data without rights/consent; PII per the privacy rules"
    },
    {
      "section": "data_audit_and_leakage",
      "check": "splits_by_time_and_group_where_applicable",
      "status": "fail",
      "evidence": "splits by time and group where applicable \u2014 not just random rows: temporal data requires a time split, grouped data requires a group split"
    },
    {
      "section": "model_ladder",
      "check": "baseline_rung_evaluated",
      "status": "pass",
      "evidence": "model ladder: the majority/heuristic rung is evaluated first \u2014 earn complexity"
    },
    {
      "section": "model_ladder",
      "check": "data_and_splits_held_fixed_while_climbing",
      "status": "pass",
      "evidence": "model ladder: climb holding data and splits fixed"
    },
    {
      "section": "model_ladder",
      "check": "complexity_justified_by_evaluation",
      "status": "pass",
      "evidence": "model ladder: climb only when evaluation justifies it"
    },
    {
      "section": "model_ladder",
      "check": "ladder_climbed_in_order",
      "status": "fail",
      "evidence": "model ladder: majority/heuristic -> linear -> boosted trees -> deep \u2014 the rungs evaluated are exactly the ladder prefix up to the selected rung, in order, with no rung skipped, repeated, or evaluated out of order"
    },
    {
      "section": "evaluation_and_honesty",
      "check": "decision_aligned_metrics_used",
      "status": "pass",
      "evidence": "evaluate on decision-aligned metrics: costs of FP / FN, not a generic score"
    },
    {
      "section": "evaluation_and_honesty",
      "check": "slice_performance_reported",
      "status": "pass",
      "evidence": "quality gate: slice performance reported, not aggregate accuracy alone"
    },
    {
      "section": "evaluation_and_honesty",
      "check": "calibration_reported",
      "status": "pass",
      "evidence": "quality gate: calibration reported, not aggregate accuracy alone"
    },
    {
      "section": "evaluation_and_honesty",
      "check": "uncertainty_via_resampling_reported",
      "status": "pass",
      "evidence": "evaluate: uncertainty via resampling is reported"
    },
    {
      "section": "evaluation_and_honesty",
      "check": "conclusion_change_condition_stated",
      "status": "pass",
      "evidence": "evaluate: what would be needed to change the conclusion is reported"
    },
    {
      "section": "evaluation_and_honesty",
      "check": "no_accuracy_only_reporting_where_it_matters",
      "status": "fail",
      "evidence": "red line: no accuracy-only reporting on imbalanced or high-stakes problems"
    },
    {
      "section": "robustness_and_limits",
      "check": "distribution_shift_evaluated",
      "status": "pass",
      "evidence": "robustness & honesty: distribution shift is evaluated"
    },
    {
      "section": "robustness_and_limits",
      "check": "adversarial_inputs_evaluated",
      "status": "pass",
      "evidence": "robustness & honesty: adversarial inputs are evaluated"
    },
    {
      "section": "robustness_and_limits",
      "check": "known_failure_modes_documented",
      "status": "pass",
      "evidence": "robustness & honesty: known failure modes are documented \u2014 no hiding failure modes"
    },
    {
      "section": "robustness_and_limits",
      "check": "data_limitations_documented",
      "status": "pass",
      "evidence": "robustness & honesty: documented data limitations"
    },
    {
      "section": "robustness_and_limits",
      "check": "no_cherry_picked_examples",
      "status": "fail",
      "evidence": "robustness & honesty: no cherry-picked examples"
    },
    {
      "section": "robustness_and_limits",
      "check": "no_claims_beyond_measured_capability",
      "status": "fail",
      "evidence": "red line: no 'AI' claims beyond measured capability"
    },
    {
      "section": "deployment_monitoring_and_card",
      "check": "data_code_model_versioned_together",
      "status": "pass",
      "evidence": "deploy & monitor: version data+code+model together"
    },
    {
      "section": "deployment_monitoring_and_card",
      "check": "drift_monitoring_planned",
      "status": "pass",
      "evidence": "quality gate: monitoring planned before deployment \u2014 drift is monitored"
    },
    {
      "section": "deployment_monitoring_and_card",
      "check": "live_performance_monitoring_planned",
      "status": "pass",
      "evidence": "deploy & monitor: live performance is monitored"
    },
    {
      "section": "deployment_monitoring_and_card",
      "check": "feedback_loops_monitored",
      "status": "pass",
      "evidence": "deploy & monitor: feedback loops are monitored"
    },
    {
      "section": "deployment_monitoring_and_card",
      "check": "rollback_path_defined",
      "status": "pass",
      "evidence": "quality gate: monitoring + rollback planned before deployment \u2014 a rollback path is defined"
    },
    {
      "section": "deployment_monitoring_and_card",
      "check": "regular_revalidation_planned",
      "status": "pass",
      "evidence": "deploy & monitor: regular re-validation is planned"
    },
    {
      "section": "deployment_monitoring_and_card",
      "check": "model_card_written_and_versioned",
      "status": "pass",
      "evidence": "quality gate: model card written and versioned \u2014 intended use, limits, metrics per slice, training data summary; keep it current"
    }
  ],
  "baseline_improvement": "-0.1000",
  "baseline_status": "not_beaten_on_declared_evidence",
  "selected_rung_index": 3,
  "summary": "28 pass, 7 fail, 0 missing of 35 checks across six sections.",
  "stamp": "APPLIED ML VALIDATION\nmodel: fail-model\nVERDICT: NOT_VALIDATED\n  framing_and_baseline             fail\n  data_audit_and_leakage           fail\n  model_ladder                     fail\n  evaluation_and_honesty           fail\n  robustness_and_limits            fail\n  deployment_monitoring_and_card   pass\n28 pass, 7 fail, 0 missing of 35 checks across six sections."
}
```

### Example 3 — Malformed (recorded case `malformed`, HTTP 422)

Input:

```json
{
  "model": 123,
  "framing": "not-an-object"
}
```

Response (`response_text`):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "model",
  "detail": "model must be a string"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present (tutorial / how-to / reference / explanation) | Yes — all four sections above |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — see checklist note below |
| Checks named: documented vs recorded | 35 / 35 |
| Verdict vocabulary complete | Yes — all overall verdicts, section statuses, per-check statuses, and computed-field values listed |
| Input reference typed | Yes — 38 fields, each with a type |
| Worked examples verbatim-verified | Yes — full-pass / violations / malformed compared as JSON values against `evidence.json` after writing |

Regulators view decision: **N/A** — this atom is an engineering/design review over declared evidence; its verdict is not itself compliance or audit evidence and its domain is not a regulated one (finance, security, licensing, privacy), so no regulator role view is included.
