// Heart of Bibi — PDF (pdf.js): lazy-loaded parsing and page rasterizing (split from bibi.heart.js; peers via shared context, no cycles)

import { Bibi, O, R } from './bibi.heart.context.mjs';
import { analyzePageWritingMode, analyzeDocumentWritingMode, WritingMode } from './bibi.heart.pdf.writing-mode.mjs';

// pdf.js ships as plain ES modules beside the reader (never bundled into it): it is fetched only when a PDF is actually opened.
// The worker is a module worker; pdf.js falls back to its main-thread "fake worker" when a Worker cannot start.

const PDFjsURL       = () => O.versionedURL(new URL('../pdf/pdf.mjs',        Bibi.Script.src).href);
const PDFjsWorkerURL = () => O.versionedURL(new URL('../pdf/pdf.worker.mjs', Bibi.Script.src).href);
// The resource directories are addressed by prefix: pdf.js appends the file name, so these URLs carry no query.
const PDFjsResourceURL = (Name) => new URL('../pdf/' + Name, Bibi.Script.src).href;

const RasterScale = 2; // device pixels per PDF point: the page is fitted to the stage by a CSS transform, so a little headroom keeps it sharp
const MaxRasterSide = 4096; // a canvas dimension that every browser accepts
const MaxRasterPixels = 16 * 1024 * 1024; // the pixels a single rasterized page may occupy

// The scale of the raster: the headroom over the page size, bounded so that a large-format page cannot exhaust the memory.
// The bound always wins: the rounded size of the raster must fit the limits.
const rasterScale = (Width, Height, Scale = RasterScale) => {
    if(!(Width > 0) || !(Height > 0)) return Scale;
    let Fit = Math.min(Scale, MaxRasterSide / Width, MaxRasterSide / Height, Math.sqrt(MaxRasterPixels / (Width * Height)));
    for(let Guard = 0; Guard < 32; Guard++) {
        const RasterWidth = Math.ceil(Width * Fit), RasterHeight = Math.ceil(Height * Fit);
        if(RasterWidth <= MaxRasterSide && RasterHeight <= MaxRasterSide && RasterWidth * RasterHeight <= MaxRasterPixels) break;
        Fit /= 2;
    }
    return Fit;
};

let PDFjsLib = null, PDFjsLoading = null;

const loadPDFjs = () => {
    if(PDFjsLib) return Promise.resolve(PDFjsLib);
    if(PDFjsLoading) return PDFjsLoading;
    return PDFjsLoading = import(/* webpackIgnore: true */ PDFjsURL()).then(Lib => {
        Lib.GlobalWorkerOptions.workerSrc = PDFjsWorkerURL();
        return PDFjsLib = Lib;
    }).catch(Err => { PDFjsLoading = null; throw Err; });
};

const Documents = new Map(); // Source.Path → { Promise } (one parsed document per file: every page item of a PDF shares it)

const LiveLimit = 24; // rasterized pages kept alive at once (the reader keeps a small window of items turned up)

const Live = new Map(); // Item → object URL of its rasterized page (insertion order: oldest first)
const PageContents = new Map(); // "Source.Path#PageNo" → the text content of that page (the items, the styles and the rotation)
const PageWritingModes = new Map(); // "Source.Path#PageNo" → the writing mode of that page
const DocumentWritingModes = new Map(); // Source.Path → the writing mode of the document

const DocumentSamplePages = 12; // the pages that are looked at when the writing mode of a document is looked for (a document of 400 pages must not be read through)

let TextContents = new WeakMap();
const textContentOf = Page => {
    let Pending = TextContents.get(Page);
    if(!Pending) {
        Pending = Page.getTextContent();
        TextContents.set(Page, Pending);
        Pending.catch(() => { if(TextContents.get(Page) === Pending) TextContents.delete(Page); });
    }
    return Pending;
};
const cached = (Cache, Key, Load) => {
    if(Cache.has(Key)) return Cache.get(Key);
    const Pending = Promise.resolve().then(Load);
    Cache.set(Key, Pending);
    Pending.catch(() => { if(Cache.get(Key) === Pending) Cache.delete(Key); });
    return Pending;
};

const dropLive = (Item, Evicted) => {
    const BlobURL = Live.get(Item);
    if(!BlobURL) return;
    Live.delete(Item);
    URL.revokeObjectURL(BlobURL);
    if(Item.PDFBlobURL == BlobURL) { delete Item.PDFBlobURL; Item.PDFRasterized = false; }
    try { const Img = Item.contentDocument && Item.contentDocument.querySelector('img.bibi-pdf-page'); if(Img) Img.removeAttribute('src'); } catch(Err) {}
    // An evicted item is still "turned up": the reader must be able to turn it up again, or the page would stay blank.
    if(Evicted && Item.Turned == 'Up') { Item.Turned = 'Down', R.PDFEvicted = true; }
};

