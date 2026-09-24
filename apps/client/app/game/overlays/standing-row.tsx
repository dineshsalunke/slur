import type { Standing } from '@slur/shared';
import type { CSSProperties } from 'react';
import { colorHex } from '../colors';
import { gapTo, raceTime, shipName } from './results-format';

const TAG = 'text-[11px] font-bold uppercase tracking-[0.2em]';

export function StandingRow( {
    standing: s,
    order,
    leaderTime,
    self,
    host,
}: {
    standing: Standing;
    order: number;
    leaderTime: number | undefined;
    self: boolean;
    host: boolean;
} ) {
    const tone = s.dnf ? 'text-readout-dim' : 'text-readout';

    return (
        <li
            style={ { '--order': order } as CSSProperties }
            className={ `grid h-9 grid-cols-[22px_10px_minmax(0,1fr)_4.6rem_3.4rem] items-center gap-x-3 border bg-deep/85 px-3.5 transition-[opacity,translate] delay-[calc(var(--order)*60ms)] duration-300 ease-out starting:translate-y-2 starting:opacity-0 motion-reduce:transition-none sm:h-10 sm:grid-cols-[22px_10px_minmax(0,1fr)_auto_4.6rem_3.4rem] ${ self ? 'border-readout/45' : 'border-readout/15' }` }
        >
            <span className={ `text-right text-[15px] font-bold ${ tone }` }>{ s.rank }</span>
            <span aria-hidden="true" className="size-2.5" style={ { background: colorHex( s.colorId ) } } />
            <span className="flex min-w-0 items-baseline gap-2.5">
                <span className={ `truncate text-[15px] font-semibold ${ tone }` }>{ s.name || 'Racer' }</span>
                { self && <span className={ `${ TAG } text-readout` }>You</span> }
                { host && <span className={ `${ TAG } text-readout-dim ${ self ? 'max-sm:hidden' : '' }` }>Host</span> }
            </span>
            <span className="hidden text-right text-[12px] uppercase tracking-[0.16em] text-readout-dim sm:block">
                { shipName( s.shipId ) }
            </span>
            <span className={ `text-right text-[14px] font-semibold ${ tone }` }>
                { s.dnf ? 'DNF' : raceTime( s.finishTime ) }
            </span>
            <span className="text-right text-[13px] text-readout-dim">
                { s.dnf || leaderTime === undefined ? '' : gapTo( leaderTime, s.finishTime ) }
            </span>
        </li>
    );
}
