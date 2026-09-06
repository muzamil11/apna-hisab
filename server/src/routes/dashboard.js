import { Router } from "express";
import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";
import { requireAuth } from "../middleware/auth.js";
import { getNetWorth } from "../utils/ledger.js";

const router = Router();
router.use(requireAuth);

router.get("/summary", async (req, res) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const userId = new mongoose.Types.ObjectId(req.userId);

  const [totals, byCategory, { netWorth }, budgets] = await Promise.all([
    Transaction.aggregate([
      { $match: { user: userId, date: { $gte: start, $lt: end }, type: { $in: ["INCOME", "EXPENSE"] } } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]),
    Transaction.aggregate([
      { $match: { user: userId, date: { $gte: start, $lt: end }, type: "EXPENSE" } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
      { $unwind: "$category" },
      { $project: { _id: 0, category: "$category.name", total: 1 } },
      { $sort: { total: -1 } },
    ]),
    getNetWorth(req.userId),
    Budget.find({ user: req.userId }).populate("category"),
  ]);

  const income = totals.find((t) => t._id === "INCOME")?.total || 0;
  const expense = totals.find((t) => t._id === "EXPENSE")?.total || 0;

  const budgetStatus = budgets.map((budget) => {
    if (budget.type === "SPEND_CAP") {
      const spent = byCategory.find((c) => c.category === budget.category?.name)?.total || 0;
      return { budget, spent, exceeded: spent > budget.limitAmount, level: "red" };
    }
    const saved = income - expense;
    return { budget, saved, missed: saved < budget.limitAmount, level: "yellow" };
  });

  res.json({
    month: { income, expense, saved: income - expense },
    byCategory,
    netWorth,
    budgetStatus,
  });
});

export default router;
