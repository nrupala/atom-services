# Budget design review — documentation

**Budget design review** · slug `budget-design-review` · deliverable type: REVIEW · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. The worked examples at the end are real recorded trial runs, reproduced verbatim from the external verification evidence.

## Tutorial

A first call, walked through end to end. This tutorial narrates the recorded full-pass trial run (Worked example 1 below reproduces it verbatim); every value named here is the value that run actually returned.

**The job.** You have a budget design — its scope, lines, drivers, totals, revenue link, contingency, approval baseline, monitoring and close, and you want one deterministic verdict on whether it is complete and internally coherent on its own declared evidence.

**Step 1 — get a key.** Sign up and issue a gateway key for this atom (the exact calls are in *How-to guides → Get a key and call via REST*). Keep the key; you send it as `Authorization: Bearer <key>` on every call.

**Step 2 — assemble the manifest.** Build one JSON object covering every section: `scope`, `structure_and_owners`, `drivers_and_totals`, `revenue_and_contingency`, `approval_and_baseline`, `monitoring_and_close`. In the recorded run the identity field `budget` was `"Q1 Marketing Plan"`. Fill each evidence field honestly from your own records: `true` where the practice was followed, `false` where a must-be-false field applies (see the Input reference — those fields must be `false` to pass), and the declared lists and numbers the computed checks re-derive. Leave a field out only if you genuinely have no evidence for it — an absent field is not a failure, it is `missing`, and it will hold the verdict at `INSUFFICIENT_EVIDENCE`.

**Step 3 — send it.** `POST https://atoms.pipavia.com/v1/budget-design-review` with the manifest as the body and your key in the `Authorization` header.

**Step 4 — read the verdict.** The recorded run returned HTTP 200 with verdict `BUDGET_DESIGN_SOUND`: every section `pass`, and the summary "29 pass, 0 fail, 0 missing of 29 checks across six sections." The computed fields came back `computed_status` = `"within_stated_limits_on_declared_evidence"`, `lines_evaluated` = `1`, `ownerless_line_indexes` = `[]`, `computed_total` = `"500.00"`, `total_difference` = `"0.00"` — the declared lists and numbers agree with the limits the method itself states, on the declared evidence.

**Step 5 — act on it.** A `BUDGET_DESIGN_SOUND` verdict means the manifest is complete on the evidence you declared — it does not certify that the underlying work is good (see *Explanation → What it does not do*). If instead you get the failing verdict or `INSUFFICIENT_EVIDENCE`, the `checks` array names exactly which checks failed or are missing; *How-to guides → Read a failing verdict and fix the manifest* walks through that repair loop using the recorded violations run.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "budget-design-review"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.
4. Call the atom: `POST https://atoms.pipavia.com/v1/budget-design-review` — body = the manifest object (see the Input reference).

```bash
curl -s -X POST https://atoms.pipavia.com/v1/budget-design-review \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -d @manifest.json
```

The response is the verdict object described in *Reference → Output format*. The same manifest always returns the same verdict (determinism was byte-identical on the recorded repeat call — see TEST-REPORT.md).

### Call via MCP

- Endpoint: `POST https://atoms.pipavia.com/mcp/budget-design-review`
- Tool name: `budget_design_review`
- Call `tools/call` with the tool name above and the manifest object as the arguments — the same object you would send as the REST body, with the same `Authorization: Bearer <key>` header.
- The MCP result's structured content is the same verdict object as the REST response (parity was verified structured-equal on the recorded full-pass run — see TEST-REPORT.md). Prefer whichever face your client already speaks; do not expect different verdicts from the two faces.

### Read a failing verdict and fix the manifest

The recorded violations run (Worked example 2) returned verdict `BUDGET_DESIGN_NOT_SOUND` with the summary "4 pass, 5 fail, 20 missing of 29 checks across six sections." Repair any failing verdict the same way:

1. **Read `sections` first.** A section is `fail` when any of its checks fails, `insufficient_evidence` when none fails but at least one is `missing`, and `pass` only when all its checks pass. That tells you where to look.
2. **Read the `checks` array.** Each entry is `{section, check, status, evidence}`. Work the `fail` entries first — the `evidence` text states the rule that was breached. In the recorded violations run the failing checks were: `budget_type_is_stated_kind`, `every_line_has_named_owner`, `line_amounts_match_driver_products`, `budget_balances_against_expected_income`, `no_hidden_padding`.
3. **Distinguish `fail` from `missing`.** `fail` = the field was present but false, invalid, or arithmetically/set-wise incoherent — fix the underlying practice or correct the declaration. `missing` = the field was absent — supply the evidence; do not guess a value to make the check pass, because the atom audits declarations, and a declaration you cannot stand behind is worse than a missing one.
4. **Check the computed fields.** On a failing verdict the computed outputs (see *Reference → Output format*) show the re-derived values and the differences, so you can see by how much a declared total, count, or list disagrees before you resubmit.
5. **Fix the manifest and resubmit the whole object.** The atom is stateless per call: there is no partial update, no case to reopen, and no memory of the previous submission. Resubmit the corrected full manifest and read the new verdict.

### Handle a 422 invalid_input

