import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAlertDetailHref } from '../lib/favorites/alertLinks.ts';

test('alert detail href encodes alert ids safely', () => {
    assert.equal(
        buildAlertDetailHref('alert/id?with=unsafe'),
        '/favorites/alerts/alert%2Fid%3Fwith%3Dunsafe'
    );
});
