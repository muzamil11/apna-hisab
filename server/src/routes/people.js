import { Router } from "express";
import Person from "../models/Person.js";
import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const people = await Person.find({ user: req.userId }).sort({ name: 1 });
  const withAccounts = await Promise.all(
    people.map(async (person) => {
      const accounts = await Account.find({ user: req.userId, person: person._id, archived: false });
      return { ...person.toObject(), accounts };
    })
  );
  res.json(withAccounts);
});

router.post("/", async (req, res) => {
  const { name, note } = req.body;
  const person = await Person.create({ user: req.userId, name, note });

  // Every person automatically gets a receivable + payable ledger so lending
  // or borrowing can be recorded the moment they're added, no extra setup step.
  const [receivable, payable] = await Account.create([
    { user: req.userId, name: `${name} owes you`, type: "RECEIVABLE", person: person._id },
    { user: req.userId, name: `You owe ${name}`, type: "PAYABLE", person: person._id },
  ]);

  res.status(201).json({ person, receivable, payable });
});

// Only removable once fully settled — otherwise a real debt could silently
// vanish from net worth instead of being repaid or forgiven on purpose.
router.delete("/:id", async (req, res) => {
  const person = await Person.findOne({ _id: req.params.id, user: req.userId });
  if (!person) return res.status(404).json({ error: "Person not found" });

  const accounts = await Account.find({ user: req.userId, person: person._id });
  if (accounts.some((a) => a.balance !== 0)) {
    return res.status(400).json({ error: "Settle their balance to zero before removing them." });
  }

  await Transaction.deleteMany({ user: req.userId, person: person._id });
  await Account.deleteMany({ _id: { $in: accounts.map((a) => a._id) } });
  await person.deleteOne();
  res.json({ ok: true });
});

export default router;
