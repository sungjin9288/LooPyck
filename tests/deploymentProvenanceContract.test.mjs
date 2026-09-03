import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildDeploymentProvenance,
  evaluateDeploymentPromotion,
  validateDeploymentProvenance,
} from '../scripts/deploymentProvenanceContract.mjs';

const COMMIT = 'a'.repeat(40);
const FINGERPRINT = 'b'.repeat(64);

function netlifyManifest(overrides = {}) {
  return {
    schemaVersion: 1,
    generatedAt: '2026-07-15T00:00:00.000Z',
    provider: 'netlify',
    buildEnvironment: 'netlify-hosted',
    commit: COMMIT,
    branch: 'main',
    context: 'production',
    deployId: 'deploy-123',
    runId: null,
    workspaceFingerprint: FINGERPRINT,
    dirty: false,
    ...overrides,
  };
}

function deployedEvidence(manifest = netlifyManifest(), overrides = {}) {
  const baseUrl = 'https://loo-pyck.netlify.app';
  return {
    ok: true,
    baseUrl,
    targetKind: 'deployed-environment',
    requestUrl: `${baseUrl}/deployment-provenance.json`,
    expectedCommit: COMMIT,
    commitMatchesExpected: true,
    deployment: manifest,
    ...overrides,
  };
}

function passingUat(smoke, overrides = {}) {
  return {
    ok: true,
    baseUrl: smoke.baseUrl,
    deploymentProvenance: smoke,
    steps: [{
      id: 'deployment-provenance',
      ok: true,
      parsed: smoke,
    }],
    ...overrides,
  };
}

test('build provenance prefers Netlify immutable deployment metadata', () => {
  const manifest = buildDeploymentProvenance({
    env: {
      NETLIFY: 'true',
      LOOPYCK_NETLIFY_BUILD: 'true',
      COMMIT_REF: COMMIT,
      BRANCH: 'main',
      CONTEXT: 'production',
      DEPLOY_ID: 'deploy-123',
    },
    workspace: {
      head: 'c'.repeat(40),
      branch: 'other',
      dirty: false,
      fingerprint: FINGERPRINT,
    },
    generatedAt: '2026-07-15T00:00:00.000Z',
  });

  assert.deepEqual(manifest, netlifyManifest());
});

test('local provenance records dirty workspace identity without claiming Netlify', () => {
  const manifest = buildDeploymentProvenance({
    workspace: {
      head: COMMIT,
      branch: 'main',
      dirty: true,
      fingerprint: FINGERPRINT,
    },
    generatedAt: '2026-07-15T00:00:00.000Z',
  });

  assert.equal(manifest.provider, 'local');
  assert.equal(manifest.buildEnvironment, 'local');
  assert.equal(manifest.context, 'local-build');
  assert.equal(manifest.dirty, true);
  assert.deepEqual(validateDeploymentProvenance(manifest), { ok: true, violations: [] });
});

test('Netlify CLI placeholder deploy ID is normalized without losing commit identity', () => {
  const manifest = buildDeploymentProvenance({
    env: {
      LOOPYCK_NETLIFY_BUILD: 'true',
      COMMIT_REF: COMMIT,
      BRANCH: 'main',
      CONTEXT: 'production',
      DEPLOY_ID: '0',
    },
    workspace: {
      head: COMMIT,
      branch: 'main',
      dirty: false,
      fingerprint: FINGERPRINT,
    },
    generatedAt: '2026-07-15T00:00:00.000Z',
  });

  assert.equal(manifest.provider, 'netlify');
  assert.equal(manifest.buildEnvironment, 'netlify-cli');
  assert.equal(manifest.deployId, null);
  assert.equal(manifest.runId, null);
  assert.equal(manifest.commit, COMMIT);
  assert.deepEqual(validateDeploymentProvenance(manifest), { ok: true, violations: [] });
});

test('GitHub Actions run identity is not represented as a deployment ID', () => {
  const manifest = buildDeploymentProvenance({
    env: {
      GITHUB_ACTIONS: 'true',
      GITHUB_SHA: COMMIT,
      GITHUB_REF_NAME: 'main',
      GITHUB_EVENT_NAME: 'push',
      GITHUB_RUN_ID: '123456789',
      COMMIT_REF: 'c'.repeat(40),
      BRANCH: 'contaminated-branch',
      CONTEXT: 'contaminated-context',
      DEPLOY_ID: 'contaminated-deploy',
    },
    workspace: {
      head: COMMIT,
      branch: 'main',
      dirty: false,
      fingerprint: FINGERPRINT,
    },
    generatedAt: '2026-07-15T00:00:00.000Z',
  });

  assert.equal(manifest.provider, 'github-actions');
  assert.equal(manifest.buildEnvironment, 'github-actions');
  assert.equal(manifest.commit, COMMIT);
  assert.equal(manifest.branch, 'main');
  assert.equal(manifest.context, 'push');
  assert.equal(manifest.deployId, null);
  assert.equal(manifest.runId, '123456789');
  assert.deepEqual(validateDeploymentProvenance(manifest), { ok: true, violations: [] });
});

