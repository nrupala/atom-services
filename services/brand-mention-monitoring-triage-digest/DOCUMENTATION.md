# Brand mention monitoring triage digest — documentation

**Brand mention monitoring triage digest** · slug `brand-mention-monitoring-triage-digest` · deliverable type: CHECK · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. The worked examples at the end are real recorded trial runs, reproduced verbatim from the external verification evidence.

## Tutorial

A first call, walked through end to end. This tutorial narrates the recorded full-pass trial run (Worked example 1 below reproduces it verbatim); every value named here is the value that run actually returned.

**The job.** You have a brand-mention monitoring, triage and digest setup — the watch the caller declares they run for a brand, and you want one deterministic verdict on whether it is complete and internally coherent on its own declared evidence.

**Step 1 — get a key.** Sign up and issue a gateway key for this atom (the exact calls are in *How-to guides → Get a key and call via REST*). Keep the key; you send it as `Authorization: Bearer <key>` on every call.

**Step 2 — assemble the manifest.** Build one JSON object covering every section: `inventory_and_coverage`, `triage_rubric`, `response_policy`, `alert_hygiene_and_evidence`, `digest_reporting`, `red_lines`. In the recorded run the identity field `brand` was `"Nrupal"`. Fill each evidence field honestly from your own records: `true` where the practice was followed, `false` where a must-be-false field applies (see the Input reference — those fields must be `false` to pass), and the declared lists and numbers the computed checks re-derive. Leave a field out only if you genuinely have no evidence for it — an absent field is not a failure, it is `missing`, and it will hold the verdict at `INSUFFICIENT_EVIDENCE`.

**Step 3 — send it.** `POST https://atoms.pipavia.com/v1/brand-mention-monitoring-triage-digest` with the manifest as the body and your key in the `Authorization` header.

**Step 4 — read the verdict.** The recorded run returned HTTP 200 with verdict `TRIAGE_DIGEST_READY`: every section `pass`, and the summary "37 pass, 0 fail, 0 missing of 37 checks across six sections." The computed fields came back `computed_status` = `"within_stated_limits_on_declared_evidence"`, `triage_dimensions_missing` = `[]`, `triage_routes_missing` = `[]`, `actions_without_archived_evidence` = `0` — the declared lists and numbers agree with the limits the method itself states, on the declared evidence.

**Step 5 — act on it.** A `TRIAGE_DIGEST_READY` verdict means the manifest is complete on the evidence you declared — it does not certify that the underlying work is good (see *Explanation → What it does not do*). If instead you get the failing verdict or `INSUFFICIENT_EVIDENCE`, the `checks` array names exactly which checks failed or are missing; *How-to guides → Read a failing verdict and fix the manifest* walks through that repair loop using the recorded violations run.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "brand-mention-monitoring-triage-digest"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.
4. Call the atom: `POST https://atoms.pipavia.com/v1/brand-mention-monitoring-triage-digest` — body = the manifest object (see the Input reference).

```bash
curl -s -X POST https://atoms.pipavia.com/v1/brand-mention-monitoring-triage-digest \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -d @manifest.json
```

The response is the verdict object described in *Reference → Output format*. The same manifest always returns the same verdict (determinism was byte-identical on the recorded repeat call — see TEST-REPORT.md).

### Call via MCP

- Endpoint: `POST https://atoms.pipavia.com/mcp/brand-mention-monitoring-triage-digest`
- Tool name: `brand_mention_monitoring_triage_digest`
- Call `tools/call` with the tool name above and the manifest object as the arguments — the same object you would send as the REST body, with the same `Authorization: Bearer <key>` header.
- The MCP result's structured content is the same verdict object as the REST response (parity was verified structured-equal on the recorded full-pass run — see TEST-REPORT.md). Prefer whichever face your client already speaks; do not expect different verdicts from the two faces.

### Read a failing verdict and fix the manifest

The recorded violations run (Worked example 2) returned verdict `TRIAGE_DIGEST_NOT_READY` with the summary "0 pass, 4 fail, 33 missing of 37 checks across six sections." Repair any failing verdict the same way:

1. **Read `sections` first.** A section is `fail` when any of its checks fails, `insufficient_evidence` when none fails but at least one is `missing`, and `pass` only when all its checks pass. That tells you where to look.
2. **Read the `checks` array.** Each entry is `{section, check, status, evidence}`. Work the `fail` entries first — the `evidence` text states the rule that was breached. In the recorded violations run the failing checks were: `all_stated_triage_dimensions_used`, `all_stated_triage_routes_defined`, `evidence_archived_for_every_action`, `no_astroturfing_or_fake_engagement`.
3. **Distinguish `fail` from `missing`.** `fail` = the field was present but false, invalid, or arithmetically/set-wise incoherent — fix the underlying practice or correct the declaration. `missing` = the field was absent — supply the evidence; do not guess a value to make the check pass, because the atom audits declarations, and a declaration you cannot stand behind is worse than a missing one.
4. **Check the computed fields.** On a failing verdict the computed outputs (see *Reference → Output format*) show the re-derived values and the differences, so you can see by how much a declared total, count, or list disagrees before you resubmit.
5. **Fix the manifest and resubmit the whole object.** The atom is stateless per call: there is no partial update, no case to reopen, and no memory of the previous submission. Resubmit the corrected full manifest and read the new verdict.

### Handle a 422 invalid_input

