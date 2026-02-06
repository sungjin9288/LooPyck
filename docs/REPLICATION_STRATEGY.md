# LooPyck Replication Strategy

## Speed-to-Market: 2주 산업 확장 가이드

---

## Executive Summary

LooPyck 아키텍처를 타 산업에 **2주 안에** 복제하는 전략 가이드입니다.

| 항목 | 목표 |
|------|------|
| 구축 기간 | 2주 |
| 코드 재사용 | 80%+ |
| 예상 ROI | 90%+ |
| 필요 인력 | 1명 |

---

## 1. Core Framework Architecture

### 재사용 가능 모듈 (80%)

```
lib/core/
├── genericAgent.ts     ← 범용 에이전트 (NEW)
├── cleanup.ts          ← 프로덕션 유틸
└── final_snapshot.ts   ← 설정 관리

lib/ai/
├── geminiProvider.ts   ← AI 연결 (범용)
├── visionParser.ts     ← 스크린샷 분석
├── rateLimiter.ts      ← 속도 제한
└── cacheLayer.ts       ← 캐싱

lib/agent/
├── healer.ts           ← 자가 복구
├── crossChecker.ts     ← 이중 검증
└── domExtractor.ts     ← DOM 파싱
```

### 도메인별 커스텀 (20%)

```
lib/domain/
├── selectors.ts        ← 셀렉터 매핑
├── prompts.ts          ← Vision 프롬프트
└── validators.ts       ← 데이터 검증
```

---

## 2. Replication Blueprints

### Blueprint A: 부동산 매물 분석

**타겟 사이트**: 직방, 호갱노노, 네이버부동산

**추출 대상**:
```typescript
interface RealEstateData {
  address: string;      // 주소
  price: number;        // 가격 (만원)
  area: number;         // 면적 (㎡)
  rooms: number;        // 방 수
  floor: string;        // 층
  builtYear: number;    // 건축년도
}
```

**Vision 프롬프트**:
```
부동산 매물 정보를 추출하세요:
1. 주소 (동/호수 포함)
2. 매매가 또는 전세가
3. 면적 (전용/공급)
4. 방 개수
5. 층수
```

**예상 ROI**: 95% 비용 절감

---

### Blueprint B: 뉴스 데이터 요약

**타겟 사이트**: 네이버뉴스, 다음뉴스

**추출 대상**:
```typescript
interface NewsData {
  title: string;        // 제목
  summary: string;      // 요약 (3문장)
  keywords: string[];   // 키워드 (5개)
  sentiment: number;    // 감성 (-1 ~ 1)
  source: string;       // 언론사
}
```

**Vision 프롬프트**:
```
뉴스 기사를 분석하세요:
1. 제목 추출
2. 핵심 내용 3문장 요약
3. 주요 키워드 5개
4. 긍정/부정/중립 판단
```

**예상 ROI**: 90% 비용 절감

---

### Blueprint C: 공공기관 공고 수집

**타겟 사이트**: 나라장터, 조달청

**추출 대상**:
```typescript
interface GovernmentNotice {
  title: string;        // 공고명
  agency: string;       // 발주기관
  deadline: Date;       // 마감일
  budget: number;       // 예산
  category: string;     // 분류
  requirements: string; // 자격요건
}
```

**Vision 프롬프트**:
```
입찰 공고를 분석하세요:
1. 공고명
2. 발주 기관
3. 입찰 마감일
4. 예정 가격
5. 참가 자격
```

**예상 ROI**: 92% 비용 절감

---

## 3. 2주 구축 타임라인

### Week 1: Foundation (Days 1-5)

| Day | Task | Output |
|-----|------|--------|
| 1 | 타겟 사이트 분석 | 셀렉터 매핑 문서 |
| 2 | 도메인 인터페이스 정의 | TypeScript 타입 |
| 3 | Vision 프롬프트 작성 | 프롬프트 파일 |
| 4 | Extractor 구현 | domExtractor.ts |
| 5 | Validator 구현 | 검증 로직 |

### Week 2: Integration (Days 6-10)

| Day | Task | Output |
|-----|------|--------|
| 6 | GenericAgent 연결 | 에이전트 인스턴스 |
| 7 | Healer 커스텀 | 도메인별 복구 로직 |
| 8 | 테스트 (10 URLs) | 성공률 측정 |
| 9 | 버그 수정 & 최적화 | 성능 개선 |
| 10 | 배포 & 문서화 | 운영 가이드 |

---

## 4. Cost-Benefit Analysis

### 구축 비용

| 항목 | 비용 |
|------|------|
| 개발 (80시간) | ₩4,000,000 |
| 인프라 | ₩0/월 |
| API | ₩0/월 (무료 티어) |
| **Total** | **₩4,000,000** |

### 예상 절감

| 산업 | 수동 비용 | 자동화 비용 | 절감 |
|------|----------|------------|------|
| 부동산 | ₩15,000/건 | ₩30/건 | 99.8% |
| 뉴스 | ₩5,000/건 | ₩20/건 | 99.6% |
| 공공 | ₩20,000/건 | ₩40/건 | 99.8% |

### ROI 계산

```
월 1,000건 기준 (부동산)
─────────────────────────
수동:      ₩15,000,000/월
자동화:    ₩30,000/월
월간 절감: ₩14,970,000
연간 절감: ₩179,640,000
ROI:       4,491%
```

---

## 5. Risk Mitigation

| 리스크 | 영향 | 완화 전략 |
|--------|------|-----------|
| 사이트 구조 변경 | High | Self-Healing + 다중 셀렉터 |
| API 할당량 초과 | Medium | DOM Fallback |
| 데이터 정확도 | Medium | Hybrid Consensus |
| 법적 이슈 | Low | robots.txt 준수 |

---

## 6. Success Criteria

| 지표 | 목표 |
|------|------|
| 구축 기간 | ≤ 2주 |
| 코드 재사용률 | ≥ 80% |
| 성공률 | ≥ 90% |
| 비용 절감 | ≥ 90% |
| 인프라 비용 | ₩0/월 |

---

**Contact**: dev@loopyck.kr

_© 2026 LooPyck. All rights reserved._
