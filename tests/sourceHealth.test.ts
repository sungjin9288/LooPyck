import test from 'node:test';
import assert from 'node:assert/strict';
import { assessSourceHealth, type SourceHealthInput } from '../lib/api/sourceHealth.ts';

function row(overrides: Partial<SourceHealthInput>): SourceHealthInput {
    return {
        source: overrides.source || 'MUSINSA',
        searches: overrides.searches ?? 100,
        directHits: overrides.directHits ?? 50,
        successCount: overrides.successCount ?? 50,
        consecutiveEmptyHits: overrides.consecutiveEmptyHits ?? 0,
        lastDirectHitAt: overrides.lastDirectHitAt,
        recentOutcomes: overrides.recentOutcomes,
    };
}

test('NAVER처럼 strategy=api라 directHits는 0이지만 successCount가 있으면 healthy', () => {
    // 프로덕션 실측에서 발견된 오분류: API 소스의 성공은 direct로 안 잡힘
    const [health] = assessSourceHealth([
        row({ source: 'NAVER', directHits: 0, successCount: 120, consecutiveEmptyHits: 0 }),
    ]);

    assert.equal(health.status, 'healthy');
});

test('API 소스가 연속 무수확이면 failing으로 승격된다', () => {
    const [health] = assessSourceHealth([
        row({ source: 'NAVER', directHits: 0, successCount: 120, consecutiveEmptyHits: 12 }),
    ]);

    assert.equal(health.status, 'failing');
});

test('최근 direct 성공이 있는 소스는 healthy', () => {
    const [health] = assessSourceHealth([row({ consecutiveEmptyHits: 0 })]);

    assert.equal(health.status, 'healthy');
});

test('연속 empty 3회 이상이면 degraded', () => {
    const [health] = assessSourceHealth([row({ consecutiveEmptyHits: 3 })]);

    assert.equal(health.status, 'degraded');
});

test('연속 empty 10회 이상이면 failing — 되다가 죽은 소스 경보', () => {
    const [health] = assessSourceHealth([row({ consecutiveEmptyHits: 12 })]);

    assert.equal(health.status, 'failing');
    assert.ok(health.reason.length > 0);
});

test('한 번도 수확이 없는 소스는 never_direct — failing과 구분', () => {
    // WAF/봇차단으로 기대 무수확인 스크레이퍼 — "깨졌다" 경보 대상이 아님
    const [health] = assessSourceHealth([
        row({ source: 'SSF', directHits: 0, successCount: 0, consecutiveEmptyHits: 80 }),
    ]);

    assert.equal(health.status, 'never_direct');
});

test('검색 기록이 없으면 no_data', () => {
    const [health] = assessSourceHealth([
        row({ searches: 0, directHits: 0, successCount: 0, consecutiveEmptyHits: 0 }),
    ]);

    assert.equal(health.status, 'no_data');
});

test('consecutiveEmptyHits 필드가 없는 과거 데이터는 0으로 간주 (하위호환)', () => {
    const [health] = assessSourceHealth([
        { source: 'MUSINSA', searches: 40, directHits: 20, successCount: 20 },
    ]);

    assert.equal(health.status, 'healthy');
});

test('경계값: 2회는 healthy, 9회는 degraded', () => {
    const [two, nine] = assessSourceHealth([
        row({ source: 'MUSINSA', consecutiveEmptyHits: 2 }),
        row({ source: '29CM', consecutiveEmptyHits: 9 }),
    ]);

    assert.equal(two.status, 'healthy');
    assert.equal(nine.status, 'degraded');
});

test('입력 순서를 보존하고 소스별 결과를 반환한다', () => {
    const result = assessSourceHealth([
        row({ source: 'MUSINSA' }),
        row({ source: 'ABLY', consecutiveEmptyHits: 15 }),
    ]);

    assert.deepEqual(result.map((h) => h.source), ['MUSINSA', 'ABLY']);
    assert.equal(result[1].status, 'failing');
});

test('recentOutcomes가 비어있으면 recentWindowRate는 null', () => {
    const [health] = assessSourceHealth([row({ recentOutcomes: [] })]);

    assert.equal(health.recentWindowRate, null);
});

test('recentOutcomes가 없는 과거 데이터는 recentWindowRate가 null (하위호환)', () => {
    const [health] = assessSourceHealth([
        { source: 'MUSINSA', searches: 40, directHits: 20, successCount: 20 },
    ]);

    assert.equal(health.recentWindowRate, null);
});

test('recentOutcomes 혼합값의 recentWindowRate는 성공 비율(0..1)', () => {
    const [health] = assessSourceHealth([row({ recentOutcomes: [1, 1, 0, 1] })]);

    assert.equal(health.recentWindowRate, 0.75);
});

test('recentOutcomes 전부 실패면 recentWindowRate는 0', () => {
    const [health] = assessSourceHealth([row({ recentOutcomes: [0, 0, 0] })]);

    assert.equal(health.recentWindowRate, 0);
});

test('recentOutcomes 전부 성공이면 recentWindowRate는 1', () => {
    const [health] = assessSourceHealth([row({ recentOutcomes: [1, 1, 1] })]);

    assert.equal(health.recentWindowRate, 1);
});

test('recentWindowRate는 status 판정에 영향을 주지 않는다 — 정보성 필드', () => {
    // consecutiveEmptyHits가 높아 failing이어도 recentOutcomes는 별개 신호로 그대로 계산된다
    const [health] = assessSourceHealth([
        row({ consecutiveEmptyHits: 12, recentOutcomes: [1, 1, 1, 1, 1] }),
    ]);

    assert.equal(health.status, 'failing');
    assert.equal(health.recentWindowRate, 1);
});
