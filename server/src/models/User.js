import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, required: true },
    modules: {
      budgets: { type: Boolean, default: true },
      udhar: { type: Boolean, default: true },
      investments: { type: Boolean, default: true },
      committee: { type: Boolean, default: true },
      ventures: { type: Boolean, default: false },
      assets: { type: Boolean, default: false },
      creditCard: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
