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
        ZineData: { Source: { Path: "zine.yaml" } },
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

const Archive = async (Entries) => {
    const zip = new JSZip();
    for (const [Name, Content] of Object.entries(Entries)) zip.file(Name, Content);
    const bytes = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
    return new File([bytes], "book.zip");
};

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

describe("a book of images", () => {
    test("an archive of images is a book of images, and its pages are in a human order", async () => {
        await O.loadZippedBookData(await Archive({
            "pages/10.png": "ten",
            "pages/2.png": "two",
            "pages/1.png": "one",
        }));
        expect(B.Type).toBe("ImageZIP");
        expect(B.ImagePaths).toEqual(["pages/1.png", "pages/2.png", "pages/10.png"]);
        expect(B.ArchiveRoot).toBe("");
        expect(Object.keys(B.Package.Manifest).sort()).toEqual(["pages/1.png", "pages/10.png", "pages/2.png"]);
        expect(B.Package.Manifest["pages/1.png"].DataType).toBe("Blob");
        expect(await B.Package.Manifest["pages/1.png"].Content.text()).toBe("one");
    });

    test("the leftovers of a file browser are not pages of a book", async () => {
        await O.loadZippedBookData(await Archive({
            "01.png": "one",
            "__MACOSX/01.png": "junk",
            ".hidden/02.png": "junk",
            "Thumbs.db": "junk",
            "desktop.ini": "junk",
            "notes.txt": "text",
        }));
        expect(B.Type).toBe("ImageZIP");
        expect(B.ImagePaths).toEqual(["01.png"]);
        expect(Object.keys(B.Package.Manifest)).toEqual(["01.png"]);
    });

    test("the names of the pages are kept exactly as they are", async () => {
        await O.loadZippedBookData(await Archive({
            "a&b'c#d?e%f.png": "one",
            "日本語.png": "two",
        }));
        expect(B.Type).toBe("ImageZIP");
        expect(B.ImagePaths).toEqual(["a&b'c#d?e%f.png", "日本語.png"]);
        expect(Object.keys(B.Package.Manifest).sort()).toEqual(["a&b'c#d?e%f.png", "日本語.png"]);
    });
});

describe("the classification of a book", () => {
    test("the metadata of a book tells what kind of book it is", async () => {
        await O.loadZippedBookData(await Archive({
            "META-INF/container.xml": "<container/>",
            "OPS/content.opf": "<package/>",
            "OPS/page.xhtml": "<html/>",
        }));
        expect(B.Type).toBe("EPUB");
        expect(B.ArchiveRoot).toBe("");
        expect(B.ImagePaths).toEqual([]);
        expect(Object.keys(B.Package.Manifest).sort()).toEqual(["META-INF/container.xml", "OPS/content.opf", "OPS/page.xhtml"]);
    });

    test("a book wrapped in a folder is a book, and its files are relative to that folder", async () => {
        await O.loadZippedBookData(await Archive({
            "book/META-INF/container.xml": "<container/>",
            "book/OPS/content.opf": "<package/>",
        }));
        expect(B.Type).toBe("EPUB");
        expect(B.ArchiveRoot).toBe("book/");
        expect(Object.keys(B.Package.Manifest).sort()).toEqual(["META-INF/container.xml", "OPS/content.opf"]);
    });

    test("a Zine is a Zine, and its YAML is where it belongs", async () => {
        await O.loadZippedBookData(await Archive({
            "zine.yaml": "title: Test\n",
            "page01.html": "<html/>",
        }));
        expect(B.Type).toBe("Zine");
        expect(B.ZineData.Source.Path).toBe("zine.yaml");
        expect(Object.keys(B.Package.Manifest).sort()).toEqual(["page01.html", "zine.yaml"]);
    });

    test("an archive that holds no book at all is rejected", async () => {
        await expect(O.loadZippedBookData(await Archive({ "notes.txt": "text" })))
            .rejects.toBe("Unsupported Book Format");
    });
});
