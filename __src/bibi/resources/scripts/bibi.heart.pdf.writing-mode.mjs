// Heart of Bibi — PDF writing mode: tells vertical writing (縦書き) from horizontal writing (横書き), page by page and for a whole document.
// Pure: no DOM, no pdf.js. It works on the text-content items that pdf.js hands out, so it can be reasoned about and tested on its own.
//
// The analysis has three parts:
//   1. the explicit direction of the fonts (a vertical CID font says so itself),
//   2. the geometry of the glyphs (columns that stand upright, rows that run sideways, and the order in which they are read),
//   3. the regularity of the placement (a text that flows in one direction only).
// The explicit direction alone never decides: a PDF may stack horizontally drawn glyphs in a vertical column, and vice versa.

export const WritingMode = { Vertical: 'vertical', Horizontal: 'horizontal', Unknown: 'unknown' };

// The thresholds of the analysis. Every one of them can be overridden through the options of a call.
const Defaults = {
    rotation: 0,                // the /Rotate of the page: the analysis runs in the orientation in which the page is shown
    toleranceFactor: 0.5,       // the tolerance of a group of glyphs, as a fraction of the size of a glyph
    maxLineGap: 1.4,            // the greatest distance between the glyphs of a line, as a fraction of the size of a glyph
    minCharacters: 10,          // fewer characters than this: the page tells nothing (a page number, a running head)
    minAlignedCharacters: 8,    // characters that must take part in a line or a column before a page can be decided
    decisionMargin: 0.15,       // the difference of the two scores that the winner has to reach
    minDocumentCharacters: 50,  // characters that the decided pages of a document have to have together
    smallGlyphSizeRatio: 0.6,   // a glyph smaller than this share of the median size is a sub-ordinate text (ruby, furigana)
    smallGlyphWeight: 0.25,     // ... and it counts this much
    maxGlyphsPerRun: 400,       // the characters of one text item that are taken apart (a long item must not blow up the analysis)
    weights: { align: 0.45, flow: 0.15, direction: 0.10, order: 0.10, explicit: 0.20 }
};

const numberOf = (Value, Fallback) => (typeof Value == 'number' && isFinite(Value)) ? Value : Fallback;

const optionsOf = (Options) => {
    const Opts = Options || {}, Weights = Opts.weights || {};
    const Rotation = numberOf(Opts.rotation, Defaults.rotation);
    return {
        rotation: ((Math.round(Rotation / 90) * 90) % 360 + 360) % 360,
        toleranceFactor: numberOf(Opts.toleranceFactor, Defaults.toleranceFactor),
        maxLineGap: numberOf(Opts.maxLineGap, Defaults.maxLineGap),
        minCharacters: numberOf(Opts.minCharacters, Defaults.minCharacters),
        minAlignedCharacters: numberOf(Opts.minAlignedCharacters, Defaults.minAlignedCharacters),
        decisionMargin: numberOf(Opts.decisionMargin, Defaults.decisionMargin),
        minDocumentCharacters: numberOf(Opts.minDocumentCharacters, Defaults.minDocumentCharacters),
        smallGlyphSizeRatio: numberOf(Opts.smallGlyphSizeRatio, Defaults.smallGlyphSizeRatio),
        smallGlyphWeight: numberOf(Opts.smallGlyphWeight, Defaults.smallGlyphWeight),
        maxGlyphsPerRun: numberOf(Opts.maxGlyphsPerRun, Defaults.maxGlyphsPerRun),
        weights: {
            align:    numberOf(Weights.align,    Defaults.weights.align),
            flow:     numberOf(Weights.flow,     Defaults.weights.flow),
            direction: numberOf(Weights.direction, Defaults.weights.direction),
            order:    numberOf(Weights.order,    Defaults.weights.order),
            explicit: numberOf(Weights.explicit, Defaults.weights.explicit)
        }
    };
};

// A page is shown rotated by its /Rotate (clockwise). The analysis runs in the orientation of the screen,
// so the coordinates of the content are turned by the same angle before they are compared.
const turn = (X, Y, Degrees) => {
    switch(Degrees) {
        case 90:  return [ Y, -X];
        case 180: return [-X, -Y];
        case 270: return [-Y,  X];
        default:  return [ X,  Y];
    }
};

// The size of a text item is the length of the up vector of its matrix; the baseline is the x vector of it.
const itemGeometry = (Item) => {
    const T = Item.transform;
    const Size = Math.hypot(T[2], T[3]) || Math.hypot(T[0], T[1]);
    if(!(Size > 0)) return null;
    return { Size, X: T[4], Y: T[5], Baseline: [T[0], T[1]], Up: [T[2], T[3]] };
};

