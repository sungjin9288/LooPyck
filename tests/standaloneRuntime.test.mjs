import assert from 'node:assert/strict';
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { prepareStandaloneRuntime } from '../scripts/prepareStandaloneRuntime.mjs';
import { assertStandaloneRuntime, parseStandalonePort } from '../scripts/startStandalone.mjs';

function createWorkspaceFixture() {
  const workspace = mkdtempSync(path.join(os.tmpdir(), 'loopyck-standalone-'));
  mkdirSync(path.join(workspace, '.next', 'standalone'), { recursive: true });
  mkdirSync(path.join(workspace, '.next', 'static', 'chunks'), { recursive: true });
  mkdirSync(path.join(workspace, 'public'), { recursive: true });
  writeFileSync(path.join(workspace, '.next', 'standalone', 'server.js'), 'server');
  writeFileSync(path.join(workspace, '.next', 'static', 'chunks', 'app.js'), 'chunk');
  writeFileSync(path.join(workspace, 'public', 'deployment-provenance.json'), '{}');
  return workspace;
}

test('standalone port parser accepts explicit flags and environment fallback', () => {
  assert.equal(parseStandalonePort(['--port', '3210'], {}), 3210);
  assert.equal(parseStandalonePort(['--port=3211'], {}), 3211);
  assert.equal(parseStandalonePort([], { PORT: '4321' }), 4321);
  assert.equal(parseStandalonePort([], {}), 3000);
});

test('standalone port parser rejects malformed and out-of-range ports', () => {
  assert.throws(() => parseStandalonePort(['--port', '3000abc'], {}), /invalid_standalone_port/);
  assert.throws(() => parseStandalonePort(['--port', '0'], {}), /invalid_standalone_port/);
  assert.throws(() => parseStandalonePort(['--port', '65536'], {}), /invalid_standalone_port/);
});

test('standalone preparation copies public and static assets deterministically', async (context) => {
  const workspace = createWorkspaceFixture();
  context.after(() => rmSync(workspace, { recursive: true, force: true }));
  const stalePath = path.join(workspace, '.next', 'standalone', 'public', 'stale.txt');
  mkdirSync(path.dirname(stalePath), { recursive: true });
  writeFileSync(stalePath, 'stale');

  await prepareStandaloneRuntime(workspace);
  const runtime = assertStandaloneRuntime(workspace);

  assert.equal(existsSync(stalePath), false);
  assert.equal(readFileSync(path.join(runtime.copies[0].destination, 'deployment-provenance.json'), 'utf8'), '{}');
  assert.equal(readFileSync(path.join(runtime.copies[1].destination, 'chunks', 'app.js'), 'utf8'), 'chunk');
});

test('all production runtime entrypoints use the shared standalone launcher', () => {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  const stressRunner = readFileSync('scripts/localSystemStressSmoke.mjs', 'utf8');
  const playwrightConfig = readFileSync('playwright.config.ts', 'utf8');

  assert.match(packageJson.scripts.build, /prepareStandaloneRuntime\.mjs/);
  assert.match(packageJson.scripts.start, /startStandalone\.mjs/);
  assert.match(stressRunner, /startStandalone\.mjs/);
  assert.doesNotMatch(stressRunner, /nextBin/);
  assert.match(playwrightConfig, /startStandalone\.mjs --port 3210/);
  assert.doesNotMatch(playwrightConfig, /next start --port 3210/);
});
