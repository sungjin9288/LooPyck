# Mobile Real-Device Testing

LooPyck uses **Capacitor remote URL mode** for native device testing.

That means:
- the iOS/Android shell loads the deployed web app in a native WebView
- search/API/Firebase/admin behavior stays aligned with production
- most web-only fixes do not require a native rebuild

Current production target:

```text
https://loo-pyck.netlify.app
```

## 1. Prerequisites

### Common
- Node.js 20+
- npm 10+
- `.env.local` configured

### iOS
- macOS
- Xcode installed
- Apple ID available in Xcode signing
- real device connected and trusted

### Android
- Android Studio installed
- USB debugging enabled
- real device connected and visible to `adb devices`

## 2. Production Device Prep

Use the production-specific Capacitor scripts. They force the native shell to load the Netlify deployment instead of localhost or an old Vercel URL.

```bash
npm install
npm run cap:doctor
npm run cap:build:prod
```

Expected:
- `resolvedCapacitorServerUrl` is `https://loo-pyck.netlify.app`
- after sync, both native `capacitor.config.json` files also point to that URL

## 3. Open the Native Project

### iOS

```bash
npm run cap:ios:prod
```

Then in Xcode:
1. select the connected iPhone
2. set signing team if required
3. Run

### Android

```bash
npm run cap:android:prod
```

Then in Android Studio:
1. wait for Gradle sync
2. select the connected device
3. Run `app`

## 4. Real-Device Smoke Flow

On the device:
1. launch the app
2. search `남자 후드`
3. confirm loading panel appears first, then result cards
4. search `운동용 후드`
5. confirm the first result set is replaced by the second result set
6. open one product detail / comparison flow
7. log in if admin QA is needed
8. open `/admin` and verify terminal surface if required

## 5. Verify Native Config

After `npm run cap:build:prod`, these files should contain the Netlify URL:

```text
ios/App/App/capacitor.config.json
android/app/src/main/assets/capacitor.config.json
```

Quick check:

```bash
npm run cap:doctor
```

## 6. Commands

```bash
npm run cap:doctor
npm run cap:sync:prod
npm run cap:build:prod
npm run cap:ios:prod
npm run cap:android:prod
```

## 7. Notes

- Use the `:prod` variants for real-device QA.
- If the primary deployment URL changes, update the scripts and rerun `npm run cap:build:prod`.
- If Capacitor plugins or native config change, rerun `npm run cap:build:prod` before testing again.
