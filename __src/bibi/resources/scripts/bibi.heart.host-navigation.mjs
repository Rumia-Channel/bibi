import { Bibi, O, R, I, P, S, C, E } from './bibi.heart.context.mjs';
import { getHostNavigationConfig, validateHostNavigation } from './bibi.heart.host-navigation.protocol.mjs';

const failure = (code, message) => Object.assign(new Error(message), { code });
let Config = null, Context = null, Refresh = null, Navigating = false, Boundary = null, ErrorState = null;
let Page = null, Heading = null, Description = null, Action = null, ErrorBox = null, ReturnButton = null;
let Observed = null, SavedBook = null, Touch = null, LastWheel = 0, PointerSuppressedUntil = 0, NavigationGeneration = 0;
let RefreshController = null, RefreshGeneration = 0;
const HandledKeys = new Set();
const control = target => !!target?.closest?.('button,input,textarea,select,[contenteditable="true"],.bibi-button,#bibi-menu,#bibi-panel,.bibi-subpanel');
const interactive = target => control(target) || !!target?.closest?.('a');
const KeyDirections = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'top', ArrowDown: 'bottom' };
function isolateButton(Button) {
    for(const Type of ['keydown', 'keyup', 'pointerdown', 'pointerup', 'touchstart', 'touchend', 'wheel']) Button.addEventListener(Type, Event => Event.stopPropagation());
}
const ready = () => !!Config && !!Bibi.API?.getState().operable;
const operable = () => ready() && !I.OpenedSubpanel && I.Panel?.UIState !== 'active';
const errorData = error => ({ code: error?.code || 'REQUEST_FAILED', message: error?.message || String(error) });
const getState = () => ({ enabled: !!Config, loading: !!Refresh, navigating: Navigating, visibleBoundary: Boundary, error: ErrorState ? { ...ErrorState } : null });
const neighbor = () => Context?.[Boundary === 'head' ? 'previous' : 'next'];
const notify = () => {
    if(!Config) return;
    render();
    E.dispatch('bibi:changed-host-navigation', getState());
};

function render() {
    if(ReturnButton) ReturnButton.disabled = Navigating || !!Refresh;
    if(ErrorBox) {
        ErrorBox.hidden = !ErrorState;
        ErrorBox.textContent = ErrorState ? `移動できませんでした。${ErrorState.message}` : '';
    }
    if(!Page || !Boundary) return;
    const Target = neighbor();
    Heading.textContent = !Context ? '移動先を確認' : Target ? (Boundary === 'head' ? '前の巻へ' : '次の巻へ') : Context.returnTo.label;
    Description.textContent = Target ? Target.title + (Target.status === 'missing-file' ? '（EPUB 未登録）' : Target.status === 'unsupported-format' ? '（対応する EPUB ではありません）' : '') : '';
    Action.textContent = Heading.textContent;
    Action.disabled = Navigating || !!Refresh;
}

function ensureReturnButton() {
    if(ReturnButton || !Context || !S['use-menubar'] || !I.Panel?.Opener?.ButtonGroup) return;
    const Group = document.createElement('ul');
    Group.id = 'bibi-host-return-group';
    Group.className = 'bibi-buttongroup bibi-host-return-group';
    const Box = Group.appendChild(document.createElement('li'));
    Box.className = 'bibi-buttonbox';
    ReturnButton = Box.appendChild(document.createElement('button'));
    ReturnButton.type = 'button';
    ReturnButton.id = 'bibi-host-return';
    ReturnButton.textContent = '戻る';
    ReturnButton.setAttribute('aria-label', '元のページへ戻る');
    isolateButton(ReturnButton);
    ReturnButton.addEventListener('click', Event => { Event.stopPropagation(); navigate('return'); });
    I.Panel.Opener.ButtonGroup.insertAdjacentElement('afterend', Group);
    render();
}

