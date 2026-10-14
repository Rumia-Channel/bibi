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

    E.aBCD.getCoord = (Eve) => { let Coord = { X: 0, Y: 0 };
        if(/^touch/.test(Eve.type)) {
            Coord.X = Eve.changedTouches[0].pageX;
            Coord.Y = Eve.changedTouches[0].pageY;
        } else {
            Coord.X = Eve.pageX;
            Coord.Y = Eve.pageY;
        }
        const Doc = Eve.target.ownerDocument;
        if(Doc == document) {
            Coord.X -= O.Body.scrollLeft;
            Coord.Y -= O.Body.scrollTop;
        } else {
            const Item = Doc.documentElement.Item;
            const Rect = Item.getBoundingClientRect();
            // Events already use the iframe viewport's CSS pixels, not the original EPUB page size.
            // The iframe's actual rectangle also includes reader zoom and the scroll frame offset.
            Coord.X = Rect.left + (Item.clientLeft + Coord.X - Doc.defaultView.scrollX) * Rect.width / Item.offsetWidth;
            Coord.Y = Rect.top + (Item.clientTop + Coord.Y - Doc.defaultView.scrollY) * Rect.height / Item.offsetHeight;
        }
        return Coord;
    };

    E.aBCD.getDivision = Coord => getPageTapDivision(Coord, window.innerWidth, window.innerHeight, R.Stage?.Width ? R.Stage.Width / (R.TwoPane ? 2 : 1) : window.innerWidth, S['flipper-width']);




