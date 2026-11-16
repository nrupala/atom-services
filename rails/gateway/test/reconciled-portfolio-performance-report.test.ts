import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp, fmt } from "../src/atoms/reconciled-portfolio-performance-report.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The FULL manifest, copied from the Python ReconciledPerformanceTests oracle.
const FULL: Record<string, unknown> = {
  portfolio: "test-portfolio",
  beginning_value: 10000,
  period_end_values: [10300, 10100, 10600, 11200],
  external_flows: [0, 500, 0, 0],
  benchmark_name: "blend-60-40",
  benchmark_returns: [0.02, -0.05, 0.04, 0.03],
  holdings: [
    { id: "A", quantity: 10, price: 600 },
    { id: "B", quantity: 20, price: 260 },
  ],
  transactions: [{ kind: "contribution", amount: 500 }],
};

const SIMPLE: Record<string, unknown> = {
  beginning_value: 1000,
  period_end_values: [1100, 1210],
  external_flows: [0, 0],
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

type Section = Record<string, unknown>;
const sec = (v: ReturnType<typeof evaluate>, name: string): Section =>
  v[name as keyof typeof v] as Section;

// ---- The 23 Python ReconciledPerformanceTests, ported ----

test("test_simple_twr_and_irr_agree_without_flows", () => {
  const v = evaluate(clone(SIMPLE));
  assert.equal(v.status, "complete");
  const p = sec(v, "performance");
  assert.deepEqual(p["period_returns"], ["0.100000", "0.100000"]);
  assert.equal(p["time_weighted_return"], "0.210000");
  assert.equal(p["money_weighted_return_per_period"], "0.100000");
  assert.equal(p["twr_irr_difference"], "0.110000");
  assert.equal(p["mean_period_return"], "0.100000");
  assert.equal(p["net_external_flows"], "0.000000");
  assert.equal(p["total_gain_after_flows"], "210.000000");
  assert.equal(p["value_change"], "210.000000");
});

test("test_flow_at_period_beginning_is_excluded_from_return", () => {
  const v = evaluate({
    beginning_value: 1000,
    period_end_values: [1100, 1320],
    external_flows: [0, 100],
  });
  const p = sec(v, "performance");
  assert.deepEqual(p["period_returns"], ["0.100000", "0.100000"]);
  assert.equal(p["time_weighted_return"], "0.210000");
  assert.equal(p["money_weighted_return_per_period"], "0.100000");
  assert.equal(p["net_external_flows"], "100.000000");
  assert.equal(p["total_gain_after_flows"], "220.000000");
  assert.equal(v.status, "complete");
});

test("test_full_manifest_is_complete_with_no_gaps", () => {
  const manifest = clone(FULL);
  const computed = sec(evaluate(clone(FULL)), "performance");
  manifest["declared_returns"] =
    (computed["period_returns"] as string[]).map((x) => parseFloat(x));
  const v = evaluate(manifest);
  assert.equal(v.status, "complete");
  assert.deepEqual(v.layers, {
    values: "present", performance: "present",
    reconciliation: "present", benchmark: "present",
    holdings: "present",
  });
  const recon = sec(v, "reconciliation");
  const flowsLeg = recon["flows_vs_ledger"] as Section;
  assert.equal(flowsLeg["difference"], "0.000000");
  const holdingsLeg = recon["holdings_vs_declared_value"] as Section;
  assert.equal(holdingsLeg["difference"], "0.000000");
});

test("test_full_holdings_and_benchmark", () => {
  const v = evaluate(clone(FULL));
  const h = sec(v, "holdings");
  assert.equal(h["total_value"], "11200.000000");
  assert.equal(h["largest_holding_id"], "A");
  assert.equal(h["largest_holding_share"], "0.535714");
  const rows = h["rows"] as Section[];
  assert.equal(rows[1]["value"], "5200.000000");
  assert.equal(rows[1]["share_of_holdings"], "0.464286");
  const b = sec(v, "benchmark");
  assert.equal(b["aligned"], true);
  assert.equal(b["name"], "blend-60-40");
  assert.equal(b["total_return"], "0.037993");
  assert.equal(b["mean_return_per_period"], "0.010000");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.status, "insufficient_evidence");
  assert.equal(v.performance, null);
  assert.equal(v.layers["performance"], "absent");
  assert.equal(v.gaps.length, 2);
});

