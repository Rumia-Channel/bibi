/*! ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
 *
 *  # BrowserSync Config for Bibi                                                                                                                                           (℠)
 *
*/ ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// CommonJS is required here because browser-sync's CLI loads this file with require(),
// which cannot consume an ES module graph (and would only see its `default` wrapper).
// Keep DIST in sync with 'zzz....config.mjs'.

'use strict';

const DIST = '__dist';

module.exports = {
    port: 61671,
    ui: {
        port: 61672
    },
    server: {
        baseDir: DIST,
        index: 'index.html'
    },
    startPath: 'bibi/?book=',
    ignore: [
        DIST + '/bibi-bookshelf/**'
    ],
    watch: true,
    notify: false,
    ghostMode: {
        clicks: false,
        forms: false,
        location: false,
        scroll: false
    }
};