A type violation is not a verdict — the call is rejected before any check runs. The recorded malformed run (Worked example 3) returned HTTP 422 with this body:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "inventory",
  "detail": "inventory must be an object"
}
```

- `field` names the exact manifest field whose type was wrong (`inventory` in the recorded run); `detail` states the type it must be (`"inventory must be an object"`).
- Fix that field's type in the manifest (consult the type column of the Input reference), then resubmit. If you sent several wrongly-typed fields, expect to repeat this once per call — the recorded shape reports one `field` per response.
- Do not retry the identical body: a 422 is deterministic for the same input and will not clear on its own. It is also not a rate-limit or auth problem — check the `error` value first: `invalid_input` means the manifest, not the key.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/brand-mention-monitoring-triage-digest` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/brand-mention-monitoring-triage-digest` — tool name `brand_mention_monitoring_triage_digest`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Gateway: https://atoms.pipavia.com, gateway version 1.1.0 at the time of the recorded runs. Key scope: this atom only — a key's scope for one atom never verifies for another (contract.yaml key namespace `brand_mention_monitoring_triage_digest`).

### Input reference

One JSON manifest. Types are taken from SERVICE.md's field table (its preamble states: all fields are booleans unless noted); the evidence `inputSchema` corroborates the top-level object/string/array types. Notes — including must-be-false gates and computed/conditional behaviour — are preserved from SERVICE.md. Fields are grouped as SERVICE.md groups them (by the section that reads them).

#### Carried / top-level (not itself checked)

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `brand` | string | string; carried into the verdict output, not itself checked |

#### Read by section `inventory_and_coverage`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `inventory.names_handles_products_listed` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `inventory.misspellings_and_variants_included` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `inventory.owned_vs_third_party_distinguished` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `coverage.sources_listed` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `coverage.blind_spots_acknowledged` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `coverage.mechanism_configured_per_source` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `coverage.cadence_defined` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `coverage.crisis_cadence_realtime` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `coverage.routine_cadence_daily_digest` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |

#### Read by section `triage_rubric`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `triage.rubric_documented` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `triage.dimensions` | list of strings | list of strings; computed, see below |
| `triage.routes` | list of strings | list of strings; computed, see below |
| `triage.escalation_path_documented` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `triage.false_positives_tracked` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |

#### Read by section `response_policy`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `response.authority_to_speak_defined` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `response.tone_rules_defined` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `response.dm_move_criteria_defined` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `response.statement_criteria_defined` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `response.templates_approved` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |

#### Read by section `alert_hygiene_and_evidence`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `alerts.thresholds_defined` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `alerts.dedupe_enabled` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `alerts.quiet_hours_defined` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `alerts.tested_after_setup` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `evidence.archiving_required_before_response` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `counts.total_mentions` | number | number; computed, see below |
| `counts.actions_taken` | number | number; computed, see below |
| `counts.actions_with_evidence_archived` | number | number; computed, see below |

#### Read by section `digest_reporting`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `digest.weekly_cadence` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `digest.includes_notable_mentions` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `digest.includes_trend_notes` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `digest.sentiment_included` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `digest.sentiment_caveats_stated` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `digest.actions_taken_listed` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `digest.signal_separated_from_noise` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |

#### Read by section `red_lines`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `conduct.astroturfing_fake_reviews_or_manufactured_engagement` | boolean | must be `false` to pass — skill red line |
| `conduct.public_argument_without_policy_backing` | boolean | must be `false` to pass — skill red line |
| `conduct.retaliation_against_mentioners` | boolean | must be `false` to pass — skill red line |
| `conduct.private_data_of_individuals_exposed` | boolean | must be `false` to pass — skill red line |
| `conduct.defamation_or_impersonation_fought_publicly_instead_of_counsel` | boolean | must be `false` to pass — skill red line |

Container objects (the section objects and any list-of-objects entries above) are objects/arrays as typed; a container sent as the wrong JSON type is a 422 `invalid_input`, not a failing check (see Errors).

### Checks

Every check the atom runs — 37 checks, grouped by section. Ground truth: the `checks` array of the recorded full-pass REST response (Worked example 1), cross-checked against SERVICE.md; the counts agree (37/37). The `evidence` text quoted for each check is the recorded response's own statement of what the check requires.

**Per-check status semantics (all checks):** `pass` — the recorded evidence satisfies the stated requirement; `fail` — the field was present but false/invalid, or a computed condition (arithmetic, set coverage, vocabulary) was not met; `missing` — the field(s) the check reads were absent, so there is no evidence to judge. No `not_applicable` per-check status is returned by this atom in any recorded case.

#### Section `inventory_and_coverage` — 9 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `names_handles_products_listed` | method step 1: names, handles and products under watch are listed |
| `misspellings_and_variants_included` | method step 1: misspellings and variants of the watched names are included in the inventory |
| `owned_vs_third_party_distinguished` | method step 1: owned channels are distinguished from third-party sources |
| `coverage_sources_listed` | method step 1: where discussion happens is listed — the coverage list is written |
| `blind_spots_acknowledged` | quality gate: the coverage list acknowledges its blind spots (e.g. logged-in-only platforms, DMs) |
| `coverage_mechanism_configured_per_source` | method step 2: a coverage mechanism (RSS, APIs, saved searches, alerts, webmentions) is configured per source |
| `cadence_defined` | method step 2: a monitoring cadence is defined |
| `crisis_cadence_realtime` | method step 2: the cadence is real-time for crises |
| `routine_cadence_daily_digest` | method step 2: the cadence is a daily digest otherwise |

#### Section `triage_rubric` — 5 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `triage_rubric_documented` | quality gate: the triage rubric is documented |
| `all_stated_triage_dimensions_used` | method step 3: the rubric scores every dimension the skill names — severity, reach, authenticity (is it spam/astroturf?) |
| `all_stated_triage_routes_defined` | method step 3: the rubric defines every route the skill names — ignore, monitor, reply, escalate, legal |
| `escalation_path_documented` | quality gate: the escalation path is documented |
| `false_positives_tracked` | method step 3: false positives get tracked too |

#### Section `response_policy` — 5 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `authority_to_speak_defined` | quality gate: authority to speak is defined — who may speak as the brand |
| `tone_rules_defined` | method step 4: tone rules for responses are defined |
| `dm_move_criteria_defined` | method step 4: when to take a conversation to DM is defined |
| `statement_criteria_defined` | method step 4: when to publish a statement is defined |
| `response_templates_approved` | quality gate: response templates for common cases are drafted and approved |

#### Section `alert_hygiene_and_evidence` — 6 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `alert_thresholds_defined` | method step 5: alert thresholds are defined |
| `alert_dedupe_enabled` | method step 5: alerts are deduplicated — no alert storms |
| `alert_quiet_hours_defined` | method step 5: alert quiet hours are defined |
| `alerts_tested_after_setup` | method step 5: alerts are tested after setup |
| `evidence_archived_before_response` | method step 6: every actionable mention is archived (screenshot + link) before responding — posts get deleted |
| `evidence_archived_for_every_action` | quality gate: evidence is archived for every action taken — the archived count equals the actions-taken count, with coherent counts |

#### Section `digest_reporting` — 7 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `digest_weekly_cadence` | method step 7: the report is a weekly digest |
| `digest_includes_notable_mentions` | method step 7: the digest includes notable mentions |
| `digest_includes_trend_notes` | method step 7: the digest includes trend notes |
| `digest_sentiment_included` | method step 7: the digest includes sentiment |
| `digest_sentiment_caveats_stated` | method step 7: sentiment is reported with caveats |
| `digest_actions_taken_listed` | method step 7: the digest lists actions taken |
| `signal_separated_from_noise` | method step 7: signal is separated from noise explicitly |

#### Section `red_lines` — 5 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `no_astroturfing_or_fake_engagement` | red line: no astroturfing, fake reviews, or manufactured engagement — ever |
| `no_public_argument_without_policy_backing` | red line: the brand does not argue in public threads without policy backing |
| `no_retaliation` | red line: never retaliate against mentioners |
| `private_data_stays_private` | red line: private data about individuals stays private |
| `defamation_impersonation_to_counsel_not_combat` | red line: defamation/impersonation goes to counsel, not combat |

#### Computed checks in detail

- **Triage-dimension coverage (`all_stated_triage_dimensions_used`):** `triage.dimensions` passes only when it contains all three stated entries — `severity`, `reach`, `authenticity`. Unknown entries do not count. A missing list is missing evidence; an empty list fails. Omitted entries are reported as `triage_dimensions_missing` (null when no list is declared). Entries are validated as strings only, never enum-checked.
- **Triage-route coverage (`all_stated_triage_routes_defined`):** `triage.routes` passes only when it contains all five stated entries — `ignore`, `monitor`, `reply`, `escalate`, `legal`. A missing list is missing evidence; an empty list fails. Omitted entries are reported as `triage_routes_missing` (null when no list is declared).
- **Evidence for every action (`evidence_archived_for_every_action`):** when `counts.total_mentions`, `counts.actions_taken` and `counts.actions_with_evidence_archived` are all declared, the check passes only when the archived count equals the actions-taken count and the counts are coherent (none negative; actions taken no more than total mentions). If any of the three numbers is absent, the check is missing evidence. The output reports `actions_without_archived_evidence` (actions taken minus actions with evidence archived, null when either count cannot be read).

The output also reports `computed_status` over the three computed checks: `within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the three computed checks cannot be completed (SERVICE.md).