test("test_single_value_is_insufficient_evidence", () => {
  assert.equal(
    evaluate({ beginning_value: 1000, period_end_values: [1100] }).status,
    "insufficient_evidence");
  assert.equal(
    evaluate({ period_end_values: [1100, 1210],
               external_flows: [0, 0] }).status,
    "insufficient_evidence");
});

test("test_missing_flows_are_a_gap_never_defaulted", () => {
  const v = evaluate({ beginning_value: 1000,
                       period_end_values: [1100, 1210] });
  assert.equal(v.status, "partial");
  const p = sec(v, "performance");
  assert.equal(p["period_returns"], null);
  assert.equal(p["time_weighted_return"], null);
  assert.equal(p["money_weighted_return_per_period"], null);
  assert.equal(p["value_change"], "210.000000");
});

test("test_misaligned_flows_are_a_gap", () => {
  const v = evaluate({ beginning_value: 1000,
                       period_end_values: [1100, 1210],
                       external_flows: [0] });
  assert.equal(v.status, "partial");
  assert.equal(sec(v, "performance")["time_weighted_return"], null);
});

test("test_invalid_value_entries_excluded_and_counted", () => {
  const v = evaluate({ beginning_value: 1000,
                       period_end_values: [1100, "bad", 1210, null],
                       external_flows: [0, 0] });
  assert.equal(v.status, "partial");
  assert.equal(v.counts["periods"], 2);
  assert.equal(v.counts["invalid_value_entries"], 2);
  assert.equal(sec(v, "performance")["time_weighted_return"], "0.210000");
});

test("test_non_positive_base_period_is_a_gap", () => {
  const v = evaluate({ beginning_value: 1000,
                       period_end_values: [1100, 1210],
                       external_flows: [-1000, 0] });
  assert.equal(v.status, "partial");
  assert.equal(sec(v, "performance")["period_returns"], null);
  assert.ok(v.gaps.some((g) => g.startsWith("period 0:")));
});

test("test_irr_without_sign_changing_bracket_is_a_gap", () => {
  const v = evaluate({ beginning_value: 1000,
                       period_end_values: [900, -5000],
                       external_flows: [0, -100] });
  assert.equal(v.status, "partial");
  const p = sec(v, "performance");
  assert.notEqual(p["time_weighted_return"], null);
  assert.equal(p["money_weighted_return_per_period"], null);
  assert.equal(p["twr_irr_difference"], null);
});

test("test_benchmark_misalignment_is_a_gap", () => {
  const manifest = clone(SIMPLE);
  manifest["benchmark_returns"] = [0.01];
  const v = evaluate(manifest);
  assert.equal(v.status, "partial");
  const b = sec(v, "benchmark");
  assert.equal(b["aligned"], false);
  assert.equal(b["total_return"], null);
});

test("test_benchmark_excess_and_periods_ahead", () => {
  const manifest = clone(SIMPLE);
  manifest["benchmark_returns"] = [0.05, 0.05];
  const v = evaluate(manifest);
  const b = sec(v, "benchmark");
  assert.equal(b["total_return"], "0.102500");
  assert.equal(b["excess_total_return"], "0.107500");
  assert.equal(b["periods_portfolio_ahead"], 2);
  assert.equal(v.status, "complete");
});

test("test_holdings_discrepancy_is_a_finding_not_a_gap", () => {
  const manifest = clone(SIMPLE);
  manifest["holdings"] = [{ id: "A", quantity: 1, price: 1000 }];
  const v = evaluate(manifest);
  assert.equal(v.status, "complete");
  const leg = sec(v, "reconciliation")[
    "holdings_vs_declared_value"] as Section;
  assert.equal(leg["difference"], "-210.000000");
  assert.equal(leg["difference_fraction_of_final"], "-0.173554");
});

test("test_ledger_discrepancy_is_a_finding_not_a_gap", () => {
  const manifest = clone(FULL);
  manifest["transactions"] = [
    { kind: "contribution", amount: 700 },
    { kind: "withdrawal", amount: 100 },
  ];
  const v = evaluate(manifest);
  assert.equal(v.status, "complete");
  const leg = sec(v, "reconciliation")["flows_vs_ledger"] as Section;
  assert.equal(leg["ledger_net_external_flows"], "600.000000");
  assert.equal(leg["difference"], "-100.000000");
});

