import { Router } from "express";
import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import { requireAuth } from "../middleware/auth.js";
import { getNetWorth, recomputeAccountBalance, applyTransactionEffects } from "../utils/ledger.js";
import { getCardSummary, getStatementHistory } from "../utils/creditCard.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const { netWorth, accounts } = await getNetWorth(req.userId);

  const withSummaries = await Promise.all(
    accounts.map(async (account) => {
      if (account.type !== "CREDIT_CARD") return account.toObject();
      const cardSummary = await getCardSummary(Transaction, account);
      return { ...account.toObject(), cardSummary };
    })
  );

  res.json({ netWorth, accounts: withSummaries });
});

router.post("/", async (req, res) => {
  const { name, type, person, meta, startingBalance } = req.body;
  const account = await Account.create({ user: req.userId, name, type, person, meta });

  // A starting balance is recorded as a real transaction (not a raw balance
  // write) so it stays consistent with recomputeAccountBalance and shows up
  // in history — an asset account "receives" it, a liability "owes" it already.
  const amount = Number(startingBalance);
  if (amount) {
    const tx = await Transaction.create({
      user: req.userId,
      type: account.kind === "LIABILITY" ? "EXPENSE" : "INCOME",
      amount: Math.abs(amount),
      title: "Starting balance",
      toAccount: account.kind === "LIABILITY" ? undefined : account._id,
      fromAccount: account.kind === "LIABILITY" ? account._id : undefined,
    });
    await applyTransactionEffects(tx);
  }

  res.status(201).json(await Account.findById(account._id));
});

// Rename only — type/kind aren't editable since they'd change how the
// polarity math already applied to past transactions should be read.
router.patch("/:id", async (req, res) => {
  const { name } = req.body;
  const account = await Account.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    { name },
    { new: true }
  );
  if (!account) return res.status(404).json({ error: "Account not found" });
  res.json(account);
});

router.get("/archived", async (req, res) => {
  const accounts = await Account.find({ user: req.userId, archived: true }).sort({ updatedAt: -1 });
  res.json(accounts);
});

router.patch("/:id/archive", async (req, res) => {
  const account = await Account.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    { archived: true },
    { new: true }
  );
  if (!account) return res.status(404).json({ error: "Account not found" });
  res.json(account);
});

router.patch("/:id/unarchive", async (req, res) => {
  const account = await Account.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    { archived: false },
    { new: true }
  );
  if (!account) return res.status(404).json({ error: "Account not found" });
  res.json(account);
});

router.get("/:id/statements", async (req, res) => {
  const account = await Account.findOne({ _id: req.params.id, user: req.userId, type: "CREDIT_CARD" });
  if (!account) return res.status(404).json({ error: "Card not found" });
  const months = Math.min(24, Math.max(1, Number(req.query.months) || 6));
  const statements = await getStatementHistory(Transaction, account, months);
  res.json(statements);
});

// Safety valve: recompute a balance from the full transaction ledger if it
// ever looks wrong, rather than trusting the cached balance blindly.
router.post("/:id/recompute", async (req, res) => {
  const owned = await Account.exists({ _id: req.params.id, user: req.userId });
  if (!owned) return res.status(404).json({ error: "Account not found" });
  const account = await recomputeAccountBalance(req.params.id);
  res.json(account);
});

export default router;
