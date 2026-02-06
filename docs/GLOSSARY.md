# LooPyck 기술 용어집 (Glossary)

## 비전공자를 위한 핵심 기술 개념 설명

> 이 문서는 LooPyck 프로젝트의 핵심 기술 용어를 쉽게 설명합니다.

---

## A

### API (Application Programming Interface)
**정의**: 두 소프트웨어가 서로 대화하는 방법.

**예시**: LooPyck이 Gemini AI에게 "이 이미지에서 가격을 찾아줘"라고 요청하는 것.

---

## C

### Cross-Checker (크로스 체커)
**정의**: 두 가지 방식으로 데이터를 추출하고, 결과를 비교 검증하는 시스템.

**작동 방식**:
```
Vision AI → 스크린샷 분석 → 가격: ₩39,000
DOM 파싱 → HTML 코드 분석 → 가격: ₩39,000
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cross-Checker → 일치 확인 → 신뢰도: 97%
```

**장점**: 단일 방식보다 정확도가 높음 (95%+).

---

## D

### DOM (Document Object Model)
**정의**: 웹페이지의 구조를 나타내는 트리 형태의 데이터.

**비유**: 웹페이지가 집이라면, DOM은 그 집의 설계도입니다.

---

## F

### Fallback (폴백)
**정의**: 주요 기능이 실패했을 때 작동하는 대체 기능.

**예시**: Gemini API가 응답하지 않으면, DOM 파싱으로 자동 전환.

### Freemium (프리미엄)
**정의**: 기본 기능은 무료, 고급 기능은 유료인 비즈니스 모델.

**LooPyck 적용**:
| 티어 | 가격 | AI 분석 |
|------|------|---------|
| Free | ₩0 | 10회/월 |
| Basic | ₩4,900 | 100회/월 |
| Pro | ₩9,900 | 무제한 |

---

## G

### Gemini
**정의**: Google이 만든 AI 모델. 텍스트와 이미지를 모두 이해할 수 있음.

**Gemini 2.5 Flash**: 빠르고 무료 티어가 있는 버전.

---

## H

### Hybrid Consensus (하이브리드 합의)
**정의**: 여러 데이터 소스의 결과를 결합하여 최종 결론을 도출하는 방식.

**작동 방식**: Vision AI (70%) + DOM 파싱 (30%) → 가중 평균.

---

## L

### LTV (Lifetime Value, 고객 생애 가치)
**정의**: 한 고객이 서비스를 사용하는 동안 창출하는 총 수익.

**계산**: 월 구독료 × 평균 사용 개월 + 제휴 수익.

---

## R

### RAG (Retrieval-Augmented Generation)
**정의**: AI가 답변하기 전에 관련 정보를 먼저 검색하여 품질을 높이는 기술.

**LooPyck 적용**:
```
사용자: "올드머니룩 추천해줘"
    ↓
RAG: 트렌드 DB에서 '올드머니' 검색
    ↓
AI: 검색된 트렌드 정보 + 상품 매칭
```

### Rate Limiter (속도 제한기)
**정의**: API 요청 속도를 제한하여 과부하를 방지하는 장치.

**LooPyck 설정**: 분당 10회, 일일 500회.

### ROI (Return on Investment, 투자 수익률)
**정의**: 투자 대비 이익의 비율.

**LooPyck ROI**: 개발 비용 ₩10M → 연간 절감 ₩299M = **2,990% ROI**.

---

## S

### Self-Healing Agent (자가 복구 에이전트)
**정의**: 오류가 발생하면 스스로 문제를 진단하고 해결하는 시스템.

**복구 시나리오**:
1. 팝업 자동 닫기
2. 지연 로딩 대기
3. 스크롤 후 재시도

### SLA (Service Level Agreement)
**정의**: 서비스 품질에 대한 보증 약속.

**LooPyck SLA**:
| 지표 | 약속 |
|------|------|
| Uptime | 99.5% |
| RTO | 15분 |
| 성공률 | 92%+ |

---

## T

### Token Bucket (토큰 버킷)
**정의**: 속도 제한을 구현하는 알고리즘. 버킷에 토큰이 있으면 요청 허용.

**비유**: 놀이공원 입장권. 시간당 정해진 개수만 발급.

---

## V

### Vision AI (비전 AI)
**정의**: 이미지를 "보고 이해"할 수 있는 AI.

**Gemini Vision**: 스크린샷에서 가격, 소재, 색상 자동 추출.

---

## Z

### Zero-Cost Architecture (제로 코스트 아키텍처)
**정의**: 무료 서비스 티어만 활용하여 인프라 비용을 ₩0으로 유지하는 설계.

**LooPyck 구성**:
| 서비스 | 비용 |
|--------|------|
| Gemini API | ₩0 (무료 500회/일) |
| Vercel | ₩0 (Hobby 플랜) |
| Firebase | ₩0 (Spark 플랜) |
| **총합** | **₩0/월** |

---

## 약어 정리

| 약어 | 의미 |
|------|------|
| API | Application Programming Interface |
| DOM | Document Object Model |
| LTV | Lifetime Value |
| MAU | Monthly Active Users |
| RAG | Retrieval-Augmented Generation |
| ROI | Return on Investment |
| RPD | Requests Per Day |
| RPM | Requests Per Minute |
| RTO | Recovery Time Objective |
| SLA | Service Level Agreement |

---

_Last updated: 2026-02-06_
