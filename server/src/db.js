import dns from "node:dns";
import mongoose from "mongoose";

// Some networks/routers block the DNS SRV lookups that mongodb+srv:// needs,
// which fails with "querySrv ECONNREFUSED" even though the cluster is fine.
// Trying public resolvers first works around that without touching system DNS.
dns.setServers(["8.8.8.8", "1.1.1.1", ...dns.getServers()]);

export async function connectDB() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  console.log("MongoDB connected");
}
