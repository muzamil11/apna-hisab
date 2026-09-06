import mongoose from "mongoose";

export const TRANSACTION_TYPES = ["INCOME", "EXPENSE", "TRANSFER", "REVALUATION"];

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: TRANSACTION_TYPES, required: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, default: Date.now },
    fromAccount: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
    toAccount: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    person: { type: mongoose.Schema.Types.ObjectId, ref: "Person" },
    title: { type: String, required: true, trim: true },
    note: String,
  },
  { timestamps: true }
);

transactionSchema.index({ user: 1, date: -1 });

export default mongoose.model("Transaction", transactionSchema);
