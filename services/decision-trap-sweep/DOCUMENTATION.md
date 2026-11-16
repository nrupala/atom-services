# Decision-trap sweep — full documentation

**Decision-trap sweep** · slug `decision-trap-sweep` · deliverable type: DELIVERABLE · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

This document follows the house documentation standard (Diátaxis architecture — tutorial / how-to / reference / explanation — in CommonMark, with role views per audience). All worked examples are real recorded trial runs, reproduced verbatim (see the provenance line under Worked examples).

## Tutorial — your first call, step by step

This tutorial walks through the recorded full-pass trial run for this atom — the same run reproduced verbatim under Worked examples. You submit one JSON manifest and receive one deliverable back.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "decision-trap-sweep"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the manifest.** The manifest names the decision under review (`decision: "Migrate database to cloud"`) and declares the evidence the atom checks, field by field (the full typed field list is under Reference — Input reference). The record frames the decision and classifies it `irreversible` (`framing.*`), offers three options including the status quo and a smaller reversible step (`options.*`), fixes criteria and weights before scoring (`criteria.*`), names an evaluation method with expected value used because probabilities are estimable (`evaluation.*`), records a conducted pre-mortem with top risks hedged for a material decision (`premortem.*`), declares the decision was not made in a rush or a mood (`rush.*` — both `false`, as an irreversible decision requires), and logs the choice, rationale, assumptions, review date and communication (`log.*`).

**Step 3 — Call the REST endpoint.** `POST https://atoms.pipavia.com/v1/decision-trap-sweep` with the manifest as the JSON body and your `Authorization` header. The recorded call returned HTTP 200.

**Step 4 — Read the verdict.** The response `verdict` is `TRAP_CLEAR` and every section — `framing_and_classification`, `options`, `criteria_before_evaluation`, `evaluation_and_uncertainty`, `pre_mortem`, `rush_and_mood_trap`, `decision_log_and_review` — reports `pass`. The `summary` line reconciles the run: "24 pass, 0 fail, 0 missing of 24 checks across seven sections." Each entry in `checks` names its section, the check, its status and the evidence standard it was judged against, and the response closes with a text `stamp` of the verdict you can file as-is.

**Step 5 — File or act on the result.** Keep the full JSON response (and its `stamp`) with the work it judges: it is the deliverable — one unit of sale = one delivered result. To see how the same atom responds when the evidence is not in order, compare the violations and malformed worked examples below before your first production call.

## How-to guides

### How to get a key and call via REST

1. `POST https://atoms.pipavia.com/v1/signup` with your email — a sign-in link is emailed to you.
2. Open the link (it mints your session), then `POST /v1/keys` with `{"atom": "decision-trap-sweep"}` to grant this atom's scope on your gateway key.
3. Call `POST https://atoms.pipavia.com/v1/decision-trap-sweep` with the manifest as the JSON body and header `Authorization: Bearer <key>`.
4. HTTP 200 returns the deliverable JSON (see Reference — Output format). Errors are HTTP 401 / 403 / 422 / 429 (see Reference — Errors). Rate limit: 60 requests/minute and 10,000 requests/day per key.

### How to call via MCP

Call `POST https://atoms.pipavia.com/mcp/decision-trap-sweep` and invoke the tool `decision_trap_sweep` (`tools/call`), passing the manifest object as the tool arguments, with the same `Authorization: Bearer <key>` header. The MCP face returns the same deliverable core as REST — the recorded verification battery confirmed face parity: the MCP `structuredContent` is deep-equal to the REST artifact for the full-pass case (see TEST-REPORT.md).

### How to read a failing verdict and fix the manifest

A failing verdict is `TRAPS_PRESENT`. Do not read the verdict alone — read the `checks` array:

1. Find every check with status `fail`. Its `section` tells you which part of the manifest to fix and its `evidence` states the standard it failed.
2. In the recorded violations run (Worked examples, example 2) the verdict was `TRAPS_PRESENT` and the failing checks were: `irreversible_decision_not_made_in_rush` (section `rush_and_mood_trap`); `irreversible_decision_not_made_in_a_mood` (section `rush_and_mood_trap`).
3. Distinguish `fail` from `missing`: `fail` means you declared evidence and it does not satisfy the check — change the underlying facts or correct the declaration. `missing` means the field is absent — supply it. A response with only `missing` checks and no `fail` returns `INSUFFICIENT_EVIDENCE`, not the failing verdict.

