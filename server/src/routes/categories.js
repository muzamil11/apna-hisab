import { Router } from "express";
import Category from "../models/Category.js";
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

export default router;
