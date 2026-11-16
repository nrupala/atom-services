# Domain portfolio audit — `domain-portfolio-audit`

**Deliverable type:** CHECK. This atom sells the check it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Operate a portfolio of domains — DNS hygiene, redirects, email authentication and renewals.

A caller submits the inputs the bound skill works on and receives one check back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Money & markets who need this check on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Domain portfolio audits**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the domain-portfolio manifest

The caller submits one JSON manifest: a declared domain portfolio
record for one estate. Every field below is read by the named
section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the
check fails (`DOMAIN_PORTFOLIO_NOT_SOUND`). All fields are booleans
unless noted.

| Field | Read by |
|---|---|
| `portfolio` (string; carried into the verdict output, not itself checked) | — |
| `evaluation_date` (string, `YYYY-MM-DD`; the caller-declared date all renewal arithmetic is computed against — an absent or invalid date makes the renewal checks missing evidence, never a pass or a fail) | renewals_and_audit |
| `inventory.inventory_current` | inventory_and_brand_architecture |
| `inventory.single_source_of_truth` | inventory_and_brand_architecture |
| `inventory.version_controlled` | inventory_and_brand_architecture |
| `inventory.secrets_in_inventory_present` (must be `false` to pass — skill red line) | inventory_and_brand_architecture |
| `brand_architecture.redirect_map_as_code` | inventory_and_brand_architecture |
| `brand_architecture.redirect_map_reviewed_in_diffs` | inventory_and_brand_architecture |
| `domains` (list of domain-row objects, each with the entry fields below; computed, see below) | all sections |
| `domains[].name` (string; names the row in the computed outputs and is the key redirect targets are followed by) | all sections |
| `domains[].registrar` (string; must be a non-empty string for the row to pass the computed registrar check — an absent field is missing evidence, an empty string fails) | inventory_and_brand_architecture |
| `domains[].renewal_date` (string, `YYYY-MM-DD`; compared against the declared `evaluation_date` — an absent field is missing evidence, an invalid date string or a date before the evaluation date fails) | renewals_and_audit |
| `domains[].status` (string; the exact value `redirect` gates the redirect-target and 301 checks, and the exact value `parked` gates the spoofing check — no other value is imposed, see the declined vocabulary note below) | dns_and_redirects, email_authentication_and_tls |
| `domains[].purpose` (string; must be a non-empty string for the row to pass the computed purpose check — an absent field is missing evidence, an empty string fails) | inventory_and_brand_architecture |
| `domains[].owner` (string; must be a non-empty string for the row to pass the computed owner check — an absent field is missing evidence, an empty string fails) | inventory_and_brand_architecture |
| `domains[].brand_cluster` (string; must be a non-empty string naming the row's brand cluster for the computed canonical check) | inventory_and_brand_architecture |
| `domains[].is_canonical` (exactly one row per declared brand cluster must declare `true` for the computed canonical check to pass) | inventory_and_brand_architecture |
| `domains[].is_personal_brand` (gates the registrar-lock + auto-renew check below) | renewals_and_audit |
| `domains[].redirect_target` (string; required when the row's status is `redirect` — must be a non-empty string; when it names another declared domain the redirect graph follows it, otherwise the chain ends there) | dns_and_redirects |
| `domains[].redirect_status_code` (number; must equal `301` for a redirect row to pass the computed 301 check — an absent field is missing evidence) | dns_and_redirects |
| `domains[].sends_email` (gates the SPF / DKIM / DMARC checks below) | email_authentication_and_tls |
| `domains[].spf_declared` (required when the row sends email; otherwise the check passes as not applicable to that row) | email_authentication_and_tls |
| `domains[].dkim_declared` (required when the row sends email; otherwise not applicable) | email_authentication_and_tls |
| `domains[].dmarc_declared` (required when the row sends email; otherwise not applicable) | email_authentication_and_tls |
| `domains[].spoofing_blocked` (required when the row's status is `parked`; otherwise not applicable) | email_authentication_and_tls |
| `domains[].registrar_lock` (required when the row is a personal-brand domain) | renewals_and_audit |
| `domains[].auto_renew` (required when the row is a personal-brand domain) | renewals_and_audit |
| `dns.zones_version_controlled` | dns_and_redirects |
| `dns.ttl_policy_defined` | dns_and_redirects |
| `dns.wildcard_dns_present` (gates the wildcard-justification check below) | dns_and_redirects |
| `dns.wildcard_justification_documented` (required when wildcard DNS is declared present; otherwise the check passes as not applicable) | dns_and_redirects |
| `dns.change_protocol_followed` | dns_and_redirects |
| `dns.silent_changes_present` (must be `false` to pass — skill red line) | dns_and_redirects |
| `redirects.redirect_map_tested` | dns_and_redirects |
| `email_auth.dmarc_monitoring_rua_configured` | email_authentication_and_tls |
| `email_auth.dmarc_progression_toward_quarantine` | email_authentication_and_tls |
| `email_auth.tested_after_dns_changes` | email_authentication_and_tls |
| `tls.certs_auto_renew` | email_authentication_and_tls |
| `tls.hsts_enabled_once_stable` | email_authentication_and_tls |
| `tls.changes_dual_verified` | email_authentication_and_tls |
| `tls.cert_expiry_monitored` | email_authentication_and_tls |
| `tls.uptime_and_redirect_chains_monitored` | email_authentication_and_tls |
| `tls.wildcard_dns_and_cert_combo_without_review_present` (must be `false` to pass — skill red line) | email_authentication_and_tls |
| `renewals.alerts_configured` | renewals_and_audit |
| `renewals.alert_window_days` (number; the caller-declared alert window in days — used only for the computed `domains_within_alert_window` output, never as a pass/fail bar; an absent field makes that output null, nothing else) | renewals_and_audit (computed output) |
| `renewals.payment_method_expiry_tracked` | renewals_and_audit |
| `renewals.expiry_monitors_live` | renewals_and_audit |
| `audit.quarterly_audit_executed` | renewals_and_audit |
| `audit.quarterly_audit_logged` | renewals_and_audit |
| `audit.dead_redirects_checked` | renewals_and_audit |
| `audit.dangling_dns_records_checked` | renewals_and_audit |
| `audit.dmarc_reports_reviewed` | renewals_and_audit |

Many checks are computed from the declared rows, using only the
skill's own stated rules plus the consistency of the declared
record itself — no outside threshold is imported:

- **Domains declared:** the declared `domains` list passes only
  when it is present and non-empty; an absent list is missing
  evidence, an empty list fails.
- **Purpose, owner and registrar per domain:** every declared
  domain row must name a non-empty `purpose`, `owner` and
  `registrar` string. A row with the field absent is missing
  evidence; a row naming an empty string fails.
- **Exactly one canonical per brand cluster:** every declared
  domain row must name a non-empty `brand_cluster`, and each
  declared cluster must contain exactly one row with
  `is_canonical: true` (the skill: "one canonical domain per
  brand cluster"). A row with either field absent is missing
  evidence.
- **Redirect target and 301 per redirect domain:** every row
  declared with status `redirect` must name a non-empty
  `redirect_target` and declare `redirect_status_code` equal to
  `301` (the skill: "spokes 301-redirect to the hub"). A gated
  field absent on a redirect row is missing evidence; rows with
  no redirect status pass both checks as not applicable.
- **Redirect loops and chain length:** following declared
  redirect targets from domain to declared domain (a target that
  names no declared domain, or a declared non-redirect domain,
  ends the chain) must never revisit a domain, and the longest
  chain must be at most **two hops** (the skill's red line: "no
  redirect loops or chains beyond two hops" — the one chain
  length the skill states, so it is applied as stated).
- **Email authentication per sending domain:** every row with
  `sends_email: true` must declare `spf_declared`,
  `dkim_declared` and `dmarc_declared` all `true` (the skill:
  "SPF + DKIM + DMARC on every sending domain"). A row with
  `sends_email` absent, or a sending row with an auth field
  absent, is missing evidence; portfolios with no sending rows
  pass as not applicable.
- **Spoofing blocked per parked domain:** every row declared
  with status `parked` must declare `spoofing_blocked: true`.
- **Renewals not lapsed:** every declared domain's
  `renewal_date` must be a valid `YYYY-MM-DD` date on or after
  the caller-declared `evaluation_date`. A renewal date before
  the evaluation date is a lapsed domain on the declared
  evidence; an invalid date string fails; an absent renewal
  date, or an absent/invalid evaluation date, is missing
  evidence.
- **Personal-brand protection:** every row with
  `is_personal_brand: true` must declare `registrar_lock: true`
  and `auto_renew: true` (the skill's red line: locks +
  auto-renew + alerts, all three — the alerts leg is the
  portfolio-level `renewals.alerts_configured` check).

One check group is conditional, following the skill's own
scoping — computed from the declared gate field:

- **Wildcard justification:** the skill binds its justification
  rule to wildcard DNS ("no wildcards without written
  justification"). `wildcard_justification_documented` is
  therefore required only when `dns.wildcard_dns_present` is
  declared `true`; when no wildcard DNS is declared, the check
  passes as not applicable.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the six primary computed checks above cannot be completed),
`domains_count` (the declared list length, or null when the list
is not declared — counts are reported as integers, exactly), the
row-name lists `domains_without_purpose` (null when the list is
not declared), `domains_missing_email_auth` (sending domains
whose three auth fields are all present but not all true; a
sending domain with an auth field absent is missing evidence and
does not appear), `domains_lapsed` and
`domains_within_alert_window` (null when the domains list or a
valid `evaluation_date` is not declared — and, for the window
list, when `renewals.alert_window_days` is not declared),
`nearest_renewal_days` (the smallest declared renewal-minus-
evaluation day count over rows with valid dates, negative when
the nearest domain is already lapsed; null when no row's renewal
arithmetic can be computed), `redirect_loop_domains` (the
declared redirect domains whose chains loop, in declaration
order; null when the list is not declared), and the two coverage
ratios `purpose_coverage` (domains naming a purpose ÷ declared
domains) and `email_auth_coverage` (sending domains declaring
SPF + DKIM + DMARC ÷ sending domains).
**Fixed serialization rule:** computed ratios are reported as
strings with exactly four decimal places, produced in both
implementations by the same rule — round half up to 4dp,
`floor(v * 10000 + 0.5) / 10000`, then format with exactly four
decimals; comparisons use the unrounded values. A ratio is null
when its denominator list is absent or empty (and, for email
auth coverage, when no domain is declared as sending).
`nearest_renewal_days` is an integer day count, exact. That
fixed serialization is what makes the Python and TypeScript
outputs byte-identical.

The skill states no numeric pass/fail threshold beyond the ones
applied above exactly as stated (301 redirects, two-hop chains,
exactly one canonical per cluster, renewal on/after the
evaluation date) — no portfolio size, no coverage percentage, no
TTL value, no certificate lifetime, and no single renewal-warning
window: its 60/30/7-day alerts are an operating practice, checked
only as the `renewals.alerts_configured` attestation, and the
warning window used for reporting is the caller-declared
`renewals.alert_window_days` only. Quantities are computed and
reported; the only bar on the computed rows is completeness over
the caller's own declared rows, exactly as stated above.
Declined thresholds, named: a renewal-warning window in days
(the skill names alert offsets, not one window — caller-declared
only); a minimum or maximum portfolio/domain count; a coverage
percentage below completeness; a numeric TTL value or TTL range;
a numeric certificate lifetime or expiry-warning window; a
DMARC policy vocabulary or enforcement stage beyond the
monitoring-then-quarantine progression attestation (the skill
names p=none monitoring and quarantine as stages, and the record
checks that progression is declared, not a policy string); a
domain-status vocabulary (the skill lists active / redirect /
parked / coming-soon as the inventory's statuses, but only
`redirect` and `parked` gate checks — any other declared status
is accepted as declared rather than failed against a vocabulary
the atom would have to enforce beyond the skill's gating use).

The verdict is one of `DOMAIN_PORTFOLIO_SOUND` (all 44 checks
pass), `DOMAIN_PORTFOLIO_NOT_SOUND` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across four sections: inventory_and_brand_architecture,
dns_and_redirects, email_authentication_and_tls,
renewals_and_audit.

## Honest scoping

This atom audits a **declared** domain portfolio record — it
performs no live DNS lookups, probes no TLS endpoint, contacts
no registrar, sends no test mail, and does not verify that a
declared control actually works. A portfolio is sound *on the
caller's declared evidence*: a manifest that declares DMARC on
every sending domain, tested redirect maps, and un-lapsed
renewals passes those checks even if the real DNS does none of
it. It is a completeness and consistency audit of the record the
skill requires, **not a domain operations service or a live
posture certification**: it never judges whether a domain's
purpose is the right purpose, whether a redirect target is the
right hub commercially, whether declared SPF/DKIM/DMARC records
are syntactically valid in real DNS, or whether a certificate
really auto-renews — only that the record contains what the
skill's sections and red lines demand, and that its declared
rows are internally consistent.

Named exclusions: no numeric thresholds beyond the skill's own
stated values (see the declined list above); no live
verification of any declared fact; no DNS-record content
inspection (SPF/DKIM/DMARC presence is declared per domain, the
record syntax is not read); no certificate inspection — expiry
monitoring and auto-renewal are attestations, and no per-domain
certificate expiry date is declared or computed; the skill's
quarterly-audit items that are observations of the live estate
rather than record fields — stale pages and parked domains that
deserve action — are caller declarations only: the audit checks
that the quarterly audit is declared executed and logged and
that its dead-redirect and dangling-DNS legs are declared
checked, and does not itself find stale pages or judge which
parked domains deserve action; brand-architecture judgment
(which domain *should* be canonical for a cluster) is likewise a
caller declaration — the atom checks only that exactly one
canonical is declared per cluster, never which one it ought to
be.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally** — deterministic core, Python
oracle and TypeScript port built and parity-proven locally; no
endpoint is live. Release happens one by one, by the owner's GO,
per the approved queue.