An irreversible decision made in a rush or a mood is the trap itself: slow the decision down until `rush.made_in_rush` and `rush.made_in_a_mood` can truthfully be declared `false`, then resubmit the corrected record. Editing the flags without changing the circumstances would falsify the record — the sweep judges the record you declare, so fix the decision process first and the declaration second.

### How to handle a 422 `invalid_input`

A type-violating manifest is rejected before any evaluation — HTTP 422, never a verdict. The recorded malformed run for this atom returned:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "framing.classification",
  "detail": "framing.classification must be a string"
}
```

Read `field` first: it names the first offending field (`framing.classification`), and `detail` states the expected type ("framing.classification must be a string"). Fix that field's type in your manifest and resubmit; if the manifest has more than one type violation, the gateway reports them one at a time, so repeat until the call returns HTTP 200. The full recorded malformed request and response are Worked examples, example 3.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/decision-trap-sweep` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/decision-trap-sweep` — tool name `decision_trap_sweep`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Gateway:** https://atoms.pipavia.com, gateway version 1.1.0 at the recorded verification run.

### Input reference

The caller submits one JSON manifest. Every field below is read by the named section's checks. All fields are booleans unless a type is noted. A field **absent** = evidence missing; a field present but false / invalid = the check fails. Types are from SERVICE.md's field table; the contract and the evidence `inputSchema` corroborate them.

| Field | Type | Read by | Notes |
|---|---|---|---|
| `decision` | string | — | string; carried into the verdict output, not itself checked |
| `framing.decision_stated` | boolean | framing_and_classification |  |
| `framing.decide_by_named` | boolean | framing_and_classification |  |
| `framing.constraints_named` | boolean | framing_and_classification |  |
| `framing.out_of_scope_named` | boolean | framing_and_classification |  |
| `framing.classification` | string | framing_and_classification | string: `reversible` or `irreversible`; any other value fails, and it gates the rush/mood checks below |
| `framing.stakes_assessed` | boolean | framing_and_classification |  |
| `options.list` | array | options | array of option names; at least 3 required — binary choices are usually false binaries |
| `options.includes_status_quo` | boolean | options |  |
| `options.includes_smaller_reversible_step` | boolean | options |  |
| `criteria.criteria_listed` | boolean | criteria_before_evaluation |  |
| `criteria.defined_before_scoring` | boolean | criteria_before_evaluation |  |
| `criteria.weights_assigned_before_scoring` | boolean | criteria_before_evaluation |  |
| `evaluation.method_named` | boolean | evaluation_and_uncertainty |  |
| `evaluation.uncertainty_flagged` | boolean | evaluation_and_uncertainty |  |
| `evaluation.probabilities_estimable` | boolean | evaluation_and_uncertainty | gates the expected-value check below |
| `evaluation.expected_value_used` | boolean | evaluation_and_uncertainty | required when probabilities are declared estimable; otherwise the check passes as not applicable |
| `premortem.decision_is_material` | boolean | pre_mortem | gates the two pre-mortem checks below |
| `premortem.conducted` | boolean | pre_mortem | required when the decision is declared material; otherwise the check passes as not applicable |
| `premortem.top_risks_hedged` | boolean | pre_mortem | required when the decision is declared material; otherwise the check passes as not applicable |
| `rush.made_in_rush` | boolean | rush_and_mood_trap | must be `false` when the decision is classified irreversible; passes as not applicable for a reversible decision |
| `rush.made_in_a_mood` | boolean | rush_and_mood_trap | must be `false` when the decision is classified irreversible; passes as not applicable for a reversible decision |
| `log.choice_recorded` | boolean | decision_log_and_review |  |
| `log.rationale_recorded` | boolean | decision_log_and_review |  |
| `log.assumptions_recorded` | boolean | decision_log_and_review |  |
| `log.review_date_set` | boolean | decision_log_and_review |  |
| `log.communicated_with_why` | boolean | decision_log_and_review |  |

### Checks

The recorded full-pass REST response carries 24 checks. Every check is named below with its section and what it requires to pass (the `evidence` standard recorded in the response). Cross-checked against SERVICE.md: every recorded check corresponds to a SERVICE.md field or a computed comparison named there; gated fields in SERVICE.md fold into a single conditional check (see the semantics note).

#### Section `framing_and_classification`

| Check | Requires to pass |
|---|---|
| `decision_stated` | what needs deciding is stated — frame the actual decision until it is crisp |
| `decide_by_named` | by when the decision must be made is named |
| `constraints_named` | the constraints on the decision are named |
| `out_of_scope_named` | what is out of scope is named |
| `decision_classified_reversible_or_irreversible` | classify the decision: reversible (decide fast, adjust) vs irreversible (slow down, deliberate) |
| `stakes_assessed` | stakes assessed — stakes x reversibility sets the effort budget |
#### Section `options`

| Check | Requires to pass |
|---|---|
| `at_least_three_options` | generate at least three options — binary choices are usually false binaries |
| `status_quo_option_included` | the options include 'do nothing / wait' |
| `smaller_reversible_step_included` | the options include a smaller reversible step |
#### Section `criteria_before_evaluation`

| Check | Requires to pass |
|---|---|
| `criteria_listed` | what matters is defined (cost, risk, time-to-value, optionality) |
| `criteria_defined_before_scoring` | criteria are defined BEFORE scoring options — criteria after scores is rationalization |
| `weights_assigned_before_scoring` | weights are assigned before evaluation, not fitted to the scores afterwards |
#### Section `evaluation_and_uncertainty`

| Check | Requires to pass |
|---|---|
| `fitting_evaluation_method_named` | evaluate with a fitting tool — decision matrix for multi-criteria, expected value / decision trees when probabilities are estimable, scenario thinking when they are not; the method used is named |
| `uncertainty_flagged` | flag the uncertainty in the evaluation |
| `expected_value_used_when_probabilities_estimable` | when probabilities are estimable, evaluate with expected value / decision trees |
#### Section `pre_mortem`

| Check | Requires to pass |
|---|---|
| `premortem_conducted_for_material_decision` | pre-mortem for material decisions: assume it failed — why? |
| `premortem_top_risks_hedged_for_material_decision` | fix or hedge the pre-mortem's top failure reasons now |
#### Section `rush_and_mood_trap`

| Check | Requires to pass |
|---|---|
| `irreversible_decision_not_made_in_rush` | no irreversible decision made in a rush |
| `irreversible_decision_not_made_in_a_mood` | no irreversible decision made in a mood |
#### Section `decision_log_and_review`

| Check | Requires to pass |
|---|---|
| `choice_logged` | the choice is logged |
| `rationale_logged` | the rationale is logged |
| `assumptions_logged` | the assumptions behind the choice are logged |
| `review_date_set` | a review date is set — review on schedule: outcomes vs expectations; separate luck from process; update |
| `decision_communicated_with_why` | the decision is communicated with the 'why' |

**Per-check status semantics** (recorded across the battery): `pass` — the declared evidence satisfies the check; `fail` — evidence was declared and does not satisfy the check (present-but-false, a violated must-be-`false` constraint, an out-of-enum value, or a failed computed comparison); `missing` — the field is absent, so there is no evidence to judge. There is **no separate not-applicable status in the recorded responses**: a gated (conditional) check whose gate does not apply is recorded as `pass`, with its `evidence` text stating why it does not apply (the exact wording is in each response's checks). Section statuses aggregate the same way: `pass`, `fail`, or `insufficient_evidence`.

### Output format

HTTP 200 JSON with keys: `service`, `atom_version`, `decision`, `verdict`, `sections`, `checks`, `summary`, `stamp`. `service` and `atom_version` identify the atom; the manifest's subject is carried through; `sections` maps each section to its status; `checks` is the per-check array (`section`, `check`, `status`, `evidence`); `summary` reconciles the counts in one line; `stamp` is a text rendering of the verdict. The recorded full-pass response is reproduced in full under Worked examples.

### Verdict vocabulary

| Value | Meaning |
|---|---|
| `TRAP_CLEAR` (verdict) | all 24 checks pass — no trap is present in the record |
| `TRAPS_PRESENT` (verdict) | any check fails — the named trap is present in the record |
| `INSUFFICIENT_EVIDENCE` (verdict) | nothing fails but evidence is missing |
| `pass` / `fail` / `insufficient_evidence` (section status) | the section's checks all pass / at least one fails / none fail but at least one is missing |
| `pass` / `fail` / `missing` (per-check status) | evidence satisfies the check / declared evidence does not satisfy it / field absent — no evidence to judge (gated checks that do not apply record as `pass`) |
| `reversible` / `irreversible` (`framing.classification` values) | the decision's classification — it gates the rush/mood checks; any other value fails the classification check |

### Errors

Only the shapes evidenced in the repo / gateway docs are documented here — no payload is invented. The 422 shape is recorded verbatim in the verification battery; the 401 / 403 / 429 codes and meanings are from USER-GUIDE.md (no response payload for them is recorded in the evidence battery).

| HTTP | Error | Shape / meaning |
|---|---|---|
| 401 | unauthenticated | missing or invalid key — send `Authorization: Bearer <key>` with a valid gateway key |
| 403 | scope | the key lacks this atom's scope — issue the key for this atom (`POST /v1/keys` with this atom's slug) |
| 422 | `invalid_input` | recorded shape: `{"ok": false, "error": "invalid_input", "field": "framing.classification", "detail": "framing.classification must be a string"}` — `field` names the first offending field, `detail` states the expected type; returned before any evaluation, never as a verdict |
| 429 | rate limit | per-key rate limit exceeded (60/minute, 10,000/day) — back off and retry within the limit |

### Rate limits + pricing status

- **Rate limits (contract.yaml):** 60 requests/minute per key; 10,000 requests/day per key.
- **Pricing:** pricing unit is the deliverable; `pricing.rate` is `null` (rate status: pending — prices are set only from measured production cost per unit). **Free during trial — rate pending.**
- **Support:** info@pipavia.com

## Explanation — what this atom does, and how the verdict is decided

The sweep is built around reversibility: stakes × reversibility sets the effort budget. Binary choices are treated as usually false binaries (at least three options are required, including doing nothing and a smaller reversible step). Criteria and weights must be fixed before scoring — criteria after scores is rationalization. Expected value is required only when probabilities are declared estimable; the pre-mortem is required only for material decisions; and the rush/mood prohibition binds only irreversible decisions. Each of those gates is a conditional check: when its gate does not apply, the check passes as not applicable (recorded as `pass` — see the Checks semantics). One failed check means a named trap is present in the record.

**How the verdict is decided (deterministic core).** The atom is a deterministic evaluator over the manifest: same manifest in → same verdict out (the recorded battery confirmed byte-identical repeat responses and REST/MCP parity). Each field feeds its section's checks. The semantics are three-valued and the distinction matters: a field **absent** marks its check `missing` — missing evidence; a field **present but false / invalid** marks its check `fail` — the evidence was offered and does not satisfy the check. The verdict aggregates strictly: any `fail` → `TRAPS_PRESENT`; otherwise any `missing` → `INSUFFICIENT_EVIDENCE`; otherwise (every check `pass`) → `TRAP_CLEAR`. Must-be-`false` fields invert the boolean reading: declaring them `true` is a `fail`. Conditional (gated) checks are required only when their gate field declares the situation exists; otherwise they record as `pass` (there is no separate not-applicable status in the recorded responses).

**What it does NOT do.**

- It judges the declared decision record, not the decision's merits and not the truth of the declarations — it cannot tell whether a pre-mortem really happened, only whether the record declares one.
- It does not make the decision, rank the options for you, or supply probabilities, criteria or weights.
- A `TRAP_CLEAR` verdict means no trap is present in the record as declared — it is not a prediction that the decision will succeed.
- It sells the sweep — the bounded judgment artifact — never the underlying decision-making knowledge itself.

**Buyer / use context.** First buyer hypothesis: teams and agents working in Thinking & decisions who need a decision-trap sweep on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). House self-use (internal caller, zero price, metered to the internal cost ledger): **Sweeping proposals before approval**. One unit of sale = one delivered result.

## Role views

### For integrators (Users)

Integrate with two calls: `POST https://atoms.pipavia.com/v1/decision-trap-sweep` (REST) or the MCP tool `decision_trap_sweep` at `POST https://atoms.pipavia.com/mcp/decision-trap-sweep`. Authenticate with `Authorization: Bearer <key>` (key flow: How-to guides). Treat HTTP 200 as the deliverable, HTTP 422 as a client bug to fix by field name, HTTP 401/403 as key/scope problems, and HTTP 429 as back-off. Persist the full response — including `summary` and `stamp` — as the record of the judgment; re-calling with the same manifest returns the identical result, so retries are safe. Stay within 60 requests/minute and 10,000/day per key.

