# Test report — release-readiness-verdict

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
**Evidence:** `verification/work/release-readiness-verdict/evidence.json`
(cases: `cases.json`; judgment: `judgment.json`).

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete valid release-evidence manifest | HTTP 200, verdict `READY`, 19/19 checks pass | HTTP 200, `READY`, "19 pass, 0 fail, 0 missing of 19 checks across five bars", stamp present and well-formed | PASS |
| 2 | violations — `rollback_plan.testable=false`, `health_check.window_hours=10` | HTTP 200, verdict `NOT_READY`, checks `rollback_plan_testable` + `post_release_health_window_24_to_48h` fail | HTTP 200, `NOT_READY`, exactly those 2 checks fail (17 pass, 2 fail, 0 missing) | PASS |
| 3 | sparse — only `product` + `version` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 1 pass / 0 fail / 18 missing | PASS |
| 4 | malformed — `product: 123`, `version_bump_locations: "not-a-list"`, `tag: "invalid-object-type"` | HTTP 422 clean input error, never a verdict | HTTP 200, verdict `NOT_READY` (1 pass, 1 fail, 17 missing) — type-violating values were evaluated as evidence | **FAIL — finding F1** |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical verdict core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `release_readiness_verdict`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200):

```json
{"service":"release-readiness-verdict","atom_version":"0.1.0","product":"milo-core","version":"1.2.3","verdict":"READY","bars":{"control":"pass","understanding":"pass","management":"pass","lifecycle":"pass","stability":"pass"},"checks":[{"bar":"control","check":"version_is_semver","status":"pass","evidence":"version='1.2.3'"},{"bar":"control","check":"release_is_tagged","status":"pass","evidence":"tag='v1.2.3' expected v1.2.3"},{"bar":"control","check":"tag_is_annotated","status":"pass","evidence":"annotated tag (skill: annotated tags, signed when keys exist)"},{"bar":"control","check":"published_tag_not_moved","status":"pass","evidence":"skill red line: never move a published tag"},{"bar":"control","check":"version_bumped_in_exactly_one_place","status":"pass","evidence":"version_bump_locations=['src/version.py']"},{"bar":"understanding","check":"changelog_entry_for_this_version","status":"pass","evidence":"Keep-a-Changelog: entry for this version ships in the same change"},{"bar":"understanding","check":"unreleased_section_moved_under_version","status":"pass","evidence":"[Unreleased] entries moved under the version at release"},{"bar":"understanding","check":"release_notes_present","status":"pass","evidence":"user-facing notes: what changed, why it matters"},{"bar":"understanding","check":"breaking_changes_have_migration_steps","status":"pass","evidence":"no breaking changes declared"},{"bar":"management","check":"approver_named","status":"pass","evidence":"rollout plan names the approver"},{"bar":"management","check":"human_approval_recorded","status":"pass","evidence":"skill red line: deploys stay HITL — automation prepares, humans approve"},{"bar":"management","check":"rollout_plan_present","status":"pass","evidence":"canary/staged where feasible"},{"bar":"lifecycle","check":"rollback_plan_present","status":"pass","evidence":"the rollback path is written before rolling out"},{"bar":"lifecycle","check":"rollback_plan_testable","status":"pass","evidence":"quality gate: rollback plan exists and is testable"},{"bar":"lifecycle","check":"post_release_health_window_24_to_48h","status":"pass","evidence":"window_hours=24 (skill: verify health for 24–48h)"},{"bar":"stability","check":"artifacts_sealed","status":"pass","evidence":"hash + sign build artifacts; manifest attached"},{"bar":"stability","check":"checksum_manifest_present","status":"pass","evidence":"provenance manifest present"},{"bar":"stability","check":"artifacts_verified_before_announcement","status":"pass","evidence":"quality gate: artifacts verified (checksums/signature) before announcement"},{"bar":"stability","check":"tests_passing","status":"pass","evidence":"quality gate: the suite that guards this release is green"}],"summary":"19 pass, 0 fail, 0 missing of 19 checks across five bars.","stamp":"RELEASE-READINESS VERDICT\nproduct: milo-core  version: 1.2.3\nVERDICT: READY\n  control        pass\n  understanding  pass\n  management     pass\n  lifecycle      pass\n  stability      pass\n19 pass, 0 fail, 0 missing of 19 checks across five bars."}
```

