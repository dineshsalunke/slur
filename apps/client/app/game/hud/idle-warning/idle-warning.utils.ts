import { STALL_SECONDS, STALL_WARN_SECONDS } from '@slur/shared';

export function idleText( stalled: number ): string {
    if ( ! Number.isFinite( stalled ) || stalled < STALL_WARN_SECONDS ) return '';
    if ( stalled >= STALL_SECONDS ) return 'Idle · out';
    return `Idle · out in ${ Math.ceil( STALL_SECONDS - stalled ) }`;
}
