# Negotiation preparation pack — documentation

**Negotiation preparation pack** · slug `negotiation-preparation-pack` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment c64bdc48fce84cd4817fe3a293be6ae5).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **built-locally** — “no endpoint is live”, and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/negotiation-preparation-pack/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment c64bdc48fce84cd4817fe3a293be6ae5). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `negotiation` "Vendor Service Level Agreement"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "negotiation-preparation-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the negotiation preparation manifest.** You declare a record of preparation for one negotiation, made before the table — the atom audits the declared record, it does not prepare the negotiation or negotiate anything (see Explanation). The recorded full-pass manifest declares the negotiation `Vendor Service Level Agreement`: a BATNA identified and strengthened, a reservation price set, the counterpart's reservation estimated, a ZOPA assessed, a walk-away commitment declared, and the fundamentals prepared before the negotiation; the caller's own and the counterpart's interests identified, asking why the counterpart wants what they ask for planned, and an interests-not-positions framing adopted; value created before claiming planned, non-zero-sum opportunities sought, and trading across differently valued issues planned; one issue row, `Price` (`own_underlying_interest` "Maintain budget", `counterpart_underlying_interest` "Maximize margin", trade potential assessed); a sense of direction stated, a plan-not-script approach adopted, and Plans B and C prepared; managing the caller's own emotional state planned, a composure commitment declared, and situational awareness planned; the opening, recognition of critical moments and closing cleanly planned; the anchoring gate `informed_enough_to_anchor_first` declared `true` with `anchor_first_planned` `true`; making the counterpart's yes easy planned, people separated from the problem, hard on the problem / soft on the person, and a fair-enough agreement aimed for, all declared; a debrief planned after the negotiation, a deliberate debrief review committed, and the misleading-feedback caution acknowledged; and all six red-line flags `false` (no BATNA absent, no arguing positions, no treating everything as zero-sum, no rigid script reliance, no losing composure, no never debriefing).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/negotiation-preparation-pack` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `NEGOTIATION_PREPARATION_SOUND`: "44 pass, 0 fail, 0 missing of 44 checks across five sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `issues_count` is 1, and `own_interest_coverage`, `counterpart_interest_coverage` and `trade_potential_assessed_coverage` are each `"1.000000"`, with all four row-name / name lists empty (`[]`).

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `NEGOTIATION_PREPARATION_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "negotiation-preparation-pack"}`.
3. Call: `POST https://atoms.pipavia.com/v1/negotiation-preparation-pack` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/negotiation-preparation-pack` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `negotiation_preparation_pack`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `NEGOTIATION_PREPARATION_NOT_SOUND` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 5 checks fail: `anchor_first_planned_when_informed`, `batna_identified`, `every_issue_names_own_underlying_interest`, `every_issue_trade_potential_assessed`, `no_batna`, and the summary reads "39 pass, 5 fail, 0 missing of 44 checks across five sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (in the recorded violations run, `issues_without_own_interest` names `Price` — that row declares `own_underlying_interest: ""` — `own_interest_coverage` is `"0.000000"`, `issues_without_trade_potential_assessed` names `Price` — that row declares `trade_potential_assessed: false` — `trade_potential_assessed_coverage` is `"0.000000"`, `issues_without_counterpart_interest` is empty and `counterpart_interest_coverage` is `"1.000000"`, `duplicate_issue_names` is empty, `batna_and_reservation.batna_identified` is declared `false`, `anchoring.anchor_first_planned` is declared `false` while its gate `informed_enough_to_anchor_first` is `true`, and `red_lines.no_batna_present` is declared `true`, failing `no_batna`; sections `batna_reservation_price_and_zopa`, `interests_and_value_creation`, `openings_moments_closing_and_tactics` and `debrief_and_anti_pattern_red_lines` report `fail`, `improvisation_and_adaptation` reports `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where an object is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "batna_and_reservation",
  "detail": "batna_and_reservation must be an object"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/negotiation-preparation-pack` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/negotiation-preparation-pack` — tool name `negotiation_preparation_pack`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `negotiation_preparation_pack` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `negotiation` and the `issues[]` string fields are noted as strings and `issues` as a list there. Where SERVICE.md states no type — the section container objects (`batna_and_reservation`, `interests`, `value_creation`, `direction`, `presence_and_awareness`, `sequence`, `anchoring`, `tactics`, `learning`, `red_lines`) and an `issues[]` row object — the type below is grounded in the recorded evidence inputs (and, for the top-level containers, in the MCP `inputSchema` recorded in evidence.json, which types them `object` and `issues` as `array`); that grounding is said so in the Notes column. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `NEGOTIATION_PREPARATION_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, exactly as SERVICE.md groups them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `negotiation` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: batna_reservation_price_and_zopa

| Field | Type | Notes |
|---|---|---|
| `batna_and_reservation` | object | The BATNA / reservation section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `batna_and_reservation.batna_identified` | boolean | — |
| `batna_and_reservation.batna_strengthened` | boolean | — |
| `batna_and_reservation.reservation_price_set` | boolean | — |
| `batna_and_reservation.counterpart_reservation_estimated` | boolean | — |
| `batna_and_reservation.zopa_assessed` | boolean | — |
| `batna_and_reservation.walk_away_commitment_declared` | boolean | — |
| `batna_and_reservation.fundamentals_prepared_before_negotiation` | boolean | — |

#### Read by: interests_and_value_creation

| Field | Type | Notes |
|---|---|---|
| `interests` | object | The interests section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `interests.own_interests_identified` | boolean | — |
| `interests.counterpart_interests_identified` | boolean | — |
| `interests.counterpart_why_to_be_asked_planned` | boolean | — |
| `interests.interests_not_positions_framing_adopted` | boolean | — |
| `value_creation` | object | The value-creation section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `value_creation.value_created_before_claiming_planned` | boolean | — |
| `value_creation.non_zero_sum_opportunities_sought` | boolean | — |
| `value_creation.trade_across_differently_valued_issues_planned` | boolean | — |
| `issues` | list | list of issue-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md) |
| `issues[]` | object | One declared issue row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `issues[].name` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `issues[].own_underlying_interest` | string | The caller's underlying interest behind the position; must be present and non-empty per row (type stated in SERVICE.md) |
| `issues[].counterpart_underlying_interest` | string | The counterpart's underlying interest behind their position; must be present and non-empty per row (type stated in SERVICE.md) |
| `issues[].trade_potential_assessed` | boolean | — |

#### Read by: improvisation_and_adaptation

| Field | Type | Notes |
|---|---|---|
| `direction` | object | The direction section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `direction.sense_of_direction_stated` | boolean | — |
| `direction.plan_not_script_approach_adopted` | boolean | — |
| `direction.plan_b_prepared` | boolean | — |
| `direction.plan_c_prepared` | boolean | — |
| `presence_and_awareness` | object | The presence-and-awareness section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `presence_and_awareness.own_emotional_state_management_planned` | boolean | — |
| `presence_and_awareness.composure_commitment_declared` | boolean | — |
| `presence_and_awareness.situational_awareness_planned` | boolean | — |

#### Read by: openings_moments_closing_and_tactics

| Field | Type | Notes |
|---|---|---|
| `sequence` | object | The sequence section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `sequence.opening_planned` | boolean | — |
| `sequence.critical_moments_recognition_planned` | boolean | — |
| `sequence.closing_cleanly_planned` | boolean | — |
| `anchoring` | object | The anchoring section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `anchoring.informed_enough_to_anchor_first` | boolean | the applicability gate for the gated anchoring check below |
| `anchoring.anchor_first_planned` | boolean | gated — applies only when `informed_enough_to_anchor_first` is `true` |
| `tactics` | object | The tactics section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `tactics.counterpart_yes_made_easy_planned` | boolean | — |
| `tactics.people_separated_from_problem_declared` | boolean | — |
| `tactics.hard_on_problem_soft_on_person_declared` | boolean | — |
| `tactics.fair_enough_agreement_aim_declared` | boolean | — |

#### Read by: debrief_and_anti_pattern_red_lines

| Field | Type | Notes |
|---|---|---|
| `learning` | object | The learning / debrief section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `learning.debrief_planned_after_negotiation` | boolean | — |
| `learning.deliberate_debrief_review_committed` | boolean | — |
| `learning.misleading_feedback_caution_acknowledged` | boolean | — |
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.no_batna_present` | boolean | must be `false` to pass — skill anti-pattern |
| `red_lines.arguing_positions_present` | boolean | must be `false` to pass — skill anti-pattern |
| `red_lines.treating_everything_as_zero_sum_present` | boolean | must be `false` to pass — skill anti-pattern |
| `red_lines.rigid_script_reliance_present` | boolean | must be `false` to pass — skill anti-pattern |
| `red_lines.losing_composure_present` | boolean | must be `false` to pass — skill anti-pattern |
| `red_lines.never_debriefing_present` | boolean | must be `false` to pass — skill anti-pattern |

