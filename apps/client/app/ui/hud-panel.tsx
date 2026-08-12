import type { ReactNode } from 'react';

// The fixed glass HUD panel — a semi-transparent void block with a neon border + glow, so the WebGL scene
// shows through the gaps between panels. Every in-game overlay (timer, standings, lobby, results, spectator,
// held-power, confirm) is one of these. Carries the `.slur-panel` LOOK plus its `z-20` — the whole overlay
// layering contract (debug 10 < panels 20 < tick 21 < countdown 25 < leave-corner 26) is anchored to that 20,
// so it must live in the base, not be left to callers. (Inert on the static-in-a-grid confirm box — z-index
// only affects positioned elements.) POSITIONING + padding still come from the caller's className; the accent
// picks the border colour + glow.
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
