# Difficult conversation coaching — documentation

**Difficult conversation coaching** · slug `difficult-conversation-coaching` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `conversation_title` "Vendor Payment Dispute"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "difficult-conversation-coaching"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the conversation-preparation manifest.** You declare a record of work already done — the atom audits the record, it does not do the work (see Explanation). The recorded full-pass manifest declares the conversation `Vendor Payment Dispute`: `preparation_domains` is exactly Goleman's four domains in the stated order — `self_awareness`, `self_management`, `social_awareness`, `relationship_management`. The emotion is named, a pause before reacting is planned, the stance is firm-not-hot with a regulation approach declared, there is no venting in writing and no suppression instead of regulation, and rehearsal is completed. The counterpart's emotion is considered and separated from their position, acknowledgement before redirect is planned, and the strongest reasonable version of their point is identified. The framing leads with facts and prepared specifics, the ask and boundary are stated clearly, and firm-on-substance / warm-on-tone is declared with no hostility mirroring. Feedback is declared to be given, so the feedback-points checks bind: every point is SBI-complete (situation, behavior, impact) and none targets identity. The do-not-respond list is checked and the counterpart is not on it; no thread is declared soured, so the repair-move check passes as not applicable.

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/difficult-conversation-coaching` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `CONVERSATION_PREPARATION_COMPLETE`: "31 pass, 0 fail, 0 missing of 31 checks across five sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `CONVERSATION_PREPARATION_INCOMPLETE` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "difficult-conversation-coaching"}`.
3. Call: `POST https://atoms.pipavia.com/v1/difficult-conversation-coaching` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/difficult-conversation-coaching` with the `Authorization: Bearer <key>` header — the whole MCP surface on this gateway is key-gated, including `initialize` and `tools/list`.
2. Call `tools/call` with tool name `difficult_conversation_coaching`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `CONVERSATION_PREPARATION_INCOMPLETE` means at least one check has status `fail`: a field is present but false/invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 5 checks fail: `preparation_domains_cover_all_four_in_stated_order`, `no_venting_in_writing`, `emotion_regulated_not_suppressed`, `no_feedback_point_targets_identity`, `target_not_on_do_not_respond_list`, and the summary reads "26 pass, 5 fail, 0 missing of 31 checks across five sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (see Output format). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where a number, list, object or boolean is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "self_awareness.emotion_named",
  "detail": "self_awareness.emotion_named must be a boolean"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/difficult-conversation-coaching` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/difficult-conversation-coaching` — tool name `difficult_conversation_coaching`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `difficult_conversation_coaching` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `CONVERSATION_PREPARATION_INCOMPLETE`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below exactly as SERVICE.md groups them — by the section that reads them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `conversation_title` | string | Carried into the verdict output, not itself checked |

#### Read by: preparation_and_self_regulation

| Field | Type | Notes |
|---|---|---|
| `preparation_domains` | list of strings | Computed, see below — every entry is a string by type; membership in the skill's stated four-domain vocabulary is a verdict check, not a type error |
| `self_awareness.emotion_named` | boolean | — |
| `self_awareness.pause_before_reacting_planned` | boolean | — |
| `self_management.firm_not_hot_stance_declared` | boolean | — |
| `self_management.regulation_approach_declared` | boolean | — |
| `self_management.venting_in_writing_present` | boolean | must be `false` to pass — skill anti-pattern |
| `self_management.emotion_suppressed_instead_of_regulated_present` | boolean | must be `false` to pass — skill anti-pattern |
| `rehearsal.rehearsal_completed` | boolean | — |

#### Read by: empathy_and_social_awareness

| Field | Type | Notes |
|---|---|---|
| `empathy.counterpart_emotion_considered` | boolean | — |
| `empathy.emotion_separated_from_position` | boolean | — |
| `empathy.acknowledgement_before_redirect_planned` | boolean | — |
| `empathy.strongest_reasonable_version_identified` | boolean | — |

#### Read by: framing_and_assertiveness

| Field | Type | Notes |
|---|---|---|
| `framing.facts_led_with` | boolean | — |
| `framing.specifics_prepared` | boolean | — |
| `framing.ask_stated_clearly` | boolean | — |
| `framing.boundary_stated_clearly` | boolean | — |
| `framing.firm_on_substance_warm_on_tone_declared` | boolean | — |
| `framing.hostility_mirroring_present` | boolean | must be `false` to pass — skill anti-pattern |

#### Read by: structure_feedback_and_next_step

| Field | Type | Notes |
|---|---|---|
| `structure.own_part_owned` | boolean | — |
| `structure.other_view_invited` | boolean | — |
| `structure.concrete_next_step_proposed` | boolean | — |
| `feedback.feedback_to_be_given` | boolean (gate) | boolean gate; gates the three feedback-points checks below |
| `feedback_points` | list | list of feedback-point objects, each `{name, situation_stated, behavior_described, impact_stated, targets_identity}` — see the five entry fields below; computed, see below |
| `feedback_points[].name` | string | Names the row in the computed `feedback_points_without_complete_sbi` / `feedback_points_targeting_identity` outputs |
| `feedback_points[].situation_stated` | boolean | — |
| `feedback_points[].behavior_described` | boolean | — |
| `feedback_points[].impact_stated` | boolean | — |
| `feedback_points[].targets_identity` | boolean | must be `false` on every row to pass — skill rule: critique the behavior, never the identity |

#### Read by: safeguards_repair_and_close

| Field | Type | Notes |
|---|---|---|
| `safeguards.do_not_respond_list_checked` | boolean | — |
| `safeguards.target_on_do_not_respond_list` | boolean | must be `false` to pass — skill guardrail |
| `safeguards.register_appropriate_to_relationship_declared` | boolean | — |
| `repair.thread_has_soured` | boolean (gate) | boolean gate; gates the repair-move check below |
| `repair.repair_move_planned` | boolean | required when a soured thread is declared; otherwise the check passes as not applicable |
| `repair.relationship_and_outcome_protected_over_point_scoring_declared` | boolean | — |
| `repair.winning_argument_losing_relationship_present` | boolean | must be `false` to pass — skill anti-pattern |

### Checks

All 31 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only: a conditional (gated) check whose gate is not triggered reports `pass` with evidence stating the gate was not declared — that is the not-applicable outcome. Section and verdict aggregation are defined under Verdict vocabulary.

#### Section: preparation_and_self_regulation

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `preparation_domains_declared` | Goleman's four domains: the declared preparation record names the domains it worked through — the preparation domains list is present and non-empty | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `preparation_domains_cover_all_four_in_stated_order` | Goleman's four domains: self-awareness, self-management, social awareness and relationship management are all declared, in that order — they build in that order | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `emotion_named` | self-regulation first: the emotion is named before reacting | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `pause_before_reacting_planned` | self-regulation first: a pause before reacting is planned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `firm_not_hot_stance_declared` | self-management: the stance is firm, not hot — persistent and precise, not heated | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `regulation_approach_declared` | self-management: an approach for regulating the named emotion is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_venting_in_writing` | anti-pattern: no venting in writing | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `emotion_regulated_not_suppressed` | anti-pattern: emotion is regulated, not suppressed instead of regulated | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `rehearsal_completed` | preparation: the conversation is rehearsed before it happens — the preparation record declares the rehearsal done | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
#### Section: empathy_and_social_awareness

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `counterpart_emotion_considered` | social awareness (empathy): the other person's emotional state is considered in preparation | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `emotion_separated_from_position` | empathy: the person's emotion is separated from their position | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `acknowledgement_before_redirect_planned` | empathy: acknowledgement before redirecting is planned — acknowledge first, then redirect | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `strongest_reasonable_version_identified` | empathy: the strongest reasonable version of the other person's point is identified, and the preparation responds to that version | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
#### Section: framing_and_assertiveness

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `facts_led_with` | difficult conversations: the framing leads with facts | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `specifics_prepared` | difficult conversations: the framing is specific — the specifics are prepared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ask_stated_clearly` | assertive, not aggressive: the ask is stated clearly and calmly | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `boundary_stated_clearly` | assertive, not aggressive: the boundary is stated clearly and calmly | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `firm_on_substance_warm_on_tone_declared` | the combination that moves people: completely firm on the substance while staying respectful — warm — in tone is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_hostility_mirroring` | anti-pattern: no mirroring hostility | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
#### Section: structure_feedback_and_next_step

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `own_part_owned` | difficult conversations: your own part is owned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `other_view_invited` | difficult conversations: the other view is invited | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `concrete_next_step_proposed` | difficult conversations: a concrete next step is prepared to agree on | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `feedback_points_declared_when_feedback_to_be_given` | feedback: the declared preparation record names its feedback points — the feedback points list is present and non-empty | Conditional on `feedback.feedback_to_be_given`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the requirement is declared unmet (for per-row gates: a gated row declares it unmet). Missing: the gate is declared and the required field is absent (for per-row gates: absent on a gated row). |
| `every_feedback_point_sbi_complete` | feedback: every declared feedback point is in SBI form — Situation, Behavior, Impact all stated | Conditional on `feedback.feedback_to_be_given`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the requirement is declared unmet (for per-row gates: a gated row declares it unmet). Missing: the gate is declared and the required field is absent (for per-row gates: absent on a gated row). |
| `no_feedback_point_targets_identity` | feedback: critique the behavior, never the identity — no declared feedback point targets identity | Conditional on `feedback.feedback_to_be_given`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the requirement is declared unmet (for per-row gates: a gated row declares it unmet). Missing: the gate is declared and the required field is absent (for per-row gates: absent on a gated row). |
#### Section: safeguards_repair_and_close

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `do_not_respond_list_checked` | guardrails: the do-not-respond list is checked before the conversation — people on it are handled by the owner himself | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `target_not_on_do_not_respond_list` | guardrails: the conversation's counterpart is not on the do-not-respond list | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `register_appropriate_to_relationship_declared` | guardrails: the register appropriate to the relationship is declared — strictly professional where that rule applies, warm where the relationship carries it | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `repair_move_planned_when_thread_soured` | no soured thread declared | Conditional on `repair.thread_has_soured`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the requirement is declared unmet (for per-row gates: a gated row declares it unmet). Missing: the gate is declared and the required field is absent (for per-row gates: absent on a gated row). |
| `relationship_and_outcome_protected_over_point_scoring` | repair: the preparation protects the relationship and the outcome over scoring points | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_winning_argument_losing_relationship` | anti-pattern: no winning the argument but losing the relationship | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"difficult-conversation-coaching"`), `atom_version` (`"0.1.0"`), and `conversation_title` (the manifest's declared title value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `preparation_domains_count` and `feedback_points_count` (declared list lengths as integers, or null when the list is not declared); `preparation_domains_missing` (the canonical domains not declared, in canonical order; null when the list is not declared); the row-name lists `feedback_points_without_complete_sbi` and `feedback_points_targeting_identity` (null when the `feedback_points` list is not declared); the ratios `preparation_domain_coverage` (distinct stated domains declared ÷ the four stated domains) and `sbi_coverage` (feedback points with complete SBI ÷ declared feedback points) — strings with exactly four decimal places; a ratio is null when its list is absent and, for `sbi_coverage`, also when the declared list is empty, while `preparation_domain_coverage` over an empty declared list is `"0.0000"` because its denominator is the skill's fixed four domains; and `computed_status` (see Verdict vocabulary). Ratios use the fixed serialization rule — round half up to 4dp, `floor(v * 10000 + 0.5) / 10000`, formatted with exactly four decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "31 pass, 0 fail, 0 missing of 31 checks across five sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared title value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `CONVERSATION_PREPARATION_COMPLETE` — all 31 checks pass: the declared record is complete and consistent with the bound skill's checklist, gates and red lines.
- `CONVERSATION_PREPARATION_INCOMPLETE` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one primary computed check cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes (including gated checks passing as not applicable); `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence (for gated checks: met, or the gate was not triggered — not applicable); `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

### Errors

Error bodies are the gateway's recorded shapes (`rails/gateway/src/callpath.ts`); a failed call is not metered.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | No key, or the key does not verify. On the MCP face the body is `{"error": "missing or invalid gateway API key"}`. |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the difficult_conversation_coaching scope; issue it for this atom first"}` | The key is valid but does not hold this atom's scope. Issue the key for this atom (see How-to) and retry. On the MCP face the body is `{"error": "this key does not hold the difficult_conversation_coaching scope"}`. |
| 422 | `{"ok":false,"error":"invalid_input","field":"self_awareness.emotion_named","detail":"self_awareness.emotion_named must be a boolean"}` (this atom's recorded malformed run; the shape is `{"ok": false, "error": "invalid_input", "field": "<field>", "detail": "<field> must be a <type>"}`) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. Via MCP `tools/call`, the same failure surfaces as a JSON-RPC error with code `-32602` carrying the detail message. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for difficult-conversation-coaching exceeded"}` (or the `10000/day` variant) | Per-key rate limit exceeded for this atom; the call is not metered. Via MCP `tools/call` it surfaces as a JSON-RPC error with code `-32029`. |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** When emotions drive the outcome, manages those first — firm on substance, warm on tone, using Goleman's four domains (bound from the emotional-intelligence skill). Despite the atom's name, it sells no coaching advice: it audits a declared preparation record (see Explanation). You submit one declared record — the conversation-preparation manifest — and the atom audits that record for completeness and internal consistency against the bound skill's checklist, quality gates and red lines, returning one deterministic verdict across 5 sections (`preparation_and_self_regulation`, `empathy_and_social_awareness`, `framing_and_assertiveness`, `structure_feedback_and_next_step`, `safeguards_repair_and_close`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — list presence, per-row completeness, cross-row consistency and, where the skill states them, its own arithmetic — using only the declared record, with no outside threshold imported. *Conditional checks* bind only when their declared gate field says the situation applies; when the gate is not triggered they pass as not applicable, and their evidence text says so. Aggregation is strict: any `fail` anywhere produces `CONVERSATION_PREPARATION_INCOMPLETE`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `CONVERSATION_PREPARATION_COMPLETE`. The central semantic is the absent/false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented: no minimum pause length before reacting, no minimum rehearsal count or duration, no minimum number of facts, specifics or feedback points beyond at least one when feedback is declared, no deadline or timeframe for the concrete next step, no numeric empathy, warmth, tone or wording-quality score, and no domain-practice duration for any of the four domains. The one vocabulary bar is the skill's own stated structure: the four domains, exactly and in order.

**What it does NOT do.** The atom audits a **declared** record: a verdict of `CONVERSATION_PREPARATION_COMPLETE` means the record is complete and consistent *on the caller's declared evidence* — a manifest that declares the required acts passes those checks even if the real work did none of it. It is a completeness and consistency audit, not a certification of the underlying work. Specifically: it does not coach, generate dialogue or wording, rehearse anyone, sit in on or verify any conversation, or verify that a declared preparation step actually happened or was done well. Everything judgment-shaped is caller declaration only and is NOT judged: whether the declared empathy is genuine or well-aimed; whether the wording, tone or warmth of anything the caller will say is actually right; whether the timing is right; whether the named emotion is the true emotion; whether the identified "strongest reasonable version" is actually the strongest or the reasonable one; whether the facts led with are accurate or complete; whether the ask, boundary or next step is the right one; and whether the conversation will go well. No do-not-respond list is held or consulted by the atom — the record declares only that the caller's own list was checked and whether the counterpart is on it. The skill's named-person register rules are not reduced to per-person checks, and its escalation-colour worked examples reduce only to the firm-not-hot declaration already checked. The register's named doubt for this atom — "Generic coaching advice" — is answered by this scoping, not resolved away: the atom sells no advice at all, only the audit.

**Buyer and use context.** Teams and agents working in Mind & personal growth who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: vendor escalation communication coaching. Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulator view: N/A — this atom audits a declared conversation-preparation record; its verdict is a preparation-completeness judgment, not compliance or audit evidence, and interpersonal communication preparation is not a regulated domain. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `difficult_conversation_coaching` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly four decimal places under the fixed rule `floor(v * 10000 + 0.5) / 10000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/difficult_conversation_coaching.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_difficult_conversation_coaching.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/difficult-conversation-coaching` (REST) and `POST /mcp/difficult-conversation-coaching` (MCP, tool `difficult_conversation_coaching`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification. Key scope: `difficult_conversation_coaching`. Rate limits: 60/minute, 10,000/day per key per atom (429 `rate_limit`, not metered). Error monitoring: watch 401 `unauthorized` (key problems), 403 `scope_required` (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live — release candidate, one-week RC soak to 2026-11-22; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Worked examples

Provenance: recorded 2026-11-16T03:29:45.995467+00:00 against gateway v1.1.0, external verification lane, source `verification/work/difficult-conversation-coaching/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Input:

```json
{
  "conversation_title": "Vendor Payment Dispute",
  "preparation_domains": [
    "self_awareness",
    "self_management",
    "social_awareness",
    "relationship_management"
  ],
  "self_awareness": {
    "emotion_named": true,
    "pause_before_reacting_planned": true
  },
  "self_management": {
    "firm_not_hot_stance_declared": true,
    "regulation_approach_declared": true,
    "venting_in_writing_present": false,
    "emotion_suppressed_instead_of_regulated_present": false
  },
  "rehearsal": {
    "rehearsal_completed": true
  },
  "empathy": {
    "counterpart_emotion_considered": true,
    "emotion_separated_from_position": true,
    "acknowledgement_before_redirect_planned": true,
    "strongest_reasonable_version_identified": true
  },
  "framing": {
    "facts_led_with": true,
    "specifics_prepared": true,
    "ask_stated_clearly": true,
    "boundary_stated_clearly": true,
    "firm_on_substance_warm_on_tone_declared": true,
    "hostility_mirroring_present": false
  },
  "structure": {
    "own_part_owned": true,
    "other_view_invited": true,
    "concrete_next_step_proposed": true
  },
  "feedback": {
    "feedback_to_be_given": true
  },
  "feedback_points": [
    {
      "name": "Point 1",
      "situation_stated": true,
      "behavior_described": true,
      "impact_stated": true,
      "targets_identity": false
    }
  ],
  "safeguards": {
    "do_not_respond_list_checked": true,
    "target_on_do_not_respond_list": false,
    "register_appropriate_to_relationship_declared": true
  },
  "repair": {
    "thread_has_soured": false,
    "repair_move_planned": false,
    "relationship_and_outcome_protected_over_point_scoring_declared": true,
    "winning_argument_losing_relationship_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "difficult-conversation-coaching",
  "atom_version": "0.1.0",
  "conversation_title": "Vendor Payment Dispute",
  "verdict": "CONVERSATION_PREPARATION_COMPLETE",
  "sections": {
    "preparation_and_self_regulation": "pass",
    "empathy_and_social_awareness": "pass",
    "framing_and_assertiveness": "pass",
    "structure_feedback_and_next_step": "pass",
    "safeguards_repair_and_close": "pass"
  },
  "checks": [
    {
      "section": "preparation_and_self_regulation",
      "check": "preparation_domains_declared",
      "status": "pass",
      "evidence": "Goleman's four domains: the declared preparation record names the domains it worked through \u2014 the preparation domains list is present and non-empty"
    },
    {
      "section": "preparation_and_self_regulation",
      "check": "preparation_domains_cover_all_four_in_stated_order",
      "status": "pass",
      "evidence": "Goleman's four domains: self-awareness, self-management, social awareness and relationship management are all declared, in that order \u2014 they build in that order"
    },
    {
      "section": "preparation_and_self_regulation",
      "check": "emotion_named",
      "status": "pass",
      "evidence": "self-regulation first: the emotion is named before reacting"
    },
    {
      "section": "preparation_and_self_regulation",
      "check": "pause_before_reacting_planned",
      "status": "pass",
      "evidence": "self-regulation first: a pause before reacting is planned"
    },
    {
      "section": "preparation_and_self_regulation",
      "check": "firm_not_hot_stance_declared",
      "status": "pass",
      "evidence": "self-management: the stance is firm, not hot \u2014 persistent and precise, not heated"
    },
    {
      "section": "preparation_and_self_regulation",
      "check": "regulation_approach_declared",
      "status": "pass",
      "evidence": "self-management: an approach for regulating the named emotion is declared"
    },
    {
      "section": "preparation_and_self_regulation",
      "check": "no_venting_in_writing",
      "status": "pass",
      "evidence": "anti-pattern: no venting in writing"
    },
    {
      "section": "preparation_and_self_regulation",
      "check": "emotion_regulated_not_suppressed",
      "status": "pass",
      "evidence": "anti-pattern: emotion is regulated, not suppressed instead of regulated"
    },
    {
      "section": "preparation_and_self_regulation",
      "check": "rehearsal_completed",
      "status": "pass",
      "evidence": "preparation: the conversation is rehearsed before it happens \u2014 the preparation record declares the rehearsal done"
    },
    {
      "section": "empathy_and_social_awareness",
      "check": "counterpart_emotion_considered",
      "status": "pass",
      "evidence": "social awareness (empathy): the other person's emotional state is considered in preparation"
    },
    {
      "section": "empathy_and_social_awareness",
      "check": "emotion_separated_from_position",
      "status": "pass",
      "evidence": "empathy: the person's emotion is separated from their position"
    },
    {
      "section": "empathy_and_social_awareness",
      "check": "acknowledgement_before_redirect_planned",
      "status": "pass",
      "evidence": "empathy: acknowledgement before redirecting is planned \u2014 acknowledge first, then redirect"
    },
    {
      "section": "empathy_and_social_awareness",
      "check": "strongest_reasonable_version_identified",
      "status": "pass",
      "evidence": "empathy: the strongest reasonable version of the other person's point is identified, and the preparation responds to that version"
    },
    {
      "section": "framing_and_assertiveness",
      "check": "facts_led_with",
      "status": "pass",
      "evidence": "difficult conversations: the framing leads with facts"
    },
    {
      "section": "framing_and_assertiveness",
      "check": "specifics_prepared",
      "status": "pass",
      "evidence": "difficult conversations: the framing is specific \u2014 the specifics are prepared"
    },
    {
      "section": "framing_and_assertiveness",
      "check": "ask_stated_clearly",
      "status": "pass",
      "evidence": "assertive, not aggressive: the ask is stated clearly and calmly"
    },
    {
      "section": "framing_and_assertiveness",
      "check": "boundary_stated_clearly",
      "status": "pass",
      "evidence": "assertive, not aggressive: the boundary is stated clearly and calmly"
    },
    {
      "section": "framing_and_assertiveness",
      "check": "firm_on_substance_warm_on_tone_declared",
      "status": "pass",
      "evidence": "the combination that moves people: completely firm on the substance while staying respectful \u2014 warm \u2014 in tone is declared"
    },
    {
      "section": "framing_and_assertiveness",
      "check": "no_hostility_mirroring",
      "status": "pass",
      "evidence": "anti-pattern: no mirroring hostility"
    },
    {
      "section": "structure_feedback_and_next_step",
      "check": "own_part_owned",
      "status": "pass",
      "evidence": "difficult conversations: your own part is owned"
    },
    {
      "section": "structure_feedback_and_next_step",
      "check": "other_view_invited",
      "status": "pass",
      "evidence": "difficult conversations: the other view is invited"
    },
    {
      "section": "structure_feedback_and_next_step",
      "check": "concrete_next_step_proposed",
      "status": "pass",
      "evidence": "difficult conversations: a concrete next step is prepared to agree on"
    },
    {
      "section": "structure_feedback_and_next_step",
      "check": "feedback_points_declared_when_feedback_to_be_given",
      "status": "pass",
      "evidence": "feedback: the declared preparation record names its feedback points \u2014 the feedback points list is present and non-empty"
    },
    {
      "section": "structure_feedback_and_next_step",
      "check": "every_feedback_point_sbi_complete",
      "status": "pass",
      "evidence": "feedback: every declared feedback point is in SBI form \u2014 Situation, Behavior, Impact all stated"
    },
    {
      "section": "structure_feedback_and_next_step",
      "check": "no_feedback_point_targets_identity",
      "status": "pass",
      "evidence": "feedback: critique the behavior, never the identity \u2014 no declared feedback point targets identity"
    },
    {
      "section": "safeguards_repair_and_close",
      "check": "do_not_respond_list_checked",
      "status": "pass",
      "evidence": "guardrails: the do-not-respond list is checked before the conversation \u2014 people on it are handled by the owner himself"
    },
    {
      "section": "safeguards_repair_and_close",
      "check": "target_not_on_do_not_respond_list",
      "status": "pass",
      "evidence": "guardrails: the conversation's counterpart is not on the do-not-respond list"
    },
    {
      "section": "safeguards_repair_and_close",
      "check": "register_appropriate_to_relationship_declared",
      "status": "pass",
      "evidence": "guardrails: the register appropriate to the relationship is declared \u2014 strictly professional where that rule applies, warm where the relationship carries it"
    },
    {
      "section": "safeguards_repair_and_close",
      "check": "repair_move_planned_when_thread_soured",
      "status": "pass",
      "evidence": "no soured thread declared"
    },
    {
      "section": "safeguards_repair_and_close",
      "check": "relationship_and_outcome_protected_over_point_scoring",
      "status": "pass",
      "evidence": "repair: the preparation protects the relationship and the outcome over scoring points"
    },
    {
      "section": "safeguards_repair_and_close",
      "check": "no_winning_argument_losing_relationship",
      "status": "pass",
      "evidence": "anti-pattern: no winning the argument but losing the relationship"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "preparation_domains_count": 4,
  "preparation_domains_missing": [],
  "preparation_domain_coverage": "1.0000",
  "feedback_points_count": 1,
  "feedback_points_without_complete_sbi": [],
  "feedback_points_targeting_identity": [],
  "sbi_coverage": "1.0000",
  "summary": "31 pass, 0 fail, 0 missing of 31 checks across five sections.",
  "stamp": "DIFFICULT CONVERSATION COACHING\nconversation_title: Vendor Payment Dispute\nVERDICT: CONVERSATION_PREPARATION_COMPLETE\n  preparation_and_self_regulation      pass\n  empathy_and_social_awareness         pass\n  framing_and_assertiveness            pass\n  structure_feedback_and_next_step     pass\n  safeguards_repair_and_close          pass\n31 pass, 0 fail, 0 missing of 31 checks across five sections."
}
```

### Example 2 — Violations (case `violations`)

Input:

```json
{
  "conversation_title": "Bad Feedback",
  "preparation_domains": [
    "self_awareness",
    "self_management"
  ],
  "self_awareness": {
    "emotion_named": true,
    "pause_before_reacting_planned": true
  },
  "self_management": {
    "firm_not_hot_stance_declared": true,
    "regulation_approach_declared": true,
    "venting_in_writing_present": true,
    "emotion_suppressed_instead_of_regulated_present": true
  },
  "rehearsal": {
    "rehearsal_completed": true
  },
  "empathy": {
    "counterpart_emotion_considered": true,
    "emotion_separated_from_position": true,
    "acknowledgement_before_redirect_planned": true,
    "strongest_reasonable_version_identified": true
  },
  "framing": {
    "facts_led_with": true,
    "specifics_prepared": true,
    "ask_stated_clearly": true,
    "boundary_stated_clearly": true,
    "firm_on_substance_warm_on_tone_declared": true,
    "hostility_mirroring_present": false
  },
  "structure": {
    "own_part_owned": true,
    "other_view_invited": true,
    "concrete_next_step_proposed": true
  },
  "feedback": {
    "feedback_to_be_given": true
  },
  "feedback_points": [
    {
      "name": "Point 1",
      "situation_stated": true,
      "behavior_described": true,
      "impact_stated": true,
      "targets_identity": true
    }
  ],
  "safeguards": {
    "do_not_respond_list_checked": true,
    "target_on_do_not_respond_list": true,
    "register_appropriate_to_relationship_declared": true
  },
  "repair": {
    "thread_has_soured": false,
    "repair_move_planned": false,
    "relationship_and_outcome_protected_over_point_scoring_declared": true,
    "winning_argument_losing_relationship_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "difficult-conversation-coaching",
  "atom_version": "0.1.0",
  "conversation_title": "Bad Feedback",
  "verdict": "CONVERSATION_PREPARATION_INCOMPLETE",
  "sections": {
    "preparation_and_self_regulation": "fail",
    "empathy_and_social_awareness": "pass",
    "framing_and_assertiveness": "pass",
    "structure_feedback_and_next_step": "fail",
    "safeguards_repair_and_close": "fail"
  },
  "checks": [
    {
      "section": "preparation_and_self_regulation",
      "check": "preparation_domains_declared",
      "status": "pass",
      "evidence": "Goleman's four domains: the declared preparation record names the domains it worked through \u2014 the preparation domains list is present and non-empty"
    },
    {
      "section": "preparation_and_self_regulation",
      "check": "preparation_domains_cover_all_four_in_stated_order",
      "status": "fail",
      "evidence": "Goleman's four domains: self-awareness, self-management, social awareness and relationship management are all declared, in that order \u2014 they build in that order"
    },
    {
      "section": "preparation_and_self_regulation",
      "check": "emotion_named",
      "status": "pass",
      "evidence": "self-regulation first: the emotion is named before reacting"
    },
    {
      "section": "preparation_and_self_regulation",
      "check": "pause_before_reacting_planned",
      "status": "pass",
      "evidence": "self-regulation first: a pause before reacting is planned"
    },
    {
      "section": "preparation_and_self_regulation",
      "check": "firm_not_hot_stance_declared",
      "status": "pass",
      "evidence": "self-management: the stance is firm, not hot \u2014 persistent and precise, not heated"
    },
    {
      "section": "preparation_and_self_regulation",
      "check": "regulation_approach_declared",
      "status": "pass",
      "evidence": "self-management: an approach for regulating the named emotion is declared"
    },
    {
      "section": "preparation_and_self_regulation",
      "check": "no_venting_in_writing",
      "status": "fail",
      "evidence": "anti-pattern: no venting in writing"
    },
    {
      "section": "preparation_and_self_regulation",
      "check": "emotion_regulated_not_suppressed",
      "status": "fail",
      "evidence": "anti-pattern: emotion is regulated, not suppressed instead of regulated"
    },
    {
      "section": "preparation_and_self_regulation",
      "check": "rehearsal_completed",
      "status": "pass",
      "evidence": "preparation: the conversation is rehearsed before it happens \u2014 the preparation record declares the rehearsal done"
    },
    {
      "section": "empathy_and_social_awareness",
      "check": "counterpart_emotion_considered",
      "status": "pass",
      "evidence": "social awareness (empathy): the other person's emotional state is considered in preparation"
    },
    {
      "section": "empathy_and_social_awareness",
      "check": "emotion_separated_from_position",
      "status": "pass",
      "evidence": "empathy: the person's emotion is separated from their position"
    },
    {
      "section": "empathy_and_social_awareness",
      "check": "acknowledgement_before_redirect_planned",
      "status": "pass",
      "evidence": "empathy: acknowledgement before redirecting is planned \u2014 acknowledge first, then redirect"
    },
    {
      "section": "empathy_and_social_awareness",
      "check": "strongest_reasonable_version_identified",
      "status": "pass",
      "evidence": "empathy: the strongest reasonable version of the other person's point is identified, and the preparation responds to that version"
    },
    {
      "section": "framing_and_assertiveness",
      "check": "facts_led_with",
      "status": "pass",
      "evidence": "difficult conversations: the framing leads with facts"
    },
    {
      "section": "framing_and_assertiveness",
      "check": "specifics_prepared",
      "status": "pass",
      "evidence": "difficult conversations: the framing is specific \u2014 the specifics are prepared"
    },
    {
      "section": "framing_and_assertiveness",
      "check": "ask_stated_clearly",
      "status": "pass",
      "evidence": "assertive, not aggressive: the ask is stated clearly and calmly"
    },
    {
      "section": "framing_and_assertiveness",
      "check": "boundary_stated_clearly",
      "status": "pass",
      "evidence": "assertive, not aggressive: the boundary is stated clearly and calmly"
    },
    {
      "section": "framing_and_assertiveness",
      "check": "firm_on_substance_warm_on_tone_declared",
      "status": "pass",
      "evidence": "the combination that moves people: completely firm on the substance while staying respectful \u2014 warm \u2014 in tone is declared"
    },
    {
      "section": "framing_and_assertiveness",
      "check": "no_hostility_mirroring",
      "status": "pass",
      "evidence": "anti-pattern: no mirroring hostility"
    },
    {
      "section": "structure_feedback_and_next_step",
      "check": "own_part_owned",
      "status": "pass",
      "evidence": "difficult conversations: your own part is owned"
    },
    {
      "section": "structure_feedback_and_next_step",
      "check": "other_view_invited",
      "status": "pass",
      "evidence": "difficult conversations: the other view is invited"
    },
    {
      "section": "structure_feedback_and_next_step",
      "check": "concrete_next_step_proposed",
      "status": "pass",
      "evidence": "difficult conversations: a concrete next step is prepared to agree on"
    },
    {
      "section": "structure_feedback_and_next_step",
      "check": "feedback_points_declared_when_feedback_to_be_given",
      "status": "pass",
      "evidence": "feedback: the declared preparation record names its feedback points \u2014 the feedback points list is present and non-empty"
    },
    {
      "section": "structure_feedback_and_next_step",
      "check": "every_feedback_point_sbi_complete",
      "status": "pass",
      "evidence": "feedback: every declared feedback point is in SBI form \u2014 Situation, Behavior, Impact all stated"
    },
    {
      "section": "structure_feedback_and_next_step",
      "check": "no_feedback_point_targets_identity",
      "status": "fail",
      "evidence": "feedback: critique the behavior, never the identity \u2014 no declared feedback point targets identity"
    },
    {
      "section": "safeguards_repair_and_close",
      "check": "do_not_respond_list_checked",
      "status": "pass",
      "evidence": "guardrails: the do-not-respond list is checked before the conversation \u2014 people on it are handled by the owner himself"
    },
    {
      "section": "safeguards_repair_and_close",
      "check": "target_not_on_do_not_respond_list",
      "status": "fail",
      "evidence": "guardrails: the conversation's counterpart is not on the do-not-respond list"
    },
    {
      "section": "safeguards_repair_and_close",
      "check": "register_appropriate_to_relationship_declared",
      "status": "pass",
      "evidence": "guardrails: the register appropriate to the relationship is declared \u2014 strictly professional where that rule applies, warm where the relationship carries it"
    },
    {
      "section": "safeguards_repair_and_close",
      "check": "repair_move_planned_when_thread_soured",
      "status": "pass",
      "evidence": "no soured thread declared"
    },
    {
      "section": "safeguards_repair_and_close",
      "check": "relationship_and_outcome_protected_over_point_scoring",
      "status": "pass",
      "evidence": "repair: the preparation protects the relationship and the outcome over scoring points"
    },
    {
      "section": "safeguards_repair_and_close",
      "check": "no_winning_argument_losing_relationship",
      "status": "pass",
      "evidence": "anti-pattern: no winning the argument but losing the relationship"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "preparation_domains_count": 2,
  "preparation_domains_missing": [
    "social_awareness",
    "relationship_management"
  ],
  "preparation_domain_coverage": "0.5000",
  "feedback_points_count": 1,
  "feedback_points_without_complete_sbi": [],
  "feedback_points_targeting_identity": [
    "Point 1"
  ],
  "sbi_coverage": "1.0000",
  "summary": "26 pass, 5 fail, 0 missing of 31 checks across five sections.",
  "stamp": "DIFFICULT CONVERSATION COACHING\nconversation_title: Bad Feedback\nVERDICT: CONVERSATION_PREPARATION_INCOMPLETE\n  preparation_and_self_regulation      fail\n  empathy_and_social_awareness         pass\n  framing_and_assertiveness            pass\n  structure_feedback_and_next_step     fail\n  safeguards_repair_and_close          fail\n26 pass, 5 fail, 0 missing of 31 checks across five sections."
}
```

### Example 3 — Malformed (case `malformed`)

Input:

```json
{
  "conversation_title": "Malformed",
  "preparation_domains": [
    "self_awareness",
    "self_management",
    "social_awareness",
    "relationship_management"
  ],
  "self_awareness": {
    "emotion_named": "should-be-boolean"
  }
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "self_awareness.emotion_named",
  "detail": "self_awareness.emotion_named must be a boolean"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — N/A — this atom audits a declared conversation-preparation record; its verdict is a preparation-completeness judgment, not compliance or audit evidence, and interpersonal communication preparation is not a regulated domain. |
| Checks named | 31 documented / 31 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses (not-applicable expressed as a gated `pass`) |
| Input reference typed | Yes — 36 fields, each with its type from SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/difficult-conversation-coaching/evidence.json` |
