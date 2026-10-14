export function getPageTapDivision(coord, width, height, pageWidth, flipperWidth) {
    const extentX = Math.min(flipperWidth < 1 ? pageWidth * Math.max(0, flipperWidth) : flipperWidth, width / 2);
    const extentY = Math.min(flipperWidth < 1 ? height * Math.max(0, flipperWidth) : flipperWidth, height / 2);
    return {
        X: coord.X < extentX ? 'left' : coord.X > width - extentX ? 'right' : 'center',
        Y: coord.Y < extentY ? 'top' : coord.Y > height - extentY ? 'bottom' : 'middle'
    };
}
