import mongoose from "mongoose";

const unitSchema = new mongoose.Schema({
  purchaseUnit: {
    type: String,
    required: true
  },

  reduceUnit: {
    type: String,
    required: true
  },

  displayUnit: {
    type: String,
    required: true
  },

  conversionFactor: {
    type: Number,
    required: true
  }

}, { timestamps: true });

export default mongoose.model("Unit", unitSchema);