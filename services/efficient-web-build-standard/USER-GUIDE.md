# Efficient web build standard — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have a web build and a record of how it was built — what is precomputed at publish time, how calls, caching, bytes and delivery are handled, and whether the security and process baselines were followed. This atom reads one declared manifest and returns one deterministic verdict across four sections: **EFFICIENT_WEB_BUILD_STANDARD_MET**, **EFFICIENT_WEB_BUILD_STANDARD_NOT_MET**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared record's completeness and consistency only — it builds no website, serves no page, runs no load test, reads no analytics, and does not verify that a declared control actually works. A build meets the standard *on your declared evidence*: it never judges whether a page's content really is the same for every visitor, whether a page truly needs its interactivity or its client JS, whether a CSP is the tightest that works, whether the declared cheaper alternative really is cheaper, or whether compressing a given artifact is a net energy win. Computed checks: the declared `pages` list must be present and non-empty; every shared-content page must be declared rendered at publish; every precomputed page must declare `calls_per_load` equal to `1`; when hashed static assets are declared used, `hashed_asset_max_age_seconds` must equal `31536000`; the declared `interactive_js_gzipped_kb` must be at most `400` (the upper end of the skill's stated budget of ~300–400KB gzipped); and the declared `content_page_cpu_p99_ms` must be below `1`. Two checks are conditional: the single publish-time search index is required only when search/filter is declared present, and the hashed-asset max-age only when hashed static assets are declared used. No other numeric threshold is imposed — the skill states no TTFB bar (its only stated speed bar is the sub-millisecond CPU target, which is applied), no tighter JS ceiling at the 300 KB end of its soft range, no total-payload budget beyond interactive JS, no compression-ratio bar, no numeric compression level, no max-age or stale-while-revalidate duration for ordinary responses, no CPU bar for dynamic or non-content pages, and no page-count or coverage-percentage bar beyond completeness over your own declared rows. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "efficient-web-build-standard"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/efficient-web-build-standard` — tool name `efficient_web_build_standard`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/efficient-web-build-standard` — body = the manifest object; same `Authorization` header.

## Input — the efficient-web-build-standard manifest

