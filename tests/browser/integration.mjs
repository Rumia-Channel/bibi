import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createReflowFixture, createLazyFixture, createOpeningFixture, createPDFFixture, createPDFEmbeddedFixture, createPDFBrokenFixture, createPDFExtensionlessFixture, createExtensionlessMarkupFixture, createImageZipFixture, createNestedImageZipFixture, createEscapedNameImageZipFixture, createLargeImageZipFixture, createUnsupportedImageZipFixture, createCorruptImageZipFixture, createZineImageZipFixture, createZipFixture, ImageZipFixturePaths, ImageZipFixtureSizes, LongText, TailText } from './fixtures.mjs';
import { sendBook } from './book-server.mjs';
import { verifyDistribution } from '../../zzz/distribution.mjs';

const Repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const Distribution = path.join(Repository, '__dist/bibi');
await verifyDistribution(Distribution);
const Reflow = await createReflowFixture(), Vertical = await createReflowFixture(true), IllustrationFlow = await createReflowFixture(true, true), Lazy = await createLazyFixture(), Opening = await createOpeningFixture();
const Fixed = await fs.readFile(path.join(Repository, '__src/bibi-bookshelf/__samples/Sample_Pre-Paginated_LtR.epub'));
const PDFDocument = createPDFFixture(40);
const EmbeddedPDF = await createPDFEmbeddedFixture(true), LinkedPDF = await createPDFEmbeddedFixture(false), BrokenPDF = await createPDFBrokenFixture(), ExtensionlessPDF = await createPDFExtensionlessFixture(3, 'attachment'), SuffixlessPDF = await createPDFExtensionlessFixture(3, 'attachment.bin'), ExtensionlessMarkup = await createExtensionlessMarkupFixture(), LargePage = createPDFFixture(1, 20000, 20000), MaliciousPDF = createPDFFixture(2, 300, 200, PageNo => PageNo == 1 ? ['needle', '<img src=x onerror=y=1>'] : 'second page'), WideTextPDF = createPDFFixture(20, 300, 200, PageNo => PageNo == 20 ? 'PDF7' : 'other page'), MultiLinePDF = createPDFFixture(3, 300, 200, PageNo => [`first line of page ${ PageNo }`, `second line of page ${ PageNo }`]);
const [ImageZip, NestedImageZip, EscapedNameImageZip, LargeImageZip, UnsupportedImageZip, ZineImageZip] = await Promise.all([
    createImageZipFixture(), createNestedImageZipFixture(), createEscapedNameImageZipFixture(),
    createLargeImageZipFixture(ImageZipFixturePaths.Large), createUnsupportedImageZipFixture(), createZineImageZipFixture()
]);
const Content = new Map([['/epubs/reflow.epub', Reflow], ['/epubs/reflow', Reflow], ['/epubs/vertical.epub', Vertical], ['/epubs/flow.epub', IllustrationFlow], ['/epubs/lazy.epub', Lazy], ['/epubs/opening.epub', Opening], ['/epubs/fixed.epub', Fixed], ['/epubs/document.pdf', PDFDocument], ['/epubs/embedded.epub', EmbeddedPDF], ['/epubs/linked.epub', LinkedPDF], ['/epubs/broken.epub', BrokenPDF], ['/epubs/extensionless.epub', ExtensionlessPDF], ['/epubs/suffixless.epub', SuffixlessPDF], ['/epubs/extensionless-markup.epub', ExtensionlessMarkup], ['/epubs/large.pdf', LargePage], ['/epubs/malicious.pdf', MaliciousPDF], ['/epubs/widetext.pdf', WideTextPDF], ['/epubs/multiline.pdf', MultiLinePDF], ['/epubs/atonce-extensionless.epub', ExtensionlessPDF], ['/epubs/atonce-suffixless.epub', SuffixlessPDF], ['/epubs/atonce-markup.epub', ExtensionlessMarkup]]);
// The image ZIP fixtures: they are served as "application/zip", so the reader must classify them by their content, not by their name.
Content.set('/epubs/images.zip', ImageZip);
Content.set('/epubs/atonce-images.zip', ImageZip);
Content.set('/epubs/images-nested.zip', NestedImageZip);
Content.set('/epubs/images-escaped.zip', EscapedNameImageZip);
Content.set('/epubs/images-large.zip', LargeImageZip);
Content.set('/epubs/images-unsupported.zip', UnsupportedImageZip);
Content.set('/epubs/zine.zip', ZineImageZip);
Content.set('/epubs/images-broken.zip', Buffer.from('this is not a ZIP archive at all'));
Content.set('/epubs/images-corrupt.zip', await createCorruptImageZipFixture());
Content.set('/epubs/atonce-images-escaped.zip', EscapedNameImageZip);
Content.set('/epubs/images-<&>.zip', EscapedNameImageZip);
Content.set('/epubs/atonce-images-unsupported.zip', UnsupportedImageZip);
Content.set('/epubs/atonce-images-corrupt.zip', await createCorruptImageZipFixture());
Content.set('/epubs/epub.zip', Reflow);
Content.set('/epubs/atonce-zine.zip', ZineImageZip);
const UnsafeImageName = 'page & " <img src=x onerror=parent.__zipInjected=1>.png';
Content.set('/epubs/images-invalid-name.zip', await createZipFixture([[UnsafeImageName, Buffer.from('not an image')]]));
const Requests = [], Errors = [], Results = [];
const VerticalPDF = createPDFFixture(6, 300, 520, () => [240, 170, 100].flatMap(x =>
    Array.from({ length: 12 }, (_, i) => ({ text: 'A', x, y: 470 - i * 30 }))));
