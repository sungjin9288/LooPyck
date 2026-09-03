import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

import { resolveStandaloneRuntimePaths } from './prepareStandaloneRuntime.mjs';

export function parseStandalonePort(args = process.argv.slice(2), env = process.env) {
  const inline = args.find((argument) => argument.startsWith('--port='));
  const flagIndex = args.findIndex((argument) => argument === '--port' || argument === '-p');
  const raw = inline?.slice('--port='.length)
    ?? (flagIndex >= 0 ? args[flagIndex + 1] : undefined)
    ?? env.PORT
    ?? '3000';
  const port = Number.parseInt(raw, 10);

  if (!/^\d+$/.test(raw) || !Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`invalid_standalone_port:${raw}`);
  }
  return port;
}

export function assertStandaloneRuntime(workspace = process.cwd()) {
  const runtime = resolveStandaloneRuntimePaths(workspace);
  const missing = [
    runtime.serverPath,
    ...runtime.copies.map(({ destination }) => destination),
  ].filter((entry) => !existsSync(entry));

  if (missing.length > 0) {
    throw new Error(`standalone_runtime_incomplete:${missing.join(',')}`);
  }
  return runtime;
}

export async function startStandalone({
  workspace = process.cwd(),
  port = parseStandalonePort(),
  hostname = process.env.STANDALONE_HOSTNAME || '0.0.0.0',
  stdio = 'inherit',
} = {}) {
  const runtime = assertStandaloneRuntime(workspace);
  const server = spawn(process.execPath, [runtime.serverPath], {
    cwd: workspace,
    env: {
      ...process.env,
      HOSTNAME: hostname,
      PORT: String(port),
    },
    stdio,
  });

  const forwardSignal = (signal) => {
    if (server.exitCode === null) server.kill(signal);
  };
  const forwardSigint = () => forwardSignal('SIGINT');
  const forwardSigterm = () => forwardSignal('SIGTERM');
  process.once('SIGINT', forwardSigint);
  process.once('SIGTERM', forwardSigterm);

  try {
    return await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.once('exit', (code, signal) => resolve({ code, signal }));
    });
  } finally {
    process.removeListener('SIGINT', forwardSigint);
    process.removeListener('SIGTERM', forwardSigterm);
  }
}

function isDirectExecution() {
  return Boolean(process.argv[1])
    && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
}

if (isDirectExecution()) {
  startStandalone()
    .then(({ code, signal }) => {
      process.exitCode = code ?? (signal ? 1 : 0);
    })
    .catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    });
}
