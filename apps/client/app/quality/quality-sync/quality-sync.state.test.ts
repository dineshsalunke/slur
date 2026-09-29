import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PROFILES, type QualityProfile } from '../quality.constants';

const live = vi.hoisted( () => ( { tier: 'high' as 'low' | 'medium' | 'high' } ) );

vi.mock( '../quality.state', () => ( { qualityProfile: () => PROFILES[ live.tier ] } ) );

const { registerQualityHook, syncQuality } = await import( './quality-sync.state' );

function recorder() {
    const seen: QualityProfile[] = [];
    return { seen, apply: ( profile: QualityProfile ) => void seen.push( profile ) };
}

describe( 'quality sync', () => {
    beforeEach( () => {
        live.tier = 'high';
        syncQuality();
    } );

    it( 'applies the current profile on register and not again while the tier holds', () => {
        const { seen, apply } = recorder();
        const release = registerQualityHook( apply );
        for ( let frame = 0; frame < 5; frame++ ) syncQuality();
        expect( seen ).toEqual( [ PROFILES.high ] );
        release();
    } );

    it( 'applies each hook once per tier change, and a second runner in the same frame applies nothing', () => {
        const a = recorder();
        const b = recorder();
        const releaseA = registerQualityHook( a.apply );
        const releaseB = registerQualityHook( b.apply );
        live.tier = 'low';
        syncQuality();
        syncQuality();
        expect( [ a.seen, b.seen ] ).toEqual( [
            [ PROFILES.high, PROFILES.low ],
            [ PROFILES.high, PROFILES.low ],
        ] );
        releaseA();
        releaseB();
    } );

    it( 'stops applying a released hook', () => {
        const { seen, apply } = recorder();
        registerQualityHook( apply )();
        live.tier = 'medium';
        syncQuality();
        expect( seen ).toEqual( [ PROFILES.high ] );
    } );
} );
