// Heart of Bibi — Compass (split from bibi.heart.js; peers via shared context, no cycles)

import { L, S, C } from './bibi.heart.context.mjs';

//==============================================================================================================================================
//----------------------------------------------------------------------------------------------------------------------------------------------

//-- Compass

//----------------------------------------------------------------------------------------------------------------------------------------------



C.update = () => {
    C.probe('L', S['spread-layout-axis']   ); // Rules in "L"ayout
    C.probe('A', S['apparent-reading-axis']); // Rules in "A"ppearance
    C.DDD = (() => { switch(S.PPD) { // DDD: Direction-Distance Dictionary
        case 'ltr': return S.ARD != 'ttb' ? { 'left':  -1 , 'right':  1 , 'top': '-1', 'bottom': '1' } : { 'left': '-1', 'right': '1', 'top':  -1 , 'bottom':  1  };
        case 'rtl': return S.ARD != 'ttb' ? { 'left':   1 , 'right': -1 , 'top': '-1', 'bottom': '1' } : { 'left':  '1', 'right':'-1', 'top':  -1 , 'bottom':  1  };
    } })();
};

    C.probe = (L_A, AXIS) => {
        const LR_RL = ['left', 'right']; if(S.PPD != 'ltr') LR_RL.reverse();
        if(AXIS == 'horizontal') {
            C._app(L_A, 'BASE', { b: LR_RL[0], a: LR_RL[1], s: 'top', e: 'bottom' });
            C._app(L_A, 'SIZE', { b: 'height', l: 'width'                         });
            C._app(L_A, 'OOBL', { b: 'top',    l: 'left'                          });
            C._app(L_A, 'OEBL', { b: 'bottom', l: 'right'                         });
            C._app(L_A, 'AXIS', { b: 'y',      l: 'x'                             }); C[L_A + '_AXIS_D'] = S.PPD == 'ltr' ? 1 : -1;
        } else {
            C._app(L_A, 'BASE', { b: 'top', a: 'bottom', s: LR_RL[0], e: LR_RL[1] });
            C._app(L_A, 'SIZE', { b: 'width',  l: 'height'                        });
            C._app(L_A, 'OOBL', { b: 'left',   l: 'top'                           });
            C._app(L_A, 'OEBL', { b: 'right',  l: 'bottom'                        });
            C._app(L_A, 'AXIS', { b: 'x',      l: 'y'                             }); C[L_A + '_AXIS_D'] = 1;
        }
        // BASE: Directions ("B"efore-"A"fter-"S"tart-"E"nd. Top-Bottom-Left-Right on TtB, Left-Right-Top-Bottom on LtR, and Right-Left-Top-Bottom on RtL.)
        // SIZE: Breadth, Length (Width-Height on TtB, Height-Width on LtR and RtL.)
        // OOBL: "O"ffset "O"rigin of "B"readth and "L"ength
        // OEBL: "O"ffset "E"nd of "B"readth and "L"ength
        // AXIS: X or Y for Breadth and Length (X-Y on TtB, Y-X on LtR and RtL), and ±1 for Culcuration of Length (1 on TtB and LtR, -1 on RtL.)
    };

        C._app = (L_A, Gauge, Par) => {
            for(const Pro in Par) C[[L_A, Gauge,                Pro ].join('_')] =                Par[Pro] ,
                                  C[[L_A, Gauge, sML.capitalise(Pro)].join('_')] = sML.capitalise(Par[Pro]);
        };

    C.d2d = (Dir, AOD) => { const Dist = C.DDD[Dir]; return AOD ? Dist * 1 : typeof Dist == 'number' ? Dist : 0; }; // d2d: Direction to Distance // AOD: Allow Orthogonal Direction



