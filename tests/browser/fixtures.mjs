import JSZip from 'jszip';

export const LongText = '読書位置は画面のページ番号ではなく本文の文字に結び付ける。'.repeat(500);
export const TailText = '終端への移動だけで読了にはしない。'.repeat(80);
const DateOfFixture = new Date('2000-01-01T00:00:00Z');
const xhtml = (Title, Body, Vertical) => `<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ja"><head><title>${Title}</title><style>body{font-family:"Noto Serif CJK JP","MS Mincho",serif;${Vertical ? 'writing-mode:vertical-rl;' : ''}} h1{font-size:1.2em} p{margin:0} img{max-width:100%}</style></head><body>${Body}</body></html>`;
export const createReflowFixture = async (Vertical = false, IllustrationFlow = false) => {
    const Zip = new JSZip(), add = (Name, Content, Extra = {}) => Zip.file(Name, Content, { date: DateOfFixture, ...Extra });
    add('mimetype', 'application/epub+zip', { compression: 'STORE' });
    add('META-INF/container.xml', '<?xml version="1.0"?><container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0"><rootfiles><rootfile full-path="content/package.opf" media-type="application/oebps-package+xml"/></rootfiles></container>');
    add('content/package.opf', `<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="id">fixture-shared-bibliographic-id</dc:identifier><dc:title>位置 API 回帰確認</dc:title><dc:language>ja</dc:language><meta property="dcterms:modified">2000-01-01T00:00:00Z</meta></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="long" href="long.xhtml" media-type="application/xhtml+xml"/><item id="picture" href="picture.xhtml" media-type="application/xhtml+xml"/><item id="tail" href="tail.xhtml" media-type="application/xhtml+xml"/><item id="art" href="art.svg" media-type="image/svg+xml"/></manifest><spine page-progression-direction="${Vertical ? 'rtl' : 'ltr'}"><itemref idref="long"/><itemref idref="picture"/><itemref idref="tail"/></spine></package>`);
    add('content/nav.xhtml', '<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>目次</title></head><body><nav epub:type="toc"><ol><li><a href="long.xhtml#long">長い段落</a></li><li><a href="picture.xhtml">挿絵</a></li><li><a href="tail.xhtml#tail">最後の章</a></li></ol></nav></body></html>');
    // Orthogonal preceding prose cannot donate its trailing pane to this vertical illustration; the flow fixture has one eligible following recipient.
    add('content/long.xhtml', xhtml('長い段落', `<main><h1>長い段落</h1><p id="long">${LongText}</p></main><script>window.parent.__epubScriptExecuted=true;</script>`, Vertical && !IllustrationFlow));
    add('content/picture.xhtml', xhtml('挿絵', '<div><img src="art.svg" width="400" height="800" alt="縦長の挿絵"/></div>', Vertical));
    add('content/tail.xhtml', xhtml('最後の章', IllustrationFlow ? `<p id="tail">${TailText.repeat(12)}</p>` : `<main><h1>最後の章</h1><p id="tail">${TailText}</p></main>`, Vertical));
    add('content/art.svg', '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="800" viewBox="0 0 400 800"><rect width="400" height="800" fill="#dddddd"/><path d="M20 20L380 780M380 20L20 780" stroke="#444444" stroke-width="8"/><text x="85" y="400" font-size="30">Portrait</text></svg>');
    return Zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } });
};

export const createLazyFixture = async () => {
    const Zip = await JSZip.loadAsync(await createReflowFixture());
    let Package = await Zip.file('content/package.opf').async('string'), Items = '', Spine = '';
    for(let Index = 3; Index < 20; Index++) {
        const Id = 'lazy' + Index;
        Items += `<item id="${Id}" href="${Id}.xhtml" media-type="application/xhtml+xml"/>`;
        Spine += `<itemref idref="${Id}"/>`;
        Zip.file(`content/${Id}.xhtml`, xhtml(Id, `<main><h1>${Id}</h1><p id="${Id}">${TailText}</p></main>`, false), { date: DateOfFixture });
    }
    Package = Package.replace('</manifest>', Items + '</manifest>').replace('</spine>', Spine + '</spine>');
    Zip.file('content/package.opf', Package, { date: DateOfFixture });
    return Zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } });
};

