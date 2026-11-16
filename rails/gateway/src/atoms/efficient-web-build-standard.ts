// Efficient web build standard — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/efficient-web-build-standard/src/
// efficient_web_build_standard.py (evaluate() + stamp()). No logic
// changes: every verdict, section outcome, per-check status,
// evidence string, computed field and the summary string are
// byte-identical to the Python output for the same input.
// Computed ratios use the shared fixed serialization: round half
// up to 6dp — floor(v * 1000000 + 0.5) / 1000000 — then format
// with exactly six decimals; comparisons use the unrounded
// values.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  site: "string",
  plan: {
    call_count_stated: "boolean",
    per_request_work_stated: "boolean",
    cheaper_alternative_stated: "boolean",
    fragility_named: "boolean",
  },
  precompute: {
    rebuild_triggered_by_publish_event: "boolean",
    timer_or_per_visitor_primary_rebuild_present: "boolean",
    live_render_fallback_present: "boolean",
  },
  calls: {
    await_in_loop_present: "boolean",
    independent_calls_batched_or_avoided: "boolean",
    duplicate_upstream_fetches_coalesced: "boolean",
  },
  search: {
    has_search_or_filter: "boolean",
    uses_single_publish_time_index_blob: "boolean",
  },
  pages: [{
    name: "string",
    content_same_for_all_visitors: "boolean",
    rendered_at_publish: "boolean",
    calls_per_load: "number",
  }],
  caching: {
    edge_cache_configured: "boolean",
    stale_while_revalidate_configured: "boolean",
    app_cache_scoped_to_authenticated_personalized: "boolean",
    db_cache_scoped_to_genuinely_dynamic: "boolean",
    hashed_static_assets_used: "boolean",
    hashed_asset_max_age_seconds: "number",
    stale_served_on_upstream_failure: "boolean",
  },
  payload: {
    text_compression_brotli_gzip_fallback: "boolean",
    already_compressed_media_recompressed_present: "boolean",
    js_css_minified_at_build: "boolean",
    dead_code_removed: "boolean",
    client_js_limited_to_needed_interactivity: "boolean",
    critical_css_inlined_rest_deferred: "boolean",
    images_efficient_formats_responsive_lazy: "boolean",
    static_assets_highest_compression_level: "boolean",
    on_the_fly_compression_low_level: "boolean",
    interactive_js_gzipped_kb: "number",
  },
  delivery: {
    edge_first_delivery: "boolean",
    static_shell_first_slow_parts_deferred: "boolean",
    content_page_cpu_p99_ms: "number",
  },
  security: {
    csp_header_present: "boolean",
    hsts_header_present: "boolean",
    content_type_options_nosniff_present: "boolean",
    frame_protection_present: "boolean",
    referrer_policy_present: "boolean",
    https_only: "boolean",
    secrets_in_client_code_or_repos_present: "boolean",
    write_endpoints_bearer_token_protected: "boolean",
    user_derived_output_escaped: "boolean",
    undefined_field_guards_present: "boolean",
    least_privilege_tokens_and_bindings: "boolean",
  },
  process: {
    staging_deployed_first: "boolean",
    staging_speed_and_correctness_verified: "boolean",
    production_promoted_only_on_explicit_go: "boolean",
    post_ship_efficiency_confirmed_with_numbers: "boolean",
    testing_done_on_live_site_present: "boolean",
  },
};

export const SECTIONS = [
  "publish_time_precompute_and_calls",
  "caching_layers",
  "bytes_compression_and_client_code",
  "delivery_security_and_process",
] as const;

export type CheckStatus = "pass" | "fail" | "missing";

export interface CheckResult {
  section: string;
  check: string;
  status: CheckStatus;
  evidence: string;
}

export interface Verdict {
  service: string;
  atom_version: string;
  site: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  pages_count: number | null;
  shared_pages_not_precomputed: string[] | null;
  precomputed_pages_over_single_read: string[] | null;
  total_calls_per_load: number | null;
  max_calls_per_load: number | null;
  precomputed_page_coverage: string | null;
  single_read_page_coverage: string | null;
  interactive_js_gzipped_kb: unknown;
  content_page_cpu_p99_ms: unknown;
  summary: string;
}

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pyTruthy(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value.length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (isPyDict(value)) return Object.keys(value).length > 0;
  return Boolean(value);
}

