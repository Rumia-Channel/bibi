import './jo.scss';
import { createBucketAPI, receiveBucketMessage } from './jo.api.mjs';

(() => { 'use strict';

const World = typeof window     !== 'undefined' ? window     :
              typeof self       !== 'undefined' ? self       :
              typeof globalThis !== 'undefined' ? globalThis :
              typeof global     !== 'undefined' ? global     : undefined;

if(!World || World['bibi:jo']) return;

const BibiEventRE = /^bibi:[a-z][a-z0-9:_\-]*$/;
const createElement = (TN, Ps) => Object.assign(document.createElement(TN), Ps);
const href = (HRef) => typeof HRef === 'string' && HRef ? new URL(HRef, location.href)?.href || '' : '';

const Jo = World['bibi:jo'] = { 'version': ENV_VERSION, Buckets: [] };
Jo.Bucket = class {
    constructor(Love) {
        let Index = NaN, HRef = '', JoHRef = '', Type = '', Anchor = null, Frame = null, Receiver = null;
        let ToReceive = []; // bibi.heart.js automatically sends ['bibi:initialized', 'bibi:readied', 'bibi:prepared', 'bibi:loaded-book', 'bibi:binded-book', 'bibi:opened'].
        if(Love) try {
            if(Love instanceof HTMLElement) {
                switch(Love.tagName.toLowerCase()) {
                    case 'a':
                        if(!(HRef = href(Love.getAttribute('href')))) throw '~';
                        Anchor = Love;
                        switch(Love.getAttribute('data-bibi').trim()) {
                            case 'embed':
                                Type = 'Embed';
                                Frame = createElement('iframe', Object.entries({
                                    className: Anchor.getAttribute('data-bibi-class')?.trim().replace(/\s+/g, ' '),
                                    id:        Anchor.getAttribute('data-bibi-id')?.trim(),
                                    style:     Anchor.getAttribute('data-bibi-style')?.trim()
                                }).reduce((Ps, [A, V]) => V ? Object.assign(Ps, { [A]: V }) : Ps, {}));
                                break;
                            case 'link':          Type = 'Link'; break;
                            case 'open': default: Type = 'Open'; break;
                        }
                        break;
                    case 'iframe':
                        if(!(HRef = href(Love.getAttribute('data-bibi-href')))) throw '~';
                        Type = 'Embed';
                        Anchor = Love.parentNode.insertBefore(createElement('a', { href: HRef, style: 'display: none !important;' }), Love);
                        Frame  = Love.parentNode.removeChild(Love);
                        break;
                    default: throw '~';
                }
                Receiver = Love;
                ToReceive = (Receive => typeof Receive === 'string' && Receive && Receive.trim().replace(/\s+/, '').split(',').filter(Boolean))(Love.getAttribute('data-bibi-receive')) || [];
            } else if(typeof Love === 'object') {
                if(!(HRef = href(Love['bibi-href']))) throw '~';
                Type = 'Embed';
                Anchor = createElement('a', { href: HRef });
                Frame = Receiver = createElement('iframe');
                ToReceive = (Receive => Array.isArray(Receive) && Receive.map(Receive => Receive.trim().replace(/\s+/, '')).filter(Boolean))(Love['bibi-receive']) || [];
            } else throw '~';
            Index = Jo.Buckets.length;
            JoHRef = HRef + (/#/.test(HRef) ? '&' : '#') + `jo(` + [
                ...new Map([
                    'autostart-embedded', 'autostart',
                    'dress',
                    'book-key', 'content-hash', 'storage-namespace', 'storage-user', 'epubcfi',
                    'fix-reader-view-mode', 'fix-view-mode', 'fix-view',
                    'forget-me',
                    'full-breadth-layout-in-scroll',
                    'iipp',
                    'nav',
                    'p',
                    'preset',
                    'reader-view-mode', 'view-mode', 'view',
                    'start-embedded-in-new-window', 'start-in-new-window',
                    'sugar-for-biscuits',
                    'uiless'
                ].map(K => { let V;
                    if(Love.ownerDocument) V = Love.getAttribute('data-bibi-' + K);
                    else switch(typeof (V = Love['bibi-' + K])) { case 'number': if(V !== V) return; case 'boolean': V = String(V); }
                    return typeof V === 'string' && (V = V.trim()) && (() => { switch(K = (() => { switch(K) {
                        case 'autostart':                      return           'autostart-embedded';
                        case     'view-mode': case     'view': return             'reader-view-mode';
                        case 'fix-view-mode': case 'fix-view': return         'fix-reader-view-mode';
                        case 'start-in-new-window':            return 'start-embedded-in-new-window';
                    } return                                                                       K; })()) {
                        case 'preset': case 'dress': return        /^[_\-\w\d]+(\.[_\-\w\d]+)*$/;
                        case 'iipp':                 return  /^(0|[1-9][0-9]*)(\.[0-9]*[1-9])?$/;
                        case 'nav':                  return                      /^[1-9][0-9]*$/;
                        case 'p':                    return      /^[1-9][0-9]*(\.[1-9][0-9]*)*$/;
                        case 'reader-view-mode':     return /^(auto|paged|horizontal|vertical)$/;
                        case 'sugar-for-biscuits': case 'book-key': case 'content-hash': case 'storage-namespace': case 'storage-user': case 'epubcfi': return /^.+$/;
                    } return                          /^(true|false|1|0|yes|no|mobile|desktop)$/; })().test(V) && [K, V];
                }).filter(Boolean)).entries(),
                ['parent-bibi-index', Index]
            ].map(([K, V]) => K + `=` + encodeURIComponent(V)).join('&') + `)`;
        } catch(Err) { console.log(Err); Love = null; }
        if(!Love) throw '[Jo]: constructor of Jo.Bucket requires 1 argument: an object or an a|iframe element.'; // All You Need Is Love.
        const Bucket = Jo.Buckets[Index] = Anchor.Bucket = Object.assign(this, {
            Index, HRef, JoHRef, Type, Anchor, Frame, Receiver, Status: '', Jo, // Window: defined in bibi.heart.js
            listen:   (EN, fun         ) => BibiEventRE.test(EN) && Bucket.Receiver.addEventListener(EN, Eve => fun.call(Receiver, Eve.detail), false),
            dispatch: (EN, Det = Bucket) => BibiEventRE.test(EN) && Bucket.Receiver.dispatchEvent(new CustomEvent(EN, { detail: Det })),
            receive:  (EN              ) => BibiEventRE.test(EN) && Bucket.Window?.E.add(EN, Det => Bucket.dispatch(EN, Det)),
            post:     (EN, V           ) => BibiEventRE.test(EN) && (Bucket.Frame?.contentWindow || Bucket.Window)?.postMessage(JSON.stringify({ [EN]: V }), Anchor.origin)
        });
        if(Type === 'Embed') Bucket.api = createBucketAPI(Bucket);
        Bucket.listen('bibi:initialized', (Status) => Bucket.Status = Bucket.Initialized = Status); if(ToReceive.length) Bucket.listen('bibi:initialized', () => ToReceive.forEach(EN => Bucket.receive('' + EN.trim())));
        Bucket.listen('bibi:readied',     (Status) => Bucket.Status = Bucket.Readied     = Status);
        Bucket.listen('bibi:prepared',    (Status) => Bucket.Status = Bucket.Prepared    = Status);
        Bucket.listen('bibi:loaded-book', (Status) => Bucket.Status = Bucket.Loaded      = Status);
        Bucket.listen('bibi:binded-book', (Status) => Bucket.Status = Bucket.Binded      = Status);
        Bucket.listen('bibi:opened',      (Status) => Bucket.Status = Bucket.Opened      = Status);
        Bucket.listen('bibi:started',     (Status) => Bucket.Status = Bucket.Started = Status);
        Bucket.listen('bibi:started',     (      ) => Object.assign(Bucket, {
            move:        (Distance) => Bucket.post('bibi:commands:move-by', Distance),
            focus:       (Target  ) => Bucket.post('bibi:commands:focus-on', Target),
            changeView:  (RVM     ) => Bucket.post('bibi:commands:change-view', RVM),
            togglePanel: (        ) => Bucket.post('bibi:commands:toggle-panel', '')
        }));
        Anchor.addEventListener('click', (Eve) => {
            Eve.preventDefault();
            Type === 'Open' ? window.open(JoHRef) : (location.href = JoHRef);
            return false;
        })
        if(Type == 'Embed') {
            Frame.Bucket = Bucket;
            Frame.classList.add('bibi-frame');
            Frame.setAttribute('frameborder', '0');
            Frame.setAttribute('scrolling', 'auto');
            Frame.setAttribute('allowfullscreen', 'true');
            Frame.src = JoHRef;
            Bucket.embed = () => {
                if(!Anchor.ownerDocument) return;
                Anchor.style.setProperty('display', 'none', 'important');
                Anchor.after(Frame);
            };
        }
    };
};

if(typeof window !== 'undefined') Object.assign(Jo, {
    listen:   (EN, fun     ) => BibiEventRE.test(EN) && document.addEventListener(EN, Eve => fun.call(document, Eve.detail)),
    dispatch: (EN, Det = Jo) => BibiEventRE.test(EN) && document.dispatchEvent(new CustomEvent(EN, { detail: Det })),
    process: () => {
        const Processed = [...document.body.querySelectorAll('*[data-bibi]')].map(LoveEle => {
            if(LoveEle.getAttribute('data-bibi-processed')) return;
            LoveEle.setAttribute('data-bibi-processed', 'true');
            return new Jo.Bucket(LoveEle);
        }).filter(Boolean);
        if(!Processed.length) return;
        let ToBeOpened = 0, ToBeEmbedded = 0;
        const Opened = [], Embedded = [];
        Processed.forEach(Bucket => { switch(Bucket.Type) {
            case  'Open':   ToBeOpened++; Bucket.listen('bibi:initialized', () => { Jo.dispatch(  'bibi:jo:opened', Bucket);   Opened.push(Bucket) ===   ToBeOpened && Jo.dispatch(  'bibi:jo:opened-all',   Opened); });                 break;
            case 'Embed': ToBeEmbedded++; Bucket.listen('bibi:initialized', () => { Jo.dispatch('bibi:jo:embedded', Bucket); Embedded.push(Bucket) === ToBeEmbedded && Jo.dispatch('bibi:jo:embedded-all', Embedded); }); Bucket.embed(); break;
        } });
    },
    message: Eve => receiveBucketMessage(Jo, Eve)
}) && (() => {
    document.addEventListener('DOMContentLoaded', Jo.process);
      window.addEventListener('load',             Jo.process);
      window.addEventListener('message',          Jo.message);
})();

})();
