// Heart of Bibi — Operation Utilities (split from bibi.heart.js; peers via shared context, no cycles)

import { Bibi, O, I, U, S, E, X } from './bibi.heart.context.mjs';
import { B } from './bibi.heart.book.mjs';
import { W } from './bibi.heart.wand.mjs';

//==============================================================================================================================================
//----------------------------------------------------------------------------------------------------------------------------------------------

//-- Operation Utilities

//----------------------------------------------------------------------------------------------------------------------------------------------




O.log = (Log, A2, A3) => { let Obj = '', Tag = '';
         if(A3)      Obj = A2, Tag = A3;
    else if(/^<..>$/.test(A2)) Tag = A2;
    else if(A2)      Obj = A2;
    switch(Tag) {
        case '<e/>': return console.error(Log);
        case '</g>': O.log.Depth--;
    }
    if(
        (Log || Obj)
            &&
        (O.log.Depth <= O.log.Limit || Tag == '<b:>' || Tag == '</b>' || Tag == '<*/>')
    ) {
        const Time = (O.log.Depth <= 1) ? O.stamp(Log) : 0;
        let Ls = [], Ss = [];
        if(Log) switch(Tag) {
            case '<b:>': Ls.unshift(`📕`); Ls.push('%c' + Log), Ss.push(O.log.BStyle);                Ls.push(`%c(v${ Bibi['version'] })` + (Bibi.Dev ? ':%cDEV' : '')), Ss.push(O.log.NStyle); if(Bibi.Dev) Ss.push(O.log.BStyle); break;
            case '</b>': Ls.unshift(`📖`); Ls.push('%c' + Log), Ss.push(O.log.BStyle); if(O.log.Time) Ls.push(`%c(${ Math.floor(Time / 1000) + '.' + String(Time % 1000).padStart(3, 0) }sec)`), Ss.push(O.log.NStyle); break;
            case '<g:>': Ls.unshift(`┌`); Ls.push(Log); break;
            case '</g>': Ls.unshift(`└`); Ls.push(Log); break;
          //case '<o/>': Ls.unshift( `>`); Ls.push(Log); break;
            default    : Ls.unshift( `-`); Ls.push(Log);
        }
        for(let i = O.log.Depth; i > 1; i--) Ls.unshift('│');
        Ls.unshift('%cBibi:'); Ss.unshift(O.log.NStyle);
        switch(Tag) {
          //case '<o/>': O.log.log('groupCollapsed', Ls, Ss); console.log(Obj); console.groupEnd(); break;
            default    : O.log.log('log',            Ls, Ss,              Obj                    );
        }
    }
    switch(Tag) {
        case '<g:>': O.log.Depth++;
    }
};

    O.log.initialize = () => {
        if(parent && parent != window) return O.log = () => true;
        O.log.Limit = U.hasOwnProperty('log') && typeof (U['log'] *= 1) == 'number' ? U['log'] : 0;
        O.log.Time = O.log.Limit || U.hasOwnProperty('time');
        O.log.Depth = 1;
        O.log.NStyle = 'font: normal normal 10px/1 Menlo, Consolas, monospace;';
        O.log.BStyle = 'font: normal bold   10px/1 Menlo, Consolas, monospace;';
        O.log.distill = (Logs, Styles) => [Logs.join(' ')].concat(Styles);
        O.log.log = (Method, Logs, Styles, Obj) => {
            const Args = O.log.distill(Logs, Styles);
            if(Obj) Args.push(Obj);
            console[Method].apply(console, Args);
        };
    };
/*
O.logSets = (...Args) => {
    let Repeats = [], Sets = []; Sets.length = 1;
    Args.reverse();
    for(let i = 0; i < Args.length; i++) {
        if(!Array.isArray(Args[i])) Args[i] = [Args[i]];
        Repeats[i] = Sets.length;
        Sets.length = Sets.length * Args[i].length;
    }
    Args.reverse(), Repeats.reverse();
    for(let i = 0; i < Sets.length; i++) Sets[i] = '';
    Args.forEach((_AA, i) => {
        let s = 0;
        while(s < Sets.length) _AA.forEach(_A => {
            let r = Repeats[i];
            while(r--) Sets[s++] += _A;
        });
    });
    Sets.forEach(Set => console.log('- ' + Set + ': ' + eval(Set)));
};*/


O.error = (Err) => {
    O.Busy = false;
    O.HTML.classList.remove('busy');
    O.HTML.classList.remove('loading');
    O.HTML.classList.remove('waiting');
    I.notify(Err, { Type: 'Error', Time: 99999999999 });
    O.log(Err && Err.stack ? Err.stack : Err, '<e/>');
    if(typeof E.dispatch == 'function') E.dispatch('bibi:x_x', typeof Err == 'string' ? new Error(Err) : Err);
};


O.versionedURL = (Url) => Url + (Url.includes('?') ? '&v=' : '?v=') + __BIBI_BUILD_V__; // cache-busting for runtime-loaded app assets (dress/preset/extensions/worker): the per-build id changes every compile, so a stale disk cache can never shadow fresh code

