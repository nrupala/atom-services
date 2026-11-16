# Test report — dependency-governance-audit

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
**Evidence:** `verification/work/dependency-governance-audit/evidence.json`
(cases: `cases.json`; judgment: `judgment.json`).

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete valid evidence manifest | HTTP 200, verdict `GOVERNED` | HTTP 200, `GOVERNED`, "21 pass, 0 fail, 0 missing of 21 checks across six sections." stamp present and well-formed | PASS |
| 2 | violations — deliberate contract violations | HTTP 200, verdict `NOT_GOVERNED` | HTTP 200, `NOT_GOVERNED`, failing checks: `binary_checksums_verified`, `no_automerge_without_green_suite` (19 pass, 2 fail, 0 missing) | PASS |
| 3 | sparse — minimal manifest | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 1 pass / 0 fail / 20 missing | PASS |
| 4 | malformed — `justification` as a string instead of an object, `sources.all_official` as a string instead of a boolean | HTTP 422 clean input error, never a verdict | HTTP 200, verdict `NOT_GOVERNED` (0 pass, 1 fail, 20 missing) — type-violating values were evaluated as evidence | **FAIL — finding F1** |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical verdict core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `dependency_governance_audit`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200):

```json
{"service":"dependency-governance-audit","atom_version":"0.1.0","project":"test-project","verdict":"GOVERNED","sections":{"justification":"pass","verified_sources":"pass","pinning":"pass","audit_and_updates":"pass","licences":"pass","sbom":"pass"},"checks":[{"section":"justification","check":"new_dependencies_justified_in_pr","status":"pass","evidence":"quality gate: new dependency justified in the PR (what/why/alternatives)"},{"section":"justification","check":"alternatives_considered","status":"pass","evidence":"prefer the standard library; prefer boring, maintained, small"},{"section":"verified_sources","check":"all_dependencies_from_official_sources","status":"pass","evidence":"skill red line: no dependencies from unknown sources; official registries/repos only"},{"section":"verified_sources","check":"publisher_and_signing_checked","status":"pass","evidence":"check publisher, release signing where available"},{"section":"verified_sources","check":"binary_checksums_verified","status":"pass","evidence":"checksums for binaries"},{"section":"pinning","check":"exact_versions_pinned","status":"pass","evidence":"skill red line: no unpinned \"latest\"; exact versions"},{"section":"pinning","check":"lockfile_committed","status":"pass","evidence":"lockfiles committed"},{"section":"pinning","check":"lockfile_updated_in_same_change","status":"pass","evidence":"quality gate: lockfile updated in the same change"},{"section":"pinning","check":"ci_installs_from_lockfile","status":"pass","evidence":"CI installs from the lock"},{"section":"pinning","check":"ci_actions_and_images_pinned_to_hashes","status":"pass","evidence":"quality gate: no unpinned CI actions or images; pin to commit hashes"},{"section":"audit_and_updates","check":"automated_audit_in_workflow","status":"pass","evidence":"automated audit in the normal workflow"},{"section":"audit_and_updates","check":"bot_bumps_reviewed_not_blind_merged","status":"pass","evidence":"review bot bumps — do not blind-merge them"},{"section":"audit_and_updates","check":"no_automerge_without_green_suite","status":"pass","evidence":"skill red line: no auto-merge of dependency bumps without a green suite"},{"section":"audit_and_updates","check":"updates_batched","status":"pass","evidence":"update policy: batch updates, run the suite"},{"section":"audit_and_updates","check":"stale_dependencies_flagged","status":"pass","evidence":"flag anything with no release in ~2 years"},{"section":"audit_and_updates","check":"unused_dependencies_retired","status":"pass","evidence":"retire unused deps"},{"section":"licences","check":"licences_checked","status":"pass","evidence":"quality gate: license checked"},{"section":"licences","check":"non_permissive_licences_have_human_decision","status":"pass","evidence":"copyleft or commercial goes to an explicit human decision"},{"section":"licences","check":"notice_updated_when_required","status":"pass","evidence":"quality gate: NOTICE updated when required"},{"section":"sbom","check":"sbom_generated_per_release","status":"pass","evidence":"SBOM: generate per release where feasible"},{"section":"sbom","check":"sbom_kept_with_release_artifacts","status":"pass","evidence":"keep SBOM with release artifacts"}],"summary":"21 pass, 0 fail, 0 missing of 21 checks across six sections.","stamp":"DEPENDENCY-GOVERNANCE AUDIT\nproject: test-project\nVERDICT: GOVERNED\n  justification      pass\n  verified_sources   pass\n  pinning            pass\n  audit_and_updates  pass\n  licences           pass\n  sbom               pass\n21 pass, 0 fail, 0 missing of 21 checks across six sections."}
```

