# Browser extension engineering — documentation

**Browser extension engineering** · slug `browser-extension-engineering` · deliverable type: DELIVERABLE · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. The worked examples at the end are real recorded trial runs, reproduced verbatim from the external verification evidence.

## Tutorial

A first call, walked through end to end. This tutorial narrates the recorded full-pass trial run (Worked example 1 below reproduces it verbatim); every value named here is the value that run actually returned.

**The job.** You have a browser-extension design/build manifest — one extension as its caller declares it, and you want one deterministic verdict on whether it is complete and internally coherent on its own declared evidence.

**Step 1 — get a key.** Sign up and issue a gateway key for this atom (the exact calls are in *How-to guides → Get a key and call via REST*). Keep the key; you send it as `Authorization: Bearer <key>` on every call.

**Step 2 — assemble the manifest.** Build one JSON object covering every section: `mv3_architecture`, `least_privilege_permissions`, `architecture_and_messaging`, `ux_honesty`, `privacy`, `distribution_and_cross_browser`, `security`. In the recorded run the identity field `extension_name` was `"Test Extension"`. Fill each evidence field honestly from your own records: `true` where the practice was followed, `false` where a must-be-false field applies (see the Input reference — those fields must be `false` to pass), and the declared lists and numbers the computed checks re-derive. Leave a field out only if you genuinely have no evidence for it — an absent field is not a failure, it is `missing`, and it will hold the verdict at `INSUFFICIENT_EVIDENCE`.

**Step 3 — send it.** `POST https://atoms.pipavia.com/v1/browser-extension-engineering` with the manifest as the body and your key in the `Authorization` header.

**Step 4 — read the verdict.** The recorded run returned HTTP 200 with verdict `EXTENSION_DESIGN_SOUND`: every section `pass`, and the summary "37 pass, 0 fail, 0 missing of 37 checks across seven sections." The computed fields came back `computed_status` = `"within_stated_limits_on_declared_evidence"`, `permissions_without_justification` = `[]`, `browsers_not_covered` = `[]` — the declared lists and numbers agree with the limits the method itself states, on the declared evidence.

**Step 5 — act on it.** A `EXTENSION_DESIGN_SOUND` verdict means the manifest is complete on the evidence you declared — it does not certify that the underlying work is good (see *Explanation → What it does not do*). If instead you get the failing verdict or `INSUFFICIENT_EVIDENCE`, the `checks` array names exactly which checks failed or are missing; *How-to guides → Read a failing verdict and fix the manifest* walks through that repair loop using the recorded violations run.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "browser-extension-engineering"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.
4. Call the atom: `POST https://atoms.pipavia.com/v1/browser-extension-engineering` — body = the manifest object (see the Input reference).

```bash
curl -s -X POST https://atoms.pipavia.com/v1/browser-extension-engineering \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -d @manifest.json
```

The response is the verdict object described in *Reference → Output format*. The same manifest always returns the same verdict (determinism was byte-identical on the recorded repeat call — see TEST-REPORT.md).

### Call via MCP

- Endpoint: `POST https://atoms.pipavia.com/mcp/browser-extension-engineering`
- Tool name: `browser_extension_engineering`
- Call `tools/call` with the tool name above and the manifest object as the arguments — the same object you would send as the REST body, with the same `Authorization: Bearer <key>` header.
- The MCP result's structured content is the same verdict object as the REST response (parity was verified structured-equal on the recorded full-pass run — see TEST-REPORT.md). Prefer whichever face your client already speaks; do not expect different verdicts from the two faces.

### Read a failing verdict and fix the manifest

The recorded violations run (Worked example 2) returned verdict `EXTENSION_DESIGN_DEFICIENT` with the summary "27 pass, 10 fail, 0 missing of 37 checks across seven sections." Repair any failing verdict the same way:

1. **Read `sections` first.** A section is `fail` when any of its checks fails, `insufficient_evidence` when none fails but at least one is `missing`, and `pass` only when all its checks pass. That tells you where to look.
2. **Read the `checks` array.** Each entry is `{section, check, status, evidence}`. Work the `fail` entries first — the `evidence` text states the rule that was breached. In the recorded violations run the failing checks were: `no_persistent_background_page`, `no_remote_code_execution`, `no_overbroad_permissions`, `all_requested_permissions_justified_in_writing`, `no_secrets_in_extension_storage`, `no_drive_by_dom_changes_without_user_intent`, `browsing_data_never_exfiltrated`, `no_hidden_data_collection`, `all_target_browsers_tested_or_differences_documented`, `no_eval_or_remote_scripts`.
3. **Distinguish `fail` from `missing`.** `fail` = the field was present but false, invalid, or arithmetically/set-wise incoherent — fix the underlying practice or correct the declaration. `missing` = the field was absent — supply the evidence; do not guess a value to make the check pass, because the atom audits declarations, and a declaration you cannot stand behind is worse than a missing one.
4. **Check the computed fields.** On a failing verdict the computed outputs (see *Reference → Output format*) show the re-derived values and the differences, so you can see by how much a declared total, count, or list disagrees before you resubmit.
5. **Fix the manifest and resubmit the whole object.** The atom is stateless per call: there is no partial update, no case to reopen, and no memory of the previous submission. Resubmit the corrected full manifest and read the new verdict.

### Handle a 422 invalid_input

