import * as THREE from 'three';

export interface BlockDims {
    w: number;
    h: number;
    d: number;
}

export const SEALED_BLOCK_BEVEL = 0.12;

export const SEALED_BLOCK_UNIT_BEVEL = 0.2;

export const SEALED_BLOCK_UNIT_DIMS: BlockDims = { w: 1, h: 1, d: 1 };

const MAX_BEVEL_FRACTION = 0.45;

const AXES = [ 0, 1, 2 ];
const SIGNS = [ -1, 1 ];

type Vec3 = [ number, number, number ];

type CornerFn = ( s: Vec3, axis: number ) => Vec3;

interface Sink {
    positions: number[];
    normals: number[];
}

function crossNormal( a: Vec3, b: Vec3, c: Vec3 ): THREE.Vector3 {
    const ab = new THREE.Vector3( b[ 0 ] - a[ 0 ], b[ 1 ] - a[ 1 ], b[ 2 ] - a[ 2 ] );
    const ac = new THREE.Vector3( c[ 0 ] - a[ 0 ], c[ 1 ] - a[ 1 ], c[ 2 ] - a[ 2 ] );
    return ab.cross( ac ).normalize();
}

function pushPolygon( sink: Sink, poly: Vec3[], want: Vec3 ) {
    const n = new THREE.Vector3( ...want ).normalize();
    const ordered = crossNormal( poly[ 0 ], poly[ 1 ], poly[ 2 ] ).dot( n ) < 0 ? [ ...poly ].reverse() : poly;

    for ( let i = 1; i < ordered.length - 1; i++ ) {
        for ( const v of [ ordered[ 0 ], ordered[ i ], ordered[ i + 1 ] ] ) {
            sink.positions.push( v[ 0 ], v[ 1 ], v[ 2 ] );
            sink.normals.push( n.x, n.y, n.z );
        }
    }
}

const signAt = ( axis: number, s: number, u: number, su: number, v: number, sv: number ): Vec3 => {
    const sign: Vec3 = [ 0, 0, 0 ];
    sign[ axis ] = s;
    sign[ u ] = su;
    sign[ v ] = sv;
    return sign;
};

const unit = ( axis: number, s: number ): Vec3 => {
    const n: Vec3 = [ 0, 0, 0 ];
    n[ axis ] = s;
    return n;
};

function addFace( sink: Sink, corner: CornerFn, axis: number, s: number, u: number, v: number ) {
    const at = ( su: number, sv: number ) => corner( signAt( axis, s, u, su, v, sv ), axis );
    pushPolygon( sink, [ at( -1, -1 ), at( -1, 1 ), at( 1, 1 ), at( 1, -1 ) ], unit( axis, s ) );
}

function addChamfer( sink: Sink, corner: CornerFn, axis: number, u: number, su: number, v: number, sv: number ) {
    const [ lo, hi ] = SIGNS.map( ( s ) => signAt( axis, s, u, su, v, sv ) );
    const want: Vec3 = [ 0, 0, 0 ];
    want[ u ] = su;
    want[ v ] = sv;
    pushPolygon( sink, [ corner( lo, u ), corner( hi, u ), corner( hi, v ), corner( lo, v ) ], want );
}

function addCorner( sink: Sink, corner: CornerFn, s: Vec3 ) {
    pushPolygon( sink, [ corner( s, 0 ), corner( s, 1 ), corner( s, 2 ) ], s );
}

function addShell( sink: Sink, corner: CornerFn, beveled: boolean ) {
    for ( const axis of AXES ) {
        const [ u, v ] = AXES.filter( ( i ) => i !== axis );
        for ( const s of SIGNS ) addFace( sink, corner, axis, s, u, v );
        if ( ! beveled ) continue;
        for ( const su of SIGNS ) {
            for ( const sv of SIGNS ) addChamfer( sink, corner, axis, u, su, v, sv );
        }
    }
}

function addCorners( sink: Sink, corner: CornerFn ) {
    for ( const sx of SIGNS ) {
        for ( const sy of SIGNS ) {
            for ( const sz of SIGNS ) addCorner( sink, corner, [ sx, sy, sz ] );
        }
    }
}

export function sealedBlockBevel( { w, h, d }: BlockDims, bevel = SEALED_BLOCK_BEVEL ): number {
    return Math.max( 0, Math.min( bevel, ( MAX_BEVEL_FRACTION * Math.min( w, h, d ) ) / 2 ) );
}

export function sealedBlockGeometry( { w, h, d }: BlockDims, bevel = SEALED_BLOCK_BEVEL ): THREE.BufferGeometry {
    const half: Vec3 = [ w / 2, h / 2, d / 2 ];
    const c = sealedBlockBevel( { w, h, d }, bevel );
    const corner: CornerFn = ( s, axis ) =>
        AXES.map( ( i ) => s[ i ] * ( i === axis ? half[ i ] : half[ i ] - c ) ) as Vec3;

    const sink: Sink = { positions: [], normals: [] };
    addShell( sink, corner, c > 0 );
    if ( c > 0 ) addCorners( sink, corner );

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( sink.positions, 3 ) );
    geometry.setAttribute( 'normal', new THREE.Float32BufferAttribute( sink.normals, 3 ) );
    return geometry;
}
