import { isPairableSpread, isTwoPaneViewport, planSoloPictureDonations, planTwoPaneGroups, shouldSoloLandscapeSpread, SOLO_PICTURE_MIN_TEXT_LENGTH } from "../__src/bibi/resources/scripts/bibi.heart.twopane.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const reader = () => readFileSync(join(ROOT, "__src/bibi/resources/scripts/bibi.heart.reader.mjs"), "utf8");

// 不変条件: 2ペイン化は paged 専用の幾何学ゲート + 論理グルーピングで成り立つ。
// 構造変更 (DOM 移動・頁採番) をしないことが設計の要。
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
    test("resolved-small pictures rejoin pairing; the 384 gate exists", () => {
        expect(isPairableSpread(spread({ Reflowable: true, TwoPaneRendered: true, OnlySingleSVG: true, SingleMediaIsBig: false, Pages: [{}] }))).toBe(true);
        expect(isPairableSpread(spread({ PrePaginated: true, OnlySingleImg: true, SingleMediaIsBig: false, Pages: [{}] }))).toBe(true);
        expect(reader()).toContain("384");
        expect(reader()).toContain("SingleMediaIsBig");
    });
    test("paged mode isolates block media from prose by column breaks", () => {
        // one image per page: the point of splitting pages is separating picture and text areas.
        const src = reader();
        expect(src).toContain("Separate pictures from prose");
        expect(src).toContain("breakBefore");
        expect(src).toContain("breakAfter");
        expect(src).toContain("BibiDefaultBreaks");
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

describe("solo picture donation", () => {
    const D = { donor: true };
    const T = (textLen = 20000) => ({ donor: false, textLen });
    test("title illustration prefers next-head, falls back to prev-tail", () => {
        expect(planSoloPictureDonations([T(), D, T()])).toEqual([{ from: 1, to: 2, atHead: true }]);
        expect(planSoloPictureDonations([T(), D])).toEqual([{ from: 1, to: 0, atHead: false }]);
        expect(planSoloPictureDonations([D, T()])).toEqual([{ from: 0, to: 1, atHead: true }]);
    });
    test("short neighbors are gallery context: pictures stay standalone", () => {
        expect(planSoloPictureDonations([T(600), D, T(600)])).toEqual([]);
        expect(planSoloPictureDonations([T(600), D, T()])).toEqual([{ from: 1, to: 2, atHead: true }]);
        expect(planSoloPictureDonations([T(), D, T(600)])).toEqual([{ from: 1, to: 0, atHead: false }]);
        expect(planSoloPictureDonations([{ donor: false, textLen: SOLO_PICTURE_MIN_TEXT_LENGTH }, D])).toEqual([{ from: 1, to: 0, atHead: false }]);
    });
    test("non-text neighbors never receive; one donation per recipient end", () => {
        expect(planSoloPictureDonations([D, D, T()])).toEqual([{ from: 1, to: 2, atHead: true }]);
        expect(planSoloPictureDonations([T(), D, D, T()])).toEqual([{ from: 1, to: 0, atHead: false }, { from: 2, to: 3, atHead: true }]);
        expect(planSoloPictureDonations([null, D, T()])).toEqual([{ from: 1, to: 2, atHead: true }]);
        expect(planSoloPictureDonations([])).toEqual([]);
    });
    test("donation runs pre-layout and converges late pictures via regroup", () => {
        const src = reader();
        expect(src).toContain("R.donateSoloPictures();");
        expect(src).toContain("BibiDonationDonor");
        expect(src).toContain("BibiAdoptedPicture");
    });
});

describe("two-pane wiring", () => {
    test("flag requires paged mode and horizontal advance", () => {
        const m = reader().match(/R\.TwoPane = ([^;]+);/);
        expect(m).not.toBeNull();
        expect(m[1]).toContain("S.RVM == 'paged'");
        expect(m[1]).toContain("S.ARA == 'horizontal'");
    });

    test("grouping runs on full relayout and after each item render", () => {
        const src = reader();
        expect(src).toContain("R.updateTwoPaneGrouping();");
        expect(src).toContain("R.requestTwoPaneRegroup();");
    });

    test("focus snaps to pair starts instead of half-shifted spreads", () => {
        expect(reader()).toContain("Page.Spread.TwoPaneGroup");
    });

    test("paired panes render at half stage width", () => {
        expect(reader()).toContain("PaneWidthFactor == 0.5");
    });
    test("regroup relayout rebuilds the page index before snapping", () => {
        // renderReflowableItem recreates item pages; without organizePages, R.Pages/Current
        // point at detached nodes and slider geometry crashes on null offsetParent.
        const src = reader();
        const i = src.indexOf("R.snapTwoPaneView();");
        expect(i).toBeGreaterThan(-1);
        expect(src.slice(Math.max(0, i - 160), i)).toContain("R.organizePages();");
    });
    test("big single-media items render fitted even in reflowable books", () => {
        // pre-paginated flag comes from package metadata; a lone big picture page must not
        // fall into the column paginator just because the book declares reflowable layout.
        const src = reader();
        expect(src).toContain("SoloBigPicture");
        expect(src).toContain("renderPrePaginatedItem(Item)");
    });
    test("two-pane never doubles width without a real pair", () => {
        // the Spreaded branch sizes left/right-tagged singles for a mate; without one,
        // two-pane must fit the pane instead of shrinking to a quarter.
        expect(reader()).toContain("R.TwoPane ? Promise.resolve(null)");
    });
    test("focus completion syncs current tracking", () => {
        // untracked spreads stay visibility:hidden; pair mates must not wait for a scroll event.
        const src = reader();
        const i = src.indexOf("E.dispatch('bibi:focused-on'");
        expect(i).toBeGreaterThan(-1);
        expect(src.slice(Math.max(0, i - 220), i)).toContain("PageObserver.updateCurrent()");
    });
    test("areafree single-media pages resolve to their picture", () => {
        // fitted single-media pages never get column areas; element resolution
        // (resize, destinations) must not crash on them.
        const src = reader();
        const i = src.indexOf("getSingleMediaElement(Page.Item); // fitted single-media");
        expect(i).toBeGreaterThan(-1);
        expect(src.slice(Math.max(0, i - 160), i)).toContain("OnlySingleSVG");
    });
    test("blank means no prose and no media, so single-page texts can pair", () => {
        // media-only blank verdicts locked every pure-text page solo (tail afterword
        // and questionnaire could never face each other). prose must disqualify blank.
        const src = reader();
        const i = src.indexOf("R.isBlankPageContent = (Item) =>");
        expect(i).toBeGreaterThan(-1);
        expect(src.slice(i, i + 600)).toContain("getElementInnerText(Doc.body)");
    });
    test("big vector pictures share the inline picture machinery", () => {
        // % -sized standalone svg dissolves like raster but rendered tiny: fit read the
        // transient layout box and the half-zone branch was img-only. viewBox is the truth.
        const src = reader();
        expect(src).toContain("svgNaturalSize");
        expect(src).toContain("/^(img|svg)$/i.test(Ele.tagName)");
        expect(src).toContain("querySelectorAll('img, svg')");
    });
});
