import assert from 'node:assert/strict';
import test from 'node:test';

import {
  evaluateDeployedReleaseEvidence,
  evaluateLocalDirectSourceEvidence,
  evaluateLocalDemoEvidence,
  evaluateLocalReleaseEvidence,
  evaluateLocalSearchQualityEvidence,
  evaluateLocalSystemStressEvidence,
  evaluatePortfolioClaimEvidence,
  evaluateGroupingQualityEvidence,
  evaluateCiWorkflowEvidence,
  evaluateDependencyAuditEvidence,
} from '../scripts/releaseEvidenceProvenance.mjs';

const COMMIT = 'a'.repeat(40);
const FINGERPRINT_A = 'b'.repeat(64);
const FINGERPRINT_B = 'c'.repeat(64);

function passingSummary(
  fingerprint = FINGERPRINT_A,
  targetKind = 'local-working-tree',
) {
  const isLocal = targetKind === 'local-working-tree';
  const baseUrl = isLocal
    ? 'http://localhost:3100'
    : 'https://loo-pyck.netlify.app';
  const runnerWorkspace = { head: COMMIT, fingerprint };
  const deployment = {
    schemaVersion: 1,
    generatedAt: '2026-07-15T00:00:00.000Z',
    provider: isLocal ? 'local' : 'netlify',
    buildEnvironment: isLocal ? 'local' : 'netlify-hosted',
    commit: COMMIT,
    branch: 'main',
    context: isLocal ? 'local-build' : 'production',
    deployId: isLocal ? null : 'deploy-123',
    runId: null,
    workspaceFingerprint: fingerprint,
    dirty: isLocal,
  };
  const deploymentProvenance = {
    ok: true,
    baseUrl,
    targetKind,
    requestUrl: `${baseUrl}/deployment-provenance.json`,
    expectedCommit: COMMIT,
    commitMatchesExpected: true,
    deployment,
    runnerWorkspace,
  };

  return {
    baseUrl,
    targetKind,
    runnerWorkspace,
    deploymentProvenance,
    searchDisplayedCount: 12,
    detailPage: {
      hasCompareIntro: true,
      hasCompareSection: true,
      hasPriceHistorySection: true,
      hasCleanVariantIdentity: true,
    },
    favorites: {
      hasLookbookHeader: true,
      hasSavedSummary: true,
    },
    screenshots: {
      enabled: true,
      mainSearch: '/tmp/main.png',
      searchResults: '/tmp/search.png',
      detailCompare: '/tmp/detail.png',
      favorites: '/tmp/favorites.png',
    },
  };
}

test('local release evidence passes only when its fingerprint matches the current workspace', () => {
  assert.deepEqual(
    evaluateLocalReleaseEvidence(passingSummary(), { fingerprint: FINGERPRINT_A }),
    { passed: true, matchesWorkspace: true, status: 'pass' },
  );
});

test('successful local smoke is stale after the workspace fingerprint changes', () => {
  assert.deepEqual(
    evaluateLocalReleaseEvidence(passingSummary(), { fingerprint: FINGERPRINT_B }),
    { passed: true, matchesWorkspace: false, status: 'stale' },
  );
});

test('missing required release signals cannot cover the working tree', () => {
  const incomplete = passingSummary();
  incomplete.detailPage.hasCompareSection = false;

  assert.deepEqual(
    evaluateLocalReleaseEvidence(incomplete, { fingerprint: FINGERPRINT_A }),
    { passed: false, matchesWorkspace: false, status: 'missing or fail' },
  );
  assert.deepEqual(
    evaluateLocalReleaseEvidence(null, { fingerprint: FINGERPRINT_A }),
    { passed: false, matchesWorkspace: false, status: 'missing or fail' },
  );
});

test('deployed release evidence requires a deployed target and clean variant identity', () => {
  const deployed = passingSummary(FINGERPRINT_A, 'deployed-environment');

  assert.deepEqual(
    evaluateDeployedReleaseEvidence(deployed),
    { passed: true, status: 'pass' },
  );

  deployed.detailPage.hasCleanVariantIdentity = false;
  assert.deepEqual(
    evaluateDeployedReleaseEvidence(deployed),
    { passed: false, status: 'missing or fail' },
  );
});

