import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { buildGitWorkspaceProvenance } from './gitWorkspaceProvenance.mjs';
import { evaluateDeploymentPromotion } from './deploymentProvenanceContract.mjs';
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
} from './releaseEvidenceProvenance.mjs';

function readJson(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`Missing required artifact: ${filePath}`);
  }
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function runScript(scriptPath, envOverrides = {}) {
  execFileSync('node', [scriptPath], {
    cwd: process.cwd(),
    stdio: 'ignore',
    env: {
      ...process.env,
      ...envOverrides,
    },
  });
}

const workspace = process.cwd();
const outputDir = path.join(workspace, 'output', 'playwright');
const outputPath = path.join(outputDir, 'release-closeout-report.md');

const uatPath = path.join(outputDir, 'netlify-uat-summary.json');
const runtimeReadyPath = path.join(outputDir, 'playwright-mcp-runtime-ready.json');
const runtimeHealthPath = path.join(outputDir, 'playwright-mcp-health.json');
const runtimeCleanupPlanPath = path.join(outputDir, 'playwright-mcp-runtime-cleanup-plan.md');
const runtimeCleanupResultPath = path.join(outputDir, 'playwright-mcp-runtime-cleanup-result.json');
const runtimeCleanupExecutionPath = path.join(outputDir, 'playwright-mcp-runtime-cleanup-last-execution.json');
const localReleaseQaPath = path.join(outputDir, 'local-release-qa-summary.json');
const deployedReleaseQaPath = path.join(outputDir, 'netlify-release-qa-summary.json');
const localDirectSourcePath = path.join(outputDir, 'local-direct-source-integration-smoke.json');
const localSystemStressPath = path.join(outputDir, 'local-system-stress-smoke.json');
const localSearchQualityPath = path.join(outputDir, 'local-search-quality-observation-report.json');
const localSearchQualityMarkdownPath = path.join(outputDir, 'local-search-quality-observation-report.md');
const groupingQualityPath = path.join(outputDir, 'product-grouping-quality-benchmark.json');
const groupingQualityMarkdownPath = path.join(outputDir, 'product-grouping-quality-benchmark.md');
const portfolioClaimAuditPath = path.join(outputDir, 'portfolio-claim-audit.json');
const ciWorkflowAuditPath = path.join(outputDir, 'ci-workflow-contract.json');
const dependencyAuditPath = path.join(outputDir, 'dependency-audit-policy.json');
const deploymentProvenancePath = path.join(outputDir, 'netlify-deployment-provenance.json');

mkdirSync(outputDir, { recursive: true });

if (existsSync(runtimeCleanupResultPath)) {
  const previousCleanupResult = readJson(runtimeCleanupResultPath);
  const hasExecutionRecord = previousCleanupResult.mode === 'execute'
    && previousCleanupResult.killed?.length > 0;

  if (hasExecutionRecord) {
    writeFileSync(
      runtimeCleanupExecutionPath,
      `${JSON.stringify(previousCleanupResult, null, 2)}\n`,
    );
  }
}

runScript(path.join('scripts', 'buildPlaywrightMcpHealth.mjs'));
runScript(path.join('scripts', 'buildPlaywrightMcpRuntimeCleanupPlan.mjs'));
runScript(path.join('scripts', 'cleanupPlaywrightMcpRuntime.mjs'), {
  PLAYWRIGHT_MCP_CLEANUP_PIDS: '',
  PLAYWRIGHT_MCP_CLEANUP_CONFIRM: '',
});

