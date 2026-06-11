import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const artifactDir = process.env.COMPARE_ENTRY_ARTIFACT_DIR
  ? path.resolve(process.env.COMPARE_ENTRY_ARTIFACT_DIR)
  : path.join(rootDir, 'output', 'playwright');

const inputPaths = {
  actionCardJson: path.join(artifactDir, 'compare-entry-review-next-section-action-card.json'),
  fallbackPreviewJson: path.join(artifactDir, 'compare-entry-mobile-brand-topnav-preview.json'),
  figmaMcpAttemptJson: path.join(artifactDir, 'compare-entry-figma-mcp-attempt.json'),
  figmaMcpAttemptHistoryJson: path.join(artifactDir, 'compare-entry-figma-mcp-attempt-history.json'),
  figmaMcpAttemptHistoryMarkdown: path.join(artifactDir, 'compare-entry-figma-mcp-attempt-history.md'),
  figmaTemplate: path.join(rootDir, 'scripts', 'figmaCompareEntryMobileBrandTopNavTemplate.mjs'),
};

const outputPaths = {
  markdown: path.join(artifactDir, 'compare-entry-figma-retry-packet.md'),
  json: path.join(artifactDir, 'compare-entry-figma-retry-packet.json'),
};

async function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    if (fallback !== null) return fallback;
    throw error;
  }
}

function formatList(items, emptyState = 'none') {
  if (!items.length) return `- ${emptyState}`;
  return items.map((item) => `- ${item}`).join('\n');
}

