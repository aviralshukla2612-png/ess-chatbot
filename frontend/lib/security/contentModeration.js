/**
 * Emperor Nexus — Content Moderation & Acceptable Use Policy Guard
 * Permanently bans Gambling, Betting, Adult/Pornographic, and Illicit content.
 */

export const PROHIBITED_KEYWORDS = [
  // 1. Adult, Pornography, Sexually Explicit & NSFW
  "porn", "porno", "pornography", "pornographic", "xxx", "adult", "adult content",
  "adult entertainment", "adult video", "adult site", "adult store", "adult club",
  "sex site", "sex shop", "erotic", "erotica", "escort", "escorts", "strip club",
  "stripper", "nsfw", "nudes", "nude", "naked", "camgirl", "onlyfans", "hentai",
  "milf", "dildo", "vibrator", "brothel", "sex toys", "sexual services", "fetish",
  "webcam model", "livejasmin", "chaturbate", "xhamster", "xvideos", "pornhub",

  // 2. Gambling, Betting, Casinos & Lotteries
  "gambling", "gamble", "casino", "casinos", "betting", "poker", "roulette",
  "blackjack", "slots", "slot machine", "jackpot", "sportsbook", "bookmaker",
  "bookie", "lottery", "lotto", "satta", "matka", "teen patti", "teenpatti",
  "rummy", "andar bahar", "1xbet", "betway", "stake.com", "parimatch", "dafabet",
  "bet365", "wager", "wagering", "aviator game", "crash game", "color prediction",
  "online betting", "sports betting", "live casino", "betting tips", "gambling app",

  // 3. Illegal & Illicit Goods/Services
  "darkweb", "dark web", "illicit drugs", "cocaine", "heroin", "methamphetamine",
  "money laundering", "hackers for hire", "fake id", "stolen cards"
];

// Regex matching word boundaries or common phrase occurrences
const PROHIBITED_REGEXES = PROHIBITED_KEYWORDS.map((kw) => {
  if (kw.includes(" ") || kw.includes(".")) {
    const escaped = kw.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    return new RegExp(escaped, "i");
  }
  return new RegExp(`\\b${kw}\\b`, "i");
});

/**
 * Validates text or object fields against prohibited categories.
 * @param {string|object|array} input
 * @returns {{ ok: boolean, violation?: string, matchedKeyword?: string, error?: string }}
 */
export function validateProhibitedContent(input) {
  if (!input) return { ok: true };

  let textToScan = "";

  if (typeof input === "string") {
    textToScan = input;
  } else if (Array.isArray(input)) {
    textToScan = input.map((item) => (typeof item === "string" ? item : JSON.stringify(item))).join(" ");
  } else if (typeof input === "object") {
    textToScan = Object.values(input)
      .map((val) => (typeof val === "string" ? val : Array.isArray(val) ? val.join(" ") : typeof val === "object" ? JSON.stringify(val) : ""))
      .join(" ");
  }

  const normalized = textToScan.toLowerCase();

  for (let i = 0; i < PROHIBITED_KEYWORDS.length; i++) {
    const kw = PROHIBITED_KEYWORDS[i];
    const regex = PROHIBITED_REGEXES[i];

    if (regex.test(normalized)) {
      const isAdult = i < 38;
      const isGambling = i >= 38 && i < 66;
      const category = isAdult
        ? "Adult / Pornographic Content"
        : isGambling
        ? "Gambling / Betting Services"
        : "Prohibited / Illicit Goods";

      return {
        ok: false,
        violation: category,
        matchedKeyword: kw,
        error: `PROHIBITED_CATEGORY_VIOLATION: This platform permanently bans ${category}. Bots, websites, or knowledge bases involving '${kw}' are strictly forbidden on Emperor Nexus.`,
      };
    }
  }

  return { ok: true };
}