A type violation is not a verdict — the call is rejected before any check runs. The recorded malformed run (Worked example 3) returned HTTP 422 with this body:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "extension_name",
  "detail": "extension_name must be a string"
}
```

- `field` names the exact manifest field whose type was wrong (`extension_name` in the recorded run); `detail` states the type it must be (`"extension_name must be a string"`).
- Fix that field's type in the manifest (consult the type column of the Input reference), then resubmit. If you sent several wrongly-typed fields, expect to repeat this once per call — the recorded shape reports one `field` per response.
- Do not retry the identical body: a 422 is deterministic for the same input and will not clear on its own. It is also not a rate-limit or auth problem — check the `error` value first: `invalid_input` means the manifest, not the key.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/browser-extension-engineering` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/browser-extension-engineering` — tool name `browser_extension_engineering`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Gateway: https://atoms.pipavia.com, gateway version 1.1.0 at the time of the recorded runs. Key scope: this atom only — a key's scope for one atom never verifies for another (contract.yaml key namespace `browser_extension_engineering`).

### Input reference

One JSON manifest. Types are taken from SERVICE.md's field table (its preamble states: all fields are booleans unless noted); the evidence `inputSchema` corroborates the top-level object/string/array types. Notes — including must-be-false gates and computed/conditional behaviour — are preserved from SERVICE.md. Fields are grouped as SERVICE.md groups them (by the section that reads them).

#### Carried / top-level (not itself checked)

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `extension_name` | string | string; carried into the verdict output, not itself checked |

#### Read by section `mv3_architecture`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `mv3.service_worker_background` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `mv3.persistent_background_page_used` | boolean | must be `false` to pass — skill method step 1 |
| `mv3.alarms_used_instead_of_timers` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `mv3.declarative_apis_used_where_possible` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `mv3.remote_code_executed` | boolean | must be `false` to pass — skill method step 1 |
| `mv3.all_code_bundled` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |

#### Read by section `least_privilege_permissions`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `permissions.only_needed_requested` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `permissions.host_patterns_narrow` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `permissions.optional_permissions_for_power_features` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `permissions.permission_list_reviewed_as_security_audit` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `permissions.overbroad_permissions_present` | boolean | must be `false` to pass — skill red line |
| `permissions.requested` | list of strings | list of strings; computed, see below |
| `permissions.justified` | list of strings | list of strings; computed, see below |

#### Read by section `architecture_and_messaging`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `architecture.content_scripts_isolated_from_page_context` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `architecture.message_passing_well_defined` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `architecture.messages_validated_on_both_ends` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `architecture.storage_scoped_sync_vs_local` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `architecture.secrets_stored_in_extension_storage` | boolean | must be `false` to pass — skill method step 3 |

#### Read by section `ux_honesty`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `ux.popup_or_options_pages_provided` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `ux.logged_out_and_unavailable_states_provided` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `ux.keyboard_shortcuts_provided` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `ux.drive_by_dom_changes_without_user_intent` | boolean | must be `false` to pass — skill method step 4 |

#### Read by section `privacy`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `privacy.page_data_processed_locally_by_default` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `privacy.telemetry_requires_explicit_consent` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `privacy.telemetry_clearly_disclosed` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `privacy.privacy_disclosure_matches_behavior_tested` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `privacy.browsing_data_exfiltrated` | boolean | must be `false` to pass — skill method step 5 |
| `privacy.hidden_data_collection_present` | boolean | must be `false` to pass — skill red line |

#### Read by section `distribution_and_cross_browser`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `distribution.store_listing_screenshots_provided` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `distribution.store_privacy_form_accurate` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `distribution.staged_rollout_planned` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `distribution.version_discipline_followed` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `distribution.firefox_mv3_differences_addressed` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `distribution.target_browsers` | list of strings | list of strings; computed, see below |
| `distribution.tested_browsers` | list of strings | list of strings; computed, see below |
| `distribution.difference_documented_browsers` | list of strings | list of strings; computed, see below |

#### Read by section `security`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `security.csp_discipline_followed` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `security.injected_ui_sanitized` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `security.auto_update_via_store_only` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `security.eval_or_remote_scripts_used` | boolean | must be `false` to pass — skill red line |

Container objects (the section objects and any list-of-objects entries above) are objects/arrays as typed; a container sent as the wrong JSON type is a 422 `invalid_input`, not a failing check (see Errors).

### Checks

Every check the atom runs — 37 checks, grouped by section. Ground truth: the `checks` array of the recorded full-pass REST response (Worked example 1), cross-checked against SERVICE.md; the counts agree (37/37). The `evidence` text quoted for each check is the recorded response's own statement of what the check requires.

**Per-check status semantics (all checks):** `pass` — the recorded evidence satisfies the stated requirement; `fail` — the field was present but false/invalid, or a computed condition (arithmetic, set coverage, vocabulary) was not met; `missing` — the field(s) the check reads were absent, so there is no evidence to judge. No `not_applicable` per-check status is returned by this atom in any recorded case.

#### Section `mv3_architecture` — 6 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `service_worker_background` | method step 1: the background is a service worker |
| `no_persistent_background_page` | method step 1: no persistent background page is used |
| `alarms_used_instead_of_timers` | method step 1: alarms are used instead of timers |
| `declarative_apis_used_where_possible` | method step 1: declarative APIs are used where possible |
| `no_remote_code_execution` | method step 1: no remote code execution — everything is bundled |
| `all_code_bundled` | method step 1: all code is bundled with the extension |

#### Section `least_privilege_permissions` — 6 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `only_needed_permissions_requested` | method step 2: only needed permissions are requested |
| `host_patterns_narrow` | method step 2 / quality gate: host patterns are narrow / minimal |
| `optional_permissions_for_power_features` | method step 2: power features use optional permissions |
| `permission_list_reviewed_as_security_audit` | method step 2: the permission list is reviewed like a security audit |
| `no_overbroad_permissions` | red line: no overbroad permissions |
| `all_requested_permissions_justified_in_writing` | quality gate: each permission is justified in writing — every declared requested permission appears in the declared justified-in-writing list |

#### Section `architecture_and_messaging` — 5 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `content_scripts_isolated_from_page_context` | method step 3: content scripts are isolated from page context |
| `message_passing_well_defined` | method step 3: message passing is well-defined |
| `messages_validated_on_both_ends` | method step 3 / quality gate: messages are validated on both ends |
| `storage_scoped` | method step 3: storage is scoped — storage.sync vs local chosen deliberately |
| `no_secrets_in_extension_storage` | method step 3: no secrets are kept in extension storage |

#### Section `ux_honesty` — 4 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `popup_or_options_pages_provided` | method step 4: popup / options pages are provided |
| `logged_out_and_unavailable_states_provided` | method step 4: states for logged-out / unavailable are provided |
| `keyboard_shortcuts_provided` | method step 4: keyboard shortcuts are provided |
| `no_drive_by_dom_changes_without_user_intent` | method step 4: no drive-by DOM changes without user intent |

#### Section `privacy` — 6 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `page_data_processed_locally_by_default` | method step 5: page data is processed locally by default |
| `telemetry_requires_explicit_consent` | method step 5: any telemetry requires explicit consent |
| `telemetry_clearly_disclosed` | method step 5: any telemetry is clearly disclosed |
| `privacy_disclosure_matches_actual_behavior_tested` | quality gate: the privacy disclosure matches actual behavior, tested |
| `browsing_data_never_exfiltrated` | method step 5: browsing data is never exfiltrated |
| `no_hidden_data_collection` | red line: no hidden data collection |

#### Section `distribution_and_cross_browser` — 6 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `store_listing_screenshots_provided` | method step 6: the store listing includes screenshots |
| `store_privacy_form_accurate` | method step 6: the store privacy form is accurate |
| `staged_rollout_planned` | method step 6: distribution uses a staged rollout |
| `version_discipline_followed` | method step 6: version discipline is followed |
| `firefox_mv3_differences_addressed` | method step 6: Firefox MV3 differences are addressed (browser.* shim) |
| `all_target_browsers_tested_or_differences_documented` | quality gate: the extension works across target browsers, or differences are documented — every declared target browser appears in the declared tested list or the declared difference-documented list, and at least one target browser is declared |

#### Section `security` — 4 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `csp_discipline_followed` | method step 7: CSP discipline is followed |
| `injected_ui_sanitized` | method step 7: any injected UI is sanitized |
| `auto_update_via_store_only` | method step 7: auto-update is via the store only |
| `no_eval_or_remote_scripts` | red line: no eval / remote scripts |

#### Computed checks in detail

- **Permission justification coverage (`all_requested_permissions_justified_in_writing`):** when the requested permissions and the permissions justified in writing are both declared, every requested permission passes only when it appears in the justified list. The output reports `permissions_without_justification` (requested entries with no written justification, in declared order; null when either list is not declared). Justifications for permissions that were not requested do not count against the design, and an empty requested list passes vacuously — an extension may request no permissions at all.
- **Cross-browser coverage (`all_target_browsers_tested_or_differences_documented`):** when target browsers, tested browsers and difference-documented browsers are all declared, every target browser passes only when it appears in the tested list or the difference-documented list, and at least one target browser must be declared (an empty target list is present and fails). The output reports `browsers_not_covered` (target entries in neither list, in declared order; null when any of the three lists is not declared).
- List entries are validated as strings only, never enum-checked — coverage is a verdict check, not a type error. No specific permission, host pattern, or browser is named by the method as passing or failing, so none is imposed.

The output also reports `computed_status` over the two computed checks: `within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when either of the two computed checks cannot be completed (SERVICE.md).

