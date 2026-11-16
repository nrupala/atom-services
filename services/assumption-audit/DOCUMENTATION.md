# Assumption audit — documentation

**Assumption audit** · slug `assumption-audit` · deliverable type: CHECK · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. All worked examples are real recorded trial runs — see the provenance line under Worked examples.

## Tutorial

A first call, walked through end to end. This tutorial narrates the recorded full-pass trial run — a decision to launch a new product line — whose verbatim request and response appear as Worked example 1 below.

1. **Get a key.** Sign up at `POST https://atoms.pipavia.com/v1/signup` with your email; open the emailed sign-in link to mint your session; then issue a key for this atom with `POST /v1/keys` and body `{"atom": "assumption-audit"}`. Keep the returned key — you send it as `Authorization: Bearer <key>` on every call. (Full detail: How-to guides.)
2. **Assemble the manifest.** Build one JSON object: a decision-process evidence manifest: how a decision was made — framing, criteria preset before the data, the loss function, rigor sizing, data discipline, and review. In the recorded run the manifest names `decision: "Launch new product line"` and declares every field `true` in the passing sense (every must-be-false field `false`), with the supporting rows the computed checks read.
3. **Send it.** `POST https://atoms.pipavia.com/v1/assumption-audit` with the manifest as the body and the `Authorization` header set.
4. **Read the verdict.** The recorded response is HTTP 200 with verdict `SOUND`. Its `summary` reads: “18 pass, 0 fail, 0 missing of 18 checks across six sections.” Every section in `sections` is `pass`, and every entry in `checks` carries `status: "pass"` with its evidence line.
5. **Keep the stamp.** The response's `stamp` field is the same verdict as a plain-text block, suitable for pasting into a change record or review note.

You now have the deliverable: one deterministic verdict. Same manifest in → same verdict out (the recorded battery proves byte-identical repeat responses and MCP/REST parity — see TEST-REPORT.md).

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "assumption-audit"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Keys are per user, per atom in scope: a key never verifies for an atom outside its granted scope (contract.yaml: key = HMAC-SHA256 over email | atom service | issued-at, version-prefixed, regenerated on demand after authentication, never stored).
3. Call:

```bash
curl -X POST https://atoms.pipavia.com/v1/assumption-audit \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -d @manifest.json
```

The body is the manifest object itself (see Reference — Input reference). HTTP 200 returns the verdict object (see Reference — Output format).

### Call via MCP

- Endpoint: `POST https://atoms.pipavia.com/mcp/assumption-audit`
- Tool name: `assumption_audit`
- Send the same `Authorization: Bearer <key>` header. In the `tools/call` request, the tool arguments are the manifest object — the same object you would POST as the REST body. The recorded battery proves parity: the MCP `structuredContent` is deep-equal to the REST artifact for the same manifest.

### Read a failing verdict and fix the manifest

Worked example 2 below is the recorded failing run: verdict `UNSOUND`, summary “16 pass, 2 fail, 0 missing of 18 checks across six sections.”. To fix a failing verdict:

1. **Find the non-pass checks.** In the response's `checks` array, look for `status: "fail"` (present but wrong) and `status: "missing"` (not declared). In the recorded violations run the failing checks are:
   - `real_options_listed` (section `framing`) — evidence: “the real options are listed, not a single foregone option”
   - `loss_framed_in_each_direction` (section `loss_function`) — evidence: “what being wrong costs — in each direction”
2. **Note the section roll-up.** `sections` marks each affected section `fail` (or `insufficient_evidence` when nothing in it failed but evidence is missing). The verdict is `UNSOUND` when any check fails, `INSUFFICIENT_EVIDENCE` when nothing fails but any check is missing, and `SOUND` only when every check passes.
3. **Fix the underlying fact, then the manifest.** Each check's Reference entry names the manifest field it reads. Correct the real-world condition first (the atom reads declarations — declaring `true` for work not done defeats the purpose), set the field to the passing value, and resubmit the whole manifest. The atom is stateless: a resubmission is a fresh, complete evaluation.
4. **Re-read the new summary.** It counts pass / fail / missing across all checks; you are done when it reads all-pass and the verdict is `SOUND`.

