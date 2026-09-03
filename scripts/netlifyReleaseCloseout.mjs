import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { buildGitWorkspaceProvenance } from './gitWorkspaceProvenance.mjs';

export const RELEASE_CLOSEOUT_STEPS = Object.freeze([
  Object.freeze({ id: 'netlify-uat', command: 'npm', args: ['run', 'ntl:uat'] }),
  Object.freeze({ id: 'runtime-readiness', command: 'npm', args: ['run', 'ntl:quick-pass:runtime-ready'] }),
  Object.freeze({ id: 'release-report', command: 'npm', args: ['run', 'ntl:release-report'] }),
]);

export async function executeReleaseCloseout(runStep) {
  const steps = [];

  for (const definition of RELEASE_CLOSEOUT_STEPS) {
    const startedAt = Date.now();
    try {
      const result = await runStep(definition);
      steps.push({
        id: definition.id,
        ok: result?.exitCode === 0,
        exitCode: result?.exitCode ?? 1,
        durationMs: Date.now() - startedAt,
      });
    } catch (error) {
      steps.push({
        id: definition.id,
        ok: false,
        exitCode: 1,
        durationMs: Date.now() - startedAt,
        failure: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    ok: steps.length === RELEASE_CLOSEOUT_STEPS.length && steps.every((step) => step.ok),
    steps,
  };
}

function runCommand(definition) {
  return new Promise((resolve) => {
    const child = spawn(definition.command, definition.args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'inherit',
    });
    child.once('error', () => resolve({ exitCode: 1 }));
    child.once('close', (exitCode) => resolve({ exitCode: exitCode ?? 1 }));
  });
}

async function main() {
  const workspace = process.cwd();
  const outputPath = path.join(
    workspace,
    'output',
    'playwright',
    'netlify-release-closeout-execution.json',
  );
  const result = await executeReleaseCloseout(runCommand);
  const artifact = {
    ...result,
    generatedAt: new Date().toISOString(),
    runnerWorkspace: buildGitWorkspaceProvenance(workspace),
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify({ ...artifact, outputPath }, null, 2)}\n`);
  if (!artifact.ok) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
