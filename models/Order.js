import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  items: Array,
  total: Number,

  orderNumber: Number,   
  orderDate: Date,       

  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);