// const LIBRE_TRANSLATE_URL = "https://libretranslate.com/translate";
// const SUPPORTED_LANGS = ["en", "ta", "hi"];

// Language code mapping for LibreTranslate
// LibreTranslate uses standard ISO codes
// const LANG_MAP = {
//   en: "en",
//   ta: "ta",
//   hi: "hi",
// };

// /**
//  * Translate a single text to a target language
//  * @param {string} text - text to translate
//  * @param {string} targetLang - "en", "ta", or "hi"
//  * @param {string} sourceLang - auto-detect if not provided
//  */
// export async function translateText(text, targetLang, sourceLang = "auto") {
//   if (!text || !text.trim()) return "";

//   try {
//     const res = await fetch(LIBRE_TRANSLATE_URL, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         q: text,
//         source: sourceLang,
//         target: LANG_MAP[targetLang],
//         format: "text",
//       }),
//     });

//     if (!res.ok) {
//       console.error(`LibreTranslate error for ${targetLang}:`, res.status);
//       return text; // fallback: return original if translation fails
//     }

//     const data = await res.json();
//     return data.translatedText || text;

//   } catch (err) {
//     console.error(`Translation failed for ${targetLang}:`, err.message);
//     return text; // fallback: return original
//   }
// }


export async function translateText(text, targetLang, sourceLang = "en") {
  if (!text || !text.trim()) return "";

  // MyMemory uses different lang codes
  const langMap = { en: "en", ta: "ta", hi: "hi" };
  const langPair = `${langMap[sourceLang]}|${langMap[targetLang]}`;

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
    const res  = await fetch(url);
    const data = await res.json();

    if (data.responseStatus === 200) {
      return data.responseData.translatedText || text;
    }
    return text; // fallback
  } catch (err) {
    console.error(`MyMemory translation failed:`, err.message);
    return text;
  }
}


// /**
//  * Takes a text in any one language and returns all 3 translations
//  * @param {string} text - the name entered by admin
//  * @param {string} enteredLang - which language they typed in ("en", "ta", "hi")
//  * @returns {{ en: string, ta: string, hi: string }}
//  */
export async function translateToAll(text, enteredLang = "en") {
  if (!text || !text.trim()) {
    return { en: "", ta: "", hi: "" };
  }

  // Start with what was entered
  const result = { en: "", ta: "", hi: "" };
  result[enteredLang] = text;

  // Translate to the other two languages
  const otherLangs = SUPPORTED_LANGS.filter(l => l !== enteredLang);

  await Promise.all(
    otherLangs.map(async (lang) => {
      result[lang] = await translateText(text, lang, enteredLang);
    })
  );

  return result;
  // Example output: { en: "Milk", ta: "பால்", hi: "दूध" }
}

// /**
//  * Detect which language has content in a multilingual name object
//  * Used to figure out what language the admin typed in
//  * @param {{ en, ta, hi }} nameObj
//  * @returns {string} language code
//  */
export function detectFilledLanguage(nameObj) {
  if (!nameObj) return "en";
  if (nameObj.en && nameObj.en.trim()) return "en";
  if (nameObj.ta && nameObj.ta.trim()) return "ta";
  if (nameObj.hi && nameObj.hi.trim()) return "hi";
  return "en";
}

// /**
//  * Check if a multilingual name is missing any translations
//  * @param {{ en, ta, hi }} nameObj
//  * @returns {boolean}
//  */
export function isMissingTranslations(nameObj) {
  if (!nameObj) return true;
  return !nameObj.en?.trim() || !nameObj.ta?.trim() || !nameObj.hi?.trim();
}