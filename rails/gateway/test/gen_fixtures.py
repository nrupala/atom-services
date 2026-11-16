#!/usr/bin/env python3
"""Generate golden fixtures from the Python release-readiness core.

Imports the Python implementation (the regression oracle) and writes
JSON fixtures to test/fixtures/: each file is {name, manifest, expected}
where expected is the exact Python evaluate() output.

Run: python3 test/gen_fixtures.py
"""
import copy
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ATOM_ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
SRC = os.path.join(
    ATOM_ROOT, "services", "release-readiness-verdict", "src"
)
sys.path.insert(0, SRC)

from release_readiness import evaluate  # noqa: E402

READY = {
    "product": "example-app",
    "version": "1.2.0",
    "version_bump_locations": ["VERSION"],
    "tag": {"name": "v1.2.0", "annotated": True, "moved": False},
    "changelog": {"has_entry_for_version": True,
                  "unreleased_section_moved": True},
    "release_notes": {"present": True, "breaking_changes": [],
                      "migration_steps": []},
    "approver": "release-owner",
    "approval": {"hitl_recorded": True},
    "rollout_plan": {"present": True, "staged": True},
    "rollback_plan": {"present": True, "testable": True},
    "health_check": {"window_hours": 36},
    "artifacts": {"sealed": True, "checksum_manifest": True,
                  "verified_before_announcement": True},
    "tests": {"passing": True},
}


def _missing_rollback():
    m = copy.deepcopy(READY)
    m["rollback_plan"]["present"] = False
    return m


def _absent_health_check():
    m = copy.deepcopy(READY)
    del m["health_check"]
    return m


def _bad_semver():
    m = copy.deepcopy(READY)
    m["version"] = "1.2"
    return m


def _moved_tag():
    m = copy.deepcopy(READY)
    m["tag"]["moved"] = True
    return m


def _breaking_without_migration():
    m = copy.deepcopy(READY)
    m["release_notes"]["breaking_changes"] = ["config format changed"]
    m["release_notes"]["migration_steps"] = []
    return m


def _breaking_with_migration():
    m = copy.deepcopy(READY)
    m["release_notes"]["breaking_changes"] = ["config format changed"]
    m["release_notes"]["migration_steps"] = ["run migrate-config"]
    return m


def _window_6():
    m = copy.deepcopy(READY)
    m["health_check"]["window_hours"] = 6
    return m


FIXTURES = [
    ("ready", copy.deepcopy(READY)),
    ("empty", {}),
    ("missing_rollback", _missing_rollback()),
    ("absent_health_check", _absent_health_check()),
    ("bad_semver", _bad_semver()),
    ("moved_tag", _moved_tag()),
    ("breaking_without_migration", _breaking_without_migration()),
    ("breaking_with_migration", _breaking_with_migration()),
    ("window_6", _window_6()),
]


def main():
    out_dir = os.path.join(HERE, "fixtures")
    os.makedirs(out_dir, exist_ok=True)
    for name, manifest in FIXTURES:
        payload = {
            "name": name,
            "manifest": manifest,
            "expected": evaluate(copy.deepcopy(manifest)),
        }
        path = os.path.join(out_dir, f"{name}.json")
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(payload, fh, indent=2)
            fh.write("\n")
        print(f"wrote {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