### Output format

HTTP 200 with one JSON verdict object (a 422 rejection is the only non-verdict response shape — see Errors). Top-level fields, in the order returned in the recorded responses:

| Field | Meaning |
|---|---|
| `service` | Always `"browser-extension-engineering"`. |
| `atom_version` | Atom version that produced the verdict (`"0.1.0"` in the recorded runs). |
| `extension_name` | The manifest's identity field, carried through (null when the manifest did not declare it, as in the recorded violations run for some atoms). |
| `verdict` | One of the verdict values below. |
| `sections` | Object mapping each section name to its section status (`pass` / `fail` / `insufficient_evidence`). |
| `checks` | Array of `{section, check, status, evidence}` — one entry per check, in section order. |
| `computed_status` | `within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null — see the computed-checks note above. |
| `permissions_without_justification` | Computed output field (see *Checks → Computed checks in detail*); in the recorded full-pass run: `[]`. Null when it cannot be computed from the declared values, unless SERVICE.md states a different null rule for it. |
| `browsers_not_covered` | Computed output field (see *Checks → Computed checks in detail*); in the recorded full-pass run: `[]`. Null when it cannot be computed from the declared values, unless SERVICE.md states a different null rule for it. |
| `summary` | One-line count, e.g. "37 pass, 0 fail, 0 missing of 37 checks across seven sections." |
| `stamp` | Plain-text rendering of the same verdict (display name, identity, verdict, per-section statuses, summary) for human-readable records. |

### Verdict vocabulary

| Value | Kind | Meaning |
|---|---|---|
| `EXTENSION_DESIGN_SOUND` | verdict | Every check passes (37/37); the manifest is complete and coherent on the declared evidence. |
| `EXTENSION_DESIGN_DEFICIENT` | verdict | At least one check fails. Failing checks are named in the `checks` array with their evidence text. |
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
| 422 | `invalid_input` | Recorded body (verbatim from the malformed case): `{"ok": false, "error": "invalid_input", "field": "extension_name", "detail": "extension_name must be a string"}` — `ok: false`, `error`, `field` (the exact manifest field) and `detail` (the type it must be). Never a verdict. |
| 429 | rate limit | Rate limit exceeded: 60/min, 10,000/day per key (contract.yaml / USER-GUIDE.md). No body shape is recorded in the evidence; back off and retry after the window. |

### Rate limits and pricing status

- Rate limits (contract.yaml): **60 requests per minute per key** and **10,000 requests per day per key**. Contract note: the per-key rate limit is the capacity guard for open public usage; tuned per atom at build-out from measured production cost.
- Pricing (contract.yaml): pricing unit = deliverable; `pricing.rate` is **null** (`rate_status: pending`). **Free during trial — rate pending.** Prices are set only from measured production cost per unit (SERVICE.md).

## Explanation

### What this atom does, in depth

This atom audits one declared extension design against a careful extension-engineering method: MV3 architecture (service-worker background, no persistent background page, no remote code, alarms instead of timers), least-privilege permissions with written justification for each, well-defined and validated messaging with no secrets in extension storage, honest UX with no drive-by DOM changes, privacy by local processing and consented telemetry, store-ready distribution with cross-browser differences addressed, and CSP/security discipline with no eval or remote scripts. It is a completeness and consistency audit of the declared design and of its declared permission and browser lists.

### How the verdict is decided

The core is deterministic: same manifest in → same verdict out, byte-identically (verified on the recorded repeat call). Each check reads declared field(s) and lands in exactly one of three states:

- **Absent field = missing evidence.** The check is `missing`; its section is `insufficient_evidence` unless another check in it fails; and if nothing anywhere fails, the verdict is `INSUFFICIENT_EVIDENCE`. Missing is not a failure and is never silently treated as `false`.
- **Present but false / invalid = fail.** The check is `fail`, its section is `fail`, and the verdict is the failing verdict — one failing check is enough, however complete the rest of the manifest is. Must-be-false (red-line) fields work the same way in mirror image: present and `true` = fail.
- **Computed checks** re-derive what can be re-derived from the declared values themselves — arithmetic, set coverage, and stated vocabulary only, importing no outside threshold (see *Checks → Computed checks in detail*). A computed check whose inputs are absent is `missing`, not failed; one whose inputs are present but disagree is `fail`.

Section statuses roll up mechanically (`fail` if any check fails, else `insufficient_evidence` if any is missing, else `pass`), and the verdict rolls up the same way across all 37 checks: `EXTENSION_DESIGN_SOUND` only when every check passes.

### What it does not do

- It does **not** write extension code, inspect a real extension package or manifest file, run the extension in a browser, or verify that a declared value is true. A design can be sound on the declared evidence even if a declaration is mistaken.
- It is **not a code review or a store review**: it never decides whether a permission is actually needed, whether a host pattern is actually narrow, whether messaging validation is actually correct, or whether a store will accept the extension.
- No permission vocabulary (the method states no list of overbroad permissions — overbreadth is a declared field, not a computed one); no host-pattern breadth test; no browser vocabulary (the method names Firefox only for its MV3 differences, a declared field; coverage is pure set logic over the caller's own strings).
- No version-number rule (the method requires version discipline but states no scheme) and no numeric threshold of any kind; no store submission or store-review outcome prediction.

The atom sells its deliverable — the bounded judgment artifact (the verdict object) — never the underlying knowledge or method itself.

### Buyer and use context

First buyer hypothesis (SERVICE.md, from register data; not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand. Named self-use: **Reader extension builds** — Wright is an internal caller (zero price, metered to the internal cost ledger).

## Role views

### For integrators (Users)

- Start with [USER-GUIDE.md](USER-GUIDE.md) for the quick start, then the Tutorial and How-to guides above. One call = one manifest in, one verdict object out; there is no session, upload, or follow-up state to manage.
- Integrate on the REST face (`POST /v1/browser-extension-engineering`) or the MCP face (tool `browser_extension_engineering`) — they return the same verdict object and were parity-verified. Branch on `verdict` first, then on per-check `status` for repair guidance; treat HTTP 422 as a client bug (fix the type named in `field`), 401/403 as key problems, and 429 as back-off.
- Cache by manifest content if you cache at all: the verdict is a pure function of the manifest, so an identical manifest never needs a second paid call.

### For developers

- Manifest authoring: type every field exactly as the Input reference states — booleans as JSON booleans (not `"true"`), numbers as JSON numbers, lists as arrays of strings. A wrong type is a 422 at the gateway, not a failing check; a wrong *value* is a failing check. Vocabulary and coverage fields are validated as strings only and judged as verdict checks, so a misspelled vocabulary entry fails its check rather than erroring.
- Determinism: the core is a deterministic Python oracle with a TypeScript port, parity-proven (TEST-REPORT.md); the recorded REST repeat was byte-identical and MCP structured content was deep-equal to REST. Any fixed serialization rule for computed outputs is stated in *Checks → Computed checks in detail* where SERVICE.md states one.
- Source and tests: implementation in `src/browser_extension_engineering.py`, tests in `tests/test_browser_extension_engineering.py` (same directory as this document). Fixes land in the bound skill first, then the atom re-deploys and must pass regression before its version bumps (contract.yaml binding rule R1).

### For ops

- Endpoints: REST `POST https://atoms.pipavia.com/v1/browser-extension-engineering` and MCP `POST https://atoms.pipavia.com/mcp/browser-extension-engineering` on gateway https://atoms.pipavia.com (v1.1.0 at recorded-run time). Status: live — release candidate, one-week RC soak to 2026-11-22; treat verdict-shape changes during the soak as RC incidents, not silent deploys.
- Keys and scope: per-user, per-atom issuance (`POST /v1/keys`); a key's scope for this atom is namespace `browser_extension_engineering` and never verifies for another atom. Watch 403s for mis-issued keys and 401s for missing/invalid headers.
- Limits and monitoring: 60/min and 10,000/day per key; alert on 429 volume (client retry storms), on 422 rate (a client shipping wrongly-typed manifests), and on any drift between REST and MCP verdicts for identical manifests (parity is a verified property — drift is a defect). Pricing is not yet metered for revenue: rate pending, free during trial.

