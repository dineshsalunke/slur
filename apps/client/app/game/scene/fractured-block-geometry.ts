import { mulberry32 } from '@slur/shared';
import * as THREE from 'three';

export const FRACTURE_OUTER = 0;
export const FRACTURE_WALL = 1;
export const FRACTURE_ORIENTS = 8;

const COARSE = { x: 2, y: 2, z: 2 } as const;
const COARSE_JITTER = 0.4;
const SHARDS = 10;
const SHARD_CENTRE = new THREE.Vector3( 0.12, 0.16, -0.33 );
const SHARD_SPREAD = new THREE.Vector3( 0.3, 0.28, 0.15 );
const SEED_LIMIT = 0.47;
const SEED = 0x51ab_c0de;
const EPS = 1e-6;

export interface FractureFace {
    points: THREE.Vector3[];
    normal: THREE.Vector3;
    tag: number;
}

export interface FractureCell {
    faces: FractureFace[];
    centre: THREE.Vector3;
    half: THREE.Vector3;
}

function boxFaces(): FractureFace[] {
    const faces: FractureFace[] = [];
    for ( const axis of [ 0, 1, 2 ] ) {
        for ( const s of [ -1, 1 ] ) {
            const normal = new THREE.Vector3().setComponent( axis, s );
            const u = new THREE.Vector3().setComponent( ( axis + 1 ) % 3, 0.5 );
            const v = new THREE.Vector3().setComponent( ( axis + 2 ) % 3, 0.5 );
            const c = normal.clone().multiplyScalar( 0.5 );
            const corners = [
                c.clone().sub( u ).sub( v ),
                c.clone().add( u ).sub( v ),
                c.clone().add( u ).add( v ),
                c.clone().sub( u ).add( v ),
            ];
            faces.push( { points: s > 0 ? corners : corners.reverse(), normal, tag: FRACTURE_OUTER } );
        }
    }
    return faces;
}

function clipPolygon( points: THREE.Vector3[], n: THREE.Vector3, d: number, cut: THREE.Vector3[] ): THREE.Vector3[] {
    const out: THREE.Vector3[] = [];
    for ( let i = 0; i < points.length; i++ ) {
        const p = points[ i ];
        const q = points[ ( i + 1 ) % points.length ];
        const dp = n.dot( p ) - d;
        const dq = n.dot( q ) - d;
        if ( dp <= EPS ) out.push( p );
        if ( ( dp < -EPS && dq > EPS ) || ( dp > EPS && dq < -EPS ) ) {
            const x = p.clone().lerp( q, dp / ( dp - dq ) );
            out.push( x );
            cut.push( x );
        } else if ( Math.abs( dp ) <= EPS ) cut.push( p );
    }
    return out;
}

function unique( points: THREE.Vector3[] ): THREE.Vector3[] {
    const out: THREE.Vector3[] = [];
    for ( const p of points ) if ( ! out.some( ( u ) => u.distanceToSquared( p ) < 1e-10 ) ) out.push( p );
    return out;
}

function capFace( cut: THREE.Vector3[], n: THREE.Vector3 ): FractureFace | null {
    const points = unique( cut );
    if ( points.length < 3 ) return null;
    const c = points.reduce( ( a, p ) => a.add( p ), new THREE.Vector3() ).divideScalar( points.length );
    const u = new THREE.Vector3().subVectors( points[ 0 ], c ).normalize();
    const v = new THREE.Vector3().crossVectors( n, u );
    const angle = ( p: THREE.Vector3 ) => {
        const r = new THREE.Vector3().subVectors( p, c );
        return Math.atan2( r.dot( v ), r.dot( u ) );
    };
    points.sort( ( a, b ) => angle( a ) - angle( b ) );
    return { points, normal: n.clone(), tag: FRACTURE_WALL };
}

function clipCell( faces: FractureFace[], n: THREE.Vector3, d: number ): FractureFace[] {
    const cut: THREE.Vector3[] = [];
    const kept: FractureFace[] = [];
    for ( const f of faces ) {
        const points = clipPolygon( f.points, n, d, cut );
        if ( points.length >= 3 ) kept.push( { ...f, points } );
    }
    const cap = capFace( cut, n );
    if ( cap ) kept.push( cap );
    return kept;
}

function clampSeed( v: number ): number {
    return Math.max( -SEED_LIMIT, Math.min( SEED_LIMIT, v ) );
}

export function fractureSeeds(): THREE.Vector3[] {
    const rand = mulberry32( SEED );
    const seeds: THREE.Vector3[] = [];
    const at = ( n: number, cells: number ) => ( n + 0.5 + ( rand() - 0.5 ) * 2 * COARSE_JITTER ) / cells - 0.5;
    for ( let i = 0; i < COARSE.x; i++ ) {
        for ( let j = 0; j < COARSE.y; j++ ) {
            for ( let k = 0; k < COARSE.z; k++ ) {
                seeds.push( new THREE.Vector3( at( i, COARSE.x ), at( j, COARSE.y ), at( k, COARSE.z ) ) );
            }
        }
    }
    for ( let s = 0; s < SHARDS; s++ ) {
        seeds.push(
            new THREE.Vector3(
                clampSeed( SHARD_CENTRE.x + ( rand() - 0.5 ) * 2 * SHARD_SPREAD.x ),
                clampSeed( SHARD_CENTRE.y + ( rand() - 0.5 ) * 2 * SHARD_SPREAD.y ),
                clampSeed( SHARD_CENTRE.z + ( rand() - 0.5 ) * 2 * SHARD_SPREAD.z ),
            ),
        );
    }
    return seeds;
}