O.chain = (...Args) => {
    const Assurance = typeof Args[0]?.assure !== 'function' ? { assure: () => true } : typeof Args[0] !== 'function' ? Args.shift() : Args[0];
    const { assure } = Assurance;
    const Tasks = Args;
    return (async () => {
        let Value;
        if(!Tasks.length) {
            if(!assure()) throw O.chain.error(Assurance);
        } else {
            for(let l = Tasks.length, i = 0; i < l; i++) {
                if(!assure()) throw O.chain.error(Assurance, Tasks, i);
                Value = await (typeof Tasks[i] != 'function' ? Tasks[i] : Tasks[i](Value));
            }
            if(!assure()) throw O.chain.error(Assurance, Tasks);
        }
        return Value;
    })();
};
    O.chain.error = (Assurance, Tasks, i) => (Assurance.Label && typeof Assurance.Label == 'string' ? `[${ Assurance.Label }] ` : '') + `Assurance failed` + (
                 !Tasks ? '' :
        i !== undefined ? ` before ` + (Tasks.length == 1 ? 'the task' : !i ? `the ${ Tasks.length } tasks`  : `the ${ O.ordinal(i + 1) } of the ${ Tasks.length } tasks (tasks[${ i }])`) :
                           ` after ` + (Tasks.length == 1 ? 'the task' : `all of the ${ Tasks.length } tasks`)
    );


O.ordinal = i => i + (() => {
    if((i = i % 100) < 4 || 20 < i) switch(i % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
    }           return 'th';
})();


O.TimeCard = {};

O.getTimeLabel = (TimeFromOrigin = Date.now() - Bibi.TimeOrigin) => [
    TimeFromOrigin / 1000 / 60 / 60,
    TimeFromOrigin / 1000 / 60 % 60,
    TimeFromOrigin / 1000 % 60
].map(Val => String(Math.floor(Val)).padStart(2, 0)).join(':') + '.' + String(TimeFromOrigin % 1000).padStart(3, 0);

O.stamp = (What, TimeCard = O.TimeCard) => {
    const TimeFromOrigin = Date.now() - Bibi.TimeOrigin;
    const TimeLabel = O.getTimeLabel(TimeFromOrigin);
    if(!TimeCard[TimeLabel]) TimeCard[TimeLabel] = [];
    TimeCard[TimeLabel].push(What);
    return TimeFromOrigin;
};


O.isToBeExtractedIfNecessary = (Path) => {
    if(!Path || !S['extract-if-necessary'].length) return false;
    if(S['extract-if-necessary'].includes('*')) return true;
    if(S['extract-if-necessary'].includes( '')) return !/(\.[\w\d]+)+$/.test(Path);
    for(let l = S['extract-if-necessary'].length, i = 0; i < l; i++) if(new RegExp(S['extract-if-necessary'][i].replace(/\./g, '\\.') + '$', 'i').test(Path)) return true;
    return false;
};


O.src = (Source) => {
    if(!B.Package.Manifest[Source.Path]) B.Package.Manifest[Source.Path] = Source;
    if(!Source['media-type']) Source['media-type'] = O.getMediaType(Source.Path);
    return B.Package.Manifest[Source.Path];
};


O.RangeLoader = null;

O.cancelExtraction = (Source) => Promise.allSettled(
    (Source.Resources || []).concat(Source).map(Res => Res.Retlieved || O.RangeLoader?.abort(Res.Path))
).then(() =>
    E.dispatch('bibi:canceled-extraction', Source)
);

O.extract = (Source) => { 
    Source = O.src(Source);
    if(Source.Retlieving) return Source.Retlieving;
    if(Source.Content) return Promise.resolve(Source);
    if(Source.URI) return O.download(Source);
    return Source.Retlieving = O.RangeLoader.getBuffer(Source.Path).then(ABuf => {
        if(O.isBin(Source)) Source.DataType = 'Blob', Source.Content = new Blob([ABuf], { type: Source['media-type'] });
        else                Source.DataType = 'Text', Source.Content = new TextDecoder('utf-8').decode(new Uint8Array(ABuf));
        Source.Retlieved = true;
        delete Source.Retlieving;
        return Source;
    }).catch(Err => {
        delete Source.Retlieving;
        return Promise.reject(
            O.extract.UseErrorAsIsOnRejection ?                Err :
                  /404/.test(Err) ? Bibi.ErrorMessages.NotFound    :
              /aborted/.test(Err) ? Bibi.ErrorMessages.Canceled    :
                /fetch/.test(Err) ? Bibi.ErrorMessages.CORSBlocked :
            /not found/.test(Err) ? Bibi.ErrorMessages.DataInvalid :
              /invalid/.test(Err) ? Bibi.ErrorMessages.DataInvalid : Err
        );
    });
};          O.extract.UseErrorAsIsOnRejection = false;

