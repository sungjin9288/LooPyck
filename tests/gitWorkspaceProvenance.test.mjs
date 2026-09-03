import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { buildGitWorkspaceProvenance } from '../scripts/gitWorkspaceProvenance.mjs';

function runGit(cwd, args) {
  execFileSync('git', args, { cwd, stdio: 'ignore' });
}

test('workspace fingerprint supports binary diffs larger than the default child-process buffer', () => {
  const workspace = mkdtempSync(path.join(os.tmpdir(), 'loopyck-provenance-'));

  try {
    runGit(workspace, ['init']);
    writeFileSync(path.join(workspace, 'large.bin'), randomBytes(1_500_000));
    runGit(workspace, ['add', 'large.bin']);
    runGit(workspace, [
      '-c', 'user.name=LooPyck Test',
      '-c', 'user.email=test@loopyck.local',
      'commit', '-m', 'fixture',
    ]);

    writeFileSync(path.join(workspace, 'large.bin'), randomBytes(1_500_000));

    const provenance = buildGitWorkspaceProvenance(workspace);
    assert.equal(provenance.dirty, true);
    assert.equal(provenance.changedFileCount, 1);
    assert.match(provenance.fingerprint, /^[a-f0-9]{64}$/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});
