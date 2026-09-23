import * as THREE from 'three';

export const FRACTURE_OUTER = 0;
export const FRACTURE_WALL = 0.35;
export const FRACTURE_CORE = 1;

export interface OutlinePoint {
    x: number;
    y: number;
    edge: number;
}

export interface FracturedChunk {
    outline: OutlinePoint[];
    depth: number;
    face: number;
}

const LEVELS = [ -0.5, -0.25, -0.02, 0.16, 0.5 ];
const CENTRE = [ 0.04, -0.05, 0.06, -0.03, 0.02 ];
const HALF_GAP = [ 0.008, 0.02, 0.035, 0.06, 0.08 ];
const NOTCH_DROP = 0.26;
const NOTCH_REACH = 0.18;
const CHIP = 0.1;
const CORE_HALF = 0.025;
const CORE_TOP = 0.3;
const CORE_DEPTH = 0.9;

const W = FRACTURE_WALL;
const O = FRACTURE_OUTER;

function crackEdge( side: -1 | 1 ): OutlinePoint[] {
    return LEVELS.slice( 0, -1 ).map( ( y, i ) => ( { x: CENTRE[ i ] + side * HALF_GAP[ i ], y, edge: W } ) );
}

function leftChunk(): FracturedChunk {
    const crack = crackEdge( -1 );
    const topX = CENTRE[ 4 ] - HALF_GAP[ 4 ];
    const outline: OutlinePoint[] = [
        { x: -0.5, y: -0.5, edge: O },
        ...crack,
        { x: topX, y: 0.5 - NOTCH_DROP, edge: W },
        { x: topX - NOTCH_REACH, y: 0.5, edge: O },
        { x: -0.5, y: 0.5, edge: O },
    ];
    return { outline, depth: 1, face: O };
}

function rightChunk(): FracturedChunk {
    const crack = crackEdge( 1 ).reverse();
    const topX = CENTRE[ 4 ] + HALF_GAP[ 4 ];
    const outline: OutlinePoint[] = [
        { x: crack[ crack.length - 1 ].x, y: -0.5, edge: O },
        { x: 0.5, y: -0.5, edge: O },
        { x: 0.5, y: 0.5 - CHIP, edge: W },
        { x: 0.5 - CHIP, y: 0.5, edge: O },
        { x: topX + NOTCH_REACH, y: 0.5, edge: W },
        { x: topX, y: 0.5 - NOTCH_DROP, edge: W },
        ...crack.slice( 0, -1 ),
    ];
    return { outline, depth: 1, face: O };
}

function coreChunk(): FracturedChunk {
    const t = ( CORE_TOP - LEVELS[ 3 ] ) / ( LEVELS[ 4 ] - LEVELS[ 3 ] );
    const topCentre = CENTRE[ 3 ] + t * ( CENTRE[ 4 ] - CENTRE[ 3 ] );
    const ys = [ ...LEVELS.slice( 0, -1 ), CORE_TOP ];
    const xs = [ ...CENTRE.slice( 0, -1 ), topCentre ];
    const up = ys.map( ( y, i ) => ( { x: xs[ i ] + CORE_HALF, y, edge: FRACTURE_CORE } ) );
    const down = ys.map( ( y, i ) => ( { x: xs[ i ] - CORE_HALF, y, edge: FRACTURE_CORE } ) ).reverse();
    return { outline: [ ...up, ...down ], depth: CORE_DEPTH, face: FRACTURE_CORE };
}

export function fracturedChunks(): { left: FracturedChunk; right: FracturedChunk; core: FracturedChunk } {
    return { left: leftChunk(), right: rightChunk(), core: coreChunk() };
}

export function outlineArea( outline: OutlinePoint[] ): number {
    let a = 0;
    for ( let i = 0; i < outline.length; i++ ) {
        const p = outline[ i ];
        const q = outline[ ( i + 1 ) % outline.length ];
        a += p.x * q.y - q.x * p.y;
    }
    return a / 2;
}

export function outlineCentre( outline: OutlinePoint[] ): THREE.Vector3 {
    const c = new THREE.Vector3();
    for ( const p of outline ) {
        c.x += p.x;
        c.y += p.y;
    }
    return c.divideScalar( outline.length );
}

