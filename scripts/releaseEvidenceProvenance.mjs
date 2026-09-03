import { validateDeploymentProvenance } from './deploymentProvenanceContract.mjs';
import { evaluateSystemStressBuildProvenance } from './systemStressContract.mjs';

export function hasRequiredReleaseQaSignals(summary) {
  return Boolean(
    summary
    && summary.searchDisplayedCount > 0
    && summary.detailPage?.hasCompareIntro
    && summary.detailPage?.hasCompareSection
    && summary.detailPage?.hasPriceHistorySection
    && summary.detailPage?.hasCleanVariantIdentity
    && summary.favorites?.hasLookbookHeader
    && summary.favorites?.hasSavedSummary
  );
}

function hasLinkedReleaseProvenance(summary, targetKind) {
  const evidence = summary?.deploymentProvenance;
  const manifest = evidence?.deployment;
  const manifestAudit = validateDeploymentProvenance(manifest);
  const commonLinkage = evidence?.ok === true
    && evidence?.targetKind === targetKind
    && evidence?.baseUrl === summary?.baseUrl
    && evidence?.commitMatchesExpected === true
    && evidence?.expectedCommit === manifest?.commit
    && evidence?.runnerWorkspace?.head === summary?.runnerWorkspace?.head
    && evidence?.runnerWorkspace?.fingerprint === summary?.runnerWorkspace?.fingerprint
    && manifestAudit.ok;

  if (!commonLinkage) return false;
  if (targetKind === 'local-working-tree') {
    return manifest.provider === 'local'
      && manifest.buildEnvironment === 'local'
      && manifest.commit === summary.runnerWorkspace.head
      && manifest.workspaceFingerprint === summary.runnerWorkspace.fingerprint;
  }
  return manifest.provider === 'netlify' && manifest.dirty === false;
}

export function evaluateLocalReleaseEvidence(summary, workspaceProvenance) {
  const passed = summary?.targetKind === 'local-working-tree'
    && hasRequiredReleaseQaSignals(summary)
    && hasLinkedReleaseProvenance(summary, 'local-working-tree');
  const matchesWorkspace = Boolean(
    passed
    && summary.runnerWorkspace?.fingerprint
    && summary.runnerWorkspace.fingerprint === workspaceProvenance.fingerprint
  );

  return {
    passed,
    matchesWorkspace,
    status: matchesWorkspace ? 'pass' : passed ? 'stale' : 'missing or fail',
  };
}

export function evaluateDeployedReleaseEvidence(summary) {
  const passed = summary?.targetKind === 'deployed-environment'
    && hasRequiredReleaseQaSignals(summary)
    && hasLinkedReleaseProvenance(summary, 'deployed-environment');

  return {
    passed: Boolean(passed),
    status: passed ? 'pass' : 'missing or fail',
  };
}

const DEMO_SCREENSHOT_KEYS = [
  'mainSearch',
  'searchResults',
  'detailCompare',
  'favorites',
];

export function evaluateLocalDemoEvidence(summary, workspaceProvenance, fileExists) {
  const screenshotPaths = DEMO_SCREENSHOT_KEYS.map((key) => summary?.screenshots?.[key]);
  const hasCompletePacket = summary?.targetKind === 'local-working-tree'
    && hasRequiredReleaseQaSignals(summary)
    && hasLinkedReleaseProvenance(summary, 'local-working-tree')
    && summary?.screenshots?.enabled === true
    && screenshotPaths.every((filePath) => typeof filePath === 'string' && fileExists(filePath));
  const matchesWorkspace = Boolean(
    hasCompletePacket
    && summary.runnerWorkspace?.fingerprint
    && summary.runnerWorkspace.fingerprint === workspaceProvenance.fingerprint
  );

  return {
    passed: hasCompletePacket,
    matchesWorkspace,
    status: matchesWorkspace ? 'pass' : hasCompletePacket ? 'stale' : 'missing or fail',
    screenshotPaths: screenshotPaths.filter((filePath) => typeof filePath === 'string'),
  };
}

export function evaluateLocalDirectSourceEvidence(summary, workspaceProvenance) {
  const requiredSources = Array.isArray(summary?.requiredSources)
    ? summary.requiredSources
    : [];
  const passed = summary?.targetKind === 'local-working-tree'
    && summary?.ok === true
    && summary?.status === 200
    && summary?.fallbackMode === 'full'
    && summary?.directSourceCount > 0
    && requiredSources.length > 0
    && requiredSources.every((source) => (
      source?.present === true
      && source?.attempted === true
      && source?.strategy === 'direct'
      && source?.directCount > 0
      && source?.passed === true
    ));
  const matchesWorkspace = Boolean(
    passed
    && summary.runnerWorkspace?.fingerprint
    && summary.runnerWorkspace.fingerprint === workspaceProvenance.fingerprint
  );

  return {
    passed,
    matchesWorkspace,
    status: matchesWorkspace ? 'pass' : passed ? 'stale' : 'missing or fail',
    requiredSourceCount: requiredSources.length,
  };
}

