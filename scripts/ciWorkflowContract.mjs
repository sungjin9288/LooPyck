export const CI_JOB_REQUIREMENTS = Object.freeze({
  build: Object.freeze([
    'npm run verify:dependency-audit',
    'npm run build',
  ]),
  test: Object.freeze([
    'npm run typecheck',
    'npm run test:adapters',
    'npm run test:system-stress-contract',
    'npm run test:deployment-provenance-contract',
    'npm run test:release-closeout-contract',
    'npm run test:portfolio-claims-contract',
    'npm run test:ci-workflow-contract',
    'npm run test:dependency-audit-contract',
    'npm run verify:portfolio-claims',
    'npm run verify:ci-workflow',
  ]),
  e2e: Object.freeze([
    'npm run build',
    'npm run ntl:system-stress',
    'npm run test:e2e',
  ]),
});

export const CI_UPLOAD_REQUIREMENTS = Object.freeze([
  Object.freeze({
    job: 'build',
    name: 'Upload dependency audit evidence',
    paths: Object.freeze(['output/playwright/dependency-audit-policy.json']),
  }),
  Object.freeze({
    job: 'build',
    name: 'Upload build artifacts',
    paths: Object.freeze([
      '.next/',
      'public/deployment-provenance.json',
    ]),
  }),
  Object.freeze({
    job: 'test',
    name: 'Upload portfolio claim audit',
    paths: Object.freeze(['output/playwright/portfolio-claim-audit.json']),
  }),
  Object.freeze({
    job: 'test',
    name: 'Upload CI workflow audit',
    paths: Object.freeze(['output/playwright/ci-workflow-contract.json']),
  }),
  Object.freeze({
    job: 'e2e',
    name: 'Upload system stress evidence',
    paths: Object.freeze(['output/playwright/local-system-stress-smoke.json']),
  }),
]);

export const CI_WORKFLOW_REQUIREMENTS = Object.freeze([
  ...Object.values(CI_JOB_REQUIREMENTS).flat(),
  ...CI_UPLOAD_REQUIREMENTS.flatMap(({ paths }) => paths.map((path) => `path: ${path}`)),
]);

