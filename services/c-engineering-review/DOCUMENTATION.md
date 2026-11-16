# C engineering review — documentation

**C engineering review** · slug `c-engineering-review` · deliverable type: REVIEW · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. The worked examples at the end are real recorded trial runs, reproduced verbatim from the external verification evidence.

## Tutorial

A first call, walked through end to end. This tutorial narrates the recorded full-pass trial run (Worked example 1 below reproduces it verbatim); every value named here is the value that run actually returned.

**The job.** You have a C-engineering evidence manifest — the caller's declared static-analysis, build, and review records for one piece of C code or one diff, and you want one deterministic verdict on whether it is complete and internally coherent on its own declared evidence.

**Step 1 — get a key.** Sign up and issue a gateway key for this atom (the exact calls are in *How-to guides → Get a key and call via REST*). Keep the key; you send it as `Authorization: Bearer <key>` on every call.

**Step 2 — assemble the manifest.** Build one JSON object covering every section: `memory_discipline`, `undefined_behavior`, `warnings_and_build`, `bounds_and_strings`, `sanitizers_and_static_analysis`, `portability`, `build_and_test`. In the recorded run the identity field `subject` was `"core-engine-v1"`. Fill each evidence field honestly from your own records: `true` where the practice was followed, `false` where a must-be-false field applies (see the Input reference — those fields must be `false` to pass), and the declared lists and numbers the computed checks re-derive. Leave a field out only if you genuinely have no evidence for it — an absent field is not a failure, it is `missing`, and it will hold the verdict at `INSUFFICIENT_EVIDENCE`.

**Step 3 — send it.** `POST https://atoms.pipavia.com/v1/c-engineering-review` with the manifest as the body and your key in the `Authorization` header.

**Step 4 — read the verdict.** The recorded run returned HTTP 200 with verdict `REVIEW_SOUND`: every section `pass`, and the summary "30 pass, 0 fail, 0 missing of 30 checks across seven sections." The computed fields came back `computed_status` = `"within_stated_limits_on_declared_evidence"`, `warning_count` = `0`, `banned_calls_found` = `[]` — the declared lists and numbers agree with the limits the method itself states, on the declared evidence.

**Step 5 — act on it.** A `REVIEW_SOUND` verdict means the manifest is complete on the evidence you declared — it does not certify that the underlying work is good (see *Explanation → What it does not do*). If instead you get the failing verdict or `INSUFFICIENT_EVIDENCE`, the `checks` array names exactly which checks failed or are missing; *How-to guides → Read a failing verdict and fix the manifest* walks through that repair loop using the recorded violations run.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "c-engineering-review"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.
4. Call the atom: `POST https://atoms.pipavia.com/v1/c-engineering-review` — body = the manifest object (see the Input reference).

```bash
curl -s -X POST https://atoms.pipavia.com/v1/c-engineering-review \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -d @manifest.json
```

The response is the verdict object described in *Reference → Output format*. The same manifest always returns the same verdict (determinism was byte-identical on the recorded repeat call — see TEST-REPORT.md).

### Call via MCP

- Endpoint: `POST https://atoms.pipavia.com/mcp/c-engineering-review`
- Tool name: `c_engineering_review`
- Call `tools/call` with the tool name above and the manifest object as the arguments — the same object you would send as the REST body, with the same `Authorization: Bearer <key>` header.
- The MCP result's structured content is the same verdict object as the REST response (parity was verified structured-equal on the recorded full-pass run — see TEST-REPORT.md). Prefer whichever face your client already speaks; do not expect different verdicts from the two faces.

### Read a failing verdict and fix the manifest

The recorded violations run (Worked example 2) returned verdict `REVIEW_DEFICIENT` with the summary "26 pass, 4 fail, 0 missing of 30 checks across seven sections." Repair any failing verdict the same way:

1. **Read `sections` first.** A section is `fail` when any of its checks fails, `insufficient_evidence` when none fails but at least one is `missing`, and `pass` only when all its checks pass. That tells you where to look.
2. **Read the `checks` array.** Each entry is `{section, check, status, evidence}`. Work the `fail` entries first — the `evidence` text states the rule that was breached. In the recorded violations run the failing checks were: `no_ub_shortcuts`, `zero_warnings_maintained`, `no_unbounded_operations_in_diff`, `no_banned_functions_present`.
3. **Distinguish `fail` from `missing`.** `fail` = the field was present but false, invalid, or arithmetically/set-wise incoherent — fix the underlying practice or correct the declaration. `missing` = the field was absent — supply the evidence; do not guess a value to make the check pass, because the atom audits declarations, and a declaration you cannot stand behind is worse than a missing one.
4. **Check the computed fields.** On a failing verdict the computed outputs (see *Reference → Output format*) show the re-derived values and the differences, so you can see by how much a declared total, count, or list disagrees before you resubmit.
5. **Fix the manifest and resubmit the whole object.** The atom is stateless per call: there is no partial update, no case to reopen, and no memory of the previous submission. Resubmit the corrected full manifest and read the new verdict.

### Handle a 422 invalid_input

