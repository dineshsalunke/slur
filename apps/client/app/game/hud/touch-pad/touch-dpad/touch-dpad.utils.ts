import { DPAD_CENTRE, DPAD_SLOP } from './touch-dpad.constants';

export type DpadZone = 'jump' | 'up' | 'down' | 'left' | 'right';

export function dpadZone( dx: number, dy: number, radius: number ): DpadZone | null {
    const r = Math.hypot( dx, dy );
    if ( r > radius * DPAD_SLOP ) return null;
    if ( r <= radius * DPAD_CENTRE ) return 'jump';
    if ( Math.abs( dx ) > Math.abs( dy ) ) return dx > 0 ? 'right' : 'left';
    return dy > 0 ? 'down' : 'up';
}
