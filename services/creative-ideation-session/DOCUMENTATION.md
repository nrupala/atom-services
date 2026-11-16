# Creative ideation session — `creative-ideation-session`

**Display name:** Creative ideation session · **Slug:** `creative-ideation-session` · **Deliverable type:** DELIVERABLE · **Atom version:** 0.1.0 · **Status:** live — release candidate (one-week RC soak to 2026-11-22)

**Quick start:** [USER-GUIDE.md](USER-GUIDE.md) · **Verification evidence:** [TEST-REPORT.md](TEST-REPORT.md)

## Tutorial

A first call, walked through end to end. This tutorial narrates the recorded full-pass trial run for this atom; the exact request and response are reproduced verbatim under [Worked examples](#worked-examples), example 1.

1. **Get a key.** Sign up and issue a gateway key scoped to `creative-ideation-session` (the full flow is in the first how-to guide below). Every call sends it as `Authorization: Bearer <key>`.
2. **Assemble the manifest.** Build one JSON object declaring the evidence the atom checks. In the recorded run the session_title is `Q3 Product Strategy`. Fill every group the Input reference lists — an absent field is not a neutral omission: it is recorded as missing evidence and caps the verdict at `INSUFFICIENT_EVIDENCE`.
3. **Send it.** `POST https://atoms.pipavia.com/v1/creative-ideation-session` with the manifest as the body (or call the MCP tool `creative_ideation_session` with the same object as its arguments).
4. **Read the verdict first.** The recorded response returns HTTP 200 with verdict `SESSION_COMPLETE` — the strongest verdict this atom gives. Its `summary` reads: "24 pass, 0 fail, 0 missing of 24 checks across six sections."
5. **Read the sections, then the checks.** All 6 sections report `pass` (`brief_and_preparation`, `capture_and_generation`, `divergence_and_methods`, `idea_pool_and_volume`, `selection_and_convergence`, `shortlist_and_ship`), and all 24 entries in `checks` report `status: pass`, each carrying the `evidence` string that states the requirement it checked.
6. **Read the computed fields.** The record declares a target of 10 ideas and 12 captured, 2 duplicates removed leaving 10 unique, and a shortlist of 3 — so the volume, dedup-arithmetic and shortlist-within-pool computations all agree, and both divergence methods used (`brainstorm`, `scamper`) are among the five the skill names. The response's `computed_status` is `within_stated_limits_on_declared_evidence`, and its `stamp` field carries a plain-text rendering of the same verdict for logs and tickets.
7. **Keep the response.** It is the deliverable: one bounded judgment artifact for that one manifest. Same manifest in → same response out (the verification battery confirmed byte-identical repeat REST responses and MCP/REST parity for the full-pass manifest).

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "creative-ideation-session"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call:

```bash
curl -X POST https://atoms.pipavia.com/v1/creative-ideation-session \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -d @manifest.json
```

A well-formed manifest returns HTTP 200 and a verdict body (see Reference — Output format). Authentication and shape failures return the error shapes listed under Reference — Errors, never a verdict.

### Call via MCP

POST to `https://atoms.pipavia.com/mcp/creative-ideation-session` with the same `Authorization: Bearer <key>` header and call the tool named `creative_ideation_session`. The `tools/call` arguments are the manifest object itself — the same JSON you would send as the REST body. The MCP result's structured content is the same report core as the REST response (parity was verified in the recorded battery: the full-pass manifest's MCP `structuredContent` was deep-equal to the REST artifact).

### Read a failing verdict and fix the manifest

A failing verdict is still HTTP 200 — it is a result, not a transport error. Work it in this order:

1. **Read `verdict`.** `SESSION_NOT_COMPLETE` means at least one check failed. `INSUFFICIENT_EVIDENCE` means nothing failed but evidence is missing. The passing verdict here is `SESSION_COMPLETE`.
2. **Read `sections`.** A section reports `fail` if any of its checks failed, `insufficient_evidence` if none failed but at least one is missing, and `pass` only when all of its checks pass. Start with the failing sections.
3. **Read `checks`.** Filter to `status: fail` for breaches and `status: missing` for gaps. Each entry names its `section`, its `check`, and an `evidence` string stating the requirement. `fail` means the field was present but false, invalid, or arithmetically inconsistent; `missing` means the field (or a value a computation needs) was absent.
4. **Fix the underlying facts, then resubmit.** In the recorded violations run the failing checks were exactly: `methods_used_are_stated_methods`, `volume_meets_declared_target`, `shortlist_within_unique_pool` (21 pass, 3 fail, 0 missing of 24 checks across six sections.) In the recorded violations run (`Bad Math Session`) the method list contained `invalid_method`, only 5 of the targeted 10 ideas were captured, and the shortlist of 10 exceeded what the pool supports on the declared numbers. Fixing a failing verdict means fixing the session record's facts — use a stated method, capture at least the declared target, keep the shortlist at or below the unique pool — and resubmitting; it does not mean editing numbers until they pass unless the underlying session record has actually changed.
5. **Do not confuse a verdict with a 422.** A failing verdict means the manifest was well-typed and was judged. A 422 means the manifest was not well-typed and was never judged — see the next guide.

