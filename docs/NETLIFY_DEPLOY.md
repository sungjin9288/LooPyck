# Netlify Deploy Guide

LooPyck uses **Netlify** as the primary free-tier deployment target while Vercel is blocked by fair-use limits.

## 1. Prerequisites

- Node.js 20+
- npm 10+
- Netlify account
- One of:
  - `npx netlify login`
  - `NETLIFY_AUTH_TOKEN`

## 2. Local Project State

This repo is configured for Next.js App Router and Netlify detects it automatically.

Key files:
- `netlify.toml`
- `package.json` scripts:
  - `npm run ntl:status`
  - `npm run ntl:login`
  - `npm run ntl:link`
  - `npm run ntl:sync-env`
  - `npm run ntl:smoke`
  - `npm run ntl:deploy:preview`
  - `npm run ntl:deploy:prod`

## 3. Authenticate

```bash
npm run ntl:login
```

If browser OAuth is not available, set:

```bash
export NETLIFY_AUTH_TOKEN=your_token_here
```

## 4. Link or Create a Site

Try linking by Git remote first:

```bash
npm run ntl:link
```

If the site does not exist yet, use:

```bash
npx netlify init
```

## 5. Sync Environment Variables

Netlify Functions inherit runtime env into AWS Lambda, so the deployed env must
stay under the Lambda 4 KB limit. Do not import `.env.local` directly.

Generate the trimmed allowlist file instead:

```bash
npm run ntl:sync-env
npx netlify env:import --replace-existing .netlify.env
```

The sync script intentionally excludes provider-specific leftovers such as
`VERCEL_OIDC_TOKEN` and rewrites `NEXT_PUBLIC_SITE_URL` / `SITE_URL` to
`https://loo-pyck.netlify.app`.

## 6. Preview Deploy

```bash
npm run ntl:deploy:preview
```

This creates a draft deploy URL for testing.

## 7. Production Deploy

```bash
npm run ntl:deploy:prod
```

## 8. Required Environment Variables

Mirror the existing runtime values already used in `.env.local`.

Minimum set:

```text
NAVER_CLIENT_ID
NAVER_CLIENT_SECRET
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY
ADMIN_UIDS
NEXT_PUBLIC_SITE_URL
```

Optional but recommended:

```text
GEMINI_API_KEY
CRON_SECRET
NEXT_PUBLIC_FIREBASE_VAPID_KEY
ALERT_TUNING_WEBHOOK_URL
ALERT_TUNING_WEBHOOK_FORMAT
ALERT_TUNING_WEBHOOK_BEARER
```

## 9. Verification

After deploy, verify:

- `/`
- `/admin`
- `/admin/ops`
- `/api/realtime-search`
- representative queries:
  - `남자 후드`
  - `운동용 후드`
  - `러닝 자켓`
  - `트레이닝 팬츠`
  - `와이드 팬츠`

Reusable smoke check:

```bash
npm run ntl:smoke
npm run ntl:browser-smoke
```

Notes:
- `ntl:browser-smoke` validates public search repeat-flow and the unauthenticated `/admin` gate.
- Authenticated `/admin` terminal surface verification still requires a real logged-in browser session.

## 10. Current Hosting Policy

- `Netlify`: primary free-tier deployment path
- `Vercel`: fallback once fair-use restriction clears
- `Cloudflare Workers Free`: currently blocked by Worker size limit
