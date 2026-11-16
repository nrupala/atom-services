#!/usr/bin/env python3
"""Network exposure audit — deterministic core.

Built from the bound skill `network-security` (v1): "shrink what's
reachable, encrypt what moves, and know exactly what's exposed."

The caller submits ONE JSON evidence manifest describing the public
exposure inventory, the network posture around it, and the DNS/email
authentication posture. Two kinds of checks run:

- inventory-level checks, computed deterministically from the declared
  `endpoints` and `domains` lists (unowned or unlisted public
  endpoints, plaintext protocol paths, encrypted endpoints without a
  valid cert, admin/DB endpoints exposed to the internet,
  unauthenticated tunnels, sending domains without SPF/DKIM/DMARC);
  and
- posture checks, reading declared evidence fields (inventory
  currency, segmentation, default-deny / loopback posture, TLS
  posture, DNS registrar/DNSSEC posture, edge protection, admin
  access path, credential hygiene, egress control, event evidence).

Every check: field(s) present and valid -> pass; present and
invalid/offending -> fail; absent -> missing.

Verdict:
- any fail             -> UNSOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> SOUND

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import sys

SECTIONS = (
    "inventory",
    "segmentation",
    "tls",
    "dns_email",
    "edge_access",
    "egress_evidence",
)

PLAINTEXT_PROTOCOLS = {"http", "ftp", "telnet", "plaintext"}
ENCRYPTED_PROTOCOLS = {
    "https", "wss", "tls", "ssl", "smtps", "imaps", "pop3s", "ldaps",
}
TUNNEL_VIAS = {
    "tunnel", "cloudflared", "ssh-tunnel", "ssh_tunnel", "ngrok",
    "tailscale-funnel", "tailscale_funnel",
}
SENSITIVE_PORTS = (1433, 2375, 2376, 3306, 3389, 5432, 6379, 9200, 27017)
SENSITIVE_SERVICES = {
    "database", "db", "mysql", "postgres", "postgresql", "mssql",
    "mongodb", "redis", "elasticsearch", "admin", "admin-panel",
    "admin_panel", "admin panel", "control-plane", "control_plane",
    "control plane",
}
SENSITIVE_ZONES = {"admin", "data"}
MODERN_TLS_VERSIONS = {"1.2", "1.3"}

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "system": "string",
    "environment": "string",
    "inventory": {
        "current": "boolean",
    },
    "endpoints": [{
        "id": "string",
        "host": "string",
        "port": "number",
        "protocol": "string",
        "public": "boolean",
        "listed": "boolean",
        "owner": "string",
        "service": "string",
        "zone": "string",
        "via": "string",
        "tls_cert_valid": "boolean",
        "auth_required": "boolean",
    }],
    "segmentation": {
        "zones_separated": "boolean",
        "admin_plane_separate": "boolean",
        "default_deny": "boolean",
        "loopback_by_default": "boolean",
    },
    "tls": {
        "cert_expiry_monitored": "boolean",
        "hsts_on_web": "boolean",
        "min_version": "string",
    },
    "dns": {
        "registrar_lock": "boolean",
        "registrar_2fa": "boolean",
        "dnssec_enabled": "boolean",
    },
    "domains": [{
        "name": "string",
        "sending": "boolean",
        "spf": "boolean",
        "dkim": "boolean",
        "dmarc": "boolean",
    }],
    "email": {
        "dmarc_reports_monitored": "boolean",
    },
    "edge": {
        "waf_or_cdn_in_front_of_web": "boolean",
        "rate_limits_enabled": "boolean",
    },
    "access": {
        "admin_authenticated_path_only": "boolean",
        "no_default_credentials": "boolean",
    },
    "egress": {
        "outbound_allowlist": "boolean",
        "unexpected_egress_logged": "boolean",
    },
    "evidence": {
        "events_logged_denied_and_accepted": "boolean",
        "reviewed_on_change_and_incident": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "string":
        if not isinstance(value, str):
            raise ValueError(f"{path} must be a string")
    elif spec == "boolean":
        if not isinstance(value, bool):
            raise ValueError(f"{path} must be a boolean")
    elif spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{path} must be a number")
    elif isinstance(spec, list):
        if not isinstance(value, list):
            raise ValueError(f"{path} must be a list")
        for i, item in enumerate(value):
            _validate_value(item, spec[0], f"{path}[{i}]")
    elif isinstance(spec, dict):
        if not isinstance(value, dict):
            raise ValueError(f"{path} must be an object")
        _validate_fields(value, spec, path)


def _validate_fields(obj, spec, prefix):
    for field, fspec in spec.items():
        if field not in obj:
            continue
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(obj[field], fspec, path)


def _validate_manifest(manifest):
    _validate_fields(manifest, MANIFEST_SPEC, "")


def _get(manifest, *path):
    cur = manifest
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return None, False
        cur = cur[key]
    return cur, True


def _check(results, section, name, present, ok, evidence):
    if not present:
        status = "missing"
    else:
        status = "pass" if ok else "fail"
    results.append(
        {"section": section, "check": name, "status": status,
         "evidence": evidence}
    )


def _is_int(value):
    return isinstance(value, int) and not isinstance(value, bool)


def _norm(value):
    return value.strip().lower() if isinstance(value, str) else ""


def _nonempty_str(value):
    return isinstance(value, str) and len(value.strip()) > 0


def _endpoint_id(endpoint, index):
    if isinstance(endpoint, dict) and _nonempty_str(endpoint.get("id")):
        return endpoint["id"]
    return f"endpoint[{index}]"


def _domain_id(domain, index):
    if isinstance(domain, dict) and _nonempty_str(domain.get("name")):
        return domain["name"]
    return f"domain[{index}]"


def _list_check(results, section, name, values, has_values, offenders,
                pass_evidence, fail_prefix, label):
    """Shared shape for the endpoints[]/domains[] list-level checks."""
    if not has_values:
        _check(results, section, name, False, False,
               f"{label} not provided")
    elif not isinstance(values, list):
        _check(results, section, name, True, False, f"{label}={values!r}")
    elif offenders:
        _check(results, section, name, True, False,
               f"{fail_prefix}: {', '.join(offenders)}")
    else:
        _check(results, section, name, True, True, pass_evidence)


def evaluate(manifest):
    """Return the verdict dict for a network-exposure evidence manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    endpoints, has_endpoints = _get(manifest, "endpoints")
    endpoint_list = endpoints if isinstance(endpoints, list) else []
    domains, has_domains = _get(manifest, "domains")
    domain_list = domains if isinstance(domains, list) else []

    def _field(item, key):
        return item.get(key) if isinstance(item, dict) else None

    def _is_public(item):
        return _field(item, "public") is True

    # ---- Section 1: inventory (exposure inventory) ----
    current, has_current = _get(manifest, "inventory", "current")
    _check(results, "inventory", "exposure_inventory_current", has_current,
           current is True,
           "skill method 1: exposure inventory maintained — the list of "
           "public endpoints and what serves each")

    unowned = [
        _endpoint_id(e, i) for i, e in enumerate(endpoint_list)
        if _is_public(e) and not _nonempty_str(_field(e, "owner"))
    ]
    _list_check(results, "inventory", "every_public_endpoint_owned",
                endpoints, has_endpoints, unowned,
                "every public endpoint has an owner (quality gate: "
                "every public entry has an owner)",
                "public endpoints without an owner",
                "endpoints")

    unlisted = [
        _endpoint_id(e, i) for i, e in enumerate(endpoint_list)
        if _is_public(e) and _field(e, "listed") is not True
    ]
    _list_check(results, "inventory", "no_unlisted_public_endpoints",
                endpoints, has_endpoints, unlisted,
                "no public endpoint absent from the exposure inventory "
                "(if it's not on the list, it's not allowed public)",
                "public endpoints not on the exposure inventory",
                "endpoints")

    # ---- Section 2: segmentation (zones, admin plane, posture) ----
    zones, has_zones = _get(manifest, "segmentation", "zones_separated")
    _check(results, "segmentation", "trust_zones_separated", has_zones,
           zones is True,
           "skill method 3: segmentation — services separated into "
           "trust zones (public edge / app / data / admin)")

    admin_sep, has_admin_sep = _get(
        manifest, "segmentation", "admin_plane_separate")
    _check(results, "segmentation", "admin_plane_separate_from_public_path",
           has_admin_sep, admin_sep is True,
           "skill method 3: admin planes never share the public path")

    deny, has_deny = _get(manifest, "segmentation", "default_deny")
    _check(results, "segmentation", "default_deny_posture", has_deny,
           deny is True,
           "skill method 2: default-deny posture — everything closed "
           "unless a list entry justifies exposure")

    loopback, has_loopback = _get(
        manifest, "segmentation", "loopback_by_default")
    _check(results, "segmentation", "loopback_by_default", has_loopback,
           loopback is True,
           "skill method 2: everything listens on loopback unless a "
           "list entry justifies exposure")

    # ---- Section 3: tls (TLS everywhere) ----
    plaintext = [
        _endpoint_id(e, i) for i, e in enumerate(endpoint_list)
        if _norm(_field(e, "protocol")) in PLAINTEXT_PROTOCOLS
    ]
    _list_check(results, "tls", "no_plaintext_protocol_endpoints",
                endpoints, has_endpoints, plaintext,
                "no plaintext protocol paths (quality gate: no "
                "plaintext protocol paths)",
                "plaintext protocol endpoints (skill method 4: no "
                "plaintext protocols (HTTP/FTP/telnet) on any path)",
                "endpoints")

    invalid_certs = [
        _endpoint_id(e, i) for i, e in enumerate(endpoint_list)
        if _norm(_field(e, "protocol")) in ENCRYPTED_PROTOCOLS
        and _field(e, "tls_cert_valid") is not True
    ]
    _list_check(results, "tls", "encrypted_endpoints_have_valid_certs",
                endpoints, has_endpoints, invalid_certs,
                "every encrypted endpoint has a valid cert",
                "encrypted endpoints without a valid cert",
                "endpoints")

    expiry, has_expiry = _get(manifest, "tls", "cert_expiry_monitored")
    _check(results, "tls", "cert_expiry_monitored", has_expiry,
           expiry is True,
           "skill method 4: valid certs — auto-renew + monitor expiry "
           "(quality gate: cert expiry monitored)")

    hsts, has_hsts = _get(manifest, "tls", "hsts_on_web")
    _check(results, "tls", "hsts_on_web", has_hsts,
           hsts is True,
           "skill method 4: HSTS on web")

    min_version, has_min_version = _get(manifest, "tls", "min_version")
    _check(results, "tls", "modern_tls_min_version", has_min_version,
           _norm(min_version) in MODERN_TLS_VERSIONS,
           f"min_version={min_version!r} (skill method 4: modern TLS "
           f"config only — TLS 1.2 or 1.3)")

    # ---- Section 4: dns_email (DNS + email authentication) ----
    lock, has_lock = _get(manifest, "dns", "registrar_lock")
    _check(results, "dns_email", "registrar_lock_enabled", has_lock,
           lock is True,
           "skill method 5: registrar lock + 2FA")

    twofa, has_twofa = _get(manifest, "dns", "registrar_2fa")
    _check(results, "dns_email", "registrar_2fa_enabled", has_twofa,
           twofa is True,
           "skill method 5: registrar lock + 2FA")

    dnssec, has_dnssec = _get(manifest, "dns", "dnssec_enabled")
    _check(results, "dns_email", "dnssec_enabled", has_dnssec,
           dnssec is True,
           "skill method 5: DNSSEC where possible")

    unauthenticated_domains = []
    for i, d in enumerate(domain_list):
        if _field(d, "sending") is not True:
            continue
        if not (_field(d, "spf") is True
                and _field(d, "dkim") is True
                and _field(d, "dmarc") is True):
            unauthenticated_domains.append(_domain_id(d, i))
    _list_check(results, "dns_email",
                "every_sending_domain_has_spf_dkim_dmarc",
                domains, has_domains, unauthenticated_domains,
                "SPF, DKIM and DMARC present on every sending domain "
                "(quality gate: SPF/DKIM/DMARC present on sending "
                "domains)",
                "sending domains without SPF/DKIM/DMARC",
                "domains")

    dmarc_mon, has_dmarc_mon = _get(
        manifest, "email", "dmarc_reports_monitored")
    _check(results, "dns_email", "dmarc_reports_monitored", has_dmarc_mon,
           dmarc_mon is True,
           "skill method 5: monitor DMARC reports")

    # ---- Section 5: edge_access (edge protection + admin access) ----
    waf, has_waf = _get(manifest, "edge", "waf_or_cdn_in_front_of_web")
    _check(results, "edge_access", "waf_or_cdn_in_front_of_web", has_waf,
           waf is True,
           "skill method 6: CDN/WAF in front of web; don't roll "
           "your own edge")

    rate_limits, has_rl = _get(manifest, "edge", "rate_limits_enabled")
    _check(results, "edge_access", "edge_rate_limits_enabled", has_rl,
           rate_limits is True,
           "skill method 6: edge rate limits and bot rules")

    exposed_sensitive = []
    for i, e in enumerate(endpoint_list):
        if not _is_public(e):
            continue
        port = _field(e, "port")
        port_hit = _is_int(port) and port in SENSITIVE_PORTS
        if port_hit \
                or _norm(_field(e, "service")) in SENSITIVE_SERVICES \
                or _norm(_field(e, "zone")) in SENSITIVE_ZONES:
            exposed_sensitive.append(_endpoint_id(e, i))
    _list_check(results, "edge_access", "no_admin_or_db_endpoint_public",
                endpoints, has_endpoints, exposed_sensitive,
                "no admin/DB panel exposed to the internet",
                "publicly exposed admin/DB endpoints (skill red line: "
                "no admin/DB panels exposed to the internet)",
                "endpoints")

    admin_path, has_admin_path = _get(
        manifest, "access", "admin_authenticated_path_only")
    _check(results, "edge_access", "admin_access_authenticated_path_only",
           has_admin_path, admin_path is True,
           "quality gate: admin access only via authenticated path "
           "(tunnel/VPN/SSO), never open ports")

    unauthenticated_tunnels = [
        _endpoint_id(e, i) for i, e in enumerate(endpoint_list)
        if _norm(_field(e, "via")) in TUNNEL_VIAS
        and _field(e, "auth_required") is not True
    ]
    _list_check(results, "edge_access", "no_unauthenticated_tunnels",
                endpoints, has_endpoints, unauthenticated_tunnels,
                "no unauthenticated tunnels",
                "unauthenticated tunnels (skill red line: no "
                "unauthenticated tunnels)",
                "endpoints")

    defaults, has_defaults = _get(
        manifest, "access", "no_default_credentials")
    _check(results, "edge_access", "no_default_credentials", has_defaults,
           defaults is True,
           "skill red line: no default credentials anywhere")

    # ---- Section 6: egress_evidence (egress control + evidence) ----
    allowlist, has_allowlist = _get(
        manifest, "egress", "outbound_allowlist")
    _check(results, "egress_evidence", "egress_outbound_allowlist",
           has_allowlist, allowlist is True,
           "skill method 7: egress control — outbound allowlists for "
           "servers that don't need the internet")

    unexpected, has_unexpected = _get(
        manifest, "egress", "unexpected_egress_logged")
    _check(results, "egress_evidence", "unexpected_egress_logged",
           has_unexpected, unexpected is True,
           "skill method 7: log unexpected egress")

    logged, has_logged = _get(
        manifest, "evidence", "events_logged_denied_and_accepted")
    _check(results, "egress_evidence",
           "network_events_logged_denied_and_accepted",
           has_logged, logged is True,
           "skill method 8: network events logged (denied + accepted)")

    reviewed, has_reviewed = _get(
        manifest, "evidence", "reviewed_on_change_and_incident")
    _check(results, "egress_evidence",
           "evidence_reviewed_on_change_and_incident",
           has_reviewed, reviewed is True,
           "skill method 8: evidence reviewed on change and on incident")

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
        verdict = "UNSOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "SOUND"

    return {
        "service": "network-exposure-audit",
        "atom_version": "0.1.0",
        "system": manifest.get("system"),
        "environment": manifest.get("environment"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across six sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "NETWORK EXPOSURE AUDIT",
        f"system: {verdict.get('system')}  "
        f"environment: {verdict.get('environment')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<20} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: network_exposure_audit.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
