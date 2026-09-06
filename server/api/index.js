import "dotenv/config";
import app from "../src/app.js";
import { connectDB } from "../src/db.js";

// Serverless functions can be reused across invocations while "warm", so we
// cache the connection promise instead of reconnecting to Atlas on every request.
let dbConnection;

export default async function handler(req, res) {
  if (!dbConnection) dbConnection = connectDB();
  await dbConnection;
  return app(req, res);
}
