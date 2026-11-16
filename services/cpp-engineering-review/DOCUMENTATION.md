# Cpp engineering review — `cpp-engineering-review`

**Display name:** Cpp engineering review · **Slug:** `cpp-engineering-review` · **Deliverable type:** REVIEW · **Atom version:** 0.1.0 · **Status:** live — release candidate (one-week RC soak to 2026-11-22)

**Quick start:** [USER-GUIDE.md](USER-GUIDE.md) · **Verification evidence:** [TEST-REPORT.md](TEST-REPORT.md)

## Tutorial

A first call, walked through end to end. This tutorial narrates the recorded full-pass trial run for this atom; the exact request and response are reproduced verbatim under [Worked examples](#worked-examples), example 1.

1. **Get a key.** Sign up and issue a gateway key scoped to `cpp-engineering-review` (the full flow is in the first how-to guide below). Every call sends it as `Authorization: Bearer <key>`.
2. **Assemble the manifest.** Build one JSON object declaring the evidence the atom checks. In the recorded run the subject is `PR-123`. Fill every group the Input reference lists — an absent field is not a neutral omission: it is recorded as missing evidence and caps the verdict at `INSUFFICIENT_EVIDENCE`.
3. **Send it.** `POST https://atoms.pipavia.com/v1/cpp-engineering-review` with the manifest as the body (or call the MCP tool `cpp_engineering_review` with the same object as its arguments).
4. **Read the verdict first.** The recorded response returns HTTP 200 with verdict `REVIEW_SOUND` — the strongest verdict this atom gives. Its `summary` reads: "34 pass, 0 fail, 0 missing of 34 checks across eight sections."
5. **Read the sections, then the checks.** All 8 sections report `pass` (`raii_and_ownership`, `value_semantics`, `smart_pointers`, `stl_and_templates`, `exceptions_and_abi`, `tooling_and_warnings`, `sanitizers`, `safety_red_lines`), and all 34 entries in `checks` report `status: pass`, each carrying the `evidence` string that states the requirement it checked.
6. **Read the computed fields.** The manifest declares `tooling.warning_count` 0 and an empty `raii.forbidden_constructs` list, so both computed checks pass: zero warnings is the one number the bound skill itself states, and none of the three stated forbidden entries (`raw_owning_pointer`, `manual_new`, `manual_delete`) is present. The response's `computed_status` is `within_stated_limits_on_declared_evidence`, and its `stamp` field carries a plain-text rendering of the same verdict for logs and tickets.
7. **Keep the response.** It is the deliverable: one bounded judgment artifact for that one manifest. Same manifest in → same response out (the verification battery confirmed byte-identical repeat REST responses and MCP/REST parity for the full-pass manifest).

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "cpp-engineering-review"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call:

```bash
curl -X POST https://atoms.pipavia.com/v1/cpp-engineering-review \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -d @manifest.json
```

A well-formed manifest returns HTTP 200 and a verdict body (see Reference — Output format). Authentication and shape failures return the error shapes listed under Reference — Errors, never a verdict.

### Call via MCP

POST to `https://atoms.pipavia.com/mcp/cpp-engineering-review` with the same `Authorization: Bearer <key>` header and call the tool named `cpp_engineering_review`. The `tools/call` arguments are the manifest object itself — the same JSON you would send as the REST body. The MCP result's structured content is the same report core as the REST response (parity was verified in the recorded battery: the full-pass manifest's MCP `structuredContent` was deep-equal to the REST artifact).

### Read a failing verdict and fix the manifest

A failing verdict is still HTTP 200 — it is a result, not a transport error. Work it in this order:

1. **Read `verdict`.** `REVIEW_DEFICIENT` means at least one check failed. `INSUFFICIENT_EVIDENCE` means nothing failed but evidence is missing. The passing verdict here is `REVIEW_SOUND`.
2. **Read `sections`.** A section reports `fail` if any of its checks failed, `insufficient_evidence` if none failed but at least one is missing, and `pass` only when all of its checks pass. Start with the failing sections.
3. **Read `checks`.** Filter to `status: fail` for breaches and `status: missing` for gaps. Each entry names its `section`, its `check`, and an `evidence` string stating the requirement. `fail` means the field was present but false, invalid, or arithmetically inconsistent; `missing` means the field (or a value a computation needs) was absent.
4. **Fix the underlying facts, then resubmit.** In the recorded violations run the failing checks were exactly: `no_manual_new_delete_in_new_code`, `no_forbidden_constructs_present`, `zero_warnings_maintained` (31 pass, 3 fail, 0 missing of 34 checks across eight sections.) In the recorded violations run the manifest declared manual `new`/`delete` in new code, listed `manual_new` among the forbidden constructs, and declared 5 warnings. Correcting those three declarations — the flag back to `false`, the forbidden list back to `[]`, and the warning count back to `0` once the build is actually warnings-clean — is what returns the verdict to `REVIEW_SOUND`. Do not edit the declaration to match the desired verdict unless the underlying fact has changed; the atom audits the declaration you send.
5. **Do not confuse a verdict with a 422.** A failing verdict means the manifest was well-typed and was judged. A 422 means the manifest was not well-typed and was never judged — see the next guide.

### Handle a 422 invalid_input

