# Decision process design — documentation

**Decision process design** · slug `decision-process-design` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `decision` "Launch new feature"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "decision-process-design"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the decision-process manifest.** You declare a record of work already done — the atom audits the record, it does not do the work (see Explanation). The recorded full-pass manifest declares the decision `Launch new feature`: the decision is named, the decision-maker identified, the objective stated, and the analyst informs rather than decides (`analysis_makes_the_call_present: false`). It declares two options, `A` and `B`, both viable; one criterion, `C1`, set before the data with a threshold declared; a pre-committed default action `A` — which names a declared option — with a change-my-mind threshold stated and no data seen before the criteria were set. Loss costs are declared in both directions (false action 100, false inaction 50), stakes and reversibility are assessed, exploratory and confirmatory analysis are distinguished (no confirmatory analysis is declared in use, so the pre-registration check passes as not applicable), and the review judges the decision by process and information at the time, not by outcome alone.

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/decision-process-design` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `DECISION_PROCESS_SOUND`: "36 pass, 0 fail, 0 missing of 36 checks across four sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `DECISION_PROCESS_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "decision-process-design"}`.
3. Call: `POST https://atoms.pipavia.com/v1/decision-process-design` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/decision-process-design` with the `Authorization: Bearer <key>` header — the whole MCP surface on this gateway is key-gated, including `initialize` and `tools/list`.
2. Call `tools/call` with tool name `decision_process_design`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `DECISION_PROCESS_NOT_SOUND` means at least one check has status `fail`: a field is present but false/invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 4 checks fail: `every_option_declared_viable`, `no_analysis_makes_the_call`, `default_action_matches_declared_option`, `loss_costs_both_directions_declared`, and the summary reads "32 pass, 4 fail, 0 missing of 36 checks across four sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (see Output format). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where a number, list, object or boolean is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "loss.cost_of_false_action",
  "detail": "loss.cost_of_false_action must be a number"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/decision-process-design` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/decision-process-design` — tool name `decision_process_design`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `decision_process_design` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `DECISION_PROCESS_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below exactly as SERVICE.md groups them — by the section that reads them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `decision` | string | Carried into the verdict output, not itself checked |

#### Read by: framing_and_roles

| Field | Type | Notes |
|---|---|---|
| `framing` | object | The framing section object — a present non-object value is rejected before evaluation |
| `framing.decision_named` | boolean | — |
| `framing.decision_maker_identified` | boolean | — |
| `framing.objective_stated` | boolean | — |
| `framing.decision_maker_defines_what_matters` | boolean | — |
| `framing.analyst_informs_not_decides` | boolean | — |
| `framing.analysis_makes_the_call_present` | boolean | must be `false` to pass — skill anti-pattern |
| `options` | list | list of option-row objects, each `{name, viable}` — see the three entry fields below; computed, see below |
| `options[]` | object | One declared option row — a present non-object entry is rejected before evaluation |
| `options[].name` | string | Names the row in the computed `options_without_*` outputs |
| `options[].viable` | boolean | — |

#### Read by: precommitment_before_data

| Field | Type | Notes |
|---|---|---|
| `criteria` | list | list of criterion-row objects, each `{name, set_before_data, threshold_declared}` — see the four entry fields below; computed, see below |
| `criteria[]` | object | One declared criterion row — a present non-object entry is rejected before evaluation |
| `criteria[].name` | string | Names the row in the computed `criteria_without_*` outputs |
| `criteria[].set_before_data` | boolean | — |
| `criteria[].threshold_declared` | boolean | — |
| `precommitment` | object | The pre-commitment section object — a present non-object value is rejected before evaluation |
| `precommitment.default_action` | string | Must name a declared option for the row to pass the computed matching check — an absent field is missing evidence |
| `precommitment.change_my_mind_threshold_stated` | boolean | — |
| `precommitment.criteria_and_thresholds_set_before_data_seen` | boolean | — |
| `precommitment.data_seen_before_criteria_set_present` | boolean | must be `false` to pass — skill anti-pattern |

#### Read by: loss_stakes_and_rigor

| Field | Type | Notes |
|---|---|---|
| `loss` | object | The loss-function section object — a present non-object value is rejected before evaluation |
| `loss.loss_function_framed` | boolean | — |
| `loss.cost_of_being_wrong_in_each_direction_stated` | boolean | — |
| `loss.cost_of_false_action` | number | Must be present and non-negative, with its pair, for the computed loss-cost check to pass — an absent field is missing evidence |
| `loss.cost_of_false_inaction` | number | Must be present and non-negative, with its pair, for the computed loss-cost check to pass — an absent field is missing evidence |
| `loss.asymmetric_costs_declared` | boolean (gate) | gates the threshold-adjustment check below |
| `loss.threshold_adjusted_for_asymmetric_costs` | boolean | required when asymmetric costs are declared; otherwise the check passes as not applicable |
| `rigor` | object | The rigor section object — a present non-object value is rejected before evaluation |
| `rigor.stakes_assessed` | boolean | — |
| `rigor.reversibility_assessed` | boolean | — |
| `rigor.effort_matched_to_stakes_and_reversibility` | boolean | — |
| `rigor.data_gathering_worth_assessed` | boolean | — |
| `rigor.irreversible_declared` | boolean (gate) | gates the slowed-down check below |
| `rigor.slowed_down_and_more_evidence_for_irreversible` | boolean | required when an irreversible decision is declared; otherwise the check passes as not applicable |
| `rigor.reversible_declared` | boolean (gate) | gates the default-to-action check below |
| `rigor.default_to_action_for_reversible` | boolean | required when a reversible decision is declared; otherwise the check passes as not applicable |

#### Read by: evidence_discipline_and_review

| Field | Type | Notes |
|---|---|---|
| `evidence` | object | The evidence section object — a present non-object value is rejected before evaluation |
| `evidence.exploratory_and_confirmatory_distinguished` | boolean | — |
| `evidence.confirmatory_analysis_used` | boolean (gate) | gates the pre-registration check below |
| `evidence.hypothesis_preregistered` | boolean | required when confirmatory analysis is declared in use; otherwise the check passes as not applicable |
| `evidence.conclusion_drawn_from_inspiring_data_present` | boolean | must be `false` to pass — skill anti-pattern |
| `evidence.evidence_has_power_to_change_decision` | boolean | — |
| `evidence.data_is_decoration_present` | boolean | must be `false` to pass — skill anti-pattern |
| `evidence.acted_per_preset_criteria_after_gathering` | boolean | — |
| `review` | object | The review section object — a present non-object value is rejected before evaluation |
| `review.decision_quality_reviewed_separately_from_outcome` | boolean | — |
| `review.decision_judged_by_process_and_information_at_time` | boolean | — |
| `review.outcome_used_alone_to_judge_present` | boolean | must be `false` to pass — skill anti-pattern |

### Checks

All 36 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only: a conditional (gated) check whose gate is not triggered reports `pass` with evidence stating the gate was not declared — that is the not-applicable outcome. Section and verdict aggregation are defined under Verdict vocabulary.

#### Section: framing_and_roles

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `decision_named` | process checklist step 1: the decision itself is named — what is actually being decided | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `options_declared` | process checklist step 1: the declared record names the real options — the options list is present and non-empty | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_option_named` | process checklist step 1: every declared option row names the option | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_option_declared_viable` | process checklist step 1: every declared option row declares the option viable — a real option, not a straw option | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `decision_maker_identified` | process checklist step 2: the decision-maker is identified | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `objective_stated` | process checklist step 2: what the decision-maker actually cares about — the objective — is stated | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `decision_maker_defines_what_matters` | roles clear: the decision-maker frames the decision and defines what matters and the thresholds | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `analyst_informs_not_decides` | roles clear: the analyst informs the decision — the analyst does not make it | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_analysis_makes_the_call` | roles clear: analysis does not quietly make the call | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
#### Section: precommitment_before_data

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `criteria_declared` | decide how to decide before the data: the declared record names its decision criteria — the criteria list is present and non-empty | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_criterion_named` | decide how to decide before the data: every declared criterion row names the criterion | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_criterion_set_before_data` | decide how to decide before the data: every declared criterion row declares it was set before the data was seen | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_criterion_threshold_declared` | decide how to decide before the data: every declared criterion row declares its threshold | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `default_action_matches_declared_option` | default action: the declared default action names one of the declared real options | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `change_my_mind_threshold_stated` | default action + change-my-mind threshold: exactly what evidence would flip the default is pre-committed, answered before looking | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `criteria_and_thresholds_set_before_data_seen` | decide how to decide before you see the data: the decision criteria, default action and thresholds are set in advance, before the data | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_data_seen_before_precommitment` | decide how to decide before you see the data: the data was not seen before the criteria were set — no post-hoc rationalization | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
#### Section: loss_stakes_and_rigor

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `loss_function_framed` | frame the loss function: what being wrong costs is framed — what actually matters, not a tidy metric | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `cost_of_being_wrong_in_each_direction_stated` | frame the loss function: the cost of being wrong is stated in each direction | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `loss_costs_both_directions_declared` | frame the loss function: a numeric cost is declared for being wrong in each direction — acting wrongly and not acting wrongly | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `threshold_adjusted_when_costs_asymmetric` | no asymmetric costs declared | Conditional on `loss.asymmetric_costs_declared`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the requirement is declared unmet (for per-row gates: a gated row declares it unmet). Missing: the gate is declared and the required field is absent (for per-row gates: absent on a gated row). |
| `stakes_assessed` | right-size the rigor: the stakes are assessed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `reversibility_assessed` | right-size the rigor: reversibility is assessed — two-way-door or one-way-door | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `effort_matched_to_stakes_and_reversibility` | right-size the rigor: effort is matched to stakes and reversibility | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `data_gathering_worth_assessed` | process checklist step 4: how much data and analysis is worth gathering is decided, given stakes and reversibility | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `slowed_down_when_irreversible` | no irreversible decision declared | Conditional on `rigor.irreversible_declared`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the requirement is declared unmet (for per-row gates: a gated row declares it unmet). Missing: the gate is declared and the required field is absent (for per-row gates: absent on a gated row). |
| `default_to_action_when_reversible` | no reversible decision declared | Conditional on `rigor.reversible_declared`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the requirement is declared unmet (for per-row gates: a gated row declares it unmet). Missing: the gate is declared and the required field is absent (for per-row gates: absent on a gated row). |
#### Section: evidence_discipline_and_review

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `exploratory_and_confirmatory_distinguished` | data-driven vs data-inspired: exploratory analysis, which generates hypotheses, is distinguished from confirmatory analysis, which tests a pre-registered hypothesis | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `hypothesis_preregistered_when_confirmatory` | no confirmatory analysis declared in use | Conditional on `evidence.confirmatory_analysis_used`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the requirement is declared unmet (for per-row gates: a gated row declares it unmet). Missing: the gate is declared and the required field is absent (for per-row gates: absent on a gated row). |
| `no_conclusion_from_inspiring_data` | data-driven vs data-inspired: no conclusion is drawn from the same data that inspired it | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `evidence_has_power_to_change_decision` | do not be a data-driven fool: the evidence has the power to change the decision — some possible data could change the action | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_data_decoration` | do not be a data-driven fool: the data is not decoration — it is not gathered when no possible data could change the action | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `acted_per_preset_criteria_after_gathering` | process checklist step 5: after gathering, the action is taken per the pre-set criteria | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `decision_quality_reviewed_separately_from_outcome` | process checklist step 6: decision quality is reviewed separately from the outcome | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `decision_judged_by_process_and_information_at_time` | decisions are not outcomes: the decision is judged by the process and the information available at the time | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_outcome_alone_judgment` | decisions are not outcomes: the outcome alone is not used to judge the decision — no resulting or outcome bias | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"decision-process-design"`), `atom_version` (`"0.1.0"`), and `decision` (the manifest's declared title value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `options_count` and `criteria_count` (declared list lengths as integers, or null when the list is not declared); the row-name lists `options_without_name`, `options_not_declared_viable`, `criteria_without_name`, `criteria_not_set_before_data` and `criteria_without_threshold` (null when the underlying list is not declared); `default_action` (the declared string, or null); the ratios `option_name_coverage`, `criterion_set_before_data_coverage`, `criterion_threshold_coverage` and `loss_cost_ratio` (strings with exactly four decimal places; a coverage is null when its denominator list is absent or empty, and `loss_cost_ratio` is null when either cost is absent or `cost_of_false_inaction` is zero); and `computed_status` (see Verdict vocabulary). Ratios use the fixed serialization rule — round half up to 4dp, `floor(v * 10000 + 0.5) / 10000`, formatted with exactly four decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "36 pass, 0 fail, 0 missing of 36 checks across four sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared title value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `DECISION_PROCESS_SOUND` — all 36 checks pass: the declared record is complete and consistent with the bound skill's checklist, gates and red lines.
- `DECISION_PROCESS_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one primary computed check cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes (including gated checks passing as not applicable); `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence (for gated checks: met, or the gate was not triggered — not applicable); `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

