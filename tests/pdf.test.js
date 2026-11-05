import assert from 'node:assert/strict';
import { beforeEach, describe, test } from 'bun:test';

const Stub = () => {
    globalThis.ENV_VERSION = 'test';
    globalThis.ENV_DEVELOPMENT = false;
    globalThis.window = globalThis;
    globalThis.document = {
        currentScript: { src: 'http://localhost/bibi/resources/scripts/bibi.js' },
        documentElement: {},
        createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} })
    };
    globalThis.Worker = class extends EventTarget {};
};

Stub();
const { O } = await import('../__src/bibi/resources/scripts/bibi.heart.context.mjs');
await import('../__src/bibi/resources/scripts/bibi.heart.operator.mjs');
const { PDF } = await import('../__src/bibi/resources/scripts/bibi.heart.pdf.mjs');

describe('PDF item types', () => {
    test('a PDF media type is a PDF item', () => {
        assert.equal(O.getItemType('application/pdf'), 'PDF');
    });

    test('the other media types keep their item types', () => {
        assert.equal(O.getItemType('application/xhtml+xml'), 'MarkupDocument');
        assert.equal(O.getItemType('image/svg+xml'), 'SVG');
        assert.equal(O.getItemType('image/png'), 'BitmapImage');
        assert.equal(O.getItemType('application/octet-stream'), '');
        assert.equal(O.getItemType(undefined), '');
    });

    test('a PDF path is recognized by its extension only', () => {
        assert.equal(O.isPDFPath('https://example.com/books/document.pdf'), true);
        assert.equal(O.isPDFPath('https://example.com/books/document.PDF'), true);
        assert.equal(O.isPDFPath('https://example.com/books/document.pdf#page=2'), true);
        assert.equal(O.isPDFPath('https://example.com/books/document.pdf?download=1'), true);
        assert.equal(O.isPDFPath('https://example.com/books/document.epub'), false);
        assert.equal(O.isPDFPath('https://example.com/books/pdf'), false);
        assert.equal(O.isPDFPath(''), false);
        assert.equal(O.isPDFPath(undefined), false);
    });

    test('a resource is binary when its name or its media type says so', () => {
        assert.equal(O.isBin({ Path: 'content/image.png' }), true);
        assert.equal(O.isBin({ Path: 'content/font.woff2' }), true);
        assert.equal(O.isBin({ Path: 'content/document.pdf' }), true);
        assert.equal(O.isBin({ Path: 'content/chapter.xhtml' }), false);
        assert.equal(O.isBin({ Path: 'content/style.css' }), false);
        // An EPUB may name a PDF without an extension: only its media type tells that it is binary.
        assert.equal(O.isBin({ Path: 'content/attachment', 'media-type': 'application/pdf' }), true);
        assert.equal(O.isBin({ Path: 'content/attachment', 'media-type': 'application/xhtml+xml' }), false);
    });

    test('a media type that carries text is recognized', () => {
        assert.equal(O.isTextMediaType('application/xhtml+xml'), true);
        assert.equal(O.isTextMediaType('text/plain'), true);
        assert.equal(O.isTextMediaType('application/oebps-package+xml'), true);
        assert.equal(O.isTextMediaType('image/svg+xml'), true);
        assert.equal(O.isTextMediaType('application/pdf'), false);
        assert.equal(O.isTextMediaType('application/octet-stream'), false);
        assert.equal(O.isTextMediaType(''), false);
        assert.equal(O.isTextMediaType(undefined), false);
    });
});

describe('local PDF classification', () => {
    test('a file whose name says PDF is a PDF', () => {
        assert.equal(O.getPDFType('document.pdf', 'application/pdf'), 'PDF');
        assert.equal(O.getPDFType('document.PDF', 'application/pdf'), 'PDF');
        assert.equal(O.getPDFType('document.pdf', ''), 'PDF');
        assert.equal(O.getPDFType('document.pdf', undefined), 'PDF');
    });

    test('a file whose media type says PDF is a PDF even without an extension', () => {
        assert.equal(O.getPDFType('attachment', 'application/pdf'), 'PDF');
        assert.equal(O.getPDFType('', 'application/pdf'), 'PDF');
    });

    test('a name and a media type that contradict each other are a mismatch', () => {
        assert.equal(O.getPDFType('document.pdf', 'text/plain'), 'mismatch');
    });

    test('a file that is not a PDF is not a PDF', () => {
        assert.equal(O.getPDFType('book.epub', 'application/epub+zip'), '');
        assert.equal(O.getPDFType('book.epub', ''), '');
        assert.equal(O.getPDFType('book.zip', 'application/zip'), '');
        assert.equal(O.getPDFType('', ''), '');
        assert.equal(O.getPDFType(undefined, undefined), '');
    });
});

describe('PDF spine properties', () => {
    test('a generated page property names the page it shows', () => {
        assert.equal(PDF.pageProperty(1), 'rendition:layout-pre-paginated bibi:pdf-page-1');
        assert.equal(PDF.pageOf(PDF.pageProperty(1)), 1);
        assert.equal(PDF.pageOf(PDF.pageProperty(37)), 37);
    });

    test('a page property is read out of a spine property list', () => {
        const Properties = PDF.pageProperty(12).split(' ');
        assert.equal(Properties.length, 2);
        assert.equal(Properties.includes('rendition:layout-pre-paginated'), true);
        assert.equal(PDF.pageOf(Properties.find(Pro => Pro.startsWith('bibi:pdf-page-'))), 12);
    });

    test('a property that is not a PDF page property names no page', () => {
        assert.equal(PDF.pageOf('rendition:layout-pre-paginated'), 0);
        assert.equal(PDF.pageOf('bibi:allow-placeholder'), 0);
        assert.equal(PDF.pageOf(''), 0);
        assert.equal(PDF.pageOf(undefined), 0);
        assert.equal(PDF.pageOf('bibi:pdf-page-'), 0);
        assert.equal(PDF.pageOf('bibi:pdf-page-x'), 0);
    });
});
