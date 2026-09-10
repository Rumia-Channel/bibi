// Heart of Bibi — Bibi lifecycle/settings (split from bibi.heart.js; peers via shared context, no cycles)

import { Bibi, O, L, R, I, P, U, D, S, E, M, X } from './bibi.heart.context.mjs';
import { B } from './bibi.heart.book.mjs';
import { W } from './bibi.heart.wand.mjs';

Bibi.SettingTypes = {
    'boolean': [
        'allow-placeholders',
        'background-spreading',
        'indicate-orthogonal-arrows-if-necessary',
        'prioritise-fallbacks',
        'prioritise-viewer-operation-over-text-selection',
        'uiless'
    ],
    'yes-no': [
        'autostart',
        'autostart-embedded',
        'fix-nav-ttb',
        'fix-reader-view-mode',
        'flip-pages-during-sliding',
        'full-breadth-layout-in-scroll',
        'start-embedded-in-new-window',
        'use-arrows',
        'use-axis-switcher-ui',
        'use-bookmark-ui',
        'use-flowdirection-setter',
        'use-fontsize-setter',
        'use-full-height',
        'use-history-ui',
        'use-keys',
        'use-linespacing-setter',
        'use-loupe-ui',
        'use-menubar',
        'use-nombre',
        'use-popup-footnotes',
        'use-search-ui',
        'use-slider',
        'use-textsetter-ui',
        'zoom-out-for-utilities'
    ],
    'string': [
        'book',
        'book-background-color',
        'cache',
        'default-page-progression-direction',
        'on-doubletap',
        'on-doubletap-with-altkey',
        'on-singletap-with-altkey',
        'on-tripletap',
        'on-tripletap-with-altkey',
        'pagination-method',
        'reader-view-mode'
    ],
    'integer': [
        'item-padding-bottom',
        'item-padding-left',
        'item-padding-right',
        'item-padding-top',
        'content-margin'
    ],
    'number': [
        'base-fontsize',
        'flipper-width',
        'fontsize-scale-per-step',
        'linespacing-scale-per-step',
        'loupe-max-scale',
        'loupe-scale-per-step',
        'orientation-border-ratio'
    ],
    'array': [
        'concatenate-spreads',
        'content-draggable',
        'touchmove-ignoring-area',
        'on-orthogonal-edgetap',
        'on-orthogonal-arrowkey',
        'on-orthogonal-touchmove',
        'on-orthogonal-wheel'
    ]
};

Bibi.SettingTypes_PresetOnly = {
    'boolean': [
        'accept-base64-encoded-data',
        'accept-blob-converted-data',
        'allow-external-item-href',
        'allow-scripts-in-content',
        'allow-sugar-for-biscuits',
        'manualize-adding-histories',
        'use-bookmarks',
        'use-histories',
        'use-textsetter',
        'recognize-repeated-taps-separately',
        'remove-bibi-website-link',
        'request-with-credentials'
    ],
    'yes-no': [
        'accept-local-file',
        'keep-settings',
        'resume-from-last-position'
    ],
    'string': [
        'bookshelf',
        'default-reader-view-mode',
        'website-name-in-title',
        'website-name-in-menu',
        'website-href'
    ],
    'integer': [
        'max-bookmarks',
        'max-histories'
    ],
    'number': [
    ],
    'array': [
        'available-reader-view-modes',
        'extensions',
        'extract-if-necessary',
        'inhibit',
        'trustworthy-origins'
    ]
};

Bibi.SettingTypes_UserOnly = {
    'boolean': [
        'debug',
        'forget-me',
        'time',
        'wait',
        'zine'
    ],
    'yes-no': [
    ],
    'string': [
        'dress',
        'edge',
        'epubcfi',
        'p',
        'preset',
        'sugar-for-biscuits',
        'ui-language'
    ],
    'integer': [
        'log',
        'nav',
        'parent-bibi-index'
    ],
    'number': [
        'iipp',
        'sipp'
    ],
    'array': [
    ]
};

