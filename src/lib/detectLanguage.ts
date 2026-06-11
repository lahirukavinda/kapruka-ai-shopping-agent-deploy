import type { Language } from "@/types";

// Sinhala Unicode block: U+0D80 to U+0DFF
const SINHALA_REGEX = /[\u0D80-\u0DFF]/;

// Explicit requests for Sinhala language (romanized keywords)
const SINHALA_REQUEST_PATTERNS =
  /\b(sinhalen|sinhala|sinhalese|sinhala\s+walata|sinhala\s+karanawa)\b/i;

// Common Singlish/Tanglish loan words that indicate code-switching
const SINGLISH_PATTERNS =
  /\b(mama|oya|mage|eka|ekak|ganna|one|kiyanna|danna|hoda|nisa|hari|mokada|kohomada|kiyanawa|balanna|denna|innawa|yanawa|karanawa|wenawa|thamai|nemei|neda|ado|machang|aney|aiyo|karanna|hadanna|oyata|eyata|meka|eka|monawada|kawuda|kavuda|epa|onna|hondai|narkai|puluwanda|bari|hari|gamu|kanna|bonna|yamu|huganawa|araganna)\b/i;

/**
 * Detect language from user input text.
 * - If ANY Sinhala unicode characters are present → "si"
 * - If user explicitly asks for Sinhala (e.g. "sinhalen") → "si"
 * - If Singlish/Tanglish patterns detected → "tanglish"
 * - Default → "en"
 */
export function detectLanguage(text: string): Language {
  if (SINHALA_REGEX.test(text)) {
    return "si";
  }
  if (SINHALA_REQUEST_PATTERNS.test(text)) {
    return "si";
  }
  if (SINGLISH_PATTERNS.test(text)) {
    return "tanglish";
  }
  return "en";
}
