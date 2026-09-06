// Heart of Bibi — Presets (split from bibi.heart.js; peers via shared context, no cycles)

import { Bibi, P, U, X } from './bibi.heart.context.mjs';

//==============================================================================================================================================
//----------------------------------------------------------------------------------------------------------------------------------------------

//-- Presets

//----------------------------------------------------------------------------------------------------------------------------------------------




P.preset = (PresetData) => { // DO NOT ALLOW EXTERNAL OBJECT
    Bibi.applyFilteredSettingsTo(P, PresetData, [Bibi.SettingTypes, Bibi.SettingTypes_PresetOnly], 'Fill'); /**/ delete P['book']; /**/
    delete P.preset; delete Bibi.preset;
    P.Script = document.currentScript;
    // if(P.preset.resolve) P.preset.resolve();
};
Bibi.preset = P.preset;


// P.dress = (Dress) => { // DO NOT ALLOW EXTERNAL TEXT
//     document.documentElement.insertBefore(document.createElement('style')).textContent = DressData;
//     delete P.dress; delete Bibi.dress;
//     if(P.dress.resolve) P.dress.resolve();
// };
// Bibi.dress = P.dress;


P.initialize = () => {
    P['bookshelf'] = (P['bookshelf'] ? new URL(P['bookshelf'], P.Script.src) : new URL('../../../bibi-bookshelf', Bibi.Script.src)).href.replace(/\/$/, '');
    P['extensions'] = (() => {
        let Extensions_HTML = Bibi.Script.getAttribute('data-bibi-extensions');
        if(Extensions_HTML) {
            const DocHRef = location.href.split('?')[0];
            Extensions_HTML = Extensions_HTML.trim().replace(/\s+/, ' ').split(' ').map(EPath => ({ src: new URL(EPath, DocHRef).href }));
            if(Extensions_HTML.length) P['extensions'] = Extensions_HTML;
        }
        return !Array.isArray(P['extensions']) ? [] : P['extensions'].filter(Xtn => {
            if(Xtn.hasOwnProperty('-spell-of-activation-')) {
                const SoA = Xtn['-spell-of-activation-'];
                if(!SoA || !/^[a-zA-Z0-9_\-]+$/.test(SoA) || !U.Query.hasOwnProperty(SoA)) return false;
            }
            if(Xtn.hasOwnProperty('-extract-')) {
                const Extract = Xtn['-extract-'] = Bibi.verifySettingValue('array', 'extract-if-necessary', Xtn['-extract-']);
                if(Extract) X.Extractor = Xtn, P['extract-if-necessary'] = Extract;
            }
            if(!Xtn || !Xtn['src'] || typeof Xtn['src'] != 'string') return false;
            return (Xtn['src'] = new URL(Xtn['src'], P.Script.src).href);
        });
    })();
    delete P.initialize;
};



