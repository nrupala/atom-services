# Frontend implementation — documentation

**Frontend implementation** · slug `frontend-implementation` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `project` "Alpha"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "frontend-implementation"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the frontend manifest.** You declare a record of a frontend already implemented — the atom audits the record, it does not do the implementation (see Explanation). The recorded full-pass manifest declares the project `Alpha`: semantic HTML first, small single-responsibility components, data down / events up, no god components (`god_components_present: false`), following the project's stack and styles, using design tokens; a new framework introduced with an ADR recorded; one data view, `UserList`, with loading, empty, error and success all implemented, the state matrix documented, buttons disabled while submitting, no dead controls and no silent failures (`dead_controls_present: false`, `silent_failures_present: false`); one small data-layer client per app with retries with backoff for transient errors, and the whole screen never blocked by a single widget (`whole_screen_blocked_by_single_widget_present: false`); fluid grids, wrap-safe text, stable dimensions, widths verified from 360px to desktop, no overflow and no overlap (`overflow_present: false`, `overlap_present: false`), fixed bars present with nothing hidden behind them; labels on all fields, logical focus order, aria-live for async results, and full keyboard operability; the performance budget defined before the build, below-the-fold content lazy-loaded, layout shift avoided, static assets cached, and the budget checked for bundle and first paint on a slow throttle; human-readable messages in the UI with details sent to logs not the UI, smoke tests for key flows, a keyboard-only pass of the primary journey, no console spam (`console_spam_present: false`), and no secrets in frontend code (`secrets_in_frontend_code_present: false`).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/frontend-implementation` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `FRONTEND_SOUND`: "39 pass, 0 fail, 0 missing of 39 checks across five sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `data_views_count` is 1, `data_views_without_complete_states` is `[]`, and `state_coverage` is `"1.000000"`.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `FRONTEND_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "frontend-implementation"}`.
3. Call: `POST https://atoms.pipavia.com/v1/frontend-implementation` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/frontend-implementation` with the `Authorization: Bearer <key>` header — the whole MCP surface on this gateway is key-gated, including `initialize` and `tools/list`.
2. Call `tools/call` with tool name `frontend_implementation`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `FRONTEND_NOT_SOUND` means at least one check has status `fail`: a field is present but false/invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 8 checks fail: `no_god_components`, `every_data_view_has_all_four_states`, `no_dead_controls`, `no_whole_screen_blocked_by_single_widget`, `no_overflow`, `no_overlap`, `no_console_spam`, `no_secrets_in_frontend_code`, and the summary reads "31 pass, 8 fail, 0 missing of 39 checks across five sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (in the recorded violations run, `data_views_without_complete_states` names the row `BrokenView`: a data view with `empty_implemented` declared `false`, so `state_coverage` is `"0.000000"` and `computed_status` is `outside_stated_limits_on_declared_evidence`; the other seven failures are anti-pattern fields declared `true` — `structure.god_components_present`, `interactions.dead_controls_present`, `data_layer.whole_screen_blocked_by_single_widget_present`, `responsive.overflow_present`, `responsive.overlap_present`, `errors.console_spam_present` and `security.secrets_in_frontend_code_present` — each corrected by declaring the implementation truthfully without that anti-pattern). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where a number, list, object or boolean is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "structure",
  "detail": "structure must be an object"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/frontend-implementation` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/frontend-implementation` — tool name `frontend_implementation`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `frontend_implementation` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `FRONTEND_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below exactly as SERVICE.md groups them — by the section that reads them. Note that a field's object prefix does not always match the section that reads it: `verification.state_matrix_documented` is read by `states_and_data_layer`, and `errors.console_spam_present` and `security.secrets_in_frontend_code_present` are read by `verification_and_red_lines`.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `project` | string | Carried into the verdict output, not itself checked |

#### Read by: structure_and_components

| Field | Type | Notes |
|---|---|---|
| `structure` | object | The structure section object — a present non-object value is rejected before evaluation (see the recorded 422) |
| `structure.semantic_html_first` | boolean | — |
| `structure.small_single_responsibility_components` | boolean | — |
| `structure.data_down_events_up` | boolean | — |
| `structure.god_components_present` | boolean | must be `false` to pass — skill rule |
| `structure.follows_project_stack_and_styles` | boolean | — |
| `structure.uses_design_tokens` | boolean | — |
| `framework` | object | The framework section object — a present non-object value is rejected before evaluation |
| `framework.new_framework_introduced` | boolean (gate) | gates the ADR check below |
| `framework.adr_recorded` | boolean | required when a new framework is declared introduced; otherwise the check passes as not applicable — see the discrepancy note under Checks for the gate-absent case |

#### Read by: states_and_data_layer