O.download = (Source) => {
    Source = O.src(Source);
    if(Source.Retlieving) return Source.Retlieving;
    if(Source.Content) return Promise.resolve(Source);
    const IsBin = O.isBin(Source);
    return Source.Retlieving = W.and('retlieve')(
        Source.URI ? Source.URI : (/^([a-z]+:\/\/|\/)/.test(Source.Path) ? '' : B.Path + '/') + Source.Path,
        IsBin ? 'blob' : 'text'
    ).then(Data => {
        Source.DataType = IsBin ? 'Blob' : 'Text';
        Source.Content = Data;
        Source.Retlieved = true;
        delete Source.Retlieving;
        return Source;
    }).catch(Res => {
        delete Source.Retlieving;
        return Promise.reject(
            Res.status == 404 ? Bibi.ErrorMessages.NotFound :
            Res.status ==   0 ? Bibi.ErrorMessages.CORSBlocked :
        Res.status + ' ' + Res.statusText);
    });
};

O.tryRangeRequest = (RemotePath, Bytes = '0-0') => new Promise((resolve, reject) => {
    if(typeof RemotePath != 'string' || !/^https?:\/\//.test(RemotePath) || !S['trustworthy-origins'].includes(new URL(RemotePath).origin)) return reject();
    const XHR = new XMLHttpRequest();
    XHR.onloadend = () => XHR.status != 206 ? reject() : resolve();
    XHR.open('GET', RemotePath, true);
    if(S['request-with-credentials']) XHR.withCredentials = true;
    XHR.setRequestHeader('Range', 'bytes=' + Bytes);
    XHR.send(null);
});

O.file = (Source, Opt = {}) => new Promise((resolve, reject) => {
    Source = O.src(Source);
    Promise.resolve().then(() => {
        if(Opt.URI && Source.URI) return Source;
        if(Source.Content) return Source;
        if(Source.URI || !B.ExtractionPolicy) return O.download(Source);
        switch(B.ExtractionPolicy) {
            case 'on-the-fly': return O.extract(Source);
            case 'at-once':    return Promise.reject(`File Not Included: "${ Source.Path }"`);
        }
    }).then(() =>
        typeof Opt.initialize == 'function' ? Opt.initialize(Source) : Opt.initialize
    ).then(() =>
        Opt.Preprocess && !Source.Preprocessed ? O.preprocess(Source) : Source
    ).then(() =>
        Opt.URI && !Source.URI && (!Opt.DataURI ? O.createBlobURL : O.createDataURL)(Source.DataType, Source.Content, Source['media-type']).then(SourceURI => {
            Source.URI = SourceURI;
            Source.Content = ''; //////
        })
    ).then(() =>
        typeof Opt.finalize == 'function' ? Opt.finalize(Source) : Opt.finalize
    ).then(() =>
        resolve(Source)
    ).catch(
        reject
    );
});


O.isBin = (Source) => /\.(aac|gif|jpe?g|m4[av]|mp([34]|e?g)|ogg|[ot]tf|pdf|png|web[mp]|woff2?)$/i.test(Source.Path.split('?')[0]);

O.createDataURL = (DT, CB, MT) => new Promise((o, x) => DT == 'Text' ? o(`data:` + MT + `;base64,` + btoa(String.fromCharCode.apply(null, new TextEncoder().encode(CB)))) : (_ => { _.onload = () => o(_.result); _.onerror = x; _.readAsDataURL(CB); })(new FileReader()));
O.createBlobURL = (DT, CB, MT) => Promise.resolve(URL.createObjectURL(DT == 'Text' ? new Blob([CB], { type: MT }) : CB));
// O.consumeBlobURL = (BURL, fn) => { const ReturnValue = fn(BURL); URL.revokeObjectURL(BURL); return ReturnValue; };

O.relativePath = (Opt) => { // Opt: { From: URLObject, To: URLObject, /* AllowRootRelative: Boolean */ }
    let [T, F] = [Opt.To, Opt.From].map(TF => typeof TF == 'string' ? new URL(TF, 'bibi:/') : TF);
    if(T.origin != F.origin) return T.href;
    if(T.pathname == F.pathname) return T.pathname.split('/').slice(-1)[0];
    [T, F] = [T, F].map(TF => TF.pathname.slice(1).split('/'));
    if(Opt.AllowRootRelative) if(T.length == 1 || T[0] != F[0]) return '/' + T.join('/');
    while(T[0] == F[0] && F[0]) T.shift(), F.shift();
    while(F.length > 1) T.unshift('..'), F.shift();
    return T.join('/'); 
};


O.MediaTypes = {
    'pdf'     : 'application/pdf',
    'ya?ml'   : 'application/x-yaml',
    'xht(ml)?': 'application/xhtml+xml',
    'xml'     : 'application/xml',
    'aac'     :       'audio/aac',
    'mp3'     :       'audio/mpeg',
    'otf'     :        'font/opentype',
    'ttf'     :        'font/truetype',
    'woff'    :        'font/woff',
    'woff2'   :        'font/woff2',
    'gif'     :       'image/gif',
    'jpe?g'   :       'image/jpeg',
    'png'     :       'image/png',
    'svg'     :       'image/svg+xml',
    'webp'    :       'image/webp',
    'css'     :        'text/css',
    'js'      :        'text/javascript',
    'html?'   :        'text/html',
    'mp4'     :       'video/mp4',
    'webm'    :       'video/webm'
};

O.getMediaType = (FileName) => {
    for(const Ext in O.MediaTypes) if(new RegExp('\\.' + Ext + '$').test(FileName)) return O.MediaTypes[Ext];
    return null;
};

O.getItemType = (MediaType) => { switch(MediaType?.replace?.(/^([^\/]+\/)?([^\+]*)(\+.+)?$/, '$2')) {
    case 'html': case 'xhtml': case 'xml':            return 'MarkupDocument';
    case 'svg':                                       return 'SVG';
    case 'gif': case 'jpeg': case 'png': case 'webp': return 'BitmapImage';
} return ''; };


O.preprocess = (Source) => {
    Source = O.src(Source);
    const Resources = [];
    const Setting = O.preprocess.getSetting(Source.Path);
    if(!Setting) return Promise.resolve(Source);
    if(typeof Setting.init == 'function') Setting.init(Source);
    const Promises = [];
    if(Setting.ReplaceRules) Source.Content = Setting.ReplaceRules.reduce((SourceContent, Rule) => SourceContent.replace(Rule[0], Rule[1]), Source.Content);
    if(Setting.ResolveRules) { // RRR
        const FileDir = Source.Path.replace(/\/?[^\/]+$/, '');
        Setting.ResolveRules.forEach(ResolveRule => ResolveRule.Patterns.forEach(Pattern => {
            const ResRE = ResolveRule.getRE(Pattern);
            const Reses = Source.Content.match(ResRE);
            if(!Reses) return;
            const ExtRE = new RegExp('\\.(' + Pattern.Extensions + ')$', 'i');
            Reses.forEach(Res => {
                const ResPathInSource = Res.replace(ResRE, ResolveRule.PathRef);
                const ResPaths = O.rrr(FileDir + '/' + ResPathInSource).split('#');
                if(!ExtRE.test(ResPaths[0])) return;
                const Resource = O.src({ Path: ResPaths[0] });
                Resources.push(Resource);
                Promises.push(O.file(Resource, { Preprocess: true, URI: true }).then(ChildSource => {
                    ResPaths[0] = ChildSource.URI;
                    let NewRes = Res;
                    if(ResolveRule.KeepOriginal) {
                        const Original = Res.replace(ResRE, ResolveRule.KeepOriginal[1]);
                        NewRes = NewRes.replace(Original, Original + ResolveRule.KeepOriginal[0] + Original.replace(/^([a-z_A-Z]+):/, '$1-') + ResolveRule.KeepOriginal[2]);
                    }
                    Source.Content = Source.Content.replace(Res, NewRes.replace(ResPathInSource, ResPaths.join('#')));
                }));
            });
        }));
    }
    return Promise.all(Promises).then(() => {
        Source.Preprocessed = true;
        Source.Resources = Resources;
        return Source;
    });
};

    O.preprocess.getSetting = (FilePath) => O.preprocess.Settings.find(Setting => new RegExp('\\.(' + Setting.Extensions + ')$', 'i').test(FilePath)) || null;

    O.preprocess.Settings = [{
        Extensions: 'css',
        ReplaceRules: [
            [/\/\*[.\s\S]*?\*\/|[^\{\}]+\{\s*\}/gm, ''],
            [/[\r\n]+/g, '\n'],
            [/(-(epub|webkit)-)?column-count\s*:\s*1\s*([;\}])/gm, 'column-count: auto$3'],
            [/(-(epub|webkit)-)?text-underline-position\s*:/gm, 'text-underline-position:']
        ],
        init: function() {
            if(!sML.OS.iOS && !sML.OS.Android) this.ReplaceRules.push([/@media([^\(]*\(\s*orientation\s*:)/gm, '@bibi-disabled--media$1']);
            if(!sML.UA.Chromium && !sML.UA.WebKit) [
                [/-(epub|webkit)-/gm, ''],
                [/text-combine-horizontal\s*:\s*([^;\}]+)\s*([;\}])/gm, 'text-combine-upright: $1$2'],
                [/text-combine\s*:\s*horizontal\s*([;\}])/gm, 'text-combine-upright: all$1']
            ].forEach(RR => this.ReplaceRules.push(RR));
            delete this.init;
        },
        ResolveRules: [{
            getRE: () => /@import\s+["'](?!(?:https?|data):)(.+?)['"]/g,
            PathRef: '$1',
            Patterns: [
                { Extensions: 'css' }
            ]
        }, {
            getRE: () => /@import\s+url\(["']?(?!(?:https?|data):)(.+?)['"]?\)/g,
            PathRef: '$1',
            Patterns: [
                { Extensions: 'css' }
            ]
        }, {
            getRE: () => /url\(["']?(?!(?:https?|data):)(.+?)['"]?\)/g,
            PathRef: '$1',
            Patterns: [
                { Extensions: 'gif|jpe?g|[ot]tf|png|svg|webp|woff2?' }
            ]
        }]
    }, {
        Extensions: 'html?|xht(ml)?|xml|svg',
        ReplaceRules: [
            [/<!--\s+[.\s\S]*?\s+-->/gm, '']
        ],
        ResolveRules: [{
            getRE: (Pattern) => new RegExp(`<\\??\\s*${ Pattern.TagName }\\s(?:[^>]*?\\s)?((?:${ Pattern.AttributeName })\\s*=\\s*["\'](?!(?:https?|data):)(.+?)[\'"])`, 'g'),
            KeepOriginal: [` data-bibi-original-`, '$1', ''],
            PathRef: '$2',
            Patterns: [
                { TagName: '(?!a)[a-zA-Z:\\-]+', AttributeName: '(?:xlink:)?href', Extensions: 'css|gif|jpe?g|png|svg|webp' },
                { TagName: '[a-zA-Z:\\-]+',      AttributeName: 'src|data',        Extensions: 'aac|gif|jpe?g|js|m4[av]|mp([34]|e?g)|ogg|png|svg|web[mp]' },
                { TagName: 'video',              AttributeName: 'poster',          Extensions: 'gif|jpe?g|png|svg|webp' }
            ]
        }]
    }];


