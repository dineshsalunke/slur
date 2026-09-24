import type { Room } from '@colyseus/sdk';
import { computeStandings, type RunState } from '@slur/shared';
import { colorHex } from '../colors';
import { useRunView } from '../net/use-run-view';
import { raceTime, shipName } from './results-format';

export function WinnerCard( { room }: { room: Room< RunState > } ) {
    const view = useRunView( room );
    const winner = computeStandings( view.players ).find( ( s ) => ! s.dnf );

    return (
        <div className="min-w-0">
            <h2 className="m-0 text-[64px] font-bold uppercase leading-[0.86] tracking-[0.01em] text-balance sm:text-[clamp(56px,8vw,112px)] text-readout text-shadow-readout">
                { winner ? `${ winner.name || 'Racer' } wins` : 'No finishers' }
            </h2>
            { winner && (
                <p className="m-0 mt-4 flex items-baseline gap-4 tabular-nums">
                    <span
                        aria-hidden="true"
                        className="size-2.5 flex-none self-center"
                        style={ { background: colorHex( winner.colorId ) } }
                    />
                    <span className="text-[22px] font-semibold text-readout text-shadow-readout sm:text-[28px]">
                        { raceTime( winner.finishTime ) }
                    </span>
                    <span className="text-[12px] uppercase tracking-[0.16em] text-readout-dim">
                        { shipName( winner.shipId ) }
                    </span>
                </p>
            ) }
        </div>
    );
}
