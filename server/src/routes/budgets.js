import { Router } from "express";
import Budget from "../models/Budget.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const budgets = await Budget.find({ user: req.userId }).populate("category");
  res.json(budgets);
});

router.post("/", async (req, res) => {
  const { type, category, limitAmount } = req.body;
  const budget = await Budget.findOneAndUpdate(
    { user: req.userId, type, category: category || null },
    { limitAmount },
    { upsert: true, new: true }
  );
  res.status(201).json(budget);
});

router.delete("/:id", async (req, res) => {
  await Budget.deleteOne({ _id: req.params.id, user: req.userId });
  res.json({ ok: true });
});

export default router;
