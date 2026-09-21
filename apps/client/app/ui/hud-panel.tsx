import type { ReactNode } from 'react';

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
