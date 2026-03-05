import express from "express";
import Unit from "../models/Unit.js";

const router = express.Router();


router.get("/", async (req,res)=>{
  const units = await Unit.find();
  res.json(units);
});


router.post("/", async (req,res)=>{
  const unit = await Unit.create(req.body);
  res.json(unit);
});


router.delete("/:id", async (req,res)=>{
  await Unit.findByIdAndDelete(req.params.id);
  res.json({msg:"Unit deleted"});
});


export default router;