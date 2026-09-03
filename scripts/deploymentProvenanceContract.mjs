const COMMIT_PATTERN = /^[0-9a-f]{40}$/i;
const FINGERPRINT_PATTERN = /^[0-9a-f]{64}$/i;
const PROVIDERS = new Set(['netlify', 'github-actions', 'local']);
const BUILD_ENVIRONMENTS = new Set([
  'netlify-hosted',
  'netlify-cli',
  'github-actions',
  'local',
]);
const ENVIRONMENT_PROVIDERS = Object.freeze({
  'netlify-hosted': 'netlify',
  'netlify-cli': 'netlify',
  'github-actions': 'github-actions',
  local: 'local',
});
const DEPLOYMENT_IDENTITY_FIELDS = Object.freeze([
  'schemaVersion',
  'generatedAt',
  'provider',
  'buildEnvironment',
  'commit',
  'branch',
  'context',
  'deployId',
  'runId',
  'workspaceFingerprint',
  'dirty',
]);
const DEPLOYMENT_FIELD_ALLOWLIST = new Set(DEPLOYMENT_IDENTITY_FIELDS);

function clean(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function detectBuildEnvironment(env) {
  const isNetlifyHosted = env.NETLIFY === 'true';
  const isGitHubActions = env.GITHUB_ACTIONS === 'true';
  const isNetlifyCli = !isNetlifyHosted && env.LOOPYCK_NETLIFY_BUILD === 'true';
  const signalCount = [isNetlifyHosted, isGitHubActions, isNetlifyCli]
    .filter(Boolean)
    .length;

  if (signalCount > 1) return 'ambiguous';
  if (isNetlifyHosted) return 'netlify-hosted';
  if (isNetlifyCli) return 'netlify-cli';
  if (isGitHubActions) return 'github-actions';
  return 'local';
}

function detectProvider(buildEnvironment) {
  return ENVIRONMENT_PROVIDERS[buildEnvironment] ?? 'ambiguous';
}

function readProviderMetadata(provider, env) {
  if (provider === 'netlify') {
    return {
      commit: clean(env.COMMIT_REF),
      branch: clean(env.BRANCH),
      context: clean(env.CONTEXT),
    };
  }
  if (provider === 'github-actions') {
    return {
      commit: clean(env.GITHUB_SHA),
      branch: clean(env.GITHUB_REF_NAME),
      context: clean(env.GITHUB_EVENT_NAME),
    };
  }
  return { commit: null, branch: null, context: null };
}

export function buildDeploymentProvenance({
  env = {},
  workspace = null,
  generatedAt = new Date().toISOString(),
} = {}) {
  const buildEnvironment = detectBuildEnvironment(env);
  const provider = detectProvider(buildEnvironment);
  const providerMetadata = readProviderMetadata(provider, env);
  const commit = providerMetadata.commit ?? clean(workspace?.head);
  const branch = providerMetadata.branch ?? clean(workspace?.branch);
  const context = providerMetadata.context ?? 'local-build';

  return {
    schemaVersion: 1,
    generatedAt,
    provider,
    buildEnvironment,
    commit,
    branch,
    context,
    deployId: buildEnvironment === 'netlify-hosted'
      ? clean(env.DEPLOY_ID)
      : null,
    runId: buildEnvironment === 'github-actions' ? clean(env.GITHUB_RUN_ID) : null,
    workspaceFingerprint: clean(workspace?.fingerprint),
    dirty: workspace?.dirty === true,
  };
}

export function validateDeploymentProvenance(value) {
  const violations = [];

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, violations: [{ type: 'invalid-manifest' }] };
  }
  Object.keys(value)
    .filter((field) => !DEPLOYMENT_FIELD_ALLOWLIST.has(field))
    .sort()
    .forEach((field) => violations.push({ type: 'unexpected-field', field }));
  if (value.schemaVersion !== 1) violations.push({ type: 'invalid-schema-version' });
  if (!clean(value.generatedAt) || Number.isNaN(Date.parse(value.generatedAt))) {
    violations.push({ type: 'invalid-generated-at' });
  }
  if (!PROVIDERS.has(value.provider)) violations.push({ type: 'invalid-provider' });
  if (!BUILD_ENVIRONMENTS.has(value.buildEnvironment)) {
    violations.push({ type: 'invalid-build-environment' });
  }
  if (!COMMIT_PATTERN.test(value.commit ?? '')) violations.push({ type: 'invalid-commit' });
  if (!clean(value.branch)) violations.push({ type: 'missing-branch' });
  if (!clean(value.context)) violations.push({ type: 'missing-context' });
  const expectedProvider = ENVIRONMENT_PROVIDERS[value.buildEnvironment];
  if (expectedProvider && value.provider !== expectedProvider) {
    violations.push({ type: 'provider-build-environment-mismatch' });
  }
  if (value.buildEnvironment === 'netlify-hosted' && !clean(value.deployId)) {
    violations.push({ type: 'missing-netlify-deploy-id' });
  }
  if (value.buildEnvironment !== 'netlify-hosted' && value.deployId !== null) {
    violations.push({ type: 'unexpected-deploy-id' });
  }
  if (value.buildEnvironment === 'github-actions' && !clean(value.runId)) {
    violations.push({ type: 'missing-github-run-id' });
  }
  if (value.buildEnvironment !== 'github-actions' && value.runId !== null) {
    violations.push({ type: 'unexpected-run-id' });
  }
  if (typeof value.dirty !== 'boolean') violations.push({ type: 'invalid-dirty-state' });
  if (value.workspaceFingerprint !== null
    && !FINGERPRINT_PATTERN.test(value.workspaceFingerprint ?? '')) {
    violations.push({ type: 'invalid-workspace-fingerprint' });
  }

  return { ok: violations.length === 0, violations };
}