### Output format

HTTP 200 with one JSON verdict object (a 422 rejection is the only non-verdict response shape — see Errors). Top-level fields, in the order returned in the recorded responses:

| Field | Meaning |
|---|---|
| `service` | Always `"brand-mention-monitoring-triage-digest"`. |
| `atom_version` | Atom version that produced the verdict (`"0.1.0"` in the recorded runs). |
| `brand` | The manifest's identity field, carried through (null when the manifest did not declare it, as in the recorded violations run for some atoms). |
| `verdict` | One of the verdict values below. |
| `sections` | Object mapping each section name to its section status (`pass` / `fail` / `insufficient_evidence`). |
| `checks` | Array of `{section, check, status, evidence}` — one entry per check, in section order. |
| `computed_status` | `within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null — see the computed-checks note above. |
| `triage_dimensions_missing` | Computed output field (see *Checks → Computed checks in detail*); in the recorded full-pass run: `[]`. Null when it cannot be computed from the declared values, unless SERVICE.md states a different null rule for it. |
| `triage_routes_missing` | Computed output field (see *Checks → Computed checks in detail*); in the recorded full-pass run: `[]`. Null when it cannot be computed from the declared values, unless SERVICE.md states a different null rule for it. |
| `actions_without_archived_evidence` | Computed output field (see *Checks → Computed checks in detail*); in the recorded full-pass run: `0`. Null when it cannot be computed from the declared values, unless SERVICE.md states a different null rule for it. |
| `summary` | One-line count, e.g. "37 pass, 0 fail, 0 missing of 37 checks across six sections." |
| `stamp` | Plain-text rendering of the same verdict (display name, identity, verdict, per-section statuses, summary) for human-readable records. |

### Verdict vocabulary

| Value | Kind | Meaning |
|---|---|---|
| `TRIAGE_DIGEST_READY` | verdict | Every check passes (37/37); the manifest is complete and coherent on the declared evidence. |
| `TRIAGE_DIGEST_NOT_READY` | verdict | At least one check fails. Failing checks are named in the `checks` array with their evidence text. |
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
| 422 | `invalid_input` | Recorded body (verbatim from the malformed case): `{"ok": false, "error": "invalid_input", "field": "inventory", "detail": "inventory must be an object"}` — `ok: false`, `error`, `field` (the exact manifest field) and `detail` (the type it must be). Never a verdict. |
| 429 | rate limit | Rate limit exceeded: 60/min, 10,000/day per key (contract.yaml / USER-GUIDE.md). No body shape is recorded in the evidence; back off and retry after the window. |

### Rate limits and pricing status

- Rate limits (contract.yaml): **60 requests per minute per key** and **10,000 requests per day per key**. Contract note: the per-key rate limit is the capacity guard for open public usage; tuned per atom at build-out from measured production cost.
- Pricing (contract.yaml): pricing unit = deliverable; `pricing.rate` is **null** (`rate_status: pending`). **Free during trial — rate pending.** Prices are set only from measured production cost per unit (SERVICE.md).

## Explanation

### What this atom does, in depth

This atom audits one declared monitoring setup against a mention-monitoring method: the inventory must list names, handles and products (with misspellings and variants) and distinguish owned from third-party sources; coverage must name sources, blind spots, mechanisms and cadences; the triage rubric must use the stated dimensions and routes with an escalation path; the response policy must define who may speak and when; alerts must be hygienic; evidence must be archived before responding; the weekly digest must separate signal from noise with sentiment caveats stated; and the conduct red lines (no astroturfing, no retaliation, no exposing private data, no public defamation fights instead of counsel) must all be clear. It is a completeness and consistency audit of the caller's declarations and their arithmetic.

### How the verdict is decided

The core is deterministic: same manifest in → same verdict out, byte-identically (verified on the recorded repeat call). Each check reads declared field(s) and lands in exactly one of three states:

- **Absent field = missing evidence.** The check is `missing`; its section is `insufficient_evidence` unless another check in it fails; and if nothing anywhere fails, the verdict is `INSUFFICIENT_EVIDENCE`. Missing is not a failure and is never silently treated as `false`.
- **Present but false / invalid = fail.** The check is `fail`, its section is `fail`, and the verdict is the failing verdict — one failing check is enough, however complete the rest of the manifest is. Must-be-false (red-line) fields work the same way in mirror image: present and `true` = fail.
- **Computed checks** re-derive what can be re-derived from the declared values themselves — arithmetic, set coverage, and stated vocabulary only, importing no outside threshold (see *Checks → Computed checks in detail*). A computed check whose inputs are absent is `missing`, not failed; one whose inputs are present but disagree is `fail`.

Section statuses roll up mechanically (`fail` if any check fails, else `insufficient_evidence` if any is missing, else `pass`), and the verdict rolls up the same way across all 37 checks: `TRIAGE_DIGEST_READY` only when every check passes.

### What it does not do

- It does **not** listen to live social feeds, fetch or search for mentions, or verify that a declared value is true — it audits declarations, it does not monitor.
- No sentiment classification or scoring of real mentions — the method requires sentiment *with caveats* in the digest but states no classifier or scale, so none is imposed.
- No severity, reach, or alert threshold of any kind — thresholds must be declared to exist, but the method states no values, so no numeric threshold is invented here.
- No verification that archived evidence exists or that templates, alerts, or coverage mechanisms actually work. A setup can be ready on the declared evidence even if the brand's actual reputation is poor or the declared monitoring never actually runs — this is **not a reputation review**: it never decides whether a mention is genuinely severe, whether a sentiment reading is right, or whether a reply was wise.

The atom sells its deliverable — the bounded judgment artifact (the verdict object) — never the underlying knowledge or method itself.

### Buyer and use context

First buyer hypothesis (SERVICE.md, from register data; not yet market-tested): teams and agents working in Everyday life who need this check on demand. Named self-use: **Monitoring Nrupal and product mentions** — Wright is an internal caller (zero price, metered to the internal cost ledger).

## Role views

### For integrators (Users)

- Start with [USER-GUIDE.md](USER-GUIDE.md) for the quick start, then the Tutorial and How-to guides above. One call = one manifest in, one verdict object out; there is no session, upload, or follow-up state to manage.
- Integrate on the REST face (`POST /v1/brand-mention-monitoring-triage-digest`) or the MCP face (tool `brand_mention_monitoring_triage_digest`) — they return the same verdict object and were parity-verified. Branch on `verdict` first, then on per-check `status` for repair guidance; treat HTTP 422 as a client bug (fix the type named in `field`), 401/403 as key problems, and 429 as back-off.
- Cache by manifest content if you cache at all: the verdict is a pure function of the manifest, so an identical manifest never needs a second paid call.

### For developers

- Manifest authoring: type every field exactly as the Input reference states — booleans as JSON booleans (not `"true"`), numbers as JSON numbers, lists as arrays of strings. A wrong type is a 422 at the gateway, not a failing check; a wrong *value* is a failing check. Vocabulary and coverage fields are validated as strings only and judged as verdict checks, so a misspelled vocabulary entry fails its check rather than erroring.
- Determinism: the core is a deterministic Python oracle with a TypeScript port, parity-proven (TEST-REPORT.md); the recorded REST repeat was byte-identical and MCP structured content was deep-equal to REST. Any fixed serialization rule for computed outputs is stated in *Checks → Computed checks in detail* where SERVICE.md states one.
- Source and tests: implementation in `src/brand_mention_monitoring_triage_digest.py`, tests in `tests/test_brand_mention_monitoring_triage_digest.py` (same directory as this document). Fixes land in the bound skill first, then the atom re-deploys and must pass regression before its version bumps (contract.yaml binding rule R1).

### For ops

- Endpoints: REST `POST https://atoms.pipavia.com/v1/brand-mention-monitoring-triage-digest` and MCP `POST https://atoms.pipavia.com/mcp/brand-mention-monitoring-triage-digest` on gateway https://atoms.pipavia.com (v1.1.0 at recorded-run time). Status: live — release candidate, one-week RC soak to 2026-11-22; treat verdict-shape changes during the soak as RC incidents, not silent deploys.
- Keys and scope: per-user, per-atom issuance (`POST /v1/keys`); a key's scope for this atom is namespace `brand_mention_monitoring_triage_digest` and never verifies for another atom. Watch 403s for mis-issued keys and 401s for missing/invalid headers.
- Limits and monitoring: 60/min and 10,000/day per key; alert on 429 volume (client retry storms), on 422 rate (a client shipping wrongly-typed manifests), and on any drift between REST and MCP verdicts for identical manifests (parity is a verified property — drift is a defect). Pricing is not yet metered for revenue: rate pending, free during trial.

