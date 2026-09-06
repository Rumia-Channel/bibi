import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const bookStyle = () => readFileSync(join(ROOT, "__src/bibi/resources/scripts/bibi.book.scss"), "utf8");
const darkDress = () => readFileSync(join(ROOT, "__src/bibi/wardrobe/_dress-patterns/_dark.scss"), "utf8");

// 不変条件: 本文ダークは OS 連動のメディアクエリでのみ効き、chrome と同一パレットを使う。
// publisher CSS には !important の最小集合 (canvas/素テキスト/リンク) でのみ勝つ。
describe("book dark content", () => {
    test("dark media block overrides canvas, text, and links", () => {
        const src = bookStyle();
        expect(src).toContain("@media (prefers-color-scheme: dark)");
        expect(src).toContain("color-scheme: dark");
        expect(src).toContain("background-color: #0d1117 !important");
        expect(src).toContain("color: #e6edf3 !important");
        expect(src).toContain("color: #58a6ff !important");
    });

    test("content palette matches the chrome dark palette", () => {
        const dress = darkDress();
        for (const hex of ["#0d1117", "#e6edf3", "#58a6ff"]) expect(dress).toContain(hex);
    });
});
