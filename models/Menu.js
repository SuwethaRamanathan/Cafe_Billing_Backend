// import mongoose from "mongoose";

// const recipeSchema = new mongoose.Schema({
//   grocery: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Grocery",
//     required: true
//   },
//   qty: {
//     type: Number,
//     required: true
//   }
// });

// const menuSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true
//   },

//   price: {
//     type: Number,
//     required: true
//   },

//   stock: {
//     type: Number,
//     required: true,
//     default: 0
//   },

//   category: {
//     type: String,
//     required: true
//   },

//   image: {
//     type: String,
//     required: true
//   },

//   recipe: [recipeSchema],

//   thresholdAlertSent: {
//     type: Boolean,
//     default: false
//   },

//   outOfStockAlertSent: {
//     type: Boolean,
//     default: false
//   }

// }, { timestamps: true });

// export default mongoose.model("Menu", menuSchema);

import mongoose from "mongoose";

const recipeSchema = new mongoose.Schema({
  grocery: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Grocery",
    required: true
  },
  qty: { type: Number, required: true }
});

// Reusable multilingual name schema
// Cafe admin enters name in ONE language, superadmin fills the rest
const multiLangName = {
  en: { type: String, default: "" },
  ta: { type: String, default: "" },
  hi: { type: String, default: "" },
};

const menuSchema = new mongoose.Schema({
  // name is now an object: { en: "Cappuccino", ta: "கப்புச்சினோ", hi: "कैप्पुचिनो" }
  name: multiLangName,

  price:    { type: Number, required: true },
  stock:    { type: Number, required: true, default: 0 },

  // category stored as name string (still works with Category collection)
  category: { type: String, required: true },

  image:    { type: String, required: true },
  recipe:   [recipeSchema],

  thresholdAlertSent:  { type: Boolean, default: false },
  outOfStockAlertSent: { type: Boolean, default: false },

}, { timestamps: true });

export default mongoose.model("Menu", menuSchema);