## Worked examples

Provenance: recorded 2026-11-16T01:19:17.861099+00:00 against gateway v1.1.0, external verification lane, source `verification/work/brand-mention-monitoring-triage-digest/evidence.json`. The three examples below are that evidence's recorded cases: each shows the case's `input` and the REST execution's `response_text`, reproduced verbatim as JSON values (pretty-printed with indent 2 for readability; verified mechanically after writing — see the checklist).

### Example 1 — full-pass

Recorded expectation: HTTP 200, outcome `TRIAGE_DIGEST_READY`. Recorded REST status: 200.

Input:

```json
{
  "brand": "Nrupal",
  "inventory": {
    "names_handles_products_listed": true,
    "misspellings_and_variants_included": true,
    "owned_vs_third_party_distinguished": true
  },
  "coverage": {
    "sources_listed": true,
    "blind_spots_acknowledged": true,
    "mechanism_configured_per_source": true,
    "cadence_defined": true,
    "crisis_cadence_realtime": true,
    "routine_cadence_daily_digest": true
  },
  "triage": {
    "rubric_documented": true,
    "dimensions": [
      "severity",
      "reach",
      "authenticity"
    ],
    "routes": [
      "ignore",
      "monitor",
      "reply",
      "escalate",
      "legal"
    ],
    "escalation_path_documented": true,
    "false_positives_tracked": true
  },
  "response": {
    "authority_to_speak_defined": true,
    "tone_rules_defined": true,
    "dm_move_criteria_defined": true,
    "statement_criteria_defined": true,
    "templates_approved": true
  },
  "alerts": {
    "thresholds_defined": true,
    "dedupe_enabled": true,
    "quiet_hours_defined": true,
    "tested_after_setup": true
  },
  "evidence": {
    "archiving_required_before_response": true
  },
  "counts": {
    "total_mentions": 10,
    "actions_taken": 5,
    "actions_with_evidence_archived": 5
  },
  "digest": {
    "weekly_cadence": true,
    "includes_notable_mentions": true,
    "includes_trend_notes": true,
    "sentiment_included": true,
    "sentiment_caveats_stated": true,
    "actions_taken_listed": true,
    "signal_separated_from_noise": true
  },
  "conduct": {
    "astroturfing_fake_reviews_or_manufactured_engagement": false,
    "public_argument_without_policy_backing": false,
    "retaliation_against_mentioners": false,
    "private_data_of_individuals_exposed": false,
    "defamation_or_impersonation_fought_publicly_instead_of_counsel": false
  }
}
```

