// Admin-only user creation — there's no signup screen on purpose. Run:
//   npm run seed:user --workspace server -- <username> <password> <displayName>
import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "../db.js";
import User from "../models/User.js";
import Category from "../models/Category.js";
import Account from "../models/Account.js";
import { DEFAULT_CATEGORIES } from "../models/Category.js";
import mongoose from "mongoose";

const [username, password, displayName] = process.argv.slice(2);
if (!username || !password || !displayName) {
  console.error("Usage: npm run seed:user --workspace server -- <username> <password> <displayName>");
  process.exit(1);
}

await connectDB();

const existing = await User.findOne({ username: username.toLowerCase() });
if (existing) {
  console.error(`User "${username}" already exists`);
  process.exit(1);
}

const passwordHash = await bcrypt.hash(password, 10);
const user = await User.create({ username: username.toLowerCase(), passwordHash, displayName });

await Category.insertMany(DEFAULT_CATEGORIES.map((c) => ({ ...c, user: user._id })));
await Account.create([
  { user: user._id, name: "Cash", type: "CASH" },
  { user: user._id, name: "Bank Account", type: "BANK" },
]);

console.log(`Created user "${username}" (${displayName}) with starter categories and accounts.`);
await mongoose.disconnect();
