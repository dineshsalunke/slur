export const STRAFE_ON = 0.45;
export const STRAFE_OFF = 0.25;
export const BRAKE_ON = 0.5;
export const BRAKE_OFF = 0.35;

export function latchAxis( held: number, v: number, on: number, off: number ): number {
    const mag = Math.abs( v );
    if ( mag >= on ) return Math.sign( v );
    if ( mag <= off ) return 0;
    return held !== 0 && Math.sign( v ) === held ? held : 0;
}
