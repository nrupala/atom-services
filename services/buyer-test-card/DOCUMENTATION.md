# Buyer-test card — documentation

**Buyer-test card** · slug `buyer-test-card` · deliverable type: DELIVERABLE · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. The worked examples at the end are real recorded trial runs, reproduced verbatim from the external verification evidence.

## Tutorial

A first call, walked through end to end. This tutorial narrates the recorded full-pass trial run (Worked example 1 below reproduces it verbatim); every value named here is the value that run actually returned.

**The job.** You have a buyer-test / proof-of-concept record — one idea worked through the buyer-test method, and you want one deterministic verdict on whether it is complete and internally coherent on its own declared evidence.

**Step 1 — get a key.** Sign up and issue a gateway key for this atom (the exact calls are in *How-to guides → Get a key and call via REST*). Keep the key; you send it as `Authorization: Bearer <key>` on every call.

**Step 2 — assemble the manifest.** Build one JSON object covering every section: `hypothesis`, `criteria_upfront`, `timebox_and_scope`, `disposition_and_production_boundary`, `evidence`, `decision_and_findings`. In the recorded run the identity field `idea` was `"AI-driven inventory forecasting"`. Fill each evidence field honestly from your own records: `true` where the practice was followed, `false` where a must-be-false field applies (see the Input reference — those fields must be `false` to pass), and the declared lists and numbers the computed checks re-derive. Leave a field out only if you genuinely have no evidence for it — an absent field is not a failure, it is `missing`, and it will hold the verdict at `INSUFFICIENT_EVIDENCE`.

**Step 3 — send it.** `POST https://atoms.pipavia.com/v1/buyer-test-card` with the manifest as the body and your key in the `Authorization` header.

**Step 4 — read the verdict.** The recorded run returned HTTP 200 with verdict `CARD_COMPLETE`: every section `pass`, and the summary "22 pass, 0 fail, 0 missing of 22 checks across six sections." The computed fields came back `computed_status` = `"within_stated_limits_on_declared_evidence"`, `timebox_limit_days` = `10`, `timebox_elapsed_days` = `5`, `timebox_overrun_days` = `"-5.000000"` — the declared lists and numbers agree with the limits the method itself states, on the declared evidence.

**Step 5 — act on it.** A `CARD_COMPLETE` verdict means the manifest is complete on the evidence you declared — it does not certify that the underlying work is good (see *Explanation → What it does not do*). If instead you get the failing verdict or `INSUFFICIENT_EVIDENCE`, the `checks` array names exactly which checks failed or are missing; *How-to guides → Read a failing verdict and fix the manifest* walks through that repair loop using the recorded violations run.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "buyer-test-card"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.
4. Call the atom: `POST https://atoms.pipavia.com/v1/buyer-test-card` — body = the manifest object (see the Input reference).

```bash
curl -s -X POST https://atoms.pipavia.com/v1/buyer-test-card \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -d @manifest.json
```

The response is the verdict object described in *Reference → Output format*. The same manifest always returns the same verdict (determinism was byte-identical on the recorded repeat call — see TEST-REPORT.md).

### Call via MCP

- Endpoint: `POST https://atoms.pipavia.com/mcp/buyer-test-card`
- Tool name: `buyer_test_card`
- Call `tools/call` with the tool name above and the manifest object as the arguments — the same object you would send as the REST body, with the same `Authorization: Bearer <key>` header.
- The MCP result's structured content is the same verdict object as the REST response (parity was verified structured-equal on the recorded full-pass run — see TEST-REPORT.md). Prefer whichever face your client already speaks; do not expect different verdicts from the two faces.

### Read a failing verdict and fix the manifest

The recorded violations run (Worked example 2) returned verdict `CARD_NOT_COMPLETE` with the summary "17 pass, 5 fail, 0 missing of 22 checks across six sections." Repair any failing verdict the same way:

1. **Read `sections` first.** A section is `fail` when any of its checks fails, `insufficient_evidence` when none fails but at least one is `missing`, and `pass` only when all its checks pass. That tells you where to look.
2. **Read the `checks` array.** Each entry is `{section, check, status, evidence}`. Work the `fail` entries first — the `evidence` text states the rule that was breached. In the recorded violations run the failing checks were: `timebox_within_declared_limit`, `disposition_is_a_stated_option`, `no_silent_poc_to_production`, `poc_result_not_claimed_as_production_evidence`, `decision_is_a_stated_option`.
3. **Distinguish `fail` from `missing`.** `fail` = the field was present but false, invalid, or arithmetically/set-wise incoherent — fix the underlying practice or correct the declaration. `missing` = the field was absent — supply the evidence; do not guess a value to make the check pass, because the atom audits declarations, and a declaration you cannot stand behind is worse than a missing one.
4. **Check the computed fields.** On a failing verdict the computed outputs (see *Reference → Output format*) show the re-derived values and the differences, so you can see by how much a declared total, count, or list disagrees before you resubmit.
5. **Fix the manifest and resubmit the whole object.** The atom is stateless per call: there is no partial update, no case to reopen, and no memory of the previous submission. Resubmit the corrected full manifest and read the new verdict.