test("test_invalid_holdings_and_transactions_counted", () => {
  const manifest = clone(SIMPLE);
  manifest["holdings"] = [
    { id: "A", quantity: 1, price: 1210 },
    { id: "B", quantity: "many", price: 1 },
    "not-an-entry",
  ];
  manifest["transactions"] = [
    { kind: "contribution", amount: 10 },
    { kind: "gift", amount: 5 },
    { kind: "withdrawal", amount: -3 },
  ];
  const v = evaluate(manifest);
  assert.equal(v.status, "partial");
  assert.equal(v.counts["holdings"], 1);
  assert.equal(v.counts["invalid_holdings"], 2);
  assert.equal(v.counts["transactions"], 1);
  assert.equal(v.counts["invalid_transactions"], 2);
});

test("test_declared_returns_reconciliation_exact", () => {
  const manifest = clone(SIMPLE);
  manifest["declared_returns"] = [0.1, 0.09];
  const v = evaluate(manifest);
  const leg = sec(v, "reconciliation")[
    "declared_vs_computed_returns"] as Section;
  assert.equal(leg["aligned"], true);
  assert.equal(leg["compared_periods"], 2);
  assert.deepEqual(leg["differences"], ["0.000000", "0.010000"]);
  assert.equal(leg["max_abs_difference"], "0.010000");
  assert.equal(leg["mismatched_periods"], 1);
  assert.equal(v.status, "complete");
});

test("test_declared_returns_misalignment_is_a_gap", () => {
  const manifest = clone(SIMPLE);
  manifest["declared_returns"] = [0.1];
  const v = evaluate(manifest);
  assert.equal(v.status, "partial");
  const leg = sec(v, "reconciliation")[
    "declared_vs_computed_returns"] as Section;
  assert.equal(leg["aligned"], false);
});

test("test_zero_holdings_total_shares_are_gaps", () => {
  const manifest = clone(SIMPLE);
  manifest["holdings"] = [{ id: "A", quantity: 0, price: 100 }];
  const v = evaluate(manifest);
  assert.equal(v.status, "partial");
  const h = sec(v, "holdings");
  assert.equal((h["rows"] as Section[])[0]["share_of_holdings"], null);
  assert.equal(h["largest_holding_share"], null);
});

test("test_methods_are_stated_and_never_mixed", () => {
  const v = evaluate(clone(SIMPLE));
  assert.deepEqual(sec(v, "performance")["methods"],
                   ["time_weighted_return",
                    "money_weighted_return_per_period"]);
});

test("test_fmt_serialization_rule", () => {
  assert.equal(fmt(0.1234567), "0.123457");
  assert.equal(fmt(-2.5), "-2.500000");
  assert.equal(fmt(0), "0.000000");
  assert.equal(fmt(-0.0000001), "0.000000");
  assert.equal(fmt(null), null);
});

test("test_disclaimer_and_stamp", () => {
  const v = evaluate(clone(SIMPLE));
  assert.ok(v.disclaimer.includes("not financial advice"));
  const text = stamp(v);
  assert.ok(text.includes("STATUS: complete"));
  assert.ok(text.includes("user decides"));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) =>
      err instanceof TypeError &&
      (err as Error).message === "manifest must be a JSON object",
  );
});

// ---- F1 regression: malformed field types (external verification
// Wave 1) — the Python MalformedTypeTests, ported. A documented
// field present with the wrong JSON type raises FieldTypeError
// naming the field — never a report over garbage. List fields are
// container-validated only: their entries are documented counted
// gaps, never rejections.

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: recorded external case rejected", () => {
  assert.throws(
    () => evaluate({ portfolio: 12345, beginning_value: "one thousand", period_end_values: "not a list" }),
    fieldError("portfolio"),
  );
});

test("malformed: portfolio as number rejected", () => {
  assert.throws(() => evaluate({ portfolio: 12345 }), fieldError("portfolio"));
});

test("malformed: beginning_value as string rejected", () => {
  assert.throws(
    () => evaluate({ beginning_value: "one thousand" }),
    fieldError("beginning_value"),
  );
});

test("malformed: period_end_values as string rejected", () => {
  assert.throws(
    () => evaluate({ period_end_values: "not a list" }),
    fieldError("period_end_values"),
  );
});

test("malformed: external_flows as string rejected", () => {
  const m = clone(SIMPLE) as any;
  m.external_flows = "none";
  assert.throws(() => evaluate(m), fieldError("external_flows"));
});

test("malformed: benchmark_returns as string rejected", () => {
  const m = clone(SIMPLE) as any;
  m.benchmark_returns = "up";
  assert.throws(() => evaluate(m), fieldError("benchmark_returns"));
});

