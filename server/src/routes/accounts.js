import { Router } from "express";
import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import { requireAuth } from "../middleware/auth.js";
import { getNetWorth, recomputeAccountBalance, applyTransactionEffects } from "../utils/ledger.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const { netWorth, accounts } = await getNetWorth(req.userId);
  res.json({ netWorth, accounts });
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

router.patch("/:id/archive", async (req, res) => {
  const account = await Account.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    { archived: true },
    { new: true }
  );
  if (!account) return res.status(404).json({ error: "Account not found" });
  res.json(account);
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
