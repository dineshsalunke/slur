import { mulberry32 } from '@slur/shared';
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import {
    CENTER_PULL,
    CLIP_SNAP,
    CLIP_STEPS,
    EPSILON_SQ,
    MAX_BOULDERS,
    MAX_CELLS,
    MAX_CRATERS,
    PIECE_BUDGET,
    ROCK_DETAIL,
    SEED_JITTER,
    SEED_RADIUS,
    SEED_SALT,
} from './meteor-rock.constants';

export interface MeteorParams {
    seed: number;
    cells: number;
    jagged: number;
    elongation: number;
    lumps: number;
    ridges: number;
    craters: number;
    craterSize: number;
    boulders: number;
}

export interface Crater {
    dir: THREE.Vector3;
    radius: number;
    rim: number;
    fresh: number;
}

export interface Boulder {
    dir: THREE.Vector3;
    radius: number;
    height: number;
}

export interface MeteorShape {
    seeds: THREE.Vector3[];
    jagged: number;
    offset: number;
    lumps: number;
    ridges: number;
    elongation: number;
    lobe: THREE.Vector3;
    stretch: THREE.Vector3;
    craters: Crater[];
    boulders: Boulder[];
}

export interface MeteorPiece {
    cell: number;
    center: THREE.Vector3;
    geometry: THREE.BufferGeometry;
}

export interface MeteorRock {
    shape: MeteorShape;
    head: THREE.BufferGeometry;
    pieces: MeteorPiece[];
    merged: THREE.BufferGeometry;
    pieceTriangles: number;
}

interface Vert {
    p: THREE.Vector3;
    n: THREE.Vector3;
}

interface Wall {
    a: THREE.Vector3;
    b: THREE.Vector3;
    other: number;
}

interface Cut {
    cell: number;
    crust: Vert[];
    walls: Wall[];
}

function hash3( x: number, y: number, z: number, s: number ): number {
    let h = Math.imul( x, 374761393 ) + Math.imul( y, 668265263 ) + Math.imul( z, 2147483647 ) + Math.imul( s, 144665 );
    h = Math.imul( h ^ ( h >>> 13 ), 1274126177 );
    return ( ( h ^ ( h >>> 16 ) ) >>> 0 ) / 4294967296;
}

function lerp( a: number, b: number, t: number ): number {
    return a + ( b - a ) * t;
}

export function vnoise( x: number, y: number, z: number, s: number ): number {
    const xi = Math.floor( x );
    const yi = Math.floor( y );
    const zi = Math.floor( z );
    const xf = x - xi;
    const yf = y - yi;
    const zf = z - zi;
    const u = xf * xf * ( 3 - 2 * xf );
    const v = yf * yf * ( 3 - 2 * yf );
    const w = zf * zf * ( 3 - 2 * zf );
    const near = lerp(
        lerp( hash3( xi, yi, zi, s ), hash3( xi + 1, yi, zi, s ), u ),
        lerp( hash3( xi, yi + 1, zi, s ), hash3( xi + 1, yi + 1, zi, s ), u ),
        v,
    );
    const far = lerp(
        lerp( hash3( xi, yi, zi + 1, s ), hash3( xi + 1, yi, zi + 1, s ), u ),
        lerp( hash3( xi, yi + 1, zi + 1, s ), hash3( xi + 1, yi + 1, zi + 1, s ), u ),
        v,
    );
    return lerp( near, far, w );
}

function fbm( x: number, y: number, z: number, s: number, octaves: number ): number {
    let amp = 0.5;
    let freq = 1;
    let total = 0;
    let norm = 0;
    for ( let i = 0; i < octaves; i++ ) {
        total += amp * vnoise( x * freq, y * freq, z * freq, s + i * 17 );
        norm += amp;
        amp *= 0.5;
        freq *= 2.03;
    }
    return total / norm;
}

