// Heart of Bibi — Events (split from bibi.heart.js; peers via shared context, no cycles)

import { O, R, I, S, E, X } from './bibi.heart.context.mjs';
import { getPageTapDivision } from './bibi.heart.hitregions.mjs';

//==============================================================================================================================================
//----------------------------------------------------------------------------------------------------------------------------------------------

//-- Events

//----------------------------------------------------------------------------------------------------------------------------------------------




E.initialize = () => {
    if(document.onpointerdown !== undefined) {
        E['pointerdown'] = 'pointerdown';
        E['pointermove'] = 'pointermove';
        E['pointerup']   = 'pointerup';
        E['pointerover'] = 'pointerover';
        E['pointerout']  = 'pointerout';
    } else if(O.TouchOS && document.ontouchstart !== undefined) {
        E['pointerdown'] = 'touchstart';
        E['pointermove'] = 'touchmove';
        E['pointerup']   = 'touchend';
    } else {
        E['pointerdown'] = 'mousedown';
        E['pointermove'] = 'mousemove';
        E['pointerup']   = 'mouseup';
        E['pointerover'] = 'mouseover';
        E['pointerout']  = 'mouseout';
    }
    E.CPO_000 = { capture: false, passive: false, once: false };
    E.CPO_010 = { capture: false, passive:  true, once: false };
    E.CPO_100 = { capture:  true, passive: false, once: false };
    E.CPO_110 = { capture:  true, passive:  true, once: false };
    E.stopPropagation = (Eve) => Eve.stopPropagation();
    E.preventDefault  = (Eve) => Eve.preventDefault();
    //sML.applyRtL(E, new sML.CustomEvents('bibi'));
    E.CustomEvents = new sML.CustomEvents('bibi');
    E.add = function(/*[Tar,]*/ Nam, fun, Opt) {
        if(Array.isArray(arguments[0])                                        ) return arguments[0].forEach(AI => E.add(AI, arguments[1], arguments[2], arguments[3]));
        if(Array.isArray(arguments[1])                                        ) return arguments[1].forEach(AI => E.add(arguments[0], AI, arguments[2], arguments[3]));
        if(Array.isArray(arguments[2]) && typeof arguments[2][0] == 'function') return arguments[2].forEach(AI => E.add(arguments[0], arguments[1], AI, arguments[3]));
        let Tar = document; if(typeof fun != 'function') Tar = arguments[0], Nam = arguments[1], fun = arguments[2], Opt = arguments[3];
        return /^bibi:/.test(Nam) ? E.CustomEvents.add(Tar, Nam, fun) : Tar.addEventListener(Nam, fun, Opt);
    };
    E.remove = function(/*[Tar,]*/ Nam, fun, Opt) {
        if(Array.isArray(arguments[0])                                        ) return arguments[0].forEach(AI => E.remove(AI, arguments[1], arguments[2], arguments[3]));
        if(Array.isArray(arguments[1])                                        ) return arguments[1].forEach(AI => E.remove(arguments[0], AI, arguments[2], arguments[3]));
        if(Array.isArray(arguments[2]) && typeof arguments[2][0] == 'function') return arguments[2].forEach(AI => E.remove(arguments[0], arguments[1], AI, arguments[3]));
        let Tar = document; if(typeof fun != 'function') Tar = arguments[0], Nam = arguments[1], fun = arguments[2], Opt = arguments[3];
        return /^bibi:/.test(Nam) ? E.CustomEvents.remove(Tar, Nam, fun) : Tar.removeEventListener(Nam, fun, Opt);
    };
    E.bind     = function() { return E.CustomEvents.bind    .apply(E.CustomEvents, arguments); };
    E.unbind   = function() { return E.CustomEvents.unbind  .apply(E.CustomEvents, arguments); };
    E.dispatch = function() { return E.CustomEvents.dispatch.apply(E.CustomEvents, arguments); };
    delete E.initialize;
};


E.aBCD = (Eve) => { // add Bibi's Collections of Data (formerly: add Bibi-Coord/Division)
    if(!Eve) return Eve;
    const BCD = {};
    BCD.Coord = E.aBCD.getCoord(Eve);
    BCD.Division = E.aBCD.getDivision(BCD.Coord);
    BCD.RangeOfSelection = I.RangeFinder.RangeOfSelection;
    return Object.assign(Eve, BCD);
};

    E.aBCD.getCoord = (Eve) => {
        const Point = /^touch/.test(Eve.type) ? Eve.changedTouches[0] : Eve;
        const Coord = { X: Point.clientX, Y: Point.clientY };
        const Doc = Eve.target.ownerDocument;
        if(Doc != document) {
            const Item = Doc.documentElement.Item;
            const Rect = Item.getBoundingClientRect();
            // Client coordinates and the iframe rectangle share viewport space, even after Safari pans the root.
            Coord.X = Rect.left + (Item.clientLeft + Coord.X) * Rect.width / Item.offsetWidth;
            Coord.Y = Rect.top + (Item.clientTop + Coord.Y) * Rect.height / Item.offsetHeight;
        }
        return Coord;
    };

    E.aBCD.getDivision = Coord => {
        const Bounds = O.Body.getBoundingClientRect();
        const Paired = R.Current?.Pages.some(Page =>
            Page.Spread.PaneWidthFactor == 0.5 ||
            Page.Item.Spreaded && (Page.Item.SpreadPair || Page.Item.Reflowable && !Page.Item.OnlySingleSVG && !Page.Item.OnlySingleImg && Page.Item['rendition:page-spread'] != 'center')
        );
        return getPageTapDivision({ X: Coord.X - Bounds.left, Y: Coord.Y - Bounds.top }, Bounds.width, Bounds.height, Bounds.width / (Paired ? 2 : 1), S['flipper-width']);
    };




