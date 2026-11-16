# Test report — vfd-application-engineering-check

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
**Evidence:** `verification/work/vfd-application-engineering-check/evidence.json`
(cases: `cases.json`; judgment: `judgment.json`; DeepSeek raw:
`deepseek-raw.txt`).

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — harmonics 3.5% vs 5.0% site limit, cable 50 m vs 100 m OEM max, derated 100 A vs 90 A required, all evidence true, troubleshooting closed | HTTP 200, verdict `SOUND`, 37/37 checks pass, margins harmonic 1.5000 / cable 50.0000 / current 10.0000 | HTTP 200, `SOUND`, "37 pass, 0 fail, 0 missing", `engineering_status` `sound_on_declared_values`, margins exactly as expected | PASS |
| 2 | violations — harmonics 10.0% > 5.0% limit, cable 150 m > 100 m OEM max, derated 50 A < 90 A required, hipot performed on drive output, protections bypassed without approval | HTTP 200, verdict `NOT_SOUND`, the three computed checks and both red-line records checks fail | HTTP 200, `NOT_SOUND`, exactly those 5 checks fail (`harmonics_within_declared_site_limit`, `cable_length_within_oem_limit`, `derated_current_covers_required_load_current`, `no_hipot_on_drive_output`, `no_protection_bypass_without_documented_approval`); 32 pass, 5 fail; margins −5.0000 / −50.0000 / −40.0000 | PASS |
| 3 | sparse — only `asset` + `application.load_torque_type` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 1 pass / 0 fail / 36 missing, all margins and `engineering_status` null | PASS |
| 4 | malformed — `application.starts_per_hour: "not-a-number"` (string where a number is required) | HTTP 422 clean input error, never a verdict | HTTP 200, verdict `NOT_SOUND` (0 pass, 1 fail, 36 missing) — the type-violating value was evaluated as a failed check | **FAIL — finding F1** |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical verdict core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `vfd_application_engineering_check`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full
response carries all 37 checks and a text stamp):

```json
{"service":"vfd-application-engineering-check","atom_version":"0.1.0","asset":"VFD-001","verdict":"SOUND","sections":{"application_profile":"pass","power_quality":"pass","motor_cable_drive":"pass","protection_and_control":"pass","commissioning":"pass","troubleshooting":"pass","records_and_red_lines":"pass"},"engineering_status":"sound_on_declared_values","harmonic_margin_percent":"1.5000","cable_margin_m":"50.0000","current_margin_a":"10.0000","summary":"37 pass, 0 fail, 0 missing of 37 checks across seven sections."}
```

Violations response (REST, HTTP 200; checks array trimmed):

```json
{"service":"vfd-application-engineering-check","atom_version":"0.1.0","asset":"VFD-002","verdict":"NOT_SOUND","sections":{"application_profile":"pass","power_quality":"fail","motor_cable_drive":"fail","protection_and_control":"pass","commissioning":"pass","troubleshooting":"pass","records_and_red_lines":"fail"},"engineering_status":"not_sound_on_declared_values","harmonic_margin_percent":"-5.0000","cable_margin_m":"-50.0000","current_margin_a":"-40.0000","summary":"32 pass, 5 fail, 0 missing of 37 checks across seven sections."}
```

Malformed response (REST, HTTP 200 — the finding):

```json
{"service":"vfd-application-engineering-check","atom_version":"0.1.0","asset":"VFD-004","verdict":"NOT_SOUND","sections":{"application_profile":"fail","power_quality":"insufficient_evidence","motor_cable_drive":"insufficient_evidence","protection_and_control":"insufficient_evidence","commissioning":"insufficient_evidence","troubleshooting":"insufficient_evidence","records_and_red_lines":"insufficient_evidence"},"engineering_status":null,"harmonic_margin_percent":null,"cable_margin_m":null,"current_margin_a":null,"summary":"0 pass, 1 fail, 36 missing of 37 checks across seven sections."}
```

## Findings

