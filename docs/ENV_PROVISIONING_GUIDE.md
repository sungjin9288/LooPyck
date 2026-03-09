# ENV Provisioning Guide

이 문서는 `지금 직접 설정해야 하는 optional env`만 대상으로 한다.

대상:

- `CRON_SECRET`
- `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
- `GEMINI_API_KEY`
- `ALERT_TUNING_WEBHOOK_URL`
- `ALERT_TUNING_WEBHOOK_FORMAT`
- `ALERT_TUNING_WEBHOOK_BEARER`

## 1. CRON_SECRET

### 어디서 받는가

외부 서비스에서 받는 값이 아니다. 직접 랜덤 문자열을 생성하면 된다.

### 어떻게 생성하는가

터미널에서 아래 실행:

```bash
openssl rand -base64 32
```

### 어디에 넣는가

로컬:

```env
CRON_SECRET=generated_random_value
```

운영:

- Vercel `Project > Settings > Environment Variables`
- key: `CRON_SECRET`
- Environment: `Production`
- 필요하면 `Preview`도 추가

### 어디에 쓰는가

- `/api/jobs/scan-price-alerts`
- `/api/jobs/alert-tuning-reminders`

## 2. NEXT_PUBLIC_FIREBASE_VAPID_KEY

### 어디서 받는가

Firebase Console에서 받는다.

경로:

1. Firebase Console
2. 프로젝트 선택
3. `Project settings`
4. `Cloud Messaging`
5. `Web configuration`
6. `Web Push certificates`

필요하면 새 key pair를 생성한다.

### 어디에 넣는가

로컬:

```env
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_public_vapid_key
```

운영:

- Vercel `Project > Settings > Environment Variables`
- key: `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
- Environment: `Production`
- Preview에서도 웹 푸시를 테스트할 거면 `Preview`도 추가

### 언제 필요한가

웹 푸시를 쓸 때만 필요하다.

현재 코드 사용 위치:

- [pushRegistration.ts](/Users/sungjin/dev/personal/LooPyck/lib/native/pushRegistration.ts)

## 3. GEMINI_API_KEY

### 어디서 받는가

Google AI Studio에서 API key를 생성한다.

흐름:

1. Google AI Studio 접속
2. 로그인
3. `Get API key`
4. 새 key 생성 또는 기존 key 확인

### 어디에 넣는가

로컬:

```env
GEMINI_API_KEY=your_gemini_api_key
```

운영:

- Vercel `Project > Settings > Environment Variables`
- key: `GEMINI_API_KEY`
- Environment: `Production`
- Preview에서 AI 기능도 테스트할 거면 `Preview` 추가

### 언제 필요한가

AI 기능을 실제로 사용할 때만 필요하다.

현재 코드 사용 위치 예시:

- [ai-chat route.ts](/Users/sungjin/dev/personal/LooPyck/app/api/ai-chat/route.ts)
- [geminiProvider.ts](/Users/sungjin/dev/personal/LooPyck/lib/ai/geminiProvider.ts)

## 4. ALERT_TUNING_WEBHOOK_URL / FORMAT / BEARER

### Slack로 설정하는 경우

어디서 받는가:

1. Slack App 생성
2. `Incoming Webhooks` 활성화
3. 보낼 채널 선택
4. webhook URL 발급

로컬:

```env
ALERT_TUNING_WEBHOOK_URL=https://hooks.slack.com/services/...
ALERT_TUNING_WEBHOOK_FORMAT=slack
ALERT_TUNING_WEBHOOK_BEARER=
```

보통 Slack Incoming Webhook은 별도 bearer가 필요 없다.

### Discord로 설정하는 경우

어디서 받는가:

1. Discord 서버 설정
2. 채널 또는 서버의 webhook 생성
3. webhook URL 복사

로컬:

```env
ALERT_TUNING_WEBHOOK_URL=https://discord.com/api/webhooks/...
ALERT_TUNING_WEBHOOK_FORMAT=discord
ALERT_TUNING_WEBHOOK_BEARER=
```

### Generic webhook으로 설정하는 경우

```env
ALERT_TUNING_WEBHOOK_URL=https://your-ops-endpoint.example.com/webhook
ALERT_TUNING_WEBHOOK_FORMAT=generic
ALERT_TUNING_WEBHOOK_BEARER=optional_bearer_token
```

### 어디에 넣는가

운영:

- Vercel `Project > Settings > Environment Variables`
- keys:
  - `ALERT_TUNING_WEBHOOK_URL`
  - `ALERT_TUNING_WEBHOOK_FORMAT`
  - `ALERT_TUNING_WEBHOOK_BEARER`
- Environment: 보통 `Production`

### 언제 필요한가

alert tuning approval reminder digest를 Slack/Discord/external ops channel로 보낼 때만 필요하다.

현재 코드 사용 위치:

- [alertTuningStore.ts](/Users/sungjin/dev/personal/LooPyck/lib/server/alertTuningStore.ts)
- [SearchDiagnosticsDashboard.tsx](/Users/sungjin/dev/personal/LooPyck/components/admin/SearchDiagnosticsDashboard.tsx)

## 5. Vercel에 넣는 방법

경로:

1. Vercel Dashboard
2. 프로젝트 선택
3. `Settings`
4. `Environment Variables`
5. key / value 입력
6. 적용할 Environment 선택

권장:

- `Production`: 실제 운영값
- `Preview`: 미리보기에서도 실제 기능 테스트가 필요할 때만 추가

참고:

- env 변경은 기존 배포에 소급 적용되지 않는다.
- env 변경 후에는 새 배포가 필요하다.
- 로컬로 Development env를 가져오려면 `vercel env pull`을 쓸 수 있다.

## 6. 설정 후 확인

### 로컬 확인

```bash
npm run env:check
npm run build
```

### 웹 확인

- `/admin`
- `/admin/ops`

### webhook 확인

1. `/admin/ops` 열기
2. approval request 하나 생성
3. `Run Digest Now` 클릭
4. Queue Ops Feed의 webhook 상태 확인
5. Slack/Discord 수신 확인

## 7. 지금 직접 해야 하는 것만 요약

현재 네가 직접 해야 하는 일:

1. `CRON_SECRET` 생성
2. 필요하면 Firebase Console에서 `NEXT_PUBLIC_FIREBASE_VAPID_KEY` 복사
3. 필요하면 Google AI Studio에서 `GEMINI_API_KEY` 생성
4. 필요하면 Slack 또는 Discord에서 webhook URL 발급
5. 해당 값을 `.env.local`과 Vercel에 넣기
6. `npm run env:check`로 다시 확인

## 8. Official References

- Vercel Environment Variables: https://vercel.com/docs/environment-variables
- Vercel CLI `env`: https://vercel.com/docs/cli/env
- Firebase FCM Web Push certificates 참고: https://firebase.google.com/docs/cloud-messaging/flutter/client
- Firebase Messaging `vapidKey` 참고: https://firebase.google.com/docs/reference/js/messaging_.gettokenoptions
- Google AI Studio: https://ai.google.dev/aistudio/
- Gemini API key 사용 가이드: https://ai.google.dev/tutorials/setup
- Slack Incoming Webhooks: https://api.slack.com/incoming-webhooks
- Discord Intro to Webhooks: https://support.discord.com/hc/en-us/articles/228383668
- Discord Webhook Resource: https://docs.discord.com/developers/resources/webhook
