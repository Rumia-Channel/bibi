// Heart of Bibi — Reader (split from bibi.heart.js; peers via shared context, no cycles)

import { Bibi, O, L, R, I, S, C, E, X } from './bibi.heart.context.mjs';
import { B } from './bibi.heart.book.mjs';
import { W } from './bibi.heart.wand.mjs';
import { isTwoPaneViewport, shouldSoloLandscapeSpread, isPairableSpread, planTwoPaneGroups, planSoloPictureDonations } from './bibi.heart.twopane.mjs';

//==============================================================================================================================================
//----------------------------------------------------------------------------------------------------------------------------------------------

//-- Reader

//----------------------------------------------------------------------------------------------------------------------------------------------




const svgNaturalSize = (Ele) => { // intrinsic pixels of a vector picture: viewBox is the truth (% width/height attributes and transient layout boxes never count)
    if(!Ele || !/^svg$/i.test(Ele.tagName)) return null;
    const VB = O.getViewportByViewBox(Ele.getAttribute('viewBox'));
    if(VB && VB.Width > 0 && VB.Height > 0) return [VB.Width, VB.Height];
    const W = /^\d+$/.test(Ele.getAttribute('width') || '') ? Ele.getAttribute('width') * 1 : 0;
    const H = /^\d+$/.test(Ele.getAttribute('height') || '') ? Ele.getAttribute('height') * 1 : 0;
    return (W > 0 && H > 0) ? [W, H] : null;
};
const mediaNaturalWidth = (Ele) => /^svg$/i.test(Ele.tagName) ? ((svgNaturalSize(Ele) || [])[0] || 0) : (Ele.naturalWidth || 0); // raster natively, vector via viewBox; unknown counts as zero (optimistic-big like pending raster)
R.title = () => {
    const FullTitleFragments = [B.Title];
    if(B.Creator)   FullTitleFragments.push(B.Creator);
    if(B.Publisher) FullTitleFragments.push(B.Publisher);
    B.FullTitle = FullTitleFragments.join(' - ').replace(/&amp;?/gi, '&').replace(/&lt;?/gi, '<').replace(/&gt;?/gi, '>');
    O.Title.innerHTML = ''; O.Title.appendChild(document.createTextNode(B.FullTitle + ' | ' + (S['website-name-in-title'] ? S['website-name-in-title'] : 'Published with Bibi')));
    try { O.Info.querySelector('h1').innerHTML = document.title; } catch(Err) {}
};


R.createSpine = (SpreadsDocumentFragment) => {
    R.Main      = O.Body.insertBefore(sML.create('main', { id: 'bibi-main' }), O.Body.firstElementChild);
    R.Main.Book =  R.Main.appendChild(sML.create('div',  { id: 'bibi-main-book' }));
    R.Main.Book.appendChild(SpreadsDocumentFragment);
    if(S['book-background-color']) {
        const BBGC = S['book-background-color'], BBGCPsL = BBGC.split(',').length, Color = BBGCPsL == 4 ? `rgba(${ BBGC })` : BBGCPsL == 3 ? `rgb(${ BBGC })` : /^([\da-fA-F]{3}){1,2}$/.test(BBGC) ? `#${ BBGC }` : BBGC;
        sML.CSS.appendRule('div#bibi-main-book::after', `background-color: ${ Color };`);
    }
  //R.Sub       = O.Body.insertBefore(sML.create('div',  { id: 'bibi-sub' }),  R.Main.nextSibling);
};


R.resetBibiHeight = () => {
    if(O.TouchOS) O.HTML.style.height = O.Body.style.height = '';
    const SafeHeight = O.HTML.offsetHeight - O.SafeArea.Bottom;
    if(O.TouchOS) O.HTML.style.height = O.Body.style.height = SafeHeight + 'px'; // for In-App Browsers
    return SafeHeight;
};


R.resetStage = () => {
    const SafeHeight = R.resetBibiHeight();
    R.Stage = {};
    R.Main.style.padding = R.Main.style.width = R.Main.style.height = '';
    R.Main.Book.style.padding = R.Main.Book.style.width = R.Main.Book.style.height = '';
    const BookBreadthIsolationStartEnd = (S['use-slider'] && S.RVM == 'paged' && O.Scrollbars[C.A_SIZE_B] ? O.Scrollbars[C.A_SIZE_B] : 0) + S['content-margin'] * 2;
    sML.style(R.Main.Book, {
        [C.A_SIZE_b]: (BookBreadthIsolationStartEnd > 0 ? 'calc(100% - ' + BookBreadthIsolationStartEnd + 'px)' : ''),
        [C.A_SIZE_l]: ''
    });
    R.Stage.Width  = O.Body.clientWidth;
    R.Stage.Height = SafeHeight;
    R.Stage[C.A_SIZE_B] -= (S['use-slider'] || S.RVM != 'paged' ? O.Scrollbars[C.A_SIZE_B] : 0) + S['content-margin'] * 2;
    window.scrollTo(0, 0);
    if(!S['use-full-height']) R.Stage.Height -= I.Menu.Height;
    if(S['content-margin'] > 0) R.Main.Book.style['padding' + C.L_BASE_S] = R.Main.Book.style['padding' + C.L_BASE_E] = S['content-margin'] + 'px';
    //R.Main.style['background'] = S['book-background'] ? S['book-background'] : '';
    R.TwoPane = S.RVM == 'paged' && S.ARA == 'horizontal' && R.isTwoPaneViewport(R.Stage.Width, R.Stage.Height); // paged 2-up only; scroll modes, vertical advance, and narrow viewports behave exactly as before
    O.HTML.classList.toggle('two-pane', !!R.TwoPane);
};


R.layOutSpreadAndItsItems = (Spread) => R.layOutItem(Spread.Items[0]).then(() => Spread.Items[1] && R.layOutItem(Spread.Items[1])).then(() => R.layOutSpread(Spread));
// R.layOutSpreadAndItsItems = new (class extends Conc {
//     constructor() {
//         super({ Name: 'R.layOutSpreadAndItsItems', ConcurrencyLimit: null }, (Spread) => R.layOutItem(Spread.Items[0]).then(() => Spread.Items[1] && R.layOutItem(Spread.Items[1])).then(() => R.layOutSpread(Spread)));
//         if(this.ConcurrencyLimit) Object.defineProperties(this, { Logger: { get: () => Bibi.Debug && window.O } });
//         return (Spread) => this.order({ Label: `Spread#${ String(Spread.Index).padStart(3, '0') }(${ Spread.Items.map(Item => 'Item#' + String(Item.Index).padStart(3, '0')).join('-') })` }, Spread);
//     };
// })();


R.layOutSpread = (Spread, Opt = {}) => new Promise(resolve => {
    if(Opt.Makeover) {
        Spread.PreviousSpreadBoxLength = Spread.Box['offset' + C.L_SIZE_L];
        Spread.OldPages = Spread.Pages.concat(); // copy
    }
    Spread.Pages = [];
    Spread.Items.forEach(Item => Item.Pages.forEach(Page => Page.IndexInSpread = Spread.Pages.push(Page) - 1));
    const SpreadSize = { Width: 0, Height: 0 }, SpreadBox = Spread.Box;
    if(Spread.Items.length == 1) {
        const Item = Spread.Items[0];
        Spread.Spreaded = Item.Spreaded ? true : false;
        SpreadSize.Width  = (Spread.Spreaded && Item.PrePaginated && Item['rendition:page-spread']) ? (Item.Viewport ? Item.Box.offsetHeight * Item.Viewport.Width * 2 / Item.Viewport.Height : B.PrePaginated ? Item.Box.offsetWidth * 2 : R.Stage.Width) : Item.Box.offsetWidth;
        SpreadSize.Height = Item.Box.offsetHeight;
    } else {
        const ItemA = Spread.Items[0], ItemB = Spread.Items[1];
        Spread.Spreaded = (ItemA.Spreaded || ItemB.Spreaded) ? true : false;
        if(ItemA.PrePaginated && ItemB.PrePaginated) {
            // Paired Pre-Paginated Items
            if(Spread.Spreaded || S.SLA == 'horizontal') {
                // Spreaded
                SpreadSize.Width  =          ItemA.Box.offsetWidth  + ItemB.Box.offsetWidth;
                SpreadSize.Height = Math.max(ItemA.Box.offsetHeight,  ItemB.Box.offsetHeight);
            } else {
                // Not Spreaded (Vertical)
                SpreadSize.Width  = Math.max(ItemA.Box.offsetWidth,   ItemB.Box.offsetWidth);
                SpreadSize.Height =          ItemA.Box.offsetHeight + ItemB.Box.offsetHeight;
            }
        } else {
            // Paired Items Including Reflowable // currently not appearable.
            if(S.SLA == 'horizontal') { // if(R.Stage.Width > ItemA.Box.offsetWidth + ItemB.Box.offsetWidth) {
                // horizontal layout
                SpreadSize.Width  =          ItemA.Box.offsetWidth + ItemB.Box.offsetWidth;
                SpreadSize.Height = Math.max(ItemA.Box.offsetHeight, ItemB.Box.offsetHeight);
                if(Bibi.Dev) {
                    O.log(`Paired Items incl/Reflowable (Horizontal)`, '<g:>');
                    O.log(`[0] w${ ItemA.Box.offsetWidth }/h${ ItemA.Box.offsetHeight } %O`, ItemA);
                    O.log(`[1] w${ ItemB.Box.offsetWidth }/h${ ItemB.Box.offsetHeight } %O`, ItemB);
                    O.log(`-=> w${      SpreadSize.Width }/h${      SpreadSize.Height } %O`, Spread, '</g>');
                }
            } else {
                // vertical layout
                SpreadSize.Width  = Math.max(ItemA.Box.offsetWidth,   ItemB.Box.offsetWidth);
                SpreadSize.Height =          ItemA.Box.offsetHeight + ItemB.Box.offsetHeight;
                if(Bibi.Dev) {
                    O.log(`Paired Items incl/Reflowable (Vertical)`, '<g:>');
                    O.log(`[0] w${ ItemA.Box.offsetWidth }/h${ ItemA.Box.offsetHeight } %O`, ItemA);
                    O.log(`[1] w${ ItemB.Box.offsetWidth }/h${ ItemB.Box.offsetHeight } %O`, ItemB);
                    O.log(`-=> w${      SpreadSize.Width }/h${      SpreadSize.Height } %O`, Spread, '</g>');
                }
            }
        }
    }
    const IsHead = Spread.Index == 0, IsFoot = Spread.Index == R.Spreads.length - 1;
    let PaddingBefore = 0, PaddingAfter = 0;
    if(IsHead || IsFoot) {
        const StageLength = R.Stage[C.L_SIZE_L], SpreadLength = SpreadSize[C.L_SIZE_L];
        let PaddingLength = 0;
        if(StageLength > SpreadLength) {
            PaddingLength = Math.floor((StageLength - SpreadLength) / 2);
            if(S.RVM == 'paged' || IsHead) PaddingBefore = PaddingLength;
            if(S.RVM == 'paged' || IsFoot) PaddingAfter  = PaddingLength;
        } else if(StageLength < SpreadLength) {
            let EdgeItemLength = 0;
            if(IsHead && StageLength > (EdgeItemLength = Spread.Items[                      0].Box['offset' + C.L_SIZE_L])) PaddingBefore = Math.floor((StageLength - EdgeItemLength) / 2);
            if(IsFoot && StageLength > (EdgeItemLength = Spread.Items[Spread.Items.length - 1].Box['offset' + C.L_SIZE_L])) PaddingAfter  = Math.floor((StageLength - EdgeItemLength) / 2);
        }
    }
    if(PaddingBefore) SpreadSize[C.L_SIZE_L] += PaddingBefore, Spread.style['padding' + C.L_BASE_B] = PaddingBefore + 'px'; else Spread.style['padding' + C.L_BASE_B] = '';
    if(PaddingAfter ) SpreadSize[C.L_SIZE_L] += PaddingAfter,  Spread.style['padding' + C.L_BASE_A] = PaddingAfter  + 'px'; else Spread.style['padding' + C.L_BASE_A] = '';
    Spread.style['padding' + C.L_BASE_S] = Spread.style['padding' + C.L_BASE_E] = '';
    if(O.Scrollbars.Height && S.SLA == 'vertical' && S.ARA != 'vertical') {
        SpreadBox.style.minHeight    = S.RVM == 'paged' ?   'calc(100vh - ' + O.Scrollbars.Height + 'px)' : '';
        SpreadBox.style.marginBottom = Spread.Index == R.Spreads.length - 1 ? O.Scrollbars.Height + 'px'  : '';
    } else {
        SpreadBox.style.minHeight = SpreadBox.style.marginBottom = ''
    }
    SpreadBox.classList.toggle('spreaded', Spread.Spreaded);
    SpreadBox.style[C.L_SIZE_b] = '', Spread.style[C.L_SIZE_b] = ''; // Math.ceil(SpreadSize[C.L_SIZE_B]) + 'px';
    SpreadBox.style[C.L_SIZE_l] =     Spread.style[C.L_SIZE_l] = Math.ceil(SpreadSize[C.L_SIZE_L]) + 'px';
    //sML.style(Spread, { 'border-radius': S['spread-border-radius'], 'box-shadow': S['spread-box-shadow'] });
    if(Opt.Makeover) {
        if(!Spread.PrePaginated) R.replacePages(Spread.OldPages, Spread.Pages);
        const ChangedSpreadBoxLength = Spread.Box['offset' + C.L_SIZE_L] - Spread.PreviousSpreadBoxLength;
        if(ChangedSpreadBoxLength != 0) {
            const Correct = (C.L_AXIS_L == 'X' && O.getElementCoord(Spread, R.Main).X + Spread.offsetWidth <= R.Main.scrollLeft + R.Main.offsetWidth);
            R.Main.Book.style[C.L_SIZE_l] = (parseFloat(getComputedStyle(R.Main.Book)[C.L_SIZE_l]) + ChangedSpreadBoxLength) + 'px';
            if(Correct) {
                R.Main.scrollLeft += ChangedSpreadBoxLength;
                if(I.Slider.ownerDocument) {
                    I.Slider.resetUISize();
                    I.Slider.progress();
                }
            }
        }
        delete Spread.OldPages, delete Spread.PreviousSpreadBoxLength;
    }
    if(R.TwoPane && !R.LayingOut) R.requestTwoPaneSnap(); // settle re-aim: late geometry growth (image loads) must not stick misaligned
    resolve(Spread);
});


