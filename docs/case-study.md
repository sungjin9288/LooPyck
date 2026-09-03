# Case Study

## 1. 배경

- 이 프로젝트를 시작한 배경: 패션 상품은 동일하거나 유사한 상품이 여러 쇼핑몰에 흩어져 있고, 표시 가격만으로 실제 구매 조건을 판단하기 어렵다.
- 해결하려는 사용자 문제: 사용자가 쇼핑몰별 가격, 옵션, 배송비, 회원가, 재고 상태를 직접 비교해야 하는 번거로움
- 이 문제가 중요한 이유: 최저가처럼 보이는 상품도 배송비, 쿠폰 조건, 품절, 옵션 불일치 때문에 실제 구매 판단이 달라질 수 있다.
- 현재 개발 진행 상태: MVP 기능과 Compare Entry gate/landing/search hierarchy는 구현·검증 완료됐고, 검색/운영 진단과 runtime reliability를 고도화 중이다. 2026-07-15 기준 최신 커밋은 `0edd82a`이며 현재 working tree의 미커밋 변경은 현재 파일과 검증 결과 기준으로 판단한다.

## 2. 문제 정의

### As-Is

- 현재 사용자는 어떤 방식으로 문제를 해결하고 있는가? 네이버 쇼핑, 무신사, 29CM, W컨셉 등 쇼핑몰을 따로 검색하고 직접 가격표를 비교한다.
- 기존 방식의 한계는 무엇인가? 상품명이 다르거나 옵션/사이즈/배송 조건이 달라 동일 상품 여부를 빠르게 판단하기 어렵다.

### Pain Points

- 불편 1: 같은 상품인지 유사 상품인지 사용자가 직접 판단해야 한다.
- 불편 2: 표시 가격과 실제 결제 가격이 배송비/회원가/쿠폰 때문에 달라질 수 있다.
- 불편 3: 가격 비교 후에도 재고, 옵션, 핏, 배송 정책을 다시 확인해야 한다.

## 3. 목표

### MVP 목표

- 패션 검색어로 여러 소스 상품을 모으고, 비교 가능한 상품 그룹과 일반 검색 결과를 분리한다.
- 상세 화면에서 실구매가, 옵션, 재고, 배송, 핏 판단 정보를 제공한다.

### 기술 목표

- Next.js API Route에서 검색/AI/Firebase 기능을 분리한다.
- 외부 API와 scraping 실패 시 fallback 및 graceful degradation을 제공한다.
- Zod validation, rate limit, timeout, URL sanitization으로 API 안정성을 높인다.

### 사용자 목표

- 사용자가 검색 결과에서 바로 비교 가능한 후보를 확인한다.
- 구매 전 확인해야 할 조건을 한 화면에서 확인한다.

### 학습 목표

- AI API를 실제 사용자 흐름에 연결하는 방법을 학습한다.
- 검색/비교/저장/알림을 하나의 제품 흐름으로 설계한다.
- 배포와 smoke/UAT 검증 절차를 문서화한다.

## 4. 해결 접근

- 어떤 기능으로 문제를 해결하려 했는가? 실시간 검색, 상품 그룹핑, 실구매가 계산, 옵션/재고/배송 decision block, shortlist/favorites, 가격 알림
- AI/IT 기술을 어디에 적용했는가? Gemini 2.5 Flash를 스타일 상담, 이미지 기반 검색 키워드 생성, 체형 기반 스타일 추천에 적용했다.
- 왜 이 기술스택을 선택했는가? Next.js App Router는 UI와 API Route를 한 프로젝트에서 관리하기 쉽고, Firebase는 Auth/Firestore/Admin 기능을 빠르게 구성할 수 있으며, Netlify는 현재 primary 배포 경로로 문서화되어 있다.
- 현재 구현된 접근: `app/api/realtime-search/route.ts`에서 검색 aggregate와 diagnostics를 처리하고, `lib/product/*`에서 비교 판단 로직을 담당한다.
- 현재 고도화 접근: 완료된 Compare Entry landing/search hierarchy를 기준으로 badge cohort와 compare-ready 지표를 관찰하고, search-learning 운영 대시보드와 runtime fallback을 통해 품질 개선 루프를 강화한다.

## 5. 구현 범위

### 구현 완료

- Naver Shopping API 검색: `app/api/search/route.ts`
- 다중 소스 실시간 검색: `app/api/realtime-search/route.ts`, `lib/api/realtimeAggregator.ts`
- marketplace scraping adapter: `lib/api/marketplaceScrapers.ts`
- 상품 그룹핑/비교 판단: `lib/product/productMatching.ts`, `lib/product/purchasePricing.ts`, `lib/product/purchaseDecision.ts`
- AI chat/vision/style recommendation: `app/api/ai-chat/route.ts`, `app/api/ai-vision/route.ts`, `app/api/style-recommend/route.ts`
- Firebase Auth/Firestore favorites: `contexts/UserContext.tsx`, `hooks/useCloudStorage.ts`
- 가격 이력/목표가 알림 서버 로직: `lib/server/priceHistoryStore.ts`, `lib/server/priceAlertScanner.ts`
- Netlify deploy/smoke 경로: `netlify.toml`, `docs/NETLIFY_DEPLOY.md`, `package.json`
- Compare Entry Figma gate, brand/category landing, search-result compare hierarchy, release QA closure: `output/playwright/compare-entry-review-gate.json`, `components/landing/*`, `components/product/searchResultSections.tsx`