### For developers

Manifest authoring: build the manifest field-by-field from Reference — Input reference; respect the must-be-`false` constraints and the gated conditionals, because both invert naive boolean intuition. Determinism: the evaluator is a pure function of the manifest — no clocks, no randomness, no external lookups — so golden-file testing against the worked examples below is exact. Implementation pointers (contract.yaml): src/decision_trap_sweep.py — `evaluate(manifest)` -> verdict dict; CLI prints JSON + stamp; tests: tests/test_decision_trap_sweep.py — 20 tests, all passing 2026-11-15. The atom is bound to the `decision-making` skill (R1: fixes land in the skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps).

### For ops

Endpoints: REST `POST /v1/decision-trap-sweep` and MCP `POST /mcp/decision-trap-sweep` on https://atoms.pipavia.com (gateway v1.1.0 at last verification). Key scope: per user, per atom — a key for one atom never verifies for another; scope failures surface as HTTP 403, missing/invalid keys as 401. Rate limits: 60/min and 10,000/day per key (HTTP 429 on breach). Error monitoring: alert on 422 spikes (client manifest drift), 403 (scope mis-issuance) and any 5xx (no 5xx shape is documented — none is evidenced). Status: live — release candidate, one-week RC soak to 2026-11-22; pricing rate pending, free during trial, so metering is cost-ledger only.

