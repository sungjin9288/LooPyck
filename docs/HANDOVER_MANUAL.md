# LooPyck Handover Manual

## 운영자 가이드 / Operator's Guide

> 이 문서는 신규 운영자가 LooPyck 시스템을 즉시 운영할 수 있도록 작성되었습니다.

---

## 1. Quick Start (5분 설정)

### Prerequisites
- Node.js 20.x+
- npm 10.x+
- Git

### Installation

```bash
# 1. Clone repository
git clone https://github.com/your-org/loopyck.git
cd loopyck

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.local.example .env.local
# Edit .env.local with your credentials

# 4. Run development server
npm run dev
# Local app: http://localhost:3000
```

### Production Deployment

```bash
# Authenticate to Netlify
npm run ntl:login

# Link existing site/repo
npm run ntl:link

# Sync the trimmed runtime env
npm run ntl:sync-env
npx netlify env:import --replace-existing .netlify.env

# Preview deploy
npm run ntl:deploy:preview

# Production deploy
npm run ntl:deploy:prod

# Basic production smoke check
npm run ntl:smoke

# Authenticated admin API smoke check
npm run ntl:admin-smoke

# Browser smoke check
npm run ntl:browser-smoke
```

Important:
- Do not import `.env.local` directly into Netlify.
- Netlify Functions inherit runtime env into AWS Lambda, so provider-only vars
  like `VERCEL_OIDC_TOKEN` can break deploys by exceeding the 4 KB env limit.
- `ntl:admin-smoke` uses local Firebase Admin credentials plus the first `ADMIN_UIDS`
  entry to mint a custom token and verify Netlify `/api/admin/access` and
  `/api/realtime-search/diagnostics`.

---

## 2. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NAVER_CLIENT_ID` | ✅ | 네이버 쇼핑 검색 API Client ID |
| `NAVER_CLIENT_SECRET` | ✅ | 네이버 쇼핑 검색 API Client Secret |
| `NEXT_PUBLIC_FIREBASE_*` | ✅ | Firebase Web SDK 설정값 일체 |
| `FIREBASE_ADMIN_PROJECT_ID` | ✅(운영) | Firebase Admin SDK Project ID |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | ✅(운영) | Firebase Admin SDK Client Email |
| `FIREBASE_ADMIN_PRIVATE_KEY` | ✅(운영) | Firebase Admin SDK Private Key |
| `ADMIN_UIDS` | ✅(`/admin`) | 관리자 UID 목록 (쉼표 구분) |
| `GEMINI_API_KEY` | 선택 | Gemini 기반 AI 기능용 |
| `NETLIFY_AUTH_TOKEN` | CD | Netlify CLI/API 배포 토큰 |

> 최신 전체 목록은 [`.env.local.example`](/Users/sungjin/dev/personal/LooPyck/.env.local.example) 와 [NETLIFY_DEPLOY.md](/Users/sungjin/dev/personal/LooPyck/docs/NETLIFY_DEPLOY.md) 를 기준으로 봅니다.

### Getting API Keys

#### Gemini API Key
1. https://aistudio.google.com 접속
2. "Get API Key" 클릭
3. 새 프로젝트 생성 또는 기존 프로젝트 선택
4. API Key 복사

#### Firebase Config
1. https://console.firebase.google.com 접속
2. 프로젝트 설정 → 일반
3. 웹 앱 추가 (이미 있다면 선택)
4. SDK 설정의 firebaseConfig 객체 복사

---

## 3. Monitoring Dashboard

### Health Check Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/api/health` | 서버 상태 |
| `/api/search?test=1` | API 동작 확인 |

### Key Metrics to Monitor

1. **API Quota** - Gemini 사용량 (500 RPD 제한)
2. **Success Rate** - 추출 성공률 (목표 92%+)
3. **Response Time** - p95 < 3초
4. **Error Rate** - 5xx 에러 < 1%

### Firebase Console

- **Authentication**: 사용자 세션 모니터링
- **Firestore**: 데이터 저장 확인
- **Analytics**: 실시간 이벤트 트래킹

---

## 4. Troubleshooting Playbook

### 🔴 문제: API 할당량 초과

**증상**: "Rate limit exceeded" 에러

**해결**:
```bash
# 1. 현재 사용량 확인
# Firebase Console → Analytics → 커스텀 이벤트

# 2. Rate Limiter 확인
# lib/ai/rateLimiter.ts - GEMINI_LIMITS.RPM 조정

# 3. 캐시 활성화 확인
# 24시간 TTL 캐시가 정상 작동하는지 확인
```

### 🟡 문제: 낮은 추출 성공률

**증상**: 성공률 90% 미만

**해결**:
```bash
# 1. 특정 쇼핑몰 확인
npx tsx tests/load/agentLoadTest.ts

# 2. 셀렉터 업데이트
# lib/ai/config.ts → MALL_SELECTORS

# 3. Healer 로그 확인
# [Healer] 로그에서 실패 패턴 분석
```

### 🟢 문제: 빌드 실패

**증상**: `npm run build` 에러

**해결**:
```bash
# 1. 타입 에러 확인
npx tsc --noEmit

# 2. 의존성 충돌
rm -rf node_modules package-lock.json
npm install

# 3. 캐시 정리
rm -rf .next
npm run build
```

---

## 5. Maintenance Schedule

### Daily
- [ ] API 사용량 확인 (500 RPD 제한)
- [ ] 에러 로그 검토

### Weekly
- [ ] 로드 테스트 실행 (`npx tsx tests/load/agentLoadTest.ts`)
- [ ] 쇼핑몰 셀렉터 유효성 확인

### Monthly
- [ ] 의존성 업데이트 (`npm update`)
- [ ] Lighthouse 성능 테스트
- [ ] 보안 감사 (`lib/security/finalAudit.ts`)

---

## 6. Emergency Contacts

| Role | Responsibility |
|------|----------------|
| DevOps | 인프라, 배포 이슈 |
| Backend | API, 에이전트 로직 |
| Frontend | UI, 사용자 경험 |

---

## 7. Recovery Procedures

### RTO: 15분 / RPO: 1시간

#### Step 1: 장애 확인 (2분)
```bash
# Netlify 상태 확인
https://www.netlifystatus.com

# Firebase 상태 확인
https://status.firebase.google.com
```

#### Step 2: 롤백 (5분)
```bash
# 안정 버전 커밋으로 재배포
git checkout <stable-commit>
npm run ntl:deploy:prod
git checkout main
```

#### Step 3: 검증 (8분)
```bash
# 헬스체크
curl https://your-domain.com/api/health

# 기능 테스트
npx tsx tests/load/agentLoadTest.ts --quick
```

---

## 8. File Structure Reference

```
loopyck/
├── app/                 # Next.js App Router
├── components/          # React 컴포넌트
├── lib/                 # 비즈니스 로직
│   ├── ai/              # AI 모듈
│   ├── agent/           # Agent 모듈
│   ├── analytics/       # 분석 모듈
│   └── security/        # 보안 모듈
├── docs/                # 문서
├── tests/               # 테스트
└── tasks/               # 작업 추적
```

---

_Last updated: 2026-02-06_
