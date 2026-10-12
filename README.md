Bibi
================================================================================================================================

EPUB Reader on your website.




Summary
--------------------------------------------------------------------------------------------------------------------------------

You can publish EPUB books on the web, with full-featured viewer running on web browser.
And you can embed it in other webpages (like YouTube videos).



### Spec.

* EPUB 3+ and 2 compliant. Supports both reflowable and fixed-layout books of various language.
* Made with JavaScript. Works compatibly with all major web browsers on various OS/devices.
* Free. Open source software released under the MIT License.



### Table of Contents

1. [How to Setup &amp; Read/Publish EPUB Books](#how-to-setup--readpublish-epub-books) (for Users/Publishers)
2. [How to Arrange Development Environment](#how-to-arrange-development-environment) (for Developers)
3. [License](#license)
4. [Special Thanks](#special-thanks)
5. [Supported by](#supported-by)




--------------------------------------------------------------------------------------------------------------------------------




How to Setup &amp; Read/Publish EPUB Books
--------------------------------------------------------------------------------------------------------------------------------

Bibi supports 3 ways to read/publish EPUB books:

* Read in browsers on your offline machine.
* Publish on the web to have your books read by someone.
* Use as an online EPUB viewer for your or visitors' local EPUBs.

In all cases,

1. Download Bibi from [GitHub release page](https://github.com/satorumurmur/bibi/releases) or [Bibi website](https://bibi.epub.link/#download).
2. And unzip it at first.



### Are you an user of BiB/i older than v1.0.0? 

The folder structure and default public URL has changed in Bibi v1.0.0.
But don't worry. You still can use not only the new style URL but also the same old style URL as before.

If you already published books on the web with BiB/i which version is older than v1.0.0, and want to update Bibi to v1.0.0 or newer, but do not want to change the public URLs of the books,

* Please download `Bibi-vX.Y.Z_with_BackCompatKit.zip`, and follow the document in it.



### Read in browsers on your local machine 

1. Open `bibi/index.html` in your browser, and
2. Drag and drop an EPUB book into the window.
3. That's all!



### Publish on the web

[Demo](https://bibi.epub.link/#demo).

You can publish both unzipped folder and zipped EPUB archive.

Using unzipped folder is recommended for the book which is heavy or contains many files.
Using zipped EPUB file is recommended for the book which is light and contains less files.

In both ways, at first, upload `bibi` and 'bibi-bookshelf' folders to the same directory on your web server.
`bibi` contains all programs of Bibi, and 'bibi-bookshelf' is for the storage of the books you upload.
You can use different directory for the bookshelf instead of 'bibi-bookshelf' by editing "bookshelf" option in 'bibi/presets/default.js'.


#### Publish unzipped folders

1. Upload `bibi` and 'bibi-bookshelf' folders to the same directory on your web server.
2. Unzip an EPUB book,
    1. Change the file extension from `.epub` to `.zip` (`BOOKNAME.epub` -> `BOOKNAME.zip`), and
    2. Unzip the file with some tool.
3. Upload the unzipped folder `BOOKNAME` into `bibi-bookshelf` directory, and
4. Access to `https://your.web.site/somewhere/bibi/?book=BOOKNAME` by your browser. (note that it has no extension)
5. Or embed code below into your blog entry or other webpages, and visit the entry.

````
<a href="https://your.web.site/somewhere/bibi/?book=BOOKNAME" data-bibi="embed" data-bibi-style="[[ CSS for embeded Bibi frame, as you like ]]">[[ Title of the Book ]]</a><script src="https://your.web.site/somewhere/bibi/and/jo.js"></script>
````


#### Publish zipped EPUB files

1. Upload `bibi` and 'bibi-bookshelf' folders to the same directory on your web server.
2. Upload your EPUB book (ex. `BOOKNAME.epub`) to `bibi-bookshelf` directory, and
3. Access to `https://your.web.site/somewhere/bibi/?book=BOOKNAME.epub` by your browser.
4. Or embed code below into your blog entry or other webpages, and visit the entry.

````
<a href="https://your.web.site/somewhere/bibi/?book=BOOKNAME.epub" data-bibi="embed" data-bibi-style="[[ CSS for embeded Bibi frame, as you like ]]">[[ Title of the Book ]]</a><script src="https://your.web.site/somewhere/bibi/and/jo.js"></script>
````


### Use as an online EPUB viewer

1. Upload `bibi` folder on your web server.
2. Navigate visitors to `https://your.web.site/somewhere/bibi/`.
3. Visitors can read one's local EPUBs by draging and dropping EPUBs into the window.

If you want to disable local file loading, set `"accept-local-file"` to `"no"` in `bibi/presets/default.js`.

### Book content and script policy

`allow-scripts-in-content` defaults to `false` in `bibi/presets/default.js`.
With this setting, Bibi sanitizes EPUB content and navigation documents, including EPUB 2 NCX links.
Book titles, authors, publishers, and local filenames are displayed as text, not executable HTML.
Only enable content scripts for books you trust; book content runs in the reader's origin.

### Paged illustrations

In paged mode on viewports at least 4:3 wide, portrait illustrations use one pane rather than a whole opening.
Vertical-text pages can share the other pane with prose without wrapping prose on both sides of a picture.
A standalone portrait fills the preceding prose's vacant pane when it fits. If that opening is already occupied, the portrait opens the following prose instead: portrait on the right and text on the left for right-to-left books.
Eligibility uses the rendered prose's occupied width and page bands, not a character-count threshold. Pairing is recomputed after relayout until the pane groups settle, and illustration zones are reused across resizes.
This is atomic pane placement, not unrestricted floating: landscape illustrations, small inline images, fixed-layout pages, captioned figures, and headings/navigation without prose do not opt into portrait/prose adoption.
Landscape illustrations can still use the full opening. Links to an adopted illustration's original EPUB spine entry remain usable.




How to Arrange Development Environment
--------------------------------------------------------------------------------------------------------------------------------



### Requirements

* [Bun](https://bun.sh/) 1.4.2 or newer
    - [Installation](https://bun.sh/docs/installation/).
    - Used for dependency installation, tests, and the local `zzz` CLI.
* [Node.js](https://nodejs.org/) 24.2 or newer (24 LTS recommended)
    - Used for webpack and the development server. The full webpack watch build was observed to become unresponsive with growing CPU/memory usage under Bun on Windows; the server deliberately uses Node.js.
    - No native build tools like Python / Visual C++ are needed.
* Note for Windows: this repository renames the local build tool directory `zzz...` (named so in the upstream repository) to `zzz`, because trailing dots are not a valid directory name on Windows/NTFS.



### Arrangements

1. Clone [this repository](https://github.com/satorumurmur/bibi/). 
2. $ `cd <the local repository>`
3. $ `bun install`


### Project structure

* `__src/bibi/resources/scripts/bibi.js` exposes the reader API; `bibi.heart.js` loads the engine modules.
* `bibi.heart.context.mjs` holds shared state and sML compatibility helpers; `lifecycle` and `settings` handle startup and configuration.
* `loader` and `operator` handle EPUB packages, resources, and navigation; `reader` handles pagination, destinations, and wide-screen two-pane layouts.
* `interface` implements controls, search, bookmarks, and reading-position persistence.
* `__src/bibi/extensions` contains ZIP extraction, content sanitization, and BibiZine YAML support.
* `__src/bibi/and/jo.js` supports embedding; `wardrobe` and `resources/styles` provide the UI styles. `__src__back-compat` contains the optional legacy URL kit.
* `zzz` and `webpack.config.mjs` generate `__dist` and release ZIPs. `tests` covers behavior that can run without a browser; rendering still requires browser smoke checks.


### How to Develop

1. $ `bun start`
    1. `zzz/serve.mjs` uses `webpack-dev-middleware` on Node.js to compile the development version in memory and watch its sources.
    2. It opens `http://localhost:62222/bibi/?book=` in your browser.
2. Edit source files.
    1. Source changes are recompiled and served automatically.
    2. HMR applies accepted JavaScript updates. Changes to HTML, standalone CSS, and files in `__dist` reload the browser.
    3. Reader extensions share the reader's webpack runtime so their HMR callbacks cannot overwrite each other. Jo keeps its host-page runtime; Wand keeps its worker runtime.

`bun run serve` starts the same server directly. For development files on disk, use `bun run develop` (one build) or `bun run develop+watch` (watch without an HTTP server).
The server listens only on `127.0.0.1`, rejects foreign Host/Origin headers, and sends `Cache-Control: no-store`. Use `bun run serve --no-open` to avoid opening a browser, or `bun run serve --port 62223` to choose a different port.
Always run `bun run build` to generate production files in `__dist` before publishing; do not publish the development server's bundles.

| Distribution                            | Source                                                                                                |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `__dist/bibi/*.html`                    | `__src/bibi/*.html`                                                                                   |
| `__dist/bibi/and/jo.js`                 | `__src/bibi/and/jo.js` + `__src/bibi/and/jo.scss`                                                     |
| `__dist/bibi/extensions/**`             | `__src/bibi/extensions/**`                                                                            |
| `__dist/bibi/presets/*.js`              | `__src/bibi/presets/*.js`                                                                             |
| `__dist/bibi/resources/scripts/bibi.js` | `__src/bibi/resources/scripts/*.js` + `__src/bibi/resources/scripts/bibi.book.scss`                   |
| `__dist/bibi/resources/styles/bibi.css` | `__src/bibi/resources/styles/*.scss`                                                                  |
| `__dist/bibi/wardrobe/**/*.css`         | Read documents in `__src/bibi/wardrobe/README-DRESS_ja` (Sorry..., currently README is Japanese only) |

Files in the `Distribution` column are written by `bun run develop`, `bun run develop+watch`, or `bun run build`; `bun start` serves the corresponding development assets in memory.
If you want to modify them, please edit files in the `Source` column instead of editing these files in `__dist` directly.


### How to Build to publish

* $ `bun run build`
    - The production version of Bibi is generated in `__dist` folder.
    - You can upload them to your online webserver.


### How to Make a Ditribution Package (Zip Archive)

* $ `bun run archive`
    1. A zipped archive of the production version of Bibi is generated in `__archives` folder.
    2. Temporary output is written under `__archives/.tmp/.dist`, using directory names valid on Windows.
    3. The CLI waits for ZIP completion and exits unsuccessfully if packaging fails.

### How to Verify

* $ `bun test`
    - Exercises two-pane grouping and destination geometry (LTR, RTL, and vertical), sML compatibility behavior, real ZIP extraction, CLI/archive success and failure paths, cleanup preservation of user books, and development-server host/origin protection and ZIP byte ranges.
    - Tests of source spelling/import wiring have been removed; they did not exercise the reader.
* Browser smoke checks:
    - Open both sample EPUBs, use the index and page controls, and check paged and scrolling modes.
    - Open a local reflowable EPUB and verify navigation, pagination, and resizing. In wide-screen two-pane mode, index links and search ranges must resolve against actual page spacing, not the full viewport width.
    - With content scripts disabled, verify that metadata and navigation event handlers do not execute, unsafe navigation links are removed, and ordinary internal links still work.
    - Check development updates: accepted JavaScript modules update without a page reload; HTML and standalone CSS edits refresh the page.

* $ `bun audit`
    - Checks installed packages for vulnerabilities; a nonzero exit must not be treated as success.
    - The dependency lockfile includes range-safe fixes for 15 advisories found during the October 2026 review.
    - The remaining [`braces`, GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) dependency was removed: the server no longer uses `webpack-dev-server`/`http-proxy-middleware`, and cleanup uses Bun's native Glob plus `fs.rmSync` instead of `del`/`globby`/`fast-glob`. Deletion outside the working directory remains forbidden.
    - The reviewed lockfile reports no known vulnerabilities. No advisory suppression, fabricated patched version, or local dependency fork is used. Re-run `bun audit` after dependency updates; a clean audit is not a guarantee against undisclosed vulnerabilities.
    - `bun audit fix --dry-run` previews range-safe fixes before changing the lockfile.
* $ `bun outdated`
    - Lists dependencies newer than the pinned ranges. Empty output means fully tracking latest.
* $ `bun run build`
    - The production version of Bibi is generated in `__dist` folder. A passing build (`compiled ...` + `wove (production)`) proves the dependency set works.




License
--------------------------------------------------------------------------------------------------------------------------------



### Bibi ([ja](https://bibi.epub.link) / [en](https://github.com/satorumurmur/bibi))

* © [Satoru Matsushima](https://string-letters.com) ([@satorumurmur](https://twitter.com/satorumurmur))
* Open source under [the MIT License](https://github.com/satorumurmur/bibi/blob/master/LICENSE)



### Bibi is including and powered by these open source softwares:

* Core:
    - [sML.js](https://github.com/satorumurmur/sML) : © Satoru Matsushima / Licensed under [the MIT License](https://github.com/satorumurmur/sML/blob/master/LICENSE)
* UI:
    - [Material Symbols](https://fonts.google.com/icons) : © Google / Licensed under [the Apache License version 2.0](https://www.apache.org/licenses/LICENSE-2.0.html) (Outlined woff2 self-hosted in `__src/bibi/resources/styles/fonts/`, see its LICENSE)
* Extensions:
    - [Bibi Zip Loader](https://github.com/lunascape/bibi-zip-loader) : © Lunascape / Licensed under [the MIT License](https://github.com/lunascape/bibi-zip-loader/blob/master/LICENSE)
    - [DOMPurify](https://github.com/cure53/DOMPurify) : © Mario Heiderich / Dual licensed under [the Apache License Version 2.0 or the Mozilla Public License Version 2.0](https://github.com/cure53/DOMPurify/blob/master/LICENSE)
    - [JSZip](http://stuk.github.io/jszip) : © Stuart Knightley / Dual licensed under [the MIT License or the GPLv3](https://github.com/Stuk/jszip/blob/HEAD/LICENSE.markdown)
    - [JS-YAML](http://nodeca.github.io/js-yaml/) : © Vitaly Puzrin / Licensed under [the MIT License](https://github.com/nodeca/js-yaml/blob/master/LICENSE)
 *  - [NoSleep.js](https://github.com/richtr/NoSleep.js) : © Rich Tibbett / Licensed under [the MIT License](https://github.com/richtr/NoSleep.js/blob/master/LICENSE)




Special Thanks
--------------------------------------------------------------------------------------------------------------------------------

Thanks to the contributors and the users around the world!




Supported by
--------------------------------------------------------------------------------------------------------------------------------



### [Media Do Co.,Ltd](https://www.mediado.jp)

* Bibi v1.2.0 was developed with the huge support and many feedbacks from Media Do Co.,Ltd.



### [Lunascape](https://www.lunascape.tv)

* Bibi v1.0.0 was developed with greateful support and sponsoring from Lunascape.
* Lunascape also developed [Bibi Zip Loader](https://github.com/lunascape/bibi-zip-loader) especially for Bibi, which realized fast progressive loading of zipped EPUBs.



