import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  benchmarkProductGrouping,
  evaluateGroupingQualityThresholds,
} from '../lib/product/groupingQuality.ts';
import {
  GROUPING_QUALITY_DATASET,
  GROUPING_QUALITY_THRESHOLDS,
} from '../lib/product/groupingQualityDataset.ts';
import { buildGitWorkspaceProvenance } from './gitWorkspaceProvenance.mjs';

const workspace = process.cwd();
const outputDir = path.join(workspace, 'output', 'playwright');
const jsonPath = path.join(outputDir, 'product-grouping-quality-benchmark.json');
const markdownPath = path.join(outputDir, 'product-grouping-quality-benchmark.md');
const result = benchmarkProductGrouping(GROUPING_QUALITY_DATASET);
const violations = evaluateGroupingQualityThresholds(result, GROUPING_QUALITY_THRESHOLDS);
const artifact = {
  schemaVersion: 1,
  ok: violations.length === 0,
  generatedAt: new Date().toISOString(),
  runnerWorkspace: buildGitWorkspaceProvenance(workspace),
  thresholds: GROUPING_QUALITY_THRESHOLDS,
  ...result,
  violations,
};

const percent = (value) => `${(value * 100).toFixed(1)}%`;
const markdown = [
  '# Product Grouping Quality Benchmark',
  '',
  `Generated at: ${artifact.generatedAt}`,
  `Workspace fingerprint: ${artifact.runnerWorkspace.fingerprint}`,
  '',
  '## Result',
  '',
  `- Status: ${artifact.ok ? 'PASS' : 'FAIL'}`,
  `- Curated products: ${artifact.sampleCount}`,
  `- Evaluated pairs: ${artifact.pairCount}`,
  `- Expected same-product pairs: ${artifact.expectedPositivePairs}`,
  `- Predicted same-product pairs: ${artifact.predictedPositivePairs}`,
  `- Pairwise precision: ${percent(artifact.precision)}`,
  `- Pairwise recall: ${percent(artifact.recall)}`,
  `- Pairwise F1: ${percent(artifact.f1)}`,
  `- False merges: ${artifact.confusion.falsePositive}`,
  `- False splits: ${artifact.confusion.falseNegative}`,
  '',
  '## Thresholds',
  '',
  `- Minimum products: ${artifact.thresholds.minimumSamples}`,
  `- Minimum expected same-product pairs: ${artifact.thresholds.minimumPositivePairs}`,
  `- Minimum precision: ${percent(artifact.thresholds.minimumPrecision)}`,
  `- Minimum recall: ${percent(artifact.thresholds.minimumRecall)}`,
  `- Minimum F1: ${percent(artifact.thresholds.minimumF1)}`,
  '',
  '## Scope',
  '',
  '- This is a deterministic regression benchmark over curated cross-mall fixtures.',
  '- It does not estimate production precision, recall, conversion uplift, or statistical significance.',
  '- Production quality claims still require independently labeled live samples.',
  '',
  '## Violations',
  '',
  ...(artifact.violations.length > 0 ? artifact.violations.map((violation) => `- ${violation}`) : ['- None']),
  '',
].join('\n');

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(jsonPath, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
await fs.writeFile(markdownPath, markdown, 'utf8');
process.stdout.write(`${JSON.stringify({ ...artifact, jsonPath, markdownPath }, null, 2)}\n`);
if (!artifact.ok) process.exitCode = 1;
