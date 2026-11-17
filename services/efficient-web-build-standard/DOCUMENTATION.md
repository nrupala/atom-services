# Efficient web build standard — documentation

**Efficient web build standard** · slug `efficient-web-build-standard` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `site` "example.com"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "efficient-web-build-standard"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the web-build manifest.** You declare a record of a build already done — the atom audits the record, it does not do the work (see Explanation). The recorded full-pass manifest declares the site `example.com`: the plan states the call count, the per-request work, the cheaper alternative and names any fragility; the rebuild is triggered by the publish event, with no timer-or-per-visitor primary rebuild (`timer_or_per_visitor_primary_rebuild_present: false`) and a live-render fallback kept; there is no await in a loop (`await_in_loop_present: false`), independent calls are batched or avoided and duplicate upstream fetches are coalesced; search/filter is declared present with a single publish-time index blob; and one page, `home`, is declared with content the same for all visitors, rendered at publish, with `calls_per_load` `1`. Caching is declared layered — edge cache, stale-while-revalidate, app cache scoped to authenticated/personalized data, DB cache scoped to genuinely dynamic data, hashed static assets used with `hashed_asset_max_age_seconds` `31536000`, and stale served on upstream failure. The payload declarations cover Brotli compression with gzip fallback, no re-compression of already-compressed media (`already_compressed_media_recompressed_present: false`), JS/CSS minified at build, dead code removed, client JS limited to needed interactivity, critical CSS inlined with the rest deferred, efficient image formats, the highest compression level for static assets, a low level for on-the-fly compression, and interactive JS of `200` KB gzipped. Delivery is edge-first with the static shell first and slow parts deferred, and the declared content-page CPU P99 is `0.5` ms. The security baseline is declared (CSP, HSTS, nosniff, frame protection, Referrer-Policy, HTTPS only, no secrets in client code or repos, bearer-token-protected write endpoints, escaped user-derived output, undefined-field guards, least-privilege tokens and bindings), and the process declarations cover staging deployed first and verified there, production promoted only on explicit go, post-ship efficiency confirmed with numbers, and no testing on the live site (`testing_done_on_live_site_present: false`).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/efficient-web-build-standard` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `EFFICIENT_WEB_BUILD_STANDARD_MET`: "49 pass, 0 fail, 0 missing of 49 checks across four sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `EFFICIENT_WEB_BUILD_STANDARD_NOT_MET` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "efficient-web-build-standard"}`.
3. Call: `POST https://atoms.pipavia.com/v1/efficient-web-build-standard` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/efficient-web-build-standard` with the `Authorization: Bearer <key>` header — the whole MCP surface on this gateway is key-gated, including `initialize` and `tools/list`.
2. Call `tools/call` with tool name `efficient_web_build_standard`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `EFFICIENT_WEB_BUILD_STANDARD_NOT_MET` means at least one check has status `fail`: a field is present but false/invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 4 checks fail: `every_shared_content_page_rendered_at_publish`, `every_precomputed_page_serves_single_read`, `interactive_js_within_stated_budget`, `content_page_cpu_p99_sub_millisecond`, and the summary reads "45 pass, 4 fail, 0 missing of 49 checks across four sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (see Output format). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where a number, list, object or boolean is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "payload.interactive_js_gzipped_kb",
  "detail": "payload.interactive_js_gzipped_kb must be a number"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/efficient-web-build-standard` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/efficient-web-build-standard` — tool name `efficient_web_build_standard`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `efficient_web_build_standard` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `EFFICIENT_WEB_BUILD_STANDARD_NOT_MET`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below exactly as SERVICE.md groups them — by the section that reads them. The manifest's section objects (`plan`, `precompute`, `calls`, `search`, `caching`, `payload`, `delivery`, `security`, `process`) are themselves objects — a present non-object value for one is rejected before evaluation.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `site` | string | Carried into the verdict output, not itself checked |

#### Read by: publish_time_precompute_and_calls

| Field | Type | Notes |
|---|---|---|
| `plan.call_count_stated` | boolean | — |
| `plan.per_request_work_stated` | boolean | — |
| `plan.cheaper_alternative_stated` | boolean | — |
| `plan.fragility_named` | boolean | — |
| `precompute.rebuild_triggered_by_publish_event` | boolean | — |
| `precompute.timer_or_per_visitor_primary_rebuild_present` | boolean | must be `false` to pass — the skill's one rule |
| `precompute.live_render_fallback_present` | boolean | — |
| `calls.await_in_loop_present` | boolean | must be `false` to pass |
| `calls.independent_calls_batched_or_avoided` | boolean | — |
| `calls.duplicate_upstream_fetches_coalesced` | boolean | — |
| `search.has_search_or_filter` | boolean (gate) | gates the single-index check below |
| `search.uses_single_publish_time_index_blob` | boolean | required when search/filter is declared present; otherwise the check passes as not applicable |
| `pages` | list | list of page-row objects, each with the entry fields below; computed, see below |
| `pages[].name` | string | names the row in the computed outputs |
| `pages[].content_same_for_all_visitors` | boolean (gate) | gates the publish-time rendering check below |
| `pages[].rendered_at_publish` | boolean | required `true` when the row's content is declared the same for all visitors; also gates the single-read check below |
| `pages[].calls_per_load` | number | must equal `1` for a row declared rendered at publish — an absent field on such a row is missing evidence |

#### Read by: caching_layers

| Field | Type | Notes |
|---|---|---|
| `caching.edge_cache_configured` | boolean | — |
| `caching.stale_while_revalidate_configured` | boolean | — |
| `caching.app_cache_scoped_to_authenticated_personalized` | boolean | — |
| `caching.db_cache_scoped_to_genuinely_dynamic` | boolean | — |
| `caching.hashed_static_assets_used` | boolean (gate) | gates the hashed-asset max-age check below |
| `caching.hashed_asset_max_age_seconds` | number | must equal `31536000` when hashed static assets are declared used — an absent field then is missing evidence; otherwise the check passes as not applicable |
| `caching.stale_served_on_upstream_failure` | boolean | — |

#### Read by: bytes_compression_and_client_code

| Field | Type | Notes |
|---|---|---|
| `payload.text_compression_brotli_gzip_fallback` | boolean | — |
| `payload.already_compressed_media_recompressed_present` | boolean | must be `false` to pass |
| `payload.js_css_minified_at_build` | boolean | — |
| `payload.dead_code_removed` | boolean | — |
| `payload.client_js_limited_to_needed_interactivity` | boolean | — |
| `payload.critical_css_inlined_rest_deferred` | boolean | — |
| `payload.images_efficient_formats_responsive_lazy` | boolean | — |
| `payload.static_assets_highest_compression_level` | boolean | — |
| `payload.on_the_fly_compression_low_level` | boolean | — |
| `payload.interactive_js_gzipped_kb` | number | the declared interactive JavaScript size in KB gzipped — must be at most `400` to pass the computed budget check, see below; an absent field is missing evidence |

#### Read by: delivery_security_and_process

| Field | Type | Notes |
|---|---|---|
| `delivery.edge_first_delivery` | boolean | — |
| `delivery.static_shell_first_slow_parts_deferred` | boolean | — |
| `delivery.content_page_cpu_p99_ms` | number | the declared content-page server CPU P99 in milliseconds — must be below `1` to pass the computed sub-millisecond check; an absent field is missing evidence |
| `security.csp_header_present` | boolean | — |
| `security.hsts_header_present` | boolean | — |
| `security.content_type_options_nosniff_present` | boolean | — |
| `security.frame_protection_present` | boolean | — |
| `security.referrer_policy_present` | boolean | — |
| `security.https_only` | boolean | — |
| `security.secrets_in_client_code_or_repos_present` | boolean | must be `false` to pass — skill baseline |
| `security.write_endpoints_bearer_token_protected` | boolean | — |
| `security.user_derived_output_escaped` | boolean | — |
| `security.undefined_field_guards_present` | boolean | — |
| `security.least_privilege_tokens_and_bindings` | boolean | — |
| `process.staging_deployed_first` | boolean | — |
| `process.staging_speed_and_correctness_verified` | boolean | — |
| `process.production_promoted_only_on_explicit_go` | boolean | — |
| `process.post_ship_efficiency_confirmed_with_numbers` | boolean | — |
| `process.testing_done_on_live_site_present` | boolean | must be `false` to pass — "never test on the live site" |

### Checks

All 49 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only: a conditional (gated) check whose gate is not triggered reports `pass` with evidence stating the gate was not declared — that is the not-applicable outcome. Section and verdict aggregation are defined under Verdict vocabulary.

#### Section: publish_time_precompute_and_calls

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `plan_call_count_stated` | process: the plan states the call count of the design — 'this path is N calls' is a required line | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `plan_per_request_work_stated` | process: the plan states the per-request work of the proposed design | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `plan_cheaper_alternative_stated` | process: the plan states the cheaper alternative where one exists | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `plan_fragility_named` | process: any free-tier or single-VM fragility is named explicitly so the trade-off is decided knowingly | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `rebuild_triggered_by_publish_event` | the one rule: the rebuild is triggered on the event that changes content — the publisher | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_timer_or_per_visitor_primary_rebuild` | the one rule: the rebuild is not triggered on a timer and not per visitor | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `live_render_fallback_present` | the one rule: a live-render fallback is kept so a missing artifact degrades to slow-but-working, never blank | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_await_in_loop` | minimize calls: no await in a loop when calls are independent | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `independent_calls_batched_or_avoided` | minimize calls: independent calls are batched to run concurrently, or avoided entirely by precomputing | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `duplicate_upstream_fetches_coalesced` | minimize calls: duplicate work is coalesced — one upstream fetch shared across consumers, not one per consumer | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `search_uses_single_publish_time_index` | minimize calls: search/filter loads one small index blob built at publish time in 1 call and filters in memory — no fan-out to per-item reads | Conditional on `search.has_search_or_filter`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the requirement is declared unmet (for per-row gates: a gated row declares it unmet). Missing: the gate is declared and the required field is absent (for per-row gates: absent on a gated row). |
| `pages_declared` | the one rule: the declared build record names its pages — the pages list is present and non-empty | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_shared_content_page_rendered_at_publish` | the one rule: every page declared with content the same for every visitor until content changes is rendered at publish/build time — do work once, not per request | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_precomputed_page_serves_single_read` | the one rule: every page declared rendered at publish/build time serves 1 read per request — calls_per_load equal to 1 | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
#### Section: caching_layers

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `edge_cache_configured` | caching: the edge/CDN cache — the cheapest layer — is configured for static assets and unauthenticated responses | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `stale_while_revalidate_configured` | caching: stale-while-revalidate is used so a cached copy serves instantly while a fresh one is fetched async — no first-visitor penalty | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `app_cache_scoped_to_authenticated_personalized` | caching: the app cache is used only for authenticated/personalized data that cannot live at the edge | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `db_cache_scoped_to_genuinely_dynamic` | caching: the DB/query cache — the most expensive layer — is used only for genuinely dynamic data | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `hashed_assets_use_immutable_year_cache` | caching: hashed static assets are served at Cache-Control max-age=31536000, immutable | Conditional on `caching.hashed_static_assets_used`. Pass: the gate is declared and the declared value equals `31536000` — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the declared value does not equal `31536000`. Missing: the gate is declared and the required field is absent. |
| `stale_served_on_upstream_failure` | caching: on upstream failure the last good cached value is served marked stale rather than blocking the user | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
#### Section: bytes_compression_and_client_code

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `text_assets_compressed_brotli_with_gzip_fallback` | compression: server-side compression is on for all text — HTML, CSS, JS, JSON, SVG — Brotli preferred, gzip fallback | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_recompression_of_already_compressed_media` | compression: already-compressed media — images, audio, video, fonts — is not re-compressed | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `js_css_minified_at_build` | compression: JS/CSS is minified at build time — readable source kept in the repo, the minified build shipped | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `dead_code_removed` | compression: dead code is removed — only what runs is shipped | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `client_js_limited_to_needed_interactivity` | compression: client JavaScript — the costliest byte — is zero or minimal, limited to the interactivity the site truly needs | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `critical_css_inlined_rest_deferred` | compression: critical CSS is inlined and the rest deferred | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `images_efficient_formats_responsive_lazy` | compression: images are AVIF/WebP, in responsive sizes, lazy-loaded | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `static_assets_highest_compression_level` | compression: the highest compression levels are used for static assets compressed once at build time | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `on_the_fly_compression_uses_low_level` | compression: lower compression levels are used for anything compressed on-the-fly per request, where CPU time would otherwise delay delivery | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `interactive_js_within_stated_budget` | payload budget: the declared interactive JavaScript is at most 400 KB gzipped — the upper end of the skill's stated budget of ~300-400KB gzipped | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
#### Section: delivery_security_and_process

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `edge_first_delivery` | speed: delivery is edge-first — served from the nearest POP | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `static_shell_first_slow_parts_deferred` | speed: the static shell is served first and the slow parts are streamed or deferred rather than blocking the whole response on the slowest dependency | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `content_page_cpu_p99_sub_millisecond` | speed: the declared content-page server CPU P99 is sub-millisecond — below 1 ms, the skill's stated target for content pages | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `csp_header_present` | security baseline: Content-Security-Policy — the tightest that works — is present on every response | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `hsts_header_present` | security baseline: Strict-Transport-Security (HSTS) is present on every response | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `content_type_options_nosniff_present` | security baseline: X-Content-Type-Options: nosniff is present on every response | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `frame_protection_present` | security baseline: X-Frame-Options / frame-ancestors protection is present on every response | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `referrer_policy_present` | security baseline: Referrer-Policy is present on every response | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `https_only` | security baseline: HTTPS only | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_secrets_in_client_code_or_repos` | security baseline: no secrets in client code or repos — platform secrets are used | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `write_endpoints_bearer_token_protected` | security baseline: write/rebuild endpoints are protected with a bearer token | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `user_derived_output_escaped` | security baseline: all user/content-derived output is escaped | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `undefined_field_guards_present` | security baseline: output is guarded against undefined fields so one bad record cannot crash the page | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `least_privilege_tokens_and_bindings` | security baseline: least privilege on tokens and bindings | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `staging_deployed_first` | process: the build is deployed to a non-production staging URL first | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `staging_speed_and_correctness_verified` | process: speed and correctness are verified on staging — call count and CPU checked in analytics | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `production_promoted_only_on_explicit_go` | process: production is promoted only on explicit go | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `post_ship_efficiency_confirmed_with_numbers` | process: after shipping, the efficiency improvement is confirmed with numbers — calls down, CPU down, bytes down — never claimed without the numbers | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_testing_on_live_site` | process: testing is never done on the live site | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"efficient-web-build-standard"`), `atom_version` (`"0.1.0"`), and `site` (the manifest's declared site value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `pages_count` (the declared list length as an integer, or null when the list is not declared); the row-name lists `shared_pages_not_precomputed` (shared-content rows whose `rendered_at_publish` is present but not `true`; a shared row with the field absent is missing evidence and does not appear) and `precomputed_pages_over_single_read` (precomputed rows whose declared `calls_per_load` is a number other than 1) — null when the `pages` list is not declared; `total_calls_per_load` and `max_calls_per_load` (the sum and maximum of the declared `calls_per_load` values over rows that declare one; null when the list is not declared or no row declares a call count); the ratios `precomputed_page_coverage` (pages declared rendered at publish ÷ declared pages) and `single_read_page_coverage` (pages declaring `calls_per_load` equal to 1 ÷ declared pages) — strings with exactly six decimal places, null when the denominator list is absent or empty; and the declared numbers echoed back as `interactive_js_gzipped_kb` and `content_page_cpu_p99_ms` (null when not declared). Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "49 pass, 0 fail, 0 missing of 49 checks across four sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared site value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `EFFICIENT_WEB_BUILD_STANDARD_MET` — all 49 checks pass: the declared web-build record is complete and consistent with the skill's standard.
- `EFFICIENT_WEB_BUILD_STANDARD_NOT_MET` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (the six primary computed checks only — `pages_declared`, `every_shared_content_page_rendered_at_publish`, `every_precomputed_page_serves_single_read`, `hashed_assets_use_immutable_year_cache`, `interactive_js_within_stated_budget`, `content_page_cpu_p99_sub_millisecond`): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one primary computed check cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes (including gated checks passing as not applicable); `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence (for gated checks: met, or the gate was not triggered — not applicable); `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

