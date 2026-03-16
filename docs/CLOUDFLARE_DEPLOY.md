# Cloudflare Deploy Guide

LooPyck now targets **Cloudflare Workers via OpenNext** for free-tier testing and staging.

## 1. Prerequisites

- Node.js 20+
- npm 10+
- Cloudflare account
- One of:
  - `npx wrangler login`
  - `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`

## 2. Install

```bash
npm install
```

## 3. Local Preview

Cloudflare preview uses `.dev.vars`, while the app already uses `.env.local`.

```bash
npm run cf:sync-vars
npm run cf:preview
```

What this does:
- copies `.env.local` values into `.dev.vars`
- sets `NEXTJS_ENV=development`
- builds `.open-next`
- starts Wrangler preview

Preview URL is shown by Wrangler.

## 4. Required Cloudflare Worker Variables

At minimum, mirror the runtime values you already use in `.env.local`.

Examples:

```text
NAVER_CLIENT_ID
NAVER_CLIENT_SECRET
GEMINI_API_KEY
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_VAPID_KEY
FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY
ADMIN_UIDS
CRON_SECRET
NEXT_PUBLIC_SITE_URL
ALERT_TUNING_WEBHOOK_URL
ALERT_TUNING_WEBHOOK_FORMAT
ALERT_TUNING_WEBHOOK_BEARER
```

For production, configure them in Cloudflare Workers settings or with Wrangler secrets/vars.

## 5. Type Generation

```bash
npm run cf:typegen
```

This generates `cloudflare-env.d.ts` locally. It is ignored by git.

## 6. Build Only

```bash
npm run cf:build
```

Use this to validate the OpenNext adapter without deploying.

## 7. Deploy

```bash
npm run cf:deploy
```

If Wrangler is not authenticated, deployment will stop and ask for login/token setup.

## 8. Known Cloudflare Migration Notes

- `runtime = 'edge'` route handlers were removed because the OpenNext Cloudflare adapter does not support Next.js edge runtime in this repo setup.
- Incremental cache is intentionally left simple for now. R2-backed cache can be added later after the Worker is live.
- `.open-next`, `.wrangler`, `.dev.vars`, and `cloudflare-env.d.ts` are ignored by git.
- Real deployment was attempted and failed on Cloudflare Workers Free because the generated Worker script exceeded the free plan `3 MiB` size limit (`error code 10027`). The current OpenNext server handler was reported around `17.8 MiB`, which means this repo will require either:
  - Cloudflare Workers Paid, or
  - a major app slimming/splitting effort before free-tier Workers deploy is realistic.
