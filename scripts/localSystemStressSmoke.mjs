import { execFile, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import {
  buildSystemStressRunnerIdentity,
  DEFAULT_SYSTEM_STRESS_THRESHOLDS,
  evaluateSystemStressBuildProvenance,
  evaluateSystemStressRun,
} from './systemStressContract.mjs';
import { buildGitWorkspaceProvenance } from './gitWorkspaceProvenance.mjs';

const execFileAsync = promisify(execFile);
const workspace = process.cwd();
const port = Number.parseInt(process.env.SYSTEM_STRESS_PORT || '3211', 10);
const totalRequests = Number.parseInt(process.env.SYSTEM_STRESS_REQUESTS || '100', 10);
const concurrency = Number.parseInt(process.env.SYSTEM_STRESS_CONCURRENCY || '100', 10);
const baseUrl = `http://127.0.0.1:${port}`;
const outputPath = path.join(workspace, 'output', 'playwright', 'local-system-stress-smoke.json');
const standaloneLauncher = path.join(workspace, 'scripts', 'startStandalone.mjs');
const provenanceUrl = new URL('/deployment-provenance.json', baseUrl).toString();

const targets = [
  { name: 'home', path: '/', expectedStatus: 200, marker: 'LooPyck' },
  { name: 'favorites', path: '/favorites', expectedStatus: 200, marker: 'My Favorites' },
  { name: 'search-validation', path: '/api/realtime-search', expectedStatus: 400, marker: 'Query parameter' },
  { name: 'history-validation', path: '/api/price-history', expectedStatus: 400, contentType: 'application/json' },
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function roundMb(kilobytes) {
  return Math.round((kilobytes / 1024) * 100) / 100;
}

async function readProcessTreeRssMb(rootPid) {
  const { stdout } = await execFileAsync('ps', ['-axo', 'pid=,ppid=,rss=']);
  const rows = stdout
    .trim()
    .split('\n')
    .map((line) => line.trim().split(/\s+/).map(Number))
    .filter(([pid, parentPid, rss]) => (
      Number.isFinite(pid) && Number.isFinite(parentPid) && Number.isFinite(rss)
    ));
  const processIds = new Set([rootPid]);
  let added = true;

  while (added) {
    added = false;
    rows.forEach(([pid, parentPid]) => {
      if (processIds.has(parentPid) && !processIds.has(pid)) {
        processIds.add(pid);
        added = true;
      }
    });
  }

  const rssKb = rows.reduce(
    (total, [pid, , rss]) => total + (processIds.has(pid) ? rss : 0),
    0,
  );
  return roundMb(rssKb);
}

async function waitForServer(server, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`standalone_start_exited_${server.exitCode}`);
    }
    try {
      const response = await fetch(baseUrl, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) return;
    } catch {
      // The production server may still be starting.
    }
    await delay(200);
  }

  throw new Error(`standalone_start_timeout_${timeoutMs}`);
}

async function terminateServer(server) {
  if (server.exitCode !== null) return;
  server.kill('SIGTERM');
  const exited = await Promise.race([
    new Promise((resolve) => server.once('exit', () => resolve(true))),
    delay(5_000).then(() => false),
  ]);
  if (!exited && server.exitCode === null) {
    server.kill('SIGKILL');
  }
}

async function readBuildProvenance(runnerWorkspace, runnerIdentity) {
  let responseStatus = null;
  let contentType = null;
  let deployment = null;
  let failure = null;

  try {
    const response = await fetch(provenanceUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    responseStatus = response.status;
    contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json')) {
      deployment = await response.json();
    } else {
      failure = `unexpected_response:${response.status}:${contentType}`;
    }
  } catch (error) {
    failure = error instanceof Error ? error.message : String(error);
  }

  const audit = evaluateSystemStressBuildProvenance(
    deployment,
    runnerWorkspace,
    runnerIdentity,
  );
  return {
    ok: responseStatus === 200 && audit.ok,
    requestUrl: provenanceUrl,
    responseStatus,
    contentType,
    deployment,
    violations: audit.violations,
    failure,
  };
}

