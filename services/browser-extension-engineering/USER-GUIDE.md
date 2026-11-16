# Browser extension engineering — user guide

## What it does

You are putting one browser extension design through a careful engineering audit — MV3 architecture, least-privilege permissions, messaging, UX honesty, privacy, distribution and security. This atom reads one declared extension design/build manifest and returns one deterministic verdict across seven sections: **EXTENSION_DESIGN_SOUND**, **EXTENSION_DESIGN_DEFICIENT**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). Computed checks: every requested permission must appear in the justified-in-writing list, and every target browser must appear in the tested list or the difference-documented list (with at least one target declared). Same manifest in → same verdict out. It audits the declared design only — it does not write extension code, inspect a real extension package, or verify that a declared value is true.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "browser-extension-engineering"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/browser-extension-engineering` — tool name `browser_extension_engineering`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/browser-extension-engineering` — body = the manifest object; same `Authorization` header.

## Input — the browser-extension-engineering manifest

| Field | Meaning |
|---|---|
| `extension_name` | extension name (string; carried into the output, not checked) |
| `mv3.service_worker_background` / `alarms_used_instead_of_timers` / `declarative_apis_used_where_possible` / `all_code_bundled` | MV3 architecture evidence |
| `mv3.persistent_background_page_used` / `remote_code_executed` | both must be `false` to pass |
| `permissions.only_needed_requested` / `host_patterns_narrow` / `optional_permissions_for_power_features` / `permission_list_reviewed_as_security_audit` | least-privilege permissions evidence |
| `permissions.overbroad_permissions_present` | must be `false` to pass |
| `permissions.requested` (list of strings), `permissions.justified` (list of strings) | computed: every requested permission must appear in the justified list; unjustified ones reported as `permissions_without_justification` (null when either list is not declared); an empty requested list passes vacuously |
| `architecture.content_scripts_isolated_from_page_context` / `message_passing_well_defined` / `messages_validated_on_both_ends` / `storage_scoped_sync_vs_local` | architecture and messaging evidence |
| `architecture.secrets_stored_in_extension_storage` | must be `false` to pass |
| `ux.popup_or_options_pages_provided` / `logged_out_and_unavailable_states_provided` / `keyboard_shortcuts_provided` | UX honesty evidence |
| `ux.drive_by_dom_changes_without_user_intent` | must be `false` to pass |
| `privacy.page_data_processed_locally_by_default` / `telemetry_requires_explicit_consent` / `telemetry_clearly_disclosed` / `privacy_disclosure_matches_behavior_tested` | privacy evidence |
| `privacy.browsing_data_exfiltrated` / `hidden_data_collection_present` | both must be `false` to pass |
| `distribution.store_listing_screenshots_provided` / `store_privacy_form_accurate` / `staged_rollout_planned` / `version_discipline_followed` / `firefox_mv3_differences_addressed` | distribution and cross-browser evidence |
| `distribution.target_browsers` / `tested_browsers` / `difference_documented_browsers` (lists of strings) | computed: every target must appear in the tested or difference-documented list, and at least one target must be declared; uncovered ones reported as `browsers_not_covered` (null when any of the three lists is not declared) |
| `security.csp_discipline_followed` / `injected_ui_sanitized` / `auto_update_via_store_only` | security evidence |
| `security.eval_or_remote_scripts_used` | must be `false` to pass |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward EXTENSION_DESIGN_DEFICIENT).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/browser-extension-engineering`:

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

Response — HTTP 200 (trimmed; the full response carries all 37 checks and a text stamp of the verdict):

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
  "computed_status": "within_stated_limits_on_declared_evidence",
  "permissions_without_justification": [],
  "browsers_not_covered": [],
  "summary": "37 pass, 0 fail, 0 missing of 37 checks across seven sections."
}
```

## Verdicts

- **EXTENSION_DESIGN_SOUND** — every check passes; the design is sound on the declared evidence.
- **EXTENSION_DESIGN_DEFICIENT** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `permissions_without_justification` (requested permissions with no written justification, in declared order, or null when either list is not declared), `browsers_not_covered` (target browsers in neither the tested nor the difference-documented list, in declared order, or null when any of the three lists is not declared) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
