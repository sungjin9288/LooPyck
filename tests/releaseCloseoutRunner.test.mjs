import assert from 'node:assert/strict';
import test from 'node:test';

import {
  executeReleaseCloseout,
  RELEASE_CLOSEOUT_STEPS,
} from '../scripts/netlifyReleaseCloseout.mjs';

function runnerWith(statuses, calls) {
  return async ({ id }) => {
    calls.push(id);
    const status = statuses[id];
    if (status instanceof Error) throw status;
    return { exitCode: status ?? 0 };
  };
}

test('closeout runs UAT, runtime readiness, and report in fixed order', async () => {
  const calls = [];
  const result = await executeReleaseCloseout(runnerWith({}, calls));

  assert.deepEqual(calls, RELEASE_CLOSEOUT_STEPS.map(({ id }) => id));
  assert.equal(result.ok, true);
  assert.ok(result.steps.every(({ ok }) => ok));
});

test('UAT failure does not skip runtime readiness or release report', async () => {
  const calls = [];
  const result = await executeReleaseCloseout(runnerWith({ 'netlify-uat': 1 }, calls));

  assert.deepEqual(calls, RELEASE_CLOSEOUT_STEPS.map(({ id }) => id));
  assert.equal(result.ok, false);
  assert.deepEqual(result.steps.map(({ exitCode }) => exitCode), [1, 0, 0]);
});

test('runtime failure still generates the release report and preserves failure', async () => {
  const calls = [];
  const result = await executeReleaseCloseout(runnerWith({
    'runtime-readiness': new Error('runtime unavailable'),
  }, calls));

  assert.deepEqual(calls, RELEASE_CLOSEOUT_STEPS.map(({ id }) => id));
  assert.equal(result.ok, false);
  assert.equal(result.steps[1].failure, 'runtime unavailable');
  assert.equal(result.steps[2].ok, true);
});

test('report failure returns non-zero outcome after prior evidence steps complete', async () => {
  const calls = [];
  const result = await executeReleaseCloseout(runnerWith({ 'release-report': 2 }, calls));

  assert.deepEqual(calls, RELEASE_CLOSEOUT_STEPS.map(({ id }) => id));
  assert.equal(result.ok, false);
  assert.deepEqual(result.steps.map(({ exitCode }) => exitCode), [0, 0, 2]);
});
