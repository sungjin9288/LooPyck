import test from 'node:test';
import assert from 'node:assert/strict';
import { shapeVisionResponse } from '../lib/ai/visionItemNormalizer.ts';

test('caps items at 4 and preserves order', () => {
    const result = shapeVisionResponse({
        summary: '전체 착장 요약',
        items: [
            { category: '상의', label: '아이템1', description: '설명1', searchKeywords: ['키워드1'] },
            { category: '하의', label: '아이템2', description: '설명2', searchKeywords: ['키워드2'] },
            { category: '신발', label: '아이템3', description: '설명3', searchKeywords: ['키워드3'] },
            { category: '가방', label: '아이템4', description: '설명4', searchKeywords: ['키워드4'] },
            { category: '모자', label: '아이템5', description: '설명5', searchKeywords: ['키워드5'] },
        ],
    });

    assert.equal(result.items.length, 4);
    assert.deepEqual(result.items.map((item) => item.label), ['아이템1', '아이템2', '아이템3', '아이템4']);
});

test('normalizes and dedupes per-item keywords, capped at 3', () => {
    const result = shapeVisionResponse({
        summary: '요약',
        items: [
            {
                category: '상의',
                label: '블랙 니트',
                description: '설명',
                searchKeywords: ['니트', '니트', '  크루넥 니트  ', '', '블랙 니트', '오버핏 니트'],
            },
        ],
    });

    assert.deepEqual(result.items[0].searchKeywords, ['니트', '크루넥 니트', '블랙 니트']);
});

test('drops an item that ends up with zero usable keywords', () => {
    const result = shapeVisionResponse({
        summary: '요약',
        items: [
            { category: '상의', label: '아이템1', description: '설명1', searchKeywords: [] },
            { category: '하의', label: '아이템2', description: '설명2', searchKeywords: ['와이드 데님 팬츠'] },
        ],
    });

    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].label, '아이템2');
});

test('derives legacy description and searchKeywords from the primary item', () => {
    const result = shapeVisionResponse({
        summary: '올드머니룩 착장입니다',
        items: [
            { category: '아우터', label: '트위드 자켓', description: '설명', searchKeywords: ['트위드 자켓', '올드머니 자켓'] },
            { category: '하의', label: '슬랙스', description: '설명', searchKeywords: ['와이드 슬랙스'] },
        ],
    });

    assert.equal(result.description, '올드머니룩 착장입니다');
    assert.deepEqual(result.searchKeywords, ['트위드 자켓', '올드머니 자켓']);
});

test('empty items array yields empty legacy fields without throwing', () => {
    const result = shapeVisionResponse({ summary: '요약', items: [] });

    assert.deepEqual(result.items, []);
    assert.deepEqual(result.searchKeywords, []);
});
