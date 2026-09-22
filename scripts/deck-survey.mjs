import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

const REFERENCE = 'docs/art-direction/golden-reference/cruise-lighting.png';
const REFERENCE_BOX = [ 0.11, 0.5, 0.93, 0.96 ];
const DEFAULT_BOX = [ 0.05, 0.35, 0.95, 0.98 ];
const CHANNELS = { 0: 1, 2: 3, 4: 2, 6: 4 };
const WARM_MAX = 1.05;
const BLOWN_MAX = 90;
const MIN_ROW_PATCHES = 6;
const PATCH_DIVISOR = 84;

function readChunks( buf ) {
    let pos = 8;
    let header = null;
    const idat = [];
    while ( pos < buf.length ) {
        const len = buf.readUInt32BE( pos );
        const tag = buf.toString( 'ascii', pos + 4, pos + 8 );
        const data = buf.subarray( pos + 8, pos + 8 + len );
        if ( tag === 'IHDR' )
            header = { w: data.readUInt32BE( 0 ), h: data.readUInt32BE( 4 ), depth: data[ 8 ], type: data[ 9 ] };
        else if ( tag === 'IDAT' ) idat.push( data );
        else if ( tag === 'IEND' ) break;
        pos += 12 + len;
    }
    return { header, idat };
}

function paeth( a, b, c ) {
    const p = a + b - c;
    const pa = Math.abs( p - a );
    const pb = Math.abs( p - b );
    const pc = Math.abs( p - c );
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

const FILTERS = [ () => 0, ( a ) => a, ( _a, b ) => b, ( a, b ) => ( a + b ) >> 1, paeth ];

function unfilterRow( filter, line, cur, prev, ch ) {
    const predict = FILTERS[ filter ];
    for ( let i = 0; i < line.length; i++ ) {
        const a = i >= ch ? cur[ i - ch ] : 0;
        const b = prev ? prev[ i ] : 0;
        const c = prev && i >= ch ? prev[ i - ch ] : 0;
        cur[ i ] = ( line[ i ] + predict( a, b, c ) ) & 0xff;
    }
}

export function decode( path ) {
    const { header, idat } = readChunks( readFileSync( path ) );
    if ( ! header ) throw new Error( `${ path }: no IHDR chunk` );
    const { w, h, depth, type } = header;
    if ( depth !== 8 ) throw new Error( `${ path }: bit depth ${ depth } unsupported` );
    const ch = CHANNELS[ type ];
    if ( ! ch ) throw new Error( `${ path }: colour type ${ type } unsupported` );
    const raw = inflateSync( Buffer.concat( idat ) );
    const stride = w * ch;
    const px = Buffer.alloc( h * stride );
    for ( let y = 0; y < h; y++ ) {
        const at = y * ( stride + 1 );
        unfilterRow(
            raw[ at ],
            raw.subarray( at + 1, at + 1 + stride ),
            px.subarray( y * stride, ( y + 1 ) * stride ),
            y > 0 ? px.subarray( ( y - 1 ) * stride, y * stride ) : null,
            ch,
        );
    }
    return { w, h, ch, px };
}

export function patch( img, x0, y0, x1, y1 ) {
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    for ( let y = y0; y < y1; y++ ) {
        for ( let x = x0; x < x1; x++ ) {
            const i = y * img.w * img.ch + x * img.ch;
            r += img.px[ i ];
            g += img.px[ i + 1 ];
            b += img.px[ i + 2 ];
            n++;
        }
    }
    return { r: r / n, g: g / n, b: b / n, n };
}

export function survey( path, box ) {
    const img = decode( path );
    const size = Math.max( 8, Math.round( img.w / PATCH_DIVISOR ) );
    const [ x0, y0, x1, y1 ] = box.map( ( f, i ) => Math.round( f * ( i % 2 ? img.h : img.w ) ) );
    const deviations = [];
    const kept = [];
    for ( let y = y0; y + size < y1; y += size ) {
        const row = [];
        for ( let x = x0; x + size < x1; x += size ) {
            const p = patch( img, x, y, x + size, y + size );
            row.push( {
                lum: 0.2126 * p.r + 0.7152 * p.g + 0.0722 * p.b,
                warm: p.r / Math.max( 1, p.b ),
                r: p.r,
                b: p.b,
            } );
        }
        const cool = row.filter( ( c ) => c.warm < WARM_MAX && c.lum < BLOWN_MAX );
        if ( cool.length < MIN_ROW_PATCHES ) continue;
        const rowMean = cool.reduce( ( a, c ) => a + c.lum, 0 ) / cool.length;
        for ( const c of cool ) {
            deviations.push( ( c.lum - rowMean ) / rowMean );
            kept.push( c );
        }
    }
    if ( kept.length === 0 ) throw new Error( `${ path }: no deck patches survived the warm/blown filter` );
    return {
        n: kept.length,
        lum: kept.reduce( ( a, c ) => a + c.lum, 0 ) / kept.length,
        sd: Math.sqrt( deviations.reduce( ( a, d ) => a + d * d, 0 ) / deviations.length ),
        br: kept.reduce( ( a, c ) => a + c.b / Math.max( 1, c.r ), 0 ) / kept.length,
    };
}

function parseTarget( arg ) {
    const at = arg.lastIndexOf( '@' );
    if ( at < 0 ) return { path: arg, box: DEFAULT_BOX };
    const box = arg
        .slice( at + 1 )
        .split( ',' )
        .map( Number );
    if ( box.length !== 4 || box.some( ( v ) => ! Number.isFinite( v ) ) ) {
        throw new Error( `bad box in "${ arg }" — expected @x0,y0,x1,y1 as fractions` );
    }
    return { path: arg.slice( 0, at ), box };
}

function report( label, path, box ) {
    const s = survey( path, box );
    const name = label.length > 22 ? `…${ label.slice( -21 ) }` : label;
    console.log(
        `${ name.padEnd( 22 ) } n=${ String( s.n ).padStart( 4 ) }  lum ${ s.lum.toFixed( 1 ).padStart( 5 ) }` +
            `  contrast ${ ( s.sd * 100 ).toFixed( 1 ).padStart( 5 ) }%  b/r ${ s.br.toFixed( 2 ) }`,
    );
}

const args = process.argv.slice( 2 ).filter( ( a ) => a !== '--no-reference' );
if ( args.length === 0 ) {
    console.log( 'usage: node scripts/deck-survey.mjs <png>[@x0,y0,x1,y1] ...   (box as 0-1 fractions)' );
    process.exit( 1 );
}
if ( ! process.argv.includes( '--no-reference' ) ) report( 'reference', REFERENCE, REFERENCE_BOX );
for ( const arg of args ) {
    const { path, box } = parseTarget( arg );
    report( path.split( '/' ).pop(), path, box );
}
