# LooPyck Master Blueprint (System Version 1.0)

## 1. System Identity
- **Name**: LooPyck
- **Concept**: Fin-Fashion Trading Terminal
- **Core Value**: "Buy Fashion Like Stocks"
- **Target Audience**: Gen Z Fashion investors who value resale value (`Resell Tech`).

## 2. Architecture Specification
### Frontend
- **Framework**: Next.js 14+ (App Router)
- **State Management**: React Context + Hooks (`useMultiSourceSearch`)
- **Styling**: Tailwind CSS + Framer Motion (Heavy use of `AnimatePresence`)
- **Visuals**: Bento Grid Layout, Dark/Light Mode (Logic ready, UI enforced to High-Contrast)

### Backend (Serverless)
- **Hosting**: Vercel (Edge Functions)
- **Database**: Firebase Firestore (NoSQL)
- **Auth**: Firebase Auth (Anonymous + Social)
- **API Strategy**: 
  - `realtimeAggregator.ts`: Hybrid Fetcher (API + Scraping)
  - `HealerEngine`: Self-Healing Scraper with Retry/backoff

## 3. Key Feature Specifications
### [AI] Healer Engine (Verified)
- **Logic**: Detected via `lib/agent/healer.ts`
- **Capabilities**:
  - `tryClosePopup`: Handles modals/popups automatically.
  - `triggerLazyLoad`: Scrolls to bottom to trigger hydration.
  - `healWConcept`: Specialized healing for W-Concept iframes.

### [UX] Adaptive Layout (Verified)
- **Component**: `components/product/InfiniteProductGrid.tsx`
- **Grid System**: 4-column Bento Grid on Desktop, 1-column on Mobile.
- **Micro-Interactions**: Haptic feedback on interactions (`lib/ux/hapticEngine.ts`).

### [Social] Fashion Battle (Hardened)
- **Component**: `components/social/FashionBattle.tsx`
- **Data Source**: Firestore `battles/season_2026_spring` (Realtime).
- **Concurrency**: `increment` atomic operations for vote integrity.

### [Finance] MyAsset / ROI (Verified)
- **Logic**: `lib/ai/priceForecaster.ts`
- **Algorithm**: Linear Regression on Time Series.
- **Display**: `components/product/FutureValueInsight.tsx` (Graph + Investment Opinion).

## 4. Production Hardening Results
| Category | Check | Result | Note |
|---|---|---|---|
| **Memory** | Infinite Scroll > 500 items | **PASSED** | Hard limit enforced in `useMultiSourceSearch`. |
| **Security** | Firestore Rules | **PASSED** | Strict `allow update` only for counters. |
| **Network** | Offline State | **PASSED** | `HealerEngine` includes retry logic. |
| **SEO** | Meta/Sitemap | **PASSED** | `robots.ts` & `sitemap.ts` configured. |

## 5. Deployment Strategy
### Vercel vs AWS
- **Current**: **Vercel** (Recommended for Phase 1-2)
  - *Pros*: Zero config, Edge styling, specialized for Next.js.
  - *Cons*: Vendor lock-in.
- **Future**: AWS (Phase 43+)
  - *Trigger*: When daily active users > 100k or custom GPU inference needed.
  - *Plan*: Move `HealerEngine` to AWS Lambda Layers for better IP rotation control.

---
**Status**: [STABLE & LIVE-READY]
**Signed-off by**: DeepMind Agent 'Antigravity'
**Date**: 2026-02-09