R.layOutItem = async (Item) => {
    await E.dispatch('bibi:is-going-to:lay-out-item', Item);
    const SoloMediaEl = (Item.OnlySingleSVG || Item.OnlySingleImg) ? R.renderPrePaginatedItem.getSingleMediaElement(Item) : null;
    const SoloSizeVerdict = SoloMediaEl ? R.singleMediaIsBig(SoloMediaEl) : null;
    if(SoloSizeVerdict !== null) Item.SingleMediaIsBig = SoloSizeVerdict; // dimensions resolved (e.g. image finished loading)
    const SoloBigPicture = (Item.OnlySingleSVG || Item.OnlySingleImg) && Item.SingleMediaIsBig !== false && !Item.BibiDonationDonor; // donated-away husks render reflowable (and collapse to zero pages below), never as fitted solo pictures
    const HuskDissolved = Item.BibiDonationDonor && R.isBlankPageContent(Item); // empty husk: drop pages and skip render (modeless items have no writing mode for the column machinery)
    if(HuskDissolved) {
        Item.Pages.forEach(Page => { delete Page.IsPage; try { I.PageObserver.unobservePageIntersection(Page); } catch(Err) {} if(Page.parentNode) Page.parentNode.removeChild(Page); });
        Item.Pages = [];
    }
    await (HuskDissolved ? Promise.resolve() : ((Item.Reflowable && !SoloBigPicture) ? R.renderReflowableItem(Item) : R.renderPrePaginatedItem(Item))); // big single-media pages (even in reflowable books) are fitted pictures, not column text
    if(Item.Reflowable && !SoloBigPicture && R.auditPictureRows(Item)) await R.renderReflowableItem(Item); // picture rows settled (one extra pass max; steady rows never retrigger)
    if(Item.Reflowable && !SoloBigPicture) R.alignPicturesToMiddle(Item); // geta: touch solo pictures to the page middle (visual only, exclusion kept)
    R.requestTwoPaneRegroup(); // late-aspect convergence: regroup is signature-guarded, relayout is targeted
    Item.TwoPaneRendered = true;
    if(Item.Reflowable && Item.Spread && Item.Spread.PaneWidthFactor == 0.5 && Item.Pages.length != 1) Item.TwoPaneSoloLocked = true; // half pane overflowed: keep solo from now on (stops pair/solo flapping)
    if(Item.Spread && (Item.OnlySingleSVG || Item.OnlySingleImg)) { const SoloMedia = R.renderPrePaginatedItem.getSingleMediaElement(Item); if(SoloMedia && /^img$/i.test(SoloMedia.tagName) && !(SoloMedia.naturalWidth > 0)) SoloMedia.addEventListener('load', () => R.requestTwoPaneRegroup(), { once: true }); } // late image dimensions can flip the solo/pair verdict
    await E.dispatch('bibi:laid-out-item', Item);
    return Item;
};


