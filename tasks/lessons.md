# LooPyck Lessons Learned

> 실수를 반복하지 않기 위한 교훈 기록

---

## 📝 Lessons Log

| Date | Category | Lesson | New Rule |
|------|----------|--------|----------|
| 2026-02-05 | Setup | 워크플로우 문서화 없이 작업 시작 시 추적이 어려움 | 모든 작업 전 `tasks/todo.md` 업데이트 필수 |
| 2026-02-05 | AI | Gemini Free Tier RPD 제한(20/일)이 매우 엄격함 | 캐싱 필수, 테스트 시 쿼터 소진 주의 |
| 2026-02-05 | Architecture | API 클라이언트와 상수를 분리하면 유지보수 용이 | 상수는 `config.ts`로 분리 |
| 2026-02-05 | Testing | 유닛 테스트 함수를 모듈에 포함하면 별도 프레임워크 없이 검증 가능 | `__test_` 접두사로 테스트 함수 명명 |

---

## 🔴 Critical Rules

1. **Planning First**: 코드 수정 전 반드시 `tasks/todo.md` 업데이트
2. **No Magic Numbers**: 모든 상수는 `designTokens.ts` 또는 constants에
3. **Build Check**: 모든 변경 후 `npm run build` 실행
4. **Error Handling**: API 호출 시 항상 try-catch + timeout 처리

---

## 🟡 Guidelines

- Firestore 트랜잭션 사용 시 읽기(READ) 먼저, 쓰기(WRITE) 나중에
- 새 hook 추가 시 기존 패턴(`useCloudStorage.ts`) 참고
- 컴포넌트는 presentational, 로직은 hooks/utils로 분리

---

## 📚 Reference Patterns

### Error Handling Template
```typescript
try {
  const result = await apiCall();
  return result;
} catch (error) {
  console.error('[Context] Operation Failed:', error);
  // Graceful fallback
  return defaultValue;
}
```

### Design Token Usage
```typescript
import { DesignTokens } from '@/styles/designTokens';
// Use: DesignTokens.colors.accent instead of '#3B82F6'
```

---

_This document is updated whenever we learn from mistakes._
