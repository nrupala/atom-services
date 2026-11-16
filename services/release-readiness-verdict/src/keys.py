#!/usr/bin/env python3
"""Per-user, per-atom API keys — reference implementation of the design
in rails/billing.md (owner's design + the master-secret fix).

    key = "atm_" + version + "_" + atom_namespace + "_"
          + HMAC-SHA256(master_secret, email | atom_service | issued_at)

Properties:
- A key binds one user (email) to one atom (namespace) at one issuance
  (issued_at). A key for one atom never verifies for another.
- The key itself is NEVER stored. The per-user record holds
  (email, atom_service, issued_at, fingerprint); the key is
  regenerated on demand after the user authenticates.
- Revocation is a record state, not a math change: a revoked issuance
  fails verification even though its HMAC still matches.
"""
import hashlib
import hmac

KEY_VERSION = "1"


def namespace_for(service_name):
    """The atom's key namespace: its service slug, hyphens as underscores."""
    return service_name.replace("-", "_")


def derive_key(master_secret, email, service_name, issued_at):
    ns = namespace_for(service_name)
    msg = f"{email.strip().lower()}|{service_name}|{issued_at}".encode()
    digest = hmac.new(master_secret.encode(), msg, hashlib.sha256).hexdigest()
    return f"atm_{KEY_VERSION}_{ns}_{digest}"


def fingerprint(key):
    """Short, safe-to-store identifier for a key (never the key itself)."""
    return hashlib.sha256(key.encode()).hexdigest()[:16]


def verify(key, master_secret, email, service_name, issued_at, revoked=False):
    if revoked:
        return False
    expected = derive_key(master_secret, email, service_name, issued_at)
    return hmac.compare_digest(key, expected)
