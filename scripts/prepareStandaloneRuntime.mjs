import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function resolveStandaloneRuntimePaths(workspace = process.cwd()) {
  const nextDir = path.join(workspace, '.next');
  const standaloneDir = path.join(nextDir, 'standalone');

  return {
    workspace,
    serverPath: path.join(standaloneDir, 'server.js'),
    copies: [
      {
        name: 'public',
        source: path.join(workspace, 'public'),
        destination: path.join(standaloneDir, 'public'),
      },
      {
        name: 'next-static',
        source: path.join(nextDir, 'static'),
        destination: path.join(standaloneDir, '.next', 'static'),
      },
    ],
  };
}

export async function prepareStandaloneRuntime(workspace = process.cwd()) {
  const runtime = resolveStandaloneRuntimePaths(workspace);
  if (!existsSync(runtime.serverPath)) {
    throw new Error('standalone_server_missing_run_npm_run_build_first');
  }

  for (const entry of runtime.copies) {
    if (!existsSync(entry.source)) {
      throw new Error(`standalone_${entry.name}_source_missing`);
    }
    await fs.rm(entry.destination, { recursive: true, force: true });
    await fs.mkdir(path.dirname(entry.destination), { recursive: true });
    await fs.cp(entry.source, entry.destination, { recursive: true, force: true });
  }

  return runtime;
}

function isDirectExecution() {
  return Boolean(process.argv[1])
    && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
}

if (isDirectExecution()) {
  prepareStandaloneRuntime()
    .then((runtime) => {
      process.stdout.write(`${JSON.stringify({
        ok: true,
        serverPath: runtime.serverPath,
        copied: runtime.copies.map(({ name, destination }) => ({ name, destination })),
      }, null, 2)}\n`);
    })
    .catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    });
}
