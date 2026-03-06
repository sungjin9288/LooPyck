# Technical Debt Report (Maintenance Guide)

**Date:** 2026-03-06
**Version:** 1.0.0 (Maintenance Update)

This document honestly records the areas of the system that require future refinement or "paying off" of technical debt. It serves as a guide for the maintenance team.

## 1. Hardcoded Values & Configuration
- **Admin Access Control**: `components/admin/AgentDashboard.tsx` now reads `NEXT_PUBLIC_ADMIN_UIDS`, but this is still an environment-based allowlist. For long-term 운영, a Firestore-backed RBAC model is safer and easier to audit.
- **Canonical Product Routing**: Product detail pages can now resolve from Firestore using the `source` query parameter, but the canonical URL still depends on a query string (`/product/[id]?source=...`). A future path redesign (e.g. source-aware slugs) would be cleaner for SEO and link portability.

## 2. Infrastructure & Operations
- **SEO File Source of Truth**: `app/robots.ts` and `app/sitemap.ts` are now the authoritative SEO endpoints. Keep this model and avoid reintroducing duplicate static files under `public/` for the same paths.
- **Cleanup Script Patterns**: `lib/core/cleanup.ts` defines patterns for removing debug logs. While effective, a more robust build-time transformation (e.g., using a Babel plugin or SWC custom transform) would be cleaner than regex-based replacement.
- **Environment Variable Validation**: While `lib/core/cleanup.ts` has a validator, it is a runtime check. Moving this to a build-time check (e.g., `t3-env` or similar) would prevent deployment of potential misconfigured apps.

## 3. Testing & Coverage
- **Unit Test Coverage**: Critical paths are tested, but edge cases in `lib/ai/dataExtractor.ts` regarding obscure HTML structures might need broader test cases from diverse e-commerce sites.

## 4. Future Optimizations
- **Image Proxying**: Currently relies on external services or specific headers. A dedicated internal image optimization layer (Next.js Image Optimization with a custom loader) could further reduce dependency variance.
- **Polling Logic**: The `AgentDashboard` uses simple intervals (`setInterval`). For scale, migrating to a WebSocket or Server-Sent Events (SSE) architecture would reduce server load and improve real-time responsiveness.
