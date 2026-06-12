# Aura Kapruka — E2E Shopping Workflow Plan

## Executive Summary

This document outlines the implementation plan for a complete end-to-end shopping workflow in the Aura Kapruka shopping assistant. The goal is to transform Aura from a conversational product discovery tool into a full shopping experience: **Browse → Select → Cart → Delivery → Checkout → Tracking**.

Based on research of [Kapruka MCP tools](https://mcp.kapruka.com) and the [Kapruka Agent Challenge requirements](https://www.kapruka.com/contactUs/agentChallenge.html#build).

---

## Current State (What We Have)

| Capability | Status |
|---|---|
| Product search & browsing | Done |
| Category listing | Done |
| Product detail view | Done |
| Add to cart (client-side) | Done |
| Emotional support agent | Done |
| Sinhala/Tanglish language support | Done |
| Delivery city lookup | Done |
| Order creation (kapruka_create_order) | Partially integrated |
| Order tracking (kapruka_track_order) | Partially integrated |

---

## Target Workflow (State Machine)

```
┌─────────────┐     ┌──────────────┐     ┌──────────┐     ┌────────────────┐
│   BROWSE    │────▶│  SELECT      │────▶│  CART    │────▶│  DELIVERY      │
│             │     │  PRODUCT     │     │  REVIEW  │     │  DETAILS       │
└─────────────┘     └──────────────┘     └──────────┘     └────────────────┘
                                                                    │
┌─────────────┐     ┌──────────────┐     ┌──────────┐              │
│  TRACKING   │◀────│  CONFIRM     │◀────│ CHECKOUT │◀─────────────┘
│             │     │  (Pay Link)  │     │  SUMMARY │
└─────────────┘     └──────────────┘     └──────────┘
```

### States & Transitions

1. **BROWSE** — User discovers products via search, categories, or AI recommendations
2. **SELECT_PRODUCT** — User clicks/selects a product → detail view with variants
3. **CART_REVIEW** — Multi-item cart with quantities, subtotals
4. **DELIVERY_DETAILS** — Recipient info + city selection + delivery date
5. **CHECKOUT_SUMMARY** — Final order review (items + delivery cost + total)
6. **CONFIRM** — Order placed → pay link generated → customer clicks to pay
7. **TRACKING** — Order number stored → status updates via `kapruka_track_order`

---

## Phase 1: Cart & Multi-Item Management (Priority: HIGH)

### Tasks
- [ ] **Cart state persistence** — Save cart to localStorage so it survives page refresh
- [ ] **Multi-item cart drawer** — Slide-out panel showing all items, quantities, images, subtotals
- [ ] **Quantity controls** — +/- buttons per item, delete item, clear cart
- [ ] **Cart badge** — Show item count on cart icon in header
- [ ] **"Continue Shopping" flow** — After adding to cart, user can keep browsing
- [ ] **Conversational cart** — Aura can respond to "what's in my cart?" / "remove the phone"

### Technical Notes
- Cart state already exists via `CartContext` — needs localStorage sync
- `CartPanel.tsx` exists but may need UX improvements for mobile

---

## Phase 2: Delivery Flow (Priority: HIGH)

### Tasks
- [ ] **Delivery city autocomplete** — Use `kapruka_list_delivery_cities` for fuzzy search
- [ ] **Delivery date picker** — Calendar UI; validate with `kapruka_check_delivery`
- [ ] **Delivery cost display** — Show rate from API response
- [ ] **Perishable product warnings** — Flag cakes/flowers that have delivery constraints
- [ ] **Recipient form** — Name, phone, address, city (validated against delivery cities)
- [ ] **Gift message (optional)** — Text input for gift messages

### Kapruka MCP Tools Used
- `kapruka_list_delivery_cities` → autocomplete city search
- `kapruka_check_delivery` → validate city + date + get delivery cost + perishable flag

### Technical Notes
- `DeliveryCityAutocomplete.tsx` already exists — extend with delivery date validation
- DeliveryInfo component exists for displaying results

---

## Phase 3: Checkout & Order Creation (Priority: HIGH)

### Tasks
- [ ] **Checkout summary screen** — All items + delivery cost + grand total
- [ ] **Order creation** — Call `kapruka_create_order` with structured payload:
  ```json
  {
    "cart": [{"product_id": "...", "quantity": 1}],
    "recipient": {"name": "...", "phone": "..."},
    "delivery": {"address": "...", "city": "...", "date": "2026-07-01"},
    "sender": {"name": "..."},
    "gift_message": "Optional message"
  }
  ```
- [ ] **Pay link display** — Show the click-to-pay URL prominently (60-min expiry)
- [ ] **Order confirmation UI** — Success animation + order number + pay link button
- [ ] **Multi-currency support** — LKR (local) and USD (diaspora customers)

### Kapruka MCP Tools Used
- `kapruka_create_order` → generates guest-checkout order + pay link

### Technical Notes
- `CheckoutFlow.tsx` already has a multi-step form — needs to wire to the MCP tool
- OrderConfirmation component exists for success state

---

## Phase 4: Order Tracking (Priority: MEDIUM)

### Tasks
- [ ] **Store order numbers** — Save completed order numbers in localStorage
- [ ] **"Track my order" flow** — Ask for order number or show recent orders
- [ ] **Status timeline UI** — Visual timeline showing order progress
- [ ] **Proactive updates** — If user has a recent order, Aura can ask "want an update?"

### Kapruka MCP Tools Used
- `kapruka_track_order` → returns status, recipient, items, timestamped delivery progress

### Technical Notes
- `OrderTimeline.tsx` already renders tracking data — needs to be connected to user flow

---

## Phase 5: Conversational Checkout Assistant (Priority: MEDIUM)

### Tasks
- [ ] **Guided checkout via chat** — Aura walks user through delivery details conversationally
  - "Where should I deliver this?" → city autocomplete in chat
  - "Who's the lucky recipient?" → collect name + phone
  - "Any special message for the card?" → gift message
- [ ] **Smart defaults** — Remember previous delivery info for repeat customers
- [ ] **Validation in chat** — "Hmm, I can't deliver to that city on Sunday. How about Monday?"
- [ ] **Delivery date suggestions** — Based on perishable constraints

---

## Phase 6: UX Polish & Competition Differentiators (Priority: MEDIUM-HIGH)

### Tasks
- [ ] **Animated transitions between states** — Smooth flow feeling
- [ ] **Mobile-first responsive** — Every step must work perfectly on phones
- [ ] **Product image gallery** — Swipeable product images in detail view
- [ ] **Price comparison** — "This is Rs. 500 cheaper than similar products"
- [ ] **Urgency indicators** — "Only 3 left!" / "Order in 2 hours for same-day delivery"
- [ ] **Sri Lankan payment context** — Explain pay link process clearly
- [ ] **Accessibility** — ARIA labels, keyboard navigation, screen reader support

---

## Phase 7: Advanced Features (Priority: LOW — Competition Bonus)

### Tasks
- [ ] **Multi-item cart checkout** — Handle multiple products in single order
- [ ] **Delivery-date constraints** — Smart date picker that greys out unavailable dates
- [ ] **Gift messaging UI** — Pretty card preview with message
- [ ] **Tanglish/Sinhala checkout** — Full workflow in local languages
- [ ] **Repeat order** — "Order the same as last time"
- [ ] **Wishlist** — "Save for later" functionality

---

## Competition Scoring Alignment

Based on the [Kapruka Agent Challenge rubric](https://www.kapruka.com/contactUs/agentChallenge.html#build):

| Criterion | Weight | Our Strategy |
|---|---|---|
| Experience & Polish | 30pts | Purple+gold branding, animations, mobile-first |
| Visual Richness | 20pts | Product carousels, image galleries, rich cards |
| Personality | 15pts | Aura's persona, emotional-first design, Sinhala support |
| Usefulness | 15pts | Smart recommendations, delivery validation, guided checkout |
| E2E Completeness | 15pts | Full workflow from browse to pay link |
| Creativity | 5pts | Sinhala language support, emotional shopping assistant concept |

**Bonus differentiators we already have:** Tanglish conversation, Sinhala-language support, multi-item carts (partial).

---

## Implementation Timeline (Suggested)

| Session | Focus | Deliverable |
|---|---|---|
| Session 1 | Cart persistence + delivery flow | Working add-to-cart → delivery city/date validation |
| Session 2 | Checkout creation + pay link | Full kapruka_create_order integration |
| Session 3 | Order tracking + conversational checkout | Natural language checkout assistant |
| Session 4 | UX polish + mobile optimization | Competition-ready polish |
| Session 5 | Testing + edge cases + Sinhala checkout | Final QA pass |

---

## Architecture Decisions

1. **State management** — Keep using React Context (`CartContext`) + localStorage for persistence. No need for server-side state since Kapruka MCP is the source of truth for orders.

2. **Checkout flow** — Hybrid approach:
   - Visual UI (existing `CheckoutFlow.tsx` modal) for structured input
   - Conversational fallback — Aura can collect the same info via chat messages
   - Both funnel into the same `kapruka_create_order` call

3. **Order storage** — LocalStorage for order history (order numbers + timestamps). No user accounts needed since Kapruka uses guest checkout.

4. **Error handling** — Graceful degradation:
   - Delivery city not found → suggest alternatives
   - Date unavailable → suggest next available
   - Rate limit → queue + retry with backoff

---

## Files to Create/Modify

### New Files
- `src/contexts/OrderContext.tsx` — Order state management + localStorage
- `src/components/checkout/DeliveryForm.tsx` — Full delivery details form
- `src/components/checkout/PaymentLink.tsx` — Pay link display component
- `src/components/checkout/CheckoutSummary.tsx` — Final order review
- `src/lib/agents/checkoutAgent.ts` — Conversational checkout prompts

### Modified Files
- `src/components/cart/CartPanel.tsx` — Enhanced multi-item UX
- `src/components/checkout/CheckoutFlow.tsx` — Wire to MCP order creation
- `src/lib/agents/orchestrator.ts` — Route checkout/delivery intents
- `src/lib/agents/concierge.ts` — Add checkout conversation flows
- `src/app/api/chat/route.ts` — Handle checkout tool calls
