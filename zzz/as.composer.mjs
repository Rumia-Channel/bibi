/*! ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
 *
 *  # zzZ..., as the composer.                                                                                                                                                              (℠)
 *
 */ ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import zzZ from 'zzz';  export default zzZ;

const { PACKAGE, WEBSITE_ADDRESS, LICENSE_ADDRESS, SRC, SRC_BC, DIST, ARCHIVES, ARCHIVES_TMP, ARCHIVES_TMP_DIST, LOG_CHARM, LOG_HEADER, ARGUMENTS, ENVARS, Composer, Conductor } = zzZ;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Composer.ConfigName   = ARGUMENTS['config-name'] || 'development';
Composer.ConfigTags   = Composer.ConfigName.split('@');
Composer.IsDeveloping = Composer.ConfigTags[0] === 'development';
Composer.IsArchiving  = Composer.ConfigTags[0] === 'archive';
Composer.WBCK         = Composer.ConfigTags[1] === 'wbck';

const Dresses = await (async () => {
    const Orders = (await import('../' + SRC + '/bibi/wardrobe/_dresses.mjs'))?.default || {};
    const check = (Ds) => Array.isArray(Ds) ? Ds.filter(D => typeof D == 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_\-]*$/.test(D)) : [];
    const  ReadyMades = check(Orders[ 'ready-made']);
    const CustomMades = check(Orders['custom-made']).filter(D => !ReadyMades.includes(D));
    return { 'ready-made': ReadyMades, 'custom-made': CustomMades };
})();

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const FileBranches = [];

FileBranches.push(
    { Method: 'Process', Paths: {
        'bibi': {
            'and':
                'jo.js',
            'extensions': [
                { 'extractor': [
                    'at-once.js',
                    'on-the-fly.js'
                ] },
                'lamp.js',
                'sanitizer.js',
                'zine.js'
            ],
            'resources': {
                'scripts': [
                    'bibi.js',
                    'bibi.wand.js',
                    'bibi.x.debv.js'
                ],
                'styles':
                    'bibi.scss'
            },
            'wardrobe': Dresses['custom-made'].map(DressName => (
                { [DressName]:
                    'bibi.dress.scss'
                }
            ))
        }
    } },
    { Method: 'Pack', Paths: {
        'bibi': {
            'and':
                'jo.scss',
            'resources': {
                'scripts':
                    'bibi.book.scss'
            }
        }
    } },
    { Method: 'Reflect', Paths: {
        'bibi':
            '*.html'
    } },
    { Method: 'Copy', Paths: {
        'bibi': [
            'extensions/extractor/on-the-fly.bibi-zip-loader.worker.*',
            'presets/**'
        ]
    } },
    { Method: 'Copy', Origin: '.', Graft: 'bibi/info', Paths : [
        'LICENSE',
        'README.md'
    ] }
);

if(!Composer.IsArchiving) FileBranches.push(
    { Method: 'Process', Paths: {
        'bibi-demo': {
            'embedding':
                'index.scss'
        }
    } },
    { Method: 'Reflect', Paths: {
        'bibi-demo':
            '**/*.html'
    } },
    { Method: 'Copy', Paths: {
        'bibi-bookshelf':
            '__samples/**/*.epub'
    } }
);

if(Composer.WBCK) FileBranches.push(
    { Method: 'Process', Origin: SRC_BC, Paths:
        'bib/i.js'
    },
    { Method: 'Reflect', Origin: SRC_BC, Paths: [
        'bib/i/*.html',
        'README.BackCompatKit.md'
    ] }
);

// -----------------------------------------------------------------------------------------------------------------------------

const TerserIgnore = [
    /^bibi\/presets\//
];

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const Banners = {};

const BibiC = { [`© ${ PACKAGE.author.name }`]: WEBSITE_ADDRESS, 'Open source under the MIT License': LICENSE_ADDRESS };

// -----------------------------------------------------------------------------------------------------------------------------

