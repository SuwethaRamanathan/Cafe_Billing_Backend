// import mongoose from "mongoose";

// const grocerySchema = new mongoose.Schema({

//   name: {
//     type: String,
//     required: true
//   },

//   quantity: {
//     type: Number,
//     required: true,
//     default: 0
//   },

//   unit: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Unit",
//     required: true
//   },

//   lastPurchasedDate: Date,

//   lastStockUpdatedDate: {
//     type: Date,
//     default: Date.now
//   }

// });

// export default mongoose.model("Grocery", grocerySchema);

import mongoose from "mongoose";

const grocerySchema = new mongoose.Schema({
  // name is now { en: "Milk", ta: "பால்", hi: "दूध" }
  name: {
    en: { type: String, default: "", trim: true },
    ta: { type: String, default: "", trim: true },
    hi: { type: String, default: "", trim: true },
  },

  quantity:            { type: Number, required: true, default: 0 },
  unit:                { type: mongoose.Schema.Types.ObjectId, ref: "Unit", required: true },
  lastPurchasedDate:   Date,
  lastStockUpdatedDate:{ type: Date, default: Date.now }
});

export default mongoose.model("Grocery", grocerySchema);