export const createOpeningFixture = async () => {
    const Zip = new JSZip(), add = (Name, Content) => Zip.file(Name, Content, { date: DateOfFixture });
    const Pictures = [
        ['cover', 800, 1200], ['frontispiece', 1353, 1920],
        ['landscape1', 1920, 1388], ['landscape2', 1920, 1378],
        ['portrait1', 1000, 1200], ['portrait2', 1000, 1300]
    ];
    const Chapters = [...Pictures.map(([Id]) => Id), 'notice', 'prologue', 'prose'];
    add('mimetype', 'application/epub+zip');
    add('META-INF/container.xml', '<?xml version="1.0"?><container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0"><rootfiles><rootfile full-path="content/package.opf" media-type="application/oebps-package+xml"/></rootfiles></container>');
    add('content/package.opf', `<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="id">opening-layout-fixture</dc:identifier><dc:title>口絵の順送り</dc:title><dc:language>ja</dc:language><meta name="primary-writing-mode" content="vertical-rl"/><meta property="dcterms:modified">2000-01-01T00:00:00Z</meta></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>${Chapters.map(Id => `<item id="${Id}" href="${Id}.xhtml" media-type="application/xhtml+xml"/>`).join('')}${Pictures.map(([Id]) => `<item id="${Id}-art" href="${Id}.svg" media-type="image/svg+xml"/>`).join('')}</manifest><spine page-progression-direction="rtl">${Chapters.map(Id => `<itemref idref="${Id}"/>`).join('')}</spine></package>`);
    add('content/nav.xhtml', '<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>目次</title></head><body><nav epub:type="toc"><ol><li><a href="prose.xhtml#prose">本文</a></li></ol></nav></body></html>');
    Pictures.forEach(([Id, Width, Height]) => {
        add(`content/${Id}.xhtml`, `<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${Id}</title><style>body{text-align:center}.page{font-size:0.125em;height:100%;width:100%}img{width:100%}</style></head><body><div class="page"><img src="${Id}.svg" alt="${Id}"/></div></body></html>`);
        add(`content/${Id}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" width="${Width}" height="${Height}" viewBox="0 0 ${Width} ${Height}"><rect x="4" y="4" width="${Width - 8}" height="${Height - 8}" fill="#dddddd" stroke="#444444" stroke-width="8"/><text x="40" y="100" font-size="60">${Id}</text></svg>`);
    });
    add('content/notice.xhtml', xhtml('注意書き', '<p id="notice">本電子書籍は縦書きでレイアウトされています。</p>', true));
    add('content/prologue.xhtml', xhtml('プロローグ', '<p id="prologue">長い夢を見ていた気がする。</p>', true));
    add('content/prose.xhtml', xhtml('本文', `<p id="prose">${LongText}</p>`, true));
    return Zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } });
};