A type violation is not a verdict — the call is rejected before any check runs. The recorded malformed run (Worked example 3) returned HTTP 422 with this body:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "memory.one_owner_per_allocation",
  "detail": "memory.one_owner_per_allocation must be a boolean"
}
```

- `field` names the exact manifest field whose type was wrong (`memory.one_owner_per_allocation` in the recorded run); `detail` states the type it must be (`"memory.one_owner_per_allocation must be a boolean"`).
- Fix that field's type in the manifest (consult the type column of the Input reference), then resubmit. If you sent several wrongly-typed fields, expect to repeat this once per call — the recorded shape reports one `field` per response.
- Do not retry the identical body: a 422 is deterministic for the same input and will not clear on its own. It is also not a rate-limit or auth problem — check the `error` value first: `invalid_input` means the manifest, not the key.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/c-engineering-review` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/c-engineering-review` — tool name `c_engineering_review`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Gateway: https://atoms.pipavia.com, gateway version 1.1.0 at the time of the recorded runs. Key scope: this atom only — a key's scope for one atom never verifies for another (contract.yaml key namespace `c_engineering_review`).

### Input reference

One JSON manifest. Types are taken from SERVICE.md's field table (its preamble states: all fields are booleans unless noted); the evidence `inputSchema` corroborates the top-level object/string/array types. Notes — including must-be-false gates and computed/conditional behaviour — are preserved from SERVICE.md. Fields are grouped as SERVICE.md groups them (by the section that reads them).

#### Carried / top-level (not itself checked)

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `subject` | string | string; carried into the verdict output, not itself checked |

#### Read by section `memory_discipline`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `memory.one_owner_per_allocation` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `memory.freed_on_same_path_as_allocation` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `memory.ownership_documented_in_headers` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `memory.caller_supplied_buffers_preferred` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `memory.ownership_documented_for_outliving_pointers` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |

#### Read by section `undefined_behavior`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `undefined_behavior.integer_overflow_addressed` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `undefined_behavior.strict_aliasing_respected` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `undefined_behavior.uninitialized_reads_avoided` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `undefined_behavior.signed_shifts_checked` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `undefined_behavior.sequence_point_traps_avoided` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `undefined_behavior.ub_shortcuts_used` | boolean | must be `false` to pass — skill red line |

#### Read by section `warnings_and_build`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `warnings.warnings_treated_as_errors` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `warnings.warning_count` | number | number; computed, see below |

#### Read by section `bounds_and_strings`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `bounds.sized_apis_used` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `bounds.lengths_validated_at_boundaries` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `bounds.unbounded_operations_in_diff` | boolean | must be `false` to pass — skill quality gate |
| `bounds.banned_calls` | list of strings | list of strings; computed, see below |

#### Read by section `sanitizers_and_static_analysis`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `sanitizers.asan_enabled_in_test_builds` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `sanitizers.ubsan_enabled_in_test_builds` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `sanitizers.asan_ubsan_clean_on_suite` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `sanitizers.valgrind_used_for_leaks` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `sanitizers.parsers_fuzzed` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `sanitizers.static_analysis_run` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `sanitizers.static_analysis_findings_treated_as_bugs` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |

#### Read by section `portability`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `portability.fixed_width_types_used` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `portability.compiler_extensions_isolated` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `portability.tested_on_target_platforms` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |

#### Read by section `build_and_test`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `build_and_test.build_system_pinned` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `build_and_test.unit_tests_at_function_boundaries` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `build_and_test.integration_tests_at_edges` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |

Container objects (the section objects and any list-of-objects entries above) are objects/arrays as typed; a container sent as the wrong JSON type is a 422 `invalid_input`, not a failing check (see Errors).

### Checks

Every check the atom runs — 30 checks, grouped by section. Ground truth: the `checks` array of the recorded full-pass REST response (Worked example 1), cross-checked against SERVICE.md; the counts agree (30/30). The `evidence` text quoted for each check is the recorded response's own statement of what the check requires.

**Per-check status semantics (all checks):** `pass` — the recorded evidence satisfies the stated requirement; `fail` — the field was present but false/invalid, or a computed condition (arithmetic, set coverage, vocabulary) was not met; `missing` — the field(s) the check reads were absent, so there is no evidence to judge. No `not_applicable` per-check status is returned by this atom in any recorded case.

#### Section `memory_discipline` — 5 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `one_owner_per_allocation` | method step 1: one clear owner per allocation |
| `freed_on_same_path_as_allocation` | method step 1: each allocation is freed on the same path as its allocation |
| `ownership_documented_in_headers` | method step 1: ownership is documented in headers |
| `caller_supplied_buffers_preferred_over_hidden_allocations` | method step 1: caller-supplied buffers are preferred over hidden allocations |
| `ownership_documented_for_outliving_pointers` | quality gate: ownership is documented for pointers that outlive their function |

#### Section `undefined_behavior` — 6 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `integer_overflow_addressed` | method step 2: integer overflow is minded — no overflow trap is left unaddressed |
| `strict_aliasing_respected` | method step 2: strict aliasing is respected |
| `uninitialized_reads_avoided` | method step 2: uninitialized reads are avoided |
| `signed_shifts_checked` | method step 2: signed shifts are checked |
| `sequence_point_traps_avoided` | method step 2: sequence-point traps are avoided |
| `no_ub_shortcuts` | method step 2 / red line: no UB shortcuts — no UB 'because it works on my machine' |

#### Section `warnings_and_build` — 2 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `warnings_treated_as_errors` | method step 3: warnings are errors — the build uses -Wall -Wextra -Werror (MSVC /W4 /WX) |
| `zero_warnings_maintained` | method step 3 / quality gate: zero warnings maintained — warning-clean with -Werror on target compilers |

#### Section `bounds_and_strings` — 4 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `sized_apis_used` | method step 4: sized APIs are used (snprintf, checked memcpy) instead of unbounded ones |
| `lengths_validated_at_boundaries` | method step 4: every length crossing a boundary is validated |
| `no_unbounded_operations_in_diff` | quality gate: no unbounded string/mem operations in the diff |
| `no_banned_functions_present` | red line: no gets, strcpy, sprintf, unchecked scanf — ever |

#### Section `sanitizers_and_static_analysis` — 7 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `asan_enabled_in_test_builds` | method step 5: ASan is enabled in test builds |
| `ubsan_enabled_in_test_builds` | method step 5: UBSan is enabled in test builds |
| `asan_ubsan_clean_on_suite` | quality gate: ASan/UBSan clean on the suite |
| `valgrind_used_for_leaks` | method step 5: Valgrind is used for leaks |
| `parsers_fuzzed` | method step 5: parsers are fuzzed (libFuzzer/AFL) |
| `static_analysis_run_in_loop` | method step 6: static analysis is in the loop — clang-tidy plus the compiler analyzer |
| `static_analysis_findings_treated_as_bugs` | method step 6: static-analysis findings are treated as bugs until proven otherwise |

#### Section `portability` — 3 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `fixed_width_types_used` | method step 7: fixed-width types are used (stdint.h) |
| `compiler_extensions_isolated` | method step 7: compiler extensions are isolated |
| `tested_on_target_platforms` | method step 7: the code is tested on target platforms |

#### Section `build_and_test` — 3 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `build_system_pinned` | method step 8: the build is pinned (Make/CMake) |
| `unit_tests_at_function_boundaries` | method step 8: unit tests sit at function boundaries |
| `integration_tests_at_edges` | method step 8: integration tests sit at the edges |

#### Computed checks in detail

- **Zero warnings (`zero_warnings_maintained`):** a declared `warnings.warning_count` passes only when it equals zero — the one number the method itself states ('warnings are errors; zero warnings maintained'). An absent count is missing evidence. The output reports the declared count as `warning_count` (null when no count is declared or it is not a number).
- **Banned calls (`no_banned_functions_present`):** the declared `bounds.banned_calls` list passes only when it contains none of the four stated entries — `gets`, `strcpy`, `sprintf`, `unchecked_scanf`. Unknown entries do not count as banned. A missing list is missing evidence; an empty list is present and passes. The output reports the stated banned entries found, in the method's stated order, as `banned_calls_found` (null when no list is declared). Entries are validated as strings only, never enum-checked.

The output also reports `computed_status` over the two computed checks: `within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when either of the two computed checks cannot be completed (SERVICE.md).

