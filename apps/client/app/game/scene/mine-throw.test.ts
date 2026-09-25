import { describe, expect, it } from 'vitest';
import {
    BACK_LAND_S,
    type BodyPose,
    bodyAt,
    COLLAPSE_S,
    type MineThrow,
    OPEN_END_S,
    SETTLE_END_S,
    SHOT_LAND_S,
    SHOT_LIFT,
    SHOT_RISE,
    type ShotPose,
    SPIKE_HEIGHT,
    SPIKE_LIFE_S,
    SPIKE_RISE_S,
    shotAt,
    spikeAt,
    throwFrom,
} from './mine-throw';

const SHIP = { x: 2, y: 1, z: 100, halfL: 3 };
const AHEAD = { x: 2, y: 0.5, z: 190, armed: false };
const BEHIND = { x: 2, y: 0.5, z: 93, armed: false };

function fresh(): MineThrow {
    return { bornAt: 0, fromX: 0, fromY: 0, fromZ: 0, dir: 1 };
}

function pose(): ShotPose {
    return { x: 0, y: 0, z: 0, traveled: 0, pitch: 0, dir: 0 };
}

function body(): BodyPose {
    return { visible: false, squash: 0, open: 0 };
}

describe( 'throwFrom', () => {
    it( 'launches a forward mine from the nose', () => {
        const t = throwFrom( fresh(), AHEAD, SHIP, 5 );
        expect( t ).toEqual( { bornAt: 5, fromX: 2, fromY: 1 + SHOT_LIFT, fromZ: 103, dir: 1 } );
    } );

    it( 'launches a back mine from the tail', () => {
        const t = throwFrom( fresh(), BEHIND, SHIP, 5 );
        expect( t.fromZ ).toBe( 97 );
        expect( t.dir ).toBe( -1 );
    } );

    it( 'skips the throw for a mine that is already armed or has no owner in view', () => {
        expect( throwFrom( fresh(), { ...AHEAD, armed: true }, SHIP, 5 ).bornAt ).toBe( Number.NEGATIVE_INFINITY );
        expect( throwFrom( fresh(), AHEAD, null, 5 ).bornAt ).toBe( Number.NEGATIVE_INFINITY );
    } );
} );

describe( 'shotAt', () => {
    const t = throwFrom( fresh(), AHEAD, SHIP, 0 );

    it( 'starts at the nose and reaches the mine when it lands', () => {
        const p = pose();
        expect( shotAt( t, AHEAD, 0, p ) ).toBe( true );
        expect( [ p.x, p.y, p.z ] ).toEqual( [ 2, 1 + SHOT_LIFT, 103 ] );
        shotAt( t, AHEAD, SHOT_LAND_S, p );
        expect( p.x ).toBeCloseTo( AHEAD.x );
        expect( p.y ).toBeCloseTo( AHEAD.y );
        expect( p.z ).toBeCloseTo( AHEAD.z );
    } );

    it( 'rises no more than the arc height above the straight line', () => {
        const p = pose();
        shotAt( t, AHEAD, SHOT_LAND_S / 2, p );
        const line = ( t.fromY + AHEAD.y ) / 2;
        expect( p.y - line ).toBeCloseTo( SHOT_RISE );
    } );

    it( 'climbs out of the nose and comes down onto the deck at a shallow angle', () => {
        const p = pose();
        shotAt( t, AHEAD, 0, p );
        expect( p.pitch ).toBeGreaterThan( 0 );
        shotAt( t, AHEAD, SHOT_LAND_S, p );
        expect( p.pitch ).toBeLessThan( 0 );
        expect( Math.abs( p.pitch ) ).toBeLessThan( ( 10 * Math.PI ) / 180 );
    } );

    it( 'collapses into the landing point, then stops', () => {
        const p = pose();
        shotAt( t, AHEAD, SHOT_LAND_S, p );
        const full = p.traveled;
        shotAt( t, AHEAD, SHOT_LAND_S + COLLAPSE_S / 2, p );
        expect( p.traveled ).toBeCloseTo( full / 2 );
        expect( p.z ).toBeCloseTo( AHEAD.z );
        expect( shotAt( t, AHEAD, SHOT_LAND_S + COLLAPSE_S, p ) ).toBe( false );
        expect( shotAt( t, AHEAD, -0.01, p ) ).toBe( false );
    } );

    it( 'flies a short flat shot out of the tail for a back mine', () => {
        const back = throwFrom( fresh(), BEHIND, SHIP, 0 );
        const p = pose();
        shotAt( back, BEHIND, BACK_LAND_S / 2, p );
        expect( p.dir ).toBe( -1 );
        expect( p.y ).toBeCloseTo( ( back.fromY + BEHIND.y ) / 2 );
        shotAt( back, BEHIND, BACK_LAND_S, p );
        expect( p.z ).toBeCloseTo( BEHIND.z );
        expect( p.traveled ).toBeLessThan( 8 );
    } );

    it( 'never shows for a mine that skipped its throw', () => {
        const done = throwFrom( fresh(), { ...AHEAD, armed: true }, SHIP, 0 );
        expect( shotAt( done, AHEAD, Number.POSITIVE_INFINITY, pose() ) ).toBe( false );
    } );
} );

describe( 'spikeAt', () => {
    const t = throwFrom( fresh(), AHEAD, SHIP, 0 );

    it( 'shoots straight up from the landing point, then drains upward', () => {
        const p = pose();
        expect( spikeAt( t, AHEAD, SHOT_LAND_S - 0.01, p ) ).toBe( false );
        spikeAt( t, AHEAD, SHOT_LAND_S + SPIKE_RISE_S, p );
        expect( p.y ).toBeCloseTo( AHEAD.y + SPIKE_HEIGHT );
        expect( p.traveled ).toBeCloseTo( SPIKE_HEIGHT );
        expect( p.pitch ).toBeCloseTo( Math.PI / 2 );
        spikeAt( t, AHEAD, SHOT_LAND_S + SPIKE_LIFE_S - 1e-6, p );
        expect( p.traveled ).toBeLessThan( 0.01 );
        expect( spikeAt( t, AHEAD, SHOT_LAND_S + SPIKE_LIFE_S, p ) ).toBe( false );
    } );
} );

describe( 'bodyAt', () => {
    const t = throwFrom( fresh(), AHEAD, SHIP, 0 );

    it( 'hides the mine in flight and shows it squashed and closed on landing', () => {
        expect( bodyAt( t, SHOT_LAND_S - 0.01, body() ).visible ).toBe( false );
        const b = bodyAt( t, SHOT_LAND_S, body() );
        expect( b.visible ).toBe( true );
        expect( b.squash ).toBeLessThan( 1 );
        expect( b.open ).toBe( 0 );
    } );

    it( 'settles, then opens fully by the arm time', () => {
        const settled = bodyAt( t, SETTLE_END_S, body() );
        expect( settled.squash ).toBe( 1 );
        expect( settled.open ).toBe( 0 );
        expect( bodyAt( t, ( SETTLE_END_S + OPEN_END_S ) / 2, body() ).open ).toBeGreaterThan( 0.5 );
        expect( bodyAt( t, OPEN_END_S, body() ).open ).toBe( 1 );
        expect( OPEN_END_S ).toBe( 0.5 );
    } );

    it( 'shows an already-armed mine fully open', () => {
        const done = throwFrom( fresh(), { ...AHEAD, armed: true }, SHIP, 0 );
        expect( bodyAt( done, Number.POSITIVE_INFINITY, body() ) ).toEqual( { visible: true, squash: 1, open: 1 } );
    } );
} );
