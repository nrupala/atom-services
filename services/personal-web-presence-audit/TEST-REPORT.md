# Test report — personal-web-presence-audit

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-16
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment c64bdc48fce84cd4817fe3a293be6ae5
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/personal-web-presence-audit/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (person `Jane Doe`): all hub/identity/structured-data/content/name-SEO/cadence/contact/measurement declarations in passing polarity, all six red-line flags false, one spoke row `janedoe.net` redirecting to the hub with consistent title/description, one profile row `linkedin` with matching bio and hub link | HTTP 200, verdict `PERSONAL_PRESENCE_CONSISTENT`, `spokes_count` `1`, `profiles_count` `1`, `redirect_coverage` `"1.000000"`, `title_description_consistency_coverage` `"1.000000"`, `bio_match_coverage` `"1.000000"`, `hub_link_coverage` `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `PERSONAL_PRESENCE_CONSISTENT`, 46 pass / 0 fail / 0 missing, all five sections `pass`, exactly those computed values (all row-name lists `[]`) | PASS |
| 2 | violations — full manifest identical to full-pass except spoke `janedoe.net` with `redirects_to_hub_or_purpose_page` false, profile `linkedin` with `links_to_hub` false, `content.claims_verifiable` false, and `red_lines.unverifiable_claims_present` true | HTTP 200, verdict `PERSONAL_PRESENCE_INCONSISTENT`, the 4 named checks fail | HTTP 200, `PERSONAL_PRESENCE_INCONSISTENT`, 42 pass / 4 fail / 0 missing; failing checks exactly `claims_verifiable`, `every_profile_links_to_hub`, `every_spoke_redirects_to_hub_or_purpose_page`, `no_unverifiable_claims`; `spokes_without_redirect` `["janedoe.net"]`, `redirect_coverage` `"0.000000"`, `profiles_without_hub_link` `["linkedin"]`, `hub_link_coverage` `"0.000000"`, `title_description_consistency_coverage` `"1.000000"`, `bio_match_coverage` `"1.000000"`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `hub_and_spokes`, `identity_facts_and_structured_data`, `content_standards_and_name_seo` and `red_lines` `fail`, `cadence_contact_and_measurement` `pass` | PASS |
| 3 | sparse — only `person` (`Jane Doe`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 46 missing, all five sections `insufficient_evidence`, `spokes_count` null, `profiles_count` null, all row-name lists null, all coverage ratios null, `computed_status` null | PASS |
| 4 | malformed — `hub: "not-an-object"` (string where an object is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"hub","detail":"hub must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `personal_web_presence_audit`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 46 checks and a text stamp):

```json
{"service": "personal-web-presence-audit", "atom_version": "0.1.0", "person": "Jane Doe", "verdict": "PERSONAL_PRESENCE_CONSISTENT", "sections": {"hub_and_spokes": "pass", "identity_facts_and_structured_data": "pass", "content_standards_and_name_seo": "pass", "cadence_contact_and_measurement": "pass", "red_lines": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "spokes_count": 1, "spokes_without_redirect": [], "redirect_coverage": "1.000000", "spokes_without_consistent_title_description": [], "title_description_consistency_coverage": "1.000000", "duplicate_spoke_domains": [], "profiles_count": 1, "profiles_without_matching_bio": [], "bio_match_coverage": "1.000000", "profiles_without_hub_link": [], "hub_link_coverage": "1.000000", "duplicate_profile_platforms": [], "summary": "46 pass, 0 fail, 0 missing of 46 checks across five sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"hub","detail":"hub must be an object"}
```

## Findings

No findings.

## Tester errors

5 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 4 rejections in total — by rule: R1 check-register ×2, R2 structured-spot-checks ×2. The corrected, executed battery passed the validator (`final_ok: true`) before execution.

1. (R1) Violations designed `failing_checks` named the input field path `red_lines.unverifiable_claims_present` instead of an exact check name — validator rejection: "failing_checks names 'red_lines.unverifiable_claims_present', which is not in the atom's check register (46 checks)". Corrected before execution as part of rebuilding the violations case (see item 5).
2. (R1) Violations designed `failing_checks` named the computed output field `spokes_without_redirect` instead of an exact check name — validator rejection: "failing_checks names 'spokes_without_redirect', which is not in the atom's check register (46 checks)". Corrected before execution as part of rebuilding the violations case (see item 5).
3. (R2) Full-pass `expect` carried no structured `computed_spot_checks` (the computed quantities appeared only in prose notes). Corrected before execution: structured spot checks were injected in structured form, computed per SERVICE.md and confirmed against the Python oracle (`computed_status` `within_stated_limits_on_declared_evidence`, `spokes_count` `1`, `spokes_without_redirect` `[]`, `redirect_coverage` `"1.000000"`, `spokes_without_consistent_title_description` `[]`, `title_description_consistency_coverage` `"1.000000"`, `duplicate_spoke_domains` `[]`, `profiles_count` `1`, `profiles_without_matching_bio` `[]`, `bio_match_coverage` `"1.000000"`, `profiles_without_hub_link` `[]`, `hub_link_coverage` `"1.000000"`, `duplicate_profile_platforms` `[]`).
4. (R2) Violations `expect` carried no structured `computed_spot_checks`. Corrected before execution: structured spot checks were injected in structured form, computed per SERVICE.md and confirmed against the Python oracle (`computed_status` `outside_stated_limits_on_declared_evidence`, `spokes_count` `1`, `spokes_without_redirect` `["janedoe.net"]`, `redirect_coverage` `"0.000000"`, `spokes_without_consistent_title_description` `[]`, `title_description_consistency_coverage` `"1.000000"`, `duplicate_spoke_domains` `[]`, `profiles_count` `1`, `profiles_without_matching_bio` `[]`, `bio_match_coverage` `"1.000000"`, `profiles_without_hub_link` `["linkedin"]`, `hub_link_coverage` `"0.000000"`, `duplicate_profile_platforms` `[]`).
5. (plant-adaptation) The violations case was rebuilt as a deep copy of the (genuinely valid) full-pass input plus planted mutations: `spokes[0].redirects_to_hub_or_purpose_page` = false, `profiles[0].links_to_hub` = false, `content.claims_verifiable` = false, `red_lines.unverifiable_claims_present` = true; `expect.failing_checks` was set to exactly the oracle's failing set — `claims_verifiable`, `every_profile_links_to_hub`, `every_spoke_redirects_to_hub_or_purpose_page`, `no_unverifiable_claims` — with outcome `PERSONAL_PRESENCE_INCONSISTENT` and no missing checks.

The full-pass input was verified genuinely valid against the Python oracle before execution (the oracle returns all 46 checks pass on it — no correction needed), the sparse case was replaced with an identity-only manifest (`{person}` only), and the malformed case was kept as designed: the raw malformed case carried exactly one documented type violation (`hub` as a string where an object is required), so no correction was needed.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the eight primary computed checks, the declared counts, the row-name lists, the coverage ratios under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/personal-web-presence-audit/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `spokes_count` | 1 | 1 | ✓ |
| full-pass `profiles_count` | 1 | 1 | ✓ |
| full-pass `redirect_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `title_description_consistency_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `bio_match_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `hub_link_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `spokes_without_redirect` / `spokes_without_consistent_title_description` / `duplicate_spoke_domains` / `profiles_without_matching_bio` / `profiles_without_hub_link` / `duplicate_profile_platforms` | [] / [] / [] / [] / [] / [] | [] / [] / [] / [] / [] / [] | ✓ |
| full-pass `computed_status` (all eight computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `spokes_without_redirect` (`janedoe.net` not redirecting) | ["janedoe.net"] | ["janedoe.net"] | ✓ |
| violations `redirect_coverage` (0 ÷ 1) | "0.000000" | "0.000000" | ✓ |
| violations `profiles_without_hub_link` (`linkedin` not linking) | ["linkedin"] | ["linkedin"] | ✓ |
| violations `hub_link_coverage` (0 ÷ 1) | "0.000000" | "0.000000" | ✓ |
| violations `title_description_consistency_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| violations `bio_match_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 4 planted checks | same 4 | ✓ |
| verdicts | PERSONAL_PRESENCE_CONSISTENT / PERSONAL_PRESENCE_INCONSISTENT (4 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 4-check failure set on the violations case.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `hub`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
