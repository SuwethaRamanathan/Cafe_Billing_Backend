import express from "express";
import Menu from "../models/Menu.js";
import { verifyToken, isAdmin } from "../middleware/auth.js";
const router = express.Router();

router.get("/", async (req, res) => {
  const menu = await Menu.find();
  res.json(menu);
 } );

router.post("/", verifyToken, isAdmin, async (req, res) => {
  const { name, price, stock } = req.body;

  if (stock < 0) {
    return res.status(400).json({
      msg: "Stock cannot be negative"
    });
  }

  const item = await Menu.create(req.body);
  res.json(item);
});

router.delete("/:id",verifyToken, isAdmin, async (req, res) => {
    await Menu.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
});

router.put("/:id",verifyToken, isAdmin, async (req,res)=>{
  const updated = await Menu.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new:true }
  );
  res.json(updated);
});

export default router;