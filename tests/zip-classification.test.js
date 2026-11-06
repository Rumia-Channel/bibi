import { describe, expect, test } from 'bun:test';
import { classifyEntries } from '../__src/bibi/resources/scripts/bibi.heart.zip.mjs';

describe('ZIP content identification', () => {
    test('metadata takes precedence over images, including wrapped and malformed books', () => {
        expect(classifyEntries(['book/META-INF/container.xml', 'book/zine.yaml', '1.png']))
            .toEqual({ Type: 'EPUB', ArchiveRoot: 'book/', ImagePaths: [] });
        expect(classifyEntries(['book/zine.yaml', 'book/1.png']))
            .toEqual({ Type: 'Zine', ArchiveRoot: 'book/', ImagePaths: [] });
        expect(classifyEntries(['META-INF/container.xml', '1.png']).Type).toBe('EPUB');
        expect(classifyEntries(['outer/META-INF/container.xml', 'META-INF/container.xml']).ArchiveRoot).toBe('');
    });

    test('natural order includes subfolders, leading zeroes and integers above Number precision', () => {
        const Paths = ['part10/1.png', 'part2/10.png', 'part2/2.png', 'part2/01.png', 'part2/1.png',
            'part2/9007199254740993.png', 'part2/9007199254740992.png'];
        expect(classifyEntries(Paths).ImagePaths).toEqual(['part2/1.png', 'part2/01.png', 'part2/2.png',
            'part2/10.png', 'part2/9007199254740992.png', 'part2/9007199254740993.png', 'part10/1.png']);
    });

    test('directories, unsafe paths and OS metadata do not become pages or override image detection', () => {
        const Paths = ['1.png', '2.png/', '.hidden/2.png', '__MACOSX/META-INF/container.xml',
            '__MACOSX/2.png', '.hidden/zine.yaml', 'Thumbs.db', 'desktop.ini', 'readme.txt',
            'code.php/3.png', '../4.png', '/5.png', 'http://host/6.png', 'folder\\7.png'];
        expect(classifyEntries(Paths)).toEqual({ Type: 'ImageZIP', ArchiveRoot: '', ImagePaths: ['1.png'] });
    });

    test('bitmap formats and literal names survive without URL normalization', () => {
        const Paths = ['1.PNG', '2.jpeg', '3.jpg', '4.gif', '5.webp', '6.avif', '7.bmp',
            '8 & "quoted" #?%.png', '日本語.png'];
        expect(classifyEntries([...Paths].reverse()).ImagePaths).toEqual(Paths);
        expect(classifyEntries(['readme.txt', 'vector.svg', 'movie.mp4']).Type).toBe('');
        expect(classifyEntries([]).Type).toBe('');
    });
});
