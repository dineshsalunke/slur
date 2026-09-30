import {
    COIL_R,
    COIL_SPIN_TURNS,
    COIL_TAPER,
    COIL_TURNS,
    DETACH_S,
    LATE_S,
    MIN_PX,
    REEL_AMP,
    REEL_FADE_FROM,
    REEL_S,
    REEL_TRAVEL_HZ,
    REEL_WAVES,
    RIPPLE_AMP,
    RIPPLE_AMP_PER_U,
    RIPPLE_S,
    RIPPLE_WIDTH,
    SLACK_AMP,
    SLACK_AMP_PER_U,
    SLACK_PIN,
    SLACK_TRAVEL_HZ,
    SLACK_WAVES,
    TREMOR_AMP,
    TREMOR_HZ,
    TREMOR_WAVES,
} from './tug-line.constants';

export interface RopeOffset {
    side: number;
    up: number;
}

export function payout( age: number, throwS: number ): number {
    return throwS > 0 ? Math.min( 1, Math.max( 0, age / throwS ) ) : 1;
}

function slackEnvelope( s: number ): number {
    const loose = 1 - s;
    return loose * loose * Math.min( 1, s / SLACK_PIN );
}

function slackOffset( s: number, age: number, p: number, length: number, out: RopeOffset ): void {
    const amp = ( 1 - p * p ) * Math.min( SLACK_AMP, length * SLACK_AMP_PER_U ) * slackEnvelope( s );
    const phase = 2 * Math.PI * ( SLACK_WAVES * s - SLACK_TRAVEL_HZ * age );
    out.side = amp * Math.sin( phase );
    out.up = 0.5 * amp * Math.cos( phase );
}

function tautOffset( s: number, since: number, length: number, out: RopeOffset ): void {
    const pin = Math.sin( Math.PI * s );
    const k = since / RIPPLE_S;
    let side = TREMOR_AMP * Math.min( 1, k ) * pin * Math.sin( 2 * Math.PI * ( TREMOR_WAVES * s - TREMOR_HZ * since ) );
    if ( k < 1 ) {
        const d = ( s - ( 1 - k ) ) / RIPPLE_WIDTH;
        side += 4 * k * ( 1 - k ) * Math.min( RIPPLE_AMP, length * RIPPLE_AMP_PER_U ) * Math.exp( -d * d ) * pin;
    }
    out.side = side;
    out.up = 0;
}

export function ropeOffset( s: number, age: number, throwS: number, length: number, out: RopeOffset ): RopeOffset {
    const p = payout( age, throwS );
    if ( p < 1 ) slackOffset( s, age, p, length, out );
    else tautOffset( s, age - throwS, length, out );
    return out;
}

export function detachAt( pullS: number ): number {
    return Math.max( 0, pullS - DETACH_S );
}

export function reelDue( since: number, pullS: number, timer: number, released: boolean, pulled: boolean ): boolean {
    if ( pulled && ( released || timer <= DETACH_S ) ) return true;
    return since >= detachAt( pullS ) + ( pulled ? LATE_S : 0 );
}

export function reelProgress( since: number ): number {
    return Math.min( 1, Math.max( 0, since / REEL_S ) );
}

export function reelPayout( since: number ): number {
    const r = reelProgress( since );
    return 1 - r * r * ( 3 - 2 * r );
}

export function reelFade( since: number ): number {
    const r = reelProgress( since );
    if ( r <= REEL_FADE_FROM ) return 1;
    const f = 1 - ( r - REEL_FADE_FROM ) / ( 1 - REEL_FADE_FROM );
    return f * f;
}

export function reelOffset( s: number, since: number, length: number, out: RopeOffset ): RopeOffset {
    const amp =
        ( 1 - reelProgress( since ) ) * Math.min( REEL_AMP, length * SLACK_AMP_PER_U ) * Math.sin( Math.PI * s );
    const phase = 2 * Math.PI * ( REEL_WAVES * s + REEL_TRAVEL_HZ * since );
    out.side = amp * Math.sin( phase );
    out.up = 0.5 * amp * Math.cos( phase );
    return out;
}

export function coilAngle( frac: number, p: number ): number {
    return 2 * Math.PI * ( COIL_SPIN_TURNS * p + COIL_TURNS * ( 1 - p ) * frac );
}

export function coilRadius( frac: number, p: number ): number {
    return COIL_R * ( 1 - p ) * ( 1 - COIL_TAPER * frac );
}

export function pixelsPerUnitAt1( heightPx: number, fovDeg: number ): number {
    return heightPx / ( 2 * Math.tan( ( fovDeg * Math.PI ) / 360 ) );
}

export function ropeWidth( base: number, distance: number, pxPerUnitAt1: number ): number {
    return Math.max( base, ( MIN_PX * distance ) / pxPerUnitAt1 );
}

export function widthGlow( base: number, width: number ): number {
    return Math.sqrt( base / width );
}