R.renderReflowableItem = (Item) => new Promise(resolve => {
    if(Item.IsPlaceholder) return resolve();
    const SafeArea = O.SafeArea;
    Item.Padding = {
           Top: S['item-padding-top'],     Left: S['item-padding-left']  + SafeArea.Left,
        Bottom: S['item-padding-bottom'], Right: S['item-padding-right'] + SafeArea.Right
    };
    const ItemPaddingBA = Item.NoPadding ? 0 : Item.Padding[C.L_BASE_B] + Item.Padding[C.L_BASE_A];
    const ItemPaddingSE = Item.NoPadding ? 0 : Item.Padding[C.L_BASE_S] + Item.Padding[C.L_BASE_E];
    const ItemLineAxis = Item.WritingMode.split('-')[1] == 'tb' ? 'horizontal' : 'vertical'; // inline-axis of the content lines (vertical in vertical writing): shared by fit, isolation, and the text gutter below
    let TextGutter = 0; // four blank lines at each screen edge: prose never touches the bezel on tablets. measured from a real line box (line thickness = pitch), so it tracks font size and device scaling. flows into PageCB so every page band narrows symmetrically (HTML padding would only pad the strip ends, not interior page edges).
    if(!Item.NoPadding && Item.Body && Item.contentDocument) {
        try {
            const Doc = Item.contentDocument;
            const Walker = Doc.createTreeWalker(Item.Body, NodeFilter.SHOW_TEXT, { acceptNode(T) { return T.nodeValue.trim().length > 1 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; } });
            const Widths = [], Range = Doc.createRange();
            while(Walker.nextNode() && Widths.length < 60) { Range.selectNodeContents(Walker.currentNode); const Rects = Range.getClientRects(); for(let i = 0; i < Rects.length && Widths.length < 60; i++) if(Rects[i].height > 10) Widths.push(ItemLineAxis == 'vertical' ? Rects[i].width : Rects[i].height); }
            if(Widths.length) { Widths.sort((a, b) => a - b); TextGutter = Widths[Math.floor(Widths.length / 2)]; } // median line thickness = pitch
            if(!(TextGutter > 0)) TextGutter = parseFloat(getComputedStyle(Item.Body).fontSize) || 16;
            TextGutter = Math.round(TextGutter * 4);
        } catch(Err) { TextGutter = 0; }
    }
    const PageCB = (C.L_SIZE_B == 'Width' && R.TwoPane && Item.Spread && Item.Spread.PaneWidthFactor == 0.5 ? R.Stage.Width / 2 : R.Stage[C.L_SIZE_B]) - ItemPaddingSE - TextGutter * 2; // Page "C"ontent "B"readth (paired pane is half stage width)
    let   PageCL = (C.L_SIZE_L == 'Width' && R.TwoPane && Item.Spread && Item.Spread.PaneWidthFactor == 0.5 ? R.Stage.Width / 2 : R.Stage[C.L_SIZE_L]) - ItemPaddingBA; // Page "C"ontent "L"ength (paired pane is half stage width)
    const PageGap = ItemPaddingBA;
    ['b','a','s','e'].forEach(base => { const trbl = C['L_BASE_' + base], TRBL = C['L_BASE_' + base.toUpperCase()]; Item.style['padding-' + trbl] = Item.NoPadding ? 0 : Item.Padding[TRBL] + 'px'; });
    sML.style(Item.HTML, { 'width': '', 'height': '' });
    if(Item.WithGutters) {
        Item.HTML.classList.remove('bibi-with-gutters');
        if(Item.Neck.parentNode) Item.Neck.parentNode.removeChild(Item.Neck);
        Item.Neck.innerHTML = '';
        delete Item.Neck;
    }
    const ReverseItemPaginationDirectionIfNecessary = !Item.NoAdjustment ? true : false;
    if(Item.Columned) {
        sML.style(Item.HTML, { 'column-width': '', 'column-gap': '', 'column-fill': '', 'column-rule': '' });
        Item.HTML.classList.remove('bibi-columned');
        if(ReverseItemPaginationDirectionIfNecessary && Item.ReversedColumned) Item.HTML.style.direction = Item.HTML.BibiDefaultDirection;
    }
    Item.WithGutters = false;
    Item.Columned = false, Item.ColumnBreadth = 0, Item.ColumnLength = 0;
    Item.ReversedColumned = false;
    Item.Half = false;
    Item.Spreaded = (
        !(R.TwoPane && Item.Spread && Item.Spread.PaneWidthFactor == 0.5) && // paired panes own the 2-up job; self-halving would quarter the columns
        S.SLA == 'horizontal' && (S['pagination-method'] == 'x' || /-tb$/.test(Item.WritingMode))
            &&
        (Item['rendition:spread'] == 'both' || R.Orientation == Item['rendition:spread'] || R.Orientation == 'landscape')
    );
    if(Item.Spreaded && Item['rendition:page-spread'] != 'center') {
        const HalfL = Math.floor((PageCL - PageGap) / 2);
        if(HalfL >= Math.floor(PageCB * S['orientation-border-ratio'] / 2)) PageCL = HalfL;
        else Item.Spreaded = false;
    }
    sML.style(Item, {
        [C.L_SIZE_b]: PageCB + 'px',
        [C.L_SIZE_l]: PageCL + 'px'
    });
    const WordWrappingStyleSheetIndex = sML.appendCSSRule(Item.contentDocument, '*', 'word-wrap: break-word; overflow-wrap: break-word;'); ////
    { // Fit Image and Embeded Content
        const [ItemBDir, ItemLDir] = Item.WritingMode.split('-');
        const TRBL = ['Top', 'Right', 'Bottom', 'Left'];
        sML.forEach(Item.Body.querySelectorAll('img, picture, svg, video, iframe'))(Ele => {
            if(!Ele.BibiDefaultStyle) { Ele.BibiDefaultStyle = {}; ['width', 'height', 'maxWidth', 'maxHeight'].forEach(Pro => Ele.BibiDefaultStyle[Pro] = Ele.style[Pro] || ''); }
            else Object.keys(Ele.BibiDefaultStyle).forEach(Pro => Ele.style[Pro] = Ele.BibiDefaultStyle[Pro]);
            const EComStyle = getComputedStyle(Ele),               EMarTRBL = TRBL.map(TRBL => parseFloat(EComStyle[ 'margin' + TRBL]) || 0);
            const PComStyle = getComputedStyle(Ele.parentElement), PPadTRBL = TRBL.map(TRBL => parseFloat(PComStyle['padding' + TRBL]) || 0);
            const EleCoord = O.getElementCoord(Ele), EleOffsetW = Ele.offsetWidth || 0, EleOffsetH = Ele.offsetHeight || 0; // svg has no offsetTop/Left (undefined poisons the max into NaN and silently disables fit): fall back to zero, still page-bounded
            const ESpacing = Math.max(0, ItemLineAxis == 'horizontal' ? (EleCoord.X || 0) + (ItemBDir == 'lr' ? EMarTRBL[1] + PPadTRBL[1] : EMarTRBL[3] + PPadTRBL[3] - EleOffsetW)
                                                                      : (EleCoord.Y || 0) + (ItemBDir == 'tb' ? EMarTRBL[2] + PPadTRBL[2] : EMarTRBL[0] + PPadTRBL[0] - EleOffsetH)); // consumed space before Ele can never be negative: a negative coord is transitional garbage (stale break/width styles in the freshly de-columned state), and it would inflate EMax into slice overflow
            let EMaxB = PageCB, EMaxL = PageCL;
            if(S.SLA != ItemLineAxis) EMaxB -= ESpacing, EMaxL -= PPadTRBL[0] + PPadTRBL[2];
            else                      EMaxL -= ESpacing, EMaxB -= PPadTRBL[1] + PPadTRBL[3];
            let ENatB = 0, ENatL = 0;
            const SvgSize = svgNaturalSize(Ele); // vector first: a % -sized svg reports a transient layout box, not its intrinsic size
            if(SvgSize) { ENatB = (C.L_SIZE_B == 'Width' ? SvgSize[0] : SvgSize[1]); ENatL = (C.L_SIZE_L == 'Width' ? SvgSize[0] : SvgSize[1]); }
            if(!(ENatB > 0) || !(ENatL > 0)) { ENatB = Ele['offset' + C.L_SIZE_B]; ENatL = Ele['offset' + C.L_SIZE_L]; }
            if(!(ENatB > 0) || !(ENatL > 0)) { const NW = Ele.naturalWidth, NH = Ele.naturalHeight; if(NW > 0 && NH > 0) { ENatB = (C.L_SIZE_B == 'Width' ? NW : NH); ENatL = (C.L_SIZE_L == 'Width' ? NW : NH); } } // unreadable layout size (transient zero during reflow): fit off natural instead of skipping into stale (result stays EMax-bounded either way)
            const EFitRatio = Math.min(EMaxB / ENatB, EMaxL / ENatL);
            if(EFitRatio < 1) sML.style(Ele, { width: 'auto', height: 'auto',
                ['max' + C.L_SIZE_B]: Math.floor(ENatB * EFitRatio) + 'px',
                ['max' + C.L_SIZE_L]: Math.floor(ENatL * EFitRatio) + 'px'
            });
        });
    }
    { // Separate pictures from prose in paged mode: block-level media gets its own column (= page)
        const Paged = S.RVM == 'paged';
        sML.forEach(Item.Body.querySelectorAll('img, svg, picture, video, canvas'))(Ele => {
            delete Ele.BibiPictureZone; // re-marked below when the big in-flow branch claims it; stale marks must not survive repurposing
            let Tar = Ele, Guard = 0; // climb through textless single-child wrappers (p > img): breaks go on the lone paragraph, not the inline picture
            while(Tar.parentElement && Tar.parentElement !== Item.Body && Guard++ < 8
                && Tar.parentElement.firstElementChild === Tar && !Tar.parentElement.firstElementChild.nextElementSibling
                && !((Tar.parentElement.innerText || '').trim())) Tar = Tar.parentElement;
            if(!Tar.BibiDefaultBreaks) { Tar.BibiDefaultBreaks = {}; ['breakBefore', 'breakAfter', 'breakInside', 'columnSpan', 'display', 'width', 'cssFloat', 'marginLeft', 'marginRight', 'textAlign', 'alignItems', 'justifyContent'].forEach(Pro => Tar.BibiDefaultBreaks[Pro] = Tar.style[Pro] || ''); }
            else Object.keys(Tar.BibiDefaultBreaks).forEach(Pro => Tar.style[Pro] = Tar.BibiDefaultBreaks[Pro]);
            if(Ele !== Tar) { if(!Ele.BibiDefaultBreaks) { Ele.BibiDefaultBreaks = {}; ['display', 'marginLeft', 'marginRight'].forEach(Pro => Ele.BibiDefaultBreaks[Pro] = Ele.style[Pro] || ''); } else Object.keys(Ele.BibiDefaultBreaks).forEach(Pro => Ele.style[Pro] = Ele.BibiDefaultBreaks[Pro]); } // size props (width/max*) deliberately unrestored: fit recomputes them every pass from pristine (its own restore); restoring here would clobber fresh fit values with first-pass ones across resizes
            if(/^img$/i.test(Ele.tagName) || /^svg$/i.test(Ele.tagName)) { if(R.singleMediaIsBig(Ele) === false) return; } // 384x384 and below stay in flow
            if(/^img$/i.test(Ele.tagName) && R.singleMediaIsBig(Ele) === null && !(Ele.naturalWidth > 0)) Ele.addEventListener('load', () => { if(!R.LayingOut) R.layOutItem(Item).catch(() => {}); else R.requestTwoPaneRegroup(); }, { once: true }); // verdict pending: re-render (and regroup) once real dimensions arrive
            if(!Paged) return;
            if(Tar === Ele) {
                const ParentTag = Ele.parentElement ? Ele.parentElement.tagName : '';
                if(/^(p|span|a|ruby|rt|rp|h1|h2|h3|h4|h5|h6|strong|em|small|sub|sup|button|label)$/i.test(ParentTag)) return; // inline illustrations stay in the text flow
                if(/^inline/i.test(getComputedStyle(Ele).display) && !Ele.BibiAdoptedPicture && R.singleMediaIsBig(Ele) !== true) return; // inline illustrations stay in the text flow (gaiji and pending pictures wait); big or adopted pictures always claim their zone
            }
            if(/^inline/i.test(getComputedStyle(Tar).display)) Tar.style.display = 'block';
            Tar.style.width = Math.max(0, PageCB) + 'px'; // claim exactly the row width (never narrower = void, never wider = overlap); content was shrink-wrapped to its own size in vertical-rl
            Tar.style.marginLeft = 'auto'; Tar.style.marginRight = 'auto'; Tar.style.textAlign = 'center'; // isolated pictures center in their page (Tar holds no text by construction, or is the picture itself)
            if(Ele !== Tar) { Tar.style.display = 'flex'; Tar.style.alignItems = 'center'; Tar.style.justifyContent = 'center'; } // flex centers on both axes regardless of writing mode (margins/text-align only serve one axis)
            if(Ele !== Tar && /^inline/i.test(getComputedStyle(Ele).display)) Ele.style.display = 'block'; // horizontal centering is block-axis business in vertical writing too
            if(Ele !== Tar) Ele.style.marginLeft = 'auto', Ele.style.marginRight = 'auto';
            if(Tar.previousElementSibling) Tar.style.breakBefore = 'column';
            if(Tar.nextElementSibling) Tar.style.breakAfter = 'column';
            if(ItemLineAxis == 'vertical' && (Tar.previousElementSibling || Tar.nextElementSibling)) { // share the strip with prose: the picture reserves its zone, prose keeps the rest (both orders OK, reading order preserved); the picture itself stays fit-to-screen inside the zone (never taller than the strip); breaks keep strips untorn. horizontal content keeps full-row centering below scope; narrow keeps shrink-to-fit.
                Tar.style.breakInside = 'avoid'; // the picture zone is one atomic rendering region: it must never straddle a column boundary (a split zone lets the picture overflow its narrower fragment and paint over prose that correctly wraps the fragment box)
                if(R.TwoPane && /^(img|svg)$/i.test(Ele.tagName) && !(mediaNaturalWidth(Ele) > 0 && mediaNaturalWidth(Ele) < PageCB / 2)) { // vector pictures share the inline machinery: intrinsic size via viewBox, same zone/middle/clearance verdicts as raster
                    const HalfW = Math.min(Math.floor(PageCB / 2), PageCL); // never wider than one column: an oversized zone cannot be kept whole by break-inside and would straddle again
                    Tar.style.width = HalfW + 'px'; // reserve the picture half (zone, not image size). stays in flow (no float: breaks are ignored on floats). the zone fills its CSS column exactly, so it cannot be shifted to the page grid (column slots are content-anchored); alignment happens inside the zone below
                    Tar.style.breakBefore = ''; // no forced lead: the zone is exactly one column, so it slots into the empty column left by a short text tail (image|text) instead of wasting it
                    Tar.style.breakAfter = Tar.BibiPictureRowShared ? 'column' : ''; // shared row (backfill): following prose resumes from the next page, never sandwiching into text|image|text. leading row: prose joins the row (text|image). verdict from the row audit below, self-healing on change
                    if(!(parseFloat(Ele.style.maxWidth) > 0 && parseFloat(Ele.style.maxWidth) <= HalfW)) Ele.style.maxWidth = '100%'; // cap at the zone only when fit left it wider (fit limits underneath stay authoritative)
                    Ele.style.marginLeft = '0'; Ele.style.marginRight = 'auto'; // picture flush to the slot's text edge (same x a text line or a paired-spread picture would take); centering pushed it mid-page
                    Ele.BibiPictureZone = Tar; // audited below for row sharing
                    Ele.style.height = 'auto'; // aspect preserved, never distorted
                } else {
                    Tar.style.cssFloat = 'left'; // narrow pictures only: share the column with prose wrapping beside them
                    Tar.style.width = '';
                }
            }
        });
    }
    if(sML.UA.Gecko) { // Part 1/2: Assist Gecko in the rendering of the orthogonal flow of writing-mode.
        if(Item.OFREs === undefined) {
            Item.OFREs = []; // Orthogonal Flow Root Elements
            Item.contentDocument.querySelectorAll('body, body *').forEach(Ele => {
                if(getComputedStyle(Ele).writingMode.split('-')[0] != getComputedStyle(Ele.parentNode).writingMode.split('-')[0]) {
                    Ele.BibiOFREOriginalStyleWidthHeight = { width: Ele.style.width, height: Ele.style.height };
                    Item.OFREs.push(Ele);
                }
            });
        }
        if(Item.OFREs.length) Item.OFREs.forEach(OFRE => sML.style(OFRE, OFRE.BibiOFREOriginalStyleWidthHeight));
    }
    if(!Item.Outsourcing) {
        if(S.RVM == 'paged' && Item.HTML['offset'+ C.L_SIZE_L] > PageCL && (Item.WritingMode.split('-')[1] == 'tb' || S['pagination-method'] == 'x')) {
            // reader-view-mode: paged, spread-layout-axis: vertical,   Item.WritingMode: **-tb                       ... horizontal-text item in vertical-text book
            // reader-view-mode: paged, spread-layout-axis: horizontal, Item.WritingMode: tb-**, pagination-method: x ... extra layout method for vertical-text book
            Item.HTML.classList.add('bibi-columned');
            sML.style(Item.HTML, { [C.L_SIZE_b]: 'auto', [C.L_SIZE_l]: PageCL + 'px', 'column-width': PageCB + 'px', 'column-gap': 0, 'column-fill': 'auto', 'column-rule': '' });
            const HowManyPages = Math.ceil(Item.HTML['scroll' + C.L_SIZE_B] / PageCB);
            sML.style(Item.HTML, { 'width': '', 'height': '', 'column-width': '', 'column-gap': '', 'column-fill': '', 'column-rule': '' });
            Item.HTML.classList.remove('bibi-columned');
            Item.HTML.classList.add('bibi-with-gutters');
            const ItemLength = (PageCL + PageGap) * HowManyPages - PageGap;
            Item.HTML.style[C.L_SIZE_L] = ItemLength + 'px';
            const Points = []; for(let i = 1; i < HowManyPages; i++) { const After = (PageCL + PageGap) * i, Before = After - PageGap;
                Points.push(     0), Points.push(Before);
                Points.push(PageCB), Points.push(Before);
                Points.push(PageCB), Points.push(After );
                Points.push(     0), Points.push(After );
            } if(/^tb-/.test(Item.WritingMode)) Points.reverse();
            const Polygon = []; for(let Pt = '', l = Points.length, i = 0; i < l; i++) {
                const Px = Points[i] + 'px';
                if(i % 2 == 0) Pt = Px;
                else Polygon.push(Pt + ' ' + Px);
            }
            const Neck = Bibi.createElement('bibi-neck'), Throat = Neck.appendChild(Bibi.createElement('bibi-throat')), ShadowOrThroat = Throat.attachShadow ? Throat.attachShadow({ mode: 'open' }) : Throat.createShadowRoot ? Throat.createShadowRoot() : Throat;
            ShadowOrThroat.appendChild(document.createElement('style')).textContent = (ShadowOrThroat != Throat ? ':host' : 'bibi-throat') + ` { ${C.L_SIZE_b}: ${PageCB}px; ${C.L_SIZE_l}: ${ItemLength}px; shape-outside: polygon(${ Polygon.join(', ') }); }`;
            Item.Neck = Item.Head.appendChild(Neck);
            Item.WithGutters = true;
        } else if(Item.HTML['offset'+ C.L_SIZE_B] > PageCB/* || Item.HTML['scroll'+ C.L_SIZE_L] > PageCL*/) {
            // reader-view-mode: paged | vertical,   spread-layout-axis: vertical,   Item.WritingMode: tb-** ... normal layout method for vertical-text book
            // reader-view-mode: paged | horizontal, spread-layout-axis: horizontal, Item.WritingMode: **-tb ... normal layout method for horizontal-text book
            Item.HTML.classList.add('bibi-columned');
            sML.style(Item.HTML, { [C.L_SIZE_l]: 'auto', [C.L_SIZE_b]: PageCB + 'px', 'column-width': PageCL + 'px', 'column-gap': PageGap + 'px', 'column-fill': 'auto', 'column-rule': '' });
            Item.Columned = true, Item.ColumnBreadth = PageCB, Item.ColumnLength = PageCL;
            if(ReverseItemPaginationDirectionIfNecessary) {
                let ToBeReversedColumnAxis = false;
                switch(Item.WritingMode) {
                    case 'lr-tb': case 'tb-lr': if(S['page-progression-direction'] != 'ltr') ToBeReversedColumnAxis = true; break;
                    case 'rl-tb': case 'tb-rl': if(S['page-progression-direction'] != 'rtl') ToBeReversedColumnAxis = true; break;
                }
                if(ToBeReversedColumnAxis) {
                    Item.ReversedColumned = true;
                    Item.HTML.style.direction = S['page-progression-direction'];
                    //if(sML.UA.Chromium) Item.HTML.style.transform = 'translateX(' + (Item.HTML['scroll'+ C.L_SIZE_L] - Item.HTML['offset'+ C.L_SIZE_L]) * (S['page-progression-direction'] == 'rtl' ? 1 : -1) + 'px)';
                }
            }
        } else if(Item.HTML['offset'+ C.L_SIZE_B] < PageCB) {
            Item.HTML.style[C.L_SIZE_b] = Math.floor(parseFloat(getComputedStyle(Item.HTML)[C.L_SIZE_b]) + (PageCB - Item.HTML['offset'+ C.L_SIZE_B])) + 'px';
        }
    }
    sML.deleteCSSRule(Item.contentDocument, WordWrappingStyleSheetIndex); ////
    if(sML.UA.Gecko) { // Part 2/2: Assist Gecko in the rendering of the orthogonal flow of writing-mode.
        if(Item.OFREs.length) Item.OFREs.forEach(OFRE => sML.style(OFRE, { width: OFRE.offsetWidth + 'px', height: OFRE.offsetHeight + 'px' }));
    }
    const [ItemL, HowManyPages] = (() => {
        let ItemL, HowManyPages;
        const LineSpacing = (() => {
            const Ps = Item.Body.querySelectorAll('p');
            const CS = getComputedStyle(Ps.length ? Ps[Ps.length - 1] : Item.Body);
            const FS = parseFloat(CS.fontSize);
            const CLH = CS.lineHeight;
            return Math.floor((/\dpx$/.test(CLH) ? parseFloat(CLH) : FS * (/\d$/.test(CLH) ? parseFloat(CLH) : 1.2)) - FS);
        })();
        (function updateL(Again) {
            const ItemScrollL = Item.HTML['scroll' + C.L_SIZE_L];
            HowManyPages = Math.ceil((ItemScrollL + PageGap) / (PageCL + PageGap));
            if(ItemScrollL - ((PageCL + PageGap) * (HowManyPages - 1) - PageGap) <= LineSpacing /* < LineSpacing / 2 */) HowManyPages--; // Avoid white page.
            ItemL = (PageCL + PageGap) * HowManyPages - PageGap;
            Item.style[C.L_SIZE_l] = Item.HTML.style[C.L_SIZE_l] = ItemL + 'px';
            if(!Again) updateL('Again'); // Watch reflowing after setting styles.
        })();
        return [ItemL, HowManyPages];
    })();
    Item.Box.style[C.L_SIZE_b] = (PageCB + ItemPaddingSE) + 'px';
    Item.Box.style[C.L_SIZE_l] = (ItemL + ItemPaddingBA /* + ((S.RVM == 'paged' && Item.Spreaded && HowManyPages % 2) ? (PageGap + PageCL) : 0) */ ) + 'px';
    Item.Pages.forEach(Page => {
        delete Page.IsPage;
        I.PageObserver.unobservePageIntersection(Page);
        Item.Box.removeChild(Page);
    });
    Item.Pages = [];
    for(let i = 0; i < HowManyPages; i++) {
        const Page = Item.Box.appendChild(sML.create('span', { className: 'page',
            IsPage: true,
            Spread: Item.Spread, Item: Item,
            IndexInItem: Item.Pages.length
        }));
        Item.Pages.push(Page);
        I.PageObserver.observePageIntersection(Page);
    }
    const ItemContentCoordInItemBox = !Item.NoPadding ? { Left: Item.Padding.Left, Top: Item.Padding.Top } : { Left: 0, Top: 0 };
    Item.PagedContentAreas = Item.Pages.map(Page => {
        const PageContentAreaInItemBox = {
            Left: Page.offsetLeft, Right: Page.offsetLeft + Page.offsetWidth,
             Top: Page.offsetTop, Bottom: Page.offsetTop  + Page.offsetHeight
        };
        if(!Item.NoPadding) {
            const PagePadding = {        [C.L_OOBL_B]:  Item.Padding[C.L_OOBL_B],            [C.L_OEBL_B]:  Item.Padding[C.L_OEBL_B] * -1 };
            if(Item.Columned) PagePadding[C.L_OOBL_L] = Item.Padding[C.L_OOBL_L], PagePadding[C.L_OEBL_L] = Item.Padding[C.L_OEBL_L] * -1;
            Object.keys(PagePadding).forEach(Key => PageContentAreaInItemBox[Key] += PagePadding[Key]);
        }
        return Page.ContentAreaInItem = {
            Left: Math.max(PageContentAreaInItemBox.Left - ItemContentCoordInItemBox.Left, 0),  Right: Math.min(PageContentAreaInItemBox.Right  - ItemContentCoordInItemBox.Left, Item.HTML.offsetWidth ),
             Top: Math.max(PageContentAreaInItemBox.Top  - ItemContentCoordInItemBox.Top,  0), Bottom: Math.min(PageContentAreaInItemBox.Bottom - ItemContentCoordInItemBox.Top,  Item.HTML.offsetHeight)
        };
    }); // console.log(Item.Index, Item.PagedContentAreas);
    /*
    if(Item.Index == 2) { //setTimeout(() => {
        console.log(`R.Items[${ Item.Index }]:`, Item);
        O.logSets(`R.Items[${ Item.Index }]`, '.', ['HTML', 'Body'], '.', ['offset', 'client', 'scroll'], ['Width', 'Height', 'Left', 'Top']); //}, 100);
    }
    //*/
    resolve();
}).then(() => Item);