A type violation returns HTTP 422 with a body naming the offending field — it never returns a verdict. The recorded malformed run for this atom sent a value of the wrong type and received:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "tooling.warning_count",
  "detail": "tooling.warning_count must be a number"
}
```

To handle it: read `field` (`tooling.warning_count`) and `detail` ("tooling.warning_count must be a number"), correct the value's type in your manifest at exactly that path, and resubmit the whole manifest. Do not drop the field to silence the error — an absent field is missing evidence and caps the verdict at `INSUFFICIENT_EVIDENCE`. One 422 reports one field; if several fields are mistyped, fix and resubmit iteratively.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/cpp-engineering-review` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/cpp-engineering-review` — tool name `cpp_engineering_review`; `tools/call` arguments = the manifest object.
- **Key issuance:** `POST /v1/signup` (email; sign-in link emailed), then `POST /v1/keys` with `{"atom": "cpp-engineering-review"}` after opening the link. A key for one atom never verifies for another: scope is per atom.

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table (which states: all fields are booleans unless noted) and corroborated by `contract.yaml` and the recorded MCP `inputSchema`. Fields are grouped below exactly as SERVICE.md groups them (by the section that reads them). An absent field = missing evidence; a present-but-false/invalid field = a failed check, except where a note says otherwise.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `subject` | string | (string; carried into the verdict output, not itself checked) |

#### Read by: raii_and_ownership

| Field | Type | Notes |
|---|---|---|
| `raii.resources_owned_by_objects` | boolean | — |
| `raii.destructors_clean_up_resources` | boolean | — |
| `raii.manual_new_delete_in_new_code` | boolean | (must be `false` to pass — skill quality gate) |
| `raii.raw_owning_pointers_in_new_code` | boolean | (must be `false` to pass — skill quality gate) |
| `raii.forbidden_constructs` | array | (list of strings; computed, see below) |

#### Read by: value_semantics

| Field | Type | Notes |
|---|---|---|
| `value_semantics.values_const_references_preferred` | boolean | — |
| `value_semantics.move_semantics_used_where_copies_expensive` | boolean | — |
| `value_semantics.rule_of_zero_honored` | boolean | — |
| `value_semantics.special_members_justified_when_present` | boolean | — |

#### Read by: smart_pointers

| Field | Type | Notes |
|---|---|---|
| `smart_pointers.unique_ptr_is_default` | boolean | — |
| `smart_pointers.shared_ptr_only_for_real_shared_ownership` | boolean | — |
| `smart_pointers.weak_ptr_used_to_break_cycles` | boolean | — |

#### Read by: stl_and_templates

| Field | Type | Notes |
|---|---|---|
| `stl.algorithms_preferred_over_hand_loops` | boolean | — |
| `stl.containers_matched_to_access_patterns` | boolean | — |
| `stl.ranges_used_where_available` | boolean | — |
| `stl.templates_used_only_for_real_genericity` | boolean | — |
| `stl.template_error_messages_readable` | boolean | — |

#### Read by: exceptions_and_abi

| Field | Type | Notes |
|---|---|---|
| `exceptions_and_abi.exceptions_policy_chosen` | boolean | — |
| `exceptions_and_abi.exceptions_policy_documented` | boolean | — |
| `exceptions_and_abi.exceptions_policy_applied_consistently` | boolean | — |
| `exceptions_and_abi.stable_library_interfaces` | boolean | — |
| `exceptions_and_abi.pimpl_used_where_needed` | boolean | — |
| `exceptions_and_abi.symbols_versioned` | boolean | — |

#### Read by: tooling_and_warnings

| Field | Type | Notes |
|---|---|---|
| `tooling.clang_tidy_run` | boolean | — |
| `tooling.clang_tidy_clean_on_diff` | boolean | — |
| `tooling.clang_format_applied` | boolean | — |
| `tooling.warnings_treated_as_errors` | boolean | — |
| `tooling.warning_count` | number | (number; computed, see below) |

#### Read by: sanitizers

| Field | Type | Notes |
|---|---|---|
| `sanitizers.asan_enabled_in_test_builds` | boolean | — |
| `sanitizers.ubsan_enabled_in_test_builds` | boolean | — |
| `sanitizers.tsan_enabled_in_test_builds` | boolean | — |
| `sanitizers.sanitizer_clean_test_run` | boolean | — |

#### Read by: safety_red_lines

| Field | Type | Notes |
|---|---|---|
| `safety.dangling_references_across_async_boundaries` | boolean | (must be `false` to pass — skill red line) |
| `safety.macros_used_where_language_features_exist` | boolean | (must be `false` to pass — skill red line) |

Total typed input fields documented: 35 (each SERVICE.md field-table row; nested row-entry fields are listed individually where SERVICE.md lists them).

### Checks

All 34 checks, named exactly as in the recorded full-pass REST response's `checks` array (cross-checked against SERVICE.md; the counts agree). For each check, the Requirement column is the recorded `evidence` string, which states what must hold to pass.

**Per-check status semantics (all checks):** `pass` = the requirement held on the declared evidence; `fail` = the field was present but false/invalid, or a computed comparison did not hold; `missing` = the field, list, or a value a computation needs was absent, so the check could not be evaluated. There is no separate not-applicable status in the recorded responses: where a check is conditional and its gate is not declared, it is recorded as `pass` with evidence stating that no such case was declared (see the notes on the individual conditional checks, where this atom has them).

#### Section: raii_and_ownership

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `resources_owned_by_objects` | method step 1: resources are owned by objects — RAII everywhere (memory, files, sockets, locks) | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `destructors_clean_up_resources` | method step 1: destructors clean up — no manual pairing | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `no_manual_new_delete_in_new_code` | quality gate: no manual new/delete in new code | Pass requires the underlying manifest field `raii.manual_new_delete_in_new_code` to be declared `false` (skill quality gate). Declared `true` fails; absent is `missing`. |
| `no_raw_owning_pointers_in_new_code` | quality gate: no raw owning pointers in new code | Pass requires `raii.raw_owning_pointers_in_new_code` to be declared `false` (skill quality gate). Declared `true` fails; absent is `missing`. |
| `no_forbidden_constructs_present` | quality gate: no raw owning pointers or manual new/delete in new code | Computed. Pass requires the declared `raii.forbidden_constructs` list to contain none of `raw_owning_pointer`, `manual_new`, `manual_delete`; unknown entries do not count as forbidden and an empty list passes. Absent list is `missing`. |
#### Section: value_semantics

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `values_const_references_preferred` | method step 2: values, const, and references are preferred — value semantics first | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `move_semantics_used_where_copies_expensive` | method step 2: move semantics are used where copies are expensive | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `rule_of_zero_honored` | method step 2 / quality gate: the Rule of Zero is honored — special members are written only when you must | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `special_members_justified_when_present` | quality gate: special members are present only when justified | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
#### Section: smart_pointers

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `unique_ptr_is_default` | method step 3: unique_ptr is the default smart pointer | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `shared_ptr_only_for_real_shared_ownership` | method step 3: shared_ptr is used only for real shared ownership | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `weak_ptr_used_to_break_cycles` | method step 3: weak_ptr is used to break cycles | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
#### Section: stl_and_templates

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `algorithms_preferred_over_hand_loops` | method step 4: STL algorithms are preferred over hand loops | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `containers_matched_to_access_patterns` | method step 4: containers are matched to access patterns | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `ranges_used_where_available` | method step 4: ranges are used where available | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `templates_used_only_for_real_genericity` | method step 7: templates are used sparingly — for real genericity, not vanity | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `template_error_messages_readable` | method step 7: template error messages are kept readable | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
#### Section: exceptions_and_abi

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `exceptions_policy_chosen` | method step 5: one exceptions policy is picked for the codebase (exceptions on/off) | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `exceptions_policy_documented` | method step 5: the exceptions policy is documented | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `exceptions_policy_applied_consistently` | method step 5: the exceptions policy is applied consistently | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `stable_library_interfaces` | method step 8: library interfaces are stable | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `pimpl_used_where_needed` | method step 8: pimpl is used where needed | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `symbols_versioned` | method step 8: symbols are versioned | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
#### Section: tooling_and_warnings

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `clang_tidy_run_in_loop` | method step 6: clang-tidy is in the loop | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `clang_tidy_clean_on_diff` | quality gate: clang-tidy is clean on the diff | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `clang_format_applied` | method step 6: clang-format is applied | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `warnings_treated_as_errors` | method step 6: warnings are treated as errors | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `zero_warnings_maintained` | method step 6 / quality gate: zero warnings maintained — warnings-as-errors build green | Computed. Pass requires declared `tooling.warning_count` to equal 0 — the one number the skill itself states. Any other number fails; absent is `missing`. |
#### Section: sanitizers

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `asan_enabled_in_test_builds` | method step 6: ASan is enabled in test builds | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `ubsan_enabled_in_test_builds` | method step 6: UBSan is enabled in test builds | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `tsan_enabled_in_test_builds` | method step 6: TSan is enabled in test builds | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `sanitizer_clean_test_run` | quality gate: the test run is sanitizer-clean | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
#### Section: safety_red_lines

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `no_dangling_references_across_async_boundaries` | red line: no dangling references across async boundaries | Pass requires `safety.dangling_references_across_async_boundaries` to be declared `false` (skill red line). Declared `true` fails; absent is `missing`. |
| `no_macros_where_language_features_exist` | red line: no macros where language features exist | Pass requires `safety.macros_used_where_language_features_exist` to be declared `false` (skill red line). Declared `true` fails; absent is `missing`. |

### Output format

HTTP 200 returns one JSON object. Fields observed in the recorded full-pass response, in recorded order:

| Field | Type (as recorded) | Meaning |
|---|---|---|
| `service` | string | Atom slug. |
| `atom_version` | string | Atom version that produced the verdict. |
| `subject` | string | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `verdict` | string | The verdict (see Verdict vocabulary). |
| `sections` | object | Per-section statuses keyed by section name. |
| `checks` | array | Array of `{section, check, status, evidence}` objects — one per check. |
| `computed_status` | string | `within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when a computed check cannot be completed. |
| `warning_count` | number | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `forbidden_constructs_found` | array | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `summary` | string | One-line pass/fail/missing count summary. |
| `stamp` | string | Plain-text rendering of the verdict, sections and summary. |

