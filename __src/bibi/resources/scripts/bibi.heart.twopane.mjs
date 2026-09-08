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
