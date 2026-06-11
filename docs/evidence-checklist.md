# Evidence Checklist

| 항목 | 상태 | 증거 파일 | 비고 |
|---|---|---|---|
| 프로젝트 유형 판단 | 완료 | `docs/implementation-evidence.md` | 개인 / PoC 확장형 MVP |
| 구현 증거 기능 표 | 완료 | `docs/implementation-evidence.md` | 완료/개발 중/미구현 분리 |
| 로컬 실행 로그 | 완료 | `evidence/cli-logs/dev-server.log` | localhost:3100 |
| TypeScript 검증 | 완료 | `evidence/cli-logs/typecheck.log` | exit 0 |
| 테스트 검증 | 완료 | `evidence/cli-logs/test-adapters.log` | 245 pass |
| 환경 준비 상태 | 완료 | `evidence/cli-logs/env-check.log` | 값 없이 set 여부만 기록 |
| 웹앱 스크린샷 | 완료 | `evidence/screenshots/*.png` | 기존 지원 캡처 + 우선 포트폴리오 캡처 |
| 우선 포트폴리오 스크린샷 | 완료 | `evidence/screenshots/priority-*.png` | 검색, 결과, 가격 비교, AI 추천, 챗봇, 즐겨찾기/가격 알림 |
| API 응답 | 완료 | `evidence/api-responses/*.json` | 5 endpoints |
| API 요약 산출물 | 완료 | `evidence/output-artifacts/api-summary.json` | JSON summary |
| Mermaid architecture | 완료 | `evidence/architecture/*.mmd` | system + sequence |
| 민감정보 제외 | 완료 | `evidence/evidence_manifest.md` | 제외 패턴 검사 필요 |
| portfolio zip 갱신 | 완료 예정 | `_portfolio_export/loopyck_portfolio_pack.zip` | evidence 포함 재생성 |

## 검증 완료 기능

- 홈/검색/브랜드/카테고리/로그인/admin gate 화면 렌더링
- 메인 검색 화면, 상품 검색 결과, 가격 비교 상세 모달
- AI 스타일 추천 결과 화면
- 즐겨찾기/가격 알림 empty state 화면
- Naver Shopping API 검색
- 다중 소스 realtime search
- style recommendation API
- price-history validation
- product matching, purchase pricing, purchase decision domain tests

## 검증 필요 기능

- AI chat UI 응답: 챗봇 패널과 질문 전송은 확인했지만 AI 응답 오류가 표시됨
- production deploy 최신 상태
- 실제 사용자 analytics
- Compare Entry redesign completion

## 미구현 또는 근거 부족

- 운영 성과 수치
- 전환율/매출/사용자 수
- 모든 쇼핑몰 데이터 정확도 보장