### Handle a 422 invalid_input

A type violation returns HTTP 422 with a body naming the offending field — it never returns a verdict. The recorded malformed run for this atom sent a value of the wrong type and received:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "brief",
  "detail": "brief must be an object"
}
```

To handle it: read `field` (`brief`) and `detail` ("brief must be an object"), correct the value's type in your manifest at exactly that path, and resubmit the whole manifest. Do not drop the field to silence the error — an absent field is missing evidence and caps the verdict at `INSUFFICIENT_EVIDENCE`. One 422 reports one field; if several fields are mistyped, fix and resubmit iteratively.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/creative-ideation-session` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/creative-ideation-session` — tool name `creative_ideation_session`; `tools/call` arguments = the manifest object.
- **Key issuance:** `POST /v1/signup` (email; sign-in link emailed), then `POST /v1/keys` with `{"atom": "creative-ideation-session"}` after opening the link. A key for one atom never verifies for another: scope is per atom.

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table (which states: all fields are booleans unless noted) and corroborated by `contract.yaml` and the recorded MCP `inputSchema`. Fields are grouped below exactly as SERVICE.md groups them (by the section that reads them). An absent field = missing evidence; a present-but-false/invalid field = a failed check, except where a note says otherwise.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `session_title` | string | (string; carried into the verdict output, not itself checked) |

#### Read by: brief_and_preparation

| Field | Type | Notes |
|---|---|---|
| `brief.written` | boolean | — |
| `brief.goal_or_question_stated` | boolean | — |
| `brief.constraints_declared` | boolean | — |
| `preparation.scheduled_in_advance` | boolean | — |
| `preparation.prepared_with_inputs_ready` | boolean | — |

#### Read by: capture_and_generation

| Field | Type | Notes |
|---|---|---|
| `capture.capture_system_used` | boolean | — |
| `capture.all_ideas_captured` | boolean | — |
| `capture.no_judging_at_capture` | boolean | — |
| `generation.editing_separated_from_generating` | boolean | — |
| `generation.small_reps_or_low_start_bar_used` | boolean | — |

#### Read by: divergence_and_methods

| Field | Type | Notes |
|---|---|---|
| `divergence.diverged_before_converging` | boolean | — |
| `divergence.methods_used` | array | (list of strings; computed, see below; also carried into the verdict output, with its count) |
| `divergence.constraints_used_as_prompt` | boolean | — |

#### Read by: idea_pool_and_volume

| Field | Type | Notes |
|---|---|---|
| `idea_pool.target_idea_count` | number | (number; computed, see below) |
| `idea_pool.total_ideas_captured` | number | (number; computed, see below) |
| `idea_pool.dedup_performed` | boolean | — |
| `idea_pool.duplicates_removed` | number | (number; computed, see below) |
| `idea_pool.unique_ideas_after_dedup` | number | (number; computed, see below) |
| `idea_pool.ideas_clustered_or_grouped` | boolean | — |

#### Read by: selection_and_convergence

| Field | Type | Notes |
|---|---|---|
| `selection.criteria_written_before_scoring` | boolean | — |
| `selection.criteria_applied_to_all_unique_ideas` | boolean | — |
| `selection.scoring_only_after_divergence_complete` | boolean | — |
| `shortlist.shortlist_count` | number | (number; computed, see below) |

#### Read by: shortlist_and_ship

| Field | Type | Notes |
|---|---|---|
| `shortlist.rationale_written` | boolean | — |
| `shortlist.rationale_references_criteria` | boolean | — |
| `outcome.shared_for_feedback` | boolean | — |

Total typed input fields documented: 27 (each SERVICE.md field-table row; nested row-entry fields are listed individually where SERVICE.md lists them).

### Checks

All 24 checks, named exactly as in the recorded full-pass REST response's `checks` array (cross-checked against SERVICE.md; the counts agree). For each check, the Requirement column is the recorded `evidence` string, which states what must hold to pass.

**Per-check status semantics (all checks):** `pass` = the requirement held on the declared evidence; `fail` = the field was present but false/invalid, or a computed comparison did not hold; `missing` = the field, list, or a value a computation needs was absent, so the check could not be evaluated. There is no separate not-applicable status in the recorded responses: where a check is conditional and its gate is not declared, it is recorded as `pass` with evidence stating that no such case was declared (see the notes on the individual conditional checks, where this atom has them).

#### Section: brief_and_preparation

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `brief_written` | the session record carries a written brief | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `brief_goal_or_question_stated` | the brief states the goal or question the session works on | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `constraints_declared` | the brief declares the session's constraints — a tight box forces invention | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `session_scheduled_in_advance` | habits over moods: the session is created on a schedule, not when inspired | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `prepared_with_inputs_ready` | the session shows up prepared — inputs ready to draw from the well | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
#### Section: capture_and_generation

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `capture_system_used` | capture everything: an idea-capture system is used — raw ideas are perishable | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `all_ideas_captured` | capture everything: all raw ideas from the session are captured | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `no_judging_at_capture` | never judge at the moment of capture | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `editing_separated_from_generating` | separate drafting from editing — editing never happens while generating | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `small_reps_or_low_start_bar_used` | beat the resistance: the bar to start is lowered or the work is done in small reps | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
#### Section: divergence_and_methods

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `diverged_before_converging` | diverge, then converge: the session diverges widely before any convergence | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `methods_used_are_stated_methods` | diverge step: every method used is one the skill names — brainstorm, scamper, analogies, combining_distant_domains, or what_if — and at least one method is used; the skill requires no particular method and no minimum count beyond that | Computed. Pass requires a non-empty declared `divergence.methods_used` list whose every entry is one of `brainstorm`, `scamper`, `analogies`, `combining_distant_domains`, `what_if`. Any other entry fails; absent list is `missing`. Membership is a verdict check, not a type error. |
| `constraints_used_as_prompt` | constraints help: the declared constraints are used as a prompt for invention | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
#### Section: idea_pool_and_volume

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `volume_meets_declared_target` | volume precedes quality: the captured idea count meets the caller-declared target, the target is positive, and the captured count is not negative — the skill states no number for 'many', so only the declared numbers are compared | Computed. Pass requires declared captured ≥ declared target, target positive, captured not negative. The skill states no number for 'many', so no minimum beyond the caller's own target is imposed. Absent number is `missing`. |
| `dedup_performed` | the idea pool is deduplicated before selection | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `dedup_arithmetic_consistent` | the declared unique-after-dedup count equals the declared captured total minus the declared duplicates removed, with no negative counts and no more duplicates removed than ideas captured | Computed. Pass requires declared unique = declared captured − declared duplicates removed, no negative counts, duplicates not exceeding captured. Absent number is `missing`. |
| `ideas_clustered_or_grouped` | the deduplicated idea pool is clustered or grouped before selection | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
#### Section: selection_and_convergence

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `selection_criteria_written_before_scoring` | the selection criteria are written before any idea is scored | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `criteria_applied_to_all_unique_ideas` | the declared criteria are applied to all unique ideas, not only to favourites | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `scoring_only_after_divergence_complete` | diverge, then converge: scoring starts only after divergence is complete | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `shortlist_within_unique_pool` | the declared shortlist holds at least one idea and does not exceed the declared unique-after-dedup pool | Computed. Pass requires 1 ≤ declared shortlist ≤ declared unique-after-dedup pool. No shortlist size or ratio beyond that is imposed. Absent number is `missing`. |
#### Section: shortlist_and_ship

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `shortlist_rationale_written` | a written rationale for the shortlist is recorded | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `shortlist_rationale_references_criteria` | the shortlist rationale references the selection criteria declared before scoring | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `shared_for_feedback` | ship: the session's output is finished and shared — real feedback only arrives after shipping; perfectionism that prevents shipping is refused | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |

### Output format

HTTP 200 returns one JSON object. Fields observed in the recorded full-pass response, in recorded order:

| Field | Type (as recorded) | Meaning |
|---|---|---|
| `service` | string | Atom slug. |
| `atom_version` | string | Atom version that produced the verdict. |
| `session_title` | string | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `methods_used` | array | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `verdict` | string | The verdict (see Verdict vocabulary). |
| `sections` | object | Per-section statuses keyed by section name. |
| `checks` | array | Array of `{section, check, status, evidence}` objects — one per check. |
| `computed_status` | string | `within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when a computed check cannot be completed. |
| `target_idea_count` | number | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `total_ideas_captured` | number | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `volume_gap_ideas` | string | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `duplicates_removed` | number | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `unique_ideas_after_dedup` | number | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `dedup_discrepancy_ideas` | string | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `shortlist_count` | number | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `methods_used_count` | number | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `summary` | string | One-line pass/fail/missing count summary. |
| `stamp` | string | Plain-text rendering of the verdict, sections and summary. |

