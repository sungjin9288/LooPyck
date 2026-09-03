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
- USB debugging enabled, or an Android emulator/AVD available
- real device or emulator visible to `adb devices`
- `npm run cap:android:prod` will auto-resolve common Android Studio locations, including `/Applications/Android Studio.app`, `~/Applications/Android Studio.app`, and JetBrains Toolbox installs
- if Android Studio is installed outside those locations, set `CAPACITOR_ANDROID_STUDIO_PATH`
- if `adb` exists under the resolved SDK `platform-tools`, `npm run cap:android:prod` will prepend it automatically; otherwise expose `adb` on `PATH`
- if Gradle cannot find a system Java runtime on macOS, use Android Studio's bundled JBR:

```bash
cd android
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew installDebug
```

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
- `androidStudioAvailable` and `adbOnPath` should be `true` before Android device launch
- if `adbOnPath` is `false` but `adbSdkPath` is present, the production Android opener can still inject the SDK path automatically

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
2. select the connected device or running emulator
3. Run `app`

If you do not have a physical device attached, you can validate the native shell with an emulator:

1. open `Device Manager`
2. create a device such as `Medium Phone`
3. choose a downloadable `Google Play` `ARM 64 v8a` system image
4. boot the emulator
5. confirm it appears in `adb devices`
6. Run `app`

## 4. Native Smoke Flow

On the device or emulator:
1. launch the app
2. search `남자 후드`
3. confirm loading panel appears first, then result cards
4. search `운동용 후드`
5. confirm the first result set is replaced by the second result set
6. open one product detail / comparison flow
7. log in if admin QA is needed
8. open `/admin` and verify terminal surface if required

Pass / fail signals:
- pass: `남자 후드` 와 `운동용 후드` 검색 결과가 순차적으로 교체되고 blank screen이 없다
- pass: compare detail에서 purchase evidence, freshness badge, decision block이 함께 보인다
- pass: favorites 진입과 compare link 이동이 web smoke와 동일하다
- pass: `adb shell dumpsys activity activities` 기준으로 `app.loopyck.fashion/.MainActivity` 가 `topResumedActivity` 또는 `mCurrentFocus` 로 보인다
- fail: auth state mismatch, infinite loader, broken navigation, empty shell, or native-only layout break

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
- Emulator-only validation is acceptable for release smoke when a physical Android device is not available, but note that strict physical-device sign-off is still optional follow-up.
- If the primary deployment URL changes, update the scripts and rerun `npm run cap:build:prod`.
- If Capacitor plugins or native config change, rerun `npm run cap:build:prod` before testing again.
- If `npm run cap:android:prod` says Android Studio was not found, either install it in a common location or export `CAPACITOR_ANDROID_STUDIO_PATH`.
- If `adb` is not on PATH but the SDK binary exists, verify devices with `~/Library/Android/sdk/platform-tools/adb devices`. The production Android opener will reuse that path automatically once a device is attached.
- If Android Studio says the SDK root is invalid, move the broken SDK aside and let Android Studio recreate `~/Library/Android/sdk` before retrying.

## 8. Apps in Toss Boundary

Capacitor remote URL mode와 Apps in Toss WebView SDK artifact는 같은 배포 경로가 아니다.

- Capacitor shell은 이 문서의 Netlify URL을 직접 로드한다.
- Apps in Toss는 SDK가 포함된 web build artifact를 업로드하고 Toss CDN에서 호스팅한다.
- 현재 `next.config.js`는 `output: 'standalone'`이며 API/dynamic route를 포함한다. `ait build`는 `dist/web/index.html`이 있는 CSR/SSG output만 허용하므로 현재 구조에서는 artifact 단계가 fail-closed한다.
- redirect/iframe shell로 통과시키지 않는다. Apps in Toss 출시가 필요하면 static mini-app frontend와 Netlify API backend 경계를 별도 architecture decision으로 설계한다.

근거: [기존 웹 프로젝트 SDK 연동](https://developers-apps-in-toss.toss.im/tutorials/webview.html), [Apps in Toss 개요](https://developers-apps-in-toss.toss.im/intro/overview.html).
