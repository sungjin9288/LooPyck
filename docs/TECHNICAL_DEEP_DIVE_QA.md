# LooPyck Technical Deep Dive Q&A

> **Evidence status:** Legacy planning artifact. Numeric outcomes are assumptions, not measured LooPyck results.

## 20 Core Technical Questions & Answers

> 기술 면접 및 인터뷰 대응을 위한 핵심 질문과 답변입니다.

---

## 🏗️ Architecture (1-5)

### Q1. 왜 Gemini 2.5 Flash를 선택했나요? GPT-4V 대신?

**Answer**:
1. **무료 티어**: Gemini는 500 RPD 무료 제공, GPT-4V는 유료만
2. **Vision 성능**: Flash 모델이 스크린샷 분석에 충분한 정확도
3. **지연 시간**: 평균 2.1s로 실시간 서비스 가능
4. **비용 효율**: Zero-Cost 아키텍처 실현

```
GPT-4V: $0.01/image → 1,000건 = $10/월
Gemini: $0 (무료 티어) → 1,000건 = $0/월
```

### Q2. Zero-Cost 아키텍처의 지속 가능성은?

**Answer**:
- **API 한계**: Gemini 500 RPD = 월 15,000건 처리 가능
- **초과 시**: DOM Fallback으로 100% 가동률 유지
- **확장 시**: 월 $70 Pinecone 추가로 무제한 확장

### Q3. 왜 Hybrid Consensus 방식을 채택했나요?

**Answer**:
단일 추출 방식의 한계:
- Vision AI만: 이미지 품질에 민감 (85% 정확도)
- DOM만: 동적 콘텐츠 놓침 (80% 정확도)

Hybrid 방식:
- Vision + DOM 교차 검증 → **95%+ 정확도**
- DOM 가격을 우선 사용 (구조화 데이터)
- Vision은 소재/스타일 추출에 강점

### Q4. Rate Limiter를 Token Bucket으로 구현한 이유?

**Answer**:
```typescript
// Token Bucket 장점
1. Burst 허용: 순간적 트래픽 피크 처리
2. 공평한 분배: 지속적 요청에 균등 할당
3. 메모리 효율: O(1) 공간 복잡도
```

대안 비교:
| 알고리즘 | Burst | 복잡도 | 선택 |
|---------|-------|--------|------|
| Fixed Window | ❌ | O(1) | ❌ |
| Sliding Window | ⚠️ | O(n) | ❌ |
| Token Bucket | ✅ | O(1) | ✅ |

### Q5. 캐싱 전략은?

**Answer**:
```
24시간 TTL 스마트 캐싱
├── Key: URL + timestamp (일 단위)
├── Storage: Firestore
├── Hit Rate: ~40%
└── 비용 절감: 40% API 호출 감소
```

---

## 🔧 Implementation (6-10)

### Q6. iframe 기반 사이트(W-Concept) 대응 방법?

**Answer**:
```typescript
async function healWConcept(page: Page) {
  // 1. 메인 페이지 팝업 닫기
  await closePopups(page);
  
  // 2. iframe 탐색
  const iframes = await page.$$('iframe');
  for (const iframe of iframes) {
    const content = await iframe.contentFrame();
    if (content) {
      await searchInFrame(content);
    }
  }
  
  // 3. SPA 하이드레이션 대기
  await page.waitForTimeout(1500);
  
  // 4. 가격 영역 스크롤
  await scrollToPriceArea(page);
}
```

**결과**: 67% → **100% 성공률**

### Q7. 셀렉터 변경 시 대응 전략?

**Answer**:
1. **다중 셀렉터**: 쇼핑몰별 3-5개 대안 셀렉터 유지
2. **Fallback Chain**: 프라이머리 → 세컨더리 → 비전 AI
3. **Self-Optimizer**: 실패 패턴 분석 후 프롬프트 자동 조정
4. **알림 시스템**: 성공률 85% 미만 시 알림

### Q8. Self-Healing Agent의 복구 시나리오?

**Answer**:
```typescript
const RECOVERY_SCENARIOS = [
  'popup_blocking',      // 팝업/모달 닫기
  'lazy_load',           // 스크롤 후 대기
  'network_delay',       // 추가 대기
  'selector_change',     // 대안 셀렉터 시도
  'full_page_reload',    // 페이지 리로드
];
```

복구 성공률: **87%** (자동 복구)

### Q9. Vision Parser V2.5의 개선점?

**Answer**:
V2.0 → V2.5 주요 변경:
| 항목 | V2.0 | V2.5 |
|------|------|------|
| Evidence | ❌ | ✅ 출처 명시 |
| Confidence | 단일값 | 항목별 분리 |
| Material | 텍스트만 | 위치 + 텍스트 |

