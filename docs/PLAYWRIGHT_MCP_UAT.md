# Playwright MCP UAT Loop

정기 smoke/UAT는 CLI smoke로 구조적 실패를 먼저 잡고, 마지막에 Playwright MCP로 실제 비교 funnel을 눈으로 확인하는 순서로 운영한다.

## 1. Repeatable Entry Point

```bash
npm run ntl:uat
```

이 명령은 아래 순서로 실행된다.

1. `ntl:smoke`
2. `ntl:admin-smoke`
3. `ntl:browser-smoke`
4. `ntl:admin-browser-smoke`

실행 결과는 `output/playwright/netlify-uat-summary.json`에 저장된다.

## 2. Playwright MCP Quick Pass

CLI smoke가 통과하면 먼저 아래 helper로 기존 Playwright session을 정리한다.

```bash
$HOME/.codex/skills/playwright/scripts/playwright_cli.sh close-all
npm run ntl:quick-pass:prep
```

첫 번째 명령은 direct `close-all` 로 기존 Playwright session을 정리하고, 두 번째 명령은 `output/playwright/netlify-quick-pass-prep.json` 에 quick-pass용 URL과 체크 항목을 남긴다. 로컬 Chrome/Playwright session이 남아 있어서 MCP browser launch가 충돌하던 경우, 이 두 단계만 실행하면 manual trial-and-error 없이 Codex Playwright MCP quick pass를 재시작할 수 있다.

그다음 Codex Playwright MCP로 아래 화면을 직접 연다.

### Public compare funnel

1. `/brand/musinsa`
2. `/category/sneakers`
3. `/`

확인 항목:

- 브랜드/카테고리 hero에 `compare entry` 성격의 heading과 decision lens가 보이는지
- 랜딩 search entry에서 검색을 실행하면 홈 검색 결과로 이동하는지
- `sort`가 URL과 검색 바 상태에 일관되게 반영되는지
- guest shortlist가 있는 경우 재진입 section이 정상 노출되는지

### Admin gate / terminal

1. 비로그인 `/admin`
2. 필요 시 authenticated `/admin`은 `npm run ntl:admin-browser-smoke` 결과로 확인

확인 항목:

- 비로그인 세션에서 `/admin`이 terminal surface를 노출하지 않는지
- authenticated smoke 결과에 terminal heading, `Admin runtime telemetry` debug console, queue action button, advanced chain toggle이 포함되는지

## 3. When To Run

- Netlify preview deploy 직후
- production deploy 직후
- compare funnel, search, admin terminal을 변경한 PR 머지 전

## 4. Exit Criteria

- `ntl:uat` 성공
- direct `playwright_cli.sh close-all` + `ntl:quick-pass:prep` 성공 후 Playwright MCP quick pass를 repeatable 하게 재시작할 수 있음
- Playwright MCP quick pass에서 public compare funnel regressions 없음
- admin gate 또는 admin browser smoke에서 권한 누수 없음

## 4A. Playwright MCP Troubleshooting

Playwright MCP가 아래 오류로 바로 깨지면:

```text
ENOENT: no such file or directory, mkdir '/.playwright-mcp'
```

대개 MCP server가 workspace가 아니라 root (`/`) 를 `cwd` 로 잡고 떠 있는 상태다. 이 경우 default output dir가 repo 내부가 아니라 `/.playwright-mcp` 로 계산되어 실패한다.

새 세션 probe에서 아래처럼 browser profile lock으로 먼저 실패할 수도 있다.

```text
Browser is already in use for .../mcp-chrome-<id>, use --isolated to run multiple instances of the same browser
```

이 경우도 built-in MCP가 아직 healthy하지 않다는 뜻이다. root-cwd issue가 직접 드러나지 않아도 built-in launch/runtime layer가 repo-local override 대신 자체 profile/user-data-dir를 계속 잡고 있는 상태로 본다.

repo에는 이 문제를 줄이기 위한 workspace override가 이미 들어 있다.

```text
.mcp.json
```

이 file은 `playwright-local` server를 workspace `cwd` 와 `./output/playwright/mcp` output dir로 고정한다. 새 세션에서 Codex가 workspace MCP config를 다시 읽으면 built-in root-cwd 경로 대신 repo-local server를 우선 사용할 수 있다.

terminal에서 직접 local server를 검증해야 할 때는 아래 명령을 사용한다.