A type violation is not a verdict — the call is rejected before any check runs. The recorded malformed run (Worked example 3) returned HTTP 422 with this body:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "scope",
  "detail": "scope must be an object"
}
```

- `field` names the exact manifest field whose type was wrong (`scope` in the recorded run); `detail` states the type it must be (`"scope must be an object"`).
- Fix that field's type in the manifest (consult the type column of the Input reference), then resubmit. If you sent several wrongly-typed fields, expect to repeat this once per call — the recorded shape reports one `field` per response.
- Do not retry the identical body: a 422 is deterministic for the same input and will not clear on its own. It is also not a rate-limit or auth problem — check the `error` value first: `invalid_input` means the manifest, not the key.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/budget-design-review` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/budget-design-review` — tool name `budget_design_review`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Gateway: https://atoms.pipavia.com, gateway version 1.1.0 at the time of the recorded runs. Key scope: this atom only — a key's scope for one atom never verifies for another (contract.yaml key namespace `budget_design_review`).

### Input reference

One JSON manifest. Types are taken from SERVICE.md's field table (its preamble states: all fields are booleans unless noted); the evidence `inputSchema` corroborates the top-level object/string/array types. Notes — including must-be-false gates and computed/conditional behaviour — are preserved from SERVICE.md. Fields are grouped as SERVICE.md groups them (by the section that reads them).

#### Carried / top-level (not itself checked)

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `budget` | string | string; carried into the verdict output, not itself checked |
| `lines[].name` | string | string; carried for readability, not itself checked |

#### Read by section `scope`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `scope.budget_type` | string | string; computed, see below |
| `scope.entity_named` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `scope.currency_stated` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `scope.governs_stated` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `scope.exclusions_stated` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |

#### Read by section `structure_and_owners, drivers_and_totals`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `lines` | list of line objects | list of line objects; absent = line-derived checks missing, empty list = `lines_present` fails |

#### Read by section `structure_and_owners`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `lines[].owner` | string | string; computed, see below |
| `lines[].approach` | string | string; computed, see below |

#### Read by section `drivers_and_totals`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `lines[].driver_documented` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `lines[].driver_quantity` | number | number; computed, see below |
| `lines[].driver_unit_cost` | number | number; computed, see below |
| `lines[].amount` | number | number; computed, see below |

#### Read by section `drivers_and_totals, revenue_and_contingency`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `totals.declared_total` | number | number; computed, see below |

#### Read by section `revenue_and_contingency`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `totals.expected_income` | number | number; computed, see below |
| `revenue.linked_to_forecast` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `contingency.explicit_line_present` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `contingency.sized_to_identified_risks` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `contingency.hidden_padding_present` | boolean | must be `false` to pass — skill red line |

#### Read by section `approval_and_baseline`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `approval.baseline_approved_and_locked` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `approval.approval_thresholds_documented` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `approval.revisions_reapproved` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |

#### Read by section `monitoring_and_close`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `monitoring.monthly_variance_process_running` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `monitoring.variance_thresholds_trigger_explanations` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `monitoring.variance_actions_tracked` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `monitoring.rolling_forecast_cadence_set` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `monitoring.rolling_horizon_months` | number | number; computed, see below |
| `close.annual_true_up_done` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `close.carry_over_rules_decided` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `close.lessons_carried_to_next_cycle` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `close.silent_reallocations_made` | boolean | must be `false` to pass — skill red line |
| `close.actuals_edited_without_annotation` | boolean | must be `false` to pass — skill red line |

Container objects (the section objects and any list-of-objects entries above) are objects/arrays as typed; a container sent as the wrong JSON type is a 422 `invalid_input`, not a failing check (see Errors).

### Checks

Every check the atom runs — 29 checks, grouped by section. Ground truth: the `checks` array of the recorded full-pass REST response (Worked example 1), cross-checked against SERVICE.md; the counts agree (29/29). The `evidence` text quoted for each check is the recorded response's own statement of what the check requires.

**Per-check status semantics (all checks):** `pass` — the recorded evidence satisfies the stated requirement; `fail` — the field was present but false/invalid, or a computed condition (arithmetic, set coverage, vocabulary) was not met; `missing` — the field(s) the check reads were absent, so there is no evidence to judge. No `not_applicable` per-check status is returned by this atom in any recorded case.

#### Section `scope` — 5 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `budget_type_is_stated_kind` | method step 1: the budget type is one of the kinds the skill names — operating, capital, or personal |
| `entity_named` | method step 1: the entity the budget belongs to is named |
| `currency_stated` | method step 1: the budget currency is stated |
| `governs_stated` | method step 1: what the budget governs is stated |
| `exclusions_stated` | method step 1: what the budget does not govern is stated |

#### Section `structure_and_owners` — 3 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `lines_present` | method step 2: the budget declares at least one line |
| `every_line_has_named_owner` | quality gate: every line has an owner — lines without owners become orphaned spending |
| `every_line_approach_is_stated_kind` | method step 3: every line states its approach, and each approach is one the skill names — zero-based for new/volatile areas, incremental for stable ones |

#### Section `drivers_and_totals` — 3 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `drivers_documented_for_every_line` | quality gate: drivers are documented for every line — built from drivers, not flat percentages |
| `line_amounts_match_driver_products` | method step 4: every line amount equals its declared driver quantity times its declared driver unit cost (headcount x rate, units x cost, usage x price) |
| `declared_total_matches_line_sum` | the declared total equals the sum of the declared line amounts — the total is re-derived, not trusted |

#### Section `revenue_and_contingency` — 5 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `revenue_linked_to_forecast` | method step 5: the revenue side is linked to forecasting — expected income, not hope |
| `budget_balances_against_expected_income` | method step 5: the declared total does not exceed the declared expected income — the budget balances against expected income |
| `contingency_explicit_line_present` | quality gate: contingency is explicit — a visible line, not buried in other lines |
| `contingency_sized_to_identified_risks` | method step 6: the contingency line is sized to identified risks |
| `no_hidden_padding` | red line: no hidden padding |

#### Section `approval_and_baseline` — 3 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `baseline_approved_and_locked` | method step 7: the baseline is approved and locked |
| `approval_thresholds_documented` | quality gate: approval thresholds are set and documented — who may approve money decisions, and up to what was decided (the threshold values themselves are the caller's, not checked) |
| `revisions_reapproved_not_drifted` | method step 7: revisions are re-approved, not drifted into the baseline |

#### Section `monitoring_and_close` — 10 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `monthly_variance_process_running` | quality gate: a monthly variance process is running — budget vs actual vs latest forecast, on a calendar, not a crisis |
| `variance_thresholds_trigger_written_explanations` | method step 8: variance thresholds trigger written explanations (the threshold values are the caller's — the skill states none, so none is checked) |
| `variance_actions_tracked` | quality gate: variance reviews produce actions, and the actions are tracked |
| `rolling_forecast_cadence_set` | quality gate: a rolling forecast cadence is set where volatility demands it |
| `rolling_forecast_covers_twelve_months` | method step 8: the rolling forecast covers the twelve months the skill states |
| `annual_true_up_done` | method step 9: an annual true-up closes the cycle |
| `carry_over_rules_decided` | method step 9: carry-over rules are decided, not improvised at year end |
| `lessons_carried_to_next_cycle` | method step 9: lessons from this cycle are carried to the next cycle |
| `no_silent_reallocations` | red line: no silent reallocations |
| `no_unannotated_actual_edits` | red line: actuals are never edited — corrections are annotated with date and reason |

#### Computed checks in detail

- **Budget kind (`budget_type_is_stated_kind`):** `scope.budget_type` passes only when it is one of the three stated kinds — `operating`, `capital`, `personal`. Any other string is present and fails; an absent type is missing evidence. Validated as a string only, never enum-checked at the type layer.
- **Line ownership (`every_line_has_named_owner`):** passes only when every declared line carries a non-empty `owner` string. A line whose owner key is absent makes the check missing evidence; an empty owner string fails. The output reports offending positions as `ownerless_line_indexes` (null when no lines list is declared) and the count as `lines_evaluated`.
- **Line approaches (`every_line_approach_is_stated_kind`):** every line's `approach` passes only as `zero_based` or `incremental`. An absent approach key is missing evidence; any other string fails.
- **Driver products (`line_amounts_match_driver_products`):** a line's `amount` passes only when it equals its `driver_quantity` × `driver_unit_cost`. If any of the three numbers is absent on any line, the check is missing evidence.
- **Total re-derivation (`declared_total_matches_line_sum`):** `totals.declared_total` passes only when it equals the sum of the declared line amounts. The output reports `computed_total` and `total_difference` (declared minus computed; each null when it cannot be computed).
- **Balance against income (`budget_balances_against_expected_income`):** the declared total passes only when it does not exceed `totals.expected_income`. An absent figure is missing evidence.
- **Rolling horizon (`rolling_forecast_covers_twelve_months`):** `monitoring.rolling_horizon_months` passes only at exactly 12. An absent horizon is missing evidence.
- **Fixed serialization rule:** computed money totals are reported as strings with exactly two decimal places — round half up to 2dp, `floor(v * 100 + 0.5) / 100`, then format with exactly two decimals. That fixed serialization is what makes the Python and TypeScript outputs byte-identical.

**Computed-status fail-precedence rule (exactly as SERVICE.md states it):** `computed_status` is computed over the five scalar computed checks (budget kind, driver products, total re-derivation, balance, rolling horizon). If any of the five scalar checks fails, the status is `outside_stated_limits_on_declared_evidence`; if all five pass, it is `within_stated_limits_on_declared_evidence`; it is null only when nothing fails and at least one scalar check is incomplete (missing evidence).

### Output format

HTTP 200 with one JSON verdict object (a 422 rejection is the only non-verdict response shape — see Errors). Top-level fields, in the order returned in the recorded responses:

| Field | Meaning |
|---|---|
| `service` | Always `"budget-design-review"`. |
| `atom_version` | Atom version that produced the verdict (`"0.1.0"` in the recorded runs). |
| `budget` | The manifest's identity field, carried through (null when the manifest did not declare it, as in the recorded violations run for some atoms). |
| `verdict` | One of the verdict values below. |
| `sections` | Object mapping each section name to its section status (`pass` / `fail` / `insufficient_evidence`). |
| `checks` | Array of `{section, check, status, evidence}` — one entry per check, in section order. |
| `computed_status` | `within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null — see the computed-checks note above. |
| `lines_evaluated` | Computed output field (see *Checks → Computed checks in detail*); in the recorded full-pass run: `1`. Null when it cannot be computed from the declared values, unless SERVICE.md states a different null rule for it. |
| `ownerless_line_indexes` | Computed output field (see *Checks → Computed checks in detail*); in the recorded full-pass run: `[]`. Null when it cannot be computed from the declared values, unless SERVICE.md states a different null rule for it. |
| `computed_total` | Computed output field (see *Checks → Computed checks in detail*); in the recorded full-pass run: `"500.00"`. Null when it cannot be computed from the declared values, unless SERVICE.md states a different null rule for it. |
| `total_difference` | Computed output field (see *Checks → Computed checks in detail*); in the recorded full-pass run: `"0.00"`. Null when it cannot be computed from the declared values, unless SERVICE.md states a different null rule for it. |
| `summary` | One-line count, e.g. "29 pass, 0 fail, 0 missing of 29 checks across six sections." |
| `stamp` | Plain-text rendering of the same verdict (display name, identity, verdict, per-section statuses, summary) for human-readable records. |

