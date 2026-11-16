# Test report — domain-portfolio-audit

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 7bad54c4e4a145e493e8766eb2f3bafb
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/domain-portfolio-audit/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (portfolio `test-portfolio`, evaluation `2023-01-01`): all inventory/brand/DNS/email-auth/TLS/renewal/audit declarations true, the three must-be-false flags false, one active non-sending non-personal-brand domain `example.com` (renewal `2024-01-01`), alert window 30 days | HTTP 200, verdict `DOMAIN_PORTFOLIO_SOUND`, `domains_count` `1`, `purpose_coverage` `"1.0000"`, `email_auth_coverage` `null`, `nearest_renewal_days` `365`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `DOMAIN_PORTFOLIO_SOUND`, 44 pass / 0 fail / 0 missing, all four sections `pass`, exactly those computed values, `domains_lapsed` `[]`, `domains_within_alert_window` `[]` | PASS |
| 2 | violations — full manifest with `domains[].registrar` `""` (empty string) and `domains[].renewal_date` `2022-01-01` (before the `2023-01-01` evaluation date) | HTTP 200, verdict `DOMAIN_PORTFOLIO_NOT_SOUND`, the 2 named checks fail | HTTP 200, `DOMAIN_PORTFOLIO_NOT_SOUND`, 42 pass / 2 fail / 0 missing; failing checks exactly `every_domain_has_registrar`, `every_domain_renewal_not_lapsed`; `domains_lapsed` `["bad.com"]`, `nearest_renewal_days` `-365`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `inventory_and_brand_architecture` and `renewals_and_audit` `fail`, the other two `pass` | PASS |
| 3 | sparse — only `portfolio` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 44 missing, all four sections `insufficient_evidence`, `domains_count` null, `purpose_coverage` null, `email_auth_coverage` null, `nearest_renewal_days` null, `computed_status` null | PASS |
| 4 | malformed — `portfolio: 12345` (integer where a string is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"portfolio","detail":"portfolio must be a string"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `domain_portfolio_audit`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 44 checks and a text stamp):

```json
{"service": "domain-portfolio-audit", "atom_version": "0.1.0", "portfolio": "test-portfolio", "verdict": "DOMAIN_PORTFOLIO_SOUND", "sections": {"inventory_and_brand_architecture": "pass", "dns_and_redirects": "pass", "email_authentication_and_tls": "pass", "renewals_and_audit": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "domains_count": 1, "domains_without_purpose": [], "purpose_coverage": "1.0000", "email_auth_coverage": null, "domains_missing_email_auth": [], "domains_lapsed": [], "domains_within_alert_window": [], "nearest_renewal_days": 365, "redirect_loop_domains": [], "summary": "44 pass, 0 fail, 0 missing of 44 checks across four sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"portfolio","detail":"portfolio must be a string"}
```

## Findings

No findings.

## Tester errors

7 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with **6 rejections, by rule: R1 check-register ×2, R2 structured-spot-checks ×2, R3 violations-full-manifest ×1, R4 malformed-exactly-one ×1** (raw output preserved in `verification/work/domain-portfolio-audit/validation-raw.json`). The executed battery passed the validator (`ok: true`, 44-check register) before any call was made.