Computed numeric fields follow the fixed serialization rule stated in SERVICE.md (fixed-decimal strings where SERVICE.md specifies them), shared by both implementations so repeat calls are byte-identical.

### Verdict vocabulary

- **`REVIEW_SOUND`** — Every check passes (34 pass, 0 fail, 0 missing of 34 checks across eight sections.) The declared evidence is complete and consistent with the bound skill's method, quality gates and red lines.
- **`REVIEW_DEFICIENT`** — At least one check fails. The failing checks name the breached requirement and the evidence against it.
- **`INSUFFICIENT_EVIDENCE`** — Nothing failed, but at least one check is `missing`. The missing checks say exactly what to supply.

- **Section statuses:** `pass` (all checks in the section pass) · `fail` (at least one check in the section fails) · `insufficient_evidence` (no check fails but at least one is missing).
- **Per-check statuses:** `pass` · `fail` · `missing` (see Checks). No other per-check status occurs in the recorded responses; conditional checks that do not apply are recorded as `pass`, as documented above.
- **`computed_status` values:** `within_stated_limits_on_declared_evidence` (every computed check that could be completed held) · `outside_stated_limits_on_declared_evidence` (at least one computed check failed) · `null` (at least one computed check could not be completed).

### Errors

Only the shapes evidenced in the repo/gateway docs are listed; no other error payload is documented, and none should be assumed.