### Checks

All 44 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies).

#### Section: batna_reservation_price_and_zopa

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `batna_identified` | BATNA: the Best Alternative To a Negotiated Agreement is identified | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `batna_strengthened` | BATNA: the BATNA is strengthened, not only known — it is the real walk-away power | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `reservation_price_set` | reservation price: the walk-away number is set before the table | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `counterpart_reservation_estimated` | reservation price: the counterpart's walk-away range is estimated, so an overlap can be assessed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zopa_assessed` | ZOPA: the Zone of Possible Agreement — where the two reservation ranges overlap — is assessed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `walk_away_commitment_declared` | reservation price: walking away beyond the reservation number is committed to in advance | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `fundamentals_prepared_before_negotiation` | fundamentals: the fundamentals are prepared before the table, not improvised from nothing | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: interests_and_value_creation

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `own_interests_identified` | interests: the caller's own underlying interests are identified, not only the stated demand | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `counterpart_interests_identified` | interests: the counterpart's underlying interests are identified, not only their stated demand | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `counterpart_why_to_be_asked_planned` | interests: asking why the counterpart wants what they ask for is planned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `interests_not_positions_framing_adopted` | interests: the negotiation is framed on underlying interests, not positions | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `value_created_before_claiming_planned` | value creation: expanding the pie is planned before claiming a share of it | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `non_zero_sum_opportunities_sought` | value creation: the deal is not treated as zero-sum — opportunities to create value are sought | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `trade_across_differently_valued_issues_planned` | value creation: trading across issues the two sides value differently is planned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `issues_declared` | the declared record names its issues — the issues list is present and non-empty | Computed over the declared record. Pass: the `issues` list is present and non-empty. Fail: the declared list is empty. Missing: the list is absent. |
| `every_issue_names_own_underlying_interest` | interests: every declared issue row names the caller's own underlying interest behind the position | Computed over the declared record. Pass: every declared issue row names a non-empty `own_underlying_interest`. Fail: a row declares `own_underlying_interest` present but empty (offending rows are named in `issues_without_own_interest`). Missing: the list is absent, or a row has `own_underlying_interest` absent (such a row is missing evidence and does not appear in `issues_without_own_interest`). |
| `every_issue_names_counterpart_underlying_interest` | interests: every declared issue row names the counterpart's underlying interest behind their position | Computed over the declared record. Pass: every declared issue row names a non-empty `counterpart_underlying_interest`. Fail: a row declares `counterpart_underlying_interest` present but empty (offending rows are named in `issues_without_counterpart_interest`). Missing: the list is absent, or a row has `counterpart_underlying_interest` absent (such a row is missing evidence and does not appear in `issues_without_counterpart_interest`). |
| `every_issue_trade_potential_assessed` | value creation: every declared issue row has its trade potential — whether the two sides value it differently — assessed | Computed over the declared record. Pass: every declared issue row declares `trade_potential_assessed: true`. Fail: a row declares `trade_potential_assessed` present but not `true` (offending rows are named in `issues_without_trade_potential_assessed`). Missing: the list is absent, or a row has `trade_potential_assessed` absent (such a row is missing evidence and does not appear in `issues_without_trade_potential_assessed`). |
| `no_issue_name_duplicated` | issues: no declared issue name is owned by more than one issue row | Computed over the declared record. Pass: no declared `name` string appears on more than one issue row. Fail: a `name` string is declared on more than one row (offending names are named in `duplicate_issue_names`). Missing: the list is absent, or a row has `name` absent (such a row is missing evidence for this check). |

