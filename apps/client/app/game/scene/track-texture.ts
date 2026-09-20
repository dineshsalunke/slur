import * as THREE from 'three';

/**
 * Procedural graphite/concrete surface for the track slab.
 *
 * WHY GENERATED: ADD §9 commits the project to procedural-first, a texture file would be the pipeline's
 * only binary asset, and a canvas is tunable from code.
 *
 * ONE TILE = ONE PANEL, mapped to `PANEL_W × PANEL_L` world units, so the tile-edge border is the "large
 * clean panel division" of handoff §4/§5. Panels are therefore a TEXTURE decision — which is why
 * `TrackFloor` is one continuous mesh: geometry tiles would have locked panel size to 4u. */

/** Panel size in world units. 16u across divides the 64u ribbon into exactly 4 panels — no partial panel
 *  at the edges. 20u along matches `SEG_LEN`, so transverse seams land on segment boundaries and therefore
 *  agree with gap edges instead of cutting across them. */
export const PANEL_W = 16;
export const PANEL_L = 20;

/** Canvas resolution. 1024 over 16u is ~64px/u — enough that grain still reads at a grazing camera angle. */
const RES = 1024;

/**
 * Panel seam width in WORLD UNITS. Everything drawn into this texture must be sized this way: the canvas
 * is stretched over 16 × 20 metres of track, so a "few pixels" is centimetres and disappears. 0.25u is
 * roughly a tenth of a ship's width — visible as a division, nowhere near a lane marker.
 */
const SEAM_U = 0.25;

// Kept deliberately low-contrast. v2: "low-contrast large panel divisions ... without creating visible
// gameplay lanes" — a panel line that reads as a lane marker is a bug, not a feature.
const BASE = '#14181e';
const GRAIN_LIGHT = 'rgba(168,182,198,0.075)';
const GRAIN_DARK = 'rgba(0,0,0,0.38)';
const PANEL_LINE = 'rgba(0,0,0,0.55)';
const PANEL_HILITE = 'rgba(170,186,204,0.10)';

// Deterministic PRNG so the surface is identical every reload — an art review comparing two screenshots
// must not be looking at two different noise fields. (mulberry32, same family the generator uses.)
function rng( seed: number ): () => number {
    let a = seed >>> 0;
    return () => {
        a = ( a + 0x6d2b79f5 ) | 0;
        let t = Math.imul( a ^ ( a >>> 15 ), 1 | a );
        t = ( t + Math.imul( t ^ ( t >>> 7 ), 61 | t ) ) ^ t;
        return ( ( t ^ ( t >>> 14 ) ) >>> 0 ) / 4294967296;
    };
}

/** Broad soft blotches — the large-scale unevenness that stops concrete reading as flat paint. */
function drawBlotches( ctx: CanvasRenderingContext2D, rand: () => number ): void {
    for ( let i = 0; i < 90; i++ ) {
        const x = rand() * RES;
        const y = rand() * RES;
        const r = 40 + rand() * 190;
        const g = ctx.createRadialGradient( x, y, 0, x, y, r );
        g.addColorStop( 0, rand() > 0.5 ? GRAIN_LIGHT : GRAIN_DARK );
        g.addColorStop( 1, 'rgba(0,0,0,0)' );
        ctx.fillStyle = g;
        ctx.fillRect( x - r, y - r, r * 2, r * 2 );
    }
}

/** Fine per-pixel speckle — the close-up grit. Sparse, because dense speckle turns to noise under bloom. */
function drawGrain( ctx: CanvasRenderingContext2D, rand: () => number ): void {
    for ( let i = 0; i < 26000; i++ ) {
        const x = rand() * RES;
        const y = rand() * RES;
        ctx.fillStyle = rand() > 0.55 ? GRAIN_LIGHT : GRAIN_DARK;
        ctx.fillRect( x, y, 1 + ( rand() > 0.9 ? 1 : 0 ), 1 );
    }
}