```bash
npm run ntl:quick-pass:mcp-local
npm run ntl:quick-pass:mcp-local:verify
npm run ntl:quick-pass:health
npm run ntl:quick-pass:recovery
npm run ntl:quick-pass:runtime-handoff
npm run ntl:quick-pass:runtime-issue-draft
npm run ntl:quick-pass:runtime-packet
npm run ntl:quick-pass:runtime-refresh
npm run ntl:quick-pass:runtime-assert
npm run ntl:quick-pass:runtime-ready
npm run ntl:quick-pass:runtime-cleanup-plan
npm run ntl:quick-pass:runtime-cleanup
```

첫 번째 명령은 동일한 output dir / user-data-dir를 써서 workspace 기준 `@playwright/mcp`를 직접 띄운다. 두 번째 명령은 local server를 잠깐 띄운 뒤 matching pid의 `cwd`를 검사하고 `output/playwright/playwright-mcp-local-verify.json` 을 남긴다. 세 번째 명령은 built-in doctor 결과와 local verify 결과를 합쳐 `output/playwright/playwright-mcp-health.json` 으로 비교 요약한다. 네 번째 명령은 `close-all -> quick-pass prep -> built-in doctor -> local verify -> health` 를 한 번에 실행하고 `output/playwright/playwright-quick-pass-recovery.json` 으로 recovery summary를 남긴다. 다섯 번째 명령은 built-in failure와 repo-local fallback success를 외부 runtime 레이어로 바로 넘길 수 있게 `output/playwright/playwright-mcp-runtime-handoff.md` 를 생성한다. 여섯 번째 명령은 같은 상태를 더 짧은 bug report 형식으로 압축한 `output/playwright/playwright-mcp-runtime-issue-draft.md` 를 생성한다. 일곱 번째 명령은 위 artifact들을 하나의 escalation packet index인 `output/playwright/playwright-mcp-runtime-packet.md` 로 묶는다. 여덟 번째 명령은 health -> handoff -> issue draft -> packet을 순서대로 다시 생성하고 `output/playwright/playwright-mcp-runtime-refresh.json` 으로 refresh summary를 남긴다. 아홉 번째 명령은 current operational stance가 `fallback-ready` 또는 `fully-ok` 인지 assertion으로 검사한다. 열 번째 명령은 refresh + assert를 한 번에 실행하고 `output/playwright/playwright-mcp-runtime-ready.json` 으로 closeout summary를 남긴다. 마지막 명령은 root-cwd candidate PID와 workspace PID를 `output/playwright/playwright-mcp-runtime-cleanup-plan.md` 로 정리한다. health artifact의 `status: fallback-ready` 면 built-in MCP는 아직 root-cwd risk 또는 browser-profile-lock risk가 있지만 repo-local fallback은 바로 사용할 수 있다는 뜻이다.

확인 순서:

```bash
npm run ntl:quick-pass:doctor
ps -Ao pid,args | rg -i "playwright-mcp"
lsof -a -d cwd -p <pid>
```

`cwd` 가 `/` 로 보이면 아래처럼 판단한다.

1. host가 root-level write를 허용하면 `mkdir -p /.playwright-mcp` 로 즉시 복구한다.
2. root write가 막혀 있으면 MCP quick pass는 억지로 붙잡지 말고 CLI fallback으로 전환한다.
3. CLI fallback을 썼다면 아래 artifact를 함께 남긴다.

`npm run ntl:quick-pass:health` 에서 `workspace-ok-global-root-risk` 가 나오면 현재 workspace의 built-in MCP는 동작하지만, 같은 머신의 다른 `playwright-mcp` 프로세스 중 `cwd=/` 로 떠 있는 것이 남아 있다는 뜻이다. 이 상태는 release/UAT를 막지는 않지만 `fully-ok` 로 보지는 않는다. health artifact의 `rootCwdProcesses` 와 `workspaceProcesses` 를 비교해 어떤 PID가 전역 risk인지 확인한다. 해당 프로세스를 종료해야 할 때는 다른 workspace/session에 영향이 없는지 먼저 확인한다.

cleanup 판단을 문서로 남기려면 아래 명령을 실행한다.

```bash
npm run ntl:quick-pass:runtime-cleanup-plan
```

이 명령은 종료 후보를 직접 kill하지 않고, `pid`, `ppid`, elapsed time, process state, parent command, `lsof` 확인 명령, parent inspect 명령, ownership 확인 후 사용할 수 있는 `kill <pid>` 후보만 기록한다.

guarded cleanup dry-run은 아래 명령으로 실행한다.

```bash
npm run ntl:quick-pass:runtime-cleanup
```