## Worked examples — real recorded trial runs

Provenance: recorded 2026-11-15T23:52:28.162829+00:00 against gateway v1.1.0, external verification lane, source `verification/work/decision-trap-sweep/evidence.json`. Inputs are the recorded case inputs; responses are the recorded REST executions' responses, reproduced verbatim (pretty-printed, indent 2). The sparse case from the same battery (result `INSUFFICIENT_EVIDENCE` on minimal input) is recorded in TEST-REPORT.md and the same evidence file.

### Example 1 — full-pass (HTTP 200)

Input:

```json
{
  "decision": "Migrate database to cloud",
  "framing": {
    "decision_stated": true,
    "decide_by_named": true,
    "constraints_named": true,
    "out_of_scope_named": true,
    "classification": "irreversible",
    "stakes_assessed": true
  },
  "options": {
    "list": [
      "Option A",
      "Option B",
      "Option C"
    ],
    "includes_status_quo": true,
    "includes_smaller_reversible_step": true
  },
  "criteria": {
    "criteria_listed": true,
    "defined_before_scoring": true,
    "weights_assigned_before_scoring": true
  },
  "evaluation": {
    "method_named": true,
    "uncertainty_flagged": true,
    "probabilities_estimable": true,
    "expected_value_used": true
  },
  "premortem": {
    "decision_is_material": true,
    "conducted": true,
    "top_risks_hedged": true
  },
  "rush": {
    "made_in_rush": false,
    "made_in_a_mood": false
  },
  "log": {
    "choice_recorded": true,
    "rationale_recorded": true,
    "assumptions_recorded": true,
    "review_date_set": true,
    "communicated_with_why": true
  }
}
```

