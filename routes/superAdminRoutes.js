import express from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Menu from "../models/Menu.js";
import Category from "../models/Category.js";
import Grocery from "../models/Grocery.js";
import User from "../models/User.js";
import TranslationQueue from "../models/TranslationQueue.js";
import { verifyToken, isSuperAdmin } from "../middleware/auth.js";
import { syncQueue, isFullyTranslated } from "../utils/queueHelper.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────
// GET /api/superadmin/untranslated
//
// OLD approach: scan entire Menu + Category + Grocery collections.
// NEW approach: read ONLY from TranslationQueue.
//
// The queue is kept perfectly in sync by menuRoutes, categories,
// and groceryRoutes — so no full-DB scan is ever needed here.
// ─────────────────────────────────────────────────────────
router.get("/untranslated", verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const queue = await TranslationQueue.find({}).sort({ requestedAt: -1 }).lean();

    const result = { menu: [], categories: [], groceries: [] };

    for (const entry of queue) {
      const item = {
        _id:  entry.itemId,   // the real document _id for save operations
        qid:  entry._id,      // queue entry _id (for removal after translate)
        name: entry.name,
        type: entry.type,
      };
      if (entry.type === "menu")     result.menu.push(item);
      if (entry.type === "category") result.categories.push(item);
      if (entry.type === "grocery")  result.groceries.push(item);
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ─────────────────────────────────────────────────────────
// PUT /api/superadmin/save-translation
//
// Browser translates via MyMemory, sends completed { en, ta, hi } here.
// 1. Save translated name to the source document (Menu/Category/Grocery).
// 2. If fully translated → remove from queue.
//    If still missing → update queue entry with new values.
// ─────────────────────────────────────────────────────────
router.put("/save-translation", verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const { id, type, name } = req.body;

    if (!name || typeof name !== "object")
      return res.status(400).json({ msg: "name must be {en, ta, hi} object" });

    const Model = type === "menu" ? Menu : type === "category" ? Category : Grocery;
    const _id   = new mongoose.Types.ObjectId(id);

    const nameObj = { en: name.en || "", ta: name.ta || "", hi: name.hi || "" };

    // 1. Save to source collection
    await Model.collection.updateOne({ _id }, { $set: { name: nameObj } });

    // 2. Sync queue — removes if fully translated, updates otherwise
    await syncQueue(_id, type, nameObj);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Save failed" });
  }
});

// ─────────────────────────────────────────────────────────
// PUT /api/superadmin/manual-translate
//
// SuperAdmin edits a single language field manually.
// After saving, check if all 3 langs are now complete:
//   yes → remove from queue (done!)
//   no  → update queue entry with new partial values
// ─────────────────────────────────────────────────────────
router.put("/manual-translate", verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const { id, type, lang, value } = req.body;

    if (!["en", "ta", "hi"].includes(lang))
      return res.status(400).json({ msg: "Invalid language" });

    const Model = type === "menu" ? Menu : type === "category" ? Category : Grocery;
    const _id   = new mongoose.Types.ObjectId(id);

    // Update the specific language field in the source document
    await Model.collection.updateOne(
      { _id },
      { $set: { [`name.${lang}`]: value.trim() } }
    );

    // Fetch the updated document to get the full name object
    const updated = await Model.collection.findOne({ _id });
    const nameObj = updated?.name || { en: "", ta: "", hi: "" };

    // Sync queue — if all 3 languages filled, removes from queue
    await syncQueue(_id, type, nameObj);

    res.json({
      success:        true,
      name:           nameObj,
      fullyTranslated: isFullyTranslated(nameObj),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Manual update failed" });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/superadmin/migrate
//
// One-time migration: converts old { name: "string" } documents
// to { name: { en: "string", ta: "", hi: "" } } format,
// and adds them to the TranslationQueue.
// ─────────────────────────────────────────────────────────
router.post("/migrate", verifyToken, isSuperAdmin, async (req, res) => {
  try {
    let migrated = 0;

    const migrateCollection = async (Model, type) => {
      const oldItems = await Model.collection.find({ name: { $type: "string" } }).toArray();
      for (const item of oldItems) {
        const nameObj = { en: item.name, ta: "", hi: "" };
        await Model.collection.updateOne(
          { _id: item._id },
          { $set: { name: nameObj } }
        );
        // Add to queue — will need translation
        await syncQueue(item._id, type, nameObj);
        migrated++;
      }
    };

    await migrateCollection(Menu,     "menu");
    await migrateCollection(Category, "category");
    await migrateCollection(Grocery,  "grocery");

    res.json({ success: true, migrated, msg: `Migrated ${migrated} items to multilingual format` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Migration failed" });
  }
});

// ─────────────────────────────────────────────────────────
// USER MANAGEMENT — unchanged from original
// ─────────────────────────────────────────────────────────

router.get("/users", verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to fetch users" });
  }
});

router.delete("/users/:id", verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.role === "superadmin")
      return res.status(403).json({ msg: "Cannot delete a superadmin account" });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, msg: `${user.name} has been removed` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Delete failed" });
  }
});

router.put("/users/:id/role", verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["admin", "cashier"].includes(role))
      return res.status(400).json({ msg: "Role must be admin or cashier" });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.role === "superadmin")
      return res.status(403).json({ msg: "Cannot change superadmin role" });
    user.role = role;
    await user.save();
    res.json({ success: true, msg: `${user.name} is now ${role}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Role update failed" });
  }
});

router.put("/users/:id/reset-password", verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ msg: "Password must be at least 6 characters" });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.role === "superadmin")
      return res.status(403).json({ msg: "Cannot reset superadmin password via this route" });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true, msg: `Password updated for ${user.name}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Password reset failed" });
  }
});