Computed numeric fields follow the fixed serialization rule stated in SERVICE.md (fixed-decimal strings where SERVICE.md specifies them), shared by both implementations so repeat calls are byte-identical.

### Verdict vocabulary

- **`SESSION_COMPLETE`** — Every check passes (24 pass, 0 fail, 0 missing of 24 checks across six sections.) The declared evidence is complete and consistent with the bound skill's method, quality gates and red lines.
- **`SESSION_NOT_COMPLETE`** — At least one check fails. The failing checks name the breached requirement and the evidence against it.
- **`INSUFFICIENT_EVIDENCE`** — Nothing failed, but at least one check is `missing`. The missing checks say exactly what to supply.

- **Section statuses:** `pass` (all checks in the section pass) · `fail` (at least one check in the section fails) · `insufficient_evidence` (no check fails but at least one is missing).
- **Per-check statuses:** `pass` · `fail` · `missing` (see Checks). No other per-check status occurs in the recorded responses; conditional checks that do not apply are recorded as `pass`, as documented above.
- **`computed_status` values:** `within_stated_limits_on_declared_evidence` (every computed check that could be completed held) · `outside_stated_limits_on_declared_evidence` (at least one computed check failed) · `null` (at least one computed check could not be completed).

### Errors

Only the shapes evidenced in the repo/gateway docs are listed; no other error payload is documented, and none should be assumed.

