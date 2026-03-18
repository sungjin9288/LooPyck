import fs from 'node:fs';
import path from 'node:path';

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
const nativeConfigAligned =
  iosNativeServerUrl === resolvedCapacitorServerUrl &&
  androidNativeServerUrl === resolvedCapacitorServerUrl;

const report = {
  resolvedSiteUrl,
  resolvedCapacitorServerUrl,
  iosProjectExists: fs.existsSync(path.join(ROOT, 'ios', 'App', 'App.xcodeproj')),
  androidProjectExists: fs.existsSync(path.join(ROOT, 'android', 'app', 'src', 'main', 'AndroidManifest.xml')),
  iosNativeServerUrl,
  androidNativeServerUrl,
  nativeConfigAligned,
  nextStep: nativeConfigAligned
    ? 'Native config is synced to Netlify production. Open `npm run cap:ios:prod` or `npm run cap:android:prod` and run on a real device.'
    : resolvedCapacitorServerUrl === DEFAULT_SITE_URL
      ? 'Run `npm run cap:build:prod` and then open `npm run cap:ios:prod` or `npm run cap:android:prod`.'
      : 'Set CAPACITOR_SERVER_URL or use the production scripts if you want to test the Netlify deployment on a device.',
};

console.log(JSON.stringify(report, null, 2));
