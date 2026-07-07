import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
    assertCapacitorRemoteServerUrl,
    resolveCapacitorServerUrl,
} from '../lib/config/appConfig.ts';

// 6/30 점검 4.4 위험 ②: CAPACITOR_SERVER_URL·SITE_URL 둘 다 없으면
// localhost로 조용히 폴백 → cleartext:false와 결합해 아무것도 못 여는
// 빈 껍데기 앱이 빌드될 수 있다. cap sync 시점에 시끄럽게 실패해야 한다.

test('resolveCapacitorServerUrl: env 미설정이면 localhost 폴백(기존 동작 유지)', () => {
    const url = resolveCapacitorServerUrl({} as NodeJS.ProcessEnv);
    assert.equal(url, 'http://localhost:3000');
});

test('assertCapacitorRemoteServerUrl: localhost 폴백이면 명시적으로 throw', () => {
    assert.throws(
        () => assertCapacitorRemoteServerUrl('http://localhost:3000', {} as NodeJS.ProcessEnv),
        /CAPACITOR_SERVER_URL/
    );
});

test('assertCapacitorRemoteServerUrl: CAPACITOR_ALLOW_LOCALHOST=1이면 localhost 허용(로컬 라이브리로드)', () => {
    const url = assertCapacitorRemoteServerUrl(
        'http://localhost:3000',
        { CAPACITOR_ALLOW_LOCALHOST: '1' } as unknown as NodeJS.ProcessEnv
    );
    assert.equal(url, 'http://localhost:3000');
});

test('assertCapacitorRemoteServerUrl: 원격 https URL은 그대로 통과', () => {
    const url = assertCapacitorRemoteServerUrl(
        'https://loo-pyck.netlify.app',
        {} as NodeJS.ProcessEnv
    );
    assert.equal(url, 'https://loo-pyck.netlify.app');
});
