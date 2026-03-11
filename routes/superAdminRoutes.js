// import express from "express";
// import Menu from "../models/Menu.js";
// import Category from "../models/Category.js";
// import Grocery from "../models/Grocery.js";
// import { verifyToken, isSuperAdmin } from "../middleware/auth.js";
// import { translateToAll, isMissingTranslations, detectFilledLanguage } from "../utils/translate.js";

// const router = express.Router();

// // ─────────────────────────────────────────────
// // GET /api/superadmin/untranslated
// // Returns all items that are missing ta or hi translations
// // Super admin sees this list in their dashboard
// // ─────────────────────────────────────────────
// router.get("/untranslated", verifyToken, isSuperAdmin, async (req, res) => {
//   try {
//     const [menuItems, categories, groceries] = await Promise.all([
//       Menu.find(),
//       Category.find(),
//       Grocery.find(),
//     ]);

//     const result = {
//       menu: menuItems
//         .filter(item => isMissingTranslations(item.name))
//         .map(item => ({
//           _id: item._id,
//           name: item.name,
//           type: "menu"
//         })),

//       categories: categories
//         .filter(cat => isMissingTranslations(cat.name))
//         .map(cat => ({
//           _id: cat._id,
//           name: cat.name,
//           type: "category"
//         })),

//       groceries: groceries
//         .filter(g => isMissingTranslations(g.name))
//         .map(g => ({
//           _id: g._id,
//           name: g.name,
//           type: "grocery"
//         })),
//     };

//     res.json(result);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: "Server error" });
//   }
// });


// // ─────────────────────────────────────────────
// // POST /api/superadmin/translate-one
// // Translate a single item
// // Body: { id, type: "menu" | "category" | "grocery" }
// // ─────────────────────────────────────────────
// router.post("/translate-one", verifyToken, isSuperAdmin, async (req, res) => {
//   try {
//     const { id, type } = req.body;

//     const Model = type === "menu" ? Menu : type === "category" ? Category : Grocery;

//     const item = await Model.findById(id);
//     if (!item) return res.status(404).json({ msg: "Item not found" });

//     // Figure out which language the admin typed in
//     const sourceLang = detectFilledLanguage(item.name);
//     const sourceText = item.name[sourceLang];

//     if (!sourceText) {
//       return res.status(400).json({ msg: "No text found to translate" });
//     }

//     // Translate to all languages
//     const translated = await translateToAll(sourceText, sourceLang);

//     // Merge — don't overwrite languages that already have content
//     const updatedName = {
//       en: item.name.en?.trim() || translated.en,
//       ta: item.name.ta?.trim() || translated.ta,
//       hi: item.name.hi?.trim() || translated.hi,
//     };

//     item.name = updatedName;
//     await item.save();

//     res.json({ success: true, name: updatedName });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: "Translation failed" });
//   }
// });


// // ─────────────────────────────────────────────
// // POST /api/superadmin/translate-all
// // Translate ALL untranslated items at once
// // ─────────────────────────────────────────────
// router.post("/translate-all", verifyToken, isSuperAdmin, async (req, res) => {
//   try {
//     const { type } = req.body; // "menu", "category", "grocery", or "all"

//     let results = { menu: 0, categories: 0, groceries: 0, errors: 0 };

//     const translateCollection = async (Model, countKey) => {
//       const items = await Model.find();
//       for (const item of items) {
//         if (!isMissingTranslations(item.name)) continue; // skip if already translated
//         try {
//           const sourceLang = detectFilledLanguage(item.name);
//           const sourceText = item.name[sourceLang];
//           if (!sourceText) continue;

//           const translated = await translateToAll(sourceText, sourceLang);
//           item.name = {
//             en: item.name.en?.trim() || translated.en,
//             ta: item.name.ta?.trim() || translated.ta,
//             hi: item.name.hi?.trim() || translated.hi,
//           };
//           await item.save();
//           results[countKey]++;

//           // Small delay to avoid rate limiting on free LibreTranslate
//           await new Promise(r => setTimeout(r, 300));
//         } catch (err) {
//           console.error(`Failed to translate ${item._id}:`, err.message);
//           results.errors++;
//         }
//       }
//     };

//     if (type === "menu" || type === "all") await translateCollection(Menu, "menu");
//     if (type === "category" || type === "all") await translateCollection(Category, "categories");
//     if (type === "grocery" || type === "all") await translateCollection(Grocery, "groceries");

//     res.json({ success: true, results });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: "Bulk translation failed" });
//   }
// });


// // ─────────────────────────────────────────────
// // PUT /api/superadmin/manual-translate
// // Super admin manually edits a translation
// // Body: { id, type, lang, value }
// // ─────────────────────────────────────────────
// router.put("/manual-translate", verifyToken, isSuperAdmin, async (req, res) => {
//   try {
//     const { id, type, lang, value } = req.body;