### Verdict vocabulary

| Value | Kind | Meaning |
|---|---|---|
| `BUDGET_DESIGN_SOUND` | verdict | Every check passes (29/29); the manifest is complete and coherent on the declared evidence. |
| `BUDGET_DESIGN_NOT_SOUND` | verdict | At least one check fails. Failing checks are named in the `checks` array with their evidence text. |
| `INSUFFICIENT_EVIDENCE` | verdict | Nothing fails, but at least one check is `missing` — evidence was not declared. The missing checks name exactly what to supply. |
| `within_stated_limits_on_declared_evidence` | `computed_status` | All computed checks that could be completed are within the limits the method itself states. |
| `outside_stated_limits_on_declared_evidence` | `computed_status` | At least one computed check is outside those stated limits. |
| `null` | `computed_status` | Under SERVICE.md's fail-precedence rule for this atom: null only when nothing among the five scalar computed checks fails and at least one scalar check is incomplete (missing evidence). |
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
| 422 | `invalid_input` | Recorded body (verbatim from the malformed case): `{"ok": false, "error": "invalid_input", "field": "scope", "detail": "scope must be an object"}` — `ok: false`, `error`, `field` (the exact manifest field) and `detail` (the type it must be). Never a verdict. |
| 429 | rate limit | Rate limit exceeded: 60/min, 10,000/day per key (contract.yaml / USER-GUIDE.md). No body shape is recorded in the evidence; back off and retry after the window. |