async function main() {
  await mkdir(artifactDir, { recursive: true });

  const [actionCard, fallbackPreview, templateModule] = await Promise.all([
    readJson(inputPaths.actionCardJson),
    readJson(inputPaths.fallbackPreviewJson, {}),
    import(pathToFileURL(inputPaths.figmaTemplate).href),
  ]);
  const latestMcpAttempt = await readJson(inputPaths.figmaMcpAttemptJson, {});
  const attemptHistory = await readJson(inputPaths.figmaMcpAttemptHistoryJson, {});

  const fallback = actionCard.fallbackPreview ?? null;
  const isTargetSlice =
    actionCard.recommendedFrame === 'CompareEntry/Mobile/Brand-Musinsa' &&
    actionCard.recommendedSection === 'TopNav/Context';
  const templateReady = Boolean(
    templateModule.fileKey &&
      templateModule.description &&
      templateModule.code &&
      templateModule.fileKey === 'Oj35jzmgbwnxzpTTqTcxLi',
  );
  const previewReady =
    fallbackPreview.frame === 'CompareEntry/Mobile/Brand-Musinsa' &&
    fallbackPreview.section === 'TopNav/Context' &&
    fallbackPreview.figmaFileKey === templateModule.fileKey;
  const retryReady = Boolean(isTargetSlice && fallback && templateReady && previewReady);

  const summary = {
    generatedAt: new Date().toISOString(),
    status: retryReady ? 'ready-for-figma-mcp-retry' : 'not-current-retry-target',
    retryReady,
    target: {
      surface: actionCard.recommendedSurface?.surface ?? null,
      route: actionCard.recommendedSurface?.route ?? null,
      frame: actionCard.recommendedFrame ?? null,
      section: actionCard.recommendedSection ?? null,
      sectionPhase: actionCard.sectionPhase ?? null,
    },
    figma: {
      fileKey: templateModule.fileKey ?? null,
      description: templateModule.description ?? null,
      templatePath: inputPaths.figmaTemplate,
      templateCodeBytes: Buffer.byteLength(templateModule.code ?? '', 'utf8'),
      skillNames: 'figma-use,figma-generate-design',
    },
    fallbackPreview: fallback
      ? {
          reason: fallback.reason,
          previewHtml: fallback.previewHtml,
          previewJson: fallback.previewJson,
          generatorCommand: fallback.generatorCommand,
          worksheetPolicy: fallback.worksheetPolicy,
        }
      : null,
    latestMcpAttempt: latestMcpAttempt.status
      ? {
          generatedAt: latestMcpAttempt.generatedAt ?? null,
          status: latestMcpAttempt.status,
          operation: latestMcpAttempt.operation ?? null,
          tool: latestMcpAttempt.tool ?? null,
          message: latestMcpAttempt.message ?? null,
          paywallUrl: latestMcpAttempt.paywallUrl ?? null,
          artifactPath: inputPaths.figmaMcpAttemptJson,
        }
      : null,
    mcpAttemptHistory: Array.isArray(attemptHistory.attempts)
      ? {
          totalAttempts: attemptHistory.totalAttempts ?? attemptHistory.attempts.length,
          latestStatus: attemptHistory.latestAttempt?.status ?? null,
          latestOperation: attemptHistory.latestAttempt?.operation ?? null,
          latestTool: attemptHistory.latestAttempt?.tool ?? null,
          markdownPath: inputPaths.figmaMcpAttemptHistoryMarkdown,
          jsonPath: inputPaths.figmaMcpAttemptHistoryJson,
          recentAttempts: attemptHistory.attempts.slice(-5).map((attempt) => ({
            generatedAt: attempt.generatedAt ?? null,
            status: attempt.status ?? null,
            operation: attempt.operation ?? null,
            tool: attempt.tool ?? null,
            message: attempt.message ?? null,
          })),
        }
      : null,
    validation: {
      isTargetSlice,
      templateReady,
      previewReady,
      actionCardPath: inputPaths.actionCardJson,
      fallbackPreviewPath: inputPaths.fallbackPreviewJson,
    },
    nextSteps: retryReady
      ? [
          'Run the Figma template code with use_figma when MCP rate limit is available.',
          'After Figma returns frameId and sectionId, check only CompareEntry/Mobile/Brand-Musinsa -> TopNav/Context in the manual build worksheet.',
          'Run npm run ntl:compare-entry-review-finalize and npm run ntl:compare-entry-review-ready-check.',
        ]
      : [
          'No current Figma retry packet is required for this next section.',
          'Continue with the recommended action card and standard Compare Entry review flow.',
        ],
  };

  await writeFile(outputPaths.json, JSON.stringify(summary, null, 2) + '\n', 'utf8');

  const markdown = `# Compare Entry Figma Retry Packet

## Summary

- generatedAt: \`${summary.generatedAt}\`
- status: \`${summary.status}\`
- retryReady: \`${summary.retryReady ? 'true' : 'false'}\`
- target: \`${summary.target.surface ?? 'none'} -> ${summary.target.frame ?? 'none'} -> ${summary.target.section ?? 'none'}\`
- route: \`${summary.target.route ?? 'none'}\`
- sectionPhase: \`${summary.target.sectionPhase ?? 'none'}\`

## Figma Execution

- fileKey: \`${summary.figma.fileKey ?? 'none'}\`
- description: \`${summary.figma.description ?? 'none'}\`
- templatePath: \`${summary.figma.templatePath}\`
- templateCodeBytes: \`${summary.figma.templateCodeBytes}\`
- skillNames: \`${summary.figma.skillNames}\`

## Fallback Preview

- reason: \`${summary.fallbackPreview?.reason ?? 'none'}\`
- preview html: \`${summary.fallbackPreview?.previewHtml ?? 'none'}\`
- preview json: \`${summary.fallbackPreview?.previewJson ?? 'none'}\`
- generator command: \`${summary.fallbackPreview?.generatorCommand ?? 'none'}\`
- worksheet policy: \`${summary.fallbackPreview?.worksheetPolicy ?? 'none'}\`

## Latest MCP Attempt

- generatedAt: \`${summary.latestMcpAttempt?.generatedAt ?? 'none'}\`
- status: \`${summary.latestMcpAttempt?.status ?? 'none'}\`
- operation: \`${summary.latestMcpAttempt?.operation ?? 'none'}\`
- tool: \`${summary.latestMcpAttempt?.tool ?? 'none'}\`
- message: \`${summary.latestMcpAttempt?.message ?? 'none'}\`
- paywallUrl: \`${summary.latestMcpAttempt?.paywallUrl ?? 'none'}\`
- artifact: \`${summary.latestMcpAttempt?.artifactPath ?? 'none'}\`

## MCP Attempt History

- totalAttempts: \`${summary.mcpAttemptHistory?.totalAttempts ?? 0}\`
- latestStatus: \`${summary.mcpAttemptHistory?.latestStatus ?? 'none'}\`
- latestOperation: \`${summary.mcpAttemptHistory?.latestOperation ?? 'none'}\`
- latestTool: \`${summary.mcpAttemptHistory?.latestTool ?? 'none'}\`
- history markdown: \`${summary.mcpAttemptHistory?.markdownPath ?? 'none'}\`
- history json: \`${summary.mcpAttemptHistory?.jsonPath ?? 'none'}\`

## Validation

- isTargetSlice: \`${summary.validation.isTargetSlice ? 'true' : 'false'}\`
- templateReady: \`${summary.validation.templateReady ? 'true' : 'false'}\`
- previewReady: \`${summary.validation.previewReady ? 'true' : 'false'}\`
- actionCardPath: \`${summary.validation.actionCardPath}\`
- fallbackPreviewPath: \`${summary.validation.fallbackPreviewPath}\`

## Next Steps

${formatList(summary.nextSteps)}
`;

  await writeFile(outputPaths.markdown, markdown, 'utf8');

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        retryReady: summary.retryReady,
        status: summary.status,
        markdownPath: outputPaths.markdown,
        jsonPath: outputPaths.json,
      },
      null,
      2,
    ) + '\n',
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
