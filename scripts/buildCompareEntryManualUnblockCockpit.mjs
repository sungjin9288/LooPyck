import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const artifactDir = process.env.COMPARE_ENTRY_ARTIFACT_DIR
  ? path.resolve(process.env.COMPARE_ENTRY_ARTIFACT_DIR)
  : path.join(rootDir, 'output', 'playwright');

const inputPaths = {
  gate: path.join(artifactDir, 'compare-entry-review-gate.json'),
  actionCard: path.join(artifactDir, 'compare-entry-review-next-section-action-card.json'),
  applyCommand: path.join(artifactDir, 'compare-entry-manual-node-apply-command.json'),
  evidence: path.join(artifactDir, 'compare-entry-manual-node-evidence.json'),
  slicePacket: path.join(artifactDir, 'compare-entry-manual-ui-slice-packet.json'),
  unblockPlan: path.join(artifactDir, 'compare-entry-figma-unblock-plan.json'),
};

const outputPaths = {
  html: path.join(artifactDir, 'compare-entry-manual-unblock-cockpit.html'),
  markdown: path.join(artifactDir, 'compare-entry-manual-unblock-cockpit.md'),
  json: path.join(artifactDir, 'compare-entry-manual-unblock-cockpit.json'),
};

async function readJson(filePath, fallback = {}) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatList(items, emptyState = 'none') {
  if (!items.length) return `- ${emptyState}`;
  return items.map((item) => `- ${item}`).join('\n');
}

function formatHtmlList(items, emptyState = 'none') {
  if (!items.length) return `<li>${escapeHtml(emptyState)}</li>`;
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
}

