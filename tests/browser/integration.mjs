import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createReflowFixture, createLazyFixture, LongText, TailText } from './fixtures.mjs';
import { sendBook } from './book-server.mjs';
import { verifyDistribution } from '../../zzz/distribution.mjs';

const Repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const Distribution = path.join(Repository, '__dist/bibi');
await verifyDistribution(Distribution);
const Reflow = await createReflowFixture(), Vertical = await createReflowFixture(true), IllustrationFlow = await createReflowFixture(true, true), Lazy = await createLazyFixture();
const Fixed = await fs.readFile(path.join(Repository, '__src/bibi-bookshelf/__samples/Sample_Pre-Paginated_LtR.epub'));
const Content = new Map([['/epubs/reflow.epub', Reflow], ['/epubs/reflow', Reflow], ['/epubs/vertical.epub', Vertical], ['/epubs/flow.epub', IllustrationFlow], ['/epubs/lazy.epub', Lazy], ['/epubs/fixed.epub', Fixed]]);
const Requests = [], Errors = [], Results = [];
let HostOrigin, SignedOrigin, Browser, Page;
const Temp = await fs.mkdtemp(path.join(os.tmpdir(), 'bibi-browser-'));
const HostPage = `<!doctype html><html><head><meta charset="utf-8"><title>Bibi public API smoke</title><style>html,body{margin:0;width:100%;height:100%;overflow:hidden}iframe.bibi-frame{position:absolute;inset:0;width:100%;height:100%;border:0}</style></head><body><script src="/vendor/bibi/and/jo.js"></script><script>
window.readers=[];window.positions=[];window.states=[];
window.openReader=options=>{const url=new URL(options?.deployment||'/vendor/bibi/',location.origin);for(const[k,v]of Object.entries({book:'/epubs/reflow.epub','autostart':'yes','autostart-embedded':'yes','reader-view-mode':'paged','allow-placeholders':'false','book-key':'book-1','content-hash':'revision-1','storage-namespace':'browser-regression','storage-user':'user-1',...options})){if(k!=='deployment')url.searchParams.set(k,String(v));}const bucket=new window['bibi:jo'].Bucket({'bibi-href':url.href});bucket.api.subscribe('bibi:position-changed',event=>window.positions.push(event));bucket.api.subscribe('bibi:state-changed',event=>window.states.push(event));document.body.append(bucket.Anchor);bucket.embed();readers.push(bucket);return readers.length-1;};
window.closeReader=index=>{const bucket=readers[index];bucket.api.dispose();bucket.Frame.remove();bucket.Anchor.remove();};
</script></body></html>`;
const SignedServer = http.createServer((Request, Response) => {
    if(Request.method === 'OPTIONS') { Response.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS', 'Access-Control-Allow-Headers': 'Range' }); Response.end(); return; }
    if(new URL(Request.url, 'http://localhost').searchParams.get('signature') !== 'fixture') { Response.writeHead(403, { 'Access-Control-Allow-Origin': HostOrigin }); Response.end(); return; }
    sendBook(Request, Response, Reflow, true, Requests);
});
const Server = http.createServer(async (Request, Response) => {
    try {
        const URLPath = decodeURIComponent(new URL(Request.url, 'http://localhost').pathname);
        if(URLPath === '/host') { Response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Set-Cookie': 'book-auth=granted; HttpOnly; SameSite=Lax; Path=/' }); Response.end(HostPage); return; }
        if(URLPath === '/epubs/redirect.epub') {
            if(!Request.headers.cookie?.includes('book-auth=granted')) { Response.writeHead(401); Response.end(); return; }
            Response.writeHead(302, { Location: SignedOrigin + '/book.epub?signature=fixture' }); Response.end(); return;
        }
        if(Content.has(URLPath)) {
            if(!Request.headers.cookie?.includes('book-auth=granted')) { Response.writeHead(401); Response.end(); return; }
            sendBook(Request, Response, Content.get(URLPath), false, Requests); return;
        }
        if(['/vendor/bibi/presets/integration.js', '/alternate/bibi/presets/integration.js'].includes(URLPath)) {
            Response.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' });
            Response.end('Bibi.preset({"extract-if-necessary":[".epub",".zip",""],"resume-from-last-position":"yes","keep-settings":"yes","allow-scripts-in-content":false,"request-with-credentials":false});'); return;
        }
        const Prefix = ['/vendor/bibi/', '/alternate/bibi/'].find(Prefix => URLPath.startsWith(Prefix));
        if(Prefix) {
            const Relative = URLPath.slice(Prefix.length) || 'index.html';
            const File = path.resolve(Distribution, Relative);
            if(!File.startsWith(Distribution + path.sep)) { Response.writeHead(403); Response.end(); return; }
            const Bytes = await fs.readFile(File);
            const Type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' }[path.extname(File)] || 'application/octet-stream';
            Response.writeHead(200, { 'Content-Type': Type, 'Cache-Control': 'no-store' }); Response.end(Bytes); return;
        }
        Response.writeHead(404); Response.end();
    } catch { Response.writeHead(404); Response.end(); }
});
const listen = Server => new Promise(Resolve => Server.listen(0, '127.0.0.1', () => Resolve('http://127.0.0.1:' + Server.address().port)));
const close = Server => new Promise(Resolve => { Server.closeAllConnections(); Server.close(Resolve); });
const scenario = async (Name, Run) => { await Run(); Results.push(Name); console.log('PASS ' + Name); };
try {
    HostOrigin = await listen(Server); SignedOrigin = await listen(SignedServer);
    Browser = await chromium.launch();
    Page = await Browser.newPage({ viewport: { width: 1280, height: 900 } });
    Page.on('pageerror', Error => Errors.push(Error.message));
    await Page.goto(HostOrigin + '/host');
    const open = async Options => {
        const Index = await Page.evaluate(Options => window.openReader(Options), Options || {});
        await Page.evaluate(Index => window.readers[Index].api.ready, Index);
        await Page.waitForFunction(async Index => (await window.readers[Index].api.getState()).operable, Index);
        return Index;
    };
    const position = Index => Page.evaluate(Index => window.readers[Index].api.getPosition(), Index);
    const restore = (Index, Location) => Page.evaluate(({ Index, Location }) => window.readers[Index].api.restorePosition(Location), { Index, Location });
    const remove = Index => Page.evaluate(Index => window.closeReader(Index), Index);
    const readerFrame = async Index => {
        const Handle = await Page.evaluateHandle(Index => window.readers[Index].Frame, Index);
        return Handle.asElement().contentFrame();
    };
    const textVisible = async (Index, Id, Offset) => {
        const ReaderFrame = await readerFrame(Index);
        for(const Frame of ReaderFrame.childFrames()) {
            if(!await Frame.locator('#' + Id).count()) continue;
            const Element = await Frame.locator('#' + Id).elementHandle();
            if(!Element) continue;
            assert.equal(await Element.isVisible(), true, 'The restored source must be visible, not merely have hidden layout rectangles.');
            const Rectangle = await Element.evaluate((Element, Offset) => {
                const Node = Element.firstChild, Range = document.createRange();
                Range.setStart(Node, Offset); Range.setEnd(Node, Offset + 1);
                const Rect = Range.getBoundingClientRect();
                return { left: Rect.left, top: Rect.top, width: Rect.width, height: Rect.height };
            }, Offset);
            const Box = await (await Frame.frameElement()).boundingBox(), Viewport = Page.viewportSize();
            assert.ok(Box && Rectangle.width && Rectangle.height, JSON.stringify({ restoredCharacter: Id, offset: Offset, Rectangle, Box, Viewport }));
            const Left = Box.x + Rectangle.left, Top = Box.y + Rectangle.top;
            assert.ok(Left < Viewport.width && Left + Rectangle.width > 0 && Top < Viewport.height && Top + Rectangle.height > 0, JSON.stringify({ restoredCharacter: Id, offset: Offset, Left, Top, Rectangle, Viewport }));
            return { Left, Top, Rectangle };
        }
        assert.fail('The restored source text is absent from the delivered reader.');
    };
    let Reader = await open();
    let Saved;
    await scenario('character location restore and typed Jo navigation', async () => {
        const Target = { cfi: '/6/2!/4/2/4/1:6000' };
        const Restored = await restore(Reader, Target);
        await textVisible(Reader, 'long', 6000);
        assert.equal(Restored.requestedLocation.cfi, Target.cfi);
        Saved = await position(Reader);
        assert.match(Saved.location.cfi, /^\/6\/2!\/4\/2\/4\/1:\d+$/);
        assert.ok(Number(Saved.location.cfi.split(':')[1]) > 2000, 'A long paragraph must not resume from its first character.');
        assert.equal(Saved.progressBasis, 'spine-text');
        const PositionCount = await Page.evaluate(() => window.positions.length);
        await Page.evaluate(Index => window.readers[Index].move(1), Reader);
        await Page.waitForFunction(({ Before, PageIndex }) => window.positions.slice(Before).some(Event => Event.position.layout.pageIndex !== PageIndex), { Before: PositionCount, PageIndex: Saved.layout.pageIndex });
        await Page.evaluate(Index => window.readers[Index].focus({ P: '1.1.1' }), Reader);
        await Page.waitForFunction(async Index => (await window.readers[Index].api.getPosition()).layout.pageIndex === 0, Reader);
        const Error = await Page.evaluate(async Index => { try { await window.readers[Index].api.restorePosition({ cfi: 'bad"quoted' }); } catch(Error) { return Error.code; } }, Reader);
        assert.equal(Error, 'INVALID_LOCATION');
        assert.equal(await Page.evaluate(() => window.__epubScriptExecuted), undefined);
    });
    await scenario('resize and font changes preserve original-source location', async () => {
        const StateCount = await Page.evaluate(() => window.states.length);
        await Page.setViewportSize({ width: 900, height: 760 });
        await Page.waitForFunction(Before => window.states.slice(Before).some(Event => Event.state.operable), StateCount);
        await restore(Reader, Saved.location);
        await textVisible(Reader, 'long', Number(Saved.location.cfi.split(':')[1]));
        let Current = await position(Reader);
        assert.equal(Current.location.cfi.split(':')[0], Saved.location.cfi.split(':')[0]);
        assert.ok(Math.abs(Number(Current.location.cfi.split(':')[1]) - Number(Saved.location.cfi.split(':')[1])) < 3000);
        await remove(Reader);
        Reader = await open({ 'base-fontsize': 24, location: JSON.stringify(Saved.location) });
        await textVisible(Reader, 'long', Number(Saved.location.cfi.split(':')[1]));
        const State = await Page.evaluate(Index => window.readers[Index].api.getState(), Reader);
        assert.equal(State.initialRestore.ok, true);
        Current = await position(Reader);
        assert.equal(Current.location.cfi.split(':')[0], Saved.location.cfi.split(':')[0]);
        assert.ok(Math.abs(Current.progress - Saved.progress) < 0.08);
    });
    await scenario('table of contents, view switching and real scrolling publish settled positions', async () => {
        let Before = await Page.evaluate(() => window.positions.length);
        const Frame = await readerFrame(Reader);
        await Page.evaluate(Index => window.readers[Index].togglePanel(), Reader);
        await Frame.getByRole('link', { name: '最後の章', exact: true }).click();
        await Page.waitForFunction(Before => window.positions.slice(Before).some(Event => Event.position.progress >= 2 / 3), Before);
        await textVisible(Reader, 'tail', 0);
        const StateCount = await Page.evaluate(() => window.states.length);
        await Page.evaluate(Index => window.readers[Index].changeView('horizontal'), Reader);
        await Page.waitForFunction(Before => window.states.slice(Before).some(Event => Event.state.operable), StateCount);
        const ScrollingRestore = await restore(Reader, Saved.location);
        assert.equal(ScrollingRestore.position.location.cfi.split(':')[0], Saved.location.cfi.split(':')[0], 'Live restore must report the newly visible source, not an old intersection.');
        await textVisible(Reader, 'long', Number(Saved.location.cfi.split(':')[1]));
        Before = await Page.evaluate(() => window.positions.length);
        const BeforeLocation = (await position(Reader)).location.cfi;
        await Page.mouse.move(450, 350);
        await Page.mouse.wheel(900, 0);
        await Page.waitForFunction(({ Before, Location }) => window.positions.slice(Before).some(Event => Event.position.location.cfi !== Location), { Before, Location: BeforeLocation });
        await remove(Reader); Reader = await open();
    });
    await scenario('explicit initial position beats automark and invalid restore is reported', async () => {
        await remove(Reader);
        Reader = await open({ location: JSON.stringify({ cfi: '/6/6!/4/2/4/1:100' }) });
        assert.match((await position(Reader)).location.cfi, /^\/6\/6!/);
        await remove(Reader);
        Reader = await open({ location: JSON.stringify({ cfi: '/6/9998!/4/2' }) });
        const State = await Page.evaluate(Index => window.readers[Index].api.getState(), Reader);
        assert.equal(State.status, 'ready'); assert.equal(State.initialRestore.ok, false);
        assert.equal(State.initialRestore.error.code, 'LOCATION_NOT_FOUND');
        assert.match(State.initialRestore.position?.location.cfi || '', /^\/6\/2!/);
        await textVisible(Reader, 'long', 0);
        await remove(Reader); Reader = await open();
    });
    await scenario('two reader requests and forged source/session notifications stay isolated', async () => {
        const Other = await open({ 'book-key': 'book-2', 'storage-user': 'user-2' });
        const States = await Page.evaluate(async ({ A, B }) => Promise.all([window.readers[A].api.getState(), window.readers[B].api.getState()]), { A: Reader, B: Other });
        assert.equal(States[0].bookKey, 'book-1'); assert.equal(States[1].bookKey, 'book-2'); assert.notEqual(States[0].sessionId, States[1].sessionId);
        await Page.evaluate(async ({ Index, State }) => {
            const Message = JSON.stringify({ type: 'bibi:position-changed', schemaVersion: 1, ...State, position: { location: { p: '99' } } });
            const Rogue = document.createElement('iframe');
            Rogue.srcdoc = `<script>parent.postMessage(${JSON.stringify(Message)},parent.location.origin)<\/script>`;
            const Loaded = new Promise(Resolve => Rogue.addEventListener('load', Resolve, { once: true }));
            document.body.append(Rogue); await Loaded;
            await window.readers[Index].api.getState(); // Round-trip after the forged message, without a timing sleep.
            Rogue.remove();
        }, { Index: Reader, State: States[0] });
        await Page.evaluate(async ({ Index, State }) => {
            window.readers[Index].Frame.contentWindow.eval(`parent.postMessage(${JSON.stringify(JSON.stringify({ type: 'bibi:position-changed', schemaVersion: 1, ...State, sessionId: 'expired-session', position: { location: { p: '98' } } }))},location.origin)`);
            await window.readers[Index].api.getState();
        }, { Index: Reader, State: States[0] });
        assert.equal(await Page.evaluate(() => window.positions.some(Event => ['98', '99'].includes(Event.position.location.p))), false);
        const BeforeMismatch = (await position(Reader)).location;
        const Mismatch = await Page.evaluate(async Index => {
            try { await window.readers[Index].api.restorePosition({ p: '3' }, { bookKey: 'another-book', contentHash: 'revision-1' }); } catch(Error) { return Error.code; }
        }, Reader);
        assert.equal(Mismatch, 'IDENTITY_MISMATCH');
        assert.deepEqual((await position(Reader)).location, BeforeMismatch);
        await remove(Other);
    });
    await scenario('storage namespaces separate user and file revision with identical book metadata', async () => {
        await restore(Reader, { cfi: '/6/2!/4/2/4/1:6000' });
        await remove(Reader);
        Reader = await open({ 'storage-user': 'another-user' });
        assert.equal((await position(Reader)).layout.pageIndex, 0);
        await remove(Reader);
        Reader = await open({ 'content-hash': 'another-revision' });
        assert.equal((await position(Reader)).layout.pageIndex, 0);
        await remove(Reader);
    });
    await scenario('extensionless input and relocation keep the host-scoped automark', async () => {
        Reader = await open();
        await restore(Reader, Saved.location);
        await remove(Reader);
        Reader = await open({ deployment: '/alternate/bibi/', preset: 'integration', book: '/epubs/reflow' });
        const Resumed = await position(Reader);
        assert.ok(Number(Resumed.location.cfi.split(':')[1]) > 2000, 'The relocated reader must resume the saved paragraph position.');
        await textVisible(Reader, 'long', Number(Saved.location.cfi.split(':')[1]));
        await remove(Reader);
    });
    await scenario('live restore loads a lazy spine document before resolving its character', async () => {
        Reader = await open({ book: '/epubs/lazy.epub', 'book-key': 'lazy', 'content-hash': 'lazy-1', 'allow-placeholders': 'true' });
        await restore(Reader, { cfi: '/6/40!/4/2/4/1:100' });
        await textVisible(Reader, 'lazy19', 100);
        assert.match((await position(Reader)).location.cfi, /^\/6\/40!/);
        await remove(Reader);
    });
    await scenario('portrait donation retains the illustration original-source CFI', async () => {
        await Page.setViewportSize({ width: 1280, height: 900 });
        Reader = await open({ book: '/epubs/flow.epub', 'book-key': 'flow', 'content-hash': 'flow-1', 'base-fontsize': 16 });
        await restore(Reader, { cfi: '/6/4!/4/2/2' });
        const Frame = await readerFrame(Reader);
        const ImageFrame = await (async () => { for(const Child of Frame.childFrames()) if(await Child.locator('img[alt="縦長の挿絵"]').count()) return Child; })();
        assert.ok(ImageFrame, 'The illustration must render.');
        const Box = await ImageFrame.locator('img[alt="縦長の挿絵"]').boundingBox();
        assert.ok(Box && Box.x >= 640 && Box.x + Box.width <= 1280 && Box.y >= 0 && Box.y + Box.height <= 900, JSON.stringify(Box));
        const Prose = await textVisible(Reader, 'tail', 0);
        assert.ok(Prose.Left >= 0 && Prose.Left + Prose.Rectangle.width <= 640 && Prose.Top >= 0 && Prose.Top + Prose.Rectangle.height <= 900, JSON.stringify(Prose));
        assert.match((await position(Reader)).location.cfi, /^\/6\/4!/);
        await Page.screenshot({ path: path.join(Temp, 'portrait-donation.png') });
        const StateCount = await Page.evaluate(() => window.states.length);
        await Page.setViewportSize({ width: 1400, height: 900 });
        await Page.waitForFunction(Before => window.states.slice(Before).some(Event => Event.state.operable), StateCount);
        await restore(Reader, { cfi: '/6/4!/4/2/2' });
        assert.match((await position(Reader)).location.cfi, /^\/6\/4!/);
        await remove(Reader);
    });
    await scenario('paged vertical text stays inside the reader viewport below the menubar', async () => {
        const PreviousViewport = Page.viewportSize();
        await Page.setViewportSize({ width: 1280, height: 900 });
        Reader = await open({ book: '/epubs/vertical.epub', 'book-key': 'viewport-alignment', 'content-hash': 'vertical-1', 'use-menubar': 'yes', 'use-full-height': 'no', 'keep-settings': 'no', 'resume-from-last-position': 'no' });
        const Frame = await readerFrame(Reader);
        const assertAligned = async () => {
            const Geometry = await Frame.locator('.page.current').first().evaluate(Element => {
                const Page = Element.getBoundingClientRect(), Main = document.getElementById('bibi-main').getBoundingClientRect();
                return { page: { top: Page.top, bottom: Page.bottom }, viewport: { top: Main.top, bottom: Main.bottom } };
            });
            assert.ok(Math.abs(Geometry.page.top - Geometry.viewport.top) <= 1 && Geometry.page.bottom <= Geometry.viewport.bottom + 1, JSON.stringify(Geometry));
        };
        await restore(Reader, { cfi: '/6/2!/4/2/4/1:0' });
        await assertAligned();
        await textVisible(Reader, 'long', 0);
        const Start = (await position(Reader)).layout.pageIndex;
        await Page.evaluate(Index => window.readers[Index].move(1), Reader);
        assert.equal((await position(Reader)).layout.pageIndex, Start + 1);
        await assertAligned();
        await Page.evaluate(Index => window.readers[Index].move(-1), Reader);
        assert.equal((await position(Reader)).layout.pageIndex, Start);
        await assertAligned();
        const StateCount = await Page.evaluate(() => window.states.length);
        await Page.setViewportSize({ width: 760, height: 1000 });
        await Page.waitForFunction(Before => window.states.slice(Before).some(Event => Event.state.operable), StateCount);
        await restore(Reader, { cfi: '/6/2!/4/2/4/1:0' });
        await assertAligned();
        await Page.evaluate(Index => window.readers[Index].move(1), Reader);
        await assertAligned();
        await Page.screenshot({ path: path.join(Temp, 'viewport-alignment.png') });
        await remove(Reader);
        await Page.setViewportSize(PreviousViewport);
    });
    await scenario('fixed layout and cookie-authenticated Native delivery', async () => {
        Reader = await open({ book: '/epubs/fixed.epub', 'book-key': 'fixed', 'content-hash': 'fixed-1' });
        const Position = await position(Reader);
        assert.equal(Position.progressBasis, 'spine-items');
        assert.ok(Requests.some(Request => Request.url.startsWith('/epubs/fixed.epub') && Request.cookie));
        await remove(Reader);
    });
    await scenario('vertical text and signed-style CORS/Range redirect delivery', async () => {
        Reader = await open({ book: '/epubs/vertical.epub', 'book-key': 'vertical', 'content-hash': 'vertical-1', 'reader-view-mode': 'horizontal' });
        await restore(Reader, { cfi: '/6/2!/4/2/4/1:6000' });
        await textVisible(Reader, 'long', 6000);
        assert.ok(Number((await position(Reader)).location.cfi.split(':')[1]) > 2000);
        await remove(Reader);
        Reader = await open({ book: '/epubs/redirect.epub', 'book-key': 'redirect', 'content-hash': 'redirect-1' });
        assert.equal((await Page.evaluate(Index => window.readers[Index].api.getState(), Reader)).status, 'ready');
        assert.ok(Requests.some(Request => Request.cors && Request.range));
        assert.equal(Requests.filter(Request => Request.cors).some(Request => Request.cookie), false);
    });
    await scenario('end state and load failure are distinct', async () => {
        await restore(Reader, { cfi: '/6/6!/4/2/4/1:' + (TailText.length - 1) });
        assert.equal((await position(Reader)).atEnd, true);
        await Page.screenshot({ path: path.join(Temp, 'public-api.png') });
        await remove(Reader);
        assert.deepEqual(Errors, []);
        const Bad = await Page.evaluate(() => window.openReader({ book: '/epubs/missing.epub', 'book-key': 'missing', 'content-hash': 'missing-1' }));
        const Error = await Page.evaluate(async Index => { try { await window.readers[Index].api.ready; } catch(Error) { return Error.code; } }, Bad);
        assert.equal(Error, 'LOAD_FAILED');
    });
    // A failed book load intentionally reports a reader error; the public failure is asserted above.
    console.log(JSON.stringify({ browserScenarios: Results, screenshot: path.join(Temp, 'public-api.png'), fixtureTextLength: LongText.length, realWasabiDeploymentVerified: false }));
} catch(Error) {
    if(Page) await Page.screenshot({ path: path.join(Temp, 'failure.png') }).catch(ScreenshotError => console.error(ScreenshotError));
    console.error(JSON.stringify({ completed: Results, browserErrors: Errors, requests: Requests, screenshotDirectory: Temp, message: Error.message }));
    throw Error;
} finally {
    await Browser?.close();
    await Promise.all([close(Server), close(SignedServer)]);
}