test('legacy release QA without embedded provenance cannot pass', () => {
  const legacy = passingSummary();
  delete legacy.deploymentProvenance;

  assert.equal(
    evaluateLocalReleaseEvidence(legacy, { fingerprint: FINGERPRINT_A }).status,
    'missing or fail',
  );
  assert.equal(
    evaluateLocalDemoEvidence(legacy, { fingerprint: FINGERPRINT_A }, () => true).status,
    'missing or fail',
  );
});

test('local release QA rejects a manifest linked to a different workspace', () => {
  const mismatched = passingSummary();
  mismatched.deploymentProvenance.deployment.workspaceFingerprint = FINGERPRINT_B;

  assert.equal(
    evaluateLocalReleaseEvidence(mismatched, { fingerprint: FINGERPRINT_A }).status,
    'missing or fail',
  );
});

test('deployed release QA rejects a dirty deployment manifest', () => {
  const deployed = passingSummary(FINGERPRINT_A, 'deployed-environment');
  deployed.deploymentProvenance.deployment.dirty = true;

  assert.deepEqual(
    evaluateDeployedReleaseEvidence(deployed),
    { passed: false, status: 'missing or fail' },
  );
});

test('local demo evidence requires four existing screenshots linked to the current fingerprint', () => {
  const result = evaluateLocalDemoEvidence(
    passingSummary(),
    { fingerprint: FINGERPRINT_A },
    () => true,
  );

  assert.equal(result.passed, true);
  assert.equal(result.matchesWorkspace, true);
  assert.equal(result.status, 'pass');
  assert.equal(result.screenshotPaths.length, 4);
});

test('local demo evidence rejects missing files and marks changed workspaces stale', () => {
  const summary = passingSummary();
  const missingFile = evaluateLocalDemoEvidence(
    summary,
    { fingerprint: FINGERPRINT_A },
    (filePath) => filePath !== '/tmp/detail.png',
  );
  const stale = evaluateLocalDemoEvidence(
    summary,
    { fingerprint: FINGERPRINT_B },
    () => true,
  );

  assert.equal(missingFile.status, 'missing or fail');
  assert.equal(stale.status, 'stale');
});

function passingDirectSourceSummary(fingerprint = 'workspace-a') {
  return {
    ok: true,
    targetKind: 'local-working-tree',
    runnerWorkspace: { fingerprint },
    status: 200,
    fallbackMode: 'full',
    directSourceCount: 9,
    requiredSources: ['SSF', 'HANDSOME', 'EQL', 'LFMALL'].map((source) => ({
      source,
      present: true,
      attempted: true,
      strategy: 'direct',
      directCount: 10,
      passed: true,
    })),
  };
}

function passingSearchQualitySummary(
  fingerprint = FINGERPRINT_A,
  generatedAt = '2026-09-03T06:00:00.000Z',
) {
  const baseUrl = 'http://localhost:3211';
  const runnerWorkspace = {
    head: COMMIT,
    branch: 'main',
    dirty: true,
    changedFileCount: 12,
    fingerprint,
  };
  const deployment = {
    schemaVersion: 1,
    generatedAt: '2026-09-03T05:55:00.000Z',
    provider: 'local',
    buildEnvironment: 'local',
    commit: COMMIT,
    branch: 'main',
    context: 'local-build',
    deployId: null,
    runId: null,
    workspaceFingerprint: fingerprint,
    dirty: true,
  };

  return {
    schemaVersion: 1,
    generatedAt,
    baseUrl,
    targetKind: 'local-working-tree',
    runnerWorkspace,
    deploymentProvenance: {
      ok: true,
      generatedAt: '2026-09-03T05:59:00.000Z',
      baseUrl,
      targetKind: 'local-working-tree',
      requestUrl: `${baseUrl}/deployment-provenance.json`,
      expectedCommit: COMMIT,
      commitMatchesExpected: true,
      responseStatus: 200,
      contentType: 'application/json',
      deployment,
      violations: [],
      failure: null,
      runnerWorkspace,
    },
    target: {
      baseUrl,
      diagnosticsGeneratedAt: '2026-09-03T05:59:30.000Z',
      diagnosticsLastUpdatedAt: '2026-09-03T05:58:00.000Z',
      storage: 'firestore',
    },
    evidenceBoundary: {
      privacyBoundary: 'Recent queries, product identities, opened brands, alert data, and admin identity are excluded.',
      runnerWorkspace,
      deploymentProvenanceClaimed: true,
      note: 'The diagnostics snapshot and served deployment are linked to this report.',
    },
    observation: {
      status: 'watch',
      minimumDirectionalImpressions: 30,
      trackedSearches: 120,
      interactionCount: 80,
      quality: {},
      badgeCohorts: [],
      sourceHealth: {
        failing: 1,
        degraded: 0,
        healthy: 9,
        disabled: 2,
        other: 0,
        failingSources: [{ source: 'EXAMPLE', reason: 'fixture' }],
      },
      actions: [],
    },
  };
}