async function main() {
  await mkdir(artifactDir, { recursive: true });

  const [gate, actionCard, applyCommand, evidence, slicePacket, unblockPlan] = await Promise.all([
    readJson(inputPaths.gate),
    readJson(inputPaths.actionCard),
    readJson(inputPaths.applyCommand),
    readJson(inputPaths.evidence),
    readJson(inputPaths.slicePacket),
    readJson(inputPaths.unblockPlan),
  ]);

  const targetLabel =
    applyCommand.targetLabel ??
    gate?.activeBlocker?.target ??
    'Brand-Musinsa -> CompareEntry/Mobile/Brand-Musinsa -> TopNav/Context';
  const requiredChecks = applyCommand.requiredBeforeRunning ?? [
    'Frame name exactly matches CompareEntry/Mobile/Brand-Musinsa.',
    'Section name exactly matches TopNav/Context.',
    'Visual slice matches compare-entry-manual-ui-slice-packet.md or the approved preview.',
  ];
  const command =
    applyCommand.command ??
    [
      'npm run ntl:compare-entry-manual-node-apply -- \\',
      "  'https://www.figma.com/design/Oj35jzmgbwnxzpTTqTcxLi/LooPyck?node-id=FRAME-NODE-ID' \\",
      "  'https://www.figma.com/design/Oj35jzmgbwnxzpTTqTcxLi/LooPyck?node-id=SECTION-NODE-ID' \\",
      '  CONTRACT_VERIFIED',
    ].join('\n');

  const links = {
    preview: path.join(artifactDir, 'compare-entry-mobile-brand-topnav-preview.html'),
    slicePacket: path.join(artifactDir, 'compare-entry-manual-ui-slice-packet.md'),
    applyCommand: path.join(artifactDir, 'compare-entry-manual-node-apply-command.md'),
    evidence: path.join(artifactDir, 'compare-entry-manual-node-evidence.md'),
    gate: path.join(artifactDir, 'compare-entry-review-gate.md'),
    actionCard: path.join(artifactDir, 'compare-entry-review-next-section-action-card.html'),
    unblockPlan: path.join(artifactDir, 'compare-entry-figma-unblock-plan.md'),
    buildWorksheet: path.join(artifactDir, 'compare-entry-manual-build-worksheet.md'),
    manualChecklist: path.join(rootDir, 'docs', 'COMPARE_ENTRY_FUNNEL_MANUAL_FIGMA_BUILD_CHECKLIST.md'),
  };

  const payload = {
    generatedAt: new Date().toISOString(),
    status: evidence?.readyForWorksheetCheck
      ? 'ready-evidence-present'
      : 'manual-figma-node-urls-required',
    gateState: gate?.gateState ?? 'unknown',
    readyToUnblock: Boolean(gate?.readyToUnblock),
    activeBlocker: gate?.activeBlocker ?? null,
    targetLabel,
    recommendedRoute:
      actionCard?.recommendedSurface?.route ?? applyCommand?.target?.route ?? slicePacket?.route ?? '/brand/musinsa',
    attemptHistoryTotal: unblockPlan?.attemptHistoryTotal ?? null,
    evidence: {
      status: evidence?.status ?? 'unknown',
      readyForWorksheetCheck: Boolean(evidence?.readyForWorksheetCheck),
      frameId: evidence?.observed?.frameId || null,
      sectionId: evidence?.observed?.sectionId || null,
    },
    command,
    requiredChecks,
    links,
  };

  await writeFile(outputPaths.json, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  const markdown = `# Compare Entry Manual Unblock Cockpit

## Summary

- generatedAt: \`${payload.generatedAt}\`
- status: \`${payload.status}\`
- gateState: \`${payload.gateState}\`
- readyToUnblock: \`${payload.readyToUnblock}\`
- activeBlocker: \`${payload.activeBlocker?.kind ?? 'none'}\`
- target: \`${payload.targetLabel}\`
- route: \`${payload.recommendedRoute}\`
- attemptHistoryTotal: \`${payload.attemptHistoryTotal ?? 'unknown'}\`

## Required Checks

${formatList(payload.requiredChecks)}

## Copy-Ready Command

\`\`\`bash
${payload.command}
\`\`\`

## Evidence

- status: \`${payload.evidence.status}\`
- readyForWorksheetCheck: \`${payload.evidence.readyForWorksheetCheck}\`
- frameId: \`${payload.evidence.frameId ?? 'none'}\`
- sectionId: \`${payload.evidence.sectionId ?? 'none'}\`

## Links

${Object.entries(payload.links).map(([label, value]) => `- ${label}: \`${value}\``).join('\n')}
`;

  await writeFile(outputPaths.markdown, markdown, 'utf8');

  const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Compare Entry Manual Unblock Cockpit</title>
  <style>
    :root { color-scheme: dark; --bg: #0b1018; --panel: #121a27; --line: #263447; --text: #e5edf7; --muted: #9fb0c5; --accent: #f4ff3a; --danger: #ff6b6b; }
    body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: radial-gradient(circle at top left, #223047, var(--bg) 42%); color: var(--text); }
    main { max-width: 1180px; margin: 0 auto; padding: 36px 20px 56px; }
    header { display: grid; gap: 12px; margin-bottom: 24px; }
    h1 { margin: 0; font-size: clamp(28px, 4vw, 48px); letter-spacing: -0.05em; }
    h2 { margin: 0 0 12px; font-size: 18px; }
    code, pre { font-family: "SFMono-Regular", Consolas, monospace; }
    .grid { display: grid; grid-template-columns: minmax(0, 1fr) 390px; gap: 18px; align-items: start; }
    .panel { background: color-mix(in srgb, var(--panel) 92%, transparent); border: 1px solid var(--line); border-radius: 24px; padding: 18px; box-shadow: 0 24px 80px rgba(0,0,0,.25); }
    .status { display: flex; flex-wrap: wrap; gap: 8px; }
    .pill { border: 1px solid var(--line); border-radius: 999px; padding: 8px 11px; color: var(--muted); background: #0d1420; }
    .pill strong { color: var(--text); }
    .blocked { border-color: color-mix(in srgb, var(--danger), var(--line)); color: #ffd6d6; }
    .command { white-space: pre-wrap; background: #060a10; border: 1px solid #243247; border-radius: 16px; padding: 16px; overflow-x: auto; }
    a { color: var(--accent); text-decoration: none; }
    ul { margin: 0; padding-left: 18px; color: var(--muted); }
    li { margin: 8px 0; }
    iframe { width: 100%; height: 820px; border: 1px solid var(--line); border-radius: 24px; background: #0d1117; }
    .links { display: grid; gap: 10px; }
    .link-card { display: block; border: 1px solid var(--line); border-radius: 16px; padding: 12px; background: #0d1420; }
    .link-card span { display: block; color: var(--muted); font-size: 12px; overflow-wrap: anywhere; margin-top: 4px; }
    @media (max-width: 860px) { .grid { grid-template-columns: 1fr; } iframe { height: 680px; } }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>Manual Unblock Cockpit</h1>
      <div class="status">
        <span class="pill"><strong>Status</strong> ${escapeHtml(payload.status)}</span>
        <span class="pill ${payload.gateState === 'BLOCKED' ? 'blocked' : ''}"><strong>Gate</strong> ${escapeHtml(payload.gateState)}</span>
        <span class="pill"><strong>Blocker</strong> ${escapeHtml(payload.activeBlocker?.kind ?? 'none')}</span>
        <span class="pill"><strong>Attempts</strong> ${escapeHtml(payload.attemptHistoryTotal ?? 'unknown')}</span>
      </div>
      <p>${escapeHtml(payload.targetLabel)} · ${escapeHtml(payload.recommendedRoute)}</p>
    </header>
    <div class="grid">
      <section class="panel">
        <h2>Fallback Preview</h2>
        <iframe src="${escapeHtml(path.basename(payload.links.preview))}" title="Compare Entry mobile brand top nav preview"></iframe>
      </section>
      <aside class="panel">
        <h2>Required Checks</h2>
        <ul>${formatHtmlList(payload.requiredChecks)}</ul>
        <h2 style="margin-top:20px">Copy-Ready Command</h2>
        <pre class="command">${escapeHtml(payload.command)}</pre>
        <h2 style="margin-top:20px">Evidence</h2>
        <ul>
          <li>${escapeHtml(`readyForWorksheetCheck: ${payload.evidence.readyForWorksheetCheck}`)}</li>
          <li>${escapeHtml(`frameId: ${payload.evidence.frameId ?? 'none'}`)}</li>
          <li>${escapeHtml(`sectionId: ${payload.evidence.sectionId ?? 'none'}`)}</li>
        </ul>
        <h2 style="margin-top:20px">Open Order</h2>
        <div class="links">
          ${Object.entries(payload.links)
            .map(
              ([label, value]) =>
                `<a class="link-card" href="${escapeHtml(path.relative(artifactDir, value).startsWith('..') ? value : path.relative(artifactDir, value))}"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></a>`,
            )
            .join('')}
        </div>
      </aside>
    </div>
  </main>
</body>
</html>
`;

  await writeFile(outputPaths.html, html, 'utf8');

  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        status: payload.status,
        gateState: payload.gateState,
        target: payload.targetLabel,
        htmlPath: outputPaths.html,
        markdownPath: outputPaths.markdown,
        jsonPath: outputPaths.json,
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
