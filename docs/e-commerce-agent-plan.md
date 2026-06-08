# Kapruka AI Shopping Agent — Project Plan

> See also: [Technical Specification](./e-commerce-agent-tech-spec.md)

## Overview

Build an AI-powered conversational shopping agent for the **Kapruka Agent Challenge**. The agent connects to the [Kapruka MCP](https://mcp.kapruka.com/mcp) (free, public, no API key) and provides a full-screen, visually rich chat experience that feels **human, surprising, and genuinely helpful** — not a search box wearing a chat costume.

**Challenge Page:** https://www.kapruka.com/contactUs/agentChallenge.html  
**Deadline:** 30 June 2026  
**Prize:** Apple M4 Mac Mini  
**Applicant Mobile:** 94719293900

---

## Design Principles (from challenge team feedback)

> *"The agents that win won't feel like a search box wearing a chat costume — they'll feel human, surprising, and genuinely helpful."*

1. **Everyday shopper first, gifting second.** Kapruka is electronics, groceries, fashion, home essentials + thousands of third-party sellers. The majority of orders are people shopping for themselves. Build for that reality — gifting is one important mode among many.

2. **Agent has opinions.** Don't just list products — read the situation, interpret intent, react with empathy, and *recommend*. Have a point of view. Example from the challenge team:
   > 🧑 "I broke up with my girlfriend… I need to send some flowers."  
   > 🤖 "Aiyo! 💔 Okay — here's the plan. I'll get the flowers to you, and you hand-deliver them. Trust me, that lands better than a courier. Shall I add a note card too?"

3. **Multi-agent orchestration.** Behind the scenes, run multiple specialized agents — a Concierge that talks, a Shopper that searches, a Logistics agent that checks delivery. The user sees one seamless personality; the architecture is a team.

4. **Local flavour.** Sinhala / Tanglish is the #1 differentiator. Sri Lankan cultural awareness in every interaction.

---

## Scoring Rubric

| Criteria              | Points | Our Strategy                                              |
|-----------------------|--------|-----------------------------------------------------------|
| Experience & polish   | 30     | Streaming responses, micro-animations, mobile-first, no loading spinners |
| Visual richness       | 20     | Product carousels, rich cards, animated avatar, dark/light mode |
| Personality           | 15     | "Kapri" with opinions, empathy, local flavour, Sinhala/Tanglish |
| Usefulness            | 15     | Smart recs for everyday shopping + gifting, budget/delivery awareness |
| End-to-end complete   | 15     | Full flow: search → cart → delivery → checkout → tracking  |
| Creativity            | 5      | Voice input, multi-agent architecture, situation-reading    |

**Bonus points:** Multi-item carts, delivery-date constraints, gift messaging, Tanglish, Sinhala language support.

---

## Tech Stack

| Layer            | Technology                                | Rationale                                             |
|------------------|-------------------------------------------|-------------------------------------------------------|
| Frontend         | Next.js 14 (App Router)                   | SSR, streaming, App Router for layouts                |
| Styling          | Tailwind CSS + Framer Motion              | Rapid UI, polished animations                         |
| AI Orchestration | Vercel AI SDK + OpenAI GPT-4o (or Claude) | Streaming, tool-calling, multi-agent support          |
| MCP Client       | Official MCP TypeScript SDK               | Direct integration with Kapruka MCP                   |
| Deployment       | Vercel (free tier)                        | Instant public URL, edge functions                    |

---

## MCP Integration

**Endpoint:** `https://mcp.kapruka.com/mcp`  
**Docs:** https://mcp.kapruka.com  
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

## Architecture — Multi-Agent Design

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                  Next.js Frontend                         │ │
│  │  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌────────┐ │ │
│  │  │ Chat UI  │  │ Product   │  │  Cart    │  │ Quick  │ │ │
│  │  │ Messages │  │ Cards /   │  │ Sidebar  │  │ Actions│ │ │
│  │  │ + Input  │  │ Carousel  │  │ + Total  │  │ Bar    │ │ │
│  │  └──────────┘  └───────────┘  └──────────┘  └────────┘ │ │
│  └──────────────────────┬───────────────────────────────────┘ │
└─────────────────────────┼────────────────────────────────────┘
                          │ Vercel AI SDK (streaming)
┌─────────────────────────┼────────────────────────────────────┐
│                  API Routes (Next.js)                         │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              🎭 CONCIERGE AGENT (orchestrator)          │  │
│  │  Owns the conversation. Reads the situation,           │  │
│  │  picks tone, decides what to do next.                  │  │
│  │  Delegates to specialist agents:                       │  │
│  │                                                        │  │
│  │  ┌──────────────────┐  ┌──────────────────────────┐   │  │
│  │  │ 🛒 SHOPPER AGENT │  │ 🚚 LOGISTICS AGENT       │   │  │
│  │  │ Search, browse,  │  │ Delivery cities, dates,  │   │  │
│  │  │ compare products,│  │ rates, feasibility check  │   │  │
│  │  │ get details,     │  │                           │   │  │
│  │  │ manage cart       │  │                           │   │  │
│  │  └────────┬─────────┘  └─────────────┬────────────┘   │  │
│  │           │                           │                │  │
│  │           └──────────┬────────────────┘                │  │
│  │                      │                                 │  │
│  │            ┌─────────┴─────────┐                       │  │
│  │            │   MCP Client      │                       │  │
│  │            │   (TypeScript SDK) │                       │  │
│  │            └─────────┬─────────┘                       │  │
│  └──────────────────────┼─────────────────────────────────┘  │
└─────────────────────────┼────────────────────────────────────┘
                          │ Streamable HTTP
┌─────────────────────────┼────────────────────────────────────┐
│              Kapruka MCP Server                               │
│              https://mcp.kapruka.com/mcp                      │
│              (7 tools, public, no auth)                        │
└──────────────────────────────────────────────────────────────┘
```

### Agent Roles

| Agent | Role | MCP Tools Used |
|-------|------|----------------|
| **Concierge** | Orchestrator. Owns the conversation, reads emotional context, picks tone, decides whether to search/recommend/ask. Has opinions and local flavour. Delegates to specialists. | None directly — delegates |
| **Shopper** | Product specialist. Searches catalog, fetches details, compares products, manages cart state. Understands categories and filters. | `kapruka_search_products`, `kapruka_get_product`, `kapruka_list_categories` |
| **Logistics** | Delivery specialist. Checks city availability, delivery dates/rates, validates feasibility. Helps with "can I get X by Y date?" questions. | `kapruka_list_delivery_cities`, `kapruka_check_delivery` |

The Concierge also handles `kapruka_create_order` and `kapruka_track_order` directly since these are full-flow actions.

---

## User Personas & Scenarios

### Primary: Everyday Shopper (majority of orders)
- "I need a new phone under 50,000 LKR"
- "Show me groceries for weekly shopping"
- "Compare these two laptops"
- "What electronics are on sale?"
- "Restock my kitchen essentials"

### Secondary: Gift Sender
- "I need a birthday gift for my mom in Kandy"
- "I broke up with my girlfriend… need to send flowers"
- "Anniversary gift ideas under 10,000 LKR, deliver by Saturday"
- "Send chocolates to Colombo 07 with a message"

### Tertiary: Order Manager
- "Track my order KAP-12345"
- "Can I get this delivered to Galle by Friday?"
- "What delivery options are available for Jaffna?"

---

## UI Components

### 1. Chat Interface (Full-Screen)
- Full-screen immersive layout, no sidebar clutter
- Message bubbles with typing indicator and streaming text
- Agent avatar ("Kapri") with subtle animations
- Input bar at bottom with send button + voice input toggle
- Quick-action chips: "Browse categories", "Track order", "Gift ideas"
- Dark/light mode toggle

### 2. Product Cards
- Hero image with lazy loading
- Product name, price badge (with currency)
- Stock indicator (green/amber/red)
- "View Details" and "Add to Cart" buttons
- Quick-add animation on cart addition
- Category badge for everyday items (Electronics, Grocery, etc.)

### 3. Product Carousel
- Horizontal scrollable row of product cards
- Swipeable on mobile, arrow navigation on desktop
- Rendered inline within chat messages
- Section headers ("Top picks for you", "Under LKR 5,000", etc.)

### 4. Product Detail View
- Full product modal/overlay
- Image gallery with zoom
- Variants selector (size, color, etc.)
- Delivery checker (enter city → show date/rate)
- "Add to Cart" with quantity selector
- Agent's recommendation note ("Kapri says: Great value for the price!")

### 5. Cart Panel
- Slide-out sidebar from right
- Product thumbnails with quantity +/- controls
- Running total with currency
- Gift message input field (optional, for gift mode)
- "Proceed to Checkout" button

### 6. Checkout Flow
- Delivery city selector with autocomplete
- Delivery date/rate display
- Order summary with item breakdown
- Gift message preview (if applicable)
- "Pay Now" button → opens Kapruka pay link (60min price lock)
- Order confirmation with tracking number

### 7. Order Tracking
- Visual timeline/stepper showing order status
- Order details summary

---

## Agent Personality: "Kapri"

### Character
- **Name:** Kapri
- **Core trait:** Has opinions. Doesn't just list — recommends, reacts, has a point of view.
- **Tone:** Warm, helpful, slightly playful, knowledgeable about Sri Lankan culture
- **Greeting:** "Ayubowan! 🙏 I'm Kapri, your shopping buddy at Kapruka. What can I help you find today?"

### Key Behaviours
- **Reads the situation:** If someone says "I broke up with my girlfriend," Kapri reacts with empathy before jumping to products
- **Has opinions:** "Honestly? The 128GB model is better value — the 64GB fills up fast with photos"
- **Proactive:** "Since you're getting groceries, want me to add some essentials you might be running low on?"
- **Local flavour:** Uses Sri Lankan expressions naturally — "Aiyo!", "machang", cultural references
- **Remembers context:** Builds on previous messages in the conversation

### Language Support
- **English** (default)
- **Tanglish** — seamlessly understands mixed Sinhala/English (e.g., "mama phone ekak ganna one, budget eka 50k")
- **Sinhala** — full Sinhala mode toggle (top differentiator per challenge team)

### Everyday Shopping Responses
- Budget: "Here are the best phones under LKR 50,000 — I'd go with the Redmi for everyday use"
- Comparison: "Both are solid, but the Samsung has a better camera. The Xiaomi wins on battery life though"
- Restock: "Weekly grocery run? Let me pull up your essentials — rice, dhal, coconut milk…"

### Gift Mode Responses
- Occasion reading: "Ayubowan! A birthday gift for amma? Let me find something special 🎂"
- Delivery awareness: "Kandy delivery takes 1-2 days. I can get it there by Thursday if we order now"
- Suggestion: "How about flowers with a box of chocolates? That combo always lands well"

---

## Key Features

### Core (Must-Have)
- [ ] Full-screen chat UI with streaming responses
- [ ] Multi-agent orchestration (Concierge → Shopper + Logistics)
- [ ] Product search with rich card results
- [ ] Category browsing with visual tiles
- [ ] Product detail view with images and variants
- [ ] Delivery city search and availability check
- [ ] Single-item checkout with pay link
- [ ] Order tracking

### Enhanced (Differentiation)
- [ ] Multi-item shopping cart with running totals
- [ ] Product comparison ("show these 3 side by side")
- [ ] Agent opinions and recommendations (not just listings)
- [ ] Everyday shopping flows (groceries, electronics, fashion)
- [ ] Gift message support in checkout
- [ ] Delivery-date constraints ("need it by Friday")
- [ ] Smart suggestions and cross-selling
- [ ] Tanglish understanding
- [ ] Sinhala language mode

### Wow Factors (Creativity)
- [ ] Voice input (Web Speech API)
- [ ] Situation-reading with emotional intelligence (breakup → empathy + action)
- [ ] Animated "Kapri" avatar that reacts (thinking, excited, celebrating)
- [ ] Quick-action chips for common flows
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
- [ ] Basic Concierge agent system prompt

### Phase 2: Rich UI Components (Days 3-5)
**Goal:** Visual product experience that impresses

- [ ] Product card component (image, price, stock, add-to-cart)
- [ ] Product carousel (horizontal scroll, swipeable)
- [ ] Product detail modal (image gallery, variants, delivery check)
- [ ] Category tiles with icons
- [ ] Framer Motion animations for all transitions
- [ ] Mobile responsive design
- [ ] Quick-action chips

### Phase 3: Multi-Agent + Shopping Flow (Days 6-8)
**Goal:** Multi-agent orchestration and end-to-end purchase

- [ ] Implement Shopper agent (search, details, compare, cart)
- [ ] Implement Logistics agent (cities, delivery check)
- [ ] Concierge → agent delegation logic
- [ ] Shopping cart state management (multi-item)
- [ ] Cart sidebar panel (quantities, totals, gift message)
- [ ] Delivery city autocomplete + check integration
- [ ] Checkout flow → `kapruka_create_order` → pay link
- [ ] Order tracking UI with `kapruka_track_order`

### Phase 4: Personality & Language (Days 9-10)
**Goal:** Agent character that reads situations and has opinions

- [ ] Refine Concierge system prompt — opinions, empathy, local flavour
- [ ] Everyday shopping flows (budget filtering, comparisons, restocking)
- [ ] Gift mode with situation-reading
- [ ] Tanglish input understanding
- [ ] Sinhala language mode toggle
- [ ] Smart suggestions and cross-selling logic

### Phase 5: Wow Factors & Polish (Days 11-12)
**Goal:** Stand-out features and final polish

- [ ] Voice input integration (Web Speech API)
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
- [ ] Test everyday shopping + gift flows
- [ ] Test Sinhala/Tanglish conversations
- [ ] Final polish and bug fixes
- [ ] Submit live demo link to Kapruka team

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
| Multi-agent latency               | Parallel agent calls where possible, streaming     |
| Image loading performance         | Next.js Image component, lazy loading, blur placeholder |
| Sinhala font rendering            | Include Noto Sans Sinhala web font                 |
| Order creation in testing         | Use test mode carefully, verify with small orders  |
| MCP downtime                      | Graceful error messages, retry with backoff         |

---

## Success Metrics

- **Full marks potential:** 95-100/100 if all features implemented
- **Key differentiators:** Multi-agent architecture (rare), Sinhala support (rare), situation-reading personality, everyday-shopper focus
- **Must-nail:** Experience & polish (30pts) + Visual richness (20pts) = 50% of score
- **Submission:** Reply to approval email with live public demo URL

---

*Document created: June 2026*  
*Last updated: June 2026 — revised per challenge team approval email*  
*Challenge deadline: 30 June 2026*
