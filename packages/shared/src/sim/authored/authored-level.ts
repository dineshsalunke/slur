import { segmentOf } from '../groove/groove-track.js';
import type { GrooveObstacle } from '../groove/islands.js';
import { segmentsTrack } from '../score/emit.js';
import { HALF_WIDTH, SEG_LEN, START_SAFE, type Track, type TrackGen } from '../space.js';

export const AUTHORED_LEVEL_VERSION = 1;

export interface AuthoredRect {
    x: number;
    z: number;
    w: number;
    l: number;
}

export interface AuthoredBlock extends AuthoredRect {
    destructible: boolean;
}

export interface AuthoredSource {
    gen: TrackGen;
    seed: number;
}

export interface AuthoredLevel {
    version: typeof AUTHORED_LEVEL_VERSION;
    id: string;
    name: string;
    length: number;
    source: AuthoredSource | null;
    savedAt: string;
    blocks: AuthoredBlock[];
    gaps: AuthoredRect[];
}

const SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/;

export function isLevelSlug( v: unknown ): v is string {
    return typeof v === 'string' && SLUG.test( v );
}

function fail( msg: string ): never {
    throw new Error( `authored level: ${ msg }` );
}

function record( v: unknown, at: string ): Record< string, unknown > {
    if ( typeof v !== 'object' || v === null || Array.isArray( v ) ) fail( `${ at } is not an object` );
    return v as Record< string, unknown >;
}

function num( o: Record< string, unknown >, key: string, at: string ): number {
    const v = o[ key ];
    if ( typeof v !== 'number' || ! Number.isFinite( v ) ) fail( `${ at }.${ key } is not a finite number` );
    return v;
}

function rect( v: unknown, at: string, length: number ): AuthoredRect {
    const o = record( v, at );
    const r = { x: num( o, 'x', at ), z: num( o, 'z', at ), w: num( o, 'w', at ), l: num( o, 'l', at ) };
    if ( r.w <= 0 || r.l <= 0 ) fail( `${ at } has w or l <= 0` );
    if ( r.x < -HALF_WIDTH || r.x + r.w > HALF_WIDTH ) fail( `${ at } leaves the deck in x` );
    if ( r.z < 0 || r.z + r.l > length * SEG_LEN ) fail( `${ at } leaves the track in z` );
    return r;
}

function list( o: Record< string, unknown >, key: string ): unknown[] {
    const v = o[ key ];
    if ( ! Array.isArray( v ) ) fail( `${ key } is not an array` );
    return v;
}

function source( v: unknown ): AuthoredSource | null {
    if ( v === null || v === undefined ) return null;
    const o = record( v, 'source' );
    if ( typeof o.gen !== 'string' ) fail( 'source.gen is not a string' );
    return { gen: o.gen as TrackGen, seed: num( o, 'seed', 'source' ) };
}

export function parseAuthoredLevel( json: unknown ): AuthoredLevel {
    const o = record( json, 'level' );
    if ( o.version !== AUTHORED_LEVEL_VERSION ) fail( `unsupported version ${ String( o.version ) }` );
    if ( ! isLevelSlug( o.id ) ) fail( 'id is not a slug' );
    const length = num( o, 'length', 'level' );
    if ( ! Number.isInteger( length ) || length <= START_SAFE )
        fail( `length ${ length } is not an integer > ${ START_SAFE }` );
    return {
        version: AUTHORED_LEVEL_VERSION,
        id: o.id,
        name: typeof o.name === 'string' ? o.name : o.id,
        length,
        source: source( o.source ),
        savedAt: typeof o.savedAt === 'string' ? o.savedAt : '',
        blocks: list( o, 'blocks' ).map( ( b, k ) => {
            const at = `blocks[${ k }]`;
            const destructible = record( b, at ).destructible;
            if ( typeof destructible !== 'boolean' ) fail( `${ at }.destructible is not a boolean` );
            return { ...rect( b, at, length ), destructible };
        } ),
        gaps: list( o, 'gaps' ).map( ( g, k ) => rect( g, `gaps[${ k }]`, length ) ),
    };
}

function byZThenX( a: AuthoredRect, b: AuthoredRect ): number {
    return a.z - b.z || a.x - b.x;
}

function inline( v: object ): string {
    const fields = Object.entries( v ).map( ( [ k, x ] ) => `${ JSON.stringify( k ) }: ${ JSON.stringify( x ) }` );
    return `{ ${ fields.join( ', ' ) } }`;
}

function entries( rows: readonly object[] ): string {
    if ( rows.length === 0 ) return '[]';
    return `[\n${ rows.map( ( r ) => `        ${ inline( r ) }` ).join( ',\n' ) }\n    ]`;
}

export function serializeAuthoredLevel( level: AuthoredLevel ): string {
    const blocks = [ ...level.blocks ]
        .sort( byZThenX )
        .map( ( b ) => ( { x: b.x, z: b.z, w: b.w, l: b.l, destructible: b.destructible } ) );
    const gaps = [ ...level.gaps ].sort( byZThenX ).map( ( g ) => ( { x: g.x, z: g.z, w: g.w, l: g.l } ) );
    const src = level.source === null ? 'null' : inline( { gen: level.source.gen, seed: level.source.seed } );
    return [
        '{',
        `    "version": ${ level.version },`,
        `    "id": ${ JSON.stringify( level.id ) },`,
        `    "name": ${ JSON.stringify( level.name ) },`,
        `    "length": ${ level.length },`,
        `    "source": ${ src },`,
        `    "savedAt": ${ JSON.stringify( level.savedAt ) },`,
        `    "blocks": ${ entries( blocks ) },`,
        `    "gaps": ${ entries( gaps ) }`,
        '}',
        '',
    ].join( '\n' );
}

export function authoredObstacles( level: AuthoredLevel ): GrooveObstacle[] {
    const box = ( r: AuthoredRect ) => ( { x0: r.x, x1: r.x + r.w, z0: r.z, z1: r.z + r.l, event: -1 } );
    return [
        ...level.blocks.map( ( b ): GrooveObstacle => ( { kind: b.destructible ? 'smash' : 'island', ...box( b ) } ) ),
        ...level.gaps.map( ( g ): GrooveObstacle => ( { kind: 'hole', ...box( g ) } ) ),
    ];
}

export function authoredTrack( level: AuthoredLevel ): Track {
    const obstacles = authoredObstacles( level );
    const segments = Array.from( { length: level.length }, ( _, i ) => segmentOf( i, obstacles ) );
    return segmentsTrack( segments, level.length );
}

const levels = new Map< string, AuthoredLevel >();

export function registerAuthoredLevel( level: AuthoredLevel ): void {
    levels.set( level.id, level );
}

export function forgetAuthoredLevel( id: string ): void {
    levels.delete( id );
}

export function authoredLevel( id: string ): AuthoredLevel | undefined {
    return levels.get( id );
}

export function authoredTrackFor( id: string ): Track {
    const level = levels.get( id );
    if ( level === undefined ) throw new Error( `authored level "${ id }" is not registered` );
    return authoredTrack( level );
}
