# Resume Bullets

## 1. 이력서용 프로젝트 제목 후보

- LooPyck - AI 기반 패션 가격 비교 웹 애플리케이션
- LooPyck - 다중 쇼핑몰 검색/비교 및 AI 스타일 추천 플랫폼
- LooPyck - Next.js 기반 패션 상품 비교·알림 서비스

## 2. 한 줄 소개 후보

- 여러 패션 쇼핑몰의 검색 결과를 통합하고 가격/옵션/배송 근거를 함께 보여주는 가격 비교 서비스를 개발 중입니다.
- Next.js, Firebase, Gemini API를 활용해 검색, 비교, 즐겨찾기, 가격 알림, AI 추천 흐름을 구현한 개인 프로젝트입니다.
- 패션 상품 구매 전 필요한 실구매가, 재고, 옵션, 배송 정보를 비교할 수 있도록 검색 결과와 상세 decision block을 설계했습니다.

## 3. 현재 이력서에 넣어도 되는 bullet

- 패션 상품 비교 과정에서 발생하는 옵션/배송/실구매가 판단 문제를 해결하기 위해 Next.js App Router 기반 검색·비교 웹 애플리케이션을 개발 중이며, `/api/realtime-search`와 상품 비교 UI를 통해 다중 소스 결과를 통합 표시
- source-aware marketplace adapter를 병렬 집계하고, 전체 외부 소스 실패 시 tracked catalog fallback을 적용해 검색 결과 제공 안정성을 개선
- `productMatching`, `purchasePricing`, `purchaseDecision` 모듈을 구현해 상품 canonicalization, 옵션/재고/배송비/혜택가 기반 구매 판단 로직을 분리
- Firebase Auth/Firestore 기반 즐겨찾기 동기화와 가격 알림 서버 로직을 구성해 검색 이후 관심 상품 저장, 목표가 추적, 알림 생성 흐름을 개발
- Gemini 2.5 Flash 기반 AI chat, image-to-search keyword, 체형 기반 style recommendation API를 구현하고 Zod validation, JSON parsing, deterministic fallback으로 응답 안정성을 보완
- 검색 품질과 운영 상태를 확인하기 위한 admin diagnostics, search-learning 모듈, Netlify smoke/UAT script를 정리해 개발-검증-운영 문서화 흐름을 구축
- 사용자 구매 흐름을 문제정의, 요구사항, 비교 기준, 검증 기준으로 구조화하고 Compare Entry funnel 문서와 validation matrix로 구현 범위를 관리
- Figma-first review gate를 통과한 brand/category Compare Entry와 search-result hierarchy를 구현하고, visual baseline과 release QA artifact로 디자인-코드 handoff를 검증

## 4. 구현 후 넣을 수 있는 bullet

- 구현 후 사용 가능: 운영 로그와 사용자 행동 데이터를 기반으로 검색 품질 지표를 정량화하고, source별 fallback/precision 개선 결과를 수치로 관리
- 구현 후 사용 가능: 실제 사용자 테스트 또는 production analytics를 통해 검색 성공률, 비교 완료율, 알림 클릭률 같은 지표를 측정하고 개선

## 5. 기술스택 한 줄

- 현재 사용 중: TypeScript, Next.js 16, React 18.3.1, Tailwind CSS, Firebase Auth/Firestore/Admin, Gemini 2.5 Flash, Cheerio, Zod, Netlify, Capacitor
- 현재 사용 중: Figma-first design handoff, Playwright visual QA
- 예정/검토: Cloudflare Workers/OpenNext

## 6. 지원 직무별 강조 포인트

### AI/IT 개발자

- Next.js API Route, Firebase, Gemini API, TypeScript module 설계를 중심으로 구현 역량을 강조한다.
- AI 기능은 단순 호출이 아니라 schema validation, fallback, 검색 흐름 연결까지 설명한다.

### AI 서비스 기획

- 사용자의 구매 판단 문제를 가격/옵션/재고/배송/핏으로 나누고, 각 문제를 기능과 UI 흐름으로 연결한 점을 강조한다.

### AI 솔루션 엔지니어

- 외부 API, scraping adapter, Firebase Admin, 배포 환경변수, rate limit, timeout 등 운영 의존성을 다룬 경험을 강조한다.

### DX/AI 컨설팅 주니어

- 사용자 문제를 구조화하고, 기능 요구사항과 검증 기준, 배포/운영 문서로 전환한 경험을 강조한다.

## 7. 쓰면 위험한 표현

- 99.8% 비용 절감 달성
- 94.2% 자동화 달성
- 가격 정확도 98% 보장
- 모든 쇼핑몰 최저가 실시간 보장
- 대규모 사용자 운영 경험
- 매출/전환율 개선 달성

## 8. 보완 후 쓸 수 있는 표현

- production smoke/UAT 결과를 첨부한 Netlify 배포 경험
- 실제 사용자 테스트 또는 analytics 근거가 있는 검색/비교 UX 개선
- source별 검색 품질 지표를 측정한 비교 검색 품질 개선
- alert click-through 또는 favorite conversion 등 로그 기반 개선

## 9. 최종 판단

- 현재 이력서 반영 가능 여부: 구현 범위와 검증 방법을 함께 제시하는 조건으로 가능
- 이유: 검색·비교·AI·favorites·alert 흐름에 코드와 local/release evidence가 연결돼 있다. 다만 실제 사용자 성과와 production capacity 수치는 검증되지 않았다.
- 이력서에 넣기 전 확인할 것: README의 `Scope & Limitations`, current demo screenshot, `npm run test:adapters` summary와 배포 대상 provenance
- 가장 먼저 개선해야 할 것: 실제 사용자 analytics 표본을 수집해 검색 성공률, 비교 진입률, 알림 반응을 구현 완료 claim과 분리해 검증
- git 기준 주의사항: Phase 81~85는 2026-09-04 production 배포와 post-deploy UAT까지 완료했다. 배포 완료를 표현할 때는 정적 commit hash 대신 `deployment-provenance.json`과 release artifact를 근거로 제시한다.