| Field | Type | Notes |
|---|---|---|
| `data_views` | list | list of data-view-row objects, each with the entry fields below; computed, see below |
| `data_views[]` | object | One declared data-view row — a present non-object entry is rejected before evaluation |
| `data_views[].name` | string | Names the row in the computed outputs |
| `data_views[].loading_implemented` | boolean | — |
| `data_views[].empty_implemented` | boolean | — |
| `data_views[].error_implemented` | boolean | — |
| `data_views[].success_implemented` | boolean | — |
| `verification` | object | The verification section object — a present non-object value is rejected before evaluation; also read by verification_and_red_lines below |
| `verification.state_matrix_documented` | boolean | — |
| `interactions` | object | The interactions section object — a present non-object value is rejected before evaluation |
| `interactions.buttons_disabled_while_submitting` | boolean | — |
| `interactions.dead_controls_present` | boolean | must be `false` to pass — skill rule |
| `interactions.silent_failures_present` | boolean | must be `false` to pass — skill red line |
| `data_layer` | object | The data-layer section object — a present non-object value is rejected before evaluation |
| `data_layer.single_small_client_per_app` | boolean | — |
| `data_layer.retries_with_backoff_for_transient_errors` | boolean | — |
| `data_layer.whole_screen_blocked_by_single_widget_present` | boolean | must be `false` to pass — skill rule |

#### Read by: responsive_and_accessibility

| Field | Type | Notes |
|---|---|---|
| `responsive` | object | The responsive section object — a present non-object value is rejected before evaluation |
| `responsive.fluid_grids_used` | boolean | — |
| `responsive.wrap_safe_text` | boolean | — |
| `responsive.stable_dimensions` | boolean | — |
| `responsive.widths_verified_360_to_desktop` | boolean | — |
| `responsive.overflow_present` | boolean | must be `false` to pass — skill rule |
| `responsive.overlap_present` | boolean | must be `false` to pass — skill rule |
| `responsive.has_fixed_bars` | boolean (gate) | gates the fixed-bars check below |
| `responsive.nothing_hidden_behind_fixed_bars` | boolean | required when fixed bars are declared present; otherwise the check passes as not applicable — see the discrepancy note under Checks for the gate-absent case |
| `accessibility` | object | The accessibility section object — a present non-object value is rejected before evaluation |
| `accessibility.labels_on_all_fields` | boolean | — |
| `accessibility.logical_focus_order` | boolean | — |
| `accessibility.aria_live_for_async_results` | boolean | — |
| `accessibility.fully_keyboard_operable` | boolean | — |

#### Read by: performance_and_errors

| Field | Type | Notes |
|---|---|---|
| `performance` | object | The performance section object — a present non-object value is rejected before evaluation |
| `performance.budget_defined_before_build` | boolean | — |
| `performance.lazy_load_below_fold` | boolean | — |
| `performance.layout_shift_avoided` | boolean | — |
| `performance.static_assets_cached` | boolean | — |
| `performance.budget_checked_bundle_and_first_paint` | boolean | — |
| `performance.budget_checked_on_slow_throttle` | boolean | — |
| `errors` | object | The errors section object — a present non-object value is rejected before evaluation; also read by verification_and_red_lines below |
| `errors.human_readable_messages_in_ui` | boolean | read by the check `human_readable_error_messages_in_ui` |
| `errors.details_sent_to_logs_not_ui` | boolean | read by the check `error_details_to_logs_not_ui` |

#### Read by: verification_and_red_lines

| Field | Type | Notes |
|---|---|---|
| `verification.smoke_tests_for_key_flows` | boolean | the `verification` object is listed under states_and_data_layer above |
| `verification.keyboard_only_primary_journey_passed` | boolean | — |
| `errors.console_spam_present` | boolean | must be `false` to pass — skill red line; the `errors` object is listed under performance_and_errors above |
| `security` | object | The security section object — a present non-object value is rejected before evaluation |
| `security.secrets_in_frontend_code_present` | boolean | must be `false` to pass — skill red line |

### Checks

All 39 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only: a conditional (gated) check whose gate is declared `false` reports `pass` with evidence stating the gate was not declared — that is the not-applicable outcome. Section and verdict aggregation are defined under Verdict vocabulary.

Discrepancy note (recorded response governs): SERVICE.md describes the two conditional checks as passing as not applicable when the gate situation is not declared. The recorded sparse run refines that: when the gate field itself is **absent** (`framework.new_framework_introduced` or `responsive.has_fixed_bars` not declared at all), the check reports `missing`, not `pass`, with evidence "no new framework introduced" / "no fixed bars declared" respectively. The `pass`-as-not-applicable outcome occurs when the gate field is present and declared `false`. This document follows the recorded behaviour.