Bibi.verifySettingValue = (SettingType, _P, _V, Fill) => Bibi.verifySettingValue[SettingType](_P, _V, Fill); (Verifiers => { for(const SettingType in Verifiers) Bibi.verifySettingValue[SettingType] = Verifiers[SettingType]; })({
    'boolean': (_P, _V, Fill) => {
        if(typeof _V == 'boolean') return _V;
        if(_V === 'true'  || _V === '1' || _V === 1) return true;
        if(_V === 'false' || _V === '0' || _V === 0) return false;
        if(Fill) return false;
    },
    'yes-no': (_P, _V, Fill) => {
        if(/^(yes|no|mobile|desktop)$/.test(_V)) return _V;
        if(_V === 'true'  || _V === '1' || _V === 1) return 'yes';
        if(_V === 'false' || _V === '0' || _V === 0) return 'no';
        if(Fill) return 'no';
    },
    'string': (_P, _V, Fill) => {
        if(typeof _V == 'string') {
            switch(_P) {
                case 'book'                               : return (_V = decodeURIComponent(_V).trim())                  ? _V : undefined;
                case 'book-background-color'              : return /^([a-z]+|([\dA-F]{3}){1,2}|\d{1,3}(,\d{1,3}){2}(,([01]|0?\.\d+))?)$/i.test(_V) ? _V : undefined;
                case 'cache'                              : return /^(no-store)$/.test(_V)                               ? _V : undefined;
                case 'default-page-progression-direction' : return _V == 'rtl'                                           ? _V : 'ltr';
                case 'default-reader-view-mode'           :
                case         'reader-view-mode'           : return /^(paged|horizontal|vertical)$/.test(_V)              ? _V : 'auto';
                case 'dress'                              : return /^[_\-\w\d]+(\.[_\-\w\d]+)*$/.test(_V)                ? _V : undefined;
                case 'edge'                               : return /^(head|foot)$/.test(_V)                              ? _V : undefined;
                case 'on-doubletap'                       : return /^(panel|zoom)$/.test(_V)                             ? _V : undefined;
                case 'on-tripletap'                       : return /^(panel|zoom)$/.test(_V)                             ? _V : undefined;
                case 'on-singletap-with-altkey'           : return /^(panel|zoom)$/.test(_V)                             ? _V : undefined;
                case 'on-doubletap-with-altkey'           : return /^(panel|zoom)$/.test(_V)                             ? _V : undefined;
                case 'on-tripletap-with-altkey'           : return /^(panel|zoom)$/.test(_V)                             ? _V : undefined;
                case 'p'                                  : return /^([a-z]+|[1-9]\d*((\.[1-9]\d*)*|-[a-z]+))$/.test(_V) ? _V : undefined;
                case 'preset'                             : return /^[_\-\w\d]+(\.[_\-\w\d]+)*$/.test(_V)                ? _V : undefined;
                case 'pagination-method'                  : return _V == 'x'                                             ? _V : 'auto';
                case 'ui-language'                        : return /^(ja|en)$/.test(_V)                                  ? _V : undefined;
            }
            return _V;
        }
        if(Fill) return '';
    },
    'integer': (_P, _V, Fill) => {
        if(Number.isFinite(_V *= 1)) {
            _V = Math.max(Math.round(_V), 0);
            switch(_P) {
                case 'log'           : return Math.min(_V,  9);
                case 'max-bookmarks' : return Math.min(_V,  9);
                case 'max-histories' : return Math.min(_V, 19);
            }
            return _V;
        }
        if(Fill) return 0;
    },
    'number': (_P, _V, Fill) => {
        if(Number.isFinite(_V *= 1) && _V >= 0) return _V;
        if(Fill) return 0;
    },
    'array': (_P, _V, Fill) => {
        if(Array.isArray(_V)) {
            switch(_P) {
                case 'available-reader-view-modes' : _V = Array.from(new Set(_V.filter(_I => typeof _I == 'string' && /^(paged|horizontal|vertical)$/.test(_I)))); return _V.length ? _V : ['paged', 'horizontal', 'vertical'];
                case 'concatenate-spreads'         : _V.length = 2; for(let i = 0; i < 2; i++) _V[i] = typeof _V[i] == 'string' && /^(always|never)$/.test(_V[i]) ? _V[i] : 'auto'; return _V;
                case 'content-draggable'           : _V.length = 2; for(let i = 0; i < 2; i++) _V[i] = _V[i] === true || _V[i] === 'true' || _V[i] === '1' || _V[i] === 1 ? true : false; return _V;
                case 'extensions'                  : return _V.filter(_I => typeof _I['src'] == 'string' && (_I['src'] = _I['src'].trim()));
                case 'extract-if-necessary'        : return (_V = _V.map(_I => typeof _I == 'string' ? _I.trim().toLowerCase() : '')).includes('*') ? ['*'] : _V.filter(_I => /^(\.[\w\d]+)*$/.test(_I));
                case 'inhibit'                     : return (_V = _V.map(_I => typeof _I == 'string' ? _I.trim()               : '')).includes('*') ? ['*'] : _V.filter(_I => _I);
                case 'touchmove-ignoring-area'     : _V.length = 4; for(let i = 0; i < 4; i++) _V[i] = Number.isFinite(_V[i] *= 1) && _V[i] >= 0 ? _V[i] : 0; return _V;
                case 'on-orthogonal-arrowkey'      :
                case 'on-orthogonal-edgetap'       :
                case 'on-orthogonal-touchmove'     : _V.length = 2; for(let i = 0; i < 2; i++) _V[i] = typeof _V[i] == 'string' &&        /^(move|switch|utilities)$/.test(_V[i]) ? _V[i] : ''; return _V;
                case 'on-orthogonal-wheel'         : _V.length = 2; for(let i = 0; i < 2; i++) _V[i] = typeof _V[i] == 'string' && /^(across|move|switch|utilities)$/.test(_V[i]) ? _V[i] : ''; return _V;
                case 'trustworthy-origins'         : return _V.reduce((_VN, _I) => typeof _I == 'string' && /^https?:\/\/[^\/]+$/.test(_I = _I.trim().replace(/\/$/, '')) && !_VN.includes(_I) ? _VN.push(_I) && _VN : false, []);
            }
            return _V.filter(_I => typeof _I != 'function');
        }
        if(Fill) return [];
    }
});

