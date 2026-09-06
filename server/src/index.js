import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./db.js";

const port = process.env.PORT || 5000;
connectDB()
  .then(() => app.listen(port, () => console.log(`Apna Hisab API running on :${port}`)))
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