R.donateSoloPictures = () => { // dissolve standalone title illustrations into adjacent long text: the picture node is adopted into the text flow and processed as an inline illustration (same zone/middle/clearance machinery). idempotent; returns { adopted, recipients }.
    const recipients = new Set();
    let adopted = 0;
    const Metas = R.Spreads.map(Sp => {
        const Solo = Sp.Items.length == 1 ? Sp.Items[0] : null;
        if(!Solo || !Solo.Body || !Solo.contentDocument) return null;
        if(Sp.Index > 0 && (Solo.OnlySingleSVG || Solo.OnlySingleImg) && Solo.SingleMediaIsBig === true) { // re-donates after document reloads (new unflagged nodes); settled pictures are skipped by their adopted flag below
            const Media = R.renderPrePaginatedItem.getSingleMediaElement(Solo);
            if(Media && !Media.BibiAdoptedPicture) return { donor: true };
        }
        if(Solo.Reflowable && !Solo.OnlySingleSVG && !Solo.OnlySingleImg) {
            let textLen = 0;
            try { textLen = (O.getElementInnerText(Solo.Body) || '').length; } catch(Err) {}
            return { donor: false, textLen };
        }
        return null;
    });
    planSoloPictureDonations(Metas).forEach(({ from, to, atHead }) => {
        const Donor = R.Spreads[from].Items[0], Recip = R.Spreads[to].Items[0];
        if(!Donor.Body || !Recip.Body || !Recip.contentDocument) return;
        let Tar = R.renderPrePaginatedItem.getSingleMediaElement(Donor);
        if(!Tar || Tar.BibiAdoptedPicture) return;
        let Guard = 0; // climb through textless single-child wrappers (p > img): adopt the paragraph, not the bare picture
        while(Tar.parentElement && Tar.parentElement !== Donor.Body && Guard++ < 8
            && Tar.parentElement.firstElementChild === Tar && !Tar.parentElement.firstElementChild.nextElementSibling
            && !((Tar.parentElement.innerText || '').trim())) Tar = Tar.parentElement;
        const Host = Recip.Body.querySelector('div.main') || Recip.Body;
        let Adopted = null;
        try {
            Host.querySelectorAll(':scope [data-bibi-adopted-from="' + Donor.Index + '"]').forEach(N => N.remove()); // reload survivor: drop the stale copy from this donor before moving the fresh node
            Adopted = Recip.contentDocument.adoptNode(Tar); // same-origin iframes: the node moves with listeners and image data, no reload
            if(atHead) Host.prepend(Adopted); else Host.append(Adopted);
        } catch(Err) { return; }
        try { Adopted.setAttribute('data-bibi-adopted-from', Donor.Index); } catch(Err) {}
        const Media = Adopted.querySelector('img, svg') || (/^(img|svg)$/i.test(Adopted.tagName) ? Adopted : null);
        if(Media) Media.BibiAdoptedPicture = true;
        Donor.BibiDonationDonor = true;
        adopted++;
        recipients.add(R.Spreads[to]);
    });
    return { adopted, recipients: [...recipients] };
};

R.auditPictureRows = (Item) => { // settle big in-flow picture rows: a picture sharing its row with its tail (backfill) keeps following prose off the row; a leading picture lets prose join it (text|image). change-driven, verdict-backed: returns true only when a break changed (caller re-renders at most once); steady rows cost one measurement and no relayout.
    if(!Item || !Item.Body || !Item.contentDocument || S.RVM != 'paged') return false;
    const Doc = Item.contentDocument;
    let Changed = false;
    sML.forEach(Item.Body.querySelectorAll('img, svg'))(Ele => {
        const Tar = Ele.BibiPictureZone;
        if(!Tar || !Tar.isConnected || !Tar.contains(Ele)) return;
        const Prev = Tar.previousElementSibling;
        let Shared = false;
        if(Prev) {
            try {
                const Walker = Doc.createTreeWalker(Prev, NodeFilter.SHOW_TEXT, { acceptNode(T) { return T.nodeValue.trim().length > 1 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; } });
                const Range = Doc.createRange(), T = Tar.getBoundingClientRect();
                while(Walker.nextNode() && !Shared) {
                    Range.selectNodeContents(Walker.currentNode);
                    const Rects = Range.getClientRects();
                    for(let i = 0; i < Rects.length; i++) {
                        const L = Rects[i];
                        if(Math.min(L.bottom, T.bottom) - Math.max(L.top, T.top) > 100) { Shared = true; break; } // any tail line lives in the picture's row (last-line-only missed ragged short ends)
                    }
                }
            } catch(Err) {}
        }
        Tar.BibiPictureRowShared = Shared;
        const Want = Shared ? 'column' : '';
        if((Tar.style.breakAfter || '') !== Want) { Tar.style.breakAfter = Want; Changed = true; }
    });
    return Changed;
};

R.alignPicturesToMiddle = (Item) => { // geta: slide solo pictures to the page middle (visual transform only; the exclusion zone stays put, so no reflow and no overlap). backfilled pictures touch the middle with their right edge, leading ones with their left edge. dead space verified per row; skipped on any doubt.
    if(!Item || !Item.Body || !Item.contentDocument || S.RVM != 'paged' || !Item.Columned || !(Item.ColumnBreadth > 0)) return;
    const Doc = Item.contentDocument;
    const ContentLeft = Item.HTML.getBoundingClientRect().left + (Item.Padding ? Item.Padding.Left : 0);
    const Mid = ContentLeft + Item.ColumnBreadth / 2, Half = Item.ColumnBreadth / 2;
    const Tars = [];
    sML.forEach(Item.Body.querySelectorAll('img, svg'))(Ele => {
        const Tar = Ele.BibiPictureZone;
        if(!Tar || !Tar.isConnected || !Tar.contains(Ele)) return;
        Tar.style.transform = ''; Tars.push([Ele, Tar]); // clear stale shifts; measure pure layout below
    });
    Tars.forEach(([Ele, Tar]) => {
        try {
            if(Tar.getClientRects().length !== 1) return; // fragmented zone: do not touch
            const IR = Ele.getBoundingClientRect();
            if(!(IR.width > 0) || IR.width > Half) return; // wider than half: middle-touch impossible
            const TR = Tar.getBoundingClientRect();
            const Walker = Doc.createTreeWalker(Doc.body, NodeFilter.SHOW_TEXT, { acceptNode(T) { return T.nodeValue.trim().length > 1 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; } });
            const Range = Doc.createRange();
            const Rows = [];
            while(Walker.nextNode()) {
                const T = Walker.currentNode;
                if(Tar.contains(T)) continue;
                try {
                    Range.selectNodeContents(T);
                    const Rects = Range.getClientRects();
                    for(let i = 0; i < Rects.length; i++) {
                        const R0 = Rects[i];
                        if(R0.bottom <= TR.top + 2 || R0.top >= TR.bottom - 2) continue; // outside the picture's row
                        Rows.push(R0);
                    }
                } catch(Err) {}
            }
            const Pitch = Rows.length && Rows[0].width > 0 ? Rows[0].width : 28, Need = Rows.length ? Pitch * 2 : 0; // two-line clearance (none needed when the row has no prose)
            let dL = 1e9, dR = 1e9;
            for(let i = 0; i < Rows.length; i++) {
                const R0 = Rows[i];
                if(R0.right <= IR.left + 2) dL = Math.min(dL, IR.left - R0.right);
                else if(R0.left >= IR.right - 2) dR = Math.min(dR, R0.left - IR.right);
                else if(Math.min(R0.right, IR.right) - Math.max(R0.left, IR.left) > 2) return; // overlapping layout: do not touch
            }
            const Cands = [Tar.BibiPictureRowShared ? Mid - IR.width : Mid]; // first: middle-touch (backfill right edge to middle, leading left edge to middle)
            if(Math.min(dL, dR) < Need) Cands.push(dL <= dR ? IR.left + (Need - dL) : IR.right - (Need - dR) - IR.width); // fallback: back off the nearer prose
            for(let c = 0; c < Cands.length; c++) {
                const WantX = Math.round(Cands[c]), TX1 = WantX + IR.width;
                if(WantX < ContentLeft - 1 || TX1 > ContentLeft + Item.ColumnBreadth + 1) continue; // never leave the content: a shift past the edge would paint over chrome or clip
                let gL = 1e9, gR = 1e9, Hit = false;
                for(let i = 0; i < Rows.length && !Hit; i++) {
                    const R0 = Rows[i];
                    if(R0.right <= WantX + 2) gL = Math.min(gL, WantX - R0.right);
                    else if(R0.left >= TX1 - 2) gR = Math.min(gR, R0.left - TX1);
                    else if(Math.min(R0.right, TX1) - Math.max(R0.left, WantX) > 2) Hit = true;
                }
                if(!Hit && Math.min(gL, gR) >= Need - 1) { if(WantX !== Math.round(IR.left)) Tar.style.transform = 'translateX(' + Math.round(WantX - IR.left) + 'px)'; return; }
            }
        } catch(Err) {}
    });
};

/* R.Paginated */ Object.defineProperty(R, 'Paginated', { get: () => {
    if(B.PrePaginated) return true;
    switch(S.RVM) {
        case      'paged': return true;
        case 'horizontal': return B.WritingMode.split('-')[1] == 'tb';
        case   'vertical': return B.WritingMode.split('-')[0] == 'tb';
    }
} });
R.renderPrePaginatedItem = (Item) => new Promise(resolve => {
    sML.style(Item, { width: '', height: '', transform: '' });
    Item.Spreaded = (
        (S.RVM == 'paged' || !S['full-breadth-layout-in-scroll'])
            &&
        (Item['rendition:spread'] == 'both' || R.Orientation == Item['rendition:spread'] || R.Orientation == 'landscape')
    );
    R.renderPrePaginatedItem.getViewport(Item).then(Vp => R.renderPrePaginatedItem.getScale(Item, Vp).then(Sc => {
        Item.Scale = Sc;
        sML.style(Item.Box, {
            width:  Math.floor(Vp.Width  * Sc) + 'px',
            height: Math.floor(Vp.Height * Sc) + 'px'
        })
        if(Item.parentElement) sML.style(Item, {
            width:  Vp.Width  + 'px',
            height: Vp.Height + 'px',
            transform: 'scale(' + Sc + ')'
        });
    })).then(resolve);
}).then(() => Item);
    R.renderPrePaginatedItem.getSingleMediaElement = (Item) => { // dives through single-child wrappers (div > p > img); empty anchors calibre emits beside pictures are stepped over, never dive-blockers
        const isVoidSidekick = (El) => !/^(svg|img)$/i.test(El.tagName) && !El.querySelector('svg[viewBox], img[src], image[*|href], image[href], canvas, video, embed, object') && !((O.getElementInnerText(El) || '').trim()); // no media, no text: layout-invisible (captioned wrappers keep their text and stay reflowable)
        let El = Item.Body ? Item.Body.firstElementChild : null, Guard = 0;
        while(El && Guard++ < 8) {
            if(/^(svg|img)$/i.test(El.tagName)) return El;
            if(!/^(div|p|figure|section|article|span)$/i.test(El.tagName) || !El.firstElementChild) return null;
            const Kids = [...El.children].filter(Kid => !isVoidSidekick(Kid));
            if(Kids.length !== 1) return null;
            El = Kids[0];
        }
        return null;
    };

    R.renderPrePaginatedItem.getViewport = (Item) => Promise.resolve().then(() =>
          Item.Viewport ? Item.Viewport
        : (    (S.RVM != 'paged' && S['full-breadth-layout-in-scroll'])
            && (!Item.Source.External || S['allow-external-item-href'])
            && (Item.Type == 'MarkupDocument' || Item.Type == 'SVG')
          ) ? O.file(Item.Source).then(() => O.getItemViewport(Item).then(Vp => Item.Viewport = Vp))
        : (   Item.SpreadPair?.Viewport          ? Item.SpreadPair.Viewport
            : Item.IsPlaceholder || !Item.Loaded ? null
            : Item.OnlySingleSVG                 ? Item.Viewport = O.getViewportByViewBox(R.renderPrePaginatedItem.getSingleMediaElement(Item)?.getAttribute('viewBox'))
            : Item.OnlySingleImg                 ? Item.Viewport = O.getViewportByImage(  R.renderPrePaginatedItem.getSingleMediaElement(Item)                                             )
            :                                      null
        ) || {
            Width:  Math.floor(Math.min(R.paneWidthFor(Item), R.Stage.Height * S['orientation-border-ratio']) / (/^(left|right)$/.test(Item['rendition:page-spread']) ? 2 : 1)),
            Height: R.Stage.Height,
            IsSubstitute: true
        }
    );

    R.renderPrePaginatedItem.getScale = (Item, Vp = Item.Viewport) => Promise.resolve().then(() => {
        const PaneW = R.paneWidthFor(Item);
        return !Vp || Vp.IsSubstitute ? 1
        : Item.Spreaded ? (Item.SpreadPair ? R.renderPrePaginatedItem.getViewport(Item.SpreadPair) : (R.TwoPane ? Promise.resolve(null) : Promise.resolve(/^(left|right)$/.test(Item['rendition:page-spread']) ? Vp : null))).then(PVp => Math.min(R.Stage.Height / Vp.Height, PaneW / (Vp.Width + (PVp?.Width || 0))))
        : (S.RVM == 'paged' || !S['full-breadth-layout-in-scroll']) ? Math.min(R.Stage.Height / Vp.Height, PaneW / Vp.Width)
        : Math.min(1, R.Stage[C.L_SIZE_B] / Vp[C.L_SIZE_B]);
    });


