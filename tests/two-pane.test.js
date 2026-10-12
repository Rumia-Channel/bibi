import { isPairableSpread, isTwoPaneViewport, planSoloPictureDonations, planTwoPaneGroups, shouldSoloLandscapeSpread, getPortraitProseLayout, canDonateSoloPicture } from "../__src/bibi/resources/scripts/bibi.heart.twopane.mjs";
describe("two-pane geometry", () => {
    test("viewport rule admits 4:3 landscape and wider, boundary inclusive", () => {
        expect(isTwoPaneViewport(1706, 800)).toBe(true);
        expect(isTwoPaneViewport(1568, 785)).toBe(true);
        expect(isTwoPaneViewport(2560, 1440)).toBe(true);
        expect(isTwoPaneViewport(1194, 834)).toBe(true); // iPad landscape
        expect(isTwoPaneViewport(1180, 820)).toBe(true); // iPad landscape
        expect(isTwoPaneViewport(1024, 768)).toBe(true); // exactly 4:3
        expect(isTwoPaneViewport(1000, 800)).toBe(false);
        expect(isTwoPaneViewport(820, 1180)).toBe(false); // iPad portrait stays solo
    });
    test("landscape-solo needs half-pane overflow, not stage-likeness", () => {
        expect(shouldSoloLandscapeSpread(1600, 900, 1365, 768)).toBe(true); // 1.78 >= 0.89: shrinks in a half pane
        expect(shouldSoloLandscapeSpread(2270, 1600, 1706, 800)).toBe(true); // the novel's wide illustration
        expect(shouldSoloLandscapeSpread(1135, 1600, 1706, 800)).toBe(false); // portrait pairs
        expect(shouldSoloLandscapeSpread(700, 900, 1365, 768)).toBe(false); // portrait pairs
        expect(shouldSoloLandscapeSpread(400, 100, 1365, 768)).toBe(false); // tiny strip: no solo upscale
        expect(shouldSoloLandscapeSpread(1135, 1600, 1400, 1050)).toBe(false); // portrait needs width-constrained fit at 4:3, not a whole opening
    });
    const spread = (item, idx = 1) => ({ Index: idx, Items: item ? [item] : [] });
    const pre = (over = {}) => Object.assign({ PrePaginated: true, Pages: [{}] }, over);
    const txt = (over = {}) => Object.assign({ Reflowable: true, Pages: [{}] }, over);

    test("the opening spread always stands alone; the rest pair freely", () => {
        expect(isPairableSpread(spread(pre(), 0))).toBe(false);
        expect(isPairableSpread(spread(pre()))).toBe(true);
        expect(isPairableSpread(spread(pre({ "rendition:spread": "none" })))).toBe(true);
        expect(isPairableSpread(spread(pre({ "rendition:spread": "portrait" })))).toBe(true);
        expect(isPairableSpread(spread(pre({ "rendition:page-spread": "left" })))).toBe(true);
        expect(isPairableSpread(spread(pre({ "rendition:page-spread": "right" })))).toBe(true);
    });
    test("single-page text and big pictures are pairable; locks and strips are not", () => {
        expect(isPairableSpread(spread(Object.assign(txt(), { TwoPaneRendered: true })))).toBe(true);
        expect(isPairableSpread(spread({ Reflowable: true, OnlySingleSVG: true, Pages: [{}] }))).toBe(true);
        expect(isPairableSpread(spread({ PrePaginated: true, OnlySingleImg: true, Pages: [{}] }))).toBe(true);
        expect(isPairableSpread(spread(Object.assign(txt(), { TwoPaneRendered: true, TwoPaneSoloLocked: true })))).toBe(false);
        expect(isPairableSpread(spread(Object.assign(txt(), { TwoPaneRendered: true, Pages: [{}, {}] })))).toBe(false);
        expect(isPairableSpread(spread(txt()))).toBe(false); // not yet rendered
        expect(isPairableSpread(spread(pre({ SpreadPair: {} })))).toBe(false);
        expect(isPairableSpread({ Index: 2, Items: [{}, {}] })).toBe(false);
        expect(isPairableSpread({ Index: 2, Items: [] })).toBe(false);
    });
    test("resolved-small pictures rejoin pairing", () => {
        expect(isPairableSpread(spread({ Reflowable: true, TwoPaneRendered: true, OnlySingleSVG: true, SingleMediaIsBig: false, Pages: [{}] }))).toBe(true);
        expect(isPairableSpread(spread({ PrePaginated: true, OnlySingleImg: true, SingleMediaIsBig: false, Pages: [{}] }))).toBe(true);
    });
    test("greedy pairing mixes freely; solos stay single", () => {
        // pic|pic, text|pic, pic|text, text|text all pair; landscape-solo and odd tails stay single.
        const P = (soloLandscape = false) => ({ pairable: true, soloLandscape });
        const S = { pairable: false, soloLandscape: false };
        expect(planTwoPaneGroups([P(), P(), P()])).toEqual([[0, 1], [2]]);
        expect(planTwoPaneGroups([P(), { pairable: true, soloLandscape: true }, P()])).toEqual([[0], [1], [2]]);
        expect(planTwoPaneGroups([S, P(), P(), S])).toEqual([[0], [1, 2], [3]]);
        expect(planTwoPaneGroups([])).toEqual([]);
    });
});

