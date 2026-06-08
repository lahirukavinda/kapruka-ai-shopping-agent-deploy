# Kapruka AI Shopping Agent — Technical Specification

> Companion document to the [Project Plan](./e-commerce-agent-plan.md).
> This spec covers animation configs, avatar design, recommendation engine, comparison UX, error handling, responsive layout, accessibility, and state management — the gaps that bring the project plan from 75-85 → 95-100 on the scoring rubric.

---

## Table of Contents

1. [Animation Specification](#1-animation-specification)
2. [Aura Avatar Design](#2-aura-avatar-design)
3. [Recommendation & Cross-Selling Engine](#3-recommendation--cross-selling-engine)
4. [Product Comparison Component](#4-product-comparison-component)
5. [Error Handling Matrix](#5-error-handling-matrix)
6. [Responsive Design Specification](#6-responsive-design-specification)
7. [Accessibility Specification](#7-accessibility-specification)
8. [State Management Design](#8-state-management-design)

---

## 1. Animation Specification

All animations use [Framer Motion](https://www.framer.com/motion/) with the `variants` API to orchestrate parent/child transitions. Every animation respects `prefers-reduced-motion` (see [§7](#7-accessibility-specification)).

### 1.1 Message Bubble Entry

```tsx
const messageBubbleVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300,
    },
  },
};

// Usage
<motion.div variants={messageBubbleVariants} initial="hidden" animate="visible">
  {messageContent}
</motion.div>
```

Fade + slide-up with a spring feel. `damping: 20` prevents overshoot; `stiffness: 300` keeps it snappy (~200 ms settle time).

### 1.2 Product Card Stagger

```tsx
const cardContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05, // 50 ms delay per card
    },
  },
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 20, stiffness: 300 },
  },
};

// Usage — parent orchestrates stagger
<motion.div variants={cardContainerVariants} initial="hidden" animate="visible">
  {products.map((p) => (
    <motion.div key={p.id} variants={cardItemVariants}>
      <ProductCard product={p} />
    </motion.div>
  ))}
</motion.div>
```

The parent `staggerChildren: 0.05` delays each child by 50 ms, creating a cascade effect across search results.

### 1.3 Add-to-Cart Bounce

```tsx
const addToCartVariants = {
  idle: { scale: 1 },
  bounce: {
    scale: [1, 1.2, 1],
    transition: { duration: 0.3, times: [0, 0.4, 1] },
  },
};

// Triggered on click via animate controls
const controls = useAnimationControls();
const handleAddToCart = () => {
  controls.start("bounce");
  addItemToCart(product);
};

<motion.button variants={addToCartVariants} animate={controls}>
  Add to Cart
</motion.button>
```

Scale `1 → 1.2 → 1` over 300 ms with the peak at 40% of the duration.

### 1.4 Cart Sidebar Slide-In

```tsx
const cartSidebarVariants = {
  closed: { x: "100%" },
  open: {
    x: 0,
    transition: { type: "spring", damping: 25, stiffness: 250 },
  },
};

const overlayVariants = {
  closed: { opacity: 0 },
  open: { opacity: 0.5, transition: { duration: 0.2 } },
};

<AnimatePresence>
  {isCartOpen && (
    <>
      <motion.div
        className="fixed inset-0 bg-black"
        variants={overlayVariants}
        initial="closed"
        animate="open"
        exit="closed"
      />
      <motion.aside
        className="fixed right-0 top-0 h-full w-80"
        variants={cartSidebarVariants}
        initial="closed"
        animate="open"
        exit="closed"
      >
        <CartContent />
      </motion.aside>
    </>
  )}
</AnimatePresence>
```

### 1.5 Modal Overlay

```tsx
const modalOverlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
};

const modalContentVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", damping: 25, stiffness: 300 },
  },
};
```

### 1.6 Skeleton Loading Shimmer

Product cards display a shimmer placeholder while data loads:

```tsx
// components/ProductCardSkeleton.tsx
const ProductCardSkeleton = () => (
  <div className="animate-pulse rounded-xl border border-gray-200 p-4">
    {/* Image placeholder */}
    <div className="h-48 w-full rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
    {/* Title */}
    <div className="mt-3 h-4 w-3/4 rounded bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
    {/* Price */}
    <div className="mt-2 h-4 w-1/3 rounded bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
    {/* Button */}
    <div className="mt-4 h-10 w-full rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
  </div>
);
```

Tailwind keyframe (add to `tailwind.config.ts`):

```ts
// tailwind.config.ts — extend
{
  animation: {
    shimmer: "shimmer 1.5s ease-in-out infinite",
  },
  keyframes: {
    shimmer: {
      "0%":   { backgroundPosition: "200% 0" },
      "100%": { backgroundPosition: "-200% 0" },
    },
  },
}
```

---

## 2. Aura Avatar Design

### 2.1 Format & Library

- **Format:** Lottie JSON
- **Library:** [`lottie-react`](https://www.npmjs.com/package/lottie-react) — lightweight React wrapper around `lottie-web`.
- **Source:** LottieFiles public library for base animations, or custom SVG with CSS keyframe fallback when a Lottie asset is unavailable.
- **Fallback:** If the Lottie JSON fails to load, render a static SVG avatar with CSS `@keyframes` for breathing/pulse effects.

### 2.2 Avatar States

| # | State         | Animation Description                  | Lottie Loop | Trigger                                      |
|---|---------------|----------------------------------------|-------------|-----------------------------------------------|
| 1 | **Idle**      | Gentle breathing loop — subtle vertical bob (±2 px) at 0.8 Hz | yes | Default / no active interaction |
| 2 | **Thinking**  | Three-dot bounce (sequential, 0.2 s offset per dot) | yes | User starts typing or agent is generating |
| 3 | **Excited**   | Quick bounce (scale 1→1.15→1) + sparkle particles | no (play once) | Search results returned with products |
| 4 | **Celebrating** | Confetti burst from avatar center, 1.5 s duration | no (play once) | Order placed successfully |
| 5 | **Empathetic** | Soft slow pulse — opacity 0.85↔1.0 at 0.5 Hz, slight head tilt | yes | Sad/empathetic context detected in user message |

### 2.3 State Machine Transitions

```
                 ┌──────────────────────────────┐
                 │           IDLE               │
                 │   (default, breathing loop)   │
                 └──┬────┬────┬────┬───────────┘
                    │    │    │    │
    user typing ────┘    │    │    └──── sad context ──→ EMPATHETIC
                         │    │                              │
                         │    └─── order placed ──→ CELEBRATING
                         │                              │
                         └──── results found ──→ EXCITED │
                         │                        │      │
                         ▼                        │      │
                     THINKING ────────────────────┘      │
                         │                               │
                         └───── 3 s timeout ─────────────┘
                                   │
                                   ▼
                                 IDLE
```

- **user typing** → `THINKING` (after 300 ms debounce)
- **search results returned** → `EXCITED` → auto-return to `IDLE` after animation completes
- **order placed** → `CELEBRATING` → auto-return to `IDLE` after 1.5 s
- **sad context detected** (keywords: "broke up", "sad", "miss", "sorry", or LLM-classified sentiment) → `EMPATHETIC` → returns to `IDLE` when next non-sad message arrives
- **All non-looping states** → auto-return to `IDLE` after playback or 3 s timeout

### 2.4 Placement & Sizing

| Context                 | Size    | Positioning                              |
|-------------------------|---------|------------------------------------------|
| Inline with agent msgs  | 32×32 px | Left of message bubble, vertically centered |
| App header              | 64×64 px | Left of "Aura" title, centered vertically  |

### 2.5 Accessibility

```css
@media (prefers-reduced-motion: reduce) {
  .aura-avatar lottie-player,
  .aura-avatar .lottie-react {
    animation: none !important;
    /* Show static first frame only */
  }
}
```

Use `lottie-react`'s `isStopped` prop to freeze the animation when `prefers-reduced-motion` is active:

```tsx
const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

<Lottie
  animationData={currentStateData}
  loop={currentState.loop}
  autoplay={!prefersReducedMotion}
  isStopped={prefersReducedMotion}
  style={{ width: size, height: size }}
/>
```

---

## 3. Recommendation & Cross-Selling Engine

### 3.1 Intent Classification

The Concierge agent classifies each user message into one of these intent categories before delegating:

| Intent               | Example Inputs                                                  | Agent Action                                           |
|----------------------|-----------------------------------------------------------------|--------------------------------------------------------|
| `everyday_shopping`  | "I need a phone", "grocery list", "kitchen stuff"               | Shopper searches, Concierge recommends + cross-sells   |
| `gift_sending`       | "birthday gift for mom", "send flowers to Kandy"                | Shopper searches gift items, Logistics checks delivery |
| `order_tracking`     | "track KAP-12345", "where is my order?"                        | Concierge calls `kapruka_track_order` directly         |
| `browsing`           | "what categories do you have?", "show me what's new"           | Shopper calls `kapruka_list_categories`                |
| `restocking`         | "restock essentials", "weekly groceries again"                  | Shopper searches staples, Concierge suggests additions |

### 3.2 Cross-Sell Rule Table

| Primary Product | Cross-Sell Suggestions                        | Rationale                     |
|-----------------|-----------------------------------------------|-------------------------------|
| Phone           | Phone case, screen protector, charger         | Protection + power essentials |
| Groceries       | Coconut milk, dhal, rice                      | Sri Lankan kitchen staples    |
| Flowers         | Chocolate, greeting card, teddy bear          | Gift bundle upsell            |
| Laptop          | Mouse, laptop bag, cooling pad                | Productivity accessories      |
| Camera          | Memory card, camera bag, tripod               | Photography essentials        |
| Baby items      | Diapers, baby wipes, feeding bottle           | Parenting basics              |
| Tea/coffee      | Biscuits, sugar, milk powder                  | Sri Lankan tea-time bundle    |

Implementation: store as a `Map<string, string[]>` keyed by category keyword. When the Shopper agent finds products, the Concierge checks the primary category against the rule table and appends cross-sell search queries.

### 3.3 Budget-Aware Logic

```
1. Extract budget from user message:
   - Regex: /(?:under|below|budget|max|less than)\s*(?:LKR|Rs\.?)?\s*([\d,]+)/i
   - LLM fallback: ask Concierge to extract numeric budget if regex fails.

2. Filter:
   - Pass `max_price: budget` to `kapruka_search_products`.
   - For cross-sell items: sum (primary + suggestion) ≤ budget.
   - If no items fit, widen by 10% and inform user: "Closest options are slightly above budget."

3. Surface savings:
   - If item is below budget: "This one's LKR 2,500 under your budget — leaves room for a case too!"
```

### 3.4 System Prompt Template (Concierge Cross-Sell Instructions)

```
You are Aura, the Kapruka shopping concierge.

When a user searches for a product:
1. Show the top results first.
2. Check the CROSS-SELL RULES below. If the primary product category matches,
   suggest 1-2 complementary items naturally in conversation.
3. If the user stated a budget, ensure ALL suggestions (primary + cross-sell)
   fit within budget. Mention the savings.
4. Never push more than 2 cross-sell items per turn.
5. Frame suggestions as helpful ("Since you're getting a phone, you might
   want a case to keep it safe — here's one that fits your budget").

CROSS-SELL RULES:
- phone → case, screen protector, charger
- groceries → coconut milk, dhal, rice
- flowers → chocolate, card, teddy bear
- laptop → mouse, bag, cooling pad
- camera → memory card, camera bag, tripod
- baby items → diapers, baby wipes, feeding bottle
- tea/coffee → biscuits, sugar, milk powder
```

### 3.5 Structured Recommendation Output

Use Vercel AI SDK's `generateObject` with a Zod schema for type-safe recommendation responses:

```ts
import { generateObject } from "ai";
import { z } from "zod";

const RecommendationSchema = z.object({
  primaryProducts: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      price: z.number(),
      currency: z.enum(["LKR", "USD"]),
      reason: z.string().describe("Why this product is recommended"),
    })
  ),
  crossSellSuggestions: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      price: z.number(),
      currency: z.enum(["LKR", "USD"]),
      relatedTo: z.string().describe("Which primary product this complements"),
      pitch: z.string().describe("One-line suggestion in Aura's voice"),
    })
  ),
  budgetSummary: z
    .object({
      userBudget: z.number().nullable(),
      totalSuggested: z.number(),
      remaining: z.number().nullable(),
    })
    .optional(),
});

const result = await generateObject({
  model: openai("gpt-4o"),
  schema: RecommendationSchema,
  prompt: buildRecommendationPrompt(userMessage, searchResults),
});
```

---

## 4. Product Comparison Component

### 4.1 Desktop Layout (≥ 1024 px)

Side-by-side cards in a CSS grid, maximum 3 products:

```tsx
<div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
  {comparisonProducts.map((product) => (
    <ComparisonCard key={product.id} product={product} />
  ))}
</div>
```

Below the cards, render a comparison summary table with attribute rows.

### 4.2 Mobile Layout (< 1024 px)

Swipeable horizontal stack using Framer Motion drag gestures:

```tsx
<motion.div
  className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-4"
  drag="x"
  dragConstraints={{ left: -((products.length - 1) * 280), right: 0 }}
>
  {comparisonProducts.map((product) => (
    <motion.div key={product.id} className="snap-center min-w-[280px]">
      <ComparisonCard product={product} />
    </motion.div>
  ))}
</motion.div>
```

Below the swipeable stack, show a vertical comparison summary table.

### 4.3 Attribute Rows

| Attribute     | Source                                                                 |
|---------------|------------------------------------------------------------------------|
| Price         | `product.price` from `kapruka_get_product`                             |
| Rating        | `product.rating` (if available) or "N/A"                              |
| Stock Status  | `product.in_stock` — display as "In Stock" (green) / "Out of Stock" (red) |
| Key Specs     | Extracted from `product.description` via LLM summarization             |

Key specs extraction prompt:

```
Extract 3-5 key specifications from this product description as short phrases
(e.g., "128 GB storage", "6.7-inch display", "5000 mAh battery").
Return as a JSON array of strings.
```

### 4.4 Best Value Badge

Highlight the product with the best price-to-rating ratio:

```ts
const bestValue = comparisonProducts.reduce((best, p) => {
  const score = (p.rating ?? 0) / p.price;
  return score > ((best.rating ?? 0) / best.price) ? p : best;
});
```

Display a "Best Value ✦" badge on the winning card.

### 4.5 Data Fetching

Fetch all comparison products in parallel using `Promise.all`:

```ts
const products = await Promise.all(
  selectedIds.map((id) => mcpClient.call("kapruka_get_product", { id }))
);
```

---

## 5. Error Handling Matrix

| Error Type              | Detection                         | User Message (Aura's Voice)                                                  | Recovery Action                                                                                              |
|-------------------------|-----------------------------------|-------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| **MCP timeout**         | 5 s request timeout               | "Aiyo, Kapruka servers are being slow. Let me try again..."                   | Retry with exponential backoff: 1 s → 2 s → 4 s, max 3 retries. Show skeleton loader during retry.          |
| **Empty search results**| 0 results returned                | "Hmm, couldn't find exactly that. How about these?"                           | Broaden search: remove filters, try related/synonym terms, fall back to category browse.                     |
| **Rate limit hit**      | HTTP 429 response                 | "I'm shopping too fast! Give me a moment..."                                  | Queue pending requests, 10 s cooldown, then resume. Show a gentle progress indicator.                        |
| **Order creation failure** | Error from `kapruka_create_order` | "Something went wrong with the order. Your cart is safe — let's try again."  | Preserve cart state in context + localStorage. Show a retry button. Log error for diagnostics.               |
| **Network offline**     | `navigator.onLine === false`      | "Looks like we lost connection. I'll be right here when you're back."         | Show offline banner at top. Listen for `online` event, auto-retry last failed request on reconnect.          |
| **LLM error**           | OpenAI / Anthropic API error      | "My brain glitched for a second. Could you say that again?"                   | Retry once with same model. If still failing, fall back to `gpt-4o-mini` (cheaper, faster, more available).  |

### Implementation Notes

**Exponential backoff utility:**

```ts
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("Unreachable");
}
```

**Offline detection hook:**

```ts
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return isOnline;
}
```

---

## 6. Responsive Design Specification

### 6.1 Breakpoints

Using Tailwind CSS defaults:

| Token | Min-Width | Typical Devices         |
|-------|-----------|-------------------------|
| `sm`  | 640 px    | Large phones (landscape) |
| `md`  | 768 px    | Tablets                  |
| `lg`  | 1024 px   | Laptops / desktops       |

### 6.2 Chat Input

```css
.chat-input {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  min-height: 48px;
  font-size: 16px;            /* Prevents iOS auto-zoom on focus */
  padding-bottom: env(safe-area-inset-bottom);  /* Notched devices */
}
```

Fixed bottom bar across all breakpoints. The `16px` font size is critical — iOS Safari zooms the viewport when an input has `font-size < 16px`.

### 6.3 Product Card Grid

```html
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- ProductCard components -->
</div>
```

| Breakpoint | Columns | Card Width     |
|------------|---------|----------------|
| < 640 px   | 1       | Full width     |
| ≥ 640 px   | 2       | ~50% container |
| ≥ 1024 px  | 3       | ~33% container |

### 6.4 Cart: Bottom Sheet vs. Sidebar

| Breakpoint | Component        | Behavior                                                         |
|------------|------------------|------------------------------------------------------------------|
| < 768 px   | Bottom sheet     | Slides up from bottom, drag handle to dismiss, max-height 85dvh  |
| ≥ 768 px   | Slide-out sidebar | Right-side panel, 320 px wide, overlay backdrop                 |

**Bottom sheet implementation:**

```tsx
// Mobile cart bottom sheet with drag-to-dismiss
<motion.div
  className="fixed bottom-0 left-0 right-0 rounded-t-2xl bg-white shadow-2xl md:hidden"
  drag="y"
  dragConstraints={{ top: 0 }}
  dragElastic={0.2}
  onDragEnd={(_, info) => {
    if (info.offset.y > 150) closeCart(); // Dismiss threshold
  }}
  initial={{ y: "100%" }}
  animate={{ y: 0 }}
  exit={{ y: "100%" }}
  style={{ maxHeight: "85dvh" }}
>
  {/* Drag handle */}
  <div className="mx-auto my-2 h-1 w-10 rounded-full bg-gray-300" />
  <CartContent />
</motion.div>
```

### 6.5 Product Detail

| Breakpoint | Component           | Behavior                                                          |
|------------|---------------------|-------------------------------------------------------------------|
| < 768 px   | Full-screen modal    | Takes entire viewport, close button top-right, scroll for content |
| ≥ 768 px   | Centered overlay     | `max-w-2xl`, centered with backdrop, max-height 90vh with scroll  |

### 6.6 Touch Targets

All interactive elements have a minimum tap area of **44×44 px** per [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/layout):

```css
.touch-target {
  min-width: 44px;
  min-height: 44px;
}
```

Apply to: buttons, links, chips, quantity controls, close icons. Use `p-3` (12 px padding) on small icons to expand hit area without visual bloat.

### 6.7 Viewport & Safe Areas

```css
:root {
  /* Use dynamic viewport height to handle mobile browser chrome */
  --app-height: 100dvh;
}

.app-container {
  height: var(--app-height);
  padding-bottom: env(safe-area-inset-bottom);
}
```

`100dvh` correctly handles the shrinking/expanding address bar on mobile Safari and Chrome. `env(safe-area-inset-bottom)` adds padding for notched devices (iPhone, Pixel).

---

## 7. Accessibility Specification

### 7.1 Chat Messages

```html
<div role="log" aria-label="Chat conversation" aria-live="polite">
  <!-- Message bubbles rendered here -->
  <div role="article" aria-label="Aura says: ...">...</div>
  <div role="article" aria-label="You said: ...">...</div>
</div>
```

- Container: `role="log"` with `aria-live="polite"` — screen readers announce new messages without interrupting current speech.
- Each message: `role="article"` with a descriptive `aria-label`.

### 7.2 Streaming Text

While the agent is streaming a response:

```html
<div role="article" aria-busy="true" aria-label="Aura is typing...">
  {streamedText}
</div>
```

- `aria-busy="true"` tells assistive tech the content is still updating.
- On stream completion, remove `aria-busy` and set a final `aria-label` with the complete message.
- Announce completion with a visually hidden live region: `<span className="sr-only" aria-live="assertive">Aura finished responding.</span>`.

### 7.3 Product Cards

```html
<div role="article" aria-label="Samsung Galaxy A15, LKR 42,990, In Stock">
  <img src="..." alt="Samsung Galaxy A15 — front and back view" />
  <!-- ... -->
</div>
```

- Each card: `role="article"` with a composed `aria-label` (name + price + stock).
- Images: `alt` text derived from `product.name`. For product images: `"{name} — product photo"`.

### 7.4 Keyboard Navigation

| Key        | Action                                      |
|------------|---------------------------------------------|
| `Tab`      | Move through quick-action chips, buttons, inputs |
| `Enter`    | Send message (when input focused), activate button |
| `Escape`   | Close modal, close cart sidebar/bottom sheet |
| `Arrow ←/→` | Navigate product carousel                  |

Focus order: Chat input → Quick-action chips → Product cards → Cart button → Cart panel.

### 7.5 Focus Management

```ts
// Auto-focus input after agent responds
useEffect(() => {
  if (!isStreaming && inputRef.current) {
    inputRef.current.focus();
  }
}, [isStreaming]);

// Trap focus in modals
// Use a focus-trap library (e.g., focus-trap-react) for product detail
// and cart modals to prevent Tab from escaping.
```

### 7.6 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  /* Replace all spring animations with simple opacity fades */
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.15s !important;
  }
}
```

In Framer Motion, detect and swap variants:

```tsx
const prefersReducedMotion = useReducedMotion(); // from framer-motion

const messageVariants = prefersReducedMotion
  ? {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.15 } },
    }
  : {
      hidden: { opacity: 0, y: 12 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", damping: 20, stiffness: 300 },
      },
    };
```

### 7.7 Color Contrast

- All text: minimum **4.5:1** contrast ratio (WCAG AA).
- Large text (≥ 18 px or ≥ 14 px bold): minimum **3:1**.
- Interactive elements (buttons, links): distinct focus indicator with **3:1** contrast against adjacent colors.
- Verify with Tailwind's default palette: `text-gray-900` on `bg-white` = 21:1 ✓, `text-gray-600` on `bg-white` = 5.7:1 ✓.

### 7.8 Sinhala Font Loading

```css
@font-face {
  font-family: "Noto Sans Sinhala";
  src: url("/fonts/NotoSansSinhala-Variable.woff2") format("woff2");
  font-weight: 100 900;
  font-display: swap;  /* Show fallback text immediately, swap when loaded */
  unicode-range: U+0D80-0DFF;  /* Sinhala Unicode block only */
}

body {
  font-family: "Inter", "Noto Sans Sinhala", system-ui, sans-serif;
}
```

- `font-display: swap` ensures Sinhala text renders immediately with a fallback, then swaps to Noto Sans Sinhala once loaded. No invisible text flash.
- `unicode-range` limits download to only Sinhala characters — the font file is not fetched if the page contains no Sinhala text.

---

## 8. State Management Design

### 8.1 Overview

| Concern              | Solution                                      | Persistence       |
|----------------------|-----------------------------------------------|--------------------|
| Cart                 | React Context + `useReducer`                  | `localStorage`     |
| Theme (dark/light)   | React Context                                 | `localStorage`     |
| Language (en/si/tanglish) | React Context                            | `localStorage`     |
| Conversation history | Vercel AI SDK `useChat` hook                  | In-memory (session) |

### 8.2 Cart State Shape

```ts
interface CartItem {
  productId: string;
  name: string;
  price: number;
  currency: "LKR" | "USD";
  quantity: number;
  imageUrl: string;
  variant?: string; // e.g., "128GB, Black"
}

interface CartState {
  items: CartItem[];
  deliveryCity: string | null;
  giftMessage: string | null;
}
```

### 8.3 Cart Context & Reducer

```tsx
type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: { productId: string } }
  | { type: "UPDATE_QUANTITY"; payload: { productId: string; quantity: number } }
  | { type: "SET_DELIVERY_CITY"; payload: string }
  | { type: "SET_GIFT_MESSAGE"; payload: string | null }
  | { type: "CLEAR_CART" };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find(
        (i) => i.productId === action.payload.productId
      );
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.productId === action.payload.productId
              ? { ...i, quantity: i.quantity + action.payload.quantity }
              : i
          ),
        };
      }
      return { ...state, items: [...state.items, action.payload] };
    }
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter(
          (i) => i.productId !== action.payload.productId
        ),
      };
    case "UPDATE_QUANTITY":
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === action.payload.productId
            ? { ...i, quantity: Math.max(1, action.payload.quantity) }
            : i
        ),
      };
    case "SET_DELIVERY_CITY":
      return { ...state, deliveryCity: action.payload };
    case "SET_GIFT_MESSAGE":
      return { ...state, giftMessage: action.payload };
    case "CLEAR_CART":
      return { items: [], deliveryCity: null, giftMessage: null };
    default:
      return state;
  }
}
```

### 8.4 localStorage Persistence

```tsx
const CART_STORAGE_KEY = "aura-cart";