### Handle a 422 invalid_input

A type-violating manifest is rejected before evaluation — never scored. The recorded malformed run (Worked example 3) returned HTTP 422:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "framing",
  "detail": "framing must be an object"
}
```

- `field` names the offending field (`framing` in the recorded run) and `detail` says what type was expected (`"framing must be an object"`).
- Fix exactly that field's type in your manifest (see the types in the Input reference) and resubmit. Validation reports the first offending field it reaches, so a manifest with several type errors may need more than one fix-and-resubmit round.
- A 422 carries no verdict and no `checks` array — do not read it as a failing evaluation.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/assumption-audit` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/assumption-audit` — tool name `assumption_audit`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Gateway base: `https://atoms.pipavia.com` (recorded gateway version 1.1.0). Contract endpoints: API, MCP, agent.

### Input reference

One JSON manifest per call. Types are from SERVICE.md's field table, corroborated by the recorded MCP `inputSchema` and the evidence inputs. Unless a field is marked otherwise, every boolean field follows the same rule: **absent = evidence missing** (the check it feeds is `missing`; the verdict degrades to `INSUFFICIENT_EVIDENCE`), **present but false/invalid = the check fails** (the verdict degrades to `UNSOUND`). Fields marked “must be `false`” invert the passing value, as noted.

**Identity**

| Field | Type | Notes |
|---|---|---|
| `decision` | string | Decision name. Carried into the output; not itself checked. |

**`framing` — framing**

| Field | Type | Notes |
|---|---|---|
| `framing.decision_named` | boolean | Read by section `framing`. |
| `framing.options_listed` | boolean | Read by section `framing`. |
| `framing.decision_maker_identified` | boolean | Read by section `framing`. |
| `framing.objective_defined` | boolean | Read by section `framing`. |

**`preset` — preset criteria**

| Field | Type | Notes |
|---|---|---|
| `preset.criteria_set_before_data` | boolean | Read by section `preset_criteria`. |
| `preset.default_action_set` | boolean | Read by section `preset_criteria`. |
| `preset.change_threshold_set_before_data` | boolean | Read by section `preset_criteria`. |

**`loss` — loss function**

| Field | Type | Notes |
|---|---|---|
| `loss.framed_each_direction` | boolean | Read by section `loss_function`. |
| `loss.threshold_reflects_asymmetry` | boolean | Read by section `loss_function`. |

**`rigor` — rigor sizing**

| Field | Type | Notes |
|---|---|---|
| `rigor.stakes_assessed` | boolean | Read by section `rigor_sizing`. |
| `rigor.reversibility_assessed` | boolean | Read by section `rigor_sizing`. |
| `rigor.effort_matched` | boolean | Read by section `rigor_sizing`. |

**`data` — data discipline**

| Field | Type | Notes |
|---|---|---|
| `data.exploratory_confirmatory_separated` | boolean | Read by section `data_discipline`. |
| `data.conclusion_not_from_inspiring_data` | boolean | Read by section `data_discipline`. |
| `data.evidence_could_change_decision` | boolean | Read by section `data_discipline`. |
| `data.roles_clear` | boolean | Read by section `data_discipline`. |

**`review` — review**

| Field | Type | Notes |
|---|---|---|
| `review.conducted` | boolean | Read by section `review`. |
| `review.separates_decision_from_outcome` | boolean | Read by section `review`. |

### Checks

