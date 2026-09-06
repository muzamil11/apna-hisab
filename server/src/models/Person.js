import mongoose from "mongoose";

const personSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    note: String,
  },
  { timestamps: true }
);

export default mongoose.model("Person", personSchema);
