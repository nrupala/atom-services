# Behavioral finance bias check — `behavioral-finance-bias-check`

**Behavioral finance bias check** · slug `behavioral-finance-bias-check` · deliverable type CHECK · atom version 0.1.0 · status live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md)

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run (Worked example 1 below reproduces it verbatim); every value named here is from that recording.

1. **Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a key for this atom: `POST /v1/keys` with `{"atom": "behavioral-finance-bias-check"}`. Send the key as `Authorization: Bearer <key>` on every call.
2. **Assemble the manifest.** The manifest is one JSON object: a declared record for one decision. In the recorded run the decision is `Buy AAPL` — a declared bias-check pack for one investment decision (an entry, not a major move) — the bias playbook and its counters, a position size of 5.0% against the caller's own declared 10.0% sizing cap, pre-commitment and a written thesis, exactly 48 elapsed cooling-off hours, a current decision journal, watch-and-challenge discipline, and the temptation red lines all clear. Build yours field by field from the Input reference below; leave a field out only if you want it reported as missing evidence.
3. **Call the atom.** `POST https://atoms.pipavia.com/v1/behavioral-finance-bias-check` with the manifest as the body and the `Authorization` header set (see How-to guides for the MCP form of the same call).
4. **Read the verdict.** The recorded run returned HTTP 200 with verdict `BIAS_CHECK_CLEAR`: 30 pass, 0 fail, 0 missing of 30 checks across six sections. Every section status is `pass` and every check status is `pass`.
5. **Use the detail.** The `checks` array names each of the 30 checks with its section and the evidence it read; `summary` counts pass / fail / missing; `stamp` is the same verdict as a plain-text stamp you can paste into a record. If any check had failed or been missing, the verdict, the section statuses and the check statuses would name exactly which — that is the subject of the third how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "behavioral-finance-bias-check"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.
4. Call: `POST https://atoms.pipavia.com/v1/behavioral-finance-bias-check` — body = the manifest object (see Input reference). The response is the verdict object (see Output format).

### Call via MCP

Connect your MCP client to `POST https://atoms.pipavia.com/mcp/behavioral-finance-bias-check` with the same `Authorization: Bearer <key>` header, and call the tool `behavioral_finance_bias_check`. The `tools/call` arguments are the manifest object itself — the same JSON you would send as the REST body. The MCP result's structured content is the same verdict object the REST face returns (external verification confirmed MCP/REST parity on the full-pass case; see TEST-REPORT.md).

### Read a failing verdict and fix the manifest

A verdict other than `BIAS_CHECK_CLEAR` is not an error — it is the deliverable doing its job. Read it in this order:

1. **Verdict.** `BIAS_CHECK_FAILED` — At least one check fails; the failing checks name the breached section and the evidence against it. `INSUFFICIENT_EVIDENCE` means nothing failed but evidence is missing.
2. **Sections.** The `sections` object gives one status per section: `pass`, `fail`, or `insufficient_evidence`. Start with the sections that are not `pass`.
3. **Checks.** In the `checks` array, find entries with status `fail` (a field was present but did not meet the requirement — for a must-be-`false` field, it was declared `true`; for a computed check, the declared values did not satisfy the computed rule) and entries with status `missing` (the supporting field was absent from the manifest). Each check's `evidence` string states what the check requires.
4. **Fix the manifest, not the verdict.** For a `fail`, correct the declared value in the underlying record, then redeclare it truthfully. For a `missing`, supply the absent field. Then resubmit the whole manifest — the atom is stateless and deterministic, so the same manifest always returns the same verdict.
Worked example 2 below is a real failing run of this atom: verdict `BIAS_CHECK_FAILED`, 26 pass, 4 fail, 0 missing of 30 checks across six sections. The failing checks are: `position_size_within_sizing_cap`, `all_considered_biases_have_counter_applied`, `no_continuous_price_watching`, `decision_not_driven_by_headlines`.

### Handle a 422 invalid_input

