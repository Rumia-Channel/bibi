import { describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import JSZip from "jszip";

const CLI = fileURLToPath(new URL("../zzz/cli.mjs", import.meta.url));
const { name, version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const packageName = name === "bibi" ? "Bibi" : name;
const run = (args, cwd) => spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: "utf8", timeout: 10000 });

const isolated = async (check) => {
    const cwd = mkdtempSync(join(tmpdir(), "bibi-cli-"));
    try { await check(cwd); }
    finally { rmSync(cwd, { recursive: true, force: true }); }
};

describe("build CLI failures", () => {
    test("unknown operations fail instead of reporting success", () => isolated(cwd => {
        const result = run(["--unknown-operation"], cwd);
        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Unknown operation: unknown-operation");
    }));

    test("malformed weave options report an actionable failure", () => isolated(cwd => {
        const result = run(["--weave", "invalid+option+extra"], cwd);
        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Invalid weave option: invalid+option+extra");
    }));

    test("missing archive input fails without producing a distribution", () => isolated(cwd => {
        const result = run(["--archive"], cwd);
        expect(result.status).toBe(1);
        expect(result.stdout).not.toContain("archived");
        expect(readdirSync(cwd)).toEqual([]);
    }));
});

describe("distribution archive", () => {
    test("waits for ZIP completion and preserves file contents", () => isolated(async cwd => {
        const input = join(cwd, "__archives", ".tmp", ".dist", "bibi");
        mkdirSync(input, { recursive: true });
        writeFileSync(join(input, "index.html"), "<h1>Archive contents</h1>");
        const result = run(["--archive"], cwd);
        expect(result.status).toBe(0);
        const archiveRoot = join(cwd, "__archives");
        const output = readdirSync(archiveRoot).find(dir => dir.startsWith(packageName + "_"));
        const archive = await JSZip.loadAsync(readFileSync(join(archiveRoot, output, `${packageName}-v${version}.zip`)));
        expect(await archive.file(`${packageName}-v${version}/bibi/index.html`).async("string")).toBe("<h1>Archive contents</h1>");
        expect(archive.files[`${packageName}-v${version}/bibi-bookshelf/`].dir).toBe(true);
    }));
});

describe("build cleanup", () => {
    test("removes generated directories and hidden OS files without deleting user books", () => isolated(cwd => {
        const dist = join(cwd, "__dist");
        mkdirSync(join(dist, "bibi", "resources", "scripts"), { recursive: true });
        mkdirSync(join(dist, "bibi-bookshelf", "__samples"), { recursive: true });
        mkdirSync(join(dist, ".hidden"), { recursive: true });
        mkdirSync(join(cwd, "__archives", ".tmp", ".dist"), { recursive: true });
        writeFileSync(join(dist, "bibi", "index.html"), "generated");
        writeFileSync(join(dist, "bibi", "resources", "scripts", "bibi.js"), "generated");
        writeFileSync(join(dist, "bibi-bookshelf", "__samples", "sample.epub"), "sample");
        writeFileSync(join(dist, "bibi-bookshelf", "my-book.epub"), "keep this book");
        writeFileSync(join(dist, ".hidden", ".DS_Store"), "OS metadata");
        writeFileSync(join(dist, ".hidden", "Thumbs.db"), "OS metadata");
        expect(run(["--clean"], cwd).status).toBe(0);
        expect(existsSync(join(dist, "bibi"))).toBe(false);
        expect(existsSync(join(dist, "bibi-bookshelf", "__samples"))).toBe(false);
        expect(existsSync(join(dist, ".hidden", ".DS_Store"))).toBe(false);
        expect(existsSync(join(dist, ".hidden", "Thumbs.db"))).toBe(false);
        expect(existsSync(join(cwd, "__archives", ".tmp"))).toBe(false);
        expect(readFileSync(join(dist, "bibi-bookshelf", "my-book.epub"), "utf8")).toBe("keep this book");
    }));

    test("refuses deletion outside the working directory", () => isolated(cwd => {
        const work = join(cwd, "work");
        const outside = join(cwd, "outside");
        mkdirSync(work);
        mkdirSync(outside);
        writeFileSync(join(outside, "book.epub"), "outside book");
        const conductor = new URL("../zzz/as.conductor.mjs", import.meta.url).href;
        const result = spawnSync(process.execPath, ["-e", `const {default: zzZ} = await import(${JSON.stringify(conductor)}); zzZ.Conductor.delete('../outside');`], { cwd: work, encoding: "utf8", timeout: 10000 });
        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Refusing to delete");
        expect(readFileSync(join(outside, "book.epub"), "utf8")).toBe("outside book");
    }));
});
