# ENV_SETUP Checklist

이 문서는 `개발 먼저, 운영은 나중` 기준으로 필요한 입력값만 빠르게 정리한 체크리스트다.

## 1. 로컬 개발 최소 입력

직접 채워야 하는 값:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

ADMIN_UIDS=your_firebase_uid
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

이 값이면 아래 기능이 켜진다.

- 실시간 검색
- Firebase 로그인
- compare entity / price history 저장
- `/admin`
- `/admin/ops`
- alert tuning ops

## 2. 선택 입력

기능이 필요할 때만 직접 채운다.

```env
CRON_SECRET=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
GEMINI_API_KEY=

ALERT_TUNING_WEBHOOK_URL=
ALERT_TUNING_WEBHOOK_FORMAT=generic
ALERT_TUNING_WEBHOOK_BEARER=
```

설명:

- `CRON_SECRET`: `/api/jobs/*` 보호
- `UPSTASH_*`: 분산 rate limit
- `NEXT_PUBLIC_FIREBASE_VAPID_KEY`: 웹 푸시
- `GEMINI_API_KEY`: AI 기능
- `ALERT_TUNING_WEBHOOK_*`: approval reminder digest 외부 전송

## 3. 운영 배포 시 직접 해야 하는 일

Vercel 기준:

1. `Settings > Environment Variables` 이동
2. 아래 키를 `Production`에 추가
3. 필요하면 `Preview`에도 같은 값 추가

### 3.1 `CRON_SECRET` 직접 생성

아래 명령으로 랜덤 문자열 하나 생성:

```bash
openssl rand -base64 32
```

생성한 값을 아래처럼 넣는다.

```env
CRON_SECRET=generated_random_value
```

용도:

- `/api/jobs/scan-price-alerts`
- `/api/jobs/alert-tuning-reminders`

둘 다 같은 `CRON_SECRET`으로 보호된다.

### 3.2 Slack webhook 직접 연결

Slack에서 직접 해야 하는 순서:

1. Slack App 생성
2. `Incoming Webhooks` 활성화
3. 연결할 채널 선택
4. Webhook URL 발급

그다음 `.env.local` 또는 Vercel에 아래 입력:

```env
ALERT_TUNING_WEBHOOK_URL=https://hooks.slack.com/services/...
ALERT_TUNING_WEBHOOK_FORMAT=slack
ALERT_TUNING_WEBHOOK_BEARER=
```

보통 Slack Incoming Webhook은 `ALERT_TUNING_WEBHOOK_BEARER`가 필요 없다.

확인 순서:

1. `/admin/ops` 열기
2. Webhook 표시가 `Slack`인지 확인
3. approval queue에 overdue 또는 expiring request가 하나 이상 있는지 확인
4. `Run Digest Now` 실행
5. Slack 채널 수신 확인

Discord를 쓸 경우:

```env
ALERT_TUNING_WEBHOOK_URL=https://discord.com/api/webhooks/...
ALERT_TUNING_WEBHOOK_FORMAT=discord
```

### 3.3 Vercel scope 분리

`Production`에 넣을 값:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`
- `ADMIN_UIDS`
- `NEXT_PUBLIC_SITE_URL`
- `CRON_SECRET`

`Preview`에 넣을 값:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`
- `ADMIN_UIDS`

`Preview`에서 결정할 값:

- `NEXT_PUBLIC_SITE_URL`
  preview canonical을 쓸 거면 preview URL
  production canonical을 유지할 거면 production URL
- `CRON_SECRET`
  preview에서도 cron endpoint를 실제 호출할 거면 설정

선택적으로 `Production`, `Preview` 둘 다 넣을 값:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `ALERT_TUNING_WEBHOOK_URL`
- `ALERT_TUNING_WEBHOOK_FORMAT`
- `ALERT_TUNING_WEBHOOK_BEARER`
- `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
- `GEMINI_API_KEY`

운영 필수:

- `NEXT_PUBLIC_FIREBASE_*`
- `FIREBASE_ADMIN_*`
- `ADMIN_UIDS`
- `NEXT_PUBLIC_SITE_URL`

운영 권장:

- `CRON_SECRET`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `ALERT_TUNING_WEBHOOK_URL`
- `ALERT_TUNING_WEBHOOK_FORMAT`
- `ALERT_TUNING_WEBHOOK_BEARER`

## 4. 자동 확인

직접 입력 후 아래 명령으로 값 형식을 확인한다.

```bash
npm run env:check
```

이 명령은 secret 값을 출력하지 않고 아래만 확인한다.

- set / missing
- URL 형식
- `FIREBASE_ADMIN_PRIVATE_KEY` 형식
- `ADMIN_UIDS` 존재 여부
- webhook format 유효성

## 4.1 Firebase Authorized Domains 수동 확인

운영 로그인은 env만으로 끝나지 않는다. Firebase Console에서도 현재 웹 도메인을 직접 허용해야 한다.

확인 순서:

1. Firebase Console > `Authentication`
2. `Settings`
3. `Authorized domains`
4. 현재 서비스 도메인 추가

Netlify production 최소 항목:

```text
loo-pyck.netlify.app
```

추가로 직접 써야 하는 항목:

- preview URL을 실제 로그인에 쓸 경우 해당 preview host
- custom domain을 붙였으면 그 custom domain

이 값이 없으면 Google 로그인은 `auth/unauthorized-domain` 으로 실패한다.

## 5. 최종 확인

```bash
npm run env:check
npm run build
```

그다음 아래 경로 확인:

- `/admin`
- `/admin/ops`

운영 webhook까지 확인할 때:

1. `/admin/ops` 접속
2. approval queue에 request 생성
3. `Run Digest Now` 실행
4. `Queue Ops Feed`에서 webhook 상태 확인
5. Slack/Discord 채널 수신 확인

## 6. 직접 입력해야 하는 것만 요약

사람이 직접 넣어야 하는 값:

- Firebase Web SDK 값
- Firebase Admin Service Account 값
- 관리자 UID
- 실제 사이트 도메인
- cron 보호용 랜덤 secret
- 필요 시 webhook URL / bearer

코드가 자동으로 처리하는 것:

- webhook format auto-detect
- site/capacitor fallback
- alert tuning default config
- admin ops UI route 분리
