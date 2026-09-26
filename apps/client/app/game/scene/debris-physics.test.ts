import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
    addHullPoint,
    type DebrisBody,
    type DebrisGround,
    type DebrisParams,
    makeBody,
    resetBody,
    setBoxInertia,
    stepBody,
} from './debris-physics';

const _r = new THREE.Vector3();

function lowestHullY( b: DebrisBody ): number {
    let low = Number.POSITIVE_INFINITY;
    for ( let i = 0; i < b.count; i++ ) {
        _r.set( b.hull[ i * 3 ], b.hull[ i * 3 + 1 ], b.hull[ i * 3 + 2 ] ).applyQuaternion( b.q );
        low = Math.min( low, b.p.y + _r.y );
    }
    return low;
}

const PARAMS: DebrisParams = { gravity: 46, bounce: 0.2, friction: 0.6, spinDrag: 0.2 };
const H = 1 / 120;

function flat( y: number ): DebrisGround {
    return { floor: () => y, walls: () => {} };
}

const pit: DebrisGround = { floor: () => Number.NEGATIVE_INFINITY, walls: () => {} };

function box( w: number, h: number, d: number ): DebrisBody {
    const b = makeBody();
    resetBody( b );
    for ( const x of [ -w / 2, w / 2 ] ) {
        for ( const y of [ -h / 2, h / 2 ] ) {
            for ( const z of [ -d / 2, d / 2 ] ) addHullPoint( b, x, y, z );
        }
    }
    setBoxInertia( b, w, h, d );
    return b;
}

function run( b: DebrisBody, ground: DebrisGround, seconds: number, each?: () => void ): void {
    for ( let t = 0; t < seconds; t += H ) {
        stepBody( b, H, PARAMS, ground );
        each?.();
    }
}

describe( 'debris physics', () => {
    it( 'lands a dropped block on the deck and puts it to sleep', () => {
        const b = box( 2, 2, 2 );
        b.p.set( 0, 6, 0 );
        run( b, flat( 0 ), 4 );
        expect( b.asleep ).toBe( true );
        expect( lowestHullY( b ) ).toBeCloseTo( 0, 1 );
    } );

    it( 'loses most of its height on every bounce', () => {
        const b = box( 2, 2, 2 );
        b.p.set( 0, 11, 0 );
        let apex = 0;
        let bounced = false;
        let prev = b.v.y;
        run( b, flat( 0 ), 3, () => {
            if ( prev < 0 && b.v.y > 0 ) bounced = true;
            if ( bounced ) apex = Math.max( apex, lowestHullY( b ) );
            prev = b.v.y;
        } );
        expect( bounced ).toBe( true );
        expect( apex ).toBeLessThan( 10 * 0.2 * 0.2 * 2 );
    } );

    it( 'falls through a pit', () => {
        const b = box( 2, 2, 2 );
        b.p.set( 0, 2, 0 );
        run( b, pit, 2 );
        expect( b.p.y ).toBeLessThan( -50 );
    } );

    it( 'topples a block landing on its corner onto a face', () => {
        const b = box( 3, 1.2, 2 );
        b.q.setFromEuler( new THREE.Euler( 0.5, 0.3, 0.7 ) );
        b.p.set( 0, 5, 0 );
        run( b, flat( 0 ), 6 );
        expect( b.asleep ).toBe( true );
        const up = new THREE.Vector3( 0, 1, 0 );
        const aligned = [ 1, 0, 0, 0, 1, 0, 0, 0, 1 ]
            .reduce< THREE.Vector3[] >( ( axes, _, i, all ) => {
                if ( i % 3 === 0 ) axes.push( new THREE.Vector3( all[ i ], all[ i + 1 ], all[ i + 2 ] ) );
                return axes;
            }, [] )
            .map( ( a ) => Math.abs( a.applyQuaternion( b.q ).dot( up ) ) );
        expect( Math.max( ...aligned ) ).toBeGreaterThan( Math.cos( ( 6 * Math.PI ) / 180 ) );
    } );

    it( 'slides to a stop under friction', () => {
        const b = box( 2, 2, 2 );
        b.p.set( 0, 1, 0 );
        b.v.set( 0, 0, 30 );
        run( b, flat( 0 ), 5 );
        expect( b.asleep ).toBe( true );
        expect( b.p.z ).toBeGreaterThan( 5 );
        expect( b.p.z ).toBeLessThan( 120 );
    } );

    it( 'reports the hardest landing impulse', () => {
        const b = box( 2, 2, 2 );
        b.p.set( 0, 12, 0 );
        let hardest = 0;
        run( b, flat( 0 ), 1, () => {
            hardest = Math.max( hardest, b.slam );
        } );
        expect( hardest ).toBeGreaterThan( 6 );
    } );
} );
