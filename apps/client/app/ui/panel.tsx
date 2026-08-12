import type { ReactNode } from 'react';

// The landing "console" panel (was `.panel`): a chamfered glass block with a small cyan accent-wedge in the
// top-left corner (the 135° gradient) over a frosted glass fill, and an inset hairline ring. Tokens are
// referenced as CSS vars (`var(--color-*)`, emitted by @theme) — not raw hexes — so a palette change is one
// edit. Positioning / width come from the caller's className (`.console` was width min(560px, 92vw)).
export function Panel( { className = '', children }: { className?: string; children: ReactNode } ) {
    return (
        <div
            // background-COLOR (glass fill) + background-IMAGE (accent wedge) as SEPARATE utilities: a color and a
            // gradient in one `bg-[…]` emits an invalid `background-image` list (a <color> is not an <image>), so
            // the browser drops BOTH layers. The original `.panel` worked only because CSS `background:` shorthand
            // routes its final layer to background-color. Keep them split.
            className={ `chamfer relative bg-glass-2 bg-[linear-gradient(135deg,var(--color-cyan)_0_11px,transparent_11px)] p-5 shadow-[inset_0_0_0_1px_var(--color-line)] backdrop-blur-[12px] ${ className }` }
        >
            { children }
        </div>
    );
}
