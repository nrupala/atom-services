# Frontend implementation — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have built a frontend — components, state, data fetching, responsive layouts, accessibility, performance — and you have a record of how it was implemented. This atom reads one declared manifest and returns one deterministic verdict across five sections: **FRONTEND_SOUND**, **FRONTEND_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared record's completeness and consistency only — it writes and runs no frontend code, renders no page, measures no real bundle, paint or layout shift, and does not verify that a declared control actually works. A frontend is sound *on your declared evidence*: it never judges visual quality or taste, whether a component split is genuinely well-judged, whether error copy is genuinely readable, or whether a real user's journey is genuinely usable. Computed checks: the declared `data_views` list must be present and non-empty, and every declared data-view row must declare `loading_implemented`, `empty_implemented`, `error_implemented` and `success_implemented` all `true`. Two checks are conditional: an ADR is required only when `framework.new_framework_introduced` is declared `true`, and `nothing_hidden_behind_fixed_bars` is required only when `responsive.has_fixed_bars` is declared `true`; otherwise each passes as not applicable. No numeric threshold is imposed — no WCAG contrast ratio or conformance level, no bundle-size budget, no first-paint or load timing, no layout-shift (CLS) score, no slow-throttle speed, no retry count or backoff delay, no component-size line count, and no state-coverage percentage below completeness. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "frontend-implementation"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/frontend-implementation` — tool name `frontend_implementation`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/frontend-implementation` — body = the manifest object; same `Authorization` header.

## Input — the frontend-implementation manifest

| Field | Meaning |
|---|---|
| `project` | project name (string; carried into the output, not checked) |
| `structure.semantic_html_first` | structure evidence: semantic HTML comes first |
| `structure.small_single_responsibility_components` | structure evidence: components are small with single responsibilities |
| `structure.data_down_events_up` | structure evidence: data flows down, events flow up |
| `structure.god_components_present` | must be `false` to pass (skill rule: no god components) |
| `structure.follows_project_stack_and_styles` | structure evidence: the implementation follows the project's stack and styles |
| `structure.uses_design_tokens` | structure evidence: components and styles use design tokens |
| `framework.new_framework_introduced` | gate: declares whether a new framework was introduced |
| `framework.adr_recorded` | required `true` only when `framework.new_framework_introduced` is `true`; otherwise passes as not applicable |
| `data_views` (list of data-view-row objects) | computed: must be present and non-empty; reported as `data_views_count` |
| `data_views[].name` (string) | names the row in the computed outputs |
| `data_views[].loading_implemented` | computed: every row must declare `true`; part of the four-state completeness check |
| `data_views[].empty_implemented` | computed: every row must declare `true` |
| `data_views[].error_implemented` | computed: every row must declare `true` |
| `data_views[].success_implemented` | computed: every row must declare `true` |
| `verification.state_matrix_documented` | states evidence: the implemented state matrix is documented |
| `interactions.buttons_disabled_while_submitting` | states evidence: buttons are disabled while submitting |
| `interactions.dead_controls_present` | must be `false` to pass (skill rule: no dead controls) |
| `interactions.silent_failures_present` | must be `false` to pass (skill red line: no "nothing happened" failures) |
| `data_layer.single_small_client_per_app` | data-layer evidence: fetching goes through one small client per app |
| `data_layer.retries_with_backoff_for_transient_errors` | data-layer evidence: transient errors are retried with backoff |
| `data_layer.whole_screen_blocked_by_single_widget_present` | must be `false` to pass (skill rule: the whole screen is never blocked for one widget) |
| `responsive.fluid_grids_used` | responsive evidence: fluid grids are used |
| `responsive.wrap_safe_text` | responsive evidence: text is wrap-safe |
| `responsive.stable_dimensions` | responsive evidence: dimensions are stable |
| `responsive.widths_verified_360_to_desktop` | responsive evidence: widths are verified from 360px to desktop |
| `responsive.overflow_present` | must be `false` to pass (skill rule: no overflow) |
| `responsive.overlap_present` | must be `false` to pass (skill rule: no overlap) |
| `responsive.has_fixed_bars` | gate: declares whether fixed bars are present |
| `responsive.nothing_hidden_behind_fixed_bars` | required `true` only when `responsive.has_fixed_bars` is `true`; otherwise passes as not applicable |
| `accessibility.labels_on_all_fields` | accessibility evidence: all fields have labels |
| `accessibility.logical_focus_order` | accessibility evidence: focus order is logical |
| `accessibility.aria_live_for_async_results` | accessibility evidence: async results use aria-live |
| `accessibility.fully_keyboard_operable` | accessibility evidence: the interface is fully keyboard operable |
| `performance.budget_defined_before_build` | performance evidence: the budget (bundle size, first paint) is defined before the build |
| `performance.lazy_load_below_fold` | performance evidence: below-the-fold content is lazy-loaded |
| `performance.layout_shift_avoided` | performance evidence: layout shift is avoided |
| `performance.static_assets_cached` | performance evidence: static assets are cached |
| `performance.budget_checked_bundle_and_first_paint` | performance evidence: the budget is checked — bundle and first paint |
| `performance.budget_checked_on_slow_throttle` | performance evidence: the budget check runs on a slow throttle |
| `errors.human_readable_messages_in_ui` | errors evidence: messages in the interface are human-readable |
| `errors.details_sent_to_logs_not_ui` | errors evidence: details go to logs/telemetry, not into the user's face |
| `verification.smoke_tests_for_key_flows` | verification evidence: smoke/tests cover the key flows |
| `verification.keyboard_only_primary_journey_passed` | verification evidence: a keyboard-only pass of the primary journey is completed |
| `errors.console_spam_present` | must be `false` to pass (skill red line: no console spam) |
| `security.secrets_in_frontend_code_present` | must be `false` to pass (skill red line: no secrets or keys in frontend code) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward FRONTEND_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/frontend-implementation`:

```json
{
  "project": "Alpha",
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
  },
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
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 39 checks and a text stamp of the verdict):

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
  "computed_status": "within_stated_limits_on_declared_evidence",
  "data_views_count": 1,
  "data_views_without_complete_states": [],
  "state_coverage": "1.000000",
  "summary": "39 pass, 0 fail, 0 missing of 39 checks across five sections."
}
```

## Verdicts

- **FRONTEND_SOUND** — every check passes; the declared frontend record is complete and consistent with the skill's checklist and red lines.
- **FRONTEND_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `data_views_count` (the declared list length as an integer, or null when the list is not declared), the row-name list `data_views_without_complete_states` (data views whose four state fields are all present but not all true; a view with a state field absent is missing evidence and does not appear; null when the list is not declared), the ratio `state_coverage` (data views declaring all four states implemented ÷ declared data views, as a string with exactly six decimal places; null when the declared list is absent or empty), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when either of the two primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