export function warp( p: THREE.Vector3, jag: number, out: THREE.Vector3 ): THREE.Vector3 {
    const { x, y, z } = p;
    return out.set(
        x + jag * 0.5 * ( Math.sin( y * 7.1 + z * 3.3 ) + 0.5 * Math.sin( z * 17.3 + x * 11.1 ) ),
        y + jag * 0.5 * ( Math.sin( z * 6.7 + x * 2.9 ) + 0.5 * Math.sin( x * 15.7 + y * 13.9 ) ),
        z + jag * 0.5 * ( Math.sin( x * 7.9 + y * 3.7 ) + 0.5 * Math.sin( y * 16.1 + z * 12.3 ) ),
    );
}

export function nearestCell( p: THREE.Vector3, seeds: readonly THREE.Vector3[], jag: number ): number {
    const q = warp( p, jag, new THREE.Vector3() );
    let best = 0;
    let bestD = Number.POSITIVE_INFINITY;
    for ( let i = 0; i < seeds.length; i++ ) {
        const d = q.distanceToSquared( seeds[ i ] );
        if ( d < bestD ) {
            bestD = d;
            best = i;
        }
    }
    return best;
}

function cellSide( p: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3, jag: number ): number {
    const q = warp( p, jag, new THREE.Vector3() );
    const n = new THREE.Vector3().subVectors( b, a );
    const len = n.length() || 1;
    const mid = new THREE.Vector3().addVectors( a, b ).multiplyScalar( 0.5 );
    return q.sub( mid ).dot( n ) / len;
}

function sphereSeeds( n: number, rand: () => number, radius: number, jitter: number ): THREE.Vector3[] {
    const golden = Math.PI * ( 3 - Math.sqrt( 5 ) );
    const turn = new THREE.Quaternion().setFromEuler( new THREE.Euler( rand() * 6.3, rand() * 6.3, rand() * 6.3 ) );
    const out: THREE.Vector3[] = [];
    for ( let i = 0; i < n; i++ ) {
        const y = 1 - ( 2 * ( i + 0.5 ) ) / n;
        const r = Math.sqrt( 1 - y * y );
        const phi = i * golden;
        const v = new THREE.Vector3( Math.cos( phi ) * r, y, Math.sin( phi ) * r );
        v.x += ( rand() - 0.5 ) * jitter;
        v.y += ( rand() - 0.5 ) * jitter;
        v.z += ( rand() - 0.5 ) * jitter;
        out.push( v.normalize().applyQuaternion( turn ).multiplyScalar( radius ) );
    }
    return out;
}

export function meteorShape( params: MeteorParams ): MeteorShape {
    const rand = mulberry32( params.seed * SEED_SALT + 1 );
    const cells = Math.max( 2, Math.min( MAX_CELLS, Math.round( params.cells ) ) );
    const seeds = sphereSeeds( cells, rand, SEED_RADIUS, SEED_JITTER );
    const offset = ( rand() * 1000 ) | 0;
    const dir = () => new THREE.Vector3( rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1 ).normalize();
    const craters = Array.from( { length: Math.round( params.craters ) }, () => {
        const d = dir();
        const radius = 0.025 + params.craterSize * rand() ** 2.4;
        const rim = 0.6 + rand() * 0.6;
        return { dir: d, radius, rim, fresh: rand() };
    } )
        .sort( ( a, b ) => b.radius - a.radius )
        .slice( 0, MAX_CRATERS );
    const boulders = Array.from( { length: Math.round( params.boulders ) }, () => {
        const d = dir();
        const radius = 0.025 + 0.07 * rand() * rand();
        return { dir: d, radius, height: 0.45 + rand() * 0.6 };
    } ).slice( 0, MAX_BOULDERS );
    const el = params.elongation;
    return {
        seeds,
        jagged: params.jagged,
        offset,
        lumps: params.lumps,
        ridges: params.ridges,
        elongation: el,
        lobe: dir(),
        stretch: new THREE.Vector3( 1 + el * 0.55, 1 - el * 0.12, 1 - el * 0.3 ),
        craters,
        boulders,
    };
}

