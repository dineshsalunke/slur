// The player team-colour dot (was `.slur-dot`): a 12px circle whose fill is the team hue (data from
// game/colors.ts, indexed by the synced colorId — an inline style, not a class, because it's per-player data).
// The glow is `currentColor` (the row's text colour), matching the original. `inline-block` so the 12px box
// applies in EVERY context: flex rows flexify it anyway, but in the results `<td>` a bare inline span would
// collapse to 0×0 and vanish — the one place the original `.slur-dot` (no display) was silently invisible.
export function ColorDot( { hex }: { hex: string } ) {
    return <span className="inline-block h-3 w-3 shrink-0 rounded-full shadow-dot" style={ { background: hex } } />;
}
