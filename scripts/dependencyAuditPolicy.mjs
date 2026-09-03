const SEVERITY_RANK = Object.freeze({ high: 1, critical: 2 });
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_REVIEW_WINDOW_DAYS = 31;

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isSevere(severity) {
  return Object.hasOwn(SEVERITY_RANK, severity);
}

function parseDateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const [year, month, day] = value.split('-').map(Number);
  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);
  if (date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day) return null;

  return { value, timestamp };
}

function normalizeEvaluationDate(value) {
  if (value === undefined) return new Date().toISOString().slice(0, 10);
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  }
  if (parseDateOnly(value)) return value;
  if (typeof value !== 'string') return null;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function validateBaseline(baseline) {
  if (!isObject(baseline)
    || baseline.schemaVersion !== 2
    || !parseDateOnly(baseline.reviewedAt)
    || !parseDateOnly(baseline.reviewBy)
    || !isObject(baseline.maxVulnerablePackages)
    || !Array.isArray(baseline.allowedAdvisories)) {
    return false;
  }

  if (!['high', 'critical'].every((severity) => (
    Number.isInteger(baseline.maxVulnerablePackages[severity])
      && baseline.maxVulnerablePackages[severity] >= 0
  ))) return false;

  const sources = new Set();
  return baseline.allowedAdvisories.every((entry) => {
    const valid = isObject(entry)
      && Number.isInteger(entry.source)
      && entry.source > 0
      && typeof entry.package === 'string'
      && entry.package.length > 0
      && isSevere(entry.severity)
      && !sources.has(entry.source);
    if (valid) sources.add(entry.source);
    return valid;
  });
}

