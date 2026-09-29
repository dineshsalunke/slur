export function powerHint(): string {
    return /Mac/.test( navigator.userAgent )
        ? 'L Shift Fire · R Shift Back · ↑ Cycle · X Drop'
        : 'R Ctrl Fire · R Shift Back · ↑ Cycle · L Ctrl Drop';
}