describe("mixed-layout illustration adoption", () => {
    const Book = { Reflowable: true };
    const Picture = { PrePaginated: true, Reflowable: false, OnlySingleSVG: true, SingleMediaIsBig: true };
    const Spread = { Index: 10, Items: [Picture] };
    test("a fixed portrait page inside a reflowable novel remains eligible for adjacent prose", () => {
        expect(canDonateSoloPicture(Book, Spread)).toBe(true);
    });
    test("a wholly fixed-layout book never donates its pages into another document", () => {
        expect(canDonateSoloPicture({ Reflowable: false }, Spread)).toBe(false);
    });
    test("covers and explicit multi-page spreads remain intact", () => {
        expect(canDonateSoloPicture(Book, { ...Spread, Index: 0 })).toBe(false);
        expect(canDonateSoloPicture(Book, { ...Spread, Items: [Picture, Picture] })).toBe(false);
        expect(canDonateSoloPicture(Book, { ...Spread, Items: [{ ...Picture, SpreadPair: {} }] })).toBe(false);
    });
    test("small or unresolved single images and non-media pages are not adoption sources", () => {
        expect(canDonateSoloPicture(Book, { ...Spread, Items: [{ OnlySingleImg: true, SingleMediaIsBig: false }] })).toBe(false);
        expect(canDonateSoloPicture(Book, { ...Spread, Items: [{ OnlySingleImg: true }] })).toBe(false);
        expect(canDonateSoloPicture(Book, { ...Spread, Items: [{ Reflowable: true }] })).toBe(false);
    });
});

describe("solo picture donation", () => {
    const D = { donor: true, portrait: true };
    const T = () => ({ recipient: true });
    test("planner places a standalone portrait beside neighboring prose", () => {
        expect(planSoloPictureDonations([T(), D, T()])).toEqual([{ from: 1, to: 2, atHead: true }]); // prefers next-head
        expect(planSoloPictureDonations([T(), D])).toEqual([]); // no vacant preceding pane and no following prose
        expect(planSoloPictureDonations([D, T()])).toEqual([{ from: 0, to: 1, atHead: true }]);
        expect(planSoloPictureDonations([{ recipient: false }, D, { recipient: false }])).toEqual([]); // gallery captions/headings are not prose recipients
        expect(planSoloPictureDonations([D, D, T()])).toEqual([{ from: 1, to: 2, atHead: true }]);
        expect(planSoloPictureDonations([{ recipient: true, portraitTailFits: true }, D, D, T()])).toEqual([{ from: 1, to: 0, atHead: false }, { from: 2, to: 3, atHead: true }]); // one donation per recipient end
        expect(planSoloPictureDonations([null, D, T()])).toEqual([{ from: 1, to: 2, atHead: true }]);
        expect(planSoloPictureDonations([])).toEqual([]);
    });
    test("a portrait fills the preceding vacant pane before opening the next chapter", () => {
        const Portrait = { donor: true, portrait: true };
        const Tail = { recipient: true, portraitTailFits: true };
        expect(planSoloPictureDonations([Tail, Portrait, T()])).toEqual([{ from: 1, to: 0, atHead: false }]);
        expect(planSoloPictureDonations([T(), Portrait, T()])).toEqual([{ from: 1, to: 2, atHead: true }]);
        expect(planSoloPictureDonations([Tail, { donor: true, portrait: false }, T()])).toEqual([]);
    });
    test("landscape and unresolved media never enter portrait prose placement", () => {
        expect(planSoloPictureDonations([{ donor: true, portrait: false }, T()])).toEqual([]);
        expect(planSoloPictureDonations([{ donor: true }, T()])).toEqual([]);
    });
});

describe("portrait prose occupancy", () => {
    const Band = { left: 0, right: 2000, width: 2000 };
    test("right-to-left prose extending beyond one pane opens the following image/text spread", () => {
        expect(getPortraitProseLayout({ right: 2000, top: 0 }, { left: 600, top: 0 }, Band, 900, true))
            .toEqual({ recipient: true, portraitTailFits: false });
    });
    test("a multi-band chapter with a vacant final pane receives a trailing portrait", () => {
        expect(getPortraitProseLayout({ right: 2000, top: 0 }, { left: 1400, top: 1000 }, Band, 900, true))
            .toEqual({ recipient: true, portraitTailFits: true });
    });
    test("a single pane of text is left to ordinary pairing, boundary inclusive", () => {
        expect(getPortraitProseLayout({ right: 2000, top: 0 }, { left: 1000, top: 0 }, Band, 900, true))
            .toEqual({ recipient: false, portraitTailFits: true });
    });
    test("left-to-right vertical prose mirrors occupied and vacant panes", () => {
        expect(getPortraitProseLayout({ left: 0, top: 0 }, { right: 1400, top: 0 }, Band, 900, false))
            .toEqual({ recipient: true, portraitTailFits: false });
        expect(getPortraitProseLayout({ left: 0, top: 0 }, { right: 600, top: 1000 }, Band, 900, false))
            .toEqual({ recipient: true, portraitTailFits: true });
    });
});

