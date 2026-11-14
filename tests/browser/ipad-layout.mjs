import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { chromium, webkit, devices } from 'playwright';
import JSZip from 'jszip';
import { createReflowFixture } from './fixtures.mjs';
import { sendBook } from './book-server.mjs';

const Repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const Distribution = path.join(Repository, '__dist/bibi');
const Zip = await JSZip.loadAsync(await createReflowFixture(true));
Zip.file('content/package.opf', (await Zip.file('content/package.opf').async('string')).replace('<itemref idref="long"/>', '<itemref idref="nav"/><itemref idref="long"/>'));
Zip.file('content/nav.xhtml', `<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="ja"><head><title>目次</title><style>body{writing-mode:horizontal-tb;font:18px/1.8 serif}ol{list-style:none;padding:0;margin:0}li{margin:0}</style></head><body><nav epub:type="toc"><ol>${Array.from({ length: 100 }, (_, i) => `<li><a href="long.xhtml#long">${i + 1} 目次の項目と長さの違う見出し</a></li>`).join('')}</ol></nav></body></html>`);
const Book = await Zip.generateAsync({ type: 'nodebuffer' });
const Screenshots = await fs.mkdtemp(path.join(os.tmpdir(), 'bibi-ipad-'));
const Server = http.createServer(async (Request, Response) => {
    try {
        const Name = new URL(Request.url, 'http://localhost').pathname;
        if(Name === '/toc.epub') return sendBook(Request, Response, Book);
        if(!Name.startsWith('/bibi/')) throw new Error('Unknown route');
        const File = path.resolve(Distribution, Name.slice(6) || 'index.html');
        if(!File.startsWith(Distribution + path.sep)) throw new Error('Outside distribution');
        Response.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' }[path.extname(File)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        Response.end(await fs.readFile(File));
    } catch { Response.writeHead(404); Response.end(); }
});
await new Promise(Resolve => Server.listen(0, '127.0.0.1', Resolve));
const Origin = 'http://127.0.0.1:' + Server.address().port;
try {
    for(const Engine of (process.env.BIBI_TEST_BROWSER || 'chromium').split(',')) {
        const Browser = await ({ chromium, webkit }[Engine]).launch();
        try {
            const Context = await Browser.newContext({ ...devices['iPad Pro 11'], viewport: { width: 1180, height: 885 }, colorScheme: 'dark' });
            const Page = await Context.newPage(), Errors = [];
            Page.on('pageerror', Error => Errors.push(Error.message));
            await Page.goto(Origin + '/bibi/?book=' + encodeURIComponent(Origin + '/toc.epub') + '&autostart=yes&reader-view-mode=paged&keep-settings=no&resume-from-last-position=no');
            await Page.waitForFunction(() => window.Bibi?.API?.getState().operable);
            const assertCentered = async () => {
                const Geometry = await Page.evaluate(() => {
                    const Item = R.Items[0], Nav = Item.Body.querySelector('nav').getBoundingClientRect();
                    return { center: Item.getBoundingClientRect().left + Item.Padding.Left + Nav.left + Nav.width / 2, stage: R.Stage.Width, pages: Item.Pages.length };
                });
                assert.ok(Math.abs(Geometry.center - Geometry.stage / 2) < 2, JSON.stringify(Geometry));
                assert.ok(Geometry.pages > 2);
            };
            await assertCentered();
            await Page.screenshot({ path: path.join(Screenshots, Engine + '-toc.png') });
            console.log('PASS ' + Engine + ' horizontal TOC block is centered without centering its headings');

            const atPage = async Index => {
                await Page.evaluate(Index => R.focusOn({ Item: R.Items[0], PageIndexInItem: Index }, { Duration: 0 }), Index);
                await Page.waitForFunction(Index => Bibi.API.getState().operable && R.getPage().IndexInItem === Index, Index);
            };
            const turn = async (X, Direction) => {
                const Before = await Page.evaluate(() => R.getPage().IndexInItem);
                await Page.touchscreen.tap(X, 400);
                await Page.waitForFunction(Expected => Bibi.API.getState().operable && R.getPage().IndexInItem === Expected, Before + Direction);
            };
            await atPage(1);
            await turn(1180 / 4, 1);
            await turn(1180 * 3 / 4, -1);
            console.log('PASS ' + Engine + ' solo landscape page uses outer thirds for forward and backward touch');

            await Page.addStyleTag({ content: 'html#bibi { width:75% !important; }' });
            await Page.evaluate(() => window.dispatchEvent(new Event('resize')));
            await Page.waitForFunction(() => R.Stage.Width === 885 && Bibi.API.getState().operable);
            await assertCentered();
            await atPage(1);
            await turn(885 / 4, 1);
            await turn(885 - 30, -1);
            await atPage(0);
            await Page.frameLocator('iframe.item').first().locator('nav a').first().tap();
            await Page.waitForFunction(() => Bibi.API.getState().operable && R.getPage().Item.Index === 1);
            console.log('PASS ' + Engine + ' centered TOC links still navigate to the chapter');
            // Test the menu on prose, not between TOC anchors: mobile browsers expand link hit targets.
            const MenuPoint = { x: 885 / 2, y: 400 };
            await Page.touchscreen.tap(MenuPoint.x, MenuPoint.y);
            await Page.waitForFunction(() => I.Utilities.UIState === 'active').catch(async Error => {
                console.error('MENU FAILURE', MenuPoint, await Page.evaluate(() => ({
                    position: Bibi.API.getPosition(), state: Bibi.API.getState(), menu: I.Utilities.UIState,
                    viewport: [innerWidth, innerHeight, visualViewport.width, visualViewport.scale],
                    body: document.body.getBoundingClientRect().toJSON(), main: R.Main.getBoundingClientRect().toJSON(),
                    selection: I.RangeFinder.RangeOfSelection?.toString(), selecting: I.RangeFinder.Selecting,
                    frames: R.Items.map(Item => ({ path: Item.Source.Path, rect: Item.getBoundingClientRect().toJSON() }))
                })));
                throw Error;
            });
            await Page.touchscreen.tap(MenuPoint.x, MenuPoint.y);
            await Page.waitForFunction(() => I.Utilities.UIState === 'default');
            console.log('PASS ' + Engine + ' narrower reader keeps both edge taps and center menu reachable');
            await atPage(1);

            await Page.evaluate(() => {
                let Pending = true;
                E.add('bibi:laid-out-item', () => {
                    if(!Pending) return;
                    Pending = false;
                    const Style = document.head.appendChild(document.createElement('style'));
                    Style.id = 'resize-during-layout';
                    Style.textContent = 'html#bibi { width:65% !important; }';
                    window.dispatchEvent(new Event('resize'));
                });
                return R.layOutBook({ Reset: true });
            });
            await Page.waitForFunction(() => R.Stage.Width === 767 && Bibi.API.getState().operable);
            await atPage(1);
            await turn(737, -1);
            console.log('PASS ' + Engine + ' resize arriving during pagination reaches final geometry and remains navigable');

            if(Engine === 'webkit') {
                await Page.evaluate(() => {
                    document.getElementById('resize-during-layout').textContent = 'html#bibi { width:80% !important; }';
                    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
                });
                await Page.waitForFunction(() => R.Stage.Width === 944 && Bibi.API.getState().operable);
                await assertCentered();
                console.log('PASS webkit standalone page restoration refreshes geometry without a window resize');
                await Page.evaluate(() => {
                    document.querySelectorAll('style').forEach(Style => { if(Style.textContent.includes('html#bibi { width:')) Style.remove(); });
                    Object.defineProperty(visualViewport, 'width', { configurable: true, get: () => 885 });
                    visualViewport.dispatchEvent(new Event('resize'));
                });
                await Page.waitForFunction(() => R.Stage.Width === 1180 && Bibi.API.getState().operable);
                assert.equal(await Page.evaluate(() => document.body.getBoundingClientRect().width), 1180);
                await atPage(1);
                await turn(1150, -1);
                await Page.evaluate(() => { delete visualViewport.width; visualViewport.dispatchEvent(new Event('resize')); });
                await Page.waitForFunction(() => R.Stage.Width === 1180 && Bibi.API.getState().operable);
                console.log('PASS webkit stale visual viewport width does not freeze the reader into a narrower pixel width');
            }
            assert.deepEqual(Errors, []);
            await Context.close();
        } finally { await Browser.close(); }
    }
    console.log('Screenshots: ' + Screenshots);
} finally { Server.closeAllConnections(); await new Promise(Resolve => Server.close(Resolve)); }