R.organizePages = () => R.Pages = R.Spreads.reduce((NewPages, Spread) => Spread.Pages.reduce((NewPages, Page) => { Page.Index = NewPages.push(Page) - 1; return NewPages; }, NewPages), []);
R.isBlankPageContent = (Item) => { // true only when the document is present and provably empty
    try {
        const Doc = Item.contentDocument;
        if(!Doc || !Doc.body) return false;
        if(O.getElementInnerText(Doc.body)) return false; // has prose: pairable content, not a blank
        const Media = Doc.body.querySelector('svg[viewBox], img[src], image[*|href], image[href], canvas, video, embed, object');
        return !Media;
    } catch(Err) { return false; }
};
R.singleMediaIsBig = (El) => { // true | false | null(still unknown): pictures at or below 384x384 are excluded from picture handling
    if(!El) return false;
    let W = 0, H = 0;
    if(/^svg$/i.test(El.tagName)) {
        const VB = O.getViewportByViewBox(El.getAttribute('viewBox'));
        if(VB) { W = VB.Width; H = VB.Height; }
        else { W = El.getAttribute('width') * 1 || 0; H = El.getAttribute('height') * 1 || 0; }
    } else if(/^img$/i.test(El.tagName)) {
        W = El.naturalWidth || El.getAttribute('width') * 1 || 0;
        H = El.naturalHeight || El.getAttribute('height') * 1 || 0;
    } else return true;
    if(!(W > 0 && H > 0)) return null;
    return W > 384 || H > 384;
};
R.isBigPicture = (El) => R.singleMediaIsBig(El) !== false; // optimistic: unknown counts as big until dimensions resolve
R.getSingleMediaAspect = (Item) => { // [w, h] from the media element itself when Item.Viewport is unresolved (e.g. bare <img> pages)
    try {
        const El = R.renderPrePaginatedItem.getSingleMediaElement(Item);
        if(!El) return null;
        if(/^svg$/i.test(El.tagName)) {
            const VB = O.getViewportByViewBox(El.getAttribute('viewBox'));
            if(VB) return [VB.Width, VB.Height];
            const W = El.getAttribute('width') * 1, H = El.getAttribute('height') * 1;
            if(W > 0 && H > 0) return [W, H];
            return null;
        }
        if(/^img$/i.test(El.tagName) && El.naturalWidth > 0 && El.naturalHeight > 0) return [El.naturalWidth, El.naturalHeight];
        return null;
    } catch(Err) { return null; }
};
R.TwoPane = false;
R.TwoPaneGroupSignature = '';
R.TwoPaneRelaying = false;
R.isTwoPaneViewport = isTwoPaneViewport;
R.shouldSoloLandscapeSpread = shouldSoloLandscapeSpread;
R.isPairableSpread = isPairableSpread;
R.planTwoPaneGroups = planTwoPaneGroups;
R.planSoloPictureDonations = planSoloPictureDonations;
R.paneWidthFor = (Item) => (R.TwoPane && Item.Spread && Item.Spread.PaneWidthFactor == 0.5) ? R.Stage.Width / 2 : R.Stage.Width;
R.updateTwoPaneGrouping = () => {
    const Spreads = R.Spreads;
    const Groups = R.TwoPane ? R.planTwoPaneGroups(Spreads.map(Sp => {
        const Solo = (Sp.Items.length == 1) ? Sp.Items[0] : null;
        const pairable = R.isPairableSpread(Sp) && !R.isBlankPageContent(Solo);
        const Vp = Solo && Solo.Viewport;
        const Aspect = (Vp && !Vp.IsSubstitute) ? [Vp.Width, Vp.Height] : (Solo ? R.getSingleMediaAspect(Solo) : null);
        const BigEnough = (Vp && !Vp.IsSubstitute) ? true : (Solo ? Solo.SingleMediaIsBig === true : false); // media fallback counts only when resolved big; small stays pairable
        return { pairable: pairable, soloLandscape: !!(pairable && BigEnough && Aspect && R.shouldSoloLandscapeSpread(Aspect[0], Aspect[1], R.Stage.Width, R.Stage.Height)) };
    })) : Spreads.map((_, i) => [i]);
    const Sig = Groups.map(G => G.join('+')).join('|');
    if(Sig == R.TwoPaneGroupSignature) return { changed: false, spreads: [] };
    R.TwoPaneGroupSignature = Sig;
    const Changed = [];
    const Touch = (Sp, Members) => {
        const Key = Members.map(M => M.Index).join('+');
        const Factor = (Members.length > 1) ? 0.5 : 1;
        if(Sp.TwoPaneGroupKey !== Key || Sp.PaneWidthFactor !== Factor) Changed.push(Sp);
        Sp.TwoPaneGroup = Members; Sp.TwoPaneGroupKey = Key; Sp.PaneWidthFactor = Factor; Sp.Box.classList.toggle('two-pane-paired', Factor == 0.5);
        Sp.Box.classList.toggle('two-pane-pair-first', Factor == 0.5 && Members[0] === Sp);
        Sp.Box.classList.toggle('two-pane-pair-second', Factor == 0.5 && Members[Members.length - 1] === Sp && Members[0] !== Sp);
    };
    Groups.forEach(G => { const Members = G.map(i => Spreads[i]); Members.forEach(Sp => Touch(Sp, Members)); });
    return { changed: Changed.length > 0, spreads: Changed };
};
R.requestTwoPaneRegroup = () => { // reveal/resize convergence: regroup is signature-guarded and storm-safe
    if(!R.Spreads.length || R.TwoPaneRelaying) return;
    clearTimeout(R.TwoPaneRegroupTimer);
    R.TwoPaneRegroupTimer = setTimeout(() => {
        if(R.LayingOut) { R.requestTwoPaneRegroup(); return; }
        R.TwoPaneRelaying = true;
        try {
            const Donation = R.donateSoloPictures(); // late-resolving pictures dissolve here (bulk pass runs pre-layout in layOutBook); recipients join the relayout even when grouping is unchanged for them
            const { changed, spreads } = R.updateTwoPaneGrouping();
            Donation.recipients.forEach(Sp => { if(!spreads.includes(Sp)) spreads.push(Sp); });
            if(spreads.length && (changed || Donation.adopted)) Promise.all(spreads.map(Sp => R.layOutSpreadAndItsItems(Sp))).then(() => { R.organizePages(); try { I.PageObserver.updateCurrent(); } catch(Err) {} R.snapTwoPaneView(); }); // layOutSpread rebuilds Spread.Pages from recreated item pages but leaves R.Pages/Current pointing at detached nodes (slider math crashes on them) — rebuild both
        } finally { R.TwoPaneRelaying = false; }
    }, 120);
};
R.isTwoPanePairAligned = (Pair) => {
    if(!R.TwoPane || !Pair || Pair.length < 2) return true;
    try {
        const MR = R.Main.getBoundingClientRect();
        const Rs = Pair.map(Sp => Sp.Box.getBoundingClientRect());
        return Rs[0].left >= MR.left - 1 && Rs[Rs.length - 1].right <= MR.right + 1;
    } catch(Err) { return true; }
};
R.snapTwoPaneView = (Tries = 3) => { // re-aim the current pair only when misaligned; retries converge transient geometry (progressive image loads), then stop
    if(!R.TwoPane || R.Moving) return false;
    try {
        const Cur = I.PageObserver.Current.Pages[0];
        if(!Cur || !Cur.Spread) return false;
        const Pair = Cur.Spread.TwoPaneGroup;
        if(!Pair || Pair.length < 2 || R.isTwoPanePairAligned(Pair)) return false;
        const P0 = R.getP();
        R.focusOn({ Page: Cur }, { Duration: 0 }).then(() => {
            setTimeout(() => {
                try {
                    if(R.getP() != P0) return; // user moved on; never fight them
                    const Pair2 = Cur.Spread.TwoPaneGroup;
                    if(Pair2 && Pair2.length > 1 && !R.isTwoPanePairAligned(Pair2) && Tries > 1) R.snapTwoPaneView(Tries - 1);
                } catch(Err) {}
            }, 300);
        }).catch(() => {});
        return true;
    } catch(Err) { return false; }
};
R.requestTwoPaneSnap = () => {
    clearTimeout(R.TwoPaneSnapTimer);
    R.TwoPaneSnapTimer = setTimeout(() => { R.snapTwoPaneView(); }, 150);
};

R.replacePages = (OldPages, NewPages) => {
    const StartIndex = OldPages[0].Index, OldLength = OldPages.length, NewLength = NewPages.length;
    for(let l = NewPages.length, i = 0; i < l; i++) NewPages[i].Index = StartIndex + i;
    if(NewLength != OldLength) {
        const Dif = NewLength - OldLength;
        let i = OldPages[OldLength - 1].Index + 1;
        while(R.Pages[i]) R.Pages[i].Index += Dif, i++;
    }
    R.Pages.splice(StartIndex, OldLength, ...NewPages);
    return R.Pages;
};


R.layOutStage = () => {
    //E.dispatch('bibi:is-going-to:lay-out-stage');
    let MainContentLayoutLength = 0;
    if(R.TwoPane) { // paired spreads share one row: count each pair once at the taller member
        const Seen = new Set();
        R.Spreads.forEach(Spread => {
            const Key = Spread.TwoPaneGroupKey !== undefined ? Spread.TwoPaneGroupKey : Spread.Index;
            if(Seen.has(Key)) return;
            Seen.add(Key);
            const Members = (Spread.TwoPaneGroup && Spread.TwoPaneGroup.length > 1) ? Spread.TwoPaneGroup : [Spread];
            MainContentLayoutLength += Math.max(...Members.map(Sp => Sp.Box['offset' + C.L_SIZE_L]));
        });
    } else R.Spreads.forEach(Spread => MainContentLayoutLength += Spread.Box['offset' + C.L_SIZE_L]);
    const SpreadGap = B.Reflowable || S.RVM == 'paged' || (() => { switch(S['concatenate-spreads'][S.RVM == 'horizontal' ? 0 : 1]) {
        case 'always': return true;
        case 'never': return false;
        default: return (B.Package.Metadata['rendition:flow'] == 'scrolled-continuous' || B.Package.Metadata['scroll-direction']);
    }})() ? 0 : Math.max(Math.ceil(R.Stage[C.L_SIZE_L] / 8), 40);
    if(SpreadGap) MainContentLayoutLength += SpreadGap * (R.Spreads.length - 1);
    R.Main.Book.style[C.L_SIZE_l] = MainContentLayoutLength + 'px';
    //E.dispatch('bibi:laid-out-stage');
};


R.layOutBook = (Opt) => new Promise((resolve, reject) => setTimeout(() => {
    // Opt: {
    //     DoNotCloseUtilities: Boolean,
    //     NoNotification: Boolean,
    //     Destination: BibiDestination,
    //     Setting: BibiSetting,
    //     before: Function,
    //     Reset: Boolean,
    //     ResetOnlyContent: Boolean,
    //     Delay: Integer
    // }
    if(R.LayingOut) return reject();
    I.ScrollObserver.History = [];
    R.LayingOut = true;
    O.log(`Laying out...`, '<g:>');
    if(Opt) O.log(`Option: %O`, Opt); else Opt = {};
    if(!Opt.DoNotCloseUtilities) E.dispatch('bibi:closes-utilities');
    E.dispatch('bibi:is-going-to:lay-out', Opt);
    O.Busy = true;
    O.HTML.classList.add('busy');
    O.HTML.classList.add('laying-out');
    if(!Opt.NoNotification) I.notify(`Laying out...`);
    if(!Opt.Destination) Opt.Destination = { Element: R.getElement() };
    if(Opt.Setting) S.update(Opt.Setting);
    R.updateOrientation();
    const Layout = {}; ['reader-view-mode', 'spread-layout-direction', 'apparent-reading-direction'].forEach(Pro => Layout[Pro] = S[Pro]);
    O.log(`Layout: %O`, Layout);
    setTimeout(() => Promise.resolve().then(() => typeof Opt.before == 'function' ? Opt.before() : true).then(() => {
        if(!Opt.Reset) return resolve();
        if(!Opt.ResetOnlyContent) R.resetStage();
        R.donateSoloPictures(); // bulk pass: standalone pictures dissolve into adjacent long text before pagination (late-resolving ones follow via regroup)
        R.updateTwoPaneGrouping(); // signature-guarded: first layout, resizes, and setting changes converge here
        const Promises = [];
        R.Spreads.forEach(Spread => Promises.push(R.layOutSpreadAndItsItems(Spread)));
        Promise.all(Promises).then(() => {
            R.organizePages();
            R.layOutStage();
            resolve();
        });
    }), Number.isFinite(Opt.Delay) ? Opt.Delay : 33);
}, Number.isFinite(Opt?.DelayBefore) ? Opt.DelayBefore : 0)).then(() => {
    return R.focusOn(Opt.Destination, { Duration: 0 });
}).then(() => {
    O.Busy = false;
    O.HTML.classList.remove('busy');
    O.HTML.classList.remove('laying-out');
    if(!Opt.NoNotification) I.notify('');
    R.LayingOut = false;
    E.dispatch('bibi:laid-out');
    O.log(`Laid out.`, '</g>');
});


R.updateOrientation = () => {
    const PreviousOrientation = R.Orientation;
    let Orientation = '';
    if(O.TouchOS) {
             if(typeof screen.orientation?.type == 'string') Orientation = screen.orientation.type.split('-')[0];
        else if(typeof window.orientation       == 'number') Orientation = window.orientation % 180 == 0 ? 'portrait' : 'landscape';
    }
    if(!Orientation) {
        const W = window.innerWidth  - (S.ARA == 'vertical'   ? O.Scrollbars.Width  : 0);
        const H = window.innerHeight - (S.ARA == 'horizontal' ? O.Scrollbars.Height : 0);
        Orientation = (W / H) < S['orientation-border-ratio'] ? 'portrait' : 'landscape';
    }
    if(Orientation != PreviousOrientation) {
        R.Orientation = Orientation;
        if(PreviousOrientation) E.dispatch('bibi:changes-orientation', R.Orientation);
        O.HTML.classList.remove('orientation-' + PreviousOrientation);
        O.HTML.classList.add('orientation-' + R.Orientation);
        if(PreviousOrientation) E.dispatch('bibi:changed-orientation', R.Orientation);
    }
};


R.changeView = (Par) => { if(!Par) return false;
    switch(typeof Par) {
        case 'string': Par = { Mode: Par };
        case 'object':
           if(S['fix-reader-view-mode'] || typeof Par.Mode != 'string' || !S['available-reader-view-modes'].includes(Par.Mode)) Par.Mode = S.RVM;
            Par.FullBreadthLayoutInScroll = B.Reflowable ? false : (Par.FullBreadthLayoutInScroll === undefined || !S['available-reader-view-modes'].includes('vertical')) ? S['full-breadth-layout-in-scroll'] : !!(Par.FullBreadthLayoutInScroll);
            if(S.RVM == Par.Mode && Par.FullBreadthLayoutInScroll == S['full-breadth-layout-in-scroll']) return false;
            break;
        default: return false;
    }
    let ToLayOut = false;
    if(S.RVM != Par.Mode) ToLayOut = true;
    if(Par.FullBreadthLayoutInScroll != S['full-breadth-layout-in-scroll']) {
        S.update({ 'full-breadth-layout-in-scroll': Par.FullBreadthLayoutInScroll });
        if(Par.FullBreadthLayoutInScroll) O.HTML.classList.add(   'book-full-breadth');
        else                              O.HTML.classList.remove('book-full-breadth');
        if(Par.Mode == 'vertical') ToLayOut = true;
    }
    const Setting = {
        'reader-view-mode': Par.Mode,
        'full-breadth-layout-in-scroll': Par.FullBreadthLayoutInScroll
    };
    if(L.Opened && ToLayOut) {
        E.dispatch('bibi:changes-view', Par.Mode);
        O.Busy = true;
        O.HTML.classList.add('busy');
        O.HTML.classList.add('changing-view');
        R.layOutBook({
            before: () => new Promise(resolve => setTimeout(() => resolve(E.dispatch('bibi:closes-utilities')), 0)),
            Reset: true,
            NoNotification: Par.NoNotification,
            Setting: Setting,
            DelayBefore: 33
        }).then(() => {
            O.HTML.classList.remove('changing-view');
            O.HTML.classList.remove('busy');
            O.Busy = false;
            setTimeout(() => E.dispatch('bibi:changed-view', Par.Mode), 0);
        });
    } else {
        S.update(Setting);
        if(!L.Opened) L.play();
    }
    if(S['keep-settings']) I.Oven.Biscuits.memorize('Book', { RVM: Par.Mode, FBL: Par.FullBreadthLayoutInScroll });
};


