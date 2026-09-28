import { DEADLINE_SHOW_SECONDS, raceEndsAt } from '@slur/shared';
import { clockText } from '../readout-format';

export function deadlineText( elapsed: number, finishDeadline: number, raceCap: number ): string {
    if ( ! ( raceCap > 0 ) ) return '';
    const left = raceEndsAt( finishDeadline, raceCap ) - elapsed;
    if ( ! Number.isFinite( left ) ) return '';
    if ( finishDeadline <= 0 && left > DEADLINE_SHOW_SECONDS ) return '';
    return `Race ends ${ clockText( Math.ceil( left ) ) }`;
}