Response (REST `response_text`):

```json
{
  "service": "brand-mention-monitoring-triage-digest",
  "atom_version": "0.1.0",
  "brand": "Nrupal",
  "verdict": "TRIAGE_DIGEST_READY",
  "sections": {
    "inventory_and_coverage": "pass",
    "triage_rubric": "pass",
    "response_policy": "pass",
    "alert_hygiene_and_evidence": "pass",
    "digest_reporting": "pass",
    "red_lines": "pass"
  },
  "checks": [
    {
      "section": "inventory_and_coverage",
      "check": "names_handles_products_listed",
      "status": "pass",
      "evidence": "method step 1: names, handles and products under watch are listed"
    },
    {
      "section": "inventory_and_coverage",
      "check": "misspellings_and_variants_included",
      "status": "pass",
      "evidence": "method step 1: misspellings and variants of the watched names are included in the inventory"
    },
    {
      "section": "inventory_and_coverage",
      "check": "owned_vs_third_party_distinguished",
      "status": "pass",
      "evidence": "method step 1: owned channels are distinguished from third-party sources"
    },
    {
      "section": "inventory_and_coverage",
      "check": "coverage_sources_listed",
      "status": "pass",
      "evidence": "method step 1: where discussion happens is listed \u2014 the coverage list is written"
    },
    {
      "section": "inventory_and_coverage",
      "check": "blind_spots_acknowledged",
      "status": "pass",
      "evidence": "quality gate: the coverage list acknowledges its blind spots (e.g. logged-in-only platforms, DMs)"
    },
    {
      "section": "inventory_and_coverage",
      "check": "coverage_mechanism_configured_per_source",
      "status": "pass",
      "evidence": "method step 2: a coverage mechanism (RSS, APIs, saved searches, alerts, webmentions) is configured per source"
    },
    {
      "section": "inventory_and_coverage",
      "check": "cadence_defined",
      "status": "pass",
      "evidence": "method step 2: a monitoring cadence is defined"
    },
    {
      "section": "inventory_and_coverage",
      "check": "crisis_cadence_realtime",
      "status": "pass",
      "evidence": "method step 2: the cadence is real-time for crises"
    },
    {
      "section": "inventory_and_coverage",
      "check": "routine_cadence_daily_digest",
      "status": "pass",
      "evidence": "method step 2: the cadence is a daily digest otherwise"
    },
    {
      "section": "triage_rubric",
      "check": "triage_rubric_documented",
      "status": "pass",
      "evidence": "quality gate: the triage rubric is documented"
    },
    {
      "section": "triage_rubric",
      "check": "all_stated_triage_dimensions_used",
      "status": "pass",
      "evidence": "method step 3: the rubric scores every dimension the skill names \u2014 severity, reach, authenticity (is it spam/astroturf?)"
    },
    {
      "section": "triage_rubric",
      "check": "all_stated_triage_routes_defined",
      "status": "pass",
      "evidence": "method step 3: the rubric defines every route the skill names \u2014 ignore, monitor, reply, escalate, legal"
    },
    {
      "section": "triage_rubric",
      "check": "escalation_path_documented",
      "status": "pass",
      "evidence": "quality gate: the escalation path is documented"
    },
    {
      "section": "triage_rubric",
      "check": "false_positives_tracked",
      "status": "pass",
      "evidence": "method step 3: false positives get tracked too"
    },
    {
      "section": "response_policy",
      "check": "authority_to_speak_defined",
      "status": "pass",
      "evidence": "quality gate: authority to speak is defined \u2014 who may speak as the brand"
    },
    {
      "section": "response_policy",
      "check": "tone_rules_defined",
      "status": "pass",
      "evidence": "method step 4: tone rules for responses are defined"
    },
    {
      "section": "response_policy",
      "check": "dm_move_criteria_defined",
      "status": "pass",
      "evidence": "method step 4: when to take a conversation to DM is defined"
    },
    {
      "section": "response_policy",
      "check": "statement_criteria_defined",
      "status": "pass",
      "evidence": "method step 4: when to publish a statement is defined"
    },
    {
      "section": "response_policy",
      "check": "response_templates_approved",
      "status": "pass",
      "evidence": "quality gate: response templates for common cases are drafted and approved"
    },
    {
      "section": "alert_hygiene_and_evidence",
      "check": "alert_thresholds_defined",
      "status": "pass",
      "evidence": "method step 5: alert thresholds are defined"
    },
    {
      "section": "alert_hygiene_and_evidence",
      "check": "alert_dedupe_enabled",
      "status": "pass",
      "evidence": "method step 5: alerts are deduplicated \u2014 no alert storms"
    },
    {
      "section": "alert_hygiene_and_evidence",
      "check": "alert_quiet_hours_defined",
      "status": "pass",
      "evidence": "method step 5: alert quiet hours are defined"
    },
    {
      "section": "alert_hygiene_and_evidence",
      "check": "alerts_tested_after_setup",
      "status": "pass",
      "evidence": "method step 5: alerts are tested after setup"
    },
    {
      "section": "alert_hygiene_and_evidence",
      "check": "evidence_archived_before_response",
      "status": "pass",
      "evidence": "method step 6: every actionable mention is archived (screenshot + link) before responding \u2014 posts get deleted"
    },
    {
      "section": "alert_hygiene_and_evidence",
      "check": "evidence_archived_for_every_action",
      "status": "pass",
      "evidence": "quality gate: evidence is archived for every action taken \u2014 the archived count equals the actions-taken count, with coherent counts"
    },
    {
      "section": "digest_reporting",
      "check": "digest_weekly_cadence",
      "status": "pass",
      "evidence": "method step 7: the report is a weekly digest"
    },
    {
      "section": "digest_reporting",
      "check": "digest_includes_notable_mentions",
      "status": "pass",
      "evidence": "method step 7: the digest includes notable mentions"
    },
    {
      "section": "digest_reporting",
      "check": "digest_includes_trend_notes",
      "status": "pass",
      "evidence": "method step 7: the digest includes trend notes"
    },
    {
      "section": "digest_reporting",
      "check": "digest_sentiment_included",
      "status": "pass",
      "evidence": "method step 7: the digest includes sentiment"
    },
    {
      "section": "digest_reporting",
      "check": "digest_sentiment_caveats_stated",
      "status": "pass",
      "evidence": "method step 7: sentiment is reported with caveats"
    },
    {
      "section": "digest_reporting",
      "check": "digest_actions_taken_listed",
      "status": "pass",
      "evidence": "method step 7: the digest lists actions taken"
    },
    {
      "section": "digest_reporting",
      "check": "signal_separated_from_noise",
      "status": "pass",
      "evidence": "method step 7: signal is separated from noise explicitly"
    },
    {
      "section": "red_lines",
      "check": "no_astroturfing_or_fake_engagement",
      "status": "pass",
      "evidence": "red line: no astroturfing, fake reviews, or manufactured engagement \u2014 ever"
    },
    {
      "section": "red_lines",
      "check": "no_public_argument_without_policy_backing",
      "status": "pass",
      "evidence": "red line: the brand does not argue in public threads without policy backing"
    },
    {
      "section": "red_lines",
      "check": "no_retaliation",
      "status": "pass",
      "evidence": "red line: never retaliate against mentioners"
    },
    {
      "section": "red_lines",
      "check": "private_data_stays_private",
      "status": "pass",
      "evidence": "red line: private data about individuals stays private"
    },
    {
      "section": "red_lines",
      "check": "defamation_impersonation_to_counsel_not_combat",
      "status": "pass",
      "evidence": "red line: defamation/impersonation goes to counsel, not combat"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "triage_dimensions_missing": [],
  "triage_routes_missing": [],
  "actions_without_archived_evidence": 0,
  "summary": "37 pass, 0 fail, 0 missing of 37 checks across six sections.",
  "stamp": "BRAND MENTION MONITORING TRIAGE DIGEST\nbrand: Nrupal\nVERDICT: TRIAGE_DIGEST_READY\n  inventory_and_coverage       pass\n  triage_rubric                pass\n  response_policy              pass\n  alert_hygiene_and_evidence   pass\n  digest_reporting             pass\n  red_lines                    pass\n37 pass, 0 fail, 0 missing of 37 checks across six sections."
}
```

