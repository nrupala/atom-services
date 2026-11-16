# Domain portfolio audit — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You operate a portfolio of domains and keep a record of it — inventory and brand architecture, DNS and redirects, email authentication and TLS, renewals and the quarterly audit. This atom reads one declared manifest and returns one deterministic verdict across four sections: **DOMAIN_PORTFOLIO_SOUND**, **DOMAIN_PORTFOLIO_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits a **declared** domain portfolio record only — it performs no live DNS lookups, probes no TLS endpoint, contacts no registrar, sends no test mail, and does not verify that a declared control actually works; a portfolio is sound *on the caller's declared evidence*. Computed checks: the declared `domains` list must be present and non-empty; every declared row must name a non-empty `purpose`, `owner` and `registrar`; each declared brand cluster must contain exactly one row with `is_canonical: true`; every `redirect` row must name a non-empty `redirect_target` with `redirect_status_code` `301`, with no redirect loops and no chain beyond two hops; every sending row must declare SPF + DKIM + DMARC, and every `parked` row must declare spoofing blocked; every `renewal_date` must be a valid date on or after the declared `evaluation_date`; and every personal-brand row must declare a registrar lock and auto-renew. The wildcard-justification check applies only when wildcard DNS is declared present. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "domain-portfolio-audit"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/domain-portfolio-audit` — tool name `domain_portfolio_audit`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/domain-portfolio-audit` — body = the manifest object; same `Authorization` header.

## Input — the domain-portfolio manifest

| Field | Meaning |
|---|---|
| `portfolio` | portfolio name (string; carried into the output, not checked) |
| `evaluation_date` (string, `YYYY-MM-DD`) | the caller-declared date all renewal arithmetic is computed against; an absent or invalid date makes the renewal checks missing evidence, never a pass or a fail |
| `inventory.inventory_current` / `single_source_of_truth` / `version_controlled` | inventory evidence: current, single source of truth, version-controlled |
| `inventory.secrets_in_inventory_present` | must be `false` to pass (red line: no secrets in the inventory) |
| `brand_architecture.redirect_map_as_code` / `redirect_map_reviewed_in_diffs` | brand-architecture evidence: redirect map kept as code and reviewed in diffs |
| `domains` (list of domain-row objects) | the declared domain rows; computed — the list passes only when present and non-empty |
| `domains[].name` (string) | names the row in the computed outputs; the key redirect targets are followed by |
| `domains[].registrar` (string) | must be a non-empty string per row; an absent field is missing evidence, an empty string fails |
| `domains[].renewal_date` (string, `YYYY-MM-DD`) | compared against `evaluation_date`; an absent field is missing evidence, an invalid date string or a date before the evaluation date fails |
| `domains[].status` (string) | the exact value `redirect` gates the redirect-target and 301 checks; the exact value `parked` gates the spoofing check; no other value is imposed |
| `domains[].purpose` (string) | must be a non-empty string per row; an absent field is missing evidence, an empty string fails |
| `domains[].owner` (string) | must be a non-empty string per row; an absent field is missing evidence, an empty string fails |
| `domains[].brand_cluster` (string) | must be a non-empty string naming the row's brand cluster |
| `domains[].is_canonical` | exactly one row per declared brand cluster must declare `true` |
| `domains[].is_personal_brand` | gates the registrar-lock + auto-renew check for that row |
| `domains[].redirect_target` (string) | required when the row's status is `redirect` — must be a non-empty string; when it names another declared domain the redirect graph follows it, otherwise the chain ends there |
| `domains[].redirect_status_code` (number) | must equal `301` for a redirect row; an absent field is missing evidence |
| `domains[].sends_email` | gates the SPF / DKIM / DMARC checks for that row |
| `domains[].spf_declared` / `dkim_declared` / `dmarc_declared` | required `true` when the row sends email; otherwise the checks pass as not applicable to that row |
| `domains[].spoofing_blocked` | required `true` when the row's status is `parked`; otherwise not applicable |
| `domains[].registrar_lock` / `auto_renew` | required `true` when the row is a personal-brand domain |
| `dns.zones_version_controlled` / `ttl_policy_defined` / `change_protocol_followed` | DNS evidence: zones version-controlled, TTL policy defined, change protocol followed |
| `dns.wildcard_dns_present` | gates the wildcard-justification check |
| `dns.wildcard_justification_documented` | required when wildcard DNS is declared present; otherwise the check passes as not applicable |
| `dns.silent_changes_present` | must be `false` to pass (red line: no silent DNS changes) |
| `redirects.redirect_map_tested` | redirect-map testing evidence |
| `email_auth.dmarc_monitoring_rua_configured` / `dmarc_progression_toward_quarantine` / `tested_after_dns_changes` | email-authentication evidence: DMARC monitoring (rua) configured, progression toward quarantine, tested after DNS changes |
| `tls.certs_auto_renew` / `hsts_enabled_once_stable` / `changes_dual_verified` / `cert_expiry_monitored` / `uptime_and_redirect_chains_monitored` | TLS evidence: auto-renewing certs, HSTS once stable, dual verification of changes, expiry monitoring, uptime and redirect-chain monitoring |
| `tls.wildcard_dns_and_cert_combo_without_review_present` | must be `false` to pass (red line: no wildcard DNS + wildcard cert combo without review) |
| `renewals.alerts_configured` / `payment_method_expiry_tracked` / `expiry_monitors_live` | renewal evidence: alerts configured, payment-method expiry tracked, expiry monitors live |
| `renewals.alert_window_days` (number) | the caller-declared alert window in days — used only for the computed `domains_within_alert_window` output, never as a pass/fail bar; an absent field makes that output null |
| `audit.quarterly_audit_executed` / `quarterly_audit_logged` / `dead_redirects_checked` / `dangling_dns_records_checked` / `dmarc_reports_reviewed` | quarterly-audit evidence |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward DOMAIN_PORTFOLIO_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/domain-portfolio-audit`:

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

Response — HTTP 200 (trimmed; the full response carries all 44 checks and a text stamp of the verdict):

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
  "summary": "44 pass, 0 fail, 0 missing of 44 checks across four sections."
}
```

## Verdicts

- **DOMAIN_PORTFOLIO_SOUND** — every check passes; the declared domain-portfolio evidence is complete and consistent with the skill's sections and red lines.
- **DOMAIN_PORTFOLIO_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `domains_count` (the declared list length as an integer, or null when no list is declared), `domains_without_purpose`, `domains_missing_email_auth`, `domains_lapsed`, `domains_within_alert_window` and `redirect_loop_domains` (row-name lists, or null when they cannot be computed), `nearest_renewal_days` (the smallest declared renewal-minus-evaluation day count, negative when the nearest domain is already lapsed, or null when no row's renewal arithmetic can be computed), the coverage ratios `purpose_coverage` and `email_auth_coverage` (strings with exactly four decimal places, or null when the denominator list is absent or empty — and, for email auth, when no domain is declared as sending) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the six primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