### Rate limits and pricing status

- Rate limits (contract.yaml): **60 requests per minute per key** and **10,000 requests per day per key**. Contract note: the per-key rate limit is the capacity guard for open public usage; tuned per atom at build-out from measured production cost.
- Pricing (contract.yaml): pricing unit = deliverable; `pricing.rate` is **null** (`rate_status: pending`). **Free during trial — rate pending.** Prices are set only from measured production cost per unit (SERVICE.md).

## Explanation

### What this atom does, in depth

This atom reviews one declared budget design against a budget method that is meant to hold: scope first (kind, entity, currency, what it governs and excludes), then lines with named owners and a stated zero-based or incremental approach, lines built from drivers whose products must equal the line amounts, a declared total that must re-derive from the lines and balance against expected income, explicit contingency with no hidden padding, an approved and locked baseline, and a monitoring-and-close cycle with variance processes, a rolling 12-month horizon, and no silent reallocations or unannotated edits to actuals. It is a completeness and consistency audit of the design's own declarations and arithmetic.

### How the verdict is decided

The core is deterministic: same manifest in → same verdict out, byte-identically (verified on the recorded repeat call). Each check reads declared field(s) and lands in exactly one of three states:

- **Absent field = missing evidence.** The check is `missing`; its section is `insufficient_evidence` unless another check in it fails; and if nothing anywhere fails, the verdict is `INSUFFICIENT_EVIDENCE`. Missing is not a failure and is never silently treated as `false`.
- **Present but false / invalid = fail.** The check is `fail`, its section is `fail`, and the verdict is the failing verdict — one failing check is enough, however complete the rest of the manifest is. Must-be-false (red-line) fields work the same way in mirror image: present and `true` = fail.
- **Computed checks** re-derive what can be re-derived from the declared values themselves — arithmetic, set coverage, and stated vocabulary only, importing no outside threshold (see *Checks → Computed checks in detail*). A computed check whose inputs are absent is `missing`, not failed; one whose inputs are present but disagree is `fail`.

Section statuses roll up mechanically (`fail` if any check fails, else `insufficient_evidence` if any is missing, else `pass`), and the verdict rolls up the same way across all 29 checks: `BUDGET_DESIGN_SOUND` only when every check passes.

### What it does not do