/**
 * The panel division: a dark seam inset from the tile edge with a faint highlight on the leading side,
 * so the panel reads as a physical plate rather than a drawn line. Drawn at the tile boundary, which is
 * why it tiles seamlessly.
 */
function drawPanelBorder( ctx: CanvasRenderingContext2D ): void {
    // Seam width is specified in WORLD units and converted to pixels, not picked as a pixel count.
    // The first version used `RES / 320` ≈ 3px, which over 16u works out to 0.05u — a five-centimetre
    // line on a 64-unit ribbon, i.e. sub-pixel at any real viewing distance. That is why the surface
    // read as flat grey. Anything meant to be seen on this track must be sized in world units first.
    const px = RES / PANEL_W; // pixels per world unit
    const seam = SEAM_U * px;
    const hilite = seam * 0.5;

    ctx.fillStyle = PANEL_LINE;
    ctx.fillRect( 0, 0, RES, seam );
    ctx.fillRect( 0, 0, seam, RES );
    ctx.fillStyle = PANEL_HILITE;
    ctx.fillRect( 0, seam, RES, hilite );
    ctx.fillRect( seam, 0, hilite, RES );
}

/**
 * Builds the tiling slab texture. Module-scoped singleton via `trackSurfaceTexture()` below — shared by
 * every mesh that wants it, created once, never disposed (it lives for the app's lifetime by design).
 */
function build(): THREE.CanvasTexture {
    const canvas = document.createElement( 'canvas' );
    canvas.width = RES;
    canvas.height = RES;
    const ctx = canvas.getContext( '2d' );
    if ( ! ctx ) throw new Error( 'track-texture: 2D context unavailable' );

    const rand = rng( 0x51ab );
    ctx.fillStyle = BASE;
    ctx.fillRect( 0, 0, RES, RES );
    drawBlotches( ctx, rand );
    drawGrain( ctx, rand );
    drawPanelBorder( ctx );

    const tex = new THREE.CanvasTexture( canvas );
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 8; // the ribbon is viewed at a very grazing angle; without this it smears to mush
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

let cached: THREE.CanvasTexture | null = null;

/**
 * The shared slab texture. Lazily built on first use (needs `document`, so it must not run at import time
 * in any non-DOM context) and cached forever after.
 *
 * NOT disposed: it is a process-lifetime singleton shared by every track mesh. Issue #88 was about a
 * per-instance `CanvasTexture` leaking on unmount — the fix there was disposal; the fix here is to have
 * exactly one.
 */
export function trackSurfaceTexture(): THREE.CanvasTexture {
    if ( ! cached ) cached = build();
    return cached;
}

/** `pow`, not linear: a linear ramp creases where its slope stops, which is the edge C exists to remove. */
const RAMP_RES = 256;
const RAMP_EXP = 2.2;

function buildRamp(): THREE.CanvasTexture {
    const canvas = document.createElement( 'canvas' );
    canvas.width = RAMP_RES;
    canvas.height = 1;
    const ctx = canvas.getContext( '2d' );
    if ( ! ctx ) throw new Error( 'edgeFalloffRamp: no 2d context' );

    for ( let i = 0; i < RAMP_RES; i++ ) {
        const v = Math.round( 255 * ( i / ( RAMP_RES - 1 ) ) ** RAMP_EXP );
        ctx.fillStyle = `rgb(${ v },${ v },${ v })`;
        ctx.fillRect( i, 0, 1, 1 );
    }

    const tex = new THREE.CanvasTexture( canvas );
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    // NoColorSpace: a multiplier, so an sRGB decode would silently reshape the curve.
    tex.colorSpace = THREE.NoColorSpace;
    tex.channel = 1; // the `uv1` attribute `packGeometry` writes, leaving `uv` for the grain
    return tex;
}

let rampCached: THREE.CanvasTexture | null = null;

/** Variant C's inward marigold ramp — a singleton for the same reason the slab texture is one. */
export function edgeFalloffRamp(): THREE.CanvasTexture {
    if ( ! rampCached ) rampCached = buildRamp();
    return rampCached;
}
