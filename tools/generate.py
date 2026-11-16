#!/usr/bin/env python3
"""Generate the atom-services registry list and per-atom service scaffolds
from the authoritative register (registry/register.yaml).

Re-run whenever the register changes:
    python3 tools/generate.py

Rules encoded here (owner's model, 2026-10-18 / 2026-11-15):
- Public atoms = Tier A + Tier B only. Tier C (personal), Tier D (held)
  and FAIL-self-use (not services) NEVER get a service unit; they appear
  in registry/PUBLIC-LIST.md only, marked non-public with reasons.
- No prices are generated, ever. Pricing UNIT only (from the register);
  prices wait on measured production cost.
- Files containing the marker "HAND-BUILT" are never overwritten, so a
  built-out atom (e.g. release-readiness-verdict) survives regeneration.
"""
import os
import re
import sys

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HOME = os.path.expanduser("~")
REGISTER = os.path.join(ROOT, "registry", "register.yaml")
PUBLIC_LIST = os.path.join(ROOT, "registry", "PUBLIC-LIST.md")
SERVICES = os.path.join(ROOT, "services")

PUBLIC_TIERS = ("A", "B")
NONPUBLIC = {
    "C": "Tier C — personal/internal only (house law, personal substrate, or product-internal procedure). Never listed, never sold.",
    "D": "Tier D — held. Regulated advice, executable/key-handling, account-acting, safety framing, or an owner gate. Returns only by the owner's word after screening.",
    "FAIL-self-use": "Failed the self-use gate (R3): nobody, including us, would call this as a service. It stays a skill, never a service.",
}

DELIVERABLE_RULES = [
    ("verdict", "VERDICT"),
    ("stamp", "STAMP"),
    ("map", "MAP"),
    ("check", "CHECK"),
    ("audit", "CHECK"),
    ("scan", "CHECK"),
    ("triage", "CHECK"),
    ("review", "REVIEW"),
    ("evaluation", "EVALUATION"),
    ("validation", "VALIDATION"),
    ("report", "REPORT"),
    ("brief", "REPORT"),
    ("analysis", "REPORT"),
    ("analytics", "REPORT"),
    ("synthesis", "REPORT"),
    ("research", "REPORT"),
]


def deliverable_type(name):
    for key, label in DELIVERABLE_RULES:
        if key in name:
            return label
    return "DELIVERABLE"


def skill_frontmatter(binding):
    """Read description/category/version from the bound skill's SKILL.md."""
    rel = (binding or {}).get("path") or ""
    path = os.path.join(HOME, rel)
    out = {}
    try:
        with open(path, encoding="utf-8") as fh:
            text = fh.read(6000)
    except OSError:
        return out
    m = re.match(r"---\n(.*?)\n---", text, re.S)
    if not m:
        return out
    for line in m.group(1).splitlines():
        for key in ("description", "category", "version"):
            if line.startswith(key + ":"):
                out[key] = line.split(":", 1)[1].strip()
    return out


def write_if_not_handbuilt(path, content):
    if os.path.exists(path):
        with open(path, encoding="utf-8") as fh:
            if "HAND-BUILT" in fh.read():
                return "skipped-handbuilt"
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(content)
    return "written"


def service_md(item, fm):
    name = item["service_name"]
    dtype = deliverable_type(name)
    title = item.get("display_name") or name.replace("-", " ").capitalize()
    desc = fm.get("description") or ""
    category = fm.get("category") or "general"
    unit_word = {
        "call": "one service call",
        "deliverable": "one delivered result",
        "query": "one query",
        "tokens-1m": "1M tokens processed",
    }.get(item.get("pricing_unit"), item.get("pricing_unit"))
    lines = [
        f"# {title} — `{name}`",
        "",
        f"**Deliverable type:** {dtype}. This atom sells the {dtype.lower()} "
        "it produces — a bounded judgment artifact — never the underlying "
        "knowledge itself.",
        "",
        "## What it delivers",
        "",
    ]
    if desc:
        lines.append(f"Bound capability (from the skill): {desc}")
        lines.append("")
    lines += [
        f"A caller submits the inputs the bound skill works on and receives "
        f"one {dtype.lower()} back, in the contract's output shape "
        f"(see `contract.yaml`). One unit of sale = {unit_word}.",
        "",
        "## Buyer",
        "",
        f"First buyer hypothesis (from register data; not yet market-tested): "
        f"teams and agents working in {category} who need this "
        f"{dtype.lower()} on demand and would rather buy it per use than "
        "build or staff the capability themselves.",
        "",
        "## Self-use (R3 — passed)",
        "",
        f"Our own workflow that calls it: **{item.get('self_use_workflow')}**. "
        "Wright is an internal caller on this atom (zero price, metered to "
        "the internal cost ledger — see `rails/billing.md`).",
        "",
        "## Pricing",
        "",
        f"Pricing unit: **{item.get('pricing_unit')}**. No price is set. "
        "Prices are set only from measured production cost per unit "
        "(register test T4 is estimable, not yet measured in production).",
        "",
        "## Status",
        "",
        f"Tier {item.get('tier')} · status: **scaffolded** — service unit "
        "generated from the register; no endpoint is live. Release happens "
        "one by one, by the owner's GO, per the approved queue.",
    ]
    doubt = item.get("doubt")
    if doubt and doubt != "-":
        lines += ["", "## Named doubt (from the register)", "", str(doubt)]
    lines.append("")
    return "\n".join(lines)


