// Heart of Bibi — User Interfaces (split from bibi.heart.js; peers via shared context, no cycles)

import { Bibi, O, L, R, I, P, S, C, E, X } from './bibi.heart.context.mjs';
import { B } from './bibi.heart.book.mjs';

//==============================================================================================================================================
//----------------------------------------------------------------------------------------------------------------------------------------------

//-- User Interfaces

//----------------------------------------------------------------------------------------------------------------------------------------------




I.initialize = () => {
    I.Oven.create();
    I.Utilities.create();
    I.RangeFinder.create();
    I.TouchObserver.create();
    I.Notifier.create();
    I.Veil.create();
    E.bind('bibi:readied', () => {
        I.ScrollObserver.create();
        I.ResizeObserver.create();
        I.PageObserver.create();
        I.Turner.create();
        I.Catcher.create();
        I.Menu.create();
        I.Panel.create();
        I.Help.create();
        I.PoweredBy.create();
        I.Loupe.create();
    });
    E.bind('bibi:initialized-book', () => {
        I.TextSetter.create();
        I.BookmarkManager.create();
        I.Footnotes.create();
    });
    E.bind('bibi:prepared', () => {
        I.FlickObserver.create();
        I.WheelObserver.create();
        I.PinchObserver.create();
        I.KeyObserver.create();
        I.Tracer.create();
        I.Nombre.create();
        I.Slider.create();
        I.Flipper.create();
        I.Arrows.create();
        I.BuildStamp.create();
        I.AxisSwitcher.create();
        I.Spinner.create();
    });
};


