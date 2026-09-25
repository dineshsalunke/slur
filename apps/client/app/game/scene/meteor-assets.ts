import { mulberry32 } from '@slur/shared';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ACCENT_ANCHOR } from './accent';
import { FRACTURE_CORE_HEX } from './fractured-block-shader';

const TRAIL_SIDES = 14;
const TRAIL_RINGS = 10;
const TRAIL_LAYERS: readonly { radius: number; gain: number }[] = [
    { radius: 0.42, gain: 1 },
    { radius: 1, gain: 0.3 },
];
const TRAIL_FALLOFF = 1.5;
const TRAIL_HUE_BIAS = 0.55;

const SCORCH_RES = 256;
const SOOT_BLOTCHES = 140;
const SOOT_RAYS = 26;
const EMBER_CRACKS = 11;
const EMBER_STEPS = 9;
const CRACK_DEPTH = 2;

const CORE = new THREE.Color( FRACTURE_CORE_HEX );
const TAIL = new THREE.Color( ACCENT_ANCHOR );

function trailLayer( radius: number, gain: number ): THREE.BufferGeometry {
    const g = new THREE.CylinderGeometry( 0, radius, 1, TRAIL_SIDES, TRAIL_RINGS, true );
    g.translate( 0, 0.5, 0 );
    g.deleteAttribute( 'uv' );
    const pos = g.getAttribute( 'position' );
    const colors = new Float32Array( pos.count * 3 );
    const c = new THREE.Color();
    for ( let i = 0; i < pos.count; i++ ) {
        const t = pos.getY( i );
        const k = gain * ( 1 - t ) ** TRAIL_FALLOFF;
        c.copy( CORE )
            .lerp( TAIL, t ** TRAIL_HUE_BIAS )
            .multiplyScalar( k );
        colors.set( [ c.r, c.g, c.b ], i * 3 );
    }
    g.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
    return g;
}

export function meteorTrailGeometry(): THREE.BufferGeometry {
    const layers = TRAIL_LAYERS.map( ( l ) => trailLayer( l.radius, l.gain ) );
    const merged = mergeGeometries( layers );
    for ( const l of layers ) l.dispose();
    if ( ! merged ) throw new Error( 'meteor trail: layers did not merge' );
    return merged;
}

