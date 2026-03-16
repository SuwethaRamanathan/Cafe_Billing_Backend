import TranslationQueue from "../models/TranslationQueue.js";

/**
 * isFullyTranslated(nameObj)
 * Returns true only when all three language fields are non-empty
 * AND the ta/hi values are not just copies of the English value
 * (MyMemory sometimes echoes the source when it can't translate).
 */
export function isFullyTranslated(nameObj) {
  if (!nameObj || typeof nameObj === "string") return false;
  const en = nameObj.en?.trim() || "";
  const ta = nameObj.ta?.trim() || "";
  const hi = nameObj.hi?.trim() || "";
  if (!en || !ta || !hi) return false;
  // Reject if ta or hi is identical to en (untranslated echo)
  if (ta === en || hi === en) return false;
  return true;
}

/**
 * isMissingTranslations(nameObj)
 * Legacy helper kept for backward compat with superadmin.js import.
 */
export function isMissingTranslations(nameObj) {
  return !isFullyTranslated(nameObj);
}

/**
 * syncQueue(itemId, type, nameObj)
 * ──────────────────────────────────────────────────────────
 * Call this from any route that creates or updates an item name.
 *
 * - If the item still needs translation  → upsert into queue
 * - If the item is now fully translated  → remove from queue
 *
 * Uses upsert so it is safe to call on both create and update.
 */
export async function syncQueue(itemId, type, nameObj) {
  if (isFullyTranslated(nameObj)) {
    // All done — remove from queue if it was there
    await TranslationQueue.deleteOne({ itemId, type });
  } else {
    // Needs translation — add or refresh entry
    await TranslationQueue.findOneAndUpdate(
      { itemId, type },
      {
        $set: {
          name:        { en: nameObj.en || "", ta: nameObj.ta || "", hi: nameObj.hi || "" },
          requestedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );
  }
}