The recorded full-pass REST response carries 18 checks. Every check is listed below, grouped by its `section` exactly as recorded. For each check: what it requires to pass, and its semantics — `pass` = the requirement is met on the declared evidence; `fail` = the field is present but false/invalid (or a must-be-false field is `true`, or a computed condition is breached); `missing` = the field (or the rows a computed check reads) is absent. There is no separate not-applicable status value in recorded responses: a gated check whose gate is closed reports `pass`, with its evidence line saying why (for example “no LLM judge declared”).

**Section `framing`**

| Check | Requires to pass | Source field(s) |
|---|---|---|
| `decision_named` | The decision is named. Recorded full-pass evidence: “name the decision and the real options” | `framing.decision_named` |
| `real_options_listed` | The real options are listed, not a single foregone option. Recorded full-pass evidence: “the real options are listed, not a single foregone option” | `framing.options_listed` |
| `decision_maker_identified` | The decision-maker is identified. Recorded full-pass evidence: “identify the decision-maker” | `framing.decision_maker_identified` |
| `objective_defined` | The objective — what the decision-maker actually cares about (the objective / loss function) — is defined. Recorded full-pass evidence: “what the decision-maker actually cares about (the objective / loss function) is defined” | `framing.objective_defined` |
**Section `preset_criteria`**

| Check | Requires to pass | Source field(s) |
|---|---|---|
| `criteria_set_before_data` | Decision criteria were set in advance — how to decide was decided before the data was seen. Recorded full-pass evidence: “decide how to decide before you see the data — decision criteria set in advance” | `preset.criteria_set_before_data` |
| `default_action_set` | The default action is known in advance. Recorded full-pass evidence: “default action known in advance” | `preset.default_action_set` |
| `change_my_mind_threshold_set_before_data` | A change-my-mind threshold was pre-committed before looking: exactly what evidence would flip the default. Recorded full-pass evidence: “pre-commit to exactly what evidence would flip the default — answered before looking” | `preset.change_threshold_set_before_data` |
**Section `loss_function`**

| Check | Requires to pass | Source field(s) |
|---|---|---|
| `loss_framed_in_each_direction` | The loss — what being wrong costs — is framed in each direction. Recorded full-pass evidence: “what being wrong costs — in each direction” | `loss.framed_each_direction` |
| `threshold_reflects_asymmetric_costs` | The threshold reflects asymmetric costs: asymmetric costs move the threshold. Recorded full-pass evidence: “asymmetric costs move the threshold” | `loss.threshold_reflects_asymmetry` |
**Section `rigor_sizing`**

| Check | Requires to pass | Source field(s) |
|---|---|---|
| `stakes_assessed` | Stakes were assessed, so effort can be matched to them. Recorded full-pass evidence: “match effort to stakes” | `rigor.stakes_assessed` |
| `reversibility_assessed` | Reversibility was assessed (one-way-door vs two-way-door). Recorded full-pass evidence: “one-way-door vs two-way-door assessed” | `rigor.reversibility_assessed` |
| `effort_matched_to_stakes_and_reversibility` | Effort is matched to stakes and reversibility: reversible decisions decide fast; irreversible ones slow down and gather more. Recorded full-pass evidence: “reversible decisions decide fast; irreversible ones slow down and gather more” | `rigor.effort_matched` |
**Section `data_discipline`**

| Check | Requires to pass | Source field(s) |
|---|---|---|
| `exploratory_and_confirmatory_separated` | Exploratory and confirmatory analysis are separated: exploratory analysis generates hypotheses; confirmatory analysis tests a pre-registered hypothesis. Recorded full-pass evidence: “exploratory analysis generates hypotheses; confirmatory analysis tests a pre-registered hypothesis” | `data.exploratory_confirmatory_separated` |
| `no_conclusion_from_inspiring_data` | No conclusion is drawn from the same data that inspired it. Recorded full-pass evidence: “never draw a conclusion from the same data that inspired it” | `data.conclusion_not_from_inspiring_data` |
| `evidence_could_change_the_decision` | The evidence could change the decision — if no possible data could change the action, the data is decoration. Recorded full-pass evidence: “if no possible data could change the action, the data is decoration” | `data.evidence_could_change_decision` |
| `roles_clear` | Roles are clear: the decision-maker frames and defines thresholds; the analyst informs — analysis does not quietly make the call. Recorded full-pass evidence: “the decision-maker frames and defines thresholds; the analyst informs — analysis does not quietly make the call” | `data.roles_clear` |
**Section `review`**

