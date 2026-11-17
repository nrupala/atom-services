# Test report — efficient-web-build-standard

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 5cf70cb60526415d89b4db5e5cd02744
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/efficient-web-build-standard/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (site `example.com`): all plan/precompute/calls/caching/payload/security/process declarations true, the five must-be-false flags false, search present with single publish-time index, hashed assets with max-age `31536000`, one page `home` shared and rendered at publish with `calls_per_load` `1`, interactive JS `200`, CPU P99 `0.5` | HTTP 200, verdict `EFFICIENT_WEB_BUILD_STANDARD_MET`, `pages_count` `1`, `total_calls_per_load` `1`, `max_calls_per_load` `1`, coverages `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `EFFICIENT_WEB_BUILD_STANDARD_MET`, 49 pass / 0 fail / 0 missing, all four sections `pass`, exactly those computed values (`shared_pages_not_precomputed` `[]`, `precomputed_pages_over_single_read` `[]`, `interactive_js_gzipped_kb` `200`, `content_page_cpu_p99_ms` `0.5`) | PASS |
| 2 | violations — full manifest with page `home` shared but `rendered_at_publish` false, page `product` rendered at publish with `calls_per_load` `5`, `interactive_js_gzipped_kb` `500`, `content_page_cpu_p99_ms` `2.0` | HTTP 200, verdict `EFFICIENT_WEB_BUILD_STANDARD_NOT_MET`, the 4 named checks fail | HTTP 200, `EFFICIENT_WEB_BUILD_STANDARD_NOT_MET`, 45 pass / 4 fail / 0 missing; failing checks exactly `every_shared_content_page_rendered_at_publish`, `every_precomputed_page_serves_single_read`, `interactive_js_within_stated_budget`, `content_page_cpu_p99_sub_millisecond`; `pages_count` `2`, `shared_pages_not_precomputed` `["home"]`, `precomputed_pages_over_single_read` `["product"]`, `total_calls_per_load` `6`, `max_calls_per_load` `5`, coverages `"0.500000"`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `publish_time_precompute_and_calls`, `bytes_compression_and_client_code` and `delivery_security_and_process` `fail`, `caching_layers` `pass` | PASS |
| 3 | sparse — only `site` (`incomplete.com`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 49 missing, all four sections `insufficient_evidence`, `pages_count` null, `total_calls_per_load` null, `max_calls_per_load` null, coverages null, `interactive_js_gzipped_kb` null, `content_page_cpu_p99_ms` null, `computed_status` null | PASS |
| 4 | malformed — `payload.interactive_js_gzipped_kb: "should-be-a-number"` (string where a number is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"payload.interactive_js_gzipped_kb","detail":"payload.interactive_js_gzipped_kb must be a number"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `efficient_web_build_standard`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 49 checks and a text stamp):

```json
{"service": "efficient-web-build-standard", "atom_version": "0.1.0", "site": "example.com", "verdict": "EFFICIENT_WEB_BUILD_STANDARD_MET", "sections": {"publish_time_precompute_and_calls": "pass", "caching_layers": "pass", "bytes_compression_and_client_code": "pass", "delivery_security_and_process": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "pages_count": 1, "shared_pages_not_precomputed": [], "precomputed_pages_over_single_read": [], "total_calls_per_load": 1, "max_calls_per_load": 1, "precomputed_page_coverage": "1.000000", "single_read_page_coverage": "1.000000", "interactive_js_gzipped_kb": 200, "content_page_cpu_p99_ms": 0.5, "summary": "49 pass, 0 fail, 0 missing of 49 checks across four sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"payload.interactive_js_gzipped_kb","detail":"payload.interactive_js_gzipped_kb must be a number"}
```

## Findings

No findings.

## Tester errors

6 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 8 rejections in total — by rule: R1 check-register ×4, R2 structured-spot-checks ×2, R3 violations-full-manifest ×1, R4 malformed-exactly-one ×1. The corrected, executed battery passed the validator (`ok: true`) before execution.

1. (R2) Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`pages_count` `1`, `shared_pages_not_precomputed` `[]`, `precomputed_pages_over_single_read` `[]`, `total_calls_per_load` `1`, `max_calls_per_load` `1`, coverages `"1.000000"`, `interactive_js_gzipped_kb` `200`, `content_page_cpu_p99_ms` `0.5`, `computed_status` `within_stated_limits_on_declared_evidence`).
2. (R1) Violations designed `failing_checks` listed prose shorthand (`Shared content rendered at publish`, `Single read per precomputed page`, `Interactive JS within the stated budget`, `Content-page CPU P99 sub-millisecond`) instead of exact check names — 4 validator rejections. Corrected before execution to the 4 exact check names the planted values fail: `every_shared_content_page_rendered_at_publish`, `every_precomputed_page_serves_single_read`, `interactive_js_within_stated_budget`, `content_page_cpu_p99_sub_millisecond`.
3. (R2) Violations `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`pages_count` `2`, `shared_pages_not_precomputed` `["home"]`, `precomputed_pages_over_single_read` `["product"]`, `total_calls_per_load` `6`, `max_calls_per_load` `5`, coverages `"0.500000"`, `interactive_js_gzipped_kb` `500`, `content_page_cpu_p99_ms` `2.0`, `computed_status` `outside_stated_limits_on_declared_evidence`).
4. (R3) Violations input was sparse instead of a full manifest — it carried only `pages`, `payload.interactive_js_gzipped_kb` and `delivery.content_page_cpu_p99_ms`, omitting most of the full-pass manifest's key paths. Corrected before execution: rebuilt it as a full copy of the full-pass manifest carrying exactly the 4 planted violations and nothing else changed in the other sections.
5. (R4) Malformed designed with TWO type violations (`pages` as a string instead of a list, plus `plan` as a number instead of an object). Corrected before execution: reduced to exactly one type violation of a documented typed field — `payload.interactive_js_gzipped_kb` as a string where a number is required.
6. (design logic, no validator rule) Violations plant for the single-read check could not have failed as designed: the raw page `bad_page` declared `rendered_at_publish: false` with `calls_per_load: 5`, but the single-read check binds only pages declared rendered at publish, so a non-precomputed page's call count is not held to the bar. Corrected before execution: restructured the pages to `home` (shared, `rendered_at_publish: false`, `calls_per_load: 1` — plants the shared-content failure) and `product` (shared, `rendered_at_publish: true`, `calls_per_load: 5` — plants the single-read failure), verified against the oracle core in `services/efficient-web-build-standard/src/`.

The full-pass input was verified genuinely valid per SERVICE.md before execution (every required field present, correct types and nesting, gated checks passing on their declared gates — search present so the single-index value is required and true, hashed assets used so the max-age is required and `31536000` — no correction needed), and the sparse case (only `site`) was verified genuinely sparse and needed no correction.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the six primary computed checks, the gated hashed-asset and search-index checks, the declared counts, the row-name lists, the total/maximum calls, the coverage ratios under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/efficient-web-build-standard/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `pages_count` | 1 | 1 | ✓ |
| full-pass `precomputed_page_coverage` / `single_read_page_coverage` (1 ÷ 1) | "1.000000" / "1.000000" | "1.000000" / "1.000000" | ✓ |
| full-pass `total_calls_per_load` / `max_calls_per_load` | 1 / 1 | 1 / 1 | ✓ |
| full-pass `interactive_js_gzipped_kb` / `content_page_cpu_p99_ms` | 200 / 0.5 | 200 / 0.5 | ✓ |
| full-pass `computed_status` (all six computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `pages_count` | 2 | 2 | ✓ |
| violations `shared_pages_not_precomputed` / `precomputed_pages_over_single_read` | ["home"] / ["product"] | ["home"] / ["product"] | ✓ |
| violations `total_calls_per_load` (1 + 5) / `max_calls_per_load` | 6 / 5 | 6 / 5 | ✓ |
| violations `precomputed_page_coverage` / `single_read_page_coverage` (1 ÷ 2) | "0.500000" / "0.500000" | "0.500000" / "0.500000" | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 4 planted checks | same 4 | ✓ |
| verdicts | EFFICIENT_WEB_BUILD_STANDARD_MET / EFFICIENT_WEB_BUILD_STANDARD_NOT_MET (4 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 4-check failure set on the violations case. The coordinating tester's own mechanical re-verification of the raw evidence matches on every point (per-case HTTP status, verdicts, failing-check set, sparse outcome, malformed 422 field, determinism and parity); where the Gemini judge's computed-check list covered only four quantities, the full spot-check set was verified mechanically from the evidence and by DeepSeek, so no contradiction arises — the evidence stands as recorded.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `payload.interactive_js_gzipped_kb`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
