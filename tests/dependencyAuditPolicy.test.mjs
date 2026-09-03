import assert from 'node:assert/strict';
import test from 'node:test';

import {
  evaluateDependencyAudit,
  evaluateDependencyAuditScopes,
} from '../scripts/dependencyAuditPolicy.mjs';

const baseline = {
  schemaVersion: 2,
  reviewedAt: '2026-07-15',
  reviewBy: '2026-08-14',
  maxVulnerablePackages: { high: 2, critical: 1 },
  allowedAdvisories: [
    { source: 1001, package: 'leaf-high', severity: 'high' },
    { source: 1002, package: 'leaf-critical', severity: 'critical' },
  ],
};

const EVALUATED_AT = '2026-07-15';

function evaluate(current, selectedBaseline = baseline, evaluatedAt = EVALUATED_AT) {
  return evaluateDependencyAudit(current, selectedBaseline, { evaluatedAt });
}

function report() {
  return {
    vulnerabilities: {
      'leaf-high': {
        severity: 'high',
        via: [{ source: 1001, severity: 'high' }],
      },
      'meta-high': { severity: 'high', via: ['leaf-high'] },
      'leaf-critical': {
        severity: 'critical',
        via: [{ source: 1002, severity: 'critical' }],
      },
    },
    metadata: {
      vulnerabilities: {
        info: 0,
        low: 0,
        moderate: 0,
        high: 2,
        critical: 1,
        total: 3,
      },
    },
  };
}

function cleanReport() {
  return {
    vulnerabilities: {},
    metadata: {
      vulnerabilities: {
        info: 0,
        low: 0,
        moderate: 10,
        high: 0,
        critical: 0,
        total: 10,
      },
    },
  };
}

test('dependency audit policy accepts the reviewed severe advisory baseline', () => {
  const result = evaluate(report());

  assert.equal(result.ok, true);
  assert.equal(result.summary.severeAdvisoryCount, 2);
  assert.equal(result.severePackages.length, 3);
  assert.equal(result.summary.baselineReviewBy, '2026-08-14');
  assert.equal(result.summary.evaluatedAt, EVALUATED_AT);
});

test('dependency audit policy rejects a new severe advisory source', () => {
  const current = report();
  current.vulnerabilities['new-high'] = {
    severity: 'high',
    via: [{ source: 1003, severity: 'high' }],
  };
  current.metadata.vulnerabilities.high = 3;

  const result = evaluate(current, {
    ...baseline,
    maxVulnerablePackages: { high: 3, critical: 1 },
  });

  assert.ok(result.violations.some(({ type, source }) => (
    type === 'unapproved-severe-advisory' && source === 1003
  )));
});

test('dependency audit policy rejects an approved advisory severity increase', () => {
  const current = report();
  current.vulnerabilities['leaf-high'].severity = 'critical';
  current.vulnerabilities['leaf-high'].via[0].severity = 'critical';
  current.metadata.vulnerabilities.high = 1;
  current.metadata.vulnerabilities.critical = 2;

  const result = evaluate(current, {
    ...baseline,
    maxVulnerablePackages: { high: 2, critical: 2 },
  });

  assert.ok(result.violations.some(({ type, source }) => (
    type === 'advisory-severity-increase' && source === 1001
  )));
});

test('dependency audit policy rejects advisory package reassignment', () => {
  const reassignedBaseline = {
    ...baseline,
    allowedAdvisories: baseline.allowedAdvisories.map((entry) => (
      entry.source === 1001 ? { ...entry, package: 'other-package' } : entry
    )),
  };
  const result = evaluate(report(), reassignedBaseline);

  assert.ok(result.violations.some(({ type, source }) => (
    type === 'advisory-package-mismatch' && source === 1001
  )));
});

test('dependency audit policy rejects unresolved severe dependency chains', () => {
  const current = report();
  current.vulnerabilities['leaf-high'].via = ['missing-vulnerability'];

  const result = evaluate(current);

  assert.ok(result.violations.some(({ type, package: packageName }) => (
    type === 'unresolved-severe-package' && packageName === 'leaf-high'
  )));
});

test('dependency audit policy resolves advisory sources through cyclic dependency chains', () => {
  const cyclicReport = {
    vulnerabilities: {
      'root-high': { severity: 'high', via: ['cycle-root'] },
      'cycle-root': { severity: 'high', via: ['cycle-node', 'leaf-high'] },
      'cycle-node': { severity: 'high', via: ['cycle-root'] },
      'leaf-high': {
        severity: 'high',
        via: [{ source: 1001, severity: 'high' }],
      },
    },
    metadata: {
      vulnerabilities: {
        info: 0,
        low: 0,
        moderate: 0,
        high: 4,
        critical: 0,
        total: 4,
      },
    },
  };
  const cyclicBaseline = {
    ...baseline,
    maxVulnerablePackages: { high: 4, critical: 0 },
    allowedAdvisories: [
      { source: 1001, package: 'leaf-high', severity: 'high' },
    ],
  };

  const result = evaluate(cyclicReport, cyclicBaseline);

  assert.equal(result.ok, true);
  assert.deepEqual(
    result.severePackages.find(({ name }) => name === 'cycle-node')?.advisorySources,
    [1001],
  );
});