### Output format

HTTP 200 with one JSON verdict object (a 422 rejection is the only non-verdict response shape — see Errors). Top-level fields, in the order returned in the recorded responses:

| Field | Meaning |
|---|---|
| `service` | Always `"c-engineering-review"`. |
| `atom_version` | Atom version that produced the verdict (`"0.1.0"` in the recorded runs). |
| `subject` | The manifest's identity field, carried through (null when the manifest did not declare it, as in the recorded violations run for some atoms). |
| `verdict` | One of the verdict values below. |
| `sections` | Object mapping each section name to its section status (`pass` / `fail` / `insufficient_evidence`). |
| `checks` | Array of `{section, check, status, evidence}` — one entry per check, in section order. |
| `computed_status` | `within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null — see the computed-checks note above. |
| `warning_count` | Computed output field (see *Checks → Computed checks in detail*); in the recorded full-pass run: `0`. Null when it cannot be computed from the declared values, unless SERVICE.md states a different null rule for it. |
| `banned_calls_found` | Computed output field (see *Checks → Computed checks in detail*); in the recorded full-pass run: `[]`. Null when it cannot be computed from the declared values, unless SERVICE.md states a different null rule for it. |
| `summary` | One-line count, e.g. "30 pass, 0 fail, 0 missing of 30 checks across seven sections." |
| `stamp` | Plain-text rendering of the same verdict (display name, identity, verdict, per-section statuses, summary) for human-readable records. |

### Verdict vocabulary

| Value | Kind | Meaning |
|---|---|---|
| `REVIEW_SOUND` | verdict | Every check passes (30/30); the manifest is complete and coherent on the declared evidence. |
| `REVIEW_DEFICIENT` | verdict | At least one check fails. Failing checks are named in the `checks` array with their evidence text. |
| `INSUFFICIENT_EVIDENCE` | verdict | Nothing fails, but at least one check is `missing` — evidence was not declared. The missing checks name exactly what to supply. |
| `within_stated_limits_on_declared_evidence` | `computed_status` | All computed checks that could be completed are within the limits the method itself states. |
| `outside_stated_limits_on_declared_evidence` | `computed_status` | At least one computed check is outside those stated limits. |
| `null` | `computed_status` | At least one computed check could not be completed from the declared values. |
| `pass` | section status | Every check in the section passes. |
| `fail` | section status | At least one check in the section fails. |
| `insufficient_evidence` | section status | No check in the section fails, but at least one is missing. |
| `pass` | per-check status | The requirement stated in the check's evidence text is satisfied. |
| `fail` | per-check status | The field was present but false/invalid, or a computed condition was not met. |
| `missing` | per-check status | The field(s) the check reads were absent — missing evidence, not a failure. |

No other verdict, section-status, or per-check-status values are returned; in particular there is no per-check `not_applicable` status in any recorded case.

### Errors

Only the shapes evidenced in USER-GUIDE.md / the recorded evidence are documented here; no payload shape is invented for statuses whose body was not recorded.

| HTTP | Error | Shape / meaning |
|---|---|---|
| 401 | unauthenticated | Missing or invalid key (USER-GUIDE.md). No body shape is recorded in the evidence; send a valid `Authorization: Bearer <key>` header. |
| 403 | scope | The key lacks this atom's scope (USER-GUIDE.md). Issue the key for this atom (`POST /v1/keys` with this atom's slug); a scope granted for another atom does not transfer. No body shape is recorded in the evidence. |
| 422 | `invalid_input` | Recorded body (verbatim from the malformed case): `{"ok": false, "error": "invalid_input", "field": "memory.one_owner_per_allocation", "detail": "memory.one_owner_per_allocation must be a boolean"}` — `ok: false`, `error`, `field` (the exact manifest field) and `detail` (the type it must be). Never a verdict. |
| 429 | rate limit | Rate limit exceeded: 60/min, 10,000/day per key (contract.yaml / USER-GUIDE.md). No body shape is recorded in the evidence; back off and retry after the window. |

### Rate limits and pricing status

- Rate limits (contract.yaml): **60 requests per minute per key** and **10,000 requests per day per key**. Contract note: the per-key rate limit is the capacity guard for open public usage; tuned per atom at build-out from measured production cost.
- Pricing (contract.yaml): pricing unit = deliverable; `pricing.rate` is **null** (`rate_status: pending`). **Free during trial — rate pending.** Prices are set only from measured production cost per unit (SERVICE.md).

## Explanation

### What this atom does, in depth

This atom reviews one declared C-engineering evidence record against a production-C method: memory discipline (one owner per allocation, freed on the allocation path, ownership documented), undefined-behaviour avoidance (overflow, aliasing, uninitialized reads, shifts, sequence points — and no UB shortcuts), warnings treated as errors with zero warnings maintained, bounds and strings discipline (sized APIs, lengths validated, no unbounded operations, no banned calls), sanitizers and static analysis actually run and treated as bugs, portability (fixed-width types, isolated compiler extensions, tested on target platforms), and build/test at function boundaries and edges. It is a completeness and consistency review of the manifest and its two computed checks against the method's own stated limits.

### How the verdict is decided

The core is deterministic: same manifest in → same verdict out, byte-identically (verified on the recorded repeat call). Each check reads declared field(s) and lands in exactly one of three states:

- **Absent field = missing evidence.** The check is `missing`; its section is `insufficient_evidence` unless another check in it fails; and if nothing anywhere fails, the verdict is `INSUFFICIENT_EVIDENCE`. Missing is not a failure and is never silently treated as `false`.
- **Present but false / invalid = fail.** The check is `fail`, its section is `fail`, and the verdict is the failing verdict — one failing check is enough, however complete the rest of the manifest is. Must-be-false (red-line) fields work the same way in mirror image: present and `true` = fail.
- **Computed checks** re-derive what can be re-derived from the declared values themselves — arithmetic, set coverage, and stated vocabulary only, importing no outside threshold (see *Checks → Computed checks in detail*). A computed check whose inputs are absent is `missing`, not failed; one whose inputs are present but disagree is `fail`.

Section statuses roll up mechanically (`fail` if any check fails, else `insufficient_evidence` if any is missing, else `pass`), and the verdict rolls up the same way across all 30 checks: `REVIEW_SOUND` only when every check passes.

### What it does not do

- It does **not** compile, run, fuzz, or read live code, and it does not verify that a declared value is true. A review can be sound on the declared evidence even if the underlying code is in fact flawed.
- It is **not a code review**: it never decides whether the code actually contains a memory, undefined-behaviour, bounds, or portability trap the manifest did not declare, whether an allocation's owner is really clear, or whether a sanitizer run really happened.
- No static-analysis, sanitizer, or fuzzing execution — those runs are the caller's, declared in the manifest. No numeric threshold beyond the method's own stated zero warnings: no pass mark on static-analysis findings, no leak count, and no test-coverage percentage.
- No banned-call vocabulary beyond the four entries the method's red line itself names; no live verification of any declared fact.

The atom sells its deliverable — the bounded judgment artifact (the verdict object) — never the underlying knowledge or method itself.

### Buyer and use context

First buyer hypothesis (SERVICE.md, from register data; not yet market-tested): teams and agents working in Engineering & code who need this review on demand. Named self-use: **Native and embedded code work** — Wright is an internal caller (zero price, metered to the internal cost ledger).

## Role views

### For integrators (Users)

- Start with [USER-GUIDE.md](USER-GUIDE.md) for the quick start, then the Tutorial and How-to guides above. One call = one manifest in, one verdict object out; there is no session, upload, or follow-up state to manage.
- Integrate on the REST face (`POST /v1/c-engineering-review`) or the MCP face (tool `c_engineering_review`) — they return the same verdict object and were parity-verified. Branch on `verdict` first, then on per-check `status` for repair guidance; treat HTTP 422 as a client bug (fix the type named in `field`), 401/403 as key problems, and 429 as back-off.
- Cache by manifest content if you cache at all: the verdict is a pure function of the manifest, so an identical manifest never needs a second paid call.

### For developers

- Manifest authoring: type every field exactly as the Input reference states — booleans as JSON booleans (not `"true"`), numbers as JSON numbers, lists as arrays of strings. A wrong type is a 422 at the gateway, not a failing check; a wrong *value* is a failing check. Vocabulary and coverage fields are validated as strings only and judged as verdict checks, so a misspelled vocabulary entry fails its check rather than erroring.
- Determinism: the core is a deterministic Python oracle with a TypeScript port, parity-proven (TEST-REPORT.md); the recorded REST repeat was byte-identical and MCP structured content was deep-equal to REST. Any fixed serialization rule for computed outputs is stated in *Checks → Computed checks in detail* where SERVICE.md states one.
- Source and tests: implementation in `src/c_engineering_review.py`, tests in `tests/test_c_engineering_review.py` (same directory as this document). Fixes land in the bound skill first, then the atom re-deploys and must pass regression before its version bumps (contract.yaml binding rule R1).

### For ops

- Endpoints: REST `POST https://atoms.pipavia.com/v1/c-engineering-review` and MCP `POST https://atoms.pipavia.com/mcp/c-engineering-review` on gateway https://atoms.pipavia.com (v1.1.0 at recorded-run time). Status: live — release candidate, one-week RC soak to 2026-11-22; treat verdict-shape changes during the soak as RC incidents, not silent deploys.
- Keys and scope: per-user, per-atom issuance (`POST /v1/keys`); a key's scope for this atom is namespace `c_engineering_review` and never verifies for another atom. Watch 403s for mis-issued keys and 401s for missing/invalid headers.
- Limits and monitoring: 60/min and 10,000/day per key; alert on 429 volume (client retry storms), on 422 rate (a client shipping wrongly-typed manifests), and on any drift between REST and MCP verdicts for identical manifests (parity is a verified property — drift is a defect). Pricing is not yet metered for revenue: rate pending, free during trial.