Object.defineProperties(R, { // To ensure backward compatibility.
    Current: { get: () => I.PageObserver.Current },
    updateCurrent: { get: () => I.PageObserver.updateCurrent }
});


R.focusOn = (Par, Opt) => new Promise((resolve, reject) => { // Par = { Destination: DESTINATION } || DESTINATION, Par.Side = STRING (optional)
    if(R.Moving) return reject();
    let Dest = Par?.Destination !== undefined ? Par.Destination : Par;
    Opt = Object.assign({}, Par, Opt ? Opt : {});
    if(!Opt.Distilled) Dest = R.dest(Dest);
    if(!Dest || !Dest.Page) try { Dest = { Page: I.PageObserver.Current.Pages[0] }; } catch(Err) { return reject(); }
    E.dispatch('bibi:is-going-to:focus-on', Dest);
    R.Moving = true;
    let FocusPoint;
    const Page = Dest.Page, Item = Page.Item, Side = Opt.Side != 'after' ? 'before' : 'after';
    if(Item.Reflowable) {
        if(!R.Paginated && B.WritingMode.split('-')[1] == Item.WritingMode.split('-')[1] && Dest.Element && Dest.Element.ownerDocument != document) {
            FocusPoint = O.getElementCoord(Item)[C.L_AXIS_L] + (Item.NoPadding ? 0 : Item.Padding[C.L_OOBL_L]) + Dest.Element.getBoundingClientRect()[C.L_BASE_b];
        } else {
            FocusPoint = O.getElementCoord(Page)[C.L_AXIS_L];
            if(Side == 'after') FocusPoint += (Page['offset' + C.L_SIZE_L] - R.Stage[C.L_SIZE_L]) * C.L_AXIS_D;
            if(S.SLD == 'rtl') FocusPoint += Page.offsetWidth;
        }
        if(S.SLD == 'rtl') FocusPoint -= R.Stage.Width;
    } else {
        if(R.Stage[C.L_SIZE_L] >= Page.Spread['offset' + C.L_SIZE_L]) {
            FocusPoint = O.getElementCoord(Page.Spread)[C.L_AXIS_L];
            FocusPoint -= Math.floor((R.Stage[C.L_SIZE_L] - Page.Spread['offset' + C.L_SIZE_L]) / 2);
        } else {
            FocusPoint = O.getElementCoord(Page)[C.L_AXIS_L];
            if(R.Stage[C.L_SIZE_L] > Page['offset' + C.L_SIZE_L]) FocusPoint -= Math.floor((R.Stage[C.L_SIZE_L] - Page['offset' + C.L_SIZE_L]) / 2);
            else if(Side == 'after') FocusPoint += (Page['offset' + C.L_SIZE_L] - R.Stage[C.L_SIZE_L]) * C.L_AXIS_D;
        }
    }
    if(R.TwoPane && Page.Spread.TwoPaneGroup && Page.Spread.TwoPaneGroup.length > 1 && !R.isTwoPanePairAligned(Page.Spread.TwoPaneGroup)) { // center the whole pair on box slots, never a half-shifted spread (skip when already aligned: no redundant scrolls, no event storms)
        const Pair = Page.Spread.TwoPaneGroup, PairL = (C.L_AXIS_L == 'X') ? Pair.reduce((L, Sp) => L + Sp.Box['offset' + C.L_SIZE_L], 0) : Math.max(...Pair.map(Sp => Sp.Box['offset' + C.L_SIZE_L]));
        FocusPoint = O.getElementCoord(Pair[0].Box, R.Main)[C.L_AXIS_L];
        if(R.Stage[C.L_SIZE_L] >= PairL) FocusPoint -= Math.floor((R.Stage[C.L_SIZE_L] - PairL) / 2);
    }
    // if(Number.isInteger(Dest.TextNodeIndex)) R.selectTextLocation(Dest); // Colorize Destination with Selection
    const ScrollTarget = { Frame: R.Main, X: 0, Y: 0 };
    ScrollTarget[C.L_AXIS_L] = FocusPoint; if(!S['use-full-height'] && S.RVM == 'vertical') ScrollTarget.Y -= I.Menu.Height;
    O.HTML.classList.add('moving');
    sML.scrollTo(ScrollTarget, {
        ForceScroll: true,
        Duration: typeof Opt.Duration == 'number' ? Opt.Duration : (S.SLA == S.ARA && S.RVM != 'paged') ? 39 : 0,
        ease: typeof Opt.ease == 'function' ? Opt.ease : (Pos) => (Pos === 1) ? 1 : Math.pow(2, -10 * Pos) * -1 + 1
    }).then(() => {
        O.HTML.classList.remove('moving');
        try { I.PageObserver.updateCurrent(); } catch(Err) {} // visible-but-untracked spreads stay visibility:hidden (pair mates especially) — sync at final geometry
        resolve(Dest);
        E.dispatch('bibi:focused-on', Dest);
    }).catch(reject);
}).finally(() => R.Moving = false).catch(() => {}).then(Dest => Dest);


R.dest = (_, Opt) => { if(_ === undefined || _ === null) return null;
    /* _ = { // Destination Format (Immutable)
        Range: RANGE,
        Element: ELEMENT,
        CFI: STRING,
        P: STRING,
            (IsAutomark: BOOLEAN,
            (IsBookmark: BOOLEAN,
        IIPP: NUMBER,
        Item: ELEMENT,
        ItemIndex: INTEGER,
        ItemIndexInSpine: INTEGER,
        ItemIndexInSpread: INTEGER,
            ElementSelector: STRING,
            ProgressInItem: NUMBER,
            EdgeOfItem: STRING,
            PageIndexInItem: INTEGER,
        Spread: ELEMENT,
        SpreadIndex: INTEGER,
            ProgressInSpread: NUMBER,
            EdgeOfSpread: STRING,
            PageIndexInSpread: INTEGER
        Progress: NUMBER,
        Edge: STRING,
        --------
        PageIndex: INTEGER,
        --------
        Page: ELEMENT
    } */
    const DD = { /* // Distilled Destination (New Object)
        Page: ELEMENT, (with/out)
                 Item: ELEMENT, (with/out)
                         Range: RANGE,
                    (or) Element: ELEMENT, (with/out)
                                     TextNodeIndex: INTEGER,
                            (and/or) CharacterOffset: OBJECT,
                    (or) ProgressInItem: NUMBER, 
            (or) Spread: ELEMENT, (with/out)
                     ProgressInSpread: NUMBER, 
            (or) Progress: NUMBER
    */ };
    if(_.IsAutomark || _.IsBookmark) {
        if(_.P === undefined) return null;
        if(!_.Page) _.Page = R.getPageStartsWithP(_.P);
    } else if(Opt && Opt.Distilled) {
        Object.assign(DD, _);
        delete DD.Page;
    } else {
        switch(typeof _) {
            case 'object': _ = _.startContainer ? { Range: _ } : _.nodeType == 1 ? { Element: _ } : Object.assign({}, _); break; // Immutable
            case 'number': _ = Number.isFinite(_) ? { IIPP: _ } : {}; break;
            case 'string': _ = R.getCFIDestination(_) || R.getPDestination(_) || {};
        }
        if(_.Range !== undefined) {
            if(_.Range && _.Range.startContainer) {
                if(_.Range.startContainer.ownerDocument.body.Item) {
                    const Item = _.Range.startContainer.ownerDocument.body.Item;
                    if(Item && Item.IsLinearItem) {
                        DD.Item = Item;
                        DD.Range = _.Range;
                    }
                }
            }
        } else if(_.Element !== undefined) {
            if(_.Element && _.Element.ownerDocument) {
                if(_.Element.ownerDocument == document) {
                    DD.Element = _.Element;
                } else {
                    const Item = _.Element.ownerDocument.documentElement.Item;
                    if(Item && Item.IsLinearItem) {
                        DD.Item = Item;
                        if(_.Element != _.Element.ownerDocument.documentElement) {
                            DD.Element = _.Element;
                            if(Number.isInteger(_.TextNodeIndex)) DD.TextNodeIndex = _.TextNodeIndex;
                            if(typeof _.CharacterOffset == 'object' && _.CharacterOffset) DD.CharacterOffset = _.CharacterOffset;
                        }
                    }
                }
            }
        } else {
                 if( _.CFI !== undefined) _ = R.getCFIDestination(_.CFI)   || {};
            else if(   _.P !== undefined) _ = R.getPDestination(_.P)       || {};
            else if(_.IIPP !== undefined) _ = R.getIIPPDestination(_.IIPP) || {};
            if(_.Item === undefined) {
                if(_.ItemIndex !== undefined) {
                    if(Number.isInteger(_.ItemIndex)) _.Item = R.Items[_.ItemIndex];
                } else if(_.ItemIndexInSpine !== undefined) {
                    if(Number.isInteger(_.ItemIndexInSpine)) _.Item = B.Package.Spine[_.ItemIndexInSpine];
                } else if(_.ItemIndexInSpread !== undefined) {
                    if(Number.isInteger(_.ItemIndexInSpread)) {
                        const Spread = _.Spread !== undefined ? _.Spread : Number.isInteger(_.SpreadIndex) ? R.Spreads[_.SpreadIndex] : null;
                        if(Spread && Spread.IsSpread) _.Item = Spread.Items[_.ItemIndexInSpread];
                    }
                }
            }
            if(_.Item !== undefined) {
                if(_.Item && _.Item.IsLinearItem) {
                    DD.Item = _.Item;
                    if(_.ElementSelector !== undefined) {
                        if(_.ElementSelector && typeof _.ElementSelector == 'string') { try {
                            const Ele = _.Item.contentDocument.querySelector(_.ElementSelector);
                            if(Ele && Ele != Ele.ownerDocument.documentElement) {
                                DD.Element = Ele;
                                if(Number.isInteger(_.TextNodeIndex)) DD.TextNodeIndex = _.TextNodeIndex;
                                if(typeof _.CharacterOffset == 'object' && _.CharacterOffset) DD.CharacterOffset = _.CharacterOffset;
                            }
                        } catch(Err) {} }
                    } else if(_.ProgressInItem !== undefined) {
                        if(Number.isFinite(_.ProgressInItem) && 0 <= _.ProgressInItem && _.ProgressInItem <= 1) DD.ProgressInItem = _.ProgressInItem;
                    } else if(_.EdgeOfItem !== undefined) {
                             if(_.EdgeOfItem === 'head') DD.ProgressInItem = 0;
                        else if(_.EdgeOfItem === 'foot') DD.ProgressInItem = 1;
                    } else if(_.PageIndexInItem !== undefined) {
                        if(Number.isInteger(_.PageIndexInItem) && 0 <= _.PageIndexInItem) DD.PageIndexInItem = _.PageIndexInItem;
                    }
                }
            } else if(_.ItemIndex === undefined && _.ItemIndexInSpine === undefined && _.ItemIndexInSpread === undefined && _.ElementSelector === undefined && _.ProgressInItem === undefined && _.EdgeOfItem === undefined) {
                if(_.Spread === undefined) {
                    if(_.SpreadIndex !== undefined) {
                        if(Number.isInteger(_.SpreadIndex)) _.Spread = R.Spreads[_.SpreadIndex];
                    }
                }
                if(_.Spread !== undefined) {
                    if(_.Spread && _.Spread.IsSpread) {
                        DD.Spread = _.Spread;
                        if(_.ProgressInSpread !== undefined) {
                            if(Number.isFinite(_.ProgressInSpread) && 0 <= _.ProgressInSpread && _.ProgressInSpread <= 1) DD.ProgressInSpread = _.ProgressInSpread;
                        } else if(_.EdgeOfSpread !== undefined) {
                                 if(_.EdgeOfSpread === 'head') DD.ProgressInSpread = 0;
                            else if(_.EdgeOfSpread === 'foot') DD.ProgressInSpread = 1;
                        } else if(_.PageIndexInSpread !== undefined) {
                            if(Number.isInteger(_.PageIndexInSpread) && 0 <= _.PageIndexInSpread) DD.PageIndexInSpread = _.PageIndexInSpread;
                        }
                    }
                } else if(_.SpreadIndex === undefined && _.ProgressInSpread === undefined && _.EdgeOfSpread === undefined) {
                    if(_.Progress !== undefined) {
                        if(Number.isFinite(_.Progress) && 0 <= _.Progress && _.Progress <= 1) DD.Progress = _.Progress;
                    } else if(_.Edge !== undefined) {
                             if(_.Edge === 'head') DD.Progress = 0;
                        else if(_.Edge === 'foot') DD.Progress = 1;
                    } else if(_.PageIndex !== undefined) {
                        if(Number.isInteger(_.PageIndex) && 0 <= _.PageIndex && _.PageIndex < R.Pages.length) DD.PageIndex = _.PageIndex;
                    }
                }
            }
        }
    }
    const Page = !Object.keys(DD).length ? _.Page :
        DD.Range   ? R.getPageOfRangeHead(DD.Range) :
        DD.Element ? R.getPageOfElementHead(DD.Element) :
        DD.Item    ? (DD.ProgressInItem   !== undefined ? R.getPageOfProgressIn(DD.Item,   DD.ProgressInItem  ) : DD.PageIndexInItem   !== undefined ? R.getPageOfIndexIn(DD.Item,   DD.PageIndexInItem  ) :   DD.Item.Pages[0]) :
        DD.Spread  ? (DD.ProgressInSpread !== undefined ? R.getPageOfProgressIn(DD.Spread, DD.ProgressInSpread) : DD.PageIndexInSpread !== undefined ? R.getPageOfIndexIn(DD.Spread, DD.PageIndexInSpread) : DD.Spread.Pages[0]) :
                      DD.Progress         !== undefined ? R.getPageOfProgressIn(   R,      DD.Progress        ) : DD.PageIndex         !== undefined ? R.getPageOfIndexIn(   R,      DD.PageIndex        ) :         R.Pages[0]  ;
    if(Page && Page.IsPage) {
        DD.Page = Page;
        if(_.IsAutomark) DD.IsAutomark = true, DD.P = _.P;
        if(_.IsBookmark) DD.IsBookmark = true, DD.P = _.P;
        return DD;
    }
    return null;
};

    R.getPageOfRangeHead = (Ran) => {
        if(!Ran || !Ran.startContainer) return null;
        if(Ran.startContainer.ownerDocument == document) return R.Pages[0];
        return R.getPageOfRectHeadInItem(Ran.getBoundingClientRect(), Ran.startContainer.ownerDocument.documentElement.Item);
    };

    R.getPageOfElementHead = (Ele) => {
        if(!Ele || Ele.nodeType !== 1) return null;
        if(Ele.ownerDocument == document) return Ele.IsPage ? Ele : (Ele.IsLinearItem || Ele.IsSpread) ? Ele.Pages[0] : R.Pages[0];
        const ClientRects = Ele.getClientRects(), First = ClientRects[0];
        return First ? R.getPageOfRectHeadInItem(ClientRects.length == 1 ? First : First[C.L_SIZE_b] > parseFloat(getComputedStyle(Ele).fontSize) * 0.5 ? First : ClientRects[1], Ele.ownerDocument.documentElement.Item) : null;
    };

    R.getPageOfRectHeadInItem = (Rect, Item) => {
        const CoordInItem = Rect[C.L_BASE_b];
        return Item.Pages[Math.floor(Math.max(0, (S.SLD == 'rtl' ? Item.HTML.getBoundingClientRect()[C.L_SIZE_l] - CoordInItem : CoordInItem) / R.Stage[C.L_SIZE_L]))];
    };

    R.getPageOfProgressIn = (In, Progress) => In.Pages[ Progress > 0 ? Math.min(Math.floor(In.Pages.length * Progress), In.Pages.length - 1) : 0 ];
    R.getPageOfIndexIn    = (In, Index   ) => In.Pages[ Index    > 0 ? Math.min(Index,                                  In.Pages.length - 1) : 0 ];