test('dependency audit policy rejects vulnerable package count growth', () => {
  const result = evaluate(report(), {
    ...baseline,
    maxVulnerablePackages: { high: 1, critical: 1 },
  });

  assert.ok(result.violations.some(({ type, severity }) => (
    type === 'vulnerable-package-ceiling-exceeded' && severity === 'high'
  )));
});

test('dependency audit policy rejects malformed baseline and report input', () => {
  assert.equal(evaluate(report(), {}).violations[0].type, 'invalid-audit-baseline');
  assert.equal(evaluate({}).violations[0].type, 'invalid-audit-report');
  assert.equal(
    evaluateDependencyAudit(report(), baseline, { evaluatedAt: 'not-a-date' }).violations[0].type,
    'invalid-audit-evaluation-date',
  );
});

test('dependency audit policy accepts the review deadline and expires the next day', () => {
  assert.equal(evaluate(report(), baseline, '2026-08-14').ok, true);

  const expired = evaluate(report(), baseline, '2026-08-15');
  assert.equal(expired.ok, false);
  assert.ok(expired.violations.some(({ type }) => type === 'audit-baseline-review-expired'));
});

test('dependency audit policy rejects future review dates', () => {
  const result = evaluate(report(), baseline, '2026-07-14');

  assert.ok(result.violations.some(({ type }) => (
    type === 'audit-baseline-review-date-in-future'
  )));
});

test('dependency audit policy limits the review window to 31 days', () => {
  const result = evaluate(report(), { ...baseline, reviewBy: '2026-08-16' });

  assert.ok(result.violations.some(({ type, actualDays }) => (
    type === 'audit-baseline-review-window-invalid' && actualDays === 32
  )));
});

test('dependency audit scopes evaluate full and production graphs independently', () => {
  const production = report();
  delete production.vulnerabilities['leaf-high'];
  delete production.vulnerabilities['meta-high'];
  production.metadata.vulnerabilities.high = 0;
  production.metadata.vulnerabilities.total = 1;

  const result = evaluateDependencyAuditScopes({
    allDependencies: report(),
    production,
  }, baseline, { evaluatedAt: EVALUATED_AT });

  assert.equal(result.ok, true);
  assert.equal(result.allDependencies.summary.high, 2);
  assert.equal(result.production.summary.high, 0);
  assert.equal(result.production.summary.critical, 1);
});

test('dependency audit scopes fail when production has an unreviewed severe advisory', () => {
  const production = report();
  production.vulnerabilities['runtime-high'] = {
    severity: 'high',
    via: [{ source: 1003, severity: 'high' }],
  };
  production.metadata.vulnerabilities.high = 3;
  production.metadata.vulnerabilities.total = 4;

  const result = evaluateDependencyAuditScopes({
    allDependencies: report(),
    production,
  }, {
    ...baseline,
    maxVulnerablePackages: { high: 3, critical: 1 },
  }, { evaluatedAt: EVALUATED_AT });

  assert.equal(result.ok, false);
  assert.ok(result.production.violations.some(({ type, source }) => (
    type === 'unapproved-severe-advisory' && source === 1003
  )));
});

test('dependency audit scopes support a zero-severe production baseline', () => {
  const productionBaseline = {
    ...baseline,
    maxVulnerablePackages: { high: 0, critical: 0 },
    allowedAdvisories: [],
  };
  const result = evaluateDependencyAuditScopes({
    allDependencies: report(),
    production: cleanReport(),
  }, {
    allDependencies: baseline,
    production: productionBaseline,
  }, { evaluatedAt: EVALUATED_AT });

  assert.equal(result.ok, true);
  assert.equal(result.allDependencies.summary.severeAdvisoryCount, 2);
  assert.equal(result.production.summary.severeAdvisoryCount, 0);
  assert.equal(result.production.summary.resolvedBaselineAdvisoryCount, 0);
});

test('zero-severe production baseline rejects debt still allowed in the full graph', () => {
  const result = evaluateDependencyAuditScopes({
    allDependencies: report(),
    production: report(),
  }, {
    allDependencies: baseline,
    production: {
      ...baseline,
      maxVulnerablePackages: { high: 0, critical: 0 },
      allowedAdvisories: [],
    },
  }, { evaluatedAt: EVALUATED_AT });

  assert.equal(result.allDependencies.ok, true);
  assert.equal(result.production.ok, false);
  assert.ok(result.production.violations.some(({ type }) => (
    type === 'unapproved-severe-advisory'
  )));
});
