#!/usr/bin/env python3
"""Efficient web build standard — deterministic core.

Built from the bound skill `efficient-web-builder`: "Build and
render every site as if compute, bandwidth, energy, and storage
are finite and paid — because for Nrupal they are."

This atom is an AUDIT of a declared web-build record: it validates
the record a caller declares against the skill's sections —
publish-time precompute and call discipline, layered caching,
bytes / compression / client code, and delivery, security and
process. It does not build a website, serve a page, measure a
live site, or verify that a declared control actually works — it
checks that the record the skill requires is present and
internally complete and consistent on the declared evidence.

The caller submits a web-build manifest (a dict, or JSON on the
CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- pages: the declared `pages` list must be non-empty;
- shared content: every page declared with
  `content_same_for_all_visitors` true must be declared
  `rendered_at_publish` true (the skill's one rule: "If a result
  is the same for every visitor until content changes, compute
  it at publish/build time");
- single read: every page declared rendered at publish must
  declare `calls_per_load` equal to 1 (the skill: "store finished
  HTML → serve 1 read per request");
- hashed assets: when hashed static assets are declared used,
  the declared hashed-asset max-age must equal 31536000 seconds
  (the skill: "Hashed static assets: Cache-Control:
  max-age=31536000, immutable");
- interactive JS budget: the declared interactive JS size in KB
  gzipped must be at most 400 — the upper end of the skill's
  stated budget ("keep interactive JS ≤ ~300–400KB gzipped");
- server CPU: the declared content-page CPU P99 in milliseconds
  must be below 1 — sub-millisecond, the skill's stated target
  ("Target sub-millisecond server CPU for content pages").

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the unrounded values. That fixed serialization is what makes the
Python and TypeScript outputs byte-identical. Counts are
reported as integers (exact).

The skill states no other numeric threshold — no TTFB target in
milliseconds beyond the sub-millisecond CPU target applied above,
no compression ratio, no payload total beyond the interactive-JS
budget applied above, no cache TTL for ordinary responses, no
page count — so no other numeric threshold check is invented;
quantities are computed and reported, and completeness (every
declared page, every gated row) is the only other bar, exactly
as stated above. The declined thresholds are named in SERVICE.md.

Verdict:
- any fail             -> EFFICIENT_WEB_BUILD_STANDARD_NOT_MET
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> EFFICIENT_WEB_BUILD_STANDARD_MET

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "publish_time_precompute_and_calls",
    "caching_layers",
    "bytes_compression_and_client_code",
    "delivery_security_and_process",
)

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (FieldTypeError ->
# the gateway's HTTP 422 invalid_input), never evidence: F1
# remedy, external verification Wave 1. Absent fields are not
# validated — absence is missing evidence, decided by the checks
# below.
MANIFEST_SPEC = {
    "site": "string",
    "plan": {
        "call_count_stated": "boolean",
        "per_request_work_stated": "boolean",
        "cheaper_alternative_stated": "boolean",
        "fragility_named": "boolean",
    },
    "precompute": {
        "rebuild_triggered_by_publish_event": "boolean",
        "timer_or_per_visitor_primary_rebuild_present": "boolean",
        "live_render_fallback_present": "boolean",
    },
    "calls": {
        "await_in_loop_present": "boolean",
        "independent_calls_batched_or_avoided": "boolean",
        "duplicate_upstream_fetches_coalesced": "boolean",
    },
    "search": {
        "has_search_or_filter": "boolean",
        "uses_single_publish_time_index_blob": "boolean",
    },
    "pages": [{
        "name": "string",
        "content_same_for_all_visitors": "boolean",
        "rendered_at_publish": "boolean",
        "calls_per_load": "number",
    }],
    "caching": {
        "edge_cache_configured": "boolean",
        "stale_while_revalidate_configured": "boolean",
        "app_cache_scoped_to_authenticated_personalized": "boolean",
        "db_cache_scoped_to_genuinely_dynamic": "boolean",
        "hashed_static_assets_used": "boolean",
        "hashed_asset_max_age_seconds": "number",
        "stale_served_on_upstream_failure": "boolean",
    },
    "payload": {
        "text_compression_brotli_gzip_fallback": "boolean",
        "already_compressed_media_recompressed_present": "boolean",
        "js_css_minified_at_build": "boolean",
        "dead_code_removed": "boolean",
        "client_js_limited_to_needed_interactivity": "boolean",
        "critical_css_inlined_rest_deferred": "boolean",
        "images_efficient_formats_responsive_lazy": "boolean",
        "static_assets_highest_compression_level": "boolean",
        "on_the_fly_compression_low_level": "boolean",
        "interactive_js_gzipped_kb": "number",
    },
    "delivery": {
        "edge_first_delivery": "boolean",
        "static_shell_first_slow_parts_deferred": "boolean",
        "content_page_cpu_p99_ms": "number",
    },
    "security": {
        "csp_header_present": "boolean",
        "hsts_header_present": "boolean",
        "content_type_options_nosniff_present": "boolean",
        "frame_protection_present": "boolean",
        "referrer_policy_present": "boolean",
        "https_only": "boolean",
        "secrets_in_client_code_or_repos_present": "boolean",
        "write_endpoints_bearer_token_protected": "boolean",
        "user_derived_output_escaped": "boolean",
        "undefined_field_guards_present": "boolean",
        "least_privilege_tokens_and_bindings": "boolean",
    },
    "process": {
        "staging_deployed_first": "boolean",
        "staging_speed_and_correctness_verified": "boolean",
        "production_promoted_only_on_explicit_go": "boolean",
        "post_ship_efficiency_confirmed_with_numbers": "boolean",
        "testing_done_on_live_site_present": "boolean",
    },
}


class FieldTypeError(TypeError, ValueError):
    """A documented manifest field is present with the wrong JSON
    type. Subclasses both TypeError and ValueError so either
    caller's error contract catches it; the message names the
    field path."""


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise FieldTypeError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise FieldTypeError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise FieldTypeError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise FieldTypeError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise FieldTypeError(f"{path} must be an object")
        _validate_fields(value, spec, path)
        return
    raise AssertionError(f"unknown manifest spec at {path}")


def _validate_fields(obj, spec, prefix):
    for field, field_spec in spec.items():
        if field not in obj:
            continue
        value = obj[field]
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(value, field_spec, path)


def _validate_manifest(manifest):
    _validate_fields(manifest, MANIFEST_SPEC, "")


def _get(manifest, *path):
    cur = manifest
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return None, False
        cur = cur[key]
    return cur, True


def _check(results, section, name, value, present, ok, evidence):
    if not present:
        status = "missing"
    else:
        status = "pass" if ok else "fail"
    results.append(
        {"section": section, "check": name, "status": status,
         "evidence": evidence}
    )


def _bool_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is True, evidence)


def _false_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is False,
           evidence)


def _gated_bool_check(results, section, name, manifest, gate_path,
                      target_path, evidence, na_evidence):
    gate, has_gate = _get(manifest, *gate_path)
    target, has_target = _get(manifest, *target_path)
    if has_gate and gate:
        _check(results, section, name, target, has_target,
               target is True, evidence)
    else:
        _check(results, section, name, gate, has_gate, True,
               na_evidence)


def _gated_number_check(results, section, name, manifest, gate_path,
                        target_path, expected, evidence, na_evidence):
    gate, has_gate = _get(manifest, *gate_path)
    target, has_target = _get(manifest, *target_path)
    if has_gate and gate:
        _check(results, section, name, target, has_target,
               has_target and target == expected, evidence)
    else:
        _check(results, section, name, gate, has_gate, True,
               na_evidence)


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _row_name(entry):
    if isinstance(entry, dict) and isinstance(entry.get("name"), str):
        return entry["name"]
    return "unnamed"


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def evaluate(manifest):
    """Return the verdict dict for a web-build manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    pages, has_pages = _get(manifest, "pages")
    pages_is_list = has_pages and isinstance(pages, list)
    pages_count = len(pages) if pages_is_list else None
    rows = pages if pages_is_list else []

    shared_rows = [
        d for d in rows
        if isinstance(d, dict)
        and d.get("content_same_for_all_visitors") is True
    ]
    precomputed_rows = [
        d for d in rows
        if isinstance(d, dict) and d.get("rendered_at_publish") is True
    ]
    shared_pages_not_precomputed = (
        [_row_name(d) for d in shared_rows
         if "rendered_at_publish" in d
         and d.get("rendered_at_publish") is not True]
        if pages_is_list else None
    )
    precomputed_pages_over_single_read = (
        [_row_name(d) for d in precomputed_rows
         if _is_number(d.get("calls_per_load"))
         and d.get("calls_per_load") != 1]
        if pages_is_list else None
    )
    numeric_calls = [
        d["calls_per_load"] for d in rows
        if isinstance(d, dict) and _is_number(d.get("calls_per_load"))
    ]
    total_calls_per_load = (
        sum(numeric_calls)
        if pages_is_list and len(numeric_calls) > 0 else None
    )
    max_calls_per_load = (
        max(numeric_calls)
        if pages_is_list and len(numeric_calls) > 0 else None
    )
    precomputed_page_coverage = (
        len(precomputed_rows) / pages_count
        if pages_is_list and pages_count > 0 else None
    )
    single_read_pages = [
        d for d in rows
        if isinstance(d, dict) and _is_number(d.get("calls_per_load"))
        and d.get("calls_per_load") == 1
    ]
    single_read_page_coverage = (
        len(single_read_pages) / pages_count
        if pages_is_list and pages_count > 0 else None
    )
    interactive_js, has_interactive_js = _get(
        manifest, "payload", "interactive_js_gzipped_kb")
    cpu_p99, has_cpu_p99 = _get(
        manifest, "delivery", "content_page_cpu_p99_ms")

    # ---- Section 1: publish_time_precompute_and_calls (skill:
    #      the one rule — do work once, not per request; render at
    #      publish/build time, store finished HTML, serve 1 read;
    #      rebuild triggered by the publisher event, not a timer
    #      and not per visitor; live-render fallback kept. Process
    #      — state the call count and per-request work in the plan,
    #      the cheaper alternative, and any free-tier / single-VM
    #      fragility. Minimize calls — never await in a loop, batch
    #      independent calls, coalesce duplicate work; search over
    #      a dataset loads one publish-time index blob in 1 call) ----
    _bool_check(results, "publish_time_precompute_and_calls",
                "plan_call_count_stated", manifest,
                ("plan", "call_count_stated"),
                "process: the plan states the call count of the "
                "design — 'this path is N calls' is a required line")
    _bool_check(results, "publish_time_precompute_and_calls",
                "plan_per_request_work_stated", manifest,
                ("plan", "per_request_work_stated"),
                "process: the plan states the per-request work of "
                "the proposed design")
    _bool_check(results, "publish_time_precompute_and_calls",
                "plan_cheaper_alternative_stated", manifest,
                ("plan", "cheaper_alternative_stated"),
                "process: the plan states the cheaper alternative "
                "where one exists")
    _bool_check(results, "publish_time_precompute_and_calls",
                "plan_fragility_named", manifest,
                ("plan", "fragility_named"),
                "process: any free-tier or single-VM fragility is "
                "named explicitly so the trade-off is decided "
                "knowingly")
    _bool_check(results, "publish_time_precompute_and_calls",
                "rebuild_triggered_by_publish_event", manifest,
                ("precompute", "rebuild_triggered_by_publish_event"),
                "the one rule: the rebuild is triggered on the "
                "event that changes content — the publisher")
    _false_check(results, "publish_time_precompute_and_calls",
                 "no_timer_or_per_visitor_primary_rebuild", manifest,
                 ("precompute",
                  "timer_or_per_visitor_primary_rebuild_present"),
                 "the one rule: the rebuild is not triggered on a "
                 "timer and not per visitor")
    _bool_check(results, "publish_time_precompute_and_calls",
                "live_render_fallback_present", manifest,
                ("precompute", "live_render_fallback_present"),
                "the one rule: a live-render fallback is kept so a "
                "missing artifact degrades to slow-but-working, "
                "never blank")
    _false_check(results, "publish_time_precompute_and_calls",
                 "no_await_in_loop", manifest,
                 ("calls", "await_in_loop_present"),
                 "minimize calls: no await in a loop when calls "
                 "are independent")
    _bool_check(results, "publish_time_precompute_and_calls",
                "independent_calls_batched_or_avoided", manifest,
                ("calls", "independent_calls_batched_or_avoided"),
                "minimize calls: independent calls are batched to "
                "run concurrently, or avoided entirely by "
                "precomputing")
    _bool_check(results, "publish_time_precompute_and_calls",
                "duplicate_upstream_fetches_coalesced", manifest,
                ("calls", "duplicate_upstream_fetches_coalesced"),
                "minimize calls: duplicate work is coalesced — "
                "one upstream fetch shared across consumers, not "
                "one per consumer")
    _gated_bool_check(
        results, "publish_time_precompute_and_calls",
        "search_uses_single_publish_time_index", manifest,
        ("search", "has_search_or_filter"),
        ("search", "uses_single_publish_time_index_blob"),
        "minimize calls: search/filter loads one small index "
        "blob built at publish time in 1 call and filters in "
        "memory — no fan-out to per-item reads",
        "no search or filter declared")
    _check(results, "publish_time_precompute_and_calls",
           "pages_declared", pages, pages_is_list,
           pages_is_list and pages_count > 0,
           "the one rule: the declared build record names its "
           "pages — the pages list is present and non-empty")
    shared_gate_present = (
        pages_is_list
        and all(isinstance(d, dict)
                and "content_same_for_all_visitors" in d for d in rows)
    )
    shared_target_present = (
        pages_is_list and shared_gate_present
        and all("rendered_at_publish" in d for d in shared_rows)
    )
    _check(results, "publish_time_precompute_and_calls",
           "every_shared_content_page_rendered_at_publish", pages,
           shared_target_present,
           pages_is_list
           and all(d.get("rendered_at_publish") is True
                   for d in shared_rows),
           "the one rule: every page declared with content the "
           "same for every visitor until content changes is "
           "rendered at publish/build time — do work once, not "
           "per request")
    precomputed_gate_present = (
        pages_is_list
        and all(isinstance(d, dict) and "rendered_at_publish" in d
                for d in rows)
    )
    single_read_present = (
        pages_is_list and precomputed_gate_present
        and all("calls_per_load" in d for d in precomputed_rows)
    )
    _check(results, "publish_time_precompute_and_calls",
           "every_precomputed_page_serves_single_read", pages,
           single_read_present,
           pages_is_list
           and all(d.get("calls_per_load") == 1
                   for d in precomputed_rows),
           "the one rule: every page declared rendered at "
           "publish/build time serves 1 read per request — "
           "calls_per_load equal to 1")

    # ---- Section 2: caching_layers (skill: caching, layered
    #      cheapest-first — edge/CDN cache with Cache-Control
    #      public + stale-while-revalidate; app cache only for
    #      authenticated/personalized data; DB/query cache only
    #      for genuinely dynamic data; hashed static assets at
    #      max-age=31536000, immutable; on upstream failure serve
    #      the last good cached value marked stale) ----
    _bool_check(results, "caching_layers", "edge_cache_configured",
                manifest, ("caching", "edge_cache_configured"),
                "caching: the edge/CDN cache — the cheapest layer "
                "— is configured for static assets and "
                "unauthenticated responses")
    _bool_check(results, "caching_layers",
                "stale_while_revalidate_configured", manifest,
                ("caching", "stale_while_revalidate_configured"),
                "caching: stale-while-revalidate is used so a "
                "cached copy serves instantly while a fresh one "
                "is fetched async — no first-visitor penalty")
    _bool_check(results, "caching_layers",
                "app_cache_scoped_to_authenticated_personalized",
                manifest,
                ("caching",
                 "app_cache_scoped_to_authenticated_personalized"),
                "caching: the app cache is used only for "
                "authenticated/personalized data that cannot live "
                "at the edge")
    _bool_check(results, "caching_layers",
                "db_cache_scoped_to_genuinely_dynamic", manifest,
                ("caching", "db_cache_scoped_to_genuinely_dynamic"),
                "caching: the DB/query cache — the most expensive "
                "layer — is used only for genuinely dynamic data")
    _gated_number_check(
        results, "caching_layers",
        "hashed_assets_use_immutable_year_cache", manifest,
        ("caching", "hashed_static_assets_used"),
        ("caching", "hashed_asset_max_age_seconds"), 31536000,
        "caching: hashed static assets are served at "
        "Cache-Control max-age=31536000, immutable",
        "no hashed static assets declared")
    _bool_check(results, "caching_layers",
                "stale_served_on_upstream_failure", manifest,
                ("caching", "stale_served_on_upstream_failure"),
                "caching: on upstream failure the last good cached "
                "value is served marked stale rather than blocking "
                "the user")

    # ---- Section 3: bytes_compression_and_client_code (skill:
    #      minimize bytes, energy, and code — Brotli preferred
    #      with gzip fallback on all text; never re-compress
    #      already-compressed media; minify JS/CSS at build time;
    #      remove dead code; JavaScript is the costliest byte —
    #      prefer zero or minimal client JS, limited to needed
    #      interactivity; inline critical CSS, defer the rest;
    #      images AVIF/WebP, responsive, lazy-loaded; highest
    #      compression levels for static assets compressed once
    #      at build time, lower levels for on-the-fly; payload
    #      budget — interactive JS at most ~300-400KB gzipped,
    #      the stated upper end 400 applied as the ceiling) ----
    _bool_check(results, "bytes_compression_and_client_code",
                "text_assets_compressed_brotli_with_gzip_fallback",
                manifest,
                ("payload", "text_compression_brotli_gzip_fallback"),
                "compression: server-side compression is on for "
                "all text — HTML, CSS, JS, JSON, SVG — Brotli "
                "preferred, gzip fallback")
    _false_check(results, "bytes_compression_and_client_code",
                 "no_recompression_of_already_compressed_media",
                 manifest,
                 ("payload",
                  "already_compressed_media_recompressed_present"),
                 "compression: already-compressed media — images, "
                 "audio, video, fonts — is not re-compressed")
    _bool_check(results, "bytes_compression_and_client_code",
                "js_css_minified_at_build", manifest,
                ("payload", "js_css_minified_at_build"),
                "compression: JS/CSS is minified at build time — "
                "readable source kept in the repo, the minified "
                "build shipped")
    _bool_check(results, "bytes_compression_and_client_code",
                "dead_code_removed", manifest,
                ("payload", "dead_code_removed"),
                "compression: dead code is removed — only what "
                "runs is shipped")
    _bool_check(results, "bytes_compression_and_client_code",
                "client_js_limited_to_needed_interactivity",
                manifest,
                ("payload",
                 "client_js_limited_to_needed_interactivity"),
                "compression: client JavaScript — the costliest "
                "byte — is zero or minimal, limited to the "
                "interactivity the site truly needs")
    _bool_check(results, "bytes_compression_and_client_code",
                "critical_css_inlined_rest_deferred", manifest,
                ("payload", "critical_css_inlined_rest_deferred"),
                "compression: critical CSS is inlined and the "
                "rest deferred")
    _bool_check(results, "bytes_compression_and_client_code",
                "images_efficient_formats_responsive_lazy", manifest,
                ("payload",
                 "images_efficient_formats_responsive_lazy"),
                "compression: images are AVIF/WebP, in responsive "
                "sizes, lazy-loaded")
    _bool_check(results, "bytes_compression_and_client_code",
                "static_assets_highest_compression_level", manifest,
                ("payload", "static_assets_highest_compression_level"),
                "compression: the highest compression levels are "
                "used for static assets compressed once at build "
                "time")
    _bool_check(results, "bytes_compression_and_client_code",
                "on_the_fly_compression_uses_low_level", manifest,
                ("payload", "on_the_fly_compression_low_level"),
                "compression: lower compression levels are used "
                "for anything compressed on-the-fly per request, "
                "where CPU time would otherwise delay delivery")
    _check(results, "bytes_compression_and_client_code",
           "interactive_js_within_stated_budget", interactive_js,
           has_interactive_js,
           has_interactive_js and _is_number(interactive_js)
           and interactive_js <= 400,
           "payload budget: the declared interactive JavaScript "
           "is at most 400 KB gzipped — the upper end of the "
           "skill's stated budget of ~300-400KB gzipped")

    # ---- Section 4: delivery_security_and_process (skill: speed
    #      — edge-first delivery; static shell first, slow parts
    #      streamed/deferred; sub-millisecond server CPU for
    #      content pages. Security, non-negotiable baseline —
    #      CSP, HSTS, nosniff, frame protection, Referrer-Policy
    #      on every response; HTTPS only; no secrets in client
    #      code or repos; write/rebuild endpoints protected with
    #      a bearer token; user/content-derived output escaped,
    #      with guards against undefined fields; least privilege
    #      on tokens and bindings. Process — staging first, verify
    #      speed/correctness there, promote only on explicit go,
    #      never test on the live site; after shipping, confirm
    #      the efficiency actually improved with numbers) ----
    _bool_check(results, "delivery_security_and_process",
                "edge_first_delivery", manifest,
                ("delivery", "edge_first_delivery"),
                "speed: delivery is edge-first — served from the "
                "nearest POP")
    _bool_check(results, "delivery_security_and_process",
                "static_shell_first_slow_parts_deferred", manifest,
                ("delivery", "static_shell_first_slow_parts_deferred"),
                "speed: the static shell is served first and the "
                "slow parts are streamed or deferred rather than "
                "blocking the whole response on the slowest "
                "dependency")
    _check(results, "delivery_security_and_process",
           "content_page_cpu_p99_sub_millisecond", cpu_p99,
           has_cpu_p99,
           has_cpu_p99 and _is_number(cpu_p99) and cpu_p99 < 1,
           "speed: the declared content-page server CPU P99 is "
           "sub-millisecond — below 1 ms, the skill's stated "
           "target for content pages")
    _bool_check(results, "delivery_security_and_process",
                "csp_header_present", manifest,
                ("security", "csp_header_present"),
                "security baseline: Content-Security-Policy — the "
                "tightest that works — is present on every response")
    _bool_check(results, "delivery_security_and_process",
                "hsts_header_present", manifest,
                ("security", "hsts_header_present"),
                "security baseline: Strict-Transport-Security "
                "(HSTS) is present on every response")
    _bool_check(results, "delivery_security_and_process",
                "content_type_options_nosniff_present", manifest,
                ("security", "content_type_options_nosniff_present"),
                "security baseline: X-Content-Type-Options: "
                "nosniff is present on every response")
    _bool_check(results, "delivery_security_and_process",
                "frame_protection_present", manifest,
                ("security", "frame_protection_present"),
                "security baseline: X-Frame-Options / "
                "frame-ancestors protection is present on every "
                "response")
    _bool_check(results, "delivery_security_and_process",
                "referrer_policy_present", manifest,
                ("security", "referrer_policy_present"),
                "security baseline: Referrer-Policy is present on "
                "every response")
    _bool_check(results, "delivery_security_and_process",
                "https_only", manifest,
                ("security", "https_only"),
                "security baseline: HTTPS only")
    _false_check(results, "delivery_security_and_process",
                 "no_secrets_in_client_code_or_repos", manifest,
                 ("security", "secrets_in_client_code_or_repos_present"),
                 "security baseline: no secrets in client code or "
                 "repos — platform secrets are used")
    _bool_check(results, "delivery_security_and_process",
                "write_endpoints_bearer_token_protected", manifest,
                ("security", "write_endpoints_bearer_token_protected"),
                "security baseline: write/rebuild endpoints are "
                "protected with a bearer token")
    _bool_check(results, "delivery_security_and_process",
                "user_derived_output_escaped", manifest,
                ("security", "user_derived_output_escaped"),
                "security baseline: all user/content-derived "
                "output is escaped")
    _bool_check(results, "delivery_security_and_process",
                "undefined_field_guards_present", manifest,
                ("security", "undefined_field_guards_present"),
                "security baseline: output is guarded against "
                "undefined fields so one bad record cannot crash "
                "the page")
    _bool_check(results, "delivery_security_and_process",
                "least_privilege_tokens_and_bindings", manifest,
                ("security", "least_privilege_tokens_and_bindings"),
                "security baseline: least privilege on tokens and "
                "bindings")
    _bool_check(results, "delivery_security_and_process",
                "staging_deployed_first", manifest,
                ("process", "staging_deployed_first"),
                "process: the build is deployed to a "
                "non-production staging URL first")
    _bool_check(results, "delivery_security_and_process",
                "staging_speed_and_correctness_verified", manifest,
                ("process", "staging_speed_and_correctness_verified"),
                "process: speed and correctness are verified on "
                "staging — call count and CPU checked in analytics")
    _bool_check(results, "delivery_security_and_process",
                "production_promoted_only_on_explicit_go", manifest,
                ("process", "production_promoted_only_on_explicit_go"),
                "process: production is promoted only on explicit "
                "go")
    _bool_check(results, "delivery_security_and_process",
                "post_ship_efficiency_confirmed_with_numbers",
                manifest,
                ("process",
                 "post_ship_efficiency_confirmed_with_numbers"),
                "process: after shipping, the efficiency "
                "improvement is confirmed with numbers — calls "
                "down, CPU down, bytes down — never claimed "
                "without the numbers")
    _false_check(results, "delivery_security_and_process",
                 "no_testing_on_live_site", manifest,
                 ("process", "testing_done_on_live_site_present"),
                 "process: testing is never done on the live site")

    sections = {}
    for section in SECTIONS:
        sec_results = [r for r in results if r["section"] == section]
        if any(r["status"] == "fail" for r in sec_results):
            sections[section] = "fail"
        elif any(r["status"] == "missing" for r in sec_results):
            sections[section] = "insufficient_evidence"
        else:
            sections[section] = "pass"

    if any(v == "fail" for v in sections.values()):
        verdict = "EFFICIENT_WEB_BUILD_STANDARD_NOT_MET"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "EFFICIENT_WEB_BUILD_STANDARD_MET"

    computed_names = (
        "pages_declared",
        "every_shared_content_page_rendered_at_publish",
        "every_precomputed_page_serves_single_read",
        "hashed_assets_use_immutable_year_cache",
        "interactive_js_within_stated_budget",
        "content_page_cpu_p99_sub_millisecond",
    )
    computed_statuses = [
        r["status"] for r in results if r["check"] in computed_names
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "efficient-web-build-standard",
        "atom_version": "0.1.0",
        "site": manifest.get("site"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "pages_count": pages_count,
        "shared_pages_not_precomputed": shared_pages_not_precomputed,
        "precomputed_pages_over_single_read":
            precomputed_pages_over_single_read,
        "total_calls_per_load": total_calls_per_load,
        "max_calls_per_load": max_calls_per_load,
        "precomputed_page_coverage": _fmt6(precomputed_page_coverage),
        "single_read_page_coverage": _fmt6(single_read_page_coverage),
        "interactive_js_gzipped_kb":
            interactive_js if has_interactive_js else None,
        "content_page_cpu_p99_ms": cpu_p99 if has_cpu_p99 else None,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across four sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "EFFICIENT WEB BUILD STANDARD",
        f"site: {verdict.get('site')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<36} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: efficient_web_build_standard.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "EFFICIENT_WEB_BUILD_STANDARD_MET" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
