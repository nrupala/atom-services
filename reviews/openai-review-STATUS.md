# OpenAI review — NOT RUN (route blocked, named)

**Status: packet ready, review not run. No review is faked here.**

- The identical packet (`reviews/REVIEW-PACKET.md`) was prepared for
  OpenAI via OpenRouter, per the house record.
- The OpenRouter live catalogue was checked at time of use
  (2026-11-15, `GET https://openrouter.ai/api/v1/models`): 470
  models, 17 with both prompt and completion pricing at exactly 0 —
  **none of them an OpenAI model**.
- The owner's strict free rule (2026-11-15 00:17 MST) bars the
  routes that remain: the `openrouter/free` auto-router is banned
  outright, ":free" framing is not proof of free, GLM via API is
  banned, and only individually named models with live 0/0 pricing
  may be used on OpenRouter. Substituting a non-OpenAI zero-priced
  model and calling it "OpenAI's input" would fake the consensus,
  so it was not done.
- **What unblocks it:** the owner's word to run ONE paid OpenAI
  model call on OpenRouter (a single review call, cents-scale), or
  a direct OpenAI route if one is connected later. On that word the
  packet runs unchanged and the response is filed here.
