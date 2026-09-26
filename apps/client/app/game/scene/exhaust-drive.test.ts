import { DEFAULT_TUNING, SHIP_CLASSES } from '@slur/shared';
import { createWorld } from 'koota';
import { describe, expect, it } from 'vitest';
import { Interp, Net, Sim, type Snapshot } from '../ecs/traits';
import { exhaustDrive } from './exhaust-drive';

const FREIGHTER_CRUISE = SHIP_CLASSES.freighter.tuning.maxCruise;

function snapshot( t: number, z: number ): Snapshot {
    return { t, x: 0, y: 0, z, vx: 0, dead: false, stunned: false, boost: 0 };
}

describe( 'exhaustDrive', () => {
    it( 'scales a local ship by its own cruise, not the default', () => {
        const vz = ( DEFAULT_TUNING.maxCruise + FREIGHTER_CRUISE ) / 2;
        const entity = createWorld().spawn( Sim, Net( { sessionId: 's', shipId: 'split-crown', colorId: 0 } ) );
        entity.set( Sim, ( prev ) => ( { ...prev, vz } ) );
        expect( exhaustDrive( entity ) ).toBeCloseTo( vz / FREIGHTER_CRUISE );
    } );

    it( 'scales a remote ship by its own cruise', () => {
        const entity = createWorld().spawn( Interp, Net( { sessionId: 's', shipId: 'split-crown', colorId: 0 } ) );
        const buffer = entity.get( Interp )?.buffer ?? [];
        buffer.push( snapshot( 0, 0 ), snapshot( 1000, 100 ) );
        expect( exhaustDrive( entity ) ).toBeCloseTo( 100 / FREIGHTER_CRUISE );
    } );

    it( 'falls back to the default cruise without a ship id', () => {
        const entity = createWorld().spawn( Sim );
        entity.set( Sim, ( prev ) => ( { ...prev, vz: DEFAULT_TUNING.maxCruise / 2 } ) );
        expect( exhaustDrive( entity ) ).toBeCloseTo( 0.5 );
    } );
} );