#### Section: structure_and_components

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `semantic_html_first` | structure: semantic HTML comes first | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `small_single_responsibility_components` | structure: components are small with single responsibilities | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `data_down_events_up` | structure: data flows down, events flow up | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_god_components` | structure: no god components | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `follows_project_stack_and_styles` | structure: the implementation follows the project's stack and styles | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `uses_design_tokens` | artifacts: components and styles use design tokens | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `new_framework_has_adr` | structure: the new framework is covered by an ADR | Conditional on `framework.new_framework_introduced`. Pass: the gate is declared `true` and `framework.adr_recorded` is declared `true` — or the gate is declared `false`, in which case the check passes as not applicable and its evidence reads "no new framework introduced". Fail: the gate is declared `true` and `adr_recorded` is declared `false`. Missing: the gate is declared `true` and `adr_recorded` is absent — or the gate field itself is absent (the recorded sparse run reports this check `missing` with evidence "no new framework introduced"). |

#### Section: states_and_data_layer

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `data_views_declared` | states always: the declared record names its data views — the data_views list is present and non-empty | Computed over the declared record. Pass: the `data_views` list is present and non-empty. Fail: the list is present but empty. Missing: the list is absent. |
| `every_data_view_has_all_four_states` | quality gate: every declared data view declares loading, empty, error and success implemented | Computed over the declared record. Pass: every declared data-view row declares all four state fields `true`. Fail: every row declares all four state fields present, but at least one is not `true` (offending rows are named in `data_views_without_complete_states`). Missing: the list is absent, or a declared row has a state field absent (such a row is missing evidence and does not appear in `data_views_without_complete_states`). |
| `state_matrix_documented` | artifacts: the implemented state matrix is documented | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `buttons_disabled_while_submitting` | states always: buttons are disabled while submitting | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_dead_controls` | states always: no dead controls | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_silent_failures` | red line: no "nothing happened" failures | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `single_small_client_per_app` | data layer: fetching goes through one small client per app | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `retries_with_backoff_for_transient_errors` | data layer: transient errors are retried with backoff | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_whole_screen_blocked_by_single_widget` | data layer: the whole screen is never blocked for one widget | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