| Field | Meaning |
|---|---|
| `site` | site name (string; carried into the output, not checked) |
| `plan.call_count_stated` | plan evidence: the plan states the call count of the design |
| `plan.per_request_work_stated` | plan evidence: the plan states the per-request work |
| `plan.cheaper_alternative_stated` | plan evidence: the plan states the cheaper alternative where one exists |
| `plan.fragility_named` | plan evidence: any free-tier / single-VM fragility is named |
| `precompute.rebuild_triggered_by_publish_event` | rebuild is triggered by the publish event that changes content |
| `precompute.timer_or_per_visitor_primary_rebuild_present` | must be `false` to pass (anti-pattern: primary rebuild on a timer or per visitor) |
| `precompute.live_render_fallback_present` | a live-render fallback is kept so a missing artifact degrades to slow-but-working |
| `calls.await_in_loop_present` | must be `false` to pass (anti-pattern: awaiting independent calls in a loop) |
| `calls.independent_calls_batched_or_avoided` | independent calls are batched to run concurrently, or avoided by precomputing |
| `calls.duplicate_upstream_fetches_coalesced` | duplicate upstream fetches are coalesced into one shared fetch |
| `search.has_search_or_filter` | gate: declares whether search or filter over a dataset is present |
| `search.uses_single_publish_time_index_blob` | required `true` only when `search.has_search_or_filter` is `true`; otherwise passes as not applicable |
| `pages` (list of page-row objects) | computed: must be present and non-empty; reported as `pages_count` |
| `pages[].name` (string) | names the row in the computed outputs |
| `pages[].content_same_for_all_visitors` | gate: declares the row's content is the same for all visitors |
| `pages[].rendered_at_publish` | computed: required `true` when the row's content is declared the same for all visitors; also gates the single-read check |
| `pages[].calls_per_load` (number) | computed: must equal `1` for a row declared rendered at publish; an absent field on such a row is missing evidence |
| `caching.edge_cache_configured` | caching evidence: the edge/CDN cache is configured |
| `caching.stale_while_revalidate_configured` | caching evidence: stale-while-revalidate is configured |
| `caching.app_cache_scoped_to_authenticated_personalized` | caching evidence: the app cache is scoped only to authenticated/personalized data |
| `caching.db_cache_scoped_to_genuinely_dynamic` | caching evidence: the DB/query cache is scoped only to genuinely dynamic data |
| `caching.hashed_static_assets_used` | gate: declares whether hashed static assets are used |
| `caching.hashed_asset_max_age_seconds` (number) | computed: must equal `31536000` when hashed static assets are declared used; an absent field then is missing evidence; otherwise passes as not applicable |
| `caching.stale_served_on_upstream_failure` | caching evidence: the last good cached value is served stale on upstream failure |
| `payload.text_compression_brotli_gzip_fallback` | payload evidence: text is compressed with Brotli and a gzip fallback |
| `payload.already_compressed_media_recompressed_present` | must be `false` to pass (anti-pattern: re-compressing already-compressed media) |
| `payload.js_css_minified_at_build` | payload evidence: JS/CSS is minified at build time |
| `payload.dead_code_removed` | payload evidence: dead code is removed |
| `payload.client_js_limited_to_needed_interactivity` | payload evidence: client JS is limited to needed interactivity |
| `payload.critical_css_inlined_rest_deferred` | payload evidence: critical CSS is inlined and the rest deferred |
| `payload.images_efficient_formats_responsive_lazy` | payload evidence: images use efficient formats, responsive sizes and lazy loading |
| `payload.static_assets_highest_compression_level` | payload evidence: static assets use the highest compression level |
| `payload.on_the_fly_compression_low_level` | payload evidence: on-the-fly compression uses a low level |
| `payload.interactive_js_gzipped_kb` (number) | computed: the declared interactive JavaScript size in KB gzipped; must be at most `400` to pass; an absent field is missing evidence |
| `delivery.edge_first_delivery` | delivery evidence: delivery is edge-first |
| `delivery.static_shell_first_slow_parts_deferred` | delivery evidence: the static shell is served first and slow parts are deferred |
| `delivery.content_page_cpu_p99_ms` (number) | computed: the declared content-page server CPU P99 in milliseconds; must be below `1` to pass; an absent field is missing evidence |
| `security.csp_header_present` | security evidence: Content-Security-Policy header is present |
| `security.hsts_header_present` | security evidence: HSTS header is present |
| `security.content_type_options_nosniff_present` | security evidence: X-Content-Type-Options: nosniff is present |
| `security.frame_protection_present` | security evidence: frame protection is present |
| `security.referrer_policy_present` | security evidence: Referrer-Policy is present |
| `security.https_only` | security evidence: HTTPS only |
| `security.secrets_in_client_code_or_repos_present` | must be `false` to pass (anti-pattern: secrets in client code or repos) |
| `security.write_endpoints_bearer_token_protected` | security evidence: write endpoints are bearer-token protected |
| `security.user_derived_output_escaped` | security evidence: user-derived output is escaped |
| `security.undefined_field_guards_present` | security evidence: guards against undefined fields are present |
| `security.least_privilege_tokens_and_bindings` | security evidence: least-privilege tokens and bindings are used |
| `process.staging_deployed_first` | process evidence: the build was deployed to staging first |
| `process.staging_speed_and_correctness_verified` | process evidence: speed and correctness were verified on staging |
| `process.production_promoted_only_on_explicit_go` | process evidence: production was promoted only on explicit go |
| `process.post_ship_efficiency_confirmed_with_numbers` | process evidence: post-ship efficiency was confirmed with numbers |
| `process.testing_done_on_live_site_present` | must be `false` to pass (anti-pattern: testing done on the live site) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward EFFICIENT_WEB_BUILD_STANDARD_NOT_MET). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/efficient-web-build-standard`:

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

Response — HTTP 200:

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

## Verdicts

- **EFFICIENT_WEB_BUILD_STANDARD_MET** — every check passes; the declared web-build record is complete and consistent with the skill's standard.
- **EFFICIENT_WEB_BUILD_STANDARD_NOT_MET** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `pages_count` (the declared list length as an integer, or null when the list is not declared), the row-name lists `shared_pages_not_precomputed` and `precomputed_pages_over_single_read` (null when the `pages` list is not declared), `total_calls_per_load` and `max_calls_per_load` (the sum and maximum of the declared `calls_per_load` values over rows that declare one, or null when the list is not declared or no row declares a call count), the coverage ratios `precomputed_page_coverage` and `single_read_page_coverage` (ratios as strings with exactly six decimal places; null when the denominator list is absent or empty), the declared numbers echoed back as `interactive_js_gzipped_kb` and `content_page_cpu_p99_ms` (null when not declared), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the six primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