const uat = readJson(uatPath);
const runtimeReady = readJson(runtimeReadyPath);
const runtimeHealth = readJson(runtimeHealthPath);
const cleanupResult = readJson(runtimeCleanupResultPath);
const cleanupPlanExists = existsSync(runtimeCleanupPlanPath);
const cleanupExecutionExists = existsSync(runtimeCleanupExecutionPath);
const cleanupExecution = cleanupExecutionExists ? readJson(runtimeCleanupExecutionPath) : null;
const workspaceProvenance = buildGitWorkspaceProvenance(workspace);
const localReleaseQa = existsSync(localReleaseQaPath) ? readJson(localReleaseQaPath) : null;
const deployedReleaseQa = existsSync(deployedReleaseQaPath) ? readJson(deployedReleaseQaPath) : null;
const localDirectSource = existsSync(localDirectSourcePath) ? readJson(localDirectSourcePath) : null;
const localSystemStress = existsSync(localSystemStressPath) ? readJson(localSystemStressPath) : null;
const localSearchQuality = existsSync(localSearchQualityPath) ? readJson(localSearchQualityPath) : null;
const groupingQuality = existsSync(groupingQualityPath) ? readJson(groupingQualityPath) : null;
const portfolioClaimAudit = existsSync(portfolioClaimAuditPath) ? readJson(portfolioClaimAuditPath) : null;
const ciWorkflowAudit = existsSync(ciWorkflowAuditPath) ? readJson(ciWorkflowAuditPath) : null;
const dependencyAudit = existsSync(dependencyAuditPath) ? readJson(dependencyAuditPath) : null;
const deploymentProvenance = existsSync(deploymentProvenancePath)
  ? readJson(deploymentProvenancePath)
  : null;
const localReleaseEvidence = evaluateLocalReleaseEvidence(localReleaseQa, workspaceProvenance);
const localDemoEvidence = evaluateLocalDemoEvidence(localReleaseQa, workspaceProvenance, existsSync);
const localDirectSourceEvidence = evaluateLocalDirectSourceEvidence(
  localDirectSource,
  workspaceProvenance,
);
const localSystemStressEvidence = evaluateLocalSystemStressEvidence(
  localSystemStress,
  workspaceProvenance,
);
const localSearchQualityEvidence = evaluateLocalSearchQualityEvidence(
  localSearchQuality,
  workspaceProvenance,
);
const portfolioClaimEvidence = evaluatePortfolioClaimEvidence(
  portfolioClaimAudit,
  workspaceProvenance,
);
const groupingQualityEvidence = evaluateGroupingQualityEvidence(
  groupingQuality,
  workspaceProvenance,
);
const ciWorkflowEvidence = evaluateCiWorkflowEvidence(ciWorkflowAudit, workspaceProvenance);
const dependencyAuditEvidence = evaluateDependencyAuditEvidence(
  dependencyAudit,
  workspaceProvenance,
);
const deploymentPromotion = evaluateDeploymentPromotion({
  manifest: deploymentProvenance?.deployment,
  smoke: deploymentProvenance,
  uat,
  currentHead: workspaceProvenance.head,
});
const deployedReleaseEvidence = evaluateDeployedReleaseEvidence(deployedReleaseQa);
const cleanupRequestedPids = cleanupResult.requestedPids?.length > 0
  ? cleanupResult.requestedPids.join(', ')
  : 'none';
const cleanupKilledPids = cleanupResult.killed?.length > 0
  ? cleanupResult.killed.join(', ')
  : 'none';
const cleanupSkippedCount = cleanupResult.skipped?.length ?? 0;
const cleanupExecutionKilledPids = cleanupExecution?.killed?.length > 0
  ? cleanupExecution.killed.join(', ')
  : 'none';

const stepLines = (uat.steps ?? []).map((step) => {
  const icon = step.ok ? 'pass' : 'fail';
  return `- ${step.label}: ${icon} (exit ${step.exitCode}, ${step.durationMs}ms)`;
});

