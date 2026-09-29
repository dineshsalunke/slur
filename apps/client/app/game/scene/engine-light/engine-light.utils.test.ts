import { describe, expect, it } from 'vitest';
import { exhaustPorts } from '../exhaust-ports';
import { portTailZ } from './engine-light.utils';

describe( 'portTailZ', () => {
    it( 'is the rearmost exhaust port of a ship with ports', () => {
        const ports = exhaustPorts( 'split-crown' ) ?? [];
        expect( ports.length ).toBeGreaterThan( 0 );
        expect( portTailZ( 'split-crown' ) ).toBe( Math.min( ...ports.map( ( p ) => p.z ) ) );
    } );

    it( 'is 0 for a ship without ports', () => {
        expect( portTailZ( 'no-such-ship' ) ).toBe( 0 );
    } );
} );
