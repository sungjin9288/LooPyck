import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const tossShareSource = fs.readFileSync('lib/native/tossShare.ts', 'utf8');
const graniteConfigSource = fs.readFileSync('granite.config.ts', 'utf8');

test('Apps in Toss runtime uses the focused bridge packages', () => {
  assert.equal(packageJson.dependencies['@apps-in-toss/web-bridge'], '^2.10.6');
  assert.equal(packageJson.dependencies['@apps-in-toss/bridge-core'], '^2.10.6');
  assert.equal(packageJson.dependencies['@apps-in-toss/web-framework'], undefined);
});

test('Apps in Toss build framework remains dev-only', () => {
  assert.equal(packageJson.devDependencies['@apps-in-toss/web-framework'], '^2.10.6');
  assert.match(graniteConfigSource, /@apps-in-toss\/web-framework\/config/);
});

test('Toss share runtime imports the focused web bridge', () => {
  assert.match(tossShareSource, /import\(['"]@apps-in-toss\/web-bridge['"]\)/);
  assert.doesNotMatch(tossShareSource, /import\(['"]@apps-in-toss\/web-framework['"]\)/);
});

test('focused bridge API resolves with a clean dependency graph', async () => {
  const bridge = await import('@apps-in-toss/web-bridge');
  assert.equal(typeof bridge.share, 'function');
});
