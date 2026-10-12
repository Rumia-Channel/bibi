import { Bibi, R, I, S, O, M } from './bibi.heart.context.mjs';
import { B } from './bibi.heart.book.mjs';

const SessionId = crypto.randomUUID?.() || Array.from(crypto.getRandomValues(new Uint8Array(16)), Byte => Byte.toString(16).padStart(2, '0')).join('');
let Status = 'loading', LoadError = null, Restoring = false, PositionTimer = null, LastPosition = '', LastState = '';
const fail = (Code, Message) => Object.assign(new Error(Message), { code: Code });
const errorData = Error => ({ code: Error?.code || 'REQUEST_FAILED', message: Error?.message || String(Error) });
const identity = () => ({ schemaVersion: 1, sessionId: SessionId, bookKey: S['book-key'] || B.ID || '', contentHash: S['content-hash'] || '' });
const getState = () => {
    const Available = Status === 'ready' && !Restoring && !R.LayingOut && !R.Moving && !O.Busy;
    const Page = Available ? R.getPage() : null;
    return {
        ...identity(), status: Status,
        operable: !!Page?.isConnected && R.hasLocationDocument(Page.Item),
        error: LoadError, initialRestore: Bibi.InitialRestore || null
    };
};
const assertReady = () => {
    if(Status !== 'ready') throw fail(Status === 'error' ? 'LOAD_FAILED' : 'NOT_READY', LoadError?.message || 'The book is not ready.');
    if(Restoring || R.LayingOut || R.Moving || O.Busy) throw fail('BUSY', 'The reader is changing its layout or position.');
};
const assertIdentity = Expected => {
    if(!Expected || typeof Expected !== 'object' || Array.isArray(Expected) || typeof Expected.bookKey !== 'string' || typeof Expected.contentHash !== 'string') throw fail('INVALID_IDENTITY', 'Expected identity must contain bookKey and contentHash strings.');
    const Current = identity();
    if(Expected.bookKey !== Current.bookKey || Expected.contentHash !== Current.contentHash) throw fail('IDENTITY_MISMATCH', 'The position belongs to a different book or file revision.');
};
const getPosition = () => {
    assertReady();
    const Location = R.getLocation();
    const Progress = R.getReadingProgress(Location);
    const Page = R.getPage();
    if(!Page) throw fail('NOT_READY', 'The visible page is not available.');
    const End = R.Pages[R.Pages.length - 1];
    const Intersection = End && I.PageObserver.getIntersectionStatus(End, true);
    const IIPP = R.getIIPP();
    return {
        location: Location, ...Progress,
        atEnd: !!(End && I.PageObserver.Current.Pages.includes(End) && Intersection && (Intersection.Contained || Intersection.Footed)),
        layout: { iipp: Number.isFinite(IIPP) ? IIPP : null, pageIndex: Page.Index, pageCount: R.Pages.length }
    };
};
const publish = Message => {
    const Envelope = { ...identity(), ...Message };
    document.dispatchEvent(new CustomEvent(Envelope.type, { detail: Envelope }));
    M.post(JSON.stringify(Envelope));
};
const publishState = () => {
    const State = getState(), Signature = JSON.stringify(State);
    if(Signature === LastState) return;
    LastState = Signature;
    publish({ type: 'bibi:state-changed', state: State });
};
const publishPosition = () => {
    PositionTimer = null;
    if(!getState().operable) { publishState(); return; }
    const Position = getPosition(), Signature = JSON.stringify(Position);
    if(Bibi.InitialRestore && !Bibi.InitialRestore.position) Bibi.InitialRestore.position = Position;
    publishState();
    if(Signature === LastPosition) return;
    LastPosition = Signature;
    publish({ type: 'bibi:position-changed', position: Position });
};
const settlePosition = () => { clearTimeout(PositionTimer); PositionTimer = setTimeout(publishPosition, 0); };
const restorePosition = async (Location, ExpectedIdentity) => {
    assertReady();
    if(ExpectedIdentity !== undefined) assertIdentity(ExpectedIdentity);
    Restoring = true; publishState();
    try {
        const Item = R.getLocationItem(Location);
        if(!R.hasLocationDocument(Item)) {
            await I.Turner.turnItem(Item, true);
            await Item.Turning;
        }
        const Destination = R.resolveLocation(Location);
        const Reached = await R.focusOn(Destination, { Distilled: true, Duration: 0 });
        if(!Reached) throw fail('RESTORE_FAILED', 'The reader could not reach the requested position.');
        Restoring = false;
        return { requestedLocation: { ...Location }, position: getPosition() };
    } finally { Restoring = false; publishState(); settlePosition(); }
};
Bibi.API = Object.freeze({
    schemaVersion: 1, getState, getPosition, restorePosition,
    subscribe: (Type, Listener) => {
        if(!['bibi:state-changed', 'bibi:position-changed'].includes(Type) || typeof Listener !== 'function') throw new TypeError('Use a public state or position event and a listener.');
        const Handler = Event => Listener(Event.detail);
        document.addEventListener(Type, Handler);
        return () => document.removeEventListener(Type, Handler);
    }
});
M.handleAPIRequest = async Request => {
    const Response = { type: 'bibi:api:response', ...identity(), requestId: Request.requestId, ok: false };
    try {
        if(Request.schemaVersion !== 1) throw fail('UNSUPPORTED_SCHEMA', 'Only schemaVersion 1 is supported.');
        if(typeof Request.requestId !== 'string' || !Request.requestId) throw fail('INVALID_REQUEST', 'A nonempty requestId is required.');
        if(Request.sessionId !== SessionId && !(Request.method === 'getState' && Request.sessionId === null)) throw fail('SESSION_MISMATCH', 'The request belongs to a different reader session.');
        for(const Key of ['bookKey', 'contentHash']) if(Object.hasOwn(Request, Key) && Request[Key] !== Response[Key]) throw fail('IDENTITY_MISMATCH', 'The request belongs to a different book or file revision.');
        switch(Request.method) {
            case 'getState': Response.result = getState(); break;
            case 'getPosition': Response.result = getPosition(); break;
            case 'restorePosition': Response.result = await restorePosition(Request.params?.location, Request.params?.identity); break;
            default: throw fail('UNKNOWN_METHOD', 'The API method is not supported.');
        }
        Response.ok = true;
    } catch(Error) { Response.error = errorData(Error); }
    return Response;
};
for(const Event of ['bibi:initialized', 'bibi:loaded-book', 'bibi:binded-book']) document.addEventListener(Event, publishState);
document.addEventListener('bibi:started', () => {
    Status = 'ready';
    if(Bibi.InitialRestore && getState().operable) Bibi.InitialRestore.position = getPosition();
    publishState(); settlePosition();
});
document.addEventListener('bibi:x_x', Event => {
    Status = 'error'; LoadError = errorData(Event.detail); if(LoadError.code === 'REQUEST_FAILED') LoadError.code = 'LOAD_FAILED';
    clearTimeout(PositionTimer); publishState();
});
for(const Event of ['bibi:focused-on', 'bibi:scrolled-by', 'bibi:moved-by', 'bibi:stopped-scrolling', 'bibi:flipped', 'bibi:changed-intersection']) document.addEventListener(Event, settlePosition);
document.addEventListener('bibi:is-going-to:lay-out', publishState);
document.addEventListener('bibi:laid-out', () => { if(Status === 'ready') { publishState(); settlePosition(); } });