async function refresh() {
    if(!Config) throw failure('HOST_NAVIGATION_DISABLED', 'Host navigation is not enabled on this site.');
    if(Refresh) return Refresh;
    const Identity = Bibi.API.getState();
    if(!Identity.operable) throw failure('NOT_READY', 'The book is not ready for host navigation.');
    const URL = new window.URL(Config.endpoint);
    URL.searchParams.set('book_key', Identity.bookKey);
    URL.searchParams.set('content_hash', Identity.contentHash);
    if(S['host-return-to']) URL.searchParams.set('return_to', S['host-return-to']);
    const Controller = RefreshController = new AbortController();
    const Generation = ++RefreshGeneration;
    const Timer = setTimeout(() => Controller.abort(), 15000);
    const Request = Refresh = (async () => {
        const Response = await fetch(URL, { credentials: 'same-origin', mode: 'same-origin', cache: 'no-store', signal: Controller.signal });
        const Data = await Response.json();
        if(Generation !== RefreshGeneration) throw failure('NAVIGATION_CANCELLED', 'The navigation request was cancelled.');
        if(!Response.ok) throw failure(Data?.code || `HTTP_${Response.status}`, Data?.error || `Navigation request failed (${Response.status}).`);
        const Current = Bibi.API.getState();
        if(Current.sessionId !== Identity.sessionId || Current.bookKey !== Identity.bookKey || Current.contentHash !== Identity.contentHash) throw failure('SESSION_MISMATCH', 'The reader changed while navigation was being requested.');
        Context = validateHostNavigation(Data, Identity, Config);
        ErrorState = null;
        ensureReturnButton();
        return Context;
    })();
    notify();
    try { return await Request; }
    catch(Error) {
        if(Generation === RefreshGeneration) ErrorState = errorData(Error);
        throw Error;
    } finally {
        clearTimeout(Timer);
        if(Generation === RefreshGeneration) { Refresh = null; RefreshController = null; notify(); }
    }
}

async function navigate(Kind) {
    if((Kind === 'return' ? !ready() : !operable()) || Navigating) return;
    Navigating = true;
    const Generation = ++NavigationGeneration;
    let Leaving = false;
    ErrorState = null;
    notify();
    try {
        if(Refresh) await Refresh.catch(() => null);
        if(Generation !== NavigationGeneration) return;
        const Data = await refresh();
        if(Generation !== NavigationGeneration) return;
        const Target = Kind === 'return' ? null : Data[Kind];
        if(Target && Target.status !== 'ready') throw failure('BOOK_UNAVAILABLE', Target.status === 'missing-file' ? '隣接巻には EPUB が登録されていません。' : '隣接巻は対応する EPUB ではありません。');
        window.location.replace(Target ? Target.href : Data.returnTo.href);
        Leaving = true;
    } catch(Error) {
        if(Generation === NavigationGeneration) ErrorState = errorData(Error);
    } finally {
        if(Generation === NavigationGeneration) {
            if(!Leaving) Navigating = false;
            notify();
        }
    }
}

function isBoundary(Distance) {
    if(!operable() || !R.Pages?.length) return false;
    const Edge = Distance < 0 ? R.Pages[0] : R.Pages[R.Pages.length - 1];
    const Current = I.PageObserver.updateCurrent();
    const Intersection = I.PageObserver.getIntersectionStatus(Edge, true);
    return Current.Pages.includes(Edge) && !!Intersection && (Intersection.Contained || Intersection[Distance < 0 ? 'Headed' : 'Footed']);
}

function hide() {
    if(!Boundary && !Navigating) return;
    ++NavigationGeneration;
    if(Navigating) {
        Navigating = false;
        ++RefreshGeneration;
        RefreshController?.abort();
        Refresh = RefreshController = null;
        ErrorState = null;
    }
    Boundary = null;
    if(Page) Page.hidden = true;
    if(SavedBook) {
        R.Main.Book.style.visibility = SavedBook.visibility;
        R.Main.Book.inert = SavedBook.inert;
        if(SavedBook.aria === null) R.Main.Book.removeAttribute('aria-hidden');
        else R.Main.Book.setAttribute('aria-hidden', SavedBook.aria);
        SavedBook = null;
    }
    O.HTML.classList.remove('host-navigation-page-visible');
    notify();
}