| Check | Requires to pass | Source field(s) |
|---|---|---|
| `decision_quality_reviewed` | The decision was reviewed after acting, per the pre-set criteria. Recorded full-pass evidence: “review the decision after acting per the pre-set criteria” | `review.conducted` |
| `decision_reviewed_separately_from_outcome` | The decision is judged by the process and information at the time, not by how it turned out (no resulting). Recorded full-pass evidence: “judge a decision by the process and information at the time, not by how it turned out (no resulting)” | `review.separates_decision_from_outcome` |

### Output format

HTTP 200 returns one JSON object:

| Field | Content |
|---|---|
| `service` | `"assumption-audit"` |
| `atom_version` | `"0.1.0" |
| `decision` | The manifest's `decision` value, carried through |
| `verdict` | One of the verdict values below |
| `sections` | Object mapping each section to its section status (below) |
| `checks` | Array of `{section, check, status, evidence}` — one entry per check, in section order |
| `summary` | One line counting pass / fail / missing across all checks and sections |
| `stamp` | The same verdict as a plain-text block |

### Verdict vocabulary

**Verdicts** (the `verdict` field — every value this atom can return):

- `SOUND` — All 18 checks pass across all six sections. The decision process is sound on the evidence declared.
- `UNSOUND` — At least one check fails (a field present but false/invalid). The failing checks name the section and the evidence against it.
- `INSUFFICIENT_EVIDENCE` — No check fails, but at least one check is `missing` — evidence was not declared. The missing checks name exactly what to supply.

**Section statuses** (values in the `sections` object):

- `pass` — every check in the section passes.
- `fail` — at least one check in the section fails.
- `insufficient_evidence` — no check in the section fails, but at least one is `missing`.

**Per-check statuses** (the `status` field of each `checks[]` entry):

- `pass` — the requirement is met on the declared evidence (including gated checks whose gate is closed — see Checks).
- `fail` — the requirement is breached on present evidence.
- `missing` — the evidence the check reads was not declared.

### Errors

Only the shapes evidenced in the repo and gateway documentation are given; no payload is invented. USER-GUIDE.md evidences the four statuses; the 422 body is the recorded one.

| HTTP | Meaning | Body |
|---|---|---|
| 401 | Unauthenticated — key missing or invalid | No body shape is evidenced in the repo for this atom; treat the status itself as the signal and check the `Authorization: Bearer <key>` header. |
| 403 | Scope — the key is valid but lacks this atom's scope | No body shape is evidenced in the repo for this atom; issue this atom's scope on the key (`POST /v1/keys` with this atom) and retry. |
| 422 | `invalid_input` — the manifest violates a field type; rejected before evaluation | Recorded shape: `{"ok": false, "error": "invalid_input", "field": "framing", "detail": "framing must be an object"}` — `field` and `detail` name the offending field and the expected type for your submission. |
| 429 | Rate limit — per-key limit exceeded (see Rate limits) | No body shape is evidenced in the repo for this atom; back off and retry within the limits below. |

### Rate limits and pricing

- Rate limits (contract.yaml): 60 requests per key per minute; 10,000 requests per key per day. Status note in the contract: SPEC default — the per-key rate limit is the capacity guard for open public usage; tuned per atom at build-out from measured production cost.
- Pricing: pricing unit `tokens`; `pricing.rate` is `null` (rate status: pending — prices are set only from measured production cost per unit). **Free during trial — rate pending.**

## Explanation

The audit examines the process that produced a decision, never the decision's merits and never its outcome. Its spine is pre-commitment: criteria, a default action, and a change-my-mind threshold fixed before the data was seen; loss framed in both directions so asymmetric costs move the threshold; rigor sized to stakes and reversibility; exploratory and confirmatory data kept apart; and a review that judges the decision separately from how it turned out.

**How the verdict is decided.** The core is deterministic: the same manifest always produces the same verdict (the recorded battery proves byte-identical repeat responses, and MCP/REST parity). Each check reads named manifest fields and resolves to `pass`, `fail`, or `missing`. The distinction that drives the verdict is *absent vs false*: a field that is **absent** is missing evidence — its check is `missing`, and if nothing fails the verdict is `INSUFFICIENT_EVIDENCE`, naming exactly what to supply. A field that is **present but false or invalid** is a breached requirement — its check fails, and any single failure makes the verdict `UNSOUND`. Section statuses roll up the same way (`pass` / `fail` / `insufficient_evidence`). Gated checks follow their gate field: when the gate is closed (for example no LLM judge used, no repair declared, no NIST alignment claimed, no backdoor present), the gated check passes as not applicable rather than going missing; when the gate is open, the gated field is required. Must-be-false fields invert the test: declaring them `true` is the failure.

**What it does not do.**

- It does not judge whether the decision itself was right, wise, or profitable — only whether the declared process was sound.
- It does not verify that declared booleans are true in the world; the verdict is evidence about the declaration, in the declared shape.
- It does not supply base rates, options, or analysis for the decision (the register pairs it with base-rate-card for that).
- It sells the check (the audit verdict) — never the underlying decision knowledge itself.

**Buyer and use context.** Teams and agents working in “Thinking & decisions” who need this check on demand and would rather buy it per use than build or staff the capability themselves (first buyer hypothesis from the register; not yet market-tested). House self-use: reviewing every plan and proposal — Wright is an internal caller (zero price, metered to the internal cost ledger). Register's named doubt: buyers may resist paying for doubt. One unit of sale = one tokens (the delivered verdict). The atom sells its deliverable — the bounded judgment artifact — never the underlying knowledge.

## Role views

### For integrators (Users)

You integrate one call: obtain a key, POST the manifest to the REST endpoint (or call the MCP tool `assumption_audit`), and consume `verdict`, `sections`, `checks`, `summary` and `stamp`. Treat the three verdict values as your branch points: `SOUND` = proceed; `UNSOUND` = stop and remediate the failing checks; `INSUFFICIENT_EVIDENCE` = collect the missing evidence named in the `missing` checks and resubmit. Handle 422 as a client bug (fix the named field's type), 401/403 as key problems, and 429 by backing off. The call is stateless and deterministic, so caching a verdict for an unchanged manifest is sound.

### For developers

Manifest authoring: declare facts, not aspirations — every boolean is a claim about work actually done, and must-be-false fields are the usual trap (declaring them `true` is an instant fail). Respect the gates: gated fields are required only when their gate field opens them. Implementation pointers: `src/assumption_audit.py` — `evaluate(manifest) -> verdict dict`; CLI prints JSON + stamp. Tests: `tests/test_assumption_audit.py — 16 tests, all passing 2026-11-15`. Determinism is contractual: no randomness, no clock, no external calls in the evaluation path — the recorded battery's byte-identical repeat and MCP/REST parity results (TEST-REPORT.md) are the regression bar. Fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps (contract.yaml binding rule R1).

### For ops

Endpoints: REST `POST /v1/assumption-audit`, MCP `POST /mcp/assumption-audit` (tool `assumption_audit`) on gateway `https://atoms.pipavia.com` (recorded gateway version 1.1.0). Key scope: per user, per atom — a 403 means the key lacks this atom's scope, a 401 means missing/invalid key. Rate limits: 60/min and 10,000/day per key; watch 429s as the capacity signal. Error monitoring: 422s indicate client manifest type bugs (the body names the field); a rising 422 rate after a client release is a client regression, not an atom fault. Status: live — release candidate (one-week RC soak to 2026-11-22); verification state PASS on the recorded battery (TEST-REPORT.md; `verification/results/assumption-audit.json`). Pricing is not yet metered for revenue: rate pending, free during trial.

