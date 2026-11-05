import assert from 'node:assert/strict';
import { describe, test } from 'bun:test';

const { analyzePageWritingMode, analyzeDocumentWritingMode, WritingMode } =
    await import('../__src/bibi/resources/scripts/bibi.heart.pdf.writing-mode.mjs');

// The reader needs a window to live in: the PDF module is loaded with the same stub as the other tests use.
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
await import('../__src/bibi/resources/scripts/bibi.heart.context.mjs');
await import('../__src/bibi/resources/scripts/bibi.heart.operator.mjs');
const { PDF } = await import('../__src/bibi/resources/scripts/bibi.heart.pdf.mjs');

// A text-content item of pdf.js: the transform is the matrix of the text, the origin of the glyph is its last two numbers.
const item = (str, x, y, size = 10, fontName = 'F1', extra = {}) => ({
    str, dir: 'ltr', width: str.length * size * 0.5, height: size,
    transform: [size, 0, 0, size, x, y], fontName, hasEOL: false, ...extra
});

// The same, but with a baseline that is turned by 90 degrees: the text runs downwards.
const turnedItem = (str, x, y, size = 10, fontName = 'F1', extra = {}) => ({
    str, dir: 'ltr', width: size, height: 0, vertical: true,
    transform: [0, size, -size, 0, x, y], fontName, hasEOL: false, ...extra
});

const styles = (Vertical = false) => ({ F1: { fontFamily: 'Test', ascent: 0.88, descent: -0.12, vertical: Vertical } });

// A page of horizontal text: every line is one item, as a PDF that writes a line at once does.
const horizontalPage = (Lines, Size = 12, X = 100, Top = 700, Leading = 20) =>
    Lines.map((Line, Index) => item(Line, X, Top - Index * Leading, Size));

// A page of vertical text: every glyph is placed by itself, as a PDF that stacks the glyphs of a column does.
const verticalPage = (Columns, Size = 12, Right = 500, Top = 700, Leading = 14, ColumnGap = 30) => {
    const Items = [];
    Columns.forEach((Column, ColumnIndex) => {
        [...Column].forEach((Char, Index) => {
            Items.push(item(Char, Right - ColumnIndex * ColumnGap, Top - Index * Leading, Size));
        });
    });
    return Items;
};