### Errors

Error bodies are the gateway's recorded shapes (`rails/gateway/src/callpath.ts`); a failed call is not metered.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | No key, or the key does not verify. On the MCP face the body is `{"error": "missing or invalid gateway API key"}`. |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the decision_process_design scope; issue it for this atom first"}` | The key is valid but does not hold this atom's scope. Issue the key for this atom (see How-to) and retry. On the MCP face the body is `{"error": "this key does not hold the decision_process_design scope"}`. |
| 422 | `{"ok":false,"error":"invalid_input","field":"loss.cost_of_false_action","detail":"loss.cost_of_false_action must be a number"}` (this atom's recorded malformed run; the shape is `{"ok": false, "error": "invalid_input", "field": "<field>", "detail": "<field> must be a <type>"}`) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. Via MCP `tools/call`, the same failure surfaces as a JSON-RPC error with code `-32602` carrying the detail message. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for decision-process-design exceeded"}` (or the `10000/day` variant) | Per-key rate limit exceeded for this atom; the call is not metered. Via MCP `tools/call` it surfaces as a JSON-RPC error with code `-32029`. |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Engineers the decision itself — what is actually being decided, what would change the answer, and how you will know if it worked (Cassie Kozyrkov's discipline, as bound from the `decision-intelligence` skill). You submit one declared record — the decision-process manifest — and the atom audits that record for completeness and internal consistency against the bound skill's checklist, quality gates and red lines, returning one deterministic verdict across 4 sections (`framing_and_roles`, `precommitment_before_data`, `loss_stakes_and_rigor`, `evidence_discipline_and_review`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — list presence, per-row completeness, cross-row consistency and, where the skill states them, its own arithmetic — using only the declared record, with no outside threshold imported. *Conditional checks* bind only when their declared gate field says the situation applies; when the gate is not triggered they pass as not applicable, and their evidence text says so. Aggregation is strict: any `fail` anywhere produces `DECISION_PROCESS_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `DECISION_PROCESS_SOUND`. The central semantic is the absent/false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented: no minimum option count of two or more (the skill says "the real options" but states no number, so only present-and-non-empty is checked), no minimum or maximum criterion count, no loss-cost amount cap, no `loss_cost_ratio` trigger or band (the ratio is reported, never judged — the threshold-adjustment gate is the caller's asymmetry declaration), no numeric stakes level, no numeric amount of data or analysis worth gathering, no time limit for deciding fast or slowing down, no value for any criterion or change-my-mind threshold, and no reversibility vocabulary beyond the two gate booleans.