1. (R1) Violations `expect.failing_checks` named the field path `registrar` instead of an exact check name. Corrected before execution to `every_domain_has_registrar`.
2. (R1) Violations `expect.failing_checks` named the shorthand `renewals_not_lapsed` instead of an exact check name. Corrected before execution to `every_domain_renewal_not_lapsed`.
3. (R2) Full-pass `expect` carried the computed quantities only in prose notes (`domains_count=1, purpose_coverage=1.0000`), with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`domains_count` `1`, `computed_status` `within_stated_limits_on_declared_evidence`, `purpose_coverage` `"1.0000"`, `email_auth_coverage` `null`, `domains_without_purpose` `[]`, `domains_missing_email_auth` `[]`, `domains_lapsed` `[]`, `domains_within_alert_window` `[]`, `nearest_renewal_days` `365`, `redirect_loop_domains` `[]`).
4. (R2) Violations `expect` carried no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`domains_count` `1`, `computed_status` `outside_stated_limits_on_declared_evidence`, `purpose_coverage` `"1.0000"`, `email_auth_coverage` `null`, `domains_without_purpose` `[]`, `domains_missing_email_auth` `[]`, `domains_lapsed` `["bad.com"]`, `domains_within_alert_window` `[]`, `nearest_renewal_days` `-365`, `redirect_loop_domains` `[]`).
5. (R3) Violations input was sparse — only `portfolio`, `evaluation_date` and one domain row, with all inventory/brand/DNS/redirect/email-auth/TLS/renewal/audit sections missing (it would have read as missing evidence, not failure). Corrected before execution: rebuilt it as a full manifest with the same structure as the corrected full-pass manifest, carrying exactly the two planted violations (empty `registrar`, lapsed `renewal_date`).
6. (R4) Malformed designed with TWO type violations (`portfolio` as an integer instead of a string, plus `domains` as a string instead of a list). Corrected before execution: reduced to exactly one type violation of a documented typed field — `portfolio` as an integer where a string is required.
7. (Mis-nested fields) Full-pass placed `redirect_map_as_code` and `redirect_map_reviewed_in_diffs` under `inventory`, where SERVICE.md and the manifest spec place them under `brand_architecture` — as designed, those two checks would have been missing evidence and the case could not have passed. Corrected before execution: moved both fields to a `brand_architecture` object (the violations full manifest in correction 5 uses the corrected nesting). This error was found on the tester's own contract review; it is additional to the validator's 6 raw-design rejections above.

The sparse case needed no correction, and after correction 7 the full-pass input was verified genuinely valid per SERVICE.md (every required field present, correct types and nesting — verified against the local oracle: 44 pass, and every structured spot-check value matched).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (domain counts, the purpose and email-auth coverage ratios under SERVICE.md's fixed four-decimal serialization rule, the lapsed/within-window row lists and the renewal-day arithmetic against the caller-declared evaluation date and alert window, the redirect-loop list, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/domain-portfolio-audit/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `domains_count` (declared list length) | 1 | 1 | ✓ |
| full-pass `purpose_coverage` (1 ÷ 1, 4dp string) | "1.0000" | "1.0000" | ✓ |
| full-pass `email_auth_coverage` (no sending domains → null) | null | null | ✓ |
| full-pass `domains_lapsed` (2024-01-01 ≥ 2023-01-01) | [] | [] | ✓ |
| full-pass `domains_within_alert_window` (365 > 30-day window) | [] | [] | ✓ |
| full-pass `nearest_renewal_days` (2023-01-01 → 2024-01-01) | 365 | 365 | ✓ |
| full-pass `redirect_loop_domains` (no redirect rows) | [] | [] | ✓ |
| full-pass `computed_status` (six primary computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `domains_count` | 1 | 1 | ✓ |
| violations `purpose_coverage` (1 ÷ 1, 4dp string) | "1.0000" | "1.0000" | ✓ |
| violations `email_auth_coverage` (no sending domains → null) | null | null | ✓ |
| violations `domains_lapsed` (2022-01-01 < 2023-01-01) | ["bad.com"] | ["bad.com"] | ✓ |
| violations `domains_within_alert_window` (−365 < 0) | [] | [] | ✓ |
| violations `nearest_renewal_days` (2022-01-01 − 2023-01-01) | -365 | -365 | ✓ |
| violations `computed_status` (a primary computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 2 planted checks | same 2 | ✓ |
| verdicts | DOMAIN_PORTFOLIO_SOUND / DOMAIN_PORTFOLIO_NOT_SOUND (2 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 2-check failure set on the violations case. The coordinating tester's own headline recompute also matches: renewal arithmetic 2024-01-01 − 2023-01-01 = 365 days (outside the declared 30-day window) on full-pass and 2022-01-01 − 2023-01-01 = −365 days (lapsed) on violations, identical to the artifacts. Where Gemini's judgment was checked against the raw evidence, it did not contradict it.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `portfolio`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
