import assert from 'node:assert/strict';
import test from 'node:test';

import {
    scoreStyleAxes,
    getDominantPersona,
    STYLE_AXES,
} from '../lib/personalization/styleTaxonomy.ts';

function fav(brand: string, title = '아이템', category1 = '의류') {
    return { id: `${brand}-${title}`, brand, title, category1 } as never;
}

test('empty favorites produce no scores and the explorer persona', () => {
    assert.deepEqual(scoreStyleAxes([]), []);
    assert.equal(getDominantPersona([]).label, '패션 탐험가');
});

test('favorites with no recognizable brand stay empty (no fabricated profile)', () => {
    const unknown = [fav('완전무명브랜드'), fav('또다른무명')];
    assert.deepEqual(scoreStyleAxes(unknown), []);
    assert.equal(getDominantPersona(unknown).label, '패션 탐험가');
});

test('Nike is consistently Sporty (resolves the old Sporty-vs-Street conflict)', () => {
    const nikeHeavy = [fav('Nike'), fav('Nike'), fav('나이키')];
    const scores = scoreStyleAxes(nikeHeavy);
    assert.equal(scores[0].label, 'Sporty', 'top axis should be Sporty');
});

test('Moncler is consistently Luxury (resolves the old Luxury-vs-OldMoney conflict)', () => {
    const lux = [fav('Moncler'), fav('Stone Island')];
    const scores = scoreStyleAxes(lux);
    assert.equal(scores[0].key, 'luxury');
});

test('the dominant axis and the persona are always derived from the same signal', () => {
    // The whole point of unifying: bars and persona card can never disagree.
    const sets = [
        [fav('Nike'), fav('Adidas'), fav('Supreme')],
        [fav('Moncler'), fav('Uniqlo')],
        [fav('Arcteryx'), fav('Salomon'), fav('Nike')],
    ];
    for (const favorites of sets) {
        const scores = scoreStyleAxes(favorites);
        const dominant = getDominantPersona(favorites);
        const topAxis = STYLE_AXES.find((axis) => axis.key === scores[0].key);
        assert.ok(topAxis, 'top axis must exist');
        assert.equal(dominant.label, topAxis!.persona.label, 'persona must match the top-scored axis');
    }
});

test('scores are sorted descending and bounded 0..100', () => {
    const scores = scoreStyleAxes([fav('Nike'), fav('Nike'), fav('Supreme')]);
    for (let i = 1; i < scores.length; i++) {
        assert.ok(scores[i - 1].value >= scores[i].value, 'scores must be sorted desc');
    }
    for (const s of scores) {
        assert.ok(s.value >= 0 && s.value <= 100);
    }
});
