import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { PIECE_BUDGET } from './meteor-rock/meteor-rock.constants';
import { type MeteorParams, meteorRock, nearestCell, triangleCount } from './meteor-rock/meteor-rock.utils';

const PARAMS: MeteorParams = {
    seed: 7,
    cells: 5,
    jagged: 0.08,
    elongation: 0.45,
    lumps: 0.5,
    ridges: 0.4,
    craters: 42,
    craterSize: 0.24,
    boulders: 16,
};

function key( p: THREE.Vector3 ): string {
    return `${ p.x.toFixed( 4 ) },${ p.y.toFixed( 4 ) },${ p.z.toFixed( 4 ) }`;
}

function openEdges( geometry: THREE.BufferGeometry ): number {
    const obj = geometry.getAttribute( 'aObj' );
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const edges = new Map< string, number >();
    for ( let t = 0; t < obj.count; t += 3 ) {
        for ( let k = 0; k < 3; k++ ) {
            const ka = key( a.fromBufferAttribute( obj, t + k ) );
            const kb = key( b.fromBufferAttribute( obj, t + ( ( k + 1 ) % 3 ) ) );
            if ( ka === kb ) continue;
            const e = ka < kb ? `${ ka }|${ kb }` : `${ kb }|${ ka }`;
            edges.set( e, ( edges.get( e ) ?? 0 ) + 1 );
        }
    }
    let open = 0;
    for ( const n of edges.values() ) if ( n !== 2 ) open++;
    return open;
}

describe( 'meteorRock', () => {
    const rock = meteorRock( PARAMS );

    it( 'builds the same geometry from the same seed', () => {
        const again = meteorRock( PARAMS );
        expect( Array.from( again.head.getAttribute( 'position' ).array ) ).toEqual(
            Array.from( rock.head.getAttribute( 'position' ).array ),
        );
        expect( Array.from( again.merged.getAttribute( 'position' ).array ) ).toEqual(
            Array.from( rock.merged.getAttribute( 'position' ).array ),
        );
    } );

    it( 'keeps the intact meteor within 400 triangles', () => {
        expect( triangleCount( rock.head ) ).toBeLessThanOrEqual( 400 );
    } );

    it( 'keeps all pieces together within the piece budget', () => {
        expect( triangleCount( rock.merged ) ).toBeLessThanOrEqual( PIECE_BUDGET );
        expect( triangleCount( rock.merged ) ).toBe( rock.pieceTriangles );
    } );

    it( 'makes one non-empty piece per cell', () => {
        expect( rock.pieces.length ).toBe( PARAMS.cells );
        for ( const p of rock.pieces ) expect( triangleCount( p.geometry ) ).toBeGreaterThan( 0 );
    } );

    it( 'closes every piece', () => {
        for ( const p of rock.pieces ) expect( openEdges( p.geometry ) ).toBe( 0 );
    } );

    it( 'puts each crust vertex in the cell of its piece', () => {
        const obj = new THREE.Vector3();
        for ( const p of rock.pieces ) {
            const at = p.geometry.getAttribute( 'aObj' );
            const inner = p.geometry.getAttribute( 'aInner' );
            const center = new THREE.Vector3();
            let n = 0;
            for ( let i = 0; i < at.count; i++ ) {
                if ( inner.getX( i ) !== 0 ) continue;
                center.add( obj.fromBufferAttribute( at, i ) );
                n++;
            }
            expect( nearestCell( center.divideScalar( n ), rock.shape.seeds, PARAMS.jagged ) ).toBe( p.cell );
        }
    } );
} );