function collectSevereState(report) {
  if (!isObject(report?.vulnerabilities) || !isObject(report?.metadata?.vulnerabilities)) {
    return { valid: false, advisories: [], packages: [], unresolvedPackages: [], conflicts: [] };
  }

  const vulnerabilities = report.vulnerabilities;
  const vulnerabilityEntries = Object.entries(vulnerabilities);
  const referencesByPackage = new Map();
  const advisoriesByPackage = new Map();

  vulnerabilityEntries.forEach(([packageName, vulnerability]) => {
    const via = Array.isArray(vulnerability?.via) ? vulnerability.via : [];
    referencesByPackage.set(
      packageName,
      via.filter((entry) => typeof entry === 'string'),
    );
    advisoriesByPackage.set(
      packageName,
      [...new Map(via
        .filter((entry) => (
          isObject(entry)
          && isSevere(entry.severity)
          && Number.isInteger(entry.source)
        ))
        .map((entry) => [entry.source, {
          source: entry.source,
          package: packageName,
          severity: entry.severity,
        }])).values()],
    );
  });

  for (let pass = 0; pass < vulnerabilityEntries.length; pass += 1) {
    let changed = false;
    vulnerabilityEntries.forEach(([packageName]) => {
      const current = advisoriesByPackage.get(packageName) ?? [];
      const inherited = (referencesByPackage.get(packageName) ?? [])
        .flatMap((dependencyName) => advisoriesByPackage.get(dependencyName) ?? []);
      const resolved = [...new Map(
        [...current, ...inherited].map((entry) => [entry.source, entry]),
      ).values()];
      if (resolved.length > current.length) {
        advisoriesByPackage.set(packageName, resolved);
        changed = true;
      }
    });
    if (!changed) break;
  }

  const resolve = (packageName) => advisoriesByPackage.get(packageName) ?? [];

  const packages = vulnerabilityEntries
    .filter(([, vulnerability]) => isSevere(vulnerability?.severity))
    .map(([name, vulnerability]) => ({
      name,
      severity: vulnerability.severity,
      advisorySources: resolve(name).map(({ source }) => source).sort((a, b) => a - b),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const unresolvedPackages = packages
    .filter(({ advisorySources }) => advisorySources.length === 0)
    .map(({ name }) => name);
  const advisoryMap = new Map();
  const conflicts = [];

  packages.forEach(({ name }) => {
    resolve(name).forEach((entry) => {
      const previous = advisoryMap.get(entry.source);
      if (previous && (previous.package !== entry.package || previous.severity !== entry.severity)) {
        conflicts.push({ source: entry.source, entries: [previous, entry] });
      } else {
        advisoryMap.set(entry.source, entry);
      }
    });
  });

  return {
    valid: true,
    advisories: [...advisoryMap.values()].sort((a, b) => a.source - b.source),
    packages,
    unresolvedPackages,
    conflicts,
  };
}

export function evaluateDependencyAudit(report, baseline, options = {}) {
  const violations = [];
  if (!validateBaseline(baseline)) {
    return {
      ok: false,
      violations: [{ type: 'invalid-audit-baseline' }],
      summary: null,
      severePackages: [],
      currentAdvisories: [],
      resolvedBaselineAdvisories: [],
    };
  }

  const evaluatedAt = normalizeEvaluationDate(options.evaluatedAt);
  if (!evaluatedAt) {
    return {
      ok: false,
      violations: [{ type: 'invalid-audit-evaluation-date' }],
      summary: null,
      severePackages: [],
      currentAdvisories: [],
      resolvedBaselineAdvisories: [],
    };
  }

  const reviewedAt = parseDateOnly(baseline.reviewedAt);
  const reviewBy = parseDateOnly(baseline.reviewBy);
  const reviewWindowDays = Math.round((reviewBy.timestamp - reviewedAt.timestamp) / DAY_MS);
  if (reviewWindowDays < 0 || reviewWindowDays > MAX_REVIEW_WINDOW_DAYS) {
    violations.push({
      type: 'audit-baseline-review-window-invalid',
      reviewedAt: baseline.reviewedAt,
      reviewBy: baseline.reviewBy,
      maximumDays: MAX_REVIEW_WINDOW_DAYS,
      actualDays: reviewWindowDays,
    });
  }
  if (baseline.reviewedAt > evaluatedAt) {
    violations.push({
      type: 'audit-baseline-review-date-in-future',
      reviewedAt: baseline.reviewedAt,
      evaluatedAt,
    });
  }
  if (evaluatedAt > baseline.reviewBy) {
    violations.push({
      type: 'audit-baseline-review-expired',
      reviewBy: baseline.reviewBy,
      evaluatedAt,
    });
  }

  const state = collectSevereState(report);
  if (!state.valid) {
    return {
      ok: false,
      violations: [{ type: 'invalid-audit-report' }],
      summary: null,
      severePackages: [],
      currentAdvisories: [],
      resolvedBaselineAdvisories: [],
    };
  }

  state.unresolvedPackages.forEach((packageName) => {
    violations.push({ type: 'unresolved-severe-package', package: packageName });
  });
  state.conflicts.forEach(({ source }) => {
    violations.push({ type: 'conflicting-advisory-source', source });
  });

  const baselineBySource = new Map(
    baseline.allowedAdvisories.map((entry) => [entry.source, entry]),
  );
  const currentSources = new Set(state.advisories.map(({ source }) => source));

  state.advisories.forEach((advisory) => {
    const approved = baselineBySource.get(advisory.source);
    if (!approved) {
      violations.push({ type: 'unapproved-severe-advisory', ...advisory });
      return;
    }
    if (approved.package !== advisory.package) {
      violations.push({
        type: 'advisory-package-mismatch',
        source: advisory.source,
        expected: approved.package,
        actual: advisory.package,
      });
    }
    if (SEVERITY_RANK[advisory.severity] > SEVERITY_RANK[approved.severity]) {
      violations.push({
        type: 'advisory-severity-increase',
        source: advisory.source,
        expected: approved.severity,
        actual: advisory.severity,
      });
    }
  });

  const packageCounts = state.packages.reduce(
    (counts, entry) => ({ ...counts, [entry.severity]: counts[entry.severity] + 1 }),
    { high: 0, critical: 0 },
  );
  const reportedCounts = report.metadata.vulnerabilities;

  ['high', 'critical'].forEach((severity) => {
    if (reportedCounts[severity] !== packageCounts[severity]) {
      violations.push({
        type: 'audit-count-mismatch',
        severity,
        reported: reportedCounts[severity],
        derived: packageCounts[severity],
      });
    }
    if (packageCounts[severity] > baseline.maxVulnerablePackages[severity]) {
      violations.push({
        type: 'vulnerable-package-ceiling-exceeded',
        severity,
        maximum: baseline.maxVulnerablePackages[severity],
        actual: packageCounts[severity],
      });
    }
  });

  const resolvedBaselineAdvisories = baseline.allowedAdvisories
    .filter(({ source }) => !currentSources.has(source));

  return {
    ok: violations.length === 0,
    violations,
    summary: {
      ...reportedCounts,
      baselineReviewedAt: baseline.reviewedAt,
      baselineReviewBy: baseline.reviewBy,
      evaluatedAt,
      reviewWindowDays,
      severeAdvisoryCount: state.advisories.length,
      resolvedBaselineAdvisoryCount: resolvedBaselineAdvisories.length,
    },
    severePackages: state.packages,
    currentAdvisories: state.advisories,
    resolvedBaselineAdvisories,
  };
}

export function evaluateDependencyAuditScopes(reports, baselines, options = {}) {
  const scopedBaselines = isObject(baselines?.allDependencies)
    || isObject(baselines?.production);
  const allDependenciesBaseline = scopedBaselines ? baselines.allDependencies : baselines;
  const productionBaseline = scopedBaselines ? baselines.production : baselines;
  const allDependencies = evaluateDependencyAudit(
    reports?.allDependencies,
    allDependenciesBaseline,
    options,
  );
  const production = evaluateDependencyAudit(
    reports?.production,
    productionBaseline,
    options,
  );

  return {
    ok: allDependencies.ok && production.ok,
    allDependencies,
    production,
  };
}