- **401 — unauthenticated:** missing or invalid key (USER-GUIDE.md error line). No error body shape is evidenced in the repo for 401; do not assume one. Fix: send a valid key as `Authorization: Bearer <key>`.
- **403 — scope:** the key lacks this atom's scope (USER-GUIDE.md error line). No error body shape is evidenced in the repo for 403; do not assume one. Fix: issue this atom's scope on your key via `POST /v1/keys`.
- **422 — `invalid_input`:** a field has the wrong type. Recorded body shape (verbatim from the recorded malformed run):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "brief",
  "detail": "brief must be an object"
}
```

  Here `field` is `brief` and `detail` is "brief must be an object". A 422 never carries a verdict.
- **429 — rate limit:** the per-key rate limit was exceeded (60/min, 10,000/day per key; USER-GUIDE.md and `contract.yaml`). No error body shape is evidenced in the repo for 429; do not assume one. Fix: slow down and retry within the limits.

### Rate limits + pricing status

- **Rate limits (from `contract.yaml`):** 60 requests per key per minute; 10,000 requests per key per day. Status note in the contract: SPEC default — the per-key rate limit is the capacity guard for open public usage; tuned per atom at build-out from measured production cost.
- **Pricing:** unit = tokens; `pricing.rate` is null (rate_status: pending). **Free during trial — rate pending.** No price is set; per SERVICE.md, prices are set only from measured production cost per unit.

## Explanation

This atom is a deterministic completeness-and-consistency audit of a **declared** creative-ideation session record: brief and preparation, capture and generation, divergence and methods, idea pool and volume, selection and convergence, and shortlist and shipping — 24 checks across six sections. Four checks are computed from the declared values. Volume is judged only against the caller-declared target, because the skill says to generate many ideas but states no number for 'many'. Dedup arithmetic must close: declared unique ideas must equal declared captured minus declared duplicates removed, with no negative counts. The shortlist must hold at least one idea and no more than the unique pool; the skill states no shortlist size or ratio, so none is imposed. Every divergence method used must be one of the five the skill names, with at least one used; no particular method is mandatory.

The verdict is decided mechanically. Each check ends `pass`, `fail`, or `missing`. Any `fail` makes the verdict `SESSION_NOT_COMPLETE`. Otherwise any `missing` makes it `INSUFFICIENT_EVIDENCE`. Only when all 24 checks pass is the verdict `SESSION_COMPLETE`. Computed differences are serialized as strings with exactly six decimal places by a fixed round-half-up rule shared by both implementations, which is what makes repeat calls byte-identical.

A complete verdict means the declared record is complete and internally consistent — it does **not** mean the session was well run or its ideas are any good. The atom does not run the session, generate ideas, facilitate anything, or verify that a declared value is true. It never grades idea quality or originality, never decides whether the brief, constraints, criteria or shortlist choices were the right ones, and never judges whether a method was applied skilfully. Thresholds the skill does not state are declined, not invented: no minimum idea count, no session duration, no number of selection criteria, no scoring scale or pass mark, and no deadline for sharing the output.

**Buyer / use context.** Buyers are teams and agents doing content and product ideation who want a repeatable completeness check on every session record, bought per use. The house's own content and product ideation workflow is an internal caller. What is sold is the deliverable — the verdict with its per-check evidence and computed volume/dedup figures — never the underlying ideation knowledge itself.

## Role views

### For integrators (Users)

Integrate against the two endpoints above with one scoped key per atom. Treat HTTP 200 as a judged result (read `verdict`, then `sections`, then `checks`), HTTP 422 as a client-side type bug (read `field`/`detail`, fix, resubmit), and 401/403/429 as auth/scope/rate problems respectively. Cache nothing about a verdict across manifests: the verdict is a pure function of the manifest you sent, so re-send after any manifest change. The worked examples below are real recorded request/response pairs — use example 1 as your golden-path fixture and example 3 as your 422-handling fixture.

### For developers

Manifest authoring: declare facts, do not target the verdict — computed checks re-derive totals, coverage and vocabulary membership from the declared values themselves, so inconsistent declarations fail on their own arithmetic. Determinism: the core is deterministic (Python oracle and TypeScript port, parity-proven locally per SERVICE.md); the same manifest returns a byte-identical REST response, and MCP structured content equals the REST report core. Implementation pointers: `src/` holds the atom's core, `tests/` its test suite, `SERVICE.md` is the normative field/check specification, and `contract.yaml` the machine-readable contract (key namespace/prefix, rate limits, pricing status). Fixes land in the bound skill first and the atom re-deploys from the refined skill (contract binding rule R1).

### For ops

Endpoints: REST `POST /v1/creative-ideation-session` and MCP `POST /mcp/creative-ideation-session` on `https://atoms.pipavia.com` (gateway v1.1.0 in the recorded battery). Key scope is per atom — a 403 spike means clients are calling with keys that lack this atom's scope, not an outage. Rate limits: 60/min and 10,000/day per key; watch 429s per key before raising limits. Error monitoring: alert on 5xx (none are part of this atom's documented behavior) and on 422 rate by `field` (a rising 422 rate on one field usually means a client manifest generator changed shape). Status: live — release candidate, one-week RC soak to 2026-11-22; pricing is still pending (free during trial), so metering is for the cost ledger, not billing.

