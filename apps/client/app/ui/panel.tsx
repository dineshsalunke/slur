import type { ReactNode } from 'react';

// The landing "console" panel (was `.panel`): a chamfered glass block with a small cyan accent-wedge in the
// top-left corner (the 135° gradient) over a frosted glass fill, and an inset hairline ring. Tokens are
// referenced as CSS vars (`var(--color-*)`, emitted by @theme) — not raw hexes — so a palette change is one
// edit. Positioning / width come from the caller's className (`.console` was width min(560px, 92vw)).
export function Panel( { className = '', children }: { className?: string; children: ReactNode } ) {
    return (
        <div
            className={ `chamfer relative bg-[linear-gradient(135deg,var(--color-cyan)_0_11px,transparent_11px),var(--color-glass-2)] p-5 shadow-[inset_0_0_0_1px_var(--color-line)] backdrop-blur-[12px] ${ className }` }
        >
            { children }
        </div>
    );
}