### Errors

Error bodies are the gateway's recorded shapes (`rails/gateway/src/callpath.ts`); a failed call is not metered.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | No key, or the key does not verify. On the MCP face the body is `{"error": "missing or invalid gateway API key"}`. |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the efficient_web_build_standard scope; issue it for this atom first"}` | The key is valid but does not hold this atom's scope. Issue the key for this atom (see How-to) and retry. On the MCP face the body is `{"error": "this key does not hold the efficient_web_build_standard scope"}`. |
| 422 | `{"ok":false,"error":"invalid_input","field":"payload.interactive_js_gzipped_kb","detail":"payload.interactive_js_gzipped_kb must be a number"}` (this atom's recorded malformed run; the shape is `{"ok": false, "error": "invalid_input", "field": "<field>", "detail": "<field> must be a <type>"}`) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. Via MCP `tools/call`, the same failure surfaces as a JSON-RPC error with code `-32602` carrying the detail message. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for efficient-web-build-standard exceeded"}` (or the `10000/day` variant) | Per-key rate limit exceeded for this atom; the call is not metered. Via MCP `tools/call` it surfaces as a JSON-RPC error with code `-32029`. |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Build and render every site as if compute, bandwidth, energy, and storage are finite and paid — fast, light pages that still look like a million dollars (the bound `efficient-web-builder` skill's capability, as stated in SERVICE.md). You submit one declared record — the web-build manifest — and the atom audits that record for completeness and internal consistency against the bound skill's stated rules, returning one deterministic verdict across 4 sections (`publish_time_precompute_and_calls`, `caching_layers`, `bytes_compression_and_client_code`, `delivery_security_and_process`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows and declared numbers themselves — list presence, per-row completeness and consistency, and the skill's own stated values applied exactly as stated (1 read per precomputed page, hashed-asset max-age `31536000`, interactive JS at most the stated upper end `400` KB gzipped, content-page CPU P99 below `1` ms) — using only the declared record, with no outside threshold imported. *Conditional checks* bind only when their declared gate field says the situation applies; when the gate is not triggered they pass as not applicable, and their evidence text says so. Aggregation is strict: any `fail` anywhere produces `EFFICIENT_WEB_BUILD_STANDARD_NOT_MET`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `EFFICIENT_WEB_BUILD_STANDARD_MET`. The central semantic is the absent/false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented beyond the skill's own stated values applied above. Declined, as named in SERVICE.md: a TTFB target in milliseconds (the skill describes edge TTFB as "tens of ms" and origin SSR as "hundreds of ms" descriptively, and states no TTFB bar — the only stated speed bar is the sub-millisecond CPU target, which is applied); a tighter interactive-JS ceiling at the 300 KB end of the skill's soft range, and any total-payload budget beyond interactive JS (the skill aims content sites "far lower" with no number); a compression-ratio or size-reduction percentage (the skill's ~60–80% text reduction, 15–25% Brotli-over-gzip advantage, 20–40% minification saving, and 40–60% typical unused-JS share are descriptive outcomes, not requirements); a numeric Brotli/gzip compression level (the skill names Brotli 11 only as an example of the highest levels — the level checks are attestations that the level is matched to how often the artifact is compressed, not a level value); `Cache-Control` max-age or stale-while-revalidate durations for ordinary (non-hashed) responses (the skill shows them as `...` placeholders with no values); a CPU P99 bar for dynamic or non-content pages (the skill's target is stated for content pages only, and the declared field is scoped to content pages); a minimum or maximum page count; and a coverage percentage below completeness over the caller's own declared rows.