### Handle a 422 invalid_input

A type violation is not a verdict — the call is rejected before any check runs. The recorded malformed run (Worked example 3) returned HTTP 422 with this body:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "hypothesis",
  "detail": "hypothesis must be an object"
}
```

- `field` names the exact manifest field whose type was wrong (`hypothesis` in the recorded run); `detail` states the type it must be (`"hypothesis must be an object"`).
- Fix that field's type in the manifest (consult the type column of the Input reference), then resubmit. If you sent several wrongly-typed fields, expect to repeat this once per call — the recorded shape reports one `field` per response.
- Do not retry the identical body: a 422 is deterministic for the same input and will not clear on its own. It is also not a rate-limit or auth problem — check the `error` value first: `invalid_input` means the manifest, not the key.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/buyer-test-card` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/buyer-test-card` — tool name `buyer_test_card`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Gateway: https://atoms.pipavia.com, gateway version 1.1.0 at the time of the recorded runs. Key scope: this atom only — a key's scope for one atom never verifies for another (contract.yaml key namespace `buyer_test_card`).

### Input reference

One JSON manifest. Types are taken from SERVICE.md's field table (its preamble states: all fields are booleans unless noted); the evidence `inputSchema` corroborates the top-level object/string/array types. Notes — including must-be-false gates and computed/conditional behaviour — are preserved from SERVICE.md. Fields are grouped as SERVICE.md groups them (by the section that reads them).

#### Carried / top-level (not itself checked)

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `idea` | string | string; carried into the verdict output, not itself checked |

#### Read by section `decision_and_findings`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `decision` | string | string; computed, see below; also carried into the verdict output |
| `findings.memo_written` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `findings.rationale_references_criteria` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `findings.decision_logged` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `findings.not_tested_list_clear` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `findings.adopting_routed_through_full_team_process` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |

#### Read by section `disposition_and_production_boundary`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `disposition` | string | string; computed, see below; also carried into the verdict output |
| `production_boundary.slid_into_production` | boolean | must be `false` to pass — skill red line |
| `production_boundary.claimed_as_production_evidence` | boolean | must be `false` to pass — skill red line |

#### Read by section `hypothesis`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `hypothesis.written` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `hypothesis.single` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `hypothesis.states_capability_under_constraints` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |

#### Read by section `criteria_upfront`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `criteria.success_written_before_start` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `criteria.kill_written_before_start` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `criteria.agreed_by_decision_owner_before_build` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |

#### Read by section `timebox_and_scope`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `timebox.hard_limit_set` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `timebox.limit_days` | number | number; computed, see below |
| `timebox.elapsed_days` | number | number; computed, see below |
| `timebox.scope_limited_to_critical_path` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `timebox.scope_creep_refused_politely` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |

#### Read by section `evidence`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `evidence.from_measurements_tests_or_demo` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `evidence.numbers_over_impressions` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `evidence.stubs_and_mocks_recorded` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |

Container objects (the section objects and any list-of-objects entries above) are objects/arrays as typed; a container sent as the wrong JSON type is a 422 `invalid_input`, not a failing check (see Errors).

### Checks

Every check the atom runs — 22 checks, grouped by section. Ground truth: the `checks` array of the recorded full-pass REST response (Worked example 1), cross-checked against SERVICE.md; the counts agree (22/22). The `evidence` text quoted for each check is the recorded response's own statement of what the check requires.

**Per-check status semantics (all checks):** `pass` — the recorded evidence satisfies the stated requirement; `fail` — the field was present but false/invalid, or a computed condition (arithmetic, set coverage, vocabulary) was not met; `missing` — the field(s) the check reads were absent, so there is no evidence to judge. No `not_applicable` per-check status is returned by this atom in any recorded case.

#### Section `hypothesis` — 3 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `hypothesis_written` | method step 1: one hypothesis is written down |
| `single_hypothesis` | method step 1: the record carries one hypothesis, not several |
| `hypothesis_states_capability_under_constraints` | method step 1: the hypothesis is in the stated form — X can do Y under constraints Z |

#### Section `criteria_upfront` — 3 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `success_criteria_written_before_start` | method step 2 / quality gate: success criteria are written before the start |
| `kill_criteria_written_before_start` | method step 2 / quality gate: kill criteria are written before the start |
| `criteria_agreed_by_decision_owner_before_build` | method step 2: the success and kill criteria are agreed by the decision owner before the build |

#### Section `timebox_and_scope` — 4 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `timebox_hard_limit_set` | method step 3 / red line: a hard timebox limit is set — no unbounded POCs |
| `timebox_within_declared_limit` | method step 3 / quality gate: the elapsed days do not exceed the declared timebox limit in days, the limit is positive, and the elapsed time is not negative — the skill states no numeric cap, so only the declared numbers are compared |
| `scope_limited_to_critical_path` | method step 3: scope is the critical path, nothing more |
| `scope_creep_refused_politely` | quality gate: scope creep is refused politely |

#### Section `disposition_and_production_boundary` — 3 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `disposition_is_a_stated_option` | method step 4: the disposition says which it is — disposable (throwaway by default) or explicitly slated_for_hardening |
| `no_silent_poc_to_production` | red line: no silent POC-to-production gradient — the POC does not slide into production |
| `poc_result_not_claimed_as_production_evidence` | red line: 'it worked in the POC' is never claimed as production evidence |

#### Section `evidence` — 3 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `evidence_from_measurements_tests_or_demo` | method step 5: evidence is measurements, tests, or a demo |
| `evidence_numbers_over_impressions` | method step 5: the evidence is numbers over impressions |
| `stubs_and_mocks_recorded` | method step 5: what was stubbed or mocked is recorded |

#### Section `decision_and_findings` — 6 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `findings_memo_written` | quality gate: a findings memo is written, with decision and evidence |
| `decision_is_a_stated_option` | method step 6: the decision is one of the options the skill names — adopt, adapt, or abandon |
| `decision_rationale_references_criteria` | method step 6: the written rationale references the criteria |
| `decision_logged` | method step 6: the decision is logged |
| `not_tested_list_clear` | quality gate: a clear 'not tested / not included' list is present |
| `adopting_routed_through_full_team_process` | method step 7: if adopting, the work is routed through the full team process (spec, build, test, review) — POCs never slide into production |

#### Computed checks in detail

- **Timebox enforcement (`timebox_within_declared_limit`):** when a timebox limit in days and an elapsed time in days are both declared, the check passes only when the limit is positive, the elapsed time is not negative, and the elapsed time does not exceed the declared limit. The method states **no numeric cap** on how many days a timebox may be, so none is imposed — a 60-day declared limit honoured by the elapsed time passes on its own terms. If either number is absent, the check is missing evidence. The output reports `timebox_limit_days` and `timebox_elapsed_days` (the declared numbers, null when absent) and `timebox_overrun_days` (elapsed minus limit, null when it cannot be computed).
- **Decision vocabulary (`decision_is_a_stated_option`):** a declared `decision` passes only when it is one of the three stated entries — `adopt`, `adapt`, `abandon`. Any other string is present and fails; an absent decision is missing evidence. Validated as a string only, never enum-checked as a type.
- **Disposition vocabulary (`disposition_is_a_stated_option`):** a declared `disposition` passes only when it is one of the two stated entries — `disposable`, `slated_for_hardening`. Any other string is present and fails; an absent disposition is missing evidence. Validated as a string only, never enum-checked as a type.
- **Fixed serialization rule:** the computed overrun is reported as a string with exactly six decimal places — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six decimals. That fixed serialization is what makes the Python and TypeScript outputs byte-identical.

The output also reports `computed_status` over the three computed checks: `within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the three computed checks cannot be completed (SERVICE.md).

