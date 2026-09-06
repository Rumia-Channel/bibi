import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const src = readFileSync(join(ROOT, "__src/bibi/resources/scripts/bibi.heart.interface.mjs"), "utf8");

// 不変条件: 移動完了の全経路で現在位置が永続化されること。
// scroll停止だけでは paged めくり・ジャンプがこぼれる(v1の穴)。
// P のみ保存し % は積まない(%は画面依存で腐る)。
describe("reading progress persistence", () => {
    test("automark is bound to scroll-stop and all move completions", () => {
        for (const ev of ["bibi:stopped-scrolling", "bibi:focused-on", "bibi:scrolled-by"]) {
            expect(src).toContain(ev);
        }
        const m = src.match(/E\.add\(\[([^\]]+)\][\s\S]{0,120}automark/);
        expect(m).not.toBeNull();
        expect(m[1]).toContain("bibi:focused-on");
        expect(m[1]).toContain("bibi:scrolled-by");
    });

    test("automark payload carries P only, never %", () => {
        const m = src.match(/automark: \(\) => \{ try \{([\s\S]*?)\} catch/);
        expect(m).not.toBeNull();
        expect(m[1]).toContain("Automarks");
        expect(m[1]).toContain("R.getP()");
        expect(m[1]).not.toContain("'%'");
    });
});
