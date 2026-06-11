export function normalizeActiveBlocker(value, fallback = {}) {
  if (value && typeof value === 'object') {
    return {
      kind: value.kind ?? fallback.kind ?? 'unknown',
      summary: value.summary ?? fallback.summary ?? 'Active blocker summary is unavailable.',
      target: value.target ?? fallback.target ?? null,
      latestStatus: value.latestStatus ?? fallback.latestStatus ?? null,
      latestOperation: value.latestOperation ?? fallback.latestOperation ?? null,
      latestTool: value.latestTool ?? fallback.latestTool ?? null,
      evidencePath: value.evidencePath ?? fallback.evidencePath ?? null,
      nextAction: value.nextAction ?? fallback.nextAction ?? 'Refresh the review gate artifacts.',
    };
  }

  return {
    kind: fallback.kind ?? 'unknown',
    summary: fallback.summary ?? 'Active blocker summary is unavailable.',
    target: fallback.target ?? null,
    latestStatus: fallback.latestStatus ?? null,
    latestOperation: fallback.latestOperation ?? null,
    latestTool: fallback.latestTool ?? null,
    evidencePath: fallback.evidencePath ?? null,
    nextAction: fallback.nextAction ?? 'Refresh the review gate artifacts.',
  };
}

export function formatActiveBlockerMarkdown(activeBlocker) {
  return `## Active Blocker

- kind: \`${activeBlocker.kind}\`
- summary: ${activeBlocker.summary}
- target: \`${activeBlocker.target ?? 'none'}\`
- latestStatus: \`${activeBlocker.latestStatus ?? 'none'}\`
- latestOperation: \`${activeBlocker.latestOperation ?? 'none'}\`
- latestTool: \`${activeBlocker.latestTool ?? 'none'}\`
- evidencePath: \`${activeBlocker.evidencePath ?? 'none'}\`
- nextAction: ${activeBlocker.nextAction}
`;
}

export function formatActiveBlockerHtml(activeBlocker, escapeHtml) {
  return `
        <section class="panel">
          <h2>Active Blocker</h2>
          <ul>
            <li>${escapeHtml(`kind: ${activeBlocker.kind}`)}</li>
            <li>${escapeHtml(`summary: ${activeBlocker.summary}`)}</li>
            <li>${escapeHtml(`target: ${activeBlocker.target ?? 'none'}`)}</li>
            <li>${escapeHtml(`latestStatus: ${activeBlocker.latestStatus ?? 'none'}`)}</li>
            <li>${escapeHtml(`latestOperation: ${activeBlocker.latestOperation ?? 'none'}`)}</li>
            <li>${escapeHtml(`latestTool: ${activeBlocker.latestTool ?? 'none'}`)}</li>
            <li>${escapeHtml(`evidencePath: ${activeBlocker.evidencePath ?? 'none'}`)}</li>
            <li>${escapeHtml(`nextAction: ${activeBlocker.nextAction}`)}</li>
          </ul>
        </section>`;
}
