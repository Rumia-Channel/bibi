// Heart of Bibi — Settings (split from bibi.heart.js; peers via shared context, no cycles)

import { Bibi, O, I, P, U, D, S, C, E } from './bibi.heart.context.mjs';
import { B } from './bibi.heart.book.mjs';

//==============================================================================================================================================
//----------------------------------------------------------------------------------------------------------------------------------------------

//-- Settings

//----------------------------------------------------------------------------------------------------------------------------------------------




S.initialize = () => {
    for(const Pro in S) if(typeof S[Pro] != 'function') delete S[Pro];
    sML.applyRtL(S, P, 'ExceptFunctions');
    sML.applyRtL(S, U, 'ExceptFunctions');
    sML.applyRtL(S, D, 'ExceptFunctions');
    Bibi.SettingTypes['yes-no'].concat(Bibi.SettingTypes_PresetOnly['yes-no']).concat(Bibi.SettingTypes_UserOnly['yes-no']).forEach(Pro => S[Pro] = (S[Pro] == 'yes' || (S[Pro] == 'mobile' && O.TouchOS) || (S[Pro] == 'desktop' && !O.TouchOS)));
    // --------
    if( S['uiless'])      S['use-menubar'] = S['use-slider'] = S['use-arrows'] = S['use-nombre'] = false;
    if(!S['use-menubar']) S['use-bookmark-ui'] = S['use-loupe-ui'] = S['use-search-ui'] = S['use-textsetter-ui'] = false, S['use-full-height'] = true;
    if(!S['use-slider'])  S['use-history-ui'] = S['zoom-out-for-utilities'] = false;
    // --------
    if(!S['trustworthy-origins'].includes(O.Origin)) S['trustworthy-origins'].unshift(O.Origin);
    S['cache'] = (S['cache'] == 'no-store' || Bibi.Debug) ? 'no-store' : '';
    // --------
    S['book'] = (!S['book-data'] && typeof S['book'] == 'string' && S['book']) ? new URL(S['book'], S['bookshelf'] + '/').href : '';
    // --------
    if(typeof S['parent-bibi-index'] != 'number') delete S['parent-bibi-index'];
    // --------
    if(S['book'] || !window.File) S['accept-local-file'] = false, S['accept-blob-converted-data'] = false, S['accept-base64-encoded-data'] = false;
    else                          S['accept-local-file'] = S['accept-local-file'] && (S['extract-if-necessary'].includes('*') || S['extract-if-necessary'].includes('.epub') || S['extract-if-necessary'].includes('.zip')) ? true : false;
    // --------
    S['autostart'] = S['wait'] ? false : !S['book'] ? true : window.parent != window ? S['autostart-embedded'] : S['autostart'];
    S['start-in-new-window'] = (window.parent != window && !S['autostart']) ? S['start-embedded-in-new-window'] : false;
    // --------
    S['default-page-progression-direction'] = S['default-page-progression-direction'] == 'rtl' ? 'rtl' : 'ltr';
    // --------
    if(!S['available-reader-view-modes'] || !S['available-reader-view-modes'].length || S['available-reader-view-modes'].length > 3) S['available-reader-view-modes'] = ['paged', 'horizontal', 'vertical'];
    S['available-reader-view-modes_string'] = (ARVMs => {
        if(S['available-reader-view-modes'].includes('paged'     )) ARVMs.push('paged');
        if(S['available-reader-view-modes'].includes('horizontal')) ARVMs.push('horizontal');
        if(S['available-reader-view-modes'].includes('vertical'  )) ARVMs.push('vertical');
        return ARVMs.join('-');
    })([]);
    if(!S['default-reader-view-mode'] || (S['default-reader-view-mode'] != 'auto' && !S['available-reader-view-modes'].includes(S['default-reader-view-mode']))) S['default-reader-view-mode'] = 'auto';
    if(!S['reader-view-mode'] || !S['available-reader-view-modes'].includes(S['reader-view-mode'])) S['reader-view-mode'] = S['default-reader-view-mode'];
    if(S['available-reader-view-modes'].length == 1) S['fix-reader-view-mode'] = true;
    // --------
    if(O.TouchOS) S['use-loupe-ui'] = false;
    if(S['forget-me'] || !localStorage || S['max-bookmarks'] == 0) S['use-bookmarks'] = false;
    if(!S['use-bookmarks']) S['max-bookmarks'] = 0, S['use-bookmark-ui'] = false;
    if(S['max-histories'] == 0) S['use-histories'] = false;
    if(!S['use-histories']) S['max-histories'] = 0, S['use-history-ui'] = false;
    // --------
    if(S['on-orthogonal-wheel'][0] == 'across') S['on-orthogonal-wheel'][0] = 'move';
    if(S['available-reader-view-modes'].length != 2) {
        const EventNames = ['on-orthogonal-arrowkey', 'on-orthogonal-edgetap', 'on-orthogonal-touchmove', 'on-orthogonal-wheel'];
        switch(S['available-reader-view-modes'].length) {
            case 1: EventNames.forEach(EN => S[EN].forEach((Val, i) => { if(     Val == 'switch') S[EN][i] = ''; })); break;
            case 3: EventNames.forEach(EN =>                           { if(S[EN][0] == 'switch') S[EN][0] = ''; } ); break;
        }
    }
    // --------
    S.Modes = { // 'Mode': { SH: 'ShortHand', CNP: 'ClassNamePrefix' }
               'book-rendition-layout'       : { SH: 'BRL', CNP: 'book' },
                 'book-writing-mode'         : { SH: 'BWM', CNP: 'book' },
             'page-progression-direction'    : { SH: 'PPD', CNP: 'page' },
            'navigation-layout-direction'    : { SH: 'NLD', CNP: 'nav' },
                  'reader-view-mode'         : { SH: 'RVM', CNP: 'view' },
        'available-reader-view-modes_string' : { SH: 'AVM', CNP: 'available' },
                'spread-layout-axis'         : { SH: 'SLA', CNP: 'spread' },
                'spread-layout-direction'    : { SH: 'SLD', CNP: 'spread' },
             'apparent-reading-axis'         : { SH: 'ARA', CNP: 'appearance' },
             'apparent-reading-direction'    : { SH: 'ARD', CNP: 'appearance' }
    };
    for(const Mode in S.Modes) {
        const _ = S.Modes[Mode];
        Object.defineProperty(S, _.SH, { get: () => S[Mode], set: (Val) => S[Mode] = Val });
        delete _.SH;
    }
    // --------
    E.bind('bibi:initialized-book', () => {
        if(S['keep-settings']) {
            const BookBiscuits = I.Oven.Biscuits.remember('Book');
            if(!BookBiscuits) return;
            if(!U['reader-view-mode']              && BookBiscuits.RVM && S['available-reader-view-modes'].includes(BookBiscuits.RVM)) S['reader-view-mode']              = BookBiscuits.RVM;
            if(!U['full-breadth-layout-in-scroll'] && BookBiscuits.FBL                                                               ) S['full-breadth-layout-in-scroll'] = BookBiscuits.FBL;
        }
    });
    // --------
    E.dispatch('bibi:initialized-settings');
};