async function writeEvidence(evidence) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify({ ...evidence, outputPath }, null, 2)}\n`);
}

async function requestTarget(index) {
  const target = targets[index % targets.length];
  const startedAt = performance.now();

  try {
    const response = await fetch(new URL(target.path, baseUrl), {
      headers: { 'User-Agent': `LooPyckSystemStress/${index + 1}` },
      signal: AbortSignal.timeout(15_000),
    });
    const body = await response.text();
    const contentType = response.headers.get('content-type') || '';
    const passed = response.status === target.expectedStatus
      && (!target.marker || body.includes(target.marker))
      && (!target.contentType || contentType.includes(target.contentType));

    return {
      index: index + 1,
      target: target.name,
      status: response.status,
      latencyMs: Math.round((performance.now() - startedAt) * 100) / 100,
      passed,
      failure: passed ? null : 'response_contract_mismatch',
    };
  } catch (error) {
    return {
      index: index + 1,
      target: target.name,
      status: null,
      latencyMs: Math.round((performance.now() - startedAt) * 100) / 100,
      passed: false,
      failure: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runRequests() {
  const results = new Array(totalRequests);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= totalRequests) return;
      results[index] = await requestTarget(index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, totalRequests) }, () => worker()),
  );
  return results;
}

async function main() {
  if (!existsSync(path.join(workspace, '.next', 'BUILD_ID'))) {
    throw new Error('production_build_missing_run_npm_run_build_first');
  }
  if (!Number.isFinite(port) || port <= 0) throw new Error('invalid_system_stress_port');
  if (!Number.isFinite(totalRequests) || totalRequests <= 0) throw new Error('invalid_request_count');
  if (!Number.isFinite(concurrency) || concurrency <= 0) throw new Error('invalid_concurrency');

  const server = spawn(process.execPath, [standaloneLauncher, '--port', String(port)], {
    cwd: workspace,
    env: process.env,
    stdio: ['ignore', 'ignore', 'ignore'],
  });
  const startedAt = Date.now();
  const runnerWorkspace = buildGitWorkspaceProvenance(workspace);
  const runnerIdentity = buildSystemStressRunnerIdentity(process.env);

  try {
    await waitForServer(server);
    const buildProvenance = await readBuildProvenance(runnerWorkspace, runnerIdentity);
    if (!buildProvenance.ok) {
      await writeEvidence({
        ok: false,
        generatedAt: new Date().toISOString(),
        targetKind: 'local-production-build',
        baseUrl,
        runnerWorkspace,
        runnerIdentity,
        durationMs: Date.now() - startedAt,
        buildProvenance,
        configuration: {
          totalRequests,
          concurrency,
          targets: targets.map(({ name, path: targetPath, expectedStatus }) => ({
            name,
            path: targetPath,
            expectedStatus,
          })),
          thresholds: DEFAULT_SYSTEM_STRESS_THRESHOLDS,
        },
        memory: null,
        evaluation: null,
        targetSummary: [],
        failures: ['build_provenance_invalid'],
      });
      process.exitCode = 1;
      return;
    }

    const rssBeforeMb = await readProcessTreeRssMb(server.pid);
    let rssPeakMb = rssBeforeMb;
    let sampling = true;
    const memorySampler = (async () => {
      while (sampling) {
        try {
          rssPeakMb = Math.max(rssPeakMb, await readProcessTreeRssMb(server.pid));
        } catch {
          // The final sample remains authoritative if the server is still alive.
        }
        await delay(10);
      }
    })();

    const results = await runRequests();
    sampling = false;
    await memorySampler;
    const rssAfterMb = await readProcessTreeRssMb(server.pid);
    rssPeakMb = Math.max(rssPeakMb, rssAfterMb);
    const run = {
      concurrency,
      results,
      memory: { rssBeforeMb, rssPeakMb, rssAfterMb },
    };
    const evaluation = evaluateSystemStressRun(run);
    const evidence = {
      ok: evaluation.ok,
      generatedAt: new Date().toISOString(),
      targetKind: 'local-production-build',
      baseUrl,
      runnerWorkspace,
      runnerIdentity,
      durationMs: Date.now() - startedAt,
      buildProvenance,
      configuration: {
        totalRequests,
        concurrency,
        targets: targets.map(({ name, path: targetPath, expectedStatus }) => ({
          name,
          path: targetPath,
          expectedStatus,
        })),
        thresholds: DEFAULT_SYSTEM_STRESS_THRESHOLDS,
      },
      memory: run.memory,
      evaluation,
      targetSummary: targets.map((target) => {
        const targetResults = results.filter((result) => result.target === target.name);
        return {
          target: target.name,
          requests: targetResults.length,
          passed: targetResults.filter((result) => result.passed).length,
        };
      }),
      failures: results.filter((result) => !result.passed).slice(0, 20),
    };

    await writeEvidence(evidence);
    if (!evidence.ok) process.exitCode = 1;
  } finally {
    await terminateServer(server);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