## Worked examples

Provenance: recorded 2026-11-16T01:18:52.566235+00:00 against gateway v1.1.0, external verification lane, source `verification/work/browser-extension-engineering/evidence.json`. The three examples below are that evidence's recorded cases: each shows the case's `input` and the REST execution's `response_text`, reproduced verbatim as JSON values (pretty-printed with indent 2 for readability; verified mechanically after writing — see the checklist).

### Example 1 — full-pass

Recorded expectation: HTTP 200, outcome `EXTENSION_DESIGN_SOUND`. Recorded REST status: 200.

Input:

```json
{
  "extension_name": "Test Extension",
  "mv3": {
    "service_worker_background": true,
    "persistent_background_page_used": false,
    "alarms_used_instead_of_timers": true,
    "declarative_apis_used_where_possible": true,
    "remote_code_executed": false,
    "all_code_bundled": true
  },
  "permissions": {
    "only_needed_requested": true,
    "host_patterns_narrow": true,
    "optional_permissions_for_power_features": true,
    "permission_list_reviewed_as_security_audit": true,
    "overbroad_permissions_present": false,
    "requested": [
      "storage",
      "tabs"
    ],
    "justified": [
      "storage",
      "tabs"
    ]
  },
  "architecture": {
    "content_scripts_isolated_from_page_context": true,
    "message_passing_well_defined": true,
    "messages_validated_on_both_ends": true,
    "storage_scoped_sync_vs_local": true,
    "secrets_stored_in_extension_storage": false
  },
  "ux": {
    "popup_or_options_pages_provided": true,
    "logged_out_and_unavailable_states_provided": true,
    "keyboard_shortcuts_provided": true,
    "drive_by_dom_changes_without_user_intent": false
  },
  "privacy": {
    "page_data_processed_locally_by_default": true,
    "telemetry_requires_explicit_consent": true,
    "telemetry_clearly_disclosed": true,
    "privacy_disclosure_matches_behavior_tested": true,
    "browsing_data_exfiltrated": false,
    "hidden_data_collection_present": false
  },
  "distribution": {
    "store_listing_screenshots_provided": true,
    "store_privacy_form_accurate": true,
    "staged_rollout_planned": true,
    "version_discipline_followed": true,
    "firefox_mv3_differences_addressed": true,
    "target_browsers": [
      "chrome",
      "firefox"
    ],
    "tested_browsers": [
      "chrome",
      "firefox"
    ],
    "difference_documented_browsers": []
  },
  "security": {
    "csp_discipline_followed": true,
    "injected_ui_sanitized": true,
    "auto_update_via_store_only": true,
    "eval_or_remote_scripts_used": false
  }
}
```

