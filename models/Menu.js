import mongoose from "mongoose";

const recipeSchema = new mongoose.Schema({
  grocery: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Grocery",
    required: true
  },
  qty: {
    type: Number,
    required: true
  }
});

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

  recipe: [recipeSchema],

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