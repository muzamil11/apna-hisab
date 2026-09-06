import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    direction: { type: String, enum: ["INCOME", "EXPENSE"], required: true },
    essential: { type: Boolean, default: true }, // false = "fazool kharcha" style discretionary flag
  },
  { timestamps: true }
);

export const DEFAULT_CATEGORIES = [
  { name: "Salary", direction: "INCOME" },
  { name: "Freelance", direction: "INCOME" },
  { name: "Rent Received", direction: "INCOME" },
  { name: "Other Income", direction: "INCOME" },
  { name: "Food", direction: "EXPENSE" },
  { name: "Travel", direction: "EXPENSE" },
  { name: "Shopping", direction: "EXPENSE", essential: false },
  { name: "Bills & Utilities", direction: "EXPENSE" },
  { name: "Household", direction: "EXPENSE" },
  { name: "Health", direction: "EXPENSE" },
  { name: "Education", direction: "EXPENSE" },
  { name: "Entertainment", direction: "EXPENSE", essential: false },
  { name: "Other", direction: "EXPENSE" },
];

export default mongoose.model("Category", categorySchema);