**What it does NOT do.** The atom audits a **declared** web-build record: a verdict of `EFFICIENT_WEB_BUILD_STANDARD_MET` means the build meets the standard *on the caller's declared evidence* — a manifest that declares publish-time rendering, one read per page, Brotli compression, and sub-millisecond CPU passes those checks even if the real site does none of it. It is a completeness and consistency audit of the record the skill requires, **not a web build service or a live performance certification**: it builds no website, serves no page, runs no load test, reads no analytics, and does not verify that a declared control actually works. It never judges whether a page's content really is the same for every visitor, whether a page truly needs its interactivity or its client JS, whether a CSP is the tightest that works, whether the declared cheaper alternative really is cheaper, or whether compressing a given artifact is a net energy win — those judgment-shaped parts are carried as caller declarations only, never judged by the atom. Named exclusions: no numeric thresholds beyond the skill's own stated values (see the declined list above); no live verification of any declared fact; no measurement of real calls, bytes, CPU, or TTFB; platform-specific notes in the skill (Cloudflare KV / Cache API / Cron-as-backstop, the OCI no-Docker and single-VM rules) are not checked as platform facts — the record checks the platform-neutral declarations they motivate (publish-event rebuild trigger, fallback, fragility named); framework choice ("avoid frameworks when a Worker + a renderer will do") is a judgment the atom does not make — the record checks only that client JS is declared limited to needed interactivity and within the stated budget; design quality and polish ("still look like a million dollars") are not reducible to declared fields and are not judged.

