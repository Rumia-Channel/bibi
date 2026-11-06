import { afterEach, beforeAll, beforeEach, expect, test } from 'bun:test';

let R, I, O, L, S, C, E, B, createTurner;
beforeAll(async () => {
    const Names = ['ENV_VERSION', 'ENV_DEVELOPMENT', 'window', 'document', 'Worker'];
    const Saved = Names.map(Name => [Name, Object.getOwnPropertyDescriptor(globalThis, Name)]);
    try {
        globalThis.ENV_VERSION = 'test';
        globalThis.ENV_DEVELOPMENT = false;
        globalThis.window = {};
        globalThis.document = { currentScript: { src: 'http://localhost/bibi.js' } };
        globalThis.Worker = class extends EventTarget {};
        ({ R, I, O, L, S, C, E } = await import('../__src/bibi/resources/scripts/bibi.heart.context.mjs'));
        ({ B } = await import('../__src/bibi/resources/scripts/bibi.heart.book.mjs'));
        await import('../__src/bibi/resources/scripts/bibi.heart.operator.mjs');
        await import('../__src/bibi/resources/scripts/bibi.heart.interface.mjs');
        createTurner = I.Turner.create;
    } finally {
        for(const [Name, Descriptor] of Saved) {
            if(Descriptor) Object.defineProperty(globalThis, Name, Descriptor);
            else delete globalThis[Name];
        }
    }
});

const flush = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => {
    let resolve;
    const promise = new Promise(Resolve => resolve = Resolve);
    return { promise, resolve };
};
let SavedState, Pending, Layouts;
beforeEach(() => {
    SavedState = [R, I, O, L, S, C, E, B].map(Target => [Target, Object.getOwnPropertyDescriptors(Target)]);
    Pending = new Map();
    Layouts = new Map();
    const Events = new EventTarget();
    E.add = (Names, Listener) => {
        for(const Name of Array.isArray(Names) ? Names : [Names]) Events.addEventListener(Name, Listener);
    };
    E.bind = E.add;
    E.dispatch = Name => Events.dispatchEvent(new Event(Name));
    O.log = () => {};
    O.RangeLoader = null;
    B.Type = 'ImageZIP';
    S['allow-placeholders'] = false;
    C.L_AXIS_D = 1;
    R.DoNotTurn = false;
    R.TwoPane = true;
    R.Orientation = 'landscape';
    R.PDFEvicted = false;
    R.Items = Array.from({ length: 11 }, (_, Index) => ({ Index, Loaded: false, Turned: 'Down' }));
    R.Spreads = R.Items.map(Item => {
        const Spread = { Index: Item.Index, Items: [Item] };
        Item.Spread = Spread;
        return Spread;
    });
    for(const Indices of [[0], [1, 2], [3, 4], [5, 6], [7, 8], [9, 10]]) {
        const Group = Indices.map(Index => R.Spreads[Index]);
        for(const Spread of Group) Spread.TwoPaneGroup = Group;
    }
    I.ScrollObserver = { History: [2, 1] };
    I.PageObserver = { Current: { List: [{ Page: { Item: R.Items[0] } }] } };
    L.loadItem = async (Item, { AllowPlaceholder }) => {
        if(AllowPlaceholder) { Item.Loaded = false; Item.Turned = 'Down'; return Item; }
        const Gate = deferred();
        Pending.set(Item.Index, Gate);
        await Gate.promise;
        Item.Loaded = true;
        Item.Turned = 'Up';
        return Item;
    };
    R.layOutItem = async Item => { if(Layouts.has(Item.Index)) await Layouts.get(Item.Index).promise; return Item; };
    R.layOutSpread = async Spread => Spread;
    createTurner();
});
afterEach(async () => {
    I.Turner.TurningProcessID = null;
    for(const Gate of [...Pending.values(), ...Layouts.values()]) Gate.resolve();
    await flush();
    for(const [Target, Descriptors] of SavedState) {
        for(const Key of Reflect.ownKeys(Target)) if(!Object.hasOwn(Descriptors, Key)) delete Target[Key];
        Object.defineProperties(Target, Descriptors);
    }
});
const loaded = (...Indices) => {
    for(const Index of Indices) Object.assign(R.Items[Index], { Loaded: true, Turned: 'Up' });
};

test.each([1, -1])('next opening loads both halves together in physical direction %i', async Axis => {
    C.L_AXIS_D = Axis;
    I.ScrollObserver.History = [2 * Axis, Axis];
    loaded(0, 1, 2);
    I.Turner.turnItems({ Origin: R.Items[1] });
    await flush();
    expect(Pending.has(3)).toBe(true);
    expect(Pending.has(4)).toBe(true);
    expect(Pending.has(5)).toBe(false);
    Pending.get(3).resolve();
    await flush();
    expect(R.Items[3].Loaded).toBe(true);
    expect(Pending.has(5)).toBe(false); // finish the whole opening before beginning the next one
    Pending.get(4).resolve();
    await flush();
    expect(Pending.has(5)).toBe(true);
    expect(Pending.has(6)).toBe(true);
});

test.each([1, -1])('backward moves preload the whole previous opening in physical direction %i', async Axis => {
    C.L_AXIS_D = Axis;
    I.ScrollObserver.History = [Axis, 2 * Axis];
    loaded(5, 6);
    I.Turner.turnItems({ Origin: R.Items[6] });
    await flush();
    expect(Pending.has(3)).toBe(true);
    expect(Pending.has(4)).toBe(true);
    expect(Pending.has(7)).toBe(false);
});

test('a cached half of an opening stays loaded while its mate is fetched', async () => {
    loaded(0, 1, 2, 3);
    I.Turner.turnItems({ Origin: R.Items[1] });
    await flush();
    expect(Pending.has(4)).toBe(true);
    expect(Pending.has(3)).toBe(false);
    expect(R.Items[3].Loaded).toBe(true);
});

test('changing orders during layout never unloads an already decoded half', async () => {
    loaded(0, 1, 2);
    Layouts.set(3, deferred());
    I.Turner.turnItems({ Origin: R.Items[3] });
    await flush();
    Pending.get(3).resolve();
    await flush();
    expect(R.Items[3].Loaded).toBe(true);
    I.Turner.turnItems({ Origin: R.Items[3] });
    Layouts.get(3).resolve();
    await flush();
    expect(R.Items[3].Loaded).toBe(true);
});

test('opening the book starts preloading without waiting for the first page turn', async () => {
    loaded(0);
    E.dispatch('bibi:started');
    await flush();
    expect(Pending.has(1)).toBe(true);
    expect(Pending.has(2)).toBe(true);
});
