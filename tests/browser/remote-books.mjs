import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createReflowFixture, LongText } from './fixtures.mjs';
import { verifyDistribution } from '../../zzz/distribution.mjs';

const Distribution = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../__dist/bibi');
await verifyDistribution(Distribution);
const Book = await createReflowFixture();
const Requests = [], FolderRequests = [];
let HostOrigin, SourceOrigin, Browser;
const Source = http.createServer((Request, Response) => {
    const Headers = { 'Access-Control-Allow-Origin': Request.headers.origin || HostOrigin, 'Access-Control-Allow-Credentials': 'true', 'Cache-Control': 'no-store' };
    if(Request.method === 'OPTIONS') {
        Response.writeHead(204, { ...Headers, 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Range' }); Response.end(); return;
    }
    if(!Request.headers.cookie?.includes('book-auth=granted')) { Response.writeHead(401, Headers); Response.end(); return; }
    const URLPath = new URL(Request.url, 'http://localhost').pathname;
    Requests.push(URLPath);
    if(URLPath === '/api/read/v1/novels/2/epub') {
        Response.writeHead(503, { ...Headers, 'Content-Type': 'application/json', 'Retry-After': '5' });
        Response.end('{"error":"memory_capacity","retryable":true}'); return;
    }
    if(URLPath !== '/api/read/v1/novels/1/epub') { Response.writeHead(404, Headers); Response.end(); return; }
    // A generated archive ignores Range and has no precomputed Content-Length.
    Response.writeHead(200, { ...Headers, 'Content-Type': 'application/epub+zip' });
    Response.write(Book.subarray(0, 512)); Response.end(Book.subarray(512));
});
const Host = http.createServer(async (Request, Response) => {
    const URLPath = new URL(Request.url, 'http://localhost').pathname;
    if(URLPath === '/login') {
        Response.writeHead(200, { 'Content-Type': 'text/html', 'Set-Cookie': 'book-auth=granted; HttpOnly; SameSite=Lax; Path=/' }); Response.end('<!doctype html>Logged in'); return;
    }
    if(/^\/api\/narou\/novels\/[12]\/epub$/.test(URLPath)) {
        Response.writeHead(302, { Location: SourceOrigin + URLPath.replace('/api/narou/', '/api/read/v1/') }); Response.end(); return;
    }
    if(URLPath.startsWith('/api/narou/')) FolderRequests.push(URLPath);
    if(URLPath === '/vendor/bibi/presets/remote-books.js') {
        Response.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' });
        Response.end('Bibi.preset({"extract-if-necessary":["*"],"request-with-credentials":true,"autostart":"yes","allow-scripts-in-content":false});'); return;
    }
    if(URLPath.startsWith('/vendor/bibi/')) {
        const File = path.resolve(Distribution, URLPath.slice('/vendor/bibi/'.length) || 'index.html');
        if(File.startsWith(Distribution + path.sep)) {
            try {
                const Bytes = await fs.readFile(File);
                const Type = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json' }[path.extname(File)] || 'application/octet-stream';
                Response.writeHead(200, { 'Content-Type': Type, 'Cache-Control': 'no-store' }); Response.end(Bytes); return;
            } catch {}
        }
    }
    Response.writeHead(404); Response.end();
});
const listen = Server => new Promise(Resolve => Server.listen(0, '127.0.0.1', () => Resolve('http://127.0.0.1:' + Server.address().port)));
const close = Server => new Promise(Resolve => { Server.closeAllConnections(); Server.close(Resolve); });
try {
    HostOrigin = await listen(Host); SourceOrigin = await listen(Source);
    Browser = await chromium.launch();
    const Page = await Browser.newPage({ viewport: { width: 1280, height: 900 } });
    await Page.goto(HostOrigin + '/login');
    const open = async ID => {
        const URL = new globalThis.URL('/vendor/bibi/', HostOrigin);
        URL.search = new URLSearchParams({ book: `/api/narou/novels/${ID}/epub`, preset: 'remote-books', autostart: 'yes', 'book-key': `remote:${ID}` });
        await Page.goto(URL.href);
    };
    await open(1);
    await Page.waitForFunction(() => typeof Bibi == 'object' && Bibi.API?.getState().status == 'ready', null, { timeout: 30000 });
    let Text;
    for(const Frame of Page.frames()) {
        if(await Frame.locator('#long').count()) { Text = await Frame.locator('#long').innerText(); break; }
    }
    assert.equal(Text, LongText, 'The generated EPUB must render its actual chapter text.');
    assert.deepEqual(Requests, ['/api/read/v1/novels/1/epub'], 'A non-Range EPUB must be generated and downloaded only once.');
    console.log('PASS credentialed redirect reuses the complete generated EPUB response');

    Requests.length = 0;
    await open(2);
    await Page.waitForFunction(() => typeof Bibi == 'object' && Bibi.API?.getState().status == 'error', null, { timeout: 30000 });
    const Failure = await Page.evaluate(() => Bibi.API.getState());
    assert.equal(Failure.error.code, 'LOAD_FAILED');
    assert.match(Failure.error.message, /503/);
    assert.doesNotMatch(Failure.error.message, /404|Unidentified/);
    assert.deepEqual(Requests, ['/api/read/v1/novels/2/epub']);
    assert.deepEqual(FolderRequests, [], 'An upstream service failure must not be retried as an unpacked folder.');
    console.log('PASS upstream 503 remains a service error without a synthetic folder 404');
} finally {
    await Browser?.close();
    await Promise.all([close(Host), close(Source)]);
}