test('provider metadata without an explicit platform signal remains local', () => {
  const manifest = buildDeploymentProvenance({
    env: {
      COMMIT_REF: 'c'.repeat(40),
      GITHUB_SHA: 'd'.repeat(40),
      BRANCH: 'spoofed-netlify-branch',
      GITHUB_REF_NAME: 'spoofed-github-branch',
      DEPLOY_ID: 'spoofed-deploy',
      GITHUB_RUN_ID: 'spoofed-run',
    },
    workspace: {
      head: COMMIT,
      branch: 'main',
      dirty: false,
      fingerprint: FINGERPRINT,
    },
    generatedAt: '2026-07-15T00:00:00.000Z',
  });

  assert.equal(manifest.provider, 'local');
  assert.equal(manifest.buildEnvironment, 'local');
  assert.equal(manifest.commit, COMMIT);
  assert.equal(manifest.branch, 'main');
  assert.equal(manifest.context, 'local-build');
  assert.equal(manifest.deployId, null);
  assert.equal(manifest.runId, null);
  assert.deepEqual(validateDeploymentProvenance(manifest), { ok: true, violations: [] });
});

test('conflicting explicit platform signals fail closed', () => {
  const manifest = buildDeploymentProvenance({
    env: {
      NETLIFY: 'true',
      GITHUB_ACTIONS: 'true',
      COMMIT_REF: COMMIT,
      GITHUB_SHA: COMMIT,
      DEPLOY_ID: 'deploy-123',
      GITHUB_RUN_ID: '123456789',
    },
    workspace: {
      head: COMMIT,
      branch: 'main',
      dirty: false,
      fingerprint: FINGERPRINT,
    },
    generatedAt: '2026-07-15T00:00:00.000Z',
  });
  const result = validateDeploymentProvenance(manifest);

  assert.equal(manifest.provider, 'ambiguous');
  assert.equal(manifest.buildEnvironment, 'ambiguous');
  assert.ok(result.violations.some(({ type }) => type === 'invalid-provider'));
  assert.ok(result.violations.some(({ type }) => type === 'invalid-build-environment'));
});

test('GitHub Actions invoking the Netlify CLI marker fails closed', () => {
  const manifest = buildDeploymentProvenance({
    env: {
      GITHUB_ACTIONS: 'true',
      LOOPYCK_NETLIFY_BUILD: 'true',
      GITHUB_SHA: COMMIT,
      GITHUB_REF_NAME: 'main',
      GITHUB_EVENT_NAME: 'push',
      GITHUB_RUN_ID: '123456789',
      COMMIT_REF: COMMIT,
      DEPLOY_ID: '0',
    },
    workspace: {
      head: COMMIT,
      branch: 'main',
      dirty: false,
      fingerprint: FINGERPRINT,
    },
    generatedAt: '2026-07-15T00:00:00.000Z',
  });
  const result = validateDeploymentProvenance(manifest);

  assert.equal(manifest.provider, 'ambiguous');
  assert.equal(manifest.buildEnvironment, 'ambiguous');
  assert.ok(result.violations.some(({ type }) => type === 'invalid-provider'));
  assert.ok(result.violations.some(({ type }) => type === 'invalid-build-environment'));
});

test('manifest validation rejects abbreviated commits and incomplete Netlify identity', () => {
  const result = validateDeploymentProvenance(netlifyManifest({
    commit: 'abc1234',
    deployId: null,
  }));

  assert.ok(result.violations.some(({ type }) => type === 'invalid-commit'));
  assert.ok(result.violations.some(({ type }) => type === 'missing-netlify-deploy-id'));
});

