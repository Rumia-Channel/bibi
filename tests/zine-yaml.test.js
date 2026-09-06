import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import * as jsyaml from "js-yaml";

// 不変条件: js-yaml v4で消えた safeLoad を誰かが復活させると、BibiZine開扉が
// 実行時に死ぬ。zine.js は jsyaml.load 一本であること＋loadの輸入形状を施錠する。

const zineSrc = readFileSync(
    new URL("../__src/bibi/extensions/zine.js", import.meta.url),
    "utf8",
);

describe("zine YAML load route", () => {
    test("no safeLoad anywhere near the load path", () => {
        expect(zineSrc.includes("safeLoad")).toBe(false);
    });

    test("openYAML goes through jsyaml.load", () => {
        expect(zineSrc.includes("jsyaml.load(")).toBe(true);
    });

    test("js-yaml namespace import exposes load (and no safeLoad)", () => {
        expect(typeof jsyaml.load).toBe("function");
        expect("safeLoad" in jsyaml).toBe(false);
    });

    test("load parses a zine front-matter shape the package builder consumes", () => {
        const YAML = jsyaml.load("title: Test Zine\nlanguage: ja\nspine:\n  - page1.html\n  - page2.html right\n");
        expect(YAML["title"]).toBe("Test Zine");
        expect(Array.isArray(YAML["spine"])).toBe(true);
        expect(YAML["spine"].length).toBe(2);
    });
});