function bounds( faces: FractureFace[] ): { centre: THREE.Vector3; half: THREE.Vector3 } {
    const box = new THREE.Box3();
    for ( const f of faces ) for ( const p of f.points ) box.expandByPoint( p );
    return {
        centre: box.getCenter( new THREE.Vector3() ),
        half: box.getSize( new THREE.Vector3() ).multiplyScalar( 0.5 ),
    };
}

let cells: FractureCell[] | null = null;

export function fractureCells(): FractureCell[] {
    if ( cells ) return cells;
    const seeds = fractureSeeds();
    cells = seeds.map( ( s, i ) => {
        let faces = boxFaces();
        for ( let j = 0; j < seeds.length; j++ ) {
            if ( j === i ) continue;
            const n = new THREE.Vector3().subVectors( seeds[ j ], s ).normalize();
            const mid = new THREE.Vector3().addVectors( seeds[ j ], s ).multiplyScalar( 0.5 );
            faces = clipCell( faces, n, n.dot( mid ) );
        }
        return { faces, ...bounds( faces ) };
    } );
    return cells;
}

export function cellVolume( cell: FractureCell ): number {
    let v = 0;
    for ( const f of cell.faces ) {
        const a = f.points[ 0 ];
        for ( let i = 1; i < f.points.length - 1; i++ ) {
            v += a.dot( new THREE.Vector3().crossVectors( f.points[ i ], f.points[ i + 1 ] ) );
        }
    }
    return v / 6;
}

export function cellHull( cell: FractureCell ): THREE.Vector3[] {
    return unique( cell.faces.flatMap( ( f ) => f.points ) );
}

function cellsGeometry( list: readonly FractureCell[], first: number ): THREE.BufferGeometry {
    const position: number[] = [];
    const normal: number[] = [];
    const fracture: number[] = [];
    const centre: number[] = [];
    const half: number[] = [];
    const seed: number[] = [];
    list.forEach( ( cell, offset ) => {
        for ( const f of cell.faces ) {
            for ( let i = 1; i < f.points.length - 1; i++ ) {
                for ( const p of [ f.points[ 0 ], f.points[ i ], f.points[ i + 1 ] ] ) {
                    position.push( p.x, p.y, p.z );
                    normal.push( f.normal.x, f.normal.y, f.normal.z );
                    fracture.push( f.tag );
                    centre.push( cell.centre.x, cell.centre.y, cell.centre.z );
                    half.push( cell.half.x, cell.half.y, cell.half.z );
                    seed.push( first + offset );
                }
            }
        }
    } );
    const g = new THREE.BufferGeometry();
    g.setAttribute( 'position', new THREE.Float32BufferAttribute( position, 3 ) );
    g.setAttribute( 'normal', new THREE.Float32BufferAttribute( normal, 3 ) );
    g.setAttribute( 'aFracture', new THREE.Float32BufferAttribute( fracture, 1 ) );
    g.setAttribute( 'aCellCentre', new THREE.Float32BufferAttribute( centre, 3 ) );
    g.setAttribute( 'aCellHalf', new THREE.Float32BufferAttribute( half, 3 ) );
    g.setAttribute( 'aCellSeed', new THREE.Float32BufferAttribute( seed, 1 ) );
    return g;
}

export function fracturedBlockGeometry(): THREE.BufferGeometry {
    return cellsGeometry( fractureCells(), 0 );
}

export function cellGeometry( index: number ): THREE.BufferGeometry {
    return cellsGeometry( [ fractureCells()[ index ] ], index );
}

export function shareCells( g: THREE.BufferGeometry ): THREE.BufferGeometry {
    const out = new THREE.BufferGeometry();
    for ( const name of [ 'position', 'normal', 'aFracture', 'aCellCentre', 'aCellHalf', 'aCellSeed' ] ) {
        out.setAttribute( name, g.getAttribute( name ) );
    }
    return out;
}

export function fractureOrient( id: number ): number {
    return ( Math.imul( id, 0x9e37_79b1 ) >>> 16 ) % FRACTURE_ORIENTS;
}

export function fractureTurn( v: THREE.Vector3, orient: number, out: THREE.Vector3 ): THREE.Vector3 {
    let x = v.x;
    let y = v.y;
    let z = v.z;
    if ( orient >= 4 ) {
        y = -y;
        z = -z;
    }
    let q = orient % 4;
    if ( q >= 2 ) {
        x = -x;
        z = -z;
        q -= 2;
    }
    if ( q >= 1 ) {
        const t = x;
        x = z;
        z = -t;
    }
    return out.set( x, y, z );
}
