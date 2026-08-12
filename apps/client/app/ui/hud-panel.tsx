import type { ReactNode } from 'react';

// The fixed glass HUD panel — a semi-transparent void block with a neon border + glow, so the WebGL scene
// shows through the gaps between panels. Every in-game overlay (timer, standings, lobby, results, spectator,
// held-power, confirm) is one of these. LOOK ONLY: positioning, z-index, and padding come from the caller's
// className (each anchor differs, and a couple are static-in-a-grid), so nothing here can conflict with them.
// The accent picks the border colour + glow. Was the `.slur-panel` + accent classes.
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
            className={ `pointer-events-auto rounded-[6px] border bg-void/72 font-[system-ui,sans-serif] text-hud backdrop-blur-[3px] ${ ACCENT[ accent ] } ${ className }` }
        >
            { children }
        </div>
    );
}
