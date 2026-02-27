import express from "express";
import Category from "../models/Category.js";
import { verifyToken, isAdmin } from "../middleware/auth.js";
import Menu from "../models/Menu.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.json(categories);
});

router.post("/", verifyToken, isAdmin, async (req, res) => {
  const { name } = req.body;

  if (!name)
    return res.status(400).json({ msg: "Category name required" });

  const exists = await Category.findOne({ name });
  if (exists)
    return res.status(400).json({ msg: "Category already exists, name a new category" });

  const category = await Category.create({ name });
  res.json(category);
});

router.put("/:id", verifyToken, isAdmin, async (req, res) => {
  const { name } = req.body;

  if (!name)
    return res.status(400).json({ msg: "Category name required" });

  const exists = await Category.findOne({
    name,
    _id: { $ne: req.params.id }
  });

  if (exists)
    return res.status(400).json({ msg: "Category already exists" });

  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { name },
    { new: true }
  );

  res.json(category);
});


router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category)
    return res.status(404).json({ msg: "Category not found" });

  const itemsExist = await Menu.exists({
    category: category.name
  });

  if (itemsExist) {
    return res.status(400).json({
      msg: "Cannot delete category with items inside"
    });
  }

  await category.deleteOne();
  res.json({ success: true });
});
export default router;