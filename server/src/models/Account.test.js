import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Account from "./Account.js";

// No DB connection needed — validate() only runs schema hooks/validators.
async function kindFor(type) {
  const doc = new Account({ user: new mongoose.Types.ObjectId(), name: "test", type });
  await doc.validate();
  return doc.kind;
}

describe("Account kind assignment (drives all ledger polarity math)", () => {
  it("credit cards and payables are liabilities", async () => {
    expect(await kindFor("CREDIT_CARD")).toBe("LIABILITY");
    expect(await kindFor("PAYABLE")).toBe("LIABILITY");
  });

  it("everything else — including the new GOAL type — is an asset", async () => {
    for (const type of ["BANK", "CASH", "INVESTMENT", "COMMITTEE", "GOAL", "RECEIVABLE", "ASSET_OTHER"]) {
      expect(await kindFor(type)).toBe("ASSET");
    }
  });
});