test('local search-quality evidence accepts a current provenance-linked watch observation', () => {
  assert.deepEqual(
    evaluateLocalSearchQualityEvidence(
      passingSearchQualitySummary(),
      { fingerprint: FINGERPRINT_A },
      Date.parse('2026-09-03T06:05:00.000Z'),
    ),
    {
      passed: true,
      matchesWorkspace: true,
      fresh: true,
      status: 'pass',
      observationStatus: 'watch',
      trackedSearches: 120,
      interactionCount: 80,
      failingSourceCount: 1,
      disabledSourceCount: 2,
    },
  );
});

test('local search-quality evidence becomes stale after workspace changes', () => {
  assert.equal(
    evaluateLocalSearchQualityEvidence(
      passingSearchQualitySummary(),
      { fingerprint: FINGERPRINT_B },
      Date.parse('2026-09-03T06:05:00.000Z'),
    ).status,
    'stale',
  );
});

test('local search-quality evidence rejects an observation older than 24 hours', () => {
  const summary = passingSearchQualitySummary(FINGERPRINT_A, '2026-09-01T06:00:00.000Z');
  summary.target.diagnosticsGeneratedAt = '2026-09-01T05:59:30.000Z';

  const result = evaluateLocalSearchQualityEvidence(
    summary,
    { fingerprint: FINGERPRINT_A },
    Date.parse('2026-09-03T06:05:00.000Z'),
  );

  assert.equal(result.fresh, false);
  assert.equal(result.status, 'stale');
});

test('local search-quality evidence rejects legacy provenance and sample-floor drift', () => {
  const legacy = passingSearchQualitySummary();
  delete legacy.deploymentProvenance;
  const loweredFloor = passingSearchQualitySummary();
  loweredFloor.observation.minimumDirectionalImpressions = 1;

  assert.equal(
    evaluateLocalSearchQualityEvidence(
      legacy,
      { fingerprint: FINGERPRINT_A },
      Date.parse('2026-09-03T06:05:00.000Z'),
    ).status,
    'missing or fail',
  );
  assert.equal(
    evaluateLocalSearchQualityEvidence(
      loweredFloor,
      { fingerprint: FINGERPRINT_A },
      Date.parse('2026-09-03T06:05:00.000Z'),
    ).status,
    'missing or fail',
  );
});

test('local direct-source evidence passes only for direct hits from the current workspace', () => {
  assert.deepEqual(
    evaluateLocalDirectSourceEvidence(
      passingDirectSourceSummary(),
      { fingerprint: 'workspace-a' },
    ),
    {
      passed: true,
      matchesWorkspace: true,
      status: 'pass',
      requiredSourceCount: 4,
    },
  );
});

test('local direct-source evidence becomes stale after workspace changes', () => {
  assert.equal(
    evaluateLocalDirectSourceEvidence(
      passingDirectSourceSummary(),
      { fingerprint: 'workspace-b' },
    ).status,
    'stale',
  );
});

test('local direct-source evidence fails when a required source falls back', () => {
  const summary = passingDirectSourceSummary();
  summary.requiredSources[2].strategy = 'fallback';
  summary.requiredSources[2].passed = false;

  assert.equal(
    evaluateLocalDirectSourceEvidence(summary, { fingerprint: 'workspace-a' }).status,
    'missing or fail',
  );
});

const SYSTEM_STRESS_FINGERPRINT_A = 'a'.repeat(64);
const SYSTEM_STRESS_FINGERPRINT_B = 'b'.repeat(64);

