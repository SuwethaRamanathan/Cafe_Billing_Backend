import mongoose from "mongoose";

const TranslationQueueSchema = new mongoose.Schema({
  itemId:      { type: mongoose.Schema.Types.ObjectId, required: true },
  type:        { type: String, enum: ["menu", "category", "grocery"], required: true },
  name:        {
    en: { type: String, default: "" },
    ta: { type: String, default: "" },
    hi: { type: String, default: "" },
  },
  requestedAt: { type: Date, default: Date.now },
}, { versionKey: false });
 
TranslationQueueSchema.index({ itemId: 1, type: 1 }, { unique: true });
 
export default mongoose.model("TranslationQueue", TranslationQueueSchema);