**What it does NOT do.** The atom audits a **declared** record: a verdict of `DECISION_PROCESS_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a manifest that declares the required acts passes those checks even if the real work did none of it. It is a completeness and consistency audit, not a certification of the underlying work. Specifically: it makes no decision, frames no decision for the caller, gathers or analyses no data, and sets no criteria or thresholds. It does not verify that a declared pre-commitment actually happened when declared: whether criteria and thresholds were *actually* set before the data was seen is attested in the record, never timestamp-verified. It never judges whether the decision is the right one, whether the named options are the genuinely real ones, whether the objective is the right objective, or whether the declared thresholds are well-chosen. The content and quality of the framing, the objective and the loss function, the genuine viability of an option, what any threshold value should be, whether roles were kept in practice, and the quality of the post-decision review are caller declarations only. No loss-cost currency or unit is imposed — the two costs are the caller's own numbers in the caller's own unit, and only their ratio is computed. No data, evidence or analysis is read, and no declared fact is live-verified.

**Buyer and use context.** Teams and agents working in Thinking & decisions who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: product decision framing work. Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulator view: N/A — this atom audits a declared decision-process record; its verdict is a process-completeness judgment, not compliance or audit evidence, and decision process design is not a regulated domain. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `decision_process_design` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly four decimal places under the fixed rule `floor(v * 10000 + 0.5) / 10000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/decision_process_design.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_decision_process_design.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/decision-process-design` (REST) and `POST /mcp/decision-process-design` (MCP, tool `decision_process_design`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification. Key scope: `decision_process_design`. Rate limits: 60/minute, 10,000/day per key per atom (429 `rate_limit`, not metered). Error monitoring: watch 401 `unauthorized` (key problems), 403 `scope_required` (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live — release candidate, one-week RC soak to 2026-11-22; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Worked examples

Provenance: recorded 2026-11-16T03:28:08.284482+00:00 against gateway v1.1.0, external verification lane, source `verification/work/decision-process-design/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Input:

```json
{
  "decision": "Launch new feature",
  "framing": {
    "decision_named": true,
    "decision_maker_identified": true,
    "objective_stated": true,
    "decision_maker_defines_what_matters": true,
    "analyst_informs_not_decides": true,
    "analysis_makes_the_call_present": false
  },
  "options": [
    {
      "name": "A",
      "viable": true
    },
    {
      "name": "B",
      "viable": true
    }
  ],
  "criteria": [
    {
      "name": "C1",
      "set_before_data": true,
      "threshold_declared": true
    }
  ],
  "precommitment": {
    "default_action": "A",
    "change_my_mind_threshold_stated": true,
    "criteria_and_thresholds_set_before_data_seen": true,
    "data_seen_before_criteria_set_present": false
  },
  "loss": {
    "loss_function_framed": true,
    "cost_of_being_wrong_in_each_direction_stated": true,
    "cost_of_false_action": 100,
    "cost_of_false_inaction": 50,
    "asymmetric_costs_declared": false
  },
  "rigor": {
    "stakes_assessed": true,
    "reversibility_assessed": true,
    "effort_matched_to_stakes_and_reversibility": true,
    "data_gathering_worth_assessed": true,
    "irreversible_declared": false,
    "reversible_declared": false
  },
  "evidence": {
    "exploratory_and_confirmatory_distinguished": true,
    "confirmatory_analysis_used": false,
    "conclusion_drawn_from_inspiring_data_present": false,
    "evidence_has_power_to_change_decision": true,
    "data_is_decoration_present": false,
    "acted_per_preset_criteria_after_gathering": true
  },
  "review": {
    "decision_quality_reviewed_separately_from_outcome": true,
    "decision_judged_by_process_and_information_at_time": true,
    "outcome_used_alone_to_judge_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "decision-process-design",
  "atom_version": "0.1.0",
  "decision": "Launch new feature",
  "verdict": "DECISION_PROCESS_SOUND",
  "sections": {
    "framing_and_roles": "pass",
    "precommitment_before_data": "pass",
    "loss_stakes_and_rigor": "pass",
    "evidence_discipline_and_review": "pass"
  },
  "checks": [
    {
      "section": "framing_and_roles",
      "check": "decision_named",
      "status": "pass",
      "evidence": "process checklist step 1: the decision itself is named \u2014 what is actually being decided"
    },
    {
      "section": "framing_and_roles",
      "check": "options_declared",
      "status": "pass",
      "evidence": "process checklist step 1: the declared record names the real options \u2014 the options list is present and non-empty"
    },
    {
      "section": "framing_and_roles",
      "check": "every_option_named",
      "status": "pass",
      "evidence": "process checklist step 1: every declared option row names the option"
    },
    {
      "section": "framing_and_roles",
      "check": "every_option_declared_viable",
      "status": "pass",
      "evidence": "process checklist step 1: every declared option row declares the option viable \u2014 a real option, not a straw option"
    },
    {
      "section": "framing_and_roles",
      "check": "decision_maker_identified",
      "status": "pass",
      "evidence": "process checklist step 2: the decision-maker is identified"
    },
    {
      "section": "framing_and_roles",
      "check": "objective_stated",
      "status": "pass",
      "evidence": "process checklist step 2: what the decision-maker actually cares about \u2014 the objective \u2014 is stated"
    },
    {
      "section": "framing_and_roles",
      "check": "decision_maker_defines_what_matters",
      "status": "pass",
      "evidence": "roles clear: the decision-maker frames the decision and defines what matters and the thresholds"
    },
    {
      "section": "framing_and_roles",
      "check": "analyst_informs_not_decides",
      "status": "pass",
      "evidence": "roles clear: the analyst informs the decision \u2014 the analyst does not make it"
    },
    {
      "section": "framing_and_roles",
      "check": "no_analysis_makes_the_call",
      "status": "pass",
      "evidence": "roles clear: analysis does not quietly make the call"
    },
    {
      "section": "precommitment_before_data",
      "check": "criteria_declared",
      "status": "pass",
      "evidence": "decide how to decide before the data: the declared record names its decision criteria \u2014 the criteria list is present and non-empty"
    },
    {
      "section": "precommitment_before_data",
      "check": "every_criterion_named",
      "status": "pass",
      "evidence": "decide how to decide before the data: every declared criterion row names the criterion"
    },
    {
      "section": "precommitment_before_data",
      "check": "every_criterion_set_before_data",
      "status": "pass",
      "evidence": "decide how to decide before the data: every declared criterion row declares it was set before the data was seen"
    },
    {
      "section": "precommitment_before_data",
      "check": "every_criterion_threshold_declared",
      "status": "pass",
      "evidence": "decide how to decide before the data: every declared criterion row declares its threshold"
    },
    {
      "section": "precommitment_before_data",
      "check": "default_action_matches_declared_option",
      "status": "pass",
      "evidence": "default action: the declared default action names one of the declared real options"
    },
    {
      "section": "precommitment_before_data",
      "check": "change_my_mind_threshold_stated",
      "status": "pass",
      "evidence": "default action + change-my-mind threshold: exactly what evidence would flip the default is pre-committed, answered before looking"
    },
    {
      "section": "precommitment_before_data",
      "check": "criteria_and_thresholds_set_before_data_seen",
      "status": "pass",
      "evidence": "decide how to decide before you see the data: the decision criteria, default action and thresholds are set in advance, before the data"
    },
    {
      "section": "precommitment_before_data",
      "check": "no_data_seen_before_precommitment",
      "status": "pass",
      "evidence": "decide how to decide before you see the data: the data was not seen before the criteria were set \u2014 no post-hoc rationalization"
    },
    {
      "section": "loss_stakes_and_rigor",
      "check": "loss_function_framed",
      "status": "pass",
      "evidence": "frame the loss function: what being wrong costs is framed \u2014 what actually matters, not a tidy metric"
    },
    {
      "section": "loss_stakes_and_rigor",
      "check": "cost_of_being_wrong_in_each_direction_stated",
      "status": "pass",
      "evidence": "frame the loss function: the cost of being wrong is stated in each direction"
    },
    {
      "section": "loss_stakes_and_rigor",
      "check": "loss_costs_both_directions_declared",
      "status": "pass",
      "evidence": "frame the loss function: a numeric cost is declared for being wrong in each direction \u2014 acting wrongly and not acting wrongly"
    },
    {
      "section": "loss_stakes_and_rigor",
      "check": "threshold_adjusted_when_costs_asymmetric",
      "status": "pass",
      "evidence": "no asymmetric costs declared"
    },
    {
      "section": "loss_stakes_and_rigor",
      "check": "stakes_assessed",
      "status": "pass",
      "evidence": "right-size the rigor: the stakes are assessed"
    },
    {
      "section": "loss_stakes_and_rigor",
      "check": "reversibility_assessed",
      "status": "pass",
      "evidence": "right-size the rigor: reversibility is assessed \u2014 two-way-door or one-way-door"
    },
    {
      "section": "loss_stakes_and_rigor",
      "check": "effort_matched_to_stakes_and_reversibility",
      "status": "pass",
      "evidence": "right-size the rigor: effort is matched to stakes and reversibility"
    },
    {
      "section": "loss_stakes_and_rigor",
      "check": "data_gathering_worth_assessed",
      "status": "pass",
      "evidence": "process checklist step 4: how much data and analysis is worth gathering is decided, given stakes and reversibility"
    },
    {
      "section": "loss_stakes_and_rigor",
      "check": "slowed_down_when_irreversible",
      "status": "pass",
      "evidence": "no irreversible decision declared"
    },
    {
      "section": "loss_stakes_and_rigor",
      "check": "default_to_action_when_reversible",
      "status": "pass",
      "evidence": "no reversible decision declared"
    },
    {
      "section": "evidence_discipline_and_review",
      "check": "exploratory_and_confirmatory_distinguished",
      "status": "pass",
      "evidence": "data-driven vs data-inspired: exploratory analysis, which generates hypotheses, is distinguished from confirmatory analysis, which tests a pre-registered hypothesis"
    },
    {
      "section": "evidence_discipline_and_review",
      "check": "hypothesis_preregistered_when_confirmatory",
      "status": "pass",
      "evidence": "no confirmatory analysis declared in use"
    },
    {
      "section": "evidence_discipline_and_review",
      "check": "no_conclusion_from_inspiring_data",
      "status": "pass",
      "evidence": "data-driven vs data-inspired: no conclusion is drawn from the same data that inspired it"
    },
    {
      "section": "evidence_discipline_and_review",
      "check": "evidence_has_power_to_change_decision",
      "status": "pass",
      "evidence": "do not be a data-driven fool: the evidence has the power to change the decision \u2014 some possible data could change the action"
    },
    {
      "section": "evidence_discipline_and_review",
      "check": "no_data_decoration",
      "status": "pass",
      "evidence": "do not be a data-driven fool: the data is not decoration \u2014 it is not gathered when no possible data could change the action"
    },
    {
      "section": "evidence_discipline_and_review",
      "check": "acted_per_preset_criteria_after_gathering",
      "status": "pass",
      "evidence": "process checklist step 5: after gathering, the action is taken per the pre-set criteria"
    },
    {
      "section": "evidence_discipline_and_review",
      "check": "decision_quality_reviewed_separately_from_outcome",
      "status": "pass",
      "evidence": "process checklist step 6: decision quality is reviewed separately from the outcome"
    },
    {
      "section": "evidence_discipline_and_review",
      "check": "decision_judged_by_process_and_information_at_time",
      "status": "pass",
      "evidence": "decisions are not outcomes: the decision is judged by the process and the information available at the time"
    },
    {
      "section": "evidence_discipline_and_review",
      "check": "no_outcome_alone_judgment",
      "status": "pass",
      "evidence": "decisions are not outcomes: the outcome alone is not used to judge the decision \u2014 no resulting or outcome bias"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "options_count": 2,
  "options_without_name": [],
  "options_not_declared_viable": [],
  "option_name_coverage": "1.0000",
  "criteria_count": 1,
  "criteria_without_name": [],
  "criteria_not_set_before_data": [],
  "criteria_without_threshold": [],
  "criterion_set_before_data_coverage": "1.0000",
  "criterion_threshold_coverage": "1.0000",
  "default_action": "A",
  "loss_cost_ratio": "2.0000",
  "summary": "36 pass, 0 fail, 0 missing of 36 checks across four sections.",
  "stamp": "DECISION PROCESS DESIGN\ndecision: Launch new feature\nVERDICT: DECISION_PROCESS_SOUND\n  framing_and_roles                    pass\n  precommitment_before_data            pass\n  loss_stakes_and_rigor                pass\n  evidence_discipline_and_review       pass\n36 pass, 0 fail, 0 missing of 36 checks across four sections."
}
```