### Output format

HTTP 200 with one JSON verdict object (a 422 rejection is the only non-verdict response shape — see Errors). Top-level fields, in the order returned in the recorded responses:

| Field | Meaning |
|---|---|
| `service` | Always `"buyer-test-card"`. |
| `atom_version` | Atom version that produced the verdict (`"0.1.0"` in the recorded runs). |
| `idea` | The manifest's identity field, carried through (null when the manifest did not declare it, as in the recorded violations run for some atoms). |
| `decision` | The manifest's declared `decision`, carried through and also verdict-checked as a computed vocabulary check (see *Checks → Computed checks in detail*); in the recorded full-pass run: `"adopt"` (null when not declared). |
| `disposition` | The manifest's declared `disposition`, carried through and also verdict-checked as a computed vocabulary check (see *Checks → Computed checks in detail*); in the recorded full-pass run: `"disposable"` (null when not declared). |
| `verdict` | One of the verdict values below. |
| `sections` | Object mapping each section name to its section status (`pass` / `fail` / `insufficient_evidence`). |
| `checks` | Array of `{section, check, status, evidence}` — one entry per check, in section order. |
| `computed_status` | `within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null — see the computed-checks note above. |
| `timebox_limit_days` | Computed output field (see *Checks → Computed checks in detail*); in the recorded full-pass run: `10`. Null when it cannot be computed from the declared values, unless SERVICE.md states a different null rule for it. |
| `timebox_elapsed_days` | Computed output field (see *Checks → Computed checks in detail*); in the recorded full-pass run: `5`. Null when it cannot be computed from the declared values, unless SERVICE.md states a different null rule for it. |
| `timebox_overrun_days` | Computed output field (see *Checks → Computed checks in detail*); in the recorded full-pass run: `"-5.000000"`. Null when it cannot be computed from the declared values, unless SERVICE.md states a different null rule for it. |
| `summary` | One-line count, e.g. "22 pass, 0 fail, 0 missing of 22 checks across six sections." |
| `stamp` | Plain-text rendering of the same verdict (display name, identity, verdict, per-section statuses, summary) for human-readable records. |

### Verdict vocabulary

| Value | Kind | Meaning |
|---|---|---|
| `CARD_COMPLETE` | verdict | Every check passes (22/22); the manifest is complete and coherent on the declared evidence. |
| `CARD_NOT_COMPLETE` | verdict | At least one check fails. Failing checks are named in the `checks` array with their evidence text. |
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
| 422 | `invalid_input` | Recorded body (verbatim from the malformed case): `{"ok": false, "error": "invalid_input", "field": "hypothesis", "detail": "hypothesis must be an object"}` — `ok: false`, `error`, `field` (the exact manifest field) and `detail` (the type it must be). Never a verdict. |
| 429 | rate limit | Rate limit exceeded: 60/min, 10,000/day per key (contract.yaml / USER-GUIDE.md). No body shape is recorded in the evidence; back off and retry after the window. |

### Rate limits and pricing status

- Rate limits (contract.yaml): **60 requests per minute per key** and **10,000 requests per day per key**. Contract note: the per-key rate limit is the capacity guard for open public usage; tuned per atom at build-out from measured production cost.
- Pricing (contract.yaml): pricing unit = deliverable; `pricing.rate` is **null** (`rate_status: pending`). **Free during trial — rate pending.** Prices are set only from measured production cost per unit (SERVICE.md).

## Explanation

### What this atom does, in depth

This atom audits one declared buyer-test / POC record against the buyer-test method: one hypothesis, written in the form 'X can do Y under constraints Z'; success and kill criteria written and agreed by the decision owner *before* the build; a hard timebox with scope limited to the critical path and scope creep refused; a stated disposition (disposable by default, or explicitly slated for hardening) with a hard production boundary — the POC must not slide silently into production or be claimed as production evidence; evidence from measurements, tests or demos, with stubs and mocks recorded; and a findings memo whose rationale references the criteria, with the decision logged and the not-tested list clear. It is a completeness and consistency audit of the record, its timebox arithmetic, and its decision/disposition vocabulary.

### How the verdict is decided

The core is deterministic: same manifest in → same verdict out, byte-identically (verified on the recorded repeat call). Each check reads declared field(s) and lands in exactly one of three states:

- **Absent field = missing evidence.** The check is `missing`; its section is `insufficient_evidence` unless another check in it fails; and if nothing anywhere fails, the verdict is `INSUFFICIENT_EVIDENCE`. Missing is not a failure and is never silently treated as `false`.
- **Present but false / invalid = fail.** The check is `fail`, its section is `fail`, and the verdict is the failing verdict — one failing check is enough, however complete the rest of the manifest is. Must-be-false (red-line) fields work the same way in mirror image: present and `true` = fail.
- **Computed checks** re-derive what can be re-derived from the declared values themselves — arithmetic, set coverage, and stated vocabulary only, importing no outside threshold (see *Checks → Computed checks in detail*). A computed check whose inputs are absent is `missing`, not failed; one whose inputs are present but disagree is `fail`.

Section statuses roll up mechanically (`fail` if any check fails, else `insufficient_evidence` if any is missing, else `pass`), and the verdict rolls up the same way across all 22 checks: `CARD_COMPLETE` only when every check passes.

### What it does not do

- It does **not** run the POC, build anything, collect measurements, or verify that a declared value is true.
- It is **not an idea review**: it never decides whether the hypothesis is true, whether the idea is worth pursuing, whether the success/kill criteria are the right ones, whether the evidence actually supports the decision, or whether the stated decision is wise. A card can be complete on the declared evidence even if the underlying POC was poorly run.
- No numeric cap on the timebox (the method's 'days, not weeks' states no number, so none is invented); no grading of evidence quality beyond the declared 'numbers over impressions' step; no decision or disposition vocabulary beyond the options the method itself names; no live verification of any declared fact.

The atom sells its deliverable — the bounded judgment artifact (the verdict object) — never the underlying knowledge or method itself.

### Buyer and use context

First buyer hypothesis (SERVICE.md, from register data; not yet market-tested): teams and agents working in Thinking & decisions who need this deliverable on demand. Named self-use: **Buyer test gates every offer** — Wright is an internal caller (zero price, metered to the internal cost ledger).

## Role views

### For integrators (Users)

- Start with [USER-GUIDE.md](USER-GUIDE.md) for the quick start, then the Tutorial and How-to guides above. One call = one manifest in, one verdict object out; there is no session, upload, or follow-up state to manage.
- Integrate on the REST face (`POST /v1/buyer-test-card`) or the MCP face (tool `buyer_test_card`) — they return the same verdict object and were parity-verified. Branch on `verdict` first, then on per-check `status` for repair guidance; treat HTTP 422 as a client bug (fix the type named in `field`), 401/403 as key problems, and 429 as back-off.
- Cache by manifest content if you cache at all: the verdict is a pure function of the manifest, so an identical manifest never needs a second paid call.

### For developers

- Manifest authoring: type every field exactly as the Input reference states — booleans as JSON booleans (not `"true"`), numbers as JSON numbers, lists as arrays of strings. A wrong type is a 422 at the gateway, not a failing check; a wrong *value* is a failing check. Vocabulary and coverage fields are validated as strings only and judged as verdict checks, so a misspelled vocabulary entry fails its check rather than erroring.
- Determinism: the core is a deterministic Python oracle with a TypeScript port, parity-proven (TEST-REPORT.md); the recorded REST repeat was byte-identical and MCP structured content was deep-equal to REST. Any fixed serialization rule for computed outputs is stated in *Checks → Computed checks in detail* where SERVICE.md states one.
- Source and tests: implementation in `src/buyer_test_card.py`, tests in `tests/test_buyer_test_card.py` (same directory as this document). Fixes land in the bound skill first, then the atom re-deploys and must pass regression before its version bumps (contract.yaml binding rule R1).

### For ops

- Endpoints: REST `POST https://atoms.pipavia.com/v1/buyer-test-card` and MCP `POST https://atoms.pipavia.com/mcp/buyer-test-card` on gateway https://atoms.pipavia.com (v1.1.0 at recorded-run time). Status: live — release candidate, one-week RC soak to 2026-11-22; treat verdict-shape changes during the soak as RC incidents, not silent deploys.
- Keys and scope: per-user, per-atom issuance (`POST /v1/keys`); a key's scope for this atom is namespace `buyer_test_card` and never verifies for another atom. Watch 403s for mis-issued keys and 401s for missing/invalid headers.
- Limits and monitoring: 60/min and 10,000/day per key; alert on 429 volume (client retry storms), on 422 rate (a client shipping wrongly-typed manifests), and on any drift between REST and MCP verdicts for identical manifests (parity is a verified property — drift is a defect). Pricing is not yet metered for revenue: rate pending, free during trial.

