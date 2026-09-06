// Heart of Bibi — Events (split from bibi.heart.js; peers via shared context, no cycles)

import { O, R, I, S, E, X } from './bibi.heart.context.mjs';

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
            const Main = R.Main;
            //const MainTransformation = I.Loupe.CurrentTransformation || { Scale: 1, TranslateX: 0, TranslateY: 0 };
            const MainTransformation = I.Loupe.CurrentTransformation ? I.Loupe.getActualTransformation() : { Scale: 1, TranslateX: 0, TranslateY: 0 };
            const MainScale = MainTransformation.Scale;
            const MainTransformOriginX_InMain = Main.offsetWidth  / 2;
            const MainTransformOriginY_InMain = Main.offsetHeight / 2;
            const MainTranslationX = MainTransformation.TranslateX;
            const MainTranslationY = MainTransformation.TranslateY;
            const Item = Doc.documentElement.Item;
            const ItemScale = Item.Scale;
            const ItemCoordInMain = O.getElementCoord(Item, Main);
            if(!Item.NoPadding && !Item.Outsourcing) ItemCoordInMain.X += Item.Padding.Left, ItemCoordInMain.Y += Item.Padding.Top;
            Coord.X = Math.floor(Main.offsetLeft + ((MainTransformOriginX_InMain + MainTranslationX) + ((((ItemCoordInMain.X + (Coord.X * ItemScale)) - Main.scrollLeft) - MainTransformOriginX_InMain) * MainScale)));
            Coord.Y = Math.floor(Main.offsetTop  + ((MainTransformOriginY_InMain + MainTranslationY) + ((((ItemCoordInMain.Y + (Coord.Y * ItemScale)) - Main.scrollTop ) - MainTransformOriginY_InMain) * MainScale)));
            //                  (MainCoord       + ((MainTransformOrigin_in_Main + MainTranslation ) + ((((ItemCoord_in_Main + Coord_in_Item        ) - ScrolledLength ) - MainTransformOrigin_in_Main) * MainScale)))
            //                  (MainCoord       + ((MainTransformOrigin_in_Main + MainTranslation ) + (((Coord_in_Main                               - ScrolledLength ) - MainTransformOrigin_in_Main) * MainScale)))
            //                  (MainCoord       + ((MainTransformOrigin_in_Main + MainTranslation ) + ((Coord_in_Viewport_of_Main                                       - MainTransformOrigin_in_Main) * MainScale)))
            //                  (MainCoord       + ((MainTransformOrigin_in_Main + MainTranslation ) + (Coord_from_MainTransformOrigin_in_Main                                                          * MainScale)))
            //                  (MainCoord       + (MainTransformOrigin_in_Translated-Main           + Coord_from_TransformOrigin_in_Scaled-Main                                                                    ))
            //                  (MainCoord       + Coord_in_Transformed-Main                                                                                                                                         )
            //                  Coord
        }
        return Coord;
    };

    E.aBCD.getDivision = (Coord) => {
        const FlipperWidth = S['flipper-width'];
        const Ratio = {
            X: Coord.X / window.innerWidth,
            Y: Coord.Y / window.innerHeight
        };
        let BorderT, BorderR, BorderB, BorderL;
        if(FlipperWidth < 1) { // Ratio
            BorderL = BorderT =     FlipperWidth;
            BorderR = BorderB = 1 - FlipperWidth;
        } else { // Pixel to Ratio
            BorderL = FlipperWidth / window.innerWidth;
            BorderT = FlipperWidth / window.innerHeight;
            BorderR = 1 - BorderL;
            BorderB = 1 - BorderT;
        }
        const Division = { /* 9: 5 */ };
             if(Ratio.X < BorderL          ) Division.X = 'left';//,   Division[9] -= 1;
        else if(          BorderR < Ratio.X) Division.X = 'right';//,  Division[9] += 1;
        else                                 Division.X = 'center';
             if(Ratio.Y < BorderT          ) Division.Y = 'top';//,    Division[9] -= 3;
        else if(          BorderB < Ratio.Y) Division.Y = 'bottom';//, Division[9] += 3;
        else                                 Division.Y = 'middle';
        return Division;
    };