- It does **not** author a budget, choose amounts, source expected income, or verify that a declared value is true.
- It is **not financial advice and not a judgment review**: it never decides whether the amounts are wise, whether an owner actually agreed to own a line, whether a driver is the right driver, or whether the expected income will arrive. SERVICE.md answers the register's named doubt — finance advice adjacency — with exactly this scoping.
- No numeric variance threshold (the method requires thresholds to trigger explanations and actions but states no value — only the trigger's declared existence is checked); no contingency size or percentage; no approval threshold amounts (documented existence only).
- No check that a line picked the *right* approach for its volatility — volatility is not declared in a form arithmetic can test, so only that a stated, method-named approach is present is checked. No live verification of any declared fact.

The atom sells its deliverable — the bounded judgment artifact (the verdict object) — never the underlying knowledge or method itself.

### Buyer and use context

First buyer hypothesis (SERVICE.md, from register data; not yet market-tested): teams and agents working in Money & markets who need this review on demand. Named self-use: **Business budget planning work** — Wright is an internal caller (zero price, metered to the internal cost ledger).

## Role views

### For integrators (Users)

- Start with [USER-GUIDE.md](USER-GUIDE.md) for the quick start, then the Tutorial and How-to guides above. One call = one manifest in, one verdict object out; there is no session, upload, or follow-up state to manage.
- Integrate on the REST face (`POST /v1/budget-design-review`) or the MCP face (tool `budget_design_review`) — they return the same verdict object and were parity-verified. Branch on `verdict` first, then on per-check `status` for repair guidance; treat HTTP 422 as a client bug (fix the type named in `field`), 401/403 as key problems, and 429 as back-off.
- Cache by manifest content if you cache at all: the verdict is a pure function of the manifest, so an identical manifest never needs a second paid call.

### For developers

- Manifest authoring: type every field exactly as the Input reference states — booleans as JSON booleans (not `"true"`), numbers as JSON numbers, lists as arrays of strings. A wrong type is a 422 at the gateway, not a failing check; a wrong *value* is a failing check. Vocabulary and coverage fields are validated as strings only and judged as verdict checks, so a misspelled vocabulary entry fails its check rather than erroring.
- Determinism: the core is a deterministic Python oracle with a TypeScript port, parity-proven (TEST-REPORT.md); the recorded REST repeat was byte-identical and MCP structured content was deep-equal to REST. Any fixed serialization rule for computed outputs is stated in *Checks → Computed checks in detail* where SERVICE.md states one.
- Source and tests: implementation in `src/budget_design_review.py`, tests in `tests/test_budget_design_review.py` (same directory as this document). Fixes land in the bound skill first, then the atom re-deploys and must pass regression before its version bumps (contract.yaml binding rule R1).

### For ops

- Endpoints: REST `POST https://atoms.pipavia.com/v1/budget-design-review` and MCP `POST https://atoms.pipavia.com/mcp/budget-design-review` on gateway https://atoms.pipavia.com (v1.1.0 at recorded-run time). Status: live — release candidate, one-week RC soak to 2026-11-22; treat verdict-shape changes during the soak as RC incidents, not silent deploys.
- Keys and scope: per-user, per-atom issuance (`POST /v1/keys`); a key's scope for this atom is namespace `budget_design_review` and never verifies for another atom. Watch 403s for mis-issued keys and 401s for missing/invalid headers.
- Limits and monitoring: 60/min and 10,000/day per key; alert on 429 volume (client retry storms), on 422 rate (a client shipping wrongly-typed manifests), and on any drift between REST and MCP verdicts for identical manifests (parity is a verified property — drift is a defect). Pricing is not yet metered for revenue: rate pending, free during trial.

## Worked examples

Provenance: recorded 2026-11-16T01:32:23.660221+00:00 against gateway v1.1.0, external verification lane, source `verification/work/budget-design-review/evidence.json`. The three examples below are that evidence's recorded cases: each shows the case's `input` and the REST execution's `response_text`, reproduced verbatim as JSON values (pretty-printed with indent 2 for readability; verified mechanically after writing — see the checklist).

### Example 1 — full-pass

Recorded expectation: HTTP 200, outcome `BUDGET_DESIGN_SOUND`. Recorded REST status: 200.

Input:

```json
{
  "budget": "Q1 Marketing Plan",
  "scope": {
    "budget_type": "operating",
    "entity_named": true,
    "currency_stated": true,
    "governs_stated": true,
    "exclusions_stated": true
  },
  "lines": [
    {
      "name": "Ads",
      "owner": "Marketing Lead",
      "approach": "zero_based",
      "driver_documented": true,
      "driver_quantity": 100,
      "driver_unit_cost": 5,
      "amount": 500
    }
  ],
  "totals": {
    "declared_total": 500,
    "expected_income": 1000
  },
  "revenue": {
    "linked_to_forecast": true
  },
  "contingency": {
    "explicit_line_present": true,
    "sized_to_identified_risks": true,
    "hidden_padding_present": false
  },
  "approval": {
    "baseline_approved_and_locked": true,
    "approval_thresholds_documented": true,
    "revisions_reapproved": true
  },
  "monitoring": {
    "monthly_variance_process_running": true,
    "variance_thresholds_trigger_explanations": true,
    "variance_actions_tracked": true,
    "rolling_forecast_cadence_set": true,
    "rolling_horizon_months": 12
  },
  "close": {
    "annual_true_up_done": true,
    "carry_over_rules_decided": true,
    "lessons_carried_to_next_cycle": true,
    "silent_reallocations_made": false,
    "actuals_edited_without_annotation": false
  }
}
```

Response (REST `response_text`):

```json
{
  "service": "budget-design-review",
  "atom_version": "0.1.0",
  "budget": "Q1 Marketing Plan",
  "verdict": "BUDGET_DESIGN_SOUND",
  "sections": {
    "scope": "pass",
    "structure_and_owners": "pass",
    "drivers_and_totals": "pass",
    "revenue_and_contingency": "pass",
    "approval_and_baseline": "pass",
    "monitoring_and_close": "pass"
  },
  "checks": [
    {
      "section": "scope",
      "check": "budget_type_is_stated_kind",
      "status": "pass",
      "evidence": "method step 1: the budget type is one of the kinds the skill names \u2014 operating, capital, or personal"
    },
    {
      "section": "scope",
      "check": "entity_named",
      "status": "pass",
      "evidence": "method step 1: the entity the budget belongs to is named"
    },
    {
      "section": "scope",
      "check": "currency_stated",
      "status": "pass",
      "evidence": "method step 1: the budget currency is stated"
    },
    {
      "section": "scope",
      "check": "governs_stated",
      "status": "pass",
      "evidence": "method step 1: what the budget governs is stated"
    },
    {
      "section": "scope",
      "check": "exclusions_stated",
      "status": "pass",
      "evidence": "method step 1: what the budget does not govern is stated"
    },
    {
      "section": "structure_and_owners",
      "check": "lines_present",
      "status": "pass",
      "evidence": "method step 2: the budget declares at least one line"
    },
    {
      "section": "structure_and_owners",
      "check": "every_line_has_named_owner",
      "status": "pass",
      "evidence": "quality gate: every line has an owner \u2014 lines without owners become orphaned spending"
    },
    {
      "section": "structure_and_owners",
      "check": "every_line_approach_is_stated_kind",
      "status": "pass",
      "evidence": "method step 3: every line states its approach, and each approach is one the skill names \u2014 zero-based for new/volatile areas, incremental for stable ones"
    },
    {
      "section": "drivers_and_totals",
      "check": "drivers_documented_for_every_line",
      "status": "pass",
      "evidence": "quality gate: drivers are documented for every line \u2014 built from drivers, not flat percentages"
    },
    {
      "section": "drivers_and_totals",
      "check": "line_amounts_match_driver_products",
      "status": "pass",
      "evidence": "method step 4: every line amount equals its declared driver quantity times its declared driver unit cost (headcount x rate, units x cost, usage x price)"
    },
    {
      "section": "drivers_and_totals",
      "check": "declared_total_matches_line_sum",
      "status": "pass",
      "evidence": "the declared total equals the sum of the declared line amounts \u2014 the total is re-derived, not trusted"
    },
    {
      "section": "revenue_and_contingency",
      "check": "revenue_linked_to_forecast",
      "status": "pass",
      "evidence": "method step 5: the revenue side is linked to forecasting \u2014 expected income, not hope"
    },
    {
      "section": "revenue_and_contingency",
      "check": "budget_balances_against_expected_income",
      "status": "pass",
      "evidence": "method step 5: the declared total does not exceed the declared expected income \u2014 the budget balances against expected income"
    },
    {
      "section": "revenue_and_contingency",
      "check": "contingency_explicit_line_present",
      "status": "pass",
      "evidence": "quality gate: contingency is explicit \u2014 a visible line, not buried in other lines"
    },
    {
      "section": "revenue_and_contingency",
      "check": "contingency_sized_to_identified_risks",
      "status": "pass",
      "evidence": "method step 6: the contingency line is sized to identified risks"
    },
    {
      "section": "revenue_and_contingency",
      "check": "no_hidden_padding",
      "status": "pass",
      "evidence": "red line: no hidden padding"
    },
    {
      "section": "approval_and_baseline",
      "check": "baseline_approved_and_locked",
      "status": "pass",
      "evidence": "method step 7: the baseline is approved and locked"
    },
    {
      "section": "approval_and_baseline",
      "check": "approval_thresholds_documented",
      "status": "pass",
      "evidence": "quality gate: approval thresholds are set and documented \u2014 who may approve money decisions, and up to what was decided (the threshold values themselves are the caller's, not checked)"
    },
    {
      "section": "approval_and_baseline",
      "check": "revisions_reapproved_not_drifted",
      "status": "pass",
      "evidence": "method step 7: revisions are re-approved, not drifted into the baseline"
    },
    {
      "section": "monitoring_and_close",
      "check": "monthly_variance_process_running",
      "status": "pass",
      "evidence": "quality gate: a monthly variance process is running \u2014 budget vs actual vs latest forecast, on a calendar, not a crisis"
    },
    {
      "section": "monitoring_and_close",
      "check": "variance_thresholds_trigger_written_explanations",
      "status": "pass",
      "evidence": "method step 8: variance thresholds trigger written explanations (the threshold values are the caller's \u2014 the skill states none, so none is checked)"
    },
    {
      "section": "monitoring_and_close",
      "check": "variance_actions_tracked",
      "status": "pass",
      "evidence": "quality gate: variance reviews produce actions, and the actions are tracked"
    },
    {
      "section": "monitoring_and_close",
      "check": "rolling_forecast_cadence_set",
      "status": "pass",
      "evidence": "quality gate: a rolling forecast cadence is set where volatility demands it"
    },
    {
      "section": "monitoring_and_close",
      "check": "rolling_forecast_covers_twelve_months",
      "status": "pass",
      "evidence": "method step 8: the rolling forecast covers the twelve months the skill states"
    },
    {
      "section": "monitoring_and_close",
      "check": "annual_true_up_done",
      "status": "pass",
      "evidence": "method step 9: an annual true-up closes the cycle"
    },
    {
      "section": "monitoring_and_close",
      "check": "carry_over_rules_decided",
      "status": "pass",
      "evidence": "method step 9: carry-over rules are decided, not improvised at year end"
    },
    {
      "section": "monitoring_and_close",
      "check": "lessons_carried_to_next_cycle",
      "status": "pass",
      "evidence": "method step 9: lessons from this cycle are carried to the next cycle"
    },
    {
      "section": "monitoring_and_close",
      "check": "no_silent_reallocations",
      "status": "pass",
      "evidence": "red line: no silent reallocations"
    },
    {
      "section": "monitoring_and_close",
      "check": "no_unannotated_actual_edits",
      "status": "pass",
      "evidence": "red line: actuals are never edited \u2014 corrections are annotated with date and reason"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "lines_evaluated": 1,
  "ownerless_line_indexes": [],
  "computed_total": "500.00",
  "total_difference": "0.00",
  "summary": "29 pass, 0 fail, 0 missing of 29 checks across six sections.",
  "stamp": "BUDGET DESIGN REVIEW\nbudget: Q1 Marketing Plan\nVERDICT: BUDGET_DESIGN_SOUND\n  scope                    pass\n  structure_and_owners     pass\n  drivers_and_totals       pass\n  revenue_and_contingency  pass\n  approval_and_baseline    pass\n  monitoring_and_close     pass\n29 pass, 0 fail, 0 missing of 29 checks across six sections."
}
```

### Example 2 — violations

Recorded expectation: HTTP 200, outcome `BUDGET_DESIGN_NOT_SOUND`. Recorded REST status: 200.

Input:

```json
{
  "scope": {
    "budget_type": "invalid_type"
  },
  "lines": [
    {
      "name": "Bad Line",
      "owner": "",
      "approach": "incremental",
      "driver_documented": true,
      "driver_quantity": 10,
      "driver_unit_cost": 10,
      "amount": 50
    }
  ],
  "totals": {
    "declared_total": 50,
    "expected_income": 10
  },
  "contingency": {
    "hidden_padding_present": true
  }
}
```

Response (REST `response_text`):

```json
{
  "service": "budget-design-review",
  "atom_version": "0.1.0",
  "budget": null,
  "verdict": "BUDGET_DESIGN_NOT_SOUND",
  "sections": {
    "scope": "fail",
    "structure_and_owners": "fail",
    "drivers_and_totals": "fail",
    "revenue_and_contingency": "fail",
    "approval_and_baseline": "insufficient_evidence",
    "monitoring_and_close": "insufficient_evidence"
  },
  "checks": [
    {
      "section": "scope",
      "check": "budget_type_is_stated_kind",
      "status": "fail",
      "evidence": "method step 1: the budget type is one of the kinds the skill names \u2014 operating, capital, or personal"
    },
    {
      "section": "scope",
      "check": "entity_named",
      "status": "missing",
      "evidence": "method step 1: the entity the budget belongs to is named"
    },
    {
      "section": "scope",
      "check": "currency_stated",
      "status": "missing",
      "evidence": "method step 1: the budget currency is stated"
    },
    {
      "section": "scope",
      "check": "governs_stated",
      "status": "missing",
      "evidence": "method step 1: what the budget governs is stated"
    },
    {
      "section": "scope",
      "check": "exclusions_stated",
      "status": "missing",
      "evidence": "method step 1: what the budget does not govern is stated"
    },
    {
      "section": "structure_and_owners",
      "check": "lines_present",
      "status": "pass",
      "evidence": "method step 2: the budget declares at least one line"
    },
    {
      "section": "structure_and_owners",
      "check": "every_line_has_named_owner",
      "status": "fail",
      "evidence": "quality gate: every line has an owner \u2014 lines without owners become orphaned spending"
    },
    {
      "section": "structure_and_owners",
      "check": "every_line_approach_is_stated_kind",
      "status": "pass",
      "evidence": "method step 3: every line states its approach, and each approach is one the skill names \u2014 zero-based for new/volatile areas, incremental for stable ones"
    },
    {
      "section": "drivers_and_totals",
      "check": "drivers_documented_for_every_line",
      "status": "pass",
      "evidence": "quality gate: drivers are documented for every line \u2014 built from drivers, not flat percentages"
    },
    {
      "section": "drivers_and_totals",
      "check": "line_amounts_match_driver_products",
      "status": "fail",
      "evidence": "method step 4: every line amount equals its declared driver quantity times its declared driver unit cost (headcount x rate, units x cost, usage x price)"
    },
    {
      "section": "drivers_and_totals",
      "check": "declared_total_matches_line_sum",
      "status": "pass",
      "evidence": "the declared total equals the sum of the declared line amounts \u2014 the total is re-derived, not trusted"
    },
    {
      "section": "revenue_and_contingency",
      "check": "revenue_linked_to_forecast",
      "status": "missing",
      "evidence": "method step 5: the revenue side is linked to forecasting \u2014 expected income, not hope"
    },
    {
      "section": "revenue_and_contingency",
      "check": "budget_balances_against_expected_income",
      "status": "fail",
      "evidence": "method step 5: the declared total does not exceed the declared expected income \u2014 the budget balances against expected income"
    },
    {
      "section": "revenue_and_contingency",
      "check": "contingency_explicit_line_present",
      "status": "missing",
      "evidence": "quality gate: contingency is explicit \u2014 a visible line, not buried in other lines"
    },
    {
      "section": "revenue_and_contingency",
      "check": "contingency_sized_to_identified_risks",
      "status": "missing",
      "evidence": "method step 6: the contingency line is sized to identified risks"
    },
    {
      "section": "revenue_and_contingency",
      "check": "no_hidden_padding",
      "status": "fail",
      "evidence": "red line: no hidden padding"
    },
    {
      "section": "approval_and_baseline",
      "check": "baseline_approved_and_locked",
      "status": "missing",
      "evidence": "method step 7: the baseline is approved and locked"
    },
    {
      "section": "approval_and_baseline",
      "check": "approval_thresholds_documented",
      "status": "missing",
      "evidence": "quality gate: approval thresholds are set and documented \u2014 who may approve money decisions, and up to what was decided (the threshold values themselves are the caller's, not checked)"
    },
    {
      "section": "approval_and_baseline",
      "check": "revisions_reapproved_not_drifted",
      "status": "missing",
      "evidence": "method step 7: revisions are re-approved, not drifted into the baseline"
    },
    {
      "section": "monitoring_and_close",
      "check": "monthly_variance_process_running",
      "status": "missing",
      "evidence": "quality gate: a monthly variance process is running \u2014 budget vs actual vs latest forecast, on a calendar, not a crisis"
    },
    {
      "section": "monitoring_and_close",
      "check": "variance_thresholds_trigger_written_explanations",
      "status": "missing",
      "evidence": "method step 8: variance thresholds trigger written explanations (the threshold values are the caller's \u2014 the skill states none, so none is checked)"
    },
    {
      "section": "monitoring_and_close",
      "check": "variance_actions_tracked",
      "status": "missing",
      "evidence": "quality gate: variance reviews produce actions, and the actions are tracked"
    },
    {
      "section": "monitoring_and_close",
      "check": "rolling_forecast_cadence_set",
      "status": "missing",
      "evidence": "quality gate: a rolling forecast cadence is set where volatility demands it"
    },
    {
      "section": "monitoring_and_close",
      "check": "rolling_forecast_covers_twelve_months",
      "status": "missing",
      "evidence": "method step 8: the rolling forecast covers the twelve months the skill states"
    },
    {
      "section": "monitoring_and_close",
      "check": "annual_true_up_done",
      "status": "missing",
      "evidence": "method step 9: an annual true-up closes the cycle"
    },
    {
      "section": "monitoring_and_close",
      "check": "carry_over_rules_decided",
      "status": "missing",
      "evidence": "method step 9: carry-over rules are decided, not improvised at year end"
    },
    {
      "section": "monitoring_and_close",
      "check": "lessons_carried_to_next_cycle",
      "status": "missing",
      "evidence": "method step 9: lessons from this cycle are carried to the next cycle"
    },
    {
      "section": "monitoring_and_close",
      "check": "no_silent_reallocations",
      "status": "missing",
      "evidence": "red line: no silent reallocations"
    },
    {
      "section": "monitoring_and_close",
      "check": "no_unannotated_actual_edits",
      "status": "missing",
      "evidence": "red line: actuals are never edited \u2014 corrections are annotated with date and reason"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "lines_evaluated": 1,
  "ownerless_line_indexes": [
    0
  ],
  "computed_total": "50.00",
  "total_difference": "0.00",
  "summary": "4 pass, 5 fail, 20 missing of 29 checks across six sections.",
  "stamp": "BUDGET DESIGN REVIEW\nbudget: None\nVERDICT: BUDGET_DESIGN_NOT_SOUND\n  scope                    fail\n  structure_and_owners     fail\n  drivers_and_totals       fail\n  revenue_and_contingency  fail\n  approval_and_baseline    insufficient_evidence\n  monitoring_and_close     insufficient_evidence\n4 pass, 5 fail, 20 missing of 29 checks across six sections."
}
```

### Example 3 — malformed

Recorded expectation: HTTP 422, no verdict (rejected as invalid input). Recorded REST status: 422.

Input:

```json
{
  "scope": "not_an_object",
  "lines": "should_be_a_list"
}
```

Response (REST `response_text`):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "scope",
  "detail": "scope must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes; Developers Yes; Ops Yes; Regulators: N/A — although the domain is finance, SERVICE.md scopes the atom to a completeness and consistency audit of a *declared* design and states it is explicitly not financial advice and not a judgment review; the verdict is advisory review evidence for the caller, not compliance or audit evidence for a regulator. |
| Checks named: documented / recorded | 29 / 29 (from the recorded full-pass REST `checks` array, cross-checked against SERVICE.md) |
| Verdict vocabulary complete | Yes — all 3 verdicts (`BUDGET_DESIGN_SOUND`, `BUDGET_DESIGN_NOT_SOUND`, `INSUFFICIENT_EVIDENCE`), `computed_status` values including null, section statuses and per-check statuses |
| Input reference typed | Yes — 33 fields, each with a type from SERVICE.md's field table, grouped as SERVICE.md groups them, gates/conditionals preserved in Notes |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed from this file and compared as JSON values against `verification/work/budget-design-review/evidence.json` after writing; all matched |
| Errors documented from evidence only | Yes — 422 shape verbatim from the recorded malformed case; 401/403/429 documented at the status/meaning level evidenced in USER-GUIDE.md and contract.yaml, with no invented payload |