## Worked examples

Provenance: recorded 2026-11-16T01:18:27.465674+00:00 against gateway v1.1.0, external verification lane, source `verification/work/buyer-test-card/evidence.json`. The three examples below are that evidence's recorded cases: each shows the case's `input` and the REST execution's `response_text`, reproduced verbatim as JSON values (pretty-printed with indent 2 for readability; verified mechanically after writing — see the checklist).

### Example 1 — full-pass

Recorded expectation: HTTP 200, outcome `CARD_COMPLETE`. Recorded REST status: 200.

Input:

```json
{
  "idea": "AI-driven inventory forecasting",
  "decision": "adopt",
  "disposition": "disposable",
  "hypothesis": {
    "written": true,
    "single": true,
    "states_capability_under_constraints": true
  },
  "criteria": {
    "success_written_before_start": true,
    "kill_written_before_start": true,
    "agreed_by_decision_owner_before_build": true
  },
  "timebox": {
    "hard_limit_set": true,
    "limit_days": 10,
    "elapsed_days": 5,
    "scope_limited_to_critical_path": true,
    "scope_creep_refused_politely": true
  },
  "evidence": {
    "from_measurements_tests_or_demo": true,
    "numbers_over_impressions": true,
    "stubs_and_mocks_recorded": true
  },
  "production_boundary": {
    "slid_into_production": false,
    "claimed_as_production_evidence": false
  },
  "findings": {
    "memo_written": true,
    "rationale_references_criteria": true,
    "decision_logged": true,
    "not_tested_list_clear": true,
    "adopting_routed_through_full_team_process": true
  }
}
```

