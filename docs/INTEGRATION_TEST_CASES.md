# Aura Kapruka — Integration Test Cases

Manual and automated test cases for verifying language detection, emotional support, addressing preferences, and conversational quality on the live deployment.

## Test Infrastructure

- **Unit tests:** `src/__tests__/detectLanguage.test.ts` — 24 automated tests for `detectLanguage()`
- **Unit tests:** `src/__tests__/orchestrator.test.ts` — Intent classification tests
- **Unit tests:** `src/__tests__/cacheManager.test.ts` — Cache manager utility (TTL, stale-while-revalidate, corrupted data)
- **Unit tests:** `src/__tests__/userPrefsCache.test.ts` — User preferences, addressing modes (all 13), returning user greeting
- **Unit tests:** `src/__tests__/categoriesCache.test.ts` — Categories cache (24h TTL, stale-while-revalidate)
- **Live deployment:** https://aura-kapruka.vercel.app/
- **Run all tests:** `npm run test`

---

## 1. Language Detection (Automated: `detectLanguage.test.ts`)

### Pure Sinhala → Respond in Sinhala Unicode Script

| Input | Expected Language | Expected Response Language |
|-------|------------------|--------------------------|
| `kohomada` | `si` | Full Sinhala Unicode (e.g., "හොඳින් ඉන්නවා!") |
| `mokada` | `si` | Full Sinhala Unicode |
| `ayubowan` | `si` | Full Sinhala Unicode |
| `mata dukai` | `si` | Full Sinhala Unicode |
| `sinhalen kiyanna` | `si` | Full Sinhala Unicode |
| `oya kohomada` | `si` | Full Sinhala Unicode |
| `mama hondai` | `si` | Full Sinhala Unicode |
| `bohoma isthuthi` | `si` | Full Sinhala Unicode |

### Tanglish (Code-switching) → Respond Mixing Sinhala Script + English

| Input | Expected Language | Expected Response Style |
|-------|------------------|------------------------|
| `mama phone ekak ganna one, budget eka 50k` | `tanglish` | Mix Sinhala Unicode + English (e.g., "මරු! Phone එකක් බලමු 🔥") |
| `mage laptop ekak repair karanna one` | `tanglish` | Mix Sinhala Unicode + English |
| `birthday gift ekak ganna one` | `tanglish` | Mix Sinhala Unicode + English |
| `mage gf` | `tanglish` | Mix Sinhala Unicode + English |
| `camera ekak balanna one under 50000` | `tanglish` | Mix Sinhala Unicode + English |
| `podi aulk bro` | `tanglish` | Mix Sinhala Unicode + English (emotional empathy) |
| `gf case machan` | `tanglish` | Mix Sinhala Unicode + English (emotional empathy) |

### English → Respond in English

| Input | Expected Language | Expected Response Style |
|-------|------------------|------------------------|
| `show me birthday cakes` | `en` | English |
| `I need a gift for my friend` | `en` | English |
| `what are the best phones under 50000` | `en` | English |
| `hello` | `en` | English |
| `track my order` | `en` | English |

---

## 2. Addressing Preference (Manual — Welcome Screen)

| Action | Expected Behavior |
|--------|-------------------|
| Click "Sir" chip | Sends "Call me Sir", Aura responds warmly with "Sir" |
| Click "Madam" chip | Sends "Call me Madam", Aura responds with female-appropriate slang only |
| Click "Bro" chip | Sends "Call me Bro", Aura responds with "Ela!" and uses male slang |
| Click "Machan" chip | Sends "Call me Machan", Aura uses casual male slang |
| Click "Sis" chip | Sends "Call me Sis", Aura uses female-appropriate slang only |
| Click "Just my name" chip | Sends "Call me by my name", Aura asks for name |
| Click "Aiya" chip | Sends "Call me Aiya", Aura responds with "Aiya" addressing |
| Click "Akka" chip | Sends "Call me Akka", Aura responds with "Akka" addressing |
| Click "Nangi" chip | Sends "Call me Nangi", Aura responds with "Nangi" addressing |
| Click "Malli" chip | Sends "Call me Malli", Aura responds with "Malli" addressing |
| Click "Uncle" chip | Sends "Call me Uncle", Aura responds with "Uncle" addressing |
| Click "Aunty" chip | Sends "Call me Aunty", Aura responds with "Aunty" addressing |
| Click "Boss" chip | Sends "Call me Boss", Aura responds with "Boss" addressing |
| Click "My name" chip | Name input field appears, enter name → "Call me by my name. My name is {name}" sent |