## Worked examples

Provenance: recorded 2026-11-16T01:18:12.084097+00:00 against gateway v1.1.0, external verification lane, source `verification/work/c-engineering-review/evidence.json`. The three examples below are that evidence's recorded cases: each shows the case's `input` and the REST execution's `response_text`, reproduced verbatim as JSON values (pretty-printed with indent 2 for readability; verified mechanically after writing — see the checklist).

### Example 1 — full-pass

Recorded expectation: HTTP 200, outcome `REVIEW_SOUND`. Recorded REST status: 200.

Input:

```json
{
  "subject": "core-engine-v1",
  "memory": {
    "one_owner_per_allocation": true,
    "freed_on_same_path_as_allocation": true,
    "ownership_documented_in_headers": true,
    "caller_supplied_buffers_preferred": true,
    "ownership_documented_for_outliving_pointers": true
  },
  "undefined_behavior": {
    "integer_overflow_addressed": true,
    "strict_aliasing_respected": true,
    "uninitialized_reads_avoided": true,
    "signed_shifts_checked": true,
    "sequence_point_traps_avoided": true,
    "ub_shortcuts_used": false
  },
  "warnings": {
    "warnings_treated_as_errors": true,
    "warning_count": 0
  },
  "bounds": {
    "sized_apis_used": true,
    "lengths_validated_at_boundaries": true,
    "unbounded_operations_in_diff": false,
    "banned_calls": []
  },
  "sanitizers": {
    "asan_enabled_in_test_builds": true,
    "ubsan_enabled_in_test_builds": true,
    "asan_ubsan_clean_on_suite": true,
    "valgrind_used_for_leaks": true,
    "parsers_fuzzed": true,
    "static_analysis_run": true,
    "static_analysis_findings_treated_as_bugs": true
  },
  "portability": {
    "fixed_width_types_used": true,
    "compiler_extensions_isolated": true,
    "tested_on_target_platforms": true
  },
  "build_and_test": {
    "build_system_pinned": true,
    "unit_tests_at_function_boundaries": true,
    "integration_tests_at_edges": true
  }
}
```