Response (REST `response_text`):

```json
{
  "service": "buyer-test-card",
  "atom_version": "0.1.0",
  "idea": "AI-driven inventory forecasting",
  "decision": "adopt",
  "disposition": "disposable",
  "verdict": "CARD_COMPLETE",
  "sections": {
    "hypothesis": "pass",
    "criteria_upfront": "pass",
    "timebox_and_scope": "pass",
    "disposition_and_production_boundary": "pass",
    "evidence": "pass",
    "decision_and_findings": "pass"
  },
  "checks": [
    {
      "section": "hypothesis",
      "check": "hypothesis_written",
      "status": "pass",
      "evidence": "method step 1: one hypothesis is written down"
    },
    {
      "section": "hypothesis",
      "check": "single_hypothesis",
      "status": "pass",
      "evidence": "method step 1: the record carries one hypothesis, not several"
    },
    {
      "section": "hypothesis",
      "check": "hypothesis_states_capability_under_constraints",
      "status": "pass",
      "evidence": "method step 1: the hypothesis is in the stated form \u2014 X can do Y under constraints Z"
    },
    {
      "section": "criteria_upfront",
      "check": "success_criteria_written_before_start",
      "status": "pass",
      "evidence": "method step 2 / quality gate: success criteria are written before the start"
    },
    {
      "section": "criteria_upfront",
      "check": "kill_criteria_written_before_start",
      "status": "pass",
      "evidence": "method step 2 / quality gate: kill criteria are written before the start"
    },
    {
      "section": "criteria_upfront",
      "check": "criteria_agreed_by_decision_owner_before_build",
      "status": "pass",
      "evidence": "method step 2: the success and kill criteria are agreed by the decision owner before the build"
    },
    {
      "section": "timebox_and_scope",
      "check": "timebox_hard_limit_set",
      "status": "pass",
      "evidence": "method step 3 / red line: a hard timebox limit is set \u2014 no unbounded POCs"
    },
    {
      "section": "timebox_and_scope",
      "check": "timebox_within_declared_limit",
      "status": "pass",
      "evidence": "method step 3 / quality gate: the elapsed days do not exceed the declared timebox limit in days, the limit is positive, and the elapsed time is not negative \u2014 the skill states no numeric cap, so only the declared numbers are compared"
    },
    {
      "section": "timebox_and_scope",
      "check": "scope_limited_to_critical_path",
      "status": "pass",
      "evidence": "method step 3: scope is the critical path, nothing more"
    },
    {
      "section": "timebox_and_scope",
      "check": "scope_creep_refused_politely",
      "status": "pass",
      "evidence": "quality gate: scope creep is refused politely"
    },
    {
      "section": "disposition_and_production_boundary",
      "check": "disposition_is_a_stated_option",
      "status": "pass",
      "evidence": "method step 4: the disposition says which it is \u2014 disposable (throwaway by default) or explicitly slated_for_hardening"
    },
    {
      "section": "disposition_and_production_boundary",
      "check": "no_silent_poc_to_production",
      "status": "pass",
      "evidence": "red line: no silent POC-to-production gradient \u2014 the POC does not slide into production"
    },
    {
      "section": "disposition_and_production_boundary",
      "check": "poc_result_not_claimed_as_production_evidence",
      "status": "pass",
      "evidence": "red line: 'it worked in the POC' is never claimed as production evidence"
    },
    {
      "section": "evidence",
      "check": "evidence_from_measurements_tests_or_demo",
      "status": "pass",
      "evidence": "method step 5: evidence is measurements, tests, or a demo"
    },
    {
      "section": "evidence",
      "check": "evidence_numbers_over_impressions",
      "status": "pass",
      "evidence": "method step 5: the evidence is numbers over impressions"
    },
    {
      "section": "evidence",
      "check": "stubs_and_mocks_recorded",
      "status": "pass",
      "evidence": "method step 5: what was stubbed or mocked is recorded"
    },
    {
      "section": "decision_and_findings",
      "check": "findings_memo_written",
      "status": "pass",
      "evidence": "quality gate: a findings memo is written, with decision and evidence"
    },
    {
      "section": "decision_and_findings",
      "check": "decision_is_a_stated_option",
      "status": "pass",
      "evidence": "method step 6: the decision is one of the options the skill names \u2014 adopt, adapt, or abandon"
    },
    {
      "section": "decision_and_findings",
      "check": "decision_rationale_references_criteria",
      "status": "pass",
      "evidence": "method step 6: the written rationale references the criteria"
    },
    {
      "section": "decision_and_findings",
      "check": "decision_logged",
      "status": "pass",
      "evidence": "method step 6: the decision is logged"
    },
    {
      "section": "decision_and_findings",
      "check": "not_tested_list_clear",
      "status": "pass",
      "evidence": "quality gate: a clear 'not tested / not included' list is present"
    },
    {
      "section": "decision_and_findings",
      "check": "adopting_routed_through_full_team_process",
      "status": "pass",
      "evidence": "method step 7: if adopting, the work is routed through the full team process (spec, build, test, review) \u2014 POCs never slide into production"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "timebox_limit_days": 10,
  "timebox_elapsed_days": 5,
  "timebox_overrun_days": "-5.000000",
  "summary": "22 pass, 0 fail, 0 missing of 22 checks across six sections.",
  "stamp": "BUYER-TEST CARD\nidea: AI-driven inventory forecasting\nVERDICT: CARD_COMPLETE\n  hypothesis                           pass\n  criteria_upfront                     pass\n  timebox_and_scope                    pass\n  disposition_and_production_boundary  pass\n  evidence                             pass\n  decision_and_findings                pass\n22 pass, 0 fail, 0 missing of 22 checks across six sections."
}
```