// A minimal but valid PDF: one page per entry, each page carrying its own text so the pages are distinguishable.
const PDFString = Text => String(Text).replace(/([\\()])/g, '\\$1');
// A text with characters outside Latin-1 is written as a UTF-16BE hexadecimal string.
const PDFText = Text => /[^\x00-\x7F]/.test(Text) ? '<' + 'FEFF' + Buffer.from(Text, 'utf16le').toString('hex').toUpperCase().replace(/(..)(..)/g, (Pair, Low, High) => High + Low) + '>' : '(' + PDFString(Text) + ')';
export const createPDFFixture = (PageCount = 3, PageWidth = 300, PageHeight = 200, TextOfPage) => {
    const Encoder = new TextEncoder(), Chunks = [];
    let Length = 0;
    const Push = Text => { const Bytes = Encoder.encode(Text); Chunks.push(Bytes); Length += Bytes.length; };
    const Offsets = [];
    const Obj = (Num, Body) => { Offsets[Num] = Length; Push(`${Num} 0 obj\n${Body}\nendobj\n`); };
    const PageNum = Index => 4 + Index * 2, ContentNum = Index => 5 + Index * 2;
    Push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    const Kids = [];
    for(let Index = 0; Index < PageCount; Index++) Kids.push(`${PageNum(Index)} 0 R`);
    Obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    Obj(2, `<< /Type /Pages /Kids [${Kids.join(' ')}] /Count ${PageCount} >>`);
    Obj(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    for(let Index = 0; Index < PageCount; Index++) {
        const Texts = TextOfPage ? [TextOfPage(Index + 1)].flat() : [`PDF page ${Index + 1}`];
        const Stream = 'BT /F1 28 Tf ' + Texts.map((Text, i) => typeof Text == 'object'
            ? `1 0 0 1 ${Text.x} ${Text.y} Tm ${PDFText(Text.text)} Tj`
            : `20 ${Math.floor(PageHeight / 2) - 30 * i} Td ${PDFText(Text)} Tj`).join(' ') + ' ET';
        Obj(PageNum(Index), `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PageWidth} ${PageHeight}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${ContentNum(Index)} 0 R >>`);
        Obj(ContentNum(Index), `<< /Length ${Stream.length} >>\nstream\n${Stream}\nendstream`);
    }
    const MaxObj = ContentNum(PageCount - 1), XRefOffset = Length;
    let XRef = `xref\n0 ${MaxObj + 1}\n0000000000 65535 f \n`;
    for(let Num = 1; Num <= MaxObj; Num++) XRef += `${String(Offsets[Num]).padStart(10, '0')} 00000 n \n`;
    Push(XRef);
    Push(`trailer\n<< /Size ${MaxObj + 1} /Root 1 0 R >>\nstartxref\n${XRefOffset}\n%%EOF\n`);
    const Bytes = new Uint8Array(Length);
    let Offset = 0;
    for(const Chunk of Chunks) { Bytes.set(Chunk, Offset); Offset += Chunk.length; }
    return Buffer.from(Bytes);
};

// An EPUB that carries a PDF: "InSpine" puts the PDF into the spine, otherwise it is only linked from the content.
export const createPDFEmbeddedFixture = async (InSpine = true, PDFPageCount = 3) => {
    const Zip = new JSZip(), add = (Name, Content, Extra = {}) => Zip.file(Name, Content, { date: DateOfFixture, ...Extra });
    add('mimetype', 'application/epub+zip', { compression: 'STORE' });
    add('META-INF/container.xml', '<?xml version="1.0"?><container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0"><rootfiles><rootfile full-path="content/package.opf" media-type="application/oebps-package+xml"/></rootfiles></container>');
    add('content/package.opf', `<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="id">pdf-embedded-fixture</dc:identifier><dc:title>添付 PDF 確認</dc:title><dc:language>ja</dc:language><meta property="dcterms:modified">2000-01-01T00:00:00Z</meta></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="chapter" href="chapter.xhtml" media-type="application/xhtml+xml"/><item id="embedded" href="embedded.pdf" media-type="application/pdf"/></manifest><spine>${InSpine ? '<itemref idref="chapter"/><itemref idref="embedded"/>' : '<itemref idref="chapter"/>'}</spine></package>`);
    add('content/nav.xhtml', '<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>目次</title></head><body><nav epub:type="toc"><ol><li><a href="chapter.xhtml#chapter">章</a></li></ol></nav></body></html>');
    add('content/chapter.xhtml', xhtml('章', '<p id="chapter">この章から添付の PDF へ移動できます。</p><p><a id="to-pdf" href="embedded.pdf">添付の PDF</a></p><p><object id="inline-pdf" data="embedded.pdf" type="application/pdf">埋め込み PDF</object></p>', false));
    add('content/embedded.pdf', createPDFFixture(PDFPageCount), { binary: true });
    return Zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } });
};

