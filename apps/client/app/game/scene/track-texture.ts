import * as THREE from 'three';

export const PANEL_W = 16;
export const PANEL_L = 20;

const RES = 1024;

const SEAM_U = 0.25;

const BASE = '#14181e';
const GRAIN_LIGHT = 'rgba(168,182,198,0.075)';
const GRAIN_DARK = 'rgba(0,0,0,0.38)';
const PANEL_LINE = 'rgba(0,0,0,0.55)';
const PANEL_HILITE = 'rgba(170,186,204,0.10)';

function rng( seed: number ): () => number {
    let a = seed >>> 0;
    return () => {
        a = ( a + 0x6d2b79f5 ) | 0;
        let t = Math.imul( a ^ ( a >>> 15 ), 1 | a );
        t = ( t + Math.imul( t ^ ( t >>> 7 ), 61 | t ) ) ^ t;
        return ( ( t ^ ( t >>> 14 ) ) >>> 0 ) / 4294967296;
    };
}

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

function drawGrain( ctx: CanvasRenderingContext2D, rand: () => number ): void {
    for ( let i = 0; i < 26000; i++ ) {
        const x = rand() * RES;
        const y = rand() * RES;
        ctx.fillStyle = rand() > 0.55 ? GRAIN_LIGHT : GRAIN_DARK;
        ctx.fillRect( x, y, 1 + ( rand() > 0.9 ? 1 : 0 ), 1 );
    }
}

function drawPanelBorder( ctx: CanvasRenderingContext2D ): void {
    const px = RES / PANEL_W;
    const seam = SEAM_U * px;
    const hilite = seam * 0.5;

    ctx.fillStyle = PANEL_LINE;
    ctx.fillRect( 0, 0, RES, seam );
    ctx.fillRect( 0, 0, seam, RES );
    ctx.fillStyle = PANEL_HILITE;
    ctx.fillRect( 0, seam, RES, hilite );
    ctx.fillRect( seam, 0, hilite, RES );
}

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
    tex.anisotropy = 8;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

let cached: THREE.CanvasTexture | null = null;

export function trackSurfaceTexture(): THREE.CanvasTexture {
    if ( ! cached ) cached = build();
    return cached;
}
