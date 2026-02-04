# LooPyck Production Deployment Guide

## 1. Core Project Structure (Final State)
Completed architecture with optimized domain modularity.

### 📂 Directory Structure
- **`components/product/`**: Domain - Product Logic
  - `ProductCard.tsx`: Main container (Image, Title, Price, Sub-components)
  - `PriceInsight.tsx`: Data Viz (Price Bar, Percentiles)
  - `FavoriteButton.tsx`: Cloud Persistence (Favorites)
  - `PriceAlertButton.tsx`: Action (Target Price Setting)
  - `SocialCounter.tsx`: Social Proof (Real-time Watchers)
  - `ProductList.tsx`: Grid Layout & Loading States
  - `ProductSkeleton.tsx`: Loading Placeholders
- **`components/shared/`**: Atomic UI
  - `Button.tsx`, `Input.tsx`: Reusable Base Components
  - `ScrollToTop.tsx`: Navigation FAB
- **`contexts/`**:
  - `UserContext.tsx`: Global Auth State & Account Linking
- **`hooks/`**:
  - `useCloudStorage.ts`: Firestore Sync, Migration, & Transactions
- **`styles/`**:
  - `designTokens.ts`: UI Constants (Source of Truth)
- **`utils/`**:
  - `priceAnalysis.ts`: Data Intelligence Helpers

## 2. Implementation Walkthrough (V1.1 ~ Phase 3)

### Phase 1: Foundation & Design System
- **Design Tokens**: Centralized all UI constants in `designTokens.ts` for maintainability.
- **Modular Architecture**: Split monolithic components into domain-specific units.

### Phase 1.2 & 1.3: Data Intelligence & UI Polish
- **Price Insight**: Visualized price distribution (Min/Max/Avg) using percentile calculation.
- **UX Refinement**:
  - **Skeleton UI**: Reduced perceived latency.
  - **Micro-interactions**: Staggered list animations, "Pop" effects, and animated FAB.

### Phase 2: Cloud Sync & Persistence
- **Firebase Integration**: Implemented `signInAnonymously` for friction-free Auth.
- **Hybrid Migration**: Auto-merge logic moves LocalStorage data to Firestore on first load.
- **Resilience**: Offline support and graceful degradation if keys are missing.

### Phase 3: Social & Security
- **Social Proof**: "N people watching" counter using `runTransaction` for concurrency-safe updates.
- **Security**: Added `firestore.rules` to strictly isolate user data (`users/{userId}`) while allowing public read for product stats.
- **Account Linking**: Prepared `linkAccount` (Anon → Google) logic in `UserContext`.

## 3. Environment & Infrastructure Setup

### [ ] Vercel Deployment
Push `main` branch and register these variables in Vercel Project Settings:
```env
NAVER_CLIENT_ID=...
NAVER_CLIENT_SECRET=...
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### [ ] Firebase Security Rules
Deploy the contents of `firestore.rules` to the Firebase Console to secure `users/{userId}`.

### [ ] Cloud Functions (Future Roadmap)
Refer to [docs/CLOUD_FUNCTIONS_DESIGN.md](file:///c:/Users/한국전파진흥협회/fashion-price-compare/docs/CLOUD_FUNCTIONS_DESIGN.md) for the Crawler & Notification architecture.

## 4. Final Verification Results
- **Build Status**: ✅ `npm run build` Success.
- **SEO & Performance**: Metadata optimized, Lighthouse LCP managed via `next/image` & Skeletons.
- **Social Logic**: Validated `onSnapshot` real-time updates and Transactional increments.
- **Security**: Verified Ownership-based access control.
