import express from "express";
import Grocery from "../models/Grocery.js";
import multer from "multer";
import ExcelJS from "exceljs";
import fs from "fs";

const router = express.Router();

const upload = multer({ dest: "uploads/" });

// router.get("/", async (req, res) => {
//   try {
//     const groceries = await Grocery.find();

//     const converted = groceries.map(g => {
//       const factor = g.conversionFactor || 1;   

//       return {
//         ...g.toObject(),
//         displayQty: factor ? g.quantity / factor : g.quantity
//       };
//     });

//     res.json(converted);
//   } catch (err) {
//     console.error("Error fetching groceries:", err);
//     res.status(500).json({ msg: "Server error" });
//   }
// });

router.get("/", async (req,res)=>{

  const groceries = await Grocery.find()
  .populate("unit");

  const converted = groceries.map(g=>{

    const factor = g.unit.conversionFactor;

    return {
      ...g.toObject(),
      displayQty: g.quantity / factor,
      purchaseUnit: g.unit.purchaseUnit,
      displayUnit: g.unit.displayUnit,
      reduceUnit: g.unit.reduceUnit
    }

  });

  res.json(converted);

});

router.put("/:id", async (req, res) => {
  try {
    const { quantity } = req.body;

    const updated = await Grocery.findByIdAndUpdate(
      req.params.id,
      {
        quantity,
        lastStockUpdatedDate: new Date()
      },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ msg: "Update failed" });
  }
});

// router.post("/", async (req, res) => {
//   try {
//     const {
//       name,
//       purchaseUnit,
//       baseUnit,
//       conversionFactor,
//       quantity,
//       lastPurchasedDate
//     } = req.body;

//     const baseQty = quantity * conversionFactor;

//     const grocery = await Grocery.create({
//       name,
//       purchaseUnit,
//       baseUnit,
//       conversionFactor,
//       quantity: baseQty, 
//       lastPurchasedDate,
//       lastStockUpdatedDate: new Date()
//     });

//     res.json(grocery);
//   } catch (err) {
//     console.error("CREATE ERROR:", err);
//     res.status(500).json({ msg: "Create failed" });
//   }
// });

router.post("/", async (req,res)=>{
  try{

    const { name, unitId, quantity, lastPurchasedDate } = req.body;

    const unit = await Unit.findById(unitId);

    const baseQty = quantity * unit.conversionFactor;

    const grocery = await Grocery.create({
      name,
      unit: unitId,
      quantity: baseQty,
      lastPurchasedDate
    });

    res.json(grocery);

  }catch(err){
    console.error(err);
    res.status(500).json({msg:"Create failed"});
  }
});

router.delete("/:id", async (req, res) => {
  await Grocery.findByIdAndDelete(req.params.id);
  res.json({ message: "Grocery deleted" });
});

let baseUnit = "";
let factor = conversionFactor;

if (purchaseUnit === "Litre") {
  baseUnit = "ml";
  factor = 1000;
}

if (purchaseUnit === "Kilogram") {
  baseUnit = "g";
  factor = 1000;
}

if (purchaseUnit === "Gram") {
  baseUnit = "g";
  factor = 1;
}

if (purchaseUnit === "Millilitre") {
  baseUnit = "ml";
  factor = 1;
}

if (purchaseUnit === "Packets") {
  baseUnit = "piece";
}

router.post("/import", upload.single("file"), async (req, res) => {
  try {
    console.log("Import file:", req.file?.path);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);

    const sheet = workbook.worksheets[0];

    let count = 0;

    for (let i = 2; i <= sheet.rowCount; i++) {
      const row = sheet.getRow(i);

      const name = row.getCell(1).text?.trim();
      const unit = row.getCell(2).text?.trim();
      const quantity = Number(row.getCell(3).text);
      // const purchaseUnit = row.getCell(2).text?.trim();
      // const baseUnit = row.getCell(2).text?.trim();
      // const conversionFactor = Number(row.getCell(3).text);
      const lastPurchasedDateText = row.getCell(4).text?.trim();
      const lastStockUpdatedDateText = row.getCell(5).text?.trim();

      if (!name) continue;

      const lastPurchasedDate = lastPurchasedDateText
        ? new Date(lastPurchasedDateText)
        : null;

      const lastStockUpdatedDate = lastStockUpdatedDateText
        ? new Date(lastStockUpdatedDateText)
        : new Date();

      const existing = await Grocery.findOne({ name });

      if (existing) {
        existing.unit = unit;
        existing.quantity = quantity;
        existing.lastPurchasedDate = lastPurchasedDate;
        existing.lastStockUpdatedDate = lastStockUpdatedDate;
        await existing.save();
      } else {
        await Grocery.create({
          name,
          unit,
          quantity,
          lastPurchasedDate,
          lastStockUpdatedDate
        });
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

router.get("/export", async (req, res) => {
  try {
    const groceries = await Grocery.find();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Raw Materials");

    sheet.columns = [
      { header: "Item", key: "name", width: 20 },
      { header: "Unit", key: "unit", width: 15 },
      { header: "Quantity", key: "quantity", width: 15 },
      { header: "Last Purchased", key: "lastPurchasedDate", width: 20 },
      { header: "Last Updated", key: "lastStockUpdatedDate", width: 20 }
    ];

    groceries.forEach(g => {
      sheet.addRow({
        name: g.name,
        unit: g.unit,
        quantity: g.quantity,
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

export default router;