### Example 2 — violations

Recorded expectation: HTTP 200, outcome `TRIAGE_DIGEST_NOT_READY`. Recorded REST status: 200.

Input:

```json
{
  "brand": "Nrupal",
  "triage": {
    "dimensions": [
      "severity",
      "reach"
    ],
    "routes": [
      "ignore"
    ]
  },
  "counts": {
    "total_mentions": 10,
    "actions_taken": 5,
    "actions_with_evidence_archived": 2
  },
  "conduct": {
    "astroturfing_fake_reviews_or_manufactured_engagement": true
  }
}
```

Response (REST `response_text`):

```json
{
  "service": "brand-mention-monitoring-triage-digest",
  "atom_version": "0.1.0",
  "brand": "Nrupal",
  "verdict": "TRIAGE_DIGEST_NOT_READY",
  "sections": {
    "inventory_and_coverage": "insufficient_evidence",
    "triage_rubric": "fail",
    "response_policy": "insufficient_evidence",
    "alert_hygiene_and_evidence": "fail",
    "digest_reporting": "insufficient_evidence",
    "red_lines": "fail"
  },
  "checks": [
    {
      "section": "inventory_and_coverage",
      "check": "names_handles_products_listed",
      "status": "missing",
      "evidence": "method step 1: names, handles and products under watch are listed"
    },
    {
      "section": "inventory_and_coverage",
      "check": "misspellings_and_variants_included",
      "status": "missing",
      "evidence": "method step 1: misspellings and variants of the watched names are included in the inventory"
    },
    {
      "section": "inventory_and_coverage",
      "check": "owned_vs_third_party_distinguished",
      "status": "missing",
      "evidence": "method step 1: owned channels are distinguished from third-party sources"
    },
    {
      "section": "inventory_and_coverage",
      "check": "coverage_sources_listed",
      "status": "missing",
      "evidence": "method step 1: where discussion happens is listed \u2014 the coverage list is written"
    },
    {
      "section": "inventory_and_coverage",
      "check": "blind_spots_acknowledged",
      "status": "missing",
      "evidence": "quality gate: the coverage list acknowledges its blind spots (e.g. logged-in-only platforms, DMs)"
    },
    {
      "section": "inventory_and_coverage",
      "check": "coverage_mechanism_configured_per_source",
      "status": "missing",
      "evidence": "method step 2: a coverage mechanism (RSS, APIs, saved searches, alerts, webmentions) is configured per source"
    },
    {
      "section": "inventory_and_coverage",
      "check": "cadence_defined",
      "status": "missing",
      "evidence": "method step 2: a monitoring cadence is defined"
    },
    {
      "section": "inventory_and_coverage",
      "check": "crisis_cadence_realtime",
      "status": "missing",
      "evidence": "method step 2: the cadence is real-time for crises"
    },
    {
      "section": "inventory_and_coverage",
      "check": "routine_cadence_daily_digest",
      "status": "missing",
      "evidence": "method step 2: the cadence is a daily digest otherwise"
    },
    {
      "section": "triage_rubric",
      "check": "triage_rubric_documented",
      "status": "missing",
      "evidence": "quality gate: the triage rubric is documented"
    },
    {
      "section": "triage_rubric",
      "check": "all_stated_triage_dimensions_used",
      "status": "fail",
      "evidence": "method step 3: the rubric scores every dimension the skill names \u2014 severity, reach, authenticity (is it spam/astroturf?)"
    },
    {
      "section": "triage_rubric",
      "check": "all_stated_triage_routes_defined",
      "status": "fail",
      "evidence": "method step 3: the rubric defines every route the skill names \u2014 ignore, monitor, reply, escalate, legal"
    },
    {
      "section": "triage_rubric",
      "check": "escalation_path_documented",
      "status": "missing",
      "evidence": "quality gate: the escalation path is documented"
    },
    {
      "section": "triage_rubric",
      "check": "false_positives_tracked",
      "status": "missing",
      "evidence": "method step 3: false positives get tracked too"
    },
    {
      "section": "response_policy",
      "check": "authority_to_speak_defined",
      "status": "missing",
      "evidence": "quality gate: authority to speak is defined \u2014 who may speak as the brand"
    },
    {
      "section": "response_policy",
      "check": "tone_rules_defined",
      "status": "missing",
      "evidence": "method step 4: tone rules for responses are defined"
    },
    {
      "section": "response_policy",
      "check": "dm_move_criteria_defined",
      "status": "missing",
      "evidence": "method step 4: when to take a conversation to DM is defined"
    },
    {
      "section": "response_policy",
      "check": "statement_criteria_defined",
      "status": "missing",
      "evidence": "method step 4: when to publish a statement is defined"
    },
    {
      "section": "response_policy",
      "check": "response_templates_approved",
      "status": "missing",
      "evidence": "quality gate: response templates for common cases are drafted and approved"
    },
    {
      "section": "alert_hygiene_and_evidence",
      "check": "alert_thresholds_defined",
      "status": "missing",
      "evidence": "method step 5: alert thresholds are defined"
    },
    {
      "section": "alert_hygiene_and_evidence",
      "check": "alert_dedupe_enabled",
      "status": "missing",
      "evidence": "method step 5: alerts are deduplicated \u2014 no alert storms"
    },
    {
      "section": "alert_hygiene_and_evidence",
      "check": "alert_quiet_hours_defined",
      "status": "missing",
      "evidence": "method step 5: alert quiet hours are defined"
    },
    {
      "section": "alert_hygiene_and_evidence",
      "check": "alerts_tested_after_setup",
      "status": "missing",
      "evidence": "method step 5: alerts are tested after setup"
    },
    {
      "section": "alert_hygiene_and_evidence",
      "check": "evidence_archived_before_response",
      "status": "missing",
      "evidence": "method step 6: every actionable mention is archived (screenshot + link) before responding \u2014 posts get deleted"
    },
    {
      "section": "alert_hygiene_and_evidence",
      "check": "evidence_archived_for_every_action",
      "status": "fail",
      "evidence": "quality gate: evidence is archived for every action taken \u2014 the archived count equals the actions-taken count, with coherent counts"
    },
    {
      "section": "digest_reporting",
      "check": "digest_weekly_cadence",
      "status": "missing",
      "evidence": "method step 7: the report is a weekly digest"
    },
    {
      "section": "digest_reporting",
      "check": "digest_includes_notable_mentions",
      "status": "missing",
      "evidence": "method step 7: the digest includes notable mentions"
    },
    {
      "section": "digest_reporting",
      "check": "digest_includes_trend_notes",
      "status": "missing",
      "evidence": "method step 7: the digest includes trend notes"
    },
    {
      "section": "digest_reporting",
      "check": "digest_sentiment_included",
      "status": "missing",
      "evidence": "method step 7: the digest includes sentiment"
    },
    {
      "section": "digest_reporting",
      "check": "digest_sentiment_caveats_stated",
      "status": "missing",
      "evidence": "method step 7: sentiment is reported with caveats"
    },
    {
      "section": "digest_reporting",
      "check": "digest_actions_taken_listed",
      "status": "missing",
      "evidence": "method step 7: the digest lists actions taken"
    },
    {
      "section": "digest_reporting",
      "check": "signal_separated_from_noise",
      "status": "missing",
      "evidence": "method step 7: signal is separated from noise explicitly"
    },
    {
      "section": "red_lines",
      "check": "no_astroturfing_or_fake_engagement",
      "status": "fail",
      "evidence": "red line: no astroturfing, fake reviews, or manufactured engagement \u2014 ever"
    },
    {
      "section": "red_lines",
      "check": "no_public_argument_without_policy_backing",
      "status": "missing",
      "evidence": "red line: the brand does not argue in public threads without policy backing"
    },
    {
      "section": "red_lines",
      "check": "no_retaliation",
      "status": "missing",
      "evidence": "red line: never retaliate against mentioners"
    },
    {
      "section": "red_lines",
      "check": "private_data_stays_private",
      "status": "missing",
      "evidence": "red line: private data about individuals stays private"
    },
    {
      "section": "red_lines",
      "check": "defamation_impersonation_to_counsel_not_combat",
      "status": "missing",
      "evidence": "red line: defamation/impersonation goes to counsel, not combat"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "triage_dimensions_missing": [
    "authenticity"
  ],
  "triage_routes_missing": [
    "monitor",
    "reply",
    "escalate",
    "legal"
  ],
  "actions_without_archived_evidence": 3,
  "summary": "0 pass, 4 fail, 33 missing of 37 checks across six sections.",
  "stamp": "BRAND MENTION MONITORING TRIAGE DIGEST\nbrand: Nrupal\nVERDICT: TRIAGE_DIGEST_NOT_READY\n  inventory_and_coverage       insufficient_evidence\n  triage_rubric                fail\n  response_policy              insufficient_evidence\n  alert_hygiene_and_evidence   fail\n  digest_reporting             insufficient_evidence\n  red_lines                    fail\n0 pass, 4 fail, 33 missing of 37 checks across six sections."
}
```