I.Oven = { create: () => {
    const Oven = I.Oven = {
        Spirit: S['forget-me'] || !localStorage ? null : {
            getItem: (Key) => localStorage.getItem(Key),
            setItem: (Key, Value) => localStorage.setItem(Key, Value),
            removeItem: (Key) => localStorage.removeItem(Key)
        },
        Flame: false,
        realize: () => { if(S['forget-me'] || !Oven.Spirit) return;
            Oven.Flame = true;
            E.dispatch('bibi:realized-oven');
        },
        quench: () => {
            Oven.Flame = false;
            E.dispatch('bibi:quenched-oven');
        },
        // rememberMe: () => Oven.realize(),
        // forgetMeNot: () => Oven.rememberMe(),
        // forgetMe: () => Oven.quench(),
    };
    Oven.realize();
    const Biscuits = Oven.Biscuits = {
        Tags: ['****', 'Bibi', 'Book'],
        initialize: () => {
            delete Biscuits.initialize;
            // if(S['forget-me']) return;
            const LabelDelimiter = ' ', [BibiPath, PresetPath] = [Bibi.Script.src, P.Script.src].map(Src => (Loc => Loc.origin == O.Origin ? Loc.pathname : Loc.href.replace(/^[^:]+:\/\//, ''))(new URL(Src)));
            E.bind('bibi:processed-package-metadata', () => {
                Biscuits.Tin = Biscuits.Tags.reduce((Tin, Tag) => {
                    const LabelParts = []; switch(Tag) {
                        case 'Book': LabelParts.unshift([B.ID, S['allow-sugar-for-biscuits'] && S['sugar-for-biscuits']].filter(_ => _).join(LabelDelimiter));
                        case 'Bibi': LabelParts.unshift([BibiPath, PresetPath].join(LabelDelimiter));
                        default    : LabelParts.unshift('Bibi:Biscuit');
                    }
                    const Label = LabelParts.join(LabelDelimiter), Portion = Biscuits.parsePortion(Oven.Spirit?.getItem(Label));
                    Tin[Tag] = { Label: Label, Portion: Portion };
                    return Tin;
                }, {});
                E.dispatch('bibi:initialized-biscuits', Biscuits);
            });
        },
        parsePortion: (PortionJSON) => {
            let Portion = null; try { Portion = JSON.parse(PortionJSON); } catch(Err) {}
            if(!Portion || !Portion.Biscuit || !Portion.Stamp) Portion = { Biscuit: {}, Stamp: 0 };
            return Portion;
        },
        update: (Tag, Biscuit) => {
            if(!Oven.Flame || !Biscuits.Tags.includes(Tag)) return;
            Biscuits.Tin[Tag].Portion.Stamp = Date.now();
            return Biscuit && Object.keys(Biscuit).length ?
                (Biscuits.Tin[Tag].Portion.Biscuit = Biscuit) && Oven.Spirit.setItem(   Biscuits.Tin[Tag].Label, JSON.stringify(Biscuits.Tin[Tag].Portion)) :
                (Biscuits.Tin[Tag].Portion.Biscuit =      {}) && Oven.Spirit.removeItem(Biscuits.Tin[Tag].Label);
        },
        remember: (Tag, Key) => {
            if(!Oven.Flame || !Biscuits.Tags.includes(Tag)) return null;
            const Biscuit = Biscuits.Tin[Tag].Portion.Biscuit;
            return Key !== undefined ? Biscuit[Key] : Biscuit;
        },
        memorize: (Tag, KnV) => {
            if(!Oven.Flame || !Biscuits.Tags.includes(Tag)) return null;
            const Biscuit = Biscuits.Tin[Tag].Portion.Biscuit;
            if(KnV !== undefined) Object.keys(KnV).forEach(Key => { const Val = KnV[Key];
                try        { if(Val && typeof Val != 'function' && JSON.parse(JSON.stringify({ [Key]: Val }))[Key] !== undefined) Biscuit[Key] = Val; else throw ''; }
                catch(Err) { delete Biscuit[Key]; }
            });
            Biscuits.update(Tag, Biscuit);
            return Biscuit;
        },
        forget: (Tags, Keys) => {
            if(!Oven.Flame) return null;
            if(Tags === undefined) Biscuits.Tags.forEach(Tag => Biscuits.update(Tag));
            else (Array.isArray(Tags) ? Tags : [Tags]).forEach(Tag => {
                if(!Biscuits.Tags.includes(Tag)) return;
                if(Keys === undefined) Biscuits.update(Tag);
                else {
                    const Biscuit = Biscuits.Tin[Tag].Portion.Biscuit;
                    (Array.isArray(Keys) ? Keys : [Keys]).forEach(Key => delete Biscuit[Key]);
                    Biscuits.update(Tag, Biscuit);
                }
            });
            return Biscuits.Tin;
        }
    };
    Biscuits.initialize();
    E.dispatch('bibi:created-oven');
}};


I.Desk = {};


I.Utilities = { create: () => {
    const Utilities = I.Utilities = I.setToggleAction({
        Checkers: [],
        isAbleToBeToggled: () => !R.Moving && !R.Breaking && Utilities.Checkers.filter(checker => !(typeof checker == 'function' ? checker() : checker)).length == 0,
          openGracefuly: () => Utilities.isAbleToBeToggled() && Utilities.UIState != 'active'  && Utilities.open(),
         closeGracefuly: () => Utilities.isAbleToBeToggled() && Utilities.UIState != 'default' && Utilities.close(),
        toggleGracefuly: () => Utilities.isAbleToBeToggled()                                   && Utilities.toggle()
    }, {
        onopened: () => E.dispatch('bibi:opens-utilities'),
        onclosed: () => E.dispatch('bibi:closes-utilities')
    });
    E.add('bibi:commands:open-utilities',   () => I.Utilities.open());
    E.add('bibi:commands:close-utilities',  () => I.Utilities.close());
    E.add('bibi:commands:toggle-utilities', () => I.Utilities.toggleGracefuly());
}};


I.ScrollObserver = { create: () => {
    const ScrollObserver = I.ScrollObserver = {
        History: [],
        Scrolling: 0,
        onScroll: (Eve) => { if(R.LayingOut || !L.Opened) return;
            clearTimeout(R.Timer_onScrollEnd);
            if(!ScrollObserver.Scrolling) {
                O.HTML.classList.add('scrolling');
                E.dispatch('bibi:started-scrolling');
            } else {
                E.dispatch('bibi:keeps-scrolling');
            }
            E.dispatch('bibi:is-scrolling');
            if(++ScrollObserver.Scrolling == 33) {
                ScrollObserver.Scrolling = 1;
                E.dispatch('bibi:scrolled');
            }
            R.Timer_onScrollEnd = setTimeout(() => {
                ScrollObserver.Scrolling = 0;
                O.HTML.classList.remove('scrolling');
                E.dispatch('bibi:scrolled');
                E.dispatch('bibi:stopped-scrolling');
            }, 123);
            ScrollObserver.History.unshift(Math.ceil(R.Main['scroll' + C.L_OOBL_L])); // Android Chrome returns scrollLeft/Top value of an element with slightly less float than actual.
            if(ScrollObserver.History.length > 2) ScrollObserver.History.length = 2;
        },
        observe: () => {
            R.Main.addEventListener('scroll', ScrollObserver.onScroll);
        },
        breakCurrentScrolling: () => {
            try { R.Breaking = true; sML.Scroller.Scrolling.cancel(); setTimeout(() => R.Breaking = false, 333); } catch(Err) { R.Breaking = false; }
        },
        forceStopScrolling: () => {
            ScrollObserver.breakCurrentScrolling();
            R.Main.style.overflow = 'hidden', R.Main.scrollLeft = R.Main.scrollLeft, R.Main.scrollTop = R.Main.scrollTop, R.Main.style.overflow = '';
        }
    }
    E.bind('bibi:opened', ScrollObserver.observe);
    E.dispatch('bibi:created-scroll-observer');
}};


I.PageObserver = { create: () => {
    const PageObserver = I.PageObserver = {
        // ---- Intersection
        IntersectingPages: [],
        PagesToBeObserved: [],
        observePageIntersection: (Page) => !PageObserver.PagesToBeObserved.includes(Page) ? PageObserver.PagesToBeObserved.push(Page) : PageObserver.PagesToBeObserved.length,
        unobservePageIntersection: (Page) => (PageObserver.PagesToBeObserved = PageObserver.PagesToBeObserved.filter(PageToBeObserved => PageToBeObserved != Page)).length,
        observeIntersection: () => {
            const Glasses = new IntersectionObserver(Ents => Ents.forEach(Ent => {
                const Page = Ent.target;
                let IntersectionChanging = false;
                //const IntersectionRatio = Math.round(Ent.intersectionRatio * 10000) / 100;
                if(Ent.isIntersecting) {
                    if(!PageObserver.IntersectingPages.includes(Page)) {
                        IntersectionChanging = true;
                        PageObserver.IntersectingPages.push(Page);
                    }
                } else {
                    if( PageObserver.IntersectingPages.includes(Page)) {
                        IntersectionChanging = true;
                        PageObserver.IntersectingPages = PageObserver.IntersectingPages.filter(IntersectingPage => IntersectingPage != Page);
                    }
                }
                if(IntersectionChanging) {
                    if(PageObserver.IntersectingPages.length) PageObserver.IntersectingPages.sort((A, B) => A.Index - B.Index);
                    E.dispatch('bibi:changes-intersection', PageObserver.IntersectingPages);
                    clearTimeout(PageObserver.Timer_IntersectionChange);
                    PageObserver.Timer_IntersectionChange = setTimeout(() => {
                        E.dispatch('bibi:changed-intersection', PageObserver.IntersectingPages);
                    }, 9);
                }
            }), {
                root: R.Main,
                rootMargin: '0px',
                threshold: 0
            });
            PageObserver.observePageIntersection = (Page) => Glasses.observe(Page);
            PageObserver.unobservePageIntersection = (Page) => Glasses.unobserve(Page);
            PageObserver.PagesToBeObserved.forEach(PageToBeObserved => Glasses.observe(PageToBeObserved));
            delete PageObserver.PagesToBeObserved;
        },
        // ---- Current
        Current: { List: [], Pages: [], Frame: {} },
        updateCurrent: () => {
            const Current = PageObserver.Current;
            const Frame = PageObserver.getFrame();
            if(Frame) {
                Current.Frame = Frame;
                const List = PageObserver.getList();
                if(List) {
                    Current.List = List;
                    const Pages = Current.Pages = List.map(CE => CE.Page);
                    const Items = Current.Items = [...new Set(Pages.map(Page => Page.Item))];
                    const Spreads = Current.Spreads = [...new Set(Items.map(Item => Item.Spread))];
                    PageObserver.classify();
                }
            }
            return Current;
        },
        getFrame: () => {
            const Frame = {};
            Frame.Length = R.Main['offset' + C.L_SIZE_L];
            Frame[C.L_OOBL_L                              ] = Math.ceil(R.Main['scroll' + C.L_OOBL_L]); // Android Chrome returns scrollLeft/Top value of an element with slightly less float than actual.
            Frame[C.L_OOBL_L == 'Top' ? 'Bottom' : 'Right'] = Frame[C.L_OOBL_L] + Frame.Length;
            //if(PageObserver.Current.List.length && Frame[C.L_BASE_B] == PageObserver.Current.Frame.Before && Frame[C.L_BASE_A] == PageObserver.Current.Frame.After) return false;
            return { Before: Frame[C.L_BASE_B], After: Frame[C.L_BASE_A], Length: Frame.Length };
        },
        getCandidatePages: () => {
            const QSW = Math.ceil((R.Stage.Width - 1) / 4), QSH = Math.ceil((R.Stage.Height - 1) / 4), CheckRoute = [5, 6, 4, 2, 8]; // 4x4 matrix
            const CandidateParents = new Set();
            for(let l = CheckRoute.length, i = 0; i < l; i++) {
                const CheckPoint = CheckRoute[i], CPX = QSW * (CheckPoint % 3 || 3), CPY = QSH * Math.ceil(CheckPoint / 3); // console.log(CPX, CPY); ////////
                O.HTML.classList.add('searching-page');
                const Ele = document.elementFromPoint(CPX, CPY);
                O.HTML.classList.remove('searching-page');
                if(!Ele) continue;
                if(Ele.IsPage) return [Ele];
                CandidateParents.add(Ele);
            }
            if(CandidateParents.size) {
                const CandidateItems = new Set();
                CandidateParents.forEach(CandidateParent => {
                    if(CandidateParent.IndexInSpine) return CandidateItems.add(CandidateParent); // Item
                    if(CandidateParent.Items)        return CandidateParent.Items.forEach(Item => CandidateItems.add(Item)); // Spread
                    if(CandidateParent.Inside)       return CandidateParents.add(CandidateParent.Inside); // ItemBox or SpreadBox
                });
                if(CandidateItems.size) return [...CandidateItems].sort((_A, _B) => _A.Index - _B.Index).flatMap(Item => Item.Pages);
            }
            return PageObserver.IntersectingPages.length ? PageObserver.IntersectingPages : [];
        },
        getList: () => {
            let List = [], List_SpreadContained = [];
            const CandidatePages = PageObserver.getCandidatePages(); // console.log('a', CandidatePages.map(Page => Page.Index)); ////////
            if(!CandidatePages.length || typeof CandidatePages[0].Index != 'number') return null;
            const FirstIndex = sML.limitMin(CandidatePages[                        0].Index - 2,                  0);
            const  LastIndex = sML.limitMax(CandidatePages[CandidatePages.length - 1].Index + 2, R.Pages.length - 1);
            for(let BiggestPageIntersectionRatio = 0, i = FirstIndex; i <= LastIndex; i++) { const Page = R.Pages[i];
                const PageIntersectionStatus = PageObserver.getIntersectionStatus(Page, 'WithDetail');
                if(PageIntersectionStatus.Ratio < BiggestPageIntersectionRatio) {
                    if(List.length) break;
                } else {
                    const CurrentEntry = { Page: Page, PageIntersectionStatus: PageIntersectionStatus };
                    if(List.length) {
                        const Prev = List[List.length - 1];
                        if(Prev.Page.Item   == Page.Item  )   CurrentEntry.ItemIntersectionStatus =   Prev.ItemIntersectionStatus;
                        if(Prev.Page.Spread == Page.Spread) CurrentEntry.SpreadIntersectionStatus = Prev.SpreadIntersectionStatus;
                    }
                    if(  !CurrentEntry.ItemIntersectionStatus)   CurrentEntry.ItemIntersectionStatus = PageObserver.getIntersectionStatus(Page.Item.Box); // Item is scaled.
                    if(!CurrentEntry.SpreadIntersectionStatus) CurrentEntry.SpreadIntersectionStatus = PageObserver.getIntersectionStatus(Page.Spread);   // SpreadBox has margin.
                    if(CurrentEntry.SpreadIntersectionStatus.Ratio == 1) List_SpreadContained.push(CurrentEntry);
                         if(PageIntersectionStatus.Ratio > BiggestPageIntersectionRatio) List   = [CurrentEntry], BiggestPageIntersectionRatio = PageIntersectionStatus.Ratio;
                    else if(PageIntersectionStatus.Ratio)                                List.push(CurrentEntry);
                }
            } // console.log('b', List.map(Entry => Object.assign({}, Entry))); ////////
            return B.PrePaginated && List_SpreadContained.length ? List_SpreadContained : List.length ? List : null;
        },
        getIntersectionStatus: (Ele, WithDetail) => {
            const Coord = sML.getCoord(Ele), _D = C.L_AXIS_D;
            const LengthInside = Math.min(PageObserver.Current.Frame.After * _D, Coord[C.L_BASE_A] * _D) - Math.max(PageObserver.Current.Frame.Before * _D, Coord[C.L_BASE_B] * _D);
            const Ratio = (LengthInside <= 0 || !Coord[C.L_SIZE_L] || isNaN(LengthInside)) ? 0 : LengthInside / Coord[C.L_SIZE_L];
            const IntersectionStatus = { Ratio: Ratio };
            if(Ratio <= 0) {} else if(WithDetail) {
                if(Ratio >= 1 - 0.003) { // subpixel tolerance (~2px): fractional coords flap a full-bleed page between 0.9986 and 1, and non-Contained traps backward moves (StrictDist = 0 in moveBy)
                    IntersectionStatus.Contained = true;
                } else {
                    const FC_B = PageObserver.Current.Frame.Before * _D, FC_A = PageObserver.Current.Frame.After * _D;
                    const PC_B = Coord[C.L_BASE_B]                 * _D, PC_A = Coord[C.L_BASE_A]                * _D;
                         if(FC_B <  PC_B        ) IntersectionStatus.Entering = true;
                    else if(FC_B == PC_B        ) IntersectionStatus.Headed   = true;
                    else if(        PC_A == FC_A) IntersectionStatus.Footed   = true;
                    else if(        PC_A <  FC_A) IntersectionStatus.Passing  = true;
                    if(R.Main['offset' + L] < Coord[C.L_SIZE_L]) IntersectionStatus.Oversized = true;
                }
            }
            return IntersectionStatus;
        },
        classify: () => {
            const [Curr, Prev, Next] = ['current', 'prev-of-current', 'next-of-current'].map(CN => ({ ClassName: CN, PastElements: new Set(R.Main.Book.querySelectorAll('.' + CN)), NewElements: new Set() }));
            PageObserver.Current.Pages.forEach(Page => { const Item = Page.Item, Spread = Page.Spread;
                [                   Page,                     Item.Box,                       Spread.Box].forEach(Ele => Curr.NewElements.add(Ele));
                [R.Pages[Page.Index - 1], R.Items[Item.Index - 1]?.Box, R.Spreads[Spread.Index - 1]?.Box].forEach(Ele => Prev.NewElements.add(Ele));
                [R.Pages[Page.Index + 1], R.Items[Item.Index + 1]?.Box, R.Spreads[Spread.Index + 1]?.Box].forEach(Ele => Next.NewElements.add(Ele));
            });
            Curr.NewElements.forEach(Ele => Ele.classList.add(Curr.ClassName));
            [Prev, Next].forEach(PN => PN.NewElements.forEach(Ele => Ele && !Curr.NewElements.has(Ele) ? Ele.classList.add(PN.ClassName) : PN.NewElements.delete(Ele)));
            [Curr, Prev, Next].forEach(CPN => CPN.PastElements.forEach(Ele => CPN.NewElements.has(Ele) || Ele.classList.remove(CPN.ClassName)));
        },
        observeCurrent: () => {
            E.bind(['bibi:changed-intersection', 'bibi:scrolled'], PageObserver.updateCurrent);
        },
        // ---- PageChange
        Past:    { List: [{ Page: null, PageIntersectionStatus: null }] },
        observePageMove: () => {
            E.bind('bibi:scrolled', () => {
                const CS = PageObserver.Current.List[0], CE = PageObserver.Current.List.slice(-1)[0]; if(!CS || !CE) return; // a scroll can land while Current is empty (pages being rebuilt after a donation/relayout): reading .Page off undefined threw TypeError
                const PS =    PageObserver.Past.List[0], PE =    PageObserver.Past.List.slice(-1)[0], PSP = PS.Page, PEP = PE.Page;
                const FPI = 0, LPI = R.Pages.length - 1;
                let Flipped = false, AtTheBeginning = false, AtTheEnd = false;
                if(CSP != PSP || CEP != PEP) {
                    Flipped = true;
                    if(CSP.Index == FPI && (CSPIS.Contained || CSPIS.Headed)) AtTheBeginning = true;
                    if(CEP.Index == LPI && (CEPIS.Contained || CEPIS.Footed)) AtTheEnd       = true;
                } else {
                    const PSPIS = PS.PageIntersectionStatus, PEPIS = PE.PageIntersectionStatus
                    if(CSP.Index == FPI && (CSPIS.Contained || CSPIS.Headed) && !(PSPIS.Contained || PSPIS.Headed)) AtTheBeginning = true;
                    if(CEP.Index == LPI && (CEPIS.Contained || CEPIS.Footed) && !(PEPIS.Contained || PEPIS.Footed)) AtTheEnd       = true;
                }
                const ReturnValue = { Past: PageObserver.Past, Current: PageObserver.Current };
                if(Flipped       ) E.dispatch('bibi:flipped',              ReturnValue);
                if(AtTheBeginning) E.dispatch('bibi:got-to-the-beginning', ReturnValue);
                if(AtTheEnd      ) E.dispatch('bibi:got-to-the-end',       ReturnValue);
                Object.assign(PageObserver.Past, PageObserver.Current);
            });
        },
        automark: () => { try {
            I.Oven.Biscuits.memorize('Book', { Automarks: [{ IsAutomark: true, P: R.getP() }] });
        } catch(Err) {} }
    };
    E.bind('bibi:laid-out-for-the-first-time', LayoutOption => {
        PageObserver.IntersectingPages = R.Items[LayoutOption.TargetItemIndex].Pages.concat(); // copy
        PageObserver.observeIntersection();
    });
    E.bind('bibi:initialized-biscuits', () => {
        if(R.StartOn || !S['resume-from-last-position']) return;
        const Automarks = I.Oven.Biscuits.remember('Book', 'Automarks');
        if(Array.isArray(Automarks) && Automarks[0]?.P) R.StartOn = Object.assign({}, I.Oven.Biscuits.remember('Book').Automarks[0]);
    });
    E.bind('bibi:opened', () => {
        PageObserver.updateCurrent();
        PageObserver.observeCurrent();
        PageObserver.observePageMove();
    });
    if(S['resume-from-last-position']) E.bind('bibi:started', () => {
        E.bind('bibi:realized-oven', () => PageObserver.automark());
        E.add('bibi:stopped-scrolling', () => {
            // clearTimeout(PageObserver.Timer_automarkOnScrolled);
            // PageObserver.Timer_automarkOnScrolled = setTimeout(() => PageObserver.automark(), 99);
            PageObserver.automark();
        });
        // Paged flips, slider/bookmark/history/search jumps funnel through focusOn/scrollBy,
        // which never touch native scroll: persist those completions too. P only, no %:
        // percentages depend on viewport/pagination and would go stale across screens.
        E.add(['bibi:focused-on', 'bibi:scrolled-by'], () => PageObserver.automark());
    });
    E.dispatch('bibi:created-page-observer');
}};


I.Turner = { create: () => {
    const Turner = I.Turner = {
        // TurningOrders: [], PastTurningOrdersString: '', ItemsNowTurning: [], TurningProcessID: '',
        getTurningOriginItem: (Dir = 1) => {
            const List = I.PageObserver.Current.List?.length ? I.PageObserver.Current.List : I.PageObserver.IntersectingPages?.length ? I.PageObserver.IntersectingPages : null;
            return List?.[Dir > 0 ? 0 : List.length - 1]?.Page?.Item || null;
        },
        filterOrders: (Orders) => Orders.filter(Items => Items && (Items = Items.filter(Item => Item?.Turned != 'Up')).length),
        stringifyOrders: (Orders) => Orders.map(Items => Items ? Items.map(Item => Item ? Item.Index : '').join('+') : '').join('-'),
        turnItems: (Opt = {}) => {
            if(R.DoNotTurn || !S['allow-placeholders']) return;
            const Dir = (I.ScrollObserver.History.length > 1) && (I.ScrollObserver.History[1] * C.L_AXIS_D > I.ScrollObserver.History[0] * C.L_AXIS_D) ? -1 : 1;
            const OItem = Opt.Origin || Turner.getTurningOriginItem(Dir); if(!OItem) return;
            let NewOrders = [];
            if(R.Orientation == 'landscape') {
                const i = OItem.Spread.Index;
                // [0, Dir, Dir * -1, 2].forEach(Distance => { const Spread = R.Spreads[i + Distance]; if(Spread) Spread.Items.forEach(Item => NewOrders.push([Item])); }); // one by one
                [0, Dir, Dir * -1, 2].forEach(Distance => { const Spread = R.Spreads[i + Distance]; if(Spread) NewOrders.push([...Spread.Items]); });
            } else {
                NewOrders.push([OItem]);
                const PItem = OItem.SpreadPair; if(PItem) NewOrders.push([PItem]);
                const i = OItem.Index; 
                [Dir, Dir * -1].forEach(Distance => { const Item = R.Items[i + Distance]; if(Item && Item != PItem) NewOrders.push([Item]); });
                [2,          3].forEach(Distance => { const Item = R.Items[i + Distance]; if(Item                 ) NewOrders.push([Item]); });
            }
            NewOrders = Turner.filterOrders(NewOrders);
            const NewOrdersString = Turner.stringifyOrders(NewOrders);
            if(!NewOrders.length || NewOrdersString === Turner.PastTurningOrdersString) return;
            const ProcessID = Turner.TurningProcessID = O.id(); //// Set after ^
            /* ==== */ O.log('I.Turner.turnItems > NewOrders:', NewOrders.map(Items => Items.map(Item => Item.Index).join(',')));
            Turner.TurningOrders = NewOrders, Turner.PastTurningOrdersString = NewOrdersString;
            if(Turner.ItemsNowTurning) Turner.ItemsNowTurning.forEach(Item => !Turner.TurningOrders[0].includes(Item) && Turner.turnItem(Item, false));
            (function turn() {
                const Items = Turner.ItemsNowTurning = Turner.TurningOrders.shift();
                // if(Items) Promise.all(Items.map((Item, i) => new Promise(resolve => setTimeout(() => Turner.turnItem(Item, true).finally(resolve), 69 * i)))).then(() => ProcessID == Turner.TurningProcessID && turn()); // delay in spread
                if(Items) Promise.all(Items.map(Item => Turner.turnItem(Item, true))).then(() => ProcessID == Turner.TurningProcessID && turn());
            })();
        },
        turnItem: async (Item, Up) => {
            if(R.DoNotTurn || !S['allow-placeholders'] || !Item || Item.TurningUp === (Up = !!Up)) return;
            Item.TurningUp = Up;
            const ProcessID = Item.TurningProcessID = O.id();
            await Promise.resolve(Item.Turning);
            return Item.Turning = Promise.resolve().then(() => {
                if(Up || !O.RangeLoader) return;
                O.log('I.Turner.turnItem > cancel:', Item.Index);
                return O.cancelExtraction(Item.Source);
            }).then(() => O.chain({ assure: () => ProcessID == Item.TurningProcessID, Label: 'I.Turner.turnItem' },
                () => L.loadItem(Item, { AllowPlaceholder: !Up }),
                () => R.layOutItem(Item),
                () => R.layOutSpread(Item.Spread, { Makeover: true })
            )).catch(() => {}).then(() => {
                delete Item.TurningUp;
                return Item;
            });
        },
        rerotateItem: (Item) => O.chain(
            () => Turner.turnItem(Item, false),
            () => Turner.turnItem(Item, true)
        )
    };
    E.bind('bibi:started', () => E.add('bibi:scrolled', () => Turner.turnItems()));
    E.dispatch('bibi:created-turner');
}};


I.ResizeObserver = { create: () => {
    const ResizeObserver = I.ResizeObserver = {
        Resizing: false,
        TargetPageAfterResizing: null,
        onResize: (Eve) => { if(R.LayingOut || !L.Opened) return;
            if(!ResizeObserver.Resizing) {
                ResizeObserver.TargetAfterResizing = R.getElement();
                ResizeObserver.onResizeStart(Eve);
            };
            clearTimeout(ResizeObserver.Timer_onResizeEnd);
            ResizeObserver.Timer_onResizeEnd = setTimeout(() => {
                R.layOutBook({
                    Reset: true,
                    Destination: ResizeObserver.TargetAfterResizing
                }).then(() => {
                    ResizeObserver.onResizeEnd(Eve);
                    ResizeObserver.Resizing = false;
                    ResizeObserver.TargetAfterResizing = null;
                });
            }, O.TouchOS ? 999 : 333);
        },
        onResizeStart: (Eve) => {
            E.dispatch('bibi:is-going-to:resize', Eve);
            ResizeObserver.Resizing = true;
            //////// R.Main.removeEventListener('scroll', I.ScrollObserver.onScroll);
            O.Busy = true;
            O.HTML.classList.add('busy');
            O.HTML.classList.add('resizing');
        },
        onResizeEnd: (Eve) => {
            E.dispatch('bibi:resized', Eve);
            O.HTML.classList.remove('resizing');
            O.HTML.classList.remove('busy');
            O.Busy = false;
            //////// R.Main.addEventListener('scroll', I.ScrollObserver.onScroll);
            // I.ScrollObserver.onScroll();
        },
        addEventListener: (fn) => {
            screen.orientation?.addEventListener ? screen.orientation.addEventListener('change', fn) : window.addEventListener('orientationchange', fn);
            window.addEventListener('resize', fn);
        }
    };
    E.bind('bibi:opened', () => ResizeObserver.addEventListener(ResizeObserver.onResize));
    E.dispatch('bibi:created-resize-observer');
}};


I.TouchObserver = { create: () => {
    const TimeLimit = { D2U: 300, U2D: 300 };
    const TouchObserver = I.TouchObserver = {
        observeElementHover: (Ele) => {
            if(!Ele.BibiHoverObserver) {
                Ele.BibiHoverObserver = {
                    onHover:   (Eve) => E.dispatch(Ele, 'bibi:hovered', Eve),
                    onUnHover: (Eve) => E.dispatch(Ele, 'bibi:unhovered', Eve)
                };
                Ele.addEventListener(E['pointerover'], Eve => Ele.BibiHoverObserver.onHover(Eve));
                Ele.addEventListener(E['pointerout'],  Eve => Ele.BibiHoverObserver.onUnHover(Eve));
            }
            return Ele;
        },
        setElementHoverActions: (Ele) => {
            E.add(Ele, 'bibi:hovered', Eve => { if(Ele.Hover || (Ele.isAvailable && !Ele.isAvailable(Eve))) return Ele;
                Ele.Hover = true;
                Ele.classList.add('hover');
                if(Ele.showHelp) Ele.showHelp();
                return Ele;
            });
            E.add(Ele, 'bibi:unhovered', Eve => { if(!Ele.Hover) return Ele;
                Ele.Hover = false;
                Ele.classList.remove('hover');
                if(Ele.hideHelp) Ele.hideHelp();
                return Ele;
            });
            return Ele;
        },
        observeElementTap: (Ele, Opt = {}) => {
            if(!Ele.BibiTapObserver) {
                Ele.addEventListener(E['pointerdown'], Eve => Ele.BibiTapObserver.onPointerDown(E.aBCD(Eve)));
                Ele.addEventListener(E['pointerup'],   Eve => Ele.BibiTapObserver.onPointerUp(  E.aBCD(Eve)));
                Ele.BibiTapObserver = {
                    Staccato: 0,
                    staccato: function(fn) {
                        clearTimeout(this.Timer_Staccato);
                        fn(++this.Staccato);
                        this.Timer_Staccato = setTimeout(() => this.Staccato = 0, TimeLimit.U2D);
                    },
                    care: Opt.PreventDefault ? (Opt.StopPropagation ? _ => _.preventDefault() || _.stopPropagation() : _ => _.preventDefault()) : (Opt.StopPropagation ? _ => _.stopPropagation() : () => {}),
                    onPointerDown: function(BibiEvent) {
                        if((typeof BibiEvent.buttons == 'number' && BibiEvent.buttons !== 1) || BibiEvent.ctrlKey) return;
                        this.care(BibiEvent);
                        clearTimeout(this.Timer_fireTap);
                        this.TapLandingBibiEvent = Object.assign(BibiEvent, { IsTapLandingBibiEvent: true });
                        if(!this.TapFloatingBibiEvent) return;
                        if((BibiEvent.timeStamp - this.TapFloatingBibiEvent.timeStamp) < TimeLimit.U2D) {
                            this.TapFloatingBibiEvent.TapLandingBibiEvent.preventDefault();
                            this.TapFloatingBibiEvent.preventDefault();
                            BibiEvent.preventDefault();
                        } else {
                            delete this.TapFloatingBibiEvent;
                        }
                    },
                    onPointerUp: function(BibiEvent) {
                        this.care(BibiEvent);
                        if(!this.TapLandingBibiEvent) return;
                        if((BibiEvent.timeStamp - this.TapLandingBibiEvent.timeStamp) < TimeLimit.D2U) {
                            if(Math.abs(BibiEvent.Coord.X - this.TapLandingBibiEvent.Coord.X) < 3 && Math.abs(BibiEvent.Coord.Y - this.TapLandingBibiEvent.Coord.Y) < 3) {
                                const TapAccumulation = !this.TapFloatingBibiEvent ? [] : [...this.TapFloatingBibiEvent.TapAccumulation];
                                TapAccumulation.push(this.TapFloatingBibiEvent = this.TapLandingBibiEvent.TapFloatingBibiEvent = Object.assign(BibiEvent, {
                                    IsTapFloatingBibiEvent: true,
                                    TapLandingBibiEvent: this.TapLandingBibiEvent,
                                    TapAccumulation: TapAccumulation
                                }));
                                this.onTap(this.TapFloatingBibiEvent, 'IsStaccato');
                                const fire = () => {
                                    if(this.TapFloatingBibiEvent) this.onTap(this.TapFloatingBibiEvent);
                                    delete this.TapFloatingBibiEvent;
                                };
                                if(S['recognize-repeated-taps-separately']) fire(); else this.Timer_fireTap = setTimeout(fire, TimeLimit.U2D);
                            } else {
                                delete this.TapFloatingBibiEvent;
                            }
                        }
                        delete this.TapLandingBibiEvent;
                    },
                    onTap: function(BibiEvent, IsStaccato) {
                        if(IsStaccato) {
                            this.staccato(Sta => Object.assign(BibiEvent, { IsTapBibiEvent: true, Staccato: Sta }));
                            E.dispatch(Ele, 'bibi:tapped' + (!BibiEvent.altKey ? '' : '-with-altkey'), BibiEvent); // 'bibi:tapped', 'bibi:tapped-with-altkey'
                            return;
                        }
                        if(!BibiEvent || !Array.isArray(BibiEvent.TapAccumulation) || BibiEvent.TapAccumulation.length == 0 || BibiEvent.TapAccumulation.length > 3) return;
                        let EventName = '';
                        switch(BibiEvent.TapAccumulation.length) {
                            case 1: EventName = 'bibi:singletapped'; BibiEvent.IsSingleTapBibiEvent = true; delete BibiEvent.IsTapBibiEvent; break;
                            case 2: EventName = 'bibi:doubletapped'; BibiEvent.IsDoubleTapBibiEvent = true;                                  break;
                            case 3: EventName = 'bibi:tripletapped'; BibiEvent.IsTripleTapBibiEvent = true;                                  break;
                        }
                        if(BibiEvent.altKey) EventName += '-with-altkey'; // 'bibi:singletapped-with-altkey', 'bibi:doubletapped-with-altkey', 'bibi:tripletapped-with-altkey'
                        E.dispatch(Ele, EventName, Object.assign(BibiEvent, { RangeOfSelection: BibiEvent.TapAccumulation[0].TapLandingBibiEvent.RangeOfSelection }));
                    }
                };
            }
            return Ele;
        },
        setElementTapActions: (Ele) => {
            const onTap = (() => { switch(Ele.Type) {
                case 'toggle': return () => { if(Ele.UIState == 'disabled') return false;
                    I.setUIState(Ele, Ele.UIState == 'default' ? 'active' : 'default');
                };
                case 'radio': return () => { if(Ele.UIState == 'disabled') return false;
                    Ele.ButtonGroup.Buttons.forEach(Button => { if(Button != Ele) I.setUIState(Button, ''); });
                    I.setUIState(Ele, 'active');
                };
                default: return () => { if(Ele.UIState == 'disabled') return false;
                    I.setUIState(Ele, 'active');
                    clearTimeout(Ele.Timer_deactivate);
                    Ele.Timer_deactivate = setTimeout(() => I.setUIState(Ele, Ele.UIState == 'disabled' ? 'disabled' : ''), 200);
                };
            } })();
            E.add(Ele, 'bibi:singletapped', BibiEvent => { if((Ele.isAvailable && !Ele.isAvailable(BibiEvent)) || (Ele.UIState == 'disabled') || (Ele.UIState == 'active' && Ele.Type == 'radio')) return Ele;
                onTap();
                if(Ele.hideHelp) Ele.hideHelp();
                if(Ele.notify) setTimeout(Ele.notify, 0);
                return Ele;
            });
            return Ele;
        },
        PointerEventNames: O.TouchOS ? [['touchstart', 'mousedown'], ['touchend', 'mouseup'], ['touchmove', 'mousemove']] : document.onpointermove !== undefined ? ['pointerdown', 'pointerup', 'pointermove'] : ['mousedown', 'mouseup', 'mousemove'],
        PreviousPointerCoord: { X: 0, Y: 0 },
        activateHTML: (HTML) => {
            TouchObserver.observeElementTap(HTML);
            [      'bibi:tapped',       'bibi:tapped-with-altkey',
             'bibi:singletapped', 'bibi:singletapped-with-altkey',
             'bibi:doubletapped', 'bibi:doubletapped-with-altkey',
             'bibi:tripletapped', 'bibi:tripletapped-with-altkey'].forEach(TapEventName => E.add(HTML, TapEventName, BibiEvent => E.dispatch(TapEventName, BibiEvent)));
            const TOPENs = TouchObserver.PointerEventNames;
            E.add(HTML, TOPENs[0], Eve => E.dispatch('bibi:downed-pointer', E.aBCD(Eve)), E.CPO_100);
            E.add(HTML, TOPENs[1], Eve => E.dispatch( 'bibi:upped-pointer', E.aBCD(Eve)), E.CPO_100);
            if(!O.Touch) {
                E.add(HTML, 'mousedown', Eve => { clearTimeout(TouchObserver.Timer_ReleaseMousePressing);                  O.HTML.classList.add(   'mouse-pressing');     }, E.CPO_100);
                E.add(HTML, 'mouseup',   Eve => {              TouchObserver.Timer_ReleaseMousePressing = setTimeout(() => O.HTML.classList.remove('mouse-pressing'), 9); }, E.CPO_100);
            }
            E.add(HTML, TOPENs[2], Eve => {
                const BibiEvent = E.aBCD(Eve);
                const CC = BibiEvent.Coord, PC = TouchObserver.PreviousPointerCoord;
                E.dispatch((PC.X != CC.X || PC.Y != CC.Y) ? 'bibi:moved-pointer' : 'bibi:stopped-pointer', BibiEvent);
                TouchObserver.PreviousPointerCoord = CC;
                //Eve.preventDefault();
                Eve.stopPropagation();
            }, E.CPO_100);
        }
    }
    E.bind('bibi:readied',            (    ) => TouchObserver.activateHTML(   O.HTML));
    E.bind('bibi:postprocessed-item', (Item) => TouchObserver.activateHTML(Item.HTML));
    E.dispatch('bibi:created-touch-observer');
}};


I.FlickObserver = { create: () => {
    const FlickObserver = I.FlickObserver = {
        getPassage: (From, To) => ({ X: To.X - From.X, Y: To.Y - From.Y }),
        getDistance: (From, To) => { const { X, Y } = FlickObserver.getPassage(From, To); return Math.sqrt(X ** 2 + Y ** 2); },
        getProgress: (From, To) => FlickObserver.getDistance(From, To) / Math.min(128, R.Stage.Width * 0.333, R.Stage.Height * 0.333),
        getDegree: (From, To) => { const { X, Y } = FlickObserver.getPassage(From, To); return (Math.atan2(X, Y * -1) * 180 / Math.PI + 360) % 360; }, // N:0, E:90, S:180, W:270. Swap X/Y of the arguments for Math.atan2 to match the clock face.
        getDividedDirectionIndex: (From, To, Div) => Math.floor(FlickObserver.getDegree(From, To) / (360 / Div) + 0.5) % Div,
        // getClockDirection: (From, To) => FlickObserver.getDividedDirectionIndex(From, To, 12) || 12,
        // getAzimuthDirection: (From, To, Div = 16) => { switch(FlickObserver.getDividedDirectionIndex(From, To, Div) * (16 / Div)) { // Div: 4 or 8 or 16.
        //               /* ////////// */ case  0: return 'N';
        //           case 15: return 'NNW'; case  1: return 'NNE';
        //        case 14: return 'NW';        case  2: return  'NE';
        //      case 13: return 'WNW';           case  3: return 'ENE';
        //     case 12: return 'W';               case  4: return   'E';
        //      case 11: return 'WSW';           case  5: return 'ESE';
        //        case 10: return 'SW';        case  6: return  'SE';
        //           case  9: return 'SSW'; case  7: return 'SSE';
        //               case  8: return 'S'; /* ////////// */
        // }},
        MovementPrototype: ['getPassage', 'getProgress', 'getDistance', 'getDegree'].reduce(
            (Mv, FN) => (Mv[FN] = function(BibiEvent, ...Args) { return FlickObserver[FN](this.Started.BibiEvent.Coord, BibiEvent.Coord, ...Args); }) && Mv, {
            getVector: function(BibiEvent) {
                let DDI = FlickObserver.getDividedDirectionIndex(this.Started.BibiEvent.Coord, BibiEvent.Coord, 8);
                switch(DDI) {
                    case 1: case 5: C.A_AXIS_L == 'X' ? DDI++ : DDI--; break;
                    case 3: case 7: C.A_AXIS_L == 'X' ? DDI-- : DDI++; break;
                }
                switch(DDI % 8) {
                    case 0: return { Axis: 'Y', Direction: { From: 'bottom'/*, To: 'top'*/ } };
                    case 2: return { Axis: 'X', Direction: { From: 'left'/*, To: 'right'*/ } };
                    case 4: return { Axis: 'Y', Direction: { From: 'top'/*, To: 'bottom'*/ } };
                    case 6: return { Axis: 'X', Direction: { From: 'right'/*, To: 'left'*/ } };
                }
            }
        }),
        getMovement: (BibiEvent) => Object.assign({}, FlickObserver.MovementPrototype, {
            Started: {
                BibiEvent: BibiEvent,
                TimeStamp: BibiEvent.timeStamp,
                Item: BibiEvent.target.ownerDocument.body.Item || null,
                ScrollLeft: R.Main.scrollLeft,
                ScrollTop: R.Main.scrollTop,
                OriginList: I.PageObserver.updateCurrent().List
            },
            Last: {
                BibiEvent: null
            },
            Moving: 0,
            AxisSwitcherReadied: I.AxisSwitcher && I.orthogonal('touchmove') == 'switch' && I.Loupe.CurrentTransformation.Scale == 1
        }),
        isInSafeAreas: (BibiEvent) => {
            for(let i = 0; i < 4; i++) { const SafeArea = S['touchmove-ignoring-area'][i]; if(!SafeArea) continue; switch(i) {
                case 0: if(BibiEvent.Coord.Y <                  (SafeArea < 1 ? R.Stage.Height * SafeArea : SafeArea)) return true; break;
                case 1: if(BibiEvent.Coord.X > R.Stage.Width  - (SafeArea < 1 ? R.Stage.Width  * SafeArea : SafeArea)) return true; break;
                case 2: if(BibiEvent.Coord.Y > R.Stage.Height - (SafeArea < 1 ? R.Stage.Height * SafeArea : SafeArea)) return true; break;
                case 3: if(BibiEvent.Coord.X <                  (SafeArea < 1 ? R.Stage.Width  * SafeArea : SafeArea)) return true; break;
            }} return false;
        },
        onTouchStart: (BibiEvent) => {
            if(!L.Opened) return;
            //if(S.RVM != 'paged' && O.TouchOS) return;
            if(BibiEvent.touches && BibiEvent.touches.length != 1) return;
            if(FlickObserver.Movement?.Last.BibiEvent) return FlickObserver.onTouchEnd();
            if(I.Loupe.Transforming) return;
            if(FlickObserver.isInSafeAreas(BibiEvent)) return;
            //BibiEvent.preventDefault();
            FlickObserver.Movement = FlickObserver.getMovement(BibiEvent);
            E.add('bibi:moved-pointer', FlickObserver.onTouchMove);
            E.add('bibi:upped-pointer', FlickObserver.onTouchEnd);
        },
        cancel: () => {
            delete FlickObserver.Movement;
            E.remove('bibi:moved-pointer', FlickObserver.onTouchMove);
            E.remove('bibi:upped-pointer', FlickObserver.onTouchEnd);
        },
        onTouchMove: (BibiEvent) => {
            //if(BibiEvent.touches && BibiEvent.touches.length == 1 && O.getViewportZooming() <= 1) BibiEvent.preventDefault();
            I.ScrollObserver.breakCurrentScrolling();
            const Mv = FlickObserver.Movement; if(Mv) { const MvS = Mv.Started;
                if(!Mv.Moving++) {
                    const TimeFromTouchStarted = BibiEvent.timeStamp - MvS.TimeStamp;
                    if(O.TouchOS || (BibiEvent.type != 'mousemove' && BibiEvent.pointerType != 'mouse') || S['prioritise-viewer-operation-over-text-selection']) { if(TimeFromTouchStarted > 234) return FlickObserver.cancel(); }
                    else                                                                                                                                         { if(TimeFromTouchStarted < 234) return FlickObserver.cancel(); }
                    MvS.TimeStamp = BibiEvent.timeStamp;
                }
                const Vector = Mv.getVector(BibiEvent);
                if(!Mv.LaunchingVector && Mv.getDistance(BibiEvent) >= 22) Mv.LaunchingVector = Vector;
                if(Mv.LaunchingVector?.Axis == C.A_AXIS_B) {
                    // Orthogonal
                    if(Mv.AxisSwitcherReadied) I.AxisSwitcher.progress(Vector.Axis != C.A_AXIS_B ? 0 : Mv.getProgress(BibiEvent, C.A_AXIS_B));
                } else {
                    // Natural
                    if(S.RVM != 'paged' && BibiEvent.type == 'touchmove') return Mv.LaunchingVector && FlickObserver.cancel(); // Cancel: Touch Devices on Scrolling View
                    if(I.draggable() && I.isScrollable()) R.Main['scroll' + C.L_OOBL_L] = MvS['Scroll' + C.L_OOBL_L] + Mv.getPassage(BibiEvent)[C.L_AXIS_L] * -1;
                }
                BibiEvent.preventDefault();
                if(MvS.Item) {
                    MvS.Item.HTML.classList.add('bibi-flick-hot');
                    MvS.Item.contentWindow.getSelection().empty();
                }
                Mv.Last.BibiEvent = BibiEvent;
                if(BibiEvent.Coord[C.A_AXIS_L] <= 0 || BibiEvent.Coord[C.A_AXIS_L] >= R.Stage[C.A_SIZE_L] || BibiEvent.Coord[C.A_AXIS_B] <= 0 || BibiEvent.Coord[C.A_AXIS_B] >= R.Stage[C.A_SIZE_B]) return FlickObserver.onTouchEnd(BibiEvent, { Swipe: true });
            }
        },
        onTouchEnd: (BibiEvent, Opt) => {
            let cb = undefined, Par = {};
            const Mv = FlickObserver.Movement; if(Mv) { const MvS = Mv.Started;
                if(!BibiEvent) BibiEvent = Mv.Last.BibiEvent;
                if(MvS.Item) MvS.Item.HTML.classList.remove('bibi-flick-hot');
                if(!I.Loupe.Transforming) {
                    const Vector = Mv.getVector(BibiEvent);
                    if(Mv.LaunchingVector?.Axis == C.A_AXIS_B && Vector.Axis == C.A_AXIS_B) {
                        // Orthogonal Pan/Releace
                        cb = Mv.getProgress(BibiEvent) >= 1 ? (Mv.AxisSwitcherReadied ? I.AxisSwitcher.switchAxis : I.orthogonal('touchmove') == 'utilities' ? I.Utilities.toggleGracefuly : undefined) : I.AxisSwitcher?.reset;
                    }
                    const Distance = Mv.getDistance(BibiEvent);
                    if(!cb && Distance >= 5) {
                        // Moved (== not Tap)
                        BibiEvent.preventDefault();
                        const Duration = BibiEvent.timeStamp - MvS.TimeStamp;
                        Par.Speed = Distance / Duration;
                        if(O.getViewportZooming() <= 1 && Duration <= 300) {
                            if(S.RVM == 'paged' || I.draggable()) {
                                Par.OriginList = MvS.OriginList;
                                Par.Vector = Vector;
                                cb = Opt?.Swipe ? FlickObserver.onSwipe : FlickObserver.onFlick;
                            }
                        } else if(I.isScrollable()) {
                            if(/*S.RVM == 'paged' &&*/ I.draggable()) {
                                Par.Vector = { Direction: { From: Mv.getDegree(BibiEvent) < 180 ? 'left' /* to right */ : 'right' /* to left */ } };
                                cb = FlickObserver.onPanRelease;
                            }
                        }
                    } else {
                        // Not Moved (== Tap)
                        // [[[[ Do Nothing ]]]] (to avoid conflicts with other tap events on other UIs like Arrows.)
                    }
                }
            }
            FlickObserver.cancel();
            return Promise.resolve(cb?.(BibiEvent, Par));
        },
        onFlick: (BibiEvent, Par) => {
            if(!I.draggable() && S.RVM != 'paged') return Promise.resolve();
            if(!BibiEvent || !Par) return Promise.resolve();
            const Dist = C.d2d(Par.Vector.Direction.From, I.orthogonal('touchmove') == 'move');
            if(!Dist) {
                // Orthogonal (not for "move")
                return Promise.resolve().then(() => { switch(I.orthogonal('touchmove')) {
                    case 'switch': return I.AxisSwitcher?.switchAxis();
                    case 'utilities': return I.Utilities.toggleGracefuly();
                }});
            } else /*if(S.RVM == 'paged' || S.RVM == 'horizontal' && Par.Vector.Axis == 'Y' || S.RVM == 'vertical' && Par.Vector.Axis == 'X')*/ {
                // Paged || Scrolling && Orthogonal
                const PageIndex = (Dist > 0 ? Par.OriginList.slice(-1)[0].Page.Index : Par.OriginList[0].Page.Index);
                return R.focusOn({ Page: R.Pages[PageIndex + Dist] || R.Pages[PageIndex] }, { Duration: !I.isScrollable() ? 0 : I.draggable() || S.RVM != 'paged' ? 123 : 0 });
            } /*else {
                // Scrolling && Natural
                return R.scrollBy(Dist * (Par.Speed ? sML.limitMinMax(Math.round(Par.Speed * 100) * 0.08, 0.33, 10) * 333 / (S.SLD == 'ttb' ? R.Stage.Height : R.Stage.Width) : 1), {
                    Duration: 1234,
                    Cancelable: true,
                    ease: (_) => (Math.pow(--_, 4) - 1) * -1
                });
            }*/
        },
        onSwipe: (...Args) => FlickObserver.onFlick(...Args),
        onPanRelease: (BibiEvent, Par) => {
            if(!I.draggable() /*|| S.RVM != 'paged'*/) return Promise.resolve();
            if(!BibiEvent || !Par) return Promise.resolve();
            O.HTML.classList.add('moving');
            const Dist = C.d2d(Par.Vector.Direction.From);
            const CurrentList = I.PageObserver.updateCurrent().List; if(!CurrentList.length) { O.HTML.classList.remove('moving'); return Promise.resolve(); } // empty mid-relayout: reading .Page off undefined threw TypeError
            const CurrentPage = Dist >= 0 ? CurrentList.slice(-1)[0].Page : CurrentList[0].Page;
            return R.focusOn({ Page: CurrentList.length == 1 && CurrentList[0].SpreadIntersectionStatus.Ratio < 0.5 ? R.Pages[CurrentPage.Index + Dist] || CurrentPage : CurrentPage }, {
                Duration: !I.isScrollable() ? 0 : I.draggable() ? 333 : 0
            }).then(() => O.HTML.classList.remove('moving'));
        },
        getCNPf: (Ele) => Ele.ownerDocument == document ? '' : 'bibi-',
        activateElement: (Ele) => { if(!Ele) return false;
            if(!Ele.FlickObserver) Ele.FlickObserver = {};
            if(!Ele.FlickObserver.onPointerDown) Ele.FlickObserver.onPointerDown = Eve => FlickObserver.onTouchStart(E.aBCD(Eve));
            Ele.addEventListener(O.TouchOS ? 'touchstart' : E['pointerdown'], Ele.FlickObserver.onPointerDown, E.CPO_100);
            const CNPf = FlickObserver.getCNPf(Ele);
            /**/                 Ele.ownerDocument.documentElement.classList.add(CNPf + 'flick-active');
            if(I.isScrollable()) Ele.ownerDocument.documentElement.classList.add(CNPf + 'flick-scrollable');
        },
        deactivateElement: (Ele) => { if(!Ele) return false;
            if(Ele.FlickObserver?.onPointerDown) Ele.removeEventListener(O.TouchOS ? 'touchstart' : E['pointerdown'], Ele.FlickObserver.onPointerDown, E.CPO_100);
            const CNPf = FlickObserver.getCNPf(Ele);
            Ele.ownerDocument.documentElement.classList.remove(CNPf + 'flick-active');
            Ele.ownerDocument.documentElement.classList.remove(CNPf + 'flick-scrollable');
        }
    };
    FlickObserver.activateElement(R.Main);
    E.add('bibi:loaded-item', Item => FlickObserver.activateElement(Item.HTML));
    E.dispatch('bibi:created-flick-observer');
}};


I.WheelObserver = { create: () => {
    const WheelObserver = I.WheelObserver = {
        TotalDelta: 0,
        Turned: false,
        Wheels: [],
        // OverlaidUIs: [],
        _reset: () => {
            WheelObserver.Wheels.length = WheelObserver.Progress = WheelObserver.TotalDelta = 0;
            if(I.AxisSwitcher) I.AxisSwitcher.reset();
        },
        reset: (Delay = 0) => {
            clearTimeout(WheelObserver.Timer_resetWheeling);
            !Delay ? WheelObserver._reset() : (WheelObserver.Timer_resetWheeling = setTimeout(WheelObserver._reset, Delay));
        },
        heat: () => {
            clearTimeout(WheelObserver.Timer_coolDown);
            WheelObserver.Hot = true;
            WheelObserver.Timer_coolDown = setTimeout(() => WheelObserver.Hot = false, 123);
        },
        onWheel: (Eve) => {
            WheelObserver.reset(123);
            const Axis = Eve.Axis = Math.abs(Eve.deltaX) > Math.abs(Eve.deltaY) ? 'X' : 'Y';
            const ToDo = WheelObserver.ToDo[Axis == C.A_AXIS_L ? 0 : 1];
            if(!ToDo) return;
            Eve.preventDefault();
            Eve.stopPropagation();
            switch(ToDo) {
                case 'across': return WheelObserver.scrollAcross(Eve, Axis);
                // case 'simulate': return WheelObserver.scrollNatural(Eve, Axis);
            }
            const Dir   = Eve.Dir = Axis == 'X' ? (Eve.deltaX < 0 ? 'left' : 'right') : (Eve.deltaY < 0 ? 'top' : 'bottom');
            const Delta = Eve.Delta = Eve['delta' + Axis];
            const Move  = Eve.Move = Math.abs(Delta);
            const Ws = WheelObserver.Wheels;
            const PEve = Ws[0] || null;
            Ws.unshift(Eve); if(Ws.length > 2) Ws.length = 2;
            WheelObserver.Progress = (WheelObserver.TotalDelta += Delta) / 3 / 100;
            if(WheelObserver.Hot) return;
            // !PEve -> 'start'
            // Axis == PEve.Axis && Dir == PEve.Dir -> 'accel'   (Move - PEve.Move > 4)
            // Axis == PEve.Axis && Dir != PEve.Dir -> 'reverse' (Move - PEve.Move > 4)
            // Axis != PEve.Axis -> '' (turn)
            // (else) -> '' (keep or slow-down)
            if(!PEve || (Axis == PEve.Axis && Move - PEve.Move > 4)) switch(ToDo) {
                case 'move':      return WheelObserver.move(C.d2d(Dir, 'Allow Orthogonal Direction'));
                case 'utilities': return WheelObserver.toggleUtilities();
                case 'switch':    return WheelObserver.switchAxis();
            }
        },
        updateTheToDo: () => WheelObserver.ToDo = [
            (() => {
                if(S.RVM == 'paged') return 'move';
                // if(WheelObserver.OverlaidUIs.filter(OUI => OUI.contains(Eve.target)).length) return 'simulate';
            })(),
            (OnOrthogonalWheel => {
                if(OnOrthogonalWheel == 'across') {
                    if(B.Reflowable) {
                        if(B.WritingMode.split('-')[1] == 'tb') { if(S.RVM == 'horizontal') return 'move'; }
                        else                                    { if(S.RVM ==   'vertical') return 'move'; }
                    } else {
                        if(S.RVM == 'horizontal' || !S['full-breadth-layout-in-scroll']) return 'move';
                    }
                }
                return OnOrthogonalWheel;
            })(I.orthogonal('wheel'))
        ],
        scrollNatural: (Eve, Axis) => { switch(Axis) {
            case 'X': return R.Main.scrollLeft += Eve.deltaX;
            case 'Y': return R.Main.scrollTop  += Eve.deltaY;
        } },
        scrollAcross: (Eve, Axis) => { switch(Axis) {
            case 'X': return R.Main.scrollTop  += Eve.deltaX;
            case 'Y': return R.Main.scrollLeft += Eve.deltaY * (S.ARD == 'rtl' ? -1 : 1);
        } },
        move: (Distance) => {
            WheelObserver.heat();
            I.Flipper.flip(Distance, I.isScrollable() && I.draggable() ? { Duration: 333 } : null);
        },
        toggleUtilities: () => {
            WheelObserver.heat();
            I.Utilities.toggleGracefuly();
        },
        switchAxis: () => {
            if(!I.AxisSwitcher) return;
            // I.AxisSwitcher.progress(WheelObserver.Progress);
            if(Math.abs(WheelObserver.Progress) < 1) return;
            WheelObserver.heat();
            I.AxisSwitcher.switchAxis();
        }
    };
    document.addEventListener('wheel', Eve => E.dispatch('bibi:is-wheeling', Eve), E.CPO_000);
    E.add('bibi:loaded-item', Item => Item.contentDocument.addEventListener('wheel', Eve => E.dispatch('bibi:is-wheeling', Eve), E.CPO_100));
    E.add(['bibi:opened', 'bibi:changed-view'], WheelObserver.updateTheToDo);
    E.add('bibi:opened', () => {
        // [I.Menu, I.Slider].forEach(UI => {
        //     if(!UI.ownerDocument) return;
        //     UI.addEventListener('wheel', Eve => { Eve.preventDefault(); Eve.stopPropagation(); }, E.CPO_000);
        //     WheelObserver.OverlaidUIs.push(UI);
        // });
        E.add('bibi:is-wheeling', WheelObserver.onWheel);
        O.HTML.classList.add('wheel-active');
    });
    E.dispatch('bibi:created-wheel-observer');
}};


I.PinchObserver = { create: () => {
    const PinchObserver = I.PinchObserver = {
        Pinching: 0,
        getEventCoords: (Eve) => {
            const T0 = Eve.touches[0], T1 = Eve.touches[1], Doc = Eve.target.ownerDocument;
            const T0CoordInViewport = { X: T0.screenX, Y: T0.screenY };
            const T1CoordInViewport = { X: T1.screenX, Y: T1.screenY };
            return {
                Center: { X: (T0CoordInViewport.X + T1CoordInViewport.X) / 2, Y: (T0CoordInViewport.Y + T1CoordInViewport.Y) / 2 },
                Distance: Math.sqrt(Math.pow(T1.screenX - T0.screenX, 2) + Math.pow(T1.screenY - T0.screenY, 2))
            };
        },
        onTouchStart: (Eve) => {
            if(!L.Opened) return;
            if(Eve.touches.length != 2) return;
            O.HTML.classList.add('pinching');
            PinchObserver.Hot = true;
            Eve.preventDefault(); Eve.stopPropagation();
            PinchObserver.PinchStart = {
                Scale: I.Loupe.CurrentTransformation.Scale,
                Coords: PinchObserver.getEventCoords(Eve)
            };
        },
        onTouchMove: (Eve) => {
            if(Eve.touches.length != 2 || !PinchObserver.PinchStart) return;
            Eve.preventDefault(); Eve.stopPropagation();
            const Ratio = PinchObserver.getEventCoords(Eve).Distance / PinchObserver.PinchStart.Coords.Distance;
            /* // Switch Utilities with Pinch-In/Out
            if(PinchObserver.Pinching++ < 3 && PinchObserver.PinchStart.Scale == 1) switch(I.Utilities.UIState) {
                case 'default': if(Ratio < 1) { PinchObserver.onTouchEnd(); I.Utilities.openGracefuly();  return; } break;
                case  'active': if(Ratio > 1) { PinchObserver.onTouchEnd(); I.Utilities.closeGracefuly(); return; } break;
            } //*/
            clearTimeout(PinchObserver.Timer_TransitionRestore);
            sML.style(R.Main, { transition: 'none' });
            I.Loupe.scale(PinchObserver.PinchStart.Scale * Ratio, { Center: PinchObserver.PinchStart.Coords.Center, Stepless: true });
            PinchObserver.Timer_TransitionRestore = setTimeout(() => sML.style(R.Main, { transition: '' }), 234);
        },
        onTouchEnd: (Eve, Opt) => {
            PinchObserver.Pinching = 0;
            delete PinchObserver.LastScale;
            delete PinchObserver.PinchStart;
            delete PinchObserver.Hot;
            O.HTML.classList.remove('pinching');
        },
        getCNPf: (Doc) => Doc == document ? '' : 'bibi-',
        activateElement: (Ele) => { if(!Ele) return false;
            Ele.addEventListener('touchstart', PinchObserver.onTouchStart, E.CPO_100);
            Ele.addEventListener('touchmove',  PinchObserver.onTouchMove,  E.CPO_100);
            Ele.addEventListener('touchend',   PinchObserver.onTouchEnd,   E.CPO_100);
            Ele.ownerDocument.documentElement.classList.add(PinchObserver.getCNPf(Ele) + 'pinch-active');
        },
        deactivateElement: (Ele) => { if(!Ele) return false;
            Ele.removeEventListener('touchstart', PinchObserver.onTouchStart, E.CPO_100);
            Ele.removeEventListener('touchmove',  PinchObserver.onTouchMove,  E.CPO_100);
            Ele.removeEventListener('touchend',   PinchObserver.onTouchEnd,   E.CPO_100);
            Ele.ownerDocument.documentElement.classList.remove(PinchObserver.getCNPf(Ele) + 'pinch-active');
        }
    };
    PinchObserver.activateElement(R.Main);
    E.add('bibi:loaded-item', Item => PinchObserver.activateElement(Item.HTML));
    E.dispatch('bibi:created-pinch-observer');
}};


I.KeyObserver = { create: () => { if(!S['use-keys']) return;
    const TimeLimit = { D2U: 300, U2D: 300 };
    const KeyObserver = I.KeyObserver = {
        Staccato: 0,
        staccato: function(fn) {
            clearTimeout(this.Timer_Staccato);
            fn(++this.Staccato);
            this.Timer_Staccato = setTimeout(() => this.Staccato = 0, TimeLimit.U2D);
        },
        ActiveKeys: {},
        KeyCodes: { 'keydown': {}, 'keyup': {}, 'keypress': {} },
        updateKeyCodes: (EventTypes, KeyCodesToUpdate) => {
            if(typeof EventTypes.join != 'function')  EventTypes = [EventTypes];
            if(typeof KeyCodesToUpdate == 'function') KeyCodesToUpdate = KeyCodesToUpdate();
            EventTypes.forEach(EventType => KeyObserver.KeyCodes[EventType] = sML.edit(KeyObserver.KeyCodes[EventType], KeyCodesToUpdate));
        },
        KeyParameters: {},
        initializeKeyParameters: () => {
            let _ = { 'End': 'foot', 'Home': 'head' };
            for(const p in _) _[p.toUpperCase()] = _[p] == 'head' ? 'foot' : _[p] == 'foot' ? 'head' : _[p];
            Object.assign(_, { 'Space': 1, 'SPACE': -1 });
            KeyObserver.KeyParameters = _;
        },
        updateKeyParameters: () => {
            const _O = I.orthogonal('arrowkey');
            const _ = (() => { switch(S.ARA) {
                case 'horizontal': return Object.assign({ 'Left Arrow': C.d2d('left'), 'Right Arrow': C.d2d('right' ) }, _O == 'move' ? {   'Up Arrow': C.d2d('top' , 9),  'Down Arrow': C.d2d('bottom', 9) } : {   'Up Arrow': _O,  'Down Arrow': _O });
                case   'vertical': return Object.assign({   'Up Arrow': C.d2d('top' ),  'Down Arrow': C.d2d('bottom') }, _O == 'move' ? { 'Left Arrow': C.d2d('left', 9), 'Right Arrow': C.d2d('right' , 9) } : { 'Left Arrow': _O, 'Right Arrow': _O });
            } })();
            for(const p in _) _[p.toUpperCase()] = _[p] == -1 ? 'head' : _[p] == 1 ? 'foot' : _[p];
            Object.assign(KeyObserver.KeyParameters, _);
        },
        getBibiKeyName: (Eve) => {
            const KeyName = KeyObserver.KeyCodes[Eve.type][Eve.keyCode];
            return KeyName ? KeyName : '';
        },
        onEvent: (Eve) => {
            if(!L.Opened) return false;
            Eve.BibiKeyName = KeyObserver.getBibiKeyName(Eve);
            Eve.BibiModifierKeys = [];
            if(Eve.shiftKey) Eve.BibiModifierKeys.push('Shift');
            if(Eve.ctrlKey)  Eve.BibiModifierKeys.push('Control');
            if(Eve.altKey)   Eve.BibiModifierKeys.push('Alt');
            if(Eve.metaKey)  Eve.BibiModifierKeys.push('Meta');
            //if(!Eve.BibiKeyName) return false;
            if(Eve.BibiKeyName) Eve.preventDefault();
            return true;
        },
        onKeyDown: (Eve) => {
            if(!KeyObserver.onEvent(Eve)) return false;
            if(Eve.BibiKeyName) {
                if(!KeyObserver.ActiveKeys[Eve.BibiKeyName]) {
                    KeyObserver.ActiveKeys[Eve.BibiKeyName] = Date.now();
                } else {
                    KeyObserver.staccato(Sta =>  E.dispatch('bibi:is-holding-key', Object.assign(Eve, { Staccato: Sta })));
                }
            }
            E.dispatch('bibi:downed-key', Eve);
        },
        onKeyUp: (Eve) => {
            if(!KeyObserver.onEvent(Eve)) return false;
            if(KeyObserver.ActiveKeys[Eve.BibiKeyName] && Date.now() - KeyObserver.ActiveKeys[Eve.BibiKeyName] < TimeLimit.D2U) {
                KeyObserver.staccato(Sta =>  E.dispatch('bibi:touched-key', Object.assign(Eve, { Staccato: Sta })));
            }
            if(Eve.BibiKeyName) {
                if(KeyObserver.ActiveKeys[Eve.BibiKeyName]) {
                    delete KeyObserver.ActiveKeys[Eve.BibiKeyName];
                }
            }
            E.dispatch('bibi:upped-key', Eve);
        },
        onKeyPress: (Eve) => {
            if(!KeyObserver.onEvent(Eve)) return false;
            E.dispatch('bibi:pressed-key', Eve);
        },
        observe: (Doc) => {
            ['keydown', 'keyup', 'keypress'].forEach(EventName => Doc.addEventListener(EventName, KeyObserver['onKey' + sML.capitalise(EventName.replace('key', ''))], false));
        },
        onKeyTouch: (Eve) => {
            if(KeyObserver.Hot) return;
            if(!Eve.BibiKeyName) return false;
            const KeyParameter = KeyObserver.KeyParameters[!Eve.shiftKey ? Eve.BibiKeyName : Eve.BibiKeyName.toUpperCase()];
            if(!KeyParameter) return false;
            //Eve.preventDefault();
            KeyObserver.Hot = true;
            new Promise((resolve, reject) => { switch(typeof KeyParameter) {
                case 'number': if(I.Flipper.isAbleToFlip(KeyParameter)) {
                    if(I.Arrows) E.dispatch(I.Arrows[KeyParameter], 'bibi:singletapped');
                    return I.Flipper.flip(KeyParameter, Eve.Staccato > 1 ? { Duration: 0 } : null).then(resolve);
                } break;
                case 'string': switch(KeyParameter) {
                    case 'head': case 'foot': return R.focusOn(KeyParameter, { Duration: 0 }).then(resolve);
                    case 'utilities': return I.Utilities.toggleGracefuly(), resolve();
                    case 'switch': if(I.AxisSwitcher) return I.AxisSwitcher.switchAxis().then(resolve);
                } break;
            } reject(); }).catch(() => 0).then(() => KeyObserver.Hot = false);
        }
    };
    KeyObserver.updateKeyCodes(['keydown', 'keyup', 'keypress'], {
        32: 'Space'
    });
    KeyObserver.updateKeyCodes(['keydown', 'keyup'], {
        33: 'Page Up',     34: 'Page Down',
        35: 'End',         36: 'Home',
        37: 'Left Arrow',  38: 'Up Arrow',  39: 'Right Arrow',  40: 'Down Arrow'
    });
    E.add('bibi:postprocessed-item', Item => Item.IsPlaceholder ? false : KeyObserver.observe(Item.contentDocument));
    E.add('bibi:opened', () => {
        KeyObserver.initializeKeyParameters(), KeyObserver.updateKeyParameters(), E.add('bibi:changed-view', () => KeyObserver.updateKeyParameters());
        KeyObserver.observe(document);
        E.add(['bibi:touched-key', 'bibi:is-holding-key'], Eve => KeyObserver.onKeyTouch(Eve));
    });
    E.dispatch('bibi:created-key-observer');
}};


I.Tracer = { create: () => {
    const Tracer = I.Tracer = {
        checkSelectionStatus: (BibiEvent) => {
            if(I.RangeFinder.Selecting) return false;
            if(BibiEvent.RangeOfSelection) {
                const PageOfRangeHeadOfSelection = R.getPageOfRangeHead(BibiEvent.RangeOfSelection);
                if(PageOfRangeHeadOfSelection && I.PageObserver.Current.Pages.includes(PageOfRangeHeadOfSelection)) return false;
            }
            return true;
        },
        checkTapAvailability: (BibiEvent) => {
            switch(S.RVM) {
                case 'horizontal': if(BibiEvent.Coord.Y > window.innerHeight - O.Scrollbars.Height) return false; else break;
                case 'vertical':   if(BibiEvent.Coord.X > window.innerWidth  - O.Scrollbars.Width)  return false; else break;
            }
            if(BibiEvent.target.ownerDocument) {
                if(O.isPointableContent(BibiEvent.target)) return false;
                if(I.Slider.ownerDocument && (BibiEvent.target == I.Slider || I.Slider.contains(BibiEvent.target))) return false;
            }
            return true;
        },
        checkFlipperAvailability: (BibiEvent) => {
            if(!L.Opened) return false;
            if(I.OpenedSubpanel) return false;
            if(I.Panel && I.Panel.UIState == 'active') return false;
            //if(BibiEvent.Coord.Y < I.Menu.Height/* * 1.5*/) return false;
            const Buf = 3;
                 if(BibiEvent.Coord.X <= Buf || BibiEvent.Coord.Y <= Buf) return false;
            else if(S.ARA == 'horizontal') { if(BibiEvent.Coord.X >= window.innerWidth  - Buf || BibiEvent.Coord.Y >= window.innerHeight - O.Scrollbars.Height - Buf) return false; }
            else if(S.ARA == 'vertical'  ) { if(BibiEvent.Coord.Y >= window.innerHeight - Buf || BibiEvent.Coord.X >= window.innerWidth  - O.Scrollbars.Width  - Buf) return false; }
            if(BibiEvent.target.ownerDocument.documentElement == O.HTML) {
                if(BibiEvent.target == O.HTML || BibiEvent.target == O.Body || BibiEvent.target == I.Menu) return true;
                if(/^(bibi-main|bibi-arrow|bibi-help|bibi-poweredby)/.test(BibiEvent.target.id)) return true;
                if(/^(spread|item|page)( |-|$)/.test(BibiEvent.target.className)) return true;
            } else {
                return O.isPointableContent(BibiEvent.target) ? false : true;
            }
            return false;
        },
        getDirection: (BibiEvent) => { switch(S.ARA) {
            case 'horizontal': return BibiEvent.Division.X != 'center' ? BibiEvent.Division.X : BibiEvent.Division.Y;
            case 'vertical'  : return BibiEvent.Division.Y != 'middle' ? BibiEvent.Division.Y : BibiEvent.Division.X;
        }}
    };
    ['bibi:tapped', 'bibi:singletapped', 'bibi:doubletapped', 'bibi:tripletapped'].forEach(EN => {
        E.add(EN, BibiEvent => {
            if(I.isPointerStealth()) return false;
            if(EN != 'bibi:tapped' && I.OpenedSubpanel) return I.OpenedSubpanel.close() && false;
            if(!L.Opened) return false;
            if(!Tracer.checkTapAvailability(BibiEvent)) return false;
            E.dispatch(EN + '-book', BibiEvent); // 'bibi:tapped-book', 'bibi:singletapped-book', 'bibi:doubletapped-book', 'bibi:tripletapped-book'
        })
    });
    { // Both (O.TouchOS || !O.TouchOS)
        E.add('bibi:opened', () => {
            E.add('bibi:singletapped-book', BibiEvent => {
                if(I.isPointerStealth()) return;
                if(!Tracer.checkSelectionStatus(BibiEvent)) return;
                if(BibiEvent.Division.X == 'center' && BibiEvent.Division.Y == 'middle') return I.Utilities.toggleGracefuly();
                if(Tracer.checkFlipperAvailability(BibiEvent)) {
                    const Dir = Tracer.getDirection(BibiEvent), Ortho = I.orthogonal('edgetap'), Dist = C.d2d(Dir, Ortho == 'move');
                    if(Dist) {
                        if(I.Flipper.isAbleToFlip(Dist)) {
                            I.Flipper.flip(Dist, BibiEvent.Staccato > 1 ? { Duration: 0 } : null);
                            if(I.Arrows) E.dispatch(I.Arrows[Dist], 'bibi:singletapped');
                        }
                    } else {
                        if(typeof C.DDD[Dir] == 'string') switch(Ortho) {
                            case 'utilities': I.Utilities.toggleGracefuly(); break;
                            case 'switch': if(I.AxisSwitcher) I.AxisSwitcher.switchAxis(); break;
                        }
                    }
                }
            });
        });
    }
    if(!O.TouchOS) {
        E.add('bibi:opened', () => {
            E.add('bibi:moved-pointer', BibiEvent => {
                if(I.isPointerStealth()) return;
                if(Tracer.checkSelectionStatus(BibiEvent) && Tracer.checkFlipperAvailability(BibiEvent)) {
                    const Dir = Tracer.getDirection(BibiEvent), Ortho = I.orthogonal('edgetap'), Dist = C.d2d(Dir, Ortho == 'move');
                    if(Dist) {
                        if(I.Flipper.isAbleToFlip(Dist)) {
                            Tracer.Hovering = true;
                            if(I.Arrows) {
                                let Arrow = I.Arrows[Dist]; if(S['indicate-orthogonal-arrows-if-necessary'] && (
                                    (/^(left|right)$/.test(Dir) && S.ARA == 'vertical') ||
                                    (/^(top|bottom)$/.test(Dir) && S.ARA == 'horizontal')
                                )) Arrow = Arrow.Alt;
                                E.dispatch([Arrow.Pair, Arrow.Alt, Arrow.Alt.Pair], 'bibi:unhovered', BibiEvent);
                                E.dispatch(Arrow,                                   'bibi:hovered',   BibiEvent);
                            }
                            const HoveringHTML = BibiEvent.target.ownerDocument.documentElement;
                            if(Tracer.HoveringHTML != HoveringHTML) {
                                if(Tracer.HoveringHTML) Tracer.HoveringHTML.removeAttribute('data-bibi-cursor');
                                (Tracer.HoveringHTML = HoveringHTML).setAttribute('data-bibi-cursor', Dir);
                            }
                            return;
                        }
                    }
                }
                if(Tracer.Hovering) {
                    Tracer.Hovering = false;
                    if(I.Arrows) E.dispatch(I.Arrows.All, 'bibi:unhovered', BibiEvent);
                    if(Tracer.HoveringHTML) Tracer.HoveringHTML.removeAttribute('data-bibi-cursor'), Tracer.HoveringHTML = null;
                }
            });
            sML.forEach(O.Body.querySelectorAll('img'))(Img => Img.addEventListener(E['pointerdown'], O.preventDefault));
        });
        E.add('bibi:loaded-item', Item => {/*
            sML.appendCSSRule(Item.contentDocument, 'html[data-bibi-cursor="left"]',   'cursor: w-resize;');
            sML.appendCSSRule(Item.contentDocument, 'html[data-bibi-cursor="right"]',  'cursor: e-resize;');
            sML.appendCSSRule(Item.contentDocument, 'html[data-bibi-cursor="top"]',    'cursor: n-resize;');
            sML.appendCSSRule(Item.contentDocument, 'html[data-bibi-cursor="bottom"]', 'cursor: s-resize;');*/
            sML.appendCSSRule(Item.contentDocument, 'html[data-bibi-cursor]', 'cursor: pointer;');
            sML.forEach(Item.Body.querySelectorAll('img'))(Img => Img.addEventListener(E['pointerdown'], O.preventDefault))
        });
    }
    const Seconds = [0,1,2,3,4,5,6,7,8,9];
    E.add('bibi:opened', () => {
        Seconds.forEach(Sec => setTimeout(() => O.HTML.setAttribute('data-intro-within', Seconds.slice(Sec + 1, Seconds.length).reverse().join(' ')), Sec * 1000));
        (Tracer.gaze = () => Seconds.forEach(Sec => {
            const TimerName = 'Timer_gaze_' + Sec;
            clearTimeout(Tracer[TimerName]);
            Tracer[TimerName] = setTimeout(() => O.HTML.setAttribute('data-keeping-calm', Seconds.slice(1, Sec + 1).join(' ')), Sec * 1000);
        }))();
        E.add(['bibi:moved-pointer', 'bibi:downed-pointer', 'bibi:touched-key'], Tracer.gaze);
    });
    E.dispatch('bibi:created-tracer');
}};


I.Flipper = { create: () => {
    const Flipper = I.Flipper = {
        PreviousDistance: 0,
        Back: { Distance: -1 }, Forward: { Distance: 1 },
        isAbleToFlip: (Distance) => {
            if(L.Opened && !I.OpenedSubpanel && typeof (Distance * 1) == 'number' && Distance) {
                if(!I.PageObserver.Current.List.length) I.PageObserver.updateCurrent();
                if(I.PageObserver.Current.List.length) {
                    let CurrentEdge, BookEdgePage, Edged;
                    if(Distance < 0) CurrentEdge = I.PageObserver.Current.List[          0], BookEdgePage = R.Pages[          0], Edged = 'Headed';
                    else             CurrentEdge = I.PageObserver.Current.List.slice(-1)[0], BookEdgePage = R.Pages.slice(-1)[0], Edged = 'Footed';
                    if(CurrentEdge.Page != BookEdgePage) return true;
                    if(!CurrentEdge.PageIntersectionStatus.Contained && !CurrentEdge.PageIntersectionStatus[Edged]) return true;
                }
            }
            return false;
        },
        flip: (Distance, Opt) => {
            if(typeof (Distance *= 1) != 'number' || !isFinite(Distance) || Distance === 0) return Promise.resolve();
            I.ScrollObserver.forceStopScrolling();
            if(B.PrePaginated) { // Preventing flicker.
                const C0 = I.PageObserver.Current.List[0], C1 = I.PageObserver.Current.List.slice(-1)[0];
                if(C0 && C1) {
                    const CIs = [C0.Page.Index, C1.Page.Index], TI = CIs[Distance < 0 ? 0 : 1] + Distance;
                    CIs.forEach(CI => { try { R.Pages[CI].Spread.Box.classList.remove('current'); } catch(Err) {} });
                                        try { R.Pages[TI].Spread.Box.classList.add(   'current'); } catch(Err) {}
                }
            }
            return R.moveBy(Distance, { Duration: Opt?.Duration || (S.ARA == S.SLA ? 333 : 0) }).then(Destination => {
                I.PageObserver.updateCurrent();
                if(!S['manualize-adding-histories']) { const LH = I.History.List.slice(-1)[0]; I.History.add({ UI: Flipper, SumUp: !!(LH && LH.UI == Flipper) && (Distance < 0 ? -1 : 1) === (Flipper.PreviousDistance < 0 ? -1 : 1), Destination: Destination }); } // History.List can be empty on the first flip: reading .UI off undefined threw TypeError
                Flipper.PreviousDistance = Distance;
                return Destination;
            });
        }
    };
    Flipper[-1] = Flipper.Back, Flipper[1] = Flipper.Forward;
}};


I.Notifier = { create: () => {
    const  Notifier = I.Notifier = sML.create('div', { id: 'bibi-notifier' });
    const     Panel = Notifier.appendChild(document.createElement('div'));
    const Paragraph = Panel.appendChild(document.createElement('p'));
    Object.assign(Notifier, {
        show: (Msg, Opt = {}) => {
            clearTimeout(Notifier.Timer_hide);
            const ClassNames = [];
            if(Opt.Type == 'Error') ClassNames.push('error');
            if(typeof Opt.className == 'string' && (Opt.className = Opt.className.trim())) ClassNames.push(Opt.className);
            ClassNames.length ? (Paragraph.className = ClassNames.join(' ')) : Paragraph.removeAttribute('class');
            (typeof Opt.id == 'string' && (Opt.id = Opt.id.trim())) ? (Paragraph.id = Opt.id) : Paragraph.removeAttribute('id');
            Paragraph.innerHTML = Msg;
            O.HTML.classList.add('notifier-shown');
            if(L.Opened && Opt.Type != 'Error') Notifier.addEventListener(O.TouchOS || Opt.Hoverable ? E['pointerdown'] : E['pointerover'], Notifier.hide);
        },
        hide: (Opt = {}) => {
            clearTimeout(Notifier.Timer_hide);
            Notifier.Timer_hide = setTimeout(() => {
                if(L.Opened) Notifier.removeEventListener(O.TouchOS || Opt.Hoverable ? E['pointerdown'] : E['pointerover'], Notifier.hide);
                O.HTML.classList.remove('notifier-shown');
            }, typeof Opt.Time == 'number' ? Opt.Time : 0);
        },
        notify: (Msg, Opt = {}) => {
            if(!Msg) return Notifier.hide();
            Notifier.show(Msg, Opt);
            if(typeof Opt.Time == 'undefined') Opt.Time = Opt.Type == 'Error' ? undefined : O.Busy && !L.Opened ? 8888 : 2222;
            if(typeof Opt.Time == 'number') Notifier.hide(Opt);
        }
    });
    I.notify = (...Args) => Notifier.notify(...Args);
    O.Body.appendChild(Notifier);
    E.dispatch('bibi:created-notifier');
}};

    I.notify = () => false;


I.Veil = { create: () => {
    const Veil = I.Veil = I.setToggleAction(O.Body.appendChild(sML.create('div', { id: 'bibi-veil' })), {
        // Translate: 240, /* % */ // Rotate: -48, /* deg */ // Perspective: 240, /* px */
        onopened: () => (O.HTML.classList.add('veil-opened'), Veil.classList.remove('closed')),
        onclosed: () => (Veil.classList.add('closed'), O.HTML.classList.remove('veil-opened'))
    });
    ['touchstart', 'pointerdown', 'mousedown', 'click'].forEach(EN => Veil.addEventListener(EN, Eve => Eve.stopPropagation(), E.CPO_000));
    Veil.open();
    const PlayButtonTitle = (O.TouchOS ? 'Tap' : 'Click') + ' to Open';
    const PlayButton = Veil.PlayButton = Veil.appendChild(
        sML.create('p', { id: 'bibi-veil-play', title: PlayButtonTitle,
            innerHTML: `<span class="non-visual">${ PlayButtonTitle }</span>`,
            play: (Eve) => (Eve.stopPropagation(), L.play(), E.dispatch('bibi:played:by-button')),
            hide: (   ) => sML.style(PlayButton, { opacity: 0, cursor: 'default' }).then(Eve => Veil.removeChild(PlayButton)),
            on: { click: Eve => PlayButton.play(Eve) }
        })
    );
    E.add('bibi:played', () => PlayButton.hide());
    Veil.byebye = (Msg = {}) => {
        Veil.innerHTML = '';
        Veil.ByeBye = Veil.appendChild(sML.create('p', { id: 'bibi-veil-byebye' }));
        ['en', 'ja'].forEach(Lang => Veil.ByeBye.innerHTML += `<span lang="${ Lang }">${ Msg[Lang] }</span>`);
        O.HTML.classList.remove('welcome');
        Veil.open();
    };
    Veil.Cover      = Veil.appendChild(      sML.create('div', { id: 'bibi-veil-cover'      }));
    Veil.Cover.Info = Veil.Cover.appendChild(sML.create('p',   { id: 'bibi-veil-cover-info' }));
    E.dispatch('bibi:created-veil');
}};


I.Catcher = { create: () => { if(S['book-data'] || S['book'] || !S['accept-local-file']) return;
    const Catcher = I.Catcher = O.Body.appendChild(sML.create('div', { id: 'bibi-catcher' }));
    Catcher.insertAdjacentHTML('afterbegin', I.distillLabels.distillLanguage({
        default: [
            `<div class="pgroup" lang="en">`,
                `<p><strong>Pass Me Your EPUB File!</strong></p>`,
                `<p><em>You Can Open Your Own EPUB.</em></p>`,
                `<p><span>Please ${ O.TouchOS ? 'Tap Screen' : 'Drag & Drop It Here. <br />Or Click Screen' } and Choose It.</span></p>`,
                `<p><small>(Open in Your Device without Uploading)</small></p>`,
            `</div>`
        ].join(''),
        ja: [
            `<div class="pgroup" lang="ja">`,
                `<p><strong>EPUBファイルをここにください！</strong></p>`,
                `<p><em>お持ちの EPUB ファイルを<br />開くことができます。</em></p>`,
                `<p><span>${ O.TouchOS ? '画面をタップ' : 'ここにドラッグ＆ドロップするか、<br />画面をクリック' }して選択してください。</span></p>`,
                `<p><small>（外部に送信されず、この端末の中で開きます）</small></p>`,
            `</div>`
        ].join('')
    })[O.Language]);
    Catcher.title = Catcher.querySelector('span').innerHTML.replace(/<br( ?\/)?>/g, '\n').replace(/<[^>]+>/g, '').trim();
    Catcher.Input = Catcher.appendChild(sML.create('input', { type: 'file' }));
    if(!S['extract-if-necessary'].includes('*') && S['extract-if-necessary'].length) {
        const Accept = [];
        if(S['extract-if-necessary'].includes('.epub')) {
            Accept.push('application/epub+zip');
        }
        if(S['extract-if-necessary'].includes('.zip')) {
            Accept.push('application/zip');
            Accept.push('application/x-zip');
            Accept.push('application/x-zip-compressed');
        }
        if(Accept.length) Catcher.Input.setAttribute('accept', Accept.join(','));
    }
    Catcher.Input.addEventListener('change', Eve => {
        let FileData = {};  try { FileData = Eve.target.files[0]; } catch(_) {}
        Bibi.getBookData.resolve({ BookData: FileData });
    });
    Catcher.addEventListener('click', Eve => Catcher.Input.click(Eve));
    if(!O.TouchOS) {
        Catcher.addEventListener('dragenter', Eve => { Eve.preventDefault(); O.HTML.classList.add(   'dragenter'); }, 1);
        Catcher.addEventListener('dragover',  Eve => { Eve.preventDefault();                                       }, 1);
        Catcher.addEventListener('dragleave', Eve => { Eve.preventDefault(); O.HTML.classList.remove('dragenter'); }, 1);
        Catcher.addEventListener('drop',      Eve => { Eve.preventDefault();
            let FileData = {};  try { FileData = Eve.dataTransfer.files[0]; } catch(_) {}
            Bibi.getBookData.resolve({ BookData: FileData });
        }, 1);
    }
    Catcher.appendChild(I.getBookIcon());
    E.dispatch('bibi:created-catcher');
}};


I.Menu = { create: () => {
    if(!S['use-menubar']) O.HTML.classList.add('without-menubar');
    const Menu = I.Menu = O.Body.appendChild(sML.create('div', { id: 'bibi-menu' }, I.Menu)); delete Menu.create;
    //Menu.addEventListener('click', Eve => Eve.stopPropagation());
    I.TouchObserver.setElementHoverActions(Menu);
    I.setToggleAction(Menu, {
        onopened: () => { O.HTML.classList.add(   'menu-opened'); E.dispatch('bibi:opened-menu'); },
        onclosed: () => { O.HTML.classList.remove('menu-opened'); E.dispatch('bibi:closed-menu'); }
    });
    E.add('bibi:commands:open-menu',   Menu.open);
    E.add('bibi:commands:close-menu',  Menu.close);
    E.add('bibi:commands:toggle-menu', Menu.toggle);
    E.add('bibi:opens-utilities',   Opt => E.dispatch('bibi:commands:open-menu',   Opt));
    E.add('bibi:closes-utilities',  Opt => E.dispatch('bibi:commands:close-menu',  Opt));
    E.add('bibi:opened', Menu.close);/*
    E.add('bibi:changes-intersection', () => {
        clearTimeout(Menu.Timer_cool);
        if(!Menu.Hot) Menu.classList.add('hot');
        Menu.Hot = true;
        Menu.Timer_cool = setTimeout(() => {
            Menu.Hot = false;
            Menu.classList.remove('hot');
        }, 1234);
    });*//*
    if(sML.OS.iOS) {
        Menu.addEventListener('pointerdown', console.log);
        Menu.addEventListener('pointerover', console.log);
    }*/
    if(!O.TouchOS) E.add('bibi:opened', () => {
        E.add('bibi:moved-pointer', BibiEvent => {
            if(I.isPointerStealth()) return false;
            clearTimeout(Menu.Timer_close);
            if(BibiEvent.Coord.Y <= Menu.Height && !O.isPointableContent(BibiEvent.target)) { // if(BibiEvent.Division.Y == 'top' && !O.isPointableContent(BibiEvent.target)) {
                E.dispatch(Menu, 'bibi:hovered', BibiEvent);
            } else if(Menu.Hover) {
                Menu.Timer_close = setTimeout(() => E.dispatch(Menu, 'bibi:unhovered', BibiEvent), 123);
            }
        });
    });
    Menu.L = Menu.appendChild(sML.create('div', { id: 'bibi-menu-l' }));
    Menu.R = Menu.appendChild(sML.create('div', { id: 'bibi-menu-r' }));
    [Menu.L, Menu.R].forEach(MenuSide => {
        MenuSide.ButtonGroups = [];
        MenuSide.addButtonGroup = function(Par) {
            const ButtonGroup = I.createButtonGroup(Par);
            if(!ButtonGroup) return null;
            this.ButtonGroups.push(ButtonGroup);
            return this.appendChild(ButtonGroup);
        };
    });
    { // Optimize to Scrollbar Size
        const _Common = 'html.appearance-vertical:not(.veil-opened):not(.slider-opened)', _M = ' div#bibi-menu';
        sML.appendCSSRule(_Common + _M, 'width: calc(100% - ' + O.Scrollbars.Width + 'px);');
        sML.appendCSSRule([_Common + '.panel-opened' + _M, _Common + '.subpanel-opened' + _M].join(', '), 'padding-right: ' + O.Scrollbars.Width + 'px;');
    }
    I.OpenedSubpanel = null;
    I.Subpanels = [];
    Menu.Config.create();
    E.dispatch('bibi:created-menu');
}};

    I.Menu.Config = { create: () => {
        const Menu = I.Menu;
        const Components = [];
        if(!S['fix-reader-view-mode'] && S['available-reader-view-modes'].length > 1)                      Components.push('ViewModeSection');
        if(O.Embedded)                                                                                     Components.push('WindowSection'), Components.push('WindowSection_NewWindowButton');
        if(O.FullscreenTarget && !O.TouchOS)                                                               Components.push('WindowSection'), Components.push('WindowSection_FullscreenButton');
        if(S['website-href'] && /^https?:\/\/[^\/]+/.test(S['website-href']) && S['website-name-in-menu']) Components.push('LinkageSection'), Components.push('LinkageSection_WebsiteLink');
        if(!S['remove-bibi-website-link'])                                                                 Components.push('LinkageSection'), Components.push('LinkageSection_BibiWebsiteLink');
        if(!Components.length) {
            delete I.Menu.Config;
            return;
        }
        const Config = Menu.Config = sML.applyRtL(I.createSubpanel({ id: 'bibi-subpanel_config' }), Menu.Config); delete Config.create;
        const Opener = Config.bindOpener(Menu.R.addButtonGroup(/* { Lively: true } */).addButton({
            Type: 'toggle',
            Labels: {
                default: { default: `Configure Setting`,            ja: `設定を変更` },
                active:  { default: `Close Setting-Menu`, ja: `設定メニューを閉じる` }
            },
            Help: true,
            Icon: `<span class="bibi-icon bibi-icon-config"></span>`
        }));
        if(Components.includes('ViewModeSection')) Config.ViewModeSection.create(          ); else delete Config.ViewModeSection;
        if(Components.includes('WindowSection'))     Config.WindowSection.create(Components); else delete Config.WindowSection;
        if(Components.includes('LinkageSection'))   Config.LinkageSection.create(Components); else delete Config.LinkageSection;
        E.dispatch('bibi:created-config');
    }};

        I.Menu.Config.ViewModeSection = { create: () => {
            const Config = I.Menu.Config;
            const /* SpreadShapes */ SSs = (/* SpreadShape */ SS => SS + SS + SS)((/* ItemShape */ IS => `<span class="bibi-shape bibi-shape-spread">${ IS + IS }</span>`)(`<span class="bibi-shape bibi-shape-item"></span>`));
            const Section = Config.ViewModeSection = Config.addSection({
                Labels: { default: { default: `View Mode`, ja: `閲覧モード` } },
                ButtonGroups: [{
                    ButtonType: 'radio',
                    Buttons: [{
                        Mode: 'paged',
                        Labels: { default: { default: `Spread / Page`, ja: `見開き／ページ` } },
                        Icon: `<span class="bibi-icon bibi-icon-view bibi-icon-view-paged"><span class="bibi-shape bibi-shape-spreads bibi-shape-spreads-paged">${ SSs }</span></span>`
                    }, {
                        Mode: 'horizontal',
                        Labels: { default: { default: `<span class="non-visual-in-label">⇄ </span>Horizontal Scroll`, ja: `<span class="non-visual-in-label">⇄ </span>横スクロール` } },
                        Icon: `<span class="bibi-icon bibi-icon-view bibi-icon-view-horizontal"><span class="bibi-shape bibi-shape-spreads bibi-shape-spreads-horizontal">${ SSs }</span></span>`
                    }, {
                        Mode: 'vertical',
                        Labels: { default: { default: `<span class="non-visual-in-label">⇅ </span>Vertical Scroll`, ja: `<span class="non-visual-in-label">⇅ </span>縦スクロール` } },
                        Icon: `<span class="bibi-icon bibi-icon-view bibi-icon-view-vertical"><span class="bibi-shape bibi-shape-spreads bibi-shape-spreads-vertical">${ SSs }</span></span>`
                    }].filter(Button => S['available-reader-view-modes'].includes(Button.Mode)).map(Button => sML.edit(Button, {
                        Notification: true,
                        action: () => R.changeView({ Mode: Button.Mode, NoNotification: true })
                    }))
                }].concat(S['available-reader-view-modes'].includes('horizontal') || S['available-reader-view-modes'].includes('vertical') ? {
                    Buttons: [{
                        Name: 'full-breadth-layout-in-scroll',
                        Type: 'toggle',
                        Notification: false,
                        Labels: { default: { default: `Use Full Width in Vertical Scroll`, ja: `縦スクロールは幅いっぱいで表示` } },
                        Icon: `<span class="bibi-icon bibi-icon-full-breadth-layout"></span>`,
                        action: function() { R.changeView({ FullBreadthLayoutInScroll: (this.UIState == 'active'), NoNotification: true }); }
                    }]
                } : [])
            });
            E.add('bibi:updated-settings', () => Section.ButtonGroups.forEach((ButtonGroup, i) => { switch(i) {
                case 0: return ButtonGroup.Buttons.forEach(Button => I.setUIState(Button, (Button.Mode == S.RVM ? 'active' : 'default')));
                case 1: return ButtonGroup.Buttons.forEach(Button => { switch(Button.Name) {
                    case 'full-breadth-layout-in-scroll':
                        if(!B.PrePaginated) return Button.ButtonGroup.style.display = 'none';
                        return I.setUIState(Button, S['full-breadth-layout-in-scroll'] ? 'active' : 'default');
                } });
            } }));
        }};

        I.Menu.Config.WindowSection = { create: (Components) => {
            const Config = I.Menu.Config;
            const Buttons = [];
            if(Components.includes('WindowSection_NewWindowButton')) {
                Buttons.push({
                    Type: 'link',
                    Labels: {
                        default: { default: `Open in New Window`, ja: `あたらしいウィンドウで開く` }
                    },
                    Icon: `<span class="bibi-icon bibi-icon-open-newwindow"></span>`,
                    id: 'bibi-button-open-newwindow',
                    href: O.RequestedURL,
                    target: '_blank'
                });
            }
            if(Components.includes('WindowSection_FullscreenButton')) {
                Buttons.push({
                    Type: 'toggle',
                    Labels: {
                        default: { default: `<span class="non-visual">Enter </span>Fullscreen`, ja: `フルスクリーンモード<span class="non-visual">で表示</span>` },
                        active:  { default: `<span class="non-visual">Exit </span>Fullscreen`, ja: `フルスクリーンモード<span class="non-visual">を解除</span>` }
                    },
                    Icon: `<span class="bibi-icon bibi-icon-toggle-fullscreen"></span>`,
                    id: 'bibi-button-toggle-fullscreen',
                    action: function() {
                        !O.Fullscreen ? O.FullscreenTarget.requestFullscreen() : O.FullscreenTarget.ownerDocument.exitFullscreen();
                        Config.close();
                    }
                });
                O.FullscreenTarget.ownerDocument.addEventListener('fullscreenchange', function() { // care multi-embeddeding
                    if(!O.FullscreenButton) O.FullscreenButton = document.getElementById('bibi-button-toggle-fullscreen');
                    if(this.fullscreenElement == O.FullscreenTarget) {
                        O.Fullscreen = true;
                        O.HTML.classList.add('fullscreen');
                        I.setUIState(O.FullscreenButton, 'active');
                    } else if(O.Fullscreen) {
                        O.Fullscreen = false;
                        O.HTML.classList.remove('fullscreen');
                        I.setUIState(O.FullscreenButton, 'default');
                    }
                });
            }
            if(Buttons.length) {
                const Section = Config.WindowSection = Config.addSection({ Labels: { default: { default: `Window Control`, ja: `ウィンドウ制御` } } });
                Section.addButtonGroup({ Buttons: Buttons });
            }
        }};

        I.Menu.Config.LinkageSection = { create: (Components) => {
            const Config = I.Menu.Config;
            const Buttons = [];
            if(Components.includes('LinkageSection_WebsiteLink')) Buttons.push({
                Type: 'link',
                Labels: { default: { default: S['website-name-in-menu'].replace(/&/gi, '&amp;').replace(/</gi, '&lt;').replace(/>/gi, '&gt;') } },
                Icon: `<span class="bibi-icon bibi-icon-open-newwindow"></span>`,
                href: S['website-href'],
                target: '_blank'
            });
            if(Components.includes('LinkageSection_BibiWebsiteLink')) Buttons.push({
                Type: 'link',
                Labels: { default: { default: `Bibi | Official Website` } },
                Icon: `<span class="bibi-icon bibi-icon-open-newwindow"></span>`,
                href: Bibi['href'],
                target: '_blank'
            });
            if(Buttons.length) {
                const Section = Config.LinkageSection = Config.addSection({ Labels: { default: { default: `Link${ Buttons.length > 1 ? 's' : '' }`, ja: `リンク` } } });
                Section.addButtonGroup({ Buttons: Buttons });
            }
        }};


I.Panel = { create: () => {
    const Panel = I.Panel = O.Body.appendChild(sML.create('div', { id: 'bibi-panel' }));
    Panel.addEventListener(E['pointerdown'], Eve => Eve.stopPropagation());
    Panel.addEventListener(E['pointerup'],   Eve => Eve.stopPropagation());
    Panel.addEventListener('wheel',          Eve => Eve.stopPropagation());
    I.setToggleAction(Panel, {
        onopened: () => { O.HTML.classList.add(   'panel-opened'); E.dispatch('bibi:opened-panel'); },
        onclosed: () => { O.HTML.classList.remove('panel-opened'); E.dispatch('bibi:closed-panel'); }
    });
    E.add('bibi:commands:open-panel',   Panel.open);
    E.add('bibi:commands:close-panel',  Panel.close);
    E.add('bibi:commands:toggle-panel', Panel.toggle);
    E.add('bibi:closes-utilities',      Panel.close);
    I.setFeedback(Panel, { StopPropagation: true });
    E.add(Panel, 'bibi:singletapped', () => E.dispatch('bibi:commands:toggle-panel'));
    Panel.BookInfo            = Panel.appendChild(               sML.create('div', { id: 'bibi-panel-bookinfo'            }));
    Panel.BookInfo.Cover      = Panel.BookInfo.appendChild(      sML.create('div', { id: 'bibi-panel-bookinfo-cover'      }));
    Panel.BookInfo.Cover.Info = Panel.BookInfo.Cover.appendChild(sML.create('p',   { id: 'bibi-panel-bookinfo-cover-info' }));
    const Opener = Panel.Opener = I.Menu.L.addButtonGroup(/* { Lively: true } */).addButton({
        Type: 'toggle',
        Labels: {
            default: { default: `Open Index`,  ja: `目次を開く`   },
            active:  { default: `Close Index`, ja: `目次を閉じる` }
        },
        Help: true,
        Icon: `<span class="bibi-icon bibi-icon-toggle-panel">${ (Bars => { for(let i = 1; i <= 6; i++) Bars += '<span></span>'; return Bars; })('') }</span>`,
        action: () => Panel.toggle()
    });
    E.add('bibi:opened-panel', () => I.setUIState(Opener, 'active'            ));
    E.add('bibi:closed-panel', () => I.setUIState(Opener, ''                  ));
    if(S['on-doubletap'            ] == 'panel') E.add('bibi:doubletapped',             () => Panel.toggle());
    if(S['on-tripletap'            ] == 'panel') E.add('bibi:tripletapped',             () => Panel.toggle());
    if(S['on-singletap-with-altkey'] == 'panel') E.add('bibi:singletapped-with-altkey', () => Panel.toggle());
    if(S['on-doubletap-with-altkey'] == 'panel') E.add('bibi:doubletapped-with-altkey', () => Panel.toggle());
    if(S['on-tripletap-with-altkey'] == 'panel') E.add('bibi:tripletapped-with-altkey', () => Panel.toggle());
    //sML.appendCSSRule('div#bibi-panel-bookinfo', 'height: calc(100% - ' + (O.Scrollbars.Height) + 'px);'); // Optimize to Scrollbar Size
    E.dispatch('bibi:created-panel');
}};


I.Help = { create: () => {
    const Help = I.Help = O.Body.appendChild(sML.create('div', { id: 'bibi-help' }));
    Help.Message = Help.appendChild(sML.create('p', { className: 'hidden', id: 'bibi-help-message' }));
    Help.show = (HelpText) => {
        clearTimeout(Help.Timer_deactivate1);
        clearTimeout(Help.Timer_deactivate2);
        Help.classList.add('active');
        Help.Message.innerHTML = HelpText;
        setTimeout(() => Help.classList.add('shown'), 0);
    };
    Help.hide = () => {
        Help.Timer_deactivate1 = setTimeout(() => {
            Help.classList.remove('shown');
            Help.Timer_deactivate2 = setTimeout(() => Help.classList.remove('active'), 200);
        }, 100);
    };
    /*
    sML.appendCSSRule([ // Optimize to Scrollbar Size
        'html.appearance-horizontal div#bibi-help',
        'html.page-rtl.panel-opened div#bibi-help'
    ].join(', '), 'bottom: ' + (O.Scrollbars.Height) + 'px;');
    */
}};


I.PoweredBy = { create: () => {
    const PoweredBy = I.PoweredBy = O.Body.appendChild(sML.create('div', { id: 'bibi-poweredby', innerHTML: `<p><a href="${ Bibi['href'] }" target="_blank" title="Bibi | Official Website">Bibi</a></p>` }));
    /*
    sML.appendCSSRule([ // Optimize to Scrollbar Size
        'html.appearance-horizontal div#bibi-poweredby',
        'html.page-rtl.panel-opened div#bibi-poweredby'
    ].join(', '), 'bottom: ' + (O.Scrollbars.Height) + 'px;');
    */
}};


I.TextSetter = { create: () => { if(!S['use-textsetter']) return;
    // =========================================================================================================================
    const TextSetter = I.TextSetter = {
        Not: 'script,style,br,img,iframe,source,audio,video,picture,svg,math,ruby,rb,rp,rt,rtc',
        distillSettings: (Settings, Opt) => { if(!Settings || typeof Settings != 'object') return null;
            const DistilledSettings = {};
            return Object.keys(Settings).filter(SetterName => {
                const Setter = TextSetter.X.get(SetterName); if(!Setter) return false;
                const Setting = Setter.distillSetting(Settings[SetterName], Opt); if(!Setting) return false;
                DistilledSettings[SetterName] = Setting; return true;
            }).length ? DistilledSettings : null;
        },
        onPrepared: () => {
            [SETTER, ...TextSetter.X.values()].forEach(Setter => Setter.prepare?.());
        },
        forEachCSSRuleOf: (Item, fn) => O.forEachCSSRuleOf(Item.contentDocument, fn),
        forEachElementOf: (Item, fn) => Item.contentDocument.querySelectorAll(`html,body,body *:not(${ TextSetter.Not })`).forEach(fn),
        ItemProcessingParts: {
            //          On       Setter         Arguments
            // -------------------------------------------------------------------------------
            /**/ BeforeAll     : 0, // Class // Item
            /**/       Before  : 1, // each* // Item
            /**/       CSSRule : 1, // each* // Item, CSSRule, CSSRule.style
            /**/ BeforeMiddle  : 0, // Class // Item
            /**/       Middle  : 1, // each* // Item
            /**/  AfterMiddle  : 0, // Class // Item
            /**/       Element : 1, // each* // Item, Ele, Ele.style, getComputedStyle(Ele)
            /**/       After   : 1, // each* // Item
            /**/  AfterAll     : 0  // Class // Item
        },
        onPostprocessedItem: function(Item) {
            if(Item.PrePaginated || Item.Source.External) return Promise.resolve();
            return Promise.allSettled(Object.keys(this.ItemProcessingParts).map(Part => {
                const ProcessName = 'processItem' + Part;
                if(!this.ItemProcessingParts[Part]) {
                    if(SETTER[ProcessName]) return SETTER[ProcessName](Item);
                } else {
                    const Setters = new Set([...TextSetter.X.values()].filter(Setter => Setter[ProcessName]));
                    if(Setters.size) {
                        const process = (...Args) => Setters.forEach(Setter => Setter[ProcessName](Item, ...Args));
                        switch(Part) {
                            case 'CSSRule': return TextSetter.forEachCSSRuleOf(Item, Rule => process(Rule, Rule.style                       ));
                            case 'Element': return TextSetter.forEachElementOf(Item,  Ele => process( Ele,  Ele.style, getComputedStyle(Ele)));
                                   default: return                                           process(                                       ) ;
                        }
                    }
                }
                return Promise.resolve();
            }));
        },
        onLoadedBook: () => {
            [...TextSetter.X.values(), SETTER].forEach(Setter => Setter.tidy?.());
        },
        change: (Settings, ActionsBeforeAfter) => new Promise(resolve => { if(B.PrePaginated) return resolve();
            Settings = TextSetter.distillSettings(Settings, { Changeable: true });
            if(!Settings) return resolve();
            if(TextSetter.Changing) return resolve();
            TextSetter.Changing = 'Changing';
            const SetterNames = Object.keys(Settings);
            SetterNames.forEach(SetterName => E.dispatch('bibi:changes-' + SetterName.toLowerCase(), Settings[SetterName]));
            // ^-- E.dispatch('bibi:changes-fontsize', Settings.FontSize), E.dispatch('bibi:changes-linespacing', Settings.LineSpacing), E.dispatch('bibi:changes-flowdirection', Settings.FlowDirection)
            if(TextSetter.Subpanel) TextSetter.Subpanel.busy(true);
            if(typeof ActionsBeforeAfter?.before == 'function') ActionsBeforeAfter.before();
            setTimeout(() => R.layOutBook({
                before: () => TextSetter.rebind(Settings, { SettingsAreDistilled: true, Async: true }),
                Reset: true,
                ResetOnlyContent: !Settings.FlowDirection,
                DoNotCloseUtilities: true,
                NoNotification: true,
                Delay: 33
            }).then(() => {
                SetterNames.forEach(SetterName => E.dispatch('bibi:changed-' + SetterName.toLowerCase(), Settings[SetterName]));
                // ^-- E.dispatch('bibi:changed-fontsize', Settings.FontSize), E.dispatch('bibi:changed-linespacing', Settings.LineSpacing), E.dispatch('bibi:changed-flowdirection', Settings.FlowDirection)
                if(typeof ActionsBeforeAfter?.after == 'function') ActionsBeforeAfter.after();
                if(TextSetter.Subpanel) TextSetter.Subpanel.busy(false);
                delete TextSetter.Changing;
                resolve(Settings);
            }), 88);
        }),
        rebind: (Settings, Opt) => {
            if(B.PrePaginated) return Promise.resolve();
            if(!Opt?.SettingsAreDistilled) Settings = TextSetter.distillSettings(Settings, { Changeable: true });
            if(!Settings) return Promise.resolve();
            const Setters = Object.keys(Settings).map(SetterName => TextSetter.X.get(SetterName));
            Setters.forEach(Setter => { const Setting = Settings[Setter.Name];
                if(Setter.changeAtFirst) Setter.changeAtFirst(Setting);
                if(Setter.UI?.care) Setter.UI.care(Setting);
                if(S['keep-settings']) I.Oven.Biscuits.memorize('Book', { [Setter.Name]: Setting });
                Object.assign(Setter.Setting, Setting);
            });
            if(Opt?.Async) return Promise.resolve() // ----------------------------------------------------------------------------------------------------------------------------------------------------------------
                .then(() => Promise.all(                                    Setters.map    (Setter => new Promise(r => r(Setter.changeBeforeItems ? Setter.changeBeforeItems(Settings[Setter.Name]) : undefined)))  ))
                .then(() => Promise.all(R.Items.map    (Item => Promise.all(Setters.map    (Setter => new Promise(r => r(Setter.changeItem        ? Setter.changeItem(Item,  Settings[Setter.Name]) : undefined)))))))
                .then(() => Promise.all(                                    Setters.map    (Setter => new Promise(r => r(Setter.changeAfterItems  ? Setter.changeAfterItems( Settings[Setter.Name]) : undefined)))  ));
            else { // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                                                                            Setters.forEach(Setter =>                    Setter.changeBeforeItems ? Setter.changeBeforeItems(Settings[Setter.Name]) : undefined  )    ;
                                        R.Items.forEach(Item =>             Setters.forEach(Setter =>                    Setter.changeItem        ? Setter.changeItem(Item,  Settings[Setter.Name]) : undefined  ) )  ;
                                                                            Setters.forEach(Setter =>                    Setter.changeAfterItems  ? Setter.changeAfterItems( Settings[Setter.Name]) : undefined  )    ;
            } // ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
        },
        createSubpanel: () => TextSetter.Subpanel = I.createSubpanel({ id: 'bibi-subpanel_textsetter',
            Opener: I.Menu.R.addButtonGroup({/* Lively: true, */ id: 'bibi-buttongroup_textsetter' }).addButton({
                Type: 'toggle',
                Labels: {
                    default: { default: `Change Text Setting`,     ja: `テキスト表示を調整` },
                    active:  { default: `Close Text Setting Menu`, ja: `テキスト表示調整メニューを閉じる` }
                },
                Icon: `<span class="bibi-icon bibi-icon-textsetter"></span>`,
                Help: true
            }),
            open: () => {},
            busy: (Busy) => TextSetter.Subpanel.Sections?.forEach(Section => Section.ButtonGroups?.forEach(ButtonGroup => ButtonGroup.Busy = Busy))
        }),
        discardSubpanel: () => {
            const Subpanel = TextSetter.Subpanel;
            O.Body.removeChild(Subpanel);
            I.Subpanels = I.Subpanels.filter(Sp => Sp != Subpanel);
            const OpenerButtonGroup = I.Menu.R.removeChild(Subpanel.Opener.ButtonGroup);
            I.Menu.R.ButtonGroups = I.Menu.R.ButtonGroups.filter(BG => BG != OpenerButtonGroup);
            delete TextSetter.Subpanel;
        },
        initialize: () => {
            E.bind('bibi:prepared', () => TextSetter.onPrepared());
            E.bind('bibi:postprocessed-item', Item => TextSetter.onPostprocessedItem(Item));
            E.bind('bibi:loaded-book', () => TextSetter.onLoadedBook());
            if(S['keep-settings']) E.bind('bibi:loaded-book', () => {
                const BookBiscuits = I.Oven.Biscuits.remember('Book'); if(!BookBiscuits) return;
                const Settings = TextSetter.distillSettings(BookBiscuits); if(!Settings) return;
                TextSetter.rebind(Settings, { SettingsAreDistilled: true, Async: false });
                // Bibi.StartOption.resetter();
            });
            if(S['use-textsetter-ui']) E.bind('bibi:loaded-book', () => {
                TextSetter.createSubpanel();
                TextSetter.X.forEach(Setter => Setter.createUI?.());
                if(!TextSetter.Subpanel.Sections?.length) TextSetter.discardSubpanel();
            });
        },
        // -----------------------------------------------------------------------------------------------------------------
        X: new Map(), x: (Setter) => {
            if(typeof Setter.Name != 'string' || !Setter.Name || TextSetter.X.has(Setter.Name)) return null;
            Setter = !Setter.IsResizer ? new SETTER(Setter) : new RESIZER(Setter);
            TextSetter.X.set(Setter.Name, Setter);
            return Setter;
        }
    };
    // =========================================================================================================================
    class SETTER {
        static Setters = new Map();
        Settings = new Map();
        constructor(Setter) {
            SETTER.Setters.set(Setter.Name, this);
            this.Setting = this.Settings.set(this, Setter.Setting || {}).get(this);
            Object.assign(this, Setter);
            this.initialize?.();
        };
        distillSetting(Setting, Opt) {
            return typeof Setting != 'object' || !Setting ? null : !Opt?.Changeable ? Setting : null;
        };
        memorize(Ele, NewSettings) {
            const TheSettings = this.Settings.get(Ele) || this.Settings.set(Ele, {}).get(Ele);
            Object.assign(TheSettings, NewSettings);
            return TheSettings;
        };
        remember(Ele, SettingName) {
            if(SettingName) return this.Settings.get(Ele)?.[SettingName];
            return this.Settings.get(Ele);
        };
        static forEachSetter(fn) {
            return Promise.allSettled([...SETTER.Setters.values()].map(Setter => fn(Setter)));
        };
        static prepare() {
            SETTER.forEachSetter(Setter => Setter.REAP = new REAP(Setter));
        };
        static processItemAfterAll(Item) {
            SETTER.forEachSetter(Setter => Setter.REAP.clearItemHarvests(Item)); REAP.clearItemCache(Item);
        };
        static tidy() {
            SETTER.forEachSetter(Setter => Setter.REAP.clearHarvests().then(() => delete Setter.REAP)); REAP.clearCache();
        };
    };
    // -----------------------------------------------------------------------------------------------------------------
    class RESIZER extends SETTER {
        constructor(Setter) { super(Object.assign(Setter, { Setting: Object.assign({ Step: 0, Scale: 1, ScalePerStep: 1.25 }, Setter.Setting || {}) })); };
        setScalePerStep(ScalePerStep) { if(Number.isFinite(ScalePerStep) && ScalePerStep > 1) this.Setting.ScalePerStep = ScalePerStep; };
        getScaleFromStep(Step) {
            return Math.pow(this.Setting.ScalePerStep, Step);
        };
        getStepFromScale(Scale) {
            if(Scale == 1) return 0;
            let Step = 0; const SpS = this.Setting.ScalePerStep;
            if(Scale < 1) while(Step-- > -2 && (Scale *= SpS) < 1);
            else          while(Step++ <  2 && (Scale /= SpS) > 1);
            return Scale == 1 ? Step : undefined;
        };
        distillSetting(Setting, Opt) {
            if(typeof Setting == 'string') switch(Setting) {
                case 'default': Setting = { Step: 0, Scale: 1 }; break;
                default: return null;
            }
            else if(Number.isFinite(Setting)) Setting = { Scale: Setting };
            else if(typeof Setting != 'object' || !Setting) return null;
            let Step  = Number.isInteger(Setting.Step *= 1)                      ? sML.limitMinMax(Setting.Step, -2, 2) : undefined;
            let Scale = Number.isFinite(Setting.Scale *= 1) && Setting.Scale > 0 ?                 Setting.Scale        : undefined;
            if(Step === undefined) { if(Scale === undefined) return null;
                Step = this.getStepFromScale(Scale);
            } else if(Scale === undefined)
                Scale = this.getScaleFromStep(Step);
            return !Opt?.Changeable || Scale != this.Setting.Scale ? { Step: Step, Scale: Scale } : null;
        };
        createStepsUI(SectionLabels, MinMaxLabels, ButtonLabelsIcons) {
            const Setter = this;
            const UI = TextSetter.Subpanel.addSection({ Labels: { default: { default: SectionLabels[0], ja: SectionLabels[1] } } });
            UI.addButtonGroup({ Type: 'Steps',
                MinLabels: { default: { default: MinMaxLabels[0][0], ja: MinMaxLabels[0][1] } },
                MaxLabels: { default: { default: MinMaxLabels[1][0], ja: MinMaxLabels[1][1] } },
                Buttons: (action => {
                    const Buttons = [];
                    for(let i = 0; i < 5; i++) Buttons.push({ Setting: { Step: i - 2 }, Labels: { default: { default: ButtonLabelsIcons[i][0], ja: ButtonLabelsIcons[i][1] } }, Icon: ButtonLabelsIcons[i][2], action: action });
                    return Buttons;
                })(function() { TextSetter.change({ [Setter.Name]: this.Setting }) })
            });
            UI.care = (Setting) => UI.ButtonGroups[0].Buttons.forEach(Button => I.setUIState(Button, Button.Setting.Step != Setting.Step ? 'default' : 'active'));
            UI.care(this.Setting);
            return UI;
        };
    };
    // -----------------------------------------------------------------------------------------------------------------
    class REAP { // Rules-Elements Association around Properties
        Harvests = new Map();
        static Cache = new Map(); // Shared across all Setters. (Items -> Selectors -> Elements)
        static Setters = new Set();
        constructor(Setter) {
            REAP.Setters.add(this.Setter = Setter);
        };
        static extractValue(Sty, Pro, Val) { return Val || ''; };
        prepare(Pro_s, extractValue) {
            this.Harvests.set(Pro_s, {
                   RulesOfItems: new Map(),
                ElementsOfItems: new Map(),
                ElementsOfRules: new Map(),
                   extractValue
            });
        };
        static ownerItemOf(Rule) {
            let Current = Rule, Parent = null;
            while(!Current.documentElement) {
                Parent = Current.parentStyleSheet || Current.ownerRule || Current.ownerNode || Current.ownerDocument;
                if(Parent) Current = Parent; else break;
            } 
            return Current.documentElement?.Item;
        };
        reap(Pro_s, Rule, Item = REAP.ownerItemOf(Rule)) {
            const Sel = Rule.selectorText;
            let Eles = REAP.Cache.get(Item)?.get(Sel);
            if(Eles?.size == 0) return;
            if(!this.isAffecting(Pro_s, Rule)) return;
            if(!Eles) {
                try        { Eles = new Set(Item.contentDocument.querySelectorAll(/* `*:is(${ */ Sel /* }):not(${ TextSetter.Not })` */)); }
                catch(Err) { Eles = new Set(); }
                (REAP.Cache.get(Item) || REAP.Cache.set(Item, new Map()).get(Item)).set(Sel, Eles);
            }
            if(Eles?.size) {
                const { RulesOfItems, ElementsOfItems, ElementsOfRules } = this.Harvests.get(Pro_s);
                (RulesOfItems.get(Item) || RulesOfItems.set(Item, new Set()).get(Item)).add(Rule);
                const ElementsOfItem = (ElementsOfItems.get(Item) || ElementsOfItems.set(Item, new Set()).get(Item));
                const ElementsOfRule = (ElementsOfRules.get(Rule) || ElementsOfRules.set(Rule, new Set()).get(Rule));
                for(const Ele of Eles) ElementsOfItem.add(Ele), ElementsOfRule.add(Ele);
            }
        };
        isAffecting(Pro_s, RuleOrEle) { const Sty = RuleOrEle.style;
            const extractValue = this.Harvests.get(Pro_s)?.extractValue || REAP.extractValue;
            if(typeof Pro_s == 'string') return    !!extractValue(Sty, Pro_s, Sty[Pro_s]);
            else for(const Pro of Pro_s.values()) if(extractValue(Sty, Pro,   Sty[Pro  ])) return true;
            return false;
        };
        isAffected(Pro_s, Ele, Item = Ele.ownerDocument.documentElement.Item, IsInline) {
            const isAffectedInline = this.isAffecting(Pro_s, Ele);
            if(isAffectedInline || IsInline) return isAffectedInline;
            // return this.Harvests.get(Pro_s)?.Elements.has(Ele);
            return this.Harvests.get(Pro_s)?.ElementsOfItems.get(Item)?.has(Ele) || false;
        };
        clearItemHarvests(Item) {
            return new Promise(resolve => setTimeout(() => {
                for(const { RulesOfItems, ElementsOfItems, ElementsOfRules } of this.Harvests.values()) {
                    const Rules = RulesOfItems.get(Item);
                    if(Rules) {
                        for(const Rule of Rules.values()) ElementsOfRules.delete(Rule);
                        Rules.clear(); RulesOfItems.delete(Item);
                    }
                    ElementsOfItems.get(Item)?.clear(); ElementsOfItems.delete(Item);
                }
                resolve();
            }, 0));
        };
        clearHarvests() {
            return new Promise(resolve => setTimeout(() => {
                for(const HarvestsOfProperty of this.Harvests.values()) {
                    const { RulesOfItems, ElementsOfItems, ElementsOfRules } = HarvestsOfProperty;
                    for(const Rules of    RulesOfItems.values()) Rules.clear();    RulesOfItems.clear();
                    for(const  Eles of ElementsOfItems.values())  Eles.clear(); ElementsOfItems.clear();
                    for(const  Eles of ElementsOfRules.values())  Eles.clear(); ElementsOfRules.clear();
                    Object.keys(HarvestsOfProperty).forEach(Key => delete HarvestsOfProperty[Key]);
                }
                this.Harvests.clear();
                resolve();
            }, 0));
        };
        static clearItemCache(Item) {
            return new Promise(resolve => setTimeout(() => {
                const ElesOfSels = REAP.Cache.get(Item);
                if(ElesOfSels) {
                    for(const Eles of ElesOfSels.values()) Eles.clear();
                    ElesOfSels.clear();
                    REAP.Cache.delete(Item);
                }
                resolve();
            }, 0));
        };
        static clearCache() {
            return new Promise(resolve => setTimeout(() => {
                for(const ElesOfSels of REAP.Cache.values()) {
                    for(const Eles of ElesOfSels.values()) Eles.clear();
                    ElesOfSels.clear();
                }
                REAP.Cache.clear();
                resolve();
            }, 0));
        };
        // async log() {
        //     if(!this.Harvests.size) return;
        //     const StylesOfRulesOfItem = new Map();
        //     for(const [Pro_s, { RulesOfItems, ElementsOfItems, ElementsOfRules, extractValue }] of this.Harvests.entries()) {
        //         for(const [Item, Rules] of RulesOfItems.entries()) {
        //             const StylesOfRules = StylesOfRulesOfItem.get(Item) || StylesOfRulesOfItem.set(Item, new Map()).get(Item);
        //             for(const Rule of Rules.values()) {
        //                 const Styles = StylesOfRules.get(Rule) || StylesOfRules.set(Rule, new Set()).get(Rule);
        //                 (typeof Pro_s == 'string' ? [Pro_s] : Pro_s).forEach(Pro => {
        //                     const Val = (extractValue || REAP.extractValue)(Rule.style, Pro, Rule.style[Pro]);
        //                     if(Val) Styles.add(`${ Pro }: ${ Val + (Rule.style.getPropertyPriority(Pro) == 'important' ? ' !important' : '') };`);
        //                 });
        //             }
        //         }
        //     }
        //     if(StylesOfRulesOfItem.size) {
        //         const Logs = [];
        //         for(const [Item, StylesOfRules] of StylesOfRulesOfItem.entries()) {
        //             const ItemLogs = Logs[Item.Index] = [];
        //             ItemLogs.push([`Item[${ String(Item.Index).padStart(3, '0') }] ${ this.Setter.Name }`, '================================================']);
        //             for(const [Rule, Styles] of StylesOfRules) {
        //                 const Sel = Rule.selectorText, Eles = REAP.Cache.get(Item).get(Sel);
        //                 if(!Eles) console.log(this.Setter.Name, Rule, ElesOfSels)
        //                 ItemLogs.push([[Sel, '{', ...Styles, '}'].join(' '), [...Eles]]);
        //             }
        //         }
        //         Logs.filter(Boolean).forEach(ItemLogs => ItemLogs.forEach(Log => console.log(...Log)));
        //     }
        // };
    };
    // =========================================================================================================================
    if(S['use-fontsize-setter']) {
        TextSetter.x({
            Name: 'FontSize', IsResizer: true,
            prepare: function() {
                this.REAP.prepare('font-size', (Sty, Pro, Val) => ((!Number.isNaN(parseFloat(Val)) && !/\d(%|cap|ch|r?em|ex|ic|r?lh)$/.test(Val)) || /^((xx?-)?(small|large)|smaller|larger)$/.test(Val)) ? Val : '');
            },
            processItemBefore: function(Item) {
                const REmPx = parseFloat(getComputedStyle(Item.HTML)['font-size']);
                this.memorize(Item, {
                    REmPx,
                    BaseFontSize: Number.isFinite(S['base-fontsize']) && S['base-fontsize'] > 0 ? sML.limitMinMax(S['base-fontsize'], 10, 30) : REmPx
                });
            },
            processItemCSSRule: function(Item, Rule, CSSStyle) {
                this.REAP.reap('font-size', Rule, Item);
            },
            processItemElement: function(Item, Ele, AttStyle, ComStyle) {
                if(Ele == Item.HTML) return;
                if(this.REAP.isAffected('font-size', Ele, Item)) {
                    const ItemSetting = this.remember(Item);
                    const ComFontSize = ComStyle['font-size'];
                    let Val = parseFloat(ComFontSize) / ItemSetting.REmPx + 'rem';
                    const PEle = Ele.parentElement;
                    if(PEle) {
                        const PComStyle = getComputedStyle(PEle);
                        if(ComFontSize == PComStyle['font-size']) Val = '1em';
                    }
                    AttStyle.setProperty('font-size', Val, 'important');
                }
            },
            processItemAfter: function(Item) {
                const ItemSetting = this.remember(Item);
                Item.HTML.style['font-size'] = ItemSetting.BaseFontSize + 'px';
            },
            changeItem: function(Item, Setting) {
                const ItemSetting = this.remember(Item); if(!ItemSetting) return;
                Item.HTML.style['font-size'] = ItemSetting.BaseFontSize * Setting.Scale + 'px';
            },
            createUI: function() {
                this.UI = this.createStepsUI([`Font Size`, `文字の大きさ`], [
                    [`Small`, `小`], [`Large`, `大`]
                ], [
                    [`Smallest`, `最小`, `<span class="bibi-icon bibi-icon-fontsize bibi-icon-fontsize-smallest"></span>`],
                    [`Smaller`,   `小`,  `<span class="bibi-icon bibi-icon-fontsize bibi-icon-fontsize-smaller"></span>`],
                    [`Default`,  `標準`, `<span class="bibi-icon bibi-icon-fontsize bibi-icon-fontsize-medium"></span>`],
                    [`Larger`,    `大`,  `<span class="bibi-icon bibi-icon-fontsize bibi-icon-fontsize-larger"></span>`],
                    [`Largest`,  `最大`, `<span class="bibi-icon bibi-icon-fontsize bibi-icon-fontsize-largest"></span>`]
                ]);
            }
        }).setScalePerStep(S['fontsize-scale-per-step']);
    }
    // =========================================================================================================================
    if(S['use-linespacing-setter']) {
        const TheLetters = new Map(Object.entries({
            jpn: 'あ', ja: 'あ',   kor: '가', ko: '가',
            zho: '我', zh: '我', 'zh-CN': '我', 'zh-TW': '我', 'zh-HK': '我', 'zh-SG': '我', 'zh-MO': '我',
            ell: 'Α', el: 'Α',
            bul: 'А', bg: 'А', kir: 'А', ky: 'А', mkd: 'А', mk: 'А', mon: 'А', mn: 'А', rus: 'А', ru: 'А', srp: 'А', sr: 'А', tgk: 'А', tg: 'А', ukr: 'А', uk: 'А',
            kat: 'ა', ka: 'ა',  hye: 'Ա', hy: 'Ա',  amh: 'ሀ', am: 'ሀ',
            heb: 'א', he: 'א',  ara: 'ا', ar: 'ا', fas: 'ا', fa: 'ا', pus: 'ا', ps: 'ا', urd: 'ا', ur: 'ا',
            hin: 'अ', hi: 'अ', mar: 'अ', mr: 'अ', nep: 'अ', ne: 'अ',
            ben: 'অ', bn: 'অ',  tam: 'அ', ta: 'அ',  sin: 'අ', si: 'අ',  tha: 'ก', th: 'ก',  lao: 'ກ', lo: 'ກ',  mya: 'က', my: 'က',  khm: 'ក', km: 'ក'
        }));
        const createTextNodeOfTheLetter = (Ele) => {
            let Lang = ''; do { Lang = Ele.getAttribute('lang'); if(Lang) break; } while(Ele = Ele.parentElement);
            return Ele.ownerDocument.createTextNode(TheLetters.get(Lang || B.Language) || 'A');
        };
        const getNormalLineHeight = (Item, Ele, AttStyle = Ele.style, ComStyle = getComputedStyle(Ele)) => {
            const DF = Item.contentDocument.createDocumentFragment(), TNoL = createTextNodeOfTheLetter(Ele);
            const AttStyleValue = Ele.getAttribute('style');
            DF.replaceChildren(...Ele.childNodes);
            AttStyle.setProperty('font-size', '1000px', 'important');
            Ele.appendChild(TNoL);
            const LH = Math.round((/-tb$/.test(ComStyle['writing-mode']) ? Ele.offsetHeight : Ele.offsetWidth) / parseFloat(ComStyle['font-size']) * 1000) / 1000;
            TNoL.remove();
            AttStyleValue ? Ele.setAttribute('style', AttStyleValue) : Ele.removeAttribute('style');
            Ele.replaceChildren(...DF.childNodes);
            return LH;
        };
        const CustomPropertyName = `--Bibi--LineSpacing-Setter--Scale`;
        const letItScalable = (Val) => `calc(${ Val } * var(${ CustomPropertyName }))`;
        const setItemLineHeightScale = (Item, Scale) => Item.HTML.style.setProperty(CustomPropertyName, Scale);
        TextSetter.x({
            Name: 'LineSpacing', IsResizer: true,
            prepare: function() {
                this.REAP.prepare('line-height', (Sty, Pro, Val) => !Number.isNaN(parseFloat(Val)) ? Val : '');
            },
            processItemBefore: function(Item) {
                this.memorize(Item, {
                    NormalRootElements: new Map()
                });
            },
            processItemCSSRule: function(Item, Rule, CSSStyle) {
                this.REAP.reap('line-height', Rule, Item); // exclude table elements with { Not: 'table,thead,tbody,tfoot,th,td' } ...? 
            },
            processItemElement: function(Item, Ele, AttStyle, ComStyle) {
                if(Ele == Item.HTML || ComStyle['line-height'] != 'normal') return;
                let NormalRootElement = false;
                if(Ele == Item.Body) NormalRootElement = true;
                else {
                    const PComStyle = getComputedStyle(Ele.parentElement);
                    if(PComStyle['line-height'] != 'normal' || PComStyle['font-family'] != ComStyle['font-family']) NormalRootElement = true;
                    else if(this.REAP.isAffected('line-height', Ele, Item)) AttStyle.setProperty('line-height', 'inherit', 'important');
                }
                if(NormalRootElement) this.remember(Item).NormalRootElements.set(Ele, getNormalLineHeight(Item, Ele, AttStyle, ComStyle));
            },
            processItemAfter: function(Item) {
                setItemLineHeightScale(Item, 1);
                const Rules = this.REAP.Harvests.get('line-height').RulesOfItems.get(Item);
                if(Rules?.size) {
                    const SSs = Item.contentDocument.styleSheets, SS = SSs[SSs.length - 1];
                    for(const Rule of Rules.values()) SS.insertRule(`${ Rule.selectorText } { line-height: ${ letItScalable(Rule.style['line-height']) + (Rule.style.getPropertyPriority('line-height') == 'important' ? ' !important' : '') }; }`, SS.cssRules.length);
                }
                const ItemSetting = this.remember(Item);
                for(const [Ele, Val] of ItemSetting.NormalRootElements.entries()) Ele.style.setProperty('line-height', letItScalable(Val), 'important');
                ItemSetting.NormalRootElements.clear();
                delete ItemSetting.NormalRootElements;
            },
            changeItem: function(Item, Setting) {
                const ItemSetting = this.remember(Item); if(!ItemSetting) return;
                setItemLineHeightScale(Item, Setting.Scale);
            },
            createUI: function() {
                const TextLineShapes = (TLS => `<span class="bibi-shape bibi-shape-textlines">${ TLS + TLS + TLS + TLS + TLS + TLS + TLS + TLS }</span>`)(`<span class="bibi-shape bibi-shape-textline"></span>`);
                this.UI = this.createStepsUI([`Line Spacing`, `行間`], [
                    [`Narrow`, `狭い`], [`Wide`, `広い`]
                ], [
                    [`Narrowest`, `最小`, `<span class="bibi-icon bibi-icon-linespacing bibi-icon-linespacing-narrowest">${ TextLineShapes }</span>`],
                    [`Narrower`,  `狭い`, `<span class="bibi-icon bibi-icon-linespacing bibi-icon-linespacing-narrower">${ TextLineShapes }</span>`],
                    [`Default`,   `標準`, `<span class="bibi-icon bibi-icon-linespacing bibi-icon-linespacing-medium">${ TextLineShapes }</span>`],
                    [`Wider`,     `広い`, `<span class="bibi-icon bibi-icon-linespacing bibi-icon-linespacing-wider">${ TextLineShapes }</span>`],
                    [`Widest`,    `最大`, `<span class="bibi-icon bibi-icon-linespacing bibi-icon-linespacing-widest">${ TextLineShapes }</span>`]
                ]);
            }
        }).setScalePerStep(S['linespacing-scale-per-step']);
    }
    // =========================================================================================================================
    if(S['use-flowdirection-setter']) {
        const PhysicalProperties = new Set((Boughs => Boughs.reduce((List, Bough) => List.concat(Bough.reduce((ListBough, Twigs) => ListBough.flatMap(ParentName => Twigs.map(Twig => /^@.+@$/.test(ParentName) ? Twig : ParentName.replace(/(@|$)/, Twig))))), []))([
            [ ['margin@', 'padding@'], ['-top', '-right', '-bottom', '-left'] ],
            [ ['border@'], ['@-width', '@-style', '@-color'], ['-top', '-right', '-bottom', '-left'] ],
            [ ['border@-radius'], ['-top-left', '-top-right', '-bottom-right', '-bottom-left'] ],
            [ ['@inset@'], ['top', 'right', 'bottom', 'left'] ],
            [ ['@size@'], ['', 'min-@', 'max-@'], ['width', 'height'] ]
        ]));
        const getLogicalSize = (PSize, WM) =>
            (/^vertical-/.test(WM) ? PSize.replace('height', 'inline').replace('width',  'block') :
                                     PSize.replace('width',  'inline').replace('height', 'block') ) + '-size';
        const getLogicalDirection = (PDir, WM, Dir) =>
            ['inline-start', 'inline-end', 'block-start', 'block-end'][(() => { switch(WM.split('-')[1]) { case 'rl': return Dir == 'ltr' ? 'tbrl' : 'btrl';
                                                                                                           case 'lr': return Dir == 'ltr' ? 'btlr' : 'tblr';
                                                                                                           case 'tb': return Dir == 'ltr' ? 'lrtb' : 'rltb';
                                                                                                           case 'bt': return Dir == 'ltr' ? 'rlbt' : 'lrbt'; }})().indexOf(PDir[0])];
        const getLogicalCornerDirection = (PCorner, WM, Dir) =>
            PCorner.split('-').map(PDir => getLogicalDirection(PDir, WM, Dir)).sort(/* block-inline */).map(LDir => LDir.split('-')[1]).join('-');
        const getLogicalPropertyName = (PPr, WM = 'horizontal-tb', Dir = 'ltr') => {
            if(/^((max|min)-)?(width|height)/.test(PPr)) return getLogicalSize(PPr, WM);
            const Corner = PPr.match(/(top|bottom)-(left|right)/)?.[0];
            if(Corner) return PPr.replace(Corner, getLogicalCornerDirection(Corner, WM, Dir));
            const PDir = PPr.match(/top|right|bottom|left/)?.[0];
            if(PDir) return (PPr == PDir ? 'inset-' : '') + PPr.replace(PDir, getLogicalDirection(PDir, WM, Dir));
            return '';
        };
        const getLineAxis = (WM) => /-(tb|bt)$/.test(WM) ? 'horizontal' : 'vertical';
        const getValueWithPrefix = (Sty, Pro) => Sty[Pro] || Sty['-epub-' + Pro] || Sty['-webkit-' + Pro] || Sty['-moz-' + Pro] || '';
        // -----------------------------------------------------------------------------------------------------------------
        TextSetter.x({
            Name: 'FlowDirection', IsResizer: false,
            Setting: {
                Mode: 'default',
                DefaultWritingMode: B.WritingMode,
                DefaultLineAxis: getLineAxis(B.WritingMode),
                DefaultPageProgressionDirection: B.PPD,
                CentralizedFrontispieceItems: new Set(),
                OrthogonalItems: new Set()
            },
            prepare: function() {
                // Physical
                this.REAP.prepare(PhysicalProperties);
                // writing-mode
                this.REAP.prepare('writing-mode', (Sty, Pro, Val) => getValueWithPrefix(Sty, Pro) || '');
                // text-decoration-line                                                                                                                         // 'text-decoration' for old Safari
                if(B.WritingMode == 'tb-rl') this.REAP.prepare('text-decoration-line', (Sty, Pro, Val) => (getValueWithPrefix(Sty, Pro) || getValueWithPrefix(Sty, 'text-decoration')) == 'overline' ? 'overline' : '');
            },
            processItemBefore: function(Item) {
                if(Item.Outsourcing) return;
                this.memorize(Item, {
                    DefaultWritingMode: Item.WritingMode,
                    DefaultLineAxis: getLineAxis(Item.WritingMode),
                    FlowRootElements: new Set(),
                    OverlinedElements: new Set()
                });
            },
            processItemCSSRule: function(Item, Rule, CSSStyle) {
                if(Item.Outsourcing) return;
                // Physical
                this.REAP.reap(PhysicalProperties, Rule, Item);
                // writing-mode
                this.REAP.reap('writing-mode', Rule, Item);
                // text-decoration-line
                if(B.WritingMode == 'tb-rl') this.REAP.reap('text-decoration-line', Rule, Item);
            },
            processItemElement: function(Item, Ele, AttStyle, ComStyle) {
                if(Item.Outsourcing) return;
                const ItemSetting = this.remember(Item);
                const ComWritingMode = getValueWithPrefix(ComStyle, 'writing-mode');
                // Physical -> Logical
                PhysicalProperties.forEach(PPr => {
                    if(this.REAP.isAffected(PPr, Ele, Item, 'INLINE')) {
                        const LPr = getLogicalPropertyName(PPr, ComWritingMode, ComStyle['direction']);
                        if(LPr) {
                            AttStyle.setProperty(LPr, AttStyle[PPr], AttStyle.getPropertyPriority(PPr));
                            AttStyle.removeProperty(PPr);
                        }
                    }
                });
                // writing-mode
                if(Ele == Item.HTML || this.REAP.isAffected('writing-mode', Ele, Item)) {
                    const PEle = Ele.parentElement;
                    if(PEle) {
                        const PComStyle = getComputedStyle(PEle);
                        if(ComWritingMode == PComStyle['writing-mode']) AttStyle.setProperty('writing-mode', 'inherit', 'important');
                    } else {
                        const DefaultWritingModeStyleValue = getValueWithPrefix(AttStyle, 'writing-mode');
                        this.memorize(Ele, {
                            DefaultWritingModeStyleValue,
                            DefaultWritingMode: DefaultWritingModeStyleValue || ComWritingMode
                        });
                        ItemSetting.FlowRootElements.add(Ele);
                    }
                }
                // text-decoration-line
                if(B.WritingMode == 'tb-rl' && ComWritingMode == 'vertical-rl' && this.REAP.isAffected('text-decoration-line', Ele, Item)) {
                    this.memorize(Ele, { DefaultTextDecorationLineStyleValue: getValueWithPrefix(AttStyle, 'text-decoration-line') });
                    ItemSetting.OverlinedElements.add(Ele);
                }
            },
            processItemAfter: function(Item) {
                if(Item.Outsourcing) return;
                const ItemSetting = this.remember(Item);
                // Physical -> Logical
                const { RulesOfItems, ElementsOfRules } = this.REAP.Harvests.get(PhysicalProperties), Rules = RulesOfItems.get(Item);
                if(Rules?.size) {
                    const RnLsOfRules = new Map(); // RnL: Resetter and Logicalizer
                    for(const Rule of Rules.values()) {
                        const Ele = ElementsOfRules.get(Rule).values().next().value;  if(!Ele) continue;
                        const ComStyle = getComputedStyle(Ele), ComWritingMode = getValueWithPrefix(ComStyle, 'writing-mode'), ComDirection = ComStyle['direction'];
                        PhysicalProperties.forEach(PPr => { if(!Rule.style[PPr]) return;
                            const LPr = getLogicalPropertyName(PPr, ComWritingMode, ComDirection);  if(!LPr) return;
                            const RnL = RnLsOfRules.get(Rule) || RnLsOfRules.set(Rule, [new Map(), new Map()]).get(Rule);
                            const Important = Rule.style.getPropertyPriority(PPr) == 'important' ? ' !important' : '';
                            RnL[0].set(PPr, `${ PPr }: initial${ Important };`);
                            RnL[1].set(LPr, `${ LPr }: ${ Rule.style[PPr] + Important };`);
                        });
                    }
                    if(RnLsOfRules.size) {
                        const SSs = Item.contentDocument.styleSheets, SS = SSs[SSs.length - 1];
                        for(const [Rule, RnL] of RnLsOfRules.entries()) RnL.forEach(Styles => SS.insertRule(Rule.selectorText + ` { ${ [...Styles.values()].join(' ') } }`, SS.cssRules.length));
                    }
                }
                // writing-mode
                if(ItemSetting.FlowRootElements.size == 2 && Item.WritingMode != B.WritingMode) {
                    const TextContentSet = new Set([...ItemSetting.FlowRootElements].map(Ele => Ele.innerText.trim()));
                    if(TextContentSet.size == 1 && TextContentSet.values().next().value) this.Setting.CentralizedFrontispieceItems.add(Item);
                }
                if(!this.Setting.CentralizedFrontispieceItems.has(Item) && ItemSetting.DefaultLineAxis != this.Setting.DefaultLineAxis) this.Setting.OrthogonalItems.add(Item);
            },
            distillSetting: function(Setting, Opt) {
                let Mode = (() => { switch(typeof Setting) {
                    case 'object': return typeof Setting?.Mode == 'string' ? Setting.Mode : '';
                    case 'string': return Setting;
                    default: return '';
                }})();
                switch(Mode) {
                    case 'default': case 'uniformize': case 'alt': break;
                    case     'horizontal': case     'vertical': Mode = this.Setting.DefaultLineAxis == Mode               ? 'default'    : 'alt'; break;
                    case 'uni-horizontal': case 'uni-vertical': Mode = this.Setting.DefaultLineAxis == Mode.split('-')[1] ? 'uniformize' : 'alt'; break;
                    default: return null;
                }
                return !Opt?.Changeable || Mode != this.Setting.Mode ? { Mode } : null;
            },
            changeBeforeItems: function(Setting) {
                if(Setting.Mode != 'alt') {
                    B.WritingMode = this.Setting.DefaultWritingMode;
                    B.PPD         = this.Setting.DefaultPageProgressionDirection;
                } else switch(this.Setting.DefaultWritingMode) {
                    case 'lr-tb': B.WritingMode = 'tb-rl', B.PPD = 'rtl'; break; // wm: vertical-rl,   dir: ltr, ppd: rtl
                    case 'rl-tb': B.WritingMode = 'bt-rl', B.PPD = 'rtl'; break; // wm: vertical-rl,   dir: rtl, ppd: rtl
                    case 'tb-rl': B.WritingMode = 'lr-tb', B.PPD = 'ltr'; break; // wm: horizontal-tb, dir: ltr, ppd: ltr
                    case 'tb-lr': B.WritingMode = 'rl-tb', B.PPD = 'rtl'; break; // wm: horizontal-tb, dir: rtl, ppd: rtl
                }
            },
            changeItem: function(Item, Setting) {
                if(Item.Outsourcing) return;
                const ItemSetting = this.remember(Item); if(!ItemSetting) return;
                if((() => { switch(Setting.Mode) {
                    case 'default':    return true;
                    case 'uniformize': return !this.Setting.OrthogonalItems.has(Item);
                    case 'alt':        return  this.Setting.OrthogonalItems.has(Item);
                }})()) { // Default/Revert
                    // writing-mode
                    ItemSetting.FlowRootElements.forEach(Ele => {
                        const DefaultValue = this.remember(Ele).DefaultWritingModeStyleValue;
                        DefaultValue ? Ele.style.setProperty('writing-mode', DefaultValue, 'important') : Ele.style.removeProperty('writing-mode');
                    });
                    Item.WritingMode = ItemSetting.DefaultWritingMode;
                    Item.HTML.classList.remove('bibi-textsetter-writingmode-alternated');
                    // text-decoration-line
                    ItemSetting.OverlinedElements.forEach(Ele => {
                        const DefaultValue = this.remember(Ele).DefaultTextDecorationLineStyleValue;
                        DefaultValue ? Ele.style.setProperty('text-decoration-line', DefaultValue, 'important') : Ele.style.removeProperty('text-decoration-line');
                    });
                } else { // Alternate
                    // writing-mode
                    const BookDefaultWritingMode = this.Setting.DefaultWritingMode;
                    const BookDefaultLineAxis    = this.Setting.DefaultLineAxis;
                    const getAltValue = this.Setting.CentralizedFrontispieceItems.has(Item) ?
                        (Ele) => Ele == Item.HTML ? /-tb$/.test(BookDefaultWritingMode) ? 'horizontal-tb' : BookDefaultWritingMode.replace(/^tb-(..)$/, 'vertical-$1')
                                                  : /^tb-/.test(BookDefaultWritingMode) ? 'horizontal-tb' : BookDefaultWritingMode.replace(/^(..)-tb$/, 'vertical-$1') :
                        (Ele) => {
                            const EleLineAxis = getLineAxis(this.remember(Ele).DefaultWritingMode);
                            if(Setting.Mode == 'alt' && EleLineAxis != BookDefaultLineAxis) return '';
                            return EleLineAxis == 'horizontal' ? 'vertical-rl' : 'horizontal-tb'; // horizontal-tb => vertical-rl, vertical-rl/lr => horizontal-tb
                        };
                    ItemSetting.FlowRootElements.forEach(Ele => {
                        const AltValue = getAltValue(Ele);
                        if(AltValue) Ele.style.setProperty('writing-mode', AltValue, 'important');
                    });
                    Item.WritingMode = O.getWritingMode(Item.HTML);
                    Item.HTML.classList.add('bibi-textsetter-writingmode-alternated');
                    // text-decoration-line
                    ItemSetting.OverlinedElements.forEach(Ele => Ele.style.setProperty('text-decoration-line', 'underline', 'important'));
                }
                if(ItemSetting.DefaultLineAxis == 'horizontal') Item.HTML.classList.remove(  'bibi-vertical-text'), Item.HTML.classList.add('bibi-horizontal-text');
                else                                            Item.HTML.classList.remove('bibi-horizontal-text'), Item.HTML.classList.add(  'bibi-vertical-text');
            },
            changeAfterItems: function(Setting) {
                S.update();
                E.dispatch('bibi:changed-view', S.RVM);
            },
            createUI: function() {
                const SetterName = this.Name, SetterNameLC = SetterName.toLowerCase();
                const HVs = [['horizontal', 'vertical'], ['Horizontal', 'Vertical'], ['横書き', '縦書き']];
                if(this.Setting.DefaultLineAxis == 'vertical') HVs.forEach((HV, i) => HVs[i] = HV.reverse());
                const _mkUp = (TN, [BCNs, SCNPs], InnerHTML = '') => `<${ TN } class="${ BCNs.reverse().reduce((SCNPs, BCN) => ['', ...SCNPs].map(SCNP => [BCN, SCNP].filter(Boolean).join('-')), SCNPs).join(' ') }">${ InnerHTML }</${ TN }>`;
                this.UI = TextSetter.Subpanel.addSection({ Labels: { default: { default: `Writing Mode`, ja: HVs[2].join(`／`) } } });
                this.UI.addButtonGroup({
                    ButtonType: 'radio',
                    Buttons: [...new Map(this.Setting.OrthogonalItems.size ? [
                        [    'default', { IconHVs: [HVs[0][0], HVs[0][1]], Label: { default: HVs[1][0] + `<small>: partially ${ HVs[1][1] } (Default)</small>`, ja: HVs[2][0] + `<small>・部分的に${ HVs[2][1] }（標準）</small>` } } ],
                        [ 'uniformize', { IconHVs: [HVs[0][0], HVs[0][0]], Label: { default: HVs[1][0] + `<small>: completely</small>`,                         ja: HVs[2][0] + `に統一`                                          } } ],
                        [        'alt', { IconHVs: [HVs[0][1], HVs[0][1]], Label: { default: HVs[1][1] + `<small>: completely</small>`,                         ja: HVs[2][1] + `に統一`                                          } } ]
                    ] : [
                        [    'default', { IconHVs: [HVs[0][0]           ], Label: { default: HVs[1][0] + `<small> (Default)</small>`,                           ja: HVs[2][0] + `<small>（標準）</small>`                         } } ],
                        [        'alt', { IconHVs: [HVs[0][1]           ], Label: { default: HVs[1][1],                                                         ja: HVs[2][1]                                                     } } ]
                    ])].map(([Mode, { IconHVs, Label }]) => ({
                        Setting: { Mode },
                        Icon: _mkUp('span', [['bibi-icon', SetterNameLC], [Mode, IconHVs.join('-')]], IconHVs.map((HV, i) => _mkUp('span', [['bibi-icon-symbol', SetterNameLC], [!i ? 'main' : 'part', HV]])).join('')),
                        Labels: { default: Label },
                        action: function() { TextSetter.change({ [SetterName]: this.Setting }); }
                    }))
                });
                this.UI.care = (Setting) => this.UI.ButtonGroups[0].Buttons.forEach(Button => I.setUIState(Button, Button.Setting.Mode != Setting.Mode ? 'default' : 'active'));
                this.UI.care(this.Setting);
            }
        });
    }
    // =========================================================================================================================
    E.dispatch('bibi:prepared-textsetter');
    TextSetter.initialize();
    E.dispatch('bibi:created-textsetter');
}};


I.Loupe = { create: () => {
    if(S['loupe-max-scale']      <= 1) S['loupe-max-scale']      = 4.0;
    if(S['loupe-scale-per-step'] <= 1) S['loupe-scale-per-step'] = 1.6;
    if(S['loupe-scale-per-step'] > S['loupe-max-scale']) S['loupe-scale-per-step'] = S['loupe-max-scale'];
    const Loupe = I.Loupe = {
        CurrentTransformation: { Scale: 1, TranslateX: 0, TranslateY: 0 },
        defineZoomOutPropertiesForUtilities: () => {
            const Tfm = {}, ReservedSpaceTop = S['use-menubar'] && S['use-full-height'] ? I.Menu.Height : 0;
            if(S.ARA == 'horizontal') {
                const ReservedSpaceBottom = I.Slider.Size;
                if(S.ARA == S.SLA) {
                    const HighestSpreadHeight = Math.max(...R.Spreads.map(Spr => Spr.offsetHeight));
                    if(HighestSpreadHeight < R.Main.offsetHeight - Math.max(ReservedSpaceTop, ReservedSpaceBottom) * 2) return Loupe.ZoomOutPropertiesForUtilities = null;
                    Tfm.Scale = Math.min(1, (R.Main.offsetHeight - (ReservedSpaceTop + ReservedSpaceBottom)) / HighestSpreadHeight);
                    Tfm.TranslateY = (ReservedSpaceTop - ReservedSpaceBottom + O.Scrollbars.Height) / 2;
                } else {
                    Tfm.Scale = (R.Main.offsetHeight - (ReservedSpaceTop + ReservedSpaceBottom)) / R.Main.offsetHeight;
                    Tfm.TranslateY = ReservedSpaceTop - (R.Main.offsetHeight) * (1 - Tfm.Scale) / 2;
                }
                Tfm.TranslateX = 0;
            } else {
                const ReservedSpaceRight = I.Slider.Size;
                if(Math.max(...R.Spreads.map(Spr => Spr.offsetWidth)) + ReservedSpaceRight * 2 < R.Main.offsetWidth) return Loupe.ZoomOutPropertiesForUtilities = null;
                const ScaleW = (R.Main.offsetWidth  - ReservedSpaceRight) / (R.Main.offsetWidth - O.Scrollbars.Width);
                const ScaleH = (R.Main.offsetHeight - ReservedSpaceTop  ) /  R.Main.offsetHeight;
                Tfm.Scale = Math.min(ScaleW, ScaleH);
                Tfm.TranslateX = (Tfm.Scale == ScaleW ? R.Main.offsetWidth * (1 - Tfm.Scale) : (ReservedSpaceRight - O.Scrollbars.Width)) / -2;
                Tfm.TranslateY = ReservedSpaceTop - R.Main.offsetHeight * (1 - Tfm.Scale) / 2;
            }
            const Stc = (O.Body['offset' + C.A_SIZE_L] / Tfm.Scale - R.Main['offset' + C.A_SIZE_L]), OPd = {}, IPd = {};
            OPd[C.A_BASE_B] = OPd[C.A_BASE_A] = Stc / 2; if(!S['use-full-height'] && S.ARA == 'vertical') OPd.Top += I.Menu.Height;
            // if(S.ARA == S.SLA) IPd[S.ARA == 'horizontal' ? 'Right' : 'Bottom'] = Stc / 2;
            return Loupe.ZoomOutPropertiesForUtilities = { Transformation: Tfm, Stretch: Stc, OuterPadding: OPd, /*InnerPadding: IPd*/ };
        },
        getNormalizedTransformation: (Tfm) => {
            const NTfm = Object.assign({}, Loupe.CurrentTransformation);
            if(Tfm) {
                if(typeof Tfm.Scale      == 'number') NTfm.Scale      = Tfm.Scale;
                if(typeof Tfm.TranslateX == 'number') NTfm.TranslateX = Tfm.TranslateX;
                if(typeof Tfm.TranslateY == 'number') NTfm.TranslateY = Tfm.TranslateY;
            }
            return NTfm;
        },
        getActualTransformation: (Tfm) => {
            const ATfm = Loupe.getNormalizedTransformation(Tfm);
            if(ATfm.Scale == 1 && Loupe.IsZoomedOutForUtilities) {
                const Tfm4U = Loupe.ZoomOutPropertiesForUtilities.Transformation;
                ATfm.Scale      *= Tfm4U.Scale;
                ATfm.TranslateX += Tfm4U.TranslateX;
                ATfm.TranslateY += Tfm4U.TranslateY;
            }
            return ATfm;
        },
        transform: (Tfm, Opt = {}) => new Promise((resolve, reject) => {
            // Tfm: Transformation
            Tfm = Loupe.getNormalizedTransformation(Tfm);
            const PTfm = Loupe.CurrentTransformation;
            //if(Tfm.Scale == PTfm.Scale && Tfm.TranslateX == PTfm.TranslateX && Tfm.TranslateY == PTfm.TranslateY) return resolve();
            Loupe.Transforming = true;
            clearTimeout(Loupe.Timer_onTransformEnd);
            O.HTML.classList.add('transforming');
            if(Tfm.Scale > 1) {
                const OverflowX = window.innerWidth  * (0.5 * (Tfm.Scale - 1)),
                      OverflowY = window.innerHeight * (0.5 * (Tfm.Scale - 1));
                Tfm.TranslateX = sML.limitMinMax(Tfm.TranslateX, OverflowX * -1 - (S.RVM != 'vertical' ? 0 : I.Slider.UIState == 'active' ? I.Slider.Size - O.Scrollbars.Width  : 0) + O.Scrollbars.Width , OverflowX);
                Tfm.TranslateY = sML.limitMinMax(Tfm.TranslateY, OverflowY * -1 - (S.RVM == 'vertical' ? 0 : I.Slider.UIState == 'active' ? I.Slider.Size - O.Scrollbars.Height : 0) + O.Scrollbars.Height, OverflowY + (I.Menu.UIState == 'active' ? I.Menu.Height : 0));
            }
            Loupe.CurrentTransformation = Tfm;
            const ATfm = Loupe.getActualTransformation(Tfm);
            sML.style(R.Main, {
                transform: (Ps => {
                         if(ATfm.TranslateX && ATfm.TranslateY) Ps.push( 'translate(' + ATfm.TranslateX + 'px' + ', ' + ATfm.TranslateY + 'px' + ')');
                    else if(ATfm.TranslateX                   ) Ps.push('translateX(' + ATfm.TranslateX + 'px'                                 + ')');
                    else if(                   ATfm.TranslateY) Ps.push('translateY('                                 + ATfm.TranslateY + 'px' + ')');
                         if(ATfm.Scale != 1                   ) Ps.push(     'scale(' + ATfm.Scale                                             + ')');
                    return Ps.length ? Ps.join(' ') : '';
                })([])
            });
            Loupe.Timer_onTransformEnd = setTimeout(() => {
                     if(Loupe.CurrentTransformation.Scale == 1) O.HTML.classList.remove('zoomed-in'), O.HTML.classList.remove('zoomed-out');
                else if(Loupe.CurrentTransformation.Scale <  1) O.HTML.classList.remove('zoomed-in'), O.HTML.classList.add(   'zoomed-out');
                else                                            O.HTML.classList.add(   'zoomed-in'), O.HTML.classList.remove('zoomed-out');
                O.HTML.classList.remove('transforming');
                Loupe.Transforming = false;
                resolve();
                E.dispatch('bibi:transformed-book', {
                    Transformation: Tfm,
                    ActualTransformation: ATfm,
                    PreviousTransformation: PTfm,
                    Temporary: Opt.Temporary
                });
            }, 345);
        }),
        scale: (Scl, Opt = {}) => { // Scl: Scale
            Scl = typeof Scl == 'number' ? sML.limitMinMax(Scl, 1, S['loupe-max-scale']) : 1;
            if(!Opt.Stepless) Scl = Math.round(Scl * 100) / 100;
            const CTfm = Loupe.CurrentTransformation;
            if(Scl == CTfm.Scale) return Promise.resolve();
            E.dispatch('bibi:changes-scale', Scl);
            let TX = 0, TY = 0;
            if(Scl < 1) {
                TX = R.Main.offsetWidth  * (1 - Scl) / 2;
                TY = R.Main.offsetHeight * (1 - Scl) / 2;
            } else if(Scl > 1) {
                if(Loupe.UIState != 'active') return Promise.resolve();
                if(!Opt.Center) Opt.Center = { X: window.innerWidth / 2, Y: window.innerHeight / 2 };
                TX = CTfm.TranslateX + (Opt.Center.X - window.innerWidth  / 2 - CTfm.TranslateX) * (1 - Scl / CTfm.Scale);
                TY = CTfm.TranslateY + (Opt.Center.Y - window.innerHeight / 2 - CTfm.TranslateY) * (1 - Scl / CTfm.Scale);
                /* ↑↑↑↑ SIMPLIFIED ↑↑↑↑
                const CTfmOriginX = window.innerWidth  / 2 + CTfm.TranslateX;  TX = CTfm.TranslateX + (Opt.Center.X - (CTfmOriginX + (Opt.Center.X - CTfmOriginX) * (Scl / CTfm.Scale)));
                const CTfmOriginY = window.innerHeight / 2 + CTfm.TranslateY;  TY = CTfm.TranslateY + (Opt.Center.Y - (CTfmOriginY + (Opt.Center.Y - CTfmOriginY) * (Scl / CTfm.Scale)));
                //*/
            }
            return Loupe.transform({
                Scale: Scl,
                TranslateX: TX,
                TranslateY: TY
            });
        },
        BookStretchingEach: 0,
        transformToDefault: () => Loupe.transform({ Scale: 1, TranslateX: 0, TranslateY: 0 }),
        transformForUtilities: (IO) => {
            if(!Loupe.isAvailable() || !Loupe.ZoomOutPropertiesForUtilities) return Promise.resolve();
            const before = () => O.HTML.classList.add(   'transforming-for-utilities');
            const  after = () => O.HTML.classList.remove('transforming-for-utilities');
            let cb = () => {};
            if(IO) {
                if(Loupe.IsZoomedOutForUtilities) return Promise.resolve();
                before();
                Loupe.IsZoomedOutForUtilities = true;
                const OP4U = Loupe.ZoomOutPropertiesForUtilities.OuterPadding/*, IP4U = Loupe.ZoomOutPropertiesForUtilities.InnerPadding*/;
                for(const Dir in OP4U) R.Main.style[     'padding' + Dir] = OP4U[Dir] + 'px';
                // for(const Dir in IP4U) R.Main.Book.style['padding' + Dir] = IP4U[Dir] + 'px';
                Loupe.BookStretchingEach = Loupe.ZoomOutPropertiesForUtilities.Stretch / 2;
                cb = () => {
                    O.HTML.classList.add('zoomed-out-for-utilities');
                    after();
                };
            } else {
                if(!Loupe.IsZoomedOutForUtilities) return Promise.resolve();
                before();
                O.HTML.classList.remove('zoomed-out-for-utilities');
                Loupe.IsZoomedOutForUtilities = false;
                cb = () => {
                    R.Main.style.padding = R.Main.Book.style.padding = '';
                    Loupe.BookStretchingEach = 0;
                    after();
                };
            }
            return Loupe.transform(null, { Temporary: true }).then(cb).then(() => I.Slider.ownerDocument ? I.Slider.progress() : undefined);
        },
        isAvailable: () => {
            if(!L.Opened) return false;
            if(Loupe.UIState != 'active') return false;
            //if(B.Reflowable) return false;
            return true;
        },
        checkBibiEventForTaps: (BibiEvent) => {
            if(!BibiEvent || !Loupe.isAvailable()) return false;
            if(BibiEvent.target.tagName) {
                if(/bibi-menu|bibi-slider/.test(BibiEvent.target.id)) return false;
                if(O.isPointableContent(BibiEvent.target)) return false;
                if(S.RVM == 'horizontal' && BibiEvent.Coord.Y > window.innerHeight - O.Scrollbars.Height) return false;
            }
            return true;
        },
        onTap: (BibiEvent) => {
            if(!Loupe.checkBibiEventForTaps(BibiEvent)) return Promise.resolve();
            BibiEvent.preventDefault();
            try { BibiEvent.target.ownerDocument.body.Item.contentWindow.getSelection().empty(); } catch(Err) {}
            if(Loupe.CurrentTransformation.Scale >= S['loupe-max-scale'] && !BibiEvent.shiftKey) return Loupe.scale(1);
            return Loupe.scale(Loupe.CurrentTransformation.Scale * (BibiEvent.shiftKey ? 1 / S['loupe-scale-per-step'] : S['loupe-scale-per-step']), { Center: BibiEvent.Coord });
        },
        onPointerDown: (BibiEvent) => {
            Loupe.PointerDownCoord = BibiEvent.Coord;
            Loupe.PointerDownTransformation = {
                Scale: Loupe.CurrentTransformation.Scale,
                TranslateX: Loupe.CurrentTransformation.TranslateX,
                TranslateY: Loupe.CurrentTransformation.TranslateY
            };
        },
        onPointerUp: (BibiEvent) => {
            O.HTML.classList.remove('dragging');
            Loupe.Dragging = false;
            delete Loupe.PointerDownCoord;
            delete Loupe.PointerDownTransformation;
        },
        onPointerMove: (BibiEvent) => {
            if(I.PinchObserver.Hot) return false;
            if(!Loupe.isAvailable()) return false;
            if(Loupe.CurrentTransformation.Scale == 1 || !Loupe.PointerDownCoord) return false;
            BibiEvent.preventDefault();
            Loupe.Dragging = true;
            O.HTML.classList.add('dragging');
            clearTimeout(Loupe.Timer_TransitionRestore);
            sML.style(R.Main, { transition: 'none' }, { cursor: 'move' });
            Loupe.transform({
                Scale: Loupe.CurrentTransformation.Scale,
                TranslateX: Loupe.PointerDownTransformation.TranslateX + (BibiEvent.Coord.X - Loupe.PointerDownCoord.X),
                TranslateY: Loupe.PointerDownTransformation.TranslateY + (BibiEvent.Coord.Y - Loupe.PointerDownCoord.Y)
            });
            Loupe.Timer_TransitionRestore = setTimeout(() => sML.style(R.Main, { transition: '' }, { cursor: '' }), 234);
        }
    };
    I.isPointerStealth.addChecker(() => {
        if(Loupe.Dragging) return true;
        if(!I.KeyObserver.ActiveKeys || !I.KeyObserver.ActiveKeys['Space']) return false;
        return true;
    });
    I.setToggleAction(Loupe, {
        onopened: () => {
            //Loupe.defineZoomOutPropertiesForUtilities();
            O.HTML.classList.add('loupe-active');
        },
        onclosed: () => {
            Loupe.transformToDefault();
            O.HTML.classList.remove('loupe-active');
        }
    });
    E.add('bibi:commands:activate-loupe',   (   ) => Loupe.open());
    E.add('bibi:commands:deactivate-loupe', (   ) => Loupe.close());
    E.add('bibi:commands:toggle-loupe',     (   ) => Loupe.toggle());
    E.add('bibi:commands:scale',            Scale => Loupe.scale(Scale));
    if(S['on-doubletap'            ] == 'zoom') E.add('bibi:doubletapped',             BibiEvent => Loupe.onTap(BibiEvent));
    if(S['on-tripletap'            ] == 'zoom') E.add('bibi:tripletapped',             BibiEvent => Loupe.onTap(BibiEvent));
    if(S['on-singletap-with-altkey'] == 'zoom') E.add('bibi:singletapped-with-altkey', BibiEvent => Loupe.onTap(BibiEvent));
    if(S['on-doubletap-with-altkey'] == 'zoom') E.add('bibi:doubletapped-with-altkey', BibiEvent => Loupe.onTap(BibiEvent));
    if(S['on-tripletap-with-altkey'] == 'zoom') E.add('bibi:tripletapped-with-altkey', BibiEvent => Loupe.onTap(BibiEvent));
    E.add('bibi:downed-pointer', BibiEvent => Loupe.onPointerDown(BibiEvent));
    E.add('bibi:upped-pointer',  BibiEvent => Loupe.onPointerUp(  BibiEvent));
    E.add('bibi:moved-pointer',  BibiEvent => Loupe.onPointerMove(BibiEvent));
    if(S['zoom-out-for-utilities']) {
        E.add('bibi:opens-utilities',  () => Loupe.transformForUtilities(true ));
        E.add('bibi:closes-utilities', () => Loupe.transformForUtilities(false));
    }
    E.add('bibi:opened', () => Loupe.open());
    E.add('bibi:laid-out', () => Loupe.defineZoomOutPropertiesForUtilities());
    E.add('bibi:changed-view',  () => Loupe.transformToDefault());
    if(S['use-loupe-ui']) E.bind('bibi:loaded-book', () => {
        const ButtonGroup = I.Menu.R.addButtonGroup({
            // Lively: true,
            Type: 'Tiled',
            id: 'bibi-buttongroup_loupe',
            Buttons: [{
                Labels: { default: { default: `Zoom-in`, ja: `拡大する` } },
                Icon: `<span class="bibi-icon bibi-icon-loupe bibi-icon-loupe-zoomin"></span>`,
                Help: true,
                action: () => Loupe.scale(Loupe.CurrentTransformation.Scale * S['loupe-scale-per-step']),
                updateState: function(State) { I.setUIState(this, typeof State == 'string' ? State : (Loupe.CurrentTransformation.Scale >= S['loupe-max-scale']) ? 'disabled' : 'default'); }
            }, { 
                Labels: { default: { default: `Reset Zoom-in/out`, ja: `元のサイズに戻す` } },
                Icon: `<span class="bibi-icon bibi-icon-loupe bibi-icon-loupe-reset"></span>`,
                Help: true,
                action: () => Loupe.scale(1),
                updateState: function(State) { I.setUIState(this, typeof State == 'string' ? State : (Loupe.CurrentTransformation.Scale == 1) ? 'disabled' : 'default'); }
            }, {
                Labels: { default: { default: `Zoom-out`, ja: `縮小する` } },
                Icon: `<span class="bibi-icon bibi-icon-loupe bibi-icon-loupe-zoomout"></span>`,
                Help: true,
                action: () => Loupe.scale(Loupe.CurrentTransformation.Scale / S['loupe-scale-per-step']),
                updateState: function(State) { I.setUIState(this, typeof State == 'string' ? State : (Loupe.CurrentTransformation.Scale <= 1) ? 'disabled' : 'default'); }
            }]
        });
        Loupe.updateButtonState = (State) => ButtonGroup.Buttons.forEach(Button => Button.updateState(State));
        E.add('bibi:opened',           () => Loupe.updateButtonState());
        E.add('bibi:transformed-book', () => Loupe.updateButtonState());
    });
    E.dispatch('bibi:created-loupe');
}};


I.Nombre = { create: () => { if(!S['use-nombre']) return;
    const Nombre = I.Nombre = O.Body.appendChild(sML.create('div', { id: 'bibi-nombre',
        clearTimers: () => {
            clearTimeout(Nombre.Timer_hot);
            clearTimeout(Nombre.Timer_vanish);
            clearTimeout(Nombre.Timer_autohide);
        },
        show: () => {
            Nombre.clearTimers();
            Nombre.classList.add('active');
            Nombre.Timer_hot = setTimeout(() => Nombre.classList.add('hot'), 10);
        },
        hide: () => {
            Nombre.clearTimers();
            Nombre.classList.remove('hot');
            Nombre.Timer_vanish = setTimeout(() => Nombre.classList.remove('active'), 255);
        },
        progress: (PageInfo) => {
            Nombre.clearTimers();
            if(!PageInfo) PageInfo = I.PageObserver.Current;
            if(!PageInfo.List.length) return; ////////
            const StartPageNumber = PageInfo.List[          0].Page.Index + 1;
            const   EndPageNumber = PageInfo.List.slice(-1)[0].Page.Index + 1;
            const Percent = Math.floor((EndPageNumber) / R.Pages.length * 100);
            Nombre.Current.innerHTML = (() => {
                let PageNumber = StartPageNumber; if(StartPageNumber != EndPageNumber) PageNumber += `<span class="delimiter">-</span>` + EndPageNumber;
                return PageNumber;
            })();
            Nombre.Delimiter.innerHTML = `/`;
            Nombre.Total.innerHTML     = R.Pages.length;
            Nombre.Percent.innerHTML   = `(${ Percent }<span class="unit">%</span>)`;
            Nombre.show();
            if(I.Slider.UIState != 'active') Nombre.Timer_autohide = setTimeout(Nombre.hide, 1234);
        }
    }));
    Nombre.Current   = Nombre.appendChild(sML.create('span', { className: 'bibi-nombre-current'   }));
    Nombre.Delimiter = Nombre.appendChild(sML.create('span', { className: 'bibi-nombre-delimiter' }));
    Nombre.Total     = Nombre.appendChild(sML.create('span', { className: 'bibi-nombre-total'     }));
    Nombre.Percent   = Nombre.appendChild(sML.create('span', { className: 'bibi-nombre-percent'   }));
    E.add('bibi:opened' , () => setTimeout(() => {
        Nombre.progress();
        E.add(['bibi:keeps-scrolling', 'bibi:scrolled', 'bibi:opened-slider'], () => Nombre.progress());
        E.add('bibi:closed-slider', Nombre.hide);
    }, 321));
    sML.appendCSSRule('html.view-paged div#bibi-nombre',      'bottom: ' + (O.Scrollbars.Height + 2) + 'px;');
    sML.appendCSSRule('html.view-horizontal div#bibi-nombre', 'bottom: ' + (O.Scrollbars.Height + 2) + 'px;');
    sML.appendCSSRule('html.view-vertical div#bibi-nombre',    'right: ' + (O.Scrollbars.Height + 2) + 'px;');
    E.dispatch('bibi:created-nombre');
}};


I.History = {
    List: [], Updaters: [],
    update: () => I.History.Updaters.forEach(fun => fun()),
    add: (Opt = {}) => { if(!S['use-histories']) return null;
        if(!Opt.UI) Opt.UI = Bibi;
        const PageToBeAdded = Opt.Destination ? R.getPage(Opt.Destination) : (() => { I.PageObserver.updateCurrent(); const C0 = I.PageObserver.Current.List[0]; return C0 ? C0.Page : null; })(); // Current.List can be empty mid-relayout: reading .Page off undefined threw TypeError
        let Added = null;
        const LastHistory = I.History.List.slice(-1)[0];
        if(PageToBeAdded != R.getPage(LastHistory)) {
            if(Opt.SumUp && LastHistory && LastHistory.UI == Opt.UI) I.History.List.pop(); // List can be empty before the first entry: reading .UI off undefined threw TypeError
            Added = { UI: Opt.UI, Page: PageToBeAdded };
            I.History.List.push(Added);
            if(I.History.List.length - 1 > S['max-histories']) { // Not count the first (oldest).
                const First = I.History.List.shift(); // The first (oldest) is the landing point.
                I.History.List.shift(); // Remove the second
                I.History.List.unshift(First); // Restore the first (oldest).
            }
        }
        I.History.update();
        return Added;
    },
    back: () => {
        if(I.History.List.length <= 1) return Promise.reject();
        I.History.List.pop();
        I.History.update();
        return R.focusOn(R.getPage(I.History.List.slice(-1)[0]), { Duration: 0 });
    }
};


I.Slider = { create: () => {
    if(!S['use-slider']) return false;
    O.HTML.classList.add('slider-active');
    const Slider = I.Slider = O.Body.appendChild(sML.create('div', { id: 'bibi-slider',
        RailProgressMode: 'end', // or 'center'
        Size: I.Slider.Size,
        initialize: () => {
            const EdgebarBox = Slider.appendChild(sML.create('div', { id: 'bibi-slider-edgebar-box' }));
            Slider.Edgebar = EdgebarBox.appendChild(sML.create('div', { id: 'bibi-slider-edgebar' }));
            Slider.Rail    = EdgebarBox.appendChild(sML.create('div', { id: 'bibi-slider-rail' }));
            Slider.RailGroove   = Slider.Rail.appendChild(sML.create('div', { id: 'bibi-slider-rail-groove' }));
            Slider.RailProgress = Slider.RailGroove.appendChild(sML.create('div', { id: 'bibi-slider-rail-progress' }));
            Slider.Thumb   = EdgebarBox.appendChild(sML.create('div', { id: 'bibi-slider-thumb', Labels: { default: { default: `Slider Thumb`, ja: `スライダー上の好きな位置からドラッグを始められます` } } })); I.setFeedback(Slider.Thumb);
            if(S['use-history-ui']) {
                Slider.classList.add('bibi-slider-with-history');
                Slider.History        = Slider.appendChild(sML.create('div', { id: 'bibi-slider-history' }));
                Slider.History.Button = Slider.History.appendChild(I.createButtonGroup()).addButton({ id: 'bibi-slider-history-button',
                    Type: 'normal',
                    Labels: { default: { default: `History Back`, ja: `移動履歴を戻る` } },
                    Help: false,
                    Icon: `<span class="bibi-icon bibi-icon-history"></span>`,
                    action: () => I.History.back(),
                    update: function() {
                        this.Icon.style.transform = `rotate(${ 360 * (I.History.List.length - 1) }deg)`;
                             if(I.History.List.length <= 1) I.setUIState(this, 'disabled');
                        else if(this.UIState == 'disabled') I.setUIState(this, 'default');
                    }
                });
                I.History.Updaters.push(() => Slider.History.Button.update());
            }
            if(S['use-nombre']) {
                E.add(Slider.Edgebar, ['mouseover', 'mousemove'], Eve => { if(!Slider.Touching) I.Nombre.progress({ List: [{ Page: Slider.getPointedPage(E.aBCD(Eve).Coord[C.A_AXIS_L]) }] }); });
                E.add(Slider.Edgebar,  'mouseout',                Eve => { if(!Slider.Touching) I.Nombre.progress(); });
            }
        },
        resetUISize: () => {
            Slider.MainLength = R.Main['scroll' + C.L_SIZE_L];
            const ThumbLengthPercent = R.Main['offset' + C.L_SIZE_L] / Slider.MainLength * 100;
            Slider.RailGroove.style[C.A_SIZE_b] = Slider.Thumb.style[C.A_SIZE_b] = '';
            Slider.RailGroove.style[C.A_SIZE_l] = (100 - (Slider.RailProgressMode == 'center' ? ThumbLengthPercent : 0)) + '%';
                 Slider.Thumb.style[C.A_SIZE_l] =                                               ThumbLengthPercent       + '%';
            setTimeout(() => Slider.Thumb.classList.toggle('min', (STACS => STACS.width == STACS.height)(getComputedStyle(Slider.Thumb, '::after'))), 0);
               Slider.Edgebar.Before = O.getElementCoord(Slider.Edgebar)[C.A_AXIS_L];
               Slider.Edgebar.Length = Slider.Edgebar['offset' + C.A_SIZE_L];
               Slider.Edgebar.After  = Slider.Edgebar.Before + Slider.Edgebar.Length;
            Slider.RailGroove.Before = O.getElementCoord(Slider.RailGroove)[C.A_AXIS_L];
            Slider.RailGroove.Length = Slider.RailGroove['offset' + C.A_SIZE_L];
            Slider.RailGroove.After  = Slider.RailGroove.Before + Slider.RailGroove.Length;
                 Slider.Thumb.Length = Slider.Thumb['offset' + C.A_SIZE_L];
        },
        onTouchStart: (BibiEvent) => {
            I.ScrollObserver.forceStopScrolling();
            clearTimeout(Slider.Timer_onTouchEnd);
            BibiEvent.preventDefault();
            Slider.Touching = true;
            Slider.StartedAt = {
                ThumbBefore: O.getElementCoord(Slider.Thumb)[C.A_AXIS_L],
                RailProgressLength: Slider.RailProgress['offset' + C.A_SIZE_L],
                MainScrollBefore: Math.ceil(R.Main['scroll' + C.L_OOBL_L]) // Android Chrome returns scrollLeft/Top value of an element with slightly less float than actual.
            };
            Slider.StartedAt.Coord = BibiEvent.target == Slider.Thumb ? BibiEvent.Coord[C.A_AXIS_L] : Slider.StartedAt.ThumbBefore + Slider.Thumb.Length / 2; // ← ? <Move Thumb naturally> : <Bring Thumb's center to the touched coord at the next pointer moving>
            O.HTML.classList.add('slider-sliding');
            Slider.onTouchUpdate(BibiEvent);
            E.add('bibi:moved-pointer', Slider.onTouchMove);
        },
        onTouchUpdate: (BibiEvent) => {
            Slider.LastEvent = BibiEvent;
            const TouchingCoord = BibiEvent.Coord[C.A_AXIS_L];
            Slider.progressTemporarily(TouchingCoord);
            if(S['flip-pages-during-sliding']) Slider.flipPagesDuringSliding(TouchingCoord);
        },
            progressTemporarily: (TouchingCoord) => {
                const Translation = sML.limitMinMax(TouchingCoord - Slider.StartedAt.Coord,
                    Slider.Edgebar.Before -  Slider.StartedAt.ThumbBefore,
                    Slider.Edgebar.After  - (Slider.StartedAt.ThumbBefore + Slider.Thumb.Length)
                );
                sML.style(Slider.Thumb,        { transform: 'translate' + C.A_AXIS_L + '(' + Translation + 'px)' });
                sML.style(Slider.RailProgress, { [C.A_SIZE_l]: (Slider.StartedAt.RailProgressLength + Translation * (S.ARD == 'rtl' ? -1 : 1)) + 'px' });
            },
            flipPagesDuringSliding: (TouchingCoord) => {
                R.DoNotTurn = true; Slider.flip(TouchingCoord);
                clearTimeout(Slider.Timer_flipPagesDuringSliding);
                Slider.Timer_flipPagesDuringSliding = setTimeout(() => { R.DoNotTurn = false; Slider.flip(TouchingCoord, 'TURN-FORCE'); }, 333);
            },
        onTouchMove: (BibiEvent) => {
            if(BibiEvent.buttons === 0) return Slider.onTouchEnd(Slider.LastEvent);
            Slider.onTouchUpdate(BibiEvent);
        },
        onTouchEnd: (BibiEvent) => {
            if(!Slider.Touching) return;
            clearTimeout(Slider.Timer_flipPagesDuringSliding);
            Slider.Touching = false;
            E.remove('bibi:moved-pointer', Slider.onTouchMove);
            const TouchEndCoord = BibiEvent.Coord[C.A_AXIS_L];
            if(TouchEndCoord == Slider.StartedAt.Coord) Slider.StartedAt.Coord = Slider.StartedAt.ThumbBefore + Slider.Thumb.Length / 2;
            R.DoNotTurn = false;
            Slider.flip(TouchEndCoord, 'TURN-FORCE').then(() => {
                sML.style(Slider.Thumb,        { transform: '' });
                sML.style(Slider.RailProgress, { [C.A_SIZE_l]: '' });
                Slider.progress();
                if(!S['manualize-adding-histories']) I.History.add({ UI: Slider, SumUp: false, Destination: null });
            });
            delete Slider.StartedAt;
            delete Slider.LastEvent;
            Slider.Timer_onTouchEnd = setTimeout(() => O.HTML.classList.remove('slider-sliding'), 123);
        },
        flip: (TouchedCoord, TurnForce) => new Promise(resolve => { switch(S.RVM) {
            case 'paged':
                const TargetPage = Slider.getPointedPage(TouchedCoord);
                return I.PageObserver.Current.Pages.includes(TargetPage) ? resolve() : R.focusOn(TargetPage, { Duration: 0 }).then(() => resolve());
            default:
                R.Main['scroll' + C.L_OOBL_L] = Slider.StartedAt.MainScrollBefore + (TouchedCoord - Slider.StartedAt.Coord) * (Slider.MainLength / Slider.Edgebar.Length);
                return resolve();
        } }).then(() => {
            if(TurnForce) I.Turner.turnItems();
        }),
        progress: () => {
            if(Slider.Touching) return;
            let MainScrollBefore = Math.ceil(R.Main['scroll' + C.L_OOBL_L]); // Android Chrome returns scrollLeft/Top value of an element with slightly less float than actual.
            if(S.ARA != S.SLA && S.ARD == 'rtl') MainScrollBefore = Slider.MainLength - MainScrollBefore - R.Main.offsetHeight; // <- Paged (HorizontalAppearance) && VerticalText
            switch(S.ARA) {
                case 'horizontal': Slider.Thumb.style.top  = '', Slider.RailProgress.style.height = ''; break;
                case   'vertical': Slider.Thumb.style.left = '', Slider.RailProgress.style.width  = ''; break;
            }
            Slider.Thumb.style[C.A_OOBL_l] = (MainScrollBefore / Slider.MainLength * 100) + '%';
            Slider.RailProgress.style[C.A_SIZE_l] = Slider.getRailProgressLength(O.getElementCoord(Slider.Thumb)[C.A_AXIS_L] - Slider.RailGroove.Before) / Slider.RailGroove.Length * 100 + '%';
        },
        getRailProgressLength: (_) => (Slider.getRailProgressLength = Slider.RailProgressMode == 'center' ? // switch and define at the first call.
            (ThumbBeforeInRailGroove) => S.ARD != 'rtl' ? ThumbBeforeInRailGroove + Slider.Thumb.Length / 2 : Slider.RailGroove.Length - (ThumbBeforeInRailGroove + Slider.Thumb.Length / 2) :
            (ThumbBeforeInRailGroove) => S.ARD != 'rtl' ? ThumbBeforeInRailGroove + Slider.Thumb.Length     : Slider.RailGroove.Length -  ThumbBeforeInRailGroove
        )(_),
        getPointedPage: (PointedCoord) => {
            let RatioInSlider = (PointedCoord - Slider.Edgebar.Before) / Slider.Edgebar['offset' + C.A_SIZE_L];
            const OriginPageIndex = sML.limitMinMax(Math.round(R.Pages.length * (S.ARD == 'rtl' ? 1 - RatioInSlider : RatioInSlider)), 0, R.Pages.length - 1);
            const PointedCoordInBook = R.Main['scroll' + C.L_SIZE_L] * (S.ARD == 'rtl' && S.SLD == 'ttb' ? 1 - RatioInSlider : RatioInSlider);
            let ThePage = R.Pages[OriginPageIndex], MinDist = Slider.getPageDistanceFromPoint(ThePage, PointedCoordInBook);
            [-1, 1].forEach(PM => { for(let i = OriginPageIndex + PM; R.Pages[i]; i += PM) {
                const Page = R.Pages[i], Dist = Slider.getPageDistanceFromPoint(Page, PointedCoordInBook);
                if(Dist < MinDist) ThePage = Page, MinDist = Dist; else break;
            } });
            return ThePage;
        },
        getPageDistanceFromPoint: (Page, PointedCoordInBook) => {
            return Math.abs(PointedCoordInBook - (O.getElementCoord(Page, R.Main)[C.L_AXIS_L] + Page['offset' + C.L_SIZE_L] * 0.5));
        }
    }));
    Slider.initialize();
    I.setToggleAction(Slider, {
        onopened: () => {
            O.HTML.classList.add('slider-opened');
            setTimeout(Slider.resetUISize, 0);
            E.dispatch('bibi:opened-slider');
        },
        onclosed: () => {
            new Promise(resolve => setTimeout(resolve, S['zoom-out-for-utilities'] ? 111 : 0));
            O.HTML.classList.remove('slider-opened');
            setTimeout(Slider.resetUISize, 0);
            E.dispatch('bibi:closed-slider');
        }
    });
    E.add('bibi:commands:open-slider',   Slider.open);
    E.add('bibi:commands:close-slider',  Slider.close);
    E.add('bibi:commands:toggle-slider', Slider.toggle);
    E.add('bibi:opens-utilities',   Opt => E.dispatch('bibi:commands:open-slider',   Opt));
    E.add('bibi:closes-utilities',  Opt => E.dispatch('bibi:commands:close-slider',  Opt));
    E.add('bibi:loaded-item', Item => Item.HTML.addEventListener(E['pointerup'], Slider.onTouchEnd));
    E.add('bibi:opened', () => {
        E.add('bibi:downed-pointer', BibiEvent => [Slider.Edgebar, Slider.Thumb].includes(BibiEvent.target) ? Slider.onTouchStart(BibiEvent) : false);
        //Slider.Edgebar.addEventListener(E['pointerdown'], Slider.onTouchStart);
        //Slider.Thumb.addEventListener(E['pointerdown'], Slider.onTouchStart);
        E.add('bibi:upped-pointer', BibiEvent => Slider.onTouchEnd(BibiEvent));
        //O.HTML.addEventListener(E['pointerup'], Slider.onTouchEnd);
        //if(Slider.History) Slider.History.Button.addEventListener(E['pointerup'], Slider.onTouchEnd);
        E.add(['bibi:keeps-scrolling', 'bibi:scrolled'], Slider.progress);
        Slider.progress();
    });
    E.add(['bibi:opened-slider', 'bibi:closed-slider', 'bibi:laid-out'], () => {
        Slider.resetUISize();
        Slider.progress();
    });
    { // Optimize to Scrollbar Size
        const _S = 'div#bibi-slider', _TB = '-thumb:before';
        const _HS = 'html.appearance-horizontal ' + _S, _HSTB = _HS + _TB, _SH = O.Scrollbars.Height, _STH = Math.ceil(_SH / 2);
        const _VS = 'html.appearance-vertical '   + _S, _VSTB = _VS + _TB, _SW = O.Scrollbars.Width,  _STW = Math.ceil(_SW / 2);
        const _getSliderThumbOffsetStyle = (Offset) => ['top', 'right', 'bottom', 'left'].reduce((Style, Dir) => Style + Dir + ': ' + (Offset * -1) + 'px; ', '').trim();
        sML.appendCSSRule(_HS, 'height: ' + _SH + 'px;');  sML.appendCSSRule(_HSTB, _getSliderThumbOffsetStyle(_STH) + ' border-radius: ' + (_STH / 2) + 'px; min-width: '  + _STH + 'px;');
        sML.appendCSSRule(_VS, 'width: '  + _SW + 'px;');  sML.appendCSSRule(_VSTB, _getSliderThumbOffsetStyle(_STW) + ' border-radius: ' + (_STW / 2) + 'px; min-height: ' + _STW + 'px;');
    }
    E.dispatch('bibi:created-slider');
}};


I.BookmarkManager = { create: () => { if(!S['use-bookmarks']) return;
    const BookmarkManager = I.BookmarkManager = {
        Bookmarks: [],
        initialize: () => {
            if(S['use-bookmark-ui']) {
                BookmarkManager.Subpanel = I.createSubpanel({
                    Opener: I.Menu.L.addButtonGroup({/* Lively: true, */ id: 'bibi-buttongroup_bookmarks' }).addButton({
                        Type: 'toggle',
                        Labels: {
                            default: { default: `Manage Bookmarks`,     ja: `しおりメニューを開く` },
                            active:  { default: `Close Bookmarks Menu`, ja: `しおりメニューを閉じる` }
                        },
                        Icon: `<span class="bibi-icon bibi-icon-manage-bookmarks"></span>`,
                        Help: true
                    }),
                    Position: 'left',
                    id: 'bibi-subpanel_bookmarks',
                    updateBookmarks: () => BookmarkManager.update({}),
                    onopened: () => { E.add(   'bibi:scrolled', BookmarkManager.Subpanel.updateBookmarks); BookmarkManager.Subpanel.updateBookmarks(); },
                    onclosed: () => { E.remove('bibi:scrolled', BookmarkManager.Subpanel.updateBookmarks); }
                });
                BookmarkManager.ButtonGroup = BookmarkManager.Subpanel.addSection({
                    id: 'bibi-subpanel-section_bookmarks',
                    Labels: { default: { default: `Bookmarks`, ja: `しおり` } }
                }).addButtonGroup();
                E.add('bibi:opened', BookmarkManager.Subpanel.updateBookmarks);
                if(!I.Oven.Flame) BookmarkManager.Subpanel.Opener.ButtonGroup.style.display = 'none';
                E.add('bibi:quenched-oven', () => {
                    BookmarkManager.Subpanel.close();
                    BookmarkManager.Subpanel.Opener.ButtonGroup.style.display = 'none';
                });
                E.add('bibi:realized-oven', () => {
                    BookmarkManager.load();
                    BookmarkManager.Subpanel.Opener.ButtonGroup.style.display = '';
                });
            }
            BookmarkManager.load();
            delete BookmarkManager.initialize;
        },
        load: () => {
            const BookmarkBiscuits = I.Oven.Biscuits.remember('Book', 'Bookmarks');
            if(Array.isArray(BookmarkBiscuits) && BookmarkBiscuits.length) BookmarkManager.Bookmarks = BookmarkBiscuits;
            else if(S['use-bookmark-ui']) if(!L.Opened) BookmarkManager.Subpanel.Opener.ButtonGroup.style.display = 'none';
        },
        exists: (Bookmark) => {
            const BookmarkPage = R.getPageStartsWithP(Bookmark.P);
            if(BookmarkPage) for(let l = BookmarkManager.Bookmarks.length, i = 0; i < l; i++) if(R.getPageStartsWithP(BookmarkManager.Bookmarks[i].P) == BookmarkPage) return BookmarkManager.Bookmarks[i];
            return null;
        },
        add: (Bookmark) => {
            if(BookmarkManager.exists(Bookmark)) return BookmarkManager.update();
            Bookmark.IsHot = true;
            BookmarkManager.Bookmarks.push(Bookmark);
            BookmarkManager.update({ Added: Bookmark });
        },
        remove: (Bookmark) => {
            BookmarkManager.Bookmarks = BookmarkManager.Bookmarks.filter(Bmk => Bmk.P != Bookmark.P);
            BookmarkManager.update({ Removed: Bookmark });
        },
        update: (Opt = {}) => {
            if(S['use-bookmark-ui']) {
                if(I.Oven.Flame) BookmarkManager.Subpanel.Opener.ButtonGroup.style.display = '';
                if(BookmarkManager.ButtonGroup.Buttons) {
                    BookmarkManager.ButtonGroup.Buttons = [];
                    BookmarkManager.ButtonGroup.innerHTML = '';
                }
            }
            //BookmarkManager.Bookmarks = BookmarkManager.Bookmarks.filter(Bmk => typeof Bmk.IIPP == 'number' && typeof Bmk['%'] == 'number');
            let Bookmarks = [], ExistingBookmarks = [];
            if(Array.isArray(Opt.Bookmarks)) BookmarkManager.Bookmarks = Opt.Bookmarks;
            if(Opt.Added) Bookmarks = [Opt.Added];
            else if(L.Opened) {
                I.PageObserver.updateCurrent();
                Bookmarks = I.PageObserver.Current.Pages.map(Page => ({
                    P: R.getP({ Page: Page }),
                    '%': Math.floor((Page.Index + 1) / R.Pages.length * 100) // only for showing percentage in waiting status
                }));
            }
            if(BookmarkManager.Bookmarks.length) {
                const UpdatedBookmarks = []
                for(let l = BookmarkManager.Bookmarks.length, i = 0; i < l; i++) {
                    let Bmk = BookmarkManager.Bookmarks[i];
                    if(typeof Bmk != 'object' || !Bmk || typeof Bmk.P != 'string') continue;
                    if(/^(\d*\.)?\d+?$/.test(Bmk['%'])) Bmk['%'] *= 1; else delete Bmk['%'];
                    let Label = '', ClassName = '';
                    const BB = 'bibi-bookmark';
                    let Page = L.Opened ? R.getPageStartsWithP(Bmk.P) : null;
                    const PageNumber = Page?.IsPage ? Page.Index + 1 : Bmk.P.split('.')[0] * 1;
                    if(PageNumber) {
                        Label += `<span class="${BB}-page"><span class="${BB}-unit">P.</span><span class="${BB}-number">${ PageNumber }</span></span>`;
                        if(R.Pages.length) {
                            if(PageNumber > R.Pages.length) continue;
                            Label += `<span class="${BB}-total-pages">/<span class="${BB}-number">${ R.Pages.length }</span></span>`;
                            Bmk['%'] = Math.floor(PageNumber / R.Pages.length * 100);
                        }
                    }
                    if(typeof Bmk['%'] == 'number') {
                        if(Label) Label += ` <span class="${BB}-percent"><span class="${BB}-parenthesis">(</span><span class="${BB}-number">${ Bmk['%'] }</span><span class="${BB}-unit">%</span><span class="${BB}-parenthesis">)</span></span>`;
                        else      Label +=  `<span class="${BB}-percent">` +                                    `<span class="${BB}-number">${ Bmk['%'] }</span><span class="${BB}-unit">%</span>`                                    + `</span>`;
                    }
                    const Labels = Label ? { default: { default: Label, ja: Label } } : { default: { default: `Bookmark #${ UpdatedBookmarks.length + 1 }`, ja: `しおり #${ UpdatedBookmarks.length + 1 }` } };
                    if(L.Opened && Bookmarks.reduce((Exists, Bookmark) => Exists = R.getPageStartsWithP(Bmk.P) == R.getPageStartsWithP(Bookmark.P) ? true : Exists, false)) {
                        ExistingBookmarks.push(Bmk);
                        ClassName = `bibi-button-bookmark-is-current`;
                        Labels.default.default += ` <span class="${BB}-is-current"></span>`;
                        Labels.default.ja      += ` <span class="${BB}-is-current ${BB}-is-current-ja"></span>`;
                    }
                    if(S['use-bookmark-ui']) {
                        const Button = BookmarkManager.ButtonGroup.addButton({
                            className: ClassName,
                            Type: 'normal',
                            Labels: Labels,
                            Icon: `<span class="bibi-icon bibi-icon-bookmark bibi-icon-a-bookmark"></span>`,
                            Bookmark: Bmk,
                            action: () => {
                                if(L.Opened) return R.focusOn(Bmk).then(Destination => {
                                    if(!S['manualize-adding-histories']) I.History.add({ UI: BookmarkManager, SumUp: false/*true*/, Destination: Destination });
                                    return Destination;
                                });
                                if(!L.Waiting) return false;
                                if(S['start-in-new-window']) return L.openNewWindow(location.href + (location.hash ? '&' : '#') + 'jo(p=' + Bmk.P + ')');
                                R.StartOn = Bmk;
                                L.play();
                            },
                            remove: () => BookmarkManager.remove(Bmk)
                        });
                        const Remover = Button.appendChild(sML.create('span', { className: 'bibi-remove-bookmark', title: 'しおりを削除' }));
                        I.setFeedback(Remover, { StopPropagation: true });
                        E.add(Remover, 'bibi:singletapped', () => Button.remove());
                        Remover.addEventListener(E['pointer-over'], Eve => Eve.stopPropagation());
                        if(Bmk.IsHot) {
                            delete Bmk.IsHot;
                            I.setUIState(Button, 'active'); setTimeout(() => I.setUIState(Button, ExistingBookmarks.includes(Bmk) ? 'disabled' : 'default'), 234);
                        }
                        else if(ExistingBookmarks.includes(Bmk)) I.setUIState(Button, 'disabled');
                        else                                     I.setUIState(Button,  'default');
                    }
                    const UpdatedBookmark = { IsBookmark: true, P: Bmk.P };
                    if(Bmk['%']) UpdatedBookmark['%'] = Bmk['%'];
                    UpdatedBookmarks.push(UpdatedBookmark);
                }
                BookmarkManager.Bookmarks = UpdatedBookmarks;
            } else {
                if(S['use-bookmark-ui']) {
                    if(!L.Opened) BookmarkManager.Subpanel.Opener.ButtonGroup.style.display = 'none';
                    E.add('bibi:quenched-oven', () => BookmarkManager.Subpanel.Opener.ButtonGroup.style.display = 'none');
                    E.add('bibi:realized-oven', () => BookmarkManager.Subpanel.Opener.ButtonGroup.style.display = '');
                }
            }
            if(S['use-bookmark-ui']) {
                if(BookmarkManager.Bookmarks.length < S['max-bookmarks']) {
                    BookmarkManager.AddButton = BookmarkManager.ButtonGroup.addButton({
                        id: 'bibi-button-add-a-bookmark',
                        Type: 'normal',
                        Labels: { default: { default: `Add a Bookmark to Current Page`, ja: `現在のページにしおりを挟む` } },
                        Icon: `<span class="bibi-icon bibi-icon-bookmark bibi-icon-add-a-bookmark"></span>`,
                        action: () => Bookmarks.length ? BookmarkManager.add(Bookmarks[0]) : false
                    });
                    if(!Bookmarks.length || ExistingBookmarks.length) {
                        I.setUIState(BookmarkManager.AddButton, 'disabled');
                    }
                }
            }
            BookmarkManager.Bookmarks.length ? I.Oven.Biscuits.memorize('Book', { Bookmarks: BookmarkManager.Bookmarks }) : I.Oven.Biscuits.forget('Book', 'Bookmarks');
            /**/            E.dispatch('bibi:updated-bookmarks', BookmarkManager.Bookmarks);
            if(Opt.Added)   E.dispatch(  'bibi:added-bookmark',  BookmarkManager.Bookmarks);
            if(Opt.Removed) E.dispatch('bibi:removed-bookmark',  BookmarkManager.Bookmarks);
        },
    };
    BookmarkManager.initialize();
    E.dispatch('bibi:created-bookmark-manager');
}};


I.Footnotes = { create: () => { if(!S['use-popup-footnotes']) return I.Footnotes = null;
    const Footnotes = I.Footnotes = {
        OpenedFoontnotes: [],
        _trimBrackets: (Str) => Str.trim().replace(/^[\(\{\[（｛［〔〈《｟【「『]+|[\)\}\]）｝］〕〉》｠】」』]+$/g, '').trim(),
        _trimMarkers:  (Str) => Str.trim().replace(/^[\*＊※†]+|[\*＊※†]+$/, '').trim(),
        _trimBracketsAndMarkers: (Str) => Footnotes._trimMarkers(Footnotes._trimBrackets(Str)),
        _zen2han: (Str) => Str.replace(/[ａ-ｚＡ-Ｚ０-９]/g, (_M) => String.fromCharCode(_M.charCodeAt(0) - 0xFEE0)),
        initialize: () => {
            const escapeSC = (Str) => Str.replace(/([\(\{\[\*])/g, '\\$1');
            const BracketsO = escapeSC('({[（｛［〔〈《｟【「『');
            const BracketsC = escapeSC(')}]）｝］〕〉》｠】」』');
            const  Markers  = escapeSC('*＊※†');
            const BracketsRE = new RegExp('^[' + BracketsO + ']+|[' + BracketsC + ']+$', 'g');
            const  MarkersRE = new RegExp('^[' +  Markers  + ']+|[' +  Markers  + ']+$', 'g');
            Footnotes.trimBrackets = (Str) => Str.trim().replace(BracketsRE, '').trim();
            Footnotes.trimMarkers  = (Str) => Str.trim().replace( MarkersRE, '').trim();
            Footnotes.trimBracketsAndMarkers = (Str) => Footnotes.trimMarkers(Footnotes.trimBrackets(Str));
            const hatch = (Dest) => {
                if(!Dest) return null;
                if(!Dest.Element && Dest.ElementSelector) {
                    if(Dest.ItemIndex) Dest.Item = R.Items[Dest.ItemIndex], delete Dest.ItemIndex;
                    if(Dest.Item) {
                        Dest.Element = Dest.Item.contentDocument.querySelector(Dest.ElementSelector), delete Dest.ElementSelector;
                        if(!Dest.Element || Dest.Element.nodeType != 1) delete Dest.Element;
                    }
                }
                return Dest;
            };
            const setFootnoteElement = (A, FnEle) => {
                A.IsNoteRef = true, FnEle.IsFootnote = true;
                A.FootnoteElement = FnEle;
                if(!FnEle.NoteRefs) FnEle.NoteRefs = [];
                FnEle.NoteRef = A;
            };
            E.bind('bibi:loaded-book', () => R.Items.forEach(Item => {
                if(!Item.Body) return; // items still extracting when the book opens (reboot churn, heavy load) carry no body yet: binding footnotes must not kill the boot
                Item.Body.querySelectorAll('a[href*="#"]').forEach(BaseA => {
                    const BaseDest = hatch(BaseA.Destination);
                    if(!BaseDest || !BaseDest.Element || !BaseDest.Element.innerHTML) return;
                    if(BaseA.getAttribute('epub:type') == 'noteref' || BaseDest.Element.getAttribute('epub:type') == 'footnote') setFootnoteElement(BaseA, BaseDest.Element);
                    if(BaseA.ReturningTo) return;
                    const BackACandidates = BaseDest.Element.tagName.toUpperCase() == 'A' ? [BaseDest.Element] : BaseDest.Element.getElementsByTagName('a');
                    if(!BackACandidates.length) return;
                    let BackA = null, BackDest = null;
                    for(let l = BackACandidates.length, i = 0; i < l; i++) { const BackACandidate = BackACandidates[i];
                        BackDest = hatch(BackACandidate.Destination);
                        if(!BackDest || !BackDest.Element) continue;
                        if(BackDest.Element.contains(BaseA)) { BackA = BackACandidate; break; }
                    }
                    if(BackA) {
                        BaseA.ForwardingTo = BackA;
                        BackA.ReturningTo  = BaseA;
                        if(BaseA.FootnoteElement) return;
                        if(Footnotes._trimBracketsAndMarkers(BaseA.textContent) == Footnotes._trimBracketsAndMarkers(BackA.textContent)) {
                            BaseA.Pair = BackA, BackA.Pair = BaseA;
                            if(BaseDest.Element.closest('h1,h2,h3,h4,h5,h6')) return;
                            let FnEle_JIP = BaseDest.Element.closest('p,li,dt,figure');
                            if(!FnEle_JIP) {
                                FnEle_JIP = BaseDest.Element.closest('div,section,article,aside,body,html');
                                if(!FnEle_JIP || FnEle_JIP.textContent.length > 800) return;
                            }
                            BaseA.FootnoteElement_JustInPossibility = FnEle_JIP;
                        }
                    }
                });
            }));
        },
        detectFootnoteElement: (BaseA) => {
            if(BaseA.FootnoteElement) return BaseA.FootnoteElement;
            if(!BaseA.ForwardingTo || !BaseA.FootnoteElement_JustInPossibility) return null;
            const FnEle_JIP = BaseA.FootnoteElement_JustInPossibility, Clone = FnEle_JIP.cloneNode('DEEP');
            const CloneAs = Clone.querySelectorAll('a[href*="#"]');
            FnEle_JIP.querySelectorAll('a[href*="#"]').forEach((A, i) => A.Pair ? CloneAs[i].remove() : A);
            return Clone.textContent.trim() ? FnEle_JIP : null;
        },
        show: (A) => { // must returns true/false
            if(A.FootnoteElement === undefined) A.FootnoteElement = Footnotes.detectFootnoteElement(A);
            if(!A.FootnoteElement) return false;
            // if(I.PageObserver.Current.Pages.includes(R.dest(A.FootnoteElement).Page)) return false; // return true;
            for(let i = 0; i < Footnotes.OpenedFoontnotes.length; i++) if(Footnotes.OpenedFoontnotes[i].For == A.FootnoteElement) return true;
            Footnotes.make(A).open();
            return true;
        },
        make: (A) => {
            // Layer
            const Layer  = sML.create('div', { className: 'bibi-footnote', For: A.FootnoteElement,
                open: () => {
                    E.dispatch('bibi:is-going-to:opens-footnote', Layer);
                    Layer.check();
                    E.add('bibi:changed-intersection', Layer.onIntersectionChange);
                    Footnotes.hideAll();
                    Footnotes.OpenedFoontnotes.push(document.body.appendChild(Layer));
                    O.HTML.classList.add('footnote-opened');
                    setTimeout(() => {
                        Layer.classList.add('opened');
                        E.dispatch('bibi:opened-footnote', Layer);
                    }, 0);
                },
                close: () => {
                    E.dispatch('bibi:is-going-to:closes-footnote', Layer);
                    E.remove('bibi:changed-intersection', Layer.check);
                    Footnotes.OpenedFoontnotes = Footnotes.OpenedFoontnotes.filter(Fn => Fn != Layer);
                    Layer.ontransitionend = () => {
                        Layer.ontransitionend = () => undefined;
                        document.body.removeChild(Layer);
                        Layer.innerHTML = '';
                        if(!Footnotes.OpenedFoontnotes.length) O.HTML.classList.remove('footnote-opened');
                        E.dispatch('bibi:closed-footnote', Layer);
                    };
                    setTimeout(() => { Layer.classList.add('closed'); Layer.classList.remove('opened'); }, 0);
                }
            });
            E.add(Layer, ['wheel', 'mousewheel'], Eve => Eve.stopPropagation());
            // Footnote Head
            const FnHead = Layer.appendChild(sML.create('div', { className: 'footnote-head' }));
            FnHead.Heading = FnHead.appendChild(sML.create('div', { className: 'footnote-heading', innerHTML: Footnotes._zen2han(A.innerHTML) }));
            sML.forEach(FnHead.Heading.getElementsByTagName('*'))(Ele => Ele.removeAttribute('style') || Ele.removeAttribute('class'));
            // Footnote Body
            const FnBody = Layer.appendChild(sML.create('div', { className: 'footnote-body', Jumpers: [] }));
            FnBody.Content = FnBody.appendChild(sML.create('div', { className: 'footnote-content', innerHTML: Footnotes._zen2han(A.FootnoteElement.innerHTML), style: { fontFamily: getComputedStyle(A.FootnoteElement).fontFamily } }));
            sML.forEach(FnBody.Content.getElementsByTagName('*'))(Ele => Ele.removeAttribute('style') || Ele.removeAttribute('class'));
            const Imgs = FnBody.Content.querySelectorAll('img');
            A.FootnoteElement.querySelectorAll('img').forEach((Img, i) => (Imgs[i].style.maxWidth = '100%') && (Imgs[i].src = Img.src));
            const escapeDoubledDashes = (Ele) => Ele.childNodes.forEach(CN => { switch(CN.nodeType) { case 1: return escapeDoubledDashes(CN); case 3: CN.textContent = CN.textContent.replace(/(^|[^―])――([^―]|$)/g, '$1--DOUBLED-DASH--$2'); } });
            escapeDoubledDashes(FnBody.Content); FnBody.Content.innerHTML = FnBody.Content.innerHTML.replace(/--DOUBLED-DASH--/g, `<span class="bibi-footnote-content_doubled-dashes"><span>―</span><span>―</span></span>`);
            const FnBC_As = FnBody.Content.getElementsByTagName('a'), OriginalAs = A.FootnoteElement.getElementsByTagName('a');
            for(let l = FnBC_As.length, i = 0; i < l; i++) {
                const FnBC_A = FnBC_As[i], OriginalA = OriginalAs[i];
                if(!OriginalA.jump) return;
                Object.assign(FnBC_A, { Original: OriginalA, Destination: OriginalA.Destination }).addEventListener('click', Eve => {
                    Eve.preventDefault(), Eve.stopPropagation();
                    return FnBC_A.Disabled ? false : OriginalA.jump(Eve, { UI: Footnotes, PreventFootnote: false });
                });
                FnBody.Jumpers.push(FnBC_A);
            }
            // Util
            const Util = Layer.Util = Layer.appendChild(sML.create('ul', { className: 'footnote-utilities' })); 
            (Util.UIs = [
                Util.Jump  = sML.create('span', { action: Eve => A.jump(Eve, { UI: Footnotes, PreventFootnote: true }), Destination: A.Destination }),
                Util.Close = sML.create('span', { action: Eve => Layer.close() })
            ]).forEach(UI => {
                E.add(UI, 'bibi:singletapped', (Eve) => UI.Disabled ? false : UI.action(Eve));
                I.setFeedback(UI, { StopPropagation: true });
                Util.appendChild(sML.create('li')).appendChild(UI);
            });
            // Checker
            Layer.check = () => {
                FnBody.Jumpers.concat(Util.UIs).forEach(UI => UI.Destination ? UI.classList.toggle('disabled', UI.Disabled = I.PageObserver.Current.Pages.includes(R.getPage(UI.Destination))) : false);
            };
            Layer.onIntersectionChange = () => {
                Layer.check();
                Layer.close();
            };
            return Layer;
        },
        hideAll: () => Footnotes.OpenedFoontnotes.forEach(Fn => Fn.close())
    };
    Footnotes.initialize();
    // E.add(['bibi:opens-utilities', 'bibi:closes-utilities'], () => Footnotes.hideAll());
    I.Utilities.Checkers.push(() => {
        if(Footnotes.OpenedFoontnotes.length) {
            Footnotes.hideAll();
            return false;
        }
        return true;
    });
}};


I.RangeFinder = { create: () => {
    const RangeFinder = I.RangeFinder = {
        _str: (Str) => typeof Str == 'string' ? Str : Number.isFinite(Str) ? String(Str) : '',
        _opt: (Opt) => {
            if(!Opt || Opt.Flexible) return {};
            const Options = {
                CaseSensitive: true,
                WidthSensitive: true,
                ConvertBreaksTo: ' '
            };
            if(!Opt.Strict) for(const k in Options) if(!Opt[k]) delete Options[k];
            if(typeof Opt.ConvertBreaksTo == 'string' && Opt.ConvertBreaksTo.length == 1) Options.ConvertBreaksTo = Opt.ConvertBreaksTo;
            return Options;
        },
        _flatten: function(Str, Opt = {}) {
            Str = (typeof Opt.ConvertBreaksTo != 'string' || Opt.ConvertBreaksTo.length != 1 || Opt.ConvertBreaksTo == ' ') ?
                Str.replace(/[\r\n\t ]/g, ' ') :
                Str.replace(/[\r\n]/g, Opt.ConvertBreaksTo).replace(/[\t ]/g, ' ');
            if(!Opt.WidthSensitive) Str = Str.replace(/[！＂＃＄％＆＇（）＊＋，－．／０-９：；＜＝＞？＠Ａ-Ｚ［＼］＾＿｀ａ-ｚ｛｜｝～]/g, (Cha) => String.fromCharCode(Cha.charCodeAt(0) - 0xFEE0)).replace(/・/g, '.');
            if(! Opt.CaseSensitive) Str = Str.toLowerCase();
            return Str;
        },
        _compress: function(Str, Opt) { return this._flatten(Str, this._opt({ Strict: true, ConvertBreaksTo: Opt?.ConvertBreaksTo })).trim().replace(/ +/, ' '); },
        _find: function(TargetNode, Str, Opt, Reversing) {
            Str = this._flatten(Str, Opt); if(!Str) return null;
            let TNode = TargetNode ? TargetNode : document.body; while(TNode.childNodes.length == 1) TNode = TNode.firstChild;
            const TText = this._flatten(TNode.textContent, Opt); if(TText.indexOf(Str) < 0) return null;
            const StrL = Str.length;
            let Edges = [{}, {}];
            if(TNode.nodeType == 3) {
                const StartOffset = !Reversing ? TText.indexOf(Str) : TText.lastIndexOf(Str);
                const EdgePrototype = { Container: TNode, Content: Str, Offsets: [StartOffset, StartOffset + StrL] };
                return Edges.map(Edge => Object.assign(Edge, EdgePrototype));
            } else {
                const CTexts = [];
                for(let CNs = TNode.childNodes, l = CNs.length - 1, i = 0; i <= l; i++) { const CN_i = !Reversing ? i : l - i;
                    const CText = this._flatten(CNs[CN_i].textContent, Opt);
                    if(CText.indexOf(Str) >= 0) return this._find(CNs[CN_i], Str, Opt, Reversing);
                    !Reversing ? CTexts.push(CText) : CTexts.unshift(CText);
                }
                return Edges.map((Edge, Edge_i) => {
                    let Container; switch(Edge_i) {
                        case 0: Container = TNode.firstChild; while(CTexts.slice(1                   ).join('').indexOf(Str) >= 0) CTexts.shift(), Container =     Container.nextSibling; break;
                        case 1: Container =  TNode.lastChild; while(CTexts.slice(0, CTexts.length - 1).join('').indexOf(Str) >= 0) CTexts.pop(),   Container = Container.previousSibling; break;
                    }
                    const CText = this._flatten(Container.textContent, Opt), CTextL = CText.length;
                    let Content = Str; switch(Edge_i) {
                        case 0: if(CTextL < StrL) Content = Content.substring(0,     CTextL); while(CText.lastIndexOf(Content) != CTextL - Content.length) Content = Content.substring(0, Content.length - 1); break;
                        case 1: if(CTextL < StrL) Content = Content.substring(StrL - CTextL); while(    CText.indexOf(Content) != 0                      ) Content = Content.substring(1                    ); break;
                    }
                    while(!Edge.Offsets) Edge = this._find(Container, Content, Opt, !Edge_i)[Edge_i];
                    return Edge;
                });
            }
        },
        searchFromDocument: function(Doc, SearchStrings, SearchOptions) { if(!Doc) Doc = document;
            SearchOptions = this._opt(SearchOptions);
            const SearchResults = [];
            return Promise.all([SearchStrings].flat().map(SStr => new Promise(resolve => {
                SStr = this._str(SStr); if(!SStr) return resolve();
                const MDocF = Doc.createDocumentFragment(), // "M"irror
                      MHTML = MDocF.appendChild(Doc.createElement('html')),
                      MBody = MHTML.appendChild(Doc.importNode(Doc.body, true));
                // const Imgs = MBody.querySelectorAll('img'), ImgsL = Imgs.length, RTPs = MBody.querySelectorAll('rp, rt'), RTPsL = RTPs.length;
                // if(ImgsL) for(let i = 0; i < ImgsL; i++) { const Img = Imgs[i], PN = Img.parentNode; PN.insertBefore(Doc.createElement('ALT'), Img).innerHTML = Img.alt; PN.removeChild(Img); } // for Images: 1/2
                // if(RTPsL) for(let i = 0; i < RTPsL; i++) { const RTP = RTPs[i]; RTP.IsRTP = RTP.tagName.toLowerCase(); RTP.TCL = RTP.textContent.length; RTP.innerHTML = ''; } // - for Rubies: 1/2
                const Imgs = MBody.querySelectorAll('img'   ), ImgsL = Imgs.length;  if(ImgsL) for(let i = 0; i < ImgsL; i++) { const Img = Imgs[i], PN = Img.parentNode; PN.insertBefore(Doc.createElement('ALT'), Img).appendChild(Doc.createTextNode(Img.alt || '')); PN.removeChild(Img); }
                const RTCs = MBody.querySelectorAll('rtc'   ), RTCsL = RTCs.length;  if(RTCsL) for(let i = 0; i < RTCsL; i++) { RTCs[i].innerHTML = ''; } // - for Rubies: 1/2 // ^ for Images: 1/2
                const RTPs = MBody.querySelectorAll('rt, rp'), RTPsL = RTPs.length;  if(RTPsL) for(let i = 0; i < RTPsL; i++) { RTPs[i].innerHTML = ''; } // - for Rubies: 2/2
                const DistilledDocText = this._compress(MBody.textContent, { ConvertBreaksTo: '⏎' }), DistilledSStrL = this._compress(SStr).length;
                let Edges; while(Edges = this._find(MBody, SStr, SearchOptions)) {
                    const Range = Doc.createRange();
                    let Replaced = null;
                    Edges.forEach((Edge, Edge_i) => {
                        let MContainer = Edge.Container, Offsets = Edge.Offsets, CText = MContainer.textContent;
                        if(MContainer != Replaced) (Replaced = MContainer).textContent = CText.substring(0, Offsets[0]) + Edge.Content.replace(/(.|\s)/g, '􏿿') + CText.substring(Offsets[1]); // to: U+10FFFF (PRIVATE USE AREA)
                        // if(RTPsL && Edge_i && CText && Offsets[1] == CText.length) { // for Rubies: 2/2 (RTC not supported)
                        //     let _Node = MContainer; while(_Node != MBody) {
                        //         if(_Node.parentElement.tagName.toLowerCase() != 'ruby') { _Node = _Node.parentElement; continue; }
                        //         let PEle = null, NES = _Node.nextElementSibling;
                        //         if(NES && NES.nodeType == 1 && NES.IsRTP == 'rp')                              NES = NES.nextElementSibling;
                        //         if(NES && NES.nodeType == 1 && NES.IsRTP == 'rt') PEle = NES.TCL ? NES : null, NES = NES.nextElementSibling;
                        //         if(NES && NES.nodeType == 1 && NES.IsRTP == 'rp') PEle = NES.TCL ? NES : null;
                        //         if(PEle) MContainer = PEle.appendChild(Doc.createTextNode('')), Offsets = [0, PEle.TCL];
                        //         break;
                        //     }
                        // }
                        if(ImgsL && MContainer.parentElement.tagName == 'ALT') { // for Images: 2/2
                            const ALT = MContainer.parentElement;
                            MContainer = ALT.parentElement;
                            let ALT_i = 0; while(MContainer.childNodes[ALT_i] != ALT) ALT_i++;
                            Offsets = [ALT_i, ALT_i + 1];
                        }
                        const NodeSteps = []; let _Node = MContainer; while(_Node != MBody) {
                            const PEle = _Node.parentElement;
                            let _Node_i = 0; while(PEle.childNodes[_Node_i] != _Node) _Node_i++;
                            NodeSteps.unshift(_Node_i);
                            _Node = PEle;
                        }
                        let Container = Doc.body; NodeSteps.forEach(NStep => Container = Container.childNodes[NStep]);
                        switch(Edge_i) {
                            case 0: Range.setStart(Container, Offsets[0]); break;
                            case 1:   Range.setEnd(Container, Offsets[1]); break;
                        }
                    });
                    const ResultText_Start = this._compress(MBody.textContent, { ConvertBreaksTo: '⏎' }).indexOf('􏿿');
                    let   TextAround_Start = Math.max(ResultText_Start -  9, 0);
                    const TextAround_End   = Math.min(TextAround_Start + 69, DistilledDocText.length);
                          TextAround_Start = Math.max(TextAround_End   - 69, 0);
                    const ResultText_End   = Math.min(ResultText_Start + DistilledSStrL, TextAround_End);
                    const Break = `<span class="break"> </span>`;
                    SearchResults.push({
                        Index: SearchResults.length, // IndexInDocument
                        Document: Doc,
                        Range: Range,
                        TextAround: [
                            TextAround_Start > 0 ? '...' : '',
                            DistilledDocText.substring(TextAround_Start, ResultText_Start).replace(/^⏎+/g, '').replace(/⏎+/g, Break),
                            DistilledDocText.substring(ResultText_Start, ResultText_End  ).replace(                    /⏎+/g, Break),
                            DistilledDocText.substring(ResultText_End,   TextAround_End  ).replace(/⏎+$/g, '').replace(/⏎+/g, Break),
                            TextAround_End < DistilledDocText.length ? '...' : ''
                        ],
                        focus: () => this.Search.Results
                    });
                    Edges.forEach(Edge => Edge.Container.textContent = Edge.Container.textContent.replace(/􏿿/g, '​')); // from: U+10FFFF (PRIVATE USE AREA) / to: U+200B (ZERO WIDTH SPACE)
                }
                resolve();
            }))).then(() => SearchResults.sort((_A, _B) => _A.Range.compareBoundaryPoints(Range.START_TO_START, _B.Range) || _A.Range.compareBoundaryPoints(Range.END_TO_END, _B.Range)));
        },
        searchFromBook: function(SearchStrings, SearchOptions) {
            SearchStrings = SearchStrings.Formatted || SearchStrings;
            const SearchResults = [];
            return Promise.all(
                R.Items.map((Item, i) => Item.Loaded ? this.searchFromDocument(Item.contentDocument, SearchStrings, SearchOptions).then(ItemSearchResults => SearchResults[i] = ItemSearchResults) : null)
            )   .then(() => SearchResults.flat().map((SRes, i) => (SRes.Item = SRes.Document.body.Item, SRes.IndexInItem = SRes.Index, SRes.Index = i, SRes)));
        },
        search: function(SearchStrings, SearchOptions_BehaviorOptions) {
            this.searching(false);
            const NewSearch = this.newSearch(SearchStrings, SearchOptions_BehaviorOptions), SearchStringsF = NewSearch.Strings.Formatted;
            const BehaviorOptions = { Focus: true }; for(const k in BehaviorOptions) if(SearchOptions_BehaviorOptions[k] !== undefined) BehaviorOptions[k] = SearchOptions_BehaviorOptions[k];
            return new Promise((resolve, reject) => {
                if(!SearchStringsF.length) return this.resetSearch() && reject();
                E.dispatch('bibi:is-going-to:search', NewSearch);
                if(this.isSameSearch(NewSearch, this.Search)) return this.updateSearch({ Strings: NewSearch.Strings, Options: NewSearch.Options }) && resolve();
                this.updateSearch({ Strings: NewSearch.Strings, Options: NewSearch.Options, Results: [] });
                const Times = SearchStringsF[0].length == 1 ? [0, 99] : [99, 0];
                this.searching(true, Times[0]);
                setTimeout(() => this.searchFromBook(NewSearch.Strings, NewSearch.Options).then(SearchResults => {
                    this.updateSearch({ Results: SearchResults });
                    resolve();
                }), Times[1]);
            })  .then(() => {
                    const SearchResults = this.Search.Results;
                    if(SearchResults.length) switch(BehaviorOptions.Focus) {
                        case true: case 'auto'        : return this.autofocusOnTheSearchResult();
                                   case 'auto-reverse': return this.autofocusOnTheSearchResult({ Reverse: true });
                                   case 'first'       : return this.setSearchResultFocusTo(0);
                                   case  'last'       : return this.setSearchResultFocusTo(SearchResults.length - 1);
                    }
                    const SearchResultF = SearchResults.Focused;
                    if(SearchResultF) {
                        this.paint(SearchResultF.Range, { Emphasized: false });
                        SearchResults.Focused = null;
                        this.updateSearch();
                    }
                    return Promise.resolve();
                })
                .then(() => E.dispatch('bibi:searched', this.Search))
                .catch(() => Promise.resolve())
                .then(() => this.searching(false) || this.Search);
        },
        initializeSearch: function() {
            if(!this.Search) this.Search = {};
            Object.assign(this.Search, { Strings: [], Options: {}, Results: [] });
        },
        resetSearch: function(Updates) {
            this.initializeSearch();
            this.removeAllPaints();
            return this.updateSearch(Updates);
        },
        updateSearch: function(Updates) {
            const _S = this.Search;
            if(Updates) Object.keys(_S).forEach(k => {
                const _SData = _S[k], UdData = Updates[k];
                if(UdData === undefined || UdData === _SData) return;
                _S[k] = UdData;
                if(k == 'Results') {
                    this.removeAllPaints();
                    const SearchResults = this.Search.Results;
                    if(SearchResults.length) SearchResults.forEach(SearchResult => this.paint(SearchResult.Range));
                    SearchResults.Focused       = null;
                }
            });
            E.dispatch('bibi:updated-search-status', _S);
            return _S;
        },
        searching: function(TF, Time) {
            clearTimeout(this.Timer_searchingHard);
            if(TF) { this.Timer_searchingHard = setTimeout(() => {
                O.Busy = true;
                O.HTML.classList.add('searching-hard');
                O.HTML.classList.add('busy');
            }, Time); } else {
                O.HTML.classList.remove('busy');
                O.HTML.classList.remove('searching-hard');
                O.Busy = false;
            }
        },
        isSameSearch: function(Search_A, Search_B) {
            try {
                const SOpts_A = Search_A.Options, SOpts_B = Search_B.Options; for(const k in Object.assign({}, SOpts_A, SOpts_B)) if(SOpts_A[k] !== SOpts_B[k]) return false;
                return (Search_A.Strings.Formatted.join('<OR>') == Search_B.Strings.Formatted.join('<OR>'));
            } catch(Err) { return false; }
        },
        newSearch: function(SearchStrings, SearchOptions) {
            SearchOptions = this._opt(SearchOptions);
            SearchStrings = [...new Set([SearchStrings].flat().reduce((SStrs, SStr) => (SStr = this._str(SStr).replace(/<OR>/g, '').replace(/^\s+$/g, '')) ? (SStrs.push(SStr), SStrs) : SStrs, []))];
            SearchStrings.Formatted = [...new Set(SearchStrings.map(SStr => this._flatten(SStr, SearchOptions)))].sort((_A, _B) => _A.length - _B.length || (_A <= _B ? -1 : 1));
            return { Strings: SearchStrings, Options: SearchOptions, Results: [] };
        },
        focusOn: function(Ran) {
            const FocusedRange = this.FocusedRange;
            if(Ran != FocusedRange) {
                if(FocusedRange) this.paint(FocusedRange, { Emphasized: false });
                this.paint(Ran, { Emphasized: true });
                this.FocusedRange = Ran;
            }
            const Page = R.dest(Ran).Page;
            return I.PageObserver.Current.Pages.includes(Page) ? Promise.resolve() : R.focusOn(Page).then(() => this.reserveRepainting(999));
        },
        setSearchResultFocusTo: function(SRoI /* SearchResult-or-Index: Index is better than SearchResult. */) {
            const SearchResults = this.Search.Results; /**/ if(!SearchResults.length) return Promise.resolve();
            const SearchResult  = Number.isInteger(SRoI) ? SearchResults[SRoI] : SearchResults.includes(SRoI) ? SRoI : null; /**/ if(!SearchResult) return Promise.resolve();
            if(SearchResult != SearchResults.Focused) {
                SearchResults.Focused = SearchResult;
                this.updateSearch();
            }
            return this.focusOn(SearchResult.Range);
        },
        changeSearchResultFocusBy: function(Dist) {      /**/ if(!Number.isInteger(Dist) || !Dist) return Promise.resolve();
            const SearchResults = this.Search.Results;   /**/ if(!SearchResults.length)            return Promise.resolve();
            const SearchResultF = SearchResults.Focused; /**/ if(!SearchResultF)                   return Promise.resolve();
            const Index = (SearchResultF.Index + Dist) % SearchResults.length;
            return this.setSearchResultFocusTo(Index < 0 ? SearchResults.length + Index : Index);
        },
        autofocusOnTheSearchResult: function(Opt) {
            const SearchResults = this.Search.Results; /**/ if(!SearchResults.length) return Promise.resolve();
            const SearchResultF = SearchResults.Focused;
            if(!Opt) Opt = {};
            if(SearchResultF && I.PageObserver.Current.Pages.includes(R.dest(SearchResultF.Range).Page)) return this.changeSearchResultFocusBy(Opt.Reverse ? -1 : 1);
            const NextResultIndex = this.getNearestSearchResultIndex();
            return this.setSearchResultFocusTo(!Opt.Reverse || I.PageObserver.Current.Pages.includes(R.dest(SearchResults[NextResultIndex].Range).Page) ? NextResultIndex : this.getNearestSearchResultIndex({ Reverse: true }));
        },
        getNearestSearchResultIndex: function(Opt) {
            const SearchResults = this.Search.Results; /**/ if(!SearchResults.length) return NaN;
            if(SearchResults.length == 1) return 0;
            if(!Opt) Opt = {};
            let Dir, iStart, CP;
            if(!Opt.Reverse) Dir =  1, iStart = 0,                        CP = I.PageObserver.Current.Pages[0];
            else             Dir = -1, iStart = SearchResults.length - 1, CP = I.PageObserver.Current.Pages.slice(-1)[0];
            if(!CP) return iStart; // Current.Pages can be empty mid-relayout: reading .Item off undefined threw TypeError
            const CII = CP.Item.Index, CPI = CP.Index;
            for(let i = iStart; SearchResults[i]; i += Dir) { const Ran = SearchResults[i].Range;
                if(Ran.startContainer.ownerDocument.body.Item.Index * Dir < CII * Dir || R.dest(Ran).Page.Index * Dir < CPI * Dir) continue;
                return i;
            } return iStart;
        },
        paint: function(RoP /* Range-or-Paint */, Spec) {
            let IsNew, Paint, Ran, Doc, Item;
            if(RoP.nodeType === 1) {
                Paint = RoP;
            } else if(RoP.startContainer) {
                Ran = RoP, Doc = Ran.startContainer.ownerDocument, Item = Doc.body.Item;
                if(Item.Paints) for(let _Paints = Item.Paints.children, l = _Paints.length, i = 0; i < l; i++) { const _Paint = _Paints[i];
                    if(_Paint.Range != Ran) continue;
                    Paint = _Paint;
                    break;
                }
                if(!Paint) { IsNew = true;
                    if(!this.Paints) this.Paints = [];
                    if(!Item.Paints) Item.Paints = Item.Foot.appendChild(sML.create('bibi-paints'));
                    this.Paints.push(Item.Paints.appendChild(Paint = sML.create('bibi-paint', { Range: Ran, Spec: {} })));
                }
            }
            if(Spec) Object.keys(Spec).forEach(Sp => Paint.classList.toggle(Sp.toLowerCase(), Paint.Spec[Sp] = Spec[Sp] ? true : false));
            else {
                Paint.Spec = {};
                Paint.removeAttribute('class');
            }
            if(!IsNew) return Paint;
            const RangeFragments = [];
            const CAC = Ran.commonAncestorContainer;
            if(CAC.nodeType == 3) {
                RangeFragments.push(Ran);
            } else {
                const SC = Ran.startContainer, EC = Ran.endContainer, SO = Ran.startOffset, EO = Ran.endOffset;
                let Started = false, Ended = false;
                const _parse = (Ele) => { for(let _CNs = Ele.childNodes, l = _CNs.length, i = 0; i < l; i++) { const CN = _CNs[i];
                    if(Ended) break; // both required
                    switch(CN.nodeType) {
                        case 1: switch(CN.tagName.toLowerCase()) {
                            case 'img':
                                const PEle = CN.parentElement;
                                let CN_i = 0; while(PEle.childNodes[CN_i] != CN) CN_i++;
                                if(PEle == SC && CN_i     == SO) Started = true;
                                if(Started) _push(PEle, CN_i, CN_i + 1);
                                if(PEle == EC && CN_i + 1 == EO) Ended   = true;
                                break;
                            default: _parse(CN);
                        } break;
                        case 3: switch(CN) {
                            case SC: Started = true; _push(SC, SO, SC.textContent.length);               break;
                            case EC:                 _push(EC,  0, EO                   ); Ended = true; break;
                            default:     if(Started) _push(CN,  0, CN.textContent.length);
                        } break;
                    }
                    if(Ended) break; // both required
                }};
                const _push = (Container, StartOffset, EndOffset) => {
                    if(/^r[tp]$/i.test(Container.parentElement.tagName)) return;
                    const RF = Doc.createRange();
                    RF.setStart(Container, StartOffset), RF.setEnd(Container, EndOffset);
                    RangeFragments.push(RF);
                };
                _parse(CAC.nodeType == 1 ? CAC : CAC.parentElement);
            }
            const Rects = [];
            let LastRect = null; RangeFragments.forEach(RF => {
                const RFC = RF.startContainer;
                const Dir = getComputedStyle(RFC.nodeType == 1 ? RFC : RFC.parentElement).writingMode.split('-')[0];
                __: for(let RFRects = RF.getClientRects(), l = RFRects.length, i = 0; i < l; i++) { const RFRect = RFRects[i];
                    const Rect = { Dir: Dir, L: RFRect.left, T: RFRect.top, W: RFRect.width, H: RFRect.height };
                    if(LastRect && Dir == LastRect.Dir) switch(Dir) {
                        case 'horizontal': if(Rect.T === LastRect.T && Rect.H === LastRect.H) { Object.assign(LastRect, { W: (Rect.L - LastRect.L) + Rect.W }); continue __; } break;
                        case   'vertical': if(Rect.L === LastRect.L && Rect.W === LastRect.W) { Object.assign(LastRect, { H: (Rect.T - LastRect.T) + Rect.H }); continue __; } break;
                    }
                    Rects.push(LastRect = Rect);
                }
            });
            const _PS = 2; // Paint Spreading
            Rects.forEach(Rect => Paint.appendChild(sML.create('bibi-paint-fragment', { className: Rect.Dir, style: { left: (Rect.L - _PS) + 'px', top: (Rect.T - _PS) + 'px', width: (Rect.W + _PS * 2) + 'px', height: (Rect.H + _PS * 2) + 'px' } })));
            return Paint;
        },
        removeAllPaints: function() {
            if(this.Paints) this.Paints.forEach(Paint => Paint.parentElement.removeChild(Paint));
            if(this.FocusedRange) this.FocusedRange = null;
            return this.Paints = [];
        },
        prepareRepainting: function() {
            if(!this.Paints || !this.Paints.length) return;
            const FocusedRange = this.FocusedRange;
            const Repaints = this.Paints.map(Paint => [Paint.Range, Paint.Spec]);
            this.removeAllPaints();
            this.FocusedRange = FocusedRange;
            return () => Repaints.forEach(Repaint => this.paint(...Repaint));
        },
        repaint: function() {
            const repaint = this.prepareRepainting();
            if(repaint) repaint();
        },
        reserveRepainting: function(Time) {
            clearTimeout(this.Timer_reserveRepainting);
            this.Timer_reserveRepainting = setTimeout(() => this.repaint(), Time);
        },
        createSearchUI: function() { if(!S['use-search-ui'] || !S['use-menubar'] || !I.Menu) return null;
            const UIID = 'bibi-search', IconHTML = `<span class="bibi-icon"></span>`;
            const UI = RangeFinder.UI = I.setToggleAction(sML.create('div', { id: UIID }), { onopened: () => UI.start(), onclosed: () => UI.end() });
            const Bar                 = UI.appendChild(sML.create('div', { id: UIID + '-bar', addButtonGroup: (BG) => Bar.appendChild(I.createButtonGroup(BG)) }));
            const Form                =     Bar.appendChild(sML.create('form', { id: UIID + '-form', action: location.href }));
            const FormInput           =         Form.appendChild(sML.create('input', { type: 'search', id: Form.id + '-input', placeholder: I.distillLabels.distillLanguage({ default: 'Search', ja: '検索' })[O.Language] }));
            const Progress            =     Bar.appendChild(sML.create('div', { id: UIID + '-progress' }));
            const ProgressCurrent     =         Progress.appendChild(sML.create('span', { id: Progress.id + '-current',   innerHTML: `-` }));
            const ProgressDelimiter   =         Progress.appendChild(sML.create('span', { id: Progress.id + '-delimiter', innerHTML: `/` }));
            const ProgressTotal       =         Progress.appendChild(sML.create('span', { id: Progress.id + '-total',     innerHTML: `-` }));
            const ListOpener          =     Bar.addButtonGroup({ id: UIID + '-listopener' });
            const ListOpenerButton    =         ListOpener.addButton({ id: ListOpener.id + '-button', Type: 'toggle', Icon: IconHTML, Labels: { default: { default: `List of the Results`, ja: `検索結果一覧` }, active: { default: `Close`, ja: `閉じる` } } });
            const Move                =     Bar.addButtonGroup({ id: UIID + '-move', Type: 'Tiled' });
            const MovePrev            =         Move.addButton({ id: Move.id + '-prev', Type: 'normal', Icon: IconHTML, Labels: { default: { default: `Previous`, ja: `前` } }, action: () => List.close() && this.autofocusOnTheSearchResult({ Reverse: true }) });
            const MoveNext            =         Move.addButton({ id: Move.id + '-next', Type: 'normal', Icon: IconHTML, Labels: { default: { default: `Next`,     ja: `次` } }, action: () => List.close() && this.autofocusOnTheSearchResult(                 ) });
            const UICloser            =     Bar.addButtonGroup({ id: UIID + '-closer' });
            const UICloserButton      =         UICloser.addButton({ id: UICloser.id + '-button', Type: 'normal', Icon: IconHTML, Labels: { default: { default: `Close`, ja: `閉じる` } }, action: () => UI.close() });
            const UIOpener            = I.createButtonGroup({ id: UIID + '-opener' });
            const UIOpenerButton      =     UIOpener.addButton({ id: UIOpener.id + '-button', Type: 'normal', Icon: IconHTML, Labels: { default: { default: `Search`, ja: `検索` } }, action: () => UI.open() });
            const List                = I.createSubpanel({ id: UIID + '-list', Opener: ListOpenerButton, Position: 'center' });
            const ListButtonGroup     =     List.addSection().addButtonGroup();
            Object.assign(UI, {
                start: () => {
                    I.Subpanels.forEach(Sp => Sp.close());
                    this.resetSearch();
                    FormInput.focus();
                    O.HTML.classList.add('search-active');
                },
                end: () => {
                    I.Subpanels.forEach(Sp => Sp.close());
                    O.HTML.classList.remove('search-active');
                    FormInput.blur(), O.Body.focus();
                    this.resetSearch();
                },
                updateBar: () => {
                    const SearchResults = this.Search.Results, SearchResultF = SearchResults.Focused;
                    const Current = SearchResultF ? SearchResultF.Index + 1 : 0;
                    const Total = SearchResults.length;
                    const JoinedSStrs = this.Search.Strings.join('<OR>');
                    if(FormInput.value != JoinedSStrs) FormInput.value = JoinedSStrs;
                    Progress.classList.toggle('disabled', !Total);
                    if(ProgressCurrent.textContent != Current) ProgressCurrent.innerHTML = Current;
                    if(  ProgressTotal.textContent != Total  )   ProgressTotal.innerHTML = Total;
                    [MovePrev, MoveNext].forEach(Button => I.setUIState(Button, Total > 1 ? 'default' : 'disabled'));
                    I.setUIState(ListOpenerButton, Total ? 'default' : 'disabled');
                    if(!Total) List.close();
                    return Bar;
                },
                updateList: () => {
                    const SearchResults = this.Search.Results;
                    if(List.Results == SearchResults) return List;
                    List.Results = SearchResults;
                    if(ListButtonGroup.Buttons.length) {
                        ListButtonGroup.innerHTML = '';
                        ListButtonGroup.Buttons = [];
                    }
                    if(SearchResults) SearchResults.forEach((SearchResult, i) => {
                        const Button = ListButtonGroup.addButton({
                            Icon: `<span>` + (SearchResult.Index + 1) + `</span>`,
                            Labels: { default: { default: SearchResult.TextAround.map((Txt, i) => sML.create(i == 2 ? 'strong' : i % 2 == 1 ? 'em' : 'span', { innerHTML: Txt.replace(/(<span class="break"> <\/span>)/g, '$1\n') }).outerHTML).join('') } },
                            action: () => List.close() && this.setSearchResultFocusTo(SearchResult.Index)
                        });
                        if(SearchResult.IndexInItem == 0)                                           Button.classList.add('first-in-item');
                        if(!SearchResults[i + 1] || SearchResults[i + 1].Item != SearchResult.Item) Button.classList.add( 'last-in-item');
                    });
                    return List;
                },
                update: (NotFound) => {
                    clearTimeout(UI.Timer_update);
                    UI.Timer_update = setTimeout(() => UI.updateBar() && UI.updateList() && NotFound && UI.notFound(), 33);
                },
                notFound: () => new Promise(resolve => {
                    FormInput.blur();
                    FormInput.setAttribute('disabled', 'disabled');
                    const FormInputValue = FormInput.value;
                    Form.classList.add('not-found');
                    FormInput.value = I.distillLabels.distillLanguage({ default: 'Not Found', ja: 'みつかりませんでした' })[O.Language];
                    setTimeout(() => {
                        FormInput.value = '';
                        Form.classList.remove('not-found');
                        FormInput.value = FormInputValue;
                        FormInput.removeAttribute('disabled');
                        FormInput.focus();
                        resolve();
                    }, 777);
                }),
                submit: (Alt) => this.search(FormInput.value.split('<OR>'), { Focus: Alt ? 'auto-reverse' : 'auto' })
            });
            ['click', 'touchstart', 'touchmove', 'touchend', 'pointerdown', 'pointermove', 'pointerup', 'mousedown', 'mousemove', 'mouseup', 'keydown', 'keypress', 'keyup', 'wheel', 'mousewheel'].forEach(_ => UI.addEventListener(_, E.stopPropagation));
            ['autocapitalize', 'autocomplete', 'autocorrect'].forEach(_ => FormInput.setAttribute(_, 'off'));
            E.bind('bibi:updated-search-status', () => UI.update());
            E.bind('bibi:searched', () => this.Search.Results.length || UI.update('NotFound'));
            Form.addEventListener('submit', () => UI.submit());
            FormInput.addEventListener('keypress', Eve => {
                if(Eve.key != 'Enter' && Eve.keyCode != 13) return;
                Eve.preventDefault();
                UI.submit(Eve.shiftKey);
            });
            FormInput.addEventListener('keyup', Eve => {
                if(FormInput.value) return;
                Eve.preventDefault();
                UI.submit();
            });
            const addShortcutKey = (Target) => Target.addEventListener('keydown', Eve => {
                if((Eve.key != 'f' && Eve.keyCode != 70) || (!Eve.metaKey && !Eve.ctrlKey)) return;
                Eve.preventDefault();
                if(UI.UIState == 'default') return UI.open();
                if(!FormInput.value) return UI.close();
                FormInput.value = '';
                UI.submit();
            }, E.CPO_000);
            [FormInput, window].concat(R.Items.map(Item => Item.contentWindow || null)).forEach(Target => Target ? addShortcutKey(Target) : undefined); E.add('bibi:loaded-item', Item => addShortcutKey(Item.contentWindow));
            I.Menu.appendChild(UI);
            I.Menu.R.appendChild(UIOpener);
            return UI;
        },
        selectRange: function(Ran) {
            if(!Ran || typeof Ran != 'object' || !Ran.commonAncestorContainer) return null;
            const Sel = Ran.commonAncestorContainer.ownerDocument.defaultView.getSelection();
            Sel.removeAllRanges();
            Sel.addRange(Ran);
            return Sel;
        },
        getSelection: function(Doc) {
            if(Doc) {
                const Sel = Doc.getSelection();
                if(Sel.type == 'Range') return Sel;
            } else for(let l = R.Items.length, i = 0; i < l; i++) {
                const Sel = this.getSelection(R.Items[i].contentDocument);
                if(Sel) return Sel;
            }
            return null;
        },
        getSelectedText: function(Opt) {
            const Sel = this.Selection || this.getSelection();
            if(!Sel || Sel.type != 'Range' || !Sel.anchorNode) return '';
            if(!Opt || typeof Opt != 'object') Opt = {};
            const IncludeImgAlt      = Opt.IncludeImgAlt      !== false;
            const IgnoreRubies       = Opt.IgnoreRubies       !== false;
            const OptimizeLineBreaks = Opt.OptimizeLineBreaks !== false;
            let SelectedText = '';
            if(!IncludeImgAlt && !IgnoreRubies) SelectedText = Sel.toString();
            else {
                const DF = Sel.getRangeAt(0).cloneContents();
                if(IncludeImgAlt) sML.forEach(DF.querySelectorAll(    'img'))(Ele => Ele.parentNode.insertBefore(document.createTextNode(Ele.alt), Ele).parentNode.removeChild(Ele));
                if(IgnoreRubies)  sML.forEach(DF.querySelectorAll( 'rt, rp'))(Ele =>                                                                Ele.parentNode.removeChild(Ele));
                SelectedText = DF.textContent;
            }
            if(OptimizeLineBreaks) {
                SelectedText = SelectedText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n{2}/g, '\n').replace(/\n{2,}/g, '\n\n');
                if(sML.OS.Windows) SelectedText = SelectedText.replace(/\n/g, '\r\n');
            }
            return SelectedText;
        },
        initialize: function() {
            this.initializeSearch();
            E.add('bibi:loaded-item', Item => {
                Item.RangeFinder = {};
                Item.contentDocument.addEventListener('selectstart', (Eve) => {
                    const Sel = this.Selection;
                    if(Sel && Sel.anchorNode.ownerDocument != Eve.target) Sel.removeAllRanges();
                    this.Selection = this.RangeOfSelection = null;
                }, E.CPO_110);
                Item.contentDocument.addEventListener('selectionchange', (Eve) => {
                    clearTimeout(Item.RangeFinder.Timer_SelectionChanged);
                    Item.RangeFinder.Timer_SelectionChanged = setTimeout(() => this.RangeOfSelection = (this.Selection = this.getSelection(Eve.target))?.getRangeAt(0), 0);
                }, E.CPO_110);
                Item.contentDocument.addEventListener('copy', (Eve) => {
                    Eve.preventDefault();
                    const SelectedText = this.getSelectedText({ IncludeImgAlt: true, IgnoreRubies: true, OptimizeLineBreaks: true });
                    if(SelectedText) Eve.clipboardData.setData('text/plain', SelectedText);
                }, E.CPO_100);
            });
            E.add('bibi:opened', () => {
                if(S['use-search-ui'] && B.Package.Metadata['rendition:layout'] == 'reflowable') this.createSearchUI();
                E.add('bibi:changed-intersection', () => {
                    this.reserveRepainting(999);
                });
                E.bind('bibi:is-going-to:lay-out', () => {
                    const repaint = this.prepareRepainting();
                    if(!repaint) return;
                    let repaintAfterLayingOut;
                    E.add('bibi:laid-out', repaintAfterLayingOut = () => setTimeout(() => repaint(), 333) && E.remove('bibi:laid-out', repaintAfterLayingOut));
                });
            });
        }
    };
    RangeFinder.initialize();
}};


I.Arrows = { create: () => { if(!S['use-arrows']) return I.Arrows = null;
    const Arrows = I.Arrows = O.Body.appendChild(sML.create('div', { id: 'bibi-arrows' }));
    Object.assign(Arrows, {
        initialize: () => {
            (Arrows.All = [
                Arrows.Back     = Arrows[-1] = Arrows.appendChild(sML.create('div', { className: 'bibi-arrow', Labels: { default: { default: `Back`,    ja: `戻る` } }, Distance: -1 })),
                Arrows.Forward  = Arrows[ 1] = Arrows.appendChild(sML.create('div', { className: 'bibi-arrow', Labels: { default: { default: `Forward`, ja: `進む` } }, Distance:  1 })),
                Arrows.BackO    =                                 sML.create('div', { className: 'bibi-arrow', Labels: { default: { default: `Back`,    ja: `戻る` } }, Distance: -1 }),
                Arrows.ForwardO =                                 sML.create('div', { className: 'bibi-arrow', Labels: { default: { default: `Forward`, ja: `進む` } }, Distance:  1 })
            ]).forEach(Arrow => {
                I.setFeedback(Arrow);
                const FunctionsToBeCanceled = [Arrow.showHelp, Arrow.hideHelp, Arrow.BibiTapObserver.onTap];
                if(!O.TouchOS) FunctionsToBeCanceled.push(Arrow.BibiHoverObserver.onHover, Arrow.BibiHoverObserver.onUnHover);
                FunctionsToBeCanceled.forEach(f2BC => f2BC = () => {});
            });
            if(S['indicate-orthogonal-arrows-if-necessary']) [Arrows.BackO, Arrows.ForwardO].forEach(OArrow => Arrows.appendChild(OArrow));
            Arrows.Back.Pair = Arrows.Forward,   Arrows.Back.Alt = Arrows.BackO;
            Arrows.Forward.Pair = Arrows.Back,   Arrows.Forward.Alt = Arrows.ForwardO;
            Arrows.BackO.Pair = Arrows.ForwardO, Arrows.BackO.Alt = Arrows.Back;
            Arrows.ForwardO.Pair = Arrows.BackO, Arrows.ForwardO.Alt = Arrows.Forward;
            delete Arrows.initialize;
        },
        update: () => {
            Arrows.All.forEach(Arrow => {
                Arrow.classList.add('bibi-arrow-updating');
                ['horizontal', 'vertical', 'up', 'right', 'down', 'left'].forEach(ClassName => Arrow.classList.remove('bibi-arrow-' + ClassName))
            });
            switch(S.ARA) {
                case 'horizontal': switch(S.PPD) {
                    case 'ltr': Arrows['left']  = Arrows.Back, Arrows['right'] = Arrows.Forward; break;
                    case 'rtl': Arrows['right'] = Arrows.Back, Arrows['left']  = Arrows.Forward; break;
                } Arrows['top'] = Arrows['up'] = Arrows.BackO, Arrows['bottom'] = Arrows['down'] = Arrows.ForwardO; break;
                case 'vertical': switch(S.PPD) {
                    case 'ltr': Arrows['left']  = Arrows.BackO, Arrows['right'] = Arrows.ForwardO; break;
                    case 'rtl': Arrows['right'] = Arrows.BackO, Arrows['left']  = Arrows.ForwardO; break;
                } Arrows['top'] = Arrows['up'] = Arrows.Back, Arrows['bottom'] = Arrows['down'] = Arrows.Forward; break;
            }
            ['horizontal',  'left'].forEach(ClassName =>   Arrows['left'].classList.add('bibi-arrow-' + ClassName));
            ['horizontal', 'right'].forEach(ClassName =>  Arrows['right'].classList.add('bibi-arrow-' + ClassName));
            [  'vertical',    'up'].forEach(ClassName =>    Arrows['top'].classList.add('bibi-arrow-' + ClassName));
            [  'vertical',  'down'].forEach(ClassName => Arrows['bottom'].classList.add('bibi-arrow-' + ClassName));
            Arrows.All.forEach(Arrow => Arrow.classList.remove('bibi-arrow-updating'));
        },
        toggleState: () => Arrows.All.forEach(Arrow => {
            const Availability = I.Flipper.isAbleToFlip(Arrow.Distance);
            Arrow.classList.toggle(  'available',  Availability);
            Arrow.classList.toggle('unavailable', !Availability);
        }),
        navigate: () => setTimeout(() => {
            [Arrows.Back, Arrows.Forward].forEach(Arrow => I.Flipper.isAbleToFlip(Arrow.Distance) ? Arrow.classList.add('glowing') : false);
            setTimeout(() => [Arrows.Back, Arrows.Forward].forEach(Arrow => Arrow.classList.remove('glowing')), 1234);
        }, 400)
    });
    O.HTML.classList.add('arrows-active');
    Arrows.initialize();
    E.add('bibi:commands:move-by', Distance => { // indicate direction
        if(!L.Opened || typeof (Distance *= 1) != 'number' || !isFinite(Distance) || !(Distance = Math.round(Distance))) return false;
        return E.dispatch(Distance < 0 ? Arrows.Back : Arrows.Forward, 'bibi:singletapped');
    });
    E.add('bibi:opened',       () => setTimeout(() => { Arrows.update(); Arrows.toggleState(); Arrows.navigate(); }, 123));
    E.add('bibi:scrolled',     () => setTimeout(() => {                  Arrows.toggleState();                    },   0));
    E.add('bibi:changed-view', () => setTimeout(() => { Arrows.update(); Arrows.toggleState(); Arrows.navigate(); },   0));
    E.dispatch('bibi:created-arrows');
     // Optimize to Scrollbar Size
    (_ => {
        _('html:not(.slider-opened).book-full-height',       'horizontal', 'height', O.Scrollbars.Width);
        _('html:not(.slider-opened):not(.book-full-height)', 'horizontal', 'height', O.Scrollbars.Width + I.Menu.Height);
        _('html:not(.slider-opened).appearance-vertical',      'vertical',  'width', O.Scrollbars.Width);
    })((Context, HorV, WorH, Margin) => sML.appendCSSRule(
        `${ Context } div.bibi-arrow.bibi-arrow-${ HorV }`,
        `${ WorH }: calc(100% - ${ Margin }px); ${ WorH }: calc(100v${ WorH.charAt(0) } - ${ Margin }px);`
    ));
    (_ => {
        _('html:not(.slider-opened).appearance-vertical',  'right', 'right');
        _('html:not(.slider-opened).appearance-horizontal', 'down', 'bottom');
    })((Context, Dir, Side) => sML.appendCSSRule(
        `${ Context } div.bibi-arrow.bibi-arrow-${ Dir }`,
        `${ Side }: ${ O.Scrollbars.Width }px;`
    ));
}};


I.BuildStamp = { create: () => { // ?buildstamp=1 overlay: proves which bundle a tab runs (host + the running bibi.js ?v= content hash). Same code everywhere shows the same hash: comparable across servers, no fetch needed.
    if(!/[?&]buildstamp\b/.test(location.search || '')) return;
    E.add('bibi:opened', () => {
        const Badge = O.Body.appendChild(sML.create('div', { id: 'bibi-buildstamp' }));
        sML.appendCSSRule('div#bibi-buildstamp', 'position:fixed;left:8px;bottom:8px;z-index:99999999999;background:rgba(0,0,0,.78);color:#7fff9f;font:12px/1.6 monospace;padding:8px 10px;border-radius:6px;pointer-events:none;white-space:pre;');
        let V = '';
        try { V = new URL(Bibi.Script.src).searchParams.get('v') || '(no ?v= on script URL)'; } catch(Err) { V = '(unreadable script URL)'; }
        Badge.textContent = location.host + '\nbundle: code #' + V;
    });
}};


I.AxisSwitcher = { create: () => { if(S['fix-reader-view-mode']) return I.AxisSwitcher = null;
    const UseUI = S['use-axis-switcher-ui'];
    let AxisSwitcher, Circle, Arrows, CW, _t;
    if(UseUI) {
        AxisSwitcher = O.Body.appendChild(sML.create('div', { id: 'bibi-axis-switcher' }));
        Circle = AxisSwitcher.appendChild(sML.create('span')), CW = parseFloat(getComputedStyle(Circle).borderWidth); sML.CSS.appendRule('div#bibi-axis-switcher > span:first-child', 'border-width: 0;');
        Arrows = AxisSwitcher.appendChild(sML.create('span'));
        _t = (_P, _VR, _RR, _ep) => _P < _RR[0] ? _VR[0] : _P > _RR[1] ? _VR[1] : _VR[0] + (_VR[1] - _VR[0]) * Math.pow(_ep[0]((_P - _RR[0]) / (_RR[1] - _RR[0])), _ep[1]);
    } else {
        AxisSwitcher = {};
    }
    I.AxisSwitcher = Object.assign(AxisSwitcher, {
        progress: (_R) => {
            AxisSwitcher.InProgress = true;
            const _P = sML.limitMinMax(Math.abs(_R), 0, 1);
            E.dispatch('bibi:progresses-axis-switcher', _P);
            if(!UseUI) return;
            AxisSwitcher.style.transform   =  'scale(' + _t(_P, [    .4,  1                    ], [.4,  1], [sML.Easing.easeOutBack,   4])    + ')';
            AxisSwitcher.style.opacity     =             _t(_P, [     0,  1                    ], [.4,  1], [sML.Easing.easeOutCirc,   1])         ;
                  Circle.style.borderWidth =             _t(_P, [CW / 4, CW                    ], [.4, .8], [sML.Easing.easeOutBack,   4])   + 'px';
                  Circle.style.opacity     =             _t(_P, [     0,  1                    ], [.2, .8], [sML.Easing.easeOutBack,   1])         ;
                  Arrows.style.transform   = 'rotate(' + _t(_P, [     0, 90 * (_R < 0 ? -1 : 1)], [.6,  1], [sML.Easing.easeInOutExpo, 1]) + 'deg)';
                  Arrows.style.opacity     =             _t(_P, [     0,  1                    ], [.4, .8], [sML.Easing.easeInOutExpo, 1])         ;
        },
        reset: () => {
            if(AxisSwitcher.InProgress) {
                AxisSwitcher.InProgress = false;
                E.dispatch('bibi:cancelled-axis-switcher');
            }
            if(!UseUI) return;
            AxisSwitcher.style.transition = '.1s ease-out';
            setTimeout(() => AxisSwitcher.style.opacity = AxisSwitcher.style.transform = '', 0);
            setTimeout(() => AxisSwitcher.style.transition = Circle.style.borderWidth = Circle.style.opacity = Arrows.style.transform = Arrows.style.opacity = '', 111);
        },
        switchAxis: () => new Promise(resolve => {
            AxisSwitcher.InProgress = false;
            AxisSwitcher.reset();
            let RVM = ''; switch(S['available-reader-view-modes'].length) {
                case 2: RVM = S['available-reader-view-modes'][S['available-reader-view-modes'][0] != S.RVM ? 0 : 1]; break;
                case 3: switch(S.RVM) {
                    case 'horizontal': RVM =   'vertical'; break;
                    case   'vertical': RVM = 'horizontal'; break;
                } break;
            }
            if(RVM) R.changeView({ Mode: RVM, NoNotification: true });
            resolve();
        })
    });
    E.dispatch('bibi:created-axis-switcher');
}};


I.Spinner = { create: () => {
    const Spinner = I.Spinner = O.Body.appendChild(sML.create('div', { id: 'bibi-spinner' }));
    for(let i = 1; i <= 12; i++) Spinner.appendChild(document.createElement('span'));
    E.dispatch('bibi:created-spinner');
}};


I.createButtonGroup = (Par = {}) => {
    if(Par.Area && Par.Area.tagName) {
        const AreaToBeAppended = Par.Area;
        delete Par.Area;
        return AreaToBeAppended.addButtonGroup(Par);
    }
    const ButtonsToBeAdded = Array.isArray(Par.Buttons) ? Par.Buttons : Par.Button ? [Par.Button] : [];
    delete Par.Buttons;
    delete Par.Button;
    const CommonClassName = 'bibi-buttongroup', ClassNames = [CommonClassName];
    if(Par.Type == 'Steps') {
        const StepsCommonClassName = CommonClassName + '-steps', StepsUniqueClassName = StepsCommonClassName + '-' + String(I.createButtonGroup.StepsUniqueCount = (I.createButtonGroup.StepsUniqueCount || 0) + 1).padStart(3, '0');
        ClassNames.push(StepsCommonClassName, StepsUniqueClassName);
        if(typeof Par.MinLabels == 'object') sML.CSS.appendRule('.' + StepsUniqueClassName + ':before', `content: "` + I.distillLabels(Par.MinLabels)['default'][O.Language] + `" !important;`);
        if(typeof Par.MaxLabels == 'object') sML.CSS.appendRule('.' + StepsUniqueClassName + ':after',  `content: "` + I.distillLabels(Par.MaxLabels)['default'][O.Language] + `" !important;`);
        ButtonsToBeAdded.forEach(Button => Button.Type = 'radio');
    } else if(Par.Type == 'Tiled' || Par.Tiled) {
        ClassNames.push(CommonClassName + '-tiled');
    }
    if(Par.Lively) ClassNames.push('lively');
    if(typeof Par.className == 'string' && Par.className) ClassNames.push(Par.className);
    Par.className = ClassNames.join(' ');
    if(typeof Par.id != 'string' || !Par.id) delete Par.id;
    const ButtonGroup = sML.create('ul', Par);
    ButtonGroup.Buttons = [];
    ButtonGroup.addButton = function(Par) {
        const Button = I.createButton(Par); if(!Button) return null;
        (Button.ButtonBox = (Button.ButtonGroup = this).appendChild(sML.create('li', { className: 'bibi-buttonbox bibi-buttonbox-' + Button.Type }))).appendChild(Button);
        if(!O.TouchOS) {
            I.TouchObserver.observeElementHover(Button.ButtonBox)
            I.TouchObserver.setElementHoverActions(Button.ButtonBox);
        }
        this.Buttons.push(Button);
        return Button;
    };
    ButtonGroup.addButtons = function(Pars) { Pars.forEach(Par => this.addButton(Par)); return this.Buttons; };
    ButtonsToBeAdded.forEach(Button => {
        if(!Button.Type && Par.ButtonType) Button.Type = Par.ButtonType;
        if(!Button.action && Par.action) Button.action = Par.action;
        ButtonGroup.addButton(Button);
    });
    ButtonGroup.Busy = false;
    return ButtonGroup;
};


I.createButton = (Par = {}) => {
    if(typeof Par.className != 'string' || !Par.className) delete Par.className;
    if(typeof Par.id        != 'string' || !Par.id       ) delete Par.id;
    Par.Type = (typeof Par.Type == 'string' && /^(normal|toggle|radio|link)$/.test(Par.Type)) ? Par.Type : 'normal';
    const ClassNames = ['bibi-button', 'bibi-button-' + Par.Type];
    if(Par.className) ClassNames.push(Par.className);
    Par.className = ClassNames.join(' ');
    if(typeof Par.Icon != 'undefined' && !Par.Icon.tagName) {
        if(typeof Par.Icon == 'string' && Par.Icon) {
            Par.Icon = sML.hatch(Par.Icon);
        } else {
            delete Par.Icon;
        }
    }
    const Button = sML.create((typeof Par.href == 'string' ? 'a' : 'span'), Par);
    if(Button.Icon) {
        Button.IconBox = Button.appendChild(sML.create('span', { className: 'bibi-button-iconbox' }));
        Button.IconBox.appendChild(Button.Icon);
        Button.Icon = Button.IconBox.firstChild;
        Button.IconBox.Button = Button.Icon.Button = Button;
    }
    Button.Label = Button.appendChild(sML.create('span', { className: 'bibi-button-label' }));
    I.setFeedback(Button, {
        Help: Par.Help,
        Checked: Par.Checked,
        StopPropagation: true,
        PreventDefault: (Button.href ? false : true)
    });
    Button.isAvailable = () => {
        if(Button.Busy) return false;
        if(Button.ButtonGroup && Button.ButtonGroup.Busy) return false;
        return (Button.UIState != 'disabled');
    };
    if(typeof Button.action == 'function') E.add(Button, 'bibi:singletapped', () => Button.isAvailable() ? Button.action.apply(Button, arguments) : null);
    Button.Busy = false;
    return Button;
};


I.createSubpanel = (Par = {}) => {
    if(typeof Par.className != 'string' || !Par.className) delete Par.className;
    if(typeof Par.id        != 'string' || !Par.id       ) delete Par.id;
    const ClassNames = ['bibi-subpanel', 'bibi-subpanel-' + (/^(left|center|right)$/.test(Par.Position) ? Par.Position : 'right')];
    if(Par.className) ClassNames.push(Par.className);
    Par.className = ClassNames.join(' ');
    const SectionsToAdd = Array.isArray(Par.Sections) ? Par.Sections : Par.Section ? [Par.Section] : [];
    delete Par.Sections;
    delete Par.Section;
    const Subpanel = O.Body.appendChild(sML.create('div', Par));
    Subpanel.Sections = [];
    Subpanel.addEventListener(E['pointerdown'], Eve => Eve.stopPropagation());
    Subpanel.addEventListener(E['pointerup'],   Eve => Eve.stopPropagation());
    Subpanel.addEventListener('wheel',          Eve => Eve.stopPropagation());
    I.setToggleAction(Subpanel, {
        onopened: function(Opt) {
            I.Subpanels.forEach(Sp => Sp == Subpanel ? true : Sp.close({ ForAnotherSubpanel: true }));
            I.OpenedSubpanel = this;
            this.classList.add('opened');
            O.HTML.classList.add('subpanel-opened');
            if(Subpanel.Opener) I.setUIState(Subpanel.Opener, 'active');
            if(Par.onopened) Par.onopened.apply(Subpanel, arguments);
            E.dispatch(Subpanel, 'bibi:opened-subpanel', Subpanel), E.dispatch('bibi:opened-subpanel', Subpanel);
        },
        onclosed: function(Opt) {
            this.classList.remove('opened');
            if(I.OpenedSubpanel == this) setTimeout(() => I.OpenedSubpanel = null, 222);
            if(!Opt || !Opt.ForAnotherSubpanel) {
                O.HTML.classList.remove('subpanel-opened');
            }
            if(Subpanel.Opener) {
                I.setUIState(Subpanel.Opener, 'default');
            }
            if(Par.onclosed) Par.onclosed.apply(Subpanel, arguments);
            E.dispatch(Subpanel, 'bibi:closed-subpanel', Subpanel), E.dispatch('bibi:closed-subpanel', Subpanel);
        }
    });
    Subpanel.bindOpener = (Opener) => {
        E.add(Opener, 'bibi:singletapped', () => Subpanel.toggle());
        Subpanel.Opener = Opener;
        return Subpanel.Opener;
    }
    if(Subpanel.Opener) Subpanel.bindOpener(Subpanel.Opener);
    E.add('bibi:opened-panel',      Subpanel.close);
    E.add('bibi:closes-utilities',  Subpanel.close);
    I.Subpanels.push(Subpanel);
    Subpanel.addSection = function(Par = {}) {
        const SubpanelSection = I.createSubpanelSection(Par);
        if(!SubpanelSection) return null;
        SubpanelSection.Subpanel = this;
        this.appendChild(SubpanelSection)
        this.Sections.push(SubpanelSection);
        return SubpanelSection;
    };
    SectionsToAdd.forEach(SectionToAdd => Subpanel.addSection(SectionToAdd));
    return Subpanel;
};


I.createSubpanelSection = (Par = {}) => {
    if(typeof Par.className != 'string' || !Par.className) delete Par.className;
    if(typeof Par.id        != 'string' || !Par.id       ) delete Par.id;
    const ClassNames = ['bibi-subpanel-section'];
    if(Par.className) ClassNames.push(Par.className);
    Par.className = ClassNames.join(' ');
    const PGroupsToAdd = Array.isArray(Par.PGroups) ? Par.PGroups : Par.PGroup ? [Par.PGroup] : [];
    delete Par.PGroups;
    delete Par.PGroup;
    const ButtonGroupsToAdd = Array.isArray(Par.ButtonGroups) ? Par.ButtonGroups : Par.ButtonGroup ? [Par.ButtonGroup] : [];
    delete Par.ButtonGroups;
    delete Par.ButtonGroup;
    const SubpanelSection = sML.create('div', Par);
    if(SubpanelSection.Labels) { // HGroup
        SubpanelSection.Labels = I.distillLabels(SubpanelSection.Labels);
        SubpanelSection
            .appendChild(sML.create('div', { className: 'bibi-hgroup' }))
                .appendChild(sML.create('p', { className: 'bibi-h' }))
                    .appendChild(sML.create('span', { className: 'bibi-h-label', innerHTML: SubpanelSection.Labels['default'][O.Language] }));
    }
    SubpanelSection.ButtonGroups = []; // ButtonGroups
    SubpanelSection.addButtonGroup = function(Par = {}) {
        const ButtonGroup = I.createButtonGroup(Par);
        this.appendChild(ButtonGroup);
        this.ButtonGroups.push(ButtonGroup);
        return ButtonGroup;
    };
    ButtonGroupsToAdd.forEach(ButtonGroupToAdd => {
        if(ButtonGroupToAdd) SubpanelSection.addButtonGroup(ButtonGroupToAdd);
    });
    return SubpanelSection;
};


I.setToggleAction = (Obj, Par = {}) => {
    // Par = {
    //      onopened: Function,
    //      onclosed: Function
    // };
    return sML.edit(Obj, {
        UIState: 'default',
        open: (Opt) => new Promise(resolve => {
            if(Obj.UIState == 'default') {
                I.setUIState(Obj, 'active');
                if(Par.onopened) Par.onopened.call(Obj, Opt);
            }
            resolve(Opt);
        }),
        close: (Opt) => new Promise(resolve => {
            if(Obj.UIState == 'active') {
                I.setUIState(Obj, 'default');
                if(Par.onclosed) Par.onclosed.call(Obj, Opt);
            }
            resolve(Opt);
        }),
        toggle: (Opt) => Obj.UIState == 'default' ? Obj.open(Opt) : Obj.close(Opt)
    });
};


I.setFeedback = (Ele, Opt = {}) => {
    Ele.Labels = I.distillLabels(Ele.Labels);
    if(Ele.Labels) {
        if(Opt.Help) {
            Ele.showHelp = () => {
                if(I.Help && Ele.Labels[Ele.UIState]) I.Help.show(Ele.Labels[Ele.UIState][O.Language]);
                return Ele;
            };
            Ele.hideHelp = () => {
                if(I.Help) I.Help.hide();
                return Ele;
            };
        }
        if(Ele.Notification) Ele.notify = () => {
            if(Ele.Labels[Ele.UIState]) setTimeout(() => I.notify(Ele.Labels[Ele.UIState][O.Language]), 0);
            return Ele;
        }
    }
    if(!O.TouchOS) {
        I.TouchObserver.observeElementHover(Ele);
        I.TouchObserver.setElementHoverActions(Ele);
    }
    I.TouchObserver.observeElementTap(Ele, Opt);
    I.TouchObserver.setElementTapActions(Ele);
    I.setUIState(Ele, Opt.Checked ? 'active' : 'default');
    return Ele;
};


I.setUIState = (UI, UIState) => {
    if(!UIState) UIState = 'default';
    UI.PreviousUIState = UI.UIState;
    if(UIState == UI.UIState) return;
    UI.UIState = UIState;
    if(UI.tagName) {
        if(UI.Labels && UI.Labels[UI.UIState] && UI.Labels[UI.UIState][O.Language]) {
            UI.title = UI.Labels[UI.UIState][O.Language].replace(/<[^>]+>/g, '');
            if(UI.Label) UI.Label.innerHTML = UI.Labels[UI.UIState][O.Language];
        }
        sML.replaceClass(UI, UI.PreviousUIState, UI.UIState);
    }
    return UI.UIState;
};


I.isPointerStealth = () => {
    let IsPointerStealth = false;
    I.isPointerStealth.Checkers.forEach(checker => IsPointerStealth = checker() ? true : IsPointerStealth);
    return IsPointerStealth;
};

    I.isPointerStealth.Checkers = [];

    I.isPointerStealth.addChecker = (fun) => typeof fun == 'function' && !I.isPointerStealth.Checkers.includes(fun) ? I.isPointerStealth.Checkers.push(fun) : I.isPointerStealth.Checkers.length;


I.distillLabels = (Labels) => {
    if(typeof Labels != 'object' || !Labels) Labels = {};
    for(const State in Labels) Labels[State] = I.distillLabels.distillLanguage(Labels[State]);
    if(!Labels['default'])                       Labels['default']  = I.distillLabels.distillLanguage();
    if(!Labels['active']   && Labels['default']) Labels['active']   = Labels['default'];
    if(!Labels['disabled'] && Labels['default']) Labels['disabled'] = Labels['default'];
    return Labels;
};

    I.distillLabels.distillLanguage = (Label) => {
        if(typeof Label != 'object' || !Label) Label = { default: Label };
        if(typeof Label['default'] != 'string')  {
                 if(typeof Label['en'] == 'string')       Label['default']  = Label['en'];
            else if(typeof Label[O.Language] == 'string') Label['default']  = Label[O.Language];
            else                                          Label['default']  = '';
        }
        if(typeof Label[O.Language] != 'string') {
                 if(typeof Label['default'] == 'string')  Label[O.Language] = Label['default'];
            else if(typeof Label['en']      == 'string')  Label[O.Language] = Label['en'];
            else                                          Label[O.Language] = '';
        }
        return Label;
    };


I.orthogonal = (InputType, RVM = S.RVM) => {
    if(S['available-reader-view-modes'].includes(RVM)) {
        switch(RVM) {
            case 'paged':                       return S['on-orthogonal-' + InputType][0];
            case 'horizontal': case 'vertical': return S['on-orthogonal-' + InputType][1];
        }
    }
    return '';
};

I.draggable = (RVM = S.RVM) => {
    if(S['available-reader-view-modes'].includes(RVM)) {
        switch(RVM) {
            case 'paged':                       return S['content-draggable'][0] === true && S.ARA === S.SLA;
            case 'horizontal': case 'vertical': return S['content-draggable'][1] === true;
        }
    }
    return false;
};

I.isScrollable = () => (S.ARA == S.SLA && I.Loupe.CurrentTransformation.Scale == 1) ? true : false;


I.getBookIcon = () => sML.create('div', { className: 'book-icon', innerHTML: `<span></span>` });