### 개발 중

- 검색 학습/운영 대시보드 분리와 고도화
- alert tuning 운영 흐름
- 모바일/Capacitor production QA 흐름

### 미구현 / 예정

- 검증된 운영 성과 수치 공개
- 실제 사용자 기반 전환율/사용량 분석
- 외부 쇼핑몰별 데이터 정확도 정량 검증
- 최신 working-tree 변경의 production 재배포와 release evidence 갱신

### 이번 MVP에서 제외한 범위

- 제외한 기능: 모든 쇼핑몰 재고/옵션의 완전한 실시간 보장
- 제외한 이유: 외부몰 API/HTML 구조, 인증, 상품 데이터 제공 범위가 소스별로 다르고 운영 검증 비용이 크다.

## 6. 시스템 설계

- 전체 구조: Next.js frontend와 API Routes가 검색, AI, Firebase server module을 호출한다.
- 데이터 흐름: User query -> `/api/realtime-search` -> source query plan -> marketplace/Naver search -> rerank/diagnostics -> UI compare hierarchy
- API 구조: 검색 API, AI API, 가격 이력 API, 관리자 API, cron job API로 분리되어 있다.
- AI/LLM 처리 흐름: Zod request schema -> Gemini request -> `parseGeminiJson()` -> normalized response 또는 fallback
- 예외 처리: API timeout, missing env, rate limit, invalid query, Firebase Admin 미설정 fallback이 구현되어 있다.
- 보안/환경변수 처리: `CRON_SECRET`, `ADMIN_UIDS`, Firebase Admin env, Naver/Gemini keys, Upstash Redis optional env를 사용한다.
- 배포 계획: Netlify primary, Vercel fallback, Docker standalone image, Cloudflare/OpenNext script가 있다. Cloudflare Workers Free는 문서상 size limit 제약이 있다.

## 7. 나의 역할

- 기획: 패션 검색-비교-구매 판단 흐름을 문제 단위로 구조화
- 요구사항 정의: 비교 판단 기준을 가격, 옵션, 배송, 재고, 핏, 신뢰도 단위로 분리
- 프론트엔드: 확인 필요. 저장소 기준으로 `app/page.tsx`, `components/product/*`, `components/landing/*` 구현 근거가 있음
- 백엔드: 확인 필요. 저장소 기준으로 `app/api/*` route와 `lib/server/*` 구현 근거가 있음
- AI/LLM: 확인 필요. Gemini route와 fallback 로직 구현 근거가 있음
- 데이터 처리: 확인 필요. Firestore favorites, price history, diagnostics 저장 근거가 있음
- 배포: Netlify 배포 및 smoke/UAT 문서와 script 근거가 있음
- 문서화: Compare Entry, Netlify, mobile QA, handover 문서 근거가 있음

## 8. 결과

- 구현 완료 기능: 실시간 검색, 비교 그룹핑, AI 추천 API, Firestore favorites, 가격 이력/알림 서버 로직, 관리자 진단, Netlify 배포 경로
- 로컬 실행 가능 여부: `npm run dev`로 실행 가능하도록 문서화되어 있음
- 테스트 여부: `npm run typecheck`, `npm run test:adapters` script가 있고 관련 test files가 있음
- 배포 여부: README와 Netlify docs 기준 demo URL은 `https://loo-pyck.netlify.app`
- 최근 git 상태: `git status --short --branch` 기준 `main...origin/main` 위에 README, API, component, lib, tests, docs, scripts 변경과 신규 파일이 다수 존재한다. 이 분석은 해당 변경을 되돌리지 않고 현재 저장소 상태를 기준으로 정리했다.
- 사용자 피드백: 현재 없음. 임의 생성 금지.
- 수치 성과:
  - 현재 없음. 임의 생성 금지.

## 9. 배운 점

- 기술적으로 배운 점: API route별 validation/rate limit/timeout/fallback을 두면 외부 의존성이 큰 검색 서비스의 장애 범위를 줄일 수 있다.
- 설계에서 배운 점: 가격 비교는 단순 가격 정렬보다 동일 상품 여부와 구매 조건 근거가 중요하다.
- 사용자 관점에서 배운 점: 사용자는 검색 결과보다 구매 직전 판단 신호를 필요로 한다.
- 다음 프로젝트에 반영할 점: README의 성과 표현은 코드/로그/측정 지표로 검증 가능한 문장만 사용해야 한다.

## 10. 이 프로젝트가 보여주는 역량

- 개발 역량: Next.js App Router, API Route, TypeScript, Firebase, external API integration
- 문제정의 역량: 패션 구매 의사결정을 가격/옵션/배송/재고/핏으로 분해
- 데이터/AI 활용 역량: Gemini JSON response parsing, fallback recommendation, search diagnostics
- 커뮤니케이션/문서화 역량: 배포/QA/Compare Entry gate 문서화
- 컨설팅형 사고: 사용자 흐름과 운영 검증 흐름을 분리하고, 향후 개선 로드맵으로 구조화