// The characters of one text item are not placed one by one by pdf.js, but the direction of the run and its length are known.
// So the run is taken apart: a horizontal run is spread along its baseline, a vertical one downwards (against the up vector of the glyph).
// Without this, a PDF that writes a whole line in one item would look like a scatter of points.
const glyphsOf = (Items, Styles, Opts) => {
    const Runs = [];
    for(let Index = 0; Index < (Items || []).length; Index++) {
        const Item = Items[Index];
        if(!Item || !Item.transform) continue;
        const Str = Item.str == null ? '' : String(Item.str);
        const Chars = Array.from(Str.replace(/\s+/gu, '')).length;
        if(!Chars) continue;
        const Geometry = itemGeometry(Item);
        if(!Geometry) continue;
        const Style = Styles ? Styles[Item.fontName] : null;
        // The explicit direction: a vertical font says so itself. (pdf.js tells it on the item as well.)
        const Explicit = !!(Style && Style.vertical === true) || Item.vertical === true || Item.dir === 'ttb';
        const Origin = turn(Geometry.X, Geometry.Y, Opts.rotation);
        const Baseline = turn(Geometry.Baseline[0], Geometry.Baseline[1], Opts.rotation);
        const Up = turn(Geometry.Up[0], Geometry.Up[1], Opts.rotation);
        const BaselineLength = Math.hypot(Baseline[0], Baseline[1]);
        const UpLength = Math.hypot(Up[0], Up[1]) || 1;
        let Advance, Step = 0;
        // A vertical font advances downwards, against the up vector of the glyph; a horizontal one advances along its baseline.
        // pdf.js vertical runs use height for the advance; upright single-glyph runs are also recognized by their coordinates.
        const Vertical = Explicit && (Item.dir === 'ttb' || !(Item.height > 0) || Item.height > Item.width);
        if(Vertical) {
            Advance = [-Up[0] / UpLength, -Up[1] / UpLength];
            Step = Item.height > 0 ? Item.height / Chars : Geometry.Size;
        } else {
            Advance = BaselineLength ? [Baseline[0] / BaselineLength, Baseline[1] / BaselineLength] : [1, 0];
            const Width = numberOf(Item.width, 0);
            if(Width > 0) {
                Step = Width / Chars;
                // The advance of a glyph is about the size of a glyph: a width that says something else is of no use.
                if(!(Step >= 0.1 * Geometry.Size && Step <= 2 * Geometry.Size)) Step = Geometry.Size;
            }
        }
        Runs.push({ Origin, Advance, Step, Size: Geometry.Size, Chars, Index, Explicit });
    }
    // The size of the body of the text is the median of the sizes, weighted by the number of characters.
    const Sizes = Runs.map(R => ({ Size: R.Size, Chars: R.Chars })).sort((A, B) => A.Size - B.Size);
    let Total = 0;
    for(const Run of Runs) Total += Run.Chars;
    let Half = 0, Median = Sizes.length ? Sizes[Sizes.length - 1].Size : 0;
    for(const Entry of Sizes) { Half += Entry.Chars; if(Half * 2 >= Total) { Median = Entry.Size; break; } }
    const Glyphs = [];
    for(const Run of Runs) {
        const Count = Math.max(1, Math.min(Run.Chars, Opts.maxGlyphsPerRun));
        const Weight = Run.Chars / Count;
        // A glyph that is much smaller than the body of the text is ruby, furigana or an annotation: it must not decide anything.
        const Small = Median > 0 && Run.Size < Median * Opts.smallGlyphSizeRatio;
        const Chars = Weight * (Small ? Opts.smallGlyphWeight : 1);
        for(let C = 0; C < Count; C++) {
            const Offset = Run.Step * C;
            Glyphs.push({
                x: Run.Origin[0] + Run.Advance[0] * Offset,
                y: Run.Origin[1] + Run.Advance[1] * Offset,
                size: Run.Size,
                chars: Chars,
                index: Run.Index,
                explicit: Run.Explicit
            });
        }
    }
    return Glyphs;
};

// The glyphs whose coordinate is within a tolerance of the mean of the group join the group.
// The tolerance is a fraction of the size of the glyph, so that a big glyph and a small one are grouped alike.
const groupBy = (Glyphs, Axis, ToleranceFactor) => {
    const Sorted = [...Glyphs].sort((A, B) => A[Axis] - B[Axis]);
    const Groups = [];
    let Current = null;
    for(const Glyph of Sorted) {
        if(!Current) { Current = { Glyphs: [Glyph], Mean: Glyph[Axis] }; continue; }
        if(Math.abs(Glyph[Axis] - Current.Mean) <= ToleranceFactor * Glyph.size) {
            Current.Glyphs.push(Glyph);
            Current.Mean += (Glyph[Axis] - Current.Mean) / Current.Glyphs.length;
        } else {
            Groups.push(Current);
            Current = { Glyphs: [Glyph], Mean: Glyph[Axis] };
        }
    }
    if(Current) Groups.push(Current);
    return Groups;
};

