import type { Room } from '@colyseus/sdk';
import type { RunState } from '@slur/shared';
import { Fragment } from 'react';
import { LABEL } from '../../ui/field-label/field-label.constants';
import { useRunStandings } from '../net/run-view-store';
import { gapTo, ordinal, raceTime } from './results-format';

export function YourFinish( { room }: { room: Room< RunState > } ) {
    const standings = useRunStandings( room );
    const mine = standings.find( ( s ) => s.id === room.sessionId );
    const leader = standings.find( ( s ) => ! s.dnf );

    return (
        <div className="min-w-0">
            <p className={ `m-0 flex ${ LABEL }` }>Your finish</p>
            <p className="m-0 mt-1.5 flex items-baseline gap-2.5 tabular-nums sm:gap-3.5">
                { ! mine ? (
                    <span className="text-[20px] font-bold text-readout sm:text-[22px]">Spectated</span>
                ) : mine.dnf ? (
                    <span className="text-[20px] font-bold text-readout-dim sm:text-[22px]">DNF</span>
                ) : (
                    <Fragment>
                        <span className="text-[20px] font-bold text-readout sm:text-[22px]">
                            { ordinal( mine.rank ) }
                        </span>
                        <span className="text-[16px] font-semibold text-readout">{ raceTime( mine.finishTime ) }</span>
                        { mine.rank > 1 && leader && (
                            <span className="text-[13px] text-readout-dim">
                                { gapTo( leader.finishTime, mine.finishTime ) }
                            </span>
                        ) }
                    </Fragment>
                ) }
            </p>
        </div>
    );
}