Malformed response (REST, HTTP 200 — the finding; key fields, full
response in the evidence file):

```json
{
 "service": "dependency-governance-audit",
 "atom_version": "0.1.0",
 "project": "malformed-project",
 "verdict": "NOT_GOVERNED",
 "sections": {
  "justification": "insufficient_evidence",
  "verified_sources": "fail",
  "pinning": "insufficient_evidence",
  "audit_and_updates": "insufficient_evidence",
  "licences": "insufficient_evidence",
  "sbom": "insufficient_evidence"
 },
 "summary": "0 pass, 1 fail, 20 missing of 21 checks across six sections."
}
```

Malformed input submitted:

```json
{"project": "malformed-project", "justification": "not-an-object", "sources": {"all_official": "should-be-boolean"}}
```

## Findings

**F1 — Type-violating input returns a verdict instead of a clean input
error.** Case 4: `justification` as a string instead of an object, `sources.all_official` as a string instead of a boolean. Expected (test doctrine for
this program + the gateway's `invalid_input` mechanism in
`callpath.ts`): HTTP 422 `{ok:false, error:"invalid_input", field:...}`.
Actual: HTTP 200 with a `NOT_GOVERNED` verdict computed over the
garbage values (0 pass, 1 fail, 20 missing of 21 checks across six sections.; failing checks: `all_dependencies_from_official_sources`). The atom's
handler does not validate manifest field types before evaluation.
Contract clause: SERVICE.md: Inputs — the dependency-governance evidence manifest. Disposition: **fix spec filed** —
`verification/fix-specs/dependency-governance-audit.md`, entry `dependency-governance-audit F1`.
Retest on redeploy.

No tester errors in this atom's run.

## Final verdict

**FAIL** — core verdict logic is exact on all three verdict cases,
determinism and MCP/REST parity hold, the stamp is well-formed; the
single defect is F1 (malformed-input handling).

## Retest — 2026-11-15 (fix-stream deploy 7f9cae9fdd60417eb72062905a066554)

Gateway: https://atoms.pipavia.com, gateway version 1.1.0 (health HTTP 200), deployment `7f9cae9fdd60417eb72062905a066554`. Full recorded Wave 1 battery re-run unchanged via `verification/harness.py`; judgment via `verification/gemini_judge.py` (Gemini verdict: PASS); mechanical verification from the new `evidence.json` governs where the two conflict.

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass | HTTP 200, verdict=GOVERNED | HTTP 200, verdict=GOVERNED | PASS |
| 2 | violations | HTTP 200, verdict=NOT_GOVERNED | HTTP 200, verdict=NOT_GOVERNED | PASS |
| 3 | sparse | HTTP 200, verdict=INSUFFICIENT_EVIDENCE | HTTP 200, verdict=INSUFFICIENT_EVIDENCE | PASS |
| 4 | malformed | HTTP 422, error=invalid_input | HTTP 422, error=invalid_input, field=justification | PASS |
| 5 | determinism | byte-identical repeat (full-pass) | byte_identical=True | PASS |
| 6 | parity | MCP structuredContent deep-equal to REST (full-pass) | structured_equal=True | PASS |

F1 disposition: F1 closed — malformed now returns 422 invalid_input (field: justification). The Wave 1 defect (HTTP 200 verdict computed over wrong-typed fields) no longer reproduces; all other recorded cases return their expected HTTP status and verdict, and the full-pass case is deterministic (byte-identical) with MCP/REST parity (structuredContent deep-equal).

Tester errors this wave: none. Gemini's judgment (PASS, no findings, no tester errors) agrees with the mechanical evidence.

**Retest verdict: PASS**

