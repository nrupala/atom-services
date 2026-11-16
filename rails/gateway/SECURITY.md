# Security — Conduit Atoms gateway

Report a vulnerability or an abuse concern to **info@aimlds.org**.
We read every report; confirmed issues are fixed as defects, with
security fixes shipped ahead of the weekly cadence.

Design commitments (see `DESIGN.md`):

- API keys are derived, never stored; the server master secret
  exists only as a Worker secret binding.
- Sign-in links and session tokens are stored only as SHA-256
  hashes, are single-use / short-lived, and are never logged.
- Callers' manifests are processed in memory and not retained;
  metering rows record the key fingerprint, atom, timestamp, and
  charge — never the caller's payload.
- No telemetry, no trackers, no third-party analytics on any face.
