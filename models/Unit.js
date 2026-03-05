import mongoose from "mongoose";

const unitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

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