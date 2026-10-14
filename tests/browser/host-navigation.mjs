import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { chromium, devices } from 'playwright';
import { createReflowFixture } from './fixtures.mjs';
import { sendBook } from './book-server.mjs';
import { verifyDistribution } from '../../zzz/distribution.mjs';

const Repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const Distribution = path.join(Repository, '__dist/bibi');
await verifyDistribution(Distribution);
const Index = await fs.readFile(path.join(Distribution, 'index.html'), 'utf8');
const HostIndex = Index.replace('data-bibi-preset=""', 'data-bibi-preset="host"');
const Reflow = await createReflowFixture(), Vertical = await createReflowFixture(true);
const Fixed = await fs.readFile(path.join(Repository, '__src/bibi-bookshelf/__samples/Sample_Pre-Paginated_LtR.epub'));
const Preset = 'Bibi.preset(' + JSON.stringify({
    'extract-if-necessary': ['*'], 'allow-scripts-in-content': false,
    'use-host-navigation': true, 'host-navigation-api': '/api/reader-navigation',
    'host-navigation-paths': ['/books/', '/reader/'], 'resume-from-last-position': 'no',
    'keep-settings': 'no', 'use-menubar': 'yes', 'use-keys': 'yes', 'use-arrows': 'yes', 'use-slider': 'yes',
    'flipper-width': 1 / 3
}) + ');';
let Mode = 'normal', Origin, Browser, Page, TabletPage;
const Errors = [], Results = [], Requests = [], ConsoleErrors = [];
const neighbor = (Id, Entry, Return) => ({ bookKey: 'book:' + Id, title: '第' + Id + '巻', contentHash: 'hash-' + Id, status: 'ready', href: `/reader/?book=${Id}&entry=${Entry}&from=${encodeURIComponent(Return)}` });
const Server = http.createServer(async (Request, Response) => {
    try {
        const Url = new URL(Request.url, 'http://localhost'), Name = Url.pathname;
        Requests.push({ url: Request.url, range: Request.headers.range || null });
        if(Name === '/api/reader-navigation') {
            const Id = Number(Url.searchParams.get('book_key')?.replace('book:', ''));
            const Return = Url.searchParams.get('return_to') || '/books/';
            const Data = { schemaVersion: 1, bookKey: 'book:' + Id, contentHash: Url.searchParams.get('content_hash'), series: Id === 7 ? null : { id: 1, name: 'Series', order: 'series-number-asc-id-asc' }, previous: Id === 2 || Id === 3 ? neighbor(Id - 1, 'end', Return) : null, next: Id === 1 || Id === 2 ? neighbor(Id + 1, 'start', Return) : null, returnTo: { href: Return, label: '元のページへ戻る' } };
            const CurrentMode = Mode;
            if(CurrentMode === 'delay') await new Promise(Resolve => setTimeout(Resolve, 1000));
            if(CurrentMode === 'external') Data.next.href = 'https://other.example/reader/';
            if(CurrentMode === 'unavailable') { Data.next.status = 'missing-file'; Data.next.href = null; Data.next.contentHash = null; }
            Response.writeHead(CurrentMode === 'changed' ? 409 : 200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
            Response.end(JSON.stringify(CurrentMode === 'changed' ? { code: 'CONTENT_CHANGED', error: '本のファイルが更新されました。' } : Data)); return;
        }
        if(Name === '/books/' || Name === '/reader/') { Response.writeHead(200, { 'Content-Type': 'text/html' }); Response.end('<!doctype html><title>Navigation destination</title><p>Navigation destination</p>'); return; }
        if(Name === '/embedded') { Response.writeHead(200, { 'Content-Type': 'text/html' }); Response.end('<!doctype html><iframe src="/bibi/host.html?book=/epubs/reflow.epub&autostart=yes&autostart-embedded=yes&book-key=book:2&content-hash=hash-2"></iframe>'); return; }
        if(Name.startsWith('/epubs/')) { sendBook(Request, Response, Name.includes('fixed') ? Fixed : Name.includes('vertical') ? Vertical : Reflow); return; }
        if(Name === '/bibi/presets/host.js') { Response.writeHead(200, { 'Content-Type': 'text/javascript' }); Response.end(Preset); return; }
        if(Name.startsWith('/bibi/')) {
            const Relative = Name.slice(6) || 'index.html';
            const File = path.resolve(Distribution, Relative);
            if(!File.startsWith(Distribution + path.sep)) throw new Error('Outside distribution');
            const Bytes = Relative === 'host.html' ? HostIndex : await fs.readFile(File);
            Response.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' }[path.extname(File)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); Response.end(Bytes); return;
        }
        Response.writeHead(404); Response.end();
    } catch { Response.writeHead(404); Response.end(); }
});
const scenario = async (Name, Run) => { await Run(); Results.push(Name); console.log('PASS ' + Name); };
const pause = Milliseconds => new Promise(Resolve => setTimeout(Resolve, Milliseconds));
const ScreenshotDirectory = process.env.BIBI_SCREENSHOT_DIR || await fs.mkdtemp(path.join(os.tmpdir(), 'bibi-navigation-'));
await fs.mkdir(ScreenshotDirectory, { recursive: true });
try {
    await new Promise(Resolve => Server.listen(0, '127.0.0.1', Resolve)); Origin = 'http://127.0.0.1:' + Server.address().port;
    Browser = await chromium.launch();
    Page = await Browser.newPage({ viewport: { width: 1280, height: 900 } });
    Page.on('pageerror', Error => Errors.push(Error.message));
    Page.on('console', Message => { if(Message.type() === 'error') ConsoleErrors.push(Message.text()); });
    const open = async (Options = {}, Entry = 'host.html', Target = Page) => {
        Mode = 'normal';
        const Url = new URL('/bibi/' + Entry, Origin);
        for(const [Key, Value] of Object.entries({ book: '/epubs/reflow.epub', autostart: 'yes', 'reader-view-mode': 'paged', 'allow-placeholders': false, 'book-key': 'book:2', 'content-hash': 'hash-2', 'storage-namespace': 'host-navigation-regression', 'host-return-to': '/books/?search=作品#selected', ...Options })) Url.searchParams.set(Key, Value);
        Url.searchParams.set('book', new URL(Url.searchParams.get('book'), Origin).href);
        await Target.goto(Url.href);
        try {
            await Target.waitForFunction(() => window.Bibi?.API && (Bibi.API.getState().operable || Bibi.API.getState().status === 'error'));
            assert.equal(await Target.evaluate(() => Bibi.API.getState().operable), true);
            if(Entry === 'host.html') await Target.waitForFunction(() => Bibi.API.getHostNavigationState().enabled && !Bibi.API.getHostNavigationState().loading && !Bibi.API.getHostNavigationState().error);
        } catch(Error) {
            console.error('READER FAILURE', await Target.evaluate(() => ({ state: window.Bibi?.API?.getState(), navigation: window.Bibi?.API?.getHostNavigationState(), text: document.body.innerText })), Errors, ConsoleErrors, Requests);
            throw Error;
        }
    };
    const state = () => Page.evaluate(() => Bibi.API.getHostNavigationState());
    const position = () => Page.evaluate(() => Bibi.API.getPosition());
    const wheel = Delta => Page.evaluate(Delta => document.body.dispatchEvent(new WheelEvent('wheel', { deltaY: Delta, bubbles: true, cancelable: true })), Delta);
    const boundary = Edge => Page.waitForFunction(Edge => Bibi.API.getHostNavigationState().visibleBoundary === Edge, Edge);
    await scenario('ordinary, URL-selected enabled presets and embedded readers have no host controls', async () => {
        for(const Options of [{ 'use-host-navigation': true }, { preset: 'host', 'use-host-navigation': true }]) {
            await open(Options, 'index.html'); assert.equal((await state()).enabled, false); assert.equal(await Page.locator('#bibi-host-return').count(), 0);
        }
        await Page.goto(Origin + '/embedded');
        const Frame = Page.frames().find(Frame => Frame.url().includes('host.html'));
        await Frame.waitForFunction(() => window.Bibi?.API?.getState().operable);
        assert.equal(await Frame.evaluate(() => Bibi.API.getHostNavigationState().enabled), false);
        assert.equal(Requests.some(Request => Request.url.startsWith('/api/reader-navigation')), false);
    });
    await scenario('tail sentinel preserves real position; wheel momentum cannot open next volume', async () => {
        await open({ edge: 'foot' }); const Before = await position();
        const Frame = Page.frames().find(Frame => Frame !== Page.mainFrame() && Frame.url().startsWith('blob:') && Frame.url());
        const Source = Frame || Page.frames().find(Frame => Frame !== Page.mainFrame());
        await Source.evaluate(() => {
            const Anchor = document.body.appendChild(document.createElement('a')); Anchor.href = '#tail'; Anchor.id = 'wheel-link'; Anchor.textContent = 'EPUB link';
            Anchor.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true }));
            for(let Count = 0; Count < 5; Count++) Anchor.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true }));
        });
        await boundary('foot'); assert.equal(await Page.locator('#bibi-host-navigation-heading').textContent(), '次の巻へ'); assert.deepEqual(await position(), Before);
        assert.ok(Page.url().includes('/bibi/host.html')); assert.equal((await state()).navigating, false);
        await pause(350); await wheel(100); await Page.waitForURL('**/reader/?book=3&entry=start&from=*');
        assert.equal(new URL(Page.url()).searchParams.get('from'), '/books/?search=作品#selected');
    });
    await scenario('head sentinel is symmetric and an inward action restores the book', async () => {
        await open({ edge: 'head' }); const Before = await position();
        await Page.keyboard.press('PageUp'); await boundary('head'); assert.equal(await Page.locator('#bibi-host-navigation-heading').textContent(), '前の巻へ'); assert.deepEqual(await position(), Before);
        await Page.keyboard.press('PageDown'); await boundary(null); assert.deepEqual(await position(), Before);
        await Page.keyboard.press('PageUp'); await boundary('head'); await Page.keyboard.press('PageUp'); await Page.waitForURL('**/reader/?book=1&entry=end&from=*');
    });
    await scenario('holding a key does not turn sentinel appearance into navigation', async () => {
        await open({ edge: 'foot' }); await Page.keyboard.down('PageDown'); await boundary('foot');
        await Page.keyboard.down('PageDown'); await pause(100); assert.equal((await state()).navigating, false);
        await Page.keyboard.up('PageDown'); await Page.keyboard.press('PageUp'); await boundary(null);
        await Page.keyboard.press('PageDown'); await boundary('foot'); await Page.keyboard.press('PageDown'); await Page.waitForURL('**/reader/?book=3&entry=start&from=*');
    });
    await scenario('standalone and missing-edge books return to origin after a separate outward action', async () => {
        for(const [Id, Edge, Key] of [[7, 'foot', 'PageDown'], [7, 'head', 'PageUp'], [1, 'head', 'PageUp'], [3, 'foot', 'PageDown']]) {
            await open({ 'book-key': 'book:' + Id, 'content-hash': 'hash-' + Id, edge: Edge }); await Page.keyboard.press(Key); await boundary(Edge);
            assert.equal(await Page.locator('#bibi-host-navigation-heading').textContent(), '元のページへ戻る'); await Page.keyboard.press(Key); await Page.waitForURL('**/books/?search=*'); assert.equal(new URL(Page.url()).hash, '#selected');
        }
    });
    await scenario('fresh lookup failures never leave reader or skip an unavailable volume', async () => {
        for(const [Failure, Code] of [['changed', 'CONTENT_CHANGED'], ['external', 'INVALID_DESTINATION'], ['unavailable', 'BOOK_UNAVAILABLE']]) {
            await open({ edge: 'foot' }); const Before = await position(); await Page.keyboard.press('PageDown'); await boundary('foot'); Mode = Failure;
            await Page.keyboard.press('PageDown'); await Page.waitForFunction(Code => Bibi.API.getHostNavigationState().error?.code === Code, Code);
            assert.ok(Page.url().includes('/bibi/host.html')); assert.deepEqual(await position(), Before); assert.equal((await state()).navigating, false);
            await Page.keyboard.press('PageUp'); await boundary(null);
        }
    });
    await scenario('inward action aborts pending navigation without stale errors or locks', async () => {
        await open({ edge: 'foot' }); await Page.keyboard.press('PageDown'); await boundary('foot'); Mode = 'delay'; await Page.keyboard.press('PageDown');
        await Page.waitForFunction(() => Bibi.API.getHostNavigationState().navigating); await Page.keyboard.press('PageUp'); await boundary(null);
        assert.equal((await state()).navigating, false); assert.equal((await state()).loading, false); await pause(1200); assert.equal((await state()).error, null);
        Mode = 'normal'; await Page.keyboard.press('PageDown'); await boundary('foot'); await Page.keyboard.press('PageDown'); await Page.waitForURL('**/reader/?book=3&entry=start&from=*');
    });
    await scenario('return and sentinel buttons support click, Enter and Space without page flips', async () => {
        for(const Key of [null, 'Enter', 'Space']) {
            await open({ edge: 'head' }); const Button = Page.locator('#bibi-host-return'); await Button.waitFor({ state: 'visible' });
            if(Key) { await Button.focus(); await Page.keyboard.press(Key); } else await Button.click();
            await Page.waitForURL('**/books/?search=*');
        }
        await open({ edge: 'foot' }); await Page.keyboard.press('PageDown'); await boundary('foot');
        const Action = Page.locator('#bibi-host-navigation-page button'); await Action.focus(); await Page.keyboard.press('Space'); await Page.waitForURL('**/reader/?book=3&entry=start&from=*');
    });
    await scenario('TOC remains reachable above the boundary page', async () => {
        await open({ edge: 'foot' }); await Page.keyboard.press('PageDown'); await boundary('foot');
        const Opener = await Page.evaluateHandle(() => I.Panel.Opener);
        await Opener.asElement().click(); await Opener.dispose(); await Page.waitForFunction(() => I.Panel.UIState === 'active');
        const Link = Page.getByRole('link', { name: '長い段落', exact: true }); await Link.waitFor({ state: 'visible' });
        await Link.click(); await Page.waitForFunction(() => Bibi.API.getState().operable && I.Panel.UIState !== 'active'); assert.equal((await state()).visibleBoundary, null);
        assert.match((await position()).location.cfi, /^\/6\/2!/);
    });
    await scenario('two-up taps use outer sixths, single-page taps use outer thirds, in both directions', async () => {
        for(const Book of ['fixed', 'reflow', 'vertical']) {
            await Page.setViewportSize({ width: 1280, height: 900 }); await open({ book: '/epubs/' + Book + '.epub', iipp: 1 });
            if(Book !== 'fixed') await Page.evaluate(() => Bibi.API.restorePosition({ cfi: '/6/2!/4/2/4/1:6000' }));
            const TwoPane = await Page.evaluate(() => R.TwoPane); const Width = await Page.evaluate(() => R.Stage.Width); const Y = 450;
            const Band = Width / (TwoPane ? 6 : 3);
            const Before = await position(); await Page.mouse.click(Band + 15, Y); await pause(350); assert.deepEqual(await position(), Before, 'Outside the page-sized edge band must not flip.');
            await Page.mouse.click(Width - Band / 2, Y, { delay: 60 });
            await Page.waitForFunction(Index => Bibi.API.getState().operable && Bibi.API.getPosition().layout.pageIndex !== Index, Before.layout.pageIndex);
            const Moved = await position(); assert.ok(Book === 'vertical' ? Moved.layout.pageIndex < Before.layout.pageIndex : Moved.layout.pageIndex > Before.layout.pageIndex);
            await Page.setViewportSize({ width: 600, height: 1000 }); await Page.waitForFunction(() => R.Stage.Width === 600 && Bibi.API.getState().operable); assert.equal(await Page.evaluate(() => R.TwoPane), false);
            if(Book !== 'fixed') await Page.evaluate(() => Bibi.API.restorePosition({ cfi: '/6/2!/4/2/4/1:6000' }));
            const SingleBefore = await position(); await Page.mouse.click(550, 500, { delay: 60 });
            await Page.waitForFunction(Index => Bibi.API.getState().operable && Bibi.API.getPosition().layout.pageIndex !== Index, SingleBefore.layout.pageIndex);
        }
    });
    await scenario('horizontal and vertical scrolled modes use the same two-action boundary', async () => {
        for(const View of ['horizontal', 'vertical']) {
            await open({ 'reader-view-mode': View, edge: 'foot' }); await wheel(100); await boundary('foot'); await wheel(-100); await boundary(null);
            await pause(350); await wheel(100); await boundary('foot'); await pause(350); await wheel(100); await Page.waitForURL('**/reader/?book=3&entry=start&from=*');
        }
    });
    const Tablet = await Browser.newContext({ ...devices['iPad Pro 11'] }); TabletPage = await Tablet.newPage(); TabletPage.on('pageerror', Error => Errors.push(Error.message));
    await scenario('iPad-sized visual viewport keeps complete toolbar and safe-area controls visible', async () => {
        for(const Size of [{ width: 834, height: 1194 }, { width: 1194, height: 834 }]) {
            await TabletPage.setViewportSize(Size); await open({ edge: 'head' }, 'host.html', TabletPage);
            await TabletPage.evaluate(() => { document.documentElement.style.setProperty('--bibi-safe-area-top', '24px'); document.documentElement.style.setProperty('--bibi-safe-area-left', '12px'); document.documentElement.style.setProperty('--bibi-safe-area-right', '12px'); window.dispatchEvent(new Event('resize')); });
            await TabletPage.waitForFunction(() => Bibi.API.getState().operable);
            const Rects = await TabletPage.evaluate(() => { const Rect = Element => { const R = Element.getBoundingClientRect(); return { x: R.left, y: R.top, right: R.right, bottom: R.bottom }; }; return { width: visualViewport.width, height: visualViewport.height, menu: Rect(document.getElementById('bibi-menu')), toc: Rect(I.Panel.Opener), back: Rect(document.getElementById('bibi-host-return')) }; });
            for(const Rect of [Rects.menu, Rects.toc, Rects.back]) { assert.ok(Rect.x >= 0 && Rect.y >= 0 && Rect.right <= Rects.width + 1 && Rect.bottom <= Rects.height + 1, JSON.stringify(Rects)); }
            assert.ok(Rects.toc.y >= 24 && Rects.back.y >= 24, JSON.stringify(Rects));
            await TabletPage.screenshot({ path: path.join(ScreenshotDirectory, `ipad-${Size.width}.png`) }); console.log('VIEWPORT ' + JSON.stringify(Rects));
        }
    });
    await scenario('touch boundary gesture does not leave flick state or synthetic click behind', async () => {
        await open({ edge: 'foot' }, 'host.html', TabletPage);
        await TabletPage.evaluate(() => R.focusOn('foot', { Duration: 0 }));
        await TabletPage.waitForFunction(() => Bibi.API.getState().operable && Bibi.API.getPosition().atEnd);
        const Before = await TabletPage.evaluate(() => Bibi.API.getPosition());
        const Session = await Tablet.newCDPSession(TabletPage);
        const swipe = async () => {
            for(const [Type, X] of [['touchStart', 900], ['touchMove', 850], ['touchMove', 700], ['touchEnd', 700]]) { await Session.send('Input.dispatchTouchEvent', { type: Type, touchPoints: Type === 'touchEnd' ? [] : [{ x: X, y: 450 }] }); await pause(60); }
        };
        await swipe();
        await TabletPage.waitForFunction(() => Bibi.API.getHostNavigationState().visibleBoundary === 'foot');
        await pause(500);
        assert.equal(await TabletPage.evaluate(() => Bibi.API.getHostNavigationState().navigating), false); assert.deepEqual(await TabletPage.evaluate(() => Bibi.API.getPosition()), Before);
        await swipe(); await TabletPage.waitForURL('**/reader/?book=3&entry=start&from=*'); await Session.detach();
    });
    await Tablet.close(); assert.deepEqual(Errors, []); console.log(JSON.stringify({ passed: Results.length, scenarios: Results, screenshots: ScreenshotDirectory }, null, 2));
} catch(Error) {
    const Target = TabletPage && !TabletPage.isClosed() ? TabletPage : Page;
    if(Target && !Target.isClosed()) {
        await Target.screenshot({ path: path.join(ScreenshotDirectory, 'failure.png') });
        console.error('BROWSER FAILURE', await Target.evaluate(() => ({ state: window.Bibi?.API?.getState(), navigation: window.Bibi?.API?.getHostNavigationState() })), Errors, ConsoleErrors);
        console.error('SCREENSHOT ' + path.join(ScreenshotDirectory, 'failure.png'));
    }
    throw Error;
} finally {
    await Browser?.close(); Server.closeAllConnections(); await new Promise(Resolve => Server.close(Resolve));
}
