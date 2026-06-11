import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const artifactDir = process.env.COMPARE_ENTRY_ARTIFACT_DIR
  ? path.resolve(process.env.COMPARE_ENTRY_ARTIFACT_DIR)
  : path.join(rootDir, 'output', 'playwright');

const paths = {
  gate: path.join(artifactDir, 'compare-entry-review-gate.json'),
  retryPacket: path.join(artifactDir, 'compare-entry-figma-retry-packet.json'),
  attemptHistory: path.join(artifactDir, 'compare-entry-figma-mcp-attempt-history.json'),
  captureReference: path.join(artifactDir, 'compare-entry-figma-capture-reference.md'),
  manualNodeEvidence: path.join(artifactDir, 'compare-entry-manual-node-evidence.md'),
  preview: path.join(artifactDir, 'compare-entry-mobile-brand-topnav-preview.json'),
  manualUiSlicePacket: path.join(artifactDir, 'compare-entry-manual-ui-slice-packet.md'),
  actionCard: path.join(artifactDir, 'compare-entry-review-next-section-action-card.html'),
  manualChecklist: path.join(rootDir, 'docs', 'COMPARE_ENTRY_FUNNEL_MANUAL_FIGMA_BUILD_CHECKLIST.md'),
  outputJson: path.join(artifactDir, 'compare-entry-figma-unblock-plan.json'),
  outputMarkdown: path.join(artifactDir, 'compare-entry-figma-unblock-plan.md'),
};

async function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function formatList(items) {
  return items.map((item) => `- ${item}`).join('\n');
}

function buildStrategies({ gate, retryPacket, attemptHistory, preview }) {
  const paywallUrl =
    retryPacket?.latestAttempt?.paywallUrl ??
    retryPacket?.paywallUrl ??
    'https://www.figma.com/files/team/1594898637194729607/all-projects?upgrade=mcp_rate_limit_paywall';
  const target =
    gate?.activeBlocker?.target ??
    retryPacket?.target ??
    'Brand-Musinsa -> CompareEntry/Mobile/Brand-Musinsa -> TopNav/Context';
  const templatePath =
    retryPacket?.templatePath ??
    preview?.templatePath ??
    path.join(rootDir, 'scripts', 'figmaCompareEntryMobileBrandTopNavTemplate.mjs');

  return [
    {
      id: 'upgrade-or-reset-mcp-quota',
      recommended: true,
      status: 'external-action-required',
      label: 'Upgrade Figma plan or wait for MCP quota reset',
      why: 'Preserves the current Design+Code contract and lets the prepared template create a real frameId/sectionId.',
      ownerAction: `Open ${paywallUrl}, resolve MCP quota, then rerun the template in ${templatePath}.`,
      afterAction: [
        `Confirm Figma returns frameId and sectionId for ${target}.`,
        'Check only that created slice in compare-entry-manual-build-worksheet.md.',
        'Run npm run ntl:compare-entry-review-finalize.',
        'Run npm run ntl:compare-entry-review-ready-check.',
      ],
    },
    {
      id: 'manual-figma-ui-build',
      recommended: true,
      status: 'ready-local-artifacts',
      label: 'Build the blocked slice manually in Figma UI',
      why: 'Avoids MCP quota entirely while still satisfying the real Figma node requirement.',
      ownerAction: `Open the Figma file ${retryPacket?.fileKey ?? preview?.figmaFileKey ?? 'Oj35jzmgbwnxzpTTqTcxLi'} and recreate ${target} using the fallback preview and manual checklist.`,
      afterAction: [
        `Use ${paths.actionCard} as the first local execution card.`,
        `If available, use ${paths.captureReference} as the raw Figma pixel reference, but do not check the worksheet from the raw capture alone.`,
        `Use ${preview?.outputs?.html ?? path.join(artifactDir, 'compare-entry-mobile-brand-topnav-preview.html')} as visual reference.`,
        `Use ${paths.manualUiSlicePacket} for exact node names, sizes, colors, copy, and acceptance checks.`,
        `Use ${paths.manualNodeEvidence} to record verified frameId/sectionId before checking the worksheet.`,
        `Use ${paths.manualChecklist} for naming, section order, and worksheet policy.`,
        'After the real Figma node exists, record the frameId/sectionId in the task ledger and check only the matching worksheet item.',
      ],
    },
    {
      id: 'code-first-policy-override',
      recommended: false,
      status: 'requires-user-approval',
      label: 'Override the gate and proceed code-first',
      why: 'This breaks the current user-approved SUN-10 -> SUN-11/SUN-12 sequence and weakens design review evidence.',
      ownerAction: 'Only proceed if the user explicitly changes the completion criterion from Design+Code to Code-first.',
      afterAction: [
        'Document the policy change in tasks/todo.md and Compare Entry docs.',
        'Keep SUN-10 marked as design follow-up instead of approved design gate.',
        'Run typecheck, adapter tests, build, and browser smoke for the code-first implementation.',
      ],
    },
  ];
}