```json
// V2.5 출력 예시
{
  "price": 39000,
  "materialEvidence": {
    "source": "product_detail",
    "text": "면 100%",
    "location": "bottom_section"
  },
  "confidence": 0.95
}
```

### Q10. 동시성 처리 방식?

**Answer**:
```typescript
// Priority Queue 기반
class ExtractionQueue {
  private queue: PriorityQueue<Task>;
  private concurrent: number = 3; // 최대 동시 처리
  
  async process() {
    while (!this.queue.isEmpty()) {
      const batch = this.queue.dequeue(this.concurrent);
      await Promise.all(batch.map(task => this.extract(task)));
    }
  }
}
```

---

## 🔒 Security (11-15)

### Q11. Firebase Security Rules 취약점은?

**Answer**:
적용된 규칙:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 본인 데이터만 접근
    match /users/{userId} {
      allow read, write: if request.auth != null 
                         && request.auth.uid == userId;
    }
    // 위시리스트: 본인만
    match /wishlists/{userId} {
      allow read, write: if request.auth != null 
                         && request.auth.uid == userId;
    }
  }
}
```

잠재 취약점 및 대응:
| 취약점 | 대응 |
|--------|------|
| 미인증 접근 | `request.auth != null` 필수 |
| 타인 데이터 | `uid == userId` 검증 |
| 대량 읽기 | Rate Limit 적용 |

### Q12. API Key 노출 방지 전략?

**Answer**:
```
1. 환경 변수: .env.local (gitignore)
2. 서버 사이드: API Route에서만 사용
3. Vercel 암호화: 환경 변수 암호화 저장
4. 로테이션: 분기별 키 갱신 정책
```

### Q13. XSS 방지 방법?

**Answer**:
```typescript
// lib/security/finalAudit.ts
const XSS_PATTERNS = [
  /<script\b[^>]*>/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /<iframe/i,
];

function checkXSS(input: string): boolean {
  return !XSS_PATTERNS.some(p => p.test(input));
}
```

### Q14. 프롬프트 인젝션 방지?

**Answer**:
Safe-Guard 필터:
```typescript
const INJECTION_PATTERNS = [
  /ignore.*previous.*instructions/i,
  /disregard.*above/i,
  /you.*are.*now/i,
];

function validatePromptSafety(prompt: string): boolean {
  return !INJECTION_PATTERNS.some(p => p.test(prompt));
}
```

### Q15. 데모 환경 Abuse 방지?

**Answer**:
```typescript
// lib/security/demoGuard.ts
const DEMO_LIMITS = {
  RPM_PER_IP: 5,        // IP당 분당 5회
  BLOCK_DURATION: 3600, // 1시간 차단
};
```

---

## 📊 Performance (16-18)

### Q16. 94.2% 성공률의 기술적 증명?

**Answer**:
로드 테스트 결과 (50회 × 7개 쇼핑몰):
```
Total Tests:     350
Successful:      330
Failed:          20
Success Rate:    94.2%
```

실패 분석:
- 한섬(43%): Legacy DOM → 개선 필요
- SSF샵(71%): 복잡한 가격 구조

### Q17. 99.8% 비용 절감 계산 방법?

**Answer**:
```
수동 비용:    ₩25,000/건 (주니어 MD 시급 기준)
자동화 비용:  ₩50/건 (Gemini API 추정)

절감액 = (25,000 - 50) / 25,000 × 100 = 99.8%
```

### Q18. 응답 시간 최적화 방법?

**Answer**:
| 단계 | 시간 | 최적화 |
|------|------|--------|
| 스크린샷 | 1.5s | Pre-render 캐싱 |
| AI 분석 | 0.8s | Flash 모델 사용 |
| 후처리 | 0.3s | 병렬 처리 |
| **총합** | **2.1s** | -34% 개선 |

---

## 🔮 Future (19-20)

### Q19. 벡터 검색 도입 시 예상 과제?

**Answer**:
| 과제 | 해결 방안 |
|------|-----------|
| 임베딩 비용 | 배치 처리 |
| 인덱스 크기 | Pinecone Serverless |
| 정확도 | FashionCLIP 파인튜닝 |

### Q20. 타 산업 적용 가능성?

**Answer**:
Generic AI Agent Framework:
```
Fashion → 가전 → 부품 → B2B
   ↓
공통 모듈:
├── Vision Parser (범용)
├── Self-Healer (범용)
├── Rate Limiter (범용)
└── Cross-Checker (범용)
   +
도메인 모듈:
├── 가격 추출 → 스펙 추출
├── 소재 분석 → 부품 분석
└── 트렌드 → 수요 예측
```

---

_© 2026 LooPyck. All rights reserved._