## Worked examples

Provenance: recorded 2026-11-15T23:53:33.776739+00:00 against gateway v1.1.0, external verification lane, source `verification/work/assumption-audit/evidence.json`. Inputs are each case's recorded `input`; responses are the REST execution's recorded `response_text`, reproduced verbatim (pretty-printed with indent 2 for readability; JSON values unchanged — mechanically verified after writing).

### Example 1 — Full-pass (case `full-pass`, HTTP 200)

Input:

```json
{
  "decision": "Launch new product line",
  "framing": {
    "decision_named": true,
    "options_listed": true,
    "decision_maker_identified": true,
    "objective_defined": true
  },
  "preset": {
    "criteria_set_before_data": true,
    "default_action_set": true,
    "change_threshold_set_before_data": true
  },
  "loss": {
    "framed_each_direction": true,
    "threshold_reflects_asymmetry": true
  },
  "rigor": {
    "stakes_assessed": true,
    "reversibility_assessed": true,
    "effort_matched": true
  },
  "data": {
    "exploratory_confirmatory_separated": true,
    "conclusion_not_from_inspiring_data": true,
    "evidence_could_change_decision": true,
    "roles_clear": true
  },
  "review": {
    "conducted": true,
    "separates_decision_from_outcome": true
  }
}
```

