import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const scriptsDir = new URL("../__src/bibi/resources/scripts/", import.meta.url);
const extensionsDir = new URL("../__src/bibi/extensions/", import.meta.url);
const read = (url) => readFileSync(url, "utf8");
const listMjs = (dirUrl, recursive) => {
    const out = [];
    const walk = (dir, base) => {
        for (const e of readdirSync(dir, { withFileTypes: true })) {
            if (e.isDirectory() && recursive) walk(join(dir, e.name), base + e.name + "/");
            else if (/\.m?js$/.test(e.name)) out.push(base + e.name);
        }
    };
    walk(fileURLToPath(dirUrl), "");
    return out;
};

const CALL = /\bO\.([A-Za-z_$][\w$]*)\s*\(/g;
const ASSIGN = /\bO\.([A-Za-z_$][\w$]*)\s*=/g;
const DEFINE = /defineProperty\(O,\s*['"]([^'"]+)['"]/g;

const collect = (files, base) => {
    const calls = new Map();
    const defs = new Set();
    for (const f of files) {
        const src = read(new URL(f, base));
        for (const m of src.matchAll(CALL)) {
            if (!calls.has(m[1])) calls.set(m[1], []);
            calls.get(m[1]).push(f);
        }
        for (const m of src.matchAll(ASSIGN)) defs.add(m[1]);
        for (const m of src.matchAll(DEFINE)) defs.add(m[1]);
    }
    return { calls, defs };
};

describe("O namespace integrity", () => {
    test("every called O.* helper is assigned somewhere", () => {
        const heart = collect(
            listMjs(scriptsDir, false).filter((f) => f.startsWith("bibi.heart.")),
            scriptsDir,
        );
        const ext = collect(listMjs(extensionsDir, true), extensionsDir);
        const calls = new Map([...heart.calls, ...[...ext.calls].filter(([k]) => !heart.calls.has(k))]);
        const defs = new Set([...heart.defs, ...ext.defs]);
        const missing = [...calls.entries()]
            .filter(([name]) => !defs.has(name))
            .map(([name, files]) => `${name} (called from ${files.slice(0, 3).join(", ")})`);
        expect(missing).toEqual([]);
    });
});