Response (REST `response_text`):

```json
{
  "service": "browser-extension-engineering",
  "atom_version": "0.1.0",
  "extension_name": "Test Extension",
  "verdict": "EXTENSION_DESIGN_SOUND",
  "sections": {
    "mv3_architecture": "pass",
    "least_privilege_permissions": "pass",
    "architecture_and_messaging": "pass",
    "ux_honesty": "pass",
    "privacy": "pass",
    "distribution_and_cross_browser": "pass",
    "security": "pass"
  },
  "checks": [
    {
      "section": "mv3_architecture",
      "check": "service_worker_background",
      "status": "pass",
      "evidence": "method step 1: the background is a service worker"
    },
    {
      "section": "mv3_architecture",
      "check": "no_persistent_background_page",
      "status": "pass",
      "evidence": "method step 1: no persistent background page is used"
    },
    {
      "section": "mv3_architecture",
      "check": "alarms_used_instead_of_timers",
      "status": "pass",
      "evidence": "method step 1: alarms are used instead of timers"
    },
    {
      "section": "mv3_architecture",
      "check": "declarative_apis_used_where_possible",
      "status": "pass",
      "evidence": "method step 1: declarative APIs are used where possible"
    },
    {
      "section": "mv3_architecture",
      "check": "no_remote_code_execution",
      "status": "pass",
      "evidence": "method step 1: no remote code execution \u2014 everything is bundled"
    },
    {
      "section": "mv3_architecture",
      "check": "all_code_bundled",
      "status": "pass",
      "evidence": "method step 1: all code is bundled with the extension"
    },
    {
      "section": "least_privilege_permissions",
      "check": "only_needed_permissions_requested",
      "status": "pass",
      "evidence": "method step 2: only needed permissions are requested"
    },
    {
      "section": "least_privilege_permissions",
      "check": "host_patterns_narrow",
      "status": "pass",
      "evidence": "method step 2 / quality gate: host patterns are narrow / minimal"
    },
    {
      "section": "least_privilege_permissions",
      "check": "optional_permissions_for_power_features",
      "status": "pass",
      "evidence": "method step 2: power features use optional permissions"
    },
    {
      "section": "least_privilege_permissions",
      "check": "permission_list_reviewed_as_security_audit",
      "status": "pass",
      "evidence": "method step 2: the permission list is reviewed like a security audit"
    },
    {
      "section": "least_privilege_permissions",
      "check": "no_overbroad_permissions",
      "status": "pass",
      "evidence": "red line: no overbroad permissions"
    },
    {
      "section": "least_privilege_permissions",
      "check": "all_requested_permissions_justified_in_writing",
      "status": "pass",
      "evidence": "quality gate: each permission is justified in writing \u2014 every declared requested permission appears in the declared justified-in-writing list"
    },
    {
      "section": "architecture_and_messaging",
      "check": "content_scripts_isolated_from_page_context",
      "status": "pass",
      "evidence": "method step 3: content scripts are isolated from page context"
    },
    {
      "section": "architecture_and_messaging",
      "check": "message_passing_well_defined",
      "status": "pass",
      "evidence": "method step 3: message passing is well-defined"
    },
    {
      "section": "architecture_and_messaging",
      "check": "messages_validated_on_both_ends",
      "status": "pass",
      "evidence": "method step 3 / quality gate: messages are validated on both ends"
    },
    {
      "section": "architecture_and_messaging",
      "check": "storage_scoped",
      "status": "pass",
      "evidence": "method step 3: storage is scoped \u2014 storage.sync vs local chosen deliberately"
    },
    {
      "section": "architecture_and_messaging",
      "check": "no_secrets_in_extension_storage",
      "status": "pass",
      "evidence": "method step 3: no secrets are kept in extension storage"
    },
    {
      "section": "ux_honesty",
      "check": "popup_or_options_pages_provided",
      "status": "pass",
      "evidence": "method step 4: popup / options pages are provided"
    },
    {
      "section": "ux_honesty",
      "check": "logged_out_and_unavailable_states_provided",
      "status": "pass",
      "evidence": "method step 4: states for logged-out / unavailable are provided"
    },
    {
      "section": "ux_honesty",
      "check": "keyboard_shortcuts_provided",
      "status": "pass",
      "evidence": "method step 4: keyboard shortcuts are provided"
    },
    {
      "section": "ux_honesty",
      "check": "no_drive_by_dom_changes_without_user_intent",
      "status": "pass",
      "evidence": "method step 4: no drive-by DOM changes without user intent"
    },
    {
      "section": "privacy",
      "check": "page_data_processed_locally_by_default",
      "status": "pass",
      "evidence": "method step 5: page data is processed locally by default"
    },
    {
      "section": "privacy",
      "check": "telemetry_requires_explicit_consent",
      "status": "pass",
      "evidence": "method step 5: any telemetry requires explicit consent"
    },
    {
      "section": "privacy",
      "check": "telemetry_clearly_disclosed",
      "status": "pass",
      "evidence": "method step 5: any telemetry is clearly disclosed"
    },
    {
      "section": "privacy",
      "check": "privacy_disclosure_matches_actual_behavior_tested",
      "status": "pass",
      "evidence": "quality gate: the privacy disclosure matches actual behavior, tested"
    },
    {
      "section": "privacy",
      "check": "browsing_data_never_exfiltrated",
      "status": "pass",
      "evidence": "method step 5: browsing data is never exfiltrated"
    },
    {
      "section": "privacy",
      "check": "no_hidden_data_collection",
      "status": "pass",
      "evidence": "red line: no hidden data collection"
    },
    {
      "section": "distribution_and_cross_browser",
      "check": "store_listing_screenshots_provided",
      "status": "pass",
      "evidence": "method step 6: the store listing includes screenshots"
    },
    {
      "section": "distribution_and_cross_browser",
      "check": "store_privacy_form_accurate",
      "status": "pass",
      "evidence": "method step 6: the store privacy form is accurate"
    },
    {
      "section": "distribution_and_cross_browser",
      "check": "staged_rollout_planned",
      "status": "pass",
      "evidence": "method step 6: distribution uses a staged rollout"
    },
    {
      "section": "distribution_and_cross_browser",
      "check": "version_discipline_followed",
      "status": "pass",
      "evidence": "method step 6: version discipline is followed"
    },
    {
      "section": "distribution_and_cross_browser",
      "check": "firefox_mv3_differences_addressed",
      "status": "pass",
      "evidence": "method step 6: Firefox MV3 differences are addressed (browser.* shim)"
    },
    {
      "section": "distribution_and_cross_browser",
      "check": "all_target_browsers_tested_or_differences_documented",
      "status": "pass",
      "evidence": "quality gate: the extension works across target browsers, or differences are documented \u2014 every declared target browser appears in the declared tested list or the declared difference-documented list, and at least one target browser is declared"
    },
    {
      "section": "security",
      "check": "csp_discipline_followed",
      "status": "pass",
      "evidence": "method step 7: CSP discipline is followed"
    },
    {
      "section": "security",
      "check": "injected_ui_sanitized",
      "status": "pass",
      "evidence": "method step 7: any injected UI is sanitized"
    },
    {
      "section": "security",
      "check": "auto_update_via_store_only",
      "status": "pass",
      "evidence": "method step 7: auto-update is via the store only"
    },
    {
      "section": "security",
      "check": "no_eval_or_remote_scripts",
      "status": "pass",
      "evidence": "red line: no eval / remote scripts"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "permissions_without_justification": [],
  "browsers_not_covered": [],
  "summary": "37 pass, 0 fail, 0 missing of 37 checks across seven sections.",
  "stamp": "BROWSER EXTENSION ENGINEERING\nextension: Test Extension\nVERDICT: EXTENSION_DESIGN_SOUND\n  mv3_architecture                 pass\n  least_privilege_permissions      pass\n  architecture_and_messaging       pass\n  ux_honesty                       pass\n  privacy                          pass\n  distribution_and_cross_browser   pass\n  security                         pass\n37 pass, 0 fail, 0 missing of 37 checks across seven sections."
}
```

