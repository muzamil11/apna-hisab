import { describe, it, expect } from "vitest";
import { getInvestmentSummary } from "./investment.js";

const ACC = "acc1";
const tx = (overrides) => ({ amount: 0, ...overrides });

describe("getInvestmentSummary — the buffalo deal (contribution, profit mark, then withdrawal)", () => {
  it("shows correct profit even after most of the payout has already been collected", () => {
    const transactions = [
      tx({ type: "INCOME", toAccount: ACC, amount: 335000 }), // principal, historical
      tx({ type: "REVALUATION", toAccount: ACC, amount: 80000 }), // profit realized
      tx({ type: "EXPENSE", fromAccount: ACC, amount: 360000 }), // already received
    ];
    const balance = 55000; // 335000 + 80000 - 360000
    const summary = getInvestmentSummary(ACC, transactions, balance, 0);
    expect(summary.invested).toBe(335000);
    expect(summary.withdrawn).toBe(360000);
    expect(summary.totalValue).toBe(415000);
    expect(summary.profit).toBe(80000);
    expect(summary.profitPct).toBeCloseTo(23.88, 1);
  });
});

describe("getInvestmentSummary — land bought, topped up, then a loss", () => {
  it("tracks two separate contributions plus a loss mark correctly", () => {
    const transactions = [
      tx({ type: "INCOME", toAccount: ACC, amount: 500000 }), // original purchase, historical
      tx({ type: "TRANSFER", toAccount: ACC, amount: 300000 }), // topped up from a real wallet
      tx({ type: "REVALUATION", fromAccount: ACC, amount: 300000 }), // market dropped
    ];
    const balance = 500000; // 500000 + 300000 - 300000
    const summary = getInvestmentSummary(ACC, transactions, balance, 0);
    expect(summary.invested).toBe(800000);
    expect(summary.withdrawn).toBe(0);
    expect(summary.totalValue).toBe(500000);
    expect(summary.profit).toBe(-300000);
    expect(summary.profitPct).toBeCloseTo(-37.5, 1);
  });

  it("recovers into a profit once a later gain outweighs the earlier loss", () => {
    const transactions = [
      tx({ type: "INCOME", toAccount: ACC, amount: 500000 }),
      tx({ type: "TRANSFER", toAccount: ACC, amount: 300000 }),
      tx({ type: "REVALUATION", fromAccount: ACC, amount: 300000 }),
      tx({ type: "REVALUATION", toAccount: ACC, amount: 500000 }), // market recovered and then some
    ];
    const balance = 1000000; // 500000 + 300000 - 300000 + 500000
    const summary = getInvestmentSummary(ACC, transactions, balance, 0);
    expect(summary.invested).toBe(800000);
    expect(summary.profit).toBe(200000);
    expect(summary.profitPct).toBeCloseTo(25, 1);
  });
});

describe("getInvestmentSummary — a TRANSFER out (moved to another account) still counts as realized", () => {
  it("treats a transfer away from the investment the same as an expense for withdrawn", () => {
    const transactions = [
      tx({ type: "INCOME", toAccount: ACC, amount: 100000 }),
      tx({ type: "TRANSFER", fromAccount: ACC, amount: 40000 }), // moved into another account
    ];
    const summary = getInvestmentSummary(ACC, transactions, 60000, 0);
    expect(summary.withdrawn).toBe(40000);
    expect(summary.totalValue).toBe(100000);
    expect(summary.profit).toBe(0);
  });
});

describe("getInvestmentSummary — no real contribution transactions yet", () => {
  it("falls back to the manually-entered invested amount", () => {
    const summary = getInvestmentSummary(ACC, [], 55000, 50000);
    expect(summary.invested).toBe(50000);
    expect(summary.profit).toBe(5000);
  });

  it("ignores the fallback the moment a real contribution transaction exists", () => {
    const transactions = [tx({ type: "INCOME", toAccount: ACC, amount: 100000 })];
    const summary = getInvestmentSummary(ACC, transactions, 100000, 999999);
    expect(summary.invested).toBe(100000);
  });

  it("returns null when nothing has ever been invested, ledger or fallback", () => {
    expect(getInvestmentSummary(ACC, [], 0, 0)).toBeNull();
  });
});

describe("getInvestmentSummary — transactions belonging to other accounts are ignored", () => {
  it("only counts transactions where this account is actually the from/to side", () => {
    const transactions = [
      tx({ type: "INCOME", toAccount: ACC, amount: 100000 }),
      tx({ type: "INCOME", toAccount: "someOtherAccount", amount: 999999 }),
      tx({ type: "EXPENSE", fromAccount: "someOtherAccount", amount: 999999 }),
    ];
    const summary = getInvestmentSummary(ACC, transactions, 100000, 0);
    expect(summary.invested).toBe(100000);
    expect(summary.withdrawn).toBe(0);
  });
});