function getPath(
  manifest: Record<string, unknown>,
  ...path: string[]
): [unknown, boolean] {
  let cur: unknown = manifest;
  for (const key of path) {
    if (!isPyDict(cur) || !Object.prototype.hasOwnProperty.call(cur, key)) {
      return [null, false];
    }
    cur = cur[key];
  }
  return [cur, true];
}

function hasField(entry: unknown, field: string): boolean {
  return isPyDict(entry) &&
    Object.prototype.hasOwnProperty.call(entry, field);
}

function check(
  results: CheckResult[],
  section: string,
  name: string,
  _value: unknown,
  present: boolean,
  ok: boolean,
  evidence: string,
): void {
  const status: CheckStatus = !present ? "missing" : ok ? "pass" : "fail";
  results.push({ section, check: name, status, evidence });
}

function boolCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, value === true, evidence);
}

function falseCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, value === false, evidence);
}

function gatedBoolCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  gatePath: string[],
  targetPath: string[],
  evidence: string,
  naEvidence: string,
): void {
  const [gate, hasGate] = getPath(manifest, ...gatePath);
  const [target, hasTarget] = getPath(manifest, ...targetPath);
  if (hasGate && pyTruthy(gate)) {
    check(results, section, name, target, hasTarget,
      target === true, evidence);
  } else {
    check(results, section, name, gate, hasGate, true, naEvidence);
  }
}

function gatedNumberCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  gatePath: string[],
  targetPath: string[],
  expected: number,
  evidence: string,
  naEvidence: string,
): void {
  const [gate, hasGate] = getPath(manifest, ...gatePath);
  const [target, hasTarget] = getPath(manifest, ...targetPath);
  if (hasGate && pyTruthy(gate)) {
    check(results, section, name, target, hasTarget,
      hasTarget && target === expected, evidence);
  } else {
    check(results, section, name, gate, hasGate, true, naEvidence);
  }
}

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