R.getPage = (_, Opt) => {
    if(_ === undefined || _ === null) return ( R.Paginated ? I.PageObserver.Current.Pages : I.PageObserver.IntersectingPages.filter(ISP => R.Stage[C.L_SIZE_L] * I.PageObserver.getIntersectionStatus(ISP).Ratio > 3) )[0] || null;
    if(!Opt || !Opt.Distilled)        return                (_ = R.dest(_)) ?                                                                                                                                                        _.Page :  null;
    /**/                              return        _.Page && _.Page.IsPage ?                                                                                                                                                        _.Page :  null;
};


R.getElement = (_, Opt) => {
    let Page = null;
    if(!Opt || typeof Opt != 'object') Opt = {};
    if(_ === undefined || _ === null) {
        Page = R.getPage();
        Opt.InCurrentViewport = S.RVM == 'paged' ? false : true;
    } else {
        if(!Opt.Distilled) _ = R.dest(_);
        if(_) {
            if(_.Element                                   ) return _.Element;
            if(_.Item   && _.ProgressInItem   === undefined) return _.Item;
            if(_.Spread && _.ProgressInSpread === undefined) return _.Spread;
            Page = _.Page;
            Opt.InCurrentViewport = false;
        }
    }
    return R.getFirstElementOfPage(Page, Opt);
};

R.getFirstElementOfPage = (Page, Opt) => {
    if(!Page || !Page.IsPage) return null;
    if(Page.Item.PrePaginated) return Page.Item;
    if(!Page.ContentAreaInItem && Page.Item && (Page.Item.OnlySingleSVG || Page.Item.OnlySingleImg)) return R.renderPrePaginatedItem.getSingleMediaElement(Page.Item); // fitted single-media pages have no column areas; the picture itself is the first element
    const InCurrentViewport = S.RVM != 'paged' && Opt?.InCurrentViewport ? true : false;
    if(!InCurrentViewport && Page.FirstElement) return /*console.log('Without SCANNING:', `<${ Page.FirstElement.tagName }>${ Page.FirstElement.innerText.substring(0,8) }...`) ||*/ Page.FirstElement;
    const Item = Page.Item;
    const Ele = R.getFirstElementOfAreaInItem(Item, !InCurrentViewport ? Object.assign({}, Page.ContentAreaInItem) : (ItemCoord => {
        if(!Item.NoPadding) ItemCoord.X += Item.Padding.Left, ItemCoord.Y += Item.Padding.Top;
        return {
            Left: Math.max(Page.ContentAreaInItem.Left, R.Main.scrollLeft - ItemCoord.X, 0),  Right: Math.min(Page.ContentAreaInItem.Right,  R.Main.scrollLeft + R.Stage.Width  - ItemCoord.X, Item.HTML.offsetWidth ),
             Top: Math.max(Page.ContentAreaInItem.Top,  R.Main.scrollTop  - ItemCoord.Y, 0), Bottom: Math.min(Page.ContentAreaInItem.Bottom, R.Main.scrollTop  + R.Stage.Height - ItemCoord.Y, Item.HTML.offsetHeight)
        };
    })(O.getElementCoord(Item, R.Main)));
    if(!InCurrentViewport) Page.FirstElement = Ele;
    return Ele;
};

// R.getFirstElementOfViewport = (Vp, Opt) => { // useless...
//     const Page = R.getPage();
//     if(!Page || !Page.IsPage) return null;
//     if(B.PrePaginated) return Page.Item;
//     const Item = Page.Item;
//     const Ele = R.getFirstElementOfAreaInItem(Item, (ItemCoord => {
//         if(!Item.NoPadding) ItemCoord.X += Item.Padding.Left, ItemCoord.Y += Item.Padding.Top;
//         if(!Vp) Vp = {
//             Left: R.Main.scrollLeft, Right: R.Main.scrollLeft + R.Stage.Width,
//              Top: R.Main.scrollTop, Bottom: R.Main.scrollTop  + R.Stage.Height
//         };
//         return {
//             Left: Math.max(Vp.Left - ItemCoord.X, 0),  Right: Math.min(Vp.Right  - ItemCoord.X, Item.HTML.offsetWidth ),
//              Top: Math.max(Vp.Top  - ItemCoord.Y, 0), Bottom: Math.min(Vp.Bottom - ItemCoord.Y, Item.HTML.offsetHeight)
//         };
//     })(O.getElementCoord(Item, R.Main)));
//     return Ele;
// };

R.getFirstElementOfAreaInItem = (Item, TargetAreaInItem) => {
    if(Item.PrePaginated || Item.Source.External) return Item;
    // console.log('SCANNING...');
    TargetAreaInItem.Left += 2, TargetAreaInItem.Right  -= (1 + 2);
    TargetAreaInItem.Top  += 2, TargetAreaInItem.Bottom -= (1 + 2);
    const Vs = R.getFirstElementOfAreaInItem.Vars[Item.WritingMode], BD = Vs.BD, LD = Vs.LD, g = Vs.gEfPiI; // [D]irection, [F]rom, [T]o, [S]tep, [P]oint/[P]rogress
    const BF = TargetAreaInItem[Vs.BASE_S], BT = TargetAreaInItem[Vs.BASE_E];
    const BS = Math.abs(BT - BF) / 4, LS = parseFloat(getComputedStyle(Item.HTML).fontSize);
    const LF = TargetAreaInItem[Vs.BASE_B], LT = LF + Math.min(Math.abs(TargetAreaInItem[Vs.BASE_A] - LF), LS * 9) * LD;
    const Body = Item.Body;
    let Ele = Body, Found = false, SameElementCount = 0;
    const REs = R.getFirstElementOfAreaInItem.Testers.RegExps;
    // let Ct = 0; const z = (Dig, Num) => String(Num).padStart(Dig, '0');
    _L: for(let l = 0, LP = LF; LP * LD <= LT * LD; LP += LS * LD * (l < 2 ? 0.5 : 1), l++)
    _B: for(let b = 0, BP = BF; BP * BD <= BT * BD; BP += BS * BD * (l < 2 ? 0.5 : 1), b++) { let _Ele = g(Item, BP, LP);
        // console.log([
        //     `[${ z(3, ++Ct) }]`,
        //     `L[${ z(2, l) }]${ Vs.AXIS_L }:${ z(5, LP) }/${ z(5, LF) }-${ z(5, LT) }`,
        //     `B[${ z(2, b) }]${ Vs.AXIS_B }:${ z(5, BP) }/${ z(5, BF) }-${ z(5, BT) }`,
        //     `I[${ z(3, Item.Index) }] <${ _Ele.tagName }>${ _Ele.innerText.substring(0, 8) }...`
        // ].join(' - '));
        if(!Body.contains(_Ele) || _Ele == Body) continue; // break _B;
        if(l < 2) {                  Ele = _Ele;
                 if(         REs.RBTC.test(_Ele.tagName)) { Found = true; while((_Ele = _Ele.parentNode) != Body) if(REs.Ruby.test(_Ele.tagName)) { Ele = _Ele; break; } }
            else if(REs.GOOD_Rep_In_A.test(_Ele.tagName)) { Found = true; }
        } else if(_Ele != Ele) {     Ele = _Ele, SameElementCount = 0;
                 if(         REs.GOOD.test(_Ele.tagName)) { Found = true; }
            else if(         REs.RBTC.test(_Ele.tagName)) { Found = true; while((_Ele = _Ele.parentNode) != Body) if(REs.GOOD.test(_Ele.tagName)) { Ele = _Ele; break; } else if(REs.Ruby.test(_Ele.tagName)) Ele = _Ele; }
            else if(     REs.Rep_In_A.test(_Ele.tagName)) { Found = true; while((_Ele = _Ele.parentNode) != Body) if(REs.GOOD.test(_Ele.tagName)) { Ele = _Ele; break; } }
        } else if(++SameElementCount == 8) break _L;
        if(Found) break _L;
    }
    if(!Found) {
        // console.log('...(NOT FOUND)...', `<${ Ele.tagName }>${ Ele.innerText.substring(0,8) }...`);
        if(Ele == Body) Ele = Item;
        else {        let _Ele = Ele;
                   while((_Ele = _Ele.parentNode) != Body) if(REs.GOOD.test(_Ele.tagName)) { Found = true; Ele = _Ele; break; }
            if(!Found && (_Ele = Ele.querySelector(R.getFirstElementOfAreaInItem.Testers.Selectors.GOOD))) Ele = _Ele;
        }
    }
    // console.log('...SCANNED', (!Found ? 'Not ' : '') + 'Found', `<${ Ele.tagName }>${ Ele.innerText.substring(0,8) }...`);
    return Ele;
};

R.getFirstElementOfAreaInItem.Vars = { // gEfPiI: getElementFromPointInItem
    'lr-tb': { BASE_B: 'Top',   BASE_A: 'Bottom', BASE_S: 'Left',  BASE_E: 'Right',  AXIS_B: 'X', AXIS_L: 'Y', BD:  1, LD:  1, gEfPiI: (Item, BP, LP) => Item.contentDocument.elementFromPoint(BP, LP) },
    'rl-tb': { BASE_B: 'Top',   BASE_A: 'Bottom', BASE_S: 'Right', BASE_E: 'Left',   AXIS_B: 'X', AXIS_L: 'Y', BD: -1, LD:  1, gEfPiI: (Item, BP, LP) => Item.contentDocument.elementFromPoint(BP, LP) },
    'tb-rl': { BASE_B: 'Right', BASE_A: 'Left',   BASE_S: 'Top',   BASE_E: 'Bottom', AXIS_B: 'Y', AXIS_L: 'X', BD:  1, LD: -1, gEfPiI: (Item, BP, LP) => Item.contentDocument.elementFromPoint(LP, BP) },
    'tb-lr': { BASE_B: 'Left',  BASE_A: 'Right',  BASE_S: 'Top',   BASE_E: 'Bottom', AXIS_B: 'Y', AXIS_L: 'X', BD:  1, LD:  1, gEfPiI: (Item, BP, LP) => Item.contentDocument.elementFromPoint(LP, BP) }
};

R.getFirstElementOfAreaInItem.Testers = {
    Selectors: { GOOD: 'h1,h2,h3,h4,h5,h6,p,address,blockquote,li,dt,dd,th,td,figure' },
      RegExps: { GOOD:          /^(h[1-6]|p|address|blockquote|li|d[td]|t[hd]|figure)$/i,                RBTC: /^r[bt]c?$/i, Ruby: /^ruby$/i,
                 GOOD_Rep_In_A: /^(h[1-6]|p|address|blockquote|li|d[td]|t[hd]|figure|picture|img|svg|iframe|span|em|strong|small|b|i|ruby|a)$/i,
                      Rep_In_A:                                                   /^(picture|img|svg|iframe|span|em|strong|small|b|i|ruby|a)$/i }
};


R.getPageImageURL = (_, Opt) => new Promise((resolve, reject) => {
    const Page = R.getPage(_, Opt);
    if(!Page) return reject('');
    const Item = Page.Item;
    if(!Item.PrePaginated && !Item.Outsourcing) return reject('');
    resolve(Item.Loaded ? Item : L.loadItem(Item));
}).then(Item => {
    const resolvePath = (Ele, Att) => (SourcePath => B.ExtractionPolicy ? SourcePath : new URL(SourcePath, new URL(Item.Source.Path, B.Path.replace(/\/?$/, '/')).href).href)(Ele.getAttribute(Att));
    let Ele = null;
    if(Ele = Item.Body.querySelector('svg')) return new Promise((resolve, reject) => {
        Ele = sML.create('span', { innerHTML: Ele.outerHTML.replace(/xlink:href/g, 'data-href') }).firstChild;
        Ele.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        const ImageElements = Ele.querySelectorAll('image');
        const Promises = [];
        for(let l = ImageElements.length, i = 0; i < l; i++) { const ImageElement = ImageElements[i];
            const ImagePath = resolvePath(ImageElement, 'data-href');
            if(!ImagePath) return reject('');
            const MediaType = !B.ExtractionPolicy ? O.getMediaType(ImagePath) : (() => { const BPM = B.Package.Manifest; for(const _ in BPM) { if(BPM[_].URI == ImagePath) return BPM[_]['media-type']; } return ''; })();
            if(!MediaType) return reject('');
            ImageElement.removeAttribute('data-href');
            Promises.push(W.and('retlieve')(ImagePath, 'blob').then(Data => O.createDataURL('Blob', Data, MediaType)).then(DataURL => ImageElement.setAttribute('xlink:href', DataURL)));
        }
        Promise.all(Promises).then(() => O.createBlobURL('Text', `<?xml version="1.0" encoding="utf-8"?>\n` + Ele.outerHTML, 'image/svg+xml')).then(resolve);
    });
    if(Ele = Item.Body.querySelector('img')) return Promise.resolve(resolvePath(Ele, 'src'));
    return Promise.reject('');
});