### Example 3 — malformed

Recorded expectation: HTTP 422, no verdict (rejected as invalid input). Recorded REST status: 422.

Input:

```json
{
  "brand": "Nrupal",
  "inventory": "not-an-object",
  "counts": {
    "total_mentions": "ten"
  }
}
```

Response (REST `response_text`):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "inventory",
  "detail": "inventory must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes; Developers Yes; Ops Yes; Regulators: N/A — the verdict audits a declared monitoring setup's completeness; it is not compliance or audit evidence and brand-mention triage is not a regulated activity, even though conduct red lines touch on defamation and private data as declared fields. |
| Checks named: documented / recorded | 37 / 37 (from the recorded full-pass REST `checks` array, cross-checked against SERVICE.md) |
| Verdict vocabulary complete | Yes — all 3 verdicts (`TRIAGE_DIGEST_READY`, `TRIAGE_DIGEST_NOT_READY`, `INSUFFICIENT_EVIDENCE`), `computed_status` values including null, section statuses and per-check statuses |
| Input reference typed | Yes — 40 fields, each with a type from SERVICE.md's field table, grouped as SERVICE.md groups them, gates/conditionals preserved in Notes |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed from this file and compared as JSON values against `verification/work/brand-mention-monitoring-triage-digest/evidence.json` after writing; all matched |
| Errors documented from evidence only | Yes — 422 shape verbatim from the recorded malformed case; 401/403/429 documented at the status/meaning level evidenced in USER-GUIDE.md and contract.yaml, with no invented payload |

