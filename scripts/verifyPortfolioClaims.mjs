import fs from 'node:fs/promises';
import path from 'node:path';

import {
  CURRENT_PORTFOLIO_DOCS,
  LEGACY_PLANNING_DOCS,
  auditPortfolioClaims,
} from './portfolioClaimPolicy.mjs';
import { buildGitWorkspaceProvenance } from './gitWorkspaceProvenance.mjs';

const workspace = process.cwd();
const outputPath = path.join(workspace, 'output', 'playwright', 'portfolio-claim-audit.json');
const documentPaths = [...CURRENT_PORTFOLIO_DOCS, ...LEGACY_PLANNING_DOCS];
const documents = {};

for (const filePath of documentPaths) {
  try {
    documents[filePath] = await fs.readFile(path.join(workspace, filePath), 'utf8');
  } catch {
    documents[filePath] = null;
  }
}

const runnerWorkspace = buildGitWorkspaceProvenance(workspace);
const audit = auditPortfolioClaims(documents, { expectedHead: runnerWorkspace.head });
const artifact = {
  ok: audit.ok,
  generatedAt: new Date().toISOString(),
  runnerWorkspace,
  currentDocumentCount: CURRENT_PORTFOLIO_DOCS.length,
  legacyDocumentCount: LEGACY_PLANNING_DOCS.length,
  violations: audit.violations,
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify({ ...artifact, outputPath }, null, 2)}\n`);
if (!artifact.ok) process.exitCode = 1;