def contract_yaml(item, fm):
    b = item.get("binding") or {}
    tests = item.get("tests") or {}
    scored = {k: v for k, v in tests.items() if k.startswith("T")}
    ns = item["service_name"].replace("-", "_")
    data = {
        "service_name": item["service_name"],
        "display_name": item.get("display_name")
        or item["service_name"].replace("-", " ").capitalize(),
        "tier": item.get("tier"),
        "status": "scaffolded",
        "atom_version": "0.1.0",
        "sources": item.get("sources"),
        "binding": {
            "skill": b.get("skill"),
            "skill_path": b.get("path"),
            "skill_version": str(b.get("version")),
            "rule": "R1 — fixes land in the skill first; the atom re-deploys "
            "from the refined skill and must pass regression before its "
            "version bumps. A skill refinement marks this atom stale until "
            "re-verified.",
        },
        "deliverable_type": deliverable_type(item["service_name"]),
        "endpoints": item.get("endpoints"),
        "keys": {
            "namespace": ns,
            "prefix": f"atm_1_{ns}_",
            "issuance": "Per user, per atom. Self-serve: sign up, open "
            "this atom, issue key. Key = HMAC-SHA256(master_secret, "
            "email | atom_service | issued_at), version-prefixed; "
            "regenerated on demand after the user authenticates, never "
            "stored (record holds email, atom, issued_at, fingerprint).",
            "scope": "This atom only. A key for one atom never verifies "
            "for another.",
        },
        "rate_limit": {
            "per_key_per_minute": 60,
            "per_key_per_day": 10000,
            "status": "SPEC default — the per-key rate limit is the "
            "capacity guard for open public usage; tuned per atom at "
            "build-out from measured production cost.",
        },
        "pricing": {
            "unit": item.get("pricing_unit"),
            "rate": None,
            "rate_status": "pending",
            "protocol": "rails/billing.md — measured cost first, then "
            "three-model consensus, then prompt-rate fallback. Same rate "
            "on Conduit as everywhere; no channel markup.",
        },
        "self_use": {
            "verdict": item.get("self_use"),
            "workflow": item.get("self_use_workflow"),
        },
        "qualification_tests": scored,
        "internal_caller": "Wright — zero price, metered to the internal "
        "cost ledger (R2).",
    }
    return yaml.safe_dump(data, sort_keys=False)


def growth_md(item):
    tier = item.get("tier")
    if tier == "A":
        channel = (
            "Conduit listing (MCP/agent storefront) + the dedicated atoms "
            "endpoint for API/human callers, then the registry sweep "
            "(Official MCP Registry, Smithery, Glama) once the endpoint is "
            "live and metering is verified."
        )
    else:
        channel = (
            "Packs only: this atom does not list solo (register test T5 "
            "fails standalone — commodity/wrapper-replicable). It grows "
            "inside themed packs on Conduit once Tier A traffic exists to "
            "bundle into."
        )
    return (
        f"# Growth — {item['service_name']}\n\n"
        f"**Seed demand (proven, ours):** {item.get('self_use_workflow')}. "
        "Wright's internal call volume is this atom's first uptake evidence "
        "before any external marketing.\n\n"
        f"**Channel:** {channel}\n\n"
        "**Growth rule:** no marketing spend and no dedicated site until "
        "directory/organic uptake is measured at the 30/60/90-day gates "
        "(see the deployment plan). Refinement is the growth lever — a "
        "narrower, sharper service gets called more.\n"
    )


