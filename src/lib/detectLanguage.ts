import type { Language } from "@/types";

// Sinhala Unicode block: U+0D80 to U+0DFF
const SINHALA_REGEX = /[\u0D80-\u0DFF]/;

// Explicit requests for Sinhala language (romanized keywords)
const SINHALA_REQUEST_PATTERNS =
  /\b(sinhalen|sinhala|sinhalese|sinhala\s+walata|sinhala\s+karanawa)\b/i;

// Romanized Sinhala vocabulary — used to detect if a word is Sinhala
const SINHALA_WORDS = new Set([
  "mama", "oya", "mage", "eka", "ekak", "ganna", "kiyanna", "danna",
  "hoda", "nisa", "hari", "mokada", "kohomada", "kiyanawa", "balanna",
  "denna", "innawa", "yanawa", "karanawa", "wenawa", "thamai", "nemei",
  "neda", "ado", "machang", "aney", "aiyo", "karanna", "hadanna",
  "oyata", "eyata", "meka", "monawada", "kawuda", "kavuda", "epa",
  "onna", "hondai", "narkai", "puluwanda", "bari", "gamu", "kanna",
  "bonna", "yamu", "huganawa", "araganna", "mata", "oya", "eya",
  "api", "umba", "mang", "oya", "magey", "oyage", "eyage",
  "hodai", "narakay", "aniwa", "saththai", "niyamai", "patta",
  "supiri", "maru", "shaa", "ela", "gindara", "machan",
  "ayubowan", "subha", "dawasak", "isthuthi", "bohoma", "sthuthi",
  "kiyala", "kiyanawada", "balamu", "dannawa", "hadamu",
  "karapu", "giya", "aawa", "keruwa", "dunna", "gatte",
  "dukai", "sathutu", "kopaya", "ahanna", "puluwan",
  "gedarata", "yawanna", "thaggak", "vidiyata", "wisthara",
  "gaana", "kiyada", "aduvata", "ikmanata", "parakkuda",
  "ganan", "vadi", "one", "monawada", "kohe", "kavda",
  "godak", "tikak", "ithin", "eka", "ewa", "mewa", "owa",
  "hariyata", "hondatama", "ikmanin", "pamanak", "witharai",
]);

// Regex to match any Sinhala word from our vocabulary
const SINHALA_WORD_PATTERN =
  /\b(mama|oya|mage|eka|ekak|ganna|kiyanna|danna|hoda|nisa|hari|mokada|kohomada|kiyanawa|balanna|denna|innawa|yanawa|karanawa|wenawa|thamai|nemei|neda|ado|machang|aney|aiyo|karanna|hadanna|oyata|eyata|meka|monawada|kawuda|kavuda|epa|onna|hondai|narkai|puluwanda|bari|gamu|kanna|bonna|yamu|huganawa|araganna|mata|eya|api|umba|mang|magey|oyage|eyage|hodai|narakay|aniwa|saththai|niyamai|patta|supiri|maru|shaa|ela|gindara|machan|ayubowan|subha|dawasak|isthuthi|bohoma|sthuthi|kiyala|kiyanawada|balamu|dannawa|hadamu|karapu|giya|aawa|keruwa|dunna|gatte|dukai|sathutu|kopaya|ahanna|puluwan|gedarata|yawanna|thaggak|vidiyata|wisthara|gaana|kiyada|aduvata|ikmanata|parakkuda|ganan|vadi|one|kohe|kavda|godak|tikak|ithin|ewa|mewa|owa|hariyata|hondatama|ikmanin|pamanak|witharai|sinhalen)\b/gi;

/**
 * Check if the message is predominantly romanized Sinhala (no English mixing).
 * Split the message into words, count how many are known Sinhala words vs unknown.
 * If ALL/nearly all words are Sinhala → pure Sinhala. If any English mixed in → Tanglish.
 */
function isPureSinhala(text: string): boolean {
  const words = text.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean);
  if (words.length === 0) return false;

  let sinhalaCount = 0;
  for (const word of words) {
    if (SINHALA_WORDS.has(word)) {
      sinhalaCount++;
    }
  }

  // If ALL words are recognized Sinhala, or only very short unknown words remain
  // (like "ta", "da" which are particles), treat as pure Sinhala
  const unknownCount = words.length - sinhalaCount;
  if (unknownCount === 0) return true;

  // Allow only known Sinhala particles that aren't in our main vocabulary
  const SINHALA_PARTICLES = new Set(["ta", "da", "ne", "ko", "nam", "ge", "ka", "pa", "den", "neh", "ban"]);
  if (unknownCount <= 1) {
    const unknownWords = words.filter(w => !SINHALA_WORDS.has(w));
    return unknownWords.every(w => SINHALA_PARTICLES.has(w));
  }

  return false;
}

/**
 * Detect language from user input text.
 * - If ANY Sinhala unicode characters are present → "si"
 * - If user explicitly asks for Sinhala (e.g. "sinhalen") → "si"
 * - If message is predominantly romanized Sinhala with no/minimal English → "si"
 * - If message mixes Sinhala words with English words → "tanglish"
 * - Default → "en"
 */
export function detectLanguage(text: string): Language {
  // Actual Sinhala Unicode script
  if (SINHALA_REGEX.test(text)) {
    return "si";
  }

  // Explicit Sinhala request keywords
  if (SINHALA_REQUEST_PATTERNS.test(text)) {
    return "si";
  }

  // Check if any romanized Sinhala words are present
  const hasSinhalaWords = SINHALA_WORD_PATTERN.test(text);
  // Reset lastIndex since we used the global flag
  SINHALA_WORD_PATTERN.lastIndex = 0;

  if (hasSinhalaWords) {
    // If the message is predominantly Sinhala → respond in Sinhala
    // If mixed with English → respond in Tanglish
    return isPureSinhala(text) ? "si" : "tanglish";
  }

  return "en";
}