function shapeRadius( v: THREE.Vector3, s: MeteorShape ): number {
    let r = 1 + ( fbm( v.x * 1.1 + 3, v.y * 1.1, v.z * 1.1, s.offset, 4 ) - 0.5 ) * 1.3 * s.lumps;
    const along = v.dot( s.lobe );
    r +=
        s.elongation * 0.22 * ( Math.exp( -( 1 - along ) * 4 ) + Math.exp( -( 1 + along ) * 4 ) ) - s.elongation * 0.06;
    let ridge = 0;
    let amp = 0.5;
    let freq = 3;
    for ( let o = 0; o < 2; o++ ) {
        const n = vnoise( v.x * freq + 11, v.y * freq, v.z * freq, s.offset + 31 + o );
        ridge += amp * ( 1 - Math.abs( 2 * n - 1 ) ) ** 2;
        amp *= 0.5;
        freq *= 2.1;
    }
    return r + ( ridge - 0.25 ) * 0.22 * s.ridges;
}

export function coarseRock( detail: number, s: MeteorShape ): THREE.BufferGeometry {
    const ico = new THREE.IcosahedronGeometry( 1, detail );
    ico.deleteAttribute( 'normal' );
    ico.deleteAttribute( 'uv' );
    const geometry = mergeVertices( ico );
    ico.dispose();
    const pos = geometry.getAttribute( 'position' ) as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for ( let i = 0; i < pos.count; i++ ) {
        v.fromBufferAttribute( pos, i ).normalize();
        const r = shapeRadius( v, s );
        pos.setXYZ( i, v.x * r * s.stretch.x, v.y * r * s.stretch.y, v.z * r * s.stretch.z );
    }
    geometry.computeVertexNormals();
    return geometry;
}

function dedupe( poly: Vert[] ): Vert[] {
    const out: Vert[] = [];
    for ( const v of poly ) {
        const last = out[ out.length - 1 ];
        if ( ! last || last.p.distanceToSquared( v.p ) >= EPSILON_SQ ) out.push( v );
    }
    while ( out.length > 1 && out[ 0 ].p.distanceToSquared( out[ out.length - 1 ].p ) < EPSILON_SQ ) out.pop();
    return out;
}

function before( a: THREE.Vector3, b: THREE.Vector3 ): boolean {
    if ( a.x !== b.x ) return a.x < b.x;
    if ( a.y !== b.y ) return a.y < b.y;
    return a.z < b.z;
}

function crossing( a: Vert, b: Vert, cell: THREE.Vector3, other: THREE.Vector3, jag: number ): number {
    const x = new THREE.Vector3();
    let lo = 0;
    let hi = 1;
    let flo = cellSide( a.p, cell, other, jag );
    for ( let it = 0; it < CLIP_STEPS; it++ ) {
        const t = ( lo + hi ) / 2;
        x.lerpVectors( a.p, b.p, t );
        const ft = cellSide( x, cell, other, jag );
        if ( ft <= 0 === flo <= 0 ) {
            lo = t;
            flo = ft;
        } else hi = t;
    }
    const t = ( lo + hi ) / 2;
    if ( t < CLIP_SNAP ) return 0;
    if ( t > 1 - CLIP_SNAP ) return 1;
    return t;
}

function clipPoly( poly: Vert[], s: MeteorShape, cell: number, other: number ): Vert[] {
    const out: Vert[] = [];
    const n = poly.length;
    const side = poly.map( ( v ) => cellSide( v.p, s.seeds[ cell ], s.seeds[ other ], s.jagged ) );
    for ( let k = 0; k < n; k++ ) {
        const a = poly[ k ];
        const b = poly[ ( k + 1 ) % n ];
        const fa = side[ k ];
        const fb = side[ ( k + 1 ) % n ];
        if ( fa <= 0 ) out.push( a );
        if ( fa <= 0 === fb <= 0 ) continue;
        const [ lo, hi ] = before( a.p, b.p ) ? [ a, b ] : [ b, a ];
        const t = crossing( lo, hi, s.seeds[ cell ], s.seeds[ other ], s.jagged );
        out.push( {
            p: new THREE.Vector3().lerpVectors( lo.p, hi.p, t ),
            n: new THREE.Vector3().lerpVectors( lo.n, hi.n, t ).normalize(),
        } );
    }
    return dedupe( out );
}

function vert( pos: THREE.BufferAttribute, nor: THREE.BufferAttribute, i: number ): Vert {
    return {
        p: new THREE.Vector3().fromBufferAttribute( pos, i ),
        n: new THREE.Vector3().fromBufferAttribute( nor, i ),
    };
}