describe('the writing mode of a page', () => {

    test('ordinary horizontal text is horizontal', () => {
        const Items = horizontalPage([
            'The quick brown fox jumps over the lazy dog.',
            'Pack my box with five dozen liquor jugs.',
            'How vexingly quick daft zebras jump!',
            'Sphinx of black quartz, judge my vow.'
        ]);
        const Result = analyzePageWritingMode(Items, styles(false));
        assert.equal(Result.mode, WritingMode.Horizontal);
        assert.ok(Result.confidence > 0, 'The result must be confident.');
        assert.ok(Result.evidence.horizontalScore > Result.evidence.verticalScore, 'The horizontal score must win.');
        assert.equal(typeof Result.evidence.analyzedCharacters, 'number');
    });

    test('a font that says it is vertical is a strong sign', () => {
        const Items = verticalPage(['あいうえおかきくけこ', 'さしすせそたちつてと']);
        const Result = analyzePageWritingMode(Items, styles(true));
        assert.equal(Result.mode, WritingMode.Vertical);
        assert.ok(Result.evidence.verticalScore > Result.evidence.horizontalScore, 'The vertical score must win.');
    });

    test('glyphs that are stacked by hand are vertical as well', () => {
        // No font says anything about the direction: the columns tell it.
        const Items = verticalPage(['あいうえおかきくけこ', 'さしすせそたちつてと']);
        const Result = analyzePageWritingMode(Items, styles(false));
        assert.equal(Result.mode, WritingMode.Vertical);
    });

    test('a glyph that is turned by 90 degrees is vertical', () => {
        const Items = [...'あいうえお'.split(''), ...'かきくけこ'.split('')]
            .map((Char, Index) => turnedItem(Char, 500 - Math.floor(Index / 5) * 30, 700 - (Index % 5) * 14, 12));
        const Result = analyzePageWritingMode(Items, styles(false));
        assert.equal(Result.mode, WritingMode.Vertical);
    });

    test('a page number does not turn a vertical page into a horizontal one', () => {
        const Items = [...verticalPage(['あいうえおかきくけこさしすせそ']), item('12', 300, 100, 12, 'F2')];
        const Result = analyzePageWritingMode(Items, { F1: styles(true).F1, F2: styles(false).F2 });
        assert.equal(Result.mode, WritingMode.Vertical);
    });

    test('ruby does not turn a vertical page into a horizontal one', () => {
        const Items = [...verticalPage(['あいうえおかきくけこさしすせそ'])];
        // The ruby is smaller and stands beside the column.
        ['あ', 'い', 'う', 'え'].forEach((Char, Index) => {
            Items.push(item(Char, 512, 700 - Index * 14 - 4, 5, 'F2'));
        });
        const Result = analyzePageWritingMode(Items, { F1: styles(true).F1, F2: styles(false).F2 });
        assert.equal(Result.mode, WritingMode.Vertical);
    });

    test('a page without any text tells nothing', () => {
        const Result = analyzePageWritingMode([], styles(false));
        assert.equal(Result.mode, WritingMode.Unknown);
        assert.equal(Result.confidence, 0);
        assert.equal(Result.evidence.analyzedCharacters, 0);
    });

    test('a page with very few characters tells nothing', () => {
        const Items = verticalPage(['あいう']);
        const Result = analyzePageWritingMode(Items, styles(true));
        assert.equal(Result.mode, WritingMode.Unknown);
        assert.equal(Result.confidence, 0);
    });

    test('a rotated page is looked at in the orientation in which it is shown', () => {
        // The page is written sideways and shown turned by 90 degrees: the column stands upright on the screen.
        const Display = verticalPage(['あいうえおかきくけこ']);
        const Items = Display.map(Item => {
            const T = Item.transform;
            const [X, Y] = [-T[5], T[4]]; // the content of the page, turned the other way round
            return { ...Item, transform: [T[0], T[1], T[2], T[3], X, Y] };
        });
        const Turned = analyzePageWritingMode(Items, styles(true), { rotation: 90 });
        assert.equal(Turned.mode, WritingMode.Vertical);
        // Without the rotation the same page is a row of text.
        const Straight = analyzePageWritingMode(Items, styles(true));
        assert.equal(Straight.mode, WritingMode.Horizontal);
    });

    test('horizontal text in more than one column is horizontal', () => {
        const Items = [
            ...horizontalPage(['The quick brown fox jumps over the lazy dog.', 'Pack my box with five dozen liquor jugs.'], 12, 100, 700),
            ...horizontalPage(['How vexingly quick daft zebras jump!', 'Sphinx of black quartz, judge my vow.'], 12, 320, 700)
        ];
        const Result = analyzePageWritingMode(Items, styles(false));
        assert.equal(Result.mode, WritingMode.Horizontal);
    });

    test('a column that is written in one item is vertical as well', () => {
        // A PDF with a vertical font writes a whole column at once: the characters of the column are not placed one by one.
        const Items = [0, 1, 2].map(Index => ({
            str: 'あいうえおかきくけこさしすせそ', dir: 'ltr', width: 12, height: 0, vertical: true,
            transform: [12, 0, 0, 12, 500 - Index * 26, 700], fontName: 'F1', hasEOL: false
        }));
        const Result = analyzePageWritingMode(Items, styles(true));
        assert.equal(Result.mode, WritingMode.Vertical);
    });

    test('a font that says it is vertical does not decide a horizontal page', () => {
        const Items = [
            item('The quick brown fox jumps over the lazy dog.', 100, 700, 12),
            item('Pack my box with five dozen liquor jugs.', 100, 680, 12)
        ];
        const Result = analyzePageWritingMode(Items, styles(true));
        assert.equal(Result.mode, WritingMode.Horizontal);
    });

    test('balanced mixed text stays unknown while a substantial majority wins', () => {
        const Vertical = verticalPage(['あいうえおかきくけこ', 'さしすせそたちつてと']);
        const Horizontal = horizontalPage(['abcdefghijklmnopqrst'], 12, 700, 700);
        assert.equal(analyzePageWritingMode([...Vertical, ...Horizontal], styles()).mode, WritingMode.Unknown);
        assert.equal(analyzePageWritingMode([...verticalPage(['あいうえおかきくけこ'.repeat(4)]), ...Horizontal], styles()).mode, WritingMode.Vertical);
    });

    test('pdf.js vertical runs use height as their advance', () => {
        const Items = [500, 470, 440].map(x => item('あいうえおかきくけこ', x, 700, 12, 'F1',
            { dir: 'ttb', width: 12, height: 120 }));
        assert.equal(analyzePageWritingMode(Items, styles(true)).mode, WritingMode.Vertical);
    });
    test('the thresholds are adjustable', () => {
        const Items = verticalPage(['あいうえお']);
        assert.equal(analyzePageWritingMode(Items, styles(true)).mode, WritingMode.Unknown);
        assert.equal(analyzePageWritingMode(Items, styles(true), { minCharacters: 3, minAlignedCharacters: 3 }).mode, WritingMode.Vertical);
    });

});

