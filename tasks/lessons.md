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
| 2026-07-15 | React | nullable prop을 기준으로 hook 이전에 early return하면 null→value 전환에서 hook order/static flag 오류가 발생할 수 있음 | hook-free wrapper에서 null을 처리하고 hook component에는 non-null prop만 전달 |
| 2026-07-15 | AI Reliability | 외부 AI timeout 때 이미 계산한 결정론적 근거까지 버리고 오류를 반환하면 핵심 사용자 흐름과 비용만 악화됨 | 검증된 local/domain 결과로 fallback하고 response source/reason을 명시해 AI 결과와 구분 |
| 2026-07-15 | Firestore Serialization | top-level optional field만 `null`로 바꿔도 nested object에 `undefined`가 남으면 전체 batch write가 실패함 | Firestore boundary에서 nested optional field를 명시적으로 `null` 직렬화하고 pure serializer test로 `undefined` 부재를 검증 |
| 2026-07-15 | Interaction Analytics | 노출과 열람을 `productId`만으로 매칭하면 다른 검색어에서 발생한 open이 cohort 전환으로 잘못 귀속될 수 있음 | query와 product ID를 함께 interaction identity로 사용하고 cross-query negative case를 회귀 테스트에 포함 |
| 2026-07-15 | AI Source Fidelity | fallback header만 구분해도 하위 카드가 score 기반 AI label을 다시 만들면 사용자에게 AI 결과처럼 보일 수 있음 | response source를 모든 하위 UI label에 전달하고, 검증된 API rating enum을 단일 presentation mapping으로 사용 |
| 2026-07-15 | Telemetry Integrity | interaction type만 allowlist로 검사하면 식별자 없는 이벤트도 집계되어 conversion/open 지표가 오염될 수 있음 | ingest boundary에서 event별 필수 identity와 context를 pure contract로 검증한 뒤에만 memory/Firestore에 기록 |
| 2026-07-15 | AI Response Recovery | schema parse 실패 뒤 raw model text를 fallback으로 노출하면 잘린 JSON이 HTTP 200 사용자 답변으로 보일 수 있음 | raw provider text는 사용자 fallback으로 재사용하지 않고 pure parser 실패를 deterministic domain response와 source/reason contract로 치환 |
| 2026-07-15 | Commerce Data Hygiene | 넓은 DOM selector는 쿠폰 template 문법과 image dimension 같은 구현 metadata를 사용자-facing commerce signal로 오인식할 수 있음 | source parser와 PDP option ingestion boundary에서 unresolved template syntax, CSS dimension, URL-like value를 제거하고 실제 오염 문자열을 regression fixture로 고정 |
| 2026-07-15 | Analytics Temporal Integrity | impression과 open을 identity set만으로 교차하면 나중에 발생한 노출이 과거 열람을 conversion으로 역매칭할 수 있음 | conversion 집계는 identity 일치와 함께 event timestamp 순서를 검증하고, 입력 배열 순서가 아닌 시간 정보를 기준으로 판정 |
| 2026-07-15 | Release Evidence Provenance | production UAT pass는 배포 환경 동작을 증명하지만 dirty working tree의 변경 내용이 배포됐음을 증명하지 못함 | local pre-release smoke에 tracked diff와 untracked content fingerprint를 기록하고, production evidence와 deployment provenance를 별도 경계로 보고 |
| 2026-07-15 | PDP Option Semantics | option class 안의 모든 button을 option으로 수집하면 찜/장바구니/구매 control이 variant identity와 가격 이력 key를 오염시킬 수 있음 | option ingestion에서 commerce action phrase를 제거하고 release smoke가 final URL의 variantKey까지 검증하도록 강제 |
| 2026-07-15 | Visual Evidence Integrity | screenshot 경로만 JSON에 기록하면 실제 파일이 없거나 이후 코드 변경으로 stale해져도 증빙이 통과할 수 있음 | demo packet은 네 실파일 존재와 release QA workspace fingerprint 일치를 함께 검증 |
| 2026-07-15 | SSR Locale Stability | locale을 지정해도 server/browser ICU의 day-period 표기가 `PM`/`오후`로 달라 hydration mismatch가 발생할 수 있음 | SSR 노출 시각은 time zone과 24시간 hour cycle을 명시하고 정확한 문자열 회귀 테스트로 고정 |
| 2026-07-15 | Client Runtime Boundary | `typeof process !== 'undefined'`만 확인하면 Next client polyfill을 Node runtime으로 오인해 `process.memoryUsage()`가 fetch 전에 실패할 수 있음 | Node 전용 API는 함수 존재까지 capability check하고 browser-polyfill regression test를 기본 suite에 포함 |
| 2026-07-15 | Metric Decision Safety | open rate 숫자만 노출하면 표본이 부족하거나 배포본 parser가 뒤처진 상태에서도 uplift/하락 결론을 과대 해석할 수 있음 | baseline과 cohort별 directional sample floor를 적용하고 local/deployed observation artifact를 분리하며 인과·유의성 claim을 금지 |
| 2026-07-15 | External Source Contracts | 외부 검색 URL이 200을 반환해도 client-only shell이면 direct adapter는 항상 0건이고, 구 URL 404/429를 매 검색마다 반복하면 latency와 IP 평판만 악화됨 | URL status와 실제 parsed product count/title/price/link를 같이 live probe하고, 복구 불가 source는 실측 사유를 남겨 registry에서 제외한 뒤 classified fallback을 유지 |
| 2026-09-03 | Provider Lifecycle | 외부 API의 공식 종료를 일반 timeout/empty로 처리하면 불필요한 호출과 영구 failing 경보, 미사용 credential 요구가 남음 | 공식 종료가 확인된 provider는 단일 lifecycle contract로 no-call 처리하고 legacy route, health, env validation, 운영 문서를 함께 전환 |

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
## 2026-07-15 - Dependency audit gate는 `|| true` 대신 reviewed debt baseline을 사용한다

