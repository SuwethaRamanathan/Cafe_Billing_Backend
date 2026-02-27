import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  cafeName:        { type: String, default: "Cafe & Snacks" },
  address:         { type: String, default: "" },
  phone:           { type: String, default: "" },
  gstin:           { type: String, default: "" },
  tagline:         { type: String, default: "Fresh Coffee • Tasty Snacks" },
  receiptFooter:   { type: String, default: "Thank you for visiting! Please come again ☕" },
  gstEnabled:      { type: Boolean, default: true },
  gstPercent:      { type: Number, default: 5 },
  discountEnabled: { type: Boolean, default: true },
  currency:        { type: String, default: "₹" },
}, { timestamps: true });

export default mongoose.model("Settings", settingsSchema);