function usePersistedCart() {
  const [state, dispatch] = useReducer(cartReducer, { items: [], deliveryCity: null, giftMessage: null }, () => {
    if (typeof window === "undefined") return { items: [], deliveryCity: null, giftMessage: null };
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : { items: [], deliveryCity: null, giftMessage: null };
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return [state, dispatch] as const;
}
```

### 8.5 Conversation State

Managed entirely by Vercel AI SDK's `useChat` hook — no custom state required:

```tsx
const { messages, input, handleInputChange, handleSubmit, isLoading } =
  useChat({
    api: "/api/chat",
    // Tool results rendered by custom message components
  });
```

`useChat` handles streaming, message history, and tool call results. The conversation lives in memory for the session; persistence across page reloads is not required (fresh conversations are fine for a shopping agent).

### 8.6 Theme & Language Contexts

```tsx
// Minimal context — stored in localStorage, toggled via UI
const ThemeContext = createContext<{
  theme: "light" | "dark";
  toggle: () => void;
}>({ theme: "light", toggle: () => {} });

const LanguageContext = createContext<{
  language: "en" | "si" | "tanglish";
  setLanguage: (lang: "en" | "si" | "tanglish") => void;
}>({ language: "en", setLanguage: () => {} });
```

---

*Document created: June 2026*
*Companion to: [e-commerce-agent-plan.md](./e-commerce-agent-plan.md)*
*Challenge deadline: 30 June 2026*