- 기존 취약점 때문에 raw `npm audit --audit-level=high`를 바로 blocking할 수 없더라도 audit 전체를 `|| true`로 무효화하면 신규 critical regression도 놓친다.
- 먼저 선언된 semver 범위 안의 fixable advisory를 제거하고, 잔여 high/critical은 advisory source ID·package·severity·package-count ceiling으로 명시한다.
- baseline은 안전 승인이나 해결 상태가 아니다. 신규/상향 debt는 fail-close하고, artifact를 workspace fingerprint와 연결해 stale audit가 release evidence로 재사용되지 않게 한다.
- known-debt baseline에 만료 기한이 없으면 예외가 영구 승인으로 굳어진다. `reviewedAt` / `reviewBy`를 다음 재검토 주기와 함께 강제하고, 날짜만 연장하지 말고 현재 dependency chain과 fix availability를 다시 확인한다.
## 2026-07-15 - Capacitor remote URL과 Apps in Toss artifact를 같은 WebView 배포로 취급하지 않는다

- Capacitor는 hosted URL을 native shell에서 직접 로드할 수 있지만, Apps in Toss WebView SDK는 CSR/SSG web artifact와 `index.html`을 빌드해 Toss CDN에 업로드한다.
- Next standalone/API build가 성공해도 `ait build` 통과를 의미하지 않는다. 두 gate를 별도로 실행하고 artifact output contract를 확인한다.
- server-rendered app을 redirect/iframe shell로 위장하지 않는다. static mini-app 전환은 API backend 분리와 routing/auth/storage 검토가 필요한 별도 architecture decision이다.

## 2026-07-15 - 관측성 boundary는 값뿐 아니라 container shape와 HTTP 결과까지 보존한다

- PII masker가 nested value를 재귀 처리하더라도 배열을 plain object로 바꾸면 log schema와 후속 분석이 조용히 깨진다. nested array fixture로 값 마스킹과 container shape를 함께 고정한다.
- `fetch()` resolve는 전송 성공일 뿐 ingest 성공이 아니다. fire-and-forget telemetry도 `response.ok`를 확인하고 non-2xx를 PII-safe warning으로 남겨 수집 거부를 관측 가능하게 한다.