이 명령은 기본적으로 process를 종료하지 않고 `output/playwright/playwright-mcp-runtime-cleanup-result.json` 에 root-cwd 후보와 실행 조건을 기록한다. 실제 종료가 필요하다고 판단되면 root-cwd 후보 PID만 지정하고 confirm token을 함께 넘긴다.

```bash
PLAYWRIGHT_MCP_CLEANUP_PIDS=36880,53727 PLAYWRIGHT_MCP_CLEANUP_CONFIRM=YES_TERMINATE_ROOT_CWD_MCP npm run ntl:quick-pass:runtime-cleanup
```

이 실행은 requested PID가 doctor 기준 root-cwd 후보가 아니면 실패한다. 종료 후에는 `npm run ntl:quick-pass:health` 와 `npm run ntl:quick-pass:runtime-ready` 를 다시 실행한다.
PID를 지정했지만 confirm token이 없으면 dry-run으로 유지되고 non-zero로 실패한다.

- `output/playwright/netlify-quick-pass-prep.json`
- `output/playwright/netlify-quick-pass-notes.md`
- `output/playwright/playwright-mcp-doctor.json`
- brand/category screenshot + snapshot artifact
- fresh `output/playwright/netlify-uat-summary.json`

built-in MCP가 `cwd` probe 전에 browser-profile-lock으로 먼저 깨지면 아래처럼 판단한다.

1. direct `close-all` 과 `ntl:quick-pass:prep` 로 stale browser/session 충돌을 먼저 줄인다.
2. 그래도 same-profile lock이 남으면 built-in MCP는 unhealthy로 판단하고 repo-local fallback 또는 CLI quick pass로 전환한다.
3. 이 경우도 `output/playwright/playwright-mcp-live-probe.md` 에 live probe evidence를 남기고 operational stance는 `fallback-ready` 로 유지한다.

CLI fallback 기준 closure:

- brand/category compare funnel visual pass를 Playwright CLI snapshot/screenshot으로 확인
- home search state와 unauthenticated `/admin` gate는 fresh `ntl:uat` evidence로 확인
- authenticated `/admin` terminal/debug console은 `ntl:admin-browser-smoke` 결과로 확인

## 5. Release QA Closure (SUN-7)

정기 UAT가 통과한 뒤 release candidate를 닫을 때는 아래 순서로 진행한다.

### A. Real-Account Visual Polish

운영 계정 또는 실제 운영과 동일한 auth state에서 아래 화면을 확인한다.

1. `/`
2. `/brand/musinsa`
3. `/category/sneakers`
4. 상품 상세 / 비교 진입
5. `/favorites`
6. `/admin`

체크 항목:

- compare entry hero, decision lens, shortlist re-entry가 레이아웃 깨짐 없이 보이는지
- 검색어와 `sort` 상태가 URL / 검색 바 / 결과 카드에서 일관되는지
- 상품 상세에서 실구매가 근거, 데이터 신선도, decision block이 함께 보이는지
- favorites, alerts, admin surface에서 auth-state mismatch나 빈 화면이 없는지
- `/admin`에서 terminal heading, `Admin runtime telemetry`, queue action, advanced chain toggle이 정상 노출되는지

Real-account final checklist:

1. 홈 상단 우측에서 `로그인` 버튼 대신 프로필 아바타가 보이는지 확인한다.
2. 프로필 아바타를 열었을 때 `Sign Out` 액션이 노출되면 auth state를 pass로 본다.
3. `/?q=남자%20후드&sort=sim` 에서 검색어, 정렬 상태, 결과 카드가 서로 일치하는지 확인한다.
4. `/brand/musinsa` 와 `/category/sneakers` 에서 compare entry hero, direct search entry, sibling navigation이 깨지지 않는지 확인한다.
5. 검색 결과 또는 compare link를 통해 상품 상세에 들어가 `고정 compare page입니다.`, `선택 variant 기준 쇼핑몰 비교`, `선택 variant 가격 흐름`, decision block이 동시에 보이는지 확인한다.
6. `/favorites` 에서 `My Lookbook`, `Saved`, `Compare Ready` 요약과 compare link 진입이 정상인지 확인한다.
7. 실제 admin 계정이면 `/admin` 에서 `Search Learning Terminal Overview`, `Admin runtime telemetry`, queue actions, advanced chain toggle까지 확인한다.
8. 하나라도 blank screen, auth mismatch, infinite loader, broken navigation이 보이면 release candidate를 닫지 않는다.

자동화 가능한 web baseline은 아래 명령으로 먼저 확인한다.

```bash
npm run ntl:release-qa-smoke
```

