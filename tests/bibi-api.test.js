import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";

// 不変条件: 起動チェーン (bibi.js→Bibi.ring→…→Bibi.start)・拡張登録 (Bibi.x)・
// 設定パイプラインの Bibi.* 名が消えると、呼出側 (bibi.js/各heartモジュール/拡張)
// が実行時に死ぬ。DOM不要の静的表面検査で施錠する。

const scriptsDir = new URL("../__src/bibi/resources/scripts/", import.meta.url);

// 起動・拡張・設定の要。1つでも欠けたら本番起動か拡張が壊れる中核集合。
const CORE_API = [
    "ring", // bibi.js: DOMContentLoaded の唯一の入口
    "hello",
    "initialize",
    "loadExtensions",
    "ready",
    "getBookData",
    "setBookData",
    "loadBook",
    "bindBook",
    "openBook",
    "start",
    "x", // 全拡張 (Zine含む) の登録口 Bibi.x(...)
    "preset", // 埋め込み preset 引渡し Bibi.preset(...)
    "SettingTypes",
    "SettingTypes_PresetOnly",
    "SettingTypes_UserOnly",
    "verifySettingValue",
    "applyFilteredSettingsTo",
    "ErrorMessages", // loader/operator の異常系マッピング
    "isCompatible",
    "byebye",
];

const definedApi = new Set();
for (const f of readdirSync(scriptsDir)) {
    if (!/^bibi\.heart\..+\.mjs$/.test(f)) continue;
    const src = readFileSync(new URL(f, scriptsDir), "utf8");
    const code = src
        .split("\n")
        .filter((line) => !/^\s*\/\//.test(line))
        .join("\n");
    for (const m of code.matchAll(/\bBibi\.([A-Za-z_$][\w$]*)\s*=/g)) definedApi.add(m[1]);
}

describe("Bibi.* API surface", () => {
    test("core lifecycle/extension/settings names all exist", () => {
        expect([...CORE_API].filter((name) => !definedApi.has(name))).toEqual([]);
    });

    test("extension entry Bibi.x lives in the extensions module", () => {
        const src = readFileSync(new URL("bibi.heart.extensions.mjs", scriptsDir), "utf8");
        expect(src.includes("Bibi.x =")).toBe(true);
    });
});
