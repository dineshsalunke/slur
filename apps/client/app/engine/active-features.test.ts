import {
    boltFeature,
    boostFeature,
    defineSimFeature,
    mineFeature,
    portalFeature,
    seekerFeature,
    shieldFeature,
    tugFeature,
} from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { ACTIVE_FEATURES, checkClientFeatures, FEATURE_SYSTEMS } from './active-features';
import { defineClientFeature } from './define-client-feature';

describe( 'active client features (#385)', () => {
    it( 'ships bolt, boost, mine, portal, seeker, shield and tug, each paired with its sim half, and no feature systems yet', () => {
        const pairs = [
            [ 'bolt', boltFeature ],
            [ 'boost', boostFeature ],
            [ 'mine', mineFeature ],
            [ 'portal', portalFeature ],
            [ 'seeker', seekerFeature ],
            [ 'shield', shieldFeature ],
            [ 'tug', tugFeature ],
        ] as const;
        expect( ACTIVE_FEATURES.map( ( f ) => [ f.id, f.sim ] ) ).toEqual( pairs );
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
