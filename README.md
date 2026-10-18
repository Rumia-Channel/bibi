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



### v2.2.2

This patch fixes front-matter illustrations and paired-page navigation without changing the schemaVersion 1 reading-position or host-navigation APIs:

* Percentage-width front matter classifies wide illustrations by their intrinsic size, not a transient iframe width; fitted image bounds round outward to prevent clipped edges.
* Paired pages reserve a full-height opening and focus together, including at the end of a book, keeping unequal-height pictures visible and forward/backward page turns in order.

The reader and `zzz` packages are versioned `2.2.2`; `bun run archive` generates `Bibi-v2.2.2.zip`.


### v2.2.1

This patch fixes reader layout and menubar visibility without changing the schemaVersion 1 reading-position or host-navigation APIs:

* Fractional-width panes no longer enter orthogonal-flow gutter pagination and push title-page content out of view.
* Native horizontal-text figures retain publisher-defined sizing, alignment, spacing, and flow; foreign wrapper margins are reset only for adopted illustrations.
* Fitted single-picture covers use image-page navigation and stay centered in their standalone opening instead of exposing the following page.
* Moving out of the menubar or switching away from the reader clears hover-only visibility so the controls do not remain stuck on screen.
* Reflowable books default to 48px of padding at both the top and bottom, for vertical and horizontal text. Left/right padding remains 24px; fixed-layout pages are unchanged.


### v2.2.0

This release preserves the schemaVersion 1 reading-position API and adds host-controlled volume navigation:

* Configured standalone readers show a previous/next-volume boundary page before leaving the book. A separate outward action navigates; an inward action returns to the real page. Wheel momentum and held keys cannot immediately cross volumes.
* The opt-in **戻る** button appears beside the TOC. Destinations are refreshed and verified against the current book/file identity and the host's same-origin path allowlist.
* Only a document-pinned or preloaded preset can enable host navigation. URL-selected presets, ordinary readers and iframe readers cannot enable it.
* The toolbar and reader geometry account for safe-area insets and the visual viewport. Page-sized tap bands use each outer page's third: each viewport sixth in two-pane mode, each third in single-pane mode.

The complete deployment/API contract is [HOST_SERIES_NAVIGATION_ja.md](HOST_SERIES_NAVIGATION_ja.md).


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

