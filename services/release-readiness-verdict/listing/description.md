# Description — release-readiness-verdict (for the Conduit listing)

Short description (registry `description` field):

> Release-readiness verdict: submit a release-evidence manifest, get
> one deterministic verdict (READY / NOT_READY /
> INSUFFICIENT_EVIDENCE) across five bars — control, understanding,
> management, lifecycle, stability — with per-check evidence. 19
> checks, no model call, same manifest always yields the same verdict.

Tool exposed over MCP: `release_readiness_verdict`

- Input: a release-evidence manifest (JSON object; fields in
  `../SERVICE.md`).
- Output: the verdict object — verdict word, per-bar results, all 19
  check results with evidence, and a summary line.
- Determinism: pure function of the manifest. No model, no network,
  no clock.
- Failure modes: 401 (key not issued for this atom), 429 (per-key
  rate limit), 422 (input is not a JSON object / fails the shape).
