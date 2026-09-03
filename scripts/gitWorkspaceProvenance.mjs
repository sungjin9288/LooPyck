import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function runGit(args, cwd, encoding = 'utf8') {
  return execFileSync('git', args, {
    cwd,
    encoding,
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'ignore'],
  });
}

export function buildGitWorkspaceProvenance(cwd = process.cwd()) {
  const head = runGit(['rev-parse', 'HEAD'], cwd).trim();
  const branch = runGit(['branch', '--show-current'], cwd).trim() || 'detached';
  const statusLines = runGit(['status', '--porcelain'], cwd)
    .split('\n')
    .filter(Boolean);
  const trackedDiff = runGit(['diff', '--binary', 'HEAD'], cwd, null);
  const untrackedFiles = runGit(['ls-files', '--others', '--exclude-standard', '-z'], cwd)
    .split('\0')
    .filter(Boolean)
    .sort();

  const fingerprint = createHash('sha256');
  fingerprint.update(trackedDiff);
  untrackedFiles.forEach((relativePath) => {
    fingerprint.update('\0path\0');
    fingerprint.update(relativePath);
    fingerprint.update('\0content\0');
    fingerprint.update(readFileSync(resolve(cwd, relativePath)));
  });

  return {
    head,
    branch,
    dirty: statusLines.length > 0,
    changedFileCount: statusLines.length,
    fingerprint: fingerprint.digest('hex'),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.stdout.write(`${JSON.stringify(buildGitWorkspaceProvenance(), null, 2)}\n`);
}