export default router;




// import express from "express";
// import bcrypt from "bcryptjs";
// import Menu from "../models/Menu.js";
// import Category from "../models/Category.js";
// import Grocery from "../models/Grocery.js";
// import User from "../models/User.js";
// import { verifyToken, isSuperAdmin } from "../middleware/auth.js";
// import { isMissingTranslations } from "../utils/translate.js";

// const router = express.Router();


// router.get("/untranslated", verifyToken, isSuperAdmin, async (req, res) => {
//   try {
//     const [menuItems, categories, groceries] = await Promise.all([
//       Menu.collection.find({}).toArray(),
//       Category.collection.find({}).toArray(),
//       Grocery.collection.find({}).toArray(),
//     ]);

//     res.json({
//       menu: menuItems
//         .filter(i => isMissingTranslations(i.name))
//         .map(i => ({ _id: i._id, name: i.name, type: "menu" })),
//       categories: categories
//         .filter(i => isMissingTranslations(i.name))
//         .map(i => ({ _id: i._id, name: i.name, type: "category" })),
//       groceries: groceries
//         .filter(i => isMissingTranslations(i.name))
//         .map(i => ({ _id: i._id, name: i.name, type: "grocery" })),
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: "Server error" });
//   }
// });

// // Browser translates via MyMemory, then sends completed {en, ta, hi} here to save
// router.put("/save-translation", verifyToken, isSuperAdmin, async (req, res) => {
//   try {
//     const { id, type, name } = req.body;
//     if (!name || typeof name !== "object")
//       return res.status(400).json({ msg: "name must be {en, ta, hi} object" });

//     const Model     = type === "menu" ? Menu : type === "category" ? Category : Grocery;
//     const mongoose  = await import("mongoose");
//     const _id       = new mongoose.default.Types.ObjectId(id);

//     await Model.collection.updateOne(
//       { _id },
//       { $set: { name: { en: name.en || "", ta: name.ta || "", hi: name.hi || "" } } }
//     );
//     res.json({ success: true });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: "Save failed" });
//   }
// });

// router.put("/manual-translate", verifyToken, isSuperAdmin, async (req, res) => {
//   try {
//     const { id, type, lang, value } = req.body;
//     if (!["en", "ta", "hi"].includes(lang))
//       return res.status(400).json({ msg: "Invalid language" });

//     const Model = type === "menu" ? Menu : type === "category" ? Category : Grocery;
//     const item  = await Model.findByIdAndUpdate(
//       id, { [`name.${lang}`]: value }, { new: true }
//     );
//     res.json({ success: true, name: item.name });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: "Manual update failed" });
//   }
// });

// router.post("/migrate", verifyToken, isSuperAdmin, async (req, res) => {
//   try {
//     let migrated = 0;

//     const migrateCollection = async (Model) => {
//       const oldItems = await Model.collection.find({ name: { $type: "string" } }).toArray();
//       for (const item of oldItems) {
//         await Model.collection.updateOne(
//           { _id: item._id },
//           { $set: { name: { en: item.name, ta: "", hi: "" } } }
//         );
//         migrated++;
//       }
//     };

//     await migrateCollection(Menu);
//     await migrateCollection(Category);
//     await migrateCollection(Grocery);

//     res.json({ success: true, migrated, msg: `Migrated ${migrated} items to multilingual format` });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: "Migration failed" });
//   }
// });

// router.get("/users", verifyToken, isSuperAdmin, async (req, res) => {
//   try {
//     const users = await User.find({}).select("-password").sort({ createdAt: -1 });
//     res.json(users);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: "Failed to fetch users" });
//   }
// });

// router.delete("/users/:id", verifyToken, isSuperAdmin, async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id);
//     if (!user)
//       return res.status(404).json({ msg: "User not found" });

//     if (user.role === "superadmin")
//       return res.status(403).json({ msg: "Cannot delete a superadmin account" });

//     await User.findByIdAndDelete(req.params.id);
//     res.json({ success: true, msg: `${user.name} has been removed` });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: "Delete failed" });
//   }
// });

// router.put("/users/:id/role", verifyToken, isSuperAdmin, async (req, res) => {
//   try {
//     const { role } = req.body;

//     if (!["admin", "cashier"].includes(role))
//       return res.status(400).json({ msg: "Role must be admin or cashier" });

//     const user = await User.findById(req.params.id);
//     if (!user)
//       return res.status(404).json({ msg: "User not found" });

//     if (user.role === "superadmin")
//       return res.status(403).json({ msg: "Cannot change superadmin role" });

//     user.role = role;
//     await user.save();

//     res.json({ success: true, msg: `${user.name} is now ${role}` });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: "Role update failed" });
//   }
// });

// router.put("/users/:id/reset-password", verifyToken, isSuperAdmin, async (req, res) => {
//   try {
//     const { newPassword } = req.body;

//     if (!newPassword || newPassword.length < 6)
//       return res.status(400).json({ msg: "Password must be at least 6 characters" });

//     const user = await User.findById(req.params.id);
//     if (!user)
//       return res.status(404).json({ msg: "User not found" });

//     if (user.role === "superadmin")
//       return res.status(403).json({ msg: "Cannot reset superadmin password via this route" });

//     user.password = await bcrypt.hash(newPassword, 10);
//     await user.save();

//     res.json({ success: true, msg: `Password updated for ${user.name}` });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: "Password reset failed" });
//   }
// });

// export default router;
