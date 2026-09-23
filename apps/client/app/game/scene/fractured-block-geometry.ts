import { mulberry32 } from '@slur/shared';
import * as THREE from 'three';

export const FRACTURE_OUTER = 0;
export const FRACTURE_WALL = 1;
export const FRACTURE_ORIENTS = 8;

const GRID = { x: 2, y: 3, z: 2 } as const;
const JITTER = 0.42;
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

function capFace( cut: THREE.Vector3[], n: THREE.Vector3 ): FractureFace | null {
    const unique: THREE.Vector3[] = [];
    for ( const p of cut ) if ( ! unique.some( ( u ) => u.distanceToSquared( p ) < 1e-10 ) ) unique.push( p );
    if ( unique.length < 3 ) return null;
    const c = unique.reduce( ( a, p ) => a.add( p ), new THREE.Vector3() ).divideScalar( unique.length );
    const u = new THREE.Vector3().subVectors( unique[ 0 ], c ).normalize();
    const v = new THREE.Vector3().crossVectors( n, u );
    const angle = ( p: THREE.Vector3 ) => {
        const r = new THREE.Vector3().subVectors( p, c );
        return Math.atan2( r.dot( v ), r.dot( u ) );
    };
    unique.sort( ( a, b ) => angle( a ) - angle( b ) );
    return { points: unique, normal: n.clone(), tag: FRACTURE_WALL };
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

export function fractureSeeds(): THREE.Vector3[] {
    const rand = mulberry32( SEED );
    const seeds: THREE.Vector3[] = [];
    for ( let i = 0; i < GRID.x; i++ ) {
        for ( let j = 0; j < GRID.y; j++ ) {
            for ( let k = 0; k < GRID.z; k++ ) {
                const at = ( n: number, cells: number ) => ( n + 0.5 + ( rand() - 0.5 ) * 2 * JITTER ) / cells - 0.5;
                seeds.push( new THREE.Vector3( at( i, GRID.x ), at( j, GRID.y ), at( k, GRID.z ) ) );
            }
        }
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

export function fracturedBlockGeometry(): THREE.BufferGeometry {
    const position: number[] = [];
    const normal: number[] = [];
    const fracture: number[] = [];
    const centre: number[] = [];
    const half: number[] = [];
    const seed: number[] = [];
    fractureCells().forEach( ( cell, index ) => {
        for ( const f of cell.faces ) {
            for ( let i = 1; i < f.points.length - 1; i++ ) {
                for ( const p of [ f.points[ 0 ], f.points[ i ], f.points[ i + 1 ] ] ) {
                    position.push( p.x, p.y, p.z );
                    normal.push( f.normal.x, f.normal.y, f.normal.z );
                    fracture.push( f.tag );
                    centre.push( cell.centre.x, cell.centre.y, cell.centre.z );
                    half.push( cell.half.x, cell.half.y, cell.half.z );
                    seed.push( index );
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
