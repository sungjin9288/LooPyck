import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildSystemStressRunnerIdentity,
  evaluateSystemStressBuildProvenance,
  evaluateSystemStressRun,
} from '../scripts/systemStressContract.mjs';

const COMMIT = 'a'.repeat(40);
const FINGERPRINT = 'b'.repeat(64);

function localBuildManifest(overrides = {}) {
  return {
    schemaVersion: 1,
    generatedAt: '2026-07-15T00:00:00.000Z',
    provider: 'local',
    buildEnvironment: 'local',
    commit: COMMIT,
    branch: 'main',
    context: 'local-build',
    deployId: null,
    runId: null,
    workspaceFingerprint: FINGERPRINT,
    dirty: true,
    ...overrides,
  };
}

const runnerWorkspace = {
  head: COMMIT,
  fingerprint: FINGERPRINT,
  dirty: true,
};
const localRunnerIdentity = {
  buildEnvironment: 'local',
  runId: null,
};

function passingRun() {
  return {
    concurrency: 100,
    results: Array.from({ length: 100 }, (_, index) => ({
      passed: true,
      latencyMs: 100 + index,
    })),
    memory: {
      rssBeforeMb: 120,
      rssPeakMb: 180,
      rssAfterMb: 150,
    },
  };
}

test('system stress passes with 100 concurrent contract-valid requests and bounded RSS growth', () => {
  assert.deepEqual(evaluateSystemStressRun(passingRun()), {
    ok: true,
    totalRequests: 100,
    passedRequests: 100,
    failedRequests: 0,
    successRate: 1,
    p95LatencyMs: 194,
    rssGrowthMb: 60,
    failures: [],
  });
});

test('system stress rejects a success rate below 98 percent', () => {
  const run = passingRun();
  run.results.slice(0, 3).forEach((result) => { result.passed = false; });

  assert.ok(evaluateSystemStressRun(run).failures.includes('success_rate_below_0.98'));
});

test('system stress requires the full request and concurrency scope', () => {
  const run = passingRun();
  run.results = run.results.slice(0, 99);
  run.concurrency = 20;
  const result = evaluateSystemStressRun(run);

  assert.ok(result.failures.includes('request_count_below_100'));
  assert.ok(result.failures.includes('concurrency_below_100'));
});

test('system stress rejects missing or excessive server memory evidence', () => {
  const missing = passingRun();
  missing.memory.rssPeakMb = undefined;
  const excessive = passingRun();
  excessive.memory.rssPeakMb = 313;

  assert.ok(evaluateSystemStressRun(missing).failures.includes('server_memory_evidence_missing'));
  assert.ok(evaluateSystemStressRun(excessive).failures.includes('rss_growth_above_192mb'));
});

test('system stress accepts a valid local build manifest linked to the runner workspace', () => {
  assert.deepEqual(
    evaluateSystemStressBuildProvenance(localBuildManifest(), runnerWorkspace),
    { ok: false, violations: [{ type: 'invalid-stress-runner-build-environment' }] },
  );
  assert.deepEqual(
    evaluateSystemStressBuildProvenance(
      localBuildManifest(),
      runnerWorkspace,
      localRunnerIdentity,
    ),
    { ok: true, violations: [] },
  );
});

test('system stress rejects malformed or hosted deployment manifests', () => {
  const malformed = evaluateSystemStressBuildProvenance(
    { schemaVersion: 1 },
    runnerWorkspace,
    localRunnerIdentity,
  );
  const hosted = evaluateSystemStressBuildProvenance(localBuildManifest({
    provider: 'netlify',
    buildEnvironment: 'netlify-hosted',
    deployId: 'deploy-123',
  }), runnerWorkspace, localRunnerIdentity);

  assert.ok(malformed.violations.some(({ type }) => type === 'invalid-commit'));
  assert.ok(hosted.violations.some(({ type }) => (
    type === 'unsupported-local-stress-build-environment'
  )));
});

test('system stress rejects build identity drift from the runner workspace', () => {
  const result = evaluateSystemStressBuildProvenance(localBuildManifest({
    commit: 'c'.repeat(40),
    workspaceFingerprint: 'd'.repeat(64),
    dirty: false,
  }), runnerWorkspace, localRunnerIdentity);

  assert.deepEqual(result.violations.map(({ type }) => type), [
    'build-commit-runner-mismatch',
    'build-workspace-fingerprint-runner-mismatch',
    'build-dirty-state-runner-mismatch',
  ]);
});

test('system stress runner identity exposes only local or GitHub Actions run metadata', () => {
  assert.deepEqual(buildSystemStressRunnerIdentity({}), localRunnerIdentity);
  assert.deepEqual(buildSystemStressRunnerIdentity({
    GITHUB_ACTIONS: 'true',
    GITHUB_RUN_ID: ' 123456 ',
    TOKEN: 'must-not-leak',
  }), {
    buildEnvironment: 'github-actions',
    runId: '123456',
  });
});

test('system stress accepts a GitHub Actions manifest only for the same runner run ID', () => {
  const manifest = localBuildManifest({
    provider: 'github-actions',
    buildEnvironment: 'github-actions',
    context: 'push',
    runId: 'run-123',
    dirty: false,
  });
  const cleanRunnerWorkspace = { ...runnerWorkspace, dirty: false };

  assert.deepEqual(
    evaluateSystemStressBuildProvenance(manifest, cleanRunnerWorkspace, {
      buildEnvironment: 'github-actions',
      runId: 'run-123',
    }),
    { ok: true, violations: [] },
  );
  assert.ok(evaluateSystemStressBuildProvenance(manifest, cleanRunnerWorkspace, {
    buildEnvironment: 'github-actions',
    runId: 'stale-run',
  }).violations.some(({ type }) => type === 'build-runner-run-id-mismatch'));
});

test('system stress rejects cross-environment local and GitHub Actions manifests', () => {
  const githubManifest = localBuildManifest({
    provider: 'github-actions',
    buildEnvironment: 'github-actions',
    context: 'push',
    runId: 'run-123',
    dirty: false,
  });
  const cleanRunnerWorkspace = { ...runnerWorkspace, dirty: false };
  const githubRunner = { buildEnvironment: 'github-actions', runId: 'run-123' };

  assert.ok(evaluateSystemStressBuildProvenance(
    githubManifest,
    cleanRunnerWorkspace,
    localRunnerIdentity,
  ).violations.some(({ type }) => type === 'build-runner-environment-mismatch'));
  assert.ok(evaluateSystemStressBuildProvenance(
    localBuildManifest({ dirty: false }),
    cleanRunnerWorkspace,
    githubRunner,
  ).violations.some(({ type }) => type === 'build-runner-environment-mismatch'));
});
