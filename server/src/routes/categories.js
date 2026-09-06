import { Router } from "express";
import Category from "../models/Category.js";
import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const categories = await Category.find({ user: req.userId }).sort({ direction: 1, name: 1 });
  res.json(categories);
});

router.post("/", async (req, res) => {
  const { name, direction, essential = true } = req.body;
  const category = await Category.create({ user: req.userId, name, direction, essential });
  res.status(201).json(category);
});

// Rename only — direction isn't editable here since flipping it out from
// under past transactions would leave them mismatched with their own history.
router.patch("/:id", async (req, res) => {
  const { name } = req.body;
  const category = await Category.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    { name },
    { new: true }
  );
  if (!category) return res.status(404).json({ error: "Category not found" });
  res.json(category);
});

// Only removable once nothing references it — otherwise past transactions
// and budgets would be left pointing at a category that no longer exists.
router.delete("/:id", async (req, res) => {
  const category = await Category.findOne({ _id: req.params.id, user: req.userId });
  if (!category) return res.status(404).json({ error: "Category not found" });

  const [txCount, budgetCount] = await Promise.all([
    Transaction.countDocuments({ user: req.userId, category: category._id }),
    Budget.countDocuments({ user: req.userId, category: category._id }),
  ]);
  if (txCount > 0 || budgetCount > 0) {
    return res.status(400).json({ error: "This category is still used by transactions or a budget — can't remove it." });
  }

  await category.deleteOne();
  res.json({ ok: true });
});

export default router;