A type error is rejected before any check runs — you get HTTP 422, never a verdict. The recorded malformed run for this atom (Worked example 3) returned:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "decision_context",
  "detail": "decision_context must be an object"
}
```

`field` names the offending field (`decision_context`) and `detail` states the expected type ("decision_context must be an object"). Fix that field's type in the manifest — consult the Input reference for each field's type — and resubmit. Do not drop the field to silence the 422 unless you intend it to be reported as missing evidence instead.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/behavioral-finance-bias-check` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/behavioral-finance-bias-check` — tool name `behavioral_finance_bias_check`; `tools/call` arguments = the manifest object.
- **Keys:** sign up via `POST /v1/signup`, then `POST /v1/keys` with `{"atom": "behavioral-finance-bias-check"}`. Key scope: this atom only — a key's scope for one atom never verifies for another (per `contract.yaml`, keys are per user, per atom; the key itself is regenerated on demand after authentication and never stored).

### Input reference

The manifest is one JSON object with 34 fields. All fields are booleans unless a different type is stated in the Type column. A field **absent** = evidence missing (counts toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails. Fields are grouped below exactly as SERVICE.md groups them (by the section that reads them).

#### Top level

| Field | Type | Notes |
|---|---|---|
| `decision` | string | string; carried into the verdict output, not itself checked |

#### `precommitment_and_thesis, cooling_off`

| Field | Type | Notes |
|---|---|---|
| `decision_context.is_entry` | boolean | gates the thesis and cooling-off checks below |

#### `watch_and_challenge`

| Field | Type | Notes |
|---|---|---|
| `decision_context.is_major_move` | boolean | gates the advisor-set check below |
| `watch_and_challenge.continuous_price_watching` | boolean | must be `false` to pass |
| `watch_and_challenge.scheduled_reviews_used` | boolean | — |
| `watch_and_challenge.notifications_off` | boolean | — |
| `watch_and_challenge.devils_advocate_round_assigned` | boolean | — |
| `watch_and_challenge.slept_on_material_changes` | boolean | — |
| `watch_and_challenge.major_move_discussed_with_advisor_set_documented` | boolean | required when the decision is a major move; otherwise the check passes as not applicable |

#### `bias_playbook`

| Field | Type | Notes |
|---|---|---|
| `bias_playbook.loss_aversion_precommitted_exits_set` | boolean | — |
| `bias_playbook.loss_aversion_reunderwritten_instead_of_waiting_to_get_even` | boolean | — |
| `bias_playbook.anchoring_own_valuation_written_before_market_price_targets` | boolean | — |
| `bias_playbook.recency_base_rates_and_long_windows_used` | boolean | — |
| `bias_playbook.overconfidence_sizing_cap_percent` | number | number; computed, see below |
| `bias_playbook.overconfidence_position_size_percent` | number | number; computed, see below |
| `bias_playbook.confirmation_disconfirming_evidence_present` | boolean | — |
| `bias_playbook.sunk_cost_would_buy_today_test_applied` | boolean | — |
| `bias_playbook.biases_considered` | array of objects `{bias, counter_applied}` | list of `{bias, counter_applied}`; computed, see below |

#### `precommitment_and_thesis`

| Field | Type | Notes |
|---|---|---|
| `precommitment.written_rules_present` | boolean | — |
| `precommitment.stop_levels_set` | boolean | — |
| `precommitment.thesis_written` | boolean | required when the decision is an entry; otherwise the check passes as not applicable |

#### `cooling_off`

| Field | Type | Notes |
|---|---|---|
| `cooling_off.hours_elapsed` | number | number; computed, see below |
| `cooling_off.periods_honored_for_impulsive_ideas` | boolean | — |

#### `decision_journal`

| Field | Type | Notes |
|---|---|---|
| `journal.decision_recorded` | boolean | — |
| `journal.expected_outcome_recorded` | boolean | — |
| `journal.actual_outcome_and_lessons_recorded` | boolean | — |
| `journal.current_with_outcomes_and_lessons` | boolean | — |
| `journal.reviewed_monthly` | boolean | — |
| `journal.hit_rate_tracked_honestly` | boolean | — |

#### `temptation_and_red_lines`

| Field | Type | Notes |
|---|---|---|
| `temptation_and_red_lines.one_click_trading_paths_removed` | boolean | — |
| `temptation_and_red_lines.decision_driven_by_headlines` | boolean | must be `false` to pass — skill red line |
| `temptation_and_red_lines.decision_driven_by_streaks` | boolean | must be `false` to pass — skill red line |
| `temptation_and_red_lines.decision_driven_by_moods` | boolean | must be `false` to pass — skill red line |
| `temptation_and_red_lines.journal_skipped_for_this_decision` | boolean | must be `false` to pass — skill red line |

### Checks

The recorded full-pass response carries 30 checks across 6 sections (`bias_playbook`, `precommitment_and_thesis`, `cooling_off`, `decision_journal`, `watch_and_challenge`, `temptation_and_red_lines`). Every check is listed below with the requirement stated in its recorded `evidence` string. General semantics: a check's status is `pass` when its requirement is met on the declared values, `fail` when the supporting field is present but the requirement is not met, and `missing` when the supporting field is absent. A section's status is `pass` when all its checks pass, `fail` when any check fails, and `insufficient_evidence` when no check fails but at least one is missing.

Conditional (not-applicable) checks: `cooling_off_hours_at_least_48` and `written_thesis_before_entry` (gated by `decision_context.is_entry`), and `major_move_discussed_with_advisor_set_documented` (gated by `decision_context.is_major_move`). When a gate is off the recorded status is `pass` (not applicable); when a gate is on, an absent required field is `missing` and a present-but-failing declaration is `fail`; a missing gating field itself makes the gated check `missing`.

| Section | Check | What passing requires (recorded evidence) | Pass / fail / missing semantics |
|---|---|---|---|
| `bias_playbook` | `loss_aversion_precommitted_exits_set` | loss aversion counter: pre-committed exits are set | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `bias_playbook` | `loss_aversion_reunderwritten_instead_of_waiting_to_get_even` | loss aversion counter: the position is re-underwritten instead of held while waiting to get even | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `bias_playbook` | `anchoring_own_valuation_written_before_market_price_targets` | anchoring counter: your own valuation is written BEFORE reading the market's price targets | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `bias_playbook` | `recency_base_rates_and_long_windows_used` | recency counter: base rates and long windows are used — one year is not a trend | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `bias_playbook` | `position_size_within_sizing_cap` | overconfidence counter: sizing caps — the declared position size percent is at or below the declared sizing cap percent | Computed: declared position size at or below the caller-declared cap → `pass`; above → `fail`; either number absent → `missing` |
| `bias_playbook` | `confirmation_disconfirming_evidence_present` | confirmation counter: a mandatory disconfirming-evidence section is present in the thesis (also a quality gate: disconfirming evidence present in every thesis) | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `bias_playbook` | `sunk_cost_would_buy_today_test_applied` | sunk cost counter: the 'would I buy this today at this price?' test is applied | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `bias_playbook` | `all_considered_biases_have_counter_applied` | bias playbook with counters: every bias the caller declares considered carries its applied counter | Computed: non-empty list with every entry `counter_applied: true` → `pass`; empty list or any counter missing → `fail`; list absent → `missing` |
| `precommitment_and_thesis` | `written_precommitment_rules_present` | pre-commitment: written rules exist — decisions get made when calm and enforced when not | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `precommitment_and_thesis` | `stop_levels_set` | pre-commitment: stop levels are set — written rules, journal, and stop levels beat willpower | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `precommitment_and_thesis` | `written_thesis_before_entry` | FOMO/chasing counter: no entry without a written thesis | Conditional: required when the decision is an entry (`true` → `pass`, `false` → `fail`, absent → `missing`); non-entry → `pass` (not applicable) |
| `cooling_off` | `cooling_off_hours_at_least_48` | FOMO/chasing counter: 48h cooling-off — the declared cooling-off hours elapsed for this entry decision are at least 48 | Computed/conditional: entry decision with hours elapsed ≥ 48 → `pass`; below 48 → `fail`; hours or gate absent → `missing`; non-entry → `pass` (not applicable) |
| `cooling_off` | `cooling_off_periods_honored_for_impulsive_ideas` | quality gate: cooling-off periods honored for impulsive ideas | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `decision_journal` | `journal_decision_recorded` | journals: every decision is recorded in the journal | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `decision_journal` | `journal_expected_outcome_recorded` | journals: the expected outcome is recorded with the decision | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `decision_journal` | `journal_actual_outcome_and_lessons_recorded` | journals: later actuals are recorded against the decision | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `decision_journal` | `journal_current_with_outcomes_and_lessons` | quality gate: journal current with outcomes + lessons | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `decision_journal` | `journal_reviewed_monthly` | journals: the journal is reviewed monthly — patterns surface on review | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `decision_journal` | `hit_rate_tracked_honestly_in_journal` | overconfidence counter: track your hit rate honestly (journal) | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `watch_and_challenge` | `no_continuous_price_watching` | watch conditions: no continuous price-watching (also the quality gate: review cadence held, not continuous watching) | `false` → `pass`; `true` → `fail`; absent → `missing` |
| `watch_and_challenge` | `scheduled_reviews_used` | watch conditions: scheduled reviews are used instead of continuous watching | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `watch_and_challenge` | `notifications_off` | watch conditions: notifications off — headlines are not data | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `watch_and_challenge` | `devils_advocate_round_assigned` | committee tricks: a devil's advocate round is assigned for big decisions | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `watch_and_challenge` | `slept_on_material_changes` | committee tricks: material changes are slept on | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `watch_and_challenge` | `major_move_discussed_with_advisor_set_documented` | not a major move | Conditional: required when the decision is a major move (`true` → `pass`, `false` → `fail`, absent → `missing`); not a major move → `pass` (not applicable) |
| `temptation_and_red_lines` | `one_click_trading_paths_removed` | temptation architecture: one-click trading paths are removed for the accounts that matter | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `temptation_and_red_lines` | `decision_not_driven_by_headlines` | red line: no decisions driven by headlines | `false` → `pass`; `true` → `fail`; absent → `missing` |
| `temptation_and_red_lines` | `decision_not_driven_by_streaks` | red line: no decisions driven by streaks | `false` → `pass`; `true` → `fail`; absent → `missing` |
| `temptation_and_red_lines` | `decision_not_driven_by_moods` | red line: no decisions driven by moods | `false` → `pass`; `true` → `fail`; absent → `missing` |
| `temptation_and_red_lines` | `journal_not_skipped_for_this_decision` | red line: no skipped journals — the process IS the edge | `false` → `pass`; `true` → `fail`; absent → `missing` |

### Output format

A successful call (HTTP 200) returns one JSON object:

| Field | Meaning |
|---|---|
| `service` | Always `"behavioral-finance-bias-check"` |
| `atom_version` | Atom version that produced the verdict (`"0.1.0"`) |
| `decision` | The declared decision, carried through from the manifest (not itself checked) |
| `verdict` | One of the verdict values below |
| `sections` | Object mapping each section name to its section status (`pass` / `fail` / `insufficient_evidence`) |
| `checks` | Array of 30 objects, each `{section, check, status, evidence}` — `status` is `pass` / `fail` / `missing`; `evidence` states what the check requires |
| `computed_status` | `within_limits_on_declared_evidence` / `outside_limits_on_declared_evidence` / null when either primary computed check (sizing cap, cooling-off) cannot be completed |
| `biases_considered_count` | The declared `biases_considered` list length, or null |
| `position_size_over_cap_percent` | Declared position size minus declared cap, string with exactly four decimals; null when either number is undeclared |
| `cooling_off_hours_below_48` | For an entry decision, 48 minus declared hours elapsed, string with exactly four decimals; null otherwise |
| `summary` | Plain-language count, e.g. the recorded full-pass summary: "30 pass, 0 fail, 0 missing of 30 checks across six sections." |
| `stamp` | The same verdict rendered as a plain-text stamp for pasting into a record |

### Verdict vocabulary

**Verdicts** (the `verdict` field — every value this atom can return):

- `BIAS_CHECK_CLEAR` — Every check passes; the decision is clear on the declared evidence.
- `BIAS_CHECK_FAILED` — At least one check fails; the failing checks name the breached section and the evidence against it.
- `INSUFFICIENT_EVIDENCE` — Nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

**Section statuses** (values in the `sections` object): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (the `status` field of each `checks` entry): `pass` — the requirement is met on the declared values (for a conditional check whose gate is off, `pass` is recorded with not-applicable semantics — see Checks); `fail` — the supporting field is present but the requirement is not met; `missing` — the supporting field is absent, so there is no evidence to judge.

**Computed status** (the `computed_status` field, where present): see Output format — it summarises the computed checks as within / outside the stated limits on the declared evidence, or null when a primary computed check cannot be completed.

### Errors

Only the error shapes evidenced in the gateway documentation (USER-GUIDE.md) and the recorded trial runs are documented here; no other payload shapes are claimed.

- **401 — unauthenticated:** missing or invalid key. (Status and meaning per USER-GUIDE.md; no recorded body in the evidence for this atom.)
- **403 — scope:** the key lacks this atom's scope. (Status and meaning per USER-GUIDE.md; no recorded body in the evidence for this atom.)
- **422 — `invalid_input`:** a manifest field has the wrong type. Recorded body shape: `{"ok": false, "error": "invalid_input", "field": "<field>", "detail": "<detail>"}` — this atom's recorded instance is `decision_context` / "decision_context must be an object" (Worked example 3, verbatim). No verdict is returned.
- **429 — rate limit:** the per-key rate limit (below) is exceeded. (Status and meaning per USER-GUIDE.md; no recorded body in the evidence for this atom.)

### Rate limits and pricing

- **Rate limits (from `contract.yaml`):** 60 requests per key per minute; 10,000 requests per key per day. The contract notes this is the SPEC default capacity guard for open public usage, tuned per atom at build-out from measured production cost.
- **Pricing:** Free during trial — rate pending. `contract.yaml` sets pricing unit `deliverable` with `rate: null` (`rate_status: pending`); SERVICE.md states no price is set and prices are set only from measured production cost per unit.

## Explanation

What this atom does, in depth: you submit a declared record — the manifest — and the atom audits that record, deterministically, against the method, quality gates and red lines of its bound skill. It runs 30 checks grouped into 6 sections (bias_playbook, precommitment_and_thesis, cooling_off, decision_journal, watch_and_challenge, temptation_and_red_lines), computes the computed checks described below from the declared values alone, and returns a single verdict with per-section and per-check evidence. Same manifest in → same verdict out: external verification confirmed byte-identical repeat REST responses and MCP/REST parity (see TEST-REPORT.md). One unit of sale is one delivered verdict — the atom sells the check it produces, never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic; there is no model judgment in the loop. Each check reads declared field(s): an **absent** field is missing evidence (check status `missing`), while a field **present but false / invalid** is a failure (check status `fail`) — that distinction is the atom's central semantics, and it drives the verdict: any `fail` produces the failing verdict; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only when every check passes does the atom return its pass verdict. Section statuses aggregate the same way (`pass` / `fail` / `insufficient_evidence`).

**Computed checks.** Three checks are computed from declared values, using only what the bound skill itself states or the caller declares as the limit. **Cooling-off (48h):** for a declared entry decision (`decision_context.is_entry: true`), `cooling_off.hours_elapsed` passes only at or above 48 (equality passes); for a non-entry decision the check passes as not applicable; a missing gating field makes it missing evidence; an absent hours value on an entry decision is missing evidence, not a failure. **Sizing cap:** the skill names no number, so the cap is the caller's declared `overconfidence_sizing_cap_percent` — the declared `overconfidence_position_size_percent` passes at or below it and fails above it; if either number is absent, the check is missing evidence. **Counters per considered bias:** a present, non-empty `biases_considered` list passes only when every entry declares `counter_applied: true`; an empty list is present and fails; a missing list is missing evidence; the `bias` string is a caller-declared label, type-validated as a string only and never checked against a bias vocabulary. The output also reports `computed_status` (null when either primary computed check — sizing cap, cooling-off — cannot be completed), `biases_considered_count` (the declared list length, or null), `position_size_over_cap_percent` (declared position size minus declared cap; null when either number is undeclared) and, for an entry decision, `cooling_off_hours_below_48` (48 minus declared hours elapsed; null otherwise). Both derived numbers are reported as strings with exactly four decimal places (round half up to 4dp, `floor(v * 10000 + 0.5) / 10000`, then format with exactly four decimals; comparisons use the unrounded values) — that fixed serialization is what makes the Python and TypeScript outputs byte-identical. The written-thesis check is conditional on `decision_context.is_entry` and the advisor-set check on `decision_context.is_major_move`; each passes as not applicable when its gate is off.

**What it does NOT do.** This atom audits a **declared** bias-check pack — it does not
run the investor through a live bias interview, read their
journal or brokerage account, give investment advice, or verify
that a declared value is true. A decision is clear *on the
caller's declared evidence*: a manifest that declares
pre-committed exits, a written thesis, and 72 elapsed cooling-off
hours passes those checks even if none of it happened. It is a
completeness check of the record the skill requires, **not a
behavioural diagnosis**: it never judges whether the decision
itself is wise, whether a bias is actually present in the
investor, or whether the stated counters were applied well —
only that the record contains what the skill's playbook, method,
quality gates, and red lines demand.

Named exclusions: no check of any prose (thesis quality,
valuation quality, journal honesty are judgment, and the skill
states no vocabulary for grading them, so none is invented); no
bias vocabulary is imposed on `biases_considered[].bias` (the
skill names seven playbook biases as examples with counters —
each of those counters is checked as its own declared field —
but states no closed list for a caller's own considered set);
no cooling-off duration other than the skill's stated 48h is
checked, and it is checked only for entry decisions, the scope
the skill's FOMO counter and quality gate state; no sizing
number is imposed — the cap is caller-declared, because the
skill requires caps but states no figure; no live verification
of any declared fact.

**Buyer and use context.** First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Money & markets who need this check on demand and would rather buy it per use than build or staff the capability themselves. Self-use (passed): see SERVICE.md — the house itself calls this atom in its own workflow, as an internal caller at zero price metered to the internal cost ledger. The recorded trial runs below are the external-verification battery for the release candidate now in its one-week RC soak.

## Role views

### For integrators

You need the verdict inside another system or agent loop. Use the REST endpoint `POST https://atoms.pipavia.com/v1/behavioral-finance-bias-check` (or the MCP tool `behavioral_finance_bias_check`) with a per-atom scoped key, treat HTTP 200 verdicts — including failing verdicts — as successful deliveries, and branch on `verdict`, `sections` and the per-check `status` values rather than on HTTP status. Reserve error handling for 401 / 403 / 422 / 429 (see Errors). The call is stateless and deterministic: cache or replay a manifest freely; an identical manifest returns an identical verdict. Respect the per-key limits (60/min, 10,000/day) and note pricing is free during trial with the rate pending.

