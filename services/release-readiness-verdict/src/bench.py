#!/usr/bin/env python3
"""Production-cost measurement for release-readiness-verdict.

The atom is deterministic Python with no model call and no network.
Its marginal production cost per call is therefore compute time (plus,
once hosted, the serving platform's per-request charge — not measured
here because nothing is deployed; see rails/billing.md).

Run: python3 src/bench.py [iterations]
"""
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from release_readiness import evaluate  # noqa: E402
import keys  # noqa: E402

MANIFEST = {
    "product": "bench", "version": "1.0.0",
    "version_bump_locations": ["VERSION"],
    "tag": {"name": "v1.0.0", "annotated": True, "moved": False},
    "changelog": {"has_entry_for_version": True,
                  "unreleased_section_moved": True},
    "release_notes": {"present": True, "breaking_changes": [],
                      "migration_steps": []},
    "approver": "bench", "approval": {"hitl_recorded": True},
    "rollout_plan": {"present": True},
    "rollback_plan": {"present": True, "testable": True},
    "health_check": {"window_hours": 24},
    "artifacts": {"sealed": True, "checksum_manifest": True,
                  "verified_before_announcement": True},
    "tests": {"passing": True},
}


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 20000
    start = time.perf_counter()
    for _ in range(n):
        evaluate(MANIFEST)
    elapsed = time.perf_counter() - start
    per_call_ms = elapsed / n * 1000

    start = time.perf_counter()
    for _ in range(n):
        keys.derive_key("bench-secret", "u@example.com",
                        "release-readiness-verdict", "2026-11-15T00:00:00Z")
    key_ms = (time.perf_counter() - start) / n * 1000

    out = {
        "atom": "release-readiness-verdict",
        "iterations": n,
        "verdict_ms_per_call": round(per_call_ms, 4),
        "key_derivation_ms_per_call": round(key_ms, 4),
        "calls_per_second_single_core": round(1000 / per_call_ms),
        "llm_tokens_per_call": 0,
        "network_calls_per_call": 0,
        "note": "Local CPU measurement on the build VM (shared vCPU). "
                "Hosted marginal cost adds the serving platform's "
                "per-request charge, unmeasured until deployment.",
    }
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