function passingSystemStressSummary(fingerprint = SYSTEM_STRESS_FINGERPRINT_A) {
  const commit = 'a'.repeat(40);
  return {
    ok: true,
    targetKind: 'local-production-build',
    baseUrl: 'http://127.0.0.1:3211',
    runnerWorkspace: { head: commit, fingerprint, dirty: true },
    runnerIdentity: { buildEnvironment: 'local', runId: null },
    buildProvenance: {
      ok: true,
      requestUrl: 'http://127.0.0.1:3211/deployment-provenance.json',
      responseStatus: 200,
      deployment: {
        schemaVersion: 1,
        generatedAt: '2026-07-15T00:00:00.000Z',
        provider: 'local',
        buildEnvironment: 'local',
        commit,
        branch: 'main',
        context: 'local-build',
        deployId: null,
        runId: null,
        workspaceFingerprint: fingerprint,
        dirty: true,
      },
    },
    configuration: { totalRequests: 100, concurrency: 100 },
    evaluation: {
      passedRequests: 100,
      successRate: 1,
      p95LatencyMs: 180,
      rssGrowthMb: 90,
      failures: [],
    },
  };
}

test('local system stress evidence passes only for the current workspace', () => {
  assert.deepEqual(
    evaluateLocalSystemStressEvidence(
      passingSystemStressSummary(),
      { fingerprint: SYSTEM_STRESS_FINGERPRINT_A },
    ),
    { passed: true, matchesWorkspace: true, status: 'pass' },
  );
});

test('local system stress evidence becomes stale after workspace changes', () => {
  assert.equal(
    evaluateLocalSystemStressEvidence(
      passingSystemStressSummary(),
      { fingerprint: SYSTEM_STRESS_FINGERPRINT_B },
    ).status,
    'stale',
  );
});

test('local system stress evidence rejects an incomplete or failed run', () => {
  const summary = passingSystemStressSummary();
  summary.configuration.concurrency = 50;
  summary.evaluation.failures = ['concurrency_below_100'];

  assert.equal(
    evaluateLocalSystemStressEvidence(
      summary,
      { fingerprint: SYSTEM_STRESS_FINGERPRINT_A },
    ).status,
    'missing or fail',
  );
});

test('local system stress evidence rejects legacy, missing, or mismatched build identity', () => {
  const legacy = passingSystemStressSummary();
  delete legacy.runnerIdentity;
  const missing = passingSystemStressSummary();
  delete missing.buildProvenance;
  const mismatched = passingSystemStressSummary();
  mismatched.buildProvenance.deployment.workspaceFingerprint = SYSTEM_STRESS_FINGERPRINT_B;

  assert.equal(
    evaluateLocalSystemStressEvidence(
      legacy,
      { fingerprint: SYSTEM_STRESS_FINGERPRINT_A },
    ).status,
    'missing or fail',
  );
  assert.equal(
    evaluateLocalSystemStressEvidence(
      missing,
      { fingerprint: SYSTEM_STRESS_FINGERPRINT_A },
    ).status,
    'missing or fail',
  );
  assert.equal(
    evaluateLocalSystemStressEvidence(
      mismatched,
      { fingerprint: SYSTEM_STRESS_FINGERPRINT_A },
    ).status,
    'missing or fail',
  );
});

function passingPortfolioClaimSummary(fingerprint = 'workspace-a') {
  return {
    ok: true,
    runnerWorkspace: { fingerprint },
    currentDocumentCount: 9,
    legacyDocumentCount: 9,
    violations: [],
  };
}

test('portfolio claim evidence passes only for the current workspace', () => {
  assert.deepEqual(
    evaluatePortfolioClaimEvidence(
      passingPortfolioClaimSummary(),
      { fingerprint: 'workspace-a' },
    ),
    { passed: true, matchesWorkspace: true, status: 'pass' },
  );
});

test('portfolio claim evidence becomes stale after workspace changes', () => {
  assert.equal(
    evaluatePortfolioClaimEvidence(
      passingPortfolioClaimSummary(),
      { fingerprint: 'workspace-b' },
    ).status,
    'stale',
  );
});

test('portfolio claim evidence rejects reported violations', () => {
  const summary = passingPortfolioClaimSummary();
  summary.ok = false;
  summary.violations = [{ type: 'forbidden-current-claim' }];

  assert.equal(
    evaluatePortfolioClaimEvidence(summary, { fingerprint: 'workspace-a' }).status,
    'missing or fail',
  );
});

