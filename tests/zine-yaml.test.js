import { describe, expect, test } from "bun:test";
import * as jsyaml from "js-yaml";


describe("zine YAML load route", () => {
    test("load parses a zine front-matter shape the package builder consumes", () => {
        const YAML = jsyaml.load("title: Test Zine\nlanguage: ja\nspine:\n  - page1.html\n  - page2.html right\n");
        expect(YAML["title"]).toBe("Test Zine");
        expect(Array.isArray(YAML["spine"])).toBe(true);
        expect(YAML["spine"].length).toBe(2);
    });
});
