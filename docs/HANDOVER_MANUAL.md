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
```

### Production Deployment

```bash
# Build
npm run build

# Deploy to Vercel
npx vercel --prod
```

---

## 2. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ | Google AI Studio API Key |
| `NEXT_PUBLIC_FIREBASE_CONFIG` | ✅ | Firebase 설정 JSON |
| `VERCEL_TOKEN` | CD | Vercel 배포 토큰 |
| `VERCEL_ORG_ID` | CD | Vercel 조직 ID |
| `VERCEL_PROJECT_ID` | CD | Vercel 프로젝트 ID |

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
# Vercel 상태 확인
https://vercel-status.com

# Firebase 상태 확인
https://status.firebase.google.com
```

#### Step 2: 롤백 (5분)
```bash
# 이전 버전으로 롤백
vercel rollback

# 또는 특정 배포로 롤백
vercel alias <deployment-url> <production-url>
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
