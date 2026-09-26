import { describe, expect, it } from 'vitest';
import {
    createMoveEdges,
    DOUBLE_JUMP_RATE,
    HEAVY_LAND_RATE,
    LAND_GAIN_MIN,
    type MoveTuning,
    passByEdge,
    type ShipFrame,
    stepMoveEdges,
} from './movement-edges';

const TUNING: MoveTuning = { maxCruise: 50, jumpImpulse: 20, heavy: false };

const ship = ( over: Partial< ShipFrame > = {} ): ShipFrame => ( {
    vy: 0,
    vz: 40,
    grounded: true,
    jumpsUsed: 0,
    dead: false,
    ...over,
} );

function primed() {
    const e = createMoveEdges();
    stepMoveEdges( e, ship(), 0, TUNING );
    return e;
}

describe( 'stepMoveEdges', () => {
    it( 'stays silent on the first frame', () => {
        const e = createMoveEdges();
        expect( stepMoveEdges( e, ship( { jumpsUsed: 1, grounded: false } ), 1, TUNING ) ).toEqual( [] );
    } );

    it( 'plays a jump, then a faster double jump', () => {
        const e = primed();
        expect( stepMoveEdges( e, ship( { jumpsUsed: 1, grounded: false, vy: 20 } ), 0, TUNING ) ).toEqual( [
            { sfx: 'jump', rate: 1 },
        ] );
        expect( stepMoveEdges( e, ship( { jumpsUsed: 2, grounded: false, vy: 22 } ), 0, TUNING ) ).toEqual( [
            { sfx: 'jump', rate: DOUBLE_JUMP_RATE },
        ] );
    } );

    it( 'scales the landing by the fall speed', () => {
        const e = primed();
        stepMoveEdges( e, ship( { jumpsUsed: 1, grounded: false, vy: 20 } ), 0, TUNING );
        stepMoveEdges( e, ship( { jumpsUsed: 1, grounded: false, vy: -15 } ), 0, TUNING );
        expect( stepMoveEdges( e, ship( { vy: 0 } ), 0, TUNING ) ).toEqual( [ { sfx: 'land', gain: 0.75, rate: 1 } ] );
    } );

    it( 'clamps a soft landing to the floor gain and lowers a heavy ship', () => {
        const e = primed();
        stepMoveEdges( e, ship( { grounded: false, vy: -1 } ), 0, TUNING );
        expect( stepMoveEdges( e, ship(), 0, { ...TUNING, heavy: true } ) ).toEqual( [
            { sfx: 'land', gain: LAND_GAIN_MIN, rate: HEAVY_LAND_RATE },
        ] );
    } );

    it( 'plays a brake once per press, only at speed', () => {
        const e = primed();
        expect( stepMoveEdges( e, ship(), 1, TUNING ) ).toEqual( [ { sfx: 'brake' } ] );
        expect( stepMoveEdges( e, ship(), 1, TUNING ) ).toEqual( [] );
        stepMoveEdges( e, ship(), 0, TUNING );
        expect( stepMoveEdges( e, ship( { vz: 10 } ), 1, TUNING ) ).toEqual( [] );
    } );

    it( 'stays silent through death and the respawn frame', () => {
        const e = primed();
        stepMoveEdges( e, ship( { grounded: false, vy: -30 } ), 0, TUNING );
        expect( stepMoveEdges( e, ship( { dead: true, grounded: false } ), 0, TUNING ) ).toEqual( [] );
        expect( stepMoveEdges( e, ship(), 0, TUNING ) ).toEqual( [] );
    } );
} );

describe( 'passByEdge', () => {
    it( 'fires once as I close on a ship ahead', () => {
        const st = { armed: true };
        expect( passByEdge( st, { x: 0, z: 0, vz: 60 }, { x: 4, z: 8, vz: 40 } ) ).toBe( true );
        expect( st.armed ).toBe( false );
        expect( passByEdge( st, { x: 0, z: 0, vz: 60 }, { x: 4, z: 7, vz: 40 } ) ).toBe( false );
    } );

    it( 'fires as a ship behind closes on me', () => {
        expect( passByEdge( { armed: true }, { x: 0, z: 0, vz: 40 }, { x: -4, z: -8, vz: 60 } ) ).toBe( true );
    } );

    it( 'ignores ships that are far off, wide or not closing', () => {
        const me = { x: 0, z: 0, vz: 60 };
        expect( passByEdge( { armed: true }, me, { x: 0, z: 30, vz: 40 } ) ).toBe( false );
        expect( passByEdge( { armed: true }, me, { x: 20, z: 5, vz: 40 } ) ).toBe( false );
        expect( passByEdge( { armed: true }, { x: 0, z: 0, vz: 40 }, { x: 0, z: 5, vz: 60 } ) ).toBe( false );
        expect( passByEdge( { armed: true }, { x: 0, z: 0, vz: 42 }, { x: 0, z: 1, vz: 40 } ) ).toBe( false );
    } );

    it( 're-arms only once the ships are apart', () => {
        const st = { armed: false };
        passByEdge( st, { x: 0, z: 0, vz: 60 }, { x: 0, z: -10, vz: 40 } );
        expect( st.armed ).toBe( false );
        passByEdge( st, { x: 0, z: 0, vz: 60 }, { x: 0, z: -25, vz: 40 } );
        expect( st.armed ).toBe( true );
    } );
} );