**Buyer and use context.** Teams and agents working in Engineering & code who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: product site performance builds. Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulator view: N/A — this atom audits a declared web-build record; its verdict is a completeness and consistency judgment on declared evidence, not compliance or audit evidence, it is explicitly not a live performance certification, and web-build efficiency is not a regulated domain. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `efficient_web_build_standard` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/efficient_web_build_standard.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_efficient_web_build_standard.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/efficient-web-build-standard` (REST) and `POST /mcp/efficient-web-build-standard` (MCP, tool `efficient_web_build_standard`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification. Key scope: `efficient_web_build_standard`. Rate limits: 60/minute, 10,000/day per key per atom (429 `rate_limit`, not metered). Error monitoring: watch 401 `unauthorized` (key problems), 403 `scope_required` (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live — release candidate, one-week RC soak to 2026-11-22; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Worked examples

Provenance: recorded 2026-11-16T04:27:03.893285+00:00 against gateway v1.1.0, external verification lane, source `verification/work/efficient-web-build-standard/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Input:

```json
{
  "site": "example.com",
  "plan": {
    "call_count_stated": true,
    "per_request_work_stated": true,
    "cheaper_alternative_stated": true,
    "fragility_named": true
  },
  "precompute": {
    "rebuild_triggered_by_publish_event": true,
    "timer_or_per_visitor_primary_rebuild_present": false,
    "live_render_fallback_present": true
  },
  "calls": {
    "await_in_loop_present": false,
    "independent_calls_batched_or_avoided": true,
    "duplicate_upstream_fetches_coalesced": true
  },
  "search": {
    "has_search_or_filter": true,
    "uses_single_publish_time_index_blob": true
  },
  "pages": [
    {
      "name": "home",
      "content_same_for_all_visitors": true,
      "rendered_at_publish": true,
      "calls_per_load": 1
    }
  ],
  "caching": {
    "edge_cache_configured": true,
    "stale_while_revalidate_configured": true,
    "app_cache_scoped_to_authenticated_personalized": true,
    "db_cache_scoped_to_genuinely_dynamic": true,
    "hashed_static_assets_used": true,
    "hashed_asset_max_age_seconds": 31536000,
    "stale_served_on_upstream_failure": true
  },
  "payload": {
    "text_compression_brotli_gzip_fallback": true,
    "already_compressed_media_recompressed_present": false,
    "js_css_minified_at_build": true,
    "dead_code_removed": true,
    "client_js_limited_to_needed_interactivity": true,
    "critical_css_inlined_rest_deferred": true,
    "images_efficient_formats_responsive_lazy": true,
    "static_assets_highest_compression_level": true,
    "on_the_fly_compression_low_level": true,
    "interactive_js_gzipped_kb": 200
  },
  "delivery": {
    "edge_first_delivery": true,
    "static_shell_first_slow_parts_deferred": true,
    "content_page_cpu_p99_ms": 0.5
  },
  "security": {
    "csp_header_present": true,
    "hsts_header_present": true,
    "content_type_options_nosniff_present": true,
    "frame_protection_present": true,
    "referrer_policy_present": true,
    "https_only": true,
    "secrets_in_client_code_or_repos_present": false,
    "write_endpoints_bearer_token_protected": true,
    "user_derived_output_escaped": true,
    "undefined_field_guards_present": true,
    "least_privilege_tokens_and_bindings": true
  },
  "process": {
    "staging_deployed_first": true,
    "staging_speed_and_correctness_verified": true,
    "production_promoted_only_on_explicit_go": true,
    "post_ship_efficiency_confirmed_with_numbers": true,
    "testing_done_on_live_site_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "efficient-web-build-standard",
  "atom_version": "0.1.0",
  "site": "example.com",
  "verdict": "EFFICIENT_WEB_BUILD_STANDARD_MET",
  "sections": {
    "publish_time_precompute_and_calls": "pass",
    "caching_layers": "pass",
    "bytes_compression_and_client_code": "pass",
    "delivery_security_and_process": "pass"
  },
  "checks": [
    {
      "section": "publish_time_precompute_and_calls",
      "check": "plan_call_count_stated",
      "status": "pass",
      "evidence": "process: the plan states the call count of the design \u2014 'this path is N calls' is a required line"
    },
    {
      "section": "publish_time_precompute_and_calls",
      "check": "plan_per_request_work_stated",
      "status": "pass",
      "evidence": "process: the plan states the per-request work of the proposed design"
    },
    {
      "section": "publish_time_precompute_and_calls",
      "check": "plan_cheaper_alternative_stated",
      "status": "pass",
      "evidence": "process: the plan states the cheaper alternative where one exists"
    },
    {
      "section": "publish_time_precompute_and_calls",
      "check": "plan_fragility_named",
      "status": "pass",
      "evidence": "process: any free-tier or single-VM fragility is named explicitly so the trade-off is decided knowingly"
    },
    {
      "section": "publish_time_precompute_and_calls",
      "check": "rebuild_triggered_by_publish_event",
      "status": "pass",
      "evidence": "the one rule: the rebuild is triggered on the event that changes content \u2014 the publisher"
    },
    {
      "section": "publish_time_precompute_and_calls",
      "check": "no_timer_or_per_visitor_primary_rebuild",
      "status": "pass",
      "evidence": "the one rule: the rebuild is not triggered on a timer and not per visitor"
    },
    {
      "section": "publish_time_precompute_and_calls",
      "check": "live_render_fallback_present",
      "status": "pass",
      "evidence": "the one rule: a live-render fallback is kept so a missing artifact degrades to slow-but-working, never blank"
    },
    {
      "section": "publish_time_precompute_and_calls",
      "check": "no_await_in_loop",
      "status": "pass",
      "evidence": "minimize calls: no await in a loop when calls are independent"
    },
    {
      "section": "publish_time_precompute_and_calls",
      "check": "independent_calls_batched_or_avoided",
      "status": "pass",
      "evidence": "minimize calls: independent calls are batched to run concurrently, or avoided entirely by precomputing"
    },
    {
      "section": "publish_time_precompute_and_calls",
      "check": "duplicate_upstream_fetches_coalesced",
      "status": "pass",
      "evidence": "minimize calls: duplicate work is coalesced \u2014 one upstream fetch shared across consumers, not one per consumer"
    },
    {
      "section": "publish_time_precompute_and_calls",
      "check": "search_uses_single_publish_time_index",
      "status": "pass",
      "evidence": "minimize calls: search/filter loads one small index blob built at publish time in 1 call and filters in memory \u2014 no fan-out to per-item reads"
    },
    {
      "section": "publish_time_precompute_and_calls",
      "check": "pages_declared",
      "status": "pass",
      "evidence": "the one rule: the declared build record names its pages \u2014 the pages list is present and non-empty"
    },
    {
      "section": "publish_time_precompute_and_calls",
      "check": "every_shared_content_page_rendered_at_publish",
      "status": "pass",
      "evidence": "the one rule: every page declared with content the same for every visitor until content changes is rendered at publish/build time \u2014 do work once, not per request"
    },
    {
      "section": "publish_time_precompute_and_calls",
      "check": "every_precomputed_page_serves_single_read",
      "status": "pass",
      "evidence": "the one rule: every page declared rendered at publish/build time serves 1 read per request \u2014 calls_per_load equal to 1"
    },
    {
      "section": "caching_layers",
      "check": "edge_cache_configured",
      "status": "pass",
      "evidence": "caching: the edge/CDN cache \u2014 the cheapest layer \u2014 is configured for static assets and unauthenticated responses"
    },
    {
      "section": "caching_layers",
      "check": "stale_while_revalidate_configured",
      "status": "pass",
      "evidence": "caching: stale-while-revalidate is used so a cached copy serves instantly while a fresh one is fetched async \u2014 no first-visitor penalty"
    },
    {
      "section": "caching_layers",
      "check": "app_cache_scoped_to_authenticated_personalized",
      "status": "pass",
      "evidence": "caching: the app cache is used only for authenticated/personalized data that cannot live at the edge"
    },
    {
      "section": "caching_layers",
      "check": "db_cache_scoped_to_genuinely_dynamic",
      "status": "pass",
      "evidence": "caching: the DB/query cache \u2014 the most expensive layer \u2014 is used only for genuinely dynamic data"
    },
    {
      "section": "caching_layers",
      "check": "hashed_assets_use_immutable_year_cache",
      "status": "pass",
      "evidence": "caching: hashed static assets are served at Cache-Control max-age=31536000, immutable"
    },
    {
      "section": "caching_layers",
      "check": "stale_served_on_upstream_failure",
      "status": "pass",
      "evidence": "caching: on upstream failure the last good cached value is served marked stale rather than blocking the user"
    },
    {
      "section": "bytes_compression_and_client_code",
      "check": "text_assets_compressed_brotli_with_gzip_fallback",
      "status": "pass",
      "evidence": "compression: server-side compression is on for all text \u2014 HTML, CSS, JS, JSON, SVG \u2014 Brotli preferred, gzip fallback"
    },
    {
      "section": "bytes_compression_and_client_code",
      "check": "no_recompression_of_already_compressed_media",
      "status": "pass",
      "evidence": "compression: already-compressed media \u2014 images, audio, video, fonts \u2014 is not re-compressed"
    },
    {
      "section": "bytes_compression_and_client_code",
      "check": "js_css_minified_at_build",
      "status": "pass",
      "evidence": "compression: JS/CSS is minified at build time \u2014 readable source kept in the repo, the minified build shipped"
    },
    {
      "section": "bytes_compression_and_client_code",
      "check": "dead_code_removed",
      "status": "pass",
      "evidence": "compression: dead code is removed \u2014 only what runs is shipped"
    },
    {
      "section": "bytes_compression_and_client_code",
      "check": "client_js_limited_to_needed_interactivity",
      "status": "pass",
      "evidence": "compression: client JavaScript \u2014 the costliest byte \u2014 is zero or minimal, limited to the interactivity the site truly needs"
    },
    {
      "section": "bytes_compression_and_client_code",
      "check": "critical_css_inlined_rest_deferred",
      "status": "pass",
      "evidence": "compression: critical CSS is inlined and the rest deferred"
    },
    {
      "section": "bytes_compression_and_client_code",
      "check": "images_efficient_formats_responsive_lazy",
      "status": "pass",
      "evidence": "compression: images are AVIF/WebP, in responsive sizes, lazy-loaded"
    },
    {
      "section": "bytes_compression_and_client_code",
      "check": "static_assets_highest_compression_level",
      "status": "pass",
      "evidence": "compression: the highest compression levels are used for static assets compressed once at build time"
    },
    {
      "section": "bytes_compression_and_client_code",
      "check": "on_the_fly_compression_uses_low_level",
      "status": "pass",
      "evidence": "compression: lower compression levels are used for anything compressed on-the-fly per request, where CPU time would otherwise delay delivery"
    },
    {
      "section": "bytes_compression_and_client_code",
      "check": "interactive_js_within_stated_budget",
      "status": "pass",
      "evidence": "payload budget: the declared interactive JavaScript is at most 400 KB gzipped \u2014 the upper end of the skill's stated budget of ~300-400KB gzipped"
    },
    {
      "section": "delivery_security_and_process",
      "check": "edge_first_delivery",
      "status": "pass",
      "evidence": "speed: delivery is edge-first \u2014 served from the nearest POP"
    },
    {
      "section": "delivery_security_and_process",
      "check": "static_shell_first_slow_parts_deferred",
      "status": "pass",
      "evidence": "speed: the static shell is served first and the slow parts are streamed or deferred rather than blocking the whole response on the slowest dependency"
    },
    {
      "section": "delivery_security_and_process",
      "check": "content_page_cpu_p99_sub_millisecond",
      "status": "pass",
      "evidence": "speed: the declared content-page server CPU P99 is sub-millisecond \u2014 below 1 ms, the skill's stated target for content pages"
    },
    {
      "section": "delivery_security_and_process",
      "check": "csp_header_present",
      "status": "pass",
      "evidence": "security baseline: Content-Security-Policy \u2014 the tightest that works \u2014 is present on every response"
    },
    {
      "section": "delivery_security_and_process",
      "check": "hsts_header_present",
      "status": "pass",
      "evidence": "security baseline: Strict-Transport-Security (HSTS) is present on every response"
    },
    {
      "section": "delivery_security_and_process",
      "check": "content_type_options_nosniff_present",
      "status": "pass",
      "evidence": "security baseline: X-Content-Type-Options: nosniff is present on every response"
    },
    {
      "section": "delivery_security_and_process",
      "check": "frame_protection_present",
      "status": "pass",
      "evidence": "security baseline: X-Frame-Options / frame-ancestors protection is present on every response"
    },
    {
      "section": "delivery_security_and_process",
      "check": "referrer_policy_present",
      "status": "pass",
      "evidence": "security baseline: Referrer-Policy is present on every response"
    },
    {
      "section": "delivery_security_and_process",
      "check": "https_only",
      "status": "pass",
      "evidence": "security baseline: HTTPS only"
    },
    {
      "section": "delivery_security_and_process",
      "check": "no_secrets_in_client_code_or_repos",
      "status": "pass",
      "evidence": "security baseline: no secrets in client code or repos \u2014 platform secrets are used"
    },
    {
      "section": "delivery_security_and_process",
      "check": "write_endpoints_bearer_token_protected",
      "status": "pass",
      "evidence": "security baseline: write/rebuild endpoints are protected with a bearer token"
    },
    {
      "section": "delivery_security_and_process",
      "check": "user_derived_output_escaped",
      "status": "pass",
      "evidence": "security baseline: all user/content-derived output is escaped"
    },
    {
      "section": "delivery_security_and_process",
      "check": "undefined_field_guards_present",
      "status": "pass",
      "evidence": "security baseline: output is guarded against undefined fields so one bad record cannot crash the page"
    },
    {
      "section": "delivery_security_and_process",
      "check": "least_privilege_tokens_and_bindings",
      "status": "pass",
      "evidence": "security baseline: least privilege on tokens and bindings"
    },
    {
      "section": "delivery_security_and_process",
      "check": "staging_deployed_first",
      "status": "pass",
      "evidence": "process: the build is deployed to a non-production staging URL first"
    },
    {
      "section": "delivery_security_and_process",
      "check": "staging_speed_and_correctness_verified",
      "status": "pass",
      "evidence": "process: speed and correctness are verified on staging \u2014 call count and CPU checked in analytics"
    },
    {
      "section": "delivery_security_and_process",
      "check": "production_promoted_only_on_explicit_go",
      "status": "pass",
      "evidence": "process: production is promoted only on explicit go"
    },
    {
      "section": "delivery_security_and_process",
      "check": "post_ship_efficiency_confirmed_with_numbers",
      "status": "pass",
      "evidence": "process: after shipping, the efficiency improvement is confirmed with numbers \u2014 calls down, CPU down, bytes down \u2014 never claimed without the numbers"
    },
    {
      "section": "delivery_security_and_process",
      "check": "no_testing_on_live_site",
      "status": "pass",
      "evidence": "process: testing is never done on the live site"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "pages_count": 1,
  "shared_pages_not_precomputed": [],
  "precomputed_pages_over_single_read": [],
  "total_calls_per_load": 1,
  "max_calls_per_load": 1,
  "precomputed_page_coverage": "1.000000",
  "single_read_page_coverage": "1.000000",
  "interactive_js_gzipped_kb": 200,
  "content_page_cpu_p99_ms": 0.5,
  "summary": "49 pass, 0 fail, 0 missing of 49 checks across four sections.",
  "stamp": "EFFICIENT WEB BUILD STANDARD\nsite: example.com\nVERDICT: EFFICIENT_WEB_BUILD_STANDARD_MET\n  publish_time_precompute_and_calls    pass\n  caching_layers                       pass\n  bytes_compression_and_client_code    pass\n  delivery_security_and_process        pass\n49 pass, 0 fail, 0 missing of 49 checks across four sections."
}
```

