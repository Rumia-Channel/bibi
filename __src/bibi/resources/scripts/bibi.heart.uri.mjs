// Heart of Bibi — URI-Defined Settings (split from bibi.heart.js; peers via shared context, no cycles)

import { Bibi, R, P, U } from './bibi.heart.context.mjs';

//==============================================================================================================================================
//----------------------------------------------------------------------------------------------------------------------------------------------

//-- URI-Defined Settings (FileName, Queries, Hash, and EPUBCFI)

//----------------------------------------------------------------------------------------------------------------------------------------------




U.translateData = (PnV) => {
    let [_P, _V] = PnV;
    switch(_P) {
        case 'dppd': case 'default-ppd': _P = 'default-page-progression-direction'; break;
        case 'pagination': _P = 'pagination-method'; break;
        case 'view-mode': case 'view': case 'rvm': _P = 'reader-view-mode'; break;
        case 'paged': case 'horizontal': case 'vertical': _V = _P, _P = 'reader-view-mode'; break;
    }
    return [_P, decodeURIComponent(_V)];
};


U.parseQuery = () => {
    const LS = location.search; if(typeof LS != 'string') return;
    let Query = LS.replace(/^\?/, '').split('&').reduce((Query, PnV) => {
        let [_P, _V] = PnV.split('=');
        if(!_V) _V = undefined;
        switch(_P) {
            case 'book': if(!_V) return Query; break;
            case 'log': if(!_V) _V = '1'; break;
            case 'debug': case 'time': case 'wait': case 'zine': if(!_V) _V = 'true'; break;
            default: [_P, _V] = U.translateData([_P, _V]);
        }
        Query[_P] = _V;
        return Query;
    }, {});
    const DistilledQuery = Bibi.applyFilteredSettingsTo({}, Query, [Bibi.SettingTypes, Bibi.SettingTypes_UserOnly]);
    Object.assign(U, DistilledQuery);
    U['Query'] = Object.assign(Query, DistilledQuery);
    delete U.parseQuery;
};


U.parseHash = () => {
    const HashData = {};
    let LocHash = location.hash;
    const CatGroupREStr = '([&#])([a-zA-Z_]+)\\(([^\\(\\)]+)\\)', CatGroups = LocHash.match(new RegExp(CatGroupREStr, 'g'));
    if(CatGroups?.length) CatGroups.forEach(CatGroup => {
        const CatGroupParts = CatGroup.match(new RegExp(CatGroupREStr));
        let Cat = CatGroupParts[2].toLowerCase(), Dat = CatGroupParts[3];
        if(/^(bibi|jo|epubcfi)$/.test(Cat) && Dat) HashData[Cat] = Dat;
        LocHash = LocHash.replace(CatGroup, CatGroupParts[1]);
    });
    HashData['#'] = LocHash.replace(/^#|&$/, '');
    for(const Cat in HashData) {
        if(Cat == 'epubcfi') continue;
        const DataString = HashData[Cat];
        if(typeof DataString == 'string' && DataString) {
            let ParsedData = {}, HasValue = false;
            DataString.split('&').forEach(PnV => {
                const DD = U.translateData(PnV.split('='));
                if(DD && DD[1] != undefined) ParsedData[DD[0]] = DD[1], HasValue = true;
            });
            if(!HasValue) {
                delete HashData[Cat];
                continue;
            }
            HashData[Cat] = Bibi.applyFilteredSettingsTo({}, ParsedData, [Bibi.SettingTypes, Bibi.SettingTypes_UserOnly]);
            delete HashData[Cat]['book'];
        }
    }
    if(HashData['#']      )   Object.assign(U, U['#']       = HashData['#']);
    if(HashData['bibi']   )   Object.assign(U, U['bibi']    = HashData['bibi']);
    if(HashData['jo']     ) { Object.assign(U, U['jo']      = HashData['jo']  ); if(history.replaceState) history.replaceState(null, null, location.href.replace(/[&#]jo\([^\)]*\)$/g, '')); }
    if(HashData['epubcfi'])                    U['epubcfi'] = HashData['epubcfi'];
    delete U.parseHash;
};


U.at1st = () => {
    U.parseQuery();
    U.parseHash();
    if(!U['book']) delete U['zine'];
    if(U['debug']) Bibi.Deb = Bibi.Debug = true, U['log'] = 9;
    delete U.translateData;
    delete U.at1st;
};


U.initialize = () => {
         if(typeof U['nav']  == 'number') U['nav'] < 1 ? delete U['nav'] : R.StartOn = { Nav:  U['nav']  }; // to be converted in L.coordinateLinkages
    else if(typeof U['p']    == 'string')                                  R.StartOn = { P:    U['p']    };
    else if(typeof U['iipp'] == 'number')                                  R.StartOn = { IIPP: U['iipp'] };
    else if(typeof U['edge'] == 'string')                                  R.StartOn = { Edge: U['edge'] };
    else if(typeof U['epubcfi'] == 'string')                               R.StartOn = R.getCFIDestination(U['epubcfi']);
    delete U.initialize;
};