function hasExpectedLocalBuildProvenanceUrl(summary) {
  try {
    return summary?.buildProvenance?.requestUrl === new URL(
      '/deployment-provenance.json',
      summary.baseUrl,
    ).toString();
  } catch {
    return false;
  }
}

export function evaluateLocalSystemStressEvidence(summary, workspaceProvenance) {
  const buildProvenance = summary?.buildProvenance;
  const buildAudit = evaluateSystemStressBuildProvenance(
    buildProvenance?.deployment,
    summary?.runnerWorkspace,
    summary?.runnerIdentity,
  );
  const passed = summary?.targetKind === 'local-production-build'
    && summary?.ok === true
    && buildProvenance?.ok === true
    && buildProvenance?.responseStatus === 200
    && hasExpectedLocalBuildProvenanceUrl(summary)
    && buildAudit.ok
    && summary?.configuration?.totalRequests >= 100
    && summary?.configuration?.concurrency >= 100
    && summary?.evaluation?.passedRequests >= 98
    && summary?.evaluation?.successRate >= 0.98
    && summary?.evaluation?.failures?.length === 0
    && Number.isFinite(summary?.evaluation?.p95LatencyMs)
    && Number.isFinite(summary?.evaluation?.rssGrowthMb);
  const matchesWorkspace = Boolean(
    passed
    && summary.runnerWorkspace?.fingerprint
    && summary.runnerWorkspace.fingerprint === workspaceProvenance.fingerprint
  );

  return {
    passed,
    matchesWorkspace,
    status: matchesWorkspace ? 'pass' : passed ? 'stale' : 'missing or fail',
  };
}

export function evaluatePortfolioClaimEvidence(summary, workspaceProvenance) {
  const passed = summary?.ok === true
    && summary?.currentDocumentCount > 0
    && summary?.legacyDocumentCount > 0
    && Array.isArray(summary?.violations)
    && summary.violations.length === 0;
  const matchesWorkspace = Boolean(
    passed
    && summary.runnerWorkspace?.fingerprint
    && summary.runnerWorkspace.fingerprint === workspaceProvenance.fingerprint
  );

  return {
    passed,
    matchesWorkspace,
    status: matchesWorkspace ? 'pass' : passed ? 'stale' : 'missing or fail',
  };
}

export function evaluateCiWorkflowEvidence(summary, workspaceProvenance) {
  const passed = summary?.ok === true
    && summary?.workflowPath === '.github/workflows/deploy.yml'
    && Array.isArray(summary?.violations)
    && summary.violations.length === 0;
  const matchesWorkspace = Boolean(
    passed
    && summary.runnerWorkspace?.fingerprint
    && summary.runnerWorkspace.fingerprint === workspaceProvenance.fingerprint
  );

  return {
    passed,
    matchesWorkspace,
    status: matchesWorkspace ? 'pass' : passed ? 'stale' : 'missing or fail',
  };
}

function hasValidDependencyAuditScope(scope, evaluatedAt) {
  const reviewWindowDays = scope?.summary?.reviewWindowDays;
  return scope?.ok === true
    && Array.isArray(scope?.violations)
    && scope.violations.length === 0
    && Array.isArray(scope?.currentAdvisories)
    && Number.isInteger(scope?.summary?.severeAdvisoryCount)
    && typeof scope?.summary?.baselineReviewedAt === 'string'
    && typeof scope?.summary?.baselineReviewBy === 'string'
    && scope?.summary?.evaluatedAt === evaluatedAt
    && scope.summary.baselineReviewedAt <= scope.summary.evaluatedAt
    && scope.summary.evaluatedAt <= scope.summary.baselineReviewBy
    && Number.isInteger(reviewWindowDays)
    && reviewWindowDays >= 0
    && reviewWindowDays <= 31
    && scope.summary.severeAdvisoryCount === scope.currentAdvisories.length;
}

export function evaluateDependencyAuditEvidence(summary, workspaceProvenance) {
  const productionAudit = summary?.productionAudit;
  const capacitorAssetsAudit = summary?.toolingAudits?.capacitorAssets;
  const passed = summary?.schemaVersion === 2
    && summary?.command === 'npm audit --json'
    && summary?.baselinePath === 'config/npm-audit-baseline.json'
    && hasValidDependencyAuditScope(summary, summary?.evaluatedAt)
    && productionAudit?.command === 'npm audit --omit=dev --json'
    && productionAudit?.baselinePath === 'config/npm-audit-production-baseline.json'
    && hasValidDependencyAuditScope(productionAudit, summary?.evaluatedAt)
    && capacitorAssetsAudit?.command === 'npm audit --json'
    && capacitorAssetsAudit?.cwd === 'tools/capacitor-assets'
    && capacitorAssetsAudit?.baselinePath === 'config/npm-audit-capacitor-assets-baseline.json'
    && hasValidDependencyAuditScope(capacitorAssetsAudit, summary?.evaluatedAt);
  const matchesWorkspace = Boolean(
    passed
    && summary.runnerWorkspace?.fingerprint
    && summary.runnerWorkspace.fingerprint === workspaceProvenance.fingerprint
  );

  return {
    passed,
    matchesWorkspace,
    status: matchesWorkspace ? 'pass' : passed ? 'stale' : 'missing or fail',
  };
}