### Example 2 — violations

Recorded expectation: HTTP 200, outcome `CARD_NOT_COMPLETE`. Recorded REST status: 200.

Input:

```json
{
  "idea": "Bad POC",
  "decision": "maybe",
  "disposition": "production-ready",
  "hypothesis": {
    "written": true,
    "single": true,
    "states_capability_under_constraints": true
  },
  "criteria": {
    "success_written_before_start": true,
    "kill_written_before_start": true,
    "agreed_by_decision_owner_before_build": true
  },
  "timebox": {
    "hard_limit_set": true,
    "limit_days": 5,
    "elapsed_days": 10,
    "scope_limited_to_critical_path": true,
    "scope_creep_refused_politely": true
  },
  "evidence": {
    "from_measurements_tests_or_demo": true,
    "numbers_over_impressions": true,
    "stubs_and_mocks_recorded": true
  },
  "production_boundary": {
    "slid_into_production": true,
    "claimed_as_production_evidence": true
  },
  "findings": {
    "memo_written": true,
    "rationale_references_criteria": true,
    "decision_logged": true,
    "not_tested_list_clear": true,
    "adopting_routed_through_full_team_process": true
  }
}
```

Response (REST `response_text`):

```json
{
  "service": "buyer-test-card",
  "atom_version": "0.1.0",
  "idea": "Bad POC",
  "decision": "maybe",
  "disposition": "production-ready",
  "verdict": "CARD_NOT_COMPLETE",
  "sections": {
    "hypothesis": "pass",
    "criteria_upfront": "pass",
    "timebox_and_scope": "fail",
    "disposition_and_production_boundary": "fail",
    "evidence": "pass",
    "decision_and_findings": "fail"
  },
  "checks": [
    {
      "section": "hypothesis",
      "check": "hypothesis_written",
      "status": "pass",
      "evidence": "method step 1: one hypothesis is written down"
    },
    {
      "section": "hypothesis",
      "check": "single_hypothesis",
      "status": "pass",
      "evidence": "method step 1: the record carries one hypothesis, not several"
    },
    {
      "section": "hypothesis",
      "check": "hypothesis_states_capability_under_constraints",
      "status": "pass",
      "evidence": "method step 1: the hypothesis is in the stated form \u2014 X can do Y under constraints Z"
    },
    {
      "section": "criteria_upfront",
      "check": "success_criteria_written_before_start",
      "status": "pass",
      "evidence": "method step 2 / quality gate: success criteria are written before the start"
    },
    {
      "section": "criteria_upfront",
      "check": "kill_criteria_written_before_start",
      "status": "pass",
      "evidence": "method step 2 / quality gate: kill criteria are written before the start"
    },
    {
      "section": "criteria_upfront",
      "check": "criteria_agreed_by_decision_owner_before_build",
      "status": "pass",
      "evidence": "method step 2: the success and kill criteria are agreed by the decision owner before the build"
    },
    {
      "section": "timebox_and_scope",
      "check": "timebox_hard_limit_set",
      "status": "pass",
      "evidence": "method step 3 / red line: a hard timebox limit is set \u2014 no unbounded POCs"
    },
    {
      "section": "timebox_and_scope",
      "check": "timebox_within_declared_limit",
      "status": "fail",
      "evidence": "method step 3 / quality gate: the elapsed days do not exceed the declared timebox limit in days, the limit is positive, and the elapsed time is not negative \u2014 the skill states no numeric cap, so only the declared numbers are compared"
    },
    {
      "section": "timebox_and_scope",
      "check": "scope_limited_to_critical_path",
      "status": "pass",
      "evidence": "method step 3: scope is the critical path, nothing more"
    },
    {
      "section": "timebox_and_scope",
      "check": "scope_creep_refused_politely",
      "status": "pass",
      "evidence": "quality gate: scope creep is refused politely"
    },
    {
      "section": "disposition_and_production_boundary",
      "check": "disposition_is_a_stated_option",
      "status": "fail",
      "evidence": "method step 4: the disposition says which it is \u2014 disposable (throwaway by default) or explicitly slated_for_hardening"
    },
    {
      "section": "disposition_and_production_boundary",
      "check": "no_silent_poc_to_production",
      "status": "fail",
      "evidence": "red line: no silent POC-to-production gradient \u2014 the POC does not slide into production"
    },
    {
      "section": "disposition_and_production_boundary",
      "check": "poc_result_not_claimed_as_production_evidence",
      "status": "fail",
      "evidence": "red line: 'it worked in the POC' is never claimed as production evidence"
    },
    {
      "section": "evidence",
      "check": "evidence_from_measurements_tests_or_demo",
      "status": "pass",
      "evidence": "method step 5: evidence is measurements, tests, or a demo"
    },
    {
      "section": "evidence",
      "check": "evidence_numbers_over_impressions",
      "status": "pass",
      "evidence": "method step 5: the evidence is numbers over impressions"
    },
    {
      "section": "evidence",
      "check": "stubs_and_mocks_recorded",
      "status": "pass",
      "evidence": "method step 5: what was stubbed or mocked is recorded"
    },
    {
      "section": "decision_and_findings",
      "check": "findings_memo_written",
      "status": "pass",
      "evidence": "quality gate: a findings memo is written, with decision and evidence"
    },
    {
      "section": "decision_and_findings",
      "check": "decision_is_a_stated_option",
      "status": "fail",
      "evidence": "method step 6: the decision is one of the options the skill names \u2014 adopt, adapt, or abandon"
    },
    {
      "section": "decision_and_findings",
      "check": "decision_rationale_references_criteria",
      "status": "pass",
      "evidence": "method step 6: the written rationale references the criteria"
    },
    {
      "section": "decision_and_findings",
      "check": "decision_logged",
      "status": "pass",
      "evidence": "method step 6: the decision is logged"
    },
    {
      "section": "decision_and_findings",
      "check": "not_tested_list_clear",
      "status": "pass",
      "evidence": "quality gate: a clear 'not tested / not included' list is present"
    },
    {
      "section": "decision_and_findings",
      "check": "adopting_routed_through_full_team_process",
      "status": "pass",
      "evidence": "method step 7: if adopting, the work is routed through the full team process (spec, build, test, review) \u2014 POCs never slide into production"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "timebox_limit_days": 5,
  "timebox_elapsed_days": 10,
  "timebox_overrun_days": "5.000000",
  "summary": "17 pass, 5 fail, 0 missing of 22 checks across six sections.",
  "stamp": "BUYER-TEST CARD\nidea: Bad POC\nVERDICT: CARD_NOT_COMPLETE\n  hypothesis                           pass\n  criteria_upfront                     pass\n  timebox_and_scope                    fail\n  disposition_and_production_boundary  fail\n  evidence                             pass\n  decision_and_findings                fail\n17 pass, 5 fail, 0 missing of 22 checks across six sections."
}
```

