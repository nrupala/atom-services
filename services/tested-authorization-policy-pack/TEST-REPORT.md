# Test report — tested-authorization-policy-pack

**Tester:** Gemini (`gemini-3.1-flash-lite`) via the house `custom.gemini`
connector — independent external tester (Academy Tester Doctrine: the
tester is never the builder). Gemini designed the cases from
`contract.yaml` + `SERVICE.md` and judged the recorded outputs; all HTTP
calls were executed by the verification harness against the live gateway
and recorded raw. The undersigned verification lane re-checked every
judgment against the raw evidence before disposition.
**Second tester:** DeepSeek (independent recomputation — see its section
below).
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal,
external metering, scopes = all live atoms.
**Evidence:** `verification/work/tested-authorization-policy-pack/evidence.json`
(cases: `cases.json`; judgment: `judgment.json`; DeepSeek raw:
`deepseek-raw.txt`).

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — 2 policies both default `deny`, each with positive/negative/edge tests, all posture fields true / red-line fields false | HTTP 200, verdict `READY`, 29/29 checks pass, `policy_count=2`, `tested_policy_count=2`, `test_count=6`, `test_coverage_ratio="1.0000"`, `coverage_status=complete_on_declared_tests` | HTTP 200, `READY`, exactly those figures, "29 pass, 0 fail, 0 missing", `untested_policy_ids=[]` | PASS |
| 2 | violations — policy `p1` defaults to `allow`, only a positive test declared, `silent_policy_edits=true`, `bypass_paths_present=true` | HTTP 200, verdict `NOT_READY`, the default-deny, per-policy test-completeness, silent-edits and bypass checks fail | HTTP 200, `NOT_READY` with exactly 4 failing checks — `every_policy_defaults_to_deny`, `positive_negative_edge_tests_per_policy`, `no_silent_policy_edits`, `no_bypass_paths` — "25 pass, 4 fail, 0 missing", `coverage_status=incomplete_on_declared_tests`, `policy_count=1`, `tested_policy_count=1`, `test_count=1`, `test_coverage_ratio="1.0000"` | PASS |
| 3 | sparse — only `pack: "minimal-pack"` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 29 missing, computed fields null | PASS |
| 4 | malformed — `decision_model: "not-an-object"`, `policies: "not-a-list"` | HTTP 422 clean input error, never a verdict | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` (0 pass, 0 fail, 29 missing) — the type-violating values were evaluated as evidence | **FAIL — finding F1** |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical verdict core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `tested_authorization_policy_pack`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full
response also carries all 29 checks and a text stamp):

```json
{"service":"tested-authorization-policy-pack","atom_version":"0.1.0","pack":"auth-v1","verdict":"READY","sections":{"decision_model":"pass","policy_code":"pass","testing":"pass","rollout":"pass","decision_logs":"pass","governance_and_enforcement":"pass"},"coverage_status":"complete_on_declared_tests","policy_count":2,"tested_policy_count":2,"test_count":6,"test_coverage_ratio":"1.0000","untested_policy_ids":[],"summary":"29 pass, 0 fail, 0 missing of 29 checks across six sections."}
```

Violations response (REST, HTTP 200; sections and computed fields):

```json
{"service":"tested-authorization-policy-pack","atom_version":"0.1.0","pack":"auth-v1","verdict":"NOT_READY","sections":{"decision_model":"fail","policy_code":"pass","testing":"fail","rollout":"fail","decision_logs":"pass","governance_and_enforcement":"fail"},"coverage_status":"incomplete_on_declared_tests","policy_count":1,"tested_policy_count":1,"test_count":1,"test_coverage_ratio":"1.0000","untested_policy_ids":[],"summary":"25 pass, 4 fail, 0 missing of 29 checks across six sections."}
```

Malformed response (REST, HTTP 200 — finding F1):

```json
{"service":"tested-authorization-policy-pack","atom_version":"0.1.0","pack":"bad-types","verdict":"INSUFFICIENT_EVIDENCE","sections":{"decision_model":"insufficient_evidence","policy_code":"insufficient_evidence","testing":"insufficient_evidence","rollout":"insufficient_evidence","decision_logs":"insufficient_evidence","governance_and_enforcement":"insufficient_evidence"},"coverage_status":null,"policy_count":null,"tested_policy_count":null,"test_count":null,"test_coverage_ratio":null,"untested_policy_ids":[],"summary":"0 pass, 0 fail, 29 missing of 29 checks across six sections."}
```

## Findings

**F1 — Type-violating input returns a verdict instead of a clean input
error.** Case 4: `decision_model` as a string, `policies` as a string.
Expected (test doctrine for this program + the gateway's `invalid_input`
mechanism in `callpath.ts`): HTTP 422
`{ok:false, error:"invalid_input", field:...}`. Actual: HTTP 200 with
an `INSUFFICIENT_EVIDENCE` verdict computed over the garbage values.
The atom's handler does not validate manifest field types before
evaluation. Disposition: **fix spec filed** —
`verification/fix-specs/tested-authorization-policy-pack.md`.
Retest on redeploy.

No tester errors in this atom's run. (Gemini's designed
`failing_checks` for the violations case used shorthand names —
`default_deny`, `unit_tests_per_rule` — for the checks the artifact
reports as `every_policy_defaults_to_deny` and
`positive_negative_edge_tests_per_policy`; the failing set is the
same four checks in substance, the Gemini judge mapped them, and no
case correction or re-run was required.)

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from
the case inputs by hand (policy counts from the declared `policies[]`,
tested-policy counts and test counts from the declared `tests[]`, the
test-coverage ratio as the tested-policy share with the fixed
four-decimal serialization, coverage status, and the verdicts implied
by the declared posture fields) and verified the artifact's numbers
and verdicts. Raw output:
`verification/work/tested-authorization-policy-pack/deepseek-raw.txt`.

**DeepSeek verdict: FAIL** — the same single defect finding F1
(malformed input returns HTTP 200 with a verdict instead of HTTP 422).

Its computed checks — all 13 match:

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass policy_count | 2 | 2 | ✓ |
| full-pass tested_policy_count | 2 | 2 | ✓ |
| full-pass test_count | 6 | 6 | ✓ |
| full-pass test_coverage_ratio | 1.0000 | 1.0000 | ✓ |
| full-pass verdict | READY | READY | ✓ |
| full-pass failing_checks | [] | [] | ✓ |
| violations policy_count | 1 | 1 | ✓ |
| violations tested_policy_count | 1 | 1 | ✓ |
| violations test_count | 1 | 1 | ✓ |
| violations test_coverage_ratio | 1.0000 | 1.0000 | ✓ |
| violations verdict | NOT_READY | NOT_READY | ✓ |
| violations failing check count | 4 | 4 | ✓ |
| violations coverage_status | incomplete_on_declared_tests | incomplete_on_declared_tests | ✓ |

**Agreement / disagreement:** the testers agree on F1, on the FAIL
verdict, and on every recomputed quantity. DeepSeek additionally
flagged, as a second finding, that Gemini's designed
`failing_checks` names for the violations case do not literally match
the artifact's check identifiers (see the note under Findings). This
lane dispositions that point **in Gemini's / the atom's favour on
substance**: DeepSeek itself records that "the verdict (NOT_READY)
and the set of failing sections are correct" and that the point is "a
naming mismatch in the expectation metadata rather than a
computational error" — the four expected failures are the four actual
failures, so it is not an atom defect and not a tester error affecting
any outcome. F1 is the sole finding.

## Final verdict

**FAIL** — verdict logic and the computed default-deny / test-coverage
quantities are exact on the valid cases (confirmed by two independent
testers), determinism and MCP/REST parity hold; the single defect is
F1 (malformed-input handling).

## Retest — 2026-11-15 (fix-stream deploy 7f9cae9fdd60417eb72062905a066554)

Gateway/deployment: live gateway https://atoms.pipavia.com, gateway version 1.1.0 (health HTTP 200), fix-stream deployment 7f9cae9fdd60417eb72062905a066554; retest evidence recorded 2026-11-15T23:51:55.166579+00:00 (`verification/work/tested-authorization-policy-pack/evidence.json`). Wave 1 evidence preserved as `evidence-wave1.json` / `judgment-wave1.json`. The full recorded Wave 1 battery was re-run unmodified (harness.py), judged by Gemini (`judgment.json`: **PASS**, 0 findings, 0 tester errors, all computed checks match), and verified mechanically from the raw evidence.

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass | HTTP 200, verdict READY | HTTP 200, verdict READY | PASS |
| 2 | violations | HTTP 200, verdict NOT_READY | HTTP 200, verdict NOT_READY | PASS |
| 3 | sparse | HTTP 200, verdict INSUFFICIENT_EVIDENCE | HTTP 200, verdict INSUFFICIENT_EVIDENCE | PASS |
| 4 | malformed | HTTP 422 {ok:false, error:"invalid_input"}, no verdict | HTTP 422 {ok:false, error:"invalid_input", field:"decision_model"} | PASS |
| 5 | determinism (full-pass repeat) | byte-identical repeat response | determinism_byte_identical = true | PASS |
| 6 | parity (MCP vs REST, full-pass) | MCP structuredContent deep-equals REST artifact | parity_structured_equal = true | PASS |

**F1 disposition: RESOLVED.** Wave 1 F1 was: type-violating manifest fields returned HTTP 200 with a verdict computed over garbage instead of HTTP 422 `{ok:false, error:"invalid_input"}`. On retest the malformed case returns HTTP 422 with body `{"ok": false, "error": "invalid_input", "field": "decision_model", "detail": "decision_model must be an object"}` — exactly the contract error, no verdict artifact. All other cases (full-pass, violations, sparse) return their Wave 1-correct outcomes unchanged, and determinism and MCP/REST parity still hold. F1 is closed by this retest; no new findings.

### Second tester — DeepSeek (retest)

DeepSeek verdict: **PASS** — findings: none. It independently recomputed, with arithmetic shown: full-pass `policy_count` = 2, `tested_policy_count` = 2, `test_count` = 6, `test_coverage_ratio` = 2/2 = **1.0000**, `coverage_status` = complete_on_declared_tests, verdict READY (29 pass / 0 fail / 0 missing); violations `policy_count` = 1, `tested_policy_count` = 1, `test_count` = 1, ratio **1.0000**, coverage incomplete_on_declared_tests, exactly 4 fails (default-allow, positive/negative/edge tests, silent edits, bypass paths) → NOT_READY; sparse INSUFFICIENT_EVIDENCE with null counts; malformed 422 invalid_input confirmed. Every computed check matches the artifact — **recomputed mismatches: none**. Raw output: `verification/work/tested-authorization-policy-pack/deepseek-retest-raw.txt`.

Tester errors: none.

**Retest verdict: PASS**
