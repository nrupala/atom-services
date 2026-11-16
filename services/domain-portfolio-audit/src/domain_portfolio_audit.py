#!/usr/bin/env python3
"""Domain portfolio audit — deterministic core.

Built from the bound skill `domain-portfolio-ops`: "Twenty-plus
domains is an estate: every one needs DNS hygiene, a defined
purpose, email authentication, TLS, and a renewal guard."

This atom is an AUDIT of a declared domain portfolio record: it
validates the record a caller declares against the skill's
sections — inventory, brand architecture, DNS as code, redirects,
email authentication, TLS, renewals, and the quarterly audit. It
does not perform live DNS lookups, probe TLS, contact a registrar,
or verify that a declared control actually works — it checks that
the record the skill requires is present and internally complete
and consistent on the declared evidence.

The caller submits a domain-portfolio manifest (a dict, or JSON
on the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- domains: the declared `domains` list must be non-empty, and
  every declared domain row must name a purpose, an owner, and a
  registrar;
- brand architecture: every declared brand cluster must name
  exactly one canonical domain (the skill: "one canonical domain
  per brand cluster");
- redirects: every domain declared with status "redirect" must
  name a redirect target and a 301 status code (the skill:
  "spokes 301-redirect to the hub"); following the declared
  redirect targets from domain to declared domain must produce
  no loops and no chain longer than two hops (the skill: "no
  redirect loops or chains beyond two hops");
- email authentication: every domain declared as sending email
  must declare SPF, DKIM, and DMARC (the skill: "SPF + DKIM +
  DMARC on every sending domain"), and every parked domain must
  declare spoofing blocked;
- renewals: every declared domain's renewal date must be on or
  after the caller-declared `evaluation_date` — a renewal date in
  the past against the caller's own evaluation date is a lapsed
  domain on the declared evidence. Every personal-brand domain
  must declare a registrar lock and auto-renew (the skill's red
  line: locks + auto-renew + alerts, all three; the alerts leg is
  the portfolio-level `renewals.alerts_configured` check).

Computed ratios are serialized as strings with exactly four
decimal places, produced in both implementations by the same
fixed rule — round half up to 4dp, floor(v * 10000 + 0.5) /
10000, then format with exactly four decimals; comparisons use
the unrounded values. That fixed serialization is what makes the
Python and TypeScript outputs byte-identical. Counts are reported
as integers (exact). Renewal arithmetic is computed only from
caller-declared dates: `days_until_renewal` per domain is the
declared renewal date minus the declared evaluation date, and
`domains_within_alert_window` uses only the caller-declared
`renewals.alert_window_days` — the skill states alert offsets of
60/30/7 days as an operating practice but no single warning
window, so no warning window is invented.

The skill states no other numeric threshold — no portfolio size,
no coverage percentage, no TTL value, no certificate lifetime —
so no other numeric threshold check is invented; quantities are
computed and reported, and completeness (every declared domain,
every declared cluster, every declared redirect) is the only bar,
exactly as stated above.

Verdict:
- any fail             -> DOMAIN_PORTFOLIO_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> DOMAIN_PORTFOLIO_SOUND

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import re
import sys
from datetime import date

SECTIONS = (
    "inventory_and_brand_architecture",
    "dns_and_redirects",
    "email_authentication_and_tls",
    "renewals_and_audit",
)

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "portfolio": "string",
    "evaluation_date": "string",
    "inventory": {
        "inventory_current": "boolean",
        "single_source_of_truth": "boolean",
        "version_controlled": "boolean",
        "secrets_in_inventory_present": "boolean",
    },
    "brand_architecture": {
        "redirect_map_as_code": "boolean",
        "redirect_map_reviewed_in_diffs": "boolean",
    },
    "domains": [{
        "name": "string",
        "registrar": "string",
        "renewal_date": "string",
        "status": "string",
        "purpose": "string",
        "owner": "string",
        "brand_cluster": "string",
        "is_canonical": "boolean",
        "is_personal_brand": "boolean",
        "redirect_target": "string",
        "redirect_status_code": "number",
        "sends_email": "boolean",
        "spf_declared": "boolean",
        "dkim_declared": "boolean",
        "dmarc_declared": "boolean",
        "spoofing_blocked": "boolean",
        "registrar_lock": "boolean",
        "auto_renew": "boolean",
    }],
    "dns": {
        "zones_version_controlled": "boolean",
        "ttl_policy_defined": "boolean",
        "wildcard_dns_present": "boolean",
        "wildcard_justification_documented": "boolean",
        "change_protocol_followed": "boolean",
        "silent_changes_present": "boolean",
    },
    "redirects": {
        "redirect_map_tested": "boolean",
    },
    "email_auth": {
        "dmarc_monitoring_rua_configured": "boolean",
        "dmarc_progression_toward_quarantine": "boolean",
        "tested_after_dns_changes": "boolean",
    },
    "tls": {
        "certs_auto_renew": "boolean",
        "hsts_enabled_once_stable": "boolean",
        "changes_dual_verified": "boolean",
        "cert_expiry_monitored": "boolean",
        "uptime_and_redirect_chains_monitored": "boolean",
        "wildcard_dns_and_cert_combo_without_review_present": "boolean",
    },
    "renewals": {
        "alerts_configured": "boolean",
        "alert_window_days": "number",
        "payment_method_expiry_tracked": "boolean",
        "expiry_monitors_live": "boolean",
    },
    "audit": {
        "quarterly_audit_executed": "boolean",
        "quarterly_audit_logged": "boolean",
        "dead_redirects_checked": "boolean",
        "dangling_dns_records_checked": "boolean",
        "dmarc_reports_reviewed": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise ValueError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise ValueError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise ValueError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise ValueError(f"{path} must be an object")
        _validate_fields(value, spec, path)
        return
    raise AssertionError(f"unknown manifest spec at {path}")


def _validate_fields(obj, spec, prefix):
    for field, field_spec in spec.items():
        if field not in obj:
            continue
        value = obj[field]
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(value, field_spec, path)


def _validate_manifest(manifest):
    _validate_fields(manifest, MANIFEST_SPEC, "")


def _get(manifest, *path):
    cur = manifest
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return None, False
        cur = cur[key]
    return cur, True


def _check(results, section, name, value, present, ok, evidence):
    if not present:
        status = "missing"
    else:
        status = "pass" if ok else "fail"
    results.append(
        {"section": section, "check": name, "status": status,
         "evidence": evidence}
    )


def _bool_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is True, evidence)


def _false_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is False,
           evidence)


def _gated_bool_check(results, section, name, manifest, gate_path,
                      target_path, evidence, na_evidence):
    gate, has_gate = _get(manifest, *gate_path)
    target, has_target = _get(manifest, *target_path)
    if has_gate and gate:
        _check(results, section, name, target, has_target,
               target is True, evidence)
    else:
        _check(results, section, name, gate, has_gate, True,
               na_evidence)


def _fmt4(value):
    """Fixed 4dp serialization: round half up, then 4 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 10000 + 0.5) / 10000
    return f"{rounded:.4f}"