interface Sink {
    positions: number[];
    normals: number[];
    fracture: number[];
}

type Vec3 = [ number, number, number ];

const _ab = new THREE.Vector3();
const _ac = new THREE.Vector3();

function pushTri( sink: Sink, tri: Vec3[], want: THREE.Vector3, fracture: number ): void {
    _ab.set( tri[ 1 ][ 0 ] - tri[ 0 ][ 0 ], tri[ 1 ][ 1 ] - tri[ 0 ][ 1 ], tri[ 1 ][ 2 ] - tri[ 0 ][ 2 ] );
    _ac.set( tri[ 2 ][ 0 ] - tri[ 0 ][ 0 ], tri[ 2 ][ 1 ] - tri[ 0 ][ 1 ], tri[ 2 ][ 2 ] - tri[ 0 ][ 2 ] );
    const ordered = _ab.cross( _ac ).dot( want ) < 0 ? [ tri[ 0 ], tri[ 2 ], tri[ 1 ] ] : tri;
    for ( const v of ordered ) {
        sink.positions.push( v[ 0 ], v[ 1 ], v[ 2 ] );
        sink.normals.push( want.x, want.y, want.z );
        sink.fracture.push( fracture );
    }
}

function pushCaps( sink: Sink, chunk: FracturedChunk, offset: THREE.Vector3 ): void {
    const contour = chunk.outline.map( ( p ) => new THREE.Vector2( p.x, p.y ) );
    const tris = THREE.ShapeUtils.triangulateShape( contour, [] );
    for ( const s of [ -1, 1 ] ) {
        const z = ( s * chunk.depth ) / 2 - offset.z;
        const want = new THREE.Vector3( 0, 0, s );
        for ( const tri of tris ) {
            const pts = tri.map( ( i ): Vec3 => [ contour[ i ].x - offset.x, contour[ i ].y - offset.y, z ] );
            pushTri( sink, pts, want, chunk.face );
        }
    }
}

function pushSides( sink: Sink, chunk: FracturedChunk, offset: THREE.Vector3 ): void {
    const n = chunk.outline.length;
    const z0 = -chunk.depth / 2 - offset.z;
    const z1 = chunk.depth / 2 - offset.z;
    for ( let i = 0; i < n; i++ ) {
        const p = chunk.outline[ i ];
        const q = chunk.outline[ ( i + 1 ) % n ];
        const px = p.x - offset.x;
        const py = p.y - offset.y;
        const qx = q.x - offset.x;
        const qy = q.y - offset.y;
        const want = new THREE.Vector3( qy - py, px - qx, 0 ).normalize();
        pushTri(
            sink,
            [
                [ px, py, z0 ],
                [ qx, qy, z0 ],
                [ qx, qy, z1 ],
            ],
            want,
            p.edge,
        );
        pushTri(
            sink,
            [
                [ px, py, z0 ],
                [ qx, qy, z1 ],
                [ px, py, z1 ],
            ],
            want,
            p.edge,
        );
    }
}

function build( chunks: FracturedChunk[], offset: THREE.Vector3 ): THREE.BufferGeometry {
    const sink: Sink = { positions: [], normals: [], fracture: [] };
    for ( const chunk of chunks ) {
        pushCaps( sink, chunk, offset );
        pushSides( sink, chunk, offset );
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( sink.positions, 3 ) );
    geometry.setAttribute( 'normal', new THREE.Float32BufferAttribute( sink.normals, 3 ) );
    geometry.setAttribute( 'aFracture', new THREE.Float32BufferAttribute( sink.fracture, 1 ) );
    return geometry;
}

export function fracturedBlockGeometry(): THREE.BufferGeometry {
    const { left, right, core } = fracturedChunks();
    return build( [ left, right, core ], new THREE.Vector3() );
}

export interface DebrisPiece {
    geometry: THREE.BufferGeometry;
    centre: THREE.Vector3;
}

export function fracturedDebrisPieces(): DebrisPiece[] {
    const { left, right } = fracturedChunks();
    return [ left, right ].map( ( chunk ) => {
        const centre = outlineCentre( chunk.outline );
        return { geometry: build( [ chunk ], centre ), centre };
    } );
}
