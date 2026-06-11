import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const DEFAULT_ANDROID_STUDIO_PATH = '/Applications/Android Studio.app';
export const DEFAULT_ANDROID_SDK_ROOT = path.join(os.homedir(), 'Library', 'Android', 'sdk');

function existing(pathLike) {
  return Boolean(pathLike) && fs.existsSync(pathLike);
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function latestToolboxAndroidStudioApp() {
  const toolboxRoot = path.join(
    os.homedir(),
    'Library',
    'Application Support',
    'JetBrains',
    'Toolbox',
    'apps',
    'AndroidStudio'
  );

  if (!existing(toolboxRoot)) return null;

  const channels = fs.readdirSync(toolboxRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .reverse();

  for (const channel of channels) {
    const channelRoot = path.join(toolboxRoot, channel);
    const builds = fs.readdirSync(channelRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()
      .reverse();

    for (const build of builds) {
      const candidate = path.join(channelRoot, build, 'Android Studio.app');
      if (existing(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

export function commandOnPath(command, env = process.env) {
  const rawPath = env.PATH || '';
  const entries = rawPath.split(path.delimiter).filter(Boolean);
  return entries.some((entry) => existing(path.join(entry, command)));
}

export function resolveAndroidStudio(env = process.env) {
  const configuredPath = env.CAPACITOR_ANDROID_STUDIO_PATH?.trim() || null;
  const candidates = unique([
    configuredPath,
    DEFAULT_ANDROID_STUDIO_PATH,
    path.join(os.homedir(), 'Applications', 'Android Studio.app'),
    latestToolboxAndroidStudioApp(),
  ]);
  const resolvedPath = candidates.find(existing) || null;

  return {
    configuredPath,
    resolvedPath,
    available: Boolean(resolvedPath),
    candidatePaths: candidates,
  };
}

export function resolveAndroidSdk(env = process.env) {
  const candidateRoots = unique([
    env.ANDROID_HOME?.trim(),
    env.ANDROID_SDK_ROOT?.trim(),
    DEFAULT_ANDROID_SDK_ROOT,
  ]);
  const resolvedRoot = candidateRoots.find(existing) || null;
  const adbPath = resolvedRoot ? path.join(resolvedRoot, 'platform-tools', 'adb') : null;

  return {
    candidateRoots,
    resolvedRoot,
    adbPath: existing(adbPath) ? adbPath : null,
    adbOnPath: commandOnPath('adb', env),
  };
}
