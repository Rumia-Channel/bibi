import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const file = (p) => readFileSync(join(ROOT, p), "utf8");
const scssFiles = (dir) => {
    const out = [];
    for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, e.name);
        if (e.isDirectory()) out.push(...scssFiles(p));
        else if (e.name.endsWith(".scss")) out.push(p);
    }
    return out;
};

describe("vendored material symbols", () => {
    test("latest font bits + license are committed in-tree", () => {
        expect(existsSync(join(ROOT, "__src/bibi/resources/styles/fonts/material-symbols-outlined.woff2"))).toBe(true);
        expect(existsSync(join(ROOT, "__src/bibi/resources/styles/fonts/LICENSE"))).toBe(true);
        expect(statSync(join(ROOT, "__src/bibi/resources/styles/fonts/material-symbols-outlined.woff2")).size).toBeGreaterThan(1_000_000); // full variable font, not a broken subset
        expect(file("__src/bibi/resources/styles/fonts/LICENSE")).toContain("Apache License");
    });

    test("no SCSS reaches into node_modules (quietDeps unnecessary)", () => {
        const bad = scssFiles(join(ROOT, "__src")).filter((f) => /@(?:use|import|forward)\s*["']~/.test(readFileSync(f, "utf8")));
        expect(bad).toEqual([]);
    });

    test("style entry uses the vendored partial, not the npm package", () => {
        const entry = file("__src/bibi/resources/styles/bibi.scss");
        expect(entry).toContain('"symbols"');
        expect(entry).not.toContain("material-symbols");
    });
});

describe("archiver v8 usage", () => {
    test("named ZipArchive import (v8 dropped the default factory)", () => {
        const src = file("zzz/as.conductor.mjs");
        expect(src).toContain("{ ZipArchive }");
        expect(src).not.toMatch(/import\s+archiver\s+from/);
    });
});
