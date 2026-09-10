// Heart of Bibi — Extensions (split from bibi.heart.js; peers via shared context, no cycles)

import { Bibi, O, S, E, X } from './bibi.heart.context.mjs';

//==============================================================================================================================================
//----------------------------------------------------------------------------------------------------------------------------------------------

//-- Extensions

//----------------------------------------------------------------------------------------------------------------------------------------------



X.list = () => {
    const SystemExtensions = [];
    const extension = XP => ({ 'src': O.versionedURL(new URL('../../extensions/' + XP, Bibi.Script.src).href) });
    let ReadyForExtraction = false, ReadyForBibiZine = false;
    if(S['book']) {
        if(O.isToBeExtractedIfNecessary(S['book'])) ReadyForExtraction = true;
        if(S['zine'])                               ReadyForBibiZine   = true;
    } else {
        if(S['accept-local-file'] || S['accept-blob-converted-data']) ReadyForExtraction = ReadyForBibiZine = true;
    }
    return Promise.resolve().then(() => {
        if(!ReadyForExtraction) return X.Extractor = null;
        if(!X.Extractor) return (S['book'] ? O.tryRangeRequest(S['book']).then(() => 'on-the-fly') : Promise.reject()).catch(() => 'at-once').then(_ => SystemExtensions.push(X.Extractor = extension('extractor/' + _ + '.js')))
    }).then(() => {
        if(ReadyForBibiZine) SystemExtensions.push(extension('zine.js'));
        if(!S['allow-scripts-in-content']) SystemExtensions.push(extension('sanitizer.js'));
        if(Bibi.Deb || Bibi.Dev) SystemExtensions.push(extension('../resources/scripts/bibi.x.debv.js'));
        if(SystemExtensions.length) S['extensions'].unshift(...SystemExtensions);
        return S['extensions'];
    });
};

X.load = () => new Promise(resolve => {
    if(S['extensions'].length == 0) return resolve();
    const clean = Scr => Scr && delete Scr.Added && delete Scr.resolve && delete Scr.reject;
    const flush = Scr => Scr && delete Scr.Extension.Script && clean(Scr) && Scr.remove();
    (function load(i) {
        const Xtn = S['extensions'][i];
        new Promise((resolveExtension, rejectExtension) => {
            if(typeof Xtn?.['src'] != 'string') throw `Setting of the Extension is Invalid.`;
            const XO = new URL(Xtn['src']).origin;
            if(!S['trustworthy-origins'].includes(XO)) throw `The Origin of the Extension Is Not Allowed.`;
            Xtn.Script = document.head.appendChild(sML.create('script', {
                className: 'bibi-extension-script', src: Xtn['src'],
                Extension: Xtn, resolve: resolveExtension, reject: rejectExtension
            }));
        })
        .then((    ) => clean(Xtn.Script) && delete Xtn['src'])
        .catch((Err) => flush(Xtn.Script) || O.log(Err + ' %O', Xtn))
        .then(() => S['extensions'][i + 1] ? load(i + 1) : resolve());
    })(0);
}).catch(() => false);

X.add = (XMeta, InitialX) => {
    const XScript = document.currentScript;
    if(XScript.Added) return O.log(`Ignored: %O`, XMeta) || X.through;
    XScript.Added = true;
    try {
             if(typeof XScript.Extension['id'] == 'string' && XScript.Extension['id']) XMeta['id'] = XScript.Extension['id'];
        else if(typeof             XMeta['id'] != 'string' ||            !XMeta['id']) throw `Every extension must have the valid ID.`;
        if(X.hasOwnProperty(XMeta['id']))                                              throw `The ID ("${ XMeta['id'] }") of the extension is reserved or already used by another.`;
        XScript.setAttribute('data-bibi-extension-id', XMeta['id']);
        const Xtn = X[XMeta['id']] = Object.assign(XScript.Extension, XMeta);
        Xtn.Index = X.Extensions.push(Xtn) - 1;
        Promise.resolve(typeof InitialX == 'function' ? InitialX.call(Xtn, Xtn) : InitialX).then(XScript.resolve);
        return function(onR) {         if(Xtn && typeof onR == 'function') E.bind('bibi:readied',  () => onR.call(Xtn, Xtn));
            return function(onP) {     if(Xtn && typeof onP == 'function') E.bind('bibi:prepared', () => onP.call(Xtn, Xtn));
                return function(onO) { if(Xtn && typeof onO == 'function') E.bind('bibi:opened',   () => onO.call(Xtn, Xtn)); }; }; };
    } catch(Err) {
        XScript.reject(Err);
        return X.through;
    }
}, Bibi.x = (...Args) => X.add(...Args);

X.through = () => X.through;

X.clean = () => delete X.list && delete X.load && delete X.add && delete Bibi.x && delete X.through && delete X.clean;