R.getItemCopy = (_, Opt) => new Promise((resolve, reject) => {
    const Page = R.getPage(_, Opt);
    if(!Page) return reject(null);
    const Item = Page.Item;
    if(!Item.PrePaginated) return reject(null);
    resolve(Item.Loaded ? Item : L.loadItem(Item));
}).then(Item => {
    const ItemViewport = Item.Viewport || (SpineItemImage => SpineItemImage ? { Width: SpineItemImage.offsetWidth, Height: SpineItemImage.offsetHeight } : null)(Item.Body.querySelector('.bibi-spine-item-image'));
    if(!ItemViewport) return Promise.reject(null);
    const ItemCopy = Object.assign(sML.create('span', { innerHTML: Item.outerHTML }).firstChild, { className: 'item-copy', IsItemCopy: true, Original: Item, Viewport: ItemViewport });
    ItemCopy.removeAttribute('style');
    const VWidth = ItemViewport.Width, VHeight = ItemViewport.Height;
    ItemCopy.FittingIn = { Width: VWidth , Height: VHeight, Scale: 1 };
    sML.style(ItemCopy, { width: VWidth + 'px', height: VHeight + 'px', transform: 'scale(1)' });
    ItemCopy.resize = (Size) => { if(!Size || typeof Size != 'object') return false;
        let Width  = (Size.Width  !== undefined || Size.width  === undefined) ? Size.Width  : Size.width ; if(!Number.isFinite(Width ) || Width  <= 0) Width  = undefined;
        let Height = (Size.Height !== undefined || Size.height === undefined) ? Size.Height : Size.height; if(!Number.isFinite(Height) || Height <= 0) Height = undefined;
        if(!Width  && !Height) return false;
        if( Width  && !Height) Height = Width * VHeight/VWidth;
        if(!Width  &&  Height) Width = Height * VWidth/VHeight;
        Object.assign(ItemCopy.FittingIn, { Width: Width , Height: Height, Scale: Math.min(Width/VWidth, Height/VHeight, 1) });
        sML.style(ItemCopy, { transform: 'scale(' + ItemCopy.FittingIn.Scale + ')' });
        return ItemCopy;
    }
    return ItemCopy;
});

R.getItemCopyWithShell = (_, Opt) => R.getItemCopy(_, Opt).then(ItemCopy => {
    if(!ItemCopy) return Promise.reject(null);
    const ItemCopyShell = ItemCopy.Shell = sML.create('span', { className: 'item-copy-shell', ItemCopy: ItemCopy });
    ItemCopyShell.appendChild(ItemCopy);
    const ItemCopyVeil = ItemCopyShell.Veil = ItemCopyShell.appendChild(sML.create('span', { className: 'item-copy-shell-veil' }));
    sML.style(ItemCopyShell, { width: ItemCopy.Viewport.Width + 'px', height: ItemCopy.Viewport.Height + 'px' });
    ItemCopyShell.resize = (Size) => {
        if(!ItemCopy.resize(Size)) return false;
        sML.style(ItemCopyShell, { width: ItemCopy.FittingIn.Width + 'px', height: ItemCopy.FittingIn.Height + 'px' });
        return ItemCopyShell;
    };
    return ItemCopyShell;
});


R.getCFI = (_) => {
    _ = R.dest(_);
    const IsBody = _.Element && _.Element == _.Element.ownerDocument.body;
    const TheP = R.getP(_);
    if(!TheP) return '';
    const PSteps = TheP.split('.');
    const Paths = [['6', (R.Items[PSteps.shift() - 1].IndexInSpine + 1) * 2]];
    if(IsBody || PSteps.length) Paths.push(['4'].concat(PSteps.map(PStep => PStep * 2)));
    return Paths.map(Steps => Steps.map(Step => '/' + Step).join('')).join('!');
};

R.getCFIDestination = (CFI) => {
    const CFIStructure = O.CFIManager.parse(CFI);
    if(!CFIStructure) return null;
    let PathSteps = CFIStructure.Path.Steps;
    if(PathSteps.length < 2 || !PathSteps[1].Index || PathSteps[1].Index % 2 == 1) return null;
    const Dest = { ItemIndexInSpine: PathSteps[1].Index / 2 - 1 };
    if(PathSteps[2] && PathSteps[2].Steps) {
        const Steps = PathSteps[2].Steps;
        let ElementSelector = '';
        for(let l = Steps.length, i = 0; i < l; i++) { const Step = Steps[i];
            if(Step.Type == 'IndirectPath') { Dest.IndirectPath    = Step; break; }
            if(Step.Type == 'TermStep')     { Dest.CharacterOffset = Step; break; }
            if(Step.Index % 2 == 1)         { Dest.TextNodeIndex   = Step.Index - 1; if(i == Steps.length - 2 && Steps[i + 1].Type == 'TermStep') continue; else break; }
            if(Step.ID) ElementSelector = '#' + Step.ID;
            else        ElementSelector += '>*:nth-child(' + (Step.Index / 2) + ')';
        }
        if(ElementSelector) Dest.ElementSelector = ElementSelector.replace(/^>\*:nth-child\(2\)/, 'body');
    }
    return Dest;
};


R.getP = (_) => {
    let Ele = R.getElement(_);
    if(!Ele) return '';
    if(Ele.IsSpread) Ele = Ele.Items[0];
    if(Ele.IsItem) return String(Ele.Index + 1);
    const Item = Ele.ownerDocument.documentElement.Item;
    const Steps = [];
    while(Ele != Item.HTML && Ele != Item.Body) {
        let Nth = 0;
        sML.forEach(Ele.parentElement.childNodes)((CN, i) => {
            if(CN.nodeType != 1) return;
            Nth++;
            if(CN == Ele) {
                Steps.unshift(Nth);
                Ele = Ele.parentElement;
                return 'break';
            }
        });
    }
    Steps.unshift(Item.Index + 1);
    return Steps.join('.');
};

R.getPDestination = (TheP) => {
    TheP = Bibi.verifySettingValue('string', 'p', TheP);
    if(!TheP) return null;
    const Steps = TheP.split('.');
    const [FirstStep, Opt] = Steps.shift().split('-');
    if(FirstStep == 'head') return { Progress: 0 };
    if(FirstStep == 'foot') return { Progress: 1 };
    const Dest = { ItemIndex: FirstStep - 1 };
    if(Opt) {
        if(Opt == 'end') Dest.ProgressInItem = 1;
    } else {
        Dest.ElementSelector = `body`;
        Steps.forEach(Step => Dest.ElementSelector += `>*:nth-child(` + Step + `)`);
    }
    return Dest;
};

R.getPageStartsWithP = (TheP) => {
    TheP = Bibi.verifySettingValue('string', 'p', TheP);
    if(!TheP) return null;
    const Page = R.getPage({ P: TheP });
    if(!Page || typeof Page.Index != 'number') return null;
    if(R.getP({ Page: Page }) != TheP && R.getP({ Page: R.Pages[Page.Index + 1] }) == TheP) return R.Pages[Page.Index + 1];
    return Page;
};


R.getIIPP = (_) => {
    const Page = R.getPage(_);  if(!Page) return NaN;
    return Page.Item.Index + Page.IndexInItem / Page.Item.Pages.length;
};

R.getIIPPDestination = (IIPP) => {
    return Number.isFinite(IIPP) && 0 <= IIPP ? {
        ItemIndex: Math.floor(IIPP),
        ProgressInItem: IIPP % 1
    } : null;
};


R.getNavAnchors = () => {
    if(!Bibi.Opened) return null;
    const NavAnchors = [];
    sML.forEach(I.Panel.BookInfo.Navigation.querySelectorAll('*[href]'))(NavAnchor => {
        if(!NavAnchor.Destination.P) {
            const TheP = R.getP(NavAnchor.Destination);
            if(TheP) NavAnchor.Destination.P = TheP;
        }
        if(NavAnchor.Destination.P) NavAnchors.push(NavAnchor);
    });
    return NavAnchors;
};

R.getNearestNavItem = (_) => {
    let NavAnchors = R.getNavAnchors();
    if(!NavAnchors || !NavAnchors.length) return null;
    const TheP = R.getP(_);
    if(!TheP) return null;
    const ThePSteps = TheP.split('.');
    return NavAnchors.filter(NA => {
        const NA_PSteps = NA.Destination.P.split('.');
        for(let l = ThePSteps.length, i = 0; i < l; i++) {
            const ThePStep = ThePSteps[i] * 1 || 0,
                  NA_PStep = NA_PSteps[i] * 1 || 0;
            if(ThePStep < NA_PStep) return false;
        }
        return true;
    }).sort((ItemA, ItemB) => {
        const ItemAPSteps = ItemA.Destination.P.split('.'),
              ItemBPSteps = ItemB.Destination.P.split('.');
        for(let l = Math.max(ItemAPSteps.length, ItemBPSteps.length), i = 0; i < l; i++) {
            const ItemAPStep = ItemAPSteps[i] * 1 || 0,
                  ItemBPStep = ItemBPSteps[i] * 1 || 0;
            if(ItemAPStep < ItemBPStep             ) return -1;
            if(             ItemBPStep < ItemAPStep) return  1;
        }
        return 0;
    }).pop() || null;
};


// R.selectTextLocation = (_) => {
//     if(!_ || !Number.isInteger(_.TextNodeIndex) || !_.Element) return false;
//     const _Node = _.Element.childNodes[_.TextNodeIndex];
//     if(!_Node || !_Node.textContent) return;
//     const Sides = { Start: { Node: _Node, Index: 0 }, End: { Node: _Node, Index: _Node.textContent.length } };
//     if(_.CharacterOffset) {
//         if(_.CharacterOffset.Preceding || _.CharacterOffset.Following) {
//             Sides.Start.Index = _.CharacterOffset.Index, Sides.End.Index = _.CharacterOffset.Index;
//             if(_.CharacterOffset.Preceding) Sides.Start.Index -= _.CharacterOffset.Preceding.length;
//             if(_.CharacterOffset.Following)   Sides.End.Index += _.CharacterOffset.Following.length;
//             if(Sides.Start.Index < 0 || _Node.textContent.length < Sides.End.Index) return;
//             if(_Node.textContent.substring(Sides.Start.Index, Sides.End.Index) != _.CharacterOffset.Preceding + _.CharacterOffset.Following) return;
//         } else if(_.CharacterOffset.Side && _.CharacterOffset.Side == 'a') {
//             Sides.Start.Node = _Node.parentNode.firstChild; while(Sides.Start.Node.childNodes.length) Sides.Start.Node = Sides.Start.Node.firstChild;
//             Sides.End.Index = _.CharacterOffset.Index - 1;
//         } else {
//             Sides.Start.Index = _.CharacterOffset.Index;
//             Sides.End.Node = _Node.parentNode.lastChild; while(Sides.End.Node.childNodes.length) Sides.End.Node = Sides.End.Node.lastChild;
//             Sides.End.Index = Sides.End.Node.textContent.length;
//         }
//     }
//     return sML.Ranges.selectRange(sML.Ranges.getRange(Sides));
// };


R.scrollBy = (Dist, Par) => new Promise((resolve, reject) => {
    if(!Par || typeof Par != 'object') Par = {};
    if(Dist && Dist.Distance) {
        Object.assign(Par, Dist);
        Dist = Dist.Distance;
    }
    Dist *= 1;
    delete Par.Distance;
    if(!Dist || typeof Dist != 'number') return reject();
    E.dispatch('bibi:is-going-to:scroll-by', Dist);
    R.Moving = true;
    const ScrollTarget = { Frame: R.Main, X: 0, Y: 0 };
    switch(S.SLD) {
        case 'ttb': ScrollTarget.Y = R.Main.scrollTop  + R.Stage.Height * Dist     ; break;
        case 'ltr': ScrollTarget.X = R.Main.scrollLeft + R.Stage.Width  * Dist     ; break;
        case 'rtl': ScrollTarget.X = R.Main.scrollLeft + R.Stage.Width  * Dist * -1; break;
    }
    sML.scrollTo(ScrollTarget, {
        Duration: typeof Par.Duration == 'number' ? Par.Duration : (S.RVM != 'paged' && S.SLA == S.ARA) ? 100 : 0,
        ForceScroll: Par.Cancelable ? false : true,
        ease: typeof Par.ease == 'function' ? Par.ease : null
    }).then(() => {
        resolve({ P: R.getP() });
        E.dispatch('bibi:scrolled-by', Dist);
    }).catch(reject);
}).catch(() => {}).then(() => {
    R.Moving = false;
});


R.moveBy = (Dist, Par) => new Promise((resolve, reject) => {
    if(R.Moving || !L.Opened) return reject();
    if(!Par || typeof Par != 'object') Par = {};
    if(Dist && Dist.Distance) {
        Object.assign(Par, Dist);
        Dist = Dist.Distance;
    }
    Dist *= 1;
    delete Par.Distance;
    if(!Dist || typeof Dist != 'number') return reject();
    E.dispatch('bibi:is-going-to:move-by', Dist);
    const Current = (Dist > 0 ? I.PageObserver.Current.List.slice(-1) : I.PageObserver.Current.List)[0], CurrentPage = Current.Page, CurrentItem = CurrentPage.Item;
    let Promised = null;
    if(
        true /*||
        R.Paginated ||
        CurrentItem.PrePaginated ||
        CurrentItem.Outsourcing ||
        CurrentItem.Pages.length == 1 ||
        Dist < 0 && CurrentPage.IndexInItem == 0 ||
        Dist > 0 && CurrentPage.IndexInItem == CurrentItem.Pages.length - 1*/
    ) {
        let StrictDist = Dist, Side = Dist > 0 ? 'before' : 'after';
        if(Current.PageIntersectionStatus.Oversized) {
            if(Dist > 0) {
                     if(Current.PageIntersectionStatus.Entering) StrictDist = 0, Side = 'before';
                else if(Current.PageIntersectionStatus.Headed  ) StrictDist = 0, Side = 'after';
            } else {
                     if(Current.PageIntersectionStatus.Footed  ) StrictDist = 0, Side = 'before';
                else if(Current.PageIntersectionStatus.Passing ) StrictDist = 0, Side = 'before';
            }
        } else {
            if(Dist > 0) {
                if(Current.PageIntersectionStatus.Entering) StrictDist = 0, Side = 'before';
            } else {
                if(Current.PageIntersectionStatus.Passing ) StrictDist = 0, Side = 'before';
            }
        }
        let DestinationPageIndex = CurrentPage.Index + StrictDist;
             if(DestinationPageIndex <                  0) DestinationPageIndex = 0,                  Side = 'before';
        else if(DestinationPageIndex > R.Pages.length - 1) DestinationPageIndex = R.Pages.length - 1, Side = 'after';
        let DestinationPage = R.Pages[DestinationPageIndex];
        if(B.PrePaginated && DestinationPage.Item.SpreadPair) {
            if(S.SLA == 'horizontal' && R.Stage[C.L_SIZE_L] > DestinationPage.Spread['offset' + C.L_SIZE_L]) {
                if(StrictDist < 0 && DestinationPage.IndexInSpread == 0) DestinationPage = DestinationPage.Spread.Pages[1];
                if(StrictDist > 0 && DestinationPage.IndexInSpread == 1) DestinationPage = DestinationPage.Spread.Pages[0];
            }
        }
        Promised = R.focusOn({ Page: DestinationPage, Side: Side }, Par);
    } else {
        Promised = R.scrollBy(Dist, Par).then(() => ({ P: R.getP() }));
    }
    Promised.then(Dest => {
        resolve(Dest);
        E.dispatch('bibi:moved-by', Dist);
    }).catch(reject);
}).catch(() => {}).then(Dest => Dest);