function scorchCanvas( paint: ( ctx: CanvasRenderingContext2D, rand: () => number ) => void, seed: number ) {
    const canvas = document.createElement( 'canvas' );
    canvas.width = SCORCH_RES;
    canvas.height = SCORCH_RES;
    const ctx = canvas.getContext( '2d' );
    if ( ! ctx ) throw new Error( 'meteor scorch: 2D context unavailable' );
    paint( ctx, mulberry32( seed ) );
    const texture = new THREE.CanvasTexture( canvas );
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

function paintSoot( ctx: CanvasRenderingContext2D, rand: () => number ): void {
    const c = SCORCH_RES / 2;
    for ( let i = 0; i < SOOT_BLOTCHES; i++ ) {
        const a = rand() * Math.PI * 2;
        const d = rand() ** 1.6 * c * 0.62;
        const r = ( 0.05 + rand() * 0.16 ) * c * ( 1 - d / c );
        const x = c + Math.cos( a ) * d;
        const y = c + Math.sin( a ) * d;
        const g = ctx.createRadialGradient( x, y, 0, x, y, r );
        const alpha = 0.22 * ( 1 - d / c );
        g.addColorStop( 0, `rgba(0,0,0,${ alpha })` );
        g.addColorStop( 1, 'rgba(0,0,0,0)' );
        ctx.fillStyle = g;
        ctx.fillRect( x - r, y - r, r * 2, r * 2 );
    }
    ctx.lineCap = 'round';
    for ( let i = 0; i < SOOT_RAYS; i++ ) {
        const a = rand() * Math.PI * 2;
        const inner = c * ( 0.2 + rand() * 0.2 );
        const outer = c * ( 0.55 + rand() * 0.42 );
        const g = ctx.createLinearGradient(
            c + Math.cos( a ) * inner,
            c + Math.sin( a ) * inner,
            c + Math.cos( a ) * outer,
            c + Math.sin( a ) * outer,
        );
        g.addColorStop( 0, 'rgba(0,0,0,0.55)' );
        g.addColorStop( 1, 'rgba(0,0,0,0)' );
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.5 + rand() * 4;
        ctx.beginPath();
        ctx.moveTo( c + Math.cos( a ) * inner, c + Math.sin( a ) * inner );
        ctx.lineTo( c + Math.cos( a ) * outer, c + Math.sin( a ) * outer );
        ctx.stroke();
    }
    const core = ctx.createRadialGradient( c, c, 0, c, c, c * 0.34 );
    core.addColorStop( 0, 'rgba(0,0,0,0.92)' );
    core.addColorStop( 0.7, 'rgba(0,0,0,0.6)' );
    core.addColorStop( 1, 'rgba(0,0,0,0)' );
    ctx.fillStyle = core;
    ctx.fillRect( 0, 0, SCORCH_RES, SCORCH_RES );
}

interface CrackTip {
    x: number;
    y: number;
    heading: number;
    width: number;
    reach: number;
    depth: number;
}

function crack( ctx: CanvasRenderingContext2D, rand: () => number, tip: CrackTip ): void {
    const c = SCORCH_RES / 2;
    let { x, y, heading } = tip;
    const { width, reach } = tip;
    const step = ( reach * c ) / EMBER_STEPS;
    ctx.beginPath();
    ctx.moveTo( x, y );
    for ( let s = 0; s < EMBER_STEPS; s++ ) {
        heading += ( rand() - 0.5 ) * 0.5;
        x += Math.cos( heading ) * step;
        y += Math.sin( heading ) * step;
        ctx.lineTo( x, y );
        if ( tip.depth < CRACK_DEPTH && s > 2 && rand() < 0.22 ) {
            ctx.stroke();
            crack( ctx, rand, {
                x,
                y,
                heading: heading + ( rand() < 0.5 ? -0.8 : 0.8 ),
                width: width * 0.55,
                reach: reach * 0.35,
                depth: tip.depth + 1,
            } );
            ctx.lineWidth = width * ( 1 - s / EMBER_STEPS );
            ctx.beginPath();
            ctx.moveTo( x, y );
        }
    }
    ctx.stroke();
}

function paintEmber( ctx: CanvasRenderingContext2D, rand: () => number ): void {
    const c = SCORCH_RES / 2;
    ctx.fillStyle = '#000';
    ctx.fillRect( 0, 0, SCORCH_RES, SCORCH_RES );
    const pool = ctx.createRadialGradient( c, c, 0, c, c, c * 0.3 );
    pool.addColorStop( 0, 'rgba(255,255,255,0.95)' );
    pool.addColorStop( 0.5, 'rgba(255,255,255,0.35)' );
    pool.addColorStop( 1, 'rgba(255,255,255,0)' );
    ctx.fillStyle = pool;
    ctx.fillRect( 0, 0, SCORCH_RES, SCORCH_RES );
    ctx.strokeStyle = '#fff';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 6;
    for ( let i = 0; i < EMBER_CRACKS; i++ ) {
        const width = 1.5 + rand() * 2.5;
        ctx.lineWidth = width;
        const a = ( i / EMBER_CRACKS ) * Math.PI * 2 + rand() * 0.5;
        crack( ctx, rand, {
            x: c + Math.cos( a ) * c * 0.08,
            y: c + Math.sin( a ) * c * 0.08,
            heading: a,
            width,
            reach: 0.45 + rand() * 0.4,
            depth: 0,
        } );
    }
}

let soot: THREE.CanvasTexture | null = null;
let ember: THREE.CanvasTexture | null = null;

export function sootTexture(): THREE.CanvasTexture {
    soot ??= scorchCanvas( paintSoot, 0x5007 );
    return soot;
}

export function emberTexture(): THREE.CanvasTexture {
    ember ??= scorchCanvas( paintEmber, 0xe3b3 );
    return ember;
}

function farthest( pos: THREE.BufferAttribute | THREE.InterleavedBufferAttribute, d: THREE.Vector3 ): number {
    const v = new THREE.Vector3();
    let best = -1;
    let far = Number.NEGATIVE_INFINITY;
    for ( let i = 0; i < pos.count; i++ ) {
        const s = v.fromBufferAttribute( pos, i ).dot( d );
        if ( s > far ) {
            far = s;
            best = i;
        }
    }
    return best;
}

export function rockHull( geometry: THREE.BufferGeometry ): THREE.Vector3[] {
    const pos = geometry.getAttribute( 'position' );
    const dirs: THREE.Vector3[] = [];
    for ( const x of [ -1, 0, 1 ] ) {
        for ( const y of [ -1, 0, 1 ] ) {
            for ( const z of [ -1, 0, 1 ] ) if ( x || y || z ) dirs.push( new THREE.Vector3( x, y, z ).normalize() );
        }
    }
    const picked = new Set< number >();
    for ( const d of dirs ) picked.add( farthest( pos, d ) );
    return [ ...picked ].map( ( i ) => new THREE.Vector3().fromBufferAttribute( pos, i ) );
}
