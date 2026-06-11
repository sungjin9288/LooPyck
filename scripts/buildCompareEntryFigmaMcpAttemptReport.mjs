import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const artifactDir = process.env.COMPARE_ENTRY_ARTIFACT_DIR
  ? path.resolve(process.env.COMPARE_ENTRY_ARTIFACT_DIR)
  : path.join(rootDir, 'output', 'playwright');

const retryPacketPath = path.join(artifactDir, 'compare-entry-figma-retry-packet.json');

const outputPaths = {
  markdown: path.join(artifactDir, 'compare-entry-figma-mcp-attempt.md'),
  json: path.join(artifactDir, 'compare-entry-figma-mcp-attempt.json'),
  historyMarkdown: path.join(artifactDir, 'compare-entry-figma-mcp-attempt-history.md'),
  historyJson: path.join(artifactDir, 'compare-entry-figma-mcp-attempt-history.json'),
};

async function readRetryPacket() {
  try {
    return JSON.parse(await readFile(retryPacketPath, 'utf8'));
  } catch {
    return null;
  }
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function envValue(name, fallback) {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : fallback;
}

function envFlag(name) {
  return process.env[name] === '1' || process.env[name] === 'true';
}

function attemptKey(attempt) {
  return [
    attempt.generatedAt ?? '',
    attempt.status ?? '',
    attempt.operation ?? '',
    attempt.tool ?? '',
    attempt.message ?? '',
  ].join('\u0000');
}

function compactAttempt(attempt) {
  return {
    generatedAt: attempt.generatedAt ?? null,
    status: attempt.status ?? 'unknown',
    operation: attempt.operation ?? 'unspecified',
    tool: attempt.tool ?? 'unknown',
    fileKey: attempt.fileKey ?? null,
    message: attempt.message ?? null,
    paywallUrl: attempt.paywallUrl ?? null,
    target: attempt.target ?? null,
    worksheetPolicy: attempt.worksheetPolicy ?? null,
  };
}

function appendAttemptHistory(existingHistory, previousLatest, summary) {
  const candidates = [
    ...(Array.isArray(existingHistory?.attempts) ? existingHistory.attempts : []),
    ...(previousLatest?.status ? [previousLatest] : []),
    summary,
  ].map(compactAttempt);

  const seen = new Set();
  const deduped = [];
  for (const attempt of candidates) {
    const key = attemptKey(attempt);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(attempt);
  }

  const attempts = deduped.slice(-20);
  return {
    generatedAt: new Date().toISOString(),
    totalAttempts: attempts.length,
    latestAttempt: attempts.at(-1) ?? null,
    attempts,
  };
}

function formatHistoryRows(attempts) {
  if (!attempts.length) return '| none | none | none | none | none |\n';
  return attempts
    .map(
      (attempt) =>
        `| ${attempt.generatedAt ?? 'none'} | ${attempt.status ?? 'none'} | ${attempt.operation ?? 'none'} | ${attempt.tool ?? 'none'} | ${attempt.message ?? 'none'} |`,
    )
    .join('\n');
}

async function main() {
  await mkdir(artifactDir, { recursive: true });

  const retryPacket = await readRetryPacket();
  const [existingHistory, previousLatest] = await Promise.all([
    readJson(outputPaths.historyJson, null),
    readJson(outputPaths.json, null),
  ]);
  const reuseLatest = envFlag('COMPARE_ENTRY_FIGMA_MCP_ATTEMPT_REUSE_LATEST');
  const summary =
    reuseLatest && previousLatest?.status
      ? previousLatest
      : {
          generatedAt: new Date().toISOString(),
          status: envValue('COMPARE_ENTRY_FIGMA_MCP_ATTEMPT_STATUS', 'not-run'),
          operation: envValue('COMPARE_ENTRY_FIGMA_MCP_ATTEMPT_OPERATION', 'unspecified'),
          tool: envValue('COMPARE_ENTRY_FIGMA_MCP_ATTEMPT_TOOL', 'mcp__figma__.use_figma'),
          fileKey:
            envValue('COMPARE_ENTRY_FIGMA_MCP_ATTEMPT_FILE_KEY', '') ||
            retryPacket?.figma?.fileKey ||
            'Oj35jzmgbwnxzpTTqTcxLi',
          message: envValue('COMPARE_ENTRY_FIGMA_MCP_ATTEMPT_MESSAGE', 'No MCP attempt message recorded.'),
          paywallUrl: envValue(
            'COMPARE_ENTRY_FIGMA_MCP_ATTEMPT_PAYWALL_URL',
            'https://www.figma.com/files/team/1594898637194729607/all-projects?upgrade=mcp_rate_limit_paywall',
          ),
          target: retryPacket?.target ?? {
            surface: 'Brand-Musinsa',
            route: '/brand/musinsa',
            frame: 'CompareEntry/Mobile/Brand-Musinsa',
            section: 'TopNav/Context',
            sectionPhase: 'Build Pending',
          },
          retryPacketPath,
          worksheetPolicy: 'Do not check the build worksheet until the Figma node is actually created.',
        };

  await writeFile(outputPaths.json, JSON.stringify(summary, null, 2) + '\n', 'utf8');
  const history = appendAttemptHistory(existingHistory, previousLatest, summary);
  await writeFile(outputPaths.historyJson, JSON.stringify(history, null, 2) + '\n', 'utf8');

  const markdown = `# Compare Entry Figma MCP Attempt

## Summary

- generatedAt: \`${summary.generatedAt}\`
- status: \`${summary.status}\`
- operation: \`${summary.operation}\`
- tool: \`${summary.tool}\`
- fileKey: \`${summary.fileKey}\`
- target: \`${summary.target.surface ?? 'none'} -> ${summary.target.frame ?? 'none'} -> ${summary.target.section ?? 'none'}\`
- route: \`${summary.target.route ?? 'none'}\`

## MCP Result

- message: \`${summary.message}\`
- paywallUrl: \`${summary.paywallUrl}\`

## Retry Context

- retryPacketPath: \`${summary.retryPacketPath}\`
- worksheetPolicy: \`${summary.worksheetPolicy}\`
`;

  await writeFile(outputPaths.markdown, markdown, 'utf8');

  const historyMarkdown = `# Compare Entry Figma MCP Attempt History

## Summary

- generatedAt: \`${history.generatedAt}\`
- totalAttempts: \`${history.totalAttempts}\`
- latestStatus: \`${history.latestAttempt?.status ?? 'none'}\`
- latestOperation: \`${history.latestAttempt?.operation ?? 'none'}\`
- latestTool: \`${history.latestAttempt?.tool ?? 'none'}\`

## Attempts

| generatedAt | status | operation | tool | message |
| --- | --- | --- | --- | --- |
${formatHistoryRows(history.attempts)}
`;

  await writeFile(outputPaths.historyMarkdown, historyMarkdown, 'utf8');

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        status: summary.status,
        operation: summary.operation,
        markdownPath: outputPaths.markdown,
        jsonPath: outputPaths.json,
        historyMarkdownPath: outputPaths.historyMarkdown,
        historyJsonPath: outputPaths.historyJson,
        totalAttempts: history.totalAttempts,
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
