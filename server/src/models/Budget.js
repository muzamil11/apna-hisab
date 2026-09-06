import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["SPEND_CAP", "MIN_SAVINGS"], required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" }, // null for overall / MIN_SAVINGS
    limitAmount: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Budget", budgetSchema);