## Worked examples

Provenance: recorded 2026-11-16T02:44:23.807330+00:00 against gateway v1.1.0, external verification lane, source `verification/work/creative-ideation-session/evidence.json`. Inputs and REST responses below are reproduced verbatim (pretty-printed with indent 2 only) and were verified mechanically against that evidence file after writing: each fenced block parses to a JSON value identical to the recorded value.

### Example 1 — Full-pass

Recorded expectation: HTTP 200, verdict `SESSION_COMPLETE`.

Input (recorded `input`):

```json
{
  "session_title": "Q3 Product Strategy",
  "brief": {
    "written": true,
    "goal_or_question_stated": true,
    "constraints_declared": true
  },
  "preparation": {
    "scheduled_in_advance": true,
    "prepared_with_inputs_ready": true
  },
  "capture": {
    "capture_system_used": true,
    "all_ideas_captured": true,
    "no_judging_at_capture": true
  },
  "generation": {
    "editing_separated_from_generating": true,
    "small_reps_or_low_start_bar_used": true
  },
  "divergence": {
    "diverged_before_converging": true,
    "methods_used": [
      "brainstorm",
      "scamper"
    ],
    "constraints_used_as_prompt": true
  },
  "idea_pool": {
    "target_idea_count": 10,
    "total_ideas_captured": 12,
    "dedup_performed": true,
    "duplicates_removed": 2,
    "unique_ideas_after_dedup": 10,
    "ideas_clustered_or_grouped": true
  },
  "selection": {
    "criteria_written_before_scoring": true,
    "criteria_applied_to_all_unique_ideas": true,
    "scoring_only_after_divergence_complete": true
  },
  "shortlist": {
    "shortlist_count": 3,
    "rationale_written": true,
    "rationale_references_criteria": true
  },
  "outcome": {
    "shared_for_feedback": true
  }
}
```

REST response (recorded `response_text`):

