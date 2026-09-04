export const LEGACY_EVIDENCE_MARKER = '> **Evidence status:** Legacy planning artifact. Numeric outcomes are assumptions, not measured LooPyck results.';

export const CURRENT_PORTFOLIO_DOCS = Object.freeze([
  'README.md',
  'walkthrough.md',
  'docs/case-study.md',
  'docs/project-card.md',
  'docs/resume-bullets.md',
  'docs/implementation-evidence.md',
  'docs/CONSULTING_CASE_STUDY.md',
  'docs/ENTERPRISE_READY_REPORT.md',
  'docs/project_index.md',
]);

export const LEGACY_PLANNING_DOCS = Object.freeze([
  'docs/TECHNICAL_DEEP_DIVE_QA.md',
  'docs/STRATEGIC_ROADMAP.md',
  'docs/TECH_WHITEPAPER.md',
  'docs/REPLICATION_STRATEGY.md',
  'docs/CASE_STUDY_AI_AGENT.md',
  'docs/EXECUTIVE_PITCH_DECK.md',
  'docs/POC_REPLICATION_REPORT.md',
  'docs/B2B_CONSULTING_PROPOSAL.md',
  'docs/FINAL_COMPLETION_REPORT.md',
]);

const FORBIDDEN_CURRENT_CLAIMS = [
  { id: 'mission-accomplished', pattern: /\bmission accomplished\b/i },
  { id: 'gold-master', pattern: /\bgold master\b/i },
  { id: 'global-launch-ready', pattern: /\bglobal launch ready\b/i },
  { id: 'commercial-grade', pattern: /\bcommercial-grade\b/i },
  { id: 'enterprise-ready', pattern: /\benterprise[- ]ready\b/i },
  { id: 'cost-reduction-99-8', pattern: /(?:99\.8%[^\n]{0,24}(?:cost reduction|\ube44\uc6a9 \uc808\uac10)|(?:cost reduction|\ube44\uc6a9 \uc808\uac10)[^\n]{0,24}99\.8%)/i },
  { id: 'automation-or-success-94-2', pattern: /94\.2%[^\n]{0,24}(?:automation|success|\uc790\ub3d9\ud654|\uc131\uacf5)/i },
  { id: 'ten-thousand-capacity', pattern: /10,000[^\n]{0,24}(?:concurrent|analyses|users|\ub3d9\uc2dc)/i },
  { id: 'accuracy-95-plus', pattern: /95%\+?[^\n]{0,24}(?:accuracy|reliability|\uc815\ud655\ub3c4|\uc131\uacf5\ub960)/i },
  { id: 'accuracy-guarantee-98', pattern: /(?:accuracy|\uc815\ud655\ub3c4)[^\n]{0,24}98%[^\n]{0,12}(?:guarantee|\ubcf4\uc7a5|\uc774\uc0c1)/i },
];

const EXCLUDED_SECTION_PATTERN = /\uc704\ud5d8|risk|\ubbf8\uad6c\ud604|\uadfc\uac70 \ubd80\uc871|\uae08\uc9c0|\uc81c\uc678/i;
const QUALIFIED_LINE_PATTERN = /\ubbf8\uac80\uc99d|\uac80\uc99d\ub418\uc9c0|\uadfc\uac70 \uc5c6|\ubcf4\ub958|\uae08\uc9c0|\uc81c\uc678|not measured|not a .*claim|assumption/i;
const ADAPTER_TEST_CONTEXT_PATTERN = /adapter\/domain|test:adapters/i;
const LATEST_COMMIT_PATTERN = /(?:\ucd5c\uc2e0\s*\ucee4\ubc0b|latest\s+commit)[^\n`]*`?([0-9a-f]{7,40})`?/i;

function headingDepth(line) {
  const match = /^(#{1,6})\s+/.exec(line);
  return match ? match[1].length : null;
}

export function findForbiddenCurrentClaims(content) {
  const violations = [];
  let excludedDepth = null;

  content.split('\n').forEach((line, index) => {
    const depth = headingDepth(line);
    if (depth !== null) {
      if (excludedDepth !== null && depth <= excludedDepth) excludedDepth = null;
      if (EXCLUDED_SECTION_PATTERN.test(line)) excludedDepth = depth;
      return;
    }
    if (excludedDepth !== null || QUALIFIED_LINE_PATTERN.test(line)) return;

    FORBIDDEN_CURRENT_CLAIMS.forEach(({ id, pattern }) => {
      if (pattern.test(line)) {
        violations.push({ type: 'forbidden-current-claim', id, line: index + 1 });
      }
    });
  });

  return violations;
}

function findAdapterTestCountClaims(content, filePath) {
  const claims = [];

  content.split('\n').forEach((line, index) => {
    if (!ADAPTER_TEST_CONTEXT_PATTERN.test(line)) return;

    const ratio = /\b(\d+)\s*\/\s*(\d+)\b`?\s*pass/i.exec(line);
    const countBeforeTests = /\b(\d+)\s+tests?\s+pass/i.exec(line);
    const summary = /\btests?\s+(\d+)\s*,\s*pass\s+(\d+)/i.exec(line);
    const count = ratio?.[1] ?? countBeforeTests?.[1] ?? summary?.[1];
    if (!count) return;

    claims.push({ filePath, line: index + 1, count: Number(count) });
  });

  return claims;
}

function findUnstableLatestCommitClaims(content, filePath) {
  const violations = [];

  content.split('\n').forEach((line, index) => {
    const match = LATEST_COMMIT_PATTERN.exec(line);
    const observed = match?.[1];
    if (!observed) return;

    violations.push({
      type: 'unstable-latest-commit-claim',
      filePath,
      line: index + 1,
      observed,
    });
  });

  return violations;
}

export function auditPortfolioClaims(documents, options = {}) {
  const currentPaths = options.currentPaths || CURRENT_PORTFOLIO_DOCS;
  const legacyPaths = options.legacyPaths || LEGACY_PLANNING_DOCS;
  const violations = [];
  const adapterTestCountClaims = [];

  currentPaths.forEach((filePath) => {
    const content = documents[filePath];
    if (typeof content !== 'string') {
      violations.push({ type: 'missing-current-document', filePath });
      return;
    }
    findForbiddenCurrentClaims(content).forEach((violation) => {
      violations.push({ ...violation, filePath });
    });
    adapterTestCountClaims.push(...findAdapterTestCountClaims(content, filePath));
    violations.push(...findUnstableLatestCommitClaims(content, filePath));
  });

  if (new Set(adapterTestCountClaims.map(({ count }) => count)).size > 1) {
    violations.push({
      type: 'inconsistent-adapter-test-count',
      claims: adapterTestCountClaims,
    });
  }

  legacyPaths.forEach((filePath) => {
    const content = documents[filePath];
    if (typeof content !== 'string') {
      violations.push({ type: 'missing-legacy-document', filePath });
      return;
    }
    const header = content.split('\n').slice(0, 12).join('\n');
    if (!header.includes(LEGACY_EVIDENCE_MARKER)) {
      violations.push({ type: 'missing-legacy-evidence-marker', filePath });
    }
  });

  return { ok: violations.length === 0, violations };
}