Object.assign(Banners, {

    [`bibi/resources/scripts/bibi.js`]: {
        'Bibi | EPUB Reader on your website.': BibiC, sM: true,
        'Including': {
            'sML.js': { '© Satoru Matsushima': 'https://github.com/satorumurmur/sML', 'Licensed under the MIT License': 'https://github.com/satorumurmur/sML/blob/master/LICENSE' }
        }
    },

    [`bibi/and/jo.js`]: {
        'Jo | Helper for Embedding Bibi-Frames in Webpage.': BibiC, sM: true
    },

    [`bib/i.js`]: {
        'bib/i.js (BCK)': BibiC, sM: true,
        'Calling': [
            `Jo | Helper for Embedding Bibi-Frames in Webpage. - bibi/and/jo.js`
        ]
    },

});

// -----------------------------------------------------------------------------------------------------------------------------

Object.assign(Banners, {

    [`bibi/resources/scripts/bibi.x.debv.js`]: {
        'Bibi Extension: Debugging & Development': BibiC, sM: true
    },

});

// -----------------------------------------------------------------------------------------------------------------------------

Object.assign(Banners, {

    [`bibi/extensions/extractor/on-the-fly.js`]: {
        'Bibi Extension: Extractor (on the fly)': BibiC, sM: true,
        'Depends on': {
            'Bibi Zip Loader': { '© Lunascape': 'https://github.com/lunascape/bibi-zip-loader', 'Licensed under the MIT License': 'https://github.com/lunascape/bibi-zip-loader/blob/master/LICENSE' }
        }
    },

    [`bibi/extensions/extractor/at-once.js`]: {
        'Bibi Extension: Extractor (at once)': BibiC, sM: true,
        'Depends on': {
            'JSZip':      { '© Stuart Knightley': 'https://stuk.github.io/jszip',       'Dual licensed under the MIT License or the GPLv3': 'https://github.com/Stuk/jszip/blob/master/LICENSE.markdown'       },
            'JSZipUtils': { '© Stuart Knightley': 'https://stuk.github.io/jszip-utils', 'Dual licensed under the MIT License or the GPLv3': 'https://github.com/Stuk/jszip-utils/blob/master/LICENSE.markdown' }
        }
    },

    [`bibi/extensions/lamp.js`]: {
        'Bibi Extension: Lamp': BibiC, sM: true,
        'Depends on': {
            'NoSleep.js': { '© Rich Tibbett': 'https://github.com/richtr/NoSleep.js', 'Licensed under the MIT License': 'https://github.com/richtr/NoSleep.js/blob/master/LICENSE' }
        }
    },

    [`bibi/extensions/sanitizer.js`]: {
        'Bibi Extension: Sanitizer': BibiC, sM: true,
        'Depends on': {
            'DOMPurify': { '© Mario Heiderich': 'https://github.com/cure53/DOMPurify', 'Dual licensed under the Apache License Version 2.0 or the Mozilla Public License Version 2.0': 'https://github.com/cure53/DOMPurify/blob/master/LICENSE' }
        }
    },

    [`bibi/extensions/zine.js`]: {
        'Bibi Extension: Zine': BibiC, sM: true,
        'Depends on': {
            'JS-YAML': { '© Vitaly Puzrin': 'https://nodeca.github.io/js-yaml', 'Licensed under the MIT License': 'https://github.com/nodeca/js-yaml/blob/master/LICENSE' }
        }
    },

});

// -----------------------------------------------------------------------------------------------------------------------------

Object.assign(Banners, {

    [`bibi/resources/styles/bibi.css`]: {
        'Bibi Style': BibiC, sM: true,
        'Including': {
            'Material Icons': { '© Material Design Authors & Google Inc.': 'https://material.io/resources/icons', 'Licensed under the Apache License version 2.0': 'https://www.apache.org/licenses/LICENSE-2.0' }
        }
    }

});

// -----------------------------------------------------------------------------------------------------------------------------

