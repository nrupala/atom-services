# Javascript review and build — documentation

**Javascript review and build** · slug `javascript-review-and-build` · deliverable type REVIEW · atom version 0.1.0 · status: live — release candidate, RC soak to 2026-11-22 (atoms-gateway v1.1.0, deployment fe07be725c5a4817ad7b7e341310a97b).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under each worked example.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `subject` "auth-module"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "javascript-review-and-build"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the JavaScript review/build manifest.** You declare a record of a piece of JavaScript, or a JavaScript build, already engineered — the atom audits the record, it does not review the code itself (see Explanation). The recorded full-pass manifest declares the subject `auth-module`: ESM used everywhere, no implicit globals, no `var` used, `const` by default with `let` when reassigned, strict mode in effect, and JSDoc types for reused code; async/await with real error handling and every promise handled or explicitly caught, with no network calls declared (`network_calls_present: false`, so the network-timeout check passes as not applicable); nodes built with `textContent` / `createElement`, no user input via `innerHTML`, and no HTML truly needed (`html_truly_needed_present: false`, so the sanitization check passes as not applicable); no DOM APIs in Node code and no shared code declared (`shared_code_present: false`, so the feature-detection check passes as not applicable); bundle contents known, no huge dependencies for small jobs, and optional code split; one file, `index.js`, declared an ES module with no `var`, no unhandled promise and no `innerHTML` injection of user input; pure logic unit-tested, no UI declared (`ui_present: false`, so the manual-smoke check passes as not applicable), and logic extracted from event handlers and tested; and neither red line present (`eval_or_function_on_untrusted_input_present: false`, `secrets_in_client_side_code_present: false`).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/javascript-review-and-build` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `JAVASCRIPT_REVIEW_SOUND`: "27 pass, 0 fail, 0 missing of 27 checks across five sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `files_count` is 1, `esm_coverage` is `"1.000000"`, and all four row-name lists (`files_without_esm`, `files_using_var`, `files_with_unhandled_promises`, `files_injecting_user_input_via_inner_html`) are `[]`.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `JAVASCRIPT_REVIEW_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "javascript-review-and-build"}`.
3. Call: `POST https://atoms.pipavia.com/v1/javascript-review-and-build` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/javascript-review-and-build` with the `Authorization: Bearer <key>` header — the whole MCP surface on this gateway is key-gated, including `initialize` and `tools/list`.
2. Call `tools/call` with tool name `javascript_review_and_build`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `JAVASCRIPT_REVIEW_NOT_SOUND` means at least one check has status `fail`: a field is present but false/invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 9 checks fail: `no_implicit_globals`, `no_var_used`, `no_file_uses_var`, `no_file_has_unhandled_promise`, `no_user_input_via_inner_html`, `no_file_injects_user_input_via_inner_html`, `no_huge_dependencies_for_small_jobs`, `no_eval_or_function_on_untrusted_input`, `no_secrets_in_client_side_code`, and the summary reads "18 pass, 9 fail, 0 missing of 27 checks across five sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (in the recorded violations run, `files_using_var`, `files_with_unhandled_promises` and `files_injecting_user_input_via_inner_html` each name `index.js`: the one declared file row, changed to declare `var_present`, `unhandled_promise_present` and `inner_html_with_user_input_present` all `true`; the run also declares `modules.implicit_globals_present`, `modules.var_used_present`, `dom.user_input_via_inner_html_present`, `bundle.huge_dependencies_for_small_jobs_present`, `red_lines.eval_or_function_on_untrusted_input_present` and `red_lines.secrets_in_client_side_code_present` as `true`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where an object is required) and no checks ran. The recorded malformed run for this atom returned the body `{"ok":false,"error":"invalid_input","field":"modules","detail":"modules must be an object"}` — the `field` and `detail` name the violation (see Worked examples, example 3, and Errors). Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/javascript-review-and-build` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/javascript-review-and-build` — tool name `javascript_review_and_build`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `javascript_review_and_build` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**. SERVICE.md states no type for the section wrapper objects (`modules`, `async`, `dom`, `environment`, `bundle`, `tests`, `red_lines`) or for a `files[]` row object; for those rows the type given below is grounded in the recorded evidence instead — the MCP `inputSchema` and the recorded inputs in `verification/work/javascript-review-and-build/evidence.json` (and, for `modules`, the recorded malformed 422, "modules must be an object") — and the row is marked "grounded in the recorded evidence". A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `JAVASCRIPT_REVIEW_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below exactly as SERVICE.md groups them — by the section that reads them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `subject` | string | Carried into the verdict output, not itself checked |

#### Read by: modules_and_strictness

