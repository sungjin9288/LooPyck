import { validateDeploymentProvenance } from './deploymentProvenanceContract.mjs';

export const DEFAULT_SYSTEM_STRESS_THRESHOLDS = Object.freeze({
  minimumRequests: 100,
  minimumConcurrency: 100,
  minimumSuccessRate: 0.98,
  maximumP95LatencyMs: 5_000,
  maximumRssGrowthMb: 192,
});

const LOCAL_STRESS_BUILD_ENVIRONMENTS = new Set([
  'local',
  'github-actions',
  'netlify-cli',
]);
const STRESS_RUNNER_BUILD_ENVIRONMENTS = new Set(['local', 'github-actions']);

function clean(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function buildSystemStressRunnerIdentity(env = {}) {
  const isGitHubActions = env.GITHUB_ACTIONS === 'true';
  return {
    buildEnvironment: isGitHubActions ? 'github-actions' : 'local',
    runId: isGitHubActions ? clean(env.GITHUB_RUN_ID) : null,
  };
}

export function evaluateSystemStressBuildProvenance(
  manifest,
  runnerWorkspace,
  runnerIdentity,
) {
  const manifestAudit = validateDeploymentProvenance(manifest);
  const violations = [...manifestAudit.violations];
  const runnerBuildEnvironment = runnerIdentity?.buildEnvironment;

  if (manifestAudit.ok && !LOCAL_STRESS_BUILD_ENVIRONMENTS.has(manifest.buildEnvironment)) {
    violations.push({ type: 'unsupported-local-stress-build-environment' });
  }
  if (manifestAudit.ok && manifest.commit !== runnerWorkspace?.head) {
    violations.push({ type: 'build-commit-runner-mismatch' });
  }
  if (manifestAudit.ok && manifest.workspaceFingerprint !== runnerWorkspace?.fingerprint) {
    violations.push({ type: 'build-workspace-fingerprint-runner-mismatch' });
  }
  if (manifestAudit.ok && manifest.dirty !== runnerWorkspace?.dirty) {
    violations.push({ type: 'build-dirty-state-runner-mismatch' });
  }
  if (!STRESS_RUNNER_BUILD_ENVIRONMENTS.has(runnerBuildEnvironment)) {
    violations.push({ type: 'invalid-stress-runner-build-environment' });
  } else if (runnerBuildEnvironment === 'github-actions') {
    const runnerRunId = clean(runnerIdentity?.runId);
    if (!runnerRunId) {
      violations.push({ type: 'missing-stress-runner-run-id' });
    }
    if (manifestAudit.ok && manifest.buildEnvironment !== 'github-actions') {
      violations.push({ type: 'build-runner-environment-mismatch' });
    } else if (manifestAudit.ok && runnerRunId && manifest.runId !== runnerRunId) {
      violations.push({ type: 'build-runner-run-id-mismatch' });
    }
  } else {
    if (runnerIdentity?.runId !== null) {
      violations.push({ type: 'unexpected-stress-runner-run-id' });
    }
    if (manifestAudit.ok && manifest.buildEnvironment === 'github-actions') {
      violations.push({ type: 'build-runner-environment-mismatch' });
    }
  }

  return { ok: violations.length === 0, violations };
}

function percentile(values, ratio) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(Math.ceil(sorted.length * ratio) - 1, sorted.length - 1);
  return sorted[Math.max(index, 0)];
}

export function evaluateSystemStressRun(run, thresholds = DEFAULT_SYSTEM_STRESS_THRESHOLDS) {
  const results = Array.isArray(run?.results) ? run.results : [];
  const passedRequests = results.filter((result) => result?.passed === true).length;
  const totalRequests = results.length;
  const successRate = totalRequests > 0 ? passedRequests / totalRequests : 0;
  const latencyValues = results
    .map((result) => Number(result?.latencyMs))
    .filter((value) => Number.isFinite(value) && value >= 0);
  const p95LatencyMs = percentile(latencyValues, 0.95);
  const rssBeforeMb = Number(run?.memory?.rssBeforeMb);
  const rssPeakMb = Number(run?.memory?.rssPeakMb);
  const rssAfterMb = Number(run?.memory?.rssAfterMb);
  const hasMemoryEvidence = [rssBeforeMb, rssPeakMb, rssAfterMb]
    .every((value) => Number.isFinite(value) && value >= 0);
  const rssGrowthMb = hasMemoryEvidence
    ? Math.round((Math.max(rssPeakMb, rssAfterMb) - rssBeforeMb) * 100) / 100
    : null;
  const concurrency = Number(run?.concurrency || 0);
  const failures = [];

  if (totalRequests < thresholds.minimumRequests) {
    failures.push(`request_count_below_${thresholds.minimumRequests}`);
  }
  if (concurrency < thresholds.minimumConcurrency) {
    failures.push(`concurrency_below_${thresholds.minimumConcurrency}`);
  }
  if (successRate < thresholds.minimumSuccessRate) {
    failures.push(`success_rate_below_${thresholds.minimumSuccessRate}`);
  }
  if (p95LatencyMs === null || p95LatencyMs > thresholds.maximumP95LatencyMs) {
    failures.push(`p95_latency_above_${thresholds.maximumP95LatencyMs}ms`);
  }
  if (!hasMemoryEvidence) {
    failures.push('server_memory_evidence_missing');
  } else if (rssGrowthMb > thresholds.maximumRssGrowthMb) {
    failures.push(`rss_growth_above_${thresholds.maximumRssGrowthMb}mb`);
  }

  return {
    ok: failures.length === 0,
    totalRequests,
    passedRequests,
    failedRequests: totalRequests - passedRequests,
    successRate,
    p95LatencyMs,
    rssGrowthMb,
    failures,
  };
}
