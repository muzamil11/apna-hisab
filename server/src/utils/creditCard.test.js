import { describe, it, expect } from "vitest";
import { lastBillingDate, statementDueDate, groupIntoStatements } from "./creditCard.js";

describe("statementDueDate — billing day 20, due day 9 (the user's real card)", () => {
  it("a purchase before the billing day is due the following month", () => {
    const due = statementDueDate(new Date(2026, 8, 19), 20, 9); // 19 Sept
    expect(due).toEqual(new Date(2026, 9, 9)); // 9 Oct
  });

  it("a purchase on the billing day itself is still in that statement", () => {
    const due = statementDueDate(new Date(2026, 8, 20), 20, 9); // 20 Sept
    expect(due).toEqual(new Date(2026, 9, 9)); // 9 Oct
  });

  it("a purchase the day after billing rolls into next month's statement", () => {
    const due = statementDueDate(new Date(2026, 8, 21), 20, 9); // 21 Sept
    expect(due).toEqual(new Date(2026, 10, 9)); // 9 Nov — one statement later than the 19th case
  });

  it("carries correctly across a year boundary", () => {
    const due = statementDueDate(new Date(2026, 11, 25), 20, 9); // 25 Dec 2026
    expect(due).toEqual(new Date(2027, 1, 9)); // 9 Feb 2027
  });
});

describe("statementDueDate — other billing/due combinations", () => {
  it("handles a due day that falls before the billing day (short grace period)", () => {
    const due = statementDueDate(new Date(2026, 2, 10), 15, 5); // 10 Mar, bills 15th, due 5th
    expect(due).toEqual(new Date(2026, 3, 5)); // 5 Apr
  });

  it("handles month-end billing days safely (e.g. 28th) without spilling into the next month", () => {
    const due = statementDueDate(new Date(2026, 1, 20), 28, 10); // 20 Feb, before the 28th
    expect(due).toEqual(new Date(2026, 2, 10)); // 10 Mar
  });
});

describe("lastBillingDate", () => {
  it("returns this month's billing date when today is on or after it", () => {
    const result = lastBillingDate(20, new Date(2026, 8, 25)); // 25 Sept
    expect(result).toEqual(new Date(2026, 8, 20)); // 20 Sept
  });

  it("returns this month's billing date when today is exactly on it", () => {
    const result = lastBillingDate(20, new Date(2026, 8, 20));
    expect(result).toEqual(new Date(2026, 8, 20));
  });

  it("falls back to last month's billing date when today is before it", () => {
    const result = lastBillingDate(20, new Date(2026, 8, 6)); // 6 Sept
    expect(result).toEqual(new Date(2026, 7, 20)); // 20 Aug
  });

  it("carries correctly across a year boundary", () => {
    const result = lastBillingDate(20, new Date(2027, 0, 5)); // 5 Jan 2027
    expect(result).toEqual(new Date(2026, 11, 20)); // 20 Dec 2026
  });
});

describe("groupIntoStatements — the user's real card (billing 20, due 9)", () => {
  it("splits charges into separate statements by which cycle they fall in", () => {
    const charges = [
      { date: new Date(2026, 7, 15), amount: 54000 }, // 15 Aug -> statement due 9 Sept
      { date: new Date(2026, 8, 1), amount: 70000 }, // 1 Sept -> statement due 9 Oct
      { date: new Date(2026, 8, 3), amount: 50000 }, // 3 Sept -> statement due 9 Oct (e.g. Mom's spending)
    ];

    const statements = groupIntoStatements(charges, 20, 9);

    expect(statements).toHaveLength(2);
    // newest (still-open) statement first
    expect(statements[0].dueDate).toEqual(new Date(2026, 9, 9));
    expect(statements[0].total).toBe(120000);
    expect(statements[1].dueDate).toEqual(new Date(2026, 8, 9));
    expect(statements[1].total).toBe(54000);
  });

  it("computes the period range for a statement correctly", () => {
    const charges = [{ date: new Date(2026, 7, 15), amount: 54000 }];
    const [statement] = groupIntoStatements(charges, 20, 9);
    expect(statement.periodStart).toEqual(new Date(2026, 6, 21)); // 21 Jul
    expect(statement.periodEnd).toEqual(new Date(2026, 7, 20)); // 20 Aug
  });

  it("returns nothing for an empty charge list", () => {
    expect(groupIntoStatements([], 20, 9)).toEqual([]);
  });
});
