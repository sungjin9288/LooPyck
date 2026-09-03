import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const API_ROOT = path.resolve('app/api');

function listSourceFiles(directory) {
    return readdirSync(directory).flatMap((entry) => {
        const absolutePath = path.join(directory, entry);
        return statSync(absolutePath).isDirectory()
            ? listSourceFiles(absolutePath)
            : absolutePath.endsWith('.ts') || absolutePath.endsWith('.tsx')
                ? [absolutePath]
                : [];
    });
}

test('API routes do not bypass the PII-safe Logger with raw console calls', () => {
    const violations = listSourceFiles(API_ROOT)
        .filter((filePath) => /\bconsole\.(?:error|warn|info|log)\b/.test(readFileSync(filePath, 'utf8')))
        .map((filePath) => path.relative(process.cwd(), filePath));

    assert.deepEqual(violations, []);
});

test('AI provider failure paths do not read or log raw response payloads', () => {
    const styleRecommend = readFileSync(path.join(API_ROOT, 'style-recommend/route.ts'), 'utf8');
    const aiVision = readFileSync(path.join(API_ROOT, 'ai-vision/route.ts'), 'utf8');

    assert.doesNotMatch(styleRecommend, /parsed\.rawText/);
    assert.doesNotMatch(aiVision, /response\.text\s*\(/);
});