- **401 — unauthenticated:** missing or invalid key (USER-GUIDE.md error line). No error body shape is evidenced in the repo for 401; do not assume one. Fix: send a valid key as `Authorization: Bearer <key>`.
- **403 — scope:** the key lacks this atom's scope (USER-GUIDE.md error line). No error body shape is evidenced in the repo for 403; do not assume one. Fix: issue this atom's scope on your key via `POST /v1/keys`.
- **422 — `invalid_input`:** a field has the wrong type. Recorded body shape (verbatim from the recorded malformed run):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "tooling.warning_count",
  "detail": "tooling.warning_count must be a number"
}
```

  Here `field` is `tooling.warning_count` and `detail` is "tooling.warning_count must be a number". A 422 never carries a verdict.
- **429 — rate limit:** the per-key rate limit was exceeded (60/min, 10,000/day per key; USER-GUIDE.md and `contract.yaml`). No error body shape is evidenced in the repo for 429; do not assume one. Fix: slow down and retry within the limits.

### Rate limits + pricing status

- **Rate limits (from `contract.yaml`):** 60 requests per key per minute; 10,000 requests per key per day. Status note in the contract: SPEC default — the per-key rate limit is the capacity guard for open public usage; tuned per atom at build-out from measured production cost.
- **Pricing:** unit = deliverable; `pricing.rate` is null (rate_status: pending). **Free during trial — rate pending.** No price is set; per SERVICE.md, prices are set only from measured production cost per unit.

## Explanation

This atom is a deterministic completeness-and-consistency review of a **declared** C++-engineering evidence manifest for one piece of C++ code or one diff. It applies the bound C++-engineering skill's method steps, quality gates and red lines as 34 fixed checks across eight sections — RAII and ownership, value semantics, smart pointers, STL and templates, exceptions and ABI, tooling and warnings, sanitizers, and safety red lines. Most checks read a single declared boolean. Two checks are computed from declared values: the zero-warnings check (the skill's warnings-as-errors gate states the number zero, so a declared `tooling.warning_count` passes only when it equals zero) and the forbidden-constructs check (the declared list passes only when it contains none of the three entries the skill's quality gate itself names). No other numeric threshold is imported: in particular no pass mark is imposed on clang-tidy findings, no special-member count, no sanitizer finding count, and no test-coverage percentage, because the skill states none.

The verdict is decided mechanically. Each check ends `pass`, `fail`, or `missing`. Any `fail` makes the verdict `REVIEW_DEFICIENT`. Otherwise any `missing` makes it `INSUFFICIENT_EVIDENCE`. Only when all 34 checks pass is the verdict `REVIEW_SOUND`. The same manifest always produces the same verdict: no floating-point arithmetic is performed anywhere in this atom, `warning_count` is echoed exactly as declared, and `forbidden_constructs_found` is reported in the skill's fixed stated order.

A sound verdict means the declared evidence is complete and consistent — it does **not** mean the underlying code is good. The atom does not compile, run, sanitize, format, or read live code, and it does not verify that any declared value is true. Qualitative judgments in the skill — whether genericity is real or vanity, whether template errors are really readable, whether shared ownership is genuinely shared, whether pimpl was really needed — do not reduce to deterministic checks and are carried only as caller declarations, never decided here.

**Buyer / use context.** Buyers are teams and agents working in C++ tooling and service builds who need the same bounded review applied to every change on demand, per use, instead of staffing the review discipline themselves. The house's own C++ tooling and service builds are an internal caller. What is sold is the review artifact — the verdict, its sections, checks and computed fields — never the underlying C++ knowledge itself.

## Role views

### For integrators (Users)

Integrate against the two endpoints above with one scoped key per atom. Treat HTTP 200 as a judged result (read `verdict`, then `sections`, then `checks`), HTTP 422 as a client-side type bug (read `field`/`detail`, fix, resubmit), and 401/403/429 as auth/scope/rate problems respectively. Cache nothing about a verdict across manifests: the verdict is a pure function of the manifest you sent, so re-send after any manifest change. The worked examples below are real recorded request/response pairs — use example 1 as your golden-path fixture and example 3 as your 422-handling fixture.

### For developers

Manifest authoring: declare facts, do not target the verdict — computed checks re-derive totals, coverage and vocabulary membership from the declared values themselves, so inconsistent declarations fail on their own arithmetic. Determinism: the core is deterministic (Python oracle and TypeScript port, parity-proven locally per SERVICE.md); the same manifest returns a byte-identical REST response, and MCP structured content equals the REST report core. Implementation pointers: `src/` holds the atom's core, `tests/` its test suite, `SERVICE.md` is the normative field/check specification, and `contract.yaml` the machine-readable contract (key namespace/prefix, rate limits, pricing status). Fixes land in the bound skill first and the atom re-deploys from the refined skill (contract binding rule R1).

### For ops

Endpoints: REST `POST /v1/cpp-engineering-review` and MCP `POST /mcp/cpp-engineering-review` on `https://atoms.pipavia.com` (gateway v1.1.0 in the recorded battery). Key scope is per atom — a 403 spike means clients are calling with keys that lack this atom's scope, not an outage. Rate limits: 60/min and 10,000/day per key; watch 429s per key before raising limits. Error monitoring: alert on 5xx (none are part of this atom's documented behavior) and on 422 rate by `field` (a rising 422 rate on one field usually means a client manifest generator changed shape). Status: live — release candidate, one-week RC soak to 2026-11-22; pricing is still pending (free during trial), so metering is for the cost ledger, not billing.

