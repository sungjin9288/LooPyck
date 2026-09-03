# LooPyck Project Index

**Status:** MVP 구현 후 검증·운영 고도화 중
**Last updated:** 2026-09-03

## Product And Evidence

- [README](../README.md): product scope, setup, testing, limitations
- [Walkthrough](../walkthrough.md): current user flow and verification entrypoints
- [Implementation Evidence](implementation-evidence.md): feature-to-code-to-artifact mapping
- [Evidence Checklist](evidence-checklist.md): current verification status and remaining boundaries
- [Architecture Readiness Notes](ENTERPRISE_READY_REPORT.md): local readiness evidence without production-capacity claims
- [Consulting Case Study](CONSULTING_CASE_STUDY.md): evidence-backed problem framing and implementation decisions

## Architecture And Operations

- [System Architecture](ARCHITECTURE.md): current service boundaries and runtime dependencies
- [Netlify Deploy Guide](NETLIFY_DEPLOY.md): primary deployment and smoke workflow
- [Compare Entry Execution Plan](COMPARE_ENTRY_FUNNEL_EXECUTION_PLAN.md): Figma-first landing/search redesign sequence
- [Compare Entry Validation Matrix](COMPARE_ENTRY_FUNNEL_VALIDATION_MATRIX.md): surface and release acceptance checks

## Current Code Entrypoints

- Realtime search API: [`app/api/realtime-search/route.ts`](../app/api/realtime-search/route.ts)
- Source aggregation: [`lib/api/realtimeAggregator.ts`](../lib/api/realtimeAggregator.ts)
- Direct source adapters: [`lib/api/marketplaceScrapers.ts`](../lib/api/marketplaceScrapers.ts)
- Product matching: [`lib/product/productMatching.ts`](../lib/product/productMatching.ts)
- Purchase pricing: [`lib/product/purchasePricing.ts`](../lib/product/purchasePricing.ts)
- Search diagnostics: [`lib/api/searchDiagnostics.ts`](../lib/api/searchDiagnostics.ts)
- Search results: [`components/product/InfiniteProductGrid.tsx`](../components/product/InfiniteProductGrid.tsx)
- Product detail: [`components/product/ProductDetailModal.tsx`](../components/product/ProductDetailModal.tsx)

## Historical Planning Artifacts

Legacy whitepapers, proposals, pitch drafts, and completion reports retain their original scenarios for history. Each must carry the fixed `Legacy planning artifact` evidence marker; their numeric outcomes are not current LooPyck results.