describe('the writing mode of a document', () => {

    const page = (mode, chars) => ({
        mode, confidence: 0.8,
        evidence: { verticalScore: mode == WritingMode.Vertical ? 0.8 : 0.1, horizontalScore: mode == WritingMode.Horizontal ? 0.8 : 0.1, analyzedCharacters: chars }
    });

    test('the pages of one direction make the direction of the document', () => {
        const Result = analyzeDocumentWritingMode([
            page(WritingMode.Vertical, 300), page(WritingMode.Vertical, 280), page(WritingMode.Vertical, 320)
        ]);
        assert.equal(Result.mode, WritingMode.Vertical);
        assert.ok(Result.confidence > 0, 'The result must be confident.');
    });

    test('a few pages of another direction do not turn the document around', () => {
        const Result = analyzeDocumentWritingMode([
            page(WritingMode.Vertical, 300), page(WritingMode.Vertical, 280),
            page(WritingMode.Horizontal, 20), page(WritingMode.Horizontal, 10)
        ]);
        assert.equal(Result.mode, WritingMode.Vertical);
    });

    test('the dominant direction wins when the pages are mixed', () => {
        const Result = analyzeDocumentWritingMode([
            page(WritingMode.Vertical, 300), page(WritingMode.Vertical, 280), page(WritingMode.Vertical, 260),
            page(WritingMode.Horizontal, 90)
        ]);
        assert.equal(Result.mode, WritingMode.Vertical);
    });

    test('a page that could not be decided is never counted as horizontal', () => {
        const Result = analyzeDocumentWritingMode([
            page(WritingMode.Vertical, 300), page(WritingMode.Vertical, 280),
            { mode: WritingMode.Unknown, confidence: 0, evidence: { verticalScore: 0, horizontalScore: 0, analyzedCharacters: 500 } }
        ]);
        assert.equal(Result.mode, WritingMode.Vertical);
    });

    test('a document without a decided page tells nothing', () => {
        const Result = analyzeDocumentWritingMode([
            { mode: WritingMode.Unknown, confidence: 0, evidence: { verticalScore: 0, horizontalScore: 0, analyzedCharacters: 0 } }
        ]);
        assert.equal(Result.mode, WritingMode.Unknown);
        assert.equal(Result.confidence, 0);
    });

    test('a document whose pages do not agree tells nothing', () => {
        const Result = analyzeDocumentWritingMode([
            page(WritingMode.Vertical, 300), page(WritingMode.Horizontal, 300)
        ]);
        assert.equal(Result.mode, WritingMode.Unknown);
    });

});

