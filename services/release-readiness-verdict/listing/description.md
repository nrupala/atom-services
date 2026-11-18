# Description — release-readiness-verdict (for the Conduit listing)

Agent listing copy (mercer-0043, Director-approved 2026-11-18):

> Evaluates output against predefined schema and safety boundaries.
> Use as a post-generation check before returning data. Returns
> boolean pass/fail and violation details.

Chain: [Repo Teardown — aimlds-production-atoms](https://github.com/nrupala/aimlds-production-atoms) -> [Pricing — The Economics of Agentic Tool Calls](https://aimlds.org/pricing) -> [$99 Sanity Check](https://sanity.aimlds.org)

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
