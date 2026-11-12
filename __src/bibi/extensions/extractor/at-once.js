'use strict';

import JSZip from 'jszip/dist/jszip.min.js';
import { classifyEntries, isExcludedPath, Errors } from '../../resources/scripts/bibi.heart.zip.mjs';

Bibi.x({

    id: 'Extractor_at-once',
    description: 'Utilities for Zipped Books. (Method: at-once)',
    author: 'Satoru Matsushima (@satorumurmur)',
    version: '1.3.0'

})(() => {

    O.loadZippedBookData = (BookData) => new Promise(resolve => {
        if(S['autostart']) return resolve(BookData);
        I.Veil.Cover.Info.replaceChildren(
            sML.create('strong', { textContent: `${ O.Touch ? 'Tap' : 'Click' } to Open` }),
            document.createTextNode(' '),
            sML.create('small', { textContent: B.Path.replace(/.*?([^\/]+)$/, '$1') })
        );
        I.Veil.Cover.classList.add('without-cover-image', 'waiting-for-unzipping');
        I.Veil.Cover.appendChild(I.getBookIcon());
        L.wait().then(() => resolve(BookData));
    })
    .then(load)
    .then(extract);

    const load = (BookData) => ( // resolve(ArrayBuffer)
        typeof BookData == 'string' ? fetch(BookData, { credentials: S['request-with-credentials'] ? 'include' : 'same-origin' }).then(Res => {
            if(Res.ok) return Res.arrayBuffer();
            const Error = new globalThis.Error(`${ Res.status } ${ Res.statusText }`.trim());
            Error.status = Res.status;
            throw Error;
        }).catch(Err => Promise.reject(Err && typeof Err.status == 'number' ? Err : Bibi.ErrorMessages.Unidentified)) :
        BookData.size ? BookData.arrayBuffer().catch(() => Promise.reject(Bibi.ErrorMessages.DataInvalid)) :
        Promise.reject(Bibi.ErrorMessages.DataInvalid)
    ).then(ArrayBuffer => JSZip.loadAsync(ArrayBuffer).catch(Err => Promise.reject(Bibi.ErrorMessages.DataInvalid)));

    const extract = (BookDataArchive) => new Promise((resolve, reject) => {
        if(I.Catcher.Input) I.Catcher.style.opacity = 0;
        // Identify the book before expanding any entries.
        const Names = [];
        for(const FileName in BookDataArchive.files) {
            const File = BookDataArchive.files[FileName];
            if(File.dir) continue;
            if(!File._data || (File.unsafeOriginalName && File.unsafeOriginalName != FileName)) continue;
            Names.push(FileName);
        }
        const Classified = classifyEntries(Names);
        if(!Classified.Type) return reject(Errors.Unsupported);
        B.Type = Classified.Type;
        B.ArchiveRoot = Classified.ArchiveRoot;
        B.ImagePaths = Classified.ImagePaths;
        const Targets = (Classified.Type == 'ImageZIP' ?
            Classified.ImagePaths.map(Path => ({ Name: Classified.ArchiveRoot + Path, Path: Path })) :
            Names.filter(Name => Name.startsWith(Classified.ArchiveRoot) && !isExcludedPath(Name))
                .map(Name => ({ Name, Path: Name.slice(Classified.ArchiveRoot.length) }))
        );
        if(!Targets.length) return reject(Errors.Unsupported);
        const FileCount = { Particular: 0 };
        const FileTypesToBeCounted = {
            'Meta XML':   'xml|opf|ncx',
            'Meta YAML':  'ya?ml',
            'HTML':       'html?|xht(ml?)?',
            'SMIL':       'smil?',
            'PLS':        'pls',
            'CSS':        'css',
            'JavaScript': 'js',
            'JSON':       'json',
            'SVG':        'svg',
            'Bitmap':     'gif|jpe?g|png|webp|avif|bmp',
            'Font':       'woff2?|otf|ttf',
            'Audio':      'aac|m4a|mp3|ogg',
            'Video':      'mp4|m4v|webm|ogv',
            'PDF':        'pdf',
            'Markdown':   'md',
            'PlainText':  'txt'
        };
        O.log(`Extracting Book Data...`, '<g:>');
        const Promises = [];
        // Only a file whose extension says it carries text is decoded as text: every other file is kept as bytes
        // and decoded later, if and when its media type says that it is text.
        const TextExtensionsRE = /\.(xml|opf|ncx|ya?ml|html?|xht(ml?)?|smil|pls|css|js|json|svg|md|txt)$/i;
        Targets.forEach(({ Name, Path }) => {
            const IsBin = O.isBin({ Path: Path }) || !TextExtensionsRE.test(Path);
            Promises.push(
                BookDataArchive.file(Name).async(IsBin ? 'blob' : 'string').then(FileContent => {
                    B.Package.Manifest[Path] = IsBin ?
                        { Path: Path, DataType: 'Blob', Content: FileContent } :
                        { Path: Path, DataType: 'Text', Content: FileContent.trim() };
                    for(const FileType in FileTypesToBeCounted) {
                        if(new RegExp('\\.(' + FileTypesToBeCounted[FileType] + ')$', 'i').test(Path)) {
                            if(!FileCount[FileType]) FileCount[FileType] = 1; else FileCount[FileType]++;
                            FileCount.Particular++;
                            break;
                        }
                    }
                })
            );
        });
        Promise.all(Promises).then(() => {
            const Total = Promises.length;
            for(const FileType in FileTypesToBeCounted) {
                const Count = FileCount[FileType];
                if(Count) O.log(`${ Count } ${ FileType }${ Count > 1 ? 's' : '' }`);
            }
            if(FileCount.Particular < Total) {
                const Count_Others = Total - FileCount.Particular;
                O.log(`${ Count_Others } ${ Count_Others > 1 ? 'Others' : 'Another' }`);
            }
            O.log(`Extracted. (${ Total } File${ Total > 1 ? 's' : '' })`, '</g:>');
            resolve();
        }).catch(reject);
    });

});
