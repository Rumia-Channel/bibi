// ZIP listings are shared by the Range and full-download extractors; classification reads no entry bodies.
export const Errors = Object.freeze({ Unsupported: 'Unsupported Book Format' });

export const isExcludedPath = Path => /(^|\/)\.|(^|\/)__MACOSX(\/|$)|(^|\/)(Thumbs\.db|desktop\.ini)$|\.(db|php|p[lm]|cgi|r[bu])(\/|$)|^mimetype$/i.test(Path)
    || /^(\/|[a-z][a-z\d+.-]*:)|[\\\x00-\x1F\x7F]/i.test(Path);

const naturalCompare = (A, B) => {
    const AA = A.match(/\d+|\D+/g), BB = B.match(/\d+|\D+/g);
    for(let i = 0; i < Math.max(AA.length, BB.length); i++) {
        const a = AA[i], b = BB[i];
        if(a === undefined) return -1;
        if(b === undefined) return 1;
        if(a === b) continue;
        if(/^\d/.test(a) && /^\d/.test(b)) {
            // Compare digit strings without Number's precision/overflow limits.
            const na = a.replace(/^0+/, '') || '0', nb = b.replace(/^0+/, '') || '0';
            if(na.length != nb.length) return na.length - nb.length;
            if(na != nb) return na < nb ? -1 : 1;
            if(a.length != b.length) return a.length - b.length;
        } else return a < b ? -1 : 1;
    }
    return 0;
};

export const classifyEntries = EntryNames => {
    const Names = [...new Set(EntryNames)].filter(Name => typeof Name == 'string' && Name && !Name.endsWith('/') && !isExcludedPath(Name));
    // Metadata wins even when malformed: a broken EPUB/Zine must not silently become an image book.
    for(const [Type, Metadata] of [['EPUB', 'META-INF/container.xml'], ['Zine', 'zine.yaml']]) {
        const Roots = Names.filter(Name => Name == Metadata || Name.endsWith('/' + Metadata))
            .map(Name => Name.slice(0, -Metadata.length))
            .sort((A, B) => A.length - B.length || (A < B ? -1 : A > B ? 1 : 0));
        if(Roots.length) return { Type, ArchiveRoot: Roots[0], ImagePaths: [] };
    }
    const ImagePaths = Names.filter(Name => /\.(png|jpe?g|gif|webp|avif|bmp)$/i.test(Name)).sort(naturalCompare);
    return { Type: ImagePaths.length ? 'ImageZIP' : '', ArchiveRoot: '', ImagePaths };
};
