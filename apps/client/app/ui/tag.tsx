import type { ReactNode } from 'react';

// A tiny uppercase pill label (was `.slur-tag` + `.slur-host` / `.slur-spec` / `.slur-fin`): host ★, YOU,
// SPECTATING, and the finish-time tag. Border colour lives in the variant so the accent variants never collide
// with the default hairline. `default` is the neutral YOU tag.
const VARIANT = {
    default: 'border-hud/35',
    host: 'border-cyan text-cyan',
    spec: 'border-magenta text-magenta',
    fin: 'border-fin text-fin',
} as const;

export function Tag( { variant = 'default', children }: { variant?: keyof typeof VARIANT; children: ReactNode } ) {
    return (
        <span
            className={ `rounded-[3px] border px-[5px] py-px text-[9px] uppercase tracking-[1px] opacity-[0.85] ${ VARIANT[ variant ] }` }
        >
            { children }
        </span>
    );
}