def retention_md(item):
    unit = item.get("pricing_unit")
    if unit == "call":
        cadence = (
            "Per-call pricing means retention = being called again. The "
            "atom retains by sitting inside a recurring workflow (a gate, a "
            "pipeline, a scheduled check), not by lock-in."
        )
    elif unit == "deliverable":
        cadence = (
            "Per-deliverable pricing retains through repeat need: the "
            "buyer's work regenerates the same deliverable need on a "
            "cadence (each release, each report cycle, each new case)."
        )
    else:
        cadence = (
            "Retention is repeat usage of the same metered unit inside "
            "the buyer's own recurring work; there is no subscription "
            "lock-in by design."
        )
    return (
        f"# Retention — {item['service_name']}\n\n"
        f"{cadence}\n\n"
        f"**Our own repeat use:** {item.get('self_use_workflow')} — the "
        "workflow recurs in our real work, which is the retention pattern "
        "external buyers are expected to mirror.\n\n"
        "**Churn signal:** trial units issued but not consumed, or a buyer "
        "who calls once and never again in 60 days — read at the uptake "
        "gates; the response is refine (narrow the service), reprice from "
        "measured cost, or retire. Per-atom, never averaged.\n"
    )


def maintenance_md(item):
    b = item.get("binding") or {}
    doubt = item.get("doubt")
    doubt_line = (
        f"\n**Named doubt to watch:** {doubt}\n" if doubt and doubt != "-" else ""
    )
    return (
        f"# Maintenance — {item['service_name']}\n\n"
        f"**Bound skill (R1):** `{b.get('skill')}` v{b.get('version')} at "
        f"`{b.get('path')}`. The skill is the source of the capability; "
        "this atom is a service face of it, never a fork.\n\n"
        "**Refinement loop:** a gap found in service → issue in this repo "
        "tagged `skill-feedback` → fix lands in the SKILL first → atom "
        "re-deploys from the refined skill → regression must pass before "
        "the atom version bumps. A skill-side refinement marks this atom "
        "**stale** until re-verified.\n\n"
        "**Status:** scaffolded 2026-11-15 from the register. No endpoint "
        "live; no production cost measured yet (T4 estimable only)."
        f"{doubt_line}\n"
        "**Test record:** none yet — tests are written when the atom is "
        "built out for its release slot in the queue.\n"
    )


def listing_stub(item):
    """Conduit-shape listing package stub (listing/server.json data +
    listing.md). SPEC: URLs are proposed, nothing is deployed."""
    import json

    name = item["service_name"]
    ns = name.replace("-", "_")
    title = item.get("display_name") or name.replace("-", " ").capitalize()
    dtype = deliverable_type(name)
    server = {
        "$schema": "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
        "_meta": {
            "io.modelcontextprotocol.registry/publisher-provided": {
                "status": "scaffolded — NOT deployed; do not submit",
                "atom": name,
                "tier": item.get("tier"),
                "keyNamespace": ns,
                "rate": None,
                "rateStatus": "pending",
            }
        },
        "description": f"{title}: a {dtype.lower()} delivered per API call "
        "as an independent atom service on Conduit.",
        "name": f"io.github.nrupala/atom-{name}",
        "remotes": [
            {
                "headers": [
                    {
                        "description": f"This atom's own API key, as "
                        f"'Bearer <key>'. Keys are per user, per atom "
                        f"(namespace {ns}); issue yours from the atom's "
                        "page after sign-up.",
                        "isRequired": True,
                        "isSecret": True,
                        "name": "Authorization",
                        "placeholder": "Bearer <redacted>",
                    }
                ],
                "type": "streamable-http",
                "url": f"https://atoms.pipavia.com/mcp/{name}",
            }
        ],
        "repository": {
            "source": "github",
            "subfolder": f"services/{name}",
            "url": "https://github.com/nrupala/atom-services",
        },
        "title": f"{title} — Atom",
        "version": "0.1.0",
        "websiteUrl": "https://pipavia.com",
    }
    md = (
        f"# Listing (STUB) — {title}\n\n"
        "**Status: scaffolded, NOT deployed.** Generated from the "
        "register; the remote URL in `server.json` is the proposed "
        "endpoint shape, not a live endpoint.\n\n"
        f"**Which atom:** `{name}` (Tier {item.get('tier')}), an "
        "independent atom service listed on Conduit.\n\n"
        f"**What it delivers:** one {dtype} per call — see "
        "`../SERVICE.md`. The atom sells the artifact, never the "
        "underlying knowledge.\n\n"
        f"**Its own API key:** yes — namespace `{ns}`, prefix "
        f"`atm_1_{ns}_`. A key is issued per user **per atom**: sign up, "
        "open this atom, issue your key. Keys are HMAC-derived from "
        "your account + this atom + issuance time, regenerated on "
        "demand if you lose yours, and never work for any other atom.\n\n"
        f"**Endpoints:** MCP (streamable HTTP, proposed "
        f"`https://atoms.pipavia.com/mcp/{name}`) plus the register's "
        f"endpoint fit: {', '.join(item.get('endpoints') or [])}.\n\n"
        f"**Rate:** pricing unit = {item.get('pricing_unit')}; "
        "**rate_status: pending** — no rate is published until the "
        "pricing protocol in `rails/billing.md` produces one (measured "
        "cost → three-model consensus → prompt-rate fallback). The rate, "
        "when set, is the same on Conduit as everywhere else.\n"
    )
    return json.dumps(server, indent=2) + "\n", md


