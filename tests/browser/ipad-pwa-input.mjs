import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { webkit, devices } from 'playwright';
import JSZip from 'jszip';
import { createReflowFixture } from './fixtures.mjs';
import { sendBook } from './book-server.mjs';

const Distribution = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../__dist/bibi');
const Index = (await fs.readFile(path.join(Distribution, 'index.html'), 'utf8')).replace('data-bibi-preset=""', 'data-bibi-preset="pwa"');
const Zip = await JSZip.loadAsync(await createReflowFixture(true));
Zip.file('content/package.opf', (await Zip.file('content/package.opf').async('string'))
    .replace('</manifest>', '<item id="svg" href="svg.xhtml" media-type="application/xhtml+xml"/></manifest>')
    .replace('<itemref idref="long"/>', '<itemref idref="nav"/><itemref idref="long"/>')
    .replace('</spine>', '<itemref idref="svg" properties="rendition:layout-pre-paginated rendition:page-spread-center"/></spine>'));
Zip.file('content/svg.xhtml', '<html xmlns="http://www.w3.org/1999/xhtml"><head><title>SVG image</title><meta name="viewport" content="width=1443,height=2048"/></head><body style="margin:0"><svg xmlns="http://www.w3.org/2000/svg" width="1443" height="2048" viewBox="0 0 1443 2048"><image xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="art.svg" width="1443" height="2048"/></svg></body></html>');
const Book = await Zip.generateAsync({ type: 'nodebuffer' });
const Books = new Map([['/fixture.epub', Book]]);
for(const Direction of ['rtl', 'ltr']) for(const Layout of ['reflowable', 'pre-paginated']) {
    const Mixed = await JSZip.loadAsync(Book), Before = Direction === 'rtl' ? 'right' : 'left', After = Direction === 'rtl' ? 'left' : 'right';
    Mixed.file('content/package.opf', (await Mixed.file('content/package.opf').async('string'))
        .replace('page-progression-direction="rtl"', `page-progression-direction="${Direction}"`)
        .replace('</metadata>', '<meta property="rendition:spread">landscape</meta></metadata>')
        .replace('</manifest>', '<item id="credit" href="credit.xhtml" media-type="application/xhtml+xml"/></manifest>')
        .replace('<itemref idref="svg" properties="rendition:layout-pre-paginated rendition:page-spread-center"/>',
            `<itemref idref="credit" properties="rendition:layout-${Layout} page-spread-${Before}"/><itemref idref="svg" properties="rendition:layout-pre-paginated page-spread-${After}"/>`));
    Mixed.file('content/credit.xhtml', '<html xmlns="http://www.w3.org/1999/xhtml"><head><title>Illustration credit</title><meta name="viewport" content="width=1443,height=2048"/><style>html,body{writing-mode:vertical-rl}body{margin:0}</style></head><body><div><p><br/></p><p><br/></p><p><br/></p><p>口絵・本文イラスト　作者</p></div></body></html>');
    Books.set(`/${Direction}-${Layout}.epub`, await Mixed.generateAsync({ type: 'nodebuffer' }));
}
const Preset = 'Bibi.preset(' + JSON.stringify({
    'extract-if-necessary': ['*'], 'allow-scripts-in-content': false,
    'use-host-navigation': true, 'host-navigation-api': '/navigation', 'host-navigation-paths': ['/books/'],
    'resume-from-last-position': 'no', 'keep-settings': 'no', 'use-menubar': 'yes', 'use-arrows': 'no', 'use-slider': 'yes',
    'flipper-width': 1 / 3, 'recognize-repeated-taps-separately': false
}) + ');';
const Server = http.createServer(async (Request, Response) => {
    try {
        const URL = new globalThis.URL(Request.url, 'http://localhost'), Name = URL.pathname;
        if(Books.has(Name)) return sendBook(Request, Response, Books.get(Name));
        if(Name === '/navigation') {
            Response.writeHead(200, { 'Content-Type': 'application/json' });
            Response.end(JSON.stringify({ schemaVersion: 1, bookKey: URL.searchParams.get('book_key'), contentHash: URL.searchParams.get('content_hash'), series: null, previous: null, next: null, returnTo: { href: '/books/', label: '一覧へ戻る' } }));
            return;
        }
        if(Name === '/bibi/presets/pwa.js') { Response.writeHead(200, { 'Content-Type': 'text/javascript' }); Response.end(Preset); return; }
        if(Name === '/books/') { Response.writeHead(200, { 'Content-Type': 'text/html' }); Response.end('<title>Books</title>'); return; }
        if(!Name.startsWith('/bibi/')) throw new Error('Unknown route');
        const Relative = Name.slice(6) || 'index.html', File = path.resolve(Distribution, Relative);
        if(!File.startsWith(Distribution + path.sep)) throw new Error('Outside distribution');
        Response.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' }[path.extname(File)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        Response.end(Relative === 'index.html' ? Index : await fs.readFile(File));
    } catch { Response.writeHead(404); Response.end(); }
});
await new Promise(Resolve => Server.listen(0, '127.0.0.1', Resolve));
const Origin = 'http://127.0.0.1:' + Server.address().port;
const Screenshots = await fs.mkdtemp(path.join(os.tmpdir(), 'bibi-pwa-input-'));
let Browser;
try {
    Browser = await webkit.launch();
    const Context = await Browser.newContext({ ...devices['iPad Pro 11'], viewport: { width: 1080, height: 790 } });
    await Context.addInitScript(() => Object.defineProperty(navigator, 'standalone', { configurable: true, get: () => true }));
    const Page = await Context.newPage(), Errors = [];
    Page.on('pageerror', Error => Errors.push(Error.message));
    await Page.goto(Origin + '/bibi/?book=' + encodeURIComponent(Origin + '/fixture.epub') + '&book-key=book:pwa&content-hash=pwa&autostart=yes&reader-view-mode=paged');
    await Page.waitForFunction(() => window.Bibi?.API?.getState().operable && Bibi.API.getHostNavigationState().enabled && !Bibi.API.getHostNavigationState().loading);
    const Last = await Page.evaluate(() => R.Pages.length - 1);
    const atEnd = async () => {
        await Page.evaluate(() => R.focusOn('foot', { Duration: 0 }));
        await Page.waitForFunction(() => Bibi.API.getState().operable && Bibi.API.getPosition().atEnd);
    };
    // Replay the real iPad trace: the pressed point is clipped, the release is not,
    // and a tiny physical movement can produce a large DOM touchmove before click.
    const gesture = Options => Page.evaluate(({ move = false, click = true, cancel = false, x = 1052 } = {}) => {
        const Item = R.Current.Pages[0].Item, Doc = Item.contentDocument, Win = Item.contentWindow;
        const Target = Doc.querySelector('image, p') || Doc.body, Rect = Item.getBoundingClientRect();
        const point = X => ({ clientX: (X - Rect.left) * Item.offsetWidth / Rect.width, clientY: (395 - Rect.top) * Item.offsetHeight / Rect.height, screenX: X, screenY: 395 });
        const Start = point(809), End = point(x);
        const pointer = (Type, Point) => Target.dispatchEvent(new Win.PointerEvent(Type, { ...Point, bubbles: true, cancelable: true, pointerType: 'touch', pointerId: 7, isPrimary: true, buttons: Type === 'pointerup' ? 0 : 1 }));
        const touch = (Type, Point) => {
            const Event = new Win.Event(Type, { bubbles: true, cancelable: true }), Touch = { ...Point, identifier: 7, target: Target };
            Object.defineProperties(Event, { touches: { value: Type === 'touchend' || Type === 'touchcancel' ? [] : [Touch] }, changedTouches: { value: [Touch] } });
            Target.dispatchEvent(Event);
        };
        pointer('pointerdown', Start); touch('touchstart', Start);
        if(move) { pointer('pointermove', End); touch('touchmove', End); }
        if(cancel) { pointer('pointercancel', End); touch('touchcancel', End); }
        else { pointer('pointerup', End); touch('touchend', move ? End : Start); }
        if(click) Target.dispatchEvent(new Win.MouseEvent('click', { ...Start, bubbles: true, cancelable: true, detail: 1, button: 0 }));
    }, Options);
    const assertPrevious = async () => {
        await Page.waitForFunction(Index => Bibi.API.getState().operable && R.Current.Pages.some(Page => Page.Index === Index), Last - 1);
        assert.equal(await Page.evaluate(() => Bibi.API.getHostNavigationState().visibleBoundary), null);
    };
    await atEnd();
    await gesture();
    await assertPrevious();
    console.log('PASS iPad PWA clipped SVG pointer origin still yields exactly one backward click');
    await atEnd();
    await gesture({ move: true });
    await assertPrevious();
    console.log('PASS iPad PWA coordinate jump does not become an outward volume swipe');
    await atEnd();
    await gesture({ move: true, click: false });
    await Page.waitForTimeout(400);
    assert.equal(await Page.evaluate(() => Bibi.API.getPosition().atEnd), true);
    assert.equal(await Page.evaluate(() => Bibi.API.getHostNavigationState().visibleBoundary), null);
    await gesture({ cancel: true });
    await Page.waitForTimeout(400);
    assert.equal(await Page.evaluate(() => Bibi.API.getPosition().atEnd), true);
    assert.equal(await Page.evaluate(() => Bibi.API.getHostNavigationState().visibleBoundary), null);
    console.log('PASS iPad PWA swipes and canceled touches do not turn a page or enter another volume');
    await Page.touchscreen.tap(540, 395);
    await Page.waitForFunction(() => I.Utilities.UIState === 'active');
    await Page.touchscreen.tap(540, 395);
    await Page.waitForFunction(() => I.Utilities.UIState === 'default');
    await Page.screenshot({ path: path.join(Screenshots, 'svg-reader.png') });
    console.log('PASS iPad PWA native center clicks open and close the menu');
    await Page.touchscreen.tap(20, 395);
    await Page.waitForFunction(() => Bibi.API.getHostNavigationState().visibleBoundary === 'foot');
    await Page.touchscreen.tap(1060, 395);
    await Page.waitForFunction(() => Bibi.API.getHostNavigationState().visibleBoundary === null);
    console.log('PASS iPad PWA native taps enter and leave the volume boundary without a swipe');
    await Page.evaluate(() => R.focusOn({ Item: R.Items[1], PageIndexInItem: 0 }, { Duration: 0 }));
    await Page.waitForFunction(() => Bibi.API.getState().operable && R.Current.Pages[0].Item.Index === 1);
    const Selection = await Page.evaluate(() => {
        const Doc = R.Items[1].contentDocument, Text = Doc.querySelector('p').firstChild, Range = Doc.createRange();
        Range.setStart(Text, 0); Range.setEnd(Text, 8);
        Doc.getSelection().removeAllRanges(); Doc.getSelection().addRange(Range);
        return { text: Doc.getSelection().toString(), pages: R.Current.Pages.map(Page => Page.Index) };
    });
    await gesture({ move: true });
    await Page.waitForTimeout(400);
    assert.deepEqual(await Page.evaluate(() => ({ text: R.Items[1].contentDocument.getSelection().toString(), pages: R.Current.Pages.map(Page => Page.Index) })), Selection);
    await Page.screenshot({ path: path.join(Screenshots, 'selected-text.png') });
    await Page.evaluate(() => R.Items[1].contentDocument.getSelection().removeAllRanges());
    console.log('PASS iPad PWA text selection survives touch movement and click without page navigation');
    await Page.evaluate(() => R.focusOn({ Item: R.Items[0], PageIndexInItem: 0 }, { Duration: 0 }));
    await Page.waitForFunction(() => Bibi.API.getState().operable && R.Current.Pages[0].Item.Index === 0);
    await Page.frameLocator('iframe.item').first().locator('nav a').first().tap();
    await Page.waitForFunction(() => Bibi.API.getState().operable && R.Current.Pages[0].Item.Index === 1);
    console.log('PASS iPad PWA TOC links still navigate to their chapter');
    for(const Direction of ['rtl', 'ltr']) for(const Layout of ['reflowable', 'pre-paginated']) {
        await Page.goto(Origin + '/bibi/?book=' + encodeURIComponent(Origin + `/${Direction}-${Layout}.epub`) + '&book-key=book:pwa&content-hash=pwa&autostart=yes&reader-view-mode=paged');
        await Page.waitForFunction(() => window.Bibi?.API?.getState().operable);
        await atEnd();
        await Page.waitForFunction(() => {
            const Picture = R.Items.at(-1);
            return Picture.Loaded && Picture.contentDocument?.querySelector('svg image') && getComputedStyle(Picture).visibility === 'visible' && getComputedStyle(Picture).opacity === '1';
        });
        const Bounds = await Page.evaluate(() => {
            const Picture = R.Items.at(-1), Credit = R.Items.at(-2);
            return { picture: Picture.getBoundingClientRect().toJSON(), credit: Credit.getBoundingClientRect().toJSON(), creditVisible: R.Current.Pages.some(Page => Page.Item === Credit), width: innerWidth, height: innerHeight };
        });
        const assertInside = Rect => {
            assert.ok(Rect.width > 100 && Rect.height > 100, JSON.stringify(Bounds));
            assert.ok(Rect.left >= -1 && Rect.right <= Bounds.width + 1 && Rect.top >= -1 && Rect.bottom <= Bounds.height + 1, JSON.stringify(Bounds));
        };
        assertInside(Bounds.picture);
        assert.ok(Math.abs(Bounds.picture.width / Bounds.picture.height - 1443 / 2048) < 0.01, JSON.stringify(Bounds));
        if(Layout === 'pre-paginated') {
            assert.equal(Bounds.creditVisible, true);
            assertInside(Bounds.credit);
        }
        await Page.screenshot({ path: path.join(Screenshots, `${Direction}-${Layout}-opening.png`), animations: 'disabled' });
        console.log(`PASS ${Direction} ${Layout} predecessor does not push the fixed image outside the viewport`);
    }
    assert.deepEqual(Errors, []);
    await Context.close();
    console.log('Screenshots: ' + Screenshots);
} finally {
    await Browser?.close();
    Server.closeAllConnections();
    await new Promise(Resolve => Server.close(Resolve));
}
