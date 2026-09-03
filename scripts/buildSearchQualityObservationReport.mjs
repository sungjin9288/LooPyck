import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { buildSearchQualityObservation } from '../lib/search/searchQualityObservation.ts';
import { validateDeploymentProvenance } from './deploymentProvenanceContract.mjs';
import { buildGitWorkspaceProvenance } from './gitWorkspaceProvenance.mjs';

const workspace = process.cwd();
const inputPath = path.resolve(process.argv[2] || 'output/playwright/netlify-search-diagnostics-snapshot.json');
const outputJsonPath = path.resolve(process.argv[3] || 'output/playwright/search-quality-observation-report.json');
const outputMarkdownPath = path.resolve(process.argv[4] || 'output/playwright/search-quality-observation-report.md');

if (!existsSync(inputPath)) {
    throw new Error(`Missing search diagnostics snapshot: ${inputPath}`);
}

const snapshot = JSON.parse(readFileSync(inputPath, 'utf8'));
for (const key of ['summary', 'quality', 'interactionSummary']) {
    if (!snapshot[key] || typeof snapshot[key] !== 'object') {
        throw new Error(`Search diagnostics snapshot is missing ${key}.`);
    }
}
if (!Array.isArray(snapshot.interactionSummary.badgeCohorts)) {
    throw new Error('Search diagnostics snapshot is missing interactionSummary.badgeCohorts.');
}

const observation = buildSearchQualityObservation(snapshot);
const workspaceProvenance = buildGitWorkspaceProvenance(workspace);
const targetHostname = new URL(snapshot.baseUrl).hostname;
const targetName = ['localhost', '127.0.0.1', '::1'].includes(targetHostname) ? 'local' : 'netlify';
const targetKind = targetName === 'local' ? 'local-working-tree' : 'deployed-environment';
const provenancePath = path.resolve(
    process.argv[5] || `output/playwright/${targetName}-deployment-provenance.json`,
);
if (!existsSync(provenancePath)) {
    throw new Error(`Missing deployment provenance evidence: ${provenancePath}`);
}
const deploymentProvenance = JSON.parse(readFileSync(provenancePath, 'utf8'));
const deploymentAudit = validateDeploymentProvenance(deploymentProvenance.deployment);
const commonProvenanceLink = deploymentProvenance.ok === true
    && deploymentProvenance.baseUrl === snapshot.baseUrl
    && deploymentProvenance.targetKind === targetKind
    && deploymentProvenance.expectedCommit === workspaceProvenance.head
    && deploymentProvenance.commitMatchesExpected === true
    && deploymentProvenance.runnerWorkspace?.head === workspaceProvenance.head
    && deploymentProvenance.runnerWorkspace?.fingerprint === workspaceProvenance.fingerprint
    && deploymentAudit.ok;
const targetProvenanceLink = targetKind === 'local-working-tree'
    ? deploymentProvenance.deployment?.provider === 'local'
        && deploymentProvenance.deployment?.workspaceFingerprint === workspaceProvenance.fingerprint
    : deploymentProvenance.deployment?.provider === 'netlify'
        && deploymentProvenance.deployment?.dirty === false;
if (!commonProvenanceLink || !targetProvenanceLink) {
    throw new Error('Search diagnostics target is not linked to the current workspace and deployment provenance.');
}
const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    baseUrl: snapshot.baseUrl,
    targetKind,
    runnerWorkspace: workspaceProvenance,
    deploymentProvenance,
    target: {
        baseUrl: snapshot.baseUrl || null,
        diagnosticsGeneratedAt: snapshot.generatedAt || null,
        diagnosticsLastUpdatedAt: snapshot.summary.lastUpdatedAt || null,
        storage: snapshot.storage || 'unknown',
    },
    evidenceBoundary: {
        privacyBoundary: snapshot.privacyBoundary || null,
        runnerWorkspace: workspaceProvenance,
        deploymentProvenanceClaimed: true,
        note: 'The diagnostics snapshot and served deployment are linked to this report.',
    },
    observation,
};

