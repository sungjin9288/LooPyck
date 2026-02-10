# Technical Debt Report (Maintenance Guide)

**Date:** 2026-02-10
**Version:** 1.0.0 (Final Closure)

This document honestly records the areas of the system that require future refinement or "paying off" of technical debt. It serves as a guide for the maintenance team.

## 1. Hardcoded Values & Configuration
- **Admin UIDs in Dashboard**: `components/admin/AgentDashboard.tsx` uses a placeholder `['admin_uid_here']`. This must be replaced with real administrator UIDs or connected to a proper Role-Based Access Control (RBAC) system in Firestore.
- **Sitemap Generation**: `app/sitemap.ts` currently has a TODO to add dynamic product routes fetching from Firestore/API. SEO for individual product pages is currently limited.

## 2. Infrastructure & Operations
- **Cleanup Script Patterns**: `lib/core/cleanup.ts` defines patterns for removing debug logs. While effective, a more robust build-time transformation (e.g., using a Babel plugin or SWC custom transform) would be cleaner than regex-based replacement.
- **Environment Variable Validation**: While `lib/core/cleanup.ts` has a validator, it is a runtime check. Moving this to a build-time check (e.g., `t3-env` or similar) would prevent deployment of potential misconfigured apps.

## 3. Testing & Coverage
- **Unit Test Coverage**: Critical paths are tested, but edge cases in `lib/ai/dataExtractor.ts` regarding obscure HTML structures might need broader test cases from diverse e-commerce sites.

## 4. Future Optimizations
- **Image Proxying**: Currently relies on external services or specific headers. A dedicated internal image optimization layer (Next.js Image Optimization with a custom loader) could further reduce dependency variance.
- **Polling Logic**: The `AgentDashboard` uses simple intervals (`setInterval`). For scale, migrating to a WebSocket or Server-Sent Events (SSE) architecture would reduce server load and improve real-time responsiveness.
