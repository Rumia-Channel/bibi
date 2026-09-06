import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");
const stripNonCode = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'\\])\/\/.*$/gm, "$1").replace(/"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/g, '""');
const sources = (dir) => {
    const out = [];
    for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, e.name);
        if (e.isDirectory()) { if (e.name !== "node_modules") out.push(...sources(p)); }
        else if (/\.[cm]?js$/.test(e.name)) out.push(p);
    }
    return out;
};

// 不変条件: __src/zzz が使う sML.* は、sml.js本体か互換層のどちらかが提供しなければならない。
// sml 1→3 のようなメジャー上げで欠落すると起動時に死ぬ(v3で実証済み)。このテストがそれを殺す。
const COMPAT_MEMBERS = ["UA", "OS", "Environments", "limitMin", "limitMax", "limitMinMax", "replaceClass", "preventDefault", "apply", "applyRtL", "Easing", "Coords", "getCoord", "Scroller", "scrollTo", "CustomEvents", "CSS"];

describe("sml api coverage", () => {
    test("every sML.* member used in-tree is provided by the package or the compat layer", () => {
        const pkgSrc = read("node_modules/sml.js/sML.js");
        const provided = new Set([
            ...[...pkgSrc.matchAll(/sML\.([A-Za-z0-9_]+)\s*=/g)].map((m) => m[1]),
            ...COMPAT_MEMBERS,
        ]);
        const used = new Set();
        for (const f of [...sources(join(ROOT, "__src")), ...sources(join(ROOT, "zzz"))]) {
            const src = stripNonCode(readFileSync(f, "utf8"));
            for (const m of src.matchAll(/sML\.([A-Za-z0-9_]+)/g)) used.add(m[1]);
        }
        expect([...used].filter((u) => !provided.has(u)).sort()).toEqual([]);
    });
});

describe("restoreSMLv1Subsystems", () => {
    const load = async () => {
        globalThis.sML = {
            clamp: (Min, Num, Max) => (Max < Min) ? NaN : (Num < Min) ? Min : (Max < Num) ? Max : Num,
            forEach: (Ite, fun, This) => { for (let i = 0; i < Ite.length; i++) if (fun.call(This, Ite[i], i, Ite) === "break") break; },
            UserAgent: { Chromium: [139] },
            OperatingSystem: { Windows: [10] },
            appendCSSRule: () => "rule",
        };
        globalThis.window = globalThis; // Coords helpers compare against window/document like the v1 originals
        globalThis.document = { documentElement: { scrollWidth: 0, scrollHeight: 0, clientWidth: 0, clientHeight: 0 } };
        globalThis.ENV_VERSION = "test";
        globalThis.ENV_DEVELOPMENT = true;
        const mod = await import("../__src/bibi/resources/scripts/bibi.heart.context.mjs");
        return mod.restoreSMLv1Subsystems;
    };
    const unload = () => { delete globalThis.sML; delete globalThis.window; delete globalThis.document; delete globalThis.ENV_VERSION; delete globalThis.ENV_DEVELOPMENT; };

    test("restores limits, easing, coords, and aliases with v1 semantics", async () => {
        const restore = await load();
        try {
            expect(restore()).toBe(true);
            const sML = globalThis.sML;
            expect(sML.limitMin(-5, 0)).toBe(0);
            expect(sML.limitMax(99, 10)).toBe(10);
            expect(sML.limitMinMax(5, 0, 10)).toBe(5);
            expect(sML.limitMinMax(5, 10, 0)).toBeNaN();
            expect(sML.Easing.linear(0.5)).toBe(0.5);
            expect(sML.Easing.easeOutCirc(0)).toBe(0);
            expect(sML.Easing.easeOutCirc(1)).toBe(1);
            expect(sML.UA).toBe(sML.UserAgent);
            expect(sML.OS).toBe(sML.OperatingSystem);
            expect(sML.Environments).toEqual(expect.arrayContaining(["Chromium", "Windows"]));
            expect(sML.getCoord({ tagName: "DIV", offsetLeft: 3, offsetTop: 4, offsetParent: null, offsetWidth: 10, offsetHeight: 20 }))
                .toEqual({ X: 3, Y: 4, Top: 4, Right: 13, Bottom: 24, Left: 3, Width: 10, Height: 20 });
            const To = {}, From = { a: 1, f: () => 0 };
            sML.applyRtL(To, From, "ExceptFunctions");
            expect(To).toEqual({ a: 1 });
        } finally { unload(); }
    });

    test("curried forEach and CustomEvents bus round-trip without DOM", async () => {
        const restore = await load();
        try {
            restore();
            const sML = globalThis.sML;
            const seen = [];
            sML.forEach([1, 2, 3])((v, i) => { seen.push([v, i]); if (v === 2) return "break"; });
            expect(seen).toEqual([[1, 0], [2, 1]]);
            const Tar = {
                _ls: {},
                addEventListener(t, f) { (this._ls[t] ??= []).push(f); },
                removeEventListener(t, f) { this._ls[t] = (this._ls[t] ?? []).filter((g) => g !== f); },
                dispatchEvent(e) { (this._ls[e.type] ?? []).forEach((f) => f(e)); return true; },
            };
            const bus = new sML.CustomEvents("bibi");
            let got = null;
            bus.add(Tar, "bibi:x", (det) => { got = det; });
            await bus.dispatch(Tar, "bibi:x", { a: 1 });
            expect(got).toEqual({ a: 1 });
        } finally { unload(); }
    });
});
