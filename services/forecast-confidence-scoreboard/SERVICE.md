# Confidence scoreboard — `forecast-confidence-scoreboard`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Predict with models honestly — baselines, leakage-free validation, calibration, drift awareness.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one query.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Thinking & decisions who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Scoring our own product forecasts**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Pricing

Pricing unit: **query**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **scaffolded** — service unit generated from the register; no endpoint is live. Release happens one by one, by the owner's GO, per the approved queue.

## Named doubt (from the register)

Needs longitudinal adoption; slow first revenue. Distinct from prediction skill (ML-model audit vs human forecaster scoring)