## Worked examples

Provenance: recorded 2026-11-16T02:43:48.397605+00:00 against gateway v1.1.0, external verification lane, source `verification/work/cpp-engineering-review/evidence.json`. Inputs and REST responses below are reproduced verbatim (pretty-printed with indent 2 only) and were verified mechanically against that evidence file after writing: each fenced block parses to a JSON value identical to the recorded value.

### Example 1 — Full-pass

Recorded expectation: HTTP 200, verdict `REVIEW_SOUND`.

Input (recorded `input`):

```json
{
  "subject": "PR-123",
  "raii": {
    "resources_owned_by_objects": true,
    "destructors_clean_up_resources": true,
    "manual_new_delete_in_new_code": false,
    "raw_owning_pointers_in_new_code": false,
    "forbidden_constructs": []
  },
  "value_semantics": {
    "values_const_references_preferred": true,
    "move_semantics_used_where_copies_expensive": true,
    "rule_of_zero_honored": true,
    "special_members_justified_when_present": true
  },
  "smart_pointers": {
    "unique_ptr_is_default": true,
    "shared_ptr_only_for_real_shared_ownership": true,
    "weak_ptr_used_to_break_cycles": true
  },
  "stl": {
    "algorithms_preferred_over_hand_loops": true,
    "containers_matched_to_access_patterns": true,
    "ranges_used_where_available": true,
    "templates_used_only_for_real_genericity": true,
    "template_error_messages_readable": true
  },
  "exceptions_and_abi": {
    "exceptions_policy_chosen": true,
    "exceptions_policy_documented": true,
    "exceptions_policy_applied_consistently": true,
    "stable_library_interfaces": true,
    "pimpl_used_where_needed": true,
    "symbols_versioned": true
  },
  "tooling": {
    "clang_tidy_run": true,
    "clang_tidy_clean_on_diff": true,
    "clang_format_applied": true,
    "warnings_treated_as_errors": true,
    "warning_count": 0
  },
  "sanitizers": {
    "asan_enabled_in_test_builds": true,
    "ubsan_enabled_in_test_builds": true,
    "tsan_enabled_in_test_builds": true,
    "sanitizer_clean_test_run": true
  },
  "safety": {
    "dangling_references_across_async_boundaries": false,
    "macros_used_where_language_features_exist": false
  }
}
```

REST response (recorded `response_text`):

