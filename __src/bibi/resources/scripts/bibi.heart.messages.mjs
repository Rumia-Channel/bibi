// Heart of Bibi — Messages (split from bibi.heart.js; peers via shared context, no cycles)

import { O, S, E, M } from './bibi.heart.context.mjs';

//==============================================================================================================================================
//----------------------------------------------------------------------------------------------------------------------------------------------

//-- Messages

//----------------------------------------------------------------------------------------------------------------------------------------------




M.judge = (Msg, Origin) => !!(O.JoBucket && typeof Msg === 'string' && Origin === O.ParentOrigin && Origin === location.origin);


M.post = Msg => {
    if(!M.judge(Msg, O.ParentOrigin)) return false;
    window.parent.postMessage(Msg, O.ParentOrigin);
    return true;
};


M.receive = Eve => {
    if(!Eve || Eve.source !== window.parent || !M.judge(Eve.data, Eve.origin)) return false;
    let Data;
    try { Data = JSON.parse(Eve.data); } catch { return false; }
    if(!Data || typeof Data !== 'object' || Array.isArray(Data)) return false;
    if(Data.type === 'bibi:api:request') {
        if(!M.handleAPIRequest) return false;
        M.handleAPIRequest(Data).then(Response => M.post(JSON.stringify(Response)));
        return true;
    }
    for(const [EventName, Value] of Object.entries(Data)) if(/^bibi:commands:/.test(EventName)) E.dispatch(EventName, Value);
    return true;
};




