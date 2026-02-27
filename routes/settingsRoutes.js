import express from "express";
import Settings from "../models/Settings.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (err) {
    console.error("GET settings error:", err);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

router.put("/", async (req, res) => {
  try {
    const {
      cafeName,
      tagline,
      address,
      phone,
      gstin,
      receiptFooter,
      gstEnabled,
      gstPercent,
      discountEnabled,
      currency
    } = req.body;

    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();

    if (cafeName        !== undefined) settings.cafeName        = cafeName;
    if (address         !== undefined) settings.address         = address;
    if (phone           !== undefined) settings.phone           = phone;
    if (gstin           !== undefined) settings.gstin           = gstin;
    if (receiptFooter   !== undefined) settings.receiptFooter   = receiptFooter;
    if (gstEnabled      !== undefined) settings.gstEnabled      = gstEnabled;
    if (gstPercent      !== undefined) settings.gstPercent      = Number(gstPercent);
    if (discountEnabled !== undefined) settings.discountEnabled = discountEnabled;
    if (currency        !== undefined) settings.currency        = currency;
    if (tagline         !== undefined) settings.tagline        = tagline;

    await settings.save();

    res.json(settings);
  } 
  catch (err) {
    console.error("PUT settings error:", err);
    res.status(500).json({ error: "Failed to save settings" });
  }
});

export default router;