// An EPUB that carries a PDF which cannot be read: the book must still open.
export const createPDFBrokenFixture = async () => {
    const Zip = new JSZip(), add = (Name, Content, Extra = {}) => Zip.file(Name, Content, { date: DateOfFixture, ...Extra });
    add('mimetype', 'application/epub+zip', { compression: 'STORE' });
    add('META-INF/container.xml', '<?xml version="1.0"?><container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0"><rootfiles><rootfile full-path="content/package.opf" media-type="application/oebps-package+xml"/></rootfiles></container>');
    add('content/package.opf', '<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="id">pdf-broken-fixture</dc:identifier><dc:title>壊れた PDF 確認</dc:title><dc:language>ja</dc:language><meta property="dcterms:modified">2000-01-01T00:00:00Z</meta></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="chapter" href="chapter.xhtml" media-type="application/xhtml+xml"/><item id="broken" href="broken.pdf" media-type="application/pdf"/></manifest><spine><itemref idref="chapter"/></spine></package>');
    add('content/nav.xhtml', '<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>目次</title></head><body><nav epub:type="toc"><ol><li><a href="chapter.xhtml#chapter">章</a></li></ol></nav></body></html>');
    add('content/chapter.xhtml', xhtml('章', '<p id="chapter">壊れた PDF があっても本は開けます。</p>', false));
    add('content/broken.pdf', Buffer.from('%PDF-1.4\nthis is not a readable pdf\n%%EOF\n'), { binary: true });
    return Zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } });
};

// An EPUB whose PDF resource has no file extension: its declared media type is the only hint that it is binary.
export const createPDFExtensionlessFixture = async (PDFPageCount = 3, AttachmentName = 'attachment') => {
    const Zip = new JSZip(), add = (Name, Content, Extra = {}) => Zip.file(Name, Content, { date: DateOfFixture, ...Extra });
    add('mimetype', 'application/epub+zip', { compression: 'STORE' });
    add('META-INF/container.xml', '<?xml version="1.0"?><container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0"><rootfiles><rootfile full-path="content/package.opf" media-type="application/oebps-package+xml"/></rootfiles></container>');
    add('content/package.opf', `<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="id">pdf-extensionless-fixture</dc:identifier><dc:title>拡張子なし PDF 確認</dc:title><dc:language>ja</dc:language><meta property="dcterms:modified">2000-01-01T00:00:00Z</meta></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="chapter" href="chapter.xhtml" media-type="application/xhtml+xml"/><item id="attachment" href="${ AttachmentName }" media-type="application/pdf"/></manifest><spine><itemref idref="chapter"/><itemref idref="attachment"/></spine></package>`);
    add('content/nav.xhtml', '<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>目次</title></head><body><nav epub:type="toc"><ol><li><a href="chapter.xhtml#chapter">章</a></li></ol></nav></body></html>');
    add('content/chapter.xhtml', xhtml('章', '<p id="chapter">拡張子のない添付ファイルです。</p>', false));
    add('content/' + AttachmentName, createPDFFixture(PDFPageCount), { binary: true });
    return Zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } });
};

// An EPUB whose XHTML item has no file extension: only its media type says that it is text.
export const createExtensionlessMarkupFixture = async () => {
    const Zip = new JSZip(), add = (Name, Content, Extra = {}) => Zip.file(Name, Content, { date: DateOfFixture, ...Extra });
    add('mimetype', 'application/epub+zip', { compression: 'STORE' });
    add('META-INF/container.xml', '<?xml version="1.0"?><container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0"><rootfiles><rootfile full-path="content/package.opf" media-type="application/oebps-package+xml"/></rootfiles></container>');
    add('content/package.opf', '<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="id">extensionless-markup-fixture</dc:identifier><dc:title>拡張子なし XHTML 確認</dc:title><dc:language>ja</dc:language><meta property="dcterms:modified">2000-01-01T00:00:00Z</meta></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="chapter" href="chapter" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="chapter"/></spine></package>');
    add('content/nav.xhtml', '<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>目次</title></head><body><nav epub:type="toc"><ol><li><a href="chapter#chapter">章</a></li></ol></nav></body></html>');
    add('content/chapter', xhtml('章', '<p id="chapter">拡張子のない XHTML を含む本です。</p>', false));
    return Zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } });
};
