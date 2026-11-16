# Efficient web build standard — `efficient-web-build-standard`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Build and render every site as if compute, bandwidth, energy, and storage are finite and paid — fast, light pages that still look like a million dollars.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Product site performance builds**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the web-build manifest

The caller submits one JSON manifest: a declared web-build record
for one site. Every field below is read by the named section's
checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid =
the check fails (`EFFICIENT_WEB_BUILD_STANDARD_NOT_MET`). All
fields are booleans unless noted.

| Field | Read by |
|---|---|
| `site` (string; carried into the verdict output, not itself checked) | — |
| `plan.call_count_stated` | publish_time_precompute_and_calls |
| `plan.per_request_work_stated` | publish_time_precompute_and_calls |
| `plan.cheaper_alternative_stated` | publish_time_precompute_and_calls |
| `plan.fragility_named` | publish_time_precompute_and_calls |
| `precompute.rebuild_triggered_by_publish_event` | publish_time_precompute_and_calls |
| `precompute.timer_or_per_visitor_primary_rebuild_present` (must be `false` to pass — the skill's one rule) | publish_time_precompute_and_calls |
| `precompute.live_render_fallback_present` | publish_time_precompute_and_calls |
| `calls.await_in_loop_present` (must be `false` to pass) | publish_time_precompute_and_calls |
| `calls.independent_calls_batched_or_avoided` | publish_time_precompute_and_calls |
| `calls.duplicate_upstream_fetches_coalesced` | publish_time_precompute_and_calls |
| `search.has_search_or_filter` (gates the single-index check below) | publish_time_precompute_and_calls |
| `search.uses_single_publish_time_index_blob` (required when search/filter is declared present; otherwise the check passes as not applicable) | publish_time_precompute_and_calls |
| `pages` (list of page-row objects, each with the entry fields below; computed, see below) | publish_time_precompute_and_calls (computed outputs) |
| `pages[].name` (string; names the row in the computed outputs) | publish_time_precompute_and_calls (computed outputs) |
| `pages[].content_same_for_all_visitors` (gates the publish-time rendering check below) | publish_time_precompute_and_calls |
| `pages[].rendered_at_publish` (required `true` when the row's content is declared the same for all visitors; also gates the single-read check below) | publish_time_precompute_and_calls |
| `pages[].calls_per_load` (number; must equal `1` for a row declared rendered at publish — an absent field on such a row is missing evidence) | publish_time_precompute_and_calls |
| `caching.edge_cache_configured` | caching_layers |
| `caching.stale_while_revalidate_configured` | caching_layers |
| `caching.app_cache_scoped_to_authenticated_personalized` | caching_layers |
| `caching.db_cache_scoped_to_genuinely_dynamic` | caching_layers |
| `caching.hashed_static_assets_used` (gates the hashed-asset max-age check below) | caching_layers |
| `caching.hashed_asset_max_age_seconds` (number; must equal `31536000` when hashed static assets are declared used — an absent field then is missing evidence; otherwise the check passes as not applicable) | caching_layers |
| `caching.stale_served_on_upstream_failure` | caching_layers |
| `payload.text_compression_brotli_gzip_fallback` | bytes_compression_and_client_code |
| `payload.already_compressed_media_recompressed_present` (must be `false` to pass) | bytes_compression_and_client_code |
| `payload.js_css_minified_at_build` | bytes_compression_and_client_code |
| `payload.dead_code_removed` | bytes_compression_and_client_code |
| `payload.client_js_limited_to_needed_interactivity` | bytes_compression_and_client_code |
| `payload.critical_css_inlined_rest_deferred` | bytes_compression_and_client_code |
| `payload.images_efficient_formats_responsive_lazy` | bytes_compression_and_client_code |
| `payload.static_assets_highest_compression_level` | bytes_compression_and_client_code |
| `payload.on_the_fly_compression_low_level` | bytes_compression_and_client_code |
| `payload.interactive_js_gzipped_kb` (number; the declared interactive JavaScript size in KB gzipped — must be at most `400` to pass the computed budget check, see below; an absent field is missing evidence) | bytes_compression_and_client_code |
| `delivery.edge_first_delivery` | delivery_security_and_process |
| `delivery.static_shell_first_slow_parts_deferred` | delivery_security_and_process |
| `delivery.content_page_cpu_p99_ms` (number; the declared content-page server CPU P99 in milliseconds — must be below `1` to pass the computed sub-millisecond check; an absent field is missing evidence) | delivery_security_and_process |
| `security.csp_header_present` | delivery_security_and_process |
| `security.hsts_header_present` | delivery_security_and_process |
| `security.content_type_options_nosniff_present` | delivery_security_and_process |
| `security.frame_protection_present` | delivery_security_and_process |
| `security.referrer_policy_present` | delivery_security_and_process |
| `security.https_only` | delivery_security_and_process |
| `security.secrets_in_client_code_or_repos_present` (must be `false` to pass — skill baseline) | delivery_security_and_process |
| `security.write_endpoints_bearer_token_protected` | delivery_security_and_process |
| `security.user_derived_output_escaped` | delivery_security_and_process |
| `security.undefined_field_guards_present` | delivery_security_and_process |
| `security.least_privilege_tokens_and_bindings` | delivery_security_and_process |
| `process.staging_deployed_first` | delivery_security_and_process |
| `process.staging_speed_and_correctness_verified` | delivery_security_and_process |
| `process.production_promoted_only_on_explicit_go` | delivery_security_and_process |
| `process.post_ship_efficiency_confirmed_with_numbers` | delivery_security_and_process |
| `process.testing_done_on_live_site_present` (must be `false` to pass — "never test on the live site") | delivery_security_and_process |

Many checks are computed from the declared rows and declared
numbers, using only the skill's own stated rules plus the
consistency of the declared record itself — no outside threshold
is imported:

- **Pages declared:** the declared `pages` list passes only when
  it is present and non-empty; an absent list is missing
  evidence, an empty list fails.
- **Shared content rendered at publish:** every row with
  `content_same_for_all_visitors: true` must declare
  `rendered_at_publish: true` (the skill's one rule: "If a
  result is the same for every visitor until content changes,
  compute it at publish/build time"). A shared row with
  `rendered_at_publish` absent is missing evidence; portfolios
  with no shared-content rows pass as not applicable.
- **Single read per precomputed page:** every row declared
  rendered at publish must declare `calls_per_load` equal to
  `1` (the skill: "store finished HTML → serve 1 read per
  request"). A precomputed row with `calls_per_load` absent is
  missing evidence; rows not declared precomputed are not held
  to the single-read bar — genuinely dynamic pages may declare
  any call count.
- **Hashed assets at the stated max-age:** when
  `hashed_static_assets_used` is declared `true`,
  `hashed_asset_max_age_seconds` must equal `31536000` (the
  skill: "Hashed static assets: `Cache-Control:
  max-age=31536000, immutable`"). When no hashed static assets
  are declared, the check passes as not applicable.
- **Interactive JS within the stated budget:** the declared
  `interactive_js_gzipped_kb` must be at most `400` — the upper
  end of the skill's stated budget ("keep interactive JS ≤
  ~300–400KB gzipped"); the skill's figure is a soft range, and
  the atom applies its stated upper end as the ceiling rather
  than inventing a tighter number of its own.
- **Content-page CPU P99 sub-millisecond:** the declared
  `content_page_cpu_p99_ms` must be below `1` (the skill:
  "Target sub-millisecond server CPU for content pages").

Two check groups are conditional, following the skill's own
scoping — computed from the declared gate fields:

- **Search index:** the skill binds its one-blob rule to
  search/filter over a dataset. `uses_single_publish_time_index_blob`
  is therefore required only when `search.has_search_or_filter`
  is declared `true`; when no search or filter is declared, the
  check passes as not applicable.
- **Hashed-asset max-age:** as above, required only when hashed
  static assets are declared used.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the six primary computed checks above cannot be completed),
`pages_count` (the declared list length, or null when the list
is not declared — counts are reported as integers, exactly),
the row-name lists `shared_pages_not_precomputed` (shared-content
rows whose `rendered_at_publish` is present but not `true`; a
shared row with the field absent is missing evidence and does
not appear) and `precomputed_pages_over_single_read`
(precomputed rows whose declared `calls_per_load` is a number
other than 1), `total_calls_per_load` and `max_calls_per_load`
(the sum and maximum of the declared `calls_per_load` values
over rows that declare one; null when the list is not declared
or no row declares a call count), the coverage ratios
`precomputed_page_coverage` (pages declared rendered at publish
÷ declared pages) and `single_read_page_coverage` (pages
declaring `calls_per_load` equal to 1 ÷ declared pages), and
the declared numbers echoed back as `interactive_js_gzipped_kb`
and `content_page_cpu_p99_ms` (null when not declared).
**Fixed serialization rule:** computed ratios are reported as
strings with exactly six decimal places, produced in both
implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly
six decimals; comparisons use the unrounded values. A ratio is
null when its denominator list is absent or empty. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical.

The skill states no numeric pass/fail threshold beyond the ones
applied above exactly as stated (1 read per precomputed page,
hashed-asset max-age 31536000, interactive JS at most the stated
upper end 400 KB gzipped, content-page CPU P99 below 1 ms).
Declined thresholds, named: a TTFB target in milliseconds (the
skill describes edge TTFB as "tens of ms" and origin SSR as
"hundreds of ms" descriptively, and states no TTFB bar — the
only stated speed bar is the sub-millisecond CPU target, which
is applied); a tighter interactive-JS ceiling at the 300 KB end
of the skill's soft range, and any total-payload budget beyond
interactive JS (the skill aims content sites "far lower" with
no number); a compression-ratio or size-reduction percentage
(the skill's ~60–80% text reduction, 15–25% Brotli-over-gzip
advantage, 20–40% minification saving, and 40–60% typical
unused-JS share are descriptive outcomes, not requirements);
a numeric Brotli/gzip compression level (the skill names
Brotli 11 only as an example of the highest levels — the level
checks are attestations that the level is matched to how often
the artifact is compressed, not a level value); `Cache-Control`
max-age or stale-while-revalidate durations for ordinary
(non-hashed) responses (the skill shows them as `...`
placeholders with no values); a CPU P99 bar for dynamic or
non-content pages (the skill's target is stated for content
pages only, and the declared field is scoped to content
pages); a minimum or maximum page count; a coverage percentage
below completeness over the caller's own declared rows.

The verdict is one of `EFFICIENT_WEB_BUILD_STANDARD_MET` (all
49 checks pass), `EFFICIENT_WEB_BUILD_STANDARD_NOT_MET` (any
check fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but
evidence is missing), across four sections:
publish_time_precompute_and_calls, caching_layers,
bytes_compression_and_client_code, delivery_security_and_process.

## Honest scoping

This atom audits a **declared** web-build record — it builds no
website, serves no page, runs no load test, reads no analytics,
and does not verify that a declared control actually works. A
build meets the standard *on the caller's declared evidence*: a
manifest that declares publish-time rendering, one read per
page, Brotli compression, and sub-millisecond CPU passes those
checks even if the real site does none of it. It is a
completeness and consistency audit of the record the skill
requires, **not a web build service or a live performance
certification**: it never judges whether a page's content
really is the same for every visitor, whether a page truly
needs its interactivity or its client JS, whether a CSP is the
tightest that works, whether the declared cheaper alternative
really is cheaper, or whether compressing a given artifact is
a net energy win — those judgment-shaped parts are carried as
caller declarations only (the gate and attestation fields
above), never judged by the atom.

Named exclusions: no numeric thresholds beyond the skill's own
stated values (see the declined list above); no live
verification of any declared fact; no measurement of real
calls, bytes, CPU, or TTFB; platform-specific notes in the
skill (Cloudflare KV / Cache API / Cron-as-backstop, the OCI
no-Docker and single-VM rules) are not checked as platform
facts — the record checks the platform-neutral declarations
they motivate (publish-event rebuild trigger, fallback,
fragility named); framework choice ("avoid frameworks when a
Worker + a renderer will do") is a judgment the atom does not
make — the record checks only that client JS is declared
limited to needed interactivity and within the stated budget;
design quality and polish ("still look like a million dollars")
are not reducible to declared fields and are not judged.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.