Response (REST):

```json
{
  "service": "assumption-audit",
  "atom_version": "0.1.0",
  "decision": "Launch new product line",
  "verdict": "SOUND",
  "sections": {
    "framing": "pass",
    "preset_criteria": "pass",
    "loss_function": "pass",
    "rigor_sizing": "pass",
    "data_discipline": "pass",
    "review": "pass"
  },
  "checks": [
    {
      "section": "framing",
      "check": "decision_named",
      "status": "pass",
      "evidence": "name the decision and the real options"
    },
    {
      "section": "framing",
      "check": "real_options_listed",
      "status": "pass",
      "evidence": "the real options are listed, not a single foregone option"
    },
    {
      "section": "framing",
      "check": "decision_maker_identified",
      "status": "pass",
      "evidence": "identify the decision-maker"
    },
    {
      "section": "framing",
      "check": "objective_defined",
      "status": "pass",
      "evidence": "what the decision-maker actually cares about (the objective / loss function) is defined"
    },
    {
      "section": "preset_criteria",
      "check": "criteria_set_before_data",
      "status": "pass",
      "evidence": "decide how to decide before you see the data — decision criteria set in advance"
    },
    {
      "section": "preset_criteria",
      "check": "default_action_set",
      "status": "pass",
      "evidence": "default action known in advance"
    },
    {
      "section": "preset_criteria",
      "check": "change_my_mind_threshold_set_before_data",
      "status": "pass",
      "evidence": "pre-commit to exactly what evidence would flip the default — answered before looking"
    },
    {
      "section": "loss_function",
      "check": "loss_framed_in_each_direction",
      "status": "pass",
      "evidence": "what being wrong costs — in each direction"
    },
    {
      "section": "loss_function",
      "check": "threshold_reflects_asymmetric_costs",
      "status": "pass",
      "evidence": "asymmetric costs move the threshold"
    },
    {
      "section": "rigor_sizing",
      "check": "stakes_assessed",
      "status": "pass",
      "evidence": "match effort to stakes"
    },
    {
      "section": "rigor_sizing",
      "check": "reversibility_assessed",
      "status": "pass",
      "evidence": "one-way-door vs two-way-door assessed"
    },
    {
      "section": "rigor_sizing",
      "check": "effort_matched_to_stakes_and_reversibility",
      "status": "pass",
      "evidence": "reversible decisions decide fast; irreversible ones slow down and gather more"
    },
    {
      "section": "data_discipline",
      "check": "exploratory_and_confirmatory_separated",
      "status": "pass",
      "evidence": "exploratory analysis generates hypotheses; confirmatory analysis tests a pre-registered hypothesis"
    },
    {
      "section": "data_discipline",
      "check": "no_conclusion_from_inspiring_data",
      "status": "pass",
      "evidence": "never draw a conclusion from the same data that inspired it"
    },
    {
      "section": "data_discipline",
      "check": "evidence_could_change_the_decision",
      "status": "pass",
      "evidence": "if no possible data could change the action, the data is decoration"
    },
    {
      "section": "data_discipline",
      "check": "roles_clear",
      "status": "pass",
      "evidence": "the decision-maker frames and defines thresholds; the analyst informs — analysis does not quietly make the call"
    },
    {
      "section": "review",
      "check": "decision_quality_reviewed",
      "status": "pass",
      "evidence": "review the decision after acting per the pre-set criteria"
    },
    {
      "section": "review",
      "check": "decision_reviewed_separately_from_outcome",
      "status": "pass",
      "evidence": "judge a decision by the process and information at the time, not by how it turned out (no resulting)"
    }
  ],
  "summary": "18 pass, 0 fail, 0 missing of 18 checks across six sections.",
  "stamp": "ASSUMPTION AUDIT\ndecision: Launch new product line\nVERDICT: SOUND\n  framing            pass\n  preset_criteria    pass\n  loss_function      pass\n  rigor_sizing       pass\n  data_discipline    pass\n  review             pass\n18 pass, 0 fail, 0 missing of 18 checks across six sections."
}
```