function show(Distance) {
    if(!Page) {
        Page = O.Body.appendChild(document.createElement('section'));
        Page.className = 'bibi-host-navigation-page';
        Page.id = 'bibi-host-navigation-page';
        Page.setAttribute('aria-labelledby', 'bibi-host-navigation-heading');
        Heading = Page.appendChild(document.createElement('h2'));
        Heading.id = 'bibi-host-navigation-heading';
        Description = Page.appendChild(document.createElement('p'));
        Action = Page.appendChild(document.createElement('button'));
        Action.type = 'button';
        isolateButton(Action);
        Action.addEventListener('click', Event => { Event.stopPropagation(); if(performance.now() >= PointerSuppressedUntil) navigate(Boundary === 'head' ? 'previous' : 'next'); });
        const Hint = Page.appendChild(document.createElement('p'));
        Hint.className = 'bibi-host-navigation-hint';
        Hint.textContent = 'さらに外側へスクロールすると移動します。本文方向の操作で読書に戻れます。';
        Page.addEventListener('click', Event => {
            if(interactive(Event.target) || performance.now() < PointerSuppressedUntil) return;
            const Division = E.aBCD.getDivision({ X: Event.clientX, Y: Event.clientY });
            const Direction = Division.X !== 'center' ? Division.X : Division.Y !== 'middle' ? Division.Y : null;
            if(Direction) advance(C.d2d(Direction, true), Event);
        });
    }
    Boundary = Distance < 0 ? 'head' : 'foot';
    SavedBook = { visibility: R.Main.Book.style.visibility, inert: R.Main.Book.inert, aria: R.Main.Book.getAttribute('aria-hidden') };
    I.ScrollObserver.forceStopScrolling();
    R.Main.Book.style.visibility = 'hidden';
    R.Main.Book.inert = true;
    R.Main.Book.setAttribute('aria-hidden', 'true');
    O.HTML.classList.add('host-navigation-page-visible');
    Page.hidden = false;
    notify();
}

function advance(Distance, Event) {
    if(!Distance || !operable()) return false;
    if(!Boundary && !isBoundary(Distance)) return false;
    if(Event?.repeat) return true;
    if(Boundary && (Distance < 0 && Boundary === 'foot' || Distance > 0 && Boundary === 'head')) { hide(); return true; }
    if(Navigating) return true;
    if(Event?.type === 'wheel' && (control(Event.target) || Event.BibiHostWheelFresh !== true && Boundary)) return true;
    if(!Event?.type?.startsWith('key') && Event?.type !== 'wheel' && Event?.type !== 'touchend' && performance.now() < PointerSuppressedUntil) return true;
    if(!Boundary) show(Distance);
    else navigate(Boundary === 'head' ? 'previous' : 'next');
    return true;
}