**F1 — Type-violating input returns a verdict instead of a clean input
error.** Case 4: `application.starts_per_hour` as the string
`"not-a-number"`. Expected (test doctrine for this program + the
gateway's `invalid_input` mechanism in `callpath.ts`): HTTP 422
`{ok:false, error:"invalid_input", field:...}`. Actual: HTTP 200 with
a `NOT_SOUND` verdict computed over the garbage value (the string was
scored as a failed `starts_per_hour_declared` check). The atom's
handler does not validate manifest field types before evaluation.
Disposition: **fix spec filed** —
`verification/fix-specs/vfd-application-engineering-check.md`.
Retest on redeploy.

No tester errors in this atom's run. Gemini's judgment was verified
against the raw evidence and matches it on every case (its computed
spot checks — harmonic margin 1.5000, cable margin 50.0000, current
margin 10.0000 — match the recorded artifact, and its designed
full-pass input is genuinely valid per SERVICE.md).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from
the case inputs by hand (site limit minus declared distortion, OEM max
minus declared cable length, derated minus required current, for both
the full-pass and violations cases, plus the check counts and verdicts
for the violations and sparse cases) and verified the artifact's
numbers and verdicts. Raw output:
`verification/work/vfd-application-engineering-check/deepseek-raw.txt`.

**DeepSeek verdict: FAIL** — the same single finding (malformed input
returns HTTP 200 with a verdict instead of HTTP 422). Its violations
and sparse entries are confirmations, not defects: it recomputed all
37 checks for the violations case (5 fail / 32 pass) and the sparse
case (1 pass / 0 fail / 36 missing, null margins) and found both
artifacts exact.

Its computed checks (all match):

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `harmonic_margin_percent` | 1.5000 | 1.5000 | ✓ |
| full-pass `cable_margin_m` | 50.0000 | 50.0000 | ✓ |
| full-pass `current_margin_a` | 10.0000 | 10.0000 | ✓ |
| violations `harmonic_margin_percent` | −5.0000 | −5.0000 | ✓ |
| violations `cable_margin_m` | −50.0000 | −50.0000 | ✓ |
| violations `current_margin_a` | −40.0000 | −40.0000 | ✓ |

**Agreement / disagreement:** the testers agree in full. Gemini and
DeepSeek return the same verdict (FAIL), the same single finding
(F1), and every recomputed margin matches on both computed cases.
There is no disagreement to disposition.

## Final verdict

**FAIL** — verdict logic and every computed margin are exact on the
valid cases (confirmed by two independent testers), determinism and
MCP/REST parity hold; the single defect is F1 (malformed-input
handling).

## Retest — 2026-11-15 (fix-stream deploy 7f9cae9fdd60417eb72062905a066554)

Gateway/deployment: live gateway https://atoms.pipavia.com, gateway version 1.1.0 (health HTTP 200), fix-stream deployment 7f9cae9fdd60417eb72062905a066554; retest evidence recorded 2026-11-15T23:52:43.798032+00:00 (`verification/work/vfd-application-engineering-check/evidence.json`). Wave 1 evidence preserved as `evidence-wave1.json` / `judgment-wave1.json`. The full recorded Wave 1 battery was re-run unmodified (harness.py), judged by Gemini (`judgment.json`: **PASS**, 0 findings, 0 tester errors, all computed checks match), and verified mechanically from the raw evidence.

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass | HTTP 200, verdict SOUND | HTTP 200, verdict SOUND | PASS |
| 2 | violations | HTTP 200, verdict NOT_SOUND | HTTP 200, verdict NOT_SOUND | PASS |
| 3 | sparse | HTTP 200, verdict INSUFFICIENT_EVIDENCE | HTTP 200, verdict INSUFFICIENT_EVIDENCE | PASS |
| 4 | malformed | HTTP 422 {ok:false, error:"invalid_input"}, no verdict | HTTP 422 {ok:false, error:"invalid_input", field:"application.starts_per_hour"} | PASS |
| 5 | determinism (full-pass repeat) | byte-identical repeat response | determinism_byte_identical = true | PASS |
| 6 | parity (MCP vs REST, full-pass) | MCP structuredContent deep-equals REST artifact | parity_structured_equal = true | PASS |

**F1 disposition: RESOLVED.** Wave 1 F1 was: type-violating manifest fields returned HTTP 200 with a verdict computed over garbage instead of HTTP 422 `{ok:false, error:"invalid_input"}`. On retest the malformed case returns HTTP 422 with body `{"ok": false, "error": "invalid_input", "field": "application.starts_per_hour", "detail": "application.starts_per_hour must be a number"}` — exactly the contract error, no verdict artifact. All other cases (full-pass, violations, sparse) return their Wave 1-correct outcomes unchanged, and determinism and MCP/REST parity still hold. F1 is closed by this retest; no new findings.

### Second tester — DeepSeek (retest)

DeepSeek verdict: **PASS** — findings: none. It independently recomputed, with arithmetic shown: full-pass `harmonic_margin_percent` = 5.0 − 3.5 = **1.5000**, `cable_margin_m` = 100.0 − 50.0 = **50.0000**, `current_margin_a` = 100.0 − 90.0 = **10.0000**; violations **−5.0000 / −50.0000 / −40.0000** (5.0−10.0, 100.0−150.0, 50.0−90.0). Every computed check matches the artifact — **recomputed mismatches: none**. Raw output: `verification/work/vfd-application-engineering-check/deepseek-retest-raw.txt`.

Tester errors: none.

**Retest verdict: PASS**