test("malformed: holdings as string rejected", () => {
  const m = clone(SIMPLE) as any;
  m.holdings = "none";
  assert.throws(() => evaluate(m), fieldError("holdings"));
});

test("malformed: transactions as string rejected", () => {
  const m = clone(SIMPLE) as any;
  m.transactions = "none";
  assert.throws(() => evaluate(m), fieldError("transactions"));
});

test("malformed: benchmark_name as number rejected", () => {
  const m = clone(SIMPLE) as any;
  m.benchmark_name = 12345;
  assert.throws(() => evaluate(m), fieldError("benchmark_name"));
});

test("malformed: null beginning_value rejected", () => {
  assert.throws(
    () => evaluate({ beginning_value: null }),
    fieldError("beginning_value"),
  );
});

test("malformed: non-numeric value entries stay counted gaps", () => {
  const v = evaluate({ beginning_value: 1000,
                       period_end_values: [1100, "bad", 1210, null],
                       external_flows: [0, 0] });
  assert.equal(v.counts["invalid_value_entries"], 2);
});

test("malformed: invalid holding entries stay counted gaps", () => {
  const manifest = clone(SIMPLE) as any;
  manifest.holdings = [
    { id: "B", quantity: "many", price: 1 },
    "not-an-entry",
  ];
  const v = evaluate(manifest);
  assert.equal(v.counts["invalid_holdings"], 2);
});

// ---- F2 regression: declared empty ledgers (external verification
// Wave 1) — the Python EmptyLedgerTests, ported. A declared EMPTY
// ledger is present evidence, not absence.

test("f2: declared empty holdings are reconciled", () => {
  const v = evaluate({ beginning_value: 1000,
                       period_end_values: [1100, 1210],
                       external_flows: [0.0],
                       holdings: [] });
  assert.equal(v.layers["holdings"], "present");
  assert.equal(v.layers["reconciliation"], "present");
  const h = sec(v, "holdings");
  assert.equal(h["total_value"], "0.000000");
  assert.equal(h["holdings_count"], 0);
  const leg = sec(v, "reconciliation")[
    "holdings_vs_declared_value"] as Section;
  assert.equal(leg["holdings_total_value"], "0.000000");
  assert.equal(leg["difference"], "-1210.000000");
  assert.equal(leg["difference_fraction_of_final"], "-1.000000");
  assert.equal(v.status, "partial");
});

test("f2: absent holdings stay absent", () => {
  const v = evaluate(clone(SIMPLE));
  assert.equal(v.layers["holdings"], "absent");
  assert.equal(v.holdings, null);
  const leg = sec(v, "reconciliation")[
    "holdings_vs_declared_value"] as Section;
  assert.equal(leg["holdings_total_value"], null);
  assert.equal(leg["difference"], null);
});

test("f2: declared empty transactions compute zero net", () => {
  const manifest = clone(SIMPLE) as any;
  manifest.transactions = [];
  const v = evaluate(manifest);
  assert.equal(v.layers["reconciliation"], "present");
  const leg = sec(v, "reconciliation")["flows_vs_ledger"] as Section;
  assert.equal(leg["ledger_contributions"], "0.000000");
  assert.equal(leg["ledger_withdrawals"], "0.000000");
  assert.equal(leg["ledger_net_external_flows"], "0.000000");
  assert.equal(leg["difference"], "0.000000");
  assert.equal(v.status, "complete");
});

test("f2: absent transactions stay uncomputed", () => {
  const v = evaluate(clone(SIMPLE));
  const leg = sec(v, "reconciliation")["flows_vs_ledger"] as Section;
  assert.equal(leg["ledger_net_external_flows"], null);
  assert.equal(leg["difference"], null);
});

// ---- Golden-fixture parity against the Python oracle ----

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "test",
  "fixtures",
);

interface Fixture {
  name: string;
  manifest: unknown;
  expected: unknown;
}

const fixtureFiles = readdirSync(fixturesDir)
  .filter((f) =>
    f.startsWith("reconciled-portfolio-performance-report--") &&
    f.endsWith(".json"))
  .sort();

assert.ok(fixtureFiles.length > 0, "no golden fixtures found for this atom");

for (const file of fixtureFiles) {
  const fixture = JSON.parse(
    readFileSync(path.join(fixturesDir, file), "utf-8"),
  ) as Fixture;
  test(`golden fixture parity: ${fixture.name}`, () => {
    assert.deepStrictEqual(evaluate(fixture.manifest), fixture.expected);
  });
}
