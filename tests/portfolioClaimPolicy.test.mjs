import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LEGACY_EVIDENCE_MARKER,
  auditPortfolioClaims,
  findForbiddenCurrentClaims,
} from '../scripts/portfolioClaimPolicy.mjs';

test('current portfolio policy rejects unsupported status and outcome claims', () => {
  const violations = findForbiddenCurrentClaims([
    '# Project',
    'Status: MISSION ACCOMPLISHED',
    'Achieved 99.8% cost reduction.',
  ].join('\n'));

  assert.deepEqual(violations.map(({ id }) => id), [
    'mission-accomplished',
    'cost-reduction-99-8',
  ]);
});

test('current portfolio policy allows explicit risky-expression guidance', () => {
  const violations = findForbiddenCurrentClaims([
    '# Project',
    '## \uc4f0\uba74 \uc704\ud5d8\ud55c \ud45c\ud604',
    '- 99.8% \ube44\uc6a9 \uc808\uac10 \ub2ec\uc131',
    '- MISSION ACCOMPLISHED',
    '## Safe expressions',
    '- MVP \uad6c\ud604 \ud6c4 \uac80\uc99d \uc911',
  ].join('\n'));

  assert.deepEqual(violations, []);
});

test('legacy planning documents require the fixed evidence marker near the top', () => {
  const result = auditPortfolioClaims(
    { current: '# Current\nMVP', legacy: '# Legacy\n99.8% cost reduction' },
    { currentPaths: ['current'], legacyPaths: ['legacy'] },
  );

  assert.deepEqual(result.violations, [
    { type: 'missing-legacy-evidence-marker', filePath: 'legacy' },
  ]);
});

test('portfolio audit accepts clean current docs and marked legacy assumptions', () => {
  const result = auditPortfolioClaims(
    {
      current: '# Current\nMVP \uad6c\ud604 \ud6c4 \uac80\uc99d \uc911',
      legacy: `# Legacy\n\n${LEGACY_EVIDENCE_MARKER}\n\n99.8% cost reduction`,
    },
    { currentPaths: ['current'], legacyPaths: ['legacy'] },
  );

  assert.deepEqual(result, { ok: true, violations: [] });
});

test('portfolio audit rejects inconsistent adapter test counts across current docs', () => {
  const result = auditPortfolioClaims(
    {
      currentA: 'adapter/domain tests: `530/530` pass',
      currentB: 'adapter/domain tests: `529/529` pass',
    },
    { currentPaths: ['currentA', 'currentB'], legacyPaths: [] },
  );

  assert.deepEqual(result.violations, [{
    type: 'inconsistent-adapter-test-count',
    claims: [
      { filePath: 'currentA', line: 1, count: 530 },
      { filePath: 'currentB', line: 1, count: 529 },
    ],
  }]);
});

test('portfolio audit rejects a latest commit claim that differs from HEAD', () => {
  const expectedHead = 'a'.repeat(40);
  const result = auditPortfolioClaims(
    { current: '현재 최신 커밋은 `0edd82a`이다.' },
    { currentPaths: ['current'], legacyPaths: [], expectedHead },
  );

  assert.deepEqual(result.violations, [{
    type: 'stale-latest-commit-claim',
    filePath: 'current',
    line: 1,
    observed: '0edd82a',
    expected: expectedHead,
  }]);
});
