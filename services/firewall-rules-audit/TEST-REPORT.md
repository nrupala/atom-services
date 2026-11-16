# Test report — firewall-rules-audit

**Tester:** Gemini (`gemini-3.1-flash-lite`) via the house `custom.gemini`
connector — independent external tester (Academy Tester Doctrine: the
tester is never the builder). Gemini designed the cases from
`contract.yaml` + `SERVICE.md` and judged the recorded outputs; all HTTP
calls were executed by the verification harness against the live gateway
and recorded raw.
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal,
external metering, scopes = all live atoms.
**Evidence:** `verification/work/firewall-rules-audit/evidence.json`
(cases: `cases.json`; judgment: `judgment.json`).

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete valid evidence manifest | HTTP 200, verdict `SOUND` | HTTP 200, `SOUND`, "20 pass, 0 fail, 0 missing of 20 checks across five sections." stamp present and well-formed | PASS |
| 2 | violations — deliberate contract violations | HTTP 200, verdict `UNSOUND` | HTTP 200, `UNSOUND`, failing checks: `default_deny_inbound`, `default_deny_outbound`, `explicit_default_deny_rule_present`, `no_any_any_allow_rules`, `no_overly_broad_port_ranges`, `no_direct_sensitive_exposure`, `explicit_egress_allowlist`, `egress_alert_on_denies`, `changes_reviewed_like_code`, `old_rules_retired_on_schedule`, `denials_logged`, `denial_logging_rate_limited`, `post_change_test_allowed_and_blocked`, `smoke_matrix_per_service`, `review_cadence_within_31_days` (5 pass, 15 fail, 0 missing) | PASS |
| 3 | sparse — minimal manifest | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 20 missing | PASS |
| 4 | malformed — `review.cadence_days` as a string instead of a number | HTTP 422 clean input error, never a verdict | HTTP 200, verdict `UNSOUND` (0 pass, 1 fail, 19 missing) — type-violating values were evaluated as evidence | **FAIL — finding F1** |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical verdict core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `firewall_rules_audit`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200):

```json
{"service":"firewall-rules-audit","atom_version":"0.1.0","system":"production-cluster","environment":"production","verdict":"SOUND","sections":{"baseline":"pass","least_privilege":"pass","egress":"pass","documentation_change":"pass","assurance":"pass"},"checks":[{"section":"baseline","check":"default_deny_inbound","status":"pass","evidence":"skill method 1: default deny, both directions — inbound starts closed"},{"section":"baseline","check":"default_deny_outbound","status":"pass","evidence":"skill method 1: default deny, both directions — outbound starts closed"},{"section":"baseline","check":"explicit_default_deny_rule_present","status":"pass","evidence":"explicit default-deny rule present: deny-all-in"},{"section":"baseline","check":"layers_consistent","status":"pass","evidence":"skill method 4: platform layers consistent, no conflicting opens"},{"section":"least_privilege","check":"no_any_any_allow_rules","status":"pass","evidence":"no any-any allow rules"},{"section":"least_privilege","check":"no_overly_broad_port_ranges","status":"pass","evidence":"no allow rule spans 1000 or more ports"},{"section":"least_privilege","check":"no_shadowed_rules","status":"pass","evidence":"no shadowed rules"},{"section":"least_privilege","check":"no_direct_sensitive_exposure","status":"pass","evidence":"no direct exposure of databases, admin panels, or agent control planes"},{"section":"least_privilege","check":"no_port_forwards_without_review","status":"pass","evidence":"no port-forward without a review (port-forwards are inventory items with reviews)"},{"section":"egress","check":"explicit_egress_allowlist","status":"pass","evidence":"skill method 3: explicit egress — outbound allowlists for the services actually called"},{"section":"egress","check":"egress_alert_on_denies","status":"pass","evidence":"skill method 3: alert on denies to spot misconfig and compromise"},{"section":"documentation_change","check":"every_allow_rule_documented","status":"pass","evidence":"every allow entry has reason + owner + date (quality gate: every allow entry has reason + owner comment)"},{"section":"documentation_change","check":"changes_reviewed_like_code","status":"pass","evidence":"skill method 6: changes reviewed like code"},{"section":"documentation_change","check":"temporary_rules_have_ticket_and_expiry","status":"pass","evidence":"no temporary rule without a ticket and expiry date"},{"section":"documentation_change","check":"old_rules_retired_on_schedule","status":"pass","evidence":"skill method 6: old rules retired on a schedule"},{"section":"assurance","check":"denials_logged","status":"pass","evidence":"skill method 8: denials logged"},{"section":"assurance","check":"denial_logging_rate_limited","status":"pass","evidence":"skill method 8: denials logged with rate-limits to avoid noise floods"},{"section":"assurance","check":"post_change_test_allowed_and_blocked","status":"pass","evidence":"quality gate: post-change test — allowed path passes, disallowed fails"},{"section":"assurance","check":"smoke_matrix_per_service","status":"pass","evidence":"skill method 7: keep a smoke matrix per service"},{"section":"assurance","check":"review_cadence_within_31_days","status":"pass","evidence":"cadence_days=30 (skill: review top denied flows monthly; rule review performed on schedule)"}],"summary":"20 pass, 0 fail, 0 missing of 20 checks across five sections.","stamp":"FIREWALL RULES AUDIT\nsystem: production-cluster  environment: production\nVERDICT: SOUND\n  baseline             pass\n  least_privilege      pass\n  egress               pass\n  documentation_change pass\n  assurance            pass\n20 pass, 0 fail, 0 missing of 20 checks across five sections."}
```