#### Section: improvisation_and_adaptation

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `sense_of_direction_stated` | direction: a sense of direction is stated — a map that orients even when the terrain differs | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `plan_not_script_approach_adopted` | direction: the plan is carried as orientation, not as a rigid script | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `plan_b_prepared` | direction: a Plan B is carried | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `plan_c_prepared` | direction: a Plan C is carried, beyond Plan B | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `own_emotional_state_management_planned` | presence of mind: managing the caller's own emotional state during the negotiation is planned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `composure_commitment_declared` | presence of mind: staying composed is committed to in advance | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `situational_awareness_planned` | situational awareness: reading shifting interests, constraints and emotions in real time is planned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: openings_moments_closing_and_tactics

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `opening_planned` | sequence: the opening is planned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `critical_moments_recognition_planned` | sequence: recognizing the critical moments — the pivot points — is planned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `closing_cleanly_planned` | sequence: closing cleanly is planned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `anchoring_applicability_declared` | anchoring: whether the caller is informed enough to anchor first is declared — anchoring first applies only when informed | Gated applicability declaration. Pass: `anchoring.informed_enough_to_anchor_first` is present, either value. Missing: the gate field is absent. SERVICE.md states no fail state for this check — a present gate passes. |
| `anchor_first_planned_when_informed` | anchoring: anchoring first is planned for when the caller is informed | Gated check. Pass: the gate is declared `false` (passes as not applicable, whatever `anchor_first_planned` declares), or the gate is declared `true` and `anchor_first_planned` is declared `true`. Fail: the gate is declared `true` and `anchor_first_planned` is declared `false`. Missing: the gate or `anchor_first_planned` itself is absent. |
| `counterpart_yes_made_easy_planned` | tactics: making the counterpart's yes easy is planned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `people_separated_from_problem_declared` | tactics: the people are separated from the problem | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `hard_on_problem_soft_on_person_declared` | tactics: hard on the problem, soft on the person is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `fair_enough_agreement_aim_declared` | tactics: the aim is a fair-enough agreement that holds, not a maximal extraction | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: debrief_and_anti_pattern_red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `debrief_planned_after_negotiation` | debrief: a debrief after the negotiation is planned — every negotiation is debriefed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `deliberate_debrief_review_committed` | debrief: the debrief is a deliberate review, committed to in advance, so learning actually happens | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `misleading_feedback_caution_acknowledged` | debrief: negotiation is a wicked learning environment where feedback misleads — that caution is acknowledged | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_batna` | red line: no BATNA is present in the preparation | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_arguing_positions` | red line: arguing positions is not present in the preparation | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_zero_sum_treatment` | red line: treating everything as zero-sum is not present in the preparation | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_rigid_script_reliance` | red line: reliance on a rigid script is not present in the preparation | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_losing_composure` | red line: losing composure is not present in the preparation | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_never_debriefing` | red line: never debriefing is not present in the preparation | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"negotiation-preparation-pack"`), `atom_version` (`"0.1.0"`), and `negotiation` (the manifest's declared negotiation value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `issues_count` (the declared list length as an integer, or null when the list is not declared); the row-name lists `issues_without_own_interest` (issues whose `own_underlying_interest` field is present but empty; an issue with the field absent is missing evidence and does not appear), `issues_without_counterpart_interest` (issues whose `counterpart_underlying_interest` field is present but empty) and `issues_without_trade_potential_assessed` (issues whose `trade_potential_assessed` field is present but not `true`), and the name list `duplicate_issue_names` (issue names declared on more than one row, in the order their second occurrence appears) — all four lists are null when the `issues` list is not declared, as recorded in the sparse case; and the ratios `own_interest_coverage` (issues naming the caller's own underlying interest ÷ declared issues), `counterpart_interest_coverage` (issues naming the counterpart's underlying interest ÷ declared issues) and `trade_potential_assessed_coverage` (issues with trade potential assessed ÷ declared issues) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty. Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "44 pass, 0 fail, 0 missing of 44 checks across five sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared negotiation value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `NEGOTIATION_PREPARATION_SOUND` — all 44 checks pass: the declared negotiation-preparation record is complete and consistent with the bound skill's checklist and red lines.
- `NEGOTIATION_PREPARATION_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one of the five primary computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence; `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `issues_count`, `issues_without_own_interest`, `own_interest_coverage`, `issues_without_counterpart_interest`, `counterpart_interest_coverage`, `issues_without_trade_potential_assessed`, `trade_potential_assessed_coverage`, `duplicate_issue_names` and `computed_status` — each defined in Output format above, with the values and null rules recorded there.

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"batna_and_reservation","detail":"batna_and_reservation must be an object"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type DELIVERABLE — this atom sells the deliverable it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Prepares the fundamentals and coaches the improvisation — real negotiation is nonlinear, and this skill handles both layers (the bound capability, from the skill). You submit one declared record — the negotiation preparation manifest, for one negotiation, made before the table — and the atom audits that record for completeness and internal consistency against the bound skill's checklist, quality gates and anti-pattern red lines, returning one deterministic verdict across 5 sections (`batna_reservation_price_and_zopa`, `interests_and_value_creation`, `improvisation_and_adaptation`, `openings_moments_closing_and_tactics`, `debrief_and_anti_pattern_red_lines`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — the declared `issues` list must be present and non-empty, every issue row must name a non-empty own underlying interest and a non-empty counterpart underlying interest and must have its trade potential assessed, and no declared `name` string may appear on more than one issue row — using only the declared record, with no outside threshold imported. *The gated anchoring check* is decided exactly as declared: `anchoring_applicability_declared` passes whenever `anchoring.informed_enough_to_anchor_first` is present (either value), and `anchor_first_planned_when_informed` is `missing` when the gate or the field itself is absent, passes as not applicable when the gate is declared `false` (whatever the field declares), and when the gate is declared `true` passes only when the field is declared `true`. Aggregation is strict: any `fail` anywhere produces `NEGOTIATION_PREPARATION_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `NEGOTIATION_PREPARATION_SOUND`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented: a reservation-price figure or a minimum distance between the reservation price and any offer; a ZOPA width or a minimum overlap between the two sides' ranges; a BATNA strength, quality or attractiveness score; a number of issues a preparation must contain beyond the one declared issues list being non-empty; a number of fallback plans beyond the skill's own stated Plan B (and C); an anchoring amount, percentage or first-offer figure; a coverage percentage below completeness; a debrief quality or learning-outcome score. Quantities are computed and reported; the only bar on the computed rows is completeness over the caller's own declared rows.

