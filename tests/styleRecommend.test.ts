import assert from 'node:assert/strict';
import test from 'node:test';

import {
    buildStyleRecommendFallback,
    normalizeStyleRecommendResponse,
    type StyleRecommendInput,
} from '../lib/ai/styleRecommend.ts';

const baseInput: StyleRecommendInput = {
    gender: 'M',
    height: 175,
    weight: 68,
    preferredStyles: ['캐주얼'],
    budget: 'mid',
};

test('buildStyleRecommendFallback always returns three normalized looks', () => {
    const fallback = buildStyleRecommendFallback(baseInput);

    assert.equal(fallback.looks.length, 3);
    assert.ok(fallback.bodyNote.length > 0);

    for (const look of fallback.looks) {
        assert.ok(look.lookName.length > 0);
        assert.ok(look.description.length > 0);
        assert.ok(look.reason.length > 0);
        assert.ok(look.keyItems.length > 0);
        assert.ok(look.keyItems.length <= 3);
    }
});

test('normalizeStyleRecommendResponse trims text, deduplicates key items, and caps to three looks', () => {
    const normalized = normalizeStyleRecommendResponse({
        bodyNote: `  ${'체형 설명 '.repeat(30)} `,
        looks: [
            {
                lookName: `  ${'첫 번째 추천 룩 '.repeat(10)} `,
                description: `  ${'설명 '.repeat(80)} `,
                keyItems: ['  오버핏 셔츠  ', '오버핏 셔츠', '와이드 슬랙스', '레더 로퍼'],
                reason: ` ${'이유 '.repeat(60)} `,
            },
            {
                lookName: '세컨드 룩',
                description: '정돈된 실루엣 중심으로 출근과 주말 모두 소화하기 좋습니다.',
                keyItems: ['테일러드 자켓', '세미와이드 슬랙스'],
                reason: '세로 실루엣이 살아나 비율이 안정적으로 보입니다.',
            },
            {
                lookName: '서드 룩',
                description: '가벼운 아우터와 스니커즈를 섞어 데일리 활용도를 높였습니다.',
                keyItems: ['나일론 자켓', '러닝 스니커즈', '테이퍼드 팬츠'],
                reason: '활동성은 유지하면서 상하 비율이 깔끔하게 정리됩니다.',
            },
            {
                lookName: '포스 룩',
                description: '네 번째 룩은 세 개 제한 때문에 잘려야 합니다.',
                keyItems: ['니트 가디건'],
                reason: '추가 룩입니다.',
            },
        ],
    });

    assert.ok(normalized);
    assert.equal(normalized.looks.length, 3);
    assert.equal(normalized.looks[0]?.keyItems.length, 3);
    assert.deepEqual(normalized.looks[0]?.keyItems, ['오버핏 셔츠', '와이드 슬랙스', '레더 로퍼']);
    assert.ok(normalized.bodyNote.length <= 140);
    assert.ok(normalized.looks[0]?.description.length <= 220);
    assert.ok(normalized.looks[0]?.reason.length <= 160);
});

test('normalizeStyleRecommendResponse rejects payloads without enough usable looks', () => {
    const normalized = normalizeStyleRecommendResponse({
        bodyNote: '기본 체형 메모',
        looks: [
            {
                lookName: '유효 룩',
                description: '정상 설명',
                keyItems: ['기본 셔츠'],
                reason: '정상 이유',
            },
            {
                lookName: '무효 룩',
                description: '키워드가 비어 있으면 버려집니다.',
                keyItems: [],
                reason: '설명은 있지만 키워드 없음',
            },
        ],
    });

    assert.equal(normalized, null);
});