Dresses['custom-made'].forEach(DressName => Object.assign(Banners, {

    [`bibi/wardrobe/${ DressName }/bibi.dress.css`]: {
        [`Bibi Dress: "${ DressName }"`]: DressName === 'everyday' ? BibiC : `© The Creator(s) of This Dress`, sM: true,
        'Based on': {
            'The Bibi Dress Design System': { [`© ${ PACKAGE.author.name }`]: WEBSITE_ADDRESS, 'Licensed under the MIT License': LICENSE_ADDRESS }
        }
    }

}));

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const arrayFilePaths = (Branch, BranchSteps = []) => {
    if(Branch) switch(typeof Branch) {
        case 'string': return [BranchSteps.concat(Branch).filter(Boolean).join('/')];
        case 'object': return ( Array.isArray(Branch) ?                Branch .map(              ChildBranch   => arrayFilePaths(ChildBranch, BranchSteps                   ))
                                                      : Object.entries(Branch).map(([BranchStep, ChildBranch]) => arrayFilePaths(ChildBranch, BranchSteps.concat(BranchStep))) ).flat(Infinity);
    }
    return [];
};

const
AA = `/*! ` + '/'.repeat(188),
ZZ = ` * `  + '/'.repeat(189) + '\n' + ` */`,
LH = ` *`,
__ = '  ';

const
    fLine = (L   ) => LH + (L ? __ + L : ''),
fMainName = (N, M) => (N = `# ` + N) + (!M ? '' : ' '.repeat(Math.max(0, (AA.length - 1) - (LH + __ + N + (M = __ + `(℠)`)).length)) + M),
// fMainName = (N, M) => (N = `# ` + N) + (() => { if(!M) return ''; M = __ + `(℠)`; while((LH + __ + N + M).length < AA.length - 1) M = ' ' + M; return M; })(),
fCopyItem = (I   ) =>      ``   + I,
fXtraName = (N   ) =>      `+ ` + N + `:`,
fXtraItem = (I   ) => __ + `- ` + I,
     fKV1 = (K, V) =>      K + (V ? ' : ' + arraynize(V, fKV2).join(' / ') : ''),
     fKV2 = (K, V) =>      K + (V ? ' - ' + V : ''),
arraynize = (X, fn, Op) => {
    if(Array.isArray(X)) return X;
    if(typeof X !== 'object') return [X];
    if(Op?.AlignKeys) {
        const Length = Math.max(...Object.keys(X).map(K => K.length));
        for(let [K, V] of Object.entries(X)) {
            delete X[K];
            if(K.length < Length) Op.AlignKeys === 'R' ? (K = K.padStart(Length, ' ')) : (K += ' '.repeat(Length - K.length));
            X[K] = V;
        }
    }
    return Object.entries(X).map(([K, V]) => fn(K, V));
}

// =============================================================================================================================

Object.assign(Composer, {
    FileTree: FileBranches.reduce((FileTree, { Method, Origin, Graft, Paths }) => {
        if(Method === 'Reflect' && Composer.IsDeveloping) Method = 'Copy';
        if(!Origin) Origin = SRC;
        arrayFilePaths(Paths).forEach(FilePath => FilePath && FileTree[Method].push({ Origin, Graft, FilePath }));
        return FileTree;
    }, { Process: [], Pack: [], Reflect: [], Copy: [] }),
    TerserIgnore,
    BannerTree: Object.entries(Banners).reduce((BannerTree, [FilePath, Banner]) => {
        let Lines = [];
        Object.entries(Banner).forEach(([Key, Value]) => {
            if(Key === 'sM') return;
            if(!Lines.length) {
                let MainName = Key, CopyItems = Value;
                Lines.push(fMainName(MainName, Banner.sM));
                if(CopyItems) Lines.push('', ...arraynize(CopyItems, fKV2).map(fCopyItem));
            } else {
                let XtraName = Key, XtraItems = Value;
                Lines.push('', fXtraName(XtraName), ...arraynize(XtraItems, fKV1, { AlignKeys: 'L' }).map(fXtraItem));
            }
        });
        Lines = [AA, ...['', ...Lines, ''].map(fLine), ZZ];
        if(/\.css$/.test(FilePath)) Lines.unshift(`@charset "utf-8";`);
        BannerTree[FilePath] = Lines.join('\n'); // console.log('\n' + BannerTree[FilePath] + '\n');
        return BannerTree;
    }, {})
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
