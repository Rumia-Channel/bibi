import { R, O } from './bibi.heart.context.mjs';
import { B } from './bibi.heart.book.mjs';

const Anchors = new WeakMap(), Documents = new Map();
const fail = (Code, Message) => Object.assign(new Error(Message), { code: Code });
const prefix = Item => '/6/' + ((Item.IndexInSpine + 1) * 2);
const currentNode = Entry => Entry?.nodes?.find(Node => Node.isConnected) || Entry?.node;

R.registerLocationDocument = Item => {
    if(!Item.Body || !Item.IsLinearItem) return;
    Item.Body.normalize();
    const Registry = { item: Item, body: Item.Body, entries: new Map(), textLength: 0 };
    Documents.set(Item, Registry);
    const visit = (Element, Steps, PSteps) => {
        const Path = prefix(Item) + '!' + Steps.map(Step => '/' + Step).join('');
        const Anchor = { item: Item, path: Path, p: [Item.Index + 1, ...PSteps].join('.'), textStart: Registry.textLength };
        Anchors.set(Element, Anchor); Registry.entries.set(Path, { node: Element, anchor: Anchor });
        let ElementIndex = 0, TextGroup = null;
        for(const Child of Element.childNodes) {
            if(Child.nodeType === 1) { ElementIndex++; TextGroup = null; visit(Child, [...Steps, ElementIndex * 2], [...PSteps, ElementIndex]); }
            else if(Child.nodeType === 3 && !Element.closest('script, style')) {
                const TextPath = Path + '/' + (ElementIndex * 2 + 1);
                if(!TextGroup) { TextGroup = { nodes: [], anchor: null, length: 0 }; Registry.entries.set(TextPath, TextGroup); }
                const TextAnchor = { ...Anchor, path: TextPath, textStart: Registry.textLength, groupOffset: TextGroup.length };
                Anchors.set(Child, TextAnchor); TextGroup.nodes.push(Child); TextGroup.anchor ||= TextAnchor;
                TextGroup.length += Child.length;
                if(Child.nodeValue.trim()) Registry.textLength += Child.length;
            }
        }
    };
    visit(Item.Body, [4], []);
};
R.hasLocationDocument = Item => !!Item?.Body && Documents.get(Item)?.body === Item.Body;
R.getLocationItem = Location => readLocation(Location, true);

R.rememberLocationDonation = (Item, Root) => {
    const Records = [];
    const visit = (Node, Steps) => {
        const Anchor = Anchors.get(Node);
        if(Anchor?.item === Item) Records.push({ steps: Steps, anchor: Anchor, oldNode: Node });
        Array.from(Node.childNodes).forEach((Child, Index) => visit(Child, [...Steps, Index]));
    };
    visit(Root, []); Item.LocationDonation = Records;
};
R.rebindLocationDonation = (Item, Root) => {
    const Registry = Documents.get(Item);
    if(!Registry) return;
    for(const Record of Item.LocationDonation || []) {
        let Node = Root;
        for(const Step of Record.steps) Node = Node?.childNodes[Step];
        if(!Node || Node.nodeType !== Record.oldNode.nodeType) continue;
        Anchors.set(Node, Record.anchor);
        const Entry = Registry.entries.get(Record.anchor.path);
        if(Entry?.nodes) Entry.nodes = Entry.nodes.map(Old => Old === Record.oldNode ? Node : Old);
        else if(Entry) Entry.node = Node;
        Record.oldNode = Node;
    }
};

const locationOf = (Node, Offset = 0) => {
    const Anchor = Anchors.get(Node);
    if(!Anchor) throw fail('LOCATION_NOT_FOUND', 'The visible content has no original-source anchor.');
    return { p: Anchor.p, cfi: Anchor.path + (Node.nodeType === 3 ? ':' + (Anchor.groupOffset + Offset) : '') };
};
const characterRange = (Node, Offset) => {
    const Range = Node.ownerDocument.createRange();
    Range.setStart(Node, Offset); Range.setEnd(Node, Math.min(Offset + 1, Node.length));
    return Range;
};
const firstTextOnPage = (Element, Page) => {
    const Walker = Element.ownerDocument.createTreeWalker(Element, NodeFilter.SHOW_TEXT);
    for(let Node = Walker.nextNode(); Node; Node = Walker.nextNode()) {
        if(!Node.length || !Node.nodeValue.trim() || !Anchors.has(Node)) continue;
        const First = R.getPageOfRangeHead(characterRange(Node, 0)), Last = R.getPageOfRangeHead(characterRange(Node, Node.length - 1));
        if(!First || !Last || First.Index > Page.Index || Last.Index < Page.Index) continue;
        let Low = 0, High = Node.length - 1;
        while(Low < High) {
            const Middle = Math.floor((Low + High) / 2), At = R.getPageOfRangeHead(characterRange(Node, Middle));
            if(At && At.Index < Page.Index) Low = Middle + 1; else High = Middle;
        }
        const Code = Node.charCodeAt ? Node.charCodeAt(Low) : Node.nodeValue.charCodeAt(Low);
        if(Low && Code >= 0xDC00 && Code <= 0xDFFF) Low--;
        const Rect = characterRange(Node, Low).getBoundingClientRect();
        if(Rect.width || Rect.height) return { node: Node, offset: Low };
    }
    return null;
};
R.getLocation = () => {
    const Page = R.getPage();
    if(!Page) throw fail('NOT_READY', 'The current page is unavailable.');
    const Item = Page.Item, Registry = Documents.get(Item);
    if(!Registry) throw fail('NOT_READY', 'The original content is not loaded.');
    const Text = firstTextOnPage(Item.Body, Page);
    if(Text) return locationOf(Text.node, Text.offset);
    const Walker = Item.contentDocument.createTreeWalker(Item.Body, NodeFilter.SHOW_ELEMENT);
    for(let Node = Walker.nextNode(); Node; Node = Walker.nextNode()) {
        if(!Anchors.has(Node) || !/^(img|svg|image|object)$/i.test(Node.tagName)) continue;
        const Rect = Node.getBoundingClientRect();
        if((Rect.width || Rect.height) && R.getPageOfRectHeadInItem(Rect, Item) === Page) return locationOf(Node);
    }
    return locationOf(Item.Body);
};

