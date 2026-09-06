// Heart of Bibi — Messages (split from bibi.heart.js; peers via shared context, no cycles)

import { O, S, E, M } from './bibi.heart.context.mjs';

//==============================================================================================================================================
//----------------------------------------------------------------------------------------------------------------------------------------------

//-- Messages

//----------------------------------------------------------------------------------------------------------------------------------------------




M.judge = (Msg, Origin) => (O.JoBucket && Msg && typeof Msg == 'string' && Origin && typeof Origin == 'string' && S['trustworthy-origins'].includes(Origin));


M.post = (Msg) => !M.judge(Msg, O.ParentOrigin) ? false : window.parent.postMessage(Msg, window.parent.location.origin);


M.receive = (Eve) => {
    if(!Eve || !M.judge(Eve.data, Eve.origin)) return false; try {
    const Data = JSON.parse(Eve.data);
    if(!Data || typeof Data != 'object') return false;
    for(const EventName in Data) if(/^bibi:commands:/.test(EventName)) E.dispatch(EventName, Data[EventName]);
    return true; } catch(Err) {} return false;
};




