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

//     purchaseUnit: {
//     type: String,
//     required: true
//   },

//   baseUnit: {
//     type: String,
//     required: true
//   },

//   conversionFactor: {
//     type: Number,
//     required: true
//   },

//   lastPurchasedDate: {
//     type: Date
//   },
//   lastStockUpdatedDate: {
//     type: Date,
//     default: Date.now
//   }
// });

// export default mongoose.model("Grocery", grocerySchema);

import mongoose from "mongoose";

const grocerySchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  quantity: {
    type: Number,
    required: true,
    default: 0
  },

  unit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Unit",
    required: true
  },

  lastPurchasedDate: Date,

  lastStockUpdatedDate: {
    type: Date,
    default: Date.now
  }

});

export default mongoose.model("Grocery", grocerySchema);