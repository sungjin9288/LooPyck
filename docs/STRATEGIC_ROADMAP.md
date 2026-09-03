# LooPyck Strategic Roadmap 2026-2027

> **Evidence status:** Legacy planning artifact. Numeric outcomes are assumptions, not measured LooPyck results.

## Executive Summary

LooPyck이 **차세대 패션 커머스 AI 에이전트**로 진화하기 위한 3단계 확장 전략을 정의합니다.

---

## Current State (Phase 1-12 Complete)

```
┌─────────────────────────────────────────────────────┐
│              LooPyck v1.0 Achievements              │
├─────────────────────────────────────────────────────┤
│  ✓ 7개 쇼핑몰 자동 분석                              │
│  ✓ 94.2% 추출 성공률                                │
│  ✓ 99.8% 비용 절감                                  │
│  ✓ Zero-Cost 인프라 (₩0/월)                         │
│  ✓ Self-Healing Agent                               │
│  ✓ RAG Trend Engine                                 │
└─────────────────────────────────────────────────────┘
```

---

## Phase A: Multimodal Vector Search (Q2 2026)

### 목표
이미지 기반 스타일 유사도 검색으로 **"이 옷과 비슷한 스타일 찾기"** 기능 구현.

### 기술 스택
```
Embedding Model:    CLIP / FashionCLIP
Vector Database:    Pinecone (Serverless)
Similarity Search:  Cosine Distance
Index Size:         1M+ 상품 벡터
```

### 구현 계획
1. **이미지 임베딩 파이프라인**
   ```typescript
   // lib/ai/vectorSearch.ts
   async function embedImage(imageUrl: string): Promise<number[]> {
     const embedding = await clip.encode(imageUrl);
     return embedding; // 512-dim vector
   }
   ```

2. **유사 상품 검색**
   ```typescript
   async function findSimilar(queryVector: number[], topK: number = 10) {
     return await pinecone.query({
       vector: queryVector,
       topK,
       includeMetadata: true,
     });
   }
   ```

### 예상 ROI
| 지표 | 현재 | 목표 |
|------|------|------|
| 검색 정확도 | N/A | 85%+ |
| 사용자 체류 시간 | 2분 | 4분 |
| 전환율 | 2.1% | 3.5% |

---

## Phase B: On-Device AI (Q4 2026)

### 목표
오프라인 환경에서도 AI 분석 가능한 **Local-First 아키텍처** 구축.

### 기술 스택
```
Local LLM:          Gemma 2B / Phi-3 Mini
Runtime:            WebGPU / ONNX Runtime Web
Cache Strategy:     IndexedDB + Service Worker
Sync:               Background Sync API
```

### 구현 계획
1. **WebGPU 기반 추론**
   ```typescript
   // lib/ai/localLLM.ts
   async function localInference(prompt: string): Promise<string> {
     const model = await loadGemma2B();
     return await model.generate(prompt, {
       maxTokens: 256,
       temperature: 0.7,
     });
   }
   ```

2. **하이브리드 전략**
   ```
   Online  → Gemini API (고정밀)
   Offline → Local LLM (저지연)
   Fallback → 캐시된 결과
   ```

### 예상 ROI
| 지표 | 현재 | 목표 |
|------|------|------|
| 오프라인 기능 | 0% | 80%+ |
| 평균 지연 시간 | 2.1s | 0.5s |
| API 비용 | ₩50/건 | ₩10/건 |

---

## Phase C: Global Expansion (Q2 2027)

### 목표
한국을 넘어 **일본, 동남아 시장**으로 서비스 확장.

### 기술 스택
```
Multi-region:       Vercel Edge (Tokyo, Singapore)
Translation:        Google Cloud Translation API
Currency:           ExchangeRate-API
Localization:       i18next
```

### 지원 지역
| 지역 | 쇼핑몰 | 언어 |
|------|--------|------|
| 🇯🇵 일본 | ZOZOTOWN, Rakuten | 일본어 |
| 🇸🇬 싱가포르 | Zalora, Shopee | 영어 |
| 🇹🇭 태국 | Pomelo, Central | 태국어 |

### 예상 ROI
| 지표 | 현재 | 목표 |
|------|------|------|
| 지원 국가 | 1 | 4+ |
| MAU | 1K | 50K+ |
| 제휴 수익 | ₩50M/년 | ₩500M/년 |

---

## Investment Requirements

### Phase A (Vector Search)
| 항목 | 비용 |
|------|------|
| Pinecone | $70/월 |
| 개발 | 160시간 |
| **Total** | **$840/년** |

### Phase B (On-Device)
| 항목 | 비용 |
|------|------|
| 모델 호스팅 | ₩0 (로컬) |
| 개발 | 240시간 |
| **Total** | **₩0/년** |

### Phase C (Global)
| 항목 | 비용 |
|------|------|
| Multi-region | $0 (Vercel Edge) |
| Translation API | $200/월 |
| 개발 | 320시간 |
| **Total** | **$2,400/년** |

---

## Risk Assessment

| 리스크 | 영향 | 완화 전략 |
|--------|------|-----------|
| 벡터 DB 비용 증가 | Medium | 셀프호스팅 Qdrant 대안 |
| LLM 성능 저하 | High | 하이브리드 폴백 |
| 현지화 복잡도 | Medium | 점진적 롤아웃 |

---

## Success Metrics

```
┌─────────────────────────────────────────────────────┐
│           2027 Target KPIs                          │
├─────────────────────────────────────────────────────┤
│  MAU:           50,000+                             │
│  Success Rate:  98%+                                │
│  Latency:       < 500ms (local)                     │
│  Markets:       4 countries                         │
│  Annual Rev:    ₩500M+                              │
└─────────────────────────────────────────────────────┘
```

---

_Last updated: 2026-02-06_