const readCFI = (CFI, OnlyItem = false) => {
    if(typeof CFI !== 'string' || !CFI) throw fail('INVALID_LOCATION', 'A nonempty CFI is required.');
    const Structure = O.CFIManager.parse(CFI);
    const Steps = Structure?.Path?.Steps;
    if(!Steps || Structure.Start || Steps.length < 2 || Number(Steps[0].Index) !== 6 || Number(Steps[1].Index) % 2 || Number(Steps[1].Index) < 2) throw fail('INVALID_LOCATION', 'Use a point CFI in the linear spine.');
    const Item = B.Package.Spine[Number(Steps[1].Index) / 2 - 1];
    if(!Item?.IsLinearItem) throw fail('LOCATION_NOT_FOUND', 'The CFI spine item is unavailable.');
    if(OnlyItem) return Item;
    const Registry = Documents.get(Item);
    if(!R.hasLocationDocument(Item)) throw fail('NOT_READY', 'The CFI content is not loaded.');
    const Local = Steps[2]?.Steps;
    if(!Local) return { registry: Registry, entry: Registry.entries.get(prefix(Item) + '!/4'), offset: null };
    let Path = prefix(Item) + '!', Offset = null;
    for(const Step of Local) {
        if(Step.Type === 'TermStep') { Offset = Number(Step.Index); continue; }
        if(Step.Type === 'IndirectPath') throw fail('INVALID_LOCATION', 'Nested indirect CFIs are not supported.');
        Path += '/' + Number(Step.Index);
    }
    const Entry = Registry.entries.get(Path);
    if(!Entry) throw fail('LOCATION_NOT_FOUND', 'The CFI element or text node does not exist.');
    if(Entry.nodes && Offset === null) Offset = 0;
    if(Offset !== null && (!Entry.nodes || !Number.isSafeInteger(Offset) || Offset < 0 || Offset > Entry.length)) throw fail('LOCATION_NOT_FOUND', 'The CFI character offset is outside its text.');
    return { registry: Registry, entry: Entry, offset: Offset };
};
const readLocation = (Location, OnlyItem = false) => {
    if(!Location || typeof Location !== 'object' || Array.isArray(Location)) throw fail('INVALID_LOCATION', 'A location object with cfi or p is required.');
    if(Location.cfi !== undefined) return readCFI(Location.cfi, OnlyItem);
    if(typeof Location.p !== 'string' || !/^[1-9]\d*(?:\.[1-9]\d*)*$/.test(Location.p)) throw fail('INVALID_LOCATION', 'Use a valid P or CFI.');
    const [NumberOfItem, ...Steps] = Location.p.split('.').map(Number), Item = R.Items[NumberOfItem - 1], Registry = Documents.get(Item);
    if(!Item) throw fail('LOCATION_NOT_FOUND', 'The P item does not exist.');
    if(OnlyItem) return Item;
    if(!R.hasLocationDocument(Item)) throw fail('NOT_READY', 'The P content is not loaded.');
    const Entry = Registry.entries.get(prefix(Item) + '!/4' + Steps.map(Step => '/' + Step * 2).join(''));
    if(!Entry) throw fail('LOCATION_NOT_FOUND', 'The P element does not exist.');
    return { registry: Registry, entry: Entry, offset: null };
};
const textPoint = ({ entry: Entry, offset: Offset }) => {
    for(const Node of Entry.nodes) {
        if(Offset <= Node.length) return { node: Node, offset: Offset };
        Offset -= Node.length;
    }
    throw fail('LOCATION_NOT_FOUND', 'The CFI text is unavailable.');
};
R.resolveLocation = Location => {
    const Parsed = readLocation(Location);
    let Destination;
    if(Parsed.entry.nodes) {
        const Point = textPoint(Parsed);
        if(!Point.node.isConnected) throw fail('LOCATION_NOT_FOUND', 'The original text is not attached.');
        Destination = R.dest({ Range: characterRange(Point.node, Point.offset) });
    } else {
        const Node = currentNode(Parsed.entry);
        if(!Node?.isConnected) throw fail('LOCATION_NOT_FOUND', 'The original element is not attached.');
        Destination = R.dest({ Element: Node });
    }
    if(!Destination?.Page) throw fail('LOCATION_NOT_FOUND', 'The location has no rendered page.');
    return Destination;
};
R.getReadingProgress = Location => {
    const Parsed = readLocation(Location), Item = Parsed.registry.item, Count = R.Items.length;
    if(!Count) throw fail('NOT_READY', 'The linear spine is unavailable.');
    if(Item.PrePaginated || B.PrePaginated || !Parsed.registry.textLength) return { progress: (Item.Index + 1) / Count, progressBasis: 'spine-items' };
    const Start = Parsed.entry.nodes ? textPoint(Parsed) : { node: currentNode(Parsed.entry), offset: 0 };
    const Anchor = Anchors.get(Start.node);
    const Fraction = Math.min(1, (Anchor.textStart + Start.offset) / Parsed.registry.textLength);
    return { progress: (Item.Index + Fraction) / Count, progressBasis: 'spine-text' };
};