Malformed response (REST, HTTP 200 — the finding; key fields, full
response in the evidence file):

```json
{
 "service": "firewall-rules-audit",
 "atom_version": "0.1.0",
 "system": "malformed-test",
 "environment": null,
 "verdict": "UNSOUND",
 "sections": {
  "baseline": "insufficient_evidence",
  "least_privilege": "insufficient_evidence",
  "egress": "insufficient_evidence",
  "documentation_change": "insufficient_evidence",
  "assurance": "fail"
 },
 "summary": "0 pass, 1 fail, 19 missing of 20 checks across five sections."
}
```

Malformed input submitted:

```json
{"system": "malformed-test", "review": {"cadence_days": "thirty"}}
```

## Findings

**F1 — Type-violating input returns a verdict instead of a clean input
error.** Case 4: `review.cadence_days` as a string instead of a number. Expected (test doctrine for
this program + the gateway's `invalid_input` mechanism in
`callpath.ts`): HTTP 422 `{ok:false, error:"invalid_input", field:...}`.
Actual: HTTP 200 with a `UNSOUND` verdict computed over the
garbage values (0 pass, 1 fail, 19 missing of 20 checks across five sections.; failing checks: `review_cadence_within_31_days`). The atom's
handler does not validate manifest field types before evaluation.
Contract clause: SERVICE.md: Input manifest. Disposition: **fix spec filed** —
`verification/fix-specs/firewall-rules-audit.md`, entry `firewall-rules-audit F1`.
Retest on redeploy.

One tester error, corrected and re-run (never recorded as an atom
failure). Gemini's first full-pass design set `default_policy` to
`deny` in both directions but included no explicit deny rule in the
`rules` list; the atom's `explicit_default_deny_rule_present` check
requires an explicit deny-any rule in the rules themselves — its own
test suite proves this is intended behaviour
(`test_missing_explicit_default_deny_rule_fails`). The case was
corrected by adding `deny-all-in` / `deny-all-out` deny-any rules, the
harness and judgment were re-run, and the corrected full-pass case
passes 20/20 (`SOUND`). Gemini's second judgment acknowledged the
correction in its `tester_errors` entry.

The violations case's actual failing list (15) includes three checks beyond the 12 Gemini listed — `explicit_default_deny_rule_present`, `no_overly_broad_port_ranges`, `no_direct_sensitive_exposure` — all direct consequences of the same any→any allow rule on ports 0–65535; the verdict and section outcomes are exactly as expected. Not a finding and not a tester error (the expected list was not stated as exhaustive).

## Final verdict

**FAIL** — core verdict logic is exact on all three verdict cases,
determinism and MCP/REST parity hold, the stamp is well-formed; the
single defect is F1 (malformed-input handling).

## Retest — 2026-11-15 (fix-stream deploy 7f9cae9fdd60417eb72062905a066554)

Gateway: https://atoms.pipavia.com, gateway version 1.1.0 (health HTTP 200), deployment `7f9cae9fdd60417eb72062905a066554`. Full recorded Wave 1 battery re-run unchanged via `verification/harness.py`; judgment via `verification/gemini_judge.py` (Gemini verdict: PASS); mechanical verification from the new `evidence.json` governs where the two conflict.

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass | HTTP 200, verdict=SOUND | HTTP 200, verdict=SOUND | PASS |
| 2 | violations | HTTP 200, verdict=UNSOUND | HTTP 200, verdict=UNSOUND | PASS |
| 3 | sparse | HTTP 200, verdict=INSUFFICIENT_EVIDENCE | HTTP 200, verdict=INSUFFICIENT_EVIDENCE | PASS |
| 4 | malformed | HTTP 422, error=invalid_input | HTTP 422, error=invalid_input, field=review.cadence_days | PASS |
| 5 | determinism | byte-identical repeat (full-pass) | byte_identical=True | PASS |
| 6 | parity | MCP structuredContent deep-equal to REST (full-pass) | structured_equal=True | PASS |

F1 disposition: F1 closed — malformed now returns 422 invalid_input (field: review.cadence_days). The Wave 1 defect (HTTP 200 verdict computed over wrong-typed fields) no longer reproduces; all other recorded cases return their expected HTTP status and verdict, and the full-pass case is deterministic (byte-identical) with MCP/REST parity (structuredContent deep-equal).

Tester errors this wave: none. Gemini's judgment (PASS, no findings, no tester errors) agrees with the mechanical evidence.

**Retest verdict: PASS**

