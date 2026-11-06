'use strict';

import BibiZipLoader from './on-the-fly.bibi-zip-loader.js';
import { classifyEntries, Errors } from '../../resources/scripts/bibi.heart.zip.mjs';
const WorkerURL = new URL('./on-the-fly.worker.js', document.currentScript.src);

Bibi.x({

    id: 'Extractor_on-the-fly',
    description: 'Utilities for Zipped Books. (Method: on-the-fly)',
    author: 'Satoru Matsushima (@satorumurmur)',
    version: '1.4.0'

})(() => {
    WorkerURL.searchParams.set('credentials', S['request-with-credentials'] ? 'include' : 'same-origin');
    O.RangeLoader = new BibiZipLoader({ url: S['book'], worker: WorkerURL.href });

    // Read only metadata here; image bodies stay deferred to ordinary spine loading.
    O.openZippedBook = () => O.RangeLoader.getEntryNames().then(EntryNames => {
        const Classified = classifyEntries(EntryNames);
        if(!Classified.Type) return Promise.reject(Errors.Unsupported);
        const PreviousRoot = B.ArchiveRoot;
        B.ArchiveRoot = Classified.ArchiveRoot;
        const Metadata = (
            Classified.Type == 'EPUB' ? O.extract(B.Container.Source) :
            Classified.Type == 'Zine'  ? O.extract(B.ZineData.Source)  :
            Promise.resolve()
        );
        return Metadata.then(() => {
            B.Type = Classified.Type;
            B.ImagePaths = Classified.ImagePaths;
        }).catch(Err => {
            B.ArchiveRoot = PreviousRoot;
            return Promise.reject(Err);
        });
    });
});