const direction = (X, Y) => C.d2d(Math.abs(X) > Math.abs(Y) ? (X < 0 ? 'left' : 'right') : (Y < 0 ? 'top' : 'bottom'), true);
const stop = Event => { Event.preventDefault(); Event.stopImmediatePropagation(); };
function onWheel(Event) {
    if(!Config) return;
    const Now = performance.now();
    Event.BibiHostWheelFresh = Now - LastWheel > 300;
    LastWheel = Now;
    if(!operable() || control(Event.target)) return;
    const Distance = direction(Event.deltaX, Event.deltaY);
    if(!Distance || !Boundary && !isBoundary(Distance)) return;
    stop(Event);
    advance(Distance, Event);
}
function onKeyDown(Event) {
    if(!operable() || interactive(Event.target) || Event.ctrlKey || Event.altKey || Event.metaKey) return;
    const Direction = KeyDirections[Event.key];
    const Distance = Direction ? C.d2d(Direction, true) : Event.key === 'PageUp' ? -1 : Event.key === 'PageDown' ? 1 : Event.key === ' ' ? (Event.shiftKey ? -1 : 1) : 0;
    if(!Distance || !Boundary && !isBoundary(Distance)) return;
    stop(Event);
    HandledKeys.add(Event.code || Event.key);
    if(!Event.repeat) advance(Distance, Event);
}
function onKeyUp(Event) {
    if(HandledKeys.delete(Event.code || Event.key)) {
        const Name = I.KeyObserver?.getBibiKeyName(Event);
        if(Name && I.KeyObserver.ActiveKeys) delete I.KeyObserver.ActiveKeys[Name];
        stop(Event);
    }
}
function onTouchStart(Event) {
    if(!operable() || interactive(Event.target) || Event.touches.length !== 1) { Touch = null; return; }
    Touch = { x: Event.touches[0].clientX, y: Event.touches[0].clientY, head: !!Boundary || isBoundary(-1), foot: !!Boundary || isBoundary(1), scrollLeft: R.Main.scrollLeft, scrollTop: R.Main.scrollTop, distance: 0, blocked: false };
}
function onTouchMove(Event) {
    if(!Touch) return;
    if(Event.touches.length !== 1) { Touch = null; return; }
    const X = Touch.x - Event.touches[0].clientX, Y = Touch.y - Event.touches[0].clientY;
    if(Math.hypot(X, Y) < 22) return;
    const Distance = direction(X, Y);
    if(Distance < 0 ? !Touch.head : !Touch.foot) return;
    if(!Touch.blocked) {
        I.FlickObserver?.Movement?.Started.Item?.HTML.classList.remove('bibi-flick-hot');
        I.FlickObserver?.cancel();
        R.Main.scrollLeft = Touch.scrollLeft;
        R.Main.scrollTop = Touch.scrollTop;
    }
    Touch.distance = Distance;
    Touch.blocked = true;
    stop(Event);
}
function onTouchEnd(Event) {
    const Gesture = Touch;
    Touch = null;
    if(!Gesture?.blocked) return;
    stop(Event);
    advance(Gesture.distance, Event);
    PointerSuppressedUntil = performance.now() + 400;
}
function observe(Doc) {
    if(!Config || !Doc || Observed.has(Doc)) return;
    Observed.add(Doc);
    const Target = Doc.defaultView || Doc;
    for(const [Type, Listener] of [['wheel', onWheel], ['keydown', onKeyDown], ['keyup', onKeyUp], ['touchstart', onTouchStart], ['touchmove', onTouchMove], ['touchend', onTouchEnd]]) Target.addEventListener(Type, Listener, { capture: true, passive: false });
}
function start() {
    if(Config) return;
    Config = getHostNavigationConfig(P, window.location.origin, O.Embedded || window.parent !== window, Bibi.HostNavigationPresetTrusted);
    if(!Config) return;
    Observed = new WeakSet();
    ErrorBox = O.Body.appendChild(document.createElement('p'));
    ErrorBox.id = 'bibi-host-navigation-error';
    ErrorBox.setAttribute('role', 'alert');
    ErrorBox.hidden = true;
    observe(document);
    for(const Item of R.Items || []) observe(Item.contentDocument);
    refresh().catch(() => {});
}

Bibi.HostNavigation = { getState, refresh, canHandle: Distance => operable() && (!!Boundary || isBoundary(Distance)), advance, hide };
document.addEventListener('bibi:started', () => queueMicrotask(start));
document.addEventListener('bibi:loaded-item', Event => observe(Event.detail?.contentDocument));
for(const Type of ['bibi:is-going-to:resize', 'bibi:is-going-to:lay-out', 'bibi:focused-on', 'bibi:changes-view']) document.addEventListener(Type, hide);