function rowName(entry: unknown): string {
  if (isPyDict(entry) && typeof entry["name"] === "string") {
    return entry["name"] as string;
  }
  return "unnamed";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Declared rows, read once for the computed checks ----
  const [pagesRaw, hasPages] = getPath(manifest, "pages");
  const pagesIsList = hasPages && Array.isArray(pagesRaw);
  const rows: unknown[] = pagesIsList ? (pagesRaw as unknown[]) : [];
  const pagesCount: number | null = pagesIsList ? rows.length : null;

  const sharedRows = rows.filter(
    (d) => isPyDict(d) && d["content_same_for_all_visitors"] === true);
  const precomputedRows = rows.filter(
    (d) => isPyDict(d) && d["rendered_at_publish"] === true);
  const sharedPagesNotPrecomputed: string[] | null = pagesIsList
    ? sharedRows.filter((d) => hasField(d, "rendered_at_publish") &&
        (d as Record<string, unknown>)["rendered_at_publish"] !== true)
        .map(rowName)
    : null;
  const precomputedPagesOverSingleRead: string[] | null = pagesIsList
    ? precomputedRows.filter((d) =>
        isNumber((d as Record<string, unknown>)["calls_per_load"]) &&
        (d as Record<string, unknown>)["calls_per_load"] !== 1).map(rowName)
    : null;
  const numericCalls: number[] = rows
    .filter((d) => isPyDict(d) && isNumber(d["calls_per_load"]))
    .map((d) => (d as Record<string, unknown>)["calls_per_load"] as number);
  const totalCallsPerLoad: number | null =
    pagesIsList && numericCalls.length > 0
      ? numericCalls.reduce((a, b) => a + b, 0)
      : null;
  const maxCallsPerLoad: number | null =
    pagesIsList && numericCalls.length > 0
      ? Math.max(...numericCalls)
      : null;
  const precomputedPageCoverage: number | null =
    pagesIsList && pagesCount !== null && pagesCount > 0
      ? precomputedRows.length / pagesCount
      : null;
  const singleReadPages = rows.filter(
    (d) => isPyDict(d) && isNumber(d["calls_per_load"]) &&
      d["calls_per_load"] === 1);
  const singleReadPageCoverage: number | null =
    pagesIsList && pagesCount !== null && pagesCount > 0
      ? singleReadPages.length / pagesCount
      : null;
  const [interactiveJs, hasInteractiveJs] =
    getPath(manifest, "payload", "interactive_js_gzipped_kb");
  const [cpuP99, hasCpuP99] =
    getPath(manifest, "delivery", "content_page_cpu_p99_ms");

  // ---- Section 1: publish_time_precompute_and_calls ----
  boolCheck(results, "publish_time_precompute_and_calls",
    "plan_call_count_stated", manifest,
    ["plan", "call_count_stated"],
    "process: the plan states the call count of the design — 'this path is N calls' is a required line");
  boolCheck(results, "publish_time_precompute_and_calls",
    "plan_per_request_work_stated", manifest,
    ["plan", "per_request_work_stated"],
    "process: the plan states the per-request work of the proposed design");
  boolCheck(results, "publish_time_precompute_and_calls",
    "plan_cheaper_alternative_stated", manifest,
    ["plan", "cheaper_alternative_stated"],
    "process: the plan states the cheaper alternative where one exists");
  boolCheck(results, "publish_time_precompute_and_calls",
    "plan_fragility_named", manifest,
    ["plan", "fragility_named"],
    "process: any free-tier or single-VM fragility is named explicitly so the trade-off is decided knowingly");
  boolCheck(results, "publish_time_precompute_and_calls",
    "rebuild_triggered_by_publish_event", manifest,
    ["precompute", "rebuild_triggered_by_publish_event"],
    "the one rule: the rebuild is triggered on the event that changes content — the publisher");
  falseCheck(results, "publish_time_precompute_and_calls",
    "no_timer_or_per_visitor_primary_rebuild", manifest,
    ["precompute", "timer_or_per_visitor_primary_rebuild_present"],
    "the one rule: the rebuild is not triggered on a timer and not per visitor");
  boolCheck(results, "publish_time_precompute_and_calls",
    "live_render_fallback_present", manifest,
    ["precompute", "live_render_fallback_present"],
    "the one rule: a live-render fallback is kept so a missing artifact degrades to slow-but-working, never blank");
  falseCheck(results, "publish_time_precompute_and_calls",
    "no_await_in_loop", manifest,
    ["calls", "await_in_loop_present"],
    "minimize calls: no await in a loop when calls are independent");
  boolCheck(results, "publish_time_precompute_and_calls",
    "independent_calls_batched_or_avoided", manifest,
    ["calls", "independent_calls_batched_or_avoided"],
    "minimize calls: independent calls are batched to run concurrently, or avoided entirely by precomputing");
  boolCheck(results, "publish_time_precompute_and_calls",
    "duplicate_upstream_fetches_coalesced", manifest,
    ["calls", "duplicate_upstream_fetches_coalesced"],
    "minimize calls: duplicate work is coalesced — one upstream fetch shared across consumers, not one per consumer");
  gatedBoolCheck(results, "publish_time_precompute_and_calls",
    "search_uses_single_publish_time_index", manifest,
    ["search", "has_search_or_filter"],
    ["search", "uses_single_publish_time_index_blob"],
    "minimize calls: search/filter loads one small index blob built at publish time in 1 call and filters in memory — no fan-out to per-item reads",
    "no search or filter declared");
  check(results, "publish_time_precompute_and_calls", "pages_declared",
    pagesRaw, pagesIsList,
    pagesIsList && (pagesCount as number) > 0,
    "the one rule: the declared build record names its pages — the pages list is present and non-empty");
  const sharedGatePresent = pagesIsList &&
    rows.every((d) => hasField(d, "content_same_for_all_visitors"));
  const sharedTargetPresent = pagesIsList && sharedGatePresent &&
    sharedRows.every((d) => hasField(d, "rendered_at_publish"));
  check(results, "publish_time_precompute_and_calls",
    "every_shared_content_page_rendered_at_publish", pagesRaw,
    sharedTargetPresent,
    pagesIsList &&
      sharedRows.every(
        (d) => (d as Record<string, unknown>)["rendered_at_publish"] === true),
    "the one rule: every page declared with content the same for every visitor until content changes is rendered at publish/build time — do work once, not per request");
  const precomputedGatePresent = pagesIsList &&
    rows.every((d) => hasField(d, "rendered_at_publish"));
  const singleReadPresent = pagesIsList && precomputedGatePresent &&
    precomputedRows.every((d) => hasField(d, "calls_per_load"));
  check(results, "publish_time_precompute_and_calls",
    "every_precomputed_page_serves_single_read", pagesRaw,
    singleReadPresent,
    pagesIsList &&
      precomputedRows.every(
        (d) => (d as Record<string, unknown>)["calls_per_load"] === 1),
    "the one rule: every page declared rendered at publish/build time serves 1 read per request — calls_per_load equal to 1");

  // ---- Section 2: caching_layers ----
  boolCheck(results, "caching_layers", "edge_cache_configured",
    manifest, ["caching", "edge_cache_configured"],
    "caching: the edge/CDN cache — the cheapest layer — is configured for static assets and unauthenticated responses");
  boolCheck(results, "caching_layers",
    "stale_while_revalidate_configured", manifest,
    ["caching", "stale_while_revalidate_configured"],
    "caching: stale-while-revalidate is used so a cached copy serves instantly while a fresh one is fetched async — no first-visitor penalty");
  boolCheck(results, "caching_layers",
    "app_cache_scoped_to_authenticated_personalized", manifest,
    ["caching", "app_cache_scoped_to_authenticated_personalized"],
    "caching: the app cache is used only for authenticated/personalized data that cannot live at the edge");
  boolCheck(results, "caching_layers",
    "db_cache_scoped_to_genuinely_dynamic", manifest,
    ["caching", "db_cache_scoped_to_genuinely_dynamic"],
    "caching: the DB/query cache — the most expensive layer — is used only for genuinely dynamic data");
  gatedNumberCheck(results, "caching_layers",
    "hashed_assets_use_immutable_year_cache", manifest,
    ["caching", "hashed_static_assets_used"],
    ["caching", "hashed_asset_max_age_seconds"], 31536000,
    "caching: hashed static assets are served at Cache-Control max-age=31536000, immutable",
    "no hashed static assets declared");
  boolCheck(results, "caching_layers",
    "stale_served_on_upstream_failure", manifest,
    ["caching", "stale_served_on_upstream_failure"],
    "caching: on upstream failure the last good cached value is served marked stale rather than blocking the user");

  // ---- Section 3: bytes_compression_and_client_code ----
  boolCheck(results, "bytes_compression_and_client_code",
    "text_assets_compressed_brotli_with_gzip_fallback", manifest,
    ["payload", "text_compression_brotli_gzip_fallback"],
    "compression: server-side compression is on for all text — HTML, CSS, JS, JSON, SVG — Brotli preferred, gzip fallback");
  falseCheck(results, "bytes_compression_and_client_code",
    "no_recompression_of_already_compressed_media", manifest,
    ["payload", "already_compressed_media_recompressed_present"],
    "compression: already-compressed media — images, audio, video, fonts — is not re-compressed");
  boolCheck(results, "bytes_compression_and_client_code",
    "js_css_minified_at_build", manifest,
    ["payload", "js_css_minified_at_build"],
    "compression: JS/CSS is minified at build time — readable source kept in the repo, the minified build shipped");
  boolCheck(results, "bytes_compression_and_client_code",
    "dead_code_removed", manifest,
    ["payload", "dead_code_removed"],
    "compression: dead code is removed — only what runs is shipped");
  boolCheck(results, "bytes_compression_and_client_code",
    "client_js_limited_to_needed_interactivity", manifest,
    ["payload", "client_js_limited_to_needed_interactivity"],
    "compression: client JavaScript — the costliest byte — is zero or minimal, limited to the interactivity the site truly needs");
  boolCheck(results, "bytes_compression_and_client_code",
    "critical_css_inlined_rest_deferred", manifest,
    ["payload", "critical_css_inlined_rest_deferred"],
    "compression: critical CSS is inlined and the rest deferred");
  boolCheck(results, "bytes_compression_and_client_code",
    "images_efficient_formats_responsive_lazy", manifest,
    ["payload", "images_efficient_formats_responsive_lazy"],
    "compression: images are AVIF/WebP, in responsive sizes, lazy-loaded");
  boolCheck(results, "bytes_compression_and_client_code",
    "static_assets_highest_compression_level", manifest,
    ["payload", "static_assets_highest_compression_level"],
    "compression: the highest compression levels are used for static assets compressed once at build time");
  boolCheck(results, "bytes_compression_and_client_code",
    "on_the_fly_compression_uses_low_level", manifest,
    ["payload", "on_the_fly_compression_low_level"],
    "compression: lower compression levels are used for anything compressed on-the-fly per request, where CPU time would otherwise delay delivery");
  check(results, "bytes_compression_and_client_code",
    "interactive_js_within_stated_budget", interactiveJs,
    hasInteractiveJs,
    hasInteractiveJs && isNumber(interactiveJs) && interactiveJs <= 400,
    "payload budget: the declared interactive JavaScript is at most 400 KB gzipped — the upper end of the skill's stated budget of ~300-400KB gzipped");

  // ---- Section 4: delivery_security_and_process ----
  boolCheck(results, "delivery_security_and_process",
    "edge_first_delivery", manifest,
    ["delivery", "edge_first_delivery"],
    "speed: delivery is edge-first — served from the nearest POP");
  boolCheck(results, "delivery_security_and_process",
    "static_shell_first_slow_parts_deferred", manifest,
    ["delivery", "static_shell_first_slow_parts_deferred"],
    "speed: the static shell is served first and the slow parts are streamed or deferred rather than blocking the whole response on the slowest dependency");
  check(results, "delivery_security_and_process",
    "content_page_cpu_p99_sub_millisecond", cpuP99, hasCpuP99,
    hasCpuP99 && isNumber(cpuP99) && cpuP99 < 1,
    "speed: the declared content-page server CPU P99 is sub-millisecond — below 1 ms, the skill's stated target for content pages");
  boolCheck(results, "delivery_security_and_process",
    "csp_header_present", manifest,
    ["security", "csp_header_present"],
    "security baseline: Content-Security-Policy — the tightest that works — is present on every response");
  boolCheck(results, "delivery_security_and_process",
    "hsts_header_present", manifest,
    ["security", "hsts_header_present"],
    "security baseline: Strict-Transport-Security (HSTS) is present on every response");
  boolCheck(results, "delivery_security_and_process",
    "content_type_options_nosniff_present", manifest,
    ["security", "content_type_options_nosniff_present"],
    "security baseline: X-Content-Type-Options: nosniff is present on every response");
  boolCheck(results, "delivery_security_and_process",
    "frame_protection_present", manifest,
    ["security", "frame_protection_present"],
    "security baseline: X-Frame-Options / frame-ancestors protection is present on every response");
  boolCheck(results, "delivery_security_and_process",
    "referrer_policy_present", manifest,
    ["security", "referrer_policy_present"],
    "security baseline: Referrer-Policy is present on every response");
  boolCheck(results, "delivery_security_and_process",
    "https_only", manifest,
    ["security", "https_only"],
    "security baseline: HTTPS only");
  falseCheck(results, "delivery_security_and_process",
    "no_secrets_in_client_code_or_repos", manifest,
    ["security", "secrets_in_client_code_or_repos_present"],
    "security baseline: no secrets in client code or repos — platform secrets are used");
  boolCheck(results, "delivery_security_and_process",
    "write_endpoints_bearer_token_protected", manifest,
    ["security", "write_endpoints_bearer_token_protected"],
    "security baseline: write/rebuild endpoints are protected with a bearer token");
  boolCheck(results, "delivery_security_and_process",
    "user_derived_output_escaped", manifest,
    ["security", "user_derived_output_escaped"],
    "security baseline: all user/content-derived output is escaped");
  boolCheck(results, "delivery_security_and_process",
    "undefined_field_guards_present", manifest,
    ["security", "undefined_field_guards_present"],
    "security baseline: output is guarded against undefined fields so one bad record cannot crash the page");
  boolCheck(results, "delivery_security_and_process",
    "least_privilege_tokens_and_bindings", manifest,
    ["security", "least_privilege_tokens_and_bindings"],
    "security baseline: least privilege on tokens and bindings");
  boolCheck(results, "delivery_security_and_process",
    "staging_deployed_first", manifest,
    ["process", "staging_deployed_first"],
    "process: the build is deployed to a non-production staging URL first");
  boolCheck(results, "delivery_security_and_process",
    "staging_speed_and_correctness_verified", manifest,
    ["process", "staging_speed_and_correctness_verified"],
    "process: speed and correctness are verified on staging — call count and CPU checked in analytics");
  boolCheck(results, "delivery_security_and_process",
    "production_promoted_only_on_explicit_go", manifest,
    ["process", "production_promoted_only_on_explicit_go"],
    "process: production is promoted only on explicit go");
  boolCheck(results, "delivery_security_and_process",
    "post_ship_efficiency_confirmed_with_numbers", manifest,
    ["process", "post_ship_efficiency_confirmed_with_numbers"],
    "process: after shipping, the efficiency improvement is confirmed with numbers — calls down, CPU down, bytes down — never claimed without the numbers");
  falseCheck(results, "delivery_security_and_process",
    "no_testing_on_live_site", manifest,
    ["process", "testing_done_on_live_site_present"],
    "process: testing is never done on the live site");

  const sections: Record<string, string> = {};
  for (const section of SECTIONS) {
    const secResults = results.filter((r) => r.section === section);
    if (secResults.some((r) => r.status === "fail")) {
      sections[section] = "fail";
    } else if (secResults.some((r) => r.status === "missing")) {
      sections[section] = "insufficient_evidence";
    } else {
      sections[section] = "pass";
    }
  }

  let verdict: string;
  if (Object.values(sections).some((v) => v === "fail")) {
    verdict = "EFFICIENT_WEB_BUILD_STANDARD_NOT_MET";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "EFFICIENT_WEB_BUILD_STANDARD_MET";
  }

  const computedNames = [
    "pages_declared",
    "every_shared_content_page_rendered_at_publish",
    "every_precomputed_page_serves_single_read",
    "hashed_assets_use_immutable_year_cache",
    "interactive_js_within_stated_budget",
    "content_page_cpu_p99_sub_millisecond",
  ];
  const computedStatuses = results
    .filter((r) => computedNames.includes(r.check))
    .map((r) => r.status);
  let computedStatus: string | null;
  if (computedStatuses.some((s) => s === "fail")) {
    computedStatus = "outside_stated_limits_on_declared_evidence";
  } else if (computedStatuses.every((s) => s === "pass")) {
    computedStatus = "within_stated_limits_on_declared_evidence";
  } else {
    computedStatus = null;
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "efficient-web-build-standard",
    atom_version: "0.1.0",
    site: manifest["site"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    pages_count: pagesCount,
    shared_pages_not_precomputed: sharedPagesNotPrecomputed,
    precomputed_pages_over_single_read: precomputedPagesOverSingleRead,
    total_calls_per_load: totalCallsPerLoad,
    max_calls_per_load: maxCallsPerLoad,
    precomputed_page_coverage: fmt6(precomputedPageCoverage),
    single_read_page_coverage: fmt6(singleReadPageCoverage),
    interactive_js_gzipped_kb: hasInteractiveJs ? interactiveJs : null,
    content_page_cpu_p99_ms: hasCpuP99 ? cpuP99 : null,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across four sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "EFFICIENT WEB BUILD STANDARD",
    `site: ${pyStr(verdict.site ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(36)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