O.parseDOM = (...Args) => new DOMParser().parseFromString(...Args);

O.openDocument = (Source) => O.file(Source).then(Source => O.parseDOM(Source.Content, /\.(xml|opf|ncx)$/i.test(Source.Path) ? 'text/xml' : 'application/xhtml+xml'));


O.forEachCSSRuleOf = (Doc = document, fun) => {
    if(!Doc.styleSheets || typeof fun != 'function') return;
    Array.prototype.forEach.call(Doc.styleSheets, StyleSheet => {
        if(/^http/.test(StyleSheet.href)) return;
        (function forCSSRules(CSSRules) {
            Array.prototype.forEach.call(CSSRules, CSSRule => {
                switch(CSSRule.constructor.name) {
                    case 'CSSStyleRule': fun(CSSRule); break;
                    case 'CSSImportRule': forCSSRules(CSSRule.styleSheet.cssRules); break;
                    case 'CSSMediaRule': forCSSRules(CSSRule.cssRules); break;
                    case 'CSSFontFaceRule': break;
                    default: break; // console.log(CSSRule.constructor.name, CSSRule);
                }
            });
        })(StyleSheet.cssRules);
    });
};


O.getWritingMode = (Ele) => {
    const WMP = O.WritingModeProperty, CS = getComputedStyle(Ele);
    if(!WMP)                                return (CS['direction'] == 'rtl' ? 'rl' : 'lr') + '-tb';
    switch(CS[WMP]) { case 'horizontal-tb': return (CS['direction'] == 'rtl' ? 'rl' : 'lr') + '-tb';
                      case   'vertical-rl': return (CS['direction'] == 'rtl' ? 'bt' : 'tb') + '-rl';
                      case   'sideways-rl': return (CS['direction'] == 'rtl' ? 'bt' : 'tb') + '-rl';
                      case   'vertical-lr': return (CS['direction'] == 'rtl' ? 'bt' : 'tb') + '-lr';
                      case   'sideways-lr': return (CS['direction'] == 'rtl' ? 'tb' : 'bt') + '-lr';
    }                                       return  CS[WMP];
};


