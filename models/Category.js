// import mongoose from "mongoose";

// const categorySchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//     unique: true,
//     trim: true
//   }
// });

// export default mongoose.model("Category", categorySchema);

import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  // name is now { en: "Beverages", ta: "பானங்கள்", hi: "पेय पदार्थ" }
  name: {
    en: { type: String, default: "", trim: true },
    ta: { type: String, default: "", trim: true },
    hi: { type: String, default: "", trim: true },
  }
});

export default mongoose.model("Category", categorySchema);