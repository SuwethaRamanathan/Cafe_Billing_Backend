import TranslationQueue from "../models/TranslationQueue.js";

export function isFullyTranslated(nameObj) {
  if (!nameObj || typeof nameObj === "string") return false;
  const en = nameObj.en?.trim() || "";
  const ta = nameObj.ta?.trim() || "";
  const hi = nameObj.hi?.trim() || "";
  if (!en || !ta || !hi) return false;
  if (ta === en || hi === en) return false;
  return true;
}

export function isMissingTranslations(nameObj) {
  return !isFullyTranslated(nameObj);
}

export async function syncQueue(itemId, type, nameObj) {
  if (isFullyTranslated(nameObj)) {
    await TranslationQueue.deleteOne({ itemId, type });
  } else {
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