O.getElementInnerText = (Ele) => {
    let InnerText = 'InnerText';
    const Copy = document.createElement('div');
    Copy.innerHTML = Ele.innerHTML.replace(/ (src(set)?|source|(xlink:)?href)=/g, ' data-$1=');
    sML.forEach(Copy.querySelectorAll('svg'   ))(Ele => Ele.parentNode.removeChild(Ele));
    sML.forEach(Copy.querySelectorAll('video' ))(Ele => Ele.parentNode.removeChild(Ele));
    sML.forEach(Copy.querySelectorAll('audio' ))(Ele => Ele.parentNode.removeChild(Ele));
    sML.forEach(Copy.querySelectorAll('img'   ))(Ele => Ele.parentNode.removeChild(Ele));
    sML.forEach(Copy.querySelectorAll('script'))(Ele => Ele.parentNode.removeChild(Ele));
    sML.forEach(Copy.querySelectorAll('style' ))(Ele => Ele.parentNode.removeChild(Ele));
    /**/ if(typeof Copy.textContent != 'undefined') InnerText = Copy.textContent;
    else if(typeof Copy.innerText   != 'undefined') InnerText = Copy.innerText;
    return InnerText.replace(/[\r\n\s\t ]/g, '');
};


O.getElementCoord = (Ele, OPa) => {
    const Coord = { X: Ele.offsetLeft, Y: Ele.offsetTop };
    OPa = OPa && OPa.tagName ? OPa : null;
    while(Ele.offsetParent != OPa) Ele = Ele.offsetParent, Coord.X += Ele.offsetLeft, Coord.Y += Ele.offsetTop;
    return Coord;
};


O.getViewportZooming = () => document.body.clientWidth / window.innerWidth;


