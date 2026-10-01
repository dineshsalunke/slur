import { boltFeature, defineSimFeature, seekerFeature, tugFeature } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { ACTIVE_FEATURES, checkClientFeatures, FEATURE_SYSTEMS } from './active-features';
import { defineClientFeature } from './define-client-feature';

describe( 'active client features (#385)', () => {
    it( 'ships bolt, seeker and tug, each paired with its sim half, and no feature systems yet', () => {
        expect( ACTIVE_FEATURES.map( ( f ) => f.id ) ).toEqual( [ 'bolt', 'seeker', 'tug' ] );
        expect( ACTIVE_FEATURES[ 0 ]?.sim ).toBe( boltFeature );
        expect( ACTIVE_FEATURES[ 1 ]?.sim ).toBe( seekerFeature );
        expect( ACTIVE_FEATURES[ 2 ]?.sim ).toBe( tugFeature );
        expect( FEATURE_SYSTEMS ).toEqual( [] );
    } );

    it( 'sorts by id and throws on a duplicate id', () => {
        const b = defineClientFeature( { id: 'b' } );
        const a = defineClientFeature( { id: 'a' } );
        expect( checkClientFeatures( [ b, a ], [] ).map( ( f ) => f.id ) ).toEqual( [ 'a', 'b' ] );
        expect( () => checkClientFeatures( [ a, a ], [] ) ).toThrow( 'duplicate id "a"' );
    } );

    it( 'throws when a sim half is not in the sim registry', () => {
        const sim = defineSimFeature( { id: 'tug' } );
        const client = defineClientFeature( { id: 'tug', sim } );
        expect( checkClientFeatures( [ client ], [ sim ] ) ).toEqual( [ client ] );
        expect( () => checkClientFeatures( [ client ], [] ) ).toThrow( 'sim half "tug" is not in SIM_FEATURES' );
    } );
} );
