import fs from 'node:fs/promises';
import path from 'node:path';

import { auditCiWorkflow } from './ciWorkflowContract.mjs';
import { buildGitWorkspaceProvenance } from './gitWorkspaceProvenance.mjs';

const workspace = process.cwd();
const workflowPath = path.join(workspace, '.github', 'workflows', 'deploy.yml');
const outputPath = path.join(workspace, 'output', 'playwright', 'ci-workflow-contract.json');
const workflow = await fs.readFile(workflowPath, 'utf8');
const audit = auditCiWorkflow(workflow);
const artifact = {
  ok: audit.ok,
  generatedAt: new Date().toISOString(),
  runnerWorkspace: buildGitWorkspaceProvenance(workspace),
  workflowPath: path.relative(workspace, workflowPath),
  violations: audit.violations,
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify({ ...artifact, outputPath }, null, 2)}\n`);
if (!artifact.ok) process.exitCode = 1;
