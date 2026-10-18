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
