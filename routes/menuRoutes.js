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

const router = express.Router();

// Helper: normalize name input from frontend
// Admin types name as a plain string → we store it as { en: "...", ta: "", hi: "" }
// or they can pass which language they typed in via nameLang field
function buildNameObject(nameInput, lang = "en") {
  // If it's already an object (e.g. from edit), return as-is
  if (typeof nameInput === "object" && nameInput !== null) return nameInput;

  // Plain string → store in the language they typed
  const obj = { en: "", ta: "", hi: "" };
  obj[lang] = nameInput;
  return obj;
}

router.get("/", async (req, res) => {
  // Use raw collection to bypass Mongoose casting of name field
  const menu = await Menu.collection.find({}).toArray();
  res.json(menu);
});

router.post("/", verifyToken, isAdmin, async (req, res) => {
  const { name, price, stock, nameLang = "en", ...rest } = req.body;

  if (stock < 0) {
    return res.status(400).json({ msg: "Stock cannot be negative" });
  }

  // Build the multilingual name — only one language filled for now
  // Super admin will fill the others later via translate panel
  const nameObj = buildNameObject(name, nameLang);

  const item = await Menu.create({ name: nameObj, price, stock, ...rest });
  res.json(item);
});

router.put("/:id", verifyToken, isAdmin, async (req, res) => {
  const { name, nameLang = "en", ...rest } = req.body;

  let updateData = { ...rest };

  if (name !== undefined) {
    updateData.name = buildNameObject(name, nameLang);
  }

  const updated = await Menu.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true }
  );
  res.json(updated);
});

router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
  await Menu.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

export default router;