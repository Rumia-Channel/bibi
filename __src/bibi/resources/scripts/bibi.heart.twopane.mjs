// Two-Pane geometry and grouping (pure, DOM-free: unit-testable, no imports).
// Paged 2-up pairs consecutive pairable solo spreads on wide viewports.
// No structural change: spreads keep one item each, pages flow untouched.

export const isTwoPaneViewport = (W, H) => W * 3 >= H * 4; // 4:3 landscape and wider (iPad landscape included); narrower stays solo

export const shouldSoloLandscapeSpread = (VpW, VpH, StageW, StageH) =>
    (VpW / VpH) >= (StageW / StageH) / 2 && VpW >= StageW / 2; // at fit height it overflows a half pane: solo shows it bigger instead of shrinking it in
export const isPairableSpread = (Sp) => {
    if(!Sp || Sp.Items.length != 1) return false; // explicit pairs stay atomic
    if(Sp.Index < 1) return false; // the opening spread (usually the cover) always stands alone
    const Solo = Sp.Items[0];
    if(Solo.SpreadPair) return false;
    if(Solo.Pages.length != 1) return false; // multi-page strips stay solo (re-evaluated as pages resolve)
    if(Solo.TwoPaneSoloLocked) return false; // reflowable that outgrew a half pane: never re-pair (flap guard)
    return !!(Solo.PrePaginated || Solo.OnlySingleSVG || Solo.OnlySingleImg || (Solo.Reflowable && Solo.TwoPaneRendered));
};

export const planTwoPaneGroups = (Metas) => { // Metas in reading order: [{ pairable, soloLandscape }] → [[spreadIdx, ...]]; pic|pic, text|pic, pic|text, text|text all pair — areas stay separate per pane
    const joinable = (M) => M && M.pairable && !M.soloLandscape;
    const Groups = [];
    for(let i = 0; i < Metas.length; i++) {
        if(joinable(Metas[i]) && joinable(Metas[i + 1])) Groups.push([i, i + 1]), i++;
        else Groups.push([i]);
    }
    return Groups;
};

export const SOLO_PICTURE_MIN_TEXT_LENGTH = 4000; // recipient raw-text threshold: short neighbors are gallery/front-matter context, leave their pictures alone
export const planSoloPictureDonations = (Metas) => { // Metas in reading order: [{ donor, textLen }] → [{ from, to, atHead }]; a standalone picture dissolves into adjacent long text (title illustration opens the following chapter). prefers next-head, falls back to prev-tail. one donation per recipient end.
    const Plans = [], UsedEnds = new Set();
    const isRecipient = (M) => M && !M.donor && (M.textLen || 0) >= SOLO_PICTURE_MIN_TEXT_LENGTH;
    Metas.forEach((M, i) => {
        if(!M || !M.donor) return;
        const to = isRecipient(Metas[i + 1]) ? i + 1 : isRecipient(Metas[i - 1]) ? i - 1 : -1;
        if(to < 0) return;
        const atHead = to > i, EndKey = to + (atHead ? ':head' : ':tail');
        if(UsedEnds.has(EndKey)) return;
        UsedEnds.add(EndKey);
        Plans.push({ from: i, to, atHead });
    });
    return Plans;
};
