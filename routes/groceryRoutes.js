import express from "express";
import mongoose from "mongoose";
import Grocery from "../models/Grocery.js";
import Unit from "../models/Unit.js";
import TranslationQueue from "../models/TranslationQueue.js";
import multer from "multer";
import ExcelJS from "exceljs";
import fs from "fs";
import { syncQueue } from "../utils/Queuehelper.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

function buildNameObject(nameInput, lang = "en") {
  if (typeof nameInput === "object" && nameInput !== null) return nameInput;
  const obj = { en: "", ta: "", hi: "" };
  obj[lang] = nameInput || "";
  return obj;
}

// GET all groceries with unit info
router.get("/", async (req, res) => {
  try {
    const rawGroceries = await Grocery.collection.find({}).toArray();

    const converted = await Promise.all(rawGroceries.map(async g => {
      let unit = null;
      if (g.unit) unit = await Unit.findById(g.unit);

      if (!unit) {
        return { ...g, displayQty: g.quantity, purchaseUnit: "Unknown", displayUnit: "", reduceUnit: "" };
      }

      const displayQty = unit.displayUnit === unit.reduceUnit
        ? g.quantity
        : g.quantity / unit.conversionFactor;

      return { ...g, displayQty, purchaseUnit: unit.purchaseUnit, displayUnit: unit.displayUnit, reduceUnit: unit.reduceUnit };
    }));

    res.json(converted);
  } catch (err) {
    console.error("FETCH GROCERIES ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// POST — add grocery item, sync queue
router.post("/", async (req, res) => {
  try {
    const { name, unitId, quantity, lastPurchasedDate, nameLang = "en" } = req.body;

    const unit = await Unit.findById(unitId);
    if (!unit) return res.status(400).json({ msg: "Invalid unit selected" });

    const baseQty  = quantity * unit.conversionFactor;
    const nameObj  = buildNameObject(name, nameLang);

    const grocery = await Grocery.create({
      name: nameObj,
      unit: unitId,
      quantity: baseQty,
      lastPurchasedDate,
    });

    // Sync queue — if any language missing, add to queue
    await syncQueue(grocery._id, "grocery", nameObj);

    res.json(grocery);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Create failed" });
  }
});

// PUT — update grocery (usually only quantity, not name)
// If name is also sent (some UIs allow editing name), sync queue.
router.put("/:id", async (req, res) => {
  try {
    const { quantity, name, nameLang = "en" } = req.body;
    const _id = new mongoose.Types.ObjectId(req.params.id);

    const updateFields = { quantity, lastStockUpdatedDate: new Date() };

    if (name !== undefined) {
      // Fetch existing to check if name actually changed
      const existing = await Grocery.collection.findOne({ _id });
      const existingName = (existing && typeof existing.name === "object")
        ? existing.name
        : { en: "", ta: "", hi: "" };

      const newName = typeof name === "object" ? name : name;
      const newVal  = typeof name === "object" ? name[nameLang] : name;

      if (newVal !== existingName[nameLang]) {
        // Name changed → reset other languages → re-queue
        updateFields.name = { en: "", ta: "", hi: "", [nameLang]: newVal };
      } else {
        // Name unchanged — no reset needed
        updateFields.name = existingName;
      }
    }

    await Grocery.collection.updateOne({ _id }, { $set: updateFields });

    // Sync queue based on latest name
    const updated = await Grocery.collection.findOne({ _id });
    if (updated?.name) await syncQueue(_id, "grocery", updated.name);

    res.json(updated);
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ msg: "Update failed" });
  }
});

// DELETE — also remove from translation queue
router.delete("/:id", async (req, res) => {
  try {
    const _id = new mongoose.Types.ObjectId(req.params.id);
    await Grocery.findByIdAndDelete(req.params.id);
    await TranslationQueue.deleteOne({ itemId: _id, type: "grocery" });
    res.json({ message: "Grocery deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Delete failed" });
  }
});

// EXPORT Excel
// 

router.get("/export", async (req, res) => {
  try {

    const groceries = await Grocery.find().populate("unit");

    const workbook  = new ExcelJS.Workbook();
    const sheet     = workbook.addWorksheet("Raw Materials");

    sheet.columns = [
      { header: "Item (EN)", key: "nameEn", width: 20 },
      { header: "Item (TA)", key: "nameTa", width: 20 },
      { header: "Item (HI)", key: "nameHi", width: 20 },
      { header: "Unit", key: "unit", width: 15 },
      { header: "Quantity", key: "quantity", width: 15 },
      { header: "Last Purchased", key: "lastPurchasedDate", width: 20 },
      { header: "Last Updated", key: "lastStockUpdatedDate", width: 20 }
    ];

    groceries.forEach(g => {

      const unit = g.unit;

      const displayQty =
        unit.displayUnit === unit.reduceUnit
          ? g.quantity
          : g.quantity / unit.conversionFactor;

      sheet.addRow({
        nameEn: g.name?.en || "",
        nameTa: g.name?.ta || "",
        nameHi: g.name?.hi || "",
        unit: unit.purchaseUnit,
        quantity: displayQty,
        lastPurchasedDate: g.lastPurchasedDate
          ? new Date(g.lastPurchasedDate).toLocaleDateString("en-GB")
          : "",
        lastStockUpdatedDate: g.lastStockUpdatedDate
          ? new Date(g.lastStockUpdatedDate).toLocaleDateString("en-GB")
          : ""
      });

    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Raw_Material_Stock.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error("EXPORT ERROR:", err);
    res.status(500).json({ msg: "Export failed" });
  }
});

// IMPORT Excel
router.post("/import", upload.single("file"), async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const sheet = workbook.worksheets[0];
    let count = 0;

    for (let i = 2; i <= sheet.rowCount; i++) {
      const row  = sheet.getRow(i);
      const nameEn = row.getCell(1).text?.trim();
      if (!nameEn) continue;

      // const unit     = row.getCell(4).text?.trim();
      // const quantity = Number(row.getCell(5).text);

      const unitName = row.getCell(4).text?.trim();
const displayQty = Number(row.getCell(5).text);

const unit = await Unit.findOne({ purchaseUnit: unitName });

if (!unit) continue;

const baseQty = displayQty * unit.conversionFactor;
      const lastPurchasedDate = row.getCell(6).text?.trim()
        ? new Date(row.getCell(6).text.trim()) : null;
      const lastStockUpdatedDate = row.getCell(7).text?.trim()
        ? new Date(row.getCell(7).text.trim()) : new Date();

      const nameObj = {
        en: row.getCell(1).text?.trim() || "",
        ta: row.getCell(2).text?.trim() || "",
        hi: row.getCell(3).text?.trim() || "",
      };

      const existing = await Grocery.findOne({ "name.en": nameEn });
      if (existing) {
        existing.name = nameObj;
        existing.unit = unit._id;
        existing.quantity = baseQty;
        existing.lastPurchasedDate = lastPurchasedDate;
        existing.lastStockUpdatedDate = lastStockUpdatedDate;
        await existing.save();
        await syncQueue(existing._id, "grocery", nameObj);
      } else {
        const created = await Grocery.create({ name: nameObj, unit: unit._id, quantity: baseQty, lastPurchasedDate, lastStockUpdatedDate });
        await syncQueue(created._id, "grocery", nameObj);
      }
      count++;
    }

    fs.unlinkSync(req.file.path);
    res.json({ msg: `Imported ${count} items` });
  } catch (err) {
    console.error("IMPORT ERROR:", err);
    res.status(500).json({ msg: "Import failed" });
  }
});

export default router;





// import express from "express";
// import Grocery from "../models/Grocery.js";
// import Unit from "../models/Unit.js";
// import multer from "multer";
// import ExcelJS from "exceljs";
// import fs from "fs";

// const router = express.Router();
// const upload = multer({ dest: "uploads/" });

// function buildNameObject(nameInput, lang = "en") {
//   if (typeof nameInput === "object" && nameInput !== null) return nameInput;
//   const obj = { en: "", ta: "", hi: "" };
//   obj[lang] = nameInput;
//   return obj;
// }

// // GET all groceries with unit info
// router.get("/", async (req, res) => {
//   try {
//     // Use raw collection to bypass Mongoose casting of name field
//     // Then manually populate unit by looking up Unit documents
//     const rawGroceries = await Grocery.collection.find({}).toArray();

//     const converted = await Promise.all(rawGroceries.map(async g => {
//       // Manually fetch unit since we bypassed populate
//       let unit = null;
//       if (g.unit) {
//         unit = await Unit.findById(g.unit);
//       }

//       if (!unit) {
//         return {
//           ...g,
//           displayQty: g.quantity,
//           purchaseUnit: "Unknown",
//           displayUnit: "",
//           reduceUnit: ""
//         };
//       }

//       let displayQty;
//       if (unit.displayUnit === unit.reduceUnit) {
//         displayQty = g.quantity;
//       } else {
//         displayQty = g.quantity / unit.conversionFactor;
//       }

//       return {
//         ...g,
//         displayQty,
//         purchaseUnit: unit.purchaseUnit,
//         displayUnit: unit.displayUnit,
//         reduceUnit: unit.reduceUnit
//       };
//     }));

//     res.json(converted);
//   } catch (err) {
//     console.error("FETCH GROCERIES ERROR:", err);
//     res.status(500).json({ msg: "Server error" });
//   }
// });

// // POST - add new grocery item
// router.post("/", async (req, res) => {
//   try {
//     const { name, unitId, quantity, lastPurchasedDate, nameLang = "en" } = req.body;

//     const unit = await Unit.findById(unitId);
//     if (!unit) return res.status(400).json({ msg: "Invalid unit selected" });

//     const baseQty = quantity * unit.conversionFactor;
//     const nameObj = buildNameObject(name, nameLang);

//     const grocery = await Grocery.create({
//       name: nameObj,
//       unit: unitId,
//       quantity: baseQty,
//       lastPurchasedDate
//     });

//     res.json(grocery);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: "Create failed" });
//   }
// });

// // PUT - update grocery quantity
// router.put("/:id", async (req, res) => {
//   try {
//     const { quantity } = req.body;
//     const updated = await Grocery.findByIdAndUpdate(
//       req.params.id,
//       { quantity, lastStockUpdatedDate: new Date() },
//       { new: true }
//     );
//     res.json(updated);
//   } catch (err) {
//     console.error("UPDATE ERROR:", err);
//     res.status(500).json({ msg: "Update failed" });
//   }
// });

// // DELETE
// router.delete("/:id", async (req, res) => {
//   await Grocery.findByIdAndDelete(req.params.id);
//   res.json({ message: "Grocery deleted" });
// });

// // EXPORT Excel
// router.get("/export", async (req, res) => {
//   try {
//     const groceries = await Grocery.find();
//     const workbook  = new ExcelJS.Workbook();
//     const sheet     = workbook.addWorksheet("Raw Materials");

//     sheet.columns = [
//       { header: "Item (EN)", key: "nameEn", width: 20 },
//       { header: "Item (TA)", key: "nameTa", width: 20 },
//       { header: "Item (HI)", key: "nameHi", width: 20 },
//       { header: "Unit",      key: "unit",   width: 15 },
//       { header: "Quantity",  key: "quantity", width: 15 },
//       { header: "Last Purchased", key: "lastPurchasedDate", width: 20 },
//       { header: "Last Updated",   key: "lastStockUpdatedDate", width: 20 }
//     ];

//     groceries.forEach(g => {
//       sheet.addRow({
//         nameEn:   g.name?.en || "",
//         nameTa:   g.name?.ta || "",
//         nameHi:   g.name?.hi || "",
//         unit:     g.unit,
//         quantity: g.quantity,
//         lastPurchasedDate: g.lastPurchasedDate
//           ? new Date(g.lastPurchasedDate).toLocaleDateString("en-GB") : "",
//         lastStockUpdatedDate: g.lastStockUpdatedDate
//           ? new Date(g.lastStockUpdatedDate).toLocaleDateString("en-GB") : ""
//       });
//     });

//     res.setHeader("Content-Type",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
//     res.setHeader("Content-Disposition",
//       "attachment; filename=Raw_Material_Stock.xlsx");

//     await workbook.xlsx.write(res);
//     res.end();
//   } catch (err) {
//     console.error("EXPORT ERROR:", err);
//     res.status(500).json({ msg: "Export failed" });
//   }
// });

// // IMPORT Excel
// router.post("/import", upload.single("file"), async (req, res) => {
//   try {
//     const workbook = new ExcelJS.Workbook();
//     await workbook.xlsx.readFile(req.file.path);
//     const sheet = workbook.worksheets[0];
//     let count = 0;

//     for (let i = 2; i <= sheet.rowCount; i++) {
//       const row  = sheet.getRow(i);
//       const name = row.getCell(1).text?.trim();
//       if (!name) continue;

//       const unit     = row.getCell(4).text?.trim();
//       const quantity = Number(row.getCell(5).text);
//       const lastPurchasedDate = row.getCell(6).text?.trim()
//         ? new Date(row.getCell(6).text.trim()) : null;
//       const lastStockUpdatedDate = row.getCell(7).text?.trim()
//         ? new Date(row.getCell(7).text.trim()) : new Date();

//       const nameObj = {
//         en: row.getCell(1).text?.trim() || "",
//         ta: row.getCell(2).text?.trim() || "",
//         hi: row.getCell(3).text?.trim() || "",
//       };

//       const existing = await Grocery.findOne({ "name.en": name });
//       if (existing) {
//         existing.name = nameObj;
//         existing.unit = unit;
//         existing.quantity = quantity;
//         existing.lastPurchasedDate = lastPurchasedDate;
//         existing.lastStockUpdatedDate = lastStockUpdatedDate;
//         await existing.save();
//       } else {
//         await Grocery.create({
//           name: nameObj, unit, quantity,
//           lastPurchasedDate, lastStockUpdatedDate
//         });
//       }
//       count++;
//     }

//     fs.unlinkSync(req.file.path);
//     res.json({ msg: `Imported ${count} items` });
//   } catch (err) {
//     console.error("IMPORT ERROR:", err);
//     res.status(500).json({ msg: "Import failed" });
//   }
// });

// export default router;