Response (REST `response_text`):

```json
{
  "service": "c-engineering-review",
  "atom_version": "0.1.0",
  "subject": "core-engine-v1",
  "verdict": "REVIEW_SOUND",
  "sections": {
    "memory_discipline": "pass",
    "undefined_behavior": "pass",
    "warnings_and_build": "pass",
    "bounds_and_strings": "pass",
    "sanitizers_and_static_analysis": "pass",
    "portability": "pass",
    "build_and_test": "pass"
  },
  "checks": [
    {
      "section": "memory_discipline",
      "check": "one_owner_per_allocation",
      "status": "pass",
      "evidence": "method step 1: one clear owner per allocation"
    },
    {
      "section": "memory_discipline",
      "check": "freed_on_same_path_as_allocation",
      "status": "pass",
      "evidence": "method step 1: each allocation is freed on the same path as its allocation"
    },
    {
      "section": "memory_discipline",
      "check": "ownership_documented_in_headers",
      "status": "pass",
      "evidence": "method step 1: ownership is documented in headers"
    },
    {
      "section": "memory_discipline",
      "check": "caller_supplied_buffers_preferred_over_hidden_allocations",
      "status": "pass",
      "evidence": "method step 1: caller-supplied buffers are preferred over hidden allocations"
    },
    {
      "section": "memory_discipline",
      "check": "ownership_documented_for_outliving_pointers",
      "status": "pass",
      "evidence": "quality gate: ownership is documented for pointers that outlive their function"
    },
    {
      "section": "undefined_behavior",
      "check": "integer_overflow_addressed",
      "status": "pass",
      "evidence": "method step 2: integer overflow is minded \u2014 no overflow trap is left unaddressed"
    },
    {
      "section": "undefined_behavior",
      "check": "strict_aliasing_respected",
      "status": "pass",
      "evidence": "method step 2: strict aliasing is respected"
    },
    {
      "section": "undefined_behavior",
      "check": "uninitialized_reads_avoided",
      "status": "pass",
      "evidence": "method step 2: uninitialized reads are avoided"
    },
    {
      "section": "undefined_behavior",
      "check": "signed_shifts_checked",
      "status": "pass",
      "evidence": "method step 2: signed shifts are checked"
    },
    {
      "section": "undefined_behavior",
      "check": "sequence_point_traps_avoided",
      "status": "pass",
      "evidence": "method step 2: sequence-point traps are avoided"
    },
    {
      "section": "undefined_behavior",
      "check": "no_ub_shortcuts",
      "status": "pass",
      "evidence": "method step 2 / red line: no UB shortcuts \u2014 no UB 'because it works on my machine'"
    },
    {
      "section": "warnings_and_build",
      "check": "warnings_treated_as_errors",
      "status": "pass",
      "evidence": "method step 3: warnings are errors \u2014 the build uses -Wall -Wextra -Werror (MSVC /W4 /WX)"
    },
    {
      "section": "warnings_and_build",
      "check": "zero_warnings_maintained",
      "status": "pass",
      "evidence": "method step 3 / quality gate: zero warnings maintained \u2014 warning-clean with -Werror on target compilers"
    },
    {
      "section": "bounds_and_strings",
      "check": "sized_apis_used",
      "status": "pass",
      "evidence": "method step 4: sized APIs are used (snprintf, checked memcpy) instead of unbounded ones"
    },
    {
      "section": "bounds_and_strings",
      "check": "lengths_validated_at_boundaries",
      "status": "pass",
      "evidence": "method step 4: every length crossing a boundary is validated"
    },
    {
      "section": "bounds_and_strings",
      "check": "no_unbounded_operations_in_diff",
      "status": "pass",
      "evidence": "quality gate: no unbounded string/mem operations in the diff"
    },
    {
      "section": "bounds_and_strings",
      "check": "no_banned_functions_present",
      "status": "pass",
      "evidence": "red line: no gets, strcpy, sprintf, unchecked scanf \u2014 ever"
    },
    {
      "section": "sanitizers_and_static_analysis",
      "check": "asan_enabled_in_test_builds",
      "status": "pass",
      "evidence": "method step 5: ASan is enabled in test builds"
    },
    {
      "section": "sanitizers_and_static_analysis",
      "check": "ubsan_enabled_in_test_builds",
      "status": "pass",
      "evidence": "method step 5: UBSan is enabled in test builds"
    },
    {
      "section": "sanitizers_and_static_analysis",
      "check": "asan_ubsan_clean_on_suite",
      "status": "pass",
      "evidence": "quality gate: ASan/UBSan clean on the suite"
    },
    {
      "section": "sanitizers_and_static_analysis",
      "check": "valgrind_used_for_leaks",
      "status": "pass",
      "evidence": "method step 5: Valgrind is used for leaks"
    },
    {
      "section": "sanitizers_and_static_analysis",
      "check": "parsers_fuzzed",
      "status": "pass",
      "evidence": "method step 5: parsers are fuzzed (libFuzzer/AFL)"
    },
    {
      "section": "sanitizers_and_static_analysis",
      "check": "static_analysis_run_in_loop",
      "status": "pass",
      "evidence": "method step 6: static analysis is in the loop \u2014 clang-tidy plus the compiler analyzer"
    },
    {
      "section": "sanitizers_and_static_analysis",
      "check": "static_analysis_findings_treated_as_bugs",
      "status": "pass",
      "evidence": "method step 6: static-analysis findings are treated as bugs until proven otherwise"
    },
    {
      "section": "portability",
      "check": "fixed_width_types_used",
      "status": "pass",
      "evidence": "method step 7: fixed-width types are used (stdint.h)"
    },
    {
      "section": "portability",
      "check": "compiler_extensions_isolated",
      "status": "pass",
      "evidence": "method step 7: compiler extensions are isolated"
    },
    {
      "section": "portability",
      "check": "tested_on_target_platforms",
      "status": "pass",
      "evidence": "method step 7: the code is tested on target platforms"
    },
    {
      "section": "build_and_test",
      "check": "build_system_pinned",
      "status": "pass",
      "evidence": "method step 8: the build is pinned (Make/CMake)"
    },
    {
      "section": "build_and_test",
      "check": "unit_tests_at_function_boundaries",
      "status": "pass",
      "evidence": "method step 8: unit tests sit at function boundaries"
    },
    {
      "section": "build_and_test",
      "check": "integration_tests_at_edges",
      "status": "pass",
      "evidence": "method step 8: integration tests sit at the edges"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "warning_count": 0,
  "banned_calls_found": [],
  "summary": "30 pass, 0 fail, 0 missing of 30 checks across seven sections.",
  "stamp": "C ENGINEERING REVIEW\nsubject: core-engine-v1\nVERDICT: REVIEW_SOUND\n  memory_discipline                pass\n  undefined_behavior               pass\n  warnings_and_build               pass\n  bounds_and_strings               pass\n  sanitizers_and_static_analysis   pass\n  portability                      pass\n  build_and_test                   pass\n30 pass, 0 fail, 0 missing of 30 checks across seven sections."
}
```

