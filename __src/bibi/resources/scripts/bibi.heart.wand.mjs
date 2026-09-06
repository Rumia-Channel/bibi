// Heart of Bibi — Wand (Worker) (split from bibi.heart.js; peers via shared context, no cycles)

import { O } from './bibi.heart.context.mjs';
import { Wand } from './bibi.instruments/Wand.mjs';

//==============================================================================================================================================
//----------------------------------------------------------------------------------------------------------------------------------------------

//-- Wand (Worker)

//----------------------------------------------------------------------------------------------------------------------------------------------

export const W = new Wand(new Worker(new URL('./bibi.wand.js', document.currentScript.src).href), {
    initialize: () => {
        delete W.initialize;
        W.Logger = O;
        W.and('initialize')(['sML', 'Bibi', 'S'].reduce((Settings, OName) => (Settings[OName] = JSON.parse(JSON.stringify(window[OName]))) && Settings, {}));
    }
});