### Example 2 — Violations (case `violations`)

Input:

```json
{
  "site": "example.com",
  "plan": {
    "call_count_stated": true,
    "per_request_work_stated": true,
    "cheaper_alternative_stated": true,
    "fragility_named": true
  },
  "precompute": {
    "rebuild_triggered_by_publish_event": true,
    "timer_or_per_visitor_primary_rebuild_present": false,
    "live_render_fallback_present": true
  },
  "calls": {
    "await_in_loop_present": false,
    "independent_calls_batched_or_avoided": true,
    "duplicate_upstream_fetches_coalesced": true
  },
  "search": {
    "has_search_or_filter": true,
    "uses_single_publish_time_index_blob": true
  },
  "pages": [
    {
      "name": "home",
      "content_same_for_all_visitors": true,
      "rendered_at_publish": false,
      "calls_per_load": 1
    },
    {
      "name": "product",
      "content_same_for_all_visitors": true,
      "rendered_at_publish": true,
      "calls_per_load": 5
    }
  ],
  "caching": {
    "edge_cache_configured": true,
    "stale_while_revalidate_configured": true,
    "app_cache_scoped_to_authenticated_personalized": true,
    "db_cache_scoped_to_genuinely_dynamic": true,
    "hashed_static_assets_used": true,
    "hashed_asset_max_age_seconds": 31536000,
    "stale_served_on_upstream_failure": true
  },
  "payload": {
    "text_compression_brotli_gzip_fallback": true,
    "already_compressed_media_recompressed_present": false,
    "js_css_minified_at_build": true,
    "dead_code_removed": true,
    "client_js_limited_to_needed_interactivity": true,
    "critical_css_inlined_rest_deferred": true,
    "images_efficient_formats_responsive_lazy": true,
    "static_assets_highest_compression_level": true,
    "on_the_fly_compression_low_level": true,
    "interactive_js_gzipped_kb": 500
  },
  "delivery": {
    "edge_first_delivery": true,
    "static_shell_first_slow_parts_deferred": true,
    "content_page_cpu_p99_ms": 2.0
  },
  "security": {
    "csp_header_present": true,
    "hsts_header_present": true,
    "content_type_options_nosniff_present": true,
    "frame_protection_present": true,
    "referrer_policy_present": true,
    "https_only": true,
    "secrets_in_client_code_or_repos_present": false,
    "write_endpoints_bearer_token_protected": true,
    "user_derived_output_escaped": true,
    "undefined_field_guards_present": true,
    "least_privilege_tokens_and_bindings": true
  },
  "process": {
    "staging_deployed_first": true,
    "staging_speed_and_correctness_verified": true,
    "production_promoted_only_on_explicit_go": true,
    "post_ship_efficiency_confirmed_with_numbers": true,
    "testing_done_on_live_site_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "efficient-web-build-standard",
  "atom_version": "0.1.0",
  "site": "example.com",
  "verdict": "EFFICIENT_WEB_BUILD_STANDARD_NOT_MET",
  "sections": {
    "publish_time_precompute_and_calls": "fail",
    "caching_layers": "pass",
    "bytes_compression_and_client_code": "fail",
    "delivery_security_and_process": "fail"
  },
  "checks": [
    {
      "section": "publish_time_precompute_and_calls",
      "check": "plan_call_count_stated",
      "status": "pass",
      "evidence": "process: the plan states the call count of the design \u2014 'this path is N calls' is a required line"
    },
    {
      "section": "publish_time_precompute_and_calls",
      "check": "plan_per_request_work_stated",
      "status": "pass",
      "evidence": "process: the plan states the per-request work of the proposed design"
    },
    {
      "section": "publish_time_precompute_and_calls",
      "check": "plan_cheaper_alternative_stated",
      "status": "pass",
      "evidence": "process: the plan states the cheaper alternative where one exists"
    },
    {
      "section": "publish_time_precompute_and_calls",
      "check": "plan_fragility_named",
      "status": "pass",
      "evidence": "process: any free-tier or single-VM fragility is named explicitly so the trade-off is decided knowingly"
    },
    {
      "section": "publish_time_precompute_and_calls",
      "check": "rebuild_triggered_by_publish_event",
      "status": "pass",
      "evidence": "the one rule: the rebuild is triggered on the event that changes content \u2014 the publisher"
    },
    {
      "section": "publish_time_precompute_and_calls",
      "check": "no_timer_or_per_visitor_primary_rebuild",
      "status": "pass",
      "evidence": "the one rule: the rebuild is not triggered on a timer and not per visitor"
    },
    {
      "section": "publish_time_precompute_and_calls",
      "check": "live_render_fallback_present",
      "status": "pass",
      "evidence": "the one rule: a live-render fallback is kept so a missing artifact degrades to slow-but-working, never blank"
    },
    {
      "section": "publish_time_precompute_and_calls",
      "check": "no_await_in_loop",
      "status": "pass",
      "evidence": "minimize calls: no await in a loop when calls are independent"
    },
    {
      "section": "publish_time_precompute_and_calls",
      "check": "independent_calls_batched_or_avoided",
      "status": "pass",
      "evidence": "minimize calls: independent calls are batched to run concurrently, or avoided entirely by precomputing"
    },
    {
      "section": "publish_time_precompute_and_calls",
      "check": "duplicate_upstream_fetches_coalesced",
      "status": "pass",
      "evidence": "minimize calls: duplicate work is coalesced \u2014 one upstream fetch shared across consumers, not one per consumer"
    },
    {
      "section": "publish_time_precompute_and_calls",
      "check": "search_uses_single_publish_time_index",
      "status": "pass",
      "evidence": "minimize calls: search/filter loads one small index blob built at publish time in 1 call and filters in memory \u2014 no fan-out to per-item reads"
    },
    {
      "section": "publish_time_precompute_and_calls",
      "check": "pages_declared",
      "status": "pass",
      "evidence": "the one rule: the declared build record names its pages \u2014 the pages list is present and non-empty"
    },
    {
      "section": "publish_time_precompute_and_calls",
      "check": "every_shared_content_page_rendered_at_publish",
      "status": "fail",
      "evidence": "the one rule: every page declared with content the same for every visitor until content changes is rendered at publish/build time \u2014 do work once, not per request"
    },
    {
      "section": "publish_time_precompute_and_calls",
      "check": "every_precomputed_page_serves_single_read",
      "status": "fail",
      "evidence": "the one rule: every page declared rendered at publish/build time serves 1 read per request \u2014 calls_per_load equal to 1"
    },
    {
      "section": "caching_layers",
      "check": "edge_cache_configured",
      "status": "pass",
      "evidence": "caching: the edge/CDN cache \u2014 the cheapest layer \u2014 is configured for static assets and unauthenticated responses"
    },
    {
      "section": "caching_layers",
      "check": "stale_while_revalidate_configured",
      "status": "pass",
      "evidence": "caching: stale-while-revalidate is used so a cached copy serves instantly while a fresh one is fetched async \u2014 no first-visitor penalty"
    },
    {
      "section": "caching_layers",
      "check": "app_cache_scoped_to_authenticated_personalized",
      "status": "pass",
      "evidence": "caching: the app cache is used only for authenticated/personalized data that cannot live at the edge"
    },
    {
      "section": "caching_layers",
      "check": "db_cache_scoped_to_genuinely_dynamic",
      "status": "pass",
      "evidence": "caching: the DB/query cache \u2014 the most expensive layer \u2014 is used only for genuinely dynamic data"
    },
    {
      "section": "caching_layers",
      "check": "hashed_assets_use_immutable_year_cache",
      "status": "pass",
      "evidence": "caching: hashed static assets are served at Cache-Control max-age=31536000, immutable"
    },
    {
      "section": "caching_layers",
      "check": "stale_served_on_upstream_failure",
      "status": "pass",
      "evidence": "caching: on upstream failure the last good cached value is served marked stale rather than blocking the user"
    },
    {
      "section": "bytes_compression_and_client_code",
      "check": "text_assets_compressed_brotli_with_gzip_fallback",
      "status": "pass",
      "evidence": "compression: server-side compression is on for all text \u2014 HTML, CSS, JS, JSON, SVG \u2014 Brotli preferred, gzip fallback"
    },
    {
      "section": "bytes_compression_and_client_code",
      "check": "no_recompression_of_already_compressed_media",
      "status": "pass",
      "evidence": "compression: already-compressed media \u2014 images, audio, video, fonts \u2014 is not re-compressed"
    },
    {
      "section": "bytes_compression_and_client_code",
      "check": "js_css_minified_at_build",
      "status": "pass",
      "evidence": "compression: JS/CSS is minified at build time \u2014 readable source kept in the repo, the minified build shipped"
    },
    {
      "section": "bytes_compression_and_client_code",
      "check": "dead_code_removed",
      "status": "pass",
      "evidence": "compression: dead code is removed \u2014 only what runs is shipped"
    },
    {
      "section": "bytes_compression_and_client_code",
      "check": "client_js_limited_to_needed_interactivity",
      "status": "pass",
      "evidence": "compression: client JavaScript \u2014 the costliest byte \u2014 is zero or minimal, limited to the interactivity the site truly needs"
    },
    {
      "section": "bytes_compression_and_client_code",
      "check": "critical_css_inlined_rest_deferred",
      "status": "pass",
      "evidence": "compression: critical CSS is inlined and the rest deferred"
    },
    {
      "section": "bytes_compression_and_client_code",
      "check": "images_efficient_formats_responsive_lazy",
      "status": "pass",
      "evidence": "compression: images are AVIF/WebP, in responsive sizes, lazy-loaded"
    },
    {
      "section": "bytes_compression_and_client_code",
      "check": "static_assets_highest_compression_level",
      "status": "pass",
      "evidence": "compression: the highest compression levels are used for static assets compressed once at build time"
    },
    {
      "section": "bytes_compression_and_client_code",
      "check": "on_the_fly_compression_uses_low_level",
      "status": "pass",
      "evidence": "compression: lower compression levels are used for anything compressed on-the-fly per request, where CPU time would otherwise delay delivery"
    },
    {
      "section": "bytes_compression_and_client_code",
      "check": "interactive_js_within_stated_budget",
      "status": "fail",
      "evidence": "payload budget: the declared interactive JavaScript is at most 400 KB gzipped \u2014 the upper end of the skill's stated budget of ~300-400KB gzipped"
    },
    {
      "section": "delivery_security_and_process",
      "check": "edge_first_delivery",
      "status": "pass",
      "evidence": "speed: delivery is edge-first \u2014 served from the nearest POP"
    },
    {
      "section": "delivery_security_and_process",
      "check": "static_shell_first_slow_parts_deferred",
      "status": "pass",
      "evidence": "speed: the static shell is served first and the slow parts are streamed or deferred rather than blocking the whole response on the slowest dependency"
    },
    {
      "section": "delivery_security_and_process",
      "check": "content_page_cpu_p99_sub_millisecond",
      "status": "fail",
      "evidence": "speed: the declared content-page server CPU P99 is sub-millisecond \u2014 below 1 ms, the skill's stated target for content pages"
    },
    {
      "section": "delivery_security_and_process",
      "check": "csp_header_present",
      "status": "pass",
      "evidence": "security baseline: Content-Security-Policy \u2014 the tightest that works \u2014 is present on every response"
    },
    {
      "section": "delivery_security_and_process",
      "check": "hsts_header_present",
      "status": "pass",
      "evidence": "security baseline: Strict-Transport-Security (HSTS) is present on every response"
    },
    {
      "section": "delivery_security_and_process",
      "check": "content_type_options_nosniff_present",
      "status": "pass",
      "evidence": "security baseline: X-Content-Type-Options: nosniff is present on every response"
    },
    {
      "section": "delivery_security_and_process",
      "check": "frame_protection_present",
      "status": "pass",
      "evidence": "security baseline: X-Frame-Options / frame-ancestors protection is present on every response"
    },
    {
      "section": "delivery_security_and_process",
      "check": "referrer_policy_present",
      "status": "pass",
      "evidence": "security baseline: Referrer-Policy is present on every response"
    },
    {
      "section": "delivery_security_and_process",
      "check": "https_only",
      "status": "pass",
      "evidence": "security baseline: HTTPS only"
    },
    {
      "section": "delivery_security_and_process",
      "check": "no_secrets_in_client_code_or_repos",
      "status": "pass",
      "evidence": "security baseline: no secrets in client code or repos \u2014 platform secrets are used"
    },
    {
      "section": "delivery_security_and_process",
      "check": "write_endpoints_bearer_token_protected",
      "status": "pass",
      "evidence": "security baseline: write/rebuild endpoints are protected with a bearer token"
    },
    {
      "section": "delivery_security_and_process",
      "check": "user_derived_output_escaped",
      "status": "pass",
      "evidence": "security baseline: all user/content-derived output is escaped"
    },
    {
      "section": "delivery_security_and_process",
      "check": "undefined_field_guards_present",
      "status": "pass",
      "evidence": "security baseline: output is guarded against undefined fields so one bad record cannot crash the page"
    },
    {
      "section": "delivery_security_and_process",
      "check": "least_privilege_tokens_and_bindings",
      "status": "pass",
      "evidence": "security baseline: least privilege on tokens and bindings"
    },
    {
      "section": "delivery_security_and_process",
      "check": "staging_deployed_first",
      "status": "pass",
      "evidence": "process: the build is deployed to a non-production staging URL first"
    },
    {
      "section": "delivery_security_and_process",
      "check": "staging_speed_and_correctness_verified",
      "status": "pass",
      "evidence": "process: speed and correctness are verified on staging \u2014 call count and CPU checked in analytics"
    },
    {
      "section": "delivery_security_and_process",
      "check": "production_promoted_only_on_explicit_go",
      "status": "pass",
      "evidence": "process: production is promoted only on explicit go"
    },
    {
      "section": "delivery_security_and_process",
      "check": "post_ship_efficiency_confirmed_with_numbers",
      "status": "pass",
      "evidence": "process: after shipping, the efficiency improvement is confirmed with numbers \u2014 calls down, CPU down, bytes down \u2014 never claimed without the numbers"
    },
    {
      "section": "delivery_security_and_process",
      "check": "no_testing_on_live_site",
      "status": "pass",
      "evidence": "process: testing is never done on the live site"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "pages_count": 2,
  "shared_pages_not_precomputed": [
    "home"
  ],
  "precomputed_pages_over_single_read": [
    "product"
  ],
  "total_calls_per_load": 6,
  "max_calls_per_load": 5,
  "precomputed_page_coverage": "0.500000",
  "single_read_page_coverage": "0.500000",
  "interactive_js_gzipped_kb": 500,
  "content_page_cpu_p99_ms": 2,
  "summary": "45 pass, 4 fail, 0 missing of 49 checks across four sections.",
  "stamp": "EFFICIENT WEB BUILD STANDARD\nsite: example.com\nVERDICT: EFFICIENT_WEB_BUILD_STANDARD_NOT_MET\n  publish_time_precompute_and_calls    fail\n  caching_layers                       pass\n  bytes_compression_and_client_code    fail\n  delivery_security_and_process        fail\n45 pass, 4 fail, 0 missing of 49 checks across four sections."
}
```

### Example 3 — Malformed (case `malformed`)

Input:

```json
{
  "payload": {
    "interactive_js_gzipped_kb": "should-be-a-number"
  }
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "payload.interactive_js_gzipped_kb",
  "detail": "payload.interactive_js_gzipped_kb must be a number"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — this atom audits a declared web-build record; its verdict is not compliance or audit evidence and it is explicitly not a live performance certification |
| Checks named | 49 documented / 49 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses (not-applicable expressed as a gated `pass`) |
| Input reference typed | Yes — 54 fields, each with its type from SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/efficient-web-build-standard/evidence.json` |
