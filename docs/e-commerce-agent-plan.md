# Kapruka AI Shopping Agent — Project Plan

## Overview

Build an AI-powered conversational shopping agent for the **Kapruka Agent Challenge**. The agent connects to the [Kapruka MCP](https://mcp.kapruka.com/mcp) (free, public, no API key) and provides a full-screen, visually rich chat experience for discovering products, browsing categories, getting delivery quotes, and completing checkout.

**Challenge Page:** https://www.kapruka.com/contactUs/agentChallenge.html  
**Deadline:** 30 June 2026  
**Prize:** Apple M4 Mac Mini

---

## Scoring Rubric

| Criteria              | Points | Our Strategy                                              |
|-----------------------|--------|-----------------------------------------------------------|
| Experience & polish   | 30     | Streaming responses, micro-animations, mobile-first       |
| Visual richness       | 20     | Product carousels, rich cards, animated avatar             |
| Personality           | 15     | "Kapri" character, Tanglish/Sinhala support, warm tone     |
| Usefulness            | 15     | Smart suggestions, budget awareness, delivery-aware recs   |
| End-to-end complete   | 15     | Full flow: search → cart → delivery → checkout → tracking  |
| Creativity            | 5      | Voice input, gift wizard, shareable cart                   |

**Bonus points:** Multi-item carts, delivery-date constraints, gift messaging, Tanglish, Sinhala language support.

---

## Tech Stack

| Layer       | Technology                                | Rationale                                             |
|-------------|-------------------------------------------|-------------------------------------------------------|
| Frontend    | Next.js 14 (App Router)                   | SSR, streaming, App Router for layouts                |
| Styling     | Tailwind CSS + Framer Motion              | Rapid UI, polished animations                         |
| AI/LLM      | Vercel AI SDK + OpenAI GPT-4o (or Claude) | Streaming, tool-calling, MCP integration              |
| MCP Client  | Official MCP TypeScript SDK               | Direct integration with Kapruka MCP                   |
| Deployment  | Vercel (free tier)                        | Instant public URL, edge functions                    |

---

## MCP Integration

**Endpoint:** `https://mcp.kapruka.com/mcp`  
**Transport:** Streamable HTTP  
**Auth:** None required  
**Rate Limits:** 60 req/min, 30 orders/hr per IP  
**Cache:** 30 min server-side for read operations

### Available Tools (7)

| Tool                         | Purpose                                                    |
|------------------------------|------------------------------------------------------------|
| `kapruka_search_products`    | Search catalog by keyword with filters (category, price, stock, sort, pagination). Key param: `q` (not `query`) |
| `kapruka_get_product`        | Full product details by ID (name, price, variants, images, shipping) |
| `kapruka_list_categories`    | Top-level categories with browse URLs                      |
| `kapruka_list_delivery_cities` | Search delivery network by city name/alias               |
| `kapruka_check_delivery`     | Check delivery availability, date, rate for city + product |
| `kapruka_create_order`       | Guest checkout → returns click-to-pay URL (multi-currency, 60min price lock) |
| `kapruka_track_order`        | Track order status by order number                         |

### Example Tool Call

```json
// kapruka_search_products
{
  "q": "perfume",
  "page_size": 5,
  "currency": "LKR",
  "in_stock_only": true,
  "sort": "price_asc",
  "response_format": "json"
}
```

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│  ┌─────────────────────────────────────────────┐ │
│  │           Next.js Frontend                   │ │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────┐ │ │
│  │  │ Chat UI  │  │ Product  │  │   Cart     │ │ │
│  │  │ Messages │  │ Cards /  │  │  Sidebar   │ │ │
│  │  │ + Input  │  │ Carousel │  │  + Total   │ │ │
│  │  └──────────┘  └──────────┘  └───────────┘ │ │
│  └──────────────────┬──────────────────────────┘ │
└─────────────────────┼───────────────────────────┘
                      │ Vercel AI SDK (streaming)
┌─────────────────────┼───────────────────────────┐
│              API Routes (Next.js)                │
│  ┌──────────────────┴──────────────────────────┐ │
│  │         LLM (GPT-4o / Claude)               │ │
│  │         with tool-calling                    │ │
│  │              │                               │ │
│  │    ┌─────────┴─────────┐                     │ │
│  │    │   MCP Client      │                     │ │
│  │    │   (TypeScript SDK) │                     │ │
│  │    └─────────┬─────────┘                     │ │
│  └──────────────┼──────────────────────────────┘ │
└─────────────────┼───────────────────────────────┘
                  │ Streamable HTTP
┌─────────────────┼───────────────────────────────┐
│        Kapruka MCP Server                        │
│        https://mcp.kapruka.com/mcp               │
│        (7 tools, public, no auth)                │
└─────────────────────────────────────────────────┘
```

---

## UI Components

### 1. Chat Interface (Full-Screen)
- Full-screen immersive layout, no sidebar clutter
- Message bubbles with typing indicator and streaming text
- Agent avatar ("Kapri") with subtle animations
- Input bar at bottom with send button + voice input toggle
- Dark/light mode toggle

### 2. Product Cards
- Hero image with lazy loading
- Product name, price badge (with currency)
- Stock indicator (green/amber/red)
- "View Details" and "Add to Cart" buttons
- Quick-add animation on cart addition

### 3. Product Carousel
- Horizontal scrollable row of product cards
- Swipeable on mobile, arrow navigation on desktop
- Rendered inline within chat messages

### 4. Product Detail View
- Full product modal/overlay
- Image gallery with zoom
- Variants selector (size, color, etc.)
- Delivery checker (enter city → show date/rate)
- "Add to Cart" with quantity selector

### 5. Cart Panel
- Slide-out sidebar from right
- Product thumbnails with quantity +/- controls
- Running total with currency
- Gift message input field (bonus!)
- "Proceed to Checkout" button

### 6. Checkout Flow
- Delivery city selector with autocomplete
- Delivery date/rate display
- Order summary
- "Pay Now" button → opens Kapruka pay link
- Order confirmation with tracking number

### 7. Order Tracking
- Visual timeline/stepper showing order status
- Order details summary

---

## Agent Personality: "Kapri"

### Character
- **Name:** Kapri
- **Tone:** Warm, helpful, slightly playful, knowledgeable about Sri Lankan culture
- **Greeting:** "Ayubowan! I'm Kapri, your personal shopping assistant at Kapruka. What are you looking for today?"

### Language Support
- **English** (default)
- **Tanglish** — understands mixed Sinhala/English input (e.g., "mama birthday gift ekak hoyanne")
- **Sinhala** — full Sinhala mode toggle for the entire conversation (bonus points!)

### Context-Aware Responses
- Gift occasions: "Great choice for a birthday! Want me to add a gift message?"
- Budget awareness: "Here are the best options under LKR 5,000"
- Delivery urgency: "Need it by Friday? Let me check what's available for express delivery"
- Cross-sell: "People buying chocolates often pair them with flowers"

---

## Key Features

### Core (Must-Have)
- [ ] Full-screen chat UI with streaming responses
- [ ] Product search with rich card results
- [ ] Category browsing with visual tiles
- [ ] Product detail view with images and variants
- [ ] Delivery city search and availability check
- [ ] Single-item checkout with pay link
- [ ] Order tracking

### Enhanced (Differentiation)
- [ ] Multi-item shopping cart with running totals
- [ ] Product comparison ("show these 3 side by side")
- [ ] Gift message support in checkout
- [ ] Delivery-date constraints ("need it by Friday")
- [ ] Smart suggestions and cross-selling
- [ ] Tanglish understanding
- [ ] Sinhala language mode

### Wow Factors (Creativity)
- [ ] Voice input (Web Speech API)
- [ ] Gift Occasion Wizard — guided flow: Occasion → Recipient → Budget → Curated picks
- [ ] Animated "Kapri" avatar that reacts (thinking, excited, celebrating)
- [ ] Shareable cart link
- [ ] Dark/light mode

---

## Implementation Phases

### Phase 1: Foundation (Days 1-2)
**Goal:** Working chat with MCP integration and basic streaming

- [ ] Next.js 14 project setup with Tailwind CSS
- [ ] Vercel AI SDK configuration with tool-calling
- [ ] MCP client integration (TypeScript SDK → Kapruka MCP)
- [ ] Basic chat UI — full-screen, message bubbles, input bar
- [ ] Streaming responses with typing indicator
- [ ] Wire up `kapruka_search_products` and `kapruka_list_categories`

### Phase 2: Rich UI Components (Days 3-5)
**Goal:** Visual product experience that impresses

- [ ] Product card component (image, price, stock, add-to-cart)
- [ ] Product carousel (horizontal scroll, swipeable)
- [ ] Product detail modal (image gallery, variants, delivery check)
- [ ] Category tiles with icons
- [ ] Framer Motion animations for all transitions
- [ ] Mobile responsive design

### Phase 3: Shopping Flow (Days 6-8)
**Goal:** End-to-end purchase flow

- [ ] Shopping cart state management (multi-item)
- [ ] Cart sidebar panel (quantities, totals, gift message)
- [ ] Delivery city autocomplete
- [ ] Delivery check integration (date, rate display)
- [ ] Checkout flow → `kapruka_create_order` → pay link
- [ ] Order tracking UI with `kapruka_track_order`

### Phase 4: Personality & Language (Days 9-10)
**Goal:** Agent character and multilingual support

- [ ] "Kapri" system prompt with personality
- [ ] Context-aware responses (gifts, budget, urgency)
- [ ] Tanglish input understanding
- [ ] Sinhala language mode toggle
- [ ] Smart suggestions and cross-selling logic

### Phase 5: Wow Factors & Polish (Days 11-12)
**Goal:** Stand-out features and final polish

- [ ] Voice input integration (Web Speech API)
- [ ] Gift Occasion Wizard flow
- [ ] Animated Kapri avatar
- [ ] Dark/light mode
- [ ] Loading states, error handling, edge cases
- [ ] Performance optimization (lazy loading, image optimization)
- [ ] End-to-end testing of all flows

### Phase 6: Deploy & Test (Day 13)
**Goal:** Live public URL, final validation

- [ ] Deploy to Vercel
- [ ] Test on multiple devices (desktop, mobile, tablet)
- [ ] Test all MCP tool integrations end-to-end
- [ ] Final polish and bug fixes
- [ ] Submit challenge entry

---

## Environment & Configuration

```bash
# Required environment variables
OPENAI_API_KEY=<your-openai-key>        # Or ANTHROPIC_API_KEY for Claude
KAPRUKA_MCP_URL=https://mcp.kapruka.com/mcp

# Optional
NEXT_PUBLIC_APP_NAME=Kapri
NEXT_PUBLIC_DEFAULT_CURRENCY=LKR
```

---

## Risk Mitigation

| Risk                              | Mitigation                                        |
|-----------------------------------|---------------------------------------------------|
| MCP rate limits (60 req/min)      | Client-side caching, debounced search, paginate    |
| LLM costs                        | Use GPT-4o-mini for simple queries, 4o for complex |
| Image loading performance         | Next.js Image component, lazy loading, blur placeholder |
| Sinhala font rendering            | Include Noto Sans Sinhala web font                 |
| Order creation in testing         | Use test mode carefully, verify with small orders  |
| MCP downtime                      | Graceful error messages, retry with backoff         |

---

## Success Metrics

- **Full marks potential:** 95-100/100 if all features implemented
- **Key differentiators:** Sinhala support (rare), voice input, gift wizard, animated avatar
- **Must-nail:** Experience & polish (30pts) + Visual richness (20pts) = 50% of score

---

*Document created: June 2026*  
*Challenge deadline: 30 June 2026*
