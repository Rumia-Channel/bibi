import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import JSZip from "jszip";

const globals = ["Bibi", "B", "S", "I", "O"];
const saved = new Map(globals.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));

beforeAll(async () => {
    // Install the extension in a text-resource-only book environment; ZIP parsing is real.
    globalThis.Bibi = {
        ErrorMessages: { DataInvalid: "Data Invalid" },
        x: () => initialize => initialize(),
    };
    globalThis.S = { autostart: true };
    globalThis.I = { Catcher: {} };
    globalThis.O = { log: () => {}, isBin: () => false };
    await import("../__src/bibi/extensions/extractor/at-once.js");
});

beforeEach(() => {
    globalThis.B = {
        Type: "EPUB",
        Container: { Source: { Path: "META-INF/container.xml" } },
        Package: { Manifest: {} },
    };
});

afterAll(() => {
    for (const name of globals) {
        const descriptor = saved.get(name);
        if (descriptor) Object.defineProperty(globalThis, name, descriptor);
        else delete globalThis[name];
    }
});

describe("local ZIP extraction", () => {
    test("a File without a MIME type extracts its actual resources", async () => {
        const zip = new JSZip();
        zip.file("META-INF/container.xml", "<container/>");
        zip.file("CONTENT/chapter.xhtml", "<html><body>読書内容 &amp; text</body></html>");
        const bytes = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
        await O.loadZippedBookData(new File([bytes], "book.epub"));
        expect(B.Package.Manifest["META-INF/container.xml"].Content).toBe("<container/>");
        expect(B.Package.Manifest["CONTENT/chapter.xhtml"].Content).toBe("<html><body>読書内容 &amp; text</body></html>");
        expect(Object.keys(B.Package.Manifest).sort()).toEqual(["CONTENT/chapter.xhtml", "META-INF/container.xml"]);
    });

    test("accepting an empty MIME type does not accept non-ZIP data", async () => {
        await expect(O.loadZippedBookData(new File(["not a ZIP"], "book.epub")))
            .rejects.toBe(Bibi.ErrorMessages.DataInvalid);
    });

    test("a corrupt compressed entry rejects rather than hanging", async () => {
        const zip = new JSZip();
        zip.file("META-INF/container.xml", "<container/>", { createFolders: false });
        const bytes = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
        const header = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const dataStart = 30 + header.getUint16(26, true) + header.getUint16(28, true);
        bytes[dataStart] = 7; // Reserved DEFLATE block type; ZIP headers remain valid.
        await expect(O.loadZippedBookData(new File([bytes], "book.epub")))
            .rejects.toBeInstanceOf(Error);
    });
});