test('manifest validation rejects cross-provider environments and misplaced identifiers', () => {
  const result = validateDeploymentProvenance(netlifyManifest({
    provider: 'local',
    buildEnvironment: 'github-actions',
    deployId: 'deploy-123',
    runId: null,
  }));

  assert.ok(result.violations.some(({ type }) => type === 'provider-build-environment-mismatch'));
  assert.ok(result.violations.some(({ type }) => type === 'unexpected-deploy-id'));
  assert.ok(result.violations.some(({ type }) => type === 'missing-github-run-id'));
});

test('manifest validation rejects unexpected public fields without echoing their values', () => {
  const secretValue = 'do-not-echo-this-value';
  const result = validateDeploymentProvenance(netlifyManifest({
    token: secretValue,
    environment: { API_KEY: secretValue },
  }));

  assert.deepEqual(
    result.violations.filter(({ type }) => type === 'unexpected-field'),
    [
      { type: 'unexpected-field', field: 'environment' },
      { type: 'unexpected-field', field: 'token' },
    ],
  );
  assert.equal(JSON.stringify(result).includes(secretValue), false);
});

test('promotion passes only when deployed commit and provenance-linked UAT match current HEAD', () => {
  const manifest = netlifyManifest();
  const smoke = deployedEvidence(manifest);
  const result = evaluateDeploymentPromotion({
    manifest,
    smoke,
    uat: passingUat(smoke),
    currentHead: COMMIT,
  });

  assert.deepEqual(result, {
    passed: true,
    commitMatchesCurrentHead: true,
    hasProvenanceStep: true,
    smokeMatchesDeployment: true,
    uatMatchesDeployment: true,
    status: 'pass',
  });
});

test('promotion rejects stale commits, dirty manifests, and legacy UAT packets', () => {
  const staleManifest = netlifyManifest({ commit: 'c'.repeat(40) });
  const staleSmoke = deployedEvidence(staleManifest, {
    expectedCommit: COMMIT,
    commitMatchesExpected: false,
  });
  const stale = evaluateDeploymentPromotion({
    manifest: staleManifest,
    smoke: staleSmoke,
    uat: passingUat(staleSmoke),
    currentHead: COMMIT,
  });
  const dirtyManifest = netlifyManifest({ dirty: true });
  const dirtySmoke = deployedEvidence(dirtyManifest);
  const dirty = evaluateDeploymentPromotion({
    manifest: dirtyManifest,
    smoke: dirtySmoke,
    uat: passingUat(dirtySmoke),
    currentHead: COMMIT,
  });
  const currentManifest = netlifyManifest();
  const currentSmoke = deployedEvidence(currentManifest);
  const legacyUat = evaluateDeploymentPromotion({
    manifest: currentManifest,
    smoke: currentSmoke,
    uat: { ok: true, steps: [] },
    currentHead: COMMIT,
  });

  assert.equal(stale.status, 'missing or fail');
  assert.equal(dirty.status, 'missing or fail');
  assert.equal(legacyUat.hasProvenanceStep, false);
  assert.equal(legacyUat.status, 'missing or fail');
});

test('promotion rejects a passing UAT packet linked to a different deployment', () => {
  const manifest = netlifyManifest();
  const smoke = deployedEvidence(manifest);
  const staleManifest = netlifyManifest({
    generatedAt: '2026-07-14T00:00:00.000Z',
    deployId: 'deploy-previous',
  });
  const staleSmoke = deployedEvidence(staleManifest);
  const result = evaluateDeploymentPromotion({
    manifest,
    smoke,
    uat: passingUat(staleSmoke),
    currentHead: COMMIT,
  });

  assert.equal(result.commitMatchesCurrentHead, true);
  assert.equal(result.smokeMatchesDeployment, true);
  assert.equal(result.hasProvenanceStep, true);
  assert.equal(result.uatMatchesDeployment, false);
  assert.equal(result.status, 'missing or fail');
});

test('promotion rejects a passing UAT packet from a different target URL', () => {
  const manifest = netlifyManifest();
  const smoke = deployedEvidence(manifest);
  const previewBaseUrl = 'https://deploy-preview-123--loo-pyck.netlify.app';
  const previewEvidence = deployedEvidence(manifest, {
    baseUrl: previewBaseUrl,
    requestUrl: `${previewBaseUrl}/deployment-provenance.json`,
  });
  const result = evaluateDeploymentPromotion({
    manifest,
    smoke,
    uat: passingUat(previewEvidence),
    currentHead: COMMIT,
  });

  assert.equal(result.smokeMatchesDeployment, true);
  assert.equal(result.hasProvenanceStep, true);
  assert.equal(result.uatMatchesDeployment, false);
  assert.equal(result.status, 'missing or fail');
});