```json
{
  "service": "cpp-engineering-review",
  "atom_version": "0.1.0",
  "subject": "PR-123",
  "verdict": "REVIEW_SOUND",
  "sections": {
    "raii_and_ownership": "pass",
    "value_semantics": "pass",
    "smart_pointers": "pass",
    "stl_and_templates": "pass",
    "exceptions_and_abi": "pass",
    "tooling_and_warnings": "pass",
    "sanitizers": "pass",
    "safety_red_lines": "pass"
  },
  "checks": [
    {
      "section": "raii_and_ownership",
      "check": "resources_owned_by_objects",
      "status": "pass",
      "evidence": "method step 1: resources are owned by objects — RAII everywhere (memory, files, sockets, locks)"
    },
    {
      "section": "raii_and_ownership",
      "check": "destructors_clean_up_resources",
      "status": "pass",
      "evidence": "method step 1: destructors clean up — no manual pairing"
    },
    {
      "section": "raii_and_ownership",
      "check": "no_manual_new_delete_in_new_code",
      "status": "pass",
      "evidence": "quality gate: no manual new/delete in new code"
    },
    {
      "section": "raii_and_ownership",
      "check": "no_raw_owning_pointers_in_new_code",
      "status": "pass",
      "evidence": "quality gate: no raw owning pointers in new code"
    },
    {
      "section": "raii_and_ownership",
      "check": "no_forbidden_constructs_present",
      "status": "pass",
      "evidence": "quality gate: no raw owning pointers or manual new/delete in new code"
    },
    {
      "section": "value_semantics",
      "check": "values_const_references_preferred",
      "status": "pass",
      "evidence": "method step 2: values, const, and references are preferred — value semantics first"
    },
    {
      "section": "value_semantics",
      "check": "move_semantics_used_where_copies_expensive",
      "status": "pass",
      "evidence": "method step 2: move semantics are used where copies are expensive"
    },
    {
      "section": "value_semantics",
      "check": "rule_of_zero_honored",
      "status": "pass",
      "evidence": "method step 2 / quality gate: the Rule of Zero is honored — special members are written only when you must"
    },
    {
      "section": "value_semantics",
      "check": "special_members_justified_when_present",
      "status": "pass",
      "evidence": "quality gate: special members are present only when justified"
    },
    {
      "section": "smart_pointers",
      "check": "unique_ptr_is_default",
      "status": "pass",
      "evidence": "method step 3: unique_ptr is the default smart pointer"
    },
    {
      "section": "smart_pointers",
      "check": "shared_ptr_only_for_real_shared_ownership",
      "status": "pass",
      "evidence": "method step 3: shared_ptr is used only for real shared ownership"
    },
    {
      "section": "smart_pointers",
      "check": "weak_ptr_used_to_break_cycles",
      "status": "pass",
      "evidence": "method step 3: weak_ptr is used to break cycles"
    },
    {
      "section": "stl_and_templates",
      "check": "algorithms_preferred_over_hand_loops",
      "status": "pass",
      "evidence": "method step 4: STL algorithms are preferred over hand loops"
    },
    {
      "section": "stl_and_templates",
      "check": "containers_matched_to_access_patterns",
      "status": "pass",
      "evidence": "method step 4: containers are matched to access patterns"
    },
    {
      "section": "stl_and_templates",
      "check": "ranges_used_where_available",
      "status": "pass",
      "evidence": "method step 4: ranges are used where available"
    },
    {
      "section": "stl_and_templates",
      "check": "templates_used_only_for_real_genericity",
      "status": "pass",
      "evidence": "method step 7: templates are used sparingly — for real genericity, not vanity"
    },
    {
      "section": "stl_and_templates",
      "check": "template_error_messages_readable",
      "status": "pass",
      "evidence": "method step 7: template error messages are kept readable"
    },
    {
      "section": "exceptions_and_abi",
      "check": "exceptions_policy_chosen",
      "status": "pass",
      "evidence": "method step 5: one exceptions policy is picked for the codebase (exceptions on/off)"
    },
    {
      "section": "exceptions_and_abi",
      "check": "exceptions_policy_documented",
      "status": "pass",
      "evidence": "method step 5: the exceptions policy is documented"
    },
    {
      "section": "exceptions_and_abi",
      "check": "exceptions_policy_applied_consistently",
      "status": "pass",
      "evidence": "method step 5: the exceptions policy is applied consistently"
    },
    {
      "section": "exceptions_and_abi",
      "check": "stable_library_interfaces",
      "status": "pass",
      "evidence": "method step 8: library interfaces are stable"
    },
    {
      "section": "exceptions_and_abi",
      "check": "pimpl_used_where_needed",
      "status": "pass",
      "evidence": "method step 8: pimpl is used where needed"
    },
    {
      "section": "exceptions_and_abi",
      "check": "symbols_versioned",
      "status": "pass",
      "evidence": "method step 8: symbols are versioned"
    },
    {
      "section": "tooling_and_warnings",
      "check": "clang_tidy_run_in_loop",
      "status": "pass",
      "evidence": "method step 6: clang-tidy is in the loop"
    },
    {
      "section": "tooling_and_warnings",
      "check": "clang_tidy_clean_on_diff",
      "status": "pass",
      "evidence": "quality gate: clang-tidy is clean on the diff"
    },
    {
      "section": "tooling_and_warnings",
      "check": "clang_format_applied",
      "status": "pass",
      "evidence": "method step 6: clang-format is applied"
    },
    {
      "section": "tooling_and_warnings",
      "check": "warnings_treated_as_errors",
      "status": "pass",
      "evidence": "method step 6: warnings are treated as errors"
    },
    {
      "section": "tooling_and_warnings",
      "check": "zero_warnings_maintained",
      "status": "pass",
      "evidence": "method step 6 / quality gate: zero warnings maintained — warnings-as-errors build green"
    },
    {
      "section": "sanitizers",
      "check": "asan_enabled_in_test_builds",
      "status": "pass",
      "evidence": "method step 6: ASan is enabled in test builds"
    },
    {
      "section": "sanitizers",
      "check": "ubsan_enabled_in_test_builds",
      "status": "pass",
      "evidence": "method step 6: UBSan is enabled in test builds"
    },
    {
      "section": "sanitizers",
      "check": "tsan_enabled_in_test_builds",
      "status": "pass",
      "evidence": "method step 6: TSan is enabled in test builds"
    },
    {
      "section": "sanitizers",
      "check": "sanitizer_clean_test_run",
      "status": "pass",
      "evidence": "quality gate: the test run is sanitizer-clean"
    },
    {
      "section": "safety_red_lines",
      "check": "no_dangling_references_across_async_boundaries",
      "status": "pass",
      "evidence": "red line: no dangling references across async boundaries"
    },
    {
      "section": "safety_red_lines",
      "check": "no_macros_where_language_features_exist",
      "status": "pass",
      "evidence": "red line: no macros where language features exist"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "warning_count": 0,
  "forbidden_constructs_found": [],
  "summary": "34 pass, 0 fail, 0 missing of 34 checks across eight sections.",
  "stamp": "CPP ENGINEERING REVIEW\nsubject: PR-123\nVERDICT: REVIEW_SOUND\n  raii_and_ownership               pass\n  value_semantics                  pass\n  smart_pointers                   pass\n  stl_and_templates                pass\n  exceptions_and_abi               pass\n  tooling_and_warnings             pass\n  sanitizers                       pass\n  safety_red_lines                 pass\n34 pass, 0 fail, 0 missing of 34 checks across eight sections."
}
```

### Example 2 — Violations