Content.set('/epubs/vertical.pdf', VerticalPDF);
Content.set('/epubs/portrait.pdf', createPDFFixture(6, 300, 520, () => 'A horizontal body line with enough characters to establish direction.'));
Content.set('/epubs/no-text.pdf', createPDFFixture(6, 300, 520, () => []));
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
    if(new URL(Request.url, 'http://localhost').pathname === '/book.pdf') {
        // A cross-origin PDF that requires the credential: only a credentialed request can read it.
        if(!Request.headers.cookie?.includes('book-auth=granted')) { Response.writeHead(403, { 'Access-Control-Allow-Origin': Request.headers.origin || HostOrigin, 'Access-Control-Allow-Credentials': 'true' }); Response.end(); return; }
        sendBook(Request, Response, PDFDocument, true, Requests, 'application/pdf'); return;
    }
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
        if(URLPath === '/epubs/redirect.pdf') {
            Response.writeHead(302, { Location: SignedOrigin + '/book.pdf?signature=fixture' }); Response.end(); return;
        }
        if(Content.has(URLPath)) {
            if(!Request.headers.cookie?.includes('book-auth=granted')) { Response.writeHead(401); Response.end(); return; }
            // A book served without range support is extracted at once: the reader falls back from the range-capable extractor.
            const NoRange = URLPath.startsWith('/epubs/atonce-');
            sendBook(Request, Response, Content.get(URLPath), false, Requests, URLPath.endsWith('.pdf') ? 'application/pdf' : URLPath.endsWith('.zip') ? 'application/zip' : 'application/epub+zip', NoRange); return;
        }
        if(['/vendor/bibi/presets/integration.js', '/alternate/bibi/presets/integration.js'].includes(URLPath)) {
            Response.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' });
            Response.end('Bibi.preset({"extract-if-necessary":[".epub",".zip",""],"resume-from-last-position":"yes","keep-settings":"yes","allow-scripts-in-content":false,"request-with-credentials":false,"accept-pdf":"yes"});'); return;
        }
        if(['/vendor/bibi/presets/credentialed.js'].includes(URLPath)) {
            Response.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' });
            Response.end('Bibi.preset({"extract-if-necessary":[".epub",".zip",""],"resume-from-last-position":"yes","keep-settings":"yes","allow-scripts-in-content":false,"request-with-credentials":true,"accept-pdf":"yes"});'); return;
        }
        if(URLPath === '/vendor/bibi/presets/no-pdf.js') {
            // A preset that forbids PDFs: neither a PDF of the "book" query nor a local PDF may be opened.
            Response.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' });
            Response.end('Bibi.preset({"extract-if-necessary":[".epub",".zip",""],"accept-local-file":"yes","resume-from-last-position":"yes","keep-settings":"yes","allow-scripts-in-content":false,"request-with-credentials":false,"accept-pdf":"no"});'); return;
        }
        const Prefix = ['/vendor/bibi/', '/alternate/bibi/'].find(Prefix => URLPath.startsWith(Prefix));
        if(Prefix) {
            const Relative = URLPath.slice(Prefix.length) || 'index.html';
            const File = path.resolve(Distribution, Relative);
            if(!File.startsWith(Distribution + path.sep)) { Response.writeHead(403); Response.end(); return; }
            const Bytes = await fs.readFile(File);
            const Type = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json' }[path.extname(File)] || 'application/octet-stream';
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
    // A reader that is moving is momentarily inoperable (NOT_READY): the wait must tolerate that.
    const waitForPageIndex = async (Index, Expected) => {
        await Page.waitForFunction(async ({ Index, Expected }) => {
            try { return (await window.readers[Index].api.getPosition()).layout.pageIndex === Expected; }
            catch(Error) { return false; }
        }, { Index, Expected });
    };
    const readerFrame = async Index => {
        const Handle = await Page.evaluateHandle(Index => window.readers[Index].Frame, Index);
        return Handle.asElement().contentFrame();
    };
    // The rasterized image of the page the reader currently shows (not merely the first loaded one).
    const pdfPage = async (Index, Timeout = 10000) => {
        const ReaderFrame = await readerFrame(Index);
        const Deadline = Date.now() + Timeout;
        for(;;) {
            const Found = await ReaderFrame.evaluate(async () => {
                const Page = R.getPage();
                if(!Page || !Page.Item) return null;
                const Doc = Page.Item.contentDocument;
                const Img = Doc && Doc.querySelector('img.bibi-pdf-page');
                if(!Img || !Img.getAttribute('src')) return null;
                if(!Img.complete) await new Promise(Resolve => { Img.addEventListener('load', Resolve, { once: true }); setTimeout(Resolve, 3000); });
                if(!Img.naturalWidth) return null;
                const Bytes = new Uint8Array(await (await fetch(Img.src)).arrayBuffer());
                let Hash = 7;
                for(let i = 0; i < Bytes.length; i++) Hash = (Hash * 31 + Bytes[i]) % 2147483647;
                return { width: Img.naturalWidth, height: Img.naturalHeight, bytes: Bytes.length, hash: Hash, itemIndex: Page.Item.Index };
            });
            if(Found) return Found;
            if(Date.now() > Deadline) return null;
            await new Promise(Resolve => setTimeout(Resolve, 100));
        }
    };
    const pdfPageCount = async Index => {
        const ReaderFrame = await readerFrame(Index);
        return ReaderFrame.evaluate(() => R.Items.filter(Item => Item.PDFRasterized).length);
    };
    const clickInReader = async (Index, Selector) => {
        const ReaderFrame = await readerFrame(Index);
        for(const Frame of ReaderFrame.childFrames()) {
            if(!await Frame.locator(Selector).count()) continue;
            await Frame.locator(Selector).first().click();
            return true;
        }
        return false;
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
    await scenario('percentage-width front matter stays contained and turns in opening order', async () => {
        const PreviousViewport = Page.viewportSize();
        await Page.setViewportSize({ width: 1280, height: 900 });
        Reader = await open({ book: '/epubs/opening.epub', 'book-key': 'opening', 'content-hash': 'opening-1', 'resume-from-last-position': 'no', 'keep-settings': 'no' });
        const Frame = await readerFrame(Reader);
        const assertOpening = async Expected => {
            await Frame.waitForFunction(Expected => Expected.every(Index => R.Current.Pages.some(Page => Page.Item.Index === Index)) && !R.Moving && !R.TwoPaneRelaying, Expected);
            const Geometry = await Frame.evaluate(() => {
                const Main = R.Main.getBoundingClientRect();
                return {
                    viewport: { left: Main.left, top: Main.top, right: Main.right, bottom: Main.bottom },
                    pages: R.Current.Pages.map(Page => Page.Item.Index),
                    pictures: R.Current.Items.flatMap(Item => [...Item.contentDocument.querySelectorAll('img')].map(Image => {
                        const Rect = Image.getBoundingClientRect(), Box = Item.getBoundingClientRect();
                        return { item: Item.Index, left: Box.left + Rect.left * Item.Scale, top: Box.top + Rect.top * Item.Scale, right: Box.left + Rect.right * Item.Scale, bottom: Box.top + Rect.bottom * Item.Scale };
                    }))
                };
            });
            assert.deepEqual(Geometry.pages, Expected, JSON.stringify(Geometry));
            assert.deepEqual(Geometry.pictures.map(Picture => Picture.item), Expected.filter(Index => Index < 6), JSON.stringify(Geometry));
            for(const Picture of Geometry.pictures) assert.ok(Picture.left >= Geometry.viewport.left - 1 && Picture.top >= Geometry.viewport.top - 1 && Picture.right <= Geometry.viewport.right + 1 && Picture.bottom <= Geometry.viewport.bottom + 1, JSON.stringify(Geometry));
        };
        const Openings = [[0], [1], [2], [3], [4, 5], [6, 7], [8]];
        await assertOpening(Openings[0]);
        for(const Expected of Openings.slice(1)) {
            await Page.evaluate(Index => window.readers[Index].move(1), Reader);
            await assertOpening(Expected);
        }
        await textVisible(Reader, 'prose', 0);
        for(const Expected of Openings.slice(0, -1).reverse()) {
            await Page.evaluate(Index => window.readers[Index].move(-1), Reader);
            await assertOpening(Expected);
        }
        for(const ItemIndex of [4, 5]) {
            await restore(Reader, { cfi: `/6/${(ItemIndex + 1) * 2}!/4/2/2` });
            await assertOpening([4, 5]);
        }
        await Page.screenshot({ path: path.join(Temp, 'opening-layout.png') });
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
    await scenario('a standalone PDF opens as a book, one spine item per page', async () => {
        Reader = await open({ book: '/epubs/document.pdf', 'book-key': 'pdf', 'content-hash': 'pdf-1' });
        const State = await Page.evaluate(Index => window.readers[Index].api.getState(), Reader);
        assert.equal(State.status, 'ready');
        const Position = await position(Reader);
        assert.equal(Position.layout.pageIndex, 0);
        assert.equal(Position.layout.pageCount, 40, 'The PDF must produce one page per document page.');
        const First = await pdfPage(Reader);
        assert.ok(First && First.width > 0 && First.height > 0, 'The first PDF page must be rasterized.');
        assert.ok(First.width > First.height, 'The fixture pages are landscape: the rasterized page must keep its orientation.');
        // The pages are rasterized on demand: a document with many pages must not be rasterized all at once.
        const Rasterized = await pdfPageCount(Reader);
        assert.ok(Rasterized < 12, `Only a few pages may be rasterized at once, not the whole document (${Rasterized} of 40).`);
        await Page.evaluate(Index => window.readers[Index].move(1), Reader);
        await waitForPageIndex(Reader, 1);
        const Second = await pdfPage(Reader);
        assert.ok(Second && Second.width > 0, 'The second PDF page must be rasterized.');
        assert.notEqual(Second.hash, First.hash, 'Each PDF page must be its own image.');
        await Page.evaluate(Index => window.readers[Index].move(-1), Reader);
        await waitForPageIndex(Reader, 0);
        const Back = await pdfPage(Reader);
        assert.ok(Back && Back.width > 0, 'A page revisited after being turned down must be rasterized again.');
        assert.equal(Back.hash, First.hash, 'A revisited page must show the same image again.');
        await remove(Reader);
    });
    await scenario('portrait PDF openings share the spine in both detected reading directions', async () => {
        const PreviousViewport = Page.viewportSize();
        await Page.setViewportSize({ width: 1600, height: 900 });
        for(const [Book, Mode, Direction] of [['portrait', 'horizontal', 'ltr'], ['vertical', 'vertical', 'rtl']]) {
            Reader = await open({ book: `/epubs/${Book}.pdf`, 'book-key': `direction-${Book}` });
            const Frame = await readerFrame(Reader);
            const Writing = await Frame.evaluate(async () => ({
                page: await PDF.getPageWritingMode(R.Items[0].Source, 1),
                document: await PDF.getDocumentWritingMode(R.Items[0].Source),
                direction: B.PPD
            }));
            assert.equal(Writing.page.mode, Mode);
            assert.equal(Writing.document.mode, Mode);
            assert.equal(Writing.direction, Direction);
            await Frame.evaluate(() => Bibi.API.restorePosition({ cfi: '/6/4!/4' }));
            await Frame.waitForFunction(() => !R.Moving && Bibi.API.getState().operable &&
                R.Items.slice(1, 3).every(Item => Item.Loaded && Item.PDFRasterized &&
                    Math.abs(Item.Box.offsetWidth / Item.Box.offsetHeight - 300 / 520) < 0.01));
            const Bounds = await Frame.evaluate(() => R.Items.slice(1, 3).map(Item => {
                const Rect = Item.Box.getBoundingClientRect();
                return { left: Rect.left, right: Rect.right };
            }).sort((A, B) => A.left - B.left));
            assert.ok(Math.abs(Bounds[0].right - Bounds[1].left) <= 1, 'Portrait pages must meet at the shared spine.');
            assert.ok(Math.abs((Bounds[0].left + Bounds[1].right) / 2 - 800) <= 1, `The opening must be centered as a whole: ${Book} ${JSON.stringify(Bounds)}`);
            await Page.screenshot({ path: path.join(Temp, `pdf-${Mode}-opening.png`) });
            await remove(Reader);
        }
        await Page.setViewportSize(PreviousViewport);
    });
    await scenario('PDF reading direction can be overridden without losing the page, including unknown documents', async () => {
        const PreviousViewport = Page.viewportSize();
        await Page.setViewportSize({ width: 1600, height: 900 });
        for(const Book of ['vertical', 'portrait', 'no-text']) {
            Reader = await open({ book: `/epubs/${Book}.pdf`, 'book-key': `manual-${Book}` });
            const Frame = await readerFrame(Reader);
            await restore(Reader, { cfi: '/6/4!/4' });
            await Frame.waitForFunction(() => !R.Moving && !R.LayingOut &&
                R.Items.slice(1, 3).every(Item => Item.Loaded && Item.PDFRasterized));
            const Initial = await Frame.evaluate(() => S.PPD);
            for(const Input of ['pointer', 'keyboard']) {
                const Expected = (await Frame.evaluate(() => S.PPD)) == 'rtl' ? 'ltr' : 'rtl';
                const Before = (await position(Reader)).layout.pageIndex;
                await Frame.locator('#bibi-menu .bibi-icon-config').click();
                const Toggle = Frame.locator('#bibi-button-reading-direction');
                await Toggle.waitFor({ state: 'visible' });
                if(Input == 'pointer') {
                    await Page.screenshot({ path: path.join(Temp, `pdf-${Book}-direction-menu.png`) });
                    await Toggle.click();
                } else {
                    await Toggle.focus();
                    await Toggle.press('Enter');
                }
                await Frame.waitForFunction(Direction => S.PPD == Direction && !I.OpenedSubpanel && !R.LayingOut && !O.Busy, Expected);
                assert.equal((await position(Reader)).layout.pageIndex, Before, 'Changing direction must retain the current source page.');
                assert.equal(await Toggle.getAttribute('aria-checked'), String(Expected == 'rtl'));
                const LeftToRight = await Frame.evaluate(() => R.Items[1].Box.getBoundingClientRect().left < R.Items[2].Box.getBoundingClientRect().left);
                assert.equal(LeftToRight, Expected == 'ltr', 'The paired PDF pages must swap physical reading order.');
                await Frame.locator('body').press(Expected == 'rtl' ? 'ArrowLeft' : 'ArrowRight');
                await waitForPageIndex(Reader, 3);
                await Frame.waitForFunction(() => Bibi.API.getState().operable);
                await restore(Reader, { cfi: '/6/4!/4' });
            }
            assert.equal(await Frame.evaluate(() => S.PPD), Initial);
            if(Book == 'no-text') for(const Mode of ['horizontal', 'vertical']) {
                await Frame.locator('#bibi-menu .bibi-icon-config').click();
                await Frame.locator(`.bibi-button:has(.bibi-icon-view-${Mode})`).click();
                await Frame.waitForFunction(Mode => S.RVM == Mode && Bibi.API.getState().operable, Mode);
                await restore(Reader, { cfi: '/6/4!/4' });
                const Before = (await position(Reader)).layout.pageIndex;
                const PreviousDirection = await Frame.evaluate(() => S.PPD);
                await Frame.locator('#bibi-menu .bibi-icon-config').click();
                await Frame.locator('#bibi-button-reading-direction').press('Space');
                await Frame.waitForFunction(Direction => S.PPD != Direction && !I.OpenedSubpanel && Bibi.API.getState().operable, PreviousDirection);
                assert.equal(await Frame.evaluate(() => S.RVM), Mode, 'Direction overrides must not change the chosen scroll mode.');
                assert.equal((await position(Reader)).layout.pageIndex, Before, 'A scrolled PDF must retain its current page.');
            }
            await remove(Reader);
        }
        await Page.setViewportSize(PreviousViewport);
    });
    await scenario('a PDF chosen from a local file opens as a book', async () => {
        const LocalPage = await Browser.newPage({ viewport: { width: 1280, height: 900 } });
        LocalPage.on('pageerror', Error => Errors.push(Error.message));
        try {
            await LocalPage.goto(HostOrigin + '/vendor/bibi/index.html');
            await LocalPage.setInputFiles('#bibi-catcher input', { name: 'local.pdf', mimeType: 'application/pdf', buffer: PDFDocument });
            await LocalPage.waitForFunction(() => { try { return Bibi.API.getState().operable; } catch(Error) { return false; } }, null, { timeout: 60000 });
            const State = await LocalPage.evaluate(() => Bibi.API.getState());
            assert.equal(State.status, 'ready');
            const Position = await LocalPage.evaluate(() => Bibi.API.getPosition());
            assert.equal(Position.layout.pageCount, 40, 'The local PDF must produce one page per document page.');
            const Deadline = Date.now() + 20000;
            let Raster = null;
            for(;;) {
                Raster = await LocalPage.evaluate(async () => {
                    const Page = R.getPage();
                    if(!Page || !Page.Item) return null;
                    const Doc = Page.Item.contentDocument;
                    const Img = Doc && Doc.querySelector('img.bibi-pdf-page');
                    if(!Img || !Img.getAttribute('src')) return null;
                    if(!Img.complete) await new Promise(Resolve => { Img.addEventListener('load', Resolve, { once: true }); setTimeout(Resolve, 3000); });
                    if(!Img.naturalWidth) return null;
                    const Layer = Doc.querySelector('span.bibi-pdf-text-layer');
                    return { width: Img.naturalWidth, height: Img.naturalHeight, text: Layer ? Layer.innerText.trim() : '' };
                });
                if(Raster) break;
                if(Date.now() > Deadline) break;
                await new Promise(Resolve => setTimeout(Resolve, 100));
            }
            assert.ok(Raster && Raster.width > 0, 'The page of the local PDF must be rasterized.');
            assert.equal(Raster.text, 'PDF page 1', 'The text layer of the local PDF page must carry the text of the page.');
            // The file picker covers the book: it must be gone once the book is open.
            const Catcher = await LocalPage.evaluate(() => { const Element = document.querySelector('#bibi-catcher'); return Element ? getComputedStyle(Element).opacity : null; });
            assert.equal(Catcher, '0', 'The file picker must not stay on top of the opened book.');
        } finally { await LocalPage.close(); }
    });
    await scenario('a local file whose name and media type contradict each other is not opened as a PDF', async () => {
        const MismatchPage = await Browser.newPage({ viewport: { width: 1280, height: 900 } });
        MismatchPage.on('pageerror', Error => Errors.push(Error.message));
        try {
            await MismatchPage.goto(HostOrigin + '/vendor/bibi/index.html');
            await MismatchPage.setInputFiles('#bibi-catcher input', { name: 'local.pdf', mimeType: 'text/plain', buffer: PDFDocument });
            await MismatchPage.waitForFunction(() => { try { return Bibi.API.getState().status === 'error'; } catch(Error) { return false; } }, null, { timeout: 60000 });
            const Failure = await MismatchPage.evaluate(() => Bibi.API.getState());
            assert.equal(Failure.error.code, 'LOAD_FAILED');
            assert.equal(Failure.error.message, 'File of this type is unacceptable');
        } finally { await MismatchPage.close(); }
    });
    await scenario('a local PDF is not opened when the preset forbids PDFs', async () => {
        const ForbiddenPage = await Browser.newPage({ viewport: { width: 1280, height: 900 } });
        ForbiddenPage.on('pageerror', Error => Errors.push(Error.message));
        try {
            await ForbiddenPage.goto(HostOrigin + '/vendor/bibi/index.html?preset=no-pdf');
            // The file picker must not offer a PDF when the preset forbids them.
            await ForbiddenPage.waitForSelector('#bibi-catcher input', { state: 'attached' });
            const Accept = await ForbiddenPage.evaluate(() => { const Input = document.querySelector('#bibi-catcher input'); return Input ? Input.getAttribute('accept') : null; });
            assert.ok(Accept && !Accept.includes('application/pdf'), `The file picker must not offer a PDF (${ Accept }).`);
            await ForbiddenPage.setInputFiles('#bibi-catcher input', { name: 'local.pdf', mimeType: 'application/pdf', buffer: PDFDocument });
            await ForbiddenPage.waitForFunction(() => { try { return Bibi.API.getState().status === 'error'; } catch(Error) { return false; } }, null, { timeout: 60000 });
            const Failure = await ForbiddenPage.evaluate(() => Bibi.API.getState());
            assert.equal(Failure.error.code, 'LOAD_FAILED');
            assert.equal(Failure.error.message, 'Failed to open the book (PDF is set to unacceptable)');
        } finally { await ForbiddenPage.close(); }
    });
    await scenario('an EPUB with an embedded PDF shows the PDF pages', async () => {
        for(const Book of ['/epubs/embedded.epub', '/epubs/linked.epub']) {
            Reader = await open({ book: Book, 'book-key': 'embedded', 'content-hash': 'embedded-1' });
            const Anchor = await Page.evaluate(Index => {
                const ReaderFrame = window.readers[Index].Frame.contentWindow;
                const Item = ReaderFrame.R.Items.find(Item => /embedded\.pdf$/.test(Item.AnchorPath));
                return Item ? { index: Item.Index, indexInSpine: Item.IndexInSpine, path: Item.AnchorPath, linear: Item.IsLinearItem } : null;
            }, Reader);
            assert.ok(Anchor, 'The embedded PDF must become spine items.');
            assert.equal(Anchor.linear, true, 'A linear PDF must stay in the reading order.');
            const Pages = await Page.evaluate(Index => window.readers[Index].Frame.contentWindow.R.Items.filter(Item => /embedded\.pdf$/.test(Item.AnchorPath)).length, Reader);
            assert.equal(Pages, 3, 'The embedded PDF must contribute one item per page.');
            // An inline embedded PDF object becomes a link to the PDF's pages (the secure configuration strips the element itself).
            assert.equal(await clickInReader(Reader, 'a.bibi-pdf-embedded'), true, 'The inline PDF object must become a link.');
            const Linked = await pdfPage(Reader);
            assert.ok(Linked && Linked.width > 0, 'The linked PDF page must be rasterized.');
            await restore(Reader, { cfi: `/6/${(Anchor.indexInSpine + 1) * 2}!/4` });
            const Rasterized = await pdfPage(Reader);
            assert.ok(Rasterized && Rasterized.width > 0, 'The embedded PDF page must be rasterized.');
            await remove(Reader);
        }
    });
    await scenario('an EPUB with a PDF resource without an extension shows its pages', async () => {
        for(const Book of ['/epubs/extensionless.epub', '/epubs/suffixless.epub']) {
            Reader = await open({ book: Book, 'book-key': 'extensionless', 'content-hash': 'extensionless-1' });
            const Anchor = await Page.evaluate(Index => {
                const ReaderFrame = window.readers[Index].Frame.contentWindow;
                const Item = ReaderFrame.R.Items.find(Item => /attachment/.test(Item.AnchorPath));
                return Item ? { indexInSpine: Item.IndexInSpine } : null;
            }, Reader);
            assert.ok(Anchor, 'The PDF resource must become spine items.');
            await restore(Reader, { cfi: `/6/${(Anchor.indexInSpine + 1) * 2}!/4` });
            const Rasterized = await pdfPage(Reader);
            assert.ok(Rasterized && Rasterized.width > 0, 'The PDF page must be rasterized.');
            await remove(Reader);
        }
        Reader = await open({ book: '/epubs/extensionless-markup.epub', 'book-key': 'extensionless-markup', 'content-hash': 'extensionless-markup-1' });
        await textVisible(Reader, 'chapter', 0);
        await remove(Reader);
    });
    await scenario('an EPUB extracted at once keeps its ambiguous resources readable', async () => {
        for(const Book of ['/epubs/atonce-extensionless.epub', '/epubs/atonce-suffixless.epub']) {
            Reader = await open({ book: Book, 'book-key': 'atonce', 'content-hash': 'atonce-1' });
            assert.equal(await Page.evaluate(Index => window.readers[Index].Frame.contentWindow.B.ExtractionPolicy, Reader), 'at-once', 'The book must be extracted at once.');
            const Anchor = await Page.evaluate(Index => {
                const ReaderFrame = window.readers[Index].Frame.contentWindow;
                const Item = ReaderFrame.R.Items.find(Item => /attachment/.test(Item.AnchorPath));
                return Item ? { indexInSpine: Item.IndexInSpine } : null;
            }, Reader);
            assert.ok(Anchor, 'The PDF resource must become spine items.');
            await restore(Reader, { cfi: `/6/${(Anchor.indexInSpine + 1) * 2}!/4` });
            const Rasterized = await pdfPage(Reader);
            assert.ok(Rasterized && Rasterized.width > 0, 'The PDF page must be rasterized.');
            await remove(Reader);
        }
        Reader = await open({ book: '/epubs/atonce-markup.epub', 'book-key': 'atonce-markup', 'content-hash': 'atonce-markup-1' });
        assert.equal(await Page.evaluate(Index => window.readers[Index].Frame.contentWindow.B.ExtractionPolicy, Reader), 'at-once', 'The book must be extracted at once.');
        await textVisible(Reader, 'chapter', 0);
        await remove(Reader);
    });
    const ImageViewport = Page.viewportSize();
    await Page.setViewportSize({ width: 900, height: 1200 });
    const visibleImage = async (Frame, Path) => {
        await Frame.waitForFunction(Path => {
            const Item = R.Items.find(Item => Item.Source.Path == Path), Image = Item?.contentDocument?.querySelector('img.bibi-spine-item-image');
            const Bounds = Item?.Box.getBoundingClientRect();
            return Bibi.API.getState().operable && Item?.Loaded && Image?.complete && Image.naturalWidth > 0
                && Bounds.right > 0 && Bounds.left < innerWidth && Bounds.bottom > 0 && Bounds.top < innerHeight;
        }, Path);
        const Image = await Frame.evaluate(Path => {
            const Item = R.Items.find(Item => Item.Source.Path == Path), Image = Item.contentDocument.querySelector('img.bibi-spine-item-image');
            const Bounds = Item.Box.getBoundingClientRect(), Picture = Image.getBoundingClientRect();
            return {
                natural: [Image.naturalWidth, Image.naturalHeight], ratio: Picture.width / Picture.height,
                visible: Bounds.right > 0 && Bounds.left < innerWidth && Bounds.bottom > 0 && Bounds.top < innerHeight,
                xmlError: !!Item.contentDocument.querySelector('parsererror')
            };
        }, Path);
        assert.ok(Image.visible, `The decoded page must be visible: ${Path}`);
        assert.equal(Image.xmlError, false);
        assert.ok(Math.abs(Image.ratio - Image.natural[0] / Image.natural[1]) < 0.01, 'Image aspect ratio must be preserved.');
        return Image;
    };
    await scenario('PNG image ZIPs render and turn in natural order with Range and full downloads', async () => {
        for(const Policy of ['range', 'atonce']) {
            Reader = await open({ book: `/epubs/${Policy == 'range' ? 'images' : 'atonce-images'}.zip`, 'book-key': `image-turns-${Policy}` });
            const Frame = await readerFrame(Reader);
            assert.equal(await Frame.evaluate(() => B.ExtractionPolicy), Policy == 'range' ? 'on-the-fly' : 'at-once');
            assert.deepEqual(await Frame.evaluate(() => R.Items.map(Item => Item.Source.Path)), ImageZipFixturePaths.Flat);
            for(const [Index, Path] of ImageZipFixturePaths.Flat.entries()) {
                if(Index) await Page.evaluate(Index => window.readers[Index].move(1), Reader);
                await waitForPageIndex(Reader, Index);
                assert.deepEqual((await visibleImage(Frame, Path)).natural, ImageZipFixtureSizes[Path]);
            }
            await Page.evaluate(Index => window.readers[Index].move(-1), Reader);
            await waitForPageIndex(Reader, 1);
            await visibleImage(Frame, '2.png');
            await Page.screenshot({ path: path.join(Temp, `image-zip-${Policy}.png`) });
            await remove(Reader);
        }
    });
    await scenario('image ZIP position restore keeps schemaVersion 1 and revision identity', async () => {
        const Identity = { 'book-key': 'image-position', 'content-hash': 'image-revision' };
        Reader = await open({ book: '/epubs/images.zip', ...Identity });
        const State = await Page.evaluate(Index => window.readers[Index].api.getState(), Reader);
        assert.equal(State.schemaVersion, 1);
        assert.equal(State.bookKey, Identity['book-key']);
        assert.equal(State.contentHash, Identity['content-hash']);
        await restore(Reader, { cfi: '/6/4!/4' });
        const Saved = await position(Reader);
        assert.equal(Saved.progressBasis, 'spine-items');
        await restore(Reader, { cfi: '/6/2!/4' });
        assert.equal((await restore(Reader, Saved.location)).position.layout.pageIndex, 1);
        await remove(Reader);
        Reader = await open({ book: '/epubs/images.zip', ...Identity, location: JSON.stringify(Saved.location) });
        assert.equal((await position(Reader)).layout.pageIndex, 1);
        await visibleImage(await readerFrame(Reader), '2.png');
        const Error = await Page.evaluate(async Index => {
            try { await window.readers[Index].api.restorePosition({ cfi: '/6/2!/4' }, { bookKey: 'image-position', contentHash: 'other' }); }
            catch(Error) { return Error.code; }
        }, Reader);
        assert.equal(Error, 'IDENTITY_MISMATCH');
        await remove(Reader);
    });
    await scenario('nested and escaped image names render literally without creating markup', async () => {
        for(const [Book, Paths] of [
            ['images-nested', ImageZipFixturePaths.Nested], ['images-escaped', ImageZipFixturePaths.Escaped],
            ['atonce-images-escaped', ImageZipFixturePaths.Escaped], ['images-%3C%26%3E', ImageZipFixturePaths.Escaped]
        ]) {
            Reader = await open({ book: `/epubs/${Book}.zip`, 'book-key': `names-${Book}` });
            const Frame = await readerFrame(Reader);
            const Actual = await Frame.evaluate(() => R.Items.map(Item => Item.Source.Path));
            assert.deepEqual([...Actual].sort(), [...Paths].sort());
            for(const [Index, Path] of Actual.entries()) {
                await restore(Reader, { cfi: `/6/${(Index + 1) * 2}!/4` });
                await visibleImage(Frame, Path);
            }
            assert.equal(await Frame.evaluate(() => R.Items.some(Item => Item.contentDocument?.querySelector('script'))), false);
            await remove(Reader);
        }
    });
    await scenario('JPEG and WebP entries use the same image book renderer', async () => {
        const Pictures = await Page.evaluate(() => {
            const Canvas = document.createElement('canvas'); Canvas.width = 160; Canvas.height = 240;
            const Context = Canvas.getContext('2d'); Context.fillStyle = '#b42'; Context.fillRect(0, 0, 160, 240);
            return ['image/jpeg', 'image/webp'].map(Type => Canvas.toDataURL(Type).split(',')[1]);
        });
        Content.set('/epubs/formats.zip', await createZipFixture([
            ['1.JPG', Buffer.from(Pictures[0], 'base64')], ['2.webp', Buffer.from(Pictures[1], 'base64')]
        ]));
        Reader = await open({ book: '/epubs/formats.zip', 'book-key': 'image-formats' });
        const Frame = await readerFrame(Reader);
        assert.deepEqual((await visibleImage(Frame, '1.JPG')).natural, [160, 240]);
        await restore(Reader, { cfi: '/6/4!/4' });
        assert.deepEqual((await visibleImage(Frame, '2.webp')).natural, [160, 240]);
        await remove(Reader);
    });
    await scenario('large image ZIPs defer both fetching and decoding even without UI placeholders', async () => {
        const Before = Requests.length;
        Reader = await open({ book: '/epubs/images-large.zip', 'book-key': 'image-large', 'allow-placeholders': 'false' });
        const Frame = await readerFrame(Reader);
        await visibleImage(Frame, '001.png');
        assert.equal(await Frame.evaluate(() => R.Items.length), ImageZipFixturePaths.Large);
        assert.ok(await Frame.evaluate(() => R.Items.filter(Item => Item.Source.URI || Item.Loaded).length) < 10, 'Off-screen images must not all be extracted or decoded.');
        const Range = Requests.slice(Before).filter(Request => Request.url == '/epubs/images-large.zip');
        assert.ok(Range.length > 0);
        assert.ok(Range.every(Request => Request.range), 'Never download the whole archive when Range works.');
        const Bytes = Range.reduce((Total, Request) => {
            const [, Start, End] = /^bytes=(\d*)-(\d*)$/.exec(Request.range);
            return Total + (!Start ? Number(End) : (End ? Number(End) : LargeImageZip.length - 1) - Number(Start) + 1);
        }, 0);
        assert.ok(Bytes < LargeImageZip.length / 2, `Initial requests must cover only part of the ZIP: ${Bytes}/${LargeImageZip.length}`);
        await restore(Reader, { cfi: `/6/${ImageZipFixturePaths.Large * 2}!/4` });
        await visibleImage(Frame, '020.png');
        await remove(Reader);
    });
    await scenario('image ZIP reading direction toggles preserve the current page and view mode', async () => {
        await Page.setViewportSize({ width: 1600, height: 900 });
        Reader = await open({ book: '/epubs/images-large.zip', 'book-key': 'image-direction' });
        const Frame = await readerFrame(Reader), Toggle = Frame.locator('#bibi-button-reading-direction');
        await restore(Reader, { cfi: '/6/4!/4' });
        for(const Mode of ['paged', 'horizontal', 'vertical']) {
            if(await Frame.evaluate(() => S.RVM) != Mode) {
                await Frame.evaluate(Mode => R.changeView({ Mode }), Mode);
                await Frame.waitForFunction(Mode => S.RVM == Mode && Bibi.API.getState().operable, Mode);
            }
            await restore(Reader, { cfi: '/6/4!/4' });
            const Before = (await position(Reader)).layout.pageIndex;
            const Expected = await Frame.evaluate(() => S.PPD == 'rtl' ? 'ltr' : 'rtl');
            await Frame.locator('#bibi-menu .bibi-icon-config').click();
            await Toggle.waitFor({ state: 'visible' });
            if(Mode == 'paged') await Toggle.click(); else await Toggle.press(Mode == 'horizontal' ? 'Enter' : 'Space');
            await Frame.waitForFunction(Direction => S.PPD == Direction && !I.OpenedSubpanel && Bibi.API.getState().operable, Expected);
            assert.equal(await Toggle.getAttribute('aria-checked'), String(Expected == 'rtl'));
            assert.equal(await Frame.evaluate(() => S.RVM), Mode);
            assert.equal((await position(Reader)).layout.pageIndex, Before);
            await visibleImage(Frame, '002.png');
            if(Mode == 'paged') await visibleImage(Frame, '003.png');
            if(Mode == 'paged') {
                await Frame.locator('body').press(Expected == 'rtl' ? 'ArrowLeft' : 'ArrowRight');
                await waitForPageIndex(Reader, 3);
                await visibleImage(Frame, '004.png');
            }
        }
        await remove(Reader);
        await Page.setViewportSize(ImageViewport);
    });
    await scenario('unsupported, malformed and corrupt image ZIPs fail instead of becoming inoperable ready books', async () => {
        for(const Book of ['images-unsupported', 'atonce-images-unsupported', 'images-broken', 'images-corrupt', 'atonce-images-corrupt', 'images-invalid-name']) {
            const Bad = await Page.evaluate(Book => window.openReader({ book: `/epubs/${Book}.zip`, 'book-key': Book }), Book);
            await Page.waitForFunction(Index => window.readers[Index].Frame.contentWindow.Bibi?.API?.getState().status == 'error', Bad);
            const Error = await Page.evaluate(async Index => {
                try { await window.readers[Index].api.ready; } catch(Error) { return { code: Error.code, message: Error.message }; }
            }, Bad);
            assert.equal(Error?.code, 'LOAD_FAILED', Book);
            if(Book.includes('unsupported')) assert.match(Error.message, /Unsupported Book Format/);
            assert.equal((await Page.evaluate(Index => window.readers[Index].api.getState(), Bad)).operable, false);
            if(Book == 'images-invalid-name') {
                const Frame = await readerFrame(Bad);
                assert.ok((await Frame.locator('#bibi-notifier').textContent()).includes(UnsafeImageName));
                assert.equal(await Frame.locator('#bibi-notifier img').count(), 0, 'A filename in an error must remain text, not markup.');
                assert.equal(await Frame.evaluate(() => window.__zipInjected), undefined);
            }
            await remove(Bad);
        }
    });
    await scenario('EPUB and Zine ZIP contents retain their existing readers without explicit format hints', async () => {
        Reader = await open({ book: '/epubs/epub.zip', 'book-key': 'epub-zip' });
        await textVisible(Reader, 'long', 0);
        await remove(Reader);
        for(const Book of ['zine', 'atonce-zine']) {
            Reader = await open({ book: `/epubs/${Book}.zip`, 'book-key': Book });
            await textVisible(Reader, 'zine-page-1', 0);
            await remove(Reader);
        }
    });
    await scenario('a PDF page with several lines keeps its document well-formed', async () => {
        Reader = await open({ book: '/epubs/multiline.pdf', 'book-key': 'multiline', 'content-hash': 'multiline-1' });
        const Raster = await pdfPage(Reader);
        assert.ok(Raster && Raster.width > 0, 'The page must be rasterized.');
        // The text layer of a page with several lines holds a line break element: the item document is XHTML, so it must stay well-formed.
        const Item = await (await readerFrame(Reader)).evaluate(() => {
            const Page = R.getPage();
            const Doc = Page && Page.Item ? Page.Item.contentDocument : null;
            if(!Doc) return null;
            const Layer = Doc.querySelector('span.bibi-pdf-text-layer');
            const Error = Doc.querySelector('parsererror');
            return {
                contentType: Doc.contentType,
                parserError: Error ? Error.textContent.replace(/\s+/g, ' ').trim().slice(0, 120) : null,
                text: Layer ? Layer.textContent.replace(/\s+/g, ' ').trim() : null,
                breaks: Layer ? Layer.querySelectorAll('br').length : 0
            };
        });
        assert.ok(Item, 'The item document must exist.');
        assert.equal(Item.contentType, 'application/xhtml+xml');
        assert.equal(Item.parserError, null, 'The item document must be well-formed XML.');
        assert.ok(Item.breaks > 0, 'The text layer must hold the line breaks of the page.');
        assert.ok(Item.text && Item.text.includes('first line'), 'The text layer must carry the first line of the page.');
        assert.ok(Item.text && Item.text.includes('second line'), 'The text layer must carry the second line of the page.');
        await remove(Reader);
    });
    await scenario('a large-format PDF page is rasterized within the limits', async () => {
        Reader = await open({ book: '/epubs/large.pdf', 'book-key': 'large', 'content-hash': 'large-1' });
        const Rasterized = await pdfPage(Reader);
        assert.ok(Rasterized && Rasterized.width > 0, 'The large page must be rasterized.');
        assert.ok(Rasterized.width <= 4096 && Rasterized.height <= 4096, `The raster must fit the canvas limits (${Rasterized.width}x${Rasterized.height}).`);
        assert.ok(Rasterized.width * Rasterized.height <= 16 * 1024 * 1024, `The raster must fit the pixel budget (${Rasterized.width * Rasterized.height} pixels).`);
        await remove(Reader);
    });
    await scenario('a term is found on a PDF page that has not been rendered yet', async () => {
        Reader = await open({ book: '/epubs/document.pdf', 'book-key': 'search', 'content-hash': 'search-1' });
        const Results = await Page.evaluate(async Index => {
            const ReaderFrame = window.readers[Index].Frame.contentWindow;
            const Search = await ReaderFrame.I.RangeFinder.search(['PDF page 7'], { Focus: false });
            return Search.Results.map(Result => ({ itemIndex: Result.Item.Index, pageNo: Result.PDFPageNo, hasRange: !!Result.Range }));
        }, Reader);
        assert.ok(Results.length >= 1, 'The term must be found in the PDF.');
        assert.equal(Results[0].pageNo, 7, 'The match must be on the page that holds the term.');
        assert.equal(Results[0].hasRange, false, 'A page that has not been rendered has no range yet.');
        const Focused = await Page.evaluate(async Index => {
            const ReaderFrame = window.readers[Index].Frame.contentWindow;
            await ReaderFrame.I.RangeFinder.setSearchResultFocusTo(0);
            return { loaded: ReaderFrame.R.Items[6].Loaded };
        }, Reader);
        assert.equal(Focused.loaded, true, 'The matched page must be rendered.');
        await Page.waitForFunction(async Index => {
            try { return window.readers[Index].Frame.contentWindow.I.PageObserver.Current.Pages.some(Page => Page.Item.Index === 6); }
            catch(Error) { return false; }
        }, Reader, { timeout: 8000 });
        await remove(Reader);
        // The search of a page that has not been rendered must match like the search of a rendered one.
        Reader = await open({ book: '/epubs/document.pdf', 'book-key': 'search-case', 'content-hash': 'search-case-1' });
        const Lower = await Page.evaluate(async Index => {
            const ReaderFrame = window.readers[Index].Frame.contentWindow;
            const Search = await ReaderFrame.I.RangeFinder.search(['pdf page 7'], { Focus: false });
            return Search.Results.map(Result => Result.PDFPageNo);
        }, Reader);
        assert.ok(Lower.includes(7), 'The search must not depend on the case.');
        await remove(Reader);
        Reader = await open({ book: '/epubs/widetext.pdf', 'book-key': 'search-wide', 'content-hash': 'search-wide-1' });
        const Wide = await Page.evaluate(async Index => {
            const ReaderFrame = window.readers[Index].Frame.contentWindow;
            const Search = await ReaderFrame.I.RangeFinder.search(['ＰＤＦ７'], { Focus: false });
            return Search.Results.map(Result => Result.PDFPageNo);
        }, Reader);
        assert.ok(Wide.includes(20), 'The search must not depend on the width of the characters.');
        await remove(Reader);
    });
    await scenario('the text of a PDF is never shown as markup', async () => {
        Reader = await open({ book: '/epubs/malicious.pdf', 'book-key': 'malicious', 'content-hash': 'malicious-1' });
        const Injected = await Page.evaluate(async Index => {
            const ReaderFrame = window.readers[Index].Frame.contentWindow;
            const Search = await ReaderFrame.I.RangeFinder.search(['needle'], { Focus: false });
            await new Promise(Resolve => setTimeout(Resolve, 500));
            return { results: Search.Results.length, flag: ReaderFrame.y, images: ReaderFrame.document.querySelectorAll('img[src="x"]').length };
        }, Reader);
        assert.ok(Injected.results >= 1, 'The term must be found in the PDF.');
        assert.equal(Injected.flag, undefined, 'The text of a PDF must not be executed.');
        assert.equal(Injected.images, 0, 'The text of a PDF must not become an element.');
        await remove(Reader);
    });
    await scenario('an EPUB with an unreadable PDF still opens', async () => {
        Reader = await open({ book: '/epubs/broken.epub', 'book-key': 'broken', 'content-hash': 'broken-1' });
        const State = await Page.evaluate(Index => window.readers[Index].api.getState(), Reader);
        assert.equal(State.status, 'ready', 'A PDF that cannot be read must not keep the book from opening.');
        await textVisible(Reader, 'chapter', 0);
        await remove(Reader);
    });
    await scenario('a cross-origin PDF is fetched with the credential setting applied', async () => {
        const Without = await Page.evaluate(() => window.openReader({ book: '/epubs/redirect.pdf', preset: 'integration', 'book-key': 'pdf-x', 'content-hash': 'pdf-x-1' }));
        const WithoutError = await Page.evaluate(async Index => { try { await window.readers[Index].api.ready; } catch(Error) { return Error.code; } }, Without);
        assert.equal(WithoutError, 'LOAD_FAILED', 'A cross-origin PDF must not be read without the credential.');
        await remove(Without);
        Reader = await open({ book: '/epubs/redirect.pdf', preset: 'credentialed', 'book-key': 'pdf-y', 'content-hash': 'pdf-y-1' });
        const Rasterized = await pdfPage(Reader);
        assert.ok(Rasterized && Rasterized.width > 0, 'The cross-origin PDF page must be rasterized.');
        assert.ok(Requests.some(Request => Request.url.includes('/book.pdf') && Request.cors && Request.cookie), 'The cross-origin PDF must be requested with the credential.');
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
        assert.equal(Requests.filter(Request => Request.cors && Request.url.includes('/book.epub')).some(Request => Request.cookie), false);
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