```json
{
  "service": "creative-ideation-session",
  "atom_version": "0.1.0",
  "session_title": "Q3 Product Strategy",
  "methods_used": [
    "brainstorm",
    "scamper"
  ],
  "verdict": "SESSION_COMPLETE",
  "sections": {
    "brief_and_preparation": "pass",
    "capture_and_generation": "pass",
    "divergence_and_methods": "pass",
    "idea_pool_and_volume": "pass",
    "selection_and_convergence": "pass",
    "shortlist_and_ship": "pass"
  },
  "checks": [
    {
      "section": "brief_and_preparation",
      "check": "brief_written",
      "status": "pass",
      "evidence": "the session record carries a written brief"
    },
    {
      "section": "brief_and_preparation",
      "check": "brief_goal_or_question_stated",
      "status": "pass",
      "evidence": "the brief states the goal or question the session works on"
    },
    {
      "section": "brief_and_preparation",
      "check": "constraints_declared",
      "status": "pass",
      "evidence": "the brief declares the session's constraints — a tight box forces invention"
    },
    {
      "section": "brief_and_preparation",
      "check": "session_scheduled_in_advance",
      "status": "pass",
      "evidence": "habits over moods: the session is created on a schedule, not when inspired"
    },
    {
      "section": "brief_and_preparation",
      "check": "prepared_with_inputs_ready",
      "status": "pass",
      "evidence": "the session shows up prepared — inputs ready to draw from the well"
    },
    {
      "section": "capture_and_generation",
      "check": "capture_system_used",
      "status": "pass",
      "evidence": "capture everything: an idea-capture system is used — raw ideas are perishable"
    },
    {
      "section": "capture_and_generation",
      "check": "all_ideas_captured",
      "status": "pass",
      "evidence": "capture everything: all raw ideas from the session are captured"
    },
    {
      "section": "capture_and_generation",
      "check": "no_judging_at_capture",
      "status": "pass",
      "evidence": "never judge at the moment of capture"
    },
    {
      "section": "capture_and_generation",
      "check": "editing_separated_from_generating",
      "status": "pass",
      "evidence": "separate drafting from editing — editing never happens while generating"
    },
    {
      "section": "capture_and_generation",
      "check": "small_reps_or_low_start_bar_used",
      "status": "pass",
      "evidence": "beat the resistance: the bar to start is lowered or the work is done in small reps"
    },
    {
      "section": "divergence_and_methods",
      "check": "diverged_before_converging",
      "status": "pass",
      "evidence": "diverge, then converge: the session diverges widely before any convergence"
    },
    {
      "section": "divergence_and_methods",
      "check": "methods_used_are_stated_methods",
      "status": "pass",
      "evidence": "diverge step: every method used is one the skill names — brainstorm, scamper, analogies, combining_distant_domains, or what_if — and at least one method is used; the skill requires no particular method and no minimum count beyond that"
    },
    {
      "section": "divergence_and_methods",
      "check": "constraints_used_as_prompt",
      "status": "pass",
      "evidence": "constraints help: the declared constraints are used as a prompt for invention"
    },
    {
      "section": "idea_pool_and_volume",
      "check": "volume_meets_declared_target",
      "status": "pass",
      "evidence": "volume precedes quality: the captured idea count meets the caller-declared target, the target is positive, and the captured count is not negative — the skill states no number for 'many', so only the declared numbers are compared"
    },
    {
      "section": "idea_pool_and_volume",
      "check": "dedup_performed",
      "status": "pass",
      "evidence": "the idea pool is deduplicated before selection"
    },
    {
      "section": "idea_pool_and_volume",
      "check": "dedup_arithmetic_consistent",
      "status": "pass",
      "evidence": "the declared unique-after-dedup count equals the declared captured total minus the declared duplicates removed, with no negative counts and no more duplicates removed than ideas captured"
    },
    {
      "section": "idea_pool_and_volume",
      "check": "ideas_clustered_or_grouped",
      "status": "pass",
      "evidence": "the deduplicated idea pool is clustered or grouped before selection"
    },
    {
      "section": "selection_and_convergence",
      "check": "selection_criteria_written_before_scoring",
      "status": "pass",
      "evidence": "the selection criteria are written before any idea is scored"
    },
    {
      "section": "selection_and_convergence",
      "check": "criteria_applied_to_all_unique_ideas",
      "status": "pass",
      "evidence": "the declared criteria are applied to all unique ideas, not only to favourites"
    },
    {
      "section": "selection_and_convergence",
      "check": "scoring_only_after_divergence_complete",
      "status": "pass",
      "evidence": "diverge, then converge: scoring starts only after divergence is complete"
    },
    {
      "section": "selection_and_convergence",
      "check": "shortlist_within_unique_pool",
      "status": "pass",
      "evidence": "the declared shortlist holds at least one idea and does not exceed the declared unique-after-dedup pool"
    },
    {
      "section": "shortlist_and_ship",
      "check": "shortlist_rationale_written",
      "status": "pass",
      "evidence": "a written rationale for the shortlist is recorded"
    },
    {
      "section": "shortlist_and_ship",
      "check": "shortlist_rationale_references_criteria",
      "status": "pass",
      "evidence": "the shortlist rationale references the selection criteria declared before scoring"
    },
    {
      "section": "shortlist_and_ship",
      "check": "shared_for_feedback",
      "status": "pass",
      "evidence": "ship: the session's output is finished and shared — real feedback only arrives after shipping; perfectionism that prevents shipping is refused"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "target_idea_count": 10,
  "total_ideas_captured": 12,
  "volume_gap_ideas": "2.000000",
  "duplicates_removed": 2,
  "unique_ideas_after_dedup": 10,
  "dedup_discrepancy_ideas": "0.000000",
  "shortlist_count": 3,
  "methods_used_count": 2,
  "summary": "24 pass, 0 fail, 0 missing of 24 checks across six sections.",
  "stamp": "CREATIVE IDEATION SESSION\nsession: Q3 Product Strategy\nVERDICT: SESSION_COMPLETE\n  brief_and_preparation                pass\n  capture_and_generation               pass\n  divergence_and_methods               pass\n  idea_pool_and_volume                 pass\n  selection_and_convergence            pass\n  shortlist_and_ship                   pass\n24 pass, 0 fail, 0 missing of 24 checks across six sections."
}
```