### Example 2 — Violations (case `violations`, HTTP 200)

Input:

```json
{
  "decision": "Cancel project",
  "framing": {
    "decision_named": true,
    "options_listed": false,
    "decision_maker_identified": true,
    "objective_defined": true
  },
  "preset": {
    "criteria_set_before_data": true,
    "default_action_set": true,
    "change_threshold_set_before_data": true
  },
  "loss": {
    "framed_each_direction": false,
    "threshold_reflects_asymmetry": true
  },
  "rigor": {
    "stakes_assessed": true,
    "reversibility_assessed": true,
    "effort_matched": true
  },
  "data": {
    "exploratory_confirmatory_separated": true,
    "conclusion_not_from_inspiring_data": true,
    "evidence_could_change_decision": true,
    "roles_clear": true
  },
  "review": {
    "conducted": true,
    "separates_decision_from_outcome": true
  }
}
```

Response (REST):

```json
{
  "service": "assumption-audit",
  "atom_version": "0.1.0",
  "decision": "Cancel project",
  "verdict": "UNSOUND",
  "sections": {
    "framing": "fail",
    "preset_criteria": "pass",
    "loss_function": "fail",
    "rigor_sizing": "pass",
    "data_discipline": "pass",
    "review": "pass"
  },
  "checks": [
    {
      "section": "framing",
      "check": "decision_named",
      "status": "pass",
      "evidence": "name the decision and the real options"
    },
    {
      "section": "framing",
      "check": "real_options_listed",
      "status": "fail",
      "evidence": "the real options are listed, not a single foregone option"
    },
    {
      "section": "framing",
      "check": "decision_maker_identified",
      "status": "pass",
      "evidence": "identify the decision-maker"
    },
    {
      "section": "framing",
      "check": "objective_defined",
      "status": "pass",
      "evidence": "what the decision-maker actually cares about (the objective / loss function) is defined"
    },
    {
      "section": "preset_criteria",
      "check": "criteria_set_before_data",
      "status": "pass",
      "evidence": "decide how to decide before you see the data — decision criteria set in advance"
    },
    {
      "section": "preset_criteria",
      "check": "default_action_set",
      "status": "pass",
      "evidence": "default action known in advance"
    },
    {
      "section": "preset_criteria",
      "check": "change_my_mind_threshold_set_before_data",
      "status": "pass",
      "evidence": "pre-commit to exactly what evidence would flip the default — answered before looking"
    },
    {
      "section": "loss_function",
      "check": "loss_framed_in_each_direction",
      "status": "fail",
      "evidence": "what being wrong costs — in each direction"
    },
    {
      "section": "loss_function",
      "check": "threshold_reflects_asymmetric_costs",
      "status": "pass",
      "evidence": "asymmetric costs move the threshold"
    },
    {
      "section": "rigor_sizing",
      "check": "stakes_assessed",
      "status": "pass",
      "evidence": "match effort to stakes"
    },
    {
      "section": "rigor_sizing",
      "check": "reversibility_assessed",
      "status": "pass",
      "evidence": "one-way-door vs two-way-door assessed"
    },
    {
      "section": "rigor_sizing",
      "check": "effort_matched_to_stakes_and_reversibility",
      "status": "pass",
      "evidence": "reversible decisions decide fast; irreversible ones slow down and gather more"
    },
    {
      "section": "data_discipline",
      "check": "exploratory_and_confirmatory_separated",
      "status": "pass",
      "evidence": "exploratory analysis generates hypotheses; confirmatory analysis tests a pre-registered hypothesis"
    },
    {
      "section": "data_discipline",
      "check": "no_conclusion_from_inspiring_data",
      "status": "pass",
      "evidence": "never draw a conclusion from the same data that inspired it"
    },
    {
      "section": "data_discipline",
      "check": "evidence_could_change_the_decision",
      "status": "pass",
      "evidence": "if no possible data could change the action, the data is decoration"
    },
    {
      "section": "data_discipline",
      "check": "roles_clear",
      "status": "pass",
      "evidence": "the decision-maker frames and defines thresholds; the analyst informs — analysis does not quietly make the call"
    },
    {
      "section": "review",
      "check": "decision_quality_reviewed",
      "status": "pass",
      "evidence": "review the decision after acting per the pre-set criteria"
    },
    {
      "section": "review",
      "check": "decision_reviewed_separately_from_outcome",
      "status": "pass",
      "evidence": "judge a decision by the process and information at the time, not by how it turned out (no resulting)"
    }
  ],
  "summary": "16 pass, 2 fail, 0 missing of 18 checks across six sections.",
  "stamp": "ASSUMPTION AUDIT\ndecision: Cancel project\nVERDICT: UNSOUND\n  framing            fail\n  preset_criteria    pass\n  loss_function      fail\n  rigor_sizing       pass\n  data_discipline    pass\n  review             pass\n16 pass, 2 fail, 0 missing of 18 checks across six sections."
}
```

### Example 3 — Malformed (case `malformed`, HTTP 422)

Input:

```json
{
  "decision": "Malformed test",
  "framing": "not-an-object",
  "preset": {
    "criteria_set_before_data": "should-be-boolean"
  }
}
```

Response (REST):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "framing",
  "detail": "framing must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present (tutorial / how-to / reference / explanation) | Yes — Tutorial, How-to guides, Reference, Explanation sections above |
| Role views present (integrators / developers / ops / regulators) | Integrators Yes; Developers Yes; Ops Yes; Regulators N/A — The verdict audits a decision-making process; it is not itself compliance or audit evidence for a regulated domain, and general decision process is not a regulated domain. |
| Checks named: documented vs recorded | 18 / 18 (from the recorded full-pass REST response `checks` array) |
| Verdict vocabulary complete | Yes — 3 verdict values, 3 section statuses, 3 per-check statuses |
| Input reference typed | Yes — 19 fields with types from SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass, violations, malformed inputs and REST responses parsed from this file and compared as JSON values against `verification/work/assumption-audit/evidence.json` |