**What it does NOT do.** The atom audits a **declared** negotiation-preparation record: a verdict of `NEGOTIATION_PREPARATION_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a record that declares a strengthened BATNA, an assessed ZOPA and no rigid script passes those checks even if the real preparation did none of it. It is a completeness and consistency audit of the preparation record the skill requires, **not negotiation advice, a negotiation service, or a prediction that the negotiation will succeed**. Specifically: it prepares no negotiation itself, negotiates nothing, coaches no live improvisation, reads no counterpart, and does not verify that a declared preparation was ever carried out. It never judges whether the declared BATNA is genuinely strong, whether the reservation price is the right number, whether a ZOPA truly exists, or whether the plan is good — only that the record contains what the skill's fundamentals, improvisation, tactics and anti-patterns demand, and that its declared issue rows are internally consistent. Named exclusions: no numeric thresholds beyond the skill's own stated rules (see the declined list above); no live verification of any declared fact; no judgment of preparation quality — whether the BATNA, interests or fallback plans will work is caller-declared only; live improvisation itself (presence of mind, situational awareness, recognizing the pivot in the room) is a live act — this atom checks only that preparing for it is declared, never the act; the skill's named pairings with other skills (emotional-intelligence, psychological analysis) are not invoked — composure and awareness are checked only as the caller's own declared preparation in this record.

**Buyer and use context.** Teams and agents working in Mind & personal growth who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Vendor escalation negotiation preparation (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulators: N/A — this atom audits a declared negotiation-preparation record; its verdict is a completeness and consistency judgment on the caller's declared evidence, not compliance evidence in a regulated domain, and SERVICE.md states explicitly (in its U-13 regulatory screen) that its output could not read as regulated professional advice, that it audits a declared preparation record for completeness and consistency only and gives no engineering, financial, medical or legal advice, and that the reservation-price and ZOPA fields are caller-declared booleans, never figures this atom sets, recommends or computes. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `negotiation_preparation_pack` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/negotiation_preparation_pack.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_negotiation_preparation_pack.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/negotiation-preparation-pack` (REST) and `POST /mcp/negotiation-preparation-pack` (MCP, tool `negotiation_preparation_pack`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment c64bdc48fce84cd4817fe3a293be6ae5). Key scope: `negotiation_preparation_pack`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale:** SERVICE.md says Tier B · status: **built-locally** — "no endpoint is live", and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment c64bdc48fce84cd4817fe3a293be6ae5) shows the atom live. This document follows the evidenced live state: live.
2. **Check names differ from input field names:** the recorded check names are not the input field names for the anti-pattern / red-line checks, the computed checks, and the anchoring checks. Recorded check names used verbatim in the Checks section include `no_batna` (input `red_lines.no_batna_present`), `no_arguing_positions` (input `red_lines.arguing_positions_present`), `no_zero_sum_treatment` (input `red_lines.treating_everything_as_zero_sum_present`), `no_rigid_script_reliance` (input `red_lines.rigid_script_reliance_present`), `no_losing_composure` (input `red_lines.losing_composure_present`) and `no_never_debriefing` (input `red_lines.never_debriefing_present`), plus the computed checks `issues_declared`, `every_issue_names_own_underlying_interest`, `every_issue_names_counterpart_underlying_interest`, `every_issue_trade_potential_assessed` and `no_issue_name_duplicated`, which read the `issues` rows rather than any single input field, and the anchoring checks `anchoring_applicability_declared` (input `anchoring.informed_enough_to_anchor_first`) and `anchor_first_planned_when_informed` (input `anchoring.anchor_first_planned`, gated on that gate field).
3. **Types unstated in SERVICE.md:** SERVICE.md's field table states no type for the ten section container objects (`batna_and_reservation`, `interests`, `value_creation`, `direction`, `presence_and_awareness`, `sequence`, `anchoring`, `tactics`, `learning`, `red_lines`) or for an `issues[]` row object. The types in the Input reference for those fields are grounded in the recorded evidence inputs and the recorded MCP `inputSchema` in evidence.json, and are said so there.
4. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field. The recorded REST response carries all 44 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
5. **Section grouping vs input objects:** the recorded sections merge separate input objects — `interests`, `value_creation` and `issues` inputs are read by the single recorded section `interests_and_value_creation`, `direction` and `presence_and_awareness` inputs are read by the single recorded section `improvisation_and_adaptation`, `sequence`, `anchoring` and `tactics` inputs are read by the single recorded section `openings_moments_closing_and_tactics`, and `learning` and `red_lines` inputs are read by the single recorded section `debrief_and_anti_pattern_red_lines`. This document groups the Input reference and the Checks by the recorded section names.
6. **Null lists on an undeclared `issues` list:** SERVICE.md's output paragraph states the null rules for `computed_status`, `issues_count` and the coverage ratios, but does not state a null rule for the four row-name / name lists. The recorded sparse response returns all four lists as `null` when `issues` is not declared (as USER-GUIDE.md also states); this document follows the recording.
7. **Case-design prose notes in cases.json:** no discrepancy was found — the `notes` prose in `cases.json` / evidence.json for the full-pass, violations, sparse and malformed cases agrees with the recorded executions (the violations note names exactly the five planted changes, the sparse note's "every check missing" matches the recorded 44 `missing`, and the malformed note names the `batna_and_reservation` type mismatch the 422 records). The notes are unscored prose in any case; the recorded responses govern, and this document follows them.

## Worked examples

Provenance: recorded 2026-11-16T08:32:06.582530+00:00 against gateway v1.1.0, external verification lane, source `verification/work/negotiation-preparation-pack/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T08:32:06.582530+00:00 · gateway v1.1.0 · source `verification/work/negotiation-preparation-pack/evidence.json`.

Input:

```json
{
  "negotiation": "Vendor Service Level Agreement",
  "batna_and_reservation": {
    "batna_identified": true,
    "batna_strengthened": true,
    "reservation_price_set": true,
    "counterpart_reservation_estimated": true,
    "zopa_assessed": true,
    "walk_away_commitment_declared": true,
    "fundamentals_prepared_before_negotiation": true
  },
  "interests": {
    "own_interests_identified": true,
    "counterpart_interests_identified": true,
    "counterpart_why_to_be_asked_planned": true,
    "interests_not_positions_framing_adopted": true
  },
  "value_creation": {
    "value_created_before_claiming_planned": true,
    "non_zero_sum_opportunities_sought": true,
    "trade_across_differently_valued_issues_planned": true
  },
  "issues": [
    {
      "name": "Price",
      "own_underlying_interest": "Maintain budget",
      "counterpart_underlying_interest": "Maximize margin",
      "trade_potential_assessed": true
    }
  ],
  "direction": {
    "sense_of_direction_stated": true,
    "plan_not_script_approach_adopted": true,
    "plan_b_prepared": true,
    "plan_c_prepared": true
  },
  "presence_and_awareness": {
    "own_emotional_state_management_planned": true,
    "composure_commitment_declared": true,
    "situational_awareness_planned": true
  },
  "sequence": {
    "opening_planned": true,
    "critical_moments_recognition_planned": true,
    "closing_cleanly_planned": true
  },
  "anchoring": {
    "informed_enough_to_anchor_first": true,
    "anchor_first_planned": true
  },
  "tactics": {
    "counterpart_yes_made_easy_planned": true,
    "people_separated_from_problem_declared": true,
    "hard_on_problem_soft_on_person_declared": true,
    "fair_enough_agreement_aim_declared": true
  },
  "learning": {
    "debrief_planned_after_negotiation": true,
    "deliberate_debrief_review_committed": true,
    "misleading_feedback_caution_acknowledged": true
  },
  "red_lines": {
    "no_batna_present": false,
    "arguing_positions_present": false,
    "treating_everything_as_zero_sum_present": false,
    "rigid_script_reliance_present": false,
    "losing_composure_present": false,
    "never_debriefing_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "negotiation-preparation-pack",
  "atom_version": "0.1.0",
  "negotiation": "Vendor Service Level Agreement",
  "verdict": "NEGOTIATION_PREPARATION_SOUND",
  "sections": {
    "batna_reservation_price_and_zopa": "pass",
    "interests_and_value_creation": "pass",
    "improvisation_and_adaptation": "pass",
    "openings_moments_closing_and_tactics": "pass",
    "debrief_and_anti_pattern_red_lines": "pass"
  },
  "checks": [
    {
      "section": "batna_reservation_price_and_zopa",
      "check": "batna_identified",
      "status": "pass",
      "evidence": "BATNA: the Best Alternative To a Negotiated Agreement is identified"
    },
    {
      "section": "batna_reservation_price_and_zopa",
      "check": "batna_strengthened",
      "status": "pass",
      "evidence": "BATNA: the BATNA is strengthened, not only known — it is the real walk-away power"
    },
    {
      "section": "batna_reservation_price_and_zopa",
      "check": "reservation_price_set",
      "status": "pass",
      "evidence": "reservation price: the walk-away number is set before the table"
    },
    {
      "section": "batna_reservation_price_and_zopa",
      "check": "counterpart_reservation_estimated",
      "status": "pass",
      "evidence": "reservation price: the counterpart's walk-away range is estimated, so an overlap can be assessed"
    },
    {
      "section": "batna_reservation_price_and_zopa",
      "check": "zopa_assessed",
      "status": "pass",
      "evidence": "ZOPA: the Zone of Possible Agreement — where the two reservation ranges overlap — is assessed"
    },
    {
      "section": "batna_reservation_price_and_zopa",
      "check": "walk_away_commitment_declared",
      "status": "pass",
      "evidence": "reservation price: walking away beyond the reservation number is committed to in advance"
    },
    {
      "section": "batna_reservation_price_and_zopa",
      "check": "fundamentals_prepared_before_negotiation",
      "status": "pass",
      "evidence": "fundamentals: the fundamentals are prepared before the table, not improvised from nothing"
    },
    {
      "section": "interests_and_value_creation",
      "check": "own_interests_identified",
      "status": "pass",
      "evidence": "interests: the caller's own underlying interests are identified, not only the stated demand"
    },
    {
      "section": "interests_and_value_creation",
      "check": "counterpart_interests_identified",
      "status": "pass",
      "evidence": "interests: the counterpart's underlying interests are identified, not only their stated demand"
    },
    {
      "section": "interests_and_value_creation",
      "check": "counterpart_why_to_be_asked_planned",
      "status": "pass",
      "evidence": "interests: asking why the counterpart wants what they ask for is planned"
    },
    {
      "section": "interests_and_value_creation",
      "check": "interests_not_positions_framing_adopted",
      "status": "pass",
      "evidence": "interests: the negotiation is framed on underlying interests, not positions"
    },
    {
      "section": "interests_and_value_creation",
      "check": "value_created_before_claiming_planned",
      "status": "pass",
      "evidence": "value creation: expanding the pie is planned before claiming a share of it"
    },
    {
      "section": "interests_and_value_creation",
      "check": "non_zero_sum_opportunities_sought",
      "status": "pass",
      "evidence": "value creation: the deal is not treated as zero-sum — opportunities to create value are sought"
    },
    {
      "section": "interests_and_value_creation",
      "check": "trade_across_differently_valued_issues_planned",
      "status": "pass",
      "evidence": "value creation: trading across issues the two sides value differently is planned"
    },
    {
      "section": "interests_and_value_creation",
      "check": "issues_declared",
      "status": "pass",
      "evidence": "the declared record names its issues — the issues list is present and non-empty"
    },
    {
      "section": "interests_and_value_creation",
      "check": "every_issue_names_own_underlying_interest",
      "status": "pass",
      "evidence": "interests: every declared issue row names the caller's own underlying interest behind the position"
    },
    {
      "section": "interests_and_value_creation",
      "check": "every_issue_names_counterpart_underlying_interest",
      "status": "pass",
      "evidence": "interests: every declared issue row names the counterpart's underlying interest behind their position"
    },
    {
      "section": "interests_and_value_creation",
      "check": "every_issue_trade_potential_assessed",
      "status": "pass",
      "evidence": "value creation: every declared issue row has its trade potential — whether the two sides value it differently — assessed"
    },
    {
      "section": "interests_and_value_creation",
      "check": "no_issue_name_duplicated",
      "status": "pass",
      "evidence": "issues: no declared issue name is owned by more than one issue row"
    },
    {
      "section": "improvisation_and_adaptation",
      "check": "sense_of_direction_stated",
      "status": "pass",
      "evidence": "direction: a sense of direction is stated — a map that orients even when the terrain differs"
    },
    {
      "section": "improvisation_and_adaptation",
      "check": "plan_not_script_approach_adopted",
      "status": "pass",
      "evidence": "direction: the plan is carried as orientation, not as a rigid script"
    },
    {
      "section": "improvisation_and_adaptation",
      "check": "plan_b_prepared",
      "status": "pass",
      "evidence": "direction: a Plan B is carried"
    },
    {
      "section": "improvisation_and_adaptation",
      "check": "plan_c_prepared",
      "status": "pass",
      "evidence": "direction: a Plan C is carried, beyond Plan B"
    },
    {
      "section": "improvisation_and_adaptation",
      "check": "own_emotional_state_management_planned",
      "status": "pass",
      "evidence": "presence of mind: managing the caller's own emotional state during the negotiation is planned"
    },
    {
      "section": "improvisation_and_adaptation",
      "check": "composure_commitment_declared",
      "status": "pass",
      "evidence": "presence of mind: staying composed is committed to in advance"
    },
    {
      "section": "improvisation_and_adaptation",
      "check": "situational_awareness_planned",
      "status": "pass",
      "evidence": "situational awareness: reading shifting interests, constraints and emotions in real time is planned"
    },
    {
      "section": "openings_moments_closing_and_tactics",
      "check": "opening_planned",
      "status": "pass",
      "evidence": "sequence: the opening is planned"
    },
    {
      "section": "openings_moments_closing_and_tactics",
      "check": "critical_moments_recognition_planned",
      "status": "pass",
      "evidence": "sequence: recognizing the critical moments — the pivot points — is planned"
    },
    {
      "section": "openings_moments_closing_and_tactics",
      "check": "closing_cleanly_planned",
      "status": "pass",
      "evidence": "sequence: closing cleanly is planned"
    },
    {
      "section": "openings_moments_closing_and_tactics",
      "check": "anchoring_applicability_declared",
      "status": "pass",
      "evidence": "anchoring: whether the caller is informed enough to anchor first is declared — anchoring first applies only when informed"
    },
    {
      "section": "openings_moments_closing_and_tactics",
      "check": "anchor_first_planned_when_informed",
      "status": "pass",
      "evidence": "anchoring: anchoring first is planned for when the caller is informed"
    },
    {
      "section": "openings_moments_closing_and_tactics",
      "check": "counterpart_yes_made_easy_planned",
      "status": "pass",
      "evidence": "tactics: making the counterpart's yes easy is planned"
    },
    {
      "section": "openings_moments_closing_and_tactics",
      "check": "people_separated_from_problem_declared",
      "status": "pass",
      "evidence": "tactics: the people are separated from the problem"
    },
    {
      "section": "openings_moments_closing_and_tactics",
      "check": "hard_on_problem_soft_on_person_declared",
      "status": "pass",
      "evidence": "tactics: hard on the problem, soft on the person is declared"
    },
    {
      "section": "openings_moments_closing_and_tactics",
      "check": "fair_enough_agreement_aim_declared",
      "status": "pass",
      "evidence": "tactics: the aim is a fair-enough agreement that holds, not a maximal extraction"
    },
    {
      "section": "debrief_and_anti_pattern_red_lines",
      "check": "debrief_planned_after_negotiation",
      "status": "pass",
      "evidence": "debrief: a debrief after the negotiation is planned — every negotiation is debriefed"
    },
    {
      "section": "debrief_and_anti_pattern_red_lines",
      "check": "deliberate_debrief_review_committed",
      "status": "pass",
      "evidence": "debrief: the debrief is a deliberate review, committed to in advance, so learning actually happens"
    },
    {
      "section": "debrief_and_anti_pattern_red_lines",
      "check": "misleading_feedback_caution_acknowledged",
      "status": "pass",
      "evidence": "debrief: negotiation is a wicked learning environment where feedback misleads — that caution is acknowledged"
    },
    {
      "section": "debrief_and_anti_pattern_red_lines",
      "check": "no_batna",
      "status": "pass",
      "evidence": "red line: no BATNA is present in the preparation"
    },
    {
      "section": "debrief_and_anti_pattern_red_lines",
      "check": "no_arguing_positions",
      "status": "pass",
      "evidence": "red line: arguing positions is not present in the preparation"
    },
    {
      "section": "debrief_and_anti_pattern_red_lines",
      "check": "no_zero_sum_treatment",
      "status": "pass",
      "evidence": "red line: treating everything as zero-sum is not present in the preparation"
    },
    {
      "section": "debrief_and_anti_pattern_red_lines",
      "check": "no_rigid_script_reliance",
      "status": "pass",
      "evidence": "red line: reliance on a rigid script is not present in the preparation"
    },
    {
      "section": "debrief_and_anti_pattern_red_lines",
      "check": "no_losing_composure",
      "status": "pass",
      "evidence": "red line: losing composure is not present in the preparation"
    },
    {
      "section": "debrief_and_anti_pattern_red_lines",
      "check": "no_never_debriefing",
      "status": "pass",
      "evidence": "red line: never debriefing is not present in the preparation"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "issues_count": 1,
  "issues_without_own_interest": [],
  "own_interest_coverage": "1.000000",
  "issues_without_counterpart_interest": [],
  "counterpart_interest_coverage": "1.000000",
  "issues_without_trade_potential_assessed": [],
  "trade_potential_assessed_coverage": "1.000000",
  "duplicate_issue_names": [],
  "summary": "44 pass, 0 fail, 0 missing of 44 checks across five sections.",
  "stamp": "NEGOTIATION PREPARATION PACK\nnegotiation: Vendor Service Level Agreement\nVERDICT: NEGOTIATION_PREPARATION_SOUND\n  batna_reservation_price_and_zopa             pass\n  interests_and_value_creation                 pass\n  improvisation_and_adaptation                 pass\n  openings_moments_closing_and_tactics         pass\n  debrief_and_anti_pattern_red_lines           pass\n44 pass, 0 fail, 0 missing of 44 checks across five sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T08:32:06.582530+00:00 · gateway v1.1.0 · source `verification/work/negotiation-preparation-pack/evidence.json`.

Input:

```json
{
  "negotiation": "Vendor Service Level Agreement",
  "batna_and_reservation": {
    "batna_identified": false,
    "batna_strengthened": true,
    "reservation_price_set": true,
    "counterpart_reservation_estimated": true,
    "zopa_assessed": true,
    "walk_away_commitment_declared": true,
    "fundamentals_prepared_before_negotiation": true
  },
  "interests": {
    "own_interests_identified": true,
    "counterpart_interests_identified": true,
    "counterpart_why_to_be_asked_planned": true,
    "interests_not_positions_framing_adopted": true
  },
  "value_creation": {
    "value_created_before_claiming_planned": true,
    "non_zero_sum_opportunities_sought": true,
    "trade_across_differently_valued_issues_planned": true
  },
  "issues": [
    {
      "name": "Price",
      "own_underlying_interest": "",
      "counterpart_underlying_interest": "Maximize margin",
      "trade_potential_assessed": false
    }
  ],
  "direction": {
    "sense_of_direction_stated": true,
    "plan_not_script_approach_adopted": true,
    "plan_b_prepared": true,
    "plan_c_prepared": true
  },
  "presence_and_awareness": {
    "own_emotional_state_management_planned": true,
    "composure_commitment_declared": true,
    "situational_awareness_planned": true
  },
  "sequence": {
    "opening_planned": true,
    "critical_moments_recognition_planned": true,
    "closing_cleanly_planned": true
  },
  "anchoring": {
    "informed_enough_to_anchor_first": true,
    "anchor_first_planned": false
  },
  "tactics": {
    "counterpart_yes_made_easy_planned": true,
    "people_separated_from_problem_declared": true,
    "hard_on_problem_soft_on_person_declared": true,
    "fair_enough_agreement_aim_declared": true
  },
  "learning": {
    "debrief_planned_after_negotiation": true,
    "deliberate_debrief_review_committed": true,
    "misleading_feedback_caution_acknowledged": true
  },
  "red_lines": {
    "no_batna_present": true,
    "arguing_positions_present": false,
    "treating_everything_as_zero_sum_present": false,
    "rigid_script_reliance_present": false,
    "losing_composure_present": false,
    "never_debriefing_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "negotiation-preparation-pack",
  "atom_version": "0.1.0",
  "negotiation": "Vendor Service Level Agreement",
  "verdict": "NEGOTIATION_PREPARATION_NOT_SOUND",
  "sections": {
    "batna_reservation_price_and_zopa": "fail",
    "interests_and_value_creation": "fail",
    "improvisation_and_adaptation": "pass",
    "openings_moments_closing_and_tactics": "fail",
    "debrief_and_anti_pattern_red_lines": "fail"
  },
  "checks": [
    {
      "section": "batna_reservation_price_and_zopa",
      "check": "batna_identified",
      "status": "fail",
      "evidence": "BATNA: the Best Alternative To a Negotiated Agreement is identified"
    },
    {
      "section": "batna_reservation_price_and_zopa",
      "check": "batna_strengthened",
      "status": "pass",
      "evidence": "BATNA: the BATNA is strengthened, not only known — it is the real walk-away power"
    },
    {
      "section": "batna_reservation_price_and_zopa",
      "check": "reservation_price_set",
      "status": "pass",
      "evidence": "reservation price: the walk-away number is set before the table"
    },
    {
      "section": "batna_reservation_price_and_zopa",
      "check": "counterpart_reservation_estimated",
      "status": "pass",
      "evidence": "reservation price: the counterpart's walk-away range is estimated, so an overlap can be assessed"
    },
    {
      "section": "batna_reservation_price_and_zopa",
      "check": "zopa_assessed",
      "status": "pass",
      "evidence": "ZOPA: the Zone of Possible Agreement — where the two reservation ranges overlap — is assessed"
    },
    {
      "section": "batna_reservation_price_and_zopa",
      "check": "walk_away_commitment_declared",
      "status": "pass",
      "evidence": "reservation price: walking away beyond the reservation number is committed to in advance"
    },
    {
      "section": "batna_reservation_price_and_zopa",
      "check": "fundamentals_prepared_before_negotiation",
      "status": "pass",
      "evidence": "fundamentals: the fundamentals are prepared before the table, not improvised from nothing"
    },
    {
      "section": "interests_and_value_creation",
      "check": "own_interests_identified",
      "status": "pass",
      "evidence": "interests: the caller's own underlying interests are identified, not only the stated demand"
    },
    {
      "section": "interests_and_value_creation",
      "check": "counterpart_interests_identified",
      "status": "pass",
      "evidence": "interests: the counterpart's underlying interests are identified, not only their stated demand"
    },
    {
      "section": "interests_and_value_creation",
      "check": "counterpart_why_to_be_asked_planned",
      "status": "pass",
      "evidence": "interests: asking why the counterpart wants what they ask for is planned"
    },
    {
      "section": "interests_and_value_creation",
      "check": "interests_not_positions_framing_adopted",
      "status": "pass",
      "evidence": "interests: the negotiation is framed on underlying interests, not positions"
    },
    {
      "section": "interests_and_value_creation",
      "check": "value_created_before_claiming_planned",
      "status": "pass",
      "evidence": "value creation: expanding the pie is planned before claiming a share of it"
    },
    {
      "section": "interests_and_value_creation",
      "check": "non_zero_sum_opportunities_sought",
      "status": "pass",
      "evidence": "value creation: the deal is not treated as zero-sum — opportunities to create value are sought"
    },
    {
      "section": "interests_and_value_creation",
      "check": "trade_across_differently_valued_issues_planned",
      "status": "pass",
      "evidence": "value creation: trading across issues the two sides value differently is planned"
    },
    {
      "section": "interests_and_value_creation",
      "check": "issues_declared",
      "status": "pass",
      "evidence": "the declared record names its issues — the issues list is present and non-empty"
    },
    {
      "section": "interests_and_value_creation",
      "check": "every_issue_names_own_underlying_interest",
      "status": "fail",
      "evidence": "interests: every declared issue row names the caller's own underlying interest behind the position"
    },
    {
      "section": "interests_and_value_creation",
      "check": "every_issue_names_counterpart_underlying_interest",
      "status": "pass",
      "evidence": "interests: every declared issue row names the counterpart's underlying interest behind their position"
    },
    {
      "section": "interests_and_value_creation",
      "check": "every_issue_trade_potential_assessed",
      "status": "fail",
      "evidence": "value creation: every declared issue row has its trade potential — whether the two sides value it differently — assessed"
    },
    {
      "section": "interests_and_value_creation",
      "check": "no_issue_name_duplicated",
      "status": "pass",
      "evidence": "issues: no declared issue name is owned by more than one issue row"
    },
    {
      "section": "improvisation_and_adaptation",
      "check": "sense_of_direction_stated",
      "status": "pass",
      "evidence": "direction: a sense of direction is stated — a map that orients even when the terrain differs"
    },
    {
      "section": "improvisation_and_adaptation",
      "check": "plan_not_script_approach_adopted",
      "status": "pass",
      "evidence": "direction: the plan is carried as orientation, not as a rigid script"
    },
    {
      "section": "improvisation_and_adaptation",
      "check": "plan_b_prepared",
      "status": "pass",
      "evidence": "direction: a Plan B is carried"
    },
    {
      "section": "improvisation_and_adaptation",
      "check": "plan_c_prepared",
      "status": "pass",
      "evidence": "direction: a Plan C is carried, beyond Plan B"
    },
    {
      "section": "improvisation_and_adaptation",
      "check": "own_emotional_state_management_planned",
      "status": "pass",
      "evidence": "presence of mind: managing the caller's own emotional state during the negotiation is planned"
    },
    {
      "section": "improvisation_and_adaptation",
      "check": "composure_commitment_declared",
      "status": "pass",
      "evidence": "presence of mind: staying composed is committed to in advance"
    },
    {
      "section": "improvisation_and_adaptation",
      "check": "situational_awareness_planned",
      "status": "pass",
      "evidence": "situational awareness: reading shifting interests, constraints and emotions in real time is planned"
    },
    {
      "section": "openings_moments_closing_and_tactics",
      "check": "opening_planned",
      "status": "pass",
      "evidence": "sequence: the opening is planned"
    },
    {
      "section": "openings_moments_closing_and_tactics",
      "check": "critical_moments_recognition_planned",
      "status": "pass",
      "evidence": "sequence: recognizing the critical moments — the pivot points — is planned"
    },
    {
      "section": "openings_moments_closing_and_tactics",
      "check": "closing_cleanly_planned",
      "status": "pass",
      "evidence": "sequence: closing cleanly is planned"
    },
    {
      "section": "openings_moments_closing_and_tactics",
      "check": "anchoring_applicability_declared",
      "status": "pass",
      "evidence": "anchoring: whether the caller is informed enough to anchor first is declared — anchoring first applies only when informed"
    },
    {
      "section": "openings_moments_closing_and_tactics",
      "check": "anchor_first_planned_when_informed",
      "status": "fail",
      "evidence": "anchoring: anchoring first is planned for when the caller is informed"
    },
    {
      "section": "openings_moments_closing_and_tactics",
      "check": "counterpart_yes_made_easy_planned",
      "status": "pass",
      "evidence": "tactics: making the counterpart's yes easy is planned"
    },
    {
      "section": "openings_moments_closing_and_tactics",
      "check": "people_separated_from_problem_declared",
      "status": "pass",
      "evidence": "tactics: the people are separated from the problem"
    },
    {
      "section": "openings_moments_closing_and_tactics",
      "check": "hard_on_problem_soft_on_person_declared",
      "status": "pass",
      "evidence": "tactics: hard on the problem, soft on the person is declared"
    },
    {
      "section": "openings_moments_closing_and_tactics",
      "check": "fair_enough_agreement_aim_declared",
      "status": "pass",
      "evidence": "tactics: the aim is a fair-enough agreement that holds, not a maximal extraction"
    },
    {
      "section": "debrief_and_anti_pattern_red_lines",
      "check": "debrief_planned_after_negotiation",
      "status": "pass",
      "evidence": "debrief: a debrief after the negotiation is planned — every negotiation is debriefed"
    },
    {
      "section": "debrief_and_anti_pattern_red_lines",
      "check": "deliberate_debrief_review_committed",
      "status": "pass",
      "evidence": "debrief: the debrief is a deliberate review, committed to in advance, so learning actually happens"
    },
    {
      "section": "debrief_and_anti_pattern_red_lines",
      "check": "misleading_feedback_caution_acknowledged",
      "status": "pass",
      "evidence": "debrief: negotiation is a wicked learning environment where feedback misleads — that caution is acknowledged"
    },
    {
      "section": "debrief_and_anti_pattern_red_lines",
      "check": "no_batna",
      "status": "fail",
      "evidence": "red line: no BATNA is present in the preparation"
    },
    {
      "section": "debrief_and_anti_pattern_red_lines",
      "check": "no_arguing_positions",
      "status": "pass",
      "evidence": "red line: arguing positions is not present in the preparation"
    },
    {
      "section": "debrief_and_anti_pattern_red_lines",
      "check": "no_zero_sum_treatment",
      "status": "pass",
      "evidence": "red line: treating everything as zero-sum is not present in the preparation"
    },
    {
      "section": "debrief_and_anti_pattern_red_lines",
      "check": "no_rigid_script_reliance",
      "status": "pass",
      "evidence": "red line: reliance on a rigid script is not present in the preparation"
    },
    {
      "section": "debrief_and_anti_pattern_red_lines",
      "check": "no_losing_composure",
      "status": "pass",
      "evidence": "red line: losing composure is not present in the preparation"
    },
    {
      "section": "debrief_and_anti_pattern_red_lines",
      "check": "no_never_debriefing",
      "status": "pass",
      "evidence": "red line: never debriefing is not present in the preparation"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "issues_count": 1,
  "issues_without_own_interest": [
    "Price"
  ],
  "own_interest_coverage": "0.000000",
  "issues_without_counterpart_interest": [],
  "counterpart_interest_coverage": "1.000000",
  "issues_without_trade_potential_assessed": [
    "Price"
  ],
  "trade_potential_assessed_coverage": "0.000000",
  "duplicate_issue_names": [],
  "summary": "39 pass, 5 fail, 0 missing of 44 checks across five sections.",
  "stamp": "NEGOTIATION PREPARATION PACK\nnegotiation: Vendor Service Level Agreement\nVERDICT: NEGOTIATION_PREPARATION_NOT_SOUND\n  batna_reservation_price_and_zopa             fail\n  interests_and_value_creation                 fail\n  improvisation_and_adaptation                 pass\n  openings_moments_closing_and_tactics         fail\n  debrief_and_anti_pattern_red_lines           fail\n39 pass, 5 fail, 0 missing of 44 checks across five sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T08:32:06.582530+00:00 · gateway v1.1.0 · source `verification/work/negotiation-preparation-pack/evidence.json`.

Input:

```json
{
  "negotiation": "Malformed",
  "batna_and_reservation": "not_an_object"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "batna_and_reservation",
  "detail": "batna_and_reservation must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — this atom audits a declared negotiation-preparation record; its verdict is a completeness and consistency judgment on declared evidence, not compliance evidence in a regulated domain, not negotiation advice, a negotiation service or a prediction that a negotiation will succeed, and SERVICE.md's U-13 screen states its output could not read as regulated professional advice. |
| Checks named | 44 documented / 44 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (`issues_count`, the four row-name / name lists and the three coverage ratios) |
| Input reference typed | Yes — 56 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and the recorded MCP `inputSchema` and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/negotiation-preparation-pack/evidence.json` |