1. Download Bibi from [this repository's GitHub release page](https://github.com/Rumia-Channel/bibi/releases).
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
Reflowable books may declare individual illustration pages `pre-paginated`, even with `spread-none` and a centered page spread; those standalone portraits remain eligible. An adopted illustration's emptied source page is removed from the physical scroll flow. Pane widths use the current page band, not the auto-sized body's previous image width.
This is atomic pane placement, not unrestricted floating: landscape illustrations, small inline images, wholly fixed-layout books, covers, explicit multi-page spreads, captioned figures, and headings/navigation without prose do not opt into portrait/prose adoption.
Landscape illustrations can still use the full opening. Links to an adopted illustration's original EPUB spine entry remain usable.
Small inline images retain publisher-defined spacing across relayouts; only adopted illustrations have their foreign wrapper margins reset. Fractional-width horizontal-text panes use normal pagination rather than orthogonal-flow gutters.
Native horizontal-text figures are not converted into picture panes. Fitted single-picture covers remain centered when opened or revisited, even inside a reflowable book.
Standalone picture classification uses intrinsic media dimensions even when the EPUB sets the image width to `100%`. Paired pages share a stage-height opening; focusing either member keeps both pages in view.




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

1. Clone [this repository](https://github.com/Rumia-Channel/bibi/).
2. $ `cd <the local repository>`
3. $ `bun install`


### Host integration (schemaVersion 1)

The reader exposes `Bibi.API` directly and Jo exposes `Bucket.api` for iframe embedding. `schemaVersion` is `1`. Jo methods return promises; direct `getState()` and `getPosition()` are synchronous. Subscribe before embedding, then await `Bucket.api.ready` before navigating.

```javascript
const url = new URL('/vendor/bibi/', location.origin);
url.search = new URLSearchParams({
    book: '/epubs/book.epub',
    'autostart-embedded': 'yes',
    'book-key': 'book-123',
    'content-hash': 'file-sha256',
    'storage-namespace': 'my-library',
    'storage-user': 'opaque-user-id'
});
const bucket = new window['bibi:jo'].Bucket({ 'bibi-href': url.href });
const unsubscribe = bucket.api.subscribe('bibi:position-changed', event => {
    console.log(event.bookKey, event.contentHash, event.sessionId, event.position);
});
document.body.append(bucket.Anchor);
bucket.embed();
await bucket.api.ready;
const state = await bucket.api.getState();
const position = await bucket.api.getPosition();
const restored = await bucket.api.restorePosition(position.location, {
    bookKey: 'book-123', contentHash: 'file-sha256'
});
console.log(state, restored.position);
// Before replacing or removing this reader:
unsubscribe();
bucket.api.dispose();
bucket.Frame.remove();
bucket.Anchor.remove();
```

| API / field | Contract |
| --- | --- |
| `getState()` | Identity, `status` (`loading`, `ready`, `error`), `operable`, `error`, and `initialRestore`. A ready reader can temporarily be inoperable during movement or relayout. |
| `getPosition()` | `{ location: { p, cfi }, progress, progressBasis, atEnd, layout: { iipp, pageIndex, pageCount } }`. Save `location`, not layout diagnostics. |
| `restorePosition(location, identity?)` | Loads a lazy spine item when necessary, moves to the source point, and returns `{ requestedLocation, position }` with the actual visible position. A page's leading point can precede the requested character. |
| `subscribe(type, listener)` | Public `bibi:state-changed`, `bibi:position-changed` and `bibi:host-navigation-changed` envelopes; returns an unsubscribe function. Notifications carry schema, session, book, and content identities. |
| `ready` / `dispose()` | Jo readiness promise / release listeners and outstanding requests. Use a new Bucket when replacing a book. |
| `getHostNavigationState()` | `{ enabled, loading, navigating, visibleBoundary, error }`. Boundary UI does not change the real position or page count. |
| `refreshHostNavigation()` | Refreshes verified host metadata. Rejects with `HOST_NAVIGATION_DISABLED` outside a configured standalone deployment. |

Locations refer to the original sanitized source DOM before pagination and illustration transfer. Point CFIs use `/6/<even-spine-step>!/4/...` and UTF-16 text offsets; P identifies a source element and cannot distinguish characters in a long paragraph. CFI takes precedence when both are present. Range CFIs, nested indirections, nonlinear spine targets, missing nodes, and out-of-range offsets are rejected rather than silently clamped or replaced with P.

On mixed image/prose pages, the leading location can belong to the illustration's original spine item; prose does not override an earlier visible illustration.

Progress weights each linear spine item equally. `spine-text` uses the source UTF-16 text fraction inside the item, excluding whitespace-only nodes; fixed-layout and textless items use `(itemIndex + 1) / itemCount` with `spine-items`. Progress does not use rendered page count. `atEnd` means the end is currently visible, **not** that the user has finished the book. The host owns server saving, synchronization, and finished-state decisions.

For initial restoration, put the JSON location in the `location` query parameter using `URLSearchParams`. Explicit `location` / legacy URL destinations take precedence over local Automark, which takes precedence over the book head. `state.initialRestore` reports the outcome, error, and actual `position` once operable, including the head fallback when an explicit location is invalid; that fallback is not treated as a successful restore. Live errors reject with `code`, including `NOT_READY`, `BUSY`, `INVALID_LOCATION`, `LOCATION_NOT_FOUND`, `INVALID_IDENTITY`, `IDENTITY_MISMATCH`, and `RESTORE_FAILED`; Jo also reports `TIMEOUT`, `SESSION_CHANGED`, and `DISPOSED`.

Jo's request/response transport correlates `requestId` and checks the exact origin and iframe window. Session and host book/file identities separate readers and reject stale notifications. Existing typed `move`, `focus`, `changeView`, and `togglePanel` helpers remain available after startup.

`storage-namespace` replaces the legacy book storage label with a tuple of namespace, `storage-user`, `book-key`, and `content-hash`; book key and hash are required. This isolates users and revisions even when EPUB metadata identifiers match and survives reader/preset path changes within the same origin. It is not cross-origin or cross-device synchronization. Without the namespace, legacy labels remain unchanged: `sugar-for-biscuits` is an **additive** discriminator when enabled, not a replacement for deployment/preset identity.

Serve the complete `bibi/` tree unchanged, preferably on the host's origin. Extensionless ZIP routes such as `/epubs/<hash>` require a host preset with `"extract-if-necessary": [".epub", ".zip", ""]`. Keep `"allow-scripts-in-content": false`. ZIP fetches include same-origin cookies by default; `"request-with-credentials": true` explicitly enables cross-origin credentials. A signed cross-origin redirect needs CORS and exposed Range response headers; do not forward authentication secrets in reader URLs. CSP must permit the reader's scripts, worker/WASM execution, blob content frames, styles, images, fonts, and the intended book endpoints. A restrictive iframe sandbox without script/same-origin permissions is incompatible with the reader; allowing both does not make trusted same-origin reader code an isolation boundary.


### Project structure

* `__src/bibi/resources/scripts/bibi.js` exposes the reader API; `bibi.heart.js` loads the engine modules.
* `bibi.heart.context.mjs` holds shared state and sML compatibility helpers; `lifecycle` and `settings` handle startup and configuration.
* `location` records original-source P / point-CFI anchors; `api` exposes versioned state, settled positions, and restoration; `storage` defines host-scoped book labels.
* `loader` and `operator` handle EPUB packages, resources, and navigation; `reader` handles pagination, destinations, and wide-screen two-pane layouts.
* `interface` implements controls, search, bookmarks, and reading-position persistence.
* `__src/bibi/extensions` contains ZIP extraction, content sanitization, and BibiZine YAML support.
* `__src/bibi/and/jo.js` supports embedding; `wardrobe` and `resources/styles` provide the UI styles. `__src__back-compat` contains the optional legacy URL kit.
* `zzz` and `webpack.config.mjs` generate `__dist` and release ZIPs. `tests` covers engine/build behavior; `tests/browser` exercises only distribution reader assets in Chromium.


### How to Develop

1. $ `bun start`
    1. `zzz/serve.mjs` uses `webpack-dev-middleware` on Node.js to compile the development version in memory and watch its sources.
    2. It opens `http://localhost:62222/bibi/?book=` in your browser.
2. Edit source files.
    1. Source changes are recompiled and served automatically.
    2. HMR applies accepted JavaScript updates. Changes to HTML, standalone CSS, and files in `__dist` reload the browser.
    3. Reader extensions share the reader's webpack runtime so their HMR callbacks cannot overwrite each other. Jo keeps its host-page runtime; Wand and the ZIP bootstrap keep standalone worker runtimes.
    4. Restart the server after changing `webpack.config.mjs`; that configuration is loaded at startup, unlike watched application source files.

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
    - `bibi/build-manifest.json` records version, source commit/dirty state, deterministic timestamp, lockfile SHA-256, toolchain versions, and every reader asset's size/SHA-256. Required reader, Jo, CSS, preset, sanitizer, and ZIP-worker files are checked.
    - Run `bun run verify:dist` before importing the distribution. Use a clean fixed-ref checkout for publication; a dirty-source manifest is diagnostic evidence, not a clean-release claim.


### How to Make a Ditribution Package (Zip Archive)

* $ `bun run archive`
    1. A zipped archive of the production version of Bibi is generated in `__archives` folder.
    2. Temporary output is written under `__archives/.tmp/.dist`, using directory names valid on Windows.
    3. The CLI waits for ZIP completion and exits unsuccessfully if packaging fails.
    4. Packaging verifies the manifest, required assets, CRC, paths, and each file's digest before reporting success. Jo is required in both build output and ZIP.
    5. Entries are sorted; DOS timestamps derive from `SOURCE_DATE_EPOCH` or the source commit time, with fixed permissions and UTC handling. Identical source, lockfile, toolchain, and build inputs produce identical ZIP bytes; output folder creation times and timezones do not affect ZIP metadata.
    6. To verify an existing ZIP, run `bun zzz/distribution.mjs verify-zip <archive-path>`.


### GitHub Releases

The CI workflow tests, audits, builds, and runs artifact-only Chromium integration scenarios on branch pushes and pull requests. A `v*` tag push also runs `bun run archive` and publishes `Bibi-<tag>.zip` on GitHub Releases.

Update the reader and `zzz` versions and the lockfile on `develop` first, merge into `master` with `--no-ff`, then create and push an annotated `v<version>` tag from `master`. Publishing rejects a tag that does not match `package.json` or whose commit is not included in `master`.

For an existing tag, run the **CI** workflow manually with its `tag` input, or use `gh workflow run ci.yml --ref master -f tag=v2.0.0`. The build checks out that tag, not the current branch, so existing tags do not need to be moved.

Only the publishing job has `contents: write`; it uses the built-in `GITHUB_TOKEN`, without a separate secret. New releases stay drafts until the ZIP has been attached. Prerelease versions are marked as prereleases. Re-running the workflow reuses the release and replaces its matching ZIP asset without replacing its title or notes.

### How to Verify

* $ `bun test`
    - Exercises two-pane grouping and destination geometry (LTR, RTL, and vertical), sML compatibility behavior, real ZIP extraction, CLI/archive success and failure paths, cleanup preservation of user books, and development-server host/origin protection and ZIP byte ranges.
    - Tests of source spelling/import wiring have been removed; they did not exercise the reader.
* Browser smoke checks:
    - Open both sample EPUBs, use the index and page controls, and check paged and scrolling modes.
    - Open a local reflowable EPUB and verify navigation, pagination, and resizing. In wide-screen two-pane mode, index links and search ranges must resolve against actual page spacing, not the full viewport width.
    - With content scripts disabled, verify that metadata and navigation event handlers do not execute, unsafe navigation links are removed, and ordinary internal links still work.
    - Check development updates: accepted JavaScript modules update without a page reload; HTML and standalone CSS edits refresh the page.

* $ `bunx playwright install chromium` then `bun run build && bun run test:browser`
    - Exercises character-level restore across fonts/viewports, TOC and typed Jo navigation, paged/scrolling and fixed layouts, illustration source anchors, lazy spine loading, initial-location precedence, namespaces across deployment/user/revision changes, multiple iframe/session/source isolation, end/load-failure states, cookie authentication, and signed-style CORS/Range redirects.
    - CI installs Chromium with `--with-deps` and `fonts-noto-cjk`. Japanese fixtures explicitly select `Noto Serif CJK JP` or Windows `MS Mincho`, rather than relying on a Latin serif fallback with unusable vertical CJK advances. Books require suitable system or embedded fonts; real Wasabi configuration and production CSP/authentication still require host acceptance checks.
    - Failed CI browser checks upload the actual surface as the `browser-failure` artifact. Portrait-flow checks require the illustration on the right and a fully visible source character in the left pane, not a sliver of the following page.
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