Response:

```json
{
  "service": "decision-trap-sweep",
  "atom_version": "0.1.0",
  "decision": "Migrate database to cloud",
  "verdict": "TRAP_CLEAR",
  "sections": {
    "framing_and_classification": "pass",
    "options": "pass",
    "criteria_before_evaluation": "pass",
    "evaluation_and_uncertainty": "pass",
    "pre_mortem": "pass",
    "rush_and_mood_trap": "pass",
    "decision_log_and_review": "pass"
  },
  "checks": [
    {
      "section": "framing_and_classification",
      "check": "decision_stated",
      "status": "pass",
      "evidence": "what needs deciding is stated — frame the actual decision until it is crisp"
    },
    {
      "section": "framing_and_classification",
      "check": "decide_by_named",
      "status": "pass",
      "evidence": "by when the decision must be made is named"
    },
    {
      "section": "framing_and_classification",
      "check": "constraints_named",
      "status": "pass",
      "evidence": "the constraints on the decision are named"
    },
    {
      "section": "framing_and_classification",
      "check": "out_of_scope_named",
      "status": "pass",
      "evidence": "what is out of scope is named"
    },
    {
      "section": "framing_and_classification",
      "check": "decision_classified_reversible_or_irreversible",
      "status": "pass",
      "evidence": "classify the decision: reversible (decide fast, adjust) vs irreversible (slow down, deliberate)"
    },
    {
      "section": "framing_and_classification",
      "check": "stakes_assessed",
      "status": "pass",
      "evidence": "stakes assessed — stakes x reversibility sets the effort budget"
    },
    {
      "section": "options",
      "check": "at_least_three_options",
      "status": "pass",
      "evidence": "generate at least three options — binary choices are usually false binaries"
    },
    {
      "section": "options",
      "check": "status_quo_option_included",
      "status": "pass",
      "evidence": "the options include 'do nothing / wait'"
    },
    {
      "section": "options",
      "check": "smaller_reversible_step_included",
      "status": "pass",
      "evidence": "the options include a smaller reversible step"
    },
    {
      "section": "criteria_before_evaluation",
      "check": "criteria_listed",
      "status": "pass",
      "evidence": "what matters is defined (cost, risk, time-to-value, optionality)"
    },
    {
      "section": "criteria_before_evaluation",
      "check": "criteria_defined_before_scoring",
      "status": "pass",
      "evidence": "criteria are defined BEFORE scoring options — criteria after scores is rationalization"
    },
    {
      "section": "criteria_before_evaluation",
      "check": "weights_assigned_before_scoring",
      "status": "pass",
      "evidence": "weights are assigned before evaluation, not fitted to the scores afterwards"
    },
    {
      "section": "evaluation_and_uncertainty",
      "check": "fitting_evaluation_method_named",
      "status": "pass",
      "evidence": "evaluate with a fitting tool — decision matrix for multi-criteria, expected value / decision trees when probabilities are estimable, scenario thinking when they are not; the method used is named"
    },
    {
      "section": "evaluation_and_uncertainty",
      "check": "uncertainty_flagged",
      "status": "pass",
      "evidence": "flag the uncertainty in the evaluation"
    },
    {
      "section": "evaluation_and_uncertainty",
      "check": "expected_value_used_when_probabilities_estimable",
      "status": "pass",
      "evidence": "when probabilities are estimable, evaluate with expected value / decision trees"
    },
    {
      "section": "pre_mortem",
      "check": "premortem_conducted_for_material_decision",
      "status": "pass",
      "evidence": "pre-mortem for material decisions: assume it failed — why?"
    },
    {
      "section": "pre_mortem",
      "check": "premortem_top_risks_hedged_for_material_decision",
      "status": "pass",
      "evidence": "fix or hedge the pre-mortem's top failure reasons now"
    },
    {
      "section": "rush_and_mood_trap",
      "check": "irreversible_decision_not_made_in_rush",
      "status": "pass",
      "evidence": "no irreversible decision made in a rush"
    },
    {
      "section": "rush_and_mood_trap",
      "check": "irreversible_decision_not_made_in_a_mood",
      "status": "pass",
      "evidence": "no irreversible decision made in a mood"
    },
    {
      "section": "decision_log_and_review",
      "check": "choice_logged",
      "status": "pass",
      "evidence": "the choice is logged"
    },
    {
      "section": "decision_log_and_review",
      "check": "rationale_logged",
      "status": "pass",
      "evidence": "the rationale is logged"
    },
    {
      "section": "decision_log_and_review",
      "check": "assumptions_logged",
      "status": "pass",
      "evidence": "the assumptions behind the choice are logged"
    },
    {
      "section": "decision_log_and_review",
      "check": "review_date_set",
      "status": "pass",
      "evidence": "a review date is set — review on schedule: outcomes vs expectations; separate luck from process; update"
    },
    {
      "section": "decision_log_and_review",
      "check": "decision_communicated_with_why",
      "status": "pass",
      "evidence": "the decision is communicated with the 'why'"
    }
  ],
  "summary": "24 pass, 0 fail, 0 missing of 24 checks across seven sections.",
  "stamp": "DECISION-TRAP SWEEP\ndecision: Migrate database to cloud\nVERDICT: TRAP_CLEAR\n  framing_and_classification   pass\n  options                      pass\n  criteria_before_evaluation   pass\n  evaluation_and_uncertainty   pass\n  pre_mortem                   pass\n  rush_and_mood_trap           pass\n  decision_log_and_review      pass\n24 pass, 0 fail, 0 missing of 24 checks across seven sections."
}
```