### Example 2 — violations

Recorded expectation: HTTP 200, outcome `EXTENSION_DESIGN_DEFICIENT`. Recorded REST status: 200.

Input:

```json
{
  "extension_name": "Bad Extension",
  "mv3": {
    "service_worker_background": true,
    "persistent_background_page_used": true,
    "alarms_used_instead_of_timers": true,
    "declarative_apis_used_where_possible": true,
    "remote_code_executed": true,
    "all_code_bundled": true
  },
  "permissions": {
    "only_needed_requested": true,
    "host_patterns_narrow": true,
    "optional_permissions_for_power_features": true,
    "permission_list_reviewed_as_security_audit": true,
    "overbroad_permissions_present": true,
    "requested": [
      "tabs"
    ],
    "justified": []
  },
  "architecture": {
    "content_scripts_isolated_from_page_context": true,
    "message_passing_well_defined": true,
    "messages_validated_on_both_ends": true,
    "storage_scoped_sync_vs_local": true,
    "secrets_stored_in_extension_storage": true
  },
  "ux": {
    "popup_or_options_pages_provided": true,
    "logged_out_and_unavailable_states_provided": true,
    "keyboard_shortcuts_provided": true,
    "drive_by_dom_changes_without_user_intent": true
  },
  "privacy": {
    "page_data_processed_locally_by_default": true,
    "telemetry_requires_explicit_consent": true,
    "telemetry_clearly_disclosed": true,
    "privacy_disclosure_matches_behavior_tested": true,
    "browsing_data_exfiltrated": true,
    "hidden_data_collection_present": true
  },
  "distribution": {
    "store_listing_screenshots_provided": true,
    "store_privacy_form_accurate": true,
    "staged_rollout_planned": true,
    "version_discipline_followed": true,
    "firefox_mv3_differences_addressed": true,
    "target_browsers": [
      "chrome"
    ],
    "tested_browsers": [],
    "difference_documented_browsers": []
  },
  "security": {
    "csp_discipline_followed": true,
    "injected_ui_sanitized": true,
    "auto_update_via_store_only": true,
    "eval_or_remote_scripts_used": true
  }
}
```

