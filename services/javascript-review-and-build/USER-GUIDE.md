# JavaScript review and build — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have a piece of JavaScript, or a JavaScript build, and a record of how it was engineered — ESM and strictness, async discipline, DOM safety, environment and bundle awareness, tests and red lines. This atom reads one declared manifest and returns one deterministic verdict across five sections: **JAVASCRIPT_REVIEW_SOUND**, **JAVASCRIPT_REVIEW_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared record's completeness and consistency only — it runs no code, parses no source, lints nothing, probes no live page or bundle, and does not verify that a declared control actually works. A review is sound *on your declared evidence*: it never judges whether code actually contains an implicit global, an unhandled promise or an XSS trap the manifest did not declare, whether error handling is genuinely adequate, whether sanitization is effective, whether a dependency is genuinely too large for its job, or whether TypeScript would have been the better call. Computed checks: the declared `files` list must be present and non-empty; every file row must declare itself an ES module, must not use `var`, must carry no unhandled promise, and must not inject user input via `innerHTML`. Four checks are conditional: network timeouts via `AbortController` are required only when `async.network_calls_present` is declared `true`; sanitization only when `dom.html_truly_needed_present` is `true`; feature detection only when `environment.shared_code_present` is `true`; and a manual UI smoke test only when `tests.ui_present` is `true` — otherwise each passes as not applicable. No numeric threshold is imposed — no bundle-size limit, no dependency-size or dependency-count limit and no definition of "huge", no network-timeout duration, no test-coverage percentage, no number of files, modules or promises a review must cover, and no code-size or complexity bar at which plain JavaScript should become TypeScript. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "javascript-review-and-build"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/javascript-review-and-build` — tool name `javascript_review_and_build`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/javascript-review-and-build` — body = the manifest object; same `Authorization` header.

## Input — the javascript-review-and-build manifest

