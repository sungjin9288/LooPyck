import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const scriptsDir = path.join(process.cwd(), 'scripts');

test('Playwright CLI run-code receives a page function instead of a raw statement', () => {
  const shellScripts = fs.readdirSync(scriptsDir)
    .filter((name) => name.endsWith('.sh'))
    .sort();
  const invalidInvocations = [];
  let invocationCount = 0;

  for (const name of shellScripts) {
    const source = fs.readFileSync(path.join(scriptsDir, name), 'utf8');
    const invocations = source.matchAll(/pw run-code "\s*([^\s"]+)/g);

    for (const match of invocations) {
      invocationCount += 1;
      if (match[1] !== 'async' && match[1] !== '(page)') {
        invalidInvocations.push(`${name}: ${match[1]}`);
      }
    }
  }

  assert.ok(invocationCount > 0, 'expected at least one pw run-code invocation');
  assert.deepEqual(invalidInvocations, []);
});
