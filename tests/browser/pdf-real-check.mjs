import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

// Supply local files as command-line arguments. Never store private paths, titles or extracted text in this file.
const Files = process.argv.slice(2);
if(!Files.length) {
    console.log('Usage: node tests/browser/pdf-real-check.mjs <PDF file> [PDF file ...]');
    process.exit(0);
}
const Distribution = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../__dist/bibi');
const Books = await Promise.all(Files.map(File => fs.readFile(File)));
const Server = http.createServer(async (Request, Response) => {
    try {
        const URLPath = decodeURIComponent(new URL(Request.url, 'http://localhost').pathname);
        const Match = URLPath.match(/^\/pdfs\/(\d+)\.pdf$/);
        if(Match) {
            const Bytes = Books[Number(Match[1])];
            if(!Bytes) { Response.writeHead(404).end(); return; }
            Response.writeHead(200, { 'Content-Type': 'application/pdf' }).end(Bytes);
            return;
        }
        const File = path.resolve(Distribution, URLPath.replace(/^\/bibi\//, ''));
        if(!File.startsWith(Distribution + path.sep)) { Response.writeHead(403).end(); return; }
        const Bytes = await fs.readFile(File);
        const Type = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css' }[path.extname(File)] || 'application/octet-stream';
        Response.writeHead(200, { 'Content-Type': Type }).end(Bytes);
    } catch { Response.writeHead(404).end(); }
});
await new Promise(Resolve => Server.listen(0, '127.0.0.1', Resolve));
let Browser;
try {
    Browser = await chromium.launch();
    const Page = await Browser.newPage({ viewport: { width: 1600, height: 900 } });
    for(let Index = 0; Index < Books.length; Index++) {
        await Page.goto(`http://127.0.0.1:${Server.address().port}/bibi/index.html?book=/pdfs/${Index}.pdf`);
        await Page.waitForFunction(() => window.Bibi?.API?.getState().operable, null, { timeout: 180000 });
        const Result = await Page.evaluate(async () => ({
            pages: R.Items.length,
            page: await PDF.getPageWritingMode(R.Items[0].Source, 1),
            document: await PDF.getDocumentWritingMode(R.Items[0].Source),
            direction: B.PPD,
            rasterized: R.Items.filter(Item => Item.PDFRasterized).length
        }));
        console.log(JSON.stringify({ index: Index, ...Result }));
    }
} finally {
    if(Browser) await Browser.close();
    await new Promise(Resolve => Server.close(Resolve));
}
