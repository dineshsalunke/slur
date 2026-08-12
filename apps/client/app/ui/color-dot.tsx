// The player team-colour dot (was `.slur-dot`): a 12px circle whose fill is the team hue (data from
// game/colors.ts, indexed by the synced colorId — an inline style, not a class, because it's per-player data).
// The glow is `currentColor` (the row's text colour), matching the original. No `display` class on purpose: in
// a flex row the dot is flexified so 12px applies; elsewhere it stays inline like the original `.slur-dot`.
export function ColorDot( { hex }: { hex: string } ) {
    return <span className="h-3 w-3 shrink-0 rounded-full shadow-dot" style={ { background: hex } } />;
}
