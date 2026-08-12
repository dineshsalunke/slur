import type { ReactNode } from 'react';

// The fixed glass HUD panel — a semi-transparent void block with a neon border + glow, so the WebGL scene
// shows through the gaps between panels. Every in-game overlay (timer, standings, lobby, results, spectator,
// held-power, confirm) is one of these. Positioning and padding come from the caller's className (each anchor
// differs, and a couple are static-in-a-grid). The accent picks the border colour + glow. Was the
// `.slur-panel` + accent classes.
//
// DO NOT pass a colour utility (text-*, bg-*) through className. The base below already sets `bg-void/72` and
// `text-hud`, and Tailwind utilities of equal specificity are resolved by CSS SOURCE order — the order they
// happen to sit in the generated stylesheet — NOT by the order they appear in the class attribute. So a
// caller's `text-cyan` does not reliably win; the base beat it and the race timer silently rendered white
// with a cyan glow while still passing the build and the no-raw-hex grep. Colour the CHILDREN instead: a
// colour on a child element always beats the panel's inherited colour, with no specificity fight. Every
// caller does it that way now.
//
// z-20 is part of the BASE, not the caller: it is the layering CONTRACT the rest of the overlay stack is
// numbered against — net-debug-hud sits below at 10, threat-hud above at 21, the countdown at 25, the
// in-race Leave at 26, the confirm modal at 40. Dropping it left every panel at `z-index: auto`, so the
// order rested on DOM order alone and the dev debug readout painted OVER the panels instead of under them.
const ACCENT = {
    cyan: 'border-cyan/55 shadow-hud',
    magenta: 'border-magenta/60 shadow-hud-magenta',
    gold: 'border-gold/70 shadow-hud-gold',
} as const;

export function HudPanel( {
    accent = 'cyan',
    className = '',
    children,
}: {
    accent?: keyof typeof ACCENT;
    className?: string;
    children: ReactNode;
} ) {
    return (
        <div
            className={ `pointer-events-auto z-20 rounded-[6px] border bg-void/72 font-[system-ui,sans-serif] text-hud backdrop-blur-[3px] ${ ACCENT[ accent ] } ${ className }` }
        >
            { children }
        </div>
    );
}