Malformed response (REST, HTTP 200 — the finding):

```json
{"service":"release-readiness-verdict","atom_version":"0.1.0","product":123,"version":"1.2.3","verdict":"NOT_READY","bars":{"control":"fail","understanding":"insufficient_evidence","management":"insufficient_evidence","lifecycle":"insufficient_evidence","stability":"insufficient_evidence"},"summary":"1 pass, 1 fail, 17 missing of 19 checks across five bars."}
```

## Findings

**F1 — Type-violating input returns a verdict instead of a clean input
error.** Case 4: `product` as a number, `version_bump_locations` as a
string, `tag` as a string. Expected (test doctrine for this program +
the gateway's `invalid_input` mechanism in `callpath.ts`): HTTP 422
`{ok:false, error:"invalid_input", field:...}`. Actual: HTTP 200 with a
`NOT_READY` verdict computed over the garbage values (`product` echoed
back as `123`). The atom's handler does not validate manifest field
types before evaluation. Disposition: **fix spec filed** —
`verification/FIX-SPECS.md`, entry `release-readiness-verdict F1`.
Retest on redeploy.

No tester errors in this atom's run. (Gemini's judgment additionally
remarked that determinism/parity were "not provided for all cases";
they are defined on the full-pass case only, by design, and both passed
there — not a finding.)

## Final verdict

**FAIL** — core verdict logic is exact on all three verdict cases,
determinism and MCP/REST parity hold, the stamp is well-formed; the
single defect is F1 (malformed-input handling).

## Retest — 2026-11-15 (fix-stream deploy 7f9cae9fdd60417eb72062905a066554)

Gateway: https://atoms.pipavia.com, gateway version 1.1.0 (health HTTP 200), deployment `7f9cae9fdd60417eb72062905a066554`. Full recorded Wave 1 battery re-run unchanged via `verification/harness.py`; judgment via `verification/gemini_judge.py` (Gemini verdict: FAIL); mechanical verification from the new `evidence.json` governs where the two conflict.

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass | HTTP 200, verdict=READY | HTTP 422, verdict=None | FAIL |
| 2 | violations | HTTP 200, verdict=NOT_READY | HTTP 422, verdict=None | FAIL |
| 3 | sparse | HTTP 200, verdict=INSUFFICIENT_EVIDENCE | HTTP 200, verdict=INSUFFICIENT_EVIDENCE | PASS |
| 4 | malformed | HTTP 422, error=invalid_input | HTTP 422, error=invalid_input, field=product | PASS |
| 5 | determinism | byte-identical repeat (full-pass) | byte_identical=True | PASS |
| 6 | parity | MCP structuredContent deep-equal to REST (full-pass) | structured_equal=False | FAIL |

F1 disposition: F1 closed — malformed now returns 422 invalid_input (field: product) — raw body: `{"ok":false,"error":"invalid_input","field":"product","detail":"product must be a string"}`. The original Wave 1 malformed defect no longer reproduces. However the same fix-stream validation introduces a new regression that keeps this atom at FAIL: the recorded full-pass and violations manifests — which passed live in Wave 1 (full-pass returned HTTP 200 READY; the core treated `release_notes.breaking_changes: false` as "no breaking changes declared") — now return HTTP 422 `{"ok":false,"error":"invalid_input","field":"release_notes.breaking_changes","detail":"release_notes.breaking_changes must be a list"}` instead of HTTP 200 READY / NOT_READY. SERVICE.md's input table names `release_notes.breaking_changes` without declaring a list type, so the new list-only validation contradicts the recorded, previously-valid battery. MCP parity also fails on the full-pass case (parity_structured_equal=false; MCP returns JSON-RPC error -32602 with the same validation message, no structuredContent). Determinism is byte-identical (true) only for the repeated 422 error response, not for a verdict.