function passingGroupingQualitySummary(fingerprint = 'workspace-a') {
  return {
    schemaVersion: 1,
    ok: true,
    runnerWorkspace: { fingerprint },
    thresholds: {
      minimumSamples: 12,
      minimumPositivePairs: 3,
      minimumPrecision: 0.9,
      minimumRecall: 0.9,
      minimumF1: 0.9,
    },
    sampleCount: 12,
    expectedPositivePairs: 3,
    precision: 1,
    recall: 1,
    f1: 1,
    violations: [],
  };
}

test('grouping quality evidence passes only for the current workspace', () => {
  assert.deepEqual(
    evaluateGroupingQualityEvidence(
      passingGroupingQualitySummary(),
      { fingerprint: 'workspace-a' },
    ),
    { passed: true, matchesWorkspace: true, status: 'pass' },
  );
});

test('grouping quality evidence becomes stale after workspace changes', () => {
  assert.equal(
    evaluateGroupingQualityEvidence(
      passingGroupingQualitySummary(),
      { fingerprint: 'workspace-b' },
    ).status,
    'stale',
  );
});

test('grouping quality evidence rejects a threshold violation', () => {
  const summary = passingGroupingQualitySummary();
  summary.ok = false;
  summary.recall = 0.6667;
  summary.violations = ['recall-below-threshold'];

  assert.equal(
    evaluateGroupingQualityEvidence(summary, { fingerprint: 'workspace-a' }).status,
    'missing or fail',
  );
});

test('grouping quality evidence rejects lowered artifact thresholds', () => {
  const summary = passingGroupingQualitySummary();
  summary.thresholds.minimumRecall = 0.5;
  summary.recall = 0.6;

  assert.equal(
    evaluateGroupingQualityEvidence(summary, { fingerprint: 'workspace-a' }).status,
    'missing or fail',
  );
});

function passingCiWorkflowSummary(fingerprint = 'workspace-a') {
  return {
    ok: true,
    runnerWorkspace: { fingerprint },
    workflowPath: '.github/workflows/deploy.yml',
    violations: [],
  };
}

test('CI workflow evidence passes only for the current workspace', () => {
  assert.deepEqual(
    evaluateCiWorkflowEvidence(
      passingCiWorkflowSummary(),
      { fingerprint: 'workspace-a' },
    ),
    { passed: true, matchesWorkspace: true, status: 'pass' },
  );
});

test('CI workflow evidence becomes stale after workspace changes', () => {
  assert.equal(
    evaluateCiWorkflowEvidence(
      passingCiWorkflowSummary(),
      { fingerprint: 'workspace-b' },
    ).status,
    'stale',
  );
});

test('CI workflow evidence rejects a non-passing audit', () => {
  const summary = passingCiWorkflowSummary();
  summary.ok = false;
  summary.violations = [{ type: 'missing-ci-requirement' }];

  assert.equal(
    evaluateCiWorkflowEvidence(summary, { fingerprint: 'workspace-a' }).status,
    'missing or fail',
  );
});

function passingDependencyAuditSummary(fingerprint = 'workspace-a') {
  return {
    schemaVersion: 2,
    ok: true,
    evaluatedAt: '2026-07-15',
    command: 'npm audit --json',
    baselinePath: 'config/npm-audit-baseline.json',
    runnerWorkspace: { fingerprint },
    violations: [],
    summary: {
      severeAdvisoryCount: 1,
      baselineReviewedAt: '2026-07-15',
      baselineReviewBy: '2026-08-14',
      evaluatedAt: '2026-07-15',
      reviewWindowDays: 30,
    },
    currentAdvisories: [
      { source: 1116760, package: '@fastify/middie', severity: 'critical' },
    ],
    productionAudit: {
      ok: true,
      command: 'npm audit --omit=dev --json',
      baselinePath: 'config/npm-audit-production-baseline.json',
      violations: [],
      summary: {
        severeAdvisoryCount: 0,
        baselineReviewedAt: '2026-07-15',
        baselineReviewBy: '2026-08-14',
        evaluatedAt: '2026-07-15',
        reviewWindowDays: 30,
      },
      currentAdvisories: [],
    },
    toolingAudits: {
      capacitorAssets: {
        ok: true,
        command: 'npm audit --json',
        cwd: 'tools/capacitor-assets',
        baselinePath: 'config/npm-audit-capacitor-assets-baseline.json',
        violations: [],
        summary: {
          severeAdvisoryCount: 1,
          baselineReviewedAt: '2026-07-15',
          baselineReviewBy: '2026-08-14',
          evaluatedAt: '2026-07-15',
          reviewWindowDays: 30,
        },
        currentAdvisories: [
          { source: 1112659, package: 'tar', severity: 'high' },
        ],
      },
    },
  };
}