function hasMatchingDeploymentIdentity(candidate, manifest) {
  return Boolean(
    candidate
    && manifest
    && DEPLOYMENT_IDENTITY_FIELDS.every((field) => candidate[field] === manifest[field]),
  );
}

function hasExpectedRequestUrl(evidence) {
  try {
    return evidence?.requestUrl === new URL(
      '/deployment-provenance.json',
      evidence.baseUrl,
    ).toString();
  } catch {
    return false;
  }
}

function isLinkedDeploymentEvidence(evidence, manifest, currentHead) {
  return Boolean(
    evidence?.ok === true
    && evidence?.targetKind === 'deployed-environment'
    && evidence?.expectedCommit === currentHead
    && evidence?.commitMatchesExpected === true
    && hasExpectedRequestUrl(evidence)
    && hasMatchingDeploymentIdentity(evidence?.deployment, manifest),
  );
}

export function evaluateDeploymentPromotion({ manifest, smoke, uat, currentHead }) {
  const manifestAudit = validateDeploymentProvenance(manifest);
  const provenanceStep = Array.isArray(uat?.steps)
    ? uat.steps.find((step) => step?.id === 'deployment-provenance')
    : null;
  const hasProvenanceStep = provenanceStep?.ok === true;
  const commitMatchesCurrentHead = Boolean(
    manifestAudit.ok
    && COMMIT_PATTERN.test(currentHead ?? '')
    && manifest.commit === currentHead,
  );
  const smokeMatchesDeployment = isLinkedDeploymentEvidence(smoke, manifest, currentHead);
  const uatSummaryMatchesDeployment = isLinkedDeploymentEvidence(
    uat?.deploymentProvenance,
    manifest,
    currentHead,
  );
  const uatStepMatchesDeployment = isLinkedDeploymentEvidence(
    provenanceStep?.parsed,
    manifest,
    currentHead,
  );
  const uatMatchesDeployment = Boolean(
    hasProvenanceStep
    && uat?.baseUrl === smoke?.baseUrl
    && uat?.deploymentProvenance?.requestUrl === smoke?.requestUrl
    && provenanceStep?.parsed?.requestUrl === smoke?.requestUrl
    && uatSummaryMatchesDeployment
    && uatStepMatchesDeployment,
  );
  const passed = smokeMatchesDeployment
    && manifest?.provider === 'netlify'
    && manifest?.dirty === false
    && commitMatchesCurrentHead
    && uat?.ok === true
    && uatMatchesDeployment;

  return {
    passed,
    commitMatchesCurrentHead,
    hasProvenanceStep,
    smokeMatchesDeployment,
    uatMatchesDeployment,
    status: passed ? 'pass' : 'missing or fail',
  };
}