#### Section: responsive_and_accessibility

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `fluid_grids_used` | responsive: fluid grids are used | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `wrap_safe_text` | responsive: text is wrap-safe | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `stable_dimensions` | responsive: dimensions are stable | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `widths_verified_360_to_desktop` | responsive / quality gate: widths are verified from 360px to desktop | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_overflow` | responsive: no overflow at the verified widths | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_overlap` | responsive: no overlap at the verified widths | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `nothing_hidden_behind_fixed_bars` | responsive: nothing is hidden behind fixed bars | Conditional on `responsive.has_fixed_bars`. Pass: the gate is declared `true` and `responsive.nothing_hidden_behind_fixed_bars` is declared `true` — or the gate is declared `false`, in which case the check passes as not applicable and its evidence reads "no fixed bars declared". Fail: the gate is declared `true` and `nothing_hidden_behind_fixed_bars` is declared `false`. Missing: the gate is declared `true` and `nothing_hidden_behind_fixed_bars` is absent — or the gate field itself is absent (the recorded sparse run reports this check `missing` with evidence "no fixed bars declared"). |
| `labels_on_all_fields` | accessibility: all fields have labels | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `logical_focus_order` | accessibility: focus order is logical | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `aria_live_for_async_results` | accessibility: async results use aria-live | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `fully_keyboard_operable` | accessibility: the interface is fully keyboard operable | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: performance_and_errors

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `budget_defined_before_build` | performance: the budget is defined first — bundle size and first paint | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `lazy_load_below_fold` | performance: below-the-fold content is lazy-loaded | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `layout_shift_avoided` | performance: layout shift is avoided | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `static_assets_cached` | performance: static assets are cached | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `budget_checked_bundle_and_first_paint` | quality gate: the performance budget is checked — bundle and first paint | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `budget_checked_on_slow_throttle` | quality gate: the budget check runs on a slow throttle | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `human_readable_error_messages_in_ui` | errors are UI: messages in the interface are human-readable | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `error_details_to_logs_not_ui` | errors are UI: details go to logs/telemetry, not into the user's face | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: verification_and_red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `smoke_tests_for_key_flows` | artifacts: smoke/tests cover the key flows | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `keyboard_only_primary_journey_passed` | quality gate: a keyboard-only pass of the primary journey is completed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_console_spam` | red line: no console spam | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_secrets_in_frontend_code` | red line: no secrets or keys in frontend code — ever | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"frontend-implementation"`), `atom_version` (`"0.1.0"`), and `project` (the manifest's declared project value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `data_views_count` (the declared list length as an integer, or null when the list is not declared); the row-name list `data_views_without_complete_states` (data views whose four state fields are all present but not all true; a view with a state field absent is missing evidence and does not appear; null when the list is not declared); and the ratio `state_coverage` (data views declaring all four states implemented ÷ declared data views) — a string with exactly six decimal places; a ratio is null when its denominator list is absent or empty. Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "39 pass, 0 fail, 0 missing of 39 checks across five sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared project value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `FRONTEND_SOUND` — all 39 checks pass: the declared frontend record is complete and consistent with the bound skill's checklist and red lines.
- `FRONTEND_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one primary computed check cannot be completed because the rows or fields it reads are absent. The two primary computed checks are `data_views_declared` and `every_data_view_has_all_four_states`.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes (including gated checks passing as not applicable); `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence (for gated checks: met, or the gate was declared `false` — not applicable); `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent (for gated checks, this includes the gate field itself being absent).

### Errors

Error bodies are the gateway's recorded shapes (`rails/gateway/src/callpath.ts`); a failed call is not metered.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | No key, or the key does not verify. On the MCP face the body is `{"error": "missing or invalid gateway API key"}`. |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the frontend_implementation scope; issue it for this atom first"}` | The key is valid but does not hold this atom's scope. Issue the key for this atom (see How-to) and retry. On the MCP face the body is `{"error": "this key does not hold the frontend_implementation scope"}`. |
| 422 | `{"ok":false,"error":"invalid_input","field":"structure","detail":"structure must be an object"}` (this atom's recorded malformed run; the shape is `{"ok": false, "error": "invalid_input", "field": "<field>", "detail": "<field> must be a <type>"}`) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. Via MCP `tools/call`, the same failure surfaces as a JSON-RPC error with code `-32602` carrying the detail message. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for frontend-implementation exceeded"}` (or the `10000/day` variant) | Per-key rate limit exceeded for this atom; the call is not metered. Via MCP `tools/call` it surfaces as a JSON-RPC error with code `-32029`. |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Implement frontend with production standards — components, state, data fetching, responsive layouts, accessibility, performance (the bound capability, from the `frontend-engineering` skill). You submit one declared record — the frontend manifest — and the atom audits that record for completeness and internal consistency against the bound skill's checklist, quality gates and red lines, returning one deterministic verdict across 5 sections (`structure_and_components`, `states_and_data_layer`, `responsive_and_accessibility`, `performance_and_errors`, `verification_and_red_lines`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — the declared `data_views` list must be present and non-empty, and every declared data-view row must declare `loading_implemented`, `empty_implemented`, `error_implemented` and `success_implemented` all `true` — using only the declared record, with no outside threshold imported. *Conditional checks* bind only when their declared gate field says the situation applies — an ADR is required only when `framework.new_framework_introduced` is declared `true`, and `nothing_hidden_behind_fixed_bars` is required only when `responsive.has_fixed_bars` is declared `true`; when the gate is declared `false` they pass as not applicable, and when the gate field itself is absent they report `missing` (see the discrepancy note under Checks). Aggregation is strict: any `fail` anywhere produces `FRONTEND_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `FRONTEND_SOUND`. The central semantic is the absent/false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented: a WCAG contrast ratio or conformance level (the skill requires labels, logical focus order, `aria-live` and full keyboard operability but states no ratio and no level — caller attestation only); a bundle-size budget in kilobytes or bytes (the skill says "budget first (bundle size, first paint)" but states no number — caller attestation only); a first-paint or load timing budget in milliseconds; a layout-shift (CLS) score; a slow-throttle speed (the skill says "on slow throttle" but states no rate — caller attestation only); a retry count or backoff delay (the skill says "retries with backoff" but states no count or delay); a component-size line count for "small" components or "god components" (the skill's structure rules are qualitative — caller declarations only, never judged); a state-coverage percentage below completeness; and a framework vocabulary (no list of permitted or forbidden frameworks is imposed — only the ADR gate the skill itself states). Quantities are computed and reported; the only bar on the computed rows is completeness over the caller's own declared rows.

**What it does NOT do.** The atom audits a **declared** frontend implementation record: a verdict of `FRONTEND_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a manifest that declares all four states on every view, a checked performance budget, and no secrets in frontend code passes those checks even if the real interface does none of it. It is a completeness and consistency audit of the record the skill requires, **not a frontend engineering service or a live quality certification**. Specifically: it writes and runs no frontend code, renders no page, measures no real bundle, paint or layout shift, and does not verify that a declared control actually works. It never judges visual quality or taste, whether a component split is genuinely well-judged, whether error copy is genuinely readable, or whether a real user's journey is genuinely usable — only that the record contains what the skill's sections and red lines demand, and that its declared rows are internally consistent. Named exclusions: no numeric thresholds beyond the skill's own stated rules (see the declined list above); no live verification of any declared fact; no code or repository inspection (secrets in frontend code are caller declarations, the atom reads no code); no accessibility conformance certification — labels, focus order, `aria-live` and keyboard operability are declared, never tested against a WCAG level the skill does not state; visual quality and taste are non-reducible and caller declarations only, never judged; the skill's cross-references to sibling disciplines (`ux-ui-design` for specs, `multi-surface-webapp` for the app blueprint, `testing-strategy` for verification depth) are carried as the caller's own attestations in this record, not re-audited here.

**Buyer and use context.** Teams and agents working in Engineering & code who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Content site and product UI builds (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulator view: N/A — this atom audits a declared frontend implementation record in an unregulated engineering domain; its verdict is a completeness and consistency judgment on the declared evidence, not compliance or audit evidence in a regulated domain and not a live quality certification (SERVICE.md states this explicitly). No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `frontend_implementation` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/frontend_implementation.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_frontend_implementation.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/frontend-implementation` (REST) and `POST /mcp/frontend-implementation` (MCP, tool `frontend_implementation`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification. Key scope: `frontend_implementation`. Rate limits: 60/minute, 10,000/day per key per atom (429 `rate_limit`, not metered). Error monitoring: watch 401 `unauthorized` (key problems), 403 `scope_required` (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live — release candidate, one-week RC soak to 2026-11-22; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Worked examples

Provenance: recorded 2026-11-16T05:39:50.650757+00:00 against gateway v1.1.0, external verification lane, source `verification/work/frontend-implementation/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Input:

```json
{
  "project": "Alpha",
  "data_views": [
    {
      "name": "UserList",
      "loading_implemented": true,
      "empty_implemented": true,
      "error_implemented": true,
      "success_implemented": true
    }
  ],
  "interactions": {
    "buttons_disabled_while_submitting": true,
    "dead_controls_present": false,
    "silent_failures_present": false
  },
  "data_layer": {
    "single_small_client_per_app": true,
    "retries_with_backoff_for_transient_errors": true,
    "whole_screen_blocked_by_single_widget_present": false
  },
  "responsive": {
    "fluid_grids_used": true,
    "wrap_safe_text": true,
    "stable_dimensions": true,
    "widths_verified_360_to_desktop": true,
    "overflow_present": false,
    "overlap_present": false,
    "has_fixed_bars": true,
    "nothing_hidden_behind_fixed_bars": true
  },
  "accessibility": {
    "labels_on_all_fields": true,
    "logical_focus_order": true,
    "aria_live_for_async_results": true,
    "fully_keyboard_operable": true
  },
  "performance": {
    "budget_defined_before_build": true,
    "lazy_load_below_fold": true,
    "layout_shift_avoided": true,
    "static_assets_cached": true,
    "budget_checked_bundle_and_first_paint": true,
    "budget_checked_on_slow_throttle": true
  },
  "errors": {
    "human_readable_messages_in_ui": true,
    "details_sent_to_logs_not_ui": true,
    "console_spam_present": false
  },
  "verification": {
    "state_matrix_documented": true,
    "smoke_tests_for_key_flows": true,
    "keyboard_only_primary_journey_passed": true
  },
  "security": {
    "secrets_in_frontend_code_present": false
  },
  "structure": {
    "semantic_html_first": true,
    "small_single_responsibility_components": true,
    "data_down_events_up": true,
    "god_components_present": false,
    "follows_project_stack_and_styles": true,
    "uses_design_tokens": true
  },
  "framework": {
    "new_framework_introduced": true,
    "adr_recorded": true
  }
}
```

Response (HTTP 200):

```json
{
  "service": "frontend-implementation",
  "atom_version": "0.1.0",
  "project": "Alpha",
  "verdict": "FRONTEND_SOUND",
  "sections": {
    "structure_and_components": "pass",
    "states_and_data_layer": "pass",
    "responsive_and_accessibility": "pass",
    "performance_and_errors": "pass",
    "verification_and_red_lines": "pass"
  },
  "checks": [
    {
      "section": "structure_and_components",
      "check": "semantic_html_first",
      "status": "pass",
      "evidence": "structure: semantic HTML comes first"
    },
    {
      "section": "structure_and_components",
      "check": "small_single_responsibility_components",
      "status": "pass",
      "evidence": "structure: components are small with single responsibilities"
    },
    {
      "section": "structure_and_components",
      "check": "data_down_events_up",
      "status": "pass",
      "evidence": "structure: data flows down, events flow up"
    },
    {
      "section": "structure_and_components",
      "check": "no_god_components",
      "status": "pass",
      "evidence": "structure: no god components"
    },
    {
      "section": "structure_and_components",
      "check": "follows_project_stack_and_styles",
      "status": "pass",
      "evidence": "structure: the implementation follows the project's stack and styles"
    },
    {
      "section": "structure_and_components",
      "check": "uses_design_tokens",
      "status": "pass",
      "evidence": "artifacts: components and styles use design tokens"
    },
    {
      "section": "structure_and_components",
      "check": "new_framework_has_adr",
      "status": "pass",
      "evidence": "structure: the new framework is covered by an ADR"
    },
    {
      "section": "states_and_data_layer",
      "check": "data_views_declared",
      "status": "pass",
      "evidence": "states always: the declared record names its data views \u2014 the data_views list is present and non-empty"
    },
    {
      "section": "states_and_data_layer",
      "check": "every_data_view_has_all_four_states",
      "status": "pass",
      "evidence": "quality gate: every declared data view declares loading, empty, error and success implemented"
    },
    {
      "section": "states_and_data_layer",
      "check": "state_matrix_documented",
      "status": "pass",
      "evidence": "artifacts: the implemented state matrix is documented"
    },
    {
      "section": "states_and_data_layer",
      "check": "buttons_disabled_while_submitting",
      "status": "pass",
      "evidence": "states always: buttons are disabled while submitting"
    },
    {
      "section": "states_and_data_layer",
      "check": "no_dead_controls",
      "status": "pass",
      "evidence": "states always: no dead controls"
    },
    {
      "section": "states_and_data_layer",
      "check": "no_silent_failures",
      "status": "pass",
      "evidence": "red line: no \"nothing happened\" failures"
    },
    {
      "section": "states_and_data_layer",
      "check": "single_small_client_per_app",
      "status": "pass",
      "evidence": "data layer: fetching goes through one small client per app"
    },
    {
      "section": "states_and_data_layer",
      "check": "retries_with_backoff_for_transient_errors",
      "status": "pass",
      "evidence": "data layer: transient errors are retried with backoff"
    },
    {
      "section": "states_and_data_layer",
      "check": "no_whole_screen_blocked_by_single_widget",
      "status": "pass",
      "evidence": "data layer: the whole screen is never blocked for one widget"
    },
    {
      "section": "responsive_and_accessibility",
      "check": "fluid_grids_used",
      "status": "pass",
      "evidence": "responsive: fluid grids are used"
    },
    {
      "section": "responsive_and_accessibility",
      "check": "wrap_safe_text",
      "status": "pass",
      "evidence": "responsive: text is wrap-safe"
    },
    {
      "section": "responsive_and_accessibility",
      "check": "stable_dimensions",
      "status": "pass",
      "evidence": "responsive: dimensions are stable"
    },
    {
      "section": "responsive_and_accessibility",
      "check": "widths_verified_360_to_desktop",
      "status": "pass",
      "evidence": "responsive / quality gate: widths are verified from 360px to desktop"
    },
    {
      "section": "responsive_and_accessibility",
      "check": "no_overflow",
      "status": "pass",
      "evidence": "responsive: no overflow at the verified widths"
    },
    {
      "section": "responsive_and_accessibility",
      "check": "no_overlap",
      "status": "pass",
      "evidence": "responsive: no overlap at the verified widths"
    },
    {
      "section": "responsive_and_accessibility",
      "check": "nothing_hidden_behind_fixed_bars",
      "status": "pass",
      "evidence": "responsive: nothing is hidden behind fixed bars"
    },
    {
      "section": "responsive_and_accessibility",
      "check": "labels_on_all_fields",
      "status": "pass",
      "evidence": "accessibility: all fields have labels"
    },
    {
      "section": "responsive_and_accessibility",
      "check": "logical_focus_order",
      "status": "pass",
      "evidence": "accessibility: focus order is logical"
    },
    {
      "section": "responsive_and_accessibility",
      "check": "aria_live_for_async_results",
      "status": "pass",
      "evidence": "accessibility: async results use aria-live"
    },
    {
      "section": "responsive_and_accessibility",
      "check": "fully_keyboard_operable",
      "status": "pass",
      "evidence": "accessibility: the interface is fully keyboard operable"
    },
    {
      "section": "performance_and_errors",
      "check": "budget_defined_before_build",
      "status": "pass",
      "evidence": "performance: the budget is defined first \u2014 bundle size and first paint"
    },
    {
      "section": "performance_and_errors",
      "check": "lazy_load_below_fold",
      "status": "pass",
      "evidence": "performance: below-the-fold content is lazy-loaded"
    },
    {
      "section": "performance_and_errors",
      "check": "layout_shift_avoided",
      "status": "pass",
      "evidence": "performance: layout shift is avoided"
    },
    {
      "section": "performance_and_errors",
      "check": "static_assets_cached",
      "status": "pass",
      "evidence": "performance: static assets are cached"
    },
    {
      "section": "performance_and_errors",
      "check": "budget_checked_bundle_and_first_paint",
      "status": "pass",
      "evidence": "quality gate: the performance budget is checked \u2014 bundle and first paint"
    },
    {
      "section": "performance_and_errors",
      "check": "budget_checked_on_slow_throttle",
      "status": "pass",
      "evidence": "quality gate: the budget check runs on a slow throttle"
    },
    {
      "section": "performance_and_errors",
      "check": "human_readable_error_messages_in_ui",
      "status": "pass",
      "evidence": "errors are UI: messages in the interface are human-readable"
    },
    {
      "section": "performance_and_errors",
      "check": "error_details_to_logs_not_ui",
      "status": "pass",
      "evidence": "errors are UI: details go to logs/telemetry, not into the user's face"
    },
    {
      "section": "verification_and_red_lines",
      "check": "smoke_tests_for_key_flows",
      "status": "pass",
      "evidence": "artifacts: smoke/tests cover the key flows"
    },
    {
      "section": "verification_and_red_lines",
      "check": "keyboard_only_primary_journey_passed",
      "status": "pass",
      "evidence": "quality gate: a keyboard-only pass of the primary journey is completed"
    },
    {
      "section": "verification_and_red_lines",
      "check": "no_console_spam",
      "status": "pass",
      "evidence": "red line: no console spam"
    },
    {
      "section": "verification_and_red_lines",
      "check": "no_secrets_in_frontend_code",
      "status": "pass",
      "evidence": "red line: no secrets or keys in frontend code \u2014 ever"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "data_views_count": 1,
  "data_views_without_complete_states": [],
  "state_coverage": "1.000000",
  "summary": "39 pass, 0 fail, 0 missing of 39 checks across five sections.",
  "stamp": "FRONTEND IMPLEMENTATION\nproject: Alpha\nVERDICT: FRONTEND_SOUND\n  structure_and_components             pass\n  states_and_data_layer                pass\n  responsive_and_accessibility         pass\n  performance_and_errors               pass\n  verification_and_red_lines           pass\n39 pass, 0 fail, 0 missing of 39 checks across five sections."
}
```

### Example 2 — Violations (case `violations`)

Input:

```json
{
  "project": "Alpha",
  "data_views": [
    {
      "name": "BrokenView",
      "loading_implemented": true,
      "empty_implemented": false,
      "error_implemented": true,
      "success_implemented": true
    }
  ],
  "interactions": {
    "buttons_disabled_while_submitting": true,
    "dead_controls_present": true,
    "silent_failures_present": false
  },
  "data_layer": {
    "single_small_client_per_app": true,
    "retries_with_backoff_for_transient_errors": true,
    "whole_screen_blocked_by_single_widget_present": true
  },
  "responsive": {
    "fluid_grids_used": true,
    "wrap_safe_text": true,
    "stable_dimensions": true,
    "widths_verified_360_to_desktop": true,
    "overflow_present": true,
    "overlap_present": true,
    "has_fixed_bars": true,
    "nothing_hidden_behind_fixed_bars": true
  },
  "accessibility": {
    "labels_on_all_fields": true,
    "logical_focus_order": true,
    "aria_live_for_async_results": true,
    "fully_keyboard_operable": true
  },
  "performance": {
    "budget_defined_before_build": true,
    "lazy_load_below_fold": true,
    "layout_shift_avoided": true,
    "static_assets_cached": true,
    "budget_checked_bundle_and_first_paint": true,
    "budget_checked_on_slow_throttle": true
  },
  "errors": {
    "human_readable_messages_in_ui": true,
    "details_sent_to_logs_not_ui": true,
    "console_spam_present": true
  },
  "verification": {
    "state_matrix_documented": true,
    "smoke_tests_for_key_flows": true,
    "keyboard_only_primary_journey_passed": true
  },
  "security": {
    "secrets_in_frontend_code_present": true
  },
  "structure": {
    "semantic_html_first": true,
    "small_single_responsibility_components": true,
    "data_down_events_up": true,
    "god_components_present": true,
    "follows_project_stack_and_styles": true,
    "uses_design_tokens": true
  },
  "framework": {
    "new_framework_introduced": true,
    "adr_recorded": true
  }
}
```

Response (HTTP 200):

```json
{
  "service": "frontend-implementation",
  "atom_version": "0.1.0",
  "project": "Alpha",
  "verdict": "FRONTEND_NOT_SOUND",
  "sections": {
    "structure_and_components": "fail",
    "states_and_data_layer": "fail",
    "responsive_and_accessibility": "fail",
    "performance_and_errors": "pass",
    "verification_and_red_lines": "fail"
  },
  "checks": [
    {
      "section": "structure_and_components",
      "check": "semantic_html_first",
      "status": "pass",
      "evidence": "structure: semantic HTML comes first"
    },
    {
      "section": "structure_and_components",
      "check": "small_single_responsibility_components",
      "status": "pass",
      "evidence": "structure: components are small with single responsibilities"
    },
    {
      "section": "structure_and_components",
      "check": "data_down_events_up",
      "status": "pass",
      "evidence": "structure: data flows down, events flow up"
    },
    {
      "section": "structure_and_components",
      "check": "no_god_components",
      "status": "fail",
      "evidence": "structure: no god components"
    },
    {
      "section": "structure_and_components",
      "check": "follows_project_stack_and_styles",
      "status": "pass",
      "evidence": "structure: the implementation follows the project's stack and styles"
    },
    {
      "section": "structure_and_components",
      "check": "uses_design_tokens",
      "status": "pass",
      "evidence": "artifacts: components and styles use design tokens"
    },
    {
      "section": "structure_and_components",
      "check": "new_framework_has_adr",
      "status": "pass",
      "evidence": "structure: the new framework is covered by an ADR"
    },
    {
      "section": "states_and_data_layer",
      "check": "data_views_declared",
      "status": "pass",
      "evidence": "states always: the declared record names its data views \u2014 the data_views list is present and non-empty"
    },
    {
      "section": "states_and_data_layer",
      "check": "every_data_view_has_all_four_states",
      "status": "fail",
      "evidence": "quality gate: every declared data view declares loading, empty, error and success implemented"
    },
    {
      "section": "states_and_data_layer",
      "check": "state_matrix_documented",
      "status": "pass",
      "evidence": "artifacts: the implemented state matrix is documented"
    },
    {
      "section": "states_and_data_layer",
      "check": "buttons_disabled_while_submitting",
      "status": "pass",
      "evidence": "states always: buttons are disabled while submitting"
    },
    {
      "section": "states_and_data_layer",
      "check": "no_dead_controls",
      "status": "fail",
      "evidence": "states always: no dead controls"
    },
    {
      "section": "states_and_data_layer",
      "check": "no_silent_failures",
      "status": "pass",
      "evidence": "red line: no \"nothing happened\" failures"
    },
    {
      "section": "states_and_data_layer",
      "check": "single_small_client_per_app",
      "status": "pass",
      "evidence": "data layer: fetching goes through one small client per app"
    },
    {
      "section": "states_and_data_layer",
      "check": "retries_with_backoff_for_transient_errors",
      "status": "pass",
      "evidence": "data layer: transient errors are retried with backoff"
    },
    {
      "section": "states_and_data_layer",
      "check": "no_whole_screen_blocked_by_single_widget",
      "status": "fail",
      "evidence": "data layer: the whole screen is never blocked for one widget"
    },
    {
      "section": "responsive_and_accessibility",
      "check": "fluid_grids_used",
      "status": "pass",
      "evidence": "responsive: fluid grids are used"
    },
    {
      "section": "responsive_and_accessibility",
      "check": "wrap_safe_text",
      "status": "pass",
      "evidence": "responsive: text is wrap-safe"
    },
    {
      "section": "responsive_and_accessibility",
      "check": "stable_dimensions",
      "status": "pass",
      "evidence": "responsive: dimensions are stable"
    },
    {
      "section": "responsive_and_accessibility",
      "check": "widths_verified_360_to_desktop",
      "status": "pass",
      "evidence": "responsive / quality gate: widths are verified from 360px to desktop"
    },
    {
      "section": "responsive_and_accessibility",
      "check": "no_overflow",
      "status": "fail",
      "evidence": "responsive: no overflow at the verified widths"
    },
    {
      "section": "responsive_and_accessibility",
      "check": "no_overlap",
      "status": "fail",
      "evidence": "responsive: no overlap at the verified widths"
    },
    {
      "section": "responsive_and_accessibility",
      "check": "nothing_hidden_behind_fixed_bars",
      "status": "pass",
      "evidence": "responsive: nothing is hidden behind fixed bars"
    },
    {
      "section": "responsive_and_accessibility",
      "check": "labels_on_all_fields",
      "status": "pass",
      "evidence": "accessibility: all fields have labels"
    },
    {
      "section": "responsive_and_accessibility",
      "check": "logical_focus_order",
      "status": "pass",
      "evidence": "accessibility: focus order is logical"
    },
    {
      "section": "responsive_and_accessibility",
      "check": "aria_live_for_async_results",
      "status": "pass",
      "evidence": "accessibility: async results use aria-live"
    },
    {
      "section": "responsive_and_accessibility",
      "check": "fully_keyboard_operable",
      "status": "pass",
      "evidence": "accessibility: the interface is fully keyboard operable"
    },
    {
      "section": "performance_and_errors",
      "check": "budget_defined_before_build",
      "status": "pass",
      "evidence": "performance: the budget is defined first \u2014 bundle size and first paint"
    },
    {
      "section": "performance_and_errors",
      "check": "lazy_load_below_fold",
      "status": "pass",
      "evidence": "performance: below-the-fold content is lazy-loaded"
    },
    {
      "section": "performance_and_errors",
      "check": "layout_shift_avoided",
      "status": "pass",
      "evidence": "performance: layout shift is avoided"
    },
    {
      "section": "performance_and_errors",
      "check": "static_assets_cached",
      "status": "pass",
      "evidence": "performance: static assets are cached"
    },
    {
      "section": "performance_and_errors",
      "check": "budget_checked_bundle_and_first_paint",
      "status": "pass",
      "evidence": "quality gate: the performance budget is checked \u2014 bundle and first paint"
    },
    {
      "section": "performance_and_errors",
      "check": "budget_checked_on_slow_throttle",
      "status": "pass",
      "evidence": "quality gate: the budget check runs on a slow throttle"
    },
    {
      "section": "performance_and_errors",
      "check": "human_readable_error_messages_in_ui",
      "status": "pass",
      "evidence": "errors are UI: messages in the interface are human-readable"
    },
    {
      "section": "performance_and_errors",
      "check": "error_details_to_logs_not_ui",
      "status": "pass",
      "evidence": "errors are UI: details go to logs/telemetry, not into the user's face"
    },
    {
      "section": "verification_and_red_lines",
      "check": "smoke_tests_for_key_flows",
      "status": "pass",
      "evidence": "artifacts: smoke/tests cover the key flows"
    },
    {
      "section": "verification_and_red_lines",
      "check": "keyboard_only_primary_journey_passed",
      "status": "pass",
      "evidence": "quality gate: a keyboard-only pass of the primary journey is completed"
    },
    {
      "section": "verification_and_red_lines",
      "check": "no_console_spam",
      "status": "fail",
      "evidence": "red line: no console spam"
    },
    {
      "section": "verification_and_red_lines",
      "check": "no_secrets_in_frontend_code",
      "status": "fail",
      "evidence": "red line: no secrets or keys in frontend code \u2014 ever"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "data_views_count": 1,
  "data_views_without_complete_states": [
    "BrokenView"
  ],
  "state_coverage": "0.000000",
  "summary": "31 pass, 8 fail, 0 missing of 39 checks across five sections.",
  "stamp": "FRONTEND IMPLEMENTATION\nproject: Alpha\nVERDICT: FRONTEND_NOT_SOUND\n  structure_and_components             fail\n  states_and_data_layer                fail\n  responsive_and_accessibility         fail\n  performance_and_errors               pass\n  verification_and_red_lines           fail\n31 pass, 8 fail, 0 missing of 39 checks across five sections."
}
```

### Example 3 — Malformed (case `malformed`)

Input:

```json
{
  "project": "Delta",
  "structure": "not-an-object"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "structure",
  "detail": "structure must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — N/A — this atom audits a declared frontend implementation record in an unregulated engineering domain; its verdict is a completeness and consistency judgment, not compliance or audit evidence in a regulated domain and not a live quality certification. |
| Checks named | 39 documented / 39 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses (not-applicable expressed as a gated `pass` when the gate is declared `false`) |
| Input reference typed | Yes — 57 fields, each with its type from SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/frontend-implementation/evidence.json` |
