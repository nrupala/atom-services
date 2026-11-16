#!/usr/bin/env python3
"""Firewall rules audit — deterministic core.

Built from the bound skill `firewall-engineering` (v1): "default-deny,
every allowance justified, every change tested and reversible."

The caller submits ONE JSON evidence manifest describing a firewall
ruleset and its management posture. Two kinds of checks run:

- rule-level checks, computed deterministically from the declared
  `rules` list (any-any allows, overly broad port ranges, shadowed
  rules, direct exposure of sensitive services, missing explicit
  default-deny rule, undocumented allows, temporary rules without a
  ticket/expiry, port-forwards without a review); and
- posture checks, reading declared evidence fields (default policy,
  layer consistency, explicit egress, change control, logging,
  post-change testing, review cadence).

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
    "baseline",
    "least_privilege",
    "egress",
    "documentation_change",
    "assurance",
)

ANY_VALUES = {"any", "*", "0.0.0.0/0", "::/0", "internet"}
SENSITIVE_PORTS = (1433, 2375, 2376, 3306, 5432, 6379, 9200, 27017)
SENSITIVE_SERVICES = {
    "database", "db", "mysql", "postgres", "postgresql", "mssql",
    "mongodb", "redis", "elasticsearch", "admin", "admin-panel",
    "admin_panel", "admin panel", "control-plane", "control_plane",
    "control plane", "agent-control-plane", "agent control plane",
    "docker",
}
BROAD_PORT_SPAN = 1000

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
# Exception, per SERVICE.md's documented rule semantics: a rule's
# port_start/port_end are NOT type-validated — when they are not
# both integers the core deliberately treats the rule as covering
# ports 0-65535, so a wrong-typed port is evidence, not an error.
MANIFEST_SPEC = {
    "system": "string",
    "environment": "string",
    "default_policy": {"inbound": "string", "outbound": "string"},
    "rules": [{
        "id": "string",
        "direction": "string",
        "source": "string",
        "destination": "string",
        "protocol": "string",
        "action": "string",
        "owner": "string",
        "reason": "string",
        "date": "string",
        "service": "string",
        "temporary": "boolean",
        "ticket": "string",
        "expiry_date": "string",
        "port_forward": "boolean",
        "reviewed": "boolean",
    }],
    "layers_consistent": "boolean",
    "egress": {
        "explicit_allowlist": "boolean",
        "alert_on_denies": "boolean",
    },
    "change_control": {
        "changes_reviewed": "boolean",
        "old_rules_retired_on_schedule": "boolean",
    },
    "logging": {
        "denials_logged": "boolean",
        "rate_limited": "boolean",
    },
    "testing": {
        "allowed_and_disallowed_paths_verified": "boolean",
        "smoke_matrix_per_service": "boolean",
    },
    "review": {"cadence_days": "number"},
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


def _is_any(value):
    return _norm(value) in ANY_VALUES


def _nonempty_str(value):
    return isinstance(value, str) and len(value.strip()) > 0


def _rule_id(rule, index):
    if isinstance(rule, dict) and _nonempty_str(rule.get("id")):
        return rule["id"]
    return f"rule[{index}]"


def _port_range(rule):
    if not isinstance(rule, dict):
        return 0, 65535
    start, end = rule.get("port_start"), rule.get("port_end")
    if _is_int(start) and _is_int(end):
        return start, end
    return 0, 65535


def _parse_ipv4(value):
    """(network_int, prefix_len) for an IPv4 address/CIDR, else None."""
    if not isinstance(value, str):
        return None
    text = value.strip()
    if "/" in text:
        addr, _, prefix_text = text.partition("/")
        if not prefix_text.isdigit():
            return None
        prefix = int(prefix_text)
        if prefix < 0 or prefix > 32:
            return None
    else:
        addr, prefix = text, 32
    parts = addr.split(".")
    if len(parts) != 4:
        return None
    num = 0
    for part in parts:
        if not part.isdigit() or len(part) > 3:
            return None
        octet = int(part)
        if octet > 255:
            return None
        num = num * 256 + octet
    return num, prefix


def _covers_addr(earlier, later):
    if _is_any(earlier):
        return True
    if isinstance(earlier, str) and isinstance(later, str) \
            and _norm(earlier) == _norm(later):
        return True
    e = _parse_ipv4(earlier)
    l = _parse_ipv4(later)
    if e is None or l is None:
        return False
    e_num, e_prefix = e
    l_num, l_prefix = l
    if e_prefix > l_prefix:
        return False
    if e_prefix == 0:
        return True
    shift = 32 - e_prefix
    return (e_num >> shift) == (l_num >> shift)


def _covers_proto(earlier, later):
    e = _norm(earlier) if isinstance(earlier, str) else "any"
    if not e:
        e = "any"
    l = _norm(later) if isinstance(later, str) else "any"
    if not l:
        l = "any"
    return e in ("any", "all", "*") or e == l


def _rule_check(results, section, name, rules, has_rules, offenders,
                pass_evidence, fail_prefix):
    """Shared shape for the rule-level checks."""
    if not has_rules:
        _check(results, section, name, False, False, "rules not provided")
    elif not isinstance(rules, list):
        _check(results, section, name, True, False, f"rules={rules!r}")
    elif offenders:
        _check(results, section, name, True, False,
               f"{fail_prefix}: {', '.join(offenders)}")
    else:
        _check(results, section, name, True, True, pass_evidence)


def evaluate(manifest):
    """Return the verdict dict for a firewall evidence manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    rules, has_rules = _get(manifest, "rules")
    rule_list = rules if isinstance(rules, list) else []

    def _field(rule, key):
        return rule.get(key) if isinstance(rule, dict) else None

    # ---- Section 1: baseline (default deny, both directions) ----
    inbound, has_in = _get(manifest, "default_policy", "inbound")
    _check(results, "baseline", "default_deny_inbound", has_in,
           _norm(inbound) == "deny",
           "skill method 1: default deny, both directions — inbound starts closed")

    outbound, has_out = _get(manifest, "default_policy", "outbound")
    _check(results, "baseline", "default_deny_outbound", has_out,
           _norm(outbound) == "deny",
           "skill method 1: default deny, both directions — outbound starts closed")

    deny_ids = [
        _rule_id(r, i) for i, r in enumerate(rule_list)
        if _norm(_field(r, "action")) == "deny"
        and _is_any(_field(r, "source"))
        and _is_any(_field(r, "destination"))
    ]
    if not has_rules:
        _check(results, "baseline", "explicit_default_deny_rule_present",
               False, False, "rules not provided")
    elif not isinstance(rules, list):
        _check(results, "baseline", "explicit_default_deny_rule_present",
               True, False, f"rules={rules!r}")
    elif deny_ids:
        _check(results, "baseline", "explicit_default_deny_rule_present",
               True, True,
               f"explicit default-deny rule present: {deny_ids[0]}")
    else:
        _check(results, "baseline", "explicit_default_deny_rule_present",
               True, False,
               "no explicit deny-any rule in the declared rules "
               "(missing default-deny rule)")

    layers, has_layers = _get(manifest, "layers_consistent")
    _check(results, "baseline", "layers_consistent", has_layers,
           layers is True,
           "skill method 4: platform layers consistent, no conflicting opens")

    # ---- Section 2: least_privilege (rule-level) ----
    any_any = [
        _rule_id(r, i) for i, r in enumerate(rule_list)
        if _norm(_field(r, "action")) == "allow"
        and _is_any(_field(r, "source"))
        and _is_any(_field(r, "destination"))
    ]
    _rule_check(results, "least_privilege", "no_any_any_allow_rules",
                rules, has_rules, any_any,
                "no any-any allow rules",
                "any-any allow rules (skill: no any-any in production, ever)")

    broad = []
    for i, r in enumerate(rule_list):
        if _norm(_field(r, "action")) != "allow":
            continue
        start, end = _port_range(r)
        if end - start + 1 >= BROAD_PORT_SPAN:
            broad.append(f"{_rule_id(r, i)} ports {start}-{end}")
    _rule_check(results, "least_privilege", "no_overly_broad_port_ranges",
                rules, has_rules, broad,
                "no allow rule spans 1000 or more ports",
                "overly broad port ranges (least-privilege: scope by port)")

    shadowed = []
    for j, later in enumerate(rule_list):
        for i in range(j):
            earlier = rule_list[i]
            if _norm(_field(earlier, "direction")) != \
                    _norm(_field(later, "direction")):
                continue
            if not _covers_addr(_field(earlier, "source"),
                                _field(later, "source")):
                continue
            if not _covers_addr(_field(earlier, "destination"),
                                _field(later, "destination")):
                continue
            e_start, e_end = _port_range(earlier)
            l_start, l_end = _port_range(later)
            if not (e_start <= l_start and e_end >= l_end):
                continue
            if not _covers_proto(_field(earlier, "protocol"),
                                 _field(later, "protocol")):
                continue
            shadowed.append(
                f"{_rule_id(later, j)} shadowed by {_rule_id(earlier, i)}")
            break
    _rule_check(results, "least_privilege", "no_shadowed_rules",
                rules, has_rules, shadowed,
                "no shadowed rules",
                "shadowed rules")

    sensitive = []
    for i, r in enumerate(rule_list):
        if _norm(_field(r, "action")) != "allow":
            continue
        if _norm(_field(r, "direction")) != "inbound":
            continue
        if not _is_any(_field(r, "source")):
            continue
        start, end = _port_range(r)
        port_hit = any(start <= p <= end for p in SENSITIVE_PORTS)
        if port_hit or _norm(_field(r, "service")) in SENSITIVE_SERVICES:
            sensitive.append(_rule_id(r, i))
    _rule_check(results, "least_privilege", "no_direct_sensitive_exposure",
                rules, has_rules, sensitive,
                "no direct exposure of databases, admin panels, "
                "or agent control planes",
                "directly exposed sensitive rules (skill red line: no "
                "direct exposure of databases, admin panels, or agent "
                "control planes)")

    unreviewed_forwards = [
        _rule_id(r, i) for i, r in enumerate(rule_list)
        if _field(r, "port_forward") is True
        and _field(r, "reviewed") is not True
    ]
    _rule_check(results, "least_privilege",
                "no_port_forwards_without_review",
                rules, has_rules, unreviewed_forwards,
                "no port-forward without a review (port-forwards are "
                "inventory items with reviews)",
                "port-forwards without review")

    # ---- Section 3: egress (explicit outbound allowlist) ----
    allowlist, has_allowlist = _get(manifest, "egress", "explicit_allowlist")
    _check(results, "egress", "explicit_egress_allowlist", has_allowlist,
           allowlist is True,
           "skill method 3: explicit egress — outbound allowlists for "
           "the services actually called")

    alert, has_alert = _get(manifest, "egress", "alert_on_denies")
    _check(results, "egress", "egress_alert_on_denies", has_alert,
           alert is True,
           "skill method 3: alert on denies to spot misconfig and compromise")

    # ---- Section 4: documentation_change ----
    undocumented = [
        _rule_id(r, i) for i, r in enumerate(rule_list)
        if _norm(_field(r, "action")) == "allow"
        and not (_nonempty_str(_field(r, "owner"))
                 and _nonempty_str(_field(r, "reason"))
                 and _nonempty_str(_field(r, "date")))
    ]
    _rule_check(results, "documentation_change",
                "every_allow_rule_documented",
                rules, has_rules, undocumented,
                "every allow entry has reason + owner + date "
                "(quality gate: every allow entry has reason + owner comment)",
                "allow rules without owner/reason/date")

    reviewed, has_reviewed = _get(manifest, "change_control",
                                  "changes_reviewed")
    _check(results, "documentation_change", "changes_reviewed_like_code",
           has_reviewed, reviewed is True,
           "skill method 6: changes reviewed like code")

    temporary = [
        _rule_id(r, i) for i, r in enumerate(rule_list)
        if _field(r, "temporary") is True
        and not (_nonempty_str(_field(r, "ticket"))
                 and _nonempty_str(_field(r, "expiry_date")))
    ]
    _rule_check(results, "documentation_change",
                "temporary_rules_have_ticket_and_expiry",
                rules, has_rules, temporary,
                "no temporary rule without a ticket and expiry date",
                "temporary rules without ticket/expiry (skill red line: "
                "temporary means a ticket with a date)")

    retired, has_retired = _get(manifest, "change_control",
                                "old_rules_retired_on_schedule")
    _check(results, "documentation_change",
           "old_rules_retired_on_schedule", has_retired,
           retired is True,
           "skill method 6: old rules retired on a schedule")

    # ---- Section 5: assurance (log, test, review) ----
    logged, has_logged = _get(manifest, "logging", "denials_logged")
    _check(results, "assurance", "denials_logged", has_logged,
           logged is True,
           "skill method 8: denials logged")

    rate_limited, has_rl = _get(manifest, "logging", "rate_limited")
    _check(results, "assurance", "denial_logging_rate_limited", has_rl,
           rate_limited is True,
           "skill method 8: denials logged with rate-limits to avoid "
           "noise floods")

    tested, has_tested = _get(
        manifest, "testing", "allowed_and_disallowed_paths_verified")
    _check(results, "assurance", "post_change_test_allowed_and_blocked",
           has_tested, tested is True,
           "quality gate: post-change test — allowed path passes, "
           "disallowed fails")

    smoke, has_smoke = _get(manifest, "testing", "smoke_matrix_per_service")
    _check(results, "assurance", "smoke_matrix_per_service", has_smoke,
           smoke is True,
           "skill method 7: keep a smoke matrix per service")

    cadence, has_cadence = _get(manifest, "review", "cadence_days")
    cadence_ok = (
        (isinstance(cadence, (int, float))
         and not isinstance(cadence, bool))
        and 1 <= cadence <= 31
    )
    _check(results, "assurance", "review_cadence_within_31_days",
           has_cadence, cadence_ok,
           f"cadence_days={cadence!r} (skill: review top denied flows "
           f"monthly; rule review performed on schedule)")

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
        "service": "firewall-rules-audit",
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
            f"of {len(results)} checks across five sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "FIREWALL RULES AUDIT",
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
        print("usage: firewall_rules_audit.py <manifest.json>",
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