const lines = [
  '# Release Closeout Report',
  '',
  `Date: ${new Date().toISOString()}`,
  `Workspace: ${workspace}`,
  '',
  '## Overall',
  '',
  `- Netlify UAT: ${uat.ok ? 'pass' : 'fail'}`,
  `- Playwright MCP runtime closeout: ${runtimeReady.ok ? 'pass' : 'fail'}`,
  `- Runtime stance: ${runtimeReady.status}`,
  `- Deployed release QA smoke: ${deployedReleaseEvidence.status}`,
  `- Current working-tree pre-release smoke: ${localReleaseEvidence.status}`,
  `- Fingerprint-linked demo screenshot packet: ${localDemoEvidence.status}`,
  `- Fingerprint-linked direct-source integration smoke: ${localDirectSourceEvidence.status}`,
  `- Fingerprint-linked local system stress smoke: ${localSystemStressEvidence.status}`,
  `- Fingerprint-linked local search-quality observation: ${localSearchQualityEvidence.status}`,
  `- Fingerprint-linked product grouping quality benchmark: ${groupingQualityEvidence.status}`,
  `- Fingerprint-linked portfolio claim integrity audit: ${portfolioClaimEvidence.status}`,
  `- Fingerprint-linked CI workflow integrity audit: ${ciWorkflowEvidence.status}`,
  `- Fingerprint-linked dependency audit policy: ${dependencyAuditEvidence.status}`,
  `- Deployment provenance-linked promotion: ${deploymentPromotion.status}`,
  '',
  '## Evidence Boundary',
  '',
  `- Workspace branch: ${workspaceProvenance.branch}`,
  `- Workspace HEAD: ${workspaceProvenance.head}`,
  `- Workspace dirty: ${workspaceProvenance.dirty}`,
  `- Workspace changed files: ${workspaceProvenance.changedFileCount}`,
  `- Workspace fingerprint: ${workspaceProvenance.fingerprint}`,
  `- Netlify UAT target: ${uat.baseUrl ?? 'unknown'}`,
  `- Netlify UAT generated at: ${uat.generatedAt ?? 'unknown'}`,
  `- Deployed release QA generated at: ${deployedReleaseQa?.generatedAt ?? 'missing'}`,
  `- Deployed release QA clean variant identity: ${deployedReleaseQa?.detailPage?.hasCleanVariantIdentity === true}`,
  `- Deployed release QA provenance commit: ${deployedReleaseQa?.deploymentProvenance?.deployment?.commit ?? 'missing'}`,
  `- Deployed release QA provenance provider: ${deployedReleaseQa?.deploymentProvenance?.deployment?.provider ?? 'missing'}`,
  `- Deployed release QA artifact: \`${path.relative(workspace, deployedReleaseQaPath)}\``,
  uat.ok
    ? '- Passing Netlify UAT proves target deployment behavior; deployment provenance separately identifies the deployed commit.'
    : '- Current Netlify UAT did not complete target behavior checks; inspect the first failing step before using older smoke artifacts.',
  localReleaseQa
    ? `- Local pre-release QA generated at: ${localReleaseQa.generatedAt ?? 'unknown'}`
    : '- Local pre-release QA generated at: missing',
  `- Local pre-release QA provenance commit: ${localReleaseQa?.deploymentProvenance?.deployment?.commit ?? 'missing'}`,
  localReleaseQa
    ? `- Local evidence fingerprint matches current workspace: ${localReleaseEvidence.matchesWorkspace}`
    : '- Local evidence fingerprint matches current workspace: false',
  `- Local pre-release artifact: \`${path.relative(workspace, localReleaseQaPath)}\``,
  `- Local demo screenshot files: ${localDemoEvidence.screenshotPaths.length}/4`,
  ...localDemoEvidence.screenshotPaths.map((filePath) => `- Demo screenshot: \`${path.relative(workspace, filePath)}\``),
  localDirectSource
    ? `- Local direct-source smoke generated at: ${localDirectSource.generatedAt ?? 'unknown'}`
    : '- Local direct-source smoke generated at: missing',
  `- Local direct-source fingerprint matches current workspace: ${localDirectSourceEvidence.matchesWorkspace}`,
  `- Local direct-source required sources: ${localDirectSourceEvidence.requiredSourceCount}`,
  `- Local direct-source artifact: \`${path.relative(workspace, localDirectSourcePath)}\``,
  localSystemStress
    ? `- Local system stress generated at: ${localSystemStress.generatedAt ?? 'unknown'}`
    : '- Local system stress generated at: missing',
  `- Local system stress fingerprint matches current workspace: ${localSystemStressEvidence.matchesWorkspace}`,
  `- Local system stress build provenance linked: ${localSystemStressEvidence.passed}`,
  `- Local system stress build commit: ${localSystemStress?.buildProvenance?.deployment?.commit ?? 'missing'}`,
  `- Local system stress build provider: ${localSystemStress?.buildProvenance?.deployment?.provider ?? 'missing'}`,
  `- Local system stress runner environment: ${localSystemStress?.runnerIdentity?.buildEnvironment ?? 'missing'}`,
  `- Local system stress runner run ID: ${localSystemStress?.runnerIdentity?.runId ?? 'none'}`,
  `- Local system stress requests: ${localSystemStress?.evaluation?.passedRequests ?? 0}/${localSystemStress?.evaluation?.totalRequests ?? 0}`,
  `- Local system stress p95 latency: ${localSystemStress?.evaluation?.p95LatencyMs ?? 'unknown'}ms`,
  `- Local system stress RSS growth: ${localSystemStress?.evaluation?.rssGrowthMb ?? 'unknown'}MB`,
  `- Local system stress artifact: \`${path.relative(workspace, localSystemStressPath)}\``,
  localSearchQuality
    ? `- Local search-quality observation generated at: ${localSearchQuality.generatedAt ?? 'unknown'}`
    : '- Local search-quality observation generated at: missing',
  `- Local search-quality fingerprint matches current workspace: ${localSearchQualityEvidence.matchesWorkspace}`,
  `- Local search-quality observation fresh: ${localSearchQualityEvidence.fresh}`,
  `- Local search-quality observation status: ${localSearchQualityEvidence.observationStatus}`,
  `- Local search-quality tracked searches: ${localSearchQualityEvidence.trackedSearches}`,
  `- Local search-quality interaction events: ${localSearchQualityEvidence.interactionCount}`,
  `- Local search-quality failing / disabled sources: ${localSearchQualityEvidence.failingSourceCount} / ${localSearchQualityEvidence.disabledSourceCount}`,
  `- Local search-quality artifact: \`${path.relative(workspace, localSearchQualityPath)}\``,
  `- Local search-quality report: \`${path.relative(workspace, localSearchQualityMarkdownPath)}\``,
  groupingQuality
    ? `- Product grouping benchmark generated at: ${groupingQuality.generatedAt ?? 'unknown'}`
    : '- Product grouping benchmark generated at: missing',
  `- Product grouping benchmark fingerprint matches current workspace: ${groupingQualityEvidence.matchesWorkspace}`,
  `- Product grouping benchmark products: ${groupingQuality?.sampleCount ?? 0}`,
  `- Product grouping benchmark expected pairs: ${groupingQuality?.expectedPositivePairs ?? 0}`,
  `- Product grouping benchmark precision: ${groupingQuality?.precision ?? 'unknown'}`,
  `- Product grouping benchmark recall: ${groupingQuality?.recall ?? 'unknown'}`,
  `- Product grouping benchmark F1: ${groupingQuality?.f1 ?? 'unknown'}`,
  `- Product grouping benchmark violations: ${groupingQuality?.violations?.length ?? 'unknown'}`,
  `- Product grouping benchmark artifact: \`${path.relative(workspace, groupingQualityPath)}\``,
  `- Product grouping benchmark report: \`${path.relative(workspace, groupingQualityMarkdownPath)}\``,
  portfolioClaimAudit
    ? `- Portfolio claim audit generated at: ${portfolioClaimAudit.generatedAt ?? 'unknown'}`
    : '- Portfolio claim audit generated at: missing',
  `- Portfolio claim audit fingerprint matches current workspace: ${portfolioClaimEvidence.matchesWorkspace}`,
  `- Portfolio claim documents: ${portfolioClaimAudit?.currentDocumentCount ?? 0} current / ${portfolioClaimAudit?.legacyDocumentCount ?? 0} legacy`,
  `- Portfolio claim violations: ${portfolioClaimAudit?.violations?.length ?? 'unknown'}`,
  `- Portfolio claim artifact: \`${path.relative(workspace, portfolioClaimAuditPath)}\``,
  ciWorkflowAudit
    ? `- CI workflow audit generated at: ${ciWorkflowAudit.generatedAt ?? 'unknown'}`
    : '- CI workflow audit generated at: missing',
  `- CI workflow audit fingerprint matches current workspace: ${ciWorkflowEvidence.matchesWorkspace}`,
  `- CI workflow violations: ${ciWorkflowAudit?.violations?.length ?? 'unknown'}`,
  `- CI workflow artifact: \`${path.relative(workspace, ciWorkflowAuditPath)}\``,
  dependencyAudit
    ? `- Dependency audit generated at: ${dependencyAudit.generatedAt ?? 'unknown'}`
    : '- Dependency audit generated at: missing',
  `- Dependency audit fingerprint matches current workspace: ${dependencyAuditEvidence.matchesWorkspace}`,
  `- Dependency audit full-graph violations: ${dependencyAudit?.violations?.length ?? 'unknown'}`,
  `- Dependency audit full-graph packages: ${dependencyAudit?.summary?.high ?? 'unknown'} high / ${dependencyAudit?.summary?.critical ?? 'unknown'} critical`,
  `- Dependency audit full-graph advisories: ${dependencyAudit?.summary?.severeAdvisoryCount ?? 'unknown'} reviewed high/critical sources`,
  `- Dependency audit production-install violations: ${dependencyAudit?.productionAudit?.violations?.length ?? 'unknown'}`,
  `- Dependency audit production-install packages: ${dependencyAudit?.productionAudit?.summary?.high ?? 'unknown'} high / ${dependencyAudit?.productionAudit?.summary?.critical ?? 'unknown'} critical`,
  `- Dependency audit production-install advisories: ${dependencyAudit?.productionAudit?.summary?.severeAdvisoryCount ?? 'unknown'} reviewed high/critical sources`,
  `- Dependency audit Capacitor asset tool violations: ${dependencyAudit?.toolingAudits?.capacitorAssets?.violations?.length ?? 'unknown'}`,
  `- Dependency audit Capacitor asset tool packages: ${dependencyAudit?.toolingAudits?.capacitorAssets?.summary?.high ?? 'unknown'} high / ${dependencyAudit?.toolingAudits?.capacitorAssets?.summary?.critical ?? 'unknown'} critical`,
  `- Dependency audit Capacitor asset tool advisories: ${dependencyAudit?.toolingAudits?.capacitorAssets?.summary?.severeAdvisoryCount ?? 'unknown'} reviewed high/critical sources`,
  `- Dependency audit full-graph baseline: ${dependencyAudit?.baselinePath ?? 'unknown'} (${dependencyAudit?.summary?.baselineReviewedAt ?? 'unknown'} -> ${dependencyAudit?.summary?.baselineReviewBy ?? 'unknown'})`,
  `- Dependency audit production baseline: ${dependencyAudit?.productionAudit?.baselinePath ?? 'unknown'} (${dependencyAudit?.productionAudit?.summary?.baselineReviewedAt ?? 'unknown'} -> ${dependencyAudit?.productionAudit?.summary?.baselineReviewBy ?? 'unknown'})`,
  `- Dependency audit Capacitor asset tool baseline: ${dependencyAudit?.toolingAudits?.capacitorAssets?.baselinePath ?? 'unknown'} (${dependencyAudit?.toolingAudits?.capacitorAssets?.summary?.baselineReviewedAt ?? 'unknown'} -> ${dependencyAudit?.toolingAudits?.capacitorAssets?.summary?.baselineReviewBy ?? 'unknown'})`,
  `- Dependency audit evaluated at: ${dependencyAudit?.evaluatedAt ?? 'unknown'}`,
  `- Dependency audit artifact: \`${path.relative(workspace, dependencyAuditPath)}\``,
  deploymentProvenance
    ? `- Deployed provenance generated at: ${deploymentProvenance.generatedAt ?? 'unknown'}`
    : '- Deployed provenance generated at: missing',
  `- Deployed provenance commit: ${deploymentProvenance?.deployment?.commit ?? 'missing'}`,
  `- Deployed provenance provider: ${deploymentProvenance?.deployment?.provider ?? 'missing'}`,
  `- Deployed provenance build environment: ${deploymentProvenance?.deployment?.buildEnvironment ?? 'missing'}`,
  `- Deployed provenance deploy ID: ${deploymentProvenance?.deployment?.deployId ?? 'missing'}`,
  `- Deployed provenance run ID: ${deploymentProvenance?.deployment?.runId ?? 'missing'}`,
  `- Deployed commit matches current HEAD: ${deploymentPromotion.commitMatchesCurrentHead}`,
  `- UAT includes passing provenance step: ${deploymentPromotion.hasProvenanceStep}`,
  `- Standalone provenance matches deployment identity: ${deploymentPromotion.smokeMatchesDeployment}`,
  `- UAT provenance matches standalone deployment identity: ${deploymentPromotion.uatMatchesDeployment}`,
  `- Deployment provenance artifact: \`${path.relative(workspace, deploymentProvenancePath)}\``,
  '',
  '## Netlify UAT',
  '',
  ...stepLines,
  '',
  `- Summary artifact: \`${path.relative(workspace, uatPath)}\``,
  '',
  '## Playwright MCP Runtime',
  '',
  `- Runtime closeout ok: ${runtimeReady.ok}`,
  `- Runtime status: ${runtimeReady.status}`,
  `- Recommendation: ${runtimeReady.recommendation}`,
  `- Doctor status: ${runtimeHealth.doctor?.status ?? 'unknown'}`,
  `- Workspace MCP processes: ${runtimeHealth.doctor?.workspaceProcessCount ?? 'unknown'}`,
  `- Root-cwd MCP processes: ${runtimeHealth.doctor?.rootCwdProcessCount ?? 'unknown'}`,
  `- Live probe: ${runtimeHealth.liveProbe?.status ?? 'unknown'} (${runtimeHealth.liveProbe?.navigation ?? 'unknown'})`,
  `- Runtime ready artifact: \`${path.relative(workspace, runtimeReadyPath)}\``,
  `- Runtime health artifact: \`${path.relative(workspace, runtimeHealthPath)}\``,
  `- Runtime packet: \`${path.relative(workspace, runtimeReady.artifacts.packet)}\``,
  cleanupPlanExists
    ? `- Runtime cleanup plan: \`${path.relative(workspace, runtimeCleanupPlanPath)}\``
    : '- Runtime cleanup plan: missing',
  `- Runtime cleanup result: \`${path.relative(workspace, runtimeCleanupResultPath)}\``,
  `- Runtime cleanup mode: ${cleanupResult.mode}`,
  `- Cleanup requested PIDs: ${cleanupRequestedPids}`,
  `- Cleanup killed PIDs: ${cleanupKilledPids}`,
  `- Cleanup skipped entries: ${cleanupSkippedCount}`,
  cleanupExecutionExists
    ? `- Last cleanup execution: \`${path.relative(workspace, runtimeCleanupExecutionPath)}\``
    : '- Last cleanup execution: none',
  `- Last cleanup killed PIDs: ${cleanupExecutionKilledPids}`,
  '',
  '## Operator meaning',
  '',
  '- If Netlify UAT is pass and runtime status is `fallback-ready`, release closeout is acceptable with repo-local Playwright MCP fallback.',
  '- If root-cwd MCP processes remain, inspect the cleanup plan before terminating anything.',
  '- Release report generation always refreshes cleanup result in dry-run mode; process termination still requires explicit cleanup env vars.',
  '- If cleanup was executed immediately before report generation, the last execution record is preserved separately for audit.',
  '- If runtime status becomes `fully-ok`, the built-in MCP layer is also healthy.',
  '- Any other runtime status should block closeout until investigated.',
  '- A dirty workspace is only covered when local pre-release QA passes and its fingerprint matches the current workspace.',
  '- Release QA behavior is current only when the same summary embeds a passing target provenance check linked to its manifest, commit, target URL, and runner identity.',
  '- Demo screenshots are current only when all four files exist and their release QA fingerprint matches the current workspace.',
  '- Local direct-source evidence is current only when every required source returns direct hits and its fingerprint matches the current workspace.',
  '- Local stress evidence is current only when the served build manifest passes strict schema validation, matches the runner commit/workspace fingerprint and CI run identity, and the 100 concurrent deterministic route contracts pass; it is not a production capacity or concurrent-user claim.',
  '- Local search-quality evidence is current only when its privacy-trimmed diagnostics snapshot is no more than 24 hours old, was captured within five minutes of report generation, and the served deployment provenance and workspace fingerprint match. Observation `watch` or `insufficient-data` is an operational signal, not an automatic evidence failure.',
  '- Product grouping quality is current only when the curated pairwise precision/recall/F1 benchmark meets its reviewed sample and quality floors and the artifact fingerprint matches the workspace; it is not a production accuracy claim.',
  '- Portfolio claims are current only when current docs contain no forbidden outcome claims, legacy artifacts carry the fixed evidence marker, and the audit fingerprint matches the workspace.',
  '- CI workflow integrity is current only when test/e2e job-scoped blocking gates, current-workflow self-audit, execution order, failure upload actions, and workspace fingerprint all match.',
  '- Dependency audit evidence is current only when the full dependency graph, `--omit=dev` production install graph, and isolated Capacitor asset tool graph each match their reviewed source/package/severity baseline, package-count ceilings do not increase, every maximum 31-day review window is still valid, and the audit fingerprint matches the workspace.',
  '- Production promotion passes only when the standalone smoke and UAT provenance payloads match the same static Netlify manifest, target URL, and current HEAD.',
];

writeFileSync(outputPath, `${lines.join('\n')}\n`);
process.stdout.write(`${outputPath}\n`);