### For developers

Manifest authoring: declare every field in the Input reference truthfully — omitting a field is a positive statement that the evidence does not exist (`missing`), not a neutral default, and declaring `false` where the record is actually silent converts a fixable `INSUFFICIENT_EVIDENCE` into a failing verdict. Mind the must-be-`false` fields, the computed checks (their rules are stated in full under Explanation), and the conditional gates where this atom has them. Determinism: the verdict core is a deterministic function of the manifest alone. Implementation pointers: core in `src/behavioral_finance_bias_check.py`, tests in `tests/test_behavioral_finance_bias_check.py` (see TEST-REPORT.md for the external battery: full-pass, violations, sparse, malformed, determinism, and MCP/REST parity).

### For ops

Endpoints: REST `POST https://atoms.pipavia.com/v1/behavioral-finance-bias-check` and MCP `POST https://atoms.pipavia.com/mcp/behavioral-finance-bias-check` on gateway v1.1.0 at https://atoms.pipavia.com. Keys are per user, per atom; a 403 spike means callers are presenting keys without this atom's scope, a 401 spike means missing/invalid keys, 422s mean malformed manifests naming the field in the body, and 429s mean the per-key limit (60/min, 10,000/day) is being hit — monitor those four codes separately from verdict mix, since failing verdicts are HTTP 200 by design. Status: live — release candidate (one-week RC soak to 2026-11-22); atom version 0.1.0. Pricing is free during trial (rate pending), so trial traffic is metered, not billed, per `contract.yaml`.

