import { Router } from "express";
import Transaction from "../models/Transaction.js";
import Account from "../models/Account.js";
import { requireAuth } from "../middleware/auth.js";
import { applyTransactionEffects } from "../utils/ledger.js";

const router = Router();
router.use(requireAuth);

async function assertOwnedAccounts(userId, ids) {
  const filtered = ids.filter(Boolean);
  if (filtered.length === 0) return;
  const count = await Account.countDocuments({ _id: { $in: filtered }, user: userId });
  if (count !== filtered.length) {
    const err = new Error("Account not found");
    err.status = 400;
    throw err;
  }
}

router.get("/", async (req, res) => {
  const { from, to, limit = 200, skip = 0, person } = req.query;
  const query = { user: req.userId };
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);
  }
  if (person) query.person = person;

  const [transactions, total] = await Promise.all([
    Transaction.find(query)
      .sort({ date: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .populate("category person fromAccount toAccount"),
    Transaction.countDocuments(query),
  ]);
  res.json({ transactions, total });
});

router.post("/", async (req, res) => {
  try {
    const { type, amount, date, fromAccount, toAccount, category, person, title, note } = req.body;
    await assertOwnedAccounts(req.userId, [fromAccount, toAccount]);

    const tx = await Transaction.create({
      user: req.userId,
      type,
      amount,
      date: date || new Date(),
      fromAccount: fromAccount || undefined,
      toAccount: toAccount || undefined,
      category: category || undefined,
      person: person || undefined,
      title,
      note,
    });
    await applyTransactionEffects(tx);
    res.status(201).json(tx);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  const tx = await Transaction.findOne({ _id: req.params.id, user: req.userId });
  if (!tx) return res.status(404).json({ error: "Transaction not found" });

  await applyTransactionEffects(tx, { reverse: true });
  await tx.deleteOne();
  res.json({ ok: true });
});

export default router;