async function main() {
  await mkdir(artifactDir, { recursive: true });

  const gate = await readJson(paths.gate, {});
  const retryPacket = await readJson(paths.retryPacket, {});
  const attemptHistory = await readJson(paths.attemptHistory, {});
  const preview = await readJson(paths.preview, {});
  const strategies = buildStrategies({ gate, retryPacket, attemptHistory, preview });

  const activeBlocker = {
    kind: gate?.activeBlocker?.kind ?? 'unknown',
    target:
      gate?.activeBlocker?.target ??
      retryPacket?.target ??
      'Brand-Musinsa -> CompareEntry/Mobile/Brand-Musinsa -> TopNav/Context',
    latestStatus: gate?.activeBlocker?.latestStatus ?? retryPacket?.latestAttempt?.status ?? 'unknown',
    latestOperation: gate?.activeBlocker?.latestOperation ?? retryPacket?.latestAttempt?.operation ?? 'unknown',
    latestTool: gate?.activeBlocker?.latestTool ?? retryPacket?.latestAttempt?.tool ?? 'unknown',
  };

  const payload = {
    generatedAt: new Date().toISOString(),
    status: activeBlocker.kind === 'figma-mcp-rate-limit' ? 'blocked-with-unblock-options' : 'review-current-gate',
    gateState: gate?.gateState ?? 'unknown',
    readyToUnblock: gate?.readyToUnblock ?? false,
    activeBlocker,
    attemptHistoryTotal: attemptHistory?.totalAttempts ?? retryPacket?.mcpAttemptHistory?.totalAttempts ?? 0,
    recommendedStrategyIds: strategies.filter((strategy) => strategy.recommended).map((strategy) => strategy.id),
    worksheetPolicy:
      retryPacket?.worksheetPolicy ??
      preview?.worksheetPolicy ??
      'Do not check the build worksheet until the Figma node is actually created.',
    artifacts: {
      gate: paths.gate,
      retryPacket: paths.retryPacket,
      attemptHistory: paths.attemptHistory,
      captureReference: paths.captureReference,
      manualNodeEvidence: paths.manualNodeEvidence,
      fallbackPreviewHtml: preview?.outputs?.html ?? path.join(artifactDir, 'compare-entry-mobile-brand-topnav-preview.html'),
      fallbackPreviewJson: paths.preview,
      manualUiSlicePacket: paths.manualUiSlicePacket,
      actionCard: paths.actionCard,
      manualChecklist: paths.manualChecklist,
    },
    strategies,
  };

  await writeFile(paths.outputJson, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  const markdown = `# Compare Entry Figma Unblock Plan

## Current State

- generatedAt: \`${payload.generatedAt}\`
- status: \`${payload.status}\`
- gateState: \`${payload.gateState}\`
- readyToUnblock: \`${payload.readyToUnblock}\`
- activeBlocker: \`${activeBlocker.kind}\`
- target: \`${activeBlocker.target}\`
- latestStatus: \`${activeBlocker.latestStatus}\`
- latestOperation: \`${activeBlocker.latestOperation}\`
- latestTool: \`${activeBlocker.latestTool}\`
- attemptHistoryTotal: \`${payload.attemptHistoryTotal}\`
- worksheetPolicy: \`${payload.worksheetPolicy}\`

## Recommended Decision

Use either \`upgrade-or-reset-mcp-quota\` or \`manual-figma-ui-build\`.

Do not use \`code-first-policy-override\` unless the user explicitly changes the completion criterion away from \`Design+Code\`.

## Unblock Strategies

${strategies
  .map(
    (strategy) => `### ${strategy.id}

- recommended: \`${strategy.recommended}\`
- status: \`${strategy.status}\`
- label: ${strategy.label}
- why: ${strategy.why}
- ownerAction: ${strategy.ownerAction}

After action:

${formatList(strategy.afterAction)}
`,
  )
  .join('\n')}

## Artifact Open Order

1. \`${payload.artifacts.actionCard}\`
2. \`${payload.artifacts.captureReference}\`
3. \`${payload.artifacts.manualNodeEvidence}\`
4. \`${payload.artifacts.fallbackPreviewHtml}\`
5. \`${payload.artifacts.manualUiSlicePacket}\`
6. \`${payload.artifacts.retryPacket}\`
7. \`${payload.artifacts.manualChecklist}\`
8. \`${payload.artifacts.gate}\`
9. \`${payload.artifacts.attemptHistory}\`

## Next Command

\`\`\`bash
npm run ntl:compare-entry-figma-unblock-plan
\`\`\`
`;

  await writeFile(paths.outputMarkdown, markdown, 'utf8');

  console.log(
    JSON.stringify(
      {
        ok: true,
        status: payload.status,
        gateState: payload.gateState,
        activeBlocker: activeBlocker.kind,
        attemptHistoryTotal: payload.attemptHistoryTotal,
        markdownPath: paths.outputMarkdown,
        jsonPath: paths.outputJson,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
