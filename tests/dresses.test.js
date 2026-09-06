import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

// 不変条件: ビルドに載るDress名は「英数始まり・英数/_/-のみ」で、
// 同名は ready-made が custom-made を黙って潰す（両載りはしない）。

const composerSrc = readFileSync(
    new URL("../zzz/as.composer.mjs", import.meta.url),
    "utf8",
);

// リポジトリ実物の検証式をそのまま取り出して実行する（写経の防止）。
// 書式が変わって取り出せなくなったら、 loud に壊れて知らせる。
const checkBody = composerSrc.match(/const\s+check\s*=\s*\(\s*Ds\s*\)\s*=>\s*([^;]+);/)?.[1];
if (!checkBody) throw new Error("tests/dresses: cannot locate `check` in zzz/as.composer.mjs; update the extractor.");
const check = new Function("Ds", `return (${checkBody});`);
const prioPred = composerSrc.match(/check\(\s*Orders\[\s*['"]custom-made['"]\s*\]\)\.filter\(\s*(D\s*=>\s*!\s*ReadyMades\.includes\s*\(\s*D\s*\))\s*\)/)?.[1];
if (!prioPred) throw new Error("tests/dresses: cannot locate ready-made priority filter in zzz/as.composer.mjs; update the extractor.");
const resolveDresses = new Function(
    "Orders",
    "check",
    `const ReadyMades = check(Orders['ready-made']); const CustomMades = check(Orders['custom-made']).filter(${prioPred}); return { 'ready-made': ReadyMades, 'custom-made': CustomMades };`,
);

const Orders = (await import("../__src/bibi/wardrobe/_dresses.mjs")).default;

describe("dress registration", () => {
    test("invalid names are dropped, not built", () => {
        const got = resolveDresses(
            {
                "ready-made": ["ok-name", "bad name", "../evil", "", "a/b", ".dot", "-lead", 42, null],
                "custom-made": [],
            },
            check,
        );
        expect(got["ready-made"]).toEqual(["ok-name"]);
    });

    test("non-array orders degrade to empty, not throw", () => {
        expect(resolveDresses({}, check)).toEqual({ "ready-made": [], "custom-made": [] });
        expect(resolveDresses({ "ready-made": "everyday", "custom-made": null }, check)).toEqual({
            "ready-made": [],
            "custom-made": [],
        });
    });

    test("ready-made wins on name clash", () => {
        const got = resolveDresses(
            { "ready-made": ["everyday"], "custom-made": ["everyday", "my-dress"] },
            check,
        );
        expect(got["ready-made"]).toEqual(["everyday"]);
        expect(got["custom-made"]).toEqual(["my-dress"]);
    });

    test("shipped _dresses.mjs survives validation with no clash", () => {
        const got = resolveDresses(Orders, check);
        const flat = [...(Orders["ready-made"] ?? []), ...(Orders["custom-made"] ?? [])];
        expect(check(flat)).toEqual(flat); // 全件が有効名＝ビルドから黙って落ちるDressなし
        const clash = got["ready-made"].filter((d) => got["custom-made"].includes(d));
        expect(clash).toEqual([]); // ready-made優先で潰れるcustom-madeなし
    });
});
