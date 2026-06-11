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
  buildWorksheet: path.join(artifactDir, 'compare-entry-manual-build-worksheet.md'),
  reviewWorksheet: path.join(artifactDir, 'compare-entry-design-review-worksheet.md'),
  decisionLog: path.join(artifactDir, 'compare-entry-design-review-decision-log.md'),
  nextSurfaceChecklistJson: path.join(artifactDir, 'compare-entry-review-next-surface-checklist.json'),
  nextSurfaceChecklistHtml: path.join(artifactDir, 'compare-entry-review-next-surface-checklist.html'),
  nextSectionActionCardJson: path.join(
    artifactDir,
    'compare-entry-review-next-section-action-card.json',
  ),
  nextSectionActionCardHtml: path.join(
    artifactDir,
    'compare-entry-review-next-section-action-card.html',
  ),
  latestHandoffHtml: path.join(artifactDir, 'compare-entry-review-sessions', 'latest-handoff.html'),
};

const outputPaths = {
  json: path.join(artifactDir, 'compare-entry-review-status.json'),
  html: path.join(artifactDir, 'compare-entry-review-status-board.html'),
};

function countCheckboxes(markdown) {
  const matches = [...markdown.matchAll(/^- \[( |x)\]/gm)];
  const checked = matches.filter((match) => match[1] === 'x').length;
  return {
    total: matches.length,
    checked,
    pending: matches.length - checked,
    completionRate: matches.length > 0 ? Math.round((checked / matches.length) * 100) : 0,
  };
}

function cleanFieldValue(value) {
  return value
    .replaceAll('`', '')
    .replaceAll('*', '')
    .trim();
}

function extractDecisionField(markdown, label) {
  const pattern = new RegExp(`^- ${label}:\\s*(.+)$`, 'm');
  const match = markdown.match(pattern);
  if (!match) return null;
  return cleanFieldValue(match[1]);
}

function extractUnblockField(markdown) {
  const line = markdown
    .split('\n')
    .find((entry) => entry.startsWith('- Does `SUN-10` unblock `SUN-11` / `SUN-12`?:'));
  if (!line) return null;
  const [, value = ''] = line.split(':');
  return cleanFieldValue(value);
}

function normalizeOutcome(value) {
  if (!value) return null;
  if (value.includes('|')) return null;
  if (/Approved With Follow-up/i.test(value)) return 'Approved With Follow-up';
  if (/Needs Revision/i.test(value)) return 'Needs Revision';
  if (/Approved/i.test(value)) return 'Approved';
  return null;
}

function normalizeYesNo(value) {
  if (!value) return null;
  if (value.includes('|')) return null;
  if (/yes/i.test(value)) return 'Yes';
  if (/no/i.test(value)) return 'No';
  return null;
}