### Example 2 — Violations (case `violations`)

Input:

```json
{
  "decision": "Launch new feature",
  "framing": {
    "decision_named": true,
    "decision_maker_identified": true,
    "objective_stated": true,
    "decision_maker_defines_what_matters": true,
    "analyst_informs_not_decides": true,
    "analysis_makes_the_call_present": true
  },
  "options": [
    {
      "name": "A",
      "viable": false
    },
    {
      "name": "B",
      "viable": true
    }
  ],
  "criteria": [
    {
      "name": "C1",
      "set_before_data": true,
      "threshold_declared": true
    }
  ],
  "precommitment": {
    "default_action": "NonExistentOption",
    "change_my_mind_threshold_stated": true,
    "criteria_and_thresholds_set_before_data_seen": true,
    "data_seen_before_criteria_set_present": false
  },
  "loss": {
    "loss_function_framed": true,
    "cost_of_being_wrong_in_each_direction_stated": true,
    "cost_of_false_action": -10,
    "cost_of_false_inaction": 50,
    "asymmetric_costs_declared": false
  },
  "rigor": {
    "stakes_assessed": true,
    "reversibility_assessed": true,
    "effort_matched_to_stakes_and_reversibility": true,
    "data_gathering_worth_assessed": true,
    "irreversible_declared": false,
    "reversible_declared": false
  },
  "evidence": {
    "exploratory_and_confirmatory_distinguished": true,
    "confirmatory_analysis_used": false,
    "conclusion_drawn_from_inspiring_data_present": false,
    "evidence_has_power_to_change_decision": true,
    "data_is_decoration_present": false,
    "acted_per_preset_criteria_after_gathering": true
  },
  "review": {
    "decision_quality_reviewed_separately_from_outcome": true,
    "decision_judged_by_process_and_information_at_time": true,
    "outcome_used_alone_to_judge_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "decision-process-design",
  "atom_version": "0.1.0",
  "decision": "Launch new feature",
  "verdict": "DECISION_PROCESS_NOT_SOUND",
  "sections": {
    "framing_and_roles": "fail",
    "precommitment_before_data": "fail",
    "loss_stakes_and_rigor": "fail",
    "evidence_discipline_and_review": "pass"
  },
  "checks": [
    {
      "section": "framing_and_roles",
      "check": "decision_named",
      "status": "pass",
      "evidence": "process checklist step 1: the decision itself is named \u2014 what is actually being decided"
    },
    {
      "section": "framing_and_roles",
      "check": "options_declared",
      "status": "pass",
      "evidence": "process checklist step 1: the declared record names the real options \u2014 the options list is present and non-empty"
    },
    {
      "section": "framing_and_roles",
      "check": "every_option_named",
      "status": "pass",
      "evidence": "process checklist step 1: every declared option row names the option"
    },
    {
      "section": "framing_and_roles",
      "check": "every_option_declared_viable",
      "status": "fail",
      "evidence": "process checklist step 1: every declared option row declares the option viable \u2014 a real option, not a straw option"
    },
    {
      "section": "framing_and_roles",
      "check": "decision_maker_identified",
      "status": "pass",
      "evidence": "process checklist step 2: the decision-maker is identified"
    },
    {
      "section": "framing_and_roles",
      "check": "objective_stated",
      "status": "pass",
      "evidence": "process checklist step 2: what the decision-maker actually cares about \u2014 the objective \u2014 is stated"
    },
    {
      "section": "framing_and_roles",
      "check": "decision_maker_defines_what_matters",
      "status": "pass",
      "evidence": "roles clear: the decision-maker frames the decision and defines what matters and the thresholds"
    },
    {
      "section": "framing_and_roles",
      "check": "analyst_informs_not_decides",
      "status": "pass",
      "evidence": "roles clear: the analyst informs the decision \u2014 the analyst does not make it"
    },
    {
      "section": "framing_and_roles",
      "check": "no_analysis_makes_the_call",
      "status": "fail",
      "evidence": "roles clear: analysis does not quietly make the call"
    },
    {
      "section": "precommitment_before_data",
      "check": "criteria_declared",
      "status": "pass",
      "evidence": "decide how to decide before the data: the declared record names its decision criteria \u2014 the criteria list is present and non-empty"
    },
    {
      "section": "precommitment_before_data",
      "check": "every_criterion_named",
      "status": "pass",
      "evidence": "decide how to decide before the data: every declared criterion row names the criterion"
    },
    {
      "section": "precommitment_before_data",
      "check": "every_criterion_set_before_data",
      "status": "pass",
      "evidence": "decide how to decide before the data: every declared criterion row declares it was set before the data was seen"
    },
    {
      "section": "precommitment_before_data",
      "check": "every_criterion_threshold_declared",
      "status": "pass",
      "evidence": "decide how to decide before the data: every declared criterion row declares its threshold"
    },
    {
      "section": "precommitment_before_data",
      "check": "default_action_matches_declared_option",
      "status": "fail",
      "evidence": "default action: the declared default action names one of the declared real options"
    },
    {
      "section": "precommitment_before_data",
      "check": "change_my_mind_threshold_stated",
      "status": "pass",
      "evidence": "default action + change-my-mind threshold: exactly what evidence would flip the default is pre-committed, answered before looking"
    },
    {
      "section": "precommitment_before_data",
      "check": "criteria_and_thresholds_set_before_data_seen",
      "status": "pass",
      "evidence": "decide how to decide before you see the data: the decision criteria, default action and thresholds are set in advance, before the data"
    },
    {
      "section": "precommitment_before_data",
      "check": "no_data_seen_before_precommitment",
      "status": "pass",
      "evidence": "decide how to decide before you see the data: the data was not seen before the criteria were set \u2014 no post-hoc rationalization"
    },
    {
      "section": "loss_stakes_and_rigor",
      "check": "loss_function_framed",
      "status": "pass",
      "evidence": "frame the loss function: what being wrong costs is framed \u2014 what actually matters, not a tidy metric"
    },
    {
      "section": "loss_stakes_and_rigor",
      "check": "cost_of_being_wrong_in_each_direction_stated",
      "status": "pass",
      "evidence": "frame the loss function: the cost of being wrong is stated in each direction"
    },
    {
      "section": "loss_stakes_and_rigor",
      "check": "loss_costs_both_directions_declared",
      "status": "fail",
      "evidence": "frame the loss function: a numeric cost is declared for being wrong in each direction \u2014 acting wrongly and not acting wrongly"
    },
    {
      "section": "loss_stakes_and_rigor",
      "check": "threshold_adjusted_when_costs_asymmetric",
      "status": "pass",
      "evidence": "no asymmetric costs declared"
    },
    {
      "section": "loss_stakes_and_rigor",
      "check": "stakes_assessed",
      "status": "pass",
      "evidence": "right-size the rigor: the stakes are assessed"
    },
    {
      "section": "loss_stakes_and_rigor",
      "check": "reversibility_assessed",
      "status": "pass",
      "evidence": "right-size the rigor: reversibility is assessed \u2014 two-way-door or one-way-door"
    },
    {
      "section": "loss_stakes_and_rigor",
      "check": "effort_matched_to_stakes_and_reversibility",
      "status": "pass",
      "evidence": "right-size the rigor: effort is matched to stakes and reversibility"
    },
    {
      "section": "loss_stakes_and_rigor",
      "check": "data_gathering_worth_assessed",
      "status": "pass",
      "evidence": "process checklist step 4: how much data and analysis is worth gathering is decided, given stakes and reversibility"
    },
    {
      "section": "loss_stakes_and_rigor",
      "check": "slowed_down_when_irreversible",
      "status": "pass",
      "evidence": "no irreversible decision declared"
    },
    {
      "section": "loss_stakes_and_rigor",
      "check": "default_to_action_when_reversible",
      "status": "pass",
      "evidence": "no reversible decision declared"
    },
    {
      "section": "evidence_discipline_and_review",
      "check": "exploratory_and_confirmatory_distinguished",
      "status": "pass",
      "evidence": "data-driven vs data-inspired: exploratory analysis, which generates hypotheses, is distinguished from confirmatory analysis, which tests a pre-registered hypothesis"
    },
    {
      "section": "evidence_discipline_and_review",
      "check": "hypothesis_preregistered_when_confirmatory",
      "status": "pass",
      "evidence": "no confirmatory analysis declared in use"
    },
    {
      "section": "evidence_discipline_and_review",
      "check": "no_conclusion_from_inspiring_data",
      "status": "pass",
      "evidence": "data-driven vs data-inspired: no conclusion is drawn from the same data that inspired it"
    },
    {
      "section": "evidence_discipline_and_review",
      "check": "evidence_has_power_to_change_decision",
      "status": "pass",
      "evidence": "do not be a data-driven fool: the evidence has the power to change the decision \u2014 some possible data could change the action"
    },
    {
      "section": "evidence_discipline_and_review",
      "check": "no_data_decoration",
      "status": "pass",
      "evidence": "do not be a data-driven fool: the data is not decoration \u2014 it is not gathered when no possible data could change the action"
    },
    {
      "section": "evidence_discipline_and_review",
      "check": "acted_per_preset_criteria_after_gathering",
      "status": "pass",
      "evidence": "process checklist step 5: after gathering, the action is taken per the pre-set criteria"
    },
    {
      "section": "evidence_discipline_and_review",
      "check": "decision_quality_reviewed_separately_from_outcome",
      "status": "pass",
      "evidence": "process checklist step 6: decision quality is reviewed separately from the outcome"
    },
    {
      "section": "evidence_discipline_and_review",
      "check": "decision_judged_by_process_and_information_at_time",
      "status": "pass",
      "evidence": "decisions are not outcomes: the decision is judged by the process and the information available at the time"
    },
    {
      "section": "evidence_discipline_and_review",
      "check": "no_outcome_alone_judgment",
      "status": "pass",
      "evidence": "decisions are not outcomes: the outcome alone is not used to judge the decision \u2014 no resulting or outcome bias"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "options_count": 2,
  "options_without_name": [],
  "options_not_declared_viable": [
    "A"
  ],
  "option_name_coverage": "1.0000",
  "criteria_count": 1,
  "criteria_without_name": [],
  "criteria_not_set_before_data": [],
  "criteria_without_threshold": [],
  "criterion_set_before_data_coverage": "1.0000",
  "criterion_threshold_coverage": "1.0000",
  "default_action": "NonExistentOption",
  "loss_cost_ratio": "-0.2000",
  "summary": "32 pass, 4 fail, 0 missing of 36 checks across four sections.",
  "stamp": "DECISION PROCESS DESIGN\ndecision: Launch new feature\nVERDICT: DECISION_PROCESS_NOT_SOUND\n  framing_and_roles                    fail\n  precommitment_before_data            fail\n  loss_stakes_and_rigor                fail\n  evidence_discipline_and_review       pass\n32 pass, 4 fail, 0 missing of 36 checks across four sections."
}
```

### Example 3 — Malformed (case `malformed`)

Input:

```json
{
  "decision": "Malformed-Input",
  "loss": {
    "cost_of_false_action": "should-be-a-number"
  }
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "loss.cost_of_false_action",
  "detail": "loss.cost_of_false_action must be a number"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — N/A — this atom audits a declared decision-process record; its verdict is a process-completeness judgment, not compliance or audit evidence, and decision process design is not a regulated domain. |
| Checks named | 36 documented / 36 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses (not-applicable expressed as a gated `pass`) |
| Input reference typed | Yes — 50 fields, each with its type from SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/decision-process-design/evidence.json` |
