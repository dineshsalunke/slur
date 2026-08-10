// Trig-free coherent value-noise + easing primitives for deterministic track generation.
//
// DETERMINISM (same contract as rng.ts / track.ts): integer/PRNG/`+ - * /`/compare/`Math.floor` ONLY.
// NO Math.sin/cos/tan/pow/sqrt — a single ULP of cross-engine drift diverges geometry → diverges deaths →
// the game desyncs. Coherence is built from HASHED lattice values interpolated with a polynomial fade
// (smoothstep) — no transcendentals, byte-identical on Node and browser V8 (the same trust `mulberry32`
// and the physics `+-*/` already rely on).

import { hash2, mulberry32 } from './rng.js';

// smoothstep(t) = 3t² − 2t³ — the Hermite fade. C¹-continuous (zero slope at t=0,1) so interpolated noise
// has no lattice creases. Polynomial ⇒ trig-free ⇒ IEEE-deterministic. Peak |s'| = 1.5 (at t=0.5),
// peak |s''| = 6 (at t=0,1) — those bounds are what the weave slope/curvature caps are derived from.
export function smoothstep( t: number ): number {
    if ( t <= 0 ) return 0;
    if ( t >= 1 ) return 1;
    return t * t * ( 3 - 2 * t );
}

// tri(t) → a triangle wave in [-1, 1], period 1, peak at t = 0. Trig-free (abs + floor). Used for the
// deterministic tension→release pacing term on the difficulty ramp.
export function tri( t: number ): number {
    return 2 * Math.abs( 2 * ( t - Math.floor( t + 0.5 ) ) ) - 1;
}

// One lattice value in [0,1): the first draw of a local mulberry32 seeded by the node coordinate(s). Each
// node is an INDEPENDENT hash → O(1) random-access (no chain), the property value-noise needs to stay
// per-segment-derivable.
function nodeValue1D( seed: number, n: number ): number {
    return mulberry32( hash2( seed, n ) )();
}
function nodeValue2D( seed: number, xi: number, yi: number ): number {
    return mulberry32( hash2( hash2( seed, xi ), yi ) )();
}

// 1-D value noise: interpolate the two lattice values bracketing x with the smoothstep fade. Continuous,
// slope-bounded (|dv/dx| ≤ 1.5·|Δnode| per unit), and O(1). x is in LATTICE units (node spacing = 1).
export function valueNoise1D( seed: number, x: number ): number {
    const n = Math.floor( x );
    const t = x - n;
    const a = nodeValue1D( seed, n );
    const b = nodeValue1D( seed, n + 1 );
    return a + ( b - a ) * smoothstep( t );
}

// 2-D value noise: bilinear blend of the 4 surrounding lattice values, smoothstep-faded on both axes.
// Coherent in BOTH axes → wall fields flow (contiguous runs) instead of scattering. O(1). x,y in lattice units.
export function valueNoise2D( seed: number, x: number, y: number ): number {
    const xi = Math.floor( x );
    const yi = Math.floor( y );
    const sx = smoothstep( x - xi );
    const sy = smoothstep( y - yi );
    const c00 = nodeValue2D( seed, xi, yi );
    const c10 = nodeValue2D( seed, xi + 1, yi );
    const c01 = nodeValue2D( seed, xi, yi + 1 );
    const c11 = nodeValue2D( seed, xi + 1, yi + 1 );
    const top = c00 + ( c10 - c00 ) * sx;
    const bot = c01 + ( c11 - c01 ) * sx;
    return top + ( bot - top ) * sy;
}
