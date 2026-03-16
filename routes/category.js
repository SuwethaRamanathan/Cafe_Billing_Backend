import express from "express";
import mongoose from "mongoose";
import Category from "../models/Category.js";
import Menu from "../models/Menu.js";
import TranslationQueue from "../models/TranslationQueue.js";
import { verifyToken, isAdmin } from "../middleware/auth.js";
import { syncQueue } from "../utils/Queuehelper.js";

const router = express.Router();

// GET — raw collection
router.get("/", async (req, res) => {
  const categories = await Category.collection.find({}).toArray();
  res.json(categories);
});

// POST — add category, sync queue
router.post("/", verifyToken, isAdmin, async (req, res) => {
  const { name, nameLang = "en" } = req.body;
  if (!name) return res.status(400).json({ msg: "Category name required" });

  let nameObj;
  if (typeof name === "object") {
    nameObj = { en: name.en || "", ta: name.ta || "", hi: name.hi || "" };
  } else {
    nameObj = { en: "", ta: "", hi: "" };
    nameObj[nameLang] = name;
  }

  // Check duplicate in entered language
  const exists = await Category.collection.findOne({ [`name.${nameLang}`]: name });
  if (exists) return res.status(400).json({ msg: "Category already exists, name a new category" });

  const result = await Category.collection.insertOne({ name: nameObj });

  // Sync queue — adds to queue if any language missing
  await syncQueue(result.insertedId, "category", nameObj);

  res.json({ _id: result.insertedId, name: nameObj });
});

// PUT — edit category name, sync queue
// When admin edits a category name in one language, the other
// languages are stale — reset them and re-queue for translation.
router.put("/:id", verifyToken, isAdmin, async (req, res) => {
  const { name, nameLang = "en" } = req.body;
  if (!name) return res.status(400).json({ msg: "Category name required" });

  const _id = new mongoose.Types.ObjectId(req.params.id);

  // Check duplicate excluding self
  const exists = await Category.collection.findOne({
    [`name.${nameLang}`]: name,
    _id: { $ne: _id },
  });
  if (exists) return res.status(400).json({ msg: "Category already exists" });

  // Fetch current category to check if name actually changed
  const current = await Category.collection.findOne({ _id });
  const currentName = (current && typeof current.name === "object")
    ? current.name
    : { en: "", ta: "", hi: "" };

  let newNameObj;
  if (name === currentName[nameLang]) {
    // Name didn't change in this language — keep all existing translations
    newNameObj = currentName;
  } else {
    // Name changed → other languages are now outdated → reset them
    newNameObj = { en: "", ta: "", hi: "", [nameLang]: name };
  }

  await Category.collection.updateOne({ _id }, { $set: { name: newNameObj } });

  // Sync queue
  await syncQueue(_id, "category", newNameObj);

  const updated = await Category.collection.findOne({ _id });
  res.json(updated);
});

// DELETE — also remove from translation queue
router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
  const _id = new mongoose.Types.ObjectId(req.params.id);
  const category = await Category.collection.findOne({ _id });
  if (!category) return res.status(404).json({ msg: "Category not found" });

  // Check if any menu items use this category (stored as English name string)
  const catEnName = typeof category.name === "object" ? category.name.en : category.name;
  const itemsExist = await Menu.collection.findOne({ category: catEnName });
  if (itemsExist)
    return res.status(400).json({ msg: "Cannot delete category with items inside" });

  await Category.collection.deleteOne({ _id });

  // Remove from translation queue
  await TranslationQueue.deleteOne({ itemId: _id, type: "category" });

  res.json({ success: true });
});

export default router;




// import express from "express";
// import Category from "../models/Category.js";
// import Menu from "../models/Menu.js";
// import { verifyToken, isAdmin } from "../middleware/auth.js";
// import mongoose from "mongoose";

// const router = express.Router();

// // GET — raw collection
// router.get("/", async (req, res) => {
//   const categories = await Category.collection.find({}).toArray();
//   res.json(categories);
// });

// // POST — add category
// router.post("/", verifyToken, isAdmin, async (req, res) => {
//   const { name, nameLang = "en" } = req.body;
//   if (!name) return res.status(400).json({ msg: "Category name required" });

//   let nameObj;
//   if (typeof name === "object") {
//     nameObj = { en: name.en || "", ta: name.ta || "", hi: name.hi || "" };
//   } else {
//     nameObj = { en: "", ta: "", hi: "" };
//     nameObj[nameLang] = name;
//   }

//   // Check duplicate in entered language
//   const exists = await Category.collection.findOne({ [`name.${nameLang}`]: name });
//   if (exists) return res.status(400).json({ msg: "Category already exists, name a new category" });

//   const result = await Category.collection.insertOne({ name: nameObj });
//   res.json({ _id: result.insertedId, name: nameObj });
// });

// // PUT — edit category
// router.put("/:id", verifyToken, isAdmin, async (req, res) => {
//   const { name, nameLang = "en" } = req.body;
//   if (!name) return res.status(400).json({ msg: "Category name required" });

//   const _id = new mongoose.Types.ObjectId(req.params.id);

//   // Check duplicate excluding self
//   const exists = await Category.collection.findOne({
//     [`name.${nameLang}`]: name,
//     _id: { $ne: _id }
//   });
//   if (exists) return res.status(400).json({ msg: "Category already exists" });

//   await Category.collection.updateOne(
//     { _id },
//     { $set: { [`name.${nameLang}`]: name } }
//   );

//   const updated = await Category.collection.findOne({ _id });
//   res.json(updated);
// });

// // DELETE
// router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
//   const _id = new mongoose.Types.ObjectId(req.params.id);
//   const category = await Category.collection.findOne({ _id });
//   if (!category) return res.status(404).json({ msg: "Category not found" });

//   // Check if any menu items use this category (stored as English name string)
//   const catEnName = typeof category.name === "object" ? category.name.en : category.name;
//   const itemsExist = await Menu.collection.findOne({ category: catEnName });

//   if (itemsExist)
//     return res.status(400).json({ msg: "Cannot delete category with items inside" });

//   await Category.collection.deleteOne({ _id });
//   res.json({ success: true });
// });

// export default router;