def public_list(items):
    lines = [
        "# Public list — generated from registry/register.yaml",
        "",
        "Generated by `tools/generate.py`. Do not edit by hand; edit the "
        "register and re-run the generator.",
        "",
        f"Register total: {len(items)} candidates. "
        f"Public: {sum(1 for i in items if i['tier'] in PUBLIC_TIERS)}. "
        f"Non-public: {sum(1 for i in items if i['tier'] not in PUBLIC_TIERS)}.",
        "",
    ]
    for tier in PUBLIC_TIERS:
        group = [i for i in items if i["tier"] == tier]
        label = (
            "Tier A — strong sellable, sold individually"
            if tier == "A"
            else "Tier B — packs only (fails the standalone pays-per-use test)"
        )
        lines += [f"## {label} ({len(group)})", ""]
        for i in group:
            lines.append(
                f"- `{i['service_name']}` — unit: {i.get('pricing_unit')}; "
                f"endpoints: {', '.join(i.get('endpoints') or [])}; "
                f"bound skill: `{(i.get('binding') or {}).get('skill')}`"
            )
        lines.append("")
    lines += ["## NOT public — registry only, no service units", ""]
    for tier, reason in NONPUBLIC.items():
        group = [i for i in items if i["tier"] == tier]
        lines += [f"### {reason} ({len(group)})", ""]
        for i in group:
            note = (i.get("tests") or {}).get("note", "")
            doubt = i.get("doubt")
            extra = f" Register note: {note}" if note else ""
            extra += f" Doubt: {doubt}" if doubt and doubt != "-" else ""
            lines.append(f"- `{i['service_name']}` —{extra}")
        lines.append("")
    return "\n".join(lines)


def main():
    with open(REGISTER, encoding="utf-8") as fh:
        data = yaml.safe_load(fh)
    items = data["services"]

    with open(PUBLIC_LIST, "w", encoding="utf-8") as fh:
        fh.write(public_list(items))

    counts = {}
    for item in items:
        tier = item["tier"]
        counts[tier] = counts.get(tier, 0) + 1
        if tier not in PUBLIC_TIERS:
            continue
        unit_dir = os.path.join(SERVICES, item["service_name"])
        os.makedirs(unit_dir, exist_ok=True)
        fm = skill_frontmatter(item.get("binding"))
        write_if_not_handbuilt(
            os.path.join(unit_dir, "SERVICE.md"), service_md(item, fm)
        )
        write_if_not_handbuilt(
            os.path.join(unit_dir, "contract.yaml"), contract_yaml(item, fm)
        )
        write_if_not_handbuilt(
            os.path.join(unit_dir, "growth.md"), growth_md(item)
        )
        write_if_not_handbuilt(
            os.path.join(unit_dir, "retention.md"), retention_md(item)
        )
        write_if_not_handbuilt(
            os.path.join(unit_dir, "maintenance.md"), maintenance_md(item)
        )
        listing_dir = os.path.join(unit_dir, "listing")
        os.makedirs(listing_dir, exist_ok=True)
        server_json, listing_md = listing_stub(item)
        write_if_not_handbuilt(
            os.path.join(listing_dir, "server.json"), server_json
        )
        write_if_not_handbuilt(
            os.path.join(listing_dir, "listing.md"), listing_md
        )

    public_units = len(
        [d for d in os.listdir(SERVICES) if os.path.isdir(os.path.join(SERVICES, d))]
    )
    print(f"register total: {len(items)}  tiers: {counts}")
    print(f"public service units on disk: {public_units}")
    print(f"PUBLIC-LIST.md written: {PUBLIC_LIST}")


if __name__ == "__main__":
    sys.exit(main())
