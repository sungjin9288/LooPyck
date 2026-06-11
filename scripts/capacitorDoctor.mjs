import path from 'node:path';
import fs from 'node:fs';
import { DEFAULT_ANDROID_STUDIO_PATH, commandOnPath, resolveAndroidSdk, resolveAndroidStudio } from './capacitorAndroidEnv.mjs';

const LOCAL_DEV_SITE_URL = 'http://localhost:3000';
const DEFAULT_SITE_URL = 'https://loo-pyck.netlify.app';
const ROOT = process.cwd();

function sanitizeOrigin(rawUrl, fallback) {
  if (!rawUrl) return fallback;

  try {
    return new URL(rawUrl).origin;
  } catch {
    return fallback;
  }
}

function resolveSiteUrl(env = process.env) {
  return sanitizeOrigin(
    env.NEXT_PUBLIC_SITE_URL?.trim() || env.SITE_URL?.trim(),
    DEFAULT_SITE_URL
  );
}

function resolveCapacitorServerUrl(env = process.env) {
  return sanitizeOrigin(
    env.CAPACITOR_SERVER_URL?.trim() || resolveSiteUrl(env),
    LOCAL_DEV_SITE_URL
  );
}

function readNativeServerUrl(relativePath) {
  const filePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(filePath)) return null;

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return parsed?.server?.url ?? null;
  } catch {
    return null;
  }
}

const resolvedSiteUrl = resolveSiteUrl();
const resolvedCapacitorServerUrl = resolveCapacitorServerUrl();
const iosNativeServerUrl = readNativeServerUrl(path.join('ios', 'App', 'App', 'capacitor.config.json'));
const androidNativeServerUrl = readNativeServerUrl(path.join('android', 'app', 'src', 'main', 'assets', 'capacitor.config.json'));
const studio = resolveAndroidStudio();
const sdk = resolveAndroidSdk();
const nativeConfigAligned =
  iosNativeServerUrl === resolvedCapacitorServerUrl &&
  androidNativeServerUrl === resolvedCapacitorServerUrl;

let nextStep = 'Set CAPACITOR_SERVER_URL or use the production scripts if you want to test the Netlify deployment on a device.';

if (nativeConfigAligned) {
  if (!studio.available) {
    nextStep = 'Android native config is ready, but Android Studio was not found in common install paths. Install it or set CAPACITOR_ANDROID_STUDIO_PATH before running `npm run cap:android:prod`.';
  } else if (!sdk.adbOnPath && sdk.adbPath) {
    nextStep = 'Android native config is ready. `npm run cap:android:prod` will prepend the SDK platform-tools path automatically, but you still need a connected device visible to adb.';
  } else if (!sdk.adbOnPath) {
    nextStep = 'Android native config is ready, but adb is not available. Install Android platform-tools or expose adb on PATH before attaching a device.';
  } else {
    nextStep = 'Native config is synced to Netlify production. Open `npm run cap:ios:prod` or `npm run cap:android:prod` and run on a real device.';
  }
} else if (resolvedCapacitorServerUrl === DEFAULT_SITE_URL) {
  nextStep = 'Run `npm run cap:build:prod` and then open `npm run cap:ios:prod` or `npm run cap:android:prod`.';
}

const report = {
  resolvedSiteUrl,
  resolvedCapacitorServerUrl,
  iosProjectExists: fs.existsSync(path.join(ROOT, 'ios', 'App', 'App.xcodeproj')),
  androidProjectExists: fs.existsSync(path.join(ROOT, 'android', 'app', 'src', 'main', 'AndroidManifest.xml')),
  iosNativeServerUrl,
  androidNativeServerUrl,
  nativeConfigAligned,
  androidStudioPath: studio.resolvedPath || studio.configuredPath || DEFAULT_ANDROID_STUDIO_PATH,
  androidStudioAvailable: studio.available,
  androidStudioCandidatePaths: studio.candidatePaths,
  adbOnPath: sdk.adbOnPath || commandOnPath('adb'),
  adbSdkPath: sdk.adbPath,
  adbSdkRoot: sdk.resolvedRoot,
  nextStep,
};

console.log(JSON.stringify(report, null, 2));
