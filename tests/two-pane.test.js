import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isPairableSpread, isTwoPaneViewport, planTwoPaneGroups, shouldSoloLandscapeSpread } from "../__src/bibi/resources/scripts/bibi.heart.twopane.mjs";

const ROOT = join(import.meta.dir, "..");
const reader = () => readFileSync(join(ROOT, "__src/bibi/resources/scripts/bibi.heart.reader.mjs"), "utf8");

// 不変条件: 2ペイン化は paged 専用の幾何学ゲート + 論理グルーピングで成り立つ。
// 構造変更 (DOM 移動・頁採番) をしないことが設計の要。
describe("two-pane geometry", () => {
    test("viewport rule is height-doubled-fits-width, boundary inclusive", () => {
        expect(isTwoPaneViewport(1600, 800)).toBe(true);
        expect(isTwoPaneViewport(1599, 800)).toBe(false);
        expect(isTwoPaneViewport(1365, 768)).toBe(false);
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
    test("single pictures always stand alone; single-page text can pair", () => {
        expect(isPairableSpread(spread(Object.assign(txt(), { TwoPaneRendered: true })))).toBe(true);
        expect(isPairableSpread(spread({ Reflowable: true, OnlySingleSVG: true, Pages: [{}] }))).toBe(false);
        expect(isPairableSpread(spread({ PrePaginated: true, OnlySingleImg: true, Pages: [{}] }))).toBe(false);
        expect(isPairableSpread(spread(Object.assign(txt(), { TwoPaneRendered: true, TwoPaneSoloLocked: true })))).toBe(false);
        expect(isPairableSpread(spread(Object.assign(txt(), { TwoPaneRendered: true, Pages: [{}, {}] })))).toBe(false);
        expect(isPairableSpread(spread(txt()))).toBe(false); // not yet rendered
        expect(isPairableSpread(spread(pre({ SpreadPair: {} })))).toBe(false);
        expect(isPairableSpread({ Index: 2, Items: [{}, {}] })).toBe(false);
        expect(isPairableSpread({ Index: 2, Items: [] })).toBe(false);
    });
    test("paged mode isolates block media from prose by column breaks", () => {
        // one image per page: the point of splitting pages is separating picture and text areas.
        const src = reader();
        expect(src).toContain("Separate pictures from prose");
        expect(src).toContain("breakBefore");
        expect(src).toContain("breakAfter");
        expect(src).toContain("BibiDefaultBreaks");
    });
    test("greedy pairing leaves landscape-solo and odd tails single", () => {
        const P = (soloLandscape = false) => ({ pairable: true, soloLandscape });
        const S = { pairable: false, soloLandscape: false };
        expect(planTwoPaneGroups([P(), P(), P()])).toEqual([[0, 1], [2]]);
        expect(planTwoPaneGroups([P(), { pairable: true, soloLandscape: true }, P()])).toEqual([[0], [1], [2]]);
        expect(planTwoPaneGroups([S, P(), P(), S])).toEqual([[0], [1, 2], [3]]);
        expect(planTwoPaneGroups([])).toEqual([]);
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
    test("single-media items render fitted even in reflowable books", () => {
        // pre-paginated flag comes from package metadata; a lone picture page must not
        // fall into the column paginator just because the book declares reflowable layout.
        const src = reader();
        expect(src).toContain("!Item.OnlySingleSVG && !Item.OnlySingleImg");
    });
    test("two-pane never doubles width without a real pair", () => {
        // the Spreaded branch sizes left/right-tagged singles for a mate; without one,
        // two-pane must fit the pane instead of shrinking to a quarter.
        expect(reader()).toContain("R.TwoPane ? Promise.resolve(null)");
    });
    test("areafree single-media pages resolve to their picture", () => {
        // fitted single-media pages never get column areas; element resolution
        // (resize, destinations) must not crash on them.
        const src = reader();
        const i = src.indexOf("getSingleMediaElement(Page.Item); // fitted single-media");
        expect(i).toBeGreaterThan(-1);
        expect(src.slice(Math.max(0, i - 160), i)).toContain("OnlySingleSVG");
    });
});