### Example 2 — violations

Recorded expectation: HTTP 200, outcome `REVIEW_DEFICIENT`. Recorded REST status: 200.

Input:

```json
{
  "subject": "bad-code-v1",
  "memory": {
    "one_owner_per_allocation": true,
    "freed_on_same_path_as_allocation": true,
    "ownership_documented_in_headers": true,
    "caller_supplied_buffers_preferred": true,
    "ownership_documented_for_outliving_pointers": true
  },
  "undefined_behavior": {
    "integer_overflow_addressed": true,
    "strict_aliasing_respected": true,
    "uninitialized_reads_avoided": true,
    "signed_shifts_checked": true,
    "sequence_point_traps_avoided": true,
    "ub_shortcuts_used": true
  },
  "warnings": {
    "warnings_treated_as_errors": true,
    "warning_count": 5
  },
  "bounds": {
    "sized_apis_used": true,
    "lengths_validated_at_boundaries": true,
    "unbounded_operations_in_diff": true,
    "banned_calls": [
      "strcpy"
    ]
  },
  "sanitizers": {
    "asan_enabled_in_test_builds": true,
    "ubsan_enabled_in_test_builds": true,
    "asan_ubsan_clean_on_suite": true,
    "valgrind_used_for_leaks": true,
    "parsers_fuzzed": true,
    "static_analysis_run": true,
    "static_analysis_findings_treated_as_bugs": true
  },
  "portability": {
    "fixed_width_types_used": true,
    "compiler_extensions_isolated": true,
    "tested_on_target_platforms": true
  },
  "build_and_test": {
    "build_system_pinned": true,
    "unit_tests_at_function_boundaries": true,
    "integration_tests_at_edges": true
  }
}
```

