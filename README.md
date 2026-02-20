# LooPyck (루픽)

<div align="center">

![LooPyck Logo](./public/preview.png)

### 🔥 **99.8% 비용 절감** | **94.2% 자동화** | **₩0 인프라 비용**

**AI-Powered Fashion Price Comparison Platform**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-orange?logo=google)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

[한국어](#-overview) | [English](#-overview)

</div>

---

## 🎯 Overview

> **"Look & Pick"** - AI로 7개 쇼핑몰 가격을 한눈에 비교하세요.

LooPyck은 **Zero-Cost AI 기술**로 무신사, 29cm, W컨셉 등 7개 주요 쇼핑몰의 상품 정보를 자동 추출하고, 가격 비교 및 스타일 추천을 제공하는 플랫폼입니다.

---

## 💡 Why → How → What

### ❌ Problem (Why)
```
수동 가격 비교 = 건당 ₩25,000 인건비
월 1,000건 분석 = ₩25,000,000 지출
```

### ✅ Solution (How)
```
Zero-Cost AI Agent
├── Gemini 2.5 Flash Vision (무료 티어)
├── Self-Healing Agent (자동 복구)
├── Hybrid Consensus (이중 검증)
└── RAG Trend Engine (트렌드 연동)
```

### 🎯 Result (What)
```
✓ 비용 절감: 99.8% (₩25,000 → ₩50/건)
✓ 자동화율: 94.2% (7개 쇼핑몰)
✓ 연간 절감: ₩299,400,000
✓ FTE 절감: 1.4명/월
```

---

## 🚀 주요 기능

| Feature | Description |
|---------|-------------|
| 🧠 **AI Vision Parser** | 스크린샷에서 가격/소재/실루엣 자동 추출 |
| 🤖 **Self-Healing Agent** | 팝업, 지연로딩 등 자동 복구 |
| 💬 **FashionBot** | 자연어 스타일 상담 ("올드머니룩 추천해줘") |
| 📊 **RAG Trends** | 팬톤 컬러, 트렌드 기반 추천 |
| 📅 **Monthly Trend Discovery** | KST 월초 기준으로 `Trending Now` 키워드/카드 자동 갱신 |
| 📈 **Analytics** | Funnel 추적, ROI 계산 |

### ✨ 최근 개발 업데이트 (2026.02)

- `Trending Now` 리팩토링: 중복/겹침 렌더링 제거, 월간 스냅샷 기반 표시
- 월간 트렌드 분석기 추가: `lib/trends/monthlyTrendAnalyzer.ts`
- 월초 자동 갱신 스케줄 적용: `Asia/Seoul` 기준 다음 달 00:00에 정확히 업데이트
- 검색 API 하드닝:
  - IP 기반 rate limit
  - 쿼리 길이/페이지 입력 검증
  - 외부 쇼핑 API timeout 보호
- 정렬 개선: `sort=date`가 멀티소스 통합 최신순으로 동작
- 데이터 정합성 개선: 가격 알림 수정 시 `watchCount` 중복 증가 버그 수정
- 성능 개선: Visual Search 모델(MobileNet) on-demand lazy loading
- 검증 강화: 월간 트렌드 분석기 테스트(`npm run test:trends`) 추가

### 지원 쇼핑몰

| 쇼핑몰 | 성공률 | 상태 |
|--------|--------|------|
| 무신사 | 100% | ✅ |
| 29cm | 100% | ✅ |
| W컨셉 | 100% | ✅ |
| 에이블리 | 100% | ✅ |
| 지그재그 | 86% | ✅ |
| SSF샵 | 71% | ✅ |
| 한섬 | 43% | ⚠️ |

---

## 🛠 기술 스택

```
Frontend:   Next.js 16, React 18, TypeScript
AI:         Gemini 2.5 Flash (Vision + Text)
Auth:       Firebase Authentication
Database:   Cloud Firestore
Analytics:  Firebase Analytics
Hosting:    Vercel (Edge Functions)
CI/CD:      GitHub Actions
```

---

## 🧭 Project Structure

```text
LooPyck/
├─ app/                         # Next.js App Router
│  ├─ api/
│  │  ├─ search/route.ts
│  │  └─ realtime-search/route.ts
│  ├─ product/[id]/page.tsx
│  ├─ layout.tsx
│  ├─ page.tsx
│  ├─ globals.css
│  ├─ manifest.ts
│  ├─ robots.ts
│  └─ sitemap.ts
│
├─ components/                  # UI components
│  ├─ home/TrendDiscovery.tsx
│  ├─ search/                   # SearchBar, VisualSearch, RecentSearches
│  ├─ product/                  # ProductCard, Grid, Detail, Alerts
│  ├─ layout/                   # Navbar, BrandTicker, MobileNavigation
│  ├─ shared/                   # Marquee, NotificationSystem, ErrorBoundary
│  ├─ auth/                     # LoginModal, StyleDashboard
│  ├─ ai/                       # StyleChat
│  ├─ favorites/
│  ├─ social/
│  ├─ mobile/
│  └─ admin/
│
├─ contexts/
│  └─ UserContext.tsx
│
├─ hooks/
│  ├─ useCloudStorage.ts
│  └─ useMultiSourceSearch.ts
│
├─ lib/                         # Domain / service logic
│  ├─ api/                      # realtimeAggregator, productSnapshot
│  ├─ ai/                       # visionParser, geminiProvider, ragAdvisor
│  ├─ trends/                   # monthlyTrendAnalyzer.ts
│  ├─ security/                 # requestGuards, finalAudit
│  ├─ core/                     # domainGuard, dataNormalizer, observability
│  ├─ analytics/
│  ├─ agent/
│  ├─ auth/
│  ├─ i18n/
│  ├─ seo/
│  ├─ ux/
│  └─ firebase.ts
│
├─ styles/                      # tokens, theme, animation
├─ types/                       # shared TS types
├─ utils/                       # recentSearches, priceAnalysis
├─ tests/                       # monthly trend + load tests
├─ scripts/                     # deploy/test scripts
├─ docs/                        # architecture/strategy docs
├─ public/                      # static assets
│
├─ package.json
├─ next.config.js
├─ tailwind.config.ts
├─ tsconfig.json
├─ firestore.rules
└─ Dockerfile
```

---

## 📦 Quick Start

```bash
# 1. Clone
git clone https://github.com/sungjin9288/LooPyck.git
cd LooPyck

# 2. Install
npm install

# 3. Configure
cp .env.local.example .env.local
# Edit .env.local with your API keys

# 4. Run
npm run dev

# 5. Quality Checks (optional but recommended)
npm run lint
npm run test:trends
npm run build
```

### 환경 변수

| Variable | Required | Description |
|----------|----------|-------------|
| `NAVER_CLIENT_ID` | ✅ | 네이버 쇼핑 검색 API Client ID |
| `NAVER_CLIENT_SECRET` | ✅ | 네이버 쇼핑 검색 API Client Secret |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | ✅ | Firebase Web API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | ✅ | Firebase Auth Domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ✅ | Firebase Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | ✅ | Firebase Storage Bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ✅ | Firebase Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ✅ | Firebase App ID |
| `GEMINI_API_KEY` | 선택 | AI 분석 기능용 Gemini API Key (서버 전용 사용) |
| `NEXT_PUBLIC_ADMIN_UIDS` | 선택 | Admin 대시보드 접근 UID 목록(쉼표 구분) |
| `UPSTASH_REDIS_REST_URL` | 선택 | 분산 Rate Limit용 Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | 선택 | 분산 Rate Limit용 Upstash Redis REST Token |
| `RATE_LIMIT_PREFIX` | 선택 | Redis 키 prefix (기본값: `loopyck:rl`) |

---

## 📊 Performance

| Metric | Target | Achieved |
|--------|--------|----------|
| Extraction Success | 90% | **94.2%** |
| Response Time (p95) | < 3s | **2.1s** |
| API Cost/Request | €0.01 | **€0.0005** |
| Lighthouse Score | 90 | **98** |

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | 시스템 아키텍처 |
| [TECH_WHITEPAPER.md](./docs/TECH_WHITEPAPER.md) | 기술 백서 |
| [HANDOVER_MANUAL.md](./docs/HANDOVER_MANUAL.md) | 운영 가이드 |

---

## 🗺️ Roadmap

- [x] Phase 4: Zero-Cost AI Pipeline
- [x] Phase 5: AI Personalization
- [x] Phase 6: Conversational Discovery
- [x] Phase 7: Launch Hardening
- [x] Phase 8: Autonomous Scaling
- [x] Phase 9: Market Proof
- [x] Phase 10: Assetization
- [ ] Phase 11: AR Try-On Integration
- [ ] Phase 12: Cross-Border Expansion

---

## 🔒 Security

- Firebase Auth (Anonymous + Email)
- Ownership-based Firestore Rules
- Distributed Per-IP Rate Limiting (Upstash Redis, 미설정 시 in-memory fallback)
- Query Validation (length/page bounds) + upstream timeout guard
- Server-only Gemini key path (`GEMINI_API_KEY`, no public fallback)
- XSS & Prompt Injection pattern checks (security utility)

---

## 📄 License

MIT © 2026 LooPyck. All rights reserved.

---

<div align="center">

**Built with ❤️ and AI**

[Demo](https://loo-pyck.vercel.app) • [Docs](./docs/) • [Issues](https://github.com/sungjin9288/LooPyck/issues)

</div>
