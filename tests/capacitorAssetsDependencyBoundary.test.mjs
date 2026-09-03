import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const toolPackage = JSON.parse(
  fs.readFileSync('tools/capacitor-assets/package.json', 'utf8'),
);
const toolLock = JSON.parse(
  fs.readFileSync('tools/capacitor-assets/package-lock.json', 'utf8'),
);
const runnerSource = fs.readFileSync('scripts/runCapacitorAssets.mjs', 'utf8');
const gitignore = fs.readFileSync('.gitignore', 'utf8');

test('Capacitor asset generator is excluded from the root dependency graph', () => {
  assert.equal(packageJson.dependencies['@capacitor/assets'], undefined);
  assert.equal(packageJson.devDependencies['@capacitor/assets'], undefined);
});

test('root scripts expose explicit setup and pinned-tool execution', () => {
  assert.equal(
    packageJson.scripts['cap:assets:setup'],
    'npm ci --prefix tools/capacitor-assets',
  );
  assert.match(packageJson.scripts['cap:assets'], /scripts\/runCapacitorAssets\.mjs generate/);
});

test('isolated tool package and lock pin the approved generator version', () => {
  assert.equal(toolPackage.private, true);
  assert.equal(toolPackage.dependencies['@capacitor/assets'], '3.0.5');
  assert.equal(toolLock.packages[''].dependencies['@capacitor/assets'], '3.0.5');
  assert.equal(toolLock.packages['node_modules/@capacitor/assets'].version, '3.0.5');
});

test('asset runner preserves root cwd and requires explicit setup', () => {
  assert.match(runnerSource, /cwd: workspaceRoot/);
  assert.match(runnerSource, /npm run cap:assets:setup/);
  assert.doesNotMatch(runnerSource, /\bnpx\b|npm install|npm ci/);
});

test('isolated tool dependencies stay outside the release candidate', () => {
  assert.match(gitignore, /^\/tools\/capacitor-assets\/node_modules\/$/m);
});