Response (REST `response_text`):

```json
{
  "service": "c-engineering-review",
  "atom_version": "0.1.0",
  "subject": "bad-code-v1",
  "verdict": "REVIEW_DEFICIENT",
  "sections": {
    "memory_discipline": "pass",
    "undefined_behavior": "fail",
    "warnings_and_build": "fail",
    "bounds_and_strings": "fail",
    "sanitizers_and_static_analysis": "pass",
    "portability": "pass",
    "build_and_test": "pass"
  },
  "checks": [
    {
      "section": "memory_discipline",
      "check": "one_owner_per_allocation",
      "status": "pass",
      "evidence": "method step 1: one clear owner per allocation"
    },
    {
      "section": "memory_discipline",
      "check": "freed_on_same_path_as_allocation",
      "status": "pass",
      "evidence": "method step 1: each allocation is freed on the same path as its allocation"
    },
    {
      "section": "memory_discipline",
      "check": "ownership_documented_in_headers",
      "status": "pass",
      "evidence": "method step 1: ownership is documented in headers"
    },
    {
      "section": "memory_discipline",
      "check": "caller_supplied_buffers_preferred_over_hidden_allocations",
      "status": "pass",
      "evidence": "method step 1: caller-supplied buffers are preferred over hidden allocations"
    },
    {
      "section": "memory_discipline",
      "check": "ownership_documented_for_outliving_pointers",
      "status": "pass",
      "evidence": "quality gate: ownership is documented for pointers that outlive their function"
    },
    {
      "section": "undefined_behavior",
      "check": "integer_overflow_addressed",
      "status": "pass",
      "evidence": "method step 2: integer overflow is minded \u2014 no overflow trap is left unaddressed"
    },
    {
      "section": "undefined_behavior",
      "check": "strict_aliasing_respected",
      "status": "pass",
      "evidence": "method step 2: strict aliasing is respected"
    },
    {
      "section": "undefined_behavior",
      "check": "uninitialized_reads_avoided",
      "status": "pass",
      "evidence": "method step 2: uninitialized reads are avoided"
    },
    {
      "section": "undefined_behavior",
      "check": "signed_shifts_checked",
      "status": "pass",
      "evidence": "method step 2: signed shifts are checked"
    },
    {
      "section": "undefined_behavior",
      "check": "sequence_point_traps_avoided",
      "status": "pass",
      "evidence": "method step 2: sequence-point traps are avoided"
    },
    {
      "section": "undefined_behavior",
      "check": "no_ub_shortcuts",
      "status": "fail",
      "evidence": "method step 2 / red line: no UB shortcuts \u2014 no UB 'because it works on my machine'"
    },
    {
      "section": "warnings_and_build",
      "check": "warnings_treated_as_errors",
      "status": "pass",
      "evidence": "method step 3: warnings are errors \u2014 the build uses -Wall -Wextra -Werror (MSVC /W4 /WX)"
    },
    {
      "section": "warnings_and_build",
      "check": "zero_warnings_maintained",
      "status": "fail",
      "evidence": "method step 3 / quality gate: zero warnings maintained \u2014 warning-clean with -Werror on target compilers"
    },
    {
      "section": "bounds_and_strings",
      "check": "sized_apis_used",
      "status": "pass",
      "evidence": "method step 4: sized APIs are used (snprintf, checked memcpy) instead of unbounded ones"
    },
    {
      "section": "bounds_and_strings",
      "check": "lengths_validated_at_boundaries",
      "status": "pass",
      "evidence": "method step 4: every length crossing a boundary is validated"
    },
    {
      "section": "bounds_and_strings",
      "check": "no_unbounded_operations_in_diff",
      "status": "fail",
      "evidence": "quality gate: no unbounded string/mem operations in the diff"
    },
    {
      "section": "bounds_and_strings",
      "check": "no_banned_functions_present",
      "status": "fail",
      "evidence": "red line: no gets, strcpy, sprintf, unchecked scanf \u2014 ever"
    },
    {
      "section": "sanitizers_and_static_analysis",
      "check": "asan_enabled_in_test_builds",
      "status": "pass",
      "evidence": "method step 5: ASan is enabled in test builds"
    },
    {
      "section": "sanitizers_and_static_analysis",
      "check": "ubsan_enabled_in_test_builds",
      "status": "pass",
      "evidence": "method step 5: UBSan is enabled in test builds"
    },
    {
      "section": "sanitizers_and_static_analysis",
      "check": "asan_ubsan_clean_on_suite",
      "status": "pass",
      "evidence": "quality gate: ASan/UBSan clean on the suite"
    },
    {
      "section": "sanitizers_and_static_analysis",
      "check": "valgrind_used_for_leaks",
      "status": "pass",
      "evidence": "method step 5: Valgrind is used for leaks"
    },
    {
      "section": "sanitizers_and_static_analysis",
      "check": "parsers_fuzzed",
      "status": "pass",
      "evidence": "method step 5: parsers are fuzzed (libFuzzer/AFL)"
    },
    {
      "section": "sanitizers_and_static_analysis",
      "check": "static_analysis_run_in_loop",
      "status": "pass",
      "evidence": "method step 6: static analysis is in the loop \u2014 clang-tidy plus the compiler analyzer"
    },
    {
      "section": "sanitizers_and_static_analysis",
      "check": "static_analysis_findings_treated_as_bugs",
      "status": "pass",
      "evidence": "method step 6: static-analysis findings are treated as bugs until proven otherwise"
    },
    {
      "section": "portability",
      "check": "fixed_width_types_used",
      "status": "pass",
      "evidence": "method step 7: fixed-width types are used (stdint.h)"
    },
    {
      "section": "portability",
      "check": "compiler_extensions_isolated",
      "status": "pass",
      "evidence": "method step 7: compiler extensions are isolated"
    },
    {
      "section": "portability",
      "check": "tested_on_target_platforms",
      "status": "pass",
      "evidence": "method step 7: the code is tested on target platforms"
    },
    {
      "section": "build_and_test",
      "check": "build_system_pinned",
      "status": "pass",
      "evidence": "method step 8: the build is pinned (Make/CMake)"
    },
    {
      "section": "build_and_test",
      "check": "unit_tests_at_function_boundaries",
      "status": "pass",
      "evidence": "method step 8: unit tests sit at function boundaries"
    },
    {
      "section": "build_and_test",
      "check": "integration_tests_at_edges",
      "status": "pass",
      "evidence": "method step 8: integration tests sit at the edges"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "warning_count": 5,
  "banned_calls_found": [
    "strcpy"
  ],
  "summary": "26 pass, 4 fail, 0 missing of 30 checks across seven sections.",
  "stamp": "C ENGINEERING REVIEW\nsubject: bad-code-v1\nVERDICT: REVIEW_DEFICIENT\n  memory_discipline                pass\n  undefined_behavior               fail\n  warnings_and_build               fail\n  bounds_and_strings               fail\n  sanitizers_and_static_analysis   pass\n  portability                      pass\n  build_and_test                   pass\n26 pass, 4 fail, 0 missing of 30 checks across seven sections."
}
```

