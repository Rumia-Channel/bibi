// Heart of Bibi — shared state (shells + initials; imports nothing: cycle-free hub)

export const Bibi = { 'version': ENV_VERSION, 'href': 'https://bibi.epub.link', Status: '', TimeOrigin: Date.now() }; /**/ Bibi.Dev = Bibi.Development = ENV_DEVELOPMENT;

export const L = { // Bibi.Loader
    Opened: false
};

export const R = { // Bibi.Reader
    Spreads: [], Items: [], Pages: [],
    NonLinearItems: [],
    IntersectingPages: [], Current: {}
};

export const I = {}; // Bibi.UserInterfaces

export const P = {}; // Bibi.Preset

export const U = {};

export const D = {};

export const S = {}; // Bibi.Settings

export const C = {};

export const O = {}; // Bibi.Operator

export const E = {};

export const M = {}; // Bibi.Messages

export const X = { // Bibi.Extensions
    Bibi: {}, Extensions: [], Extractor: null
};
// sML v3 compat — v3 dropped the v1 subsystems our code relies on (sML@3 vs 1.0.37).
// Restored here, ported verbatim from sml.js@1.0.37 (MIT, © Satoru Matsushima) unless noted.
// Call restoreSMLv1Subsystems() once the sML global exists (bibi.js does, right after self.sML assignment);
// everything below only touches the sML object, never the DOM, so it is safe to call early.
export const restoreSMLv1Subsystems = () => {
    if(typeof sML == 'undefined' || !sML) return false;
    if(!sML.UA) Object.defineProperty(sML, 'UA', { get: () => sML.UserAgent }); // v3 rename
    if(sML.UserAgent && typeof navigator != 'undefined' && navigator.userAgentData && Array.isArray(navigator.userAgentData.brands)) {
        const BnV = navigator.userAgentData.brands.reduce((M, _) => (M[_.brand] = [_.version * 1], M), {}); // v1 semantics; v3 stored the map itself (cyclic), breaking JSON round-trips
        ['Blink', 'Chromium', 'Chrome', 'Edge', 'Opera'].forEach(K => {
            const Brand = K == 'Blink' ? 'Chromium' : K == 'Chrome' ? 'Google Chrome' : K == 'Edge' ? 'Microsoft Edge' : K;
            if(sML.UserAgent[K] && !Array.isArray(sML.UserAgent[K]) && BnV[Brand]) sML.UserAgent[K] = BnV[Brand];
        });
    }
    if(!sML.OS) Object.defineProperty(sML, 'OS', { get: () => sML.OperatingSystem }); // v3 rename
    if(!sML.Environments) Object.defineProperty(sML, 'Environments', { get: () => [sML.OperatingSystem, sML.UserAgent].reduce((Env, OS_UA) => { for(const Par in OS_UA) if(OS_UA[Par]) Env.push(Par); return Env; }, []) });
    if(!sML.limitMin) sML.limitMin = (Num, Min) => (Num < Min) ? Min : Num;
    if(!sML.limitMax) sML.limitMax = (Num, Max) => (Max < Num) ? Max : Num;
    if(!sML.limitMinMax) sML.limitMinMax = (Num, Min, Max) => sML.clamp(Min, Num, Max); // v3 generalized to clamp(Min, Num, Max)
    if(sML.forEach) { const v3forEach = sML.forEach.bind(sML); sML.forEach = (Col, fun, This) => (typeof fun == 'function' ? v3forEach(Col, fun, This) : ((f, T) => v3forEach(Col, f, T))); } // v1 was curried-only: forEach(Col)(fun)
    if(!sML.replaceClass) sML.replaceClass = (Ele, Old, New) => { if(Ele.classList.contains(Old)) Ele.classList.remove(Old); return Ele.classList.add(New); };
    if(!sML.preventDefault) sML.preventDefault = (Eve) => Eve.preventDefault();
    if(!sML.apply) sML.apply = (Par = {}, ExceptFunctions) => {
        if(Par.From && Par.To) {
            if(ExceptFunctions) { for(const Pro in Par.From) if(typeof Par.To[Pro] != 'function' && typeof Par.From[Pro] != 'function') Par.To[Pro] = Par.From[Pro]; }
            else                { for(const Pro in Par.From)                                                                            Par.To[Pro] = Par.From[Pro]; }
        }
        return Par.To;
    };
    if(!sML.applyRtL) sML.applyRtL = (To, From, ExceptFunctions) => sML.apply({ From: From, To: To }, ExceptFunctions);
    if(!sML.Easing) sML.Easing = (() => { // only the equations our code uses (+linear, Scroller's default)
        const pow = Math.pow, sqr = Math.sqrt, BackA = 1.70158, BackAp = BackA + 1;
        return {
            linear: (P) => P,
            easeOutCirc: (P) => sqr(1 - pow(P - 1, 2)),
            easeOutBack: (P) => 1 + BackAp * pow(P - 1, 3) + BackA * pow(P - 1, 2),
            easeInOutExpo: (P) => !P ? 0 : P == 1 ? 1 : ((P *= 2) < 1 ? pow(2, --P * 10) : 2 - pow(2, --P * -10)) / 2,
        };
    })();
    if(!sML.Coords) sML.Coords = {
        getXY: (X, Y) => ({ X: X, Y: Y }),
        getWidthHeight: (Width, Height) => ({ Width: Width, Height: Height }),
        getScreenSize: function() { return this.getWidthHeight(screen.availWidth, screen.availHeight); },
        getScrollSize: function(Obj) { if(!Obj || Obj == window || Obj == document) Obj = document.documentElement; return this.getWidthHeight(Obj.scrollWidth, Obj.scrollHeight); },
        getOffsetSize: function(Obj) { if(!Obj || Obj == window) Obj = document.documentElement; if(Obj == document) return this.getScrollSize(document.documentElement); return this.getWidthHeight(Obj.offsetWidth, Obj.offsetHeight); },
        getClientSize: function(Obj) { if(!Obj || Obj == window) Obj = document.documentElement; if(Obj == document) return this.getScrollSize(document.documentElement); return this.getWidthHeight(Obj.clientWidth, Obj.clientHeight); },
        getDocumentSize: function() { return this.getScrollSize(document.documentElement); },
        getWindowSize: function() { return this.getOffsetSize(document.documentElement); },
        getElementSize: function(Obj) { return this.getOffsetSize(Obj); },
        getWindowCoord: function() { return this.getXY((window.screenLeft || window.screenX), (window.screenTop || window.screenY)); },
        getElementCoord: function(Obj) { let X = Obj.offsetLeft, Y = Obj.offsetTop; while(Obj.offsetParent) Obj = Obj.offsetParent, X += Obj.offsetLeft, Y += Obj.offsetTop; return this.getXY(X, Y); },
        getScrollCoord: function(Obj) { if(!Obj || Obj == window) return this.getXY((window.scrollX || window.pageXOffset || document.documentElement.scrollLeft), (window.scrollY || window.pageYOffset || document.documentElement.scrollTop)); return this.getXY(Obj.scrollLeft, Obj.scrollTop); },
        getScrollLimitCoord: function(Obj) { if(!Obj || Obj == window) Obj = document.documentElement; const SS = this.getScrollSize(Obj), OS = this.getClientSize(Obj); return this.getXY(SS.Width - OS.Width, SS.Height - OS.Height); },
        getEventCoord: function(Eve) { return (Eve ? this.getXY(Eve.pageX, Eve.pageY) : this.getXY(0, 0)); },
        getCoord: function(Obj) {
            let XY, WH;
            if(Obj.tagName) XY = this.getElementCoord(Obj), WH = this.getOffsetSize(Obj);
            else if(Obj == window) XY = this.getScrollCoord(), WH = this.getOffsetSize(document.documentElement);
            else if(Obj == document) XY = { X: 0, Y: 0 }, WH = this.getScrollSize(document.documentElement);
            else if(Obj == screen) XY = { X: 0, Y: 0 }, WH = this.getScreenSize();
            return { X: XY.X, Y: XY.Y, Top: XY.Y, Right: XY.X + WH.Width, Bottom: XY.Y + WH.Height, Left: XY.X, Width: WH.Width, Height: WH.Height };
        }
    };
    if(!sML.getCoord) sML.getCoord = function() { return sML.Coords.getCoord.apply(sML.Coords, arguments); };
    if(!sML.Scroller) sML.Scroller = {
        scrollTo: function(FXY, Opt = {}) {
            const Frame = (FXY.Frame && FXY.Frame instanceof HTMLElement) ? FXY.Frame : window;
            let Stg = {};
            if(Frame.sMLScrollerSetting) { Stg = Frame.sMLScrollerSetting; Stg.cancel(); }
            else {
                Stg = Frame.sMLScrollerSetting = { Frame: Frame };
                Stg.scrollTo = (Stg.Frame === window) ? (X, Y) => window.scrollTo(X, Y) : (X, Y) => { Stg.Frame.scrollLeft = X, Stg.Frame.scrollTop = Y; };
                Stg.cancel = () => { Stg.removeScrollCancelation(); if(Stg.oncanceled) Stg.oncanceled(); };
                Stg.addScrollCancelation = () => ['keydown', 'mousedown', 'touchstart', 'wheel'].forEach(EN => Stg.Frame.addEventListener(EN, Stg.cancel));
                Stg.removeScrollCancelation = () => ['keydown', 'mousedown', 'touchstart', 'wheel'].forEach(EN => Stg.Frame.removeEventListener(EN, Stg.cancel));
                Stg.preventUserScrolling = () => ['keydown', 'mousedown', 'touchstart', 'wheel'].forEach(EN => Stg.Frame.addEventListener(EN, sML.preventDefault));
                Stg.allowUserScrolling = () => ['keydown', 'mousedown', 'touchstart', 'wheel'].forEach(EN => Stg.Frame.removeEventListener(EN, sML.preventDefault));
            }
            if(FXY instanceof HTMLElement) Stg.Target = sML.Coords.getElementCoord(FXY); // v1 referenced sML.Coord (missing even there); Coords is the intended object
            else if(typeof FXY == 'number') Stg.Target = { Y: FXY };
            else if(FXY) Stg.Target = { X: FXY.X, Y: FXY.Y };
            else Stg.Target = {};
            Stg.Start = sML.Coords.getScrollCoord(Stg.Frame);
            Stg.StartedOn = new Date().getTime();
            if(typeof Stg.Target.X != 'number') Stg.Target.X = Stg.Start.X;
            if(typeof Stg.Target.Y != 'number') Stg.Target.Y = Stg.Start.Y;
            Stg.Duration = (typeof Opt.Duration == 'number' && Opt.Duration >= 0) ? Opt.Duration : 100;
            if(!Stg.Duration) { Stg.scrollTo(Stg.Target.X, Stg.Target.Y); return Promise.resolve(); }
            switch(typeof Opt.ease) {
                case 'function': Stg.ease = Opt.ease; break;
                case 'string': Stg.ease = sML.Easing[Opt.ease] ? sML.Easing[Opt.ease] : sML.Easing.linear; break;
                default: Stg.ease = sML.Easing.linear; break;
            }
            Stg.ForceScroll = Opt.ForceScroll;
            let recover;
            if(Stg.ForceScroll) Stg.preventUserScrolling(), recover = () => Stg.allowUserScrolling();
            else Stg.addScrollCancelation(), recover = () => Stg.removeScrollCancelation();
            Stg.after = () => { clearTimeout(Stg.Timer); delete Stg.oncanceled; delete this.Scrolling; recover(); };
            return new Promise((resolve, reject) => {
                Stg.oncanceled = () => { Stg.after(); reject(); };
                Stg.resolve = () => resolve();
                this.Scrolling = Stg;
                this.scrollInProgress();
            }).then(() => { Stg.scrollTo(Stg.Target.X, Stg.Target.Y); Stg.after(); });
        },
        scrollInProgress: function() {
            const Stg = this.Scrolling;
            const Passed = new Date().getTime() - Stg.StartedOn;
            if(Stg.Duration <= Passed) return Stg.resolve();
            const Progress = Stg.ease(Passed / Stg.Duration);
            Stg.scrollTo(Math.round(Stg.Start.X + (Stg.Target.X - Stg.Start.X) * Progress), Math.round(Stg.Start.Y + (Stg.Target.Y - Stg.Start.Y) * Progress));
            Stg.Timer = setTimeout(() => this.scrollInProgress(), sML.limitMax(10, Stg.Duration - Passed));
        }
    };
    if(!sML.scrollTo) sML.scrollTo = function() { return sML.Scroller.scrollTo.apply(sML.Scroller, arguments); };
    if(!sML.CustomEvents) sML.CustomEvents = function(Pre = 'sml') {
        const _EL_ = Pre + 'EventListener';
        const _BELs_ = Pre + 'BindedEventListeners';
        const NameRE = new RegExp('^' + Pre + ':[\\w\\d\\-:]+$');
        this.add = function(Nam, fun) { let Tar = document; if(arguments.length > 2) Tar = arguments[0], Nam = arguments[1], fun = arguments[2];
            if(Array.isArray(Tar)) return Tar.forEach(T => this.add(T, Nam, fun)) || fun;
            if(Array.isArray(Nam)) return Nam.forEach(N => this.add(Tar, N, fun)) || fun;
            if(Array.isArray(fun)) return fun.forEach(f => this.add(Tar, Nam, f)) || fun;
            if(typeof Tar != 'object' || !NameRE.test(Nam) || typeof fun != 'function') return false;
            if(!fun[_EL_]) fun[_EL_] = (Eve) => fun.call(Tar, Eve.detail);
            Tar.addEventListener(Nam, fun[_EL_], false);
            return fun;
        };
        this.remove = function(Nam, fun) { let Tar = document; if(arguments.length > 2) Tar = arguments[0], Nam = arguments[1], fun = arguments[2];
            if(Array.isArray(Tar)) return Tar.forEach(T => this.remove(T, Nam, fun)) || fun;
            if(Array.isArray(Nam)) return Nam.forEach(N => this.remove(Tar, N, fun)) || fun;
            if(Array.isArray(fun)) return fun.forEach(f => this.remove(Tar, Nam, f)) || fun;
            if(typeof Tar != 'object' || !NameRE.test(Nam) || typeof fun != 'function') return false;
            Tar.removeEventListener(Nam, fun[_EL_]);
            return fun;
        };
        this.bind = function(Nam, fun) { let Tar = document; if(arguments.length > 2) Tar = arguments[0], Nam = arguments[1], fun = arguments[2];
            if(Array.isArray(Tar)) return Tar.forEach(T => this.bind(T, Nam, fun)) || fun;
            if(Array.isArray(Nam)) return Nam.forEach(N => this.bind(Tar, N, fun)) || fun;
            if(Array.isArray(fun)) return fun.forEach(f => this.bind(Tar, Nam, f)) || fun;
            if(typeof Tar != 'object' || !NameRE.test(Nam) || typeof fun != 'function') return false;
            if(!Tar[_BELs_]) Tar[_BELs_] = {};
            if(!(Array.isArray(Tar[_BELs_][Nam]))) Tar[_BELs_][Nam] = [];
            Tar[_BELs_][Nam] = Tar[_BELs_][Nam].filter(bEL => (bEL != fun));
            Tar[_BELs_][Nam].push(fun);
            return fun;
        };
        this.unbind = function(Nam, fun) { let Tar = document; if(arguments.length > 2) Tar = arguments[0], Nam = arguments[1], fun = arguments[2];
            if(Array.isArray(Tar)) return Tar.forEach(T => this.unbind(Tar, Nam, fun)) || fun;
            if(!(Tar[_BELs_] && Array.isArray(Tar[_BELs_][Nam]))) return false;
            Tar[_BELs_][Nam] = Tar[_BELs_][Nam].filter(bEL => (bEL != fun));
            return fun;
        };
        this.dispatch = function(Nam, Det) { let Tar = document; const A0 = arguments[0], A1 = arguments[1], A2 = arguments[2];
            if(Array.isArray(A0)) return Promise.allSettled(A0.map(x => this.dispatch(x, A1, A2)));
            if(typeof A0 == 'object') if(Array.isArray(A1)) return Promise.allSettled(A1.map(x => this.dispatch(A0, x, A2))); else Tar = A0, Nam = A1, Det = A2;
            if(!NameRE.test(Nam)) return Promise.reject();
            const Ret = Promise.allSettled(Array.isArray(Tar[_BELs_]?.[Nam]) ? Tar[_BELs_][Nam].map(bEL => Promise.resolve(typeof bEL != 'function' ? bEL : bEL.call(Tar, Det))) : []);
            Tar.dispatchEvent(new CustomEvent(Nam, { detail: Det }));
            return Ret;
        };
        return this;
    };
    if(!sML.CSS) sML.CSS = {};
    const BIBIStyleSheet = (Doc) => Doc.__bibiStyleSheet || (Doc.__bibiStyleSheet = (() => { const El = Doc.createElement('style'); El.appendChild(Doc.createTextNode('')); Doc.head.appendChild(El); return El; })().sheet);
    const BIBIAppendRule = (...Args) => { // v1 (Sel, Sty) contract incl. Doc-first form; returns the rule object so deleteCSSRule can remove it (v3 takes a full rule string and returns undefined)
        let Doc = (typeof document != 'undefined') ? document : undefined;
        if(Args[0] && Args[0].documentElement) Doc = Args.shift();
        const [Sel, Sty] = Args;
        const SS = BIBIStyleSheet(Doc), Ind = SS.cssRules.length;
        SS.insertRule((Array.isArray(Sel) ? Sel.join(', ') : Sel) + ' { ' + (Array.isArray(Sty) ? Sty.join(' ') : Sty) + ' }', Ind);
        return SS.cssRules[Ind];
    };
    sML.appendCSSRule = BIBIAppendRule;
    sML.CSS.appendRule = (...Args) => sML.appendCSSRule(...Args);
    const v3deleteCSSRule = sML.deleteCSSRule;
    sML.deleteCSSRule = (...Args) => {
        let Doc = (typeof document != 'undefined') ? document : undefined;
        if(Args[0] && Args[0].documentElement) Doc = Args.shift();
        const [Target] = Args;
        if(Target && typeof Target == 'object' && Target.parentStyleSheet) {
            const SS = Target.parentStyleSheet;
            for(let i = SS.cssRules.length - 1; i >= 0; i--) if(SS.cssRules[i] === Target) { SS.deleteRule(i); return true; }
        }
        return v3deleteCSSRule(Doc, Target);
    };
    return true;
};