function extractJob(workflow, jobName) {
  const lines = workflow.split('\n');
  const jobsIndex = lines.findIndex((line) => /^jobs:\s*(?:#.*)?$/.test(line));
  if (jobsIndex === -1) return null;

  const jobPattern = /^  ([A-Za-z0-9_-]+):\s*(?:#.*)?$/;
  const start = lines.findIndex((line, index) => (
    index > jobsIndex && jobPattern.exec(line)?.[1] === jobName
  ));
  if (start === -1) return null;

  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (jobPattern.test(lines[index])) {
      end = index;
      break;
    }
  }

  return lines.slice(start, end);
}

function extractRunCommands(jobLines) {
  const commands = [];

  jobLines.forEach((line, index) => {
    const match = /^(\s*)run:\s*(.*)$/.exec(line);
    if (!match) return;

    const indentation = match[1].length;
    const value = match[2].trim();
    if (value !== '|' && value !== '>') {
      commands.push({ command: value, line: index });
      return;
    }

    for (let next = index + 1; next < jobLines.length; next += 1) {
      const candidate = jobLines[next];
      if (candidate.trim() === '') continue;
      const candidateIndentation = candidate.match(/^\s*/)?.[0].length ?? 0;
      if (candidateIndentation <= indentation) break;
      const command = candidate.trim();
      if (!command.startsWith('#')) commands.push({ command, line: next });
    }
  });

  return commands;
}

function extractNamedStep(jobLines, stepName) {
  const stepPattern = /^(\s*)- name:\s*(.+?)\s*$/;
  const start = jobLines.findIndex((line) => stepPattern.exec(line)?.[2] === stepName);
  if (start === -1) return null;

  const indentation = stepPattern.exec(jobLines[start])?.[1].length ?? 0;
  let end = jobLines.length;
  for (let index = start + 1; index < jobLines.length; index += 1) {
    const nextStep = /^(\s*)- (?:name|uses|run):/.exec(jobLines[index]);
    if (nextStep && nextStep[1].length === indentation) {
      end = index;
      break;
    }
  }
  return jobLines.slice(start, end);
}

function stepValue(stepLines, key) {
  const pattern = new RegExp(`^\\s*${key}:\\s*(.+?)\\s*$`);
  return stepLines.map((line) => pattern.exec(line)?.[1]).find(Boolean) ?? null;
}

function stepListValue(stepLines, key) {
  const pattern = new RegExp(`^(\\s*)${key}:\\s*(.*?)\\s*$`);
  const index = stepLines.findIndex((line) => pattern.test(line));
  if (index === -1) return [];

  const match = pattern.exec(stepLines[index]);
  const indentation = match?.[1].length ?? 0;
  const value = match?.[2] ?? '';
  if (value !== '|' && value !== '>') return value ? [value] : [];

  const values = [];
  for (let next = index + 1; next < stepLines.length; next += 1) {
    const candidate = stepLines[next];
    if (!candidate.trim() || candidate.trim().startsWith('#')) continue;
    const candidateIndentation = candidate.match(/^\s*/)?.[0].length ?? 0;
    if (candidateIndentation <= indentation) break;
    values.push(candidate.trim());
  }
  return values;
}

export function auditCiWorkflow(workflow) {
  const violations = [];
  const jobs = Object.fromEntries(
    Object.keys(CI_JOB_REQUIREMENTS).map((jobName) => [jobName, extractJob(workflow, jobName)]),
  );
  const commandsByJob = {};

  Object.entries(CI_JOB_REQUIREMENTS).forEach(([jobName, requirements]) => {
    const jobLines = jobs[jobName];
    if (!jobLines) {
      violations.push({ type: 'missing-ci-job', job: jobName });
      return;
    }

    const commands = extractRunCommands(jobLines);
    commandsByJob[jobName] = commands;
    requirements.forEach((command) => {
      if (!commands.some((entry) => entry.command === command)) {
        violations.push({ type: 'missing-job-command', job: jobName, command });
      }
      if (commands.some((entry) => entry.command.startsWith(command) && entry.command.includes('|| true'))) {
        violations.push({ type: 'non-blocking-ci-gate', job: jobName, command });
      }
    });
  });

  const e2eCommands = commandsByJob.e2e ?? [];
  const orderedCommands = CI_JOB_REQUIREMENTS.e2e.map((command) => (
    e2eCommands.find((entry) => entry.command === command)?.line ?? -1
  ));
  if (orderedCommands.some((line) => line === -1)
    || orderedCommands.some((line, index) => index > 0 && line <= orderedCommands[index - 1])) {
    violations.push({ type: 'invalid-e2e-gate-order' });
  }

  const buildCommands = commandsByJob.build ?? [];
  const orderedBuildCommands = CI_JOB_REQUIREMENTS.build.map((command) => (
    buildCommands.find((entry) => entry.command === command)?.line ?? -1
  ));
  if (orderedBuildCommands.some((line) => line === -1)
    || orderedBuildCommands.some((line, index) => index > 0 && line <= orderedBuildCommands[index - 1])) {
    violations.push({ type: 'invalid-build-gate-order' });
  }

  CI_UPLOAD_REQUIREMENTS.forEach(({ job, name, paths }) => {
    const jobLines = jobs[job];
    const step = jobLines ? extractNamedStep(jobLines, name) : null;
    if (!step) {
      violations.push({ type: 'missing-upload-step', job, name });
      return;
    }
    if (!step.some((line) => /^\s*uses:\s*actions\/upload-artifact@/.test(line))) {
      violations.push({ type: 'missing-upload-action', job, name });
    }
    if (stepValue(step, 'if') !== 'always()') {
      violations.push({ type: 'missing-always-upload', job, name });
    }
    const actualPaths = stepListValue(step, 'path');
    if (actualPaths.length !== paths.length
      || actualPaths.some((path, index) => path !== paths[index])) {
      violations.push({ type: 'invalid-upload-paths', job, name, paths });
    }
  });

  return { ok: violations.length === 0, violations };
}
