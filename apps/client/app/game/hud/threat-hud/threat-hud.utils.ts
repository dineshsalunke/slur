import { CENTER_X, VIGNETTE_FALLOFF, VIGNETTE_MAX, VIGNETTE_RAMP_Z } from './threat-hud.constants';

export function threatTick( dx: number | null ): string | null {
    if ( dx === null ) return null;
    if ( dx > CENTER_X ) return '◀ ⚠';
    if ( dx < -CENTER_X ) return '⚠ ▶';
    return '⚠';
}

export function vignetteOpacity( bestDz: number ): number {
    if ( ! Number.isFinite( bestDz ) ) return 0;
    const clamped = Math.min( Math.max( bestDz, 0 ), VIGNETTE_RAMP_Z );
    return ( 1 - clamped / VIGNETTE_RAMP_Z ) ** VIGNETTE_FALLOFF * VIGNETTE_MAX;
}
