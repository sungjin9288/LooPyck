import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const RUNTIME_ROOTS = ['app', 'components', 'contexts', 'hooks'].map((entry) => path.resolve(entry));

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

test('application and component runtime code does not bypass the PII-safe Logger', () => {
    const violations = RUNTIME_ROOTS
        .flatMap(listSourceFiles)
        .filter((filePath) => /\bconsole\.(?:error|warn|info|log)\b/.test(readFileSync(filePath, 'utf8')))
        .map((filePath) => path.relative(process.cwd(), filePath));

    assert.deepEqual(violations, []);
});
