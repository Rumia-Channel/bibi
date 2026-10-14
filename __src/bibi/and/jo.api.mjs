const failure = (Code, Message) => Object.assign(new Error(Message), { code: Code });

export const createBucketAPI = (Bucket) => {
    const Pending = new Map(), Subscriptions = new Set();
    const Expected = new URL(Bucket.HRef);
    const identity = Key => Bucket.Receiver.getAttribute?.('data-bibi-' + Key) || Expected.searchParams.get(Key) || '';
    const BookKey = identity('book-key'), ContentHash = identity('content-hash');
    let Session = null, Identity = null, Disposed = false, Loaded = false, ReadyResolve, ReadyReject, Ready;
    const resetReady = () => {
        Ready = new Promise((Resolve, Reject) => { ReadyResolve = Resolve; ReadyReject = Reject; });
        Ready.catch(() => {}); // Consumers may use requests without awaiting the readiness promise.
    };
    resetReady();
    const rejectPending = Error => {
        for(const Entry of Pending.values()) { clearTimeout(Entry.timer); Entry.reject(Error); }
        Pending.clear();
    };
    const request = (Method, Params) => {
        if(Disposed) return Promise.reject(failure('DISPOSED', 'The reader API has been disposed.'));
        const FrameWindow = Bucket.Frame?.contentWindow;
        if(!FrameWindow) return Promise.reject(failure('NOT_READY', 'The reader frame is not attached.'));
        if(Method !== 'getState' && !Session) return Ready.then(() => request(Method, Params));
        const RequestId = crypto.randomUUID?.() || Array.from(crypto.getRandomValues(new Uint8Array(16)), Byte => Byte.toString(16).padStart(2, '0')).join('');
        const ExpectedIdentity = Identity || { ...(BookKey ? { bookKey: BookKey } : {}), ...(ContentHash ? { contentHash: ContentHash } : {}) };
        const Message = { type: 'bibi:api:request', schemaVersion: 1, requestId: RequestId, sessionId: Method === 'getState' && !Session ? null : Session, ...ExpectedIdentity, method: Method, params: Params };
        return new Promise((Resolve, Reject) => {
            const Timer = setTimeout(() => { Pending.delete(RequestId); Reject(failure('TIMEOUT', 'The reader did not answer the request.')); }, 15000);
            Pending.set(RequestId, { resolve: Resolve, reject: Reject, timer: Timer, method: Method, session: Message.sessionId });
            FrameWindow.postMessage(JSON.stringify(Message), Bucket.Anchor.origin);
        });
    };
    const updateState = State => {
        if(State?.operable) ReadyResolve(State);
        else if(State?.status === 'error') ReadyReject(failure(State.error?.code || 'LOAD_FAILED', State.error?.message || 'The book could not be loaded.'));
    };
    const receive = Message => {
        if(Disposed || Message?.schemaVersion !== 1 || typeof Message.sessionId !== 'string' || !Message.sessionId) return false;
        const WrongIdentity = BookKey && Message.bookKey !== BookKey || ContentHash && Message.contentHash !== ContentHash;
        if(WrongIdentity && !(Message.type === 'bibi:api:response' && Pending.get(Message.requestId)?.method === 'getState' && Message.error?.code === 'IDENTITY_MISMATCH')) return false;
        if(Message.type === 'bibi:api:response') {
            const Entry = Pending.get(Message.requestId);
            if(!Entry || Entry.session && Entry.session !== Message.sessionId || Session && Session !== Message.sessionId) return false;
            if(Entry.method !== 'getState' && !Session) return false;
            if(Entry.method === 'getState' && !Session) Session = Message.sessionId;
            clearTimeout(Entry.timer); Pending.delete(Message.requestId);
            if(Message.ok === true) {
                if(Message.bookKey) Identity = { bookKey: Message.bookKey, contentHash: Message.contentHash };
                if(Entry.method === 'getState') updateState(Message.result);
                Entry.resolve(Message.result);
            } else Entry.reject(failure(Message.error?.code || 'REQUEST_FAILED', Message.error?.message || 'The reader request failed.'));
            return true;
        }
        if(!Session || Session !== Message.sessionId) return false;
        if(Message.bookKey) Identity = { bookKey: Message.bookKey, contentHash: Message.contentHash };
        if(Message.type === 'bibi:state-changed') updateState(Message.state);
        else if(!['bibi:position-changed', 'bibi:host-navigation-changed'].includes(Message.type)) return false;
        Bucket.dispatch(Message.type, Message);
        return true;
    };
    const onLoad = () => {
        if(Disposed) return;
        if(Loaded) { rejectPending(failure('SESSION_CHANGED', 'The reader frame navigated.')); ReadyReject(failure('SESSION_CHANGED', 'The reader frame navigated.')); resetReady(); }
        Loaded = true; Session = null; Identity = null;
        request('getState').catch(Error => ReadyReject(Error));
    };
    Bucket.Frame?.addEventListener('load', onLoad);
    Bucket.APIReceive = receive;
    return Object.freeze({
        schemaVersion: 1,
        get ready() { return Disposed ? Promise.reject(failure('DISPOSED', 'The reader API has been disposed.')) : Ready; },
        getState: () => request('getState'),
        getPosition: () => request('getPosition'),
        restorePosition: (Location, ExpectedIdentity) => request('restorePosition', { location: Location, identity: ExpectedIdentity }),
        getHostNavigationState: () => request('getHostNavigationState'),
        refreshHostNavigation: () => request('refreshHostNavigation'),
        subscribe: (Type, Listener) => {
            if(Disposed) throw failure('DISPOSED', 'The reader API has been disposed.');
            if(!['bibi:state-changed', 'bibi:position-changed', 'bibi:host-navigation-changed'].includes(Type) || typeof Listener !== 'function') throw new TypeError('Use a public reader event and a listener.');
            const Handler = Event => Listener(Event.detail);
            const Unsubscribe = () => { Bucket.Receiver.removeEventListener(Type, Handler); Subscriptions.delete(Unsubscribe); };
            Bucket.Receiver.addEventListener(Type, Handler); Subscriptions.add(Unsubscribe);
            return Unsubscribe;
        },
        dispose: () => {
            if(Disposed) return;
            Disposed = true;
            Bucket.Frame?.removeEventListener('load', onLoad);
            const Error = failure('DISPOSED', 'The reader API has been disposed.');
            rejectPending(Error); ReadyReject(Error);
            for(const Unsubscribe of Subscriptions) Unsubscribe();
            delete Bucket.Jo.Buckets[Bucket.Index];
            delete Bucket.APIReceive;
        }
    });
};

export const receiveBucketMessage = (Jo, Eve) => {
    if(!Eve || typeof Eve.data !== 'string') return false;
    const Bucket = Jo.Buckets.find(B => B?.Type === 'Embed' && B.Frame?.contentWindow === Eve.source && B.Anchor.origin === Eve.origin);
    if(!Bucket) return false;
    let Message;
    try { Message = JSON.parse(Eve.data); } catch { return false; }
    if(!Message || typeof Message !== 'object' || Array.isArray(Message)) return false;
    if(typeof Message.type === 'string') return Bucket.APIReceive?.(Message) || false;
    for(const [Name, Detail] of Object.entries(Message)) if(/^bibi:[a-z][a-z0-9:_\-]*$/.test(Name)) Bucket.dispatch(Name, Detail);
    return true;
};
