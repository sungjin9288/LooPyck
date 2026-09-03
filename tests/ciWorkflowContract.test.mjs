import assert from 'node:assert/strict';
import test from 'node:test';

import { auditCiWorkflow } from '../scripts/ciWorkflowContract.mjs';

const passingWorkflow = `
jobs:
  build:
    steps:
      - name: Security audit
        run: npm run verify:dependency-audit
      - name: Build
        run: npm run build
      - name: Upload build artifacts
        uses: actions/upload-artifact@v6
        if: always()
        with:
          path: |
            .next/
            public/deployment-provenance.json
      - name: Upload dependency audit evidence
        uses: actions/upload-artifact@v6
        if: always()
        with:
          path: output/playwright/dependency-audit-policy.json
  test:
    steps:
      - name: Type check
        run: npm run typecheck
      - name: Unit tests
        run: npm run test:adapters
      - name: Integrity contracts
        run: |
          npm run test:system-stress-contract
          npm run test:deployment-provenance-contract
          npm run test:release-closeout-contract
          npm run test:portfolio-claims-contract
          npm run test:ci-workflow-contract
          npm run test:dependency-audit-contract
      - name: Portfolio claim audit
        run: npm run verify:portfolio-claims
      - name: CI workflow audit
        run: npm run verify:ci-workflow
      - name: Upload portfolio claim audit
        uses: actions/upload-artifact@v6
        if: always()
        with:
          path: output/playwright/portfolio-claim-audit.json
      - name: Upload CI workflow audit
        uses: actions/upload-artifact@v6
        if: always()
        with:
          path: output/playwright/ci-workflow-contract.json
  e2e:
    steps:
      - name: Build
        run: npm run build
      - name: Stress
        run: npm run ntl:system-stress
      - name: Upload system stress evidence
        uses: actions/upload-artifact@v6
        if: always()
        with:
          path: output/playwright/local-system-stress-smoke.json
      - name: E2E
        run: npm run test:e2e
`;

test('CI workflow contract accepts job-scoped blocking gates and uploads', () => {
  assert.deepEqual(auditCiWorkflow(passingWorkflow), { ok: true, violations: [] });
});

test('CI workflow contract rejects a required command moved to the wrong job', () => {
  const result = auditCiWorkflow(
    passingWorkflow
      .replace('        run: npm run verify:ci-workflow', '        run: echo skipped')
      .replace('        run: npm run test:e2e', '        run: |\n          npm run verify:ci-workflow\n          npm run test:e2e'),
  );

  assert.ok(result.violations.some(({ type, job, command }) => (
    type === 'missing-job-command' && job === 'test' && command === 'npm run verify:ci-workflow'
  )));
});

test('CI workflow contract ignores commands that only appear in comments', () => {
  const result = auditCiWorkflow(
    passingWorkflow.replace(
      '        run: npm run verify:portfolio-claims',
      '        # npm run verify:portfolio-claims\n        run: echo skipped',
    ),
  );

  assert.ok(result.violations.some(({ type, command }) => (
    type === 'missing-job-command' && command === 'npm run verify:portfolio-claims'
  )));
});

test('CI workflow contract rejects stress before the production build', () => {
  const result = auditCiWorkflow(
    passingWorkflow.replace(
      `      - name: Build
        run: npm run build
      - name: Stress
        run: npm run ntl:system-stress`,
      `      - name: Stress
        run: npm run ntl:system-stress
      - name: Build
        run: npm run build`,
    ),
  );

  assert.ok(result.violations.some(({ type }) => type === 'invalid-e2e-gate-order'));
});

test('CI workflow contract rejects non-blocking gates', () => {
  const result = auditCiWorkflow(
    passingWorkflow.replace('npm run ntl:system-stress', 'npm run ntl:system-stress || true'),
  );

  assert.ok(result.violations.some(({ type }) => type === 'non-blocking-ci-gate'));
});

test('CI workflow contract rejects a non-blocking dependency audit and audit after build', () => {
  const nonBlocking = auditCiWorkflow(
    passingWorkflow.replace(
      'npm run verify:dependency-audit',
      'npm run verify:dependency-audit || true',
    ),
  );
  const reordered = auditCiWorkflow(
    passingWorkflow.replace(
      `      - name: Security audit
        run: npm run verify:dependency-audit
      - name: Build
        run: npm run build`,
      `      - name: Build
        run: npm run build
      - name: Security audit
        run: npm run verify:dependency-audit`,
    ),
  );

  assert.ok(nonBlocking.violations.some(({ type, job }) => (
    type === 'non-blocking-ci-gate' && job === 'build'
  )));
  assert.ok(reordered.violations.some(({ type }) => type === 'invalid-build-gate-order'));
});

test('CI workflow contract requires an actual always-upload action and exact path', () => {
  const result = auditCiWorkflow(
    passingWorkflow
      .replace('uses: actions/upload-artifact@v6\n        if: always()', 'uses: actions/cache@v4\n        if: success()')
      .replace('path: output/playwright/ci-workflow-contract.json', 'path: output/playwright/wrong.json'),
  );

  assert.ok(result.violations.some(({ type }) => type === 'missing-upload-action'));
  assert.ok(result.violations.some(({ type }) => type === 'missing-always-upload'));
  assert.ok(result.violations.some(({ type }) => type === 'invalid-upload-paths'));
});

test('CI workflow contract requires the provenance manifest in the exact build artifact path set', () => {
  const missingManifest = auditCiWorkflow(
    passingWorkflow.replace(
      `          path: |
            .next/
            public/deployment-provenance.json`,
      '          path: .next/',
    ),
  );
  const unexpectedPath = auditCiWorkflow(
    passingWorkflow.replace(
      '            public/deployment-provenance.json',
      '            public/deployment-provenance.json\n            .env.local',
    ),
  );

  assert.ok(missingManifest.violations.some(({ type, job }) => (
    type === 'invalid-upload-paths' && job === 'build'
  )));
  assert.ok(unexpectedPath.violations.some(({ type, job }) => (
    type === 'invalid-upload-paths' && job === 'build'
  )));
});
