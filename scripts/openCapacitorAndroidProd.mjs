import path from 'node:path';
import { spawn } from 'node:child_process';
import { resolveAndroidSdk, resolveAndroidStudio } from './capacitorAndroidEnv.mjs';

const PROD_URL = 'https://loo-pyck.netlify.app';

const studio = resolveAndroidStudio();
const sdk = resolveAndroidSdk();

if (!studio.available) {
  console.error(JSON.stringify({
    error: 'Android Studio not found',
    nextStep: 'Install Android Studio or set CAPACITOR_ANDROID_STUDIO_PATH before running `npm run cap:android:prod`.',
    checkedPaths: studio.candidatePaths,
    adbOnPath: sdk.adbOnPath,
    adbSdkPath: sdk.adbPath,
  }, null, 2));
  process.exit(1);
}

const env = {
  ...process.env,
  CAPACITOR_SERVER_URL: PROD_URL,
  NEXT_PUBLIC_SITE_URL: PROD_URL,
  SITE_URL: PROD_URL,
  CAPACITOR_ANDROID_STUDIO_PATH: studio.resolvedPath,
};

if (!sdk.adbOnPath && sdk.adbPath) {
  env.PATH = `${path.dirname(sdk.adbPath)}${path.delimiter}${env.PATH || ''}`;
}

console.error(`[cap:android:prod] Android Studio -> ${studio.resolvedPath}`);
if (sdk.adbOnPath) {
  console.error('[cap:android:prod] adb -> PATH');
} else if (sdk.adbPath) {
  console.error(`[cap:android:prod] adb -> ${sdk.adbPath}`);
} else {
  console.error('[cap:android:prod] adb -> not found');
}

const child = spawn('npx', ['cap', 'open', 'android'], {
  stdio: 'inherit',
  env,
});

child.on('exit', (code) => {
  process.exit(code ?? 1);
});

child.on('error', (error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