### Example 3 — malformed

Recorded expectation: HTTP 422, no verdict (rejected as invalid input). Recorded REST status: 422.

Input:

```json
{
  "subject": "malformed-input",
  "memory": {
    "one_owner_per_allocation": "not-a-boolean"
  }
}
```

Response (REST `response_text`):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "memory.one_owner_per_allocation",
  "detail": "memory.one_owner_per_allocation must be a boolean"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes; Developers Yes; Ops Yes; Regulators: N/A — the verdict is a completeness review of a declared engineering evidence manifest, not a safety or compliance certification, and SERVICE.md states it is not a code review; no regulated-domain compliance evidence is produced. |
| Checks named: documented / recorded | 30 / 30 (from the recorded full-pass REST `checks` array, cross-checked against SERVICE.md) |
| Verdict vocabulary complete | Yes — all 3 verdicts (`REVIEW_SOUND`, `REVIEW_DEFICIENT`, `INSUFFICIENT_EVIDENCE`), `computed_status` values including null, section statuses and per-check statuses |
| Input reference typed | Yes — 31 fields, each with a type from SERVICE.md's field table, grouped as SERVICE.md groups them, gates/conditionals preserved in Notes |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed from this file and compared as JSON values against `verification/work/c-engineering-review/evidence.json` after writing; all matched |
| Errors documented from evidence only | Yes — 422 shape verbatim from the recorded malformed case; 401/403/429 documented at the status/meaning level evidenced in USER-GUIDE.md and contract.yaml, with no invented payload |