Recorded expectation: HTTP 200, verdict `REVIEW_DEFICIENT`.

Input (recorded `input`):

```json
{
  "subject": "PR-124",
  "raii": {
    "resources_owned_by_objects": true,
    "destructors_clean_up_resources": true,
    "manual_new_delete_in_new_code": true,
    "raw_owning_pointers_in_new_code": false,
    "forbidden_constructs": [
      "manual_new"
    ]
  },
  "value_semantics": {
    "values_const_references_preferred": true,
    "move_semantics_used_where_copies_expensive": true,
    "rule_of_zero_honored": true,
    "special_members_justified_when_present": true
  },
  "smart_pointers": {
    "unique_ptr_is_default": true,
    "shared_ptr_only_for_real_shared_ownership": true,
    "weak_ptr_used_to_break_cycles": true
  },
  "stl": {
    "algorithms_preferred_over_hand_loops": true,
    "containers_matched_to_access_patterns": true,
    "ranges_used_where_available": true,
    "templates_used_only_for_real_genericity": true,
    "template_error_messages_readable": true
  },
  "exceptions_and_abi": {
    "exceptions_policy_chosen": true,
    "exceptions_policy_documented": true,
    "exceptions_policy_applied_consistently": true,
    "stable_library_interfaces": true,
    "pimpl_used_where_needed": true,
    "symbols_versioned": true
  },
  "tooling": {
    "clang_tidy_run": true,
    "clang_tidy_clean_on_diff": true,
    "clang_format_applied": true,
    "warnings_treated_as_errors": true,
    "warning_count": 5
  },
  "sanitizers": {
    "asan_enabled_in_test_builds": true,
    "ubsan_enabled_in_test_builds": true,
    "tsan_enabled_in_test_builds": true,
    "sanitizer_clean_test_run": true
  },
  "safety": {
    "dangling_references_across_async_boundaries": false,
    "macros_used_where_language_features_exist": false
  }
}
```

REST response (recorded `response_text`):