const cohortRows = observation.badgeCohorts.map((entry) => {
    const uplift = entry.upliftVsNoBadge === null
        ? '-'
        : `${entry.upliftVsNoBadge > 0 ? '+' : ''}${entry.upliftVsNoBadge}%p`;
    return `| ${entry.cohort} | ${entry.impressions} | ${entry.opens} | ${entry.openRate}% | ${uplift} | ${entry.decision} |`;
});
const actionLines = observation.actions.length > 0
    ? observation.actions.map((action) => `- [${action.priority}] ${action.title}: ${action.detail}`)
    : ['- No additional action in the current observation window.'];
const failingSourceLines = observation.sourceHealth.failingSources.length > 0
    ? observation.sourceHealth.failingSources.map((entry) => `- ${entry.source}: ${entry.reason}`)
    : ['- none'];

const markdown = [
    '# Search Quality Observation Report',
    '',
    `Generated at: ${report.generatedAt}`,
    `Target: ${report.target.baseUrl || 'unknown'}`,
    `Target kind: ${report.targetKind}`,
    `Diagnostics storage: ${report.target.storage}`,
    `Observation status: ${observation.status}`,
    '',
    '## Evidence Boundary',
    '',
    `- Target diagnostics generated at: ${report.target.diagnosticsGeneratedAt || 'unknown'}`,
    `- Target diagnostics last updated at: ${report.target.diagnosticsLastUpdatedAt || 'unknown'}`,
    `- Runner workspace fingerprint: ${workspaceProvenance.fingerprint}`,
    '- Deployment provenance claimed: true',
    `- Deployment provider: ${deploymentProvenance.deployment.provider}`,
    `- Deployment commit: ${deploymentProvenance.deployment.commit}`,
    `- Privacy boundary: ${report.evidenceBoundary.privacyBoundary || 'not recorded'}`,
    '',
    '## Search And Compare Signals',
    '',
    `- Tracked searches: ${observation.trackedSearches}`,
    `- Interaction events: ${observation.interactionCount}`,
    `- Strong / mixed / weak: ${observation.quality.strong} / ${observation.quality.mixed} / ${observation.quality.weak}`,
    `- Low-fit share: ${observation.quality.lowFitShare}%`,
    `- Compare-ready ratio: ${observation.quality.compareReadyRatio}%`,
    `- Price-spread capture rate: ${observation.quality.priceSpreadCaptureRate}%`,
    `- Option match precision: ${observation.quality.optionMatchPrecision}%`,
    `- Captured price spread avg / max: ${observation.quality.avgCapturedPriceSpread} / ${observation.quality.maxCapturedPriceSpread}`,
    '',
    '## Badge Cohorts',
    '',
    `Directional sample floor: ${observation.minimumDirectionalImpressions} unique query/product impressions per cohort.`,
    '',
    '| Cohort | Impressions | Opens | Open rate | Uplift vs none | Decision |',
    '|---|---:|---:|---:|---:|---|',
    ...cohortRows,
    '',
    'Uplift is directional only. It is not a statistical-significance or causal-effect claim.',
    '',
    '## Source Health',
    '',
    `- Healthy: ${observation.sourceHealth.healthy}`,
    `- Degraded: ${observation.sourceHealth.degraded}`,
    `- Failing: ${observation.sourceHealth.failing}`,
    `- Disabled: ${observation.sourceHealth.disabled}`,
    `- Other/no-data: ${observation.sourceHealth.other}`,
    '',
    '### Failing Sources',
    '',
    ...failingSourceLines,
    '',
    '## Next Actions',
    '',
    ...actionLines,
    '',
];

mkdirSync(path.dirname(outputJsonPath), { recursive: true });
mkdirSync(path.dirname(outputMarkdownPath), { recursive: true });
writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(outputMarkdownPath, markdown.join('\n'));
process.stdout.write(`${JSON.stringify({ outputJsonPath, outputMarkdownPath, status: observation.status }, null, 2)}\n`);