| Field | Type | Notes |
|---|---|---|
| `modules` | object (grounded in the recorded evidence — SERVICE.md states no type for this wrapper) | The modules section object — a present non-object value is rejected before evaluation (the recorded malformed case) |
| `modules.esm_used_everywhere` | boolean | — |
| `modules.implicit_globals_present` | boolean | must be `false` to pass — skill quality gate |
| `modules.var_used_present` | boolean | must be `false` to pass — skill method: never `var` |
| `modules.const_by_default_let_when_reassigned` | boolean | — |
| `modules.strict_mode_in_effect` | boolean | — |
| `modules.jsdoc_types_for_reused_code` | boolean | — |
| `files` | list | list of file-row objects, each with the entry fields below; computed, see below |
| `files[]` | object (grounded in the recorded evidence — SERVICE.md states no type for a row) | One declared file row |
| `files[].name` | string | Names the row in the computed outputs |
| `files[].esm_module` | boolean | — |
| `files[].var_present` | boolean | must be `false` per row to pass the computed var check |
| `files[].unhandled_promise_present` | boolean | must be `false` per row to pass the computed promise check |
| `files[].inner_html_with_user_input_present` | boolean | must be `false` per row to pass the computed injection check |

#### Read by: async_discipline

| Field | Type | Notes |
|---|---|---|
| `async` | object (grounded in the recorded evidence — SERVICE.md states no type for this wrapper) | The async section object |
| `async.async_await_with_real_error_handling` | boolean | — |
| `async.every_promise_handled_or_explicitly_caught` | boolean | — |
| `async.network_calls_present` | boolean (gate) | gates the timeout check below |
| `async.network_timeouts_via_abort_controller` | boolean | required when network calls are declared present; otherwise the check passes as not applicable |

#### Read by: dom_safety

| Field | Type | Notes |
|---|---|---|
| `dom` | object (grounded in the recorded evidence — SERVICE.md states no type for this wrapper) | The DOM section object |
| `dom.nodes_built_with_text_content_and_create_element` | boolean | — |
| `dom.user_input_via_inner_html_present` | boolean | must be `false` to pass — skill DOM safety |
| `dom.html_truly_needed_present` | boolean (gate) | gates the sanitization check below |
| `dom.sanitization_applied_when_html_truly_needed` | boolean | required when HTML is declared truly needed; otherwise the check passes as not applicable |

#### Read by: environment_and_bundle

| Field | Type | Notes |
|---|---|---|
| `environment` | object (grounded in the recorded evidence — SERVICE.md states no type for this wrapper) | The environment section object |
| `environment.no_dom_apis_in_node_code` | boolean | — |
| `environment.shared_code_present` | boolean (gate) | gates the feature-detection check below |
| `environment.feature_detection_when_shared_code` | boolean | required when shared code is declared present; otherwise the check passes as not applicable |
| `bundle` | object (grounded in the recorded evidence — SERVICE.md states no type for this wrapper) | The bundle section object |
| `bundle.bundle_contents_known` | boolean | — |
| `bundle.huge_dependencies_for_small_jobs_present` | boolean | must be `false` to pass — skill bundle awareness |
| `bundle.optional_code_split` | boolean | — |

#### Read by: tests_and_red_lines

| Field | Type | Notes |
|---|---|---|
| `tests` | object (grounded in the recorded evidence — SERVICE.md states no type for this wrapper) | The tests section object |
| `tests.pure_logic_unit_tested` | boolean | — |
| `tests.ui_present` | boolean (gate) | gates the manual-smoke check below |
| `tests.manual_smoke_for_ui` | boolean | required when a UI is declared present; otherwise the check passes as not applicable |
| `tests.logic_extracted_from_event_handlers_and_tested` | boolean | — |
| `red_lines` | object (grounded in the recorded evidence — SERVICE.md states no type for this wrapper) | The red-lines section object |
| `red_lines.eval_or_function_on_untrusted_input_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.secrets_in_client_side_code_present` | boolean | must be `false` to pass — skill red line |

### Checks

All 27 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only: a conditional (gated) check whose gate is not triggered reports `pass` with evidence stating the gate was not declared — that is the not-applicable outcome. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies and grounding notes).