//     if (!["en", "ta", "hi"].includes(lang)) {
//       return res.status(400).json({ msg: "Invalid language" });
//     }

//     const Model = type === "menu" ? Menu : type === "category" ? Category : Grocery;

//     const item = await Model.findByIdAndUpdate(
//       id,
//       { [`name.${lang}`]: value },
//       { new: true }
//     );

//     res.json({ success: true, name: item.name });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: "Manual update failed" });
//   }
// });


// // ─────────────────────────────────────────────
// // POST /api/superadmin/migrate
// // One-time migration: converts all old String names to { en, ta, hi } objects
// // Run once after deploying the new schema
// // ─────────────────────────────────────────────
// router.post("/migrate", verifyToken, isSuperAdmin, async (req, res) => {
//   try {
//     let migrated = 0;

//     const migrateCollection = async (Model) => {
//       const items = await Model.find();
//       for (const item of items) {
//         // If name is still a plain string (old data)
//         if (typeof item.name === "string") {
//           const oldName = item.name;
//           item.name = { en: oldName, ta: "", hi: "" };
//           await item.save();
//           migrated++;
//         }
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

// export default router;



import express from "express";
import Menu from "../models/Menu.js";
import Category from "../models/Category.js";
import Grocery from "../models/Grocery.js";
import { verifyToken, isSuperAdmin } from "../middleware/auth.js";
import { translateToAll, isMissingTranslations, detectFilledLanguage } from "../utils/translate.js";

const router = express.Router();

// ─────────────────────────────────────────────
// GET /api/superadmin/untranslated
// Returns all items that are missing ta or hi translations
// Super admin sees this list in their dashboard
// ─────────────────────────────────────────────
router.get("/untranslated", verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const [menuItems, categories, groceries] = await Promise.all([
      Menu.find(),
      Category.find(),
      Grocery.find(),
    ]);

    const result = {
      menu: menuItems
        .filter(item => isMissingTranslations(item.name))
        .map(item => ({
          _id: item._id,
          name: item.name,
          type: "menu"
        })),

      categories: categories
        .filter(cat => isMissingTranslations(cat.name))
        .map(cat => ({
          _id: cat._id,
          name: cat.name,
          type: "category"
        })),

      groceries: groceries
        .filter(g => isMissingTranslations(g.name))
        .map(g => ({
          _id: g._id,
          name: g.name,
          type: "grocery"
        })),
    };

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});


// ─────────────────────────────────────────────
// POST /api/superadmin/translate-one
// Translate a single item
// Body: { id, type: "menu" | "category" | "grocery" }
// ─────────────────────────────────────────────
router.post("/translate-one", verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const { id, type } = req.body;

    const Model = type === "menu" ? Menu : type === "category" ? Category : Grocery;

    const item = await Model.findById(id);
    if (!item) return res.status(404).json({ msg: "Item not found" });

    // Handle both plain string (old data) and object (new data)
    let sourceLang, sourceText, existingName;

    if (typeof item.name === "string") {
      // Old format — plain string, treat as English
      sourceLang   = "en";
      sourceText   = item.name;
      existingName = { en: item.name, ta: "", hi: "" };
    } else {
      sourceLang   = detectFilledLanguage(item.name);
      sourceText   = item.name[sourceLang];
      existingName = item.name;
    }

    if (!sourceText) {
      return res.status(400).json({ msg: "No text found to translate" });
    }

    // Translate to all languages
    const translated = await translateToAll(sourceText, sourceLang);

    // Merge — don't overwrite languages that already have content
    const updatedName = {
      en: existingName.en?.trim() || translated.en,
      ta: existingName.ta?.trim() || translated.ta,
      hi: existingName.hi?.trim() || translated.hi,
    };

    item.name = updatedName;
    await item.save();

    res.json({ success: true, name: updatedName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Translation failed" });
  }
});