// The lines of the text: the glyphs that share a coordinate on the cross axis and that spread along the other one.
// A column (the cross axis is x) stands upright and is read from the top down, a row (the cross axis is y) runs sideways and is read from the left to the right.
const linesOf = (Glyphs, CrossAxis, AlongAxis, Direction, Opts) => {
    const Lines = [];
    for(const Group of groupBy(Glyphs, CrossAxis, Opts.toleranceFactor)) {
        const Sorted = [...Group.Glyphs].sort((A, B) => A[AlongAxis] - B[AlongAxis]);
        if(Sorted.length < 2) continue;
        const Sizes = Sorted.map(G => G.size).sort((A, B) => A - B);
        const Size = Sizes[Math.floor(Sizes.length / 2)];
        const Span = Math.abs(Sorted[Sorted.length - 1][AlongAxis] - Sorted[0][AlongAxis]);
        // A group that does not spread along the line is not a line: it is a row of glyphs that happen to share a coordinate.
        if(Span < 0.5 * Size) continue;
        // The glyphs that stand far apart are not written one after another: they are separate pieces of text.
        const Pieces = [];
        let Piece = [Sorted[0]];
        for(let I = 1; I < Sorted.length; I++) {
            if(Math.abs(Sorted[I][AlongAxis] - Sorted[I - 1][AlongAxis]) > Opts.maxLineGap * Size) { Pieces.push(Piece); Piece = []; }
            Piece.push(Sorted[I]);
        }
        Pieces.push(Piece);
        for(const Run of Pieces) {
            if(Run.length < 2) continue;
            // The gaps between the neighbors have to look like the advance of a glyph.
            const Gaps = [];
            for(let I = 1; I < Run.length; I++) Gaps.push(Math.abs(Run[I][AlongAxis] - Run[I - 1][AlongAxis]));
            const SortedGaps = [...Gaps].sort((A, B) => A - B);
            const MedianGap = SortedGaps[Math.floor(SortedGaps.length / 2)];
            // The glyphs of a line stand one advance apart. A group whose glyphs stand much further apart is not a line:
            // it is the coincidence that the glyphs of several lines share a coordinate.
            if(MedianGap > Opts.maxLineGap * Size) continue;
            let Plausible = 0;
            for(const Gap of Gaps) if(Gap >= 0.1 * Size && Gap <= 4 * Size) Plausible++;
            if(Plausible / Gaps.length < 0.6) continue;
            // The flow: the glyphs have to be placed along the line in the order in which they are written.
            // The regularity of the flow and its direction are kept apart: a line that runs the other way round is still a line.
            const ByContent = [...Run].sort((A, B) => A.index - B.index);
            let Forward = 0, Backward = 0;
            for(let I = 1; I < ByContent.length; I++) {
                const Delta = ByContent[I][AlongAxis] - ByContent[I - 1][AlongAxis];
                if(Delta * Direction > 0) Forward++; else if(Delta * Direction < 0) Backward++;
            }
            const Pairs = Forward + Backward;
            const Flow = Pairs ? Math.max(Forward, Backward) / Pairs : 0;
            const Way = Pairs ? Forward / Pairs : 0;
            let Chars = 0;
            for(const G of Run) Chars += G.chars;
            Lines.push({
                Glyphs: Run, Chars, Flow, Way,
                Position: Group.Mean,
                First: ByContent[0].index,
                Last: ByContent[ByContent.length - 1].index
            });
        }
    }
    return Lines;
};

const charsOf = (Lines) => {
    let Chars = 0;
    for(const Line of Lines) Chars += Line.Chars;
    return Chars;
};

// The mean of the flow of the lines, weighted by the number of characters they hold.
const flowOf = (Lines) => {
    let Chars = 0, Flow = 0;
    for(const Line of Lines) { Chars += Line.Chars; Flow += Line.Flow * Line.Chars; }
    return Chars ? Flow / Chars : 0;
};

// The mean of the direction of the lines, weighted by the number of characters they hold:
// how many of the lines run in the direction in which they are read.
const wayOf = (Lines) => {
    let Chars = 0, Way = 0;
    for(const Line of Lines) { Chars += Line.Chars; Way += Line.Way * Line.Chars; }
    return Chars ? Way / Chars : 0;
};

// The order of the lines: a column of vertical writing is read from the right to the left, a row of horizontal writing from the top down.
// The lines are sorted the way they are read, and the content of a line has to come before the content of the next one:
// a text whose lines interleave in the content is not a text that is read line by line.
const orderOf = (Lines, Descending) => {
    if(Lines.length < 2) return 1;
    const Sorted = [...Lines].sort((A, B) => Descending ? B.Position - A.Position : A.Position - B.Position);
    let Good = 0;
    for(let I = 1; I < Sorted.length; I++) if(Sorted[I].First > Sorted[I - 1].Last) Good++;
    return Good / (Sorted.length - 1);
};