#### Section: modules_and_strictness

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `esm_used_everywhere` | modules: ESM (import/export) is used everywhere | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_implicit_globals` | quality gate: no implicit globals are present | Pass: the anti-pattern field `modules.implicit_globals_present` is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_var_used` | modules: never var — const by default, let when reassigned | Pass: the anti-pattern field `modules.var_used_present` is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `const_by_default_let_when_reassigned` | modules: const by default, let when reassigned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `strict_mode_in_effect` | strictness: use strict is in effect — implicit in modules | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `jsdoc_types_for_reused_code` | strictness: JSDoc types are carried for anything reused without TypeScript | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `files_declared` | the declared record names its files — the files list is present and non-empty | Computed over the declared record. Pass: the `files` list is present and non-empty. Fail: the list is present but empty. Missing: the list is absent. |
| `every_file_is_esm` | modules: every declared file row is an ES module | Computed over the declared record. Pass: every declared file row declares `esm_module: true`. Fail: a row declares `esm_module` present but not `true` (offending rows are named in `files_without_esm`). Missing: the list is absent, or a row has `esm_module` absent (such a row is missing evidence and does not appear in `files_without_esm`). |
| `no_file_uses_var` | quality gate: no declared file row uses var | Computed over the declared record. Pass: no declared file row declares `var_present: true`. Fail: a row declares `var_present: true` (offending rows are named in `files_using_var`). Missing: the list is absent, or a row has `var_present` absent. |

#### Section: async_discipline

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `async_await_with_real_error_handling` | async discipline: async/await is used with real error handling | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `every_promise_handled_or_explicitly_caught` | async discipline: every promise is handled or explicitly .catch'ed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `network_timeouts_via_abort_controller_when_network_calls` | no network calls declared | Conditional on `async.network_calls_present`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run, where the evidence reads "no network calls declared"). Fail: the gate is declared and the requirement is declared unmet. Missing: the gate is declared and the required field is absent. |
| `no_file_has_unhandled_promise` | quality gate: no declared file row carries an unhandled promise | Computed over the declared record. Pass: no declared file row declares `unhandled_promise_present: true`. Fail: a row declares `unhandled_promise_present: true` (offending rows are named in `files_with_unhandled_promises`). Missing: the list is absent, or a row has `unhandled_promise_present` absent. |

#### Section: dom_safety

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `nodes_built_with_text_content_and_create_element` | DOM safety: nodes are built with textContent / createElement | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_user_input_via_inner_html` | DOM safety: user input is never injected via innerHTML | Pass: the anti-pattern field `dom.user_input_via_inner_html_present` is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `sanitization_when_html_truly_needed` | no HTML rendering truly needed declared | Conditional on `dom.html_truly_needed_present`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run, where the evidence reads "no HTML rendering truly needed declared"). Fail: the gate is declared and the requirement is declared unmet. Missing: the gate is declared and the required field is absent. |
| `no_file_injects_user_input_via_inner_html` | quality gate: no declared file row injects user input via innerHTML | Computed over the declared record. Pass: no declared file row declares `inner_html_with_user_input_present: true`. Fail: a row declares `inner_html_with_user_input_present: true` (offending rows are named in `files_injecting_user_input_via_inner_html`). Missing: the list is absent, or a row has `inner_html_with_user_input_present` absent. |

#### Section: environment_and_bundle

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `no_dom_apis_in_node_code` | environment split: no DOM APIs are used in Node code | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `feature_detection_when_shared_code` | no shared code declared | Conditional on `environment.shared_code_present`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run, where the evidence reads "no shared code declared"). Fail: the gate is declared and the requirement is declared unmet. Missing: the gate is declared and the required field is absent. |
| `bundle_contents_known` | bundle awareness: what ships is known | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_huge_dependencies_for_small_jobs` | bundle awareness: no huge dependencies are carried for small jobs | Pass: the anti-pattern field `bundle.huge_dependencies_for_small_jobs_present` is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `optional_code_split` | bundle awareness: anything optional is code-split | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: tests_and_red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `pure_logic_unit_tested` | tests: pure logic is unit-tested (vitest / node:test) | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `manual_smoke_for_ui_when_ui_present` | no UI declared | Conditional on `tests.ui_present`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run, where the evidence reads "no UI declared"). Fail: the gate is declared and the requirement is declared unmet. Missing: the gate is declared and the required field is absent. |
| `logic_extracted_from_event_handlers_and_tested` | quality gate: logic is extracted from event handlers so it is testable, and tested | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_eval_or_function_on_untrusted_input` | red line: never eval / Function on untrusted input | Pass: the anti-pattern field `red_lines.eval_or_function_on_untrusted_input_present` is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_secrets_in_client_side_code` | red line: no secrets in client-side code — assume it is public | Pass: the anti-pattern field `red_lines.secrets_in_client_side_code_present` is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"javascript-review-and-build"`), `atom_version` (`"0.1.0"`), and `subject` (the manifest's declared subject value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `files_count` (the declared list length as an integer, or null when the list is not declared); the row-name lists `files_without_esm` (files whose `esm_module` field is present but not `true`; a file with the field absent is missing evidence and does not appear), `files_using_var` (files declaring `var_present: true`), `files_with_unhandled_promises` (files declaring `unhandled_promise_present: true`) and `files_injecting_user_input_via_inner_html` (files declaring `inner_html_with_user_input_present: true`) — all four lists are null when the `files` list is not declared; and the ratio `esm_coverage` (ES-module files ÷ declared files) — a string with exactly six decimal places; a ratio is null when its denominator list is absent or empty. Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "27 pass, 0 fail, 0 missing of 27 checks across five sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared subject value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `JAVASCRIPT_REVIEW_SOUND` — all 27 checks pass: the declared JavaScript review/build record is complete and consistent with the bound skill's checklist, quality gates and red lines.
- `JAVASCRIPT_REVIEW_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one of the five primary computed checks (`files_declared`, `every_file_is_esm`, `no_file_uses_var`, `no_file_has_unhandled_promise`, `no_file_injects_user_input_via_inner_html`) cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes (including gated checks passing as not applicable); `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence (for gated checks: met, or the gate was not triggered — not applicable); `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

