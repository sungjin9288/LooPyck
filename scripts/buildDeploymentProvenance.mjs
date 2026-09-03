import fs from 'node:fs/promises';
import path from 'node:path';

import {
  buildDeploymentProvenance,
  validateDeploymentProvenance,
} from './deploymentProvenanceContract.mjs';
import { buildGitWorkspaceProvenance } from './gitWorkspaceProvenance.mjs';

const workspace = process.cwd();
const outputPath = path.join(workspace, 'public', 'deployment-provenance.json');

let workspaceProvenance = null;
try {
  workspaceProvenance = buildGitWorkspaceProvenance(workspace);
} catch {
  // Hosted builders can provide commit metadata even when the Git directory is unavailable.
}

const manifest = buildDeploymentProvenance({
  env: process.env,
  workspace: workspaceProvenance,
});
const audit = validateDeploymentProvenance(manifest);
if (!audit.ok) {
  throw new Error(`invalid_deployment_provenance:${JSON.stringify(audit.violations)}`);
}

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify({ ...manifest, outputPath }, null, 2)}\n`);
