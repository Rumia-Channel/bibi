import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";

// 不変条件: Chrome UI の色は var(--bibi-*) 経由に一元化し、
// _dress-patterns/_dark.scss が dark メディアクエリ内でその全名を上書きする。
// 新しい --bibi-* を追加して dark 側を書き忘れると、light にフォールバックして
// ダークモードだけ壊れる。これを loud に壊すための施錠。

const WARDROBE = new URL("../__src/bibi/wardrobe/", import.meta.url);
const DARK_SCSS = new URL("../__src/bibi/wardrobe/_dress-patterns/_dark.scss", import.meta.url);
const EVERYDAY_INDEX = new URL("../__src/bibi/wardrobe/everyday/_@.scss", import.meta.url);

const collectScssFiles = (dir) => {
    const out = [];
    for (const name of readdirSync(dir)) {
        const url = new URL(name, dir);
        const st = statSync(url);
        if (st.isDirectory()) out.push(...collectScssFiles(new URL(name + "/", dir)));
        else if (name.endsWith(".scss")) out.push(url);
    }
    return out;
};

// Fallback inside var() can nest (var(--a, var(--b, ...)), rgba(...), color.adjust(...)),
// so only the NAME is captured here; value parsing is deliberately not attempted.
const VAR_USE = /var\(\s*(--bibi-[a-z0-9-]+)\s*,/g;
const VAR_DEF = /(--bibi-[a-z0-9-]+)\s*:/g;

const scssFiles = collectScssFiles(WARDROBE).filter((u) => !u.pathname.endsWith("/_dark.scss"));

const used = new Set();
for (const file of scssFiles) {
    const src = readFileSync(file, "utf8");
    for (const m of src.matchAll(VAR_USE)) used.add(m[1]);
}

const darkSrc = readFileSync(DARK_SCSS, "utf8");
const mediaAt = darkSrc.indexOf("@media (prefers-color-scheme: dark)");
if (mediaAt < 0) throw new Error("tests/dress-dark: cannot locate dark media query in _dark.scss; update the test.");
const darkBlock = darkSrc.slice(mediaAt);

const defined = new Set();
for (const m of darkBlock.matchAll(VAR_DEF)) defined.add(m[1]);

describe("dress dark mode", () => {
    test("every var(--bibi-*) used in wardrobe is overridden in the dark media query", () => {
        const missing = [...used].filter((name) => !defined.has(name)).sort();
        expect(missing).toEqual([]);
    });

    test("dark override enables the dark color scheme", () => {
        expect(darkBlock).toContain("color-scheme: dark");
    });

    test("everyday dress forwards the dark partial", () => {
        expect(readFileSync(EVERYDAY_INDEX, "utf8")).toContain("_dress-patterns/dark");
    });
});