## 2026-07-15 - Provider 오류 body는 진단 로그로 재사용하지 않는다

- AI provider의 non-2xx body나 parse 실패 raw text에는 사용자 prompt와 생성 내용이 포함될 수 있으므로 일부만 잘라도 production log에 남기지 않는다.
- 운영 로그에는 provider status, 정규화된 failure reason, `Error.message`만 남기고 모든 API route가 중앙 `Logger`를 통과하는지 source contract로 검사한다.

## 2026-07-15 - Next standalone 전환은 server command뿐 아니라 asset packaging 계약이다

- `output: 'standalone'`에서 `next start`를 standalone server로만 교체하면 `public/`과 `.next/static/`이 빠져 HTML은 열려도 이미지·CSS·chunk가 404가 될 수 있다.
- build 후 두 asset tree를 `.next/standalone/`에 deterministic copy하고, 로컬 start·stress·CI Playwright가 같은 launcher를 사용하도록 source contract와 실제 static asset HTTP probe를 함께 유지한다.

## 2026-07-15 - Client console도 production logging boundary에 포함한다

- OAuth/Firebase 오류와 review·visual-search 흐름의 client exception은 브라우저 console에 그대로 남으면 사용자 식별 정보나 입력 문맥이 노출될 수 있다.
- API뿐 아니라 `app`과 `components`도 중앙 `Logger`를 사용하고, direct call과 `.catch(console.error)` 같은 함수 참조를 모두 잡는 source contract를 유지한다.

## 2026-07-15 - Logging source contract는 state boundary도 포함한다

- auth context와 Firestore/search hook은 사용자별 state와 오류를 다루므로 UI 파일만 검사하면 browser log의 PII 노출 경로가 남을 수 있다.
- production runtime logging contract는 `app`, `components`, `contexts`, `hooks`를 함께 검사하고, fallback·loading·rethrow semantics는 logging migration과 분리해 유지한다.

## 2026-07-15 - Dependency debt는 full graph와 production install scope를 분리한다

- full `npm audit`만 기록하면 build/test toolchain debt와 production install dependency를 구분할 수 없고, `--omit=dev`만 기록하면 CI toolchain의 severe regression을 놓칠 수 있다.
- 두 scope를 같은 reviewed baseline과 workspace fingerprint로 함께 검증하되, npm package count를 실제 배포 exploitability나 안전 판정으로 확대 해석하지 않는다.

## 2026-07-15 - CLI dependency는 import와 실행 경계를 확인한 뒤 dev scope로 분류한다

- 설정 파일 type import와 package script에서만 쓰는 CLI를 runtime dependency에 두면 production install graph에 build-only transitive debt가 포함된다.
- source import audit와 CLI smoke를 먼저 수행한 뒤 devDependency로 이동하고, runtime SDK는 유지한 채 full/production audit를 모두 재검증한다.

## 2026-07-15 - `npm audit fix`의 exit code와 적용 결과를 분리해 판정한다

- 해결할 수 없는 advisory가 남으면 `npm audit fix`가 exit `1`이어도 `--force` 없는 safe lockfile fix는 적용될 수 있다.
- `package.json` checksum과 direct dependency 범위를 고정하고 lockfile diff, 재실행한 full/production audit를 함께 비교해 실제 변경 범위를 판정한다.
- 해결된 advisory source만 reviewed baseline에서 제거하며, 남은 debt를 감추기 위해 command exit code를 무시하거나 breaking upgrade를 자동 적용하지 않는다.

## 2026-07-16 - SDK wrapper의 runtime dependency는 clean production install로 검증한다