Response (REST `response_text`):

```json
{
  "service": "browser-extension-engineering",
  "atom_version": "0.1.0",
  "extension_name": "Bad Extension",
  "verdict": "EXTENSION_DESIGN_DEFICIENT",
  "sections": {
    "mv3_architecture": "fail",
    "least_privilege_permissions": "fail",
    "architecture_and_messaging": "fail",
    "ux_honesty": "fail",
    "privacy": "fail",
    "distribution_and_cross_browser": "fail",
    "security": "fail"
  },
  "checks": [
    {
      "section": "mv3_architecture",
      "check": "service_worker_background",
      "status": "pass",
      "evidence": "method step 1: the background is a service worker"
    },
    {
      "section": "mv3_architecture",
      "check": "no_persistent_background_page",
      "status": "fail",
      "evidence": "method step 1: no persistent background page is used"
    },
    {
      "section": "mv3_architecture",
      "check": "alarms_used_instead_of_timers",
      "status": "pass",
      "evidence": "method step 1: alarms are used instead of timers"
    },
    {
      "section": "mv3_architecture",
      "check": "declarative_apis_used_where_possible",
      "status": "pass",
      "evidence": "method step 1: declarative APIs are used where possible"
    },
    {
      "section": "mv3_architecture",
      "check": "no_remote_code_execution",
      "status": "fail",
      "evidence": "method step 1: no remote code execution \u2014 everything is bundled"
    },
    {
      "section": "mv3_architecture",
      "check": "all_code_bundled",
      "status": "pass",
      "evidence": "method step 1: all code is bundled with the extension"
    },
    {
      "section": "least_privilege_permissions",
      "check": "only_needed_permissions_requested",
      "status": "pass",
      "evidence": "method step 2: only needed permissions are requested"
    },
    {
      "section": "least_privilege_permissions",
      "check": "host_patterns_narrow",
      "status": "pass",
      "evidence": "method step 2 / quality gate: host patterns are narrow / minimal"
    },
    {
      "section": "least_privilege_permissions",
      "check": "optional_permissions_for_power_features",
      "status": "pass",
      "evidence": "method step 2: power features use optional permissions"
    },
    {
      "section": "least_privilege_permissions",
      "check": "permission_list_reviewed_as_security_audit",
      "status": "pass",
      "evidence": "method step 2: the permission list is reviewed like a security audit"
    },
    {
      "section": "least_privilege_permissions",
      "check": "no_overbroad_permissions",
      "status": "fail",
      "evidence": "red line: no overbroad permissions"
    },
    {
      "section": "least_privilege_permissions",
      "check": "all_requested_permissions_justified_in_writing",
      "status": "fail",
      "evidence": "quality gate: each permission is justified in writing \u2014 every declared requested permission appears in the declared justified-in-writing list"
    },
    {
      "section": "architecture_and_messaging",
      "check": "content_scripts_isolated_from_page_context",
      "status": "pass",
      "evidence": "method step 3: content scripts are isolated from page context"
    },
    {
      "section": "architecture_and_messaging",
      "check": "message_passing_well_defined",
      "status": "pass",
      "evidence": "method step 3: message passing is well-defined"
    },
    {
      "section": "architecture_and_messaging",
      "check": "messages_validated_on_both_ends",
      "status": "pass",
      "evidence": "method step 3 / quality gate: messages are validated on both ends"
    },
    {
      "section": "architecture_and_messaging",
      "check": "storage_scoped",
      "status": "pass",
      "evidence": "method step 3: storage is scoped \u2014 storage.sync vs local chosen deliberately"
    },
    {
      "section": "architecture_and_messaging",
      "check": "no_secrets_in_extension_storage",
      "status": "fail",
      "evidence": "method step 3: no secrets are kept in extension storage"
    },
    {
      "section": "ux_honesty",
      "check": "popup_or_options_pages_provided",
      "status": "pass",
      "evidence": "method step 4: popup / options pages are provided"
    },
    {
      "section": "ux_honesty",
      "check": "logged_out_and_unavailable_states_provided",
      "status": "pass",
      "evidence": "method step 4: states for logged-out / unavailable are provided"
    },
    {
      "section": "ux_honesty",
      "check": "keyboard_shortcuts_provided",
      "status": "pass",
      "evidence": "method step 4: keyboard shortcuts are provided"
    },
    {
      "section": "ux_honesty",
      "check": "no_drive_by_dom_changes_without_user_intent",
      "status": "fail",
      "evidence": "method step 4: no drive-by DOM changes without user intent"
    },
    {
      "section": "privacy",
      "check": "page_data_processed_locally_by_default",
      "status": "pass",
      "evidence": "method step 5: page data is processed locally by default"
    },
    {
      "section": "privacy",
      "check": "telemetry_requires_explicit_consent",
      "status": "pass",
      "evidence": "method step 5: any telemetry requires explicit consent"
    },
    {
      "section": "privacy",
      "check": "telemetry_clearly_disclosed",
      "status": "pass",
      "evidence": "method step 5: any telemetry is clearly disclosed"
    },
    {
      "section": "privacy",
      "check": "privacy_disclosure_matches_actual_behavior_tested",
      "status": "pass",
      "evidence": "quality gate: the privacy disclosure matches actual behavior, tested"
    },
    {
      "section": "privacy",
      "check": "browsing_data_never_exfiltrated",
      "status": "fail",
      "evidence": "method step 5: browsing data is never exfiltrated"
    },
    {
      "section": "privacy",
      "check": "no_hidden_data_collection",
      "status": "fail",
      "evidence": "red line: no hidden data collection"
    },
    {
      "section": "distribution_and_cross_browser",
      "check": "store_listing_screenshots_provided",
      "status": "pass",
      "evidence": "method step 6: the store listing includes screenshots"
    },
    {
      "section": "distribution_and_cross_browser",
      "check": "store_privacy_form_accurate",
      "status": "pass",
      "evidence": "method step 6: the store privacy form is accurate"
    },
    {
      "section": "distribution_and_cross_browser",
      "check": "staged_rollout_planned",
      "status": "pass",
      "evidence": "method step 6: distribution uses a staged rollout"
    },
    {
      "section": "distribution_and_cross_browser",
      "check": "version_discipline_followed",
      "status": "pass",
      "evidence": "method step 6: version discipline is followed"
    },
    {
      "section": "distribution_and_cross_browser",
      "check": "firefox_mv3_differences_addressed",
      "status": "pass",
      "evidence": "method step 6: Firefox MV3 differences are addressed (browser.* shim)"
    },
    {
      "section": "distribution_and_cross_browser",
      "check": "all_target_browsers_tested_or_differences_documented",
      "status": "fail",
      "evidence": "quality gate: the extension works across target browsers, or differences are documented \u2014 every declared target browser appears in the declared tested list or the declared difference-documented list, and at least one target browser is declared"
    },
    {
      "section": "security",
      "check": "csp_discipline_followed",
      "status": "pass",
      "evidence": "method step 7: CSP discipline is followed"
    },
    {
      "section": "security",
      "check": "injected_ui_sanitized",
      "status": "pass",
      "evidence": "method step 7: any injected UI is sanitized"
    },
    {
      "section": "security",
      "check": "auto_update_via_store_only",
      "status": "pass",
      "evidence": "method step 7: auto-update is via the store only"
    },
    {
      "section": "security",
      "check": "no_eval_or_remote_scripts",
      "status": "fail",
      "evidence": "red line: no eval / remote scripts"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "permissions_without_justification": [
    "tabs"
  ],
  "browsers_not_covered": [
    "chrome"
  ],
  "summary": "27 pass, 10 fail, 0 missing of 37 checks across seven sections.",
  "stamp": "BROWSER EXTENSION ENGINEERING\nextension: Bad Extension\nVERDICT: EXTENSION_DESIGN_DEFICIENT\n  mv3_architecture                 fail\n  least_privilege_permissions      fail\n  architecture_and_messaging       fail\n  ux_honesty                       fail\n  privacy                          fail\n  distribution_and_cross_browser   fail\n  security                         fail\n27 pass, 10 fail, 0 missing of 37 checks across seven sections."
}
```

