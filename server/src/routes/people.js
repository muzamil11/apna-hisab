import { Router } from "express";
import Person from "../models/Person.js";
import Account from "../models/Account.js";
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

  // Every person automatically gets a receivable + payable ledger so "diya"
  // and "liya" can be recorded the moment they're added, no extra setup step.
  const [receivable, payable] = await Account.create([
    { user: req.userId, name: `${name} — udhar diya`, type: "RECEIVABLE", person: person._id },
    { user: req.userId, name: `${name} — udhar liya`, type: "PAYABLE", person: person._id },
  ]);

  res.status(201).json({ person, receivable, payable });
});

export default router;