function pointKey( p: THREE.Vector3 ): string {
    return `${ p.x },${ p.y },${ p.z }`;
}

function boundaryCell( a: THREE.Vector3, b: THREE.Vector3, s: MeteorShape, cell: number ): number {
    const mid = new THREE.Vector3().addVectors( a, b ).multiplyScalar( 0.5 );
    let best = -1;
    let bestD = Number.POSITIVE_INFINITY;
    for ( let j = 0; j < s.seeds.length; j++ ) {
        if ( j === cell ) continue;
        const d = Math.abs( cellSide( mid, s.seeds[ cell ], s.seeds[ j ], s.jagged ) );
        if ( d < bestD ) {
            bestD = d;
            best = j;
        }
    }
    return best;
}

function boundaryWalls( crust: readonly Vert[], s: MeteorShape, cell: number ): Wall[] {
    const uses = new Map< string, number >();
    const edgeKey = ( a: Vert, b: Vert ) => {
        const ka = pointKey( a.p );
        const kb = pointKey( b.p );
        return ka < kb ? `${ ka }|${ kb }` : `${ kb }|${ ka }`;
    };
    const each = ( visit: ( a: Vert, b: Vert ) => void ) => {
        for ( let t = 0; t < crust.length; t += 3 ) {
            for ( let k = 0; k < 3; k++ ) {
                const a = crust[ t + k ];
                const b = crust[ t + ( ( k + 1 ) % 3 ) ];
                if ( pointKey( a.p ) !== pointKey( b.p ) ) visit( a, b );
            }
        }
    };
    each( ( a, b ) => {
        const k = edgeKey( a, b );
        uses.set( k, ( uses.get( k ) ?? 0 ) + 1 );
    } );
    const walls: Wall[] = [];
    each( ( a, b ) => {
        if ( uses.get( edgeKey( a, b ) ) === 1 )
            walls.push( { a: a.p, b: b.p, other: boundaryCell( a.p, b.p, s, cell ) } );
    } );
    return walls;
}

function cutCell( base: THREE.BufferGeometry, owner: Int32Array, s: MeteorShape, cell: number ): Cut {
    const pos = base.getAttribute( 'position' ) as THREE.BufferAttribute;
    const nor = base.getAttribute( 'normal' ) as THREE.BufferAttribute;
    const idx = ( base.index as THREE.BufferAttribute ).array;
    const crust: Vert[] = [];
    for ( let t = 0; t < idx.length; t += 3 ) {
        const tri = [ idx[ t ], idx[ t + 1 ], idx[ t + 2 ] ];
        let poly = tri.map( ( i ) => vert( pos, nor, i ) );
        if ( tri.some( ( i ) => owner[ i ] !== cell ) ) {
            for ( let j = 0; j < s.seeds.length && poly.length; j++ )
                if ( j !== cell ) poly = clipPoly( poly, s, cell, j );
        }
        for ( let k = 1; k < poly.length - 1; k++ ) crust.push( poly[ 0 ], poly[ k ], poly[ k + 1 ] );
    }
    return { cell, crust, walls: boundaryWalls( crust, s, cell ) };
}

function cutRock( base: THREE.BufferGeometry, s: MeteorShape ): { cuts: Cut[]; triangles: number } {
    const pos = base.getAttribute( 'position' ) as THREE.BufferAttribute;
    const owner = new Int32Array( pos.count );
    const p = new THREE.Vector3();
    for ( let i = 0; i < pos.count; i++ )
        owner[ i ] = nearestCell( p.fromBufferAttribute( pos, i ), s.seeds, s.jagged );
    const cuts: Cut[] = [];
    let triangles = 0;
    for ( let cell = 0; cell < s.seeds.length; cell++ ) {
        const cut = cutCell( base, owner, s, cell );
        if ( ! cut.crust.length ) continue;
        cuts.push( cut );
        triangles += cut.crust.length / 3 + cut.walls.length;
    }
    return { cuts, triangles };
}

