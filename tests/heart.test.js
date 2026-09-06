import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";

// 不変条件1: aggregator (bibi.heart.js) が再exportする15名は bibi.js の
// `import *` 経由でグローバル化され、拡張が参照する。欠落＝拡張の実行時死。
// 不変条件2: heart分割モジュール間に循環importができると起動時にTDZで死ぬ。

const scriptsDir = new URL("../__src/bibi/resources/scripts/", import.meta.url);
const read = (name) => readFileSync(new URL(name, scriptsDir), "utf8");

const EXPECTED_EXPORTS_15 = ["B", "Bibi", "C", "D", "E", "I", "L", "M", "O", "P", "R", "S", "U", "W", "X"];

const exportedNames = (src) =>
    [...src.matchAll(/export\s*\{([^}]+)\}\s*from/g)].flatMap((m) =>
        m[1].split(",").map((e) => {
            const parts = e.trim().split(/\s+as\s+/);
            return parts[parts.length - 1].trim();
        }),
    );

const importTargets = (src) => [
    ...src.matchAll(/from\s*['"](\.[^'"]+)['"]/g).map((m) => m[1]),
    ...src.matchAll(/^import\s*['"](\.[^'"]+)['"]/gm).map((m) => m[1]),
];

const heartModules = readdirSync(scriptsDir).filter((f) => /^bibi\.heart\..+\.mjs$/.test(f));

describe("heart aggregator", () => {
    test("re-exports exactly the 15 documented names", () => {
        expect(exportedNames(read("bibi.heart.js")).sort()).toEqual(EXPECTED_EXPORTS_15);
    });

    test("import graph between heart modules is acyclic", () => {
        const nodes = new Set(["bibi.heart.js", ...heartModules]);
        const edges = new Map();
        for (const f of nodes) {
            const deps = new Set();
            for (const t of importTargets(read(f))) {
                const base = t.split("/").pop();
                if (nodes.has(base)) deps.add(base);
            }
            edges.set(f, deps);
        }
        const state = new Map(); // 0=unvisited 1=in-stack 2=done
        const visit = (n, stack) => {
            if (state.get(n) === 1) throw new Error(`circular import: ${[...stack, n].join(" -> ")}`);
            if (state.get(n) === 2) return;
            state.set(n, 1);
            for (const d of edges.get(n) ?? []) visit(d, [...stack, n]);
            state.set(n, 2);
        };
        for (const n of nodes) visit(n, []);
    });

    test("context hub imports nothing (cycle-free by construction)", () => {
        expect(importTargets(read("bibi.heart.context.mjs"))).toEqual([]);
    });
});
