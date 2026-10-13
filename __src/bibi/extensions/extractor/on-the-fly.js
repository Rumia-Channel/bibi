'use strict';

import BibiZipLoader from './on-the-fly.bibi-zip-loader.js';
const WorkerURL = new URL('./on-the-fly.worker.js', document.currentScript.src);

Bibi.x({

    id: 'Extractor_on-the-fly',
    description: 'Utilities for Zipped Books. (Method: on-the-fly)',
    author: 'Satoru Matsushima (@satorumurmur)',
    version: '1.3.0'

})(() => {
    WorkerURL.searchParams.set('credentials', S['request-with-credentials'] ? 'include' : 'same-origin');
    O.RangeLoader = new BibiZipLoader({ url: S['book'], worker: WorkerURL.href });
});