function pieceGeometry( cut: Cut, s: MeteorShape ): MeteorPiece {
    const position: number[] = [];
    const normal: number[] = [];
    const inner: number[] = [];
    const push = ( p: THREE.Vector3, n: THREE.Vector3, ins: number ) => {
        position.push( p.x, p.y, p.z );
        normal.push( n.x, n.y, n.z );
        inner.push( ins );
    };
    for ( const v of cut.crust ) push( v.p, v.n, 0 );
    const outer = position.length / 3;
    const origin = new THREE.Vector3();
    const face = new THREE.Vector3();
    const e1 = new THREE.Vector3();
    const e2 = new THREE.Vector3();
    const away = new THREE.Vector3();
    for ( const w of cut.walls ) {
        e1.subVectors( w.a, w.b );
        e2.subVectors( origin, w.b );
        face.crossVectors( e1, e2 ).normalize();
        away.subVectors( s.seeds[ w.other ], s.seeds[ cut.cell ] ).normalize();
        if ( away.dot( face ) < 0 ) away.negate();
        face.add( away ).normalize();
        push( w.b, face, 1 );
        push( w.a, face, 1 );
        push( origin, face, 2 );
    }
    const center = new THREE.Vector3();
    for ( let i = 0; i < outer; i++ ) center.add( e1.fromArray( position, i * 3 ) );
    center.divideScalar( outer ).multiplyScalar( CENTER_PULL );
    const obj = position.slice();
    for ( let i = 0; i < position.length; i += 3 ) {
        position[ i ] -= center.x;
        position[ i + 1 ] -= center.y;
        position[ i + 2 ] -= center.z;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( position, 3 ) );
    geometry.setAttribute( 'normal', new THREE.Float32BufferAttribute( normal, 3 ) );
    geometry.setAttribute( 'aObj', new THREE.Float32BufferAttribute( obj, 3 ) );
    geometry.setAttribute( 'aInner', new THREE.Float32BufferAttribute( inner, 1 ) );
    geometry.computeBoundingSphere();
    return { cell: cut.cell, center, geometry };
}

function headGeometry( s: MeteorShape ): THREE.BufferGeometry {
    const head = coarseRock( ROCK_DETAIL, s );
    const count = head.getAttribute( 'position' ).count;
    head.setAttribute( 'aObj', head.getAttribute( 'position' ).clone() );
    head.setAttribute( 'aInner', new THREE.Float32BufferAttribute( new Float32Array( count ), 1 ) );
    head.computeBoundingSphere();
    return head;
}

function mergePieces( pieces: readonly MeteorPiece[] ): THREE.BufferGeometry {
    const parts = pieces.map( ( p, i ) => {
        const g = p.geometry.clone();
        const count = g.getAttribute( 'position' ).count;
        g.setAttribute( 'aPiece', new THREE.Float32BufferAttribute( new Float32Array( count ).fill( i ), 1 ) );
        return g;
    } );
    const merged = mergeGeometries( parts );
    for ( const g of parts ) g.dispose();
    if ( ! merged ) throw new Error( 'meteor rock: pieces did not merge' );
    merged.computeBoundingSphere();
    return merged;
}

export function meteorRock( params: MeteorParams ): MeteorRock {
    const shape = meteorShape( params );
    let cut = { cuts: [] as Cut[], triangles: 0 };
    for ( let detail = ROCK_DETAIL; detail >= 0; detail-- ) {
        const base = coarseRock( detail, shape );
        cut = cutRock( base, shape );
        base.dispose();
        if ( cut.triangles <= PIECE_BUDGET ) break;
    }
    const pieces = cut.cuts.map( ( c ) => pieceGeometry( c, shape ) );
    return {
        shape,
        head: headGeometry( shape ),
        pieces,
        merged: mergePieces( pieces ),
        pieceTriangles: cut.triangles,
    };
}

export function disposeRock( rock: MeteorRock ): void {
    rock.head.dispose();
    rock.merged.dispose();
    for ( const p of rock.pieces ) p.geometry.dispose();
}

export function triangleCount( geometry: THREE.BufferGeometry ): number {
    return ( geometry.index ? geometry.index.count : geometry.getAttribute( 'position' ).count ) / 3;
}