이 명령은 production에서 아래를 확인한다.

- home 검색 후 detail route로 이어지는 baseline search 결과 확보
- detail page의 compare intro / compare section / price history section 노출
- `/favorites` guest lookbook header / saved summary / empty state 노출

favorites write/read/delete 정합성과 favorites UI에서 compare click-through까지 확인하려면 아래 probe를 별도로 실행한다.

```bash
npm run ntl:favorites-probe
```

이 명령은 synthetic authenticated session 기준으로 production Firestore에 probe favorite를 추가하고, `/favorites`에 보이는지 확인한 뒤 favorites UI의 `비교 페이지` 링크를 통해 실제 detail compare page 핵심 섹션까지 이동되는지 검증하고, 다시 삭제해 baseline count가 복구되는지 확인한다.

synthetic authenticated baseline 전체를 한 번에 확인하려면 아래 명령을 사용한다.

```bash
npm run ntl:auth-release-qa
```

이 명령은 `admin API access`, `admin browser terminal surface`, `favorites -> compare click-through`를 순서대로 실행하고 `output/playwright/netlify-auth-release-qa-summary.json` 에 summary를 남긴다.

real-account final pass를 반자동으로 진행하려면 아래 순서를 사용한다.

```bash
npm run ntl:real-account-qa:start
npm run ntl:real-account-qa:verify
```

admin 계정 검증까지 포함해야 하면 아래처럼 실행한다.

```bash
REAL_ACCOUNT_EXPECT_ADMIN=1 npm run ntl:real-account-qa:verify
```

이 helper는 `start` 단계에서 headed browser session을 foreground로 열어 Google 로그인을 완료한 뒤, headed browser window를 직접 닫아 profile lock을 해제하고, `verify` 단계에서 동일한 Chrome profile을 headless session으로 다시 열어 홈 auth state, search/detail compare surface, favorites surface, optional admin surface를 순회하고 `output/playwright/netlify-real-account-qa-summary.json` 및 관련 screenshot artifact를 남긴다.

### B. Android Native QA

사전 조건:

- `npm run cap:doctor`
- `npm run cap:build:prod`
- `adb devices` 에 실제 기기 또는 emulator 가 보여야 함

실행 순서:

1. `npm run cap:android:prod`
2. Android Studio에서 연결된 기기 또는 emulator 로 `app` 실행
3. 앱 기동 후 `남자 후드` -> `운동용 후드` 반복 검색
4. 상세 / 비교 / favorites / 필요 시 admin flow 확인
5. 필요하면 `JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew installDebug` 로 CLI install smoke를 추가 확인

체크 항목:

- native WebView에서 production URL (`https://loo-pyck.netlify.app`) 이 로드되는지
- 첫 검색 결과가 두 번째 검색 결과로 정상 교체되는지
- 상세 진입, 비교 진입, favorites 진입이 web smoke와 동일하게 동작하는지
- 로그인 이후 auth state가 web과 다르게 꼬이지 않는지
- `adb shell dumpsys activity activities` 기준으로 `app.loopyck.fashion/.MainActivity` 가 `topResumedActivity` 또는 `mCurrentFocus` 로 보이는지

Android final checklist:

1. `npm run cap:doctor` 에서 production URL 정렬 여부와 `adbSdkPath` 를 먼저 확인한다.
2. `npm run cap:android:prod` 실행 후 Android Studio가 열리지 않으면 설치 경로 또는 `CAPACITOR_ANDROID_STUDIO_PATH` 문제로 간주한다.
3. `adb devices` 에 실제 기기나 emulator 가 안 보이면 USB debugging / cable / trust prompt / AVD boot 문제로 간주하고 app launch 검증을 진행하지 않는다.
4. 앱 기동 후 `남자 후드` -> `운동용 후드` 반복 검색에서 결과 교체가 안 되면 blocker로 기록한다.
5. 상세 / 비교 / favorites 진입이 web smoke와 다르면 blocker로 기록한다.
6. auth state가 web과 다르게 꼬이거나 native shell에서 blank screen이 보이면 blocker로 기록한다.
7. emulator 기준 install/launch/foreground smoke가 통과하면 release candidate 판단 근거로 사용할 수 있고, physical device-only sign-off는 optional follow-up으로 분리할 수 있다.

### C. Defect Policy

- 이 단계에서는 새 기능이나 구조 리팩토링을 하지 않는다
- 확인된 결함만 수정하고, 나머지는 Linear follow-up으로 분리한다
- `P1/P2` 결함이 없으면 release candidate로 간주한다