function normalizeConfidence(value) {
  if (!value) return null;
  if (value.includes('|')) return null;
  if (/high/i.test(value)) return 'High';
  if (/medium/i.test(value)) return 'Medium';
  if (/low/i.test(value)) return 'Low';
  return null;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildMissingItems(status) {
  const missing = [];

  if (status.build.pending > 0) {
    missing.push(`build worksheet pending checkboxes: ${status.build.pending}`);
  }

  if (status.review.pending > 0) {
    missing.push(`review worksheet pending checkboxes: ${status.review.pending}`);
  }

  if (!status.decision.outcome) {
    missing.push('decision log outcome not selected');
  }

  if (!status.decision.unblocks) {
    missing.push('decision log unblock field not selected');
  }

  if (!status.decision.confidence) {
    missing.push('decision log reviewer confidence not selected');
  }

  return missing;
}

async function main() {
  await mkdir(artifactDir, { recursive: true });

  const [buildWorksheet, reviewWorksheet, decisionLog] = await Promise.all([
    readFile(inputPaths.buildWorksheet, 'utf8'),
    readFile(inputPaths.reviewWorksheet, 'utf8'),
    readFile(inputPaths.decisionLog, 'utf8'),
  ]);

  let nextSurfaceChecklist = null;
  let nextSectionActionCard = null;
  try {
    nextSurfaceChecklist = JSON.parse(await readFile(inputPaths.nextSurfaceChecklistJson, 'utf8'));
  } catch {
    nextSurfaceChecklist = null;
  }
  try {
    nextSectionActionCard = JSON.parse(
      await readFile(inputPaths.nextSectionActionCardJson, 'utf8'),
    );
  } catch {
    nextSectionActionCard = null;
  }

  const build = countCheckboxes(buildWorksheet);
  const review = countCheckboxes(reviewWorksheet);

  const decision = {
    outcome: normalizeOutcome(extractDecisionField(decisionLog, 'Outcome')),
    unblocks: normalizeYesNo(extractUnblockField(decisionLog)),
    confidence: normalizeConfidence(extractDecisionField(decisionLog, 'Reviewer confidence')),
  };

  const readyToUnblock =
    (decision.outcome === 'Approved' || decision.outcome === 'Approved With Follow-up') &&
    decision.unblocks === 'Yes';

  const status = {
    generatedAt: new Date().toISOString(),
    build,
    review,
    decision,
    readyToUnblock,
    missing: buildMissingItems({ build, review, decision }),
    recommendedNextSurface: nextSurfaceChecklist?.recommendedSurface?.surface ?? null,
    recommendedNextFrame: nextSurfaceChecklist?.recommendedNextFrame ?? null,
    recommendedNextSection: nextSurfaceChecklist?.recommendedNextSection ?? null,
    recommendedNextSurfaceChecklistPath: inputPaths.nextSurfaceChecklistHtml,
    recommendedNextSectionActionCardPath: inputPaths.nextSectionActionCardHtml,
    recommendedNextSectionActionFirstItem:
      nextSectionActionCard?.actionItems?.[0] ?? null,
    links: inputPaths,
  };

  await writeFile(outputPaths.json, JSON.stringify(status, null, 2) + '\n', 'utf8');

  const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Compare Entry Review Status</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f4f7fb;
        --panel: rgba(255,255,255,0.94);
        --line: #d6deeb;
        --text: #172033;
        --muted: #5e6a82;
        --ok: #0f9f6e;
        --warn: #b7791f;
        --bad: #c53030;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "SF Pro Display", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
        background: linear-gradient(180deg, #eef4ff 0%, #f4f7fb 30%, #f8fafc 100%);
        color: var(--text);
      }
      main {
        max-width: 1280px;
        margin: 0 auto;
        padding: 32px 24px 56px;
        display: grid;
        gap: 18px;
      }
      .hero, .panel {
        border: 1px solid var(--line);
        border-radius: 24px;
        background: var(--panel);
        padding: 22px;
      }
      .hero h1 { margin: 0 0 10px; font-size: 34px; line-height: 1.05; }
      .hero p, .panel p { margin: 0; color: var(--muted); }
      .summary, .grid-2, .links {
        display: grid;
        gap: 14px;
      }
      .summary { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
      .grid-2, .links { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
      .metric, .link-card {
        padding: 14px 16px;
        border: 1px solid var(--line);
        border-radius: 18px;
        background: #fff;
      }
      .metric strong {
        display: block;
        margin: 0 0 8px;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--muted);
      }
      .link-card {
        display: grid;
        gap: 8px;
        color: inherit;
        text-decoration: none;
      }
      .link-card:hover { border-color: #94a3b8; }
      h2 { margin: 0 0 10px; font-size: 18px; }
      ul { margin: 0; padding-left: 20px; display: grid; gap: 8px; }
      code {
        font-family: "SFMono-Regular", Menlo, monospace;
        font-size: 12px;
        background: #eef2f8;
        padding: 4px 8px;
        border-radius: 10px;
        word-break: break-all;
      }
      .state-ok { color: var(--ok); font-weight: 700; }
      .state-warn { color: var(--warn); font-weight: 700; }
      .state-bad { color: var(--bad); font-weight: 700; }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <h1>Compare Entry Review Status</h1>
        <p>manual build worksheet, review worksheet, decision log 기준으로 현재 \`SUN-10\` handoff readiness를 요약한 상태 board입니다.</p>
      </section>

      <section class="summary">
        <div class="metric"><strong>Build Completion</strong><span>${build.checked}/${build.total} (${build.completionRate}%)</span></div>
        <div class="metric"><strong>Review Completion</strong><span>${review.checked}/${review.total} (${review.completionRate}%)</span></div>
        <div class="metric"><strong>Outcome</strong><span>${escapeHtml(decision.outcome ?? 'Pending')}</span></div>
        <div class="metric"><strong>Ready To Unblock</strong><span class="${readyToUnblock ? 'state-ok' : 'state-warn'}">${readyToUnblock ? 'Yes' : 'No'}</span></div>
        <div class="metric"><strong>Recommended Next Surface</strong><span>${escapeHtml(status.recommendedNextSurface ?? 'none')}</span></div>
        <div class="metric"><strong>Recommended Next Frame</strong><span>${escapeHtml(status.recommendedNextFrame ?? 'none')}</span></div>
        <div class="metric"><strong>Recommended Next Section</strong><span>${escapeHtml(status.recommendedNextSection ?? 'none')}</span></div>
      </section>

      <section class="grid-2">
        <section class="panel">
          <h2>Decision Status</h2>
          <ul>
            <li>Outcome: <strong>${escapeHtml(decision.outcome ?? 'Pending')}</strong></li>
            <li>Unblocks SUN-11/12: <strong>${escapeHtml(decision.unblocks ?? 'Pending')}</strong></li>
            <li>Reviewer confidence: <strong>${escapeHtml(decision.confidence ?? 'Pending')}</strong></li>
          </ul>
        </section>
        <section class="panel">
          <h2>Missing Items</h2>
          ${
            status.missing.length > 0
              ? `<ul>${status.missing.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
              : '<p class="state-ok">No blocking missing items detected.</p>'
          }
        </section>
        <section class="panel">
          <h2>Recommended Checklist Entry</h2>
          <ul>
            <li>path: <code>${escapeHtml(status.recommendedNextSurfaceChecklistPath)}</code></li>
            <li>surface: <strong>${escapeHtml(status.recommendedNextSurface ?? 'none')}</strong></li>
            <li>frame: <strong>${escapeHtml(status.recommendedNextFrame ?? 'none')}</strong></li>
            <li>section: <strong>${escapeHtml(status.recommendedNextSection ?? 'none')}</strong></li>
          </ul>
        </section>
        <section class="panel">
          <h2>Recommended Action Card</h2>
          <ul>
            <li>path: <code>${escapeHtml(status.recommendedNextSectionActionCardPath)}</code></li>
            <li>first action: <strong>${escapeHtml(status.recommendedNextSectionActionFirstItem ?? 'none')}</strong></li>
          </ul>
        </section>
      </section>

      <section class="links">
        <a class="link-card" href="${escapeHtml(inputPaths.nextSurfaceChecklistHtml)}"><strong>Next Surface Checklist</strong><code>${escapeHtml(inputPaths.nextSurfaceChecklistHtml)}</code></a>
        <a class="link-card" href="${escapeHtml(inputPaths.nextSectionActionCardHtml)}"><strong>Next Section Action Card</strong><code>${escapeHtml(inputPaths.nextSectionActionCardHtml)}</code></a>
        <a class="link-card" href="${escapeHtml(inputPaths.latestHandoffHtml)}"><strong>Latest Handoff</strong><code>${escapeHtml(inputPaths.latestHandoffHtml)}</code></a>
        <a class="link-card" href="${escapeHtml(inputPaths.buildWorksheet)}"><strong>Build Worksheet</strong><code>${escapeHtml(inputPaths.buildWorksheet)}</code></a>
        <a class="link-card" href="${escapeHtml(inputPaths.reviewWorksheet)}"><strong>Review Worksheet</strong><code>${escapeHtml(inputPaths.reviewWorksheet)}</code></a>
        <a class="link-card" href="${escapeHtml(inputPaths.decisionLog)}"><strong>Decision Log</strong><code>${escapeHtml(inputPaths.decisionLog)}</code></a>
      </section>
    </main>
  </body>
</html>`;

  await writeFile(outputPaths.html, html, 'utf8');

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        jsonPath: outputPaths.json,
        htmlPath: outputPaths.html,
        readyToUnblock,
        missing: status.missing.length,
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
