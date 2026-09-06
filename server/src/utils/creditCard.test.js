import { describe, it, expect } from "vitest";
import { lastBillingDate, statementDueDate } from "./creditCard.js";

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