### Example 2 — violations (HTTP 200)

Input:

```json
{
  "decision": "Quick fix",
  "framing": {
    "decision_stated": true,
    "decide_by_named": true,
    "constraints_named": true,
    "out_of_scope_named": true,
    "classification": "irreversible",
    "stakes_assessed": true
  },
  "options": {
    "list": [
      "A",
      "B",
      "C"
    ],
    "includes_status_quo": true,
    "includes_smaller_reversible_step": true
  },
  "criteria": {
    "criteria_listed": true,
    "defined_before_scoring": true,
    "weights_assigned_before_scoring": true
  },
  "evaluation": {
    "method_named": true,
    "uncertainty_flagged": true,
    "probabilities_estimable": true,
    "expected_value_used": true
  },
  "premortem": {
    "decision_is_material": true,
    "conducted": true,
    "top_risks_hedged": true
  },
  "rush": {
    "made_in_rush": true,
    "made_in_a_mood": true
  },
  "log": {
    "choice_recorded": true,
    "rationale_recorded": true,
    "assumptions_recorded": true,
    "review_date_set": true,
    "communicated_with_why": true
  }
}
```

Response:

```json
{
  "service": "decision-trap-sweep",
  "atom_version": "0.1.0",
  "decision": "Quick fix",
  "verdict": "TRAPS_PRESENT",
  "sections": {
    "framing_and_classification": "pass",
    "options": "pass",
    "criteria_before_evaluation": "pass",
    "evaluation_and_uncertainty": "pass",
    "pre_mortem": "pass",
    "rush_and_mood_trap": "fail",
    "decision_log_and_review": "pass"
  },
  "checks": [
    {
      "section": "framing_and_classification",
      "check": "decision_stated",
      "status": "pass",
      "evidence": "what needs deciding is stated — frame the actual decision until it is crisp"
    },
    {
      "section": "framing_and_classification",
      "check": "decide_by_named",
      "status": "pass",
      "evidence": "by when the decision must be made is named"
    },
    {
      "section": "framing_and_classification",
      "check": "constraints_named",
      "status": "pass",
      "evidence": "the constraints on the decision are named"
    },
    {
      "section": "framing_and_classification",
      "check": "out_of_scope_named",
      "status": "pass",
      "evidence": "what is out of scope is named"
    },
    {
      "section": "framing_and_classification",
      "check": "decision_classified_reversible_or_irreversible",
      "status": "pass",
      "evidence": "classify the decision: reversible (decide fast, adjust) vs irreversible (slow down, deliberate)"
    },
    {
      "section": "framing_and_classification",
      "check": "stakes_assessed",
      "status": "pass",
      "evidence": "stakes assessed — stakes x reversibility sets the effort budget"
    },
    {
      "section": "options",
      "check": "at_least_three_options",
      "status": "pass",
      "evidence": "generate at least three options — binary choices are usually false binaries"
    },
    {
      "section": "options",
      "check": "status_quo_option_included",
      "status": "pass",
      "evidence": "the options include 'do nothing / wait'"
    },
    {
      "section": "options",
      "check": "smaller_reversible_step_included",
      "status": "pass",
      "evidence": "the options include a smaller reversible step"
    },
    {
      "section": "criteria_before_evaluation",
      "check": "criteria_listed",
      "status": "pass",
      "evidence": "what matters is defined (cost, risk, time-to-value, optionality)"
    },
    {
      "section": "criteria_before_evaluation",
      "check": "criteria_defined_before_scoring",
      "status": "pass",
      "evidence": "criteria are defined BEFORE scoring options — criteria after scores is rationalization"
    },
    {
      "section": "criteria_before_evaluation",
      "check": "weights_assigned_before_scoring",
      "status": "pass",
      "evidence": "weights are assigned before evaluation, not fitted to the scores afterwards"
    },
    {
      "section": "evaluation_and_uncertainty",
      "check": "fitting_evaluation_method_named",
      "status": "pass",
      "evidence": "evaluate with a fitting tool — decision matrix for multi-criteria, expected value / decision trees when probabilities are estimable, scenario thinking when they are not; the method used is named"
    },
    {
      "section": "evaluation_and_uncertainty",
      "check": "uncertainty_flagged",
      "status": "pass",
      "evidence": "flag the uncertainty in the evaluation"
    },
    {
      "section": "evaluation_and_uncertainty",
      "check": "expected_value_used_when_probabilities_estimable",
      "status": "pass",
      "evidence": "when probabilities are estimable, evaluate with expected value / decision trees"
    },
    {
      "section": "pre_mortem",
      "check": "premortem_conducted_for_material_decision",
      "status": "pass",
      "evidence": "pre-mortem for material decisions: assume it failed — why?"
    },
    {
      "section": "pre_mortem",
      "check": "premortem_top_risks_hedged_for_material_decision",
      "status": "pass",
      "evidence": "fix or hedge the pre-mortem's top failure reasons now"
    },
    {
      "section": "rush_and_mood_trap",
      "check": "irreversible_decision_not_made_in_rush",
      "status": "fail",
      "evidence": "no irreversible decision made in a rush"
    },
    {
      "section": "rush_and_mood_trap",
      "check": "irreversible_decision_not_made_in_a_mood",
      "status": "fail",
      "evidence": "no irreversible decision made in a mood"
    },
    {
      "section": "decision_log_and_review",
      "check": "choice_logged",
      "status": "pass",
      "evidence": "the choice is logged"
    },
    {
      "section": "decision_log_and_review",
      "check": "rationale_logged",
      "status": "pass",
      "evidence": "the rationale is logged"
    },
    {
      "section": "decision_log_and_review",
      "check": "assumptions_logged",
      "status": "pass",
      "evidence": "the assumptions behind the choice are logged"
    },
    {
      "section": "decision_log_and_review",
      "check": "review_date_set",
      "status": "pass",
      "evidence": "a review date is set — review on schedule: outcomes vs expectations; separate luck from process; update"
    },
    {
      "section": "decision_log_and_review",
      "check": "decision_communicated_with_why",
      "status": "pass",
      "evidence": "the decision is communicated with the 'why'"
    }
  ],
  "summary": "22 pass, 2 fail, 0 missing of 24 checks across seven sections.",
  "stamp": "DECISION-TRAP SWEEP\ndecision: Quick fix\nVERDICT: TRAPS_PRESENT\n  framing_and_classification   pass\n  options                      pass\n  criteria_before_evaluation   pass\n  evaluation_and_uncertainty   pass\n  pre_mortem                   pass\n  rush_and_mood_trap           fail\n  decision_log_and_review      pass\n22 pass, 2 fail, 0 missing of 24 checks across seven sections."
}
```

### Example 3 — malformed (HTTP 422)

Input:

```json
{
  "decision": "Malformed input",
  "framing": {
    "classification": 123
  },
  "options": "not-a-list"
}
```

Response:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "framing.classification",
  "detail": "framing.classification must be a string"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present (tutorial / how-to / reference / explanation) | Yes — all four sections above |
| Role views present (integrators / developers / ops / regulators) | Integrators Yes · Developers Yes · Ops Yes · Regulators N/A — decision-process quality sweep; the verdict is not compliance/audit evidence and the domain is not a regulated one (finance, security, licensing, privacy) |
| Checks named vs recorded | 24 / 24 (recorded full-pass REST response) |
| Verdict vocabulary complete | Yes — `TRAP_CLEAR`, `TRAPS_PRESENT`, `INSUFFICIENT_EVIDENCE`; section + per-check statuses; `reversible` / `irreversible` classification values — complete |
| Input reference typed | Yes — 27 fields with types (SERVICE.md field table) |
| Worked examples verbatim-verified | Yes — full-pass / violations / malformed inputs and REST responses parsed and compared as JSON values against `verification/work/decision-trap-sweep/evidence.json` |

