// Heart of Bibi — Loader (split from bibi.heart.js; peers via shared context, no cycles)

import { Bibi, O, L, R, I, U, D, S, E, X } from './bibi.heart.context.mjs';
import { B } from './bibi.heart.book.mjs';
import { Conc } from './bibi.instruments/Conc.mjs';

//==============================================================================================================================================
//----------------------------------------------------------------------------------------------------------------------------------------------

//-- Loader

//----------------------------------------------------------------------------------------------------------------------------------------------




L.wait = () => {
    L.Waiting = true;
    O.Busy = false;
    O.HTML.classList.remove('busy');
    O.HTML.classList.add('waiting');
    E.dispatch('bibi:waits');
    O.log(`(Waiting...)`, '<i/>');
    I.notify('');
    return new Promise(resolve => L.wait.resolve = resolve).then(() => {
        L.Waiting = false;
        O.Busy = true;
        O.HTML.classList.add('busy');
        O.HTML.classList.remove('waiting');
        I.notify(`Loading...`);
        return new Promise(resolve => setTimeout(resolve, 99));
    });
};


L.openNewWindow = (HRef) => {
    const WO = window.open(HRef);
    return WO ? WO : location.href = HRef;
};


L.play = () => {
    if(S['start-in-new-window']) return L.openNewWindow(location.href + (U['jo'] ? (/#/.test(location.href) ? '&' : '#') + `jo(` + Object.entries(U['jo']).map(([K, V]) => K + `=` + encodeURIComponent(V)).join('&') + `)` : ''));
    L.Played = true;
    R.resetStage();
    L.wait.resolve();
    E.dispatch('bibi:played');
};


L.initializeBook = (BookInfo = {}) => new Promise((resolve, reject) => {
    const reject_failedToOpenTheBook = (Msg) => reject(`Failed to open the book (${ Msg })`);
    if(!BookInfo.Book && !BookInfo.BookData) return reject_failedToOpenTheBook(Bibi.ErrorMessages.DataInvalid);
    const BookDataFormat =
        typeof BookInfo.Book     == 'string' ? 'URI' :
        typeof BookInfo.BookData == 'string' ? 'Base64' :
        typeof BookInfo.BookData == 'object' && BookInfo.BookData.size && BookInfo.BookData.type ? (BookInfo.BookData.name ? 'File' : 'Blob') : '';
    if(!BookDataFormat) return reject_failedToOpenTheBook(Bibi.ErrorMessages.DataInvalid);
    B.Type = !S['book'] ? '' : S['zine'] ? 'Zine' : 'EPUB';
    if(B.Type != 'EPUB') B.ZineData = { Source: { Path: 'zine.yaml' } };
    if(BookDataFormat == 'URI') {
        // Online
        if(O.Local) return reject(`Bibi can't open books via ${ D['book'] ? 'data-bibi-book' : 'URL' } on local mode`);
        B.Path = BookInfo.Book;
        const RootSource = (B.Type == 'Zine' ? B.ZineData : B.Container).Source;
        const InitErrors = [], initialize_as = (FileOrFolder) => ({
            Promised: (
                FileOrFolder == 'folder' ? O.download(RootSource).then(() => (B.PathDelimiter = '/') && '') :
                O.RangeLoader            ?  O.extract(RootSource).then(() => 'on-the-fly') :
                                 O.loadZippedBookData(  B.Path  ).then(() => 'at-once')
            ).then(ExtractionPolicy => {
                B.ExtractionPolicy = ExtractionPolicy;
                //O.log(`Succeed to Open as ${ B.Type } ${ FileOrFolder }.`);
                resolve(`${ B.Type } ${ FileOrFolder }`);
            }).catch(Err => {
                InitErrors.push(Err = (/404/.test(String(Err)) ? Bibi.ErrorMessages.NotFound : String(Err).replace(/^Error: /, '')));
                O.log(`Failed as ${ /^[aiueo]/i.test(B.Type) ? 'an' : 'a' } ${ B.Type } ${ FileOrFolder }: ` + Err);
                return Promise.reject();
            }),
            or:        function(fun) { return this.Promised.catch(fun); },
            or_reject: function(fun) { return this.or(() => reject_failedToOpenTheBook(
                InitErrors.length < 2 || InitErrors[0] == InitErrors[1] ? InitErrors[0] :
                InitErrors[0] == Bibi.ErrorMessages.Unidentified && InitErrors[1] == Bibi.ErrorMessages.CORSBlocked ? InitErrors[1] :
                `as a file: ${ InitErrors[0] } / as a folder: ${ InitErrors[1] }`
            )); }
        });
        O.isToBeExtractedIfNecessary(B.Path) ? initialize_as('file').or(() => initialize_as('folder').or_reject()) : initialize_as('folder').or_reject();
    } else {
        let BookData = BookInfo.BookData;
        let FileOrData;
        const MIMETypeREs = { EPUB: /^application\/epub\+zip$/, Zine: /^application\/(zip|x-zip(-compressed)?)$/ };
        const MIMETypeErrorMessage = 'File of this type is unacceptable';
        if(BookDataFormat == 'File') {
            // Local-Archived EPUB/Zine File
            if(!S['accept-local-file'])                      return reject(`Local file is set to unacceptable`);
            if(!BookData.name)                               return reject(`File without a name is unacceptable`);
            if(!/\.[\w\d]+$/.test(BookData.name))            return reject(`Local file without extension is set to unacceptable`);
            if(!O.isToBeExtractedIfNecessary(BookData.name)) return reject(`File with this extension is set to unacceptable`);
            if(BookData.type) {
                if(/\.epub$/i.test(BookData.name) ? !MIMETypeREs['EPUB'].test(BookData.type) :
                    /\.zip$/i.test(BookData.name) ? !MIMETypeREs['Zine'].test(BookData.type) : true) return reject(MIMETypeErrorMessage);
            }
            FileOrData = 'file';
            B.Path = '[Local File] ' + BookData.name;
        } else {
            if(BookDataFormat == 'Base64') {
                // Base64-Encoded EPUB/Zine Data
                if(!S['accept-base64-encoded-data']) return reject(`Base64 encoded data is set to unacceptable`);
                try {
                    const Bin = atob(BookData.replace(/^.*,/, ''));
                    const Buf = new Uint8Array(Bin.length);
                    for(let l = Bin.length, i = 0; i < l; i++) Buf[i] = Bin.charCodeAt(i);
                    BookData = new Blob([Buf.buffer], { type: BookInfo.BookDataMIMEType });
                    if(!BookData || !BookData.size || !BookData.type) throw '';
                } catch(_) {
                    return reject(Bibi.ErrorMessages.DataInvalid);
                }
                B.Path = '[Base64 Encoded Data]';
            } else {
                // Blob of EPUB/Zine Data
                if(!S['accept-blob-converted-data']) return reject(`Blob converted data is set to unacceptable`);
                B.Path = '[Blob Converted Data]';
            }
            if(!MIMETypeREs['EPUB'].test(BookData.type) && !MIMETypeREs['Zine'].test(BookData.type)) return reject(MIMETypeErrorMessage);
            FileOrData = 'data';
        }
        O.loadZippedBookData(BookData).then(() => {
            switch(B.Type) {
                case 'EPUB': case 'Zine':
                    B.ExtractionPolicy = 'at-once';
                    return resolve(`${ B.Type } ${ FileOrData }`);
                default:
                    return reject_failedToOpenTheBook(Bibi.ErrorMessages.DataInvalid);
            }
        }).catch(reject_failedToOpenTheBook);
    }
}).then(InitializedAs => {
    delete S['book-data'];
    delete S['book-data-mimetype'];
    return (B.Type == 'Zine' ? X.Zine.loadZineData() : L.loadContainer().then(L.loadPackage)).then(() => E.dispatch('bibi:initialized-book')).then(() => InitializedAs);
});


L.loadContainer = () => O.openDocument(B.Container.Source).then(L.loadContainer.process);

    L.loadContainer.process = (Doc) => B.Package.Source.Path = Doc.getElementsByTagName('rootfile')[0].getAttribute('full-path');


L.loadPackage = () => O.openDocument(B.Package.Source).then(L.loadPackage.process);

    L.loadPackage.process = (Doc) => { // This is Used also from the Zine Extention.
        Doc.Promises = []; E.dispatch('bibi:is-going-to:process-package', Doc);
        // ================================================================================
        // NAMESPACES
        // --------------------------------------------------------------------------------
        const XMLNS = {}, DocEle = Doc.documentElement;
        [DocEle, ...DocEle.children].forEach(_Ele => { if(!_Ele.hasAttributes()) return;
            const Atts = _Ele.attributes; Object.keys(Atts).forEach(i => { const Att = Atts[i]; if(!Att || !Att.name || !Att.value) return;
                const Matched = Att.name.match(/^xmlns:(\w+)$/);
                if(Matched) XMLNS[Matched[1]] = Att.value;
            })
        });
        const getOPFElementsByTagNameIn = (Anc, TN) => [...new Set([...Anc.getElementsByTagName(TN), ...Anc.getElementsByTagName('opf:' + TN), ...Anc.getElementsByTagNameNS(XMLNS['opf'], TN) ])],
               getDCElementsByTagNameIn = (Anc, TN) => [...new Set([                                 ...Anc.getElementsByTagName( 'dc:' + TN), ...Anc.getElementsByTagNameNS(XMLNS[ 'dc'], TN) ])];
        // ================================================================================
        // STRUCTURE
        // --------------------------------------------------------------------------------
        const _Package  = getOPFElementsByTagNameIn(Doc, 'package' )[0];
        const _Metadata = getOPFElementsByTagNameIn(Doc, 'metadata')[0], Metadata = B.Package.Metadata;
        const _Manifest = getOPFElementsByTagNameIn(Doc, 'manifest')[0], Manifest = B.Package.Manifest;
        const _Spine    = getOPFElementsByTagNameIn(Doc, 'spine'   )[0], Spine    = B.Package.Spine;
        const SourcePaths = {};
        // ================================================================================
        // METADATA
        // --------------------------------------------------------------------------------
        E.dispatch('bibi:is-going-to:process-package-metadata', _Metadata);
        // --------------------------------------------------------------------------------
        const UIDID = _Package.getAttribute('unique-identifier'), UIDE = UIDID ? Doc.getElementById(UIDID) : null, UIDTC = UIDE ? UIDE.textContent : '';
        Metadata['unique-identifier'] = UIDTC ? UIDTC.trim() : '';
        ['identifier', 'language', 'title', 'creator', 'publisher'].forEach(Pro => sML.forEach(getDCElementsByTagNameIn(Doc, Pro))(_Meta => (Metadata[Pro] ? Metadata[Pro] : Metadata[Pro] = []).push(_Meta.textContent.trim())));
        sML.forEach(getOPFElementsByTagNameIn(_Metadata, 'meta'))(_Meta => {
            if(_Meta.getAttribute('refines')) return; // Should be solved.
            let Property = _Meta.getAttribute('property');
            if(Property) {
                if(/^dcterms:/.test(Property)) {
                    if(!Metadata[Property]) Metadata[Property] = [];
                    Metadata[Property].push(_Meta.textContent.trim()); // 'dcterms:~'
                } else {
                    Metadata[Property] = _Meta.textContent.trim(); // ex.) 'rendition:~'
                }
            } else {
                let Name = _Meta.getAttribute('name');
                if(Name) {
                    Metadata[Name] = _Meta.getAttribute('content').trim(); // ex.) 'cover'
                }
            }
        });
        // --------------------------------------------------------------------------------
        if(!Metadata['identifier']) Metadata['identifier'] = Metadata['dcterms:identifier'] || [];
        if(!Metadata['language'  ]) Metadata['language'  ] = Metadata['dcterms:language'  ] || ['en'];
        if(!Metadata['title'     ]) Metadata['title'     ] = Metadata['dcterms:title'     ] || Metadata['identifier'];
        Metadata['rendition:layout'] = Metadata['omf:version'] || Metadata['rendition:layout'] == 'pre-paginated' ? 'pre-paginated' : 'reflowable';
        Metadata['rendition:orientation'] = Metadata['rendition:orientation'] == 'landscape' ? 'landscape' : 'portrait';
        Metadata['rendition:spread'] = Metadata['rendition:spread'] == 'none' ? 'none' : Metadata['rendition:spread'] == 'both' || Metadata['rendition:spread'] == 'portrait' ? 'both' : 'landscape';
        if(!/^(scrolled-(continuous|doc)|paginated)$/.test(Metadata['rendition:flow'])) Metadata['rendition:flow'] = 'auto';
        if(!/^(ttb|ltr|rtl|vertical|horizontal)$/.test(Metadata['scroll-direction'])) delete Metadata['scroll-direction'];
        if( Metadata[     'original-resolution']) Metadata[     'original-resolution'] = O.getViewportByOriginalResolution(Metadata[     'original-resolution']);
        if( Metadata[      'rendition:viewport']) Metadata[      'rendition:viewport'] = O.getViewportByMetaContent(       Metadata[      'rendition:viewport']);
        if( Metadata['fixed-layout-jp:viewport']) Metadata['fixed-layout-jp:viewport'] = O.getViewportByMetaContent(       Metadata['fixed-layout-jp:viewport']);
        if( Metadata[            'omf:viewport']) Metadata[            'omf:viewport'] = O.getViewportByMetaContent(       Metadata[            'omf:viewport']);
        // --------------------------------------------------------------------------------
        B.ID        =  Metadata['unique-identifier'] || Metadata['identifier'][0] || '';
        B.Language  =  Metadata['language'][0].split('-')[0];
        B.Title     =  Metadata['title'     ].join(', ');
        B.Creator   = !Metadata['creator'   ] ? '' : Metadata['creator'  ].join(', ');
        B.Publisher = !Metadata['publisher' ] ? '' : Metadata['publisher'].join(', ');
        R.title();
        B.PrePaginated = Metadata['rendition:layout'] == 'pre-paginated';
        B.Reflowable = !B.PrePaginated;
        B.ICBViewport = Metadata['original-resolution'] || Metadata['rendition:viewport'] || Metadata['fixed-layout-jp:viewport'] || Metadata['omf:viewport'] || null;
        // --------------------------------------------------------------------------------
        E.dispatch('bibi:processed-package-metadata', _Metadata);
        // ================================================================================
        // MANIFEST
        // --------------------------------------------------------------------------------
        E.dispatch('bibi:is-going-to:process-package-manifest', _Manifest);
        // --------------------------------------------------------------------------------
        const PackageDir = B.Package.Source.Path.replace(/\/?[^\/]+$/, '');
        sML.forEach(getOPFElementsByTagNameIn(_Manifest, 'item'))(_Item => {
            let Source = {
                'id': _Item.getAttribute('id'),
                'href': _Item.getAttribute('href'),
                'media-type': _Item.getAttribute('media-type')
            };
            if(/^https?:\/\//i.test(Source['href'])) {
                if(S['allow-external-item-href'] && S['trustworthy-origins'].includes(new URL(Source['href']).origin)) Source.External = true;
                else Source['href'] = '';
            }
            if(!Source['id'] || !Source['href'] || (!Source['media-type'] && B.Type == 'EPUB')) return false;
            Source.Path = Source.External ? Source['href'] : O.rrr(PackageDir + '/' + Source['href']);
            if(Manifest[Source.Path]) Source = Object.assign(Manifest[Source.Path], Source);
            if(!Source.Content) Source.Content = '';
            Source.Of = [];
            let Properties = _Item.getAttribute('properties');
            if(Properties) {
                Properties = Properties.trim().replace(/\s+/g, ' ').split(' ');
                     if(Properties.includes('cover-image')) B.CoverImage.Source = Source;
                else if(Properties.includes('nav'        )) B.Nav.Source        = Source, B.Nav.Type = 'Navigation Document';
            }
            const FallbackItemID = _Item.getAttribute('fallback');
            if(FallbackItemID) Source['fallback'] = FallbackItemID;
            Manifest[Source.Path] = Source;
            SourcePaths[Source['id']] = Source.Path;
        });
        [B.Container, B.Package].forEach(Meta => { if(Meta && Meta.Source) Meta.Source.Content = ''; });
        // --------------------------------------------------------------------------------
        E.dispatch('bibi:processed-package-manifest', _Manifest);
        // ================================================================================
        // SPINE
        // --------------------------------------------------------------------------------
        E.dispatch('bibi:is-going-to:process-package-spine', _Spine);
        // --------------------------------------------------------------------------------
        if(!B.Nav.Source) {
            const Source = Manifest[SourcePaths[_Spine.getAttribute('toc')]];
            if(Source) B.Nav.Source = Source, B.Nav.Type = 'TOC-NCX';
        }
        if(       B.Nav.Source)        B.Nav.Source.Of.push(       B.Nav);
        if(B.CoverImage.Source) B.CoverImage.Source.Of.push(B.CoverImage);
        // --------------------------------------------------------------------------------
        B.PPD = Spine['page-progression-direction'] = _Spine.getAttribute('page-progression-direction');
        if(!B.PPD || !/^(ltr|rtl)$/.test(B.PPD)) B.PPD = S['default-page-progression-direction']; // default;
        // --------------------------------------------------------------------------------
        const RenditionPropertyRE = /^((rendition:)?(layout|orientation|spread|page-spread))-([a-z\-]+)$/;
        const      BibiPropertyRE = /^(bibi:(allow-placeholder|no-adjustment|no-padding))$/;
        let SpreadBefore, SpreadAfter;
        if(B.PPD == 'rtl') SpreadBefore = 'right', SpreadAfter = 'left';
        else               SpreadBefore = 'left',  SpreadAfter = 'right';
        const SpreadsDocumentFragment = document.createDocumentFragment();
        sML.forEach(getOPFElementsByTagNameIn(_Spine, 'itemref'))(ItemRef => {
            const IDRef = ItemRef.getAttribute('idref'); if(!IDRef) return false;
            const Source = Manifest[SourcePaths[IDRef]]; if(!Source) return false;
            const Item = sML.create('iframe', { className: 'item', scrolling: 'no', allowtransparency: 'true', style: { width: '100vw', height: '100vh' },/*TimeCard: {}, stamp: function(What) { O.stamp(What, this.TimeCard); },*/
                IsItem: true,
                Source: Source,
                Type: O.getItemType(Source['media-type']),
                AnchorPath: Source.Path,
                FallbackChain: [],
                Scale: 1,
                Viewport: B.ICBViewport
            });
            Item['idref'] = IDRef;
            if(S['prioritise-fallbacks']) while(Item.Source['fallback']) {
                const FallbackItem = Manifest[SourcePaths[Item.Source['fallback']]];
                if(FallbackItem) Item.FallbackChain.push(Item.Source = FallbackItem);
                else delete Item.Source['fallback'];
            }
            Item.Source.Of.push(Item);
            let Properties = ItemRef.getAttribute('properties');
            if(Properties) {
                Properties = Properties.trim().replace(/\s+/g, ' ').split(' ');
                Properties.forEach(Pro => {
                    if(RenditionPropertyRE.test(Pro)) ItemRef[Pro.replace(RenditionPropertyRE, '$1')] = Pro.replace(RenditionPropertyRE, '$4');
                    if(     BibiPropertyRE.test(Pro)) ItemRef[Pro.replace(     BibiPropertyRE, '$1')] = true;
                });
            }
            Item['rendition:layout']       = ItemRef['rendition:layout']       || Metadata['rendition:layout']; if(Item['rendition:layout'] != 'pre-paginated') Item['rendition:layout'] = 'reflowable';
            Item['rendition:orientation']  = ItemRef['rendition:orientation']  || Metadata['rendition:orientation'];
            Item['rendition:spread']       = ItemRef['rendition:spread']       || Metadata['rendition:spread'];
            Item['rendition:page-spread']  = ItemRef['rendition:page-spread']  || ItemRef['page-spread'] || undefined;
            Item['bibi:allow-placeholder'] = ItemRef['bibi:allow-placeholder'] || undefined;
            Item['bibi:no-adjustment']     = ItemRef['bibi:no-adjustment']     || undefined;
            Item['bibi:no-padding']        = ItemRef['bibi:no-padding']        || undefined;
            Object.assign(Item, Item['rendition:layout'] == 'reflowable' ? {
                Reflowable: true, PrePaginated: false,
                AllowPlaceholder: B.ExtractionPolicy != 'at-once' && Item['bibi:allow-placeholder'],
                NoAdjustment: Item['bibi:no-adjustment'] ? true : false,
                NoPadding: Item['bibi:no-padding'] ? true : false
            } : {
                Reflowable: false, PrePaginated: true,
                AllowPlaceholder: B.ExtractionPolicy != 'at-once' && (Item['bibi:allow-placeholder'] || Metadata['rendition:layout'] == 'pre-paginated'),
                NoAdjustment: true,
                NoPadding: true
            });
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            Item.IndexInSpine = Spine.push(Item) - 1;
            if(ItemRef.getAttribute('linear') == 'no') {
                Item['linear'] = 'no',  Item.IsLinearItem = false, Item.IsNonLinearItem = true;
                Item.IndexInNonLinearItems = R.NonLinearItems.push(Item) - 1;
            } else {
                Item['linear'] = 'yes', Item.IsLinearItem = true,  Item.IsNonLinearItem = false;
                Item.Index = R.Items.push(Item) - 1;
                let Spread = null;
                if(Item.PrePaginated && Item['rendition:page-spread'] == SpreadAfter && Item.Index > 0) {
                    const PreviousItem = R.Items[Item.Index - 1];
                    if(Item.PrePaginated && PreviousItem['rendition:page-spread'] == SpreadBefore) {
                        PreviousItem.SpreadPair = Item;
                        Item.SpreadPair = PreviousItem;
                        Spread = Item.Spread = PreviousItem.Spread;
                        Spread.Box.classList.remove('single-item-spread-before', 'single-item-spread-' + SpreadBefore);
                        Spread.Box.classList.add(Item['rendition:layout']);
                        Spread.PrePaginated = PreviousItem.PrePaginated && Item.PrePaginated;
                    }
                }
                if(!Spread) {
                    Spread = Item.Spread = sML.create('div', { className: 'spread',
                        IsSpread: true,
                        Items: [], Pages: [],
                        Index: R.Spreads.length,
                        PrePaginated: Item.PrePaginated
                    });
                    Spread.Box = sML.create('div', { className: 'spread-box ' + Item['rendition:layout'], IsSpreadBox: true, Inside: Spread, Spread: Spread });
                    if(Item['rendition:page-spread']) {
                        Spread.Box.classList.add('single-item-spread-' + Item['rendition:page-spread']);
                        switch(Item['rendition:page-spread']) {
                            case SpreadBefore: Spread.Box.classList.add('single-item-spread-before'); break;
                            case SpreadAfter:  Spread.Box.classList.add('single-item-spread-after' ); break;
                        }
                    }
                    R.Spreads.push(SpreadsDocumentFragment.appendChild(Spread.Box).appendChild(Spread));
                }
                Item.IndexInSpread = Spread.Items.push(Item) - 1;
                Item.Box = Spread.appendChild(sML.create('div', { className: 'item-box ' + Item['rendition:layout'], IsItemBox: true, Inside: Item, Item: Item }));
                Item.Pages = [];
                const Page = sML.create('span', { className: 'page',
                    IsPage: true,
                    Spread: Spread, Item: Item,
                    IndexInItem: 0
                });
                Item.Pages.push(Item.Box.appendChild(Page));
                I.PageObserver.observePageIntersection(Page);
            }
        });
        R.createSpine(SpreadsDocumentFragment);
        // --------------------------------------------------------------------------------
        B.WritingMode =                                                                                   /^(zho?|chi|kor?|ja|jpn)$/.test(B.Language) ? (B.PPD == 'rtl' ? 'tb-rl' : 'lr-tb')
            :                                                                                                             /^(mo?n)$/.test(B.Language) ?                   'tb-lr'
            : /^(aze?|ara?|ui?g|urd?|kk|kaz|ka?s|ky|kir|kur?|sn?d|ta?t|pu?s|bal|pan?|fas?|per|ber|msa?|may|yid?|heb?|arc|syr|di?v)$/.test(B.Language) ?                             'rl-tb'
            :                                                                                                                                                                       'lr-tb';
        if(S['reader-view-mode'] == 'auto') {
            const RVMPriority = (() => {
                const Default    = ['paged', 'horizontal', 'vertical'];
                const Scrolled_H = ['horizontal', 'paged', 'vertical'];
                const Scrolled_V = ['vertical', 'horizontal', 'paged'];
                switch(Metadata['scroll-direction']) {
                    case 'ttb':             case   'vertical': return Scrolled_V;
                    case 'ltr': case 'rtl': case 'horizontal': return Scrolled_H;
                }
                switch(Metadata['rendition:flow']) {
                    case 'scrolled-continuous': case 'scrolled-doc': return /-tb$/.test(B.WritingMode) ? Scrolled_V : Scrolled_H;
                }
                return Default;
            })();
            for(let i = 0; i < 3; i++) if(S['available-reader-view-modes'].includes(RVMPriority[i])) {
                S['reader-view-mode'] = RVMPriority[i];
                break;
            }
        };
        // --------------------------------------------------------------------------------
        E.dispatch('bibi:processed-package-spine', _Spine);
        // ================================================================================
        E.dispatch('bibi:processed-package', Doc); return Promise.all(Doc.Promises);
    };


L.createCover = () => {
    if(L.createCover.Not) return Promise.resolve();
    const VCover = I.Veil.Cover, PCover = I.Panel.BookInfo.Cover;
    VCover.Info.innerHTML = PCover.Info.innerHTML = [
        [B.Title,   'strong'],
        [B.Creator,     'em'],
        [B.Publisher, 'span']
    ].map(BookMetaAndTagName => {
        const [BookMeta, TagName] = BookMetaAndTagName;
        return BookMeta ? `<` + TagName + `><span>` + BookMeta.replace(/([ 　・／]+)/g, '</span><span>$1') + `</span></` + TagName + `>` : '';
    }).filter(TaggedBookMeta => TaggedBookMeta).join(' ');
    let VCoverIcon = null, PCoverIcon = null, AltShown = false;
    const TimerID_showAlt = setTimeout(() => {
        VCoverIcon = VCover.insertBefore(I.getBookIcon(), VCover.Info);
        PCoverIcon = PCover.insertBefore(I.getBookIcon(), PCover.Info);
        VCover.className = PCover.className = 'without-cover-image';
        AltShown = true;
    }, 999);
    return new Promise((resolve, reject) => {
        if(!B.CoverImage.Source || !B.CoverImage.Source.Path) return reject();
        O.file(B.CoverImage.Source, { URI: true }).then(resolve).catch(reject);
    }).then(CoverImageSource => {
        clearTimeout(TimerID_showAlt);
        if(AltShown) {
            VCover.className = PCover.className = '';
            VCoverIcon.remove(), PCoverIcon.remove();
        }
        const CoverImageURI = CoverImageSource.URI;
        sML.style(VCover, { 'background-image': 'url(' + CoverImageURI + ')' });
        PCover.insertBefore(sML.create('img', { src: CoverImageURI }), PCover.Info);
        VCover.className = PCover.className = 'with-cover-image';
    }).catch(() => {
        // (do nothing)
    });
};
    L.createCover.Not = false;


L.loadNavigation = () => O.openDocument(B.Nav.Source).then(Doc => {
    const PNav = I.Panel.BookInfo.Navigation = I.Panel.BookInfo.insertBefore(sML.create('div', { id: 'bibi-panel-bookinfo-navigation' }), I.Panel.BookInfo.firstElementChild);
    PNav.innerHTML = '';
    const NavContent = document.createDocumentFragment();
    if(B.Nav.Type == 'Navigation Document') {
        sML.forEach(Doc.querySelectorAll('nav'))(Nav => {
            switch(Nav.getAttribute('epub:type')) {
                case 'toc':       Nav.classList.add('bibi-nav-toc'); break;
                case 'landmarks': Nav.classList.add('bibi-nav-landmarks'); break;
                case 'page-list': Nav.classList.add('bibi-nav-page-list'); break;
            }
            sML.forEach(Nav.getElementsByTagName('*'))(Ele => Ele.removeAttribute('style'));
            NavContent.appendChild(Nav);
        });
    } else { // toc.ncx
        const makeNavOLTree = (Ele) => {
            const ChildNodes = Ele.childNodes;
            let OL = undefined;
            for(let l = ChildNodes.length, i = 0; i < l; i++) {
                if(ChildNodes[i].nodeType != 1 || !/^navPoint$/i.test(ChildNodes[i].tagName)) continue;
                const NavPoint = ChildNodes[i];
                const NavLabel = NavPoint.getElementsByTagName('navLabel')[0];
                const Content  = NavPoint.getElementsByTagName('content')[0];
                const Text = NavPoint.getElementsByTagName('text')[0];
                if(!OL) OL = document.createElement('ol');
                const LI = sML.create('li', { id: NavPoint.getAttribute('id') }); LI.setAttribute('playorder', NavPoint.getAttribute('playorder'));
                const A  = sML.create('a', { href: Content.getAttribute('src'), innerHTML: Text.innerHTML.trim() });
                OL.appendChild(LI).appendChild(A);
                const ChildOL = makeNavOLTree(NavPoint);
                if(ChildOL) LI.appendChild(ChildOL);
            }
            return OL;
        };
        const NavOL = makeNavOLTree(Doc.getElementsByTagName('navMap')[0]);
        if(NavOL) NavContent.appendChild(document.createElement('nav')).appendChild(NavOL);
    }
    PNav.appendChild(NavContent);
    L.coordinateLinkages({ RootElement: PNav, BasePath: B.Nav.Source.Path, InNav: true });
    if(B.Nav.Source.Of.length == 1) B.Nav.Source.Content = '';
    return PNav;
});


L.coordinateLinkages = (Opt) => {
    if(typeof Opt             != 'object') return;
    if(typeof Opt.RootElement != 'object' || !Opt.RootElement || Opt.RootElement.nodeType != 1) return;
    if(typeof Opt.BasePath    != 'string' || !Opt.BasePath) return;
    const As = Opt.RootElement.getElementsByTagName('a'); if(!As) return;
    const BaseDir = Opt.BasePath.replace(/\/?([^\/]+)$/, '');
    for(let l = As.length, i = 0; i < l; i++) { const A = As[i];
        if(A.InNav = Opt.InNav ? true : false) {
            A.NavANumber = i + 1;
            A.addEventListener(E['pointerdown'], Eve => Eve.stopPropagation());
            A.addEventListener(E['pointerup'],   Eve => Eve.stopPropagation());
        }
        let HRefPathInSource = A.getAttribute('href'), HRefAttribute = 'href';
        if(!HRefPathInSource) {
            HRefPathInSource = A.getAttribute('xlink:href');
            if(HRefPathInSource) {
                HRefAttribute = 'xlink:href';
            } else {
                if(A.InNav) {
                    A.addEventListener('click', Eve => { Eve.preventDefault(); Eve.stopPropagation(); return false; });
                    A.classList.add('bibi-bookinfo-inactive-link');
                }
                continue;
            }
        }
        if(/^[a-zA-Z]+:/.test(HRefPathInSource)) {
            A.Destination = { External: HRefPathInSource };
        } else {
            const HRefPath = /^#/.test(HRefPathInSource) ? Opt.BasePath + HRefPathInSource : O.rrr(BaseDir + '/' + HRefPathInSource);
            const HRefFnH = HRefPath.split('#');
            const HRefFile = HRefFnH[0] ? HRefFnH[0] : Opt.BasePath;
            const HRefHash = HRefFnH[1] ? HRefFnH[1] : '';
            if(HRefHash && /^epubcfi\(.+?\)$/.test(HRefHash)) {
                A.Destination = R.getCFIDestination(HRefHash);
            } else sML.forEach(R.Items)(Item => {
                if(HRefFile == Item.AnchorPath) {
                    A.Destination = { ItemIndex: Item.Index }; // not IIPP. ElementSelector may be added.
                    if(HRefHash) A.Destination.ElementSelector = '#' + HRefHash;
                    return 'break'; //// break sML.forEach()
                }
            });
            if(A.Destination) {
                A.setAttribute('data-bibi-original-href', HRefPathInSource);
                A.setAttribute(HRefAttribute, B.Path + '/' + HRefPath);
            }
        }
        if(A.Destination) {
            A.jump = (Eve, Opt = {}) => {
                Eve.preventDefault(), Eve.stopPropagation();
                return (A.InNav ? I.Panel.toggle() : Promise.resolve()).then(() => {
                    if(A.Destination.External) {
                        // Go External
                        const TargetInSource = A.getAttribute('target');
                        if(/^_(parent|self|top)$/.test(TargetInSource)) location.href = A.Destination.External;
                        else                                                window.open(A.Destination.External);
                    } else if(L.Waiting) {
                        // Open with Links in Nav
                        if(S['start-in-new-window']) {
                            L.openNewWindow(location.href + (location.hash ? '&' : '#') + 'jo(nav=' + A.NavANumber + ')');
                        } else {
                            R.StartOn = A.Destination;
                            return L.play();
                        }
                    } else if(L.Opened) {
                        if(!A.InNav && I.Footnotes && !Opt.PreventFootnote && I.Footnotes.show(A)) return Promise.resolve();
                        const Dest = R.dest(A.Destination);
                        if(!Dest) return Promise.reject();
                        E.dispatch('bibi:jumps-a-link', Eve);
                        // if(!S['manualize-adding-histories']) I.History.add();
                        return R.focusOn(A.Destination, { Duration: 0 }).then(Destination => {
                            if(!S['manualize-adding-histories']) I.History.add({ UI: Opt.UI || A, SumUp: false, Destination: Destination });
                            E.dispatch('bibi:jumped-a-link', Eve);
                        });
                    }
                });
            };
            A.addEventListener('click', Eve => A.jump(Eve));
        }
        if(A.InNav && R.StartOn && R.StartOn.Nav == (i + 1) && A.Destination && !A.Destination.External) R.StartOn = A.Destination;
    }
};


L.preprocessResources = () => {
    E.dispatch('bibi:is-going-to:preprocess-resources');
    const Promises = [], PreprocessedResources = [], pushItemPreprocessingPromise = (Item, URI) => Promises.push(O.file(Item, { Preprocess: true, URI: URI }).then(() => PreprocessedResources.push(Item)));
    if(B.ExtractionPolicy) for(const FilePath in B.Package.Manifest) {
        const Item = B.Package.Manifest[FilePath];
        if(/\/(css|javascript)$/.test(Item['media-type'])) { // CSSs & JavaScripts in Manifest
            if(!Promises.length) O.log(`Preprocessing Resources...`, '<g:>');
            pushItemPreprocessingPromise(Item, true);
        }
    }
    return Promise.all(Promises).then(() => {/*
        if(B.ExtractionPolicy != 'at-once' && (B.PrePaginated || (sML.UA.Chromium || sML.UA.WebKit || sML.UA.Gecko))) return resolve(PreprocessedResources);
        R.Items.forEach(Item => pushItemPreprocessingPromise(Item, O.isBin(Item))); // Spine Items
        return Promise.all(Promises).then(() => resolve(PreprocessedResources));*/
        if(PreprocessedResources.length) {
            O.log(`Preprocessed: %O`, PreprocessedResources);
            O.log(`Preprocessed. (${ PreprocessedResources.length } Resource${ PreprocessedResources.length > 1 ? 's' : '' })`, '</g>');
        }
        E.dispatch('bibi:preprocessed-resources');
    });
};


L.loadSpread = (Spread, Opt = {}) => new Promise((resolve, reject) => {
    Spread.AllowPlaceholderItems = (S['allow-placeholders'] && Opt.AllowPlaceholderItems);
    let LoadedItemsInSpread = 0, SkippedItemsInSpread = 0;
    Spread.Items.forEach(Item => {
        L.loadItem(Item, { AllowPlaceholder: Opt.AllowPlaceholderItems })
        .then(() =>  LoadedItemsInSpread++) // Loaded
       .catch(() => SkippedItemsInSpread++) // Skipped
        .then(() => {
            if(LoadedItemsInSpread + SkippedItemsInSpread == Spread.Items.length) /*(SkippedItemsInSpread ? reject : resolve)*/resolve(Spread);
        });
    });
});


L.loadItem = async (Item, Opt = {}) => {
    const ProcessID = Item.LoadingProcessID = O.id();
    await Promise.resolve(Item.Loading);
    const IsPlaceholder = (S['allow-placeholders'] && Item.AllowPlaceholder && Opt.AllowPlaceholder) ? true : false;
    const ItemBox = Item.Box;
    const classify = (ClassName, TF) => [Item, ItemBox].forEach(TF ? Ele => Ele.classList.add(ClassName) : Ele => Ele.classList.remove(ClassName));
    let ContentURL;
    return Item.Loading = new Promise((resolve, reject) => {
        Item.IsPlaceholder = IsPlaceholder;
        classify('loading', true);
        classify('loaded', false);
        classify('placeholder', IsPlaceholder);
        !IsPlaceholder ? resolve() : reject('Placeholder');
    }).then(() => O.chain({ assure: () => ProcessID == Item.LoadingProcessID, Label: 'L.loadItem' },
        ...(Item.Source.External ? [
            S['allow-external-item-href'] ? ContentURL = Item.Source.Path : Promise.reject('External Item Not Allowed')
        ] : [
            () => L.fetchAndBuildItemSourceText(Item),
            O.EnabledIFramesWithBlobURL ? async () => ContentURL = await O.createBlobURL('Text', Item.SourceText, 'application/xhtml+xml') : undefined
        ]),
        () => L.loadItemFrame(Item, ContentURL)
    )).then(() => {
        O.log(`Item#${ String(Item.Index).padStart(3, 0) } is turned UP.`);
        classify('loaded', true);
        Item.Loaded = true;
        Item.Turned = 'Up';
        // Item.stamp('Loaded');
        E.dispatch('bibi:loaded-item', Item);
    }).catch(Reason => { // Placeholder (or Error)
        O.log(`Item#${ String(Item.Index).padStart(3, 0) } is turned DOWN:`, Reason);
        classify('loaded', false);
        classify('placeholder', true);
        if(Item.contentWindow) Item.contentWindow.stop() || O.log(`Item#${ String(Item.Index).padStart(3, 0) } STOPPED its window.`);
        if(Item.contentDocument) Item.contentDocument.querySelectorAll('[src], [*|href]').forEach(Ele => ['src','href','xlink:href'].forEach(Att => Ele.removeAttribute(Att)) || Ele.remove()) || O.log(`Item#${ String(Item.Index).padStart(3, 0) } REMOVED its elements.`);
        if(Item.parentElement) Item.parentElement.removeChild(Item);
        Item.src = '';
        Item.HTML = Item.Head = Item.Body = Item.Foot = Item.Pages[0];
        Item.IsPlaceholder = true;
        Item.Loaded = false;
        Item.Turned = 'Down';
        E.dispatch('bibi:prepared-placeholder', Item);
    }).then(() => {
        classify('loading', false);
        clearInterval(Item.ReloadTimer);
        delete Item.ReloadTimer;
        URL.revokeObjectURL(ContentURL);
        Item.removeEventListener('load', Item.onLoaded);
        delete Item.onLoaded;
        delete Item.Source.Content;
        delete Item.Source.Preprocessed;
        delete Item.Source.Retlieved;
        delete Item.SourceText;
        delete Item.LoadingProcessID;
        window.focus();
        return Item;
    });
};

L.fetchAndBuildItemSourceText = async (Item) => {
    const ProcessID = Item.LoadingProcessID;
    const DeclarationsRE = /<[\?\!]\w[^>]+?>/g;
    let Declarations, AdditionalHeader;
    return O.chain({ assure: () => ProcessID == Item.LoadingProcessID, Label: 'L.fetchAndBuildItemSourceText' },
        () => E.dispatch('bibi:is-going-to:build-item-source-text', Item),
        () => (Opt => !Opt ? Promise.reject('Item.Type Unknown') : O.file(Item.Source, {
            Preprocess: Opt.Preprocess,
            URI: Opt.URI,
            initialize: () => O.chain({ assure: () => ProcessID == Item.LoadingProcessID, Label: 'L.fetchAndBuildItemSourceText > O.file > initialize' },
                Opt.initialize_before,
                () => E.dispatch('bibi:is-going-to:initialize-item-source', Item),
                Opt.initialize_main,
                () => E.dispatch('bibi:initialized-item-source', Item),
                Opt.initialize_after
            ),
            finalize: Opt.finalize
        }))(
            Item.Type == 'MarkupDocument' ? {
                Preprocess: true, // (B.ExtractionPolicy || sML.UA.Gecko), // Preprocess if archived (or Gecko. For such books as styled only with -webkit/epub- prefixed properties. It's NOT Gecko's fault but requires preprocessing.)
                initialize_before: () => Item.SourceText = Item.Source.Content.trim(),
                initialize_main: async () => {
                    Declarations = Item.SourceText.match(DeclarationsRE);
                    if(Declarations) Item.SourceText = Item.SourceText.replace(DeclarationsRE, '').trim();
                    if(/<object\s/.test(Item.SourceText) && Item.SourceText.match(/<object\s[^>]+?>/g).filter(Obj => /\stype\s*=\s*["']image\/svg\+xml["']/.test(Obj) && /\sdata\s*=\s*["'](?!([a-zA-Z]+:)?\/+).+?\.svg["']/.test(Obj)).length) {
                        const ItemDOM = O.parseDOM(Item.SourceText, Item.Source['media-type']);
                        await Promise.all(Array.prototype.map.call(ItemDOM.querySelectorAll('object[type="image/svg+xml"][data$=".svg"]'), SOE => {
                            const ItemURL = new URL(Item.Source.Path, 'bibi:/'), SVGURL = new URL(SOE.getAttribute('data'), ItemURL), SVGSource = B.Package.Manifest[SVGURL?.pathname.slice(1)];
                            if(SVGSource) return O.chain({ assure: () => ProcessID == Item.LoadingProcessID, Label: 'L.fetchAndBuildItemSourceText > O.file > initialize > object svg' },
                                () => O.file(SVGSource),
                                () => {
                                    const SVGDOM = O.parseDOM(SVGSource.Content, SVGSource['media-type']);
                                    [['src','src'], ['href','href'], ['*|href','xlink:href']].forEach(SA => SVGDOM.querySelectorAll(`[${ SA[0] }]`).forEach(Ele => Ele.setAttribute(SA[1], O.relativePath({ From: ItemURL, To: new URL(Ele.getAttribute(SA[1]), SVGURL) }))));
                                    SOE.removeAttribute('data'), SOE.removeAttribute('type');
                                    SOE.innerHTML = SVGDOM.documentElement.outerHTML;
                                }
                            );
                        }));
                        Item.SourceText = ItemDOM.documentElement.outerHTML;
                    }
                    if(!S['allow-scripts-in-content']) {
                        Item.SourceText = O.sanitizeItemSourceText(Item.SourceText, { As: 'XHTML' });
                    }
                    if(Declarations) Item.SourceText = [...Declarations, Item.SourceText].join('\n');
                },
                initialize_after: () => Item.Source.Content = Item.SourceText,
                finalize: () => Item.SourceText = Item.Source.Content
            } :
            Item.Type == 'SVG' ? {
                Preprocess: true, // B.ExtractionPolicy,
                initialize_before: () => Item.SourceText = Item.Source.Content.trim(),
                initialize_main: () => {
                    Declarations = Item.SourceText.match(DeclarationsRE);
                    if(Declarations) Item.SourceText = Item.SourceText.replace(DeclarationsRE, '').trim();
                    if(!S['allow-scripts-in-content']) {
                        Item.SourceText = Item.SourceText.replace(/\s+xlink:href\s*=\s*(["'])blob:/ig, ' data-xlink-href-blob=$1');
                        Item.SourceText = Item.SourceText.replace(      /\s+href\s*=\s*(["'])blob:/ig,       ' data-href-blob=$1');
                        Item.SourceText = O.sanitizeItemSourceText(Item.SourceText, { As: 'SVG' });
                        Item.SourceText = Item.SourceText.replace(         / data-href-blob=(["'])/ig,            ' href=$1blob:');
                        Item.SourceText = Item.SourceText.replace(   / data-xlink-href-blob=(["'])/ig,      ' xlink:href=$1blob:');
                    }
                    if(Declarations) Item.SourceText = [...Declarations, Item.SourceText].join('\n');
                },
                initialize_after: () => Item.Source.Content = Item.SourceText,
                finalize: () => {
                    Item.SourceText = Item.Source.Content
                    const CSSLinks = [];
                    if(Declarations = Item.SourceText.match(DeclarationsRE)) {
                        Declarations.forEach(Declaration => {
                            const StyleSheetPath = Declaration.match(/^<\?xml-stylesheet\s(?:[^>]+?\s)?href\s*=\s*["'](?![a-z]+:\/\/)(.+?)['"]/)?.[1];
                            if(!StyleSheetPath) return;
                            if(Item.Source.Preprocessed) { if(!/^blob:/.test(StyleSheetPath)) return; }
                            else                         { if(!B.Package.Manifest[new URL(StyleSheetPath, new URL(Item.Source.Path, 'bibi:/')).pathname.slice(1)]) return; }
                            CSSLinks.push(Declaration.replace(/^<\?xml-stylesheet\s+/, '<link rel="stylesheet" ').replace(/\s*\?>$/, ' />'));
                        });
                        Item.SourceText = Item.SourceText.replace(DeclarationsRE, '').trim();
                    }
                    if(CSSLinks.length) AdditionalHeader = CSSLinks.join('\n');
                }
            } :
            Item.Type == 'BitmapImage' ? {
                URI: true,
                initialize_before: () => Item.SourceText = `<img class="bibi-spine-item-image" alt="" src="bibi:/${ Item.Source.Path }" />`,
                finalize: () => {
                    Item.SourceText = Item.SourceText.replace('bibi:/' + Item.Source.Path, Item.Source.URI); // URI is BlobURL or URI
                }
            } :
            null
        ),
        async () => {
            const ViewportMeta = Item.PrePaginated && (Item.Viewport = await O.getItemViewport(Item) || Item.Viewport || null)
                ? `<meta name="viewport" content="width=${ Item.Viewport.Width }, height=${ Item.Viewport.Height }" />`
                : `<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0" />`;
            if(Item.Type == 'MarkupDocument') {
                Item.SourceText = Item.SourceText.replace(/(<head(\s[^>]+)?>)/i, `$1\n` + ViewportMeta);
            } else {
                Item.SourceText = [
                    `<?xml version="1.0"?>`,
                    `<!DOCTYPE html>`,
                    `<html xmlns="http://www.w3.org/1999/xhtml">`,
                        `<head>`,
                            ViewportMeta,
                            `<meta charset="utf-8" />`,
                            `<title>${ B.FullTitle } - #${ Item.Index + 1 }/${ R.Items.length }</title>`,
                            (AdditionalHeader ? AdditionalHeader + '\n' : '') +
                        `</head>`,
                        `<body>`,
                            Item.SourceText,
                        `</body>`,
                    `</html>`
                ].join('\n');
            }
            Item.SourceText = Item.SourceText.replace(/(<head(\s[^>]+)?>)/i,
                `$1\n<link rel="stylesheet" id="bibi-default-style" href="${ Bibi.BookStyleURL }" />` +
                (!B.ExtractionPolicy && !Item.Source.Preprocessed ? `\n<base href="${ B.Path + '/' + Item.Source.Path }" />` : '')
            );
        },
        () => E.dispatch('bibi:built-item-source-text', Item)
    );
};

L.loadItemFrame = async (Item, ContentURL) => {
    await new Promise(resolve => {
        Item.onLoaded = () => {
            clearInterval(Item.ReloadTimer);
            delete Item.ReloadTimer;
            URL.revokeObjectURL(ContentURL);
            Item.removeEventListener('load', Item.onLoaded);
            delete Item.onLoaded;
            resolve();
        };
        if(ContentURL) {
            Item.addEventListener('load', Item.onLoaded);
            Item.src = ContentURL;
            Item.Box.prepend(Item);
            Item.ReloadTimer = setInterval(() => { if(Item.contentDocument?.readyState == 'interactive') Item.src = Item.src; }, 8888);
        } else {
            Item.src = '';
            Item.Box.prepend(Item);
            Item.contentDocument.open();
            Item.contentDocument.write(
                Item.SourceText = Item.SourceText
                    .replace(/<[\?\!][^>]+?>/g, '').trim()
                    .replace(/<([a-z][a-z0-9]*)([^>]*?)\s*\/>/g, '<$1$2></$1>')
                    .replace('</head>', `<script id="bibi-onload">window.addEventListener('load', () => parent.R.Items[${ Item.Index }].onLoaded() || document.getElementById('bibi-onload').remove());</script>\n</head>`)
            );
            Item.contentDocument.close();
        }
    });
    return L.postprocessItem(Item);
};

L.postprocessItem = (Item) => {
    const ProcessID = Item.LoadingProcessID;
    return O.chain({ assure: () => ProcessID == Item.LoadingProcessID, Label: 'L.postprocessItem' },
        () => E.dispatch('bibi:is-going-to:postprocess-item', Item),
        () => {
            // Item.stamp('Postprocess');
            Item.HTML = Item.contentDocument.documentElement; Item.HTML.classList.add(...sML.Environments);
            Item.Head = Item.contentDocument.head;
            Item.Body = Item.contentDocument.body;
            Item.Foot = Item.HTML.appendChild(Item.contentDocument.createElement('foot'));
            Item.HTML.Item = Item.Head.Item = Item.Body.Item = Item;
            const XMLLang = Item.HTML.getAttribute('xml:lang'), Lang = Item.HTML.getAttribute('lang');
                 if(!XMLLang && !Lang) Item.HTML.setAttribute('xml:lang', B.Language), Item.HTML.setAttribute('lang', B.Language);
            else if(!XMLLang         ) Item.HTML.setAttribute('xml:lang', Lang);
            else if(            !Lang)                                                 Item.HTML.setAttribute('lang', XMLLang);
            const ViewportMetaElements = Item.Head.querySelectorAll('meta[name="viewport"]');
            for(let i = ViewportMetaElements.length - 2; i >= 0; i--) ViewportMetaElements[i].remove();
            sML.forEach(Item.Body.getElementsByTagName('link'))(Link => Item.Head.appendChild(Link));
            if(Item.Reflowable && !Item.NoAdjustment) Item.contentDocument.querySelectorAll('html, body, body>*:not(script):not(style)').forEach(Ele => Ele.style.direction = Ele.BibiDefaultDirection = getComputedStyle(Ele).direction);
            sML.appendCSSRule(Item.contentDocument, 'html', '-webkit-text-size-adjust: 100%;');
            L.coordinateLinkages({ RootElement: Item.Body, BasePath: Item.Source.Path });
            const Lv1Eles = Item.contentDocument.querySelectorAll('body>*:not(script):not(style)');
            if(Lv1Eles && Lv1Eles.length == 1) {
                const Lv1Ele = Item.contentDocument.querySelector('body>*:not(script):not(style)');
                     if(    /^svg$/i.test(Lv1Ele.tagName)) Item.Outsourcing = Item.OnlySingleSVG = true;
                else if(    /^img$/i.test(Lv1Ele.tagName)) Item.Outsourcing = Item.OnlySingleImg = true;
                else if( /^iframe$/i.test(Lv1Ele.tagName)) Item.Outsourcing =                      true;
                else if(!O.getElementInnerText(Item.Body)) Item.Outsourcing =                      true;
            }
            sML.forEach(Item.Body.querySelectorAll('svg'))(SVG => { if(SVG.getAttribute('viewBox')) return;
                const Images = SVG.querySelectorAll('image, img, canvas'); if(Images.length != 1) return;
                const Image = Images[0];
                const ImageW = Image.getAttribute('width' ); if(!/^\d+$/.test(ImageW)) return;
                const ImageH = Image.getAttribute('height'); if(!/^\d+$/.test(ImageH)) return;
                SVG.setAttribute('viewBox', [0, 0, ImageW, ImageH].join(' '));
            });
            if(!Item.PrePaginated) return L.patchItemStyles(Item);
        },
        // () => Item.stamp('Postprocessed'),
        () => E.dispatch('bibi:postprocessed-item', Item)
    );
};

L.patchItemStyles = (Item) => { // only for reflowable.
    const ProcessID = Item.LoadingProcessID;
    return O.chain({ assure: () => ProcessID == Item.LoadingProcessID, Label: 'L.patchItemStyles' },
        () => E.dispatch('bibi:is-going-to:patch-item-styles', Item),
        async () => {
            const StyleSheetsLength = Array.prototype.filter.call(Item.HTML.querySelectorAll('style, link'), Ele =>
                Ele.tagName.toLowerCase() == 'style' || (
                    Ele.href && /^(alternate )?stylesheet$/.test(Ele.rel)
                    && !((sML.UA.Safari || sML.OS.iOS) && Ele.rel == 'alternate stylesheet')  //// Safari does not count "alternate stylesheet" in document.styleSheets.
                )
            ).length;
            await new Promise((resolve, reject) => (function check() {
                if(ProcessID != Item.LoadingProcessID) return reject();
                if(Item.contentDocument.styleSheets.length >= StyleSheetsLength) return resolve();
                setTimeout(check, 33);
            })());
            if(!Item.Source.Preprocessed) {
                if(B.Package.Metadata['ebpaj:guide-version']) {
                    const Vers = B.Package.Metadata['ebpaj:guide-version'].split('.').map(Ver => Ver * 1);
                    if(Vers[0] == 1 && Vers[1] == 1 && Vers[2] <= 3) Item.Body.style.textUnderlinePosition = 'under left';
                }
                O.forEachCSSRuleOf(Item.contentDocument, CSSRule => CSSRule.style.columnCount == 1 && Item.contentDocument.querySelectorAll(CSSRule.selectorText).forEach(Ele => getComputedStyle(Ele).columnCount == 1 && (Ele.style.columnCount = 'auto')));
            }
            const ItemHTMLComputedStyle = getComputedStyle(Item.HTML);
            const ItemBodyComputedStyle = getComputedStyle(Item.Body);
            if(ItemHTMLComputedStyle[O.WritingModeProperty] != ItemBodyComputedStyle[O.WritingModeProperty]) Item.HTML.style.writingMode = ItemBodyComputedStyle[O.WritingModeProperty];
            Item.WritingMode = O.getWritingMode(Item.HTML);
                 if(/^(tb|bt)-/.test(Item.WritingMode)) Item.HTML.classList.add('bibi-vertical-text');
            else if(/^(lr|rl)-/.test(Item.WritingMode)) Item.HTML.classList.add('bibi-horizontal-text');
            if(S['background-spreading']) [
                [Item.Box, ItemHTMLComputedStyle, Item.HTML],
                [Item,     ItemBodyComputedStyle, Item.Body]
            ].forEach(Par => {
                ['Color', 'Image', 'Repeat', 'Position', 'Size'].forEach(Pro => Par[0].style[Pro = 'background' + Pro] = Par[1][Pro]);
                Par[2].style.background = 'transparent';
            });
        },
        () => E.dispatch('bibi:patched-item-styles', Item)
    );
};

class processItemConc extends Conc {
    constructor(...Args) {
        super(...Args);
        if(this.ConcurrencyLimit) Object.defineProperties(this, { Logger: { get: () => Bibi.Debug && window.O } });
        return (Item, ...Args) => this.order({ Label: Item?.IsItem ? 'Item#' + String(Item.Index).padStart(3, '0') : undefined }, Item, ...Args);
    };
};
(Ps => Object.keys(Ps).forEach(PN => {
    const CLim = Ps[PN];
    if(!CLim) return;
    L[PN] = new processItemConc({ Name: 'L.' + PN, ConcurrencyLimit: CLim }, L[PN]);
}))({
    loadItem: 12,
    // fetchAndBuildItemSourceText: 8,
    // loadItemFrame: 8,
    // postprocessItem: 8
});




