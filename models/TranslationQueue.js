import mongoose from "mongoose";
 
/**
 * TranslationQueue
 * ─────────────────────────────────────────────────────────
 * One document per item that needs translation.
 * Created/updated whenever admin creates or edits a menu item,
 * category, or grocery item.
 * Deleted when all three languages are filled (translated or manual).
 *
 * Fields:
 *  itemId   — ObjectId of the source document (Menu / Category / Grocery)
 *  type     — "menu" | "category" | "grocery"
 *  name     — mirrors the source document's name { en, ta, hi }
 *             (kept in sync so superadmin sees latest values)
 *  requestedAt — when it was added / last updated
 */
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
 
// Compound unique index — one queue entry per (itemId, type)
TranslationQueueSchema.index({ itemId: 1, type: 1 }, { unique: true });
 
export default mongoose.model("TranslationQueue", TranslationQueueSchema);