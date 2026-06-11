import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

function runCommand(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    ...options,
  });
}

function runJsonCommand(command, args) {
  return JSON.parse(runCommand(command, args));
}

const workspace = process.cwd();
const outputDir = path.join(workspace, 'output', 'playwright');
const outputPath = path.join(outputDir, 'playwright-quick-pass-recovery.json');
const codeHome = process.env.CODEX_HOME ?? path.join(process.env.HOME ?? '', '.codex');
const playwrightCli = path.join(codeHome, 'skills', 'playwright', 'scripts', 'playwright_cli.sh');
const baseUrl = process.env.SMOKE_BASE_URL ?? 'https://loo-pyck.netlify.app';

mkdirSync(outputDir, { recursive: true });

const closeAll = (() => {
  try {
    runCommand(playwrightCli, ['close-all']);
    return { ok: true, command: `${playwrightCli} close-all` };
  } catch (error) {
    return {
      ok: false,
      command: `${playwrightCli} close-all`,
      stderr: error.stderr?.toString?.() ?? '',
    };
  }
})();

const prep = runJsonCommand('bash', ['scripts/netlifyQuickPassPrep.sh', baseUrl]);
const doctor = runJsonCommand('node', ['scripts/playwrightMcpDoctor.mjs']);
const localVerify = runJsonCommand('node', ['scripts/verifyPlaywrightMcpLocal.mjs']);
const health = runJsonCommand('node', ['scripts/buildPlaywrightMcpHealth.mjs']);

const summary = {
  generatedAt: new Date().toISOString(),
  workspace,
  status: health.status,
  recommendation: health.recommendation,
  closeAll,
  prep: {
    baseUrl: prep.baseUrl,
    outputPath: prep.outputPath,
  },
  doctor: {
    status: doctor.status,
    outputPath: doctor.outputPath,
  },
  localVerify: {
    status: localVerify.status,
    outputPath: localVerify.outputPath,
  },
  health: {
    status: health.status,
    outputPath: health.outputPath,
  },
};

writeFileSync(outputPath, JSON.stringify(summary, null, 2));
process.stdout.write(`${JSON.stringify({ ...summary, outputPath }, null, 2)}\n`);
