# Aura Kapruka — Integration Test Cases

Manual and automated test cases for verifying language detection, emotional support, addressing preferences, and conversational quality on the live deployment.

## Test Infrastructure

- **Unit tests:** `src/__tests__/detectLanguage.test.ts` — 24 automated tests for `detectLanguage()`
- **Unit tests:** `src/__tests__/orchestrator.test.ts` — Intent classification tests
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

## 8. Running Tests

```bash
# All tests (unit + integration)
npm run test

# Just language detection
npx vitest run src/__tests__/detectLanguage.test.ts

# Just orchestrator (intent classification)
npx vitest run src/__tests__/orchestrator.test.ts

# TypeScript check
npx tsc --noEmit

# Lint
npm run lint
```

---

## 9. Adding New Test Cases

When adding new Sinhala words or emotional patterns:

1. Add the word to `SINHALA_WORDS` set in `src/lib/detectLanguage.ts`
2. Add a test case in `src/__tests__/detectLanguage.test.ts`
3. Add the expected behavior to this document
4. Run `npm run test` to verify

When adding new emotional keywords:
1. Add the keyword to `EMOTIONAL_PATTERNS` in `src/lib/agents/orchestrator.ts`
2. Add a test case in `src/__tests__/orchestrator.test.ts`
3. Add the expected behavior to this document
