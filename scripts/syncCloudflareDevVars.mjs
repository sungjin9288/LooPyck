import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const sourcePath = resolve('.env.local');
const targetPath = resolve('.dev.vars');

if (!existsSync(sourcePath)) {
    console.error('Missing .env.local. Create it before syncing Cloudflare preview vars.');
    process.exit(1);
}

const source = readFileSync(sourcePath, 'utf8');
const lines = source
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.trim().startsWith('#'));

const normalized = new Map();

for (const line of lines) {
    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1);
    if (!key) continue;
    normalized.set(key, value);
}

normalized.set('NEXTJS_ENV', 'development');

const output = [
    '# Generated from .env.local by npm run cf:sync-vars',
    '# Do not commit this file.',
    ...Array.from(normalized.entries()).map(([key, value]) => `${key}=${value}`),
    '',
].join('\n');

writeFileSync(targetPath, output, 'utf8');
console.log(`Wrote ${normalized.size} variables to ${targetPath}`);