### Name Input Flow

| Step | Expected |
|------|----------|
| Click "My name" chip | Inline text input field appears with "Enter your name" placeholder |
| Type name + press Enter or click "Go" | Message "Call me by my name. My name is {name}" sent to LLM |
| Name cached | `aura_user_prefs.name` set in localStorage |
| Return visit | Greeting shows "Welcome back, {name}!" |

### Gender-Aware Slang Rules

| If user is... | ALLOWED expressions | NEVER use |
|---------------|--------------------|-----------| 
| Female (Madam/Sis) | niyamai, hari, shaa, lassanai, aniwa, saththai, maru | ela, machan, bro, patta, gindara, supiri |
| Male (Sir/Bro/Machan) | All expressions freely | — |

---

## 3. Emotional Support Agent (Manual)

### "Aiyo" Usage Rule
**"Aiyo" is ONLY for the USER'S OWN genuine emotional pain/grief.** Never for:
- Third-party positive news (e.g., "eya promote una" = she got promoted)
- Promotions, achievements, celebrations
- Search/technical errors
- Excitement, curiosity, or positive contexts

| Input | Expected "Aiyo"? | Expected Response |
|-------|------------------|-------------------|
| `my girlfriend broke up with me` | Yes (own sadness) | "Aiyo... that's rough" + empathy |
| `I got promoted!` | No | "Maru!" / "Congratulations!" + celebration |
| `eya promote una` (she got promoted) | No | "Congratulations!" / "That's wonderful!" — positive tone |
| `I need a birthday gift` | No | "Who's the lucky one?" |
| `mata dukai` (I'm sad) | Yes (own sadness) | "Aiyo..." + Sinhala empathy |
| `I just got engaged!` | No | "MARU!" + congratulations |
| `work is stressing me out` | No | "That sounds tough" + empathy |
| `my dog died` | Yes (own loss) | "Aiyo..." + condolences |
| `job promotion` | No | "Congratulations!" / "Niyamai!" — NO "Aiyo" |
| Search failed / API error | No | "Hmm, let me try again" — NO "Aiyo" |

### "Shaa!" Usage Rule
**"Shaa!" is ONLY for excitement, celebration, or wow moments.** NEVER for sad, stressed, or difficult situations.

| Input | Expected "Shaa!"? | Expected Response |
|-------|-------------------|-------------------|
| `podi aulk machan` (small problem) | NO | Empathetic — "mokada vune?" / "That sounds tough" |
| `aulak thamai` (having trouble) | NO | Empathetic — ask what happened |
| `I got promoted!` | Yes (celebration) | "Shaa!" / "Maru!" + congratulations |
| `I just got a new job!` | Yes (celebration) | Excitement + celebration |
| `gf case machan` (relationship problem) | NO | Empathetic — "mokada vune machan?" in Tanglish |

### Sri Lankan Slang Emotional Patterns (Automated: `orchestrator.test.ts`)

| Input | Expected Intent | Notes |
|-------|----------------|-------|
| `gf case machan` | `emotional` | "case" = relationship problem, NOT phone case |
| `my boyfriend scene is messed up` | `emotional` | "scene" = drama/situation |
| `ex cut kala` | `emotional` | "cut kala" = ghosted/broke up |
| `case broke with my crush` | `emotional` | Reversed word order still matches |
| `patch up karanawa` | `emotional` | Trying to reconcile |
| `podi aulk machan` | `emotional` | "podi aulk" = small problem |
| `aulak thamai` | `emotional` | Having trouble |
| `gediya wedi` | `emotional` | Tough situation |

### Language Matching in Emotional Responses

| Input Language | Expected Response Language |
|---------------|--------------------------|
| `gf case machan` (Tanglish) | Tanglish — mix Sinhala Unicode + English (e.g., "Aiyo... මොකද වුනේ machan?") |
| `podi aulk` (Sinhala words only) | Sinhala Unicode |
| `I'm feeling sad` (English) | English |

### Emotional Intent Detection
These should trigger the `emotional` intent (NOT shopping):

| Input | Expected Intent |
|-------|----------------|
| `I'm feeling sad` | `emotional` |
| `I got promoted!` | `emotional` |
| `my girlfriend broke up with me` | `emotional` |
| `I'm so stressed` | `emotional` |
| `feeling lonely today` | `emotional` |
| `we're celebrating our anniversary` | `emotional` |

---

## 4. Gift Suggestion Format (Manual)

When suggesting gift categories or product types, the response MUST:
- Format as a clear bullet/numbered list with emojis
- These MUST render as clickable action chips below the message

| Input | Expected Format | Expected Chips |
|-------|----------------|---------------|
| `job promotion, I want to get a gift` | Emoji bullet list | Clickable buttons (e.g., "🎁 Gift hampers", "🍫 Chocolates", "💐 Flowers", "🎂 Cakes") |
| `I want a gift for my friend` | Emoji bullet list | Clickable category chips |
| `what can I buy for amma?` | Emoji bullet list | Clickable category chips |

**NOT acceptable:** Embedding suggestions inline in prose (e.g., "You could try flowers, cakes, or chocolates")

---

## 5. Shopping Flow (Manual — No Regressions)

| Test Case | Steps | Expected |
|-----------|-------|----------|
| Product search | Type "show me birthday cakes under 5000 LKR" | Product cards with images, prices, buttons |
| Product carousel (mobile) | Search products on mobile viewport | Cards visible, horizontally scrollable, no blank area |
| Context actions (search) | After search results appear | Chips: "Add to Cart", "Find Similar", "Compare Options" |
| Context actions (product select) | Click "Details" on a product | Chips: "Add to Cart", "Find Similar", "Continue Delivery" |
| Add to cart | Click "Add to Cart" on a product | Cart count increases |
| Category browse | Click "Browse categories" chip | Category tiles appear at top. NO duplicated category buttons at bottom |
| Delivery check | Ask "can you deliver to Colombo?" | Logistics response |
| Dark mode | Click moon/sun toggle | UI switches theme |
| Chat history | Click clipboard icon | History panel slides out |

---

## 6. Sir/Madam Formal Language (Manual)

Sir/Madam users expect FORMAL English by default — NO Sinhala slang.

| Input (as Sir/Madam) | Expected | NOT Expected |
|---------------------|----------|-------------|
| Click "Sir" chip | "Good day, Sir. Welcome — how can I help you today?" | "Ela!", "Machan", "Shaa!" or any casual slang |
| `show me phones` | Professional English product listing | Sinhala slang mixed in |
| `eya promote una` | "That's wonderful! Congratulations!" (English) | "Aiyo...", "Maru!" or Sinhala expressions |

**Exception:** Sinhala expressions ARE allowed when the conversation switches to Sinhala mode (user types in pure Sinhala/Singlish and language is detected as `si` or `tanglish`).

---

## 7. UI / Visual (Manual)

| Test Case | Steps | Expected |
|-----------|-------|----------|
| Background scroll (light) | Scroll conversation to the very bottom | Background gradient continues smoothly — NO hard cutoff or color boundary |
| Background scroll (dark) | Switch to dark mode, scroll to bottom | Deep purple gradient fills entire area — NO plain black sections |
| Golden tree visible | Load welcome screen | Golden tree watermark visible in background (subtle) |
| Mobile product carousel | Search on mobile | Products render as swipeable cards with proper widths |

---

## 8. Caching Layer (Automated: `cacheManager.test.ts`, `userPrefsCache.test.ts`, `categoriesCache.test.ts`)

### Cache Manager (`src/lib/cache/cacheManager.ts`)

| Test Case | Expected |
|-----------|----------|
| `setCache` + `getCache` within TTL | Returns stored data |
| `getCache` past TTL | Returns null |
| `invalidateCache` | Removes entry from localStorage |
| `isCacheStale` within TTL | Returns false |
| `isCacheStale` past TTL | Returns true |
| `getCacheStale` past TTL | Returns data (ignores TTL) |
| Corrupted JSON in localStorage | Returns null gracefully (no throw) |
| `{data, timestamp}` JSON structure | Entries stored with data payload and numeric timestamp |

### User Preferences Cache (`src/lib/cache/userPrefsCache.ts`)

| Test Case | Expected |
|-----------|----------|
| Store and retrieve prefs | `getUserPrefs()` returns `{addressingMode, preferredLanguage, lastVisit}` |
| Prefs persisted under `aura_user_prefs` key | `localStorage.getItem('aura_user_prefs')` contains JSON |
| Optional name field | When `addressingMode: "name"`, `name` field stored and retrievable |
| `updateUserPrefs` partial update | Updates only specified fields, preserves others |
| `clearUserPrefs` | Removes `aura_user_prefs` from localStorage |
| `detectAddressingMode` — all 13 modes | Detects sir, madam, bro, machan, sis, aiya, akka, nangi, malli, uncle, aunty, boss, name |
| `detectAddressingMode` — case insensitive | "call me sir", "CALL ME BRO", "Call Me Aiya" all detected |
| `detectAddressingMode` — unrecognized | Returns null for non-matching messages |
| `getAddressingLabel` | Capitalizes mode; returns user name for "name" mode |
| `getReturningGreeting` | "Welcome back, Sir!" / "Welcome back, Lahiru!" |

### Categories Cache (`src/lib/cache/categoriesCache.ts`)

| Test Case | Expected |
|-----------|----------|
| Store and retrieve within 24h | `getCachedCategories()` returns categories array |
| Retrieve past 24h | `getCachedCategories()` returns null |
| `getStaleCategories` past 24h | Returns categories (stale-while-revalidate) |
| `areCategoriesStale` fresh | Returns false |
| `areCategoriesStale` past 24h | Returns true |
| `getCategoriesWithStaleness` fresh | `{categories, needsRefresh: false}` |
| `getCategoriesWithStaleness` stale | `{categories, needsRefresh: true}` |
| `getCategoriesWithStaleness` empty | `{categories: null, needsRefresh: true}` |

---

## 9. Cart Persistence & E2E Workflow (Manual)

| Test Case | Steps | Expected |
|-----------|-------|----------|
| Cart add | Search products → click "Add to Cart" | Cart badge increments, item in `aura-cart` localStorage |
| Cart survives refresh | Add item → refresh page | Cart badge still shows count, items preserved |
| Cart localStorage structure | Check `aura-cart` key | `{items: [{productId, name, price, currency, quantity, imageUrl}], deliveryCity, giftMessage}` |
| Returning user + cart | Set prefs → add to cart → reload | Welcome greeting shown, cart preserved |
| Full E2E workflow | 1. Select addressing mode → 2. Search products → 3. Add to cart → 4. Check delivery → 5. Reload | All state persisted: prefs cached, cart items preserved, delivery response rendered |

---

## 10. Returning User Flow (Manual)

| Test Case | Steps | Expected |
|-----------|-------|----------|
| First visit | Clear localStorage → load page | Welcome screen with "Ayubowan!" and 13 addressing chips |
| Set preference | Click any addressing chip | Message sent, prefs cached in `aura_user_prefs` |
| Return visit | Reload page with prefs cached | Welcome screen hidden, "Welcome back, {label}!" greeting shown |
| No dual display | Return visit after fix | Only greeting card visible, NOT both welcome + greeting |
| Name mode return | Set "My name" + enter name → reload | "Welcome back, {name}!" greeting |

---

## 11. Running Tests

```bash
# All tests (unit + integration)
npm run test

# Just language detection
npx vitest run src/__tests__/detectLanguage.test.ts

# Just orchestrator (intent classification)
npx vitest run src/__tests__/orchestrator.test.ts

# Cache manager tests
npx vitest run src/__tests__/cacheManager.test.ts

# User preferences cache tests
npx vitest run src/__tests__/userPrefsCache.test.ts

# Categories cache tests
npx vitest run src/__tests__/categoriesCache.test.ts

# TypeScript check
npx tsc --noEmit

# Lint
npm run lint
```

---

## 12. Adding New Test Cases

When adding new Sinhala words or emotional patterns:

1. Add the word to `SINHALA_WORDS` set in `src/lib/detectLanguage.ts`
2. Add a test case in `src/__tests__/detectLanguage.test.ts`
3. Add the expected behavior to this document
4. Run `npm run test` to verify

When adding new emotional keywords:
1. Add the keyword to `EMOTIONAL_PATTERNS` in `src/lib/agents/orchestrator.ts`
2. Add a test case in `src/__tests__/orchestrator.test.ts`
3. Add the expected behavior to this document

When adding new addressing modes:
1. Add the mode to `AddressingMode` type in `src/lib/cache/userPrefsCache.ts`
2. Add a detection regex pattern in `detectAddressingMode()`
3. Add the chip button in `src/components/chat/ChatContainer.tsx`
4. Add test cases in `src/__tests__/userPrefsCache.test.ts`
5. Add the expected behavior to this document