- build framework가 runtime API를 re-export하더라도 해당 framework 전체를 production dependency로 둘 필요는 없다. 실제 호출 source를 가장 좁은 runtime package로 연결하고 build/CLI package는 dev scope로 분리한다.
- package가 배포 산출물에서 다른 모듈을 import하면서 이를 runtime dependency로 선언하지 않을 수 있으므로, source inspection만으로 충분하지 않다. direct dependency를 명시한 뒤 clean `--omit=dev` install에서 API resolve와 audit를 함께 검증한다.

## 2026-07-16 - 해결된 advisory는 다른 scope의 baseline 예외로 남기지 않는다

- full graph와 production graph가 같은 allowed-advisory 목록을 공유하면 runtime에서 사라진 debt가 `resolved baseline`으로 계속 남고, production ceiling도 실제 상태보다 느슨해진다.
- scope별 baseline 파일, package ceiling, review window를 독립 관리하고 severe finding이 0인 production graph는 allowed advisory 0개와 `0 high / 0 critical`을 즉시 고정한다.

## 2026-07-16 - 드물게 실행하는 generator는 default install과 audit scope를 분리한다

- runtime/build에서 import하지 않고 수동 asset 생성에만 쓰는 tool이 오래된 transitive chain을 끌어오면 모든 root install에 불필요한 dependency surface가 추가된다.
- tool을 exact-version package와 lockfile로 격리하고 root cwd runner로 기존 생성 semantics를 유지하되, 별도 audit baseline과 release evidence에서 해당 debt를 계속 노출한다. 격리는 remediation이나 safety claim이 아니다.

## 2026-09-03 - Dependency baseline 재승인은 먼저 non-breaking remediation을 비교한다

- review window가 만료되고 신규 advisory가 추가됐을 때 현재 수치를 그대로 baseline에 옮기면 해결 가능한 debt까지 승인하게 된다.
- direct manifest checksum을 고정한 임시 lockfile에서 `npm audit fix --package-lock-only --ignore-scripts`와 broad update를 비교하고, 더 작은 graph와 production severe 0을 유지하는 경로를 적용한 뒤에만 baseline을 갱신한다.

## 2026-09-03 - Cyclic advisory graph는 traversal-order-independent하게 해석한다

- package name 기준 recursive memoization은 같은 node가 다른 ancestor set으로 재진입하는 cycle에서 advisory source를 누락할 수 있다.
- `via` package edge의 source 집합을 monotonic fixed-point로 전파해 순회 순서와 cycle 유무에 관계없이 같은 결과를 만들고, 실제 cycle fixture를 regression test로 고정한다.

## 2026-09-03 - Evidence command는 성공 출력과 stable artifact 저장을 함께 보장한다

- smoke가 JSON을 stdout에만 출력하면 운영자가 redirect를 빠뜨렸을 때 검증은 통과해도 release report는 이전 fingerprint를 계속 읽는다.
- target별 stable artifact path를 runner가 직접 선택하고 `tee`로 stdout 호환성을 유지하며, 특수 실행만 explicit output override를 사용한다.

## 2026-09-03 - Portfolio current-state claim은 문서 간 일관성과 live Git 기준을 함께 검사한다

- forbidden marketing claim만 검사하면 current 문서끼리 test count가 다르거나 오래된 commit을 최신으로 부르는 drift를 놓친다.
- 반복되는 adapter count는 current 문서 전체에서 단일 값이어야 하고, `latest commit` 표현은 verifier가 읽은 실제 HEAD와 일치해야 한다.

## 2026-09-03 - Grouping 품질은 pairwise false merge와 false split을 함께 측정한다

- 같은 상품 사례만 unit test로 나열하면 다른 상품을 잘못 합치는 precision 회귀와 같은 상품을 나누는 recall 회귀를 하나의 품질 기준으로 비교하기 어렵다.
- labeled cross-mall fixture의 모든 pair를 confusion matrix로 평가하고 sample/positive-pair floor와 workspace fingerprint를 함께 저장한다.
- model code punctuation처럼 실제 false split이 드러나면 fixture를 완화하지 말고 normalization root cause를 좁게 수정한다. Curated benchmark 수치는 production accuracy로 확대 해석하지 않는다.