// ─────────────────────────────────────────────
// POST /api/superadmin/translate-all
// Translate ALL untranslated items at once
// ─────────────────────────────────────────────
router.post("/translate-all", verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const { type } = req.body; // "menu", "category", "grocery", or "all"

    let results = { menu: 0, categories: 0, groceries: 0, errors: 0 };

    const translateCollection = async (Model, countKey) => {
      const items = await Model.find();
      for (const item of items) {
        if (!isMissingTranslations(item.name)) continue;
        try {
          let sourceLang, sourceText, existingName;

          if (typeof item.name === "string") {
            sourceLang   = "en";
            sourceText   = item.name;
            existingName = { en: item.name, ta: "", hi: "" };
          } else {
            sourceLang   = detectFilledLanguage(item.name);
            sourceText   = item.name[sourceLang];
            existingName = item.name;
          }

          if (!sourceText) continue;

          const translated = await translateToAll(sourceText, sourceLang);
          item.name = {
            en: existingName.en?.trim() || translated.en,
            ta: existingName.ta?.trim() || translated.ta,
            hi: existingName.hi?.trim() || translated.hi,
          };
          await item.save();
          results[countKey]++;

          // Small delay to avoid rate limiting on free LibreTranslate
          await new Promise(r => setTimeout(r, 300));
        } catch (err) {
          console.error(`Failed to translate ${item._id}:`, err.message);
          results.errors++;
        }
      }
    };

    if (type === "menu" || type === "all") await translateCollection(Menu, "menu");
    if (type === "category" || type === "all") await translateCollection(Category, "categories");
    if (type === "grocery" || type === "all") await translateCollection(Grocery, "groceries");

    res.json({ success: true, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Bulk translation failed" });
  }
});


// ─────────────────────────────────────────────
// PUT /api/superadmin/manual-translate
// Super admin manually edits a translation
// Body: { id, type, lang, value }
// ─────────────────────────────────────────────
router.put("/manual-translate", verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const { id, type, lang, value } = req.body;

    if (!["en", "ta", "hi"].includes(lang)) {
      return res.status(400).json({ msg: "Invalid language" });
    }

    const Model = type === "menu" ? Menu : type === "category" ? Category : Grocery;

    const item = await Model.findByIdAndUpdate(
      id,
      { [`name.${lang}`]: value },
      { new: true }
    );

    res.json({ success: true, name: item.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Manual update failed" });
  }
});