### Errors

A failed call is not metered. Only the 422 body below was recorded in this atom's verification battery; the 401, 403 and 429 rows carry HTTP status and meaning only, explicitly flagged as unrecorded — no payload shape is stated for them, and none should be inferred from another atom's documentation.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the verification battery; status and meaning only.* | Missing or invalid gateway API key. |
| 403 | *Unrecorded — no recorded body in the verification battery; status and meaning only.* | The key is valid but does not hold this atom's scope. Issue the key for this atom (see How-to) and retry. |
| 422 | `{"ok":false,"error":"invalid_input","field":"modules","detail":"modules must be an object"}` (this atom's recorded malformed run, verbatim) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the verification battery; status and meaning only.* | Per-key rate limit exceeded for this atom (60/minute, 10,000/day per key — see Rate limits and pricing). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Modern JavaScript done right — ESM, no implicit globals, async discipline, XSS-safe DOM, bundle awareness (the bound capability, from the `javascript-engineering` skill). You submit one declared record — the JavaScript review/build manifest — and the atom audits that record for completeness and internal consistency against the bound skill's checklist, quality gates and red lines, returning one deterministic verdict across 5 sections (`modules_and_strictness`, `async_discipline`, `dom_safety`, `environment_and_bundle`, `tests_and_red_lines`). The atom sells the review it produces — a bounded judgment artifact (deliverable type REVIEW) — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — the declared `files` list must be present and non-empty, every file row must declare itself an ES module, no file row may use `var`, carry an unhandled promise, or inject user input via `innerHTML` — using only the declared record, with no outside threshold imported. *Conditional checks* bind only when their declared gate field says the situation applies — network timeouts via `AbortController` are required only when `async.network_calls_present` is declared `true`; sanitization only when `dom.html_truly_needed_present` is declared `true`; feature detection only when `environment.shared_code_present` is declared `true`; and a manual UI smoke test only when `tests.ui_present` is declared `true`; when a gate is not triggered those checks pass as not applicable, and their evidence text says so. Aggregation is strict: any `fail` anywhere produces `JAVASCRIPT_REVIEW_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `JAVASCRIPT_REVIEW_SOUND`. The central semantic is the absent/false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented: a bundle-size limit in kilobytes or any other unit (the skill says "know what ships" and "no huge deps for small jobs" but states no size); a dependency-size or dependency-count limit, or a definition of "huge" or "small" (caller attestation only); a network-timeout duration in milliseconds or seconds (the skill requires timeouts via `AbortController` but states no duration); a test-coverage percentage (the skill requires unit tests for pure logic but states no coverage bar); a number of files, modules or promises a review must cover; a code-size, complexity or growth threshold at which plain JavaScript should become TypeScript (the skill says "Prefer TypeScript for anything that grows" but states no size or complexity number — which side of that line a subject sits on is a caller declaration, never judged here); a coverage percentage below completeness. Quantities are computed and reported; the only bar on the computed rows is completeness over the caller's own declared rows.

**What it does NOT do.** The atom audits a **declared** JavaScript review/build record: a verdict of `JAVASCRIPT_REVIEW_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a manifest that declares ESM everywhere, every promise handled, and no `innerHTML` injection passes those checks even if the real code does none of it. It is a completeness and consistency audit of the record the skill requires, **not a code review, a linter, a security audit, or a certification**. Specifically: it runs no code, parses no source, lints nothing, probes no live page or bundle, and does not verify that a declared control actually works. It never judges whether code actually contains an implicit global, an unhandled promise or an XSS trap the manifest did not declare, whether error handling is genuinely adequate, whether sanitization is effective, whether a dependency is genuinely too large for its job, or whether TypeScript would have been the better call — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared rows are internally consistent. Named exclusions: no numeric thresholds beyond the skill's own stated rules (see the declined list above); no live verification of any declared fact; no source inspection — `eval`/`Function` use, secret presence, `var` use and `innerHTML` injection are caller-declared present/absent flags, the atom reads no code; correctness of the underlying JavaScript (logic, algorithm, API use) is a caller declaration — the atom checks only that the skill's disciplines are declared applied; whether plain JS versus TypeScript is the right call for a subject is a caller declaration, not re-audited here.

**Distinct ground.** Sibling atoms `c-engineering-review`, `cpp-engineering-review` and `code-review-service` are live, but this atom shares zero checks with any of them: those atoms audit, respectively, C memory/undefined-behaviour evidence, C++ RAII/value-semantics evidence, and the pull-request review process. This atom audits only JavaScript-specific evidence — ESM/`var`/strictness/JSDoc, promise and `AbortController` discipline, `textContent` / `createElement` / `innerHTML` DOM safety, Node-vs-DOM environment split, and bundle/code-split awareness. No check name, manifest field or verdict overlaps a sibling's.

**Buyer and use context.** Teams and agents working in Engineering & code who need this review on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: No-build site script engineering (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulators: N/A — this atom audits a declared JavaScript review/build record; its verdict is a completeness and consistency judgment on the caller's declared evidence, not compliance or audit evidence, not a code review, a security audit or a certification (SERVICE.md states this explicitly in its honest scoping), so its verdict is not compliance evidence and no regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `javascript_review_and_build` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/javascript_review_and_build.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_javascript_review_and_build.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/javascript-review-and-build` (REST) and `POST /mcp/javascript-review-and-build` (MCP, tool `javascript_review_and_build`) on https://atoms.pipavia.com, gateway v1.1.0, deployment fe07be725c5a4817ad7b7e341310a97b, at last verification. Key scope: `javascript_review_and_build`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live — release candidate, RC soak to 2026-11-22; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies and grounding notes

This documentation follows the **recorded response** wherever SERVICE.md, TEST-REPORT.md or USER-GUIDE.md disagrees with it. The discrepancies found are:

1. **Status staleness in SERVICE.md.** SERVICE.md still states "Tier B · status: **built-locally** — deterministic core, Python oracle and TypeScript port built and parity-proven locally; no endpoint is live." The recorded battery and TEST-REPORT.md show the atom live on atoms-gateway v1.1.0, deployment fe07be725c5a4817ad7b7e341310a97b. This document follows the evidenced live state (live — release candidate, RC soak to 2026-11-22) and names the SERVICE.md status as stale.
2. **Trimmed worked examples in USER-GUIDE.md and TEST-REPORT.md.** The USER-GUIDE.md worked-example response is explicitly trimmed — it omits the recorded `checks` array (all 27 checks) and the `stamp` field; TEST-REPORT.md's raw-output excerpt for the full-pass run is likewise trimmed. Every value those documents do show agrees with the recording. The Worked examples below reproduce the full recorded responses, untrimmed.
3. **Recorded check names differ from the input field names they read.** Examples: input `modules.implicit_globals_present` is read by check `no_implicit_globals`; `modules.var_used_present` by `no_var_used`; `async.network_timeouts_via_abort_controller` by `network_timeouts_via_abort_controller_when_network_calls`; `dom.sanitization_applied_when_html_truly_needed` by `sanitization_when_html_truly_needed`; `tests.manual_smoke_for_ui` by `manual_smoke_for_ui_when_ui_present`; and the per-file computed checks (`every_file_is_esm`, `no_file_uses_var`, `no_file_has_unhandled_promise`, `no_file_injects_user_input_via_inner_html`) do not match any single input field name. This document uses the recorded check names verbatim throughout the Checks section.
4. **Wrapper-object types not stated in SERVICE.md.** SERVICE.md's field table states no type for the section wrapper objects (`modules`, `async`, `dom`, `environment`, `bundle`, `tests`, `red_lines`) or for a `files[]` row object. The types given in the Input reference for those rows are grounded in the recorded evidence (the MCP `inputSchema`, the recorded inputs, and the recorded malformed 422 for `modules`), and each such row is marked accordingly.

## Worked examples

Provenance (all three examples): recorded 2026-11-16T06:30:13.681254+00:00 against gateway v1.1.0, external verification lane, source `verification/work/javascript-review-and-build/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 27 missing, all computed outputs null — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T06:30:13.681254+00:00 against gateway v1.1.0, external verification lane, source `verification/work/javascript-review-and-build/evidence.json`.

Input:

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

Response (HTTP 200):

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
  "checks": [
    {
      "section": "modules_and_strictness",
      "check": "esm_used_everywhere",
      "status": "pass",
      "evidence": "modules: ESM (import/export) is used everywhere"
    },
    {
      "section": "modules_and_strictness",
      "check": "no_implicit_globals",
      "status": "pass",
      "evidence": "quality gate: no implicit globals are present"
    },
    {
      "section": "modules_and_strictness",
      "check": "no_var_used",
      "status": "pass",
      "evidence": "modules: never var — const by default, let when reassigned"
    },
    {
      "section": "modules_and_strictness",
      "check": "const_by_default_let_when_reassigned",
      "status": "pass",
      "evidence": "modules: const by default, let when reassigned"
    },
    {
      "section": "modules_and_strictness",
      "check": "strict_mode_in_effect",
      "status": "pass",
      "evidence": "strictness: use strict is in effect — implicit in modules"
    },
    {
      "section": "modules_and_strictness",
      "check": "jsdoc_types_for_reused_code",
      "status": "pass",
      "evidence": "strictness: JSDoc types are carried for anything reused without TypeScript"
    },
    {
      "section": "modules_and_strictness",
      "check": "files_declared",
      "status": "pass",
      "evidence": "the declared record names its files — the files list is present and non-empty"
    },
    {
      "section": "modules_and_strictness",
      "check": "every_file_is_esm",
      "status": "pass",
      "evidence": "modules: every declared file row is an ES module"
    },
    {
      "section": "modules_and_strictness",
      "check": "no_file_uses_var",
      "status": "pass",
      "evidence": "quality gate: no declared file row uses var"
    },
    {
      "section": "async_discipline",
      "check": "async_await_with_real_error_handling",
      "status": "pass",
      "evidence": "async discipline: async/await is used with real error handling"
    },
    {
      "section": "async_discipline",
      "check": "every_promise_handled_or_explicitly_caught",
      "status": "pass",
      "evidence": "async discipline: every promise is handled or explicitly .catch'ed"
    },
    {
      "section": "async_discipline",
      "check": "network_timeouts_via_abort_controller_when_network_calls",
      "status": "pass",
      "evidence": "no network calls declared"
    },
    {
      "section": "async_discipline",
      "check": "no_file_has_unhandled_promise",
      "status": "pass",
      "evidence": "quality gate: no declared file row carries an unhandled promise"
    },
    {
      "section": "dom_safety",
      "check": "nodes_built_with_text_content_and_create_element",
      "status": "pass",
      "evidence": "DOM safety: nodes are built with textContent / createElement"
    },
    {
      "section": "dom_safety",
      "check": "no_user_input_via_inner_html",
      "status": "pass",
      "evidence": "DOM safety: user input is never injected via innerHTML"
    },
    {
      "section": "dom_safety",
      "check": "sanitization_when_html_truly_needed",
      "status": "pass",
      "evidence": "no HTML rendering truly needed declared"
    },
    {
      "section": "dom_safety",
      "check": "no_file_injects_user_input_via_inner_html",
      "status": "pass",
      "evidence": "quality gate: no declared file row injects user input via innerHTML"
    },
    {
      "section": "environment_and_bundle",
      "check": "no_dom_apis_in_node_code",
      "status": "pass",
      "evidence": "environment split: no DOM APIs are used in Node code"
    },
    {
      "section": "environment_and_bundle",
      "check": "feature_detection_when_shared_code",
      "status": "pass",
      "evidence": "no shared code declared"
    },
    {
      "section": "environment_and_bundle",
      "check": "bundle_contents_known",
      "status": "pass",
      "evidence": "bundle awareness: what ships is known"
    },
    {
      "section": "environment_and_bundle",
      "check": "no_huge_dependencies_for_small_jobs",
      "status": "pass",
      "evidence": "bundle awareness: no huge dependencies are carried for small jobs"
    },
    {
      "section": "environment_and_bundle",
      "check": "optional_code_split",
      "status": "pass",
      "evidence": "bundle awareness: anything optional is code-split"
    },
    {
      "section": "tests_and_red_lines",
      "check": "pure_logic_unit_tested",
      "status": "pass",
      "evidence": "tests: pure logic is unit-tested (vitest / node:test)"
    },
    {
      "section": "tests_and_red_lines",
      "check": "manual_smoke_for_ui_when_ui_present",
      "status": "pass",
      "evidence": "no UI declared"
    },
    {
      "section": "tests_and_red_lines",
      "check": "logic_extracted_from_event_handlers_and_tested",
      "status": "pass",
      "evidence": "quality gate: logic is extracted from event handlers so it is testable, and tested"
    },
    {
      "section": "tests_and_red_lines",
      "check": "no_eval_or_function_on_untrusted_input",
      "status": "pass",
      "evidence": "red line: never eval / Function on untrusted input"
    },
    {
      "section": "tests_and_red_lines",
      "check": "no_secrets_in_client_side_code",
      "status": "pass",
      "evidence": "red line: no secrets in client-side code — assume it is public"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "files_count": 1,
  "files_without_esm": [],
  "esm_coverage": "1.000000",
  "files_using_var": [],
  "files_with_unhandled_promises": [],
  "files_injecting_user_input_via_inner_html": [],
  "summary": "27 pass, 0 fail, 0 missing of 27 checks across five sections.",
  "stamp": "JAVASCRIPT REVIEW AND BUILD\nsubject: auth-module\nVERDICT: JAVASCRIPT_REVIEW_SOUND\n  modules_and_strictness               pass\n  async_discipline                     pass\n  dom_safety                           pass\n  environment_and_bundle               pass\n  tests_and_red_lines                  pass\n27 pass, 0 fail, 0 missing of 27 checks across five sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T06:30:13.681254+00:00 against gateway v1.1.0, external verification lane, source `verification/work/javascript-review-and-build/evidence.json`.

Input:

```json
{
  "subject": "auth-module",
  "modules": {
    "esm_used_everywhere": true,
    "implicit_globals_present": true,
    "var_used_present": true,
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
    "user_input_via_inner_html_present": true,
    "html_truly_needed_present": false
  },
  "environment": {
    "no_dom_apis_in_node_code": true,
    "shared_code_present": false
  },
  "bundle": {
    "bundle_contents_known": true,
    "huge_dependencies_for_small_jobs_present": true,
    "optional_code_split": true
  },
  "files": [
    {
      "name": "index.js",
      "esm_module": true,
      "var_present": true,
      "unhandled_promise_present": true,
      "inner_html_with_user_input_present": true
    }
  ],
  "tests": {
    "pure_logic_unit_tested": true,
    "ui_present": false,
    "logic_extracted_from_event_handlers_and_tested": true
  },
  "red_lines": {
    "eval_or_function_on_untrusted_input_present": true,
    "secrets_in_client_side_code_present": true
  }
}
```

Response (HTTP 200):

```json
{
  "service": "javascript-review-and-build",
  "atom_version": "0.1.0",
  "subject": "auth-module",
  "verdict": "JAVASCRIPT_REVIEW_NOT_SOUND",
  "sections": {
    "modules_and_strictness": "fail",
    "async_discipline": "fail",
    "dom_safety": "fail",
    "environment_and_bundle": "fail",
    "tests_and_red_lines": "fail"
  },
  "checks": [
    {
      "section": "modules_and_strictness",
      "check": "esm_used_everywhere",
      "status": "pass",
      "evidence": "modules: ESM (import/export) is used everywhere"
    },
    {
      "section": "modules_and_strictness",
      "check": "no_implicit_globals",
      "status": "fail",
      "evidence": "quality gate: no implicit globals are present"
    },
    {
      "section": "modules_and_strictness",
      "check": "no_var_used",
      "status": "fail",
      "evidence": "modules: never var — const by default, let when reassigned"
    },
    {
      "section": "modules_and_strictness",
      "check": "const_by_default_let_when_reassigned",
      "status": "pass",
      "evidence": "modules: const by default, let when reassigned"
    },
    {
      "section": "modules_and_strictness",
      "check": "strict_mode_in_effect",
      "status": "pass",
      "evidence": "strictness: use strict is in effect — implicit in modules"
    },
    {
      "section": "modules_and_strictness",
      "check": "jsdoc_types_for_reused_code",
      "status": "pass",
      "evidence": "strictness: JSDoc types are carried for anything reused without TypeScript"
    },
    {
      "section": "modules_and_strictness",
      "check": "files_declared",
      "status": "pass",
      "evidence": "the declared record names its files — the files list is present and non-empty"
    },
    {
      "section": "modules_and_strictness",
      "check": "every_file_is_esm",
      "status": "pass",
      "evidence": "modules: every declared file row is an ES module"
    },
    {
      "section": "modules_and_strictness",
      "check": "no_file_uses_var",
      "status": "fail",
      "evidence": "quality gate: no declared file row uses var"
    },
    {
      "section": "async_discipline",
      "check": "async_await_with_real_error_handling",
      "status": "pass",
      "evidence": "async discipline: async/await is used with real error handling"
    },
    {
      "section": "async_discipline",
      "check": "every_promise_handled_or_explicitly_caught",
      "status": "pass",
      "evidence": "async discipline: every promise is handled or explicitly .catch'ed"
    },
    {
      "section": "async_discipline",
      "check": "network_timeouts_via_abort_controller_when_network_calls",
      "status": "pass",
      "evidence": "no network calls declared"
    },
    {
      "section": "async_discipline",
      "check": "no_file_has_unhandled_promise",
      "status": "fail",
      "evidence": "quality gate: no declared file row carries an unhandled promise"
    },
    {
      "section": "dom_safety",
      "check": "nodes_built_with_text_content_and_create_element",
      "status": "pass",
      "evidence": "DOM safety: nodes are built with textContent / createElement"
    },
    {
      "section": "dom_safety",
      "check": "no_user_input_via_inner_html",
      "status": "fail",
      "evidence": "DOM safety: user input is never injected via innerHTML"
    },
    {
      "section": "dom_safety",
      "check": "sanitization_when_html_truly_needed",
      "status": "pass",
      "evidence": "no HTML rendering truly needed declared"
    },
    {
      "section": "dom_safety",
      "check": "no_file_injects_user_input_via_inner_html",
      "status": "fail",
      "evidence": "quality gate: no declared file row injects user input via innerHTML"
    },
    {
      "section": "environment_and_bundle",
      "check": "no_dom_apis_in_node_code",
      "status": "pass",
      "evidence": "environment split: no DOM APIs are used in Node code"
    },
    {
      "section": "environment_and_bundle",
      "check": "feature_detection_when_shared_code",
      "status": "pass",
      "evidence": "no shared code declared"
    },
    {
      "section": "environment_and_bundle",
      "check": "bundle_contents_known",
      "status": "pass",
      "evidence": "bundle awareness: what ships is known"
    },
    {
      "section": "environment_and_bundle",
      "check": "no_huge_dependencies_for_small_jobs",
      "status": "fail",
      "evidence": "bundle awareness: no huge dependencies are carried for small jobs"
    },
    {
      "section": "environment_and_bundle",
      "check": "optional_code_split",
      "status": "pass",
      "evidence": "bundle awareness: anything optional is code-split"
    },
    {
      "section": "tests_and_red_lines",
      "check": "pure_logic_unit_tested",
      "status": "pass",
      "evidence": "tests: pure logic is unit-tested (vitest / node:test)"
    },
    {
      "section": "tests_and_red_lines",
      "check": "manual_smoke_for_ui_when_ui_present",
      "status": "pass",
      "evidence": "no UI declared"
    },
    {
      "section": "tests_and_red_lines",
      "check": "logic_extracted_from_event_handlers_and_tested",
      "status": "pass",
      "evidence": "quality gate: logic is extracted from event handlers so it is testable, and tested"
    },
    {
      "section": "tests_and_red_lines",
      "check": "no_eval_or_function_on_untrusted_input",
      "status": "fail",
      "evidence": "red line: never eval / Function on untrusted input"
    },
    {
      "section": "tests_and_red_lines",
      "check": "no_secrets_in_client_side_code",
      "status": "fail",
      "evidence": "red line: no secrets in client-side code — assume it is public"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "files_count": 1,
  "files_without_esm": [],
  "esm_coverage": "1.000000",
  "files_using_var": [
    "index.js"
  ],
  "files_with_unhandled_promises": [
    "index.js"
  ],
  "files_injecting_user_input_via_inner_html": [
    "index.js"
  ],
  "summary": "18 pass, 9 fail, 0 missing of 27 checks across five sections.",
  "stamp": "JAVASCRIPT REVIEW AND BUILD\nsubject: auth-module\nVERDICT: JAVASCRIPT_REVIEW_NOT_SOUND\n  modules_and_strictness               fail\n  async_discipline                     fail\n  dom_safety                           fail\n  environment_and_bundle               fail\n  tests_and_red_lines                  fail\n18 pass, 9 fail, 0 missing of 27 checks across five sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T06:30:13.681254+00:00 against gateway v1.1.0, external verification lane, source `verification/work/javascript-review-and-build/evidence.json`.

Input:

```json
{
  "subject": "type-error",
  "modules": "not-an-object"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "modules",
  "detail": "modules must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — this atom audits a declared JavaScript review/build record; its verdict is a completeness and consistency judgment on the caller's declared evidence, not compliance or audit evidence, not a code review, a security audit or a certification, so its verdict is not compliance evidence. |
| Checks named | 27 documented / 27 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses (not-applicable expressed as a gated `pass`), plus the computed outputs (`files_count`, `files_without_esm`, `esm_coverage`, `files_using_var`, `files_with_unhandled_promises`, `files_injecting_user_input_via_inner_html`) |
| Input reference typed | Yes — 41 fields, each with its type from SERVICE.md, or grounded in the recorded evidence and marked as such where SERVICE.md states no type |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/javascript-review-and-build/evidence.json` |