### Example 3 — malformed

Recorded expectation: HTTP 422, no verdict (rejected as invalid input). Recorded REST status: 422.

Input:

```json
{
  "idea": "Malformed test",
  "hypothesis": "this should be an object, not a string"
}
```

Response (REST `response_text`):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "hypothesis",
  "detail": "hypothesis must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes; Developers Yes; Ops Yes; Regulators: N/A — the verdict is a completeness audit of a declared POC record; no regulated domain is involved and the verdict is not compliance or audit evidence. |
| Checks named: documented / recorded | 22 / 22 (from the recorded full-pass REST `checks` array, cross-checked against SERVICE.md) |
| Verdict vocabulary complete | Yes — all 3 verdicts (`CARD_COMPLETE`, `CARD_NOT_COMPLETE`, `INSUFFICIENT_EVIDENCE`), `computed_status` values including null, section statuses and per-check statuses |
| Input reference typed | Yes — 24 fields, each with a type from SERVICE.md's field table, grouped as SERVICE.md groups them, gates/conditionals preserved in Notes |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed from this file and compared as JSON values against `verification/work/buyer-test-card/evidence.json` after writing; all matched |
| Errors documented from evidence only | Yes — 422 shape verbatim from the recorded malformed case; 401/403/429 documented at the status/meaning level evidenced in USER-GUIDE.md and contract.yaml, with no invented payload |