Bibi.applyFilteredSettingsTo = (To, From, ListOfSettingTypes, Fill) => {
    ListOfSettingTypes.forEach(STs => {
        for(const ST in STs) STs[ST].forEach(_P => {
            const VSV = Bibi.verifySettingValue[ST](_P, From[_P]);
            if(Fill) {
                To[_P] = Bibi.verifySettingValue[ST](_P, To[_P]);
                if(typeof VSV != 'undefined' || typeof To[_P] == 'undefined') To[_P] = Bibi.verifySettingValue[ST](_P, From[_P], true);
            } else if(From.hasOwnProperty(_P)) {
                if(typeof VSV != 'undefined') To[_P] = VSV;
            }
        });
    });
    return To;
};


Bibi.ErrorMessages = {
       Canceled: `Fetch Canceled`,
    CORSBlocked: `Probably CORS Blocked`,
    DataInvalid: `Data Invalid`,
       NotFound: `404 Not Found`,
   Unidentified: `Unidentified`
};




//==============================================================================================================================================
//----------------------------------------------------------------------------------------------------------------------------------------------

//-- Hello !

//----------------------------------------------------------------------------------------------------------------------------------------------


Bibi.ring = () => Promise.resolve().then(() => {
    Bibi.Script = document.getElementById('bibi-script');
    Bibi.Style  = document.getElementById('bibi-style');
})
.then(Bibi.hello)
.then(Bibi.initialize)
.then(Bibi.loadExtensions)
.then(Bibi.ready)
.then(Bibi.getBookData)
.then(Bibi.loadBook)
.then(Bibi.bindBook)
.then(Bibi.openBook)
.then(Bibi.start)
.catch(O.error);