### Example 2 — Violations

Recorded expectation: HTTP 200, verdict `SESSION_NOT_COMPLETE`.

Input (recorded `input`):

```json
{
  "session_title": "Bad Math Session",
  "brief": {
    "written": true,
    "goal_or_question_stated": true,
    "constraints_declared": true
  },
  "preparation": {
    "scheduled_in_advance": true,
    "prepared_with_inputs_ready": true
  },
  "capture": {
    "capture_system_used": true,
    "all_ideas_captured": true,
    "no_judging_at_capture": true
  },
  "generation": {
    "editing_separated_from_generating": true,
    "small_reps_or_low_start_bar_used": true
  },
  "divergence": {
    "diverged_before_converging": true,
    "methods_used": [
      "invalid_method"
    ],
    "constraints_used_as_prompt": true
  },
  "idea_pool": {
    "target_idea_count": 10,
    "total_ideas_captured": 5,
    "dedup_performed": true,
    "duplicates_removed": 0,
    "unique_ideas_after_dedup": 5,
    "ideas_clustered_or_grouped": true
  },
  "selection": {
    "criteria_written_before_scoring": true,
    "criteria_applied_to_all_unique_ideas": true,
    "scoring_only_after_divergence_complete": true
  },
  "shortlist": {
    "shortlist_count": 10,
    "rationale_written": true,
    "rationale_references_criteria": true
  },
  "outcome": {
    "shared_for_feedback": true
  }
}
```

REST response (recorded `response_text`):

