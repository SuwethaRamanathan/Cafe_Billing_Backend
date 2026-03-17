// import express from "express";
// import Menu from "../models/Menu.js";
// import { verifyToken, isAdmin } from "../middleware/auth.js";
// import mongoose from "mongoose";

// const router = express.Router();

// // GET — raw collection, bypasses Mongoose schema casting
// router.get("/", async (req, res) => {
//   const menu = await Menu.collection.find({}).toArray();
//   res.json(menu);
// });

// // POST — insert raw, bypass Mongoose casting
// router.post("/", verifyToken, isAdmin, async (req, res) => {
//   try {
//     const { name, price, stock, category, image, recipe, nameLang = "en" } = req.body;

//     if (Number(stock) < 0)
//       return res.status(400).json({ msg: "Stock cannot be negative" });

//     // Build multilingual name object
//     // If admin sends { en, ta, hi } already — use it directly
//     // If admin sends a plain string — store in the language they specified
//     let nameObj;
//     if (typeof name === "object" && name !== null) {
//       nameObj = { en: name.en || "", ta: name.ta || "", hi: name.hi || "" };
//     } else {
//       nameObj = { en: "", ta: "", hi: "" };
//       nameObj[nameLang] = name;
//     }

//     const now = new Date();
//     const doc = {
//       name: nameObj,
//       price: Number(price),
//       stock: Number(stock),
//       category,
//       image,
//       recipe: recipe || [],
//       thresholdAlertSent: false,
//       outOfStockAlertSent: false,
//       createdAt: now,
//       updatedAt: now,
//     };

//     const result = await Menu.collection.insertOne(doc);
//     res.json({ ...doc, _id: result.insertedId });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: "Create failed" });
//   }
// });

// // PUT — raw updateOne, bypass Mongoose casting
// router.put("/:id", verifyToken, isAdmin, async (req, res) => {
//   try {
//     const { name, nameLang = "en", price, stock, category, image, recipe } = req.body;
//     const _id = new mongoose.Types.ObjectId(req.params.id);

//     const updateFields = { updatedAt: new Date() };

//     if (name !== undefined) {
//       if (typeof name === "object" && name !== null) {
//         updateFields.name = { en: name.en || "", ta: name.ta || "", hi: name.hi || "" };
//       } else {
//         // Get existing name first so we don't wipe other languages
//         const existing = await Menu.collection.findOne({ _id });
//         const existingName = (existing && typeof existing.name === "object")
//           ? existing.name
//           : { en: "", ta: "", hi: "" };
//         updateFields.name = { ...existingName, [nameLang]: name };
//       }
//     }

//     if (price  !== undefined) updateFields.price    = Number(price);
//     if (stock  !== undefined) updateFields.stock    = Number(stock);
//     if (category !== undefined) updateFields.category = category;
//     if (image  !== undefined) updateFields.image    = image;
//     if (recipe !== undefined) updateFields.recipe   = recipe;

//     await Menu.collection.updateOne({ _id }, { $set: updateFields });

//     const updated = await Menu.collection.findOne({ _id });
//     res.json(updated);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: "Update failed" });
//   }
// });

// // DELETE
// router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
//   const _id = new mongoose.Types.ObjectId(req.params.id);
//   await Menu.collection.deleteOne({ _id });
//   res.json({ message: "Deleted" });
// });

// export default router;




import express from "express";
import mongoose from "mongoose";
import Menu from "../models/Menu.js";
import { verifyToken, isAdmin } from "../middleware/auth.js";
import { syncQueue } from "../utils/Queuehelper.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const menu = await Menu.collection.find({}).toArray();
  res.json(menu);
});


router.post("/", verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, price, stock, category, image, recipe, nameLang = "en" } = req.body;

    if (Number(stock) < 0)
      return res.status(400).json({ msg: "Stock cannot be negative" });

    let nameObj;
    if (typeof name === "object" && name !== null) {
      nameObj = { en: name.en || "", ta: name.ta || "", hi: name.hi || "" };
    } else {
      nameObj = { en: "", ta: "", hi: "" };
      nameObj[nameLang] = name || "";
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
    const insertedId = result.insertedId;


    await syncQueue(insertedId, "menu", nameObj);

    res.json({ ...doc, _id: insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Create failed" });
  }
});


router.put("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, nameLang = "en", price, stock, category, image, recipe } = req.body;
    const _id = new mongoose.Types.ObjectId(req.params.id);

    const updateFields = { updatedAt: new Date() };
    let nameObj = null;

    if (name !== undefined) {
      if (typeof name === "object" && name !== null) {
        // Admin sent a full { en, ta, hi } object
        nameObj = { en: name.en || "", ta: name.ta || "", hi: name.hi || "" };
      } else {
        
        const existing = await Menu.collection.findOne({ _id });
        const existingName = (existing && typeof existing.name === "object")
          ? existing.name
          : { en: "", ta: "", hi: "" };

        nameObj = { en: "", ta: "", hi: "", [nameLang]: name };

        
        if (nameLang === "en" && name === existingName.en) {
          nameObj = existingName;
        } else if (nameLang !== "en" && name === existingName[nameLang]) {
          nameObj = existingName;
        }
      }
      updateFields.name = nameObj;
    }

    if (price    !== undefined) updateFields.price    = Number(price);
    if (stock    !== undefined) updateFields.stock    = Number(stock);
    if (category !== undefined) updateFields.category = category;
    if (image    !== undefined) updateFields.image    = image;
    if (recipe   !== undefined) updateFields.recipe   = recipe;

    await Menu.collection.updateOne({ _id }, { $set: updateFields });

    
    if (nameObj) {
      await syncQueue(_id, "menu", nameObj);
    } else {
      const updated = await Menu.collection.findOne({ _id });
      if (updated?.name) await syncQueue(_id, "menu", updated.name);
    }

    const updated = await Menu.collection.findOne({ _id });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Update failed" });
  }
});

// DELETE
router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const _id = new mongoose.Types.ObjectId(req.params.id);
    await Menu.collection.deleteOne({ _id });

    const { syncQueue: sq } = await import("../utils/Queuehelper.js");
    const TranslationQueue = (await import("../models/TranslationQueue.js")).default;
    await TranslationQueue.deleteOne({ itemId: _id, type: "menu" });

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Delete failed" });
  }
});

export default router;