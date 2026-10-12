import { afterEach, beforeAll, beforeEach, describe, expect, test } from "bun:test";

let R, C, S;

beforeAll(async () => {
    // The reader's worker is unrelated to rectangle mapping; keep module initialization isolated.
    const names = ["ENV_VERSION", "ENV_DEVELOPMENT", "window", "document", "Worker"];
    const saved = new Map(names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
    try {
        globalThis.ENV_VERSION = "test";
        globalThis.ENV_DEVELOPMENT = false;
        globalThis.window = {};
        globalThis.document = { currentScript: { src: "http://localhost/bibi.js" } };
        globalThis.Worker = class extends EventTarget {};
        ({ R, C, S } = await import("../__src/bibi/resources/scripts/bibi.heart.context.mjs"));
        await import("../__src/bibi/resources/scripts/bibi.heart.reader.mjs");
    } finally {
        for (const name of names) {
            const descriptor = saved.get(name);
            if (descriptor) Object.defineProperty(globalThis, name, descriptor);
            else delete globalThis[name];
        }
    }
});

let savedState;
beforeEach(() => {
    savedState = [...["Stage", "Spreads", "Main", "TwoPane"].map(key => [R, key]), [S, "SLD"], [S, "RVM"], ...["L_BASE_B", "L_BASE_b", "L_SIZE_L", "L_SIZE_l", "L_AXIS_L"].map(key => [C, key])]
        .map(([object, key]) => ({ object, key, descriptor: Object.getOwnPropertyDescriptor(object, key) }));
});
afterEach(() => {
    for (const { object, key, descriptor } of savedState) {
        if (descriptor) Object.defineProperty(object, key, descriptor);
        else delete object[key];
    }
});

const itemWithPages = (start, step, axis = "Left", count = 26) => ({
    Pages: Array.from({ length: count }, (_, index) => ({
        IndexInItem: index,
        ContentAreaInItem: { [axis]: start + index * step },
    })),
});

const axes = (before, direction) => {
    C.L_BASE_B = before;
    C.L_BASE_b = before.toLowerCase();
    C.L_SIZE_L = before === "Top" ? "Height" : "Width";
    C.L_SIZE_l = C.L_SIZE_L.toLowerCase();
    S.SLD = direction;
    R.Stage = { Width: 1365, Height: 1100 };
};

describe("rectangle destinations", () => {
    test("half-width panes map an anchor to its actual page, including the gutter", () => {
        axes("Left", "ltr");
        const item = itemWithPages(0, 682);
        expect(R.getPageOfRectHeadInItem({ left: 8184 }, item).IndexInItem).toBe(12);
        expect(R.getPageOfRectHeadInItem({ left: 8183 }, item).IndexInItem).toBe(11);
    });

    test("right-to-left pages use decreasing physical start coordinates", () => {
        axes("Right", "rtl");
        const item = itemWithPages(17684, -682, "Right");
        expect(R.getPageOfRectHeadInItem({ right: 9500 }, item).IndexInItem).toBe(12);
        expect(R.getPageOfRectHeadInItem({ right: 9501 }, item).IndexInItem).toBe(11);
    });

    test("vertical pagination uses rendered spacing rather than viewport height", () => {
        axes("Top", "ttb");
        const item = itemWithPages(24, 736, "Top", 5);
        expect(R.getPageOfRectHeadInItem({ top: 1496 }, item).IndexInItem).toBe(2);
        expect(R.getPageOfRectHeadInItem({ top: -50 }, item).IndexInItem).toBe(0);
        expect(R.getPageOfRectHeadInItem({ top: 9000 }, item).IndexInItem).toBe(4);
    });

    test("dissolved items have no destination; fitted pictures retain their single page", () => {
        axes("Left", "ltr");
        expect(R.getPageOfRectHeadInItem({ left: 0 }, { Pages: [] })).toBeNull();
        const picture = { Pages: [{ IndexInItem: 0 }] };
        expect(R.getPageOfRectHeadInItem({ left: 800 }, picture)).toBe(picture.Pages[0]);
    });

    test("paired slots add widths horizontally but share height vertically", () => {
        const first = { TwoPaneGroupKey: "0+1", Box: { offsetWidth: 700, offsetHeight: 800 } };
        const second = { TwoPaneGroupKey: "0+1", Box: { offsetWidth: 700, offsetHeight: 760 } };
        first.TwoPaneGroup = second.TwoPaneGroup = [first, second];
        const strip = { TwoPaneGroupKey: "2", Box: { offsetWidth: 4200, offsetHeight: 800 } };
        R.Spreads = [first, second, strip];
        R.Main = { Book: { style: {} } };
        R.TwoPane = true;
        S.RVM = "paged";
        C.L_AXIS_L = "X"; C.L_SIZE_l = "width";
        R.layOutStage();
        expect(R.Main.Book.style.width).toBe("5600px");
        C.L_AXIS_L = "Y"; C.L_SIZE_l = "height";
        R.layOutStage();
        expect(R.Main.Book.style.height).toBe("1600px");
    });
});
