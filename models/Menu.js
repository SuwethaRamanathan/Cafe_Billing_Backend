import mongoose from "mongoose";

const menuSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  stock: {
    type: Number,
    required: true,
    default: 0
  },

  category: {
    type: String,
    required: true
  },

  image: {
    type: String,
    required: true
  },

  thresholdAlertSent: {
    type: Boolean,
    default: false
  },

  outOfStockAlertSent: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

export default mongoose.model("Menu", menuSchema);