// ─────────────────────────────────────────────
// POST /api/superadmin/migrate
// One-time migration: converts all old String names to { en, ta, hi } objects
// Uses raw MongoDB driver to bypass Mongoose schema casting
// ─────────────────────────────────────────────
router.post("/migrate", verifyToken, isSuperAdmin, async (req, res) => {
  try {
    let migrated = 0;

    // Use raw MongoDB collection to read actual stored value,
    // bypassing Mongoose which would cast the string into the new schema
    const migrateCollection = async (Model) => {
      const rawCollection = Model.collection;

      // Find all documents where name is stored as a plain string
      const oldItems = await rawCollection.find({
        name: { $type: "string" }   // MongoDB type 2 = string
      }).toArray();

      for (const item of oldItems) {
        const oldName = item.name; // plain string like "Cappuccino"
        await rawCollection.updateOne(
          { _id: item._id },
          { $set: { name: { en: oldName, ta: "", hi: "" } } }
        );
        migrated++;
      }
    };

    await migrateCollection(Menu);
    await migrateCollection(Category);
    await migrateCollection(Grocery);

    res.json({
      success: true,
      migrated,
      msg: `Migrated ${migrated} items to multilingual format`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Migration failed" });
  }
});

export default router;




// import express from "express";
// import Menu from "../models/Menu.js";
// import Category from "../models/Category.js";
// import Grocery from "../models/Grocery.js";
// import { verifyToken, isSuperAdmin } from "../middleware/auth.js";
// import { translateToAll, isMissingTranslations, detectFilledLanguage } from "../utils/translate.js";

// const router = express.Router();

// // ─────────────────────────────────────────────
// // GET /api/superadmin/untranslated
// // Returns all items that are missing ta or hi translations
// // Super admin sees this list in their dashboard
// // ─────────────────────────────────────────────
// router.get("/untranslated", verifyToken, isSuperAdmin, async (req, res) => {
//   try {
//     const [menuItems, categories, groceries] = await Promise.all([
//       Menu.find(),
//       Category.find(),
//       Grocery.find(),
//     ]);

//     const result = {
//       menu: menuItems
//         .filter(item => isMissingTranslations(item.name))
//         .map(item => ({
//           _id: item._id,
//           name: item.name,
//           type: "menu"
//         })),

//       categories: categories
//         .filter(cat => isMissingTranslations(cat.name))
//         .map(cat => ({
//           _id: cat._id,
//           name: cat.name,
//           type: "category"
//         })),

//       groceries: groceries
//         .filter(g => isMissingTranslations(g.name))
//         .map(g => ({
//           _id: g._id,
//           name: g.name,
//           type: "grocery"
//         })),
//     };

//     res.json(result);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: "Server error" });
//   }
// });


// // ─────────────────────────────────────────────
// // POST /api/superadmin/translate-one
// // Translate a single item
// // Body: { id, type: "menu" | "category" | "grocery" }
// // ─────────────────────────────────────────────
// router.post("/translate-one", verifyToken, isSuperAdmin, async (req, res) => {
//   try {
//     const { id, type } = req.body;

//     const Model = type === "menu" ? Menu : type === "category" ? Category : Grocery;

//     const item = await Model.findById(id);
//     if (!item) return res.status(404).json({ msg: "Item not found" });

//     // Handle both plain string (old data) and object (new data)
//     let sourceLang, sourceText, existingName;

//     if (typeof item.name === "string") {
//       // Old format — plain string, treat as English
//       sourceLang   = "en";
//       sourceText   = item.name;
//       existingName = { en: item.name, ta: "", hi: "" };
//     } else {
//       sourceLang   = detectFilledLanguage(item.name);
//       sourceText   = item.name[sourceLang];
//       existingName = item.name;
//     }

//     if (!sourceText) {
//       return res.status(400).json({ msg: "No text found to translate" });
//     }

//     // Translate to all languages
//     const translated = await translateToAll(sourceText, sourceLang);

//     // Merge — don't overwrite languages that already have content
//     const updatedName = {
//       en: existingName.en?.trim() || translated.en,
//       ta: existingName.ta?.trim() || translated.ta,
//       hi: existingName.hi?.trim() || translated.hi,
//     };

//     item.name = updatedName;
//     await item.save();

//     res.json({ success: true, name: updatedName });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: "Translation failed" });
//   }
// });


// // ─────────────────────────────────────────────
// // POST /api/superadmin/translate-all
// // Translate ALL untranslated items at once
// // ─────────────────────────────────────────────
// router.post("/translate-all", verifyToken, isSuperAdmin, async (req, res) => {
//   try {
//     const { type } = req.body; // "menu", "category", "grocery", or "all"

//     let results = { menu: 0, categories: 0, groceries: 0, errors: 0 };

//     const translateCollection = async (Model, countKey) => {
//       const items = await Model.find();
//       for (const item of items) {
//         if (!isMissingTranslations(item.name)) continue;
//         try {
//           let sourceLang, sourceText, existingName;

//           if (typeof item.name === "string") {
//             sourceLang   = "en";
//             sourceText   = item.name;
//             existingName = { en: item.name, ta: "", hi: "" };
//           } else {
//             sourceLang   = detectFilledLanguage(item.name);
//             sourceText   = item.name[sourceLang];
//             existingName = item.name;
//           }

//           if (!sourceText) continue;

//           const translated = await translateToAll(sourceText, sourceLang);
//           item.name = {
//             en: existingName.en?.trim() || translated.en,
//             ta: existingName.ta?.trim() || translated.ta,
//             hi: existingName.hi?.trim() || translated.hi,
//           };
//           await item.save();
//           results[countKey]++;

//           // Small delay to avoid rate limiting on free LibreTranslate
//           await new Promise(r => setTimeout(r, 300));
//         } catch (err) {
//           console.error(`Failed to translate ${item._id}:`, err.message);
//           results.errors++;
//         }
//       }
//     };

//     if (type === "menu" || type === "all") await translateCollection(Menu, "menu");
//     if (type === "category" || type === "all") await translateCollection(Category, "categories");
//     if (type === "grocery" || type === "all") await translateCollection(Grocery, "groceries");

//     res.json({ success: true, results });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: "Bulk translation failed" });
//   }
// });


// // ─────────────────────────────────────────────
// // PUT /api/superadmin/manual-translate
// // Super admin manually edits a translation
// // Body: { id, type, lang, value }
// // ─────────────────────────────────────────────
// router.put("/manual-translate", verifyToken, isSuperAdmin, async (req, res) => {
//   try {
//     const { id, type, lang, value } = req.body;

//     if (!["en", "ta", "hi"].includes(lang)) {
//       return res.status(400).json({ msg: "Invalid language" });
//     }

//     const Model = type === "menu" ? Menu : type === "category" ? Category : Grocery;

//     const item = await Model.findByIdAndUpdate(
//       id,
//       { [`name.${lang}`]: value },
//       { new: true }
//     );

//     res.json({ success: true, name: item.name });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: "Manual update failed" });
//   }
// });


// // ─────────────────────────────────────────────
// // POST /api/superadmin/migrate
// // One-time migration: converts all old String names to { en, ta, hi } objects
// // Run once after deploying the new schema
// // ─────────────────────────────────────────────
// router.post("/migrate", verifyToken, isSuperAdmin, async (req, res) => {
//   try {
//     let migrated = 0;

//     const migrateCollection = async (Model) => {
//       const items = await Model.find();
//       for (const item of items) {
//         // If name is still a plain string (old data)
//         if (typeof item.name === "string") {
//           const oldName = item.name;
//           item.name = { en: oldName, ta: "", hi: "" };
//           await item.save();
//           migrated++;
//         }
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

// export default router;