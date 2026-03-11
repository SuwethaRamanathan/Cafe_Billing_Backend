// import express from "express";
// import Category from "../models/Category.js";
// import { verifyToken, isAdmin } from "../middleware/auth.js";
// import Menu from "../models/Menu.js";

// const router = express.Router();

// router.get("/", async (req, res) => {
//   const categories = await Category.find().sort({ name: 1 });
//   res.json(categories);
// });

// router.post("/", verifyToken, isAdmin, async (req, res) => {
//   const { name } = req.body;

//   if (!name)
//     return res.status(400).json({ msg: "Category name required" });

//   const exists = await Category.findOne({ name });
//   if (exists)
//     return res.status(400).json({ msg: "Category already exists, name a new category" });

//   const category = await Category.create({ name });
//   res.json(category);
// });

// router.put("/:id", verifyToken, isAdmin, async (req, res) => {
//   const { name } = req.body;

//   if (!name)
//     return res.status(400).json({ msg: "Category name required" });

//   const exists = await Category.findOne({
//     name,
//     _id: { $ne: req.params.id }
//   });

//   if (exists)
//     return res.status(400).json({ msg: "Category already exists" });

//   const category = await Category.findByIdAndUpdate(
//     req.params.id,
//     { name },
//     { new: true }
//   );

//   res.json(category);
// });


// router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
//   const category = await Category.findById(req.params.id);
//   if (!category)
//     return res.status(404).json({ msg: "Category not found" });

//   const itemsExist = await Menu.exists({
//     category: category.name
//   });

//   if (itemsExist) {
//     return res.status(400).json({
//       msg: "Cannot delete category with items inside"
//     });
//   }

//   await category.deleteOne();
//   res.json({ success: true });
// });
// export default router;




import express from "express";
import Category from "../models/Category.js";
import { verifyToken, isAdmin } from "../middleware/auth.js";
import Menu from "../models/Menu.js";

const router = express.Router();

function buildNameObject(nameInput, lang = "en") {
  if (typeof nameInput === "object" && nameInput !== null) return nameInput;
  const obj = { en: "", ta: "", hi: "" };
  obj[lang] = nameInput;
  return obj;
}

// GET all categories
router.get("/", async (req, res) => {
  // Use raw collection to bypass Mongoose casting of name field
  const categories = await Category.collection.find({}).sort({ "name.en": 1 }).toArray();
  res.json(categories);
});

// POST - add new category
router.post("/", verifyToken, isAdmin, async (req, res) => {
  const { name, nameLang = "en" } = req.body;
  if (!name) return res.status(400).json({ msg: "Category name required" });

  const nameObj = buildNameObject(name, nameLang);

  // Check for duplicate in the entered language
  const exists = await Category.findOne({ [`name.${nameLang}`]: name });
  if (exists) return res.status(400).json({ msg: "Category already exists" });

  const category = await Category.create({ name: nameObj });
  res.json(category);
});

// PUT - edit category name
router.put("/:id", verifyToken, isAdmin, async (req, res) => {
  const { name, nameLang = "en" } = req.body;
  if (!name) return res.status(400).json({ msg: "Category name required" });

  // Check duplicate excluding self
  const exists = await Category.findOne({
    [`name.${nameLang}`]: name,
    _id: { $ne: req.params.id }
  });
  if (exists) return res.status(400).json({ msg: "Category already exists" });

  // Only update the specific language field, keep others
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { [`name.${nameLang}`]: name },
    { new: true }
  );
  res.json(category);
});

// DELETE - only if no menu items use this category
router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ msg: "Category not found" });

  // Check against all language versions of the category name
  const catNames = Object.values(category.name).filter(Boolean);
  const itemsExist = await Menu.exists({ category: { $in: catNames } });

  if (itemsExist) {
    return res.status(400).json({ msg: "Cannot delete category with items inside" });
  }

  await category.deleteOne();
  res.json({ success: true });
});

export default router;



// import express from "express";
// import Category from "../models/Category.js";
// import { verifyToken, isAdmin } from "../middleware/auth.js";
// import Menu from "../models/Menu.js";

// const router = express.Router();

// function buildNameObject(nameInput, lang = "en") {
//   if (typeof nameInput === "object" && nameInput !== null) return nameInput;
//   const obj = { en: "", ta: "", hi: "" };
//   obj[lang] = nameInput;
//   return obj;
// }

// // GET all categories
// router.get("/", async (req, res) => {
//   const categories = await Category.find();
//   res.json(categories);
// });

// // POST - add new category
// router.post("/", verifyToken, isAdmin, async (req, res) => {
//   const { name, nameLang = "en" } = req.body;
//   if (!name) return res.status(400).json({ msg: "Category name required" });

//   const nameObj = buildNameObject(name, nameLang);

//   // Check for duplicate in the entered language
//   const exists = await Category.findOne({ [`name.${nameLang}`]: name });
//   if (exists) return res.status(400).json({ msg: "Category already exists" });

//   const category = await Category.create({ name: nameObj });
//   res.json(category);
// });

// // PUT - edit category name
// router.put("/:id", verifyToken, isAdmin, async (req, res) => {
//   const { name, nameLang = "en" } = req.body;
//   if (!name) return res.status(400).json({ msg: "Category name required" });

//   // Check duplicate excluding self
//   const exists = await Category.findOne({
//     [`name.${nameLang}`]: name,
//     _id: { $ne: req.params.id }
//   });
//   if (exists) return res.status(400).json({ msg: "Category already exists" });

//   // Only update the specific language field, keep others
//   const category = await Category.findByIdAndUpdate(
//     req.params.id,
//     { [`name.${nameLang}`]: name },
//     { new: true }
//   );
//   res.json(category);
// });

// // DELETE - only if no menu items use this category
// router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
//   const category = await Category.findById(req.params.id);
//   if (!category) return res.status(404).json({ msg: "Category not found" });

//   // Check against all language versions of the category name
//   const catNames = Object.values(category.name).filter(Boolean);
//   const itemsExist = await Menu.exists({ category: { $in: catNames } });

//   if (itemsExist) {
//     return res.status(400).json({ msg: "Cannot delete category with items inside" });
//   }

//   await category.deleteOne();
//   res.json({ success: true });
// });

// export default router;