const evictLive = (Protect) => {
    if(Live.size <= LiveLimit) return;
    for(const Item of [...Live.keys()]) {
        if(Live.size <= LiveLimit) break;
        if(Protect && Protect.has(Item)) continue;
        dropLive(Item, true);
    }
};

export const PDF = {

    Scale: RasterScale,

    // The writing modes a PDF can have: vertical (縦書き), horizontal (横書き), and unknown when the PDF does not tell.
    WritingMode,

    // The spine property that tells which page of a PDF a spine item shows.
    pageProperty: PageNo => `rendition:layout-pre-paginated bibi:pdf-page-${PageNo}`,

    // The page number a spine property stands for (0 when it is not a PDF page property).
    pageOf: Property => {
        const Matched = String(Property || '').match(/^(?:rendition:layout-pre-paginated )?bibi:pdf-page-([\d]+)$/);
        return Matched ? parseInt(Matched[1], 10) : 0;
    },

    // Parses the document behind a manifest source. The file is read once (through a blob URL that every page item shares);
    // every page item of the PDF reuses the parsed document.
    getDocument: (Source) => {
        const Key = Source.Path;
        const Existing = Documents.get(Key);
        if(Existing) return Existing.Pending;
        let Resolve, Reject;
        const Pending = new Promise((o, x) => { Resolve = o, Reject = x; });
        Documents.set(Key, { Pending });
        (async () => {
            try {
                const Lib = await loadPDFjs();
                // The file is read through the reader's own loader, so that the credential and caching settings apply to it.
                const Loaded = await O.file(Source);
                const Content = Loaded.Content;
                const Bytes = Content instanceof Blob ? await Content.arrayBuffer() : Content;
                if(!Bytes || !Bytes.byteLength) throw new Error('The PDF file is empty.');
                Source.Content = ''; // the bytes are handed over to pdf.js
                Resolve(await Lib.getDocument({
                    data: new Uint8Array(Bytes),
                    cMapUrl: PDFjsResourceURL('cmaps/'),           // predefined CMaps (CJK encodings)
                    standardFontDataUrl: PDFjsResourceURL('standard_fonts/'),
                    wasmUrl: PDFjsResourceURL('wasm/'),            // JPEG2000 / JBIG2 / ICC decoders
                    iccUrl: PDFjsResourceURL('iccs/')
                }).promise);
            } catch(Err) { Documents.delete(Key), Reject(Err); }
        })();
        return Pending;
    },

    // The page box in CSS pixels (PDF points) at scale 1: this is the item's viewport.
    getPageSize: async (Doc, PageNo) => {
        const Page = await Doc.getPage(PageNo);
        const Viewport = Page.getViewport({ scale: 1 });
        return { Width: Math.ceil(Viewport.width), Height: Math.ceil(Viewport.height) };
    },

    // Rasterizes one page and hands back an object URL for it (the caller revokes the previous one on re-render).
    // The text layer of the page is returned as well: it is the real text of the page, selectable and searchable.
    renderPage: async (Doc, PageNo, Scale = RasterScale) => {
        const Page = await Doc.getPage(PageNo);
        const PageSize = Page.getViewport({ scale: 1 });
        const Raster = Page.getViewport({ scale: rasterScale(PageSize.width, PageSize.height, Scale) });
        const Canvas = document.createElement('canvas');
        Canvas.width = Math.ceil(Raster.width), Canvas.height = Math.ceil(Raster.height);
        const Context = Canvas.getContext('2d');
        if(!Context) throw new Error('The canvas context is unavailable.');
        await Page.render({ canvasContext: Context, viewport: Raster }).promise;
        const TextLayer = await PDF.renderTextLayer(Page, PageSize);
        Page.cleanup();
        const Blob = await new Promise((o, x) => Canvas.toBlob(B => B ? o(B) : x(new Error('The PDF page could not be rasterized.')), 'image/png'));
        return { URL: URL.createObjectURL(Blob), Width: PageSize.width, Height: PageSize.height, RasterWidth: Canvas.width, RasterHeight: Canvas.height, TextLayer };
    },

    // The text layer of a page: the text of the page as positioned elements (the caller puts them over the picture).
    renderTextLayer: async (Page, PageSize) => {
        if(!PDFjsLib || !PDFjsLib.TextLayer) return null;
        try {
            const Container = document.createElement('div');
            Container.style.setProperty('--total-scale-factor', String(PageSize.scale || 1));
            const TextLayer = new PDFjsLib.TextLayer({ textContentSource: await textContentOf(Page), container: Container, viewport: PageSize });
            await TextLayer.render();
            Container.style.width = PageSize.width + 'px';
            Container.style.height = PageSize.height + 'px';
            // The text layer is put into the item document, which is served as XHTML: a void element has to be closed there.
            // pdf.js writes a line break as a "br" element (with a "role" attribute), which would break the whole document.
            const HTML = Container.innerHTML.replace(/<br(\s[^>]*?)?\s*\/?>/gi, '<br$1/>');
            return { HTML, MinFontSize: Container.style.getPropertyValue('--min-font-size') };
        } catch(Err) {
            return null; // a page without a text layer is still readable
        }
    },

    // The text content of a page: the items of the text, the styles of the fonts and the rotation of the page.
    // Parsing the content of a page is the expensive part of a PDF, so it is kept and shared by everything that needs it.
    getPageContent: (Source, PageNo) => cached(PageContents, Source.Path + '#' + PageNo, async () => {
        const Doc = await PDF.getDocument(Source);
        const Page = await Doc.getPage(PageNo);
        const Content = await textContentOf(Page);
        const Items = Content.items || [];
        return { Items, Styles: Content.styles || {}, Rotation: Page.rotate || 0, Text: Items.map(Item => Item.str || '').join('') };
    }),

    // The plain text of a page: it can be read without rasterizing the page.
    getPageText: async (Source, PageNo) => {
        try { return (await PDF.getPageContent(Source, PageNo)).Text; }
        catch(Err) { return ''; } // An unreadable page must not stop the search of the remaining pages.
    },

    // The writing mode of a page: vertical (縦書き) or horizontal (横書き).
    // The page tells nothing when it has too little text or when the two directions are too close to each other.
    getPageWritingMode: (Source, PageNo, Options = {}) => {
        const Analyze = async () => {
            const Content = await PDF.getPageContent(Source, PageNo);
            return analyzePageWritingMode(Content.Items, Content.Styles, { rotation: Content.Rotation, ...Options });
        };
        return Object.keys(Options).length ? Analyze() : cached(PageWritingModes, Source.Path + '#' + PageNo, Analyze);
    },

    // The pages that are looked at when the writing mode of a document is looked for: a bounded number of them, spread over the document.
    samplePages: (Count, Limit = DocumentSamplePages) => {
        const Sample = Math.max(0, Math.min(Count, Limit));
        const Pages = [];
        for(let I = 0; I < Sample; I++) {
            const PageNo = Sample < 2 ? 1 : 1 + Math.round(I * (Count - 1) / (Sample - 1));
            if(!Pages.includes(PageNo)) Pages.push(PageNo);
        }
        return Pages;
    },

    // The writing mode of the document: a bounded number of pages spread over the document is looked at.
    // The pages are weighted by the number of characters they hold, and a page that could not be decided is left out.
    getDocumentWritingMode: (Source, Options = {}) => {
        const Analyze = async () => {
            const Doc = await PDF.getDocument(Source);
            const Results = [];
            for(const PageNo of PDF.samplePages(Doc.numPages, Options.samplePages || DocumentSamplePages)) {
                Results.push(await PDF.getPageWritingMode(Source, PageNo, Options));
                // Give rendering and input a turn between sampled pages.
                await new Promise(Resolve => setTimeout(Resolve, 0));
            }
            return analyzeDocumentWritingMode(Results, Options);
        };
        return Object.keys(Options).length ? Analyze() : cached(DocumentWritingModes, Source.Path, Analyze);
    },

    // Rasterizes one page for an item and keeps the number of live rasterized pages bounded.
    renderInto: async (Item, Doc, PageNo, Protect = new Set()) => {
        const Rendered = await PDF.renderPage(Doc, PageNo);
        if(Item.PDFBlobURL) URL.revokeObjectURL(Item.PDFBlobURL);
        Item.PDFBlobURL = Rendered.URL;
        Item.PDFRasterized = true;
        Live.delete(Item);
        Live.set(Item, Rendered.URL);
        evictLive(new Set([...Protect, Item]));
        return Rendered;
    },

    // Frees the rasterized page of an item (the item is turned down or discarded).
    release: (Item) => { dropLive(Item); },

    // Forgets every parsed document and every rasterized page: another book is opened, so nothing of the previous one may be reused.
    // (A local PDF is identified by its file name only: two local files of the same name are different documents.)
    reset: () => {
        for(const Item of [...Live.keys()]) dropLive(Item, false);
        Live.clear();
        Documents.clear();
        PageContents.clear();
        PageWritingModes.clear();
        DocumentWritingModes.clear();
        TextContents = new WeakMap();
    },

    // The items whose page is currently rasterized.
    Live

};
