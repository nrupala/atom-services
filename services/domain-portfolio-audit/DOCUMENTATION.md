# Domain portfolio audit — documentation

**Domain portfolio audit** · slug `domain-portfolio-audit` · deliverable type CHECK · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `portfolio` "test-portfolio"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "domain-portfolio-audit"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the domain-portfolio manifest.** You declare a record of work already done — the atom audits the record, it does not do the work (see Explanation). The recorded full-pass manifest declares the portfolio `test-portfolio` against a caller-declared `evaluation_date`: the inventory is current, the single source of truth and version-controlled, with no secrets in it, and the redirect map is kept as code and reviewed in diffs. Every declared domain names a purpose, owner, registrar and brand cluster, with exactly one canonical domain per cluster. Redirect domains name their target and use 301; following the declared targets never revisits a domain and the longest chain is at most two hops. Every sending domain declares SPF, DKIM and DMARC; parked domains declare spoofing blocked; DMARC monitoring (rua) is configured with progression toward quarantine, and authentication is tested after DNS changes. Certificates auto-renew, HSTS is enabled once stable, changes are dual-verified, and expiry, uptime and redirect chains are monitored, with no unreviewed wildcard DNS + cert combination. Every renewal date is a valid date on or after the evaluation date; personal-brand domains declare registrar lock and auto-renew; renewal alerts are configured; and the quarterly audit is declared executed and logged, including dead-redirect, dangling-DNS and DMARC-report checks. No wildcard DNS is declared, so the wildcard-justification check passes as not applicable.

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/domain-portfolio-audit` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `DOMAIN_PORTFOLIO_SOUND`: "44 pass, 0 fail, 0 missing of 44 checks across four sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `DOMAIN_PORTFOLIO_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "domain-portfolio-audit"}`.
3. Call: `POST https://atoms.pipavia.com/v1/domain-portfolio-audit` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/domain-portfolio-audit` with the `Authorization: Bearer <key>` header — the whole MCP surface on this gateway is key-gated, including `initialize` and `tools/list`.
2. Call `tools/call` with tool name `domain_portfolio_audit`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `DOMAIN_PORTFOLIO_NOT_SOUND` means at least one check has status `fail`: a field is present but false/invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 2 checks fail: `every_domain_has_registrar`, `every_domain_renewal_not_lapsed`, and the summary reads "42 pass, 2 fail, 0 missing of 44 checks across four sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (see Output format). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where a number, list, object or boolean is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "portfolio",
  "detail": "portfolio must be a string"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/domain-portfolio-audit` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/domain-portfolio-audit` — tool name `domain_portfolio_audit`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `domain_portfolio_audit` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `DOMAIN_PORTFOLIO_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below exactly as SERVICE.md groups them — by the section that reads them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `portfolio` | string | Carried into the verdict output, not itself checked |

#### Read by: renewals_and_audit

| Field | Type | Notes |
|---|---|---|
| `evaluation_date` | string | `YYYY-MM-DD`; the caller-declared date all renewal arithmetic is computed against — an absent or invalid date makes the renewal checks missing evidence, never a pass or a fail |
| `domains[].renewal_date` | string | `YYYY-MM-DD`; compared against the declared `evaluation_date` — an absent field is missing evidence, an invalid date string or a date before the evaluation date fails |
| `domains[].is_personal_brand` | boolean (gate) | gates the registrar-lock + auto-renew check below |
| `domains[].registrar_lock` | boolean | required when the row is a personal-brand domain |
| `domains[].auto_renew` | boolean | required when the row is a personal-brand domain |
| `renewals.alerts_configured` | boolean | — |
| `renewals.payment_method_expiry_tracked` | boolean | — |
| `renewals.expiry_monitors_live` | boolean | — |
| `audit.quarterly_audit_executed` | boolean | — |
| `audit.quarterly_audit_logged` | boolean | — |
| `audit.dead_redirects_checked` | boolean | — |
| `audit.dangling_dns_records_checked` | boolean | — |
| `audit.dmarc_reports_reviewed` | boolean | — |

#### Read by: inventory_and_brand_architecture

| Field | Type | Notes |
|---|---|---|
| `inventory.inventory_current` | boolean | — |
| `inventory.single_source_of_truth` | boolean | — |
| `inventory.version_controlled` | boolean | — |
| `inventory.secrets_in_inventory_present` | boolean | must be `false` to pass — skill red line |
| `brand_architecture.redirect_map_as_code` | boolean | — |
| `brand_architecture.redirect_map_reviewed_in_diffs` | boolean | — |
| `domains[].registrar` | string | Must be a non-empty string for the row to pass the computed registrar check — an absent field is missing evidence, an empty string fails |
| `domains[].purpose` | string | Must be a non-empty string for the row to pass the computed purpose check — an absent field is missing evidence, an empty string fails |
| `domains[].owner` | string | Must be a non-empty string for the row to pass the computed owner check — an absent field is missing evidence, an empty string fails |
| `domains[].brand_cluster` | string | Must be a non-empty string naming the row's brand cluster for the computed canonical check |
| `domains[].is_canonical` | boolean | exactly one row per declared brand cluster must declare `true` for the computed canonical check to pass |

#### Read by: all sections

| Field | Type | Notes |
|---|---|---|
| `domains` | list | list of domain-row objects, each with the entry fields below; computed, see below |
| `domains[].name` | string | Names the row in the computed outputs and is the key redirect targets are followed by |

#### Read by: dns_and_redirects, email_authentication_and_tls

| Field | Type | Notes |
|---|---|---|
| `domains[].status` | string | The exact value `redirect` gates the redirect-target and 301 checks, and the exact value `parked` gates the spoofing check — no other value is imposed, see the declined vocabulary note below |

#### Read by: dns_and_redirects

| Field | Type | Notes |
|---|---|---|
| `domains[].redirect_target` | string | Required when the row's status is `redirect` — must be a non-empty string; when it names another declared domain the redirect graph follows it, otherwise the chain ends there |
| `domains[].redirect_status_code` | number | Must equal `301` for a redirect row to pass the computed 301 check — an absent field is missing evidence |
| `dns.zones_version_controlled` | boolean | — |
| `dns.ttl_policy_defined` | boolean | — |
| `dns.wildcard_dns_present` | boolean (gate) | gates the wildcard-justification check below |
| `dns.wildcard_justification_documented` | boolean | required when wildcard DNS is declared present; otherwise the check passes as not applicable |
| `dns.change_protocol_followed` | boolean | — |
| `dns.silent_changes_present` | boolean | must be `false` to pass — skill red line |
| `redirects.redirect_map_tested` | boolean | — |

#### Read by: email_authentication_and_tls

| Field | Type | Notes |
|---|---|---|
| `domains[].sends_email` | boolean (gate) | gates the SPF / DKIM / DMARC checks below |
| `domains[].spf_declared` | boolean | required when the row sends email; otherwise the check passes as not applicable to that row |
| `domains[].dkim_declared` | boolean | required when the row sends email; otherwise not applicable |
| `domains[].dmarc_declared` | boolean | required when the row sends email; otherwise not applicable |
| `domains[].spoofing_blocked` | boolean | required when the row's status is `parked`; otherwise not applicable |
| `email_auth.dmarc_monitoring_rua_configured` | boolean | — |
| `email_auth.dmarc_progression_toward_quarantine` | boolean | — |
| `email_auth.tested_after_dns_changes` | boolean | — |
| `tls.certs_auto_renew` | boolean | — |
| `tls.hsts_enabled_once_stable` | boolean | — |
| `tls.changes_dual_verified` | boolean | — |
| `tls.cert_expiry_monitored` | boolean | — |
| `tls.uptime_and_redirect_chains_monitored` | boolean | — |
| `tls.wildcard_dns_and_cert_combo_without_review_present` | boolean | must be `false` to pass — skill red line |

#### Read by: renewals_and_audit (computed output)

| Field | Type | Notes |
|---|---|---|
| `renewals.alert_window_days` | number | The caller-declared alert window in days — used only for the computed `domains_within_alert_window` output, never as a pass/fail bar; an absent field makes that output null, nothing else |

### Checks

All 44 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only: a conditional (gated) check whose gate is not triggered reports `pass` with evidence stating the gate was not declared — that is the not-applicable outcome. Section and verdict aggregation are defined under Verdict vocabulary.

#### Section: inventory_and_brand_architecture

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `inventory_current` | inventory: the inventory is current — one table as the single source of truth for the whole portfolio | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `inventory_single_source_of_truth` | inventory: the inventory is the single source of truth — domain, registrar, renewal date, DNS host, purpose/status, target, owner notes | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `inventory_version_controlled` | inventory: the inventory is versioned in the repo | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_secrets_in_inventory` | inventory / red line: no credentials or registrar secrets in the inventory, ever | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `domains_declared` | inventory: the declared portfolio record names its domains — the domains list is present and non-empty | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_domain_has_purpose` | quality gate: every declared domain row names a purpose — a non-empty purpose string | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_domain_has_owner` | quality gate: every declared domain row names an owner — a non-empty owner string | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_domain_has_registrar` | inventory: every declared domain row names its registrar — a non-empty registrar string | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `exactly_one_canonical_per_brand_cluster` | brand architecture: exactly one canonical domain per brand cluster — every declared domain names its brand cluster, and each cluster declares exactly one canonical domain | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `redirect_map_kept_as_code` | brand architecture: the redirect map is kept as code | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `redirect_map_reviewed_in_diffs` | brand architecture: the redirect map is reviewed in diffs | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
#### Section: dns_and_redirects

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `dns_zones_version_controlled` | DNS as code: zones are exported to files under version control | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ttl_policy_defined` | DNS as code: a TTL policy is defined — low before changes, raised after stable | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `wildcard_dns_justified_when_present` | no wildcard DNS declared | Conditional on `dns.wildcard_dns_present`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the requirement is declared unmet (for per-row gates: a gated row declares it unmet). Missing: the gate is declared and the required field is absent (for per-row gates: absent on a gated row). |
| `dns_change_protocol_followed` | DNS as code: the change protocol is followed — preview → apply → verify → rollback plan | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_silent_dns_changes` | red line: no silent DNS changes | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `every_redirect_domain_declares_target` | brand architecture: every domain declared with status redirect names its redirect target — spokes redirect to the hub | Conditional on `per-row gate: domains[].status == `redirect``. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the requirement is declared unmet (for per-row gates: a gated row declares it unmet). Missing: the gate is declared and the required field is absent (for per-row gates: absent on a gated row). |
| `every_redirect_uses_301` | brand architecture: every declared redirect uses status code 301 — spokes 301-redirect to the hub | Conditional on `per-row gate: domains[].status == `redirect``. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the requirement is declared unmet (for per-row gates: a gated row declares it unmet). Missing: the gate is declared and the required field is absent (for per-row gates: absent on a gated row). |
| `no_redirect_loops` | red line: no redirect loops — following the declared redirect targets never revisits a domain | Conditional on `computed over the declared redirect graph`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the requirement is declared unmet (for per-row gates: a gated row declares it unmet). Missing: the gate is declared and the required field is absent (for per-row gates: absent on a gated row). |
| `redirect_chains_at_most_two_hops` | red line: no redirect chains beyond two hops — the longest declared redirect chain is at most two hops | Conditional on `computed over the declared redirect graph`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the requirement is declared unmet (for per-row gates: a gated row declares it unmet). Missing: the gate is declared and the required field is absent (for per-row gates: absent on a gated row). |
| `redirect_map_tested` | quality gate: the redirect map is tested — status, destination, no loops | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
#### Section: email_authentication_and_tls

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `every_sending_domain_has_spf` | email authentication: every domain declared as sending email declares SPF — SPF + DKIM + DMARC on every sending domain | Conditional on `per-row gate: domains[].sends_email == `true``. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the requirement is declared unmet (for per-row gates: a gated row declares it unmet). Missing: the gate is declared and the required field is absent (for per-row gates: absent on a gated row). |
| `every_sending_domain_has_dkim` | email authentication: every domain declared as sending email declares DKIM — SPF + DKIM + DMARC on every sending domain | Conditional on `per-row gate: domains[].sends_email == `true``. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the requirement is declared unmet (for per-row gates: a gated row declares it unmet). Missing: the gate is declared and the required field is absent (for per-row gates: absent on a gated row). |
| `every_sending_domain_has_dmarc` | email authentication: every domain declared as sending email declares DMARC — SPF + DKIM + DMARC on every sending domain | Conditional on `per-row gate: domains[].sends_email == `true``. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the requirement is declared unmet (for per-row gates: a gated row declares it unmet). Missing: the gate is declared and the required field is absent (for per-row gates: absent on a gated row). |
| `parked_domains_block_spoofing` | email authentication: spoofing is blocked on parked domains — every domain declared with status parked declares spoofing blocked | Conditional on `per-row gate: domains[].status == `parked``. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the requirement is declared unmet (for per-row gates: a gated row declares it unmet). Missing: the gate is declared and the required field is absent (for per-row gates: absent on a gated row). |
| `dmarc_monitoring_rua_configured` | email authentication: DMARC monitoring is configured first — p=none with rua reporting | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `dmarc_progression_toward_quarantine` | email authentication: DMARC progresses from monitoring toward quarantine | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `email_auth_tested_after_dns_changes` | email authentication: authentication is tested after every DNS change | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tls_certs_auto_renew` | TLS & hosting: certificates are auto-renewing | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `hsts_enabled_once_stable` | TLS & hosting: HSTS is enabled once stable | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tls_changes_dual_verified` | TLS & hosting: dual verification is performed after any change | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `cert_expiry_monitored` | TLS & hosting: certificate expiry is monitored | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `uptime_and_redirect_chains_monitored` | TLS & hosting: uptime and redirect chains are monitored | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_unreviewed_wildcard_dns_and_cert_combo` | red line: no wildcard DNS + wildcard cert combo without review | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
#### Section: renewals_and_audit

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `every_domain_renewal_not_lapsed` | renewals / red line: no declared domain is lapsed — every declared renewal date is a valid date on or after the declared evaluation date | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `personal_brand_domains_lock_and_auto_renew` | red line: a personal-brand domain must never lapse — every personal-brand domain declares a registrar lock and auto-renew (the alerts leg is the portfolio-level alerts check below) | Conditional on `per-row gate: domains[].is_personal_brand == `true``. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the requirement is declared unmet (for per-row gates: a gated row declares it unmet). Missing: the gate is declared and the required field is absent (for per-row gates: absent on a gated row). |
| `renewal_alerts_configured` | renewals: renewal alerts are configured — alerts at 60/30/7 days | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `payment_method_expiry_tracked` | renewals: payment method expiry is tracked | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expiry_monitors_live` | quality gate: renewal and expiry monitors are live | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `quarterly_audit_executed` | quality gate: the quarterly audit is executed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `quarterly_audit_logged` | quality gate: the quarterly audit is logged | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `dead_redirects_checked_in_audit` | quarterly audit: dead redirects are checked | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `dangling_dns_records_checked_in_audit` | quarterly audit: dangling DNS records are checked | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `dmarc_reports_reviewed_in_audit` | quarterly audit: DMARC reports are reviewed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"domain-portfolio-audit"`), `atom_version` (`"0.1.0"`), and `portfolio` (the manifest's declared title value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `domains_count` (the declared list length as an integer, or null when the list is not declared); the row-name lists `domains_without_purpose` (null when the list is not declared), `domains_missing_email_auth` (sending domains whose three auth fields are all present but not all true — a sending domain with an auth field absent is missing evidence and does not appear), `domains_lapsed` and `domains_within_alert_window` (null when the domains list or a valid `evaluation_date` is not declared — and, for the window list, when `renewals.alert_window_days` is not declared), and `redirect_loop_domains` (the declared redirect domains whose chains loop, in declaration order; null when the list is not declared); `nearest_renewal_days` (the smallest declared renewal-minus-evaluation day count over rows with valid dates, negative when the nearest domain is already lapsed; null when no row's renewal arithmetic can be computed — an integer day count, exact); the ratios `purpose_coverage` and `email_auth_coverage` (strings with exactly four decimal places; null when the denominator list is absent or empty — for email auth coverage, when no domain is declared as sending); and `computed_status` (see Verdict vocabulary). Ratios use the fixed serialization rule — round half up to 4dp, `floor(v * 10000 + 0.5) / 10000`, formatted with exactly four decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "44 pass, 0 fail, 0 missing of 44 checks across four sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared title value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `DOMAIN_PORTFOLIO_SOUND` — all 44 checks pass: the declared record is complete and consistent with the bound skill's checklist, gates and red lines.
- `DOMAIN_PORTFOLIO_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one primary computed check cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes (including gated checks passing as not applicable); `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence (for gated checks: met, or the gate was not triggered — not applicable); `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

### Errors

Error bodies are the gateway's recorded shapes (`rails/gateway/src/callpath.ts`); a failed call is not metered.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | No key, or the key does not verify. On the MCP face the body is `{"error": "missing or invalid gateway API key"}`. |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the domain_portfolio_audit scope; issue it for this atom first"}` | The key is valid but does not hold this atom's scope. Issue the key for this atom (see How-to) and retry. On the MCP face the body is `{"error": "this key does not hold the domain_portfolio_audit scope"}`. |
| 422 | `{"ok":false,"error":"invalid_input","field":"portfolio","detail":"portfolio must be a string"}` (this atom's recorded malformed run; the shape is `{"ok": false, "error": "invalid_input", "field": "<field>", "detail": "<field> must be a <type>"}`) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. Via MCP `tools/call`, the same failure surfaces as a JSON-RPC error with code `-32602` carrying the detail message. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for domain-portfolio-audit exceeded"}` (or the `10000/day` variant) | Per-key rate limit exceeded for this atom; the call is not metered. Via MCP `tools/call` it surfaces as a JSON-RPC error with code `-32029`. |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Operate a portfolio of domains — DNS hygiene, redirects, email authentication and renewals (bound from the domain-operations skill). You submit one declared record — the domain-portfolio manifest — and the atom audits that record for completeness and internal consistency against the bound skill's checklist, quality gates and red lines, returning one deterministic verdict across 4 sections (`inventory_and_brand_architecture`, `dns_and_redirects`, `email_authentication_and_tls`, `renewals_and_audit`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — list presence, per-row completeness, cross-row consistency and, where the skill states them, its own arithmetic — using only the declared record, with no outside threshold imported. *Conditional checks* bind only when their declared gate field says the situation applies; when the gate is not triggered they pass as not applicable, and their evidence text says so. Aggregation is strict: any `fail` anywhere produces `DOMAIN_PORTFOLIO_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `DOMAIN_PORTFOLIO_SOUND`. The central semantic is the absent/false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented beyond the skill's own stated values, which are applied exactly as stated: 301 redirects, redirect chains of at most two hops, exactly one canonical per brand cluster, and renewal on or after the evaluation date. Declined: a renewal-warning window in days (the skill names alert offsets, not one window — caller-declared only), a minimum or maximum portfolio or domain count, a coverage percentage below completeness, a numeric TTL value or range, a numeric certificate lifetime or expiry-warning window, a DMARC policy vocabulary or enforcement stage beyond the monitoring-then-quarantine progression attestation, and a domain-status vocabulary (the skill lists active / redirect / parked / coming-soon as inventory statuses, but only `redirect` and `parked` gate checks — any other declared status is accepted as declared).

**What it does NOT do.** The atom audits a **declared** record: a verdict of `DOMAIN_PORTFOLIO_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a manifest that declares the required acts passes those checks even if the real work did none of it. It is a completeness and consistency audit, not a certification of the underlying work. Specifically: it performs no live DNS lookups, probes no TLS endpoint, contacts no registrar, sends no test mail, and does not verify that a declared control actually works. It never judges whether a domain's purpose is the right purpose, whether a redirect target is the right hub commercially, whether declared SPF/DKIM/DMARC records are syntactically valid in real DNS, or whether a certificate really auto-renews. Renewal alerts are checked only as an attestation (`renewals.alerts_configured` — alerts at 60/30/7 days are the skill's operating practice, not a computed bar), and the reporting window behind `domains_within_alert_window` is the caller-declared `renewals.alert_window_days` only. The reporting date itself is caller-declared: all renewal arithmetic is computed against the declared `evaluation_date`, never against a live clock. No DNS-record content is inspected, no certificate is inspected (expiry monitoring and auto-renewal are attestations; no per-domain certificate expiry date is declared or computed), and brand-architecture judgment — which domain *should* be canonical — is a caller declaration; only that exactly one canonical is declared per cluster is checked. The quarterly audit's live-estate observations (stale pages, parked domains that deserve action) are caller declarations only.

**Buyer and use context.** Teams and agents working in Money & markets who need this check on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: domain portfolio audits. Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulator view: N/A — this atom audits a declared domain-portfolio operations record; its verdict is an operations-completeness judgment over caller declarations (no live DNS, registrar or certificate verification), not compliance or audit evidence, and domain operations is not a regulated-compliance domain. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `domain_portfolio_audit` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly four decimal places under the fixed rule `floor(v * 10000 + 0.5) / 10000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/domain_portfolio_audit.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_domain_portfolio_audit.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/domain-portfolio-audit` (REST) and `POST /mcp/domain-portfolio-audit` (MCP, tool `domain_portfolio_audit`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification. Key scope: `domain_portfolio_audit`. Rate limits: 60/minute, 10,000/day per key per atom (429 `rate_limit`, not metered). Error monitoring: watch 401 `unauthorized` (key problems), 403 `scope_required` (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live — release candidate, one-week RC soak to 2026-11-22; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Worked examples

Provenance: recorded 2026-11-16T03:30:37.282481+00:00 against gateway v1.1.0, external verification lane, source `verification/work/domain-portfolio-audit/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Input:

```json
{
  "portfolio": "test-portfolio",
  "evaluation_date": "2023-01-01",
  "inventory": {
    "inventory_current": true,
    "single_source_of_truth": true,
    "version_controlled": true,
    "secrets_in_inventory_present": false
  },
  "brand_architecture": {
    "redirect_map_as_code": true,
    "redirect_map_reviewed_in_diffs": true
  },
  "domains": [
    {
      "name": "example.com",
      "registrar": "registrar-a",
      "renewal_date": "2024-01-01",
      "status": "active",
      "purpose": "primary",
      "owner": "team-a",
      "brand_cluster": "cluster-1",
      "is_canonical": true,
      "is_personal_brand": false,
      "sends_email": false
    }
  ],
  "dns": {
    "zones_version_controlled": true,
    "ttl_policy_defined": true,
    "wildcard_dns_present": false,
    "change_protocol_followed": true,
    "silent_changes_present": false
  },
  "redirects": {
    "redirect_map_tested": true
  },
  "email_auth": {
    "dmarc_monitoring_rua_configured": true,
    "dmarc_progression_toward_quarantine": true,
    "tested_after_dns_changes": true
  },
  "tls": {
    "certs_auto_renew": true,
    "hsts_enabled_once_stable": true,
    "changes_dual_verified": true,
    "cert_expiry_monitored": true,
    "uptime_and_redirect_chains_monitored": true,
    "wildcard_dns_and_cert_combo_without_review_present": false
  },
  "renewals": {
    "alerts_configured": true,
    "alert_window_days": 30,
    "payment_method_expiry_tracked": true,
    "expiry_monitors_live": true
  },
  "audit": {
    "quarterly_audit_executed": true,
    "quarterly_audit_logged": true,
    "dead_redirects_checked": true,
    "dangling_dns_records_checked": true,
    "dmarc_reports_reviewed": true
  }
}
```

Response (HTTP 200):

```json
{
  "service": "domain-portfolio-audit",
  "atom_version": "0.1.0",
  "portfolio": "test-portfolio",
  "verdict": "DOMAIN_PORTFOLIO_SOUND",
  "sections": {
    "inventory_and_brand_architecture": "pass",
    "dns_and_redirects": "pass",
    "email_authentication_and_tls": "pass",
    "renewals_and_audit": "pass"
  },
  "checks": [
    {
      "section": "inventory_and_brand_architecture",
      "check": "inventory_current",
      "status": "pass",
      "evidence": "inventory: the inventory is current \u2014 one table as the single source of truth for the whole portfolio"
    },
    {
      "section": "inventory_and_brand_architecture",
      "check": "inventory_single_source_of_truth",
      "status": "pass",
      "evidence": "inventory: the inventory is the single source of truth \u2014 domain, registrar, renewal date, DNS host, purpose/status, target, owner notes"
    },
    {
      "section": "inventory_and_brand_architecture",
      "check": "inventory_version_controlled",
      "status": "pass",
      "evidence": "inventory: the inventory is versioned in the repo"
    },
    {
      "section": "inventory_and_brand_architecture",
      "check": "no_secrets_in_inventory",
      "status": "pass",
      "evidence": "inventory / red line: no credentials or registrar secrets in the inventory, ever"
    },
    {
      "section": "inventory_and_brand_architecture",
      "check": "domains_declared",
      "status": "pass",
      "evidence": "inventory: the declared portfolio record names its domains \u2014 the domains list is present and non-empty"
    },
    {
      "section": "inventory_and_brand_architecture",
      "check": "every_domain_has_purpose",
      "status": "pass",
      "evidence": "quality gate: every declared domain row names a purpose \u2014 a non-empty purpose string"
    },
    {
      "section": "inventory_and_brand_architecture",
      "check": "every_domain_has_owner",
      "status": "pass",
      "evidence": "quality gate: every declared domain row names an owner \u2014 a non-empty owner string"
    },
    {
      "section": "inventory_and_brand_architecture",
      "check": "every_domain_has_registrar",
      "status": "pass",
      "evidence": "inventory: every declared domain row names its registrar \u2014 a non-empty registrar string"
    },
    {
      "section": "inventory_and_brand_architecture",
      "check": "exactly_one_canonical_per_brand_cluster",
      "status": "pass",
      "evidence": "brand architecture: exactly one canonical domain per brand cluster \u2014 every declared domain names its brand cluster, and each cluster declares exactly one canonical domain"
    },
    {
      "section": "inventory_and_brand_architecture",
      "check": "redirect_map_kept_as_code",
      "status": "pass",
      "evidence": "brand architecture: the redirect map is kept as code"
    },
    {
      "section": "inventory_and_brand_architecture",
      "check": "redirect_map_reviewed_in_diffs",
      "status": "pass",
      "evidence": "brand architecture: the redirect map is reviewed in diffs"
    },
    {
      "section": "dns_and_redirects",
      "check": "dns_zones_version_controlled",
      "status": "pass",
      "evidence": "DNS as code: zones are exported to files under version control"
    },
    {
      "section": "dns_and_redirects",
      "check": "ttl_policy_defined",
      "status": "pass",
      "evidence": "DNS as code: a TTL policy is defined \u2014 low before changes, raised after stable"
    },
    {
      "section": "dns_and_redirects",
      "check": "wildcard_dns_justified_when_present",
      "status": "pass",
      "evidence": "no wildcard DNS declared"
    },
    {
      "section": "dns_and_redirects",
      "check": "dns_change_protocol_followed",
      "status": "pass",
      "evidence": "DNS as code: the change protocol is followed \u2014 preview \u2192 apply \u2192 verify \u2192 rollback plan"
    },
    {
      "section": "dns_and_redirects",
      "check": "no_silent_dns_changes",
      "status": "pass",
      "evidence": "red line: no silent DNS changes"
    },
    {
      "section": "dns_and_redirects",
      "check": "every_redirect_domain_declares_target",
      "status": "pass",
      "evidence": "brand architecture: every domain declared with status redirect names its redirect target \u2014 spokes redirect to the hub"
    },
    {
      "section": "dns_and_redirects",
      "check": "every_redirect_uses_301",
      "status": "pass",
      "evidence": "brand architecture: every declared redirect uses status code 301 \u2014 spokes 301-redirect to the hub"
    },
    {
      "section": "dns_and_redirects",
      "check": "no_redirect_loops",
      "status": "pass",
      "evidence": "red line: no redirect loops \u2014 following the declared redirect targets never revisits a domain"
    },
    {
      "section": "dns_and_redirects",
      "check": "redirect_chains_at_most_two_hops",
      "status": "pass",
      "evidence": "red line: no redirect chains beyond two hops \u2014 the longest declared redirect chain is at most two hops"
    },
    {
      "section": "dns_and_redirects",
      "check": "redirect_map_tested",
      "status": "pass",
      "evidence": "quality gate: the redirect map is tested \u2014 status, destination, no loops"
    },
    {
      "section": "email_authentication_and_tls",
      "check": "every_sending_domain_has_spf",
      "status": "pass",
      "evidence": "email authentication: every domain declared as sending email declares SPF \u2014 SPF + DKIM + DMARC on every sending domain"
    },
    {
      "section": "email_authentication_and_tls",
      "check": "every_sending_domain_has_dkim",
      "status": "pass",
      "evidence": "email authentication: every domain declared as sending email declares DKIM \u2014 SPF + DKIM + DMARC on every sending domain"
    },
    {
      "section": "email_authentication_and_tls",
      "check": "every_sending_domain_has_dmarc",
      "status": "pass",
      "evidence": "email authentication: every domain declared as sending email declares DMARC \u2014 SPF + DKIM + DMARC on every sending domain"
    },
    {
      "section": "email_authentication_and_tls",
      "check": "parked_domains_block_spoofing",
      "status": "pass",
      "evidence": "email authentication: spoofing is blocked on parked domains \u2014 every domain declared with status parked declares spoofing blocked"
    },
    {
      "section": "email_authentication_and_tls",
      "check": "dmarc_monitoring_rua_configured",
      "status": "pass",
      "evidence": "email authentication: DMARC monitoring is configured first \u2014 p=none with rua reporting"
    },
    {
      "section": "email_authentication_and_tls",
      "check": "dmarc_progression_toward_quarantine",
      "status": "pass",
      "evidence": "email authentication: DMARC progresses from monitoring toward quarantine"
    },
    {
      "section": "email_authentication_and_tls",
      "check": "email_auth_tested_after_dns_changes",
      "status": "pass",
      "evidence": "email authentication: authentication is tested after every DNS change"
    },
    {
      "section": "email_authentication_and_tls",
      "check": "tls_certs_auto_renew",
      "status": "pass",
      "evidence": "TLS & hosting: certificates are auto-renewing"
    },
    {
      "section": "email_authentication_and_tls",
      "check": "hsts_enabled_once_stable",
      "status": "pass",
      "evidence": "TLS & hosting: HSTS is enabled once stable"
    },
    {
      "section": "email_authentication_and_tls",
      "check": "tls_changes_dual_verified",
      "status": "pass",
      "evidence": "TLS & hosting: dual verification is performed after any change"
    },
    {
      "section": "email_authentication_and_tls",
      "check": "cert_expiry_monitored",
      "status": "pass",
      "evidence": "TLS & hosting: certificate expiry is monitored"
    },
    {
      "section": "email_authentication_and_tls",
      "check": "uptime_and_redirect_chains_monitored",
      "status": "pass",
      "evidence": "TLS & hosting: uptime and redirect chains are monitored"
    },
    {
      "section": "email_authentication_and_tls",
      "check": "no_unreviewed_wildcard_dns_and_cert_combo",
      "status": "pass",
      "evidence": "red line: no wildcard DNS + wildcard cert combo without review"
    },
    {
      "section": "renewals_and_audit",
      "check": "every_domain_renewal_not_lapsed",
      "status": "pass",
      "evidence": "renewals / red line: no declared domain is lapsed \u2014 every declared renewal date is a valid date on or after the declared evaluation date"
    },
    {
      "section": "renewals_and_audit",
      "check": "personal_brand_domains_lock_and_auto_renew",
      "status": "pass",
      "evidence": "red line: a personal-brand domain must never lapse \u2014 every personal-brand domain declares a registrar lock and auto-renew (the alerts leg is the portfolio-level alerts check below)"
    },
    {
      "section": "renewals_and_audit",
      "check": "renewal_alerts_configured",
      "status": "pass",
      "evidence": "renewals: renewal alerts are configured \u2014 alerts at 60/30/7 days"
    },
    {
      "section": "renewals_and_audit",
      "check": "payment_method_expiry_tracked",
      "status": "pass",
      "evidence": "renewals: payment method expiry is tracked"
    },
    {
      "section": "renewals_and_audit",
      "check": "expiry_monitors_live",
      "status": "pass",
      "evidence": "quality gate: renewal and expiry monitors are live"
    },
    {
      "section": "renewals_and_audit",
      "check": "quarterly_audit_executed",
      "status": "pass",
      "evidence": "quality gate: the quarterly audit is executed"
    },
    {
      "section": "renewals_and_audit",
      "check": "quarterly_audit_logged",
      "status": "pass",
      "evidence": "quality gate: the quarterly audit is logged"
    },
    {
      "section": "renewals_and_audit",
      "check": "dead_redirects_checked_in_audit",
      "status": "pass",
      "evidence": "quarterly audit: dead redirects are checked"
    },
    {
      "section": "renewals_and_audit",
      "check": "dangling_dns_records_checked_in_audit",
      "status": "pass",
      "evidence": "quarterly audit: dangling DNS records are checked"
    },
    {
      "section": "renewals_and_audit",
      "check": "dmarc_reports_reviewed_in_audit",
      "status": "pass",
      "evidence": "quarterly audit: DMARC reports are reviewed"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "domains_count": 1,
  "domains_without_purpose": [],
  "purpose_coverage": "1.0000",
  "email_auth_coverage": null,
  "domains_missing_email_auth": [],
  "domains_lapsed": [],
  "domains_within_alert_window": [],
  "nearest_renewal_days": 365,
  "redirect_loop_domains": [],
  "summary": "44 pass, 0 fail, 0 missing of 44 checks across four sections.",
  "stamp": "DOMAIN PORTFOLIO AUDIT\nportfolio: test-portfolio\nVERDICT: DOMAIN_PORTFOLIO_SOUND\n  inventory_and_brand_architecture     pass\n  dns_and_redirects                    pass\n  email_authentication_and_tls         pass\n  renewals_and_audit                   pass\n44 pass, 0 fail, 0 missing of 44 checks across four sections."
}
```

### Example 2 — Violations (case `violations`)

Input:

```json
{
  "portfolio": "bad-portfolio",
  "evaluation_date": "2023-01-01",
  "inventory": {
    "inventory_current": true,
    "single_source_of_truth": true,
    "version_controlled": true,
    "secrets_in_inventory_present": false
  },
  "brand_architecture": {
    "redirect_map_as_code": true,
    "redirect_map_reviewed_in_diffs": true
  },
  "domains": [
    {
      "name": "bad.com",
      "registrar": "",
      "renewal_date": "2022-01-01",
      "status": "active",
      "purpose": "primary",
      "owner": "team-a",
      "brand_cluster": "cluster-1",
      "is_canonical": true,
      "is_personal_brand": false,
      "sends_email": false
    }
  ],
  "dns": {
    "zones_version_controlled": true,
    "ttl_policy_defined": true,
    "wildcard_dns_present": false,
    "change_protocol_followed": true,
    "silent_changes_present": false
  },
  "redirects": {
    "redirect_map_tested": true
  },
  "email_auth": {
    "dmarc_monitoring_rua_configured": true,
    "dmarc_progression_toward_quarantine": true,
    "tested_after_dns_changes": true
  },
  "tls": {
    "certs_auto_renew": true,
    "hsts_enabled_once_stable": true,
    "changes_dual_verified": true,
    "cert_expiry_monitored": true,
    "uptime_and_redirect_chains_monitored": true,
    "wildcard_dns_and_cert_combo_without_review_present": false
  },
  "renewals": {
    "alerts_configured": true,
    "alert_window_days": 30,
    "payment_method_expiry_tracked": true,
    "expiry_monitors_live": true
  },
  "audit": {
    "quarterly_audit_executed": true,
    "quarterly_audit_logged": true,
    "dead_redirects_checked": true,
    "dangling_dns_records_checked": true,
    "dmarc_reports_reviewed": true
  }
}
```

Response (HTTP 200):

```json
{
  "service": "domain-portfolio-audit",
  "atom_version": "0.1.0",
  "portfolio": "bad-portfolio",
  "verdict": "DOMAIN_PORTFOLIO_NOT_SOUND",
  "sections": {
    "inventory_and_brand_architecture": "fail",
    "dns_and_redirects": "pass",
    "email_authentication_and_tls": "pass",
    "renewals_and_audit": "fail"
  },
  "checks": [
    {
      "section": "inventory_and_brand_architecture",
      "check": "inventory_current",
      "status": "pass",
      "evidence": "inventory: the inventory is current \u2014 one table as the single source of truth for the whole portfolio"
    },
    {
      "section": "inventory_and_brand_architecture",
      "check": "inventory_single_source_of_truth",
      "status": "pass",
      "evidence": "inventory: the inventory is the single source of truth \u2014 domain, registrar, renewal date, DNS host, purpose/status, target, owner notes"
    },
    {
      "section": "inventory_and_brand_architecture",
      "check": "inventory_version_controlled",
      "status": "pass",
      "evidence": "inventory: the inventory is versioned in the repo"
    },
    {
      "section": "inventory_and_brand_architecture",
      "check": "no_secrets_in_inventory",
      "status": "pass",
      "evidence": "inventory / red line: no credentials or registrar secrets in the inventory, ever"
    },
    {
      "section": "inventory_and_brand_architecture",
      "check": "domains_declared",
      "status": "pass",
      "evidence": "inventory: the declared portfolio record names its domains \u2014 the domains list is present and non-empty"
    },
    {
      "section": "inventory_and_brand_architecture",
      "check": "every_domain_has_purpose",
      "status": "pass",
      "evidence": "quality gate: every declared domain row names a purpose \u2014 a non-empty purpose string"
    },
    {
      "section": "inventory_and_brand_architecture",
      "check": "every_domain_has_owner",
      "status": "pass",
      "evidence": "quality gate: every declared domain row names an owner \u2014 a non-empty owner string"
    },
    {
      "section": "inventory_and_brand_architecture",
      "check": "every_domain_has_registrar",
      "status": "fail",
      "evidence": "inventory: every declared domain row names its registrar \u2014 a non-empty registrar string"
    },
    {
      "section": "inventory_and_brand_architecture",
      "check": "exactly_one_canonical_per_brand_cluster",
      "status": "pass",
      "evidence": "brand architecture: exactly one canonical domain per brand cluster \u2014 every declared domain names its brand cluster, and each cluster declares exactly one canonical domain"
    },
    {
      "section": "inventory_and_brand_architecture",
      "check": "redirect_map_kept_as_code",
      "status": "pass",
      "evidence": "brand architecture: the redirect map is kept as code"
    },
    {
      "section": "inventory_and_brand_architecture",
      "check": "redirect_map_reviewed_in_diffs",
      "status": "pass",
      "evidence": "brand architecture: the redirect map is reviewed in diffs"
    },
    {
      "section": "dns_and_redirects",
      "check": "dns_zones_version_controlled",
      "status": "pass",
      "evidence": "DNS as code: zones are exported to files under version control"
    },
    {
      "section": "dns_and_redirects",
      "check": "ttl_policy_defined",
      "status": "pass",
      "evidence": "DNS as code: a TTL policy is defined \u2014 low before changes, raised after stable"
    },
    {
      "section": "dns_and_redirects",
      "check": "wildcard_dns_justified_when_present",
      "status": "pass",
      "evidence": "no wildcard DNS declared"
    },
    {
      "section": "dns_and_redirects",
      "check": "dns_change_protocol_followed",
      "status": "pass",
      "evidence": "DNS as code: the change protocol is followed \u2014 preview \u2192 apply \u2192 verify \u2192 rollback plan"
    },
    {
      "section": "dns_and_redirects",
      "check": "no_silent_dns_changes",
      "status": "pass",
      "evidence": "red line: no silent DNS changes"
    },
    {
      "section": "dns_and_redirects",
      "check": "every_redirect_domain_declares_target",
      "status": "pass",
      "evidence": "brand architecture: every domain declared with status redirect names its redirect target \u2014 spokes redirect to the hub"
    },
    {
      "section": "dns_and_redirects",
      "check": "every_redirect_uses_301",
      "status": "pass",
      "evidence": "brand architecture: every declared redirect uses status code 301 \u2014 spokes 301-redirect to the hub"
    },
    {
      "section": "dns_and_redirects",
      "check": "no_redirect_loops",
      "status": "pass",
      "evidence": "red line: no redirect loops \u2014 following the declared redirect targets never revisits a domain"
    },
    {
      "section": "dns_and_redirects",
      "check": "redirect_chains_at_most_two_hops",
      "status": "pass",
      "evidence": "red line: no redirect chains beyond two hops \u2014 the longest declared redirect chain is at most two hops"
    },
    {
      "section": "dns_and_redirects",
      "check": "redirect_map_tested",
      "status": "pass",
      "evidence": "quality gate: the redirect map is tested \u2014 status, destination, no loops"
    },
    {
      "section": "email_authentication_and_tls",
      "check": "every_sending_domain_has_spf",
      "status": "pass",
      "evidence": "email authentication: every domain declared as sending email declares SPF \u2014 SPF + DKIM + DMARC on every sending domain"
    },
    {
      "section": "email_authentication_and_tls",
      "check": "every_sending_domain_has_dkim",
      "status": "pass",
      "evidence": "email authentication: every domain declared as sending email declares DKIM \u2014 SPF + DKIM + DMARC on every sending domain"
    },
    {
      "section": "email_authentication_and_tls",
      "check": "every_sending_domain_has_dmarc",
      "status": "pass",
      "evidence": "email authentication: every domain declared as sending email declares DMARC \u2014 SPF + DKIM + DMARC on every sending domain"
    },
    {
      "section": "email_authentication_and_tls",
      "check": "parked_domains_block_spoofing",
      "status": "pass",
      "evidence": "email authentication: spoofing is blocked on parked domains \u2014 every domain declared with status parked declares spoofing blocked"
    },
    {
      "section": "email_authentication_and_tls",
      "check": "dmarc_monitoring_rua_configured",
      "status": "pass",
      "evidence": "email authentication: DMARC monitoring is configured first \u2014 p=none with rua reporting"
    },
    {
      "section": "email_authentication_and_tls",
      "check": "dmarc_progression_toward_quarantine",
      "status": "pass",
      "evidence": "email authentication: DMARC progresses from monitoring toward quarantine"
    },
    {
      "section": "email_authentication_and_tls",
      "check": "email_auth_tested_after_dns_changes",
      "status": "pass",
      "evidence": "email authentication: authentication is tested after every DNS change"
    },
    {
      "section": "email_authentication_and_tls",
      "check": "tls_certs_auto_renew",
      "status": "pass",
      "evidence": "TLS & hosting: certificates are auto-renewing"
    },
    {
      "section": "email_authentication_and_tls",
      "check": "hsts_enabled_once_stable",
      "status": "pass",
      "evidence": "TLS & hosting: HSTS is enabled once stable"
    },
    {
      "section": "email_authentication_and_tls",
      "check": "tls_changes_dual_verified",
      "status": "pass",
      "evidence": "TLS & hosting: dual verification is performed after any change"
    },
    {
      "section": "email_authentication_and_tls",
      "check": "cert_expiry_monitored",
      "status": "pass",
      "evidence": "TLS & hosting: certificate expiry is monitored"
    },
    {
      "section": "email_authentication_and_tls",
      "check": "uptime_and_redirect_chains_monitored",
      "status": "pass",
      "evidence": "TLS & hosting: uptime and redirect chains are monitored"
    },
    {
      "section": "email_authentication_and_tls",
      "check": "no_unreviewed_wildcard_dns_and_cert_combo",
      "status": "pass",
      "evidence": "red line: no wildcard DNS + wildcard cert combo without review"
    },
    {
      "section": "renewals_and_audit",
      "check": "every_domain_renewal_not_lapsed",
      "status": "fail",
      "evidence": "renewals / red line: no declared domain is lapsed \u2014 every declared renewal date is a valid date on or after the declared evaluation date"
    },
    {
      "section": "renewals_and_audit",
      "check": "personal_brand_domains_lock_and_auto_renew",
      "status": "pass",
      "evidence": "red line: a personal-brand domain must never lapse \u2014 every personal-brand domain declares a registrar lock and auto-renew (the alerts leg is the portfolio-level alerts check below)"
    },
    {
      "section": "renewals_and_audit",
      "check": "renewal_alerts_configured",
      "status": "pass",
      "evidence": "renewals: renewal alerts are configured \u2014 alerts at 60/30/7 days"
    },
    {
      "section": "renewals_and_audit",
      "check": "payment_method_expiry_tracked",
      "status": "pass",
      "evidence": "renewals: payment method expiry is tracked"
    },
    {
      "section": "renewals_and_audit",
      "check": "expiry_monitors_live",
      "status": "pass",
      "evidence": "quality gate: renewal and expiry monitors are live"
    },
    {
      "section": "renewals_and_audit",
      "check": "quarterly_audit_executed",
      "status": "pass",
      "evidence": "quality gate: the quarterly audit is executed"
    },
    {
      "section": "renewals_and_audit",
      "check": "quarterly_audit_logged",
      "status": "pass",
      "evidence": "quality gate: the quarterly audit is logged"
    },
    {
      "section": "renewals_and_audit",
      "check": "dead_redirects_checked_in_audit",
      "status": "pass",
      "evidence": "quarterly audit: dead redirects are checked"
    },
    {
      "section": "renewals_and_audit",
      "check": "dangling_dns_records_checked_in_audit",
      "status": "pass",
      "evidence": "quarterly audit: dangling DNS records are checked"
    },
    {
      "section": "renewals_and_audit",
      "check": "dmarc_reports_reviewed_in_audit",
      "status": "pass",
      "evidence": "quarterly audit: DMARC reports are reviewed"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "domains_count": 1,
  "domains_without_purpose": [],
  "purpose_coverage": "1.0000",
  "email_auth_coverage": null,
  "domains_missing_email_auth": [],
  "domains_lapsed": [
    "bad.com"
  ],
  "domains_within_alert_window": [],
  "nearest_renewal_days": -365,
  "redirect_loop_domains": [],
  "summary": "42 pass, 2 fail, 0 missing of 44 checks across four sections.",
  "stamp": "DOMAIN PORTFOLIO AUDIT\nportfolio: bad-portfolio\nVERDICT: DOMAIN_PORTFOLIO_NOT_SOUND\n  inventory_and_brand_architecture     fail\n  dns_and_redirects                    pass\n  email_authentication_and_tls         pass\n  renewals_and_audit                   fail\n42 pass, 2 fail, 0 missing of 44 checks across four sections."
}
```

### Example 3 — Malformed (case `malformed`)

Input:

```json
{
  "portfolio": 12345
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "portfolio",
  "detail": "portfolio must be a string"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — N/A — this atom audits a declared domain-portfolio operations record; its verdict is an operations-completeness judgment over caller declarations (no live DNS, registrar or certificate verification), not compliance or audit evidence, and domain operations is not a regulated-compliance domain. |
| Checks named | 44 documented / 44 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses (not-applicable expressed as a gated `pass`) |
| Input reference typed | Yes — 52 fields, each with its type from SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/domain-portfolio-audit/evidence.json` |