test('dependency audit evidence passes only for the current workspace', () => {
  assert.deepEqual(
    evaluateDependencyAuditEvidence(
      passingDependencyAuditSummary(),
      { fingerprint: 'workspace-a' },
    ),
    { passed: true, matchesWorkspace: true, status: 'pass' },
  );
});

test('dependency audit evidence becomes stale after workspace changes', () => {
  assert.equal(
    evaluateDependencyAuditEvidence(
      passingDependencyAuditSummary(),
      { fingerprint: 'workspace-b' },
    ).status,
    'stale',
  );
});

test('dependency audit evidence rejects inconsistent advisory counts', () => {
  const summary = passingDependencyAuditSummary();
  summary.summary.severeAdvisoryCount = 2;

  assert.equal(
    evaluateDependencyAuditEvidence(summary, { fingerprint: 'workspace-a' }).status,
    'missing or fail',
  );
});

test('dependency audit evidence requires a valid production-install audit', () => {
  const missing = passingDependencyAuditSummary();
  delete missing.productionAudit;
  assert.equal(
    evaluateDependencyAuditEvidence(missing, { fingerprint: 'workspace-a' }).status,
    'missing or fail',
  );

  const inconsistent = passingDependencyAuditSummary();
  inconsistent.productionAudit.summary.severeAdvisoryCount = 2;
  assert.equal(
    evaluateDependencyAuditEvidence(inconsistent, { fingerprint: 'workspace-a' }).status,
    'missing or fail',
  );

  const wrongBaseline = passingDependencyAuditSummary();
  wrongBaseline.productionAudit.baselinePath = 'config/npm-audit-baseline.json';
  assert.equal(
    evaluateDependencyAuditEvidence(wrongBaseline, { fingerprint: 'workspace-a' }).status,
    'missing or fail',
  );
});

test('dependency audit evidence requires the isolated Capacitor asset tool audit', () => {
  const missing = passingDependencyAuditSummary();
  delete missing.toolingAudits.capacitorAssets;
  assert.equal(
    evaluateDependencyAuditEvidence(missing, { fingerprint: 'workspace-a' }).status,
    'missing or fail',
  );

  const wrongBaseline = passingDependencyAuditSummary();
  wrongBaseline.toolingAudits.capacitorAssets.baselinePath = 'config/npm-audit-baseline.json';
  assert.equal(
    evaluateDependencyAuditEvidence(wrongBaseline, { fingerprint: 'workspace-a' }).status,
    'missing or fail',
  );
});

test('dependency audit evidence accepts independent scope review windows', () => {
  const summary = passingDependencyAuditSummary();
  summary.productionAudit.summary.baselineReviewedAt = '2026-07-14';
  summary.productionAudit.summary.baselineReviewBy = '2026-08-13';

  assert.equal(
    evaluateDependencyAuditEvidence(summary, { fingerprint: 'workspace-a' }).status,
    'pass',
  );
});

test('dependency audit evidence rejects expired or unlinked review metadata', () => {
  const expired = passingDependencyAuditSummary();
  expired.evaluatedAt = '2026-08-15';
  expired.summary.evaluatedAt = '2026-08-15';
  assert.equal(
    evaluateDependencyAuditEvidence(expired, { fingerprint: 'workspace-a' }).status,
    'missing or fail',
  );

  const mismatched = passingDependencyAuditSummary();
  mismatched.summary.evaluatedAt = '2026-07-16';
  assert.equal(
    evaluateDependencyAuditEvidence(mismatched, { fingerprint: 'workspace-a' }).status,
    'missing or fail',
  );

  const oversizedWindow = passingDependencyAuditSummary();
  oversizedWindow.summary.reviewWindowDays = 32;
  assert.equal(
    evaluateDependencyAuditEvidence(oversizedWindow, { fingerprint: 'workspace-a' }).status,
    'missing or fail',
  );
});
