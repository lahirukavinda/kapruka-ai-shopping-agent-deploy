/**
 * User preferences cache — persists addressing mode, language, and name.
 * Never expires; updated on user interaction.
 */

import { getCache, setCache, invalidateCache } from "./cacheManager";

const STORAGE_KEY = "aura_user_prefs";
const NEVER_EXPIRES = Number.MAX_SAFE_INTEGER;

export type AddressingMode = "sir" | "madam" | "bro" | "machan" | "sis" | "name";

export interface UserPrefs {
  addressingMode: AddressingMode;
  name?: string;
  preferredLanguage: "en" | "si" | "tanglish";
  lastVisit: string; // ISO timestamp
}

export function getUserPrefs(): UserPrefs | null {
  return getCache<UserPrefs>(STORAGE_KEY, NEVER_EXPIRES);
}

export function setUserPrefs(prefs: UserPrefs): void {
  setCache(STORAGE_KEY, prefs);
}

export function updateUserPrefs(partial: Partial<UserPrefs>): void {
  const existing = getUserPrefs();
  const updated: UserPrefs = {
    addressingMode: partial.addressingMode ?? existing?.addressingMode ?? "sir",
    preferredLanguage: partial.preferredLanguage ?? existing?.preferredLanguage ?? "en",
    lastVisit: new Date().toISOString(),
    ...(partial.name !== undefined ? { name: partial.name } : existing?.name ? { name: existing.name } : {}),
  };
  setUserPrefs(updated);
}

export function clearUserPrefs(): void {
  invalidateCache(STORAGE_KEY);
}

/**
 * Detect addressing mode from a user message like "Call me Sir".
 * Returns the mode if detected, null otherwise.
 */
export function detectAddressingMode(message: string): AddressingMode | null {
  const lower = message.toLowerCase().trim();
  const patterns: { mode: AddressingMode; regex: RegExp }[] = [
    { mode: "sir", regex: /call me sir/i },
    { mode: "madam", regex: /call me madam/i },
    { mode: "bro", regex: /call me bro/i },
    { mode: "machan", regex: /call me machan/i },
    { mode: "sis", regex: /call me sis/i },
    { mode: "name", regex: /call me by my name/i },
  ];
  for (const { mode, regex } of patterns) {
    if (regex.test(lower)) return mode;
  }
  return null;
}

/**
 * Generate a personalized greeting for a returning user.
 */
export function getReturningGreeting(prefs: UserPrefs): string {
  const addressLabel =
    prefs.addressingMode === "name" && prefs.name
      ? prefs.name
      : prefs.addressingMode.charAt(0).toUpperCase() + prefs.addressingMode.slice(1);
  return `Welcome back, ${addressLabel}!`;
}