Bibi.hello = () => {
    D.at1st();
    U.at1st();
    const Promises = [];
    if(!document.getElementById('bibi-preset')) {
        const PresetName = D['preset'] || U['preset'] || 'default';
        // if(PresetName === '~') Promises.push(new Promise(resolve => P.preset.resolve = resolve)); else { // DO NOT ALLOW EXTERNAL OBJECT
            const Preset = sML.create('script', { id: 'bibi-preset', src: O.versionedURL('presets/' + PresetName + '.js') });
            Promises.push(new Promise(resolve => Preset.addEventListener('load', resolve)));
            document.head.insertBefore(Preset, Bibi.Script.nextSibling);
        // }
    }
    if(!document.getElementById('bibi-dress')) {
        const DressName = D['dress'] || U['dress'] || 'everyday';
        // if(DressName === '~') Promises.push(new Promise(resolve => P.dress.resolve = resolve)); else { // DO NOT ALLOW EXTERNAL TEXT
            const Dress = sML.create('link', { id: 'bibi-dress', rel: 'stylesheet', href: O.versionedURL('wardrobe/' + DressName + '/bibi.dress.css') });
            Promises.push(new Promise(resolve => Dress.addEventListener('load', resolve)));
            document.head.insertBefore(Dress, Bibi.Style.nextSibling);
        // }
    }
    Promises.push(new Promise(resolve => {
        let BookStyleCSS = '', Ele = Bibi.Script;
        while(Ele = Ele.nextElementSibling) if(/^style$/i.test(Ele.tagName) && /^\/\*! Bibi Book Style \*\//.test(Ele.textContent)) {
            const BookStyleElement = Ele;
            BookStyleCSS = BookStyleElement.textContent.replace(/\/*.*?\*\//g, '').trim();
            BookStyleElement.innerHTML = '';
            document.head.removeChild(BookStyleElement);
            break;
        }
        O.createBlobURL('Text', BookStyleCSS, 'text/css').then(BookStyleURL => {
            Bibi.BookStyleURL = BookStyleURL;
            resolve();
        });
    }));
    return Promise.all(Promises).then(() => {
        O.log.initialize();
        O.log(`Hello!`, '<b:>');
        O.log(`[ja] ${ Bibi['href'] }`);
        O.log(`[en] https://github.com/satorumurmur/bibi`);
    });
};


Bibi.initialize = async () => {
    { // Path / URI
        O.Origin = location.origin || (location.protocol + '//' + (location.host || (location.hostname + (location.port ? ':' + location.port : ''))));
        O.Local = location.protocol == 'file:';
        O.RequestedURL = location.href;
    }
    { // DOM
        O.contentWindow = window;
        O.contentDocument = document;
        O.HTML  = document.documentElement;
        O.Head  = document.head;
        O.Body  = document.body;
        O.Info  = document.getElementById('bibi-info');
        O.Title = document.getElementsByTagName('title')[0];
    }
    { // Environments
        O.HTML.classList.add(...sML.Environments, 'Bibi', 'welcome');
        if(O.TouchOS = (sML.OS.iOS || sML.OS.Android) ? true : false) { // Touch Device
            O.HTML.classList.add('touch');
            if(sML.OS.iOS) {
                O.Head.appendChild(sML.create('meta', { name: 'apple-mobile-web-app-capable',          content: 'yes'   }));
                O.Head.appendChild(sML.create('meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'white' }));
            }
        }
        O.HTML.classList.add('default-lang-' + (O.Language = (NLs => { // Language
            if(U['ui-language']) return U['ui-language'];
            if(Array.isArray(navigator.languages)) NLs = NLs.concat(navigator.languages);
            if(navigator.language && navigator.language != NLs[0]) NLs.unshift(navigator.language);
            for(let l = NLs.length, i = 0; i < l; i++) {
                const Lan = NLs[i].split ? NLs[i].split('-')[0] : '';
                if(Lan == 'ja') return 'ja';
                if(Lan == 'en') break;
            }                   return 'en';
        })([])));
    }
    { // Modules
        E.initialize();
        P.initialize();
        U.initialize();
        D.initialize();
        S.initialize();
        W.initialize();
        I.initialize();
        if(!S['book-data'] && S['book'] && !S['trustworthy-origins'].includes(new URL(S['book']).origin)) throw `The Origin of the Path of the Book Is Not Allowed.`;
    }
    { // Embedding, Window, Fullscreen
        O.Embedded = (() => { // Window Embedded or Not
            if(window.parent == window) { O.HTML.classList.add('window-direct'  );                                                                         return                            0; } // false
            else                        { O.HTML.classList.add('window-embedded'); try { if(location.host == parent.location.host || parent.location.href) return 1; } catch(Err) {} return -1; } // true (1:Reachable or -1:Unreachable)
        })();
        O.JoBucket = (() => {
            if(typeof S['parent-bibi-index'] != 'number') return null;
            const Window = O.Embedded === 1 ? window.parent : window.opener || null;
            return Window?.['bibi:jo']?.Buckets[S['parent-bibi-index']] || null;
        })();
        O.ParentOrigin = O.JoBucket ? window.parent.location.origin : '';
        O.FullscreenTarget = (() => { // Fullscreen Target
            const FsT = (() => {
                if(!O.Embedded) { sML.Fullscreen.polyfill(window       ); return O.HTML;             }
                if( O.JoBucket) { sML.Fullscreen.polyfill(window.parent); return O.JoBucket.Frame; }
            })() || null;
            if(FsT && FsT.ownerDocument.fullscreenEnabled) { O.HTML.classList.add('fullscreen-enabled' ); return FsT;  }
            else                                           { O.HTML.classList.add('fullscreen-disabled'); return null; }
        })();
        if(O.JoBucket) {
            O.JoBucket.Window = window, O.JoBucket.Document = document, O.JoBucket.HTML = O.HTML, O.JoBucket.Body = O.Body;
            ['bibi:initialized', 'bibi:readied', 'bibi:prepared', 'bibi:loaded-book', 'bibi:binded-book', 'bibi:opened'].forEach(EN => E.add(EN, Det => O.JoBucket.dispatch(EN, Det)));
            window.addEventListener('message', M.receive, false);
        }
    }
    { // IFrame with BlobURL
        O.EnabledIFramesWithBlobURL = await new Promise(resolve => O.createBlobURL('Text', '<!DOCTYPE html><meta charset=l1><title></title>', 'text/html').then(SourceURL => {
            const IFrame = document.body.appendChild(sML.create('iframe', { on: { load: () => resolve(IFrame.contentDocument?.documentElement?.outerHTML?.length ? true : false) || IFrame.remove() }, src: SourceURL }));
            setTimeout(() => resolve(false) || IFrame.remove(), 999);
        }).catch(() => resolve(false)));
    }
    { // Say Welcome or say Bye-bye
        if(Bibi.isCompatible()) I.notify(`Welcome!`); else throw Bibi.byebye();
    }
    { // Writing Mode, Font Size, Safe Area Size, Slider Size, Menu Height
        O.WritingModeProperty = (() => {
            const HTMLComputedStyle = getComputedStyle(O.HTML);
            if(/^(vertical|horizontal)-/.test(HTMLComputedStyle[        'writing-mode'])) return         'writing-mode';
            if(/^(vertical|horizontal)-/.test(HTMLComputedStyle['-webkit-writing-mode'])) return '-webkit-writing-mode';
            if(/^(vertical|horizontal)-/.test(HTMLComputedStyle[  '-epub-writing-mode'])) return   '-epub-writing-mode';
            return undefined;
        })();
        const SC = O.Body.appendChild(sML.create('div', { id: 'bibi-style-checker' })), SCCS = getComputedStyle(SC);
        O.FontSize = { Default: parseFloat(SCCS.fontSize) };
        SC.style.fontSize = '0.01px';
        O.FontSize.Minimum = Math.ceil(parseFloat(SCCS.fontSize) * 100) / 100;
        SC.removeAttribute('style');
        I.Slider.Size = S['use-slider' ] ? parseFloat(SCCS.width)  : 0;
        I.Menu.Height = S['use-menubar'] ? parseFloat(SCCS.height) : 0;
        O.getSafeArea = () => O.Embedded ? { Top: 0, Right: 0, Bottom: 0, Left: 0 } : { Top: parseFloat(SCCS.paddingTop), Right: parseFloat(SCCS.paddingRight), Bottom: parseFloat(SCCS.paddingBottom), Left: parseFloat(SCCS.paddingLeft) };
        Object.defineProperty(O, 'SafeArea', { get: O.getSafeArea });
        // delete document.body.removeChild(SC);
    }
    { // Scrollbars
        O.Body.style.width = O.Body.style.height = '111%';
        O.Scrollbars = { Width: window.innerWidth - O.HTML.offsetWidth, Height: window.innerHeight - O.HTML.offsetHeight };
        /*O.HTML.style.width = O.HTML.style.height =*/ O.Body.style.width = O.Body.style.height = '';
    }
    { // Inhibition...
        O.inhibit();
    }
    { // Debugger & DevNote
        if(Bibi.Deb) O.HTML.classList.add('deb', 'debug'      ) || location.hostname == 'localhost' && Bibi.createDebNote();  delete Bibi.createDebNote;
        if(Bibi.Dev) O.HTML.classList.add('dev', 'development') || location.hostname != 'localhost' && Bibi.createDevNote();  delete Bibi.createDevNote;
    }
    O.HTML.classList.toggle('book-full-height', S['use-full-height']);
    O.HTML.classList.remove('welcome');
    return E.dispatch('bibi:initialized', Bibi.Status = Bibi.Initialized = 'Initialized');
};


Bibi.isCompatible = () => true; // 旧IE系UA判定は削除（browserslistはlast 3 majors/not dead）。拡張による上書き可。

Bibi.byebye = () => {
    I.Veil.byebye({
        'en': `<span>Sorry....</span> <span>Your Browser Is</span> <span>Not Compatible.</span>`,
        'ja': `<span>大変申し訳ありません。</span> <span>お使いのブラウザでは、</span><span>動作しません。</span>`
    });
    return `Your Browser Is Not Compatible`;
};


Bibi.loadExtensions = () => X.list().then(() => {
    if(S['extensions'].length == 0) return;
    O.log(`Loading Extension${ S['extensions'].length > 1 ? 's' : '' }...`, '<g:>');
    return X.load().then(() => {
        O.log(`Extensions: %O`, X.Extensions);
        O.log(`Loaded. (${ X.Extensions.length } Extension${ X.Extensions.length > 1 ? 's' : '' })`, '</g>');
    });
}).finally(X.clean);


Bibi.ready = async () => {
    if(!Bibi.isCompatible()) throw Bibi.byebye(); // Extensions may update Bibi.isCompatible & Bibi.byebye function.
    O.HTML.classList.add('ready');
    O.ReadiedURL = location.href;
    await new Promise(resolve => setTimeout(resolve, (O.TouchOS && !O.Embedded) ? 999 : 0));
    return E.dispatch('bibi:readied', Bibi.Status = Bibi.Readied = 'Readied').then(() => O.HTML.classList.remove('ready'));
};


Bibi.getBookData = () =>
    S['book-data']         ?     Promise.resolve({ BookData: S['book-data'], BookDataMIMEType: S['book-data-mimetype'] }) :
    S['book']              ?     Promise.resolve({ Book: S['book'] }) :
    S['accept-local-file'] ? new Promise(resolve => { Bibi.getBookData.resolve = (Par) => { resolve(Par), O.HTML.classList.remove('waiting-file'); }; O.HTML.classList.add('waiting-file'); }) :
                                 Promise.reject (`Tell me EPUB name via ${ O.Embedded ? 'embedding tag' : 'URI' }.`);

Bibi.setBookData = (Par) => Bibi.getBookData.resolve ? Bibi.getBookData.resolve(Par) : Promise.reject(Par);

Bibi.busyHerself = () => new Promise(resolve => {
    O.Busy = true;
    O.HTML.classList.add('busy');
    O.HTML.classList.add('loading');
    I.ResizeObserver.addEventListener(R.resetBibiHeight);
    Bibi.busyHerself.resolve = () => { resolve(); delete Bibi.busyHerself; };
}).then(() => {
    I.ResizeObserver.addEventListener(R.resetBibiHeight);
    O.Busy = false;
    O.HTML.classList.remove('busy');
    O.HTML.classList.remove('loading');
});


Bibi.loadBook = (BookInfo) => Promise.resolve().then(() => {
    Bibi.busyHerself();
    I.notify(`Loading...`);
    O.log(`Initializing Book...`, '<g:>');
    return L.initializeBook(BookInfo).then(InitializedAs => {
        O.log(`${ InitializedAs }: %O`, B);
        O.log(`Initialized. (as ${ /^[aiueo]/i.test(InitializedAs) ? 'an' : 'a' } ${ InitializedAs })`, '</g>');
    });
}).then(() => {
    S.update();
    R.updateOrientation();
    R.resetStage();
}).then(() => {
    // Create Cover
    O.log(`Creating Cover...`, '<g:>');
    if(B.CoverImage.Source) {
        O.log(`Cover Image: %O`, B.CoverImage.Source);
        O.log(`Will Be Created.`, '</g>');
    } else {
        O.log(`Will Be Created. (w/o Image)`, '</g>');
    }
    /*return*/ L.createCover(); // ← loading is async
}).then(() => {
    // Load Navigation
    if(!B.Nav.Source) return O.log(`No Navigation.`)
    O.log(`Loading Navigation...`, '<g:>');
    return L.loadNavigation().then(PNav => {
        O.log(`${ B.Nav.Type }: %O`, B.Nav.Source);
        O.log(`Loaded.`, '</g>');
        E.dispatch('bibi:loaded-navigation', B.Nav.Source);
    });
}).then(() => {
    // Announce "Prepared"
    return E.dispatch('bibi:prepared', Bibi.Status = Bibi.Prepared = 'Prepared');
}).then(() => {
    // Wait, sometime
    if(!S['autostart'] && !L.Played) return L.wait();
}).then(() => {
    // Background Preparing
    return L.preprocessResources();
}).then(() => {
    // Load & Layout Items in Spreads and Pages
    O.log(`Loading Items in Spreads...`, '<g:>');
    Bibi.StartOption = {
        TargetItemIndex: 0,
        TargetSpreadIndex: 0,
        Destination: { Edge: 'head' },
        NoNotification: true,
        Reset: true, ////////
        // resetter:       () => { Bibi.StartOption.Reset = true; Bibi.StartOption.removeResetter(); },
        // addResetter:    () => { window   .addEventListener('resize', Bibi.StartOption.resetter); },
        // removeResetter: () => { window.removeEventListener('resize', Bibi.StartOption.resetter); }
    };
    if(typeof R.StartOn == 'object') {
        const Item = typeof R.StartOn.Item == 'object' ? R.StartOn.Item : (() => {
            if(typeof R.StartOn.ItemIndex == 'number') {
                let II = R.StartOn.ItemIndex;
                     if(II <  0             ) R.StartOn = { ItemIndex: 0 };
                else if(II >= R.Items.length) R.StartOn = { ItemIndex: R.Items.length - 1 };
                return R.Items[R.StartOn.ItemIndex];
            }
            if(typeof R.StartOn.ItemIndexInSpine  == 'number') {
                let IIIS = R.StartOn.ItemIndexInSpine;
                     if(IIIS <  0                     ) IIIS = 0;
                else if(IIIS >= B.Package.Spine.length) IIIS = B.Package.Spine.length - 1;
                let Item = B.Package.Spine[R.StartOn.ItemIndexInSpine];
                if(!Item.Spread) {
                    R.StartOn = { ItemIndex: 0 };
                    Item = R.Items[0];
                }
                return Item;
            }
            if(typeof R.StartOn.P == 'string') {
                const Steps = R.StartOn.P.split('.');
                let II = Steps.shift() * 1 - 1;
                     if(II <  0             ) II = 0,                  R.StartOn = { P: String(II + 1) };
                else if(II >= R.Items.length) II = R.Items.length - 1, R.StartOn = { P: String(II + 1) };
                return R.Items[II];
            }
            if(typeof R.StartOn.IIPP == 'number') {
                let II = Math.floor(R.StartOn.IIPP);
                     if(II <  0             ) II = 0,                  R.StartOn = { IIPP: II };
                else if(II >= R.Items.length) II = R.Items.length - 1, R.StartOn = { IIPP: II };
                return R.Items[II];
            }
            if(typeof R.StartOn.Edge == 'string') {
                R.StartOn = (R.StartOn.Edge != 'foot') ? { Edge: 'head' } : { Edge: 'foot' };
                switch(R.StartOn.Edge) {
                    case 'head': return R.Items[0];
                    case 'foot': return R.Items[R.Items.length - 1];
                }
            }
        })();
        if(Item) {
            Bibi.StartOption.TargetItemIndex = Item.Index;
            Bibi.StartOption.TargetSpreadIndex = Item.Spread.Index;
        }
        Bibi.StartOption.Destination = R.StartOn;
    }
    // Bibi.StartOption.addResetter();
    O.HTML.classList.add('loading-items');
    let LoadedItems = 0;
    return Promise.all(R.Spreads.map(Spread => new Promise(resolve => L.loadSpread(Spread, { AllowPlaceholderItems: S['allow-placeholders'] && Spread.Index != Bibi.StartOption.TargetSpreadIndex }).then(() => {
        I.notify(`Loading Items... <span class="sotto">${ LoadedItems += Spread.Items.length }/${ R.Items.length }</span>`);
        setTimeout(() => resolve(), 69);
        // !Bibi.StartOption.Reset ? R.layOutSpreadAndItsItems(Spread).then(resolve) : resolve();
    })))).then(async () => {
        O.log(`Loaded. (${ R.Items.length } in ${ R.Spreads.length })`, '</g>');
        I.notify(`Processing...`);
        await new Promise(resolve => setTimeout(resolve, 69));
        return E.dispatch('bibi:loaded-book', Bibi.Status = Bibi.Loaded = 'Loaded').then(() => O.HTML.classList.remove('loading-items'));
    });
});


Bibi.bindBook = async () => {
    // if(!Bibi.StartOption.Reset) {
    //     R.organizePages();
    //     R.layOutStage();
    // }
    I.notify(`Binding...`);
    await new Promise(resolve => setTimeout(resolve, 69));
    return R.layOutBook(Bibi.StartOption)
        // .then(() => Bibi.StartOption.removeResetter())
        .then(() => E.dispatch('bibi:laid-out-for-the-first-time', Bibi.StartOption))
        .then(() => E.dispatch('bibi:binded-book', Bibi.Status = Bibi.Binded = 'Binded'));
};


Bibi.openBook = () => {
    // Open
    Bibi.busyHerself.resolve();
    I.Veil.close();
    L.Opened = true;
    document.body.click(); // To responce for user scrolling/keypressing immediately
    I.notify('Here!', { Time: 999 });
    O.log(`Enjoy Readings!`, '</b>');
    return E.dispatch('bibi:opened', Bibi.Status = Bibi.Opened = 'Opened').then(() => E.dispatch('bibi:scrolled'));
};


Bibi.start = () => {
    /*
    alert((Alert => {
        [
            'document.referrer',
            'navigator.userAgent',
            '[navigator.appName, navigator.vendor, navigator.platform]',
            'window.innerHeight',
            '[O.HTML.offsetHeight, O.HTML.clientHeight, O.HTML.scrollHeight]',
            '[O.Body.offsetHeight, O.Body.clientHeight, O.Body.scrollHeight]',
            '[R.Main.offsetHeight, R.Main.clientHeight, R.Main.scrollHeight]'
        ].forEach(X => Alert.push(`┌ ' + X + '\n' + eval(X)));
        return Alert.join('\n\n');
    })([]));
    //*/
    const LandingPage = R.getPage(Bibi.StartOption.Destination);
    if(!I.History.List.length) {
        I.History.List = [{ UI: Bibi, Item: LandingPage.Item, ProgressInItem: LandingPage.IndexInItem / LandingPage.Item.Pages.length }];
        I.History.update();
    }
    E.add('bibi:commands:move-by',     R.moveBy);
    E.add('bibi:commands:scroll-by',   R.scrollBy);
    E.add('bibi:commands:focus-on',    R.focusOn);
    E.add('bibi:commands:change-view', R.changeView);
    return E.dispatch('bibi:started', Bibi.Status = Bibi.Started = 'Started');
};


Bibi.createDebNote = () => {
    const Deb = Bibi.IsDebMode = O.Body.appendChild(sML.create('div', { id: 'bibi-is-deb-mode', style: { display: 'none' } }));
    const deb = Bibi.deb = (...Args) => {
        Deb.style.display = '';
        const NoLog = Args[0] === 'NoLog'; if(NoLog) Args.shift();
        const Msg = Args.join(', '); if(!Msg) return;
        if(!NoLog) O.log(Msg.replace(/<[^<>]*>/g, ''), '<*/>');
        return Deb.appendChild(sML.create('p', { innerHTML: Msg }));
    };
    E.add('bibi:started', () => {
        sML.style(Deb, { top: '5px', width: R.Stage.Width - 10 + 'px', height: R.Stage.Height - 10 + 'px' });
        // O.log('========================', '<*/>');
        // deb(`Window: W:${ window.innerWidth }, H:${ window.innerHeight }`);
        // deb(`Stage: W:${ R.Stage.Width }, H:${ R.Stage.Height }`);
    });
}, Bibi.deb = () => undefined;


Bibi.createDevNote = () => {
    const Dev = Bibi.IsDevMode = O.Body.appendChild(sML.create('div', { id: 'bibi-is-dev-mode' }));
    const dev = (...Args) => {
        const NoLog = Args[0] === 'NoLog'; if(NoLog) Args.shift();
        const Msg = Args.join(', '); if(!Msg) return;
        if(!NoLog) O.log(Msg.replace(/<[^<>]*>/g, ''), '<*/>');
        return Dev.appendChild(sML.create('p', { innerHTML: Msg }));
    };
    O.log('========================', '<*/>');
    dev(`<strong>This Bibi seems to be a</strong> <strong>Development Version</strong>`);
    dev(`<span>Please don't forget</span> <span>to create a production version</span> <span>before publishing on the Internet.</span>`);
    dev(`<span class="non-visual">(To create a production version, run it on terminal: \`</span><code>bun run build</code><span class="non-visual">\`)</span>`);
    dev('NoLog', `<em>Close</em>`).addEventListener('click', () => Dev.className = 'hide');
    O.log('========================', '<*/>');
    [E['pointerdown'], E['pointerup'], E['pointermove'], E['pointerover'], E['pointerout'], 'click'].forEach(EN => Dev.addEventListener(EN, Eve => { Eve.preventDefault(); Eve.stopPropagation(); return false; }));
    setTimeout(() => Dev.className = 'show', 0);
};


Bibi.createElement = (...Args) => {
    const TagName = Args[0];
    if(!Bibi.Elements) Bibi.Elements = {};
    if(window.customElements) {
        if(!Bibi.Elements[TagName]) Bibi.Elements[TagName] = class extends HTMLElement { constructor() { super(); } }, window.customElements.define(TagName, Bibi.Elements[TagName]);
    }
    return sML.create(...Args);
};