describe('the writing mode of a PDF', () => {

    // A PDF whose pages are read by a stub: the pages of pdf.js are not needed to know how the module behaves.
    const stubbed = (Pages) => {
        const Calls = { Text: 0 };
        const Original = PDF.getDocument;
        PDF.getDocument = async () => ({
            numPages: Object.keys(Pages).length,
            getPage: async (PageNo) => {
                const Page = Pages[PageNo];
                return {
                    rotate: Page.rotate || 0,
                    getTextContent: async () => { Calls.Text++; return { items: Page.items || [], styles: Page.styles || {} }; },
                    cleanup: () => {}
                };
            }
        });
        PDF.reset();
        return { Calls, Restore: () => { PDF.getDocument = Original; PDF.reset(); } };
    };

    const verticalItems = (Text) => [...Text].map((Char, Index) => item(Char, 500, 700 - Index * 14, 12));

    test('the writing mode of a page of a PDF', async () => {
        const Stubbed = stubbed({ 1: { items: verticalItems('あいうえおかきくけこ'), styles: styles(true) } });
        try {
            const Result = await PDF.getPageWritingMode({ Path: 'vertical.pdf' }, 1);
            assert.equal(Result.mode, WritingMode.Vertical);
            assert.ok(Result.evidence.analyzedCharacters > 0, 'The page must tell how much text it looked at.');
        } finally { Stubbed.Restore(); }
    });

    test('the text of a page and its writing mode share one reading of the page', async () => {
        const Stubbed = stubbed({ 1: { items: verticalItems('あいうえおかきくけこ'), styles: styles(true) } });
        try {
            const Source = { Path: 'shared.pdf' };
            const [Text, Writing] = await Promise.all([PDF.getPageText(Source, 1), PDF.getPageWritingMode(Source, 1)]);
            assert.equal(Text, 'あいうえおかきくけこ');
            assert.equal(Writing.mode, WritingMode.Vertical);
            assert.equal(Stubbed.Calls.Text, 1, 'Concurrent search and direction analysis must extract the page once.');
            await PDF.getDocumentWritingMode(Source);
            assert.equal(Stubbed.Calls.Text, 1, 'Document analysis must reuse the extracted content.');
        } finally { Stubbed.Restore(); }
    });
    test('a failed extraction does not poison search or the cached direction', async () => {
        const Original = PDF.getDocument;
        let Attempts = 0;
        PDF.reset();
        PDF.getDocument = async () => ({
            getPage: async () => ({
                rotate: 0,
                getTextContent: async () => {
                    if(++Attempts === 1) throw new Error('Unreadable content');
                    return { items: verticalItems('あいうえおかきくけこ'), styles: styles(true) };
                }
            })
        });
        try {
            const Source = { Path: 'retry.pdf' };
            assert.equal(await PDF.getPageText(Source, 1), '');
            assert.equal((await PDF.getPageWritingMode(Source, 1)).mode, WritingMode.Vertical);
            assert.equal(await PDF.getPageText(Source, 1), 'あいうえおかきくけこ');
        } finally { PDF.getDocument = Original; PDF.reset(); }
    });

    test('the writing mode of a document is looked for in a few pages', async () => {
        const Pages = {};
        for(let No = 1; No <= 40; No++) Pages[No] = { items: verticalItems('あいうえおかきくけこ'), styles: styles(true) };
        Pages[7] = { items: [], styles: {} }; // a page with a picture on it
        const Stubbed = stubbed(Pages);
        try {
            const Result = await PDF.getDocumentWritingMode({ Path: 'document.pdf' });
            assert.equal(Result.mode, WritingMode.Vertical);
            assert.ok(Stubbed.Calls.Text <= 12, 'The document must not be read through.');
        } finally { Stubbed.Restore(); }
    });

    test('the writing mode of a document is kept', async () => {
        const Stubbed = stubbed({ 1: { items: verticalItems('あいうえおかきくけこ'), styles: styles(true) } });
        try {
            const Source = { Path: 'cached.pdf' };
            const First = await PDF.getDocumentWritingMode(Source);
            const Second = await PDF.getDocumentWritingMode(Source);
            assert.equal(First, Second, 'The result must be the same object.');
            assert.equal(Stubbed.Calls.Text, 1, 'The document must be read only once.');
        } finally { Stubbed.Restore(); }
    });

});
