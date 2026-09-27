import {
    COIL_R,
    COIL_SPIN_TURNS,
    COIL_TAPER,
    COIL_TURNS,
    HOOK_SPEED,
    MIN_PX,
    RIPPLE_AMP,
    RIPPLE_AMP_PER_U,
    RIPPLE_S,
    RIPPLE_WIDTH,
    SLACK_AMP,
    SLACK_AMP_PER_U,
    SLACK_PIN,
    SLACK_TRAVEL_HZ,
    SLACK_WAVES,
    THROW_MAX_S,
    THROW_MIN_S,
    TREMOR_AMP,
    TREMOR_HZ,
    TREMOR_WAVES,
} from './tug-line.constants';

export interface RopeOffset {
    side: number;
    up: number;
}

export function throwSeconds( distance: number ): number {
    return Math.min( THROW_MAX_S, Math.max( THROW_MIN_S, distance / HOOK_SPEED ) );
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
