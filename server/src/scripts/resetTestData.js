// One-off cleanup after manual smoke-testing — removes all transactions and
// resets account balances to 0 for a given user, keeping the login itself.
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../db.js";
import User from "../models/User.js";
import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import Person from "../models/Person.js";

const [username] = process.argv.slice(2);
if (!username) {
  console.error("Usage: node src/scripts/resetTestData.js <username>");
  process.exit(1);
}

await connectDB();
const user = await User.findOne({ username: username.toLowerCase() });
if (!user) {
  console.error(`No user "${username}"`);
  process.exit(1);
}

await Transaction.deleteMany({ user: user._id });
await Account.updateMany({ user: user._id }, { balance: 0 });
await Account.deleteMany({ user: user._id, type: "COMMITTEE" });
await Person.deleteMany({ user: user._id });
await Account.deleteMany({ user: user._id, type: { $in: ["RECEIVABLE", "PAYABLE"] } });

console.log(`Reset done for "${username}" — accounts kept (balance 0), test person/committee removed.`);
await mongoose.disconnect();
