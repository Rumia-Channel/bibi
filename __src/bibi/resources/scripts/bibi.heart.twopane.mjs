// Two-Pane geometry and grouping (pure, DOM-free: unit-testable, no imports).
// Paged 2-up pairs consecutive pairable solo spreads on wide viewports.
// No structural change: spreads keep one item each, pages flow untouched.

export const isTwoPaneViewport = (W, H) => H * 2 <= W;

export const shouldSoloLandscapeSpread = (VpW, VpH, StageW, StageH) =>
    (VpW / VpH) >= (StageW / StageH) * 0.85 && VpW >= StageW * 0.75;
export const isPairableSpread = (Sp) => {
    if(!Sp || Sp.Items.length != 1) return false; // explicit pairs stay atomic
    const Solo = Sp.Items[0];
    if(Solo.SpreadPair) return false;
    const spreadProp = Solo['rendition:spread'];
    if(!(spreadProp === undefined || spreadProp == 'both' || spreadProp == 'landscape')) return false;
    const pageSpreadProp = Solo['rendition:page-spread'];
    if(!(pageSpreadProp === undefined || pageSpreadProp == 'center')) return false;
    if(Solo.Pages.length != 1) return false; // multi-page strips stay solo (re-evaluated as pages resolve)
    return !!(Solo.PrePaginated || Solo.OnlySingleSVG || Solo.OnlySingleImg || (Solo.Reflowable && Solo.TwoPaneRendered));
};

export const planTwoPaneGroups = (Metas) => { // Metas in reading order: [{ pairable, soloLandscape }] → [[spreadIdx, ...]]
    const Groups = [];
    for(let i = 0; i < Metas.length; i++) {
        if(Metas[i].pairable && !Metas[i].soloLandscape && Metas[i + 1] && Metas[i + 1].pairable && !Metas[i + 1].soloLandscape) Groups.push([i, i + 1]), i++;
        else Groups.push([i]);
    }
    return Groups;
};
