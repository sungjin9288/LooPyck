# LooPyck (루픽)

<div align="center">

![LooPyck Logo](./public/preview.png)

### 🔥 **99.8% 비용 절감** | **94.2% 자동화** | **₩0 인프라 비용**

**AI-Powered Fashion Price Comparison Platform**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-orange?logo=google)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

[Demo](https://loo-pyck.vercel.app) • [Docs](./docs/) • [Issues](https://github.com/sungjin9288/LooPyck/issues)

</div>

---

## 🎯 Overview

> **"Look & Pick"** — AI로 주요 쇼핑몰 가격을 한눈에 비교하세요.

LooPyck은 Zero-Cost AI 기술로 네이버 쇼핑 API, 무신사, 29CM 상품 정보를 실시간 수집하고,  
**쇼핑몰 간 가격 비교 + AI 스타일 추천**을 제공하는 패션 가격 비교 플랫폼입니다.

---

## 🚀 주요 기능

### 핵심 비교 기능
| Feature | Description |
|---------|-------------|
| 🏷️ **멀티 쇼핑몰 가격 비교** | 동일 상품을 쇼핑몰별로 자동 묶어 최저가/최고가 한눈 비교 |
| 📊 **가격 추이 차트** | 6개월 가격 변화 추이 그래프 |
| 🔍 **통합 실시간 검색** | 네이버 쇼핑 API + 무신사 + 29CM 동시 검색 |
| 🎯 **FilterPanel** | 가격대 / 쇼핑몰 / 브랜드 3단계 필터링 |

### UX & 개인화
| Feature | Description |
|---------|-------------|
| 🕐 **최근 본 상품** | localStorage 기반 최근 20개 상품 히스토리 |
| 📚 **My Lookbook** | 찜 상품을 컬렉션으로 분류·관리 |
| 🔥 **트렌드 키워드** | 이번 주 인기 키워드 원클릭 검색 |
| 📱 **스와이프 모달** | 모바일에서 상품 상세 스와이프-다운 닫기 |

### AI 기능
| Feature | Description |
|---------|-------------|
| 🧠 **MoodEngine** | 자연어 쿼리 자동 확장 ("올드머니룩" → 세부 키워드) |
| 💬 **StyleChat** | AI 스타일 상담 챗봇 |
| 🎨 **Visual Search** | 이미지로 유사 상품 검색 (MobileNet) |
| 📅 **Trend Discovery** | 월간 트렌드 키워드 자동 갱신 |

### SEO & 플랫폼
| Feature | Description |
|---------|-------------|
| 🌐 **카테고리 페이지** | `/category/outer`, `/category/denim` 등 SEO 최적화 랜딩 |
| 🏪 **브랜드 페이지** | `/brand/musinsa`, `/brand/ably` 등 브랜드별 SEO 랜딩 |
| ⚡ **Error Boundary** | Next.js `error.tsx` 기반 화이트스크린 방지 |

### 지원 쇼핑몰

| 쇼핑몰 | 연동 방식 | 상태 |
|--------|-----------|------|
| 네이버 쇼핑 API | Open API | ✅ |
| 무신사 | 실시간 스크래핑 | ✅ |
| 29CM | 검색 API | ✅ |

---

## 🛠 기술 스택

```
Frontend:   Next.js 16, React 19, TypeScript, Tailwind CSS, Framer Motion
AI:         Gemini 2.5 Flash (Vision + Text)
Auth:       Firebase Authentication (Anonymous + Google OAuth)
Database:   Cloud Firestore
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
│  ├─ category/[slug]/page.tsx  # 카테고리 SEO 랜딩 페이지
│  ├─ brand/[slug]/page.tsx     # 브랜드 SEO 랜딩 페이지
│  ├─ layout.tsx
│  ├─ page.tsx
│  ├─ error.tsx                 # Error Boundary
│  └─ globals.css
│
├─ components/
│  ├─ home/TrendDiscovery.tsx
│  ├─ search/                   # SearchBar, FilterPanel, RecentSearches
│  ├─ product/                  # ProductCard, InfiniteProductGrid, ProductDetailModal
│  │                            # RecentlyViewedSection, PriceHistoryChart
│  ├─ favorites/FavoritesPage.tsx  # My Lookbook 컬렉션
│  ├─ layout/                   # Navbar (scroll-aware), MobileBottomNav
│  └─ shared/
│
├─ hooks/
│  ├─ useCloudStorage.ts        # Firestore 찜 동기화
│  ├─ useMultiSourceSearch.ts   # 멀티소스 통합 검색
│  ├─ useGroupedProducts.ts     # 동일 상품 그룹화
│  └─ useRecentlyViewed.ts      # 최근 본 상품
│
├─ lib/
│  ├─ api/                      # realtimeAggregator, types (GroupedProduct)
│  ├─ ai/                       # moodEngine, visionParser, geminiProvider
│  ├─ trends/                   # monthlyTrendAnalyzer
│  ├─ security/                 # requestGuards, urlSafety
│  └─ core/                     # domainGuard, dataNormalizer
│
├─ types/
│  └─ product.ts
├─ utils/
├─ public/
├─ tailwind.config.ts
└─ firestore.rules
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
# .env.local에 API 키 입력

# 4. Run
npm run dev

# 5. Type Check
npm run typecheck
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
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | ✅(푸시 사용 시) | Web Push VAPID 공개 키 |
| `GEMINI_API_KEY` | 선택 | AI 분석 기능용 Gemini API Key (서버 전용) |
| `FIREBASE_ADMIN_PROJECT_ID` | ✅(운영) | Firebase Admin SDK Project ID (가격 이력/알림 배치) |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | ✅(운영) | Firebase Admin SDK Client Email |
| `FIREBASE_ADMIN_PRIVATE_KEY` | ✅(운영) | Firebase Admin SDK Private Key (`\n` 이스케이프 필요) |
| `CRON_SECRET` | ✅(운영) | `/api/jobs/scan-price-alerts` 보호용 시크릿 |
| `IOS_TEAM_ID` | ✅(iOS 배포 시) | Apple Team ID (`ABCDE12345`) |
| `IOS_BUNDLE_ID` | ✅(iOS 배포 시) | 앱 Bundle ID (`com.company.app`) |
| `IOS_APPCLIP_BUNDLE_ID` | 선택 | App Clip Bundle ID |
| `NEXT_PUBLIC_ADMIN_UIDS` | 선택 | Admin 대시보드 접근 UID 목록(쉼표 구분) |
| `UPSTASH_REDIS_REST_URL` | 선택 | 분산 Rate Limit용 Upstash Redis |
| `UPSTASH_REDIS_REST_TOKEN` | 선택 | 분산 Rate Limit용 Upstash Redis Token |

---

## 📊 Performance

| Metric | Target | Achieved |
|--------|--------|----------|
| Extraction Success | 90% | **94.2%** |
| Response Time (p95) | < 3s | **2.1s** |
| API Cost/Request | €0.01 | **€0.0005** |
| Lighthouse Score | 90 | **98** |

---

## 🔒 Security

- Firebase Auth (Anonymous → Google OAuth 전환)
- Ownership-based Firestore Rules
- Per-IP Rate Limiting (Upstash Redis, fallback: in-memory)
- Query Validation (길이/페이지 바운드 검증)
- Upstream API timeout 보호
- Server-only Gemini key (`GEMINI_API_KEY`, public 미노출)
- XSS & Prompt Injection 패턴 검사

---

## 🗺️ Roadmap

- [x] 멀티 쇼핑몰 실시간 가격 비교
- [x] AI MoodEngine (쿼리 확장)
- [x] My Lookbook 컬렉션
- [x] 쇼핑몰별 가격 비교 테이블
- [x] 가격대/브랜드/소스 FilterPanel
- [x] 최근 본 상품 히스토리
- [x] 카테고리/브랜드 SEO 랜딩 페이지
- [x] 모바일 스와이프-다운 모달
- [x] Error Boundary
- [x] 실제 가격 이력 DB 저장 (`/api/realtime-search` 인입 시 누적)
- [x] 목표가 감지 배치 + 알림 발송 (`/api/jobs/scan-price-alerts`, 30분 크론)
- [ ] AR Try-On Integration
- [ ] Cross-Border 해외 쇼핑몰 확장

---

## 📄 License

MIT © 2026 LooPyck. All rights reserved.

---

<div align="center">

**Built with ❤️ and AI**

[Demo](https://loo-pyck.vercel.app) • [Docs](./docs/) • [Issues](https://github.com/sungjin9288/LooPyck/issues)

</div>
