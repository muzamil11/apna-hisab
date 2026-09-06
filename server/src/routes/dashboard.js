import { Router } from "express";
import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";
import { requireAuth } from "../middleware/auth.js";
import { getNetWorth, getNetWorthHistory } from "../utils/ledger.js";

const router = Router();
router.use(requireAuth);

router.get("/summary", async (req, res) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const userId = new mongoose.Types.ObjectId(req.userId);

  const [totals, byCategory, { netWorth }, budgets, history] = await Promise.all([
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
    getNetWorthHistory(req.userId, 1), // just last month's close, for the "vs last month" delta
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
    netWorthLastMonth: history[0].netWorth,
    budgetStatus,
  });
});

router.get("/networth-history", async (req, res) => {
  const months = Math.min(60, Math.max(1, Number(req.query.months) || 6));
  const points = await getNetWorthHistory(req.userId, months);
  res.json(points);
});

router.get("/monthly-trend", async (req, res) => {
  const months = Math.min(60, Math.max(1, Number(req.query.months) || 6));
  const userId = new mongoose.Types.ObjectId(req.userId);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

  const rows = await Transaction.aggregate([
    { $match: { user: userId, date: { $gte: start }, type: { $in: ["INCOME", "EXPENSE"] } } },
    {
      $group: {
        _id: { year: { $year: "$date" }, month: { $month: "$date" }, type: "$type" },
        total: { $sum: "$amount" },
      },
    },
  ]);

  const points = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const find = (type) =>
      rows.find((r) => r._id.year === d.getFullYear() && r._id.month === d.getMonth() + 1 && r._id.type === type)
        ?.total || 0;
    points.push({
      // Beyond a year, "Jan Feb Mar..." repeats every 12 points with no way
      // to tell which year — add the year once ranges get that long.
      label: d.toLocaleDateString("en-PK", months > 12 ? { month: "short", year: "2-digit" } : { month: "short" }),
      income: find("INCOME"),
      expense: find("EXPENSE"),
    });
  }

  res.json(points);
});

export default router;
