import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const artifactDir = process.env.COMPARE_ENTRY_ARTIFACT_DIR
  ? path.resolve(process.env.COMPARE_ENTRY_ARTIFACT_DIR)
  : path.join(rootDir, 'output', 'playwright');
const sessionsDir = path.join(artifactDir, 'compare-entry-review-sessions');

const outputPaths = {
  markdown: path.join(artifactDir, 'compare-entry-review-delta.md'),
  json: path.join(artifactDir, 'compare-entry-review-delta.json'),
};

const sessionArtifactNames = {
  manifest: 'manifest.json',
  status: 'compare-entry-review-status.json',
  gate: 'compare-entry-review-gate.json',
  closeout: 'compare-entry-review-closeout-draft.json',
  approval: 'compare-entry-approval-board.json',
  markdown: 'compare-entry-review-delta.md',
  json: 'compare-entry-review-delta.json',
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function readJsonIfExists(filePath) {
  try {
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readLatestSessions() {
  const entries = await readdir(sessionsDir, { withFileTypes: true });
  const sessions = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const dir = path.join(sessionsDir, entry.name);
    const manifest = await readJsonIfExists(path.join(dir, sessionArtifactNames.manifest));
    if (!manifest) continue;

    sessions.push({
      sessionName: entry.name,
      dir,
      manifest,
      status: await readJsonIfExists(path.join(dir, sessionArtifactNames.status)),
      gate: await readJsonIfExists(path.join(dir, sessionArtifactNames.gate)),
      closeout: await readJsonIfExists(path.join(dir, sessionArtifactNames.closeout)),
      approval: await readJsonIfExists(path.join(dir, sessionArtifactNames.approval)),
    });
  }

  sessions.sort((a, b) => String(b.manifest.sessionId ?? b.sessionName).localeCompare(String(a.manifest.sessionId ?? a.sessionName)));
  return sessions;
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return 'unknown';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

function buildChange(key, label, previousValue, currentValue, hasPreviousSession) {
  const changed = hasPreviousSession
    ? JSON.stringify(previousValue ?? null) !== JSON.stringify(currentValue ?? null)
    : false;
  return {
    key,
    label,
    changed,
    previousValue: previousValue ?? null,
    currentValue: currentValue ?? null,
    previousLabel: formatValue(previousValue),
    currentLabel: formatValue(currentValue),
  };
}

function formatList(items, emptyState) {
  if (!items.length) return `- ${emptyState}`;
  return items.map((item) => `- ${item}`).join('\n');
}

function buildNextAction(hasPreviousSession, changedFields, currentReadyToUnblock) {
  if (!hasPreviousSession) {
    return 'No previous archived session exists yet. Treat the latest archived review session as the baseline.';
  }

  if (!changedFields.length) {
    return 'No meaningful delta was detected between the latest two archived sessions. Review can reuse the previous reference without re-triaging content drift.';
  }

  if (currentReadyToUnblock) {
    return 'The latest session changed and the current gate is READY. Review the changed fields once, then post the approval closeout.';
  }

  return 'The latest session changed while the gate is still BLOCKED. Review the changed fields first, then update worksheet and decision log before rerunning the gate.';
}

async function writeSessionCopies(sessionDir, markdown, jsonText) {
  const markdownPath = path.join(sessionDir, sessionArtifactNames.markdown);
  const jsonPath = path.join(sessionDir, sessionArtifactNames.json);

  await writeFile(markdownPath, markdown, 'utf8');
  await writeFile(jsonPath, jsonText, 'utf8');

  const manifestPath = path.join(sessionDir, sessionArtifactNames.manifest);
  const manifest = await readJsonIfExists(manifestPath);
  if (manifest) {
    const fileSet = new Set(Array.isArray(manifest.files) ? manifest.files : []);
    fileSet.add(markdownPath);
    fileSet.add(jsonPath);
    manifest.files = [...fileSet].sort();
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  }

  return { markdownPath, jsonPath };
}

async function main() {
  await mkdir(artifactDir, { recursive: true });
  await mkdir(sessionsDir, { recursive: true });

  const sessions = await readLatestSessions();
  const current = sessions[0] ?? null;
  const previous = sessions[1] ?? null;
  const hasPreviousSession = Boolean(previous);

  const changes = current
    ? [
        buildChange('query', 'Search Query', previous?.manifest.query, current.manifest.query, hasPreviousSession),
        buildChange(
          'displayedCount',
          'Displayed Count',
          previous?.manifest.displayedCount,
          current.manifest.displayedCount,
          hasPreviousSession,
        ),
        buildChange(
          'generatedAt',
          'Generated At',
          previous?.manifest.generatedAt,
          current.manifest.generatedAt,
          hasPreviousSession,
        ),
        buildChange(
          'readyToUnblock',
          'Ready To Unblock',
          previous?.status?.readyToUnblock,
          current.status?.readyToUnblock,
          hasPreviousSession,
        ),
        buildChange('gateState', 'Gate State', previous?.gate?.gateState, current.gate?.gateState, hasPreviousSession),
        buildChange(
          'activeBlockerKind',
          'Active Blocker',
          previous?.gate?.activeBlocker?.kind,
          current.gate?.activeBlocker?.kind,
          hasPreviousSession,
        ),
        buildChange(
          'activeBlockerTarget',
          'Active Blocker Target',
          previous?.gate?.activeBlocker?.target,
          current.gate?.activeBlocker?.target,
          hasPreviousSession,
        ),
        buildChange(
          'activeBlockerLatestStatus',
          'Active Blocker Latest Status',
          previous?.gate?.activeBlocker?.latestStatus,
          current.gate?.activeBlocker?.latestStatus,
          hasPreviousSession,
        ),
        buildChange(
          'activeBlockerLatestOperation',
          'Active Blocker Latest Operation',
          previous?.gate?.activeBlocker?.latestOperation,
          current.gate?.activeBlocker?.latestOperation,
          hasPreviousSession,
        ),
        buildChange(
          'missingCount',
          'Missing Count',
          previous?.status?.missing?.length,
          current.status?.missing?.length,
          hasPreviousSession,
        ),
        buildChange(
          'recommendedState',
          'Recommended State',
          previous?.closeout?.recommendedState,
          current.closeout?.recommendedState,
          hasPreviousSession,
        ),
      ]
    : [];

  const changedFields = changes.filter((entry) => entry.changed);
  const readyToUnblock = Boolean(current?.gate?.readyToUnblock ?? current?.status?.readyToUnblock);

  const delta = {
    generatedAt: new Date().toISOString(),
    hasCurrentSession: Boolean(current),
    hasPreviousSession,
    currentSessionId: current?.manifest.sessionId ?? current?.sessionName ?? null,
    previousSessionId: previous?.manifest.sessionId ?? previous?.sessionName ?? null,
    currentGeneratedAt: current?.manifest.generatedAt ?? null,
    previousGeneratedAt: previous?.manifest.generatedAt ?? null,
    readyToUnblock,
    changed: changedFields.length > 0,
    changedFields,
    allFields: changes,
    nextAction: buildNextAction(hasPreviousSession, changedFields, readyToUnblock),
  };

  const markdown = `# Compare Entry Review Delta

## Session Pair

- currentSession: \`${delta.currentSessionId ?? 'none'}\`
- previousSession: \`${delta.previousSessionId ?? 'none'}\`
- currentGeneratedAt: \`${delta.currentGeneratedAt ?? 'unknown'}\`
- previousGeneratedAt: \`${delta.previousGeneratedAt ?? 'unknown'}\`
- changed: \`${delta.changed ? 'true' : 'false'}\`
- readyToUnblock: \`${delta.readyToUnblock ? 'true' : 'false'}\`

## Changed Fields

${formatList(
  changedFields.map(
    (entry) => `${entry.label}: \`${entry.previousLabel}\` -> \`${entry.currentLabel}\``,
  ),
  previous ? 'no changed fields' : 'no previous session to compare',
)}

## All Fields

${formatList(
  changes.map(
    (entry) =>
      `${entry.label}: \`${entry.previousLabel}\` -> \`${entry.currentLabel}\`${entry.changed ? ' [changed]' : ''}`,
  ),
  'no current session available',
)}

## Next Action

- ${delta.nextAction}
`;

  const jsonText = JSON.stringify(delta, null, 2) + '\n';

  await writeFile(outputPaths.markdown, markdown, 'utf8');
  await writeFile(outputPaths.json, jsonText, 'utf8');

  let sessionMarkdownPath = null;
  let sessionJsonPath = null;
  if (current) {
    const sessionCopies = await writeSessionCopies(current.dir, markdown, jsonText);
    sessionMarkdownPath = sessionCopies.markdownPath;
    sessionJsonPath = sessionCopies.jsonPath;
  }

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        markdownPath: outputPaths.markdown,
        jsonPath: outputPaths.json,
        sessionMarkdownPath,
        sessionJsonPath,
        hasPreviousSession: delta.hasPreviousSession,
        changedFields: changedFields.length,
        readyToUnblock: delta.readyToUnblock,
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
