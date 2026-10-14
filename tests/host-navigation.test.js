import { describe, expect, test } from 'bun:test';
import { getHostNavigationConfig, validateHostNavigation } from '../__src/bibi/resources/scripts/bibi.heart.host-navigation.protocol.mjs';
import { getPageTapDivision } from '../__src/bibi/resources/scripts/bibi.heart.hitregions.mjs';

const origin = 'https://reader.example';
const preset = { 'use-host-navigation': true, 'host-navigation-api': '/api/navigation', 'host-navigation-paths': ['/', '/reader/', '/books/'] };
const identity = { bookKey: 'book:2', contentHash: 'revision-2' };
const context = () => ({ schemaVersion: 1, ...identity, previous: null, next: { bookKey: 'book:3', title: '第3巻', contentHash: 'revision-3', status: 'ready', href: '/reader/?book=3' }, returnTo: { href: '/books/?search=series#selected', label: '元のページへ戻る' } });
const reject = (code, run) => {
    let error;
    try { run(); } catch(caught) { error = caught; }
    expect(error?.code).toBe(code);
};

describe('trusted host navigation', () => {
    test('ordinary, embedded and invalid deployment settings cannot enable navigation', () => {
        for(const [settings, embedded] of [[{}, false], [{ ...preset, 'use-host-navigation': false }, false], [preset, true], [{ ...preset, 'host-navigation-api': '//other.example/api' }, false], [{ ...preset, 'host-navigation-paths': ['*'] }, false]]) expect(getHostNavigationConfig(settings, origin, embedded, true)).toBeNull();
        expect(getHostNavigationConfig(preset, origin, false, false)).toBeNull();
    });
    test('a response for another book or file cannot supply destinations', () => {
        const config = getHostNavigationConfig(preset, origin, false, true);
        for(const change of [{ bookKey: 'book:1' }, { contentHash: 'other-revision' }]) reject('IDENTITY_MISMATCH', () => validateHostNavigation({ ...context(), ...change }, identity, config));
    });
    test('external, script and unapproved return or neighbor URLs are rejected', () => {
        const config = getHostNavigationConfig(preset, origin, false, true);
        for(const href of ['//other.example/books/', 'javascript:alert(1)', '/admin/', '/\\other.example/books/', '/reader/../admin/']) {
            const next = context(); next.next.href = href;
            reject('INVALID_DESTINATION', () => validateHostNavigation(next, identity, config));
            const returning = context(); returning.returnTo.href = href;
            reject('INVALID_DESTINATION', () => validateHostNavigation(returning, identity, config));
        }
    });
    test('unavailable neighbors cannot smuggle a clickable destination or loop to current book', () => {
        const config = getHostNavigationConfig(preset, origin, false, true);
        const missing = context(); missing.next.status = 'missing-file';
        reject('INVALID_NAVIGATION', () => validateHostNavigation(missing, identity, config));
        const same = context(); same.next.bookKey = identity.bookKey;
        reject('INVALID_NAVIGATION', () => validateHostNavigation(same, identity, config));
    });
});

describe('page-sized outer tap bands', () => {
    const hit = (x, width, pageWidth, extent = 1 / 3) => getPageTapDivision({ X: x, Y: 450 }, width, 900, pageWidth, extent).X;
    test('a single page allocates its outer thirds and leaves the middle third alone', () => {
        expect(hit(180, 600, 600)).toBe('left');
        expect(hit(200, 600, 600)).toBe('center');
        expect(hit(300, 600, 600)).toBe('center');
        expect(hit(420, 600, 600)).toBe('right');
    });
    test('a two-page display uses one sixth of the viewport at each outer edge', () => {
        expect(hit(180, 1200, 600)).toBe('left');
        expect(hit(260, 1200, 600)).toBe('center');
        expect(hit(940, 1200, 600)).toBe('center');
        expect(hit(1020, 1200, 600)).toBe('right');
    });
    test('explicit pixel hit widths do not grow with a two-page viewport', () => {
        expect(hit(80, 1200, 600, 90)).toBe('left');
        expect(hit(100, 1200, 600, 90)).toBe('center');
        expect(hit(1120, 1200, 600, 90)).toBe('right');
    });
});
