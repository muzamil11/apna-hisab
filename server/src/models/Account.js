import mongoose from "mongoose";

export const ACCOUNT_TYPES = [
  "BANK",
  "CASH",
  "CREDIT_CARD",
  "INVESTMENT",
  "COMMITTEE",
  "GOAL", // a savings target with an amount and optional date — e.g. a wedding fund
  "RECEIVABLE", // udhar diya — someone owes this user
  "PAYABLE", // udhar liya — this user owes someone
  "ASSET_OTHER", // e.g. real estate
];

// Every account is either something you own (ASSET) or something you owe (LIABILITY).
// This single flag drives the balance-polarity math in utils/ledger.js.
const LIABILITY_TYPES = new Set(["CREDIT_CARD", "PAYABLE"]);

const accountSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ACCOUNT_TYPES, required: true },
    kind: { type: String, enum: ["ASSET", "LIABILITY"], required: true },
    balance: { type: Number, default: 0 },
    person: { type: mongoose.Schema.Types.ObjectId, ref: "Person" }, // for RECEIVABLE / PAYABLE
    meta: {
      billingCycleDay: Number, // CREDIT_CARD
      dueDay: Number, // CREDIT_CARD
      creditLimit: Number, // CREDIT_CARD
      payoutMonth: Date, // COMMITTEE
      targetAmount: Number, // GOAL
      targetDate: Date, // GOAL
      investedAmount: Number, // INVESTMENT — cost basis, so profit/loss % can be shown against current balance
    },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

accountSchema.pre("validate", function setKind(next) {
  this.kind = LIABILITY_TYPES.has(this.type) ? "LIABILITY" : "ASSET";
  next();
});

export default mongoose.model("Account", accountSchema);