def _row_name(entry):
    if isinstance(entry, dict) and isinstance(entry.get("name"), str):
        return entry["name"]
    return "unnamed"


def _nonempty_str(entry, field):
    return (
        isinstance(entry, dict)
        and isinstance(entry.get(field), str)
        and len(entry[field]) > 0
    )


_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _parse_date(value):
    """Strict YYYY-MM-DD parse; None when not a valid calendar date."""
    if not isinstance(value, str) or not _DATE_RE.match(value):
        return None
    try:
        return date(int(value[0:4]), int(value[5:7]), int(value[8:10]))
    except ValueError:
        return None


def evaluate(manifest):
    """Return the verdict dict for a domain-portfolio manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    domains, has_domains = _get(manifest, "domains")
    domains_is_list = has_domains and isinstance(domains, list)
    domains_count = len(domains) if domains_is_list else None
    rows = domains if domains_is_list else []

    evaluation_raw, has_evaluation = _get(manifest, "evaluation_date")
    evaluation_date = _parse_date(evaluation_raw) if has_evaluation else None

    alert_window, has_alert_window = _get(
        manifest, "renewals", "alert_window_days")
    alert_window_valid = (
        has_alert_window
        and isinstance(alert_window, (int, float))
        and not isinstance(alert_window, bool)
    )

    def _days_until(entry):
        if evaluation_date is None or not isinstance(entry, dict):
            return None
        renewal = _parse_date(entry.get("renewal_date"))
        if renewal is None:
            return None
        return (renewal - evaluation_date).days

    days_list = [_days_until(d) for d in rows] if domains_is_list else []
    computable_days = [d for d in days_list if d is not None]
    nearest_renewal_days = (
        min(computable_days) if computable_days else None
    )
    domains_lapsed = (
        [_row_name(d) for d, days in zip(rows, days_list)
         if days is not None and days < 0]
        if domains_is_list and evaluation_date is not None else None
    )
    domains_within_alert_window = (
        [_row_name(d) for d, days in zip(rows, days_list)
         if days is not None and 0 <= days <= alert_window]
        if domains_is_list and evaluation_date is not None
        and alert_window_valid else None
    )

    domains_without_purpose = (
        [_row_name(d) for d in rows if not _nonempty_str(d, "purpose")]
        if domains_is_list else None
    )
    purpose_coverage = (
        (domains_count - len(domains_without_purpose)) / domains_count
        if domains_is_list and domains_count > 0 else None
    )

    sending_rows = [
        d for d in rows
        if isinstance(d, dict) and d.get("sends_email") is True
    ]

    def _auth_complete(entry):
        return (
            entry.get("spf_declared") is True
            and entry.get("dkim_declared") is True
            and entry.get("dmarc_declared") is True
        )

    email_auth_coverage = (
        sum(1 for d in sending_rows if _auth_complete(d)) / len(sending_rows)
        if domains_is_list and len(sending_rows) > 0 else None
    )
    domains_missing_email_auth = (
        [_row_name(d) for d in sending_rows
         if all(f in d for f in
                ("spf_declared", "dkim_declared", "dmarc_declared"))
         and not _auth_complete(d)]
        if domains_is_list else None
    )

    # Redirect graph over declared domains: name -> declared target,
    # followed only while the target names a declared domain that is
    # itself declared with status "redirect".
    by_name = {}
    for d in rows:
        if isinstance(d, dict) and isinstance(d.get("name"), str):
            by_name[d["name"]] = d

    def _follow(start_name):
        """Return (hops, looped): edges followed from start_name."""
        seen = []
        current = start_name
        hops = 0
        while True:
            if current in seen:
                return hops, True
            seen.append(current)
            row = by_name.get(current)
            if not isinstance(row, dict) or row.get("status") != "redirect":
                return hops, False
            target = row.get("redirect_target")
            if not isinstance(target, str) or len(target) == 0:
                return hops, False
            hops += 1
            if target not in by_name:
                return hops, False
            current = target

    loop_domains = []
    max_chain_hops = 0
    if domains_is_list:
        for d in rows:
            if isinstance(d, dict) and d.get("status") == "redirect" \
                    and isinstance(d.get("name"), str):
                hops, looped = _follow(d["name"])
                if looped:
                    if _row_name(d) not in loop_domains:
                        loop_domains.append(_row_name(d))
                elif hops > max_chain_hops:
                    max_chain_hops = hops
    redirect_loop_domains = loop_domains if domains_is_list else None

    # ---- Section 1: inventory_and_brand_architecture (skill:
    #      inventory — one table as the single source of truth:
    #      domain, registrar, renewal date, DNS host, purpose/status,
    #      target, owner notes; no secrets in it, ever; versioned.
    #      Brand architecture — one canonical domain per brand
    #      cluster; keep the redirect map as code, review in diffs.
    #      Quality gate — inventory current; every domain has a
    #      purpose and an owner) ----
    _bool_check(results, "inventory_and_brand_architecture",
                "inventory_current", manifest,
                ("inventory", "inventory_current"),
                "inventory: the inventory is current — one table as "
                "the single source of truth for the whole portfolio")
    _bool_check(results, "inventory_and_brand_architecture",
                "inventory_single_source_of_truth", manifest,
                ("inventory", "single_source_of_truth"),
                "inventory: the inventory is the single source of "
                "truth — domain, registrar, renewal date, DNS host, "
                "purpose/status, target, owner notes")
    _bool_check(results, "inventory_and_brand_architecture",
                "inventory_version_controlled", manifest,
                ("inventory", "version_controlled"),
                "inventory: the inventory is versioned in the repo")
    _false_check(results, "inventory_and_brand_architecture",
                 "no_secrets_in_inventory", manifest,
                 ("inventory", "secrets_in_inventory_present"),
                 "inventory / red line: no credentials or registrar "
                 "secrets in the inventory, ever")
    _check(results, "inventory_and_brand_architecture",
           "domains_declared", domains, domains_is_list,
           domains_is_list and domains_count > 0,
           "inventory: the declared portfolio record names its "
           "domains — the domains list is present and non-empty")
    purpose_present = (
        domains_is_list
        and all(isinstance(d, dict) and "purpose" in d for d in rows)
    )
    _check(results, "inventory_and_brand_architecture",
           "every_domain_has_purpose", domains, purpose_present,
           domains_is_list and domains_count > 0
           and len(domains_without_purpose) == 0,
           "quality gate: every declared domain row names a "
           "purpose — a non-empty purpose string")
    owner_present = (
        domains_is_list
        and all(isinstance(d, dict) and "owner" in d for d in rows)
    )
    domains_without_owner = (
        [_row_name(d) for d in rows if not _nonempty_str(d, "owner")]
        if domains_is_list else None
    )
    _check(results, "inventory_and_brand_architecture",
           "every_domain_has_owner", domains, owner_present,
           domains_is_list and domains_count > 0
           and len(domains_without_owner) == 0,
           "quality gate: every declared domain row names an owner "
           "— a non-empty owner string")
    registrar_present = (
        domains_is_list
        and all(isinstance(d, dict) and "registrar" in d for d in rows)
    )
    domains_without_registrar = (
        [_row_name(d) for d in rows if not _nonempty_str(d, "registrar")]
        if domains_is_list else None
    )
    _check(results, "inventory_and_brand_architecture",
           "every_domain_has_registrar", domains, registrar_present,
           domains_is_list and domains_count > 0
           and len(domains_without_registrar) == 0,
           "inventory: every declared domain row names its "
           "registrar — a non-empty registrar string")
    canonical_present = (
        domains_is_list
        and all(isinstance(d, dict) and "brand_cluster" in d
                and "is_canonical" in d for d in rows)
    )

    def _canonical_ok():
        if not domains_is_list or domains_count == 0:
            return False
        clusters = {}
        for d in rows:
            if not _nonempty_str(d, "brand_cluster"):
                return False
            clusters.setdefault(d["brand_cluster"], 0)
            if d.get("is_canonical") is True:
                clusters[d["brand_cluster"]] += 1
        return all(count == 1 for count in clusters.values())

    _check(results, "inventory_and_brand_architecture",
           "exactly_one_canonical_per_brand_cluster", domains,
           canonical_present, _canonical_ok(),
           "brand architecture: exactly one canonical domain per "
           "brand cluster — every declared domain names its brand "
           "cluster, and each cluster declares exactly one "
           "canonical domain")
    _bool_check(results, "inventory_and_brand_architecture",
                "redirect_map_kept_as_code", manifest,
                ("brand_architecture", "redirect_map_as_code"),
                "brand architecture: the redirect map is kept as "
                "code")
    _bool_check(results, "inventory_and_brand_architecture",
                "redirect_map_reviewed_in_diffs", manifest,
                ("brand_architecture", "redirect_map_reviewed_in_diffs"),
                "brand architecture: the redirect map is reviewed "
                "in diffs")

    # ---- Section 2: dns_and_redirects (skill: DNS as code —
    #      export zones under version control; TTL policy; no
    #      wildcards without written justification; change protocol
    #      preview → apply → verify → rollback plan; no silent DNS
    #      changes. Brand architecture — spokes 301-redirect to the
    #      hub. Red line — no redirect loops or chains beyond two
    #      hops. Quality gate — redirect map tested: status,
    #      destination, no loops) ----
    _bool_check(results, "dns_and_redirects",
                "dns_zones_version_controlled", manifest,
                ("dns", "zones_version_controlled"),
                "DNS as code: zones are exported to files under "
                "version control")
    _bool_check(results, "dns_and_redirects", "ttl_policy_defined",
                manifest, ("dns", "ttl_policy_defined"),
                "DNS as code: a TTL policy is defined — low before "
                "changes, raised after stable")
    _gated_bool_check(
        results, "dns_and_redirects",
        "wildcard_dns_justified_when_present", manifest,
        ("dns", "wildcard_dns_present"),
        ("dns", "wildcard_justification_documented"),
        "DNS as code: the declared wildcard DNS carries a written "
        "justification",
        "no wildcard DNS declared")
    _bool_check(results, "dns_and_redirects",
                "dns_change_protocol_followed", manifest,
                ("dns", "change_protocol_followed"),
                "DNS as code: the change protocol is followed — "
                "preview → apply → verify → rollback plan")
    _false_check(results, "dns_and_redirects", "no_silent_dns_changes",
                 manifest, ("dns", "silent_changes_present"),
                 "red line: no silent DNS changes")
    redirect_rows = [
        d for d in rows
        if isinstance(d, dict) and d.get("status") == "redirect"
    ]
    status_present = (
        domains_is_list
        and all(isinstance(d, dict) and "status" in d for d in rows)
    )
    target_present = (
        domains_is_list and status_present
        and all("redirect_target" in d for d in redirect_rows)
    )
    _check(results, "dns_and_redirects",
           "every_redirect_domain_declares_target", domains,
           target_present,
           domains_is_list
           and all(_nonempty_str(d, "redirect_target")
                   for d in redirect_rows),
           "brand architecture: every domain declared with status "
           "redirect names its redirect target — spokes redirect "
           "to the hub")
    code_present = (
        domains_is_list and status_present
        and all("redirect_status_code" in d for d in redirect_rows)
    )
    _check(results, "dns_and_redirects",
           "every_redirect_uses_301", domains, code_present,
           domains_is_list
           and all(d.get("redirect_status_code") == 301
                   for d in redirect_rows),
           "brand architecture: every declared redirect uses "
           "status code 301 — spokes 301-redirect to the hub")
    _check(results, "dns_and_redirects", "no_redirect_loops", domains,
           domains_is_list,
           domains_is_list and len(loop_domains) == 0,
           "red line: no redirect loops — following the declared "
           "redirect targets never revisits a domain")
    _check(results, "dns_and_redirects",
           "redirect_chains_at_most_two_hops", domains, domains_is_list,
           domains_is_list and len(loop_domains) == 0
           and max_chain_hops <= 2,
           "red line: no redirect chains beyond two hops — the "
           "longest declared redirect chain is at most two hops")
    _bool_check(results, "dns_and_redirects", "redirect_map_tested",
                manifest, ("redirects", "redirect_map_tested"),
                "quality gate: the redirect map is tested — status, "
                "destination, no loops")

    # ---- Section 3: email_authentication_and_tls (skill: email
    #      authentication — SPF + DKIM + DMARC on every sending
    #      domain; DMARC monitoring first, p=none with rua
    #      reporting, then quarantine; block spoofing on
    #      parked/brand domains; test after every DNS change. TLS
    #      & hosting — auto-renewing certs, HSTS once stable, dual
    #      verification after any change; monitor expiry, uptime,
    #      and redirect chains. Red line — no wildcard DNS +
    #      wildcard cert combo without review. Quality gate —
    #      DMARC on all sending/receiving domains) ----
    sends_present = (
        domains_is_list
        and all(isinstance(d, dict) and "sends_email" in d for d in rows)
    )
    for field, check_name, label in (
        ("spf_declared", "every_sending_domain_has_spf", "SPF"),
        ("dkim_declared", "every_sending_domain_has_dkim", "DKIM"),
        ("dmarc_declared", "every_sending_domain_has_dmarc", "DMARC"),
    ):
        auth_present = (
            domains_is_list and sends_present
            and all(field in d for d in sending_rows)
        )
        _check(results, "email_authentication_and_tls", check_name,
               domains, auth_present,
               domains_is_list
               and all(d.get(field) is True for d in sending_rows),
               f"email authentication: every domain declared as "
               f"sending email declares {label} — SPF + DKIM + "
               f"DMARC on every sending domain")
    parked_rows = [
        d for d in rows
        if isinstance(d, dict) and d.get("status") == "parked"
    ]
    spoofing_present = (
        domains_is_list and status_present
        and all("spoofing_blocked" in d for d in parked_rows)
    )
    _check(results, "email_authentication_and_tls",
           "parked_domains_block_spoofing", domains, spoofing_present,
           domains_is_list
           and all(d.get("spoofing_blocked") is True
                   for d in parked_rows),
           "email authentication: spoofing is blocked on parked "
           "domains — every domain declared with status parked "
           "declares spoofing blocked")
    _bool_check(results, "email_authentication_and_tls",
                "dmarc_monitoring_rua_configured", manifest,
                ("email_auth", "dmarc_monitoring_rua_configured"),
                "email authentication: DMARC monitoring is "
                "configured first — p=none with rua reporting")
    _bool_check(results, "email_authentication_and_tls",
                "dmarc_progression_toward_quarantine", manifest,
                ("email_auth", "dmarc_progression_toward_quarantine"),
                "email authentication: DMARC progresses from "
                "monitoring toward quarantine")
    _bool_check(results, "email_authentication_and_tls",
                "email_auth_tested_after_dns_changes", manifest,
                ("email_auth", "tested_after_dns_changes"),
                "email authentication: authentication is tested "
                "after every DNS change")
    _bool_check(results, "email_authentication_and_tls",
                "tls_certs_auto_renew", manifest,
                ("tls", "certs_auto_renew"),
                "TLS & hosting: certificates are auto-renewing")
    _bool_check(results, "email_authentication_and_tls",
                "hsts_enabled_once_stable", manifest,
                ("tls", "hsts_enabled_once_stable"),
                "TLS & hosting: HSTS is enabled once stable")
    _bool_check(results, "email_authentication_and_tls",
                "tls_changes_dual_verified", manifest,
                ("tls", "changes_dual_verified"),
                "TLS & hosting: dual verification is performed "
                "after any change")
    _bool_check(results, "email_authentication_and_tls",
                "cert_expiry_monitored", manifest,
                ("tls", "cert_expiry_monitored"),
                "TLS & hosting: certificate expiry is monitored")
    _bool_check(results, "email_authentication_and_tls",
                "uptime_and_redirect_chains_monitored", manifest,
                ("tls", "uptime_and_redirect_chains_monitored"),
                "TLS & hosting: uptime and redirect chains are "
                "monitored")
    _false_check(results, "email_authentication_and_tls",
                 "no_unreviewed_wildcard_dns_and_cert_combo", manifest,
                 ("tls",
                  "wildcard_dns_and_cert_combo_without_review_present"),
                 "red line: no wildcard DNS + wildcard cert combo "
                 "without review")

    # ---- Section 4: renewals_and_audit (skill: renewals — alerts
    #      at 60/30/7 days; auto-renew wherever possible; payment
    #      method expiry tracked; registrar lock on personal-brand
    #      names. Red line — a personal-brand domain must never
    #      lapse: locks + auto-renew + alerts, all three. Quarterly
    #      audit — dead redirects, stale pages, dangling DNS
    #      records, parked domains that deserve action, expiring
    #      certs, DMARC reports review. Quality gates — renewal +
    #      expiry monitors live; registrar locks on brand names;
    #      quarterly audit executed and logged) ----
    renewal_present = (
        domains_is_list and evaluation_date is not None
        and all(isinstance(d, dict) and "renewal_date" in d for d in rows)
    )

    def _renewal_ok():
        if not domains_is_list or domains_count == 0:
            return False
        return all(days is not None and days >= 0 for days in days_list)

    _check(results, "renewals_and_audit",
           "every_domain_renewal_not_lapsed", domains, renewal_present,
           _renewal_ok(),
           "renewals / red line: no declared domain is lapsed — "
           "every declared renewal date is a valid date on or "
           "after the declared evaluation date")
    pb_rows = [
        d for d in rows
        if isinstance(d, dict) and d.get("is_personal_brand") is True
    ]
    pb_gate_present = (
        domains_is_list
        and all(isinstance(d, dict) and "is_personal_brand" in d
                for d in rows)
    )
    pb_present = (
        domains_is_list and pb_gate_present
        and all("registrar_lock" in d and "auto_renew" in d
                for d in pb_rows)
    )
    _check(results, "renewals_and_audit",
           "personal_brand_domains_lock_and_auto_renew", domains,
           pb_present,
           domains_is_list
           and all(d.get("registrar_lock") is True
                   and d.get("auto_renew") is True for d in pb_rows),
           "red line: a personal-brand domain must never lapse — "
           "every personal-brand domain declares a registrar lock "
           "and auto-renew (the alerts leg is the portfolio-level "
           "alerts check below)")
    _bool_check(results, "renewals_and_audit", "renewal_alerts_configured",
                manifest, ("renewals", "alerts_configured"),
                "renewals: renewal alerts are configured — alerts "
                "at 60/30/7 days")
    _bool_check(results, "renewals_and_audit",
                "payment_method_expiry_tracked", manifest,
                ("renewals", "payment_method_expiry_tracked"),
                "renewals: payment method expiry is tracked")
    _bool_check(results, "renewals_and_audit", "expiry_monitors_live",
                manifest, ("renewals", "expiry_monitors_live"),
                "quality gate: renewal and expiry monitors are live")
    _bool_check(results, "renewals_and_audit",
                "quarterly_audit_executed", manifest,
                ("audit", "quarterly_audit_executed"),
                "quality gate: the quarterly audit is executed")
    _bool_check(results, "renewals_and_audit", "quarterly_audit_logged",
                manifest, ("audit", "quarterly_audit_logged"),
                "quality gate: the quarterly audit is logged")
    _bool_check(results, "renewals_and_audit",
                "dead_redirects_checked_in_audit", manifest,
                ("audit", "dead_redirects_checked"),
                "quarterly audit: dead redirects are checked")
    _bool_check(results, "renewals_and_audit",
                "dangling_dns_records_checked_in_audit", manifest,
                ("audit", "dangling_dns_records_checked"),
                "quarterly audit: dangling DNS records are checked")
    _bool_check(results, "renewals_and_audit",
                "dmarc_reports_reviewed_in_audit", manifest,
                ("audit", "dmarc_reports_reviewed"),
                "quarterly audit: DMARC reports are reviewed")

    sections = {}
    for section in SECTIONS:
        sec_results = [r for r in results if r["section"] == section]
        if any(r["status"] == "fail" for r in sec_results):
            sections[section] = "fail"
        elif any(r["status"] == "missing" for r in sec_results):
            sections[section] = "insufficient_evidence"
        else:
            sections[section] = "pass"

    if any(v == "fail" for v in sections.values()):
        verdict = "DOMAIN_PORTFOLIO_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "DOMAIN_PORTFOLIO_SOUND"

    computed_names = (
        "domains_declared",
        "every_domain_has_purpose",
        "exactly_one_canonical_per_brand_cluster",
        "no_redirect_loops",
        "redirect_chains_at_most_two_hops",
        "every_domain_renewal_not_lapsed",
    )
    computed_statuses = [
        r["status"] for r in results if r["check"] in computed_names
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "domain-portfolio-audit",
        "atom_version": "0.1.0",
        "portfolio": manifest.get("portfolio"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "domains_count": domains_count,
        "domains_without_purpose": domains_without_purpose,
        "purpose_coverage": _fmt4(purpose_coverage),
        "email_auth_coverage": _fmt4(email_auth_coverage),
        "domains_missing_email_auth": domains_missing_email_auth,
        "domains_lapsed": domains_lapsed,
        "domains_within_alert_window": domains_within_alert_window,
        "nearest_renewal_days": nearest_renewal_days,
        "redirect_loop_domains": redirect_loop_domains,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across four sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "DOMAIN PORTFOLIO AUDIT",
        f"portfolio: {verdict.get('portfolio')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<36} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: domain_portfolio_audit.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "DOMAIN_PORTFOLIO_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