Tester errors this wave: 1 — the Gemini judge simultaneously scored the full-pass 422 as an atom finding and labelled the recorded full-pass input a "tester error" (boolean `breaking_changes` vs a list requirement). That tester-error claim is rejected: the recorded battery is unchanged from Wave 1, where the same input returned HTTP 200 READY live, and SERVICE.md declares no list type for the field. Mechanical evidence governs; the failure is scored against the atom, not the tester. Gemini also did not flag the violations case, which fails for the identical reason (mechanical check: HTTP 422, expected HTTP 200 NOT_READY).

**Retest verdict: FAIL** — F1 malformed handling is fixed, but the fix's over-strict validation rejects the previously-valid recorded full-pass and violations manifests (422 on release_notes.breaking_changes) and breaks MCP parity.

## Wave 3 retest — 2026-11-15 (fix-round-2 + Batch 8 deploy babe764a73734f93a8016267e77af193)

Gateway: https://atoms.pipavia.com, gateway version 1.1.0, deployment `babe764a73734f93a8016267e77af193`. Full recorded battery re-run unchanged via `verification/harness.py` (cases: `verification/work/release-readiness-verdict/cases.json`, unchanged); judgment via `verification/gemini_judge.py` (Gemini verdict: PASS). Evidence: `verification/work/release-readiness-verdict/evidence.json` (retest wave preserved as `evidence-retest.json` / `judgment-retest.json`; Wave 1 preserved as `evidence-wave1.json` / `judgment-wave1.json`); judgment: `verification/work/release-readiness-verdict/judgment.json`. Mechanical verification from the raw evidence governs where it and the judge conflict.

| Case | Expected | Actual | Result |
|---|---|---|---|
| full-pass | HTTP 200, verdict `READY` | HTTP 200, verdict `READY`, 19 pass, 0 fail, 0 missing of 19 checks | PASS |
| violations | HTTP 200, verdict `NOT_READY`, failing checks include `rollback_plan.testable` and `health_check.window_hours` | HTTP 200, verdict `NOT_READY`, exactly 2 checks fail (`rollback_plan_testable`, `post_release_health_window_24_to_48h`), 17 pass, 2 fail, 0 missing | PASS |
| sparse | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | PASS |
| malformed | HTTP 422, error `invalid_input` naming field `product` | HTTP 422, `{"ok":false,"error":"invalid_input","field":"product","detail":"product must be a string"}` | PASS |
| determinism | byte-identical repeat (`determinism_byte_identical == true`) | `determinism_byte_identical == true` | PASS |
| parity | MCP `structuredContent` deep-equal to REST (`parity_structured_equal == true`) | `parity_structured_equal == true` | PASS |

F3 disposition: **F3 closed.** Fix round 2 aligned validation to SERVICE.md exactly (no documented type → no type rejection). The recorded full-pass and violations manifests, which carry `release_notes.breaking_changes: false` and returned HTTP 200 `READY` / `NOT_READY` in Wave 1 but HTTP 422 in the retest wave, now return HTTP 200 `READY` / `NOT_READY` again, and MCP/REST parity is restored (`parity_structured_equal == true`). F1 also remains closed — malformed still returns HTTP 422 `invalid_input` (field: `product`).

Tester errors this wave: 0 — `judgment.json` records verdict PASS, no findings, and no tester errors (`tester_errors: []`); Gemini's computed checks match on full-pass (19 pass, 0 fail, 0 missing), violations (17 pass, 2 fail, 0 missing), and sparse (1 pass, 0 fail, 18 missing). No case contradicting the contract was identified this wave.

**Wave 3 verdict: PASS** — all recorded cases pass unchanged: full-pass READY, violations NOT_READY with the expected failing checks, sparse INSUFFICIENT_EVIDENCE, malformed 422 invalid_input on product, determinism byte-identical, and parity structured-equal; F3 is closed.
