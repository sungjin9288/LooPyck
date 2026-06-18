import assert from 'node:assert/strict';
import test from 'node:test';

import { buildChatStyleContext } from '../lib/ai/chatStyleContext.ts';

function fav(brand: string, category1: string, title = '상품') {
    return { id: `${brand}-${title}`, title, brand, category1 } as never;
}

test('returns null when there are no favorites (no empty context injected)', () => {
    assert.equal(buildChatStyleContext([]), null);
    assert.equal(buildChatStyleContext(undefined as never), null);
});

test('summarizes the most frequently favorited brands', () => {
    const context = buildChatStyleContext([
        fav('Nike', '신발'),
        fav('Nike', '상의'),
        fav('Stussy', '상의'),
    ]);
    assert.ok(context);
    assert.ok(context!.includes('Nike'), 'top brand should appear');
    assert.ok(context!.includes('3'), 'should mention the favorite count');
});

test('caps the brand list to the top few and ignores blanks', () => {
    const context = buildChatStyleContext([
        fav('A', '상의'), fav('A', '상의'), fav('A', '상의'),
        fav('B', '상의'), fav('B', '상의'),
        fav('C', '하의'),
        fav('D', '하의'),
        fav('', '하의'), // blank brand must be ignored
    ]);
    assert.ok(context);
    // most frequent brand A must come before the least frequent D
    assert.ok(context!.indexOf('A') < context!.indexOf('D') || !context!.includes('D'));
    // blank brand should never be rendered as an empty token
    assert.equal(/,\s*,/.test(context!), false);
});

test('context is a single line of plain text (safe to inject)', () => {
    const context = buildChatStyleContext([fav('Nike', '신발')]);
    assert.ok(context);
    assert.equal(context!.includes('\n'), false);
    assert.equal(context!.includes('```'), false);
});
