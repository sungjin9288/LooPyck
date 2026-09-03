import assert from 'node:assert/strict';
import test from 'node:test';

import { buildAiChatFallback, detectChatFallbackIntent } from '../lib/ai/aiChatFallback.ts';
import { parseAiChatGeminiResponse } from '../lib/ai/aiChatResponse.ts';

test('detects representative Korean and English styling intents', () => {
    assert.equal(detectChatFallbackIntent('올드머니룩 추천해줘'), 'old_money');
    assert.equal(detectChatFallbackIntent('Spring outfit ideas'), 'spring');
    assert.equal(detectChatFallbackIntent('캐주얼 출근룩'), 'work');
    assert.equal(detectChatFallbackIntent('키 큰 남자 코디'), 'tall');
});

test('uses a safe default when no specific intent is recognized', () => {
    assert.equal(detectChatFallbackIntent('무슨 옷을 입을까?'), 'default');
    assert.equal(detectChatFallbackIntent('Update my wardrobe without changing everything'), 'default');
    assert.equal(detectChatFallbackIntent('A network-friendly travel outfit'), 'default');
});

test('Korean fallback returns a complete response instead of raw JSON fragments', () => {
    const result = buildAiChatFallback('올드머니룩 추천해줘', 'ko');

    assert.equal(result.responseSource, 'fallback');
    assert.match(result.text, /올드머니/);
    assert.doesNotMatch(result.text, /^\s*[{[]/);
    assert.deepEqual(result.searchKeywords, ['케이블 니트', '투턱 슬랙스', '브라운 로퍼']);
});

test('English fallback keeps English copy and shopping keywords', () => {
    const result = buildAiChatFallback('Date look suggestions', 'en');

    assert.match(result.text, /date outfit/i);
    assert.deepEqual(result.searchKeywords, ['Oxford shirt', 'semi wide trousers', 'suede jacket']);
});

test('all fallback responses satisfy the public response bounds', () => {
    const prompts = ['올드머니', '봄', '여름', '겨울', '데이트', '출근', '키 큰', '기본'];

    prompts.forEach((prompt) => {
        const result = buildAiChatFallback(prompt, 'ko');
        assert.ok(result.text.length >= 1 && result.text.length <= 800);
        assert.ok(result.searchKeywords.length >= 1 && result.searchKeywords.length <= 3);
        result.searchKeywords.forEach((keyword) => assert.ok(keyword.length <= 40));
    });
});

test('normalizes a valid Gemini JSON response into the AI source contract', () => {
    const result = parseAiChatGeminiResponse({
        candidates: [{
            content: {
                parts: [{
                    text: JSON.stringify({
                        text: '재킷과 데님을 조합해보세요.',
                        searchKeywords: [' 재킷 ', '데님', '재킷', '스니커즈'],
                    }),
                }],
            },
        }],
    });

    assert.deepEqual(result, {
        ok: true,
        data: {
            text: '재킷과 데님을 조합해보세요.',
            searchKeywords: ['재킷', '데님', '스니커즈'],
            responseSource: 'ai',
        },
    });
});

test('rejects the truncated Gemini JSON shape from the previous UI failure evidence', () => {
    const result = parseAiChatGeminiResponse({
        candidates: [{
            content: {
                parts: [{ text: '{\n  "text": "안녕하세요! 미' }],
            },
        }],
    });

    assert.deepEqual(result, { ok: false, error: 'Gemini JSON parse failed' });
});
