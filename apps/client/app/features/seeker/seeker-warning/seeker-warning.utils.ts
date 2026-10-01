import type { SeekerState } from '@slur/shared';
import {
    BLINK_DUTY,
    BLINK_HZ,
    CLOSING_EPS,
    LOCK_BARS,
    SHIFT_FULL_DX,
    THREE_BAR_S,
    TWO_BAR_S,
} from './seeker-warning.constants';

export interface LockTarget {
    x: number;
    z: number;
    vz: number;
    dead?: boolean;
    spectating?: boolean;
    finished?: boolean;
}

export interface Lock {
    count: number;
    tti: number;
    dx: number;
    ahead: boolean;
    committed: boolean;
}

export function makeLock(): Lock {
    return { count: 0, tti: Number.POSITIVE_INFINITY, dx: 0, ahead: false, committed: false };
}

export function timeToImpact( s: SeekerState, self: LockTarget ): number {
    const along = s.dir * ( self.z - s.z );
    const closing = s.dir * ( s.vz - self.vz );
    if ( closing <= CLOSING_EPS ) return Number.POSITIVE_INFINITY;
    return Math.max( 0, along ) / closing;
}

export function nearestLock(
    seekers: Iterable< SeekerState >,
    me: string,
    self: LockTarget | undefined,
    out: Lock,
): Lock {
    out.count = 0;
    out.tti = Number.POSITIVE_INFINITY;
    out.dx = 0;
    out.ahead = false;
    out.committed = false;
    if ( ! self || self.dead || self.spectating || self.finished ) return out;
    for ( const s of seekers ) {
        if ( s.targetId !== me ) continue;
        out.count++;
        const tti = timeToImpact( s, self );
        if ( out.count > 1 && tti >= out.tti ) continue;
        out.tti = tti;
        out.dx = s.x - self.x;
        out.ahead = s.dir < 0;
        out.committed = s.committed;
    }
    return out;
}

export function lockBars( tti: number, committed: boolean ): number {
    if ( committed || tti < THREE_BAR_S ) return LOCK_BARS;
    return tti < TWO_BAR_S ? 2 : 1;
}

export function lockShift( dx: number ): number {
    return Math.max( -1, Math.min( 1, dx / SHIFT_FULL_DX ) );
}

export function lockText( lock: Lock ): string {
    if ( lock.count === 0 ) return '';
    const bars = lockBars( lock.tti, lock.committed );
    const [ full, empty ] = lock.ahead ? [ '▼', '▽' ] : [ '▲', '△' ];
    const count = lock.count > 1 ? ` ×${ lock.count }` : '';
    return `${ full.repeat( bars ) }${ empty.repeat( LOCK_BARS - bars ) } LOCK${ count }`;
}

export function lockVisible( lock: Lock, nowMs: number ): boolean {
    if ( lock.count === 0 ) return false;
    if ( lock.committed ) return true;
    const hz = BLINK_HZ[ lockBars( lock.tti, false ) ];
    return ( ( nowMs / 1000 ) * hz ) % 1 < BLINK_DUTY;
}
