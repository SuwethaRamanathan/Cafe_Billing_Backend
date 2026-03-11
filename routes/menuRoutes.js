// import express from "express";
// import Menu from "../models/Menu.js";
// import { verifyToken, isAdmin } from "../middleware/auth.js";
// const router = express.Router();

// router.get("/", async (req, res) => {
//   const menu = await Menu.find();
//   res.json(menu);
//  } );

// router.post("/", verifyToken, isAdmin, async (req, res) => {
//   const { name, price, stock } = req.body;

//   if (stock < 0) {
//     return res.status(400).json({
//       msg: "Stock cannot be negative"
//     });
//   }

//   const item = await Menu.create(req.body);
//   res.json(item);
// });

// router.delete("/:id",verifyToken, isAdmin, async (req, res) => {
//     await Menu.findByIdAndDelete(req.params.id);
//     res.json({ message: "Deleted" });
// });

// router.put("/:id",verifyToken, isAdmin, async (req,res)=>{
//   const updated = await Menu.findByIdAndUpdate(
//     req.params.id,
//     req.body,
//     { new:true }
//   );
//   res.json(updated);
// });

// export default router;




import express from "express";
import Menu from "../models/Menu.js";
import { verifyToken, isAdmin } from "../middleware/auth.js";
import mongoose from "mongoose";

const router = express.Router();

// GET — raw collection, bypasses Mongoose schema casting
router.get("/", async (req, res) => {
  const menu = await Menu.collection.find({}).toArray();
  res.json(menu);
});

// POST — insert raw, bypass Mongoose casting
router.post("/", verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, price, stock, category, image, recipe, nameLang = "en" } = req.body;

    if (Number(stock) < 0)
      return res.status(400).json({ msg: "Stock cannot be negative" });

    // Build multilingual name object
    // If admin sends { en, ta, hi } already — use it directly
    // If admin sends a plain string — store in the language they specified
    let nameObj;
    if (typeof name === "object" && name !== null) {
      nameObj = { en: name.en || "", ta: name.ta || "", hi: name.hi || "" };
    } else {
      nameObj = { en: "", ta: "", hi: "" };
      nameObj[nameLang] = name;
    }

    const now = new Date();
    const doc = {
      name: nameObj,
      price: Number(price),
      stock: Number(stock),
      category,
      image,
      recipe: recipe || [],
      thresholdAlertSent: false,
      outOfStockAlertSent: false,
      createdAt: now,
      updatedAt: now,
    };

    const result = await Menu.collection.insertOne(doc);
    res.json({ ...doc, _id: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Create failed" });
  }
});

// PUT — raw updateOne, bypass Mongoose casting
router.put("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, nameLang = "en", price, stock, category, image, recipe } = req.body;
    const _id = new mongoose.Types.ObjectId(req.params.id);

    const updateFields = { updatedAt: new Date() };

    if (name !== undefined) {
      if (typeof name === "object" && name !== null) {
        updateFields.name = { en: name.en || "", ta: name.ta || "", hi: name.hi || "" };
      } else {
        // Get existing name first so we don't wipe other languages
        const existing = await Menu.collection.findOne({ _id });
        const existingName = (existing && typeof existing.name === "object")
          ? existing.name
          : { en: "", ta: "", hi: "" };
        updateFields.name = { ...existingName, [nameLang]: name };
      }
    }

    if (price  !== undefined) updateFields.price    = Number(price);
    if (stock  !== undefined) updateFields.stock    = Number(stock);
    if (category !== undefined) updateFields.category = category;
    if (image  !== undefined) updateFields.image    = image;
    if (recipe !== undefined) updateFields.recipe   = recipe;

    await Menu.collection.updateOne({ _id }, { $set: updateFields });

    const updated = await Menu.collection.findOne({ _id });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Update failed" });
  }
});

// DELETE
router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
  const _id = new mongoose.Types.ObjectId(req.params.id);
  await Menu.collection.deleteOne({ _id });
  res.json({ message: "Deleted" });
});

export default router;




// import express from "express";
// import Menu from "../models/Menu.js";
// import { verifyToken, isAdmin } from "../middleware/auth.js";

// const router = express.Router();

// // Helper: normalize name input from frontend
// // Admin types name as a plain string → we store it as { en: "...", ta: "", hi: "" }
// // or they can pass which language they typed in via nameLang field
// function buildNameObject(nameInput, lang = "en") {
//   // If it's already an object (e.g. from edit), return as-is
//   if (typeof nameInput === "object" && nameInput !== null) return nameInput;

//   // Plain string → store in the language they typed
//   const obj = { en: "", ta: "", hi: "" };
//   obj[lang] = nameInput;
//   return obj;
// }

// router.get("/", async (req, res) => {
//   // Use raw collection to bypass Mongoose casting of name field
//   const menu = await Menu.collection.find({}).toArray();
//   res.json(menu);
// });

// router.post("/", verifyToken, isAdmin, async (req, res) => {
//   const { name, price, stock, nameLang = "en", ...rest } = req.body;

//   if (stock < 0) {
//     return res.status(400).json({ msg: "Stock cannot be negative" });
//   }

//   // Build the multilingual name — only one language filled for now
//   // Super admin will fill the others later via translate panel
//   const nameObj = buildNameObject(name, nameLang);

//   const item = await Menu.create({ name: nameObj, price, stock, ...rest });
//   res.json(item);
// });

// router.put("/:id", verifyToken, isAdmin, async (req, res) => {
//   const { name, nameLang = "en", ...rest } = req.body;

//   let updateData = { ...rest };

//   if (name !== undefined) {
//     updateData.name = buildNameObject(name, nameLang);
//   }

//   const updated = await Menu.findByIdAndUpdate(
//     req.params.id,
//     updateData,
//     { new: true }
//   );
//   res.json(updated);
// });

// router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
//   await Menu.findByIdAndDelete(req.params.id);
//   res.json({ message: "Deleted" });
// });

// export default router;