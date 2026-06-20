import assert from 'node:assert/strict';
import test from 'node:test';

import { detectTossWebView } from '../lib/native/tossWebView.ts';

const IOS_SAFARI =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const ANDROID_CHROME =
    'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
const TOSS_WEBVIEW =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 TossApp/5.0.0';

test('Toss WebView user-agent is detected', () => {
    assert.equal(detectTossWebView(TOSS_WEBVIEW), true);
});

test('detection is case-insensitive on the user-agent', () => {
    assert.equal(detectTossWebView('Some Browser TOSS/1.0'), true);
});

test('ordinary mobile browsers are NOT detected as Toss (iOS UI 분기 보호)', () => {
    assert.equal(detectTossWebView(IOS_SAFARI), false);
    assert.equal(detectTossWebView(ANDROID_CHROME), false);
});

test('missing user-agent without a Toss global is not Toss', () => {
    assert.equal(detectTossWebView(''), false);
    assert.equal(detectTossWebView(null), false);
    assert.equal(detectTossWebView(undefined), false);
});

test('the injected Toss global forces detection even with an ordinary UA', () => {
    assert.equal(detectTossWebView(IOS_SAFARI, true), true);
    assert.equal(detectTossWebView('', true), true);
});

test('no Toss global + ordinary UA stays false', () => {
    assert.equal(detectTossWebView(ANDROID_CHROME, false), false);
});