S.update = (Settings) => {
    const Prev = {}; for(const Mode in S.Modes) Prev[Mode] = S[Mode];
    if(typeof Settings == 'object') for(const Property in Settings) if(typeof S[Property] != 'function') S[Property] = Settings[Property];
    S['book-rendition-layout'] = B.Package.Metadata['rendition:layout'];
    S['book-writing-mode'] = B.WritingMode;
    S['allow-placeholders'] = (S['allow-placeholders'] && B.ExtractionPolicy != 'at-once') ? true : false;
    if(S.FontFamilyStyleIndex) sML.deleteCSSRule(S.FontFamilyStyleIndex);
    if(S['ui-font-family']) S.FontFamilyStyleIndex = sML.appendCSSRule('html', 'font-family: ' + S['ui-font-family'] + ' !important;');
    S['page-progression-direction'] = B.PPD;
    S['spread-layout-axis'] = S['pagination-method'] == 'x' ? (
        S['reader-view-mode'] == 'vertical' ? 'vertical' : 'horizontal'
    ) : (() => {
        if(S['reader-view-mode'] != 'paged') return S['reader-view-mode'];
        if(B.Reflowable) switch(B.WritingMode) {
            case 'tb-rl': case 'tb-lr': return   'vertical'; ////
        }                               return 'horizontal';
    })();
     S['apparent-reading-axis']      = (S['reader-view-mode']   == 'paged'   ) ? 'horizontal' : S['reader-view-mode'];
     S['apparent-reading-direction'] = (S['reader-view-mode']   == 'vertical') ? 'ttb'        : S['page-progression-direction'];
        S['spread-layout-direction'] = (S['spread-layout-axis'] == 'vertical') ? 'ttb'        : S['page-progression-direction'];
    S['navigation-layout-direction'] = (S['fix-nav-ttb'] || S['page-progression-direction'] != 'rtl') ? 'ttb' : 'rtl';
    for(const Mode in S.Modes) {
        const Pfx = S.Modes[Mode].CNP + '-', PC = Pfx + Prev[Mode], CC = Pfx + S[Mode];
        if(PC != CC) O.HTML.classList.remove(PC);
        O.HTML.classList.add(CC);
    }
    C.update();
    E.dispatch('bibi:updated-settings', S);
};




