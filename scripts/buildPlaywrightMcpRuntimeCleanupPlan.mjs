import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

function runJsonScript(scriptPath) {
  const output = execFileSync('node', [scriptPath], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  return JSON.parse(output);
}

function readJsonIfExists(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function runCommand(command, args) {
  try {
    return execFileSync(command, args, {
      cwd: process.cwd(),
      encoding: 'utf8',
    }).trim();
  } catch {
    return '';
  }
}

function readParentProcess(ppid) {
  if (!ppid) return null;
  const output = runCommand('ps', ['-p', String(ppid), '-o', 'pid=,ppid=,etime=,stat=,command=']);
  if (!output) return null;
  const match = output.trim().match(/^(\d+)\s+(\d+)\s+(\S+)\s+(\S+)\s+(.+)$/);
  if (!match) {
    return {
      pid: ppid,
      raw: output.trim(),
    };
  }

  const [, pidText, parentPidText, elapsed, stat, command] = match;
  return {
    pid: Number(pidText),
    ppid: Number(parentPidText),
    elapsed,
    stat,
    command,
  };
}

const workspace = process.cwd();
const outputDir = path.join(workspace, 'output', 'playwright');
const outputPath = path.join(outputDir, 'playwright-mcp-runtime-cleanup-plan.md');
const healthPath = path.join(outputDir, 'playwright-mcp-health.json');

mkdirSync(outputDir, { recursive: true });

const doctor = runJsonScript(path.join('scripts', 'playwrightMcpDoctor.mjs'));
const existingHealth = readJsonIfExists(healthPath);
const rootCwdProcesses = doctor.processes
  ?.filter((process) => process.usesRootCwd)
  .map(({ pid, ppid, elapsed, stat, command, cwd }) => ({
    pid,
    ppid,
    elapsed,
    stat,
    command,
    cwd,
    parent: readParentProcess(ppid),
  })) ?? [];
const workspaceProcesses = doctor.processes
  ?.filter((process) => process.cwd === workspace)
  .map(({ pid, ppid, elapsed, stat, command, cwd }) => ({
    pid,
    ppid,
    elapsed,
    stat,
    command,
    cwd,
    parent: readParentProcess(ppid),
  })) ?? [];
const hasCleanupCandidates = rootCwdProcesses.length > 0;

const lines = [
  '# Playwright MCP Runtime Cleanup Plan',
  '',
  `Date: ${new Date().toISOString()}`,
  `Workspace: ${workspace}`,
  `Doctor status: ${doctor.status}`,
  `Operational status: ${existingHealth?.status ?? 'unknown'}`,
  '',
  '## Summary',
  '',
  hasCleanupCandidates
    ? '- Global root-cwd Playwright MCP process candidates are present. Review ownership before terminating anything.'
    : '- No global root-cwd Playwright MCP process candidates are currently present.',
  `- Workspace process count: ${workspaceProcesses.length}`,
  `- Root-cwd process count: ${rootCwdProcesses.length}`,
  '',
  '## Root-cwd candidates',
  '',
  ...(hasCleanupCandidates
    ? rootCwdProcesses.flatMap((process) => [
        `- pid: ${process.pid}`,
        `  ppid: ${process.ppid ?? 'unknown'}`,
        `  elapsed: ${process.elapsed ?? 'unknown'}`,
        `  stat: ${process.stat ?? 'unknown'}`,
        `  cwd: ${process.cwd}`,
        `  command: ${process.command}`,
        `  parent command: ${process.parent?.command ?? process.parent?.raw ?? 'unknown'}`,
        `  inspect: \`lsof -a -d cwd -p ${process.pid}\``,
        `  inspect parent: \`ps -p ${process.ppid ?? '<ppid>'} -o pid=,ppid=,etime=,stat=,command=\``,
        `  terminate after ownership check: \`kill ${process.pid}\``,
      ])
    : ['- none']),
  '',
  '## Workspace processes',
  '',
  ...(workspaceProcesses.length > 0
    ? workspaceProcesses.flatMap((process) => [
        `- pid: ${process.pid}`,
        `  ppid: ${process.ppid ?? 'unknown'}`,
        `  elapsed: ${process.elapsed ?? 'unknown'}`,
        `  stat: ${process.stat ?? 'unknown'}`,
        `  cwd: ${process.cwd}`,
        `  command: ${process.command}`,
        `  parent command: ${process.parent?.command ?? process.parent?.raw ?? 'unknown'}`,
      ])
    : ['- none']),
  '',
  '## Cleanup rules',
  '',
  '- Do not terminate a root-cwd process unless it is known to be stale or unrelated to an active workspace/session.',
  '- Prefer closing the owning Codex/browser session first when that ownership is known.',
  '- After cleanup, run `npm run ntl:quick-pass:health` and expect `fully-ok` only if doctor status is `ok` and local verify is `ok`.',
  '- If cleanup is not safe, keep operational stance at `fallback-ready`.',
];

writeFileSync(outputPath, `${lines.join('\n')}\n`);
process.stdout.write(`${JSON.stringify({
  generatedAt: new Date().toISOString(),
  workspace,
  status: hasCleanupCandidates ? 'cleanup-candidates-present' : 'no-cleanup-candidates',
  rootCwdProcessCount: rootCwdProcesses.length,
  workspaceProcessCount: workspaceProcesses.length,
  outputPath,
}, null, 2)}\n`);