### Example 3 — malformed

Recorded expectation: HTTP 422, no verdict (rejected as invalid input). Recorded REST status: 422.

Input:

```json
{
  "extension_name": 12345,
  "mv3": "not_an_object"
}
```

Response (REST `response_text`):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "extension_name",
  "detail": "extension_name must be a string"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes; Developers Yes; Ops Yes; Regulators: N/A — the verdict is a design-completeness audit of a declared manifest, not a privacy or security compliance certification; SERVICE.md states it is not a code review or a store review, and no regulator-facing evidence claim is made. |
| Checks named: documented / recorded | 37 / 37 (from the recorded full-pass REST `checks` array, cross-checked against SERVICE.md) |
| Verdict vocabulary complete | Yes — all 3 verdicts (`EXTENSION_DESIGN_SOUND`, `EXTENSION_DESIGN_DEFICIENT`, `INSUFFICIENT_EVIDENCE`), `computed_status` values including null, section statuses and per-check statuses |
| Input reference typed | Yes — 41 fields, each with a type from SERVICE.md's field table, grouped as SERVICE.md groups them, gates/conditionals preserved in Notes |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed from this file and compared as JSON values against `verification/work/browser-extension-engineering/evidence.json` after writing; all matched |
| Errors documented from evidence only | Yes — 422 shape verbatim from the recorded malformed case; 401/403/429 documented at the status/meaning level evidenced in USER-GUIDE.md and contract.yaml, with no invented payload |