const result = (Mode, Confidence, VerticalScore, HorizontalScore, AnalyzedCharacters) => ({
    mode: Mode, confidence: Confidence,
    evidence: { verticalScore: VerticalScore, horizontalScore: HorizontalScore, analyzedCharacters: AnalyzedCharacters }
});

// The writing mode of one page.
// The items are the text-content items of pdf.js, the styles the style map that belongs to them.
export const analyzePageWritingMode = (Items, Styles, Options = {}) => {
    const Opts = optionsOf(Options);
    const Glyphs = glyphsOf(Items, Styles, Opts);
    let Total = 0;
    for(const Glyph of Glyphs) Total += Glyph.chars;
    if(!(Total > 0)) return result(WritingMode.Unknown, 0, 0, 0, 0);
    const Columns = linesOf(Glyphs, 'x', 'y', -1, Opts); // the glyphs that share an x: a vertical column, read from the top down
    const Rows = linesOf(Glyphs, 'y', 'x', 1, Opts);    // the glyphs that share a y: a horizontal row, read from the left to the right
    const VerticalAligned = charsOf(Columns) / Total;
    const HorizontalAligned = charsOf(Rows) / Total;
    const VerticalFlow = flowOf(Columns);
    const HorizontalFlow = flowOf(Rows);
    const VerticalWay = wayOf(Columns);            // the columns are read from the top down
    const HorizontalWay = wayOf(Rows);             // the rows are read from the left to the right
    const VerticalOrder = orderOf(Columns, true);  // the columns are read from the right to the left
    const HorizontalOrder = orderOf(Rows, true);   // the rows are read from the top down
    let Explicit = 0;
    for(const Glyph of Glyphs) if(Glyph.explicit) Explicit += Glyph.chars;
    const ExplicitRatio = Explicit / Total;
    const W = Opts.weights;
    const VerticalScore = W.align * VerticalAligned + W.flow * VerticalAligned * VerticalFlow + W.direction * VerticalAligned * VerticalWay + W.order * VerticalAligned * VerticalOrder + W.explicit * ExplicitRatio;
    const HorizontalScore = W.align * HorizontalAligned + W.flow * HorizontalAligned * HorizontalFlow + W.direction * HorizontalAligned * HorizontalWay + W.order * HorizontalAligned * HorizontalOrder;
    const Difference = VerticalScore - HorizontalScore;
    const Aligned = Math.max(VerticalAligned, HorizontalAligned) * Total;
    // Too little text, or too little of it in lines and columns: the page tells nothing.
    if(Total < Opts.minCharacters || Aligned < Opts.minAlignedCharacters) return result(WritingMode.Unknown, 0, VerticalScore, HorizontalScore, Total);
    // The two directions are too close to each other: the page tells nothing.
    if(Math.abs(Difference) < Opts.decisionMargin) return result(WritingMode.Unknown, Math.min(1, Math.abs(Difference)), VerticalScore, HorizontalScore, Total);
    return result(Difference > 0 ? WritingMode.Vertical : WritingMode.Horizontal, Math.min(1, Math.abs(Difference)), VerticalScore, HorizontalScore, Total);
};

// The writing mode of a whole document.
// The pages are weighted by the number of characters they hold: a page of the body of the text tells more than a page of an appendix.
// A page that could not be decided is left out; it is never counted as horizontal.
export const analyzeDocumentWritingMode = (PageResults, Options = {}) => {
    const Opts = optionsOf(Options);
    let Vertical = 0, Horizontal = 0, Total = 0;
    for(const PageResult of PageResults || []) {
        if(!PageResult || !PageResult.mode || PageResult.mode == WritingMode.Unknown) continue;
        const Evidence = PageResult.evidence || {};
        const Weight = Math.max(0, numberOf(Evidence.analyzedCharacters, 0));
        if(!(Weight > 0)) continue;
        Total += Weight;
        if(PageResult.mode == WritingMode.Vertical) Vertical += Weight;
        else if(PageResult.mode == WritingMode.Horizontal) Horizontal += Weight;
    }
    if(!(Total >= Opts.minDocumentCharacters)) return result(WritingMode.Unknown, 0, 0, 0, Total);
    const VerticalScore = Vertical / Total, HorizontalScore = Horizontal / Total;
    const Difference = VerticalScore - HorizontalScore;
    if(Math.abs(Difference) < Opts.decisionMargin) return result(WritingMode.Unknown, Math.min(1, Math.abs(Difference)), VerticalScore, HorizontalScore, Total);
    return result(Difference > 0 ? WritingMode.Vertical : WritingMode.Horizontal, Math.min(1, Math.abs(Difference)), VerticalScore, HorizontalScore, Total);
};
