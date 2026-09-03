import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  evaluateDependencyAudit,
  evaluateDependencyAuditScopes,
} from './dependencyAuditPolicy.mjs';
import { buildGitWorkspaceProvenance } from './gitWorkspaceProvenance.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baselinePath = path.join(rootDir, 'config', 'npm-audit-baseline.json');
const productionBaselinePath = path.join(
  rootDir,
  'config',
  'npm-audit-production-baseline.json',
);
const capacitorAssetsToolDir = path.join(rootDir, 'tools', 'capacitor-assets');
const capacitorAssetsBaselinePath = path.join(
  rootDir,
  'config',
  'npm-audit-capacitor-assets-baseline.json',
);
const outputPath = path.join(rootDir, 'output', 'playwright', 'dependency-audit-policy.json');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function runAudit(args, cwd = rootDir) {
  const command = spawnSync(npmCommand, args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });

  let report = null;
  let parseError = null;
  try {
    report = JSON.parse(command.stdout);
  } catch (error) {
    parseError = error instanceof Error ? error.message : String(error);
  }

  return { command, report, parseError };
}

const allDependenciesAudit = runAudit(['audit', '--json']);
const productionAudit = runAudit(['audit', '--omit=dev', '--json']);
const capacitorAssetsAudit = runAudit(['audit', '--json'], capacitorAssetsToolDir);
const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
const productionBaseline = JSON.parse(readFileSync(productionBaselinePath, 'utf8'));
const capacitorAssetsBaseline = JSON.parse(
  readFileSync(capacitorAssetsBaselinePath, 'utf8'),
);
const evaluatedAt = new Date().toISOString().slice(0, 10);
const scopeEvaluation = evaluateDependencyAuditScopes({
  allDependencies: allDependenciesAudit.report,
  production: productionAudit.report,
}, {
  allDependencies: baseline,
  production: productionBaseline,
}, { evaluatedAt });

function withCommandFailure(evaluation, audit) {
  if (audit.report) return evaluation;
  return {
    ...evaluation,
    ok: false,
    violations: [
      ...evaluation.violations,
      { type: 'audit-command-output-invalid', parseError: audit.parseError },
    ],
  };
}

const allDependencies = withCommandFailure(
  scopeEvaluation.allDependencies,
  allDependenciesAudit,
);
const production = withCommandFailure(scopeEvaluation.production, productionAudit);
const capacitorAssets = withCommandFailure(
  evaluateDependencyAudit(
    capacitorAssetsAudit.report,
    capacitorAssetsBaseline,
    { evaluatedAt },
  ),
  capacitorAssetsAudit,
);

const artifact = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  evaluatedAt,
  command: 'npm audit --json',
  commandExitCode: allDependenciesAudit.command.status,
  commandError: allDependenciesAudit.command.error?.message ?? null,
  baselinePath: 'config/npm-audit-baseline.json',
  runnerWorkspace: buildGitWorkspaceProvenance(rootDir),
  ...allDependencies,
  ok: allDependencies.ok && production.ok && capacitorAssets.ok,
  productionAudit: {
    command: 'npm audit --omit=dev --json',
    commandExitCode: productionAudit.command.status,
    commandError: productionAudit.command.error?.message ?? null,
    baselinePath: 'config/npm-audit-production-baseline.json',
    ...production,
  },
  toolingAudits: {
    capacitorAssets: {
      command: 'npm audit --json',
      commandExitCode: capacitorAssetsAudit.command.status,
      commandError: capacitorAssetsAudit.command.error?.message ?? null,
      cwd: 'tools/capacitor-assets',
      baselinePath: 'config/npm-audit-capacitor-assets-baseline.json',
      ...capacitorAssets,
    },
  },
};

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(artifact, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);

if (!artifact.ok) process.exitCode = 1;
