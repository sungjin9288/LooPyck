import fs from 'node:fs/promises';
import path from 'node:path';

import { validateDeploymentProvenance } from './deploymentProvenanceContract.mjs';
import { buildGitWorkspaceProvenance } from './gitWorkspaceProvenance.mjs';

const baseUrl = process.argv[2] || process.env.SMOKE_BASE_URL || 'https://loo-pyck.netlify.app';
const workspace = process.cwd();
const runnerWorkspace = buildGitWorkspaceProvenance(workspace);
const expectedCommit = process.argv[3] || process.env.EXPECTED_DEPLOY_COMMIT || runnerWorkspace.head;
const hostname = new URL(baseUrl).hostname;
const targetName = hostname === 'localhost' || hostname === '127.0.0.1' ? 'local' : 'netlify';
const targetKind = targetName === 'local' ? 'local-working-tree' : 'deployed-environment';
const requestUrl = new URL('/deployment-provenance.json', baseUrl).toString();
const outputPath = path.join(
  workspace,
  'output',
  'playwright',
  `${targetName}-deployment-provenance.json`,
);

let responseStatus = null;
let contentType = null;
let deployment = null;
let failure = null;

try {
  const response = await fetch(requestUrl, {
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

const audit = validateDeploymentProvenance(deployment);
const commitMatchesExpected = Boolean(audit.ok && deployment.commit === expectedCommit);
const evidence = {
  ok: responseStatus === 200 && audit.ok && commitMatchesExpected,
  generatedAt: new Date().toISOString(),
  baseUrl,
  targetKind,
  requestUrl,
  expectedCommit,
  commitMatchesExpected,
  responseStatus,
  contentType,
  deployment,
  violations: audit.violations,
  failure,
  runnerWorkspace,
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify({ ...evidence, outputPath }, null, 2)}\n`);
if (!evidence.ok) process.exitCode = 1;