```json
{
  "service": "cpp-engineering-review",
  "atom_version": "0.1.0",
  "subject": "PR-124",
  "verdict": "REVIEW_DEFICIENT",
  "sections": {
    "raii_and_ownership": "fail",
    "value_semantics": "pass",
    "smart_pointers": "pass",
    "stl_and_templates": "pass",
    "exceptions_and_abi": "pass",
    "tooling_and_warnings": "fail",
    "sanitizers": "pass",
    "safety_red_lines": "pass"
  },
  "checks": [
    {
      "section": "raii_and_ownership",
      "check": "resources_owned_by_objects",
      "status": "pass",
      "evidence": "method step 1: resources are owned by objects — RAII everywhere (memory, files, sockets, locks)"
    },
    {
      "section": "raii_and_ownership",
      "check": "destructors_clean_up_resources",
      "status": "pass",
      "evidence": "method step 1: destructors clean up — no manual pairing"
    },
    {
      "section": "raii_and_ownership",
      "check": "no_manual_new_delete_in_new_code",
      "status": "fail",
      "evidence": "quality gate: no manual new/delete in new code"
    },
    {
      "section": "raii_and_ownership",
      "check": "no_raw_owning_pointers_in_new_code",
      "status": "pass",
      "evidence": "quality gate: no raw owning pointers in new code"
    },
    {
      "section": "raii_and_ownership",
      "check": "no_forbidden_constructs_present",
      "status": "fail",
      "evidence": "quality gate: no raw owning pointers or manual new/delete in new code"
    },
    {
      "section": "value_semantics",
      "check": "values_const_references_preferred",
      "status": "pass",
      "evidence": "method step 2: values, const, and references are preferred — value semantics first"
    },
    {
      "section": "value_semantics",
      "check": "move_semantics_used_where_copies_expensive",
      "status": "pass",
      "evidence": "method step 2: move semantics are used where copies are expensive"
    },
    {
      "section": "value_semantics",
      "check": "rule_of_zero_honored",
      "status": "pass",
      "evidence": "method step 2 / quality gate: the Rule of Zero is honored — special members are written only when you must"
    },
    {
      "section": "value_semantics",
      "check": "special_members_justified_when_present",
      "status": "pass",
      "evidence": "quality gate: special members are present only when justified"
    },
    {
      "section": "smart_pointers",
      "check": "unique_ptr_is_default",
      "status": "pass",
      "evidence": "method step 3: unique_ptr is the default smart pointer"
    },
    {
      "section": "smart_pointers",
      "check": "shared_ptr_only_for_real_shared_ownership",
      "status": "pass",
      "evidence": "method step 3: shared_ptr is used only for real shared ownership"
    },
    {
      "section": "smart_pointers",
      "check": "weak_ptr_used_to_break_cycles",
      "status": "pass",
      "evidence": "method step 3: weak_ptr is used to break cycles"
    },
    {
      "section": "stl_and_templates",
      "check": "algorithms_preferred_over_hand_loops",
      "status": "pass",
      "evidence": "method step 4: STL algorithms are preferred over hand loops"
    },
    {
      "section": "stl_and_templates",
      "check": "containers_matched_to_access_patterns",
      "status": "pass",
      "evidence": "method step 4: containers are matched to access patterns"
    },
    {
      "section": "stl_and_templates",
      "check": "ranges_used_where_available",
      "status": "pass",
      "evidence": "method step 4: ranges are used where available"
    },
    {
      "section": "stl_and_templates",
      "check": "templates_used_only_for_real_genericity",
      "status": "pass",
      "evidence": "method step 7: templates are used sparingly — for real genericity, not vanity"
    },
    {
      "section": "stl_and_templates",
      "check": "template_error_messages_readable",
      "status": "pass",
      "evidence": "method step 7: template error messages are kept readable"
    },
    {
      "section": "exceptions_and_abi",
      "check": "exceptions_policy_chosen",
      "status": "pass",
      "evidence": "method step 5: one exceptions policy is picked for the codebase (exceptions on/off)"
    },
    {
      "section": "exceptions_and_abi",
      "check": "exceptions_policy_documented",
      "status": "pass",
      "evidence": "method step 5: the exceptions policy is documented"
    },
    {
      "section": "exceptions_and_abi",
      "check": "exceptions_policy_applied_consistently",
      "status": "pass",
      "evidence": "method step 5: the exceptions policy is applied consistently"
    },
    {
      "section": "exceptions_and_abi",
      "check": "stable_library_interfaces",
      "status": "pass",
      "evidence": "method step 8: library interfaces are stable"
    },
    {
      "section": "exceptions_and_abi",
      "check": "pimpl_used_where_needed",
      "status": "pass",
      "evidence": "method step 8: pimpl is used where needed"
    },
    {
      "section": "exceptions_and_abi",
      "check": "symbols_versioned",
      "status": "pass",
      "evidence": "method step 8: symbols are versioned"
    },
    {
      "section": "tooling_and_warnings",
      "check": "clang_tidy_run_in_loop",
      "status": "pass",
      "evidence": "method step 6: clang-tidy is in the loop"
    },
    {
      "section": "tooling_and_warnings",
      "check": "clang_tidy_clean_on_diff",
      "status": "pass",
      "evidence": "quality gate: clang-tidy is clean on the diff"
    },
    {
      "section": "tooling_and_warnings",
      "check": "clang_format_applied",
      "status": "pass",
      "evidence": "method step 6: clang-format is applied"
    },
    {
      "section": "tooling_and_warnings",
      "check": "warnings_treated_as_errors",
      "status": "pass",
      "evidence": "method step 6: warnings are treated as errors"
    },
    {
      "section": "tooling_and_warnings",
      "check": "zero_warnings_maintained",
      "status": "fail",
      "evidence": "method step 6 / quality gate: zero warnings maintained — warnings-as-errors build green"
    },
    {
      "section": "sanitizers",
      "check": "asan_enabled_in_test_builds",
      "status": "pass",
      "evidence": "method step 6: ASan is enabled in test builds"
    },
    {
      "section": "sanitizers",
      "check": "ubsan_enabled_in_test_builds",
      "status": "pass",
      "evidence": "method step 6: UBSan is enabled in test builds"
    },
    {
      "section": "sanitizers",
      "check": "tsan_enabled_in_test_builds",
      "status": "pass",
      "evidence": "method step 6: TSan is enabled in test builds"
    },
    {
      "section": "sanitizers",
      "check": "sanitizer_clean_test_run",
      "status": "pass",
      "evidence": "quality gate: the test run is sanitizer-clean"
    },
    {
      "section": "safety_red_lines",
      "check": "no_dangling_references_across_async_boundaries",
      "status": "pass",
      "evidence": "red line: no dangling references across async boundaries"
    },
    {
      "section": "safety_red_lines",
      "check": "no_macros_where_language_features_exist",
      "status": "pass",
      "evidence": "red line: no macros where language features exist"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "warning_count": 5,
  "forbidden_constructs_found": [
    "manual_new"
  ],
  "summary": "31 pass, 3 fail, 0 missing of 34 checks across eight sections.",
  "stamp": "CPP ENGINEERING REVIEW\nsubject: PR-124\nVERDICT: REVIEW_DEFICIENT\n  raii_and_ownership               fail\n  value_semantics                  pass\n  smart_pointers                   pass\n  stl_and_templates                pass\n  exceptions_and_abi               pass\n  tooling_and_warnings             fail\n  sanitizers                       pass\n  safety_red_lines                 pass\n31 pass, 3 fail, 0 missing of 34 checks across eight sections."
}
```

### Example 3 — Malformed

Recorded expectation: HTTP 422, error `invalid_input` — never a verdict.

Input (recorded `input`):

```json
{
  "subject": "Malformed-Input",
  "tooling": {
    "warning_count": "should-be-a-number"
  }
}
```

REST response (recorded `response_text`):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "tooling.warning_count",
  "detail": "tooling.warning_count must be a number"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation all present |
| Output format | CommonMark markdown |
| Role views present | Integrators (Users): Yes · Developers: Yes · Ops: Yes · Regulators: N/A — the verdict is an engineering-evidence completeness review of a declared manifest; SERVICE.md names no regulation and the verdict is not compliance or audit evidence. |
| Checks named: documented / recorded | 34 / 34 |
| Verdict vocabulary complete | Yes — all 3 verdict values (INSUFFICIENT_EVIDENCE, REVIEW_DEFICIENT, REVIEW_SOUND), section statuses, per-check statuses and `computed_status` values listed |
| Input reference typed | Yes — 35 fields, each with a type, grouped as SERVICE.md groups them |
| Worked examples verbatim-verified | Yes — full-pass / violations / malformed inputs and REST responses parsed and compared as JSON values against `verification/work/cpp-engineering-review/evidence.json` after writing |
