import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Logger, toErrorMessage } from '../lib/core/observability.ts';

// ── toErrorMessage ───────────────────────────────────────────────────

test('toErrorMessage: Error 인스턴스는 message만 축약', () => {
    assert.equal(toErrorMessage(new Error('boom')), 'boom');
});

test('toErrorMessage: 비-Error 값은 String 변환, null/undefined는 빈 문자열', () => {
    assert.equal(toErrorMessage('plain'), 'plain');
    assert.equal(toErrorMessage(404), '404');
    assert.equal(toErrorMessage(null), '');
    assert.equal(toErrorMessage(undefined), '');
});

// ── maskPII ──────────────────────────────────────────────────────────

test('maskPII: 이메일·전화번호 마스킹, password/token 키 삭제', () => {
    const masked = Logger.maskPII({
        email: 'user@example.com',
        phone: '010-1234-5678',
        password: 'secret',
        apiToken: 'tok_abc',
        keep: '유지',
    }) as Record<string, unknown>;

    assert.equal(masked.email, '[EMAIL]');
    assert.equal(masked.phone, '[PHONE]');
    assert.equal(masked.password, '[REDACTED]');
    assert.equal(masked.apiToken, '[REDACTED]');
    assert.equal(masked.keep, '유지');
});

test('maskPII: nested array shape를 보존하며 각 항목을 마스킹', () => {
    const masked = Logger.maskPII([
        'user@example.com',
        { phone: '010-1234-5678', nested: ['safe', 'admin@example.com'] },
    ]);

    assert.deepEqual(masked, [
        '[EMAIL]',
        { phone: '[PHONE]', nested: ['safe', '[EMAIL]'] },
    ]);
});

// ── 프로덕션 emit (관측성 퇴행 가드) ─────────────────────────────────
// 과거 프로덕션 분기가 비어 있어 로그가 전부 소실됐다 — 이 가드는
// "프로덕션에서 error가 실제로 console.error로 나간다"를 고정한다.

test('Logger.error: NODE_ENV=production에서 구조화 단일 라인을 console.error로 emit', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalConsoleError = console.error;
    const captured: string[] = [];

    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    console.error = (line: string) => { captured.push(line); };

    try {
        Logger.error('adapter failed', new Error('HTTP 403'), { source: 'MUSINSA' });
    } finally {
        console.error = originalConsoleError;
        (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
    }

    assert.equal(captured.length, 1, '프로덕션에서 console.error 미발생 — 로그 소실 회귀');
    const parsed = JSON.parse(captured[0]);
    assert.equal(parsed.level, 'error');
    assert.equal(parsed.message, 'adapter failed');
    assert.equal(parsed.context.error, 'HTTP 403');
    assert.equal(parsed.context.source, 'MUSINSA');
});

test('Logger.warn: NODE_ENV=production에서 console.warn으로 emit', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalConsoleWarn = console.warn;
    const captured: string[] = [];

    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    console.warn = (line: string) => { captured.push(line); };

    try {
        Logger.warn('source gave up', { source: 'ABLY' });
    } finally {
        console.warn = originalConsoleWarn;
        (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
    }

    assert.equal(captured.length, 1);
    const parsed = JSON.parse(captured[0]);
    assert.equal(parsed.level, 'warn');
    assert.equal(parsed.context.source, 'ABLY');
});