## Worked examples

Provenance: recorded 2026-11-16T00:43:49.204353+00:00 against gateway v1.1.0, external verification lane, source `verification/work/behavioral-finance-bias-check/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases. Each example shows the case's recorded `input` and the REST execution's recorded `response_text`, pretty-printed with two-space indent; the JSON values are verbatim.

### Example 1 — full-pass

Request — `POST /v1/behavioral-finance-bias-check`:

```json
{
  "decision": "Buy AAPL",
  "decision_context": {
    "is_entry": true,
    "is_major_move": false
  },
  "bias_playbook": {
    "loss_aversion_precommitted_exits_set": true,
    "loss_aversion_reunderwritten_instead_of_waiting_to_get_even": true,
    "anchoring_own_valuation_written_before_market_price_targets": true,
    "recency_base_rates_and_long_windows_used": true,
    "overconfidence_sizing_cap_percent": 10.0,
    "overconfidence_position_size_percent": 5.0,
    "confirmation_disconfirming_evidence_present": true,
    "sunk_cost_would_buy_today_test_applied": true,
    "biases_considered": [
      {
        "bias": "Anchoring",
        "counter_applied": true
      }
    ]
  },
  "precommitment": {
    "written_rules_present": true,
    "stop_levels_set": true,
    "thesis_written": true
  },
  "cooling_off": {
    "hours_elapsed": 48.0,
    "periods_honored_for_impulsive_ideas": true
  },
  "journal": {
    "decision_recorded": true,
    "expected_outcome_recorded": true,
    "actual_outcome_and_lessons_recorded": true,
    "current_with_outcomes_and_lessons": true,
    "reviewed_monthly": true,
    "hit_rate_tracked_honestly": true
  },
  "watch_and_challenge": {
    "continuous_price_watching": false,
    "scheduled_reviews_used": true,
    "notifications_off": true,
    "devils_advocate_round_assigned": true,
    "slept_on_material_changes": true
  },
  "temptation_and_red_lines": {
    "one_click_trading_paths_removed": true,
    "decision_driven_by_headlines": false,
    "decision_driven_by_streaks": false,
    "decision_driven_by_moods": false,
    "journal_skipped_for_this_decision": false
  }
}
```

Response — HTTP 200:

```json
{
  "service": "behavioral-finance-bias-check",
  "atom_version": "0.1.0",
  "decision": "Buy AAPL",
  "verdict": "BIAS_CHECK_CLEAR",
  "sections": {
    "bias_playbook": "pass",
    "precommitment_and_thesis": "pass",
    "cooling_off": "pass",
    "decision_journal": "pass",
    "watch_and_challenge": "pass",
    "temptation_and_red_lines": "pass"
  },
  "checks": [
    {
      "section": "bias_playbook",
      "check": "loss_aversion_precommitted_exits_set",
      "status": "pass",
      "evidence": "loss aversion counter: pre-committed exits are set"
    },
    {
      "section": "bias_playbook",
      "check": "loss_aversion_reunderwritten_instead_of_waiting_to_get_even",
      "status": "pass",
      "evidence": "loss aversion counter: the position is re-underwritten instead of held while waiting to get even"
    },
    {
      "section": "bias_playbook",
      "check": "anchoring_own_valuation_written_before_market_price_targets",
      "status": "pass",
      "evidence": "anchoring counter: your own valuation is written BEFORE reading the market's price targets"
    },
    {
      "section": "bias_playbook",
      "check": "recency_base_rates_and_long_windows_used",
      "status": "pass",
      "evidence": "recency counter: base rates and long windows are used \u2014 one year is not a trend"
    },
    {
      "section": "bias_playbook",
      "check": "position_size_within_sizing_cap",
      "status": "pass",
      "evidence": "overconfidence counter: sizing caps \u2014 the declared position size percent is at or below the declared sizing cap percent"
    },
    {
      "section": "bias_playbook",
      "check": "confirmation_disconfirming_evidence_present",
      "status": "pass",
      "evidence": "confirmation counter: a mandatory disconfirming-evidence section is present in the thesis (also a quality gate: disconfirming evidence present in every thesis)"
    },
    {
      "section": "bias_playbook",
      "check": "sunk_cost_would_buy_today_test_applied",
      "status": "pass",
      "evidence": "sunk cost counter: the 'would I buy this today at this price?' test is applied"
    },
    {
      "section": "bias_playbook",
      "check": "all_considered_biases_have_counter_applied",
      "status": "pass",
      "evidence": "bias playbook with counters: every bias the caller declares considered carries its applied counter"
    },
    {
      "section": "precommitment_and_thesis",
      "check": "written_precommitment_rules_present",
      "status": "pass",
      "evidence": "pre-commitment: written rules exist \u2014 decisions get made when calm and enforced when not"
    },
    {
      "section": "precommitment_and_thesis",
      "check": "stop_levels_set",
      "status": "pass",
      "evidence": "pre-commitment: stop levels are set \u2014 written rules, journal, and stop levels beat willpower"
    },
    {
      "section": "precommitment_and_thesis",
      "check": "written_thesis_before_entry",
      "status": "pass",
      "evidence": "FOMO/chasing counter: no entry without a written thesis"
    },
    {
      "section": "cooling_off",
      "check": "cooling_off_hours_at_least_48",
      "status": "pass",
      "evidence": "FOMO/chasing counter: 48h cooling-off \u2014 the declared cooling-off hours elapsed for this entry decision are at least 48"
    },
    {
      "section": "cooling_off",
      "check": "cooling_off_periods_honored_for_impulsive_ideas",
      "status": "pass",
      "evidence": "quality gate: cooling-off periods honored for impulsive ideas"
    },
    {
      "section": "decision_journal",
      "check": "journal_decision_recorded",
      "status": "pass",
      "evidence": "journals: every decision is recorded in the journal"
    },
    {
      "section": "decision_journal",
      "check": "journal_expected_outcome_recorded",
      "status": "pass",
      "evidence": "journals: the expected outcome is recorded with the decision"
    },
    {
      "section": "decision_journal",
      "check": "journal_actual_outcome_and_lessons_recorded",
      "status": "pass",
      "evidence": "journals: later actuals are recorded against the decision"
    },
    {
      "section": "decision_journal",
      "check": "journal_current_with_outcomes_and_lessons",
      "status": "pass",
      "evidence": "quality gate: journal current with outcomes + lessons"
    },
    {
      "section": "decision_journal",
      "check": "journal_reviewed_monthly",
      "status": "pass",
      "evidence": "journals: the journal is reviewed monthly \u2014 patterns surface on review"
    },
    {
      "section": "decision_journal",
      "check": "hit_rate_tracked_honestly_in_journal",
      "status": "pass",
      "evidence": "overconfidence counter: track your hit rate honestly (journal)"
    },
    {
      "section": "watch_and_challenge",
      "check": "no_continuous_price_watching",
      "status": "pass",
      "evidence": "watch conditions: no continuous price-watching (also the quality gate: review cadence held, not continuous watching)"
    },
    {
      "section": "watch_and_challenge",
      "check": "scheduled_reviews_used",
      "status": "pass",
      "evidence": "watch conditions: scheduled reviews are used instead of continuous watching"
    },
    {
      "section": "watch_and_challenge",
      "check": "notifications_off",
      "status": "pass",
      "evidence": "watch conditions: notifications off \u2014 headlines are not data"
    },
    {
      "section": "watch_and_challenge",
      "check": "devils_advocate_round_assigned",
      "status": "pass",
      "evidence": "committee tricks: a devil's advocate round is assigned for big decisions"
    },
    {
      "section": "watch_and_challenge",
      "check": "slept_on_material_changes",
      "status": "pass",
      "evidence": "committee tricks: material changes are slept on"
    },
    {
      "section": "watch_and_challenge",
      "check": "major_move_discussed_with_advisor_set_documented",
      "status": "pass",
      "evidence": "not a major move"
    },
    {
      "section": "temptation_and_red_lines",
      "check": "one_click_trading_paths_removed",
      "status": "pass",
      "evidence": "temptation architecture: one-click trading paths are removed for the accounts that matter"
    },
    {
      "section": "temptation_and_red_lines",
      "check": "decision_not_driven_by_headlines",
      "status": "pass",
      "evidence": "red line: no decisions driven by headlines"
    },
    {
      "section": "temptation_and_red_lines",
      "check": "decision_not_driven_by_streaks",
      "status": "pass",
      "evidence": "red line: no decisions driven by streaks"
    },
    {
      "section": "temptation_and_red_lines",
      "check": "decision_not_driven_by_moods",
      "status": "pass",
      "evidence": "red line: no decisions driven by moods"
    },
    {
      "section": "temptation_and_red_lines",
      "check": "journal_not_skipped_for_this_decision",
      "status": "pass",
      "evidence": "red line: no skipped journals \u2014 the process IS the edge"
    }
  ],
  "computed_status": "within_limits_on_declared_evidence",
  "biases_considered_count": 1,
  "position_size_over_cap_percent": "-5.0000",
  "cooling_off_hours_below_48": "0.0000",
  "summary": "30 pass, 0 fail, 0 missing of 30 checks across six sections.",
  "stamp": "BEHAVIORAL FINANCE BIAS CHECK\ndecision: Buy AAPL\nVERDICT: BIAS_CHECK_CLEAR\n  bias_playbook                pass\n  precommitment_and_thesis     pass\n  cooling_off                  pass\n  decision_journal             pass\n  watch_and_challenge          pass\n  temptation_and_red_lines     pass\n30 pass, 0 fail, 0 missing of 30 checks across six sections."
}
```

### Example 2 — violations

Request — `POST /v1/behavioral-finance-bias-check`:

```json
{
  "decision": "Panic Sell",
  "decision_context": {
    "is_entry": false,
    "is_major_move": false
  },
  "bias_playbook": {
    "loss_aversion_precommitted_exits_set": true,
    "loss_aversion_reunderwritten_instead_of_waiting_to_get_even": true,
    "anchoring_own_valuation_written_before_market_price_targets": true,
    "recency_base_rates_and_long_windows_used": true,
    "overconfidence_sizing_cap_percent": 5.0,
    "overconfidence_position_size_percent": 10.0,
    "confirmation_disconfirming_evidence_present": true,
    "sunk_cost_would_buy_today_test_applied": true,
    "biases_considered": [
      {
        "bias": "Recency",
        "counter_applied": false
      }
    ]
  },
  "precommitment": {
    "written_rules_present": true,
    "stop_levels_set": true
  },
  "cooling_off": {
    "periods_honored_for_impulsive_ideas": true
  },
  "journal": {
    "decision_recorded": true,
    "expected_outcome_recorded": true,
    "actual_outcome_and_lessons_recorded": true,
    "current_with_outcomes_and_lessons": true,
    "reviewed_monthly": true,
    "hit_rate_tracked_honestly": true
  },
  "watch_and_challenge": {
    "continuous_price_watching": true,
    "scheduled_reviews_used": true,
    "notifications_off": true,
    "devils_advocate_round_assigned": true,
    "slept_on_material_changes": true
  },
  "temptation_and_red_lines": {
    "one_click_trading_paths_removed": true,
    "decision_driven_by_headlines": true,
    "decision_driven_by_streaks": false,
    "decision_driven_by_moods": false,
    "journal_skipped_for_this_decision": false
  }
}
```

Response — HTTP 200:

```json
{
  "service": "behavioral-finance-bias-check",
  "atom_version": "0.1.0",
  "decision": "Panic Sell",
  "verdict": "BIAS_CHECK_FAILED",
  "sections": {
    "bias_playbook": "fail",
    "precommitment_and_thesis": "pass",
    "cooling_off": "pass",
    "decision_journal": "pass",
    "watch_and_challenge": "fail",
    "temptation_and_red_lines": "fail"
  },
  "checks": [
    {
      "section": "bias_playbook",
      "check": "loss_aversion_precommitted_exits_set",
      "status": "pass",
      "evidence": "loss aversion counter: pre-committed exits are set"
    },
    {
      "section": "bias_playbook",
      "check": "loss_aversion_reunderwritten_instead_of_waiting_to_get_even",
      "status": "pass",
      "evidence": "loss aversion counter: the position is re-underwritten instead of held while waiting to get even"
    },
    {
      "section": "bias_playbook",
      "check": "anchoring_own_valuation_written_before_market_price_targets",
      "status": "pass",
      "evidence": "anchoring counter: your own valuation is written BEFORE reading the market's price targets"
    },
    {
      "section": "bias_playbook",
      "check": "recency_base_rates_and_long_windows_used",
      "status": "pass",
      "evidence": "recency counter: base rates and long windows are used \u2014 one year is not a trend"
    },
    {
      "section": "bias_playbook",
      "check": "position_size_within_sizing_cap",
      "status": "fail",
      "evidence": "overconfidence counter: sizing caps \u2014 the declared position size percent is at or below the declared sizing cap percent"
    },
    {
      "section": "bias_playbook",
      "check": "confirmation_disconfirming_evidence_present",
      "status": "pass",
      "evidence": "confirmation counter: a mandatory disconfirming-evidence section is present in the thesis (also a quality gate: disconfirming evidence present in every thesis)"
    },
    {
      "section": "bias_playbook",
      "check": "sunk_cost_would_buy_today_test_applied",
      "status": "pass",
      "evidence": "sunk cost counter: the 'would I buy this today at this price?' test is applied"
    },
    {
      "section": "bias_playbook",
      "check": "all_considered_biases_have_counter_applied",
      "status": "fail",
      "evidence": "bias playbook with counters: every bias the caller declares considered carries its applied counter"
    },
    {
      "section": "precommitment_and_thesis",
      "check": "written_precommitment_rules_present",
      "status": "pass",
      "evidence": "pre-commitment: written rules exist \u2014 decisions get made when calm and enforced when not"
    },
    {
      "section": "precommitment_and_thesis",
      "check": "stop_levels_set",
      "status": "pass",
      "evidence": "pre-commitment: stop levels are set \u2014 written rules, journal, and stop levels beat willpower"
    },
    {
      "section": "precommitment_and_thesis",
      "check": "written_thesis_before_entry",
      "status": "pass",
      "evidence": "not an entry decision"
    },
    {
      "section": "cooling_off",
      "check": "cooling_off_hours_at_least_48",
      "status": "pass",
      "evidence": "not an entry decision"
    },
    {
      "section": "cooling_off",
      "check": "cooling_off_periods_honored_for_impulsive_ideas",
      "status": "pass",
      "evidence": "quality gate: cooling-off periods honored for impulsive ideas"
    },
    {
      "section": "decision_journal",
      "check": "journal_decision_recorded",
      "status": "pass",
      "evidence": "journals: every decision is recorded in the journal"
    },
    {
      "section": "decision_journal",
      "check": "journal_expected_outcome_recorded",
      "status": "pass",
      "evidence": "journals: the expected outcome is recorded with the decision"
    },
    {
      "section": "decision_journal",
      "check": "journal_actual_outcome_and_lessons_recorded",
      "status": "pass",
      "evidence": "journals: later actuals are recorded against the decision"
    },
    {
      "section": "decision_journal",
      "check": "journal_current_with_outcomes_and_lessons",
      "status": "pass",
      "evidence": "quality gate: journal current with outcomes + lessons"
    },
    {
      "section": "decision_journal",
      "check": "journal_reviewed_monthly",
      "status": "pass",
      "evidence": "journals: the journal is reviewed monthly \u2014 patterns surface on review"
    },
    {
      "section": "decision_journal",
      "check": "hit_rate_tracked_honestly_in_journal",
      "status": "pass",
      "evidence": "overconfidence counter: track your hit rate honestly (journal)"
    },
    {
      "section": "watch_and_challenge",
      "check": "no_continuous_price_watching",
      "status": "fail",
      "evidence": "watch conditions: no continuous price-watching (also the quality gate: review cadence held, not continuous watching)"
    },
    {
      "section": "watch_and_challenge",
      "check": "scheduled_reviews_used",
      "status": "pass",
      "evidence": "watch conditions: scheduled reviews are used instead of continuous watching"
    },
    {
      "section": "watch_and_challenge",
      "check": "notifications_off",
      "status": "pass",
      "evidence": "watch conditions: notifications off \u2014 headlines are not data"
    },
    {
      "section": "watch_and_challenge",
      "check": "devils_advocate_round_assigned",
      "status": "pass",
      "evidence": "committee tricks: a devil's advocate round is assigned for big decisions"
    },
    {
      "section": "watch_and_challenge",
      "check": "slept_on_material_changes",
      "status": "pass",
      "evidence": "committee tricks: material changes are slept on"
    },
    {
      "section": "watch_and_challenge",
      "check": "major_move_discussed_with_advisor_set_documented",
      "status": "pass",
      "evidence": "not a major move"
    },
    {
      "section": "temptation_and_red_lines",
      "check": "one_click_trading_paths_removed",
      "status": "pass",
      "evidence": "temptation architecture: one-click trading paths are removed for the accounts that matter"
    },
    {
      "section": "temptation_and_red_lines",
      "check": "decision_not_driven_by_headlines",
      "status": "fail",
      "evidence": "red line: no decisions driven by headlines"
    },
    {
      "section": "temptation_and_red_lines",
      "check": "decision_not_driven_by_streaks",
      "status": "pass",
      "evidence": "red line: no decisions driven by streaks"
    },
    {
      "section": "temptation_and_red_lines",
      "check": "decision_not_driven_by_moods",
      "status": "pass",
      "evidence": "red line: no decisions driven by moods"
    },
    {
      "section": "temptation_and_red_lines",
      "check": "journal_not_skipped_for_this_decision",
      "status": "pass",
      "evidence": "red line: no skipped journals \u2014 the process IS the edge"
    }
  ],
  "computed_status": "outside_limits_on_declared_evidence",
  "biases_considered_count": 1,
  "position_size_over_cap_percent": "5.0000",
  "cooling_off_hours_below_48": null,
  "summary": "26 pass, 4 fail, 0 missing of 30 checks across six sections.",
  "stamp": "BEHAVIORAL FINANCE BIAS CHECK\ndecision: Panic Sell\nVERDICT: BIAS_CHECK_FAILED\n  bias_playbook                fail\n  precommitment_and_thesis     pass\n  cooling_off                  pass\n  decision_journal             pass\n  watch_and_challenge          fail\n  temptation_and_red_lines     fail\n26 pass, 4 fail, 0 missing of 30 checks across six sections."
}
```

### Example 3 — malformed

Request — `POST /v1/behavioral-finance-bias-check`:

```json
{
  "decision": "Bad types",
  "decision_context": "not_an_object"
}
```

Response — HTTP 422:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "decision_context",
  "detail": "decision_context must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present (tutorial / how-to / reference / explanation) | Yes — Tutorial, How-to guides, Reference and Explanation sections above; output is CommonMark markdown |
| Role views present (integrators / developers / ops / regulators) | Integrators Yes; developers Yes; ops Yes; regulators N/A — N/A — finance-domain but not compliance-facing: SERVICE.md scopes the verdict as an advisory method check (a completeness check of a declared bias-check pack, explicitly not investment advice and not a behavioural diagnosis); the verdict is not compliance or audit evidence for any regulated activity. |
| Checks named (documented / recorded) | 30 / 30 — every check in the recorded full-pass response is listed under Reference → Checks |
| Verdict vocabulary complete | Yes — 3 verdict values, plus section statuses and per-check statuses |
| Input reference typed | Yes — 34 fields, each with its type, grouped as in SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass / violations / malformed inputs and REST responses compared as JSON values against `verification/work/behavioral-finance-bias-check/evidence.json` after writing |