```json
{
  "service": "creative-ideation-session",
  "atom_version": "0.1.0",
  "session_title": "Bad Math Session",
  "methods_used": [
    "invalid_method"
  ],
  "verdict": "SESSION_NOT_COMPLETE",
  "sections": {
    "brief_and_preparation": "pass",
    "capture_and_generation": "pass",
    "divergence_and_methods": "fail",
    "idea_pool_and_volume": "fail",
    "selection_and_convergence": "fail",
    "shortlist_and_ship": "pass"
  },
  "checks": [
    {
      "section": "brief_and_preparation",
      "check": "brief_written",
      "status": "pass",
      "evidence": "the session record carries a written brief"
    },
    {
      "section": "brief_and_preparation",
      "check": "brief_goal_or_question_stated",
      "status": "pass",
      "evidence": "the brief states the goal or question the session works on"
    },
    {
      "section": "brief_and_preparation",
      "check": "constraints_declared",
      "status": "pass",
      "evidence": "the brief declares the session's constraints — a tight box forces invention"
    },
    {
      "section": "brief_and_preparation",
      "check": "session_scheduled_in_advance",
      "status": "pass",
      "evidence": "habits over moods: the session is created on a schedule, not when inspired"
    },
    {
      "section": "brief_and_preparation",
      "check": "prepared_with_inputs_ready",
      "status": "pass",
      "evidence": "the session shows up prepared — inputs ready to draw from the well"
    },
    {
      "section": "capture_and_generation",
      "check": "capture_system_used",
      "status": "pass",
      "evidence": "capture everything: an idea-capture system is used — raw ideas are perishable"
    },
    {
      "section": "capture_and_generation",
      "check": "all_ideas_captured",
      "status": "pass",
      "evidence": "capture everything: all raw ideas from the session are captured"
    },
    {
      "section": "capture_and_generation",
      "check": "no_judging_at_capture",
      "status": "pass",
      "evidence": "never judge at the moment of capture"
    },
    {
      "section": "capture_and_generation",
      "check": "editing_separated_from_generating",
      "status": "pass",
      "evidence": "separate drafting from editing — editing never happens while generating"
    },
    {
      "section": "capture_and_generation",
      "check": "small_reps_or_low_start_bar_used",
      "status": "pass",
      "evidence": "beat the resistance: the bar to start is lowered or the work is done in small reps"
    },
    {
      "section": "divergence_and_methods",
      "check": "diverged_before_converging",
      "status": "pass",
      "evidence": "diverge, then converge: the session diverges widely before any convergence"
    },
    {
      "section": "divergence_and_methods",
      "check": "methods_used_are_stated_methods",
      "status": "fail",
      "evidence": "diverge step: every method used is one the skill names — brainstorm, scamper, analogies, combining_distant_domains, or what_if — and at least one method is used; the skill requires no particular method and no minimum count beyond that"
    },
    {
      "section": "divergence_and_methods",
      "check": "constraints_used_as_prompt",
      "status": "pass",
      "evidence": "constraints help: the declared constraints are used as a prompt for invention"
    },
    {
      "section": "idea_pool_and_volume",
      "check": "volume_meets_declared_target",
      "status": "fail",
      "evidence": "volume precedes quality: the captured idea count meets the caller-declared target, the target is positive, and the captured count is not negative — the skill states no number for 'many', so only the declared numbers are compared"
    },
    {
      "section": "idea_pool_and_volume",
      "check": "dedup_performed",
      "status": "pass",
      "evidence": "the idea pool is deduplicated before selection"
    },
    {
      "section": "idea_pool_and_volume",
      "check": "dedup_arithmetic_consistent",
      "status": "pass",
      "evidence": "the declared unique-after-dedup count equals the declared captured total minus the declared duplicates removed, with no negative counts and no more duplicates removed than ideas captured"
    },
    {
      "section": "idea_pool_and_volume",
      "check": "ideas_clustered_or_grouped",
      "status": "pass",
      "evidence": "the deduplicated idea pool is clustered or grouped before selection"
    },
    {
      "section": "selection_and_convergence",
      "check": "selection_criteria_written_before_scoring",
      "status": "pass",
      "evidence": "the selection criteria are written before any idea is scored"
    },
    {
      "section": "selection_and_convergence",
      "check": "criteria_applied_to_all_unique_ideas",
      "status": "pass",
      "evidence": "the declared criteria are applied to all unique ideas, not only to favourites"
    },
    {
      "section": "selection_and_convergence",
      "check": "scoring_only_after_divergence_complete",
      "status": "pass",
      "evidence": "diverge, then converge: scoring starts only after divergence is complete"
    },
    {
      "section": "selection_and_convergence",
      "check": "shortlist_within_unique_pool",
      "status": "fail",
      "evidence": "the declared shortlist holds at least one idea and does not exceed the declared unique-after-dedup pool"
    },
    {
      "section": "shortlist_and_ship",
      "check": "shortlist_rationale_written",
      "status": "pass",
      "evidence": "a written rationale for the shortlist is recorded"
    },
    {
      "section": "shortlist_and_ship",
      "check": "shortlist_rationale_references_criteria",
      "status": "pass",
      "evidence": "the shortlist rationale references the selection criteria declared before scoring"
    },
    {
      "section": "shortlist_and_ship",
      "check": "shared_for_feedback",
      "status": "pass",
      "evidence": "ship: the session's output is finished and shared — real feedback only arrives after shipping; perfectionism that prevents shipping is refused"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "target_idea_count": 10,
  "total_ideas_captured": 5,
  "volume_gap_ideas": "-5.000000",
  "duplicates_removed": 0,
  "unique_ideas_after_dedup": 5,
  "dedup_discrepancy_ideas": "0.000000",
  "shortlist_count": 10,
  "methods_used_count": 1,
  "summary": "21 pass, 3 fail, 0 missing of 24 checks across six sections.",
  "stamp": "CREATIVE IDEATION SESSION\nsession: Bad Math Session\nVERDICT: SESSION_NOT_COMPLETE\n  brief_and_preparation                pass\n  capture_and_generation               pass\n  divergence_and_methods               fail\n  idea_pool_and_volume                 fail\n  selection_and_convergence            fail\n  shortlist_and_ship                   pass\n21 pass, 3 fail, 0 missing of 24 checks across six sections."
}
```

### Example 3 — Malformed

Recorded expectation: HTTP 422, error `invalid_input` — never a verdict.

Input (recorded `input`):

```json
{
  "session_title": "Malformed",
  "brief": "not_an_object"
}
```

REST response (recorded `response_text`):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "brief",
  "detail": "brief must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation all present |
| Output format | CommonMark markdown |
| Role views present | Integrators (Users): Yes · Developers: Yes · Ops: Yes · Regulators: N/A — the verdict audits a creative session record for completeness; SERVICE.md names no regulation and the verdict is not compliance or audit evidence. |
| Checks named: documented / recorded | 24 / 24 |
| Verdict vocabulary complete | Yes — all 3 verdict values (INSUFFICIENT_EVIDENCE, SESSION_COMPLETE, SESSION_NOT_COMPLETE), section statuses, per-check statuses and `computed_status` values listed |
| Input reference typed | Yes — 27 fields, each with a type, grouped as SERVICE.md groups them |
| Worked examples verbatim-verified | Yes — full-pass / violations / malformed inputs and REST responses parsed and compared as JSON values against `verification/work/creative-ideation-session/evidence.json` after writing |
