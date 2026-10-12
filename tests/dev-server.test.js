import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import CopyPlugin from 'copy-webpack-plugin';
import JSZip from 'jszip';
import { serve } from '../zzz/serve.mjs';

let Root, Development, Base, BookSize;
beforeAll(async () => {
    Root = mkdtempSync(join(tmpdir(), 'bibi-server-'));
    const directory = join(Root, 'dist');
    mkdirSync(directory);
    writeFileSync(join(Root, 'app.js'), 'globalThis.readerDevelopmentFixture = true;');
    const Book = new JSZip();
    Book.file('mimetype', 'application/epub+zip');
    Book.file('META-INF/container.xml', '<container><rootfiles><rootfile full-path="package.opf"/></rootfiles></container>');
    const Bytes = await Book.generateAsync({ type: 'uint8array' });
    BookSize = Bytes.byteLength;
    writeFileSync(join(Root, 'sample.epub'), Bytes);
    writeFileSync(join(directory, 'local.epub'), Bytes);
    writeFileSync(join(directory, '.env'), 'PRIVATE_CONFIGURATION');
    writeFileSync(join(Root, 'secret.txt'), 'OUTSIDE_DIRECTORY_SECRET');
    Development = await serve({
        context: Root,
        mode: 'development',
        entry: { app: './app.js' },
        output: { path: directory, filename: '[name].js' },
        stats: 'none',
        infrastructureLogging: { level: 'error' },
        plugins: [new CopyPlugin({ patterns: [{ from: 'sample.epub', to: 'compiled.epub' }] })]
    }, { port: 0 });
    Base = `http://127.0.0.1:${Development.server.address().port}`;
});
afterAll(async () => {
    if(Development) await Development.close();
    if(Root) rmSync(Root, { recursive: true, force: true });
});

describe('development HTTP server', () => {
    test('rejects foreign hosts and origins without blocking same-origin requests', async () => {
        expect((await fetch(`${Base}/compiled.epub`, { headers: { Host: 'attacker.example' } })).status).toBe(403);
        expect((await fetch(`${Base}/__webpack_hmr`, { headers: { Origin: 'https://attacker.example' } })).status).toBe(403);
        const Response = await fetch(`${Base}/compiled.epub`, { headers: { Origin: Base } });
        expect(Response.status).toBe(200);
        expect(Response.headers.get('cache-control')).toBe('no-store');
        await Response.arrayBuffer();
    });

    test('supports ZIP byte ranges, HEAD, and invalid ranges for compiled and local books', async () => {
        for(const Path of ['/compiled.epub', '/local.epub']) {
            const Partial = await fetch(Base + Path, { headers: { Range: 'bytes=0-3', 'Accept-Encoding': 'identity' } });
            expect(Partial.status).toBe(206);
            expect(Partial.headers.get('content-range')).toBe(`bytes 0-3/${BookSize}`);
            expect([...new Uint8Array(await Partial.arrayBuffer())]).toEqual([80, 75, 3, 4]);
            const Head = await fetch(Base + Path, { method: 'HEAD' });
            expect(Head.status).toBe(200);
            expect(Number(Head.headers.get('content-length'))).toBe(BookSize);
            expect(await Head.text()).toBe('');
            expect((await fetch(Base + Path, { headers: { Range: `bytes=${BookSize}-` } })).status).toBe(416);
        }
    });

    test('does not expose hidden files or escape the served directory', async () => {
        expect((await fetch(`${Base}/.env`)).status).toBe(404);
        const Escape = await fetch(`${Base}/%2e%2e%2fsecret.txt`);
        expect([400, 403, 404]).toContain(Escape.status);
        expect(await Escape.text()).not.toContain('OUTSIDE_DIRECTORY_SECRET');
    });
});
