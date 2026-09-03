import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const executable = process.platform === 'win32' ? 'capacitor-assets.cmd' : 'capacitor-assets';
const binaryPath = path.join(
  workspaceRoot,
  'tools',
  'capacitor-assets',
  'node_modules',
  '.bin',
  executable,
);

if (!existsSync(binaryPath)) {
  process.stderr.write(
    'Capacitor asset tool is not installed. Run `npm run cap:assets:setup` first.\n',
  );
  process.exitCode = 1;
} else {
  const result = spawnSync(binaryPath, process.argv.slice(2), {
    cwd: workspaceRoot,
    stdio: 'inherit',
  });

  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