| Field | Meaning |
|---|---|
| `subject` | subject name (string; carried into the output, not checked) |
| `modules.esm_used_everywhere` | module evidence: ESM (`import`/`export`) is used everywhere |
| `modules.implicit_globals_present` | must be `false` to pass (quality gate: no implicit globals) |
| `modules.var_used_present` | must be `false` to pass (skill method: never `var`) |
| `modules.const_by_default_let_when_reassigned` | module evidence: `const` by default, `let` when reassigned |
| `modules.strict_mode_in_effect` | strictness evidence: strict mode is in effect |
| `modules.jsdoc_types_for_reused_code` | strictness evidence: JSDoc types are carried for reused code |
| `async.async_await_with_real_error_handling` | async evidence: async/await is used with real error handling |
| `async.every_promise_handled_or_explicitly_caught` | async evidence: every promise is handled or explicitly `.catch`ed |
| `async.network_calls_present` | gate: declares whether network calls are present |
| `async.network_timeouts_via_abort_controller` | required `true` only when `async.network_calls_present` is `true`; otherwise passes as not applicable |
| `dom.nodes_built_with_text_content_and_create_element` | DOM evidence: nodes are built with `textContent` / `createElement` |
| `dom.user_input_via_inner_html_present` | must be `false` to pass (DOM safety: user input is never injected via `innerHTML`) |
| `dom.html_truly_needed_present` | gate: declares whether HTML rendering is truly needed |
| `dom.sanitization_applied_when_html_truly_needed` | required `true` only when `dom.html_truly_needed_present` is `true`; otherwise passes as not applicable |
| `environment.no_dom_apis_in_node_code` | environment evidence: no DOM APIs are used in Node code |
| `environment.shared_code_present` | gate: declares whether code is shared across environments |
| `environment.feature_detection_when_shared_code` | required `true` only when `environment.shared_code_present` is `true`; otherwise passes as not applicable |
| `bundle.bundle_contents_known` | bundle evidence: what ships in the bundle is known |
| `bundle.huge_dependencies_for_small_jobs_present` | must be `false` to pass (bundle awareness: no huge dependencies for small jobs) |
| `bundle.optional_code_split` | bundle evidence: optional code is code-split |
| `files` (list of file-row objects) | computed: must be present and non-empty; reported as `files_count` |
| `files[].name` (string) | names the row in the computed outputs |
| `files[].esm_module` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `files_without_esm` |
| `files[].var_present` | computed: must be `false` per row to pass; rows declaring `true` are reported in `files_using_var` |
| `files[].unhandled_promise_present` | computed: must be `false` per row to pass; rows declaring `true` are reported in `files_with_unhandled_promises` |
| `files[].inner_html_with_user_input_present` | computed: must be `false` per row to pass; rows declaring `true` are reported in `files_injecting_user_input_via_inner_html` |
| `tests.pure_logic_unit_tested` | test evidence: pure logic is unit-tested |
| `tests.ui_present` | gate: declares whether a UI is present |
| `tests.manual_smoke_for_ui` | required `true` only when `tests.ui_present` is `true`; otherwise passes as not applicable |
| `tests.logic_extracted_from_event_handlers_and_tested` | test evidence: logic is extracted from event handlers and tested |
| `red_lines.eval_or_function_on_untrusted_input_present` | must be `false` to pass (red line: never `eval` / `Function` on untrusted input) |
| `red_lines.secrets_in_client_side_code_present` | must be `false` to pass (red line: no secrets in client-side code) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward JAVASCRIPT_REVIEW_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/javascript-review-and-build`:

```json
{
  "subject": "auth-module",
  "modules": {
    "esm_used_everywhere": true,
    "implicit_globals_present": false,
    "var_used_present": false,
    "const_by_default_let_when_reassigned": true,
    "strict_mode_in_effect": true,
    "jsdoc_types_for_reused_code": true
  },
  "async": {
    "async_await_with_real_error_handling": true,
    "every_promise_handled_or_explicitly_caught": true,
    "network_calls_present": false
  },
  "dom": {
    "nodes_built_with_text_content_and_create_element": true,
    "user_input_via_inner_html_present": false,
    "html_truly_needed_present": false
  },
  "environment": {
    "no_dom_apis_in_node_code": true,
    "shared_code_present": false
  },
  "bundle": {
    "bundle_contents_known": true,
    "huge_dependencies_for_small_jobs_present": false,
    "optional_code_split": true
  },
  "files": [
    {
      "name": "index.js",
      "esm_module": true,
      "var_present": false,
      "unhandled_promise_present": false,
      "inner_html_with_user_input_present": false
    }
  ],
  "tests": {
    "pure_logic_unit_tested": true,
    "ui_present": false,
    "logic_extracted_from_event_handlers_and_tested": true
  },
  "red_lines": {
    "eval_or_function_on_untrusted_input_present": false,
    "secrets_in_client_side_code_present": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 27 checks and a text stamp of the verdict):

```json
{
  "service": "javascript-review-and-build",
  "atom_version": "0.1.0",
  "subject": "auth-module",
  "verdict": "JAVASCRIPT_REVIEW_SOUND",
  "sections": {
    "modules_and_strictness": "pass",
    "async_discipline": "pass",
    "dom_safety": "pass",
    "environment_and_bundle": "pass",
    "tests_and_red_lines": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "files_count": 1,
  "files_without_esm": [],
  "esm_coverage": "1.000000",
  "files_using_var": [],
  "files_with_unhandled_promises": [],
  "files_injecting_user_input_via_inner_html": [],
  "summary": "27 pass, 0 fail, 0 missing of 27 checks across five sections."
}
```

## Verdicts

- **JAVASCRIPT_REVIEW_SOUND** — every check passes; the declared JavaScript review/build record is complete and consistent with the skill's checklist and lines.
- **JAVASCRIPT_REVIEW_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `files_count` (the declared list length as an integer, or null when the list is not declared), the row-name lists `files_without_esm`, `files_using_var`, `files_with_unhandled_promises` and `files_injecting_user_input_via_inner_html` (null when the `files` list is not declared; a file with the relevant field absent is missing evidence and does not appear in `files_without_esm`), the coverage value `esm_coverage` (ES-module files ÷ declared files, as a string with exactly six decimal places; null when the `files` list is absent or empty), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the five primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