O.rrr = (Path) => { // resolve relative reference
    // return new URL(Path.replace(/(^|[^:\/])\/{2,}/g, '$1/'), 'https://bibi/').href.replace(/^https:\/\/bibi\//, '');
    const VirtualLoc = new URL(Path.replace(/(^|[^:\/])\/{2,}/g, '$1/'), 'https://bibi/');
    const RelativePath = VirtualLoc.pathname.replace(/^\/+/, '');
    const HashString = VirtualLoc.hash ? VirtualLoc.hash.replace(/^#/, '') : '';
    return RelativePath + (HashString ? '#' + HashString : '');
};


O.getViewportByMetaContent = (Str) => {
    if(typeof Str == 'string' && /width/.test(Str) && /height/.test(Str)) {
        Str = Str.replace(/\s+/g, '');
        const W = Str.replace( /^.*?width=(\d+).*$/, '$1') * 1;
        const H = Str.replace(/^.*?height=(\d+).*$/, '$1') * 1;
        if(!isNaN(W) && !isNaN(H)) return { Width: W, Height: H };
    }
    return null;
};

O.getViewportByViewBox = (Str) => {
    if(typeof Str == 'string') {
        const XYWH = Str.replace(/^\s+/, '').replace(/\s+$/, '').split(/\s+/);
        if(XYWH.length == 4) {
            const W = XYWH[2] * 1;// - XYWH[0] * 1;
            const H = XYWH[3] * 1;// - XYWH[1] * 1;
            if(!isNaN(W) && !isNaN(H)) return { Width: W, Height: H };
        }
    }
    return null;
};

O.getViewportByImage = (Img) => {
    if(Img && /^img$/i.test(Img.tagName)) {
        const ImageStyle = getComputedStyle(Img);
        return { Width: parseInt(ImageStyle.width), Height: parseInt(ImageStyle.height) };
    }
    return null;
};

O.getViewportByOriginalResolution = (Str) => {
    if(typeof Str == 'string') {
        const WH = Str.replace(/\s+/, '').split('x');
        if(WH.length == 2) {
            const W = WH[0] * 1;
            const H = WH[1] * 1;
            if(!isNaN(W) && !isNaN(H)) return { Width: W, Height: H };
        }
    }
    return null;
};

O.getItemViewport = async (Item) => O.getItemViewport.as[Item.Type]?.(Item) || null; /* + */ O.getItemViewport.as = {
  'MarkupDocument': async (Item) => O.getViewportByMetaContent(O.parseDOM(Item.Source.Content.replace(/(<body(\s[^>]*)?>)(.|\s)*?(<\/body>)/, '$1$4'), Item.Source['media-type'])?.querySelector('meta[name="viewport"]')?.getAttribute('content')),
             'SVG': async (Item) => O.getViewportByViewBox(    O.parseDOM(Item.Source.Content.replace( /(<svg(\s[^>]*)?>)(.|\s)*?(<\/svg>)/ , '$1$4'), Item.Source['media-type'])?.documentElement?.getAttribute('viewBox')),
     'BitmapImage': async (Item) => new Promise((o, x) => sML.create('img', { onload: function() { const W = this.naturalWidth, H = this.naturalHeight; W && H ? o({ Width: W, Height: H }) : x(); }, onerror: x }).src = Item.Source.URI).catch(() => null)
};


O.isPointableContent = (Ele) => {
    while(Ele) {
        if(/^(a|audio|video)$/i.test(Ele.tagName)) return true;
        Ele = Ele.parentElement;
    }
    return false;
};


O.stopPropagation = (Eve) => { Eve.stopPropagation(); return false; };

O.preventDefault  = (Eve) => { Eve.preventDefault();  return false; };


O.CFIManager = { // Utilities for EPUBCFI (An Example Is at the Bottom of This Object)
    CFI: '',
    Current: 0,
    Log: false,
    LogCorrection: false,
    LogCancelation: false,
    parse: function(CFI, Scope) {
        if(!CFI || typeof CFI != 'string') return null;
        try { CFI = decodeURIComponent(CFI); } catch(Err) { this.log(0, `Unregulated URIEncoding.`); return null; }
        if(!Scope || typeof Scope != 'string' || typeof this['parse' + Scope] != 'function') Scope = 'Fragment';
        if(Scope == 'Fragment') CFI = CFI.replace(/^(epubcfi\()?/, 'epubcfi(').replace(/(\))?$/, ')');
        this.CFI = CFI, this.Current = 0;
        if(this.Log) {
            this.log(1, `Bibi EPUBCFI`);
            this.log(2, `parse`);
            this.log(3, `CFI: ${ this.CFI }`);
        }
        return this['parse' + Scope]();
    },
    parseFragment: function() {
        const Foothold = this.Current;
        if(!this.parseString('epubcfi(')) return this.cancel(Foothold, `Fragment`);
        const CFIStructure = this.parseCFI();
        if(CFIStructure === null) return this.cancel(Foothold);
        if(!this.parseString(')')) return this.cancel(Foothold, `Fragment`);
        return CFIStructure;
    },
    parseCFI: function() {
        const Foothold = this.Current, CFIStructure = { Type: 'CFI', Path: this.parsePath() };
        if(!CFIStructure.Path) return this.cancel(Foothold, `CFI`);
        if(this.parseString(',')) {
            CFIStructure.Start = this.parseLocalPath();
            if(!CFIStructure.Start.Steps.length && !CFIStructure.Start.TermStep) return this.cancel(Foothold, `CFI > Range`);
            if(!this.parseString(',')) return this.cancel(Foothold, 'CFI > Range');
            CFIStructure.End   = this.parseLocalPath();
            if(  !CFIStructure.End.Steps.length &&   !CFIStructure.End.TermStep) return this.cancel(Foothold, `CFI > Range`);
        }
        return CFIStructure;
    },
    parsePath: function() {
        const Foothold = this.Current, Path = { Type: 'Path', Steps: [this.parseStep()] }, LocalPath = this.parseLocalPath();
        if(!Path.Steps[0]) return this.cancel(Foothold, `Path`);
        if(LocalPath) Path.Steps = Path.Steps.concat(LocalPath.Steps);
        else return this.cancel(Foothold, `Path`);
        return Path;
    },
    parseLocalPath: function() {
        const Foothold = this.Current, LocalPath = { Type: 'LocalPath', Steps: [] };
        let StepRoot = LocalPath, Step = this.parseStep('Local'), TermStep = null;
        while(Step !== null) {
            StepRoot.Steps.push(Step);
            Step = this.parseStep('Local');
            if(!Step) break;
            if(Step.Type == 'IndirectStep') {
                const IndirectPath = { Type: 'IndirectPath', Steps: [] };
                StepRoot.Steps.push(IndirectPath);
                StepRoot = IndirectPath;
            } else if(Step.Type == 'TermStep') {
                TermStep = Step;
                break;
            }
        }
        if(TermStep) StepRoot.Steps.push(TermStep);
        return (LocalPath.Steps.length ? LocalPath : null);
    },
    parseStep: function(Local) {
        const Foothold = this.Current, Step = {};
             if(         this.parseString( '/')) Step.Type =         'Step';
        else if(Local && this.parseString('!/')) Step.Type = 'IndirectStep';
        else if(Local && this.parseString( ':')) Step.Type =     'TermStep';
        else                                     return this.cancel(Foothold, `Step`);
        Step.Index = this.parseString(/^(0|[1-9][0-9]*)/);
        if(Step.Index === null) return this.cancel(Foothold, `Step`);
        Step.Index = parseInt(Step.Index);
        if(this.parseString('[')) {
            if(Step.Type != 'TermStep') {
                Step.ID = this.parseString(/^[a-zA-Z_:][a-zA-Z0-9_:\-\.]+/);
                if(!Step.ID) return this.cancel(Foothold, `Step > Assertion > ID`);
            } else {
                const CSV = [], ValueRegExp = /^((\^[\^\[\]\(\)\,\;\=])|[_a-zA-Z0-9%\- ])*/;
                CSV.push(this.parseString(ValueRegExp));
                if(this.parseString(',')) CSV.push(this.parseString(ValueRegExp));
                if(CSV[0]) Step.Preceding = CSV[0];
                if(CSV[1]) Step.Following = CSV[1];
                const Side = this.parseString(/^;s=/) ? this.parseString(/^[ab]/) : null;
                if(Side) Step.Side = Side;
                if(!Step.Preceding && !Step.Following && !Step.Side) return this.cancel(Foothold, `Step > Assertion > TextLocation`);
            }
            if(!this.parseString(']')) return this.cancel(Foothold, `Step > Assertion`);
        }
        return Step;
    },
    parseString: function(TheString) {
        let Correction = null, Matched = false;
        if(TheString instanceof RegExp) {
            const CFI = this.CFI.substring(this.Current, this.CFI.length);
            if(TheString.test(CFI)) {
                Matched = true;
                TheString = CFI.match(TheString)[0];
            }
        } else if(this.CFI.substring(this.Current, this.Current + TheString.length) === TheString) {
            Matched = true;
        }
        if(Matched) {
            this.Current += TheString.length;
            Correction = TheString;
        }
        return this.correct(Correction);
    },
    correct: function(Correction) {
        if(this.Log && this.LogCorrection && Correction) this.log(3, Correction);
        return Correction;
    },
    cancel: function(Foothold, Parser) {
        if(this.Log && this.LogCancelation) this.log(4, `cancel: parse ${ Parser } (${ Foothold }-${ this.Current }/${ this.CFI.length })`);
        if(typeof Foothold == 'number') this.Current = Foothold;
        return null;
    },
    log: function(Lv, Message) {
        if(!this.Log) return;
             if(Lv == 0) Message = `[ERROR] ${ Message }`;
        else if(Lv == 1) Message = `---------------- ${ Message } ----------------`;
        else if(Lv == 2) Message = Message;
        else if(Lv == 3) Message = ` - ${ Message }`;
        else if(Lv == 4) Message = `   . ${ Message }`;
        O.log(`EPUBCFI: ${ Message }`);
    }
    /* -----------------------------------------------------------------------------------------------------------------
    // EXAMPLE:
    O.CFIManager.parse('epubcfi(/6/4!/4/10!/4/2:32[All%20You%20Need%20Is,%20Love;s=a])'); // returns following object.
    --------------------------------------------------------------------------------------------------------------------
    {
        Type: 'CFI',
        Path: {
            Type: 'Path',
            Steps: [
                {
                    Type: 'Step',
                    Index: '6'
                },
                {
                    Type: 'Step',
                    Index: '4'
                },
                {
                    Type: 'IndirectPath',
                    Steps: [
                        {
                            Type: 'IndirectStep',
                            Index: '4'
                        },
                        {
                            Type: 'Step',
                            Index: '10'
                        },
                        {
                            Type: 'IndirectPath',
                            Steps: [
                                {
                                    Type: 'IndirectStep',
                                    Index: '4'
                                },
                                {
                                    Type: 'Step',
                                    Index: '2'
                                }
                            ],
                            TermStep: {
                                Type: 'TermStep',
                                Index: '32',
                                Preceding: 'All You Need Is',
                                Following: ' Love',
                                Side: 'a'
                            }
                        }
                    ]
                }
            ]
        }
    }
    ----------------------------------------------------------------------------------------------------------------- */
};


O.inhibit = () => { // What a...
    if(!Array.isArray(S['inhibit']) || !S['inhibit'].length) return;
    const InhibitAll = S['inhibit'].includes('*');
    const VPs = ['-webkit-', '-moz-', ''];
    const ActionsOnPostprocessedItem = [];
    if(InhibitAll || S['inhibit'].includes('selecting')) {
        ActionsOnPostprocessedItem.push(Item => VPs.forEach(Prefix => ['user-select', 'user-drag'].forEach(Property => Item.Body.style[Prefix + Property] = 'none')));
    }
    if(InhibitAll || S['inhibit'].includes('saving-images')) {
        ActionsOnPostprocessedItem.push(Item => sML.forEach(Item.Body.querySelectorAll('img, image, svg'))(Img => {
            VPs.forEach(Prefix => {
                ['user-select', 'user-drag'].forEach(Property => Img.style[Prefix + Property] = 'none');
                if(O.Touch) Img.style[Prefix + 'pointer-events'] = 'none';
            });
            Img.draggable = false;
            Img.addEventListener('contextmenu', O.preventDefault);
        }));
    }
    if(InhibitAll || S['inhibit'].includes('contextual-menu')) {
        ActionsOnPostprocessedItem.push(Item => Item.contentDocument.addEventListener('contextmenu', O.preventDefault));
    }
    if(InhibitAll || S['inhibit'].includes('printing')) {
        window.addEventListener('beforeprint', () => (O.HTML.style.background = 'transparent') && (O.Body.style.visibility = 'hidden'));
        window.addEventListener( 'afterprint', () => (O.HTML.style.background =            '') || (O.Body.style.visibility =       ''));
        const CSSURLs = ((CSSs, Zero) => CSSs.map(CSS => URL.createObjectURL(new Blob([`@charset "utf-8";`, '\n', Object.keys(CSS).map(Sel => [Sel, '{', (CSS[Sel] || Zero), '}'].join(' ')).join('\n').replace(/;/g, ' !important;')], { type: 'text/css' }))))([{
            'html, html:before': [
                `display: block; visibility: visible; box-sizing: border-box; overflow: hidden;`,
                `top: 0; right: 0; bottom: 0; left: 0; inset: 0; margin: 0; border: none 0;`,
                `width: 100%; height: 100%; inline-size: 100%; block-size: 100%; min-width: 100%; min-height: 100%; min-inline-size: 100%; min-block-size: 100%; max-width: 100%; max-height: 100%; max-inline-size: 100%; max-block-size: 100%;`,
                `background: transparent; opacity: 1;`,
            ].join(' '),
            'html': `position: static; z-index: auto; padding: 0; font: normal 0/0 sans-serif; color: transparent;`,
            'html:before': `content: "(non-printable)"; position: fixed; z-index: 88; padding: 44% 0 0; text-align: center; font: normal 8vw/2 HelveticaNeue, Helvetica, Arial, sans-serif; color: rgb(234,234,234);`,
            'html:after, html *': null
        }, {
            'html, html:before, html:after, html *' : null
        }], [
            `content: none; display: none; visibility: hidden; box-sizing: border-box; overflow: hidden;`,
            `position: absolute; z-index: 0; top: 0; right: 0; bottom: 0; left: 0; inset: 0; margin: 0; border: none 0; padding: 0;`,
            `width: 0; height: 0; inline-size: 0; block-size: 0; min-width: 0; min-height: 0; min-inline-size: 0; min-block-size: 0; max-width: 0; max-height: 0; max-inline-size: 0; max-block-size: 0;`,
            `font: normal 0/0 sans-serif; color: transparent; background: transparent; opacity: 0;`
        ].join(' '));
        const appendLink = (Doc, i) => Doc.head.appendChild(sML.create('link', { rel: 'stylesheet', media: 'print', href: CSSURLs[i] }));
        const repairLink = (Doc, i) => Doc.querySelector('link[media~="print"][href^="' + CSSURLs[i] + '"]') || appendLink(Doc, i);
        const manageLink = (Win, i) => {
            const Doc = Win.document, Windows = [window]; if(Win != window) Windows.push(Win);
            Windows.forEach(Window => {
                Window.addEventListener('beforeprint', () => repairLink(Doc, i));
                Window.addEventListener( 'afterprint', () => repairLink(Doc, i));
            });
            appendLink(Doc, i);
        };
        manageLink(window, 0), ActionsOnPostprocessedItem.push(Item => manageLink(Item.contentWindow, 1));
    }
    if(ActionsOnPostprocessedItem.length) E.bind('bibi:postprocessed-item', (Item) => ActionsOnPostprocessedItem.forEach(action => action(Item)));
};




