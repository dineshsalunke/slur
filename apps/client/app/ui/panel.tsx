import type { ReactNode } from 'react';

// The landing "console" panel (was `.panel`): a chamfered glass block with a small cyan accent-wedge in the
// top-left corner (the 135° gradient) over a frosted glass fill, and an inset hairline ring. Tokens are
// referenced as CSS vars (`var(--color-*)`, emitted by @theme) — not raw hexes — so a palette change is one
// edit. Positioning / width come from the caller's className (`.console` was width min(560px, 92vw)).
//
// The wedge and the glass fill MUST be two separate utilities. `.panel` set both in one `background:`
// SHORTHAND, whose final layer becomes background-COLOR. A `bg-[…]` arbitrary value that contains a gradient
// compiles to background-IMAGE only, and a bare colour is not a valid <image> — so folding both into one
// `bg-[gradient,var(--color-glass-2)]` made the whole declaration invalid and the browser dropped BOTH
// layers (measured: background-image `none`, background-color `rgba(0,0,0,0)` — the panel had no fill at all).
export function Panel( { className = '', children }: { className?: string; children: ReactNode } ) {
    return (
        <div
            className={ `chamfer relative bg-glass-2 bg-[linear-gradient(135deg,var(--color-cyan)_0_11px,transparent_11px)] p-5 shadow-[inset_0_0_0_1px_var(--color-line)] backdrop-blur-[12px] ${ className }` }
        >
            { children }
        </div>
    );
}
